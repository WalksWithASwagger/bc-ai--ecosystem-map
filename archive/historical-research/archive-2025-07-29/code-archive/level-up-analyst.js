#!/usr/bin/env node

const { Client } = require('@notionhq/client');
require('dotenv').config();

class LevelUpAnalyst {
  constructor() {
    this.notion = new Client({ 
      auth: process.env.NOTION_TOKEN 
    });
    
    this.databaseId = process.env.NOTION_DATABASE_ID || '1f0c6f79-9a33-81bd-8332-ca0235c24655';
    
    // Priority fields to research
    this.priorityFields = [
      // Digital Presence
      { name: 'Website', property: 'Website', type: 'url' },
      { name: 'LinkedIn', property: 'LinkedIn', type: 'url' },
      { name: 'Other Socials', property: 'Contact/Links', type: 'rich_text' },
      
      // People & Contact
      { name: 'Key People', property: 'Key People', type: 'rich_text' },
      { name: 'Primary Contact', property: 'Primary Contact', type: 'rich_text' },
      { name: 'Business Email', property: 'Email', type: 'email' },
      { name: 'Main Phone', property: 'Phone', type: 'phone_number' },
      
      // Basics
      { name: 'City/Region', property: 'City/Region', type: 'rich_text' },
      { name: 'BC Region', property: 'BC Region', type: 'select' },
      { name: 'Category', property: 'Category', type: 'select' },
      { name: 'AI Focus Areas', property: 'AI Focus Areas', type: 'multi_select' },
      
      // Business Insight
      { name: 'Year Founded', property: 'Year Founded', type: 'number' },
      { name: 'Size', property: 'Size', type: 'select' },
      { name: 'Notable Projects', property: 'Notable Projects', type: 'rich_text' }
    ];
  }

  async findOrgsNeedingResearch() {
    console.log('🔍 Finding organizations that need research...\n');
    
    const orgsNeedingWork = [];
    let hasMore = true;
    let startCursor = undefined;

    while (hasMore) {
      const response = await this.notion.databases.query({
        database_id: this.databaseId,
        start_cursor: startCursor,
        filter: {
          or: [
            {
              property: 'Website',
              url: { is_empty: true }
            },
            {
              property: 'LinkedIn',
              url: { is_empty: true }
            },
            {
              property: 'Email',
              email: { is_empty: true }
            }
          ]
        },
        sorts: [
          {
            property: 'Name',
            direction: 'ascending'
          }
        ]
      });

      for (const page of response.results) {
        const org = {
          id: page.id,
          name: page.properties.Name?.title?.[0]?.plain_text || 'Unknown',
          missingFields: this.analyzeMissingFields(page),
          existingData: this.extractExistingData(page)
        };
        
        orgsNeedingWork.push(org);
      }

      hasMore = response.has_more;
      startCursor = response.next_cursor;
    }

    return orgsNeedingWork;
  }

  analyzeMissingFields(page) {
    const missing = [];
    
    // Check each priority field
    if (!page.properties.Website?.url) missing.push('Website');
    if (!page.properties.LinkedIn?.url) missing.push('LinkedIn');
    if (!page.properties.Email?.email) missing.push('Email');
    if (!page.properties.Phone?.phone_number) missing.push('Phone');
    
    const keyPeople = page.properties['Key People']?.rich_text?.[0]?.plain_text;
    if (!keyPeople) missing.push('Key People');
    
    const primaryContact = page.properties['Primary Contact']?.rich_text?.[0]?.plain_text;
    if (!primaryContact) missing.push('Primary Contact');
    
    if (!page.properties['Year Founded']?.number) missing.push('Year Founded');
    if (!page.properties.Size?.select?.name) missing.push('Size');
    if (!page.properties.Category?.select?.name) missing.push('Category');
    
    const aiFocusAreas = page.properties['AI Focus Areas']?.multi_select;
    if (!aiFocusAreas || aiFocusAreas.length === 0) missing.push('AI Focus Areas');
    
    return missing;
  }

  extractExistingData(page) {
    return {
      website: page.properties.Website?.url,
      linkedin: page.properties.LinkedIn?.url,
      email: page.properties.Email?.email,
      phone: page.properties.Phone?.phone_number,
      category: page.properties.Category?.select?.name,
      city: page.properties['City/Region']?.rich_text?.[0]?.plain_text,
      bcRegion: page.properties['BC Region']?.select?.name,
      shortBlurb: page.properties['Short Blurb']?.rich_text?.[0]?.plain_text,
      keyPeople: page.properties['Key People']?.rich_text?.[0]?.plain_text,
      aiFocusAreas: page.properties['AI Focus Areas']?.multi_select?.map(a => a.name)
    };
  }

  async generateReport(orgs, batchSize = 10) {
    const timestamp = new Date().toISOString().split('T')[0];
    
    console.log(`\n📊 Level-Up Analyst Report - ${timestamp}`);
    console.log('=' .repeat(60));
    console.log(`\nTotal organizations needing research: ${orgs.length}`);
    console.log(`\nShowing first ${batchSize} organizations:\n`);
    
    const batch = orgs.slice(0, batchSize);
    
    // Create report table
    console.log('| # | Organization | Missing Fields | Priority Research |');
    console.log('|---|--------------|----------------|-------------------|');
    
    batch.forEach((org, index) => {
      const priority = this.getPriorityResearch(org);
      console.log(`| ${index + 1} | ${org.name} | ${org.missingFields.length} fields | ${priority} |`);
    });
    
    console.log('\n📋 Detailed Batch Analysis:\n');
    
    batch.forEach((org, index) => {
      console.log(`\n${index + 1}. ${org.name}`);
      console.log('   Missing: ' + org.missingFields.join(', '));
      
      if (org.existingData.shortBlurb) {
        console.log('   Context: ' + org.existingData.shortBlurb.substring(0, 100) + '...');
      }
      
      if (org.existingData.category) {
        console.log('   Category: ' + org.existingData.category);
      }
      
      if (org.existingData.city) {
        console.log('   Location: ' + org.existingData.city);
      }
    });
    
    // Save batch IDs for processing
    const batchIds = batch.map(org => ({
      id: org.id,
      name: org.name,
      missing: org.missingFields
    }));
    
    const batchFile = `/Users/kk/ecosystem-map-bc-ai/tasks/${timestamp}_level-up-batch.json`;
    const fs = require('fs').promises;
    await fs.mkdir('/Users/kk/ecosystem-map-bc-ai/tasks', { recursive: true });
    await fs.writeFile(batchFile, JSON.stringify(batchIds, null, 2));
    
    console.log(`\n💾 Batch saved to: ${batchFile}`);
    console.log('\n🚀 Ready to start research on these organizations!');
  }

  getPriorityResearch(org) {
    if (!org.existingData.website) return 'Website';
    if (!org.existingData.linkedin) return 'LinkedIn';
    if (!org.existingData.email) return 'Email';
    if (!org.existingData.keyPeople) return 'Key People';
    return org.missingFields[0] || 'General';
  }

  async updateOrganization(orgId, updates) {
    try {
      const response = await this.notion.pages.update({
        page_id: orgId,
        properties: updates
      });
      
      return { success: true, response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Run analysis
if (require.main === module) {
  const analyst = new LevelUpAnalyst();
  
  analyst.findOrgsNeedingResearch()
    .then(orgs => analyst.generateReport(orgs))
    .catch(console.error);
}

module.exports = LevelUpAnalyst;