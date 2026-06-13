#!/bin/bash
# Script to run contact enhancement tools with actual updates
# Usage: ./run-contact-tools-live.sh [limit]

# Export environment variables if available
if [ -n "$NOTION_TOKEN" ] && [ -n "$NOTION_DATABASE_ID" ]; then
  export NOTION_TOKEN
  export NOTION_DATABASE_ID
else
  echo "Warning: NOTION_TOKEN and/or NOTION_DATABASE_ID environment variables not set."
  echo "Make sure they are set in your environment or in scripts/config.js"
fi

# Set limit (default: 50 - optimal batch size for processing)
LIMIT=${1:-50}

# Create reports directory if it doesn't exist
mkdir -p reports

echo "===== Running Website Enhancement Tool (LIVE) ====="
echo "Processing $LIMIT organizations..."
node enhance-websites.js --limit=$LIMIT

echo "===== Running LinkedIn Discovery Tool (LIVE) ====="
echo "Processing $LIMIT organizations..."
node find-linkedin.js --limit=$LIMIT

echo "===== Running Contact Information Extraction Tool (LIVE) ====="
echo "Processing $LIMIT organizations..."
node extract-contact-info.js --limit=$LIMIT

echo "===== Live Run Complete ====="
echo "Check the reports directory for detailed results" 