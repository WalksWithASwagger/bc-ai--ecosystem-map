require('dotenv').config();
const { Client } = require('@notionhq/client');

console.log('NOTION_TOKEN:', process.env.NOTION_TOKEN ? 'Set' : 'Not set');
console.log('NOTION_DATABASE_ID:', process.env.NOTION_DATABASE_ID);

const notion = new Client({ auth: process.env.NOTION_TOKEN });
notion.databases.retrieve({ database_id: process.env.NOTION_DATABASE_ID })
  .then(db => console.log('✅ Connected to DB:', db.title[0].plain_text))
  .catch(err => console.error('❌ Access failed:', err.message));