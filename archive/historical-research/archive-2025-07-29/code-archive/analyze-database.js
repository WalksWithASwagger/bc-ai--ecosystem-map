require('dotenv').config();
const { Client } = require('@notionhq/client');
const stringSimilarity = require('string-similarity');

if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
  console.error('❌ Missing NOTION_TOKEN or NOTION_DATABASE_ID in .env file');
  process.exit(1);
}

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const dbId = process.env.NOTION_DATABASE_ID;

async function getAllOrganizations() {
  console.log('🔄 Fetching all organizations from Notion...');
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
  } while (cursor);
  
  return pages;
}

function analyzeCompleteness(orgs) {
  console.log('\n📊 DATABASE ANALYSIS REPORT');
  console.log('=' .repeat(50));
  console.log(`Total Organizations: ${orgs.length}`);
  
  // Field completeness analysis
  const fields = {
    'Name': org => org.properties.Name?.title?.[0]?.plain_text,
    'Website': org => org.properties.Website?.url,
    'Email': org => org.properties.Email?.email,
    'LinkedIn': org => org.properties.LinkedIn?.url,
    'City/Region': org => org.properties['City/Region']?.rich_text?.[0]?.plain_text,
    'BC Region': org => org.properties['BC Region']?.select?.name,
    'Category': org => org.properties.Category?.select?.name,
    'AI Focus Areas': org => org.properties['AI Focus Areas']?.multi_select?.length > 0,
    'Short Blurb': org => org.properties['Short Blurb']?.rich_text?.[0]?.plain_text,
    'Year Founded': org => org.properties['Year Founded']?.number,
    'Primary Contact': org => org.properties['Primary Contact']?.rich_text?.[0]?.plain_text,
    'Phone': org => org.properties.Phone?.phone_number,
    'Logo': org => org.properties.Logo?.files?.length > 0,
  };
  
  console.log('\n📈 FIELD COMPLETENESS:');
  console.log('-'.repeat(50));
  
  Object.entries(fields).forEach(([fieldName, getter]) => {
    const count = orgs.filter(org => getter(org)).length;
    const percentage = ((count / orgs.length) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(percentage / 2)).padEnd(50, '░');
    console.log(`${fieldName.padEnd(20)} ${bar} ${percentage}% (${count}/${orgs.length})`);
  });
  
  // Quality scoring
  console.log('\n🏆 QUALITY DISTRIBUTION:');
  console.log('-'.repeat(50));
  
  const qualityScores = orgs.map(org => {
    let score = 0;
    let maxScore = 0;
    
    // Critical fields (10 points each)
    const criticalFields = ['Name', 'Website', 'Category', 'BC Region'];
    criticalFields.forEach(field => {
      maxScore += 10;
      if (fields[field](org)) score += 10;
    });
    
    // Important fields (5 points each)
    const importantFields = ['Email', 'LinkedIn', 'City/Region', 'AI Focus Areas', 'Short Blurb'];
    importantFields.forEach(field => {
      maxScore += 5;
      if (fields[field](org)) score += 5;
    });
    
    // Nice-to-have fields (2 points each)
    const niceFields = ['Year Founded', 'Primary Contact', 'Phone', 'Logo'];
    niceFields.forEach(field => {
      maxScore += 2;
      if (fields[field](org)) score += 2;
    });
    
    return {
      org,
      score,
      percentage: (score / maxScore) * 100
    };
  });
  
  const qualityBuckets = {
    'Excellent (90-100%)': qualityScores.filter(q => q.percentage >= 90).length,
    'Good (70-89%)': qualityScores.filter(q => q.percentage >= 70 && q.percentage < 90).length,
    'Fair (50-69%)': qualityScores.filter(q => q.percentage >= 50 && q.percentage < 70).length,
    'Poor (< 50%)': qualityScores.filter(q => q.percentage < 50).length,
  };
  
  Object.entries(qualityBuckets).forEach(([bucket, count]) => {
    const percentage = ((count / orgs.length) * 100).toFixed(1);
    console.log(`${bucket.padEnd(20)} ${count} orgs (${percentage}%)`);
  });
  
  const avgQuality = qualityScores.reduce((sum, q) => sum + q.percentage, 0) / qualityScores.length;
  console.log(`\nAverage Quality Score: ${avgQuality.toFixed(1)}%`);
}

