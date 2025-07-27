const { Client } = require('@notionhq/client');
const axios = require('axios');
const fs = require('fs').promises;
const cheerio = require('cheerio');

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
        case 'number':
            return property.number || null;
        case 'select':
            return property.select?.name || '';
        case 'multi_select':
            return property.multi_select?.map(item => item.name) || [];
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

// Extract founding year from website content
function extractFoundingYear(html, orgName) {
    const $ = cheerio.load(html);
    const text = $('body').text().toLowerCase();
    
    // Patterns to look for founding years
    const patterns = [
        /founded[\s:]*in[\s]*(\d{4})/i,
        /established[\s:]*in[\s]*(\d{4})/i,
        /since[\s]*(\d{4})/i,
        /started[\s:]*in[\s]*(\d{4})/i,
        /incorporated[\s:]*in[\s]*(\d{4})/i,
        /began[\s:]*in[\s]*(\d{4})/i,
        /launched[\s:]*in[\s]*(\d{4})/i,
        /created[\s:]*in[\s]*(\d{4})/i,
        /founded[\s:]*(\d{4})/i,
        /established[\s:]*(\d{4})/i,
        /©\s*(\d{4})/,
        /copyright\s*(\d{4})/i
    ];
    
    const years = [];
    
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            const year = parseInt(matches[1]);
            if (year >= 1950 && year <= new Date().getFullYear()) {
                years.push(year);
            }
        }
    }
    
    // Also check for years in "About" sections specifically
    const aboutSections = $('section:contains("about"), div:contains("about"), .about, #about').text().toLowerCase();
    const aboutYearMatches = aboutSections.match(/(\d{4})/g);
    if (aboutYearMatches) {
        for (const yearStr of aboutYearMatches) {
            const year = parseInt(yearStr);
            if (year >= 1950 && year <= new Date().getFullYear()) {
                years.push(year);
            }
        }
    }
    
    // Return the most likely founding year (earliest reasonable year found)
    if (years.length > 0) {
        return Math.min(...years);
    }
    
    return null;
}

// Research LinkedIn for founding information
async function researchLinkedInProfile(linkedinUrl) {
    // For now, return null since LinkedIn requires special handling
    // This could be enhanced with LinkedIn API or scraping
    return null;
}

// Research founding year for an organization
async function researchFoundingYear(org) {
    const name = getFieldValue(org.properties['Name']);
    const website = getFieldValue(org.properties['Website']);
    const linkedin = getFieldValue(org.properties['LinkedIn']);
    const currentYear = getFieldValue(org.properties['Year Founded']);
    
    if (currentYear) {
        return { year: currentYear, source: 'existing' };
    }
    
    console.log(`🔍 Researching: ${name}`);
    
    let foundYear = null;
    let source = null;
    
    // Try website first
    if (website) {
        try {
            console.log(`   🌐 Checking website: ${website}`);
            
            // Ensure website has protocol
            let url = website;
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            
            const response = await axios.get(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                }
            });
            
            foundYear = extractFoundingYear(response.data, name);
            if (foundYear) {
                source = 'website';
                console.log(`   ✅ Found year: ${foundYear} (from website)`);
            } else {
                console.log(`   ℹ️ No founding year found on website`);
            }
            
        } catch (error) {
            console.log(`   ❌ Error accessing website: ${error.message}`);
        }
    }
    
    // Try LinkedIn if no year found and LinkedIn URL exists
    if (!foundYear && linkedin) {
        try {
            console.log(`   🔗 Checking LinkedIn: ${linkedin}`);
            const linkedinYear = await researchLinkedInProfile(linkedin);
            if (linkedinYear) {
                foundYear = linkedinYear;
                source = 'linkedin';
                console.log(`   ✅ Found year: ${foundYear} (from LinkedIn)`);
            } else {
                console.log(`   ℹ️ No founding year found on LinkedIn`);
            }
        } catch (error) {
            console.log(`   ❌ Error accessing LinkedIn: ${error.message}`);
        }
    }
    
    return foundYear ? { year: foundYear, source, confidence: 'high' } : null;
}

// Update organization with founding year
async function updateFoundingYear(pageId, year) {
    try {
        await notion.pages.update({
            page_id: pageId,
            properties: {
                'Year Founded': { number: year }
            }
        });
        return true;
    } catch (error) {
        console.error(`❌ Failed to update founding year: ${error.message}`);
        return false;
    }
}

