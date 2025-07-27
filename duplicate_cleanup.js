const { Client } = require('@notionhq/client');
const fs = require('fs').promises;

// Notion API configuration
const NOTION_TOKEN = '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';
const DATABASE_ID = '1f0c6f799a3381bd8332ca0235c24655';

const notion = new Client({
    auth: NOTION_TOKEN
});

// Fetch all organizations from Notion database
async function fetchAllOrganizations() {
    let allOrganizations = [];
    let cursor = undefined;
    
    try {
        do {
            const response = await notion.databases.query({
                database_id: DATABASE_ID,
                start_cursor: cursor,
                page_size: 100
            });
            
            allOrganizations = allOrganizations.concat(response.results);
            cursor = response.next_cursor;
        } while (cursor);
        
        console.log(`✅ Fetched ${allOrganizations.length} organizations from Notion database`);
        return allOrganizations;
    } catch (error) {
        console.error('❌ Error fetching organizations:', error);
        throw error;
    }
}

// Archive (delete) a page in Notion
async function archivePage(pageId) {
    try {
        await notion.pages.update({
            page_id: pageId,
            archived: true
        });
        return true;
    } catch (error) {
        console.error(`❌ Error archiving page ${pageId}:`, error);
        return false;
    }
}

// Calculate completeness score for an organization
function calculateCompleteness(entry) {
    const properties = entry.properties;
    let filledFields = 0;
    let totalFields = 0;
    
    // Core fields to check
    const fieldsToCheck = [
        'Name', 'Website', 'LinkedIn', 'Email', 'Phone', 'Primary Contact',
        'Key People', 'City/Region', 'BC Region', 'Category', 'Size',
        'Year Founded', 'AI Focus Areas', 'Notable Projects', 'Short Blurb',
        'Focus & Notes', 'Status', 'Relationship', 'Data Source'
    ];
    
    fieldsToCheck.forEach(field => {
        totalFields++;
        const prop = properties[field];
        
        if (prop) {
            switch (prop.type) {
                case 'title':
                    if (prop.title && prop.title.length > 0 && prop.title[0].plain_text) {
                        filledFields++;
                    }
                    break;
                case 'rich_text':
                    if (prop.rich_text && prop.rich_text.length > 0 && prop.rich_text[0].plain_text) {
                        filledFields++;
                    }
                    break;
                case 'url':
                    if (prop.url) {
                        filledFields++;
                    }
                    break;
                case 'email':
                    if (prop.email) {
                        filledFields++;
                    }
                    break;
                case 'phone_number':
                    if (prop.phone_number) {
                        filledFields++;
                    }
                    break;
                case 'select':
                    if (prop.select && prop.select.name) {
                        filledFields++;
                    }
                    break;
                case 'multi_select':
                    if (prop.multi_select && prop.multi_select.length > 0) {
                        filledFields++;
                    }
                    break;
                case 'number':
                    if (prop.number !== null) {
                        filledFields++;
                    }
                    break;
                case 'date':
                    if (prop.date) {
                        filledFields++;
                    }
                    break;
            }
        }
    });
    
    return Math.round((filledFields / totalFields) * 100);
}

// Find and analyze duplicates
async function findAndAnalyzeDuplicates() {
    console.log('🔍 Fetching all organizations and analyzing duplicates...\n');
    
    const organizations = await fetchAllOrganizations();
    
    // Group by name (case-insensitive)
    const nameGroups = {};
    
    organizations.forEach(org => {
        const name = org.properties.Name?.title?.[0]?.plain_text?.trim();
        if (name) {
            const normalizedName = name.toLowerCase();
            if (!nameGroups[normalizedName]) {
                nameGroups[normalizedName] = [];
            }
            nameGroups[normalizedName].push({
                id: org.id,
                name: name,
                completeness: calculateCompleteness(org),
                created: org.created_time,
                lastEdited: org.last_edited_time,
                website: org.properties.Website?.url || '',
                category: org.properties.Category?.select?.name || '',
                region: org.properties['BC Region']?.select?.name || '',
                dataSource: org.properties['Data Source']?.select?.name || '',
                keyPeople: org.properties['Key People']?.rich_text?.[0]?.plain_text || '',
                shortBlurb: org.properties['Short Blurb']?.rich_text?.[0]?.plain_text || ''
            });
        }
    });
    
    // Find duplicates
    const duplicates = [];
    const uniqueOrgs = [];
    
    Object.entries(nameGroups).forEach(([normalizedName, orgs]) => {
        if (orgs.length > 1) {
            // Sort by completeness (desc), then by last edited (desc)
            orgs.sort((a, b) => {
                if (b.completeness !== a.completeness) {
                    return b.completeness - a.completeness;
                }
                return new Date(b.lastEdited) - new Date(a.lastEdited);
            });
            
            duplicates.push({
                name: orgs[0].name,
                count: orgs.length,
                entries: orgs,
                keepEntry: orgs[0], // Most complete/recent
                deleteEntries: orgs.slice(1) // Rest to delete
            });
        } else {
            uniqueOrgs.push(orgs[0]);
        }
    });
    
    console.log(`📊 Analysis Results:`);
    console.log(`   Total organizations: ${organizations.length}`);
    console.log(`   Unique organizations: ${Object.keys(nameGroups).length}`);
    console.log(`   Organizations with duplicates: ${duplicates.length}`);
    console.log(`   Total duplicate entries to remove: ${duplicates.reduce((sum, dup) => sum + dup.deleteEntries.length, 0)}\n`);
    
    return { duplicates, uniqueOrgs, totalOrgs: organizations.length };
}

