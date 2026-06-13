const { Client } = require('@notionhq/client');
const fs = require('fs');

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

// Organizations to add - Priority 1 (Government & Well-funded)
const priorityOneOrgs = [
  {
    name: "Reflection.ai",
    focus: "AI technology",
    funding: "$130M Series A (2025)",
    location: "Brooklyn-based with potential BC presence",
    category: "Start-ups & Scale-ups",
    bcRegion: "To be verified",
    size: "Scale-up (51-250)",
    status: "Active"
  },
  {
    name: "PacifiCan Regional Artificial Intelligence Initiative",
    focus: "AI innovation and adoption support",
    funding: "$32.2M over 5 years",
    location: "BC",
    category: "Government & Public Sector",
    bcRegion: "Province-wide",
    size: "Government",
    website: "https://www.canada.ca/en/pacific-economic-development/"
  },
  {
    name: "Canadian Artificial Intelligence Safety Institute",
    focus: "AI safety and cybersecurity",
    location: "National with BC operations",
    category: "Government & Public Sector",
    bcRegion: "Province-wide",
    launched: "November 2024",
    minister: "François-Philippe Champagne"
  },
  {
    name: "BC Ministry of AI",
    focus: "Provincial AI strategy and governance",
    created: "2025",
    category: "Government & Public Sector",
    bcRegion: "Province-wide",
    type: "Government Department"
  },
  {
    name: "BC Agricultural Technology Adoption Program",
    focus: "Farm tech and AI adoption",
    funding: "Up to $100K per farm",
    timeline: "March-April 2025 applications",
    category: "Government & Public Sector",
    bcRegion: "Province-wide"
  },
  {
    name: "Good Chemistry",
    focus: "Quantum computing for drug discovery",
    status: "Acquired by SandboxAQ",
    location: "Vancouver, BC",
    category: "Start-ups & Scale-ups",
    bcRegion: "Lower Mainland",
    aiAreas: "Quantum-AI drug discovery"
  },
  {
    name: "Open Ocean Robotics",
    focus: "Autonomous marine vessels",
    location: "Victoria, BC",
    category: "Start-ups & Scale-ups",
    bcRegion: "Vancouver Island",
    sector: "Ocean Tech"
  },
  {
    name: "Produce8",
    focus: "Workplace analytics AI",
    location: "Vancouver, BC",
    category: "Start-ups & Scale-ups",
    bcRegion: "Lower Mainland"
  },
  {
    name: "Upper Nicola Band AI Data Centre",
    focus: "Indigenous-led AI infrastructure",
    investment: "$500M",
    partners: "Bell Canada, iTel Networks",
    jobs: "200 permanent, 2,000 construction",
    category: "Infrastructure & Data Centers",
    bcRegion: "Interior"
  },
  {
    name: "BC Clean Energy Innovation Program",
    focus: "AI for energy efficiency",
    launched: "2025",
    target: "Buildings and homes",
    category: "Government & Public Sector",
    bcRegion: "Province-wide"
  }
];

// Organizations to add - Priority 2 (Academic & Research)
const priorityTwoOrgs = [
  {
    name: "UBC AI for Climate Solutions Lab",
    institution: "University of British Columbia",
    focus: "Climate change AI applications",
    category: "Academic & Research",
    bcRegion: "Lower Mainland",
    type: "Research Lab"
  },
  {
    name: "SFU Quantum Fabrication Centre",
    institution: "Simon Fraser University",
    location: "Burnaby, BC",
    focus: "Quantum computing hardware",
    category: "Academic & Research",
    bcRegion: "Lower Mainland"
  },
  {
    name: "BCIT Xanadu Quantum Computing Program",
    partnership: "BCIT and Xanadu",
    achievement: "Canada's first quantum certificate",
    category: "Academic & Research",
    bcRegion: "Lower Mainland"
  },
  {
    name: "UVic AI and Machine Learning Lab",
    institution: "University of Victoria",
    location: "Victoria, BC",
    category: "Academic & Research",
    bcRegion: "Vancouver Island"
  },
  {
    name: "TRU Computer Science Department",
    institution: "Thompson Rivers University",
    location: "Kamloops, BC",
    category: "Academic & Research",
    bcRegion: "Interior"
  },
  {
    name: "UNBC Computer Science Department",
    institution: "University of Northern BC",
    location: "Prince George, BC",
    category: "Academic & Research",
    bcRegion: "Northern BC"
  },
  {
    name: "Quantum Matter Institute",
    institution: "UBC",
    focus: "Quantum materials research",
    category: "Academic & Research",
    bcRegion: "Lower Mainland"
  }
];

