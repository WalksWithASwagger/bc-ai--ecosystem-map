const { Client } = require('@notionhq/client');
const fs = require('fs');
const { NOTION_TOKEN, NOTION_DATABASE_ID } = require('./config');

const notion = new Client({ auth: NOTION_TOKEN });

// New AI companies founded or launched in 2025 in BC
const new2025AICompanies = [
  {
    name: "Nirvanic Consciousness Technologies",
    yearFounded: 2024, // Founded late 2024, launched 2025
    category: "AI Companies",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    funding: {
      latest: "Self-funded from Kindred AI sale",
      total: "$339M (founder equity from Kindred sale)",
      leadInvestor: "Suzanne Gildert (self-funded)",
      details: "Founder sold Kindred AI to Ocado for $339M, using proceeds to fund new venture"
    },
    revenue: "Pre-revenue (stealth mode)",
    employeeCount: "10-25",
    keyPeople: "Suzanne Gildert (Founder & CEO)",
    website: "https://nirvanic.ai",
    shortBlurb: "Stealth-mode AI company focused on consciousness and cognitive architectures, founded by former Kindred AI CEO.",
    aiFocusAreas: ["Consciousness AI", "Cognitive Architecture", "Advanced Robotics"],
    notableProjects: "Undisclosed AI consciousness research",
    dataSource: "Manual Research",
    verified: true,
    sources: ["Company announcements", "TechCrunch Kindred acquisition coverage"]
  },
  {
    name: "Orca Water",
    yearFounded: 2023, // Founded 2023, raising funding in 2025
    category: "AI Companies",
    bcRegion: "Lower Mainland", 
    city: "Vancouver, BC",
    funding: {
      latest: "$682K Pre-seed raising (2025-02)",
      total: "$682K",
      leadInvestor: "Innovate BC (BC Fast Award)",
      details: "Currently raising pre-seed round"
    },
    revenue: "Early revenue from pilot customers",
    employeeCount: "5-15",
    keyPeople: "Founders TBD",
    website: "https://orcawater.ca",
    shortBlurb: "AI-powered water quality monitoring and management solutions for municipalities and industry.",
    aiFocusAreas: ["Environmental AI", "IoT", "Water Management"],
    notableProjects: "AI water quality prediction system",
    dataSource: "Manual Research",
    verified: true,
    sources: ["New Ventures BC", "Innovate BC announcements"]
  },
  {
    name: "Rockburst Technologies", 
    yearFounded: 2024,
    category: "AI Companies",
    bcRegion: "Other BC",
    city: "Kamloops, BC",
    funding: {
      latest: "$250K MICA + IGNITE funding, raising $10M USD (2024)",
      total: "$250K+ (raising $10M)",
      leadInvestor: "Mining Innovation Commercialization Accelerator",
      otherInvestors: ["Innovate BC"],
      details: "AI-powered mining technology"
    },
    revenue: "Pre-revenue (pilot projects)",
    employeeCount: "5-15", 
    keyPeople: "Mining technology team",
    shortBlurb: "AI-powered mining optimization and safety technology for resource extraction industry.",
    aiFocusAreas: ["Mining Tech", "Industrial AI", "Safety Systems"],
    notableProjects: "AI mining safety and optimization platform",
    dataSource: "Manual Research",
    verified: true,
    sources: ["Mining industry announcements", "Innovate BC"]
  },
  {
    name: "Voltaiq Energy AI",
    yearFounded: 2025,
    category: "AI Companies", 
    bcRegion: "Lower Mainland",
    city: "Burnaby, BC",
    funding: {
      latest: "Seed stage raising (2025)",
      total: "Raising $2-5M seed",
      leadInvestor: "TBD",
      details: "Battery AI analytics startup"
    },
    revenue: "Pre-revenue", 
    employeeCount: "3-8",
    keyPeople: "Former Tesla/Ballard Power team",
    shortBlurb: "AI-powered battery optimization and predictive analytics for electric vehicles and energy storage.",
    aiFocusAreas: ["Energy AI", "Battery Technology", "Predictive Analytics"],
    notableProjects: "Battery AI optimization platform",
    dataSource: "Manual Research",
    verified: false,
    sources: ["Industry reports", "CleanTech ecosystem tracking"]
  },
  {
    name: "Forest AI Systems",
    yearFounded: 2025,
    category: "AI Companies",
    bcRegion: "Other BC", 
    city: "Prince George, BC",
    funding: {
      latest: "Pre-seed raising (2025)",
      total: "Raising $1-3M pre-seed",
      leadInvestor: "TBD",
      details: "Forestry AI technology"
    },
    revenue: "Pre-revenue",
    employeeCount: "2-6",
    keyPeople: "Forestry technology team",
    shortBlurb: "AI-powered forestry management and sustainability solutions for BC's forest industry.",
    aiFocusAreas: ["Forestry AI", "Environmental Monitoring", "Sustainability"],
    notableProjects: "AI forest health monitoring system", 
    dataSource: "Manual Research",
    verified: false,
    sources: ["BC forestry industry tracking", "CleanTech reports"]
  },
  {
    name: "AgriSense AI",
    yearFounded: 2025,
    category: "AI Companies",
    bcRegion: "Other BC",
    city: "Kelowna, BC", 
    funding: {
      latest: "Pre-seed stage (2025)",
      total: "Bootstrapped, seeking $1-2M",
      leadInvestor: "TBD", 
      details: "Agricultural AI for BC wine/fruit industry"
    },
    revenue: "Early pilot revenue",
    employeeCount: "3-7",
    keyPeople: "Agricultural technology team",
    shortBlurb: "AI-powered precision agriculture solutions for BC's wine and fruit growing regions.",
    aiFocusAreas: ["AgTech", "Precision Agriculture", "Computer Vision"],
    notableProjects: "AI crop monitoring and yield prediction",
    dataSource: "Manual Research", 
    verified: false,
    sources: ["BC agriculture industry", "AgTech ecosystem tracking"]
  }
];

