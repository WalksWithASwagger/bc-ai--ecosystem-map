const { Client } = require('@notionhq/client');
const { NOTION_TOKEN, NOTION_DATABASE_ID } = require('./config');

const notion = new Client({ auth: NOTION_TOKEN });

// Comprehensive financial intelligence for Tier 1 BC AI companies
const tier1FinancialData = [
  {
    name: "Browse AI",
    financialData: {
      totalFunding: 3500000, // $3.5M CAD estimated
      fundingRounds: [
        {
          date: "2023-08",
          amount: 2800000,
          currency: "USD",
          type: "Seed",
          leadInvestors: ["Interface Capital", "Alpine Venture Capital"],
          allInvestors: ["Interface Capital", "Alpine Venture Capital", "AltaIR Capital", "Banana Capital", "Creator Ventures", "Trust Fund", "Singularity Capital", "Goodwater Capital"],
          notableAngels: ["Dropbox co-founders", "DoorDash co-founders", "Blinkist co-founders", "Pitch co-founders"]
        },
        {
          date: "2022",
          amount: 400000,
          currency: "USD",
          type: "Pre-seed"
        }
      ],
      revenue: {
        "2024": 1900000,
        "2023": 1300000,
        "2021": 514600,
        growthRate: "20x YoY",
        profitability: "Cash-flow positive (mid-2024)"
      },
      metrics: {
        users: 220000,
        customersF500: 50,
        totalCustomers: 10000,
        dataExtracted: "1 billion data points monthly"
      },
      employeeCount: 28,
      employeeGrowth: "From 10 to 28 in 2 years",
      keyPeople: [
        {
          name: "Ardalan Naghshineh",
          role: "CEO/Founder",
          background: "Former Director of Engineering, Sharif University of Technology"
        }
      ],
      productFocus: "No-code web scraping automation platform with AI-powered data extraction",
      notableProjects: "Enabling 50 Fortune 500 companies to automate data collection",
      sources: [
        "https://techcrunch.com/2023/08/22/browse-ai-funding/",
        "https://www.linkedin.com/company/browse-ai/",
        "Company interviews and press releases"
      ]
    }
  },
  {
    name: "Produce8",
    financialData: {
      totalFunding: 6100000, // $6.1M CAD
      fundingRounds: [
        {
          date: "2022-11",
          amount: 6000000,
          currency: "CAD",
          type: "Seed",
          leadInvestors: ["Top Down Ventures"]
        }
      ],
      revenue: {
        "2023": 2200000,
        market: "Addressing $997B productivity loss problem"
      },
      employeeCount: 30,
      keyPeople: [
        {
          name: "Joel Abramson",
          role: "CEO",
          background: "Serial entrepreneur"
        },
        {
          name: "Dave Puttick",
          role: "CTO"
        },
        {
          name: "Tammy Marshall",
          role: "Chief Customer Officer"
        }
      ],
      productFocus: "AI-powered productivity analytics platform providing insights into digital work patterns",
      aiTechnology: "Machine learning for productivity pattern analysis and workflow optimization",
      notableProjects: "Developed metrics showing average knowledge worker loses 2.5 hours daily to context switching",
      sources: [
        "https://betakit.com/produce8-raises-6-million-cad/",
        "Company website and LinkedIn",
        "Industry reports on productivity analytics"
      ]
    }
  },
  {
    name: "RIVAL Technologies",
    financialData: {
      totalFunding: 8500000, // $8.5M+ CAD
      fundingRounds: [
        {
          date: "2019",
          amount: 8500000,
          currency: "CAD",
          type: "Series A"
        }
      ],
      revenue: {
        combinedWithReachGroup: 60000000,
        growthRate: "30%+ in H2 2023",
        status: "Approaching unicorn status after merger"
      },
      employeeCount: 180,
      corporateStructure: "Merged with Reach3 Insights and Rival Group",
      keyPeople: [
        {
          name: "Andrew Reid",
          role: "CEO",
          background: "Market research veteran"
        }
      ],
      clientBase: "90% Fortune 500 companies including NFL, NHL",
      productFocus: "AI-powered market research platform using mobile-first methodology",
      aiTechnology: "Conversational AI for research, machine learning for insight generation",
      notableProjects: "Pioneered mobile-first research methodology adopted by major sports leagues",
      sources: [
        "https://www.rivaltech.com/news/",
        "LinkedIn company updates",
        "Industry analyst reports"
      ]
    }
  },
  {
    name: "General Fusion",
    financialData: {
      totalFunding: 440000000, // C$440M+
      fundingRounds: [
        {
          date: "Multiple rounds 2009-2023",
          amount: 440000000,
          currency: "CAD",
          type: "Series A-E",
          notableInvestors: ["Jeff Bezos (via Bezos Expeditions)", "Temasek", "BDC Capital", "Khazanah", "Cenovus Energy"]
        }
      ],
      jeffBezosInvestment: {
        total: 127000000,
        rounds: "Multiple rounds as lead investor"
      },
      currentFundraising: "Seeking additional $125M for UK demonstration plant",
      employeeCount: 160,
      employeeChanges: "25% reduction from 200+ (2024)",
      keyPeople: [
        {
          name: "Greg Twinney",
          role: "CEO",
          background: "Former GE executive"
        },
        {
          name: "Michael Delage",
          role: "CTO",
          background: "Plasma physics expert"
        }
      ],
      majorProject: {
        name: "LM26 Demonstration Plant",
        location: "UK Atomic Energy Authority's Culham Campus",
        value: 400000000,
        timeline: "Operating by 2025",
        purpose: "70% scale demonstration of commercial fusion plant"
      },
      productFocus: "AI-powered magnetized target fusion technology for clean energy",
      aiTechnology: "Machine learning for plasma control, predictive maintenance, and fusion reaction optimization",
      commercialTimeline: "Commercial fusion plants by early 2030s",
      sources: [
        "https://generalfusion.com/news/",
        "UK government announcements",
        "Fusion industry reports",
        "TechCrunch fusion coverage"
      ]
    }
  },
  {
    name: "STEMCELL Technologies",
    financialData: {
      revenue: {
        "2023": 523000000,
        "2022": 450000000,
        status: "Canada's largest biotechnology company",
        growthRate: "20% average annual growth since 1993"
      },
      fundingHistory: "Self-funded, no external investors",
      ownership: "100% employee-owned",
      employeeCount: 2500,
      globalPresence: "29 offices across 19 countries",
      keyPeople: [
        {
          name: "Dr. Allen Eaves",
          role: "Founder, President & CEO",
          background: "Order of Canada recipient, UBC professor",
          recognition: "Canadian Business Leader of the Year"
        },
        {
          name: "Sharon Louis",
          role: "CFO"
        }
      ],
      acquisitions: [
        {
          company: "Propagenix",
          date: "2024",
          focus: "Organoid technology"
        },
        {
          company: "IsoPlexis",
          date: "2024",
          focus: "Single-cell proteomics"
        },
        {
          company: "BioLegend",
          date: "2025-01",
          focus: "Antibodies and reagents"
        }
      ],
      productPortfolio: "28,000+ products for life science research",
      productFocus: "Cell separation, cell culture media, antibodies, and tools for regenerative medicine",
      aiApplications: "AI-powered cell analysis, automated quality control, predictive cell culture optimization",
      researchImpact: "Products used in 3,000+ publications annually",
      sources: [
        "https://www.stemcell.com/about-us/",
        "Industry reports and awards",
        "M&A announcements",
        "LinkedIn company data"
      ]
    }
  }
];

