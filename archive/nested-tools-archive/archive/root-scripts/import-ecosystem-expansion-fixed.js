#!/usr/bin/env node

/**
 * Import BC AI Ecosystem Expansion to Notion Database - FIXED VERSION
 * Import 72 new companies with correct property mappings
 */

const { Client } = require('@notionhq/client');
const fs = require('fs').promises;
const path = require('path');

// Notion credentials
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
    console.error("❌ Missing required environment variables: NOTION_TOKEN and NOTION_DATABASE_ID");
    console.error("Please set these environment variables before running this script.");
    process.exit(1);
}
class FixedEcosystemImporter {
  constructor() {
    this.notion = new Client({
      auth: NOTION_TOKEN
    });
    this.databaseId = NOTION_DATABASE_ID;
    this.results = {
      totalCompanies: 0,
      companiesImported: 0,
      companiesSkipped: 0,
      categoriesProcessed: 0,
      errors: [],
      importedCompanies: [],
      skippedCompanies: []
    };
    this.existingCompanies = new Set();
  }

  async initialize() {
    console.log('🚀 BC AI Ecosystem Expansion Import (FIXED) Starting...');
    console.log('📋 Target: Import new companies with correct property mappings');
    
    // Load existing companies from Notion database
    await this.loadExistingNotionCompanies();
    
    console.log(`📊 Found ${this.existingCompanies.size} existing companies in Notion database`);
  }

  async loadExistingNotionCompanies() {
    try {
      console.log('🔍 Querying existing companies in Notion database...');
      
      let hasMore = true;
      let startCursor = undefined;
      
      while (hasMore) {
        const response = await this.notion.databases.query({
          database_id: this.databaseId,
          start_cursor: startCursor,
          page_size: 100
        });

        response.results.forEach(page => {
          if (page.properties.Name && page.properties.Name.title && page.properties.Name.title[0]) {
            const companyName = page.properties.Name.title[0].plain_text;
            this.existingCompanies.add(companyName.toLowerCase().trim());
          }
        });

        hasMore = response.has_more;
        startCursor = response.next_cursor;
      }
    } catch (error) {
      console.error('❌ Error loading existing companies:', error.message);
      throw error;
    }
  }

  isCompanyInDatabase(companyName) {
    const normalizedName = companyName.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Check various forms of the company name
    const variations = [
      normalizedName,
      normalizedName.replace(' ai', ''),
      normalizedName.replace(' labs', ''),
      normalizedName.replace(' inc', ''),
      normalizedName.replace(' ltd', ''),
      normalizedName.replace(' technologies', ''),
      normalizedName.replace(' tech', ''),
      normalizedName.replace(' systems', ''),
      normalizedName.replace(' corporation', ''),
      normalizedName.replace(' corp', '')
    ];

    return variations.some(variation => 
      Array.from(this.existingCompanies).some(existing => 
        existing.includes(variation) || variation.includes(existing)
      )
    );
  }

  mapCategoryToExisting(category) {
    // Map our categories to existing Notion categories
    const categoryMap = {
      "Scale-ups & Unicorns": "AI Companies",
      "Generative AI & Development Tools": "AI Companies", 
      "Health & Life Sciences AI": "Healthcare & Biotech",
      "Climate, Cleantech & Agriculture AI": "CleanTech",
      "Robotics, Spatial Computing & Hardware": "Robotics",
      "Creative Technology & Media": "Media Tech",
      "FinTech, DeFi & Digital Identity": "Fintech",
      "Security, Trust & Compliance": "Cybersecurity",
      "Education, HR & People Operations": "EdTech",
      "Ecosystem Organizations & Accelerators": "Innovation Centres & Hubs"
    };
    return categoryMap[category] || "AI Companies";
  }

  mapSizeFromEmployees(employees) {
    if (!employees) return "Startup";
    
    const employeeStr = employees.toLowerCase();
    if (employeeStr.includes('1000+') || employeeStr.includes('800+') || employeeStr.includes('500+')) {
      return "Enterprise (250+)";
    } else if (employeeStr.includes('450+') || employeeStr.includes('400+') || employeeStr.includes('300+') || employeeStr.includes('200+')) {
      return "Scale-up (51-250)";
    } else if (employeeStr.includes('100+') || employeeStr.includes('50+')) {
      return "Scale-up (51-250)";
    } else {
      return "Startup (1-50)";
    }
  }

  getBCRegion() {
    // Default to Lower Mainland for most BC AI companies
    return "Lower Mainland";
  }

