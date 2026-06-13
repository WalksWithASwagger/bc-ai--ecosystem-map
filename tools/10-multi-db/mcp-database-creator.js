#!/usr/bin/env node

/**
 * MCP-Compatible Notion Database Creator
 * Creates database and imports funders using direct API calls with working token
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

class MCPDatabaseCreator {
    constructor() {
        // Use the token that actually works
        this.notion = new Client({ 
            auth: process.env.NOTION_TOKEN
        });
        this.projectPath = '/Users/kk/ecosystem-map-bc-ai/data/projects/funding-intelligence';
        this.parentPageId = '9212662f2cd3451bbde3470b9018ea12';
        this.funders = [];
        this.createdDatabaseId = null;
    }

    async loadFunders() {
        console.log('📊 Loading enriched funders...');
        
        const enrichedDir = `${this.projectPath}/data/enriched`;
        const files = fs.readdirSync(enrichedDir).filter(f => f.includes('funding-enriched'));
        const latestFile = files.sort().pop();
        const data = JSON.parse(fs.readFileSync(path.join(enrichedDir, latestFile), 'utf8'));
        
        this.funders = data.funders;
        console.log(`✅ Loaded ${this.funders.length} funders`);
        
        return this.funders;
    }

    async createDatabase() {
        console.log('🏗️ Creating Notion database with MCP compatibility...');
        
        try {
            const response = await this.notion.databases.create({
                parent: {
                    type: "page_id",
                    page_id: this.parentPageId
                },
                title: [
                    {
                        type: "text",
                        text: {
                            content: "🎯 Funding Intelligence Database"
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
                                { name: "Research", color: "brown" }
                            ]
                        }
                    },
                    "Ticket Size": {
                        rich_text: {}
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
                    "Description": {
                        rich_text: {}
                    }
                }
            });

            this.createdDatabaseId = response.id;
            
            console.log(`✅ Database created: ${response.id}`);
            console.log(`🔗 Database URL: https://notion.so/${response.id.replace(/-/g, '')}`);
            
            return response;
        } catch (error) {
            console.error('❌ Failed to create database:', error);
            throw error;
        }
    }

    async importFunders() {
        console.log(`📥 Importing ${this.funders.length} funders...`);
        
        let imported = 0;
        let failed = 0;
        const batchSize = 10; // Smaller batches to avoid rate limits

        for (let i = 0; i < this.funders.length; i += batchSize) {
            const batch = this.funders.slice(i, i + batchSize);
            
            for (const funder of batch) {
                try {
                    await this.createFunderPage(funder);
                    imported++;
                    
                    if (imported % 25 === 0) {
                        console.log(`📥 Imported ${imported}/${this.funders.length} funders...`);
                    }
                } catch (error) {
                    console.warn(`⚠️ Failed to import ${funder.name}: ${error.message}`);
                    failed++;
                }
            }
            
            // Rate limiting between batches
            await new Promise(resolve => setTimeout(resolve, 1000));
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
                    multi_select: (funder.focusAreas || []).slice(0, 5).map(area => ({ name: area }))
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
                "Priority": {
                    select: funder.priority ? { name: funder.priority } : null
                },
                "Status": {
                    select: funder.status ? { name: funder.status } : null
                },
                "Confidence": {
                    number: funder.confidence ? funder.confidence / 100 : null
                },
                "Description": {
                    rich_text: [
                        {
                            text: {
                                content: (funder.description || '').substring(0, 1500)
                            }
                        }
                    ]
                }
            }
        };

        return await this.notion.pages.create(pageData);
    }

    async run() {
        try {
            console.log('🚀 Creating Notion database with working token...');
            
            // Load funders
            await this.loadFunders();
            
            // Create database  
            await this.createDatabase();
            
            // Import funders
            const results = await this.importFunders();

            console.log('\n🎉 Notion Database Created Successfully!');
            console.log('\n📊 Results:');
            console.log(`   🗃️ Database ID: ${this.createdDatabaseId}`);
            console.log(`   🔗 Database URL: https://notion.so/${this.createdDatabaseId.replace(/-/g, '')}`);
            console.log(`   📥 Funders imported: ${results.imported}/${this.funders.length}`);
            console.log(`   ⚠️ Failed imports: ${results.failed}`);

            // Save database info
            const dbInfo = {
                databaseId: this.createdDatabaseId,
                databaseUrl: `https://notion.so/${this.createdDatabaseId.replace(/-/g, '')}`,
                totalFunders: results.imported,
                createdAt: new Date().toISOString()
            };
            
            fs.writeFileSync('/Users/kk/ecosystem-map-bc-ai/data/projects/funding-intelligence/notion-database-info.json', 
                JSON.stringify(dbInfo, null, 2));

            return dbInfo;

        } catch (error) {
            console.error('❌ Database creation failed:', error.message);
            throw error;
        }
    }
}

if (require.main === module) {
    const creator = new MCPDatabaseCreator();
    creator.run().catch(console.error);
}

module.exports = MCPDatabaseCreator;