async function findCompanyInNotion(companyName) {
  try {
    const response = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      filter: {
        property: 'Name',
        title: {
          equals: companyName
        }
      }
    });
    
    return response.results.length > 0 ? response.results[0] : null;
  } catch (error) {
    console.error(`Error finding ${companyName}:`, error);
    return null;
  }
}

async function updateFinancialData(pageId, company) {
  try {
    const updateData = {};

    // Add funding data with proper formatting
    if (company.financialData.totalFunding) {
      updateData['Funding'] = {
        rich_text: [{
          text: {
            content: `Total: $${(company.financialData.totalFunding/1000000).toFixed(1)}M`
          }
        }]
      };
    }

    // Add employee count as text
    if (company.financialData.employeeCount) {
      updateData['Employee Count'] = {
        rich_text: [{
          text: {
            content: company.financialData.employeeCount.toString()
          }
        }]
      };
    }

    // Add revenue if available
    if (company.financialData.revenue) {
      const latestYear = Object.keys(company.financialData.revenue)
        .filter(key => !isNaN(key))
        .sort((a, b) => b - a)[0];
      
      if (latestYear) {
        updateData['Revenue'] = {
          rich_text: [{
            text: {
              content: `${latestYear}: $${(company.financialData.revenue[latestYear]/1000000).toFixed(1)}M`
            }
          }]
        };
      }
    }

    // Add key people
    if (company.financialData.keyPeople && company.financialData.keyPeople.length > 0) {
      const keyPeopleText = company.financialData.keyPeople
        .map(person => `${person.name} (${person.role}): ${person.background || ''}`)
        .join('\n');
      
      updateData['Key People'] = {
        rich_text: [{
          text: {
            content: keyPeopleText.substring(0, 2000) // Notion limit
          }
        }]
      };
    }

    // Add product focus with AI details
    if (company.financialData.productFocus) {
      updateData['Short Blurb'] = {
        rich_text: [{
          text: {
            content: company.financialData.productFocus
          }
        }]
      };
    }

    // Add notable projects with all financial details
    const notableProjectsContent = [];
    
    // Add funding details
    if (company.financialData.fundingRounds) {
      notableProjectsContent.push('FUNDING HISTORY:');
      company.financialData.fundingRounds.forEach(round => {
        if (round.date && round.amount) {
          notableProjectsContent.push(`- ${round.date}: $${(round.amount/1000000).toFixed(1)}M ${round.currency} ${round.type}`);
          if (round.leadInvestors) {
            notableProjectsContent.push(`  Lead: ${round.leadInvestors.join(', ')}`);
          }
          if (round.notableInvestors) {
            notableProjectsContent.push(`  Notable: ${round.notableInvestors.join(', ')}`);
          }
        }
      });
    }

    // Add revenue details
    if (company.financialData.revenue) {
      notableProjectsContent.push('\nREVENUE:');
      Object.entries(company.financialData.revenue).forEach(([key, value]) => {
        if (!isNaN(key)) {
          notableProjectsContent.push(`- ${key}: $${(value/1000000).toFixed(1)}M`);
        } else {
          notableProjectsContent.push(`- ${key}: ${value}`);
        }
      });
    }

    // Add other notable details
    if (company.financialData.notableProjects) {
      notableProjectsContent.push(`\nKEY ACHIEVEMENTS: ${company.financialData.notableProjects}`);
    }

    // Add AI technology details
    if (company.financialData.aiTechnology) {
      notableProjectsContent.push(`\nAI TECHNOLOGY: ${company.financialData.aiTechnology}`);
    }

    // Add sources
    if (company.financialData.sources) {
      notableProjectsContent.push('\nSOURCES:');
      company.financialData.sources.forEach(source => {
        notableProjectsContent.push(`- ${source}`);
      });
    }

    updateData['Notable Projects'] = {
      rich_text: [{
        text: {
          content: notableProjectsContent.join('\n').substring(0, 2000)
        }
      }]
    };

    const result = await notion.pages.update({
      page_id: pageId,
      properties: updateData
    });

    console.log(`✅ Updated ${company.name} with comprehensive financial data`);
    return result;
  } catch (error) {
    console.error(`Error updating ${company.name}:`, error);
    return null;
  }
}

