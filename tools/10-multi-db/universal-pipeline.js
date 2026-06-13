#!/usr/bin/env node
/**
 * 🔄 Universal Research Pipeline
 * 
 * Runs any research pipeline on any configured project/database
 * Reuses all the awesome tools we built but makes them project-agnostic
 */

const fs = require('fs');
const path = require('path');
const ProjectManager = require('./project-manager');

class UniversalPipeline {
  constructor(projectId) {
    this.projectManager = new ProjectManager();
    this.projectId = projectId;
    this.config = this.projectManager.getProject(projectId);
    
    // Set up project-specific environment
    this.setupEnvironment();
  }

  setupEnvironment() {
    // Set environment variables for this project
    process.env.CURRENT_PROJECT_ID = this.projectId;
    process.env.CURRENT_PROJECT_DATA_PATH = this.config.paths.data;
    process.env.CURRENT_PROJECT_LOGS_PATH = this.config.paths.logs;
    
    // Set Notion token for this project
    if (this.config.dataSources.notion.tokenEnvVar) {
      process.env.NOTION_TOKEN = process.env[this.config.dataSources.notion.tokenEnvVar] || process.env.NOTION_TOKEN;
    }
  }

  /**
   * Run discovery pipeline for this project
   */
  async runDiscovery(options = {}) {
    console.log(`🔍 Running discovery pipeline for ${this.config.name}...`);
    
    // Import the existing discovery tools but adapt them for this project
    const DiscoveryEngine = require('../08-pipelines/discovery-engine');
    
    const engine = new DiscoveryEngine({
      projectId: this.projectId,
      outputPath: this.config.paths.discoveries,
      dataPath: this.config.paths.data,
      schema: this.config.schema,
      ...options
    });

    return await engine.discover();
  }

  /**
   * Run funding intelligence for this project
   */
  async runFundingIntelligence(options = {}) {
    if (!this.config.pipelines.funding.enabled) {
      console.log(`⚠️ Funding pipeline not enabled for ${this.config.name}`);
      return;
    }

    console.log(`💰 Running funding intelligence for ${this.config.name}...`);
    
    const FundingIntelligence = require('../08-pipelines/scrapers/advanced-funding-intelligence');
    
    const intelligence = new FundingIntelligence({
      projectId: this.projectId,
      outputPath: path.join(this.config.paths.data, 'funding'),
      schema: this.config.schema,
      ...options
    });

    return await intelligence.discover();
  }

  /**
   * Run competitive intelligence
   */
  async runCompetitiveIntelligence(options = {}) {
    console.log(`🏆 Running competitive intelligence for ${this.config.name}...`);
    
    const CompetitiveIntelligence = require('../08-pipelines/scrapers/competitive-intelligence');
    
    const intelligence = new CompetitiveIntelligence({
      projectId: this.projectId,
      outputPath: path.join(this.config.paths.data, 'competitive'),
      schema: this.config.schema,
      ...options
    });

    return await intelligence.analyze();
  }

  /**
   * Run data enrichment
   */
  async runEnrichment(options = {}) {
    console.log(`✨ Running enrichment for ${this.config.name}...`);
    
    const QualityEngine = require('../08-pipelines/quality-scoring-engine');
    
    const engine = new QualityEngine({
      projectId: this.projectId,
      dataPath: this.config.paths.data,
      schema: this.config.schema,
      ...options
    });

    return await engine.enhanceData();
  }

  /**
   * Update temporal knowledge graph
   */
  async updateTemporalKG(options = {}) {
    console.log(`🧠 Updating temporal knowledge graph for ${this.config.name}...`);
    
    const TemporalAgent = require('../09-temporal-kg/temporal-agent');
    
    const agent = new TemporalAgent({
      projectId: this.projectId,
      dataPath: this.config.paths.data,
      outputPath: this.config.paths.temporalKg,
      schema: this.config.schema,
      ...options
    });

    return await agent.processData();
  }

