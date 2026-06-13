# 🎯 Deep Intelligence Workflow Guide

*Complete workflow for gathering, validating, and applying organizational intelligence*

---

## 📋 Overview

This guide provides a step-by-step workflow for deep intelligence gathering on BC AI organizations. The system emphasizes **real data with citations** and includes both automated and manual processes.

---

## 🛠️ Available Tools

### 1. **Automated Intelligence Gathering**
- `deep-intelligence-gatherer-v2.js` - Proven tool that extracts data from websites
- `deep-intelligence-gatherer-v3.js` - Enhanced version with Crunchbase/LinkedIn features (requires puppeteer)

### 2. **Manual Data Entry**
- `manual-intelligence-entry.js` - Interactive tool for entering verified data from manual research

### 3. **Validation & Verification**
- `validate-intelligence.js` - Cross-references data and identifies conflicts
- `test-intelligence-extraction.js` - Diagnostic tool for testing extraction

### 4. **Database Updates**
- `apply-validated-intelligence.js` - Safely applies verified data with citations

---

## 📊 Workflow Steps

### Phase 1: Automated Extraction (30% Success Rate)

```bash
# 1. Run intelligence gatherer on priority organizations
cd /Users/kk/ecosystem-map-bc-ai
node tools/enhancement/deep-intelligence-gatherer-v2.js --limit=10

# 2. Review the generated report
cat data/reports/*_deep-intelligence-v2.md

# 3. Check what data was extracted
cat data/reports/*_intelligence-updates-v2.json
```

**What this finds:**
- Year founded (from website text)
- Employee counts (if mentioned)
- Basic descriptions (from meta tags)
- Technology stack (from content)

**What it doesn't find:**
- Funding information (rarely on websites)
- Revenue data (usually private)
- Detailed leadership info

### Phase 2: Manual Research & Entry (70% Success Rate)

For each organization without complete data:

#### A. Crunchbase Research
1. Visit https://www.crunchbase.com/
2. Search for the organization
3. Note:
   - Funding rounds and amounts
   - Investors
   - Employee count
   - Key people
   - Acquisition info

#### B. LinkedIn Research
1. Visit https://www.linkedin.com/
2. Search for company page
3. Note:
   - Current employee count
   - Growth trends
   - Key employees
   - Recent updates

#### C. News Research
1. Search Google News: `"Company Name" funding BC`
2. Check local sources:
   - BC Tech News
   - Vancouver Tech Journal
   - Techcouver
3. Note recent announcements

#### D. Enter Data Using Manual Tool

```bash
# Run the manual entry tool
node tools/enhancement/manual-intelligence-entry.js

# Follow prompts to enter:
# - Organization name
# - Funding information with source URLs
# - Employee counts with dates
# - Revenue if available
# - Key people and titles
# - Recent news

# Tool will generate:
# - Markdown report with all entries
# - JSON file for database updates
```

### Phase 3: Validation

```bash
# 1. Combine automated and manual data
# Create combined JSON file with all intelligence

# 2. Run validation tool
node tools/enhancement/validate-intelligence.js --input=data/reports/combined-intelligence.json

# 3. Review validation report
# - Check for conflicts
# - Verify source URLs
# - Review confidence scores
```

### Phase 4: Apply to Database

```bash
# 1. Final review of validated data
cat data/reports/*_validated.json

# 2. Dry run first
node tools/enhancement/apply-validated-intelligence.js \
  --updates=data/reports/*_validated.json \
  --verify --dryrun

# 3. Apply updates
node tools/enhancement/apply-validated-intelligence.js \
  --updates=data/reports/*_validated.json \
  --verify --no-dryrun
```

---

## 📝 Best Practices

### 1. **Source Hierarchy**
Best to worst:
1. Official company announcements
2. Crunchbase (for funding)
3. LinkedIn (for employees)
4. Reputable news outlets
5. Industry reports
6. Blog posts

### 2. **Data Freshness**
- Employee counts: Use data < 6 months old
- Funding: Can use older data if no updates
- Revenue: Prefer annual reports or recent news
- Always include date with employee/revenue data

