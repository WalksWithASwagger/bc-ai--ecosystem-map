# BC AI Ecosystem Tools

## Core Tools

### 1. `unified-enrichment.js` ⭐
**Purpose**: Main enrichment tool - finds emails, years, AI focus  
**Usage**: `NOTION_TOKEN=xxx node tools/unified-enrichment.js --limit=50`

### 2. `comprehensive-company-researcher.js`
**Purpose**: Deep research - AI focus areas, key people, logos  
**Usage**: `NOTION_TOKEN=xxx node tools/comprehensive-company-researcher.js --limit=20`

## Specialized Tools

### Email Discovery
- `scrapers/advanced-email-finder.js` - Multi-strategy email finder
- `scrapers/domain-email-patterns.js` - Generate email patterns from domains

### Data Discovery  
- `scrapers/scrape-founding-years.js` - Find founding years from websites
- `scrapers/discover-new-companies.js` - Find companies not in database
- `scrapers/scrape-betakit-funding.js` - Scrape funding announcements

### Utility Tools
- `utility/batch-update.js` - Bulk update Notion entries
- `utility/batch-import-companies.js` - Import new companies

## Data Quality Rules

✅ **Valid Data**:
- Emails: business addresses (info@, contact@, hello@)
- Years: 1990-present
- Websites: http/https only
- All data must have sources

❌ **Invalid Data**:
- Emails ending in .png, .jpg, etc
- Example/test emails
- Future years
- Localhost URLs

## Quick Start

```bash
# Set credentials
export NOTION_TOKEN="xxx"
export NOTION_DATABASE_ID="xxx"

# Run main enrichment
node tools/unified-enrichment.js --limit=50

# Find new companies
node tools/scrapers/discover-new-companies.js

# Deep research
node tools/comprehensive-company-researcher.js --limit=20
```

## Logs & Data

- `/logs/unified/` - Enrichment activity logs
- `/data/unified/` - Summary reports
- `/logos/` - Downloaded company logos

---
*Keep it simple, keep it valid, keep it logged!*