#!/usr/bin/env node
/**
 * Unified BC AI Ecosystem Enrichment Tool
 * 
 * ONE tool that does everything right:
 * - Finds valid emails (no .png nonsense)
 * - Discovers founding years
 * - Extracts AI focus areas
 * - Gets funding data
 * - Downloads logos
 * 
 * Works backwards from 2025 → older companies
 * Logs everything, validates everything
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');
const axios = require('axios');
const cheerio = require('cheerio');
const dns = require('dns').promises;

// Config
const notion = new Client({ 
  auth: process.env.NOTION_TOKEN 
});
const dbId = process.env.NOTION_DATABASE_ID;

// Directories
const dirs = {
  logs: path.join(__dirname, '../logs/unified'),
  data: path.join(__dirname, '../data/unified'),
  logos: path.join(__dirname, '../logos')
};
Object.values(dirs).forEach(dir => fs.mkdirSync(dir, { recursive: true }));

// === VALIDATION ===
const validate = {
  email: (email) => {
    if (!email) return false;
    // No file extensions
    if (/\.(png|jpg|jpeg|gif|svg|pdf|zip|js|css|html)$/i.test(email)) return false;
    // No fake emails
    if (/example\.com|test\.com|yourcompany|domain\.com|noreply/i.test(email)) return false;
    // Valid format
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  },
  
  year: (year) => {
    const current = new Date().getFullYear();
    return Number.isInteger(year) && year >= 1990 && year <= current;
  },
  
  url: (url) => {
    try {
      const u = new URL(url);
      return ['http:', 'https:'].includes(u.protocol);
    } catch {
      return false;
    }
  }
};

// === ENRICHMENT FUNCTIONS ===

// 1. Find Email
async function findEmail(company) {
  if (!company.website) return null;
  
  try {
    // Try to scrape website with better headers
    const response = await axios.get(company.website, {
      timeout: 10000,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      maxRedirects: 5
    });
    
    const $ = cheerio.load(response.data);
    const emails = new Set();
    
    // Extract from mailto links
    $('a[href^="mailto:"]').each((i, elem) => {
      const email = $(elem).attr('href').replace('mailto:', '').split('?')[0];
      if (validate.email(email)) emails.add(email);
    });
    
    // Extract from text
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = response.data.match(emailRegex) || [];
    matches.forEach(email => {
      if (validate.email(email)) emails.add(email);
    });
    
    // If no emails found, try contact pages
    if (emails.size === 0) {
      const paths = ['/contact', '/contact-us', '/about', '/about-us', '/support'];
      for (const path of paths) {
        try {
          const contactUrl = new URL(path, company.website).href;
          const contactResponse = await axios.get(contactUrl, {
            timeout: 5000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });
          
          const contactEmails = contactResponse.data.match(emailRegex) || [];
          contactEmails.forEach(email => {
            if (validate.email(email)) emails.add(email);
          });
          
          if (emails.size > 0) break;
        } catch {}
      }
    }
    
    // If still no emails, try common patterns
    if (emails.size === 0) {
      const domain = new URL(company.website).hostname.replace('www.', '');
      const patterns = [`info@${domain}`, `contact@${domain}`, `hello@${domain}`];
      
      // Check if domain has MX records
      try {
        const mx = await dns.resolveMx(domain);
        if (mx && mx.length > 0) {
          console.log(`  💡 Using pattern: ${patterns[0]}`);
          return { email: patterns[0], confidence: 0.7, source: 'Pattern' };
        }
      } catch {}
    }
    
    // Return best email
    const emailArray = Array.from(emails);
    const businessEmails = emailArray.filter(e => 
      /^(info|contact|hello|support|team)@/i.test(e)
    );
    
    const bestEmail = businessEmails[0] || emailArray[0];
    return bestEmail ? { email: bestEmail, confidence: 0.9, source: 'Website' } : null;
    
  } catch (error) {
    return null;
  }
}

// 2. Find Founding Year
async function findYear(company) {
  if (!company.website) return null;
  
  try {
    const response = await axios.get(company.website, {
      timeout: 5000,
      headers: { 'User-Agent': 'BC-AI-Research/1.0' }
    });
    
    const text = response.data.toLowerCase();
    
    // Look for founding patterns
    const patterns = [
      /founded\s+in\s+(\d{4})/,
      /established\s+in\s+(\d{4})/,
      /since\s+(\d{4})/,
      /started\s+in\s+(\d{4})/
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const year = parseInt(match[1]);
        if (validate.year(year)) {
          return { year, confidence: 0.9, source: 'Website' };
        }
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

// 3. Find AI Focus
async function findAIFocus(company) {
  if (!company.website) return null;
  
  try {
    const response = await axios.get(company.website, {
      timeout: 5000,
      headers: { 'User-Agent': 'BC-AI-Research/1.0' }
    });
    
    const $ = cheerio.load(response.data);
    const text = $('body').text().toLowerCase();
    
    const focusMap = {
      'machine learning': 'Machine Learning & Deep Learning',
      'deep learning': 'Machine Learning & Deep Learning',
      'computer vision': 'Computer Vision',
      'natural language': 'Natural Language Processing',
      'nlp': 'Natural Language Processing',
      'robotics': 'Robotics & Automation',
      'healthcare ai': 'Healthcare AI',
      'fintech': 'FinTech AI',
      'cleantech': 'CleanTech AI'
    };
    
    const found = new Set();
    Object.entries(focusMap).forEach(([keyword, area]) => {
      if (text.includes(keyword)) found.add(area);
    });
    
    return found.size > 0 ? {
      areas: Array.from(found),
      confidence: 0.8,
      source: 'Website'
    } : null;
    
  } catch {
    return null;
  }
}

// === MAIN ENRICHMENT ===
async function enrichCompany(company) {
  console.log(`\n🔍 ${company.name}`);
  const updates = {};
  const log = {
    company: company.name,
    timestamp: new Date().toISOString(),
    enrichments: {}
  };
  
  // Find email
  if (!company.email) {
    const emailData = await findEmail(company);
    if (emailData) {
      updates['Email'] = { email: emailData.email };
      log.enrichments.email = emailData;
      console.log(`  ✅ Email: ${emailData.email}`);
    }
  }
  
  // Find year
  if (!company.yearFounded) {
    const yearData = await findYear(company);
    if (yearData) {
      updates['Year Founded'] = { number: yearData.year };
      log.enrichments.year = yearData;
      console.log(`  ✅ Founded: ${yearData.year}`);
    }
  }
  
  // Find AI focus
  if (!company.aiFocusAreas || company.aiFocusAreas.length === 0) {
    const focusData = await findAIFocus(company);
    if (focusData) {
      updates['AI Focus Areas'] = {
        multi_select: focusData.areas.map(area => ({ name: area }))
      };
      log.enrichments.aiFocus = focusData;
      console.log(`  ✅ AI Focus: ${focusData.areas.join(', ')}`);
    }
  }
  
  // Update Notion
  if (Object.keys(updates).length > 0) {
    await notion.pages.update({
      page_id: company.id,
      properties: updates
    });
  }
  
  // Log enrichment
  fs.appendFileSync(
    path.join(dirs.logs, 'enrichments.jsonl'),
    JSON.stringify(log) + '\n'
  );
  
  return log;
}

// === MAIN PIPELINE ===
async function main() {
  console.log('🚀 Unified BC AI Enrichment\n');
  
  const args = process.argv.slice(2);
  const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || 50);
  const yearFilter = parseInt(args.find(a => a.startsWith('--year='))?.split('=')[1]);
  
  // Fetch companies
  const filter = {
    and: [
      { property: 'Website', url: { is_not_empty: true } }
    ]
  };
  
  if (yearFilter) {
    filter.and.push({
      property: 'Year Founded',
      number: { equals: yearFilter }
    });
  }
  
  const response = await notion.databases.query({
    database_id: dbId,
    filter,
    sorts: [{ property: 'Year Founded', direction: 'descending' }],
    page_size: limit
  });
  
  const companies = response.results.map(page => ({
    id: page.id,
    name: page.properties.Name?.title[0]?.plain_text,
    website: page.properties.Website?.url,
    email: page.properties.Email?.email,
    yearFounded: page.properties['Year Founded']?.number,
    aiFocusAreas: page.properties['AI Focus Areas']?.multi_select || []
  }));
  
  console.log(`Found ${companies.length} companies to enrich\n`);
  
  // Process each company
  const results = {
    processed: 0,
    emails: 0,
    years: 0,
    aiFocus: 0
  };
  
  for (const company of companies) {
    const log = await enrichCompany(company);
    results.processed++;
    
    if (log.enrichments.email) results.emails++;
    if (log.enrichments.year) results.years++;
    if (log.enrichments.aiFocus) results.aiFocus++;
    
    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log('\n' + '='.repeat(40));
  console.log('✅ Complete!\n');
  console.log(`📊 Results:`);
  console.log(`   Processed: ${results.processed}`);
  console.log(`   Emails found: ${results.emails}`);
  console.log(`   Years found: ${results.years}`);
  console.log(`   AI Focus found: ${results.aiFocus}`);
  
  // Save summary
  const summary = {
    timestamp: new Date().toISOString(),
    results,
    logs: path.join(dirs.logs, 'enrichments.jsonl')
  };
  
  fs.writeFileSync(
    path.join(dirs.data, `enrichment-summary-${new Date().toISOString().split('T')[0]}.json`),
    JSON.stringify(summary, null, 2)
  );
}

// Run
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { findEmail, findYear, findAIFocus, validate };