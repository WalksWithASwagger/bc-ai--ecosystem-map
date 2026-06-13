#!/usr/bin/env node

/**
 * Create BC AI Ecosystem Documentation Database
 */

const { fetch } = require('undici');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment from MCP directory
dotenv.config({ path: '/Users/kk/code/kk-mcp/.env' });

const NOTION_API_KEY = process.env.NOTION_API_KEY;

async function notionRequest(endpoint, options = {}) {
  const response = await fetch(`https://api.notion.com/v1${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Notion API error ${response.status}: ${error}`);
  }
  
  return response.json();
}

async function createDocumentationHub() {
  console.log('📄 Creating Documentation Hub page...\n');
  
  const hubPage = await notionRequest('/pages', {
    method: 'POST',
    body: JSON.stringify({
      parent: { type: 'workspace', workspace: true },
      properties: {
        title: {
          title: [{
            text: { content: 'BC AI Ecosystem Documentation Hub' }
          }]
        }
      },
      children: [
        {
          object: 'block',
          type: 'heading_1',
          heading_1: {
            rich_text: [{ text: { content: '📚 Documentation Center' } }]
          }
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{
              text: {
                content: 'Central hub for all BC AI Ecosystem project documentation, reports, and intelligence.'
              }
            }]
          }
        }
      ]
    })
  });
  
  console.log('✅ Documentation Hub created!');
  console.log(`📍 Page ID: ${hubPage.id}`);
  console.log(`🔗 URL: ${hubPage.url}\n`);
  
  return hubPage.id;
}

async function createDocumentationDatabase(parentPageId) {
  console.log('📚 Creating BC AI Ecosystem Documentation Database...\n');
  
  const database = {
    parent: {
      type: 'page_id',
      page_id: parentPageId
    },
    title: [{
      type: 'text',
      text: { content: 'BC AI Ecosystem Documentation' }
    }],
    icon: {
      type: 'emoji',
      emoji: '📚'
    },
    properties: {
      'Title': {
        title: {}
      },
      'Type': {
        select: {
          options: [
            { name: 'Documentation', color: 'blue' },
            { name: 'Report', color: 'green' },
            { name: 'Data', color: 'orange' }
          ]
        }
      },
      'Date Created': {
        date: {}
      },
      'Category': {
        select: {
          options: [
            { name: 'Project Management', color: 'purple' },
            { name: 'Intelligence', color: 'red' },
            { name: 'Funding', color: 'yellow' },
            { name: 'Database', color: 'pink' },
            { name: 'Analysis', color: 'brown' }
          ]
        }
      },
      'Content Preview': {
        rich_text: {}
      },
      'File Size': {
        number: {
          format: 'number'
        }
      },
      'Source Path': {
        rich_text: {}
      },
      'Status': {
        select: {
          options: [
            { name: 'Current', color: 'green' },
            { name: 'Archived', color: 'gray' },
            { name: 'Draft', color: 'yellow' }
          ]
        }
      }
    }
  };
  
  const response = await notionRequest('/databases', {
    method: 'POST',
    body: JSON.stringify(database)
  });
  
  console.log('✅ Documentation database created!');
  console.log(`📍 Database ID: ${response.id}`);
  console.log(`🔗 URL: ${response.url}\n`);
  
  return response;
}

async function loadMigrationData() {
  const dataPath = '/Users/kk/ecosystem-map-bc-ai/documentation-migration-data.json';
  
  if (!fs.existsSync(dataPath)) {
    throw new Error('Migration data not found. Run migrate-documentation.js first.');
  }
  
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`📊 Loaded ${data.rawData.length} files for migration\n`);
  
  return data.rawData;
}

function truncateContent(content, maxLength = 1900) {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '\n\n... (content truncated for Notion)';
}

