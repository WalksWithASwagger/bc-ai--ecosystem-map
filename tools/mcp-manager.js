#!/usr/bin/env node

const args = process.argv.slice(2);

function printMainHelp() {
  console.log(`BC AI Ecosystem MCP Tool Suite

Usage:
  npm run mcp -- <group> <action> [options]
  npm run analyze -- <action> [options]
  npm run enrich -- <action> [options]

Groups:
  analyze   completeness, duplicates, missing, quality, audit
  enrich    emails, websites, people, funding, batch

Examples:
  npm run analyze -- completeness --report
  npm run analyze -- missing --field=Email --limit=50
  npm run enrich -- emails --limit=20 --dry-run
  npm run enrich -- batch emails,websites,people --dry-run

Set NOTION_TOKEN and NOTION_DATABASE_ID before running actions that query or update Notion.`);
}

function printAnalyzeHelp() {
  console.log(`Analyze actions:
  completeness [--limit=20] [--report] [--fields-only]
  duplicates [--auto-fix]
  missing --field=<field> [--limit=20]
  quality [--details]
  audit [--report]`);
}

function printEnrichHelp() {
  console.log(`Enrich actions:
  emails [--limit=20] [--dry-run]
  websites [--limit=20] [--dry-run]
  people [--limit=20] [--dry-run]
  funding [--limit=20] [--dry-run] [--source=<source>]
  batch <fields> [--limit=20] [--dry-run]`);
}

function parseOptions(tokens) {
  const options = {};
  const positional = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];

    if (token === '--report') options.report = true;
    else if (token === '--auto-fix') options.autoFix = true;
    else if (token === '--details') options.details = true;
    else if (token === '--fields-only') options.fieldsOnly = true;
    else if (token === '--dry-run' || token === '--dryrun') options.dryRun = true;
    else if (token === '--limit' || token === '-l') {
      i += 1;
      options.limit = Number.parseInt(tokens[i], 10);
    } else if (token.startsWith('--limit=')) {
      options.limit = Number.parseInt(token.split('=')[1], 10);
    } else if (token === '--field' || token === '-f') {
      i += 1;
      options.field = tokens[i];
    } else if (token.startsWith('--field=')) {
      options.field = token.split('=').slice(1).join('=');
    } else if (token === '--source' || token === '-s') {
      i += 1;
      options.source = tokens[i];
    } else if (token.startsWith('--source=')) {
      options.source = token.split('=').slice(1).join('=');
    } else {
      positional.push(token);
    }
  }

  return { options, positional };
}

async function runAnalyze(action, rest) {
  if (!action || action === '--help' || action === '-h') {
    printAnalyzeHelp();
    return;
  }

  const { options } = parseOptions(rest);
  const MCPAnalyzer = require('./mcp/analyzer');
  const analyzer = new MCPAnalyzer();

  switch (action) {
    case 'completeness':
      await analyzer.completeness(options);
      break;
    case 'duplicates':
      await analyzer.duplicates(options);
      break;
    case 'missing':
      if (!options.field) {
        throw new Error('--field is required for missing analysis.');
      }
      await analyzer.missing(options.field, options);
      break;
    case 'quality':
      await analyzer.quality(options);
      break;
    case 'audit':
      await analyzer.audit(options);
      break;
    default:
      throw new Error(`Unknown analyze action: ${action}`);
  }
}

async function runEnrich(action, rest) {
  if (!action || action === '--help' || action === '-h') {
    printEnrichHelp();
    return;
  }

  const { options, positional } = parseOptions(rest);
  const MCPEnricher = require('./mcp/enricher');
  const enricher = new MCPEnricher();

  if (action === 'batch') {
    const fields = positional[0];
    if (!fields) throw new Error('batch requires a comma-separated field list.');
    await enricher.batch(fields, options);
    return;
  }

  if (typeof enricher[action] !== 'function') {
    throw new Error(`Unknown enrich action: ${action}`);
  }

  await enricher[action](options);
}

async function main() {
  const [group, action, ...rest] = args;

  if (!group || group === '--help' || group === '-h') {
    printMainHelp();
    return;
  }

  if (group === 'analyze') {
    await runAnalyze(action, rest);
    return;
  }

  if (group === 'enrich') {
    await runEnrich(action, rest);
    return;
  }

  throw new Error(`Unknown group: ${group}`);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
