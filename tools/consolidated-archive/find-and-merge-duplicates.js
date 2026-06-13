#!/usr/bin/env node

/**
 * Find and Merge Duplicates
 * Identifies duplicates and merges them intelligently
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

class DuplicateMerger {
    constructor() {
        this.notion = new Client({ 
            auth: process.env.NOTION_TOKEN
        });
        this.databaseId = process.env.AI_COMPANY_DB_ID;
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
                page_size: 100
            });

            organizations.push(...response.results);
            hasMore = response.has_more;
            startCursor = response.next_cursor;
        }

        console.log(`✅ Fetched ${organizations.length} organizations\n`);
        return organizations;
    }

    normalizeString(str) {
        if (!str) return '';
        return str
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s]/g, '')
            .replace(/\b(inc|corp|corporation|ltd|limited|llc|technologies|technology|tech)\b/g, '')
            .trim();
    }

    extractOrgData(org) {
        const props = org.properties;
        return {
            id: org.id,
            name: props.Name?.title?.[0]?.plain_text || '',
            website: props.Website?.url || '',
            linkedin: props.LinkedIn?.url || '',
            email: props.Email?.email || '',
            phone: props.Phone?.phone_number || '',
            city: props['City/Region']?.rich_text?.[0]?.plain_text || '',
            bcRegion: props['BC Region']?.select?.name || '',
            category: props.Category?.select?.name || '',
            aiFocus: props['AI Focus Areas']?.multi_select?.map(s => s.name) || [],
            yearFounded: props['Year Founded']?.number || null,
            size: props.Size?.rich_text?.[0]?.plain_text || '',
            blurb: props['Short Blurb']?.rich_text?.[0]?.plain_text || '',
            keyPeople: props['Key People']?.rich_text?.[0]?.plain_text || '',
            funding: props.Funding?.rich_text?.[0]?.plain_text || '',
            latitude: props.Latitude?.number || null,
            longitude: props.Longitude?.number || null,
            logo: props.Logo?.files?.[0] || null,
            created: org.created_time,
            updated: org.last_edited_time
        };
    }

    calculateCompleteness(data) {
        const fields = [
            'website', 'linkedin', 'email', 'phone', 
            'city', 'bcRegion', 'category', 'yearFounded',
            'blurb', 'keyPeople', 'funding', 'latitude', 'longitude', 'logo'
        ];
        
        let filled = 0;
        fields.forEach(field => {
            const value = data[field];
            if (value && (Array.isArray(value) ? value.length > 0 : true)) {
                filled++;
            }
        });
        
        return (filled / fields.length) * 100;
    }

    findDuplicates(organizations) {
        console.log('🔍 Finding duplicates...\n');
        
        const nameGroups = new Map();
        const duplicateSets = [];
        
        // Group by normalized name
        organizations.forEach(org => {
            const data = this.extractOrgData(org);
            if (!data.name) return;
            
            const normalized = this.normalizeString(data.name);
            if (!normalized) return;
            
            if (!nameGroups.has(normalized)) {
                nameGroups.set(normalized, []);
            }
            
            data.completeness = this.calculateCompleteness(data);
            nameGroups.get(normalized).push(data);
        });
        
        // Find duplicates
        nameGroups.forEach((orgs, normalizedName) => {
            if (orgs.length > 1) {
                // Sort by completeness and then by creation date
                orgs.sort((a, b) => {
                    if (Math.abs(a.completeness - b.completeness) > 5) {
                        return b.completeness - a.completeness;
                    }
                    return new Date(a.created) - new Date(b.created);
                });
                
                duplicateSets.push({
                    normalizedName,
                    count: orgs.length,
                    organizations: orgs,
                    bestEntry: orgs[0]
                });
            }
        });
        
        return duplicateSets;
    }

    mergeData(entries) {
        // Start with the best entry (most complete)
        const merged = { ...entries[0] };
        
        // Merge data from other entries
        entries.slice(1).forEach(entry => {
            // Fill in missing fields
            if (!merged.website && entry.website) merged.website = entry.website;
            if (!merged.linkedin && entry.linkedin) merged.linkedin = entry.linkedin;
            if (!merged.email && entry.email) merged.email = entry.email;
            if (!merged.phone && entry.phone) merged.phone = entry.phone;
            if (!merged.city && entry.city) merged.city = entry.city;
            if (!merged.bcRegion && entry.bcRegion) merged.bcRegion = entry.bcRegion;
            if (!merged.category && entry.category) merged.category = entry.category;
            if (!merged.yearFounded && entry.yearFounded) merged.yearFounded = entry.yearFounded;
            if (!merged.size && entry.size) merged.size = entry.size;
            if (!merged.blurb && entry.blurb) merged.blurb = entry.blurb;
            if (!merged.keyPeople && entry.keyPeople) merged.keyPeople = entry.keyPeople;
            if (!merged.funding && entry.funding) merged.funding = entry.funding;
            if (!merged.latitude && entry.latitude) merged.latitude = entry.latitude;
            if (!merged.longitude && entry.longitude) merged.longitude = entry.longitude;
            if (!merged.logo && entry.logo) merged.logo = entry.logo;
            
            // Merge AI focus areas
            if (entry.aiFocus && entry.aiFocus.length > 0) {
                const existingFocus = new Set(merged.aiFocus || []);
                entry.aiFocus.forEach(focus => existingFocus.add(focus));
                merged.aiFocus = Array.from(existingFocus);
            }
            
            // Choose longer/better descriptions
            if (entry.blurb && entry.blurb.length > (merged.blurb || '').length) {
                merged.blurb = entry.blurb;
            }
            if (entry.keyPeople && entry.keyPeople.length > (merged.keyPeople || '').length) {
                merged.keyPeople = entry.keyPeople;
            }
            if (entry.funding && entry.funding.length > (merged.funding || '').length) {
                merged.funding = entry.funding;
            }
        });
        
        return merged;
    }

    generateReport(duplicateSets) {
        console.log('📋 Duplicate Analysis Report\n');
        console.log('============================\n');
        
        if (duplicateSets.length === 0) {
            console.log('✅ No duplicates found!\n');
            return;
        }
        
        console.log(`🔴 Found ${duplicateSets.length} sets of duplicates\n`);
        
        duplicateSets.forEach((set, index) => {
            console.log(`${index + 1}. "${set.organizations[0].name}" (${set.count} entries)`);
            console.log(`   Best entry: ${set.bestEntry.name} (${Math.round(set.bestEntry.completeness)}% complete)`);
            
            set.organizations.forEach(org => {
                console.log(`   - ${org.name}`);
                console.log(`     Completeness: ${Math.round(org.completeness)}%`);
                console.log(`     Website: ${org.website || 'none'}`);
                console.log(`     Created: ${new Date(org.created).toLocaleDateString()}`);
                console.log(`     ID: ${org.id}`);
            });
            
            console.log('');
        });
        
        // Summary stats
        const totalDuplicates = duplicateSets.reduce((sum, set) => sum + set.count - 1, 0);
        console.log(`📊 Summary:`);
        console.log(`   Duplicate sets: ${duplicateSets.length}`);
        console.log(`   Total duplicates to remove: ${totalDuplicates}`);
        console.log(`   Entries after cleanup: ${678 - totalDuplicates}`);
    }

    async updateEntry(id, mergedData) {
        const updateData = {
            page_id: id,
            properties: {}
        };
        
        // Only update non-empty fields
        if (mergedData.website) {
            updateData.properties.Website = { url: mergedData.website };
        }
        if (mergedData.linkedin) {
            updateData.properties.LinkedIn = { url: mergedData.linkedin };
        }
        if (mergedData.email) {
            updateData.properties.Email = { email: mergedData.email };
        }
        if (mergedData.phone) {
            updateData.properties.Phone = { phone_number: mergedData.phone };
        }
        if (mergedData.city) {
            updateData.properties['City/Region'] = { 
                rich_text: [{ text: { content: mergedData.city } }] 
            };
        }
        if (mergedData.bcRegion) {
            updateData.properties['BC Region'] = { select: { name: mergedData.bcRegion } };
        }
        if (mergedData.category) {
            updateData.properties.Category = { select: { name: mergedData.category } };
        }
        if (mergedData.yearFounded) {
            updateData.properties['Year Founded'] = { number: mergedData.yearFounded };
        }
        if (mergedData.blurb) {
            updateData.properties['Short Blurb'] = { 
                rich_text: [{ text: { content: mergedData.blurb.substring(0, 2000) } }] 
            };
        }
        if (mergedData.keyPeople) {
            updateData.properties['Key People'] = { 
                rich_text: [{ text: { content: mergedData.keyPeople.substring(0, 2000) } }] 
            };
        }
        if (mergedData.funding) {
            updateData.properties.Funding = { 
                rich_text: [{ text: { content: mergedData.funding.substring(0, 2000) } }] 
            };
        }
        if (mergedData.aiFocus && mergedData.aiFocus.length > 0) {
            updateData.properties['AI Focus Areas'] = { 
                multi_select: mergedData.aiFocus.map(name => ({ name }))
            };
        }
        if (mergedData.latitude) {
            updateData.properties.Latitude = { number: mergedData.latitude };
        }
        if (mergedData.longitude) {
            updateData.properties.Longitude = { number: mergedData.longitude };
        }
        
        await this.notion.pages.update(updateData);
    }

    async deleteEntry(id) {
        // Archive the page instead of hard delete
        await this.notion.pages.update({
            page_id: id,
            archived: true
        });
    }

    async processDuplicates(duplicateSets, dryRun = true) {
        if (duplicateSets.length === 0) return;
        
        console.log(`\n${dryRun ? '🔍 DRY RUN -' : '🚀'} Processing duplicates...\n`);
        
        const mergeLog = [];
        
        for (const set of duplicateSets) {
            console.log(`Processing "${set.organizations[0].name}"...`);
            
            // Merge all data
            const mergedData = this.mergeData(set.organizations);
            const keepId = set.bestEntry.id;
            const deleteIds = set.organizations.slice(1).map(org => org.id);
            
            mergeLog.push({
                name: set.organizations[0].name,
                kept: keepId,
                deleted: deleteIds,
                mergedData
            });
            
            if (!dryRun) {
                try {
                    // Update the best entry with merged data
                    await this.updateEntry(keepId, mergedData);
                    console.log(`  ✅ Updated ${keepId} with merged data`);
                    
                    // Delete the duplicates
                    for (const deleteId of deleteIds) {
                        await this.deleteEntry(deleteId);
                        console.log(`  🗑️  Archived duplicate ${deleteId}`);
                    }
                } catch (error) {
                    console.error(`  ❌ Error: ${error.message}`);
                }
            } else {
                console.log(`  Would update ${keepId} and delete ${deleteIds.length} duplicates`);
            }
        }
        
        // Save merge log
        const logPath = path.join(__dirname, '..', 'reports', `duplicate-merge-log-${new Date().toISOString().split('T')[0]}.json`);
        fs.writeFileSync(logPath, JSON.stringify(mergeLog, null, 2));
        console.log(`\n📝 Merge log saved to: ${logPath}`);
        
        return mergeLog;
    }

    async run(options = {}) {
        const { dryRun = true, autoMerge = false } = options;
        
        console.log('🧹 Duplicate Finder & Merger');
        console.log('============================\n');
        
        try {
            const organizations = await this.fetchAllOrganizations();
            const duplicateSets = this.findDuplicates(organizations);
            this.generateReport(duplicateSets);
            
            if (autoMerge && duplicateSets.length > 0) {
                await this.processDuplicates(duplicateSets, dryRun);
            }
            
            return duplicateSets;
            
        } catch (error) {
            console.error('❌ Error:', error.message);
            throw error;
        }
    }
}

// Run if called directly
if (require.main === module) {
    const merger = new DuplicateMerger();
    const args = process.argv.slice(2);
    
    const options = {
        dryRun: !args.includes('--execute'),
        autoMerge: args.includes('--merge')
    };
    
    if (options.autoMerge && !options.dryRun) {
        console.log('⚠️  WARNING: Will merge and delete duplicates!\n');
    }
    
    merger.run(options).catch(console.error);
}

module.exports = DuplicateMerger;