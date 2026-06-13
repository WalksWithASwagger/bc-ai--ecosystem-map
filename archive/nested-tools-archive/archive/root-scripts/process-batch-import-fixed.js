#!/usr/bin/env node

/**
 * Process organizations-batch-import-2025-07-30.json (FIXED VERSION)
 * Extract and update 85 organizations with correct schema mapping
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
    this.schema = {};
  }

  async execute() {
    console.log('🔄 PROCESSING BATCH IMPORT ORGANIZATIONS (FIXED)');
    
    // Get schema first
    await this.getSchema();
    
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
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    
    this.generateResults();
    return this.results;
  }

  async getSchema() {
    try {
      const db = await notion.databases.retrieve({ database_id: databaseId });
      Object.entries(db.properties).forEach(([name, prop]) => {
        this.schema[name] = prop.type;
      });
      console.log('📋 Schema loaded:', Object.keys(this.schema).length, 'properties');
    } catch (error) {
      console.error('Error getting schema:', error.message);
    }
  }

  async processOrganization(org) {
    try {
      // Find organization in database
      const dbCompany = await this.findCompany(org.name);
      if (!dbCompany) {
        return { success: false, reason: 'Not found in database' };
      }
      
      // Extract updates with correct schema
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
    
    // BC Region - using correct select format
    if (org.bc_region && org.bc_region !== 'To be verified' && this.schema['BC Region'] === 'select') {
      updates['BC Region'] = {
        select: { name: org.bc_region }
      };
    }
    
    // AI Focus Areas - using correct multi_select format
    if (org.focus && this.schema['AI Focus Areas'] === 'multi_select') {
      // Parse focus into multiple options
      const focusAreas = this.parseFocusAreas(org.focus);
      if (focusAreas.length > 0) {
        updates['AI Focus Areas'] = {
          multi_select: focusAreas.map(area => ({ name: area }))
        };
      }
    }
    
    // Funding (if provided)
    if (org.funding && this.schema['Funding']) {
      updates['Funding'] = {
        rich_text: [{ text: { content: org.funding } }]
      };
    }
    
    // Category (map to proper format)
    if (org.category && this.schema['Category'] === 'select') {
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
    
    // Short Blurb (description)
    if (org.description && this.schema['Short Blurb']) {
      let description = org.description;
      
      // Add status if relevant
      if (org.status && org.status !== 'Active') {
        description += ` (Status: ${org.status})`;
      }
      
      // Add location if different from BC region
      if (org.location && org.location !== org.bc_region) {
        description += ` - Located in ${org.location}`;
      }
      
      updates['Short Blurb'] = {
        rich_text: [{ text: { content: description.slice(0, 2000) } }]
      };
    }
    
    return updates;
  }

  parseFocusAreas(focus) {
    // Convert focus description to relevant AI focus areas
    const focusMap = {
      'quantum': ['Quantum Computing'],
      'marine': ['Agriculture & Environment', 'IoT & Sensors'],
      'robotics': ['Robotics & Automation'],
      'ai technology': ['Machine Learning', 'AI Research'],
      'drug discovery': ['Healthcare & Life Sciences'],
      'autonomous': ['Autonomous Systems', 'Robotics & Automation'],
      'productivity': ['Business Intelligence', 'Productivity Tools'],
      'education': ['Education & Training'],
      'government': ['Government & Public Services'],
      'climate': ['Agriculture & Environment'],
      'cybersecurity': ['Security & Privacy'],
      'finance': ['Financial Services'],
      'investment': ['Financial Services'],
      'healthcare': ['Healthcare & Life Sciences'],
      'biotech': ['Healthcare & Life Sciences'],
      'aerospace': ['Transportation & Logistics'],
      'data': ['Data Science & Analytics'],
      'research': ['AI Research']
    };
    
    const focusLower = focus.toLowerCase();
    const areas = [];
    
    for (const [keyword, mappedAreas] of Object.entries(focusMap)) {
      if (focusLower.includes(keyword)) {
        areas.push(...mappedAreas);
      }
    }
    
    // Remove duplicates and limit to 3 areas
    return [...new Set(areas)].slice(0, 3);
  }

  generateResults() {
    const report = {
      timestamp: new Date().toISOString(),
      execution: 'BATCH_IMPORT_ORGANIZATIONS_PROCESSING_FIXED',
      summary: {
        processed: this.results.processed,
        successful: this.results.successful,
        failed: this.results.failed,
        totalFieldsUpdated: this.results.fieldsUpdated,
        successRate: `${Math.round((this.results.successful / this.results.processed) * 100)}%`
      },
      companiesUpdated: this.results.companies,
      errors: this.results.errors.slice(0, 20)
    };
    
    const reportPath = 'data/reports/batch-import-fixed-processing-results.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\\n📊 BATCH IMPORT PROCESSING COMPLETE (FIXED)');
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