const { Client } = require('@notionhq/client');
require('dotenv').config();

async function testToken(name, token, dbId) {
    console.log(`\nTesting ${name}...`);
    console.log(`Token: ${token.substring(0, 20)}...`);
    
    try {
        const notion = new Client({ auth: token });
        const response = await notion.databases.query({
            database_id: dbId,
            page_size: 1
        });
        
        console.log(`✅ SUCCESS - Found ${response.results.length} entries`);
        if (response.results.length > 0) {
            const name = response.results[0].properties.Name?.title?.[0]?.plain_text || 'No name';
            console.log(`   First entry: ${name}`);
        }
        return true;
    } catch (error) {
        console.log(`❌ FAILED - ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('🔑 Testing Notion Tokens\n');
    console.log('========================');
    
    const tokens = [
        {
            name: 'MCP Token (from tools)',
            token: process.env.NOTION_TOKEN,
            dbId: '1f0c6f799a3381bd8332ca0235c24655'
        },
        {
            name: 'UI Token (from .env.local)',
            token: process.env.NOTION_TOKEN_SECONDARY,
            dbId: '1f0c6f799a3381bd8332ca0235c24655'
        }
    ];
    
    const results = [];
    for (const t of tokens) {
        const works = await testToken(t.name, t.token, t.dbId);
        results.push({ ...t, works });
    }
    
    console.log('\n📊 Summary:');
    console.log('===========');
    
    const working = results.filter(r => r.works);
    if (working.length === 1) {
        console.log(`\n✅ Use this token for MCP: ${working[0].token}`);
    } else if (working.length > 1) {
        console.log('\n⚠️  Multiple tokens work! Need to choose one.');
    } else {
        console.log('\n❌ No tokens work! Check database ID.');
    }
}

main().catch(console.error);