#!/usr/bin/env node
/**
 * Remove suspicious placeholder URLs from the database
 * This script will remove URLs that appear to be auto-generated or placeholders
 * Usage: node remove-suspicious-urls.js [--dry-run]
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');
require('dotenv').config();

// Try to load configuration
let config = {};
try {
  config = require('./config');
} catch (e) {
  // Config file doesn't exist, will use environment variables
}

// Parse arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

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
    case 'url':
      return prop.url || null;
    default:
      return null;
  }
}

// Check if URL is suspicious (placeholder, auto-generated, etc.)
function isSuspiciousUrl(url, orgName) {
  if (!url) return false;
  
  // Extract domain from URL
  let domain;
  try {
    const urlObj = new URL(url);
    domain = urlObj.hostname.replace('www.', '');
  } catch (e) {
    return true; // Invalid URL format
  }
  
  // Known legitimate domains to exclude
  const legitimateDomains = [
    'microsoft.com', 'cisco.com', 'telus.com', 'absolute.com', 'planview.com',
    'linkedin.com', 'facebook.com', 'twitter.com', 'github.com', 'youtube.com',
    'google.com', 'amazon.com', 'apple.com', 'ibm.com', 'oracle.com',
    'salesforce.com', 'adobe.com', 'intel.com', 'nvidia.com', 'meta.com'
  ];
  
  // Check if it's a subdomain of a legitimate domain
  for (const legit of legitimateDomains) {
    if (domain === legit || domain.endsWith('.' + legit)) {
      return false;
    }
  }
  
  // Create a slug from organization name for comparison
  const orgSlug = orgName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  
  // Get domain without TLD
  const domainParts = domain.split('.');
  const domainWithoutTLD = domainParts[0];
  
  // Exact match patterns that are highly suspicious
  const exactMatchSuspicious = [
    // Domain exactly matches org name slug (with some exceptions)
    domainWithoutTLD === orgSlug && domainParts.length === 2 && domainParts[1] === 'com',
    // Very short single word .com domains (likely placeholders)
    /^[a-z]{3,12}\.com$/.test(domain) && domainWithoutTLD === orgSlug.substring(0, domainWithoutTLD.length),
  ];
  
  // Generic placeholder patterns
  const placeholderPatterns = [
    /example\.com/i,
    /placeholder/i,
    /yourdomain/i,
    /test\.com/i,
    /demo\.com/i,
    /sample\.com/i,
    /yourcompany/i,
    /companyname/i,
  ];
  
  // Check exact matches first
  if (exactMatchSuspicious.some(condition => condition === true)) {
    // Additional checks for likely real companies
    const likelyRealPatterns = [
      /^(app|get|use|try|my|the|go|be|ai|io)/i, // Common prefixes for real startups
      /\d/, // Contains numbers
      /-/, // Contains hyphens
      /[A-Z]/, // Contains capitals in original URL
    ];
    
    // If none of the "likely real" patterns match, it's suspicious
    if (!likelyRealPatterns.some(pattern => pattern.test(url))) {
      return true;
    }
  }
  
  // Check placeholder patterns
  return placeholderPatterns.some(pattern => pattern.test(domain));
}

async function removeSuspiciousUrls() {
  console.log('🔍 Finding organizations with suspicious URLs...\n');
  
  if (dryRun) {
    console.log('🔒 DRY RUN MODE - No changes will be made\n');
  }
  
  // Fetch all organizations
  const organizations = [];
  let cursor;
  
  do {
    const response = await notion.databases.query({
      database_id: dbId,
      start_cursor: cursor,
      page_size: 100
    });
    
    organizations.push(...response.results);
    cursor = response.has_more ? response.next_cursor : null;
  } while (cursor);
  
  console.log(`Total organizations: ${organizations.length}\n`);
  
  const results = {
    websitesRemoved: [],
    linkedInRemoved: [],
    totalRemoved: 0,
    errors: []
  };
  
  // Process each organization
  for (const org of organizations) {
    const name = getPropertyValue(org, 'Name');
    const website = getPropertyValue(org, 'Website');
    const linkedin = getPropertyValue(org, 'LinkedIn');
    
    const updates = {};
    
    // Check website
    if (website && isSuspiciousUrl(website, name)) {
      console.log(`⚠️  Suspicious website for ${name}: ${website}`);
      updates.Website = { url: null };
      results.websitesRemoved.push({ name, url: website, pageId: org.id });
    }
    
    // Check LinkedIn
    if (linkedin && isSuspiciousUrl(linkedin, name)) {
      console.log(`⚠️  Suspicious LinkedIn for ${name}: ${linkedin}`);
      updates.LinkedIn = { url: null };
      results.linkedInRemoved.push({ name, url: linkedin, pageId: org.id });
    }
    
    // Update if needed
    if (Object.keys(updates).length > 0 && !dryRun) {
      try {
        await notion.pages.update({
          page_id: org.id,
          properties: updates
        });
        console.log(`   ✅ Removed suspicious URLs from ${name}`);
        results.totalRemoved += Object.keys(updates).length;
      } catch (error) {
        console.error(`   ❌ Error updating ${name}: ${error.message}`);
        results.errors.push({ name, error: error.message });
      }
    } else if (Object.keys(updates).length > 0 && dryRun) {
      console.log(`   [DRY RUN] Would remove URLs from ${name}`);
      results.totalRemoved += Object.keys(updates).length;
    }
  }
  
  // Generate report
  const timestamp = new Date().toISOString().split('T')[0];
  const reportPath = path.join(__dirname, 'reports', `${timestamp}_suspicious-urls-removed.md`);
  
  let report = `# Suspicious URLs Removal Report

*Generated on ${new Date().toLocaleString()}*
*Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}*

## Summary

- **Total URLs Removed**: ${results.totalRemoved}
- **Websites Removed**: ${results.websitesRemoved.length}
- **LinkedIn URLs Removed**: ${results.linkedInRemoved.length}
- **Errors**: ${results.errors.length}

## Websites Removed (${results.websitesRemoved.length})

${results.websitesRemoved.map(item => 
  `- **${item.name}**: \`${item.url}\` [View](https://www.notion.so/${item.pageId})`
).join('\n')}

## LinkedIn URLs Removed (${results.linkedInRemoved.length})

${results.linkedInRemoved.map(item => 
  `- **${item.name}**: \`${item.url}\` [View](https://www.notion.so/${item.pageId})`
).join('\n')}

## Errors (${results.errors.length})

${results.errors.map(item => 
  `- **${item.name}**: ${item.error}`
).join('\n')}

## Next Steps

1. Review organizations that now have no web presence
2. Research and add real, verified URLs
3. Use the contact enhancement tools to find legitimate websites
`;
  
  // Ensure reports directory exists
  if (!fs.existsSync(path.dirname(reportPath))) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  }
  
  fs.writeFileSync(reportPath, report);
  console.log(`\n✅ Complete!`);
  console.log(`📄 Report written to: ${reportPath}`);
  
  if (dryRun) {
    console.log('\n💡 To remove these URLs for real, run without --dry-run flag');
  }
}

// Run the script
removeSuspiciousUrls().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});