# BC AI Ecosystem Enrichment Guide

## 🎯 Purpose
Systematically enrich the BC AI companies database with valid, verified data.

## 🛠️ Main Tool: Unified Enrichment

### Usage
```bash
# Enrich 50 companies (newest first)
NOTION_TOKEN=xxx NOTION_DATABASE_ID=xxx node tools/unified-enrichment.js --limit=50

# Enrich specific year
NOTION_TOKEN=xxx NOTION_DATABASE_ID=xxx node tools/unified-enrichment.js --year=2025

# Test run
node tools/unified-enrichment.js --limit=5
```

### What it does
1. **Finds Emails** - Scrapes websites, validates format, no .png files!
2. **Finds Years** - Extracts founding year from website text
3. **Finds AI Focus** - Identifies AI technology areas
4. **Updates Notion** - Saves all valid data directly

### Data Quality Rules
- ❌ No emails ending in .png, .jpg, etc
- ❌ No example.com or test emails
- ❌ No years > current year
- ✅ Prefer business emails (info@, contact@)
- ✅ All data must have sources
- ✅ Confidence scores tracked

## 📁 File Structure
```
/tools/
  unified-enrichment.js      # Main enrichment tool
  comprehensive-company-researcher.js  # Deep research (AI focus, logos)
  
/logs/unified/
  enrichments.jsonl         # All enrichment activities
  
/data/unified/
  enrichment-summary-*.json # Daily summaries
  
/logos/
  *.png, *.svg             # Downloaded company logos
```

## 🔄 Workflow

### Daily Enrichment
1. Run unified enrichment for 50-100 companies
2. Review logs for any issues
3. Check data quality in Notion

### Weekly Tasks
1. Focus on companies founded in current/previous year
2. Run logo downloader for companies missing logos
3. Generate enrichment report

### Monthly Review
1. Analyze enrichment coverage
2. Identify gaps (companies with no email, year, etc)
3. Plan targeted campaigns

## 📊 Monitoring

### Check Progress
```bash
# Count enrichments
grep "✅" logs/unified/enrichments.jsonl | wc -l

# View recent activity
tail -20 logs/unified/enrichments.jsonl | jq .
```

### Generate Report
```bash
# Summary of all enrichments
cat data/unified/enrichment-summary-*.json | jq -s '
  {
    total_processed: [.[].results.processed] | add,
    total_emails: [.[].results.emails] | add,
    total_years: [.[].results.years] | add,
    total_ai_focus: [.[].results.aiFocus] | add
  }
'
```

## ⚠️ Important Notes

1. **Rate Limiting** - 2 second delay between companies
2. **Validation** - All emails checked for file extensions
3. **Prioritization** - Newest companies first (2025→older)
4. **Logging** - Everything logged to `logs/unified/`

## 🚀 Quick Start

```bash
# 1. Set environment variables
export NOTION_TOKEN="your-token"
export NOTION_DATABASE_ID="your-db-id"

# 2. Run enrichment
node tools/unified-enrichment.js --limit=20

# 3. Check results
tail logs/unified/enrichments.jsonl
```

---
*Keep the database rich with valid, verified data!*