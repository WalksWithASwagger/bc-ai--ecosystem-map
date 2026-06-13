# 🔍 Deep Intelligence Gathering Guide

*A comprehensive workflow for gathering, validating, and applying deep organizational intelligence with proper citations*

---

## 🎯 Overview

The Deep Intelligence system focuses on gathering high-quality, verifiable data about BC AI organizations including:
- Funding rounds and amounts
- Revenue and financial metrics
- Employee counts and growth
- Key leadership and founders
- Acquisitions and exits
- Technical capabilities and patents

**Key Principles:**
1. **No simulated data** - Only real, verified information
2. **Always cite sources** - Every data point must have a verifiable source
3. **Validate before applying** - Manual review required before database updates
4. **Confidence scoring** - Track reliability of each data point

---

## 🛠️ Tools Overview

### 1. **Deep Intelligence Gatherer** (`deep-intelligence-gatherer.js`)
Extracts intelligence from websites, news articles, and public sources.

**Features:**
- Multi-source data extraction
- Confidence scoring (high/medium/low)
- Citation tracking with timestamps
- Generates detailed intelligence reports
- Creates reviewable update files

### 2. **Apply Validated Intelligence** (`apply-validated-intelligence.js`)
Safely applies verified intelligence to the database with full citations.

**Features:**
- Source verification before updates
- Citation formatting in database
- Dry run mode for safety
- Detailed application reports

---

## 📋 Workflow Process

### Phase 1: Intelligence Gathering

```bash
# 1. Gather intelligence for specific organization
cd /Users/kk/ecosystem-map-bc-ai
node tools/enhancement/deep-intelligence-gatherer.js --org="Sanctuary AI" --dryrun

# 2. Gather intelligence for multiple organizations
node tools/enhancement/deep-intelligence-gatherer.js --limit=10 --dryrun

# 3. Review the generated report
cat data/reports/2025-07-30_*_deep-intelligence.md
```

**Output Files:**
- Intelligence report: `YYYY-MM-DD_HH-MM-SS_deep-intelligence.md`
- Update file: `YYYY-MM-DD_HH-MM-SS_intelligence-updates.json`

### Phase 2: Manual Validation

**Required Steps:**
1. **Review Intelligence Report**
   - Check each data point's source
   - Verify confidence levels
   - Look for conflicting information

2. **Validate Sources**
   - Click through to each cited source
   - Confirm the information is accurately extracted
   - Check dates to ensure data is current

3. **Edit Update File** (if needed)
   ```json
   {
     "pageId": "page-id",
     "organization": "Company Name",
     "updates": {
       "funding": {
         "value": "$15M Series A (2024)",
         "source": "https://techcrunch.com/2024/...",
         "lastVerified": "2025-07-30T..."
       }
     }
   }
   ```

### Phase 3: Apply Validated Updates

```bash
# 1. Dry run to see what would be updated
node tools/enhancement/apply-validated-intelligence.js \
  --updates=data/reports/2025-07-30_*_intelligence-updates.json \
  --verify --dryrun

# 2. Apply updates after validation
node tools/enhancement/apply-validated-intelligence.js \
  --updates=data/reports/2025-07-30_*_intelligence-updates.json \
  --verify --no-dryrun
```

---

## 📊 Data Types and Sources

### Funding Information
**Sources:**
- Company press releases
- TechCrunch, VentureBeat articles
- Crunchbase (manual check)
- BC Tech Association announcements

**Patterns Detected:**
- "$X Million Series A/B/C"
- "raised $XM in funding"
- "secured $X million"

### Employee Count
**Sources:**
- Company about pages
- LinkedIn company profiles (manual)
- Job posting sites
- News articles mentioning team size

**Patterns Detected:**
- "X+ employees"
- "team of X"
- "X people"

### Leadership Information
**Sources:**
- Company team/leadership pages
- LinkedIn profiles
- News articles and interviews
- Conference speaker bios

**Patterns Detected:**
- "CEO: Name"
- "Founded by Name"
- Leadership page parsing

---

## 🔍 Best Practices

### 1. **Source Reliability Hierarchy**
1. **High Confidence**: Company's own website, official press releases
2. **Medium Confidence**: Reputable news sites, industry publications
3. **Low Confidence**: Indirect mentions, older sources, unverified claims

### 2. **Data Freshness**
- Prefer sources from the last 12 months
- Mark older data with appropriate dates
- Note if information might be outdated

### 3. **Conflict Resolution**
When sources conflict:
1. Use the most recent reliable source
2. Note conflicts in the intelligence report
3. Default to company's official statements
4. Consider creating multiple data points for review

### 4. **Citation Format**
Always include:
- Source URL
- Source type (Website, News, Press Release)
- Date accessed
- Confidence level
- Any relevant notes

---

## 📝 Example Intelligence Report

```markdown
# Intelligence Report: Sanctuary AI

## 🔍 Verified Intelligence

### Funding Information
- **Value**: $140M Series A (2023)
- **Source**: [TechCrunch](https://techcrunch.com/...)
- **Confidence**: high
- **Verification**: Official press release confirmed
- **Extracted**: 2025-07-30

### Employee Count
- **Value**: 100+ employees
- **Source**: [Company Website](https://sanctuary.ai/about)
- **Confidence**: medium
- **Verification**: Pattern matching on company website
- **Extracted**: 2025-07-30

## 📚 All Sources Consulted
- [Company Website](https://sanctuary.ai) - Accessed 2025-07-30
- [TechCrunch Article](https://techcrunch.com/...) - Accessed 2025-07-30
```

---

## 🚨 Common Issues and Solutions

### Issue: Website blocks scraping
**Solution**: 
- Use manual verification
- Check Google cache
- Look for press kit or media resources

### Issue: Conflicting information
**Solution**:
- Document all versions
- Use most authoritative source
- Add note about conflict

### Issue: No public information available
**Solution**:
- Mark as "Private/Stealth"
- Check incorporation records
- Network for insider information

---

## 🔄 Continuous Improvement

### Weekly Tasks
1. Run intelligence gathering on new organizations
2. Update existing records with new funding rounds
3. Verify employee counts for growing companies

### Monthly Tasks
1. Comprehensive review of high-value organizations
2. Check for acquisitions and exits
3. Update leadership changes

### Quarterly Tasks
1. Full database intelligence audit
2. Source reliability review
3. Process improvement evaluation

---

## 🎯 Next Steps

1. **Start Small**: Test with 5-10 organizations you know well
2. **Refine Process**: Adjust confidence thresholds based on results
3. **Build Network**: Connect with BC tech journalists for insider info
4. **Automate Alerts**: Set up Google Alerts for key organizations

---

*Remember: Quality over quantity. One verified, well-cited data point is worth more than ten guesses.*