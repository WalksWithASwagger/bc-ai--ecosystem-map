const { Client } = require('@notionhq/client');
require('dotenv').config();

async function getDbStats(token, dbId) {
    const notion = new Client({ auth: token });
    
    // Get total count
    let total = 0;
    let hasMore = true;
    let cursor;
    
    while (hasMore) {
        const response = await notion.databases.query({
            database_id: dbId,
            start_cursor: cursor,
            page_size: 100
        });
        total += response.results.length;
        hasMore = response.has_more;
        cursor = response.next_cursor;
    }
    
    // Get sample entries
    const sample = await notion.databases.query({
        database_id: dbId,
        page_size: 5,
        sorts: [{ timestamp: 'created_time', direction: 'descending' }]
    });
    
    return {
        total,
        latestEntries: sample.results.map(r => ({
            name: r.properties.Name?.title?.[0]?.plain_text || 'No name',
            created: new Date(r.created_time).toLocaleDateString()
        }))
    };
}

async function main() {
    console.log('🔍 Comparing Database Access\n');
    
    const token1 = process.env.NOTION_TOKEN;
    const token2 = process.env.NOTION_TOKEN_SECONDARY;
    const dbId = process.env.AI_COMPANY_DB_ID;
    
    console.log('Token 1 (MCP/Tools):');
    const stats1 = await getDbStats(token1, dbId);
    console.log(`Total entries: ${stats1.total}`);
    console.log('Latest entries:');
    stats1.latestEntries.forEach(e => console.log(`  - ${e.name} (${e.created})`));
    
    console.log('\nToken 2 (UI):');
    const stats2 = await getDbStats(token2, dbId);
    console.log(`Total entries: ${stats2.total}`);
    console.log('Latest entries:');
    stats2.latestEntries.forEach(e => console.log(`  - ${e.name} (${e.created})`));
    
    console.log('\n📊 Analysis:');
    if (stats1.total === stats2.total) {
        console.log('✅ Both tokens access the SAME database');
        console.log('🎯 Recommendation: Use Token 1 (MCP) for consistency');
    } else {
        console.log('❌ Tokens access DIFFERENT databases!');
        console.log(`   Token 1: ${stats1.total} entries`);
        console.log(`   Token 2: ${stats2.total} entries`);
    }
}

main().catch(console.error);