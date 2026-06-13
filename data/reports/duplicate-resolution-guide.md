# BC AI Ecosystem Database Duplicate Resolution Guide

## Overview

Our duplicate analysis has identified 91 potential duplicate pairs in the database, categorized as follows:

- **Exact name matches**: 32 pairs (100% name match)
- **High similarity**: 4 pairs (95%+ name similarity)
- **Medium similarity**: 12 pairs (90-95% name similarity)
- **Other potential matches**: 43 pairs (lower name similarity but high overall match score)

This guide outlines the process for systematically reviewing and resolving these duplicates.

## Resolution Process

### 1. Review the Duplicate Resolution Plan

The full duplicate analysis is available in `reports/2025-07-29_duplicate-resolution-plan.md`. This report categorizes duplicates by similarity and provides recommendations on which entry to keep and which to merge/remove.

### 2. Edit the Resolution JSON File

The system has generated a JSON template at `reports/2025-07-29_duplicate-resolution.json` that contains all potential duplicate pairs. For each pair:

1. Review the duplicate entries in Notion
2. Determine if they are true duplicates
3. If confirmed as duplicates, set `"confirmed": true` in the JSON file
4. If not duplicates, leave as `"confirmed": false`

Example of a confirmed duplicate in the JSON file:

```json
{
  "keeper": {
    "id": "1f0c6f799a33816fb270fd4ca2e34fe8",
    "name": "Artificial Intelligence Network of BC (AInBC)"
  },
  "duplicate": {
    "id": "23dc6f799a33815da629f53e00b45bf5",
    "name": "AInBC (Artificial Intelligence network of BC)"
  },
  "fieldsToMerge": [
    {
      "field": "Website",
      "value": "https://ainbc.ai",
      "action": "replace"
    }
  ],
  "confirmed": true
}
```

### 3. Prioritization Strategy

Review duplicates in this order:

1. **Exact name matches** (32 pairs) - These are almost certainly duplicates and should be resolved first
2. **High similarity matches** (4 pairs) - These are very likely duplicates with minor variations
3. **Medium similarity matches** (12 pairs) - These require careful review but are likely duplicates
4. **Other potential matches** (43 pairs) - These require the most scrutiny and may include false positives

### 4. Resolution Categories

When reviewing duplicates, categorize them as:

- **True duplicates**: Same organization with identical or nearly identical names
- **Name variations**: Same organization with different naming conventions (e.g., with/without acronyms)
- **Parent/Child relationships**: Organizations that are related but distinct (e.g., department vs. parent org)
- **False positives**: Organizations that are actually distinct despite name similarities

### 5. Run the Resolution Script

After reviewing and confirming duplicates in the JSON file, run the resolution script:

```bash
NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/resolve-duplicates.js reports/2025-07-29_duplicate-resolution.json
```

This script will:
- Process only the confirmed duplicates
- Merge fields from the duplicate into the keeper entry as specified
- Archive the duplicate entries
- Generate a detailed log of all actions taken

### 6. Verification

After running the resolution script:

1. Run the duplicate check again to verify all duplicates have been resolved:
   ```bash
   NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/check-duplicates.js
   ```

2. Review the resolution log at `reports/YYYY-MM-DD_duplicate-resolution-log.md`

3. Verify in Notion that:
   - Keeper entries contain all relevant information
   - Duplicate entries have been properly archived

## Special Cases

### Organizations with Multiple Duplicates

Some organizations may have more than one duplicate. For example:
- "Creative Destruction Lab Vancouver" appears in multiple duplicate pairs
- "CAIDA (Centre for AI Decision-making and Action)" has several variations

For these cases:
1. Identify the best entry to keep (most complete)
2. Mark all others as duplicates
3. Ensure all unique information is merged into the keeper entry

### Acronym Variations

Many duplicates differ only by the position or inclusion of acronyms:
- "SFU Digital Health Innovation Lab" vs "Digital Health Innovation Lab (SFU)"
- "AInBC (Artificial Intelligence network of BC)" vs "Artificial Intelligence Network of BC (AInBC)"

General rule: Prefer the format "Full Name (ACRONYM)" for consistency.

### Regional/Department Variations

Some duplicates represent the same organization with different regional or departmental specificity:
- "TELUS Data & AI Initiatives" vs "TELUS - Data & AI Initiatives"
- "UBC Centre for AI Decision-making and Action" vs "Centre for AI Decision-making and Action (CAIDA)"

Consider whether these should be merged or kept separate based on their actual relationship.

## Final Documentation

After completing the duplicate resolution:

1. Update the organization count in project documentation
2. Document the duplicate resolution process in the CHANGELOG.md
3. Add a note to the database schema documentation about the duplicate resolution policy 