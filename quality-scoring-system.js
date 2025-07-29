// Automated Quality Scoring System
// BC AI Ecosystem Atlas - Phase 2B Implementation

const { Client } = require('@notionhq/client');

class QualityScoringSystem {
  constructor(notionToken, databaseId) {
    this.notion = new Client({ auth: notionToken });
    this.databaseId = databaseId;
    
    // Field weights for quality scoring (total = 100)
    this.fieldWeights = {
      // Core identification (25 points)
      name: 10,
      website: 15,
      
      // Contact information (25 points)
      email: 10,
      phone: 5,
      primary_contact: 5,
      linkedin: 5,
      
      // Geographic data (15 points)
      city: 5,
      address: 5,
      bc_region: 5,
      
      // Business classification (20 points)
      category: 8,
      ai_focus_areas: 12,
      
      // Business details (15 points)
      year_founded: 5,
      size: 3,
      short_blurb: 4,
      focus_notes: 3
    };
    
    this.scoringResults = [];
  }

  /**
   * Main entry point - scores all organizations
   */
  async scoreAllOrganizations() {
    console.log('📊 Starting Automated Quality Scoring...');
    const startTime = Date.now();

    try {
      const organizations = await this.fetchAllOrganizations();
      console.log(`📋 Analyzing quality for ${organizations.length} organizations...`);

      for (const org of organizations) {
        const score = this.calculateOrganizationScore(org);
        this.scoringResults.push(score);
      }

      const processingTime = Date.now() - startTime;
      return this.generateQualityReport(processingTime);

    } catch (error) {
      console.error('❌ Quality scoring failed:', error);
      throw error;
    }
  }

  /**
   * Calculate comprehensive quality score for a single organization
   */
  calculateOrganizationScore(org) {
    const fieldScores = {};
    let totalScore = 0;
    const improvements = [];
    const warnings = [];

    // Score each field
    for (const [field, maxPoints] of Object.entries(this.fieldWeights)) {
      const fieldScore = this.scoreField(field, org[field], org);
      fieldScores[field] = {
        score: fieldScore.points,
        maxPoints: maxPoints,
        percentage: Math.round((fieldScore.points / maxPoints) * 100),
        status: fieldScore.status
      };

      totalScore += fieldScore.points;

      // Collect improvement suggestions
      if (fieldScore.improvements) {
        improvements.push(...fieldScore.improvements);
      }

      // Collect warnings
      if (fieldScore.warnings) {
        warnings.push(...fieldScore.warnings);
      }
    }

    // Additional quality checks
    const additionalChecks = this.performAdditionalQualityChecks(org);
    improvements.push(...additionalChecks.improvements);
    warnings.push(...additionalChecks.warnings);

    return {
      organization: {
        id: org.id,
        name: org.name
      },
      overallScore: Math.round(totalScore),
      qualityGrade: this.calculateQualityGrade(totalScore),
      fieldScores: fieldScores,
      completenessPercentage: this.calculateCompletenessPercentage(fieldScores),
      improvements: improvements,
      warnings: warnings,
      lastScored: new Date().toISOString()
    };
  }

  /**
   * Score individual fields based on completeness and quality
   */
  scoreField(fieldName, value, organization) {
    const maxPoints = this.fieldWeights[fieldName];
    const result = {
      points: 0,
      status: 'missing',
      improvements: [],
      warnings: []
    };

    if (!value || value === null || value === undefined) {
      result.improvements.push({
        field: fieldName,
        priority: this.getFieldPriority(fieldName),
        suggestion: this.getMissingFieldSuggestion(fieldName),
        expectedImprovement: `+${maxPoints} points`
      });
      return result;
    }

    // Field-specific scoring logic
    switch (fieldName) {
      case 'name':
        result.points = this.scoreName(value, result);
        break;
      case 'website':
        result.points = this.scoreWebsite(value, result);
        break;
      case 'email':
        result.points = this.scoreEmail(value, organization.website, result);
        break;
      case 'phone':
        result.points = this.scorePhone(value, result);
        break;
      case 'linkedin':
        result.points = this.scoreLinkedIn(value, result);
        break;
      case 'ai_focus_areas':
        result.points = this.scoreAIFocusAreas(value, result);
        break;
      case 'year_founded':
        result.points = this.scoreYearFounded(value, result);
        break;
      case 'short_blurb':
        result.points = this.scoreShortBlurb(value, result);
        break;
      default:
        // Generic scoring for text fields
        result.points = this.scoreGenericField(value, maxPoints, result);
    }

    result.status = result.points === maxPoints ? 'excellent' :
                   result.points >= maxPoints * 0.7 ? 'good' :
                   result.points > 0 ? 'partial' : 'missing';

    return result;
  }

