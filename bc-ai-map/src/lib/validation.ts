// Validation Middleware for Research Agent Submissions
// Implements multi-stage validation pipeline from Phase 2 specifications

import { AgentSubmission, ValidationResults, ValidationError, ValidationWarning, ImprovementSuggestion } from '@/types/agent-submission';

export class AgentSubmissionValidator {
  private static readonly BC_COORDINATES = {
    minLat: 48.0,
    maxLat: 60.0,
    minLng: -139.0,
    maxLng: -114.0
  };

  private static readonly BLACKLISTED_WORDS = ['test', 'example', 'unknown', 'sample'];
  private static readonly CURRENT_YEAR = new Date().getFullYear();

  /**
   * Main validation pipeline - implements 3-stage validation from specifications
   */
  public static async validateSubmission(submission: AgentSubmission): Promise<ValidationResults> {
    const startTime = performance.now();
    const results: ValidationResults = {
      overall_score: 0,
      field_scores: {},
      errors: [],
      warnings: [],
      suggestions: [],
      processing_time_ms: 0,
      validation_stage: 'schema'
    };

    try {
      // Stage 1: Schema Validation (fail fast)
      const schemaResults = await this.validateSchema(submission);
      if (schemaResults.errors) results.errors.push(...schemaResults.errors);
      if (schemaResults.warnings) results.warnings.push(...schemaResults.warnings);
      if (schemaResults.field_scores) results.field_scores = { ...results.field_scores, ...schemaResults.field_scores };

      if (results.errors.length > 0) {
        results.validation_stage = 'schema';
        results.overall_score = this.calculateOverallScore(results);
        results.processing_time_ms = performance.now() - startTime;
        return results;
      }

      results.validation_stage = 'business_logic';

      // Stage 2: Business Logic Validation (collect all errors)
      const businessResults = await this.validateBusinessLogic(submission);
      if (businessResults.errors) results.errors.push(...businessResults.errors);
      if (businessResults.warnings) results.warnings.push(...businessResults.warnings);
      if (businessResults.suggestions) results.suggestions.push(...businessResults.suggestions);
      if (businessResults.field_scores) results.field_scores = { ...results.field_scores, ...businessResults.field_scores };

      results.validation_stage = 'external_verification';

      // Stage 3: External Verification (warn on failure, don't block)
      const externalResults = await this.validateExternal(submission);
      if (externalResults.warnings) results.warnings.push(...externalResults.warnings);
      if (externalResults.suggestions) results.suggestions.push(...externalResults.suggestions);
      if (externalResults.field_scores) results.field_scores = { ...results.field_scores, ...externalResults.field_scores };

      results.validation_stage = 'complete';
      results.overall_score = this.calculateOverallScore(results);
      results.processing_time_ms = performance.now() - startTime;

      return results;
    } catch (error) {
      results.errors.push({
        field: 'system',
        error_code: 'VALIDATION_SYSTEM_ERROR',
        message: `Validation system error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestion: 'Please try again or contact support if the issue persists'
      });
      results.processing_time_ms = performance.now() - startTime;
      return results;
    }
  }

  /**
   * Stage 1: Schema Validation
   */
  private static async validateSchema(submission: AgentSubmission): Promise<{ errors?: ValidationError[]; warnings?: ValidationWarning[]; field_scores?: Record<string, number> }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const field_scores: Record<string, number> = {};

    // Validate submission metadata
    if (!submission.submission?.agent_id?.trim()) {
      errors.push({
        field: 'submission.agent_id',
        error_code: 'REQUIRED_FIELD_MISSING',
        message: 'Agent ID is required',
        suggestion: 'Provide a unique identifier for your research agent'
      });
    }

    if (!submission.submission?.confidence_score || 
        submission.submission.confidence_score < 0 || 
        submission.submission.confidence_score > 100) {
      errors.push({
        field: 'submission.confidence_score',
        error_code: 'INVALID_RANGE',
        message: 'Confidence score must be between 0 and 100',
        suggestion: 'Provide a valid confidence score as an integer'
      });
    }

    // Validate organization name
    const orgName = submission.organization?.name?.trim();
    if (!orgName) {
      errors.push({
        field: 'organization.name',
        error_code: 'REQUIRED_FIELD_MISSING',
        message: 'Organization name is required',
        suggestion: 'Provide the official name of the organization'
      });
    } else {
      if (orgName.length < 2 || orgName.length > 255) {
        errors.push({
          field: 'organization.name',
          error_code: 'INVALID_LENGTH',
          message: 'Organization name must be between 2 and 255 characters',
          suggestion: 'Use the complete but concise organization name'
        });
      }

      if (this.BLACKLISTED_WORDS.some(word => orgName.toLowerCase().includes(word.toLowerCase()))) {
        errors.push({
          field: 'organization.name',
          error_code: 'BLACKLISTED_CONTENT',
          message: 'Organization name contains test or placeholder content',
          suggestion: 'Provide the real organization name'
        });
      }

      field_scores['organization.name'] = orgName.length >= 2 && orgName.length <= 255 ? 100 : 0;
    }

    // Validate website URL format
    if (submission.organization?.website) {
      const website = submission.organization.website.trim();
      if (!this.isValidUrl(website)) {
        errors.push({
          field: 'organization.website',
          error_code: 'INVALID_URL_FORMAT',
          message: 'Website URL format is invalid',
          suggestion: 'Ensure URL includes protocol (https://) and valid domain'
        });
      } else {
        field_scores['organization.website'] = 100;
      }
    }

    // Validate coordinates if provided
    if (submission.organization?.location?.coordinates) {
      const { lat, lng } = submission.organization.location.coordinates;
      const inBC = lat >= this.BC_COORDINATES.minLat && 
                   lat <= this.BC_COORDINATES.maxLat &&
                   lng >= this.BC_COORDINATES.minLng && 
                   lng <= this.BC_COORDINATES.maxLng;

      if (!inBC) {
        warnings.push({
          field: 'organization.location.coordinates',
          warning_code: 'COORDINATES_OUTSIDE_BC',
          message: 'Coordinates appear to be outside British Columbia',
          impact: 'high'
        });
        field_scores['coordinates'] = 30; // Lower score but not blocking
      } else {
        field_scores['coordinates'] = 100;
      }
    }

    // Validate year founded
    if (submission.organization?.classification?.year_founded) {
      const year = submission.organization.classification.year_founded;
      if (year < 1800 || year > this.CURRENT_YEAR) {
        errors.push({
          field: 'organization.classification.year_founded',
          error_code: 'INVALID_YEAR_RANGE',
          message: `Year founded must be between 1800 and ${this.CURRENT_YEAR}`,
          suggestion: 'Verify the founding year is accurate and realistic'
        });
      } else {
        field_scores['year_founded'] = 100;
      }
    }

    return { errors, warnings, field_scores };
  }

  /**
   * Stage 2: Business Logic Validation
   */
  private static async validateBusinessLogic(submission: AgentSubmission): Promise<{ errors?: ValidationError[]; warnings?: ValidationWarning[]; suggestions?: ImprovementSuggestion[]; field_scores?: Record<string, number> }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ImprovementSuggestion[] = [];
    const field_scores: Record<string, number> = {};

    // BC location requirement
    const hasCanadianProvince = submission.organization?.location?.province?.toLowerCase().includes('british columbia') ||
                               submission.organization?.location?.province?.toLowerCase().includes('bc');
    const hasBCCity = submission.organization?.location?.city && this.isBCCity(submission.organization.location.city);
    
    if (!hasCanadianProvince && !hasBCCity) {
      warnings.push({
        field: 'organization.location',
        warning_code: 'BC_LOCATION_UNCERTAIN',
        message: 'Cannot confirm this organization is located in British Columbia',
        impact: 'high'
      });
    }

    // AI focus requirement
    if (!submission.organization?.classification?.ai_focus_areas || 
        submission.organization.classification.ai_focus_areas.length === 0) {
      suggestions.push({
        field: 'organization.classification.ai_focus_areas',
        suggestion: 'Add AI focus areas to better categorize this organization',
        expected_improvement: 'Improved discoverability and ecosystem insights'
      });
      field_scores['ai_focus_areas'] = 20;
    } else {
      field_scores['ai_focus_areas'] = 100;
    }

    // Email domain validation
    if (submission.organization?.contact?.email && submission.organization?.website) {
      const emailDomain = this.extractDomain(submission.organization.contact.email);
      const websiteDomain = this.extractDomain(submission.organization.website);
      
      if (emailDomain && websiteDomain && emailDomain !== websiteDomain) {
        const commonProviders = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com'];
        if (!commonProviders.includes(emailDomain.toLowerCase())) {
          warnings.push({
            field: 'organization.contact.email',
            warning_code: 'EMAIL_DOMAIN_MISMATCH',
            message: 'Email domain does not match website domain',
            impact: 'medium'
          });
        }
      }
    }

    // Data source quality assessment
    if (submission.submission?.data_sources?.length === 0) {
      warnings.push({
        field: 'submission.data_sources',
        warning_code: 'NO_DATA_SOURCES',
        message: 'No data sources provided for verification',
        impact: 'high'
      });
    } else if (submission.submission?.data_sources?.length < 2) {
      suggestions.push({
        field: 'submission.data_sources',
        suggestion: 'Provide multiple data sources to improve verification confidence',
        expected_improvement: 'Higher data quality score and faster approval'
      });
    }

    return { errors, warnings, suggestions, field_scores };
  }

  /**
   * Stage 3: External Verification (async, non-blocking)
   */
  private static async validateExternal(submission: AgentSubmission): Promise<{ warnings?: ValidationWarning[]; suggestions?: ImprovementSuggestion[]; field_scores?: Record<string, number> }> {
    const warnings: ValidationWarning[] = [];
    const suggestions: ImprovementSuggestion[] = [];
    const field_scores: Record<string, number> = {};

    // Note: In a full implementation, these would be actual async calls
    // For now, we'll simulate the validation logic

    // Website accessibility check
    if (submission.organization?.website) {
      // Simulated check - in production would use actual HTTP request
      const isAccessible = await this.checkWebsiteAccessibility(submission.organization.website);
      if (!isAccessible) {
        warnings.push({
          field: 'organization.website',
          warning_code: 'WEBSITE_INACCESSIBLE',
          message: 'Website appears to be inaccessible or temporarily down',
          impact: 'medium'
        });
        field_scores['website_accessibility'] = 30;
      } else {
        field_scores['website_accessibility'] = 100;
      }
    }

    // LinkedIn profile validation
    if (submission.organization?.contact?.linkedin) {
      // Simulated validation
      const linkedinValid = this.isValidLinkedInUrl(submission.organization.contact.linkedin);
      if (!linkedinValid) {
        warnings.push({
          field: 'organization.contact.linkedin',
          warning_code: 'INVALID_LINKEDIN_URL',
          message: 'LinkedIn URL format appears invalid',
          impact: 'low'
        });
      }
    }

    // Geocoding verification
    if (submission.organization?.location?.address && !submission.organization?.location?.coordinates) {
      suggestions.push({
        field: 'organization.location.coordinates',
        suggestion: 'Add coordinates for more precise mapping',
        expected_improvement: 'Better map visualization and location accuracy',
        data_sources: ['Google Maps Geocoding API', 'MapBox Geocoding']
      });
    }

    return { warnings, suggestions, field_scores };
  }

  /**
   * Calculate overall validation score
   */
  private static calculateOverallScore(results: ValidationResults): number {
    if (results.errors.length > 0) {
      return Math.max(0, 30 - (results.errors.length * 10)); // Severe penalty for errors
    }

    const fieldScores = Object.values(results.field_scores);
    if (fieldScores.length === 0) return 50; // Default score

    const average = fieldScores.reduce((sum, score) => sum + score, 0) / fieldScores.length;
    const warningPenalty = results.warnings.length * 5;
    
    return Math.max(0, Math.min(100, average - warningPenalty));
  }

  // Utility methods
  private static isValidUrl(urlString: string): boolean {
    try {
      const url = new URL(urlString);
      return ['http:', 'https:'].includes(url.protocol);
    } catch {
      return false;
    }
  }

  private static isValidLinkedInUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === 'linkedin.com' || urlObj.hostname === 'www.linkedin.com';
    } catch {
      return false;
    }
  }

  private static extractDomain(urlOrEmail: string): string | null {
    try {
      if (urlOrEmail.includes('@')) {
        return urlOrEmail.split('@')[1]?.toLowerCase() || null;
      } else {
        const url = new URL(urlOrEmail.startsWith('http') ? urlOrEmail : `https://${urlOrEmail}`);
        return url.hostname.replace('www.', '').toLowerCase();
      }
    } catch {
      return null;
    }
  }

  private static isBCCity(city: string): boolean {
    const bcCities = [
      'vancouver', 'burnaby', 'richmond', 'surrey', 'langley', 'north vancouver',
      'west vancouver', 'coquitlam', 'port coquitlam', 'new westminster',
      'victoria', 'saanich', 'esquimalt', 'oak bay', 'sidney',
      'kelowna', 'kamloops', 'prince george', 'nanaimo', 'vernon',
      'penticton', 'chilliwack', 'abbotsford', 'mission', 'maple ridge'
    ];
    return bcCities.includes(city.toLowerCase().trim());
  }

  private static async checkWebsiteAccessibility(url: string): Promise<boolean> {
    // Simulated check - in production would make actual HTTP request with timeout
    // This is a placeholder for the actual implementation
    try {
      // In real implementation:
      // const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
      // return response.ok;
      return Math.random() > 0.1; // 90% success rate simulation
    } catch {
      return false;
    }
  }
} 