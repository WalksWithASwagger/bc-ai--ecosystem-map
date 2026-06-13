# Phase 2 Research Sources & APIs

*Comprehensive list of data sources for BC AI ecosystem intelligence gathering*

## Primary Data Sources

### 1. LinkedIn (Manual Research Required)
- **URL**: https://www.linkedin.com/
- **Data Available**: Company profiles, employee counts, descriptions, specialties, leadership
- **Access Method**: Manual search and verification
- **Limitations**: No official API for company data scraping
- **Best Practices**: 
  - Use company search: `/search/results/companies/`
  - Verify company location is BC
  - Check employee profiles for additional intel

### 2. Crunchbase
- **URL**: https://www.crunchbase.com/
- **Data Available**: Funding rounds, investors, acquisitions, leadership, company metrics
- **Access Method**: 
  - Free: Limited manual searches
  - Pro: API access ($399/month)
  - Enterprise: Bulk data access
- **API Endpoint**: `https://api.crunchbase.com/v4/`
- **Rate Limits**: 200 calls/minute (Pro)

### 3. BC Registry Services
- **URL**: https://www.bcregistry.gov.bc.ca/
- **Data Available**: Incorporation dates, registered addresses, director names
- **Access Method**: Free public search
- **Search Tool**: https://www.bcregistry.gov.bc.ca/business/auth/home
- **Best For**: Verifying company legal names and founding dates

### 4. Innovation, Science and Economic Development Canada
- **URL**: https://innovation.ised-isde.canada.ca/
- **Data Available**: Federal grants, funding programs, innovation metrics
- **Access Method**: Public database search
- **Key Programs**:
  - Strategic Innovation Fund
  - Industrial Research Assistance Program (IRAP)
  - CanExport

## News & Media Sources

### 5. Canadian Tech News
- **Techcouver**: https://techcouver.com/
  - Focus: Vancouver tech ecosystem
  - RSS: https://techcouver.com/feed/
  
- **BetaKit**: https://betakit.com/
  - Search: https://betakit.com/?s=British+Columbia
  - API: No public API
  
- **Georgia Straight**: https://www.straight.com/tech
  - Local Vancouver coverage

### 6. Press Release Wires
- **Newswire.ca**: https://www.newswire.ca/
  - Search by company name + location
  - Categories: Technology, Funding
  
- **PR Newswire**: https://www.prnewswire.com/
  - Canadian tech section
  
- **Business Wire**: https://www.businesswire.com/
  - Technology news portal

## Government & Institutional Sources

### 7. NRC-IRAP
- **URL**: https://nrc.canada.ca/en/support-technology-innovation
- **Data**: IRAP funding recipients, innovation support
- **Database**: https://innovation.ised-isde.canada.ca/innovation/
- **Search**: By organization name or project

### 8. MITACS
- **URL**: https://www.mitacs.ca/
- **Data**: Academic-industry partnerships, research funding
- **Programs**: Accelerate, Elevate, Globalink

### 9. Provincial Funding
- **Innovate BC**: https://www.innovatebc.ca/
  - Programs: Ignite, Accelerate
  - Annual reports with recipient lists
  
- **BC Tech Association**: https://wearebctech.com/
  - Member directory
  - Industry reports

## Industry Directories

### 10. Angel Investment
- **AngelList**: https://angel.co/
  - Startup profiles, funding, jobs
  - API: Limited access
  
- **National Angel Capital Organization**: https://www.nacocanada.com/
  - Canadian angel investment data

### 11. Accelerators & Incubators
- **Canadian Accelerator & Incubator Network**: https://www.cain.ca/
- **Techstars**: https://www.techstars.com/
- **Y Combinator**: https://www.ycombinator.com/companies

### 12. Patent Databases
- **Canadian Patents Database**: https://www.ic.gc.ca/opic-cipo/cpd/
- **USPTO**: https://www.uspto.gov/
- **Google Patents**: https://patents.google.com/

## API Services (Paid/Freemium)

### 13. Company Data APIs
- **Clearbit**: https://clearbit.com/
  - Company enrichment API
  - Pricing: $99+/month
  
- **FullContact**: https://www.fullcontact.com/
  - Company and people data
  - API access available

- **Hunter.io**: https://hunter.io/
  - Email finder and verifier
  - Free: 25 searches/month
  - Paid: $49+/month

