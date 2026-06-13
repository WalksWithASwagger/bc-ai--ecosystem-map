#!/usr/bin/env node

/**
 * Database Quality Scanner
 * Consolidated tool for database quality analysis and completeness reporting
 * Combines functionality from multiple analysis tools
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

class DatabaseScanner {
    constructor() {
        // Direct token access - MCP pattern
        this.notion = new Client({ 
            auth: process.env.NOTION_TOKEN
        });
        this.databaseId = '1f0c6f799a3381bd8332ca0235c24655';
        
        // Fields to analyze for completeness
        this.fields = [
            'Website', 'LinkedIn', 'Email', 'Phone', 
            'City/Region', 'BC Region', 'Category', 'AI Focus Areas',
            'Year Founded', 'Size', 'Short Blurb', 'Key People',
            'Latitude', 'Longitude', 'Logo', 'Funding',
            'Revenue', 'Valuation', 'Employee Count', 'Data Sources'
        ];
        
        // Priority fields for AI companies
        this.priorityFields = [
            'Website', 'Email', 'AI Focus Areas', 'Funding', 'Key People'
        ];
    }

    async scanDatabase() {
        console.log('🔍 Scanning Notion database...');
        
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

    getFieldValue(properties, fieldName) {
        const field = properties[fieldName];
        if (!field) return null;

        switch (field.type) {
            case 'title':
                return field.title?.[0]?.plain_text || null;
            case 'rich_text':
                return field.rich_text?.[0]?.plain_text || null;
            case 'url':
                return field.url || null;
            case 'email':
                return field.email || null;
            case 'phone_number':
                return field.phone_number || null;
            case 'select':
                return field.select?.name || null;
            case 'multi_select':
                return field.multi_select?.length > 0 ? field.multi_select.map(s => s.name) : null;
            case 'number':
                return field.number || null;
            case 'date':
                return field.date?.start || null;
            case 'files':
                return field.files?.length > 0 ? field.files : null;
            default:
                return null;
        }
    }

    analyzeCompleteness(organizations) {
        const analysis = {
            totalOrgs: organizations.length,
            fieldCompleteness: {},
            categoryBreakdown: {},
            aiCompanies: {
                total: 0,
                completeness: {}
            },
            mostIncomplete: [],
            overallScore: 0
        };

        // Initialize field counters
        this.fields.forEach(field => {
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
                name: this.getFieldValue(org.properties, 'Name') || 'Unnamed',
                category: this.getFieldValue(org.properties, 'Category'),
                missingFields: [],
                isAI: false
            };

            // Check if it's an AI company
            const category = orgAnalysis.category;
            const aiFocus = this.getFieldValue(org.properties, 'AI Focus Areas');
            orgAnalysis.isAI = category === 'AI Companies' || 
                              (aiFocus && aiFocus.length > 0) ||
                              category === 'Technology Companies';

            if (orgAnalysis.isAI) {
                analysis.aiCompanies.total++;
            }

            // Analyze field completeness
            this.fields.forEach(field => {
                const value = this.getFieldValue(org.properties, field);
                if (value) {
                    analysis.fieldCompleteness[field].complete++;
                    completedFields++;
                } else {
                    analysis.fieldCompleteness[field].incomplete++;
                    orgAnalysis.missingFields.push(field);
                }
            });

            orgAnalysis.completionScore = (completedFields / this.fields.length) * 100;
            
            // Track category breakdown
            if (category) {
                if (!analysis.categoryBreakdown[category]) {
                    analysis.categoryBreakdown[category] = { total: 0, avgCompleteness: 0 };
                }
                analysis.categoryBreakdown[category].total++;
            }

            return orgAnalysis;
        });

        // Calculate percentages
        this.fields.forEach(field => {
            const fc = analysis.fieldCompleteness[field];
            fc.percentage = Math.round((fc.complete / analysis.totalOrgs) * 100);
        });

        // Calculate AI company specific completeness
        const aiCompanies = orgScores.filter(org => org.isAI);
        this.priorityFields.forEach(field => {
            const complete = aiCompanies.filter(org => 
                !org.missingFields.includes(field)
            ).length;
            
            analysis.aiCompanies.completeness[field] = {
                complete: complete,
                total: analysis.aiCompanies.total,
                percentage: analysis.aiCompanies.total > 0 ? 
                    Math.round((complete / analysis.aiCompanies.total) * 100) : 0
            };
        });

        // Calculate category averages
        Object.keys(analysis.categoryBreakdown).forEach(category => {
            const categoryOrgs = orgScores.filter(org => org.category === category);
            const avgScore = categoryOrgs.reduce((sum, org) => sum + org.completionScore, 0) / categoryOrgs.length;
            analysis.categoryBreakdown[category].avgCompleteness = Math.round(avgScore);
        });

        // Find most incomplete organizations
        analysis.mostIncomplete = orgScores
            .sort((a, b) => a.completionScore - b.completionScore)
            .slice(0, 20)
            .map(org => ({
                name: org.name,
                category: org.category,
                completionScore: Math.round(org.completionScore),
                missingFields: org.missingFields.slice(0, 5)
            }));

        // Calculate overall score
        const totalCompleteness = Object.values(analysis.fieldCompleteness)
            .reduce((sum, field) => sum + field.percentage, 0);
        analysis.overallScore = Math.round(totalCompleteness / this.fields.length);

        return analysis;
    }

    identifyPriorityTargets(organizations) {
        const targets = {
            websiteDiscovery: [],
            emailEnrichment: [],
            fundingResearch: [],
            keyPeopleResearch: []
        };

        organizations.forEach(org => {
            const name = this.getFieldValue(org.properties, 'Name');
            const category = this.getFieldValue(org.properties, 'Category');
            const website = this.getFieldValue(org.properties, 'Website');
            const email = this.getFieldValue(org.properties, 'Email');
            const funding = this.getFieldValue(org.properties, 'Funding');
            const keyPeople = this.getFieldValue(org.properties, 'Key People');
            const aiFocus = this.getFieldValue(org.properties, 'AI Focus Areas');

            const isAI = category === 'AI Companies' || 
                        (aiFocus && aiFocus.length > 0) ||
                        category === 'Technology Companies';

            if (isAI) {
                // Website discovery targets
                if (!website) {
                    targets.websiteDiscovery.push({
                        id: org.id,
                        name: name,
                        category: category
                    });
                }

                // Email enrichment targets
                if (website && !email) {
                    targets.emailEnrichment.push({
                        id: org.id,
                        name: name,
                        website: website
                    });
                }

                // Funding research targets
                if (!funding) {
                    targets.fundingResearch.push({
                        id: org.id,
                        name: name,
                        website: website,
                        category: category
                    });
                }

                // Key people research targets
                if (!keyPeople) {
                    targets.keyPeopleResearch.push({
                        id: org.id,
                        name: name,
                        website: website
                    });
                }
            }
        });

        // Sort by priority (companies with websites first)
        ['emailEnrichment', 'fundingResearch', 'keyPeopleResearch'].forEach(targetType => {
            targets[targetType].sort((a, b) => {
                if (a.website && !b.website) return -1;
                if (!a.website && b.website) return 1;
                return 0;
            });
        });

        return targets;
    }

    generateMarkdownReport(analysis, targets) {
        const timestamp = new Date().toISOString().split('T')[0];
        
        let report = `# BC AI Ecosystem Database Quality Report\n\n`;
        report += `*Generated: ${new Date().toLocaleDateString()}*\n\n`;
        
        // Executive Summary
        report += `## Executive Summary\n\n`;
        report += `- **Total Organizations**: ${analysis.totalOrgs.toLocaleString()}\n`;
        report += `- **AI Companies**: ${analysis.aiCompanies.total.toLocaleString()}\n`;
        report += `- **Overall Completeness**: ${analysis.overallScore}%\n\n`;
        
        // Field Completeness
        report += `## Field Completeness\n\n`;
        report += `| Field | Complete | Incomplete | Percentage |\n`;
        report += `|-------|----------|------------|------------|\n`;
        
        this.fields.forEach(field => {
            const fc = analysis.fieldCompleteness[field];
            report += `| ${field} | ${fc.complete.toLocaleString()} | ${fc.incomplete.toLocaleString()} | ${fc.percentage}% |\n`;
        });
        
        // AI Company Priority Fields
        report += `\n## AI Company Priority Fields\n\n`;
        report += `*Focus areas for AI companies (${analysis.aiCompanies.total} total)*\n\n`;
        report += `| Field | Complete | Percentage |\n`;
        report += `|-------|----------|------------|\n`;
        
        this.priorityFields.forEach(field => {
            const ac = analysis.aiCompanies.completeness[field];
            if (ac) {
                report += `| ${field} | ${ac.complete.toLocaleString()} | ${ac.percentage}% |\n`;
            }
        });
        
        // Category Breakdown
        report += `\n## Category Breakdown\n\n`;
        report += `| Category | Count | Avg Completeness |\n`;
        report += `|----------|-------|------------------|\n`;
        
        Object.entries(analysis.categoryBreakdown)
            .sort((a, b) => b[1].total - a[1].total)
            .forEach(([category, data]) => {
                report += `| ${category} | ${data.total.toLocaleString()} | ${data.avgCompleteness}% |\n`;
            });
        
        // Priority Targets
        report += `\n## Enhancement Priorities\n\n`;
        
        Object.entries(targets).forEach(([targetType, companies]) => {
            if (companies.length > 0) {
                const title = targetType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                report += `### ${title} (${companies.length} companies)\n\n`;
                
                companies.slice(0, 10).forEach(company => {
                    report += `- **${company.name}**`;
                    if (company.category) report += ` (${company.category})`;
                    if (company.website) report += ` - [Website](${company.website})`;
                    report += `\n`;
                });
                
                if (companies.length > 10) {
                    report += `- *...and ${companies.length - 10} more*\n`;
                }
                report += `\n`;
            }
        });
        
        // Most Incomplete Organizations
        report += `## Most Incomplete Organizations\n\n`;
        report += `*Organizations with the lowest completion scores*\n\n`;
        
        analysis.mostIncomplete.forEach((org, index) => {
            report += `${index + 1}. **${org.name}** (${org.completionScore}%)`;
            if (org.category) report += ` - ${org.category}`;
            report += `\n   Missing: ${org.missingFields.join(', ')}\n\n`;
        });
        
        return report;
    }

    async generateReport(options = {}) {
        console.log('🚀 Database Quality Scanner');
        console.log('============================\n');
        
        // Scan database
        const organizations = await this.scanDatabase();
        
        // Analyze completeness
        console.log('\n📊 Analyzing completeness...');
        const analysis = this.analyzeCompleteness(organizations);
        
        // Identify priority targets
        console.log('🎯 Identifying enhancement priorities...');
        const targets = this.identifyPriorityTargets(organizations);
        
        // Generate reports
        const timestamp = new Date().toISOString().split('T')[0];
        const reportsDir = path.join(process.cwd(), 'data', 'quality-reports');
        
        // Ensure directory exists
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        // Markdown report
        const markdownReport = this.generateMarkdownReport(analysis, targets);
        const markdownPath = path.join(reportsDir, `database-quality-${timestamp}.md`);
        fs.writeFileSync(markdownPath, markdownReport);
        
        // JSON report
        const jsonReport = {
            generatedAt: new Date().toISOString(),
            analysis: analysis,
            targets: targets
        };
        const jsonPath = path.join(reportsDir, `database-quality-${timestamp}.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));
        
        // Print summary
        console.log('\n✅ Quality scan complete!');
        console.log(`📊 Overall completeness: ${analysis.overallScore}%`);
        console.log(`🏢 Total organizations: ${analysis.totalOrgs.toLocaleString()}`);
        console.log(`🤖 AI companies: ${analysis.aiCompanies.total.toLocaleString()}`);
        console.log(`📄 Markdown report: ${markdownPath}`);
        console.log(`📄 JSON report: ${jsonPath}`);
        
        // Show top priorities
        console.log('\n🎯 Top Enhancement Priorities:');
        Object.entries(targets).forEach(([type, companies]) => {
            if (companies.length > 0) {
                const title = type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                console.log(`   ${title}: ${companies.length} companies`);
            }
        });
        
        return jsonReport;
    }
}

// CLI interface
if (require.main === module) {
    const scanner = new DatabaseScanner();
    scanner.generateReport().catch(console.error);
}

module.exports = DatabaseScanner;