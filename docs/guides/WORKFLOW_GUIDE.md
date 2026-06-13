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
git clone https://github.com/your-org/ecosystem-map-bc-ai.git
cd ecosystem-map-bc-ai

# Install dependencies
npm install

# Set up configuration
cp scripts/config.sample.js scripts/config.js
# Edit scripts/config.js with your Notion credentials
```

### Configuration File

Edit `scripts/config.js`:

```javascript
module.exports = {
  NOTION_TOKEN: 'your_notion_api_token_here',
  NOTION_DATABASE_ID: 'your_database_id_here'
};
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
./scripts/run-contact-tools.sh
```

Run with live updates (process 10 organizations):

```bash
./scripts/run-contact-tools-live.sh 10
```

### Individual Tool Usage

#### 1. Website Discovery

Find and verify websites for organizations with missing website information:

```bash
# Dry run (recommended first)
node scripts/enhance-websites.js --limit=10 --dryrun

# Live updates
node scripts/enhance-websites.js --limit=10

# Process specific batch
node scripts/enhance-websites.js --limit=20 --batch=2
```

**What it does:**
- Searches for organization websites using intelligent queries
- Verifies websites by checking for organization name mentions
- Provides confidence ratings (high/medium/low)
- Updates Notion database with verified websites

#### 2. LinkedIn Profile Discovery

Discover LinkedIn company profiles:

```bash
# Dry run
node scripts/find-linkedin.js --limit=10 --dryrun

# Live updates
node scripts/find-linkedin.js --limit=10

# Process organizations with websites first (better success rate)
node scripts/find-linkedin.js --limit=50
```

**What it does:**
- Extracts LinkedIn URLs from existing websites
- Generates intelligent LinkedIn company URLs
- Verifies profile URLs match organization names
- Updates Notion database with LinkedIn profiles

#### 3. Contact Information Extraction

Extract emails and phone numbers from websites:

```bash
# Dry run
node scripts/extract-contact-info.js --limit=10 --dryrun

# Live updates (email and phone)
node scripts/extract-contact-info.js --limit=10

# Extract only emails
node scripts/extract-contact-info.js --limit=10 --email

# Extract only phone numbers
node scripts/extract-contact-info.js --limit=10 --phone
```

**What it does:**
- Fetches organization websites and contact pages
- Extracts email addresses using pattern matching
- Extracts phone numbers with validation
- Selects best contact information based on priority patterns
- Updates Notion database with contact information

---

## 📊 Database Analysis Workflows

### Completeness Analysis

Generate comprehensive database completeness reports:

```bash
# Full completeness scan
node scripts/scan-completeness.js

# Results saved to:
# - reports/YYYY-MM-DD_completeness-summary.md
# - reports/YYYY-MM-DD_completeness-detail.csv
```

### Finding Missing Information

#### Missing Contact Information

```bash
# Find organizations missing contact info
node scripts/find-missing-contacts.js

# Results: reports/YYYY-MM-DD_missing-contacts.md
```

#### Missing Key People

```bash
# Find organizations missing key people information
node scripts/find-missing-key-people.js

# Results: reports/YYYY-MM-DD_missing-key-people.md
```

#### Missing Founding Years

```bash
# Find organizations missing year founded
node scripts/find-missing-year-founded.js

# Results: reports/YYYY-MM-DD_missing-year-founded.md
```

#### Missing Logos

```bash
# Identify organizations needing logos
node scripts/prepare-logo-acquisition.js

# Results: reports/YYYY-MM-DD_logo-acquisition-targets.md
```

---

## 🔍 Organization Discovery Workflows

### Finding New Organizations

Identify organizations from markdown files that aren't in the database:

```bash
# Scan discovery files
node scripts/find-new-orgs.js discoveries/2025-08-01_new-discoveries.md

# Scan any markdown file
node scripts/find-new-orgs.js path/to/organizations.md
```

### Adding Organizations

#### Single Organization

Interactive prompt to add one organization:

```bash
# Start interactive session
node scripts/add-org.js

# Add with specific name
node scripts/add-org.js --name "Acme AI Solutions"
```

#### Batch Import

Import multiple organizations from markdown files:

```bash
# Import from discovery files
node scripts/import-discovery-orgs.js discoveries/2025-08-01_batch.md

# Import from general markdown
node scripts/import-consolidated-orgs.js consolidated-list.md
```

---

## 🔄 Data Quality Workflows

### Duplicate Detection

Check for potential duplicates:

```bash
# Check for duplicates (excludes archived pages)
node scripts/check-active-duplicates.js

# Results show similarity scores ≥ 0.9
```

### Data Validation

#### Fix Invalid URLs

Automatically fix website URLs missing https:// prefix:

```bash
node scripts/fix-invalid-urls.js
```

#### Normalize Categories

Standardize category and AI focus area values:

```bash
node scripts/normalize-categories.js
```

### Batch Updates

Update multiple organizations efficiently:

```bash
# Prepare updates file (see examples/sample-updates.json)
node scripts/batch-update.js path/to/updates.json
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
# 1. Generate completeness report
node scripts/scan-completeness.js

# 2. Check for new duplicates
node scripts/check-active-duplicates.js

# 3. Fix data quality issues
node scripts/fix-invalid-urls.js
node scripts/normalize-categories.js

# 4. Run contact enhancement (small batch)
./scripts/run-contact-tools-live.sh 20
```

**Monthly Deep Enhancement:**

```bash
# 1. Full completeness analysis
node scripts/scan-completeness.js

# 2. Identify priority gaps
node scripts/find-missing-contacts.js
node scripts/find-missing-key-people.js
node scripts/find-missing-year-founded.js

# 3. Large-scale contact enhancement
./scripts/run-contact-tools-live.sh 100

# 4. Logo acquisition planning
node scripts/prepare-logo-acquisition.js
```

---

## 🛠️ Troubleshooting

### Common Issues

#### Authentication Errors

```bash
# Error: "Notion token and database ID are required"
# Solution: Check scripts/config.js or environment variables
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
# Check if a page is archived
node scripts/check-page-status.js PAGE_ID

# Archive a page
node scripts/archive-page.js PAGE_ID

# Unarchive a page
node scripts/unarchive-page.js PAGE_ID
```

#### Verbose Logging

Add `--verbose` flag to most scripts for detailed logging:

```bash
node scripts/enhance-websites.js --limit=5 --verbose --dryrun
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
# Daily contact enhancement (small batch)
0 9 * * * cd /path/to/project && ./scripts/run-contact-tools-live.sh 10

# Weekly quality check
0 9 * * 1 cd /path/to/project && node scripts/scan-completeness.js

# Monthly comprehensive enhancement
0 9 1 * * cd /path/to/project && ./scripts/run-contact-tools-live.sh 50
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
      - run: node scripts/scan-completeness.js
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
2. **Review script documentation** in `scripts/README.md`
3. **Check GitHub Issues** for known problems
4. **Create new issues** for bugs or feature requests

### Contributing

1. **Follow the contributing guidelines** in `CONTRIBUTING.md`
2. **Test all changes** with dry runs before submitting
3. **Document new features** and update this workflow guide
4. **Submit pull requests** with clear descriptions

---

*Last updated: August 1, 2025*

**[🏠 Back to README](README.md)** • **[🔧 Enhancement Tools](ENHANCEMENT_TOOLS.md)** • **[📝 Changelog](CHANGELOG.md)** 