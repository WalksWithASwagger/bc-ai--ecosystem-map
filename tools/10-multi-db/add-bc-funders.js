#!/usr/bin/env node

/**
 * Add BC-Focused Funders - Expand database with BC/Canadian funding sources
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();

class BCFunderAdder {
    constructor() {
        this.notion = new Client({
            auth: process.env.NOTION_TOKEN
        });
        this.databaseId = '246c6f799a3381eea3f1e329b7120b44';
        this.addedCount = 0;
    }

    async run() {
        console.log('🇨🇦 Adding BC/Canadian Funders...\n');
        
        // Define BC-focused funders to add
        const bcFunders = [
            // Government Programs
            {
                name: 'IRAP - Industrial Research Assistance Program',
                type: 'Government',
                website: 'https://nrc.canada.ca/en/support-technology-innovation/financial-support-technology-innovation-through-nrc-irap',
                location: 'Canada',
                focusAreas: ['Innovation', 'R&D', 'Technology'],
                description: 'Canada\'s premier innovation assistance program for SMEs, providing funding and advisory services',
                score: 95
            },
            {
                name: 'MITACS',
                type: 'Government',
                website: 'https://www.mitacs.ca',
                location: 'Canada',
                focusAreas: ['Research', 'Innovation', 'Training'],
                description: 'Research and training organization fostering innovation through partnerships',
                score: 92
            },
            {
                name: 'SR&ED Tax Credit',
                type: 'Government',
                website: 'https://www.canada.ca/en/revenue-agency/services/scientific-research-experimental-development-tax-incentive-program.html',
                location: 'Canada',
                focusAreas: ['R&D', 'Innovation', 'Technology'],
                description: 'Scientific Research and Experimental Development tax incentive program',
                score: 90
            },
            {
                name: 'Western Economic Diversification Canada',
                type: 'Government',
                website: 'https://www.wd-deo.gc.ca',
                location: 'Western Canada',
                focusAreas: ['Economic Development', 'Innovation', 'Business Growth'],
                description: 'Federal agency supporting economic growth in Western Canada',
                score: 85
            },
            {
                name: 'PacifiCan',
                type: 'Government',
                website: 'https://www.canada.ca/en/pacific-economic-development.html',
                location: 'British Columbia',
                focusAreas: ['Economic Development', 'Innovation', 'CleanTech'],
                description: 'Federal economic development agency for British Columbia',
                score: 88
            },
            
            // BC Provincial Programs
            {
                name: 'BC Tech Fund',
                type: 'Government',
                website: 'https://www.bctechfund.com',
                location: 'British Columbia',
                focusAreas: ['Technology', 'Startups', 'Venture Capital'],
                description: 'BC government venture capital fund investing in tech companies',
                score: 87
            },
            {
                name: 'Small Business BC',
                type: 'Government',
                website: 'https://smallbusinessbc.ca',
                location: 'British Columbia',
                focusAreas: ['Small Business', 'Entrepreneurship', 'Training'],
                description: 'Provincial resource center for small business support and funding',
                score: 82
            },
            {
                name: 'Launch Online Grant',
                type: 'Grant',
                website: 'https://www2.gov.bc.ca/gov/content/employment-business/business/small-business/marketplace-services/launch-online-grant',
                location: 'British Columbia',
                focusAreas: ['E-commerce', 'Digital Transformation', 'Small Business'],
                description: 'BC grant program helping businesses build online stores',
                score: 78
            },
            
            // BC VCs
            {
                name: 'Rhino Ventures',
                type: 'VC',
                website: 'https://www.rhinoventures.ca',
                location: 'Vancouver, BC',
                focusAreas: ['Technology', 'SaaS', 'Enterprise Software'],
                description: 'Early-stage VC firm focused on B2B software companies',
                score: 85
            },
            {
                name: 'Yaletown Partners',
                type: 'VC',
                website: 'https://www.yaletown.com',
                location: 'Vancouver, BC',
                focusAreas: ['Technology', 'CleanTech', 'Healthcare'],
                description: 'Growth equity firm investing in emerging technology companies',
                score: 86
            },
            {
                name: 'Vanedge Capital',
                type: 'VC',
                website: 'https://vanedgecapital.com',
                location: 'Vancouver, BC',
                focusAreas: ['Enterprise Software', 'SaaS', 'Technology'],
                description: 'Early-stage venture capital firm focused on B2B software',
                score: 84
            },
            {
                name: 'Framework Venture Partners',
                type: 'VC',
                website: 'https://framework.vc',
                location: 'Toronto/Vancouver',
                focusAreas: ['Technology', 'B2B', 'SaaS'],
                description: 'Seed-stage venture capital firm backing Canadian founders',
                score: 83
            },
            {
                name: 'Pender Ventures',
                type: 'VC',
                website: 'https://www.penderventures.com',
                location: 'Vancouver, BC',
                focusAreas: ['Technology', 'Healthcare', 'B2B Software'],
                description: 'Technology-focused venture capital fund based in Vancouver',
                score: 82
            },
            
            // Accelerators
            {
                name: 'CDL West',
                type: 'Accelerator',
                website: 'https://creativedestructionlab.com/locations/vancouver/',
                location: 'Vancouver, BC',
                focusAreas: ['DeepTech', 'AI/ML', 'Quantum', 'CleanTech'],
                description: 'Creative Destruction Lab - seed-stage program for science-based companies',
                score: 88
            },
            {
                name: 'Foresight Canada',
                type: 'Accelerator',
                website: 'https://foresightcanada.com',
                location: 'Vancouver, BC',
                focusAreas: ['CleanTech', 'Sustainability', 'Climate Tech'],
                description: 'Canada\'s cleantech accelerator supporting climate innovation',
                score: 85
            },
            {
                name: 'Spring Activator',
                type: 'Accelerator',
                website: 'https://www.springactivator.com',
                location: 'Vancouver, BC',
                focusAreas: ['Social Impact', 'Technology', 'Innovation'],
                description: 'Impact incubator supporting purpose-driven entrepreneurs',
                score: 80
            },
            
            // Angel Networks
            {
                name: 'VANTEC Angel Network',
                type: 'Angel',
                website: 'https://www.vantec.ca',
                location: 'Vancouver, BC',
                focusAreas: ['Technology', 'Life Sciences', 'CleanTech'],
                description: 'Vancouver\'s premier angel investor network',
                score: 82
            },
            {
                name: 'Keiretsu Forum Pacific Northwest',
                type: 'Angel',
                website: 'https://www.keiretsuforum.com',
                location: 'Vancouver/Seattle',
                focusAreas: ['Technology', 'Healthcare', 'Consumer'],
                description: 'Global angel investor network with Vancouver chapter',
                score: 79
            },
            
            // Foundations
            {
                name: 'Coast Capital Savings Innovation Fund',
                type: 'Foundation',
                website: 'https://www.coastcapitalsavings.com/community/funding',
                location: 'British Columbia',
                focusAreas: ['Youth', 'Innovation', 'Community'],
                description: 'Credit union foundation supporting youth innovation and entrepreneurship',
                score: 77
            },
            {
                name: 'Telus Community Investment',
                type: 'Corporate',
                website: 'https://www.telus.com/en/social-impact/community-investment',
                location: 'British Columbia',
                focusAreas: ['Technology', 'Healthcare', 'Education'],
                description: 'Corporate funding for technology and social innovation projects',
                score: 78
            }
        ];
        
        // Check existing and add new
        for (const funder of bcFunders) {
            const exists = await this.checkIfExists(funder.name);
            if (!exists) {
                await this.addFunder(funder);
            } else {
                console.log(`   ⏭️  ${funder.name} already exists`);
            }
        }
        
        console.log(`\n✅ Complete! Added ${this.addedCount} new BC/Canadian funders\n`);
    }

    async checkIfExists(name) {
        try {
            const response = await this.notion.databases.query({
                database_id: this.databaseId,
                filter: {
                    property: 'Name',
                    title: { contains: name.split('-')[0].trim() }
                },
                page_size: 5
            });
            
            return response.results.length > 0;
        } catch (error) {
            return false;
        }
    }

    async addFunder(funder) {
        try {
            console.log(`   ➕ Adding: ${funder.name}`);
            
            const properties = {
                'Name': { title: [{ text: { content: funder.name } }] },
                'Type': { select: { name: funder.type } },
                'Website': { url: funder.website },
                'Location': { rich_text: [{ text: { content: funder.location } }] },
                'Description': { rich_text: [{ text: { content: funder.description } }] }
            };
            
            // Add focus areas if the field exists
            if (funder.focusAreas && funder.focusAreas.length > 0) {
                properties['Focus Areas'] = {
                    multi_select: funder.focusAreas.map(area => ({ name: area }))
                };
            }
            
            // Add score info to description since those fields don't exist
            if (funder.score) {
                const priority = funder.score >= 90 ? 'High' : 
                               funder.score >= 80 ? 'Medium-High' : 'Medium';
                
                properties['Description'].rich_text[0].text.content += 
                    `\n\nStrategic Score: ${funder.score}/100 | Priority: ${priority}`;
            }
            
            await this.notion.pages.create({
                parent: { database_id: this.databaseId },
                properties: properties
            });
            
            this.addedCount++;
            console.log(`      ✅ Added successfully`);
            
        } catch (error) {
            console.log(`      ❌ Failed to add: ${error.message}`);
        }
    }
}

// Run the adder
if (require.main === module) {
    const adder = new BCFunderAdder();
    adder.run().catch(console.error);
}

module.exports = BCFunderAdder;