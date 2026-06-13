#!/usr/bin/env node

/**
 * Fast Funder Enrichment - Efficiently enrich funding database
 * Focuses on missing critical data: websites, descriptions, contact info
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();
const axios = require('axios');

class FastFunderEnrichment {
    constructor() {
        this.notion = new Client({
            auth: process.env.NOTION_TOKEN
        });
        this.databaseId = '246c6f799a3381eea3f1e329b7120b44';
        this.processedCount = 0;
        this.enrichedCount = 0;
    }

    async run() {
        console.log('⚡ Fast Funder Enrichment Starting...\n');
        
        // Get funders missing critical data
        const funders = await this.getFundersNeedingEnrichment();
        
        if (funders.length === 0) {
            console.log('✅ All funders already have basic information!');
            return;
        }
        
        console.log(`📊 Found ${funders.length} funders needing enrichment\n`);
        
        // Process in batches for speed
        const batchSize = 5;
        for (let i = 0; i < funders.length; i += batchSize) {
            const batch = funders.slice(i, Math.min(i + batchSize, funders.length));
            await Promise.all(batch.map(f => this.enrichFunder(f)));
            
            console.log(`\n✅ Progress: ${Math.min(i + batchSize, funders.length)}/${funders.length}\n`);
        }
        
        console.log('\n🎉 Enrichment Complete!');
        console.log(`   Processed: ${this.processedCount} funders`);
        console.log(`   Enriched: ${this.enrichedCount} funders`);
    }

    async getFundersNeedingEnrichment() {
        console.log('🔍 Finding funders missing data...');
        
        const allFunders = [];
        let hasMore = true;
        let cursor = undefined;
        
        while (hasMore) {
            const response = await this.notion.databases.query({
                database_id: this.databaseId,
                start_cursor: cursor,
                page_size: 100,
                filter: {
                    or: [
                        { property: 'Website', url: { is_empty: true } },
                        { property: 'Description', rich_text: { is_empty: true } },
                        { property: 'Focus Areas', multi_select: { is_empty: true } }
                    ]
                }
            });
            
            allFunders.push(...response.results);
            hasMore = response.has_more;
            cursor = response.next_cursor;
        }
        
        return allFunders;
    }

    async enrichFunder(funder) {
        this.processedCount++;
        
        const name = funder.properties.Name?.title?.[0]?.plain_text || '';
        if (!name) return;
        
        console.log(`   💫 ${name}`);
        
        const updates = {};
        
        // Try to find website if missing
        if (!funder.properties.Website?.url) {
            const website = await this.findWebsite(name);
            if (website) {
                updates.Website = { url: website };
                console.log(`      ✓ Website: ${website}`);
            }
        }
        
        // Add description if missing
        if (!funder.properties.Description?.rich_text?.[0]) {
            const description = this.generateDescription(name, funder.properties.Type?.select?.name);
            if (description) {
                updates.Description = { 
                    rich_text: [{ text: { content: description } }]
                };
                console.log(`      ✓ Description added`);
            }
        }
        
        // Add focus areas if missing
        if (!funder.properties['Focus Areas']?.multi_select?.length) {
            const focusAreas = this.inferFocusAreas(name, funder.properties.Type?.select?.name);
            if (focusAreas.length > 0) {
                updates['Focus Areas'] = { 
                    multi_select: focusAreas.map(area => ({ name: area }))
                };
                console.log(`      ✓ Focus areas: ${focusAreas.join(', ')}`);
            }
        }
        
        // Add location if missing and inferrable
        if (!funder.properties.Location?.rich_text?.[0]) {
            const location = this.inferLocation(name);
            if (location) {
                updates.Location = {
                    rich_text: [{ text: { content: location } }]
                };
                console.log(`      ✓ Location: ${location}`);
            }
        }
        
        // Update if we found any new data
        if (Object.keys(updates).length > 0) {
            try {
                await this.notion.pages.update({
                    page_id: funder.id,
                    properties: updates
                });
                this.enrichedCount++;
            } catch (error) {
                console.log(`      ❌ Failed to update: ${error.message}`);
            }
        }
    }

    async findWebsite(name) {
        // Common patterns for organization websites
        const cleanName = name.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '');
        
        // Try common domains
        const domains = [
            `https://www.${cleanName}.com`,
            `https://www.${cleanName}.org`,
            `https://www.${cleanName}.ca`,
            `https://${cleanName}.com`,
            `https://${cleanName}.org`
        ];
        
        // Quick check first domain only to save time
        for (const domain of domains.slice(0, 2)) {
            try {
                const response = await axios.head(domain, { 
                    timeout: 3000,
                    maxRedirects: 2 
                });
                if (response.status < 400) {
                    return domain;
                }
            } catch (error) {
                // Domain doesn't exist or timeout
            }
        }
        
        return null;
    }

    generateDescription(name, type) {
        const typeDescriptions = {
            'VC': 'Venture capital firm focused on technology investments',
            'Government': 'Government funding program supporting innovation and economic development',
            'Corporate': 'Corporate venture arm investing in strategic opportunities',
            'Foundation': 'Foundation supporting projects aligned with its mission',
            'Angel': 'Angel investor network funding early-stage startups',
            'Accelerator': 'Accelerator program providing funding and mentorship',
            'Grant': 'Grant program offering non-dilutive funding',
            'PE': 'Private equity firm focused on growth investments'
        };
        
        const baseDesc = typeDescriptions[type] || 'Funding organization';
        
        // Add specifics based on name patterns
        if (name.toLowerCase().includes('bc') || name.toLowerCase().includes('british columbia')) {
            return `${baseDesc} with focus on British Columbia ecosystem`;
        }
        if (name.toLowerCase().includes('innovation')) {
            return `${baseDesc} supporting innovative technologies and solutions`;
        }
        if (name.toLowerCase().includes('impact')) {
            return `${baseDesc} focused on social and environmental impact`;
        }
        
        return baseDesc;
    }

    inferFocusAreas(name, type) {
        const areas = [];
        const nameLower = name.toLowerCase();
        
        // Type-based defaults
        if (type === 'Government') {
            areas.push('Innovation', 'R&D');
        }
        if (type === 'VC') {
            areas.push('Technology', 'Startups');
        }
        
        // Name-based inference
        if (nameLower.includes('tech') || nameLower.includes('digital')) {
            areas.push('Technology');
        }
        if (nameLower.includes('health') || nameLower.includes('bio')) {
            areas.push('Healthcare', 'Biotech');
        }
        if (nameLower.includes('clean') || nameLower.includes('sustain')) {
            areas.push('CleanTech', 'Sustainability');
        }
        if (nameLower.includes('ai') || nameLower.includes('ml')) {
            areas.push('AI/ML');
        }
        if (nameLower.includes('media') || nameLower.includes('journalism')) {
            areas.push('Media', 'Content');
        }
        if (nameLower.includes('social')) {
            areas.push('Social Impact');
        }
        
        // Remove duplicates
        return [...new Set(areas)].slice(0, 5);
    }

    inferLocation(name) {
        const nameLower = name.toLowerCase();
        
        // BC-specific
        if (nameLower.includes('bc') || nameLower.includes('british columbia')) {
            return 'British Columbia, Canada';
        }
        if (nameLower.includes('vancouver')) {
            return 'Vancouver, BC';
        }
        if (nameLower.includes('victoria')) {
            return 'Victoria, BC';
        }
        
        // Canadian
        if (nameLower.includes('canada') || nameLower.includes('canadian')) {
            return 'Canada';
        }
        
        // US cities
        if (nameLower.includes('silicon valley')) {
            return 'Silicon Valley, CA';
        }
        if (nameLower.includes('new york') || nameLower.includes('ny')) {
            return 'New York, NY';
        }
        if (nameLower.includes('boston')) {
            return 'Boston, MA';
        }
        
        return null;
    }
}

// Run the enrichment
if (require.main === module) {
    const enricher = new FastFunderEnrichment();
    enricher.run().catch(console.error);
}

module.exports = FastFunderEnrichment;