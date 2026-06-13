/**
 * Script: validate-before-import.js
 * Purpose: MANDATORY validation before ANY data import to Notion
 * Category: core validation
 * Created: August 4, 2025
 * 
 * Usage:
 *   node validate-before-import.js <data-file.json>
 * 
 * Returns:
 *   0 - All entries valid, safe to import
 *   1 - Invalid entries found, DO NOT import
 */

const fs = require('fs');
const path = require('path');

// Suspicious patterns that indicate bad data
const SUSPICIOUS_PATTERNS = [
  // Field/property names
  /^(name|email|website|phone|address|description|category|status|type|date|year|funding|location|city|province|country|revenue|valuation|employees?|staff|team|founder|ceo|cto|key\s*people?)$/i,
  
  // Data types
  /^(string|text|number|boolean|bool|array|object|null|undefined|true|false|yes|no|n\/a)$/i,
  
  // Technical terms
  /^(id|uuid|guid|key|value|field|property|attribute|column|row|table|database|schema|index|query|select|insert|update|delete)$/i,
  
  // File names
  /\.(json|csv|xlsx?|txt|md|pdf|doc|sql|js|py|java|cpp|html|css|xml)$/i,
  
  // Dates/timestamps alone
  /^\d{4}-\d{2}-\d{2}$/,
  /^(january|february|march|april|may|june|july|august|september|october|november|december)\s*\d{0,4}$/i,
  
  // Common placeholders
  /^(test|sample|example|demo|temp|tmp|delete|remove|ignore|todo|fixme|xxx|placeholder|dummy|fake)$/i,
  
  // Single letters or just numbers
  /^[a-z]$/i,
  /^\d+$/,
  
  // Common words that aren't company names
  /^(the|and|or|but|with|for|from|about|contact|info|information|data|list|group|team|department|division|unit|section)$/i,
  
  // Task-like entries
  /^(add|create|update|modify|change|fix|improve|enhance|develop|build|make|do|check|verify|validate|review|analyze|research|find|search|track|monitor|watch|follow)[\s\w]+$/i,
  
  // Before/After patterns
  /^(before|after|pre|post|prior|previous|following|subsequent)[\s\w]*$/i,
  
  // Just a year
  /^(19|20)\d{2}$/
];

function validateEntry(entry, index) {
  const errors = [];
  
  // 1. Name validation
  if (!entry.name || typeof entry.name !== 'string') {
    errors.push('Missing or invalid name');
  } else {
    const name = entry.name.trim();
    
    if (name.length < 4) {
      errors.push(`Name too short: "${name}" (min 4 characters)`);
    }
    
    if (SUSPICIOUS_PATTERNS.some(pattern => pattern.test(name))) {
      errors.push(`Suspicious name pattern: "${name}"`);
    }
    
    if (name.includes('http://') || name.includes('https://')) {
      errors.push(`Name contains URL: "${name}"`);
    }
    
    if (name.includes('@')) {
      errors.push(`Name contains email: "${name}"`);
    }
  }
  
  // 2. Data completeness check
  const dataPoints = [];
  if (entry.website) dataPoints.push('website');
  if (entry.email) dataPoints.push('email');
  if (entry.location) dataPoints.push('location');
  if (entry.description && entry.description.length > 20) dataPoints.push('description');
  if (entry.yearFounded) dataPoints.push('yearFounded');
  if (entry.keyPeople && entry.keyPeople.length > 10) dataPoints.push('keyPeople');
  if (entry.funding) dataPoints.push('funding');
  if (entry.category) dataPoints.push('category');
  
  if (dataPoints.length < 2) {
    errors.push(`Insufficient data (only ${dataPoints.length} fields: ${dataPoints.join(', ')})`);
  }
  
  // 3. URL validation
  if (entry.website) {
    if (!entry.website.startsWith('http://') && !entry.website.startsWith('https://')) {
      errors.push(`Invalid website URL: "${entry.website}" (must start with http:// or https://)`);
    }
  }
  
  // 4. Year validation
  if (entry.yearFounded) {
    const currentYear = new Date().getFullYear();
    if (entry.yearFounded > currentYear) {
      errors.push(`Future founding year: ${entry.yearFounded}`);
    }
    if (entry.yearFounded < 1900) {
      errors.push(`Unrealistic founding year: ${entry.yearFounded}`);
    }
  }
  
  return {
    index,
    name: entry.name,
    valid: errors.length === 0,
    errors,
    dataPoints: dataPoints.length
  };
}

