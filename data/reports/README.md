# BC AI Ecosystem Database Reports

This directory contains reports generated to analyze and improve the BC AI Ecosystem database.

## Available Reports

### Completeness Reports

- **`*_completeness-summary.md`**: Overall database completeness statistics, field completion rates, and most incomplete organizations
- **`*_completeness-detail.csv`**: Detailed CSV with completeness indicators for each organization and field

### Data Enhancement Reports

- **`*_logo-acquisition-targets.md`**: Prioritized list of organizations needing logos
- **`*_missing-contacts.md`**: Organizations missing contact information (website, email, phone, LinkedIn)
- **`*_missing-key-people.md`**: Organizations missing key people information
- **`*_missing-year-founded.md`**: Organizations missing founding year information

## Generating Reports

All reports can be regenerated using the scripts in the `scripts/` directory:

```bash
# Scan overall database completeness
NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/scan-completeness.js

# Find organizations needing logos
NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/prepare-logo-acquisition.js

# Find organizations missing contact information
NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/find-missing-contacts.js

# Find organizations missing key people information
NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/find-missing-key-people.js

# Find organizations missing year founded information
NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/find-missing-year-founded.js
```

## Using These Reports

These reports are designed to guide data enhancement efforts:

1. **Prioritization**: Focus on the most incomplete organizations or the most incomplete fields
2. **Batch Processing**: Use category and region groupings for efficient research
3. **Research Guidance**: Follow the methodology sections for consistent data collection
4. **Progress Tracking**: Regenerate reports periodically to track improvement

## Data Enhancement Plan

For the full data enhancement strategy, see the main enhancement plan:
[2025-07-29_data-enhancement-plan.md](./2025-07-29_data-enhancement-plan.md) 