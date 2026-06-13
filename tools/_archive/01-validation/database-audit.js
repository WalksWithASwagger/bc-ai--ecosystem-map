const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DATABASE_ID;

async function auditDatabase() {
    console.log('🔍 Starting Database Audit...\n');
    
    // Patterns that might indicate non-organization entries
    const suspiciousPatterns = [
        // Common field/property names
        /^(name|email|website|phone|address|description|category|status|type|date|year|funding|location|city|province)$/i,
        // Single words that are likely properties
        /^(active|inactive|pending|confirmed|verified|new|old|updated|created|modified)$/i,
        // Common data type indicators
        /^(string|text|number|boolean|array|object|null|undefined)$/i,
        // Technical terms that might be fields
        /^(id|uuid|key|value|field|property|attribute|column|row|table|database)$/i,
        // URLs or emails as names
        /^(https?:\/\/|www\.|@)/i,
        // Just numbers or single characters
        /^[\d\s]+$/,
        /^[a-zA-Z]$/
    ];
    
    let allResults = [];
    let hasMore = true;
    let startCursor = undefined;
    
    // Fetch all entries
    while (hasMore) {
        const response = await notion.databases.query({
            database_id: databaseId,
            start_cursor: startCursor,
            page_size: 100
        });
        
        allResults = allResults.concat(response.results);
        hasMore = response.has_more;
        startCursor = response.next_cursor;
    }
    
    console.log(`Total entries in database: ${allResults.length}\n`);
    
    // Analyze entries
    const suspiciousEntries = [];
    const veryShortNames = [];
    const noWebsiteEntries = [];
    const duplicateNames = new Map();
    
    allResults.forEach(page => {
        const name = page.properties.Name?.title[0]?.plain_text || '';
        const website = page.properties.Website?.url;
        const id = page.id;
        
        // Check for suspicious patterns
        const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(name));
        if (isSuspicious) {
            suspiciousEntries.push({ id, name, website });
        }
        
        // Check for very short names (likely errors)
        if (name.length <= 3 && name.length > 0) {
            veryShortNames.push({ id, name, website });
        }
        
        // Track duplicates
        if (name) {
            if (duplicateNames.has(name)) {
                duplicateNames.get(name).push({ id, website });
            } else {
                duplicateNames.set(name, [{ id, website }]);
            }
        }
        
        // Check for entries without websites (might be incomplete)
        if (!website && name) {
            noWebsiteEntries.push({ id, name });
        }
    });
    
    // Report findings
    console.log('🚨 AUDIT FINDINGS:\n');
    
    console.log('1. SUSPICIOUS ENTRIES (likely fields/properties):');
    console.log(`   Found: ${suspiciousEntries.length} entries`);
    if (suspiciousEntries.length > 0) {
        console.log('   Examples:');
        suspiciousEntries.slice(0, 10).forEach(entry => {
            console.log(`   - "${entry.name}" (ID: ${entry.id})`);
        });
        if (suspiciousEntries.length > 10) {
            console.log(`   ... and ${suspiciousEntries.length - 10} more`);
        }
    }
    
    console.log('\n2. VERY SHORT NAMES (≤3 characters):');
    console.log(`   Found: ${veryShortNames.length} entries`);
    if (veryShortNames.length > 0) {
        veryShortNames.forEach(entry => {
            console.log(`   - "${entry.name}" (ID: ${entry.id})`);
        });
    }
    
    console.log('\n3. DUPLICATE ENTRIES:');
    const duplicates = Array.from(duplicateNames.entries()).filter(([_, entries]) => entries.length > 1);
    console.log(`   Found: ${duplicates.length} duplicate names`);
    if (duplicates.length > 0) {
        duplicates.slice(0, 5).forEach(([name, entries]) => {
            console.log(`   - "${name}" appears ${entries.length} times`);
        });
        if (duplicates.length > 5) {
            console.log(`   ... and ${duplicates.length - 5} more duplicate sets`);
        }
    }
    
    console.log('\n4. ENTRIES WITHOUT WEBSITES:');
    console.log(`   Found: ${noWebsiteEntries.length} entries (${((noWebsiteEntries.length/allResults.length)*100).toFixed(1)}% of total)`);
    
    // Additional analysis - check for entries that look like test data
    const testDataPatterns = [
        /test/i,
        /sample/i,
        /example/i,
        /demo/i,
        /temp/i,
        /delete/i
    ];
    
    const testEntries = allResults.filter(page => {
        const name = page.properties.Name?.title[0]?.plain_text || '';
        return testDataPatterns.some(pattern => pattern.test(name));
    });
    
    console.log('\n5. POSSIBLE TEST DATA:');
    console.log(`   Found: ${testEntries.length} entries`);
    if (testEntries.length > 0) {
        testEntries.forEach(page => {
            const name = page.properties.Name?.title[0]?.plain_text || '';
            console.log(`   - "${name}" (ID: ${page.id})`);
        });
    }
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`   Total problematic entries: ${suspiciousEntries.length + veryShortNames.length + testEntries.length}`);
    console.log(`   Percentage of database: ${(((suspiciousEntries.length + veryShortNames.length + testEntries.length)/allResults.length)*100).toFixed(1)}%`);
    
    // Save detailed report
    const report = {
        timestamp: new Date().toISOString(),
        total: allResults.length,
        suspicious: suspiciousEntries,
        veryShort: veryShortNames,
        duplicates: duplicates.map(([name, entries]) => ({ name, count: entries.length, entries })),
        noWebsite: noWebsiteEntries,
        testData: testEntries.map(page => ({
            id: page.id,
            name: page.properties.Name?.title[0]?.plain_text || ''
        }))
    };
    
    require('fs').writeFileSync('audit-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to: audit-report.json');
}

// Run the audit
auditDatabase().catch(console.error);