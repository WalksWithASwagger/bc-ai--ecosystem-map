#!/usr/bin/env node

/**
 * MCP Compare and Import Missing Funders
 * Compare original 304 funders with current database and import missing ones
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

class MCPCompareAndImport {
    constructor() {
        // Use correct MCP pattern with embedded token
        this.notion = new Client({
            auth: process.env.NOTION_TOKEN
        });
        this.databaseId = '246c6f799a3381eea3f1e329b7120b44';
        this.originalFunders = [];
        this.currentFunders = [];
        this.missingFunders = [];
        this.cleanedFunders = [];
    }

    async loadOriginalFunders() {
        console.log('📊 Loading original 304 funders from extraction...');
        
        const originalPath = '/Users/kk/ecosystem-map-bc-ai/data/projects/funding-intelligence/data/raw/direct-notion-extract-1754349732081.json';
        const data = JSON.parse(fs.readFileSync(originalPath, 'utf8'));
        
        this.originalFunders = data.funders;
        console.log(`✅ Loaded ${this.originalFunders.length} original funders`);
        
        return this.originalFunders;
    }

    async getCurrentFunders() {
        console.log('📊 Getting current funders from database...');
        
        try {
            const response = await this.notion.databases.query({
                database_id: this.databaseId,
                page_size: 100
            });
            
            this.currentFunders = response.results.map(page => ({
                name: page.properties.Name?.title?.[0]?.plain_text || 'Unknown',
                id: page.id
            }));
            
            console.log(`✅ Found ${this.currentFunders.length} current funders in database`);
            return this.currentFunders;
        } catch (error) {
            console.error('❌ Failed to fetch current funders:', error.message);
            throw error;
        }
    }

    cleanFunderData(funder) {
        // Clean up the funder data from original extraction
        let name = funder.name || '';
        let contact = funder.contact || '';
        let website = funder.website || '';
        let description = funder.description || '';
        
        // Skip obviously bad entries
        if (!name || name.length < 2) return null;
        if (name.includes('Here is the') || name.includes('master funder list')) return null;
        if (name.startsWith('Contact:') || name.startsWith('Website:') || name.startsWith('Research')) return null;
        
        // Clean up names that are actually URLs or emails
        if (name.startsWith('http')) {
            website = name;
            name = this.extractCompanyFromUrl(name);
        }
        if (name.includes('@')) {
            contact = name;
            name = this.extractCompanyFromEmail(name);
        }
        
        // Extract proper names from mixed content
        if (name.includes(' - ') && !name.includes('http')) {
            const parts = name.split(' - ');
            name = parts[0].trim();
            if (!description && parts[1]) {
                description = parts[1].trim();
            }
        }
        
        // Determine funder type
        let type = 'Fund';
        if (name.includes('Capital') || name.includes('Ventures') || name.includes('Partners')) {
            type = 'VC';
        } else if (name.includes('Government') || name.includes('Council') || name.includes('SSHRC') || name.includes('NSERC')) {
            type = 'Government';
        } else if (name.includes('Foundation')) {
            type = 'Foundation';
        } else if (name.includes('Angel') || name.includes('Network')) {
            type = 'Angel Network';
        }
        
        // Extract location if present
        let location = '';
        if (description.includes('Vancouver') || description.includes('BC')) {
            location = 'Vancouver, BC';
        } else if (description.includes('Toronto') || description.includes('ON')) {
            location = 'Toronto, ON';
        } else if (description.includes('Montreal') || description.includes('QC')) {
            location = 'Montreal, QC';
        } else if (description.includes('Silicon Valley') || description.includes('San Francisco')) {
            location = 'San Francisco, CA';
        }
        
        return {
            name: name.trim(),
            type,
            location,
            website: website.startsWith('http') ? website : '',
            contact: contact.includes('@') ? contact : '',
            description: description.trim()
        };
    }

    extractCompanyFromUrl(url) {
        try {
            const domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
            const parts = domain.split('.');
            if (parts.length > 1) {
                return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
            }
            return domain;
        } catch (error) {
            return 'Unknown Company';
        }
    }

    extractCompanyFromEmail(email) {
        try {
            const domain = email.split('@')[1];
            const parts = domain.split('.');
            if (parts.length > 1) {
                return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
            }
            return domain;
        } catch (error) {
            return 'Unknown Company';
        }
    }

    findMissingFunders() {
        console.log('🔍 Comparing original vs current funders...');
        
        // Clean and filter original funders
        this.cleanedFunders = this.originalFunders
            .map(funder => this.cleanFunderData(funder))
            .filter(funder => funder !== null && funder.name.length > 2);
        
        console.log(`✅ Cleaned to ${this.cleanedFunders.length} valid funders`);
        
        // Find missing funders
        const currentNames = new Set(this.currentFunders.map(f => f.name.toLowerCase()));
        
        this.missingFunders = this.cleanedFunders.filter(funder => {
            const nameKey = funder.name.toLowerCase();
            return !currentNames.has(nameKey);
        });
        
        console.log(`🔍 Found ${this.missingFunders.length} missing funders to import`);
        
        return this.missingFunders;
    }

    async importMissingFunders() {
        if (this.missingFunders.length === 0) {
            console.log('✅ No missing funders to import');
            return { imported: 0, failed: 0 };
        }

        console.log(`📥 Importing ${this.missingFunders.length} missing funders...`);
        
        let imported = 0;
        let failed = 0;
        
        // Import in small batches
        const batchSize = 5;
        
        for (let i = 0; i < this.missingFunders.length; i += batchSize) {
            const batch = this.missingFunders.slice(i, i + batchSize);
            
            console.log(`📥 Importing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(this.missingFunders.length/batchSize)}...`);
            
            for (const funder of batch) {
                try {
                    await this.notion.pages.create({
                        parent: { database_id: this.databaseId },
                        properties: {
                            "Name": {
                                title: [{ text: { content: funder.name } }]
                            },
                            "Type": {
                                select: { name: funder.type }
                            },
                            "Location": {
                                rich_text: [{ text: { content: funder.location } }]
                            },
                            "Website": {
                                url: funder.website || null
                            },
                            "Contact": {
                                email: funder.contact && funder.contact.includes('@') ? funder.contact : null
                            },
                            "Description": {
                                rich_text: [{ text: { content: funder.description.substring(0, 1500) } }]
                            },
                            "Status": {
                                select: { name: "candidate" }
                            }
                        }
                    });
                    
                    imported++;
                    console.log(`   ✅ ${funder.name}`);
                    
                } catch (error) {
                    console.log(`   ❌ Failed: ${funder.name} - ${error.message}`);
                    failed++;
                }
                
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Pause between batches
            console.log(`   📊 Batch complete. Progress: ${imported}/${this.missingFunders.length}`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        return { imported, failed };
    }

    generateReport() {
        console.log('\n📊 FUNDER COMPARISON REPORT');
        console.log('='.repeat(50));
        console.log(`📁 Original funders extracted: ${this.originalFunders.length}`);
        console.log(`🧹 Cleaned valid funders: ${this.cleanedFunders.length}`);
        console.log(`💾 Current database funders: ${this.currentFunders.length}`);
        console.log(`❓ Missing funders found: ${this.missingFunders.length}`);
        
        if (this.missingFunders.length > 0) {
            console.log('\n🔍 Top 10 Missing Funders:');
            this.missingFunders.slice(0, 10).forEach((funder, idx) => {
                console.log(`   ${idx + 1}. ${funder.name} (${funder.type})`);
                if (funder.website) console.log(`      🌐 ${funder.website}`);
                if (funder.contact) console.log(`      📧 ${funder.contact}`);
            });
        }
    }

    async run() {
        try {
            console.log('🚀 Starting MCP Compare and Import...');
            
            // Load original and current funders
            await this.loadOriginalFunders();
            await this.getCurrentFunders();
            
            // Find missing funders
            this.findMissingFunders();
            
            // Generate comparison report
            this.generateReport();
            
            // Import missing funders
            const results = await this.importMissingFunders();
            
            console.log('\n🎉 Import Complete!');
            console.log(`✅ Successfully imported: ${results.imported} funders`);
            console.log(`❌ Failed to import: ${results.failed} funders`);
            console.log(`🔗 Database URL: https://notion.so/${this.databaseId.replace(/-/g, '')}`);
            
            console.log('\n🚀 Next Steps:');
            console.log('   1. Review newly imported funders in database');
            console.log('   2. Run enrichment pipeline on new entries');
            console.log('   3. Validate contact information');
            console.log('   4. Update priorities based on research');

            return {
                success: true,
                imported: results.imported,
                failed: results.failed,
                totalMissing: this.missingFunders.length
            };

        } catch (error) {
            console.error('❌ Import failed:', error.message);
            return { success: false, error: error.message };
        }
    }
}

if (require.main === module) {
    const importer = new MCPCompareAndImport();
    importer.run().catch(console.error);
}

module.exports = MCPCompareAndImport;