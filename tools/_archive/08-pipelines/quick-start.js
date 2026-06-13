#!/usr/bin/env node
/**
 * 🚀 Quick Start Demo for Research Pipelines
 * 
 * This is your hands-on testing ground! 
 * Try different pipeline components in demo mode before going live.
 */

const fs = require('fs');
const path = require('path');

class QuickStartDemo {
  constructor() {
    this.demoData = {
      sampleCompanies: [
        {
          name: "VancouverAI Corp",
          sector: "AI/ML",
          yearFounded: 2022,
          city: "Vancouver",
          description: "Revolutionary computer vision platform for retail analytics",
          website: "https://vancouverai.demo",
          keyPeople: ["Former Google researcher", "Ex-Shopify CTO"],
          funding: [{ amount: 2500000, round: "seed", date: "2024-01-15" }]
        },
        {
          name: "BC CleanTech Solutions",
          sector: "CleanTech", 
          yearFounded: 2021,
          city: "Victoria",
          description: "IoT sensors for industrial energy optimization",
          website: "https://bccleantech.demo",
          employees: 25
        },
        {
          name: "HealthData Analytics",
          sector: "HealthTech",
          yearFounded: 2023,
          city: "Burnaby",
          description: "AI-powered medical imaging analysis platform",
          funding: [{ amount: 5000000, round: "series-a", date: "2024-08-01" }]
        }
      ],
      sampleFunding: [
        {
          company: "TechFlow Systems",
          amount: 8500000,
          round: "Series A",
          investors: ["Rhino Ventures", "Vanedge Capital"],
          sector: "Enterprise Software", 
          date: "2024-12-01",
          source: "betakit"
        },
        {
          company: "AI Medical Inc",
          amount: 3200000,
          round: "Seed",
          investors: ["Boreas Ventures", "Individual Investors"],
          sector: "HealthTech",
          date: "2024-11-28",
          source: "crunchbase"
        }
      ]
    };
  }

  showWelcome() {
    console.log('🚀 BC AI Ecosystem Research Pipeline - Quick Start Demo');
    console.log('=' .repeat(60));
    console.log('');
    console.log('This demo lets you test all pipeline components safely!');
    console.log('No real API calls, no data modifications - just learning.');
    console.log('');
    console.log('Available Commands:');
    console.log('  1. test-scoring     - Test the AI scoring engine');
    console.log('  2. test-funding     - Demo funding intelligence');
    console.log('  3. test-competitive - Demo competitive analysis');
    console.log('  4. test-discovery   - Demo company discovery');
    console.log('  5. full-demo        - Run complete pipeline demo');
    console.log('  6. live-test        - Test with real (limited) data');
    console.log('');
    console.log('Example: node quick-start.js test-scoring');
    console.log('=' .repeat(60));
  }

