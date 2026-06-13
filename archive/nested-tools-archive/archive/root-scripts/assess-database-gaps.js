#!/usr/bin/env node

/**
 * Assess current database gaps to identify highest-value targets for new data gathering
 */

const { Client } = require('@notionhq/client');
const fs = require('fs');

const notion = new Client({ auth: 'process.env.NOTION_TOKEN' });
const databaseId = '1f0c6f799a3381bd8332ca0235c24655';

class DatabaseGapAssessor {
  constructor() {
    this.analysis = {
      totalCompanies: 0,
      fieldCompleteness: {},
      emptyFieldCounts: {},
      priorityTargets: [],
      dataOpportunities: []
    };
  }

  async execute() {
    console.log('🔍 ASSESSING DATABASE GAPS & OPPORTUNITIES');
    
    // Get all companies from database
    const companies = await this.getAllCompanies();
    this.analysis.totalCompanies = companies.length;
    
    console.log(`📊 Analyzing ${companies.length} companies for data gaps...`);
    
    // Analyze field completeness
    this.analyzeFieldCompleteness(companies);
    
    // Identify priority targets for data gathering
    this.identifyPriorityTargets(companies);
    
    // Generate recommendations
    this.generateDataOpportunities();
    
    // Generate report
    this.generateReport();
    
    return this.analysis;
  }

  async getAllCompanies() {
    const companies = [];
    let hasMore = true;
    let startCursor = undefined;
    
    while (hasMore) {
      const response = await notion.databases.query({
        database_id: databaseId,
        start_cursor: startCursor,
        page_size: 100
      });
      
      companies.push(...response.results);
      hasMore = response.has_more;
      startCursor = response.next_cursor;
    }
    
    return companies;
  }

  analyzeFieldCompleteness(companies) {
    // Key fields to analyze
    const fieldsToAnalyze = [
      'Name', 'Category', 'BC Region', 'AI Focus Areas', 'Year Founded',
      'Website', 'LinkedIn', 'Phone', 'Email', 'Primary Contact',
      'Key People', 'Funding', 'Revenue', 'Employee Count', 'Valuation',
      'Short Blurb', 'Notable Projects', 'Data Sources', 'Last Verified'
    ];
    
    // Initialize counters
    fieldsToAnalyze.forEach(field => {
      this.analysis.fieldCompleteness[field] = 0;
      this.analysis.emptyFieldCounts[field] = 0;
    });
    
    // Count completeness for each field
    companies.forEach(company => {
      fieldsToAnalyze.forEach(field => {
        const property = company.properties[field];
        const hasValue = this.hasPropertyValue(property);
        
        if (hasValue) {
          this.analysis.fieldCompleteness[field]++;
        } else {
          this.analysis.emptyFieldCounts[field]++;
        }
      });
    });
    
    // Calculate percentages
    fieldsToAnalyze.forEach(field => {
      const percentage = Math.round((this.analysis.fieldCompleteness[field] / companies.length) * 100);
      this.analysis.fieldCompleteness[field] = {
        count: this.analysis.fieldCompleteness[field],
        percentage: percentage,
        empty: this.analysis.emptyFieldCounts[field]
      };
    });
  }

  hasPropertyValue(property) {
    if (!property) return false;
    
    switch (property.type) {
      case 'title':
        return property.title && property.title.length > 0 && property.title[0].text.content.trim().length > 0;
      case 'rich_text':
        return property.rich_text && property.rich_text.length > 0 && property.rich_text[0].text.content.trim().length > 0;
      case 'select':
        return property.select && property.select.name;
      case 'multi_select':
        return property.multi_select && property.multi_select.length > 0;
      case 'number':
        return property.number !== null && property.number !== undefined;
      case 'url':
        return property.url && property.url.trim().length > 0;
      case 'date':
        return property.date && property.date.start;
      default:
        return false;
    }
  }

  identifyPriorityTargets(companies) {
    // Find companies with minimal data that could benefit from enhancement
    companies.forEach(company => {
      const name = company.properties.Name?.title?.[0]?.text?.content || 'Unknown';
      const category = company.properties.Category?.select?.name;
      const hasWebsite = this.hasPropertyValue(company.properties.Website);
      const hasLinkedIn = this.hasPropertyValue(company.properties.LinkedIn);
      const hasKeyPeople = this.hasPropertyValue(company.properties['Key People']);
      const hasFunding = this.hasPropertyValue(company.properties.Funding);
      const hasRevenue = this.hasPropertyValue(company.properties.Revenue);
      const hasEmployeeCount = this.hasPropertyValue(company.properties['Employee Count']);
      
      // Calculate data richness score
      const dataScore = [hasWebsite, hasLinkedIn, hasKeyPeople, hasFunding, hasRevenue, hasEmployeeCount]
        .reduce((sum, has) => sum + (has ? 1 : 0), 0);
      
      // Companies with low data richness are priority targets
      if (dataScore <= 2 && category === 'Company') {
        this.analysis.priorityTargets.push({
          name: name,
          id: company.id,
          dataScore: dataScore,
          missingFields: {
            website: !hasWebsite,
            linkedin: !hasLinkedIn,
            keyPeople: !hasKeyPeople,
            funding: !hasFunding,
            revenue: !hasRevenue,
            employeeCount: !hasEmployeeCount
          }
        });
      }
    });
    
    // Sort by data score (lowest first)
    this.analysis.priorityTargets.sort((a, b) => a.dataScore - b.dataScore);
  }

