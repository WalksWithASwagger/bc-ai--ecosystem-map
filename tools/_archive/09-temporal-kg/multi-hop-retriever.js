#!/usr/bin/env node
/**
 * 🔍 Multi-Hop Retrieval System for BC AI Temporal Knowledge Graph
 * 
 * Enables complex queries that traverse relationships across time
 * to answer sophisticated questions about the BC AI ecosystem.
 * 
 * Based on OpenAI Cookbook: Multi-Step Retrieval Over Knowledge Graphs
 */

const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const { EntityTypes, RelationshipTypes } = require('./temporal-schema');

class MultiHopRetriever {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.config = {
      plannerModel: 'o1-mini', // For query planning and reasoning
      toolModel: 'gpt-4', // For tool execution
      maxHops: 5,
      maxResults: 50,
      timeoutMs: 30000
    };
    
    this.knowledgeGraph = new Map(); // In-memory graph storage
    this.queryCache = new Map();
    this.loadKnowledgeGraph();
  }

  // ========================================================================
  // KNOWLEDGE GRAPH LOADING
  // ========================================================================
  
  loadKnowledgeGraph() {
    console.log('📚 Loading temporal knowledge graph...');
    
    try {
      const tripletsPath = path.join(__dirname, '../../data/temporal-kg/bc_ai_temporal_triplets.jsonl');
      
      if (fs.existsSync(tripletsPath)) {
        const content = fs.readFileSync(tripletsPath, 'utf8');
        const lines = content.trim().split('\n');
        
        for (const line of lines) {
          const triplet = JSON.parse(line);
          this.addTripletToGraph(triplet);
        }
        
        console.log(`✅ Loaded ${lines.length} triplets into knowledge graph`);
      } else {
        console.warn('⚠️ No temporal triplets file found. Run temporal-agent.js first.');
      }
    } catch (error) {
      console.error('Failed to load knowledge graph:', error.message);
    }
  }
  
  addTripletToGraph(triplet) {
    // Add to subject -> predicate -> objects mapping
    if (!this.knowledgeGraph.has(triplet.subject)) {
      this.knowledgeGraph.set(triplet.subject, new Map());
    }
    
    const subjectMap = this.knowledgeGraph.get(triplet.subject);
    if (!subjectMap.has(triplet.predicate)) {
      subjectMap.set(triplet.predicate, []);
    }
    
    subjectMap.get(triplet.predicate).push(triplet);
  }

  // ========================================================================
  // QUERY PLANNER
  // ========================================================================
  
  async planQuery(question) {
    console.log(`🎯 Planning query: ${question}`);
    
    const planningPrompt = `You are a query planner for the BC AI ecosystem temporal knowledge graph.

AVAILABLE ENTITIES: companies, people, investors, funding_rounds, products, partnerships, offices
AVAILABLE RELATIONSHIPS: founded_by, funded_by, employs, partnered_with, acquired_by, developed, headquartered_in, etc.
TEMPORAL CAPABILITIES: Can query facts at specific time points or ranges

QUESTION: ${question}

Break this down into a step-by-step plan using available tools:

AVAILABLE TOOLS:
- find_entities(type, filters) - Find entities by type and attributes
- traverse_relationship(entity, relationship, direction, time_filter) - Follow relationships
- temporal_query(entity, timestamp) - Get entity state at specific time
- aggregate_results(entities, metric) - Compute statistics over results
- compare_temporal(entity, time1, time2) - Compare entity across time periods

Return a JSON plan:
{
  "reasoning": "Explanation of approach",
  "steps": [
    {
      "id": 1,
      "action": "find_entities", 
      "params": {"type": "company", "filters": {"category": "FinTech"}},
      "description": "Find all FinTech companies"
    },
    {
      "id": 2,
      "action": "traverse_relationship",
      "params": {"entities": "step_1_results", "relationship": "funded_by", "direction": "outbound"},
      "description": "Find funding rounds for these companies"
    }
  ],
  "expected_answer_type": "list_of_companies" | "funding_amount" | "timeline" | "comparison"
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.plannerModel,
        messages: [{ role: 'user', content: planningPrompt }],
        max_tokens: 2000,
        temperature: 0.1
      });
      
      const plan = JSON.parse(response.choices[0].message.content);
      console.log(`📋 Generated ${plan.steps.length} step plan`);
      return plan;
    } catch (error) {
      console.error('Query planning failed:', error.message);
      return { steps: [], reasoning: 'Planning failed', expected_answer_type: 'error' };
    }
  }

  // ========================================================================
  // TOOL IMPLEMENTATIONS
  // ========================================================================
  
  async findEntities(type, filters = {}, timeFilter = null) {
    console.log(`🔍 Finding entities: ${type} with filters`, filters);
    
    const results = [];
    
    for (const [entityId, relationships] of this.knowledgeGraph) {
      // Check if entity matches type (basic inference)
      if (this.matchesEntityType(entityId, relationships, type)) {
        // Apply filters
        if (await this.matchesFilters(entityId, relationships, filters, timeFilter)) {
          results.push({
            id: entityId,
            type: type,
            properties: await this.getEntityProperties(entityId, timeFilter)
          });
        }
      }
    }
    
    console.log(`✅ Found ${results.length} entities`);
    return results;
  }
  
  async traverseRelationship(entities, relationship, direction = 'outbound', timeFilter = null) {
    console.log(`🌐 Traversing ${relationship} (${direction}) for ${entities.length} entities`);
    
    const results = [];
    
    for (const entity of entities) {
      const entityId = typeof entity === 'string' ? entity : entity.id;
      const relationships = this.knowledgeGraph.get(entityId);
      
      if (!relationships) continue;
      
      if (direction === 'outbound' && relationships.has(relationship)) {
        const triplets = relationships.get(relationship);
        
        for (const triplet of triplets) {
          if (this.isValidAtTime(triplet, timeFilter)) {
            results.push({
              source: entityId,
              target: triplet.object,
              relationship: relationship,
              triplet: triplet
            });
          }
        }
      }
      
      // For inbound relationships, search through all entities
      if (direction === 'inbound') {
        for (const [otherId, otherRelationships] of this.knowledgeGraph) {
          if (otherRelationships.has(relationship)) {
            const triplets = otherRelationships.get(relationship);
            
            for (const triplet of triplets) {
              if (triplet.object === entityId && this.isValidAtTime(triplet, timeFilter)) {
                results.push({
                  source: otherId,
                  target: entityId,
                  relationship: relationship,
                  triplet: triplet
                });
              }
            }
          }
        }
      }
    }
    
    console.log(`✅ Found ${results.length} relationships`);
    return results;
  }
  
  async temporalQuery(entityId, timestamp) {
    console.log(`⏰ Temporal query for ${entityId} at ${timestamp}`);
    
    const entityState = {
      id: entityId,
      timestamp: timestamp,
      properties: {},
      relationships: {}
    };
    
    const relationships = this.knowledgeGraph.get(entityId);
    if (!relationships) return entityState;
    
    const targetTime = new Date(timestamp);
    
    for (const [predicate, triplets] of relationships) {
      const validTriplets = triplets.filter(triplet => {
        const validFrom = new Date(triplet.valid_from);
        const validTo = triplet.valid_to ? new Date(triplet.valid_to) : new Date();
        
        return targetTime >= validFrom && targetTime <= validTo;
      });
      
      if (validTriplets.length > 0) {
        entityState.relationships[predicate] = validTriplets.map(t => ({
          object: t.object,
          confidence: t.confidence,
          source: t.source
        }));
      }
    }
    
    return entityState;
  }
  
  async aggregateResults(entities, metric) {
    console.log(`📊 Aggregating ${metric} for ${entities.length} entities`);
    
    const aggregation = {
      metric: metric,
      count: entities.length,
      entities: entities.map(e => e.id || e),
      results: {}
    };
    
    switch (metric) {
      case 'funding_total':
        aggregation.results = await this.calculateTotalFunding(entities);
        break;
      case 'funding_by_year':
        aggregation.results = await this.calculateFundingByYear(entities);
        break;
      case 'geographic_distribution':
        aggregation.results = await this.calculateGeographicDistribution(entities);
        break;
      case 'investor_overlap':
        aggregation.results = await this.calculateInvestorOverlap(entities);
        break;
      default:
        aggregation.results = { error: `Unknown metric: ${metric}` };
    }
    
    return aggregation;
  }
  
  async compareTemporalStates(entityId, time1, time2) {
    console.log(`🔄 Comparing ${entityId} between ${time1} and ${time2}`);
    
    const state1 = await this.temporalQuery(entityId, time1);
    const state2 = await this.temporalQuery(entityId, time2);
    
    return {
      entity: entityId,
      time1: time1,
      time2: time2,
      state1: state1,
      state2: state2,
      changes: this.detectChanges(state1, state2)
    };
  }

  // ========================================================================
  // QUERY EXECUTION ENGINE
  // ========================================================================
  
  async executeQuery(question) {
    console.log(`🚀 Executing query: ${question}`);
    
    // Check cache first
    const cacheKey = this.hashQuestion(question);
    if (this.queryCache.has(cacheKey)) {
      console.log('💨 Returning cached result');
      return this.queryCache.get(cacheKey);
    }
    
    try {
      // 1. Plan the query
      const plan = await this.planQuery(question);
      
      if (plan.steps.length === 0) {
        return { error: 'Could not generate query plan', question };
      }
      
      // 2. Execute plan steps
      const stepResults = new Map();
      stepResults.set('initial_question', question);
      
      for (const step of plan.steps) {
        console.log(`📋 Executing step ${step.id}: ${step.description}`);
        
        const result = await this.executeStep(step, stepResults);
        stepResults.set(`step_${step.id}_results`, result);
        
        // Log intermediate results for debugging
        console.log(`   → ${Array.isArray(result) ? result.length : 'N/A'} results`);
      }
      
      // 3. Synthesize final answer
      const finalAnswer = await this.synthesizeAnswer(question, plan, stepResults);
      
      // 4. Cache result
      this.queryCache.set(cacheKey, finalAnswer);
      
      return finalAnswer;
      
    } catch (error) {
      console.error('Query execution failed:', error.message);
      return { error: error.message, question };
    }
  }
  
  async executeStep(step, previousResults) {
    const { action, params } = step;
    
    // Resolve parameter references to previous results
    const resolvedParams = this.resolveParams(params, previousResults);
    
    switch (action) {
      case 'find_entities':
        return await this.findEntities(
          resolvedParams.type, 
          resolvedParams.filters,
          resolvedParams.time_filter
        );
        
      case 'traverse_relationship':
        return await this.traverseRelationship(
          resolvedParams.entities,
          resolvedParams.relationship,
          resolvedParams.direction,
          resolvedParams.time_filter
        );
        
      case 'temporal_query':
        return await this.temporalQuery(
          resolvedParams.entity,
          resolvedParams.timestamp
        );
        
      case 'aggregate_results':
        return await this.aggregateResults(
          resolvedParams.entities,
          resolvedParams.metric
        );
        
      case 'compare_temporal':
        return await this.compareTemporalStates(
          resolvedParams.entity,
          resolvedParams.time1,
          resolvedParams.time2
        );
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
  
  resolveParams(params, previousResults) {
    const resolved = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && value.startsWith('step_') && value.endsWith('_results')) {
        resolved[key] = previousResults.get(value);
      } else {
        resolved[key] = value;
      }
    }
    
    return resolved;
  }
  
  async synthesizeAnswer(question, plan, stepResults) {
    console.log('🎭 Synthesizing final answer...');
    
    const synthesisPrompt = `You are answering a question about the BC AI ecosystem using results from a multi-hop knowledge graph query.

ORIGINAL QUESTION: ${question}

QUERY PLAN: ${JSON.stringify(plan, null, 2)}

RESULTS FROM EACH STEP:
${Array.from(stepResults.entries())
  .map(([key, value]) => `${key}: ${JSON.stringify(value, null, 2)}`)
  .join('\n\n')}

Provide a comprehensive answer that:
1. Directly answers the question
2. Cites specific evidence from the results
3. Provides context about the BC AI ecosystem
4. Highlights any temporal patterns or trends
5. Suggests follow-up questions if relevant

Format as JSON:
{
  "answer": "Direct answer to the question",
  "evidence": ["Key evidence point 1", "Key evidence point 2"],
  "insights": ["Deeper insight 1", "Deeper insight 2"],
  "temporal_patterns": "Description of any time-based trends",
  "related_questions": ["Follow-up question 1", "Follow-up question 2"],
  "confidence": 0.85
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.plannerModel,
        messages: [{ role: 'user', content: synthesisPrompt }],
        max_tokens: 2000,
        temperature: 0.2
      });
      
      const synthesis = JSON.parse(response.choices[0].message.content);
      
      return {
        question,
        answer: synthesis.answer,
        evidence: synthesis.evidence,
        insights: synthesis.insights,
        temporal_patterns: synthesis.temporal_patterns,
        related_questions: synthesis.related_questions,
        confidence: synthesis.confidence,
        execution_plan: plan,
        raw_results: Object.fromEntries(stepResults),
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Answer synthesis failed:', error.message);
      return {
        question,
        answer: 'Failed to synthesize answer',
        error: error.message,
        raw_results: Object.fromEntries(stepResults)
      };
    }
  }

  // ========================================================================
  // HELPER METHODS
  // ========================================================================
  
  matchesEntityType(entityId, relationships, targetType) {
    // Simple heuristic-based type inference
    // In production, this would use proper entity type metadata
    
    const typeHints = {
      company: ['founded_by', 'funded_by', 'partnered_with', 'headquartered_in'],
      person: ['employs', 'founded_by', 'board_member'],
      investor: ['invested_in', 'funded_by'],
      funding_round: ['funding', 'series', 'round']
    };
    
    if (targetType === 'company') {
      // Most entities in BC AI database are companies
      return !entityId.includes('_person') && !entityId.includes('_fund');
    }
    
    const hints = typeHints[targetType] || [];
    return hints.some(hint => 
      Array.from(relationships.keys()).some(rel => rel.includes(hint))
    );
  }
  
  async matchesFilters(entityId, relationships, filters, timeFilter) {
    // Apply various filters to entity
    
    if (filters.category) {
      // Check if entity has category relationship
      const categoryRels = relationships.get('operates_in') || relationships.get('focuses_on') || [];
      const hasCategory = categoryRels.some(triplet => 
        triplet.object.toLowerCase().includes(filters.category.toLowerCase()) &&
        this.isValidAtTime(triplet, timeFilter)
      );
      if (!hasCategory) return false;
    }
    
    if (filters.location) {
      // Check location relationships
      const locationRels = relationships.get('headquartered_in') || relationships.get('office_in') || [];
      const hasLocation = locationRels.some(triplet => 
        triplet.object.toLowerCase().includes(filters.location.toLowerCase()) &&
        this.isValidAtTime(triplet, timeFilter)
      );
      if (!hasLocation) return false;
    }
    
    if (filters.founded_after) {
      // Check founding date
      const foundingRels = relationships.get('founded_by') || [];
      const foundedAfter = foundingRels.some(triplet => {
        const foundingDate = new Date(triplet.valid_from);
        return foundingDate >= new Date(filters.founded_after);
      });
      if (!foundedAfter) return false;
    }
    
    return true;
  }
  
  isValidAtTime(triplet, timeFilter) {
    if (!timeFilter) return true;
    
    const validFrom = new Date(triplet.valid_from);
    const validTo = triplet.valid_to ? new Date(triplet.valid_to) : new Date();
    const queryTime = new Date(timeFilter);
    
    return queryTime >= validFrom && queryTime <= validTo;
  }
  
  async getEntityProperties(entityId, timeFilter) {
    // Collect all properties valid at given time
    const properties = {};
    const relationships = this.knowledgeGraph.get(entityId);
    
    if (!relationships) return properties;
    
    for (const [predicate, triplets] of relationships) {
      const validTriplets = triplets.filter(t => this.isValidAtTime(t, timeFilter));
      if (validTriplets.length > 0) {
        properties[predicate] = validTriplets.map(t => t.object);
      }
    }
    
    return properties;
  }
  
  detectChanges(state1, state2) {
    const changes = [];
    
    // Compare relationships
    const allPredicates = new Set([
      ...Object.keys(state1.relationships),
      ...Object.keys(state2.relationships)
    ]);
    
    for (const predicate of allPredicates) {
      const rels1 = state1.relationships[predicate] || [];
      const rels2 = state2.relationships[predicate] || [];
      
      // Find additions
      const added = rels2.filter(r2 => 
        !rels1.some(r1 => r1.object === r2.object)
      );
      
      // Find removals
      const removed = rels1.filter(r1 => 
        !rels2.some(r2 => r2.object === r1.object)
      );
      
      if (added.length > 0) {
        changes.push({ type: 'added', predicate, objects: added.map(r => r.object) });
      }
      
      if (removed.length > 0) {
        changes.push({ type: 'removed', predicate, objects: removed.map(r => r.object) });
      }
    }
    
    return changes;
  }
  
  hashQuestion(question) {
    return require('crypto')
      .createHash('md5')
      .update(question.toLowerCase().trim())
      .digest('hex');
  }
  
  // Aggregation helpers
  async calculateTotalFunding(entities) {
    let total = 0;
    const breakdown = {};
    
    for (const entity of entities) {
      const entityId = entity.id || entity;
      const fundingRels = await this.traverseRelationship([entityId], 'funded_by');
      
      for (const rel of fundingRels) {
        const amount = this.extractFundingAmount(rel.triplet);
        if (amount > 0) {
          total += amount;
          breakdown[entityId] = (breakdown[entityId] || 0) + amount;
        }
      }
    }
    
    return { total, breakdown, currency: 'USD' };
  }
  
  extractFundingAmount(triplet) {
    // Extract funding amount from triplet object
    if (triplet.metadata && triplet.metadata.amount) {
      return triplet.metadata.amount;
    }
    
    // Parse from object string
    const amountMatch = triplet.object.match(/(\d+)_?million/i);
    if (amountMatch) {
      return parseInt(amountMatch[1]) * 1000000;
    }
    
    return 0;
  }
}

