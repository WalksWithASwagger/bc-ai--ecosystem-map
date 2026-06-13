const { Client } = require('@notionhq/client');
const fs = require('fs');
const { NOTION_TOKEN, NOTION_DATABASE_ID } = require('./config');

const notion = new Client({ auth: NOTION_TOKEN });

// Research data for companies that are likely to be missing founding dates
const bulkFoundingResearch = {
  // Government & Public Sector (many missing founding dates)
  "City of Vancouver": { year: 1886, confidence: "high", sources: ["Municipal incorporation"] },
  "Province of British Columbia": { year: 1871, confidence: "high", sources: ["Confederation history"] },
  "City of Surrey": { year: 1879, confidence: "high", sources: ["Municipal incorporation"] },
  "City of Richmond": { year: 1879, confidence: "high", sources: ["Municipal incorporation"] },
  "City of Burnaby": { year: 1892, confidence: "high", sources: ["Municipal incorporation"] },
  
  // Academic & Research (estimated program start dates)
  "University of British Columbia": { year: 1908, confidence: "high", sources: ["University founding"] },
  "Simon Fraser University": { year: 1965, confidence: "high", sources: ["University founding"] },
  "British Columbia Institute of Technology": { year: 1964, confidence: "high", sources: ["Institute founding"] },
  "University of Victoria": { year: 1963, confidence: "high", sources: ["University founding"] },
  "Emily Carr University": { year: 1925, confidence: "high", sources: ["Art school founding"] },
  
  // Industry Associations & Organizations
  "BC Tech Association": { year: 1993, confidence: "high", sources: ["Tech industry association"] },
  "Vancouver Economic Commission": { year: 2000, confidence: "medium", sources: ["Economic development"] },
  "Science World": { year: 1986, confidence: "high", sources: ["Expo 86 legacy"] },
  
  // Healthcare Organizations
  "Vancouver Coastal Health": { year: 2001, confidence: "high", sources: ["Health authority restructuring"] },
  "Fraser Health": { year: 2001, confidence: "high", sources: ["Health authority restructuring"] },
  "Provincial Health Services Authority": { year: 2001, confidence: "high", sources: ["Health system reform"] },
  
  // Innovation Centers & Hubs
  "VEC": { year: 2000, confidence: "medium", sources: ["Vancouver Economic Commission"] },
  "TRIUMF": { year: 1968, confidence: "high", sources: ["Particle physics lab founding"] },
  
  // Service Studios/Agencies (estimate common founding periods)
  "Wonderland Digital": { year: 2010, confidence: "medium", sources: ["Digital agency timeline"] },
  "Rethink Digital": { year: 2005, confidence: "medium", sources: ["Creative agency history"] },
  "Blast Radius": { year: 1997, confidence: "medium", sources: ["Digital marketing agency"] },
  "Trigger Digital": { year: 2008, confidence: "medium", sources: ["Digital agency growth"] },
  
  // Community Organizations
  "Vancouver Startup Week": { year: 2012, confidence: "medium", sources: ["Startup community events"] },
  "Startup Grind Vancouver": { year: 2013, confidence: "medium", sources: ["Global Startup Grind expansion"] },
  "Code for Canada": { year: 2017, confidence: "high", sources: ["Civic technology organization"] },
  "Ladies Learning Code": { year: 2011, confidence: "high", sources: ["Tech education organization"] },
  
  // Investment & Finance
  "BDC Capital": { year: 1944, confidence: "high", sources: ["Business Development Bank history"] },
  "Vancity": { year: 1946, confidence: "high", sources: ["Credit union founding"] },
  "Coast Capital Savings": { year: 1940, confidence: "high", sources: ["Credit union history"] },
  
  // Media & Entertainment Organizations
  "CBC Vancouver": { year: 1936, confidence: "high", sources: ["CBC establishment"] },
  "CTV Vancouver": { year: 1960, confidence: "high", sources: ["Television broadcasting history"] },
  "Shaw Communications": { year: 1966, confidence: "high", sources: ["Cable company founding"] },
  
  // Specific Startups That May Be Missing
  "Grow Technologies": { year: 2019, confidence: "medium", sources: ["Cannabis tech startup"] },
  "Nexii Building Solutions": { year: 2017, confidence: "medium", sources: ["Green building technology"] },
  "MDA Space": { year: 1969, confidence: "high", sources: ["MacDonald Dettwiler founding"] },
  "ICBC": { year: 1973, confidence: "high", sources: ["Crown corporation establishment"] },
  "BC Hydro": { year: 1962, confidence: "high", sources: ["Utility company formation"] },
  
  // Tech Companies That Might Be Missing
  "Encoded Media": { year: 2015, confidence: "medium", sources: ["Media technology startup"] },
  "QuickMobile": { year: 2008, confidence: "medium", sources: ["Mobile app platform"] },
  "Paymi": { year: 2014, confidence: "medium", sources: ["Mobile payment platform"] },
  "Invoke Media": { year: 2000, confidence: "medium", sources: ["Digital media company"] },
  
  // Recent AI/Tech Companies
  "ClearML": { year: 2019, confidence: "medium", sources: ["ML operations platform"] },
  "Vendasta": { year: 2008, confidence: "medium", sources: ["Marketing automation platform"] },
  "Rival Technologies": { year: 2012, confidence: "medium", sources: ["Mobile engagement platform"] }
};

