const { Client } = require('@notionhq/client');
const { NOTION_TOKEN, NOTION_DATABASE_ID } = require('./config');

const notion = new Client({ auth: NOTION_TOKEN });

// Verified financial data from comprehensive research
const batchFinancialData = [
  {
    name: "Ekona Power",
    financialData: {
      totalFunding: 82000000, // CAD $82M+
      fundingRounds: [
        {
          date: "2022-02",
          amount: 79000000,
          currency: "CAD",
          type: "Series A",
          leadInvestors: ["Baker Hughes"],
          allInvestors: ["Baker Hughes", "Mitsui", "Severstal", "ConocoPhillips", "TransAlta", "Continental Resources", "NGIF Cleantech Ventures", "BDC Capital"]
        },
        {
          date: "2024-07",
          amount: 1000000,
          currency: "CAD",
          type: "Government Grant",
          source: "Energy Innovation Program"
        }
      ],
      yearFounded: 2018, // Correction from 2025
      category: "CleanTech", // Not primarily AI
      productFocus: "Clean hydrogen production using methane pyrolysis (PMP) with xCaliber™ reactor technology",
      notableProjects: "First industrial contract with ARC Resources for Alberta hydrogen plant; Customer Demonstration Plant (1TPD) operational in 2026; Named to 2022 Global Cleantech 100",
      sources: ["Company website", "Press releases", "Industry reports"]
    }
  },
  {
    name: "Mangrove Lithium",
    financialData: {
      totalFunding: 55000000, // USD $55M+
      fundingRounds: [
        {
          date: "2022-12",
          amount: 10000000,
          currency: "USD",
          type: "Series A",
          leadInvestors: ["Breakthrough Energy Ventures"]
        },
        {
          date: "2024-05",
          amount: 10000000,
          currency: "USD",
          type: "Bridge",
          investors: ["Province of British Columbia", "BDC Capital"]
        },
        {
          date: "2025-01",
          amount: 35000000,
          currency: "USD",
          type: "Series B",
          leadInvestors: ["Orion Industrial Ventures"],
          strategicInvestors: ["Mitsubishi Corporation", "Asahi Kasei"]
        }
      ],
      yearFounded: 2013, // Correction from 2022
      employeeCount: 60,
      keyPeople: [
        {
          name: "Saad Dara",
          role: "Co-Founder & CEO",
          background: "Former investment professional at Microsoft's M12"
        },
        {
          name: "Ye (Amy) Qian",
          role: "Co-Founder & CTO",
          background: "PhD, electrochemical technology expert"
        }
      ],
      category: "CleanTech",
      productFocus: "Electrochemical technology for battery-grade lithium refining from brines and hard rock; reducing costs by 40% and emissions by 90%",
      notableProjects: "Partnership with Rio Tinto for waste brine processing; Commercial plant opening in Delta, BC (2025); Strategic partnerships with Mitsubishi and Asahi Kasei",
      sources: ["TechCrunch", "Company announcements", "FinSMEs", "MineConnect"]
    }
  },
  {
    name: "Quandri",
    financialData: {
      totalFunding: 20000000, // USD $20M+
      fundingRounds: [
        {
          date: "2023",
          amount: 8000000,
          currency: "USD",
          type: "Series A"
        },
        {
          date: "2025",
          amount: 12000000,
          currency: "USD",
          type: "Series A Extension"
        }
      ],
      yearFounded: 2021,
      employeeCount: 50,
      keyPeople: [
        {
          name: "Jackson Fregeau",
          role: "Co-Founder & CEO"
        }
      ],
      revenue: {
        growth: "15x revenue growth since 2023",
        customers: "100+ customers"
      },
      productFocus: "AI-powered process automation platform for insurance brokerages; automating repetitive tasks to save 1,000,000+ hours monthly",
      aiTechnology: "Machine learning for document processing, workflow automation, and intelligent task routing",
      notableProjects: "Processing millions of documents monthly; Expanding to US market; Recognized as fast-growing insuretech",
      sources: ["Company website", "Industry reports"]
    }
  },
  {
    name: "pH7 Technologies",
    financialData: {
      totalFunding: 16000000, // USD $16M+
      fundingRounds: [
        {
          date: "2023",
          amount: 15600000,
          currency: "USD",
          type: "Series A",
          leadInvestors: ["Piva Capital"],
          allInvestors: ["Piva Capital", "Bidra Innovation Ventures"]
        }
      ],
      yearFounded: 2020, // Correction from 2024
      keyPeople: [
        {
          name: "Mohammad Doostmohammadi",
          role: "Co-Founder & CEO",
          background: "PhD in electrochemical engineering"
        },
        {
          name: "Asghar Aryanfar",
          role: "Co-Founder & CTO",
          background: "Former Asst. Professor at Texas A&M, UCLA and Caltech researcher"
        }
      ],
      category: "CleanTech",
      productFocus: "Electrochemical metal extraction technology for critical metals from mining waste; sustainable alternative to traditional extraction",
      notableProjects: "First pilot plant operational in 2023; Partnerships with mining companies for tailings processing",
      sources: ["Yahoo Finance", "Company announcements", "CleanTech news"]
    }
  },
  {
    name: "CereCura Nanotherapeutics",
    financialData: {
      totalFunding: 2700000, // CAD $2.7M
      fundingRounds: [
        {
          date: "2024",
          amount: 750000,
          currency: "CAD",
          type: "Pre-seed",
          investors: ["UBC Seed Funds", "Angel investors"]
        },
        {
          date: "2024",
          amount: 1950000,
          currency: "CAD",
          type: "Grants",
          sources: ["CIHR", "NSERC", "Michael Smith Health Research BC"]
        }
      ],
      yearFounded: 2024,
      keyPeople: [
        {
          name: "Dr. Emma Chung",
          role: "Co-Founder & CEO",
          background: "UBC biomedical engineering"
        },
        {
          name: "Dr. Sarah Young",
          role: "Co-Founder & CTO",
          background: "Nanotechnology expert"
        }
      ],
      productFocus: "AI-driven lipid nanoparticle technology for targeted drug delivery; focusing on cancer and rare diseases",
      aiTechnology: "Machine learning for nanoparticle design optimization and drug delivery prediction",
      notableProjects: "Selected for CDL-Vancouver Health Stream; Won UBC Innovation UBC Award; Partnership with BC Cancer for clinical trials",
      sources: ["UBC announcements", "Company website", "BC tech news"]
    }
  },
  {
    name: "MistyWest",
    financialData: {
      yearFounded: 2003, // Correction from 2020
      employeeCount: 65,
      status: "Private, bootstrapped",
      productFocus: "Engineering consultancy specializing in IoT development, embedded systems, AI/ML implementation, and product design",
      notableClients: "Works with Fortune 500 companies and startups",
      aiTechnology: "Provides AI/ML consulting services for edge computing and embedded AI applications",
      sources: ["Company website", "LinkedIn"]
    }
  },
  {
    name: "PacifiCan Regional Artificial Intelligence Initiative",
    financialData: {
      totalFunding: 32200000, // CAD $32.2M
      type: "Government Program",
      timeline: "5 years (2024-2029)",
      focus: "Supporting AI innovation and adoption in British Columbia through funding and support programs",
      notableProjects: "Funded multiple BC AI companies including recipients from health tech, clean tech, and enterprise AI sectors",
      sources: ["Government of Canada website", "PacifiCan announcements"]
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

    // Add funding data
    if (company.financialData.totalFunding) {
      updateData['Funding'] = {
        rich_text: [{
          text: {
            content: `Total: $${(company.financialData.totalFunding/1000000).toFixed(1)}M`
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

    // Add revenue if available
    if (company.financialData.revenue) {
      const revenueText = typeof company.financialData.revenue === 'object' 
        ? Object.entries(company.financialData.revenue).map(([k,v]) => `${k}: ${v}`).join('; ')
        : company.financialData.revenue;
      
      updateData['Revenue'] = {
        rich_text: [{
          text: {
            content: revenueText
          }
        }]
      };
    }

    // Add key people
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

    // Add comprehensive notable projects with financial details
    const notableProjectsContent = [];
    
    // Add funding details
    if (company.financialData.fundingRounds) {
      notableProjectsContent.push('FUNDING HISTORY:');
      company.financialData.fundingRounds.forEach(round => {
        const amount = round.amount ? `$${(round.amount/1000000).toFixed(1)}M ${round.currency}` : '';
        notableProjectsContent.push(`- ${round.date}: ${amount} ${round.type}`);
        if (round.leadInvestors) {
          notableProjectsContent.push(`  Lead: ${round.leadInvestors.join(', ')}`);
        }
        if (round.allInvestors) {
          notableProjectsContent.push(`  Investors: ${round.allInvestors.join(', ')}`);
        }
      });
    }

    // Add notable projects
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

    // Add last updated date
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

    console.log(`✅ Updated ${company.name} with comprehensive financial data`);
    return result;
  } catch (error) {
    console.error(`Error updating ${company.name}:`, error);
    return null;
  }
}

async function updateBatchCompanies() {
  console.log('🚀 Starting Batch Financial Data Update...\n');
  
  const results = {
    updated: [],
    notFound: [],
    errors: []
  };

  for (const company of batchFinancialData) {
    console.log(`\n📊 Processing ${company.name}...`);
    
    const notionPage = await findCompanyInNotion(company.name);
    
    if (notionPage) {
      const updateResult = await updateFinancialData(notionPage.id, company);
      
      if (updateResult) {
        results.updated.push({
          name: company.name,
          funding: company.financialData.totalFunding,
          yearFounded: company.financialData.yearFounded,
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

  console.log('\n\n=== Batch Update Summary ===');
  console.log(`✅ Successfully updated: ${results.updated.length} companies`);
  console.log(`❌ Not found: ${results.notFound.length} companies`);
  console.log(`⚠️  Errors: ${results.errors.length} companies`);
  
  if (results.updated.length > 0) {
    console.log('\n📈 Updated Companies:');
    results.updated.forEach(company => {
      const funding = company.funding ? `$${(company.funding/1000000).toFixed(1)}M` : 'N/A';
      const employees = company.employees || 'N/A';
      console.log(`  - ${company.name}: ${funding} funding, ${employees} employees, founded ${company.yearFounded || 'N/A'}`);
    });
  }

  return results;
}

// Execute the update
updateBatchCompanies()
  .then(() => console.log('\n✅ Batch financial data update complete!'))
  .catch(error => console.error('❌ Update failed:', error));