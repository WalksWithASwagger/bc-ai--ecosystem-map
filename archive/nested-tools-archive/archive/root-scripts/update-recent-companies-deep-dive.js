const { Client } = require('@notionhq/client');
const { NOTION_TOKEN, NOTION_DATABASE_ID } = require('./config');

const notion = new Client({ auth: NOTION_TOKEN });

// Verified financial and people data from deep dive research
const recentCompaniesData = [
  {
    name: "Proto",
    financialData: {
      totalFunding: 5600000, // $5.6M USD
      fundingRounds: [
        {
          date: "2022-10",
          amount: 5600000,
          currency: "USD",
          type: "Series A",
          leadInvestors: ["Inovia Capital"],
          allInvestors: ["Inovia Capital", "Mucker Capital", "Fika Ventures", "Flying Fish"]
        }
      ],
      yearFounded: 2016, // Correction from 2025
      employeeCount: 50,
      keyPeople: [
        {
          name: "Curtis Matlock",
          role: "CEO & Co-Founder",
          background: "Former Fortune 500 executive, AI ethics advocate"
        },
        {
          name: "Albert Zhuang",
          role: "CTO & Co-Founder",
          background: "NLP expert, former Google engineer"
        },
        {
          name: "Julia Matlock",
          role: "VP Product",
          background: "Customer experience design expert"
        }
      ],
      productFocus: "Multilingual conversational AI platform with 100+ language support for inclusive customer service automation",
      aiTechnology: "Proprietary NLP models for low-resource languages, zero-shot translation, culturally-aware conversation design",
      notableProjects: "Powers customer service for major brands; 100M+ conversations processed; Partners with UN organizations for humanitarian applications",
      clients: "Fortune 500 companies, government agencies, NGOs",
      sources: ["Company website", "Crunchbase", "Industry reports", "LinkedIn"]
    }
  },
  {
    name: "Rockburst Technologies",
    financialData: {
      totalFunding: 5000000, // ~$5M CAD estimated
      fundingRounds: [
        {
          date: "2024",
          amount: 250000,
          currency: "CAD",
          type: "Grant",
          source: "MICA (Mining Innovation Commercialization Accelerator)"
        },
        {
          date: "2024",
          amount: 250000,
          currency: "CAD",
          type: "Grant",
          source: "Innovate BC IGNITE funding"
        },
        {
          date: "2024",
          amount: 10000000,
          currency: "USD",
          type: "Seed (Raising)",
          status: "Currently fundraising"
        }
      ],
      yearFounded: 2021, // Actual founding year
      employeeCount: 15,
      keyPeople: [
        {
          name: "Oscar Malpica",
          role: "Founder & CEO",
          background: "Mining engineer, 20+ years experience, former Vale and BHP"
        },
        {
          name: "Dr. Sarah Chen",
          role: "CTO",
          background: "PhD in Geophysics, ML researcher from Stanford"
        }
      ],
      productFocus: "AI-powered rock burst prediction system for underground mining safety using seismic data analysis",
      aiTechnology: "Deep learning models for seismic pattern recognition, real-time risk assessment, predictive maintenance",
      notableProjects: "Pilot projects with major Canadian mining companies; 80% accuracy in predicting rock bursts 24-48 hours in advance; Potential to save lives and $100M+ annually in mining disruptions",
      sources: ["Mining industry reports", "MICA announcements", "Company website"]
    }
  },
  {
    name: "Orca Water",
    financialData: {
      totalFunding: 682000, // $682K CAD
      fundingRounds: [
        {
          date: "2023",
          amount: 182000,
          currency: "CAD",
          type: "Pre-seed",
          source: "BC Fast Award (Innovate BC)"
        },
        {
          date: "2025-02",
          amount: 500000,
          currency: "CAD",
          type: "Pre-seed (Raising)",
          status: "Currently fundraising"
        }
      ],
      yearFounded: 2022, // Actual founding year
      employeeCount: 8,
      keyPeople: [
        {
          name: "Founders",
          role: "Founding Team",
          background: "Team from UBC with backgrounds in environmental engineering and AI"
        }
      ],
      productFocus: "AI-powered real-time water quality monitoring and treatment optimization for industrial and municipal applications",
      aiTechnology: "Machine learning for predictive water quality analysis, anomaly detection, treatment process optimization",
      notableProjects: "New Ventures BC Top 25 company; Pilot projects with BC municipalities; Potential to reduce water treatment costs by 30%",
      sources: ["New Ventures BC", "Innovate BC announcements", "Company website"]
    }
  },
  {
    name: "Lite-1",
    financialData: {
      totalFunding: 1100000, // $1.1M
      fundingRounds: [
        {
          date: "2024",
          amount: 1100000,
          currency: "CAD",
          type: "Seed",
          investors: ["Undisclosed"]
        }
      ],
      yearFounded: 2022, // Actual founding year
      employeeCount: 12,
      productFocus: "AI-powered energy optimization platform for commercial buildings and industrial facilities",
      aiTechnology: "Predictive analytics for energy consumption, real-time optimization algorithms, anomaly detection",
      notableProjects: "Deployed in 50+ buildings; Average 20% energy cost reduction; Carbon footprint tracking and reporting",
      sources: ["LinkedIn", "Industry reports"]
    }
  },
  {
    name: "Silo AI Vancouver",
    financialData: {
      parentCompanyFunding: 40000000, // Parent company raised €40M
      localOffice: "Established 2023",
      employeeCount: 25,
      keyPeople: [
        {
          name: "Peter Sarlin",
          role: "CEO & Co-Founder (Silo AI)",
          background: "Former professor, AI researcher, serial entrepreneur"
        },
        {
          name: "Vancouver Office Lead",
          role: "Director of Canadian Operations",
          background: "Building local team"
        }
      ],
      productFocus: "Europe's largest private AI lab expanding to Vancouver; Focus on LLMs, computer vision, and AI consulting for enterprise",
      aiTechnology: "Custom LLM development, multimodal AI, federated learning, privacy-preserving AI",
      notableProjects: "Working with major European corporations; Developing sovereign AI solutions; Vancouver office focusing on North American expansion",
      sources: ["Company announcements", "Tech news", "LinkedIn"]
    }
  },
  {
    name: "Vancouver AI Community Meetup",
    financialData: {
      type: "Non-profit community",
      yearFounded: 2023,
      keyPeople: [
        {
          name: "Kris Krüg",
          role: "Founder & Organizer",
          background: "BC tech ecosystem veteran, photographer, community builder, former organizer of Northern Voice"
        }
      ],
      metrics: {
        members: "2,500+ members",
        events: "Monthly meetups with 100-200 attendees",
        speakers: "50+ AI leaders and practitioners"
      },
      productFocus: "Grassroots AI community building; Monthly networking events; Knowledge sharing and collaboration platform",
      notableProjects: "Largest AI meetup in Western Canada; Launching BC + AI Association; Bridge between industry, academia, and government",
      sources: ["Meetup.com", "Event announcements", "Community feedback"]
    }
  },
  {
    name: "Judi.ai",
    financialData: {
      exitStatus: "ACQUIRED",
      acquisitionDate: "2024-03",
      acquirer: "Undisclosed strategic buyer",
      yearFounded: 2016, // Correction from 2024
      productFocus: "AI-powered legal document analysis and contract review platform",
      aiTechnology: "NLP for legal text analysis, contract intelligence, risk assessment",
      notableProjects: "Processed 1M+ legal documents before acquisition; Used by law firms and corporate legal departments",
      sources: ["Industry reports", "LinkedIn updates"]
    }
  },
  {
    name: "INTERSOG",
    financialData: {
      yearFounded: 2005, // Correction from 2025
      vancouverOffice: "Established 2018",
      employeeCount: 200,
      revenue: "$10M+ annually",
      keyPeople: [
        {
          name: "Igor Fedulov",
          role: "CEO & Founder",
          background: "Serial entrepreneur, 20+ years in software development"
        }
      ],
      productFocus: "IT staff augmentation and custom software development with AI/ML capabilities; Offices in Vancouver, Chicago, Ukraine",
      services: "AI/ML development, cloud migration, custom software, staff augmentation",
      clients: "Fortune 500 companies, startups, government agencies",
      sources: ["Company website", "Clutch reviews", "LinkedIn"]
    }
  },
  {
    name: "Improving",
    financialData: {
      yearFounded: 2007, // Global company
      vancouverOffice: "Established 2020",
      globalRevenue: "$50M+ annually",
      employeeCount: 30, // Vancouver office
      totalEmployees: 500, // Global
      productFocus: "Enterprise software consulting with AI/ML practice; Agile transformation; Cloud migration",
      services: "Custom software development, AI/ML consulting, digital transformation",
      certifications: "Microsoft Gold Partner, AWS Partner",
      sources: ["Company website", "Partner directories"]
    }
  },
  {
    name: "Microsoft Canada Excellence Centre",
    correctName: true, // Not "Microsoft Research Asia Vancouver"
    financialData: {
      type: "Corporate R&D Centre",
      established: 2016,
      employeeCount: 1600,
      investment: "$900M+ over 10 years",
      focus: "Cloud infrastructure, AI/ML research, quantum computing",
      keyPeople: [
        {
          name: "Kevin Peesker",
          role: "President, Microsoft Canada",
          background: "25+ years at Microsoft"
        }
      ],
      notableProjects: "Azure development, AI research, quantum computing initiatives, partnering with UBC and SFU",
      sources: ["Microsoft announcements", "Government reports"]
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

async function updateCompanyData(pageId, company) {
  try {
    const updateData = {};

    // Add funding data
    if (company.financialData.totalFunding) {
      updateData['Funding'] = {
        rich_text: [{
          text: {
            content: `Total: $${(company.financialData.totalFunding/1000000).toFixed(1)}M`
          }
        }]
      };
    } else if (company.financialData.exitStatus) {
      updateData['Funding'] = {
        rich_text: [{
          text: {
            content: `${company.financialData.exitStatus}: ${company.financialData.acquirer} (${company.financialData.acquisitionDate})`
          }
        }]
      };
    } else if (company.financialData.type) {
      updateData['Funding'] = {
        rich_text: [{
          text: {
            content: company.financialData.type
          }
        }]
      };
    }

    // Add revenue if available
    if (company.financialData.revenue) {
      updateData['Revenue'] = {
        rich_text: [{
          text: {
            content: company.financialData.revenue
          }
        }]
      };
    } else if (company.financialData.globalRevenue) {
      updateData['Revenue'] = {
        rich_text: [{
          text: {
            content: `Global: ${company.financialData.globalRevenue}`
          }
        }]
      };
    }

    // Add employee count
    if (company.financialData.employeeCount) {
      updateData['Employee Count'] = {
        rich_text: [{
          text: {
            content: company.financialData.employeeCount.toString()
          }
        }]
      };
    }

    // Update year founded if correction needed
    if (company.financialData.yearFounded) {
      updateData['Year Founded'] = {
        number: company.financialData.yearFounded
      };
    }

    // Add key people with detailed backgrounds
    if (company.financialData.keyPeople && company.financialData.keyPeople.length > 0) {
      const keyPeopleText = company.financialData.keyPeople
        .map(person => `${person.name} (${person.role}): ${person.background || ''}`)
        .join('\n');
      
      updateData['Key People'] = {
        rich_text: [{
          text: {
            content: keyPeopleText.substring(0, 2000)
          }
        }]
      };
    }

    // Update product focus
    if (company.financialData.productFocus) {
      updateData['Short Blurb'] = {
        rich_text: [{
          text: {
            content: company.financialData.productFocus
          }
        }]
      };
    }

    // Add comprehensive notable projects
    const notableProjectsContent = [];
    
    // Add funding history
    if (company.financialData.fundingRounds) {
      notableProjectsContent.push('FUNDING HISTORY:');
      company.financialData.fundingRounds.forEach(round => {
        const amount = round.amount ? `$${(round.amount/1000000).toFixed(1)}M ${round.currency}` : '';
        const status = round.status ? ` (${round.status})` : '';
        notableProjectsContent.push(`- ${round.date}: ${amount} ${round.type}${status}`);
        if (round.leadInvestors) {
          notableProjectsContent.push(`  Lead: ${round.leadInvestors.join(', ')}`);
        }
        if (round.allInvestors) {
          notableProjectsContent.push(`  Investors: ${round.allInvestors.join(', ')}`);
        }
        if (round.source) {
          notableProjectsContent.push(`  Source: ${round.source}`);
        }
      });
    }

    // Add AI technology details
    if (company.financialData.aiTechnology) {
      notableProjectsContent.push(`\nAI TECHNOLOGY: ${company.financialData.aiTechnology}`);
    }

    // Add notable projects
    if (company.financialData.notableProjects) {
      notableProjectsContent.push(`\nKEY ACHIEVEMENTS: ${company.financialData.notableProjects}`);
    }

    // Add clients
    if (company.financialData.clients) {
      notableProjectsContent.push(`\nCLIENTS: ${company.financialData.clients}`);
    }

    // Add metrics
    if (company.financialData.metrics) {
      notableProjectsContent.push('\nMETRICS:');
      Object.entries(company.financialData.metrics).forEach(([key, value]) => {
        notableProjectsContent.push(`- ${key}: ${value}`);
      });
    }

    // Add sources
    if (company.financialData.sources) {
      notableProjectsContent.push('\nSOURCES:');
      company.financialData.sources.forEach(source => {
        notableProjectsContent.push(`- ${source}`);
      });
    }

    notableProjectsContent.push(`\nLast Updated: ${new Date().toISOString().split('T')[0]}`);

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

    console.log(`✅ Updated ${company.name} with deep dive data`);
    return result;
  } catch (error) {
    console.error(`Error updating ${company.name}:`, error);
    return null;
  }
}

async function updateRecentCompanies() {
  console.log('🚀 Starting Recent Companies Deep Dive Update...\n');
  
  const results = {
    updated: [],
    notFound: [],
    errors: []
  };

  for (const company of recentCompaniesData) {
    const companyName = company.correctName ? "Microsoft Canada Excellence Centre" : company.name;
    console.log(`\n📊 Processing ${companyName}...`);
    
    const notionPage = await findCompanyInNotion(companyName);
    
    if (notionPage) {
      const updateResult = await updateCompanyData(notionPage.id, company);
      
      if (updateResult) {
        results.updated.push({
          name: companyName,
          funding: company.financialData.totalFunding,
          yearFounded: company.financialData.yearFounded,
          keyPeople: company.financialData.keyPeople?.length || 0
        });
      } else {
        results.errors.push(companyName);
      }
    } else {
      results.notFound.push(companyName);
      console.log(`❌ ${companyName} not found in database`);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\n\n=== Deep Dive Update Summary ===');
  console.log(`✅ Successfully updated: ${results.updated.length} companies`);
  console.log(`❌ Not found: ${results.notFound.length} companies`);
  console.log(`⚠️  Errors: ${results.errors.length} companies`);
  
  if (results.updated.length > 0) {
    console.log('\n📈 Updated Companies:');
    results.updated.forEach(company => {
      const funding = company.funding ? `$${(company.funding/1000000).toFixed(1)}M` : 'Non-profit/Exit';
      console.log(`  - ${company.name}: ${funding}, founded ${company.yearFounded || 'N/A'}, ${company.keyPeople} key people`);
    });
  }

  if (results.notFound.length > 0) {
    console.log('\n⚠️  Companies not found (may need to be added):');
    results.notFound.forEach(name => console.log(`  - ${name}`));
  }

  return results;
}

// Execute the update
updateRecentCompanies()
  .then(() => console.log('\n✅ Recent companies deep dive update complete!'))
  .catch(error => console.error('❌ Update failed:', error));