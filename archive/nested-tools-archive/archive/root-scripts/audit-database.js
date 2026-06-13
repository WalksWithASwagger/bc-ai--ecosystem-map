#!/usr/bin/env node
/**
 * Comprehensive audit of the Notion database
 * Usage: NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/audit-database.js
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

async function auditDatabase() {
  console.log('🔍 Fetching all organizations from Notion...');
  
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
  
  // Create audit report
  const timestamp = new Date().toISOString().split('T')[0];
  const reportPath = path.join('reports', `${timestamp}_database-audit.md`);
  let reportContent = `# BC AI Ecosystem Database Audit Report\n\n`;
  reportContent += `*Generated on ${new Date().toLocaleString()}*\n\n`;
  
  // 1. Overall Statistics
  reportContent += `## 1. Overall Statistics\n\n`;
  reportContent += `- **Total Organizations**: ${pages.length}\n`;
  
  // Calculate field completion rates
  const fields = [
    'Website', 'LinkedIn', 'Email', 'Phone', 
    'City/Region', 'BC Region', 'Category', 'AI Focus Areas',
    'Year Founded', 'Size', 'Short Blurb', 'Key People',
    'Latitude', 'Longitude', 'Logo'
  ];
  
  const fieldStats = {};
  fields.forEach(field => {
    fieldStats[field] = {
      complete: 0,
      incomplete: 0
    };
  });
  
  pages.forEach(page => {
    fields.forEach(field => {
      const value = getPropertyValue(page, field);
      if (value !== null && value !== '') {
        fieldStats[field].complete++;
      } else {
        fieldStats[field].incomplete++;
      }
    });
  });
  
  reportContent += `\n### Field Completion Rates\n\n`;
  reportContent += `| Field | Complete | Incomplete | % Complete |\n`;
  reportContent += `|-------|----------|------------|------------|\n`;
  
  fields.forEach(field => {
    const complete = fieldStats[field].complete;
    const incomplete = fieldStats[field].incomplete;
    const percentage = Math.round((complete / pages.length) * 100);
    reportContent += `| ${field} | ${complete} | ${incomplete} | ${percentage}% |\n`;
  });
  
  // 2. Data Quality Issues
  reportContent += `\n## 2. Data Quality Issues\n\n`;
  
  // 2.1. Invalid URLs
  const invalidUrls = [];
  pages.forEach(page => {
    const name = getPropertyValue(page, 'Name');
    const website = getPropertyValue(page, 'Website');
    
    if (website && !website.match(/^https?:\/\//)) {
      invalidUrls.push({ name, website, id: page.id });
    }
  });
  
  reportContent += `### Invalid URLs\n\n`;
  if (invalidUrls.length > 0) {
    reportContent += `| Organization | Invalid URL | Page ID |\n`;
    reportContent += `|--------------|------------|--------|\n`;
    invalidUrls.forEach(org => {
      reportContent += `| ${org.name} | ${org.website} | ${org.id} |\n`;
    });
  } else {
    reportContent += `✅ No invalid URLs found\n`;
  }
  
  // 2.2. Invalid Emails
  const invalidEmails = [];
  pages.forEach(page => {
    const name = getPropertyValue(page, 'Name');
    const email = getPropertyValue(page, 'Email');
    
    if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      invalidEmails.push({ name, email, id: page.id });
    }
  });
  
  reportContent += `\n### Invalid Emails\n\n`;
  if (invalidEmails.length > 0) {
    reportContent += `| Organization | Invalid Email | Page ID |\n`;
    reportContent += `|--------------|--------------|--------|\n`;
    invalidEmails.forEach(org => {
      reportContent += `| ${org.name} | ${org.email} | ${org.id} |\n`;
    });
  } else {
    reportContent += `✅ No invalid emails found\n`;
  }
  
  // 2.3. Invalid Coordinates
  const invalidCoordinates = [];
  pages.forEach(page => {
    const name = getPropertyValue(page, 'Name');
    const lat = getPropertyValue(page, 'Latitude');
    const lng = getPropertyValue(page, 'Longitude');
    
    // Check if one coordinate is present but the other is missing
    if ((lat === null && lng !== null) || (lat !== null && lng === null)) {
      invalidCoordinates.push({ name, lat, lng, id: page.id });
    }
    
    // Check if coordinates are outside reasonable bounds for BC
    if (lat !== null && lng !== null) {
      const validLatRange = [48, 60]; // BC latitude range
      const validLngRange = [-140, -114]; // BC longitude range
      
      if (lat < validLatRange[0] || lat > validLatRange[1] || 
          lng < validLngRange[0] || lng > validLngRange[1]) {
        invalidCoordinates.push({ name, lat, lng, id: page.id });
      }
    }
  });
  
  reportContent += `\n### Invalid Coordinates\n\n`;
  if (invalidCoordinates.length > 0) {
    reportContent += `| Organization | Latitude | Longitude | Page ID |\n`;
    reportContent += `|--------------|----------|-----------|--------|\n`;
    invalidCoordinates.forEach(org => {
      reportContent += `| ${org.name} | ${org.lat || 'missing'} | ${org.lng || 'missing'} | ${org.id} |\n`;
    });
  } else {
    reportContent += `✅ No invalid coordinates found\n`;
  }
  
  // 2.4. Missing BC Region but has City/Region
  const missingBCRegion = [];
  pages.forEach(page => {
    const name = getPropertyValue(page, 'Name');
    const city = getPropertyValue(page, 'City/Region');
    const region = getPropertyValue(page, 'BC Region');
    
    if (city && !region) {
      missingBCRegion.push({ name, city, id: page.id });
    }
  });
  
  reportContent += `\n### Missing BC Region with City/Region Present\n\n`;
  if (missingBCRegion.length > 0) {
    reportContent += `| Organization | City/Region | Page ID |\n`;
    reportContent += `|--------------|------------|--------|\n`;
    missingBCRegion.forEach(org => {
      reportContent += `| ${org.name} | ${org.city} | ${org.id} |\n`;
    });
  } else {
    reportContent += `✅ No missing BC Regions found\n`;
  }
  
  // 2.5. Empty Short Blurbs (less than 10 characters)
  const shortBlurbs = [];
  pages.forEach(page => {
    const name = getPropertyValue(page, 'Name');
    const blurb = getPropertyValue(page, 'Short Blurb');
    
    if (blurb && blurb.length < 10) {
      shortBlurbs.push({ name, blurb, id: page.id });
    }
  });
  
  reportContent += `\n### Very Short Blurbs\n\n`;
  if (shortBlurbs.length > 0) {
    reportContent += `| Organization | Blurb | Page ID |\n`;
    reportContent += `|--------------|-------|--------|\n`;
    shortBlurbs.forEach(org => {
      reportContent += `| ${org.name} | ${org.blurb} | ${org.id} |\n`;
    });
  } else {
    reportContent += `✅ No very short blurbs found\n`;
  }
  
  // 3. Categorical Analysis
  reportContent += `\n## 3. Categorical Analysis\n\n`;
  
  // 3.1. BC Region Distribution
  const bcRegions = {};
  pages.forEach(page => {
    const region = getPropertyValue(page, 'BC Region');
    if (region) {
      bcRegions[region] = (bcRegions[region] || 0) + 1;
    }
  });
  
  reportContent += `### BC Region Distribution\n\n`;
  reportContent += `| Region | Count | Percentage |\n`;
  reportContent += `|--------|-------|------------|\n`;
  
  const sortedRegions = Object.entries(bcRegions).sort((a, b) => b[1] - a[1]);
  sortedRegions.forEach(([region, count]) => {
    const percentage = Math.round((count / pages.length) * 100);
    reportContent += `| ${region} | ${count} | ${percentage}% |\n`;
  });
  
  // 3.2. Category Distribution
  const categories = {};
  pages.forEach(page => {
    const category = getPropertyValue(page, 'Category');
    if (category) {
      categories[category] = (categories[category] || 0) + 1;
    }
  });
  
  reportContent += `\n### Category Distribution\n\n`;
  reportContent += `| Category | Count | Percentage |\n`;
  reportContent += `|----------|-------|------------|\n`;
  
  const sortedCategories = Object.entries(categories).sort((a, b) => b[1] - a[1]);
  sortedCategories.forEach(([category, count]) => {
    const percentage = Math.round((count / pages.length) * 100);
    reportContent += `| ${category} | ${count} | ${percentage}% |\n`;
  });
  
  // 3.3. AI Focus Areas Distribution
  const focusAreas = {};
  pages.forEach(page => {
    const areas = getPropertyValue(page, 'AI Focus Areas');
    if (areas && Array.isArray(areas)) {
      areas.forEach(area => {
        focusAreas[area] = (focusAreas[area] || 0) + 1;
      });
    }
  });
  
  reportContent += `\n### AI Focus Areas Distribution\n\n`;
  reportContent += `| Focus Area | Count | Percentage |\n`;
  reportContent += `|------------|-------|------------|\n`;
  
  const sortedAreas = Object.entries(focusAreas).sort((a, b) => b[1] - a[1]);
  sortedAreas.forEach(([area, count]) => {
    const percentage = Math.round((count / pages.length) * 100);
    reportContent += `| ${area} | ${count} | ${percentage}% |\n`;
  });
  
  // 3.4. Size Distribution
  const sizes = {};
  pages.forEach(page => {
    const size = getPropertyValue(page, 'Size');
    if (size) {
      sizes[size] = (sizes[size] || 0) + 1;
    }
  });
  
  reportContent += `\n### Size Distribution\n\n`;
  reportContent += `| Size | Count | Percentage |\n`;
  reportContent += `|------|-------|------------|\n`;
  
  const sizeOrder = ['1-9', '10-49', '50-99', '100-499', '500-999', '1000+'];
  sizeOrder.forEach(size => {
    if (sizes[size]) {
      const percentage = Math.round((sizes[size] / pages.length) * 100);
      reportContent += `| ${size} | ${sizes[size]} | ${percentage}% |\n`;
    }
  });
  
  // 4. Most Incomplete Organizations
  reportContent += `\n## 4. Most Incomplete Organizations\n\n`;
  
  const orgCompleteness = pages.map(page => {
    const name = getPropertyValue(page, 'Name');
    let complete = 0;
    let incomplete = 0;
    let missingFields = [];
    
    fields.forEach(field => {
      const value = getPropertyValue(page, field);
      if (value !== null && value !== '') {
        complete++;
      } else {
        incomplete++;
        missingFields.push(field);
      }
    });
    
    const percentage = Math.round((complete / fields.length) * 100);
    
    return {
      name,
      id: page.id,
      complete,
      incomplete,
      percentage,
      missingFields
    };
  });
  
  // Sort by completeness (ascending)
  orgCompleteness.sort((a, b) => a.percentage - b.percentage);
  
  reportContent += `These organizations have the fewest fields completed and should be prioritized for data enhancement:\n\n`;
  reportContent += `| Organization | % Complete | Missing Fields |\n`;
  reportContent += `|-------------|------------|---------------|\n`;
  
  // Show the 20 most incomplete organizations
  orgCompleteness.slice(0, 20).forEach(org => {
    reportContent += `| [${org.name}](https://www.notion.so/${org.id.replace(/-/g, '')}) | ${org.percentage}% | ${org.missingFields.join(', ')} |\n`;
  });
  
  // 5. Recommendations
  reportContent += `\n## 5. Recommendations\n\n`;
  
  // Calculate priority fields
  const priorityFields = fields.map(field => {
    return {
      field,
      incomplete: fieldStats[field].incomplete,
      percentage: Math.round((fieldStats[field].incomplete / pages.length) * 100)
    };
  }).sort((a, b) => b.incomplete - a.incomplete);
  
  reportContent += `### Priority Fields\n\n`;
  reportContent += `Focus on completing the following fields first:\n\n`;
  
  priorityFields.slice(0, 5).forEach(field => {
    reportContent += `- **${field.field}**: Missing for ${field.incomplete} orgs (${field.percentage}%)\n`;
  });
  
  // Add specific recommendations
  reportContent += `\n### Specific Recommendations\n\n`;
  
  // Missing BC Regions
  if (missingBCRegion.length > 0) {
    reportContent += `1. **Assign BC Regions**: ${missingBCRegion.length} organizations have City/Region but no BC Region\n`;
    reportContent += `   - Run \`node scripts/enhance-geographic-data.js\` to automatically assign regions\n`;
  }
  
  // Invalid URLs
  if (invalidUrls.length > 0) {
    reportContent += `2. **Fix Invalid URLs**: ${invalidUrls.length} organizations have invalid website URLs\n`;
    reportContent += `   - Review and correct the format of these URLs\n`;
  }
  
  // Invalid Coordinates
  if (invalidCoordinates.length > 0) {
    reportContent += `3. **Fix Invalid Coordinates**: ${invalidCoordinates.length} organizations have invalid or incomplete coordinates\n`;
    reportContent += `   - Run \`node scripts/enhance-geographic-data.js\` to apply geocoding\n`;
  }
  
  // Write the report
  fs.writeFileSync(reportPath, reportContent);
  
  console.log(`✅ Audit complete`);
  console.log(`📝 Report written to: ${reportPath}`);
}

// Run the audit
auditDatabase().catch(error => {
  console.error('Error:', error.message);
  if (error.body) console.error('API Error:', error.body);
  process.exit(1);
}); 