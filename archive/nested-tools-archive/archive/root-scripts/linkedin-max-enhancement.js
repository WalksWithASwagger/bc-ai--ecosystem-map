const { Client } = require('@notionhq/client');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const notion = new Client({
  auth: process.env.NOTION_TOKEN
});

const databaseId = process.env.NOTION_DATABASE_ID;

// Load enhanced LinkedIn data
const enhancedLinkedInData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'linkedin-enhancement-data.json'), 'utf8')
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

async function updateOrganizationWithEnhancedData(pageId, orgData, orgName) {
  try {
    const properties = {};
    
    // LinkedIn URL (primary update)
    if (orgData.linkedin) {
      properties['LinkedIn'] = { url: orgData.linkedin };
    }
    
    // Year Founded
    if (orgData.founded) {
      properties['Year Founded'] = { number: orgData.founded };
    }
    
    // Size/Employee count (map to existing Size field)
    if (orgData.employees) {
      let sizeCategory = null;
      const empCount = orgData.employees;
      
      if (typeof empCount === 'string') {
        if (empCount.includes('1,001-5,000')) sizeCategory = 'Enterprise (250+)';
        else if (empCount.includes('100+')) sizeCategory = 'Scale-up (51-250)';
        else if (empCount.includes('11-50')) sizeCategory = 'Startup (1-50)';
        else if (empCount.includes('34')) sizeCategory = 'Startup (1-50)';
        else if (empCount.includes('51')) sizeCategory = 'Scale-up (51-250)';
        else if (empCount.includes('75')) sizeCategory = 'Scale-up (51-250)';
      } else if (typeof empCount === 'number') {
        if (empCount >= 250) sizeCategory = 'Enterprise (250+)';
        else if (empCount >= 51) sizeCategory = 'Scale-up (51-250)';
        else if (empCount >= 1) sizeCategory = 'Startup (1-50)';
      }
      
      if (sizeCategory) {
        properties['Size'] = { select: { name: sizeCategory } };
      }
    }
    
    // Key People (CEO information)
    if (orgData.ceo) {
      properties['Key People'] = {
        rich_text: [{
          text: { content: `CEO: ${orgData.ceo}` }
        }]
      };
    }
    
    // City/Region (headquarters)
    if (orgData.headquarters) {
      properties['City/Region'] = {
        rich_text: [{
          text: { content: orgData.headquarters }
        }]
      };
    }
    
    // Short Blurb (description)
    if (orgData.description) {
      properties['Short Blurb'] = {
        rich_text: [{
          text: { content: orgData.description }
        }]
      };
    }
    
    // Focus & Notes (combine funding, notes, follower count)
    let focusNotes = [];
    if (orgData.followers) {
      focusNotes.push(`LinkedIn: ${orgData.followers.toLocaleString()} followers`);
    }
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
    
    const response = await notion.pages.update({
      page_id: pageId,
      properties
    });
    
    return true;
  } catch (error) {
    console.error(`Error updating ${orgName}:`, error.message);
    return false;
  }
}

async function enhanceAllLinkedInProfiles() {
  console.log(`\n🚀 Enhancing LinkedIn data for ${enhancedLinkedInData.length} organizations...\n`);
  
  const results = {
    updated: 0,
    notFound: 0,
    failed: 0,
    notFoundOrgs: [],
    failedOrgs: [],
    enhancements: {
      linkedIn: 0,
      followers: 0,
      founded: 0,
      size: 0,
      ceo: 0,
      headquarters: 0,
      description: 0,
      notes: 0
    }
  };
  
  for (const orgData of enhancedLinkedInData) {
    const page = await findOrganizationByName(orgData.name);
    
    if (page) {
      const success = await updateOrganizationWithEnhancedData(page.id, orgData, orgData.name);
      if (success) {
        console.log(`✅ Enhanced: ${orgData.name} (${orgData.followers?.toLocaleString() || 'N/A'} followers)`);
        results.updated++;
        
        // Track enhancements
        if (orgData.linkedin) results.enhancements.linkedIn++;
        if (orgData.followers) results.enhancements.followers++;
        if (orgData.founded) results.enhancements.founded++;
        if (orgData.employees) results.enhancements.size++;
        if (orgData.ceo) results.enhancements.ceo++;
        if (orgData.headquarters) results.enhancements.headquarters++;
        if (orgData.description) results.enhancements.description++;
        if (orgData.notes) results.enhancements.notes++;
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
  
  console.log(`\n📊 LinkedIn Enhancement Results:`);
  console.log(`✅ Successfully enhanced: ${results.updated}`);
  console.log(`⚠️  Organizations not found: ${results.notFound}`);
  console.log(`❌ Failed enhancements: ${results.failed}`);
  
  console.log(`\n🎯 Data Points Added:`);
  console.log(`🔗 LinkedIn URLs: ${results.enhancements.linkedIn}`);
  console.log(`👥 Follower counts: ${results.enhancements.followers}`);
  console.log(`📅 Founded dates: ${results.enhancements.founded}`);
  console.log(`🏢 Company sizes: ${results.enhancements.size}`);
  console.log(`👤 CEO information: ${results.enhancements.ceo}`);
  console.log(`📍 Headquarters: ${results.enhancements.headquarters}`);
  console.log(`📝 Descriptions: ${results.enhancements.description}`);
  console.log(`🔍 Additional notes: ${results.enhancements.notes}`);
  
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
    path.join(__dirname, 'linkedin-enhancement-results.json'),
    JSON.stringify(results, null, 2)
  );
  
  console.log(`\n📄 Results saved to linkedin-enhancement-results.json`);
  return results;
}

// Run the enhancement if called directly
if (require.main === module) {
  enhanceAllLinkedInProfiles();
}

module.exports = { enhanceAllLinkedInProfiles };