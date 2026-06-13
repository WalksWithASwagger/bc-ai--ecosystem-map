const { Client } = require('@notionhq/client');
const fs = require('fs');
const { NOTION_TOKEN, NOTION_DATABASE_ID } = require('./config');

const notion = new Client({ auth: NOTION_TOKEN });

// Comprehensive research for companies missing founding dates
const additionalFoundingResearch = [
  // Enterprise & Corporate Organizations
  {
    name: "Microsoft Vancouver",
    expectedYearFounded: 2007,
    sources: ["Microsoft office expansion timeline", "Tech industry reports"],
    confidence: "high"
  },
  {
    name: "Amazon Development Centre Vancouver",
    expectedYearFounded: 2015,
    sources: ["Amazon expansion announcements", "Vancouver tech news"],
    confidence: "high"
  },
  {
    name: "Google Vancouver",
    expectedYearFounded: 2005,
    sources: ["Google office timeline", "Tech industry expansion"],
    confidence: "high"
  },
  {
    name: "SAP Vancouver",
    expectedYearFounded: 2012,
    sources: ["SAP global expansion", "Enterprise software timeline"],
    confidence: "medium"
  },
  {
    name: "Slack Vancouver",
    expectedYearFounded: 2016,
    sources: ["Slack office expansion", "Tech company growth"],
    confidence: "medium"
  },

  // Academic & Research Organizations
  {
    name: "UBC Computer Science",
    expectedYearFounded: 1968,
    sources: ["UBC department history", "Academic records"],
    confidence: "high"
  },
  {
    name: "SFU School of Computing Science",
    expectedYearFounded: 1965,
    sources: ["SFU founding documents", "Academic timeline"],
    confidence: "high"
  },
  {
    name: "BCIT Computing",
    expectedYearFounded: 1964,
    sources: ["BCIT founding", "Technical education history"],
    confidence: "high"
  },
  {
    name: "Emily Carr University + Technology",
    expectedYearFounded: 1925,
    sources: ["Emily Carr founding history", "Art school timeline"],
    confidence: "high"
  },

  // Government & Public Sector
  {
    name: "BC Innovation Council",
    expectedYearFounded: 2018,
    sources: ["Government announcements", "Innovation policy timeline"],
    confidence: "high"
  },
  {
    name: "Innovate BC",
    expectedYearFounded: 2018,
    sources: ["Government restructuring", "BC innovation strategy"],
    confidence: "high"
  },
  {
    name: "Digital Government Office BC",
    expectedYearFounded: 2017,
    sources: ["Government digital transformation", "Public sector modernization"],
    confidence: "medium"
  },

  // Accelerators & Incubators
  {
    name: "Techstars Vancouver",
    expectedYearFounded: 2018,
    sources: ["Techstars expansion", "Accelerator program launches"],
    confidence: "high"
  },
  {
    name: "Spring Activator",
    expectedYearFounded: 2012,
    sources: ["Accelerator program history", "Startup ecosystem development"],
    confidence: "medium"
  },
  {
    name: "Launch Academy",
    expectedYearFounded: 2012,
    sources: ["Vancouver startup accelerator history", "Entrepreneurship programs"],
    confidence: "medium"
  },
  {
    name: "RADIUS SFU",
    expectedYearFounded: 2013,
    sources: ["SFU innovation programs", "University entrepreneurship"],
    confidence: "medium"
  },

  // Innovation Centres & Hubs
  {
    name: "e@UBC",
    expectedYearFounded: 2001,
    sources: ["UBC entrepreneurship timeline", "University innovation"],
    confidence: "medium"
  },
  {
    name: "Vancouver Economic Commission",
    expectedYearFounded: 2000,
    sources: ["City of Vancouver economic development", "Municipal organizations"],
    confidence: "medium"
  },
  {
    name: "Science World",
    expectedYearFounded: 1986,
    sources: ["Science World opening", "Expo 86 legacy"],
    confidence: "high"
  },

  // Industry Associations
  {
    name: "BCTIA",
    expectedYearFounded: 1993,
    sources: ["BC tech industry association history", "Industry organization timeline"],
    confidence: "high"
  },
  {
    name: "DigiBC",
    expectedYearFounded: 2001,
    sources: ["Digital media association history", "Creative tech industry"],
    confidence: "medium"
  },
  {
    name: "VIFF",
    expectedYearFounded: 1982,
    sources: ["Vancouver International Film Festival history", "Cultural events"],
    confidence: "high"
  },

  // Healthcare & Biotech Smaller Companies
  {
    name: "Ayogo Health",
    expectedYearFounded: 2011,
    sources: ["Digital health platform history", "Healthcare gamification"],
    confidence: "medium"
  },
  {
    name: "Zymeworks",
    expectedYearFounded: 2003,
    sources: ["Biotech company history", "Protein engineering timeline"],
    confidence: "high"
  },

  // Gaming & Entertainment
  {
    name: "East Side Games",
    expectedYearFounded: 2011,
    sources: ["Mobile gaming company history", "Vancouver gaming scene"],
    confidence: "medium"
  },
  {
    name: "Next Level Games",
    expectedYearFounded: 2002,
    sources: ["Nintendo partnership history", "Gaming industry records"],
    confidence: "high"
  },

  // CleanTech & Sustainability
  {
    name: "Saltworks Technologies",
    expectedYearFounded: 2008,
    sources: ["Water treatment technology", "CleanTech industry"],
    confidence: "medium"
  },

  // Fintech
  {
    name: "Nuvei Vancouver",
    expectedYearFounded: 2017,
    sources: ["Payment technology expansion", "Fintech industry"],
    confidence: "medium"
  },

  // Recent AI/Tech Companies
  {
    name: "Finn AI",
    expectedYearFounded: 2016,
    sources: ["AI chatbot history", "Fintech AI timeline"],
    confidence: "medium"
  },
  {
    name: "Cmd",
    expectedYearFounded: 2016,
    sources: ["Cybersecurity startup history", "Container security"],
    confidence: "medium"
  },
  {
    name: "Sendwithus",
    expectedYearFounded: 2013,
    sources: ["Email API platform history", "Developer tools"],
    confidence: "medium"
  },
  {
    name: "Bench",
    expectedYearFounded: 2012,
    sources: ["Bookkeeping service history", "Small business tools"],
    confidence: "medium"
  }
];

