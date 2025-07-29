// Intelligent Merging Strategy System
// BC AI Ecosystem Atlas - Phase 2B Implementation

const { Client } = require('@notionhq/client');

class IntelligentMergingSystem {
  constructor(notionToken, databaseId) {
    this.notion = new Client({ auth: notionToken });
    this.databaseId = databaseId;
    
    // Data source priority weights (higher = more trusted)
    this.sourcePriority = {
      'official_website': 1.0,
      'linkedin_verified': 0.9,
      'crunchbase': 0.8,
      'government_registry': 0.95,
      'manual_verification': 0.85,
      'automated_research': 0.6,
      'third_party_database': 0.5,
      'social_media': 0.3,
      'unknown': 0.1
    };

    // Field-specific merge strategies
    this.mergeStrategies = {
      // Core identification - choose most official/complete
      name: 'choose_most_official',
      website: 'choose_primary_domain',
      
      // Contact info - merge all unique values
      email: 'merge_unique_contacts',
      phone: 'merge_unique_contacts',
      linkedin: 'choose_most_complete',
      
      // Geographic - choose most precise
      address: 'choose_most_detailed',
      city: 'choose_most_precise',
      coordinates: 'choose_highest_precision',
      bc_region: 'choose_most_specific',
      
      // Classification - intelligent merge
      category: 'choose_most_specific',
      ai_focus_areas: 'union_with_deduplication',
      size: 'choose_most_recent',
      
      // Descriptions - choose most comprehensive
      short_blurb: 'choose_most_comprehensive',
      focus_notes: 'merge_complementary_text',
      
      // Metadata - choose most recent/complete
      year_founded: 'choose_most_credible',
      primary_contact: 'choose_most_complete',
      logo: 'choose_highest_quality'
    };

    this.mergeResults = [];
  }

  /**
   * Main merge function - processes duplicate pairs and creates merged records
   */
  async mergeDuplicates(duplicatePairs) {
    console.log(`🔀 Starting Intelligent Merging for ${duplicatePairs.length} duplicate pairs...`);
    
    const mergeRecommendations = [];
    
    for (const pair of duplicatePairs) {
      try {
        // Fetch full organization data for both duplicates
        const org1 = await this.fetchOrganizationData(pair.organization1.id);
        const org2 = await this.fetchOrganizationData(pair.organization2.id);
        
        if (!org1 || !org2) {
          console.warn(`Skipping merge - could not fetch data for pair ${pair.organization1.id} / ${pair.organization2.id}`);
          continue;
        }

        // Create merged record
        const mergedData = await this.createMergedRecord(org1, org2, pair);
        
        // Generate merge recommendation
        const recommendation = this.generateMergeRecommendation(org1, org2, mergedData, pair);
        mergeRecommendations.push(recommendation);

        console.log(`   ✅ Merge strategy created for: ${org1.name} + ${org2.name}`);

      } catch (error) {
        console.error(`❌ Failed to process merge for pair ${pair.organization1.id}:`, error);
      }
    }

    return this.generateMergeReport(mergeRecommendations);
  }

  /**
   * Create intelligently merged record from two organizations
   */
  async createMergedRecord(org1, org2, duplicateInfo) {
    const mergedData = {
      id: null, // Will be new record
      sourceOrganizations: [org1.id, org2.id],
      mergeConfidence: duplicateInfo.confidence,
      mergeReason: duplicateInfo.stage
    };

    // Apply field-specific merge strategies
    for (const [field, strategy] of Object.entries(this.mergeStrategies)) {
      const value1 = org1[field];
      const value2 = org2[field];
      
      mergedData[field] = await this.mergeField(field, value1, value2, org1, org2, strategy);
    }

    // Add merge metadata
    mergedData.mergeMetadata = {
      mergedAt: new Date().toISOString(),
      mergeStrategy: 'intelligent_field_merge',
      sourceCount: 2,
      dataQualityImprovement: this.calculateQualityImprovement(org1, org2, mergedData)
    };

    return mergedData;
  }

