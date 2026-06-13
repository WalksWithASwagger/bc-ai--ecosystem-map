# 📁 Local Markdown Research Store Strategy
*Maximize data extraction, minimize API calls, build knowledge base*

---

## 🎯 The Concept

**Instead of**: Making multiple API calls to get bits of data
**We do**: One deep extraction → Save EVERYTHING locally → Process later

```
LinkedIn/Website Visit
    ↓
Extract ALL visible data (one pass)
    ↓
Save to structured markdown file
    ↓
Local knowledge base (searchable, reusable)
    ↓
Selective sync to Notion (when ready)
```

---

## 📂 Directory Structure

```
/data/research/
├── funders/
│   ├── lightspeed-venture-partners/
│   │   ├── README.md                 # Main funder profile
│   │   ├── contacts/
│   │   │   ├── jeremy-liew.md       # Individual contact
│   │   │   ├── nicole-quinn.md      # Individual contact
│   │   │   └── _index.md            # Contact summary
│   │   ├── investments/
│   │   │   ├── 2025-01-stripe.md    # Investment record
│   │   │   └── _timeline.md         # Investment timeline
│   │   ├── social/
│   │   │   ├── linkedin-posts.md    # Recent updates
│   │   │   ├── twitter-feed.md      # Latest tweets
│   │   │   └── news-mentions.md     # Press coverage
│   │   └── metadata.json            # Timestamps, sources
│   │
│   ├── greylock-partners/
│   │   ├── README.md
│   │   ├── contacts/
│   │   └── ...
│   │
│   └── _index.md                    # Master funder index
│
├── people/
│   ├── jeremy-liew/
│   │   ├── README.md                # Full profile
│   │   ├── experience.md            # Career history
│   │   ├── investments.md           # Portfolio
│   │   ├── social.md                # Social profiles
│   │   └── metadata.json
│   │
│   └── _index.md                    # Master people index
│
└── companies/
    ├── stripe/
    │   ├── README.md                # Portfolio company
    │   ├── funding-history.md       # Who invested, when
    │   └── metadata.json
    └── _index.md
```

---

## 📝 Markdown File Format

### Funder Profile (`/funders/lightspeed-venture-partners/README.md`)
```markdown
# Lightspeed Venture Partners

## Overview
- **Website**: https://lsvp.com
- **Type**: Venture Capital
- **Founded**: 2000
- **Headquarters**: Menlo Park, CA
- **Canadian Office**: None (but invests in Canadian companies)

## Contact Information
- **Main Email**: info@lsvp.com
- **Partner Emails**: See contacts/ directory
- **Phone**: +1 (650) 234-8300
- **Address**: 2200 Sand Hill Road, Menlo Park, CA 94025

## Social Media
- **LinkedIn**: https://linkedin.com/company/lightspeed-venture-partners
- **Twitter**: https://twitter.com/lightspeedvp
- **AngelList**: https://angel.co/lightspeed-venture-partners

## Investment Focus
- **Stages**: Seed, Series A, Series B
- **Check Size**: $1M - $100M
- **Sectors**: Enterprise, Consumer, Health, Fintech
- **Geographic Focus**: US, Canada, Israel, India, China

## Key People
- [[jeremy-liew]] - Partner
- [[nicole-quinn]] - Partner
- [[ravi-mhatre]] - Partner
- See contacts/ for full list

## Recent Investments
- [[stripe]] - Series I (2025-01)
- [[snapchat]] - Series B (2024-11)
- See investments/ for full history

## Application Process
- Warm intro preferred
- Online form: https://lsvp.com/entrepreneurs
- Response time: 2-4 weeks

## Notes
- Very active in consumer social
- Strong track record with Snap, Affirm, Nutanix
- Responsive to Canadian founders

---
*Last Updated: 2025-08-09*
*Source: LinkedIn, Company Website*
*Confidence: High*
```

### Contact Profile (`/funders/lightspeed-venture-partners/contacts/jeremy-liew.md`)
```markdown
# Jeremy Liew
**Partner at Lightspeed Venture Partners**

## Contact
- **Email**: jeremy@lsvp.com (unverified)
- **LinkedIn**: https://linkedin.com/in/jeremyliew
- **Twitter**: https://twitter.com/jeremyliew
- **Personal Site**: http://liewjeremy.com

## Professional
- **Current Role**: Partner @ Lightspeed (2006-present)
- **Focus Areas**: Consumer, Social, Crypto, Fintech
- **Board Seats**: Snapchat, Affirm, Ripple
- **Notable Investments**: Snapchat (first investor), Affirm, StitchFix

## Background
- **Education**: Stanford MBA, BA from Cambridge
- **Previous**: AOL, Netscape, CitiBank
- **Location**: San Francisco Bay Area

## Recent Activity
- **Latest Post**: "The Future of Social Commerce" (2025-08-01)
- **Recent Investment**: [[company-name]] (2025-07)
- **Conference**: Speaking at TechCrunch Disrupt (2025-09)

## Investment Thesis
- Believes in network effects
- Focuses on consumer behavior shifts
- Early crypto advocate

## How to Reach
- Prefers warm intros through portfolio founders
- Active on Twitter for initial contact
- Responds to well-researched cold outreach

## Notes
- First institutional investor in Snapchat
- Known for consumer insights
- Approachable at conferences

---
*Extracted: 2025-08-09 from LinkedIn*
*Confidence: High*
```

