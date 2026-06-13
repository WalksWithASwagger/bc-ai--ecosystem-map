#!/usr/bin/env node
/**
 * Import organizations from discovery files into Notion DB.
 * This script handles the specific format of the discovery files.
 * Usage: NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/import-discovery-files.js discoveries/2025-07-29_*.md
 */
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { Client } = require('@notionhq/client');

if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
  console.error('Set NOTION_TOKEN and NOTION_DATABASE_ID env vars');
  process.exit(1);
}

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const dbId = process.env.NOTION_DATABASE_ID;

function parseDiscoveryFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const organizations = [];
  
  // Regular expression to match organization sections
  // Looks for patterns like:
  // #### N. Organization Name
  // **Organization Name**: Actual Name
  // - **Field1:** Value1
  // - **Field2:** Value2
  const orgSectionRegex = /####\s+\d+\.\s+(.+?)(?=####|\n## |$)/gs;
  const orgMatches = content.matchAll(orgSectionRegex);
  
  for (const match of orgMatches) {
    const orgSection = match[1].trim();
    const lines = orgSection.split('\n').map(line => line.trim()).filter(line => line);
    
    // Extract organization name
    let orgName = lines[0];
    
    // Check if there's an explicit organization name field
    const orgNameLine = lines.find(line => line.startsWith('**Organization Name**:'));
    if (orgNameLine) {
      orgName = orgNameLine.replace('**Organization Name**:', '').trim();
    }
    
    const org = { Name: orgName };
    
    // Extract other fields
    for (const line of lines) {
      if (line.startsWith('- **')) {
        const fieldMatch = line.match(/- \*\*([^*]+)\*\*:\s*(.*)/);
        if (fieldMatch) {
          const [, fieldName, fieldValue] = fieldMatch;
          
          // Map field names to database properties
          const mappedField = mapFieldName(fieldName);
          if (mappedField) {
            org[mappedField] = fieldValue.trim();
          }
        }
      }
    }
    
    // Extract description if available
    const descriptionLine = lines.find(line => line.startsWith('- **Description:**'));
    if (descriptionLine) {
      org['Short Blurb'] = descriptionLine.replace('- **Description:**', '').trim();
    }
    
    // Only add if we have a valid name
    if (org.Name && org.Name.length > 0) {
      organizations.push(org);
    }
  }
  
  return organizations;
}