### 14. Web Scraping Tools
- **ScrapingBee**: https://www.scrapingbee.com/
  - JavaScript rendering
  - Proxy rotation
  
- **Bright Data**: https://brightdata.com/
  - Large-scale web data collection
  
- **Apify**: https://apify.com/
  - Pre-built scrapers for LinkedIn, etc.

## Research Aggregators

### 15. Academic Sources
- **Google Scholar**: https://scholar.google.com/
- **arXiv**: https://arxiv.org/
- **IEEE Xplore**: https://ieeexplore.ieee.org/
- **ACM Digital Library**: https://dl.acm.org/

### 16. Industry Reports
- **CB Insights**: https://www.cbinsights.com/
- **PwC MoneyTree**: https://www.pwc.com/moneytree
- **CVCA Reports**: https://www.cvca.ca/research-insight

## Social Media Intelligence

### 17. Twitter/X
- **Search**: https://twitter.com/search
- **Advanced Search**: https://twitter.com/search-advanced
- **API**: Developer account required

### 18. GitHub
- **Search**: https://github.com/search
- **API**: https://api.github.com/
- **Rate Limit**: 60/hour (unauthenticated), 5000/hour (authenticated)

## Specialized BC Resources

### 19. Regional Organizations
- **VIATEC** (Victoria): https://www.viatec.ca/
- **Innovation Island** (Vancouver Island): https://innovationisland.ca/
- **Kamloops Innovation**: https://kamloopsinnovation.ca/
- **Kelowna Tech**: https://accelerateokanagan.com/

### 20. University Research
- **UBC**: https://www.ubc.ca/
  - Research database: https://research.ubc.ca/
  - Spin-off companies list
  
- **SFU**: https://www.sfu.ca/
  - VentureLabs: https://www.sfu.ca/venturelabs/
  
- **UVic**: https://www.uvic.ca/
  - Innovation Centre: https://onlineacademiccommunity.uvic.ca/innovation/

## Data Verification Sources

### 21. Domain/Website Verification
- **WHOIS**: https://who.is/
- **BuiltWith**: https://builtwith.com/
- **Wappalyzer**: https://www.wappalyzer.com/

### 22. Business Verification
- **Better Business Bureau**: https://www.bbb.org/
- **Industry Canada**: https://www.ic.gc.ca/

## Search Strategies

### Google Advanced Search Operators
```
# Find LinkedIn profiles
site:linkedin.com/company "company name" "British Columbia"

# Find funding news
"company name" "raised" OR "funding" OR "investment" site:techcrunch.com OR site:betakit.com

# Find leadership
"company name" "CEO" OR "founder" OR "CTO" -site:linkedin.com

# Find company info on specific sites
site:crunchbase.com "company name" Vancouver
```

### Boolean Search Templates
```
# Comprehensive company search
("Company Name" OR "Company Alternate Name") AND ("Vancouver" OR "British Columbia" OR "BC") AND ("AI" OR "artificial intelligence" OR "machine learning")

# Funding search
"Company Name" AND ("Series A" OR "Series B" OR "seed funding" OR "raised $") AND "2023..2025"

# People search
"Company Name" AND ("CEO" OR "CTO" OR "founder") AND "LinkedIn"
```

## API Authentication Setup

### GitHub API Example
```bash
# Personal access token
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/orgs/COMPANY/repos
```

### Crunchbase API Example
```bash
# API Key authentication
curl -X GET "https://api.crunchbase.com/v4/entities/organizations/company-name" \
  -H "X-cb-user-key: YOUR_API_KEY"
```

## Rate Limiting Guidelines

| Service | Free Limit | Paid Limit | Reset Period |
|---------|------------|------------|--------------|
| GitHub | 60/hour | 5,000/hour | Hourly |
| LinkedIn | N/A (manual) | N/A | N/A |
| Crunchbase | N/A | 200/minute | Per minute |
| Hunter.io | 25/month | 1,000+/month | Monthly |
| Google Search | ~100/day | N/A | Daily |

## Data Quality Indicators

### High Confidence Sources
- Official company websites
- Government databases
- SEC/regulatory filings
- Press releases on official wires

### Medium Confidence Sources
- News articles
- Industry directories
- Social media profiles
- Third-party databases

### Low Confidence Sources
- User-generated content
- Outdated directories
- Unverified listings
- AI-generated summaries

---

*Remember: Always verify data from multiple sources. When in doubt, mark confidence as "low" and note the need for verification.*