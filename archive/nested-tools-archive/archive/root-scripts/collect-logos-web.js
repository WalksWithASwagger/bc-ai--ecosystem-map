/**
 * Web Logo Collector - Automated logo discovery from company websites
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');
const { URL } = require('url');

class WebLogoCollector {
    constructor() {
        this.results = {
            successful: 0,
            failed: 0,
            skipped: 0,
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
            '.brand img'
        ];
    }

    // Download and save logo from URL
    async downloadLogo(logoUrl, companyName, websiteUrl) {
        try {
            // Create safe filename
            const safeCompanyName = companyName
                .replace(/[^a-zA-Z0-9]/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_|_$/g, '');
            
            // Get file extension from URL
            const urlParts = new URL(logoUrl);
            let extension = path.extname(urlParts.pathname) || '.png';
            if (!extension.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
                extension = '.png';
            }
            
            const filename = `${safeCompanyName}_logo${extension}`;
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
            
            // Download with proper headers
            const response = await axios.get(logoUrl, {
                responseType: 'arraybuffer',
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; LogoCollector/1.0)',
                    'Referer': websiteUrl
                },
                maxContentLength: 5 * 1024 * 1024 // 5MB max
            });
            
            // Validate content type
            const contentType = response.headers['content-type'];
            if (!contentType?.startsWith('image/')) {
                throw new Error(`Invalid content type: ${contentType}`);
            }
            
            // Save file
            await fs.writeFile(filepath, response.data);
            
            const stats = await fs.stat(filepath);
            console.log(`   ✅ Downloaded: ${filename} (${(stats.size / 1024).toFixed(1)}KB)`);
            
            this.results.successful++;
            this.results.collected.push({
                company: companyName,
                filename,
                url: logoUrl,
                size: stats.size,
                website: websiteUrl
            });
            
            return filename;
            
        } catch (error) {
            console.log(`   ❌ Download failed: ${error.message}`);
            this.results.failed++;
            this.results.errors.push({
                company: companyName,
                url: logoUrl,
                error: error.message
            });
            return null;
        }
    }

    // Extract logo URLs from website HTML
    extractLogoUrls(html, baseUrl) {
        const $ = cheerio.load(html);
        const logoUrls = new Set();
        
        // Try each logo selector
        for (const selector of this.logoSelectors) {
            $(selector).each((i, elem) => {
                let src = $(elem).attr('src') || $(elem).attr('data-src');
                if (src) {
                    try {
                        const absoluteUrl = new URL(src, baseUrl).href;
                        logoUrls.add(absoluteUrl);
                    } catch {
                        // Invalid URL, skip
                    }
                }
            });
        }
        
        // Also check for link rel="icon" and similar
        $('link[rel*="icon"]').each((i, elem) => {
            let href = $(elem).attr('href');
            if (href) {
                try {
                    const absoluteUrl = new URL(href, baseUrl).href;
                    logoUrls.add(absoluteUrl);
                } catch {
                    // Invalid URL, skip
                }
            }
        });
        
        return Array.from(logoUrls);
    }

    // Scrape logo from a single website
    async scrapeLogo(company) {
        const { name, website } = company;
        
        console.log(`\n🔍 Scraping: ${name}`);
        console.log(`   Website: ${website}`);
        
        try {
            // Ensure website has protocol
            let url = website;
            if (!url.startsWith('http')) {
                url = `https://${url}`;
            }
            
            // Fetch website HTML
            const response = await axios.get(url, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; LogoCollector/1.0)'
                },
                maxContentLength: 2 * 1024 * 1024 // 2MB max
            });
            
            // Extract logo URLs
            const logoUrls = this.extractLogoUrls(response.data, url);
            
            if (logoUrls.length === 0) {
                console.log(`   ⚠️ No logos found on website`);
                this.results.failed++;
                return null;
            }
            
            console.log(`   🎯 Found ${logoUrls.length} potential logo(s)`);
            
            // Try to download the best logo
            for (const logoUrl of logoUrls) {
                // Skip tiny icons and favicons
                if (logoUrl.includes('favicon') || logoUrl.includes('icon-') || 
                    logoUrl.includes('16x16') || logoUrl.includes('32x32')) {
                    continue;
                }
                
                console.log(`   📥 Trying: ${logoUrl}`);
                const filename = await this.downloadLogo(logoUrl, name, url);
                if (filename) {
                    return filename;
                }
            }
            
            // If no good logos, try the first one anyway
            if (logoUrls.length > 0) {
                console.log(`   🔄 Trying first available logo...`);
                return await this.downloadLogo(logoUrls[0], name, url);
            }
            
        } catch (error) {
            console.log(`   ❌ Scraping failed: ${error.message}`);
            this.results.failed++;
            this.results.errors.push({
                company: name,
                website: website,
                error: error.message
            });
        }
        
        return null;
    }

    // Process multiple companies
    async collectLogos(companies, maxConcurrent = 3) {
        console.log(`🎨 Starting logo collection for ${companies.length} companies...\n`);
        
        // Process in batches to avoid overwhelming servers
        for (let i = 0; i < companies.length; i += maxConcurrent) {
            const batch = companies.slice(i, i + maxConcurrent);
            
            console.log(`📦 Processing batch ${Math.floor(i / maxConcurrent) + 1}/${Math.ceil(companies.length / maxConcurrent)}`);
            
            const promises = batch.map(company => 
                this.scrapeLogo(company).catch(error => {
                    console.log(`❌ Batch error for ${company.name}: ${error.message}`);
                    return null;
                })
            );
            
            await Promise.all(promises);
            
            // Brief pause between batches
            if (i + maxConcurrent < companies.length) {
                console.log('   ⏸️ Pausing between batches...\n');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        this.generateReport();
    }

    // Generate collection report
    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('🎨 LOGO COLLECTION REPORT');
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
                console.log(`${index + 1}. ${logo.company} → ${logo.filename}`);
            });
        }
        
        if (this.results.errors.length > 0) {
            console.log('\n🔍 COLLECTION ERRORS:');
            this.results.errors.slice(0, 10).forEach((error, index) => {
                console.log(`${index + 1}. ${error.company}: ${error.error}`);
            });
            
            if (this.results.errors.length > 10) {
                console.log(`   ... and ${this.results.errors.length - 10} more errors`);
            }
        }
        
        console.log('\n🚀 NEXT STEPS:');
        console.log('1. Review collected logos for quality');
        console.log('2. Upload new logos to Notion database');
        console.log('3. Try alternative methods for failed companies');
    }
}

// Example usage and test data
const TEST_COMPANIES = [
    { name: 'Clio', website: 'https://www.clio.com' },
    { name: 'D-Wave Systems', website: 'https://www.dwavesys.com' },
    { name: 'Sanctuary AI', website: 'https://sanctuary.ai' },
    { name: 'AbCellera', website: 'https://www.abcellera.com' },
    { name: 'Terramera', website: 'https://terramera.com' }
];

// Main execution function
async function main() {
    const collector = new WebLogoCollector();
    
    // For testing, use a small set of high-priority companies
    console.log('🧪 LOGO COLLECTION TEST RUN');
    console.log('This will attempt to collect logos from major BC AI companies\n');
    
    await collector.collectLogos(TEST_COMPANIES, 2);
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

module.exports = WebLogoCollector;