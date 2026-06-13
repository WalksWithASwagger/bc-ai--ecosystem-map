#!/usr/bin/env node
/**
 * 🎯 Quality Scoring & Prioritization Engine
 * 
 * Advanced AI-powered system that automatically scores and prioritizes:
 * - New company discoveries
 * - Funding opportunities
 * - Partnership prospects
 * - Market opportunities
 * - Data quality and reliability
 * 
 * This ensures your limited research time focuses on the highest-value targets.
 */

const fs = require('fs');
const path = require('path');

class QualityScoringEngine {
  constructor() {
    this.scoringModels = new Map();
    this.historicalData = new Map();
    this.setupScoringModels();
    this.loadHistoricalData();
  }

  setupScoringModels() {
    // Company Potential Scoring Model
    this.scoringModels.set('company_potential', {
      weights: {
        fundingHistory: 0.25,        // Has raised funding before
        teamQuality: 0.20,           // Experience of founding team
        marketSize: 0.15,            // Size of addressable market
        technologyNovelty: 0.15,     // Uniqueness of technology
        traction: 0.10,              // Revenue, users, partnerships
        timing: 0.10,                // Market timing and trends
        location: 0.05               // Geographic advantages
      },
      maxScore: 100
    });

    // Funding Opportunity Scoring Model
    this.scoringModels.set('funding_opportunity', {
      weights: {
        fundingAmount: 0.30,         // Size of funding round
        investorQuality: 0.25,       // Credibility of investors
        growthStage: 0.20,           // Stage of company growth
        sectorHotness: 0.15,         // How hot is the sector
        geographicRelevance: 0.10    // Relevance to BC ecosystem
      },
      maxScore: 100
    });

    // Data Quality Scoring Model
    this.scoringModels.set('data_quality', {
      weights: {
        sourceCredibility: 0.35,     // Reliability of data source
        dataCompleteness: 0.25,      // How complete is the data
        dataFreshness: 0.20,         // How recent is the data
        crossValidation: 0.15,       // Confirmed by multiple sources
        structuredData: 0.05         // Well-formatted data
      },
      maxScore: 100
    });

    // Market Opportunity Scoring Model
    this.scoringModels.set('market_opportunity', {
      weights: {
        marketGrowthRate: 0.30,      // How fast is market growing
        competitiveLandscape: 0.25,  // Level of competition
        barrierToEntry: 0.20,        // How hard to enter market
        regulatoryEnvironment: 0.15, // Regulatory support/barriers
        localAdvantage: 0.10         // BC-specific advantages
      },
      maxScore: 100
    });
  }

  loadHistoricalData() {
    const historyFile = path.join(__dirname, '../../data/scoring-history.json');
    if (fs.existsSync(historyFile)) {
      try {
        const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
        this.historicalData = new Map(Object.entries(history));
      } catch (error) {
        console.warn('Could not load historical scoring data:', error.message);
      }
    }
  }

  /**
   * 🏢 COMPANY POTENTIAL SCORING
   * Score new companies based on their potential for success
   */
  scoreCompanyPotential(company) {
    const model = this.scoringModels.get('company_potential');
    let totalScore = 0;
    const scoreBreakdown = {};

    // Funding History Score (0-100)
    const fundingScore = this.calculateFundingHistoryScore(company);
    scoreBreakdown.fundingHistory = fundingScore;
    totalScore += (fundingScore * model.weights.fundingHistory);

    // Team Quality Score (0-100) 
    const teamScore = this.calculateTeamQualityScore(company);
    scoreBreakdown.teamQuality = teamScore;
    totalScore += (teamScore * model.weights.teamQuality);

    // Market Size Score (0-100)
    const marketScore = this.calculateMarketSizeScore(company);
    scoreBreakdown.marketSize = marketScore;
    totalScore += (marketScore * model.weights.marketSize);

    // Technology Novelty Score (0-100)
    const techScore = this.calculateTechnologyNoveltyScore(company);
    scoreBreakdown.technologyNovelty = techScore;
    totalScore += (techScore * model.weights.technologyNovelty);

    // Traction Score (0-100)
    const tractionScore = this.calculateTractionScore(company);
    scoreBreakdown.traction = tractionScore;
    totalScore += (tractionScore * model.weights.traction);

    // Timing Score (0-100)
    const timingScore = this.calculateTimingScore(company);
    scoreBreakdown.timing = timingScore;
    totalScore += (timingScore * model.weights.timing);

    // Location Score (0-100)
    const locationScore = this.calculateLocationScore(company);
    scoreBreakdown.location = locationScore;
    totalScore += (locationScore * model.weights.location);

    return {
      overallScore: Math.round(totalScore),
      breakdown: scoreBreakdown,
      tier: this.assignTier(totalScore),
      confidence: this.calculateConfidence(company, scoreBreakdown),
      recommendations: this.generateRecommendations('company', totalScore, scoreBreakdown)
    };
  }