### 3. **Conflict Resolution**
When sources disagree:
- Use most recent reliable source
- Note both values in report
- Flag for manual review
- Default to official sources

### 4. **Citation Format**
Always include:
```json
{
  "value": "$10M Series A",
  "source": {
    "url": "https://crunchbase.com/...",
    "type": "Crunchbase",
    "accessDate": "2025-07-30"
  },
  "confidence": "high"
}
```

---

## 🎯 Priority Organizations

Focus on organizations that:
1. Have websites but missing funding data
2. Are known to be funded but amounts unknown
3. Have outdated employee counts
4. Recently announced news

Query to find them:
```javascript
// Organizations with websites but no funding info
const targets = await notion.databases.query({
  database_id: dbId,
  filter: {
    and: [
      { property: 'Website', url: { is_not_empty: true } },
      { property: 'Funding', rich_text: { is_empty: true } }
    ]
  }
});
```

---

## 📊 Expected Results

### Typical Success Rates

| Data Type | Automated | Manual | Combined |
|-----------|-----------|---------|----------|
| Year Founded | 40% | 90% | 95% |
| Funding | 5% | 70% | 75% |
| Employees | 20% | 85% | 90% |
| Revenue | 2% | 30% | 32% |
| Key People | 15% | 80% | 85% |

### Time Investment

- Automated extraction: 1 min/org
- Manual research: 5-10 min/org
- Data entry: 3-5 min/org
- Validation: 1 min/org

**Total: ~10-15 minutes per organization for complete intelligence**

---

## 🚀 Quick Start Checklist

- [ ] Run automated extraction on 10 organizations
- [ ] Review what data was found
- [ ] Pick 5 high-priority orgs for manual research
- [ ] Research each on Crunchbase/LinkedIn
- [ ] Enter data using manual tool
- [ ] Validate all collected data
- [ ] Apply updates to database
- [ ] Document any issues or gaps

---

## 🔄 Continuous Improvement

### Weekly Tasks
- Run automated extraction on new organizations
- Update employee counts for fast-growing companies
- Check for new funding announcements

### Monthly Tasks
- Comprehensive validation of all data
- Update outdated information
- Review and improve extraction patterns

### Quarterly Tasks
- Full database intelligence audit
- Identify systematic gaps
- Plan tool improvements

---

## 📚 Resources

### Intelligence Sources
- **Crunchbase**: https://www.crunchbase.com/
- **LinkedIn**: https://www.linkedin.com/
- **AngelList**: https://angel.co/
- **BC Tech**: https://wearebctech.com/
- **CVCA**: https://www.cvca.ca/

### Local BC Tech News
- **Vancouver Tech Journal**: https://vancouvertechjournal.com/
- **Techcouver**: http://www.techcouver.com/
- **BetaKit**: https://betakit.com/

### Search Queries
```
"[Company Name]" funding announcement
"[Company Name]" raises OR raised
"[Company Name]" series A OR "series B"
"[Company Name]" employees LinkedIn
"[Company Name]" revenue ARR
```

---

## 🎓 Example: Complete Intelligence Gathering

### Organization: Sanctuary AI

1. **Automated Extraction**
   - Found: Year founded (2018)
   - Found: Description from meta tags
   - Missing: Funding, employees

2. **Manual Research**
   - Crunchbase: $140M total funding, Series A
   - LinkedIn: 100+ employees
   - News: Recent humanoid robot announcements

3. **Data Entry**
   ```
   Funding: $140M Series A (2023)
   Source: https://www.crunchbase.com/organization/sanctuary-ai
   Confidence: High
   
   Employees: 100+ employees
   Source: https://www.linkedin.com/company/sanctuary-ai
   As of: 2025-07-30
   Confidence: High
   ```

4. **Validation**
   - ✅ All sources accessible
   - ✅ No conflicts
   - ✅ Data is recent

5. **Applied to Database**
   - Added funding with citation
   - Added employee count with date
   - Updated last verified date

---

*Remember: One well-researched, properly cited data point is worth more than ten guesses.*