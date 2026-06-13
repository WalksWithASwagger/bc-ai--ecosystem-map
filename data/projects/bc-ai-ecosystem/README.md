# BC AI Ecosystem

**Project Type:** ecosystem
**Created:** 2025-08-04T22:01:37.348Z

## Description
British Columbia AI and tech ecosystem mapping with comprehensive research pipelines

## Data Sources
- Notion Database ID: 

## Research Pipelines
- **discovery**: ✅ Enabled (daily)
- **enrichment**: ✅ Enabled (weekly)
- **funding**: ❌ Disabled (daily)
- **competitive**: ✅ Enabled (weekly)
- **temporal**: ✅ Enabled (manual)

## Directory Structure
```
bc-ai-ecosystem/
├── data/
│   ├── raw/           # Raw scraped data
│   ├── processed/     # Cleaned and normalized
│   ├── enriched/      # AI-enhanced data
│   └── temporal-kg/   # Knowledge graph triplets
├── logs/              # Pipeline execution logs
├── reports/           # Analysis reports
└── discoveries/       # New findings
```

## Quick Start
```bash
cd tools/10-multi-db
node pipeline-runner.js --project bc-ai-ecosystem --pipeline discovery
```
