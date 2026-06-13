#!/usr/bin/env node

/**
 * Database Gap Analysis Tool
 * Analyzes Notion database to identify empty fields and enrichment opportunities
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

class DatabaseGapAnalyzer {
    constructor() {
        this.notion = new Client({ auth: NOTION_TOKEN });
        this.databaseId = NOTION_DATABASE_ID;
        this.companies = [];
        this.gapAnalysis = {
            totalCompanies: 0,
            fieldAnalysis: {},
            emptyFieldCounts: {},
            completionRates: {},
            priorityEnrichment: [],
            duplicateCandidates: []
        };
    }

    async analyzeDatabase() {
        console.log('🔍 Starting comprehensive database gap analysis...');
        
        // Fetch all companies from database
        await this.fetchAllCompanies();
        
        // Analyze field completeness
        await this.analyzeFieldCompleteness();
        
        // Detect potential duplicates
        await this.detectPotentialDuplicates();
        
        // Generate recommendations
        await this.generateEnrichmentRecommendations();
        
        // Save analysis results
        await this.saveAnalysisResults();
        
        console.log('✅ Database gap analysis complete!');
        return this.gapAnalysis;
    }

    async fetchAllCompanies() {
        console.log('📊 Fetching all companies from Notion database...');
        
        let hasMore = true;
        let startCursor = undefined;
        
        while (hasMore) {
            try {
                const response = await this.notion.databases.query({
                    database_id: this.databaseId,
                    start_cursor: startCursor,
                    page_size: 100
                });
                
                this.companies.push(...response.results);
                hasMore = response.has_more;
                startCursor = response.next_cursor;
                
                console.log(`   Fetched ${this.companies.length} companies so far...`);
                
            } catch (error) {
                console.error('❌ Error fetching companies:', error.message);
                break;
            }
        }
        
        this.gapAnalysis.totalCompanies = this.companies.length;
        console.log(`✅ Total companies fetched: ${this.companies.length}`);
    }

    async analyzeFieldCompleteness() {
        console.log('📋 Analyzing field completeness...');
        
        const fields = [
            'Name', 'Website', 'LinkedIn', 'Focus & Notes', 'Funding', 
            'Category', 'BC Region', 'City/Region', 'Key People', 
            'Founded', 'Company Size', 'Logo', 'Data Source'
        ];
        
        // Initialize field analysis
        fields.forEach(field => {
            this.gapAnalysis.fieldAnalysis[field] = {
                total: 0,
                filled: 0,
                empty: 0,
                completionRate: 0
            };
        });
        
        // Analyze each company
        for (const company of this.companies) {
            const properties = company.properties;
            
            fields.forEach(field => {
                this.gapAnalysis.fieldAnalysis[field].total++;
                
                if (this.isFieldEmpty(properties[field], field)) {
                    this.gapAnalysis.fieldAnalysis[field].empty++;
                } else {
                    this.gapAnalysis.fieldAnalysis[field].filled++;
                }
            });
        }
        
        // Calculate completion rates
        fields.forEach(field => {
            const analysis = this.gapAnalysis.fieldAnalysis[field];
            analysis.completionRate = ((analysis.filled / analysis.total) * 100).toFixed(1);
            this.gapAnalysis.emptyFieldCounts[field] = analysis.empty;
            this.gapAnalysis.completionRates[field] = analysis.completionRate;
        });
        
        console.log('✅ Field completeness analysis complete');
    }

    isFieldEmpty(property, fieldName) {
        if (!property) return true;
        
        switch (property.type) {
            case 'title':
                return !property.title || property.title.length === 0 || 
                       !property.title[0] || !property.title[0].text.content.trim();
            
            case 'rich_text':
                return !property.rich_text || property.rich_text.length === 0 ||
                       !property.rich_text[0] || !property.rich_text[0].text.content.trim();
            
            case 'url':
                return !property.url || !property.url.trim();
            
            case 'select':
                return !property.select || !property.select.name;
            
            case 'multi_select':
                return !property.multi_select || property.multi_select.length === 0;
            
            case 'number':
                return property.number === null || property.number === undefined;
            
            case 'files':
                return !property.files || property.files.length === 0;
            
            default:
                return true;
        }
    }

    async detectPotentialDuplicates() {
        console.log('🔍 Detecting potential duplicates...');
        
        const nameMap = new Map();
        const duplicateCandidates = [];
        
        for (const company of this.companies) {
            const name = this.getCompanyName(company);
            if (!name) continue;
            
            const normalizedName = this.normalizeName(name);
            
            if (nameMap.has(normalizedName)) {
                // Potential duplicate found
                const existingCompany = nameMap.get(normalizedName);
                duplicateCandidates.push({
                    normalizedName,
                    companies: [
                        {
                            id: existingCompany.id,
                            name: this.getCompanyName(existingCompany),
                            url: existingCompany.url
                        },
                        {
                            id: company.id,
                            name: this.getCompanyName(company),
                            url: company.url
                        }
                    ]
                });
            } else {
                nameMap.set(normalizedName, company);
            }
        }
        
        this.gapAnalysis.duplicateCandidates = duplicateCandidates;
        console.log(`⚠️  Found ${duplicateCandidates.length} potential duplicate groups`);
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

    async generateEnrichmentRecommendations() {
        console.log('💡 Generating enrichment recommendations...');
        
        // Sort fields by completion rate (lowest first = highest priority)
        const fieldsByPriority = Object.entries(this.gapAnalysis.completionRates)
            .sort(([,a], [,b]) => parseFloat(a) - parseFloat(b))
            .map(([field, rate]) => ({
                field,
                completionRate: rate,
                emptyCount: this.gapAnalysis.emptyFieldCounts[field],
                priority: this.calculatePriority(field, rate)
            }));
        
        this.gapAnalysis.priorityEnrichment = fieldsByPriority;
        
        console.log('✅ Enrichment recommendations generated');
    }

    calculatePriority(field, completionRate) {
        const rate = parseFloat(completionRate);
        const strategicFields = ['Website', 'LinkedIn', 'Funding', 'Key People', 'Founded'];
        
        if (strategicFields.includes(field) && rate < 50) return 'HIGH';
        if (rate < 30) return 'HIGH';
        if (rate < 60) return 'MEDIUM';
        return 'LOW';
    }

    async saveAnalysisResults() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Save detailed analysis
        const analysisPath = `data/reports/database-gap-analysis-${timestamp}.json`;
        await fs.writeFile(analysisPath, JSON.stringify(this.gapAnalysis, null, 2));
        
        // Generate summary report
        const summaryReport = this.generateSummaryReport();
        const summaryPath = `data/reports/database-gap-summary-${timestamp}.md`;
        await fs.writeFile(summaryPath, summaryReport);
        
        console.log(`📊 Analysis saved to: ${analysisPath}`);
        console.log(`📋 Summary saved to: ${summaryPath}`);
    }

    generateSummaryReport() {
        const summary = this.gapAnalysis;
        
        return `# Database Gap Analysis Summary

## 📊 **Overall Statistics**
- **Total Companies**: ${summary.totalCompanies}
- **Potential Duplicates**: ${summary.duplicateCandidates.length} groups
- **Analysis Date**: ${new Date().toLocaleDateString()}

## 📋 **Field Completion Rates**

${Object.entries(summary.completionRates)
    .sort(([,a], [,b]) => parseFloat(a) - parseFloat(b))
    .map(([field, rate]) => `- **${field}**: ${rate}% complete (${summary.emptyFieldCounts[field]} empty)`)
    .join('\n')}

## 🎯 **Priority Enrichment Opportunities**

### HIGH Priority Fields
${summary.priorityEnrichment
    .filter(item => item.priority === 'HIGH')
    .map(item => `- **${item.field}**: ${item.completionRate}% complete (${item.emptyCount} empty)`)
    .join('\n')}

### MEDIUM Priority Fields  
${summary.priorityEnrichment
    .filter(item => item.priority === 'MEDIUM')
    .map(item => `- **${item.field}**: ${item.completionRate}% complete (${item.emptyCount} empty)`)
    .join('\n')}

## ⚠️ **Potential Duplicates**

${summary.duplicateCandidates.length > 0 ? 
    summary.duplicateCandidates.map((group, index) => 
        `### Duplicate Group ${index + 1}
- **Normalized Name**: ${group.normalizedName}
- **Companies**: 
${group.companies.map(company => `  - ${company.name} (${company.id})`).join('\n')}`
    ).join('\n\n') : 
    'No potential duplicates detected.'}

## 📈 **Enrichment Impact Potential**

Based on this analysis, successful data enrichment could:
- Fill ${Object.values(summary.emptyFieldCounts).reduce((a, b) => a + b, 0)} empty field values
- Resolve ${summary.duplicateCandidates.length} potential duplicate groups
- Significantly improve database completeness and quality

## 🚀 **Recommended Next Steps**

1. **Address HIGH priority fields** first (${summary.priorityEnrichment.filter(item => item.priority === 'HIGH').length} fields)
2. **Review duplicate candidates** for potential merging
3. **Process research files** to extract enrichment data
4. **Implement smart merging** to avoid data overwrites

**Database enhancement opportunity identified! Ready for enrichment phase! 🎯**`;
    }

    async run() {
        try {
            const analysis = await this.analyzeDatabase();
            
            console.log('\n📋 GAP ANALYSIS SUMMARY:');
            console.log(`✅ Total Companies Analyzed: ${analysis.totalCompanies}`);
            console.log(`⚠️  Potential Duplicates: ${analysis.duplicateCandidates.length} groups`);
            console.log(`🎯 High Priority Fields: ${analysis.priorityEnrichment.filter(item => item.priority === 'HIGH').length}`);
            console.log(`📊 Total Empty Fields: ${Object.values(analysis.emptyFieldCounts).reduce((a, b) => a + b, 0)}`);
            
            return analysis;
            
        } catch (error) {
            console.error('❌ Gap analysis failed:', error);
            throw error;
        }
    }
}

// Execute if called directly
if (require.main === module) {
    const analyzer = new DatabaseGapAnalyzer();
    analyzer.run().then(() => {
        console.log('✅ Database gap analysis completed successfully!');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Analysis failed:', error);
        process.exit(1);
    });
}

module.exports = DatabaseGapAnalyzer;