  /**
   * Merge individual fields using specified strategy
   */
  async mergeField(fieldName, value1, value2, org1, org2, strategy) {
    // Handle null/undefined values
    if (!value1 && !value2) return null;
    if (!value1) return value2;
    if (!value2) return value1;
    if (value1 === value2) return value1;

    switch (strategy) {
      case 'choose_most_official':
        return this.chooseMostOfficial(value1, value2, org1, org2);
        
      case 'choose_primary_domain':
        return this.choosePrimaryDomain(value1, value2);
        
      case 'merge_unique_contacts':
        return this.mergeUniqueContacts(value1, value2);
        
      case 'choose_most_detailed':
        return this.chooseMostDetailed(value1, value2);
        
      case 'choose_most_precise':
        return this.chooseMostPrecise(value1, value2);
        
      case 'choose_highest_precision':
        return this.chooseHighestPrecision(value1, value2);
        
      case 'union_with_deduplication':
        return this.unionWithDeduplication(value1, value2);
        
      case 'choose_most_comprehensive':
        return this.chooseMostComprehensive(value1, value2);
        
      case 'merge_complementary_text':
        return this.mergeComplementaryText(value1, value2);
        
      case 'choose_most_credible':
        return this.chooseMostCredible(value1, value2, fieldName);
        
      case 'choose_most_complete':
        return this.chooseMostComplete(value1, value2);

      default:
        // Default: choose non-null value, prefer longer/more detailed
        return this.defaultMergeStrategy(value1, value2);
    }
  }

  /**
   * Merge strategy implementations
   */
  chooseMostOfficial(value1, value2, org1, org2) {
    // Prefer official-sounding names (complete, no abbreviations)
    const score1 = this.calculateOfficialNameScore(value1);
    const score2 = this.calculateOfficialNameScore(value2);
    return score1 >= score2 ? value1 : value2;
  }

  calculateOfficialNameScore(name) {
    let score = 0;
    
    // Prefer longer names (more complete)
    score += Math.min(name.length / 50, 1) * 30;
    
    // Prefer names with complete words
    if (!/\b[A-Z]{2,}\b/.test(name)) score += 20; // No all-caps abbreviations
    
    // Prefer names with legal suffixes
    if (/\b(Inc|Ltd|Corp|LLC|Co)\b/i.test(name)) score += 15;
    
    // Penalize obvious abbreviations
    if (name.includes('&') || name.includes('.')) score -= 10;
    
    return score;
  }

  choosePrimaryDomain(url1, url2) {
    // Prefer HTTPS over HTTP
    const https1 = url1.startsWith('https:');
    const https2 = url2.startsWith('https:');
    if (https1 && !https2) return url1;
    if (https2 && !https1) return url2;
    
    // Prefer shorter domains (likely primary)
    const domain1 = this.extractDomain(url1);
    const domain2 = this.extractDomain(url2);
    return domain1.length <= domain2.length ? url1 : url2;
  }

  mergeUniqueContacts(contact1, contact2) {
    // For contact fields, merge unique values
    if (typeof contact1 === 'string' && typeof contact2 === 'string') {
      const contacts = [contact1, contact2].filter(c => c && c.trim());
      return [...new Set(contacts)]; // Return array of unique contacts
    }
    return contact1 || contact2;
  }

  chooseMostDetailed(value1, value2) {
    // Choose the longer, more detailed value
    const detail1 = typeof value1 === 'string' ? value1.length : 0;
    const detail2 = typeof value2 === 'string' ? value2.length : 0;
    return detail1 >= detail2 ? value1 : value2;
  }

  chooseHighestPrecision(coords1, coords2) {
    // For coordinates, choose based on precision indicators
    if (!coords1) return coords2;
    if (!coords2) return coords1;
    
    // Prefer geocoded over manual
    if (coords1.source === 'geocoded' && coords2.source !== 'geocoded') return coords1;
    if (coords2.source === 'geocoded' && coords1.source !== 'geocoded') return coords2;
    
    // Prefer more decimal places (higher precision)
    const precision1 = this.getCoordinatePrecision(coords1);
    const precision2 = this.getCoordinatePrecision(coords2);
    return precision1 >= precision2 ? coords1 : coords2;
  }

  unionWithDeduplication(array1, array2) {
    // Merge arrays and remove duplicates
    if (!Array.isArray(array1)) array1 = array1 ? [array1] : [];
    if (!Array.isArray(array2)) array2 = array2 ? [array2] : [];
    
    const combined = [...array1, ...array2];
    return [...new Set(combined.map(item => item.toLowerCase()))]
      .map(item => combined.find(orig => orig.toLowerCase() === item));
  }

  chooseMostComprehensive(text1, text2) {
    // Choose based on information density
    const score1 = this.calculateTextComprehensiveness(text1);
    const score2 = this.calculateTextComprehensiveness(text2);
    return score1 >= score2 ? text1 : text2;
  }