  calculateFundingHistoryScore(company) {
    let score = 0;
    
    if (company.funding && company.funding.length > 0) {
      // Has funding history
      score += 40;
      
      // Bonus for multiple rounds
      if (company.funding.length > 1) score += 20;
      
      // Bonus for large rounds
      const totalFunding = company.funding.reduce((sum, round) => sum + (round.amount || 0), 0);
      if (totalFunding > 1000000) score += 20;
      if (totalFunding > 10000000) score += 10;
      if (totalFunding > 50000000) score += 10;
      
    } else if (company.yearFounded && (new Date().getFullYear() - company.yearFounded) < 2) {
      // Early stage company - neutral score
      score = 30;
    } else {
      // No funding history for established company
      score = 10;
    }

    return Math.min(100, score);
  }

  calculateTeamQualityScore(company) {
    let score = 30; // Base score
    
    if (company.keyPeople && company.keyPeople.length > 0) {
      const keyPeopleText = company.keyPeople.join(' ').toLowerCase();
      
      // Experience indicators
      if (keyPeopleText.includes('ceo') || keyPeopleText.includes('founder')) score += 15;
      if (keyPeopleText.includes('cto') || keyPeopleText.includes('technical')) score += 15;
      if (keyPeopleText.includes('phd') || keyPeopleText.includes('professor')) score += 10;
      if (keyPeopleText.includes('former') || keyPeopleText.includes('ex-')) score += 15;
      
      // Company pedigree
      const prestigiousCompanies = ['google', 'microsoft', 'amazon', 'facebook', 'apple', 'uber', 'tesla'];
      if (prestigiousCompanies.some(company => keyPeopleText.includes(company))) {
        score += 20;
      }
    }
    
    return Math.min(100, score);
  }

  calculateMarketSizeScore(company) {
    const sectorScores = {
      'Enterprise Software': 90,
      'AI/ML': 95,
      'FinTech': 85,
      'HealthTech': 80,
      'CleanTech': 75,
      'EdTech': 70,
      'E-commerce': 65,
      'Gaming': 60,
      'Consumer Apps': 55
    };

    const sector = company.sector || company.category || 'Unknown';
    return sectorScores[sector] || 50;
  }

  calculateTechnologyNoveltyScore(company) {
    let score = 40; // Base score
    
    const description = (company.description || company.shortBlurb || '').toLowerCase();
    
    // Novel technology indicators
    const novelKeywords = [
      'patent', 'proprietary', 'breakthrough', 'first-of-its-kind',
      'revolutionary', 'cutting-edge', 'novel', 'innovative'
    ];
    
    const aiKeywords = [
      'artificial intelligence', 'machine learning', 'deep learning',
      'neural network', 'computer vision', 'nlp', 'generative ai'
    ];
    
    const emergingTechKeywords = [
      'blockchain', 'quantum', 'ar', 'vr', 'iot', 'edge computing',
      'robotics', 'autonomous', 'biotech', 'nanotech'
    ];

    // Score based on technology descriptions
    novelKeywords.forEach(keyword => {
      if (description.includes(keyword)) score += 8;
    });
    
    aiKeywords.forEach(keyword => {
      if (description.includes(keyword)) score += 5;
    });
    
    emergingTechKeywords.forEach(keyword => {
      if (description.includes(keyword)) score += 7;
    });

    return Math.min(100, score);
  }