// Analyze founding year gaps
async function analyzeFoundingYearGaps() {
    console.log('\n📅 ANALYZING FOUNDING YEAR GAPS\n');
    
    const notionOrgs = await fetchAllOrganizations();
    
    const analysis = {
        total: notionOrgs.length,
        withFoundingYear: 0,
        missingFoundingYear: 0,
        withWebsite: 0,
        withLinkedIn: 0,
        candidates: []
    };
    
    for (const org of notionOrgs) {
        const name = getFieldValue(org.properties['Name']);
        const website = getFieldValue(org.properties['Website']);
        const linkedin = getFieldValue(org.properties['LinkedIn']);
        const yearFounded = getFieldValue(org.properties['Year Founded']);
        
        if (yearFounded) {
            analysis.withFoundingYear++;
        } else {
            analysis.missingFoundingYear++;
            
            if (website || linkedin) {
                analysis.candidates.push({
                    id: org.id,
                    name,
                    website,
                    linkedin,
                    hasWebsite: !!website,
                    hasLinkedIn: !!linkedin
                });
            }
        }
        
        if (website) analysis.withWebsite++;
        if (linkedin) analysis.withLinkedIn++;
    }
    
    // Sort candidates by research potential
    analysis.candidates.sort((a, b) => {
        const scoreA = (a.hasWebsite ? 2 : 0) + (a.hasLinkedIn ? 1 : 0);
        const scoreB = (b.hasWebsite ? 2 : 0) + (b.hasLinkedIn ? 1 : 0);
        return scoreB - scoreA;
    });
    
    console.log('📊 FOUNDING YEAR ANALYSIS:');
    console.log(`   🎯 Total Organizations: ${analysis.total}`);
    console.log(`   ✅ With Founding Year: ${analysis.withFoundingYear} (${Math.round(analysis.withFoundingYear/analysis.total*100)}%)`);
    console.log(`   ❌ Missing Founding Year: ${analysis.missingFoundingYear} (${Math.round(analysis.missingFoundingYear/analysis.total*100)}%)`);
    console.log(`   🌐 With Website: ${analysis.withWebsite} (${Math.round(analysis.withWebsite/analysis.total*100)}%)`);
    console.log(`   🔗 With LinkedIn: ${analysis.withLinkedIn} (${Math.round(analysis.withLinkedIn/analysis.total*100)}%)`);
    console.log(`   🔍 Research Candidates: ${analysis.candidates.length} organizations`);
    
    if (analysis.candidates.length > 0) {
        console.log('\n🚀 TOP RESEARCH CANDIDATES:');
        analysis.candidates.slice(0, 15).forEach((candidate, index) => {
            const sources = [];
            if (candidate.hasWebsite) sources.push('Website');
            if (candidate.hasLinkedIn) sources.push('LinkedIn');
            console.log(`   ${index + 1}. ${candidate.name} (${sources.join(', ')})`);
        });
    }
    
    // Save analysis
    await fs.writeFile('founding_year_analysis.json', JSON.stringify(analysis, null, 2));
    console.log('\n✅ Analysis saved to founding_year_analysis.json');
    
    return analysis;
}

