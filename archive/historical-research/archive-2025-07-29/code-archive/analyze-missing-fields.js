const { Client } = require('@notionhq/client');
const fs = require('fs');

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const databaseId = '1f0c6f79-9a33-81bd-8332-ca0235c24655';

async function fetchAllOrganizations() {
  const organizations = [];
  let hasMore = true;
  let startCursor = undefined;

  while (hasMore) {
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: startCursor,
      page_size: 100,
    });

    organizations.push(...response.results);
    hasMore = response.has_more;
    startCursor = response.next_cursor;
  }

  return organizations;
}

async function analyzeCompleteness() {
  try {
    const orgs = await fetchAllOrganizations();
    console.log(`\nAnalyzing ${orgs.length} organizations...`);
    
    const completenessData = [];
    
    // Field weights based on importance
    const fieldWeights = {
      // Contact Information (45 points total)
      'Email': 15,
      'Website': 15,
      'LinkedIn URL': 10,
      'Phone': 5,
      
      // People Information (20 points total)
      'Primary Contact': 10,
      'Key People': 10,
      
      // Core Information (20 points total)
      'City/Region': 5,
      'BC Region': 3,
      'Category': 5,
      'AI Focus Areas': 5,
      'Short Blurb': 2,
      
      // Additional Information (15 points total)
      'Logo': 3,
      'Year Founded': 3,
      'Size': 3,
      'Notable Projects': 3,
      'Focus & Notes': 3,
    };
    
    // Statistics tracking
    const stats = {
      totalOrgs: orgs.length,
      fieldCompleteness: {},
      missingCriticalContact: 0,
      missingPeople: 0,
      missingFunding: 0,
      completeOrgs: 0,
      emptyOrgs: 0
    };
    
    // Initialize field completeness stats
    Object.keys(fieldWeights).forEach(field => {
      stats.fieldCompleteness[field] = { filled: 0, missing: 0 };
    });
    
    for (const org of orgs) {
      if (!('properties' in org)) continue;
      
      const props = org.properties;
      const data = {
        id: org.id,
        url: org.url,
        name: props.Name?.title?.[0]?.plain_text || 'Unknown',
        missingFields: [],
        presentFields: [],
        completenessScore: 0,
        contactScore: 0,
        peopleScore: 0,
        criticalMissing: []
      };
      
      // Check all fields
      const fields = {
        'Email': props.Email?.email,
        'Website': props.Website?.url,
        'LinkedIn URL': props['LinkedIn URL']?.url,
        'Phone': props.Phone?.phone_number,
        'Primary Contact': props['Primary Contact']?.rich_text?.[0]?.plain_text,
        'Key People': props['Key People']?.rich_text?.[0]?.plain_text,
        'City/Region': props['City/Region']?.rich_text?.[0]?.plain_text,
        'BC Region': props['BC Region']?.select?.name,
        'Category': props.Category?.select?.name,
        'AI Focus Areas': props['AI Focus Areas']?.multi_select?.length > 0,
        'Logo': props.Logo?.files?.length > 0,
        'Short Blurb': props['Short Blurb']?.rich_text?.[0]?.plain_text,
        'Year Founded': props['Year Founded']?.number,
        'Size': props.Size?.select?.name,
        'Notable Projects': props['Notable Projects']?.rich_text?.[0]?.plain_text,
        'Focus & Notes': props['Focus & Notes']?.rich_text?.[0]?.plain_text,
      };
      
      // Additional fields not in weights
      const additionalFields = {
        'Contact/Links': props['Contact/Links']?.rich_text?.[0]?.plain_text,
        'Status': props.Status?.select?.name,
        'Relationship': props.Relationship?.select?.name,
        'Support Need': props['Support Need']?.multi_select?.length > 0,
        'Data Source': props['Data Source']?.select?.name,
        'Warm-Intro Vector': props['Warm-Intro Vector']?.rich_text?.[0]?.plain_text
      };
      
      let filledFields = 0;
      let totalWeight = 0;
      let earnedWeight = 0;
      const totalFields = Object.keys(fields).length;
      
      // Calculate contact score
      const contactFields = ['Email', 'Website', 'LinkedIn URL', 'Phone'];
      let contactWeight = 0;
      let earnedContactWeight = 0;
      
      // Calculate people score
      const peopleFields = ['Primary Contact', 'Key People'];
      let peopleWeight = 0;
      let earnedPeopleWeight = 0;
      
      // Check weighted fields
      for (const [field, value] of Object.entries(fields)) {
        const weight = fieldWeights[field] || 0;
        totalWeight += weight;
        
        if (contactFields.includes(field)) {
          contactWeight += weight;
        }
        if (peopleFields.includes(field)) {
          peopleWeight += weight;
        }
        
        if (!value) {
          data.missingFields.push(field);
          stats.fieldCompleteness[field].missing++;
          
          // Track critical missing fields
          if (contactFields.includes(field) || peopleFields.includes(field)) {
            data.criticalMissing.push(field);
          }
        } else {
          filledFields++;
          earnedWeight += weight;
          data.presentFields.push(field);
          stats.fieldCompleteness[field].filled++;
          
          if (contactFields.includes(field)) {
            earnedContactWeight += weight;
          }
          if (peopleFields.includes(field)) {
            earnedPeopleWeight += weight;
          }
        }
      }
      
      // Check if missing critical contact info
      if (earnedContactWeight === 0) {
        stats.missingCriticalContact++;
      }
      
      // Check if missing people info
      if (earnedPeopleWeight === 0) {
        stats.missingPeople++;
      }
      
      // Check for funding info in various fields
      const fundingMentions = [
        props['Notable Projects']?.rich_text?.[0]?.plain_text || '',
        props['Focus & Notes']?.rich_text?.[0]?.plain_text || '',
        props['Short Blurb']?.rich_text?.[0]?.plain_text || ''
      ].join(' ').toLowerCase();
      
      const hasFundingInfo = fundingMentions.includes('funding') || 
                            fundingMentions.includes('raised') || 
                            fundingMentions.includes('investment') ||
                            fundingMentions.includes('series') ||
                            fundingMentions.includes('seed') ||
                            fundingMentions.includes('venture');
      
      if (!hasFundingInfo && props['Support Need']?.multi_select?.some(s => s.name === 'Funding')) {
        stats.missingFunding++;
      }
      
      // Calculate scores
      data.completenessScore = Math.round((earnedWeight / totalWeight) * 100);
      data.contactScore = contactWeight > 0 ? Math.round((earnedContactWeight / contactWeight) * 100) : 0;
      data.peopleScore = peopleWeight > 0 ? Math.round((earnedPeopleWeight / peopleWeight) * 100) : 0;
      data.impactWeight = totalWeight - earnedWeight;
      data.missingFieldCount = data.missingFields.length;
      
      // Track complete and empty orgs
      if (data.completenessScore === 100) {
        stats.completeOrgs++;
      } else if (data.completenessScore === 0) {
        stats.emptyOrgs++;
      }
      
      completenessData.push(data);
    }
    
    // Sort by highest impact weight (most missing high-value fields)
    completenessData.sort((a, b) => b.impactWeight - a.impactWeight);
    
    // Generate comprehensive report
    const report = {
      summary: {
        totalOrganizations: stats.totalOrgs,
        completeOrganizations: stats.completeOrgs,
        emptyOrganizations: stats.emptyOrgs,
        organizationsMissingCriticalContact: stats.missingCriticalContact,
        organizationsMissingPeopleInfo: stats.missingPeople,
        organizationsWithoutFundingInfo: stats.missingFunding,
        averageCompleteness: Math.round(completenessData.reduce((sum, org) => sum + org.completenessScore, 0) / stats.totalOrgs),
        generatedAt: new Date().toISOString()
      },
      fieldStatistics: Object.entries(stats.fieldCompleteness)
        .map(([field, data]) => ({
          field,
          filled: data.filled,
          missing: data.missing,
          completionRate: Math.round((data.filled / stats.totalOrgs) * 100)
        }))
        .sort((a, b) => a.completionRate - b.completionRate),
      top50MostIncomplete: completenessData.slice(0, 50),
      criticallyIncomplete: completenessData.filter(org => 
        org.contactScore === 0 || org.peopleScore === 0
      ).slice(0, 30)
    };
    
    // Save detailed analysis
    fs.writeFileSync('missing-fields-analysis.json', JSON.stringify(report, null, 2));
    
    // Generate markdown report
    const markdownReport = generateMarkdownReport(report, completenessData);
    fs.writeFileSync('missing-fields-report.md', markdownReport);
    
    console.log('\nAnalysis complete!');
    console.log('- Detailed JSON saved to: missing-fields-analysis.json');
    console.log('- Human-readable report saved to: missing-fields-report.md');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

function generateMarkdownReport(report, allOrgs) {
  let md = `# BC AI Ecosystem - Missing Fields Analysis Report
Generated: ${new Date().toISOString()}

## Executive Summary

- **Total Organizations**: ${report.summary.totalOrganizations}
- **Fully Complete**: ${report.summary.completeOrganizations} (${Math.round(report.summary.completeOrganizations / report.summary.totalOrganizations * 100)}%)
- **Empty Records**: ${report.summary.emptyOrganizations} (${Math.round(report.summary.emptyOrganizations / report.summary.totalOrganizations * 100)}%)
- **Average Completeness**: ${report.summary.averageCompleteness}%

### Critical Gaps
- **Missing ALL Contact Info**: ${report.summary.organizationsMissingCriticalContact} organizations
- **Missing People Information**: ${report.summary.organizationsMissingPeopleInfo} organizations
- **Without Funding Information**: ${report.summary.organizationsWithoutFundingInfo} organizations

## Field Completeness Statistics

| Field | Filled | Missing | Completion Rate |
|-------|--------|---------|-----------------|
`;

  report.fieldStatistics.forEach(stat => {
    md += `| ${stat.field} | ${stat.filled} | ${stat.missing} | ${stat.completionRate}% |\n`;
  });

  md += `\n## Priority Organizations for Research

These organizations have the most missing critical fields and should be prioritized for research:

### Top 20 Most Incomplete Organizations

| Organization | Completeness | Contact Score | People Score | Missing Fields |
|--------------|--------------|---------------|--------------|----------------|
`;

  report.top50MostIncomplete.slice(0, 20).forEach(org => {
    md += `| [${org.name}](${org.url}) | ${org.completenessScore}% | ${org.contactScore}% | ${org.peopleScore}% | ${org.missingFieldCount} fields |\n`;
  });

  md += `\n### Organizations Missing Critical Contact Information

These organizations have NO email, website, LinkedIn, or phone number:

`;

  const noContact = allOrgs.filter(org => org.contactScore === 0).slice(0, 15);
  noContact.forEach(org => {
    md += `- **${org.name}**: Missing ${org.criticalMissing.join(', ')}\n`;
  });

  md += `\n### Organizations Missing People Information

These organizations have NO primary contact or key people listed:

`;

  const noPeople = allOrgs.filter(org => org.peopleScore === 0).slice(0, 15);
  noPeople.forEach(org => {
    md += `- **${org.name}**: Missing Primary Contact and Key People\n`;
  });

  md += `\n## Recommendations

1. **Immediate Priority**: Focus on the ${report.summary.organizationsMissingCriticalContact} organizations with no contact information
2. **People Research**: Research founders and key executives for ${report.summary.organizationsMissingPeopleInfo} organizations
3. **Funding Intelligence**: Gather funding information for startups and scale-ups
4. **Data Enrichment**: Use LinkedIn, Crunchbase, and company websites to fill gaps
5. **Direct Outreach**: Contact organizations directly to verify and update information

## Field Priority for Research

Based on weights and impact:
1. **Email** (15 points) - Critical for communication
2. **Website** (15 points) - Primary information source
3. **Primary Contact** (10 points) - Key relationship management
4. **Key People** (10 points) - Leadership and founder information
5. **LinkedIn URL** (10 points) - Professional networking and updates
`;

  return md;
}

// Run the analysis
analyzeCompleteness();