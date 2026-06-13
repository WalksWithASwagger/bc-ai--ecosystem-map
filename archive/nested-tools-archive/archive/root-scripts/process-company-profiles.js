#!/usr/bin/env node

/**
 * Process comprehensive-company-profiles.md
 * Extract detailed company profile data from markdown format
 */

const { Client } = require('@notionhq/client');
const fs = require('fs');

const notion = new Client({ auth: 'process.env.NOTION_TOKEN' });
const databaseId = '1f0c6f799a3381bd8332ca0235c24655';

class CompanyProfilesProcessor {
  constructor() {
    this.results = {
      processed: 0,
      successful: 0,
      failed: 0,
      fieldsUpdated: 0,
      companies: [],
      errors: []
    };
  }

  async execute() {
    console.log('🔄 PROCESSING COMPREHENSIVE COMPANY PROFILES');
    
    // Read and parse the markdown file
    const content = fs.readFileSync('data/discoveries/2025-07-29_comprehensive-company-profiles.md', 'utf8');
    const companies = this.parseCompanyProfiles(content);
    
    console.log(`📊 Found ${companies.length} detailed company profiles`);
    
    // Process each company
    for (const company of companies) {
      console.log(`\\n📄 Processing: ${company.name}`);
      const result = await this.processCompany(company);
      
      this.results.processed++;
      if (result.success) {
        this.results.successful++;
        this.results.fieldsUpdated += result.fieldsUpdated || 0;
        console.log(`   ✅ Enhanced with ${result.fieldsUpdated} fields`);
      } else {
        this.results.failed++;
        console.log(`   ❌ Failed: ${result.reason}`);
        this.results.errors.push({
          name: company.name,
          error: result.reason
        });
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    this.generateResults();
    return this.results;
  }

  parseCompanyProfiles(content) {
    const companies = [];
    
    // Split by company sections (marked by #### headings)
    const sections = content.split(/####\s+\d+\.\s+/);
    
    for (let i = 1; i < sections.length; i++) {
      const section = sections[i];
      const company = this.parseCompanySection(section);
      if (company.name) {
        companies.push(company);
      }
    }
    
    return companies;
  }

  parseCompanySection(section) {
    const lines = section.split('\\n');
    const company = {};
    
    // Extract company name from first line
    const nameLine = lines[0];
    if (nameLine.includes('(')) {
      company.name = nameLine.split('(')[0].trim();
      company.legalName = nameLine.match(/\\(([^)]+)\\)/)?.[1];
    } else {
      company.name = nameLine.trim();
    }
    
    // Parse key-value pairs
    for (const line of lines) {
      if (line.includes('**Website:**')) {
        company.website = this.extractValue(line);
      } else if (line.includes('**LinkedIn:**')) {
        company.linkedin = this.extractValue(line);
      } else if (line.includes('**Founded:**')) {
        company.founded = this.extractValue(line);
      } else if (line.includes('**Employee Count:**')) {
        company.employeeCount = this.extractValue(line);
      } else if (line.includes('**Latest Funding:**') || line.includes('**Total Funding:**')) {
        company.funding = this.extractValue(line);
      } else if (line.includes('**Valuation:**')) {
        company.valuation = this.extractValue(line);
      } else if (line.includes('**Annual Recurring Revenue:**')) {
        company.revenue = this.extractValue(line);
      } else if (line.includes('**Industry:**')) {
        company.industry = this.extractValue(line);
      } else if (line.includes('**Headquarters:**')) {
        company.headquarters = this.extractValue(line);
      } else if (line.includes('**Phone:**')) {
        company.phone = this.extractValue(line);
      } else if (line.includes('**Contact:**')) {
        company.contact = this.extractValue(line);
      } else if (line.includes('**Mission:**')) {
        company.mission = this.extractValue(line);
      } else if (line.includes('**Description:**')) {
        company.description = this.extractValue(line);
      }
      
      // Extract key people section
      if (line.includes('**Leadership Team:**') || line.includes('**Founders:**')) {
        const keyPeopleStart = lines.indexOf(line);
        const keyPeople = [];
        for (let j = keyPeopleStart + 1; j < lines.length; j++) {
          const peopleLine = lines[j];
          if (peopleLine.trim().startsWith('-') && peopleLine.includes(' - ')) {
            keyPeople.push(peopleLine.trim().substring(1).trim());
          } else if (peopleLine.trim().startsWith('**') || peopleLine.trim() === '') {
            break;
          }
        }
        if (keyPeople.length > 0) {
          company.keyPeople = keyPeople.join('; ');
        }
      }
    }
    
    return company;
  }

  extractValue(line) {
    const match = line.match(/\\*\\*[^:]+:\\*\\*\\s*(.+)/);
    return match ? match[1].trim() : '';
  }

  async processCompany(company) {
    try {
      // Find company in database
      const dbCompany = await this.findCompany(company.name);
      if (!dbCompany) {
        return { success: false, reason: 'Not found in database' };
      }
      
      // Extract updates
      const updates = this.extractUpdates(company);
      if (Object.keys(updates).length === 0) {
        return { success: false, reason: 'No updates needed' };
      }
      
      // Update database
      await notion.pages.update({
        page_id: dbCompany.id,
        properties: updates
      });
      
      this.results.companies.push({
        name: company.name,
        fieldsUpdated: Object.keys(updates),
        source: 'comprehensive-company-profiles'
      });
      
      return { 
        success: true, 
        fieldsUpdated: Object.keys(updates).length 
      };
      
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  async findCompany(searchName) {
    try {
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
      
      // Find exact or best match
      return response.results.find(page => {
        const title = page.properties.Name?.title?.[0]?.text?.content || '';
        return title.toLowerCase().includes(searchName.toLowerCase()) ||
               searchName.toLowerCase().includes(title.toLowerCase());
      }) || response.results[0];
      
    } catch (error) {
      console.error(`Error finding company ${searchName}:`, error.message);
      return null;
    }
  }

  extractUpdates(company) {
    const updates = {};
    
    // Website URL
    if (company.website && this.isValidUrl(company.website)) {
      updates['Website'] = { url: company.website };
    }
    
    // LinkedIn URL
    if (company.linkedin && this.isValidUrl(company.linkedin)) {
      updates['LinkedIn'] = { url: company.linkedin };
    }
    
    // Year Founded
    if (company.founded) {
      const year = parseInt(company.founded);
      if (year && year > 1900 && year <= 2025) {
        updates['Year Founded'] = { number: year };
      }
    }
    
    // Key People
    if (company.keyPeople) {
      updates['Key People'] = {
        rich_text: [{ text: { content: company.keyPeople.slice(0, 2000) } }]
      };
    }
    
    // Employee Count
    if (company.employeeCount) {
      updates['Employee Count'] = {
        rich_text: [{ text: { content: company.employeeCount } }]
      };
    }
    
    // Funding
    if (company.funding) {
      updates['Funding'] = {
        rich_text: [{ text: { content: company.funding.slice(0, 2000) } }]
      };
    }
    
    // Valuation
    if (company.valuation) {
      updates['Valuation'] = {
        rich_text: [{ text: { content: company.valuation } }]
      };
    }
    
    // Revenue
    if (company.revenue) {
      updates['Revenue'] = {
        rich_text: [{ text: { content: company.revenue } }]
      };
    }
    
    // Phone
    if (company.phone) {
      updates['Phone'] = {
        rich_text: [{ text: { content: company.phone } }]
      };
    }
    
    // Primary Contact (from contact field)
    if (company.contact) {
      updates['Primary Contact'] = {
        rich_text: [{ text: { content: company.contact } }]
      };
    }
    
    // Short Blurb (from description or mission)
    const blurb = company.description || company.mission;
    if (blurb) {
      updates['Short Blurb'] = {
        rich_text: [{ text: { content: blurb.slice(0, 2000) } }]
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
      execution: 'COMPANY_PROFILES_PROCESSING',
      summary: {
        processed: this.results.processed,
        successful: this.results.successful,
        failed: this.results.failed,
        totalFieldsUpdated: this.results.fieldsUpdated,
        successRate: `${Math.round((this.results.successful / this.results.processed) * 100)}%`
      },
      companiesUpdated: this.results.companies,
      errors: this.results.errors
    };
    
    const reportPath = 'data/reports/company-profiles-processing-results.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\\n📊 COMPANY PROFILES PROCESSING COMPLETE');
    console.log(`✅ Companies enhanced: ${this.results.successful}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`🔧 Total fields updated: ${this.results.fieldsUpdated}`);
    console.log(`📈 Success rate: ${report.summary.successRate}`);
    console.log(`📄 Results: ${reportPath}`);
  }
}

// Execute
const processor = new CompanyProfilesProcessor();
processor.execute().catch(console.error);