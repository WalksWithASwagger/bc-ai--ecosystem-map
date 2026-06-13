#!/usr/bin/env node

/**
 * Database Cleanup Tool
 * Removes contamination, fake data, and non-funders from the funding database
 * 
 * This tool:
 * 1. Identifies and removes non-funding organizations
 * 2. Cleans up fake email addresses (JavaScript libraries, CSS variables, etc.)
 * 3. Removes generic/template descriptions
 * 4. Marks unverified data
 * 5. Provides detailed audit trail
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();

class DatabaseCleanup {
    constructor() {
        this.notion = new Client({
            auth: process.env.NOTION_TOKEN
        });
        this.databaseId = '246c6f799a3381eea3f1e329b7120b44';
        
        // Track cleanup stats
        this.stats = {
            totalEntries: 0,
            nonFundersRemoved: 0,
            fakeEmailsRemoved: 0,
            genericDescriptionsRemoved: 0,
            unverifiedMarked: 0,
            cleanEntries: 0
        };
        
        // Non-funders to remove (contamination)
        this.nonFunders = [
            // Tech companies (not VCs)
            'facebook', 'meta', 'microsoft', 'intel', 'salesforce', 
            'sap', 'nutanix', 'nortonlifelock', 'cloudera', 'auth0',
            'hootsuite', 'dapperlabs', 'elementai', 'freewheel',
            
            // Tourism/Events
            'destinationvancouver', 'destination vancouver',
            'pushfestival', 'push festival', 'doxafestival', 'doxa',
            'vanfashionweek', 'vancouver fashion week', 'vaff',
            'isfestival',
            
            // Museums/Cultural
            'museumofvancouver', 'museum of vancouver', 'moa',
            'vancouvermaritimemuseum', 'vancouver maritime museum',
            'vancouverchinesegarden', 'chinese garden',
            'ecuad', 'capturecentre',
            
            // Media
            'dailyhive', 'daily hive', 'thestar', 'the star',
            'magazinescanada', 'magazines canada',
            
            // Other non-funders
            'hubcycling', 'hub cycling', 'lifelabs', 'jellyacademy',
            'iyacyber', 'emc', 'fortisbc',
            
            // Individual names (not organizations)
            'shafintejani', 'lindasolomon', 'neekoopf',
            
            // Support emails
            'easupport@ea.com', 'https://www.ea.com'
        ];
        
        // Generic descriptions that indicate fake data
        this.genericDescriptions = [
            'Venture capital firm focused on technology investments',
            'Government funding program supporting innovation and economic development',
            'Corporate venture arm investing in strategic opportunities',
            'Foundation supporting projects aligned with its mission',
            'Angel investor network funding early-stage startups',
            'Accelerator program providing funding and mentorship',
            'Grant program offering non-dilutive funding',
            'Private equity firm focused on growth investments',
            'Funding organization',
            'with focus on British Columbia ecosystem',
            'supporting innovative technologies and solutions',
            'focused on social and environmental impact'
        ];
        
        this.cleanupLog = [];
    }

    async run() {
        console.log('🧹 DATABASE CLEANUP TOOL\n');
        console.log('=' .repeat(50));
        console.log('\nStarting comprehensive cleanup...\n');
        
        // Get all entries
        const allEntries = await this.getAllEntries();
        this.stats.totalEntries = allEntries.length;
        console.log(`📊 Total entries to audit: ${this.stats.totalEntries}\n`);
        
        // Process each entry
        for (const entry of allEntries) {
            await this.cleanEntry(entry);
        }
        
        // Generate report
        await this.generateReport();
        
        console.log('\n✅ Cleanup Complete!\n');
        this.printStats();
    }

    async getAllEntries() {
        const entries = [];
        let hasMore = true;
        let cursor = undefined;
        
        while (hasMore) {
            const response = await this.notion.databases.query({
                database_id: this.databaseId,
                start_cursor: cursor,
                page_size: 100
            });
            
            entries.push(...response.results);
            hasMore = response.has_more;
            cursor = response.next_cursor;
        }
        
        return entries;
    }

    async cleanEntry(entry) {
        const name = entry.properties.Name?.title?.[0]?.plain_text || '';
        const email = entry.properties.Email?.email;
        const description = entry.properties.Description?.rich_text?.[0]?.text?.content || '';
        
        console.log(`\n🔍 Auditing: ${name}`);
        
        const actions = [];
        let shouldArchive = false;
        
        // 1. Check if it's a non-funder
        if (this.isNonFunder(name)) {
            console.log(`   ❌ NON-FUNDER: Will archive`);
            shouldArchive = true;
            this.stats.nonFundersRemoved++;
            actions.push('Archived: Non-funding organization');
        }
        
        // If not archiving, clean the data
        if (!shouldArchive) {
            const updates = {};
            
            // 2. Check email validity
            if (email && this.isFakeEmail(email)) {
                console.log(`   ❌ Fake email: ${email}`);
                updates.Email = { email: null };
                this.stats.fakeEmailsRemoved++;
                actions.push(`Removed fake email: ${email}`);
            }
            
            // 3. Check for generic descriptions
            if (this.isGenericDescription(description)) {
                console.log(`   ❌ Generic description detected`);
                // Keep description but mark as unverified
                const cleanDesc = description + '\n\n⚠️ UNVERIFIED: Generic description needs real research';
                updates.Description = {
                    rich_text: [{
                        text: { content: cleanDesc }
                    }]
                };
                this.stats.genericDescriptionsRemoved++;
                actions.push('Marked generic description as unverified');
            }
            
            // 4. Check for mock investment data
            if (description.includes('Recent seed investment in AI startup') ||
                description.includes('Series A in enterprise software company') ||
                description.includes('Led pre-seed round for B2B SaaS') ||
                description.includes('Co-led $5M round in healthcare tech')) {
                console.log(`   ❌ Mock investment data detected`);
                // Remove mock data
                const cleanDesc = description
                    .replace(/🎯 Recent:.*?\n/g, '')
                    .replace(/Recent seed investment.*?\n/g, '')
                    .replace(/Series A in enterprise.*?\n/g, '')
                    .replace(/Led pre-seed.*?\n/g, '')
                    .replace(/Co-led \$5M.*?\n/g, '');
                
                updates.Description = {
                    rich_text: [{
                        text: { content: cleanDesc + '\n\n⚠️ REMOVED: Mock investment data' }
                    }]
                };
                actions.push('Removed mock investment data');
            }
            
            // 5. Apply updates if any
            if (Object.keys(updates).length > 0) {
                try {
                    await this.notion.pages.update({
                        page_id: entry.id,
                        properties: updates
                    });
                    console.log(`   ✅ Cleaned ${Object.keys(updates).length} fields`);
                } catch (error) {
                    console.log(`   ⚠️ Failed to update: ${error.message}`);
                }
            } else {
                console.log(`   ✅ Entry appears clean`);
                this.stats.cleanEntries++;
            }
        }
        
        // Archive if needed
        if (shouldArchive) {
            try {
                await this.notion.pages.update({
                    page_id: entry.id,
                    archived: true
                });
                console.log(`   🗑️ Archived`);
            } catch (error) {
                console.log(`   ⚠️ Failed to archive: ${error.message}`);
            }
        }
        
        // Log actions
        if (actions.length > 0) {
            this.cleanupLog.push({
                id: entry.id,
                name,
                timestamp: new Date().toISOString(),
                actions
            });
        }
    }

    isNonFunder(name) {
        const nameLower = name.toLowerCase();
        return this.nonFunders.some(nf => nameLower.includes(nf));
    }

    isFakeEmail(email) {
        if (!email) return false;
        
        // Check for JavaScript library versions
        if (email.match(/@\d+\.\d+/)) return true;
        
        // Check for CSS variables
        if (email.includes('..')) return true;
        
        // Check for image files
        if (email.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) return true;
        
        // Check for example/test emails
        if (email.includes('example') || email.includes('test')) return true;
        
        // Check for specific known fake emails
        const fakeEmails = [
            'aos@2.3.1', 'webcomponentsjs@2.2.7', 'academicons@1.9.2',
            'wght@200..900', 'Group-254@2x.webp', 'robert@broofa.com',
            'example@email.com', 'renigade@mediaone.net'
        ];
        
        return fakeEmails.includes(email);
    }

    isGenericDescription(description) {
        if (!description) return false;
        
        // Check if description is just one of our generic templates
        return this.genericDescriptions.some(generic => 
            description.includes(generic) && description.length < generic.length + 100
        );
    }

    async generateReport() {
        const fs = require('fs').promises;
        const path = require('path');
        
        const report = {
            timestamp: new Date().toISOString(),
            stats: this.stats,
            cleanupLog: this.cleanupLog
        };
        
        const reportPath = path.join(
            __dirname,
            '../../data/reports',
            `cleanup-report-${new Date().toISOString().split('T')[0]}.json`
        );
        
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 Report saved: ${reportPath}`);
    }

    printStats() {
        console.log('📊 CLEANUP STATISTICS:');
        console.log('=' .repeat(50));
        console.log(`Total entries audited:      ${this.stats.totalEntries}`);
        console.log(`Non-funders removed:        ${this.stats.nonFundersRemoved}`);
        console.log(`Fake emails removed:        ${this.stats.fakeEmailsRemoved}`);
        console.log(`Generic descriptions marked: ${this.stats.genericDescriptionsRemoved}`);
        console.log(`Clean entries (no issues):  ${this.stats.cleanEntries}`);
        console.log(`Contamination rate:         ${Math.round(this.stats.nonFundersRemoved / this.stats.totalEntries * 100)}%`);
    }
}

// Run if called directly
if (require.main === module) {
    const cleanup = new DatabaseCleanup();
    cleanup.run().catch(console.error);
}

module.exports = DatabaseCleanup;