  calculateTractionScore(company) {
    let score = 20; // Base score
    
    // Revenue indicators
    if (company.revenue) {
      if (company.revenue > 100000) score += 20;
      if (company.revenue > 1000000) score += 20;
      if (company.revenue > 10000000) score += 20;
    }
    
    // User/customer indicators
    if (company.customers || company.users) {
      const userCount = company.customers || company.users;
      if (userCount > 1000) score += 15;
      if (userCount > 10000) score += 15;
      if (userCount > 100000) score += 20;
    }
    
    // Partnership indicators
    if (company.partnerships && company.partnerships.length > 0) {
      score += 10 + (company.partnerships.length * 5);
    }
    
    // Website/online presence
    if (company.website) score += 10;
    if (company.linkedin) score += 5;
    
    return Math.min(100, score);
  }

  calculateTimingScore(company) {
    let score = 50; // Base score
    
    const currentYear = new Date().getFullYear();
    const foundingYear = company.yearFounded;
    
    if (foundingYear) {
      const age = currentYear - foundingYear;
      
      // Sweet spot for growth companies
      if (age >= 2 && age <= 7) {
        score += 30;
      } else if (age >= 1 && age <= 10) {
        score += 20;
      } else if (age < 1) {
        score += 10; // Very early
      }
    }
    
    // Market timing based on sector trends
    const hotSectors = ['AI/ML', 'CleanTech', 'HealthTech', 'FinTech'];
    const sector = company.sector || company.category;
    
    if (hotSectors.includes(sector)) {
      score += 20;
    }
    
    return Math.min(100, score);
  }

  calculateLocationScore(company) {
    let score = 40; // Base score for being in BC
    
    const location = (company.city || company.location || '').toLowerCase();
    
    // Location bonuses
    if (location.includes('vancouver')) score += 25;
    if (location.includes('victoria')) score += 20;
    if (location.includes('burnaby') || location.includes('richmond')) score += 15;
    if (location.includes('kelowna')) score += 10;
    
    // Proximity to tech hubs
    if (location.includes('downtown') || location.includes('gastown') || location.includes('yaletown')) {
      score += 15;
    }
    
    return Math.min(100, score);
  }

  /**
   * 💰 FUNDING OPPORTUNITY SCORING  
   * Score funding events for newsworthiness and strategic value
   */
  scoreFundingOpportunity(fundingEvent) {
    const model = this.scoringModels.get('funding_opportunity');
    let totalScore = 0;
    const scoreBreakdown = {};

    // Funding Amount Score
    const amountScore = this.calculateFundingAmountScore(fundingEvent);
    scoreBreakdown.fundingAmount = amountScore;
    totalScore += (amountScore * model.weights.fundingAmount);

    // Investor Quality Score
    const investorScore = this.calculateInvestorQualityScore(fundingEvent);
    scoreBreakdown.investorQuality = investorScore;
    totalScore += (investorScore * model.weights.investorQuality);

    // Growth Stage Score
    const stageScore = this.calculateGrowthStageScore(fundingEvent);
    scoreBreakdown.growthStage = stageScore;
    totalScore += (stageScore * model.weights.growthStage);

    // Sector Hotness Score
    const sectorScore = this.calculateSectorHotnessScore(fundingEvent);
    scoreBreakdown.sectorHotness = sectorScore;
    totalScore += (sectorScore * model.weights.sectorHotness);

    // Geographic Relevance Score
    const geoScore = this.calculateGeographicRelevanceScore(fundingEvent);
    scoreBreakdown.geographicRelevance = geoScore;
    totalScore += (geoScore * model.weights.geographicRelevance);

    return {
      overallScore: Math.round(totalScore),
      breakdown: scoreBreakdown,
      tier: this.assignTier(totalScore),
      urgency: this.calculateUrgency(fundingEvent),
      recommendations: this.generateRecommendations('funding', totalScore, scoreBreakdown)
    };
  }