function mapFieldName(fieldName) {
  const fieldMap = {
    'Website': 'Website',
    'LinkedIn': 'LinkedIn',
    'Location': 'City/Region',
    'Headquarters': 'City/Region',
    'Address': 'City/Region',
    'Industry': 'Category',
    'Focus': 'AI Focus Areas',
    'Technology': 'AI Focus Areas',
    'Founded': 'Year Founded',
    'Email': 'Email',
    'Phone': 'Phone',
    'Description': 'Short Blurb',
    'Mission': 'Short Blurb',
    'Contact': 'Email',
    'Employee Count': 'Size',
    'Team': 'Size',
    'Status': 'Status'
  };
  
  return fieldMap[fieldName] || null;
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
  
  if (org.Website) {
    // Clean up website URL
    let website = org.Website.replace(/[<>\[\]]/g, '').trim();
    if (website.includes('http')) {
      // Extract URL if it's embedded in text with http
      const urlMatch = website.match(/(https?:\/\/[^\s]+)/);
      if (urlMatch) website = urlMatch[1];
    }
    if (!website.startsWith('http') && !website.includes('Active -') && !website.includes('Government program')) {
      website = 'https://' + website;
    }
    if (website.startsWith('http')) {
      props['Website'] = { url: website };
    }
  }
  
  if (org.LinkedIn) {
    let linkedin = org.LinkedIn.replace(/[<>\[\]]/g, '').trim();
    if (linkedin.includes('http')) {
      const urlMatch = linkedin.match(/(https?:\/\/[^\s]+)/);
      if (urlMatch) linkedin = urlMatch[1];
      props['LinkedIn'] = { url: linkedin };
    }
  }
  
  if (org['City/Region']) {
    const location = org['City/Region'].replace(/[<>\[\]]/g, '').trim();
    props['City/Region'] = { rich_text: [{ text: { content: location } }] };
    
    // Try to determine BC Region based on city
    const bcRegion = determineBCRegion(location);
    if (bcRegion) {
      props['BC Region'] = { select: { name: bcRegion } };
    }
  }
  
  if (org.Email) {
    const email = org.Email.replace(/[<>\[\]]/g, '').trim();
    if (email.includes('@') && !email.includes(' ')) {
      props['Email'] = { email: email };
    }
  }
  
  if (org.Phone) {
    const phone = org.Phone.replace(/[<>\[\]]/g, '').trim();
    props['Phone'] = { phone_number: phone };
  }
  
  if (org.Category) {
    props['Category'] = { select: { name: org.Category } };
  }
  
  if (org['AI Focus Areas']) {
    const focusAreas = org['AI Focus Areas'].split(/[,\/]/).map(area => area.trim());
    props['AI Focus Areas'] = { multi_select: focusAreas.map(area => ({ name: area })) };
  }
  
  if (org['Year Founded']) {
    const yearMatch = org['Year Founded'].match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      props['Year Founded'] = { number: parseInt(yearMatch[0], 10) };
    }
  }
  
  if (org['Short Blurb']) {
    props['Short Blurb'] = { rich_text: [{ text: { content: org['Short Blurb'] } }] };
  }
  
  if (org.Size) {
    let size = '';
    if (org.Size.includes('1,000+') || org.Size.includes('1000+')) {
      size = '1000+';
    } else if (org.Size.includes('500+') || org.Size.match(/\b[5-9]\d{2}\b/)) {
      size = '500-999';
    } else if (org.Size.includes('100+') || org.Size.match(/\b[1-4]\d{2}\b/)) {
      size = '100-499';
    } else if (org.Size.includes('50+') || org.Size.match(/\b[5-9]\d\b/)) {
      size = '50-99';
    } else if (org.Size.includes('10+') || org.Size.match(/\b[1-4]\d\b/)) {
      size = '10-49';
    } else {
      size = '1-9';
    }
    props['Size'] = { select: { name: size } };
  }
  
  return props;
}

// Helper function to determine BC Region from city
function determineBCRegion(cityRegion) {
  if (!cityRegion) return null;
  
  const normalizedCity = cityRegion.toLowerCase().trim();
  
  // Lower Mainland
  if (['vancouver', 'burnaby', 'richmond', 'surrey', 'coquitlam', 'port coquitlam', 
       'port moody', 'north vancouver', 'west vancouver', 'delta', 'langley', 
       'white rock', 'new westminster', 'maple ridge', 'pitt meadows'].some(city => normalizedCity.includes(city))) {
    return 'Lower Mainland';
  }
  
  // Vancouver Island
  if (['victoria', 'saanich', 'nanaimo', 'campbell river', 'courtenay', 'comox', 
       'duncan', 'parksville', 'qualicum beach', 'port alberni', 'tofino', 
       'ucluelet', 'sidney', 'sooke'].some(city => normalizedCity.includes(city))) {
    return 'Vancouver Island';
  }
  
  // Interior
  if (['kelowna', 'kamloops', 'vernon', 'penticton', 'salmon arm', 'revelstoke', 
       'golden', 'merritt', 'osoyoos', 'oliver', 'summerland'].some(city => normalizedCity.includes(city))) {
    return 'Interior';
  }
  
  // Northern BC
  if (['prince george', 'fort st. john', 'fort st john', 'dawson creek', 'terrace', 
       'prince rupert', 'quesnel', 'williams lake'].some(city => normalizedCity.includes(city))) {
    return 'Northern BC';
  }
  
  // Kootenays
  if (['cranbrook', 'nelson', 'trail', 'castlegar', 'kimberley', 'fernie', 
       'creston', 'invermere', 'rossland', 'grand forks'].some(city => normalizedCity.includes(city))) {
    return 'Kootenays';
  }
  
  // Default for BC entries without specific region
  if (normalizedCity.includes('bc') || normalizedCity.includes('british columbia')) {
    return 'Other BC';
  }
  
  return null;
}

