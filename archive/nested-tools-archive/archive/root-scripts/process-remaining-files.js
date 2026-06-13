#!/usr/bin/env node

/**
 * Process Remaining High-Value Research Files
 * Systematically processes unprocessed JSON files and updates database
 */

const { Client } = require('@notionhq/client');
const fs = require('fs');

const notion = new Client({ auth: 'process.env.NOTION_TOKEN' });
const databaseId = '1f0c6f799a3381bd8332ca0235c24655';

// Files to process in priority order
const TARGET_FILES = [
  'data/research/batch-15-2025-founded-companies.json',
  'data/research/batch-13-emerging-sectors.json', 
  'data/research/ocean-supercluster-bc-ai-funding.json'
];

class RemainingFileProcessor {
  constructor() {
    this.results = {
      filesProcessed: 0,
      companiesProcessed: 0,
      successful: 0,
      failed: 0,
      fieldsUpdated: 0,
      companies: [],
      errors: [],
      fileResults: {}
    };
    this.schema = {};
  }

  async execute() {
    console.log('🔄 PROCESSING REMAINING HIGH-VALUE FILES');
    console.log(`📁 Target files: ${TARGET_FILES.length}`);
    
    // Get database schema
    this.schema = await this.getDatabaseSchema();
    
    // Process each file
    for (const filePath of TARGET_FILES) {
      if (fs.existsSync(filePath)) {
        console.log(`\\n📄 Processing: ${filePath.split('/').pop()}`);
        await this.processFile(filePath);
      } else {
        console.log(`\\n⚠️  File not found: ${filePath}`);
      }
    }
    
    // Generate results
    this.generateResults();
    return this.results;
  }

  async getDatabaseSchema() {
    const db = await notion.databases.retrieve({ database_id: databaseId });
    const schema = {};
    Object.entries(db.properties).forEach(([name, prop]) => {
      schema[name] = prop.type;
    });
    return schema;
  }

  async processFile(filePath) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const fileName = filePath.split('/').pop();
      
      let companies = [];
      
      // Extract companies based on file structure
      if (data.organizations) {
        companies = data.organizations;
        console.log(`   📊 Found ${companies.length} organizations`);
      } else if (Array.isArray(data)) {
        companies = data;
        console.log(`   📊 Found ${companies.length} items`);
      } else {
        console.log(`   ❌ Unknown file structure for ${fileName}`);
        return;
      }
      
      // Process each company
      let fileSuccessful = 0;
      let fileFailed = 0;
      
      for (const company of companies) {
        const result = await this.processCompany(company, fileName);
        if (result.success) {
          fileSuccessful++;
          this.results.successful++;
        } else {
          fileFailed++;
          this.results.failed++;
        }
        this.results.companiesProcessed++;
      }
      
      this.results.filesProcessed++;
      this.results.fileResults[fileName] = {
        totalCompanies: companies.length,
        successful: fileSuccessful,
        failed: fileFailed,
        successRate: `${Math.round((fileSuccessful / companies.length) * 100)}%`
      };
      
