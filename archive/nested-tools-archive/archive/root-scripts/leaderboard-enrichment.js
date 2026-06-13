#!/usr/bin/env node
/**
 * Leaderboard Enrichment Tool
 * Focuses on high-value data that boosts database metrics:
 * - Revenue (75% empty)
 * - Funding (68% empty) 
 * - Logos (visual appeal)
 * - LinkedIn (48% empty)
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');
const axios = require('axios');
const cheerio = require('cheerio');

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const dbId = process.env.NOTION_DATABASE_ID;

// Revenue patterns to search for
const revenuePatterns = [
  /\$?([\d.]+)\s*(million|M|billion|B)\s+(?:in\s+)?(?:annual\s+)?revenue/i,
  /revenue.*?\$?([\d.]+)\s*(million|M|billion|B)/i,
  /ARR.*?\$?([\d.]+)\s*(million|M|billion|B)/i,
  /\$?([\d.]+)(M|B)\s+ARR/i,
  /sales\s+of\s+\$?([\d.]+)\s*(million|M|billion|B)/i
];

// Funding patterns
const fundingPatterns = [
  /raised\s+\$?([\d.]+)\s*(million|M|billion|B)/i,
  /\$?([\d.]+)\s*(million|M|billion|B).*?(?:series\s+[A-Z]|seed|funding)/i,
  /series\s+([A-Z])\s+.*?\$?([\d.]+)\s*(million|M)/i,
  /secured\s+\$?([\d.]+)\s*(million|M|billion|B)/i,
  /funding.*?\$?([\d.]+)\s*(million|M|billion|B)/i
];

// Find revenue information
async function findRevenue(company) {
  if (!company.website || company.revenue) return null;
  console.log(`  → Finding revenue for ${company.name}...`);
  
  try {
    const response = await axios.get(company.website, {
      timeout: 10000,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      }
    });
    
    const $ = cheerio.load(response.data);
    const text = $('body').text();
    
    // Search for revenue patterns
    for (const pattern of revenuePatterns) {
      const match = text.match(pattern);
      if (match) {
        const amount = match[1];
        const unit = match[2];
        const revenueText = `$${amount}${unit.charAt(0).toUpperCase()} annual revenue`;
        console.log(`    ✅ Found: ${revenueText}`);
        return {
          text: revenueText,
          confidence: 0.8,
          source: company.website
        };
      }
    }
    
    // Try about/press pages
    const aboutPaths = ['/about', '/about-us', '/press', '/media', '/investors'];
    for (const path of aboutPaths) {
      try {
        const url = new URL(path, company.website).href;
        const resp = await axios.get(url, { timeout: 5000 });
        const pageText = resp.data;
        
        for (const pattern of revenuePatterns) {
          const match = pageText.match(pattern);
          if (match) {
            const amount = match[1];
            const unit = match[2];
            const revenueText = `$${amount}${unit.charAt(0).toUpperCase()} annual revenue`;
            console.log(`    ✅ Found: ${revenueText}`);
            return {
              text: revenueText,
              confidence: 0.8,
              source: url
            };
          }
        }
      } catch {}
    }
    
    console.log(`    ❌ No revenue found`);
    return null;
    
  } catch (error) {
    console.log(`    ⚠️  Error: ${error.message}`);
    return null;
  }
}

// Enhanced funding finder
async function findFunding(company) {
  if (!company.website || company.funding) return null;
  console.log(`  → Finding funding for ${company.name}...`);
  
  try {
    const response = await axios.get(company.website, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    const $ = cheerio.load(response.data);
    const text = $('body').text();
    
    // Search for funding patterns
    let bestMatch = null;
    let highestAmount = 0;
    
    for (const pattern of fundingPatterns) {
      const matches = text.matchAll(new RegExp(pattern, 'gi'));
      for (const match of matches) {
        const amount = parseFloat(match[1] || match[2]);
        const unit = match[2] || match[3];
        const multiplier = unit.toLowerCase().startsWith('b') ? 1000 : 1;
        const totalAmount = amount * multiplier;
        
        if (totalAmount > highestAmount) {
          highestAmount = totalAmount;
          const round = match[0].match(/series\s+[A-Z]/i)?.[0] || 'Funding';
          bestMatch = `$${amount}${unit.charAt(0).toUpperCase()} ${round}`;
        }
      }
    }
    
    if (bestMatch) {
      console.log(`    ✅ Found: ${bestMatch}`);
      return {
        text: bestMatch,
        confidence: 0.9,
        source: company.website
      };
    }
    
    console.log(`    ❌ No funding found`);
    return null;
    
  } catch (error) {
    console.log(`    ⚠️  Error: ${error.message}`);
    return null;
  }
}

// Find LinkedIn URL
async function findLinkedIn(company) {
  if (!company.website || company.linkedin) return null;
  console.log(`  → Finding LinkedIn for ${company.name}...`);
  
  try {
    const response = await axios.get(company.website, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    const $ = cheerio.load(response.data);
    
    // Look for LinkedIn links
    const linkedinLinks = $('a[href*="linkedin.com/company"]');
    if (linkedinLinks.length > 0) {
      const url = linkedinLinks.first().attr('href');
      // Clean up the URL
      const cleanUrl = url.replace(/\?.*$/, '').replace(/\/+$/, '');
      console.log(`    ✅ Found: ${cleanUrl}`);
      return {
        url: cleanUrl,
        confidence: 0.95,
        source: company.website
      };
    }
    
    // Try footer/social sections
    $('.footer, .social, [class*="social"], [class*="footer"]').find('a[href*="linkedin"]').each((i, elem) => {
      const url = $(elem).attr('href');
      if (url && url.includes('linkedin.com/company')) {
        const cleanUrl = url.replace(/\?.*$/, '').replace(/\/+$/, '');
        console.log(`    ✅ Found: ${cleanUrl}`);
        return {
          url: cleanUrl,
          confidence: 0.95,
          source: company.website
        };
      }
    });
    
    console.log(`    ❌ No LinkedIn found`);
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
  
  // Priority 1: Revenue (highest impact on metrics)
  if (!company.revenue) {
    const revenueData = await findRevenue(company);
    if (revenueData) {
      updates['Revenue'] = { rich_text: [{ text: { content: revenueData.text } }] };
      log.enrichments.revenue = revenueData;
      log.sources.push({ field: 'revenue', source: revenueData.source });
    }
  }
  
  // Priority 2: Funding
  if (!company.funding) {
    const fundingData = await findFunding(company);
    if (fundingData) {
      updates['Funding'] = { rich_text: [{ text: { content: fundingData.text } }] };
      log.enrichments.funding = fundingData;
      log.sources.push({ field: 'funding', source: fundingData.source });
    }
  }
  
  // Priority 3: LinkedIn
  if (!company.linkedin) {
    const linkedinData = await findLinkedIn(company);
    if (linkedinData) {
      updates['LinkedIn'] = { url: linkedinData.url };
      log.enrichments.linkedin = linkedinData;
      log.sources.push({ field: 'linkedin', source: linkedinData.source });
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
      return { success: true, log };
    } catch (error) {
      console.error(`  ❌ Update failed: ${error.message}`);
      return { success: false, log };
    }
  }
  
  return { success: true, log };
}

// Main function
async function main() {
  console.log('🚀 Leaderboard Enrichment Tool\n');
  console.log('Targeting high-value fields:');
  console.log('- Revenue (75% empty)');
  console.log('- Funding (68% empty)');
  console.log('- LinkedIn (48% empty)\n');
  
  const limit = parseInt(process.argv[2]) || 50;
  
  // Fetch companies with websites but missing key data
  const response = await notion.databases.query({
    database_id: dbId,
    filter: {
      and: [
        { property: 'Website', url: { is_not_empty: true } },
        {
          or: [
            { property: 'Revenue', rich_text: { is_empty: true } },
            { property: 'Funding', rich_text: { is_empty: true } },
            { property: 'LinkedIn', url: { is_empty: true } }
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
    revenue: page.properties.Revenue?.rich_text[0]?.plain_text,
    funding: page.properties.Funding?.rich_text[0]?.plain_text,
    linkedin: page.properties.LinkedIn?.url,
    yearFounded: page.properties['Year Founded']?.number
  }));
  
  console.log(`Found ${companies.length} companies to enrich\n`);
  
  // Track results
  const results = {
    processed: 0,
    revenue: 0,
    funding: 0,
    linkedin: 0,
    totalEnrichments: 0,
    logs: []
  };
  
  // Process each company
  for (const company of companies) {
    const result = await enrichCompany(company);
    results.processed++;
    results.logs.push(result.log);
    
    if (result.log.enrichments.revenue) results.revenue++;
    if (result.log.enrichments.funding) results.funding++;
    if (result.log.enrichments.linkedin) results.linkedin++;
    results.totalEnrichments += Object.keys(result.log.enrichments).length;
    
    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Save logs
  const logDir = path.join(__dirname, '../logs/leaderboard-enrichment');
  fs.mkdirSync(logDir, { recursive: true });
  
  const logFile = path.join(logDir, `${new Date().toISOString().split('T')[0]}_enrichment.json`);
  fs.writeFileSync(logFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    results,
    companies: results.logs
  }, null, 2));
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('✅ Leaderboard Enrichment Complete!\n');
  console.log(`📊 Results:`);
  console.log(`   Companies processed: ${results.processed}`);
  console.log(`   Revenue data found: ${results.revenue}`);
  console.log(`   Funding data found: ${results.funding}`);
  console.log(`   LinkedIn URLs found: ${results.linkedin}`);
  console.log(`   Total enrichments: ${results.totalEnrichments}`);
  console.log(`\n📁 Logs saved to: ${logFile}`);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { findRevenue, findFunding, findLinkedIn };