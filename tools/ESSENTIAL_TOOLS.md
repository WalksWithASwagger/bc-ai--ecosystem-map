# Essential Tools for BC AI Ecosystem Database

## Core Tools (Keep These)

### 1. Database Management
- `mcp-scan-completeness.js` - Analyze database quality metrics
- `find-and-merge-duplicates.js` - Find and merge duplicate entries

### 2. Enrichment Pipeline
- `mcp-email-enricher.js` - Find emails for companies
- `03-enrichment/extract-contact-info.js` - Extract contact data from websites
- `03-enrichment/enhance-websites.js` - Enhance website data

### 3. Research & Discovery
- `04-research/scrape-betakit-funding.js` - Get funding intelligence
- `04-research/scrape-innovate-bc.js` - Discover new BC companies
- `04-research/discover-new-companies.js` - Find new companies

### 4. Import/Export
- `02-import/add-org.js` - Add single organization
- `02-import/import-consolidated-orgs.js` - Batch import organizations

## Tools to Archive (Redundant/Deprecated)

### Duplicate Functionality
- `mcp-check-duplicates.js` - Replaced by find-and-merge-duplicates.js
- `07-utilities/check-active-duplicates.js` - Redundant
- `one-time-scripts/*` - All one-time scripts can be archived

### Legacy/Test Scripts
- `test-tokens.js` - Testing script
- `check-deprecated-patterns.js` - Cleanup script
- `compare-databases.js` - One-time comparison

## Simplified Structure Proposal

```
tools/
├── core/
│   ├── scan-completeness.js
│   ├── merge-duplicates.js
│   └── add-organization.js
├── enrichment/
│   ├── enrich-emails.js
│   ├── enrich-contacts.js
│   ├── enrich-websites.js
│   └── enrich-funding.js
├── research/
│   ├── discover-companies.js
│   ├── scrape-betakit.js
│   └── scrape-innovate-bc.js
└── README.md
```

## Next Steps

1. Move essential tools to new structure
2. Archive redundant tools
3. Create simple documentation
4. Set up automated enrichment pipeline