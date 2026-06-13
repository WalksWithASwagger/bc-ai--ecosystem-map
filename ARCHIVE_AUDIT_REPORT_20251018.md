# Archive Audit Report - Ecosystem Map BC AI

**Date**: 2025-10-18
**Purpose**: Comprehensive audit of archived files and directories
**Recommendation**: Review and implement retention policy

---

## Executive Summary

The ecosystem-map-bc-ai project contains **43 MB** of archived content across multiple archive directories with different organizational patterns and retention strategies.

### Key Findings

- **5 major archive locations** identified
- **Multiple dated archives** from 2025-01 through 2025-08
- **Nested archive structures** creating complexity
- **38 MB in tools/_archive** alone
- **No clear retention policy** documented

### Immediate Recommendations

1. **Consolidate archives** into single location with clear dates
2. **Implement retention policy** (suggest 6-month rolling retention)
3. **Move to external storage** for long-term historical archives
4. **Document what's archived and why**

---

## Archive Locations

### 1. Main Archive Directory: `./archive/`
**Size**: 4.7 MB

**Contents**:
```
archive/
├── 2025-01-30-legacy-cleanup/      # January legacy cleanup
├── 2025-08-04-pre-cleanup/         # Pre-cleanup snapshot
├── 2025-08-04-project-cleanup/     # Project cleanup files
├── historical-research/            # Research archives
│   ├── archive-2025-07-29/
│   │   └── code-archive/
│   └── archive-2025-08-01/
├── legacy-files/                   # Undefined legacy content
└── nested-tools-archive/           # Tools moved during cleanup
    └── archive/                    # Nested archive (!)
```

**Issues**:
- Nested archive within archive (`nested-tools-archive/archive/`)
- Multiple dated snapshots from same month (Aug 4)
- Unclear what "legacy" means vs dated archives
- No documented retention policy

**Recommendation**:
- Keep most recent snapshot only (2025-08-04-project-cleanup)
- Move older archives to external storage
- Flatten nested archive structure
- Document what each archive contains

---

### 2. Tools Archive: `./tools/_archive/`
**Size**: 38 MB (⚠️ Largest archive!)

**Contents**:
```
tools/_archive/
├── 00-core/                 # Archived core tools
├── 01-validation/          # Archived validation tools
├── 05-cleanup/             # Archived cleanup tools
├── 06-export/              # Archived export tools
├── 07-utilities/           # Archived utility scripts
├── 08-pipelines/           # Archived pipeline tools
├── 09-temporal-kg/         # Archived temporal knowledge graph
├── one-time-scripts/       # One-time migration scripts
├── mcp-base.js             # MCP migration files
├── mcp-check-duplicates.js
├── mcp-constants.js
├── mcp-manager.js
└── migrate-to-mcp.js
```

**Analysis**:
- Well-organized by category
- Contains 300+ JavaScript files
- Includes MCP migration scripts (may still be useful)
- "one-time-scripts" should probably be deleted after verification

**Recommendation**:
- **Review MCP files** - May still be useful for reference
- **Delete one-time-scripts** - Only if verified complete
- **External backup** - Move to external storage, not active project
- **Keep only**: Documentation of what was archived and why

---

### 3. Consolidated Archive: `./tools/consolidated-archive/`
**Size**: 52 KB

**Contents**: Small archive, likely consolidation of older files

**Recommendation**:
- Review contents
- Merge with main archive if duplicate
- Delete if superseded by newer archives

---

### 4. Documentation Archives

**Locations**:
```
./docs/archived-plans/       # Archived planning documents
./docs/archive/              # General doc archives
```

**Recommendation**:
- Keep important plans for historical reference
- Consider moving to main archive with date prefix
- Document what was decided and why plans changed

---

### 5. Data Archives

**Locations**:
```
./data/discoveries/archive/           # Archived discoveries
./data/reports/archive-daily-2025-07-30/  # Dated report archive
```

**Recommendation**:
- Data archives may have historical value
- Keep recent (< 3 months) for reference
- Move older to external storage
- Consider keeping reports as compressed archives

---

## Cleanup Recommendations

### Phase 1: Immediate Actions (Safe)

1. **Document Archive Contents**
   ```bash
   # Create archive manifest
   for dir in archive tools/_archive tools/consolidated-archive; do
     echo "=== $dir ===" >> ARCHIVE_MANIFEST.md
     find "$dir" -type f -name "*.js" -o -name "*.md" >> ARCHIVE_MANIFEST.md
   done
   ```

2. **Fix Nested Archives**
   - Flatten `nested-tools-archive/archive/` structure
   - Merge duplicate archives from same time period

3. **External Backup**
   ```bash
   # Backup archives before cleanup
   tar -czf ecosystem-archives-$(date +%Y%m%d).tar.gz archive/ tools/_archive/
   # Move to external storage (Dropbox, external drive, etc.)
   ```

### Phase 2: Consolidation (Review Required)

