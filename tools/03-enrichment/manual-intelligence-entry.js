#!/usr/bin/env node
/**
 * Manual Intelligence Entry Tool
 * For entering verified data from Crunchbase, LinkedIn, and other sources
 * Includes validation and citation tracking
 * 
 * Usage: node tools/enhancement/manual-intelligence-entry.js
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');
const readline = require('readline');
require('dotenv').config();

// Configuration
let config = {};
try {
  config = require('../config');
} catch (e) {
  // Use environment variables
}

// Notion setup
const notionToken = config.NOTION_TOKEN || process.env.NOTION_TOKEN;
const dbId = config.NOTION_DATABASE_ID || process.env.NOTION_DATABASE_ID;

if (!notionToken || !dbId) {
  console.error('❌ Notion credentials required');
  process.exit(1);
}

const notion = new Client({ auth: notionToken });

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Data entry class
class ManualIntelligenceEntry {
  constructor() {
    this.entries = [];
    this.currentEntry = null;
  }

  async startNewEntry() {
    console.log('\n📝 New Intelligence Entry\n');
    
    this.currentEntry = {
      organization: '',
      organizationId: '',
      data: {},
      sources: {},
      timestamp: new Date().toISOString()
    };
    
    // Get organization name
    this.currentEntry.organization = await question('Organization name: ');
    
    // Search for organization in database
    await this.findOrganization();
    
    if (!this.currentEntry.organizationId) {
      console.log('❌ Organization not found in database');
      return false;
    }
    
    // Data entry menu
    let done = false;
    while (!done) {
      console.log('\n📊 What data would you like to add?');
      console.log('1. Funding information');
      console.log('2. Employee count');
      console.log('3. Year founded');
      console.log('4. Revenue');
      console.log('5. Key people/Leadership');
      console.log('6. Company description');
      console.log('7. Recent news/Updates');
      console.log('8. Competitors');
      console.log('9. Technology stack');
      console.log('0. Done with this organization');
      
      const choice = await question('\nSelect option (0-9): ');
      
      switch(choice) {
        case '1':
          await this.enterFunding();
          break;
        case '2':
          await this.enterEmployees();
          break;
        case '3':
          await this.enterYearFounded();
          break;
        case '4':
          await this.enterRevenue();
          break;
        case '5':
          await this.enterKeyPeople();
          break;
        case '6':
          await this.enterDescription();
          break;
        case '7':
          await this.enterNews();
          break;
        case '8':
          await this.enterCompetitors();
          break;
        case '9':
          await this.enterTechStack();
          break;
        case '0':
          done = true;
          break;
        default:
          console.log('Invalid option');
      }
    }
    
    // Save entry
    if (Object.keys(this.currentEntry.data).length > 0) {
      this.entries.push(this.currentEntry);
      console.log(`\n✅ Entry saved for ${this.currentEntry.organization}`);
      return true;
    }
    
    return false;
  }

  async findOrganization() {
    try {
      const response = await notion.databases.query({
        database_id: dbId,
        filter: {
          property: 'Name',
          title: { contains: this.currentEntry.organization }
        }
      });
      
      if (response.results.length === 0) {
        return;
      }
      
      if (response.results.length === 1) {
        this.currentEntry.organizationId = response.results[0].id;
        console.log(`✓ Found: ${this.currentEntry.organization}`);
        return;
      }
      
      // Multiple matches
      console.log('\nMultiple organizations found:');
      response.results.forEach((org, index) => {
        const name = org.properties.Name.title[0]?.plain_text || 'Unknown';
        const city = org.properties['City/Region']?.rich_text[0]?.plain_text || 'Unknown';
        console.log(`${index + 1}. ${name} (${city})`);
      });
      
      const selection = await question('Select organization number: ');
      const index = parseInt(selection) - 1;
      
      if (index >= 0 && index < response.results.length) {
        this.currentEntry.organizationId = response.results[index].id;
        this.currentEntry.organization = response.results[index].properties.Name.title[0]?.plain_text;
        console.log(`✓ Selected: ${this.currentEntry.organization}`);
      }
      
    } catch (error) {
      console.error('Error searching database:', error.message);
    }
  }

  async enterFunding() {
    console.log('\n💰 Funding Information');
    
    const funding = {};
    
    // Get funding details
    funding.amount = await question('Funding amount (e.g., $10M, $5.5M Series A): ');
    funding.round = await question('Funding round (e.g., Seed, Series A, Series B): ');
    funding.date = await question('Funding date (YYYY-MM-DD or YYYY-MM): ');
    funding.leadInvestor = await question('Lead investor (optional): ');
    funding.otherInvestors = await question('Other investors (comma separated, optional): ');
    
    // Get source
    console.log('\nSource information:');
    const source = {};
    source.url = await question('Source URL: ');
    source.type = await this.selectSourceType();
    source.accessDate = new Date().toISOString();
    
    // Add confidence
    console.log('\nConfidence level:');
    console.log('1. High (official announcement, press release)');
    console.log('2. Medium (reputable news source)');
    console.log('3. Low (unverified or older source)');
    const confidence = await question('Select confidence (1-3): ');
    
    funding.confidence = ['high', 'medium', 'low'][parseInt(confidence) - 1] || 'medium';
    
    // Format the funding entry
    const fundingStr = funding.round ? 
      `${funding.amount} ${funding.round} (${funding.date})` :
      `${funding.amount} funding (${funding.date})`;
    
    // Add to current entry
    if (!this.currentEntry.data.funding) {
      this.currentEntry.data.funding = [];
    }
    
    this.currentEntry.data.funding.push({
      value: fundingStr,
      details: funding,
      source: source,
      confidence: funding.confidence
    });
    
    console.log('✓ Funding information added');
  }

  async enterEmployees() {
    console.log('\n👥 Employee Count');
    
    const employees = {};
    employees.count = await question('Employee count (e.g., 50, 100-200, 500+): ');
    employees.asOf = await question('As of date (YYYY-MM-DD): ');
    employees.growthNote = await question('Growth note (optional, e.g., "doubled in last year"): ');
    
    // Get source
    const source = {};
    source.url = await question('Source URL (LinkedIn company page preferred): ');
    source.type = await this.selectSourceType();
    source.accessDate = new Date().toISOString();
    
    // Add to current entry
    if (!this.currentEntry.data.employees) {
      this.currentEntry.data.employees = [];
    }
    
    this.currentEntry.data.employees.push({
      value: `${employees.count} employees`,
      details: employees,
      source: source,
      confidence: source.type.includes('LinkedIn') ? 'high' : 'medium'
    });
    
    console.log('✓ Employee count added');
  }

  async enterYearFounded() {
    console.log('\n📅 Year Founded');
    
    const year = await question('Year founded (YYYY): ');
    const source = {};
    source.url = await question('Source URL: ');
    source.type = await this.selectSourceType();
    source.accessDate = new Date().toISOString();
    
    this.currentEntry.data.yearFounded = {
      value: parseInt(year),
      source: source,
      confidence: 'high'
    };
    
    console.log('✓ Year founded added');
  }

  async enterRevenue() {
    console.log('\n💵 Revenue Information');
    
    const revenue = {};
    revenue.amount = await question('Revenue (e.g., $10M ARR, $50M annual): ');
    revenue.year = await question('Year or period: ');
    revenue.type = await question('Type (ARR, annual revenue, run rate): ');
    revenue.growth = await question('Growth rate (optional, e.g., "100% YoY"): ');
    
    const source = {};
    source.url = await question('Source URL: ');
    source.type = await this.selectSourceType();
    source.accessDate = new Date().toISOString();
    
    if (!this.currentEntry.data.revenue) {
      this.currentEntry.data.revenue = [];
    }
    
    this.currentEntry.data.revenue.push({
      value: `${revenue.amount} ${revenue.type} (${revenue.year})`,
      details: revenue,
      source: source,
      confidence: 'medium'
    });
    
    console.log('✓ Revenue information added');
  }

  async enterKeyPeople() {
    console.log('\n👔 Key People/Leadership');
    
    const people = [];
    let addMore = true;
    
    while (addMore) {
      const person = {};
      person.name = await question('Name: ');
      person.title = await question('Title: ');
      person.linkedIn = await question('LinkedIn URL (optional): ');
      person.bio = await question('Brief bio (optional): ');
      
      people.push(person);
      
      const more = await question('Add another person? (y/n): ');
      addMore = more.toLowerCase() === 'y';
    }
    
    const source = {};
    source.url = await question('Source URL: ');
    source.type = await this.selectSourceType();
    source.accessDate = new Date().toISOString();
    
    this.currentEntry.data.keyPeople = {
      value: people.map(p => `${p.name} (${p.title})`).join(', '),
      details: people,
      source: source,
      confidence: 'high'
    };
    
    console.log('✓ Key people added');
  }

  async enterDescription() {
    console.log('\n📝 Company Description');
    
    const description = await question('Company description (brief): ');
    const source = {};
    source.url = await question('Source URL: ');
    source.type = await this.selectSourceType();
    source.accessDate = new Date().toISOString();
    
    this.currentEntry.data.description = {
      value: description,
      source: source,
      confidence: 'high'
    };
    
    console.log('✓ Description added');
  }

  async enterNews() {
    console.log('\n📰 Recent News/Updates');
    
    const news = {};
    news.headline = await question('Headline: ');
    news.summary = await question('Brief summary: ');
    news.date = await question('Date (YYYY-MM-DD): ');
    
    const source = {};
    source.url = await question('Article URL: ');
    source.type = 'News Article';
    source.publication = await question('Publication name: ');
    source.accessDate = new Date().toISOString();
    
    if (!this.currentEntry.data.news) {
      this.currentEntry.data.news = [];
    }
    
    this.currentEntry.data.news.push({
      value: news.headline,
      details: news,
      source: source,
      confidence: 'high'
    });
    
    console.log('✓ News added');
  }

  async enterCompetitors() {
    console.log('\n🎯 Competitors');
    
    const competitors = await question('List main competitors (comma separated): ');
    const source = {};
    source.url = await question('Source URL: ');
    source.type = await this.selectSourceType();
    source.accessDate = new Date().toISOString();
    
    this.currentEntry.data.competitors = {
      value: competitors,
      source: source,
      confidence: 'medium'
    };
    
    console.log('✓ Competitors added');
  }

  async enterTechStack() {
    console.log('\n🔧 Technology Stack');
    
    const tech = await question('Technologies used (comma separated): ');
    const aiTech = await question('AI/ML specific tech (e.g., TensorFlow, PyTorch): ');
    
    const source = {};
    source.url = await question('Source URL: ');
    source.type = await this.selectSourceType();
    source.accessDate = new Date().toISOString();
    
    this.currentEntry.data.techStack = {
      value: `${tech}${aiTech ? ', ' + aiTech : ''}`,
      details: {
        general: tech,
        ai: aiTech
      },
      source: source,
      confidence: 'medium'
    };
    
    console.log('✓ Tech stack added');
  }

  async selectSourceType() {
    console.log('Source type:');
    console.log('1. Crunchbase');
    console.log('2. LinkedIn');
    console.log('3. Company Website');
    console.log('4. News Article');
    console.log('5. Press Release');
    console.log('6. Industry Report');
    console.log('7. Other');
    
    const choice = await question('Select source type (1-7): ');
    const types = [
      'Crunchbase',
      'LinkedIn',
      'Company Website',
      'News Article',
      'Press Release',
      'Industry Report',
      'Other'
    ];
    
    return types[parseInt(choice) - 1] || 'Other';
  }

  generateReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(__dirname, '../../data/reports', `${timestamp}_manual-intelligence-entry.md`);
    
    let report = `# Manual Intelligence Entry Report\n\n`;
    report += `*Generated: ${new Date().toLocaleString()}*\n`;
    report += `*Entries: ${this.entries.length}*\n\n`;
    
    this.entries.forEach((entry, index) => {
      if (index > 0) report += '\n---\n\n';
      
      report += `## ${entry.organization}\n`;
      report += `*Organization ID: ${entry.organizationId}*\n\n`;
      
      Object.entries(entry.data).forEach(([category, data]) => {
        report += `### ${this.formatCategory(category)}\n`;
        
        if (Array.isArray(data)) {
          data.forEach(item => {
            report += `- **Value**: ${item.value}\n`;
            report += `- **Source**: [${item.source.type}](${item.source.url})\n`;
            report += `- **Confidence**: ${item.confidence}\n`;
            if (item.details) {
              report += `- **Details**: ${JSON.stringify(item.details)}\n`;
            }
            report += `\n`;
          });
        } else {
          report += `- **Value**: ${data.value}\n`;
          report += `- **Source**: [${data.source.type}](${data.source.url})\n`;
          report += `- **Confidence**: ${data.confidence || 'medium'}\n`;
          if (data.details) {
            report += `- **Details**: ${JSON.stringify(data.details)}\n`;
          }
          report += `\n`;
        }
      });
    });
    
    // Write report
    const dir = path.dirname(reportPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, report);
    console.log(`\n📄 Report saved to: ${reportPath}`);
    
    // Generate JSON for database updates
    const jsonPath = reportPath.replace('.md', '.json');
    fs.writeFileSync(jsonPath, JSON.stringify(this.entries, null, 2));
    console.log(`📝 JSON data saved to: ${jsonPath}`);
    
    return { reportPath, jsonPath };
  }

  formatCategory(category) {
    const formats = {
      funding: '💰 Funding',
      employees: '👥 Employees',
      yearFounded: '📅 Year Founded',
      keyPeople: '👔 Leadership',
      revenue: '💵 Revenue',
      description: '📝 Description',
      news: '📰 Recent News',
      competitors: '🎯 Competitors',
      techStack: '🔧 Technology'
    };
    return formats[category] || category;
  }
}

// Main execution
async function main() {
  console.log('🚀 BC AI Manual Intelligence Entry Tool');
  console.log('======================================\n');
  console.log('This tool helps you manually enter verified intelligence');
  console.log('from Crunchbase, LinkedIn, and other sources.\n');
  
  const entry = new ManualIntelligenceEntry();
  let continueEntry = true;
  
  while (continueEntry) {
    await entry.startNewEntry();
    
    const more = await question('\nAdd another organization? (y/n): ');
    continueEntry = more.toLowerCase() === 'y';
  }
  
  if (entry.entries.length > 0) {
    console.log(`\n✅ Total entries: ${entry.entries.length}`);
    
    const save = await question('Generate report and save data? (y/n): ');
    if (save.toLowerCase() === 'y') {
      const { reportPath, jsonPath } = entry.generateReport();
      
      console.log('\n✨ Data entry complete!');
      console.log('\nNext steps:');
      console.log('1. Review the report:', reportPath);
      console.log('2. Validate the JSON data:', jsonPath);
      console.log('3. Apply updates using:');
      console.log(`   node tools/enhancement/apply-validated-intelligence.js --updates=${jsonPath}`);
    }
  }
  
  rl.close();
}

// Run
main().catch(error => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});