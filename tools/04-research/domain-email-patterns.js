#!/usr/bin/env node
/**
 * Domain Email Pattern Finder
 * 
 * Discovers email patterns for domains and generates likely valid emails
 * Similar to Hunter.io but using public data sources
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const dns = require('dns').promises;

class DomainEmailFinder {
  constructor() {
    this.patterns = {
      // Common business email patterns
      business: [
        'info@{domain}',
        'contact@{domain}',
        'hello@{domain}',
        'team@{domain}',
        'support@{domain}',
        'sales@{domain}',
        'inquiries@{domain}',
        'admin@{domain}',
        'office@{domain}',
        'general@{domain}'
      ],
      
      // Startup-specific patterns
      startup: [
        'founders@{domain}',
        'pitch@{domain}',
        'partnerships@{domain}',
        'media@{domain}',
        'press@{domain}',
        'investor@{domain}',
        'careers@{domain}'
      ],
      
      // AI/Tech specific
      tech: [
        'api@{domain}',
        'developers@{domain}',
        'engineering@{domain}',
        'product@{domain}',
        'demo@{domain}',
        'solutions@{domain}'
      ]
    };
    
    this.verifiedPatterns = new Map();
  }
  
  // Extract domain from URL
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch (e) {
      return null;
    }
  }
  
  // Check if domain has MX records (can receive email)
  async checkMXRecords(domain) {
    try {
      const mxRecords = await dns.resolveMx(domain);
      return mxRecords && mxRecords.length > 0;
    } catch (e) {
      return false;
    }
  }
  
  // Generate email variations
  generateEmailVariations(companyName, domain) {
    const emails = [];
    const cleanName = companyName.toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
    
    // Add company-specific patterns
    emails.push(`${cleanName}@${domain}`);
    emails.push(`hello@${cleanName}.com`);
    emails.push(`contact@${cleanName}.com`);
    
    // Add all pattern categories
    Object.values(this.patterns).forEach(patternList => {
      patternList.forEach(pattern => {
        emails.push(pattern.replace('{domain}', domain));
      });
    });
    
    // Remove duplicates
    return [...new Set(emails)];
  }
  
  // Try to find existing emails on the web for pattern discovery
  async discoverDomainPattern(domain, companyName) {
    console.log(`  → Analyzing email patterns for ${domain}...`);
    
    // Check if domain can receive emails
    const hasMX = await this.checkMXRecords(domain);
    if (!hasMX) {
      console.log(`  ⚠️  No MX records found for ${domain}`);
      return null;
    }
    
    // Try to find emails through web search (simulated)
    // In production, would use search APIs or web scraping
    const foundEmails = [];
    
    // For now, we'll use intelligent pattern matching
    const allPatterns = this.generateEmailVariations(companyName, domain);
    
    // Score patterns based on company type
    const scoredPatterns = allPatterns.map(email => {
      let score = 0.5;
      
      // Higher score for common business emails
      if (email.startsWith('info@') || email.startsWith('contact@')) {
        score += 0.3;
      }
      
      // Higher score for matching domain
      if (email.endsWith(`@${domain}`)) {
        score += 0.2;
      }
      
      // Tech companies often use hello@
      if (email.startsWith('hello@') && companyName.toLowerCase().includes('tech')) {
        score += 0.1;
      }
      
      return { email, score };
    });
    
    // Sort by score
    scoredPatterns.sort((a, b) => b.score - a.score);
    
    // Return top 5 most likely emails
    return scoredPatterns.slice(0, 5).map(p => p.email);
  }
  
  // Verify email format is valid
  isValidEmailFormat(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }
  
  // Find emails for a company
  async findCompanyEmails(company) {
    const domain = this.extractDomain(company.website);
    if (!domain) {
      return null;
    }
    
    const emails = await this.discoverDomainPattern(domain, company.name);
    
    if (!emails || emails.length === 0) {
      return null;
    }
    
    return {
      primary: emails[0],
      alternatives: emails.slice(1),
      domain: domain,
      hasMX: true,
      confidence: 0.7 // Base confidence for pattern-based emails
    };
  }
}

// Test the finder
async function testDomainEmailFinder() {
  const finder = new DomainEmailFinder();
  
  // Test companies
  const testCompanies = [
    { name: 'Clio', website: 'https://www.clio.com' },
    { name: 'Hootsuite', website: 'https://hootsuite.com' },
    { name: 'Shade AI', website: 'https://www.shade.ai' }
  ];
  
  console.log('🧪 Testing Domain Email Pattern Finder\n');
  
  for (const company of testCompanies) {
    console.log(`\nTesting ${company.name}...`);
    const result = await finder.findCompanyEmails(company);
    
    if (result) {
      console.log(`  ✅ Primary: ${result.primary}`);
      console.log(`  📧 Alternatives: ${result.alternatives.join(', ')}`);
      console.log(`  🌐 Domain: ${result.domain} (MX: ${result.hasMX ? 'Yes' : 'No'})`);
    } else {
      console.log(`  ❌ No emails found`);
    }
  }
}

// Export for use in other tools
module.exports = { DomainEmailFinder };

// Run test if called directly
if (require.main === module) {
  testDomainEmailFinder();
}