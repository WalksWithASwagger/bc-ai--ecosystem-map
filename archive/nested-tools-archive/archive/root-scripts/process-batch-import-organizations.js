#!/usr/bin/env node

/**
 * Process organizations-batch-import-2025-07-30.json
 * Extract and update 85 organizations with rich metadata
 */

const { Client } = require('@notionhq/client');
const fs = require('fs');

const notion = new Client({ auth: 'process.env.NOTION_TOKEN' });
const databaseId = '1f0c6f799a3381bd8332ca0235c24655';

class BatchImportProcessor {
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
    console.log('🔄 PROCESSING BATCH IMPORT ORGANIZATIONS');
    
    // Load the batch import data
    const data = JSON.parse(fs.readFileSync('data/imports/organizations-batch-import-2025-07-30.json', 'utf8'));
    console.log(`📊 Found ${data.organizations.length} organizations to process`);
    
    // Process each organization
    for (const org of data.organizations) {
      console.log(`\\n📄 Processing: ${org.name}`);
      const result = await this.processOrganization(org);
      
      this.results.processed++;
      if (result.success) {
        this.results.successful++;
        this.results.fieldsUpdated += result.fieldsUpdated || 0;
        console.log(`   ✅ Enhanced with ${result.fieldsUpdated} fields`);
      } else {
        this.results.failed++;
        console.log(`   ❌ Failed: ${result.reason}`);
        this.results.errors.push({
          name: org.name,
          error: result.reason
        });
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    this.generateResults();
    return this.results;
  }

  async processOrganization(org) {
    try {
      // Find organization in database
      const dbCompany = await this.findCompany(org.name);
      if (!dbCompany) {
        return { success: false, reason: 'Not found in database' };
      }
      
      // Extract updates
      const updates = this.extractUpdates(org);
      if (Object.keys(updates).length === 0) {
        return { success: false, reason: 'No updates needed' };
      }
      
      // Update database
      await notion.pages.update({
        page_id: dbCompany.id,
        properties: updates
      });
      
      this.results.companies.push({
        name: org.name,
        fieldsUpdated: Object.keys(updates),
        source: 'batch-import-2025-07-30'
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

  extractUpdates(org) {
    const updates = {};
    
    // BC Region
    if (org.bc_region && org.bc_region !== 'To be verified') {
      updates['BC Region'] = {
        select: { name: org.bc_region }
      };
    }
    
    // AI Focus Areas (from focus field)
    if (org.focus) {
      updates['AI Focus Areas'] = {
        rich_text: [{ text: { content: org.focus } }]
      };
    }
    
    // Funding (if provided)
    if (org.funding) {
      updates['Funding'] = {
        rich_text: [{ text: { content: org.funding } }]
      };
    }
    
    // Category (map to proper format)
    if (org.category) {
      const categoryMap = {
        'Start-ups & Scale-ups': 'Company',
        'Government & Public Sector': 'Government',
        'Academic & Research': 'Academic',
        'Enterprise & Corporate': 'Company',
        'Infrastructure': 'Infrastructure',
        'Investment & Accelerators': 'Investor',
        'Community & Associations': 'Community',
        'Specialized AI': 'Company',
        'Platforms & SaaS': 'Company'
      };
      
      const mappedCategory = categoryMap[org.category] || 'Company';
      updates['Category'] = {
        select: { name: mappedCategory }
      };
    }
    
    // Description 
    if (org.description) {
      updates['Short Blurb'] = {
        rich_text: [{ text: { content: org.description } }]
      };
    }
    
    // Status notes
    if (org.status && org.status !== 'Active') {
      const existingDesc = org.description || '';
      const statusNote = existingDesc ? `${existingDesc} (Status: ${org.status})` : `Status: ${org.status}`;
      updates['Short Blurb'] = {
        rich_text: [{ text: { content: statusNote } }]
      };
    }
    
    // Location (if specific)
    if (org.location && org.location !== org.bc_region) {
      updates['Location'] = {
        rich_text: [{ text: { content: org.location } }]
      };
    }
    
    return updates;
  }

  generateResults() {
    const report = {
      timestamp: new Date().toISOString(),
      execution: 'BATCH_IMPORT_ORGANIZATIONS_PROCESSING',
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
    
    const reportPath = 'data/reports/batch-import-processing-results.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\\n📊 BATCH IMPORT PROCESSING COMPLETE');
    console.log(`✅ Companies enhanced: ${this.results.successful}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`🔧 Total fields updated: ${this.results.fieldsUpdated}`);
    console.log(`📈 Success rate: ${report.summary.successRate}`);
    console.log(`📄 Results: ${reportPath}`);
  }
}

// Execute
const processor = new BatchImportProcessor();
processor.execute().catch(console.error);