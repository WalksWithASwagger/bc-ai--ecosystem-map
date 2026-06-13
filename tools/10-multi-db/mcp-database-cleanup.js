#!/usr/bin/env node

/**
 * MCP Database Cleanup - Find and clean up duplicate funding databases
 * Uses the correct MCP pattern from project documentation
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();

class MCPDatabaseCleanup {
    constructor() {
        // Use correct MCP pattern with embedded token
        this.notion = new Client({
            auth: process.env.NOTION_TOKEN
        });
        this.fundingPageId = '9212662f2cd3451bbde3470b9018ea12';
        this.databases = [];
    }

    async findDatabasesOnPage() {
        console.log('🔍 Scanning funding page for databases...');
        
        try {
            // Get all blocks on the funding page
            const blocks = await this.getAllBlocks(this.fundingPageId);
            
            // Find database blocks
            const databaseBlocks = blocks.filter(block => 
                block.type === 'child_database' || 
                (block.type === 'paragraph' && block.paragraph?.rich_text?.some(text => 
                    text.plain_text?.includes('Database') || 
                    text.plain_text?.includes('database')
                ))
            );
            
            console.log(`📊 Found ${databaseBlocks.length} potential database references`);
            
            // Also search for databases created on this page
            const databases = await this.findDatabasesInWorkspace();
            const fundingDatabases = databases.filter(db => 
                db.title?.some(title => title.plain_text?.includes('Funding')) ||
                db.title?.some(title => title.plain_text?.includes('Intelligence'))
            );
            
            this.databases = fundingDatabases;
            console.log(`🗃️ Found ${fundingDatabases.length} funding-related databases`);
            
            return fundingDatabases;
            
        } catch (error) {
            console.error('❌ Error scanning page:', error.message);
            throw error;
        }
    }

    async getAllBlocks(pageId) {
        let allBlocks = [];
        let cursor = undefined;

        while (true) {
            const response = await this.notion.blocks.children.list({
                block_id: pageId,
                start_cursor: cursor,
                page_size: 100,
            });

            allBlocks = allBlocks.concat(response.results);
            
            if (!response.next_cursor) {
                break;
            }
            cursor = response.next_cursor;
        }

        return allBlocks;
    }

    async findDatabasesInWorkspace() {
        console.log('🔍 Searching workspace for databases...');
        
        try {
            const response = await this.notion.search({
                filter: {
                    property: 'object',
                    value: 'database'
                },
                page_size: 100
            });

            return response.results;
        } catch (error) {
            console.error('❌ Error searching databases:', error.message);
            return [];
        }
    }

    async analyzeDatabases() {
        console.log('\n📊 Analyzing found databases...');
        
        for (let i = 0; i < this.databases.length; i++) {
            const db = this.databases[i];
            const title = db.title?.map(t => t.plain_text).join('') || 'Untitled';
            
            console.log(`\n${i + 1}. ${title}`);
            console.log(`   🆔 ID: ${db.id}`);
            console.log(`   📅 Created: ${db.created_time}`);
            console.log(`   🔗 URL: https://notion.so/${db.id.replace(/-/g, '')}`);
            
            // Get database contents
            try {
                const contents = await this.notion.databases.query({
                    database_id: db.id,
                    page_size: 5
                });
                
                console.log(`   📈 Entries: ${contents.results.length} (showing first 5)`);
                
                if (contents.results.length > 0) {
                    console.log(`   📝 Sample entries:`);
                    contents.results.slice(0, 3).forEach(page => {
                        const name = page.properties.Name?.title?.[0]?.plain_text || 'Unknown';
                        console.log(`      • ${name}`);
                    });
                }
                
            } catch (error) {
                console.log(`   ⚠️ Cannot access database contents: ${error.message}`);
            }
        }
    }

    async selectBestDatabase() {
        console.log('\n🎯 Selecting best database...');
        
        if (this.databases.length === 0) {
            console.log('❌ No databases found');
            return null;
        }
        
        if (this.databases.length === 1) {
            console.log('✅ Only one database found - using it');
            return this.databases[0];
        }
        
        // Score databases based on:
        // - Number of entries
        // - Creation date (newer is better)
        // - Title quality
        
        let bestDb = null;
        let bestScore = 0;
        
        for (const db of this.databases) {
            let score = 0;
            
            try {
                // Get entry count
                const contents = await this.notion.databases.query({
                    database_id: db.id,
                    page_size: 1
                });
                
                // More entries = better
                if (contents.results.length > 0) {
                    score += 50;
                }
                
                // Newer = better
                const createdDate = new Date(db.created_time);
                const daysSinceCreated = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
                score += Math.max(0, 30 - daysSinceCreated); // Newer gets more points
                
                // Title quality
                const title = db.title?.map(t => t.plain_text).join('') || '';
                if (title.includes('Intelligence')) score += 10;
                if (title.includes('🎯')) score += 5;
                
                console.log(`   Database "${title}": Score ${score.toFixed(1)}`);
                
                if (score > bestScore) {
                    bestScore = score;
                    bestDb = db;
                }
                
            } catch (error) {
                console.log(`   Error scoring database: ${error.message}`);
            }
        }
        
        if (bestDb) {
            const title = bestDb.title?.map(t => t.plain_text).join('') || 'Untitled';
            console.log(`\n🏆 Best database: "${title}" (Score: ${bestScore.toFixed(1)})`);
            console.log(`🔗 URL: https://notion.so/${bestDb.id.replace(/-/g, '')}`);
        }
        
        return bestDb;
    }

    async deleteOtherDatabases(keepDb) {
        console.log('\n🗑️ Cleaning up duplicate databases...');
        
        const toDelete = this.databases.filter(db => db.id !== keepDb.id);
        
        if (toDelete.length === 0) {
            console.log('✅ No duplicates to delete');
            return;
        }
        
        console.log(`🗑️ Will delete ${toDelete.length} duplicate database(s):`);
        
        for (const db of toDelete) {
            const title = db.title?.map(t => t.plain_text).join('') || 'Untitled';
            console.log(`   • "${title}" (${db.id})`);
            
            try {
                // Archive the database (safer than delete)
                await this.notion.databases.update({
                    database_id: db.id,
                    archived: true
                });
                
                console.log(`   ✅ Archived successfully`);
                
            } catch (error) {
                console.log(`   ❌ Failed to archive: ${error.message}`);
            }
        }
    }

    async run() {
        try {
            console.log('🚀 Starting MCP Database Cleanup...');
            
            // Find databases
            await this.findDatabasesOnPage();
            
            // Analyze them
            await this.analyzeDatabases();
            
            // Select best one
            const bestDb = await this.selectBestDatabase();
            
            if (!bestDb) {
                console.log('❌ No suitable database found');
                return { success: false };
            }
            
            // Clean up duplicates
            await this.deleteOtherDatabases(bestDb);
            
            console.log('\n🎉 Database Cleanup Complete!');
            console.log('\n📊 Final Result:');
            console.log(`   🗃️ Active Database: ${bestDb.title?.map(t => t.plain_text).join('')}`);
            console.log(`   🆔 Database ID: ${bestDb.id}`);
            console.log(`   🔗 Database URL: https://notion.so/${bestDb.id.replace(/-/g, '')}`);
            
            console.log('\n🚀 Ready for enrichment pipeline!');
            
            return {
                success: true,
                databaseId: bestDb.id,
                databaseUrl: `https://notion.so/${bestDb.id.replace(/-/g, '')}`,
                title: bestDb.title?.map(t => t.plain_text).join('')
            };
            
        } catch (error) {
            console.error('❌ Cleanup failed:', error.message);
            return { success: false, error: error.message };
        }
    }
}

if (require.main === module) {
    const cleanup = new MCPDatabaseCleanup();
    cleanup.run().catch(console.error);
}

module.exports = MCPDatabaseCleanup;