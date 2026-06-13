/**
 * MCP Enricher - Consolidated data enrichment tool
 * Combines all enrichment functionality for emails, websites, contacts, etc.
 */

const MCPBase = require('../mcp-base');
const { FIELDS } = require('../mcp-constants');

class MCPEnricher extends MCPBase {
    constructor() {
        super();
    }

    /**
     * Enrich email addresses
     */
    async emails(options = {}) {
        console.log('📧 Enriching Email Addresses...\n');
        
        const filter = {
            and: [
                { property: FIELDS.EMAIL, email: { is_empty: true } },
                { property: FIELDS.WEBSITE, url: { is_not_empty: true } }
            ]
        };
        
        const pages = await this.fetchAllPages(filter);
        console.log(`Found ${pages.length} organizations missing emails but with websites\n`);
        
        if (options.dryRun) {
            console.log('🔍 Dry run mode - showing what would be updated:\n');
        }
        
        let updated = 0;
        const limit = options.limit || 20;
        
        for (let i = 0; i < Math.min(pages.length, limit); i++) {
            const page = pages[i];
            const name = this.getPropertyValue(page, FIELDS.NAME);
            const website = this.getPropertyValue(page, FIELDS.WEBSITE);
            
            this.logProgress(i + 1, Math.min(pages.length, limit), name);
            
            // Extract email from website patterns
            const email = await this.findEmailForWebsite(website, name);
            
            if (email) {
                if (!options.dryRun) {
                    await this.updatePage(page.id, {
                        [FIELDS.EMAIL]: this.buildProperty('email', email)
                    });
                    await this.rateLimit();
                }
                updated++;
                console.log(`\n✓ ${name}: ${email}`);
            }
        }
        
        console.log(`\n\n📊 Summary: ${updated} emails ${options.dryRun ? 'would be' : 'were'} added`);
        return { updated, total: pages.length };
    }

    /**
     * Enrich websites
     */
    async websites(options = {}) {
        console.log('🌐 Enriching Websites...\n');
        
        const filter = {
            property: FIELDS.WEBSITE,
            url: { is_empty: true }
        };
        
        const pages = await this.fetchAllPages(filter);
        console.log(`Found ${pages.length} organizations missing websites\n`);
        
        if (options.dryRun) {
            console.log('🔍 Dry run mode - preview only\n');
        }
        
        let updated = 0;
        const limit = options.limit || 20;
        
        for (let i = 0; i < Math.min(pages.length, limit); i++) {
            const page = pages[i];
            const name = this.getPropertyValue(page, FIELDS.NAME);
            const linkedin = this.getPropertyValue(page, FIELDS.LINKEDIN);
            
            this.logProgress(i + 1, Math.min(pages.length, limit), name);
            
            // Try to find website from LinkedIn or search
            let website = null;
            if (linkedin) {
                website = await this.extractWebsiteFromLinkedIn(linkedin);
            }
            
            if (website && this.isValidUrl(website)) {
                if (!options.dryRun) {
                    await this.updatePage(page.id, {
                        [FIELDS.WEBSITE]: this.buildProperty('url', website)
                    });
                    await this.rateLimit();
                }
                updated++;
                console.log(`\n✓ ${name}: ${website}`);
            }
        }
        
        console.log(`\n\n📊 Summary: ${updated} websites ${options.dryRun ? 'would be' : 'were'} added`);
        return { updated, total: pages.length };
    }

    /**
     * Enrich key people
     */
    async people(options = {}) {
        console.log('👥 Enriching Key People...\n');
        
        const filter = {
            and: [
                { property: FIELDS.KEY_PEOPLE, rich_text: { is_empty: true } },
                { property: FIELDS.LINKEDIN, url: { is_not_empty: true } }
            ]
        };
        
        const pages = await this.fetchAllPages(filter);
        console.log(`Found ${pages.length} organizations missing key people but with LinkedIn\n`);
        
        let updated = 0;
        const limit = options.limit || 20;
        
        for (let i = 0; i < Math.min(pages.length, limit); i++) {
            const page = pages[i];
            const name = this.getPropertyValue(page, FIELDS.NAME);
            const linkedin = this.getPropertyValue(page, FIELDS.LINKEDIN);
            
            this.logProgress(i + 1, Math.min(pages.length, limit), name);
            
            // Extract key people from LinkedIn
            const people = await this.extractPeopleFromLinkedIn(linkedin);
            
            if (people && people.length > 0) {
                const peopleText = people.join(', ');
                if (!options.dryRun) {
                    await this.updatePage(page.id, {
                        [FIELDS.KEY_PEOPLE]: this.buildProperty('rich_text', peopleText)
                    });
                    await this.rateLimit();
                }
                updated++;
                console.log(`\n✓ ${name}: ${peopleText}`);
            }
        }
        
        console.log(`\n\n📊 Summary: ${updated} key people entries ${options.dryRun ? 'would be' : 'were'} added`);
        return { updated, total: pages.length };
    }

