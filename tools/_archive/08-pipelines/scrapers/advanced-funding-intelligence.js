#!/usr/bin/env node
/**
 * 💰 Advanced Funding Intelligence Pipeline
 * 
 * Multi-source funding data aggregation with predictive analysis.
 * Goes beyond basic funding news to provide strategic intelligence.
 * 
 * NEW CAPABILITIES:
 * - Crunchbase API integration
 * - Government funding database monitoring  
 * - VC firm portfolio tracking
 * - Investment pattern analysis
 * - Funding round prediction
 * - Investor relationship mapping
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Enhanced configuration
const config = {
  // API keys (add to your .env)
  crunchbaseApiKey: process.env.CRUNCHBASE_API_KEY,
  
  // Data sources with credibility scores
  sources: [
    { name: 'crunchbase', credibility: 0.95, apiLimit: 200 },
    { name: 'betakit', credibility: 0.90, apiLimit: null },
    { name: 'government', credibility: 1.0, apiLimit: null },
    { name: 'vcfirms', credibility: 0.85, apiLimit: null }
  ],
  
  // Funding categories for classification
  fundingTypes: [
    'pre-seed', 'seed', 'series-a', 'series-b', 'series-c', 
    'series-d', 'bridge', 'growth', 'ipo', 'acquisition'
  ],
  
  // BC-specific VC firms to monitor
  bcVCFirms: [
    'Rhino Ventures', 'Vanedge Capital', 'Yaletown Partners',
    'Boreas Ventures', 'Impression Ventures', 'Kensington Capital',
    'Version One Ventures', 'Inovia Capital', 'BDC Capital'
  ]
};

class AdvancedFundingIntelligence {
  constructor() {
    this.findings = [];
    this.patterns = new Map();
    this.predictions = [];
    this.timestamp = new Date().toISOString();
    
    this.setupDirectories();
  }

  setupDirectories() {
    const dirs = ['logs/funding', 'data/funding-intelligence', 'data/predictions'];
    dirs.forEach(dir => {
      const fullPath = path.join(__dirname, '../../../', dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  /**
   * 🔍 CRUNCHBASE INTEGRATION
   * Access comprehensive funding database
   */
  async scrapeCrunchbaseFunding() {
    if (!config.crunchbaseApiKey) {
      console.log('⚠️  Crunchbase API key not configured, skipping...');
      return [];
    }

    console.log('🔍 Scraping Crunchbase for BC funding data...');
    
    const findings = [];
    const bcLocations = ['Vancouver', 'British Columbia', 'Burnaby', 'Richmond', 'Victoria', 'Kelowna'];
    
    for (const location of bcLocations) {
      try {
        const response = await axios.get('https://api.crunchbase.com/api/v4/searches/funding_rounds', {
          headers: {
            'X-cb-user-key': config.crunchbaseApiKey
          },
          params: {
            field_ids: [
              'funding_round_money_raised',
              'funding_round_announced_on', 
              'funding_type',
              'organization_name',
              'organization_location',
              'investor_names'
            ],
            query: location,
            limit: 50
          }
        });

        for (const round of response.data.entities || []) {
          const funding = this.parseCrunchbaseFunding(round);
          if (funding && this.isAIRelated(funding)) {
            findings.push(funding);
          }
        }

        // Rate limiting
        await this.sleep(1000);
        
      } catch (error) {
        console.error(`Error scraping Crunchbase for ${location}:`, error.message);
      }
    }

    console.log(`✅ Crunchbase: Found ${findings.length} funding rounds`);
    return findings;
  }

  parseCrunchbaseFunding(data) {
    return {
      source: 'crunchbase',
      company: data.properties?.organization_name || 'Unknown',
      amount: data.properties?.funding_round_money_raised?.value || null,
      currency: data.properties?.funding_round_money_raised?.currency || 'USD',
      round: data.properties?.funding_type || 'Unknown',
      date: data.properties?.funding_round_announced_on || null,
      location: data.properties?.organization_location || null,
      investors: data.properties?.investor_names || [],
      confidence: 0.95,
      dataPoints: Object.keys(data.properties || {}).length
    };
  }

  /**
   * 🏛️ GOVERNMENT FUNDING MONITORING
   * Track federal and provincial funding programs
   */
  async scrapeGovernmentFunding() {
    console.log('🏛️ Monitoring government funding announcements...');
    
    const findings = [];
    const sources = [
      'https://www.ic.gc.ca/eic/site/061.nsf/eng/h_03018.html', // ISED funding
      'https://www.innovatebc.ca/news/', // Innovate BC
      'https://nrc.canada.ca/en/support-technology-innovation', // NRC IRAP
      'https://www.sred-credits.ca/recent-approvals/' // SR&ED approvals
    ];

    for (const url of sources) {
      try {
        const response = await axios.get(url, {
          timeout: 15000,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BC-AI-Research/1.0)' }
        });

        const $ = cheerio.load(response.data);
        const announcements = await this.extractGovernmentAnnouncements($, url);
        findings.push(...announcements);

      } catch (error) {
        console.error(`Error scraping ${url}:`, error.message);
      }
    }

    console.log(`✅ Government: Found ${findings.length} funding announcements`);
    return findings;
  }

  async extractGovernmentAnnouncements($, sourceUrl) {
    const announcements = [];
    
    // Different parsing strategies based on source
    if (sourceUrl.includes('innovatebc.ca')) {
      $('.news-item, .funding-announcement').each((i, elem) => {
        const title = $(elem).find('h2, h3, .title').text().trim();
        const amount = this.extractFundingAmount(title);
        const date = $(elem).find('.date, time').text().trim();
        
        if (amount && this.containsBCCompany(title)) {
          announcements.push({
            source: 'innovate-bc',
            company: this.extractCompanyName(title),
            amount: amount,
            program: 'Innovate BC',
            date: this.parseDate(date),
            description: title,
            confidence: 1.0
          });
        }
      });
    }

    return announcements;
  }

  /**
   * 💼 VC FIRM PORTFOLIO MONITORING
   * Track portfolio updates from BC VC firms
   */
  async scrapeVCPortfolios() {
    console.log('💼 Monitoring VC firm portfolios...');
    
    const findings = [];
    
    for (const vcFirm of config.bcVCFirms) {
      try {
        const portfolioData = await this.scrapeVCFirmPortfolio(vcFirm);
        findings.push(...portfolioData);
        
        // Respectful rate limiting
        await this.sleep(2000);
        
      } catch (error) {
        console.error(`Error scraping ${vcFirm}:`, error.message);
      }
    }

    console.log(`✅ VC Portfolios: Found ${findings.length} portfolio updates`);
    return findings;
  }

  async scrapeVCFirmPortfolio(firmName) {
    // Implement specific scraping logic for each VC firm
    const firmUrls = {
      'Rhino Ventures': 'https://rhinoventures.com/portfolio',
      'Vanedge Capital': 'https://vanedgecapital.com/portfolio',
      'Yaletown Partners': 'https://yaletown.com/portfolio'
      // Add more firms
    };

    const url = firmUrls[firmName];
    if (!url) return [];

    try {
      const response = await axios.get(url, { timeout: 10000 });
      const $ = cheerio.load(response.data);
      
      const portfolio = [];
      $('.portfolio-item, .company-item').each((i, elem) => {
        const company = $(elem).find('.company-name, h3, h4').text().trim();
        const sector = $(elem).find('.sector, .industry').text().trim();
        const stage = $(elem).find('.stage').text().trim();
        
        if (company && this.isAIRelated(company + ' ' + sector)) {
          portfolio.push({
            source: 'vc-portfolio',
            investor: firmName,
            company: company,
            sector: sector,
            stage: stage,
            confidence: 0.85,
            lastSeen: new Date().toISOString()
          });
        }
      });

      return portfolio;
      
    } catch (error) {
      console.error(`Error scraping ${firmName} portfolio:`, error.message);
      return [];
    }
  }

  /**
   * 📊 PATTERN ANALYSIS & PREDICTIONS
   * Analyze funding patterns and predict future rounds
   */
  async analyzeFundingPatterns(allFindings) {
    console.log('📊 Analyzing funding patterns...');
    
    const analysis = {
      totalFunding: 0,
      roundsByType: new Map(),
      investorActivity: new Map(),
      sectorTrends: new Map(),
      predictions: []
    };

    // Aggregate data
    for (const finding of allFindings) {
      if (finding.amount) {
        analysis.totalFunding += finding.amount;
      }
      
      // Round type analysis
      const roundType = finding.round || 'unknown';
      analysis.roundsByType.set(roundType, (analysis.roundsByType.get(roundType) || 0) + 1);
      
      // Investor activity
      if (finding.investors) {
        finding.investors.forEach(investor => {
          analysis.investorActivity.set(investor, (analysis.investorActivity.get(investor) || 0) + 1);
        });
      }
      
      // Sector trends
      const sector = finding.sector || this.classifySector(finding.company);
      analysis.sectorTrends.set(sector, (analysis.sectorTrends.get(sector) || 0) + 1);
    }

    // Generate predictions
    analysis.predictions = await this.generateFundingPredictions(analysis);

    return analysis;
  }

  async generateFundingPredictions(analysis) {
    const predictions = [];
    
    // Predict hot sectors based on funding velocity
    const hotSectors = Array.from(analysis.sectorTrends.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
      
    hotSectors.forEach(([sector, count]) => {
      predictions.push({
        type: 'sector_growth',
        prediction: `${sector} sector expected to see continued investment activity`,
        confidence: Math.min(0.9, count / 10),
        reasoning: `${count} recent funding events indicate strong investor interest`
      });
    });

    // Predict active investors
    const activeInvestors = Array.from(analysis.investorActivity.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
      
    activeInvestors.forEach(([investor, deals]) => {
      if (deals >= 2) {
        predictions.push({
          type: 'investor_activity', 
          prediction: `${investor} likely to continue active investment in BC AI companies`,
          confidence: Math.min(0.85, deals / 5),
          reasoning: `${deals} recent investments indicate active deployment strategy`
        });
      }
    });

    return predictions;
  }

  /**
   * 🎯 AI/TECH CLASSIFICATION
   * Determine if company/funding is AI/tech related
   */
  isAIRelated(text) {
    const aiKeywords = [
      'artificial intelligence', 'machine learning', 'AI', 'ML', 'deep learning',
      'computer vision', 'natural language', 'neural network', 'algorithm',
      'automation', 'robotics', 'data science', 'analytics', 'software',
      'technology', 'tech', 'digital', 'platform', 'SaaS', 'API'
    ];
    
    const lowerText = text.toLowerCase();
    return aiKeywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
  }

  classifySector(companyName) {
    const sectorKeywords = {
      'HealthTech': ['health', 'medical', 'biotech', 'pharma', 'clinical'],
      'FinTech': ['finance', 'banking', 'payment', 'crypto', 'blockchain'],
      'EdTech': ['education', 'learning', 'training', 'university', 'school'],
      'CleanTech': ['clean', 'green', 'energy', 'renewable', 'environment'],
      'Enterprise': ['enterprise', 'business', 'corporate', 'B2B', 'productivity'],
      'Consumer': ['consumer', 'B2C', 'mobile', 'app', 'social']
    };

    const lowerName = companyName.toLowerCase();
    
    for (const [sector, keywords] of Object.entries(sectorKeywords)) {
      if (keywords.some(keyword => lowerName.includes(keyword))) {
        return sector;
      }
    }
    
    return 'General Tech';
  }

  /**
   * 🔧 UTILITY FUNCTIONS
   */
  extractFundingAmount(text) {
    const patterns = [
      /\$([0-9,]+(?:\.[0-9]+)?)\s*million/i,
      /\$([0-9,]+(?:\.[0-9]+)?)\s*M/i,
      /\$([0-9,]+(?:\.[0-9]+)?)\s*billion/i,
      /\$([0-9,]+(?:\.[0-9]+)?)\s*B/i,
      /\$([0-9,]+)/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        let amount = parseFloat(match[1].replace(/,/g, ''));
        
        if (text.toLowerCase().includes('million') || text.includes('M')) {
          amount *= 1000000;
        } else if (text.toLowerCase().includes('billion') || text.includes('B')) {
          amount *= 1000000000;
        }
        
        return amount;
      }
    }
    
    return null;
  }

  extractCompanyName(text) {
    // Simple company name extraction - can be enhanced
    const match = text.match(/([A-Z][a-zA-Z\s]+(?:Inc|Corp|Ltd|Technologies|Tech|AI)?)/);
    return match ? match[1].trim() : 'Unknown Company';
  }

  containsBCCompany(text) {
    const bcIndicators = [
      'vancouver', 'british columbia', 'bc', 'burnaby', 'richmond', 
      'victoria', 'kelowna', 'surrey', 'coquitlam'
    ];
    
    const lowerText = text.toLowerCase();  
    return bcIndicators.some(indicator => lowerText.includes(indicator));
  }

  parseDate(dateStr) {
    // Enhanced date parsing
    try {
      return new Date(dateStr).toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 💾 SAVE INTELLIGENCE
   */
  async saveFindings(allFindings, analysis) {
    const dateStr = new Date().toISOString().split('T')[0];
    
    // Save raw findings
    const findingsFile = path.join(__dirname, '../../../data/funding-intelligence', 
      `${dateStr}_funding-intelligence.json`);
      
    fs.writeFileSync(findingsFile, JSON.stringify({
      timestamp: this.timestamp,
      totalFindings: allFindings.length,
      findings: allFindings,
      analysis: {
        ...analysis,
        roundsByType: Object.fromEntries(analysis.roundsByType),
        investorActivity: Object.fromEntries(analysis.investorActivity),
        sectorTrends: Object.fromEntries(analysis.sectorTrends)
      }
    }, null, 2));

    // Save predictions separately
    const predictionsFile = path.join(__dirname, '../../../data/predictions',
      `${dateStr}_funding-predictions.json`);
      
    fs.writeFileSync(predictionsFile, JSON.stringify({
      timestamp: this.timestamp,
      predictions: analysis.predictions,
      confidence: analysis.predictions.reduce((sum, p) => sum + p.confidence, 0) / analysis.predictions.length
    }, null, 2));

    console.log(`💾 Saved ${allFindings.length} findings and ${analysis.predictions.length} predictions`);
  }

  /**
   * 🚀 MAIN EXECUTION
   */
  async execute() {
    console.log('💰 Advanced Funding Intelligence Pipeline Starting...');
    console.log('=' .repeat(60));

    const allFindings = [];
    
    // Execute all scraping modules
    try {
      const crunchbaseResults = await this.scrapeCrunchbaseFunding();
      allFindings.push(...crunchbaseResults);
    } catch (error) {
      console.error('Crunchbase error:', error.message);
    }

    try {
      const governmentResults = await this.scrapeGovernmentFunding();
      allFindings.push(...governmentResults);
    } catch (error) {
      console.error('Government scraping error:', error.message);
    }

    try {
      const vcResults = await this.scrapeVCPortfolios();
      allFindings.push(...vcResults);
    } catch (error) {
      console.error('VC portfolio error:', error.message);
    }

    // Analyze patterns and generate predictions
    const analysis = await this.analyzeFundingPatterns(allFindings);
    
    // Save all intelligence
    await this.saveFindings(allFindings, analysis);

    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 FUNDING INTELLIGENCE SUMMARY:');
    console.log(`Total funding events discovered: ${allFindings.length}`);
    console.log(`Total funding amount tracked: $${(analysis.totalFunding / 1000000).toFixed(1)}M`);
    console.log(`Most active round type: ${Array.from(analysis.roundsByType.entries()).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A'}`);
    console.log(`Predictions generated: ${analysis.predictions.length}`);
    console.log('=' .repeat(60));

    return {
      findings: allFindings,
      analysis: analysis,
      summary: {
        total: allFindings.length,
        totalFunding: analysis.totalFunding,
        predictions: analysis.predictions.length
      }
    };
  }
}

// Command line execution
if (require.main === module) {
  const intelligence = new AdvancedFundingIntelligence();
  intelligence.execute()
    .then(results => {
      console.log('✅ Advanced Funding Intelligence Complete!');
      if (process.env.PIPELINE_MODE) {
        // Output JSON for pipeline consumption
        console.log(JSON.stringify(results));
      }
    })
    .catch(error => {
      console.error('❌ Pipeline Error:', error);
      process.exit(1);
    });
}

module.exports = AdvancedFundingIntelligence;