  generateDataOpportunities() {
    // Identify the biggest opportunities for data gathering
    const opportunities = [];
    
    // High-impact fields with low completion rates
    Object.entries(this.analysis.fieldCompleteness).forEach(([field, data]) => {
      if (data.percentage < 50 && data.empty > 50) {
        let priority = 'Medium';
        let strategy = '';
        
        switch (field) {
          case 'LinkedIn':
            priority = 'High';
            strategy = 'Automated LinkedIn search by company name + "Vancouver" or "BC"';
            break;
          case 'Key People':
            priority = 'High';
            strategy = 'LinkedIn company pages + About Us sections of websites';
            break;
          case 'Employee Count':
            priority = 'Medium';
            strategy = 'LinkedIn employee count + Crunchbase data';
            break;
          case 'Funding':
            priority = 'High';
            strategy = 'Crunchbase + BetaKit + press releases + company announcements';
            break;
          case 'Revenue':
            priority = 'Low';
            strategy = 'Public financial statements (for public companies only)';
            break;
          case 'Phone':
            priority = 'Low';
            strategy = 'Company contact pages + directory listings';
            break;
          case 'Email':
            priority = 'Medium';
            strategy = 'Contact pages + press contact info';
            break;
          case 'AI Focus Areas':
            priority = 'High';
            strategy = 'Company descriptions + product pages + press releases';
            break;
        }
        
        if (strategy) {
          opportunities.push({
            field: field,
            emptyCount: data.empty,
            completionRate: data.percentage,
            priority: priority,
            strategy: strategy,
            verifiable: priority === 'High'
          });
        }
      }
    });
    
    // Sort by priority and impact
    opportunities.sort((a, b) => {
      const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.emptyCount - a.emptyCount;
    });
    
    this.analysis.dataOpportunities = opportunities;
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      analysis: 'DATABASE_GAPS_ASSESSMENT',
      summary: {
        totalCompanies: this.analysis.totalCompanies,
        overallCompleteness: this.calculateOverallCompleteness(),
        highestGaps: this.getHighestGaps(),
        priorityTargetCount: this.analysis.priorityTargets.length
      },
      fieldCompleteness: this.analysis.fieldCompleteness,
      dataOpportunities: this.analysis.dataOpportunities,
      priorityTargets: this.analysis.priorityTargets.slice(0, 20) // Top 20
    };
    
    const reportPath = 'data/reports/database-gaps-assessment.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\\n📊 DATABASE GAPS ASSESSMENT COMPLETE');
    console.log(`📈 Overall database completeness: ${report.summary.overallCompleteness}%`);
    console.log(`🎯 Priority companies needing data: ${this.analysis.priorityTargets.length}`);
    console.log(`\\n🔍 TOP DATA OPPORTUNITIES:`);
    
    this.analysis.dataOpportunities.slice(0, 5).forEach((opp, i) => {
      console.log(`${i + 1}. ${opp.field}: ${opp.emptyCount} empty (${opp.completionRate}% complete) - ${opp.priority} priority`);
      console.log(`   Strategy: ${opp.strategy}`);
    });
    
    console.log(`\\n📄 Full report: ${reportPath}`);
  }

  calculateOverallCompleteness() {
    const coreFields = ['Name', 'Website', 'Category', 'BC Region', 'AI Focus Areas', 'Short Blurb'];
    const totalCompletion = coreFields.reduce((sum, field) => {
      return sum + (this.analysis.fieldCompleteness[field]?.percentage || 0);
    }, 0);
    
    return Math.round(totalCompletion / coreFields.length);
  }

  getHighestGaps() {
    return Object.entries(this.analysis.fieldCompleteness)
      .filter(([field, data]) => field !== 'Name')
      .sort((a, b) => a[1].percentage - b[1].percentage)
      .slice(0, 3)
      .map(([field, data]) => ({
        field: field,
        completionRate: data.percentage,
        emptyCount: data.empty
      }));
  }
}

// Execute
const assessor = new DatabaseGapAssessor();
assessor.execute().catch(console.error);