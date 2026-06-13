const { Client } = require('@notionhq/client');
const dotenv = require('dotenv');

dotenv.config();

const notion = new Client({
  auth: process.env.NOTION_TOKEN
});

const databaseId = process.env.NOTION_DATABASE_ID;

// Contact information from contact-harvest-log.md
const contactUpdates = [
  { name: "Payday", email: "hello@usepayday.com" },
  { name: "Browse AI", email: "support@browse.ai" },
  { name: "MoogleLabs", email: "info@mooglelabs.com", phone: "+1-415-992-6066" },
  { name: "Kanooq Industries", email: "info@kanooq.com" },
  { name: "Digital Technology Supercluster", email: "info@digitalsupercluster.ca" },
  { name: "Spare", email: "hello@spare.com", phone: "+1-604-398-5673" },
  { name: "Kindred", email: "info@kindred.ai" },
  { name: "Lite-1", email: "info@lite1.com" },
  { name: "AI Scout Solutions", email: "contact@aiscout.io" },
  { name: "BC + AI Ecosystem Association", email: "info@bc-ai.net" },
  { name: "Orca Water", email: "info@orcawater.com" },
  { name: "Build Smartr Robotics", email: "info@buildsmartrobotics.com" },
  { name: "Anodyne Chemistries", email: "info@anodynechemistries.com" },
  { name: "Aqua Intelligent", email: "info@aquaintelligent.com" },
  { name: "SmartParent Mobile Health", email: "support@smartparent.health" },
  { name: "Amphoraxe Life Sciences", email: "info@amphoraxe.com" },
  { name: "Canexia Health", email: "info@canexiahealth.com" },
  { name: "Nytilus", email: "hello@nytilus.com" },
  { name: "Gaze", email: "hello@gaze.ai" },
  { name: "Rockburst Technologies", email: "info@rockburst.com" },
  { name: "Quantum Algorithms Institute", email: "info@quantumalgorithms.org" },
  { name: "Vancouver AI Community Meetup", email: "kris@motleykrugmedia.com", phone: "778-898-3076", 
    keyPeople: "Kris Krüg (Primary Organizer), Issam Laradji, Dylan Nihte" },
  { name: "Photonic Inc", keyPeople: "Dr. Stephanie Simmons (Founder/CQO), Klaus Schuegraf, Alison Berg (CMO)" },
  { name: "Iris Automation", email: "contact@irisonboard.com", phone: "650-761-2195",
    keyPeople: "Jon Damush (CEO), Greg M. Davis (Canadian Sales)" },
  { name: "Wizard Labs", email: "contact@wizardlabs.com", phone: "833-949-2733",
    keyPeople: "Erin Yaylali (Co-Founder & CTO)" },
  { name: "deltAlyz Corp", email: "contact@deltalyz.com", phone: "604-724-5891",
    keyPeople: "Rabi Belot (Technical Founder)" },
  { name: "Proto", keyPeople: "Curtis Matlock (CEO), Vanessa Babicz (COO), Dilan Ozkaynak (CTO)" }
];

async function findOrganizationByName(name) {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
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
    
    if (updates.email) {
      properties['Email'] = { email: updates.email };
    }
    
    if (updates.phone) {
      properties['Phone'] = { 
        phone_number: updates.phone 
      };
    }
    
    if (updates.keyPeople) {
      properties['Key People'] = {
        rich_text: [{
          text: { content: updates.keyPeople }
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

async function updateAllContacts() {
  console.log(`\n📧 Updating contact information for ${contactUpdates.length} organizations...\n`);
  
  let updated = 0;
  let notFound = 0;
  let failed = 0;
  
  for (const update of contactUpdates) {
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
  
  console.log(`\n📊 Contact Update Results:`);
  console.log(`✅ Updated: ${updated}`);
  console.log(`⚠️  Not found: ${notFound}`);
  console.log(`❌ Failed: ${failed}`);
}

updateAllContacts();