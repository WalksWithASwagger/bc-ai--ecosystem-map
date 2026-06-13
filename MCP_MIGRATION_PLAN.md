# 🚀 MCP Migration Plan - Complete Project Refactoring

## 📊 Current State Analysis

### 🔴 Critical Issues Found

1. **Multiple Conflicting Tokens**
   - Root `.env`: `<REDACTED_NOTION_TOKEN>` (MCP token)
   - UI `.env.local`: `<REDACTED_NOTION_TOKEN>` (different token!)
   - This conflict is causing authentication issues

2. **Environment Variable Usage**
   - 51+ tool files still using `process.env`
   - UI components using environment variables
   - Shell scripts expecting env vars
   - Documentation still references env setup

3. **Mixed Patterns**
   - Some tools hardcoded with MCP token
   - Some tools using config files
   - Some tools using dotenv
   - Inconsistent approach across project

## 🎯 Migration Strategy

### Phase 1: Immediate Actions (Day 1)

#### 1.1 Token Consolidation
```bash
# Remove all .env files
rm .env
rm ui/.env.local
rm ui/.env.local.sample

# Create MCP constants file
cat > tools/mcp-constants.js << 'EOF'
// MCP Constants - The ONLY source of truth
module.exports = {
  NOTION_TOKEN: '<REDACTED_NOTION_TOKEN>',
  DATABASE_ID: '1f0c6f799a3381bd8332ca0235c24655'
};
EOF
```

#### 1.2 Remove Config Dependencies
```bash
# Remove all config files
rm templates/config.sample.js
rm -rf tools/*/config.js

# Uninstall dotenv
npm uninstall dotenv
cd ui && npm uninstall dotenv
```

### Phase 2: Tool Migration (Days 2-3)

#### 2.1 New MCP Tool Structure
```
/tools/
  /mcp/                      # All MCP tools
    /analysis/               # Database analysis tools
      scan-completeness.js
      check-duplicates.js
      validate-quality.js
    /enrichment/             # Data enrichment tools
      email-finder.js
      people-extractor.js
      funding-updater.js
    /import/                 # Import/export tools
      add-companies.js
      bulk-import.js
    /maintenance/            # Database maintenance
      clean-duplicates.js
      archive-old.js
  mcp-base.js               # Base class for all MCP tools
  mcp-constants.js          # Token constants
```

#### 2.2 MCP Base Class
```javascript
// tools/mcp-base.js
const { Client } = require('@notionhq/client');
const { NOTION_TOKEN, DATABASE_ID } = require('./mcp-constants');

class MCPBase {
    constructor() {
        this.notion = new Client({ auth: NOTION_TOKEN });
        this.databaseId = DATABASE_ID;
    }
    
    // Common methods all tools can use
    async fetchAllPages() { /* ... */ }
    async updatePage(pageId, properties) { /* ... */ }
    async createPage(properties) { /* ... */ }
}

module.exports = MCPBase;
```

### Phase 3: UI Migration (Days 4-5)

#### 3.1 Create MCP API Service
```typescript
// ui/lib/mcp-notion.ts
import { Client } from '@notionhq/client';

// MCP Pattern for UI - hardcoded token
const NOTION_TOKEN = '<REDACTED_NOTION_TOKEN>';
const DATABASE_ID = '1f0c6f799a3381bd8332ca0235c24655';

export const notion = new Client({ auth: NOTION_TOKEN });
export { DATABASE_ID };
```

#### 3.2 Update All API Routes
Replace all `process.env` usage in:
- `/ui/app/api/organizations/route.ts`
- `/ui/app/api/notion/companies/route.ts`
- `/ui/app/api/research/projects/route.ts`

### Phase 4: Documentation Update (Day 6)

#### 4.1 Remove All Environment References
- Update README.md
- Update CONTRIBUTING.md
- Update all workflow guides
- Update UI documentation

#### 4.2 Create New Documentation
- MCP_QUICKSTART.md
- MCP_TOOL_DEVELOPMENT.md
- MCP_TROUBLESHOOTING.md

### Phase 5: Cleanup & Archive (Day 7)

#### 5.1 Archive Deprecated Items
```bash
# Create archive
mkdir -p archive/pre-mcp-migration
mv tools/0[1-7]-* archive/pre-mcp-migration/
mv tools/*.sh archive/pre-mcp-migration/
```

#### 5.2 Remove Deprecated Scripts
- All shell scripts with env vars
- Token fixing scripts
- Config-based tools

## 🏗️ New Project Structure

```
ecosystem-map-bc-ai/
├── MCP_README.md           # Main documentation
├── tools/
│   ├── mcp/               # All MCP tools
│   ├── mcp-base.js        # Base class
│   └── mcp-constants.js   # Constants
├── ui/
│   ├── lib/
│   │   └── mcp-notion.ts  # UI MCP service
│   └── app/
│       └── api/           # Updated API routes
└── archive/
    └── pre-mcp/           # All deprecated files
```

## ✅ Migration Checklist

### Day 1
- [ ] Backup current project
- [ ] Remove all .env files
- [ ] Create mcp-constants.js
- [ ] Uninstall dotenv

### Day 2-3
- [ ] Create mcp-base.js
- [ ] Migrate 10 critical tools to MCP
- [ ] Test each migrated tool
- [ ] Create tool migration script

### Day 4-5
- [ ] Create ui/lib/mcp-notion.ts
- [ ] Update all API routes
- [ ] Test UI functionality
- [ ] Remove env var references from UI

### Day 6
- [ ] Update all documentation
- [ ] Create MCP guides
- [ ] Update examples
- [ ] Remove old references

### Day 7
- [ ] Archive deprecated files
- [ ] Clean up project structure
- [ ] Final testing
- [ ] Create release notes

## 🚨 Critical Path Items

1. **Token Conflict Resolution** - Must use single MCP token
2. **UI API Routes** - All must be updated to MCP
3. **Documentation** - No env var references should remain
4. **Testing** - Every tool must be tested post-migration

## 📈 Benefits After Migration

1. **Zero Configuration** - Just clone and run
2. **No Token Issues** - Single source of truth
3. **Faster Development** - No setup required
4. **Better Reliability** - No missing env vars
5. **Cleaner Codebase** - Consistent patterns

## 🎯 Success Criteria

- ✅ No .env files in project
- ✅ No process.env references
- ✅ All tools use MCP pattern
- ✅ UI works without configuration
- ✅ Documentation is MCP-only
- ✅ Zero setup required for new developers

---

**Ready to proceed with this migration plan?**