const { Client } = require('@notionhq/client');
const dotenv = require('dotenv');

dotenv.config();

const notion = new Client({
  auth: process.env.NOTION_TOKEN
});

const databaseId = process.env.NOTION_DATABASE_ID;

async function addOrganization(org) {
  try {
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        'Name': {
          title: [{
            text: { content: org.name }
          }]
        },
        'Category': org.category ? {
          select: { name: org.category }
        } : undefined,
        'Subcategory': org.subcategory ? {
          multi_select: org.subcategory.map(s => ({ name: s }))
        } : undefined,
        'Website': org.url ? {
          url: org.url
        } : undefined,
        'City/Region': org.city ? {
          rich_text: [{
            text: { content: org.city }
          }]
        } : undefined,
        'BC Region': org.region ? {
          select: { name: org.region }
        } : undefined,
        'Email': org.email ? {
          email: org.email
        } : undefined,
        'Phone': org.phone ? {
          rich_text: [{
            text: { content: org.phone }
          }]
        } : undefined,
        'LinkedIn': org.linkedin ? {
          url: org.linkedin
        } : undefined,
        'Contact Person': org.contactPerson ? {
          rich_text: [{
            text: { content: org.contactPerson }
          }]
        } : undefined
      }
    });
    console.log(`✅ Added: ${org.name}`);
    return response;
  } catch (error) {
    console.error(`❌ Failed to add ${org.name}:`, error.message);
    return null;
  }
}

async function batchAddOrganizations(organizations) {
  console.log(`\n🚀 Adding ${organizations.length} organizations to Notion...\n`);
  
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };
  
  for (const org of organizations) {
    const result = await addOrganization(org);
    if (result) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push(org.name);
    }
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n📊 Results:`);
  console.log(`✅ Successfully added: ${results.success}`);
  console.log(`❌ Failed: ${results.failed}`);
  if (results.errors.length > 0) {
    console.log(`Failed organizations: ${results.errors.join(', ')}`);
  }
  
  return results;
}

// Export for use in other scripts
module.exports = { addOrganization, batchAddOrganizations };

// If run directly, process organizations
if (require.main === module) {
  // Example usage - organizations to add
  const orgsToAdd = [
    // From discovery-scout-expanded.md
    { name: "MATT3R", category: "Startup", city: "Vancouver", region: "Lower Mainland" },
    { name: "Indiegraf", category: "Startup", city: "Vancouver", region: "Lower Mainland" },
    { name: "Defang Software Labs", category: "Startup", city: "Vancouver", region: "Lower Mainland" },
    { name: "Lila Sciences", category: "Startup", city: "Vancouver", region: "Lower Mainland" },
    { name: "AI Summit Vancouver 2025", category: "Non-Profit", city: "Vancouver", region: "Lower Mainland" },
    { name: "AI Community Conference Vancouver", category: "Non-Profit", city: "Vancouver", region: "Lower Mainland" },
    { name: "DevFest YVR AI Summit", category: "Non-Profit", city: "Vancouver", region: "Lower Mainland" },
    { name: "Vancouver AI Academy", category: "Education & Training Providers", city: "Vancouver", region: "Lower Mainland" },
    { name: "Van AI Space", category: "Grassroots Communities", city: "Vancouver", region: "Lower Mainland" },
    { name: "Applied AI Research Association", category: "Industry Association", city: "Vancouver", region: "Lower Mainland" },
    { name: "Vancouver AI Community", category: "Grassroots Communities", city: "Vancouver", region: "Lower Mainland" },
    { name: "AI4Good Canada", category: "Non-Profit", city: "Vancouver", region: "Lower Mainland" },
    { name: "UBC Centre for Artificial Intelligence Decision-making and Action", category: "Academic & Research Labs", city: "Vancouver", region: "Lower Mainland" },
    { name: "SFU AI Research Group", category: "Academic & Research Labs", city: "Burnaby", region: "Lower Mainland" },
    { name: "BCIT Applied Artificial Intelligence Program", category: "Education & Training Providers", city: "Burnaby", region: "Lower Mainland" },
    { name: "BC Centre for Innovation and Clean Energy AI Program", category: "Government", city: "Vancouver", region: "Lower Mainland" },
    { name: "Creative Destruction Lab Vancouver", category: "Accelerator", city: "Vancouver", region: "Lower Mainland" },
    { name: "entrepreneurship@UBC Accelerate", category: "Accelerator", city: "Vancouver", region: "Lower Mainland" },
    { name: "Coast Capital Savings Innovation Centre", category: "Accelerators / Incubators", city: "Vancouver", region: "Lower Mainland" },
    { name: "BC Tech Association Hypergrowth", category: "Industry Association", city: "Vancouver", region: "Lower Mainland" }
  ];
  
  batchAddOrganizations(orgsToAdd);
}