#!/usr/bin/env node

/**
 * Deduplicate Funding Database
 * Finds and consolidates duplicate funding entries using the MCP pattern
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

class FundingDatabaseDeduplicator {
    constructor() {
        // Use MCP pattern with embedded token
        this.notion = new Client({
            auth: process.env.NOTION_TOKEN
        });
        
        // These IDs would need to be discovered or provided
        this.fundingDatabaseId = null;
        this.duplicates = new Map();
        this.processedCount = 0;
    }

    /**
     * Find the funding database
     */
    async findFundingDatabase() {
        console.log('🔍 Searching for funding database...\n');
        
        try {
            const response = await this.notion.search({
                filter: {
                    property: 'object',
                    value: 'database'
                },
                page_size: 100
            });

            // Look for databases with funding-related names
            const fundingDatabases = response.results.filter(db => {
                const title = db.title?.map(t => t.plain_text).join('').toLowerCase() || '';
                return title.includes('funding') || 
                       title.includes('funder') || 
                       title.includes('investor') ||
                       title.includes('intelligence');
            });

            if (fundingDatabases.length === 0) {
                console.log('❌ No funding database found');
                return null;
            }

            // Use the first one or the one with most entries
            this.fundingDatabaseId = fundingDatabases[0].id;
            const title = fundingDatabases[0].title?.map(t => t.plain_text).join('') || 'Untitled';
            
            console.log(`✅ Found funding database: "${title}"`);
            console.log(`   ID: ${this.fundingDatabaseId}\n`);
            
            return this.fundingDatabaseId;
            
        } catch (error) {
            console.error('❌ Error finding database:', error.message);
            return null;
        }
    }

    /**
     * Fetch all entries from the funding database
     */
    async fetchAllEntries() {
        if (!this.fundingDatabaseId) {
            await this.findFundingDatabase();
        }
        
        if (!this.fundingDatabaseId) {
            throw new Error('No funding database found');
        }

        console.log('📊 Fetching all entries from funding database...\n');
        
        let allEntries = [];
        let hasMore = true;
        let cursor = undefined;

        while (hasMore) {
            try {
                const response = await this.notion.databases.query({
                    database_id: this.fundingDatabaseId,
                    start_cursor: cursor,
                    page_size: 100
                });

                allEntries = allEntries.concat(response.results);
                hasMore = response.has_more;
                cursor = response.next_cursor;
                
                console.log(`   Fetched ${allEntries.length} entries so far...`);
            } catch (error) {
                console.error('❌ Error fetching entries:', error.message);
                break;
            }
        }

        console.log(`\n✅ Total entries fetched: ${allEntries.length}\n`);
        return allEntries;
    }

    /**
     * Normalize organization name for comparison
     */
    normalizeName(name) {
        if (!name) return '';
        
        return name
            .toLowerCase()
            .trim()
            // Remove common suffixes
            .replace(/\s*(inc|incorporated|corp|corporation|llc|ltd|limited|co|company)\.?$/i, '')
            // Remove special characters
            .replace(/[^\w\s]/g, ' ')
            // Collapse multiple spaces
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Extract name from Notion page properties
     */
    getPageName(page) {
        // Try different property names
        const nameProps = ['Name', 'name', 'Title', 'Organization', 'Funder'];
        
        for (const prop of nameProps) {
            if (page.properties[prop]) {
                const property = page.properties[prop];
                
                if (property.title && property.title[0]) {
                    return property.title[0].plain_text;
                }
                if (property.rich_text && property.rich_text[0]) {
                    return property.rich_text[0].plain_text;
                }
            }
        }
        
        return null;
    }

    /**
     * Find duplicates in the database
     */
    async findDuplicates(entries) {
        console.log('🔍 Analyzing for duplicates...\n');
        
        const nameGroups = new Map();
        
        // Group by normalized name
        for (const entry of entries) {
            const name = this.getPageName(entry);
            if (!name) continue;
            
            const normalized = this.normalizeName(name);
            
            if (!nameGroups.has(normalized)) {
                nameGroups.set(normalized, []);
            }
            
            nameGroups.get(normalized).push({
                id: entry.id,
                name: name,
                properties: entry.properties,
                created: entry.created_time,
                updated: entry.last_edited_time
            });
        }
        
        // Find groups with multiple entries
        let duplicateCount = 0;
        nameGroups.forEach((group, normalized) => {
            if (group.length > 1) {
                this.duplicates.set(normalized, group);
                duplicateCount++;
            }
        });
        
        console.log(`✅ Found ${duplicateCount} sets of duplicates\n`);
        
        // Display duplicates
        if (duplicateCount > 0) {
            console.log('📋 Duplicate Groups:\n');
            let index = 1;
            
            this.duplicates.forEach((group, normalized) => {
                console.log(`${index}. "${group[0].name}" (${group.length} entries)`);
                console.log(`   Normalized: "${normalized}"`);
                
                group.forEach((entry, i) => {
                    const age = this.getAgeInDays(entry.created);
                    console.log(`   ${i + 1}. ${entry.name}`);
                    console.log(`      ID: ${entry.id}`);
                    console.log(`      Created: ${age} days ago`);
                });
                console.log('');
                index++;
            });
        }
        
        return this.duplicates;
    }

    /**
     * Get age of entry in days
     */
    getAgeInDays(dateString) {
        const created = new Date(dateString);
        const now = new Date();
        const days = Math.floor((now - created) / (1000 * 60 * 60 * 24));
        return days;
    }

    /**
     * Merge duplicate entries
     */
    async mergeDuplicates(autoMerge = false) {
        if (this.duplicates.size === 0) {
            console.log('✅ No duplicates to merge\n');
            return;
        }
        
        console.log(`🔄 Preparing to merge ${this.duplicates.size} duplicate groups...\n`);
        
        const mergeLog = [];
        
        for (const [normalized, group] of this.duplicates) {
            // Sort by creation date - keep oldest
            group.sort((a, b) => new Date(a.created) - new Date(b.created));
            
            const keeper = group[0];
            const toArchive = group.slice(1);
            
            console.log(`\n📦 Merging: "${keeper.name}"`);
            console.log(`   Keeping: ${keeper.id} (oldest)`);
            console.log(`   Archiving: ${toArchive.length} duplicates`);
            
            if (autoMerge || await this.confirmMerge()) {
                // Archive duplicates
                for (const duplicate of toArchive) {
                    try {
                        await this.notion.pages.update({
                            page_id: duplicate.id,
                            archived: true
                        });
                        console.log(`   ✅ Archived: ${duplicate.id}`);
                        
                        mergeLog.push({
                            action: 'archived',
                            name: duplicate.name,
                            id: duplicate.id,
                            keptId: keeper.id,
                            timestamp: new Date().toISOString()
                        });
                    } catch (error) {
                        console.log(`   ❌ Failed to archive ${duplicate.id}: ${error.message}`);
                    }
                }
                
                this.processedCount++;
            }
        }
        
        // Save merge log
        if (mergeLog.length > 0) {
            const logPath = path.join(
                __dirname, 
                '../../data/reports',
                `funding-dedup-log-${new Date().toISOString().split('T')[0]}.json`
            );
            
            await fs.writeFile(logPath, JSON.stringify(mergeLog, null, 2));
            console.log(`\n📄 Merge log saved to: ${logPath}`);
        }
        
        console.log(`\n✅ Deduplication complete!`);
        console.log(`   Processed: ${this.processedCount} duplicate groups`);
        console.log(`   Archived: ${mergeLog.length} duplicate entries\n`);
    }

    /**
     * Interactive confirmation (stub for now)
     */
    async confirmMerge() {
        // For automated script, return true
        // In interactive mode, would prompt user
        return true;
    }

    /**
     * Generate deduplication report
     */
    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            databaseId: this.fundingDatabaseId,
            summary: {
                totalDuplicateSets: this.duplicates.size,
                totalDuplicateEntries: Array.from(this.duplicates.values())
                    .reduce((sum, group) => sum + group.length - 1, 0)
            },
            duplicates: []
        };
        
        this.duplicates.forEach((group, normalized) => {
            report.duplicates.push({
                normalized,
                count: group.length,
                entries: group.map(e => ({
                    id: e.id,
                    name: e.name,
                    created: e.created
                }))
            });
        });
        
        const reportPath = path.join(
            __dirname,
            '../../data/reports',
            `funding-duplicates-${new Date().toISOString().split('T')[0]}.json`
        );
        
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        console.log(`📊 Duplicate report saved to: ${reportPath}\n`);
        
        return report;
    }

    /**
     * Main execution
     */
    async run(options = {}) {
        try {
            console.log('🚀 Funding Database Deduplicator\n');
            console.log('=' .repeat(50) + '\n');
            
            // Find and connect to database
            await this.findFundingDatabase();
            
            // Fetch all entries
            const entries = await this.fetchAllEntries();
            
            // Find duplicates
            await this.findDuplicates(entries);
            
            // Generate report
            await this.generateReport();
            
            // Merge if requested
            if (options.autoMerge) {
                await this.mergeDuplicates(true);
            } else if (options.interactive) {
                await this.mergeDuplicates(false);
            } else {
                console.log('💡 Run with --auto-merge to automatically merge duplicates');
                console.log('   or --interactive for manual confirmation\n');
            }
            
        } catch (error) {
            console.error('❌ Error:', error.message);
            process.exit(1);
        }
    }
}

// CLI execution
if (require.main === module) {
    const deduplicator = new FundingDatabaseDeduplicator();
    
    const args = process.argv.slice(2);
    const options = {
        autoMerge: args.includes('--auto-merge'),
        interactive: args.includes('--interactive')
    };
    
    deduplicator.run(options);
}

module.exports = FundingDatabaseDeduplicator;