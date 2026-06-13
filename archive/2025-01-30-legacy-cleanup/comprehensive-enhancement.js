const { Client } = require('@notionhq/client');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const notion = new Client({
  auth: process.env.NOTION_TOKEN
});

const databaseId = process.env.NOTION_DATABASE_ID;

// Load enhancement data
const enhancementData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'website-address-enhancement-data.json'), 'utf8')
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
    
    // Try partial matches for different name formats
    const searchTerms = [
      name.replace(' Vancouver', '').replace(' (Vancouver)', ''),
      name.replace('Vancouver ', ''),
      name.split(' ')[0], // First word only
      name.replace(/ (Inc|Corp|Corporation|Ltd|Limited|Technologies|Technology|AI|Solutions)\.?$/i, '')
    ];
    
    for (const term of searchTerms) {
      if (term !== name && term.length > 2) {
        response = await notion.databases.query({
          database_id: databaseId,
          filter: {
            property: 'Name',
            title: {
              contains: term
            }
          }
        });
        
        if (response.results.length > 0) {
          return response.results[0];
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error finding ${name}:`, error.message);
    return null;
  }
}

async function updateOrganizationData(pageId, orgData, orgName) {
  try {
    const properties = {};
    
    // Website URL
    if (orgData.website) {
      properties['Website'] = { url: orgData.website };
    }
    
    // Address information (add to City/Region field)
    if (orgData.address) {
      properties['City/Region'] = {
        rich_text: [{
          text: { content: orgData.address }
        }]
      };
    }
    
    // Key People information
    if (orgData.keyPeople) {
      properties['Key People'] = {
        rich_text: [{
          text: { content: orgData.keyPeople }
        }]
      };
    }
    
    // Additional notes (combine with existing if any)
    if (orgData.notes) {
      properties['Focus & Notes'] = {
        rich_text: [{
          text: { content: orgData.notes }
        }]
      };
    }
    
    await notion.pages.update({
      page_id: pageId,
      properties
    });
    
    return true;
  } catch (error) {
    console.error(`Error updating ${orgName}:`, error.message);
    return false;
  }
}

async function comprehensiveEnhancement() {
  console.log(`\n🚀 Comprehensive enhancement for ${enhancementData.length} organizations...\n`);
  
  const results = {
    updated: 0,
    notFound: 0,
    failed: 0,
    notFoundOrgs: [],
    failedOrgs: [],
    enhancements: {
      websites: 0,
      addresses: 0,
      keyPeople: 0,
      notes: 0
    }
  };
  
  for (const orgData of enhancementData) {
    const page = await findOrganizationByName(orgData.name);
    
    if (page) {
      const success = await updateOrganizationData(page.id, orgData, orgData.name);
      if (success) {
        const enhancementTypes = [];
        if (orgData.website) {
          enhancementTypes.push('🌐 Website');
          results.enhancements.websites++;
        }
        if (orgData.address) {
          enhancementTypes.push('📍 Address');
          results.enhancements.addresses++;
        }
        if (orgData.keyPeople) {
          enhancementTypes.push('👤 Key People');
          results.enhancements.keyPeople++;
        }
        if (orgData.notes) {
          enhancementTypes.push('📝 Notes');
          results.enhancements.notes++;
        }
        
        console.log(`✅ Enhanced: ${orgData.name} (${enhancementTypes.join(', ')})`);
        results.updated++;
      } else {
        console.log(`❌ Failed to enhance: ${orgData.name}`);
        results.failed++;
        results.failedOrgs.push(orgData.name);
      }
    } else {
      console.log(`⚠️  Not found: ${orgData.name}`);
      results.notFound++;
      results.notFoundOrgs.push(orgData.name);
    }
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 400));
  }
  
  console.log(`\n📊 Comprehensive Enhancement Results:`);
  console.log(`✅ Successfully enhanced: ${results.updated}`);
  console.log(`⚠️  Organizations not found: ${results.notFound}`);
  console.log(`❌ Failed enhancements: ${results.failed}`);
  
  console.log(`\n🎯 Data Points Added:`);
  console.log(`🌐 Website URLs: ${results.enhancements.websites}`);
  console.log(`📍 Physical addresses: ${results.enhancements.addresses}`);
  console.log(`👤 Key people: ${results.enhancements.keyPeople}`);
  console.log(`📝 Additional notes: ${results.enhancements.notes}`);
  
  if (results.notFoundOrgs.length > 0) {
    console.log(`\n⚠️  Organizations not found in database:`);
    results.notFoundOrgs.forEach(org => console.log(`- ${org}`));
  }
  
  if (results.failedOrgs.length > 0) {
    console.log(`\n❌ Failed to enhance:`);
    results.failedOrgs.forEach(org => console.log(`- ${org}`));
  }
  
  // Save results
  fs.writeFileSync(
    path.join(__dirname, 'comprehensive-enhancement-results.json'),
    JSON.stringify(results, null, 2)
  );
  
  console.log(`\n📄 Results saved to comprehensive-enhancement-results.json`);
  return results;
}

// Run the enhancement if called directly
if (require.main === module) {
  comprehensiveEnhancement();
}

module.exports = { comprehensiveEnhancement };