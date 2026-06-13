# BC AI Ecosystem Atlas - Data

*Organized data, reports, and research for the BC AI ecosystem*

## 📁 Directory Structure

### 📊 Reports (`reports/`)
**Generated reports from enhancement tools and analysis**

- **Completeness Reports** - Database quality analysis and statistics
- **Enhancement Reports** - Results from contact enhancement tools
- **Missing Information Reports** - Gaps in database coverage
- **Import Reports** - Organization import summaries

**Example Reports:**
```
reports/
├── 2025-08-01_completeness-summary.md
├── 2025-08-01_completeness-detail.csv
├── 2025-08-01_website-enhancement.md
├── 2025-08-01_linkedin-enhancement.md
└── 2025-08-01_contact-info-extraction.md
```

### 🔬 Research (`research/`)
**Raw research data and analysis files**

- **Contact Research** - Website, LinkedIn, and contact information research
- **Completeness Analysis** - Database field completion analysis
- **Gap Analysis** - Ecosystem coverage gaps and opportunities
- **Organization Lists** - Curated lists for import and enhancement

**File Types:**
- `.md` - Research summaries and organization lists
- `.json` - Structured research data and updates
- `.csv` - Tabular data for analysis

### 📥 Imports (`imports/`)
**Organization import logs and batch files**

- **Import Logs** - Records of successful organization imports
- **Batch Files** - Prepared organization data for import
- **Failed Imports** - Organizations that couldn't be imported

### 🔍 Discoveries (`discoveries/`)
**Newly discovered organizations awaiting import**

- **Discovery Batches** - Organized by date and research focus
- **Validation Results** - Verification of discovered organizations
- **Import Queue** - Organizations ready for database addition

**Naming Convention:**
```
YYYY-MM-DD_discovery-[focus].md
Example: 2025-08-01_discovery-cleantech.md
```

## 🔄 Data Flow

```
Research → Discoveries → Imports → Reports
    ↓          ↓          ↓         ↓
analysis/  validation/  database/  insights/
```

1. **Research Phase** - Raw data collection and analysis
2. **Discovery Phase** - New organization identification
3. **Import Phase** - Database integration
4. **Reporting Phase** - Quality assessment and insights

## 📋 File Formats

### Organization Lists (Markdown)
```markdown
## New Organizations

### [Organization Name]
- **Category**: Startup
- **City**: Vancouver
- **Description**: Brief description
- **Website**: https://example.com
- **Source**: Research document or URL
```

### Research Data (JSON)
```json
{
  "organization": "Example Corp",
  "research_date": "2025-08-01",
  "findings": {
    "website": "https://example.com",
    "linkedin": "https://linkedin.com/company/example",
    "email": "contact@example.com"
  },
  "confidence": "high",
  "source": "official_website"
}
```

### Import Results (CSV)
```csv
organization_name,status,notion_id,import_date,notes
Example Corp,success,page_id_123,2025-08-01,Imported successfully
```

## 🛠️ Working with Data

### Generate Reports
```bash
# Scan database completeness
node tools/analysis/scan-completeness.js

# Find missing information
node tools/analysis/find-missing-contacts.js
```

### Process Discoveries
```bash
# Find new organizations from research
node tools/import/find-new-orgs.js data/research/new-research.md

# Import discovered organizations
node tools/import/import-discovery-orgs.js data/discoveries/2025-08-01_batch.md
```

### Analyze Data
```bash
# Check for potential duplicates
node tools/analysis/check-active-duplicates.js

# Review completeness trends
ls data/reports/*completeness* | tail -5
```

## 📈 Quality Standards

### Data Verification
- **Primary Sources** - Official websites and press releases
- **Cross-Validation** - Multiple source confirmation
- **Recency** - Prioritize information from last 12 months
- **Attribution** - Document all data sources

### Import Requirements
- **Unique Names** - No duplicates in database
- **Required Fields** - Name, Category, City minimum
- **Source Documentation** - Verification source required
- **Quality Score** - Aim for 60%+ field completion

## 🔒 Data Governance

### Privacy & Security
- **Public Information Only** - No private or sensitive data
- **Source Attribution** - All data sources documented
- **Regular Audits** - Quarterly data quality reviews
- **Community Standards** - Follow contribution guidelines

### Retention Policy
- **Active Reports** - Keep last 12 months in main directory
- **Archive Policy** - Move older reports to archive annually
- **Research Data** - Retain indefinitely for reference
- **Import Logs** - Keep for audit trail and troubleshooting

---

**[🏠 Back to Main README](../README.md)** • **[🛠️ Tools Documentation](../tools/README.md)** • **[📊 Database Schema](../database-schema.md)** 