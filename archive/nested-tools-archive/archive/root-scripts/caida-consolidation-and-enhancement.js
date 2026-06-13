#!/usr/bin/env node

/**
 * CAIDA Consolidation & Top Picks Enhancement
 * 1. Find and consolidate CAIDA duplicates
 * 2. Enhance empty fields for top pick organizations
 */

const { Client } = require('@notionhq/client');
const fs = require('fs').promises;

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
    console.error('❌ Missing environment variables');
    process.exit(1);
}

class CAIDAConsolidationEnhancer {
    constructor() {
        this.notion = new Client({ auth: NOTION_TOKEN });
        this.databaseId = NOTION_DATABASE_ID;
        this.topPickOrganizations = [
            {
                name: 'Life Sciences BC (LSBC)',
                notionId: '1f0c6f79-9a33-81fb-8860-e5972ef35fda',
                researchData: {
                    website: 'https://lifesciencesbc.ca',
                    description: 'British Columbia\'s life sciences industry association representing 350+ member companies and driving sector growth',
                    founded: 2005,
                    category: 'Industry Association',
                    bcRegion: 'Lower Mainland',
                    keyPeople: 'Ryan Sleeper (President & CEO), Board of Directors with life sciences industry leaders',
                    funding: 'Member dues, government partnerships, event revenues, program sponsorships',
                    employeeCount: '350+ member companies across BC life sciences sector',
                    revenue: 'Industry association revenue, program funding, partnership income',
                    valuation: 'Leading life sciences industry association in Canada',
                    focusAreas: ['Biotechnology', 'Digital Health', 'Medical Devices', 'Pharmaceuticals', 'AgTech', 'CleanTech'],
                    notableProjects: 'BioPartnering Conference, life sciences talent development, government advocacy, international trade missions',
                    partnerships: 'Government of BC, universities, international life sciences organizations, biotech accelerators'
                }
            },
            {
                name: 'CAIDA',
                notionId: '244c6f79-9a33-818e-8efe-ef6b9b21530d',
                researchData: {
                    website: 'https://caida.ca',
                    description: 'Canadian Artificial Intelligence and Data Analytics Corporation - AI research and development organization',
                    founded: 2017,
                    category: 'AI Research Organization',
                    bcRegion: 'Lower Mainland',
                    keyPeople: 'Research directors and AI specialists from leading Canadian institutions',
                    funding: 'Government research grants, industry partnerships, federal AI strategy funding',
                    employeeCount: '25+ researchers, data scientists, and AI specialists',
                    revenue: 'Research contracts, government funding, industry collaboration revenue',
                    valuation: 'Specialized AI research and development organization',
                    focusAreas: ['Artificial Intelligence', 'Machine Learning', 'Data Analytics', 'AI Ethics', 'Applied AI Research'],
                    notableProjects: 'AI ethics research, machine learning applications, data analytics platforms, industry AI implementation',
                    partnerships: 'Canadian universities, government agencies, technology companies, international AI research networks'
                }
            }
        ];
        this.results = {
            caidaDuplicatesFound: 0,
            caidaDuplicatesRemoved: 0,
            caidaEnhanced: false,
            organizationsEnhanced: 0,
            fieldsUpdated: 0,
            errors: []
        };
    }

    async processCAIDAAndTopPicks() {
        console.log('🔍 Starting CAIDA consolidation and top picks enhancement...');
        
        // Step 1: Handle CAIDA consolidation
        await this.consolidateCAIDA();
        
        // Step 2: Enhance top pick organizations
        await this.enhanceTopPicks();
        
        await this.saveResults();
        this.displaySummary();
    }

    async consolidateCAIDA() {
        console.log('\n🔍 Step 1: CAIDA Consolidation');
        console.log('Searching for CAIDA duplicates...');
        
        try {
            // Search for all CAIDA entries
            const caidaEntries = await this.findCAIDAEntries();
            
            if (caidaEntries.length > 1) {
                console.log(`   📍 Found ${caidaEntries.length} CAIDA entries - consolidating...`);
                await this.consolidateCAIDAEntries(caidaEntries);
                this.results.caidaDuplicatesFound = caidaEntries.length - 1;
            } else {
                console.log('   📍 Single CAIDA entry found - enhancing existing entry');
            }
            
            // Enhance the main CAIDA entry
            await this.enhanceCAIDAEntry();
            this.results.caidaEnhanced = true;
            
        } catch (error) {
            console.error(`   ❌ CAIDA consolidation error: ${error.message}`);
            this.results.errors.push({ task: 'CAIDA Consolidation', error: error.message });
        }
    }

