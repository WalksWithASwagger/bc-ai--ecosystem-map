#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking for deprecated Notion access patterns...\n');

const deprecatedPatterns = [
    'process.env.NOTION_TOKEN',
    'process.env.NOTION_DATABASE_ID', 
    'require(\'dotenv\')',
    'require(\'./config\')',
    'require(\'../config\')',
    '.env',
    'NOTION_TOKEN ='
];

// Check key directories
const dirsToCheck = [
    'tools/01-validation',
    'tools/02-import',
    'tools/03-enrichment',
    'tools/04-research',
    'tools/07-utilities'
];

const results = {
    deprecated: [],
    mcp: []
};

dirsToCheck.forEach(dir => {
    if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
        
        files.forEach(file => {
            const filePath = path.join(dir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Check if it's already MCP
            if (file.startsWith('mcp-') || content.includes('class MCP')) {
                results.mcp.push(filePath);
            } else {
                // Check for deprecated patterns
                const hasDeprecated = deprecatedPatterns.some(pattern => 
                    content.includes(pattern)
                );
                
                if (hasDeprecated) {
                    results.deprecated.push(filePath);
                }
            }
        });
    }
});

console.log('📊 Results:\n');
console.log(`✅ Using MCP: ${results.mcp.length} files`);
results.mcp.forEach(f => console.log(`   - ${f}`));

console.log(`\n❌ Using deprecated patterns: ${results.deprecated.length} files`);
results.deprecated.forEach(f => console.log(`   - ${f}`));

console.log('\n📋 Next Steps:');
console.log('1. Convert deprecated files to MCP pattern');
console.log('2. See MCP_NOTION_GUIDE.md for examples');
console.log('3. Test thoroughly after conversion');