// Advanced Multi-Stage Duplicate Detection System
// BC AI Ecosystem Atlas - Phase 2B Implementation

const { Client } = require('@notionhq/client');
const stringSimilarity = require('string-similarity');

class DuplicateDetectionSystem {
  constructor(notionToken, databaseId) {
    this.notion = new Client({ auth: notionToken });
    this.databaseId = databaseId;
    this.duplicatePairs = [];
    this.processingStats = {
      totalOrganizations: 0,
      exactMatches: 0,
      fuzzyMatches: 0,
      locationMatches: 0,
      businessMatches: 0,
      processingTime: 0
    };
  }

  /**
   * Main entry point - runs all detection stages
   */
  async detectDuplicates() {
    console.log('🔍 Starting Multi-Stage Duplicate Detection...');
    const startTime = Date.now();

    try {
      // Fetch all organizations from Notion
      const organizations = await this.fetchAllOrganizations();
      this.processingStats.totalOrganizations = organizations.length;

      console.log(`📊 Analyzing ${organizations.length} organizations...`);

      // Stage 1: Exact field matching
      await this.detectExactMatches(organizations);

      // Stage 2: Fuzzy name matching  
      await this.detectFuzzyNameMatches(organizations);

      // Stage 3: Location-based clustering
      await this.detectLocationMatches(organizations);

      // Stage 4: Business profile similarity
      await this.detectBusinessSimilarity(organizations);

      this.processingStats.processingTime = Date.now() - startTime;
      
      return this.generateReport();

    } catch (error) {
      console.error('❌ Duplicate detection failed:', error);
      throw error;
    }
  }

  /**
   * Stage 1: Exact field matching (website, email, linkedin)
   */
  async detectExactMatches(organizations) {
    console.log('1️⃣ Stage 1: Exact field matching...');
    
    const fieldGroups = {
      website: new Map(),
      email: new Map(), 
      linkedin: new Map()
    };

    // Group organizations by normalized field values
    organizations.forEach(org => {
      // Normalize and group by website
      if (org.website) {
        const normalizedWebsite = this.normalizeUrl(org.website);
        if (!fieldGroups.website.has(normalizedWebsite)) {
          fieldGroups.website.set(normalizedWebsite, []);
        }
        fieldGroups.website.get(normalizedWebsite).push(org);
      }

      // Group by email
      if (org.email) {
        const normalizedEmail = org.email.toLowerCase().trim();
        if (!fieldGroups.email.has(normalizedEmail)) {
          fieldGroups.email.set(normalizedEmail, []);
        }
        fieldGroups.email.get(normalizedEmail).push(org);
      }

      // Group by LinkedIn
      if (org.linkedin) {
        const normalizedLinkedIn = this.normalizeUrl(org.linkedin);
        if (!fieldGroups.linkedin.has(normalizedLinkedIn)) {
          fieldGroups.linkedin.set(normalizedLinkedIn, []);
        }
        fieldGroups.linkedin.get(normalizedLinkedIn).push(org);
      }
    });

    // Find duplicates in each group
    for (const [field, groups] of Object.entries(fieldGroups)) {
      for (const [value, orgGroup] of groups) {
        if (orgGroup.length > 1) {
          // Multiple organizations with same field value = duplicates
          for (let i = 0; i < orgGroup.length - 1; i++) {
            for (let j = i + 1; j < orgGroup.length; j++) {
              this.addDuplicatePair(orgGroup[i], orgGroup[j], {
                stage: 'exact_match',
                field: field,
                value: value,
                confidence: 1.0
              });
              this.processingStats.exactMatches++;
            }
          }
        }
      }
    }

    console.log(`   ✅ Found ${this.processingStats.exactMatches} exact matches`);
  }

  /**
   * Stage 2: Fuzzy name matching using Jaro-Winkler algorithm
   */
  async detectFuzzyNameMatches(organizations) {
    console.log('2️⃣ Stage 2: Fuzzy name matching...');
    
    const threshold = 0.9;
    let matchCount = 0;

    for (let i = 0; i < organizations.length - 1; i++) {
      for (let j = i + 1; j < organizations.length; j++) {
        const org1 = organizations[i];
        const org2 = organizations[j];

        // Skip if already detected as exact match
        if (this.isPairAlreadyDetected(org1, org2)) continue;

        // Normalize names for comparison
        const name1 = this.normalizeName(org1.name);
        const name2 = this.normalizeName(org2.name);

        // Calculate similarity
        const similarity = stringSimilarity.compareTwoStrings(name1, name2);

        if (similarity >= threshold) {
          this.addDuplicatePair(org1, org2, {
            stage: 'fuzzy_name',
            similarity: similarity,
            name1: name1,
            name2: name2,
            confidence: similarity
          });
          matchCount++;
        }
      }
    }

    this.processingStats.fuzzyMatches = matchCount;
    console.log(`   ✅ Found ${matchCount} fuzzy name matches`);
  }

