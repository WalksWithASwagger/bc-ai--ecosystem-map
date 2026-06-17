# BC AI Ecosystem Atlas - Workflow Guide

*Complete operational procedures for database management and enhancement*

---

## 🎯 Overview

This guide provides step-by-step procedures for managing and enhancing the BC AI Ecosystem Atlas database using our comprehensive toolkit.

---

## 🔧 Setup & Configuration

### Prerequisites

1. **Node.js** (v16 or higher)
2. **Notion API Access** with database permissions
3. **Git** for version control

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/WalksWithASwagger/bc-ai--ecosystem-map.git
cd bc-ai--ecosystem-map

# Install dependencies
npm install

# Set Notion credentials in your local shell or untracked .env file
export NOTION_TOKEN=secret_xxx
export NOTION_DATABASE_ID=1f0c6f799a3381bd8332ca0235c24655
```

### Secret Handling

Never hard-code Notion tokens in source files, examples, committed config, or generated reports. Tools should read credentials from the environment and fail clearly when required variables are missing:

```javascript
const notionToken = process.env.NOTION_TOKEN;
const databaseId = process.env.NOTION_DATABASE_ID;
```

---

## 💰 Financial Intelligence Workflows

### Quick Start: Intelligence Gathering Pipeline

**Step 1: Identify Priority Targets**
```bash
# Find organizations most likely to have funding data
node tools/find-priority-intelligence-targets.js
```

**Step 2: Manual Research & Entry**
```bash
# Interactive research tool for systematic data collection
node tools/enhancement/batch-research-priority-orgs.js

# Or enter data for specific organization
node tools/enhancement/manual-intelligence-entry.js
```

**Step 3: Validate Intelligence**
```bash
# Cross-reference and validate collected data
node tools/enhancement/validate-intelligence.js data/research/[latest-research].json
```

**Step 4: Apply to Database**
```bash
# Dry run first
node tools/enhancement/apply-validated-intelligence.js --updates=validated-updates.json --dryrun

