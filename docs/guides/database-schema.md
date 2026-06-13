# BC AI Ecosystem Database Schema

*Last Updated: August 1, 2025*

This document outlines the schema used in the BC AI Ecosystem Notion database, including all properties, their types, and their purpose.

## Overview

The BC AI Ecosystem database is hosted in Notion and currently contains **598 unique organizations** representing approximately **80% coverage** of British Columbia's AI landscape. The database is **100% duplicate-free** and maintained through comprehensive enhancement tools.

## Database Properties

| Property Name | Type | Description | Completion Rate | Enhancement Priority |
|--------------|------|-------------|----------------|---------------------|
| **Name** | Title | The organization's name | 100% | ✅ Complete |
| **Website** | URL | Official website URL | 40% | 🎯 **High** (314 missing) |
| **LinkedIn** | URL | LinkedIn company page | 31% | 🎯 **High** (410 missing) |
| **Email** | Email | Primary contact email | 35% | 🎯 **High** (Contact extraction) |
| **Phone** | Phone Number | Contact phone number | 28% | 🎯 **High** (Contact extraction) |
| **City/Region** | Rich Text | Specific location within BC | 90% | ✅ Nearly Complete |
| **BC Region** | Select | Broader regional classification | 89% | ✅ Nearly Complete |
| **Category** | Select | Organization type/industry | 85% | 🔄 Medium |
| **AI Focus Areas** | Multi-Select | Specific AI domains/applications | 71% | 🔄 Medium |
| **Year Founded** | Number | Year the organization was established | 15% | 🔄 Medium |
| **Size** | Select | Organization size category | 60% | 🔄 Medium |
| **Short Blurb** | Rich Text | Brief description of the organization | 79% | 🔄 Medium |
| **Key People** | Rich Text | Founders, executives, and leaders | 9% | 🔄 Medium |
| **Latitude** | Number | Geographic coordinate for mapping | 89% | ✅ Nearly Complete |
| **Longitude** | Number | Geographic coordinate for mapping | 89% | ✅ Nearly Complete |
| **Logo** | Files | Organization logo | 7% | 🔄 Medium (41 collected) |
| **Notable Projects** | Rich Text | Significant AI projects or products | 30% | 🔄 Medium |
| **Funding** | Rich Text | Investment rounds, amounts, and investors | 5% | 🎯 **High** (New field) |
| **Revenue** | Rich Text | Annual revenue, ARR, or estimates | 0% | 🎯 **High** (New field) |
| **Valuation** | Rich Text | Company valuation from funding rounds | 0% | 🎯 **High** (New field) |
| **Employee Count** | Rich Text | Current employee count with date | 5% | 🎯 **High** (New field) |
| **Data Sources** | Rich Text | Citations and sources for all data | 0% | 🎯 **High** (New field) |
| **Last Verified** | Date | Date when data was last verified | 0% | 🎯 **High** (New field) |
| **Source** | Select | Data source origin | 95% | ✅ Nearly Complete |
| **Quality Score** | Number | Automated data quality assessment | 45% | 🔄 Medium |
| **Last Updated** | Date | Date of last profile update | 35% | 🔄 Medium |

## 💰 Financial Intelligence Fields (NEW - July 2025)

### Recently Added Fields for Deep Intelligence

**Funding** - Investment and funding information
- Format: "$20M Series A (Date) - Lead: Investor Name"
- Include: Round type, amount, date, lead investor
- Source: Crunchbase, news articles, press releases

**Revenue** - Company revenue data
- Format: "$10M ARR (2025)" or "$50M annual revenue"
- Include: Revenue type (ARR/MRR/Annual), amount, year
- Source: Company reports, news articles, interviews

**Valuation** - Company valuation
- Format: "$100M valuation (Series A, 2025)"
- Include: Valuation amount, round, date
- Source: Funding announcements, Crunchbase

**Employee Count** - Dedicated employee tracking
- Format: "47 employees (July 2025)"
- Include: Exact count or range, as-of date
- Source: LinkedIn, company website

**Data Sources** - Citation tracking
- Format: "Crunchbase: [URL], LinkedIn: [URL], Verified: 2025-07-30"
- Include: All sources with URLs and access dates
- Purpose: Maintain data integrity and verification trail

**Last Verified** - Data freshness tracking
- Format: Date field
- Purpose: Track when intelligence was last verified
- Target: Verify high-value orgs quarterly

## Contact Enhancement Focus

### 🎯 High Priority Fields (Contact Enhancement Suite)

**Website Discovery** - 314 organizations missing websites
- Automated website search and verification
- Confidence scoring (high/medium/low)
- Success rate: ~60-70%

**LinkedIn Profile Discovery** - 410 organizations missing LinkedIn
- Extraction from existing websites
- Intelligent URL generation
- Success rate: ~80-90%

**Contact Information Extraction** - 109 organizations ready
- Email extraction from websites and contact pages
- Phone number extraction with regional formatting
- Success rate: ~70-80% for emails, ~40-50% for phones

## Property Details

### BC Region Options
- **Lower Mainland** (Vancouver, Burnaby, Richmond, Surrey) - 79% of organizations
- **Vancouver Island** (Victoria, Nanaimo) - 13% of organizations  
- **Interior** (Kelowna, Kamloops, Prince George) - 7% of organizations
- **Northern BC** (Prince Rupert, Fort St. John) - 4% of organizations
- **Other Regions** - Cross-provincial or unclear location