  calculateFundingAmountScore(event) {
    const amount = event.amount || 0;
    
    if (amount >= 50000000) return 100;      // $50M+
    if (amount >= 20000000) return 90;       // $20M+
    if (amount >= 10000000) return 80;       // $10M+
    if (amount >= 5000000) return 70;        // $5M+
    if (amount >= 2000000) return 60;        // $2M+
    if (amount >= 1000000) return 50;        // $1M+
    if (amount >= 500000) return 40;         // $500K+
    if (amount >= 100000) return 30;         // $100K+
    return 20;
  }

  calculateInvestorQualityScore(event) {
    let score = 30; // Base score
    
    const investors = event.investors || [];
    const topTierVCs = [
      'sequoia', 'andreessen', 'kleiner perkins', 'accel', 'greylock',
      'benchmark', 'first round', 'union square ventures', 'spark capital'
    ];
    
    const bcVCs = [
      'rhino ventures', 'vanedge', 'yaletown', 'boreas', 'version one'
    ];

    investors.forEach(investor => {
      const lowerInvestor = investor.toLowerCase();
      
      if (topTierVCs.some(vc => lowerInvestor.includes(vc))) {
        score += 25; // Top tier VC
      } else if (bcVCs.some(vc => lowerInvestor.includes(vc))) {
        score += 20; // BC VC
      } else if (lowerInvestor.includes('ventures') || lowerInvestor.includes('capital')) {
        score += 10; // Generic VC
      }
    });

    return Math.min(100, score);
  }

  /**
   * 📊 DATA QUALITY SCORING
   * Score the reliability and completeness of collected data
   */
  scoreDataQuality(dataPoint) {
    const model = this.scoringModels.get('data_quality');
    let totalScore = 0;
    const scoreBreakdown = {};

    // Source Credibility Score
    const credibilityScore = this.calculateSourceCredibilityScore(dataPoint);
    scoreBreakdown.sourceCredibility = credibilityScore;
    totalScore += (credibilityScore * model.weights.sourceCredibility);

    // Data Completeness Score
    const completenessScore = this.calculateDataCompletenessScore(dataPoint);
    scoreBreakdown.dataCompleteness = completenessScore;
    totalScore += (completenessScore * model.weights.dataCompleteness);

    // Data Freshness Score
    const freshnessScore = this.calculateDataFreshnessScore(dataPoint);
    scoreBreakdown.dataFreshness = freshnessScore;
    totalScore += (freshnessScore * model.weights.dataFreshness);

    // Cross Validation Score
    const validationScore = this.calculateCrossValidationScore(dataPoint);
    scoreBreakdown.crossValidation = validationScore;
    totalScore += (validationScore * model.weights.crossValidation);

    // Structured Data Score
    const structureScore = this.calculateStructuredDataScore(dataPoint);
    scoreBreakdown.structuredData = structureScore;
    totalScore += (structureScore * model.weights.structuredData);

    return {
      overallScore: Math.round(totalScore),
      breakdown: scoreBreakdown,
      reliability: this.assignReliability(totalScore),
      recommendations: this.generateRecommendations('data_quality', totalScore, scoreBreakdown)
    };
  }

  calculateSourceCredibilityScore(dataPoint) {
    const source = (dataPoint.source || '').toLowerCase();
    
    const credibilityMap = {
      'crunchbase': 95,
      'government': 100,
      'linkedin': 85,
      'betakit': 90,
      'techcrunch': 88,
      'company website': 80,
      'wikipedia': 70,
      'blog': 60,
      'social media': 50,
      'unknown': 30
    };

    for (const [sourceType, score] of Object.entries(credibilityMap)) {
      if (source.includes(sourceType)) {
        return score;
      }
    }

    return credibilityMap.unknown;
  }

