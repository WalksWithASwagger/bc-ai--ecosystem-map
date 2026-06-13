#!/usr/bin/env node
/**
 * 🚀 Multi-Database Setup Script
 * 
 * Initializes the multi-database research architecture
 * Creates default projects and sets up the directory structure
 */

const fs = require('fs');
const path = require('path');
const ProjectManager = require('./project-manager');

console.log('🏗️ Setting up Multi-Database Research Architecture...\n');

async function setup() {
  try {
    // Initialize project manager
    const manager = new ProjectManager();
    
    console.log('📁 Creating directory structure...');
    
    // Ensure base directories exist
    const baseDirectories = [
      path.join(__dirname, '../../data/projects'),
      path.join(__dirname, 'configs'),
      path.join(__dirname, '../../logs/multi-db')
    ];

    baseDirectories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`   ✅ Created: ${dir}`);
      } else {
        console.log(`   📁 Exists: ${dir}`);
      }
    });

    console.log('\n🌱 Creating default BC AI Ecosystem project...');
    
    // Create default BC AI project
    const bcAiProject = {
      id: 'bc-ai-ecosystem',
      name: 'BC AI Ecosystem',
      type: 'ecosystem',
      description: 'British Columbia AI and tech ecosystem mapping with comprehensive research pipelines',
      notionDatabaseId: process.env.NOTION_DATABASE_ID || ''
    };

    let bcProject;
    try {
      // Check if project already exists
      bcProject = manager.getProject('bc-ai-ecosystem');
      console.log('   📋 BC AI Ecosystem project already exists');
    } catch (error) {
      // Create new project
      bcProject = manager.createProject(bcAiProject);
      console.log('   ✅ Created BC AI Ecosystem project');
    }

    console.log('\n💰 Creating sample Funding Database project...');
    
    // Create sample funding project
    const fundingProject = {
      id: 'funding-intelligence',
      name: 'Funding Intelligence Database',
      type: 'funding',
      description: 'Comprehensive database of VCs, funds, and investment opportunities',
      notionDatabaseId: ''
    };

    let fundingProj;
    try {
      fundingProj = manager.getProject('funding-intelligence');
      console.log('   📋 Funding Intelligence project already exists');
    } catch (error) {
      fundingProj = manager.createProject(fundingProject);
      console.log('   ✅ Created Funding Intelligence project');
    }

    console.log('\n🏆 Creating sample Competitive Analysis project...');
    
    // Create sample competitive project
    const competitiveProject = {
      id: 'competitive-intelligence',
      name: 'Competitive Intelligence',
      type: 'competitive',
      description: 'Monitor competitors, product launches, and market movements',
      notionDatabaseId: ''
    };

    let compProject;
    try {
      compProject = manager.getProject('competitive-intelligence');
      console.log('   📋 Competitive Intelligence project already exists');
    } catch (error) {
      compProject = manager.createProject(competitiveProject);
      console.log('   ✅ Created Competitive Intelligence project');
    }

    console.log('\n📋 Project Summary:');
    const projects = manager.listProjects();
    projects.forEach(project => {
      console.log(`   ${getProjectIcon(project.type)} ${project.name} (${project.id})`);
      console.log(`      Type: ${project.type} | Status: ${project.status}`);
    });

    console.log('\n🔧 Creating package.json for multi-db tools...');
    
    // Create package.json for the multi-db tools
    const packageJson = {
      name: "ecosystem-multi-db",
      version: "1.0.0",
      description: "Multi-database research architecture tools",
      main: "project-manager.js",
      scripts: {
        "setup": "node setup.js",
        "create-project": "node project-manager.js create",
        "list-projects": "node project-manager.js list",
        "run-pipeline": "node universal-pipeline.js",
        "project-status": "node universal-pipeline.js",
        "test": "echo \"Testing multi-db architecture...\" && npm run list-projects"
      },
      keywords: ["research", "database", "pipelines", "AI", "ecosystem"],
      author: "",
      license: "ISC",
      dependencies: {
        "openai": "^4.0.0",
        "axios": "^1.6.0",
        "cheerio": "^1.0.0"
      }
    };

    const packagePath = path.join(__dirname, 'package.json');
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log(`   ✅ Created: ${packagePath}`);

    console.log('\n📚 Creating documentation...');
    
    // Create comprehensive README
    const readme = `# 🏗️ Multi-Database Research Architecture

This system allows you to manage multiple research projects/databases with shared tooling and pipelines.

## Quick Start

\`\`\`bash
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
\`\`\`

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

\`\`\`
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
\`\`\`

## Environment Variables

For each project, you can set project-specific environment variables:

\`\`\`bash
# Default Notion token
NOTION_TOKEN=your_token_here

# Project-specific tokens (optional)
NOTION_TOKEN_BC_AI_ECOSYSTEM=bc_ai_token
NOTION_TOKEN_FUNDING_INTELLIGENCE=funding_token
NOTION_TOKEN_COMPETITIVE_INTELLIGENCE=competitive_token
\`\`\`

## UI Integration

The research dashboard at \`http://localhost:3004/research\` now supports:

1. **Project Selector**: Switch between different databases
2. **Project-Specific Data**: Each project shows only its data
3. **Shared Tooling**: All pipelines work across projects
4. **Multi-Tenant Architecture**: Clean separation of concerns

## Adding New Projects

\`\`\`javascript
const manager = new ProjectManager();

const newProject = manager.createProject({
  id: 'climate-tech',
  name: 'Climate Tech Database', 
  type: 'ecosystem',
  description: 'Climate and clean tech companies',
  notionDatabaseId: 'your-notion-db-id'
});
\`\`\`

## Running Pipelines

\`\`\`bash
# Run specific pipeline
node universal-pipeline.js climate-tech discovery
node universal-pipeline.js funding-db funding
node universal-pipeline.js competitors competitive

# Run all enabled pipelines
node universal-pipeline.js climate-tech all

# Check project status
node universal-pipeline.js climate-tech status
\`\`\`

This architecture allows you to:
- ✅ Reuse all your awesome research tools
- ✅ Keep databases separate and organized
- ✅ Scale to unlimited projects
- ✅ Maintain clean separation of concerns
- ✅ Use the same UI for all projects
`;

    const readmePath = path.join(__dirname, 'README.md');
    fs.writeFileSync(readmePath, readme);
    console.log(`   ✅ Created: ${readmePath}`);

    console.log('\n🎯 Setup Complete!\n');
    
    console.log('📋 What You Can Do Now:');
    console.log('   1. 🌐 Start the UI: cd ../../ui && npm run dev');
    console.log('   2. 🔍 Visit: http://localhost:3004/research');
    console.log('   3. 🔄 Test pipelines: node universal-pipeline.js bc-ai-ecosystem status');
    console.log('   4. ➕ Create new project: node project-manager.js create');
    console.log('   5. 📊 Run discovery: node universal-pipeline.js bc-ai-ecosystem discovery');
    
    console.log('\n🚀 Multi-Database Research Architecture is ready!');
    console.log('   Projects can be managed independently');
    console.log('   All your research tools work across all projects');
    console.log('   UI supports project switching and multi-tenancy\n');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

function getProjectIcon(type) {
  switch (type) {
    case 'funding': return '💰';
    case 'competitive': return '🏆';
    case 'ecosystem': return '🌱';
    default: return '📊';
  }
}

// Run setup if called directly
if (require.main === module) {
  setup();
}