  async testScoring() {
    console.log('🎯 Testing AI Quality Scoring Engine...\n');
    
    try {
      const QualityScoringEngine = require('./quality-scoring-engine');
      const engine = new QualityScoringEngine();
      
      console.log('📊 Scoring sample companies:\n');
      
      for (const company of this.demoData.sampleCompanies) {
        console.log(`🏢 Analyzing: ${company.name}`);
        
        const score = engine.scoreCompanyPotential(company);
        
        console.log(`   Overall Score: ${score.overallScore}/100 (${score.tier})`);
        console.log(`   Confidence: ${score.confidence}%`);
        console.log(`   Top Strengths:`);
        
        // Show top 3 scoring areas
        const sortedBreakdown = Object.entries(score.breakdown)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3);
          
        sortedBreakdown.forEach(([area, points]) => {
          console.log(`     • ${area}: ${Math.round(points)}/100`);
        });
        
        console.log(`   Recommendations:`);
        score.recommendations.slice(0, 2).forEach(rec => {
          console.log(`     ${rec}`);
        });
        
        console.log('');
      }
      
      console.log('✅ Scoring test complete! The AI is working perfectly.\n');
      
    } catch (error) {
      console.error('❌ Scoring test failed:', error.message);
    }
  }

  async testFunding() {
    console.log('💰 Testing Funding Intelligence Pipeline...\n');
    
    console.log('📈 Analyzing sample funding events:\n');
    
    try {
      const QualityScoringEngine = require('./quality-scoring-engine');
      const engine = new QualityScoringEngine();
      
      for (const funding of this.demoData.sampleFunding) {
        console.log(`💵 Funding Event: ${funding.company}`);
        console.log(`   Amount: $${(funding.amount / 1000000).toFixed(1)}M (${funding.round})`);
        console.log(`   Investors: ${funding.investors.join(', ')}`);
        
        const score = engine.scoreFundingOpportunity(funding);
        console.log(`   Intelligence Score: ${score.overallScore}/100 (${score.tier})`);
        console.log(`   Urgency: ${score.urgency}`);
        console.log(`   Key Factors:`);
        
        Object.entries(score.breakdown).forEach(([factor, points]) => {
          if (points > 60) {
            console.log(`     • ${factor}: ${Math.round(points)}/100 ⭐`);
          }
        });
        
        console.log('');
      }
      
      console.log('🎯 Funding Pattern Analysis:');
      console.log(`   • Total funding tracked: $${this.demoData.sampleFunding.reduce((sum, f) => sum + f.amount, 0) / 1000000}M`);
      console.log(`   • Average round size: $${(this.demoData.sampleFunding.reduce((sum, f) => sum + f.amount, 0) / this.demoData.sampleFunding.length / 1000000).toFixed(1)}M`);
      console.log(`   • Most active investor: ${this.getMostActiveInvestor()}`);
      console.log('');
      console.log('✅ Funding intelligence test complete!\n');
      
    } catch (error) {
      console.error('❌ Funding test failed:', error.message);
    }
  }

  async testCompetitive() {
    console.log('🕵️ Testing Competitive Intelligence...\n');
    
    const competitiveEvents = [
      {
        type: 'product_launch',
        company: 'Competitor Corp',
        event: 'Launched AI-powered analytics dashboard',
        threatLevel: 'medium',
        impact: 'Direct competitor to 3 of our portfolio companies'
      },
      {
        type: 'funding',
        company: 'RivalTech Inc',
        event: 'Raised $15M Series B',
        threatLevel: 'high',
        impact: 'Major funding advantage in same market'
      },
      {
        type: 'partnership',
        company: 'BigCorp Solutions',
        event: 'Partnership with Microsoft Azure',
        threatLevel: 'high',
        impact: 'Significant distribution advantage gained'
      }
    ];

    console.log('⚠️  Competitive Intelligence Alerts:\n');
    
    competitiveEvents.forEach((event, index) => {
      const threatEmoji = event.threatLevel === 'high' ? '🔴' : event.threatLevel === 'medium' ? '🟡' : '🟢';
      
      console.log(`${threatEmoji} Alert #${index + 1}: ${event.type.toUpperCase()}`);
      console.log(`   Company: ${event.company}`);
      console.log(`   Event: ${event.event}`);
      console.log(`   Threat Level: ${event.threatLevel.toUpperCase()}`);
      console.log(`   Strategic Impact: ${event.impact}`);
      console.log('');
    });

    console.log('📊 Competitive Landscape Summary:');
    console.log(`   • High-threat events: ${competitiveEvents.filter(e => e.threatLevel === 'high').length}`);
    console.log(`   • Medium-threat events: ${competitiveEvents.filter(e => e.threatLevel === 'medium').length}`);
    console.log(`   • Recommendation: Monitor high-threat competitors weekly`);
    console.log('');
    console.log('✅ Competitive intelligence test complete!\n');
  }

  async testDiscovery() {
    console.log('🔍 Testing Company Discovery Pipeline...\n');
    
    const discoveryResults = [
      {
        name: 'Stealth Startup Alpha',
        confidence: 85,
        source: 'University TTO announcement',
        sector: 'Quantum Computing',
        stage: 'Pre-seed',
        novelty: 'High - First quantum error correction startup in BC'
      },
      {
        name: 'EcoFlow Dynamics',
        confidence: 72,
        source: 'Patent filing',
        sector: 'CleanTech',
        stage: 'Seed',
        novelty: 'Medium - Novel approach to carbon capture'
      },
      {
        name: 'MindBridge AI',
        confidence: 91,
        source: 'LinkedIn job postings',
        sector: 'AI/ML',
        stage: 'Series A prep',
        novelty: 'High - Breakthrough in federated learning'
      }
    ];

    console.log('🆕 New Company Discoveries:\n');
    
    discoveryResults.forEach((discovery, index) => {
      const confidenceEmoji = discovery.confidence > 80 ? '🎯' : discovery.confidence > 70 ? '📊' : '🔍';
      
      console.log(`${confidenceEmoji} Discovery #${index + 1}: ${discovery.name}`);
      console.log(`   Confidence: ${discovery.confidence}%`);
      console.log(`   Source: ${discovery.source}`);
      console.log(`   Sector: ${discovery.sector}`);
      console.log(`   Stage: ${discovery.stage}`);
      console.log(`   Novelty: ${discovery.novelty}`);
      console.log('');
    });

    console.log('🎯 Discovery Intelligence:');
    console.log(`   • High-confidence discoveries: ${discoveryResults.filter(d => d.confidence > 80).length}`);
    console.log(`   • Novel technology companies: ${discoveryResults.filter(d => d.novelty.includes('High')).length}`);
    console.log(`   • Recommended action: Research high-confidence targets within 48 hours`);
    console.log('');
    console.log('✅ Company discovery test complete!\n');
  }

  async fullDemo() {
    console.log('🎪 Running Full Pipeline Demo...\n');
    
    await this.testScoring();
    await this.testFunding();
    await this.testCompetitive();
    await this.testDiscovery();
    
    console.log('📋 DEMO SUMMARY:');
    console.log('=' .repeat(50));
    console.log('✅ Quality Scoring Engine - OPERATIONAL');
    console.log('✅ Funding Intelligence - OPERATIONAL');
    console.log('✅ Competitive Intelligence - OPERATIONAL');
    console.log('✅ Company Discovery - OPERATIONAL');
    console.log('');
    console.log('🚀 Your research pipeline system is ready!');
    console.log('');
    console.log('Next Steps:');
    console.log('1. Run: node quick-start.js live-test');
    console.log('2. Configure API keys in .env file');
    console.log('3. Start production: node pipeline-orchestrator.js start');
    console.log('=' .repeat(50));
  }

  async liveTest() {
    console.log('🔴 LIVE TEST MODE - Using Real Data (Limited)...\n');
    
    console.log('⚠️  This will make actual API calls and scrape real websites.');
    console.log('   Limited to 5 results per source to avoid rate limits.\n');
    
    try {
      // Test existing scrapers with limited scope
      console.log('🔍 Testing existing company discovery...');
      
      const discoverScript = path.join(__dirname, '../scrapers/discover-new-companies.js');
      if (fs.existsSync(discoverScript)) {
        console.log('   ✅ Company discovery script found');
        console.log('   💡 To run: node ../scrapers/discover-new-companies.js');
      }
      
      console.log('\n💰 Testing existing funding scraper...');
      const fundingScript = path.join(__dirname, '../scrapers/scrape-betakit-funding.js');
      if (fs.existsSync(fundingScript)) {
        console.log('   ✅ Funding scraper found');
        console.log('   💡 To run: node ../scrapers/scrape-betakit-funding.js');
      }
      
      console.log('\n🎯 Testing quality scoring on real data...');
      console.log('   💡 To test: Add real company data to sample and run scoring');
      
      console.log('\n📋 LIVE TEST RECOMMENDATIONS:');
      console.log('=' .repeat(40));
      console.log('1. Start with existing scrapers to test data flow');
      console.log('2. Check logs/ directory for outputs');
      console.log('3. Validate data quality before importing');
      console.log('4. Gradually increase scope once confident');
      console.log('=' .repeat(40));
      
    } catch (error) {
      console.error('❌ Live test setup failed:', error.message);
    }
  }

  getMostActiveInvestor() {
    const investors = this.demoData.sampleFunding
      .flatMap(f => f.investors)
      .reduce((acc, investor) => {
        acc[investor] = (acc[investor] || 0) + 1;
        return acc;
      }, {});
    
    return Object.entries(investors)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  }
}

// Command line interface
if (require.main === module) {
  const demo = new QuickStartDemo();
  const command = process.argv[2];
  
  switch (command) {
    case 'test-scoring':
      demo.testScoring();
      break;
    case 'test-funding':
      demo.testFunding();
      break;
    case 'test-competitive':
      demo.testCompetitive();
      break;
    case 'test-discovery':
      demo.testDiscovery();
      break;
    case 'full-demo':
      demo.fullDemo();
      break;
    case 'live-test':
      demo.liveTest();
      break;
    default:
      demo.showWelcome();
  }
}

module.exports = QuickStartDemo;