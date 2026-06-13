/**
 * BC AI Ecosystem - Logo Upload Tool
 * Systematically uploads collected logos to Notion database
 */

const { Client } = require('@notionhq/client');
const fs = require('fs').promises;
const path = require('path');

// Initialize Notion client
const notion = new Client({
    auth: process.env.NOTION_TOKEN
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;
const LOGOS_DIR = path.join(__dirname, '..', 'logos');

// Company name mapping for logo file matching
const COMPANY_NAME_MAPPING = {
    // Handle common filename variations
    'Bron_Studios_logo.svg': 'Bron Studios',
    'Routific_logo.svg': 'Routific',
    'Unbounce_logo.svg': 'Unbounce',
    'Bench_Accounting_logo.png': 'Bench',
    'Sendwithus_logo.png': 'Sendwithus',
    'Phoenix_Labs_logo.svg': 'Phoenix Labs',
    'Relic_Entertainment_logo.png': 'Relic Entertainment',
    'Response_Biomedical_logo.svg': 'Response Biomedical',
    'Aurinia_Pharmaceuticals_logo.png': 'Aurinia Pharmaceuticals',
    'Eupraxia_Pharmaceuticals_logo.png': 'Eupraxia Pharmaceuticals',
    'Verge_Agriculture_logo.png': 'Verge Agriculture',
    'Lucent_BioSciences_logo.svg': 'Lucent BioSciences',
    '1QB_Information_Technologies_logo.svg': '1QB Information Technologies',
    'Growlyn_logo.png': 'Growlyn',
    'Compression_ai_logo.png': 'Compression.ai',
    'FTSY_logo.png': 'FTSY',
    'Autonopia_logo.png': 'Autonopia',
    'Proto_logo.webp': 'Proto',
    'WillowTree__logo.svg': 'WillowTree',
    'Denologix_logo.png': 'Denologix',
    'INTERSOG_logo.svg': 'INTERSOG',
    'MistyWest_logo.svg': 'MistyWest',
    'Steamclock_Software_logo.png': 'Steamclock Software',
    'Venovis_logo.svg': 'Venovis',
    'Insight_Global_logo.png': 'Insight Global',
    'ValueLabs_logo.svg': 'ValueLabs',
    'Epsilon_Venture_Group_logo.png': 'Epsilon Venture Group',
    'Digitalist_North_America_logo.webp': 'Digitalist North America',
    'IT_Kapital_logo.png': 'IT Kapital',
    'Improving_logo.jpg': 'Improving',
    'deltAlyz_Corp_logo.webp': 'deltAlyz Corp',
    'Ekohe_logo.svg': 'Ekohe',
    'Wizard_Labs_logo.png': 'Wizard Labs',
    'RBC_Borealis_logo.png': 'RBC Borealis',
    'Quantum_Algorithms_Institute_logo.png': 'Quantum Algorithms Institute',
    'Photonic_Inc_logo.svg': 'Photonic Inc',
    '7Gen_logo.svg': '7Gen',
    'Ekona_Power_logo.png': 'Ekona Power',
    'Mangrove_Lithium_logo.jpg': 'Mangrove Lithium',
    'HomeCourt_NEX_Team_logo.png': 'HomeCourt (NEX Team)',
    'Gaze_logo.png': 'Gaze',
    'Canexia_Health_logo.png': 'Canexia Health',
    'Amphoraxe_Life_Sciences_Inc_logo.png': 'Amphoraxe Life Sciences Inc',
    'CereCura_Nanotherapeutics_logo.png': 'CereCura Nanotherapeutics',
    'Arrowsmith_Genetics_logo.png': 'Arrowsmith Genetics',
    'Aqua_Intelligent_logo.png': 'Aqua Intelligent',
    'Anodyne_Chemistries_logo.png': 'Anodyne Chemistries',
    'Lite_1_logo.svg': 'Lite 1',
    'Orca_Water_logo.svg': 'Orca Water',
    'pH7_Technologies_logo.png': 'pH7 Technologies',
    'PacifiCan_AI_Initiative_logo.svg': 'PacifiCan AI Initiative',
    'Innovate_BC_logo.png': 'Innovate BC',
    'Kindred_logo.png': 'Kindred',
    'Spare_logo.svg': 'Spare'
};

class LogoUploader {
    constructor() {
        this.results = {
            successful: 0,
            failed: 0,
            skipped: 0,
            errors: []
        };
    }

    // Extract company name from filename
    extractCompanyName(filename) {
        if (COMPANY_NAME_MAPPING[filename]) {
            return COMPANY_NAME_MAPPING[filename];
        }
        
        // Fallback: clean filename approach
        return filename
            .replace(/_logo\.(svg|png|jpg|jpeg|webp)$/i, '')
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .trim()
            .replace(/\s+/g, ' ');
    }

    // Get all companies from Notion database
    async getAllCompanies() {
        console.log('📊 Fetching all companies from Notion database...');
        
        const companies = [];
        let cursor = undefined;
        
        do {
            const response = await notion.databases.query({
                database_id: DATABASE_ID,
                start_cursor: cursor,
                page_size: 100
            });
            
            companies.push(...response.results);
            cursor = response.next_cursor;
        } while (cursor);
        
        console.log(`✅ Found ${companies.length} companies in database`);
        return companies;
    }

    // Find matching company by name
    findMatchingCompany(logoCompanyName, companies) {
        // Exact match first
        let match = companies.find(company => {
            const notionName = company.properties.Name?.title[0]?.plain_text?.toLowerCase();
            return notionName === logoCompanyName.toLowerCase();
        });
        
        if (match) return match;
        
        // Fuzzy match - contains or starts with
        match = companies.find(company => {
            const notionName = company.properties.Name?.title[0]?.plain_text?.toLowerCase();
            const logoName = logoCompanyName.toLowerCase();
            
            return notionName?.includes(logoName) || logoName.includes(notionName);
        });
        
        return match;
    }

    // Check if company already has a logo
    hasExistingLogo(company) {
        const logoFiles = company.properties.Logo?.files;
        return logoFiles && logoFiles.length > 0;
    }

    // Upload logo file to Notion page
    async uploadLogoToPage(pageId, logoPath, filename) {
        try {
            // Read file as base64
            const fileBuffer = await fs.readFile(logoPath);
            const fileBase64 = fileBuffer.toString('base64');
            
            // Determine MIME type
            const ext = path.extname(filename).toLowerCase();
            const mimeTypes = {
                '.svg': 'image/svg+xml',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.webp': 'image/webp'
            };
            
            const mimeType = mimeTypes[ext] || 'image/png';
            
            // Upload file to Notion
            const response = await notion.pages.update({
                page_id: pageId,
                properties: {
                    Logo: {
                        files: [{
                            name: filename,
                            type: 'external',
                            external: {
                                url: `data:${mimeType};base64,${fileBase64}`
                            }
                        }]
                    }
                }
            });
            
            return response;
            
        } catch (error) {
            throw new Error(`Upload failed: ${error.message}`);
        }
    }

    // Process all logos
    async processLogos() {
        try {
            console.log('🎨 Starting logo upload process...\n');
            
            // Get all logo files
            const logoFiles = await fs.readdir(LOGOS_DIR);
            const validExtensions = ['.svg', '.png', '.jpg', '.jpeg', '.webp'];
            const logoFilesToProcess = logoFiles.filter(file => 
                validExtensions.includes(path.extname(file).toLowerCase())
            );
            
            console.log(`📁 Found ${logoFilesToProcess.length} logo files to process`);
            
            // Get all companies from Notion
            const companies = await this.getAllCompanies();
            
            console.log('\n🚀 Starting logo matching and upload...\n');
            
            // Process each logo file
            for (const logoFile of logoFilesToProcess) {
                const logoPath = path.join(LOGOS_DIR, logoFile);
                const companyName = this.extractCompanyName(logoFile);
                
                console.log(`\n🔍 Processing: ${logoFile}`);
                console.log(`   Company name: ${companyName}`);
                
                // Find matching company
                const matchingCompany = this.findMatchingCompany(companyName, companies);
                
                if (!matchingCompany) {
                    console.log(`   ❌ No matching company found`);
                    this.results.failed++;
                    this.results.errors.push({
                        file: logoFile,
                        company: companyName,
                        error: 'No matching company found'
                    });
                    continue;
                }
                
                const notionName = matchingCompany.properties.Name?.title[0]?.plain_text;
                console.log(`   ✅ Found match: ${notionName}`);
                
                // Check if logo already exists
                if (this.hasExistingLogo(matchingCompany)) {
                    console.log(`   ⏭️ Logo already exists, skipping`);
                    this.results.skipped++;
                    continue;
                }
                
                // Upload logo
                try {
                    await this.uploadLogoToPage(matchingCompany.id, logoPath, logoFile);
                    console.log(`   🎨 Logo uploaded successfully!`);
                    this.results.successful++;
                    
                    // Small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                } catch (error) {
                    console.log(`   ❌ Upload failed: ${error.message}`);
                    this.results.failed++;
                    this.results.errors.push({
                        file: logoFile,
                        company: companyName,
                        notionName: notionName,
                        error: error.message
                    });
                }
            }
            
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Fatal error:', error.message);
            throw error;
        }
    }

    // Generate summary report
    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('🎨 LOGO UPLOAD SUMMARY REPORT');
        console.log('='.repeat(60));
        
        console.log(`✅ Successfully uploaded: ${this.results.successful} logos`);
        console.log(`⏭️ Skipped (already exists): ${this.results.skipped} logos`);
        console.log(`❌ Failed: ${this.results.failed} logos`);
        
        const total = this.results.successful + this.results.skipped + this.results.failed;
        const successRate = total > 0 ? ((this.results.successful / total) * 100).toFixed(1) : 0;
        
        console.log(`📊 Success rate: ${successRate}%`);
        
        if (this.results.errors.length > 0) {
            console.log('\n🔍 ERRORS DETAIL:');
            this.results.errors.forEach((error, index) => {
                console.log(`\n${index + 1}. ${error.file}`);
                console.log(`   Company: ${error.company}`);
                if (error.notionName) console.log(`   Notion match: ${error.notionName}`);
                console.log(`   Error: ${error.error}`);
            });
        }
        
        console.log('\n🎯 NEXT STEPS:');
        console.log('1. Review failed uploads and fix company name mapping');
        console.log('2. Set up visual board views in Notion');
        console.log('3. Configure color coding and visual hierarchy');
        console.log('4. Test discovery workflows');
        
        console.log('\n🚀 Visual database transformation complete!');
    }
}

// Main execution
async function main() {
    // Check environment variables
    if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
        console.error('❌ Missing required environment variables:');
        console.error('   NOTION_TOKEN - Your Notion integration token');
        console.error('   NOTION_DATABASE_ID - Your database ID');
        process.exit(1);
    }
    
    const uploader = new LogoUploader();
    await uploader.processLogos();
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

module.exports = LogoUploader;