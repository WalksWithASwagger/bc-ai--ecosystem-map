#!/usr/bin/env node

/**
 * MCP Manager - Unified CLI for all MCP tools
 * The ONLY tool you need to manage the BC AI Ecosystem
 */

const { program } = require('commander');
const MCPAnalyzer = require('./mcp/analyzer');
const MCPEnricher = require('./mcp/enricher');
// Future imports:
// const MCPImporter = require('./mcp/importer');
// const MCPResearcher = require('./mcp/researcher');
// const MCPMaintainer = require('./mcp/maintainer');

// ASCII Art Banner
console.log(`
╔═══════════════════════════════════════════╗
║   MCP - BC AI Ecosystem Manager v2.0      ║
║   Model Context Protocol Tools            ║
╚═══════════════════════════════════════════╝
`);

program
    .name('mcp')
    .description('Unified BC AI Ecosystem management tool')
    .version('2.0.0');

// Analyze command group
program
    .command('analyze <action>')
    .description('Analyze database quality and completeness')
    .option('-l, --limit <n>', 'limit results', parseInt, 20)
    .option('-f, --field <field>', 'specific field to analyze')
    .option('-r, --report', 'generate detailed report')
    .option('--auto-fix', 'automatically fix issues (use with caution)')
    .option('--details', 'show detailed results')
    .option('--fields-only', 'only show field statistics')
    .action(async (action, options) => {
        try {
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
                        console.error('❌ Error: --field is required for missing analysis');
                        console.log('Example: mcp analyze missing --field=Email');
                        process.exit(1);
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
                    console.error(`❌ Unknown analyze action: ${action}`);
                    console.log('Available actions: completeness, duplicates, missing, quality, audit');
            }
        } catch (error) {
            console.error('❌ Error:', error.message);
            process.exit(1);
        }
    });

// Enrich command group
program
    .command('enrich <action>')
    .description('Enrich database with missing data')
    .option('-l, --limit <n>', 'limit updates', parseInt, 10)
    .option('--dry-run', 'preview changes without updating')
    .option('-s, --source <source>', 'data source to use')
    .action(async (action, options) => {
        try {
            const enricher = new MCPEnricher();
            
            // Handle batch enrichment
            if (action === 'batch' && process.argv[4]) {
                const fields = process.argv[4];
                await enricher.batch(fields, options);
            } else if (enricher[action]) {
                await enricher[action](options);
            } else {
                console.error(`❌ Unknown enrich action: ${action}`);
                console.log('Available actions: emails, websites, people, funding, batch');
                process.exit(1);
            }
        } catch (error) {
            console.error('❌ Error:', error.message);
            process.exit(1);
        }
    });

// Import command group (placeholder)
program
    .command('import <action>')
    .description('Import data into database')
    .option('-f, --file <file>', 'input file')
    .option('--format <format>', 'file format (csv, json, md)')
    .action(async (action, options) => {
        console.log('🚧 Import functionality coming soon!');
        console.log(`Would run: import ${action} with options:`, options);
        // const importer = new MCPImporter();
        // await importer[action](options);
    });

// Research command group (placeholder)
program
    .command('research <action>')
    .description('Research and discover new data')
    .option('-s, --source <source>', 'data source')
    .option('-q, --query <query>', 'search query')
    .action(async (action, options) => {
        console.log('🚧 Research functionality coming soon!');
        console.log(`Would run: research ${action} with options:`, options);
        // const researcher = new MCPResearcher();
        // await researcher[action](options);
    });

// Maintain command group (placeholder)
program
    .command('maintain <action>')
    .description('Maintain and clean database')
    .option('--force', 'force operation without confirmation')
    .action(async (action, options) => {
        console.log('🚧 Maintain functionality coming soon!');
        console.log(`Would run: maintain ${action} with options:`, options);
        // const maintainer = new MCPMaintainer();
        // await maintainer[action](options);
    });

// Help examples
program.on('--help', () => {
    console.log('');
    console.log('Examples:');
    console.log('  $ mcp analyze completeness');
    console.log('  $ mcp analyze duplicates --auto-fix');
    console.log('  $ mcp analyze missing --field=Email --limit=50');
    console.log('  $ mcp analyze audit --report');
    console.log('');
    console.log('  $ mcp enrich emails --limit=20 --dry-run');
    console.log('  $ mcp enrich websites --source=search');
    console.log('  $ mcp enrich batch emails,websites,people');
    console.log('');
    console.log('  $ mcp import add "Company Name" --data=info.json');
    console.log('  $ mcp import bulk companies.csv');
    console.log('');
    console.log('  $ mcp research scrape betakit');
    console.log('  $ mcp research discover --source=all');
    console.log('');
    console.log('  $ mcp maintain clean --duplicates');
    console.log('  $ mcp maintain backup');
});

// Parse arguments
program.parse(process.argv);

// Show help if no arguments
if (!process.argv.slice(2).length) {
    program.outputHelp();
}