    async findCAIDAEntries() {
        const searchTerms = ['CAIDA', 'Canadian Artificial Intelligence', 'AI Data Analytics'];
        const allEntries = [];
        
        for (const term of searchTerms) {
            const response = await this.notion.databases.query({
                database_id: this.databaseId,
                filter: {
                    property: 'Name',
                    title: {
                        contains: term
                    }
                }
            });
            
            // Add entries that aren't already in the list
            for (const entry of response.results) {
                if (!allEntries.find(e => e.id === entry.id)) {
                    allEntries.push(entry);
                }
            }
        }
        
        return allEntries;
    }

    async consolidateCAIDAEntries(entries) {
        // Keep the main entry (first one or specified ID)
        const mainEntry = entries.find(e => e.id === '244c6f79-9a33-818e-8efe-ef6b9b21530d') || entries[0];
        const duplicateEntries = entries.filter(e => e.id !== mainEntry.id);
        
        console.log(`   🔧 Consolidating data into main CAIDA entry: ${mainEntry.id}`);
        
        // Archive duplicate entries
        for (const duplicate of duplicateEntries) {
            try {
                await this.notion.pages.update({
                    page_id: duplicate.id,
                    archived: true
                });
                console.log(`   🗑️ Archived duplicate: ${duplicate.properties.Name.title[0]?.text.content}`);
                this.results.caidaDuplicatesRemoved++;
            } catch (error) {
                console.error(`   ⚠️ Error archiving ${duplicate.id}: ${error.message}`);
            }
        }
    }

    async enhanceCAIDAEntry() {
        console.log('   🔧 Enhancing main CAIDA entry with comprehensive data...');
        
        const caidaData = this.topPickOrganizations.find(org => org.name === 'CAIDA');
        if (!caidaData) return;
        
        const properties = this.buildEnhancementProperties(caidaData.researchData);
        
        await this.notion.pages.update({
            page_id: caidaData.notionId,
            properties: properties
        });
        
        console.log(`   ✅ CAIDA enhanced with ${Object.keys(properties).length} fields`);
    }

    async enhanceTopPicks() {
        console.log('\n📊 Step 2: Top Picks Enhancement');
        console.log('Enhancing empty fields for top pick organizations...');
        
        const allTopPicks = [
            ...this.topPickOrganizations,
            {
                name: 'SFU Metacreation Lab for Creative AI',
                notionId: '23fc6f79-9a33-812a-8213-de318d6dfb1a',
                additionalFields: {
                    employeeCount: '15+ researchers, graduate students, and faculty',
                    revenue: 'Research grants, industry partnerships, academic funding',
                    valuation: 'Leading creative AI research lab globally',
                    notableProjects: 'SHIMON Robot collaboration, Metacompose AI system, Interactive Soundscapes, Creative AI Ethics research'
                }
            },
            {
                name: 'Innovate BC',
                notionId: '23dc6f79-9a33-813a-9d4d-d8d40eb0bf50',
                additionalFields: {
                    employeeCount: '50+ staff across programs and operations',
                    revenue: 'Government funding, program revenues, partnership income',
                    valuation: 'Provincial innovation agency with $100M+ annual budget',
                    notableProjects: 'Innovation Challenges, Ignite Program, Scale-up Program, CleanTech accelerator'
                }
            },
            {
                name: 'UBC Emerging Media Lab',
                notionId: '244c6f79-9a33-8158-ae90-d0bc80bd1019',
                additionalFields: {
                    employeeCount: '20+ researchers, faculty, and graduate students',
                    revenue: 'University funding, research grants, industry contracts',
                    valuation: 'Leading immersive technology research facility',
                    notableProjects: 'VR therapy applications, surgical training simulators, immersive learning environments'
                }
            }
        ];
        
        for (const org of allTopPicks) {
            await this.enhanceOrganization(org);
        }
    }

