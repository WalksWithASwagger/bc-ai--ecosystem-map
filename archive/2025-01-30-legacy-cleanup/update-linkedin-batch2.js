require('dotenv').config();
const { Client } = require('@notionhq/client');
const fs = require('fs');

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DATABASE_ID;

async function findAndUpdateLinkedInProfiles() {
    const updates = [
        { name: "Dapper Labs", linkedin_url: "https://ca.linkedin.com/company/dapper-labs" },
        { name: "Kardium", linkedin_url: "https://ca.linkedin.com/company/kardium-inc." },
        { name: "Felix", linkedin_url: "https://ca.linkedin.com/company/felixhealthca" },
        { name: "Big Whale Labs", linkedin_url: "https://www.linkedin.com/company/big-whale-labs" },
        { name: "Leasey.AI", linkedin_url: "https://ca.linkedin.com/company/leaseyai" },
        { name: "Athennian", linkedin_url: "https://ca.linkedin.com/company/athennian" },
        { name: "Riipen", linkedin_url: "https://ca.linkedin.com/company/riipen-networks-inc" },
        { name: "Edvisor.io", linkedin_url: "https://www.linkedin.com/company/edvisor-io" },
        { name: "Keywords Studios Vancouver", linkedin_url: "https://ca.linkedin.com/company/keywordsstudios" }
    ];

    console.log(`🔍 Finding and updating ${updates.length} organizations with LinkedIn URLs...`);
    
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
            
            // Update the LinkedIn URL
            await notion.pages.update({
                page_id: pageId,
                properties: {
                    'LinkedIn': {
                        url: update.linkedin_url
                    }
                }
            });

            console.log(`✅ Updated ${foundName}: ${update.linkedin_url}`);
            successful++;
            results.push({ organization: foundName, status: 'success', linkedin_url: update.linkedin_url });
            
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
    const reportPath = `reports/${timestamp}_linkedin-batch2-update.md`;
    
    let report = `# LinkedIn Batch 2 Update Report - ${timestamp}\n\n`;
    report += `## Summary\n`;
    report += `- Total Updates: ${updates.length}\n`;
    report += `- Successful: ${successful}\n`;
    report += `- Failed: ${failed}\n`;
    report += `- Success Rate: ${((successful / updates.length) * 100).toFixed(1)}%\n\n`;
    
    report += `## Successful Updates\n`;
    results.filter(r => r.status === 'success').forEach(r => {
        report += `- **${r.organization}**: ${r.linkedin_url}\n`;
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

findAndUpdateLinkedInProfiles().catch(console.error);