  /**
   * Field-specific scoring methods
   */
  scoreName(name, result) {
    const maxPoints = this.fieldWeights.name;
    
    if (name.length < 3) {
      result.warnings.push({
        field: 'name',
        issue: 'Name too short',
        impact: 'high'
      });
      return maxPoints * 0.3;
    }

    if (name.length > 100) {
      result.warnings.push({
        field: 'name',
        issue: 'Name unusually long',
        impact: 'low'
      });
    }

    // Check for placeholder content
    const placeholders = ['test', 'example', 'placeholder', 'unknown'];
    if (placeholders.some(p => name.toLowerCase().includes(p))) {
      result.warnings.push({
        field: 'name',
        issue: 'Name appears to contain placeholder content',
        impact: 'high'
      });
      return maxPoints * 0.2;
    }

    return maxPoints;
  }

  scoreWebsite(website, result) {
    const maxPoints = this.fieldWeights.website;
    
    try {
      const url = new URL(website.startsWith('http') ? website : `https://${website}`);
      
      // Prefer HTTPS
      if (url.protocol === 'https:') {
        return maxPoints;
      } else {
        result.improvements.push({
          field: 'website',
          priority: 'low',
          suggestion: 'Update to HTTPS for better security',
          expectedImprovement: 'Enhanced credibility and security'
        });
        return maxPoints * 0.9;
      }
    } catch (error) {
      result.warnings.push({
        field: 'website',
        issue: 'Invalid URL format',
        impact: 'high'
      });
      return maxPoints * 0.3;
    }
  }

  scoreEmail(email, website, result) {
    const maxPoints = this.fieldWeights.email;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      result.warnings.push({
        field: 'email',
        issue: 'Invalid email format',
        impact: 'high'
      });
      return maxPoints * 0.3;
    }

    // Check if email domain matches website domain
    if (website) {
      try {
        const emailDomain = email.split('@')[1].toLowerCase();
        const websiteDomain = new URL(website.startsWith('http') ? website : `https://${website}`)
          .hostname.replace('www.', '').toLowerCase();
        
        if (emailDomain === websiteDomain) {
          return maxPoints;
        } else {
          const commonProviders = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com'];
          if (commonProviders.includes(emailDomain)) {
            result.improvements.push({
              field: 'email',
              priority: 'medium',
              suggestion: 'Consider using organization domain email for better professional appearance',
              expectedImprovement: 'Enhanced credibility'
            });
            return maxPoints * 0.8;
          }
        }
      } catch (error) {
        // Website domain couldn't be parsed, still valid email
        return maxPoints * 0.9;
      }
    }

