const { Client } = require('@notionhq/client');
const fs = require('fs').promises;
const axios = require('axios');
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
        case 'email':
            return property.email || '';
        case 'phone_number':
            return property.phone_number || '';
        case 'select':
            return property.select?.name || '';
        case 'multi_select':
            return property.multi_select?.map(item => item.name) || [];
        case 'number':
            return property.number || null;
        case 'date':
            return property.date?.start || '';
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

// Parse markdown files for organization data
async function parseLocalData() {
    console.log('📁 Parsing local data sources...');
    
    const localData = new Map();
    
    try {
        // Parse all-organizations-masterlist.md
        const masterlistContent = await fs.readFile('all-organizations-masterlist.md', 'utf8');
        const orgLines = masterlistContent.split('\n').filter(line => 
            line.trim().match(/^\d+\.\s\*\*(.+?)\*\*/) && !line.includes('### ')
        );
        
        console.log(`   Found ${orgLines.length} organizations in masterlist`);
        
        for (const line of orgLines) {
            const match = line.match(/^\d+\.\s\*\*(.+?)\*\*(?:\s-\s(.+?))?(?:\s\*\(URL needed\)\*)?$/);
            if (match) {
                const name = match[1].trim();
                const url = match[2] && !match[2].includes('(URL needed)') ? match[2].trim() : null;
                
                localData.set(name, {
                    name,
                    website: url,
                    source: 'masterlist'
                });
            }
        }
        
        // Parse new_organizations.md if it exists
        try {
            const newOrgsContent = await fs.readFile('new_organizations.md', 'utf8');
            const orgBlocks = newOrgsContent.split('---').filter(block => 
                block.includes('**Organization Name:**')
            );
            
            console.log(`   Found ${orgBlocks.length} organizations in new_organizations.md`);
            
            for (const block of orgBlocks) {
                const nameMatch = block.match(/\*\*Organization Name:\*\*\s*(.+)/);
                const websiteMatch = block.match(/\*\*Website:\*\*\s*(.+)/);
                const emailMatch = block.match(/\*\*Email:\*\*\s*(.+)/);
                const phoneMatch = block.match(/\*\*Phone:\*\*\s*(.+)/);
                const linkedinMatch = block.match(/\*\*LinkedIn:\*\*\s*(.+)/);
                const cityMatch = block.match(/\*\*City\/Region:\*\*\s*(.+)/);
                const categoryMatch = block.match(/\*\*Category:\*\*\s*(.+)/);
                const yearMatch = block.match(/\*\*Year Founded:\*\*\s*(.+)/);
                const focusMatch = block.match(/\*\*AI Focus Areas:\*\*\s*(.+)/);
                const blurbMatch = block.match(/\*\*Short Blurb:\*\*\s*([\s\S]*?)(?=\*\*[A-Z]|\n\n|$)/);
                const notesMatch = block.match(/\*\*Focus & Notes:\*\*\s*([\s\S]*?)(?=\*\*[A-Z]|\n\n|$)/);
                
                if (nameMatch) {
                    const name = nameMatch[1].trim();
                    const existing = localData.get(name) || { name };
                    
                    localData.set(name, {
                        ...existing,
                        website: websiteMatch?.[1]?.trim() || existing.website,
                        email: emailMatch?.[1]?.trim(),
                        phone: phoneMatch?.[1]?.trim(),
                        linkedin: linkedinMatch?.[1]?.trim(),
                        city: cityMatch?.[1]?.trim(),
                        category: categoryMatch?.[1]?.trim(),
                        yearFounded: yearMatch?.[1]?.trim(),
                        aiFocus: focusMatch?.[1]?.trim(),
                        shortBlurb: blurbMatch?.[1]?.trim(),
                        focusNotes: notesMatch?.[1]?.trim(),
                        source: 'new_organizations'
                    });
                }
            }
        } catch (error) {
            console.log('   new_organizations.md not found - skipping');
        }
        
        // Parse organizations-already-added.md if it exists
        try {
            const addedOrgsContent = await fs.readFile('organizations-already-added.md', 'utf8');
            const addedOrgLines = addedOrgsContent.split('\n').filter(line => 
                line.trim().match(/^\d+\.\s/) || line.trim().match(/^-\s/)
            );
            
            console.log(`   Found ${addedOrgLines.length} organizations in organizations-already-added.md`);
            
            for (const line of addedOrgLines) {
                const match = line.match(/^[-\d.]+\s*(.+)$/);
                if (match) {
                    const name = match[1].trim().replace(/\*\*/g, '');
                    const existing = localData.get(name) || { name };
                    
                    localData.set(name, {
                        ...existing,
                        alreadyAdded: true,
                        source: existing.source || 'already_added'
                    });
                }
            }
        } catch (error) {
            console.log('   organizations-already-added.md not found - skipping');
        }
        
    } catch (error) {
        console.error('❌ Error parsing local data:', error.message);
    }
    
    console.log(`✅ Parsed ${localData.size} unique organizations from local sources`);
    return localData;
}

