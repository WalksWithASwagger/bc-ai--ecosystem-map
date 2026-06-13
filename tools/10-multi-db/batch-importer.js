#!/usr/bin/env node

/**
 * Smart Batch Importer - Import funders in small efficient batches
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

class SmartBatchImporter {
    constructor() {
        this.notion = new Client({ 
            auth: process.env.NOTION_TOKEN
        });
        this.databaseId = '246c6f799a3381eea3f1e329b7120b44';
        this.projectPath = '/Users/kk/ecosystem-map-bc-ai/data/projects/funding-intelligence';
        this.batchSize = 5; // Very small batches
    }

    async loadFunders() {
        const enrichedDir = `${this.projectPath}/data/enriched`;
        const files = fs.readdirSync(enrichedDir).filter(f => f.includes('funding-enriched'));
        const latestFile = files.sort().pop();
        const data = JSON.parse(fs.readFileSync(path.join(enrichedDir, latestFile), 'utf8'));
        return data.funders;
    }

    async checkDatabase() {
        try {
            const db = await this.notion.databases.retrieve({ database_id: this.databaseId });
            console.log(`✅ Database confirmed: ${db.title[0].text.content}`);
            return true;
        } catch (error) {
            console.error(`❌ Database check failed: ${error.message}`);
            return false;
        }
    }

    async importBatch(funders, startIndex = 0) {
        console.log(`📥 Importing batch ${startIndex} to ${Math.min(startIndex + this.batchSize, funders.length)}...`);
        
        const batch = funders.slice(startIndex, startIndex + this.batchSize);
        let imported = 0;
        
        for (const funder of batch) {
            try {
                await this.notion.pages.create({
                    parent: { database_id: this.databaseId },
                    properties: {
                        "Name": {
                            title: [{ text: { content: funder.name || 'Unnamed' } }]
                        },
                        "Type": {
                            select: { name: funder.type || 'Fund' }
                        },
                        "Location": {
                            rich_text: [{ text: { content: funder.location || '' } }]
                        },
                        "Website": {
                            url: funder.website || null
                        },
                        "Description": {
                            rich_text: [{ text: { content: (funder.description || '').substring(0, 500) } }]
                        }
                    }
                });
                imported++;
                console.log(`   ✅ ${funder.name}`);
            } catch (error) {
                console.log(`   ❌ Failed: ${funder.name} - ${error.message}`);
            }
            
            // Rate limit between each item
            await new Promise(resolve => setTimeout(resolve, 400));
        }
        
        return imported;
    }

    async run() {
        try {
            console.log('🎯 Smart Batch Import Starting...');
            
            // Check database exists
            const dbExists = await this.checkDatabase();
            if (!dbExists) {
                throw new Error('Database not accessible');
            }
            
            // Load funders
            const funders = await this.loadFunders();
            console.log(`📊 Found ${funders.length} funders to import`);
            
            // Import top 20 high-priority funders first
            const highPriority = funders.filter(f => f.priority === 'high').slice(0, 20);
            
            let totalImported = 0;
            for (let i = 0; i < highPriority.length; i += this.batchSize) {
                const imported = await this.importBatch(highPriority, i);
                totalImported += imported;
                
                console.log(`📈 Progress: ${totalImported}/${highPriority.length} high-priority funders imported`);
                
                // Wait between batches
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            console.log('\n🎉 Smart Import Complete!');
            console.log(`✅ Imported ${totalImported} high-priority funders`);
            console.log(`🔗 Database: https://notion.so/${this.databaseId.replace(/-/g, '')}`);
            console.log('\n🚀 Next: Use MCP to enrich the imported data');

            return { success: true, imported: totalImported };

        } catch (error) {
            console.error('❌ Import failed:', error.message);
            return { success: false, error: error.message };
        }
    }
}

if (require.main === module) {
    const importer = new SmartBatchImporter();
    importer.run().catch(console.error);
}

module.exports = SmartBatchImporter;