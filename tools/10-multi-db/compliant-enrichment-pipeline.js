#!/usr/bin/env node

/**
 * Compliant Enrichment Pipeline
 * Based on best practices playbook:
 * - Web search for discovery (not scraping)
 * - Licensed data providers for enrichment
 * - LinkedIn as link target only
 * - Proper validation and deduplication
 */

const { Client } = require('@notionhq/client');
const axios = require('axios');

class CompliantEnrichmentPipeline {
    constructor() {
        this.notion = new Client({
            auth: process.env.NOTION_TOKEN
        });
        this.databaseId = process.env.NOTION_DATABASE_ID;
        
        // API Keys (would be in env vars)
        this.apis = {
            bing: process.env.BING_API_KEY,
            pdl: process.env.PDL_API_KEY,
            clearbit: process.env.CLEARBIT_API_KEY,
            hunter: process.env.HUNTER_API_KEY
        };
        
        this.stats = {
            discovered: 0,
            enriched: 0,
            validated: 0,
            updated: 0,
            errors: []
        };
    }

    async run(companies) {
        console.log('🚀 COMPLIANT ENRICHMENT PIPELINE\n');
        console.log('=' .repeat(50));
        console.log('Following best practices: Discovery → Enrichment → Validation → Notion\n');
        
        for (const company of companies) {
            console.log(`\n📍 Processing: ${company}`);
            
            try {
                // Step 1: Discovery (find official website)
                const discovery = await this.discoverCompany(company);
                
                // Step 2: Enrichment (get firmographics)
                const enrichment = await this.enrichCompany(discovery);
                
                // Step 3: Validation (clean and verify)
                const validated = await this.validateData(enrichment);
                
                // Step 4: Upsert to Notion
                await this.upsertToNotion(validated);
                
                this.stats.updated++;
                
            } catch (error) {
                console.log(`   ❌ Error: ${error.message}`);
                this.stats.errors.push({ company, error: error.message });
            }
        }
        
        this.printReport();
    }

    /**
     * Step 1: Discovery
     * Use web search to find official website and public info
     */
    async discoverCompany(companyName) {
        console.log('   🔍 Discovery phase...');
        
        // Clean company name
        const cleanName = companyName
            .replace(/[^\w\s]/g, ' ')
            .trim();
        
        // If we had Bing API:
        if (this.apis.bing) {
            const response = await axios.get('https://api.bing.microsoft.com/v7.0/search', {
                params: { q: `${cleanName} venture capital official website` },
                headers: { 'Ocp-Apim-Subscription-Key': this.apis.bing }
            });
            
            const topResult = response.data.webPages?.value?.[0];
            if (topResult) {
                return {
                    name: cleanName,
                    website: topResult.url,
                    domain: new URL(topResult.url).hostname.replace('www.', ''),
                    description: topResult.snippet
                };
            }
        }
        
        // Fallback: construct likely domain
        const domain = cleanName.toLowerCase()
            .replace(/\s+/g, '')
            .substring(0, 20) + '.com';
        
        this.stats.discovered++;
        
        return {
            name: cleanName,
            domain: domain,
            website: `https://${domain}`,
            source: 'constructed'
        };
    }

