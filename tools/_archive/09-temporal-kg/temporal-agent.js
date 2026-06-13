#!/usr/bin/env node
/**
 * 🤖 Temporal Agent for BC AI Ecosystem
 * 
 * Processes raw data from research pipelines into time-stamped triplets
 * for the temporal knowledge graph.
 * 
 * Based on OpenAI Cookbook: Temporal Agents with Knowledge Graphs
 * Optimized for o4-mini with potential RFT enhancement
 */

const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const { TemporalTriplet, EntityTypes, RelationshipTypes, EventTypes } = require('./temporal-schema');

class TemporalAgent {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.config = {
      model: 'o1-mini', // Start with o1-mini, upgrade to o1 for complex extractions
      maxTokens: 4000,
      temperature: 0.1, // Low temperature for consistent extractions
      retries: 3
    };
    
    this.triplets = [];
    this.processedDocuments = new Set();
  }

  // ========================================================================
  // SEMANTIC CHUNKER
  // ========================================================================
  
  async semanticChunker(document, metadata = {}) {
    console.log(`📄 Processing document: ${metadata.source || 'unknown'}`);
    
    // Chunk by semantic boundaries (companies, events, relationships)
    const chunks = [];
    
    // If it's a BetaKit funding article
    if (metadata.source === 'betakit' && document.includes('raised')) {
      const fundingChunks = this.extractFundingChunks(document);
      chunks.push(...fundingChunks);
    }
    
    // If it's company profile data
    if (metadata.type === 'company_profile') {
      const profileChunks = this.extractProfileChunks(document);
      chunks.push(...profileChunks);
    }
    
    // If it's research pipeline discovery
    if (metadata.source === 'research_pipeline') {
      const discoveryChunks = this.extractDiscoveryChunks(document);
      chunks.push(...discoveryChunks);
    }
    
    console.log(`✂️ Created ${chunks.length} semantic chunks`);
    return chunks;
  }
  
  extractFundingChunks(document) {
    // Extract funding-related sentences and context
    const fundingKeywords = ['raised', 'funding', 'investment', 'series', 'round', 'million', 'valuation'];
    const sentences = document.split(/[.!?]+/);
    
    return sentences
      .filter(sentence => 
        fundingKeywords.some(keyword => 
          sentence.toLowerCase().includes(keyword)
        )
      )
      .map((sentence, index) => ({
        id: `funding_chunk_${index}`,
        content: sentence.trim(),
        type: 'funding_event',
        context: this.extractSurroundingContext(sentences, sentence)
      }));
  }
  
  extractProfileChunks(document) {
    // Break company profiles into logical sections
    const sections = [
      'founding', 'leadership', 'products', 'funding', 
      'partnerships', 'locations', 'technology'
    ];
    
    return sections.map(section => ({
      id: `profile_${section}`,
      content: this.extractSection(document, section),
      type: 'company_profile',
      section: section
    })).filter(chunk => chunk.content.length > 0);
  }
  
  extractDiscoveryChunks(document) {
    // Process research pipeline discoveries
    try {
      const data = JSON.parse(document);
      return data.discoveries?.map((discovery, index) => ({
        id: `discovery_${index}`,
        content: JSON.stringify(discovery),
        type: 'discovery',
        tier: discovery.tier,
        score: discovery.score
      })) || [];
    } catch (error) {
      console.warn('Failed to parse discovery document:', error.message);
      return [];
    }
  }

  // ========================================================================
  // STATEMENT EXTRACTION
  // ========================================================================
  
  async extractStatements(chunk) {
    const prompt = `You are a temporal statement extractor for the BC AI ecosystem. 
Extract factual statements that can be represented as temporal triplets.

CONTEXT: ${chunk.content}

Extract statements about:
- Company formations, acquisitions, closures
- Funding rounds and investments  
- Product launches and developments
- Executive hiring and departures
- Partnerships and collaborations
- Office openings and relocations
- Market expansions and pivots

For each statement, identify:
1. Subject (company, person, product, etc.)
2. Predicate (relationship/action)
3. Object (target entity or value)
4. When it happened (date/timeframe)
5. Confidence level (0.0-1.0)

Return JSON array of statements:
[
  {
    "subject": "alayacare",
    "predicate": "raised_funding",
    "object": "81_million_series_c", 
    "temporal_info": "March 2024",
    "confidence": 0.95,
    "evidence": "quote or fact supporting this"
  }
]`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature
      });
      
      const content = response.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      console.error('Statement extraction failed:', error.message);
      return [];
    }
  }

  // ========================================================================
  // TEMPORAL RANGE EXTRACTION  
  // ========================================================================
  
  async extractTemporalRanges(statements) {
    const enhancedStatements = [];
    
    for (const statement of statements) {
      const temporalRange = await this.parseTemporalExpression(statement.temporal_info);
      
      enhancedStatements.push({
        ...statement,
        validFrom: temporalRange.from,
        validTo: temporalRange.to,
        precision: temporalRange.precision
      });
    }
    
    return enhancedStatements;
  }
  
  async parseTemporalExpression(temporalText) {
    const prompt = `Parse this temporal expression into ISO 8601 format:
"${temporalText}"

Consider:
- Specific dates: "March 15, 2024" → exact date
- Months: "March 2024" → start of month to end of month  
- Years: "2024" → January 1 to December 31
- Quarters: "Q1 2024" → January 1 to March 31
- Relative: "last week" → calculate based on current date

Return JSON:
{
  "from": "2024-03-01T00:00:00Z",
  "to": "2024-03-31T23:59:59Z", 
  "precision": "month"
}

If ongoing/current, set "to": null`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4', // Use GPT-4 for temporal parsing precision
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0
      });
      
      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Temporal parsing failed:', error.message);
      // Fallback to current timestamp
      return {
        from: new Date().toISOString(),
        to: null,
        precision: 'unknown'
      };
    }
  }

  // ========================================================================
  // TRIPLET CREATION
  // ========================================================================
  
  async createTriplets(statements, metadata = {}) {
    const triplets = [];
    
    for (const statement of statements) {
      try {
        // Normalize entity names
        const subject = this.normalizeEntity(statement.subject);
        const object = this.normalizeEntity(statement.object);
        
        // Map to standard relationship types
        const predicate = this.mapToPredicate(statement.predicate);
        
        const triplet = new TemporalTriplet({
          subject: subject,
          predicate: predicate,
          object: object,
          validFrom: statement.validFrom,
          validTo: statement.validTo,
          confidence: statement.confidence,
          source: metadata.source || 'temporal_agent',
          metadata: {
            evidence: statement.evidence,
            precision: statement.precision,
            extraction_method: 'llm_extraction',
            original_statement: statement
          }
        });
        
        triplets.push(triplet);
        console.log(`✅ Created triplet: ${subject} -${predicate}-> ${object}`);
        
      } catch (error) {
        console.error('Triplet creation failed:', error.message);
        continue;
      }
    }
    
    return triplets;
  }
  
  normalizeEntity(entityName) {
    // Convert to consistent entity IDs
    return entityName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }
  
  mapToPredicate(predicateText) {
    const mappings = {
      'raised_funding': RelationshipTypes.FUNDED_BY,
      'founded': RelationshipTypes.FOUNDED_BY,
      'hired': RelationshipTypes.EMPLOYS,
      'launched': RelationshipTypes.DEVELOPED,
      'partnered': RelationshipTypes.PARTNERED_WITH,
      'acquired': RelationshipTypes.ACQUIRED_BY,
      'located_in': RelationshipTypes.HEADQUARTERED_IN
    };
    
    return mappings[predicateText] || predicateText;
  }

  // ========================================================================
  // ENTITY RESOLUTION
  // ========================================================================
  
  async resolveEntities(triplets) {
    console.log('🔍 Resolving entity duplicates...');
    
    // Group triplets by subject/object for deduplication
    const entityMap = new Map();
    
    for (const triplet of triplets) {
      // Check for existing entities that might be the same
      const resolvedSubject = await this.findCanonicalEntity(triplet.subject);
      const resolvedObject = await this.findCanonicalEntity(triplet.object);
      
      triplet.subject = resolvedSubject;
      triplet.object = resolvedObject;
      
      // Update entity map
      entityMap.set(resolvedSubject, this.getEntityInfo(resolvedSubject));
      entityMap.set(resolvedObject, this.getEntityInfo(resolvedObject));
    }
    
    console.log(`✅ Resolved ${entityMap.size} unique entities`);
    return triplets;
  }
  
  async findCanonicalEntity(entityId) {
    // Check against existing BC AI database
    // This would integrate with your Notion database
    
    // For now, return the same entity ID
    // In production, this would do fuzzy matching against known companies
    return entityId;
  }
  
  getEntityInfo(entityId) {
    // Return metadata about the entity
    return {
      id: entityId,
      type: this.inferEntityType(entityId),
      aliases: [entityId],
      lastSeen: new Date().toISOString()
    };
  }
  
  inferEntityType(entityId) {
    // Basic entity type inference
    if (entityId.includes('series_') || entityId.includes('funding')) {
      return EntityTypes.FUNDING_ROUND;
    }
    if (entityId.includes('_person') || entityId.includes('ceo') || entityId.includes('founder')) {
      return EntityTypes.PERSON;
    }
    return EntityTypes.COMPANY; // Default assumption for BC AI ecosystem
  }

  // ========================================================================
  // MAIN PROCESSING PIPELINE
  // ========================================================================
  
  async processDocument(document, metadata = {}) {
    console.log(`🤖 Temporal Agent processing: ${metadata.source}`);
    
    try {
      // 1. Semantic Chunking
      const chunks = await this.semanticChunker(document, metadata);
      
      // 2. Statement Extraction
      const allStatements = [];
      for (const chunk of chunks) {
        const statements = await this.extractStatements(chunk);
        allStatements.push(...statements);
      }
      
      // 3. Temporal Range Extraction
      const temporalStatements = await this.extractTemporalRanges(allStatements);
      
      // 4. Triplet Creation
      const newTriplets = await this.createTriplets(temporalStatements, metadata);
      
      // 5. Entity Resolution  
      const resolvedTriplets = await this.resolveEntities(newTriplets);
      
      // 6. Add to knowledge graph
      this.triplets.push(...resolvedTriplets);
      
      console.log(`✅ Generated ${resolvedTriplets.length} temporal triplets`);
      return resolvedTriplets;
      
    } catch (error) {
      console.error('Document processing failed:', error.message);
      return [];
    }
  }
  
  // ========================================================================
  // BATCH PROCESSING FOR EXISTING DATA
  // ========================================================================
  
  async processExistingDatabase() {
    console.log('📊 Processing existing BC AI database...');
    
    // Process existing company data from Notion
    // This would connect to your existing API routes
    const companies = await this.loadExistingCompanies();
    
    for (const company of companies) {
      const document = this.formatCompanyAsDocument(company);
      await this.processDocument(document, {
        source: 'notion_database',
        type: 'company_profile',
        companyId: company.id
      });
    }
    
    console.log(`✅ Processed ${companies.length} existing companies`);
  }
  
  async loadExistingCompanies() {
    // Load from your existing API
    try {
      const response = await fetch('http://localhost:3004/api/organizations');
      const data = await response.json();
      return data.organizations || [];
    } catch (error) {
      console.error('Failed to load existing companies:', error.message);
      return [];
    }
  }
  
  formatCompanyAsDocument(company) {
    return `Company: ${company.name}
Founded: ${company.yearFounded || 'Unknown'}
Location: ${company.city}, ${company.bcRegion}
Category: ${company.category}
AI Focus: ${company.aiFocusAreas?.join(', ') || 'General AI'}
Size: ${company.size}
Description: ${company.shortBlurb}
Key People: ${company.keyPeople}
Website: ${company.website}
LinkedIn: ${company.linkedin}`;
  }
  
  // ========================================================================
  // OUTPUT AND PERSISTENCE
  // ========================================================================
  
  async saveTripletsToFile(filename = 'bc_ai_temporal_triplets.jsonl') {
    const outputPath = path.join(__dirname, '../../data/temporal-kg', filename);
    
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Save as JSONL for efficient loading
    const jsonlContent = this.triplets
      .map(triplet => JSON.stringify(triplet.toJSON()))
      .join('\n');
    
    fs.writeFileSync(outputPath, jsonlContent);
    console.log(`💾 Saved ${this.triplets.length} triplets to ${outputPath}`);
  }
  
  getStatistics() {
    const stats = {
      totalTriplets: this.triplets.length,
      entityTypes: {},
      relationshipTypes: {},
      sources: {},
      confidenceDistribution: { high: 0, medium: 0, low: 0 }
    };
    
    for (const triplet of this.triplets) {
      // Count relationship types
      stats.relationshipTypes[triplet.predicate] = 
        (stats.relationshipTypes[triplet.predicate] || 0) + 1;
      
      // Count sources
      stats.sources[triplet.source] = 
        (stats.sources[triplet.source] || 0) + 1;
      
      // Count confidence levels
      if (triplet.confidence >= 0.8) stats.confidenceDistribution.high++;
      else if (triplet.confidence >= 0.6) stats.confidenceDistribution.medium++;
      else stats.confidenceDistribution.low++;
    }
    
    return stats;
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
  const agent = new TemporalAgent();
  
  console.log('🤖 BC AI Temporal Agent Starting...');
  console.log('=====================================');
  
  // Process existing database
  await agent.processExistingDatabase();
  
  // Process recent research pipeline data
  const recentData = await loadRecentPipelineData();
  for (const document of recentData) {
    await agent.processDocument(document.content, document.metadata);
  }
  
  // Save results
  await agent.saveTripletsToFile();
  
  // Show statistics
  const stats = agent.getStatistics();
  console.log('\n📊 Processing Statistics:');
  console.log(JSON.stringify(stats, null, 2));
}

async function loadRecentPipelineData() {
  // Load from your research pipeline outputs
  const dataDir = path.join(__dirname, '../../logs');
  const files = fs.readdirSync(dataDir)
    .filter(file => file.endsWith('.json') && file.includes('2025'))
    .slice(-10); // Last 10 files
  
  return files.map(file => ({
    content: fs.readFileSync(path.join(dataDir, file), 'utf8'),
    metadata: {
      source: 'research_pipeline',
      filename: file,
      timestamp: fs.statSync(path.join(dataDir, file)).mtime
    }
  }));
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { TemporalAgent };