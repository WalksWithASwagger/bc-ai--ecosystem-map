const { Client } = require('@notionhq/client');
const fs = require('fs');
const { NOTION_TOKEN, NOTION_DATABASE_ID } = require('./config');

const notion = new Client({ auth: NOTION_TOKEN });

async function validateDataQuality() {
  console.log('🔍 Starting comprehensive data quality validation...\n');
  
  const validation = {
    totalCompanies: 0,
    duplicates: [],
    dataInconsistencies: [],
    invalidData: [],
    missingCriticalFields: [],
    fundingValidation: [],
    revenueValidation: [],
    companyNames: new Map(),
    similarNames: [],
    dataQualityScore: 0
  };

  let hasMore = true;
  let startCursor = undefined;
  const allCompanies = [];

  // Fetch all companies
  while (hasMore) {
    try {
      const response = await notion.databases.query({
        database_id: NOTION_DATABASE_ID,
        start_cursor: startCursor,
        page_size: 100
      });

      for (const page of response.results) {
        const company = {
          id: page.id,
          name: page.properties.Name?.title?.[0]?.text?.content || '',
          funding: page.properties.Funding?.rich_text?.[0]?.text?.content || '',
          revenue: page.properties.Revenue?.rich_text?.[0]?.text?.content || '',
          valuation: page.properties.Valuation?.rich_text?.[0]?.text?.content || '',
          employeeCount: page.properties['Employee Count']?.rich_text?.[0]?.text?.content || '',
          keyPeople: page.properties['Key People']?.rich_text?.[0]?.text?.content || '',
          category: page.properties.Category?.select?.name || '',
          region: page.properties['BC Region']?.select?.name || '',
          website: page.properties.Website?.url || '',
          linkedin: page.properties.LinkedIn?.url || '',
          yearFounded: page.properties['Year Founded']?.number,
          shortBlurb: page.properties['Short Blurb']?.rich_text?.[0]?.text?.content || '',
          dataSource: page.properties['Data Source']?.select?.name || ''
        };
        
        allCompanies.push(company);
        validation.totalCompanies++;
      }

      hasMore = response.has_more;
      startCursor = response.next_cursor;
    } catch (error) {
      console.error('Error fetching companies:', error);
      hasMore = false;
    }
  }

  console.log(`📊 Analyzing ${validation.totalCompanies} companies...\n`);

  // 1. Check for exact duplicates
  console.log('🔎 Checking for duplicate entries...');
  for (const company of allCompanies) {
    if (!company.name) {
      validation.missingCriticalFields.push({
        id: company.id,
        issue: 'Missing company name',
        severity: 'critical'
      });
      continue;
    }

    const normalizedName = company.name.toLowerCase().trim();
    
    if (validation.companyNames.has(normalizedName)) {
      const existing = validation.companyNames.get(normalizedName);
      validation.duplicates.push({
        name: company.name,
        duplicate1: { id: existing.id, name: existing.name },
        duplicate2: { id: company.id, name: company.name },
        severity: 'high'
      });
    } else {
      validation.companyNames.set(normalizedName, company);
    }
  }

  // 2. Check for similar names (potential duplicates)
  console.log('🔍 Checking for similar company names...');
  const names = Array.from(validation.companyNames.keys());
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const name1 = names[i];
      const name2 = names[j];
      
      // Check for similar names using various patterns
      if (areNamesSimilar(name1, name2)) {
        const company1 = validation.companyNames.get(name1);
        const company2 = validation.companyNames.get(name2);
        
        validation.similarNames.push({
          name1: company1.name,
          name2: company2.name,
          id1: company1.id,
          id2: company2.id,
          similarity: calculateSimilarity(name1, name2),
          severity: 'medium'
        });
      }
    }
  }

  // 3. Validate funding data
  console.log('💰 Validating funding data...');
  for (const company of allCompanies) {
    if (company.funding) {
      const fundingIssues = validateFunding(company.funding, company.name);
      if (fundingIssues.length > 0) {
        validation.fundingValidation.push({
          name: company.name,
          id: company.id,
          funding: company.funding,
          issues: fundingIssues
        });
      }
    }
  }

  // 4. Validate revenue data
  console.log('📈 Validating revenue data...');
  for (const company of allCompanies) {
    if (company.revenue) {
      const revenueIssues = validateRevenue(company.revenue, company.name);
      if (revenueIssues.length > 0) {
        validation.revenueValidation.push({
          name: company.name,
          id: company.id,
          revenue: company.revenue,
          issues: revenueIssues
        });
      }
    }
  }

  // 5. Check data consistency
  console.log('🔧 Checking data consistency...');
  for (const company of allCompanies) {
    const inconsistencies = checkDataConsistency(company);
    if (inconsistencies.length > 0) {
      validation.dataInconsistencies.push({
        name: company.name,
        id: company.id,
        issues: inconsistencies
      });
    }
  }

  // 6. Validate URLs and external references
  console.log('🌐 Validating URLs and external data...');
  for (const company of allCompanies) {
    const urlIssues = validateUrls(company);
    if (urlIssues.length > 0) {
      validation.invalidData.push({
        name: company.name,
        id: company.id,
        issues: urlIssues
      });
    }
  }

  // Calculate data quality score
  const totalIssues = validation.duplicates.length + 
                     validation.dataInconsistencies.length + 
                     validation.invalidData.length + 
                     validation.missingCriticalFields.length + 
                     validation.fundingValidation.length + 
                     validation.revenueValidation.length;
  
  validation.dataQualityScore = Math.max(0, 100 - (totalIssues / validation.totalCompanies * 100));

  // Generate report
  const report = generateValidationReport(validation);
  
  // Save validation report
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `./data/reports/${timestamp}_data-quality-validation.json`;
  const mdReportPath = `../data/reports/${timestamp}_data-quality-report.md`;
  
  fs.writeFileSync(reportPath, JSON.stringify(validation, null, 2));
  fs.writeFileSync(mdReportPath, report);
  
  console.log('\n=== Data Quality Validation Summary ===');
  console.log(`Total Companies: ${validation.totalCompanies}`);
  console.log(`Exact Duplicates: ${validation.duplicates.length}`);
  console.log(`Similar Names (potential duplicates): ${validation.similarNames.length}`);
  console.log(`Funding Data Issues: ${validation.fundingValidation.length}`);
  console.log(`Revenue Data Issues: ${validation.revenueValidation.length}`);
  console.log(`Data Inconsistencies: ${validation.dataInconsistencies.length}`);
  console.log(`Invalid Data: ${validation.invalidData.length}`);
  console.log(`Missing Critical Fields: ${validation.missingCriticalFields.length}`);
  console.log(`Data Quality Score: ${validation.dataQualityScore.toFixed(1)}/100`);
  
  if (validation.duplicates.length > 0) {
    console.log('\n🚨 CRITICAL: Exact duplicates found:');
    validation.duplicates.forEach(dup => {
      console.log(`  - "${dup.name}" (IDs: ${dup.duplicate1.id.slice(-8)} vs ${dup.duplicate2.id.slice(-8)})`);
    });
  }
  
  if (validation.similarNames.length > 0) {
    console.log('\n⚠️  Similar names requiring review:');
    validation.similarNames.slice(0, 10).forEach(sim => {
      console.log(`  - "${sim.name1}" vs "${sim.name2}" (${sim.similarity}% similar)`);
    });
  }
  
  console.log(`\nDetailed reports saved to:`);
  console.log(`JSON: ${reportPath}`);
  console.log(`Markdown: ${mdReportPath}`);
  
  return validation;
}

