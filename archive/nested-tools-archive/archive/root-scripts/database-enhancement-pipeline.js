#!/usr/bin/env node

/**
 * BC AI Ecosystem Database Enhancement Pipeline
 * Systematically imports rich local research data into Notion database
 * 
 * PRIORITY TARGETS:
 * - 412 organizations missing Key People (90% of database)
 * - 390 organizations missing Year Founded (85% of database)  
 * - 458 organizations missing LinkedIn URLs (100% of database)
 * - Rich financial data from local JSON files
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DATA_SOURCES = {
  FINANCIAL_INTELLIGENCE: 'data/research/financial-intelligence/',
  PEOPLE_INTELLIGENCE: 'data/research/people-intelligence/', 
  VALIDATED_BATCHES: 'data/research/validated-batches/',
  MISSING_FIELDS: 'data/research/missing-fields-analysis.json'
};

// Import priorities based on database gaps
const ENHANCEMENT_PRIORITIES = [
  {
    field: 'Key People',
    missingCount: 412,
    completionRate: 10,
    sources: ['financial-people-intelligence-batch.json', '2019-founded-bc-tech-companies.json'],
    priority: 'HIGH'
  },
  {
    field: 'LinkedIn URL', 
    missingCount: 458,
    completionRate: 0,
    sources: ['missing-companies-financial-data.json'],
    priority: 'HIGH'
  },
  {
    field: 'Year Founded',
    missingCount: 390, 
    completionRate: 15,
    sources: ['2019-founded-bc-tech-companies.json', '2020-founded-bc-tech-companies.json'],
    priority: 'HIGH'
  },
  {
    field: 'Funding',
    missingCount: 200,
    completionRate: 56,
    sources: ['missing-companies-financial-data.json', 'financial-people-intelligence-batch.json'],
    priority: 'MEDIUM'
  },
  {
    field: 'Employee Count',
    missingCount: 300,
    completionRate: 34,
    sources: ['financial-people-intelligence-batch.json'],
    priority: 'MEDIUM'
  }
];

class DatabaseEnhancementPipeline {
  constructor() {
    this.processedCompanies = new Set();
    this.enhancementResults = {
      companiesProcessed: 0,
      fieldsUpdated: 0,
      errors: []
    };
  }

  async run() {
    console.log('🚀 Starting BC AI Ecosystem Database Enhancement Pipeline');
    console.log('📊 Target: 458 organizations with significant data gaps');
    
    // Load missing fields analysis
    const missingFieldsData = this.loadMissingFieldsAnalysis();
    console.log(`📈 Current average completeness: ${missingFieldsData.summary.averageCompleteness}%`);
    
    // Process each priority enhancement
    for (const priority of ENHANCEMENT_PRIORITIES) {
      console.log(`\\n🎯 Processing ${priority.field} (${priority.missingCount} missing)`);
      await this.processEnhancementPriority(priority);
    }
    
    // Generate results report
    this.generateResultsReport();
  }

  loadMissingFieldsAnalysis() {
    const filePath = DATA_SOURCES.MISSING_FIELDS;
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing fields analysis not found: ${filePath}`);
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  async processEnhancementPriority(priority) {
    for (const sourceFile of priority.sources) {
      console.log(`  📄 Processing ${sourceFile}`);
      
      // Find the source file in appropriate directory
      const sourceData = this.loadSourceData(sourceFile);
      if (!sourceData) continue;
      
      // Extract companies with the target field
      const companiesWithData = this.extractCompaniesWithField(sourceData, priority.field);
      console.log(`    ✅ Found ${companiesWithData.length} companies with ${priority.field} data`);
      
      // Process each company (would integrate with Notion API)
      for (const company of companiesWithData) {
        await this.processCompanyUpdate(company, priority.field);
      }
    }
  }

  loadSourceData(filename) {
    // Search for file in data directories
    const searchPaths = [
      `data/research/${filename}`,
      `data/research/financial-intelligence/${filename}`,
      `data/research/people-intelligence/${filename}`,
      `data/research/validated-batches/${filename}`
    ];
    
    for (const searchPath of searchPaths) {
      if (fs.existsSync(searchPath)) {
        try {
          return JSON.parse(fs.readFileSync(searchPath, 'utf8'));
        } catch (error) {
          console.log(`    ⚠️  Error loading ${searchPath}: ${error.message}`);
          return null;
        }
      }
    }
    
    console.log(`    ❌ Source file not found: ${filename}`);
    return null;
  }

  extractCompaniesWithField(sourceData, fieldName) {
    const companies = [];
    
    // Handle different JSON structures
    if (sourceData.organizations) {
      // Format: { organizations: [...] }
      companies.push(...sourceData.organizations.filter(org => this.hasFieldData(org, fieldName)));
    } else if (sourceData.companies) {
      // Format: { companies: [...] }
      companies.push(...sourceData.companies.filter(org => this.hasFieldData(org, fieldName)));
    } else if (Array.isArray(sourceData)) {
      // Format: [...]
      companies.push(...sourceData.filter(org => this.hasFieldData(org, fieldName)));
    }
    
    return companies;
  }

  hasFieldData(organization, fieldName) {
    switch (fieldName) {
      case 'Key People':
        return organization.keyPeople || organization.executives || organization.founder;
      case 'LinkedIn URL':
        return organization.linkedin || organization.linkedIn;
      case 'Year Founded':
        return organization.founded || organization.yearFounded || organization.foundedYear;
      case 'Funding':
        return organization.funding || organization.totalFunding || organization.fundingAmount;
      case 'Employee Count':
        return organization.employeeCount || organization.employees || organization.teamSize;
      default:
        return false;
    }
  }

  async processCompanyUpdate(company, fieldName) {
    // This would integrate with Notion API to update the database
    // For now, we'll simulate the process and log what would be updated
    
    const companyName = company.name || company.organizationName || 'Unknown';
    if (this.processedCompanies.has(companyName)) return;
    
    console.log(`    🔄 Would update ${companyName}: ${fieldName}`);
    this.processedCompanies.add(companyName);
    this.enhancementResults.companiesProcessed++;
    this.enhancementResults.fieldsUpdated++;
    
    // Add small delay to simulate API calls
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  generateResultsReport() {
    const report = {
      timestamp: new Date().toISOString(),
      results: this.enhancementResults,
      nextSteps: [
        'Integrate with Notion API for actual database updates',
        'Implement data validation and deduplication',
        'Add source citation tracking',
        'Create update approval workflow',
        'Monitor completion rate improvements'
      ]
    };
    
    // Save results
    const reportPath = 'data/reports/database-enhancement-pipeline-results.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\\n📊 ENHANCEMENT PIPELINE COMPLETE');
    console.log(`📈 Companies that would be updated: ${this.enhancementResults.companiesProcessed}`);
    console.log(`🔧 Field updates that would be made: ${this.enhancementResults.fieldsUpdated}`);
    console.log(`📄 Results saved to: ${reportPath}`);
    console.log('\\n🎯 NEXT: Integrate with Notion API for actual database updates');
  }
}

// Run if called directly
if (require.main === module) {
  const pipeline = new DatabaseEnhancementPipeline();
  pipeline.run().catch(console.error);
}

module.exports = DatabaseEnhancementPipeline;