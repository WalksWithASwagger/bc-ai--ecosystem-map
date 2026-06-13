# 📖 Script Documentation

## 🎯 Purpose
Complete documentation of all scripts in the tools directory, their purpose, and usage.

## 🛡️ CRITICAL: Validation First!

**ALWAYS run validation before ANY import:**
```bash
node tools/00-core/validate-before-import.js data-to-import.json
```

## 📁 Script Categories

### 00-core/ (Critical Infrastructure)
- **validate-before-import.js** - MANDATORY validation before any import
  - Prevents bad data from entering database
  - Checks for suspicious patterns
  - Requires minimum data points

### 01-validation/ (Quality Checks)
- **comprehensive-db-scanner.js** - Scan entire database for problems
- **database-audit.js** - Detailed database quality audit
- **validate-data-quality.js** - Check data completeness
- **validate-database-quality.js** - Overall quality metrics
- **check-database-fields.js** - Verify field consistency

### 02-import/ (Adding Data)
- **smart-data-merger.js** - Intelligent data import with deduplication
- **import-ecosystem-expansion-fixed.js** - Import new organizations
- **batch-add-orgs.js** - Bulk organization import
- **process-batch-import-fixed.js** - Process batch JSON files

### 03-enrichment/ (Enhancing Data)
- **unified-enrichment.js** - All-in-one enrichment tool
- **comprehensive-org-enhancer.js** - Deep organization enhancement
- **priority-enrichment.js** - Enrich high-priority organizations
- **targeted-org-enhancer.js** - Target specific organizations
- **content-research-enhancer.js** - Add descriptions and content

### 04-research/ (Finding Information)
- **comprehensive-company-researcher.js** - Research company details
- **find-missing-logos.js** - Identify organizations needing logos
- **find-unicorns-high-value.js** - Find high-value companies
- **bc-ecosystem-expansion-research.js** - Discover new organizations

### 05-cleanup/ (Maintenance)
- **duplicate-resolver.js** - Find and merge duplicates
- **remove-invalid-urls.js** - Clean up bad URLs
- **schema-field-fixer.js** - Fix field inconsistencies
- **fix-unrealistic-dates.js** - Correct invalid dates

### 06-export/ (Data Export)
- **backup-database.js** - Create database backups
- **generate-ecosystem-growth-analysis.js** - Growth reports
- **generate-final-financial-report.js** - Financial analysis

### 07-utilities/ (Helper Tools)
- **find-org-ids.js** - Look up organization IDs
- **check-notion-schema.js** - Verify database schema
- **test-enrichment.js** - Test enrichment tools

## 📝 Script Usage Patterns

### Daily Operations
```bash
# 1. Check database quality
node tools/01-validation/comprehensive-db-scanner.js

# 2. Import new data (ALWAYS validate first!)
node tools/00-core/validate-before-import.js new-data.json
# If validation passes:
node tools/02-import/smart-data-merger.js new-data.json

# 3. Enrich existing data
node tools/03-enrichment/unified-enrichment.js --limit=50
```

### Weekly Maintenance
```bash
# 1. Full database audit
node tools/01-validation/database-audit.js

# 2. Check for duplicates
node tools/05-cleanup/duplicate-resolver.js

# 3. Create backup
node tools/06-export/backup-database.js
```

### Research Tasks
```bash
# Find organizations missing key data
node tools/04-research/find-missing-logos.js
node tools/04-research/find-unicorns-high-value.js

# Research specific companies
node tools/04-research/comprehensive-company-researcher.js
```

## ⚠️ Important Notes

### Before ANY Import
1. ALWAYS validate data first
2. Check for duplicates
3. Ensure minimum data quality
4. Review validation report

### Data Quality Standards
- Name: Minimum 4 characters
- Required: At least 2 data points
- No test data or placeholders
- Valid URLs must include http(s)://

### Common Mistakes to Avoid
1. Importing without validation
2. Not checking for duplicates
3. Accepting empty data
4. Ignoring validation warnings

## 🔧 Script Maintenance

### Adding New Scripts
1. Place in appropriate category folder
2. Add header documentation
3. Update this documentation
4. Test thoroughly

### Script Header Template
```javascript
/**
 * Script: [name].js
 * Purpose: [What it does]
 * Category: [validation|import|enrichment|research|cleanup|export|utility]
 * Created: [date]
 * Dependencies: @notionhq/client, [others]
 * 
 * Usage:
 *   node [name].js [options]
 * 
 * Options:
 *   --dry-run    Preview without changes
 *   --limit=N    Process only N entries
 */
```

## 🚨 Emergency Procedures

### If Bad Data Gets In
1. Run comprehensive scan immediately
2. Create backup before any cleanup
3. Use cleanup scripts to fix
4. Document what happened

### Database Corruption
1. Stop all operations
2. Create backup of current state
3. Run validation tools
4. Use cleanup scripts carefully

## 📊 Script Dependencies

All scripts require:
- Node.js 14+
- @notionhq/client
- Valid config.js with Notion credentials

Some scripts also need:
- axios (for web requests)
- csv-parse (for CSV handling)
- Other specific dependencies

## 🔒 Security Notes

1. Never commit config.js with credentials
2. Use environment variables when possible
3. Validate all external data
4. Log all operations

---

*Last updated: August 4, 2025*
*Remember: ALWAYS VALIDATE BEFORE IMPORT!*