# 🧹 BC AI Ecosystem Project Cleanup Guide

## 📅 Created: August 4, 2025

## 🎯 Objectives
1. Clean up project structure
2. Archive old files
3. Organize scripts logically
4. Remove redundant documentation
5. Establish clear maintenance practices

## 📊 Current State Analysis

### File Count by Type
- JavaScript files: ~200+ in tools/
- Markdown docs: ~100+ scattered across project
- JSON data files: ~50+ in various locations
- Archived content: Multiple archive folders

### Issues Identified
- 🔴 Duplicate scripts with similar functionality
- 🔴 Hardcoded tokens in some scripts
- 🔴 Too many documentation files saying similar things
- 🔴 Unclear which scripts are current vs legacy
- 🔴 Data files mixed with code files

## 🗂️ Recommended Structure

```
ecosystem-map-bc-ai/
├── README.md (main project overview)
├── CHANGELOG.md
├── .gitignore
├── package.json
│
├── docs/
│   ├── DATABASE_CLEANUP_DOCUMENTATION.md
│   ├── DATA_VALIDATION_RULES.md
│   ├── API_SETUP.md
│   ├── WORKFLOW_GUIDE.md
│   └── archives/ (old documentation)
│
├── tools/
│   ├── README.md
│   ├── [organized by category - see SCRIPT_ORGANIZATION_PLAN.md]
│   └── archive/
│
├── data/
│   ├── README.md
│   ├── current/ (active data files)
│   └── archive/ (old data files)
│
├── reports/
│   ├── weekly/
│   ├── cleanup-reports/
│   └── archive/
│
└── archive/
    ├── 2025-08-04-pre-cleanup/
    └── legacy-files/
```

## 🔄 Cleanup Tasks

### 1. Documentation Consolidation
- [ ] Merge similar documentation files
- [ ] Archive outdated success reports
- [ ] Create single source of truth for each topic
- [ ] Update main README.md

### 2. Script Organization
- [ ] Implement structure from SCRIPT_ORGANIZATION_PLAN.md
- [ ] Add headers to all active scripts
- [ ] Archive scripts not used in 30+ days
- [ ] Remove hardcoded credentials

### 3. Data File Management
- [ ] Move all current data to data/current/
- [ ] Archive processed data older than 7 days
- [ ] Clean up temporary files
- [ ] Organize by date and type

### 4. Report Consolidation
- [ ] Keep only latest reports
- [ ] Archive daily reports older than 7 days
- [ ] Create summary reports
- [ ] Remove duplicate reports

## 🛡️ Prevention Measures

### 1. Naming Conventions
```
Scripts: [action]-[target]-[modifier].js
Data: YYYY-MM-DD_[description].json
Reports: YYYY-MM-DD_[type]_report.md
```

### 2. Regular Maintenance
- Weekly: Archive old daily reports
- Monthly: Review and archive unused scripts
- Quarterly: Full project structure review

### 3. Documentation Standards
- One doc per major topic
- Clear versioning
- Archive don't delete
- Keep docs under 500 lines

## 📝 Files to Archive Immediately

### Redundant Success Reports (30+ files)
- BC_AI_ECOSYSTEM_PHASE_*_SUCCESS.md
- *_COMPLETION.md
- *_SUCCESS.md
- Move to: archive/success-reports/

### Old Research Files
- All files in data/research/ older than 7 days
- Processed company data already imported
- Move to: archive/research-2025-07/

### Duplicate Scripts
- Multiple LinkedIn updaters
- Various company adders
- Old enhancement scripts
- Move to: tools/archive/

## ⚡ Quick Wins

1. **Create archive directory**
   ```bash
   mkdir -p archive/2025-08-04-pre-cleanup
   ```

2. **Move old documentation**
   ```bash
   mv *SUCCESS*.md archive/2025-08-04-pre-cleanup/
   mv *COMPLETE*.md archive/2025-08-04-pre-cleanup/
   ```

3. **Clean up root directory**
   - Keep only essential files in root
   - Move reports to reports/
   - Move data files to data/

4. **Update .gitignore**
   ```
   config.js
   *.local.json
   node_modules/
   .env
   ```

## 🎯 Success Metrics

### Clean Project Indicators
- [ ] No duplicate functionality
- [ ] Clear file organization
- [ ] No hardcoded secrets
- [ ] <10 files in root directory
- [ ] All scripts have headers
- [ ] Documentation is current

### Maintenance Health
- [ ] Weekly cleanup scheduled
- [ ] Clear archive policy
- [ ] Naming conventions followed
- [ ] No files >6 months old in active dirs

## 🚀 Next Steps

1. **Immediate** (Today)
   - Archive old success reports
   - Create organized directory structure
   - Move cleanup scripts to proper location

2. **Short Term** (This Week)
   - Reorganize all tools/ scripts
   - Consolidate documentation
   - Clean up data files

3. **Long Term** (Ongoing)
   - Weekly maintenance routine
   - Monthly architecture review
   - Quarterly deep clean

## 📌 Important Notes

- Always archive, don't delete (unless truly redundant)
- Test scripts after moving them
- Update imports/requires after reorganization
- Document any breaking changes
- Keep audit trail of what was moved where