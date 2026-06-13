#!/bin/bash

echo "🧹 Consolidating Essential Tools..."

# Core tools
cp mcp-scan-completeness.js core/scan-completeness.js
cp find-and-merge-duplicates.js core/merge-duplicates.js
cp 02-import/add-org.js core/add-organization.js 2>/dev/null || echo "add-org.js not found"

# Enrichment tools
cp mcp-email-enricher.js enrichment/enrich-emails.js
cp 03-enrichment/extract-contact-info.js enrichment/enrich-contacts.js 2>/dev/null || echo "extract-contact-info.js not found"
cp 03-enrichment/enhance-websites.js enrichment/enrich-websites.js 2>/dev/null || echo "enhance-websites.js not found"

# Research tools
cp 04-research/discover-new-companies.js research/discover-companies.js 2>/dev/null || echo "discover-new-companies.js not found"
cp 04-research/scrape-betakit-funding.js research/scrape-betakit.js 2>/dev/null || echo "scrape-betakit-funding.js not found"
cp 04-research/scrape-innovate-bc.js research/scrape-innovate-bc.js 2>/dev/null || echo "scrape-innovate-bc.js not found"

# Archive old directories
echo "📦 Archiving old tool directories..."
mv 00-core _archive/ 2>/dev/null || echo "00-core already archived"
mv 01-validation _archive/ 2>/dev/null || echo "01-validation already archived"
mv 05-cleanup _archive/ 2>/dev/null || echo "05-cleanup already archived"
mv 06-export _archive/ 2>/dev/null || echo "06-export already archived"
mv 07-utilities _archive/ 2>/dev/null || echo "07-utilities already archived"
mv 08-pipelines _archive/ 2>/dev/null || echo "08-pipelines already archived"
mv 09-temporal-kg _archive/ 2>/dev/null || echo "09-temporal-kg already archived"
mv one-time-scripts _archive/ 2>/dev/null || echo "one-time-scripts already archived"

# Move MCP tools to archive
mv mcp-check-duplicates.js _archive/ 2>/dev/null || echo "mcp-check-duplicates.js already archived"
mv mcp-constants.js _archive/ 2>/dev/null || echo "mcp-constants.js already archived"
mv mcp-base.js _archive/ 2>/dev/null || echo "mcp-base.js already archived"
mv mcp-manager.js _archive/ 2>/dev/null || echo "mcp-manager.js already archived"
mv migrate-to-mcp.js _archive/ 2>/dev/null || echo "migrate-to-mcp.js already archived"

echo "✅ Tool consolidation complete!"
echo ""
echo "New structure:"
echo "  tools/core/        - Essential database tools"
echo "  tools/enrichment/  - Data enrichment tools"  
echo "  tools/research/    - Company discovery tools"
echo "  tools/_archive/    - Archived old tools"