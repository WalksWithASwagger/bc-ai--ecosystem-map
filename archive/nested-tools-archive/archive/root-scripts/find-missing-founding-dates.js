const { Client } = require('@notionhq/client');
const fs = require('fs');
const { NOTION_TOKEN, NOTION_DATABASE_ID } = require('./config');

const notion = new Client({ auth: NOTION_TOKEN });

async function findMissingFoundingDates() {
  console.log('🔍 Finding companies missing founding dates...\n');
  
  const results = {
    totalCompanies: 0,
    missingFoundingDates: [],
    hasFoundingDates: 0,
    missingCount: 0,
    aiCompaniesMissing: [],
    startupsMissing: [],
    highPriorityMissing: []
  };

  let hasMore = true;
  let startCursor = undefined;

  while (hasMore) {
    try {
      const response = await notion.databases.query({
        database_id: NOTION_DATABASE_ID,
        start_cursor: startCursor,
        page_size: 100
      });

      for (const page of response.results) {
        const company = {
          id: page.id,
          name: page.properties.Name?.title?.[0]?.text?.content || '',
          yearFounded: page.properties['Year Founded']?.number,
          category: page.properties.Category?.select?.name || '',
          region: page.properties['BC Region']?.select?.name || '',
          funding: page.properties.Funding?.rich_text?.[0]?.text?.content || '',
          website: page.properties.Website?.url || '',
          shortBlurb: page.properties['Short Blurb']?.rich_text?.[0]?.text?.content || ''
        };
        
        results.totalCompanies++;

        if (!company.yearFounded) {
          results.missingFoundingDates.push(company);
          results.missingCount++;

          // Categorize missing companies for priority research
          if (company.category === 'AI Companies') {
            results.aiCompaniesMissing.push(company);
          }
          
          if (company.category === 'Start-ups & Scale-ups') {
            results.startupsMissing.push(company);
          }

          // High priority: companies with funding or significant presence
          if (company.funding && (company.funding.includes('$') || company.funding.includes('Series'))) {
            results.highPriorityMissing.push(company);
          }
        } else {
          results.hasFoundingDates++;
        }
      }

      hasMore = response.has_more;
      startCursor = response.next_cursor;
    } catch (error) {
      console.error('Error querying database:', error);
      hasMore = false;
    }
  }

  // Sort by priority (funded companies first, then AI companies, then startups)
  results.missingFoundingDates.sort((a, b) => {
    const aFunded = a.funding && a.funding.includes('$');
    const bFunded = b.funding && b.funding.includes('$');
    const aAI = a.category === 'AI Companies';
    const bAI = b.category === 'AI Companies';
    const aStartup = a.category === 'Start-ups & Scale-ups';
    const bStartup = b.category === 'Start-ups & Scale-ups';

    if (aFunded && !bFunded) return -1;
    if (!aFunded && bFunded) return 1;
    if (aAI && !bAI) return -1;
    if (!aAI && bAI) return 1;
    if (aStartup && !bStartup) return -1;
    if (!aStartup && bStartup) return 1;
    
    return a.name.localeCompare(b.name);
  });

  // Generate detailed report
  const coverage = ((results.hasFoundingDates / results.totalCompanies) * 100).toFixed(1);
  
  console.log('=== Missing Founding Dates Analysis ===');
  console.log(`Total Companies: ${results.totalCompanies}`);
  console.log(`Companies with Founding Dates: ${results.hasFoundingDates} (${coverage}%)`);
  console.log(`Companies Missing Founding Dates: ${results.missingCount} (${(100 - coverage).toFixed(1)}%)`);
  console.log(`AI Companies Missing: ${results.aiCompaniesMissing.length}`);
  console.log(`Start-ups Missing: ${results.startupsMissing.length}`);
  console.log(`High Priority (Funded) Missing: ${results.highPriorityMissing.length}`);

  console.log('\n🎯 High Priority Companies Missing Founding Dates:');
  results.highPriorityMissing.slice(0, 20).forEach((company, index) => {
    console.log(`${index + 1}. ${company.name} (${company.category}) - ${company.funding}`);
  });

  console.log('\n🤖 AI Companies Missing Founding Dates:');
  results.aiCompaniesMissing.slice(0, 15).forEach((company, index) => {
    console.log(`${index + 1}. ${company.name} - ${company.shortBlurb.substring(0, 60)}...`);
  });

  // Save results for research
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `../data/reports/${timestamp}_missing-founding-dates.json`;
  
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  console.log(`\nReport saved to: ${reportPath}`);
  return results;
}

// Run analysis
findMissingFoundingDates()
  .then(() => console.log('\n✅ Missing founding dates analysis complete!'))
  .catch(error => console.error('❌ Analysis error:', error));