// Organizations to add - Priority 3 (Community & Indigenous)
const priorityThreeOrgs = [
  {
    name: "Tkmlps Development Corporation",
    focus: "Indigenous technology development",
    location: "Kamloops, BC",
    category: "Community & Associations",
    bcRegion: "Interior",
    type: "Indigenous Tech Organization"
  },
  {
    name: "FNHA Digital Health Division",
    focus: "First Nations Health Authority digital initiatives",
    location: "Vancouver, BC",
    category: "Community & Associations",
    bcRegion: "Lower Mainland",
    type: "Indigenous Tech & Health"
  },
  {
    name: "Indigenous Digital Equity Strategy BC",
    focus: "Digital equity for Indigenous communities",
    location: "Province-wide",
    category: "Community & Associations",
    bcRegion: "Province-wide",
    type: "Indigenous Tech Initiative"
  },
  {
    name: "Caroline Running Wolf AI Language Project",
    lead: "Caroline Running Wolf (PhD student)",
    focus: "AI for Indigenous language preservation",
    funding: "MITACS government support",
    category: "Academic & Research",
    bcRegion: "Province-wide"
  },
  {
    name: "Quantum BC",
    type: "Industry Association",
    focus: "Quantum computing ecosystem",
    location: "Vancouver, BC",
    category: "Community & Associations",
    bcRegion: "Lower Mainland"
  },
  {
    name: "Vancouver International Privacy & Security Summit",
    event: "26th Annual (March 2024)",
    type: "Annual Conference",
    focus: "Privacy, security, and AI",
    category: "Community & Associations",
    bcRegion: "Lower Mainland"
  },
  {
    name: "DigiBC Signals Program",
    organization: "DigiBC",
    funding: "$720K PacifiCan (Sept 2024)",
    duration: "3-year program",
    members: "250+ companies",
    category: "Community & Associations",
    bcRegion: "Lower Mainland"
  }
];

// Helper function to create Notion page properties
function createPageProperties(org) {
  const properties = {
    'Name': {
      title: [
        {
          text: {
            content: org.name
          }
        }
      ]
    }
  };

  // Add category
  if (org.category) {
    properties['Category'] = {
      select: {
        name: org.category
      }
    };
  }

  // Add BC Region
  if (org.bcRegion) {
    properties['BC Region'] = {
      select: {
        name: org.bcRegion
      }
    };
  }

  // Add location/city
  if (org.location) {
    properties['City/Region'] = {
      rich_text: [
        {
          text: {
            content: org.location
          }
        }
      ]
    };
  }

  // Add AI focus areas
  if (org.focus) {
    properties['AI Focus Areas'] = {
      rich_text: [
        {
          text: {
            content: org.focus
          }
        }
      ]
    };
  }

  // Add website if available
  if (org.website) {
    properties['Website'] = {
      url: org.website
    };
  }

  // Add short blurb
  let blurb = org.focus || '';
  if (org.funding) blurb += `. Funding: ${org.funding}`;
  if (org.investment) blurb += `. Investment: ${org.investment}`;
  if (org.achievement) blurb += `. ${org.achievement}`;
  
  if (blurb) {
    properties['Short Blurb'] = {
      rich_text: [
        {
          text: {
            content: blurb.substring(0, 500) // Limit to 500 chars
          }
        }
      ]
    };
  }

  // Add focus notes for additional details
  let focusNotes = [];
  if (org.type) focusNotes.push(`Type: ${org.type}`);
  if (org.partners) focusNotes.push(`Partners: ${org.partners}`);
  if (org.institution) focusNotes.push(`Institution: ${org.institution}`);
  if (org.lead) focusNotes.push(`Lead: ${org.lead}`);
  if (org.minister) focusNotes.push(`Minister: ${org.minister}`);
  if (org.timeline) focusNotes.push(`Timeline: ${org.timeline}`);
  if (org.jobs) focusNotes.push(`Jobs: ${org.jobs}`);
  if (org.members) focusNotes.push(`Members: ${org.members}`);
  if (org.event) focusNotes.push(`Event: ${org.event}`);

  if (focusNotes.length > 0) {
    properties['Focus Notes'] = {
      rich_text: [
        {
          text: {
            content: focusNotes.join(' | ')
          }
        }
      ]
    };
  }

  // Set status
  properties['Status'] = {
    select: {
      name: org.status || 'Active'
    }
  };

  // Add data source
  properties['Data Source'] = {
    rich_text: [
      {
        text: {
          content: 'Batch Import 2025-07-30'
        }
      }
    ]
  };

  return properties;
}

