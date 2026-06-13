#!/usr/bin/env node
/**
 * Resolve duplicates in the Notion database based on a resolution plan
 * Usage: NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/resolve-duplicates.js reports/YYYY-MM-DD_duplicate-resolution.json
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');

if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
  console.error('Set NOTION_TOKEN and NOTION_DATABASE_ID env vars');
  process.exit(1);
}

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const dbId = process.env.NOTION_DATABASE_ID;

// Helper to safely extract property values
function getPropertyValue(page, propName) {
  const prop = page.properties[propName];
  if (!prop) return null;

  switch (prop.type) {
    case 'title':
    case 'rich_text':
      return prop[prop.type].length > 0 && prop[prop.type][0].plain_text ? prop[prop.type][0].plain_text : null;
    case 'url':
    case 'email':
    case 'phone_number':
      return prop[prop.type] || null;
    case 'select':
      return prop.select?.name || null;
    case 'multi_select':
      return prop.multi_select.length > 0 ? prop.multi_select.map(s => s.name) : null;
    case 'number':
      return prop.number !== null ? prop.number : null;
    default:
      return null;
  }
}

// Convert a value to the appropriate Notion property format
function formatPropertyValue(field, value) {
  switch (field) {
    case 'Name':
      return { title: [{ text: { content: value } }] };
    case 'Website':
    case 'LinkedIn':
      return { url: value };
    case 'Email':
      return { email: value };
    case 'Phone':
      return { phone_number: value };
    case 'City/Region':
    case 'Short Blurb':
    case 'Key People':
      return { rich_text: [{ text: { content: value } }] };
    case 'BC Region':
    case 'Category':
    case 'Size':
      return { select: { name: value } };
    case 'AI Focus Areas':
      return { multi_select: Array.isArray(value) ? value.map(v => ({ name: v })) : [{ name: value }] };
    case 'Year Founded':
    case 'Latitude':
    case 'Longitude':
      return { number: Number(value) };
    default:
      return null;
  }
}

async function resolveDuplicates(resolutionFile) {
  console.log(`🔍 Reading resolution file: ${resolutionFile}`);
  
  // Read the resolution file
  let resolution;
  try {
    const fileContent = fs.readFileSync(resolutionFile, 'utf8');
    resolution = JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error reading resolution file: ${error.message}`);
    process.exit(1);
  }
  
  // Filter only confirmed duplicates
  const confirmedDuplicates = resolution.duplicatePairs.filter(pair => pair.confirmed === true);
  
  console.log(`Found ${confirmedDuplicates.length} confirmed duplicate pairs to resolve`);
  
  if (confirmedDuplicates.length === 0) {
    console.log('⚠️ No confirmed duplicates found. Please review and confirm duplicates in the resolution file.');
    process.exit(0);
  }
  
  // Create a log file
  const logPath = path.join('reports', `${new Date().toISOString().split('T')[0]}_duplicate-resolution-log.md`);
  let logContent = `# BC AI Ecosystem Duplicate Resolution Log\n\n`;
  logContent += `*Generated on ${new Date().toLocaleString()}*\n\n`;
  
  logContent += `## Summary\n\n`;
  logContent += `- Total duplicate pairs processed: **${confirmedDuplicates.length}**\n\n`;
  
  // Process each confirmed duplicate pair
  const results = {
    success: 0,
    failed: 0,
    skipped: 0
  };
  
  logContent += `## Processed Duplicates\n\n`;
  logContent += `| Keeper | Duplicate | Status | Notes |\n`;
  logContent += `|--------|-----------|--------|-------|\n`;
  
  for (const pair of confirmedDuplicates) {
    try {
      // 1. Get the keeper page
      const keeper = await notion.pages.retrieve({ page_id: pair.keeper.id });
      const keeperName = getPropertyValue(keeper, 'Name');
      
      // 2. Get the duplicate page
      const duplicate = await notion.pages.retrieve({ page_id: pair.duplicate.id });
      const duplicateName = getPropertyValue(duplicate, 'Name');
      
      // 3. Merge fields from duplicate to keeper if needed
      const updates = {};
      let fieldsUpdated = [];
      
      for (const field of pair.fieldsToMerge) {
        if (field.action === 'replace') {
          const formattedValue = formatPropertyValue(field.field, field.value);
          if (formattedValue) {
            updates[field.field] = formattedValue;
            fieldsUpdated.push(field.field);
          }
        } else if (field.action === 'merge' && field.field === 'AI Focus Areas') {
          updates['AI Focus Areas'] = formatPropertyValue('AI Focus Areas', field.value);
          fieldsUpdated.push('AI Focus Areas (merged)');
        }
      }
      
      // 4. Apply updates to keeper if there are any
      if (Object.keys(updates).length > 0) {
        await notion.pages.update({
          page_id: pair.keeper.id,
          properties: updates
        });
        console.log(`✅ Updated keeper: ${keeperName} with ${fieldsUpdated.length} fields from ${duplicateName}`);
      }
      
      // 5. Archive the duplicate
      await notion.pages.update({
        page_id: pair.duplicate.id,
        archived: true
      });
      
      console.log(`✅ Archived duplicate: ${duplicateName}`);
      
      // Log the success
      logContent += `| ${keeperName} | ${duplicateName} | ✅ Success | ${fieldsUpdated.length > 0 ? `Merged fields: ${fieldsUpdated.join(', ')}` : 'No fields merged'} |\n`;
      results.success++;
    } catch (error) {
      console.error(`❌ Error processing duplicate pair: ${error.message}`);
      logContent += `| ${pair.keeper.name} | ${pair.duplicate.name} | ❌ Failed | ${error.message} |\n`;
      results.failed++;
    }
  }
  
  // Add results summary
  logContent += `\n## Results\n\n`;
  logContent += `- ✅ Successfully processed: **${results.success}**\n`;
  logContent += `- ❌ Failed to process: **${results.failed}**\n`;
  logContent += `- ⏭️ Skipped (not confirmed): **${resolution.duplicatePairs.length - confirmedDuplicates.length}**\n\n`;
  
  // Add verification instructions
  logContent += `## Next Steps\n\n`;
  logContent += `1. **Verify Results**: Run the duplicate check again to confirm all duplicates have been resolved\n`;
  logContent += `   \`\`\`bash\n`;
  logContent += `   NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/check-duplicates.js\n`;
  logContent += `   \`\`\`\n`;
  logContent += `2. **Review Archived Pages**: Check archived pages in Notion to ensure no important data was lost\n`;
  logContent += `3. **Update Database Statistics**: Update documentation to reflect the new organization count\n`;
  
  // Write the log
  fs.writeFileSync(logPath, logContent);
  
  console.log(`\n📊 Results:`);
  console.log(`   ✅ Successfully processed: ${results.success}`);
  console.log(`   ❌ Failed to process: ${results.failed}`);
  console.log(`   ⏭️ Skipped (not confirmed): ${resolution.duplicatePairs.length - confirmedDuplicates.length}`);
  console.log(`   📝 Log written to: ${logPath}`);
}

// Get the resolution file from command line arguments
const resolutionFile = process.argv[2];
if (!resolutionFile) {
  console.error('Please specify the path to the duplicate resolution JSON file');
  console.error('Usage: NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/resolve-duplicates.js reports/YYYY-MM-DD_duplicate-resolution.json');
  process.exit(1);
}

// Run the duplicate resolution
resolveDuplicates(resolutionFile).catch(error => {
  console.error('Error:', error.message);
  if (error.body) console.error('API Error:', error.body);
  process.exit(1);
}); 