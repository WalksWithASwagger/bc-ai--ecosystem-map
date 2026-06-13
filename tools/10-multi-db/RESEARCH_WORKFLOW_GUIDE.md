# 📚 Funder Research Workflow Guide
*Phase 1 & 2 Implementation: Contact Discovery & Intelligence Gathering*

---

## 🎯 Overview

This guide documents the complete workflow for researching funders and adding **valid, non-duplicative data** to the funding database. We ensure all data is verified, current, and adds value to our fundraising efforts.

---

## 🛠️ Available Research Tools

### 1. **Comprehensive Funder Researcher** (`comprehensive-funder-researcher.js`)
**Purpose**: Deep research for contact info and investment intelligence
```bash
node tools/10-multi-db/comprehensive-funder-researcher.js --limit 20
```
**Researches**:
- ✉️ Contact emails (validated)
- 🔗 Application URLs
- 💰 Recent investments
- 👥 Key partners/people
- 📊 Fund sizes and check sizes
- 📋 Application processes

### 2. **Application Deadline Tracker** (`application-deadline-tracker.js`)
**Purpose**: Monitor and update government program deadlines
```bash
node tools/10-multi-db/application-deadline-tracker.js
```
**Tracks**:
- 📅 Quarterly deadlines (MITACS, etc.)
- 🔄 Rolling applications (IRAP, PacifiCan)
- 🎯 Cohort deadlines (CDL, accelerators)
- ⏰ Urgent deadlines (next 30 days)

### 3. **Automated Deduplication** (`deduplicate-funding-database.js`)
**Purpose**: Prevent and remove duplicate entries
```bash
node tools/10-multi-db/deduplicate-funding-database.js --auto-merge
```

---

## 📋 Research Workflow

### Step 1: Pre-Research Check
Before researching, always check for duplicates:
```bash
# Check for duplicates first
node tools/10-multi-db/deduplicate-funding-database.js

# If duplicates found, merge them
node tools/10-multi-db/deduplicate-funding-database.js --auto-merge
```

### Step 2: Run Comprehensive Research
Research high-priority funders missing key data:
```bash
# Research top 20 funders needing data
node tools/10-multi-db/comprehensive-funder-researcher.js --limit 20
```

The tool will:
1. **Prioritize** high-score funders missing data
2. **Extract** contact emails from websites
3. **Find** application/submission URLs
4. **Gather** VC intelligence (investments, partners)
5. **Identify** government deadlines and processes
6. **Validate** all data before adding
7. **Prevent** duplicate information

### Step 3: Update Application Deadlines
Keep deadline information current:
```bash
node tools/10-multi-db/application-deadline-tracker.js
```

This will:
- Update all known program deadlines
- Identify urgent deadlines (< 30 days)
- Generate a deadline report

### Step 4: Manual Research for Specific Funders

#### For Venture Capital Firms:
**Research Checklist**:
- [ ] Portfolio companies (last 10 investments)
- [ ] Check size range ($X - $Y)
- [ ] Investment stage (Seed, Series A, etc.)
- [ ] Geographic focus
- [ ] Sector preferences
- [ ] Partners/decision makers
- [ ] Application process (warm intro vs cold)

**Data Sources**:
- Crunchbase (primary)
- PitchBook
- Company website /portfolio page
- LinkedIn
- TechCrunch/BetaKit articles

#### For Government Programs:
**Research Checklist**:
- [ ] Eligibility criteria
- [ ] Funding amounts (min/max)
- [ ] Application deadlines
- [ ] Required documents
- [ ] Review timeline
- [ ] Success rate (if available)
- [ ] Contact person/advisor

**Data Sources**:
- Official program website
- Government portals
- Program guidelines PDF
- Info sessions/webinars

#### For Accelerators/Incubators:
**Research Checklist**:
- [ ] Cohort dates
- [ ] Application deadlines
- [ ] Program duration
- [ ] Equity taken
- [ ] Services provided
- [ ] Alumni companies
- [ ] Selection criteria

---

## ✅ Data Validation Rules

### Email Validation
✅ **Valid**:
- info@example.com
- investments@vcfirm.com
- apply@accelerator.org

❌ **Invalid**:
- noreply@example.com
- image@website.png
- example@test.com

### Website Validation
✅ **Valid**:
- https://www.legitimatefunder.com
- https://apply.program.gc.ca

❌ **Invalid**:
- Broken links (404)
- Parking pages
- Unrelated businesses

### Preventing Duplicates
The system automatically:
1. **Normalizes** names for comparison
2. **Checks** existing data before adding
3. **Merges** duplicates keeping oldest entry
4. **Validates** new information isn't redundant

---

## 📊 Priority Research Order

### Tier 1: Immediate Priority (Score 90+)
1. **IRAP** - Missing application process details
2. **MITACS** - Need quarterly deadline updates
3. **SR&ED** - Clarify eligibility criteria
4. **Lightspeed Venture Partners** - Recent investments
5. **Greylock Partners** - Partner contacts

### Tier 2: High Priority (Score 80-89)
- BC Tech Fund
- PacifiCan
- Yaletown Partners
- CDL West
- Foresight Canada

### Tier 3: Medium Priority (Score 70-79)
- Angel networks
- Corporate VCs
- Smaller accelerators

---

## 🔄 Daily Research Routine

### Morning (15 minutes)
1. Run deduplication check
2. Check for urgent deadlines
3. Research 5 high-priority funders

### Afternoon (15 minutes)
1. Update any new deadline information
2. Research 5 more funders
3. Review and validate morning's additions

### Weekly (30 minutes)
1. Full database deduplication
2. Comprehensive deadline update
3. Generate weekly research report
4. Plan next week's research priorities

---

## 📈 Quality Metrics

Track research effectiveness:
- **Emails found**: Target 80% of funders
- **Deadlines tracked**: 100% of government programs
- **Recent investments**: Last 6 months for active VCs
- **Data accuracy**: Validate monthly
- **Duplicate rate**: Keep below 1%

---

## 🚨 Common Issues & Solutions

### Issue: Can't find email on website
**Solution**: 
- Check /contact, /apply, /submit pages
- Look for team/people pages
- Search for "info@" or "contact@" patterns
- Check footer and header areas

### Issue: Multiple similar funders
**Solution**:
- Run deduplication first
- Check if they're different programs from same org
- Merge if truly duplicate
- Keep separate if different programs

### Issue: Outdated deadline information
**Solution**:
- Always verify on official website
- Set calendar reminders for updates
- Note "Last verified: [date]" in description

---

## 📝 Manual Data Entry Format

When adding research manually, use this format in Description field:

```
📊 Research Update:
📧 Contact: email@funder.com
🔗 Apply: https://funder.com/apply
📅 Deadline: 2025-03-15 (quarterly)
💰 Fund Size: $100M
✍️ Check Size: $500K - $2M
🎯 Recent: Series A in TechCo (Jan 2025)
👥 Partners: John Doe, Jane Smith
📋 Process: Warm intro preferred, 2-week decision
✅ Verified: 2025-08-09
```

---

## 🎯 Next Steps

1. **Today**: Research top 10 funders missing emails
2. **This Week**: Update all government deadlines
3. **This Month**: Achieve 80% email coverage
4. **Ongoing**: Daily 30-minute research sessions

---

## 📊 Success Tracking

Monitor progress in database:
- Total funders: 314
- With emails: Track % increase
- With deadlines: Track % coverage
- With recent intel: Track freshness
- Application success: Track outcomes

---

*This workflow ensures we build a high-quality, actionable funding database with validated, non-duplicative data that directly supports fundraising success.*