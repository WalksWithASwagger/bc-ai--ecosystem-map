#!/bin/bash

# Archive deprecated non-MCP tools
# This script moves old tools using environment variables to an archive folder

echo "🗄️ Archiving deprecated non-MCP tools..."
echo "======================================="

# Create archive directory
ARCHIVE_DIR="archive/deprecated-tools-$(date +%Y-%m-%d)"
mkdir -p "$ARCHIVE_DIR"

# Create a deprecation notice
cat > "$ARCHIVE_DIR/DEPRECATION_NOTICE.md" << EOF
# ⚠️ DEPRECATED TOOLS

These tools have been deprecated in favor of MCP (Model Context Protocol) versions.

**Deprecation Date:** $(date +"%Y-%m-%d")

## Why Deprecated?
- Used environment variables (process.env.NOTION_TOKEN)
- Required configuration files
- Less reliable than MCP direct access

## Migration
All functionality has been migrated to MCP versions:
- Use \`mcp-*.js\` tools instead
- See [MCP_NOTION_GUIDE.md](../../MCP_NOTION_GUIDE.md) for details

## DO NOT USE THESE TOOLS!
They are archived for historical reference only.
EOF

# Move deprecated tools
echo "Moving deprecated tools to archive..."

# Move config files
if [ -f "tools/config.js" ]; then
    mv tools/config.js "$ARCHIVE_DIR/"
    echo "✓ Moved config.js"
fi

if [ -f "templates/config.sample.js" ]; then
    mv templates/config.sample.js "$ARCHIVE_DIR/"
    echo "✓ Moved config.sample.js"
fi

# Move .env files
find . -name ".env*" -type f -exec mv {} "$ARCHIVE_DIR/" \; 2>/dev/null
echo "✓ Moved .env files"

# Create placeholder scripts for commonly used tools
cat > "tools/01-validation/database-audit.js" << 'EOF'
#!/usr/bin/env node
console.error('❌ This tool has been deprecated!');
console.error('Use the MCP version instead:');
console.error('   node tools/mcp-database-audit.js');
console.error('\nSee MCP_NOTION_GUIDE.md for details');
process.exit(1);
EOF

cat > "tools/07-utilities/scan-completeness.js" << 'EOF'
#!/usr/bin/env node
console.error('❌ This tool has been deprecated!');
console.error('Use the MCP version instead:');
console.error('   node tools/mcp-scan-completeness.js');
console.error('\nSee MCP_NOTION_GUIDE.md for details');
process.exit(1);
EOF

echo "✓ Created deprecation stubs for common tools"

# Update package.json to remove dotenv if present
if grep -q "dotenv" package.json; then
    echo "✓ Note: Remove 'dotenv' from package.json dependencies"
fi

echo ""
echo "✅ Archiving complete!"
echo "   Archive location: $ARCHIVE_DIR"
echo "   Deprecated tools: $(find "$ARCHIVE_DIR" -name "*.js" | wc -l) files"
echo ""
echo "📌 Next steps:"
echo "   1. Remove 'dotenv' from package.json"
echo "   2. Run 'npm uninstall dotenv'"
echo "   3. Test MCP tools to ensure they work"
echo "   4. Delete old tool files after confirming MCP versions work"