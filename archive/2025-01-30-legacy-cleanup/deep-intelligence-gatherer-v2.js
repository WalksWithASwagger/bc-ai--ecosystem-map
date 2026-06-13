#!/usr/bin/env node
/**
 * Deep Intelligence Gatherer V2 - Improved extraction with real data sources
 * This version focuses on extracting verifiable data with proper citations
 * 
 * Usage: node tools/enhancement/deep-intelligence-gatherer-v2.js [--limit=10] [--org="Company Name"]
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
  limit: 5,
  orgName: null,
  dryrun: true,
  validate: true
};

args.forEach(arg => {
  if (arg.startsWith('--limit=')) {
    options.limit = parseInt(arg.split('=')[1], 10);
  } else if (arg.startsWith('--org=')) {
    options.orgName = arg.split('=')[1].replace(/"/g, '');
  } else if (arg === '--no-dryrun') {
    options.dryrun = false;
  }
});

// Notion setup
const notionToken = config.NOTION_TOKEN || process.env.NOTION_TOKEN;
const dbId = config.NOTION_DATABASE_ID || process.env.NOTION_DATABASE_ID;

if (!notionToken || !dbId) {
  console.error('❌ Notion credentials required');
  process.exit(1);
}

const notion = new Client({ auth: notionToken });

// Intelligence data structure
class IntelligenceReport {
  constructor(orgName, orgId) {
    this.organization = orgName;
    this.organizationId = orgId;
    this.timestamp = new Date().toISOString();
    this.extractedData = {
      funding: [],
      employees: [],
      yearFounded: [],
      keyPeople: [],
      description: [],
      techStack: []
    };
    this.verifiedData = {};
    this.sources = [];
  }

  addData(category, data) {
    if (this.extractedData[category]) {
      this.extractedData[category].push({
        ...data,
        extractedAt: new Date().toISOString()
      });
      
      if (!this.sources.find(s => s.url === data.source)) {
        this.sources.push({
          url: data.source,
          type: data.sourceType,
          accessedAt: new Date().toISOString()
        });
      }
    }
  }

  processExtractedData() {
    // Process each category to find the best data
    Object.keys(this.extractedData).forEach(category => {
      const dataPoints = this.extractedData[category];
      if (dataPoints.length > 0) {
        // Sort by confidence
        const sorted = dataPoints.sort((a, b) => {
          const confMap = { high: 3, medium: 2, low: 1 };
          return (confMap[b.confidence] || 0) - (confMap[a.confidence] || 0);
        });
        
        // Take the highest confidence item
        if (sorted[0].confidence !== 'low') {
          this.verifiedData[category] = sorted[0];
        }
      }
    });
  }

  generateMarkdownReport() {
    let report = `# Deep Intelligence Report: ${this.organization}\n\n`;
    report += `*Generated: ${new Date(this.timestamp).toLocaleString()}*\n`;
    report += `*Organization ID: ${this.organizationId}*\n\n`;
    
    // Summary section
    report += `## 📊 Summary\n\n`;
    const verified = Object.keys(this.verifiedData).length;
    const categories = Object.keys(this.extractedData).length;
    report += `- **Data Categories Analyzed**: ${categories}\n`;
    report += `- **Verified Data Points**: ${verified}\n`;
    report += `- **Total Sources Consulted**: ${this.sources.length}\n\n`;
    
    // Verified data section
    if (verified > 0) {
      report += `## ✅ Verified Intelligence\n\n`;
      
      Object.entries(this.verifiedData).forEach(([category, data]) => {
        report += `### ${this.formatCategory(category)}\n`;
        report += `- **Value**: ${data.value}\n`;
        report += `- **Source**: [${data.sourceType}](${data.source})\n`;
        report += `- **Confidence**: ${data.confidence}\n`;
        if (data.context) {
          report += `- **Context**: "${data.context}"\n`;
        }
        report += `- **Extracted**: ${new Date(data.extractedAt).toLocaleDateString()}\n\n`;
      });
    }
    
    // Manual verification required section
    report += `## 🔍 Manual Verification Required\n\n`;
    report += `The following searches should be performed manually for comprehensive intelligence:\n\n`;
    
    // Funding search
    report += `### Funding Information\n`;
    report += `1. **Crunchbase**: Search for "${this.organization}" on [Crunchbase](https://www.crunchbase.com/)\n`;
    report += `2. **News Search**: [Google News Search](https://www.google.com/search?q="${encodeURIComponent(this.organization)}"+funding+announcement&tbm=nws)\n`;
    report += `3. **TechCrunch**: [Search TechCrunch](https://techcrunch.com/search/${encodeURIComponent(this.organization)})\n`;
    report += `4. **Local News**: Check [BC Tech News](https://www.bctechnology.com/news/), [Vancouver Tech Journal](https://vancouvertechjournal.com/)\n\n`;
    
    // LinkedIn verification
    report += `### Employee Count & Leadership\n`;
    report += `1. **LinkedIn Company Page**: Search for "${this.organization}" on [LinkedIn](https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(this.organization)})\n`;
    report += `2. **Check for**:\n`;
    report += `   - Current employee count\n`;
    report += `   - Key leadership profiles\n`;
    report += `   - Recent company updates\n\n`;
    
    // Additional sources
    report += `### Additional Intelligence Sources\n`;
    report += `1. **BC Company Registry**: Verify incorporation details\n`;
    report += `2. **Industry Reports**: Check CVCA, BC Tech Association reports\n`;
    report += `3. **Patent Database**: Search for company patents\n\n`;
    
    // Sources section
    report += `## 📚 Sources Accessed\n\n`;
    this.sources.forEach(source => {
      report += `- [${source.type}](${source.url}) - Accessed ${new Date(source.accessedAt).toLocaleDateString()}\n`;
    });
    
    // Raw data section (for debugging)
    report += `\n## 🔧 Raw Extracted Data\n\n`;
    report += `<details>\n<summary>Click to view raw data</summary>\n\n`;
    report += '```json\n';
    report += JSON.stringify(this.extractedData, null, 2);
    report += '\n```\n\n</details>\n';
    
    return report;
  }

  formatCategory(category) {
    const formats = {
      funding: '💰 Funding Information',
      employees: '👥 Employee Count',
      yearFounded: '📅 Year Founded',
      keyPeople: '👔 Key Leadership',
      description: '📝 Company Description',
      techStack: '🔧 Technology Stack'
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

// Improved web fetching with error handling
async function fetchWebPage(url, timeout = 10000) {
  try {
    console.log(`    Fetching: ${url}`);
    const response = await axios.get(url, {
      timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
      maxRedirects: 5
    });
    console.log(`    ✓ Successfully fetched (${response.status})`);
    return response.data;
  } catch (error) {
    console.log(`    ✗ Failed to fetch: ${error.message}`);
    return null;
  }
}

// Extract company description
function extractDescription(html, url) {
  const $ = cheerio.load(html);
  const descriptions = [];
  
  // Meta description
  const metaDesc = $('meta[name="description"]').attr('content') || 
                   $('meta[property="og:description"]').attr('content');
  if (metaDesc) {
    descriptions.push({
      value: metaDesc.trim(),
      source: url,
      sourceType: 'Website Meta Description',
      confidence: 'high'
    });
  }
  
  // Look for about section
  const aboutSelectors = [
    '.about-content',
    '#about',
    '[class*="about"]',
    'section:contains("About")',
    'div:contains("Who we are")'
  ];
  
  aboutSelectors.forEach(selector => {
    const aboutText = $(selector).first().text().trim();
    if (aboutText && aboutText.length > 50 && aboutText.length < 1000) {
      descriptions.push({
        value: aboutText.substring(0, 500) + '...',
        source: url,
        sourceType: 'Website About Section',
        confidence: 'medium'
      });
    }
  });
  
  return descriptions;
}

// Extract year founded with improved patterns
function extractYearFounded(html, url) {
  const $ = cheerio.load(html);
  const bodyText = $('body').text();
  const yearData = [];
  
  // Improved patterns
  const patterns = [
    /(?:founded|established|started|began|incorporated|launched)\s*(?:in\s*)?(\d{4})/gi,
    /since\s*(\d{4})/gi,
    /©\s*(\d{4})\s*-\s*\d{4}/gi, // Copyright range
    /(?:from|in)\s*(\d{4})\s*(?:to|till|-)/gi
  ];
  
  patterns.forEach(pattern => {
    const matches = [...bodyText.matchAll(pattern)];
    matches.forEach(match => {
      const year = parseInt(match[1]);
      if (year >= 1990 && year <= new Date().getFullYear()) {
        // Get context around the match
        const startIndex = Math.max(0, match.index - 50);
        const endIndex = Math.min(bodyText.length, match.index + match[0].length + 50);
        const context = bodyText.substring(startIndex, endIndex).trim();
        
        yearData.push({
          value: year,
          source: url,
          sourceType: 'Company Website',
          confidence: 'high',
          context: context
        });
      }
    });
  });
  
  // Remove duplicates
  const unique = yearData.filter((item, index, self) =>
    index === self.findIndex((t) => t.value === item.value)
  );
  
  return unique;
}

// Extract employee count with better patterns
function extractEmployeeCount(html, url) {
  const $ = cheerio.load(html);
  const bodyText = $('body').text();
  const employeeData = [];
  
  // Enhanced patterns
  const patterns = [
    /(\d+)\+?\s*(?:employees?|staff|people|team members?)/gi,
    /(?:team|staff|workforce)\s*of\s*(\d+)/gi,
    /(\d+)\s*(?:person|people)\s*(?:team|company|organization)/gi,
    /(?:employ|have)\s*(?:over|more than|around|approximately)?\s*(\d+)/gi
  ];
  
  patterns.forEach(pattern => {
    const matches = [...bodyText.matchAll(pattern)];
    matches.forEach(match => {
      const count = parseInt(match[1]);
      if (count >= 1 && count <= 100000) {
        // Get context
        const startIndex = Math.max(0, match.index - 50);
        const endIndex = Math.min(bodyText.length, match.index + match[0].length + 50);
        const context = bodyText.substring(startIndex, endIndex).trim();
        
        employeeData.push({
          value: `${count}+ employees`,
          source: url,
          sourceType: 'Company Website',
          confidence: 'medium',
          context: context
        });
      }
    });
  });
  
  return employeeData;
}

// Extract technology stack
function extractTechStack(html, url) {
  const $ = cheerio.load(html);
  const bodyText = $('body').text().toLowerCase();
  const techData = [];
  
  // Common AI/ML technologies to look for
  const technologies = [
    'tensorflow', 'pytorch', 'keras', 'scikit-learn',
    'opencv', 'nlp', 'computer vision', 'machine learning',
    'deep learning', 'neural network', 'artificial intelligence',
    'data science', 'predictive analytics', 'recommendation engine',
    'natural language processing', 'image recognition'
  ];
  
  const foundTech = technologies.filter(tech => bodyText.includes(tech));
  
  if (foundTech.length > 0) {
    techData.push({
      value: foundTech.join(', '),
      source: url,
      sourceType: 'Company Website',
      confidence: 'medium'
    });
  }
  
  return techData;
}

// Main intelligence gathering function
async function gatherIntelligence(organization) {
  const orgName = getPropertyValue(organization, 'Name');
  const website = getPropertyValue(organization, 'Website');
  const linkedIn = getPropertyValue(organization, 'LinkedIn');
  const existingBlurb = getPropertyValue(organization, 'Short Blurb');
  
  console.log(`\n🔍 Analyzing: ${orgName}`);
  console.log(`  📌 Website: ${website || 'Not provided'}`);
  console.log(`  📌 LinkedIn: ${linkedIn || 'Not provided'}`);
  
  const report = new IntelligenceReport(orgName, organization.id);
  
  // Extract from website
  if (website) {
    console.log(`  🌐 Extracting from website...`);
    const html = await fetchWebPage(website);
    
    if (html) {
      // Extract descriptions
      if (!existingBlurb) {
        const descriptions = extractDescription(html, website);
        descriptions.forEach(desc => report.addData('description', desc));
      }
      
      // Extract year founded
      const years = extractYearFounded(html, website);
      years.forEach(year => report.addData('yearFounded', year));
      
      // Extract employee count
      const employees = extractEmployeeCount(html, website);
      employees.forEach(emp => report.addData('employees', emp));
      
      // Extract tech stack
      const tech = extractTechStack(html, website);
      tech.forEach(t => report.addData('techStack', t));
      
      // Check for about/team pages
      const $ = cheerio.load(html);
      const aboutLinks = [];
      $('a').each((i, elem) => {
        const href = $(elem).attr('href');
        const text = $(elem).text().toLowerCase();
        if (href && (text.includes('about') || text.includes('team') || text.includes('company'))) {
          const fullUrl = new URL(href, website).href;
          if (!aboutLinks.includes(fullUrl) && fullUrl !== website) {
            aboutLinks.push(fullUrl);
          }
        }
      });
      
      // Extract from about pages (limit to 2)
      for (const aboutUrl of aboutLinks.slice(0, 2)) {
        console.log(`  📄 Checking ${aboutUrl}...`);
        const aboutHtml = await fetchWebPage(aboutUrl);
        if (aboutHtml) {
          const years = extractYearFounded(aboutHtml, aboutUrl);
          years.forEach(year => report.addData('yearFounded', year));
          
          const employees = extractEmployeeCount(aboutHtml, aboutUrl);
          employees.forEach(emp => report.addData('employees', emp));
        }
      }
    }
  }
  
  // Add manual search requirements
  report.addData('funding', {
    value: 'Manual search required',
    source: `https://www.crunchbase.com/organization/${orgName.toLowerCase().replace(/\s+/g, '-')}`,
    sourceType: 'Crunchbase Search',
    confidence: 'low'
  });
  
  if (linkedIn) {
    report.addData('employees', {
      value: 'Check LinkedIn for current count',
      source: linkedIn,
      sourceType: 'LinkedIn Company Page',
      confidence: 'low'
    });
  }
  
  // Process and finalize data
  report.processExtractedData();
  
  console.log(`  ✅ Analysis complete`);
  
  return report;
}

// Main execution
async function main() {
  console.log('🚀 BC AI Deep Intelligence Gatherer V2');
  console.log('=====================================\n');
  
  if (options.dryrun) {
    console.log('🔒 DRY RUN MODE - No database updates\n');
  }
  
  // Get organizations
  let organizations = [];
  
  if (options.orgName) {
    const response = await notion.databases.query({
      database_id: dbId,
      filter: {
        property: 'Name',
        title: { contains: options.orgName }
      }
    });
    organizations = response.results;
  } else {
    const response = await notion.databases.query({
      database_id: dbId,
      filter: {
        property: 'Website',
        url: { is_not_empty: true }
      },
      page_size: options.limit
    });
    organizations = response.results;
  }
  
  console.log(`📊 Found ${organizations.length} organizations to analyze\n`);
  
  // Process each organization
  const reports = [];
  
  for (const org of organizations) {
    try {
      const report = await gatherIntelligence(org);
      reports.push(report);
    } catch (error) {
      console.error(`❌ Error processing ${getPropertyValue(org, 'Name')}: ${error.message}`);
    }
  }
  
  // Generate consolidated report
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = path.join(__dirname, '../../data/reports');
  const reportPath = path.join(reportDir, `${timestamp}_deep-intelligence-v2.md`);
  
  let consolidatedReport = `# BC AI Deep Intelligence Report V2\n\n`;
  consolidatedReport += `*Generated: ${new Date().toLocaleString()}*\n\n`;
  consolidatedReport += `## Executive Summary\n\n`;
  consolidatedReport += `- **Organizations Analyzed**: ${reports.length}\n`;
  consolidatedReport += `- **Total Data Points Extracted**: ${reports.reduce((sum, r) => sum + Object.keys(r.verifiedData).length, 0)}\n`;
  consolidatedReport += `- **Mode**: ${options.dryrun ? 'DRY RUN' : 'LIVE'}\n\n`;
  
  // Individual reports
  reports.forEach((report, index) => {
    if (index > 0) consolidatedReport += '\n---\n\n';
    consolidatedReport += report.generateMarkdownReport();
  });
  
  // Ensure directory exists
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  // Write report
  fs.writeFileSync(reportPath, consolidatedReport);
  console.log(`\n📄 Report saved to: ${reportPath}`);
  
  // Generate update JSON for review
  const updates = reports.map(report => ({
    pageId: report.organizationId,
    organization: report.organization,
    verifiedData: report.verifiedData,
    requiresManualVerification: Object.keys(report.extractedData).filter(
      key => !report.verifiedData[key] && report.extractedData[key].length > 0
    )
  }));
  
  const updatesPath = path.join(reportDir, `${timestamp}_intelligence-updates-v2.json`);
  fs.writeFileSync(updatesPath, JSON.stringify(updates, null, 2));
  console.log(`📝 Updates file saved to: ${updatesPath}`);
  
  console.log('\n✨ Intelligence gathering complete!');
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});