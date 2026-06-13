require('dotenv').config();
const { Client } = require('@notionhq/client');

console.log('Testing Notion connection...');
console.log('Token:', process.env.NOTION_TOKEN ? 'Found' : 'Missing');
console.log('Database ID:', process.env.NOTION_DATABASE_ID || 'Missing');

if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
  console.error('Missing environment variables!');
  process.exit(1);
}

const notion = new Client({ auth: process.env.NOTION_TOKEN });

(async () => {
  try {
    console.log('\n🔄 Querying database...');
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      page_size: 10
    });
    
    console.log(`\n✅ Success! Found ${response.results.length} organizations`);
    console.log(`Total in database: ${response.results.length} (first page)`);
    
    // Show first few organization names
    console.log('\nFirst few organizations:');
    response.results.slice(0, 5).forEach((page, i) => {
      const name = page.properties.Name?.title?.[0]?.plain_text || 'No name';
      console.log(`${i + 1}. ${name}`);
    });
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Status:', error.status);
    console.error('Code:', error.code);
  }
})();