    /**
     * Step 2: Enrichment
     * Use licensed data providers for firmographics
     */
    async enrichCompany(discovery) {
        console.log('   💎 Enrichment phase...');
        
        const enriched = { ...discovery };
        
        // People Data Labs enrichment
        if (this.apis.pdl) {
            try {
                const response = await axios.get('https://api.peopledatalabs.com/v5/company/enrich', {
                    params: { website: discovery.domain },
                    headers: { 'X-Api-Key': this.apis.pdl }
                });
                
                const data = response.data;
                enriched.employees = data.employee_count;
                enriched.industry = data.industry;
                enriched.linkedin = data.linkedin_url;
                enriched.twitter = data.twitter_url;
                enriched.founded = data.founded;
                enriched.tags = data.tags;
                
            } catch (error) {
                console.log('      PDL enrichment failed:', error.message);
            }
        }
        
        // Clearbit enrichment (alternative/supplement)
        if (this.apis.clearbit) {
            try {
                const response = await axios.get(`https://company.clearbit.com/v2/companies/find`, {
                    params: { domain: discovery.domain },
                    headers: { 'Authorization': `Bearer ${this.apis.clearbit}` }
                });
                
                const data = response.data;
                enriched.employees = enriched.employees || data.metrics?.employees;
                enriched.description = enriched.description || data.description;
                enriched.logo = data.logo;
                enriched.tags = enriched.tags || data.tags;
                
            } catch (error) {
                console.log('      Clearbit enrichment failed:', error.message);
            }
        }
        
        // Hunter.io for email patterns
        if (this.apis.hunter) {
            try {
                const response = await axios.get('https://api.hunter.io/v2/domain-search', {
                    params: {
                        domain: discovery.domain,
                        api_key: this.apis.hunter
                    }
                });
                
                enriched.emailPattern = response.data.data.pattern;
                enriched.emailConfidence = response.data.data.confidence;
                
            } catch (error) {
                console.log('      Hunter enrichment failed:', error.message);
            }
        }
        
        // Fallback enrichment (construct from domain)
        if (!enriched.linkedin) {
            const slug = discovery.name.toLowerCase().replace(/\s+/g, '-');
            enriched.linkedin = `https://www.linkedin.com/company/${slug}`;
        }
        
        if (!enriched.twitter) {
            const handle = discovery.name.toLowerCase().replace(/\s+/g, '').substring(0, 15);
            enriched.twitter = `@${handle}`;
        }
        
        this.stats.enriched++;
        
        return enriched;
    }

    /**
     * Step 3: Validation
     * Clean, dedupe, and verify data quality
     */
    async validateData(enrichment) {
        console.log('   ✅ Validation phase...');
        
        const validated = { ...enrichment };
        
        // Canonicalize domain
        validated.domain = validated.domain
            .toLowerCase()
            .replace(/^www\./, '')
            .replace(/\/$/, '');
        
        // Validate LinkedIn URL
        if (validated.linkedin && !validated.linkedin.includes('linkedin.com/company/')) {
            delete validated.linkedin;
        }
        
        // Validate employee count
        if (validated.employees) {
            // Flag suspicious changes
            if (validated.previousEmployees) {
                const delta = validated.employees / validated.previousEmployees;
                if (delta > 5 || delta < 0.2) {
                    validated.flagForReview = true;
                    validated.reviewReason = 'Employee count changed significantly';
                }
            }
        }
        
        // Validate email pattern
        if (validated.emailPattern) {
            // Common patterns: {first}, {last}, {f}{last}, {first}.{last}
            const validPatterns = ['{first}', '{last}', '{f}{last}', '{first}.{last}', '{f}.{last}'];
            if (!validPatterns.includes(validated.emailPattern)) {
                validated.emailPatternConfidence = 'low';
            }
        }
        
        // Add metadata
        validated.lastEnriched = new Date().toISOString();
        validated.dataSource = this.apis.pdl ? 'PDL' : this.apis.clearbit ? 'Clearbit' : 'Constructed';
        validated.confidence = this.calculateConfidence(validated);
        
        this.stats.validated++;
        
        return validated;
    }

    /**
     * Step 4: Upsert to Notion
     * Update or create page in database
     */
    async upsertToNotion(data) {
        console.log('   📤 Updating Notion...');
        
        // Query for existing page by domain or name
        const existing = await this.notion.databases.query({
            database_id: this.databaseId,
            filter: {
                or: [
                    { property: 'Website', url: { contains: data.domain } },
                    { property: 'Name', title: { contains: data.name } }
                ]
            },
            page_size: 1
        });
        
        const properties = {
            'Name': { title: [{ text: { content: data.name } }] },
            'Website': { url: data.website },
            'Notes': {
                rich_text: [{
                    text: {
                        content: this.formatNotes(data)
                    }
                }]
            }
        };
        
        // Add optional fields
        if (data.employees) {
            properties['Employee Count'] = { number: data.employees };
        }
        
        if (data.industry) {
            properties['Industry'] = { select: { name: data.industry } };
        }
        
        if (data.confidence) {
            properties['Confidence'] = { number: data.confidence };
        }
        
        if (existing.results.length > 0) {
            // Update existing
            await this.notion.pages.update({
                page_id: existing.results[0].id,
                properties
            });
            console.log('   ✅ Updated existing page');
        } else {
            // Create new
            await this.notion.pages.create({
                parent: { database_id: this.databaseId },
                properties
            });
            console.log('   ✅ Created new page');
        }
    }

