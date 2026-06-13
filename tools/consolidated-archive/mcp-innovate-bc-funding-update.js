#!/usr/bin/env node

/**
 * MCP-Compatible Innovate BC Funding Updater
 * Adds funding information for companies using direct API calls with working token
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();

class MCPFundingUpdater {
    constructor() {
        // Use the working token directly
        this.notion = new Client({ 
            auth: process.env.NOTION_TOKEN
        });
        this.databaseId = process.env.AI_COMPANY_DB_ID;
    }

    async checkAndUpdateCompany(companyName, fundingInfo) {
        console.log(`\n🔍 Checking ${companyName}...`);
        
        try {
            // Query for the company
            const response = await this.notion.databases.query({
                database_id: this.databaseId,
                filter: {
                    property: 'Name',
                    title: { contains: companyName }
                }
            });

            if (response.results.length === 0) {
                console.log(`❌ ${companyName} NOT IN DATABASE - needs to be added`);
                return { status: 'not_found', company: companyName };
            }

            const page = response.results[0];
            const existingFunding = page.properties.Funding?.rich_text[0]?.plain_text || '';
            
            console.log(`✅ Found ${companyName} (ID: ${page.id})`);
            console.log(`   Current funding: ${existingFunding || 'None'}`);

            // Update funding information
            const updatedFunding = existingFunding 
                ? `${existingFunding}\n${fundingInfo}`
                : fundingInfo;

            await this.notion.pages.update({
                page_id: page.id,
                properties: {
                    'Funding': {
                        rich_text: [{
                            text: { content: updatedFunding }
                        }]
                    },
                    'Last Verified': {
                        date: { start: new Date().toISOString() }
                    }
                }
            });

            console.log(`💰 Updated funding for ${companyName}`);
            return { status: 'updated', company: companyName, pageId: page.id };

        } catch (error) {
            console.error(`❌ Error processing ${companyName}:`, error.message);
            return { status: 'error', company: companyName, error: error.message };
        }
    }

    async updateInnovateBCFunding() {
        console.log('🚀 MCP Innovate BC Funding Updater');
        console.log('==================================\n');

        const fundingData = {
            'Quartech Systems Ltd.': '$2.83M from Innovate BC (2025) - Part of $2.83M total award to 4 companies',
            'Affinity Group': 'Part of $2.83M Innovate BC award (2025) - Shared with Quartech, Novatone, Daric',
            'Novatone Consulting Ltd.': 'Part of $2.83M Innovate BC award (2025) - Shared with Quartech, Affinity, Daric',
            'Daric Clouding Solutions': 'Part of $2.83M Innovate BC award (2025) - Shared with Quartech, Affinity, Novatone'
        };

        const results = {
            updated: [],
            not_found: [],
            errors: []
        };

        for (const [company, funding] of Object.entries(fundingData)) {
            const result = await this.checkAndUpdateCompany(company, funding);
            
            if (result.status === 'updated') {
                results.updated.push(result);
            } else if (result.status === 'not_found') {
                results.not_found.push(result);
            } else {
                results.errors.push(result);
            }

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Summary
        console.log('\n📊 Summary:');
        console.log(`   ✅ Updated: ${results.updated.length}`);
        console.log(`   ❌ Not found: ${results.not_found.length}`);
        console.log(`   ⚠️  Errors: ${results.errors.length}`);

        if (results.not_found.length > 0) {
            console.log('\n🆕 Companies to add to database:');
            results.not_found.forEach(r => console.log(`   - ${r.company}`));
        }

        return results;
    }
}

// Run if called directly
if (require.main === module) {
    const updater = new MCPFundingUpdater();
    updater.updateInnovateBCFunding().catch(console.error);
}

module.exports = MCPFundingUpdater;