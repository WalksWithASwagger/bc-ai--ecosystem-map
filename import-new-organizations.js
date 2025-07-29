const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');

if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
  console.error('❌ NOTION_TOKEN or NOTION_DATABASE_ID env vars missing');
  process.exit(1);
}

const mdPath = process.argv[2] || 'new_organizations.md';
if (!fs.existsSync(mdPath)) {
  console.error(`❌ Markdown file not found: ${mdPath}`);
  process.exit(1);
}

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const dbId = process.env.NOTION_DATABASE_ID;

// Simple parser for the markdown structure in new_organizations.md
function parseMarkdown(md) {
  const lines = md.split(/\r?\n/);
  const orgs = [];
  let current = null;
  const fieldRegex = /^\*\*([^*]+)\*\*:\s*(.*)$/;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('**Organization Name**')) {
      if (current) orgs.push(current);
      current = { Name: trimmed.replace('**Organization Name**:', '').trim() };
    } else if (current) {
      const match = trimmed.match(fieldRegex);
      if (match) {
        const field = match[1].trim();
        const value = match[2].trim();
        current[field] = value;
      }
    }
  });
  if (current) orgs.push(current);
  return orgs.filter(o => o.Name);
}

async function fetchDbProps() {
  const db = await notion.databases.retrieve({ database_id: dbId });
  const map = {};
  Object.entries(db.properties).forEach(([name, def]) => {
    map[name.toLowerCase()] = { id: name, def };
  });
  return map;
}

function buildProperties(org, dbMap) {
  const props = {};
  // Title
  if (dbMap['name']) {
    props['Name'] = {
      title: [{ text: { content: org.Name } }]
    };
  }
  const mapping = {
    Website: 'Website',
    Email: 'Email',
    Phone: 'Phone',
    LinkedIn: 'LinkedIn',
    'Short Blurb': 'Short Blurb',
    Category: 'Category',
    'AI Focus Areas': 'AI Focus Areas',
    'BC Region': 'BC Region',
    'City/Region': 'City/Region',
    'Year Founded': 'Year Founded'
  };
  Object.entries(mapping).forEach(([src, target]) => {
    const val = org[src];
    if (!val) return;
    const keyLower = target.toLowerCase();
    if (!dbMap[keyLower]) return;
    const type = dbMap[keyLower].def.type;
    switch (type) {
      case 'url':
        props[target] = { url: val };
        break;
      case 'email':
        props[target] = { email: val };
        break;
      case 'phone_number':
        props[target] = { phone_number: val };
        break;
      case 'rich_text':
        props[target] = { rich_text: [{ text: { content: val } }] };
        break;
      case 'select':
        props[target] = { select: { name: val } };
        break;
      case 'multi_select':
        props[target] = { multi_select: val.split(/,\s*/).map(n => ({ name: n })) };
        break;
      case 'number':
        const num = Number(val.replace(/[^0-9.-]/g, ''));
        props[target] = { number: isNaN(num) ? undefined : num };
        break;
      default:
        // unsupported types skipped
    }
  });
  return props;
}

(async () => {
  const md = fs.readFileSync(mdPath, 'utf8');
  const orgs = parseMarkdown(md);
  console.log(`📂 Parsed ${orgs.length} organizations from markdown`);

  const dbMap = await fetchDbProps();

  const importLog = [];
  for (let i = 0; i < orgs.length; i++) {
    const org = orgs[i];
    try {
      const props = buildProperties(org, dbMap);
      const resp = await notion.pages.create({ parent: { database_id: dbId }, properties: props });
      const url = resp.url;
      console.log(`✅ Imported: ${org.Name}`);
      importLog.push(`| ${org.Name} | ${url} |`);
    } catch (err) {
      console.error(`❌ Failed to import ${org.Name}:`, err.message);
      importLog.push(`| ${org.Name} | ERROR: ${err.message} |`);
    }
    if ((i + 1) % 10 === 0) await new Promise(r => setTimeout(r, 700));
  }

  const logPath = path.join('imports', `import-${new Date().toISOString().split('T')[0]}.md`);
  fs.mkdirSync('imports', { recursive: true });
  fs.writeFileSync(logPath, `# Import Log ${new Date().toISOString()}\n\n| Organization | Notion URL / Status |\n|---|---|\n${importLog.join('\n')}\n`);
  console.log(`📝 Import log written to ${logPath}`);
})(); 