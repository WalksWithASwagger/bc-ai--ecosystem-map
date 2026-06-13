# BC AI Ecosystem Atlas - Cruft Cleanup Plan

*July 29, 2025*

This document outlines a plan to clean up cruft and outdated files in the BC AI Ecosystem Atlas project to keep everything tidy and up-to-date.

## 1. Broken Documentation Links

### Issues Found
- README.md contains links to non-existent files:
  - `ROADMAP.md` (referenced in badge and "View Full Roadmap" link)
  - `ENHANCEMENT_TOOLS.md` (referenced in badge and "View Enhancement Tools Documentation" link)
  - `database-schema.md` (referenced in Organizations badge)

### Recommended Actions
1. **Create Missing Documentation Files**:
   - Create `ROADMAP.md` with updated project roadmap information
   - Create `ENHANCEMENT_TOOLS.md` with documentation for the enhancement tools
   - Create `database-schema.md` with the current Notion database schema

2. **Alternative Approach**:
   - Update README.md to point to existing files instead (e.g., reports/2025-07-29_data-enhancement-plan.md)
   - Remove badges that link to non-existent files

## 2. Outdated Root Files

### Issues Found
Several files in the root directory appear to be outdated or redundant:
- `analyze-completeness.js` (superseded by `scripts/scan-completeness.js`)
- `analyze-database.js` (possibly outdated)
- `analyze-masterlist.js` (possibly outdated)
- `analyze-missing-fields.js` (superseded by newer scripts)
- `level-up-analyst.js` (purpose unclear)
- `sanity-check.js` (purpose unclear)
- `test-connection.js` (likely only needed for initial setup)
- `test-notion.js` (likely only needed for initial setup)
- `visualize-completeness.js` (purpose unclear)

### Recommended Actions
1. **Review and Archive**:
   - Review each file to confirm it's no longer needed
   - Move confirmed outdated files to `completed-research/archive-2025-07-29/code-archive/`
   - Document the purpose of each archived file

2. **Update CHANGELOG.md**:
   - Add an entry about the cleanup in the Unreleased section

## 3. Duplicate Markdown Files

### Issues Found
Several markdown files appear to contain similar or duplicate information:
- `completeness-insights.md` vs `missing-fields-report.md`
- Multiple files in `imports/` directory with similar content

### Recommended Actions
1. **Consolidate Similar Files**:
   - Review content and merge similar files where appropriate
   - Create a clear naming convention for import logs and reports

2. **Organize by Date**:
   - Move older reports to dated subdirectories in `reports/`
   - Keep only the most recent and relevant files in the root directory

## 4. Outdated CHANGELOG.md

### Issues Found
- CHANGELOG.md last updated on January 15, 2025
- Missing entries for recent work (discovery imports, data enhancement)

### Recommended Actions
1. **Update CHANGELOG.md**:
   - Add entries for all major work completed since January 27, 2025
   - Include the recent discovery imports (104 + 35 organizations)
   - Update database statistics table with current numbers

2. **Add Version Number**:
   - Assign appropriate version number to recent changes (e.g., 2.4.0)

## 5. Script Organization

### Issues Found
- Some scripts in root directory, others in `scripts/` directory
- No clear documentation of what each script does

### Recommended Actions
1. **Move All Scripts to scripts/ Directory**:
   - Move remaining JavaScript files from root to `scripts/`
   - Update any references or documentation accordingly

2. **Create Script Documentation**:
   - Add a README.md in the `scripts/` directory
   - Document the purpose and usage of each script

## 6. Redundant Discovery Files

### Issues Found
- Multiple discovery files with overlapping organizations
- `consolidated-missing-orgs.md` now redundant after successful import

### Recommended Actions
1. **Archive Processed Discovery Files**:
   - Move all processed discovery files to `discoveries/archive/`
   - Keep only the most recent or unprocessed files in the main directory

2. **Create Discovery Documentation**:
   - Add a README.md in the `discoveries/` directory
   - Document the discovery process and file naming conventions

## 7. Update Last Modified Dates

### Issues Found
- Several documentation files have outdated "Last Updated" dates

### Recommended Actions
1. **Update All Documentation Files**:
   - Review all markdown files with "Last Updated" sections
   - Update dates to reflect recent changes

## 8. Implementation Plan

1. **Immediate Actions**:
   - Create missing documentation files referenced in README.md
   - Update CHANGELOG.md with recent work

2. **Short-term Actions** (Next 1-2 days):
   - Move outdated scripts to archive
   - Consolidate similar markdown files

3. **Medium-term Actions** (Next week):
   - Reorganize all scripts into appropriate directories
   - Create comprehensive documentation for each directory

4. **Documentation Updates**:
   - Update README.md to accurately reflect current project state
   - Ensure all links in documentation point to existing files

By implementing this cleanup plan, the BC AI Ecosystem Atlas project will be more organized, with up-to-date documentation and a cleaner file structure. 