# BC AI Ecosystem Discoveries

*Last Updated: July 29, 2025*

This directory contains discovery files for new organizations to be added to the BC AI Ecosystem database.

## Discovery Process

The discovery process involves identifying new AI organizations in British Columbia that are not yet in the database. This is done through various research methods, including:

1. **Sector-specific research**: Focusing on particular industries or sectors
2. **Regional exploration**: Investigating specific geographic areas within BC
3. **Specialized AI domains**: Researching organizations in specific AI subfields
4. **Industry reports**: Extracting organizations from published reports and analyses

## File Naming Convention

Discovery files follow a standard naming convention:

```
YYYY-MM-DD_discovery-scout-[focus].md
```

Where `[focus]` indicates the specific focus of the discovery effort, such as:
- `sectors` - Industry sector focus
- `regional` - Geographic region focus
- `industries` - Specific industry analysis
- `expanded` - Expanded research on existing sectors
- `final` - Final discoveries in a research phase
- `ultimate` - Comprehensive deep dive across sectors

## File Format

Each discovery file follows a standard format:

```markdown
# BC AI Ecosystem - Discovery Scout Report ([Focus])
**Date:** YYYY-MM-DD
**Scout:** Discovery Scout Agent

## New Organizations Discovered - [Focus] Deep Dive

### [CATEGORY/SECTOR]

#### 1. [Organization Name]
**Organization Name**: [Full Name]
- **Website:** [URL or "To be researched"]
- **Location:** [City, BC]
- **Type:** [Organization Type]
- **Focus:** [AI Focus Areas]
- **Description:** [Brief Description]

#### 2. [Next Organization]
...

## Summary

[Summary statistics and key findings]
```

## Import Process

Once discovery files are created, the organizations are imported into the Notion database using specialized scripts:

1. **Identification**: `scripts/find-new-orgs.js` is used to identify which organizations are not yet in the database
2. **Consolidation**: If needed, missing organizations are consolidated into a single file
3. **Import**: Organizations are imported using either:
   - `scripts/import-discovery-orgs.js` for direct import from discovery files
   - `scripts/import-consolidated-orgs.js` for import from consolidated lists

## Current Status

As of July 29, 2025:
- 139 organizations have been successfully imported from discovery files
- All discovery files have been processed
- The database now contains 598 unique organizations

## Archiving

Once discovery files have been fully processed and all organizations imported, they can be moved to `discoveries/archive/` for historical reference. 