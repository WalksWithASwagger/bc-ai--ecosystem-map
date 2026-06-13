#!/usr/bin/env node
/**
 * Scrape BC Tech Association Member Directory
 * Extract company data, employee counts, and sectors from BC Tech's member listings
 * 
 * This scraper finds:
 * - Company names and websites
 * - Employee size ranges
 * - Industry sectors
 * - Company descriptions
 * - Founded dates (when available)
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Create directories
const logsDir = path.join(__dirname, '../../logs/scrapers');
const discoveryDir = path.join(__dirname, '../../data/discoveries');

[logsDir, discoveryDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Output files
const dateStr = new Date().toISOString().split('T')[0];
const logFile = path.join(logsDir, `${dateStr}_bc-tech-association-scrape.json`);
const discoveryFile = path.join(discoveryDir, `${dateStr}_bc-tech-members.json`);

// BC Tech Association URLs
const SOURCES = {
  memberDirectory: 'https://wearebctech.com/cpages/member-directory',
  aiMembers: 'https://wearebctech.com/cpages/member-directory?category=artificial-intelligence',
  techMembers: 'https://wearebctech.com/cpages/member-directory?category=technology'
};

// Company discovery structure
class TechCompanyDiscovery {
  constructor(name) {
    this.name = name;
    this.discoveredAt = new Date().toISOString();
    this.source = 'BC Tech Association';
    this.website = null;
    this.employees = null;
    this.sector = null;
    this.description = null;
    this.location = null;
    this.yearFounded = null;
    this.linkedin = null;
    this.contactEmail = null;
    this.contactPhone = null;
    this.aiRelated = false;
    this.tags = [];
  }

  setEmployeeRange(range) {
    // Normalize employee ranges
    const rangeMap = {
      '1-10': { min: 1, max: 10, category: 'Startup' },
      '11-50': { min: 11, max: 50, category: 'Small' },
      '51-200': { min: 51, max: 200, category: 'Medium' },
      '201-500': { min: 201, max: 500, category: 'Large' },
      '500+': { min: 500, max: null, category: 'Enterprise' },
      '1000+': { min: 1000, max: null, category: 'Enterprise' }
    };
    
    this.employees = rangeMap[range] || { raw: range };
  }

  checkAIRelevance() {
    const aiKeywords = [
      'AI', 'artificial intelligence', 'machine learning', 'ML',
      'deep learning', 'neural network', 'NLP', 'computer vision',
      'data science', 'predictive analytics', 'automation'
    ];
    
    const searchText = `${this.name} ${this.description} ${this.tags.join(' ')}`.toLowerCase();
    
    this.aiRelated = aiKeywords.some(keyword => 
      searchText.includes(keyword.toLowerCase())
    );
  }
}

// Scrape member directory page
async function scrapeMemberPage(url, category = 'all') {
  console.log(`🔍 Scraping ${category} members from BC Tech Association...`);
  const discoveries = [];
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'BC-AI-Ecosystem-Research-Bot/1.0',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 30000
    });

    const $ = cheerio.load(response.data);
    
    // Find member cards/listings (adjust selectors based on actual structure)
    $('.member-card, .company-listing, .directory-item, article.member').each((i, elem) => {
      try {
        // Extract company name
        const nameElem = $(elem).find('.company-name, .member-name, h2, h3').first();
        const companyName = nameElem.text().trim();
        
        if (!companyName) return;
        
        const company = new TechCompanyDiscovery(companyName);
        
        // Extract website
        const websiteLink = $(elem).find('a[href*="http"]:not([href*="linkedin"]):not([href*="twitter"])').first();
        company.website = websiteLink.attr('href');
        
        // Extract description
        const description = $(elem).find('.description, .company-description, .summary, p').first().text().trim();
        company.description = description;
        
        // Extract employee count
        const employeeText = $(elem).find('.employees, .company-size, .size').text().trim();
        if (employeeText) {
          company.setEmployeeRange(employeeText);
        }
        
        // Extract sector/industry
        const sector = $(elem).find('.industry, .sector, .category').text().trim();
        company.sector = sector;
        
        // Extract location
        const location = $(elem).find('.location, .city, .address').text().trim();
        company.location = location;
        
        // Extract tags
        $(elem).find('.tag, .skill, .service').each((j, tagElem) => {
          company.tags.push($(tagElem).text().trim());
        });
        
        // Extract contact info if available
        const emailLink = $(elem).find('a[href^="mailto:"]');
        if (emailLink.length) {
          company.contactEmail = emailLink.attr('href').replace('mailto:', '');
        }
        
        const phoneLink = $(elem).find('a[href^="tel:"]');
        if (phoneLink.length) {
          company.contactPhone = phoneLink.attr('href').replace('tel:', '');
        }
        
        // Extract LinkedIn
        const linkedinLink = $(elem).find('a[href*="linkedin.com/company"]');
        if (linkedinLink.length) {
          company.linkedin = linkedinLink.attr('href');
        }
        
        // Check if AI-related
        company.checkAIRelevance();
        
        discoveries.push(company);
        
      } catch (error) {
        console.error(`Error parsing member: ${error.message}`);
      }
    });
    
    console.log(`✅ Found ${discoveries.length} companies in ${category} category`);
    
    // Check for pagination
    const nextPageLink = $('.pagination .next, a[rel="next"], .load-more').attr('href');
    if (nextPageLink) {
      console.log('📄 Found next page, continuing...');
      // Recursively scrape next page
      const nextPageUrl = new URL(nextPageLink, url).href;
      const nextPageDiscoveries = await scrapeMemberPage(nextPageUrl, category);
      discoveries.push(...nextPageDiscoveries);
    }
    
  } catch (error) {
    console.error(`❌ Error scraping ${category} members:`, error.message);
  }
  
  return discoveries;
}

// Extract additional company details from profile page
async function enrichCompanyData(company) {
  if (!company.website) return company;
  
  try {
    console.log(`  → Enriching data for ${company.name}`);
    
    // Try to get more info from company website
    const response = await axios.get(company.website, {
      headers: {
        'User-Agent': 'BC-AI-Ecosystem-Research-Bot/1.0'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    
    // Look for founding year
    const yearPattern = /(?:founded|established|since|started)\s+(?:in\s+)?(\d{4})/i;
    const bodyText = $('body').text();
    const yearMatch = bodyText.match(yearPattern);
    
    if (yearMatch) {
      company.yearFounded = parseInt(yearMatch[1]);
    }
    
    // Look for employee count if not already found
    if (!company.employees) {
      const employeePattern = /(\d+)\+?\s*(?:employees|team members|people)/i;
      const employeeMatch = bodyText.match(employeePattern);
      
      if (employeeMatch) {
        const count = parseInt(employeeMatch[1]);
        if (count < 11) company.setEmployeeRange('1-10');
        else if (count < 51) company.setEmployeeRange('11-50');
        else if (count < 201) company.setEmployeeRange('51-200');
        else if (count < 501) company.setEmployeeRange('201-500');
        else company.setEmployeeRange('500+');
      }
    }
    
    // Extract email if not found
    if (!company.contactEmail) {
      const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
      const emails = bodyText.match(new RegExp(emailPattern, 'g'));
      
      if (emails) {
        // Filter out common non-contact emails
        const contactEmail = emails.find(email => 
          !email.includes('example.com') && 
          (email.includes('info@') || email.includes('contact@') || email.includes('hello@'))
        );
        
        company.contactEmail = contactEmail || emails[0];
      }
    }
    
  } catch (error) {
    // Silently fail enrichment
  }
  
  return company;
}

// Main scraping function
async function main() {
  console.log('🚀 Starting BC Tech Association member scraping...');
  console.log('=' .repeat(50));
  
  const allDiscoveries = [];
  
  // Scrape different categories
  for (const [category, url] of Object.entries(SOURCES)) {
    const discoveries = await scrapeMemberPage(url, category);
    allDiscoveries.push(...discoveries);
    
    // Add delay between categories
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Deduplicate by company name
  const uniqueCompanies = new Map();
  allDiscoveries.forEach(company => {
    const existing = uniqueCompanies.get(company.name);
    if (!existing || (company.website && !existing.website)) {
      uniqueCompanies.set(company.name, company);
    }
  });
  
  const companies = Array.from(uniqueCompanies.values());
  
  // Enrich top AI companies
  console.log('\n🔄 Enriching AI company data...');
  const aiCompanies = companies.filter(c => c.aiRelated);
  
  for (let i = 0; i < Math.min(20, aiCompanies.length); i++) {
    await enrichCompanyData(aiCompanies[i]);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
  }
  
  // Prepare results
  const results = {
    timestamp: new Date().toISOString(),
    source: 'BC Tech Association',
    totalCompanies: companies.length,
    aiCompanies: aiCompanies.length,
    companiesWithData: {
      website: companies.filter(c => c.website).length,
      employees: companies.filter(c => c.employees).length,
      yearFounded: companies.filter(c => c.yearFounded).length,
      contactEmail: companies.filter(c => c.contactEmail).length,
      linkedin: companies.filter(c => c.linkedin).length
    },
    companies: {
      ai: aiCompanies,
      other: companies.filter(c => !c.aiRelated)
    }
  };
  
  // Save results
  fs.writeFileSync(discoveryFile, JSON.stringify(results, null, 2));
  fs.writeFileSync(logFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    sources: SOURCES,
    totalScraped: allDiscoveries.length,
    uniqueCompanies: companies.length,
    enriched: aiCompanies.filter(c => c.yearFounded).length
  }, null, 2));
  
  // Print summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 BC Tech Association Scraping Summary:');
  console.log(`Total companies discovered: ${companies.length}`);
  console.log(`AI-related companies: ${aiCompanies.length}`);
  console.log(`\n📈 Data Coverage:`);
  console.log(`  Websites: ${results.companiesWithData.website}`);
  console.log(`  Employee counts: ${results.companiesWithData.employees}`);
  console.log(`  Founded years: ${results.companiesWithData.yearFounded}`);
  console.log(`  Contact emails: ${results.companiesWithData.contactEmail}`);
  console.log(`  LinkedIn profiles: ${results.companiesWithData.linkedin}`);
  
  console.log('\n🎯 Top AI Companies Found:');
  aiCompanies.slice(0, 10).forEach(company => {
    console.log(`\n${company.name}`);
    if (company.employees) {
      console.log(`  👥 ${company.employees.min}-${company.employees.max || '+'} employees`);
    }
    if (company.yearFounded) {
      console.log(`  📅 Founded: ${company.yearFounded}`);
    }
    if (company.website) {
      console.log(`  🌐 ${company.website}`);
    }
    if (company.sector) {
      console.log(`  🏢 ${company.sector}`);
    }
  });
  
  console.log(`\n✅ Results saved to: ${discoveryFile}`);
  console.log(`📝 Log saved to: ${logFile}`);
}

// Run the scraper
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { scrapeMemberPage, enrichCompanyData };