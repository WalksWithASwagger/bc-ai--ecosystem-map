#!/usr/bin/env node
// Usage: NOTION_TOKEN=... GOOGLE_KEY=... node scripts/geocode-csv.js orgs_needing_coords.csv

const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');
const fetch = require('node-fetch');
const csvParse = require('csv-parse/sync').parse;

if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
  console.error('Missing NOTION_TOKEN or NOTION_DATABASE_ID');
  process.exit(1);
}
if (!process.env.GOOGLE_KEY) {
  console.error('Provide GOOGLE_KEY env var (Google Geocoding API key)');
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

async function geocode(city) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city + ', British Columbia, Canada')}&key=${process.env.GOOGLE_KEY}`;
  const resp = await fetch(url);
  const data = await resp.json();
  if (data.status === 'OK') {
    const loc = data.results[0].geometry.location;
    return [loc.lat, loc.lng];
  }
  return null;
}

(async () => {
  const csvFile = process.argv[2];
  if (!csvFile) {
    console.error('csv path required');
    process.exit(1);
  }
  const rows = csvParse(fs.readFileSync(csvFile, 'utf8'), { columns: true, skip_empty_lines: true });
  const geojson = { type: 'FeatureCollection', features: [] };
  const logLines = [];
  for (const r of rows) {
    const query = `${r['City/Region']}`.trim();
    let coords = null;
    if (query) coords = await geocode(query);
    let usedFallback = false;
    if (!coords) {
      coords = fallback[r['BC Region']] || null;
      usedFallback = true;
    }
    if (!coords) {
      logLines.push(`No coords: ${r.Name}`);
      continue;
    }
    // Update Notion
    await notion.pages.update({
      page_id: r.id || '', // optional if you include id column
      properties: {
        Latitude: { number: coords[0] },
        Longitude: { number: coords[1] }
      }
    }).catch(() => {});

    geojson.features.push({
      type: 'Feature',
      properties: { name: r.Name },
      geometry: { type: 'Point', coordinates: [coords[1], coords[0]] }
    });

    if (usedFallback) logLines.push(`Fallback: ${r.Name}`);
  }
  fs.mkdirSync('map', { recursive: true });
  fs.writeFileSync('map/org_points.geojson', JSON.stringify(geojson, null, 2));
  const logPath = `tasks/${new Date().toISOString().split('T')[0]}_geocoding_log.md`;
  fs.writeFileSync(logPath, logLines.join('\n'));
  console.log('✅ Done - see map/org_points.geojson and', logPath);
})(); 