function findDuplicates(orgs) {
  console.log('\n🔍 DUPLICATE DETECTION:');
  console.log('-'.repeat(50));
  
  const names = orgs.map(org => ({
    id: org.id,
    name: org.properties.Name?.title?.[0]?.plain_text || 'UNKNOWN'
  }));
  
  const duplicates = [];
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const similarity = stringSimilarity.compareTwoStrings(
        names[i].name.toLowerCase(),
        names[j].name.toLowerCase()
      );
      if (similarity >= 0.85) {
        duplicates.push({
          org1: names[i],
          org2: names[j],
          similarity: (similarity * 100).toFixed(1)
        });
      }
    }
  }
  
  if (duplicates.length === 0) {
    console.log('✅ No potential duplicates found (similarity < 85%)');
  } else {
    console.log(`⚠️  Found ${duplicates.length} potential duplicate pairs:`);
    duplicates.forEach(dup => {
      console.log(`- "${dup.org1.name}" ↔ "${dup.org2.name}" (${dup.similarity}% similar)`);
    });
  }
}

function analyzeByRegion(orgs) {
  console.log('\n🗺️  REGIONAL DISTRIBUTION:');
  console.log('-'.repeat(50));
  
  const regions = {};
  orgs.forEach(org => {
    const region = org.properties['BC Region']?.select?.name || 'Not specified';
    regions[region] = (regions[region] || 0) + 1;
  });
  
  Object.entries(regions)
    .sort((a, b) => b[1] - a[1])
    .forEach(([region, count]) => {
      const percentage = ((count / orgs.length) * 100).toFixed(1);
      console.log(`${region.padEnd(25)} ${count} orgs (${percentage}%)`);
    });
}

function analyzeByCategory(orgs) {
  console.log('\n🏢 CATEGORY DISTRIBUTION:');
  console.log('-'.repeat(50));
  
  const categories = {};
  orgs.forEach(org => {
    const category = org.properties.Category?.select?.name || 'Not specified';
    categories[category] = (categories[category] || 0) + 1;
  });
  
  Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      const percentage = ((count / orgs.length) * 100).toFixed(1);
      console.log(`${category.padEnd(35)} ${count} orgs (${percentage}%)`);
    });
}

function findIncompleteOrgs(orgs) {
  console.log('\n⚠️  ORGANIZATIONS NEEDING ATTENTION:');
  console.log('-'.repeat(50));
  
  const criticalMissing = orgs.filter(org => {
    const hasName = org.properties.Name?.title?.[0]?.plain_text;
    const hasWebsite = org.properties.Website?.url;
    const hasCategory = org.properties.Category?.select?.name;
    const hasRegion = org.properties['BC Region']?.select?.name;
    
    return hasName && (!hasWebsite || !hasCategory || !hasRegion);
  });
  
  console.log(`\nMissing critical fields (${criticalMissing.length} orgs):`);
  criticalMissing.slice(0, 10).forEach(org => {
    const name = org.properties.Name?.title?.[0]?.plain_text;
    const missing = [];
    if (!org.properties.Website?.url) missing.push('Website');
    if (!org.properties.Category?.select?.name) missing.push('Category');
    if (!org.properties['BC Region']?.select?.name) missing.push('BC Region');
    
    console.log(`- ${name}: Missing ${missing.join(', ')}`);
  });
  
  if (criticalMissing.length > 10) {
    console.log(`... and ${criticalMissing.length - 10} more`);
  }
}

// Main execution
(async () => {
  try {
    const orgs = await getAllOrganizations();
    
    analyzeCompleteness(orgs);
    findDuplicates(orgs);
    analyzeByRegion(orgs);
    analyzeByCategory(orgs);
    findIncompleteOrgs(orgs);
    
    console.log('\n✅ Analysis complete!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'unauthorized') {
      console.error('The Notion token appears to be invalid. Please check your .env file.');
    }
  }
})();