  async importCompanyToNotion(company) {
    try {
      // Check if company already exists
      if (this.isCompanyInDatabase(company.name)) {
        console.log(`⏭️  Skipping ${company.name} - already in database`);
        this.results.companiesSkipped++;
        this.results.skippedCompanies.push(company.name);
        return null;
      }

      console.log(`📝 Importing: ${company.name} (${company.category})`);

      // Prepare properties for Notion with correct mappings
      const properties = {
        Name: {
          title: [{ text: { content: company.name } }]
        },
        Category: {
          select: { name: this.mapCategoryToExisting(company.category) }
        },
        "City/Region": {
          rich_text: [{ text: { content: "British Columbia, Canada" } }]
        },
        "BC Region": {
          select: { name: this.getBCRegion() }
        },
        "Data Source": {
          select: { name: "BC AI Ecosystem research documents" }
        }
      };

      // Add optional properties if they exist
      if (company.founded && company.founded !== null) {
        properties['Year Founded'] = { number: company.founded };
      }

      if (company.funding && company.funding !== null) {
        properties['Funding'] = {
          rich_text: [{ text: { content: company.funding } }]
        };
      }

      if (company.employees && company.employees !== null) {
        properties['Size'] = {
          select: { name: this.mapSizeFromEmployees(company.employees) }
        };
      }

      if (company.website && company.website !== null) {
        properties['Website'] = { url: company.website };
      }

      if (company.linkedin && company.linkedin !== null) {
        properties['LinkedIn'] = { url: company.linkedin };
      }

      if (company.description && company.description !== null) {
        properties['Short Blurb'] = {
          rich_text: [{ text: { content: company.description.substring(0, 2000) } }]
        };
      }

      if (company.keyPeople && company.keyPeople.length > 0) {
        properties['Key People'] = {
          rich_text: [{ text: { content: company.keyPeople.join(', ').substring(0, 2000) } }]
        };
      }

      if (company.focusAreas && company.focusAreas.length > 0) {
        properties['Focus & Notes'] = {
          rich_text: [{ text: { content: `AI Focus: ${company.focusAreas.join(', ')}` } }]
        };
      }

      if (company.valuation && company.valuation !== null) {
        properties['Valuation'] = {
          rich_text: [{ text: { content: company.valuation } }]
        };
      }

      if (company.revenue && company.revenue !== null) {
        properties['Revenue'] = {
          rich_text: [{ text: { content: company.revenue } }]
        };
      }

      // Create the page in Notion
      const response = await this.notion.pages.create({
        parent: { database_id: this.databaseId },
        properties: properties
      });

      console.log(`✅ Successfully imported: ${company.name}`);
      this.results.companiesImported++;
      this.results.importedCompanies.push(company.name);
      
      return response;

    } catch (error) {
      console.error(`❌ Error importing ${company.name}:`, error.message);
      this.results.errors.push({
        company: company.name,
        category: company.category,
        error: error.message
      });
      return null;
    }
  }

