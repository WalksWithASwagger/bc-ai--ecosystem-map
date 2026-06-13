require('dotenv').config();
const { Client } = require('@notionhq/client');
const fs = require('fs');

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DATABASE_ID;

async function findAndUpdateWebsites() {
    const updates = [
        { name: "Dapper Labs", website: "https://www.dapperlabs.com/" },
        { name: "Kardium", website: "https://kardium.com/" },
        { name: "Felix", website: "https://www.felixforyou.ca/" },
        { name: "Big Whale Labs", website: "https://bigwhalelabs.com/" },
        { name: "Leasey.AI", website: "https://www.leasey.ai/" },
        { name: "Toonie", website: "https://toonieholding.com/" },
        { name: "Athennian", website: "https://www.athennian.com/" },
        { name: "MindfulGarden", website: "https://mindfulgarden.com/" },
        { name: "Riipen", website: "https://www.riipen.com/" },
        { name: "Edvisor.io", website: "https://www.edvisor.io/" },
        { name: "Keywords Studios Vancouver", website: "https://www.keywordsstudios.com/" }
    ];

    console.log(`🔍 Finding and updating ${updates.length} organizations with website URLs...`);
    
    let successful = 0;
    let failed = 0;
    const results = [];

    for (const update of updates) {
        try {
            // Search for organization by exact name first
            let response = await notion.databases.query({
                database_id: databaseId,
                filter: {
                    property: 'Name',
                    title: {
                        equals: update.name
                    }
                }
            });

            // If not found, try partial match
            if (response.results.length === 0) {
                response = await notion.databases.query({
                    database_id: databaseId,
                    filter: {
                        property: 'Name',
                        title: {
                            contains: update.name.split(' ')[0] // Search by first word
                        }
                    }
                });
            }

            if (response.results.length === 0) {
                console.log(`❌ Organization not found: ${update.name}`);
                failed++;
                results.push({ organization: update.name, status: 'not_found', error: 'Organization not found in database' });
                continue;
            }

            const pageId = response.results[0].id;
            const foundName = response.results[0].properties.Name.title[0]?.plain_text || 'Unknown';
            
            // Update the Website URL
            await notion.pages.update({
                page_id: pageId,
                properties: {
                    'Website': {
                        url: update.website
                    }
                }
            });

            console.log(`✅ Updated ${foundName}: ${update.website}`);
            successful++;
            results.push({ organization: foundName, status: 'success', website: update.website });
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
            
        } catch (error) {
            console.error(`❌ Failed to update ${update.name}:`, error.message);
            failed++;
            results.push({ organization: update.name, status: 'error', error: error.message });
        }
    }

    console.log(`\n📊 Update Results:`);
    console.log(`   ✅ Successful: ${successful}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📈 Success Rate: ${((successful / updates.length) * 100).toFixed(1)}%`);

    // Write results to file
    const timestamp = new Date().toISOString().split('T')[0];
    const reportPath = `reports/${timestamp}_website-batch-update.md`;
    
    let report = `# Website Batch Update Report - ${timestamp}\n\n`;
    report += `## Summary\n`;
    report += `- Total Updates: ${updates.length}\n`;
    report += `- Successful: ${successful}\n`;
    report += `- Failed: ${failed}\n`;
    report += `- Success Rate: ${((successful / updates.length) * 100).toFixed(1)}%\n\n`;
    
    report += `## Successful Updates\n`;
    results.filter(r => r.status === 'success').forEach(r => {
        report += `- **${r.organization}**: ${r.website}\n`;
    });
    
    if (results.filter(r => r.status !== 'success').length > 0) {
        report += `\n## Failed Updates\n`;
        results.filter(r => r.status !== 'success').forEach(r => {
            report += `- **${r.organization}**: ${r.error}\n`;
        });
    }
    
    fs.writeFileSync(reportPath, report);
    console.log(`📝 Report written to: ${reportPath}`);
}

findAndUpdateWebsites().catch(console.error);