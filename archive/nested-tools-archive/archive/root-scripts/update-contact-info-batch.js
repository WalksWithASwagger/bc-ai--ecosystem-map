require('dotenv').config();
const { Client } = require('@notionhq/client');
const fs = require('fs');

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DATABASE_ID;

async function updateContactInfo() {
    const updates = [
        { 
            name: "Dapper Labs", 
            email: "hello@dapperlabs.com",
            phone: null
        },
        { 
            name: "Kardium", 
            email: null,
            phone: "+1.604.248.8891"
        },
        { 
            name: "Felix", 
            email: "hello@felixforyou.ca",
            phone: "(604) 552-6941"
        },
        { 
            name: "Athennian", 
            email: "sales@athennian.com",
            phone: "+1-888-439-2016"
        },
        { 
            name: "Riipen", 
            email: "help@riipen.com",
            phone: "1-833-374-4736"
        },
        { 
            name: "Edvisor.io", 
            email: "contact@edvisor.io",
            phone: null
        }
    ];

    console.log(`🔍 Finding and updating contact information for ${updates.length} organizations...`);
    
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
                            contains: update.name.split(' ')[0]
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
            
            // Prepare properties to update
            const properties = {};
            
            if (update.email) {
                properties['Email'] = {
                    email: update.email
                };
            }
            
            if (update.phone) {
                properties['Phone'] = {
                    phone_number: update.phone
                };
            }

            // Update the contact information
            await notion.pages.update({
                page_id: pageId,
                properties: properties
            });

            const updateInfo = [];
            if (update.email) updateInfo.push(`Email: ${update.email}`);
            if (update.phone) updateInfo.push(`Phone: ${update.phone}`);
            
            console.log(`✅ Updated ${foundName}: ${updateInfo.join(', ')}`);
            successful++;
            results.push({ 
                organization: foundName, 
                status: 'success', 
                email: update.email, 
                phone: update.phone 
            });
            
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
    const reportPath = `reports/${timestamp}_contact-info-batch-update.md`;
    
    let report = `# Contact Information Batch Update Report - ${timestamp}\n\n`;
    report += `## Summary\n`;
    report += `- Total Updates: ${updates.length}\n`;
    report += `- Successful: ${successful}\n`;
    report += `- Failed: ${failed}\n`;
    report += `- Success Rate: ${((successful / updates.length) * 100).toFixed(1)}%\n\n`;
    
    report += `## Successful Updates\n`;
    results.filter(r => r.status === 'success').forEach(r => {
        const contactInfo = [];
        if (r.email) contactInfo.push(`Email: ${r.email}`);
        if (r.phone) contactInfo.push(`Phone: ${r.phone}`);
        report += `- **${r.organization}**: ${contactInfo.join(', ')}\n`;
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

updateContactInfo().catch(console.error);