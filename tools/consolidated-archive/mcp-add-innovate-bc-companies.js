#!/usr/bin/env node

/**
 * MCP-Compatible Company Adder for Innovate BC Recipients
 * Adds new companies with funding info using direct API calls
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();

class MCPCompanyAdder {
    constructor() {
        // Use the working token directly
        this.notion = new Client({ 
            auth: process.env.NOTION_TOKEN
        });
        this.databaseId = process.env.AI_COMPANY_DB_ID;
    }

    async addCompany(companyData) {
        console.log(`\n📝 Adding ${companyData.name}...`);
        
        try {
            const response = await this.notion.pages.create({
                parent: { database_id: this.databaseId },
                properties: {
                    'Name': {
                        title: [{
                            text: { content: companyData.name }
                        }]
                    },
                    'Short Blurb': {
                        rich_text: [{
                            text: { content: companyData.description }
                        }]
                    },
                    'Category': {
                        select: { name: companyData.category }
                    },
                    'City/Region': {
                        rich_text: [{
                            text: { content: companyData.city || 'British Columbia' }
                        }]
                    },
                    'BC Region': {
                        select: { name: companyData.region || 'Unknown' }
                    },
                    'Funding': {
                        rich_text: [{
                            text: { content: companyData.funding }
                        }]
                    },
                    'Year Founded': {
                        number: companyData.yearFounded || null
                    },
                    'Data Source': {
                        select: { name: 'Innovate BC' }
                    },
                    'Last Verified': {
                        date: { start: new Date().toISOString() }
                    }
                }
            });

            console.log(`✅ Successfully added ${companyData.name}`);
            console.log(`   Page ID: ${response.id}`);
            return { status: 'success', pageId: response.id };

        } catch (error) {
            console.error(`❌ Failed to add ${companyData.name}:`, error.message);
            return { status: 'error', error: error.message };
        }
    }

    async addInnovateBCCompanies() {
        console.log('🚀 MCP Company Adder - Innovate BC Recipients');
        console.log('=============================================\n');

        const companies = [
            {
                name: 'Quartech Systems Ltd.',
                description: 'Technology consulting and software development company providing digital transformation solutions',
                category: 'Technology Companies',
                funding: '$2.83M from Innovate BC (2025) - Part of $2.83M total award to 4 companies for technology innovation',
                city: 'Vancouver',
                region: 'Lower Mainland'
            },
            {
                name: 'Affinity Group',
                description: 'Business consulting and professional services firm focused on organizational development',
                category: 'Business Services',
                funding: 'Part of $2.83M Innovate BC award (2025) - Shared with Quartech, Novatone, Daric for innovation initiatives',
                city: 'Vancouver',
                region: 'Lower Mainland'
            },
            {
                name: 'Novatone Consulting Ltd.',
                description: 'IT consulting and managed services provider specializing in cloud solutions',
                category: 'Technology Companies',
                funding: 'Part of $2.83M Innovate BC award (2025) - Shared with Quartech, Affinity, Daric for technology advancement',
                city: 'Vancouver',
                region: 'Lower Mainland'
            },
            {
                name: 'Daric Clouding Solutions',
                description: 'Cloud infrastructure and data management solutions provider',
                category: 'Technology Companies',
                funding: 'Part of $2.83M Innovate BC award (2025) - Shared with Quartech, Affinity, Novatone for cloud innovation',
                city: 'Vancouver',
                region: 'Lower Mainland'
            }
        ];

        const results = {
            success: [],
            errors: []
        };

        for (const company of companies) {
            const result = await this.addCompany(company);
            
            if (result.status === 'success') {
                results.success.push({ name: company.name, pageId: result.pageId });
            } else {
                results.errors.push({ name: company.name, error: result.error });
            }

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Summary
        console.log('\n📊 Summary:');
        console.log(`   ✅ Successfully added: ${results.success.length}`);
        console.log(`   ❌ Failed: ${results.errors.length}`);

        if (results.success.length > 0) {
            console.log('\n🎉 Companies added to database:');
            results.success.forEach(r => console.log(`   - ${r.name} (${r.pageId})`));
        }

        return results;
    }
}

// Run if called directly
if (require.main === module) {
    const adder = new MCPCompanyAdder();
    adder.addInnovateBCCompanies().catch(console.error);
}

module.exports = MCPCompanyAdder;