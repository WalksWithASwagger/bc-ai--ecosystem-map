#!/usr/bin/env node

/**
 * Migration Script: Convert all tools to MCP pattern
 * This script helps identify and convert old Notion access patterns to MCP
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

class MCPMigrator {
    constructor() {
        this.deprecatedPatterns = [
            /process\.env\.NOTION_TOKEN/g,
            /process\.env\.NOTION_DATABASE_ID/g,
            /require\(['"]dotenv['"]\)/g,
            /require\(['"]\.\/config['"]\)/g,
            /require\(['"]\.\.\/config['"]\)/g,
            /NOTION_TOKEN\s*=\s*process\.env/g,
            /const\s*{\s*NOTION_TOKEN[^}]*}\s*=\s*require/g
        ];
        
        this.mcpTemplate = `const { Client } = require('@notionhq/client');

class MCP{ClassName} {
    constructor() {
        // MCP Pattern: Direct token access - no environment variables
        this.notion = new Client({ 
            auth: process.env.NOTION_TOKEN
        });
        this.databaseId = '1f0c6f799a3381bd8332ca0235c24655';
    }
    
    // Original methods go here
}

module.exports = MCP{ClassName};`;
    }

    async scanProject() {
        console.log('🔍 Scanning project for deprecated Notion access patterns...\n');
        
        const files = glob.sync('tools/**/*.js', {
            ignore: ['**/node_modules/**', '**/archive/**', '**/mcp-*.js']
        });
        
        const results = {
            needsMigration: [],
            alreadyMCP: [],
            errors: []
        };
        
        for (const file of files) {
            try {
                const content = fs.readFileSync(file, 'utf8');
                const hasDeprecated = this.deprecatedPatterns.some(pattern => pattern.test(content));
                const isMCP = content.includes('class MCP') || file.includes('mcp-');
                
                if (isMCP) {
                    results.alreadyMCP.push(file);
                } else if (hasDeprecated) {
                    results.needsMigration.push(file);
                } else if (content.includes('notion') || content.includes('Notion')) {
                    // Might use Notion but unclear pattern
                    results.needsMigration.push(file);
                }
            } catch (error) {
                results.errors.push({ file, error: error.message });
            }
        }
        
        return results;
    }

    generateMigrationPlan(results) {
        console.log('📋 Migration Plan\n');
        console.log('=================\n');
        
        console.log(`✅ Already using MCP: ${results.alreadyMCP.length} files`);
        if (results.alreadyMCP.length > 0) {
            results.alreadyMCP.forEach(f => console.log(`   - ${f}`));
        }
        
        console.log(`\n⚠️  Needs migration: ${results.needsMigration.length} files`);
        if (results.needsMigration.length > 0) {
            results.needsMigration.forEach(f => console.log(`   - ${f}`));
        }
        
        console.log(`\n❌ Errors scanning: ${results.errors.length} files`);
        if (results.errors.length > 0) {
            results.errors.forEach(e => console.log(`   - ${e.file}: ${e.error}`));
        }
        
        return results.needsMigration;
    }

    createMCPVersion(originalFile) {
        const baseName = path.basename(originalFile, '.js');
        const dirName = path.dirname(originalFile);
        const mcpName = `mcp-${baseName}.js`;
        const mcpPath = path.join(dirName, mcpName);
        
        console.log(`\n🔄 Creating MCP version: ${mcpName}`);
        
        // Read original file
        const originalContent = fs.readFileSync(originalFile, 'utf8');
        
        // Extract the main logic (this is simplified - real migration would be more complex)
        const className = baseName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
        let mcpContent = this.mcpTemplate.replace(/{ClassName}/g, className);
        
        // Try to extract methods from original
        const methodMatch = originalContent.match(/async\s+\w+\([^)]*\)\s*{[\s\S]*?^}/gm);
        if (methodMatch) {
            const methods = methodMatch.join('\n\n    ');
            mcpContent = mcpContent.replace('// Original methods go here', methods);
        }
        
        return { mcpPath, mcpContent };
    }

    async migrate() {
        console.log('🚀 MCP Migration Tool\n');
        console.log('====================\n');
        
        // Scan for files needing migration
        const results = await this.scanProject();
        const toMigrate = this.generateMigrationPlan(results);
        
        if (toMigrate.length === 0) {
            console.log('\n✨ All tools are already using MCP!');
            return;
        }
        
        console.log('\n📝 Migration Instructions:\n');
        console.log('1. Each file needs to be manually converted to MCP pattern');
        console.log('2. Use the template in MCP_NOTION_GUIDE.md');
        console.log('3. Test each converted tool thoroughly');
        console.log('4. Archive the old version in archive/deprecated/');
        
        // Save migration report
        const report = {
            timestamp: new Date().toISOString(),
            needsMigration: toMigrate,
            alreadyMCP: results.alreadyMCP,
            migrationGuide: 'See MCP_NOTION_GUIDE.md for conversion instructions'
        };
        
        fs.writeFileSync('migration-report.json', JSON.stringify(report, null, 2));
        console.log('\n📄 Migration report saved to: migration-report.json');
    }
}

// Run migration scan
if (require.main === module) {
    const migrator = new MCPMigrator();
    migrator.migrate().catch(console.error);
}

module.exports = MCPMigrator;