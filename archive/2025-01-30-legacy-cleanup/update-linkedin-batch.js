require('dotenv').config();
const { Client } = require('@notionhq/client');
const fs = require('fs');

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DATABASE_ID;

async function findAndUpdateLinkedInProfiles() {
    const updates = [
        { name: "1QBit", linkedin_url: "https://ca.linkedin.com/company/1qbit" },
        { name: "AbCellera", linkedin_url: "https://ca.linkedin.com/company/abcellera" },
        { name: "D-Wave Systems", linkedin_url: "https://ca.linkedin.com/company/d-wave-quantum" },
        { name: "Klue", linkedin_url: "https://www.linkedin.com/company/klue/" },
        { name: "Lumen5", linkedin_url: "https://ca.linkedin.com/company/lumen5" },
        { name: "Two Hat Security", linkedin_url: "https://www.linkedin.com/company/two-hat-security/" },
        { name: "Certn", linkedin_url: "https://ca.linkedin.com/company/certn" },
        { name: "Photonic Inc", linkedin_url: "https://ca.linkedin.com/company/teamphotonic" },
        { name: "Integrated Roadways", linkedin_url: "https://www.linkedin.com/company/integrated-roadways" },
        { name: "Axiom Zen", linkedin_url: "https://ca.linkedin.com/company/axiom-zen" },
        { name: "Archiact", linkedin_url: "https://www.linkedin.com/company/archiact-interactive" },
        { name: "Cymax Group Technologies", linkedin_url: "https://ca.linkedin.com/company/cymaxgroup" },
        { name: "VanHack", linkedin_url: "https://www.linkedin.com/company/vanhack" },
        { name: "Thinkific", linkedin_url: "https://www.linkedin.com/company/thinkific/" },
        { name: "Clio", linkedin_url: "https://ca.linkedin.com/company/clio---cloud-based-legal-technology" }
    ];

    console.log(`🔍 Finding and updating ${updates.length} organizations with LinkedIn URLs...`);
    
    let successful = 0;
    let failed = 0;
    const results = [];

    for (const update of updates) {
        try {
            // Search for organization by name
            const response = await notion.databases.query({
                database_id: databaseId,
                filter: {
                    property: 'Name',
                    title: {
                        equals: update.name
                    }
                }
            });

            if (response.results.length === 0) {
                // Try partial match
                const partialResponse = await notion.databases.query({
                    database_id: databaseId,
                    filter: {
                        property: 'Name',
                        title: {
                            contains: update.name
                        }
                    }
                });

                if (partialResponse.results.length === 0) {
                    console.log(`❌ Organization not found: ${update.name}`);
                    failed++;
                    results.push({ organization: update.name, status: 'not_found', error: 'Organization not found in database' });
                    continue;
                }
                
                response.results = partialResponse.results;
            }

            const pageId = response.results[0].id;
            
            // Update the LinkedIn URL
            await notion.pages.update({
                page_id: pageId,
                properties: {
                    'LinkedIn': {
                        url: update.linkedin_url
                    }
                }
            });

            console.log(`✅ Updated ${update.name}: ${update.linkedin_url}`);
            successful++;
            results.push({ organization: update.name, status: 'success', linkedin_url: update.linkedin_url });
            
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
    const reportPath = `reports/${timestamp}_linkedin-batch-update.md`;
    
    let report = `# LinkedIn Batch Update Report - ${timestamp}\n\n`;
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