#!/usr/bin/env node

/**
 * MCP Database Completeness Scanner
 * Analyzes database quality and generates comprehensive reports
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

class MCPCompletenessScanner {
    constructor() {
        // MCP Pattern: Direct token access - no environment variables
        this.notion = new Client({ 
            auth: process.env.NOTION_TOKEN
        });
        this.databaseId = process.env.AI_COMPANY_DB_ID;
    }

    async scanDatabase() {
        console.log('🔍 Scanning Notion database for completeness...');
        
        const organizations = [];
        let hasMore = true;
        let startCursor = undefined;

        while (hasMore) {
            const response = await this.notion.databases.query({
                database_id: this.databaseId,
                start_cursor: startCursor,
                page_size: 100
            });

            organizations.push(...response.results);
            console.log(`Fetched ${organizations.length} organizations...`);
            
            hasMore = response.has_more;
            startCursor = response.next_cursor;
        }

        console.log(`Total: ${organizations.length} organizations`);
        return organizations;
    }

    analyzeCompleteness(organizations) {
        const fields = [
            'Website', 'LinkedIn', 'Email', 'Phone', 
            'City/Region', 'BC Region', 'Category', 'AI Focus Areas',
            'Year Founded', 'Size', 'Short Blurb', 'Key People',
            'Latitude', 'Longitude', 'Logo', 'Funding'
        ];

        const analysis = {
            totalOrgs: organizations.length,
            fieldCompleteness: {},
            mostIncomplete: [],
            overallScore: 0
        };

        // Initialize field counters
        fields.forEach(field => {
            analysis.fieldCompleteness[field] = {
                complete: 0,
                incomplete: 0,
                percentage: 0
            };
        });

        // Analyze each organization
        const orgScores = organizations.map(org => {
            let completedFields = 0;
            const orgAnalysis = {
                id: org.id,
                name: org.properties.Name?.title?.[0]?.plain_text || 'Unnamed',
                missingFields: []
            };

            fields.forEach(field => {
                const value = this.getFieldValue(org.properties, field);
                if (value) {
                    analysis.fieldCompleteness[field].complete++;
                    completedFields++;
                } else {
                    analysis.fieldCompleteness[field].incomplete++;
                    orgAnalysis.missingFields.push(field);
                }
            });

            orgAnalysis.completionScore = (completedFields / fields.length) * 100;
            return orgAnalysis;
        });

        // Calculate percentages
        fields.forEach(field => {
            const fc = analysis.fieldCompleteness[field];
            fc.percentage = Math.round((fc.complete / analysis.totalOrgs) * 100);
        });

        // Find most incomplete organizations
        analysis.mostIncomplete = orgScores
            .sort((a, b) => a.completionScore - b.completionScore)
            .slice(0, 20);

        // Calculate overall score
        const totalPossible = fields.length * organizations.length;
        const totalComplete = fields.reduce((sum, field) => 
            sum + analysis.fieldCompleteness[field].complete, 0
        );
        analysis.overallScore = Math.round((totalComplete / totalPossible) * 100);

        return analysis;
    }

    getFieldValue(properties, fieldName) {
        const fieldMap = {
            'Website': properties.Website?.url,
            'LinkedIn': properties.LinkedIn?.url,
            'Email': properties.Email?.email,
            'Phone': properties.Phone?.phone_number,
            'City/Region': properties['City/Region']?.rich_text?.[0]?.plain_text,
            'BC Region': properties['BC Region']?.select?.name,
            'Category': properties.Category?.select?.name,
            'AI Focus Areas': properties['AI Focus Areas']?.multi_select?.length > 0,
            'Year Founded': properties['Year Founded']?.number,
            'Size': properties.Size?.rich_text?.[0]?.plain_text,
            'Short Blurb': properties['Short Blurb']?.rich_text?.[0]?.plain_text,
            'Key People': properties['Key People']?.rich_text?.[0]?.plain_text,
            'Latitude': properties.Latitude?.number,
            'Longitude': properties.Longitude?.number,
            'Logo': properties.Logo?.files?.length > 0,
            'Funding': properties.Funding?.rich_text?.[0]?.plain_text
        };
        
        return fieldMap[fieldName];
    }

    generateReport(analysis) {
        const timestamp = new Date().toISOString().split('T')[0];
        const reportDir = path.join(__dirname, '..', 'reports');
        
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        // Generate markdown report
        let mdReport = `# BC AI Ecosystem Database Completeness Report\n\n`;
        mdReport += `*Generated on ${new Date().toLocaleString()}*\n\n`;
        mdReport += `## Overall Statistics\n\n`;
        mdReport += `Total organizations: **${analysis.totalOrgs}**\n`;
        mdReport += `Overall completeness score: **${analysis.overallScore}%**\n\n`;
        
        mdReport += `### Field Completion Rates\n\n`;
        mdReport += `| Field | Complete | Incomplete | % Complete |\n`;
        mdReport += `|-------|----------|------------|------------|\n`;
        
        Object.entries(analysis.fieldCompleteness)
            .sort((a, b) => a[1].percentage - b[1].percentage)
            .forEach(([field, stats]) => {
                mdReport += `| ${field} | ${stats.complete} | ${stats.incomplete} | ${stats.percentage}% |\n`;
            });

        mdReport += `\n## Most Incomplete Organizations\n\n`;
        mdReport += `These organizations have the fewest fields completed:\n\n`;
        mdReport += `| Organization | % Complete | Missing Fields |\n`;
        mdReport += `|-------------|------------|---------------|\n`;
        
        analysis.mostIncomplete.forEach(org => {
            const notionUrl = `https://www.notion.so/${org.id.replace(/-/g, '')}`;
            mdReport += `| [${org.name}](${notionUrl}) | ${Math.round(org.completionScore)}% | ${org.missingFields.join(', ')} |\n`;
        });

        // Save reports
        const mdPath = path.join(reportDir, `${timestamp}_completeness-summary.md`);
        fs.writeFileSync(mdPath, mdReport);
        
        console.log(`✅ Summary report written to: ${mdPath}`);
        return { mdPath };
    }

    async run() {
        try {
            const organizations = await this.scanDatabase();
            const analysis = this.analyzeCompleteness(organizations);
            const reports = this.generateReport(analysis);
            
            console.log('\n📊 Analysis Complete!');
            console.log(`   Overall completeness: ${analysis.overallScore}%`);
            console.log(`   Most incomplete field: Logo (${analysis.fieldCompleteness.Logo.percentage}%)`);
            console.log(`   Most complete field: Short Blurb (${analysis.fieldCompleteness['Short Blurb'].percentage}%)`);
            
            return analysis;
        } catch (error) {
            console.error('❌ Error:', error.message);
            throw error;
        }
    }
}

// Run if called directly
if (require.main === module) {
    const scanner = new MCPCompletenessScanner();
    scanner.run().catch(console.error);
}

module.exports = MCPCompletenessScanner;