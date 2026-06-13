const fs = require('fs');
const path = require('path');

// Read the masterlist to get exact organization names
function readMasterlist() {
  const masterlistPath = path.join(__dirname, '../completed-research/archive-2025-07-29/all-organizations-masterlist.md');
  const content = fs.readFileSync(masterlistPath, 'utf8');
  const lines = content.split('\n');
  
  const orgsNeedingUrls = [];
  
  for (const line of lines) {
    // Match lines with "*(URL needed)*"
    const match = line.match(/^\d+\.\s\*\*(.+?)\*\*.*\*\(URL needed\)\*/);
    if (match) {
      orgsNeedingUrls.push(match[1].trim());
    }
  }
  
  return orgsNeedingUrls;
}

// Read discovered URLs
function readDiscoveredUrls() {
  const csvPath = path.join(__dirname, '../imports/url-discovery-consolidated-fixed.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  const urlMap = new Map();
  
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const url = parts[1].trim();
      urlMap.set(name, url);
    }
  }
  
  return urlMap;
}

// Generate import data
function generateImportData() {
  const orgsNeedingUrls = readMasterlist();
  const discoveredUrls = readDiscoveredUrls();
  
  console.log(`Found ${orgsNeedingUrls.length} organizations needing URLs in masterlist`);
  console.log(`Found ${discoveredUrls.size} discovered URLs\n`);
  
  const importData = [];
  
  // Try to match organizations
  for (const orgName of orgsNeedingUrls) {
    // Direct match
    if (discoveredUrls.has(orgName)) {
      importData.push({
        name: orgName,
        url: discoveredUrls.get(orgName),
        matchType: 'exact'
      });
      continue;
    }
    
    // Try without "Vancouver" suffix
    const nameWithoutVancouver = orgName.replace(' Vancouver', '');
    if (discoveredUrls.has(nameWithoutVancouver)) {
      importData.push({
        name: orgName,
        url: discoveredUrls.get(nameWithoutVancouver),
        matchType: 'without Vancouver'
      });
      continue;
    }
    
    // Try with "Vancouver" added
    const nameWithVancouver = orgName + ' Vancouver';
    if (discoveredUrls.has(nameWithVancouver)) {
      importData.push({
        name: orgName,
        url: discoveredUrls.get(nameWithVancouver),
        matchType: 'with Vancouver'
      });
      continue;
    }
    
    // Check if org exists in discovered but with different suffix
    for (const [discoveredName, url] of discoveredUrls) {
      if (discoveredName.includes(orgName) || orgName.includes(discoveredName)) {
        importData.push({
          name: orgName,
          url: url,
          matchType: 'partial',
          discoveredName: discoveredName
        });
        break;
      }
    }
  }
  
  // Generate CSV for import
  let csv = 'Organization Name,Website URL\n';
  for (const item of importData) {
    csv += `"${item.name}","${item.url}"\n`;
  }
  
  const outputPath = path.join(__dirname, '../imports/url-import-ready.csv');
  fs.writeFileSync(outputPath, csv);
  
  console.log(`\n✅ Generated import file with ${importData.length} URLs`);
  console.log(`📄 Saved to: ${outputPath}`);
  
  // Show summary
  const exactMatches = importData.filter(i => i.matchType === 'exact').length;
  const partialMatches = importData.filter(i => i.matchType === 'partial').length;
  const modifiedMatches = importData.length - exactMatches - partialMatches;
  
  console.log(`\n📊 Match Summary:`);
  console.log(`  - Exact matches: ${exactMatches}`);
  console.log(`  - Modified matches: ${modifiedMatches}`);
  console.log(`  - Partial matches: ${partialMatches}`);
  
  // Show examples of matches
  console.log(`\n📋 Sample matches:`);
  importData.slice(0, 10).forEach(item => {
    console.log(`  - ${item.name} → ${item.url} (${item.matchType})`);
  });
}

generateImportData();