  /**
   * Stage 3: Location-based clustering
   */
  async detectLocationMatches(organizations) {
    console.log('3️⃣ Stage 3: Location-based clustering...');
    
    let matchCount = 0;
    const addressGroups = new Map();

    // Group by normalized address
    organizations.forEach(org => {
      if (org.address) {
        const normalizedAddress = this.normalizeAddress(org.address);
        if (!addressGroups.has(normalizedAddress)) {
          addressGroups.set(normalizedAddress, []);
        }
        addressGroups.get(normalizedAddress).push(org);
      }
    });

    // Find duplicates in address groups
    for (const [address, orgGroup] of addressGroups) {
      if (orgGroup.length > 1) {
        for (let i = 0; i < orgGroup.length - 1; i++) {
          for (let j = i + 1; j < orgGroup.length; j++) {
            if (!this.isPairAlreadyDetected(orgGroup[i], orgGroup[j])) {
              this.addDuplicatePair(orgGroup[i], orgGroup[j], {
                stage: 'location_match',
                address: address,
                confidence: 0.8
              });
              matchCount++;
            }
          }
        }
      }
    }

    this.processingStats.locationMatches = matchCount;
    console.log(`   ✅ Found ${matchCount} location-based matches`);
  }

  /**
   * Stage 4: Business profile similarity
   */
  async detectBusinessSimilarity(organizations) {
    console.log('4️⃣ Stage 4: Business profile similarity...');
    
    let matchCount = 0;
    const threshold = 0.75;

    for (let i = 0; i < organizations.length - 1; i++) {
      for (let j = i + 1; j < organizations.length; j++) {
        const org1 = organizations[i];
        const org2 = organizations[j];

        if (this.isPairAlreadyDetected(org1, org2)) continue;

        const similarity = this.calculateBusinessSimilarity(org1, org2);

        if (similarity >= threshold) {
          this.addDuplicatePair(org1, org2, {
            stage: 'business_similarity',
            similarity: similarity,
            confidence: similarity * 0.8 // Lower confidence for business similarity
          });
          matchCount++;
        }
      }
    }

    this.processingStats.businessMatches = matchCount;
    console.log(`   ✅ Found ${matchCount} business similarity matches`);
  }

  /**
   * Helper: Fetch all organizations from Notion
   */
  async fetchAllOrganizations() {
    const organizations = [];
    let cursor = undefined;

    do {
      const response = await this.notion.databases.query({
        database_id: this.databaseId,
        page_size: 100,
        start_cursor: cursor
      });

      for (const page of response.results) {
        if ('properties' in page) {
          const org = this.extractOrganizationData(page);
          if (org) organizations.push(org);
        }
      }

      cursor = response.next_cursor;
    } while (cursor);

    return organizations;
  }

  /**
   * Helper: Extract organization data from Notion page
   */
  extractOrganizationData(page) {
    try {
      const props = page.properties;
      
      const name = props.Name?.type === 'title' && props.Name.title[0] ? 
        props.Name.title[0].plain_text : '';
      
      if (!name) return null;

      return {
        id: page.id,
        name: name,
        website: props.Website?.type === 'url' ? props.Website.url : null,
        email: props.Email?.type === 'email' ? props.Email.email : null,
        linkedin: props.LinkedIn?.type === 'url' ? props.LinkedIn.url : null,
        address: props.Address?.type === 'rich_text' && props.Address.rich_text[0] ? 
          props.Address.rich_text[0].plain_text : null,
        city: props['City/Region']?.type === 'rich_text' && props['City/Region'].rich_text[0] ?
          props['City/Region'].rich_text[0].plain_text : null,
        aiFocusAreas: props['AI Focus Areas']?.type === 'multi_select' ?
          props['AI Focus Areas'].multi_select.map(item => item.name) : []
      };
    } catch (error) {
      console.warn('Failed to extract organization data:', error);
      return null;
    }
  }

