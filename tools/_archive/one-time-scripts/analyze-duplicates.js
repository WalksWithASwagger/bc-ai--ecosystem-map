#!/usr/bin/env node
/**
 * Analyze duplicates in the Notion database and prepare a structured resolution plan
 * Usage: node analyze-duplicates.js
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');
const stringSimilarity = require('string-similarity');
require('dotenv').config();

// Try to load configuration
let config = {};
try {
  config = require('./config');
} catch (e) {
  // Config file doesn't exist, will use environment variables
}

// Get Notion credentials
const notionToken = config.NOTION_TOKEN || process.env.NOTION_TOKEN;
const dbId = config.NOTION_DATABASE_ID || process.env.NOTION_DATABASE_ID;

if (!notionToken || !dbId) {
  console.error('Notion token and database ID are required. Set them in config.js or as environment variables.');
  process.exit(1);
}

const notion = new Client({ auth: notionToken });

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

// Calculate completeness score for an organization
function calculateCompleteness(page) {
  const fields = [
    'Website', 'LinkedIn', 'Email', 'Phone', 
    'City/Region', 'BC Region', 'Category', 'AI Focus Areas',
    'Year Founded', 'Size', 'Short Blurb', 'Key People',
    'Latitude', 'Longitude'
  ];
  
  let filledCount = 0;
  fields.forEach(field => {
    if (getPropertyValue(page, field) !== null) filledCount++;
  });
  
  return {
    score: filledCount / fields.length,
    filledCount,
    totalFields: fields.length
  };
}

// Compare two organizations and determine if they're duplicates
function compareDuplicates(org1, org2) {
  // Calculate name similarity
  const nameSimilarity = stringSimilarity.compareTwoStrings(
    org1.name.toLowerCase(), 
    org2.name.toLowerCase()
  );
  
  // Check for acronym patterns
  const acronymPattern = /\(([A-Z]+)\)|\b([A-Z]+)\b/;
  const org1Acronyms = org1.name.match(acronymPattern);
  const org2Acronyms = org2.name.match(acronymPattern);
  
  let hasMatchingAcronym = false;
  if (org1Acronyms && org2Acronyms) {
    const acronym1 = org1Acronyms[1] || org1Acronyms[2];
    const acronym2 = org2Acronyms[1] || org2Acronyms[2];
    hasMatchingAcronym = acronym1 === acronym2;
  }
  
  // Check for website similarity
  let websiteSimilarity = 0;
  if (org1.website && org2.website) {
    websiteSimilarity = stringSimilarity.compareTwoStrings(
      org1.website.toLowerCase().replace(/^https?:\/\/|www\.|\/.*$/g, ''),
      org2.website.toLowerCase().replace(/^https?:\/\/|www\.|\/.*$/g, '')
    );
  }
  
  // Check for location similarity
  let locationSimilarity = 0;
  if (org1.location && org2.location) {
    locationSimilarity = stringSimilarity.compareTwoStrings(
      org1.location.toLowerCase(),
      org2.location.toLowerCase()
    );
  }
  
  // Calculate overall similarity score
  const overallScore = nameSimilarity * 0.6 + 
                      (websiteSimilarity * 0.3) +
                      (locationSimilarity * 0.1) +
                      (hasMatchingAcronym ? 0.2 : 0);
  
  return {
    nameSimilarity,
    websiteSimilarity,
    locationSimilarity,
    hasMatchingAcronym,
    overallScore,
    isDuplicate: nameSimilarity >= 0.9 || overallScore >= 0.7
  };
}

// Determine which organization to keep in a duplicate pair
function determineKeeper(org1, org2) {
  // Calculate completeness for both organizations
  const comp1 = org1.completeness.score;
  const comp2 = org2.completeness.score;
  
  // If one is significantly more complete than the other, keep that one
  if (comp1 > comp2 + 0.2) return { keeper: org1, duplicate: org2 };
  if (comp2 > comp1 + 0.2) return { keeper: org2, duplicate: org1 };
  
  // If completeness is similar, use other criteria
  
  // Prefer entries with websites
  if (org1.website && !org2.website) return { keeper: org1, duplicate: org2 };
  if (org2.website && !org1.website) return { keeper: org2, duplicate: org1 };
  
  // Prefer entries with more complete names (less likely to be acronyms)
  if (org1.name.length > org2.name.length + 5) return { keeper: org1, duplicate: org2 };
  if (org2.name.length > org1.name.length + 5) return { keeper: org2, duplicate: org1 };
  
  // Default to the first one if everything else is equal
  return { keeper: org1, duplicate: org2 };
}

// Generate a merge plan for two duplicate organizations
function generateMergePlan(keeper, duplicate) {
  const plan = {
    keeperId: keeper.id,
    keeperName: keeper.name,
    duplicateId: duplicate.id,
    duplicateName: duplicate.name,
    fieldsToMerge: []
  };
  
  // Check each field to see if the duplicate has information the keeper doesn't
  const fields = [
    'Website', 'LinkedIn', 'Email', 'Phone', 
    'City/Region', 'BC Region', 'Category', 'AI Focus Areas',
    'Year Founded', 'Size', 'Short Blurb', 'Key People',
    'Latitude', 'Longitude'
  ];
  
  fields.forEach(field => {
    const keeperValue = getPropertyValue(keeper.page, field);
    const duplicateValue = getPropertyValue(duplicate.page, field);
    
    // If duplicate has a value that keeper doesn't, or has a more complete value
    if (
      (duplicateValue !== null && keeperValue === null) ||
      (duplicateValue !== null && keeperValue !== null && 
       typeof duplicateValue === 'string' && typeof keeperValue === 'string' &&
       duplicateValue.length > keeperValue.length * 1.5)
    ) {
      plan.fieldsToMerge.push({
        field,
        value: duplicateValue,
        action: 'replace'
      });
    }
    
    // Special handling for multi-select fields like AI Focus Areas
    if (field === 'AI Focus Areas' && 
        Array.isArray(keeperValue) && 
        Array.isArray(duplicateValue)) {
      
      const uniqueValues = duplicateValue.filter(v => !keeperValue.includes(v));
      if (uniqueValues.length > 0) {
        plan.fieldsToMerge.push({
          field,
          value: [...keeperValue, ...uniqueValues],
          action: 'merge'
        });
      }
    }
  });
  
  return plan;
}

async function analyzeDuplicates() {
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
  
  // Extract relevant information from each page
  const orgs = pages.map(page => {
    const name = getPropertyValue(page, 'Name') || 'Unknown';
    const website = getPropertyValue(page, 'Website');
    const location = getPropertyValue(page, 'City/Region');
    const completeness = calculateCompleteness(page);
    
    return {
      id: page.id,
      name,
      website,
      location,
      completeness,
      page
    };
  });
  
  // Find potential duplicates
  console.log('🔍 Analyzing potential duplicates...');
  const duplicatePairs = [];
  
  for (let i = 0; i < orgs.length; i++) {
    for (let j = i + 1; j < orgs.length; j++) {
      const comparison = compareDuplicates(orgs[i], orgs[j]);
      
      if (comparison.isDuplicate) {
        const { keeper, duplicate } = determineKeeper(orgs[i], orgs[j]);
        const mergePlan = generateMergePlan(keeper, duplicate);
        
        duplicatePairs.push({
          org1: orgs[i],
          org2: orgs[j],
          comparison,
          mergePlan
        });
      }
    }
  }
  
  // Sort duplicates by similarity score (highest first)
  duplicatePairs.sort((a, b) => b.comparison.overallScore - a.comparison.overallScore);
  
  console.log(`Found ${duplicatePairs.length} potential duplicate pairs`);
  
  // Generate detailed report
  const reportPath = path.join('reports', `${new Date().toISOString().split('T')[0]}_duplicate-resolution-plan.md`);
  let reportContent = `# BC AI Ecosystem Duplicate Resolution Plan\n\n`;
  reportContent += `*Generated on ${new Date().toLocaleString()}*\n\n`;
  
  reportContent += `## Summary\n\n`;
  reportContent += `- Total organizations: **${pages.length}**\n`;
  reportContent += `- Potential duplicate pairs: **${duplicatePairs.length}**\n`;
  
  // Categorize duplicates
  const exactDuplicates = duplicatePairs.filter(p => p.comparison.nameSimilarity === 1);
  const highSimilarity = duplicatePairs.filter(p => p.comparison.nameSimilarity >= 0.95 && p.comparison.nameSimilarity < 1);
  const mediumSimilarity = duplicatePairs.filter(p => p.comparison.nameSimilarity >= 0.9 && p.comparison.nameSimilarity < 0.95);
  const lowSimilarity = duplicatePairs.filter(p => p.comparison.nameSimilarity < 0.9 && p.comparison.overallScore >= 0.7);
  
  reportContent += `- Exact name matches: **${exactDuplicates.length}**\n`;
  reportContent += `- High similarity (95%+): **${highSimilarity.length}**\n`;
  reportContent += `- Medium similarity (90-95%): **${mediumSimilarity.length}**\n`;
  reportContent += `- Other potential matches: **${lowSimilarity.length}**\n\n`;
  
  // Generate resolution JSON template
  const resolutionTemplate = {
    duplicatePairs: duplicatePairs.map(pair => ({
      keeper: {
        id: pair.mergePlan.keeperId,
        name: pair.mergePlan.keeperName
      },
      duplicate: {
        id: pair.mergePlan.duplicateId,
        name: pair.mergePlan.duplicateName
      },
      fieldsToMerge: pair.mergePlan.fieldsToMerge,
      confirmed: false // Set to true after manual verification
    }))
  };
  
  // Write JSON template
  const jsonPath = path.join('reports', `${new Date().toISOString().split('T')[0]}_duplicate-resolution.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(resolutionTemplate, null, 2));
  
  // Add detailed duplicate analysis to report
  reportContent += `## Duplicate Analysis\n\n`;
  
  // 1. Exact duplicates
  reportContent += `### Exact Name Matches (${exactDuplicates.length})\n\n`;
  if (exactDuplicates.length > 0) {
    reportContent += `| Keep | Remove | Similarity | Action |\n`;
    reportContent += `|------|--------|------------|--------|\n`;
    
    exactDuplicates.forEach(pair => {
      const fieldsToMerge = pair.mergePlan.fieldsToMerge.length > 0 
        ? `Merge ${pair.mergePlan.fieldsToMerge.length} fields` 
        : 'Remove duplicate';
      
      reportContent += `| [${pair.mergePlan.keeperName}](https://www.notion.so/${pair.mergePlan.keeperId.replace(/-/g, '')}) | [${pair.mergePlan.duplicateName}](https://www.notion.so/${pair.mergePlan.duplicateId.replace(/-/g, '')}) | ${pair.comparison.nameSimilarity.toFixed(2)} | ${fieldsToMerge} |\n`;
    });
  }
  
  // 2. High similarity
  reportContent += `\n### High Similarity Matches (${highSimilarity.length})\n\n`;
  if (highSimilarity.length > 0) {
    reportContent += `| Keep | Remove | Similarity | Action |\n`;
    reportContent += `|------|--------|------------|--------|\n`;
    
    highSimilarity.forEach(pair => {
      const fieldsToMerge = pair.mergePlan.fieldsToMerge.length > 0 
        ? `Merge ${pair.mergePlan.fieldsToMerge.length} fields` 
        : 'Remove duplicate';
      
      reportContent += `| [${pair.mergePlan.keeperName}](https://www.notion.so/${pair.mergePlan.keeperId.replace(/-/g, '')}) | [${pair.mergePlan.duplicateName}](https://www.notion.so/${pair.mergePlan.duplicateId.replace(/-/g, '')}) | ${pair.comparison.nameSimilarity.toFixed(2)} | ${fieldsToMerge} |\n`;
    });
  }
  
  // 3. Medium similarity
  reportContent += `\n### Medium Similarity Matches (${mediumSimilarity.length})\n\n`;
  if (mediumSimilarity.length > 0) {
    reportContent += `| Keep | Remove | Similarity | Action |\n`;
    reportContent += `|------|--------|------------|--------|\n`;
    
    mediumSimilarity.forEach(pair => {
      const fieldsToMerge = pair.mergePlan.fieldsToMerge.length > 0 
        ? `Merge ${pair.mergePlan.fieldsToMerge.length} fields` 
        : 'Remove duplicate';
      
      reportContent += `| [${pair.mergePlan.keeperName}](https://www.notion.so/${pair.mergePlan.keeperId.replace(/-/g, '')}) | [${pair.mergePlan.duplicateName}](https://www.notion.so/${pair.mergePlan.duplicateId.replace(/-/g, '')}) | ${pair.comparison.nameSimilarity.toFixed(2)} | ${fieldsToMerge} |\n`;
    });
  }
  
  // 4. Low similarity but high overall score
  reportContent += `\n### Other Potential Matches (${lowSimilarity.length})\n\n`;
  if (lowSimilarity.length > 0) {
    reportContent += `| Keep | Remove | Name Similarity | Overall Score | Reason |\n`;
    reportContent += `|------|--------|----------------|---------------|--------|\n`;
    
    lowSimilarity.forEach(pair => {
      let reason = [];
      if (pair.comparison.hasMatchingAcronym) reason.push('Matching acronym');
      if (pair.comparison.websiteSimilarity > 0.8) reason.push('Similar website');
      if (pair.comparison.locationSimilarity > 0.8) reason.push('Same location');
      
      reportContent += `| [${pair.mergePlan.keeperName}](https://www.notion.so/${pair.mergePlan.keeperId.replace(/-/g, '')}) | [${pair.mergePlan.duplicateName}](https://www.notion.so/${pair.mergePlan.duplicateId.replace(/-/g, '')}) | ${pair.comparison.nameSimilarity.toFixed(2)} | ${pair.comparison.overallScore.toFixed(2)} | ${reason.join(', ')} |\n`;
    });
  }
  
  // Add implementation plan
  reportContent += `\n## Implementation Plan\n\n`;
  reportContent += `1. **Review this report** and verify each duplicate pair\n`;
  reportContent += `2. **Edit the JSON file** at \`${jsonPath}\` to confirm verified duplicates\n`;
  reportContent += `3. **Run the duplicate resolution script**:\n`;
  reportContent += `   \`\`\`bash\n`;
  reportContent += `   NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/resolve-duplicates.js ${jsonPath}\n`;
  reportContent += `   \`\`\`\n`;
  reportContent += `4. **Re-run duplicate check** to verify all duplicates have been resolved\n`;
  
  // Write the report
  fs.writeFileSync(reportPath, reportContent);
  
  console.log(`✅ Duplicate analysis complete`);
  console.log(`📝 Report written to: ${reportPath}`);
  console.log(`📝 Resolution template written to: ${jsonPath}`);
}

// Run the analysis
analyzeDuplicates().catch(error => {
  console.error('Error:', error.message);
  if (error.body) console.error('API Error:', error.body);
  process.exit(1);
}); 