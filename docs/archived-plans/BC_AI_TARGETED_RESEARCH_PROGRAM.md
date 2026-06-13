# BC AI Ecosystem - Targeted Research Program 🎯

*Focus on HIGH-VALUE empty fields with verifiable data sources*

## 🔴 CRITICAL GAPS (95%+ Empty)

### 1. **Funding Data** (95% empty)
**Target:** Investment rounds, amounts, investors
**Sources to Scrape:**
- Crunchbase BC startups
- BetaKit funding announcements
- BC Tech Association news
- Innovate BC portfolio companies
- CVCA (Canadian Venture Capital Association) reports
- Local VC portfolios (Rhino Ventures, Yaletown Partners, etc.)

### 2. **Revenue Data** (100% empty)
**Target:** ARR, annual revenue, growth metrics
**Sources:**
- Company press releases
- Industry reports (KPMG, PwC BC Tech Report)
- Business in Vancouver articles
- LinkedIn company insights
- Job postings (hiring velocity = revenue growth)

### 3. **Employee Count** (95% empty)
**Target:** Current headcount with dates
**Sources:**
- LinkedIn company pages (automated extraction)
- Indeed/Glassdoor company profiles
- BC Business Registry filings
- Company "About Us" pages

### 4. **Year Founded** (85% empty)
**Target:** Incorporation/founding dates
**Sources:**
- BC Registry Services (public records)
- SEDAR filings for public companies
- Company LinkedIn "Founded" field
- Domain registration dates (WHOIS)
- First news mentions/press releases

### 5. **Key People** (91% empty)
**Target:** Founders, CEOs, CTOs, AI leads
**Sources:**
- LinkedIn leadership pages
- Company team pages
- Crunchbase profiles
- Conference speaker lists (AI events in BC)
- Patent filings (inventors = key technical people)

## 🟡 VALUABLE GAPS (70%+ Empty)

### 6. **Notable Projects** (70% empty)
**Target:** AI products, partnerships, achievements
**Sources:**
- Company case studies
- Government contract awards
- Industry award winners
- Partnership announcements

## 📊 Research Strategy

### Phase 1: Network Scraping
**BC AI Networks to Scrape:**
1. **Innovate BC** - Portfolio companies, funding recipients
2. **BC Tech Association** - Member directory
3. **DigiBC** - Gaming/digital media AI companies
4. **LifeSciences BC** - BioTech AI companies
5. **New Ventures BC** - Competition winners
6. **CDL Vancouver** - AI stream companies
7. **Spring Activator** - Portfolio companies

### Phase 2: Financial Intelligence
**Automated Searches:**
```
"[Company Name]" + "funding" OR "investment" OR "Series A/B/C" site:betakit.com
"[Company Name]" + "revenue" OR "ARR" site:biv.com
"[Company Name]" + BC + funding site:crunchbase.com
```

### Phase 3: Public Records
**Government Sources:**
- BC Registry Services API
- SEDAR (public company filings)
- Government contract databases
- SR&ED tax credit recipients

## 🛠️ Implementation Plan

### 1. Build Network Scraper
```javascript
// Scrape BC Tech Association member directory
async function scrapeBCTechMembers() {
  const members = await scrapeDirectory('https://wearebctech.com/members');
  
  for (const member of members) {
    const enrichedData = {
      name: member.name,
      website: member.website,
      founded: extractFoundingYear(member.description),
      employees: member.size,
      funding: await searchFunding(member.name),
      keyPeople: await extractLeadership(member.linkedIn)
    };
    
    // Log locally for comparison
    await logDiscovery(enrichedData);
  }
}
```

### 2. Financial Data Extractor
```javascript
// Extract funding from news sources
async function extractFundingData(companyName) {
  const sources = [
    `https://betakit.com/?s=${companyName}`,
    `https://www.biv.com/search?q=${companyName}`,
    `https://techcouver.com/?s=${companyName}`
  ];
  
  const fundingData = {
    rounds: [],
    totalRaised: 0,
    lastRound: null,
    investors: [],
    sources: []
  };
  
  // Extract and validate from each source
  return fundingData;
}
```

### 3. Local Comparison System
```javascript
// Compare scraped data with existing DB
async function compareWithDatabase(scrapedData) {
  const existing = await fetchFromNotion(scrapedData.name);
  
  const newData = {
    funding: !existing.funding && scrapedData.funding,
    revenue: !existing.revenue && scrapedData.revenue,
    founded: !existing.yearFounded && scrapedData.founded,
    employees: !existing.employeeCount && scrapedData.employees,
    keyPeople: !existing.keyPeople && scrapedData.keyPeople
  };
  
  // Log novel discoveries
  if (Object.values(newData).some(v => v)) {
    await logNovelData(scrapedData.name, newData);
  }
}
```

## 📈 Expected Outcomes

### From Network Scraping:
- **200+ funding records** from news/Crunchbase
- **150+ employee counts** from LinkedIn
- **300+ founding years** from various sources
- **200+ key people** from leadership pages

### From Public Records:
- **400+ incorporation dates** from BC Registry
- **100+ government contracts** (AI projects)
- **50+ patent holders** (technical leaders)

## 🔍 Validation Requirements

Every data point MUST have:
1. **Source URL** - Where the data came from
2. **Date Found** - When we scraped it
3. **Confidence Score** - How reliable is the source
4. **Cross-Reference** - Multiple sources = higher confidence

## 📝 Local Logging Format

```json
{
  "timestamp": "2025-08-03T10:00:00Z",
  "organization": "Aspect Biosystems",
  "discoveries": {
    "funding": {
      "value": "$30M Series A (2023)",
      "source": "https://betakit.com/aspect-biosystems-30m",
      "confidence": 0.95,
      "verified": true
    },
    "employees": {
      "value": "87 (August 2025)",
      "source": "https://linkedin.com/company/aspect-biosystems",
      "confidence": 0.90
    },
    "founded": {
      "value": 2013,
      "source": "BC Registry #BC1234567",
      "confidence": 1.0
    }
  }
}
```

## 🚀 Next Steps

1. **Immediate:** Scrape Innovate BC portfolio for funding data
2. **Today:** Extract employee counts from LinkedIn
3. **This Week:** BC Registry API for founding dates
4. **Ongoing:** Monitor BetaKit/BIV for new funding rounds