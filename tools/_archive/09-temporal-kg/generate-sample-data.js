#!/usr/bin/env node
/**
 * 🎯 Generate Sample Temporal Triplets for Testing
 * 
 * Creates realistic BC AI ecosystem data for testing the temporal knowledge graph
 * without needing real API keys or processing the full database.
 */

const fs = require('fs');
const path = require('path');
const { TemporalTriplet, EntityTypes, RelationshipTypes } = require('./temporal-schema');

console.log('🧪 Generating Sample Temporal Data for BC AI Ecosystem...');

// Sample BC AI companies and ecosystem data
const sampleData = {
  companies: [
    { id: 'alayacare', name: 'AlayaCare', sector: 'HealthTech', city: 'Montreal', founded: 2014 },
    { id: 'sanctuary_ai', name: 'Sanctuary AI', sector: 'Robotics', city: 'Vancouver', founded: 2018 },
    { id: 'terramera', name: 'Terramera', sector: 'AgTech', city: 'Vancouver', founded: 2010 },
    { id: 'abundance_technologies', name: 'Abundance Technologies', sector: 'CleanTech', city: 'Vancouver', founded: 2019 },
    { id: 'intellijoint_surgical', name: 'Intellijoint Surgical', sector: 'MedTech', city: 'Waterloo', founded: 2009 },
    { id: 'vision_critical', name: 'Vision Critical', sector: 'MarketTech', city: 'Vancouver', founded: 2000 },
    { id: 'awesense', name: 'Awesense', sector: 'EnergyTech', city: 'Vancouver', founded: 2010 },
    { id: 'procurify', name: 'Procurify', sector: 'FinTech', city: 'Vancouver', founded: 2013 }
  ],
  
  investors: [
    { id: 'rhino_ventures', name: 'Rhino Ventures', type: 'VC Fund' },
    { id: 'vanedge_capital', name: 'Vanedge Capital', type: 'VC Fund' },
    { id: 'yaletown_partners', name: 'Yaletown Partners', type: 'VC Fund' },
    { id: 'bdc_capital', name: 'BDC Capital', type: 'Government Fund' },
    { id: 'insight_partners', name: 'Insight Partners', type: 'VC Fund' }
  ],
  
  people: [
    { id: 'adrian_aoun_alayacare', name: 'Adrian Aoun', role: 'CEO', company: 'alayacare' },
    { id: 'geordie_rose_sanctuary', name: 'Geordie Rose', role: 'Co-founder & CEO', company: 'sanctuary_ai' },
    { id: 'karn_manhas_terramera', name: 'Karn Manhas', role: 'CEO', company: 'terramera' },
    { id: 'arjun_singh_procurify', name: 'Arjun Singh', role: 'CEO', company: 'procurify' }
  ],
  
  fundingRounds: [
    { id: 'alayacare_series_c_2024', company: 'alayacare', amount: 81000000, series: 'C', date: '2024-03-15', lead: 'insight_partners' },
    { id: 'sanctuary_series_b_2023', company: 'sanctuary_ai', amount: 30000000, series: 'B', date: '2023-09-12', lead: 'vanedge_capital' },
    { id: 'terramera_series_b_2023', company: 'terramera', amount: 45000000, series: 'B', date: '2023-06-20', lead: 'bdc_capital' },
    { id: 'procurify_series_a_2022', company: 'procurify', amount: 15000000, series: 'A', date: '2022-11-08', lead: 'rhino_ventures' }
  ]
};

// Generate temporal triplets
const triplets = [];

// Company founding events
sampleData.companies.forEach(company => {
  triplets.push(new TemporalTriplet({
    subject: company.id,
    predicate: 'founded_in',
    object: `${company.founded}`,
    validFrom: `${company.founded}-01-01T00:00:00Z`,
    validTo: null,
    confidence: 0.95,
    source: 'sample_data',
    metadata: { event_type: 'company_founding', sector: company.sector }
  }));

  // Company location
  triplets.push(new TemporalTriplet({
    subject: company.id,
    predicate: RelationshipTypes.HEADQUARTERED_IN,
    object: company.city.toLowerCase(),
    validFrom: `${company.founded}-01-01T00:00:00Z`,
    validTo: null,
    confidence: 0.90,
    source: 'sample_data',
    metadata: { location_type: 'headquarters' }
  }));

  // Company sector focus
  triplets.push(new TemporalTriplet({
    subject: company.id,
    predicate: RelationshipTypes.FOCUSES_ON,
    object: company.sector.toLowerCase(),
    validFrom: `${company.founded}-01-01T00:00:00Z`,
    validTo: null,
    confidence: 0.88,
    source: 'sample_data',
    metadata: { sector: company.sector }
  }));
});

