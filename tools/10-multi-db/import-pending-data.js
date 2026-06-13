#!/usr/bin/env node

/**
 * Import Pending Data to Notion
 * Imports funding amounts and AI company data that's sitting in local files
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

class PendingDataImporter {
    constructor() {
        // Main company database
        this.mainNotion = new Client({
            auth: process.env.NOTION_TOKEN
        });
        this.mainDbId = process.env.AI_COMPANY_DB_ID;
        
        // Funding database  
        this.fundingNotion = new Client({
            auth: process.env.NOTION_TOKEN
        });
        this.fundingDbId = '246c6f799a3381eea3f1e329b7120b44';
        
        this.stats = {
            companiesProcessed: 0,
            fundingUpdated: 0,
            newCompaniesAdded: 0,
            errors: []
        };
    }

    async run() {
        console.log('📥 IMPORTING PENDING DATA TO NOTION\n');
        console.log('=' .repeat(50));
        
        // Load local data
        const betakitPath = path.join(__dirname, '../../data/discoveries/2025-08-04_betakit-bc-funding.json');
        const bcTechPath = path.join(__dirname, '../../data/imports/bc-tech-ai-companies-2025.json');
        
        const betakitData = JSON.parse(await fs.readFile(betakitPath, 'utf-8'));
        const bcTechData = JSON.parse(await fs.readFile(bcTechPath, 'utf-8'));
        
        console.log(`\n📊 Data to Import:`);
        console.log(`- BetaKit: ${betakitData.companies.length} companies with funding`);
        console.log(`- BC Tech: ${bcTechData.length} AI companies\n`);
        
        // Import funding data
        console.log('💰 Importing Funding Data...\n');
        for (const company of betakitData.companies) {
            await this.importFundingData(company);
        }
        
        // Import AI companies
        console.log('\n🤖 Importing AI Companies...\n');
        for (const company of bcTechData) {
            await this.importAICompany(company);
        }
        
        this.printReport();
    }

    async importFundingData(fundingData) {
        const name = fundingData.companyName;
        const amount = fundingData.totalRaised;
        
        if (!name || !amount) return;
        
        console.log(`   💰 ${name}: $${amount}M`);
        
        try {
            // Check if company exists in main DB
            const existing = await this.mainNotion.databases.query({
                database_id: this.mainDbId,
                filter: {
                    property: 'Name',
                    title: { contains: name }
                },
                page_size: 1
            });
            
            if (existing.results.length > 0) {
                // Update existing with funding info
                const updates = {
                    'Funding': {
                        rich_text: [{
                            text: {
                                content: `$${amount}M raised (Source: BetaKit, Aug 2025)`
                            }
                        }]
                    }
                };
                
                // Add to Notes if exists
                const currentNotes = existing.results[0].properties.Notes?.rich_text?.[0]?.plain_text || '';
                if (!currentNotes.includes(`$${amount}M`)) {
                    updates['Notes'] = {
                        rich_text: [{
                            text: {
                                content: currentNotes + `\n\nFunding: $${amount}M raised (BetaKit, Aug 2025)`
                            }
                        }]
                    };
                }
                
                await this.mainNotion.pages.update({
                    page_id: existing.results[0].id,
                    properties: updates
                });
                
                console.log(`      ✅ Updated funding info`);
                this.stats.fundingUpdated++;
            } else {
                console.log(`      ⚠️ Company not in main DB, skipping`);
            }
            
            this.stats.companiesProcessed++;
            
        } catch (error) {
            console.log(`      ❌ Error: ${error.message}`);
            this.stats.errors.push({ company: name, error: error.message });
        }
    }

    async importAICompany(companyData) {
        const name = companyData.name;
        const website = companyData.website;
        const location = companyData.location;
        const category = companyData.category;
        const description = companyData.description;
        
        console.log(`   🤖 ${name} (${category})`);
        
        try {
            // Check if exists
            const existing = await this.mainNotion.databases.query({
                database_id: this.mainDbId,
                filter: {
                    property: 'Name',
                    title: { contains: name }
                },
                page_size: 1
            });
            
            if (existing.results.length > 0) {
                // Update with additional info
                const updates = {};
                
                if (category && !existing.results[0].properties.Category?.select?.name) {
                    updates['Category'] = { select: { name: category } };
                }
                
                if (location && !existing.results[0].properties.Location?.rich_text?.[0]?.plain_text) {
                    updates['Location'] = {
                        rich_text: [{ text: { content: location } }]
                    };
                }
                
                if (Object.keys(updates).length > 0) {
                    await this.mainNotion.pages.update({
                        page_id: existing.results[0].id,
                        properties: updates
                    });
                    console.log(`      ✅ Updated with category/location`);
                } else {
                    console.log(`      ⏭️ Already complete`);
                }
                
            } else {
                // Create new entry
                await this.mainNotion.pages.create({
                    parent: { database_id: this.mainDbId },
                    properties: {
                        'Name': { title: [{ text: { content: name } }] },
                        'Website': website ? { url: website } : undefined,
                        'Location': {
                            rich_text: [{ text: { content: location || 'BC' } }]
                        },
                        'Category': { select: { name: category || 'AI Company' } },
                        'Description': {
                            rich_text: [{ text: { content: description || '' } }]
                        },
                        'Status': { select: { name: 'Active' } },
                        'AI Focus': { checkbox: true }
                    }
                });
                
                console.log(`      ✅ Added new AI company`);
                this.stats.newCompaniesAdded++;
            }
            
            this.stats.companiesProcessed++;
            
        } catch (error) {
            console.log(`      ❌ Error: ${error.message}`);
            this.stats.errors.push({ company: name, error: error.message });
        }
    }

    printReport() {
        console.log('\n' + '=' .repeat(50));
        console.log('📊 IMPORT REPORT\n');
        console.log(`Companies processed: ${this.stats.companiesProcessed}`);
        console.log(`Funding info updated: ${this.stats.fundingUpdated}`);
        console.log(`New companies added: ${this.stats.newCompaniesAdded}`);
        
        if (this.stats.errors.length > 0) {
            console.log(`\n⚠️ Errors (${this.stats.errors.length}):`);
            this.stats.errors.forEach(e => {
                console.log(`   - ${e.company}: ${e.error}`);
            });
        }
        
        console.log('\n✅ Import complete!');
    }
}

// Run
const importer = new PendingDataImporter();
importer.run().catch(console.error);