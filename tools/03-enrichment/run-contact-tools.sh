#!/bin/bash
# Script to run contact enhancement tools with proper environment variables
# Usage: ./run-contact-tools.sh

# Export environment variables if available
if [ -n "$NOTION_TOKEN" ] && [ -n "$NOTION_DATABASE_ID" ]; then
  export NOTION_TOKEN
  export NOTION_DATABASE_ID
else
  echo "Warning: NOTION_TOKEN and/or NOTION_DATABASE_ID environment variables not set."
  echo "Make sure they are set in your environment or in scripts/config.js"
fi

# Create reports directory if it doesn't exist
mkdir -p reports

echo "===== Running Website Enhancement Tool (Dry Run) ====="
node tools/enhancement/enhance-websites.js --limit=5 --dryrun

echo "===== Running LinkedIn Discovery Tool (Dry Run) ====="
node tools/enhancement/find-linkedin.js --limit=5 --dryrun

echo "===== Running Contact Information Extraction Tool (Dry Run) ====="
node tools/enhancement/extract-contact-info.js --limit=5 --dryrun

echo "===== Dry Run Complete ====="
echo "To run with actual updates, use run-contact-tools-live.sh" 