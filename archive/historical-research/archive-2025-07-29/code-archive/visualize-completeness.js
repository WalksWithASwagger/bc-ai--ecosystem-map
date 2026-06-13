const fs = require('fs');

// Read the analysis data
const analysisData = JSON.parse(fs.readFileSync('missing-fields-analysis.json', 'utf8'));

// Generate additional insights
function generateDetailedInsights() {
  const report = analysisData;
  
  // Group organizations by completeness ranges
  const completenessRanges = {
    '0-20%': [],
    '21-40%': [],
    '41-60%': [],
    '61-80%': [],
    '81-100%': []
  };
  
  report.top50MostIncomplete.forEach(org => {
    if (org.completenessScore <= 20) completenessRanges['0-20%'].push(org);
    else if (org.completenessScore <= 40) completenessRanges['21-40%'].push(org);
    else if (org.completenessScore <= 60) completenessRanges['41-60%'].push(org);
    else if (org.completenessScore <= 80) completenessRanges['61-80%'].push(org);
    else completenessRanges['81-100%'].push(org);
  });
  
  // Analyze by category if available
  const orgsByCategory = {};
  const criticalByCategory = {};
  
  // Create priority lists
  const priorityLists = {
    noContactAtAll: report.criticallyIncomplete.filter(org => org.contactScore === 0),
    noPeopleInfo: report.criticallyIncomplete.filter(org => org.peopleScore === 0),
    missingWebsite: report.top50MostIncomplete.filter(org => org.missingFields.includes('Website')),
    missingEmail: report.top50MostIncomplete.filter(org => org.missingFields.includes('Email'))
  };
  
  // Generate enhanced report
  let enhancedReport = `# BC AI Ecosystem - Enhanced Completeness Analysis
Generated: ${new Date().toISOString()}

## Data Quality Overview

### Overall Statistics
- **Total Organizations**: ${report.summary.totalOrganizations}
- **Average Completeness**: ${report.summary.averageCompleteness}%
- **Organizations with NO contact info**: ${report.summary.organizationsMissingCriticalContact} (${Math.round(report.summary.organizationsMissingCriticalContact / report.summary.totalOrganizations * 100)}%)
- **Organizations with NO people info**: ${report.summary.organizationsMissingPeopleInfo} (${Math.round(report.summary.organizationsMissingPeopleInfo / report.summary.totalOrganizations * 100)}%)

### Completeness Distribution
`;

  Object.entries(completenessRanges).forEach(([range, orgs]) => {
    enhancedReport += `- **${range}**: ${orgs.length} organizations\n`;
  });

  enhancedReport += `
## Critical Missing Fields Analysis

### LinkedIn URL - 0% Complete (458 missing)
**Impact**: LinkedIn is crucial for finding key people, company updates, and professional networking.
**Action**: Systematic LinkedIn search campaign needed for all organizations.

### Logo - 0% Complete (458 missing)
**Impact**: Visual identity important for directory and recognition.
**Action**: Collect from websites, LinkedIn, or request directly.

### Key People - 10% Complete (412 missing)
**Impact**: Critical for relationship building and understanding leadership.
**Priority Organizations Missing Key People**:
`;

  priorityLists.noPeopleInfo.slice(0, 10).forEach(org => {
    enhancedReport += `- ${org.name}\n`;
  });

  enhancedReport += `
### Contact Information Gaps

#### Email - 26% Complete (340 missing)
**Organizations with NO Email**:
`;

  priorityLists.missingEmail.slice(0, 10).forEach(org => {
    enhancedReport += `- ${org.name}\n`;
  });

  enhancedReport += `
#### Website - 52% Complete (222 missing)
**Organizations with NO Website**:
`;

  priorityLists.missingWebsite.slice(0, 10).forEach(org => {
    enhancedReport += `- ${org.name}\n`;
  });

  enhancedReport += `
## Research Priority Matrix

### Tier 1 - Critical (Immediate Action)
Organizations with 0% completeness that need complete research:
`;

  completenessRanges['0-20%'].slice(0, 20).forEach(org => {
    enhancedReport += `1. **${org.name}** - Missing: ${org.missingFieldCount} fields\n`;
  });

  enhancedReport += `
### Tier 2 - High Priority
Organizations missing critical contact or people information:
`;

  const tier2 = report.criticallyIncomplete
    .filter(org => org.completenessScore > 0 && org.completenessScore <= 40)
    .slice(0, 15);
    
  tier2.forEach(org => {
    enhancedReport += `- **${org.name}** (${org.completenessScore}%) - Missing: ${org.criticalMissing.join(', ')}\n`;
  });

  enhancedReport += `
## Data Collection Strategy

### Phase 1: Emergency Contact Recovery (Week 1)
1. **Web Search**: Find websites for 222 organizations
2. **Email Hunt**: Use websites to find contact emails
3. **LinkedIn Campaign**: Create company page list

### Phase 2: People Intelligence (Week 2)
1. **Founder Research**: Use Crunchbase, LinkedIn, news articles
2. **Executive Mapping**: Identify CTOs, CEOs, AI leads
3. **Contact Verification**: Validate emails and phone numbers

### Phase 3: Enrichment (Week 3)
1. **Funding Data**: Research investment rounds
2. **Project Documentation**: Notable AI projects and use cases
3. **Logo Collection**: From websites and brand assets

## Quick Wins

### Organizations that just need LinkedIn URL:
`;

  const needsLinkedIn = report.top50MostIncomplete
    .filter(org => org.missingFields.length === 1 && org.missingFields[0] === 'LinkedIn URL')
    .slice(0, 10);
    
  if (needsLinkedIn.length > 0) {
    needsLinkedIn.forEach(org => {
      enhancedReport += `- ${org.name}\n`;
    });
  } else {
    enhancedReport += `- None found (all organizations missing LinkedIn also miss other fields)\n`;
  }

  enhancedReport += `
### Organizations missing only Logo:
`;

  const needsLogo = report.top50MostIncomplete
    .filter(org => org.missingFields.length === 1 && org.missingFields[0] === 'Logo')
    .slice(0, 10);
    
  if (needsLogo.length > 0) {
    needsLogo.forEach(org => {
      enhancedReport += `- ${org.name}\n`;
    });
  } else {
    enhancedReport += `- None found (all organizations missing Logo also miss other fields)\n`;
  }

  enhancedReport += `
## Recommended Tools & Resources

1. **LinkedIn Sales Navigator**: Bulk company and people search
2. **Clearbit/Hunter.io**: Email discovery from domains
3. **Crunchbase Pro**: Funding and founder information
4. **Google Custom Search API**: Automated website discovery
5. **Social Media APIs**: Twitter/X for latest updates

## Success Metrics

- **Week 1 Target**: Reduce "no contact info" from 215 to under 100
- **Week 2 Target**: Add people info to 150+ organizations  
- **Week 3 Target**: Achieve 60% average completeness (from current 39%)
- **Month Target**: No organization below 25% completeness
`;

  return enhancedReport;
}

// Generate and save the enhanced report
const enhancedReport = generateDetailedInsights();
fs.writeFileSync('completeness-insights.md', enhancedReport);

// Also create a CSV for easy filtering in spreadsheets
let csv = 'Organization,Completeness %,Contact Score %,People Score %,Missing Fields Count,Priority Missing Fields\n';

analysisData.top50MostIncomplete.forEach(org => {
  const priorityMissing = org.criticalMissing.join('; ') || 'None';
  csv += `"${org.name}",${org.completenessScore},${org.contactScore},${org.peopleScore},${org.missingFieldCount},"${priorityMissing}"\n`;
});

fs.writeFileSync('priority-organizations.csv', csv);

console.log('\nAdditional reports generated:');
console.log('- completeness-insights.md: Enhanced strategic analysis');
console.log('- priority-organizations.csv: Top 50 organizations for spreadsheet work');