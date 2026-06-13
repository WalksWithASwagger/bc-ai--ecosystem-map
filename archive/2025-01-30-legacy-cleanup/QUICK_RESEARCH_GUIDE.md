# Quick Research Guide - Batch 25 Organizations

## 🎯 Efficient Research Workflow

### Step 1: Open Research Resources
Open these in browser tabs:
- **Crunchbase Search**: https://www.crunchbase.com/discover/organizations
- **LinkedIn**: https://www.linkedin.com/
- **TechCrunch**: https://techcrunch.com/
- **BetaKit**: https://betakit.com/

### Step 2: Search Patterns

#### For Funding:
```
"[Company Name]" funding
"[Company Name]" raises OR raised
"[Company Name]" Series A OR seed
site:crunchbase.com "[Company Name]"
```

#### For Employee Count:
1. Go to LinkedIn company page
2. Look for employee count (e.g., "51-200 employees")
3. Note the date you checked

#### For Revenue:
```
"[Company Name]" revenue ARR
"[Company Name]" annual revenue
"[Company Name]" valuation
```

### Step 3: Data Entry Format

Create a JSON file with this structure:

```json
{
  "organizations": [
    {
      "name": "Aspect Biosystems",
      "funding": {
        "amount": "$20M Series A",
        "date": "2023-11",
        "investors": "Pangea Ventures, BDC Capital",
        "source": "https://www.crunchbase.com/organization/aspect-biosystems"
      },
      "employeeCount": {
        "count": "50-100",
        "asOf": "2025-07",
        "source": "https://ca.linkedin.com/company/aspect-biosystems"
      }
    },
    {
      "name": "Browse AI",
      "funding": {
        "amount": "$2.8M Seed",
        "date": "2022-06",
        "investors": "Y Combinator",
        "source": "https://www.crunchbase.com/organization/browse-ai"
      },
      "employeeCount": {
        "count": "11-50",
        "asOf": "2025-07",
        "source": "https://www.linkedin.com/company/browse-ai"
      }
    }
  ]
}
```

### Step 4: Process the Data

```bash
# Validate and prepare updates
node tools/enhancement/batch-intelligence-processor.js data/research/batch-25-data.json

# Apply to database
node tools/enhancement/apply-validated-intelligence.js --updates=data/research/[output-file].json --no-dryrun
```

## 💡 Research Tips

1. **Prioritize Recent Data**: 2024-2025 sources are best
2. **Use Multiple Sources**: Cross-reference when possible
3. **Include Citations**: Always save the URL where you found the data
4. **Note Dates**: Especially for employee counts and valuations
5. **Be Specific**: "$10M Series A" is better than just "$10M"

## 📊 What We're Looking For

- **Funding**: Amount, round type, date, investors
- **Employee Count**: Range (e.g., 50-100), as of date
- **Revenue**: ARR or annual revenue, year
- **Valuation**: Post-money valuation, date
- **Key People**: CEO, CTO, founders (if easily found)

## ⚡ Quick Wins

Some companies make this info easy to find:
- Check company website "About" or "Press" pages
- Look for funding announcements in News section
- LinkedIn company pages show employee counts
- Crunchbase often has funding history

Ready to start? Use the template at:
`data/research/batch-25-research-template.md`