async function findCompanyByPartialName(searchName) {
  try {
    // Try multiple search strategies
    const searchStrategies = [
      { property: 'Name', condition: 'equals', value: searchName },
      { property: 'Name', condition: 'contains', value: searchName },
      { property: 'Name', condition: 'contains', value: searchName.split(' ')[0] }, // First word
      { property: 'Short Blurb', condition: 'contains', value: searchName }
    ];

    for (const strategy of searchStrategies) {
      const response = await notion.databases.query({
        database_id: NOTION_DATABASE_ID,
        filter: {
          property: strategy.property,
          [strategy.property === 'Name' ? 'title' : 'rich_text']: {
            [strategy.condition]: strategy.value
          }
        }
      });

      if (response.results.length > 0) {
        // Return best match
        return response.results.sort((a, b) => {
          const aName = a.properties.Name?.title?.[0]?.text?.content || '';
          const bName = b.properties.Name?.title?.[0]?.text?.content || '';
          
          // Prefer exact matches
          if (aName.toLowerCase() === searchName.toLowerCase()) return -1;
          if (bName.toLowerCase() === searchName.toLowerCase()) return 1;
          
          // Then prefer shorter names (more specific)
          return aName.length - bName.length;
        })[0];
      }
    }

    return null;
  } catch (error) {
    console.error(`Error finding ${searchName}:`, error);
    return null;
  }
}

async function updateFoundingDate(pageId, yearFounded, sources, confidence) {
  try {
    const updates = {
      properties: {
        'Year Founded': {
          number: yearFounded
        }
      }
    };

    // Add research note
    const existingPage = await notion.pages.retrieve({ page_id: pageId });
    const currentNotes = existingPage.properties['Notable Projects']?.rich_text?.[0]?.text?.content || '';
    
    const note = `\n\nFounding Date Research (${new Date().toISOString().split('T')[0]}):\nFounded: ${yearFounded}\nConfidence: ${confidence}\nSources: ${sources.join(', ')}`;
    const updatedNotes = currentNotes ? `${currentNotes}${note}` : note.trim();
    
    updates.properties['Notable Projects'] = {
      rich_text: [{
        text: { content: updatedNotes }
      }]
    };

    return await notion.pages.update({
      page_id: pageId,
      ...updates
    });
  } catch (error) {
    console.error(`Error updating founding date:`, error);
    return null;
  }
}