  calculateTextComprehensiveness(text) {
    if (!text) return 0;
    
    let score = 0;
    score += Math.min(text.length / 200, 1) * 40; // Length factor
    score += (text.split(' ').length / 50) * 30; // Word count
    score += (text.split('.').length - 1) * 10; // Sentence count
    
    // Bonus for specific keywords
    const keywords = ['AI', 'artificial intelligence', 'machine learning', 'founded', 'technology'];
    keywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword.toLowerCase())) score += 5;
    });
    
    return score;
  }

  mergeComplementaryText(text1, text2) {
    // Intelligently merge two text descriptions
    if (!text1) return text2;
    if (!text2) return text1;
    
    // If one is clearly a subset of the other, use the larger
    if (text1.includes(text2) || text2.includes(text1)) {
      return text1.length >= text2.length ? text1 : text2;
    }
    
    // Otherwise, combine intelligently
    const sentences1 = text1.split('.').filter(s => s.trim());
    const sentences2 = text2.split('.').filter(s => s.trim());
    
    // Find unique information in each
    const uniqueSentences = [];
    [...sentences1, ...sentences2].forEach(sentence => {
      const normalized = sentence.trim().toLowerCase();
      if (!uniqueSentences.some(existing => 
        existing.toLowerCase().includes(normalized) || normalized.includes(existing.toLowerCase())
      )) {
        uniqueSentences.push(sentence.trim());
      }
    });
    
    return uniqueSentences.join('. ') + '.';
  }

  chooseMostCredible(value1, value2, fieldName) {
    // Field-specific credibility assessment
    if (fieldName === 'year_founded') {
      const currentYear = new Date().getFullYear();
      
      // Prefer realistic years
      const realistic1 = value1 >= 1800 && value1 <= currentYear;
      const realistic2 = value2 >= 1800 && value2 <= currentYear;
      
      if (realistic1 && !realistic2) return value1;
      if (realistic2 && !realistic1) return value2;
      
      // Prefer earlier founding year if both realistic
      return value1 <= value2 ? value1 : value2;
    }
    
    return this.defaultMergeStrategy(value1, value2);
  }

  defaultMergeStrategy(value1, value2) {
    // Default: prefer non-null, then longer/more detailed
    if (!value1) return value2;
    if (!value2) return value1;
    
    if (typeof value1 === 'string' && typeof value2 === 'string') {
      return value1.length >= value2.length ? value1 : value2;
    }
    
    return value1; // Fallback to first value
  }

  /**
   * Generate merge recommendation with confidence and actions
   */
  generateMergeRecommendation(org1, org2, mergedData, duplicateInfo) {
    const conflicts = this.identifyDataConflicts(org1, org2);
    const improvements = this.calculateMergeImprovements(org1, org2, mergedData);
    
    return {
      id: `merge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      duplicatePair: {
        organization1: { id: org1.id, name: org1.name },
        organization2: { id: org2.id, name: org2.name }
      },
      mergeConfidence: duplicateInfo.confidence,
      detectionStage: duplicateInfo.stage,
      recommendedAction: this.getRecommendedAction(duplicateInfo.confidence, conflicts.length),
      conflicts: conflicts,
      mergedData: mergedData,
      improvements: improvements,
      estimatedQualityGain: improvements.qualityScoreImprovement,
      requiresManualReview: conflicts.some(c => c.severity === 'high') || duplicateInfo.confidence < 0.9,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Identify data conflicts between organizations
   */
  identifyDataConflicts(org1, org2) {
    const conflicts = [];
    
    // Check for significant differences in key fields
    const conflictFields = ['name', 'website', 'year_founded', 'category'];
    
    conflictFields.forEach(field => {
      const value1 = org1[field];
      const value2 = org2[field];
      
      if (value1 && value2 && value1 !== value2) {
        const severity = this.assessConflictSeverity(field, value1, value2);
        
        conflicts.push({
          field: field,
          value1: value1,
          value2: value2,
          severity: severity,
          resolution: this.suggestConflictResolution(field, value1, value2)
        });
      }
    });
    
    return conflicts;
  }

  /**
   * Assess severity of data conflicts
   */
  assessConflictSeverity(field, value1, value2) {
    switch (field) {
      case 'name':
        // High severity if names are very different
        const similarity = this.calculateStringSimilarity(value1, value2);
        return similarity < 0.7 ? 'high' : similarity < 0.9 ? 'medium' : 'low';
        
      case 'website':
        // High if different domains
        const domain1 = this.extractDomain(value1);
        const domain2 = this.extractDomain(value2);
        return domain1 !== domain2 ? 'high' : 'low';
        
      case 'year_founded':
        // Medium if difference > 2 years
        const diff = Math.abs(value1 - value2);
        return diff > 2 ? 'medium' : 'low';
        
      default:
        return 'low';
    }
  }

  /**
   * Calculate quality improvements from merge
   */
  calculateMergeImprovements(org1, org2, mergedData) {
    const improvements = {
      fieldCompleteness: {},
      qualityScoreImprovement: 0,
      newFieldsAdded: 0
    };
    
    // Calculate completeness improvements
    Object.keys(this.mergeStrategies).forEach(field => {
      const had1 = org1[field] && org1[field] !== null;
      const had2 = org2[field] && org2[field] !== null;
      const hasMerged = mergedData[field] && mergedData[field] !== null;
      
      if (!had1 && !had2 && hasMerged) {
        improvements.newFieldsAdded++;
      } else if ((!had1 || !had2) && hasMerged) {
        improvements.fieldCompleteness[field] = 'improved';
      }
    });
    
    // Estimate overall quality score improvement
    improvements.qualityScoreImprovement = improvements.newFieldsAdded * 5 + 
                                          Object.keys(improvements.fieldCompleteness).length * 3;
    
    return improvements;
  }

  /**
   * Get recommended action based on confidence and conflicts
   */
  getRecommendedAction(confidence, conflictCount) {
    if (confidence >= 0.95 && conflictCount === 0) {
      return 'auto_merge';
    } else if (confidence >= 0.8 && conflictCount <= 2) {
      return 'review_and_merge';
    } else if (confidence >= 0.7) {
      return 'manual_review';
    } else {
      return 'flag_for_investigation';
    }
  }

  /**
   * Utility methods
   */
  async fetchOrganizationData(organizationId) {
    try {
      const response = await this.notion.pages.retrieve({
        page_id: organizationId
      });
      
      return this.extractOrganizationData(response);
    } catch (error) {
      console.error(`Failed to fetch organization ${organizationId}:`, error);
      return null;
    }
  }

  extractOrganizationData(page) {
    // Similar to quality scoring system extraction
    const props = page.properties;
    
    return {
      id: page.id,
      name: props.Name?.type === 'title' && props.Name.title[0] ? 
        props.Name.title[0].plain_text : null,
      website: props.Website?.type === 'url' ? props.Website.url : null,
      email: props.Email?.type === 'email' ? props.Email.email : null,
      // ... other fields as needed
    };
  }

  extractDomain(url) {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname.replace('www.', '').toLowerCase();
    } catch {
      return url;
    }
  }

  calculateStringSimilarity(str1, str2) {
    // Simple string similarity calculation
    const len = Math.max(str1.length, str2.length);
    const distance = this.levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    return (len - distance) / len;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  getCoordinatePrecision(coords) {
    if (!coords.lat || !coords.lng) return 0;
    
    const latPrecision = (coords.lat.toString().split('.')[1] || '').length;
    const lngPrecision = (coords.lng.toString().split('.')[1] || '').length;
    
    return Math.min(latPrecision, lngPrecision);
  }

  /**
   * Generate comprehensive merge report
   */
  generateMergeReport(recommendations) {
    const report = {
      summary: {
        total_merge_recommendations: recommendations.length,
        auto_merge_ready: recommendations.filter(r => r.recommendedAction === 'auto_merge').length,
        requires_review: recommendations.filter(r => r.requiresManualReview).length,
        estimated_quality_gain: recommendations.reduce((sum, r) => sum + r.estimatedQualityGain, 0)
      },
      recommendations: recommendations,
      generated_at: new Date().toISOString()
    };

    console.log('\n🔀 INTELLIGENT MERGING REPORT');
    console.log('==============================');
    console.log(`Merge recommendations: ${report.summary.total_merge_recommendations}`);
    console.log(`Auto-merge ready: ${report.summary.auto_merge_ready}`);
    console.log(`Requires review: ${report.summary.requires_review}`);
    console.log(`Estimated quality gain: +${report.summary.estimated_quality_gain} points`);

    return report;
  }
}

module.exports = IntelligentMergingSystem;

// Example usage
if (require.main === module) {
  const merger = new IntelligentMergingSystem(
    process.env.NOTION_TOKEN,
    process.env.NOTION_DATABASE_ID
  );

  // This would typically receive duplicate pairs from the detection system
  const sampleDuplicates = [
    {
      organization1: { id: 'org1_id', name: 'Example Corp' },
      organization2: { id: 'org2_id', name: 'Example Corporation' },
      confidence: 0.95,
      stage: 'exact_match'
    }
  ];

  merger.mergeDuplicates(sampleDuplicates)
    .then(report => {
      console.log('\n✅ Intelligent merging completed successfully!');
    })
    .catch(error => {
      console.error('❌ Intelligent merging failed:', error);
      process.exit(1);
    });
} 