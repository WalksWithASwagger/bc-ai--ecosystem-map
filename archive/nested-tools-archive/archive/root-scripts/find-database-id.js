const { Client } = require('@notionhq/client');

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN || process.env.NOTION_API_KEY,
});

async function findDatabases() {
  console.log('🔍 Searching for Notion databases...\n');
  
  try {
    const response = await notion.search({
      filter: {
        value: 'database',
        property: 'object'
      },
      sort: {
        direction: 'descending',
        timestamp: 'last_edited_time'
      }
    });

    if (response.results.length === 0) {
      console.log('No databases found.');
      return;
    }

    console.log(`Found ${response.results.length} database(s):\n`);
    
    response.results.forEach((db, index) => {
      console.log(`${index + 1}. Database: ${db.title?.[0]?.plain_text || 'Untitled'}`);
      console.log(`   ID: ${db.id}`);
      console.log(`   URL: ${db.url}`);
      console.log(`   Last edited: ${new Date(db.last_edited_time).toLocaleString()}`);
      console.log('');
    });

    // Look for AI ecosystem database
    const aiDatabase = response.results.find(db => {
      const title = db.title?.[0]?.plain_text || '';
      return title.toLowerCase().includes('ai') || 
             title.toLowerCase().includes('ecosystem') ||
             title.toLowerCase().includes('organizations');
    });

    if (aiDatabase) {
      console.log('🎯 Likely AI Ecosystem Database:');
      console.log(`   Name: ${aiDatabase.title?.[0]?.plain_text}`);
      console.log(`   ID: ${aiDatabase.id}`);
      console.log('\nTo use this database, set:');
      console.log(`export NOTION_DATABASE_ID="${aiDatabase.id}"`);
    }

  } catch (error) {
    console.error('Error searching for databases:', error.message);
    if (error.code === 'unauthorized') {
      console.log('\n❌ Unauthorized. Please check your NOTION_TOKEN is correct.');
    }
  }
}

// Run the search
findDatabases().catch(console.error);