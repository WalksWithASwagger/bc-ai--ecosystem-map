# 🎯 BC AI Ecosystem - Clean Project Guide

## ✅ Project is Now Clean!

### What We Did:
1. **Removed 750 invalid database entries**
2. **Archived 50+ redundant documentation files**
3. **Moved 143 scripts from root to organized folders**
4. **Created clear directory structure**
5. **Established validation pipeline**

## 📁 Clean Project Structure

```
ecosystem-map-bc-ai/
├── 📄 Core Files (Root - Only 5 files!)
│   ├── README.md                    # Start here
│   ├── CHANGELOG.md                 # Version history
│   ├── CONTRIBUTING.md              # How to contribute
│   ├── ROADMAP.md                   # Future plans
│   └── MASTER_DOCUMENTATION_INDEX.md # Doc directory
│
├── 📚 docs/                         # All documentation
│   ├── guides/                      # How-to guides
│   │   ├── database-schema.md       # Database structure
│   │   └── WORKFLOW_GUIDE.md        # Using the tools
│   └── maintenance/                 # Maintenance docs
│       ├── DATABASE_CLEANUP_DOCUMENTATION.md
│       ├── DATA_VALIDATION_RULES.md
│       └── MAINTENANCE_SCHEDULE.md
│
├── 🛠️ tools/                        # All scripts (organized!)
│   ├── 00-core/                     # Critical scripts
│   │   └── validate-before-import.js # ALWAYS USE FIRST
│   ├── 01-validation/               # Quality checks
│   ├── 02-import/                   # Import tools
│   ├── 03-enrichment/               # Data enhancement
│   ├── 04-research/                 # Research tools
│   ├── 05-cleanup/                  # Maintenance
│   ├── 06-export/                   # Export tools
│   ├── 07-utilities/                # Helpers
│   └── SCRIPT_DOCUMENTATION.md      # Script guide
│
├── 📊 data/                         # Research data
├── 📈 reports/                      # Generated reports
├── 🔧 scripts/                      # Automation scripts
│   └── maintenance/                 # Cron jobs
└── 🗄️ archive/                      # Old files
```

## 🚀 Quick Start for Research

### 1. Validate Your Data FIRST
```bash
# Before importing ANY new data:
node tools/00-core/validate-before-import.js your-data.json
```

### 2. Check Current Database State
```bash
# See what's in the database:
node tools/01-validation/comprehensive-db-scanner.js

# Current stats: 649 verified BC AI organizations
```

### 3. Research New Companies
```bash
# Find companies missing data:
node tools/04-research/find-missing-logos.js
node tools/04-research/find-unicorns-high-value.js

# Research specific companies:
node tools/04-research/comprehensive-company-researcher.js
```

### 4. Import Validated Data
```bash
# ONLY after validation passes:
node tools/02-import/smart-data-merger.js validated-data.json
```

### 5. Enrich Existing Data
```bash
# Add more information:
node tools/03-enrichment/unified-enrichment.js --limit=50
```

## 📋 Essential Documentation

### Must Read First:
1. **[docs/maintenance/DATA_VALIDATION_RULES.md](docs/maintenance/DATA_VALIDATION_RULES.md)** - Understand the rules
2. **[tools/SCRIPT_DOCUMENTATION.md](tools/SCRIPT_DOCUMENTATION.md)** - How to use each script

### For Daily Work:
1. **[docs/guides/WORKFLOW_GUIDE.md](docs/guides/WORKFLOW_GUIDE.md)** - Step-by-step workflows
2. **[docs/guides/database-schema.md](docs/guides/database-schema.md)** - Database structure

## ⚠️ Critical Rules

### NEVER:
- ❌ Import without validation
- ❌ Put scripts in root directory
- ❌ Create duplicate documentation
- ❌ Accept entries with <2 data fields

### ALWAYS:
- ✅ Run validate-before-import.js first
- ✅ Keep scripts in tools/ subdirectories
- ✅ Update existing docs instead of creating new ones
- ✅ Archive old files, don't delete

## 🎯 Your Clean Database

- **649 organizations** (all verified)
- **0 duplicates**
- **0 junk entries**
- **100% validated**

## 📊 Research Priorities

Based on current data gaps:
1. **Missing Websites**: ~35% of organizations
2. **Missing Contact Info**: ~55% of organizations
3. **Missing Founding Years**: ~60% of organizations
4. **Missing Funding Data**: ~60% of organizations

## 🔧 Daily Maintenance

Automated tasks run via cron:
- **9 AM**: Database validation scan
- **6 PM**: Daily backup
- **Mondays**: Weekly audit
- **1st of month**: Deep clean

## 🚨 If Something Goes Wrong

1. Check validation logs: `reports/daily/`
2. Run manual scan: `node tools/01-validation/comprehensive-db-scanner.js`
3. Create backup: `node tools/06-export/backup-database.js`
4. Check this guide and [MASTER_DOCUMENTATION_INDEX.md](MASTER_DOCUMENTATION_INDEX.md)

---

**The project is now clean and ready for confident research!**

*No more clutter. No more confusion. Just clean, organized, validated data.*

*Last cleanup: August 4, 2025*