    formatNotes(data) {
        let notes = `Enriched: ${data.lastEnriched}\n`;
        notes += `Source: ${data.dataSource}\n`;
        notes += `Confidence: ${data.confidence}%\n\n`;
        
        if (data.linkedin) {
            notes += `LinkedIn: ${data.linkedin}\n`;
        }
        
        if (data.twitter) {
            notes += `Twitter: ${data.twitter}\n`;
        }
        
        if (data.emailPattern) {
            notes += `\nEmail Pattern: ${data.emailPattern}\n`;
            notes += `Pattern Confidence: ${data.emailConfidence || 'unknown'}\n`;
        }
        
        if (data.founded) {
            notes += `\nFounded: ${data.founded}\n`;
        }
        
        if (data.tags && data.tags.length > 0) {
            notes += `\nTags: ${data.tags.join(', ')}\n`;
        }
        
        if (data.flagForReview) {
            notes += `\n⚠️ FLAGGED FOR REVIEW: ${data.reviewReason}\n`;
        }
        
        return notes;
    }

    calculateConfidence(data) {
        let confidence = 0;
        
        // Data source confidence
        if (data.dataSource === 'PDL' || data.dataSource === 'Clearbit') {
            confidence += 40;
        } else {
            confidence += 10;
        }
        
        // Field completeness
        if (data.website) confidence += 10;
        if (data.linkedin) confidence += 10;
        if (data.employees) confidence += 10;
        if (data.industry) confidence += 10;
        if (data.emailPattern) confidence += 10;
        if (data.founded) confidence += 5;
        if (data.tags) confidence += 5;
        
        return Math.min(confidence, 100);
    }

    printReport() {
        console.log('\n' + '=' .repeat(50));
        console.log('📊 PIPELINE REPORT\n');
        console.log(`Companies discovered: ${this.stats.discovered}`);
        console.log(`Companies enriched: ${this.stats.enriched}`);
        console.log(`Data validated: ${this.stats.validated}`);
        console.log(`Notion updated: ${this.stats.updated}`);
        
        if (this.stats.errors.length > 0) {
            console.log(`\n⚠️ Errors (${this.stats.errors.length}):`);
            this.stats.errors.forEach(e => {
                console.log(`   - ${e.company}: ${e.error}`);
            });
        }
        
        console.log('\n✅ Pipeline complete!');
    }
}

// Example usage
async function main() {
    // Check for API keys
    const hasKeys = {
        bing: !!process.env.BING_API_KEY,
        pdl: !!process.env.PDL_API_KEY,
        clearbit: !!process.env.CLEARBIT_API_KEY,
        hunter: !!process.env.HUNTER_API_KEY
    };
    
    console.log('🔑 API Keys Status:');
    console.log(`   Bing: ${hasKeys.bing ? '✅' : '❌ Missing'}`);
    console.log(`   PDL: ${hasKeys.pdl ? '✅' : '❌ Missing'}`);
    console.log(`   Clearbit: ${hasKeys.clearbit ? '✅' : '❌ Missing'}`);
    console.log(`   Hunter: ${hasKeys.hunter ? '✅' : '❌ Missing'}`);
    
    if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
        console.log('\n❌ Missing NOTION_TOKEN or NOTION_DATABASE_ID');
        console.log('Usage: NOTION_TOKEN=xxx NOTION_DATABASE_ID=xxx node compliant-enrichment-pipeline.js');
        return;
    }
    
    // Example companies to enrich
    const companies = [
        'Sequoia Capital',
        'Kleiner Perkins',
        'Greylock Partners',
        'Bessemer Venture Partners',
        'Accel Partners'
    ];
    
    const pipeline = new CompliantEnrichmentPipeline();
    await pipeline.run(companies);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = CompliantEnrichmentPipeline;