// Analyze data completeness and gaps
function analyzeDataCompleteness(org) {
    const fields = {
        name: getFieldValue(org.properties['Name']),
        website: getFieldValue(org.properties['Website']),
        email: getFieldValue(org.properties['Email']),
        phone: getFieldValue(org.properties['Phone']),
        linkedin: getFieldValue(org.properties['LinkedIn']),
        primaryContact: getFieldValue(org.properties['Primary Contact']),
        keyPeople: getFieldValue(org.properties['Key People']),
        city: getFieldValue(org.properties['City/Region']),
        bcRegion: getFieldValue(org.properties['BC Region']),
        category: getFieldValue(org.properties['Category']),
        size: getFieldValue(org.properties['Size']),
        yearFounded: getFieldValue(org.properties['Year Founded']),
        aiFocus: getFieldValue(org.properties['AI Focus Areas']),
        projects: getFieldValue(org.properties['Notable Projects']),
        shortBlurb: getFieldValue(org.properties['Short Blurb']),
        focusNotes: getFieldValue(org.properties['Focus & Notes']),
        logo: getFieldValue(org.properties['Logo']),
        dataSource: getFieldValue(org.properties['Data Source'])
    };
    
    const completeness = {
        core: 0,
        contact: 0,
        business: 0,
        ai: 0,
        total: 0
    };
    
    const maxScores = { core: 30, contact: 30, business: 25, ai: 15 };
    
    // Core fields (30 points)
    if (fields.name) completeness.core += 15;
    if (fields.website) completeness.core += 15;
    
    // Contact fields (30 points)
    if (fields.email) completeness.contact += 10;
    if (fields.phone) completeness.contact += 10;
    if (fields.linkedin) completeness.contact += 10;
    
    // Business fields (25 points)
    if (fields.city) completeness.business += 5;
    if (fields.category) completeness.business += 5;
    if (fields.yearFounded) completeness.business += 5;
    if (fields.shortBlurb) completeness.business += 5;
    if (fields.logo) completeness.business += 5;
    
    // AI specific fields (15 points)
    if (fields.aiFocus && fields.aiFocus.length > 0) completeness.ai += 10;
    if (fields.focusNotes) completeness.ai += 5;
    
    completeness.total = completeness.core + completeness.contact + completeness.business + completeness.ai;
    
    return {
        fields,
        completeness,
        missing: {
            core: fields.website ? [] : ['Website'],
            contact: [
                !fields.email ? 'Email' : null,
                !fields.phone ? 'Phone' : null,
                !fields.linkedin ? 'LinkedIn' : null
            ].filter(Boolean),
            business: [
                !fields.city ? 'City/Region' : null,
                !fields.category ? 'Category' : null,
                !fields.yearFounded ? 'Year Founded' : null,
                !fields.shortBlurb ? 'Short Blurb' : null,
                !fields.logo ? 'Logo' : null
            ].filter(Boolean),
            ai: [
                !fields.aiFocus || fields.aiFocus.length === 0 ? 'AI Focus Areas' : null,
                !fields.focusNotes ? 'Focus & Notes' : null
            ].filter(Boolean)
        }
    };
}

// Match Notion organization with local data
function matchWithLocalData(notionOrg, localData) {
    const notionName = getFieldValue(notionOrg.properties['Name']);
    
    // Try exact match first
    let localMatch = localData.get(notionName);
    
    // Try fuzzy matching if no exact match
    if (!localMatch) {
        for (const [localName, localOrg] of localData) {
            if (localName.toLowerCase().includes(notionName.toLowerCase()) ||
                notionName.toLowerCase().includes(localName.toLowerCase())) {
                localMatch = localOrg;
                break;
            }
        }
    }
    
    return localMatch || null;
}

