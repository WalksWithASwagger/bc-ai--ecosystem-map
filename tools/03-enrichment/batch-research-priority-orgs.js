#!/usr/bin/env node
/**
 * Batch Research Priority Organizations
 * Automates the research process for priority organizations
 */

const { exec } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Priority organizations to research
const priorityOrgs = [
  {
    name: "Aspect Biosystems",
    website: "https://www.aspectbiosystems.com",
    linkedin: "https://ca.linkedin.com/company/aspect-biosystems",
    notes: "Bioprinting/3D tissue engineering, Founded by UBC researchers"
  },
  {
    name: "Browse AI",
    website: "https://www.browseai.com",
    linkedin: "https://www.linkedin.com/company/browse-ai",
    notes: "No-code web scraping/automation, Y Combinator company (likely)"
  },
  {
    name: "Open Ocean Robotics",
    website: "https://www.openoceanrobotics.com",
    linkedin: "https://ca.linkedin.com/company/open-ocean-robotics",
    notes: "Marine robotics/autonomous vessels, Victoria-based"
  },
  {
    name: "Canexia Health",
    website: "https://canexiahealth.ca",
    linkedin: "https://ca.linkedin.com/company/imagia-canexiahealth",
    notes: "Healthcare AI/Cancer diagnostics, Previously known as Imagia"
  },
  {
    name: "RIVAL Technologies",
    website: "https://www.rivaltech.com",
    linkedin: "https://ca.linkedin.com/company/rival-technologies",
    notes: "Market research/Mobile surveys, Enterprise clients"
  }
];

// Research checklist for each organization
const researchChecklist = [
  "1. Check Crunchbase for funding rounds and amounts",
  "2. Verify LinkedIn for current employee count",
  "3. Search TechCrunch/BetaKit for recent funding news",
  "4. Check company website for press releases",
  "5. Search for recent news articles (2024-2025)",
  "6. Look for patent filings or innovation awards",
  "7. Find key leadership (CEO, CTO, founders)"
];

