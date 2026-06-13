# Funding Intelligence Database

**Project Type:** funding
**Created:** 2025-08-04T22:01:37.350Z

## Description
Comprehensive database of VCs, funds, and investment opportunities

## Data Sources
- Notion Database ID: 

## Research Pipelines
- **discovery**: ✅ Enabled (daily)
- **enrichment**: ✅ Enabled (weekly)
- **funding**: ✅ Enabled (daily)
- **competitive**: ✅ Enabled (weekly)
- **temporal**: ✅ Enabled (manual)

## Directory Structure
```
funding-intelligence/
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
node pipeline-runner.js --project funding-intelligence --pipeline discovery
```
