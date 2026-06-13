#!/usr/bin/env node

/**
 * Automated Funding Database Sync
 * Runs daily maintenance tasks to keep the funding database fresh
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

class AutomatedFundingSync {
    constructor() {
        this.notion = new Client({
            auth: process.env.NOTION_TOKEN
        });
        this.databaseId = '246c6f799a3381eea3f1e329b7120b44';
        this.logFile = path.join(__dirname, '../../logs/funding-sync.log');
    }

    async run() {
        const startTime = new Date();
        console.log('🔄 Automated Funding Database Sync');
        console.log(`📅 ${startTime.toISOString()}\n`);
        
        const results = {
            timestamp: startTime.toISOString(),
            duplicatesFound: 0,
            duplicatesArchived: 0,
            newFundersAdded: 0,
            enrichmentsPerformed: 0,
            errors: []
        };
        
        try {
            // 1. Check for and remove duplicates
            console.log('1️⃣ Checking for duplicates...');
            const duplicates = await this.findDuplicates();
            results.duplicatesFound = duplicates.length;
            
            if (duplicates.length > 0) {
                console.log(`   Found ${duplicates.length} duplicate sets`);
                results.duplicatesArchived = await this.archiveDuplicates(duplicates);
                console.log(`   Archived ${results.duplicatesArchived} duplicates\n`);
            } else {
                console.log('   No duplicates found ✅\n');
            }
            
            // 2. Enrich funders missing data
            console.log('2️⃣ Enriching funders with missing data...');
            const needsEnrichment = await this.findFundersNeedingEnrichment();
            
            if (needsEnrichment.length > 0) {
                console.log(`   Found ${needsEnrichment.length} funders needing enrichment`);
                results.enrichmentsPerformed = await this.enrichFunders(needsEnrichment.slice(0, 20)); // Limit to 20 per run
                console.log(`   Enriched ${results.enrichmentsPerformed} funders\n`);
            } else {
                console.log('   All funders have basic data ✅\n');
            }
            
            // 3. Generate daily report
            console.log('3️⃣ Generating database statistics...');
            const stats = await this.getDatabaseStats();
            console.log(`   Total funders: ${stats.total}`);
            console.log(`   With websites: ${stats.withWebsites}`);
            console.log(`   With descriptions: ${stats.withDescriptions}`);
            console.log(`   BC/Canadian: ${stats.bcFunders}\n`);
            
            results.stats = stats;
            
            // 4. Save log
            await this.saveLog(results);
            
            const endTime = new Date();
            const duration = Math.round((endTime - startTime) / 1000);
            console.log(`✅ Sync completed in ${duration} seconds`);
            console.log(`📄 Log saved to: ${this.logFile}\n`);
            
        } catch (error) {
            console.error('❌ Sync failed:', error.message);
            results.errors.push(error.message);
            await this.saveLog(results);
        }
    }

    async findDuplicates() {
        const allFunders = await this.getAllFunders();
        const nameMap = new Map();
        const duplicates = [];
        
        for (const funder of allFunders) {
            const name = funder.properties.Name?.title?.[0]?.plain_text || '';
            if (!name) continue;
            
            const normalized = this.normalizeName(name);
            
            if (!nameMap.has(normalized)) {
                nameMap.set(normalized, []);
            }
            
            nameMap.get(normalized).push({
                id: funder.id,
                name: name,
                created: funder.created_time
            });
        }
        
        nameMap.forEach((group, normalized) => {
            if (group.length > 1) {
                duplicates.push(group);
            }
        });
        
        return duplicates;
    }

    async archiveDuplicates(duplicates) {
        let archivedCount = 0;
        
        for (const group of duplicates) {
            // Sort by creation date, keep oldest
            group.sort((a, b) => new Date(a.created) - new Date(b.created));
            
            // Archive all but the oldest
            for (let i = 1; i < group.length; i++) {
                try {
                    await this.notion.pages.update({
                        page_id: group[i].id,
                        archived: true
                    });
                    archivedCount++;
                } catch (error) {
                    // Skip if already archived or error
                }
            }
        }
        
        return archivedCount;
    }

    async findFundersNeedingEnrichment() {
        const response = await this.notion.databases.query({
            database_id: this.databaseId,
            filter: {
                or: [
                    { property: 'Website', url: { is_empty: true } },
                    { property: 'Description', rich_text: { is_empty: true } }
                ]
            },
            page_size: 100
        });
        
        return response.results;
    }

    async enrichFunders(funders) {
        let enrichedCount = 0;
        
        for (const funder of funders) {
            const name = funder.properties.Name?.title?.[0]?.plain_text || '';
            if (!name) continue;
            
            const updates = {};
            
            // Add basic description if missing
            if (!funder.properties.Description?.rich_text?.[0]) {
                const type = funder.properties.Type?.select?.name || 'Fund';
                updates.Description = {
                    rich_text: [{
                        text: {
                            content: this.generateDescription(name, type)
                        }
                    }]
                };
            }
            
            // Try to infer location if missing
            if (!funder.properties.Location?.rich_text?.[0]) {
                const location = this.inferLocation(name);
                if (location) {
                    updates.Location = {
                        rich_text: [{ text: { content: location } }]
                    };
                }
            }
            
            if (Object.keys(updates).length > 0) {
                try {
                    await this.notion.pages.update({
                        page_id: funder.id,
                        properties: updates
                    });
                    enrichedCount++;
                } catch (error) {
                    // Skip on error
                }
            }
        }
        
        return enrichedCount;
    }

    async getDatabaseStats() {
        const allFunders = await this.getAllFunders();
        
        const stats = {
            total: allFunders.length,
            withWebsites: 0,
            withDescriptions: 0,
            bcFunders: 0,
            byType: {}
        };
        
        for (const funder of allFunders) {
            if (funder.properties.Website?.url) {
                stats.withWebsites++;
            }
            if (funder.properties.Description?.rich_text?.[0]) {
                stats.withDescriptions++;
            }
            
            const location = funder.properties.Location?.rich_text?.[0]?.plain_text || '';
            const name = funder.properties.Name?.title?.[0]?.plain_text || '';
            
            if (this.isBCFunder(name, location)) {
                stats.bcFunders++;
            }
            
            const type = funder.properties.Type?.select?.name || 'Unknown';
            stats.byType[type] = (stats.byType[type] || 0) + 1;
        }
        
        return stats;
    }

    async getAllFunders() {
        const allFunders = [];
        let hasMore = true;
        let cursor = undefined;
        
        while (hasMore) {
            const response = await this.notion.databases.query({
                database_id: this.databaseId,
                start_cursor: cursor,
                page_size: 100
            });
            
            allFunders.push(...response.results);
            hasMore = response.has_more;
            cursor = response.next_cursor;
        }
        
        return allFunders;
    }

    normalizeName(name) {
        return name.toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    generateDescription(name, type) {
        const typeDescriptions = {
            'VC': 'Venture capital firm investing in technology companies',
            'Government': 'Government funding program supporting innovation',
            'Corporate': 'Corporate investment arm',
            'Foundation': 'Foundation providing grants and funding',
            'Angel': 'Angel investor network',
            'Accelerator': 'Startup accelerator program',
            'Grant': 'Grant funding program',
            'PE': 'Private equity firm'
        };
        
        return typeDescriptions[type] || 'Funding organization';
    }

    inferLocation(name) {
        const nameLower = name.toLowerCase();
        
        if (nameLower.includes('bc') || nameLower.includes('british columbia')) {
            return 'British Columbia, Canada';
        }
        if (nameLower.includes('vancouver')) {
            return 'Vancouver, BC';
        }
        if (nameLower.includes('canada') || nameLower.includes('canadian')) {
            return 'Canada';
        }
        
        return null;
    }

    isBCFunder(name, location) {
        const text = (name + ' ' + location).toLowerCase();
        return text.includes('bc') || 
               text.includes('british columbia') ||
               text.includes('vancouver') ||
               text.includes('victoria') ||
               text.includes('canada');
    }

    async saveLog(results) {
        try {
            // Ensure logs directory exists
            const logsDir = path.dirname(this.logFile);
            await fs.mkdir(logsDir, { recursive: true });
            
            // Read existing logs if file exists
            let logs = [];
            try {
                const existing = await fs.readFile(this.logFile, 'utf8');
                logs = JSON.parse(existing);
            } catch (error) {
                // File doesn't exist yet
            }
            
            // Add new log entry
            logs.push(results);
            
            // Keep only last 30 days of logs
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            logs = logs.filter(log => new Date(log.timestamp) > thirtyDaysAgo);
            
            // Save updated logs
            await fs.writeFile(this.logFile, JSON.stringify(logs, null, 2));
            
        } catch (error) {
            console.error('Failed to save log:', error.message);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const sync = new AutomatedFundingSync();
    sync.run().catch(console.error);
}

module.exports = AutomatedFundingSync;