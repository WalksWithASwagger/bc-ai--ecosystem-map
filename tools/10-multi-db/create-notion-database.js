#!/usr/bin/env node

/**
 * Create Notion Database for Funding Intelligence
 * Creates a proper Notion database and imports all 324 enriched funders
 */

const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

class NotionDatabaseCreator {
    constructor() {
        this.notion = new Client({ 
            auth: process.env.NOTION_TOKEN
        });
        this.projectPath = '/Users/kk/ecosystem-map-bc-ai/data/projects/funding-intelligence';
        this.parentPageId = '9212662f2cd3451bbde3470b9018ea12'; // Your funding page
        this.funders = [];
        this.createdDatabaseId = null;
    }

    async loadLatestFunders() {
        console.log('📊 Loading latest enriched funders...');
        
        const enrichedDir = `${this.projectPath}/data/enriched`;
        const files = fs.readdirSync(enrichedDir).filter(f => f.includes('funding-enriched'));
        const latestFile = files.sort().pop();
        const data = JSON.parse(fs.readFileSync(path.join(enrichedDir, latestFile), 'utf8'));
        
        this.funders = data.funders;
        console.log(`✅ Loaded ${this.funders.length} funders`);
        
        return this.funders;
    }

    async createDatabase() {
        console.log('🏗️ Creating Notion database...');
        
        const databaseSchema = {
            parent: {
                type: "page_id",
                page_id: this.parentPageId
            },
            title: [
                {
                    type: "text",
                    text: {
                        content: "Funding Intelligence Database"
                    }
                }
            ],
            properties: {
                "Name": {
                    title: {}
                },
                "Type": {
                    select: {
                        options: [
                            { name: "VC", color: "blue" },
                            { name: "Government", color: "green" },
                            { name: "Angel Network", color: "purple" },
                            { name: "Corporate VC", color: "orange" },
                            { name: "Foundation", color: "red" },
                            { name: "Fund", color: "yellow" },
                            { name: "Research Program", color: "pink" },
                            { name: "Specialized VC", color: "gray" }
                        ]
                    }
                },
                "Location": {
                    rich_text: {}
                },
                "Website": {
                    url: {}
                },
                "Contact": {
                    email: {}
                },
                "Focus Areas": {
                    multi_select: {
                        options: [
                            { name: "AI/ML", color: "blue" },
                            { name: "Enterprise Software", color: "green" },
                            { name: "Climate Tech", color: "purple" },
                            { name: "Healthcare", color: "red" },
                            { name: "Fintech", color: "orange" },
                            { name: "Consumer", color: "yellow" },
                            { name: "Technology", color: "pink" },
                            { name: "SaaS", color: "gray" },
                            { name: "Research", color: "brown" },
                            { name: "Media", color: "default" }
                        ]
                    }
                },
                "Ticket Size": {
                    rich_text: {}
                },
                "Stage": {
                    select: {
                        options: [
                            { name: "Pre-Seed", color: "red" },
                            { name: "Seed", color: "orange" },
                            { name: "Series A", color: "yellow" },
                            { name: "Series B", color: "green" },
                            { name: "Growth", color: "blue" },
                            { name: "Early Stage", color: "purple" },
                            { name: "Research Phase", color: "pink" }
                        ]
                    }
                },
                "Priority": {
                    select: {
                        options: [
                            { name: "high", color: "red" },
                            { name: "medium", color: "yellow" },
                            { name: "low", color: "gray" }
                        ]
                    }
                },
                "Status": {
                    select: {
                        options: [
                            { name: "verified", color: "green" },
                            { name: "trending", color: "blue" },
                            { name: "candidate", color: "orange" },
                            { name: "researched", color: "purple" }
                        ]
                    }
                },
                "Confidence": {
                    number: {
                        format: "percent"
                    }
                },
                "Source": {
                    select: {
                        options: [
                            { name: "notion_direct_api", color: "blue" },
                            { name: "targeted_research", color: "green" },
                            { name: "trend_analysis", color: "purple" },
                            { name: "manual_entry", color: "gray" }
                        ]
                    }
                },
                "Description": {
                    rich_text: {}
                },
                "Investment Thesis": {
                    rich_text: {}
                },
                "Key People": {
                    rich_text: {}
                },
                "Added Date": {
                    date: {}
                }
            }
        };

        try {
            const response = await this.notion.databases.create(databaseSchema);
            this.createdDatabaseId = response.id;
            
            console.log(`✅ Database created: ${response.id}`);
            console.log(`🔗 Database URL: https://notion.so/${response.id.replace(/-/g, '')}`);
            
            return response;
        } catch (error) {
            console.error('❌ Failed to create database:', error.message);
            throw error;
        }
    }