async function processFiles(filePatterns) {
  const files = [];
  
  // Process each file pattern
  for (const pattern of filePatterns) {
    const matchedFiles = glob.sync(pattern);
    files.push(...matchedFiles);
  }
  
  console.log(`Found ${files.length} files to process`);
  
  const allOrgs = [];
  const uniqueOrgs = new Map();
  
  // Parse all files and collect unique organizations
  for (const file of files) {
    console.log(`Processing ${file}...`);
    const orgs = parseDiscoveryFile(file);
    console.log(`  Found ${orgs.length} organizations`);
    
    for (const org of orgs) {
      // Use name as unique key
      if (!uniqueOrgs.has(org.Name)) {
        uniqueOrgs.set(org.Name, org);
        allOrgs.push(org);
      } else {
        // Merge fields if this instance has more information
        const existingOrg = uniqueOrgs.get(org.Name);
        for (const [key, value] of Object.entries(org)) {
          if (!existingOrg[key] && value) {
            existingOrg[key] = value;
          }
        }
      }
    }
  }
  
  console.log(`Found ${allOrgs.length} unique organizations across all files`);
  
  // Import to Notion
  const imported = [];
  const skipped = [];
  const failed = [];
  
  for (const org of allOrgs) {
    try {
      // Check if organization already exists
      if (await nameExists(org.Name)) {
        console.log(`Skip (exists): ${org.Name}`);
        skipped.push(org.Name);
        continue;
      }
      
      // Map properties to Notion format
      const props = mapProps(org);
      
      // Create page in Notion
      const resp = await notion.pages.create({
        parent: { database_id: dbId },
        properties: props
      });
      
      console.log(`Added: ${org.Name}`);
      imported.push({ name: org.Name, url: resp.url });
    } catch (e) {
      console.error(`Failed to add ${org.Name}:`, e.body?.message || e.message);
      failed.push(org.Name);
    }
  }
  
  // Create import log
  if (imported.length > 0) {
    const timestamp = new Date().toISOString().split('T')[0];
    const logPath = path.join('imports', `import-discovery-${timestamp}.md`);
    
    let logContent = `# Discovery Files Import Log - ${timestamp}\n\n`;
    logContent += `## Imported Organizations (${imported.length})\n\n`;
    
    for (const org of imported) {
      logContent += `- [${org.name}](${org.url})\n`;
    }
    
    logContent += `\n## Skipped Organizations (${skipped.length})\n\n`;
    for (const name of skipped) {
      logContent += `- ${name}\n`;
    }
    
    logContent += `\n## Failed Organizations (${failed.length})\n\n`;
    for (const name of failed) {
      logContent += `- ${name}\n`;
    }
    
    // Ensure the imports directory exists
    if (!fs.existsSync('imports')) {
      fs.mkdirSync('imports');
    }
    
    fs.writeFileSync(logPath, logContent);
    console.log(`Log written to ${logPath}`);
  }
  
  console.log('\nSummary:');
  console.log(`- Imported: ${imported.length}`);
  console.log(`- Skipped (already exist): ${skipped.length}`);
  console.log(`- Failed: ${failed.length}`);
}

// Main execution
const filePatterns = process.argv.slice(2);
if (filePatterns.length === 0) {
  console.error('Specify at least one file pattern (e.g., discoveries/2025-07-29_*.md)');
  process.exit(1);
}

processFiles(filePatterns).catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 