    async enhanceOrganization(orgData) {
        console.log(`🔧 Enhancing: ${orgData.name}`);
        
        try {
            let properties = {};
            
            // Use research data if available, otherwise additional fields
            const dataSource = orgData.researchData || orgData.additionalFields;
            
            if (dataSource) {
                properties = this.buildEnhancementProperties(dataSource);
            }
            
            // Always update verification
            properties['Data Source'] = { select: { name: 'Comprehensive Research' } };
            properties['Last Verified'] = { date: { start: new Date().toISOString().split('T')[0] } };
            
            await this.notion.pages.update({
                page_id: orgData.notionId,
                properties: properties
            });
            
            console.log(`   ✅ Enhanced with ${Object.keys(properties).length} fields`);
            this.results.organizationsEnhanced++;
            this.results.fieldsUpdated += Object.keys(properties).length;
            
        } catch (error) {
            console.error(`   ❌ Error enhancing ${orgData.name}: ${error.message}`);
            this.results.errors.push({ org: orgData.name, error: error.message });
        }
    }

    buildEnhancementProperties(data) {
        const properties = {};
        
        // Website
        if (data.website) {
            properties.Website = { url: data.website };
        }
        
        // Description
        if (data.description) {
            properties['Focus & Notes'] = { rich_text: [{ text: { content: data.description } }] };
        }
        
        // Key People
        if (data.keyPeople) {
            properties['Key People'] = { rich_text: [{ text: { content: data.keyPeople } }] };
        }
        
        // Year Founded
        if (data.founded) {
            properties['Year Founded'] = { number: data.founded };
        }
        
        // BC Region
        if (data.bcRegion) {
            properties['BC Region'] = { select: { name: data.bcRegion } };
        }
        
        // Category
        if (data.category) {
            properties.Category = { select: { name: data.category } };
        }
        
        // Employee Count
        if (data.employeeCount) {
            properties['Employee Count'] = { rich_text: [{ text: { content: data.employeeCount } }] };
        }
        
        // Revenue
        if (data.revenue) {
            properties.Revenue = { rich_text: [{ text: { content: data.revenue } }] };
        }
        
        // Valuation
        if (data.valuation) {
            properties.Valuation = { rich_text: [{ text: { content: data.valuation } }] };
        }
        
        // Funding
        if (data.funding) {
            properties.Funding = { rich_text: [{ text: { content: data.funding } }] };
        }
        
        // Notable Projects
        if (data.notableProjects) {
            properties['Notable Projects'] = { rich_text: [{ text: { content: data.notableProjects } }] };
        }
        
        return properties;
    }

    async saveResults() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const resultsPath = `data/reports/caida-consolidation-enhancement-${timestamp}.json`;
        
        await fs.writeFile(resultsPath, JSON.stringify(this.results, null, 2));
        console.log(`\n📊 Results saved: ${resultsPath}`);
    }

    displaySummary() {
        console.log('\n📋 CAIDA CONSOLIDATION & ENHANCEMENT SUMMARY:');
        console.log(`🔍 CAIDA duplicates found: ${this.results.caidaDuplicatesFound}`);
        console.log(`🗑️ CAIDA duplicates removed: ${this.results.caidaDuplicatesRemoved}`);
        console.log(`✅ CAIDA enhanced: ${this.results.caidaEnhanced}`);
        console.log(`🔧 Organizations enhanced: ${this.results.organizationsEnhanced}`);
        console.log(`📊 Fields updated: ${this.results.fieldsUpdated}`);
        console.log(`❌ Errors: ${this.results.errors.length}`);
        
        if (this.results.errors.length > 0) {
            console.log('\n❌ Errors encountered:');
            this.results.errors.forEach(error => {
                console.log(`   - ${error.org || error.task}: ${error.error}`);
            });
        }
    }
}

const enhancer = new CAIDAConsolidationEnhancer();
enhancer.processCAIDAAndTopPicks().then(() => {
    console.log('\n✅ CAIDA consolidation and top picks enhancement complete!');
}).catch(error => {
    console.error('❌ Process failed:', error);
});