4. **Consolidate to Single Archive**
   ```
   archive/
   ├── 2025-01-legacy/          # Jan cleanup
   ├── 2025-07-research/        # July research archives
   ├── 2025-08-cleanup/         # August cleanup (consolidated)
   └── tools-archive/           # All archived tools
       └── mcp-migration/       # MCP-specific files
   ```

5. **Implement Retention Policy**
   - **Current month**: Keep in active project
   - **1-3 months**: Keep in archive/ for reference
   - **3-6 months**: Compress and keep in archive/
   - **6+ months**: Move to external storage
   - **12+ months**: Delete unless historical significance

### Phase 3: Aggressive Cleanup (Verify First!)

6. **Candidates for Deletion** (after verification):
   - `tools/_archive/one-time-scripts/` - One-time migrations (if completed)
   - `archive/2025-01-30-legacy-cleanup/` - 9 months old
   - Duplicate archives from same cleanup event
   - Nested archive structures

7. **Files to Keep** (move to external if old):
   - MCP migration scripts (reference for future migrations)
   - Latest cleanup snapshots (2025-08-04)
   - Important research archives
   - Documentation of major decisions

---

## Proposed Cleanup Commands

⚠️ **BACKUP FIRST! Run these only after external backup created!**

```bash
cd ~/code/notion-local/ecosystem-map-bc-ai

# 1. Create external backup
tar -czf ~/Backups/ecosystem-archives-20251018.tar.gz archive/ tools/_archive/ tools/consolidated-archive/

# 2. Create archive manifest
echo "# Archive Manifest - Created $(date)" > ARCHIVE_MANIFEST.md
echo "" >> ARCHIVE_MANIFEST.md
find archive tools/_archive tools/consolidated-archive -type f \( -name "*.js" -o -name "*.md" \) | sort >> ARCHIVE_MANIFEST.md

# 3. Flatten nested archives (after verification)
# mv archive/nested-tools-archive/archive/* archive/nested-tools-archive/
# rmdir archive/nested-tools-archive/archive/

# 4. Delete old archives (VERIFY BACKUP FIRST!)
# rm -rf archive/2025-01-30-legacy-cleanup/  # 9 months old
# rm -rf tools/_archive/one-time-scripts/    # If migrations complete

# 5. Consolidate remaining archives
# mkdir -p archive/2025-08-cleanup
# mv archive/2025-08-04-* archive/2025-08-cleanup/
```

---

## Archive Retention Policy (Proposed)

### Policy

1. **Active Development** (0-30 days)
   - Location: Project directory
   - Action: Work in progress

2. **Recent Archive** (1-3 months)
   - Location: `archive/YYYY-MM-description/`
   - Action: Keep for reference
   - Format: Organized directories

3. **Medium-term Archive** (3-6 months)
   - Location: `archive/YYYY-MM-description.tar.gz`
   - Action: Compress to save space
   - Format: Compressed archives

4. **Long-term Archive** (6-12 months)
   - Location: External storage (Dropbox, external drive)
   - Action: Move out of active project
   - Format: Compressed with manifest

5. **Historical** (12+ months)
   - Location: External storage or deleted
   - Action: Delete unless historical value
   - Format: Documented decisions only

### Exceptions

**Keep indefinitely**:
- Major migration scripts (for reference)
- Architectural decision records
- Important research findings
- Project completion snapshots

**Delete immediately**:
- Duplicate archives of same content
- One-time scripts after verification
- Temporary files and logs
- Build artifacts and cache

---

## File Count Estimates

Based on du size estimates and typical JS file sizes:

| Location | Size | Est. Files | Category |
|----------|------|------------|----------|
| tools/_archive/ | 38 MB | ~500-800 | Scripts |
| archive/ | 4.7 MB | ~50-100 | Mixed |
| tools/consolidated-archive/ | 52 KB | ~5-10 | Scripts |
| **Total** | **~43 MB** | **~600-1000** | All |

### Cleanup Target

- **Current**: ~43 MB, 600-1000 files
- **Target**: ~5 MB, 50-100 files (90% reduction)
- **Method**: External backup + selective retention

---

## Next Steps

1. ✅ **Review this report** - Understand what's archived
2. ⚠️ **Create backup** - External backup before any deletion
3. 📋 **Create manifest** - Document what's in each archive
4. 🗑️ **Delete safely** - Remove verified duplicates and old content
5. 📦 **Compress** - Compress remaining archives
6. 📚 **External storage** - Move old archives out of project
7. 📝 **Document** - Update README with retention policy

---

## Questions to Answer Before Cleanup

1. **Are MCP migration scripts still needed?** (tools/_archive/mcp-*.js)
2. **What's in nested-tools-archive/archive/?** (double-check before delete)
3. **Are one-time-scripts complete?** (verify before delete)
4. **What legacy files are worth keeping?** (archive/legacy-files/)
5. **Where should external backup live?** (Dropbox, Time Machine, etc.)

---

*This audit provides a roadmap for systematic archive cleanup while preserving important historical data and reducing project bloat by ~90%.*
