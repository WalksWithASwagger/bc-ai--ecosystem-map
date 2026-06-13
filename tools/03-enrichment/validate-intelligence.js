#!/usr/bin/env node
/**
 * Intelligence Validation Tool
 * Cross-references data from multiple sources and identifies conflicts
 * Provides confidence scoring and validation reports
 * 
 * Usage: node tools/enhancement/validate-intelligence.js --input=path/to/data.json
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// Parse arguments
const args = process.argv.slice(2);
const options = {
  inputFile: null,
  checkUrls: true,
  outputReport: true
};

args.forEach(arg => {
  if (arg.startsWith('--input=')) {
    options.inputFile = arg.split('=')[1];
  } else if (arg === '--no-url-check') {
    options.checkUrls = false;
  }
});

if (!options.inputFile) {
  console.error('❌ Error: --input parameter required');
  console.error('Usage: node validate-intelligence.js --input=path/to/data.json');
  process.exit(1);
}

// Validation rules
const ValidationRules = {
  funding: {
    patterns: [
      /\$?([\d.]+)\s*([MBK])/i,
      /series\s*([A-Z])/i,
      /(seed|pre-seed)/i
    ],
    validate: (value) => {
      const amount = value.match(/\$?([\d.]+)\s*([MBK])/i);
      if (!amount) return { valid: false, reason: 'No valid amount format found' };
      
      const num = parseFloat(amount[1]);
      const unit = amount[2].toUpperCase();
      
      // Sanity checks
      if (unit === 'K' && num > 999) {
        return { valid: false, reason: 'Suspicious: Amount in K exceeds 999' };
      }
      if (unit === 'M' && num > 9999) {
        return { valid: false, reason: 'Suspicious: Amount in M exceeds 9999' };
      }
      if (unit === 'B' && num > 999) {
        return { valid: false, reason: 'Suspicious: Amount in B exceeds 999' };
      }
      
      return { valid: true };
    }
  },
  
  employees: {
    patterns: [
      /(\d+)\+?\s*(employees?|people|staff)/i,
      /(\d+)\s*-\s*(\d+)/
    ],
    validate: (value) => {
      const match = value.match(/(\d+)/);
      if (!match) return { valid: false, reason: 'No number found' };
      
      const count = parseInt(match[1]);
      if (count < 1) return { valid: false, reason: 'Employee count less than 1' };
      if (count > 1000000) return { valid: false, reason: 'Employee count unrealistic' };
      
      return { valid: true };
    }
  },
  
  yearFounded: {
    patterns: [/\d{4}/],
    validate: (value) => {
      const year = parseInt(value);
      const currentYear = new Date().getFullYear();
      
      if (year < 1900) return { valid: false, reason: 'Year before 1900' };
      if (year > currentYear) return { valid: false, reason: 'Year in the future' };
      
      return { valid: true };
    }
  },
  
  revenue: {
    patterns: [
      /\$?([\d.]+)\s*([MBK])/i,
      /(ARR|MRR|annual revenue)/i
    ],
    validate: (value) => {
      // Similar to funding validation
      const amount = value.match(/\$?([\d.]+)\s*([MBK])/i);
      if (!amount) return { valid: false, reason: 'No valid amount format found' };
      
      return { valid: true };
    }
  }
};

// Cross-reference analyzer
class IntelligenceValidator {
  constructor(data) {
    this.data = data;
    this.validationResults = [];
    this.conflicts = [];
    this.recommendations = [];
  }

  async validate() {
    console.log('🔍 Starting intelligence validation...\n');
    
    for (const entry of this.data) {
      console.log(`📊 Validating: ${entry.organization}`);
      
      const result = {
        organization: entry.organization,
        organizationId: entry.organizationId,
        validatedData: {},
        issues: [],
        urlChecks: {}
      };
      
      // Validate each data category
      for (const [category, data] of Object.entries(entry.data || {})) {
        const validation = await this.validateCategory(category, data, entry.organization);
        if (validation.isValid) {
          result.validatedData[category] = validation.data;
        } else {
          result.issues.push(...validation.issues);
        }
      }
      
      // Check source URLs if enabled
      if (options.checkUrls) {
        await this.checkSourceUrls(entry, result);
      }
      
      // Look for data conflicts
      this.detectConflicts(entry, result);
      
      // Generate recommendations
      this.generateRecommendations(result);
      
      this.validationResults.push(result);
    }
  }

  async validateCategory(category, data, orgName) {
    const validation = {
      isValid: true,
      data: data,
      issues: []
    };
    
    // Get validation rules for this category
    const rules = ValidationRules[category];
    if (!rules) {
      // No specific rules for this category
      return validation;
    }
    
    // Handle both single items and arrays
    const items = Array.isArray(data) ? data : [data];
    
    for (const item of items) {
      // Validate the value format
      const valueValidation = rules.validate(item.value);
      if (!valueValidation.valid) {
        validation.issues.push({
          category,
          value: item.value,
          issue: valueValidation.reason,
          severity: 'warning'
        });
      }
      
      // Check source credibility
      const sourceCredibility = this.assessSourceCredibility(item.source);
      if (sourceCredibility.score < 5) {
        validation.issues.push({
          category,
          source: item.source.url,
          issue: `Low source credibility: ${sourceCredibility.reason}`,
          severity: 'info'
        });
      }
      
      // Check data freshness
      if (category === 'employees' || category === 'revenue') {
        const freshness = this.checkDataFreshness(item);
        if (!freshness.isFresh) {
          validation.issues.push({
            category,
            value: item.value,
            issue: freshness.reason,
            severity: 'warning'
          });
        }
      }
    }
    
    validation.isValid = validation.issues.filter(i => i.severity === 'error').length === 0;
    return validation;
  }

  assessSourceCredibility(source) {
    const credibilityScores = {
      'crunchbase': 9,
      'linkedin': 8,
      'company website': 7,
      'press release': 8,
      'techcrunch': 7,
      'venturebeat': 7,
      'news article': 5,
      'industry report': 6,
      'other': 3
    };
    
    let score = 3; // default
    let reason = 'Unknown source type';
    
    const sourceType = (source.type || '').toLowerCase();
    
    for (const [key, value] of Object.entries(credibilityScores)) {
      if (sourceType.includes(key)) {
        score = value;
        reason = `${source.type} credibility: ${score}/10`;
        break;
      }
    }
    
    // Boost score for recent access
    const accessDate = new Date(source.accessDate);
    const daysSince = (new Date() - accessDate) / (1000 * 60 * 60 * 24);
    if (daysSince < 7) {
      score += 0.5;
      reason += ' (recently verified)';
    }
    
    return { score, reason };
  }

  checkDataFreshness(item) {
    // Check if data has a date indicator
    const dateMatch = item.value.match(/\b(20\d{2})\b/);
    if (!dateMatch) {
      return { isFresh: true }; // Can't determine, assume fresh
    }
    
    const dataYear = parseInt(dateMatch[1]);
    const currentYear = new Date().getFullYear();
    const age = currentYear - dataYear;
    
    if (age > 2) {
      return {
        isFresh: false,
        reason: `Data from ${dataYear} is ${age} years old`
      };
    }
    
    return { isFresh: true };
  }

  async checkSourceUrls(entry, result) {
    console.log('  🔗 Checking source URLs...');
    
    const urls = new Set();
    
    // Collect all URLs
    Object.values(entry.data || {}).forEach(data => {
      const items = Array.isArray(data) ? data : [data];
      items.forEach(item => {
        if (item.source && item.source.url) {
          urls.add(item.source.url);
        }
      });
    });
    
    // Check each URL
    for (const url of urls) {
      try {
        const response = await axios.head(url, {
          timeout: 5000,
          validateStatus: () => true
        });
        
        result.urlChecks[url] = {
          status: response.status,
          valid: response.status >= 200 && response.status < 400
        };
        
        if (!result.urlChecks[url].valid) {
          result.issues.push({
            type: 'source',
            url: url,
            issue: `Source URL returned status ${response.status}`,
            severity: 'warning'
          });
        }
      } catch (error) {
        result.urlChecks[url] = {
          status: 'error',
          valid: false,
          error: error.message
        };
        
        result.issues.push({
          type: 'source',
          url: url,
          issue: `Failed to verify source: ${error.message}`,
          severity: 'info'
        });
      }
    }
  }

  detectConflicts(entry, result) {
    // Look for conflicting data within the same category
    Object.entries(entry.data || {}).forEach(([category, data]) => {
      if (Array.isArray(data) && data.length > 1) {
        // Compare values
        const uniqueValues = new Set(data.map(d => this.normalizeValue(d.value, category)));
        
        if (uniqueValues.size > 1) {
          this.conflicts.push({
            organization: entry.organization,
            category,
            values: Array.from(uniqueValues),
            sources: data.map(d => d.source.type)
          });
          
          result.issues.push({
            category,
            issue: `Conflicting values found: ${Array.from(uniqueValues).join(' vs ')}`,
            severity: 'warning'
          });
        }
      }
    });
  }

  normalizeValue(value, category) {
    if (category === 'funding' || category === 'revenue') {
      // Extract numeric value
      const match = value.match(/\$?([\d.]+)\s*([MBK])/i);
      if (match) {
        const num = parseFloat(match[1]);
        const mult = match[2].toUpperCase() === 'B' ? 1000 : 
                     match[2].toUpperCase() === 'K' ? 0.001 : 1;
        return `$${num * mult}M`;
      }
    }
    return value.toLowerCase().trim();
  }

  generateRecommendations(result) {
    const recs = [];
    
    // Check for missing critical data
    const critical = ['funding', 'employees', 'yearFounded'];
    critical.forEach(field => {
      if (!result.validatedData[field]) {
        recs.push(`Missing ${field} - search Crunchbase or LinkedIn`);
      }
    });
    
    // Check for old data
    result.issues.filter(i => i.issue.includes('years old')).forEach(issue => {
      recs.push(`Update ${issue.category} with more recent data`);
    });
    
    // Check for single-source data
    Object.entries(result.validatedData).forEach(([category, data]) => {
      const items = Array.isArray(data) ? data : [data];
      if (items.length === 1) {
        recs.push(`Verify ${category} with additional source`);
      }
    });
    
    if (recs.length > 0) {
      this.recommendations.push({
        organization: result.organization,
        recommendations: recs
      });
    }
  }

  generateReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(__dirname, '../../data/reports', `${timestamp}_validation-report.md`);
    
    let report = `# Intelligence Validation Report\n\n`;
    report += `*Generated: ${new Date().toLocaleString()}*\n`;
    report += `*Organizations Validated: ${this.validationResults.length}*\n\n`;
    
    // Summary
    const totalIssues = this.validationResults.reduce((sum, r) => sum + r.issues.length, 0);
    const criticalIssues = this.validationResults.reduce((sum, r) => 
      sum + r.issues.filter(i => i.severity === 'error').length, 0);
    
    report += `## 📊 Summary\n\n`;
    report += `- **Total Issues Found**: ${totalIssues}\n`;
    report += `- **Critical Issues**: ${criticalIssues}\n`;
    report += `- **Data Conflicts**: ${this.conflicts.length}\n`;
    report += `- **Organizations with Issues**: ${this.validationResults.filter(r => r.issues.length > 0).length}\n\n`;
    
    // Conflicts
    if (this.conflicts.length > 0) {
      report += `## ⚠️ Data Conflicts\n\n`;
      this.conflicts.forEach(conflict => {
        report += `### ${conflict.organization} - ${conflict.category}\n`;
        report += `Conflicting values: ${conflict.values.join(' vs ')}\n`;
        report += `Sources: ${conflict.sources.join(', ')}\n\n`;
      });
    }
    
    // Detailed validation results
    report += `## 🔍 Detailed Validation Results\n\n`;
    
    this.validationResults.forEach(result => {
      report += `### ${result.organization}\n\n`;
      
      if (result.issues.length === 0) {
        report += `✅ All data validated successfully\n\n`;
      } else {
        report += `**Issues Found**: ${result.issues.length}\n\n`;
        
        // Group issues by severity
        const bySeverity = { error: [], warning: [], info: [] };
        result.issues.forEach(issue => {
          bySeverity[issue.severity].push(issue);
        });
        
        ['error', 'warning', 'info'].forEach(severity => {
          if (bySeverity[severity].length > 0) {
            const icon = severity === 'error' ? '❌' : severity === 'warning' ? '⚠️' : 'ℹ️';
            report += `#### ${icon} ${severity.toUpperCase()}S\n`;
            bySeverity[severity].forEach(issue => {
              report += `- ${issue.issue}\n`;
              if (issue.category) report += `  - Category: ${issue.category}\n`;
              if (issue.value) report += `  - Value: ${issue.value}\n`;
              if (issue.url) report += `  - URL: ${issue.url}\n`;
            });
            report += `\n`;
          }
        });
      }
      
      // URL check results
      const urlCount = Object.keys(result.urlChecks).length;
      if (urlCount > 0) {
        const validUrls = Object.values(result.urlChecks).filter(u => u.valid).length;
        report += `**Source URL Verification**: ${validUrls}/${urlCount} accessible\n\n`;
      }
    });
    
    // Recommendations
    if (this.recommendations.length > 0) {
      report += `## 💡 Recommendations\n\n`;
      this.recommendations.forEach(rec => {
        report += `### ${rec.organization}\n`;
        rec.recommendations.forEach(r => {
          report += `- ${r}\n`;
        });
        report += `\n`;
      });
    }
    
    // Write report
    const dir = path.dirname(reportPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, report);
    console.log(`\n📄 Validation report saved to: ${reportPath}`);
    
    // Generate clean validated data
    const validatedData = this.validationResults
      .filter(r => r.issues.filter(i => i.severity === 'error').length === 0)
      .map(r => ({
        organization: r.organization,
        organizationId: r.organizationId,
        validatedData: r.validatedData
      }));
    
    const validatedPath = reportPath.replace('-report.md', '-validated.json');
    fs.writeFileSync(validatedPath, JSON.stringify(validatedData, null, 2));
    console.log(`📝 Validated data saved to: ${validatedPath}`);
    
    return { reportPath, validatedPath };
  }
}

// Main execution
async function main() {
  console.log('🔍 Intelligence Validation Tool');
  console.log('==============================\n');
  
  // Load input data
  let inputData;
  try {
    const content = fs.readFileSync(options.inputFile, 'utf8');
    inputData = JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error loading input file: ${error.message}`);
    process.exit(1);
  }
  
  // Ensure it's an array
  if (!Array.isArray(inputData)) {
    inputData = [inputData];
  }
  
  console.log(`📊 Loaded ${inputData.length} organizations for validation\n`);
  
  // Run validation
  const validator = new IntelligenceValidator(inputData);
  await validator.validate();
  
  // Generate report
  const { reportPath, validatedPath } = validator.generateReport();
  
  // Summary
  console.log('\n✨ Validation complete!');
  console.log(`   📊 Organizations processed: ${validator.validationResults.length}`);
  console.log(`   ⚠️  Issues found: ${validator.validationResults.reduce((sum, r) => sum + r.issues.length, 0)}`);
  console.log(`   🔄 Conflicts detected: ${validator.conflicts.length}`);
  
  if (validator.conflicts.length > 0) {
    console.log('\n⚠️  Data conflicts require manual review');
  }
  
  console.log('\nNext steps:');
  console.log('1. Review the validation report');
  console.log('2. Resolve any conflicts or critical issues');
  console.log('3. Apply validated data using:');
  console.log(`   node tools/enhancement/apply-validated-intelligence.js --updates=${validatedPath}`);
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});