const { Client } = require('@notionhq/client');
const fs = require('fs');
const { NOTION_TOKEN, NOTION_DATABASE_ID } = require('./config');

const notion = new Client({ auth: NOTION_TOKEN });

async function runComprehensiveAudit() {
  console.log('🔍 Running Comprehensive BC AI Ecosystem Database Audit...\n');
  
  const audit = {
    totalCompanies: 0,
    dataQuality: {
      foundingDates: { count: 0, percentage: 0 },
      funding: { count: 0, percentage: 0 },
      revenue: { count: 0, percentage: 0 },
      employeeCount: { count: 0, percentage: 0 },
      keyPeople: { count: 0, percentage: 0 },
      shortBlurb: { count: 0, percentage: 0 },
      notableProjects: { count: 0, percentage: 0 },
      website: { count: 0, percentage: 0 },
      linkedin: { count: 0, percentage: 0 },
      email: { count: 0, percentage: 0 },
      phone: { count: 0, percentage: 0 },
      aiPowerScore: { count: 0, percentage: 0 },
      dataQualityScore: { count: 0, percentage: 0 }
    },
    categoryBreakdown: {},
    regionBreakdown: {},
    fundingStats: {
      totalTracked: 0,
      companies: [],
      byCategory: {},
      unicorns: [],
      recentFunding: []
    },
    revenueStats: {
      totalCompanies: 0,
      companies: [],
      topRevenue: []
    },
    peopleStats: {
      companiesWithPeople: 0,
      totalPeopleTracked: 0,
      topLeaders: []
    },
    recentUpdates: [],
    dataGaps: {
      missingFunding: [],
      missingRevenue: [],
      missingPeople: [],
      missingEmployeeCount: [],
      missingFoundingDate: []
    },
    progressSummary: {
      previousFinancialCoverage: 0.176, // 17.6% from previous assessment
      currentFinancialCoverage: 0,
      improvement: 0
    }
  };

  let hasMore = true;
  let startCursor = undefined;

  while (hasMore) {
    try {
      const response = await notion.databases.query({
        database_id: NOTION_DATABASE_ID,
        start_cursor: startCursor,
        page_size: 100
      });

      for (const page of response.results) {
        audit.totalCompanies++;
        
        const company = {
          id: page.id,
          name: page.properties.Name?.title?.[0]?.text?.content || '',
          category: page.properties.Category?.select?.name || 'Uncategorized',
          region: page.properties['BC Region']?.select?.name || 'Unknown',
          yearFounded: page.properties['Year Founded']?.number,
          funding: page.properties.Funding?.rich_text?.[0]?.text?.content || '',
          revenue: page.properties.Revenue?.rich_text?.[0]?.text?.content || '',
          employeeCount: page.properties['Employee Count']?.rich_text?.[0]?.text?.content || '',
          keyPeople: page.properties['Key People']?.rich_text?.[0]?.text?.content || '',
          shortBlurb: page.properties['Short Blurb']?.rich_text?.[0]?.text?.content || '',
          notableProjects: page.properties['Notable Projects']?.rich_text?.[0]?.text?.content || '',
          website: page.properties.Website?.url || '',
          linkedin: page.properties.LinkedIn?.url || '',
          email: page.properties.Email?.email || '',
          phone: page.properties.Phone?.phone_number || '',
          aiPowerScore: page.properties['AI-Powered']?.number,
          dataQualityScore: page.properties['Data Quality Score']?.number,
          lastModified: page.last_edited_time
        };

        // Track data completeness
        if (company.yearFounded) audit.dataQuality.foundingDates.count++;
        if (company.funding) audit.dataQuality.funding.count++;
        if (company.revenue) audit.dataQuality.revenue.count++;
        if (company.employeeCount) audit.dataQuality.employeeCount.count++;
        if (company.keyPeople) audit.dataQuality.keyPeople.count++;
        if (company.shortBlurb) audit.dataQuality.shortBlurb.count++;
        if (company.notableProjects) audit.dataQuality.notableProjects.count++;
        if (company.website) audit.dataQuality.website.count++;
        if (company.linkedin) audit.dataQuality.linkedin.count++;
        if (company.email) audit.dataQuality.email.count++;
        if (company.phone) audit.dataQuality.phone.count++;
        if (company.aiPowerScore !== null) audit.dataQuality.aiPowerScore.count++;
        if (company.dataQualityScore !== null) audit.dataQuality.dataQualityScore.count++;

        // Category breakdown
        audit.categoryBreakdown[company.category] = (audit.categoryBreakdown[company.category] || 0) + 1;
        
        // Region breakdown
        audit.regionBreakdown[company.region] = (audit.regionBreakdown[company.region] || 0) + 1;

        // Funding analysis
        if (company.funding) {
          const fundingMatch = company.funding.match(/\$([\d.]+)([MBK])?/i);
          if (fundingMatch) {
            let amount = parseFloat(fundingMatch[1]);
            const unit = fundingMatch[2]?.toUpperCase();
            
            if (unit === 'B') amount *= 1000;
            else if (unit === 'K') amount /= 1000;
            
            audit.fundingStats.totalTracked += amount;
            audit.fundingStats.companies.push({
              name: company.name,
              amount: amount,
              category: company.category,
              details: company.funding
            });

            // Track by category
            if (!audit.fundingStats.byCategory[company.category]) {
              audit.fundingStats.byCategory[company.category] = {
                total: 0,
                count: 0,
                companies: []
              };
            }
            audit.fundingStats.byCategory[company.category].total += amount;
            audit.fundingStats.byCategory[company.category].count++;
            audit.fundingStats.byCategory[company.category].companies.push(company.name);

            // Track unicorns
            if (amount >= 1000) {
              audit.fundingStats.unicorns.push({
                name: company.name,
                valuation: amount,
                category: company.category
              });
            }

            // Track recent funding (last 30 days)
            const lastModified = new Date(company.lastModified);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            if (lastModified > thirtyDaysAgo && company.funding.includes('2024') || company.funding.includes('2025')) {
              audit.fundingStats.recentFunding.push({
                name: company.name,
                funding: company.funding,
                date: lastModified.toISOString().split('T')[0]
              });
            }
          }
        }

        // Revenue analysis
        if (company.revenue) {
          audit.revenueStats.totalCompanies++;
          const revenueMatch = company.revenue.match(/\$([\d.]+)([MBK])?/i);
          if (revenueMatch) {
            let amount = parseFloat(revenueMatch[1]);
            const unit = revenueMatch[2]?.toUpperCase();
            
            if (unit === 'B') amount *= 1000;
            else if (unit === 'K') amount /= 1000;
            
            audit.revenueStats.companies.push({
              name: company.name,
              revenue: amount,
              details: company.revenue,
              category: company.category
            });
          }
        }

        // People analysis
        if (company.keyPeople) {
          audit.peopleStats.companiesWithPeople++;
          const peopleCount = (company.keyPeople.match(/\n/g) || []).length + 1;
          audit.peopleStats.totalPeopleTracked += peopleCount;
        }

        // Track data gaps
        if (!company.funding && company.category !== 'Academic & Research Labs') {
          audit.dataGaps.missingFunding.push(company.name);
        }
        if (!company.revenue && ['Start-ups & Scale-ups', 'Technology Companies', 'AI Companies'].includes(company.category)) {
          audit.dataGaps.missingRevenue.push(company.name);
        }
        if (!company.keyPeople) {
          audit.dataGaps.missingPeople.push(company.name);
        }
        if (!company.employeeCount) {
          audit.dataGaps.missingEmployeeCount.push(company.name);
        }
        if (!company.yearFounded) {
          audit.dataGaps.missingFoundingDate.push(company.name);
        }

        // Track recent updates
        const lastModified = new Date(company.lastModified);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        if (lastModified > sevenDaysAgo) {
          audit.recentUpdates.push({
            name: company.name,
            date: lastModified.toISOString().split('T')[0],
            category: company.category
          });
        }
      }

      hasMore = response.has_more;
      startCursor = response.next_cursor;
    } catch (error) {
      console.error('Error in audit:', error);
      hasMore = false;
    }
  }

  // Calculate percentages
  for (const field in audit.dataQuality) {
    audit.dataQuality[field].percentage = ((audit.dataQuality[field].count / audit.totalCompanies) * 100).toFixed(1);
  }

  // Calculate current financial coverage
  audit.progressSummary.currentFinancialCoverage = (audit.dataQuality.funding.count / audit.totalCompanies);
  audit.progressSummary.improvement = ((audit.progressSummary.currentFinancialCoverage - audit.progressSummary.previousFinancialCoverage) * 100).toFixed(1);

  // Sort and limit results
  audit.fundingStats.companies.sort((a, b) => b.amount - a.amount);
  audit.revenueStats.companies.sort((a, b) => b.revenue - a.revenue);
  audit.revenueStats.topRevenue = audit.revenueStats.companies.slice(0, 10);
  audit.fundingStats.recentFunding.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Limit data gaps to top 20
  for (const gap in audit.dataGaps) {
    audit.dataGaps[gap] = audit.dataGaps[gap].slice(0, 20);
  }

  return audit;
}

