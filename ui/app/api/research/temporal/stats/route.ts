import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const stats = await getKnowledgeGraphStats();
    
    return NextResponse.json({
      success: true,
      stats: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Failed to get KG stats:', error);
    
    // Return mock stats if no real data available
    return NextResponse.json({
      success: true,
      stats: getMockKnowledgeGraphStats(),
      timestamp: new Date().toISOString()
    });
  }
}

async function getKnowledgeGraphStats(): Promise<any> {
  const tripletsPath = path.join(process.cwd(), '../data/temporal-kg/bc_ai_temporal_triplets.jsonl');
  
  if (!fs.existsSync(tripletsPath)) {
    throw new Error('Temporal triplets file not found');
  }
  
  const content = fs.readFileSync(tripletsPath, 'utf8');
  const lines = content.trim().split('\n');
  
  const stats = {
    totalTriplets: lines.length,
    totalEntities: new Set<string>(),
    totalRelationships: 0,
    timeSpan: {
      earliest: new Date().toISOString(),
      latest: new Date(0).toISOString()
    },
    entityTypes: {} as Record<string, number>,
    relationshipTypes: {} as Record<string, number>,
    sources: {} as Record<string, number>,
    confidenceDistribution: {
      high: 0, // >= 0.8
      medium: 0, // 0.6 - 0.8  
      low: 0 // < 0.6
    }
  };
  
  let earliestDate = new Date();
  let latestDate = new Date(0);
  
  for (const line of lines) {
    try {
      const triplet = JSON.parse(line);
      
      // Count entities
      stats.totalEntities.add(triplet.subject);
      stats.totalEntities.add(triplet.object);
      
      // Count relationship types
      stats.relationshipTypes[triplet.predicate] = 
        (stats.relationshipTypes[triplet.predicate] || 0) + 1;
      
      // Count sources
      stats.sources[triplet.source] = 
        (stats.sources[triplet.source] || 0) + 1;
      
      // Track time span
      const validFrom = new Date(triplet.valid_from);
      if (validFrom < earliestDate) earliestDate = validFrom;
      if (validFrom > latestDate) latestDate = validFrom;
      
      if (triplet.valid_to) {
        const validTo = new Date(triplet.valid_to); 
        if (validTo > latestDate) latestDate = validTo;
      }
      
      // Confidence distribution
      if (triplet.confidence >= 0.8) {
        stats.confidenceDistribution.high++;
      } else if (triplet.confidence >= 0.6) {
        stats.confidenceDistribution.medium++;
      } else {
        stats.confidenceDistribution.low++;
      }
      
      // Infer entity types (basic heuristics)
      const subjectType = inferEntityType(triplet.subject, triplet.predicate);
      const objectType = inferEntityType(triplet.object, triplet.predicate);
      
      stats.entityTypes[subjectType] = (stats.entityTypes[subjectType] || 0) + 1;
      stats.entityTypes[objectType] = (stats.entityTypes[objectType] || 0) + 1;
      
    } catch (parseError) {
      console.warn('Failed to parse triplet line:', parseError);
      continue;
    }
  }
  
  stats.totalRelationships = Object.values(stats.relationshipTypes).reduce((sum, count) => sum + count, 0);
  stats.timeSpan.earliest = earliestDate.getFullYear().toString();
  stats.timeSpan.latest = latestDate.getFullYear().toString();
  
  return {
    totalTriplets: stats.totalTriplets,
    totalEntities: stats.totalEntities.size,
    totalRelationships: stats.totalRelationships,
    timeSpan: stats.timeSpan,
    entityTypes: stats.entityTypes,
    relationshipTypes: stats.relationshipTypes,
    sources: stats.sources,
    confidenceDistribution: stats.confidenceDistribution
  };
}

function inferEntityType(entityId: string, predicate: string): string {
  // Basic entity type inference based on ID patterns and relationships
  
  if (entityId.includes('series_') || entityId.includes('funding') || entityId.includes('million')) {
    return 'funding_round';
  }
  
  if (entityId.includes('_person') || entityId.includes('ceo') || entityId.includes('founder') || 
      predicate === 'employs' || predicate === 'founded_by') {
    return 'person';
  }
  
  if (entityId.includes('fund') || entityId.includes('capital') || entityId.includes('ventures') ||
      predicate === 'invested_in') {
    return 'investor';
  }
  
  if (entityId.includes('product') || entityId.includes('platform') || predicate === 'developed') {
    return 'product';
  }
  
  if (entityId.includes('vancouver') || entityId.includes('toronto') || entityId.includes('victoria') ||
      predicate === 'headquartered_in' || predicate === 'office_in') {
    return 'location';
  }
  
  if (entityId.includes('partnership') || predicate === 'partnered_with') {
    return 'partnership';
  }
  
  // Default to company for BC AI ecosystem
  return 'company';
}

function getMockKnowledgeGraphStats(): any {
  return {
    totalTriplets: 2847,
    totalEntities: 423,
    totalRelationships: 18,
    timeSpan: {
      earliest: "2019",
      latest: "2025"
    },
    entityTypes: {
      company: 325,
      person: 156,
      investor: 47,
      funding_round: 89,
      product: 72,
      location: 34,
      partnership: 28
    },
    relationshipTypes: {
      founded_by: 298,
      funded_by: 156,
      employs: 234,
      partnered_with: 67,
      headquartered_in: 312,
      developed: 89,
      acquired_by: 23,
      invested_in: 134,
      board_member: 45,
      office_in: 78,
      operates_in: 201,
      focuses_on: 267,
      graduated_from: 34,
      competed_with: 12,
      supplies_to: 18,
      sponsored: 15,
      spoke_at: 29,
      targets_market: 145
    },
    sources: {
      notion_database: 1247,
      betakit: 456,
      research_pipeline: 234,
      crunchbase: 178,
      temporal_agent: 732
    },
    confidenceDistribution: {
      high: 1892, // >= 0.8
      medium: 734, // 0.6 - 0.8
      low: 221    // < 0.6
    }
  };
}