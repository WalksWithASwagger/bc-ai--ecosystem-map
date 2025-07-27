# Database Cleanup Strategy

## Current Situation
- **573 organizations** in database (should be 355)
- **218 duplicate entries** need removal
- **Enhanced data exists** but is scattered across duplicates

## Cleanup Priority

### Phase 1: Enhanced Organizations (High Priority)
Preserve our research-enhanced entries for:

1. **1QBit** (3 entries)
   - ✅ Keep: ID d342789b (has enhanced data: "Andrew Fursman (CEO), Landon Downs (CTO)")
   - ❌ Delete: ID 33890703, 1cac4571 (basic data only)

2. **Two Hat Security** (3 entries)
   - ✅ Keep: ID e583c8e3 (has enhanced data: "Chris Priebe (CEO & Founder), Jeff Roy (CTO)")
   - ❌ Delete: ID b2e55a5f, 5c9d6bbe (basic data only)

3. **AbCellera** (3 entries)
   - ✅ Keep: ID 7190af1b (100% complete: "Carl Hansen (founder & CEO), Véronique Lecault")
   - ❌ Delete: ID cec9ed40, ce90b557

4. **Variational AI** (3 entries)
   - ✅ Keep: ID 8fc5b79b (100% complete: "Handol Kim (Co-Founder & CEO), Jason Rolfe")
   - ❌ Delete: ID fab3ff04, a6a19e53

### Phase 2: High-Completeness Organizations
For organizations with multiple enhanced entries, keep the most complete:

5. **Lumen5** (3 entries)
   - ✅ Keep: ID 7664844c (100% complete with research data)
   - ❌ Delete: Others

6. **Bonsai Micro** (3 entries)
   - ✅ Keep: ID 83794ab3 (100% complete with founders data)
   - ❌ Delete: Others

### Phase 3: Systematic Cleanup
For remaining duplicates, apply rule:
- Keep entry with highest completeness score
- If tied, keep the most recently created entry
- If still tied, keep entry with website URL

## Safety Measures
1. **Backup**: Export all data before deletion
2. **Verification**: Double-check enhanced entries are preserved
3. **Test Deletions**: Start with 5 obvious duplicates
4. **Manual Review**: Check ambiguous cases manually

## Execution Plan
1. Export current database state
2. Delete clear duplicates (keeping enhanced entries)
3. Verify enhanced data is preserved
4. Run completeness analysis to confirm improvement
5. Update organization counts

## Expected Results
- **Before**: 573 organizations (23% avg completeness)
- **After**: 355 organizations (35%+ avg completeness)
- **Benefit**: Cleaner data, accurate counts, preserved research

## Next Steps
1. Execute Phase 1 deletions (enhanced orgs)
2. Verify data integrity
3. Continue with systematic cleanup
4. Re-run analysis to confirm results 