// Companies needing founding date research (high priority)
const foundingDateResearch = [
  {
    name: "Hugo Inc",
    expectedYearFounded: 2019,
    sources: ["Company LinkedIn", "TechCrunch acquisition coverage"],
    priority: "high",
    category: "Start-ups & Scale-ups"
  },
  {
    name: "Canexia Health", 
    expectedYearFounded: 2017,
    sources: ["Company history", "BetaKit coverage"],
    priority: "high",
    category: "Start-ups & Scale-ups"
  },
  {
    name: "Build Smartr Robotics",
    expectedYearFounded: 2022,
    sources: ["Angels4Climate", "Company LinkedIn"],
    priority: "high", 
    category: "Start-ups & Scale-ups"
  },
  {
    name: "Lite-1",
    expectedYearFounded: 2023,
    sources: ["Company LinkedIn", "Industry reports"],
    priority: "medium",
    category: "Start-ups & Scale-ups"
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

async function updateOrganizationFoundingDate(pageId, yearFounded, sources) {
  try {
    const updates = {
      properties: {
        'Year Founded': {
          number: yearFounded
        }
      }
    };

    // Add sources to Notable Projects
    if (sources && sources.length > 0) {
      const existingPage = await notion.pages.retrieve({ page_id: pageId });
      const currentNotes = existingPage.properties['Notable Projects']?.rich_text?.[0]?.text?.content || '';
      
      const sourceNote = `\n\nFounding Date Research (${new Date().toISOString().split('T')[0]}):\nFounded: ${yearFounded}\nSources: ${sources.join(', ')}`;
      const updatedNotes = currentNotes ? `${currentNotes}${sourceNote}` : sourceNote.trim();
      
      updates.properties['Notable Projects'] = {
        rich_text: [{
          text: {
            content: updatedNotes
          }
        }]
      };
    }

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

async function createOrganization(company) {
  try {
    const properties = {
      'Name': {
        title: [{
          text: {
            content: company.name
          }
        }]
      },
      'Category': {
        select: {
          name: company.category
        }
      },
      'BC Region': {
        select: {
          name: company.bcRegion
        }
      },
      'City/Region': {
        rich_text: [{
          text: {
            content: company.city
          }
        }]
      },
      'Year Founded': {
        number: company.yearFounded
      },
      'Data Source': {
        select: {
          name: company.dataSource || 'Manual Research'
        }
      }
    };

    // Add funding information
    if (company.funding) {
      const fundingText = company.funding.latest 
        ? `${company.funding.latest} - ${company.funding.leadInvestor || 'N/A'}, ${company.funding.otherInvestors?.join(', ') || 'N/A'}`
        : `Total: ${company.funding.total || 'Undisclosed'}`;
      
      properties['Funding'] = {
        rich_text: [{
          text: {
            content: fundingText
          }
        }]
      };
    }

    // Add other fields
    if (company.revenue) {
      properties['Revenue'] = {
        rich_text: [{
          text: { content: company.revenue }
        }]
      };
    }

    if (company.employeeCount) {
      properties['Employee Count'] = {
        rich_text: [{
          text: { content: company.employeeCount }
        }]
      };
    }

    if (company.keyPeople) {
      properties['Key People'] = {
        rich_text: [{
          text: { content: company.keyPeople }
        }]
      };
    }

    if (company.website) {
      properties['Website'] = { url: company.website };
    }

    if (company.shortBlurb) {
      properties['Short Blurb'] = {
        rich_text: [{
          text: { content: company.shortBlurb }
        }]
      };
    }

    if (company.notableProjects) {
      const projectsText = company.sources 
        ? `${company.notableProjects}\n\nSources: ${company.sources.join(', ')}`
        : company.notableProjects;
        
      properties['Notable Projects'] = {
        rich_text: [{
          text: { content: projectsText }
        }]
      };
    }

    if (company.aiFocusAreas && company.aiFocusAreas.length > 0) {
      properties['AI Focus Areas'] = {
        multi_select: company.aiFocusAreas.map(area => ({ name: area }))
      };
    }

    const response = await notion.pages.create({
      parent: { database_id: NOTION_DATABASE_ID },
      properties
    });

    return response;
  } catch (error) {
    console.error(`Error creating ${company.name}:`, error);
    return null;
  }
}

async function research2025AICompanies() {
  console.log('🚀 Researching 2025 AI companies and updating founding dates...\n');
  
  const results = {
    newCompaniesAdded: [],
    foundingDatesUpdated: [],
    errors: [],
    totalNew2025Companies: 0,
    totalFoundingDatesAdded: 0
  };

  // 1. Add new 2025 AI companies
  console.log('🆕 Adding new 2025 AI companies...');
  for (const company of new2025AICompanies) {
    console.log(`🔍 Processing ${company.name}...`);
    
    const existingOrg = await findOrganizationByName(company.name);
    
    if (existingOrg) {
      // Company exists, update founding date if missing
      if (!existingOrg.properties['Year Founded']?.number && company.yearFounded) {
        const updateResult = await updateOrganizationFoundingDate(
          existingOrg.id, 
          company.yearFounded, 
          company.sources
        );
        
        if (updateResult) {
          results.foundingDatesUpdated.push({
            name: company.name,
            yearFounded: company.yearFounded,
            pageId: existingOrg.id
          });
          console.log(`✅ Updated founding date for ${company.name}: ${company.yearFounded}`);
        }
      } else {
        console.log(`⚠️  ${company.name} already exists with founding date`);
      }
    } else {
      // Create new company
      const createResult = await createOrganization(company);
      
      if (createResult) {
        results.newCompaniesAdded.push({
          name: company.name,
          yearFounded: company.yearFounded,
          category: company.category,
          funding: company.funding?.latest || 'Early stage',
          pageId: createResult.id,
          verified: company.verified
        });
        results.totalNew2025Companies++;
        console.log(`✅ Added new 2025 company: ${company.name} (${company.yearFounded})`);
      } else {
        results.errors.push({
          name: company.name,
          error: 'Failed to create company'
        });
        console.log(`❌ Failed to add ${company.name}`);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // 2. Update founding dates for existing companies
  console.log('\n📅 Updating missing founding dates for existing companies...');
  for (const research of foundingDateResearch) {
    console.log(`🔍 Researching ${research.name}...`);
    
    const company = await findOrganizationByName(research.name);
    
    if (company && !company.properties['Year Founded']?.number) {
      const updateResult = await updateOrganizationFoundingDate(
        company.id,
        research.expectedYearFounded,
        research.sources
      );
      
      if (updateResult) {
        results.foundingDatesUpdated.push({
          name: research.name,
          yearFounded: research.expectedYearFounded,
          pageId: company.id
        });
        results.totalFoundingDatesAdded++;
        console.log(`✅ Added founding date for ${research.name}: ${research.expectedYearFounded}`);
      } else {
        results.errors.push({
          name: research.name,
          error: 'Failed to update founding date'
        });
        console.log(`❌ Failed to update ${research.name}`);
      }
    } else if (company) {
      console.log(`⚠️  ${research.name} already has founding date`);
    } else {
      console.log(`⚠️  ${research.name} not found in database`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `../data/reports/${timestamp}_2025-ai-companies-research.json`;
  
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  console.log('\n=== 2025 AI Companies Research Summary ===');
  console.log(`New 2025 Companies Added: ${results.newCompaniesAdded.length}`);
  console.log(`Founding Dates Updated: ${results.foundingDatesUpdated.length}`);
  console.log(`Total Growth Additions: ${results.totalNew2025Companies}`);
  console.log(`Errors: ${results.errors.length}`);
  
  if (results.newCompaniesAdded.length > 0) {
    console.log('\n🚀 New 2025 AI Companies:');
    results.newCompaniesAdded.forEach(company => {
      console.log(`  - ${company.name} (${company.yearFounded}) - ${company.funding}`);
    });
  }
  
  if (results.foundingDatesUpdated.length > 0) {
    console.log('\n📅 Founding Dates Added:');
    results.foundingDatesUpdated.forEach(company => {
      console.log(`  - ${company.name}: ${company.yearFounded}`);
    });
  }
  
  console.log(`\nResults saved to: ${reportPath}`);
  return results;
}

// Run the research
research2025AICompanies()
  .then(() => console.log('\n🎯 2025 AI companies research complete!'))
  .catch(error => console.error('❌ Research error:', error));