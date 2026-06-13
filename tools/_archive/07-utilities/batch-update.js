#!/usr/bin/env node
/**
 * Batch update Notion database entries with researched information
 * Usage: NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/batch-update.js updates.json
 * 
 * The updates.json file should have the following format:
 * [
 *   {
 *     "id": "page_id",
 *     "yearFounded": 2015,
 *     "keyPeople": "Jane Smith (CEO), John Doe (CTO)"
 *   },
 *   // more entries...
 * ]
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');

// Try to load configuration
let config = {};
try {
  config = require('../config');
} catch (e) {
  // Config file doesn't exist, will use environment variables
}

const notionToken = config.NOTION_TOKEN || process.env.NOTION_TOKEN;
const dbId = config.NOTION_DATABASE_ID || process.env.NOTION_DATABASE_ID;

if (!notionToken || !dbId) {
  console.error('Set NOTION_TOKEN and NOTION_DATABASE_ID in config.js or env vars');
  process.exit(1);
}

const notion = new Client({ auth: notionToken });

async function batchUpdate() {
  // Get the updates file path from command line arguments
  const updatesFile = process.argv[2];
  if (!updatesFile) {
    console.error('Specify updates JSON file as argument');
    console.error('Usage: node scripts/batch-update.js updates.json');
    process.exit(1);
  }
  
  // Read and parse the updates file
  let updates;
  try {
    const fileContent = fs.readFileSync(updatesFile, 'utf8');
    updates = JSON.parse(fileContent);
    
    if (!Array.isArray(updates)) {
      throw new Error('Updates file must contain an array');
    }
  } catch (error) {
    console.error(`Error reading updates file: ${error.message}`);
    process.exit(1);
  }
  
  console.log(`🔄 Processing ${updates.length} updates...`);
  
  // Create a log file
  const timestamp = new Date().toISOString().split('T')[0];
  const logPath = path.join('reports', `${timestamp}_batch-update-log.md`);
  let logContent = `# Batch Update Log\n\n`;
  logContent += `*Generated on ${new Date().toLocaleString()}*\n\n`;
  logContent += `## Updates Summary\n\n`;
  logContent += `Total updates attempted: **${updates.length}**\n\n`;
  logContent += `| Field | Count |\n`;
  logContent += `|-------|-------|\n`;
  
  // Count updates by field
  const fieldCounts = {};
  updates.forEach(update => {
    Object.keys(update).forEach(key => {
      if (key !== 'id') {
        fieldCounts[key] = (fieldCounts[key] || 0) + 1;
      }
    });
  });
  
  Object.keys(fieldCounts).forEach(field => {
    logContent += `| ${field} | ${fieldCounts[field]} |\n`;
  });
  
  logContent += `\n## Update Results\n\n`;
  logContent += `| Organization | Fields Updated | Status |\n`;
  logContent += `|-------------|----------------|--------|\n`;
  
  // Process each update
  const results = {
    success: 0,
    failed: 0
  };
  
  for (const update of updates) {
    if (!update.id) {
      console.error('Skipping update without id:', update);
      logContent += `| Unknown | ${Object.keys(update).filter(k => k !== 'id').join(', ')} | ❌ Missing ID |\n`;
      results.failed++;
      continue;
    }
    
    // Prepare properties to update
    let properties = {};
    
    // Check if update has properties object (new format from comparison tool)
    if (update.properties) {
      properties = update.properties;
    } else {
      // Old format - build properties from flat structure
      // Year Founded (number field)
      if (update.yearFounded !== undefined) {
        properties['Year Founded'] = { number: update.yearFounded };
      }
      
      // Key People (rich text field)
      if (update.keyPeople) {
        properties['Key People'] = {
          rich_text: [
            {
              text: { content: update.keyPeople }
            }
          ]
        };
      }
      
      // Website (URL field)
      if (update.website) {
        properties['Website'] = { url: update.website };
      }
      
      // LinkedIn (URL field)
      if (update.linkedin) {
        properties['LinkedIn'] = { url: update.linkedin };
      }
      
      // Email (email field)
      if (update.email) {
        properties['Email'] = { email: update.email };
      }
      
      // Phone (phone_number field)
      if (update.phone) {
        properties['Phone'] = { phone_number: update.phone };
      }
    }
    
    // Short Blurb (rich text field)
    if (update.shortBlurb) {
      properties['Short Blurb'] = {
        rich_text: [
          {
            text: { content: update.shortBlurb }
          }
        ]
      };
    }
    
    // Skip if no properties to update
    if (Object.keys(properties).length === 0) {
      console.error('Skipping update with no valid properties:', update);
      logContent += `| Unknown | None | ❌ No valid properties |\n`;
      results.failed++;
      continue;
    }
    
    try {
      // Get the organization name first
      let orgName = 'Unknown';
      try {
        const page = await notion.pages.retrieve({ page_id: update.id });
        if (page.properties.Name?.title?.[0]?.plain_text) {
          orgName = page.properties.Name.title[0].plain_text;
        }
      } catch (error) {
        // If we can't get the name, continue with the update anyway
        console.warn(`Couldn't retrieve name for ${update.id}: ${error.message}`);
      }
      
      // Update the page
      await notion.pages.update({
        page_id: update.id,
        properties
      });
      
      console.log(`✅ Updated ${orgName}`);
      logContent += `| ${orgName} | ${Object.keys(properties).join(', ')} | ✅ Success |\n`;
      results.success++;
    } catch (error) {
      console.error(`❌ Error updating ${update.id}: ${error.message}`);
      logContent += `| Unknown (${update.id}) | ${Object.keys(properties).join(', ')} | ❌ Error: ${error.message} |\n`;
      results.failed++;
    }
  }
  
  // Add results summary
  logContent += `\n## Summary\n\n`;
  logContent += `- ✅ Successful updates: ${results.success}\n`;
  logContent += `- ❌ Failed updates: ${results.failed}\n`;
  
  // Ensure reports directory exists
  fs.mkdirSync('reports', { recursive: true });
  
  // Write log file
  fs.writeFileSync(logPath, logContent);
  
  console.log(`\n📊 Results:`);
  console.log(`   ✅ Successful updates: ${results.success}`);
  console.log(`   ❌ Failed updates: ${results.failed}`);
  console.log(`   📝 Log written to: ${logPath}`);
}

// Run the batch update
batchUpdate().catch(error => {
  console.error('Error:', error.message);
  if (error.body) console.error('API Error:', error.body);
  process.exit(1);
}); 