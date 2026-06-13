# 🧹 BC AI Ecosystem Database Cleanup Plan

## 📊 Audit Summary
- **Total Entries**: 1,404
- **Problematic Entries Found**: ~25-30 entries
- **Percentage Affected**: ~2%

## 🚨 Identified Issues

### 1. **Field Names as Organizations** (20+ entries)
These are database field names that were accidentally added as organization entries:
- "Name"
- "Category"
- "Key People"
- "Employee Count"
- "Valuation"
- "Revenue"
- "Year Founded"
- "Last Verified"
- "Database Fields Populated"
- "Tools Created/Used"
- "After Addition"
- "Before Addition"

### 2. **Task/Activity Entries** (4 entries)
These appear to be tasks or activities, not organizations:
- "Deep dive specific sectors"
- "Track exits and acquisitions"
- "Monitor funding announcements"
- "batch-15-formatted.json" (filename)

### 3. **Sector/Category Names** (3 entries)
These are category names, not specific organizations:
- "Emerging Sectors"
- "Biotech/Life Sciences"
- "CleanTech Innovation"
- "AI/ML Applications"

### 4. **Suspicious Single Values** (3 entries)
- "2025" (just a year)
- "New Media BC" (needs verification if real org)

### 5. **Valid Abbreviations** (Keep these)
- "Cmd" - Has website (https://cmd.com), legitimate company
- "UBC" - Likely University of British Columbia
- "T4G" - Needs verification

### 6. **Duplicate Entry**
- "Digital Technology Supercluster" appears twice

## 🛠️ Cleanup Actions

### Phase 1: Remove Obvious Errors (25 entries)
Delete these entries that are clearly database fields or tasks:
1. All field name entries (Name, Category, Key People, etc.)
2. Task/activity entries
3. Sector/category names
4. The "2025" entry
5. The "batch-15-formatted.json" entry

### Phase 2: Verify & Clean Questionable Entries
1. Research "New Media BC" - could be legitimate
2. Verify "T4G" - check if it's a real company
3. Merge duplicate "Digital Technology Supercluster" entries

### Phase 3: Data Quality Improvements
1. **Missing Websites** (936 entries / 66.7%)
   - Many legitimate organizations missing websites
   - Not all need removal, but should be enriched

2. **Validation Rules** to prevent future issues:
   - Minimum name length: 4 characters
   - Reject common field names
   - Reject URLs/emails as names
   - Require at least one additional field besides name

## 📝 Entries to Delete (High Confidence)

```
IDs to remove:
- 244c6f79-9a33-8105-bb86-ff20e744feea (Name)
- 244c6f79-9a33-8122-bf35-d53645232900 (2025)
- 244c6f79-9a33-813f-8b53-cd857411188f (Category)
- 244c6f79-9a33-8109-a4ea-e6126a058cb0 (Last Verified)
- 244c6f79-9a33-8106-8a84-f520171456fc (Key People)
- 244c6f79-9a33-8136-b835-ef9ce07b1feb (Employee Count)
- 244c6f79-9a33-818f-9049-f86a7914a581 (Valuation)
- 244c6f79-9a33-8170-8c0f-df1fc0ad4999 (Revenue)
- 244c6f79-9a33-81ee-9b52-fd1e9e6fd6c1 (Year Founded)
- 244c6f79-9a33-8137-aa2a-ce80fc58323f (Database Fields Populated)
- 244c6f79-9a33-8164-9921-dbe5a83d73df (batch-15-formatted.json)
- 244c6f79-9a33-81a3-94c2-ce1ac8b12283 (Tools Created/Used)
- 244c6f79-9a33-814e-a271-cef5d7a0c749 (Deep dive specific sectors)
- 244c6f79-9a33-812e-a705-df1fafd5be17 (Track exits and acquisitions)
- 244c6f79-9a33-81c3-becb-dcdde13c6399 (Monitor funding announcements)
- 244c6f79-9a33-8159-8bf0-c571a6a8fb8e (After Addition)
- 244c6f79-9a33-81a1-8481-ef1efb248a60 (Before Addition)
- 244c6f79-9a33-814a-a93a-c00f84510dd0 (Emerging Sectors)
- 244c6f79-9a33-81dd-9a63-f8d00097efa4 (Biotech/Life Sciences)
- 244c6f79-9a33-81f6-936e-d6888381a96e (CleanTech Innovation)
- 244c6f79-9a33-812d-b7a8-d020a1b4504a (AI/ML Applications)
```

## ✅ Next Steps
1. **Review this plan** - Confirm entries to delete
2. **Create backup** - Export current database state
3. **Execute deletion** - Remove confirmed entries
4. **Verify remaining entries** - Check questionable ones
5. **Implement validation** - Add rules to prevent recurrence

## 🎯 Expected Result
- Clean database with only legitimate BC AI organizations
- From 1,404 to ~1,380 entries
- Better data quality and integrity