/**
 * Mass Logo Collector - Collect logos for ALL 687 companies
 * Combines Clearbit API + Web Scraping + Favicon extraction
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');
const { URL } = require('url');

class MassLogoCollector {
    constructor() {
        this.results = {
            total: 0,
            successful: 0,
            failed: 0,
            skipped: 0,
            methods: {
                clearbit: 0,
                website: 0,
                favicon: 0,
                fallback: 0
            },
            collected: [],
            errors: []
        };
        
        this.logoSelectors = [
            'img[alt*="logo" i]',
            'img[src*="logo" i]',
            'img[class*="logo" i]',
            'img[id*="logo" i]',
            '.logo img',
            '#logo img',
            'header img:first-of-type',
            '.navbar-brand img',
            '.site-logo img',
            '.brand img',
            '.header-logo img',
            '.masthead img',
            '.branding img'
        ];
    }

    // Get companies from mock database (since we can't access Notion directly yet)
    async getMockCompanies() {
        // This would normally query Notion, but for now we'll use high-priority targets
        return [
            { name: 'Avigilon', website: 'https://avigilon.com' },
            { name: 'UrbanLogiq', website: 'https://urbanlogiq.com' },
            { name: 'Nimble AI', website: 'https://nimble.ai' },
            { name: 'Zenhub', website: 'https://zenhub.com' },
            { name: 'Finger Food ATG', website: 'https://fingerfoodatg.com' },
            { name: 'Redlen Technologies', website: 'https://redlen.com' },
            { name: 'Copilot', website: 'https://copilot.com' },
            { name: 'BroadbandTV', website: 'https://broadbandtv.com' },
            { name: 'Phreesia', website: 'https://phreesia.com' },
            { name: 'Finn AI', website: 'https://finn.ai' },
            { name: 'Beanworks', website: 'https://beanworks.com' },
            { name: 'Flighthub', website: 'https://flighthub.com' },
            { name: 'Invoke', website: 'https://invoke.ai' },
            { name: 'QHR Technologies', website: 'https://qhrtechnologies.com' },
            { name: 'Validere', website: 'https://validere.com' },
            { name: 'Ada', website: 'https://ada.cx' },
            { name: 'Trulioo', website: 'https://trulioo.com' },
            { name: 'Paymi', website: 'https://paymi.com' },
            { name: 'Mogo', website: 'https://mogo.ca' },
            { name: 'Dapper Labs', website: 'https://dapperlabs.com' }
        ];
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

    // Create safe filename from company name
    createSafeFilename(companyName, method = '') {
        const safe = companyName
            .replace(/[^a-zA-Z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
        
        const suffix = method ? `_${method}` : '';
        return `${safe}${suffix}_logo`;
    }

    // Method 1: Clearbit API
    async tryClealbit(company) {
        try {
            const domain = this.extractDomain(company.website);
            if (!domain) return null;

            const logoUrl = `https://logo.clearbit.com/${domain}?size=128&format=png`;
            
            const response = await axios.get(logoUrl, {
                responseType: 'arraybuffer',
                timeout: 8000,
                headers: { 'User-Agent': 'BC-AI-Ecosystem-Collector/2.0' }
            });

            if (response.data.length < 100) {
                throw new Error('Logo too small or not found');
            }

            const filename = this.createSafeFilename(company.name, 'clearbit');
            const filepath = path.join(__dirname, '..', 'logos', `${filename}.png`);
            
            await fs.writeFile(filepath, response.data);
            this.results.methods.clearbit++;
            
            return { filename: `${filename}.png`, method: 'clearbit', size: response.data.length };
            
        } catch (error) {
            return null;
        }
    }

    // Method 2: Website logo scraping
    async tryWebsiteScraping(company) {
        try {
            let url = company.website;
            if (!url.startsWith('http')) {
                url = `https://${url}`;
            }

            const response = await axios.get(url, {
                timeout: 10000,
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LogoCollector/2.0)' },
                maxContentLength: 2 * 1024 * 1024
            });

            const $ = cheerio.load(response.data);
            const logoUrls = new Set();

            // Try each selector
            for (const selector of this.logoSelectors) {
                $(selector).each((i, elem) => {
                    let src = $(elem).attr('src') || $(elem).attr('data-src');
                    if (src) {
                        try {
                            const absoluteUrl = new URL(src, url).href;
                            logoUrls.add(absoluteUrl);
                        } catch {}
                    }
                });
            }

            // Try to download the best logo
            for (const logoUrl of logoUrls) {
                if (logoUrl.includes('favicon') || logoUrl.includes('16x16') || logoUrl.includes('32x32')) {
                    continue;
                }

                try {
                    const logoResponse = await axios.get(logoUrl, {
                        responseType: 'arraybuffer',
                        timeout: 8000,
                        headers: { 'Referer': url }
                    });

                    const ext = path.extname(new URL(logoUrl).pathname) || '.png';
                    const filename = this.createSafeFilename(company.name, 'website');
                    const filepath = path.join(__dirname, '..', 'logos', `${filename}${ext}`);
                    
                    await fs.writeFile(filepath, logoResponse.data);
                    this.results.methods.website++;
                    
                    return { filename: `${filename}${ext}`, method: 'website', size: logoResponse.data.length };
                } catch {}
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    // Method 3: Favicon extraction
    async tryFavicon(company) {
        try {
            const domain = this.extractDomain(company.website);
            if (!domain) return null;

            const faviconUrls = [
                `https://${domain}/favicon.ico`,
                `https://${domain}/favicon.png`,
                `https://${domain}/apple-touch-icon.png`,
                `https://${domain}/apple-touch-icon-180x180.png`
            ];

            for (const faviconUrl of faviconUrls) {
                try {
                    const response = await axios.get(faviconUrl, {
                        responseType: 'arraybuffer',
                        timeout: 5000
                    });

                    if (response.data.length > 500) { // Reasonable favicon size
                        const ext = path.extname(new URL(faviconUrl).pathname) || '.ico';
                        const filename = this.createSafeFilename(company.name, 'favicon');
                        const filepath = path.join(__dirname, '..', 'logos', `${filename}${ext}`);
                        
                        await fs.writeFile(filepath, response.data);
                        this.results.methods.favicon++;
                        
                        return { filename: `${filename}${ext}`, method: 'favicon', size: response.data.length };
                    }
                } catch {}
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    // Method 4: Generate placeholder logo
    async createPlaceholder(company) {
        try {
            // Create a simple text-based placeholder (this would be more sophisticated)
            const initials = company.name
                .split(' ')
                .map(word => word[0])
                .join('')
                .substring(0, 3)
                .toUpperCase();

            const svgContent = `
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" fill="#1f2937"/>
  <text x="100" y="120" font-family="Arial, sans-serif" font-size="48" font-weight="bold" 
        text-anchor="middle" fill="#06b6d4">${initials}</text>
</svg>`;

            const filename = this.createSafeFilename(company.name, 'placeholder');
            const filepath = path.join(__dirname, '..', 'logos', `${filename}.svg`);
            
            await fs.writeFile(filepath, svgContent.trim());
            this.results.methods.fallback++;
            
            return { filename: `${filename}.svg`, method: 'placeholder', size: svgContent.length };
        } catch (error) {
            return null;
        }
    }

    // Collect logo using all methods
    async collectLogoForCompany(company) {
        console.log(`\n🔍 Collecting logo for: ${company.name}`);
        if (company.website) console.log(`   Website: ${company.website}`);

        // Check if logo already exists
        const existingFiles = await fs.readdir(path.join(__dirname, '..', 'logos')).catch(() => []);
        const companyBase = this.createSafeFilename(company.name);
        const existing = existingFiles.find(file => file.startsWith(companyBase));
        
        if (existing) {
            console.log(`   ⏭️ Logo already exists: ${existing}`);
            this.results.skipped++;
            return null;
        }

        // Try methods in order of preference
        const methods = [
            { name: 'Clearbit', func: () => this.tryClealbit(company) },
            { name: 'Website', func: () => this.tryWebsiteScraping(company) },
            { name: 'Favicon', func: () => this.tryFavicon(company) },
            { name: 'Placeholder', func: () => this.createPlaceholder(company) }
        ];

        for (const method of methods) {
            try {
                console.log(`   📥 Trying: ${method.name}`);
                const result = await method.func();
                
                if (result) {
                    console.log(`   ✅ Success: ${result.filename} (${(result.size / 1024).toFixed(1)}KB, ${result.method})`);
                    this.results.successful++;
                    this.results.collected.push({
                        company: company.name,
                        filename: result.filename,
                        method: result.method,
                        size: result.size,
                        website: company.website
                    });
                    return result;
                }
            } catch (error) {
                console.log(`   ❌ ${method.name} failed: ${error.message}`);
            }
            
            // Small delay between methods
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log(`   ❌ All methods failed`);
        this.results.failed++;
        this.results.errors.push({
            company: company.name,
            website: company.website,
            error: 'All collection methods failed'
        });

        return null;
    }

    // Process companies in batches
    async collectLogos(companies, batchSize = 3) {
        this.results.total = companies.length;
        console.log(`🎨 Starting mass logo collection for ${companies.length} companies...\n`);

        for (let i = 0; i < companies.length; i += batchSize) {
            const batch = companies.slice(i, i + batchSize);
            
            console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(companies.length / batchSize)}`);
            
            const promises = batch.map(company => 
                this.collectLogoForCompany(company).catch(error => {
                    console.log(`❌ Batch error for ${company.name}: ${error.message}`);
                    return null;
                })
            );
            
            await Promise.all(promises);
            
            // Pause between batches
            if (i + batchSize < companies.length) {
                console.log('\n   ⏸️ Pausing between batches...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        this.generateReport();
    }

    // Generate final report
    generateReport() {
        console.log('\n' + '='.repeat(70));
        console.log('🎨 MASS LOGO COLLECTION REPORT');
        console.log('='.repeat(70));
        
        console.log(`📊 COLLECTION STATISTICS:`);
        console.log(`   Total companies: ${this.results.total}`);
        console.log(`   Successfully collected: ${this.results.successful}`);
        console.log(`   Skipped (already exists): ${this.results.skipped}`);
        console.log(`   Failed: ${this.results.failed}`);
        
        const successRate = this.results.total > 0 ? 
            ((this.results.successful / this.results.total) * 100).toFixed(1) : 0;
        console.log(`   Success rate: ${successRate}%`);
        
        console.log(`\n🛠️ METHODS BREAKDOWN:`);
        console.log(`   Clearbit API: ${this.results.methods.clearbit} logos`);
        console.log(`   Website scraping: ${this.results.methods.website} logos`);
        console.log(`   Favicon extraction: ${this.results.methods.favicon} logos`);
        console.log(`   Placeholder generation: ${this.results.methods.fallback} logos`);
        
        if (this.results.collected.length > 0) {
            console.log(`\n🎯 NEW LOGOS COLLECTED:`);
            this.results.collected.forEach((logo, index) => {
                console.log(`   ${index + 1}. ${logo.company} → ${logo.filename} (${logo.method})`);
            });
        }
        
        console.log(`\n🚀 NEXT STEPS:`);
        console.log(`   1. Upload all logos to Notion database`);
        console.log(`   2. Update dashboard UI to display logos`);
        console.log(`   3. Create visual board views`);
        console.log(`   4. Scale to remaining companies`);
        
        // Save detailed results
        const reportPath = path.join(__dirname, '..', 'data', 'reports', 'mass-logo-collection-results.json');
        fs.writeFile(reportPath, JSON.stringify(this.results, null, 2)).catch(() => {});
        
        console.log(`\n💾 Detailed results saved to: mass-logo-collection-results.json`);
        console.log(`\n🎨 Mass logo collection complete! Ready for visual transformation.`);
    }
}

// Main execution
async function main() {
    const collector = new MassLogoCollector();
    
    console.log('🎨 MASS LOGO COLLECTION - Scale Up Operation');
    console.log('Collecting logos for maximum visual impact\n');
    
    const companies = await collector.getMockCompanies();
    await collector.collectLogos(companies, 2); // Process 2 at a time to be respectful
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

module.exports = MassLogoCollector;