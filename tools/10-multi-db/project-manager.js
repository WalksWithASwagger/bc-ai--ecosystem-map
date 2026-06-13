#!/usr/bin/env node
/**
 * 🏗️ Multi-Database Project Manager
 * 
 * Manages multiple research databases/projects with shared tooling
 * Each project gets its own data, config, and Notion integration
 */

const fs = require('fs');
const path = require('path');

class ProjectManager {
  constructor() {
    this.projectsDir = path.join(__dirname, '../../data/projects');
    this.configsDir = path.join(__dirname, 'configs');
    
    // Ensure directories exist
    if (!fs.existsSync(this.projectsDir)) {
      fs.mkdirSync(this.projectsDir, { recursive: true });
    }
    if (!fs.existsSync(this.configsDir)) {
      fs.mkdirSync(this.configsDir, { recursive: true });
    }
  }

  /**
   * Create a new research project
   */
  createProject(projectConfig) {
    const { id, name, type, description, notionDatabaseId, schema } = projectConfig;
    
    // Create project directory structure
    const projectDir = path.join(this.projectsDir, id);
    const directories = [
      'data/raw',
      'data/processed',
      'data/enriched',
      'data/temporal-kg',
      'logs',
      'reports',
      'discoveries'
    ];

    directories.forEach(dir => {
      fs.mkdirSync(path.join(projectDir, dir), { recursive: true });
    });

    // Create project config
    const config = {
      id,
      name,
      type,
      description,
      createdAt: new Date().toISOString(),
      status: 'active',
      
      // Data sources
      dataSources: {
        notion: {
          databaseId: notionDatabaseId,
          tokenEnvVar: `NOTION_TOKEN_${id.toUpperCase()}`
        }
      },

      // Research pipeline configuration
      pipelines: {
        discovery: { enabled: true, frequency: 'daily' },
        enrichment: { enabled: true, frequency: 'weekly' },
        funding: { enabled: type === 'funding', frequency: 'daily' },
        competitive: { enabled: true, frequency: 'weekly' },
        temporal: { enabled: true }
      },

      // Data schema
      schema: schema || this.getDefaultSchema(type),

      // File paths
      paths: {
        root: projectDir,
        data: path.join(projectDir, 'data'),
        logs: path.join(projectDir, 'logs'),
        reports: path.join(projectDir, 'reports'),
        discoveries: path.join(projectDir, 'discoveries'),
        temporalKg: path.join(projectDir, 'data/temporal-kg')
      }
    };

    // Save config
    const configPath = path.join(this.configsDir, `${id}.json`);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Create initial data files
    this.initializeProjectData(config);

    console.log(`✅ Created project: ${name} (${id})`);
    console.log(`📁 Project directory: ${projectDir}`);
    console.log(`⚙️ Config file: ${configPath}`);

    return config;
  }

  /**
   * Get default schema based on project type
   */
  getDefaultSchema(type) {
    const schemas = {
      ecosystem: {
        entities: ['company', 'investor', 'person', 'product'],
        relationships: ['funded_by', 'employs', 'partnered_with', 'developed'],
        properties: {
          company: ['name', 'sector', 'location', 'founded', 'size', 'website'],
          investor: ['name', 'type', 'focus', 'location', 'aum'],
          person: ['name', 'role', 'company', 'linkedin'],
          product: ['name', 'company', 'category', 'launch_date']
        }
      },

      funding: {
        entities: ['funder', 'fund', 'investment', 'portfolio_company'],
        relationships: ['invested_in', 'managed_by', 'focuses_on'],
        properties: {
          funder: ['name', 'type', 'location', 'focus_areas', 'contact'],
          fund: ['name', 'size', 'vintage', 'status', 'strategy'],
          investment: ['amount', 'date', 'stage', 'valuation'],
          portfolio_company: ['name', 'sector', 'status', 'exit_date']
        }
      },

      competitive: {
        entities: ['competitor', 'product', 'announcement', 'partnership'],
        relationships: ['competes_with', 'launched', 'partnered_with'],
        properties: {
          competitor: ['name', 'size', 'market_cap', 'revenue', 'location'],
          product: ['name', 'category', 'pricing', 'features'],
          announcement: ['type', 'date', 'impact', 'source'],
          partnership: ['type', 'date', 'value', 'duration']
        }
      }
    };

    return schemas[type] || schemas.ecosystem;
  }