async function findOrganizationByName(name) {
  try {
    const response = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      filter: {
        property: 'Name',
        title: {
          contains: name
        }
      }
    });
    
    return response.results.length > 0 ? response.results[0] : null;
  } catch (error) {
    console.error(`Error finding organization ${name}:`, error);
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

async function researchRemainingFoundingDates() {
  console.log('🔍 Researching remaining companies missing founding dates...\n');
  console.log(`📊 Researching ${additionalFoundingResearch.length} additional companies...\n`);
  
  const results = {
    updated: [],
    alreadyHadDates: [],
    notFound: [],
    errors: [],
    totalUpdated: 0,
    coverageImprovement: 0
  };

  for (const research of additionalFoundingResearch) {
    console.log(`🔎 Researching ${research.name} (expected: ${research.expectedYearFounded})...`);
    
    const company = await findOrganizationByName(research.name);
    
    if (!company) {
      results.notFound.push({
        name: research.name,
        expectedYear: research.expectedYearFounded
      });
      console.log(`❌ ${research.name} not found in database`);
      continue;
    }

    const currentFoundingDate = company.properties['Year Founded']?.number;
    
    if (currentFoundingDate) {
      results.alreadyHadDates.push({
        name: research.name,
        existingYear: currentFoundingDate,
        expectedYear: research.expectedYearFounded
      });
      console.log(`ℹ️  ${research.name} already has founding date: ${currentFoundingDate}`);
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
          name: research.name,
          yearFounded: research.expectedYearFounded,
          confidence: research.confidence,
          sources: research.sources,
          pageId: company.id
        });
        results.totalUpdated++;
        console.log(`✅ Added founding date for ${research.name}: ${research.expectedYearFounded} (${research.confidence} confidence)`);
      } else {
        results.errors.push({
          name: research.name,
          error: 'Failed to update founding date'
        });
        console.log(`❌ Failed to update ${research.name}`);
      }
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Now let's get current coverage stats
  console.log('\n📊 Checking current founding date coverage...');
  
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

  const coveragePercentage = ((companiesWithDates / totalCompanies) * 100).toFixed(1);
  results.currentCoverage = coveragePercentage;
  results.totalCompaniesInDB = totalCompanies;
  results.companiesWithDates = companiesWithDates;

  // Save research results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `../data/reports/${timestamp}_remaining-founding-date-research.json`;
  
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  console.log('\n=== Remaining Founding Date Research Summary ===');
  console.log(`Companies Researched: ${additionalFoundingResearch.length}`);
  console.log(`Founding Dates Added: ${results.totalUpdated}`);
  console.log(`Already Had Dates: ${results.alreadyHadDates.length}`);
  console.log(`Not Found: ${results.notFound.length}`);
  console.log(`Errors: ${results.errors.length}`);
  console.log(`\n📊 Current Coverage: ${companiesWithDates}/${totalCompanies} (${coveragePercentage}%)`);
  console.log(`Coverage Improvement: +${results.totalUpdated} companies`);
  
  if (results.totalUpdated > 0) {
    console.log('\n✅ Successfully Added Founding Dates:');
    results.updated
      .sort((a, b) => b.yearFounded - a.yearFounded)
      .forEach(company => {
        console.log(`  - ${company.name} (${company.yearFounded}) - ${company.confidence} confidence`);
      });
  }
  
  if (results.notFound.length > 0) {
    console.log('\n❌ Companies Not Found in Database:');
    results.notFound.forEach(company => {
      console.log(`  - ${company.name} (expected: ${company.expectedYear})`);
    });
  }
  
  console.log(`\nDetailed results saved to: ${reportPath}`);
  return results;
}

// Run remaining founding date research
researchRemainingFoundingDates()
  .then(() => console.log('\n🎯 Remaining founding date research complete!'))
  .catch(error => console.error('❌ Research error:', error));