#!/usr/bin/env node
/**
 * Priority Enrichment - Focus on high-value empty fields
 * Targets: Email (70% empty), Funding (68% empty), Key People (67% empty)
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');
const axios = require('axios');
const cheerio = require('cheerio');
const dns = require('dns').promises;

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const dbId = process.env.NOTION_DATABASE_ID;

// Enhanced validation
const validate = {
  email: (email) => {
    if (!email || typeof email !== 'string') return false;
    if (/\.(png|jpg|jpeg|gif|svg|pdf|zip|js|css|html|ico|webp)$/i.test(email)) return false;
    if (/example\.com|test\.com|yourcompany|domain\.com|noreply|donotreply|no-reply|@test|@example/i.test(email)) return false;
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  }
};

// Enhanced email finder
async function findEmail(company) {
  if (!company.website) return null;
  console.log(`  → Finding email...`);
  
  try {
    // Better headers to avoid blocks
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Connection': 'keep-alive'
    };
    
    const response = await axios.get(company.website, { 
      timeout: 10000, 
      headers,
      maxRedirects: 5
    });
    
    const $ = cheerio.load(response.data);
    const emails = new Set();
    
    // Extract from mailto links
    $('a[href^="mailto:"]').each((i, elem) => {
      const email = $(elem).attr('href').replace('mailto:', '').split('?')[0].trim();
      if (validate.email(email)) emails.add(email);
    });
    
    // Extract from text
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = response.data.match(emailRegex) || [];
    matches.forEach(email => {
      if (validate.email(email)) emails.add(email);
    });
    
    // Try contact pages
    if (emails.size === 0) {
      const paths = ['/contact', '/contact-us', '/about', '/support', '/get-in-touch'];
      for (const path of paths) {
        try {
          const url = new URL(path, company.website).href;
          const resp = await axios.get(url, { timeout: 5000, headers });
          const pageEmails = resp.data.match(emailRegex) || [];
          pageEmails.forEach(email => {
            if (validate.email(email)) emails.add(email);
          });
          if (emails.size > 0) break;
        } catch {}
      }
    }
    
    // Pattern generation as last resort
    if (emails.size === 0) {
      const domain = new URL(company.website).hostname.replace('www.', '');
      const patterns = [`info@${domain}`, `contact@${domain}`, `hello@${domain}`, `support@${domain}`];
      
      try {
        const mx = await dns.resolveMx(domain);
        if (mx && mx.length > 0) {
          console.log(`    💡 Using pattern: ${patterns[0]}`);
          return { email: patterns[0], confidence: 0.7, source: 'Pattern (MX verified)' };
        }
      } catch {}
    }
    
    // Return best email
    const emailArray = Array.from(emails);
    const businessEmails = emailArray.filter(e => /^(info|contact|hello|support|team|admin|office)@/i.test(e));
    const bestEmail = businessEmails[0] || emailArray[0];
    
    if (bestEmail) {
      console.log(`    ✅ Found: ${bestEmail}`);
      return { email: bestEmail, confidence: 0.9, source: 'Website' };
    }
    
    console.log(`    ❌ No email found`);
    return null;
    
  } catch (error) {
    console.log(`    ⚠️  Error: ${error.message}`);
    return null;
  }
}

// Find funding information
async function findFunding(company) {
  if (!company.website) return null;
  console.log(`  → Finding funding...`);
  
  try {
    const response = await axios.get(company.website, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    const $ = cheerio.load(response.data);
    const text = $('body').text();
    
    // Funding patterns
    const patterns = [
      /raised\s+\$?([\d.]+)\s*(million|M|billion|B)/i,
      /funding.*?\$?([\d.]+)\s*(million|M|billion|B)/i,
      /\$?([\d.]+)\s*(million|M|billion|B).*?(series\s+[A-Z]|seed|funding)/i,
      /series\s+([A-Z])\s+.*?\$?([\d.]+)\s*(million|M)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const amount = match[1] || match[2];
        const unit = match[2] || match[3];
        const round = match[0].match(/series\s+[A-Z]|seed/i)?.[0] || 'Funding';
        
        const fundingText = `$${amount}${unit.charAt(0).toUpperCase()} ${round}`;
        console.log(`    ✅ Found: ${fundingText}`);
        
        return {
          text: fundingText,
          confidence: 0.8,
          source: company.website
        };
      }
    }
    
    // Try news/press pages
    const pressPaths = ['/news', '/press', '/media', '/about'];
    for (const path of pressPaths) {
      try {
        const url = new URL(path, company.website).href;
        const resp = await axios.get(url, { timeout: 5000 });
        const pageText = resp.data;
        
        for (const pattern of patterns) {
          const match = pageText.match(pattern);
          if (match) {
            const amount = match[1] || match[2];
            const unit = match[2] || match[3];
            const fundingText = `$${amount}${unit.charAt(0).toUpperCase()}`;
            console.log(`    ✅ Found: ${fundingText}`);
            return {
              text: `${fundingText}\n\nSource: ${url}`,
              confidence: 0.8,
              source: url
            };
          }
        }
      } catch {}
    }
    
    console.log(`    ❌ No funding found`);
    return null;
    
  } catch (error) {
    console.log(`    ⚠️  Error: ${error.message}`);
    return null;
  }
}

// Find key people
async function findKeyPeople(company) {
  if (!company.website) return null;
  console.log(`  → Finding key people...`);
  
  try {
    // Try team/about pages
    const teamPaths = ['/team', '/about', '/about-us', '/leadership', '/people'];
    
    for (const path of teamPaths) {
      try {
        const url = new URL(path, company.website).href;
        const response = await axios.get(url, {
          timeout: 5000,
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        const $ = cheerio.load(response.data);
        const people = [];
        
        // Look for team sections
        $('.team-member, .person, .leadership, [class*="team"], [class*="leader"]').each((i, elem) => {
          const name = $(elem).find('h3, h4, .name').first().text().trim();
          const role = $(elem).find('.role, .position, .title, p').first().text().trim();
          
          if (name && role && name.length < 50 && role.length < 100) {
            people.push(`${name} (${role})`);
          }
        });
        
        if (people.length > 0) {
          const topPeople = people.slice(0, 5).join('\n');
          console.log(`    ✅ Found ${people.length} people`);
          return {
            text: topPeople,
            confidence: 0.9,
            source: url
          };
        }
      } catch {}
    }
    
    // Fallback: Look for CEO/Founder mentions
    const response = await axios.get(company.website, { timeout: 5000 });
    const text = response.data;
    
    const patterns = [
      /(?:CEO|Chief Executive)[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)/,
      /(?:Founder|Co-founder)[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)/,
      /([A-Z][a-z]+ [A-Z][a-z]+),?\s+(?:CEO|Founder|CTO)/
    ];
    
    const foundPeople = [];
    patterns.forEach(pattern => {
      const matches = text.matchAll(new RegExp(pattern, 'g'));
      for (const match of matches) {
        const name = match[1];
        if (name && name.length < 50 && !foundPeople.includes(name)) {
          foundPeople.push(name);
        }
      }
    });
    
    if (foundPeople.length > 0) {
      console.log(`    ✅ Found ${foundPeople.length} executives`);
      return {
        text: foundPeople.map(name => `${name} (Executive)`).join('\n'),
        confidence: 0.7,
        source: company.website
      };
    }
    
    console.log(`    ❌ No key people found`);
    return null;
    
  } catch (error) {
    console.log(`    ⚠️  Error: ${error.message}`);
    return null;
  }
}

// Main enrichment function
async function enrichCompany(company) {
  console.log(`\n🔍 ${company.name}`);
  const updates = {};
  const log = {
    company: company.name,
    companyId: company.id,
    timestamp: new Date().toISOString(),
    enrichments: {},
    sources: []
  };
  
  // Priority 1: Email (most important for outreach)
  if (!company.email) {
    const emailData = await findEmail(company);
    if (emailData) {
      updates['Email'] = { email: emailData.email };
      log.enrichments.email = emailData;
      log.sources.push({ field: 'email', source: emailData.source });
    }
  }
  
  // Priority 2: Funding (qualification data)
  if (!company.funding) {
    const fundingData = await findFunding(company);
    if (fundingData) {
      updates['Funding'] = {
        rich_text: [{ text: { content: fundingData.text } }]
      };
      log.enrichments.funding = fundingData;
      log.sources.push({ field: 'funding', source: fundingData.source });
    }
  }
  
  // Priority 3: Key People (personalization)
  if (!company.keyPeople) {
    const peopleData = await findKeyPeople(company);
    if (peopleData) {
      updates['Key People'] = {
        rich_text: [{ text: { content: peopleData.text } }]
      };
      log.enrichments.keyPeople = peopleData;
      log.sources.push({ field: 'keyPeople', source: peopleData.source });
    }
  }
  
  // Update Notion
  if (Object.keys(updates).length > 0) {
    try {
      await notion.pages.update({
        page_id: company.id,
        properties: updates
      });
      console.log(`  💾 Updated ${Object.keys(updates).length} fields`);
    } catch (error) {
      console.error(`  ❌ Update failed: ${error.message}`);
    }
  }
  
  // Log enrichment
  const logDir = path.join(__dirname, '../logs/priority-enrichment');
  fs.mkdirSync(logDir, { recursive: true });
  fs.appendFileSync(
    path.join(logDir, `${new Date().toISOString().split('T')[0]}_enrichments.jsonl`),
    JSON.stringify(log) + '\n'
  );
  
  return log;
}

// Main function
async function main() {
  console.log('🚀 Priority Enrichment - High Value Fields\n');
  console.log('Targets: Email (70% empty), Funding (68% empty), Key People (67% empty)\n');
  
  const limit = parseInt(process.argv[2]) || 100;
  
  // Fetch companies with websites but missing critical data
  const response = await notion.databases.query({
    database_id: dbId,
    filter: {
      and: [
        { property: 'Website', url: { is_not_empty: true } },
        {
          or: [
            { property: 'Email', email: { is_empty: true } },
            { property: 'Funding', rich_text: { is_empty: true } },
            { property: 'Key People', rich_text: { is_empty: true } }
          ]
        }
      ]
    },
    sorts: [{ property: 'Year Founded', direction: 'descending' }],
    page_size: limit
  });
  
  const companies = response.results.map(page => ({
    id: page.id,
    name: page.properties.Name?.title[0]?.plain_text,
    website: page.properties.Website?.url,
    email: page.properties.Email?.email,
    funding: page.properties.Funding?.rich_text[0]?.plain_text,
    keyPeople: page.properties['Key People']?.rich_text[0]?.plain_text,
    yearFounded: page.properties['Year Founded']?.number
  }));
  
  console.log(`Found ${companies.length} companies to enrich\n`);
  
  // Track results
  const results = {
    processed: 0,
    emails: 0,
    funding: 0,
    keyPeople: 0,
    totalEnrichments: 0
  };
  
  // Process each company
  for (const company of companies) {
    const log = await enrichCompany(company);
    results.processed++;
    
    if (log.enrichments.email) results.emails++;
    if (log.enrichments.funding) results.funding++;
    if (log.enrichments.keyPeople) results.keyPeople++;
    results.totalEnrichments += Object.keys(log.enrichments).length;
    
    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('✅ Priority Enrichment Complete!\n');
  console.log(`📊 Results:`);
  console.log(`   Companies processed: ${results.processed}`);
  console.log(`   Emails found: ${results.emails}`);
  console.log(`   Funding data found: ${results.funding}`);
  console.log(`   Key people found: ${results.keyPeople}`);
  console.log(`   Total enrichments: ${results.totalEnrichments}`);
  
  // Save summary
  const summaryPath = path.join(__dirname, '../data/priority-enrichment', `summary-${new Date().toISOString().split('T')[0]}.json`);
  fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
  fs.writeFileSync(summaryPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    results,
    companies: companies.length
  }, null, 2));
  
  console.log(`\n📁 Logs saved to: logs/priority-enrichment/`);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { findEmail, findFunding, findKeyPeople };