// Function to add organization to Notion
async function addOrganization(org) {
  try {
    const response = await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties: createPageProperties(org)
    });
    
    console.log(`✅ Added: ${org.name}`);
    return { success: true, name: org.name };
  } catch (error) {
    console.error(`❌ Error adding ${org.name}:`, error.message);
    return { success: false, name: org.name, error: error.message };
  }
}

// Main function to run the import
async function runImport() {
  console.log('🚀 Starting BC AI Ecosystem Batch Import...');
  console.log(`📊 Total organizations to import: ${priorityOneOrgs.length + priorityTwoOrgs.length + priorityThreeOrgs.length}`);
  
  const results = {
    phase1: { success: 0, failed: 0, details: [] },
    phase2: { success: 0, failed: 0, details: [] },
    phase3: { success: 0, failed: 0, details: [] }
  };

  // Phase 1: Priority Government & Funded Organizations
  console.log('\n📌 Phase 1: Government & Well-funded Organizations...');
  for (const org of priorityOneOrgs) {
    const result = await addOrganization(org);
    if (result.success) {
      results.phase1.success++;
    } else {
      results.phase1.failed++;
    }
    results.phase1.details.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
  }

  // Phase 2: Academic & Research
  console.log('\n🎓 Phase 2: Academic & Research Organizations...');
  for (const org of priorityTwoOrgs) {
    const result = await addOrganization(org);
    if (result.success) {
      results.phase2.success++;
    } else {
      results.phase2.failed++;
    }
    results.phase2.details.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
  }

  // Phase 3: Community & Indigenous
  console.log('\n🤝 Phase 3: Community & Indigenous Organizations...');
  for (const org of priorityThreeOrgs) {
    const result = await addOrganization(org);
    if (result.success) {
      results.phase3.success++;
    } else {
      results.phase3.failed++;
    }
    results.phase3.details.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
  }

  // Generate summary report
  console.log('\n📊 Import Summary:');
  console.log('==================');
  console.log(`Phase 1: ${results.phase1.success} success, ${results.phase1.failed} failed`);
  console.log(`Phase 2: ${results.phase2.success} success, ${results.phase2.failed} failed`);
  console.log(`Phase 3: ${results.phase3.success} success, ${results.phase3.failed} failed`);
  console.log(`\nTotal Success: ${results.phase1.success + results.phase2.success + results.phase3.success}`);
  console.log(`Total Failed: ${results.phase1.failed + results.phase2.failed + results.phase3.failed}`);

  // Save detailed results
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  fs.writeFileSync(
    `import-results-${timestamp}.json`,
    JSON.stringify(results, null, 2)
  );
  console.log(`\n💾 Detailed results saved to: import-results-${timestamp}.json`);
}

// Run the import
runImport().catch(console.error);