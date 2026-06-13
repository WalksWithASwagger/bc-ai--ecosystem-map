#!/usr/bin/env node

/**
 * Remove Fake Data Tool
 * Cleans up all mock data, fake emails, and generic content from the database
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();

class FakeDataRemover {
    constructor() {
        this.notion = new Client({
            auth: process.env.NOTION_TOKEN
        });
        this.databaseId = '246c6f799a3381eea3f1e329b7120b44';
        
        this.stats = {
            totalProcessed: 0,
            fakeEmailsRemoved: 0,
            mockDataRemoved: 0,
            genericDescriptionsCleared: 0,
            arbitraryScoresRemoved: 0
        };
        
        // Known fake emails from our audit
        this.fakeEmails = [
            'aos@2.3.1',
            'webcomponentsjs@2.2.7', 
            'academicons@1.9.2',
            'wght@200..900',
            'Group-254@2x.webp',
            'robert@broofa.com',
            'example@email.com',
            'renigade@mediaone.net',
            'easupport@ea.com'
        ];
        
        // Mock investment phrases to remove
        this.mockInvestments = [
            'Recent seed investment in AI startup',
            'Led pre-seed round for B2B SaaS',
            'Series A in enterprise software company',
            'Co-led $5M round in healthcare tech'
        ];
        
        // Generic descriptions
        this.genericPhrases = [
            'Venture capital firm focused on technology investments',
            'Government funding program supporting innovation and economic development',
            'Corporate venture arm investing in strategic opportunities',
            'Foundation supporting projects aligned with its mission',
            'Angel investor network funding early-stage startups',
            'Accelerator program providing funding and mentorship',
            'Grant program offering non-dilutive funding',
            'Private equity firm focused on growth investments'
        ];
    }

    async run() {
        console.log('🧽 FAKE DATA REMOVAL TOOL\n');
        console.log('=' .repeat(50));
        console.log('\nRemoving all mock data and fake information...\n');
        
        const entries = await this.getAllEntries();
        console.log(`📊 Processing ${entries.length} entries\n`);
        
        for (const entry of entries) {
            await this.cleanEntry(entry);
            this.stats.totalProcessed++;
        }
        
        await this.saveReport();
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
        
        console.log(`🔍 ${name}`);
        
        const updates = {};
        let hasChanges = false;
        
        // 1. Remove fake emails
        if (email && this.isFakeEmail(email)) {
            console.log(`   ❌ Removing fake email: ${email}`);
            updates.Email = { email: null };
            this.stats.fakeEmailsRemoved++;
            hasChanges = true;
        }
        
        // 2. Clean description
        let cleanedDescription = description;
        let descriptionChanged = false;
        
        // Remove mock investments
        for (const mockPhrase of this.mockInvestments) {
            if (cleanedDescription.includes(mockPhrase)) {
                console.log(`   ❌ Removing mock data: "${mockPhrase.substring(0, 30)}..."`);
                cleanedDescription = cleanedDescription.replace(mockPhrase, '');
                this.stats.mockDataRemoved++;
                descriptionChanged = true;
            }
        }
        
        // Remove lines with mock data patterns
        const lines = cleanedDescription.split('\n');
        const cleanLines = lines.filter(line => {
            // Remove lines with fake recent investments
            if (line.includes('🎯 Recent:') && 
                (line.includes('AI startup') || 
                 line.includes('B2B SaaS') || 
                 line.includes('enterprise software'))) {
                console.log(`   ❌ Removing mock investment line`);
                this.stats.mockDataRemoved++;
                descriptionChanged = true;
                return false;
            }
            
            // Remove lines with fake check sizes from mock data
            if (line.includes('✍️ Check Size:') && 
                (line === '✍️ Check Size: $50K - $500K' || 
                 line === '✍️ Check Size: $1M - $10M')) {
                console.log(`   ❌ Removing mock check size`);
                descriptionChanged = true;
                return false;
            }
            
            // Remove lines with fake partner names
            if (line.includes('👥 Partners:') &&
                (line.includes('Jeremy Liew') || 
                 line.includes('Nicole Quinn') ||
                 line.includes('Reid Hoffman') ||
                 line.includes('Josh Elman'))) {
                console.log(`   ❌ Removing mock partners`);
                descriptionChanged = true;
                return false;
            }
            
            // Remove strategic scores (arbitrary)
            if (line.includes('📊 Strategic Score:')) {
                console.log(`   ❌ Removing arbitrary score`);
                this.stats.arbitraryScoresRemoved++;
                descriptionChanged = true;
                return false;
            }
            
            return true;
        });
        
        cleanedDescription = cleanLines.join('\n').trim();
        
        // Check if it's just a generic description
        let isGeneric = false;
        for (const generic of this.genericPhrases) {
            if (cleanedDescription === generic || 
                (cleanedDescription.startsWith(generic) && cleanedDescription.length < generic.length + 50)) {
                isGeneric = true;
                break;
            }
        }
        
        if (isGeneric) {
            console.log(`   ❌ Clearing generic description`);
            cleanedDescription = '⚠️ NEEDS RESEARCH: Generic description removed';
            this.stats.genericDescriptionsCleared++;
            descriptionChanged = true;
        }
        
        // Update description if changed
        if (descriptionChanged) {
            updates.Description = {
                rich_text: [{
                    text: { content: cleanedDescription }
                }]
            };
            hasChanges = true;
        }
        
        // Apply updates
        if (hasChanges) {
            try {
                await this.notion.pages.update({
                    page_id: entry.id,
                    properties: updates
                });
                console.log(`   ✅ Cleaned`);
            } catch (error) {
                console.log(`   ⚠️ Error: ${error.message}`);
            }
        }
    }

    isFakeEmail(email) {
        // Check against known fake emails
        if (this.fakeEmails.includes(email)) return true;
        
        // Check for JavaScript library patterns
        if (email.match(/@\d+\.\d+/)) return true;
        
        // Check for CSS variables
        if (email.includes('..')) return true;
        
        // Check for image files
        if (email.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) return true;
        
        // Check for test/example emails
        if (email.includes('example') || email.includes('test')) return true;
        
        // Check for non-email patterns
        if (!email.includes('@') || !email.includes('.')) return true;
        
        return false;
    }

    async saveReport() {
        const fs = require('fs').promises;
        const path = require('path');
        
        const report = {
            timestamp: new Date().toISOString(),
            stats: this.stats
        };
        
        const reportPath = path.join(
            __dirname,
            '../../data/reports',
            `fake-data-removal-${new Date().toISOString().split('T')[0]}.json`
        );
        
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 Report saved: ${reportPath}`);
    }

    printStats() {
        console.log('\n📊 FAKE DATA REMOVAL STATISTICS:');
        console.log('=' .repeat(50));
        console.log(`Total entries processed:     ${this.stats.totalProcessed}`);
        console.log(`Fake emails removed:         ${this.stats.fakeEmailsRemoved}`);
        console.log(`Mock data removed:           ${this.stats.mockDataRemoved}`);
        console.log(`Generic descriptions cleared: ${this.stats.genericDescriptionsCleared}`);
        console.log(`Arbitrary scores removed:    ${this.stats.arbitraryScoresRemoved}`);
        console.log(`\n✅ Database cleaned of fake data!`);
    }
}

// Run if called directly
if (require.main === module) {
    const remover = new FakeDataRemover();
    remover.run().catch(console.error);
}

module.exports = FakeDataRemover;