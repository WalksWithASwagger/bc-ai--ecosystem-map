#!/usr/bin/env node

/**
 * Process ALL Remaining JSON Research Files
 * Systematically processes every remaining JSON file and updates database
 */

const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

const notion = new Client({ auth: 'process.env.NOTION_TOKEN' });
const databaseId = '1f0c6f799a3381bd8332ca0235c24655';

class AllRemainingProcessor {
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
    console.log('🔄 PROCESSING ALL REMAINING JSON FILES');
    
    // Get database schema
    this.schema = await this.getDatabaseSchema();
    
    // Find all remaining JSON files
    const remainingFiles = this.findAllJsonFiles('data/research/');
    console.log(`📁 Found ${remainingFiles.length} JSON files to process`);
    
    // Process each file
    for (const filePath of remainingFiles) {
      console.log(`\\n📄 Processing: ${path.basename(filePath)}`);
      await this.processFile(filePath);
    }
    
    // Generate results
    this.generateResults();
    return this.results;
  }

  findAllJsonFiles(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'processed') {
        files.push(...this.findAllJsonFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        files.push(fullPath);
      }
    }
    
    return files;
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
      const fileName = path.basename(filePath);
      
      let companies = [];
      
      // Extract companies based on various file structures
      if (data.organizations) {
        companies = data.organizations;
      } else if (data.companies) {
        companies = data.companies;
      } else if (Array.isArray(data)) {
        companies = data;
      } else if (data.results) {
        companies = data.results;
      } else {
        console.log(`   ❌ Unknown structure: ${fileName}`);
        return;
      }
      
      console.log(`   📊 Found ${companies.length} items`);
      
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
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
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
      // Extract company name from various possible fields
      const companyName = companyData.name || companyData.organizationName || companyData.company || companyData.title;
      if (!companyName) {
        return { success: false, reason: 'No company name found' };
      }
      
      // Find company in database
      const dbCompany = await this.findCompany(companyName);
      if (!dbCompany) {
        return { success: false, reason: 'Not found in database' };
      }
      
      // Extract updates with comprehensive field mapping
      const updates = this.extractAllPossibleUpdates(companyData);
      if (Object.keys(updates).length === 0) {
        return { success: false, reason: 'No valid updates extracted' };
      }
      
      // Update database
      await notion.pages.update({
        page_id: dbCompany.id,
        properties: updates
      });
      
      this.results.fieldsUpdated += Object.keys(updates).length;
      this.results.companies.push({
        name: companyName,
        fieldsUpdated: Object.keys(updates),
        source: sourceFile
      });
      
      return { success: true };
      
    } catch (error) {
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

  extractAllPossibleUpdates(company) {
    const updates = {};
    
    // Key People - comprehensive extraction
    const keyPeopleFields = [
      'keyPeople', 'key_people', 'executives', 'founders', 'leadership', 
      'team', 'people', 'founder', 'ceo', 'management'
    ];
    
    for (const field of keyPeopleFields) {
      if (company[field]) {
        let peopleText = '';
        if (typeof company[field] === 'object') {
          peopleText = company[field].people || company[field].executives || JSON.stringify(company[field]);
        } else {
          peopleText = company[field].toString();
        }
        
        if (peopleText && peopleText.length > 5) {
          updates['Key People'] = {
            rich_text: [{ text: { content: peopleText.slice(0, 2000) } }]
          };
          break;
        }
      }
    }
    
    // Funding - comprehensive extraction
    const fundingFields = [
      'funding', 'totalFunding', 'investment', 'raised', 'capital', 
      'financials', 'valuation', 'marketCap'
    ];
    
    for (const field of fundingFields) {
      if (company[field]) {
        let fundingText = '';
        if (typeof company[field] === 'object') {
          if (company[field].amount) {
            fundingText = company[field].amount;
            if (company[field].date) fundingText += ` (${company[field].date})`;
            if (company[field].investors) fundingText += ` - ${company[field].investors}`;
          } else {
            fundingText = JSON.stringify(company[field]);
          }
        } else {
          fundingText = company[field].toString();
        }
        
        if (fundingText && fundingText.length > 3) {
          updates['Funding'] = {
            rich_text: [{ text: { content: fundingText.slice(0, 2000) } }]
          };
          break;
        }
      }
    }
    
    // Employee Count
    const empFields = ['employeeCount', 'employees', 'teamSize', 'staff', 'headcount'];
    for (const field of empFields) {
      if (company[field]) {
        let empText = typeof company[field] === 'object' 
          ? (company[field].count || company[field].current || JSON.stringify(company[field]))
          : company[field].toString();
        
        if (empText) {
          updates['Employee Count'] = {
            rich_text: [{ text: { content: empText.slice(0, 2000) } }]
          };
          break;
        }
      }
    }
    
    // Revenue
    const revenueFields = ['revenue', 'sales', 'income', 'earnings', 'arr', 'mrr'];
    for (const field of revenueFields) {
      if (company[field]) {
        let revText = typeof company[field] === 'object'
          ? (company[field].amount || company[field].annual || JSON.stringify(company[field]))
          : company[field].toString();
        
        if (revText) {
          updates['Revenue'] = {
            rich_text: [{ text: { content: revText.slice(0, 2000) } }]
          };
          break;
        }
      }
    }
    
    // Valuation
    if (company.valuation || company.marketCap || company.worth) {
      const valText = (company.valuation || company.marketCap || company.worth).toString();
      updates['Valuation'] = {
        rich_text: [{ text: { content: valText.slice(0, 2000) } }]
      };
    }
    
    // URLs
    if (company.linkedin && this.isValidUrl(company.linkedin)) {
      updates['LinkedIn'] = { url: company.linkedin };
    }
    if (company.website && this.isValidUrl(company.website)) {
      updates['Website'] = { url: company.website };
    }
    
    // Year Founded
    const foundingFields = ['founded', 'yearFounded', 'establishedYear', 'startYear'];
    for (const field of foundingFields) {
      if (company[field]) {
        const year = parseInt(company[field]);
        if (year && year > 1900 && year <= 2025) {
          updates['Year Founded'] = { number: year };
          break;
        }
      }
    }
    
    // Notable Projects
    const projectFields = ['products', 'services', 'solutions', 'notableProjects', 'offerings'];
    for (const field of projectFields) {
      if (company[field]) {
        const projectText = company[field].toString();
        if (projectText.length > 10) {
          updates['Notable Projects'] = {
            rich_text: [{ text: { content: projectText.slice(0, 2000) } }]
          };
          break;
        }
      }
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
      execution: 'ALL_REMAINING_FILES_PROCESSING',
      summary: {
        filesProcessed: this.results.filesProcessed,
        companiesProcessed: this.results.companiesProcessed,
        successful: this.results.successful,
        failed: this.results.failed,
        totalFieldsUpdated: this.results.fieldsUpdated,
        successRate: `${Math.round((this.results.successful / this.results.companiesProcessed) * 100)}%`
      },
      fileResults: this.results.fileResults,
      companiesUpdated: this.results.companies.slice(0, 50),
      totalCompaniesUpdated: this.results.companies.length,
      errors: this.results.errors.slice(0, 20)
    };
    
    const reportPath = 'data/reports/all-remaining-files-processing-results.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\\n📊 ALL REMAINING FILES PROCESSING COMPLETE');
    console.log(`📁 Files processed: ${this.results.filesProcessed}`);
    console.log(`✅ Companies enhanced: ${this.results.successful}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`🔧 Total fields updated: ${this.results.fieldsUpdated}`);
    console.log(`📈 Success rate: ${report.summary.successRate}`);
    console.log(`📄 Results: ${reportPath}`);
  }
}

// Execute
const processor = new AllRemainingProcessor();
processor.execute().catch(console.error);