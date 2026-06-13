#!/usr/bin/env node
/**
 * Enhance geographic data in the Notion database
 * - Assign BC Region based on City/Region
 * - Apply geocoding to entries with missing coordinates
 * 
 * Usage: NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/enhance-geographic-data.js
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');
const https = require('https');

if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
  console.error('Set NOTION_TOKEN and NOTION_DATABASE_ID env vars');
  process.exit(1);
}

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const dbId = process.env.NOTION_DATABASE_ID;

// BC Region mapping based on cities
const REGION_MAPPING = {
  // Lower Mainland
  'vancouver': 'Lower Mainland',
  'burnaby': 'Lower Mainland',
  'richmond': 'Lower Mainland',
  'surrey': 'Lower Mainland',
  'coquitlam': 'Lower Mainland',
  'port coquitlam': 'Lower Mainland',
  'port moody': 'Lower Mainland',
  'north vancouver': 'Lower Mainland',
  'west vancouver': 'Lower Mainland',
  'delta': 'Lower Mainland',
  'langley': 'Lower Mainland',
  'white rock': 'Lower Mainland',
  'new westminster': 'Lower Mainland',
  'maple ridge': 'Lower Mainland',
  'pitt meadows': 'Lower Mainland',
  'tsawwassen': 'Lower Mainland',
  'ladner': 'Lower Mainland',
  'abbotsford': 'Lower Mainland',
  'mission': 'Lower Mainland',
  'chilliwack': 'Lower Mainland',
  'hope': 'Lower Mainland',
  
  // Vancouver Island
  'victoria': 'Vancouver Island',
  'saanich': 'Vancouver Island',
  'nanaimo': 'Vancouver Island',
  'campbell river': 'Vancouver Island',
  'courtenay': 'Vancouver Island',
  'comox': 'Vancouver Island',
  'duncan': 'Vancouver Island',
  'parksville': 'Vancouver Island',
  'qualicum beach': 'Vancouver Island',
  'port alberni': 'Vancouver Island',
  'tofino': 'Vancouver Island',
  'ucluelet': 'Vancouver Island',
  'sidney': 'Vancouver Island',
  'sooke': 'Vancouver Island',
  'ladysmith': 'Vancouver Island',
  'oak bay': 'Vancouver Island',
  'esquimalt': 'Vancouver Island',
  'colwood': 'Vancouver Island',
  'langford': 'Vancouver Island',
  
  // Interior
  'kelowna': 'Interior',
  'kamloops': 'Interior',
  'vernon': 'Interior',
  'penticton': 'Interior',
  'salmon arm': 'Interior',
  'revelstoke': 'Interior',
  'golden': 'Interior',
  'merritt': 'Interior',
  'osoyoos': 'Interior',
  'oliver': 'Interior',
  'summerland': 'Interior',
  'armstrong': 'Interior',
  'enderby': 'Interior',
  'princeton': 'Interior',
  'keremeos': 'Interior',
  'peachland': 'Interior',
  'westbank': 'Interior',
  'west kelowna': 'Interior',
  'lake country': 'Interior',
  
  // Northern BC
  'prince george': 'Northern BC',
  'fort st. john': 'Northern BC',
  'fort st john': 'Northern BC',
  'dawson creek': 'Northern BC',
  'terrace': 'Northern BC',
  'prince rupert': 'Northern BC',
  'quesnel': 'Northern BC',
  'williams lake': 'Northern BC',
  'fort nelson': 'Northern BC',
  'mackenzie': 'Northern BC',
  'smithers': 'Northern BC',
  'vanderhoof': 'Northern BC',
  'burns lake': 'Northern BC',
  'houston': 'Northern BC',
  'kitimat': 'Northern BC',
  'hazelton': 'Northern BC',
  'stewart': 'Northern BC',
  'chetwynd': 'Northern BC',
  'tumbler ridge': 'Northern BC',
  
  // Kootenays
  'cranbrook': 'Kootenays',
  'nelson': 'Kootenays',
  'trail': 'Kootenays',
  'castlegar': 'Kootenays',
  'kimberley': 'Kootenays',
  'fernie': 'Kootenays',
  'creston': 'Kootenays',
  'invermere': 'Kootenays',
  'rossland': 'Kootenays',
  'grand forks': 'Kootenays',
  'kaslo': 'Kootenays',
  'nakusp': 'Kootenays',
  'salmo': 'Kootenays',
  'sparwood': 'Kootenays',
  'elkford': 'Kootenays',
  'fruitvale': 'Kootenays',
  'montrose': 'Kootenays',
  'warfield': 'Kootenays',
  
  // Sunshine Coast
  'sechelt': 'Sunshine Coast',
  'gibsons': 'Sunshine Coast',
  'powell river': 'Sunshine Coast',
  'roberts creek': 'Sunshine Coast',
  'halfmoon bay': 'Sunshine Coast',
  'pender harbour': 'Sunshine Coast',
  'madeira park': 'Sunshine Coast',
  'garden bay': 'Sunshine Coast',
  'egmont': 'Sunshine Coast',
  'earl\'s cove': 'Sunshine Coast',
  'saltery bay': 'Sunshine Coast',
  
  // Sea to Sky
  'squamish': 'Sea to Sky',
  'whistler': 'Sea to Sky',
  'pemberton': 'Sea to Sky',
  'britannia beach': 'Sea to Sky',
  'furry creek': 'Sea to Sky',
  'lions bay': 'Sea to Sky',
  'mount currie': 'Sea to Sky',
  'd\'arcy': 'Sea to Sky',
  
  // Gulf Islands
  'salt spring island': 'Gulf Islands',
  'pender island': 'Gulf Islands',
  'galiano island': 'Gulf Islands',
  'mayne island': 'Gulf Islands',
  'saturna island': 'Gulf Islands',
  'hornby island': 'Gulf Islands',
  'denman island': 'Gulf Islands',
  'gabriola island': 'Gulf Islands',
  'quadra island': 'Gulf Islands',
  'cortes island': 'Gulf Islands',
  'texada island': 'Gulf Islands',
  'bowen island': 'Gulf Islands',
  'lasqueti island': 'Gulf Islands',
  'thetis island': 'Gulf Islands',
  'valdez island': 'Gulf Islands',
  'gambier island': 'Gulf Islands',
  'keats island': 'Gulf Islands'
};

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

// Format property value for updating
function formatPropertyValue(field, value) {
  switch (field) {
    case 'BC Region':
      return { select: { name: value } };
    case 'Latitude':
    case 'Longitude':
      return { number: Number(value) };
    default:
      return null;
  }
}

// Geocode a location using a geocoding service
async function geocodeLocation(location) {
  return new Promise((resolve, reject) => {
    // Use Nominatim OpenStreetMap service
    const encodedLocation = encodeURIComponent(location + ', British Columbia, Canada');
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedLocation}&format=json&limit=1`;
    
    const request = https.get(url, {
      headers: {
        'User-Agent': 'BC-AI-Ecosystem-Mapping/1.0'
      }
    }, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const results = JSON.parse(data);
          
          if (results && results.length > 0) {
            resolve({
              latitude: parseFloat(results[0].lat),
              longitude: parseFloat(results[0].lon),
              displayName: results[0].display_name
            });
          } else {
            resolve(null);
          }
        } catch (error) {
          reject(error);
        }
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    // Add a timeout
    request.setTimeout(10000, () => {
      request.abort();
      reject(new Error('Geocoding request timed out'));
    });
  });
}

// Determine BC Region from city/region
function determineBCRegion(cityRegion) {
  if (!cityRegion) return null;
  
  // Clean up the input
  const normalizedCity = cityRegion.toLowerCase().trim();
  
  // Direct match
  if (REGION_MAPPING[normalizedCity]) {
    return REGION_MAPPING[normalizedCity];
  }
  
  // Partial match (for multi-city entries)
  for (const city in REGION_MAPPING) {
    if (normalizedCity.includes(city)) {
      return REGION_MAPPING[city];
    }
  }
  
  // Default for BC entries without specific region
  if (normalizedCity.includes('bc') || 
      normalizedCity.includes('british columbia') ||
      normalizedCity.includes('b.c.')) {
    return 'Other BC';
  }
  
  // Handle remote/virtual/multiple locations
  if (normalizedCity.includes('remote') || 
      normalizedCity.includes('virtual') || 
      normalizedCity.includes('multiple locations')) {
    return 'Multiple Regions';
  }
  
  return null;
}

async function enhanceGeographicData() {
  console.log('🔍 Fetching organizations from Notion...');
  
  // Fetch all pages from the database
  const pages = [];
  let cursor;
  
  do {
    const response = await notion.databases.query({
      database_id: dbId,
      start_cursor: cursor,
      page_size: 100
    });
    
    pages.push(...response.results);
    cursor = response.has_more ? response.next_cursor : null;
    console.log(`Fetched ${pages.length} organizations so far...`);
  } while (cursor);
  
  console.log(`Total: ${pages.length} organizations`);
  
  // Create a log file
  const logPath = path.join('reports', `${new Date().toISOString().split('T')[0]}_geographic-enhancement-log.md`);
  let logContent = `# BC AI Ecosystem Geographic Data Enhancement Log\n\n`;
  logContent += `*Generated on ${new Date().toLocaleString()}*\n\n`;
  
  // Track statistics
  const stats = {
    totalOrgs: pages.length,
    missingBCRegion: 0,
    missingCoordinates: 0,
    updatedBCRegion: 0,
    updatedCoordinates: 0,
    failed: 0
  };
  
  // Process each organization
  console.log('🔄 Enhancing geographic data...');
  
  for (const page of pages) {
    const orgName = getPropertyValue(page, 'Name') || 'Unknown';
    const cityRegion = getPropertyValue(page, 'City/Region');
    const bcRegion = getPropertyValue(page, 'BC Region');
    const latitude = getPropertyValue(page, 'Latitude');
    const longitude = getPropertyValue(page, 'Longitude');
    
    const updates = {};
    let updateLog = '';
    
    // 1. BC Region Enhancement
    if (!bcRegion && cityRegion) {
      stats.missingBCRegion++;
      const determinedRegion = determineBCRegion(cityRegion);
      
      if (determinedRegion) {
        updates['BC Region'] = formatPropertyValue('BC Region', determinedRegion);
        updateLog += `- Assigned BC Region: ${determinedRegion} (based on ${cityRegion})\n`;
        stats.updatedBCRegion++;
      }
    }
    
    // 2. Geocoding Enhancement
    if ((!latitude || !longitude) && cityRegion) {
      stats.missingCoordinates++;
      
      try {
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const geocodeResult = await geocodeLocation(cityRegion);
        
        if (geocodeResult) {
          updates['Latitude'] = formatPropertyValue('Latitude', geocodeResult.latitude);
          updates['Longitude'] = formatPropertyValue('Longitude', geocodeResult.longitude);
          
          updateLog += `- Geocoded: Lat ${geocodeResult.latitude}, Lon ${geocodeResult.longitude}\n`;
          updateLog += `  (Based on: ${geocodeResult.displayName})\n`;
          
          stats.updatedCoordinates++;
        }
      } catch (error) {
        console.error(`Error geocoding ${orgName}: ${error.message}`);
        updateLog += `- ❌ Geocoding failed: ${error.message}\n`;
      }
    }
    
    // Apply updates if needed
    if (Object.keys(updates).length > 0) {
      try {
        await notion.pages.update({
          page_id: page.id,
          properties: updates
        });
        
        console.log(`✅ Updated ${orgName}`);
        
        // Add to log
        logContent += `### ${orgName}\n\n`;
        logContent += updateLog;
        logContent += '\n';
      } catch (error) {
        console.error(`❌ Error updating ${orgName}: ${error.message}`);
        stats.failed++;
        
        // Add to log
        logContent += `### ${orgName}\n\n`;
        logContent += `- ❌ Update failed: ${error.message}\n\n`;
      }
    }
  }
  
  // Add statistics to log
  logContent += `## Summary Statistics\n\n`;
  logContent += `- Total organizations: ${stats.totalOrgs}\n`;
  logContent += `- Organizations missing BC Region: ${stats.missingBCRegion}\n`;
  logContent += `- Organizations missing coordinates: ${stats.missingCoordinates}\n`;
  logContent += `- BC Region assignments added: ${stats.updatedBCRegion}\n`;
  logContent += `- Coordinates added: ${stats.updatedCoordinates}\n`;
  logContent += `- Failed updates: ${stats.failed}\n\n`;
  
  // Add next steps
  logContent += `## Next Steps\n\n`;
  logContent += `1. Manually review organizations that could not be automatically assigned a BC Region\n`;
  logContent += `2. Verify accuracy of geocoded coordinates for a sample of organizations\n`;
  logContent += `3. Address any failed updates\n`;
  
  // Write the log
  fs.writeFileSync(logPath, logContent);
  
  console.log(`\n📊 Results:`);
  console.log(`   ✅ BC Region assignments added: ${stats.updatedBCRegion}`);
  console.log(`   ✅ Coordinates added: ${stats.updatedCoordinates}`);
  console.log(`   ❌ Failed updates: ${stats.failed}`);
  console.log(`   📝 Log written to: ${logPath}`);
}

// Run the enhancement
enhanceGeographicData().catch(error => {
  console.error('Error:', error.message);
  if (error.body) console.error('API Error:', error.body);
  process.exit(1);
}); 