---

## 🔧 Extraction Tools

### 1. `linkedin-extractor.js`
```javascript
// When visiting a LinkedIn company page, extract:
const companyData = {
    // Basic Info
    name, website, size, founded, type, headquarters,
    
    // All Employees (paginated)
    employees: [...], // Extract ALL visible employees
    
    // Recent Posts
    posts: [...], // Last 20 posts with engagement metrics
    
    // About
    description, specialties, locations,
    
    // Stats
    followerCount, employeeCount
};

// Save to: /funders/[company-name]/README.md
```

### 2. `person-extractor.js`
```javascript
// When visiting a LinkedIn profile, extract:
const personData = {
    // Contact
    name, title, company, email, phone, websites,
    
    // Professional
    experience: [...], // Full work history
    education: [...], // All education
    skills: [...], // All listed skills
    
    // Network
    connections, followers,
    
    // Activity
    posts: [...], // Recent posts
    articles: [...], // Published articles
    
    // Investments (if visible)
    portfolio: [...]
};

// Save to: /people/[person-name]/README.md
```

---

## 💾 Data Storage Benefits

### 1. **One Search = Complete Data**
Instead of: "Get email" → "Get phone" → "Get investments"
We do: "Get EVERYTHING visible" → Save locally → Query locally

### 2. **Historical Tracking**
```markdown
## Updates
- **2025-08-09**: Initial extraction
- **2025-08-15**: Updated with new partner
- **2025-08-20**: Added recent investment
```

### 3. **Relationship Mapping**
```markdown
## Connections
- [[jeremy-liew]] invested in [[snapchat]]
- [[snapchat]] also funded by [[benchmark]]
- [[benchmark]] partner [[bill-gurley]] knows [[jeremy-liew]]
```

### 4. **Research Notes**
```markdown
## Research Notes
- Attended same conference as our CEO (2025-07)
- Interested in Canadian expansion (per Twitter)
- Portfolio company uses our technology
```

---

## 🔄 Sync Strategy

### Selective Sync to Notion
```javascript
// Don't sync everything, just what we need
const syncToNotion = {
    // Core data
    name, website, type,
    
    // Verified contact
    email: verifiedEmails.only,
    
    // Key info
    checkSize, stage, focus,
    
    // Summary
    description: summarize(markdownContent)
};
```

### Local-First Benefits
1. **Search locally** - No API calls
2. **Version history** - Git track changes
3. **Bulk operations** - Process offline
4. **Backup** - Local copies of everything
5. **Privacy** - Sensitive notes stay local

---

## 📊 Maximum Value Extraction

### Per LinkedIn Visit:
```javascript
// EXTRACT EVERYTHING VISIBLE IN ONE PASS:
{
    // Company Page
    employees: getAllEmployees(),        // Paginate through ALL
    posts: getRecentPosts(50),          // Get many posts
    jobs: getOpenJobs(),                // Current openings
    insights: getCompanyInsights(),     // Growth, demographics
    
    // Per Employee
    forEach(employee => {
        name, title, tenure, location,
        profileUrl, headline, 
        previousCompanies,              // Career path
        education,                       // Schools
        skills,                         // Expertise
        mutualConnections               // Network overlap
    })
}
```

### Storage Efficiency:
- **1 API call** = 100+ data points
- **1 LinkedIn page** = Complete company profile
- **1 person visit** = Full career history
- **Store once** = Query forever

---

## 🛠️ Implementation Tools

### 1. `research-crawler.js`
- Visits page once
- Extracts everything
- Saves to markdown
- Updates metadata.json

### 2. `markdown-generator.js`
- Creates structured files
- Links between entities
- Timestamps everything
- Tracks confidence levels

### 3. `research-search.js`
- Local search across all markdown
- Find connections
- Generate reports
- No API needed

### 4. `notion-selective-sync.js`
- Choose what to sync
- Verify before upload
- Track sync status
- Maintain source of truth

---

## 📈 ROI Calculation

### Traditional Approach:
- 10 API calls × 260 funders = 2,600 calls
- Each call gets 1 data point
- Total: 2,600 data points

### Our Approach:
- 1 deep extraction × 260 funders = 260 visits
- Each visit gets 100+ data points
- Total: 26,000+ data points
- **10x more data, 10x fewer requests**

---

## 🎯 Next Steps

1. **Create directory structure**
```bash
mkdir -p data/research/{funders,people,companies}
```

2. **Build extraction tools**
- LinkedIn extractor
- Website deep crawler
- Contact aggregator

3. **Create markdown templates**
- Funder template
- Person template
- Company template

4. **Build search tool**
- Local grep/search
- Relationship finder
- Report generator

---

*This approach maximizes data extraction while minimizing API calls, builds a permanent research knowledge base, and keeps sensitive information under your control.*