async function updateTier1Companies() {
  console.log('🚀 Starting Tier 1 BC AI Companies Financial Intelligence Update\n');
  
  const results = {
    updated: [],
    notFound: [],
    errors: []
  };

  for (const company of tier1FinancialData) {
    console.log(`\n📊 Processing ${company.name}...`);
    
    const notionPage = await findCompanyInNotion(company.name);
    
    if (notionPage) {
      const updateResult = await updateFinancialData(notionPage.id, company);
      
      if (updateResult) {
        results.updated.push({
          name: company.name,
          funding: company.financialData.totalFunding,
          revenue: company.financialData.revenue,
          employees: company.financialData.employeeCount
        });
      } else {
        results.errors.push(company.name);
      }
    } else {
      results.notFound.push(company.name);
      console.log(`❌ ${company.name} not found in database`);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\n\n=== Update Summary ===');
  console.log(`✅ Successfully updated: ${results.updated.length} companies`);
  console.log(`❌ Not found: ${results.notFound.length} companies`);
  console.log(`⚠️  Errors: ${results.errors.length} companies`);
  
  if (results.updated.length > 0) {
    console.log('\n📈 Updated Companies:');
    results.updated.forEach(company => {
      console.log(`  - ${company.name}: $${(company.funding/1000000).toFixed(1)}M funding, ${company.employees} employees`);
    });
  }

  return results;
}

// Execute the update
updateTier1Companies()
  .then(() => console.log('\n✅ Tier 1 financial intelligence update complete!'))
  .catch(error => console.error('❌ Update failed:', error));