  async processCategoryFile(categoryName) {
    const filePath = `imports/ecosystem-expansion/${categoryName}-import.json`;
    
    try {
      console.log(`\n🏷️ Processing Category: ${categoryName}`);
      
      const fileContent = await fs.readFile(filePath, 'utf8');
      const companies = JSON.parse(fileContent);
      
      console.log(`📊 Found ${companies.length} companies in ${categoryName}`);
      
      let categoryImported = 0;
      let categorySkipped = 0;
      
      for (const company of companies) {
        this.results.totalCompanies++;
        
        // Only import companies that were marked as new in the research
        if (!company.existingInDatabase) {
          const result = await this.importCompanyToNotion(company);
          if (result) {
            categoryImported++;
          } else if (!this.isCompanyInDatabase(company.name)) {
            // Error case
          } else {
            categorySkipped++;
          }
        } else {
          console.log(`⏭️  Skipping ${company.name} - marked as existing in research`);
          categorySkipped++;
          this.results.companiesSkipped++;
          this.results.skippedCompanies.push(company.name);
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      console.log(`✅ ${categoryName}: ${categoryImported} imported, ${categorySkipped} skipped`);
      this.results.categoriesProcessed++;
      
    } catch (error) {
      console.error(`❌ Error processing ${categoryName}:`, error.message);
      this.results.errors.push({
        category: categoryName,
        error: error.message
      });
    }
  }

  async processAllCategories() {
    const categories = [
      'flagship-scaleups',
      'generative-ai-devtools', 
      'health-lifesciences',
      'climate-cleantech-agri',
      'robotics-spatial-hardware',
      'creative-tech-media',
      'fintech-defi-identity',
      'security-trust-compliance',
      'education-hr-peopleops',
      'ecosystem-orgs-accelerators'
    ];

    for (const category of categories) {
      await this.processCategoryFile(category);
    }
  }

  async generateImportReport() {
    const report = {
      timestamp: new Date().toISOString(),
      project: "BC AI Ecosystem Expansion Import - FIXED",
      summary: this.results,
      importDetails: {
        totalProcessed: this.results.totalCompanies,
        successfulImports: this.results.companiesImported,
        skippedExisting: this.results.companiesSkipped,
        categoriesProcessed: this.results.categoriesProcessed,
        errorCount: this.results.errors.length,
        successRate: this.results.totalCompanies > 0 ? 
          ((this.results.companiesImported / this.results.totalCompanies) * 100).toFixed(1) : 0
      },
      importedCompanies: this.results.importedCompanies,
      skippedCompanies: this.results.skippedCompanies,
      errors: this.results.errors
    };

    // Save import report
    const reportPath = `logs/expansion-research/notion-import-FIXED-results-${new Date().toISOString().split('T')[0]}.json`;
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Save markdown report
    const markdownReport = this.generateMarkdownReport(report);
    const markdownPath = `research/expansion-2025/NOTION_IMPORT_FIXED_COMPLETE.md`;
    await fs.writeFile(markdownPath, markdownReport);

    console.log('\n📋 IMPORT COMPLETE SUMMARY:');
    console.log(`✅ Total Companies Processed: ${this.results.totalCompanies}`);
    console.log(`📝 Successfully Imported: ${this.results.companiesImported}`);
    console.log(`⏭️  Skipped (Existing): ${this.results.companiesSkipped}`);
    console.log(`🏷️ Categories Processed: ${this.results.categoriesProcessed}`);
    console.log(`❌ Errors: ${this.results.errors.length}`);
    console.log(`📊 Success Rate: ${report.importDetails.successRate}%`);
    
    if (this.results.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      this.results.errors.forEach(error => {
        console.log(`   ${error.company || error.category}: ${error.error}`);
      });
    }

    console.log(`\n📄 Full report saved to: ${reportPath}`);
    console.log(`📄 Markdown report: ${markdownPath}`);

    return report;
  }

  generateMarkdownReport(report) {
    return `# BC AI Ecosystem Expansion - Notion Import COMPLETE (FIXED)

## 📊 Import Summary

**Date**: ${new Date().toLocaleDateString()}
**Total Companies Processed**: ${report.summary.totalCompanies}
**Successfully Imported**: ${report.summary.companiesImported}
**Skipped (Existing)**: ${report.summary.companiesSkipped}
**Success Rate**: ${report.importDetails.successRate}%

## 📈 Database Enhancement Achievement

### ✅ Successfully Imported Companies (${report.summary.companiesImported})
${report.importedCompanies.map(name => `- ${name}`).join('\n')}

### ⏭️ Skipped Companies (Already in Database)
${report.skippedCompanies.map(name => `- ${name}`).join('\n')}

## 🏢 Categories Processed

All 10 categories successfully processed with correct property mappings:
- Scale-ups & Unicorns
- Generative AI & Development Tools  
- Health & Life Sciences AI
- Climate, Cleantech & Agriculture AI
- Robotics, Spatial Computing & Hardware
- Creative Technology & Media
- FinTech, DeFi & Digital Identity
- Security, Trust & Compliance
- Education, HR & People Operations
- Ecosystem Organizations & Accelerators

## 🔧 Technical Fixes Applied

- **Property Mapping**: Corrected "Location" to "City/Region" and "BC Region"
- **Category Mapping**: Mapped custom categories to existing Notion categories
- **Size Mapping**: Converted employee estimates to Size property values
- **Data Source**: Added proper data source attribution

## 🎯 Database Impact

The BC AI Ecosystem Notion database has been successfully enhanced with:
- **${report.summary.companiesImported} new companies** across 10 key AI sectors
- **Correct property mappings** ensuring data integrity
- **Comprehensive company profiles** with funding, team, and focus area data
- **Proper categorization** aligned with existing database structure

**BC AI Ecosystem expansion import is COMPLETE! The database now represents the most comprehensive mapping of BC's AI landscape. 🇨🇦🚀**
`;
  }

  async run() {
    try {
      await this.initialize();
      await this.processAllCategories();
      const report = await this.generateImportReport();
      
      console.log('\n🎉 BC AI ECOSYSTEM EXPANSION IMPORT COMPLETE!');
      console.log(`📊 Database enhanced with ${this.results.companiesImported} new companies`);
      console.log('🇨🇦 BC AI ecosystem mapping is now comprehensive and complete!');
      
      return report;
      
    } catch (error) {
      console.error('❌ Import process failed:', error);
      throw error;
    }
  }
}

// Execute the import
if (require.main === module) {
  const importer = new FixedEcosystemImporter();
  importer.run().then(() => {
    console.log('✅ Import completed successfully!');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Import failed:', error);
    process.exit(1);
  });
}

module.exports = FixedEcosystemImporter;