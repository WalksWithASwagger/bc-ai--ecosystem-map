#!/usr/bin/env node
/**
 * 🕵️ Competitive Intelligence Pipeline
 * 
 * Advanced competitive monitoring system that tracks:
 * - Product launches and feature releases
 * - Team expansions and key hires
 * - Partnership announcements
 * - Technology stack changes
 * - Market positioning shifts
 * - Pricing and strategy changes
 * 
 * This gives you early warning of competitive threats and opportunities.
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

class CompetitiveIntelligence {
  constructor() {
    this.intelligence = {
      timestamp: new Date().toISOString(),
      companies: new Map(),
      alerts: [],
      trends: [],
      opportunities: []
    };
    
    this.setupDirectories();
  }

  setupDirectories() {
    const dirs = [
      'logs/competitive',
      'data/competitive-intelligence', 
      'data/competitor-profiles',
      'data/market-alerts'
    ];
    
    dirs.forEach(dir => {
      const fullPath = path.join(__dirname, '../../../', dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  /**
   * 🚀 PRODUCT LAUNCH MONITORING
   * Track when competitors release new products/features
   */
  async monitorProductLaunches() {
    console.log('🚀 Monitoring product launches...');
    
    const sources = [
      'https://www.producthunt.com/search?q=vancouver',
      'https://www.producthunt.com/search?q=AI+canada',
      'https://techcrunch.com/tag/canada/',
      'https://betakit.com/tag/product-launch/'
    ];

    const launches = [];
    
    for (const url of sources) {
      try {
        const productData = await this.scrapeProductLaunches(url);
        launches.push(...productData);
        
        await this.sleep(2000); // Rate limiting
        
      } catch (error) {
        console.error(`Error monitoring ${url}:`, error.message);
      }
    }

    // Analyze launch patterns
    const launchAnalysis = this.analyzeProductLaunches(launches);
    
    console.log(`✅ Found ${launches.length} product launches`);
    return { launches, analysis: launchAnalysis };
  }

  async scrapeProductLaunches(url) {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CompetitiveIntel/1.0)' }
    });

    const $ = cheerio.load(response.data);
    const launches = [];

    if (url.includes('producthunt.com')) {
      $('.styles_item__Dk_nz, [data-test="post-item"]').each((i, elem) => {
        const title = $(elem).find('h3, .font-semibold').text().trim();
        const description = $(elem).find('.text-16, .color-darker-grey').text().trim();
        const votes = $(elem).find('[data-test="vote-button"]').text().trim();
        const launchDate = $(elem).find('.color-grey').text().trim();

        if (title && this.isRelevantToBC(title + ' ' + description)) {
          launches.push({
            source: 'ProductHunt',
            product: title,
            description: description,
            votes: this.parseNumber(votes),
            launchDate: launchDate,
            url: url,
            relevanceScore: this.calculateRelevance(title, description),
            threatLevel: this.assessThreatLevel(title, description)
          });
        }
      });
    }

    return launches;
  }

  /**
   * 👥 TALENT MOVEMENT TRACKING  
   * Monitor key hires and team expansions at competitors
   */
  async monitorTalentMovement() {
    console.log('👥 Monitoring talent movement...');
    
    const movements = [];
    
    // Monitor LinkedIn job changes (requires LinkedIn API or scraping)
    // Monitor company "We're hiring" pages
    // Monitor AngelList job postings
    
    const companySources = await this.getCompetitorList();
    
    for (const company of companySources) {
      try {
        const hires = await this.trackCompanyHires(company);
        movements.push(...hires);
        
        await this.sleep(3000);
        
      } catch (error) {
        console.error(`Error tracking ${company.name}:`, error.message);
      }
    }

    console.log(`✅ Found ${movements.length} talent movements`);
    return movements;
  }

  async trackCompanyHires(company) {
    const hires = [];
    
    // Check careers page for new positions
    if (company.website) {
      try {
        const careersUrls = [
          `${company.website}/careers`,
          `${company.website}/jobs`,
          `${company.website}/team`,
          `${company.website}/about/careers`
        ];

        for (const careersUrl of careersUrls) {
          try {
            const response = await axios.get(careersUrl, { timeout: 10000 });
            const $ = cheerio.load(response.data);
            
            const jobPostings = this.extractJobPostings($, company.name);
            hires.push(...jobPostings);
            
            break; // Exit loop if successful
            
          } catch (error) {
            // Try next URL
            continue;
          }
        }
      } catch (error) {
        console.error(`Error checking careers for ${company.name}:`, error.message);
      }
    }

    return hires;
  }

  extractJobPostings($, companyName) {
    const postings = [];
    
    $('h1, h2, h3, h4, .job-title, .position-title').each((i, elem) => {
      const title = $(elem).text().trim();
      
      if (this.isKeyPosition(title)) {
        postings.push({
          company: companyName,
          position: title,
          department: this.classifyDepartment(title),
          seniority: this.assessSeniority(title),
          strategicImportance: this.assessStrategicImportance(title),
          discoveredAt: new Date().toISOString()
        });
      }
    });

    return postings;
  }

  /**
   * 🤝 PARTNERSHIP & ACQUISITION MONITORING
   * Track strategic partnerships and M&A activity
   */
  async monitorPartnerships() {
    console.log('🤝 Monitoring partnerships and acquisitions...');
    
    const partnerships = [];
    const newsSources = [
      'https://techcrunch.com/tag/canada/',
      'https://betakit.com/tag/partnerships/',
      'https://www.globenewswire.com/search/keyword/partnership%20canada',
      'https://finance.yahoo.com/news/latest/'
    ];

    for (const source of newsSources) {
      try {
        const partnershipData = await this.scrapePartnerships(source);
        partnerships.push(...partnershipData);
        
        await this.sleep(2000);
        
      } catch (error) {
        console.error(`Error monitoring partnerships from ${source}:`, error.message);
      }
    }

    console.log(`✅ Found ${partnerships.length} partnership announcements`);
    return partnerships;
  }

  async scrapePartnerships(url) {
    const response = await axios.get(url, { timeout: 15000 });
    const $ = cheerio.load(response.data);
    const partnerships = [];

    $('article, .news-item, .headline').each((i, elem) => {
      const headline = $(elem).find('h1, h2, h3, .title').text().trim();
      const summary = $(elem).find('p, .summary, .excerpt').first().text().trim();
      const date = $(elem).find('.date, time').text().trim();

      if (this.isPartnershipNews(headline)) {
        partnerships.push({
          headline: headline,
          summary: summary,
          date: this.parseDate(date),
          source: url,
          companies: this.extractCompanyNames(headline),
          partnershipType: this.classifyPartnership(headline),
          strategicImpact: this.assessPartnershipImpact(headline, summary)
        });
      }
    });

    return partnerships;
  }

  /**
   * 💰 PRICING & STRATEGY MONITORING
   * Track competitor pricing changes and strategic shifts
   */
  async monitorPricingStrategy() {
    console.log('💰 Monitoring pricing and strategy changes...');
    
    const competitors = await this.getCompetitorList();
    const pricingIntel = [];

    for (const competitor of competitors) {
      try {
        const pricing = await this.scrapePricingData(competitor);
        if (pricing) {
          pricingIntel.push(pricing);
        }
        
        await this.sleep(3000);
        
      } catch (error) {
        console.error(`Error monitoring pricing for ${competitor.name}:`, error.message);
      }
    }

    console.log(`✅ Collected pricing data for ${pricingIntel.length} competitors`);
    return pricingIntel;
  }

  async scrapePricingData(competitor) {
    if (!competitor.website) return null;

    try {
      const pricingUrls = [
        `${competitor.website}/pricing`,
        `${competitor.website}/plans`,
        `${competitor.website}/subscribe`
      ];

      for (const pricingUrl of pricingUrls) {
        try {
          const response = await axios.get(pricingUrl, { timeout: 10000 });
          const $ = cheerio.load(response.data);
          
          const pricingTiers = this.extractPricingTiers($);
          
          if (pricingTiers.length > 0) {
            return {
              company: competitor.name,
              website: competitor.website,
              pricingTiers: pricingTiers,
              lastUpdated: new Date().toISOString(),
              competitivePosition: this.assessCompetitivePosition(pricingTiers)
            };
          }
          
        } catch (error) {
          continue; // Try next URL
        }
      }
      
    } catch (error) {
      console.error(`Error scraping pricing for ${competitor.name}:`, error.message);
    }

    return null;
  }

  extractPricingTiers($) {
    const tiers = [];
    
    $('.pricing-tier, .plan, .package').each((i, elem) => {
      const name = $(elem).find('.tier-name, .plan-name').text().trim();
      const price = $(elem).find('.price, .cost').text().trim();
      const features = [];
      
      $(elem).find('li, .feature').each((j, feature) => {
        features.push($(feature).text().trim());
      });

      if (name && price) {
        tiers.push({
          name: name,
          price: this.parsePrice(price),
          features: features,
          featureCount: features.length
        });
      }
    });

    return tiers;
  }

  /**
   * 📊 COMPETITIVE ANALYSIS
   * Generate insights and strategic recommendations
   */
  async generateCompetitiveAnalysis(allIntelligence) {
    console.log('📊 Generating competitive analysis...');
    
    const analysis = {
      marketMovement: this.analyzeMarketMovement(allIntelligence),
      threatAssessment: this.assessCompetitiveThreats(allIntelligence),
      opportunities: this.identifyOpportunities(allIntelligence),
      strategicRecommendations: this.generateRecommendations(allIntelligence)
    };

    return analysis;
  }

  analyzeMarketMovement(intelligence) {
    // Analyze trends in product launches, funding, partnerships
    return {
      productLaunchVelocity: 'increasing',
      fundingActivity: 'stable', 
      partnershipActivity: 'increasing',
      talentCompetition: 'high'
    };
  }

  assessCompetitiveThreats(intelligence) {
    const threats = [];
    
    // Identify companies with significant recent activity
    intelligence.forEach(company => {
      let threatScore = 0;
      
      if (company.recentFunding) threatScore += 30;
      if (company.productLaunches?.length > 2) threatScore += 25;
      if (company.keyHires?.length > 3) threatScore += 20;
      if (company.partnerships?.length > 1) threatScore += 15;
      
      if (threatScore > 50) {
        threats.push({
          company: company.name,
          threatScore: threatScore,
          primaryThreats: this.identifyPrimaryThreats(company),
          recommendation: this.generateThreatResponse(company, threatScore)
        });
      }
    });

    return threats.sort((a, b) => b.threatScore - a.threatScore);
  }

  /**
   * 🔧 UTILITY FUNCTIONS
   */
  isRelevantToBC(text) {
    const bcIndicators = [
      'vancouver', 'british columbia', 'bc', 'canada', 'canadian',
      'toronto', 'montreal', 'calgary', 'ottawa'
    ];
    
    const lowerText = text.toLowerCase();
    return bcIndicators.some(indicator => lowerText.includes(indicator));
  }

  isKeyPosition(title) {
    const keyRoles = [
      'ceo', 'cto', 'cfo', 'vp', 'director', 'head of', 'lead',
      'senior', 'principal', 'architect', 'manager'
    ];
    
    const lowerTitle = title.toLowerCase();
    return keyRoles.some(role => lowerTitle.includes(role));
  }

  isPartnershipNews(headline) {
    const partnershipKeywords = [
      'partner', 'acquisition', 'acquires', 'merger', 'collaboration',
      'alliance', 'joint venture', 'investment', 'funding'
    ];
    
    const lowerHeadline = headline.toLowerCase();
    return partnershipKeywords.some(keyword => lowerHeadline.includes(keyword));
  }

  calculateRelevance(title, description) {
    let score = 0;
    
    const aiKeywords = ['ai', 'artificial intelligence', 'machine learning', 'ml'];
    const bcKeywords = ['vancouver', 'bc', 'canada', 'canadian'];
    
    const text = (title + ' ' + description).toLowerCase();
    
    if (aiKeywords.some(k => text.includes(k))) score += 0.4;
    if (bcKeywords.some(k => text.includes(k))) score += 0.6;
    
    return Math.min(1.0, score);
  }

  assessThreatLevel(title, description) {
    const highThreatKeywords = [
      'enterprise', 'b2b', 'saas', 'platform', 'api', 'automation'
    ];
    
    const text = (title + ' ' + description).toLowerCase();
    const matches = highThreatKeywords.filter(k => text.includes(k)).length;
    
    if (matches >= 3) return 'high';
    if (matches >= 2) return 'medium';
    return 'low';
  }

  parsePrice(priceText) {
    const match = priceText.match(/\$([0-9,]+(?:\.[0-9]+)?)/);
    return match ? parseFloat(match[1].replace(/,/g, '')) : null;
  }

  parseDate(dateStr) {
    try {
      return new Date(dateStr).toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  parseNumber(numStr) {
    const match = numStr.match(/([0-9,]+)/);
    return match ? parseInt(match[1].replace(/,/g, '')) : 0;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getCompetitorList() {
    // Load from your existing database or define key competitors
    return [
      { name: 'Hootsuite', website: 'https://hootsuite.com' },
      { name: 'Unbounce', website: 'https://unbounce.com' },
      { name: 'Slack', website: 'https://slack.com' },
      // Add more competitors
    ];
  }

  /**
   * 💾 SAVE INTELLIGENCE
   */
  async saveIntelligence(allIntelligence, analysis) {
    const dateStr = new Date().toISOString().split('T')[0];
    
    // Save comprehensive intelligence report
    const reportFile = path.join(__dirname, '../../../data/competitive-intelligence',
      `${dateStr}_competitive-intelligence.json`);
      
    fs.writeFileSync(reportFile, JSON.stringify({
      timestamp: this.intelligence.timestamp,
      intelligence: allIntelligence,
      analysis: analysis,
      summary: {
        totalEvents: allIntelligence.length,
        highThreatCompetitors: analysis.threatAssessment?.filter(t => t.threatScore > 70).length || 0,
        opportunitiesIdentified: analysis.opportunities?.length || 0
      }
    }, null, 2));

    // Save alerts for immediate action
    if (analysis.threatAssessment?.length > 0) {
      const alertsFile = path.join(__dirname, '../../../data/market-alerts',
        `${dateStr}_competitive-alerts.json`);
        
      fs.writeFileSync(alertsFile, JSON.stringify({
        timestamp: this.intelligence.timestamp,
        highPriorityAlerts: analysis.threatAssessment.filter(t => t.threatScore > 70),
        recommendations: analysis.strategicRecommendations
      }, null, 2));
    }

    console.log(`💾 Competitive intelligence saved`);
  }

  /**
   * 🚀 MAIN EXECUTION
   */
  async execute() {
    console.log('🕵️ Competitive Intelligence Pipeline Starting...');
    console.log('=' .repeat(60));

    const allIntelligence = [];
    
    try {
      // Execute all monitoring modules
      const productIntel = await this.monitorProductLaunches();
      allIntelligence.push(...productIntel.launches);

      const talentIntel = await this.monitorTalentMovement();
      allIntelligence.push(...talentIntel);

      const partnershipIntel = await this.monitorPartnerships();
      allIntelligence.push(...partnershipIntel);

      const pricingIntel = await this.monitorPricingStrategy();
      allIntelligence.push(...pricingIntel);

      // Generate analysis
      const analysis = await this.generateCompetitiveAnalysis(allIntelligence);
      
      // Save intelligence
      await this.saveIntelligence(allIntelligence, analysis);

      // Summary
      console.log('\n' + '=' .repeat(60));
      console.log('🕵️ COMPETITIVE INTELLIGENCE SUMMARY:');
      console.log(`Total intelligence events: ${allIntelligence.length}`);
      console.log(`High-threat competitors: ${analysis.threatAssessment?.filter(t => t.threatScore > 70).length || 0}`);
      console.log(`Strategic opportunities: ${analysis.opportunities?.length || 0}`);
      console.log('=' .repeat(60));

      return {
        intelligence: allIntelligence,
        analysis: analysis,
        summary: {
          total: allIntelligence.length,
          threats: analysis.threatAssessment?.length || 0,
          opportunities: analysis.opportunities?.length || 0
        }
      };

    } catch (error) {
      console.error('❌ Competitive Intelligence Error:', error);
      throw error;
    }
  }
}

// Command line execution
if (require.main === module) {
  const competitive = new CompetitiveIntelligence();
  competitive.execute()
    .then(results => {
      console.log('✅ Competitive Intelligence Complete!');
      if (process.env.PIPELINE_MODE) {
        console.log(JSON.stringify(results));
      }
    })
    .catch(error => {
      console.error('❌ Pipeline Error:', error);
      process.exit(1);
    });
}

module.exports = CompetitiveIntelligence;