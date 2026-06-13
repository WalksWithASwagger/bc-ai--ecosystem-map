#!/usr/bin/env node

/**
 * Schema Field Fixer
 * Fixes the "Founded" field schema issue and validates database schema
 */

const { Client } = require('@notionhq/client');
const fs = require('fs').promises;

// Notion credentials
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
    console.error('❌ Missing required environment variables: NOTION_TOKEN and NOTION_DATABASE_ID');
    console.error('Please set these environment variables before running this script.');
    process.exit(1);
}

class SchemaFieldFixer {
    constructor() {
        this.notion = new Client({ auth: NOTION_TOKEN });
        this.databaseId = NOTION_DATABASE_ID;
        this.schema = null;
        this.fixes = {
            schemaIssues: [],
            fixesApplied: [],
            errors: []
        };
    }

    async fixSchemaIssues() {
        console.log('🔧 Starting schema field analysis and fixes...');
        
        // Get current database schema
        await this.getDatabaseSchema();
        
        // Analyze schema issues
        await this.analyzeSchemaIssues();
        
        // Apply fixes
        await this.applySchemaFixes();
        
        // Save results
        await this.saveResults();
        
        console.log('✅ Schema fixes complete!');
        return this.fixes;
    }

    async getDatabaseSchema() {
        console.log('📋 Retrieving current database schema...');
        
        try {
            const database = await this.notion.databases.retrieve({
                database_id: this.databaseId
            });
            
            this.schema = database.properties;
            
            console.log('✅ Schema retrieved successfully');
            console.log(`   Found ${Object.keys(this.schema).length} properties`);
            
            // Log current property names for debugging
            console.log('   Current properties:');
            Object.keys(this.schema).forEach(prop => {
                console.log(`     - ${prop} (${this.schema[prop].type})`);
            });
            
        } catch (error) {
            console.error('❌ Error retrieving schema:', error.message);
            throw error;
        }
    }

    async analyzeSchemaIssues() {
        console.log('🔍 Analyzing schema for issues...');
        
        // Check for "Founded" field issue
        const foundedField = this.schema['Founded'];
        if (!foundedField) {
            this.fixes.schemaIssues.push({
                issue: 'Missing Founded field',
                description: 'Founded property does not exist in database schema',
                severity: 'HIGH',
                solution: 'Add Founded field as number type or use existing date field'
            });
        } else {
            console.log(`   ✅ Founded field exists: ${foundedField.type}`);
        }
        
        // Check for other common issues
        
        // Year Founded field (alternative name)
        const yearFoundedField = this.schema['Year Founded'];
        if (yearFoundedField) {
            console.log(`   ✅ Year Founded field found: ${yearFoundedField.type}`);
            
            if (!foundedField) {
                this.fixes.schemaIssues.push({
                    issue: 'Founded field mapping error',
                    description: 'Scripts reference "Founded" but actual field is "Year Founded"',
                    severity: 'MEDIUM',
                    solution: 'Update scripts to use "Year Founded" instead of "Founded"'
                });
            }
        }
        
        // Check for Company Size field
        const companySizeField = this.schema['Company Size'];
        if (!companySizeField) {
            this.fixes.schemaIssues.push({
                issue: 'Missing Company Size field',
                description: 'Company Size property may not exist',
                severity: 'MEDIUM',
                solution: 'Verify Company Size field exists or create alternative mapping'
            });
        } else {
            console.log(`   ✅ Company Size field exists: ${companySizeField.type}`);
        }
        
        // Check other critical fields
        const criticalFields = ['Website', 'LinkedIn', 'Key People', 'Funding', 'Focus & Notes'];
        criticalFields.forEach(fieldName => {
            if (!this.schema[fieldName]) {
                this.fixes.schemaIssues.push({
                    issue: `Missing ${fieldName} field`,
                    description: `${fieldName} property does not exist in database schema`,
                    severity: 'MEDIUM',
                    solution: `Verify ${fieldName} field name or create field mapping`
                });
            } else {
                console.log(`   ✅ ${fieldName} field exists: ${this.schema[fieldName].type}`);
            }
        });
        
        console.log(`📊 Found ${this.fixes.schemaIssues.length} schema issues`);
    }

    async applySchemaFixes() {
        console.log('🔧 Applying schema fixes...');
        
        // Note: Notion API doesn't allow adding new properties to databases
        // We can only update property configurations, not create new ones
        // So we'll create a mapping solution instead
        
        for (const issue of this.fixes.schemaIssues) {
            if (issue.issue === 'Founded field mapping error') {
                // Create a corrected field mapping
                await this.createFieldMapping();
                
                this.fixes.fixesApplied.push({
                    issue: issue.issue,
                    solution: 'Created field mapping documentation',
                    status: 'applied'
                });
            }
        }
        
        console.log(`✅ Applied ${this.fixes.fixesApplied.length} fixes`);
    }

