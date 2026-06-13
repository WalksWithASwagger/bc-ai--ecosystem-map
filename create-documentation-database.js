#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Import the MCP Notion functionality
const mcp = require('/Users/kk/code/kk-mcp/src/notion-power.ts');

const DATABASE_NAME = "BC AI Ecosystem Documentation";
const DATABASE_PROPERTIES = {
  "Title": { type: "title" },
  "Type": {
    type: "select",
    options: [
      { name: "Documentation", color: "blue" },
      { name: "Report", color: "green" },
      { name: "Data", color: "orange" }
    ]
  },
  "Date Created": { type: "date" },
  "Category": {
    type: "select",
    options: [
      { name: "Project Management", color: "purple" },
      { name: "Intelligence", color: "red" },
      { name: "Funding", color: "yellow" },
      { name: "Database", color: "pink" },
      { name: "Analysis", color: "brown" }
    ]
  },
  "Content": { type: "rich_text" }
};

// Files to migrate
const FILES_TO_MIGRATE = [
  {
    path: '/Users/kk/ecosystem-map-bc-ai/FUNDING_DATABASE_MASTER_PLAN.md',
    type: 'Documentation',
    category: 'Funding'
  },
  {
    path: '/Users/kk/ecosystem-map-bc-ai/FUNDING_DATABASE_AUDIT_2025-08-09.md',
    type: 'Report',
    category: 'Database'
  },
  {
    path: '/Users/kk/ecosystem-map-bc-ai/FUNDING_DB_ENRICHMENT_REPORT.md',
    type: 'Report',
    category: 'Funding'
  },
  {
    path: '/Users/kk/ecosystem-map-bc-ai/PROJECT_STATUS_2025_08_10.md',
    type: 'Report',
    category: 'Project Management'
  },
  {
    path: '/Users/kk/ecosystem-map-bc-ai/FINAL_CLEANUP_SUMMARY.md',
    type: 'Report',
    category: 'Project Management'
  },
  {
    path: '/Users/kk/ecosystem-map-bc-ai/docs/project-management/FINAL_CLEANUP_SUMMARY.md',
    type: 'Report',
    category: 'Project Management'
  }
];

// Intelligence reports
const INTELLIGENCE_FILES = [
  'BC_AI_TOP_10_PEOPLE_INTELLIGENCE_REPORT.md',
  'BC_INVESTOR_ECOSYSTEM_MAPPING.md',
  'BC_MAJOR_EXITS_FINANCIAL_INTELLIGENCE_REPORT.md',
  'COMPLETE_INTELLIGENCE_REPORT.md',
  'FINANCIAL_PEOPLE_INTELLIGENCE_RESULTS.md',
  'FINANCIAL_PEOPLE_INTELLIGENCE_STRATEGY.md',
  'PROPRIETARY_INTELLIGENCE_ENHANCEMENT_SUMMARY.md'
].map(filename => ({
  path: `/Users/kk/ecosystem-map-bc-ai/data/intelligence/${filename}`,
  type: 'Report',
  category: 'Intelligence'
}));

async function createNotionDatabase() {
  console.log(`Creating Notion database: ${DATABASE_NAME}`);
  
  try {
    // Create the database using MCP Notion
    const database = await mcp.createDatabase({
      title: DATABASE_NAME,
      properties: DATABASE_PROPERTIES,
      parent: { type: 'workspace', workspace: true }
    });
    
    console.log(`✅ Database created successfully!`);
    console.log(`Database ID: ${database.id}`);
    
    return database.id;
  } catch (error) {
    console.error('❌ Error creating database:', error);
    throw error;
  }
}

async function readFileContent(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content;
  } catch (error) {
    console.log(`⚠️  Could not read file: ${filePath} - ${error.message}`);
    return null;
  }
}

function extractTitle(filePath) {
  const filename = path.basename(filePath, '.md');
  return filename.replace(/_/g, ' ').replace(/-/g, ' ');
}

function extractDateFromFilename(filePath) {
  const dateMatch = path.basename(filePath).match(/(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    return dateMatch[1];
  }
  
  // Check file stats as fallback
  try {
    const stats = fs.statSync(filePath);
    return stats.mtime.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

async function migrateFile(databaseId, fileInfo) {
  const content = await readFileContent(fileInfo.path);
  if (!content) {
    return null;
  }
  
  const title = extractTitle(fileInfo.path);
  const dateCreated = extractDateFromFilename(fileInfo.path);
  
  console.log(`📝 Migrating: ${title}`);
  
  try {
    const page = await mcp.createPage({
      parent: { database_id: databaseId },
      properties: {
        "Title": {
          title: [{ text: { content: title } }]
        },
        "Type": {
          select: { name: fileInfo.type }
        },
        "Date Created": {
          date: { start: dateCreated }
        },
        "Category": {
          select: { name: fileInfo.category }
        },
        "Content": {
          rich_text: [{ text: { content: content.substring(0, 2000) } }] // Notion has limits
        }
      },
      children: [
        {
          object: 'block',
          type: 'code',
          code: {
            language: 'markdown',
            rich_text: [{ text: { content: content } }]
          }
        }
      ]
    });
    
    console.log(`✅ Successfully migrated: ${title}`);
    return page.id;
  } catch (error) {
    console.error(`❌ Error migrating ${title}:`, error);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting BC AI Ecosystem Documentation Migration');
  
  try {
    // Create the database
    const databaseId = await createNotionDatabase();
    
    // Combine all files to migrate
    const allFiles = [...FILES_TO_MIGRATE, ...INTELLIGENCE_FILES];
    
    console.log(`\n📄 Migrating ${allFiles.length} files...`);
    
    const results = {
      successful: [],
      failed: [],
      skipped: []
    };
    
    for (const fileInfo of allFiles) {
      const pageId = await migrateFile(databaseId, fileInfo);
      
      if (pageId) {
        results.successful.push({
          file: fileInfo.path,
          title: extractTitle(fileInfo.path),
          pageId
        });
      } else {
        if (fs.existsSync(fileInfo.path)) {
          results.failed.push(fileInfo.path);
        } else {
          results.skipped.push(fileInfo.path);
        }
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Final summary
    console.log('\n📊 MIGRATION COMPLETE');
    console.log('='.repeat(50));
    console.log(`Database ID: ${databaseId}`);
    console.log(`✅ Successfully migrated: ${results.successful.length} files`);
    console.log(`❌ Failed migrations: ${results.failed.length} files`);
    console.log(`⏭️  Skipped (not found): ${results.skipped.length} files`);
    
    if (results.successful.length > 0) {
      console.log('\n📝 Successfully migrated files:');
      results.successful.forEach(item => {
        console.log(`  • ${item.title}`);
      });
    }
    
    if (results.failed.length > 0) {
      console.log('\n❌ Failed migrations:');
      results.failed.forEach(file => {
        console.log(`  • ${path.basename(file)}`);
      });
    }
    
    if (results.skipped.length > 0) {
      console.log('\n⏭️  Skipped files (not found):');
      results.skipped.forEach(file => {
        console.log(`  • ${path.basename(file)}`);
      });
    }
    
    // Save results to file
    const resultsSummary = {
      databaseId,
      timestamp: new Date().toISOString(),
      results
    };
    
    fs.writeFileSync(
      '/Users/kk/ecosystem-map-bc-ai/documentation-migration-results.json',
      JSON.stringify(resultsSummary, null, 2)
    );
    
    console.log('\n💾 Results saved to: documentation-migration-results.json');
    console.log(`\n🎉 Database URL: https://notion.so/${databaseId.replace(/-/g, '')}`);
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createNotionDatabase, migrateFile };