  /**
   * Initialize project with sample data structure
   */
  initializeProjectData(config) {
    // Create sample data files
    const sampleData = {
      entities: [],
      relationships: [],
      metadata: {
        projectId: config.id,
        lastUpdated: new Date().toISOString(),
        recordCount: 0
      }
    };

    // Save to data directory
    fs.writeFileSync(
      path.join(config.paths.data, 'entities.json'),
      JSON.stringify(sampleData, null, 2)
    );

    // Create initial temporal KG structure
    const temporalData = {
      triplets: [],
      statistics: {
        totalTriplets: 0,
        entityCount: 0,
        relationshipTypes: 0,
        timeSpan: { earliest: null, latest: null }
      }
    };

    fs.writeFileSync(
      path.join(config.paths.temporalKg, 'triplets.json'),
      JSON.stringify(temporalData, null, 2)
    );

    // Create README for the project
    const readme = `# ${config.name}

**Project Type:** ${config.type}
**Created:** ${config.createdAt}

## Description
${config.description}

## Data Sources
- Notion Database ID: ${config.dataSources.notion.databaseId}

## Research Pipelines
${Object.entries(config.pipelines).map(([name, settings]) => 
  `- **${name}**: ${settings.enabled ? '✅ Enabled' : '❌ Disabled'} (${settings.frequency || 'manual'})`
).join('\n')}

## Directory Structure
\`\`\`
${config.id}/
├── data/
│   ├── raw/           # Raw scraped data
│   ├── processed/     # Cleaned and normalized
│   ├── enriched/      # AI-enhanced data
│   └── temporal-kg/   # Knowledge graph triplets
├── logs/              # Pipeline execution logs
├── reports/           # Analysis reports
└── discoveries/       # New findings
\`\`\`

## Quick Start
\`\`\`bash
cd tools/10-multi-db
node pipeline-runner.js --project ${config.id} --pipeline discovery
\`\`\`
`;

    fs.writeFileSync(path.join(config.paths.root, 'README.md'), readme);
  }

  /**
   * List all projects
   */
  listProjects() {
    const configFiles = fs.readdirSync(this.configsDir).filter(f => f.endsWith('.json'));
    return configFiles.map(file => {
      const config = JSON.parse(fs.readFileSync(path.join(this.configsDir, file), 'utf8'));
      return {
        id: config.id,
        name: config.name,
        type: config.type,
        status: config.status,
        createdAt: config.createdAt
      };
    });
  }

  /**
   * Get project configuration
   */
  getProject(projectId) {
    const configPath = path.join(this.configsDir, `${projectId}.json`);
    if (!fs.existsSync(configPath)) {
      throw new Error(`Project not found: ${projectId}`);
    }
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  /**
   * Update project configuration
   */
  updateProject(projectId, updates) {
    const config = this.getProject(projectId);
    const updatedConfig = { ...config, ...updates, updatedAt: new Date().toISOString() };
    
    const configPath = path.join(this.configsDir, `${projectId}.json`);
    fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));
    
    return updatedConfig;
  }

  /**
   * Get project data path
   */
  getProjectDataPath(projectId, dataType = 'root') {
    const config = this.getProject(projectId);
    return config.paths[dataType] || config.paths.root;
  }
}

module.exports = ProjectManager;

// CLI usage
if (require.main === module) {
  const manager = new ProjectManager();
  const command = process.argv[2];

  switch (command) {
    case 'create':
      const projectConfig = {
        id: process.argv[3],
        name: process.argv[4],
        type: process.argv[5] || 'ecosystem',
        description: process.argv[6] || 'Research project',
        notionDatabaseId: process.argv[7] || ''
      };
      manager.createProject(projectConfig);
      break;

    case 'list':
      const projects = manager.listProjects();
      console.log('\n📋 Research Projects:');
      projects.forEach(p => {
        console.log(`   ${p.id} - ${p.name} (${p.type}) [${p.status}]`);
      });
      break;

    case 'info':
      const project = manager.getProject(process.argv[3]);
      console.log(JSON.stringify(project, null, 2));
      break;

    default:
      console.log(`
🏗️ Multi-Database Project Manager

Usage:
  node project-manager.js create <id> <name> [type] [description] [notion-db-id]
  node project-manager.js list
  node project-manager.js info <project-id>

Examples:
  node project-manager.js create funding-db "Funding Database" funding "Track VCs and funding rounds"
  node project-manager.js create competitors "Competitor Analysis" competitive "Monitor competition"
  node project-manager.js list
      `);
  }
}