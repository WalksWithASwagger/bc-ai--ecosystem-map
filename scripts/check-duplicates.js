const { Client } = require('@notionhq/client');
const stringSimilarity = require('string-similarity');

if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
  console.error('Set NOTION_TOKEN and NOTION_DATABASE_ID env vars.');
  process.exit(1);
}

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const dbId = process.env.NOTION_DATABASE_ID;

(async () => {
  console.log('🔍 Fetching organization names...');
  const pages = [];
  let cursor;
  do {
    const resp = await notion.databases.query({ database_id: dbId, start_cursor: cursor, page_size: 100 });
    pages.push(...resp.results);
    cursor = resp.has_more ? resp.next_cursor : null;
  } while (cursor);

  const names = pages.map(p => ({
    id: p.id,
    name: p.properties.Name?.title?.[0]?.plain_text || 'UNKNOWN'
  }));

  console.log(`Total orgs: ${names.length}`);
  const dupes = [];
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const s = stringSimilarity.compareTwoStrings(names[i].name.toLowerCase(), names[j].name.toLowerCase());
      if (s >= 0.9) {
        dupes.push([names[i], names[j], s]);
      }
    }
  }
  if (dupes.length === 0) {
    console.log('✅ No high-similarity duplicates found (≥0.90).');
    return;
  }
  console.log(`⚠️ Possible duplicates (${dupes.length}):`);
  dupes.forEach(d => console.log(`- ${d[0].name} ↔ ${d[1].name} (${d[2]})`));
})(); 