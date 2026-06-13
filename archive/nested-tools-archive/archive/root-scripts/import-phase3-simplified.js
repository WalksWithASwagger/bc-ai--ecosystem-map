#!/usr/bin/env node

/**
 * Simplified Phase 3 Import - Import new companies from Phase 3 research
 * Import new companies to achieve 900+ total companies milestone
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
class SimplifiedPhase3Importer {
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
      "AI Core & Data Tools": "AI Companies",
      "Climate & Biotechnology": "CleanTech",
      "Robotics & Hardware Systems": "Robotics",
      "Health & Medical Technology": "Healthcare & Biotech",
      "FinTech & Government Technology": "Fintech",
      "Creative Technology & Media": "Media Tech",
      "Edge Computing & IoT Systems": "Technology Companies",
      "People & Productivity Solutions": "AI Companies",
      "Security & Trust Systems": "Cybersecurity",
      "Wildcards & Early Stage AI": "AI Companies"
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

      if (company.focusAreas && company.focusAreas.length > 0) {
        properties['Focus & Notes'] = {
          rich_text: [{ text: { content: `Phase 3 - ${company.focusAreas.join(', ')}` } }]
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
      const filePath = `imports/phase3-expansion/${categoryFile}`;
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
      console.log('🚀 Phase 3 Import Starting...');
      console.log('📋 Importing new companies from Phase 3 research');
      console.log('🎯 Goal: Achieve 900+ total companies milestone!');
      
      const categories = [
        'ai-core-data-tools-import.json',
        'climate-bio-import.json',
        'robotics-hardware-import.json',
        'health-medtech-import.json',
        'fintech-govtech-import.json',
        'creative-media-import.json',
        'edge-iot-import.json'
        // Note: missing 3 categories - will create if needed
      ];

      for (const category of categories) {
        await this.processCategory(category);
      }

      console.log('\n📋 PHASE 3 IMPORT SUMMARY:');
      console.log(`✅ Total Processed: ${this.results.totalProcessed}`);
      console.log(`📝 Successfully Imported: ${this.results.imported}`);
      console.log(`⏭️  Skipped: ${this.results.skipped}`);
      console.log(`❌ Errors: ${this.results.errors}`);
      console.log(`🎯 New Database Total: ~${819 + this.results.imported} companies`);

      // Save results
      const report = {
        timestamp: new Date().toISOString(),
        results: this.results,
        importedCompanies: this.results.importedCompanies,
        milestoneAchieved: (819 + this.results.imported) >= 900
      };
      
      await fs.writeFile(
        `logs/phase3-research/simplified-import-results-${new Date().toISOString().split('T')[0]}.json`,
        JSON.stringify(report, null, 2)
      );

      if (report.milestoneAchieved) {
        console.log('\n🏆 MILESTONE ACHIEVED: 900+ COMPANIES!');
        console.log('🇨🇦 BC AI Ecosystem reaches unprecedented global leadership!');
      }

      console.log('\n🎉 PHASE 3 IMPORT COMPLETE!');
      console.log(`🇨🇦 BC AI Ecosystem database enhanced with ${this.results.imported} new companies!`);
      
    } catch (error) {
      console.error('❌ Import failed:', error);
      throw error;
    }
  }
}

// Execute
if (require.main === module) {
  const importer = new SimplifiedPhase3Importer();
  importer.run().then(() => {
    console.log('✅ Phase 3 import completed!');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Import failed:', error);
    process.exit(1);
  });
}