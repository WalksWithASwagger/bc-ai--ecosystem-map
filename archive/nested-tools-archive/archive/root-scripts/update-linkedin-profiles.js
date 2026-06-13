const { Client } = require('@notionhq/client');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const notion = new Client({
  auth: process.env.NOTION_TOKEN
});

const databaseId = process.env.NOTION_DATABASE_ID;

// Load LinkedIn data
const linkedinData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'linkedin-updates.json'), 'utf8')
);

async function findOrganizationByName(name) {
  try {
    // Try exact match first
    let response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Name',
        title: {
          equals: name
        }
      }
    });
    
    if (response.results.length > 0) {
      return response.results[0];
    }
    
    // Try contains match
    response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Name',
        title: {
          contains: name
        }
      }
    });
    
    if (response.results.length > 0) {
      return response.results[0];
    }
    
    // Try without common suffixes
    const cleanName = name.replace(/ (Inc|Corp|Corporation|Ltd|Limited|Technologies|Technology|AI|Solutions)\.?$/i, '');
    if (cleanName !== name) {
      response = await notion.databases.query({
        database_id: databaseId,
        filter: {
          property: 'Name',
          title: {
            contains: cleanName
          }
        }
      });
      
      if (response.results.length > 0) {
        return response.results[0];
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error finding ${name}:`, error.message);
    return null;
  }
}

async function updateLinkedInProfile(pageId, linkedinUrl, orgName) {
  try {
    await notion.pages.update({
      page_id: pageId,
      properties: {
        'LinkedIn': {
          url: linkedinUrl
        }
      }
    });
    return true;
  } catch (error) {
    console.error(`Error updating LinkedIn for ${orgName}:`, error.message);
    return false;
  }
}

async function updateAllLinkedInProfiles() {
  console.log(`\n🔗 Updating LinkedIn profiles for ${linkedinData.length} organizations...\n`);
  
  const results = {
    updated: 0,
    notFound: 0,
    failed: 0,
    notFoundOrgs: [],
    failedOrgs: []
  };
  
  for (const org of linkedinData) {
    const page = await findOrganizationByName(org.name);
    
    if (page) {
      const success = await updateLinkedInProfile(page.id, org.linkedin, org.name);
      if (success) {
        console.log(`✅ Updated LinkedIn: ${org.name}`);
        results.updated++;
      } else {
        console.log(`❌ Failed to update: ${org.name}`);
        results.failed++;
        results.failedOrgs.push(org.name);
      }
    } else {
      console.log(`⚠️  Not found: ${org.name}`);
      results.notFound++;
      results.notFoundOrgs.push(org.name);
    }
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log(`\n📊 LinkedIn Update Results:`);
  console.log(`✅ Successfully updated: ${results.updated}`);
  console.log(`⚠️  Organizations not found: ${results.notFound}`);
  console.log(`❌ Failed updates: ${results.failed}`);
  
  if (results.notFoundOrgs.length > 0) {
    console.log(`\nOrganizations not found in database:`);
    results.notFoundOrgs.forEach(org => console.log(`- ${org}`));
  }
  
  if (results.failedOrgs.length > 0) {
    console.log(`\nFailed to update:`);
    results.failedOrgs.forEach(org => console.log(`- ${org}`));
  }
  
  // Save results
  fs.writeFileSync(
    path.join(__dirname, 'linkedin-update-results.json'),
    JSON.stringify(results, null, 2)
  );
  
  console.log(`\n📄 Results saved to linkedin-update-results.json`);
  return results;
}

// Run the update if called directly
if (require.main === module) {
  updateAllLinkedInProfiles();
}

module.exports = { updateAllLinkedInProfiles };