  /**
   * Helper methods for normalization and similarity
   */
  normalizeUrl(url) {
    return url.toLowerCase()
              .replace(/^https?:\/\//, '')
              .replace(/^www\./, '')
              .replace(/\/$/, '')
              .trim();
  }

  normalizeName(name) {
    return name.toLowerCase()
               .replace(/\b(inc|ltd|corp|llc|co)\b\.?/g, '')
               .replace(/\s+/g, ' ')
               .trim();
  }

  normalizeAddress(address) {
    return address.toLowerCase()
                  .replace(/\b(street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd)\b/g, '')
                  .replace(/[^\w\s]/g, '')
                  .replace(/\s+/g, ' ')
                  .trim();
  }

  calculateBusinessSimilarity(org1, org2) {
    let similarity = 0;
    let factors = 0;

    // AI focus areas similarity (Jaccard index)
    if (org1.aiFocusAreas.length > 0 && org2.aiFocusAreas.length > 0) {
      const intersection = org1.aiFocusAreas.filter(area => org2.aiFocusAreas.includes(area));
      const union = [...new Set([...org1.aiFocusAreas, ...org2.aiFocusAreas])];
      similarity += intersection.length / union.length;
      factors++;
    }

    // City similarity
    if (org1.city && org2.city) {
      similarity += org1.city.toLowerCase() === org2.city.toLowerCase() ? 1 : 0;
      factors++;
    }

    return factors > 0 ? similarity / factors : 0;
  }

  addDuplicatePair(org1, org2, metadata) {
    this.duplicatePairs.push({
      organization1: { id: org1.id, name: org1.name },
      organization2: { id: org2.id, name: org2.name },
      ...metadata,
      detected_at: new Date().toISOString()
    });
  }

  isPairAlreadyDetected(org1, org2) {
    return this.duplicatePairs.some(pair =>
      (pair.organization1.id === org1.id && pair.organization2.id === org2.id) ||
      (pair.organization1.id === org2.id && pair.organization2.id === org1.id)
    );
  }

  generateReport() {
    const report = {
      summary: {
        total_organizations: this.processingStats.totalOrganizations,
        duplicate_pairs_found: this.duplicatePairs.length,
        processing_time_ms: this.processingStats.processingTime,
        stages: {
          exact_matches: this.processingStats.exactMatches,
          fuzzy_matches: this.processingStats.fuzzyMatches,
          location_matches: this.processingStats.locationMatches,
          business_matches: this.processingStats.businessMatches
        }
      },
      duplicate_pairs: this.duplicatePairs,
      recommendations: this.generateRecommendations()
    };

    console.log('\n📊 DUPLICATE DETECTION REPORT');
    console.log('===============================');
    console.log(`Organizations analyzed: ${report.summary.total_organizations}`);
    console.log(`Duplicate pairs found: ${report.summary.duplicate_pairs_found}`);
    console.log(`Processing time: ${Math.round(report.summary.processing_time_ms / 1000)}s`);
    console.log('\nStage breakdown:');
    console.log(`  Exact matches: ${report.summary.stages.exact_matches}`);
    console.log(`  Fuzzy matches: ${report.summary.stages.fuzzy_matches}`);
    console.log(`  Location matches: ${report.summary.stages.location_matches}`);
    console.log(`  Business matches: ${report.summary.stages.business_matches}`);

    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    // High confidence recommendations (exact matches)
    const highConfidence = this.duplicatePairs.filter(pair => pair.confidence >= 0.9);
    if (highConfidence.length > 0) {
      recommendations.push({
        priority: 'high',
        action: 'immediate_merge',
        count: highConfidence.length,
        description: 'High confidence duplicates ready for automatic merging'
      });
    }

    // Medium confidence recommendations (manual review)
    const mediumConfidence = this.duplicatePairs.filter(pair => 
      pair.confidence >= 0.7 && pair.confidence < 0.9
    );
    if (mediumConfidence.length > 0) {
      recommendations.push({
        priority: 'medium',
        action: 'manual_review',
        count: mediumConfidence.length,
        description: 'Medium confidence matches requiring human review'
      });
    }

    return recommendations;
  }
}

module.exports = DuplicateDetectionSystem;

// Example usage
if (require.main === module) {
  const detector = new DuplicateDetectionSystem(
    process.env.NOTION_TOKEN,
    process.env.NOTION_DATABASE_ID
  );

  detector.detectDuplicates()
    .then(report => {
      console.log('\n✅ Duplicate detection completed successfully!');
      // Save report to file or send to dashboard
    })
    .catch(error => {
      console.error('❌ Duplicate detection failed:', error);
      process.exit(1);
    });
} 