  calculateDataCompletenessScore(dataPoint) {
    const requiredFields = ['name', 'description', 'website', 'sector', 'location'];
    const optionalFields = ['funding', 'employees', 'yearFounded', 'keyPeople'];
    
    let completedRequired = 0;
    let completedOptional = 0;

    requiredFields.forEach(field => {
      if (dataPoint[field] && dataPoint[field] !== '') {
        completedRequired++;
      }
    });

    optionalFields.forEach(field => {
      if (dataPoint[field] && dataPoint[field] !== '') {
        completedOptional++;
      }
    });

    const requiredScore = (completedRequired / requiredFields.length) * 70;
    const optionalScore = (completedOptional / optionalFields.length) * 30;

    return Math.round(requiredScore + optionalScore);
  }

  calculateDataFreshnessScore(dataPoint) {
    const timestamp = dataPoint.timestamp || dataPoint.discoveredAt || new Date();
    const age = Date.now() - new Date(timestamp).getTime();
    const ageInHours = age / (1000 * 60 * 60);

    if (ageInHours <= 24) return 100;        // Less than 24 hours
    if (ageInHours <= 168) return 90;        // Less than 1 week
    if (ageInHours <= 720) return 80;        // Less than 1 month
    if (ageInHours <= 2160) return 60;       // Less than 3 months
    if (ageInHours <= 4320) return 40;       // Less than 6 months
    return 20;                               // Older than 6 months
  }

  /**
   * 🎯 PRIORITY QUEUE MANAGEMENT
   * Create prioritized queues for different types of opportunities
   */
  createPriorityQueues(scoredItems) {
    const queues = {
      urgent: [],           // Score 80-100
      high: [],            // Score 60-79
      medium: [],          // Score 40-59
      low: [],             // Score 20-39
      ignore: []           // Score 0-19
    };

    scoredItems.forEach(item => {
      const score = item.overallScore || 0;
      
      if (score >= 80) {
        queues.urgent.push(item);
      } else if (score >= 60) {
        queues.high.push(item);
      } else if (score >= 40) {
        queues.medium.push(item);
      } else if (score >= 20) {
        queues.low.push(item);
      } else {
        queues.ignore.push(item);
      }
    });

    // Sort each queue by score (highest first)
    Object.keys(queues).forEach(queue => {
      queues[queue].sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
    });

    return queues;
  }

  /**
   * 📋 STRATEGIC RECOMMENDATIONS
   * Generate actionable recommendations based on scores
   */
  generateRecommendations(type, score, breakdown) {
    const recommendations = [];

    if (type === 'company') {
      if (score >= 80) {
        recommendations.push('🔥 High-priority target for immediate research and outreach');
        recommendations.push('💼 Consider for strategic partnership or investment tracking');
      } else if (score >= 60) {
        recommendations.push('📊 Monitor for 6 months, track growth metrics');
        recommendations.push('🤝 Potential collaboration or talent partnership');
      } else if (score >= 40) {
        recommendations.push('📋 Add to quarterly review list');
        recommendations.push('👀 Watch for significant developments');
      }

      // Specific recommendations based on weak areas
      if (breakdown.teamQuality < 50) {
        recommendations.push('🔍 Research founding team backgrounds more thoroughly');
      }
      if (breakdown.traction < 40) {
        recommendations.push('📈 Monitor for traction indicators (customers, revenue)');
      }
    }

    return recommendations;
  }

  assignTier(score) {
    if (score >= 80) return 'Tier 1 - Critical';
    if (score >= 60) return 'Tier 2 - High Priority';
    if (score >= 40) return 'Tier 3 - Medium Priority';
    if (score >= 20) return 'Tier 4 - Low Priority';
    return 'Tier 5 - Monitor Only';
  }