// Generate update payload for Notion
function generateUpdatePayload(notionAnalysis, localData) {
    const updates = {};
    
    if (localData.website && !notionAnalysis.fields.website) {
        updates['Website'] = { url: localData.website };
    }
    
    if (localData.email && !notionAnalysis.fields.email) {
        updates['Email'] = { email: localData.email };
    }
    
    if (localData.phone && !notionAnalysis.fields.phone) {
        updates['Phone'] = { phone_number: localData.phone };
    }
    
    if (localData.linkedin && !notionAnalysis.fields.linkedin) {
        updates['LinkedIn'] = { url: localData.linkedin };
    }
    
    if (localData.city && !notionAnalysis.fields.city) {
        updates['City/Region'] = { rich_text: [{ text: { content: localData.city } }] };
    }
    
    if (localData.category && !notionAnalysis.fields.category) {
        updates['Category'] = { select: { name: localData.category } };
    }
    
    if (localData.yearFounded && !notionAnalysis.fields.yearFounded) {
        const year = parseInt(localData.yearFounded);
        if (!isNaN(year)) {
            updates['Year Founded'] = { number: year };
        }
    }
    
    if (localData.shortBlurb && !notionAnalysis.fields.shortBlurb) {
        updates['Short Blurb'] = { rich_text: [{ text: { content: localData.shortBlurb } }] };
    }
    
    if (localData.focusNotes && !notionAnalysis.fields.focusNotes) {
        updates['Focus & Notes'] = { rich_text: [{ text: { content: localData.focusNotes } }] };
    }
    
    return Object.keys(updates).length > 0 ? updates : null;
}

// Update organization in Notion
async function updateNotionOrganization(pageId, updates) {
    try {
        await notion.pages.update({
            page_id: pageId,
            properties: updates
        });
        return true;
    } catch (error) {
        console.error(`❌ Failed to update ${pageId}:`, error.message);
        return false;
    }
}

