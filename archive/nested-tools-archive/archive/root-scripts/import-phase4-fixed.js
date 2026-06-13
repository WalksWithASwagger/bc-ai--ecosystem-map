#!/usr/bin/env node

/**
 * Fixed Phase 4 Import - Import new companies from Phase 4 research
 * Import new companies to approach legendary 1,000 company milestone (Schema Fixed)
 */

const { Client } = require('@notionhq/client');
const fs = require('fs').promises;

// Notion credentials
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
    console.error("❌ Missing required environment variables: NOTION_TOKEN and NOTION_DATABASE_ID");
    console.error("Please set these environment variables before running this script.");
    process.exit(1);
}
class FixedPhase4Importer {
  constructor() {
    this.notion = new Client({ auth: NOTION_TOKEN });
    this.databaseId = NOTION_DATABASE_ID;
    this.results = {
      totalProcessed: 0,
      imported: 0,
      skipped: 0,
      errors: 0,
      importedCompanies: []
    };
  }

  mapCategoryToExisting(category) {
    const categoryMap = {
      "AI Services & Automation": "AI Companies",
      "Emerging Technologies": "Technology Companies",
      "Healthcare & Specialized AI": "Healthcare & Biotech",
      "Enterprise Software & Development": "Technology Companies",
      "Data Analytics & Intelligence": "AI Companies",
      "Advanced AI Platforms": "AI Companies"
    };
    return categoryMap[category] || "AI Companies";
  }

  async importCompanyToNotion(company) {
    try {
      // Skip companies marked as existing in research
      if (company.existingInDatabase) {
        console.log(`⏭️  Skipping ${company.name} - marked as existing`);
        this.results.skipped++;
        return null;
      }

      console.log(`📝 Importing: ${company.name}`);

      const properties = {
        Name: { title: [{ text: { content: company.name } }] },
        Category: { select: { name: this.mapCategoryToExisting(company.category) } },
        "City/Region": { rich_text: [{ text: { content: "British Columbia, Canada" } }] },
        "BC Region": { select: { name: "Lower Mainland" } },
        "Data Source": { select: { name: "BC AI Ecosystem research documents" } }
      };

      if (company.funding) {
        properties['Funding'] = { rich_text: [{ text: { content: company.funding } }] };
      }

      // Combined focus areas, category, and employee info in Focus & Notes (without Company Size property)
      const notesContent = [];
      if (company.focusAreas && company.focusAreas.length > 0) {
        notesContent.push(`Phase 4 - ${company.focusAreas.join(', ')}`);
      }
      if (company.category) {
        notesContent.push(`Category: ${company.category}`);
      }
      if (company.employees) {
        notesContent.push(`Size: ${company.employees}`);
      }
      
      if (notesContent.length > 0) {
        properties['Focus & Notes'] = {
          rich_text: [{ text: { content: notesContent.join(' | ') } }]
        };
      }

      const response = await this.notion.pages.create({
        parent: { database_id: this.databaseId },
        properties: properties
      });

      console.log(`✅ Successfully imported: ${company.name}`);
      this.results.imported++;
      this.results.importedCompanies.push(company.name);
      
      return response;

    } catch (error) {
      console.error(`❌ Error importing ${company.name}:`, error.message);
      this.results.errors++;
      return null;
    }
  }

  async processCategory(categoryFile) {
    try {
      const filePath = `imports/phase4-expansion/${categoryFile}`;
      const fileContent = await fs.readFile(filePath, 'utf8');
      const companies = JSON.parse(fileContent);
      
      console.log(`\n🏷️ Processing: ${categoryFile} (${companies.length} companies)`);
      
      for (const company of companies) {
        this.results.totalProcessed++;
        await this.importCompanyToNotion(company);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${categoryFile}:`, error.message);
    }
  }

  async run() {
    try {
      console.log('🚀 Phase 4 Import Starting (SCHEMA FIXED)...');
      console.log('📋 Importing new companies from Phase 4 research');
      console.log('🎯 Goal: Approach legendary 1,000 company milestone!');
      
      // Get all available import files
      const importFiles = await fs.readdir('imports/phase4-expansion/');
      const jsonFiles = importFiles.filter(file => file.endsWith('.json'));
      
      console.log(`📁 Found ${jsonFiles.length} category files to process`);

      for (const categoryFile of jsonFiles) {
        await this.processCategory(categoryFile);
      }

      console.log('\n📋 PHASE 4 IMPORT SUMMARY:');
      console.log(`✅ Total Processed: ${this.results.totalProcessed}`);
      console.log(`📝 Successfully Imported: ${this.results.imported}`);
      console.log(`⏭️  Skipped: ${this.results.skipped}`);
      console.log(`❌ Errors: ${this.results.errors}`);
      console.log(`🎯 New Database Total: ~${882 + this.results.imported} companies`);

      // Check if we're approaching 1,000 milestone
      const newTotal = 882 + this.results.imported;
      const milestoneApproached = newTotal >= 950;
      const legendaryAchieved = newTotal >= 1000;

      // Save results
      const report = {
        timestamp: new Date().toISOString(),
        results: this.results,
        importedCompanies: this.results.importedCompanies,
        newDatabaseTotal: newTotal,
        milestoneApproached: milestoneApproached,
        legendaryAchieved: legendaryAchieved,
        phase4Analysis: {
          totalResearched: 100,
          alreadyInDatabase: this.results.skipped,
          newlyImported: this.results.imported,
          importErrors: this.results.errors,
          completionRate: ((this.results.imported / (this.results.totalProcessed - this.results.skipped)) * 100).toFixed(1) + '%'
        }
      };
      
      await fs.writeFile(
        `logs/phase4-research/fixed-import-results-${new Date().toISOString().split('T')[0]}.json`,
        JSON.stringify(report, null, 2)
      );

      if (legendaryAchieved) {
        console.log('\n🏆 LEGENDARY MILESTONE ACHIEVED: 1,000+ COMPANIES!');
        console.log('🇨🇦 BC AI Ecosystem reaches ultimate global supremacy!');
      } else if (milestoneApproached) {
        console.log('\n🎯 APPROACHING LEGENDARY MILESTONE!');
        console.log(`🏆 ${newTotal} companies - Approaching 1,000 milestone!`);
      }

      console.log('\n🎉 PHASE 4 IMPORT COMPLETE!');
      console.log(`🇨🇦 BC AI Ecosystem database enhanced with ${this.results.imported} new companies!`);
      
      if (this.results.skipped > 0) {
        console.log(`📊 Database Coverage: ${this.results.skipped} companies already existed (great coverage!)`);
      }
      
    } catch (error) {
      console.error('❌ Import failed:', error);
      throw error;
    }
  }
}

// Execute
if (require.main === module) {
  const importer = new FixedPhase4Importer();
  importer.run().then(() => {
    console.log('✅ Phase 4 fixed import completed!');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Import failed:', error);
    process.exit(1);
  });
}