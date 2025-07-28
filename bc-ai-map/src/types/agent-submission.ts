// Agent Submission Types for Research Agent Integration
// Based on BC AI Ecosystem Atlas - Data Pipeline Automation Specifications

export interface AgentSubmission {
  // Metadata
  submission: {
    agent_id: string;              // Unique agent identifier
    agent_version: string;         // Agent software version
    submission_timestamp: string;  // ISO 8601 timestamp
    confidence_score: number;      // 0-100 confidence in data accuracy
    data_sources: string[];        // URLs or reference sources
    processing_time_ms: number;    // Time taken to research
  };
  
  // Organization data
  organization: {
    // Required fields
    name: string;
    website?: string;
    
    // Geographic information
    location: {
      city?: string;
      province?: string;
      country?: string;
      address?: string;
      coordinates?: {
        lat: number;
        lng: number;
        source: 'geocoded' | 'manual' | 'approximate';
      };
    };
    
    // Classification
    classification: {
      category?: OrganizationCategory;
      ai_focus_areas?: AIFocusArea[];
      size?: OrganizationSize;
      year_founded?: number;
    };
    
    // Contact information
    contact?: {
      email?: string;
      phone?: string;
      linkedin?: string;
      primary_contact?: string;
      key_people?: string[];
    };
    
    // Business information
    business?: {
      short_blurb?: string;
      notable_projects?: string;
      funding_info?: string;
      status?: 'active' | 'acquired' | 'ceased' | 'unknown';
    };
  };
  
  // Research metadata
  research: {
    methodology: string;           // How data was collected
    verification_level: 'high' | 'medium' | 'low';
    last_verified: string;         // ISO 8601 timestamp
    notes?: string;                // Additional research notes
  };
}

export interface AgentSubmissionResponse {
  submission_id: string;
  status: 'accepted' | 'validation_failed' | 'duplicate_detected';
  validation_errors?: ValidationError[];
  processing_eta?: number; // seconds
  conflict_resolution_required?: boolean;
  data_quality_score?: number;
}

export interface ValidationError {
  field: string;
  error_code: string;
  message: string;
  suggestion?: string;
}

export interface ValidationWarning {
  field: string;
  warning_code: string;
  message: string;
  impact: 'low' | 'medium' | 'high';
}

export interface ImprovementSuggestion {
  field: string;
  suggestion: string;
  expected_improvement: string;
  data_sources?: string[];
}

// Enum types for validation
export type OrganizationCategory = 
  | 'Grassroots Communities'
  | 'Academic & Research Labs'
  | 'Start-ups & Scale-ups'
  | 'Enterprise / Corporate Divisions'
  | 'Government & Crown Programs'
  | 'Indigenous Tech & Creative Orgs'
  | 'Social-Impact & Climate-Tech Hubs'
  | 'Investors & Funds'
  | 'Service Studios / Agencies'
  | 'Media & Storytellers'
  | 'Open-Source Projects'
  | 'Education & Training Providers'
  | 'Advocacy & Policy Groups';

export type OrganizationSize =
  | 'Startup (1-50)'
  | 'Scale-up (51-250)'
  | 'Enterprise (250+)'
  | 'Non-profit/Public';

export type AIFocusArea =
  | 'NLP/LLMs'
  | 'Computer Vision'
  | 'Robotics'
  | 'MLOps'
  | 'AI Ethics'
  | 'GenAI'
  | 'Data Science'
  | 'XR/Metaverse'
  | 'Healthcare AI'
  | 'Indigenous AI Applications'
  | 'CleanTech AI'
  | 'Film/VFX AI'
  | 'Resource Sector AI'
  | 'EdTech AI';

export type BCRegion = 
  | 'Lower Mainland'
  | 'Vancouver Island'
  | 'Interior'
  | 'Northern BC'
  | 'Other Regions';

// Validation pipeline results
export interface ValidationResults {
  overall_score: number; // 0-100
  field_scores: Record<string, number>;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ImprovementSuggestion[];
  processing_time_ms: number;
  validation_stage: 'schema' | 'business_logic' | 'external_verification' | 'complete';
} 