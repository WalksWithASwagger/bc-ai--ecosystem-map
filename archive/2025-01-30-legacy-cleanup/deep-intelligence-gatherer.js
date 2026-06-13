#!/usr/bin/env node
/**
 * Deep Intelligence Gatherer - Extract and validate company intelligence with citations
 * This tool gathers funding, revenue, employee count, and other deep intelligence
 * All data must be validated and cited before being added to the database
 * 
 * Usage: node tools/enhancement/deep-intelligence-gatherer.js [--limit=10] [--org="Company Name"]
 * 
 * Options:
 *   --limit=N     Process only N organizations (default: 10)
 *   --org="name"  Process specific organization by name
 *   --dryrun      Generate intelligence report without updating database
 *   --validate    Extra validation step with manual review
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
  config = require('../config');
} catch (e) {
  // Use environment variables
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  limit: 10,
  orgName: null,
  dryrun: true, // Default to dryrun for safety
  validate: true
};

args.forEach(arg => {
  if (arg.startsWith('--limit=')) {
    options.limit = parseInt(arg.split('=')[1], 10);
  } else if (arg.startsWith('--org=')) {
    options.orgName = arg.split('=')[1].replace(/"/g, '');
  } else if (arg === '--dryrun') {
    options.dryrun = true;
  } else if (arg === '--no-dryrun') {
    options.dryrun = false;
  } else if (arg === '--validate') {
    options.validate = true;
  }
});

// Notion setup
const notionToken = config.NOTION_TOKEN || process.env.NOTION_TOKEN;
const dbId = config.NOTION_DATABASE_ID || process.env.NOTION_DATABASE_ID;

if (!notionToken || !dbId) {
  console.error('❌ Notion credentials required. Set in config.js or environment.');
  process.exit(1);
}

const notion = new Client({ auth: notionToken });

// Intelligence data structure
class IntelligenceData {
  constructor(orgName) {
    this.organization = orgName;
    this.timestamp = new Date().toISOString();
    this.dataPoints = {};
    this.sources = [];
  }

  addDataPoint(category, data) {
    if (!this.dataPoints[category]) {
      this.dataPoints[category] = [];
    }
    
    const dataPoint = {
      value: data.value,
      source: data.source,
      sourceType: data.sourceType,
      extractedDate: new Date().toISOString(),
      confidence: data.confidence || 'medium',
      verificationMethod: data.verificationMethod || 'web scraping',
      notes: data.notes || '',
      rawContext: data.rawContext || ''
    };
    
    this.dataPoints[category].push(dataPoint);
    this.sources.push({
      url: data.source,
      type: data.sourceType,
      accessedDate: dataPoint.extractedDate
    });
  }

  getHighestConfidenceData(category) {
    if (!this.dataPoints[category]) return null;
    
    // Sort by confidence (high > medium > low)
    const sorted = this.dataPoints[category].sort((a, b) => {
      const confOrder = { high: 3, medium: 2, low: 1 };
      return confOrder[b.confidence] - confOrder[a.confidence];
    });
    
    return sorted[0];
  }

  generateReport() {
    let report = `# Intelligence Report: ${this.organization}\n\n`;
    report += `*Generated: ${new Date(this.timestamp).toLocaleString()}*\n\n`;
    
    // Verified facts section
    report += `## 🔍 Verified Intelligence\n\n`;
    
    const categories = ['funding', 'revenue', 'employees', 'yearFounded', 'keyPeople', 'acquisitions'];
    
    categories.forEach(category => {
      const data = this.getHighestConfidenceData(category);
      if (data && data.confidence !== 'low') {
        report += `### ${this.formatCategory(category)}\n`;
        report += `- **Value**: ${data.value}\n`;
        report += `- **Source**: [${data.sourceType}](${data.source})\n`;
        report += `- **Confidence**: ${data.confidence}\n`;
        report += `- **Verification**: ${data.verificationMethod}\n`;
        if (data.notes) report += `- **Notes**: ${data.notes}\n`;
        report += `- **Extracted**: ${new Date(data.extractedDate).toLocaleDateString()}\n\n`;
      }
    });
    
    // Low confidence / unverified section
    report += `## ⚠️ Unverified Intelligence\n\n`;
    
    categories.forEach(category => {
      const data = this.getHighestConfidenceData(category);
      if (data && data.confidence === 'low') {
        report += `### ${this.formatCategory(category)}\n`;
        report += `- **Value**: ${data.value}\n`;
        report += `- **Source**: [${data.sourceType}](${data.source})\n`;
        report += `- **Reason**: Low confidence - requires additional verification\n\n`;
      }
    });
    
    // Sources section
    report += `## 📚 All Sources Consulted\n\n`;
    const uniqueSources = this.sources.filter((source, index, self) =>
      index === self.findIndex((s) => s.url === source.url)
    );
    
    uniqueSources.forEach(source => {
      report += `- [${source.type}](${source.url}) - Accessed ${new Date(source.accessedDate).toLocaleDateString()}\n`;
    });
    
    return report;
  }

  formatCategory(category) {
    const formats = {
      funding: 'Funding Information',
      revenue: 'Revenue Data',
      employees: 'Employee Count',
      yearFounded: 'Year Founded',
      keyPeople: 'Key Leadership',
      acquisitions: 'Acquisitions & Exits'
    };
    return formats[category] || category;
  }
}

// Helper functions
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
    case 'number':
      return prop.number;
    default:
      return null;
  }
}

// Web scraping functions
async function fetchWebPage(url) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BC-AI-Intelligence-Bot/1.0)'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    return null;
  }
}

// Extract funding information from various sources
async function extractFundingData(orgName, website) {
  const intelligence = [];
  
  // 1. Check company website for funding info
  if (website) {
    const html = await fetchWebPage(website);
    if (html) {
      const $ = cheerio.load(html);
      
      // Look for funding mentions in about/press pages
      const aboutUrls = [];
      $('a').each((i, elem) => {
        const href = $(elem).attr('href');
        const text = $(elem).text().toLowerCase();
        if (href && (text.includes('about') || text.includes('press') || text.includes('news'))) {
          aboutUrls.push(new URL(href, website).href);
        }
      });
      
      // Check main page for funding mentions
      const bodyText = $('body').text();
      const fundingPatterns = [
        /\$[\d.]+[MBK]\s*(Series\s*[A-Z]|seed|funding|round)/gi,
        /raised\s*\$[\d.]+[MBK]/gi,
        /funding.*\$[\d.]+[MBK]/gi
      ];
      
      fundingPatterns.forEach(pattern => {
        const matches = bodyText.match(pattern);
        if (matches) {
          matches.forEach(match => {
            intelligence.push({
              value: match.trim(),
              source: website,
              sourceType: 'Company Website',
              confidence: 'medium',
              verificationMethod: 'Pattern matching on company website',
              rawContext: match
            });
          });
        }
      });
    }
  }
  
  // 2. Search news articles for funding announcements
  try {
    const searchQuery = encodeURIComponent(`"${orgName}" funding announcement site:techcrunch.com OR site:venturebeat.com`);
    const searchUrl = `https://www.google.com/search?q=${searchQuery}`;
    
    // Note: In production, you'd use a proper news API or web search API
    // For now, we'll note this as a data point that needs manual verification
    intelligence.push({
      value: 'Requires manual search',
      source: searchUrl,
      sourceType: 'News Search Required',
      confidence: 'low',
      verificationMethod: 'Manual news search needed',
      notes: 'Search TechCrunch, VentureBeat, and local BC tech news for funding announcements'
    });
  } catch (error) {
    console.error('Error searching for funding news:', error);
  }
  
  return intelligence;
}

// Extract employee count
async function extractEmployeeCount(orgName, website, linkedIn) {
  const intelligence = [];
  
  // Check LinkedIn if available
  if (linkedIn) {
    // Note: LinkedIn blocks scraping, so this needs manual verification
    intelligence.push({
      value: 'Requires LinkedIn verification',
      source: linkedIn,
      sourceType: 'LinkedIn Profile',
      confidence: 'low',
      verificationMethod: 'Manual LinkedIn check required',
      notes: 'Check company LinkedIn page for employee count'
    });
  }
  
  // Check website for team/about pages
  if (website) {
    const html = await fetchWebPage(website);
    if (html) {
      const $ = cheerio.load(html);
      const bodyText = $('body').text();
      
      // Look for employee count patterns
      const patterns = [
        /(\d+)\+?\s*employees?/gi,
        /team\s*of\s*(\d+)/gi,
        /(\d+)\s*people/gi
      ];
      
      patterns.forEach(pattern => {
        const matches = bodyText.match(pattern);
        if (matches) {
          matches.forEach(match => {
            intelligence.push({
              value: match.trim(),
              source: website,
              sourceType: 'Company Website',
              confidence: 'medium',
              verificationMethod: 'Pattern matching on company website',
              rawContext: match
            });
          });
        }
      });
    }
  }
  
  return intelligence;
}

// Extract year founded if missing
async function extractYearFounded(html) {
  const $ = cheerio.load(html);
  const bodyText = $('body').text();
  const yearData = [];
  
  // Look for founding year patterns
  const patterns = [
    /founded\s*(?:in\s*)?(\d{4})/gi,
    /established\s*(?:in\s*)?(\d{4})/gi,
    /since\s*(\d{4})/gi,
    /started\s*(?:in\s*)?(\d{4})/gi,
    /incorporated\s*(?:in\s*)?(\d{4})/gi
  ];
  
  patterns.forEach(pattern => {
    const matches = bodyText.matchAll(pattern);
    for (const match of matches) {
      const year = parseInt(match[1]);
      // Reasonable year range for tech companies
      if (year >= 1990 && year <= new Date().getFullYear()) {
        yearData.push({
          value: year,
          confidence: 'high',
          rawContext: match[0]
        });
      }
    }
  });
  
  return yearData;
}

// Extract key people information
async function extractKeyPeople(orgName, website) {
  const intelligence = [];
  
  if (website) {
    const html = await fetchWebPage(website);
    if (html) {
      const $ = cheerio.load(html);
      
      // Look for team/leadership pages
      const teamUrls = [];
      $('a').each((i, elem) => {
        const href = $(elem).attr('href');
        const text = $(elem).text().toLowerCase();
        if (href && (text.includes('team') || text.includes('leadership') || text.includes('about'))) {
          teamUrls.push(new URL(href, website).href);
        }
      });
      
      // Look for CEO/founder patterns
      const bodyText = $('body').text();
      const patterns = [
        /(CEO|Chief Executive Officer)[:\s]+([A-Z][a-z]+\s+[A-Z][a-z]+)/g,
        /(Founder|Co-founder)[:\s]+([A-Z][a-z]+\s+[A-Z][a-z]+)/g,
        /(CTO|Chief Technology Officer)[:\s]+([A-Z][a-z]+\s+[A-Z][a-z]+)/g
      ];
      
      patterns.forEach(pattern => {
        const matches = bodyText.matchAll(pattern);
        for (const match of matches) {
          intelligence.push({
            value: `${match[2]} - ${match[1]}`,
            source: website,
            sourceType: 'Company Website',
            confidence: 'medium',
            verificationMethod: 'Pattern matching for leadership titles',
            rawContext: match[0]
          });
        }
      });
      
      // If we found team pages, note them for manual review
      if (teamUrls.length > 0) {
        intelligence.push({
          value: 'Team pages found - manual review needed',
          source: teamUrls[0],
          sourceType: 'Company Team Page',
          confidence: 'low',
          verificationMethod: 'Manual review required',
          notes: `Found ${teamUrls.length} potential team/leadership pages`
        });
      }
    }
  }
  
  return intelligence;
}

// Main intelligence gathering function
async function gatherIntelligence(organization) {
  const orgName = getPropertyValue(organization, 'Name');
  const website = getPropertyValue(organization, 'Website');
  const linkedIn = getPropertyValue(organization, 'LinkedIn');
  
  console.log(`\n🔍 Gathering intelligence for: ${orgName}`);
  
  const intel = new IntelligenceData(orgName);
  
  // Gather funding data
  console.log('  📊 Extracting funding information...');
  const fundingData = await extractFundingData(orgName, website);
  fundingData.forEach(data => intel.addDataPoint('funding', data));
  
  // Gather employee data
  console.log('  👥 Extracting employee count...');
  const employeeData = await extractEmployeeCount(orgName, website, linkedIn);
  employeeData.forEach(data => intel.addDataPoint('employees', data));
  
  // Gather key people data
  console.log('  🎯 Extracting key people...');
  const keyPeopleData = await extractKeyPeople(orgName, website);
  keyPeopleData.forEach(data => intel.addDataPoint('keyPeople', data));
  
  // Check if organization has existing year founded
  const yearFounded = getPropertyValue(organization, 'Year Founded');
  if (!yearFounded && website) {
    console.log('  📅 Extracting founding year...');
    const html = await fetchWebPage(website);
    if (html) {
      const yearData = await extractYearFounded(html);
      yearData.forEach(data => {
        intel.addDataPoint('yearFounded', {
          value: data.value,
          source: website,
          sourceType: 'Company Website',
          confidence: data.confidence,
          verificationMethod: 'Pattern matching for founding year',
          rawContext: data.rawContext
        });
      });
    }
  }
  
  return intel;
}

// Main function
async function main() {
  console.log('🚀 BC AI Deep Intelligence Gatherer');
  console.log('==================================\n');
  
  if (options.dryrun) {
    console.log('🔒 Running in DRY RUN mode - no database updates will be made\n');
  }
  
  // Get organizations to process
  let organizations = [];
  
  if (options.orgName) {
    // Search for specific organization
    console.log(`Searching for organization: ${options.orgName}`);
    
    const response = await notion.databases.query({
      database_id: dbId,
      filter: {
        property: 'Name',
        title: { contains: options.orgName }
      }
    });
    
    organizations = response.results;
    console.log(`Found ${organizations.length} matching organizations`);
  } else {
    // Get organizations that need intelligence gathering
    // Priority: Has website but missing funding/employee data
    const response = await notion.databases.query({
      database_id: dbId,
      filter: {
        property: 'Website',
        url: { is_not_empty: true }
      },
      page_size: options.limit
    });
    
    organizations = response.results;
    console.log(`Found ${organizations.length} organizations to process`);
  }
  
  // Process each organization
  const reports = [];
  
  for (const org of organizations) {
    try {
      const intelligence = await gatherIntelligence(org);
      const report = intelligence.generateReport();
      
      reports.push({
        organization: intelligence.organization,
        pageId: org.id,
        report: report,
        intelligence: intelligence
      });
      
      console.log(`\n✅ Completed intelligence gathering for ${intelligence.organization}`);
      
    } catch (error) {
      console.error(`\n❌ Error processing ${getPropertyValue(org, 'Name')}:`, error.message);
    }
  }
  
  // Generate consolidated report
  const timestamp = new Date().toISOString().split('T')[0];
  const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  const reportDir = path.join(__dirname, '../../data/reports');
  const reportPath = path.join(reportDir, `${timestamp}_${time}_deep-intelligence.md`);
  
  let consolidatedReport = `# BC AI Deep Intelligence Report\n\n`;
  consolidatedReport += `*Generated: ${new Date().toLocaleString()}*\n\n`;
  consolidatedReport += `## Summary\n\n`;
  consolidatedReport += `- **Organizations Analyzed**: ${reports.length}\n`;
  consolidatedReport += `- **Mode**: ${options.dryrun ? 'DRY RUN' : 'LIVE'}\n`;
  consolidatedReport += `- **Validation Required**: ${options.validate ? 'YES' : 'NO'}\n\n`;
  
  // Add validation checklist
  if (options.validate) {
    consolidatedReport += `## ⚠️ VALIDATION REQUIRED\n\n`;
    consolidatedReport += `Before updating the database, please verify the following:\n\n`;
    consolidatedReport += `- [ ] All funding amounts are accurate and from reliable sources\n`;
    consolidatedReport += `- [ ] Employee counts are current (not outdated)\n`;
    consolidatedReport += `- [ ] Key people information is correct\n`;
    consolidatedReport += `- [ ] All sources are accessible and cite the claimed information\n`;
    consolidatedReport += `- [ ] No duplicate or conflicting information\n\n`;
  }
  
  // Add individual reports
  consolidatedReport += `## Organization Intelligence Reports\n\n`;
  
  reports.forEach((r, index) => {
    consolidatedReport += `---\n\n`;
    consolidatedReport += r.report;
    consolidatedReport += `\n`;
  });
  
  // Ensure reports directory exists
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  // Write report
  fs.writeFileSync(reportPath, consolidatedReport);
  console.log(`\n📄 Intelligence report written to: ${reportPath}`);
  
  // If not dryrun and validation passed, prepare update file
  if (!options.dryrun) {
    const updates = [];
    
    reports.forEach(r => {
      const update = {
        pageId: r.pageId,
        organization: r.organization,
        updates: {}
      };
      
      // Prepare updates based on highest confidence data
      const funding = r.intelligence.getHighestConfidenceData('funding');
      if (funding && funding.confidence !== 'low') {
        update.updates.funding = {
          value: funding.value,
          source: funding.source,
          lastVerified: funding.extractedDate
        };
      }
      
      const employees = r.intelligence.getHighestConfidenceData('employees');
      if (employees && employees.confidence !== 'low') {
        update.updates.employeeCount = {
          value: employees.value,
          source: employees.source,
          lastVerified: employees.extractedDate
        };
      }
      
      const yearFounded = r.intelligence.getHighestConfidenceData('yearFounded');
      if (yearFounded && yearFounded.confidence === 'high') {
        update.updates.yearFounded = {
          value: parseInt(yearFounded.value),
          source: yearFounded.source,
          lastVerified: yearFounded.extractedDate
        };
      }
      
      if (Object.keys(update.updates).length > 0) {
        updates.push(update);
      }
    });
    
    // Write updates file for review
    const updatesPath = path.join(reportDir, `${timestamp}_${time}_intelligence-updates.json`);
    fs.writeFileSync(updatesPath, JSON.stringify(updates, null, 2));
    console.log(`\n📝 Prepared updates file: ${updatesPath}`);
    console.log(`\n⚠️  Review the updates file and intelligence report before applying to database`);
  }
  
  console.log('\n✨ Intelligence gathering complete!');
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});