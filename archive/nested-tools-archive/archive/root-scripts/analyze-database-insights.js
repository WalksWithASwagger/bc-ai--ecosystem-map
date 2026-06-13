#!/usr/bin/env node

/**
 * Database Insights Analyzer
 * Analyzes our BC AI ecosystem database to extract proprietary insights
 */

const config = require('./config.js');
const { Client } = require('@notionhq/client');

const notion = new Client({
  auth: config.NOTION_TOKEN,
});

async function analyzeDatabase() {
  console.log('🔍 Analyzing BC AI Ecosystem Database for Proprietary Insights...\n');
  
  try {
    // Fetch all organizations
    const response = await notion.databases.query({
      database_id: config.NOTION_DATABASE_ID,
      page_size: 100
    });

    let allOrganizations = [...response.results];
    let nextCursor = response.next_cursor;

    // Fetch all pages
    while (nextCursor) {
      const nextResponse = await notion.databases.query({
        database_id: config.NOTION_DATABASE_ID,
        start_cursor: nextCursor,
        page_size: 100
      });
      allOrganizations = [...allOrganizations, ...nextResponse.results];
      nextCursor = nextResponse.next_cursor;
    }

    console.log(`📊 Total Organizations: ${allOrganizations.length}\n`);

    // Extract key data points
    const insights = {
      total: allOrganizations.length,
      byCategory: {},
      byLocation: {},
      byFundingStage: {},
      byFoundingYear: {},
      withFunding: 0,
      withEmployees: 0,
      withWebsites: 0,
      withLinkedIn: 0,
      recentlyFounded: 0, // Last 3 years
      growthStage: 0,
      uniqueLocations: new Set(),
      uniqueCategories: new Set(),
      totalFunding: 0,
      totalEmployees: 0
    };

    const currentYear = new Date().getFullYear();

    // Analyze each organization
    allOrganizations.forEach(org => {
      const props = org.properties;
      
      // Category analysis
      const category = props.Category?.select?.name || 'Uncategorized';
      insights.byCategory[category] = (insights.byCategory[category] || 0) + 1;
      insights.uniqueCategories.add(category);

      // Location analysis
      const location = props.Location?.rich_text?.[0]?.plain_text || 'Unknown';
      insights.byLocation[location] = (insights.byLocation[location] || 0) + 1;
      insights.uniqueLocations.add(location);

      // Funding analysis
      const funding = props.Funding?.number;
      if (funding && funding > 0) {
        insights.withFunding++;
        insights.totalFunding += funding;
      }

      // Employee analysis
      const employees = props.Employees?.number;
      if (employees && employees > 0) {
        insights.withEmployees++;
        insights.totalEmployees += employees;
      }

      // Digital presence
      if (props.Website?.url) insights.withWebsites++;
      if (props.LinkedIn?.url) insights.withLinkedIn++;

      // Founding year analysis
      const foundingYear = props['Founding Year']?.number;
      if (foundingYear) {
        insights.byFoundingYear[foundingYear] = (insights.byFoundingYear[foundingYear] || 0) + 1;
        if (foundingYear >= currentYear - 3) {
          insights.recentlyFounded++;
        }
      }

      // Growth stage analysis
      const stage = props['Funding Stage']?.select?.name;
      if (stage) {
        insights.byFundingStage[stage] = (insights.byFundingStage[stage] || 0) + 1;
        if (['Series A', 'Series B', 'Series C', 'Growth'].includes(stage)) {
          insights.growthStage++;
        }
      }
    });

    // Generate insights report
    console.log('🎯 KEY PROPRIETARY INSIGHTS:\n');
    
    console.log('📈 ECOSYSTEM SCALE & MATURITY:');
    console.log(`• Total AI Organizations: ${insights.total}`);
    console.log(`• Digital Presence: ${Math.round((insights.withWebsites / insights.total) * 100)}% have websites`);
    console.log(`• Professional Networks: ${Math.round((insights.withLinkedIn / insights.total) * 100)}% on LinkedIn`);
    console.log(`• Recently Founded (2022-2025): ${insights.recentlyFounded} (${Math.round((insights.recentlyFounded / insights.total) * 100)}%)`);
    console.log(`• Growth Stage Companies: ${insights.growthStage}\n`);

    console.log('🏢 CATEGORY DISTRIBUTION:');
    const sortedCategories = Object.entries(insights.byCategory)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    sortedCategories.forEach(([category, count]) => {
      const percentage = Math.round((count / insights.total) * 100);
      console.log(`• ${category}: ${count} companies (${percentage}%)`);
    });

    console.log('\n🌍 GEOGRAPHIC DISTRIBUTION:');
    const sortedLocations = Object.entries(insights.byLocation)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    sortedLocations.forEach(([location, count]) => {
      const percentage = Math.round((count / insights.total) * 100);
      console.log(`• ${location}: ${count} companies (${percentage}%)`);
    });

    console.log('\n💰 FUNDING LANDSCAPE:');
    if (insights.withFunding > 0) {
      console.log(`• Companies with Funding Data: ${insights.withFunding} (${Math.round((insights.withFunding / insights.total) * 100)}%)`);
      console.log(`• Average Funding: $${Math.round(insights.totalFunding / insights.withFunding).toLocaleString()}`);
      console.log(`• Total Ecosystem Funding: $${insights.totalFunding.toLocaleString()}`);
    }

    console.log('\n👥 EMPLOYMENT IMPACT:');
    if (insights.withEmployees > 0) {
      console.log(`• Companies with Employee Data: ${insights.withEmployees} (${Math.round((insights.withEmployees / insights.total) * 100)}%)`);
      console.log(`• Average Company Size: ${Math.round(insights.totalEmployees / insights.withEmployees)} employees`);
      console.log(`• Total Estimated Employment: ${insights.totalEmployees.toLocaleString()} jobs`);
    }

    console.log('\n📅 FOUNDING TRENDS:');
    const recentYears = Object.entries(insights.byFoundingYear)
      .filter(([year]) => parseInt(year) >= 2020)
      .sort(([a], [b]) => parseInt(b) - parseInt(a));
    recentYears.forEach(([year, count]) => {
      console.log(`• ${year}: ${count} companies founded`);
    });

    // Save detailed insights for visualization
    const detailedInsights = {
      ...insights,
      uniqueLocations: Array.from(insights.uniqueLocations),
      uniqueCategories: Array.from(insights.uniqueCategories),
      generatedAt: new Date().toISOString()
    };

    require('fs').writeFileSync(
      './database-insights.json',
      JSON.stringify(detailedInsights, null, 2)
    );

    console.log('\n✅ Analysis complete! Insights saved to tools/database-insights.json');
    
    return detailedInsights;

  } catch (error) {
    console.error('Error analyzing database:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  analyzeDatabase();
}

module.exports = { analyzeDatabase };