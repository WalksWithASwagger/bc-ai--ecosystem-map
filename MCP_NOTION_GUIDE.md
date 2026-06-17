# Notion Access and Secret Handling

This repo uses Notion-backed tools for database analysis and enrichment. Notion credentials must be provided through environment-managed secrets, never hard-coded in source files, examples, committed config, or generated reports.

## Required Environment

Set both variables before running a tool that talks to Notion:

```bash
export NOTION_TOKEN=secret_xxx
export NOTION_DATABASE_ID=1f0c6f799a3381bd8332ca0235c24655
```

Local `.env` files are acceptable only when they stay untracked. Do not commit `.env`, credentials, tokens, generated config with secrets, or copied API responses containing private credentials.

## Current Entry Points

Use the package scripts as the documented entry points:

```bash
npm run mcp -- --help
npm run analyze -- --help
npm run enrich -- --help
```

Run help or dry-run style modes first. Only run live enrichment when `NOTION_TOKEN` and `NOTION_DATABASE_ID` are set from a trusted local shell, untracked local environment file, or approved CI secret store.

## Tool Pattern

New tools should read credentials from `process.env` at the system boundary and fail clearly when required variables are absent:

```javascript
const { Client } = require('@notionhq/client');

const notionToken = process.env.NOTION_TOKEN;
const databaseId = process.env.NOTION_DATABASE_ID;

if (!notionToken || !databaseId) {
  throw new Error('Set NOTION_TOKEN and NOTION_DATABASE_ID before running this tool.');
}

const notion = new Client({ auth: notionToken });
```

## Do Not

- Do not paste real tokens into source files.
- Do not add fallback credentials.
- Do not commit `.env` files or config files containing secrets.
- Do not pass tokens in command-line examples that may be saved in shell history.
- Do not unblock GitHub secret scanning unless the token is confirmed rotated and the exposure risk is approved.

## Migration Notes

Older docs in this repo may mention direct token constants or no-configuration Notion access. Treat those as stale. When touching an older tool or guide, update it to the environment-managed secret pattern above and keep any live Notion write behind an explicit dry-run or review step.
