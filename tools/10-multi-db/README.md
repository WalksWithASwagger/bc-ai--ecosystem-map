# 🏗️ Multi-Database Research Architecture

This system allows you to manage multiple research projects/databases with shared tooling and pipelines.

## Quick Start

```bash
# Setup the system
cd tools/10-multi-db
npm install
node setup.js

# List all projects
node project-manager.js list

# Create a new project
node project-manager.js create my-project "My Project" funding "Track VC funding"

# Run discovery pipeline on a project
node universal-pipeline.js my-project discovery

# Run all pipelines on a project
node universal-pipeline.js my-project all

# Get project status
node universal-pipeline.js my-project status
```

## Project Types

### 🌱 Ecosystem
- **Purpose**: Map tech ecosystems, companies, people, relationships
- **Pipelines**: Discovery, enrichment, competitive analysis, temporal KG
- **Example**: BC AI Ecosystem

### 💰 Funding
- **Purpose**: Track VCs, funds, investments, funding rounds
- **Pipelines**: Funding intelligence, investor research, deal flow
- **Example**: VC Database, LP Database

### 🏆 Competitive
- **Purpose**: Monitor competitors, products, partnerships, market moves
- **Pipelines**: Competitive intelligence, product launches, market analysis
- **Example**: Competitor Database

## Architecture

```
tools/10-multi-db/
├── project-manager.js     # Create and manage projects
├── universal-pipeline.js  # Run pipelines on any project
├── configs/              # Project configurations
└── setup.js             # Initialize system

data/projects/
├── bc-ai-ecosystem/      # BC AI project data
├── funding-intelligence/ # Funding project data
└── competitive-intel/    # Competitive project data

ui/app/research/          # Multi-tenant research dashboard
├── page.tsx              # Project-aware dashboard
└── [project]/            # Project-specific pages
```

## Environment Variables

For each project, you can set project-specific environment variables:

```bash
# Default Notion token
NOTION_TOKEN=your_token_here

# Project-specific tokens (optional)
NOTION_TOKEN_BC_AI_ECOSYSTEM=bc_ai_token
NOTION_TOKEN_FUNDING_INTELLIGENCE=funding_token
NOTION_TOKEN_COMPETITIVE_INTELLIGENCE=competitive_token
```

## UI Integration

The research dashboard at `http://localhost:3004/research` now supports:

1. **Project Selector**: Switch between different databases
2. **Project-Specific Data**: Each project shows only its data
3. **Shared Tooling**: All pipelines work across projects
4. **Multi-Tenant Architecture**: Clean separation of concerns

## Adding New Projects

```javascript
const manager = new ProjectManager();

const newProject = manager.createProject({
  id: 'climate-tech',
  name: 'Climate Tech Database', 
  type: 'ecosystem',
  description: 'Climate and clean tech companies',
  notionDatabaseId: 'your-notion-db-id'
});
```

## Running Pipelines

```bash
# Run specific pipeline
node universal-pipeline.js climate-tech discovery
node universal-pipeline.js funding-db funding
node universal-pipeline.js competitors competitive

# Run all enabled pipelines
node universal-pipeline.js climate-tech all

# Check project status
node universal-pipeline.js climate-tech status
```

This architecture allows you to:
- ✅ Reuse all your awesome research tools
- ✅ Keep databases separate and organized
- ✅ Scale to unlimited projects
- ✅ Maintain clean separation of concerns
- ✅ Use the same UI for all projects
