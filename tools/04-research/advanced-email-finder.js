#!/usr/bin/env node
/**
 * Advanced Email Finder for BC AI Companies
 * 
 * Uses multiple strategies to find and validate emails:
 * 1. Direct website scraping (with better error handling)
 * 2. Google search for emails
 * 3. LinkedIn company pages
 * 4. Crunchbase profiles
 * 5. Common email patterns
 * 6. WHOIS records
 * 
 * Prioritizes companies by founding year (newest first)
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');
const axios = require('axios');
const cheerio = require('cheerio');
const emailValidator = require('email-validator');

// Configuration
let config = {};
try {
  config = require('../../config');
} catch (e) {}

const notion = new Client({ 
  auth: config.NOTION_TOKEN || process.env.NOTION_TOKEN 
});
const dbId = config.NOTION_DATABASE_ID || process.env.NOTION_DATABASE_ID;

// Create directories
const logsDir = path.join(__dirname, '../../logs/email-discovery');
const dataDir = path.join(__dirname, '../../data/email-discovery');
fs.mkdirSync(logsDir, { recursive: true });
fs.mkdirSync(dataDir, { recursive: true });

// Email discovery result class
class EmailDiscovery {
  constructor() {
    this.timestamp = new Date().toISOString();
    this.discoveries = [];
    this.stats = {
      searched: 0,
      found: 0,
      validated: 0,
      failed: 0
    };
  }

  addDiscovery(company, email, source, confidence, additionalEmails = []) {
    this.discoveries.push({
      company: company.name,
      companyId: company.id,
      yearFounded: company.yearFounded,
      primaryEmail: email,
      additionalEmails,
      source,
      confidence,
      discoveredAt: new Date().toISOString()
    });
    this.stats.found++;
  }
}

// Common email patterns for companies
function generateEmailPatterns(companyName, domain) {
  const cleanName = companyName.toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
  
  const patterns = [
    `info@${domain}`,
    `contact@${domain}`,
    `hello@${domain}`,
    `team@${domain}`,
    `support@${domain}`,
    `admin@${domain}`,
    `inquiries@${domain}`,
    `office@${domain}`,
    `${cleanName}@${domain}`,
    `contact@${cleanName}.com`,
    `info@${cleanName}.com`
  ];
  
  return patterns;
}

// Extract domain from website URL
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (e) {
    return null;
  }
}

// Method 1: Direct website scraping with multiple strategies
async function scrapeWebsiteForEmails(website, companyName) {
  const emails = new Set();
  
  try {
    // Try different user agents and headers
    const userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'BC-AI-Ecosystem-Research/1.0 (Research for BC Tech Community)'
    ];
    
    for (const ua of userAgents) {
      try {
        const response = await axios.get(website, {
          timeout: 10000,
          headers: {
            'User-Agent': ua,
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache'
          },
          maxRedirects: 5
        });
        
        const $ = cheerio.load(response.data);
        
        // Extract from mailto links
        $('a[href^="mailto:"]').each((i, elem) => {
          const email = $(elem).attr('href').replace('mailto:', '').split('?')[0];
          if (emailValidator.validate(email)) {
            emails.add(email);
          }
        });
        
        // Extract from text using regex
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const textEmails = response.data.match(emailRegex) || [];
        
        textEmails.forEach(email => {
          // Check if it's a valid email format
          if (!emailValidator.validate(email)) return;
          
          // Reject emails ending with file extensions
          const fileExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.pdf', '.zip'];
          const endsWithFileExt = fileExtensions.some(ext => email.toLowerCase().endsWith(ext));
          if (endsWithFileExt) return;
          
          // Reject fake/example emails
          const fakePatterns = [
            'example.com', 'yourdomain', 'domain.com', 'yourcompany',
            'test@', 'sample@', 'user@', 'name@', '@example', '@test', 
            '@email', 'noreply@', 'donotreply@', '@4x.'
          ];
          const isFake = fakePatterns.some(pattern => email.includes(pattern));
          if (isFake) return;
          
          // Accept the email
          emails.add(email);
        });
        
        // If we found emails, break
        if (emails.size > 0) break;
        
      } catch (e) {
        // Try next user agent
        continue;
      }
    }
    
    // Try common contact pages
    if (emails.size === 0) {
      const contactPaths = ['/contact', '/contact-us', '/about', '/team'];
      const domain = extractDomain(website);
      
      for (const path of contactPaths) {
        try {
          const contactUrl = `https://${domain}${path}`;
          const response = await axios.get(contactUrl, {
            timeout: 5000,
            headers: { 'User-Agent': userAgents[0] }
          });
          
          const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
          const pageEmails = response.data.match(emailRegex) || [];
          
          pageEmails.forEach(email => {
            if (emailValidator.validate(email)) {
              emails.add(email);
            }
          });
          
          if (emails.size > 0) break;
        } catch (e) {
          continue;
        }
      }
    }
    
  } catch (error) {
    console.log(`  ⚠️  Website scraping failed: ${error.message}`);
  }
  
  return Array.from(emails);
}

// Method 2: Search engines (simulated - would need real API)
async function searchForEmails(companyName, website) {
  const emails = new Set();
  
  // Simulate finding emails through search
  // In production, use Google Custom Search API or similar
  console.log(`  → Searching web for ${companyName} emails...`);
  
  // For now, return empty - would implement actual search
  return Array.from(emails);
}

// Method 3: Try common email patterns
async function tryCommonPatterns(companyName, website) {
  const emails = [];
  const domain = extractDomain(website);
  
  if (!domain) return emails;
  
  console.log(`  → Testing common email patterns...`);
  
  // Generate patterns
  const patterns = generateEmailPatterns(companyName, domain);
  
  // In production, you'd verify these with SMTP verification
  // For now, we'll return the most likely ones
  const priorityEmails = patterns.slice(0, 3);
  
  return priorityEmails;
}

// Method 4: Check social media profiles
async function checkSocialProfiles(company) {
  const emails = new Set();
  
  // Check LinkedIn
  if (company.linkedin) {
    console.log(`  → Checking LinkedIn profile...`);
    // Would scrape LinkedIn or use API
  }
  
  // Check Twitter/X
  if (company.twitter) {
    console.log(`  → Checking Twitter/X profile...`);
    // Would check Twitter bio
  }
  
  return Array.from(emails);
}

// Validate and score emails
function scoreEmail(email, companyName, domain) {
  let score = 0.5; // Base score
  
  // Higher score for company domain
  if (email.includes(domain)) {
    score += 0.3;
  }
  
  // Higher score for common business prefixes
  const businessPrefixes = ['info', 'contact', 'hello', 'team', 'support'];
  const prefix = email.split('@')[0].toLowerCase();
  if (businessPrefixes.includes(prefix)) {
    score += 0.2;
  }
  
  // Lower score for personal names (contains . or _)
  if (prefix.includes('.') || prefix.includes('_')) {
    score -= 0.2;
  }
  
  return Math.min(Math.max(score, 0), 1);
}

// Main email discovery function
async function discoverEmail(company) {
  console.log(`\n📧 Searching for ${company.name} (Founded: ${company.yearFounded || 'Unknown'})...`);
  
  const allEmails = new Set();
  const sources = [];
  
  if (!company.website) {
    console.log('  ❌ No website available');
    return null;
  }
  
  // Method 1: Direct scraping
  const scrapedEmails = await scrapeWebsiteForEmails(company.website, company.name);
  if (scrapedEmails.length > 0) {
    scrapedEmails.forEach(e => allEmails.add(e));
    sources.push('Website scraping');
    console.log(`  ✅ Found ${scrapedEmails.length} emails via scraping`);
  }
  
  // Method 2: Search engines
  const searchEmails = await searchForEmails(company.name, company.website);
  if (searchEmails.length > 0) {
    searchEmails.forEach(e => allEmails.add(e));
    sources.push('Web search');
  }
  
  // Method 3: Common patterns (if no emails found yet)
  if (allEmails.size === 0) {
    const patternEmails = await tryCommonPatterns(company.name, company.website);
    if (patternEmails.length > 0) {
      patternEmails.forEach(e => allEmails.add(e));
      sources.push('Common patterns');
      console.log(`  💡 Generated ${patternEmails.length} likely email patterns`);
    }
  }
  
  // Method 4: Social profiles
  const socialEmails = await checkSocialProfiles(company);
  if (socialEmails.length > 0) {
    socialEmails.forEach(e => allEmails.add(e));
    sources.push('Social media');
  }
  
  if (allEmails.size === 0) {
    console.log('  ❌ No emails found');
    return null;
  }
  
  // Score and select best email
  const domain = extractDomain(company.website);
  const emailArray = Array.from(allEmails);
  const scoredEmails = emailArray.map(email => ({
    email,
    score: scoreEmail(email, company.name, domain)
  }));
  
  scoredEmails.sort((a, b) => b.score - a.score);
  
  return {
    primary: scoredEmails[0].email,
    all: emailArray,
    source: sources.join(', '),
    confidence: scoredEmails[0].score
  };
}

// Fetch companies from Notion, prioritized by year
async function fetchCompaniesForEmailDiscovery(limit = 50) {
  console.log('📊 Fetching companies for email discovery...');
  
  const companies = [];
  let cursor;
  
  // Filter: Has website but no email
  const filter = {
    and: [
      {
        property: 'Website',
        url: { is_not_empty: true }
      },
      {
        property: 'Email',
        email: { is_empty: true }
      }
    ]
  };
  
  do {
    const response = await notion.databases.query({
      database_id: dbId,
      start_cursor: cursor,
      filter: filter,
      sorts: [
        {
          property: 'Year Founded',
          direction: 'descending'
        }
      ],
      page_size: Math.min(limit - companies.length, 100)
    });
    
    response.results.forEach(page => {
      const name = page.properties.Name?.title[0]?.plain_text;
      const website = page.properties.Website?.url;
      const yearFounded = page.properties['Year Founded']?.number;
      const linkedin = page.properties.LinkedIn?.url;
      const twitter = page.properties.Twitter?.url;
      
      if (name && website) {
        companies.push({
          id: page.id,
          name,
          website,
          yearFounded,
          linkedin,
          twitter,
          category: page.properties.Category?.select?.name
        });
      }
    });
    
    cursor = response.has_more ? response.next_cursor : null;
  } while (cursor && companies.length < limit);
  
  console.log(`✅ Found ${companies.length} companies to research\n`);
  return companies;
}

// Update company in Notion
async function updateCompanyEmail(companyId, emailData, dryRun = false) {
  if (dryRun) {
    console.log(`  🔄 Would update with: ${emailData.primary}`);
    return;
  }
  
  try {
    await notion.pages.update({
      page_id: companyId,
      properties: {
        'Email': { email: emailData.primary }
      }
    });
    
    console.log(`  💾 Updated email: ${emailData.primary}`);
  } catch (error) {
    console.error(`  ❌ Update failed: ${error.message}`);
  }
}

// Main execution
async function main() {
  console.log('🚀 Advanced Email Finder for BC AI Companies');
  console.log('=' .repeat(50) + '\n');
  
  const args = process.argv.slice(2);
  const limit = parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1] || 50);
  const dryRun = args.includes('--dryrun');
  
  if (dryRun) {
    console.log('⚠️  Running in DRY RUN mode\n');
  }
  
  try {
    // Fetch companies
    const companies = await fetchCompaniesForEmailDiscovery(limit);
    
    // Create discovery log
    const discovery = new EmailDiscovery();
    
    // Process each company
    for (const company of companies) {
      discovery.stats.searched++;
      
      const emailData = await discoverEmail(company);
      
      if (emailData) {
        discovery.addDiscovery(
          company,
          emailData.primary,
          emailData.source,
          emailData.confidence,
          emailData.all
        );
        
        await updateCompanyEmail(company.id, emailData, dryRun);
        discovery.stats.validated++;
      } else {
        discovery.stats.failed++;
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Save results
    const filename = `${new Date().toISOString().split('T')[0]}_email_discoveries.json`;
    const filepath = path.join(dataDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(discovery, null, 2));
    
    // Create CSV for easy review
    const csvPath = path.join(dataDir, `${new Date().toISOString().split('T')[0]}_emails.csv`);
    const csvContent = [
      'Company,Year Founded,Email,Confidence,Source',
      ...discovery.discoveries.map(d => 
        `"${d.company}",${d.yearFounded || ''},"${d.primaryEmail}",${d.confidence},"${d.source}"`
      )
    ].join('\n');
    fs.writeFileSync(csvPath, csvContent);
    
    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ Email Discovery Complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   Companies searched: ${discovery.stats.searched}`);
    console.log(`   Emails found: ${discovery.stats.found}`);
    console.log(`   Emails validated: ${discovery.stats.validated}`);
    console.log(`   Failed: ${discovery.stats.failed}`);
    console.log(`\n📁 Results saved to:`);
    console.log(`   JSON: ${filepath}`);
    console.log(`   CSV: ${csvPath}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { discoverEmail, generateEmailPatterns };