const { Client } = require('@notionhq/client');
const fs = require('fs').promises;
const path = require('path');

// Notion API configuration
const NOTION_TOKEN = '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';
const DATABASE_ID = '1f0c6f799a3381bd8332ca0235c24655';
const notion = new Client({ auth: NOTION_TOKEN });

// Helper function to extract value from Notion property
function getFieldValue(property) {
    if (!property) return null;
    
    switch (property.type) {
        case 'title':
            return property.title?.[0]?.plain_text || '';
        case 'rich_text':
            return property.rich_text?.[0]?.plain_text || '';
        case 'url':
            return property.url || '';
        case 'files':
            return property.files?.length > 0 ? 'Has file' : '';
        default:
            return '';
    }
}

// Fetch all organizations from Notion
async function fetchAllOrganizations() {
    console.log('📊 Fetching all organizations from Notion...');
    
    let allResults = [];
    let cursor = null;
    
    do {
        const query = {
            database_id: DATABASE_ID,
            page_size: 100
        };
        
        if (cursor) {
            query.start_cursor = cursor;
        }
        
        const response = await notion.databases.query(query);
        allResults = allResults.concat(response.results);
        cursor = response.has_more ? response.next_cursor : null;
        
        console.log(`   Fetched ${allResults.length} organizations so far...`);
        
    } while (cursor);
    
    console.log(`✅ Fetched ${allResults.length} total organizations`);
    return allResults;
}

// Get list of available logos
async function getAvailableLogos() {
    console.log('🎨 Scanning local logo directory...');
    
    try {
        const logoFiles = await fs.readdir('logos');
        console.log(`✅ Found ${logoFiles.length} logo files`);
        
        const logoMap = new Map();
        
        for (const file of logoFiles) {
            // Extract organization name from filename
            const orgName = file
                .replace(/_logo\.(png|jpg|jpeg|svg|webp|ico)$/i, '')
                .replace(/_/g, ' ')
                .trim();
            
            const filePath = path.join('logos', file);
            const stats = await fs.stat(filePath);
            
            logoMap.set(orgName, {
                filename: file,
                path: filePath,
                size: stats.size,
                extension: path.extname(file).toLowerCase()
            });
        }
        
        return logoMap;
    } catch (error) {
        console.error('❌ Error reading logos directory:', error.message);
        return new Map();
    }
}

// Match organization names with logo files
function matchOrganizationWithLogo(orgName, logoMap) {
    // Try exact match first
    if (logoMap.has(orgName)) {
        return logoMap.get(orgName);
    }
    
    // Try fuzzy matching
    const normalizedOrgName = orgName.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    
    for (const [logoName, logoData] of logoMap) {
        const normalizedLogoName = logoName.toLowerCase().replace(/[^a-z0-9\s]/g, '');
        
        // Check if names are similar
        if (normalizedOrgName.includes(normalizedLogoName) || 
            normalizedLogoName.includes(normalizedOrgName)) {
            return logoData;
        }
        
        // Check for partial matches
        const orgWords = normalizedOrgName.split(' ').filter(w => w.length > 2);
        const logoWords = normalizedLogoName.split(' ').filter(w => w.length > 2);
        
        const commonWords = orgWords.filter(word => logoWords.includes(word));
        if (commonWords.length >= 1 && commonWords.length >= Math.min(orgWords.length, logoWords.length) * 0.5) {
            return logoData;
        }
    }
    
    return null;
}

// Upload logo to Notion page
async function uploadLogoToNotion(pageId, logoData) {
    try {
        // Read the file
        const fileBuffer = await fs.readFile(logoData.path);
        
        // Convert to base64 for external reference
        const base64Data = fileBuffer.toString('base64');
        const mimeType = getMimeType(logoData.extension);
        
        // Create the file upload payload using external type
        const filePayload = {
            Logo: {
                files: [{
                    name: logoData.filename,
                    type: 'external',
                    external: {
                        url: `data:${mimeType};base64,${base64Data}`
                    }
                }]
            }
        };
        
        // Update the page with the logo
        await notion.pages.update({
            page_id: pageId,
            properties: filePayload
        });
        
        return true;
        
    } catch (error) {
        console.error(`❌ Error uploading logo: ${error.message}`);
        return false;
    }
}

