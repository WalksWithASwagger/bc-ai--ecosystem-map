#!/usr/bin/env node
/**
 * Validate database quality - check for invalid URLs, suspicious data, and placeholders
 * Usage: node validate-database-quality.js
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

// Helper to extract property values
function getPropertyValue(page, propName) {
  const prop = page.properties[propName];
  if (!prop) return null;

  switch (prop.type) {
    case 'title':
      return prop.title.length > 0 ? prop.title[0].plain_text : null;
    case 'rich_text':
      return prop.rich_text.length > 0 ? prop.rich_text[0].plain_text : null;
    case 'url':
      return prop.url || null;
    case 'email':
      return prop.email || null;
    case 'phone_number':
      return prop.phone_number || null;
    case 'number':
      return prop.number;
    case 'select':
      return prop.select ? prop.select.name : null;
    default:
      return null;
  }
}

// Check if URL is suspicious (placeholder, auto-generated, etc.)
function isSuspiciousUrl(url) {
  if (!url) return false;
  
  const suspiciousPatterns = [
    /example\.com/i,
    /placeholder/i,
    /yourdomain/i,
    /your-?company/i,
    /companyname/i,
    /^https?:\/\/[a-z]+\.com$/i, // Single word domains like https://company.com
    /test\.com/i,
    /demo\.com/i,
    /sample\.com/i,
    /localhost/i,
    /127\.0\.0\.1/i,
    /\[.*\]/i, // URLs with brackets
    /\{.*\}/i, // URLs with braces
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(url));
}

// Check if email is suspicious
function isSuspiciousEmail(email) {
  if (!email) return false;
  
  const suspiciousPatterns = [
    /example\.com$/i,
    /test@/i,
    /demo@/i,
    /sample@/i,
    /placeholder/i,
    /your.*email/i,
    /noreply@/i,
    /donotreply@/i,
    /^info@[a-z]+\.com$/i, // Generic info@ with single word domain
    /^contact@[a-z]+\.com$/i, // Generic contact@ with single word domain
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(email));
}

// Check if company name is suspicious
function isSuspiciousName(name) {
  if (!name) return false;
  
  const suspiciousPatterns = [
    /^test/i,
    /^demo/i,
    /^sample/i,
    /placeholder/i,
    /\[.*\]/,
    /\{.*\}/,
    /^Company\s*\d*$/i, // "Company", "Company 1", etc.
    /^Organization\s*\d*$/i,
    /^Business\s*\d*$/i,
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(name));
}

// Validate URL by checking if it exists
async function validateUrl(url) {
  try {
    const response = await axios.head(url, {
      timeout: 5000,
      maxRedirects: 5,
      validateStatus: status => status < 400,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BC-AI-Validator/1.0)'
      }
    });
    return { valid: true, status: response.status };
  } catch (error) {
    if (error.response) {
      return { valid: false, status: error.response.status, error: `HTTP ${error.response.status}` };
    } else if (error.code === 'ENOTFOUND') {
      return { valid: false, error: 'Domain not found' };
    } else if (error.code === 'ETIMEDOUT') {
      return { valid: false, error: 'Timeout' };
    } else {
      return { valid: false, error: error.message };
    }
  }
}

async function validateDatabase() {
  console.log('🔍 Validating BC AI Ecosystem Database Quality...\n');
  
  // Fetch all organizations
  const organizations = [];
  let cursor;
  
  console.log('Fetching organizations...');
  do {
    const response = await notion.databases.query({
      database_id: dbId,
      start_cursor: cursor,
      page_size: 100
    });
    
    organizations.push(...response.results);
    cursor = response.has_more ? response.next_cursor : null;
    console.log(`Fetched ${organizations.length} organizations so far...`);
  } while (cursor);
  
  console.log(`Total: ${organizations.length} organizations\n`);
  
  const issues = {
    suspiciousUrls: [],
    invalidUrls: [],
    suspiciousEmails: [],
    suspiciousNames: [],
    missingCriticalData: [],
    placeholderData: [],
    totalIssues: 0
  };
  
  // Check each organization
  console.log('Validating data quality...\n');
  
  for (const org of organizations) {
    const name = getPropertyValue(org, 'Name');
    const website = getPropertyValue(org, 'Website');
    const linkedin = getPropertyValue(org, 'LinkedIn');
    const email = getPropertyValue(org, 'Email');
    const category = getPropertyValue(org, 'Category');
    
    const orgIssues = [];
    
    // Check for suspicious name
    if (isSuspiciousName(name)) {
      orgIssues.push('Suspicious organization name');
      issues.suspiciousNames.push({
        name,
        pageId: org.id,
        issue: 'Name appears to be placeholder or test data'
      });
    }
    
    // Check website
    if (website) {
      if (isSuspiciousUrl(website)) {
        orgIssues.push('Suspicious website URL');
        issues.suspiciousUrls.push({
          name,
          url: website,
          pageId: org.id,
          type: 'website'
        });
      } else {
        // Validate URL exists
        process.stdout.write(`Checking ${name} website... `);
        const validation = await validateUrl(website);
        if (!validation.valid) {
          process.stdout.write(`❌ ${validation.error}\n`);
          orgIssues.push(`Invalid website: ${validation.error}`);
          issues.invalidUrls.push({
            name,
            url: website,
            pageId: org.id,
            type: 'website',
            error: validation.error
          });
        } else {
          process.stdout.write('✅\n');
        }
      }
    }
    
    // Check LinkedIn
    if (linkedin && isSuspiciousUrl(linkedin)) {
      orgIssues.push('Suspicious LinkedIn URL');
      issues.suspiciousUrls.push({
        name,
        url: linkedin,
        pageId: org.id,
        type: 'linkedin'
      });
    }
    
    // Check email
    if (email && isSuspiciousEmail(email)) {
      orgIssues.push('Suspicious email address');
      issues.suspiciousEmails.push({
        name,
        email,
        pageId: org.id
      });
    }
    
    // Check for missing critical data
    const missingFields = [];
    if (!category) missingFields.push('Category');
    if (!website && !linkedin) missingFields.push('No website or LinkedIn');
    
    if (missingFields.length > 0) {
      orgIssues.push(`Missing: ${missingFields.join(', ')}`);
      issues.missingCriticalData.push({
        name,
        pageId: org.id,
        missing: missingFields
      });
    }
    
    // Log issues for this org
    if (orgIssues.length > 0) {
      console.log(`\n⚠️  ${name}:`);
      orgIssues.forEach(issue => console.log(`   - ${issue}`));
      issues.totalIssues += orgIssues.length;
    }
  }
  
  // Generate report
  const timestamp = new Date().toISOString().split('T')[0];
  const reportPath = path.join(__dirname, 'reports', `${timestamp}_database-quality-audit.md`);
  
  let report = `# BC AI Ecosystem Database Quality Audit

*Generated on ${new Date().toLocaleString()}*

## Summary

- **Total Organizations**: ${organizations.length}
- **Total Issues Found**: ${issues.totalIssues}
- **Suspicious URLs**: ${issues.suspiciousUrls.length}
- **Invalid URLs**: ${issues.invalidUrls.length}
- **Suspicious Emails**: ${issues.suspiciousEmails.length}
- **Suspicious Names**: ${issues.suspiciousNames.length}
- **Missing Critical Data**: ${issues.missingCriticalData.length}

## Detailed Findings

### 🚨 Suspicious URLs (${issues.suspiciousUrls.length})

These URLs appear to be placeholders or auto-generated:

${issues.suspiciousUrls.map(item => 
  `- **${item.name}** - ${item.type}: \`${item.url}\` [Edit](https://www.notion.so/${item.pageId})`
).join('\n')}

### ❌ Invalid URLs (${issues.invalidUrls.length})

These URLs are not accessible or return errors:

${issues.invalidUrls.map(item => 
  `- **${item.name}** - ${item.type}: \`${item.url}\` (${item.error}) [Edit](https://www.notion.so/${item.pageId})`
).join('\n')}

### 📧 Suspicious Emails (${issues.suspiciousEmails.length})

${issues.suspiciousEmails.map(item => 
  `- **${item.name}**: \`${item.email}\` [Edit](https://www.notion.so/${item.pageId})`
).join('\n')}

### 🏷️ Suspicious Organization Names (${issues.suspiciousNames.length})

${issues.suspiciousNames.map(item => 
  `- **${item.name}**: ${item.issue} [Edit](https://www.notion.so/${item.pageId})`
).join('\n')}

### 📋 Missing Critical Data (${issues.missingCriticalData.length})

${issues.missingCriticalData.map(item => 
  `- **${item.name}**: Missing ${item.missing.join(', ')} [Edit](https://www.notion.so/${item.pageId})`
).join('\n')}

## Recommendations

1. **Remove or update all suspicious URLs** - These appear to be auto-generated or placeholders
2. **Verify and fix invalid URLs** - Check if companies have new websites or have shut down
3. **Replace suspicious email addresses** with real contact information
4. **Review suspicious organization names** - May be test data that should be removed
5. **Fill in missing critical data** - Especially categories and contact information

## Action Items

- [ ] Review and fix all suspicious URLs
- [ ] Validate or remove invalid URLs
- [ ] Update placeholder email addresses
- [ ] Verify suspicious organization names
- [ ] Add missing categories
- [ ] Run contact enhancement tools on organizations missing websites
`;
  
  // Ensure reports directory exists
  if (!fs.existsSync(path.dirname(reportPath))) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  }
  
  fs.writeFileSync(reportPath, report);
  console.log(`\n\n✅ Validation complete!`);
  console.log(`📄 Report written to: ${reportPath}`);
  
  // Also save JSON for programmatic use
  const jsonPath = reportPath.replace('.md', '.json');
  fs.writeFileSync(jsonPath, JSON.stringify(issues, null, 2));
  console.log(`📄 JSON data written to: ${jsonPath}`);
}

// Run validation
validateDatabase().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});