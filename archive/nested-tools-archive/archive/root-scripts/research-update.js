#!/usr/bin/env node
/**
 * Update Notion database with researched organization information
 * Usage: node scripts/research-update.js
 */
require('dotenv').config();
const { Client } = require('@notionhq/client');

if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
  console.error('Set NOTION_TOKEN and NOTION_DATABASE_ID env vars');
  process.exit(1);
}

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const dbId = process.env.NOTION_DATABASE_ID;

// Organization updates from research
const organizationUpdates = [
  {
    name: "Unblocked",
    website: "https://getunblocked.com/",
    linkedin: "https://ca.linkedin.com/company/getunblocked",
    primaryContact: "Dennis Pilarinos (Founder & CEO)",
    keyPeople: "Dennis Pilarinos - Founder & CEO (previously at Microsoft, Amazon, Apple)",
    focusNotes: "$30M total funding ($20M Series A in May 2025 from B Capital, Radical Ventures, Artisanal Ventures). Contextual code intelligence platform.",
    shortBlurb: "Contextual code intelligence platform that helps developers understand codebases by augmenting source code with knowledge from GitHub, Slack, Confluence"
  },
  {
    name: "Defang",
    website: "https://defang.io/",
    email: "info@defang.io",
    phone: "+1 (604) 960-1842",
    linkedin: "https://ca.linkedin.com/company/defanglabs",
    primaryContact: "Prakash Sundaresan (Co-Founder & CEO)",
    keyPeople: "Prakash Sundaresan (Co-Founder & CEO), Lionello Lunesu (Co-Founder & CTO), Antoine Cote (Co-Founder)",
    shortBlurb: "Simplifies cloud application development and deployment, taking developers from Docker Compose to production-ready AWS deployments in minutes"
  },
  {
    name: "Fintel Connect",
    website: "https://www.fintelconnect.com/",
    email: "info@fintelconnect.com",
    phone: "+1 604-566-8020 x 101",
    linkedin: "https://ca.linkedin.com/company/fintelconnect",
    cityRegion: "Vancouver",
    primaryContact: "Nicky Senyard (Founder & CEO)",
    keyPeople: "Nicky Senyard - Founder & CEO",
    focusNotes: "$4.8M CAD seed round led by BankTech Ventures. Address: #1660 – 1075 West Georgia Street, Vancouver, BC V6E 3C9",
    shortBlurb: "Partner marketing platform, network & agency built specifically for the financial services and fintech industry"
  },
  {
    name: "SandboxAQ",
    website: "https://www.sandboxaq.com/",
    linkedin: "https://www.linkedin.com/company/sandboxaq",
    primaryContact: "Arman Zaribafiyan (Head of Product, AI & Simulation, former Good Chemistry CEO)",
    keyPeople: "Jack Hidary (CEO), Arman Zaribafiyan (Head of Product, AI & Simulation - former Good Chemistry CEO)",
    focusNotes: "Acquired Vancouver-based Good Chemistry for ~$75M to accelerate AI simulation platform for drug discovery. Backed by T. Rowe Price, Eric Schmidt, Breyer Capital.",
    shortBlurb: "AI and quantum technology company that acquired Vancouver's Good Chemistry to accelerate AI simulation platform for drug discovery"
  },
  {
    name: "Thales Canada",
    website: "https://www.thalesgroup.com/en/americas/canada",
    email: "kevin.payan@thalesgroup.com",
    phone: "343-997-6542",
    linkedin: "https://www.linkedin.com/company/thales",
    primaryContact: "Kevin Payan (Director of Communications)",
    keyPeople: "Kevin Payan - Director of Communications",
    focusNotes: "Part of Thales Group (publicly traded), 2000+ employees across Canada including Vancouver. Home to cortAIx AI accelerator.",
    shortBlurb: "Leader in aerospace, defense, digital identity & security with Vancouver presence and cortAIx AI accelerator"
  },
  {
    name: "Advertising Intelligence",
    website: "https://www.adint.ai/",
    shortBlurb: "Provides audience analytics for outdoor advertising, enabling measurement of marketing spend effectiveness"
  }
];