// Get MIME type for file extension
function getMimeType(extension) {
    const mimeTypes = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
        '.ico': 'image/x-icon'
    };
    
    return mimeTypes[extension] || 'application/octet-stream';
}

// Analyze logo coverage
async function analyzeLogoCoverage() {
    console.log('\n🎨 ANALYZING LOGO COVERAGE\n');
    
    const [notionOrgs, logoMap] = await Promise.all([
        fetchAllOrganizations(),
        getAvailableLogos()
    ]);
    
    console.log('\n📊 MATCHING ORGANIZATIONS WITH LOGOS...\n');
    
    const analysis = {
        totalOrgs: notionOrgs.length,
        totalLogos: logoMap.size,
        orgsWithLogos: 0,
        orgsWithoutLogos: 0,
        orgsWithMatchedLogos: 0,
        orgsWithoutMatchedLogos: 0,
        matches: [],
        unmatched: []
    };
    
    for (const org of notionOrgs) {
        const orgName = getFieldValue(org.properties['Name']);
        const hasLogo = getFieldValue(org.properties['Logo']);
        
        if (hasLogo) {
            analysis.orgsWithLogos++;
        } else {
            analysis.orgsWithoutLogos++;
        }
        
        const matchedLogo = matchOrganizationWithLogo(orgName, logoMap);
        
        if (matchedLogo) {
            analysis.orgsWithMatchedLogos++;
            analysis.matches.push({
                id: org.id,
                name: orgName,
                logo: matchedLogo,
                hasExistingLogo: !!hasLogo
            });
        } else {
            analysis.orgsWithoutMatchedLogos++;
            analysis.unmatched.push({
                id: org.id,
                name: orgName,
                hasExistingLogo: !!hasLogo
            });
        }
    }
    
    console.log('📈 LOGO ANALYSIS RESULTS:');
    console.log(`   🎯 Total Organizations: ${analysis.totalOrgs}`);
    console.log(`   🎨 Available Logo Files: ${analysis.totalLogos}`);
    console.log(`   ✅ Organizations with Logos: ${analysis.orgsWithLogos} (${Math.round(analysis.orgsWithLogos/analysis.totalOrgs*100)}%)`);
    console.log(`   ❌ Organizations without Logos: ${analysis.orgsWithoutLogos} (${Math.round(analysis.orgsWithoutLogos/analysis.totalOrgs*100)}%)`);
    console.log(`   🔗 Matched to Local Logos: ${analysis.orgsWithMatchedLogos} (${Math.round(analysis.orgsWithMatchedLogos/analysis.totalOrgs*100)}%)`);
    console.log(`   🚫 No Local Logo Match: ${analysis.orgsWithoutMatchedLogos} (${Math.round(analysis.orgsWithoutMatchedLogos/analysis.totalOrgs*100)}%)`);
    
    console.log('\n🎯 READY TO UPLOAD:');
    const readyToUpload = analysis.matches.filter(m => !m.hasExistingLogo);
    console.log(`   📤 Organizations ready for logo upload: ${readyToUpload.length}`);
    
    if (readyToUpload.length > 0) {
        console.log('\n🚀 TOP ORGANIZATIONS READY FOR UPLOAD:');
        readyToUpload.slice(0, 10).forEach((match, index) => {
            console.log(`   ${index + 1}. ${match.name} → ${match.logo.filename} (${(match.logo.size/1024).toFixed(1)}KB)`);
        });
    }
    
    // Save analysis for upload command
    await fs.writeFile('logo_upload_analysis.json', JSON.stringify(analysis, null, 2));
    console.log('\n✅ Analysis saved to logo_upload_analysis.json');
    
    return analysis;
}

