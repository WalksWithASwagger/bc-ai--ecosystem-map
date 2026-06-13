#!/usr/bin/env node

/**
 * Process url-discovery-consolidated.csv
 * Add website URLs to companies missing them
 */

const { Client } = require('@notionhq/client');
const fs = require('fs');

const notion = new Client({ auth: 'process.env.NOTION_TOKEN' });
const databaseId = '1f0c6f799a3381bd8332ca0235c24655';

class UrlDiscoveryProcessor {
  constructor() {
    this.results = {
      processed: 0,
      successful: 0,
      failed: 0,
      companies: [],
      errors: []
    };
  }

  async execute() {
    console.log('🔄 PROCESSING URL DISCOVERY CSV');
    
    // Read and parse CSV
    const csvContent = fs.readFileSync('data/imports/url-discovery-consolidated.csv', 'utf8');
    const companies = this.parseCSV(csvContent);
    
    console.log(`📊 Found ${companies.length} companies with website URLs`);
    
    // Process each company
    for (const company of companies) {
      console.log(`\\n📄 Processing: ${company.name}`);
      const result = await this.processCompany(company);
      
      this.results.processed++;
      if (result.success) {
        this.results.successful++;
        console.log(`   ✅ Website URL added`);
      } else {
        this.results.failed++;
        console.log(`   ❌ Failed: ${result.reason}`);
        this.results.errors.push({
          name: company.name,
          error: result.reason
        });
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    
    this.generateResults();
    return this.results;
  }

  parseCSV(csvContent) {
    const lines = csvContent.split('\\n');
    const companies = [];
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const [name, url, notes] = this.parseCSVLine(line);
      if (name && url) {
        companies.push({ name, url, notes });
      }
    }
    
    return companies;
  }

  parseCSVLine(line) {
    // Handle CSV with potential commas in quoted strings
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    
    return result;
  }

  async processCompany(company) {
    try {
      // Find company in database
      const dbCompany = await this.findCompany(company.name);
      if (!dbCompany) {
        return { success: false, reason: 'Not found in database' };
      }
      
      // Check if website is already set
      const existingWebsite = dbCompany.properties.Website?.url;
      if (existingWebsite) {
        return { success: false, reason: 'Website already exists' };
      }
      
      // Validate URL
      if (!this.isValidUrl(company.url)) {
        return { success: false, reason: 'Invalid URL format' };
      }
      
      // Update with website URL
      await notion.pages.update({
        page_id: dbCompany.id,
        properties: {
          'Website': { url: company.url }
        }
      });
      
      this.results.companies.push({
        name: company.name,
        website: company.url,
        notes: company.notes
      });
      
      return { success: true };
      
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  async findCompany(searchName) {
    try {
      // Clean up search name
      const cleanName = searchName
        .replace(/\\s*\\([^)]*\\)/g, '') // Remove parentheses content
        .replace(/\\s*(Vancouver|Canada|BC|Ltd|Inc|Corp)\\s*$/i, '') // Remove location/legal suffixes
        .trim();
      
      const response = await notion.databases.query({
        database_id: databaseId,
        filter: {
          property: 'Name',
          title: {
            contains: cleanName
          }
        },
        page_size: 5
      });
      
      // Find exact or best match
      return response.results.find(page => {
        const title = page.properties.Name?.title?.[0]?.text?.content || '';
        const titleLower = title.toLowerCase();
        const searchLower = cleanName.toLowerCase();
        
        return titleLower.includes(searchLower) || 
               searchLower.includes(titleLower) ||
               this.fuzzyMatch(titleLower, searchLower);
      }) || response.results[0];
      
    } catch (error) {
      console.error(`Error finding company ${searchName}:`, error.message);
      return null;
    }
  }

  fuzzyMatch(str1, str2) {
    // Simple fuzzy matching for company names
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');
    
    let matches = 0;
    for (const word1 of words1) {
      if (word1.length > 3) { // Only check words longer than 3 chars
        for (const word2 of words2) {
          if (word2.includes(word1) || word1.includes(word2)) {
            matches++;
            break;
          }
        }
      }
    }
    
    return matches >= Math.min(words1.length, words2.length) / 2;
  }

  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  generateResults() {
    const report = {
      timestamp: new Date().toISOString(),
      execution: 'URL_DISCOVERY_PROCESSING',
      summary: {
        processed: this.results.processed,
        successful: this.results.successful,
        failed: this.results.failed,
        successRate: `${Math.round((this.results.successful / this.results.processed) * 100)}%`
      },
      companiesUpdated: this.results.companies,
      errors: this.results.errors.slice(0, 20)
    };
    
    const reportPath = 'data/reports/url-discovery-processing-results.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\\n📊 URL DISCOVERY PROCESSING COMPLETE');
    console.log(`✅ Websites added: ${this.results.successful}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Success rate: ${report.summary.successRate}`);
    console.log(`📄 Results: ${reportPath}`);
  }
}

// Execute
const processor = new UrlDiscoveryProcessor();
processor.execute().catch(console.error);