  assignReliability(score) {
    if (score >= 90) return 'Extremely Reliable';
    if (score >= 80) return 'Highly Reliable';
    if (score >= 70) return 'Reliable';
    if (score >= 60) return 'Moderately Reliable';
    if (score >= 40) return 'Questionable';
    return 'Unreliable';
  }

  calculateConfidence(item, breakdown) {
    // Calculate confidence based on data completeness and source quality
    const dataPoints = Object.keys(item).length;
    const completenessConfidence = Math.min(dataPoints / 10, 1);
    
    const avgBreakdown = Object.values(breakdown).reduce((sum, val) => sum + val, 0) / Object.values(breakdown).length;
    const qualityConfidence = avgBreakdown / 100;
    
    return Math.round((completenessConfidence * 0.4 + qualityConfidence * 0.6) * 100);
  }

  calculateUrgency(item) {
    const age = Date.now() - new Date(item.timestamp || new Date()).getTime();
    const ageInHours = age / (1000 * 60 * 60);
    
    if (ageInHours <= 24) return 'Immediate';
    if (ageInHours <= 168) return 'This Week';
    if (ageInHours <= 720) return 'This Month';
    return 'Low Urgency';
  }

  /**
   * 💾 SAVE SCORING RESULTS
   */
  saveScoringResults(results) {
    const dateStr = new Date().toISOString().split('T')[0];
    const resultsFile = path.join(__dirname, '../../data/scoring-results', `${dateStr}_quality-scores.json`);
    
    // Ensure directory exists
    const resultsDir = path.dirname(resultsFile);
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    
    // Update historical data
    this.updateHistoricalData(results);
  }

  updateHistoricalData(results) {
    const historyFile = path.join(__dirname, '../../data/scoring-history.json');
    
    try {
      const history = Object.fromEntries(this.historicalData);
      history[new Date().toISOString()] = {
        totalScored: results.length,
        averageScore: results.reduce((sum, r) => sum + (r.overallScore || 0), 0) / results.length,
        highQualityCount: results.filter(r => (r.overallScore || 0) >= 80).length
      };
      
      fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
    } catch (error) {
      console.warn('Could not update historical data:', error.message);
    }
  }

  /**
   * 🚀 MAIN EXECUTION METHODS
   */
  async processDiscoveredCompanies(companies) {
    console.log(`🎯 Scoring ${companies.length} discovered companies...`);
    
    const scoredCompanies = companies.map(company => ({
      ...company,
      qualityScore: this.scoreCompanyPotential(company)
    }));

    const priorityQueues = this.createPriorityQueues(scoredCompanies);
    
    return {
      scoredCompanies,
      priorityQueues,
      summary: {
        total: companies.length,
        urgent: priorityQueues.urgent.length,
        high: priorityQueues.high.length,
        medium: priorityQueues.medium.length,
        low: priorityQueues.low.length
      }
    };
  }

  async processFundingEvents(events) {
    console.log(`💰 Scoring ${events.length} funding events...`);
    
    const scoredEvents = events.map(event => ({
      ...event,
      qualityScore: this.scoreFundingOpportunity(event)
    }));

    const priorityQueues = this.createPriorityQueues(scoredEvents);
    
    return {
      scoredEvents,
      priorityQueues,
      summary: {
        total: events.length,
        urgent: priorityQueues.urgent.length,
        high: priorityQueues.high.length
      }
    };
  }
}

// Command line execution
if (require.main === module) {
  const engine = new QualityScoringEngine();
  
  // Example usage
  const sampleCompany = {
    name: 'AI Startup Inc',
    sector: 'AI/ML',
    yearFounded: 2021,
    city: 'Vancouver',
    funding: [{ amount: 2000000, round: 'seed' }],
    keyPeople: ['Former Google AI researcher', 'Ex-Uber CTO'],
    description: 'Revolutionary computer vision platform for autonomous vehicles',
    website: 'https://example.com'
  };

  const result = engine.scoreCompanyPotential(sampleCompany);
  console.log('Sample Company Score:', JSON.stringify(result, null, 2));
}

module.exports = QualityScoringEngine;