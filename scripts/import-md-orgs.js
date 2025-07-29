#!/usr/bin/env node
/**
 * Import organizations from discovery markdown file into Notion DB.
 * Usage: NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/import-md-orgs.js discoveries/2025-08-01_new-orgs.md
 */
const fs = require('fs');
const { Client } = require('@notionhq/client');

if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
  console.error('Set NOTION_TOKEN and NOTION_DATABASE_ID');
  process.exit(1);
}
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const dbId = process.env.NOTION_DATABASE_ID;

function parseMarkdown(md) {
  const blocks = md.split(/^---$/m);
  const orgs = [];
  blocks.forEach(block => {
    const lines = block.split(/\r?\n/).map(l => l.trim());
    if (!lines[0] || !lines[0].startsWith('###')) return;
    const org = {};
    org.Name = lines[0].replace('###', '').trim();
    lines.forEach(l => {
      if (l.startsWith('- **')) {
        const [field, val] = l.split('**:');
        if (!val) return;
        const key = field.replace('- **', '').trim();
        org[key] = val.trim();
      }
    });
    orgs.push(org);
  });
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
  const file = process.argv[2];
  if (!file) {
    console.error('Specify markdown file');
    process.exit(1);
  }
  const md = fs.readFileSync(file, 'utf8');
  const orgs = parseMarkdown(md);
  const imported = [];
  for (const org of orgs) {
    if (await nameExists(org.Name)) {
      console.log(`Skip (exists): ${org.Name}`);
      continue;
    }
    const props = mapProps(org);
    try {
      const resp = await notion.pages.create({ parent: { database_id: dbId }, properties: props });
      console.log(`Added: ${org.Name}`);
      imported.push(resp.url);
    } catch (e) {
      console.error(`Failed to add ${org.Name}:`, e.body?.message || e.message);
    }
  }
  if (imported.length) {
    const logPath = `imports/import-${new Date().toISOString().split('T')[0]}.md`;
    fs.appendFileSync(logPath, imported.map(u => `- ${u}\n`).join(''));
    console.log('Log written to', logPath);
  }
})(); 