function areNamesSimilar(name1, name2) {
  // Remove common suffixes and normalize
  const normalize = (name) => {
    return name
      .toLowerCase()
      .replace(/\b(inc|corp|corporation|ltd|limited|llc|technologies|technology|tech|systems|solutions|labs|lab)\b/g, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  };
  
  const norm1 = normalize(name1);
  const norm2 = normalize(name2);
  
  if (norm1 === norm2) return true;
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
  
  // Levenshtein distance check
  const similarity = calculateSimilarity(norm1, norm2);
  return similarity > 80;
}

function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 100;
  
  const distance = levenshteinDistance(longer, shorter);
  return ((longer.length - distance) / longer.length) * 100;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

function validateFunding(funding, companyName) {
  const issues = [];
  
  // Check for common funding format issues
  if (funding.includes('$') && funding.includes('M')) {
    const match = funding.match(/\$(\d+(?:\.\d+)?)\s*M/i);
    if (match) {
      const amount = parseFloat(match[1]);
      if (amount > 1000) {
        issues.push(`Suspicious funding amount: $${amount}M (should this be $${amount/1000}B?)`);
      }
    }
  }
  
  // Check for inconsistent date formats
  const datePattern = /20\d{2}/g;
  const dates = funding.match(datePattern);
  if (dates && dates.length > 1) {
    const uniqueDates = [...new Set(dates)];
    if (uniqueDates.length > 1) {
      const sortedDates = uniqueDates.sort();
      if (parseInt(sortedDates[0]) > parseInt(sortedDates[sortedDates.length - 1])) {
        issues.push('Date order inconsistency in funding history');
      }
    }
  }
  
  // Check for missing lead investor when funding amount is present
  if (funding.includes('$') && !funding.includes(' - ') && !funding.toLowerCase().includes('undisclosed')) {
    issues.push('Missing investor information for funded company');
  }
  
  return issues;
}

function validateRevenue(revenue, companyName) {
  const issues = [];
  
  // Check for revenue format issues
  if (revenue.includes('$') && revenue.includes('M')) {
    const match = revenue.match(/\$(\d+(?:\.\d+)?)\s*M/i);
    if (match) {
      const amount = parseFloat(match[1]);
      if (amount > 10000) {
        issues.push(`Suspicious revenue amount: $${amount}M (should this be $${amount/1000}B?)`);
      }
    }
  }
  
  // Check for inconsistent revenue descriptions
  if (revenue.toLowerCase().includes('pre-revenue') && revenue.includes('$')) {
    issues.push('Contradictory revenue data: marked as pre-revenue but shows dollar amount');
  }
  
  return issues;
}

function checkDataConsistency(company) {
  const issues = [];
  
  // Check year founded consistency
  if (company.yearFounded) {
    const currentYear = new Date().getFullYear();
    if (company.yearFounded > currentYear) {
      issues.push(`Year founded (${company.yearFounded}) is in the future`);
    }
    if (company.yearFounded < 1900) {
      issues.push(`Year founded (${company.yearFounded}) seems too old for a tech company`);
    }
  }
  
  // Check category vs data consistency
  if (company.category === 'AI Companies' && !company.shortBlurb.toLowerCase().includes('ai') && 
      !company.shortBlurb.toLowerCase().includes('artificial intelligence') &&
      !company.shortBlurb.toLowerCase().includes('machine learning')) {
    issues.push('Company categorized as AI but description lacks AI-related terms');
  }
  
  // Check region consistency
  if (company.region === 'Unknown' && company.name && company.shortBlurb) {
    issues.push('Region marked as Unknown despite having company information');
  }
  
  return issues;
}

function validateUrls(company) {
  const issues = [];
  
  // Basic URL validation
  if (company.website && !isValidUrl(company.website)) {
    issues.push(`Invalid website URL: ${company.website}`);
  }
  
  if (company.linkedin && !isValidUrl(company.linkedin)) {
    issues.push(`Invalid LinkedIn URL: ${company.linkedin}`);
  }
  
  // LinkedIn URL format check
  if (company.linkedin && !company.linkedin.includes('linkedin.com/company/')) {
    issues.push(`LinkedIn URL format issue: ${company.linkedin}`);
  }
  
  return issues;
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function generateValidationReport(validation) {
  return `# Data Quality Validation Report
*BC AI Ecosystem Database Integrity Check*

**Generated:** ${new Date().toISOString().split('T')[0]}  
**Total Companies:** ${validation.totalCompanies}  
**Data Quality Score:** ${validation.dataQualityScore.toFixed(1)}/100

---

## 🚨 Critical Issues

### Exact Duplicates (${validation.duplicates.length})
${validation.duplicates.length === 0 ? '✅ No exact duplicates found!' : 
  validation.duplicates.map(dup => 
    `- **${dup.name}**\n  - ID 1: ${dup.duplicate1.id}\n  - ID 2: ${dup.duplicate2.id}`
  ).join('\n')
}

### Missing Critical Fields (${validation.missingCriticalFields.length})
${validation.missingCriticalFields.length === 0 ? '✅ All companies have required fields!' : 
  validation.missingCriticalFields.map(issue => 
    `- **${issue.issue}** (ID: ${issue.id.slice(-8)})`
  ).join('\n')
}

---

## ⚠️ Moderate Issues

### Similar Names - Potential Duplicates (${validation.similarNames.length})
${validation.similarNames.length === 0 ? '✅ No similar names detected!' : 
  validation.similarNames.slice(0, 20).map(sim => 
    `- **"${sim.name1}"** vs **"${sim.name2}"** (${sim.similarity.toFixed(1)}% similar)`
  ).join('\n')
}

### Funding Data Issues (${validation.fundingValidation.length})
${validation.fundingValidation.length === 0 ? '✅ All funding data validated!' : 
  validation.fundingValidation.slice(0, 10).map(issue => 
    `- **${issue.name}**: ${issue.issues.join(', ')}`
  ).join('\n')
}

### Revenue Data Issues (${validation.revenueValidation.length})
${validation.revenueValidation.length === 0 ? '✅ All revenue data validated!' : 
  validation.revenueValidation.slice(0, 10).map(issue => 
    `- **${issue.name}**: ${issue.issues.join(', ')}`
  ).join('\n')
}

---

## 🔧 Data Consistency Issues (${validation.dataInconsistencies.length})

${validation.dataInconsistencies.length === 0 ? '✅ No data consistency issues!' : 
  validation.dataInconsistencies.slice(0, 15).map(issue => 
    `- **${issue.name}**: ${issue.issues.join(', ')}`
  ).join('\n')
}

---

## 🌐 URL & External Data Issues (${validation.invalidData.length})

${validation.invalidData.length === 0 ? '✅ All URLs and external data validated!' : 
  validation.invalidData.slice(0, 10).map(issue => 
    `- **${issue.name}**: ${issue.issues.join(', ')}`
  ).join('\n')
}

---

## 📊 Data Quality Metrics

- **Completeness:** ${((validation.totalCompanies - validation.missingCriticalFields.length) / validation.totalCompanies * 100).toFixed(1)}%
- **Accuracy:** ${((validation.totalCompanies - validation.fundingValidation.length - validation.revenueValidation.length) / validation.totalCompanies * 100).toFixed(1)}%
- **Consistency:** ${((validation.totalCompanies - validation.dataInconsistencies.length) / validation.totalCompanies * 100).toFixed(1)}%
- **Uniqueness:** ${((validation.totalCompanies - validation.duplicates.length) / validation.totalCompanies * 100).toFixed(1)}%

---

## 🎯 Recommendations

### Immediate Actions Required
${validation.duplicates.length > 0 ? '1. **Remove exact duplicates** - ' + validation.duplicates.length + ' found' : ''}
${validation.missingCriticalFields.length > 0 ? '2. **Fill missing critical fields** - ' + validation.missingCriticalFields.length + ' issues' : ''}

### Review Required
${validation.similarNames.length > 0 ? '1. **Review similar names** - ' + validation.similarNames.length + ' potential duplicates' : ''}
${validation.fundingValidation.length > 0 ? '2. **Validate funding data** - ' + validation.fundingValidation.length + ' issues' : ''}

### Data Enhancement
1. **Standardize data formats** for funding and revenue
2. **Implement data validation rules** for future entries
3. **Set up automated duplicate detection** for new entries

---

**Validation Complete!** Database integrity checked and documented for quality assurance.`;
}

// Run validation
validateDataQuality()
  .then(() => console.log('\n✅ Data quality validation complete!'))
  .catch(error => console.error('❌ Validation error:', error));