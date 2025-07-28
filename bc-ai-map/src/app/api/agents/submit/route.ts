// API Route for Research Agent Submissions
// Implements standardized submission API from Phase 2 specifications

import { NextRequest, NextResponse } from 'next/server';
import { AgentSubmission, AgentSubmissionResponse } from '@/types/agent-submission';
import { AgentSubmissionValidator } from '@/lib/validation';
import { headers } from 'next/headers';

// Rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Agent authentication store (in production, use database)
const authorizedAgents = new Map<string, { name: string; tier: 'basic' | 'premium'; created: Date }>([
  ['agent_demo_001', { name: 'Demo Research Agent', tier: 'basic', created: new Date() }],
  ['agent_demo_002', { name: 'Advanced Research Agent', tier: 'premium', created: new Date() }],
]);

interface RateLimitConfig {
  requests_per_minute: number;
  burst_capacity: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  basic: { requests_per_minute: 30, burst_capacity: 50 },
  premium: { requests_per_minute: 100, burst_capacity: 150 }
};

export async function POST(request: NextRequest) {
  const startTime = performance.now();

  try {
    // 1. Authentication
    const authResult = await authenticateAgent(request);
    if (!authResult.success) {
      return NextResponse.json(
        { 
          error: 'Authentication failed', 
          message: authResult.message,
          status: 'authentication_failed'
        },
        { status: 401 }
      );
    }

    const { agent_id, tier } = authResult;

    if (!agent_id || !tier) {
      return NextResponse.json(
        { 
          error: 'Authentication incomplete', 
          message: 'Missing agent credentials',
          status: 'authentication_failed'
        },
        { status: 401 }
      );
    }

    // 2. Rate Limiting
    const rateLimitResult = checkRateLimit(agent_id, tier);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Rate limit exceeded. Limit: ${rateLimitResult.limit} requests per minute`,
          retry_after: rateLimitResult.retry_after,
          status: 'rate_limited'
        },
        { status: 429 }
      );
    }

    // 3. Parse request body
    let submission: AgentSubmission;
    try {
      submission = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON',
          status: 'validation_failed'
        },
        { status: 400 }
      );
    }

    // 4. Validate submission structure
    if (!submission.submission?.agent_id || !submission.organization?.name) {
      return NextResponse.json(
        {
          error: 'Invalid submission format',
          message: 'Missing required fields: submission.agent_id and organization.name',
          status: 'validation_failed'
        },
        { status: 400 }
      );
    }

    // 5. Verify agent_id matches authentication
    if (submission.submission.agent_id !== agent_id) {
      return NextResponse.json(
        {
          error: 'Agent ID mismatch',
          message: 'Submission agent_id does not match authenticated agent',
          status: 'authentication_failed'
        },
        { status: 401 }
      );
    }

    // 6. Generate submission ID
    const submission_id = generateSubmissionId();

    // 7. Validate submission
    console.log(`[${submission_id}] Starting validation for agent ${agent_id}`);
    const validationResults = await AgentSubmissionValidator.validateSubmission(submission);

    // 8. Determine processing outcome
    const hasBlockingErrors = validationResults.errors.length > 0;
    const requiresManualReview = validationResults.overall_score < 70 || 
                                validationResults.warnings.some(w => w.impact === 'high');

    const response: AgentSubmissionResponse = {
      submission_id,
      status: hasBlockingErrors ? 'validation_failed' : 'accepted',
      data_quality_score: validationResults.overall_score,
      processing_eta: hasBlockingErrors ? undefined : (requiresManualReview ? 172800 : 3600), // 48h vs 1h
      conflict_resolution_required: false // Will be determined by duplicate detection
    };

    if (hasBlockingErrors) {
      response.validation_errors = validationResults.errors;
    }

    // 9. Log submission for processing (in production, queue for background processing)
    await logSubmissionForProcessing(submission_id, submission, validationResults, agent_id);

    // 10. Return response
    const processingTime = performance.now() - startTime;
    console.log(`[${submission_id}] Completed in ${processingTime.toFixed(2)}ms - Status: ${response.status}`);

    return NextResponse.json(response, { 
      status: hasBlockingErrors ? 400 : 202, // 202 Accepted for async processing
      headers: {
        'X-Submission-ID': submission_id,
        'X-Processing-Time': processingTime.toFixed(2),
        'X-Data-Quality-Score': validationResults.overall_score.toString()
      }
    });

  } catch (error) {
    console.error('Agent submission API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing the submission',
        status: 'system_error'
      },
      { status: 500 }
    );
  }
}

// Helper functions

async function authenticateAgent(request: NextRequest): Promise<{ success: boolean; message: string; agent_id?: string; tier?: string }> {
  const headersList = await headers();
  const apiKey = headersList.get('X-Agent-API-Key');

  if (!apiKey) {
    return { success: false, message: 'Missing X-Agent-API-Key header' };
  }

  // In production, this would verify against a secure database
  const agent = authorizedAgents.get(apiKey);
  if (!agent) {
    return { success: false, message: 'Invalid API key' };
  }

  return { 
    success: true, 
    message: 'Authentication successful',
    agent_id: apiKey,
    tier: agent.tier
  };
}

function checkRateLimit(agent_id: string, tier: string): { allowed: boolean; limit: number; retry_after?: number } {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const limits = RATE_LIMITS[tier] || RATE_LIMITS.basic;

  const existing = rateLimitStore.get(agent_id);
  
  if (!existing || now > existing.resetTime) {
    // Reset or initialize rate limit window
    rateLimitStore.set(agent_id, { count: 1, resetTime: now + windowMs });
    return { allowed: true, limit: limits.requests_per_minute };
  }

  if (existing.count >= limits.requests_per_minute) {
    const retry_after = Math.ceil((existing.resetTime - now) / 1000);
    return { 
      allowed: false, 
      limit: limits.requests_per_minute,
      retry_after
    };
  }

  // Increment count
  existing.count++;
  rateLimitStore.set(agent_id, existing);

  return { allowed: true, limit: limits.requests_per_minute };
}

function generateSubmissionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `sub_${timestamp}_${random}`;
}

async function logSubmissionForProcessing(
  submission_id: string, 
  submission: AgentSubmission, 
  validationResults: any,
  agent_id: string
): Promise<void> {
  // In production, this would:
  // 1. Store in database for audit trail
  // 2. Queue for background processing
  // 3. Trigger duplicate detection
  // 4. Initiate conflict resolution if needed
  
  console.log(`[${submission_id}] Logged submission from ${agent_id}:`, {
    organization_name: submission.organization.name,
    validation_score: validationResults.overall_score,
    errors_count: validationResults.errors.length,
    warnings_count: validationResults.warnings.length
  });

  // TODO: Implement actual persistence and queueing
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    service: 'BC AI Ecosystem - Agent Submission API',
    status: 'healthy',
    version: '1.0.0',
    endpoints: {
      submit: 'POST /api/agents/submit',
      health: 'GET /api/agents/submit'
    },
    rate_limits: RATE_LIMITS,
    timestamp: new Date().toISOString()
  });
} 