/**
 * Clearbit Logo Collector - Fast logo discovery using Clearbit API
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { URL } = require('url');

class ClearbitLogoCollector {
    constructor() {
        this.results = {
            successful: 0,
            failed: 0,
            skipped: 0,
            collected: [],
            errors: []
        };
        
        // Clearbit Logo API base URL
        this.apiBase = 'https://logo.clearbit.com';
    }

    // Extract domain from website URL
    extractDomain(website) {
        try {
            let url = website;
            if (!url.startsWith('http')) {
                url = `https://${url}`;
            }
            const parsed = new URL(url);
            return parsed.hostname.replace(/^www\./, '');
        } catch (error) {
            return null;
        }
    }

    // Download logo from Clearbit API
    async downloadClearbitLogo(domain, companyName, size = 128) {
        try {
            // Create safe filename
            const safeCompanyName = companyName
                .replace(/[^a-zA-Z0-9]/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_|_$/g, '');
            
            const filename = `${safeCompanyName}_logo_clearbit.png`;
            const filepath = path.join(__dirname, '..', 'logos', filename);
            
            // Check if file already exists
            try {
                await fs.access(filepath);
                console.log(`   ⏭️ Logo already exists: ${filename}`);
                this.results.skipped++;
                return null;
            } catch {
                // File doesn't exist, proceed with download
            }
            
            // Build Clearbit URL
            const logoUrl = `${this.apiBase}/${domain}?size=${size}&format=png`;
            
            console.log(`   📥 Fetching from Clearbit: ${logoUrl}`);
            
            // Download logo
            const response = await axios.get(logoUrl, {
                responseType: 'arraybuffer',
                timeout: 10000,
                headers: {
                    'User-Agent': 'BC-AI-Ecosystem-Collector/1.0'
                }
            });
            
            // Clearbit returns 200 even for missing logos, check content length
            if (response.data.length < 100) {
                throw new Error('Logo not found or too small');
            }
            
            // Save file
            await fs.writeFile(filepath, response.data);
            
            const stats = await fs.stat(filepath);
            console.log(`   ✅ Downloaded: ${filename} (${(stats.size / 1024).toFixed(1)}KB)`);
            
            this.results.successful++;
            this.results.collected.push({
                company: companyName,
                filename,
                domain,
                size: stats.size,
                source: 'clearbit'
            });
            
            return filename;
            
        } catch (error) {
            console.log(`   ❌ Clearbit failed: ${error.message}`);
            this.results.failed++;
            this.results.errors.push({
                company: companyName,
                domain,
                error: error.message
            });
            return null;
        }
    }

    // Collect logo for a single company
    async collectLogo(company) {
        const { name, website } = company;
        
        console.log(`\n🔍 Collecting: ${name}`);
        console.log(`   Website: ${website}`);
        
        if (!website) {
            console.log(`   ⚠️ No website available`);
            this.results.failed++;
            return null;
        }
        
        const domain = this.extractDomain(website);
        if (!domain) {
            console.log(`   ❌ Invalid website URL`);
            this.results.failed++;
            return null;
        }
        
        console.log(`   🌐 Domain: ${domain}`);
        
        // Try different sizes if needed
        const sizes = [128, 256, 64];
        
        for (const size of sizes) {
            const filename = await this.downloadClearbitLogo(domain, name, size);
            if (filename) {
                return filename;
            }
            
            // Brief pause between attempts
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        return null;
    }

    // Process multiple companies
    async collectLogos(companies, maxConcurrent = 5) {
        console.log(`🎨 Starting Clearbit logo collection for ${companies.length} companies...\n`);
        
        // Process in batches to respect rate limits
        for (let i = 0; i < companies.length; i += maxConcurrent) {
            const batch = companies.slice(i, i + maxConcurrent);
            
            console.log(`📦 Processing batch ${Math.floor(i / maxConcurrent) + 1}/${Math.ceil(companies.length / maxConcurrent)}`);
            
            const promises = batch.map(company => 
                this.collectLogo(company).catch(error => {
                    console.log(`❌ Batch error for ${company.name}: ${error.message}`);
                    return null;
                })
            );
            
            await Promise.all(promises);
            
            // Brief pause between batches to respect API limits
            if (i + maxConcurrent < companies.length) {
                console.log('   ⏸️ Pausing between batches...\n');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        this.generateReport();
    }

    // Generate collection report
    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('🎨 CLEARBIT LOGO COLLECTION REPORT');
        console.log('='.repeat(60));
        
        console.log(`✅ Successfully collected: ${this.results.successful} logos`);
        console.log(`⏭️ Skipped (already exists): ${this.results.skipped} logos`);
        console.log(`❌ Failed: ${this.results.failed} attempts`);
        
        const total = this.results.successful + this.results.skipped + this.results.failed;
        const successRate = total > 0 ? ((this.results.successful / total) * 100).toFixed(1) : 0;
        
        console.log(`📊 Collection rate: ${successRate}%`);
        
        if (this.results.collected.length > 0) {
            console.log('\n🎯 COLLECTED LOGOS:');
            this.results.collected.forEach((logo, index) => {
                console.log(`${index + 1}. ${logo.company} → ${logo.filename} (${logo.domain})`);
            });
        }
        
        if (this.results.errors.length > 0) {
            console.log('\n🔍 COMMON ISSUES:');
            const errorTypes = {};
            this.results.errors.forEach(error => {
                const type = error.error.includes('not found') ? 'Not in Clearbit database' : 
                           error.error.includes('timeout') ? 'Network timeout' : 
                           'Other';
                errorTypes[type] = (errorTypes[type] || 0) + 1;
            });
            
            Object.entries(errorTypes).forEach(([type, count]) => {
                console.log(`   ${type}: ${count} companies`);
            });
        }
        
        console.log('\n💡 CLEARBIT INSIGHTS:');
        console.log('• Works best for established companies with strong web presence');
        console.log('• Free tier has rate limits but good quality logos');
        console.log('• Logos are standardized PNG format, consistent sizing');
        console.log('• May miss newer startups or companies with complex domains');
        
        console.log('\n🚀 NEXT STEPS:');
        console.log('1. Upload collected logos to Notion database');
        console.log('2. Use web scraping for companies Clearbit missed');
        console.log('3. Manual collection for remaining high-priority companies');
    }
}

// Test companies for Clearbit collection
const CLEARBIT_TEST_COMPANIES = [
    { name: 'Hootsuite', website: 'https://hootsuite.com' },
    { name: 'Elastic Path', website: 'https://www.elasticpath.com' },
    { name: 'BuildDirect', website: 'https://builddirect.com' },
    { name: 'Vision Critical', website: 'https://visioncritical.com' },
    { name: 'Mobify', website: 'https://mobify.com' },
    { name: 'Klue', website: 'https://klue.com' },
    { name: 'Procurify', website: 'https://procurify.com' },
    { name: 'BroadbandTV', website: 'https://broadbandtv.com' },
    { name: 'Plotly', website: 'https://plotly.com' },
    { name: 'MetaOptima', website: 'https://metaoptima.com' }
];

// Main execution function
async function main() {
    const collector = new ClearbitLogoCollector();
    
    console.log('🎯 CLEARBIT LOGO COLLECTION TEST');
    console.log('Testing logo collection from major BC tech companies\n');
    
    await collector.collectLogos(CLEARBIT_TEST_COMPANIES, 3);
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

module.exports = ClearbitLogoCollector;