# Intelligence Gathering Guide - BC AI Ecosystem
*Comprehensive guide for deep Crunchbase and financial data research*

## 🎯 Overview

This guide documents our systematic approach to gathering deep intelligence on BC AI organizations, with a focus on unique, high-value data that enhances our database quality.

## 📊 Data Priority Matrix

### Tier 1: Critical Financial Data
- **Funding History**: All rounds, amounts, dates, lead investors
- **Valuation**: Post-money valuations, unicorn status
- **Exit Events**: Acquisitions, IPOs, merger details
- **Revenue Metrics**: ARR, growth rate, revenue multiples

### Tier 2: Operational Intelligence  
- **Employee Growth**: Historical headcount, hiring velocity
- **Key Partnerships**: Strategic alliances, major customers
- **Product Milestones**: Major launches, pivots, expansions
- **Awards & Recognition**: Industry accolades, rankings

### Tier 3: Strategic Insights
- **Board Members**: Notable advisors, investor directors
- **Competitor Analysis**: Market position, differentiators
- **Technology Stack**: Core technologies, patents
- **Geographic Expansion**: Office locations, market presence

## 🔍 Research Sources Hierarchy

### Primary Sources (Most Reliable)
1. **Company Websites**: Press releases, investor pages
2. **SEC Filings**: For public companies or those with public investors
3. **Official Announcements**: Direct from company leadership
4. **Government Databases**: IRAP, SR&ED, Innovate BC

### Secondary Sources (Cross-Reference)
1. **Crunchbase Pro**: Comprehensive funding data
2. **PitchBook**: Detailed financial intelligence
3. **LinkedIn**: Employee counts, leadership changes
4. **Industry Publications**: TechCrunch, BetaKit, VentureBeat

### Tertiary Sources (Verify)
1. **News Articles**: Local and tech media
2. **Social Media**: Company announcements
3. **Industry Reports**: Market research firms
4. **Conference Presentations**: Speaker bios, pitch decks

## 🛠️ Deep Research Workflow

### Phase 1: Initial Discovery (5 min/company)
```bash
# Quick scan for basic info
1. Google: "[Company] funding announcement 2024 2025"
2. LinkedIn: Check employee count
3. Company website: /about /investors /press
4. Crunchbase: Basic funding overview
```

### Phase 2: Deep Dive (15 min/company)
```bash
# Comprehensive research
1. Funding Timeline:
   - All rounds with amounts
   - Lead and participating investors
   - Board composition changes
   
2. Business Metrics:
   - Customer count/logos
   - Revenue (if disclosed)
   - Market share claims
   
3. Strategic Intel:
   - Major partnerships
   - Geographic expansion
   - Product roadmap hints
```

### Phase 3: Validation (5 min/company)
```bash
# Cross-reference findings
1. Verify funding amounts across sources
2. Confirm dates with press releases
3. Check investor websites for portfolio confirmation
4. Validate employee counts with LinkedIn
```

## 📝 Data Entry Standards

### Funding Format
```json
{
  "funding": {
    "amount": "$25M Series B",
    "date": "2024-11",
    "leadInvestor": "Sequoia Capital",
    "otherInvestors": "Andreessen Horowitz, Google Ventures",
    "valuation": "$150M post-money",
    "source": "https://techcrunch.com/2024/11/15/company-raises-25m"
  }
}
```

### Acquisition Format
```json
{
  "acquisition": {
    "acquirer": "Microsoft",
    "amount": "$500M",
    "date": "2025-03",
    "type": "Strategic acquisition",
    "retained": "Team joining Azure AI division",
    "source": "https://blogs.microsoft.com/blog/2025/03/acquisition"
  }
}
```

### Key Metrics Format
```json
{
  "metrics": {
    "arr": "$10M",
    "growth": "300% YoY",
    "customers": "500+ enterprises",
    "nps": "72",
    "asOf": "2024-12",
    "source": "https://company.com/metrics-milestone"
  }
}
```

## 🎯 Unique Data Opportunities

### 1. **Innovation Indicators**
- Patent filings and grants
- Research papers published
- Open source contributions
- Technical blog posts

### 2. **Ecosystem Connections**
- Accelerator/incubator participation
- University partnerships
- Government grant recipients
- Industry association memberships

### 3. **Market Validation**
- Customer case studies
- Partner ecosystem size
- Media mentions frequency
- Award recognition patterns

### 4. **Leadership Intelligence**
- Founder backgrounds
- C-suite changes
- Board composition
- Advisory board quality

## 🚀 Batch Research Strategy

### Prioritization Framework
1. **Unicorns & Scale-ups**: Highest data availability
2. **Recent Funding**: Fresh news, active PR
3. **YC/Techstars Alumni**: Well-documented
4. **Government Grant Recipients**: Public records
5. **Award Winners**: Recognition lists

### Efficiency Tips
- Open 10 browser tabs with search queries
- Use browser bookmarks for quick access
- Create search query templates
- Batch similar companies together
- Track time per company (aim for <10 min)

## 📊 Quality Metrics

### Data Completeness Score
- **90-100%**: All tier 1 data + most tier 2
- **70-89%**: All tier 1 data + some tier 2
- **50-69%**: Most tier 1 data
- **Below 50%**: Needs enhancement

### Source Reliability Score
- **High**: Primary sources, multiple confirmations
- **Medium**: Secondary sources, single confirmation
- **Low**: Tertiary sources only

## 🔄 Continuous Enhancement

### Weekly Targets
- Research 25-30 organizations
- Add 100+ verified data points
- Update 20+ employee counts
- Find 5+ acquisition/exit events

### Monthly Goals
- Cover all high-priority startups
- Achieve 80% funding data coverage
- Update all employee counts
- Document 50+ partnerships

## 📈 Expected Outcomes

With systematic deep research:
- **Funding Coverage**: 60% → 90% for startups
- **Employee Data**: 40% → 95% coverage
- **Revenue Intelligence**: 5% → 25% (where disclosed)
- **Strategic Intel**: 200+ partnerships documented
- **Exit Events**: All major acquisitions tracked

## 🛠️ Tools & Scripts

### Research Tools
```bash
# Find priority targets
node tools/find-priority-intelligence-targets.js

# Batch research entry
node tools/enhancement/batch-research-priority-orgs.js

# Process research data
node tools/enhancement/batch-intelligence-processor.js data.json

# Apply to database
node tools/enhancement/apply-validated-intelligence.js --updates=validated.json --no-dryrun
```

### Quick Commands
```bash
# Check what's missing
node tools/analysis/scan-completeness.js

# Find companies without funding data
node tools/find-priority-intelligence-targets.js | grep "Missing Funding"

# Generate research batch
node tools/enhancement/generate-research-batch.js --size=25
```

## 📚 Research Templates

### Crunchbase Search Queries
- "company_name" site:crunchbase.com
- "company_name" raised OR funding OR series
- "company_name" acquired OR acquisition
- "company_name" revenue OR ARR OR customers

### LinkedIn Intelligence
- Company page → Insights → Employee count
- Posts → Funding announcements
- Leadership → Key hires/departures
- About → Recent milestones

### News Aggregation
- Google News: "company" AND (funding OR raised OR acquisition)
- BetaKit: Search company name
- TechCrunch: Check company tag page
- Local media: Vancouver Sun, Business in Vancouver

---

*Last updated: July 30, 2025*