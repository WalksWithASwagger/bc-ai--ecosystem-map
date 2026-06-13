/**
 * Find Missing Logos - Identify companies that need logos
 */

const { Client } = require('@notionhq/client');
const fs = require('fs').promises;

// Initialize Notion client
const notion = new Client({
    auth: process.env.NOTION_TOKEN
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

// High-priority companies that should have logos
const HIGH_PRIORITY_COMPANIES = [
    'Clio', 'D-Wave Systems', 'Sanctuary AI', 'AbCellera', 'Terramera',
    'Hootsuite', 'Avigilon', 'UrbanLogiq', 'MetaOptima', 'Nimble AI',
    'Zenhub', 'Finger Food ATG', 'Redlen Technologies', 'Copilot',
    'Phreesia', 'Plotly', 'Elastic Path', 'BuildDirect', 'Codebase Ventures',
    'BroadbandTV', 'Vision Critical', 'Mobify', 'Klue', 'Procurify'
];

class LogoFinder {
    constructor() {
        this.results = {
            totalCompanies: 0,
            withLogos: 0,
            withoutLogos: 0,
            highPriorityMissing: [],
            allMissing: [],
            logoSources: new Map()
        };
    }

    // Get all companies from Notion
    async getAllCompanies() {
        console.log('📊 Fetching all companies from Notion database...');
        
        const companies = [];
        let cursor = undefined;
        
        do {
            const response = await notion.databases.query({
                database_id: DATABASE_ID,
                start_cursor: cursor,
                page_size: 100
            });
            
            companies.push(...response.results);
            cursor = response.next_cursor;
        } while (cursor);
        
        console.log(`✅ Found ${companies.length} companies in database`);
        return companies;
    }

    // Check if company has a logo
    hasLogo(company) {
        const logoFiles = company.properties.Logo?.files;
        return logoFiles && logoFiles.length > 0;
    }

    // Get company website for logo scraping
    getWebsite(company) {
        return company.properties.Website?.url || '';
    }

    // Get company category for prioritization
    getCategory(company) {
        return company.properties.Category?.select?.name || 'Unknown';
    }

    // Get funding info for prioritization
    getFunding(company) {
        return company.properties.Funding?.rich_text?.[0]?.text?.content || '';
    }

    // Analyze companies for logo needs
    async analyzeLogoNeeds() {
        try {
            console.log('🔍 Analyzing logo needs across BC AI ecosystem...\n');
            
            const companies = await this.getAllCompanies();
            
            for (const company of companies) {
                this.results.totalCompanies++;
                
                const name = company.properties.Name?.title?.[0]?.text?.content || '';
                const website = this.getWebsite(company);
                const category = this.getCategory(company);
                const funding = this.getFunding(company);
                const hasLogo = this.hasLogo(company);
                
                const companyInfo = {
                    id: company.id,
                    name,
                    website,
                    category,
                    funding,
                    isHighPriority: HIGH_PRIORITY_COMPANIES.includes(name)
                };
                
                if (hasLogo) {
                    this.results.withLogos++;
                    
                    // Track logo sources for reference
                    const logoUrl = company.properties.Logo?.files?.[0]?.external?.url || 
                                   company.properties.Logo?.files?.[0]?.file?.url || 'uploaded';
                    this.results.logoSources.set(name, logoUrl);
                } else {
                    this.results.withoutLogos++;
                    this.results.allMissing.push(companyInfo);
                    
                    if (companyInfo.isHighPriority) {
                        this.results.highPriorityMissing.push(companyInfo);
                    }
                }
            }
            
            this.generateReport();
            await this.generateCollectionPlan();
            
        } catch (error) {
            console.error('❌ Error analyzing logo needs:', error.message);
            throw error;
        }
    }

    // Generate analysis report
    generateReport() {
        console.log('\n' + '='.repeat(70));
        console.log('🎨 LOGO ANALYSIS REPORT');
        console.log('='.repeat(70));
        
        console.log(`📊 Total companies: ${this.results.totalCompanies}`);
        console.log(`✅ With logos: ${this.results.withLogos} (${((this.results.withLogos / this.results.totalCompanies) * 100).toFixed(1)}%)`);
        console.log(`❌ Without logos: ${this.results.withoutLogos} (${((this.results.withoutLogos / this.results.totalCompanies) * 100).toFixed(1)}%)`);
        
        console.log(`\n🎯 High priority missing: ${this.results.highPriorityMissing.length} companies`);
        
        // Show high priority missing companies
        if (this.results.highPriorityMissing.length > 0) {
            console.log('\n🚨 HIGH PRIORITY COMPANIES MISSING LOGOS:');
            this.results.highPriorityMissing.forEach((company, index) => {
                console.log(`\n${index + 1}. ${company.name}`);
                console.log(`   Category: ${company.category}`);
                if (company.website) console.log(`   Website: ${company.website}`);
                if (company.funding) console.log(`   Funding: ${company.funding.substring(0, 100)}...`);
            });
        }
        
        // Category breakdown of missing logos
        const categoryBreakdown = new Map();
        this.results.allMissing.forEach(company => {
            const count = categoryBreakdown.get(company.category) || 0;
            categoryBreakdown.set(company.category, count + 1);
        });
        
        console.log('\n📋 MISSING LOGOS BY CATEGORY:');
        [...categoryBreakdown.entries()]
            .sort((a, b) => b[1] - a[1])
            .forEach(([category, count]) => {
                console.log(`   ${category}: ${count} companies`);
            });
    }

    // Generate logo collection plan
    async generateCollectionPlan() {
        const plan = {
            date: new Date().toISOString(),
            summary: {
                totalMissing: this.results.withoutLogos,
                highPriority: this.results.highPriorityMissing.length,
                completionRate: ((this.results.withLogos / this.results.totalCompanies) * 100).toFixed(1)
            },
            targets: {
                highPriority: this.results.highPriorityMissing,
                withWebsites: this.results.allMissing.filter(c => c.website),
                funded: this.results.allMissing.filter(c => c.funding)
            },
            strategies: [
                {
                    method: 'Website Scraping',
                    targets: this.results.allMissing.filter(c => c.website).length,
                    effort: 'Medium',
                    quality: 'High'
                },
                {
                    method: 'Clearbit API',
                    targets: this.results.allMissing.filter(c => c.website).length,
                    effort: 'Low',
                    quality: 'Medium'
                },
                {
                    method: 'Manual Collection',
                    targets: this.results.highPriorityMissing.length,
                    effort: 'High',
                    quality: 'Very High'
                }
            ]
        };
        
        // Save plan to file
        const planPath = '../data/reports/logo-collection-plan.json';
        await fs.writeFile(planPath, JSON.stringify(plan, null, 2));
        
        console.log('\n📋 COLLECTION STRATEGY:');
        plan.strategies.forEach((strategy, index) => {
            console.log(`\n${index + 1}. ${strategy.method}`);
            console.log(`   Targets: ${strategy.targets} companies`);
            console.log(`   Effort: ${strategy.effort}`);
            console.log(`   Quality: ${strategy.quality}`);
        });
        
        console.log(`\n💾 Detailed plan saved to: ${planPath}`);
        
        console.log('\n🎯 RECOMMENDED NEXT STEPS:');
        console.log('1. Start with high-priority companies (manual collection)');
        console.log('2. Build web scraper for companies with websites');
        console.log('3. Use Clearbit API for bulk logo discovery');
        console.log('4. Set up automated pipeline for new companies');
    }
}

// Main execution
async function main() {
    // Check environment variables
    if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
        console.error('❌ Missing required environment variables:');
        console.error('   NOTION_TOKEN - Your Notion integration token');
        console.error('   NOTION_DATABASE_ID - Your database ID');
        console.log('\n💡 This is a dry run showing what analysis would be performed.');
        console.log('📋 Expected to find companies missing logos and prioritize collection.\n');
        return;
    }
    
    const finder = new LogoFinder();
    await finder.analyzeLogoNeeds();
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

module.exports = LogoFinder;