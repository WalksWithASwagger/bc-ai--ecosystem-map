#!/bin/bash

# Fix all hardcoded Notion tokens in tools directory
# Replace with environment variable references

echo "🔧 Fixing hardcoded Notion tokens in all tool files..."

# List of files with hardcoded tokens
files=(
    "tools/process-remaining-files.js"
    "tools/process-betakit-funding.js"
    "tools/process-batch-import-organizations.js"
    "tools/process-batch-import-fixed.js"
    "tools/fix-database-enhancement.js"
    "tools/process-url-discovery.js"
    "tools/config.js"
    "tools/gather-verified-linkedin-data.js"
    "tools/process-all-remaining-jsons.js"
    "tools/assess-database-gaps.js"
    "tools/process-company-profiles.js"
    "tools/scale-database-enhancement.js"
)

# Old token patterns to replace
old_token1="<REDACTED_NOTION_TOKEN>"
old_token2="<REDACTED_NOTION_TOKEN>"

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "Fixing $file..."
        
        # Replace hardcoded tokens with environment variable
        sed -i '' "s/$old_token1/process.env.NOTION_TOKEN/g" "$file"
        sed -i '' "s/$old_token2/process.env.NOTION_TOKEN/g" "$file"
        
        # Fix config.js specifically
        if [[ "$file" == "tools/config.js" ]]; then
            sed -i '' "s/NOTION_TOKEN: 'process.env.NOTION_TOKEN'/NOTION_TOKEN: process.env.NOTION_TOKEN/g" "$file"
        fi
        
        echo "✅ Fixed $file"
    fi
done

echo "🎉 All hardcoded tokens have been replaced with environment variables!"
echo "💡 Remember to set NOTION_TOKEN environment variable before running scripts."