const { Client } = require('@notionhq/client');
const dotenv = require('dotenv');

dotenv.config();

const notion = new Client({
  auth: process.env.NOTION_TOKEN
});

const databaseId = process.env.NOTION_DATABASE_ID;

async function checkDatabaseSchema() {
  try {
    const database = await notion.databases.retrieve({ database_id: databaseId });
    
    console.log('Database Title:', database.title[0]?.plain_text || 'Untitled');
    console.log('\nAvailable Properties:\n');
    
    Object.entries(database.properties).forEach(([key, prop]) => {
      console.log(`- ${key} (${prop.type})`);
      if (prop.type === 'select' && prop.select?.options) {
        console.log(`  Options: ${prop.select.options.map(o => o.name).join(', ')}`);
      }
      if (prop.type === 'multi_select' && prop.multi_select?.options) {
        console.log(`  Options: ${prop.multi_select.options.map(o => o.name).join(', ')}`);
      }
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDatabaseSchema();