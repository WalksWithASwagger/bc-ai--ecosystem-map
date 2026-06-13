#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Documentation files to migrate with their metadata
const DOCUMENTATION_FILES = [
  {
    path: '/Users/kk/ecosystem-map-bc-ai/FUNDING_DATABASE_MASTER_PLAN.md',
    title: 'Funding Database Master Plan',
    type: 'Documentation',
    category: 'Funding'
  },
  {
    path: '/Users/kk/ecosystem-map-bc-ai/FUNDING_DATABASE_AUDIT_2025-08-09.md',
    title: 'Funding Database Audit 2025-08-09',
    type: 'Report',
    category: 'Database'
  },
  {
    path: '/Users/kk/ecosystem-map-bc-ai/FUNDING_DB_ENRICHMENT_REPORT.md',
    title: 'Funding Database Enrichment Report',
    type: 'Report',
    category: 'Funding'
  },
  {
    path: '/Users/kk/ecosystem-map-bc-ai/PROJECT_STATUS_2025_08_10.md',
    title: 'Project Status 2025-08-10',
    type: 'Report',
    category: 'Project Management'
  },
  {
    path: '/Users/kk/ecosystem-map-bc-ai/FINAL_CLEANUP_SUMMARY.md',
    title: 'Final Cleanup Summary',
    type: 'Report',
    category: 'Project Management'
  },
  {
    path: '/Users/kk/ecosystem-map-bc-ai/docs/project-management/FINAL_CLEANUP_SUMMARY.md',
    title: 'Final Cleanup Summary (Docs)',
    type: 'Report',
    category: 'Project Management'
  }
];

// Intelligence reports from data/intelligence/
const INTELLIGENCE_FILES = [
  {
    path: '/Users/kk/ecosystem-map-bc-ai/data/intelligence/BC_AI_TOP_10_PEOPLE_INTELLIGENCE_REPORT.md',
    title: 'BC AI Top 10 People Intelligence Report',
    type: 'Report',
    category: 'Intelligence'
  },
  {
    path: '/Users/kk/ecosystem-map-bc-ai/data/intelligence/BC_INVESTOR_ECOSYSTEM_MAPPING.md',
    title: 'BC Investor Ecosystem Mapping',
    type: 'Report',
    category: 'Intelligence'
  },
  {
    path: '/Users/kk/ecosystem-map-bc-ai/data/intelligence/BC_MAJOR_EXITS_FINANCIAL_INTELLIGENCE_REPORT.md',
    title: 'BC Major Exits Financial Intelligence Report',
    type: 'Report',
    category: 'Intelligence'
  },
  {
    path: '/Users/kk/ecosystem-map-bc-ai/data/intelligence/COMPLETE_INTELLIGENCE_REPORT.md',
    title: 'Complete Intelligence Report',
    type: 'Report',
    category: 'Intelligence'
  },
  {
    path: '/Users/kk/ecosystem-map-bc-ai/data/intelligence/FINANCIAL_PEOPLE_INTELLIGENCE_RESULTS.md',
    title: 'Financial People Intelligence Results',
    type: 'Report',
    category: 'Intelligence'
  },
  {
    path: '/Users/kk/ecosystem-map-bc-ai/data/intelligence/FINANCIAL_PEOPLE_INTELLIGENCE_STRATEGY.md',
    title: 'Financial People Intelligence Strategy',
    type: 'Documentation',
    category: 'Intelligence'
  },
  {
    path: '/Users/kk/ecosystem-map-bc-ai/data/intelligence/PROPRIETARY_INTELLIGENCE_ENHANCEMENT_SUMMARY.md',
    title: 'Proprietary Intelligence Enhancement Summary',
    type: 'Report',
    category: 'Intelligence'
  }
];

function readFileContent(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return null;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`📖 Read file: ${path.basename(filePath)} (${content.length} chars)`);
    return content;
  } catch (error) {
    console.error(`❌ Error reading file ${filePath}:`, error.message);
    return null;
  }
}

function extractDateFromPath(filePath) {
  // Look for date pattern in filename
  const dateMatch = path.basename(filePath).match(/(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    return dateMatch[1];
  }
  
  // Check file modification time as fallback
  try {
    const stats = fs.statSync(filePath);
    return stats.mtime.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

async function main() {
  console.log('🚀 BC AI Ecosystem Documentation Migration Preparation');
  console.log('='.repeat(60));
  
  // Combine all files
  const allFiles = [...DOCUMENTATION_FILES, ...INTELLIGENCE_FILES];
  
  console.log(`📄 Found ${allFiles.length} files to process`);
  
  const results = {
    found: [],
    missing: [],
    processed: []
  };
  
  // Process each file
  for (const fileInfo of allFiles) {
    const content = readFileContent(fileInfo.path);
    const dateCreated = extractDateFromPath(fileInfo.path);
    
    if (content) {
      const processedFile = {
        ...fileInfo,
        content: content,
        dateCreated: dateCreated,
        contentLength: content.length,
        contentPreview: content.substring(0, 200) + (content.length > 200 ? '...' : '')
      };
      
      results.found.push(processedFile);
      results.processed.push({
        title: fileInfo.title,
        type: fileInfo.type,
        category: fileInfo.category,
        dateCreated: dateCreated,
        path: fileInfo.path,
        size: content.length
      });
    } else {
      results.missing.push(fileInfo.path);
    }
  }
  
  // Generate summary
  console.log('\n📊 PROCESSING SUMMARY');
  console.log('='.repeat(30));
  console.log(`✅ Files found and processed: ${results.found.length}`);
  console.log(`❌ Files missing: ${results.missing.length}`);
  
  if (results.found.length > 0) {
    console.log('\n📝 Files ready for Notion migration:');
    results.found.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.title}`);
      console.log(`     Type: ${file.type} | Category: ${file.category}`);
      console.log(`     Date: ${file.dateCreated} | Size: ${file.contentLength} chars`);
      console.log(`     Preview: ${file.contentPreview}`);
      console.log('');
    });
  }
  
  if (results.missing.length > 0) {
    console.log('\n❌ Missing files:');
    results.missing.forEach(filePath => {
      console.log(`  • ${path.basename(filePath)}`);
    });
  }
  
  // Save processed data
  const migrationData = {
    timestamp: new Date().toISOString(),
    databaseName: 'BC AI Ecosystem Documentation',
    properties: {
      'Title': { type: 'title' },
      'Type': { 
        type: 'select',
        options: ['Documentation', 'Report', 'Data']
      },
      'Date Created': { type: 'date' },
      'Category': {
        type: 'select', 
        options: ['Project Management', 'Intelligence', 'Funding', 'Database', 'Analysis']
      },
      'Content': { type: 'rich_text' }
    },
    files: results.processed,
    rawData: results.found
  };
  
  const outputPath = '/Users/kk/ecosystem-map-bc-ai/documentation-migration-data.json';
  fs.writeFileSync(outputPath, JSON.stringify(migrationData, null, 2));
  
  console.log(`\n💾 Migration data saved to: ${outputPath}`);
  console.log('\n🎯 Next steps:');
  console.log('1. Use the MCP Notion tools to create the database');
  console.log('2. Use the saved migration data to populate the database');
  console.log('3. Verify all content has been properly migrated');
  
  return migrationData;
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { DOCUMENTATION_FILES, INTELLIGENCE_FILES, readFileContent };