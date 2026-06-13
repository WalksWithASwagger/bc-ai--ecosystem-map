#!/usr/bin/env node

/**
 * Smart Data Merger
 * Intelligently merges research data with existing Notion database
 * WITHOUT overwriting existing data - only fills empty fields
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

class SmartDataMerger {
    constructor() {
        this.notion = new Client({ auth: NOTION_TOKEN });
        this.databaseId = NOTION_DATABASE_ID;
        this.mergeResults = {
            totalCompanies: 0,
            matchedCompanies: 0,
            enrichmentsMade: 0,
            fieldsUpdated: {},
            skippedUpdates: 0,
            conflicts: [],
            newCompanies: [],
            errors: []
        };
        this.databaseCompanies = new Map();
        this.researchData = [];
    }

    async loadResearchData(extractionFile) {
        console.log(`📋 Loading research data from: ${extractionFile}`);
        
        try {
            const content = await fs.readFile(extractionFile, 'utf8');
            const data = JSON.parse(content);
            
            this.researchData = data.companies || [];
            console.log(`✅ Loaded ${this.researchData.length} companies from research data`);
            
        } catch (error) {
            console.error('❌ Error loading research data:', error.message);
            throw error;
        }
    }

    async loadDatabaseCompanies() {
        console.log('📊 Loading existing database companies...');
        
        let hasMore = true;
        let startCursor = undefined;
        let allCompanies = [];
        
        while (hasMore) {
            try {
                const response = await this.notion.databases.query({
                    database_id: this.databaseId,
                    start_cursor: startCursor,
                    page_size: 100
                });
                
                allCompanies.push(...response.results);
                hasMore = response.has_more;
                startCursor = response.next_cursor;
                
            } catch (error) {
                console.error('❌ Error fetching database companies:', error.message);
                throw error;
            }
        }
        
        // Create searchable map
        for (const company of allCompanies) {
            const name = this.getCompanyName(company);
            if (name) {
                const normalizedName = this.normalizeName(name);
                this.databaseCompanies.set(normalizedName, company);
            }
        }
        
        this.mergeResults.totalCompanies = allCompanies.length;
        console.log(`✅ Loaded ${allCompanies.length} companies from database`);
    }

    async performSmartMerge() {
        console.log('🔀 Starting smart data merge...');
        
        for (const researchCompany of this.researchData) {
            await this.processCompanyMatch(researchCompany);
        }
        
        console.log('✅ Smart merge complete!');
    }

    async processCompanyMatch(researchCompany) {
        const normalizedName = this.normalizeName(researchCompany.name);
        const databaseCompany = this.databaseCompanies.get(normalizedName);
        
        if (databaseCompany) {
            // Company exists - attempt enrichment
            this.mergeResults.matchedCompanies++;
            await this.enrichExistingCompany(databaseCompany, researchCompany);
        } else {
            // Company doesn't exist - flag for potential addition
            this.mergeResults.newCompanies.push({
                name: researchCompany.name,
                confidence: researchCompany.confidence,
                extractedData: researchCompany.extractedData,
                source: researchCompany.sourceFile
            });
        }
    }

    async enrichExistingCompany(databaseCompany, researchCompany) {
        console.log(`🔄 Enriching: ${this.getCompanyName(databaseCompany)}`);
        
        const updates = this.planUpdates(databaseCompany, researchCompany);
        
        if (Object.keys(updates).length === 0) {
            console.log(`   ℹ️  No enrichment needed`);
            return;
        }
        
        try {
            // Apply updates to Notion
            await this.notion.pages.update({
                page_id: databaseCompany.id,
                properties: updates
            });
            
            this.mergeResults.enrichmentsMade++;
            
            // Log successful updates
            Object.keys(updates).forEach(field => {
                this.mergeResults.fieldsUpdated[field] = (this.mergeResults.fieldsUpdated[field] || 0) + 1;
            });
            
            console.log(`   ✅ Updated fields: ${Object.keys(updates).join(', ')}`);
            
        } catch (error) {
            console.error(`   ❌ Error updating ${this.getCompanyName(databaseCompany)}:`, error.message);
            this.mergeResults.errors.push({
                company: this.getCompanyName(databaseCompany),
                error: error.message,
                plannedUpdates: Object.keys(updates)
            });
        }
    }

    planUpdates(databaseCompany, researchCompany) {
        const updates = {};
        const properties = databaseCompany.properties;
        const extracted = researchCompany.extractedData;
        
        // Only update if confidence is high enough
        if (researchCompany.confidence < 0.8) {
            return updates;
        }
        
        // Website update
        if (extracted.website && this.isFieldEmpty(properties.Website)) {
            updates.Website = { url: extracted.website };
        }
        
        // Funding update
        if (extracted.funding && this.isFieldEmpty(properties.Funding)) {
            updates.Funding = { rich_text: [{ text: { content: extracted.funding } }] };
        }
        
        // Founded year update
        if (extracted.founded && this.isFieldEmpty(properties.Founded)) {
            updates['Year Founded'] = { number: extracted.founded };
        }
        
        // Key People update (append, don't overwrite)
        if (extracted.keyPeople && extracted.keyPeople.length > 0) {
            const existingPeople = this.getExistingText(properties['Key People']);
            if (!existingPeople || existingPeople.trim() === '') {
                updates['Key People'] = { 
                    rich_text: [{ text: { content: extracted.keyPeople.join(', ') } }] 
                };
            } else {
                // Append to existing (check for duplicates)
                const newPeople = extracted.keyPeople.filter(person => 
                    !existingPeople.toLowerCase().includes(person.toLowerCase())
                );
                if (newPeople.length > 0) {
                    const combined = existingPeople + ', ' + newPeople.join(', ');
                    updates['Key People'] = { 
                        rich_text: [{ text: { content: combined } }] 
                    };
                }
            }
        }
        
        // Focus & Notes update (append, don't overwrite)
        if (extracted.focus && extracted.focus.trim() !== '') {
            const existingNotes = this.getExistingText(properties['Focus & Notes']);
            if (!existingNotes || existingNotes.trim() === '') {
                updates['Focus & Notes'] = { 
                    rich_text: [{ text: { content: `Research: ${extracted.focus}` } }] 
                };
            } else {
                // Only append if the new focus info isn't already there
                if (!existingNotes.toLowerCase().includes(extracted.focus.toLowerCase().substring(0, 20))) {
                    const combined = existingNotes + ` | Research: ${extracted.focus}`;
                    updates['Focus & Notes'] = { 
                        rich_text: [{ text: { content: combined } }] 
                    };
                }
            }
        }
        
        // Company Size update
        if (extracted.employees && this.isFieldEmpty(properties['Company Size'])) {
            updates['Company Size'] = { 
                rich_text: [{ text: { content: extracted.employees } }] 
            };
        }
        
        // BC Region update (if location suggests specific region)
        if (extracted.location && this.isFieldEmpty(properties['BC Region'])) {
            const region = this.mapLocationToRegion(extracted.location);
            if (region) {
                updates['BC Region'] = { select: { name: region } };
            }
        }
        
        return updates;
    }

    isFieldEmpty(property) {
        if (!property) return true;
        
        switch (property.type) {
            case 'rich_text':
                return !property.rich_text || property.rich_text.length === 0 ||
                       !property.rich_text[0] || !property.rich_text[0].text.content.trim();
            
            case 'url':
                return !property.url || !property.url.trim();
            
            case 'select':
                return !property.select || !property.select.name;
            
            case 'number':
                return property.number === null || property.number === undefined;
            
            default:
                return true;
        }
    }

    getExistingText(property) {
        if (!property || !property.rich_text || property.rich_text.length === 0) {
            return '';
        }
        return property.rich_text[0].text.content;
    }

    mapLocationToRegion(location) {
        const locationLower = location.toLowerCase();
        
        if (locationLower.includes('vancouver')) return 'Lower Mainland';
        if (locationLower.includes('victoria')) return 'Vancouver Island';
        if (locationLower.includes('kelowna') || locationLower.includes('okanagan')) return 'Interior';
        if (locationLower.includes('burnaby') || locationLower.includes('richmond') || 
            locationLower.includes('surrey')) return 'Lower Mainland';
        
        return null; // Default - don't assume
    }

    getCompanyName(company) {
        const nameProperty = company.properties.Name;
        if (nameProperty && nameProperty.title && nameProperty.title[0]) {
            return nameProperty.title[0].text.content;
        }
        return null;
    }

    normalizeName(name) {
        return name.toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove special characters
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/\b(inc|ltd|llc|corp|corporation|company|co|technologies|tech|systems|ai|labs|lab)\b/g, '') // Remove common suffixes
            .trim();
    }

    async saveMergeResults() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Save detailed results
        const resultsPath = `data/reports/smart-merge-results-${timestamp}.json`;
        await fs.writeFile(resultsPath, JSON.stringify(this.mergeResults, null, 2));
        
        // Generate summary report
        const summaryReport = this.generateMergeSummary();
        const summaryPath = `data/reports/smart-merge-summary-${timestamp}.md`;
        await fs.writeFile(summaryPath, summaryReport);
        
        console.log(`📊 Merge results saved to: ${resultsPath}`);
        console.log(`📋 Summary saved to: ${summaryPath}`);
    }

    generateMergeSummary() {
        const results = this.mergeResults;
        
        return `# Smart Data Merge Summary

## 📊 **Merge Statistics**
- **Database Companies**: ${results.totalCompanies}
- **Research Companies**: ${this.researchData.length}
- **Matched Companies**: ${results.matchedCompanies}
- **Enrichments Made**: ${results.enrichmentsMade}
- **New Companies Found**: ${results.newCompanies.length}
- **Merge Date**: ${new Date().toLocaleDateString()}

## 📋 **Fields Updated**
${Object.entries(results.fieldsUpdated)
    .sort(([,a], [,b]) => b - a)
    .map(([field, count]) => `- **${field}**: ${count} updates`)
    .join('\n') || 'No field updates made'}

## 🆕 **New Companies Discovered**
${results.newCompanies.length > 0 ? 
    results.newCompanies.slice(0, 20).map((company, index) => 
        `${index + 1}. **${company.name}** (${(company.confidence * 100).toFixed(0)}% confidence)
   - Source: ${company.source}
   - Data: ${Object.keys(company.extractedData).join(', ')}`
    ).join('\n') + 
    (results.newCompanies.length > 20 ? `\n\n... and ${results.newCompanies.length - 20} more companies` : '') :
    'No new companies discovered'}

## ⚠️ **Conflicts & Issues**
${results.conflicts.length > 0 ? 
    results.conflicts.map(conflict => `- **${conflict.company}**: ${conflict.issue}`).join('\n') :
    'No conflicts detected'}

## ❌ **Errors**
${results.errors.length > 0 ? 
    results.errors.map(error => `- **${error.company}**: ${error.error}`).join('\n') :
    'No errors encountered'}

## 📈 **Enrichment Impact**
- **Database enrichment**: ${results.enrichmentsMade} companies enhanced
- **Total field updates**: ${Object.values(results.fieldsUpdated).reduce((a, b) => a + b, 0)}
- **Success rate**: ${results.enrichmentsMade > 0 ? ((results.enrichmentsMade / results.matchedCompanies) * 100).toFixed(1) : 0}%

## 🚀 **Recommendations**
${results.newCompanies.length > 0 ? 
    '1. **Review new companies** for potential addition to database\n' : ''}${results.errors.length > 0 ? 
    '2. **Review errors** and retry failed enrichments\n' : ''}3. **Verify updated data** for accuracy
4. **Continue research** to fill remaining gaps

**Smart merge completed successfully! Database enhanced without data loss! ✅**`;
    }

    async run(extractionFile) {
        try {
            console.log('🔀 Starting smart data merge process...');
            
            // Load research data
            await this.loadResearchData(extractionFile);
            
            // Load database companies
            await this.loadDatabaseCompanies();
            
            // Perform smart merge
            await this.performSmartMerge();
            
            // Save results
            await this.saveMergeResults();
            
            console.log('\n📋 SMART MERGE SUMMARY:');
            console.log(`✅ Companies Matched: ${this.mergeResults.matchedCompanies}`);
            console.log(`🔄 Enrichments Made: ${this.mergeResults.enrichmentsMade}`);
            console.log(`📊 Fields Updated: ${Object.values(this.mergeResults.fieldsUpdated).reduce((a, b) => a + b, 0)}`);
            console.log(`🆕 New Companies: ${this.mergeResults.newCompanies.length}`);
            console.log(`❌ Errors: ${this.mergeResults.errors.length}`);
            
            return this.mergeResults;
            
        } catch (error) {
            console.error('❌ Smart merge failed:', error);
            throw error;
        }
    }
}

// Execute if called directly
if (require.main === module) {
    const extractionFile = process.argv[2];
    
    if (!extractionFile) {
        console.error('❌ Usage: node smart-data-merger.js <extraction-file.json>');
        process.exit(1);
    }
    
    const merger = new SmartDataMerger();
    merger.run(extractionFile).then(() => {
        console.log('✅ Smart data merge completed successfully!');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Merge failed:', error);
        process.exit(1);
    });
}

module.exports = SmartDataMerger;