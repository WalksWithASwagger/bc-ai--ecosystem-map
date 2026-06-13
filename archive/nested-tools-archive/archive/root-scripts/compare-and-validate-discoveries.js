#!/usr/bin/env node
/**
 * Compare and Validate Discoveries
 * 
 * This tool:
 * 1. Loads scraped data from various sources
 * 2. Compares with existing Notion database
 * 3. Identifies novel data points
 * 4. Validates data quality and citations
 * 5. Prepares updates for database enhancement
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');
require('dotenv').config();

// Configuration
let config = {};
try {
  config = require('./config');
} catch (e) {
  // Use environment variables
}

const notion = new Client({ 
  auth: config.NOTION_TOKEN || process.env.NOTION_TOKEN 
});
const dbId = config.NOTION_DATABASE_ID || process.env.NOTION_DATABASE_ID;

// Discovery data structure
class NovelDiscovery {
  constructor(orgName) {
    this.organization = orgName;
    this.timestamp = new Date().toISOString();
    this.existingData = {};
    this.novelData = {};
    this.sources = [];
    this.validationScore = 0;
    this.readyForUpdate = false;
  }

  addNovelData(field, value, source, confidence = 0.8) {
    if (!this.existingData[field] && value) {
      this.novelData[field] = {
        value,
        source,
        confidence,
        discoveredAt: new Date().toISOString()
      };
    }
  }

  validate() {
    // Calculate validation score based on sources and data quality
    let score = 0;
    
    // High value source bonus (BetaKit, government, etc)
    const hasHighValueSource = this.sources.some(s => 
      s.type?.includes('BetaKit') || 
      s.type?.includes('Crunchbase') ||
      s.type?.includes('Government')
    );
    if (hasHighValueSource) {
      score += 0.4;
    }

    // Check for high-confidence data
    const hasHighConfidence = Object.values(this.novelData).some(data => data.confidence >= 0.9);
    if (hasHighConfidence) {
      score += 0.3;
    }

    // Check for citations
    const hasCitations = Object.values(this.novelData).every(data => data.source);
    if (hasCitations) {
      score += 0.2;
    }

    // Check for critical fields
    const criticalFields = ['funding', 'yearFounded', 'employees', 'revenue'];
    const hasCriticalData = criticalFields.some(field => this.novelData[field]);
    if (hasCriticalData) {
      score += 0.3;
    }

    this.validationScore = Math.min(score, 1.0);
    this.readyForUpdate = this.validationScore >= 0.7 && Object.keys(this.novelData).length > 0;
  }
}

// Load existing Notion data
async function loadNotionData() {
  console.log('📊 Loading existing Notion database...');
  const organizations = new Map();
  
  let cursor;
  let count = 0;
  
  do {
    const response = await notion.databases.query({
      database_id: dbId,
      start_cursor: cursor,
      page_size: 100
    });
    
    response.results.forEach(page => {
      const name = page.properties.Name?.title[0]?.plain_text;
      if (name) {
        organizations.set(name.toLowerCase(), {
          id: page.id,
          name: name,
          website: page.properties.Website?.url,
          funding: page.properties.Funding?.rich_text[0]?.plain_text,
          revenue: page.properties.Revenue?.rich_text[0]?.plain_text,
          employees: page.properties['Employee Count']?.rich_text[0]?.plain_text,
          yearFounded: page.properties['Year Founded']?.number,
          keyPeople: page.properties['Key People']?.rich_text[0]?.plain_text,
          linkedin: page.properties.LinkedIn?.url,
          email: page.properties.Email?.email,
          phone: page.properties.Phone?.phone_number
        });
      }
    });
    
    cursor = response.has_more ? response.next_cursor : null;
    count += response.results.length;
    console.log(`  Loaded ${count} organizations...`);
    
  } while (cursor);
  
  console.log(`✅ Loaded ${organizations.size} organizations from Notion\n`);
  return organizations;
}

// Load discovery files
function loadDiscoveryFiles() {
  const discoveryDir = path.join(__dirname, '../data/discoveries');
  const discoveries = [];
  
  if (!fs.existsSync(discoveryDir)) {
    console.log('❌ No discovery directory found');
    return discoveries;
  }
  
  const files = fs.readdirSync(discoveryDir)
    .filter(f => f.endsWith('.json') && f.includes(new Date().toISOString().split('T')[0]));
  
  console.log(`📁 Found ${files.length} discovery files from today\n`);
  
  files.forEach(file => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(discoveryDir, file), 'utf8'));
      discoveries.push({
        source: file,
        data: data
      });
      console.log(`  ✅ Loaded ${file}`);
    } catch (error) {
      console.error(`  ❌ Error loading ${file}:`, error.message);
    }
  });
  
  return discoveries;
}

// Normalize company name for matching
function normalizeCompanyName(name) {
  return name
    .toLowerCase()
    .replace(/^(vancouver-based|vancouver's|vancouver|bc-based|bc|victoria-based|kelowna-based)\s+/i, '')
    .replace(/\s+(inc|ltd|corp|corporation|company|technologies|software|systems|labs|ai|cleantech)\.?$/i, '')
    .replace(/[^\w\s]/g, '')
    .trim();
}

// Find best match for company name
function findBestMatch(companyName, existingOrgs) {
  const normalized = normalizeCompanyName(companyName);
  
  // Try exact match first
  let match = existingOrgs.get(companyName.toLowerCase());
  if (match) return match;
  
  // Try normalized match
  match = existingOrgs.get(normalized);
  if (match) return match;
  
  // Try partial matches
  for (const [key, org] of existingOrgs) {
    const normalizedKey = normalizeCompanyName(key);
    if (normalizedKey === normalized || 
        normalized.includes(normalizedKey) || 
        normalizedKey.includes(normalized)) {
      console.log(`  🔄 Matched "${companyName}" to "${org.name}"`);
      return org;
    }
  }
  
  return null;
}

// Compare discoveries with existing data
function compareWithExisting(discoveries, existingOrgs) {
  const novelDiscoveries = [];
  
  discoveries.forEach(discovery => {
    // Handle different discovery formats
    const companies = discovery.data.companies?.ai || 
                     discovery.data.companies || 
                     [discovery.data];
    
    companies.forEach(company => {
      const name = company.name || company.companyName;
      if (!name) return;
      
      const existing = findBestMatch(name, existingOrgs);
      const novel = new NovelDiscovery(name);
      
      if (existing) {
        novel.existingData = existing;
      }
      
      // Check for novel funding data
      if (company.funding && company.funding.length > 0 && !existing?.funding) {
        const fundingText = company.funding.map(f => 
          `${f.amount} - ${f.program} (${f.date || 'Recent'})`
        ).join('; ');
        
        novel.addNovelData('funding', fundingText, company.funding[0].source, 0.95);
      }
      
      // Check for novel funding from BetaKit format
      if (company.fundingRounds && company.fundingRounds.length > 0 && !existing?.funding) {
        const fundingText = company.fundingRounds.map(r => 
          `${r.amountRaw} ${r.round} (${r.date || 'Recent'}) - Lead: ${r.leadInvestor || 'Unknown'}`
        ).join('; ');
        
        novel.addNovelData('funding', fundingText, company.fundingRounds[0].source, 0.95);
      }
      
      // Check for novel employee count
      if (company.employees && !existing?.employees) {
        let employeeText;
        if (company.employees.min) {
          employeeText = `${company.employees.min}-${company.employees.max || '+'} employees`;
        } else {
          employeeText = company.employees;
        }
        
        novel.addNovelData('employees', employeeText, discovery.source, 0.85);
      }
      
      // Check for novel founding year
      if (company.yearFounded && !existing?.yearFounded) {
        novel.addNovelData('yearFounded', company.yearFounded, discovery.source, 0.9);
      }
      
      // Check for novel website
      if (company.website && !existing?.website) {
        novel.addNovelData('website', company.website, discovery.source, 0.95);
      }
      
      // Check for novel LinkedIn
      if (company.linkedin && !existing?.linkedin) {
        novel.addNovelData('linkedin', company.linkedin, discovery.source, 0.9);
      }
      
      // Check for novel contact info
      if (company.contactEmail && !existing?.email) {
        novel.addNovelData('email', company.contactEmail, discovery.source, 0.85);
      }
      
      if (company.contactPhone && !existing?.phone) {
        novel.addNovelData('phone', company.contactPhone, discovery.source, 0.85);
      }
      
      // Add sources
      if (company.sources) {
        novel.sources = company.sources;
      } else {
        novel.sources = [{ type: discovery.source, url: 'scraped' }];
      }
      
      // Only include if we found novel data
      if (Object.keys(novel.novelData).length > 0) {
        novel.validate();
        novelDiscoveries.push(novel);
      }
    });
  });
  
  return novelDiscoveries;
}

// Generate update report
function generateReport(novelDiscoveries) {
  const dateStr = new Date().toISOString();
  const reportPath = path.join(__dirname, '../data/reports', `${dateStr.split('T')[0]}_novel_discoveries.md`);
  
  let report = `# Novel Data Discoveries Report\n\n`;
  report += `*Generated on ${dateStr}*\n\n`;
  
  // Summary statistics
  const stats = {
    totalDiscoveries: novelDiscoveries.length,
    fundingData: novelDiscoveries.filter(d => d.novelData.funding).length,
    employeeData: novelDiscoveries.filter(d => d.novelData.employees).length,
    foundingYears: novelDiscoveries.filter(d => d.novelData.yearFounded).length,
    websites: novelDiscoveries.filter(d => d.novelData.website).length,
    readyForUpdate: novelDiscoveries.filter(d => d.readyForUpdate).length
  };
  
  report += `## Summary\n\n`;
  report += `- **Total organizations with novel data**: ${stats.totalDiscoveries}\n`;
  report += `- **New funding records**: ${stats.fundingData}\n`;
  report += `- **New employee counts**: ${stats.employeeData}\n`;
  report += `- **New founding years**: ${stats.foundingYears}\n`;
  report += `- **New websites**: ${stats.websites}\n`;
  report += `- **Ready for database update**: ${stats.readyForUpdate}\n\n`;
  
  // High-value discoveries
  report += `## High-Value Discoveries (Validation Score >= 0.7)\n\n`;
  
  novelDiscoveries
    .filter(d => d.readyForUpdate)
    .sort((a, b) => b.validationScore - a.validationScore)
    .forEach(discovery => {
      report += `### ${discovery.organization}\n`;
      report += `**Validation Score**: ${(discovery.validationScore * 100).toFixed(0)}%\n\n`;
      
      Object.entries(discovery.novelData).forEach(([field, data]) => {
        report += `- **${field}**: ${data.value}\n`;
        report += `  - Source: ${data.source}\n`;
        report += `  - Confidence: ${(data.confidence * 100).toFixed(0)}%\n`;
      });
      
      if (discovery.existingData.id) {
        report += `\n[View in Notion](https://notion.so/${discovery.existingData.id.replace(/-/g, '')})\n`;
      }
      
      report += `\n---\n\n`;
    });
  
  // Save report
  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 Report saved to: ${reportPath}`);
  
  return stats;
}

// Generate JSON for batch updates
function generateUpdateFile(novelDiscoveries) {
  const updates = novelDiscoveries
    .filter(d => d.readyForUpdate && d.existingData.id)
    .map(discovery => {
      const update = {
        id: discovery.existingData.id,
        name: discovery.organization,
        properties: {}
      };
      
      // Map novel data to Notion properties
      if (discovery.novelData.funding) {
        update.properties.Funding = {
          rich_text: [{
            text: {
              content: `${discovery.novelData.funding.value}\n\nSource: ${discovery.novelData.funding.source}\nDiscovered: ${discovery.novelData.funding.discoveredAt}`
            }
          }]
        };
      }
      
      if (discovery.novelData.employees) {
        update.properties['Employee Count'] = {
          rich_text: [{
            text: {
              content: discovery.novelData.employees.value
            }
          }]
        };
      }
      
      if (discovery.novelData.yearFounded) {
        update.properties['Year Founded'] = {
          number: discovery.novelData.yearFounded.value
        };
      }
      
      if (discovery.novelData.website) {
        update.properties.Website = {
          url: discovery.novelData.website.value
        };
      }
      
      if (discovery.novelData.linkedin) {
        update.properties.LinkedIn = {
          url: discovery.novelData.linkedin.value
        };
      }
      
      if (discovery.novelData.email) {
        update.properties.Email = {
          email: discovery.novelData.email.value
        };
      }
      
      return update;
    });
  
  const updateFile = path.join(__dirname, '../data/imports', `novel_updates_${new Date().toISOString().split('T')[0]}.json`);
  fs.writeFileSync(updateFile, JSON.stringify(updates, null, 2));
  
  console.log(`\n📋 Update file saved to: ${updateFile}`);
  console.log(`   Contains ${updates.length} organizations ready for update`);
  
  return updates.length;
}

// Main execution
async function main() {
  console.log('🔍 BC AI Ecosystem - Discovery Comparison & Validation');
  console.log('=' .repeat(50) + '\n');
  
  try {
    // Load existing data
    const existingOrgs = await loadNotionData();
    
    // Load discoveries
    const discoveries = loadDiscoveryFiles();
    
    if (discoveries.length === 0) {
      console.log('❌ No discovery files found. Run scrapers first!');
      return;
    }
    
    // Compare and find novel data
    console.log('\n🔄 Comparing discoveries with existing data...\n');
    const novelDiscoveries = compareWithExisting(discoveries, existingOrgs);
    
    // Generate report
    const stats = generateReport(novelDiscoveries);
    
    // Generate update file
    const updateCount = generateUpdateFile(novelDiscoveries);
    
    // Print summary
    console.log('\n' + '=' .repeat(50));
    console.log('✅ Discovery Comparison Complete!\n');
    console.log(`📊 Found ${stats.totalDiscoveries} organizations with novel data:`);
    console.log(`   💰 ${stats.fundingData} new funding records`);
    console.log(`   👥 ${stats.employeeData} new employee counts`);
    console.log(`   📅 ${stats.foundingYears} new founding years`);
    console.log(`   🌐 ${stats.websites} new websites`);
    console.log(`\n🎯 ${updateCount} organizations ready for database update`);
    
    if (updateCount > 0) {
      console.log('\n💡 To apply updates, run:');
      console.log(`   node tools/utility/batch-update.js data/imports/novel_updates_${new Date().toISOString().split('T')[0]}.json`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { loadNotionData, compareWithExisting };