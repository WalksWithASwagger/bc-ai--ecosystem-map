const { Client } = require('@notionhq/client');
const fs = require('fs');
const { NOTION_TOKEN, NOTION_DATABASE_ID } = require('./config');

const notion = new Client({ auth: NOTION_TOKEN });

async function generateFinancialSummaryReport() {
  console.log('Generating comprehensive financial summary report...\n');
  
  const financialMetrics = {
    totalCompanies: 0,
    companiesWithFunding: 0,
    companiesWithRevenue: 0,
    companiesWithValuation: 0,
    totalFundingRaised: 0,
    unicorns: [],
    centaurs: [],
    recentFundings: [],
    acquisitions: [],
    publicCompanies: [],
    topFundedCompanies: [],
    highRevenueCompanies: [],
    byCategory: {},
    byRegion: {},
    fundingByYear: {}
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
        const name = page.properties.Name?.title?.[0]?.text?.content || 'Unknown';
        const funding = page.properties.Funding?.rich_text?.[0]?.text?.content || '';
        const revenue = page.properties.Revenue?.rich_text?.[0]?.text?.content || '';
        const valuation = page.properties.Valuation?.rich_text?.[0]?.text?.content || '';
        const category = page.properties.Category?.select?.name || 'Uncategorized';
        const region = page.properties['BC Region']?.select?.name || 'Unknown';
        const yearFounded = page.properties['Year Founded']?.number;
        
        financialMetrics.totalCompanies++;
        
        // Track by category
        if (!financialMetrics.byCategory[category]) {
          financialMetrics.byCategory[category] = {
            count: 0,
            funded: 0,
            hasRevenue: 0
          };
        }
        financialMetrics.byCategory[category].count++;
        
        // Track by region
        if (!financialMetrics.byRegion[region]) {
          financialMetrics.byRegion[region] = {
            count: 0,
            funded: 0
          };
        }
        financialMetrics.byRegion[region].count++;
        
        // Process funding data
        if (funding) {
          financialMetrics.companiesWithFunding++;
          financialMetrics.byCategory[category].funded++;
          financialMetrics.byRegion[region].funded++;
          
          // Extract funding amount
          const fundingMatch = funding.match(/\$(\d+(?:\.\d+)?)\s*(M|B)/i);
          if (fundingMatch) {
            const amount = parseFloat(fundingMatch[1]);
            const multiplier = fundingMatch[2].toUpperCase() === 'B' ? 1000 : 1;
            const fundingAmount = amount * multiplier;
            
            // Track top funded companies
            financialMetrics.topFundedCompanies.push({
              name,
              amount: fundingAmount,
              funding: funding,
              category
            });
            
            // Check for recent funding (2024-2025)
            if (funding.includes('2024') || funding.includes('2025')) {
              financialMetrics.recentFundings.push({
                name,
                funding,
                category
              });
            }
            
            // Check for acquisitions
            if (funding.toLowerCase().includes('acquired')) {
              financialMetrics.acquisitions.push({
                name,
                details: funding
              });
            }
          }
          
          // Check for public companies
          if (funding.includes('IPO') || funding.includes('TSX') || funding.includes('NASDAQ')) {
            financialMetrics.publicCompanies.push({
              name,
              details: funding
            });
          }
        }
        
        // Process revenue data
        if (revenue) {
          financialMetrics.companiesWithRevenue++;
          financialMetrics.byCategory[category].hasRevenue++;
          
          // Extract revenue amount
          const revenueMatch = revenue.match(/\$(\d+(?:\.\d+)?)\s*(M|B)?/i);
          if (revenueMatch) {
            const amount = parseFloat(revenueMatch[1]);
            const multiplier = revenueMatch[2] ? (revenueMatch[2].toUpperCase() === 'B' ? 1000 : 1) : 1;
            const revenueAmount = amount * multiplier;
            
            if (revenueAmount >= 50) {
              financialMetrics.highRevenueCompanies.push({
                name,
                revenue,
                amount: revenueAmount,
                category
              });
            }
          }
        }
        
        // Process valuation data
        if (valuation) {
          financialMetrics.companiesWithValuation++;
          
          // Check for unicorns ($1B+)
          if (valuation.includes('$1B') || valuation.includes('$1.') || 
              valuation.includes('$2B') || valuation.includes('$3B') ||
              valuation.includes('unicorn')) {
            financialMetrics.unicorns.push({
              name,
              valuation,
              category
            });
          }
          
          // Check for centaurs ($100M+)
          const valuationMatch = valuation.match(/\$(\d+(?:\.\d+)?)\s*(M|B)/i);
          if (valuationMatch) {
            const amount = parseFloat(valuationMatch[1]);
            const multiplier = valuationMatch[2].toUpperCase() === 'B' ? 1000 : 1;
            const valuationAmount = amount * multiplier;
            
            if (valuationAmount >= 100 && valuationAmount < 1000) {
              financialMetrics.centaurs.push({
                name,
                valuation,
                category
              });
            }
          }
        }
      }

      hasMore = response.has_more;
      startCursor = response.next_cursor;
    } catch (error) {
      console.error('Error querying database:', error);
      hasMore = false;
    }
  }

  // Sort and limit lists
  financialMetrics.topFundedCompanies.sort((a, b) => b.amount - a.amount);
  financialMetrics.topFundedCompanies = financialMetrics.topFundedCompanies.slice(0, 20);
  
  financialMetrics.highRevenueCompanies.sort((a, b) => b.amount - a.amount);
  financialMetrics.highRevenueCompanies = financialMetrics.highRevenueCompanies.slice(0, 20);

  // Generate summary report
  const summary = {
    overview: {
      totalCompanies: financialMetrics.totalCompanies,
      companiesWithFunding: financialMetrics.companiesWithFunding,
      companiesWithRevenue: financialMetrics.companiesWithRevenue,
      companiesWithValuation: financialMetrics.companiesWithValuation,
      fundingCoverage: `${((financialMetrics.companiesWithFunding / financialMetrics.totalCompanies) * 100).toFixed(1)}%`,
      revenueCoverage: `${((financialMetrics.companiesWithRevenue / financialMetrics.totalCompanies) * 100).toFixed(1)}%`
    },
    valuationTiers: {
      unicorns: financialMetrics.unicorns,
      centaurs: financialMetrics.centaurs,
      publicCompanies: financialMetrics.publicCompanies
    },
    topCompanies: {
      topFunded: financialMetrics.topFundedCompanies,
      highRevenue: financialMetrics.highRevenueCompanies
    },
    recentActivity: {
      recentFundings: financialMetrics.recentFundings,
      acquisitions: financialMetrics.acquisitions
    },
    breakdown: {
      byCategory: financialMetrics.byCategory,
      byRegion: financialMetrics.byRegion
    }
  };

  // Save report
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `../data/reports/${timestamp}_financial-intelligence-summary.json`;
  
  fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
  
  // Print summary
  console.log('=== BC AI Ecosystem Financial Intelligence Summary ===\n');
  console.log(`Total Companies: ${summary.overview.totalCompanies}`);
  console.log(`Companies with Funding Data: ${summary.overview.companiesWithFunding} (${summary.overview.fundingCoverage})`);
  console.log(`Companies with Revenue Data: ${summary.overview.companiesWithRevenue} (${summary.overview.revenueCoverage})`);
  console.log(`Companies with Valuation Data: ${summary.overview.companiesWithValuation}`);
  
  console.log('\n=== Valuation Tiers ===');
  console.log(`Unicorns ($1B+): ${summary.valuationTiers.unicorns.length}`);
  summary.valuationTiers.unicorns.forEach(u => console.log(`  - ${u.name}: ${u.valuation}`));
  
  console.log(`\nCentaurs ($100M-$1B): ${summary.valuationTiers.centaurs.length}`);
  console.log(`Public Companies: ${summary.valuationTiers.publicCompanies.length}`);
  
  console.log('\n=== Top Funded Companies ===');
  summary.topCompanies.topFunded.slice(0, 10).forEach(c => {
    console.log(`  - ${c.name}: $${c.amount}M (${c.category})`);
  });
  
  console.log('\n=== High Revenue Companies ===');
  summary.topCompanies.highRevenue.slice(0, 10).forEach(c => {
    console.log(`  - ${c.name}: ${c.revenue} (${c.category})`);
  });
  
  console.log('\n=== Recent Activity (2024-2025) ===');
  console.log(`Recent Fundings: ${summary.recentActivity.recentFundings.length}`);
  console.log(`Acquisitions: ${summary.recentActivity.acquisitions.length}`);
  
  console.log(`\nFull report saved to: ${reportPath}`);
}

// Generate the report
generateFinancialSummaryReport()
  .then(() => console.log('\nFinancial intelligence summary complete!'))
  .catch(error => console.error('Error:', error));