# Apply updates
node tools/enhancement/apply-validated-intelligence.js --updates=validated-updates.json --no-dryrun
```

### Intelligence Gathering Best Practices

1. **Research Priority Organizations First**
   - Focus on startups/scale-ups (most likely to have funding)
   - Organizations with existing websites (easier to verify)
   - High-profile companies (more public information)

2. **Use Multiple Sources**
   - Crunchbase for funding rounds
   - LinkedIn for employee counts
   - Company websites for press releases
   - TechCrunch/BetaKit for recent news

3. **Always Include Citations**
   - Copy exact URLs for all data points
   - Note the date information was verified
   - Track source reliability (primary vs. secondary)

---

## 🌐 Contact Enhancement Workflows

### Quick Start: Contact Enhancement Suite

Run all contact enhancement tools in dry run mode:

```bash
npm run enrich -- --help
```

Preview a small update batch before any live write:

```bash
npm run enrich -- emails --limit=10 --dry-run
```

### Package Entry Points

Use the package scripts instead of retired `scripts/*.js` paths:

```bash
npm run mcp -- --help
npm run analyze -- --help
npm run enrich -- --help
```

Common enrichment actions should start in preview mode:

```bash
npm run enrich -- emails --limit=10 --dry-run
npm run enrich -- websites --limit=10 --dry-run
npm run enrich -- people --limit=10 --dry-run
```

Only remove `--dry-run` after reviewing output and confirming the Notion credentials point at the intended database.

---

## 📊 Database Analysis Workflows

### Completeness Analysis

Generate comprehensive database completeness reports:

```bash
npm run analyze -- completeness --report
```

### Finding Missing Information

#### Missing Contact Information

```bash
# Find organizations missing contact info
npm run analyze -- missing --field=Email --limit=50
```

#### Missing Key People

```bash
# Find organizations missing key people information
npm run analyze -- missing --field="Key People" --limit=50
```

#### Missing Founding Years

```bash
# Find organizations missing year founded
npm run analyze -- missing --field="Year Founded" --limit=50
```

#### Missing Logos

```bash
# Identify organizations needing logos
npm run analyze -- missing --field=Logo --limit=50
```

---

## 🔍 Organization Discovery Workflows

### Finding New Organizations

Identify organizations from markdown files that aren't in the database:

```bash
npm run mcp -- --help
```

### Adding Organizations

#### Single Organization

Interactive prompt to add one organization:

```bash
npm run mcp -- --help
```

#### Batch Import

Import multiple organizations from markdown files:

```bash
npm run mcp -- --help
```

---

## 🔄 Data Quality Workflows

### Duplicate Detection

Check for potential duplicates:

```bash
# Check for duplicates (excludes archived pages)
npm run analyze -- duplicates

# Results show similarity scores ≥ 0.9
```

### Data Validation

#### Fix Invalid URLs

Automatically fix website URLs missing https:// prefix:

```bash
npm run analyze -- quality
```

#### Normalize Categories

Standardize category and AI focus area values:

```bash
npm run analyze -- quality
```

### Batch Updates

Update multiple organizations efficiently:

```bash
npm run mcp -- --help
```

Example updates.json:

```json
[
  {
    "pageId": "page-id-1",
    "updates": {
      "Website": { "url": "https://example.com" },
      "LinkedIn": { "url": "https://linkedin.com/company/example" }
    }
  }
]
```

---

## 📈 Enhancement Strategies

### Systematic Contact Enhancement

**Phase 1: Website Discovery**
1. Run website enhancement on all organizations missing websites
2. Review and validate results
3. Proceed to Phase 2

**Phase 2: LinkedIn Discovery**
1. Run LinkedIn discovery (prioritize organizations with websites)
2. Validate high-confidence matches
3. Proceed to Phase 3

**Phase 3: Contact Extraction**
1. Run contact extraction on organizations with websites
2. Review extracted information for quality
3. Manual verification for high-value organizations

### Quality Improvement Workflow

**Weekly Quality Review:**

```bash
# 1. Generate completeness report options
npm run analyze -- --help

# 2. Check enrichment options before live writes
npm run enrich -- --help

# 3. Run a contact enhancement dry run
npm run enrich -- emails --limit=20 --dry-run
```

**Monthly Deep Enhancement:**

```bash
# 1. Full completeness analysis options
npm run analyze -- --help

# 2. Identify priority gap workflows
npm run mcp -- --help

# 3. Large-scale contact enhancement dry run
npm run enrich -- emails --limit=100 --dry-run
```

---

## 🛠️ Troubleshooting

### Common Issues

#### Authentication Errors

```bash
# Error: "Notion token and database ID are required"
# Solution: set NOTION_TOKEN and NOTION_DATABASE_ID in your environment
```

#### Rate Limiting

```bash
# Error: "Too many requests"
# Solution: Use smaller batch sizes (--limit=5) and add delays
```

#### Network Timeouts

```bash
# Error: "Request timeout"
# Solution: Check internet connection, reduce batch size
```

### Debugging Tools

#### Check Page Status

```bash
npm run mcp -- --help
```

#### Verbose Logging

Start with package help output when debugging available actions:

```bash
npm run mcp -- --help
```

---

## 📊 Reporting & Documentation

### Generated Reports

All scripts generate reports in the `reports/` directory:

- **Completeness Reports**: Database quality analysis
- **Enhancement Reports**: Results of contact enhancement tools
- **Missing Information Reports**: Gaps in database coverage
- **Import Reports**: Results of organization imports

### Report Formats

- **Markdown (.md)**: Human-readable summaries with links
- **CSV (.csv)**: Machine-readable data for analysis
- **JSON (.json)**: Structured data for automation

---

## 🔄 Automation & Scheduling

### Automated Workflows

Create scheduled tasks for regular maintenance:

```bash
# Daily contact enhancement dry run (small batch)
0 9 * * * cd /path/to/project && npm run enrich -- emails --limit=10 --dry-run

# Weekly quality check
0 9 * * 1 cd /path/to/project && npm run analyze -- --help

# Monthly comprehensive enhancement dry run
0 9 1 * * cd /path/to/project && npm run enrich -- emails --limit=50 --dry-run
```

### CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Database Quality Check
on:
  schedule:
    - cron: '0 9 * * 1'  # Weekly on Monday
  workflow_dispatch:

jobs:
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run analyze -- completeness --report
        env:
          NOTION_TOKEN: ${{ secrets.NOTION_TOKEN }}
          NOTION_DATABASE_ID: ${{ secrets.NOTION_DATABASE_ID }}
```

---

## 📚 Best Practices

### Data Enhancement

1. **Always run dry runs first** to validate changes
2. **Start with small batches** (5-10 organizations) for new tools
3. **Review results** before scaling up to larger batches
4. **Prioritize high-value organizations** for manual verification
5. **Document all significant changes** in CHANGELOG.md

### Quality Assurance

1. **Regular completeness scans** to track progress
2. **Duplicate detection** after major imports
3. **Data validation** before and after batch operations
4. **Backup important data** before major changes
5. **Version control** all configuration and script changes

### Performance Optimization

1. **Use appropriate batch sizes** to avoid rate limiting
2. **Process organizations with websites first** for better success rates
3. **Run time-intensive operations during off-peak hours**
4. **Monitor API usage** to stay within limits
5. **Cache results** when possible to avoid redundant requests

---

## 🆘 Support & Community

### Getting Help

1. **Check this workflow guide** for standard procedures
2. **Review tool documentation** in `tools/README.md`
3. **Check GitHub Issues** for known problems
4. **Create new issues** for bugs or feature requests

### Contributing

1. **Follow the contributing guidelines** in `CONTRIBUTING.md`
2. **Test all changes** with dry runs before submitting
3. **Document new features** and update this workflow guide
4. **Submit pull requests** with clear descriptions

---

*Last updated: June 17, 2026*

**[🏠 Back to README](../../README.md)** • **[🔧 Tool Docs](../../tools/README.md)** • **[📝 Changelog](../../CHANGELOG.md)**
