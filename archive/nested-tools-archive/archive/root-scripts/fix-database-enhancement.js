#!/usr/bin/env node

/**
 * FIXED BC AI Ecosystem Database Enhancement
 * Updates Notion database with correct property mappings
 */

const { Client } = require('@notionhq/client');
const fs = require('fs');

const notion = new Client({ auth: 'process.env.NOTION_TOKEN' });
const databaseId = '1f0c6f799a3381bd8332ca0235c24655';

// Priority companies with rich data - using correct property names
const PRIORITY_COMPANIES = [
  {
    name: "Aspect Biosystems",
    updates: {
      "Key People": "Tamer G. Mohamed (CEO, Co-founder), Sam Wadsworth (CSO), Kira Pusch (VP Operations)",
      "Funding": "$115M Series B + $53.4M government grant (January 2025) - Dimension (lead), Novo Nordisk, Radical Ventures",
      "Employee Count": "110-116 employees (July 2025)",
      "Valuation": "Approaching unicorn status (~$800M-1B estimated)"
    },
    source: "financial-people-intelligence-batch.json"
  },
  {
    name: "Hootsuite",
    updates: {
      "Key People": "Irina Novoselsky (CEO), Ryan Holmes (Founder), Tom Keiser (COO)",
      "Revenue": "$350M annually, 20% YoY growth (2024)",
      "Employee Count": "1,722 employees (July 2025)",
      "Valuation": "$1B (Unicorn status achieved 2014)"
    },
    source: "financial-people-intelligence-batch.json"
  }
];

class FixedDatabaseEnhancer {
  constructor() {
    this.results = {
      successful: 0,
      failed: 0,
      fieldsUpdated: 0,
      companies: [],
      errors: []
    };
  }

  async execute() {
    console.log('🔧 EXECUTING FIXED BC AI ECOSYSTEM DATABASE ENHANCEMENT');
    console.log('📊 Using corrected property mappings based on actual schema');
    
    // First, get the actual database schema
    console.log('\\n🗄️  Checking database schema...');
    const schema = await this.getDatabaseSchema();
    
    // Process companies with corrected mapping
    for (const company of PRIORITY_COMPANIES) {
      console.log(`\\n🔄 Processing: ${company.name}`);
      await this.enhanceCompanyWithCorrectSchema(company, schema);
    }
    
    this.generateResults();
    return this.results;
  }

  async getDatabaseSchema() {
    try {
      const db = await notion.databases.retrieve({ database_id: databaseId });
      console.log('   Available properties:');
      
      const schema = {};
      Object.entries(db.properties).forEach(([name, prop]) => {
        console.log(`     ${name}: ${prop.type}`);
        schema[name] = prop.type;
      });
      
      return schema;
    } catch (error) {
      console.error('   ❌ Error getting schema:', error.message);
      return {};
    }
  }

  async enhanceCompanyWithCorrectSchema(companyData, schema) {
    try {
      // Find the company
      const company = await this.findCompany(companyData.name);
      if (!company) {
        console.log(`  ⚠️  Company not found: ${companyData.name}`);
        this.results.failed++;
        return;
      }
      
      console.log(`  ✅ Found company: ${company.id.slice(0, 8)}...`);
      
      // Prepare updates with correct property names and types
      const updates = this.prepareCorrectUpdates(companyData.updates, schema);
      
      if (Object.keys(updates).length === 0) {
        console.log(`  ⚠️  No valid updates prepared for ${companyData.name}`);
        this.results.failed++;
        return;
      }
      
      console.log(`  📝 Preparing ${Object.keys(updates).length} field updates`);
      
      // Execute update
      await notion.pages.update({
        page_id: company.id,
        properties: updates
      });
      
      console.log(`  🎉 Successfully updated ${Object.keys(updates).length} fields`);
      
      this.results.successful++;
      this.results.fieldsUpdated += Object.keys(updates).length;
      this.results.companies.push({
        name: companyData.name,
        pageId: company.id,
        fieldsUpdated: Object.keys(updates),
        source: companyData.source
      });
      
    } catch (error) {
      console.log(`  ❌ Error updating ${companyData.name}: ${error.message}`);
      this.results.failed++;
      this.results.errors.push({
        company: companyData.name,
        error: error.message
      });
    }
  }

  async findCompany(searchName) {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Name',
        title: {
          contains: searchName
        }
      },
      page_size: 5
    });
    
    return response.results.find(page => {
      const title = page.properties.Name?.title?.[0]?.text?.content || '';
      return title.toLowerCase().includes(searchName.toLowerCase());
    }) || response.results[0];
  }

  prepareCorrectUpdates(updates, schema) {
    const notionUpdates = {};
    
    for (const [field, value] of Object.entries(updates)) {
      // Skip if property doesn't exist in schema
      if (!schema[field]) {
        console.log(`    ⚠️  Property "${field}" not found in schema`);
        continue;
      }
      
      const propertyType = schema[field];
      console.log(`    ✓ Mapping "${field}" (${propertyType}): ${value.slice(0, 50)}...`);
      
      switch (propertyType) {
        case 'rich_text':
          notionUpdates[field] = {
            rich_text: [{ text: { content: value } }]
          };
          break;
        case 'url':
          if (this.isValidUrl(value)) {
            notionUpdates[field] = { url: value };
          }
          break;
        case 'select':
          // For select fields, we'd need to know the valid options
          console.log(`    ⚠️  Skipping select field "${field}" - needs valid option`);
          break;
        case 'number':
          const num = this.extractNumber(value);
          if (num !== null) {
            notionUpdates[field] = { number: num };
          }
          break;
        default:
          console.log(`    ⚠️  Unknown property type: ${propertyType}`);
      }
    }
    
    return notionUpdates;
  }

  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  extractNumber(value) {
    const match = value.match(/\\d+/);
    return match ? parseInt(match[0]) : null;
  }

  generateResults() {
    const report = {
      timestamp: new Date().toISOString(),
      execution: 'FIXED_DATABASE_ENHANCEMENT',
      summary: {
        companiesProcessed: PRIORITY_COMPANIES.length,
        successful: this.results.successful,
        failed: this.results.failed,
        totalFieldsUpdated: this.results.fieldsUpdated,
        successRate: `${Math.round((this.results.successful / PRIORITY_COMPANIES.length) * 100)}%`
      },
      companiesUpdated: this.results.companies,
      errors: this.results.errors
    };
    
    const reportPath = 'data/reports/fixed-database-enhancement-results.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\\n📊 FIXED DATABASE ENHANCEMENT COMPLETE');
    console.log(`✅ Successfully enhanced: ${this.results.successful} companies`);
    console.log(`❌ Failed: ${this.results.failed} companies`);
    console.log(`🔧 Total fields updated: ${this.results.fieldsUpdated}`);
    console.log(`📈 Success rate: ${report.summary.successRate}`);
    console.log(`📄 Results: ${reportPath}`);
  }
}

// Execute
const enhancer = new FixedDatabaseEnhancer();
enhancer.execute().catch(console.error);