# BC AI Ecosystem Tools - Consolidated Suite

*Professional tools for AI company research, enrichment, and database management*

## 🚀 **The Big 5: Master Tools**

### 1. `ai-company-researcher.js` 🔍
**Deep Research & Intelligence Gathering**
- Comprehensive company research with funding, key people, AI focus
- Website analysis and competitive intelligence
- Automated research query generation
- Source citation and verification tracking

```bash
# Research AI companies missing funding data
node ai-company-researcher.js --funding --limit=10

# Research all AI companies for key people
node ai-company-researcher.js --key-people --limit=20

# Research all companies (not just AI)
node ai-company-researcher.js --all-companies --limit=15
```

### 2. `ai-company-enricher.js` 📧
**Contact & Basic Data Enrichment**
- Website discovery with intelligent domain testing
- Email extraction from websites and contact pages
- LinkedIn profile discovery
- Phone number extraction and validation

```bash
# Enrich companies missing websites
node ai-company-enricher.js --type=websites --limit=25

# Enrich companies missing emails (requires websites)
node ai-company-enricher.js --type=emails --limit=50

# Full enrichment (websites, emails, LinkedIn, phones)
node ai-company-enricher.js --limit=30
```

### 3. `ai-company-importer.js` 📥
**Smart Company Import with Duplicate Detection**
- JSON file imports with intelligent duplicate detection
- BC Tech ecosystem category mapping
- AI focus area standardization
- Fuzzy name matching and similarity scoring

```bash
# Import with dry run preview
node ai-company-importer.js data/bc-tech-companies.json --dry-run

# Import allowing duplicates
node ai-company-importer.js data/new-companies.json --allow-duplicates

# Standard import
node ai-company-importer.js data/companies.json
```

### 4. `database-scanner.js` 📊
**Quality Analysis & Completeness Reporting**
- Comprehensive database completeness analysis
- AI company priority field tracking
- Category breakdown and quality metrics
- Enhancement priority identification

```bash
# Generate full quality report
node database-scanner.js

# Reports saved to: data/quality-reports/
```

### 5. `duplicate-merger.js` 🔀
**Intelligent Duplicate Detection & Merging**
- Advanced similarity scoring with name and domain matching
- Smart data merging preserving the most complete information
- Automatic archiving of duplicates after merge
- Configurable similarity thresholds

```bash
# Find and merge duplicates (dry run)
node duplicate-merger.js --dry-run

# Merge with custom threshold
node duplicate-merger.js --threshold=0.9

# Standard merge (85% similarity threshold)
node duplicate-merger.js
```

---

## 📁 **File Structure**

```
tools/
├── ai-company-researcher.js     # Deep research & intelligence
├── ai-company-enricher.js       # Contact & basic enrichment  
├── ai-company-importer.js       # Smart import with deduplication
├── database-scanner.js          # Quality analysis & reporting
├── duplicate-merger.js          # Duplicate detection & merging
├── README.md                    # This file
└── archive/                     # Old tools (192+ files archived)
```

---

## 🎯 **Daily Workflow**

### **Morning Routine**
```bash
# 1. Check database quality
node database-scanner.js

# 2. Find and merge any duplicates
node duplicate-merger.js --dry-run
# (Review results, then run without --dry-run if needed)
```

### **Weekly Enhancement**
```bash
# 1. Enrich companies missing basic data
node ai-company-enricher.js --limit=50

# 2. Research high-priority AI companies
node ai-company-researcher.js --funding --limit=20
```

### **New Data Import**
```bash
# 1. Import new companies
node ai-company-importer.js data/new-batch.json --dry-run
# (Review, then import without --dry-run)

# 2. Check for duplicates after import
node duplicate-merger.js

# 3. Enrich new companies
node ai-company-enricher.js --limit=30
```

---

## 🛡️ **Data Quality Standards**

**✅ What We Do:**
- Real, verified data only (no simulation or guessing)
- Source citations for all research
- Intelligent duplicate detection and merging
- Comprehensive validation before database updates
- Respectful website crawling with delays

**❌ What We Don't Do:**
- Add fake or simulated data
- Auto-generate LinkedIn profiles
- Overwhelm websites with rapid requests
- Import without duplicate checking
- Update database without verification

---

## 📊 **Output & Reports**

All tools generate comprehensive reports in structured directories:

- **Research**: `data/research/ai-company-research-YYYY-MM-DD.json`
- **Enrichment**: `data/enrichment/ai-company-enrichment-YYYY-MM-DD.json`
- **Imports**: `data/imports/import-report-YYYY-MM-DD.json`
- **Quality**: `data/quality-reports/database-quality-YYYY-MM-DD.md`
- **Duplicates**: `data/duplicates/duplicate-merge-YYYY-MM-DD.json`

---

## 🔧 **Configuration**

All tools use direct Notion API access with embedded credentials:

```javascript
// Built-in configuration (MCP pattern)
const NOTION_TOKEN = '<REDACTED_NOTION_TOKEN>';
const DATABASE_ID = '1f0c6f799a3381bd8332ca0235c24655';
```

No environment variables needed - tools work out of the box.

---

## 📈 **Success Metrics**

Track your ecosystem research progress:

- **Database Completeness**: Monitor overall quality scores
- **AI Company Coverage**: Track priority field completion
- **Research Depth**: Measure funding/key people data richness  
- **Data Freshness**: Monitor last verification dates
- **Duplicate Control**: Keep duplicate rate under 1%

---

## 🎓 **Advanced Usage**

### **Batch Processing**
```bash
# Process multiple files
for file in data/imports/*.json; do
  node ai-company-importer.js "$file" --dry-run
done
```

### **Custom Research Workflows**
```bash
# Research pipeline for new AI companies
node ai-company-researcher.js --limit=10 > research.log
node ai-company-enricher.js --type=emails --limit=10 >> research.log
node database-scanner.js >> research.log
```

### **Quality Assurance Pipeline**
```bash
# Full QA workflow
node duplicate-merger.js --dry-run
node database-scanner.js
node ai-company-enricher.js --type=websites --limit=25
node database-scanner.js  # Check improvement
```

---

**🌟 Keep it simple, keep it quality, keep it growing!**

*Last updated: January 30, 2025*