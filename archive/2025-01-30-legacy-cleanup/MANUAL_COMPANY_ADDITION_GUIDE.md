# Manual Company Addition Guide
*For adding 1QB Information Technologies and Canalyst to the BC AI Ecosystem Atlas*

## 🏢 Companies to Add

### 1. 1QB Information Technologies

**Basic Information:**
- **Name**: 1QB Information Technologies
- **Website**: https://1qbit.com/
- **LinkedIn**: https://www.linkedin.com/company/1qb-information-technologies/
- **BC Region**: Vancouver
- **Category**: Quantum Computing

**Intelligence to Add:**
- **Key People**: Andrew Fursman (CEO), Landon Downs (President)
- **Products**: Quantum computing software, optimization algorithms, drug discovery
- **Funding**: $45M USD Total (2021) - Led by Fujitsu, participation from Accenture Ventures
- **Employee Count**: 100+ (as of 2023)
- **Data Sources**: Crunchbase, Company website
- **Last Verified**: 2025-07-30

**Notes**: Leading quantum software company with partnerships with major tech companies. Important addition to BC's quantum computing cluster alongside D-Wave.

### 2. Canalyst

**Basic Information:**
- **Name**: Canalyst
- **Website**: https://canalyst.com/ (now redirects to Tegus)
- **LinkedIn**: https://www.linkedin.com/company/canalyst/
- **BC Region**: Vancouver
- **Category**: FinTech

**Intelligence to Add:**
- **Key People**: Damir Hot (Founder & CEO), James Rife (CTO)
- **Products**: Financial research platform, equity research automation
- **Funding**: $90-100M USD Total, Acquired by Tegus (2023-03) - Major BC tech exit
- **Employee Count**: 300+ (at acquisition)
- **Revenue**: $30M ARR (at acquisition)
- **Valuation**: $400-500M (estimated exit value)
- **Data Sources**: TechCrunch, Globe and Mail
- **Last Verified**: 2025-07-30

**Notes**: Significant BC tech exit in 2023. Important to document as part of BC's successful exit history.

## 📝 Manual Addition Process

### Using the Interactive Tool

1. **Navigate to tools directory**:
   ```bash
   cd /Users/kk/ecosystem-map-bc-ai/tools/import
   ```

2. **Run the add-org tool**:
   ```bash
   node add-org.js
   ```

3. **Enter information when prompted**:
   - Organization name: [Enter as shown above]
   - Website: [Enter URL]
   - Email: [Press Enter to skip]
   - LinkedIn: [Enter LinkedIn URL]
   - BC Region: Vancouver

### After Adding to Database

Once the companies are added, their financial intelligence can be applied using:

```bash
cd /Users/kk/ecosystem-map-bc-ai/tools/enhancement
node apply-validated-intelligence.js data/research/missing-companies-financial-data.json --no-verify
```

## 🔄 Alternative: Batch Addition

If multiple companies need to be added, consider creating a batch addition script similar to the existing patterns in:
- `tools/add-high-value-missing-companies.js`
- `tools/add-government-funded-companies.js`

## ✅ Verification

After addition, verify the companies exist by:
1. Checking the Notion database directly
2. Using search tools once API access is restored
3. Confirming in the next intelligence application report

## 📊 Impact

Adding these companies will:
- **1QB**: Strengthen BC's quantum computing cluster representation
- **Canalyst**: Document a major $400-500M exit, inspiring other startups
- **Total**: Add $545M in documented funding/exits to the ecosystem

---

*Note: Due to current API token limitations, manual addition through the web interface or fixing API credentials may be required.*