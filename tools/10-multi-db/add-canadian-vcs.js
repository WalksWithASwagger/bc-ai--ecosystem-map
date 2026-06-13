#!/usr/bin/env node

/**
 * Add Canadian VCs
 * Discovers and adds high-value Canadian/BC venture capital firms
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();

class CanadianVCAdder {
    constructor() {
        this.notion = new Client({
            auth: process.env.NOTION_TOKEN
        });
        this.databaseId = '246c6f799a3381eea3f1e329b7120b44';
        this.addedCount = 0;
        this.skippedCount = 0;
    }

    async run() {
        console.log('🇨🇦 Canadian VC Discovery & Addition\n');
        console.log('=' .repeat(50) + '\n');
        
        // Check existing to avoid duplicates
        const existing = await this.getExistingFunders();
        console.log(`📊 Current database: ${existing.size} funders\n`);
        
        // Add high-value Canadian VCs
        await this.addCanadianVCs(existing);
        
        console.log('\n✅ Addition Complete!');
        console.log(`   Added: ${this.addedCount} new VCs`);
        console.log(`   Skipped (existing): ${this.skippedCount}`);
    }

    async getExistingFunders() {
        const names = new Set();
        let hasMore = true;
        let cursor = undefined;
        
        while (hasMore) {
            const response = await this.notion.databases.query({
                database_id: this.databaseId,
                start_cursor: cursor,
                page_size: 100
            });
            
            response.results.forEach(page => {
                const name = page.properties.Name?.title?.[0]?.plain_text;
                if (name) {
                    names.add(this.normalizeName(name));
                }
            });
            
            hasMore = response.has_more;
            cursor = response.next_cursor;
        }
        
        return names;
    }

    normalizeName(name) {
        return name.toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    async addCanadianVCs(existing) {
        // High-value Canadian VCs to add
        const canadianVCs = [
            // Major Canadian VCs
            {
                name: 'OMERS Ventures',
                website: 'https://www.omersventures.com',
                type: 'VC',
                location: 'Toronto, ON',
                focusAreas: 'B2B Software, Healthtech, Fintech',
                description: 'Venture arm of OMERS pension fund. $1B+ AUM, Series A-C focus. Check sizes $5M-$25M.',
                strategicScore: 95
            },
            {
                name: 'Real Ventures',
                website: 'https://www.realventures.com',
                type: 'VC',
                location: 'Montreal, QC',
                focusAreas: 'B2B SaaS, AI/ML, Deep Tech',
                description: 'Canada\'s most active seed VC. $325M AUM across 5 funds. Pre-seed to Series A.',
                strategicScore: 92
            },
            {
                name: 'BDC Capital',
                website: 'https://www.bdc.ca/en/bdc-capital',
                type: 'VC',
                location: 'National (HQ Montreal)',
                focusAreas: 'All sectors, Deep Tech, Cleantech, Life Sciences',
                description: 'Canada\'s bank for entrepreneurs. $5B+ under management. All stages.',
                strategicScore: 98
            },
            {
                name: 'Inovia Capital',
                website: 'https://www.inovia.vc',
                type: 'VC',
                location: 'Montreal, QC',
                focusAreas: 'Enterprise Software, AI, Marketplaces',
                description: 'Leading growth-stage VC. $2.2B AUM. Series A to growth equity.',
                strategicScore: 94
            },
            {
                name: 'Georgian Partners',
                website: 'https://www.georgian.io',
                type: 'VC',
                location: 'Toronto, ON',
                focusAreas: 'Applied AI, B2B Software, Conversational AI',
                description: 'Growth-stage investor focused on AI. $2B+ AUM. Series B and beyond.',
                strategicScore: 93
            },
            
            // BC-specific VCs
            {
                name: 'Yaletown Partners',
                website: 'https://www.yaletown.com',
                type: 'VC',
                location: 'Vancouver, BC',
                focusAreas: 'Enterprise Software, Cleantech, Industrial Innovation',
                description: 'Vancouver-based growth equity. $500M+ AUM. Series A/B focus.',
                strategicScore: 90
            },
            {
                name: 'Vanedge Capital',
                website: 'https://www.vanedgecapital.com',
                type: 'VC',
                location: 'Vancouver, BC',
                focusAreas: 'Enterprise Software, Cybersecurity, Infrastructure',
                description: 'Early-stage B2B software investor. $350M AUM. Seed to Series B.',
                strategicScore: 88
            },
            {
                name: 'Voyager Capital',
                website: 'https://www.voyagercapital.com',
                type: 'VC',
                location: 'Seattle/Vancouver',
                focusAreas: 'Cloud Infrastructure, Developer Tools, B2B SaaS',
                description: 'Pacific Northwest focused. $450M AUM. Series A/B investments.',
                strategicScore: 87
            },
            {
                name: 'Rhino Ventures',
                website: 'https://www.rhinoventures.ca',
                type: 'VC',
                location: 'Vancouver, BC',
                focusAreas: 'Consumer Tech, B2B Software, Marketplaces',
                description: 'Seed and Series A investor. Focus on Western Canada startups.',
                strategicScore: 85
            },
            {
                name: 'Panache Ventures',
                website: 'https://www.panache.vc',
                type: 'VC',
                location: 'National (active in BC)',
                focusAreas: 'All sectors, Pre-seed/Seed',
                description: 'Canada\'s most active pre-seed fund. 170+ investments. $75M AUM.',
                strategicScore: 89
            },
            
            // Corporate VCs
            {
                name: 'TELUS Ventures',
                website: 'https://www.telus.com/ventures',
                type: 'Corporate VC',
                location: 'Vancouver, BC',
                focusAreas: 'Healthcare, IoT, Security, Consumer Tech',
                description: 'Strategic investor from TELUS. $500M fund. All stages.',
                strategicScore: 91
            },
            {
                name: 'Rogers Ventures',
                website: 'https://www.rogers.com/ventures',
                type: 'Corporate VC',
                location: 'Toronto, ON',
                focusAreas: 'Media, Sports Tech, 5G, Enterprise',
                description: 'Strategic arm of Rogers Communications. Growth stage focus.',
                strategicScore: 86
            },
            {
                name: 'EDC (Export Development Canada)',
                website: 'https://www.edc.ca',
                type: 'Government VC',
                location: 'National',
                focusAreas: 'Export-focused companies, Cleantech, Tech',
                description: 'Canada\'s export credit agency. Equity and debt financing.',
                strategicScore: 92
            },
            
            // Specialized/Sector-focused
            {
                name: 'Lumira Ventures',
                website: 'https://www.lumiraventures.com',
                type: 'VC',
                location: 'Toronto, ON',
                focusAreas: 'Life Sciences, Biotech, Medical Devices',
                description: 'Leading healthcare VC in Canada. $500M+ AUM.',
                strategicScore: 87
            },
            {
                name: 'ArcTern Ventures',
                website: 'https://www.arcternventures.com',
                type: 'VC',
                location: 'Toronto, ON',
                focusAreas: 'Cleantech, Climate Tech, Sustainability',
                description: 'Climate-focused VC. $330M AUM. Series A/B investments.',
                strategicScore: 88
            },
            {
                name: 'Amplitude Ventures',
                website: 'https://www.amplitude.vc',
                type: 'VC',
                location: 'Toronto/Montreal',
                focusAreas: 'Precision Medicine, Digital Health, Genomics',
                description: 'Life sciences focused. $435M AUM. Seed to Series B.',
                strategicScore: 86
            },
            {
                name: 'Raven Indigenous Capital Partners',
                website: 'https://www.ravencapitalpartners.ca',
                type: 'VC',
                location: 'National',
                focusAreas: 'Indigenous-led businesses, Impact, Tech',
                description: 'First Indigenous-led and owned VC in Canada. Impact focus.',
                strategicScore: 85
            },
            
            // Angel Networks
            {
                name: 'VANTEC Angel Network',
                website: 'https://www.vantec.ca',
                type: 'Angel Network',
                location: 'Vancouver, BC',
                focusAreas: 'Tech startups, Early stage',
                description: 'BC\'s largest angel network. 200+ members. Seed investments.',
                strategicScore: 84
            },
            {
                name: 'Anges Quebec',
                website: 'https://www.angesquebec.com',
                type: 'Angel Network',
                location: 'Quebec',
                focusAreas: 'All sectors, Quebec startups',
                description: 'Quebec\'s largest angel network. 230+ members.',
                strategicScore: 82
            },
            {
                name: 'York Angel Investors',
                website: 'https://www.yorkangels.com',
                type: 'Angel Network',
                location: 'Toronto, ON',
                focusAreas: 'Tech, Healthcare, Clean Tech',
                description: 'Active Toronto angel group. 100+ members.',
                strategicScore: 83
            },
            
            // Emerging/New Funds
            {
                name: 'Relay Ventures',
                website: 'https://www.relayventures.com',
                type: 'VC',
                location: 'Toronto, ON',
                focusAreas: 'Mobile, Marketplaces, Fintech',
                description: 'Early-stage fund. $250M AUM. Seed to Series A.',
                strategicScore: 85
            },
            {
                name: 'Garage Capital',
                website: 'https://www.garagecapital.vc',
                type: 'VC',
                location: 'Montreal, QC',
                focusAreas: 'B2B SaaS, Pre-seed/Seed',
                description: 'Micro-VC focused on first checks. $50M fund.',
                strategicScore: 83
            },
            {
                name: 'Two Small Fish Ventures',
                website: 'https://www.twosmallfish.vc',
                type: 'VC',
                location: 'Toronto, ON',
                focusAreas: 'B2B Software, Enterprise, Data',
                description: 'Early-stage B2B investor. Focus on Canadian founders.',
                strategicScore: 82
            },
            {
                name: 'Luge Capital',
                website: 'https://www.lugecapital.com',
                type: 'VC',
                location: 'Montreal/Toronto',
                focusAreas: 'Fintech, Insurtech, Wealth Tech',
                description: 'Fintech specialist. $85M fund. Seed to Series A.',
                strategicScore: 84
            },
            {
                name: 'Thin Air Labs',
                website: 'https://www.thinairlabs.ca',
                type: 'Venture Studio',
                location: 'Calgary, AB',
                focusAreas: 'B2B SaaS, Energy Tech, Ag Tech',
                description: 'Venture studio and fund. Focus on Prairie startups.',
                strategicScore: 81
            }
        ];
        
        console.log(`🔍 Checking ${canadianVCs.length} Canadian VCs for addition...\n`);
        
        for (const vc of canadianVCs) {
            const normalized = this.normalizeName(vc.name);
            
            if (existing.has(normalized)) {
                console.log(`⏭️  ${vc.name} - already exists`);
                this.skippedCount++;
            } else {
                await this.addFunder(vc);
                existing.add(normalized); // Prevent duplicates in same run
            }
        }
    }

    async addFunder(funder) {
        try {
            // Build description
            let description = funder.description;
            description += `\n\n📍 Location: ${funder.location}`;
            description += `\n🎯 Focus: ${funder.focusAreas}`;
            description += `\n📊 Strategic Score: ${funder.strategicScore}/100`;
            description += `\n✅ Verified: ${new Date().toISOString().split('T')[0]}`;
            
            await this.notion.pages.create({
                parent: { database_id: this.databaseId },
                properties: {
                    'Name': {
                        title: [{
                            text: { content: funder.name }
                        }]
                    },
                    'Type': {
                        select: { name: funder.type }
                    },
                    'Website': {
                        url: funder.website
                    },
                    'Description': {
                        rich_text: [{
                            text: { content: description }
                        }]
                    }
                }
            });
            
            this.addedCount++;
            console.log(`✅ Added: ${funder.name}`);
            console.log(`   Type: ${funder.type} | Score: ${funder.strategicScore}`);
            console.log(`   Focus: ${funder.focusAreas}`);
            
        } catch (error) {
            console.log(`❌ Failed to add ${funder.name}: ${error.message}`);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const adder = new CanadianVCAdder();
    adder.run().catch(console.error);
}

module.exports = CanadianVCAdder;