      console.log(`   ✅ ${fileSuccessful} successful, ${fileFailed} failed`);
      
    } catch (error) {
      console.log(`   ❌ Error processing file: ${error.message}`);
      this.results.errors.push({
        file: filePath,
        error: error.message
      });
    }
  }

  async processCompany(companyData, sourceFile) {
    try {
      const companyName = companyData.name;
      if (!companyName) {
        return { success: false, reason: 'No company name' };
      }
      
      // Find company in database
      const dbCompany = await this.findCompany(companyName);
      if (!dbCompany) {
        return { success: false, reason: 'Not found in database' };
      }
      
      // Extract updates based on data structure
      const updates = this.extractUpdates(companyData);
      if (Object.keys(updates).length === 0) {
        return { success: false, reason: 'No valid updates extracted' };
      }
      
      // Update database
      await notion.pages.update({
        page_id: dbCompany.id,
        properties: updates
      });
      
      console.log(`     ✅ ${companyName}: ${Object.keys(updates).join(', ')}`);
      
      this.results.fieldsUpdated += Object.keys(updates).length;
      this.results.companies.push({
        name: companyName,
        fieldsUpdated: Object.keys(updates),
        source: sourceFile
      });
      
      return { success: true };
      
    } catch (error) {
      console.log(`     ❌ ${companyData.name || 'Unknown'}: ${error.message}`);
      this.results.errors.push({
        company: companyData.name || 'Unknown',
        error: error.message,
        source: sourceFile
      });
      return { success: false, reason: error.message };
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
      page_size: 3
    });
    
    return response.results.find(page => {
      const title = page.properties.Name?.title?.[0]?.text?.content || '';
      return title.toLowerCase().includes(searchName.toLowerCase());
    }) || response.results[0];
  }

  extractUpdates(company) {
    const updates = {};
    
    // Key People
    if (company.keyPeople) {
      updates['Key People'] = {
        rich_text: [{ text: { content: company.keyPeople.toString().slice(0, 2000) } }]
      };
    }
    
    // Funding
    if (company.funding) {
      let fundingText = '';
      if (typeof company.funding === 'object') {
        if (company.funding.amount) {
          fundingText = company.funding.amount;
          if (company.funding.date) fundingText += ` (${company.funding.date})`;
          if (company.funding.investors) fundingText += ` - ${company.funding.investors}`;
        }
      } else {
        fundingText = company.funding.toString();
      }
      
      if (fundingText) {
        updates['Funding'] = {
          rich_text: [{ text: { content: fundingText.slice(0, 2000) } }]
        };
      }
    }
    
    // Employee Count
    if (company.employeeCount) {
      let empText = '';
      if (typeof company.employeeCount === 'object') {
        empText = company.employeeCount.count || company.employeeCount.toString();
      } else {
        empText = company.employeeCount.toString();
      }
      
      updates['Employee Count'] = {
        rich_text: [{ text: { content: empText.slice(0, 2000) } }]
      };
    }
    
    // Revenue
    if (company.revenue) {
      let revText = '';
      if (typeof company.revenue === 'object') {
        revText = company.revenue.amount || company.revenue.toString();
      } else {
        revText = company.revenue.toString();
      }
      
      updates['Revenue'] = {
        rich_text: [{ text: { content: revText.slice(0, 2000) } }]
      };
    }
    
    // Valuation
    if (company.valuation || company.marketCap) {
      const valText = company.valuation || company.marketCap;
      updates['Valuation'] = {
        rich_text: [{ text: { content: valText.toString().slice(0, 2000) } }]
      };
    }
    
    // LinkedIn
    if (company.linkedin && this.isValidUrl(company.linkedin)) {
      updates['LinkedIn'] = { url: company.linkedin };
    }
    
    // Website
    if (company.website && this.isValidUrl(company.website)) {
      updates['Website'] = { url: company.website };
    }
    
    // Year Founded
    if (company.founded || company.yearFounded) {
      const year = parseInt(company.founded || company.yearFounded);
      if (year && year > 1900 && year <= 2025) {
        updates['Year Founded'] = { number: year };
      }
    }
    
    // Notable Projects
    if (company.products || company.notableProjects) {
      const projects = company.products || company.notableProjects;
      updates['Notable Projects'] = {
        rich_text: [{ text: { content: projects.toString().slice(0, 2000) } }]
      };
    }
    
    return updates;
  }

  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  generateResults() {
    const report = {
      timestamp: new Date().toISOString(),
      execution: 'REMAINING_FILES_PROCESSING',
      summary: {
        filesProcessed: this.results.filesProcessed,
        companiesProcessed: this.results.companiesProcessed,
        successful: this.results.successful,
        failed: this.results.failed,
        totalFieldsUpdated: this.results.fieldsUpdated,
        successRate: `${Math.round((this.results.successful / this.results.companiesProcessed) * 100)}%`
      },
      fileResults: this.results.fileResults,
      companiesUpdated: this.results.companies.slice(0, 30), // First 30
      totalCompaniesUpdated: this.results.companies.length,
      errors: this.results.errors.slice(0, 15) // First 15 errors
    };
    
    const reportPath = 'data/reports/remaining-files-processing-results.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\\n📊 REMAINING FILES PROCESSING COMPLETE');
    console.log(`📁 Files processed: ${this.results.filesProcessed}`);
    console.log(`✅ Companies enhanced: ${this.results.successful}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`🔧 Total fields updated: ${this.results.fieldsUpdated}`);
    console.log(`📈 Success rate: ${report.summary.successRate}`);
    console.log(`📄 Results: ${reportPath}`);
  }
}

// Execute
const processor = new RemainingFileProcessor();
processor.execute().catch(console.error);