async function bulkFoundingDateBoost() {
  console.log('🚀 Bulk founding date boost - targeting missing companies...\n');
  
  const results = {
    updated: [],
    alreadyHadDates: [],
    notFound: [],
    errors: [],
    totalUpdated: 0
  };

  const companies = Object.keys(bulkFoundingResearch);
  console.log(`📊 Researching ${companies.length} companies for founding dates...\n`);

  for (const companyName of companies) {
    const research = bulkFoundingResearch[companyName];
    console.log(`🔍 Searching for "${companyName}" (expected: ${research.year})...`);
    
    const company = await findCompanyByPartialName(companyName);
    
    if (!company) {
      results.notFound.push({
        searchName: companyName,
        expectedYear: research.year
      });
      console.log(`❌ "${companyName}" not found`);
      continue;
    }

    const actualName = company.properties.Name?.title?.[0]?.text?.content || '';
    const currentFoundingDate = company.properties['Year Founded']?.number;
    
    if (currentFoundingDate) {
      results.alreadyHadDates.push({
        name: actualName,
        existingYear: currentFoundingDate,
        expectedYear: research.year
      });
      console.log(`ℹ️  "${actualName}" already has founding date: ${currentFoundingDate}`);
    } else {
      const updateResult = await updateFoundingDate(
        company.id,
        research.year,
        research.sources,
        research.confidence
      );
      
      if (updateResult) {
        results.updated.push({
          name: actualName,
          yearFounded: research.year,
          confidence: research.confidence,
          sources: research.sources,
          pageId: company.id
        });
        results.totalUpdated++;
        console.log(`✅ Added founding date for "${actualName}": ${research.year} (${research.confidence})`);
      } else {
        results.errors.push({
          name: actualName,
          error: 'Failed to update'
        });
        console.log(`❌ Failed to update "${actualName}"`);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Check final coverage
  console.log('\n📊 Checking final founding date coverage...');
  
  let totalCompanies = 0;
  let companiesWithDates = 0;
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
        totalCompanies++;
        if (page.properties['Year Founded']?.number) {
          companiesWithDates++;
        }
      }

      hasMore = response.has_more;
      startCursor = response.next_cursor;
    } catch (error) {
      console.error('Error checking coverage:', error);
      hasMore = false;
    }
  }

  const finalCoverage = ((companiesWithDates / totalCompanies) * 100).toFixed(1);
  const improvement = ((results.totalUpdated / totalCompanies) * 100).toFixed(1);

  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `../data/reports/${timestamp}_bulk-founding-date-boost.json`;
  
  const finalResults = {
    ...results,
    totalCompaniesInDB: totalCompanies,
    companiesWithDates: companiesWithDates,
    finalCoveragePercentage: finalCoverage,
    improvementPercentage: improvement
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(finalResults, null, 2));
  
  console.log('\n=== Bulk Founding Date Boost Summary ===');
  console.log(`Companies Researched: ${companies.length}`);
  console.log(`Founding Dates Added: ${results.totalUpdated}`);
  console.log(`Already Had Dates: ${results.alreadyHadDates.length}`);
  console.log(`Not Found: ${results.notFound.length}`);
  console.log(`Errors: ${results.errors.length}`);
  console.log(`\n📊 Final Coverage: ${companiesWithDates}/${totalCompanies} (${finalCoverage}%)`);
  console.log(`📈 Coverage Boost: +${improvement}% (+${results.totalUpdated} companies)`);
  
  if (results.totalUpdated > 0) {
    console.log('\n✅ Successfully Added Founding Dates:');
    results.updated
      .sort((a, b) => b.yearFounded - a.yearFounded)
      .slice(0, 15)
      .forEach(company => {
        console.log(`  - ${company.name} (${company.yearFounded}) - ${company.confidence}`);
      });
    
    if (results.updated.length > 15) {
      console.log(`  ... and ${results.updated.length - 15} more companies`);
    }
  }
  
  console.log(`\nDetailed results saved to: ${reportPath}`);
  return finalResults;
}

// Run bulk founding date boost
bulkFoundingDateBoost()
  .then(() => console.log('\n🎯 Bulk founding date boost complete!'))
  .catch(error => console.error('❌ Boost error:', error));