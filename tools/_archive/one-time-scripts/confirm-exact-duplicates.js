#!/usr/bin/env node
/**
 * Automatically mark all exact name matches as confirmed in the duplicate resolution JSON file
 * Usage: node scripts/confirm-exact-duplicates.js
 */
const fs = require('fs');
const path = require('path');

// Find the most recent duplicate resolution JSON file
const reportsDir = path.join(__dirname, '..', 'reports');
const files = fs.readdirSync(reportsDir);
const resolutionFiles = files.filter(f => f.includes('duplicate-resolution') && f.endsWith('.json'));
resolutionFiles.sort((a, b) => b.localeCompare(a)); // Sort in descending order

if (resolutionFiles.length === 0) {
  console.error('No duplicate resolution JSON file found');
  process.exit(1);
}

const resolutionFile = path.join(reportsDir, resolutionFiles[0]);
console.log(`Using resolution file: ${resolutionFile}`);

// Read the resolution file
let resolution;
try {
  const fileContent = fs.readFileSync(resolutionFile, 'utf8');
  resolution = JSON.parse(fileContent);
} catch (error) {
  console.error(`Error reading resolution file: ${error.message}`);
  process.exit(1);
}

// Count initial confirmed duplicates
const initialConfirmed = resolution.duplicatePairs.filter(pair => pair.confirmed).length;

// Mark exact name matches as confirmed
let exactMatchesCount = 0;
let highSimilarityCount = 0;

resolution.duplicatePairs.forEach(pair => {
  // Check for exact name match
  if (pair.keeper.name === pair.duplicate.name) {
    pair.confirmed = true;
    exactMatchesCount++;
  }
  // Check for high similarity (95%+)
  else if (pair.keeper.name.toLowerCase().includes(pair.duplicate.name.toLowerCase()) || 
           pair.duplicate.name.toLowerCase().includes(pair.keeper.name.toLowerCase())) {
    pair.confirmed = true;
    highSimilarityCount++;
  }
});

// Write the updated resolution file
try {
  fs.writeFileSync(resolutionFile, JSON.stringify(resolution, null, 2));
  console.log(`✅ Updated resolution file: ${resolutionFile}`);
  console.log(`   - Initial confirmed duplicates: ${initialConfirmed}`);
  console.log(`   - Exact name matches marked as confirmed: ${exactMatchesCount}`);
  console.log(`   - High similarity matches marked as confirmed: ${highSimilarityCount}`);
  console.log(`   - Total confirmed duplicates: ${resolution.duplicatePairs.filter(pair => pair.confirmed).length}`);
} catch (error) {
  console.error(`Error writing resolution file: ${error.message}`);
  process.exit(1);
} 