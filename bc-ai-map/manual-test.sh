#!/bin/bash
# Manual Testing Script for BC AI Ecosystem Agent Submission API
# Usage: ./manual-test.sh

BASE_URL="http://localhost:3001"

echo "🧪 BC AI Ecosystem Agent Submission API - Manual Test Suite"
echo "==============================================================="

echo ""
echo "1️⃣ Health Check Test:"
echo "   GET $BASE_URL/api/agents/submit"
curl -s "$BASE_URL/api/agents/submit" | jq .

echo ""
echo "2️⃣ Authentication Test (should fail):"
echo "   POST with invalid API key"
curl -s -X POST "$BASE_URL/api/agents/submit" \
  -H "Content-Type: application/json" \
  -H "X-Agent-API-Key: invalid_key" \
  -d '{"test": "data"}' | jq .

echo ""
echo "3️⃣ Valid BC AI Startup Submission:"
echo "   POST with proper Vancouver startup data"

# Create valid test data
cat > /tmp/test_submission.json << 'EOF'
{
  "submission": {
    "agent_id": "agent_demo_001",
    "agent_version": "1.0.0",
    "submission_timestamp": "2025-01-28T20:00:00Z",
    "confidence_score": 92,
    "data_sources": [
      "https://richmondai.com/about",
      "https://linkedin.com/company/richmond-ai"
    ],
    "processing_time_ms": 2100
  },
  "organization": {
    "name": "Richmond AI Solutions",
    "website": "https://richmondai.com",
    "location": {
      "city": "Richmond",
      "province": "British Columbia",
      "country": "Canada",
      "coordinates": {
        "lat": 49.1666,
        "lng": -123.1336,
        "source": "geocoded"
      }
    },
    "classification": {
      "category": "Start-ups & Scale-ups",
      "ai_focus_areas": ["NLP/LLMs", "Data Science"],
      "size": "Startup (1-50)",
      "year_founded": 2023
    },
    "contact": {
      "email": "hello@richmondai.com",
      "linkedin": "https://linkedin.com/company/richmond-ai"
    }
  },
  "research": {
    "methodology": "Automated web scraping + manual verification",
    "verification_level": "high",
    "last_verified": "2025-01-28T20:00:00Z",
    "notes": "Verified through website, LinkedIn, and public databases"
  }
}
EOF

curl -s -X POST "$BASE_URL/api/agents/submit" \
  -H "Content-Type: application/json" \
  -H "X-Agent-API-Key: agent_demo_001" \
  -d @/tmp/test_submission.json | jq .

echo ""
echo "4️⃣ Invalid Data Test (should show validation errors):"
echo "   POST with invalid organization data"

cat > /tmp/invalid_submission.json << 'EOF'
{
  "submission": {
    "agent_id": "agent_demo_001",
    "confidence_score": 150,
    "data_sources": []
  },
  "organization": {
    "name": "X",
    "website": "not-a-url",
    "location": {
      "coordinates": {
        "lat": 0,
        "lng": 0,
        "source": "manual"
      }
    }
  },
  "research": {
    "methodology": "Basic search",
    "verification_level": "low",
    "last_verified": "2025-01-28T20:00:00Z"
  }
}
EOF

curl -s -X POST "$BASE_URL/api/agents/submit" \
  -H "Content-Type: application/json" \
  -H "X-Agent-API-Key: agent_demo_001" \
  -d @/tmp/invalid_submission.json | jq .

echo ""
echo "🎉 Manual testing complete!"
echo ""
echo "💡 You can also:"
echo "   • Visit the web app: $BASE_URL"
echo "   • View API docs: $BASE_URL/api/agents/submit (GET)"
echo "   • Test with Postman/Insomnia using the JSON examples above"
echo ""
echo "🚀 Ready for your research agents to submit data!"

# Cleanup
rm -f /tmp/test_submission.json /tmp/invalid_submission.json 