async function generateAuditReport(audit) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `../data/reports/${timestamp}_comprehensive-audit.md`;
  
  let report = `# BC AI Ecosystem Database Comprehensive Audit\n`;
  report += `*Generated: ${new Date().toISOString().split('T')[0]}*\n\n`;
  
  report += `## 📊 Executive Summary\n\n`;
  report += `- **Total Companies**: ${audit.totalCompanies}\n`;
  report += `- **Financial Coverage**: ${(audit.progressSummary.currentFinancialCoverage * 100).toFixed(1)}% (${audit.progressSummary.improvement > 0 ? '+' : ''}${audit.progressSummary.improvement}% improvement)\n`;
  report += `- **Data Quality Score**: ${((Object.values(audit.dataQuality).reduce((sum, field) => sum + parseFloat(field.percentage), 0) / Object.keys(audit.dataQuality).length)).toFixed(1)}%\n`;
  report += `- **Total Tracked Funding**: $${(audit.fundingStats.totalTracked / 1000).toFixed(1)}B\n`;
  report += `- **Companies with Revenue Data**: ${audit.revenueStats.totalCompanies}\n`;
  report += `- **Recent Updates (7 days)**: ${audit.recentUpdates.length}\n\n`;
  
  report += `## 📈 Progress Since Last Assessment\n\n`;
  report += `| Metric | Previous | Current | Change |\n`;
  report += `|--------|----------|---------|--------|\n`;
  report += `| Funding Coverage | 17.6% | ${audit.dataQuality.funding.percentage}% | ${audit.progressSummary.improvement > 0 ? '+' : ''}${audit.progressSummary.improvement}% |\n`;
  report += `| Founding Dates | 79.2% | ${audit.dataQuality.foundingDates.percentage}% | ${(parseFloat(audit.dataQuality.foundingDates.percentage) - 79.2).toFixed(1)}% |\n`;
  report += `| Key People | 29.0% | ${audit.dataQuality.keyPeople.percentage}% | ${(parseFloat(audit.dataQuality.keyPeople.percentage) - 29.0).toFixed(1)}% |\n\n`;
  
  report += `## 🎯 Data Quality Metrics\n\n`;
  report += `| Field | Count | Coverage |\n`;
  report += `|-------|-------|----------|\n`;
  for (const [field, data] of Object.entries(audit.dataQuality)) {
    const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    report += `| ${fieldName} | ${data.count} | ${data.percentage}% |\n`;
  }
  
  report += `\n## 💰 Financial Intelligence\n\n`;
  report += `### Top 10 Funded Companies\n`;
  audit.fundingStats.companies.slice(0, 10).forEach((company, i) => {
    report += `${i + 1}. **${company.name}** - $${company.amount.toFixed(1)}M (${company.category})\n`;
  });
  
  report += `\n### Recent Funding Activity\n`;
  if (audit.fundingStats.recentFunding.length > 0) {
    audit.fundingStats.recentFunding.forEach(company => {
      report += `- ${company.name}: ${company.funding} (Updated: ${company.date})\n`;
    });
  } else {
    report += `No recent funding updates in the last 30 days.\n`;
  }
  
  report += `\n### Funding by Category\n`;
  const sortedCategories = Object.entries(audit.fundingStats.byCategory)
    .sort(([,a], [,b]) => b.total - a.total)
    .slice(0, 10);
  
  sortedCategories.forEach(([category, data]) => {
    report += `- **${category}**: $${data.total.toFixed(1)}M across ${data.count} companies\n`;
  });
  
  report += `\n## 📍 Geographic Distribution\n\n`;
  Object.entries(audit.regionBreakdown)
    .sort(([,a], [,b]) => b - a)
    .forEach(([region, count]) => {
      report += `- **${region}**: ${count} companies (${((count/audit.totalCompanies)*100).toFixed(1)}%)\n`;
    });
  
  report += `\n## 🏢 Category Breakdown\n\n`;
  Object.entries(audit.categoryBreakdown)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 15)
    .forEach(([category, count]) => {
      report += `- **${category}**: ${count} companies\n`;
    });
  
  report += `\n## 🔴 Critical Data Gaps (Top 20 each)\n\n`;
  report += `### Missing Funding Data\n`;
  audit.dataGaps.missingFunding.forEach(company => {
    report += `- ${company}\n`;
  });
  
  report += `\n### Missing Revenue Data\n`;
  audit.dataGaps.missingRevenue.forEach(company => {
    report += `- ${company}\n`;
  });
  
  report += `\n### Missing People Data\n`;
  audit.dataGaps.missingPeople.slice(0, 10).forEach(company => {
    report += `- ${company}\n`;
  });
  
  report += `\n## ✅ Recent Updates\n\n`;
  if (audit.recentUpdates.length > 0) {
    report += `Companies updated in the last 7 days:\n`;
    audit.recentUpdates.forEach(update => {
      report += `- ${update.name} (${update.category}) - ${update.date}\n`;
    });
  }
  
  report += `\n## 🎯 Next Steps\n\n`;
  report += `1. **Immediate Priority**: Research financial data for ${audit.dataGaps.missingFunding.length} companies missing funding\n`;
  report += `2. **People Intelligence**: Add leadership profiles for ${audit.dataGaps.missingPeople.length} companies\n`;
  report += `3. **Revenue Research**: Investigate revenue for ${audit.dataGaps.missingRevenue.length} high-priority companies\n`;
  report += `4. **Contact Information**: ${(100 - parseFloat(audit.dataQuality.email.percentage)).toFixed(0)}% of companies need email addresses\n`;
  
  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 Audit report saved to: ${reportPath}`);
  
  return report;
}

// Run the audit
async function executeAudit() {
  const audit = await runComprehensiveAudit();
  const report = await generateAuditReport(audit);
  
  // Save JSON data for further analysis
  const jsonPath = `../data/reports/${new Date().toISOString().replace(/[:.]/g, '-')}_audit-data.json`;
  fs.writeFileSync(jsonPath, JSON.stringify(audit, null, 2));
  
  console.log('\n✅ Comprehensive audit complete!');
  console.log(`\n📊 Key Findings:`);
  console.log(`- Financial Coverage: ${audit.dataQuality.funding.percentage}% (${audit.progressSummary.improvement > 0 ? '+' : ''}${audit.progressSummary.improvement}% improvement)`);
  console.log(`- Total Tracked Funding: $${(audit.fundingStats.totalTracked / 1000).toFixed(1)}B`);
  console.log(`- Companies with Recent Updates: ${audit.recentUpdates.length}`);
  console.log(`- High Priority Gaps: ${audit.dataGaps.missingFunding.length} companies need funding data`);
  
  return audit;
}

executeAudit()
  .catch(error => console.error('Audit failed:', error));