// Comprehensive analysis command
async function comprehensiveAnalysis() {
    console.log('\n🔍 COMPREHENSIVE DATABASE ANALYSIS\n');
    
    const [notionOrgs, localData] = await Promise.all([
        fetchAllOrganizations(),
        parseLocalData()
    ]);
    
    console.log('\n📊 ANALYZING DATA GAPS AND COMPLETENESS...\n');
    
    const analysis = {
        total: notionOrgs.length,
        withLocalMatch: 0,
        needingUpdates: 0,
        highCompleteness: 0,
        mediumCompleteness: 0,
        lowCompleteness: 0,
        gapsByCategory: {
            core: 0,
            contact: 0,
            business: 0,
            ai: 0
        },
        topGaps: new Map()
    };
    
    const organizationsNeedingUpdates = [];
    
    for (const org of notionOrgs) {
        const orgAnalysis = analyzeDataCompleteness(org);
        const localMatch = matchWithLocalData(org, localData);
        
        if (localMatch) {
            analysis.withLocalMatch++;
        }
        
        // Categorize by completeness
        if (orgAnalysis.completeness.total >= 80) {
            analysis.highCompleteness++;
        } else if (orgAnalysis.completeness.total >= 50) {
            analysis.mediumCompleteness++;
        } else {
            analysis.lowCompleteness++;
        }
        
        // Track gaps
        [...orgAnalysis.missing.core, ...orgAnalysis.missing.contact, 
         ...orgAnalysis.missing.business, ...orgAnalysis.missing.ai].forEach(gap => {
            analysis.topGaps.set(gap, (analysis.topGaps.get(gap) || 0) + 1);
        });
        
        // Check if needs updates from local data
        if (localMatch) {
            const updates = generateUpdatePayload(orgAnalysis, localMatch);
            if (updates) {
                analysis.needingUpdates++;
                organizationsNeedingUpdates.push({
                    id: org.id,
                    name: orgAnalysis.fields.name,
                    updates,
                    localData: localMatch
                });
            }
        }
    }
    
    // Display analysis results
    console.log('📈 COMPLETENESS DISTRIBUTION:');
    console.log(`   🎯 High (80%+): ${analysis.highCompleteness} organizations (${Math.round(analysis.highCompleteness/analysis.total*100)}%)`);
    console.log(`   📊 Medium (50-79%): ${analysis.mediumCompleteness} organizations (${Math.round(analysis.mediumCompleteness/analysis.total*100)}%)`);
    console.log(`   📉 Low (<50%): ${analysis.lowCompleteness} organizations (${Math.round(analysis.lowCompleteness/analysis.total*100)}%)`);
    
    console.log('\n🔗 LOCAL DATA MATCHING:');
    console.log(`   ✅ With local data: ${analysis.withLocalMatch} organizations`);
    console.log(`   📋 Available for updates: ${analysis.needingUpdates} organizations`);
    
    console.log('\n🎯 TOP MISSING FIELDS:');
    const sortedGaps = [...analysis.topGaps.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    sortedGaps.forEach(([field, count]) => {
        console.log(`   ${field}: ${count} organizations (${Math.round(count/analysis.total*100)}%)`);
    });
    
    // Save detailed analysis
    await fs.writeFile('master_sync_analysis.json', JSON.stringify({
        summary: analysis,
        organizationsNeedingUpdates,
        timestamp: new Date().toISOString()
    }, null, 2));
    
    console.log('\n✅ Analysis complete! Saved to master_sync_analysis.json');
    console.log(`\n🚀 Ready to update ${analysis.needingUpdates} organizations with local data!`);
}

// Batch update command
async function batchUpdateFromLocal(limit = 50) {
    console.log(`\n🔄 BATCH UPDATING UP TO ${limit} ORGANIZATIONS...\n`);
    
    try {
        const analysisFile = await fs.readFile('master_sync_analysis.json', 'utf8');
        const analysis = JSON.parse(analysisFile);
        
        const toUpdate = analysis.organizationsNeedingUpdates.slice(0, limit);
        console.log(`🎯 Processing ${toUpdate.length} organizations for updates...`);
        
        let successful = 0;
        let failed = 0;
        
        for (const org of toUpdate) {
            console.log(`\n📝 Updating: ${org.name}`);
            console.log(`   Fields: ${Object.keys(org.updates).join(', ')}`);
            
            const success = await updateNotionOrganization(org.id, org.updates);
            
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
        
        console.log(`\n🎉 BATCH UPDATE COMPLETE!`);
        console.log(`   ✅ Successful: ${successful} organizations`);
        console.log(`   ❌ Failed: ${failed} organizations`);
        console.log(`   📊 Success rate: ${Math.round(successful/(successful+failed)*100)}%`);
        
    } catch (error) {
        console.error('❌ Error during batch update:', error.message);
        console.log('\n💡 Run "analyze" command first to generate analysis data');
    }
}

// Enhanced web research for missing fields
async function enhanceWithWebResearch(limit = 20) {
    console.log(`\n🔍 ENHANCING ${limit} ORGANIZATIONS WITH WEB RESEARCH...\n`);
    
    const notionOrgs = await fetchAllOrganizations();
    
    // Find organizations with websites but missing key data
    const candidates = notionOrgs
        .map(org => ({
            id: org.id,
            ...analyzeDataCompleteness(org)
        }))
        .filter(org => 
            org.fields.website && 
            (org.missing.contact.length > 0 || org.missing.business.length > 0)
        )
        .sort((a, b) => b.completeness.total - a.completeness.total)
        .slice(0, limit);
    
    console.log(`🎯 Found ${candidates.length} candidates for web research`);
    
    const enhancements = [];
    
    for (const org of candidates) {
        console.log(`\n🔍 Researching: ${org.fields.name}`);
        console.log(`   Website: ${org.fields.website}`);
        console.log(`   Missing: ${[...org.missing.contact, ...org.missing.business].join(', ')}`);
        
        try {
            const response = await axios.get(org.fields.website, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                }
            });
            
            const $ = cheerio.load(response.data);
            const enhancement = { id: org.id, name: org.fields.name, updates: {} };
            
            // Extract email
            if (org.missing.contact.includes('Email')) {
                const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
                const emails = response.data.match(emailRegex) || [];
                const contactEmails = emails.filter(email => 
                    email.includes('contact') || email.includes('info') || 
                    email.includes('hello') || email.includes('support')
                );
                
                if (contactEmails.length > 0) {
                    enhancement.updates['Email'] = { email: contactEmails[0] };
                    console.log(`   📧 Found email: ${contactEmails[0]}`);
                }
            }
            
            // Extract phone
            if (org.missing.contact.includes('Phone')) {
                const phoneRegex = /(\+?1?[-.\s]?)?(\([0-9]{3}\)|[0-9]{3})[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
                const phones = response.data.match(phoneRegex);
                
                if (phones && phones.length > 0) {
                    enhancement.updates['Phone'] = { phone_number: phones[0] };
                    console.log(`   📞 Found phone: ${phones[0]}`);
                }
            }
            
            // Extract LinkedIn
            if (org.missing.contact.includes('LinkedIn')) {
                const linkedinLinks = $('a[href*="linkedin.com/company/"]').toArray();
                if (linkedinLinks.length > 0) {
                    const linkedinUrl = $(linkedinLinks[0]).attr('href');
                    enhancement.updates['LinkedIn'] = { url: linkedinUrl };
                    console.log(`   🔗 Found LinkedIn: ${linkedinUrl}`);
                }
            }
            
            // Extract description for Short Blurb
            if (org.missing.business.includes('Short Blurb')) {
                const metaDesc = $('meta[name="description"]').attr('content');
                const ogDesc = $('meta[property="og:description"]').attr('content');
                const desc = metaDesc || ogDesc;
                
                if (desc && desc.length > 20 && desc.length < 500) {
                    enhancement.updates['Short Blurb'] = { 
                        rich_text: [{ text: { content: desc.trim() } }] 
                    };
                    console.log(`   📝 Found description: ${desc.substring(0, 100)}...`);
                }
            }
            
            if (Object.keys(enhancement.updates).length > 0) {
                enhancements.push(enhancement);
                console.log(`   ✅ Found ${Object.keys(enhancement.updates).length} enhancements`);
            } else {
                console.log(`   ℹ️ No new data found`);
            }
            
        } catch (error) {
            console.log(`   ❌ Error researching ${org.fields.name}: ${error.message}`);
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Save enhancements
    await fs.writeFile('web_research_enhancements.json', JSON.stringify(enhancements, null, 2));
    
    console.log(`\n🎉 WEB RESEARCH COMPLETE!`);
    console.log(`   🔍 Researched: ${candidates.length} organizations`);
    console.log(`   ✅ Enhanced: ${enhancements.length} organizations`);
    console.log(`   📁 Saved: web_research_enhancements.json`);
    
    return enhancements;
}

// Apply web research enhancements
async function applyWebEnhancements() {
    console.log('\n🚀 APPLYING WEB RESEARCH ENHANCEMENTS...\n');
    
    try {
        const enhancementsFile = await fs.readFile('web_research_enhancements.json', 'utf8');
        const enhancements = JSON.parse(enhancementsFile);
        
        console.log(`📋 Applying ${enhancements.length} enhancements...`);
        
        let successful = 0;
        let failed = 0;
        
        for (const enhancement of enhancements) {
            console.log(`\n📝 Updating: ${enhancement.name}`);
            console.log(`   Fields: ${Object.keys(enhancement.updates).join(', ')}`);
            
            const success = await updateNotionOrganization(enhancement.id, enhancement.updates);
            
            if (success) {
                successful++;
                console.log(`   ✅ Applied successfully`);
            } else {
                failed++;
                console.log(`   ❌ Apply failed`);
            }
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        console.log(`\n🎉 ENHANCEMENT APPLICATION COMPLETE!`);
        console.log(`   ✅ Successful: ${successful} organizations`);
        console.log(`   ❌ Failed: ${failed} organizations`);
        console.log(`   📊 Success rate: ${Math.round(successful/(successful+failed)*100)}%`);
        
    } catch (error) {
        console.error('❌ Error applying enhancements:', error.message);
        console.log('\n💡 Run "research" command first to generate enhancement data');
    }
}

// Main CLI
async function main() {
    const command = process.argv[2];
    const limit = parseInt(process.argv[3]) || 50;
    
    switch (command) {
        case 'analyze':
            await comprehensiveAnalysis();
            break;
            
        case 'update':
            await batchUpdateFromLocal(limit);
            break;
            
        case 'research':
            await enhanceWithWebResearch(limit);
            break;
            
        case 'apply':
            await applyWebEnhancements();
            break;
            
        case 'full':
            console.log('🚀 RUNNING FULL DATA SYNCHRONIZATION PIPELINE...\n');
            await comprehensiveAnalysis();
            await batchUpdateFromLocal(100);
            await enhanceWithWebResearch(30);
            await applyWebEnhancements();
            console.log('\n🎉 FULL PIPELINE COMPLETE!');
            break;
            
        default:
            console.log(`
🔄 MASTER DATA SYNCHRONIZATION TOOL

Commands:
  analyze              - Comprehensive analysis of data gaps
  update [limit]       - Update Notion with local data (default: 50)
  research [limit]     - Web research for missing data (default: 20)  
  apply                - Apply web research enhancements
  full                 - Run complete synchronization pipeline

Examples:
  node master_data_sync.js analyze
  node master_data_sync.js update 25
  node master_data_sync.js research 15
  node master_data_sync.js full
            `);
    }
}

if (require.main === module) {
    main().catch(console.error);
} 