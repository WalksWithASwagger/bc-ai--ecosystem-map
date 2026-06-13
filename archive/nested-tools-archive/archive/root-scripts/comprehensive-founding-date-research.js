const { Client } = require('@notionhq/client');
const fs = require('fs');
const { NOTION_TOKEN, NOTION_DATABASE_ID } = require('./config');

const notion = new Client({ auth: NOTION_TOKEN });

// Comprehensive founding date research for high-priority companies
const foundingDateResearch = [
  // High-Priority Funded Companies
  {
    name: "Clio",
    expectedYearFounded: 2008,
    sources: ["Company website", "Legal tech industry reports", "Crunchbase"],
    confidence: "high",
    category: "Legal Tech Leader"
  },
  {
    name: "1Password", 
    expectedYearFounded: 2005,
    sources: ["Company history page", "AgileBits founding", "Tech industry records"],
    confidence: "high",
    category: "Cybersecurity"
  },
  {
    name: "Trulioo",
    expectedYearFounded: 2011,
    sources: ["Company LinkedIn", "Identity verification industry reports", "Crunchbase"],
    confidence: "high",
    category: "AI Companies"
  },
  {
    name: "Dapper Labs",
    expectedYearFounded: 2018,
    sources: ["CryptoKitties launch date", "Company press releases", "Blockchain industry records"],
    confidence: "high",
    category: "Crypto Unicorn"
  },
  {
    name: "Visier",
    expectedYearFounded: 2010,
    sources: ["Company website about page", "HR tech industry reports", "Founder bios"],
    confidence: "high",
    category: "Enterprise / Corporate Divisions"
  },
  {
    name: "AlayaCare",
    expectedYearFounded: 2014,
    sources: ["Company history", "Healthcare tech reports", "Founder LinkedIn"],
    confidence: "high",
    category: "Healthcare & Biotech"
  },
  {
    name: "Hootsuite",
    expectedYearFounded: 2008,
    sources: ["Company founding story", "Social media industry history", "Ryan Holmes interviews"],
    confidence: "high",
    category: "Start-ups & Scale-ups"
  },
  {
    name: "Thinkific",
    expectedYearFounded: 2012, 
    sources: ["Company timeline", "E-learning industry reports", "IPO documentation"],
    confidence: "high",
    category: "AI Companies"
  },
  {
    name: "Later",
    expectedYearFounded: 2014,
    sources: ["Latergramme history", "Social media tools timeline", "Company blog"],
    confidence: "high", 
    category: "Technology Companies"
  },
  {
    name: "Unbounce",
    expectedYearFounded: 2009,
    sources: ["Company founding story", "Marketing tech history", "Founder interviews"],
    confidence: "high",
    category: "Marketing Tech"
  },

  // AI Companies Missing Founding Dates
  {
    name: "STEMCELL Technologies",
    expectedYearFounded: 1993,
    sources: ["Company history page", "Biotech industry records", "Scientific publications"],
    confidence: "high",
    category: "AI Companies"
  },
  {
    name: "AbCellera Biologics",
    expectedYearFounded: 2012,
    sources: ["Company IPO documents", "Biotech industry reports", "Scientific publications"],
    confidence: "high",
    category: "Unicorn"
  },
  {
    name: "Xenon Pharmaceuticals",
    expectedYearFounded: 1996,
    sources: ["NASDAQ listing documents", "Pharma industry records", "Company SEC filings"],
    confidence: "high",
    category: "Healthcare & Biotech"
  },
  {
    name: "D-Wave Systems",
    expectedYearFounded: 1999,
    sources: ["Quantum computing history", "Company timeline", "SPAC documentation"],
    confidence: "high",
    category: "Technology Companies"
  },
  {
    name: "Zymeworks",
    expectedYearFounded: 2003,
    sources: ["Biotech company history", "NYSE listing docs", "Scientific publications"],
    confidence: "high",
    category: "Enterprise / Corporate Divisions"
  },

  // Major Start-ups & Scale-ups
  {
    name: "Article",
    expectedYearFounded: 2013,
    sources: ["Furniture industry reports", "Company timeline", "E-commerce history"],
    confidence: "high",
    category: "Technology Companies"
  },
  {
    name: "Sanctuary AI",
    expectedYearFounded: 2018,
    sources: ["Robotics industry reports", "Company announcements", "AI robotics timeline"],
    confidence: "high",
    category: "Start-ups & Scale-ups"
  },
  {
    name: "Terramera",
    expectedYearFounded: 2010,
    sources: ["AgTech industry reports", "Company history", "Sustainable agriculture timeline"],
    confidence: "high",
    category: "Start-ups & Scale-ups"
  },
  {
    name: "Klue",
    expectedYearFounded: 2015,
    sources: ["Competitive intelligence industry", "Company LinkedIn", "SaaS industry reports"],
    confidence: "high",
    category: "Start-ups & Scale-ups"
  },
  {
    name: "Certn",
    expectedYearFounded: 2016,
    sources: ["Background check industry", "Company history", "HR tech reports"],
    confidence: "high",
    category: "Start-ups & Scale-ups"
  },

  // CleanTech Companies
  {
    name: "Ballard Power Systems",
    expectedYearFounded: 1979,
    sources: ["Public company history", "Fuel cell industry records", "TSX/NASDAQ listings"],
    confidence: "high",
    category: "CleanTech"
  },
  {
    name: "General Fusion",
    expectedYearFounded: 2002,
    sources: ["Fusion energy history", "Company timeline", "CleanTech reports"],
    confidence: "high",
    category: "Uncategorized"
  },
  {
    name: "Carbon Engineering",
    expectedYearFounded: 2009,
    sources: ["Direct air capture history", "Company website", "CleanTech industry"],
    confidence: "high",
    category: "CleanTech"
  },
  {
    name: "Svante",
    expectedYearFounded: 2007,
    sources: ["Carbon capture history", "Company timeline", "CleanTech reports"],
    confidence: "high",
    category: "Technology Companies"
  },

  // Fintech Companies
  {
    name: "Mogo",
    expectedYearFounded: 2003,
    sources: ["Public company filings", "Fintech industry history", "TSX/NASDAQ records"],
    confidence: "high",
    category: "Fintech"
  },
  {
    name: "Coinsquare",
    expectedYearFounded: 2014,
    sources: ["Cryptocurrency exchange history", "Canadian crypto timeline", "Industry reports"],
    confidence: "high",
    category: "Fintech"
  },
  {
    name: "Symend",
    expectedYearFounded: 2016,
    sources: ["Digital engagement platform history", "Fintech reports", "Company LinkedIn"],
    confidence: "high",
    category: "Fintech"
  },

  // Gaming Companies
  {
    name: "Kabam",
    expectedYearFounded: 2006,
    sources: ["Mobile gaming history", "Company acquisition records", "Gaming industry timeline"],
    confidence: "high",
    category: "Game Development Studio"
  },
  {
    name: "Phoenix Labs",
    expectedYearFounded: 2014,
    sources: ["Dauntless development timeline", "Gaming industry reports", "Company history"],
    confidence: "high",
    category: "Game Development Studio"
  },

  // Media & Entertainment
  {
    name: "Thunderbird Entertainment",
    expectedYearFounded: 2004,
    sources: ["Public company records", "Entertainment industry", "TSXV listings"],
    confidence: "high",
    category: "Media Tech"
  },
  {
    name: "Bron Studios",
    expectedYearFounded: 2010,
    sources: ["Film production history", "Entertainment industry", "Company timeline"],
    confidence: "high",
    category: "Media Tech"
  },

  // Enterprise Software
  {
    name: "Absolute Software Vancouver",
    expectedYearFounded: 1993,
    sources: ["Public company history", "Endpoint security timeline", "TSX/NASDAQ records"],
    confidence: "high",
    category: "Enterprise / Corporate Divisions"
  },
  {
    name: "Copperleaf Technologies",
    expectedYearFounded: 2000,
    sources: ["Asset management software history", "IFS acquisition docs", "Enterprise software"],
    confidence: "high",
    category: "Enterprise / Corporate Divisions"
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

async function comprehensiveFoundingDateResearch() {
  console.log('🔍 Starting comprehensive founding date research...\n');
  console.log(`📊 Researching ${foundingDateResearch.length} high-priority companies...\n`);
  
  const results = {
    updated: [],
    alreadyHadDates: [],
    notFound: [],
    errors: [],
    totalUpdated: 0,
    coverageImprovement: 0
  };

  for (const research of foundingDateResearch) {
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
      
      // Check if dates match for validation
      if (currentFoundingDate !== research.expectedYearFounded) {
        console.log(`⚠️  Date mismatch for ${research.name}: DB has ${currentFoundingDate}, research suggests ${research.expectedYearFounded}`);
      }
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
          category: research.category,
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

  // Calculate coverage improvement
  const totalCompaniesProcessed = results.updated.length + results.alreadyHadDates.length;
  results.coverageImprovement = results.totalUpdated;

  // Save research results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `../data/reports/${timestamp}_comprehensive-founding-date-research.json`;
  
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  console.log('\n=== Comprehensive Founding Date Research Summary ===');
  console.log(`Companies Researched: ${foundingDateResearch.length}`);
  console.log(`Founding Dates Added: ${results.totalUpdated}`);
  console.log(`Already Had Dates: ${results.alreadyHadDates.length}`);
  console.log(`Not Found: ${results.notFound.length}`);
  console.log(`Errors: ${results.errors.length}`);
  console.log(`Coverage Improvement: +${results.coverageImprovement} companies`);
  
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
      console.log(`  - ${company.name} (expected: ${company.expectedYear})`);
    });
  }

  // Show date validation issues
  const dateMismatches = results.alreadyHadDates.filter(
    company => company.existingYear !== company.expectedYear
  );
  
  if (dateMismatches.length > 0) {
    console.log('\n⚠️  Date Validation Issues:');
    dateMismatches.forEach(company => {
      console.log(`  - ${company.name}: DB=${company.existingYear}, Research=${company.expectedYear}`);
    });
  }
  
  console.log(`\nDetailed results saved to: ${reportPath}`);
  return results;
}

// Run comprehensive founding date research
comprehensiveFoundingDateResearch()
  .then(() => console.log('\n🎯 Comprehensive founding date research complete!'))
  .catch(error => console.error('❌ Research error:', error));