    async createFieldMapping() {
        console.log('   📋 Creating corrected field mapping...');
        
        const fieldMapping = {
            // Correct field mappings based on actual schema
            correctMappings: {
                founded: this.schema['Year Founded'] ? 'Year Founded' : null,
                companySize: this.schema['Company Size'] ? 'Company Size' : 
                           this.schema['Employee Count'] ? 'Employee Count' : null,
                website: 'Website',
                linkedin: 'LinkedIn',
                keyPeople: 'Key People',
                funding: 'Funding',
                focusNotes: 'Focus & Notes',
                category: 'Category',
                bcRegion: 'BC Region'
            },
            issues: this.fixes.schemaIssues,
            timestamp: new Date().toISOString()
        };
        
        // Save field mapping
        const mappingPath = 'tools/notion-field-mapping.json';
        await fs.writeFile(mappingPath, JSON.stringify(fieldMapping, null, 2));
        
        console.log(`   ✅ Field mapping saved to: ${mappingPath}`);
        
        // Create updated smart merger with corrected mappings
        await this.createCorrectedMerger();
    }

    async createCorrectedMerger() {
        console.log('   🔧 Creating corrected smart merger...');
        
        // Read the original smart merger
        const originalMerger = await fs.readFile('tools/smart-data-merger.js', 'utf8');
        
        // Create corrected version with proper field mappings
        const correctedMerger = originalMerger.replace(
            /updates\.Founded = { number: extracted\.founded };/g,
            this.schema['Year Founded'] ? 
                'updates[\'Year Founded\'] = { number: extracted.founded };' :
                '// Founded field not available in schema'
        );
        
        // Save corrected version
        const correctedPath = 'tools/smart-data-merger-corrected.js';
        await fs.writeFile(correctedPath, correctedMerger);
        
        console.log(`   ✅ Corrected merger saved to: ${correctedPath}`);
    }

    async saveResults() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Save detailed results
        const resultsPath = `data/reports/schema-fixes-${timestamp}.json`;
        await fs.writeFile(resultsPath, JSON.stringify(this.fixes, null, 2));
        
        // Generate summary report
        const summaryReport = this.generateSummaryReport();
        const summaryPath = `data/reports/schema-fixes-summary-${timestamp}.md`;
        await fs.writeFile(summaryPath, summaryReport);
        
        console.log(`📊 Schema fix results saved to: ${resultsPath}`);
        console.log(`📋 Summary saved to: ${summaryPath}`);
    }

    generateSummaryReport() {
        const fixes = this.fixes;
        
        return `# Schema Field Fix Summary

## 📊 **Fix Statistics**
- **Schema Issues Found**: ${fixes.schemaIssues.length}
- **Fixes Applied**: ${fixes.fixesApplied.length}
- **Errors Encountered**: ${fixes.errors.length}
- **Fix Date**: ${new Date().toLocaleDateString()}

## 🔍 **Schema Issues Identified**
${fixes.schemaIssues.map((issue, index) => 
    `### Issue ${index + 1}: ${issue.issue}
- **Description**: ${issue.description}
- **Severity**: ${issue.severity}
- **Solution**: ${issue.solution}`
).join('\n\n')}

## ✅ **Fixes Applied**
${fixes.fixesApplied.length > 0 ? 
    fixes.fixesApplied.map(fix => `- **${fix.issue}**: ${fix.solution} (${fix.status})`).join('\n') :
    'No automated fixes could be applied'}

## 📋 **Database Schema Summary**
Current database properties found:
${this.schema ? Object.keys(this.schema).map(prop => 
    `- **${prop}**: ${this.schema[prop].type}`
).join('\n') : 'Schema not available'}

## 🎯 **Recommendations**

### Immediate Actions:
1. **Use correct field names** in all scripts (e.g., "Year Founded" not "Founded")
2. **Update smart merger** to use corrected field mappings
3. **Test schema fixes** with small batch before full deployment

### Long-term Improvements:
1. **Standardize field naming** across all tools and scripts
2. **Create field validation** before database operations
3. **Implement schema versioning** for future changes

## 📄 **Generated Files**
- **Field Mapping**: tools/notion-field-mapping.json
- **Corrected Merger**: tools/smart-data-merger-corrected.js

**Schema analysis completed! Use corrected tools for future operations! ✅**`;
    }

    async run() {
        try {
            const results = await this.fixSchemaIssues();
            
            console.log('\n📋 SCHEMA FIX SUMMARY:');
            console.log(`🔍 Issues Found: ${results.schemaIssues.length}`);
            console.log(`✅ Fixes Applied: ${results.fixesApplied.length}`);
            console.log(`❌ Errors: ${results.errors.length}`);
            
            return results;
            
        } catch (error) {
            console.error('❌ Schema fixes failed:', error);
            throw error;
        }
    }
}

// Execute if called directly
if (require.main === module) {
    const fixer = new SchemaFieldFixer();
    fixer.run().then(() => {
        console.log('✅ Schema fixes completed successfully!');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Schema fixes failed:', error);
        process.exit(1);
    });
}

module.exports = SchemaFieldFixer;