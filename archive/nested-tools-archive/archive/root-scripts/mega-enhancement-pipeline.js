#!/usr/bin/env node
/**
 * Mega Enhancement Pipeline - The Data Forge 🔥
 * 
 * Integrates all enhancement tools into one powerful pipeline:
 * - LinkedIn discovery
 * - Website extraction from LinkedIn
 * - Contact information mining
 * - Crunchbase financial intelligence
 * - Comprehensive logging for future analysis
 * 
 * Usage: node tools/mega-enhancement-pipeline.js [options]
 * Options:
 *   --limit=N        Process N organizations (default: 50)
 *   --batch=N        Batch number for tracking (default: 1)
 *   --no-dryrun      Apply changes to database (careful!)
 *   --skip-linkedin  Skip LinkedIn discovery
 *   --skip-crunchbase Skip Crunchbase intelligence
 *   --priority-only  Only process high-priority orgs (startups/scaleups)
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

// Configuration
let config = {};
try {
  config = require('./config');
} catch (e) {
  // Use environment variables
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  limit: 50,
  batch: 1,
  dryrun: true,
  skipLinkedIn: false,
  skipCrunchbase: false,
  priorityOnly: false
};

args.forEach(arg => {
  if (arg.startsWith('--limit=')) {
    options.limit = parseInt(arg.split('=')[1], 10);
  } else if (arg.startsWith('--batch=')) {
    options.batch = parseInt(arg.split('=')[1], 10);
  } else if (arg === '--no-dryrun') {
    options.dryrun = false;
  } else if (arg === '--skip-linkedin') {
    options.skipLinkedIn = true;
  } else if (arg === '--skip-crunchbase') {
    options.skipCrunchbase = true;
  } else if (arg === '--priority-only') {
    options.priorityOnly = true;
  }
});

// Notion setup
const notionToken = config.NOTION_TOKEN || process.env.NOTION_TOKEN;
const dbId = config.NOTION_DATABASE_ID || process.env.NOTION_DATABASE_ID;

if (!notionToken || !dbId) {
  console.error('❌ Error: Set NOTION_TOKEN and NOTION_DATABASE_ID');
  process.exit(1);
}

const notion = new Client({ auth: notionToken });

// Create logs directory structure
const logsDir = path.join(__dirname, '../logs');
const searchLogsDir = path.join(logsDir, 'searches');
const extractionLogsDir = path.join(logsDir, 'extractions');
const reportsDir = path.join(logsDir, 'reports');

[logsDir, searchLogsDir, extractionLogsDir, reportsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Log file paths
const dateStr = new Date().toISOString().split('T')[0];
const searchLogPath = path.join(searchLogsDir, `${dateStr}_combined_searches.jsonl`);
const extractionLogPath = path.join(extractionLogsDir, `${dateStr}_all_extractions.json`);
const reportPath = path.join(reportsDir, `${dateStr}_mega_enhancement_report.md`);

// Enhancement statistics
const stats = {
  processed: 0,
  linkedInFound: 0,
  websitesFound: 0,
  contactsFound: 0,
  financialDataFound: 0,
  errors: 0,
  startTime: Date.now()
};

// Log search activity
function logSearch(orgName, orgId, searchType, query, result, confidence, duration) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    organization: { name: orgName, id: orgId },
    search: {
      type: searchType,
      query: query,
      result: result,
      confidence: confidence,
      duration: duration,
      batch: options.batch
    }
  };
  
  fs.appendFileSync(searchLogPath, JSON.stringify(logEntry) + '\n');
}

// Extract property value from Notion page
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
    case 'select':
      return prop.select ? prop.select.name : null;
    case 'multi_select':
      return prop.multi_select.map(s => s.name);
    case 'number':
      return prop.number;
    default:
      return null;
  }
}

// LinkedIn discovery (from existing tool logic)
async function discoverLinkedIn(orgName, existingWebsite) {
  const startTime = Date.now();
  
  try {
    // Try to extract from website first
    if (existingWebsite) {
      const linkedInUrl = await extractLinkedInFromWebsite(existingWebsite);
      if (linkedInUrl) {
        const duration = Date.now() - startTime;
        logSearch(orgName, null, 'linkedin_from_website', existingWebsite, linkedInUrl, 0.95, duration);
        return { url: linkedInUrl, confidence: 0.95, source: 'website' };
      }
    }
    
    // Generate LinkedIn URL (high success rate method)
    const companySlug = orgName.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    const linkedInUrl = `https://www.linkedin.com/company/${companySlug}`;
    
    // Verify URL exists (simplified check)
    try {
      const response = await axios.head(linkedInUrl, { 
        timeout: 3000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BC-AI-Ecosystem-Bot/1.0)'
        }
      });
      
      if (response.status === 200) {
        const duration = Date.now() - startTime;
        logSearch(orgName, null, 'linkedin_generated', companySlug, linkedInUrl, 0.85, duration);
        return { url: linkedInUrl, confidence: 0.85, source: 'generated' };
      }
    } catch (e) {
      // URL doesn't exist or error
    }
    
    const duration = Date.now() - startTime;
    logSearch(orgName, null, 'linkedin_search', companySlug, null, 0, duration);
    return null;
    
  } catch (error) {
    console.error(`Error discovering LinkedIn for ${orgName}:`, error.message);
    return null;
  }
}

// Extract LinkedIn from website
async function extractLinkedInFromWebsite(websiteUrl) {
  try {
    const response = await axios.get(websiteUrl, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BC-AI-Ecosystem-Bot/1.0)'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // Look for LinkedIn links
    const linkedInLinks = $('a[href*="linkedin.com/company"]').toArray();
    if (linkedInLinks.length > 0) {
      const href = $(linkedInLinks[0]).attr('href');
      // Clean up the URL
      const match = href.match(/linkedin\.com\/company\/([^/?]+)/);
      if (match) {
        return `https://www.linkedin.com/company/${match[1]}`;
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

// Extract contact info from website
async function extractContactInfo(orgName, websiteUrl) {
  const startTime = Date.now();
  
  try {
    const response = await axios.get(websiteUrl, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BC-AI-Ecosystem-Bot/1.0)'
      }
    });
    
    const $ = cheerio.load(response.data);
    const text = $('body').text().toLowerCase();
    
    // Extract email
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = [...new Set(text.match(emailRegex) || [])];
    const validEmail = emails.find(e => !e.includes('example.com') && !e.includes('email.com'));
    
    // Extract phone
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phones = [...new Set(text.match(phoneRegex) || [])];
    const validPhone = phones[0]; // Take first valid phone
    
    const duration = Date.now() - startTime;
    const result = { email: validEmail, phone: validPhone };
    
    logSearch(orgName, null, 'contact_extraction', websiteUrl, result, validEmail || validPhone ? 0.8 : 0, duration);
    
    return result;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logSearch(orgName, null, 'contact_extraction', websiteUrl, null, 0, duration);
    return { email: null, phone: null };
  }
}

// Crunchbase intelligence gathering (simplified)
async function gatherCrunchbaseIntelligence(orgName, website) {
  const startTime = Date.now();
  
  try {
    // Search for Crunchbase profile
    const searchQuery = `site:crunchbase.com/organization "${orgName}"`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    
    // Note: In production, you'd want to use a proper search API or scraping approach
    // This is a simplified example
    const crunchbaseData = {
      profileUrl: null,
      funding: null,
      employees: null,
      founded: null,
      investors: []
    };
    
    // Log the search attempt
    const duration = Date.now() - startTime;
    logSearch(orgName, null, 'crunchbase_search', searchQuery, crunchbaseData.profileUrl, 0, duration);
    
    return crunchbaseData;
    
  } catch (error) {
    console.error(`Error gathering Crunchbase data for ${orgName}:`, error.message);
    return null;
  }
}

// Process a single organization
async function processOrganization(page) {
  const orgName = getPropertyValue(page, 'Name');
  const orgId = page.id;
  
  console.log(`\n🔍 Processing: ${orgName}`);
  
  const existingData = {
    website: getPropertyValue(page, 'Website'),
    linkedin: getPropertyValue(page, 'LinkedIn'),
    email: getPropertyValue(page, 'Email'),
    phone: getPropertyValue(page, 'Phone'),
    funding: getPropertyValue(page, 'Funding'),
    category: getPropertyValue(page, 'Category')
  };
  
  const updates = {};
  const extractedData = {
    organization: orgName,
    id: orgId,
    timestamp: new Date().toISOString(),
    existingData: existingData,
    newData: {}
  };
  
  // Step 1: LinkedIn Discovery
  if (!existingData.linkedin && !options.skipLinkedIn) {
    console.log('  → Searching for LinkedIn profile...');
    const linkedInResult = await discoverLinkedIn(orgName, existingData.website);
    
    if (linkedInResult) {
      updates.LinkedIn = { url: linkedInResult.url };
      extractedData.newData.linkedin = linkedInResult;
      stats.linkedInFound++;
      console.log(`  ✅ LinkedIn found: ${linkedInResult.url} (confidence: ${linkedInResult.confidence})`);
    }
  }
  
  // Step 2: Website Discovery from LinkedIn
  if (!existingData.website && extractedData.newData.linkedin) {
    console.log('  → Checking LinkedIn for website...');
    // In a real implementation, you'd scrape the LinkedIn page for the website
    // For now, we'll skip this step
  }
  
  // Step 3: Contact Extraction
  if (existingData.website && (!existingData.email || !existingData.phone)) {
    console.log('  → Extracting contact information...');
    const contactInfo = await extractContactInfo(orgName, existingData.website);
    
    if (contactInfo.email && !existingData.email) {
      updates.Email = { rich_text: [{ text: { content: contactInfo.email } }] };
      extractedData.newData.email = contactInfo.email;
      stats.contactsFound++;
      console.log(`  ✅ Email found: ${contactInfo.email}`);
    }
    
    if (contactInfo.phone && !existingData.phone) {
      updates.Phone = { rich_text: [{ text: { content: contactInfo.phone } }] };
      extractedData.newData.phone = contactInfo.phone;
      stats.contactsFound++;
      console.log(`  ✅ Phone found: ${contactInfo.phone}`);
    }
  }
  
  // Step 4: Crunchbase Intelligence (for priority orgs)
  const isPriority = existingData.category && 
    ['Startup', 'Scaleup', 'Enterprise'].includes(existingData.category);
  
  if (isPriority && !existingData.funding && !options.skipCrunchbase) {
    console.log('  → Gathering Crunchbase intelligence...');
    const crunchbaseData = await gatherCrunchbaseIntelligence(orgName, existingData.website);
    
    if (crunchbaseData && crunchbaseData.funding) {
      extractedData.newData.crunchbase = crunchbaseData;
      stats.financialDataFound++;
      console.log(`  ✅ Financial data found`);
    }
  }
  
  // Log all extracted data
  fs.appendFileSync(extractionLogPath, JSON.stringify(extractedData) + '\n');
  
  // Apply updates if not in dry run mode
  if (Object.keys(updates).length > 0 && !options.dryrun) {
    try {
      await notion.pages.update({
        page_id: orgId,
        properties: updates
      });
      console.log(`  ✅ Updated ${Object.keys(updates).length} fields`);
    } catch (error) {
      console.error(`  ❌ Error updating Notion:`, error.message);
      stats.errors++;
    }
  } else if (Object.keys(updates).length > 0) {
    console.log(`  🔄 Would update ${Object.keys(updates).length} fields (dry run)`);
  }
  
  stats.processed++;
}

// Fetch organizations to process
async function fetchOrganizations() {
  const filter = {
    and: [
      {
        or: [
          { property: 'LinkedIn', url: { is_empty: true } },
          { property: 'Website', url: { is_empty: true } },
          { property: 'Email', rich_text: { is_empty: true } },
          { property: 'Phone', rich_text: { is_empty: true } }
        ]
      }
    ]
  };
  
  if (options.priorityOnly) {
    filter.and.push({
      property: 'Category',
      select: {
        equals: 'Startup'
      }
    });
  }
  
  const response = await notion.databases.query({
    database_id: dbId,
    filter: filter,
    page_size: options.limit
  });
  
  return response.results;
}

// Generate final report
function generateReport() {
  const duration = ((Date.now() - stats.startTime) / 1000).toFixed(1);
  const rate = (stats.processed / (duration / 60)).toFixed(1);
  
  const report = `# Mega Enhancement Pipeline Report
  
*Generated on ${new Date().toISOString()}*

## 🎯 Batch Information
- **Batch Number**: ${options.batch}
- **Mode**: ${options.dryrun ? 'Dry Run' : 'Live Updates'}
- **Priority Only**: ${options.priorityOnly ? 'Yes' : 'No'}

## 📊 Results Summary

| Metric | Count | Success Rate |
|--------|-------|--------------|
| Organizations Processed | ${stats.processed} | - |
| LinkedIn Profiles Found | ${stats.linkedInFound} | ${((stats.linkedInFound / stats.processed) * 100).toFixed(1)}% |
| Websites Discovered | ${stats.websitesFound} | ${((stats.websitesFound / stats.processed) * 100).toFixed(1)}% |
| Contact Info Extracted | ${stats.contactsFound} | ${((stats.contactsFound / stats.processed) * 100).toFixed(1)}% |
| Financial Data Found | ${stats.financialDataFound} | ${((stats.financialDataFound / stats.processed) * 100).toFixed(1)}% |
| Errors | ${stats.errors} | ${((stats.errors / stats.processed) * 100).toFixed(1)}% |

## ⏱️ Performance
- **Total Duration**: ${duration} seconds
- **Processing Rate**: ${rate} orgs/minute
- **Average Time per Org**: ${(duration / stats.processed).toFixed(1)} seconds

## 📁 Output Files
- **Search Logs**: ${searchLogPath}
- **Extraction Data**: ${extractionLogPath}
- **This Report**: ${reportPath}

## 🚀 Next Steps
1. Review extraction logs for data quality
2. Run data validation tools on extracted information
3. Process next batch with: \`--batch=${options.batch + 1}\`
4. Analyze search patterns for optimization opportunities

${options.dryrun ? '\n⚠️ **Note**: This was a dry run. No database updates were made.' : ''}
`;
  
  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 Report saved to: ${reportPath}`);
  
  return report;
}

// Main execution
async function main() {
  console.log('🔥 BC AI Ecosystem Mega Enhancement Pipeline 🔥');
  console.log('=' .repeat(50));
  console.log(`Batch: ${options.batch} | Limit: ${options.limit} | Mode: ${options.dryrun ? 'Dry Run' : 'Live'}`);
  console.log('=' .repeat(50));
  
  try {
    // Fetch organizations
    console.log('\n📋 Fetching organizations to process...');
    const organizations = await fetchOrganizations();
    console.log(`Found ${organizations.length} organizations to enhance\n`);
    
    // Process each organization
    for (const org of organizations) {
      await processOrganization(org);
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Generate report
    const report = generateReport();
    console.log('\n' + '=' .repeat(50));
    console.log(report);
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the pipeline
main();