// Note updates for existing organizations
const noteUpdates = [
  {
    name: "Amass AI",
    focusNotes: "Note: This appears to be based in Copenhagen, Denmark, not Vancouver"
  },
  {
    name: "3DentAI", 
    focusNotes: "Note: No company with this exact name was found - possibly confused with 3D Dental Lab"
  },
  {
    name: "Simform",
    focusNotes: "Note: They have Canadian presence in Quebec, not confirmed in Vancouver"
  }
];

async function findOrganizationByName(name) {
  try {
    const response = await notion.databases.query({
      database_id: dbId,
      filter: {
        property: 'Name',
        title: {
          equals: name
        }
      }
    });
    
    return response.results.length > 0 ? response.results[0] : null;
  } catch (error) {
    console.error(`Error finding ${name}:`, error.message);
    return null;
  }
}

async function updateOrganization(pageId, updates) {
  try {
    const properties = {};
    
    // Website (URL field)
    if (updates.website) {
      properties['Website'] = { url: updates.website };
    }
    
    // LinkedIn (URL field) 
    if (updates.linkedin) {
      properties['LinkedIn'] = { url: updates.linkedin };
    }
    
    // Email (email field)
    if (updates.email) {
      properties['Email'] = { email: updates.email };
    }
    
    // Phone (phone_number field)
    if (updates.phone) {
      properties['Phone'] = { phone_number: updates.phone };
    }
    
    // City/Region (rich text field)
    if (updates.cityRegion) {
      properties['City/Region'] = {
        rich_text: [{
          text: { content: updates.cityRegion }
        }]
      };
    }
    
    // Primary Contact (rich text field)
    if (updates.primaryContact) {
      properties['Primary Contact'] = {
        rich_text: [{
          text: { content: updates.primaryContact }
        }]
      };
    }
    
    // Key People (rich text field)
    if (updates.keyPeople) {
      properties['Key People'] = {
        rich_text: [{
          text: { content: updates.keyPeople }
        }]
      };
    }
    
    // Focus & Notes (rich text field)
    if (updates.focusNotes) {
      properties['Focus & Notes'] = {
        rich_text: [{
          text: { content: updates.focusNotes }
        }]
      };
    }
    
    // Short Blurb (rich text field)
    if (updates.shortBlurb) {
      properties['Short Blurb'] = {
        rich_text: [{
          text: { content: updates.shortBlurb }
        }]
      };
    }
    
    const response = await notion.pages.update({
      page_id: pageId,
      properties
    });
    
    return true;
  } catch (error) {
    console.error(`Error updating:`, error.message);
    return false;
  }
}

async function updateAllOrganizations() {
  console.log(`\n🔍 Updating researched information for ${organizationUpdates.length} organizations...\n`);
  
  let updated = 0;
  let notFound = 0;
  let failed = 0;
  
  // Process main organization updates
  for (const update of organizationUpdates) {
    const org = await findOrganizationByName(update.name);
    
    if (org) {
      const success = await updateOrganization(org.id, update);
      if (success) {
        console.log(`✅ Updated: ${update.name}`);
        updated++;
      } else {
        console.log(`❌ Failed to update: ${update.name}`);
        failed++;
      }
    } else {
      console.log(`⚠️  Not found: ${update.name}`);
      notFound++;
    }
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log(`\n📝 Adding notes to ${noteUpdates.length} existing organizations...\n`);
  
  // Process note updates
  for (const update of noteUpdates) {
    const org = await findOrganizationByName(update.name);
    
    if (org) {
      const success = await updateOrganization(org.id, update);
      if (success) {
        console.log(`✅ Added note: ${update.name}`);
        updated++;
      } else {
        console.log(`❌ Failed to add note: ${update.name}`);
        failed++;
      }
    } else {
      console.log(`⚠️  Not found for note: ${update.name}`);
      notFound++;
    }
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log(`\n📊 Research Update Results:`);
  console.log(`✅ Updated: ${updated}`);
  console.log(`⚠️  Not found: ${notFound}`);
  console.log(`❌ Failed: ${failed}`);
}

updateAllOrganizations();