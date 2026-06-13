#!/usr/bin/env node

/**
 * Manual Funder Research Tool
 * 
 * This tool helps with REAL research by:
 * 1. Listing funders that need research
 * 2. Providing templates for manual data entry
 * 3. Validating all inputs
 * 4. Tracking data sources
 * 
 * NO FAKE DATA. NO MOCK DATA. NO GUESSING.
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();
const readline = require('readline');

class ManualFunderResearch {
    constructor() {
        this.notion = new Client({
            auth: process.env.NOTION_TOKEN
        });
        this.databaseId = '246c6f799a3381eea3f1e329b7120b44';
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async run() {
        console.log('📚 MANUAL FUNDER RESEARCH TOOL\n');
        console.log('=' .repeat(50));
        console.log('\nThis tool helps you add REAL, VERIFIED data.');
        console.log('NO fake data will be generated.\n');
        
        // Get funders needing research
        const needsResearch = await this.getFundersNeedingResearch();
        
        if (needsResearch.length === 0) {
            console.log('✅ No funders need research!');
            this.rl.close();
            return;
        }
        
        console.log(`Found ${needsResearch.length} funders needing research:\n`);
        
        // Show list
        needsResearch.forEach((funder, index) => {
            const name = funder.properties.Name?.title?.[0]?.plain_text || '';
            const website = funder.properties.Website?.url || 'No website';
            console.log(`${index + 1}. ${name}`);
            console.log(`   Website: ${website}`);
            console.log(`   ID: ${funder.id}\n`);
        });
        
        // Ask which to research
        const choice = await this.askQuestion('\nEnter number to research (or "exit"): ');
        
        if (choice.toLowerCase() === 'exit') {
            this.rl.close();
            return;
        }
        
        const index = parseInt(choice) - 1;
        if (index >= 0 && index < needsResearch.length) {
            await this.researchFunder(needsResearch[index]);
        }
        
        this.rl.close();
    }

    async getFundersNeedingResearch() {
        const response = await this.notion.databases.query({
            database_id: this.databaseId,
            filter: {
                or: [
                    {
                        property: 'Description',
                        rich_text: { contains: 'NEEDS RESEARCH' }
                    },
                    {
                        property: 'Description',
                        rich_text: { is_empty: true }
                    }
                ]
            },
            page_size: 10,
            sorts: [{ property: 'Name', direction: 'ascending' }]
        });
        
        return response.results;
    }

    async researchFunder(funder) {
        const name = funder.properties.Name?.title?.[0]?.plain_text || '';
        const website = funder.properties.Website?.url;
        
        console.log('\n' + '=' .repeat(50));
        console.log(`RESEARCHING: ${name}`);
        console.log('=' .repeat(50));
        
        if (website) {
            console.log(`\n📌 Visit website: ${website}`);
            console.log('Look for: Contact page, About page, Application info\n');
        }
        
        console.log('Enter researched data (press Enter to skip field):\n');
        
        // Collect research data
        const research = {};
        
        // Email
        research.email = await this.askQuestion('Contact Email (must be valid format): ');
        if (research.email && !this.isValidEmail(research.email)) {
            console.log('❌ Invalid email format. Skipping.');
            research.email = null;
        }
        
        // Type verification
        const currentType = funder.properties.Type?.select?.name;
        console.log(`Current Type: ${currentType || 'Not set'}`);
        research.type = await this.askQuestion('Correct Type (VC/Government/Grant/Angel/Accelerator/Corporate): ');
        
        // Description
        console.log('\nWrite a REAL description based on their website:');
        research.description = await this.askQuestion('Description: ');
        
        // Application URL
        research.applicationUrl = await this.askQuestion('Application URL (if found): ');
        if (research.applicationUrl && !this.isValidUrl(research.applicationUrl)) {
            console.log('❌ Invalid URL format. Skipping.');
            research.applicationUrl = null;
        }
        
        // For government programs - deadlines
        if (currentType === 'Government' || research.type === 'Government') {
            research.deadline = await this.askQuestion('Application Deadline (YYYY-MM-DD or "rolling"): ');
        }
        
        // Data source
        research.source = await this.askQuestion('Data Source (e.g., "Official website", "Direct contact"): ');
        if (!research.source) {
            research.source = 'Manual research';
        }
        
        // Build update
        const updates = {};
        
        // Update email if provided
        if (research.email) {
            updates.Email = { email: research.email };
        }
        
        // Update type if provided
        if (research.type && this.isValidType(research.type)) {
            updates.Type = { select: { name: research.type } };
        }
        
        // Build verified description
        let verifiedDescription = '';
        
        if (research.description) {
            verifiedDescription = research.description;
        }
        
        if (research.applicationUrl) {
            verifiedDescription += `\n\n🔗 Application: ${research.applicationUrl}`;
        }
        
        if (research.deadline) {
            verifiedDescription += `\n📅 Deadline: ${research.deadline}`;
        }
        
        verifiedDescription += `\n\n✅ Verified: ${new Date().toISOString().split('T')[0]}`;
        verifiedDescription += `\n📌 Source: ${research.source}`;
        
        if (verifiedDescription) {
            updates.Description = {
                rich_text: [{
                    text: { content: verifiedDescription }
                }]
            };
        }
        
        // Apply updates
        if (Object.keys(updates).length > 0) {
            console.log('\n📝 Updating database...');
            
            try {
                await this.notion.pages.update({
                    page_id: funder.id,
                    properties: updates
                });
                
                console.log('✅ Successfully updated!');
                console.log('\nUpdated fields:');
                Object.keys(updates).forEach(field => {
                    console.log(`  - ${field}`);
                });
            } catch (error) {
                console.log(`❌ Update failed: ${error.message}`);
            }
        } else {
            console.log('\n⚠️ No updates to apply.');
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && 
               !email.includes('example') && 
               !email.includes('test') &&
               !email.match(/@\d+\.\d+/); // No version numbers
    }

    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    isValidType(type) {
        const validTypes = ['VC', 'Government', 'Grant', 'Angel', 'Accelerator', 'Corporate', 'Foundation', 'Other'];
        return validTypes.includes(type);
    }

    askQuestion(question) {
        return new Promise(resolve => {
            this.rl.question(question, answer => {
                resolve(answer.trim());
            });
        });
    }
}

// Run if called directly
if (require.main === module) {
    const researcher = new ManualFunderResearch();
    researcher.run().catch(console.error);
}

module.exports = ManualFunderResearch;