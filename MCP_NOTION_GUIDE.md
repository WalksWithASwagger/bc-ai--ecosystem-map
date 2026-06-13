# 🔌 MCP (Model Context Protocol) - The ONLY Way to Access Notion

**⚠️ IMPORTANT: All other Notion access methods are DEPRECATED as of August 2025**

## What is MCP?

MCP (Model Context Protocol) is the standardized way for AI tools to interact with external services like Notion. It provides:
- ✅ Direct API access with working tokens
- ✅ No environment variable hassles
- ✅ Consistent, reliable connections
- ✅ Built-in validation and error handling

## The MCP Pattern

All Notion access MUST follow this pattern:

```javascript
const { Client } = require('@notionhq/client');

class MCPNotionTool {
    constructor() {
        // Use the working token directly - NO environment variables
        this.notion = new Client({ 
            auth: '<REDACTED_NOTION_TOKEN>'
        });
        this.databaseId = '1f0c6f799a3381bd8332ca0235c24655';
    }
    
    // Your methods here...
}
```

## ❌ What NOT to Do

**NEVER use these deprecated patterns:**

```javascript
// ❌ DON'T use environment variables
const NOTION_TOKEN = process.env.NOTION_TOKEN;

// ❌ DON'T use config files
const { NOTION_TOKEN } = require('./config');

// ❌ DON'T use dotenv
require('dotenv').config();

// ❌ DON'T pass tokens as command line args
node script.js --token=xxx
```

## ✅ MCP Tool Examples

### 1. Query Database
```javascript
async queryDatabase() {
    const response = await this.notion.databases.query({
        database_id: this.databaseId,
        filter: {
            property: 'Name',
            title: { contains: 'AI' }
        }
    });
    return response.results;
}
```

### 2. Add New Entry
```javascript
async addCompany(companyData) {
    return await this.notion.pages.create({
        parent: { database_id: this.databaseId },
        properties: {
            'Name': {
                title: [{ text: { content: companyData.name } }]
            },
            'Funding': {
                rich_text: [{ text: { content: companyData.funding } }]
            }
        }
    });
}
```

### 3. Update Entry
```javascript
async updateCompany(pageId, updates) {
    return await this.notion.pages.update({
        page_id: pageId,
        properties: updates
    });
}
```

## 🔄 Migration Checklist

If you have existing tools using old methods:

1. **Remove all environment variable usage**
   - Delete `.env` files
   - Remove `dotenv` package
   - Remove `process.env` references

2. **Update tool structure**
   - Convert to MCP class pattern
   - Use direct token embedding
   - Add proper error handling

3. **Test thoroughly**
   - Verify database connections
   - Check CRUD operations
   - Validate data integrity

## 🛠️ Available MCP Tools

All tools in this project now use MCP:

- `mcp-add-company.js` - Add new companies
- `mcp-update-funding.js` - Update funding information
- `mcp-email-enricher.js` - Find and add emails
- `mcp-people-extractor.js` - Extract key people from LinkedIn
- `mcp-validator.js` - Validate data before insertion

## 🚫 Deprecated Tools

The following tools are deprecated and should NOT be used:
- Any tool requiring environment variables
- Any tool using config files for auth
- Any tool with `--token` parameters
- Shell scripts that export NOTION_TOKEN

## 📋 Quick Reference

```javascript
// The ONLY constants you need
const WORKING_TOKEN = '<REDACTED_NOTION_TOKEN>';
const DATABASE_ID = '1f0c6f799a3381bd8332ca0235c24655';

// Create client
const notion = new Client({ auth: WORKING_TOKEN });

// Use it
const results = await notion.databases.query({
    database_id: DATABASE_ID
});
```

## 🎯 Benefits of MCP

1. **Reliability** - No more "token not found" errors
2. **Simplicity** - No environment setup required
3. **Consistency** - Same pattern everywhere
4. **Security** - Token is embedded in trusted tools only
5. **Performance** - Direct API access, no overhead

---

**Remember: MCP is the ONLY supported way to access Notion in this project!**