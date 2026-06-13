#!/usr/bin/env node

/**
 * MCP Duplicate Checker
 * Identifies potential duplicate entries in the database
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();

class MCPDuplicateChecker {
    constructor() {
        // MCP Pattern: Direct token access
        this.notion = new Client({ 
            auth: process.env.NOTION_TOKEN
        });
        this.databaseId = '1f0c6f799a3381bd8332ca0235c24655';
    }

    async fetchAllOrganizations() {
        console.log('📊 Fetching all organizations from database...');
        
        const organizations = [];
        let hasMore = true;
        let startCursor = undefined;

        while (hasMore) {
            const response = await this.notion.databases.query({
                database_id: this.databaseId,
                start_cursor: startCursor,
                page_size: 100,
                filter: {
                    property: 'archived',
                    checkbox: { equals: false }
                }
            });

            organizations.push(...response.results);
            hasMore = response.has_more;
            startCursor = response.next_cursor;
        }

        console.log(`✅ Fetched ${organizations.length} active organizations\n`);
        return organizations;
    }

    normalizeString(str) {
        return str
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s]/g, '')
            .trim();
    }

    findDuplicates(organizations) {
        console.log('🔍 Checking for duplicates...\n');
        
        const nameMap = new Map();
        const duplicates = [];
        
        // Group by normalized name
        organizations.forEach(org => {
            const name = org.properties.Name?.title?.[0]?.plain_text || '';
            if (!name) return;
            
            const normalized = this.normalizeString(name);
            
            if (!nameMap.has(normalized)) {
                nameMap.set(normalized, []);
            }
            
            nameMap.get(normalized).push({
                id: org.id,
                name: name,
                website: org.properties.Website?.url || '',
                created: org.created_time
            });
        });
        
        // Find exact duplicates
        nameMap.forEach((orgs, normalizedName) => {
            if (orgs.length > 1) {
                duplicates.push({
                    type: 'exact',
                    normalizedName,
                    organizations: orgs
                });
            }
        });
        
        // Find similar names (potential duplicates)
        const names = Array.from(nameMap.keys());
        const similarPairs = [];
        
        for (let i = 0; i < names.length; i++) {
            for (let j = i + 1; j < names.length; j++) {
                const similarity = this.calculateSimilarity(names[i], names[j]);
                
                if (similarity > 0.8) {
                    similarPairs.push({
                        type: 'similar',
                        name1: names[i],
                        name2: names[j],
                        similarity: similarity,
                        orgs1: nameMap.get(names[i]),
                        orgs2: nameMap.get(names[j])
                    });
                }
            }
        }
        
        return { exact: duplicates, similar: similarPairs };
    }

    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    generateReport(duplicates) {
        console.log('📋 Duplicate Report\n');
        console.log('==================\n');
        
        // Exact duplicates
        if (duplicates.exact.length > 0) {
            console.log(`🔴 EXACT DUPLICATES: ${duplicates.exact.length} sets found\n`);
            
            duplicates.exact.forEach((dup, index) => {
                console.log(`${index + 1}. "${dup.organizations[0].name}" appears ${dup.organizations.length} times:`);
                
                dup.organizations.forEach(org => {
                    const url = `https://notion.so/${org.id.replace(/-/g, '')}`;
                    console.log(`   - ${org.name}`);
                    console.log(`     ID: ${org.id}`);
                    console.log(`     URL: ${url}`);
                    console.log(`     Website: ${org.website || 'No website'}`);
                    console.log(`     Created: ${new Date(org.created).toLocaleDateString()}`);
                });
                console.log('');
            });
        } else {
            console.log('✅ No exact duplicates found!\n');
        }
        
        // Similar names
        if (duplicates.similar.length > 0) {
            console.log(`🟡 SIMILAR NAMES: ${duplicates.similar.length} potential duplicates\n`);
            
            duplicates.similar
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, 10)
                .forEach((sim, index) => {
                    console.log(`${index + 1}. ${Math.round(sim.similarity * 100)}% similar:`);
                    console.log(`   "${sim.orgs1[0].name}" vs "${sim.orgs2[0].name}"`);
                });
        }
        
        return duplicates;
    }

    async archiveDuplicate(pageId) {
        try {
            await this.notion.pages.update({
                page_id: pageId,
                archived: true
            });
            console.log(`   ✅ Archived duplicate: ${pageId}`);
            return true;
        } catch (error) {
            console.error(`   ❌ Failed to archive: ${error.message}`);
            return false;
        }
    }

    async run(autoArchive = false) {
        console.log('🚀 MCP Duplicate Checker');
        console.log('=======================\n');
        
        try {
            const organizations = await this.fetchAllOrganizations();
            const duplicates = this.findDuplicates(organizations);
            this.generateReport(duplicates);
            
            if (autoArchive && duplicates.exact.length > 0) {
                console.log('\n🗄️  Auto-archiving duplicates...\n');
                
                for (const dupSet of duplicates.exact) {
                    // Keep the oldest entry, archive the rest
                    const sorted = dupSet.organizations.sort((a, b) => 
                        new Date(a.created) - new Date(b.created)
                    );
                    
                    console.log(`Keeping: ${sorted[0].name} (created ${new Date(sorted[0].created).toLocaleDateString()})`);
                    
                    for (let i = 1; i < sorted.length; i++) {
                        await this.archiveDuplicate(sorted[i].id);
                    }
                }
            }
            
            // Save results
            const results = {
                timestamp: new Date().toISOString(),
                totalOrganizations: organizations.length,
                exactDuplicates: duplicates.exact.length,
                similarNames: duplicates.similar.length,
                duplicateSets: duplicates.exact
            };
            
            console.log('\n📊 Summary:');
            console.log(`   Total organizations: ${results.totalOrganizations}`);
            console.log(`   Exact duplicate sets: ${results.exactDuplicates}`);
            console.log(`   Similar name pairs: ${results.similarNames}`);
            
            return results;
            
        } catch (error) {
            console.error('❌ Error:', error.message);
            throw error;
        }
    }
}

// Run if called directly
if (require.main === module) {
    const checker = new MCPDuplicateChecker();
    const args = process.argv.slice(2);
    const autoArchive = args.includes('--auto-archive');
    
    if (autoArchive) {
        console.log('⚠️  WARNING: Auto-archive mode enabled!');
        console.log('Duplicates will be automatically archived.\n');
    }
    
    checker.run(autoArchive).catch(console.error);
}

module.exports = MCPDuplicateChecker;