// ============================================================================
// EXAMPLE QUERIES FOR BC AI ECOSYSTEM
// ============================================================================

const ExampleQueries = {
  funding: [
    "Which companies raised the most funding in 2024?",
    "What is the total funding raised by BC AI companies in the last 2 years?", 
    "Which investors are most active in BC AI funding?",
    "Show me the funding timeline for FinTech companies in Vancouver"
  ],
  
  relationships: [
    "Which companies have Rhino Ventures invested in?",
    "What partnerships has AlayaCare formed over time?",
    "Which executives have moved between BC AI companies?",
    "Show me the investor network for Series A companies"
  ],
  
  temporal: [
    "How has the BC AI ecosystem grown over the past 5 years?",
    "Which companies pivoted their focus in 2023?",
    "What was the funding landscape like in Q1 2024 vs Q1 2023?",
    "Track the evolution of CleanTech AI companies"
  ],
  
  competitive: [
    "Which companies compete in the same space as AlayaCare?",
    "Show me emerging competitors to established BC AI companies",
    "What market segments are seeing the most new entrants?",
    "Which companies have similar investor profiles?"
  ]
};

// ============================================================================
// CLI TESTING INTERFACE
// ============================================================================

async function main() {
  const retriever = new MultiHopRetriever();
  
  console.log('🔍 BC AI Multi-Hop Retrieval System');
  console.log('====================================');
  
  // Test with example queries
  const testQueries = [
    "Which companies in Vancouver have raised Series A funding?",
    "What partnerships has AlayaCare formed over time?",
    "Show me the total funding raised by FinTech companies in 2024"
  ];
  
  for (const query of testQueries) {
    console.log(`\n🎯 Testing: ${query}`);
    console.log('=' .repeat(50));
    
    const result = await retriever.executeQuery(query);
    
    if (result.error) {
      console.error('❌ Error:', result.error);
    } else {
      console.log('✅ Answer:', result.answer);
      console.log('📊 Evidence:', result.evidence?.join(', '));
      console.log('🔍 Insights:', result.insights?.join(', '));
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { MultiHopRetriever, ExampleQueries };