function generateReport(results, filename) {
  const timestamp = new Date().toISOString();
  const validCount = results.filter(r => r.valid).length;
  const invalidCount = results.filter(r => !r.valid).length;
  
  let report = `# Import Validation Report\n\n`;
  report += `**File**: ${filename}\n`;
  report += `**Date**: ${timestamp}\n`;
  report += `**Total Entries**: ${results.length}\n`;
  report += `**Valid**: ${validCount}\n`;
  report += `**Invalid**: ${invalidCount}\n\n`;
  
  if (invalidCount > 0) {
    report += `## ❌ VALIDATION FAILED - DO NOT IMPORT\n\n`;
    report += `### Invalid Entries:\n\n`;
    
    results.filter(r => !r.valid).forEach(result => {
      report += `#### Entry ${result.index}: "${result.name || 'NO NAME'}"\n`;
      result.errors.forEach(error => {
        report += `- ${error}\n`;
      });
      report += `\n`;
    });
  } else {
    report += `## ✅ VALIDATION PASSED - SAFE TO IMPORT\n\n`;
  }
  
  // Summary statistics
  report += `### Data Quality Summary:\n\n`;
  const dataPointCounts = {};
  results.forEach(r => {
    const points = r.dataPoints;
    dataPointCounts[points] = (dataPointCounts[points] || 0) + 1;
  });
  
  Object.keys(dataPointCounts).sort().forEach(count => {
    report += `- ${dataPointCounts[count]} entries with ${count} data points\n`;
  });
  
  return report;
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('❌ Usage: node validate-before-import.js <data-file.json>');
    process.exit(1);
  }
  
  const filename = args[0];
  
  if (!fs.existsSync(filename)) {
    console.error(`❌ File not found: ${filename}`);
    process.exit(1);
  }
  
  let data;
  try {
    const content = fs.readFileSync(filename, 'utf8');
    data = JSON.parse(content);
  } catch (error) {
    console.error(`❌ Failed to parse JSON: ${error.message}`);
    process.exit(1);
  }
  
  // Ensure data is an array
  if (!Array.isArray(data)) {
    if (data.organizations && Array.isArray(data.organizations)) {
      data = data.organizations;
    } else {
      console.error('❌ Data must be an array of organizations');
      process.exit(1);
    }
  }
  
  console.log(`\n🔍 Validating ${data.length} entries...\n`);
  
  // Validate each entry
  const results = data.map((entry, index) => validateEntry(entry, index));
  
  // Generate report
  const report = generateReport(results, filename);
  
  // Save report
  const reportFilename = `validation-report-${Date.now()}.md`;
  fs.writeFileSync(reportFilename, report);
  
  // Display summary
  const validCount = results.filter(r => r.valid).length;
  const invalidCount = results.filter(r => !r.valid).length;
  
  console.log('📊 Validation Results:');
  console.log(`   ✅ Valid entries: ${validCount}`);
  console.log(`   ❌ Invalid entries: ${invalidCount}`);
  console.log(`\n📄 Full report saved to: ${reportFilename}\n`);
  
  if (invalidCount > 0) {
    console.error('❌ VALIDATION FAILED - DO NOT IMPORT THIS DATA');
    console.error('   Fix the issues listed in the report and try again.\n');
    process.exit(1);
  } else {
    console.log('✅ VALIDATION PASSED - Safe to import!\n');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { validateEntry, SUSPICIOUS_PATTERNS };