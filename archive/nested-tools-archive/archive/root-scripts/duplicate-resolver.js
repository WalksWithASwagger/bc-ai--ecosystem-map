#!/usr/bin/env node

/**
 * Duplicate Resolver Tool
 * Identifies and intelligently resolves duplicate companies in the database
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

class DuplicateResolver {
    constructor() {
        this.notion = new Client({ auth: NOTION_TOKEN });
        this.databaseId = NOTION_DATABASE_ID;
        this.companies = [];
        this.duplicateGroups = [];
        this.resolutionResults = {
            duplicatesFound: 0,
            duplicatesResolved: 0,
            companiesMerged: 0,
            companiesDeleted: 0,
            errors: [],
            resolutions: []
        };
    }

    async resolveDuplicates() {
        console.log('🔍 Starting duplicate resolution process...');
        
        // Load duplicate groups from gap analysis
        await this.loadDuplicateGroups();
        
        // Fetch detailed company data
        await this.fetchCompanyDetails();
        
        // Analyze and resolve duplicates
        await this.analyzeAndResolve();
        
        // Save results
        await this.saveResults();
        
        console.log('✅ Duplicate resolution complete!');
        return this.resolutionResults;
    }

    async loadDuplicateGroups() {
        console.log('📋 Loading duplicate groups from gap analysis...');
        
        try {
            // Find the latest gap analysis file
            const reportFiles = await fs.readdir('data/reports');
            const gapFiles = reportFiles
                .filter(file => file.startsWith('database-gap-analysis-') && file.endsWith('.json'))
                .sort()
                .reverse();
            
            if (gapFiles.length === 0) {
                throw new Error('No gap analysis files found');
            }
            
            const gapData = JSON.parse(await fs.readFile(`data/reports/${gapFiles[0]}`, 'utf8'));
            this.duplicateGroups = gapData.duplicateCandidates || [];
            this.resolutionResults.duplicatesFound = this.duplicateGroups.length;
            
            console.log(`✅ Loaded ${this.duplicateGroups.length} duplicate groups`);
            
        } catch (error) {
            console.error('❌ Error loading duplicate groups:', error.message);
            throw error;
        }
    }

    async fetchCompanyDetails() {
        console.log('📊 Fetching detailed company information...');
        
        const companyIds = new Set();
        this.duplicateGroups.forEach(group => {
            group.companies.forEach(company => {
                companyIds.add(company.id);
            });
        });
        
        console.log(`   Fetching details for ${companyIds.size} companies...`);
        
        this.companies = [];
        for (const companyId of companyIds) {
            try {
                const company = await this.notion.pages.retrieve({
                    page_id: companyId
                });
                this.companies.push(company);
            } catch (error) {
                console.error(`   ⚠️  Error fetching ${companyId}:`, error.message);
                this.resolutionResults.errors.push({
                    companyId,
                    error: 'Failed to fetch company details',
                    details: error.message
                });
            }
        }
        
        console.log(`✅ Fetched details for ${this.companies.length} companies`);
    }

    async analyzeAndResolve() {
        console.log('🔀 Analyzing and resolving duplicates...');
        
        for (const group of this.duplicateGroups) {
            console.log(`\n📋 Resolving group: ${group.normalizedName}`);
            await this.resolveGroup(group);
        }
    }

    async resolveGroup(group) {
        // Get full company details for this group
        const groupCompanies = group.companies.map(companyRef => {
            return this.companies.find(company => company.id === companyRef.id);
        }).filter(Boolean);
        
        if (groupCompanies.length < 2) {
            console.log(`   ⚠️  Insufficient data for resolution`);
            return;
        }
        
        // Analyze which is the "master" record
        const master = this.selectMasterRecord(groupCompanies);
        const duplicates = groupCompanies.filter(company => company.id !== master.id);
        
        console.log(`   🎯 Master: ${this.getCompanyName(master)}`);
        console.log(`   🗑️  Duplicates: ${duplicates.map(d => this.getCompanyName(d)).join(', ')}`);
        
        // Merge data from duplicates into master
        await this.mergeCompanyData(master, duplicates);
        
        // Archive or delete duplicates
        await this.archiveDuplicates(duplicates);
        
        // Record resolution
        this.resolutionResults.resolutions.push({
            normalizedName: group.normalizedName,
            master: {
                id: master.id,
                name: this.getCompanyName(master)
            },
            merged: duplicates.map(d => ({
                id: d.id,
                name: this.getCompanyName(d)
            })),
            status: 'resolved'
        });
        
        this.resolutionResults.duplicatesResolved++;
        this.resolutionResults.companiesMerged += duplicates.length;
    }

    selectMasterRecord(companies) {
        // Score each company based on data completeness
        const scored = companies.map(company => ({
            company,
            score: this.calculateCompletenessScore(company)
        }));
        
        // Sort by score (highest first) and return the best one
        scored.sort((a, b) => b.score - a.score);
        
        console.log(`   📊 Completeness scores: ${scored.map(s => 
            `${this.getCompanyName(s.company)}=${s.score}`).join(', ')}`);
        
        return scored[0].company;
    }

    calculateCompletenessScore(company) {
        let score = 0;
        const properties = company.properties;
        
        // Score based on filled fields
        if (this.hasValue(properties.Website)) score += 10;
        if (this.hasValue(properties.LinkedIn)) score += 8;
        if (this.hasValue(properties.Funding)) score += 6;
        if (this.hasValue(properties['Key People'])) score += 5;
        if (this.hasValue(properties['Focus & Notes'])) score += 4;
        if (this.hasValue(properties.Category)) score += 3;
        if (this.hasValue(properties['BC Region'])) score += 2;
        if (this.hasValue(properties['Data Source'])) score += 1;
        
        return score;
    }

    hasValue(property) {
        if (!property) return false;
        
        switch (property.type) {
            case 'title':
                return property.title && property.title.length > 0 && 
                       property.title[0] && property.title[0].text.content.trim();
            
            case 'rich_text':
                return property.rich_text && property.rich_text.length > 0 &&
                       property.rich_text[0] && property.rich_text[0].text.content.trim();
            
            case 'url':
                return property.url && property.url.trim();
            
            case 'select':
                return property.select && property.select.name;
            
            case 'multi_select':
                return property.multi_select && property.multi_select.length > 0;
            
            default:
                return false;
        }
    }

    async mergeCompanyData(master, duplicates) {
        console.log(`   🔀 Merging data into master record...`);
        
        const updates = {};
        
        for (const duplicate of duplicates) {
            const dupProperties = duplicate.properties;
            const masterProperties = master.properties;
            
            // Merge each field if master is empty and duplicate has data
            
            // Website
            if (!this.hasValue(masterProperties.Website) && this.hasValue(dupProperties.Website)) {
                updates.Website = dupProperties.Website;
            }
            
            // LinkedIn
            if (!this.hasValue(masterProperties.LinkedIn) && this.hasValue(dupProperties.LinkedIn)) {
                updates.LinkedIn = dupProperties.LinkedIn;
            }
            
            // Funding
            if (!this.hasValue(masterProperties.Funding) && this.hasValue(dupProperties.Funding)) {
                updates.Funding = dupProperties.Funding;
            }
            
            // Key People (append if both have data)
            if (this.hasValue(dupProperties['Key People'])) {
                const existingPeople = this.getTextValue(masterProperties['Key People']);
                const newPeople = this.getTextValue(dupProperties['Key People']);
                
                if (!existingPeople) {
                    updates['Key People'] = dupProperties['Key People'];
                } else if (newPeople && !existingPeople.includes(newPeople)) {
                    updates['Key People'] = {
                        rich_text: [{ text: { content: `${existingPeople}; ${newPeople}` } }]
                    };
                }
            }
            
            // Focus & Notes (append if both have data)
            if (this.hasValue(dupProperties['Focus & Notes'])) {
                const existingNotes = this.getTextValue(masterProperties['Focus & Notes']);
                const newNotes = this.getTextValue(dupProperties['Focus & Notes']);
                
                if (!existingNotes) {
                    updates['Focus & Notes'] = dupProperties['Focus & Notes'];
                } else if (newNotes && !existingNotes.includes(newNotes)) {
                    updates['Focus & Notes'] = {
                        rich_text: [{ text: { content: `${existingNotes} | ${newNotes}` } }]
                    };
                }
            }
            
            // BC Region
            if (!this.hasValue(masterProperties['BC Region']) && this.hasValue(dupProperties['BC Region'])) {
                updates['BC Region'] = dupProperties['BC Region'];
            }
            
            // Category
            if (!this.hasValue(masterProperties.Category) && this.hasValue(dupProperties.Category)) {
                updates.Category = dupProperties.Category;
            }
        }
        
        // Apply updates if any
        if (Object.keys(updates).length > 0) {
            try {
                await this.notion.pages.update({
                    page_id: master.id,
                    properties: updates
                });
                
                console.log(`     ✅ Merged fields: ${Object.keys(updates).join(', ')}`);
                
            } catch (error) {
                console.error(`     ❌ Error merging data:`, error.message);
                this.resolutionResults.errors.push({
                    companyId: master.id,
                    error: 'Failed to merge data',
                    details: error.message
                });
            }
        } else {
            console.log(`     ℹ️  No additional data to merge`);
        }
    }

    getTextValue(property) {
        if (!property || !property.rich_text || property.rich_text.length === 0) {
            return '';
        }
        return property.rich_text[0].text.content;
    }

    async archiveDuplicates(duplicates) {
        console.log(`   🗑️  Archiving ${duplicates.length} duplicate(s)...`);
        
        for (const duplicate of duplicates) {
            try {
                await this.notion.pages.update({
                    page_id: duplicate.id,
                    archived: true
                });
                
                console.log(`     ✅ Archived: ${this.getCompanyName(duplicate)}`);
                this.resolutionResults.companiesDeleted++;
                
            } catch (error) {
                console.error(`     ❌ Error archiving ${this.getCompanyName(duplicate)}:`, error.message);
                this.resolutionResults.errors.push({
                    companyId: duplicate.id,
                    error: 'Failed to archive duplicate',
                    details: error.message
                });
            }
        }
    }

    getCompanyName(company) {
        const nameProperty = company.properties.Name;
        if (nameProperty && nameProperty.title && nameProperty.title[0]) {
            return nameProperty.title[0].text.content;
        }
        return 'Unknown';
    }

    async saveResults() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Save detailed results
        const resultsPath = `data/reports/duplicate-resolution-${timestamp}.json`;
        await fs.writeFile(resultsPath, JSON.stringify(this.resolutionResults, null, 2));
        
        // Generate summary report
        const summaryReport = this.generateSummaryReport();
        const summaryPath = `data/reports/duplicate-resolution-summary-${timestamp}.md`;
        await fs.writeFile(summaryPath, summaryReport);
        
        console.log(`📊 Resolution results saved to: ${resultsPath}`);
        console.log(`📋 Summary saved to: ${summaryPath}`);
    }

    generateSummaryReport() {
        const results = this.resolutionResults;
        
        return `# Duplicate Resolution Summary

## 📊 **Resolution Statistics**
- **Duplicate Groups Found**: ${results.duplicatesFound}
- **Duplicate Groups Resolved**: ${results.duplicatesResolved}
- **Companies Merged**: ${results.companiesMerged}
- **Companies Archived**: ${results.companiesDeleted}
- **Errors Encountered**: ${results.errors.length}
- **Resolution Date**: ${new Date().toLocaleDateString()}

## ✅ **Successful Resolutions**
${results.resolutions.map((resolution, index) => 
    `### Resolution ${index + 1}: ${resolution.normalizedName}
- **Master Record**: ${resolution.master.name} (${resolution.master.id})
- **Merged Companies**: ${resolution.merged.map(m => m.name).join(', ')}
- **Status**: ${resolution.status}`
).join('\n\n')}

## ❌ **Errors & Issues**
${results.errors.length > 0 ? 
    results.errors.map(error => `- **${error.companyId}**: ${error.error} - ${error.details}`).join('\n') :
    'No errors encountered during resolution process'}

## 📈 **Impact Assessment**
- **Database Cleanup**: ${results.companiesDeleted} duplicate entries removed
- **Data Quality**: Enhanced through intelligent merging
- **Success Rate**: ${results.duplicatesFound > 0 ? ((results.duplicatesResolved / results.duplicatesFound) * 100).toFixed(1) : 0}%

## 🚀 **Recommendations**
1. **Regular Monitoring**: Schedule periodic duplicate detection
2. **Data Entry Guidelines**: Establish standards to prevent future duplicates
3. **Quality Assurance**: Implement validation checks during data import

**Duplicate resolution completed successfully! Database quality improved! ✅**`;
    }

    async run() {
        try {
            const results = await this.resolveDuplicates();
            
            console.log('\n📋 DUPLICATE RESOLUTION SUMMARY:');
            console.log(`✅ Groups Found: ${results.duplicatesFound}`);
            console.log(`🔄 Groups Resolved: ${results.duplicatesResolved}`);
            console.log(`🗑️  Companies Archived: ${results.companiesDeleted}`);
            console.log(`❌ Errors: ${results.errors.length}`);
            
            return results;
            
        } catch (error) {
            console.error('❌ Duplicate resolution failed:', error);
            throw error;
        }
    }
}

// Execute if called directly
if (require.main === module) {
    const resolver = new DuplicateResolver();
    resolver.run().then(() => {
        console.log('✅ Duplicate resolution completed successfully!');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Resolution failed:', error);
        process.exit(1);
    });
}

module.exports = DuplicateResolver;