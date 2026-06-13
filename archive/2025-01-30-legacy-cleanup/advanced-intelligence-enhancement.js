/**
 * ⚠️ WARNING: This tool needs to be updated to comply with Data Validation Policy
 * 
 * ISSUES:
 * - No source citations for funding data
 * - No verification timestamps
 * - No confidence levels
 * - Missing source URLs
 * 
 * DO NOT USE until updated with proper source tracking.
 * Use deep-intelligence-gatherer.js instead for properly cited data.
 */

const { Client } = require('@notionhq/client');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

console.error('\n⚠️  WARNING: This tool does not comply with Data Validation Policy!');
console.error('Use enhancement/deep-intelligence-gatherer.js for properly cited data.\n');
process.exit(1); // Disable until fixed

dotenv.config();

const notion = new Client({
  auth: process.env.NOTION_TOKEN
});

const databaseId = process.env.NOTION_DATABASE_ID;

// Load advanced intelligence data
const intelligenceData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'advanced-intelligence-data.json'), 'utf8')
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
    
    // Try partial matches
    const searchTerms = [
      name.replace(/ (Inc|Corp|Corporation|Ltd|Limited|Technologies|Technology|AI|Solutions|Systems)\.?$/i, ''),
      name.split(' ')[0], // First word only
      name.replace(' Vancouver', '').replace(' (Vancouver)', '')
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

async function updateAdvancedIntelligence(pageId, orgData, orgName) {
  try {
    const properties = {};
    
    // Year Founded
    if (orgData.yearFounded) {
      properties['Year Founded'] = { number: orgData.yearFounded };
    }
    
    // Company Size
    if (orgData.size) {
      properties['Size'] = { select: { name: orgData.size } };
    }
    
    // Key People (enhance existing or add new)
    if (orgData.keyPeople) {
      properties['Key People'] = {
        rich_text: [{
          text: { content: orgData.keyPeople }
        }]
      };
    }
    
    // Focus & Notes (combine funding, notes, and intelligence)
    let focusNotes = [];
    if (orgData.funding) {
      focusNotes.push(`Funding: ${orgData.funding}`);
    }
    if (orgData.notes) {
      focusNotes.push(orgData.notes);
    }
    
    if (focusNotes.length > 0) {
      properties['Focus & Notes'] = {
        rich_text: [{
          text: { content: focusNotes.join(' | ') }
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

async function advancedIntelligenceEnhancement() {
  console.log(`\n🧠 Advanced intelligence enhancement for ${intelligenceData.length} organizations...\n`);
  
  const results = {
    updated: 0,
    notFound: 0,
    failed: 0,
    notFoundOrgs: [],
    failedOrgs: [],
    enhancements: {
      funding: 0,
      keyPeople: 0,
      yearFounded: 0,
      size: 0,
      strategicNotes: 0
    }
  };
  
  for (const orgData of intelligenceData) {
    const page = await findOrganizationByName(orgData.name);
    
    if (page) {
      const success = await updateAdvancedIntelligence(page.id, orgData, orgData.name);
      if (success) {
        const enhancementTypes = [];
        if (orgData.funding) {
          enhancementTypes.push('💰 Funding');
          results.enhancements.funding++;
        }
        if (orgData.keyPeople) {
          enhancementTypes.push('👤 Key People');
          results.enhancements.keyPeople++;
        }
        if (orgData.yearFounded) {
          enhancementTypes.push('📅 Founded');
          results.enhancements.yearFounded++;
        }
        if (orgData.size) {
          enhancementTypes.push('🏢 Size');
          results.enhancements.size++;
        }
        if (orgData.notes) {
          enhancementTypes.push('🧠 Intelligence');
          results.enhancements.strategicNotes++;
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
  
  console.log(`\n📊 Advanced Intelligence Results:`);
  console.log(`✅ Successfully enhanced: ${results.updated}`);
  console.log(`⚠️  Organizations not found: ${results.notFound}`);
  console.log(`❌ Failed enhancements: ${results.failed}`);
  
  console.log(`\n🎯 Intelligence Data Added:`);
  console.log(`💰 Funding information: ${results.enhancements.funding}`);
  console.log(`👤 Key people: ${results.enhancements.keyPeople}`);
  console.log(`📅 Founded years: ${results.enhancements.yearFounded}`);
  console.log(`🏢 Company sizes: ${results.enhancements.size}`);
  console.log(`🧠 Strategic intelligence: ${results.enhancements.strategicNotes}`);
  
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
    path.join(__dirname, 'advanced-intelligence-results.json'),
    JSON.stringify(results, null, 2)
  );
  
  console.log(`\n📄 Results saved to advanced-intelligence-results.json`);
  return results;
}

// Run the enhancement if called directly
if (require.main === module) {
  advancedIntelligenceEnhancement();
}

module.exports = { advancedIntelligenceEnhancement };