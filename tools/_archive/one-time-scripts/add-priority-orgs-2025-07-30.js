const { Client } = require('@notionhq/client');
const fs = require('fs');

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN || process.env.NOTION_API_KEY,
});

// You'll need to set this to your actual database ID
const DATABASE_ID = process.env.NOTION_DATABASE_ID || 'YOUR_DATABASE_ID_HERE';

// The four high-priority organizations to add
const highPriorityOrgs = [
  {
    name: "Reflection.ai",
    focus: "AI technology (specific focus TBD)",
    funding: "$130M Series A (2025)",
    location: "Brooklyn-based with potential BC presence",
    category: "Start-ups & Scale-ups",
    bcRegion: "To be verified",
    size: "Scale-up (51-250)",
    status: "Active",
    shortBlurb: "AI technology company with $130M Series A funding in 2025. Brooklyn-based with potential BC presence.",
    focusNotes: "Needs BC presence verification"
  },
  {
    name: "PacifiCan Regional Artificial Intelligence Initiative",
    focus: "AI innovation and adoption support",
    funding: "$32.2M over 5 years",
    location: "BC",
    category: "Government & Public Sector",
    bcRegion: "Province-wide",
    size: "Government",
    status: "Active",
    website: "https://www.canada.ca/en/pacific-economic-development/",
    shortBlurb: "Federal AI funding program for BC. $32.2M over 5 years for AI innovation and adoption support.",
    focusNotes: "Agency: Pacific Economic Development Canada | Type: Government Program"
  },
  {
    name: "Good Chemistry",
    focus: "Quantum computing for drug discovery",
    status: "Acquired",
    location: "Vancouver, BC",
    category: "Start-ups & Scale-ups",
    bcRegion: "Lower Mainland",
    sector: "HealthTech/BioTech",
    aiAreas: "Quantum-AI drug discovery",
    shortBlurb: "Quantum computing for drug discovery platform. Acquired by SandboxAQ.",
    focusNotes: "Status: Acquired by SandboxAQ | Quantum-AI drug discovery platform"
  },
  {
    name: "Open Ocean Robotics",
    focus: "Autonomous marine vessels",
    location: "Victoria, BC",
    category: "Start-ups & Scale-ups",
    bcRegion: "Vancouver Island",
    sector: "Ocean Tech",
    status: "Active",
    shortBlurb: "Autonomous marine vessels for ocean monitoring and data collection.",
    focusNotes: "Focus: Ocean monitoring and data collection | Type: Ocean Tech startup"
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
  if (org.shortBlurb) {
    properties['Short Blurb'] = {
      rich_text: [
        {
          text: {
            content: org.shortBlurb.substring(0, 500) // Limit to 500 chars
          }
        }
      ]
    };
  }

  // Add focus notes
  if (org.focusNotes) {
    properties['Focus Notes'] = {
      rich_text: [
        {
          text: {
            content: org.focusNotes
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
          content: 'Priority Import 2025-07-30'
        }
      }
    ]
  };

  // Add funding if available
  if (org.funding) {
    properties['Funding'] = {
      rich_text: [
        {
          text: {
            content: org.funding
          }
        }
      ]
    };
  }

  // Add sector if available
  if (org.sector) {
    properties['Sector'] = {
      select: {
        name: org.sector
      }
    };
  }

  return properties;
}

// Function to check if database ID is set
function checkConfiguration() {
  if (!process.env.NOTION_TOKEN && !process.env.NOTION_API_KEY) {
    console.error('❌ Error: NOTION_TOKEN or NOTION_API_KEY environment variable not set');
    console.log('Please set one of these environment variables with your Notion API key');
    return false;
  }

  if (DATABASE_ID === 'YOUR_DATABASE_ID_HERE') {
    console.error('❌ Error: NOTION_DATABASE_ID not set');
    console.log('Please set the NOTION_DATABASE_ID environment variable with your Notion database ID');
    console.log('You can find this in the URL when viewing your database in Notion');
    return false;
  }

  return true;
}

// Function to add organization to Notion
async function addOrganization(org) {
  try {
    const response = await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties: createPageProperties(org)
    });
    
    console.log(`✅ Added: ${org.name}`);
    return { success: true, name: org.name, id: response.id };
  } catch (error) {
    console.error(`❌ Error adding ${org.name}:`, error.message);
    return { success: false, name: org.name, error: error.message };
  }
}

// Main function to run the import
async function runImport() {
  console.log('🚀 Starting High-Priority Organizations Import...');
  console.log(`📊 Organizations to import: ${highPriorityOrgs.length}`);
  
  // Check configuration
  if (!checkConfiguration()) {
    return;
  }

  const results = {
    success: 0,
    failed: 0,
    details: []
  };

  console.log('\n📌 Adding high-priority organizations...\n');
  
  for (const org of highPriorityOrgs) {
    console.log(`Processing: ${org.name}...`);
    const result = await addOrganization(org);
    
    if (result.success) {
      results.success++;
    } else {
      results.failed++;
    }
    
    results.details.push(result);
    
    // Rate limiting - wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Generate summary report
  console.log('\n📊 Import Summary:');
  console.log('==================');
  console.log(`✅ Success: ${results.success}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log('\nDetails:');
  results.details.forEach(detail => {
    if (detail.success) {
      console.log(`  ✅ ${detail.name} (ID: ${detail.id})`);
    } else {
      console.log(`  ❌ ${detail.name} - Error: ${detail.error}`);
    }
  });

  // Save detailed results
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const filename = `priority-import-results-${timestamp}.json`;
  fs.writeFileSync(
    filename,
    JSON.stringify(results, null, 2)
  );
  console.log(`\n💾 Detailed results saved to: ${filename}`);
}

// Run the import
if (require.main === module) {
  runImport().catch(console.error);
}

module.exports = { addOrganization, createPageProperties };