### Category Options
- **Startup** - Early-stage AI companies and ventures
- **Enterprise** - Established corporations with AI initiatives
- **Research & Education** - Universities, labs, and academic institutions
- **Government** - Public sector AI programs and initiatives
- **Non-Profit** - Community organizations and Indigenous AI projects
- **Accelerator/Incubator** - Innovation support organizations
- **Consultant** - AI consulting and services firms

### Size Options
- **1-10** - Small startups and consultancies
- **11-50** - Growing companies and small enterprises
- **51-200** - Mid-size companies and established startups
- **201-1000** - Large enterprises and major organizations
- **1000+** - Major corporations and institutions
- **Unknown** - Size information not available

### AI Focus Areas (Multi-Select)
- **Machine Learning & Deep Learning** - Core ML technologies and frameworks
- **Computer Vision** - Image processing, object detection, visual AI
- **Natural Language Processing** - Text analysis, chatbots, language models
- **Robotics & Automation** - Physical AI systems and process automation
- **Healthcare AI** - Medical AI, diagnostics, and biotechnology
- **FinTech AI** - Financial services and AI-powered finance
- **CleanTech AI** - Environmental technology and sustainability AI
- **Gaming & Entertainment** - AI in games, media, and creative industries
- **Data Analytics** - Business intelligence and data science
- **Cybersecurity AI** - AI-powered security and threat detection
- **Edge Computing** - IoT and distributed AI systems
- **Quantum Computing** - Quantum algorithms and quantum AI

### Source Options
- **Comprehensive Research** - Multi-source validation and deep research
- **F6S Directory** - Vancouver AI community directory
- **Government Sources** - Innovate BC and official programs
- **Industry Reports** - Sector analysis and ecosystem studies
- **Community Discovery** - Grassroots research and local knowledge
- **Academic Sources** - University and research institution data
- **VC Portfolio** - Venture capital and accelerator portfolios

## Data Quality Standards

### Quality Score Calculation
- **90-100%**: Excellent (80%+ fields completed)
- **70-89%**: Good (60-79% fields completed)
- **50-69%**: Fair (40-59% fields completed)
- **Below 50%**: Needs Enhancement

### Current Quality Distribution
- **21% High Quality** (80%+ field completion)
- **34% Good Quality** (60-79% field completion)
- **28% Fair Quality** (40-59% field completion)
- **17% Needs Enhancement** (<40% field completion)

## Enhancement Tools Integration

### Automated Enhancement
- **Website Discovery**: `enhance-websites.js`
- **LinkedIn Discovery**: `find-linkedin.js`
- **Contact Extraction**: `extract-contact-info.js`
- **Geographic Enhancement**: `enhance-geographic-data.js`
- **Data Validation**: `fix-invalid-urls.js`, `normalize-categories.js`

### Quality Monitoring
- **Completeness Scanning**: `scan-completeness.js`
- **Duplicate Detection**: `check-active-duplicates.js`
- **Missing Information Analysis**: Various `find-missing-*.js` scripts

### Batch Processing
- **Batch Updates**: `batch-update.js`
- **Organization Import**: `import-discovery-orgs.js`
- **Single Addition**: `add-org.js`

## API Integration

### Notion API Properties
- **Database ID**: `1f0c6f799a3381bd8332ca0235c24655`
- **API Version**: 2022-06-28
- **Authentication**: Bearer token authentication
- **Rate Limits**: 3 requests per second

### MCP Integration
- **Model Context Protocol**: Direct AI agent access
- **Real-time Updates**: Live database synchronization
- **Query Capabilities**: Advanced filtering and search
- **Batch Operations**: Efficient bulk data processing

## Data Governance

### Privacy & Security
- **Public Information Only**: No private or sensitive data
- **Source Attribution**: All data sources documented
- **Community Driven**: Open contribution model
- **Regular Audits**: Quarterly data quality reviews

### Update Procedures
- **Automated Enhancement**: Weekly contact enhancement batches
- **Manual Verification**: High-value organization reviews
- **Community Contributions**: GitHub Issues and pull requests
- **Quality Assurance**: Continuous monitoring and validation

---

## Usage Examples

### Querying Organizations
```javascript
// Find organizations missing websites
const missingWebsites = await notion.databases.query({
  database_id: DATABASE_ID,
  filter: {
    property: 'Website',
    url: { is_empty: true }
  }
});

// Find high-quality organizations in Vancouver
const vancouverOrgs = await notion.databases.query({
  database_id: DATABASE_ID,
  filter: {
    and: [
      {
        property: 'City/Region',
        rich_text: { contains: 'Vancouver' }
      },
      {
        property: 'Quality Score',
        number: { greater_than: 80 }
      }
    ]
  }
});
```

### Updating Organization Data
```javascript
// Update organization with contact information
await notion.pages.update({
  page_id: PAGE_ID,
  properties: {
    Website: { url: 'https://example.com' },
    LinkedIn: { url: 'https://linkedin.com/company/example' },
    Email: { email: 'contact@example.com' },
    Phone: { phone_number: '+1 604 555 0123' }
  }
});
```

---

*This schema is continuously updated as the database evolves. For the most current field completion rates, run `node scripts/scan-completeness.js`.*

**[🏠 Back to README](README.md)** • **[📋 Workflow Guide](WORKFLOW_GUIDE.md)** • **[🔧 Enhancement Tools](ENHANCEMENT_TOOLS.md)** 