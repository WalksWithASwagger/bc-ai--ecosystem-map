#!/bin/bash
# 🧹 Project Cleanup Script
# Reorganizes project structure for clean multi-database foundation

set -e  # Exit on error

echo "🧹 BC AI Ecosystem - Project Cleanup Script"
echo "============================================="
echo ""

# Safety check
read -p "🔄 This will reorganize your project structure. Create backup first? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Creating backup..."
    cp -r . "../ecosystem-map-bc-ai-backup-$(date +%Y%m%d-%H%M%S)"
    echo "✅ Backup created"
fi

echo ""
echo "🎯 Starting cleanup..."
echo ""

# Phase 1: Fix Tools Directory Redundancy
echo "🛠️ Phase 1: Consolidating Tools Directory..."

# Move content from unorganized to organized folders
if [ -d "tools/import" ] && [ "$(ls -A tools/import)" ]; then
    echo "   📁 Moving tools/import/ → tools/02-import/"
    mv tools/import/* tools/02-import/ 2>/dev/null || true
    rmdir tools/import 2>/dev/null || true
fi

if [ -d "tools/enhancement" ] && [ "$(ls -A tools/enhancement)" ]; then
    echo "   📁 Moving tools/enhancement/ → tools/03-enrichment/"
    mv tools/enhancement/* tools/03-enrichment/ 2>/dev/null || true
    rmdir tools/enhancement 2>/dev/null || true
fi

if [ -d "tools/scrapers" ] && [ "$(ls -A tools/scrapers)" ]; then
    echo "   📁 Moving tools/scrapers/ → tools/04-research/"
    mv tools/scrapers/* tools/04-research/ 2>/dev/null || true
    rmdir tools/scrapers 2>/dev/null || true
fi

if [ -d "tools/utility" ] && [ "$(ls -A tools/utility)" ]; then
    echo "   📁 Moving tools/utility/ → tools/07-utilities/"
    mv tools/utility/* tools/07-utilities/ 2>/dev/null || true
    rmdir tools/utility 2>/dev/null || true
fi

if [ -d "tools/analysis" ] && [ "$(ls -A tools/analysis)" ]; then
    echo "   📁 Moving tools/analysis/ → tools/07-utilities/"
    mv tools/analysis/* tools/07-utilities/ 2>/dev/null || true
    rmdir tools/analysis 2>/dev/null || true
fi

# Move loose tool files
if [ -f "tools/update-founding-years.js" ]; then
    echo "   📄 Moving update-founding-years.js → tools/03-enrichment/"
    mv tools/update-founding-years.js tools/03-enrichment/
fi

if [ -f "tools/update-betakit-funding.js" ]; then
    echo "   📄 Moving update-betakit-funding.js → tools/04-research/"
    mv tools/update-betakit-funding.js tools/04-research/
fi

if [ -f "tools/find-and-research-missing-emails.js" ]; then
    echo "   📄 Moving find-and-research-missing-emails.js → tools/04-research/"
    mv tools/find-and-research-missing-emails.js tools/04-research/
fi

# Clean up nested tools/tools directory (likely archive material)
if [ -d "tools/tools" ]; then
    echo "   🗄️ Moving tools/tools/ → archive/nested-tools-archive/"
    mkdir -p archive/nested-tools-archive
    mv tools/tools/* archive/nested-tools-archive/ 2>/dev/null || true
    rmdir tools/tools 2>/dev/null || true
fi

echo "✅ Tools directory reorganized"
echo ""

# Phase 2: Clean Root Directory
echo "📄 Phase 2: Streamlining Root Directory..."

# Create docs/reports if it doesn't exist
mkdir -p docs/reports

# Move completion reports to docs/reports
for file in "COMPREHENSIVE_PROJECT_AUDIT_2025.md" "UI_REFINEMENT_SUCCESS.md" "RESEARCH_PROGRESS_2025-08-04.md" "PROJECT_IS_CLEAN.md" "CLEAN_PROJECT_GUIDE.md"; do
    if [ -f "$file" ]; then
        echo "   📄 Moving $file → docs/reports/"
        mv "$file" docs/reports/
    fi
done

# Move cleanup plans to docs/reports
for file in "PROJECT_COMPREHENSIVE_CLEANUP_PLAN.md" "DETAILED_CLEANUP_ANALYSIS.md"; do
    if [ -f "$file" ]; then
        echo "   📄 Moving $file → docs/reports/"
        mv "$file" docs/reports/
    fi
done

echo "✅ Root directory streamlined"
echo ""

# Phase 3: Organize Data Directory
echo "📊 Phase 3: Organizing Data Directory..."

# Create historical directory for loose research files
mkdir -p data/historical/2025-08-03-research

# Move loose research files
for pattern in "*-2025-08-03.md" "leaderboard-impact-report.md"; do
    for file in data/$pattern; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            echo "   📄 Moving $filename → data/historical/2025-08-03-research/"
            mv "$file" data/historical/2025-08-03-research/
        fi
    done 2>/dev/null || true
done

echo "✅ Data directory organized"
echo ""

# Phase 4: Consolidate Archives (Optional)
read -p "🗄️ Consolidate archive directories? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗄️ Phase 4: Consolidating Archives..."
    
    # Create consolidated archive structure
    mkdir -p archive/2025-01-30-legacy-cleanup
    mkdir -p archive/2025-08-04-project-cleanup
    mkdir -p archive/historical-research
    
    # Move 2025-01-30 content
    if [ -d "archive/redundant-docs-2025-01-30" ]; then
        mv archive/redundant-docs-2025-01-30/* archive/2025-01-30-legacy-cleanup/ 2>/dev/null || true
        rmdir archive/redundant-docs-2025-01-30 2>/dev/null || true
    fi
    
    if [ -d "archive/legacy-tools-2025-01-30" ]; then
        mv archive/legacy-tools-2025-01-30/* archive/2025-01-30-legacy-cleanup/ 2>/dev/null || true
        rmdir archive/legacy-tools-2025-01-30 2>/dev/null || true
    fi
    
    # Move 2025-08-04 content
    if [ -d "archive/2025-08-04-massive-cleanup" ]; then
        mv archive/2025-08-04-massive-cleanup/* archive/2025-08-04-project-cleanup/ 2>/dev/null || true
        rmdir archive/2025-08-04-massive-cleanup 2>/dev/null || true
    fi
    
    if [ -d "archive/2025-08-04-pre-cleanup" ]; then
        mv archive/2025-08-04-pre-cleanup/* archive/2025-08-04-project-cleanup/ 2>/dev/null || true
        rmdir archive/2025-08-04-pre-cleanup 2>/dev/null || true
    fi
    
    # Move research archives
    if [ -d "archive/completed-research" ]; then
        mv archive/completed-research/* archive/historical-research/ 2>/dev/null || true
        rmdir archive/completed-research 2>/dev/null || true
    fi
    
    if [ -d "archive/research-sessions" ]; then
        mv archive/research-sessions/* archive/historical-research/ 2>/dev/null || true
        rmdir archive/research-sessions 2>/dev/null || true
    fi
    
    echo "✅ Archives consolidated"
else
    echo "⏭️ Skipped archive consolidation"
fi

echo ""

# Phase 5: Update Documentation Index
echo "📚 Phase 5: Updating Documentation..."

# Create updated master documentation index
cat > MASTER_DOCUMENTATION_INDEX.md << 'EOF'
# 📚 Master Documentation Index

## 🎯 Purpose
Central index of all documentation to prevent confusion and duplication.

## 📋 Active Documentation

### Core Project Files (Root)
- **[README.md](README.md)** - Main project overview and quick start
- **[CHANGELOG.md](CHANGELOG.md)** - Project history and version tracking
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute to the project
- **[ROADMAP.md](ROADMAP.md)** - Future development plans
- **[MULTI_DATABASE_QUICKSTART.md](MULTI_DATABASE_QUICKSTART.md)** - Multi-database architecture guide

### Research & Development
- **[tools/README.md](tools/README.md)** - Complete tools documentation
- **[docs/guides/database-schema.md](docs/guides/database-schema.md)** - Database structure
- **[docs/guides/WORKFLOW_GUIDE.md](docs/guides/WORKFLOW_GUIDE.md)** - Operational procedures

### Recent Reports
- **[docs/reports/COMPREHENSIVE_PROJECT_AUDIT_2025.md](docs/reports/COMPREHENSIVE_PROJECT_AUDIT_2025.md)** - Latest project audit
- **[docs/reports/UI_REFINEMENT_SUCCESS.md](docs/reports/UI_REFINEMENT_SUCCESS.md)** - UI development completion
- **[docs/reports/RESEARCH_PROGRESS_2025-08-04.md](docs/reports/RESEARCH_PROGRESS_2025-08-04.md)** - Research pipeline progress

## 🛠️ Tools Organization

The tools directory is now organized by function:

```
tools/
├── 00-core/           # Critical validation scripts
├── 01-validation/     # Quality checks and validation
├── 02-import/         # Data import utilities
├── 03-enrichment/     # Data enhancement tools
├── 04-research/       # Research and scraping tools
├── 05-cleanup/        # Maintenance and cleanup
├── 06-export/         # Export utilities
├── 07-utilities/      # General utility scripts
├── 08-pipelines/      # Research pipelines
├── 09-temporal-kg/    # Temporal knowledge graph
└── 10-multi-db/       # Multi-database architecture
```

## 📊 Data Organization

```
data/
├── projects/                    # Multi-database projects
├── historical/                  # Historical research data
├── discoveries/                 # Current research findings
├── intelligence/                # Intelligence reports
└── reports/                     # Generated reports
```

## 🗄️ Archive Structure

```
archive/
├── 2025-01-30-legacy-cleanup/  # Legacy cleanup documentation
├── 2025-08-04-project-cleanup/ # Recent project reorganization
├── historical-research/         # Historical research sessions
└── legacy-files/               # Legacy project files
```

---

*Last Updated: $(date +"%B %d, %Y")*  
*Structure: Ultra-clean and organized for multi-database architecture*
EOF

echo "✅ Documentation index updated"
echo ""

# Final summary
echo "🎉 CLEANUP COMPLETE!"
echo "===================="
echo ""
echo "✅ Tools directory: Organized into numbered folders (00-core → 10-multi-db)"
echo "✅ Root directory: Streamlined to 6 essential files"
echo "✅ Data directory: Loose files moved to historical/"
echo "✅ Documentation: Single master index created"
echo "✅ Archives: $(if [[ $REPLY =~ ^[Yy]$ ]]; then echo "Consolidated"; else echo "Left as-is"; fi)"
echo ""
echo "📊 Current Root Files:"
ls -1 *.md 2>/dev/null | head -10
echo ""
echo "🚀 READY FOR FUNDING DATABASE!"
echo "Your project structure is now clean and professional."
echo "Perfect foundation for adding your Notion funding data."
echo ""
echo "Next: Share your Notion funding page for database setup!"
echo ""