async function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function researchOrganization(org) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 Researching: ${org.name}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Website: ${org.website}`);
  console.log(`LinkedIn: ${org.linkedin}`);
  console.log(`Notes: ${org.notes}\n`);
  
  console.log('📋 Research Checklist:');
  researchChecklist.forEach(item => console.log(`   ${item}`));
  
  console.log('\n📌 Suggested Search Queries:');
  console.log(`   "${org.name}" funding announcement site:crunchbase.com`);
  console.log(`   "${org.name}" raises OR raised site:techcrunch.com`);
  console.log(`   "${org.name}" series A OR seed OR funding`);
  console.log(`   "${org.name}" BC tech news 2024 OR 2025`);
  console.log(`   site:linkedin.com/company/${org.linkedin.split('/').pop()} employees`);
  
  const research = {
    organization: org.name,
    timestamp: new Date().toISOString(),
    data: {}
  };
  
  // Collect funding information
  const hasFunding = await question('\n💰 Did you find funding information? (yes/no): ');
  if (hasFunding.toLowerCase() === 'yes') {
    research.data.funding = {
      amount: await question('   Funding amount (e.g., $10M, $5.5M Series A): '),
      round: await question('   Funding round (e.g., Seed, Series A): '),
      date: await question('   Funding date (YYYY-MM): '),
      investors: await question('   Key investors (comma-separated): '),
      source: await question('   Source URL: ')
    };
  }
  
  // Collect employee count
  const hasEmployees = await question('\n👥 Did you find employee count? (yes/no): ');
  if (hasEmployees.toLowerCase() === 'yes') {
    research.data.employeeCount = {
      count: await question('   Employee count (e.g., 50, 100-250): '),
      asOf: await question('   As of date (YYYY-MM): '),
      source: await question('   Source URL: ')
    };
  }
  
  // Collect revenue information
  const hasRevenue = await question('\n💵 Did you find revenue information? (yes/no): ');
  if (hasRevenue.toLowerCase() === 'yes') {
    research.data.revenue = {
      amount: await question('   Revenue (e.g., $5M ARR, $10M annual): '),
      year: await question('   Year: '),
      source: await question('   Source URL: ')
    };
  }
  
  // Collect valuation
  const hasValuation = await question('\n📈 Did you find valuation information? (yes/no): ');
  if (hasValuation.toLowerCase() === 'yes') {
    research.data.valuation = {
      amount: await question('   Valuation (e.g., $50M, $100M): '),
      date: await question('   As of date (YYYY-MM): '),
      source: await question('   Source URL: ')
    };
  }
  
  // Collect key people
  const hasKeyPeople = await question('\n👤 Did you find key people? (yes/no): ');
  if (hasKeyPeople.toLowerCase() === 'yes') {
    research.data.keyPeople = {
      people: await question('   Key people (e.g., "Jane Doe (CEO), John Smith (CTO)"): '),
      source: await question('   Source URL: ')
    };
  }
  
  // Year founded if missing
  const hasYearFounded = await question('\n📅 Did you find founding year? (yes/no): ');
  if (hasYearFounded.toLowerCase() === 'yes') {
    research.data.yearFounded = {
      year: parseInt(await question('   Year founded: ')),
      source: await question('   Source URL: ')
    };
  }
  
  // Additional notes
  research.data.notes = await question('\n📝 Any additional notes or findings: ');
  
  return research;
}

async function main() {
  console.log('🚀 BC AI Priority Organizations Batch Research Tool');
  console.log('=================================================\n');
  console.log('This tool guides you through researching each priority organization.');
  console.log('Open each link in your browser and search for the suggested queries.\n');
  
  const allResearch = [];
  
  for (const org of priorityOrgs) {
    const research = await researchOrganization(org);
    allResearch.push(research);
    
    const continueResearch = await question('\nContinue to next organization? (yes/no): ');
    if (continueResearch.toLowerCase() !== 'yes') {
      break;
    }
  }
  
  // Save research results
  const timestamp = new Date().toISOString().split('T')[0];
  const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  const outputDir = path.join(__dirname, '../../data/research');
  const outputPath = path.join(outputDir, `${timestamp}_${time}_priority-orgs-research.json`);
  
  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(allResearch, null, 2));
  console.log(`\n✅ Research saved to: ${outputPath}`);
  
  // Generate summary report
  let report = '# Priority Organizations Research Summary\n\n';
  report += `*Date: ${new Date().toLocaleDateString()}*\n\n`;
  
  allResearch.forEach(research => {
    report += `## ${research.organization}\n\n`;
    
    if (research.data.funding) {
      report += `**Funding**: ${research.data.funding.amount} (${research.data.funding.round}, ${research.data.funding.date})\n`;
      report += `- Investors: ${research.data.funding.investors}\n`;
      report += `- Source: ${research.data.funding.source}\n\n`;
    }
    
    if (research.data.employeeCount) {
      report += `**Employees**: ${research.data.employeeCount.count} (as of ${research.data.employeeCount.asOf})\n`;
      report += `- Source: ${research.data.employeeCount.source}\n\n`;
    }
    
    if (research.data.revenue) {
      report += `**Revenue**: ${research.data.revenue.amount} (${research.data.revenue.year})\n`;
      report += `- Source: ${research.data.revenue.source}\n\n`;
    }
    
    if (research.data.valuation) {
      report += `**Valuation**: ${research.data.valuation.amount} (as of ${research.data.valuation.date})\n`;
      report += `- Source: ${research.data.valuation.source}\n\n`;
    }
    
    if (research.data.keyPeople) {
      report += `**Key People**: ${research.data.keyPeople.people}\n`;
      report += `- Source: ${research.data.keyPeople.source}\n\n`;
    }
    
    if (research.data.yearFounded) {
      report += `**Founded**: ${research.data.yearFounded.year}\n`;
      report += `- Source: ${research.data.yearFounded.source}\n\n`;
    }
    
    if (research.data.notes) {
      report += `**Notes**: ${research.data.notes}\n\n`;
    }
    
    report += '---\n\n';
  });
  
  const reportPath = path.join(outputDir, `${timestamp}_${time}_priority-orgs-summary.md`);
  fs.writeFileSync(reportPath, report);
  console.log(`📄 Summary report saved to: ${reportPath}`);
  
  rl.close();
}

main().catch(console.error);