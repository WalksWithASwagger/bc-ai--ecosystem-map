# 🎯 MCP Tool Consolidation Plan

## 📊 Current Tool Analysis

We have **127 JavaScript files** doing largely repetitive tasks:
- Multiple "find-missing-X" tools
- Multiple "enhance-X" tools  
- Multiple "update-X" tools
- Multiple "validate-X" tools
- Many one-off scripts for specific companies

## 🏗️ Proposed MCP Architecture

### Core MCP Tools (Just 5-7 main tools!)

```
/tools/
├── mcp-manager.js          # Main CLI tool
├── mcp-constants.js        # Shared constants
├── mcp-base.js            # Base class
└── mcp/
    ├── analyzer.js         # All analysis/validation
    ├── enricher.js        # All data enrichment
    ├── importer.js        # All import/export
    ├── researcher.js      # All external research
    └── maintainer.js      # All maintenance tasks
```

## 🔧 Tool Consolidation

### 1. **MCP Analyzer** (`mcp/analyzer.js`)
Combines all validation and analysis tools:
```javascript
class MCPAnalyzer extends MCPBase {
    // Commands
    async completeness(options) { }     // Scan completeness
    async duplicates(options) { }       // Find duplicates
    async quality(options) { }          // Quality check
    async missing(field) { }            // Find missing data
    async audit() { }                   // Full audit
}

// Usage:
node mcp-manager analyze completeness
node mcp-manager analyze missing email
node mcp-manager analyze duplicates --auto-fix
```

### 2. **MCP Enricher** (`mcp/enricher.js`)
Combines all enrichment tools:
```javascript
class MCPEnricher extends MCPBase {
    // Commands
    async emails(options) { }          // Find & validate emails
    async websites(options) { }        // Find websites
    async people(options) { }          // Extract key people
    async funding(options) { }         // Update funding
    async contacts(options) { }        // All contact info
    async batch(fields, options) { }   // Multiple fields at once
}

// Usage:
node mcp-manager enrich emails --limit=20
node mcp-manager enrich funding --source=betakit
node mcp-manager enrich batch emails,websites,people --limit=10
```

### 3. **MCP Importer** (`mcp/importer.js`)
Combines all import/export tools:
```javascript
class MCPImporter extends MCPBase {
    // Commands
    async add(data) { }               // Add single/multiple
    async bulk(file) { }              // Bulk import
    async export(format) { }          // Export data
    async sync(source) { }            // Sync from source
}

// Usage:
node mcp-manager import add "Company Name" --data=data.json
node mcp-manager import bulk companies.csv
node mcp-manager export json --filter="category:AI"
```

### 4. **MCP Researcher** (`mcp/researcher.js`)
Combines all external research:
```javascript
class MCPResearcher extends MCPBase {
    // Commands
    async scrape(source) { }          // Scrape sources
    async search(query) { }           // Search for companies
    async verify(field) { }           // Verify data
    async discover() { }              // Find new companies
}

// Usage:
node mcp-manager research scrape betakit
node mcp-manager research search "AI startups vancouver"
node mcp-manager research verify websites
```

### 5. **MCP Maintainer** (`mcp/maintainer.js`)
Combines all maintenance:
```javascript
class MCPMaintainer extends MCPBase {
    // Commands
    async clean() { }                 // Clean duplicates
    async archive(criteria) { }       // Archive old entries
    async fix(issue) { }             // Fix specific issues
    async backup() { }               // Backup database
}

// Usage:
node mcp-manager maintain clean --duplicates
node mcp-manager maintain archive --inactive=2years
node mcp-manager maintain fix urls
```

## 🎮 Unified CLI Interface

### Main Manager (`mcp-manager.js`)
```javascript
#!/usr/bin/env node
const { program } = require('commander');
const MCPAnalyzer = require('./mcp/analyzer');
const MCPEnricher = require('./mcp/enricher');
// ... other tools

program
  .name('mcp')
  .description('BC AI Ecosystem MCP Tool Suite')
  .version('2.0.0');

// Analyze command
program
  .command('analyze <action>')
  .description('Analyze database')
  .option('-f, --field <field>', 'specific field')
  .option('--limit <n>', 'limit results')
  .action(async (action, options) => {
    const analyzer = new MCPAnalyzer();
    await analyzer[action](options);
  });

// Enrich command  
program
  .command('enrich <action>')
  .description('Enrich database')
  .option('--limit <n>', 'limit updates')
  .option('--dry-run', 'preview only')
  .action(async (action, options) => {
    const enricher = new MCPEnricher();
    await enricher[action](options);
  });

// ... other commands

program.parse();
```

## 📦 Migration Strategy

### Phase 1: Build Core Tools
1. Create `mcp-base.js` with common functionality
2. Build 5 core MCP tools
3. Create unified CLI

### Phase 2: Map Old Tools
Create mapping of old tools to new commands:
```
find-missing-emails.js      → mcp analyze missing email
enhance-websites.js         → mcp enrich websites  
check-duplicates.js         → mcp analyze duplicates
scrape-betakit-funding.js   → mcp research scrape betakit
```

### Phase 3: Migrate Functionality
1. Extract core logic from old tools
2. Add to appropriate MCP tool
3. Test thoroughly
4. Archive old tool

### Phase 4: Deprecate Old Tools
1. Create migration guide
2. Update all scripts/docs
3. Archive old tools
4. Remove from package.json

## 🎯 Benefits

1. **From 127 files to ~7 files**
2. **Consistent interface** - Same patterns everywhere
3. **Discoverable** - `mcp --help` shows everything
4. **Composable** - Chain commands together
5. **Maintainable** - Less code duplication
6. **Testable** - Easier to test 7 tools than 127

## 📊 Example Workflows

### Daily Enrichment
```bash
# Old way (multiple tools)
node tools/find-missing-emails.js
node tools/enhance-websites.js --limit=10
node tools/extract-contact-info.js
node tools/check-duplicates.js

# New way (one tool)
mcp enrich batch emails,websites,contacts --limit=10
mcp analyze duplicates --auto-fix
```

### Weekly Maintenance
```bash
# Old way
node tools/check-active-duplicates.js
node tools/validate-database-quality.js
node tools/scan-completeness.js
node tools/database-audit.js

# New way
mcp analyze audit --full
mcp maintain clean --all
```

### Research New Companies
```bash
# Old way
node tools/scrape-betakit-funding.js
node tools/discover-new-companies.js
node tools/import-discovery-orgs.js

# New way
mcp research discover --sources=all
mcp import bulk --auto
```

## 🚀 Implementation Plan

### Week 1: Core Infrastructure
- [ ] Create mcp-base.js
- [ ] Create mcp-constants.js
- [ ] Build mcp-manager.js CLI
- [ ] Create 5 core tool classes

### Week 2: Migration
- [ ] Migrate analyze functions
- [ ] Migrate enrich functions
- [ ] Migrate import/export
- [ ] Migrate research tools
- [ ] Migrate maintenance

### Week 3: Testing & Documentation
- [ ] Test all commands
- [ ] Create migration guide
- [ ] Update documentation
- [ ] Archive old tools
- [ ] Release MCP 2.0

---

**This reduces 127 tools to just 5-7 powerful, composable tools!**

Ready to proceed with this consolidation?