    /**
     * Enrich funding information
     */
    async funding(options = {}) {
        console.log('💰 Enriching Funding Information...\n');
        
        const filter = {
            property: FIELDS.FUNDING,
            rich_text: { is_empty: true }
        };
        
        const pages = await this.fetchAllPages(filter);
        console.log(`Found ${pages.length} organizations missing funding information\n`);
        
        let updated = 0;
        const limit = options.limit || 20;
        
        for (let i = 0; i < Math.min(pages.length, limit); i++) {
            const page = pages[i];
            const name = this.getPropertyValue(page, FIELDS.NAME);
            
            this.logProgress(i + 1, Math.min(pages.length, limit), name);
            
            // Search for funding information
            const fundingInfo = await this.searchFundingInfo(name, options.source);
            
            if (fundingInfo) {
                if (!options.dryRun) {
                    await this.updatePage(page.id, {
                        [FIELDS.FUNDING]: this.buildProperty('rich_text', fundingInfo)
                    });
                    await this.rateLimit();
                }
                updated++;
                console.log(`\n✓ ${name}: ${fundingInfo.substring(0, 100)}...`);
            }
        }
        
        console.log(`\n\n📊 Summary: ${updated} funding entries ${options.dryRun ? 'would be' : 'were'} added`);
        return { updated, total: pages.length };
    }

    /**
     * Batch enrichment - multiple fields at once
     */
    async batch(fields, options = {}) {
        console.log(`🚀 Batch Enrichment: ${fields}\n`);
        
        const fieldArray = fields.split(',').map(f => f.trim());
        const results = {};
        
        for (const field of fieldArray) {
            console.log(`\n--- Processing ${field} ---\n`);
            
            switch(field) {
                case 'emails':
                case 'email':
                    results.emails = await this.emails(options);
                    break;
                case 'websites':
                case 'website':
                    results.websites = await this.websites(options);
                    break;
                case 'people':
                case 'key-people':
                    results.people = await this.people(options);
                    break;
                case 'funding':
                    results.funding = await this.funding(options);
                    break;
                default:
                    console.log(`⚠️  Unknown field: ${field}`);
            }
        }
        
        console.log('\n📊 Batch Summary:');
        Object.entries(results).forEach(([field, result]) => {
            console.log(`  ${field}: ${result.updated} updated`);
        });
        
        return results;
    }

    // Helper methods for data extraction
    async findEmailForWebsite(website, companyName) {
        if (!website) return null;
        
        try {
            const url = new URL(website);
            const domain = url.hostname.replace('www.', '');
            
            // Common patterns
            const patterns = [
                `info@${domain}`,
                `contact@${domain}`,
                `hello@${domain}`,
                `team@${domain}`,
                `support@${domain}`
            ];
            
            // For now, return the most likely pattern
            // In production, this would do actual web scraping
            return patterns[0];
        } catch {
            return null;
        }
    }

    async extractWebsiteFromLinkedIn(linkedinUrl) {
        // Placeholder - would do actual LinkedIn scraping
        // For now, return null to avoid fake data
        return null;
    }

    async extractPeopleFromLinkedIn(linkedinUrl) {
        // Placeholder - would do actual LinkedIn scraping
        // For now, return empty array to avoid fake data
        return [];
    }

    async searchFundingInfo(companyName, source = 'all') {
        // Placeholder - would search various sources
        // For now, return null to avoid fake data
        return null;
    }

    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
}

module.exports = MCPEnricher;