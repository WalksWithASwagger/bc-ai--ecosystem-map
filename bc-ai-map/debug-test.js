// Detailed Debug Test for Agent Submission API
const BASE_URL = 'http://localhost:3001';

const testSubmission = {
  submission: {
    agent_id: 'agent_demo_001',
    agent_version: '1.0.0',
    submission_timestamp: new Date().toISOString(),
    confidence_score: 85,
    data_sources: [
      'https://example-company.com/about',
      'https://linkedin.com/company/example-company'
    ],
    processing_time_ms: 2500
  },
  organization: {
    name: 'Vancouver AI Startup',
    website: 'https://vancouverai.com',
    location: {
      city: 'Vancouver',
      province: 'British Columbia', 
      country: 'Canada',
      coordinates: {
        lat: 49.2827,
        lng: -123.1207,
        source: 'geocoded'
      }
    },
    classification: {
      category: 'Start-ups & Scale-ups',
      ai_focus_areas: ['NLP/LLMs', 'Computer Vision'],
      size: 'Startup (1-50)',
      year_founded: 2022
    }
  },
  research: {
    methodology: 'Automated web research and verification',
    verification_level: 'high',
    last_verified: new Date().toISOString(),
    notes: 'Verified through website and social media'
  }
};

async function debugTest() {
  console.log('🔍 Detailed Debug Test - Agent Submission API\n');

  try {
    const response = await fetch(`${BASE_URL}/api/agents/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-API-Key': 'agent_demo_001'
      },
      body: JSON.stringify(testSubmission)
    });

    const data = await response.json();
    
    console.log('📊 Response Details:');
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Submission ID: ${response.headers.get('X-Submission-ID')}`);
    console.log(`   Processing Time: ${response.headers.get('X-Processing-Time')}ms`);
    console.log(`   Data Quality Score: ${response.headers.get('X-Data-Quality-Score')}/100`);
    
    console.log('\n📋 Full Response Body:');
    console.log(JSON.stringify(data, null, 2));

    if (data.validation_errors) {
      console.log('\n❌ Detailed Validation Errors:');
      data.validation_errors.forEach((error, index) => {
        console.log(`\n${index + 1}. Field: ${error.field}`);
        console.log(`   Error Code: ${error.error_code}`);
        console.log(`   Message: ${error.message}`);
        if (error.suggestion) {
          console.log(`   💡 Suggestion: ${error.suggestion}`);
        }
      });
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

debugTest().catch(console.error); 