// Batch research founding years
async function batchResearchFoundingYears(limit = 30) {
    console.log(`\n🔍 RESEARCHING FOUNDING YEARS FOR UP TO ${limit} ORGANIZATIONS...\n`);
    
    try {
        const analysisFile = await fs.readFile('founding_year_analysis.json', 'utf8');
        const analysis = JSON.parse(analysisFile);
        
        const candidates = analysis.candidates.slice(0, limit);
        console.log(`🎯 Researching ${candidates.length} organizations...`);
        
        const discoveries = [];
        let successful = 0;
        let failed = 0;
        
        for (const candidate of candidates) {
            try {
                console.log(`🔍 Researching: ${candidate.name}`);
                
                let foundYear = null;
                let source = null;
                
                // Try website first
                if (candidate.website) {
                    try {
                        console.log(`   🌐 Checking website: ${candidate.website}`);
                        
                        // Ensure website has protocol
                        let url = candidate.website;
                        if (!url.startsWith('http://') && !url.startsWith('https://')) {
                            url = 'https://' + url;
                        }
                        
                        const response = await axios.get(url, {
                            timeout: 10000,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                            }
                        });
                        
                        foundYear = extractFoundingYear(response.data, candidate.name);
                        if (foundYear) {
                            source = 'website';
                            console.log(`   ✅ Found year: ${foundYear} (from website)`);
                        } else {
                            console.log(`   ℹ️ No founding year found on website`);
                        }
                        
                    } catch (error) {
                        console.log(`   ❌ Error accessing website: ${error.message}`);
                    }
                }
                
                if (foundYear) {
                    discoveries.push({
                        id: candidate.id,
                        name: candidate.name,
                        year: foundYear,
                        source: source,
                        confidence: 'high'
                    });
                    successful++;
                } else {
                    failed++;
                }
                
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                console.log(`   ❌ Error researching ${candidate.name}: ${error.message}`);
                failed++;
            }
        }
        
        // Save discoveries
        await fs.writeFile('founding_year_discoveries.json', JSON.stringify(discoveries, null, 2));
        
        console.log(`\n🎉 RESEARCH COMPLETE!`);
        console.log(`   🔍 Organizations researched: ${candidates.length}`);
        console.log(`   ✅ Years discovered: ${successful}`);
        console.log(`   ❌ No data found: ${failed}`);
        console.log(`   📊 Discovery rate: ${Math.round(successful/(successful+failed)*100)}%`);
        console.log(`   📁 Saved: founding_year_discoveries.json`);
        
        return discoveries;
        
    } catch (error) {
        console.error('❌ Error during research:', error.message);
        console.log('\n💡 Run "analyze" command first to generate analysis data');
    }
}

// Apply discovered founding years
async function applyFoundingYearDiscoveries() {
    console.log('\n🚀 APPLYING FOUNDING YEAR DISCOVERIES...\n');
    
    try {
        const discoveriesFile = await fs.readFile('founding_year_discoveries.json', 'utf8');
        const discoveries = JSON.parse(discoveriesFile);
        
        console.log(`📋 Applying ${discoveries.length} founding year discoveries...`);
        
        let successful = 0;
        let failed = 0;
        
        for (const discovery of discoveries) {
            console.log(`\n📅 Updating: ${discovery.name}`);
            console.log(`   Year: ${discovery.year} (from ${discovery.source})`);
            
            const success = await updateFoundingYear(discovery.id, discovery.year);
            
            if (success) {
                successful++;
                console.log(`   ✅ Updated successfully`);
            } else {
                failed++;
                console.log(`   ❌ Update failed`);
            }
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        console.log(`\n🎉 APPLICATION COMPLETE!`);
        console.log(`   ✅ Successful: ${successful} organizations`);
        console.log(`   ❌ Failed: ${failed} organizations`);
        console.log(`   📊 Success rate: ${Math.round(successful/(successful+failed)*100)}%`);
        
    } catch (error) {
        console.error('❌ Error applying discoveries:', error.message);
        console.log('\n💡 Run "research" command first to generate discovery data');
    }
}

// Main CLI
async function main() {
    const command = process.argv[2];
    const limit = parseInt(process.argv[3]) || 30;
    
    switch (command) {
        case 'analyze':
            await analyzeFoundingYearGaps();
            break;
            
        case 'research':
            await batchResearchFoundingYears(limit);
            break;
            
        case 'apply':
            await applyFoundingYearDiscoveries();
            break;
            
        case 'full':
            console.log('📅 RUNNING COMPLETE FOUNDING YEAR RESEARCH PIPELINE...\n');
            await analyzeFoundingYearGaps();
            await batchResearchFoundingYears(50);
            await applyFoundingYearDiscoveries();
            console.log('\n🎉 COMPLETE PIPELINE FINISHED!');
            break;
            
        default:
            console.log(`
📅 FOUNDING YEAR RESEARCH TOOL

Commands:
  analyze              - Analyze founding year gaps and research candidates
  research [limit]     - Research founding years from websites (default: 30)
  apply                - Apply discovered founding years to Notion
  full                 - Run complete research pipeline

Examples:
  node year_founded_research.js analyze
  node year_founded_research.js research 20
  node year_founded_research.js full
            `);
    }
}

if (require.main === module) {
    main().catch(console.error);
} 