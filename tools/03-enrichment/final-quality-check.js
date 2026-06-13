#!/usr/bin/env node
/**
 * Final quality check to ensure database accuracy
 * Checks for:
 * - Any remaining suspicious URLs
 * - Invalid URL patterns
 * - Duplicate organizations
 * - Data consistency
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');
const axios = require('axios');
require('dotenv').config();

// Try to load configuration
let config = {};
try {
  config = require('./config');
} catch (e) {
  // Config file doesn't exist, will use environment variables
}

// Get Notion credentials
const notionToken = config.NOTION_TOKEN || process.env.NOTION_TOKEN;
const dbId = config.NOTION_DATABASE_ID || process.env.NOTION_DATABASE_ID;

if (!notionToken || !dbId) {
  console.error('Notion token and database ID are required.');
  process.exit(1);
}

const notion = new Client({ auth: notionToken });

// Suspicious patterns to check
const suspiciousPatterns = [
  /example\.com/i,
  /test\.com/i,
  /demo\.com/i,
  /placeholder/i,
  /coming-?soon/i,
  /under-?construction/i,
  /localhost/i,
  /127\.0\.0\.1/,
  /\[company-?name\]/i,
  /\{company\}/i,
  /dummy/i,
  /fake/i,
  /sample/i
];

// Known invalid domains
const invalidDomains = [
  'example.com',
  'test.com',
  'demo.com',
  'google.com/search',
  'linkedin.com/company/company-name'
];

async function fetchAllOrganizations() {
  console.log('🔍 Fetching all organizations for quality check...\n');
  
  const organizations = [];
  let hasMore = true;
  let startCursor = undefined;
  
  while (hasMore) {
    const response = await notion.databases.query({
      database_id: dbId,
      page_size: 100,
      start_cursor: startCursor
    });
    
    organizations.push(...response.results);
    hasMore = response.has_more;
    startCursor = response.next_cursor;
    
    process.stdout.write(`\rFetched ${organizations.length} organizations...`);
  }
  
  console.log('\n');
  return organizations;
}

function checkSuspiciousUrl(url) {
  if (!url) return null;
  
  // Check against suspicious patterns
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url)) {
      return `Matches suspicious pattern: ${pattern}`;
    }
  }
  
  // Check against known invalid domains
  for (const domain of invalidDomains) {
    if (url.includes(domain)) {
      return `Contains invalid domain: ${domain}`;
    }
  }
  
  // Check for URLs that are too generic
  if (url === 'https://www.google.com' || url === 'https://google.com') {
    return 'Generic search engine URL';
  }
  
  return null;
}

async function verifyUrl(url) {
  try {
    const response = await axios.get(url, {
      timeout: 5000,
      maxRedirects: 5,
      validateStatus: status => status < 400,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error.response?.status || error.code || error.message 
    };
  }
}

async function performQualityCheck() {
  const organizations = await fetchAllOrganizations();
  console.log(`Total organizations in database: ${organizations.length}\n`);
  
  const issues = {
    suspiciousUrls: [],
    duplicateNames: {},
    invalidEmails: [],
    invalidPhones: [],
    dataInconsistencies: []
  };
  
  const nameCount = {};
  
  // Check each organization
  for (const org of organizations) {
    const name = org.properties.Name?.title[0]?.plain_text || 'Unknown';
    const website = org.properties.Website?.url;
    const linkedin = org.properties.LinkedIn?.url;
    const email = org.properties.Email?.email;
    const phone = org.properties.Phone?.phone_number;
    
    // Count names for duplicate detection
    nameCount[name] = (nameCount[name] || 0) + 1;
    
    // Check website URL
    if (website) {
      const suspiciousReason = checkSuspiciousUrl(website);
      if (suspiciousReason) {
        issues.suspiciousUrls.push({
          name,
          url: website,
          type: 'website',
          reason: suspiciousReason,
          pageId: org.id
        });
      }
    }
    
    // Check LinkedIn URL
    if (linkedin) {
      const suspiciousReason = checkSuspiciousUrl(linkedin);
      if (suspiciousReason) {
        issues.suspiciousUrls.push({
          name,
          url: linkedin,
          type: 'linkedin',
          reason: suspiciousReason,
          pageId: org.id
        });
      }
      
      // LinkedIn specific checks
      if (!linkedin.includes('linkedin.com')) {
        issues.suspiciousUrls.push({
          name,
          url: linkedin,
          type: 'linkedin',
          reason: 'Not a LinkedIn URL',
          pageId: org.id
        });
      }
    }
    
    // Check email format
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        issues.invalidEmails.push({
          name,
          email,
          pageId: org.id
        });
      }
    }
    
    // Check phone format
    if (phone) {
      const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
      if (!phoneRegex.test(phone) || phone.length < 10) {
        issues.invalidPhones.push({
          name,
          phone,
          pageId: org.id
        });
      }
    }
  }
  
  // Identify duplicates
  Object.entries(nameCount).forEach(([name, count]) => {
    if (count > 1) {
      issues.duplicateNames[name] = count;
    }
  });
  
  // Display results
  console.log('='.repeat(60));
  console.log('\n📊 QUALITY CHECK RESULTS\n');
  
  console.log(`✅ Total Organizations: ${organizations.length}`);
  console.log(`⚠️  Suspicious URLs: ${issues.suspiciousUrls.length}`);
  console.log(`⚠️  Duplicate Names: ${Object.keys(issues.duplicateNames).length}`);
  console.log(`⚠️  Invalid Emails: ${issues.invalidEmails.length}`);
  console.log(`⚠️  Invalid Phones: ${issues.invalidPhones.length}`);
  
  if (issues.suspiciousUrls.length > 0) {
    console.log('\n❗ SUSPICIOUS URLS FOUND:');
    issues.suspiciousUrls.forEach(item => {
      console.log(`   ${item.name}: ${item.url}`);
      console.log(`   Reason: ${item.reason}`);
      console.log(`   Type: ${item.type}`);
      console.log('');
    });
  }
  
  if (Object.keys(issues.duplicateNames).length > 0) {
    console.log('\n❗ DUPLICATE NAMES FOUND:');
    Object.entries(issues.duplicateNames).forEach(([name, count]) => {
      console.log(`   "${name}" appears ${count} times`);
    });
  }
  
  if (issues.invalidEmails.length > 0) {
    console.log('\n❗ INVALID EMAILS FOUND:');
    issues.invalidEmails.forEach(item => {
      console.log(`   ${item.name}: ${item.email}`);
    });
  }
  
  if (issues.invalidPhones.length > 0) {
    console.log('\n❗ INVALID PHONES FOUND:');
    issues.invalidPhones.forEach(item => {
      console.log(`   ${item.name}: ${item.phone}`);
    });
  }
  
  // Generate detailed report
  const timestamp = new Date().toISOString().split('T')[0];
  const reportPath = path.join(__dirname, '..', 'reports', `${timestamp}_final-quality-check.json`);
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalOrganizations: organizations.length,
      suspiciousUrls: issues.suspiciousUrls.length,
      duplicateNames: Object.keys(issues.duplicateNames).length,
      invalidEmails: issues.invalidEmails.length,
      invalidPhones: issues.invalidPhones.length
    },
    issues
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  // Final verdict
  console.log('\n' + '='.repeat(60));
  if (issues.suspiciousUrls.length === 0 && 
      Object.keys(issues.duplicateNames).length === 0 &&
      issues.invalidEmails.length === 0 &&
      issues.invalidPhones.length === 0) {
    console.log('\n✅ DATABASE QUALITY CHECK PASSED!');
    console.log('   No suspicious or invalid data found.');
    console.log('   Database is clean and ready for continued research.');
  } else {
    console.log('\n⚠️  QUALITY ISSUES DETECTED');
    console.log('   Please review the issues above before proceeding.');
  }
}

// Run the check
performQualityCheck().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});