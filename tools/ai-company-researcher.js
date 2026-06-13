#!/usr/bin/env node

/**
 * AI Company Deep Researcher
 * Consolidated tool for comprehensive AI company research
 * Combines functionality from multiple research tools into one master tool
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class AICompanyResearcher {
    constructor() {
        // Direct token access - MCP pattern
        this.notion = new Client({ 
            auth: process.env.NOTION_TOKEN
        });
        this.databaseId = process.env.AI_COMPANY_DB_ID;
        
        // Research checklist for each company
        this.researchChecklist = [
            "1. Check Crunchbase for funding rounds and amounts",
            "2. Verify LinkedIn for current employee count",
            "3. Search TechCrunch/BetaKit for recent funding news",
            "4. Check company website for press releases",
            "5. Search for recent news articles (2024-2025)",
            "6. Look for patent filings or innovation awards",
            "7. Find key leadership (CEO, CTO, founders)",
            "8. Identify AI focus areas and applications",
            "9. Research competitive positioning",
            "10. Find customer case studies or traction metrics"
        ];
        
        // AI focus area mapping
        this.aiFocusAreas = [
            'Computer Vision', 'Natural Language Processing', 'Machine Learning',
            'Deep Learning', 'Robotics', 'Autonomous Systems', 'Predictive Analytics',
            'AI Infrastructure', 'Conversational AI', 'Generative AI', 'MLOps',
            'Computer Graphics', 'Speech Recognition', 'Recommendation Systems',
            'Fraud Detection', 'Process Automation', 'Decision Support'
        ];
    }

    async findCompaniesForResearch(criteria = {}) {
        console.log('🔍 Finding companies for deep research...\n');
        
        const filter = {
            and: []
        };
        
        // Default: Find AI companies with basic info but missing deep research
        if (criteria.aiOnly !== false) {
            filter.and.push({
                or: [
                    { property: 'Category', select: { equals: 'AI Companies' } },
                    { property: 'AI Focus Areas', multi_select: { is_not_empty: true } }
                ]
            });
        }
        
        // Companies missing funding information
        if (criteria.needsFunding) {
            filter.and.push({ property: 'Funding', rich_text: { is_empty: true } });
        }
        
        // Companies missing key people
        if (criteria.needsKeyPeople) {
            filter.and.push({ property: 'Key People', rich_text: { is_empty: true } });
        }
        
        const response = await this.notion.databases.query({
            database_id: this.databaseId,
            filter: filter,
            sorts: [{ property: 'Year Founded', direction: 'descending' }],
            page_size: criteria.limit || 20
        });
        
        console.log(`Found ${response.results.length} companies for research`);
        return response.results;
    }

    async researchCompany(company) {
        const name = company.properties.Name?.title?.[0]?.plain_text || 'Unknown';
        const website = company.properties.Website?.url;
        const linkedin = company.properties.LinkedIn?.url;
        
        console.log(`\n${'='.repeat(80)}`);
        console.log(`🔍 RESEARCHING: ${name}`);
        console.log(`${'='.repeat(80)}`);
        console.log(`Website: ${website || 'Not found'}`);
        console.log(`LinkedIn: ${linkedin || 'Not found'}`);
        
        const research = {
            companyId: company.id,
            companyName: name,
            timestamp: new Date().toISOString(),
            sources: [],
            findings: {}
        };
        
        // Research website if available
        if (website) {
            console.log('\n📱 Analyzing company website...');
            const websiteData = await this.analyzeWebsite(website, name);
            research.findings.website = websiteData;
        }
        
        // Generate research queries
        console.log('\n🔍 Suggested Research Queries:');
        this.generateResearchQueries(name).forEach(query => {
            console.log(`   ${query}`);
        });
        
        console.log('\n📋 Research Checklist:');
        this.researchChecklist.forEach(item => console.log(`   ${item}`));
        
        return research;
    }

    async analyzeWebsite(website, companyName) {
        try {
            console.log(`   Fetching ${website}...`);
            const response = await axios.get(website, { 
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; BC-AI-Research/1.0)'
                }
            });
            
            const content = response.data.toLowerCase();
            const analysis = {
                url: website,
                accessible: true,
                findings: {}
            };
            
            // Look for AI-related keywords
            const aiKeywords = [
                'artificial intelligence', 'machine learning', 'deep learning',
                'computer vision', 'natural language', 'automation', 'robotics',
                'predictive analytics', 'neural network', 'algorithm'
            ];
            
            analysis.findings.aiKeywords = aiKeywords.filter(keyword => 
                content.includes(keyword)
            );
            
            // Look for funding/traction indicators
            const tractionKeywords = [
                'series a', 'series b', 'seed funding', 'raised', 'million',
                'customers', 'clients', 'enterprise', 'fortune 500'
            ];
            
            analysis.findings.tractionIndicators = tractionKeywords.filter(keyword => 
                content.includes(keyword)
            );
            
            // Extract potential key people (basic)
            const peopleRegex = /(ceo|founder|president|cto|chief)\s+([a-z\s]+)/gi;
            const peopleMatches = content.match(peopleRegex) || [];
            analysis.findings.potentialKeyPeople = peopleMatches.slice(0, 5);
            
            console.log(`   ✅ Website analyzed - Found ${analysis.findings.aiKeywords.length} AI keywords`);
            return analysis;
            
        } catch (error) {
            console.log(`   ❌ Could not analyze website: ${error.message}`);
            return {
                url: website,
                accessible: false,
                error: error.message
            };
        }
    }

    generateResearchQueries(companyName) {
        return [
            `"${companyName}" funding announcement site:crunchbase.com`,
            `"${companyName}" raises OR raised site:techcrunch.com`,
            `"${companyName}" series A OR seed OR funding 2024 OR 2025`,
            `"${companyName}" BC tech news artificial intelligence`,
            `"${companyName}" employees LinkedIn company size`,
            `"${companyName}" AI machine learning technology`,
            `"${companyName}" customers case studies enterprise`,
            `"${companyName}" patent filing innovation award`
        ];
    }

    async updateCompanyWithResearch(companyId, researchData) {
        console.log('\n💾 Updating company with research findings...');
        
        const updates = {};
        
        // Add data sources
        if (researchData.sources.length > 0) {
            updates['Data Sources'] = {
                rich_text: [{ 
                    text: { 
                        content: `Research conducted ${researchData.timestamp}. Sources: ${researchData.sources.join(', ')}` 
                    } 
                }]
            };
        }
        
        // Update last verified
        updates['Last Verified'] = {
            date: { start: new Date().toISOString().split('T')[0] }
        };
        
        try {
            await this.notion.pages.update({
                page_id: companyId,
                properties: updates
            });
            
            console.log('   ✅ Company updated with research data');
            return true;
        } catch (error) {
            console.log(`   ❌ Failed to update company: ${error.message}`);
            return false;
        }
    }

    async generateResearchReport(companies, researchData) {
        const timestamp = new Date().toISOString().split('T')[0];
        const reportPath = path.join(process.cwd(), 'data', 'research', `ai-company-research-${timestamp}.json`);
        
        // Ensure directory exists
        const dir = path.dirname(reportPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        const report = {
            generatedAt: new Date().toISOString(),
            totalCompanies: companies.length,
            researchData: researchData,
            summary: {
                companiesWithWebsites: companies.filter(c => c.properties.Website?.url).length,
                companiesWithLinkedIn: companies.filter(c => c.properties.LinkedIn?.url).length,
                averageResearchScore: researchData.reduce((sum, r) => sum + (r.findings?.score || 0), 0) / researchData.length
            }
        };
        
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📊 Research report saved: ${reportPath}`);
        
        return report;
    }

    async run(options = {}) {
        console.log('🚀 AI Company Deep Research Tool');
        console.log('==================================\n');
        
        const companies = await this.findCompaniesForResearch({
            aiOnly: options.aiOnly !== false,
            needsFunding: options.funding,
            needsKeyPeople: options.keyPeople,
            limit: options.limit || 10
        });
        
        if (companies.length === 0) {
            console.log('No companies found matching criteria.');
            return;
        }
        
        const researchData = [];
        
        for (const company of companies) {
            const research = await this.researchCompany(company);
            researchData.push(research);
            
            // Add delay to avoid overwhelming websites
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Generate report
        const report = await this.generateResearchReport(companies, researchData);
        
        console.log('\n✅ Research complete!');
        console.log(`📊 Report generated with ${researchData.length} company profiles`);
        
        return report;
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {};
    
    // Parse arguments
    args.forEach(arg => {
        if (arg.startsWith('--limit=')) {
            options.limit = parseInt(arg.split('=')[1]);
        } else if (arg === '--funding') {
            options.funding = true;
        } else if (arg === '--key-people') {
            options.keyPeople = true;
        } else if (arg === '--all-companies') {
            options.aiOnly = false;
        }
    });
    
    const researcher = new AICompanyResearcher();
    researcher.run(options).catch(console.error);
}

module.exports = AICompanyResearcher;