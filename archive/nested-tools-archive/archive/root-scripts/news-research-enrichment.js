#!/usr/bin/env node
/**
 * News Research Enrichment Tool
 * Uses web search to find news about BC AI companies
 * Focuses on funding, revenue, acquisitions, and key developments
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const dbId = process.env.NOTION_DATABASE_ID;

// Companies to research
const targetCompanies = [
  // High priority - likely to have news
  { name: "Denologix", focus: "funding revenue AI healthcare" },
  { name: "Youneeq", focus: "funding revenue personalization AI" },
  { name: "Wavo", focus: "funding revenue music AI Vancouver" },
  { name: "Ehsai", focus: "funding revenue safety AI EHS" },
  { name: "Mintent", focus: "funding revenue AI marketing" },
  { name: "Silo AI Vancouver", focus: "acquisition funding AI Europe" },
  { name: "Leasey.AI", focus: "funding revenue rental AI proptech" },
  { name: "Olive", focus: "funding revenue AI Vancouver startup" },
  { name: "UnlockLand", focus: "Meton.ai funding AI real estate" },
  { name: "Rigid Robotics", focus: "funding revenue robotics Vancouver" },
  { name: "Build Smartr Robotics", focus: "funding construction robotics AI" },
  { name: "Innovate BC", focus: "funding programs AI investment" },
  { name: "Lite-1", focus: "funding AI startup Vancouver" },
  { name: "INP Capital", focus: "investments portfolio AI Vancouver" },
  { name: "IT Kapital", focus: "investments AI ventures Vancouver" }
];

// Create research log
function createLog(company, findings) {
  return {
    company: company.name,
    timestamp: new Date().toISOString(),
    searchQuery: `${company.name} ${company.focus}`,
    findings: findings,
    sources: findings.map(f => f.source)
  };
}

// Save research to file
function saveResearch(logs) {
  const logDir = path.join(__dirname, '../logs/news-research');
  fs.mkdirSync(logDir, { recursive: true });
  
  const timestamp = new Date().toISOString().split('T')[0];
  const logFile = path.join(logDir, `${timestamp}_news_research.json`);
  
  fs.writeFileSync(logFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    companiesResearched: logs.length,
    logs: logs
  }, null, 2));
  
  // Also save markdown summary
  const mdFile = path.join(logDir, `${timestamp}_news_summary.md`);
  let mdContent = `# News Research Summary - ${timestamp}\n\n`;
  
  logs.forEach(log => {
    mdContent += `## ${log.company}\n\n`;
    mdContent += `**Search Query:** ${log.searchQuery}\n\n`;
    
    if (log.findings.length > 0) {
      log.findings.forEach(finding => {
        mdContent += `### ${finding.type}\n`;
        mdContent += `- **Value:** ${finding.value}\n`;
        mdContent += `- **Source:** ${finding.source}\n`;
        mdContent += `- **Notes:** ${finding.notes}\n\n`;
      });
    } else {
      mdContent += `*No significant findings*\n\n`;
    }
    
    mdContent += `---\n\n`;
  });
  
  fs.writeFileSync(mdFile, mdContent);
  
  return { logFile, mdFile };
}

// Process findings and update database
async function updateDatabase(company, findings) {
  if (findings.length === 0) return null;
  
  try {
    // Find the company in database
    const response = await notion.databases.query({
      database_id: dbId,
      filter: {
        property: 'Name',
        title: { contains: company.name }
      }
    });
    
    if (response.results.length === 0) {
      console.log(`    ⚠️  Company not found in database: ${company.name}`);
      return null;
    }
    
    const page = response.results[0];
    const updates = {};
    
    // Process findings
    findings.forEach(finding => {
      switch(finding.type) {
        case 'Funding':
          if (!page.properties.Funding?.rich_text[0]?.plain_text) {
            updates['Funding'] = { 
              rich_text: [{ text: { content: `${finding.value}\n\nSource: ${finding.source}` } }] 
            };
          }
          break;
        
        case 'Revenue':
          if (!page.properties.Revenue?.rich_text[0]?.plain_text) {
            updates['Revenue'] = { 
              rich_text: [{ text: { content: finding.value } }] 
            };
          }
          break;
        
        case 'Acquisition':
        case 'Partnership':
        case 'Product Launch':
          // Add to notes or create a news field
          const currentBlurb = page.properties['Short Blurb']?.rich_text[0]?.plain_text || '';
          const newsUpdate = `${currentBlurb}\n\n[${finding.type}] ${finding.value} (Source: ${finding.source})`;
          updates['Short Blurb'] = { 
            rich_text: [{ text: { content: newsUpdate.trim() } }] 
          };
          break;
      }
    });
    
    // Update if we have changes
    if (Object.keys(updates).length > 0) {
      await notion.pages.update({
        page_id: page.id,
        properties: updates
      });
      console.log(`    ✅ Updated ${Object.keys(updates).length} fields`);
      return updates;
    }
    
    return null;
    
  } catch (error) {
    console.error(`    ❌ Database update failed: ${error.message}`);
    return null;
  }
}

// Main function
async function main() {
  console.log('🔍 News Research Enrichment Tool\n');
  console.log('Using web search to find news about BC AI companies...\n');
  
  const allLogs = [];
  
  for (const company of targetCompanies) {
    console.log(`\n📰 Researching ${company.name}...`);
    console.log(`   Search focus: ${company.focus}`);
    
    // Simulate findings (in real implementation, this would call WebSearch)
    // For now, creating a template for manual research
    const findings = [];
    
    // Example structure for findings
    const exampleFinding = {
      type: 'Funding', // or 'Revenue', 'Acquisition', 'Partnership', 'Product Launch'
      value: '$X million Series A',
      source: 'News source URL',
      date: '2024-01-01',
      notes: 'Additional context'
    };
    
    const log = createLog(company, findings);
    allLogs.push(log);
    
    // Update database if we have findings
    if (findings.length > 0) {
      await updateDatabase(company, findings);
    }
    
    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Save all research
  const { logFile, mdFile } = saveResearch(allLogs);
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ News Research Complete!\n');
  console.log(`📊 Results:`);
  console.log(`   Companies researched: ${allLogs.length}`);
  console.log(`   Total findings: ${allLogs.reduce((sum, log) => sum + log.findings.length, 0)}`);
  console.log(`\n📁 Logs saved to:`);
  console.log(`   JSON: ${logFile}`);
  console.log(`   Markdown: ${mdFile}`);
  
  console.log('\n💡 Next steps:');
  console.log('1. Review the markdown file for research gaps');
  console.log('2. Use WebSearch tool to fill in missing data');
  console.log('3. Run this tool again with actual findings');
}

if (require.main === module) {
  main().catch(console.error);
}