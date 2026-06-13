# 📁 Script Organization Plan

## Current State: 192 files in tools/ directory
Need to organize into logical categories for maintainability.

## 📋 Proposed Structure

```
tools/
├── README.md (main documentation)
├── config.js (shared configuration)
├── package.json
│
├── 01-validation/
│   ├── comprehensive-db-scanner.js
│   ├── database-audit.js
│   ├── validate-data-quality.js
│   ├── validate-database-quality.js
│   └── check-database-fields.js
│
├── 02-import/
│   ├── import-ecosystem-expansion-fixed.js
│   ├── import-phase2-simplified.js
│   ├── batch-add-orgs.js
│   ├── process-batch-import-fixed.js
│   └── smart-data-merger.js
│
├── 03-enrichment/
│   ├── unified-enrichment.js
│   ├── comprehensive-org-enhancer.js
│   ├── priority-enrichment.js
│   ├── targeted-org-enhancer.js
│   └── content-research-enhancer.js
│
├── 04-research/
│   ├── comprehensive-company-researcher.js
│   ├── research-data-parser.js
│   ├── find-missing-logos.js
│   ├── find-unicorns-high-value.js
│   └── bc-ecosystem-expansion-research.js
│
├── 05-cleanup/
│   ├── mass-delete-suspicious.js
│   ├── duplicate-resolver.js
│   ├── remove-invalid-urls.js
│   ├── schema-field-fixer.js
│   └── fix-unrealistic-dates.js
│
├── 06-export/
│   ├── backup-database.js
│   ├── generate-ecosystem-growth-analysis.js
│   └── generate-final-financial-report.js
│
├── 07-utilities/
│   ├── find-org-ids.js
│   ├── check-notion-schema.js
│   ├── geocode-csv.js
│   └── test-enrichment.js
│
├── archive/
│   ├── legacy-2025-08-04/
│   └── one-time-scripts/
│
└── _templates/
    └── script-template.js
```

## 🗂️ Categories Explained

### 01-validation/
Scripts that audit, validate, and check data quality

### 02-import/
Scripts that add new data to the database

### 03-enrichment/
Scripts that enhance existing data with additional information

### 04-research/
Scripts that discover new companies or research data

### 05-cleanup/
Scripts that fix, remove, or clean problematic data

### 06-export/
Scripts that export data or generate reports

### 07-utilities/
Helper scripts and utilities

### archive/
Old scripts kept for reference but not actively used

### _templates/
Templates for creating new scripts

## 🏷️ Naming Convention

```
[action]-[target]-[modifier].js

Examples:
- validate-data-quality.js
- import-phase2-companies.js
- enrich-contact-info.js
- research-missing-logos.js
- cleanup-duplicate-entries.js
- export-financial-report.js
```

## 📝 Script Header Template

Every script should start with:

```javascript
/**
 * Script: [script-name].js
 * Purpose: [What this script does]
 * Category: [validation|import|enrichment|research|cleanup|export|utility]
 * Created: [date]
 * Dependencies: @notionhq/client, [others]
 * 
 * Usage:
 *   node [script-name].js [options]
 * 
 * Options:
 *   --dry-run    Preview changes without applying
 *   --limit=N    Process only N entries
 */
```

## ⚠️ Scripts to Archive

### Redundant/Duplicate Functionality
- Multiple LinkedIn update scripts
- Various add-companies scripts with similar functions
- Old research scripts superseded by newer versions

### One-time Migration Scripts
- Scripts specific to July 2025 migrations
- Initial import scripts no longer needed

### Broken/Incomplete Scripts
- Scripts with hardcoded IDs
- Scripts missing proper error handling

## 🚀 Implementation Steps

1. Create new directory structure
2. Move scripts to appropriate categories
3. Update imports/requires in moved scripts
4. Archive old/unused scripts
5. Update documentation
6. Test key scripts still work
7. Create index/README in each category