    async importFunders() {
        if (!this.createdDatabaseId) {
            throw new Error('Database not created yet');
        }

        console.log(`📥 Importing ${this.funders.length} funders to Notion database...`);
        
        let imported = 0;
        let failed = 0;

        for (const funder of this.funders) {
            try {
                await this.createFunderPage(funder);
                imported++;
                
                if (imported % 25 === 0) {
                    console.log(`📥 Imported ${imported}/${this.funders.length} funders...`);
                }
                
                // Rate limiting - Notion allows 3 requests per second
                await new Promise(resolve => setTimeout(resolve, 350));
                
            } catch (error) {
                console.warn(`⚠️ Failed to import ${funder.name}: ${error.message}`);
                failed++;
            }
        }

        console.log(`✅ Import complete: ${imported} successful, ${failed} failed`);
        return { imported, failed };
    }

    async createFunderPage(funder) {
        const pageData = {
            parent: {
                database_id: this.createdDatabaseId
            },
            properties: {
                "Name": {
                    title: [
                        {
                            text: {
                                content: funder.name || 'Unnamed Funder'
                            }
                        }
                    ]
                },
                "Type": {
                    select: {
                        name: funder.type || 'Fund'
                    }
                },
                "Location": {
                    rich_text: [
                        {
                            text: {
                                content: funder.location || ''
                            }
                        }
                    ]
                },
                "Website": {
                    url: funder.website || null
                },
                "Contact": {
                    email: funder.contact && funder.contact.includes('@') ? funder.contact : null
                },
                "Focus Areas": {
                    multi_select: (funder.focusAreas || []).map(area => ({ name: area }))
                },
                "Ticket Size": {
                    rich_text: [
                        {
                            text: {
                                content: funder.ticketSize || ''
                            }
                        }
                    ]
                },
                "Stage": {
                    select: funder.stage ? { name: funder.stage } : null
                },
                "Priority": {
                    select: funder.priority ? { name: funder.priority } : null
                },
                "Status": {
                    select: funder.status ? { name: funder.status } : null
                },
                "Confidence": {
                    number: funder.confidence ? funder.confidence / 100 : null
                },
                "Source": {
                    select: funder.source ? { name: funder.source } : null
                },
                "Description": {
                    rich_text: [
                        {
                            text: {
                                content: (funder.description || '').substring(0, 2000)
                            }
                        }
                    ]
                },
                "Investment Thesis": {
                    rich_text: [
                        {
                            text: {
                                content: (funder.investmentThesis || '').substring(0, 2000)
                            }
                        }
                    ]
                },
                "Key People": {
                    rich_text: [
                        {
                            text: {
                                content: Array.isArray(funder.keyPeople) ? funder.keyPeople.join(', ') : (funder.keyPeople || '')
                            }
                        }
                    ]
                },
                "Added Date": {
                    date: {
                        start: funder.researchDate || funder.discoveredAt || new Date().toISOString().split('T')[0]
                    }
                }
            }
        };

        return await this.notion.pages.create(pageData);
    }

    async updateConfig() {
        console.log('🔧 Updating project configuration...');
        
        const configPath = './configs/funding-intelligence.json';
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        config.dataSources.notion.databaseId = this.createdDatabaseId;
        config.dataSources.notion.databaseUrl = `https://notion.so/${this.createdDatabaseId.replace(/-/g, '')}`;
        config.lastUpdated = new Date().toISOString();
        
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log('✅ Configuration updated');
    }

    async run() {
        try {
            console.log('🚀 Creating Notion Funding Intelligence Database...');
            
            // Load funders
            await this.loadLatestFunders();
            
            // Create database
            const database = await this.createDatabase();
            
            // Import all funders
            const results = await this.importFunders();
            
            // Update config
            await this.updateConfig();

            console.log('\n🎉 Notion Database Creation Complete!');
            console.log('\n📊 Results:');
            console.log(`   🗃️ Database ID: ${this.createdDatabaseId}`);
            console.log(`   🔗 Database URL: https://notion.so/${this.createdDatabaseId.replace(/-/g, '')}`);
            console.log(`   📥 Funders imported: ${results.imported}/${this.funders.length}`);
            console.log(`   ⚠️ Import failures: ${results.failed}`);
            
            console.log('\n🌟 Your Notion Database Features:');
            console.log('   ✅ Rich filtering by type, location, focus areas');
            console.log('   ✅ Contact management with emails and websites');
            console.log('   ✅ Priority and confidence scoring');
            console.log('   ✅ Source tracking and research dates');
            console.log('   ✅ Investment thesis and key people info');
            
            console.log('\n🚀 Next Steps:');
            console.log('   1. Open the database URL above');
            console.log('   2. Customize views and filters');
            console.log('   3. Share with team members');
            console.log('   4. Start outreach campaigns');

            return {
                success: true,
                databaseId: this.createdDatabaseId,
                databaseUrl: `https://notion.so/${this.createdDatabaseId.replace(/-/g, '')}`,
                imported: results.imported,
                failed: results.failed
            };

        } catch (error) {
            console.error('❌ Database creation failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// CLI execution
if (require.main === module) {
    if (!process.env.NOTION_TOKEN) {
        console.error('❌ Error: NOTION_TOKEN environment variable not set');
        console.error('Please set your Notion integration token.');
        process.exit(1);
    }

    const creator = new NotionDatabaseCreator();
    creator.run().then(result => {
        process.exit(result.success ? 0 : 1);
    });
}

module.exports = NotionDatabaseCreator;