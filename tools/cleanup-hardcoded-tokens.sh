#!/bin/bash

echo "🔧 Final cleanup of hardcoded Notion tokens..."

# List of files that still have hardcoded tokens as fallbacks
files_to_clean=(
    "tools/import-phase2-simplified.js"
    "tools/import-phase2-expansion-to-notion.js"
    "tools/import-ecosystem-expansion-fixed.js"
    "tools/import-phase4-fixed.js"
    "tools/check-notion-schema.js"
    "tools/import-phase4-simplified.js"
    "tools/import-phase3-simplified.js"
)

for file in "${files_to_clean[@]}"; do
    if [ -f "$file" ]; then
        echo "Cleaning $file..."
        # Remove the hardcoded token fallback and require environment variable
        sed -i '' 's/const NOTION_TOKEN = process\.env\.NOTION_TOKEN || "ntn_[^"]*";/const NOTION_TOKEN = process.env.NOTION_TOKEN;/' "$file"
        sed -i '' 's/const NOTION_DATABASE_ID = process\.env\.NOTION_DATABASE_ID || "[^"]*";/const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;/' "$file"
        
        # Add proper error handling
        if ! grep -q "if (!NOTION_TOKEN || !NOTION_DATABASE_ID)" "$file"; then
            # Add error handling after the token definitions
            sed -i '' '/const NOTION_DATABASE_ID = process\.env\.NOTION_DATABASE_ID;/a\
\
if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {\
    console.error("❌ Missing required environment variables: NOTION_TOKEN and NOTION_DATABASE_ID");\
    console.error("Please set these environment variables before running this script.");\
    process.exit(1);\
}' "$file"
        fi
        echo "✅ Cleaned $file"
    else
        echo "⚠️  File not found: $file"
    fi
done

echo "🎉 All hardcoded tokens removed! Scripts now require proper environment variables."