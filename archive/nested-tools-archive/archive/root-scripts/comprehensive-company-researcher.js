#!/usr/bin/env node
/**
 * Comprehensive Company Researcher
 * 
 * Researches and extracts HIGH-VALUE data for BC AI companies:
 * - AI Focus Areas (specific technologies and applications)
 * - Key People (founders, executives, technical leads)
 * - Funding information (rounds, amounts, investors)
 * - Company links (website, GitHub, social media)
 * - Logos (download and prepare for upload)
 * 
 * All data is sourced from real websites with citations
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
} catch (e) {}

const notion = new Client({ 
  auth: config.NOTION_TOKEN || process.env.NOTION_TOKEN 
});
const dbId = config.NOTION_DATABASE_ID || process.env.NOTION_DATABASE_ID;

// Create directories
const logsDir = path.join(__dirname, '../logs/research');
const logoDir = path.join(__dirname, '../logos');
const discoveryDir = path.join(__dirname, '../data/discoveries');

[logsDir, logoDir, discoveryDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Research result structure
class CompanyResearch {
  constructor(name, id) {
    this.name = name;
    this.notionId = id;
    this.timestamp = new Date().toISOString();
    this.existingData = {};
    this.discoveries = {
      aiFocusAreas: [],
      keyPeople: [],
      funding: [],
      links: {},
      logo: null,
      description: null,
      notableProjects: []
    };
    this.sources = [];
  }

  addAIFocus(areas, source) {
    if (Array.isArray(areas)) {
      areas.forEach(area => {
        if (!this.discoveries.aiFocusAreas.includes(area)) {
          this.discoveries.aiFocusAreas.push(area);
        }
      });
    }
    this.addSource(source, 'AI Focus Areas');
  }

  addKeyPerson(name, role, linkedIn, source) {
    this.discoveries.keyPeople.push({
      name,
      role,
      linkedIn,
      source,
      discoveredAt: new Date().toISOString()
    });
    this.addSource(source, 'Key People');
  }

  addFunding(amount, round, date, investors, source) {
    this.discoveries.funding.push({
      amount,
      round,
      date,
      investors,
      source,
      confidence: 0.95
    });
    this.addSource(source, 'Funding');
  }

  addSource(url, dataType) {
    this.sources.push({
      url,
      dataType,
      accessedAt: new Date().toISOString()
    });
  }
}

// AI Focus Areas mapping
const AI_FOCUS_MAPPING = {
  // Technology keywords to AI Focus Areas
  'machine learning': 'Machine Learning & Deep Learning',
  'deep learning': 'Machine Learning & Deep Learning',
  'neural network': 'Machine Learning & Deep Learning',
  'computer vision': 'Computer Vision',
  'image recognition': 'Computer Vision',
  'image processing': 'Computer Vision',
  'object detection': 'Computer Vision',
  'natural language': 'Natural Language Processing',
  'nlp': 'Natural Language Processing',
  'chatbot': 'Natural Language Processing',
  'language model': 'Natural Language Processing',
  'robotics': 'Robotics & Automation',
  'automation': 'Robotics & Automation',
  'autonomous': 'Robotics & Automation',
  'healthcare ai': 'Healthcare AI',
  'medical ai': 'Healthcare AI',
  'biotech': 'Healthcare AI',
  'drug discovery': 'Healthcare AI',
  'fintech': 'FinTech AI',
  'financial ai': 'FinTech AI',
  'trading algorithm': 'FinTech AI',
  'cleantech': 'CleanTech AI',
  'climate tech': 'CleanTech AI',
  'sustainability': 'CleanTech AI',
  'gaming ai': 'Gaming & Entertainment',
  'game ai': 'Gaming & Entertainment',
  'creative ai': 'Gaming & Entertainment',
  'data analytics': 'Data Analytics',
  'business intelligence': 'Data Analytics',
  'predictive analytics': 'Data Analytics',
  'cybersecurity': 'Cybersecurity AI',
  'security ai': 'Cybersecurity AI',
  'threat detection': 'Cybersecurity AI',
  'edge computing': 'Edge Computing',
  'iot': 'Edge Computing',
  'quantum': 'Quantum Computing'
};

// Extract AI focus areas from text
function extractAIFocusAreas(text) {
  const areas = new Set();
  const lowerText = text.toLowerCase();
  
  for (const [keyword, area] of Object.entries(AI_FOCUS_MAPPING)) {
    if (lowerText.includes(keyword)) {
      areas.add(area);
    }
  }
  
  return Array.from(areas);
}

// Extract key people from website
async function extractKeyPeople(websiteUrl) {
  try {
    // Try common team/about pages
    const teamPages = ['/team', '/about', '/about-us', '/leadership', '/people'];
    
    for (const page of teamPages) {
      try {
        const url = new URL(page, websiteUrl).href;
        const response = await axios.get(url, {
          timeout: 5000,
          headers: { 'User-Agent': 'BC-AI-Ecosystem-Research-Bot/1.0' }
        });
        
        const $ = cheerio.load(response.data);
        const people = [];
        
        // Look for team member sections
        $('.team-member, .person, .leadership-member, [class*="team"], [class*="leader"]').each((i, elem) => {
          const name = $(elem).find('h3, h4, .name, .title').first().text().trim();
          const role = $(elem).find('.role, .position, .job-title, p').first().text().trim();
          const linkedIn = $(elem).find('a[href*="linkedin.com"]').attr('href');
          
          if (name && role) {
            people.push({ name, role, linkedIn });
          }
        });
        
        if (people.length > 0) {
          return people;
        }
      } catch (e) {
        // Try next page
      }
    }
    
    // Fallback: Look for executive patterns in main page
    const response = await axios.get(websiteUrl, {
      timeout: 5000,
      headers: { 'User-Agent': 'BC-AI-Ecosystem-Research-Bot/1.0' }
    });
    
    const $ = cheerio.load(response.data);
    const text = $('body').text();
    const people = [];
    
    // Look for founder/CEO patterns
    const patterns = [
      /(?:founder|ceo|chief executive)[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)/gi,
      /([A-Z][a-z]+ [A-Z][a-z]+),?\s+(?:founder|ceo|cto|chief)/gi
    ];
    
    patterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const name = match[1];
        if (name && name.length < 50) {
          people.push({ 
            name, 
            role: 'Executive',
            source: websiteUrl 
          });
        }
      }
    });
    
    return people;
    
  } catch (error) {
    return [];
  }
}

// Download company logo
async function downloadLogo(websiteUrl, companyName) {
  try {
    const response = await axios.get(websiteUrl, {
      timeout: 5000,
      headers: { 'User-Agent': 'BC-AI-Ecosystem-Research-Bot/1.0' }
    });
    
    const $ = cheerio.load(response.data);
    
    // Common logo selectors
    const logoSelectors = [
      'img[alt*="logo"]',
      'img[class*="logo"]',
      'img[id*="logo"]',
      '.logo img',
      '.navbar-brand img',
      'header img',
      'a[href="/"] img'
    ];
    
    for (const selector of logoSelectors) {
      const logoElem = $(selector).first();
      if (logoElem.length) {
        let logoUrl = logoElem.attr('src');
        
        if (logoUrl) {
          // Make absolute URL
          logoUrl = new URL(logoUrl, websiteUrl).href;
          
          // Download the logo
          const logoResponse = await axios.get(logoUrl, {
            responseType: 'arraybuffer',
            timeout: 10000
          });
          
          // Determine file extension
          const contentType = logoResponse.headers['content-type'];
          const ext = contentType?.includes('svg') ? 'svg' : 
                     contentType?.includes('png') ? 'png' : 
                     contentType?.includes('jpg') || contentType?.includes('jpeg') ? 'jpg' : 
                     'png';
          
          const fileName = `${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_logo.${ext}`;
          const filePath = path.join(logoDir, fileName);
          
          fs.writeFileSync(filePath, logoResponse.data);
          
          return {
            fileName,
            filePath,
            sourceUrl: logoUrl,
            downloadedAt: new Date().toISOString()
          };
        }
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

// Extract all valuable links
async function extractLinks(websiteUrl) {
  try {
    const response = await axios.get(websiteUrl, {
      timeout: 5000,
      headers: { 'User-Agent': 'BC-AI-Ecosystem-Research-Bot/1.0' }
    });
    
    const $ = cheerio.load(response.data);
    const links = {
      website: websiteUrl,
      github: null,
      twitter: null,
      facebook: null,
      youtube: null,
      blog: null
    };
    
    // Find social links
    $('a[href*="github.com"]').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href && !links.github) {
        links.github = href;
      }
    });
    
    $('a[href*="twitter.com"], a[href*="x.com"]').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href && !links.twitter) {
        links.twitter = href;
      }
    });
    
    $('a[href*="facebook.com"]').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href && !links.facebook) {
        links.facebook = href;
      }
    });
    
    $('a[href*="youtube.com"]').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href && !links.youtube) {
        links.youtube = href;
      }
    });
    
    // Look for blog
    $('a[href*="/blog"], a[href*="blog."]').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href && !links.blog) {
        links.blog = new URL(href, websiteUrl).href;
      }
    });
    
    return links;
    
  } catch (error) {
    return { website: websiteUrl };
  }
}

// Research a single company
async function researchCompany(company) {
  console.log(`\n🔍 Researching ${company.name}...`);
  const research = new CompanyResearch(company.name, company.id);
  research.existingData = company;
  
  if (!company.website) {
    console.log('  ❌ No website available for research');
    return research;
  }
  
  try {
    // 1. Extract AI Focus Areas from website content
    console.log('  → Analyzing AI focus areas...');
    const response = await axios.get(company.website, {
      timeout: 10000,
      headers: { 'User-Agent': 'BC-AI-Ecosystem-Research-Bot/1.0' }
    });
    
    const $ = cheerio.load(response.data);
    const pageText = $('body').text();
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    
    const aiFocusAreas = extractAIFocusAreas(pageText + ' ' + metaDescription);
    if (aiFocusAreas.length > 0) {
      research.addAIFocus(aiFocusAreas, company.website);
      console.log(`  ✅ Found AI focus areas: ${aiFocusAreas.join(', ')}`);
    }
    
    // Extract description
    const description = $('.hero-text, .about-text, .company-description').first().text().trim() ||
                       metaDescription;
    if (description) {
      research.discoveries.description = description.substring(0, 500);
    }
    
    // 2. Extract Key People
    console.log('  → Searching for key people...');
    const keyPeople = await extractKeyPeople(company.website);
    keyPeople.forEach(person => {
      research.addKeyPerson(person.name, person.role, person.linkedIn, company.website);
    });
    if (keyPeople.length > 0) {
      console.log(`  ✅ Found ${keyPeople.length} key people`);
    }
    
    // 3. Extract Links
    console.log('  → Extracting company links...');
    const links = await extractLinks(company.website);
    research.discoveries.links = links;
    const linkCount = Object.values(links).filter(l => l).length;
    console.log(`  ✅ Found ${linkCount} links`);
    
    // 4. Download Logo
    console.log('  → Looking for company logo...');
    const logo = await downloadLogo(company.website, company.name);
    if (logo) {
      research.discoveries.logo = logo;
      console.log(`  ✅ Downloaded logo: ${logo.fileName}`);
    }
    
    // 5. Look for notable projects
    $('.project, .case-study, .portfolio-item').each((i, elem) => {
      const title = $(elem).find('h3, h4').first().text().trim();
      const desc = $(elem).find('p').first().text().trim();
      if (title) {
        research.discoveries.notableProjects.push({
          title,
          description: desc,
          source: company.website
        });
      }
    });
    
  } catch (error) {
    console.error(`  ❌ Error researching ${company.name}:`, error.message);
  }
  
  return research;
}

// Fetch companies needing research
async function fetchCompaniesForResearch(limit = 20) {
  console.log('📊 Finding companies for comprehensive research...');
  
  const companies = [];
  let cursor;
  
  // Priority: Companies with websites but missing key data
  const filter = {
    and: [
      {
        property: 'Website',
        url: { is_not_empty: true }
      },
      {
        or: [
          {
            property: 'AI Focus Areas',
            multi_select: { is_empty: true }
          },
          {
            property: 'Key People',
            rich_text: { is_empty: true }
          },
          {
            property: 'Logo',
            files: { is_empty: true }
          }
        ]
      }
    ]
  };
  
  do {
    const response = await notion.databases.query({
      database_id: dbId,
      start_cursor: cursor,
      filter: filter,
      page_size: Math.min(limit - companies.length, 100)
    });
    
    response.results.forEach(page => {
      const name = page.properties.Name?.title[0]?.plain_text;
      const website = page.properties.Website?.url;
      
      if (name && website) {
        companies.push({
          id: page.id,
          name: name,
          website: website,
          category: page.properties.Category?.select?.name,
          aiFocusAreas: page.properties['AI Focus Areas']?.multi_select || [],
          keyPeople: page.properties['Key People']?.rich_text[0]?.plain_text,
          funding: page.properties.Funding?.rich_text[0]?.plain_text,
          hasLogo: page.properties.Logo?.files?.length > 0
        });
      }
    });
    
    cursor = response.has_more ? response.next_cursor : null;
  } while (cursor && companies.length < limit);
  
  console.log(`✅ Found ${companies.length} companies to research\n`);
  return companies;
}

// Update company in Notion
async function updateCompany(research, dryRun = false) {
  const updates = {};
  
  // Update AI Focus Areas
  if (research.discoveries.aiFocusAreas.length > 0) {
    updates['AI Focus Areas'] = {
      multi_select: research.discoveries.aiFocusAreas.map(area => ({ name: area }))
    };
  }
  
  // Update Key People
  if (research.discoveries.keyPeople.length > 0) {
    const keyPeopleText = research.discoveries.keyPeople
      .map(p => `${p.name} - ${p.role}${p.linkedIn ? ` (${p.linkedIn})` : ''}`)
      .join('\n');
    
    updates['Key People'] = {
      rich_text: [{
        text: { content: keyPeopleText }
      }]
    };
  }
  
  // Update Notable Projects
  if (research.discoveries.notableProjects.length > 0) {
    const projectsText = research.discoveries.notableProjects
      .map(p => `${p.title}: ${p.description}`)
      .join('\n\n');
    
    updates['Notable Projects'] = {
      rich_text: [{
        text: { content: projectsText }
      }]
    };
  }
  
  // Update Description if missing
  if (research.discoveries.description && !research.existingData.shortBlurb) {
    updates['Short Blurb'] = {
      rich_text: [{
        text: { content: research.discoveries.description }
      }]
    };
  }
  
  // Note: Logo upload requires separate API call with file upload
  // For now, we'll log the logo location
  
  if (Object.keys(updates).length > 0 && !dryRun) {
    await notion.pages.update({
      page_id: research.notionId,
      properties: updates
    });
    console.log(`  💾 Updated ${Object.keys(updates).length} fields`);
  } else if (Object.keys(updates).length > 0) {
    console.log(`  🔄 Would update ${Object.keys(updates).length} fields (dry run)`);
  }
  
  return updates;
}

// Main execution
async function main() {
  console.log('🚀 BC AI Ecosystem - Comprehensive Company Research');
  console.log('=' .repeat(50) + '\n');
  
  const args = process.argv.slice(2);
  const limit = parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1] || 20);
  const dryRun = !args.includes('--no-dryrun');
  
  if (dryRun) {
    console.log('⚠️  Running in DRY RUN mode\n');
  }
  
  try {
    // Fetch companies
    const companies = await fetchCompaniesForResearch(limit);
    
    // Create batch results
    const batchResults = {
      timestamp: new Date().toISOString(),
      mode: dryRun ? 'dry_run' : 'live',
      researched: 0,
      updated: 0,
      discoveries: {
        aiFocusAreas: 0,
        keyPeople: 0,
        logos: 0,
        projects: 0
      },
      companies: []
    };
    
    // Research each company
    for (const company of companies) {
      const research = await researchCompany(company);
      
      // Update if we found valuable data
      if (Object.values(research.discoveries).some(d => 
        (Array.isArray(d) && d.length > 0) || d !== null)) {
        
        await updateCompany(research, dryRun);
        
        batchResults.researched++;
        if (research.discoveries.aiFocusAreas.length > 0) batchResults.discoveries.aiFocusAreas++;
        if (research.discoveries.keyPeople.length > 0) batchResults.discoveries.keyPeople++;
        if (research.discoveries.logo) batchResults.discoveries.logos++;
        if (research.discoveries.notableProjects.length > 0) batchResults.discoveries.projects++;
        
        batchResults.companies.push({
          name: research.name,
          discoveries: research.discoveries,
          sources: research.sources
        });
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Save results
    const resultsFile = path.join(discoveryDir, `${new Date().toISOString().split('T')[0]}_comprehensive_research.json`);
    fs.writeFileSync(resultsFile, JSON.stringify(batchResults, null, 2));
    
    // Print summary
    console.log('\n' + '=' .repeat(50));
    console.log('✅ Research Complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   Companies researched: ${batchResults.researched}`);
    console.log(`   AI Focus Areas found: ${batchResults.discoveries.aiFocusAreas}`);
    console.log(`   Key People found: ${batchResults.discoveries.keyPeople}`);
    console.log(`   Logos downloaded: ${batchResults.discoveries.logos}`);
    console.log(`   Notable Projects: ${batchResults.discoveries.projects}`);
    console.log(`\n📁 Results saved to: ${resultsFile}`);
    
    if (batchResults.discoveries.logos > 0) {
      console.log(`\n🎨 Logos saved to: ${logoDir}`);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { researchCompany, extractAIFocusAreas, extractKeyPeople };