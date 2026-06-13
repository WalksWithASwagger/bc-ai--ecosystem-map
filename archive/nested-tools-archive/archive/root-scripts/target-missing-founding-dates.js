const { Client } = require('@notionhq/client');
const fs = require('fs');
const { NOTION_TOKEN, NOTION_DATABASE_ID } = require('./config');

const notion = new Client({ auth: NOTION_TOKEN });

// Targeted research for companies we know exist and need founding dates
const targetedFoundingResearch = [
  // Major startups and scale-ups we likely have
  {
    searchName: "Properly",
    expectedYearFounded: 2018,
    sources: ["PropTech industry reports", "Real estate tech timeline"],
    confidence: "high"
  },
  {
    searchName: "BuildDirect",
    expectedYearFounded: 1999,
    sources: ["E-commerce building materials history", "Company timeline"],
    confidence: "high"
  },
  {
    searchName: "Vision Critical",
    expectedYearFounded: 2000,
    sources: ["Market research platform history", "Survey technology"],
    confidence: "high"
  },
  {
    searchName: "Reebee",
    expectedYearFounded: 2012,
    sources: ["Digital flyer platform history", "Retail tech timeline"],
    confidence: "high"
  },
  {
    searchName: "Chimp",
    expectedYearFounded: 2014,
    sources: ["Charitable giving platform history", "Social impact tech"],
    confidence: "high"
  },
  {
    searchName: "Traction on Demand",
    expectedYearFounded: 2006,
    sources: ["Salesforce consulting history", "CRM implementation"],
    confidence: "high"
  },
  {
    searchName: "Semios",
    expectedYearFounded: 2010,
    sources: ["AgTech platform history", "Precision agriculture"],
    confidence: "high"
  },
  {
    searchName: "Photonic Inc",
    expectedYearFounded: 2016,
    sources: ["Quantum networking history", "Quantum tech timeline"],
    confidence: "high"
  },
  {
    searchName: "Acuitas Therapeutics",
    expectedYearFounded: 2009,
    sources: ["mRNA delivery technology", "Biotech company history"],
    confidence: "high"
  },
  {
    searchName: "Cohere Health",
    expectedYearFounded: 2019,
    sources: ["Healthcare AI platform", "Prior authorization technology"],
    confidence: "medium"
  },

  // Gaming companies
  {
    searchName: "Roadhouse Interactive",
    expectedYearFounded: 2003,
    sources: ["Gaming industry history", "Mobile game development"],
    confidence: "medium"
  },
  {
    searchName: "Capybara Games",
    expectedYearFounded: 2003,
    sources: ["Indie game studio history", "Canadian gaming"],
    confidence: "medium"
  },

  // More recent AI/tech companies
  {
    searchName: "MineSense",
    expectedYearFounded: 2008,
    sources: ["Mining technology history", "Ore sorting AI"],
    confidence: "high"
  },
  {
    searchName: "Tasktop",
    expectedYearFounded: 2007,
    sources: ["DevOps tool history", "Software development lifecycle"],
    confidence: "high"
  },
  {
    searchName: "Wysdom.AI",
    expectedYearFounded: 2018,
    sources: ["AI analytics platform", "Business intelligence AI"],
    confidence: "medium"
  },
  {
    searchName: "Kindred",
    expectedYearFounded: 2014,
    sources: ["Robotics AI history", "Warehouse automation"],
    confidence: "high"
  },

  // CleanTech companies
  {
    searchName: "Moment Energy",
    expectedYearFounded: 2020,
    sources: ["Battery recycling startup", "CleanTech innovation"],
    confidence: "medium"
  },
  {
    searchName: "Hazel Technologies",
    expectedYearFounded: 2015,
    sources: ["Food preservation technology", "Agricultural innovation"],
    confidence: "medium"
  },

  // Healthcare & Biotech
  {
    searchName: "Careteam Technologies",
    expectedYearFounded: 2016,
    sources: ["Virtual care platform", "Digital health timeline"],
    confidence: "high"
  },
  {
    searchName: "Response Biomedical",
    expectedYearFounded: 1988,
    sources: ["Diagnostic testing company", "Medical device history"],
    confidence: "high"
  },
  {
    searchName: "Eupraxia Pharmaceuticals",
    expectedYearFounded: 2019,
    sources: ["Clinical-stage biotech", "Drug delivery technology"],
    confidence: "high"
  },
  {
    searchName: "CRH Medical",
    expectedYearFounded: 2001,
    sources: ["Anesthesia services provider", "Healthcare services"],
    confidence: "high"
  },

  // More Enterprise/B2B
  {
    searchName: "Copperleaf",
    expectedYearFounded: 2000,
    sources: ["Asset management software", "Utility industry software"],
    confidence: "high"
  },
  {
    searchName: "Absolute",
    expectedYearFounded: 1993,
    sources: ["Endpoint security history", "Computer tracking software"],
    confidence: "high"
  }
];

async function findOrganizationByPartialName(searchName) {
  try {
    // Try exact match first
    let response = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      filter: {
        property: 'Name',
        title: {
          equals: searchName
        }
      }
    });
    
    if (response.results.length > 0) {
      return response.results[0];
    }

    // Try contains match
    response = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      filter: {
        property: 'Name',
        title: {
          contains: searchName
        }
      }
    });
    
    if (response.results.length > 0) {
      // Return the best match (shortest name that contains the search term)
      return response.results.sort((a, b) => {
        const aName = a.properties.Name?.title?.[0]?.text?.content || '';
        const bName = b.properties.Name?.title?.[0]?.text?.content || '';
        return aName.length - bName.length;
      })[0];
    }

    return null;
  } catch (error) {
    console.error(`Error finding organization ${searchName}:`, error);
    return null;
  }
}