  /**
   * Run full pipeline orchestration
   */
  async runAll(options = {}) {
    console.log(`🚀 Running full pipeline for ${this.config.name}...`);
    
    const results = {
      projectId: this.projectId,
      projectName: this.config.name,
      startTime: new Date().toISOString(),
      results: {}
    };

    try {
      // Run enabled pipelines in sequence
      if (this.config.pipelines.discovery.enabled) {
        results.results.discovery = await this.runDiscovery(options);
      }

      if (this.config.pipelines.funding.enabled) {
        results.results.funding = await this.runFundingIntelligence(options);
      }

      if (this.config.pipelines.competitive.enabled) {
        results.results.competitive = await this.runCompetitiveIntelligence(options);
      }

      if (this.config.pipelines.enrichment.enabled) {
        results.results.enrichment = await this.runEnrichment(options);
      }

      if (this.config.pipelines.temporal.enabled) {
        results.results.temporal = await this.updateTemporalKG(options);
      }

      results.endTime = new Date().toISOString();
      results.status = 'success';
      results.duration = new Date(results.endTime) - new Date(results.startTime);

    } catch (error) {
      results.endTime = new Date().toISOString();
      results.status = 'error';
      results.error = error.message;
      console.error(`❌ Pipeline failed for ${this.config.name}:`, error);
    }

    // Save results
    const logPath = path.join(this.config.paths.logs, `pipeline-${Date.now()}.json`);
    fs.writeFileSync(logPath, JSON.stringify(results, null, 2));

    console.log(`📊 Pipeline completed for ${this.config.name}`);
    console.log(`📝 Results saved to: ${logPath}`);

    return results;
  }

  /**
   * Get project status and metrics
   */
  getStatus() {
    const status = {
      project: {
        id: this.projectId,
        name: this.config.name,
        type: this.config.type,
        status: this.config.status
      },
      data: {},
      lastUpdated: {}
    };

    // Check data files
    try {
      const entitiesPath = path.join(this.config.paths.data, 'entities.json');
      if (fs.existsSync(entitiesPath)) {
        const data = JSON.parse(fs.readFileSync(entitiesPath, 'utf8'));
        status.data.entities = data.entities?.length || 0;
        status.lastUpdated.entities = data.metadata?.lastUpdated;
      }

      const temporalPath = path.join(this.config.paths.temporalKg, 'triplets.json');
      if (fs.existsSync(temporalPath)) {
        const data = JSON.parse(fs.readFileSync(temporalPath, 'utf8'));
        status.data.triplets = data.triplets?.length || 0;
        status.lastUpdated.temporal = data.statistics?.lastUpdated;
      }

      // Count discoveries
      const discoveryFiles = fs.readdirSync(this.config.paths.discoveries)
        .filter(f => f.endsWith('.json') || f.endsWith('.md'));
      status.data.discoveries = discoveryFiles.length;

    } catch (error) {
      console.warn('Could not read project data for status:', error.message);
    }

    return status;
  }
}

// Export for use as module
module.exports = UniversalPipeline;

// CLI usage
if (require.main === module) {
  const projectId = process.argv[2];
  const command = process.argv[3];
  const options = {};

  if (!projectId) {
    console.log(`
🔄 Universal Research Pipeline

Usage:
  node universal-pipeline.js <project-id> <command> [options]

Commands:
  discovery          Run discovery pipeline
  funding           Run funding intelligence
  competitive       Run competitive analysis
  enrichment        Run data enrichment
  temporal          Update temporal knowledge graph
  all               Run all enabled pipelines
  status            Get project status

Examples:
  node universal-pipeline.js bc-ai-ecosystem discovery
  node universal-pipeline.js funding-db funding
  node universal-pipeline.js competitors all
  node universal-pipeline.js bc-ai-ecosystem status
    `);
    process.exit(1);
  }

  (async () => {
    try {
      const pipeline = new UniversalPipeline(projectId);

      switch (command) {
        case 'discovery':
          await pipeline.runDiscovery(options);
          break;
        case 'funding':
          await pipeline.runFundingIntelligence(options);
          break;
        case 'competitive':
          await pipeline.runCompetitiveIntelligence(options);
          break;
        case 'enrichment':
          await pipeline.runEnrichment(options);
          break;
        case 'temporal':
          await pipeline.updateTemporalKG(options);
          break;
        case 'all':
          await pipeline.runAll(options);
          break;
        case 'status':
          const status = pipeline.getStatus();
          console.log(JSON.stringify(status, null, 2));
          break;
        default:
          console.error(`Unknown command: ${command}`);
          process.exit(1);
      }
    } catch (error) {
      console.error('Pipeline error:', error);
      process.exit(1);
    }
  })();
}