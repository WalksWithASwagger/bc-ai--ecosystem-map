const { Client } = require('@notionhq/client');
const fs = require('fs');

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DATABASE_ID;

async function comprehensiveScan() {
    console.log('🔍 Starting COMPREHENSIVE Database Scan...\n');
    
    let allResults = [];
    let hasMore = true;
    let startCursor = undefined;
    
    // Fetch ALL entries
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
    
    console.log(`Total entries to analyze: ${allResults.length}\n`);
    
    const suspicious = [];
    const legitimate = [];
    
    // Analyze EVERY entry
    for (const page of allResults) {
        const entry = {
            id: page.id,
            name: page.properties.Name?.title[0]?.plain_text || '',
            website: page.properties.Website?.url || '',
            email: page.properties.Email?.email || '',
            category: page.properties.Category?.select?.name || '',
            status: page.properties.Status?.select?.name || '',
            yearFounded: page.properties['Year Founded']?.number || null,
            location: page.properties.Location?.rich_text[0]?.plain_text || '',
            description: page.properties.Description?.rich_text[0]?.plain_text || '',
            keyPeople: page.properties['Key People']?.rich_text[0]?.plain_text || '',
            funding: page.properties.Funding?.rich_text[0]?.plain_text || '',
            createdTime: page.created_time,
            lastEditedTime: page.last_edited_time
        };
        
        // Count how many fields have actual data
        let dataPoints = 0;
        if (entry.website) dataPoints++;
        if (entry.email) dataPoints++;
        if (entry.category) dataPoints++;
        if (entry.yearFounded) dataPoints++;
        if (entry.location && entry.location.length > 3) dataPoints++;
        if (entry.description && entry.description.length > 10) dataPoints++;
        if (entry.keyPeople && entry.keyPeople.length > 5) dataPoints++;
        if (entry.funding && entry.funding.length > 5) dataPoints++;
        
        // Suspicious patterns
        const suspiciousPatterns = [
            // Field names
            /^(name|email|website|phone|address|description|category|status|type|date|year|funding|location|city|province|country|revenue|valuation|employees?|staff|team|founder|ceo|cto|key\s*people?)$/i,
            // Data types
            /^(string|text|number|boolean|bool|array|object|null|undefined|true|false|yes|no|n\/a)$/i,
            // Technical terms
            /^(id|uuid|guid|key|value|field|property|attribute|column|row|table|database|schema|index|query|select|insert|update|delete)$/i,
            // File names
            /\.(json|csv|xlsx?|txt|md|pdf|doc|sql|js|py|java|cpp|html|css|xml)$/i,
            // Dates/timestamps
            /^\d{4}-\d{2}-\d{2}$/,
            /^(january|february|march|april|may|june|july|august|september|october|november|december)\s*\d{0,4}$/i,
            // Common placeholders
            /^(test|sample|example|demo|temp|tmp|delete|remove|ignore|todo|fixme|xxx|placeholder|dummy|fake)$/i,
            // Single letters or numbers
            /^[a-z]$/i,
            /^\d+$/,
            // Common words that aren't company names
            /^(the|and|or|but|with|for|from|about|contact|info|information|data|list|group|team|department|division|unit|section)$/i,
            // Task-like entries
            /^(add|create|update|modify|change|fix|improve|enhance|develop|build|make|do|check|verify|validate|review|analyze|research|find|search|track|monitor|watch|follow)[\s\w]+$/i,
            // Category/sector names alone
            /^(ai|ml|machine learning|artificial intelligence|tech|technology|software|hardware|biotech|cleantech|fintech|healthtech|edtech|agtech|blockchain|crypto|web3|iot|robotics|automation|analytics|data science|cloud|saas|paas|iaas)$/i,
            // Time periods
            /^(q[1-4]|quarter|fiscal|fy|h[12]|half|ytd|mtd|daily|weekly|monthly|yearly|annual)[\s\d]*$/i,
            // Generic descriptors
            /^(new|old|current|previous|next|first|last|latest|recent|upcoming|future|past|present)$/i,
            // Metrics/KPIs
            /^(revenue|sales|profit|loss|growth|rate|percentage|ratio|metric|kpi|target|goal|objective|milestone)$/i,
            // Status values
            /^(active|inactive|pending|approved|rejected|draft|published|archived|deleted|suspended|blocked|paused)$/i,
            // Before/After patterns
            /^(before|after|pre|post|prior|previous|following|subsequent)[\s\w]*$/i,
            // Common suffixes that aren't company names
            /^[\w\s]+(count|total|sum|average|mean|median|min|max|range)$/i
        ];
        
        let isSuspicious = false;
        let reason = '';
        
        // Check name patterns
        if (!entry.name || entry.name.trim() === '') {
            isSuspicious = true;
            reason = 'Empty name';
        } else if (entry.name.length <= 2) {
            isSuspicious = true;
            reason = 'Name too short';
        } else if (suspiciousPatterns.some(pattern => pattern.test(entry.name))) {
            isSuspicious = true;
            reason = 'Name matches suspicious pattern';
        }
        
        // Check if it's just a year
        if (/^(19|20)\d{2}$/.test(entry.name)) {
            isSuspicious = true;
            reason = 'Just a year number';
        }
        
        // Check if name is a URL or email
        if (entry.name.includes('http://') || entry.name.includes('https://') || entry.name.includes('@')) {
            isSuspicious = true;
            reason = 'Name contains URL or email';
        }
        
        // Check data completeness
        if (!isSuspicious && dataPoints === 0) {
            isSuspicious = true;
            reason = 'No meaningful data';
        }
        
        // Check if it's only a name with no other data
        if (!isSuspicious && dataPoints <= 1 && !entry.website && !entry.description) {
            isSuspicious = true;
            reason = 'Only name, no other data';
        }
        
        // Special checks for certain names
        if (entry.name.match(/^(batch|import|upload|download|export|migration|sync|backup|restore)/i)) {
            isSuspicious = true;
            reason = 'Data operation name';
        }
        
        if (isSuspicious) {
            suspicious.push({
                ...entry,
                reason,
                dataPoints
            });
        } else {
            legitimate.push({
                ...entry,
                dataPoints
            });
        }
    }
    
    // Sort suspicious by reason
    suspicious.sort((a, b) => a.reason.localeCompare(b.reason));
    
    // Generate report
    console.log('📊 SCAN COMPLETE:\n');
    console.log(`Total entries: ${allResults.length}`);
    console.log(`Suspicious entries: ${suspicious.length} (${((suspicious.length/allResults.length)*100).toFixed(1)}%)`);
    console.log(`Legitimate entries: ${legitimate.length} (${((legitimate.length/allResults.length)*100).toFixed(1)}%)`);
    
    // Group suspicious by reason
    const byReason = {};
    suspicious.forEach(entry => {
        if (!byReason[entry.reason]) {
            byReason[entry.reason] = [];
        }
        byReason[entry.reason].push(entry);
    });
    
    console.log('\n🚨 SUSPICIOUS ENTRIES BY CATEGORY:\n');
    Object.keys(byReason).forEach(reason => {
        console.log(`\n${reason.toUpperCase()} (${byReason[reason].length} entries):`);
        console.log('─'.repeat(50));
        byReason[reason].slice(0, 10).forEach(entry => {
            console.log(`"${entry.name}" - ID: ${entry.id}`);
            if (entry.website) console.log(`  Website: ${entry.website}`);
            if (entry.dataPoints > 0) console.log(`  Data points: ${entry.dataPoints}`);
        });
        if (byReason[reason].length > 10) {
            console.log(`... and ${byReason[reason].length - 10} more`);
        }
    });
    
    // Save detailed results
    const results = {
        scanDate: new Date().toISOString(),
        summary: {
            total: allResults.length,
            suspicious: suspicious.length,
            legitimate: legitimate.length,
            suspiciousPercentage: ((suspicious.length/allResults.length)*100).toFixed(1)
        },
        suspicious: suspicious,
        byReason: byReason
    };
    
    fs.writeFileSync('comprehensive-scan-results.json', JSON.stringify(results, null, 2));
    console.log('\n📄 Detailed results saved to: comprehensive-scan-results.json');
    
    // Create deletion list
    const deletionList = suspicious.map(entry => ({
        id: entry.id,
        name: entry.name,
        reason: entry.reason
    }));
    
    fs.writeFileSync('entries-to-delete.json', JSON.stringify(deletionList, null, 2));
    console.log('📄 Deletion list saved to: entries-to-delete.json');
    
    console.log('\n⚠️  RECOMMENDED ACTION:');
    console.log(`Delete ${suspicious.length} suspicious entries to clean the database`);
}

comprehensiveScan().catch(console.error);