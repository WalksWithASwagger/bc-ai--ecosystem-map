const readline = require('readline');
const { Client } = require('@notionhq/client');

if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
  console.error('Set NOTION_TOKEN and NOTION_DATABASE_ID env vars.');
  process.exit(1);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const dbId = process.env.NOTION_DATABASE_ID;

function ask(q) { return new Promise(res => rl.question(q, a => res(a.trim()))); }

(async () => {
  const nameArg = process.argv.includes('--name') ? process.argv[process.argv.indexOf('--name')+1] : '';
  const org = {};
  org.name = nameArg || await ask('Organization name: ');
  org.website = await ask('Website (optional): ');
  org.email = await ask('Email (optional): ');
  org.linkedIn = await ask('LinkedIn (optional): ');
  org.region = await ask('BC Region (optional): ');

  rl.close();

  const props = {
    Name: { title: [{ text: { content: org.name } }] }
  };
  if (org.website) props['Website'] = { url: org.website };
  if (org.email) props['Email'] = { email: org.email };
  if (org.linkedIn) props['LinkedIn'] = { url: org.linkedIn };
  if (org.region) props['BC Region'] = { select: { name: org.region } };

  try {
    const resp = await notion.pages.create({ parent: { database_id: dbId }, properties: props });
    console.log('✅ Added:', resp.url);
  } catch (e) {
    console.error('❌ Notion error:', e.message);
  }
})(); 