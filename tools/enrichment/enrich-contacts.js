#!/usr/bin/env node
/**
 * Extract contact information (email and phone) from organization websites
 * Usage: node scripts/extract-contact-info.js [--limit=50] [--batch=1]
 * 
 * Options:
 *   --limit=N    Process only N organizations (default: all)
 *   --batch=N    Process batch N (1-based, default: 1)
 *   --dryrun     Don't update Notion, just show what would be updated
 *   --email      Only extract email addresses
 *   --phone      Only extract phone numbers
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');
const axios = require('axios');
const cheerio = require('cheerio');
const emailValidator = require('email-validator');
const { parsePhoneNumber, isValidPhoneNumber } = require('libphonenumber-js');
require('dotenv').config();

// Try to load configuration
let config = {};
try {
  config = require('../config');
} catch (e) {
  // Config file doesn't exist, will use environment variables
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  limit: Infinity,
  batch: 1,
  dryrun: false,
  extractEmail: true,
  extractPhone: true
};

args.forEach(arg => {
  if (arg.startsWith('--limit=')) {
    options.limit = parseInt(arg.split('=')[1], 10);
  } else if (arg.startsWith('--batch=')) {
    options.batch = parseInt(arg.split('=')[1], 10);
  } else if (arg === '--dryrun') {
    options.dryrun = true;
  } else if (arg === '--email') {
    options.extractEmail = true;
    options.extractPhone = false;
  } else if (arg === '--phone') {
    options.extractEmail = false;
    options.extractPhone = true;
  }
});

// Get Notion token and database ID from config or environment variables
const notionToken = config.NOTION_TOKEN || process.env.NOTION_TOKEN;
const dbId = config.NOTION_DATABASE_ID || process.env.NOTION_DATABASE_ID;

// Check for required credentials
if (!notionToken || !dbId) {
  console.error('Notion token and database ID are required. Set them in config.js or as environment variables.');
  process.exit(1);
}

const notion = new Client({ auth: notionToken });

// Helper function to safely extract property values
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
    default:
      return null;
  }
}

// Function to fetch and parse a website
async function fetchWebsite(url) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    return null;
  }
}

// Function to find contact page URL
async function findContactPage(baseUrl, html) {
  const $ = cheerio.load(html);
  
  // Look for common contact page links
  const contactLinks = $('a').toArray().filter(link => {
    const href = $(link).attr('href');
    const text = $(link).text().toLowerCase();
    
    return href && (
      text.includes('contact') || 
      text.includes('get in touch') || 
      text.includes('reach us') ||
      href.includes('contact') ||
      href.includes('get-in-touch')
    );
  });
  
  if (contactLinks.length > 0) {
    let contactUrl = $(contactLinks[0]).attr('href');
    
    // Handle relative URLs
    if (contactUrl.startsWith('/')) {
      const baseUrlObj = new URL(baseUrl);
      contactUrl = `${baseUrlObj.protocol}//${baseUrlObj.hostname}${contactUrl}`;
    } else if (!contactUrl.startsWith('http')) {
      contactUrl = `${baseUrl.replace(/\/$/, '')}/${contactUrl.replace(/^\//, '')}`;
    }
    
    return contactUrl;
  }
  
  return null;
}

// Function to extract email addresses from HTML
function extractEmails(html) {
  const $ = cheerio.load(html);
  const bodyText = $('body').text();
  const htmlContent = $.html();
  
  // Extract emails from text content
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const textEmails = bodyText.match(emailRegex) || [];
  
  // Extract emails from mailto links
  const mailtoLinks = $('a[href^="mailto:"]').toArray();
  const mailtoEmails = mailtoLinks.map(link => {
    const href = $(link).attr('href');
    return href.replace('mailto:', '').split('?')[0];
  });
  
  // Combine and deduplicate emails
  const allEmails = [...new Set([...textEmails, ...mailtoEmails])];
  
  // Filter out common false positives and validate emails
  const validEmails = allEmails.filter(email => {
    // Skip common false positives
    if (email.includes('example.com') || 
        email.includes('domain.com') || 
        email.includes('yourdomain') ||
        email.includes('your-email')) {
      return false;
    }
    
    // Validate email format
    return emailValidator.validate(email);
  });
  
  return validEmails;
}

// Function to extract phone numbers from HTML
function extractPhoneNumbers(html) {
  const $ = cheerio.load(html);
  const bodyText = $('body').text();
  
  // Extract phone numbers using various patterns
  const phonePatterns = [
    /\+\d{1,3}[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}/g, // International format
    /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g, // North American format
    /\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/g // Simple 10-digit format
  ];
  
  let phoneMatches = [];
  phonePatterns.forEach(pattern => {
    const matches = bodyText.match(pattern) || [];
    phoneMatches = [...phoneMatches, ...matches];
  });
  
  // Deduplicate phone numbers
  const uniquePhones = [...new Set(phoneMatches)];
  
  // Validate and format phone numbers
  const validPhones = uniquePhones.filter(phone => {
    try {
      // Try to parse as a North American number first
      return isValidPhoneNumber(phone, 'CA') || isValidPhoneNumber(phone, 'US');
    } catch (e) {
      return false;
    }
  });
  
  return validPhones;
}

// Function to select the best email from a list
function selectBestEmail(emails, orgName) {
  if (emails.length === 0) return null;
  
  // Prioritize emails based on common patterns
  const priorityPatterns = [
    /^info@/i,
    /^contact@/i,
    /^hello@/i,
    /^office@/i,
    /^admin@/i,
    /^support@/i,
    /^inquiries@/i
  ];
  
  // Check for organization name in email
  const orgNameLower = orgName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const orgNameEmails = emails.filter(email => {
    const localPart = email.split('@')[0].toLowerCase();
    const domain = email.split('@')[1].toLowerCase();
    
    return domain.includes(orgNameLower) || localPart.includes(orgNameLower);
  });
  
  if (orgNameEmails.length > 0) {
    return orgNameEmails[0];
  }
  
  // Check for priority patterns
  for (const pattern of priorityPatterns) {
    const matchingEmail = emails.find(email => pattern.test(email));
    if (matchingEmail) {
      return matchingEmail;
    }
  }
  
  // Default to the first email
  return emails[0];
}

// Function to select the best phone number from a list
function selectBestPhone(phones) {
  if (phones.length === 0) return null;
  
  // Try to format the first phone number
  try {
    const parsedPhone = parsePhoneNumber(phones[0], 'CA');
    return parsedPhone.formatInternational();
  } catch (e) {
    // If parsing fails, return the original phone number
    return phones[0];
  }
}

// Main function to extract contact information
async function extractContactInfo() {
  console.log('🔍 Finding organizations with websites but missing contact information...');
  
  // Build the filter based on options
  const filters = [];
  
  if (options.extractEmail) {
    filters.push({
      property: 'Email',
      email: { is_empty: true }
    });
  }
  
  if (options.extractPhone) {
    filters.push({
      property: 'Phone',
      phone_number: { is_empty: true }
    });
  }
  
  const filter = filters.length > 1
    ? { and: filters }
    : filters[0];
  
  // Query database for organizations with websites but missing contact info
  const pages = [];
  let cursor;
  let count = 0;
  
  do {
    const response = await notion.databases.query({
      database_id: dbId,
      start_cursor: cursor,
      filter: {
        and: [
          {
            property: 'Website',
            url: { is_not_empty: true }
          },
          filter
        ]
      }
    });
    
    pages.push(...response.results);
    cursor = response.has_more ? response.next_cursor : null;
    count += response.results.length;
    console.log(`Fetched ${count} organizations so far...`);
  } while (cursor);
  
  console.log(`Found ${pages.length} organizations with websites but missing contact information`);
  
  // Calculate batch start and end
  const batchSize = options.limit === Infinity ? pages.length : options.limit;
  const startIndex = (options.batch - 1) * batchSize;
  const endIndex = Math.min(startIndex + batchSize, pages.length);
  
  if (startIndex >= pages.length) {
    console.error(`Batch ${options.batch} starts at index ${startIndex}, but there are only ${pages.length} organizations`);
    process.exit(1);
  }
  
  console.log(`Processing batch ${options.batch}: organizations ${startIndex + 1} to ${endIndex} (${endIndex - startIndex} total)`);
  
  const pagesToProcess = pages.slice(startIndex, endIndex);
  const results = {
    processed: 0,
    emailsAdded: 0,
    phonesAdded: 0,
    skipped: 0,
    failed: 0,
    contacts: []
  };
  
  // Process each organization
  for (const page of pagesToProcess) {
    const orgName = getPropertyValue(page, 'Name');
    const website = getPropertyValue(page, 'Website');
    console.log(`Processing ${orgName} (${website})...`);
    results.processed++;
    
    try {
      // Fetch the website
      const html = await fetchWebsite(website);
      
      if (!html) {
        console.log(`Could not fetch website for ${orgName}`);
        results.skipped++;
        continue;
      }
      
      // Try to find contact page
      const contactPageUrl = await findContactPage(website, html);
      let contactHtml = html;
      
      if (contactPageUrl) {
        console.log(`Found contact page: ${contactPageUrl}`);
        const contactPage = await fetchWebsite(contactPageUrl);
        if (contactPage) {
          contactHtml = contactPage;
        }
      }
      
      // Extract contact information
      let email = null;
      let phone = null;
      let updated = false;
      const updates = {};
      
      if (options.extractEmail && !getPropertyValue(page, 'Email')) {
        const emails = extractEmails(contactHtml);
        
        if (emails.length > 0) {
          email = selectBestEmail(emails, orgName);
          console.log(`✅ Found email for ${orgName}: ${email}`);
          updates.Email = { email };
          results.emailsAdded++;
          updated = true;
        } else {
          console.log(`❌ No emails found for ${orgName}`);
        }
      }
      
      if (options.extractPhone && !getPropertyValue(page, 'Phone')) {
        const phones = extractPhoneNumbers(contactHtml);
        
        if (phones.length > 0) {
          phone = selectBestPhone(phones);
          console.log(`✅ Found phone for ${orgName}: ${phone}`);
          updates.Phone = { phone_number: phone };
          results.phonesAdded++;
          updated = true;
        } else {
          console.log(`❌ No phone numbers found for ${orgName}`);
        }
      }
      
      if (updated) {
        // Update the database if not in dry run mode
        if (!options.dryrun) {
          await notion.pages.update({
            page_id: page.id,
            properties: updates
          });
        } else {
          console.log(`[DRY RUN] Would update ${orgName} with:`, updates);
        }
        
        results.contacts.push({
          name: orgName,
          email,
          phone,
          pageId: page.id
        });
      } else {
        results.skipped++;
      }
    } catch (error) {
      console.error(`Error processing ${orgName}:`, error.message);
      results.failed++;
    }
  }
  
  // Generate report
  const timestamp = new Date().toISOString().split('T')[0];
  const reportPath = path.join('..', 'reports', `${timestamp}_contact-info-extraction.md`);
  
  let report = `# Contact Information Extraction Report\n\n`;
  report += `*Generated on ${new Date().toLocaleString()}*\n\n`;
  report += `## Summary\n\n`;
  report += `- **Batch**: ${options.batch}\n`;
  report += `- **Organizations Processed**: ${results.processed}\n`;
  report += `- **Emails Added**: ${results.emailsAdded}\n`;
  report += `- **Phone Numbers Added**: ${results.phonesAdded}\n`;
  report += `- **Organizations Skipped**: ${results.skipped}\n`;
  report += `- **Failed Operations**: ${results.failed}\n\n`;
  
  if (results.contacts.length > 0) {
    report += `## Added Contact Information\n\n`;
    report += `| Organization | Email | Phone |\n`;
    report += `|-------------|-------|-------|\n`;
    
    for (const contact of results.contacts) {
      report += `| [${contact.name}](https://www.notion.so/${contact.pageId.replace(/-/g, '')}) | ${contact.email || '-'} | ${contact.phone || '-'} |\n`;
    }
  }
  
  // Ensure reports directory exists
  const reportsDir = path.join('..', 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir);
  }
  
  fs.writeFileSync(reportPath, report);
  
  console.log(`\n📊 Results:`);
  console.log(`   ✅ Organizations processed: ${results.processed}`);
  console.log(`   ✅ Emails added: ${results.emailsAdded}`);
  console.log(`   ✅ Phone numbers added: ${results.phonesAdded}`);
  console.log(`   ⏭️ Organizations skipped: ${results.skipped}`);
  console.log(`   ❌ Failed operations: ${results.failed}`);
  console.log(`   📝 Report written to: ${reportPath}`);
}

// Run the script
extractContactInfo().catch(error => {
  console.error('Error:', error.message);
  if (error.body) console.error('API Error:', error.body);
  process.exit(1);
}); 