#!/usr/bin/env node
/**
 * Import consolidated missing organizations into Notion DB.
 * Usage: NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/import-consolidated-orgs.js discoveries/consolidated-missing-orgs.md
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');

if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
  console.error('Set NOTION_TOKEN and NOTION_DATABASE_ID');
  process.exit(1);
}
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const dbId = process.env.NOTION_DATABASE_ID;

function parseConsolidatedMarkdown(md) {
  const orgs = [];
  
  // Split the file by sections (each section starts with #### number)
  const sections = md.split(/^#### \d+\./gm);
  
  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];
    const lines = section.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    
    if (lines.length === 0) continue;
    
    // First line is the organization name
    const nameMatch = lines[0].match(/^([^*]+)$/);
    if (!nameMatch) continue;
    
    const org = {
      Name: nameMatch[1].trim()
    };
    
    // Process each line for properties
    lines.forEach(line => {
      // Match lines like "- **Website:** https://example.com"
      const propMatch = line.match(/^- \*\*([^:]+):\*\*\s*(.+)$/);
      if (propMatch) {
        const [_, key, value] = propMatch;
        
        // Skip placeholder values
        if (value === '[To be researched]' || value === '[BC presence to verify]') {
          return;
        }
        
        // Map common fields to our schema
        switch (key) {
          case 'Website':
            org.Website = value;
            break;
          case 'Location':
            // Extract BC region if possible
            org['City/Region'] = value;
            break;
          case 'BC Region':
            org['BC Region'] = value;
            break;
          case 'Type':
            // Map type to category
            org.Category = value;
            break;
          case 'Focus':
            // Use focus as AI Focus Areas
            org['AI Focus Areas'] = value;
            break;
          case 'Description':
            // Use description as Short Blurb
            org['Short Blurb'] = value;
            break;
        }
      }
    });
    
    // Only add if we have a name
    if (org.Name) {
      orgs.push(org);
    }
  }
  
  return orgs;
}

async function nameExists(name) {
  const resp = await notion.databases.query({
    database_id: dbId,
    filter: {
      property: 'Name',
      title: { equals: name }
    }
  });
  return resp.results.length > 0;
}

function mapProps(org) {
  const props = {
    Name: { title: [{ text: { content: org.Name } }] }
  };
  if (org.Website) props['Website'] = { url: org.Website.replace(/[<>]/g, '') };
  if (org.LinkedIn) props['LinkedIn'] = { url: org.LinkedIn.replace(/[<>]/g, '') };
  if (org['City/Region']) props['City/Region'] = { rich_text: [{ text: { content: org['City/Region'] } }] };
  if (org['BC Region']) props['BC Region'] = { select: { name: org['BC Region'] } };
  if (org.Email) props['Email'] = { email: org.Email };
  if (org.Phone) props['Phone'] = { phone_number: org.Phone };
  if (org.Category) props['Category'] = { select: { name: org.Category } };
  if (org['AI Focus Areas']) props['AI Focus Areas'] = { multi_select: org['AI Focus Areas'].split(/,\s*/).map(n => ({ name: n })) };
  if (org['Short Blurb']) props['Short Blurb'] = { rich_text: [{ text: { content: org['Short Blurb'] } }] };
  if (org['Notable Projects']) props['Notable Projects'] = { rich_text: [{ text: { content: org['Notable Projects'] } }] };
  return props;
}

(async () => {
  // Create imports directory if it doesn't exist
  const importsDir = path.join(process.cwd(), 'imports');
  if (!fs.existsSync(importsDir)) {
    fs.mkdirSync(importsDir, { recursive: true });
  }
  
  const file = process.argv[2];
  if (!file) {
    console.error('Specify consolidated markdown file');
    process.exit(1);
  }
  
  console.log(`\nProcessing ${file}...`);
  const md = fs.readFileSync(file, 'utf8');
  const orgs = parseConsolidatedMarkdown(md);
  console.log(`Found ${orgs.length} organizations in file`);
  
  const imported = [];
  const skipped = [];
  
  for (const org of orgs) {
    if (await nameExists(org.Name)) {
      console.log(`Skip (exists): ${org.Name}`);
      skipped.push(org.Name);
      continue;
    }
    
    const props = mapProps(org);
    try {
      const resp = await notion.pages.create({ parent: { database_id: dbId }, properties: props });
      console.log(`Added: ${org.Name}`);
      imported.push({ name: org.Name, url: resp.url });
    } catch (e) {
      console.error(`Failed to add ${org.Name}:`, e.body?.message || e.message);
    }
  }
  
  if (imported.length) {
    const timestamp = new Date().toISOString().split('T')[0];
    const logPath = path.join(importsDir, `consolidated-import-${timestamp}.md`);
    
    let logContent = `# Consolidated Import Log\n\n`;
    logContent += `*Generated on ${new Date().toLocaleString()}*\n\n`;
    logContent += `## Import Summary\n\n`;
    logContent += `- Total organizations processed: **${orgs.length}**\n`;
    logContent += `- Successfully imported: **${imported.length}**\n`;
    logContent += `- Skipped (already exist): **${skipped.length}**\n\n`;
    
    logContent += `## Imported Organizations\n\n`;
    imported.forEach(org => {
      logContent += `- [${org.name}](${org.url})\n`;
    });
    
    if (skipped.length) {
      logContent += `\n## Skipped Organizations\n\n`;
      skipped.forEach(name => {
        logContent += `- ${name}\n`;
      });
    }
    
    fs.writeFileSync(logPath, logContent);
    console.log(`\n✅ Total: ${imported.length} organizations imported`);
    console.log(`📝 Log written to: ${logPath}`);
  } else {
    console.log('\n✅ No new organizations imported (all already exist)');
  }
})(); 