async function createDocumentationPage(dbId, fileData) {
  console.log(`📄 Creating page: ${fileData.title}`);
  
  const contentPreview = truncateContent(fileData.content, 200);
  const fullContent = truncateContent(fileData.content, 1900);
  
  try {
    const page = await notionRequest('/pages', {
      method: 'POST',
      body: JSON.stringify({
        parent: { database_id: dbId },
        properties: {
          'Title': {
            title: [{ text: { content: fileData.title } }]
          },
          'Type': {
            select: { name: fileData.type }
          },
          'Date Created': {
            date: { start: fileData.dateCreated }
          },
          'Category': {
            select: { name: fileData.category }
          },
          'Content Preview': {
            rich_text: [{ text: { content: contentPreview } }]
          },
          'File Size': {
            number: fileData.contentLength
          },
          'Source Path': {
            rich_text: [{ text: { content: fileData.path } }]
          },
          'Status': {
            select: { name: 'Current' }
          }
        },
        children: [
          {
            object: 'block',
            type: 'heading_1',
            heading_1: {
              rich_text: [{ text: { content: fileData.title } }]
            }
          },
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{
                text: {
                  content: `Source: ${fileData.path}`
                }
              }]
            }
          },
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{
                text: {
                  content: `Type: ${fileData.type} | Category: ${fileData.category} | Date: ${fileData.dateCreated} | Size: ${fileData.contentLength} chars`
                }
              }]
            }
          },
          {
            object: 'block',
            type: 'divider',
            divider: {}
          },
          {
            object: 'block',
            type: 'code',
            code: {
              language: 'markdown',
              rich_text: [{ text: { content: fullContent } }]
            }
          }
        ]
      })
    });
    
    console.log(`✅ Page created: ${fileData.title}`);
    return page.id;
    
  } catch (error) {
    console.error(`❌ Failed to create page for ${fileData.title}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('\n📚 BC AI Ecosystem Documentation Database Creator');
  console.log('=' .repeat(60));
  
  if (!NOTION_API_KEY) {
    console.error('❌ NOTION_API_KEY not found in /Users/kk/code/kk-mcp/.env');
    process.exit(1);
  }
  
  try {
    // Create the documentation hub page first
    const hubPageId = await createDocumentationHub();
    
    // Create the database within the hub page
    const database = await createDocumentationDatabase(hubPageId);
    const dbId = database.id;
    
    // Load migration data
    const files = await loadMigrationData();
    
    // Create pages for each file
    const results = {
      successful: [],
      failed: [],
      total: files.length
    };
    
    console.log('📄 Creating pages...\n');
    
    for (const fileData of files) {
      const pageId = await createDocumentationPage(dbId, fileData);
      
      if (pageId) {
        results.successful.push({
          title: fileData.title,
          pageId: pageId,
          type: fileData.type,
          category: fileData.category
        });
      } else {
        results.failed.push(fileData.title);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Save results
    const finalResults = {
      databaseId: dbId,
      databaseUrl: database.url,
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: results.total,
        successful: results.successful.length,
        failed: results.failed.length
      },
      successfulMigrations: results.successful,
      failedMigrations: results.failed
    };
    
    fs.writeFileSync(
      '/Users/kk/ecosystem-map-bc-ai/notion-docs-migration-results.json',
      JSON.stringify(finalResults, null, 2)
    );
    
    // Final report
    console.log('\n' + '=' .repeat(60));
    console.log('✅ DOCUMENTATION MIGRATION COMPLETE!\n');
    console.log(`📊 Database ID: ${dbId}`);
    console.log(`🔗 Database URL: ${database.url}`);
    console.log(`📄 Total Files: ${results.total}`);
    console.log(`✅ Successfully Migrated: ${results.successful.length}`);
    console.log(`❌ Failed Migrations: ${results.failed.length}`);
    
    if (results.successful.length > 0) {
      console.log('\n📝 Successfully migrated:');
      results.successful.forEach(item => {
        console.log(`  • ${item.title} (${item.type})`);
      });
    }
    
    if (results.failed.length > 0) {
      console.log('\n❌ Failed migrations:');
      results.failed.forEach(title => {
        console.log(`  • ${title}`);
      });
    }
    
    console.log('\n💾 Results saved to: notion-docs-migration-results.json');
    console.log('\n🎯 Next Steps:');
    console.log('1. Open the database in Notion');
    console.log('2. Review the migrated documentation');
    console.log('3. Set up any additional views or filters as needed');
    
  } catch (error) {
    console.error('\n❌ Migration Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}