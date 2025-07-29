# Notion MCP Access – Quick Setup Guide

This repo relies on **Notion MCP (Model-Context Protocol)** to read and write data directly to the live BC-AI Ecosystem database.

## 1. Credentials

| Variable | Purpose |
|----------|---------|
| `NOTION_TOKEN` | Secret token generated from the **Cursor MCP** integration (or your own integration). |
| `NOTION_DATABASE_ID` | The database ID for the BC-AI Ecosystem (`1f0c6f79-9a33-81bd-8332-ca0235c24655`). |
| `GOOGLE_KEY` | *(Optional)* Google Geocoding API key – only needed for `scripts/geocode-csv.js`. |

Set these in your shell before running any script, for example:
```bash
export NOTION_TOKEN="ntn_xxx..."
export NOTION_DATABASE_ID="1f0c6f79-9a33-81bd-8332-ca0235c24655"
export GOOGLE_KEY="AIza..."   # only if geocoding
```

> **Tip:** add them to a local `.env` and use `direnv` or `source .env`.

## 2. Integration Permissions

The **Cursor MCP** integration currently has:
- ✅ Read / Write page content & properties
- ❌ *No* permission to edit the **database schema** (add/rename columns)

Therefore:
1. You can create new pages (organizations) and update existing fields.
2. If you need a **new property** (e.g., `Latitude` / `Longitude`) you must add it manually in the Notion UI *or* create a fresh integration with “Edit schema” enabled.
3. After the column exists, scripts can populate values without issue.

## 3. Sharing the Database with an Integration

For any integration token to work, the database **must be shared** with that integration.

1. Open the database page.  
2. Click **Share → Invite**.  
3. Choose your integration (e.g., *Cursor MCP*).  
4. Grant “Can edit content” (read/write).  

## 4. Sanity Check Command

Use this once after setting your env vars to confirm access:
```bash
node - <<'EOF'
const { Client } = require('@notionhq/client');
const notion = new Client({ auth: process.env.NOTION_TOKEN });
notion.databases.retrieve({ database_id: process.env.NOTION_DATABASE_ID })
  .then(db => console.log('✅ Connected to DB:', db.title[0].plain_text))
  .catch(err => console.error('❌ Access failed:', err.message));
EOF
```

## 5. Scripts Recap

| Script | Requires Schema Edit? | Notes |
|--------|----------------------|-------|
| `scripts/find-new-orgs.js` | No | Reads DB to compare names |
| `scripts/add-org.js` | No | Creates new pages |
| `scripts/check-duplicates.js` | No | Read-only duplicate checker |
| `scripts/geocode-fallback.js` | Needs `Latitude`+`Longitude` columns added first | No external API key |
| `scripts/geocode-csv.js` | Needs `Latitude`+`Longitude` columns | Requires `GOOGLE_KEY` |

## 6. Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| `APIResponseError: Could not find property with name or id` | Column doesn’t exist | Add property manually in Notion or via schema-edit integration |
| `object_not_found` | Database not shared with integration | Share DB with the token’s integration |
| `401 unauthorized` | Wrong / expired token | Regenerate token & update env var |

Keep this doc handy when onboarding new agents or copying the repo to a fresh environment. 