// Funding events
sampleData.fundingRounds.forEach(round => {
  // Company raised funding
  triplets.push(new TemporalTriplet({
    subject: round.company,
    predicate: RelationshipTypes.FUNDED_BY,
    object: round.id,
    validFrom: round.date + 'T00:00:00Z',
    validTo: null,
    confidence: 0.95,
    source: 'sample_data',
    metadata: {
      amount: round.amount,
      series: round.series,
      lead_investor: round.lead,
      currency: 'USD'
    }
  }));

  // Investor invested in company
  triplets.push(new TemporalTriplet({
    subject: round.lead,
    predicate: 'invested_in',
    object: round.company,
    validFrom: round.date + 'T00:00:00Z',
    validTo: null,
    confidence: 0.92,
    source: 'sample_data',
    metadata: {
      amount: round.amount,
      role: 'lead_investor',
      series: round.series
    }
  }));
});

// Leadership relationships
sampleData.people.forEach(person => {
  triplets.push(new TemporalTriplet({
    subject: person.company,
    predicate: RelationshipTypes.EMPLOYS,
    object: person.id,
    validFrom: '2020-01-01T00:00:00Z', // Approximate start date
    validTo: null,
    confidence: 0.85,
    source: 'sample_data',
    metadata: {
      role: person.role,
      person_name: person.name,
      employment_type: 'executive'
    }
  }));
});

// Add some partnerships (sample)
const partnerships = [
  { company1: 'alayacare', company2: 'microsoft', date: '2023-05-15', type: 'technology_partnership' },
  { company1: 'sanctuary_ai', company2: 'magna_international', date: '2023-08-22', type: 'manufacturing_partnership' },
  { company1: 'terramera', company2: 'syngenta', date: '2022-12-10', type: 'distribution_partnership' }
];

partnerships.forEach(partnership => {
  triplets.push(new TemporalTriplet({
    subject: partnership.company1,
    predicate: RelationshipTypes.PARTNERED_WITH,
    object: partnership.company2,
    validFrom: partnership.date + 'T00:00:00Z',
    validTo: null,
    confidence: 0.87,
    source: 'sample_data',
    metadata: { partnership_type: partnership.type }
  }));
});

// Add some product launches
const products = [
  { company: 'alayacare', product: 'alayacare_platform_v3', date: '2023-09-01', type: 'software_platform' },
  { company: 'sanctuary_ai', product: 'phoenix_robot', date: '2023-11-15', type: 'robotics_platform' },
  { company: 'terramera', product: 'actnhyde_pesticide', date: '2022-06-30', type: 'agricultural_product' }
];

products.forEach(product => {
  triplets.push(new TemporalTriplet({
    subject: product.company,
    predicate: RelationshipTypes.DEVELOPED,
    object: product.product,
    validFrom: product.date + 'T00:00:00Z',
    validTo: null,
    confidence: 0.90,
    source: 'sample_data',
    metadata: { product_type: product.type }
  }));
});

// Save triplets to JSONL file
const outputPath = path.join(__dirname, '../../data/temporal-kg/bc_ai_temporal_triplets.jsonl');
const jsonlContent = triplets.map(triplet => JSON.stringify(triplet.toJSON())).join('\n');

fs.writeFileSync(outputPath, jsonlContent);

console.log(`✅ Generated ${triplets.length} sample temporal triplets`);
console.log(`💾 Saved to: ${outputPath}`);

// Generate summary statistics
const stats = {
  totalTriplets: triplets.length,
  entityTypes: {},
  relationshipTypes: {},
  sources: {},
  timeSpan: {
    earliest: Math.min(...triplets.map(t => new Date(t.validFrom).getFullYear())),
    latest: Math.max(...triplets.map(t => new Date(t.validFrom).getFullYear()))
  }
};

triplets.forEach(triplet => {
  // Count relationship types
  stats.relationshipTypes[triplet.predicate] = (stats.relationshipTypes[triplet.predicate] || 0) + 1;
  
  // Count sources
  stats.sources[triplet.source] = (stats.sources[triplet.source] || 0) + 1;
});

console.log('\n📊 Generated Data Summary:');
console.log(`   Companies: ${sampleData.companies.length}`);
console.log(`   Investors: ${sampleData.investors.length}`);
console.log(`   People: ${sampleData.people.length}`);
console.log(`   Funding Rounds: ${sampleData.fundingRounds.length}`);
console.log(`   Triplets: ${stats.totalTriplets}`);
console.log(`   Time Span: ${stats.timeSpan.earliest} - ${stats.timeSpan.latest}`);
console.log(`   Relationship Types: ${Object.keys(stats.relationshipTypes).length}`);

console.log('\n🎯 Ready to test the temporal knowledge graph!');
console.log('Next: cd ../../ui && npm run dev');
console.log('Visit: http://localhost:3004/research/temporal');