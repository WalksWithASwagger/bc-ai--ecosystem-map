const fs = require('fs');
const { Client } = require('@notionhq/client');

if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
  console.error('Set NOTION_TOKEN and NOTION_DATABASE_ID env vars.');
  process.exit(1);
}

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const dbId = process.env.NOTION_DATABASE_ID;

async function fetchOrgNames() {
  const names = new Set();
  let cursor;
  do {
    const resp = await notion.databases.query({ database_id: dbId, start_cursor: cursor, page_size: 100 });
    resp.results.forEach(p => {
      const title = p.properties.Name?.title?.[0]?.plain_text;
      if (title) names.add(title.toLowerCase());
    });
    cursor = resp.has_more ? resp.next_cursor : null;
  } while (cursor);
  return names;
}

function extractNames(input) {
  const lines = input.split(/\r?\n/);
  return lines
    .filter(l => l.toLowerCase().startsWith('**organization name**'))
    .map(l => l.split('**')[2].replace(':', '').trim());
}

(async () => {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node find-new-orgs.js <markdown|csv>');
    process.exit(1);
  }
  const text = fs.readFileSync(file, 'utf8');
  const candidates = extractNames(text);
  const existing = await fetchOrgNames();
  const newOnes = candidates.filter(n => !existing.has(n.toLowerCase()));
  console.log(`\n🆕 Organizations not yet in DB (${newOnes.length}):\n`);
  newOnes.forEach(n => console.log('- ' + n));
})(); 