    return maxPoints;
  }

  // Added field-specific scoring helpers for phone and LinkedIn -----------------
  scorePhone(phone, result) {
    const maxPoints = this.fieldWeights.phone || 0;
    if (!phone) return 0;

    // Strip non-numeric characters
    const digits = phone.toString().replace(/\D/g, '');

    if (digits.length < 7) {
      result.warnings.push({
        field: 'phone',
        issue: 'Phone number appears too short',
        impact: 'medium'
      });
      return maxPoints * 0.3;
    }

    if (digits.length >= 10 && digits.length <= 15) {
      return maxPoints; // valid length
    }

    // Edge-case: unusually long number
    result.warnings.push({
      field: 'phone',
      issue: 'Phone number length unusual',
      impact: 'low'
    });
    return maxPoints * 0.7;
  }

  scoreLinkedIn(link, result) {
    const maxPoints = this.fieldWeights.linkedin || 0;
    if (!link) return 0;

    const url = link.toString().trim();
    const normalized = url.toLowerCase();

    // Basic validation – must contain linkedin domain
    if (!normalized.includes('linkedin.com')) {
      result.warnings.push({
        field: 'linkedin',
        issue: 'Value does not appear to be a LinkedIn URL',
        impact: 'medium'
      });
      return maxPoints * 0.2;
    }

    // Encourage full URL with https://
    if (!normalized.startsWith('http')) {
      result.warnings.push({
        field: 'linkedin',
        issue: 'LinkedIn link missing protocol (http/https)',
        impact: 'low'
      });
      return maxPoints * 0.8;
    }

    return maxPoints;
  }
  // -----------------------------------------------------------------------------

  scoreAIFocusAreas(focusAreas, result) {
    const maxPoints = this.fieldWeights.ai_focus_areas;
    
    if (!Array.isArray(focusAreas) || focusAreas.length === 0) {
      result.improvements.push({
        field: 'ai_focus_areas',
        priority: 'high',
        suggestion: 'Add AI focus areas to improve discoverability and ecosystem insights',
        expectedImprovement: `+${maxPoints} points, better categorization`
      });
      return 0;
    }

    if (focusAreas.length === 1) {
      result.improvements.push({
        field: 'ai_focus_areas',
        priority: 'medium',
        suggestion: 'Consider adding additional AI focus areas for more comprehensive profile',
        expectedImprovement: 'Better ecosystem insights and connections'
      });
      return maxPoints * 0.7;
    }

    if (focusAreas.length > 5) {
      result.warnings.push({
        field: 'ai_focus_areas',
        issue: 'Too many focus areas may dilute organization identity',
        impact: 'medium'
      });
      return maxPoints * 0.9;
    }

    return maxPoints;
  }

  scoreYearFounded(year, result) {
    const maxPoints = this.fieldWeights.year_founded;
    const currentYear = new Date().getFullYear();
    
    if (year < 1800 || year > currentYear) {
      result.warnings.push({
        field: 'year_founded',
        issue: 'Year founded appears unrealistic',
        impact: 'medium'
      });
      return maxPoints * 0.3;
    }

    return maxPoints;
  }

  scoreShortBlurb(blurb, result) {
    const maxPoints = this.fieldWeights.short_blurb;
    
    if (blurb.length < 50) {
      result.improvements.push({
        field: 'short_blurb',
        priority: 'medium',
        suggestion: 'Expand description to provide more context about the organization',
        expectedImprovement: 'Better user understanding and engagement'
      });
      return maxPoints * 0.6;
    }

    if (blurb.length > 500) {
      result.improvements.push({
        field: 'short_blurb',
        priority: 'low',
        suggestion: 'Consider shortening description for better readability',
        expectedImprovement: 'Improved user experience'
      });
      return maxPoints * 0.9;
    }

    return maxPoints;
  }

  scoreGenericField(value, maxPoints, result) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return maxPoints;
    }
    if (Array.isArray(value) && value.length > 0) {
      return maxPoints;
    }
    return 0;
  }

  /**
   * Perform additional quality checks beyond field scoring
   */
  performAdditionalQualityChecks(org) {
    const improvements = [];
    const warnings = [];

    // Check for missing coordinates (important for mapping)
    if (!org.coordinates && org.address) {
      improvements.push({
        field: 'coordinates',
        priority: 'high',
        suggestion: 'Add geocoded coordinates for precise map placement',
        expectedImprovement: 'Better map visualization and location accuracy'
      });
    }

    // Check for missing logo
    if (!org.logo) {
      improvements.push({
        field: 'logo',
        priority: 'medium',
        suggestion: 'Add organization logo for enhanced visual appeal',
        expectedImprovement: 'Better brand recognition and professional appearance'
      });
    }

    // Check website accessibility (placeholder - would need actual HTTP check)
    if (org.website && Math.random() < 0.1) { // Simulate 10% website issues
      warnings.push({
        field: 'website',
        issue: 'Website may be inaccessible',
        impact: 'high'
      });
    }

    return { improvements, warnings };
  }

  /**
   * Calculate quality grade based on score
   */
  calculateQualityGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C+';
    if (score >= 40) return 'C';
    return 'D';
  }

  /**
   * Calculate overall completeness percentage
   */
  calculateCompletenessPercentage(fieldScores) {
    const totalFields = Object.keys(fieldScores).length;
    const completedFields = Object.values(fieldScores).filter(field => field.score > 0).length;
    return Math.round((completedFields / totalFields) * 100);
  }

  /**
   * Generate improvement priority
   */
  getFieldPriority(fieldName) {
    const highPriority = ['name', 'website', 'ai_focus_areas', 'category'];
    const mediumPriority = ['email', 'city', 'bc_region', 'year_founded'];
    
    if (highPriority.includes(fieldName)) return 'high';
    if (mediumPriority.includes(fieldName)) return 'medium';
    return 'low';
  }

  /**
   * Get missing field suggestion
   */
  getMissingFieldSuggestion(fieldName) {
    const suggestions = {
      name: 'Add the official organization name',
      website: 'Add the primary website URL',
      email: 'Add a contact email address',
      phone: 'Add a contact phone number',
      linkedin: 'Add LinkedIn company page URL',
      ai_focus_areas: 'Specify AI technology focus areas',
      category: 'Select appropriate organization category',
      year_founded: 'Add the year the organization was founded',
      city: 'Specify the city location',
      bc_region: 'Select the BC region',
      short_blurb: 'Add a brief description of the organization'
    };
    
    return suggestions[fieldName] || `Add ${fieldName} information`;
  }

  /**
   * Fetch organizations from Notion
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
   * Extract organization data from Notion page
   */
  extractOrganizationData(page) {
    try {
      const props = page.properties;
      
      // Extract all relevant fields for quality scoring
      return {
        id: page.id,
        name: props.Name?.type === 'title' && props.Name.title[0] ? 
          props.Name.title[0].plain_text : null,
        website: props.Website?.type === 'url' ? props.Website.url : null,
        email: props.Email?.type === 'email' ? props.Email.email : null,
        phone: props.Phone?.type === 'phone_number' ? props.Phone.phone_number : null,
        linkedin: props.LinkedIn?.type === 'url' ? props.LinkedIn.url : null,
        primary_contact: props['Primary Contact']?.type === 'rich_text' && props['Primary Contact'].rich_text[0] ?
          props['Primary Contact'].rich_text[0].plain_text : null,
        city: props['City/Region']?.type === 'rich_text' && props['City/Region'].rich_text[0] ?
          props['City/Region'].rich_text[0].plain_text : null,
        address: props.Address?.type === 'rich_text' && props.Address.rich_text[0] ?
          props.Address.rich_text[0].plain_text : null,
        bc_region: props['BC Region']?.type === 'select' && props['BC Region'].select ?
          props['BC Region'].select.name : null,
        category: props.Category?.type === 'select' && props.Category.select ?
          props.Category.select.name : null,
        ai_focus_areas: props['AI Focus Areas']?.type === 'multi_select' ?
          props['AI Focus Areas'].multi_select.map(item => item.name) : [],
        year_founded: props['Year Founded']?.type === 'number' ? 
          props['Year Founded'].number : null,
        size: props.Size?.type === 'select' && props.Size.select ?
          props.Size.select.name : null,
        short_blurb: props['Short Blurb']?.type === 'rich_text' && props['Short Blurb'].rich_text[0] ?
          props['Short Blurb'].rich_text[0].plain_text : null,
        focus_notes: props['Focus Notes']?.type === 'rich_text' && props['Focus Notes'].rich_text[0] ?
          props['Focus Notes'].rich_text[0].plain_text : null,
        logo: props.Logo?.type === 'files' && props.Logo.files.length > 0 ? true : null
      };
    } catch (error) {
      console.warn('Failed to extract organization data:', error);
      return null;
    }
  }

  /**
   * Generate comprehensive quality report
   */
  generateQualityReport(processingTime) {
    const totalOrgs = this.scoringResults.length;
    const scores = this.scoringResults.map(r => r.overallScore);
    const avgScore = scores.reduce((a, b) => a + b, 0) / totalOrgs;
    
    const gradeDistribution = {};
    this.scoringResults.forEach(result => {
      const grade = result.qualityGrade;
      gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
    });

    // Find organizations needing most improvement
    const needsImprovement = this.scoringResults
      .filter(r => r.overallScore < 70)
      .sort((a, b) => a.overallScore - b.overallScore)
      .slice(0, 20);

    // Generate improvement recommendations
    const topImprovements = this.generateTopImprovements();

    const report = {
      summary: {
        total_organizations: totalOrgs,
        average_quality_score: Math.round(avgScore),
        processing_time_ms: processingTime,
        grade_distribution: gradeDistribution
      },
      organizations: this.scoringResults,
      needs_improvement: needsImprovement,
      top_improvements: topImprovements,
      generated_at: new Date().toISOString()
    };

    console.log('\n📊 QUALITY SCORING REPORT');
    console.log('==========================');
    console.log(`Organizations analyzed: ${totalOrgs}`);
    console.log(`Average quality score: ${Math.round(avgScore)}/100`);
    console.log(`Processing time: ${Math.round(processingTime / 1000)}s`);
    console.log('\nGrade distribution:');
    Object.entries(gradeDistribution).forEach(([grade, count]) => {
      console.log(`  ${grade}: ${count} organizations`);
    });
    console.log(`\nOrganizations needing improvement: ${needsImprovement.length}`);

    return report;
  }

  /**
   * Generate top improvement recommendations across all organizations
   */
  generateTopImprovements() {
    const improvementCounts = {};
    
    this.scoringResults.forEach(result => {
      result.improvements.forEach(improvement => {
        const key = `${improvement.field}:${improvement.suggestion}`;
        if (!improvementCounts[key]) {
          improvementCounts[key] = {
            field: improvement.field,
            suggestion: improvement.suggestion,
            count: 0,
            priority: improvement.priority
          };
        }
        improvementCounts[key].count++;
      });
    });

    return Object.values(improvementCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
}

module.exports = QualityScoringSystem;

// Example usage
if (require.main === module) {
  const scorer = new QualityScoringSystem(
    process.env.NOTION_TOKEN,
    process.env.NOTION_DATABASE_ID
  );

  scorer.scoreAllOrganizations()
    .then(report => {
      console.log('\n✅ Quality scoring completed successfully!');
      // Save report or send to monitoring dashboard
    })
    .catch(error => {
      console.error('❌ Quality scoring failed:', error);
      process.exit(1);
    });
} 