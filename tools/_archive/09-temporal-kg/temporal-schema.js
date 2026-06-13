#!/usr/bin/env node
/**
 * 🕒 Temporal Knowledge Graph Schema for BC AI Ecosystem
 * 
 * Defines temporal triplets, entity types, and relationship patterns
 * for tracking the evolution of the BC AI ecosystem over time.
 * 
 * Based on OpenAI Cookbook: Temporal Agents with Knowledge Graphs
 */

// ============================================================================
// TEMPORAL ENTITY TYPES
// ============================================================================

const EntityTypes = {
  // Core entities from existing database
  COMPANY: 'company',
  PERSON: 'person', 
  INVESTOR: 'investor',
  FUND: 'fund',
  PRODUCT: 'product',
  
  // Extended entities for ecosystem intelligence
  FUNDING_ROUND: 'funding_round',
  PARTNERSHIP: 'partnership',
  ACQUISITION: 'acquisition',
  PIVOT: 'pivot',
  OFFICE: 'office',
  TECHNOLOGY: 'technology',
  MARKET_SEGMENT: 'market_segment',
  
  // Ecosystem entities
  ACCELERATOR: 'accelerator',
  UNIVERSITY: 'university',
  GOVERNMENT_PROGRAM: 'government_program',
  EVENT: 'event',
  REGULATORY_CHANGE: 'regulatory_change'
};

// ============================================================================
// TEMPORAL RELATIONSHIP TYPES
// ============================================================================

const RelationshipTypes = {
  // Organizational relationships
  FOUNDED_BY: 'founded_by',
  EMPLOYS: 'employs',
  BOARD_MEMBER: 'board_member',
  ADVISOR: 'advisor',
  REPORTS_TO: 'reports_to',
  
  // Financial relationships  
  FUNDED_BY: 'funded_by',
  INVESTED_IN: 'invested_in',
  ACQUIRED_BY: 'acquired_by',
  VALUED_AT: 'valued_at',
  REVENUE_OF: 'revenue_of',
  
  // Business relationships
  PARTNERED_WITH: 'partnered_with',
  COMPETED_WITH: 'competed_with',  
  SUPPLIES_TO: 'supplies_to',
  CUSTOMER_OF: 'customer_of',
  
  // Location relationships
  HEADQUARTERED_IN: 'headquartered_in',
  OFFICE_IN: 'office_in',
  INCORPORATED_IN: 'incorporated_in',
  
  // Product/Technology relationships
  DEVELOPED: 'developed',
  LAUNCHED: 'launched',
  DISCONTINUED: 'discontinued',
  USES_TECHNOLOGY: 'uses_technology',
  FOCUSES_ON: 'focuses_on',
  
  // Market relationships
  OPERATES_IN: 'operates_in',
  TARGETS_MARKET: 'targets_market',
  COMPETES_IN: 'competes_in',
  
  // Ecosystem relationships
  GRADUATED_FROM: 'graduated_from',
  PARTICIPATED_IN: 'participated_in',
  SPONSORED: 'sponsored',
  SPOKE_AT: 'spoke_at'
};

// ============================================================================
// TEMPORAL TRIPLET STRUCTURE
// ============================================================================

class TemporalTriplet {
  constructor({
    subject,
    predicate, 
    object,
    validFrom,
    validTo = null,
    confidence = 1.0,
    source,
    metadata = {}
  }) {
    this.id = this.generateId(subject, predicate, object, validFrom);
    this.subject = subject;           // Entity ID
    this.predicate = predicate;       // Relationship type
    this.object = object;             // Target entity ID or value
    this.validFrom = new Date(validFrom);  // When this fact became true
    this.validTo = validTo ? new Date(validTo) : null;  // When this fact ceased to be true
    this.confidence = confidence;     // Confidence score (0.0 - 1.0)
    this.source = source;            // Data source
    this.metadata = metadata;        // Additional context
    this.createdAt = new Date();
  }
  
  generateId(subject, predicate, object, validFrom) {
    const hash = require('crypto')
      .createHash('sha256')
      .update(`${subject}-${predicate}-${object}-${validFrom}`)
      .digest('hex')
      .substring(0, 16);
    return `triplet_${hash}`;
  }
  
  isValidAt(timestamp) {
    const date = new Date(timestamp);
    return date >= this.validFrom && (this.validTo === null || date < this.validTo);
  }
  
  toJSON() {
    return {
      id: this.id,
      subject: this.subject,
      predicate: this.predicate,
      object: this.object,
      valid_from: this.validFrom.toISOString(),
      valid_to: this.validTo ? this.validTo.toISOString() : null,
      confidence: this.confidence,
      source: this.source,
      metadata: this.metadata,
      created_at: this.createdAt.toISOString()
    };
  }
}

// ============================================================================
// BC AI ECOSYSTEM SPECIFIC PATTERNS
// ============================================================================