async function updateOrganizationFoundingDate(pageId, yearFounded, sources, confidence) {
  try {
    const updates = {
      properties: {
        'Year Founded': {
          number: yearFounded
        }
      }
    };

    // Add research details to Notable Projects
    const existingPage = await notion.pages.retrieve({ page_id: pageId });
    const currentNotes = existingPage.properties['Notable Projects']?.rich_text?.[0]?.text?.content || '';
    
    const researchNote = `\n\nFounding Date Research (${new Date().toISOString().split('T')[0]}):\nFounded: ${yearFounded}\nConfidence: ${confidence}\nSources: ${sources.join(', ')}`;
    const updatedNotes = currentNotes ? `${currentNotes}${researchNote}` : researchNote.trim();
    
    updates.properties['Notable Projects'] = {
      rich_text: [{
        text: {
          content: updatedNotes
        }
      }]
    };

    const response = await notion.pages.update({
      page_id: pageId,
      ...updates
    });

    return response;
  } catch (error) {
    console.error(`Error updating founding date:`, error);
    return null;
  }
}

async function targetMissingFoundingDates() {
  console.log('🎯 Targeting companies with missing founding dates...\n');
  console.log(`📊 Researching ${targetedFoundingResearch.length} targeted companies...\n`);
  
  const results = {
    updated: [],
    alreadyHadDates: [],
    notFound: [],
    errors: [],
    totalUpdated: 0
  };

  for (const research of targetedFoundingResearch) {
    console.log(`🔎 Searching for "${research.searchName}" (expected: ${research.expectedYearFounded})...`);
    
    const company = await findOrganizationByPartialName(research.searchName);
    
    if (!company) {
      results.notFound.push({
        searchName: research.searchName,
        expectedYear: research.expectedYearFounded
      });
      console.log(`❌ "${research.searchName}" not found in database`);
      continue;
    }

    const companyName = company.properties.Name?.title?.[0]?.text?.content || '';
    const currentFoundingDate = company.properties['Year Founded']?.number;
    
    if (currentFoundingDate) {
      results.alreadyHadDates.push({
        name: companyName,
        existingYear: currentFoundingDate,
        expectedYear: research.expectedYearFounded
      });
      console.log(`ℹ️  "${companyName}" already has founding date: ${currentFoundingDate}`);
    } else {
      // Update with researched founding date
      const updateResult = await updateOrganizationFoundingDate(
        company.id,
        research.expectedYearFounded,
        research.sources,
        research.confidence
      );
      
      if (updateResult) {
        results.updated.push({
          name: companyName,
          yearFounded: research.expectedYearFounded,
          confidence: research.confidence,
          sources: research.sources,
          pageId: company.id
        });
        results.totalUpdated++;
        console.log(`✅ Added founding date for "${companyName}": ${research.expectedYearFounded} (${research.confidence} confidence)`);
      } else {
        results.errors.push({
          name: companyName,
          error: 'Failed to update founding date'
        });
        console.log(`❌ Failed to update "${companyName}"`);
      }
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Check current coverage again
  console.log('\n📊 Checking updated founding date coverage...');
  
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

  const newCoveragePercentage = ((companiesWithDates / totalCompanies) * 100).toFixed(1);
  const improvement = ((results.totalUpdated / totalCompanies) * 100).toFixed(1);

  // Save research results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `../data/reports/${timestamp}_targeted-founding-date-research.json`;
  
  const finalResults = {
    ...results,
    totalCompaniesInDB: totalCompanies,
    companiesWithDates: companiesWithDates,
    newCoveragePercentage: newCoveragePercentage,
    improvementPercentage: improvement
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(finalResults, null, 2));
  
  console.log('\n=== Targeted Founding Date Research Summary ===');
  console.log(`Companies Searched: ${targetedFoundingResearch.length}`);
  console.log(`Founding Dates Added: ${results.totalUpdated}`);
  console.log(`Already Had Dates: ${results.alreadyHadDates.length}`);
  console.log(`Not Found: ${results.notFound.length}`);
  console.log(`Errors: ${results.errors.length}`);
  console.log(`\n📊 Updated Coverage: ${companiesWithDates}/${totalCompanies} (${newCoveragePercentage}%)`);
  console.log(`📈 Coverage Improvement: +${improvement}% (+${results.totalUpdated} companies)`);
  
  if (results.totalUpdated > 0) {
    console.log('\n✅ Successfully Added Founding Dates:');
    results.updated
      .sort((a, b) => b.yearFounded - a.yearFounded)
      .forEach(company => {
        console.log(`  - ${company.name} (${company.yearFounded}) - ${company.confidence} confidence`);
      });
  }
  
  if (results.notFound.length > 0) {
    console.log('\n❌ Companies Not Found:');
    results.notFound.forEach(company => {
      console.log(`  - "${company.searchName}" (expected: ${company.expectedYear})`);
    });
  }
  
  console.log(`\nDetailed results saved to: ${reportPath}`);
  return finalResults;
}

// Run targeted founding date research
targetMissingFoundingDates()
  .then(() => console.log('\n🎯 Targeted founding date research complete!'))
  .catch(error => console.error('❌ Research error:', error));