// Batch upload logos
async function batchUploadLogos(limit = 20) {
    console.log(`\n🚀 BATCH UPLOADING UP TO ${limit} LOGOS...\n`);
    
    try {
        const analysisFile = await fs.readFile('logo_upload_analysis.json', 'utf8');
        const analysis = JSON.parse(analysisFile);
        
        const toUpload = analysis.matches
            .filter(m => !m.hasExistingLogo)
            .slice(0, limit);
        
        console.log(`🎯 Uploading logos for ${toUpload.length} organizations...`);
        
        let successful = 0;
        let failed = 0;
        
        for (const match of toUpload) {
            console.log(`\n🎨 Uploading logo for: ${match.name}`);
            console.log(`   File: ${match.logo.filename} (${(match.logo.size/1024).toFixed(1)}KB)`);
            
            const success = await uploadLogoToNotion(match.id, match.logo);
            
            if (success) {
                successful++;
                console.log(`   ✅ Logo uploaded successfully`);
            } else {
                failed++;
                console.log(`   ❌ Upload failed`);
            }
            
            // Rate limiting to avoid API limits
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log(`\n🎉 BATCH UPLOAD COMPLETE!`);
        console.log(`   ✅ Successful: ${successful} logos`);
        console.log(`   ❌ Failed: ${failed} logos`);
        console.log(`   📊 Success rate: ${Math.round(successful/(successful+failed)*100)}%`);
        
    } catch (error) {
        console.error('❌ Error during batch upload:', error.message);
        console.log('\n💡 Run "analyze" command first to generate analysis data');
    }
}

// List unmatched logos for manual review
async function listUnmatchedLogos() {
    console.log('\n🔍 REVIEWING UNMATCHED LOGOS\n');
    
    const [notionOrgs, logoMap] = await Promise.all([
        fetchAllOrganizations(),
        getAvailableLogos()
    ]);
    
    const orgNames = new Set(notionOrgs.map(org => getFieldValue(org.properties['Name'])));
    const unmatchedLogos = [];
    
    for (const [logoName, logoData] of logoMap) {
        let matched = false;
        
        for (const orgName of orgNames) {
            if (matchOrganizationWithLogo(orgName, new Map([[logoName, logoData]]))) {
                matched = true;
                break;
            }
        }
        
        if (!matched) {
            unmatchedLogos.push({ logoName, logoData });
        }
    }
    
    console.log(`🎨 UNMATCHED LOGOS (${unmatchedLogos.length} files):`);
    unmatchedLogos.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.logoData.filename} → "${item.logoName}" (${(item.logoData.size/1024).toFixed(1)}KB)`);
    });
    
    if (unmatchedLogos.length > 0) {
        console.log('\n💡 These logos may need manual organization name matching or represent organizations not in the database.');
    }
}

// Main CLI
async function main() {
    const command = process.argv[2];
    const limit = parseInt(process.argv[3]) || 20;
    
    switch (command) {
        case 'analyze':
            await analyzeLogoCoverage();
            break;
            
        case 'upload':
            await batchUploadLogos(limit);
            break;
            
        case 'unmatched':
            await listUnmatchedLogos();
            break;
            
        case 'full':
            console.log('🎨 RUNNING COMPLETE LOGO UPLOAD PIPELINE...\n');
            await analyzeLogoCoverage();
            await batchUploadLogos(100); // Upload all available matches
            await listUnmatchedLogos();
            console.log('\n🎉 COMPLETE PIPELINE FINISHED!');
            break;
            
        default:
            console.log(`
🎨 LOGO UPLOAD TOOL

Commands:
  analyze              - Analyze logo coverage and matching
  upload [limit]       - Upload matched logos to Notion (default: 20)
  unmatched           - List logos that don't match any organization
  full                - Run complete logo upload pipeline

Examples:
  node logo_uploader.js analyze
  node logo_uploader.js upload 10
  node logo_uploader.js full
            `);
    }
}

if (require.main === module) {
    main().catch(console.error);
} 