const BCEcosystemPatterns = {
  // Funding patterns
  funding: {
    series: ['pre-seed', 'seed', 'series-a', 'series-b', 'series-c', 'series-d', 'growth', 'ipo'],
    bcInvestors: [
      'Rhino Ventures', 'Vanedge Capital', 'Yaletown Partners',
      'Boreas Ventures', 'Impression Ventures', 'Kensington Capital',
      'Version One Ventures', 'Inovia Capital', 'BDC Capital'
    ],
    governmentPrograms: [
      'IRAP', 'SR&ED', 'ISED', 'Innovate BC', 'Mitacs',
      'CIFAR AI Chairs', 'Vector Institute'
    ]
  },
  
  // Geographic patterns
  geography: {
    regions: ['Lower Mainland', 'Vancouver Island', 'Interior', 'Northern BC'],
    cities: ['Vancouver', 'Victoria', 'Burnaby', 'Richmond', 'Surrey', 'Kelowna'],
    techHubs: ['Downtown Vancouver', 'Mount Pleasant', 'Yaletown', 'UBC', 'SFU']
  },
  
  // Sector patterns
  sectors: {
    aiTypes: [
      'Machine Learning', 'Computer Vision', 'Natural Language Processing',
      'Robotics', 'Deep Learning', 'Reinforcement Learning'
    ],
    industries: [
      'HealthTech', 'FinTech', 'CleanTech', 'EdTech', 'RetailTech',
      'Manufacturing', 'Agriculture', 'Transportation'
    ]
  },
  
  // Ecosystem patterns
  ecosystem: {
    accelerators: ['Techstars Vancouver', '500 Global', 'Creative Destruction Lab'],
    universities: ['UBC', 'SFU', 'UVic', 'BCIT'],
    researchInstitutes: ['Vector Institute', 'Mila', 'CIFAR']
  }
};

// ============================================================================
// TEMPORAL EVENT TYPES FOR BC AI ECOSYSTEM
// ============================================================================

const EventTypes = {
  // Company lifecycle
  COMPANY_FOUNDED: 'company_founded',
  COMPANY_ACQUIRED: 'company_acquired',
  COMPANY_IPO: 'company_ipo',
  COMPANY_CLOSED: 'company_closed',
  COMPANY_PIVOT: 'company_pivot',
  
  // Funding events
  FUNDING_RAISED: 'funding_raised',
  FUNDING_ANNOUNCED: 'funding_announced',
  INVESTOR_JOINED: 'investor_joined',
  VALUATION_UPDATED: 'valuation_updated',
  
  // Product events
  PRODUCT_LAUNCHED: 'product_launched',
  PRODUCT_UPDATED: 'product_updated',
  PRODUCT_DISCONTINUED: 'product_discontinued',
  FEATURE_RELEASED: 'feature_released',
  
  // People events
  EXECUTIVE_HIRED: 'executive_hired',
  EXECUTIVE_LEFT: 'executive_left',
  BOARD_JOINED: 'board_joined',
  ADVISOR_ADDED: 'advisor_added',
  
  // Business events
  PARTNERSHIP_FORMED: 'partnership_formed',
  PARTNERSHIP_ENDED: 'partnership_ended',
  OFFICE_OPENED: 'office_opened',
  OFFICE_CLOSED: 'office_closed',
  
  // Market events
  MARKET_ENTERED: 'market_entered',
  MARKET_EXITED: 'market_exited',
  COMPETITOR_EMERGED: 'competitor_emerged',
  REGULATION_CHANGED: 'regulation_changed'
};

// ============================================================================
// SCHEMA VALIDATION RULES
// ============================================================================

const ValidationRules = {
  // Required fields for each entity type
  entityRequiredFields: {
    [EntityTypes.COMPANY]: ['name', 'founded_date'],
    [EntityTypes.PERSON]: ['name', 'role'],
    [EntityTypes.INVESTOR]: ['name', 'type'],
    [EntityTypes.FUNDING_ROUND]: ['amount', 'series', 'date']
  },
  
  // Valid relationship combinations
  validRelationships: {
    [EntityTypes.COMPANY]: [
      RelationshipTypes.FOUNDED_BY,
      RelationshipTypes.FUNDED_BY,
      RelationshipTypes.PARTNERED_WITH,
      RelationshipTypes.HEADQUARTERED_IN,
      RelationshipTypes.DEVELOPED
    ],
    [EntityTypes.PERSON]: [
      RelationshipTypes.EMPLOYS,
      RelationshipTypes.FOUNDED_BY,
      RelationshipTypes.BOARD_MEMBER,
      RelationshipTypes.ADVISOR
    ]
  },
  
  // Temporal constraints
  temporalConstraints: {
    maxValidPeriod: 365 * 24 * 60 * 60 * 1000, // 1 year in milliseconds
    minConfidence: 0.5,
    requiredSources: ['notion', 'betakit', 'crunchbase', 'research_pipeline']
  }
};

// ============================================================================
// EXPORT CONFIGURATION
// ============================================================================

module.exports = {
  EntityTypes,
  RelationshipTypes,
  TemporalTriplet,
  BCEcosystemPatterns,
  EventTypes,
  ValidationRules,
  
  // Helper functions
  createTriplet: (params) => new TemporalTriplet(params),
  
  validateTriplet: (triplet) => {
    // Basic validation logic
    if (!triplet.subject || !triplet.predicate || !triplet.object) {
      return { valid: false, error: 'Missing required fields' };
    }
    
    if (triplet.confidence < ValidationRules.temporalConstraints.minConfidence) {
      return { valid: false, error: 'Confidence too low' };
    }
    
    return { valid: true };
  }
};

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

if (require.main === module) {
  console.log('🕒 BC AI Ecosystem Temporal Schema');
  console.log('===================================');
  
  // Example triplet: AlayaCare raised $81M Series C
  const exampleTriplet = new TemporalTriplet({
    subject: 'alayacare',
    predicate: RelationshipTypes.FUNDED_BY,
    object: 'series_c_81m_2024',
    validFrom: '2024-03-15T00:00:00Z',
    confidence: 0.95,
    source: 'betakit',
    metadata: {
      amount: 81000000,
      currency: 'USD',
      series: 'C',
      lead_investor: 'Insight Partners',
      announcement_url: 'betakit.com/alayacare-81m-series-c'
    }
  });
  
  console.log('Example Triplet:');
  console.log(JSON.stringify(exampleTriplet.toJSON(), null, 2));
}