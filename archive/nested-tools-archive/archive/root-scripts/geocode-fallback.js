#!/usr/bin/env node
const { Client } = require('@notionhq/client');
if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
  console.error('Need NOTION_TOKEN and NOTION_DATABASE_ID');
  process.exit(1);
}
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const dbId = process.env.NOTION_DATABASE_ID;
const fallback = {
  'Lower Mainland': [49.246, -123.116],
  'Vancouver Island': [48.428, -123.365],
  'Interior': [50.116, -120.801],
  'Northern BC': [54.004, -125.002],
  'Other Regions': [53.726, -127.647]
};
(async () => {
  let cursor;
  const updated = [];
  do {
    const resp = await notion.databases.query({
      database_id: dbId,
      filter: {
        or: [
          { property: 'Latitude', number: { is_empty: true } },
          { property: 'Longitude', number: { is_empty: true } }
        ]
      },
      start_cursor: cursor,
      page_size: 100
    });
    for (const page of resp.results) {
      const region = page.properties['BC Region']?.select?.name || 'Other Regions';
      const coords = fallback[region] || fallback['Other Regions'];
      await notion.pages.update({
        page_id: page.id,
        properties: {
          Latitude: { number: coords[0] },
          Longitude: { number: coords[1] }
        }
      });
      updated.push(page.properties.Name?.title?.[0]?.plain_text || 'Unknown');
    }
    cursor = resp.has_more ? resp.next_cursor : null;
  } while (cursor);
  console.log(`Updated ${updated.length} orgs with fallback coords.`);
})(); 