// Execute cleanup
async function executeCleanup(dryRun = true) {
    const analysis = await findAndAnalyzeDuplicates();
    const { duplicates } = analysis;
    
    if (dryRun) {
        console.log('🔍 DRY RUN - No actual deletions will be performed\n');
    } else {
        console.log('⚠️  LIVE RUN - Duplicates will be archived!\n');
    }
    
    let deletedCount = 0;
    let errors = [];
    
    for (const duplicate of duplicates) {
        console.log(`\n📝 Processing: ${duplicate.name} (${duplicate.count} duplicates)`);
        console.log(`   Keeping: ID ${duplicate.keepEntry.id.slice(-8)} (${duplicate.keepEntry.completeness}% complete)`);
        
        for (const entry of duplicate.deleteEntries) {
            console.log(`   ${dryRun ? 'Would delete' : 'Deleting'}: ID ${entry.id.slice(-8)} (${entry.completeness}% complete)`);
            
            if (!dryRun) {
                const success = await archivePage(entry.id);
                if (success) {
                    deletedCount++;
                } else {
                    errors.push(`Failed to delete ${entry.name} (ID: ${entry.id})`);
                }
                
                // Add small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
    }
    
    if (!dryRun) {
        console.log(`\n✅ Cleanup completed!`);
        console.log(`   Archived: ${deletedCount} duplicate entries`);
        console.log(`   Errors: ${errors.length}`);
        
        if (errors.length > 0) {
            console.log('\n❌ Errors encountered:');
            errors.forEach(error => console.log(`   ${error}`));
        }
    } else {
        console.log(`\n📋 Dry run summary:`);
        console.log(`   Would archive: ${duplicates.reduce((sum, dup) => sum + dup.deleteEntries.length, 0)} entries`);
        console.log(`   Would keep: ${duplicates.length} best entries`);
    }
    
    return analysis;
}

// Generate updated organization list for masterlist
async function generateCleanOrganizationList() {
    console.log('📋 Generating clean organization list...\n');
    
    const organizations = await fetchAllOrganizations();
    
    // Filter out archived entries and group by name
    const activeOrgs = organizations.filter(org => !org.archived);
    const nameGroups = {};
    
    activeOrgs.forEach(org => {
        const name = org.properties.Name?.title?.[0]?.plain_text?.trim();
        if (name) {
            const normalizedName = name.toLowerCase();
            if (!nameGroups[normalizedName]) {
                nameGroups[normalizedName] = [];
            }
            nameGroups[normalizedName].push({
                id: org.id,
                name: name,
                website: org.properties.Website?.url || '',
                completeness: calculateCompleteness(org),
                lastEdited: org.last_edited_time
            });
        }
    });
    
    // Get best entry for each unique name
    const cleanList = [];
    Object.values(nameGroups).forEach(orgs => {
        if (orgs.length > 1) {
            // Sort by completeness, then by last edited
            orgs.sort((a, b) => {
                if (b.completeness !== a.completeness) {
                    return b.completeness - a.completeness;
                }
                return new Date(b.lastEdited) - new Date(a.lastEdited);
            });
        }
        cleanList.push(orgs[0]);
    });
    
    // Sort alphabetically
    cleanList.sort((a, b) => a.name.localeCompare(b.name));
    
    return cleanList;
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    try {
        switch (command) {
            case 'analyze':
                await findAndAnalyzeDuplicates();
                break;
            case 'cleanup-dry':
                await executeCleanup(true);
                break;
            case 'cleanup-live':
                console.log('⚠️  Are you sure you want to permanently archive duplicate entries?');
                console.log('⚠️  This action cannot be undone!');
                console.log('⚠️  Run "cleanup-dry" first to preview changes.');
                console.log('⚠️  Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');
                
                await new Promise(resolve => setTimeout(resolve, 5000));
                await executeCleanup(false);
                break;
            case 'list':
                const cleanList = await generateCleanOrganizationList();
                console.log(`📋 Clean organization list (${cleanList.length} entries):\n`);
                cleanList.forEach((org, index) => {
                    const website = org.website ? ` - ${org.website}` : '';
                    console.log(`${index + 1}. ${org.name}${website}`);
                });
                break;
            default:
                console.log('Usage:');
                console.log('  node duplicate_cleanup.js analyze      - Analyze duplicates');
                console.log('  node duplicate_cleanup.js cleanup-dry  - Preview cleanup (dry run)');
                console.log('  node duplicate_cleanup.js cleanup-live - Execute cleanup (PERMANENT)');
                console.log('  node duplicate_cleanup.js list         - Generate clean org list');
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    fetchAllOrganizations,
    findAndAnalyzeDuplicates,
    executeCleanup,
    generateCleanOrganizationList
}; 