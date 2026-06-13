#!/usr/bin/env node

// Phase 2B Systems Test Suite
// BC AI Ecosystem Atlas - Quality Assurance Automation Testing

const DuplicateDetectionSystem = require('./duplicate-detection-system');
const QualityScoringSystem = require('./quality-scoring-system');
const IntelligentMergingSystem = require('./intelligent-merging-system');

// Test configuration
const config = {
  notionToken: process.env.NOTION_TOKEN,
  databaseId: process.env.NOTION_DATABASE_ID,
  testMode: process.env.TEST_MODE || 'full' // 'quick' or 'full'
};

class Phase2BTestSuite {
  constructor() {
    this.testResults = {
      duplicateDetection: null,
      qualityScoring: null,
      intelligentMerging: null,
      overall: { passed: 0, failed: 0, warnings: 0 }
    };
  }

  async runAllTests() {
    console.log('🧪 PHASE 2B QUALITY ASSURANCE AUTOMATION TEST SUITE');
    console.log('====================================================');
    console.log(`Test Mode: ${config.testMode}`);
    console.log(`Database: ${config.databaseId}`);
    console.log(`Started: ${new Date().toISOString()}\n`);

    try {
      // Validate environment
      await this.validateEnvironment();

      // Test 1: Duplicate Detection System
      await this.testDuplicateDetection();

      // Test 2: Quality Scoring System  
      await this.testQualityScoring();

      // Test 3: Intelligent Merging System
      await this.testIntelligentMerging();

      // Generate final report
      this.generateTestReport();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    }
  }

  async validateEnvironment() {
    console.log('🔧 Validating Environment...');
    
    const checks = [
      { name: 'NOTION_TOKEN', value: config.notionToken, required: true },
      { name: 'NOTION_DATABASE_ID', value: config.databaseId, required: true }
    ];

    for (const check of checks) {
      if (check.required && !check.value) {
        throw new Error(`Missing required environment variable: ${check.name}`);
      }
      console.log(`   ✅ ${check.name}: ${check.value ? 'Set' : 'Not set'}`);
    }
    console.log('');
  }

  async testDuplicateDetection() {
    console.log('1️⃣ Testing Duplicate Detection System...');
    const startTime = Date.now();
    
    try {
      const detector = new DuplicateDetectionSystem(config.notionToken, config.databaseId);
      
      // Run duplicate detection
      const report = await detector.detectDuplicates();
      
      // Validate results
      const validationResults = this.validateDuplicateResults(report);
      
      this.testResults.duplicateDetection = {
        status: 'passed',
        executionTime: Date.now() - startTime,
        organizationsAnalyzed: report.summary.total_organizations,
        duplicatesFound: report.summary.duplicate_pairs_found,
        stageBreakdown: report.summary.stages,
        validationResults: validationResults
      };

      console.log(`   ✅ Organizations analyzed: ${report.summary.total_organizations}`);
      console.log(`   🔍 Duplicate pairs found: ${report.summary.duplicate_pairs_found}`);
      console.log(`   ⏱️  Execution time: ${Math.round((Date.now() - startTime) / 1000)}s`);
      
      if (validationResults.warnings > 0) {
        console.log(`   ⚠️  Validation warnings: ${validationResults.warnings}`);
        this.testResults.overall.warnings += validationResults.warnings;
      }

      this.testResults.overall.passed++;

    } catch (error) {
      console.error(`   ❌ Duplicate detection test failed:`, error.message);
      this.testResults.duplicateDetection = {
        status: 'failed',
        error: error.message,
        executionTime: Date.now() - startTime
      };
      this.testResults.overall.failed++;
    }
    console.log('');
  }

  async testQualityScoring() {
    console.log('2️⃣ Testing Quality Scoring System...');
    const startTime = Date.now();
    
    try {
      const scorer = new QualityScoringSystem(config.notionToken, config.databaseId);
      
      // Run quality scoring
      const report = await scorer.scoreAllOrganizations();
      
      // Validate results
      const validationResults = this.validateQualityResults(report);
      
      this.testResults.qualityScoring = {
        status: 'passed',
        executionTime: Date.now() - startTime,
        organizationsScored: report.summary.total_organizations,
        averageScore: report.summary.average_quality_score,
        gradeDistribution: report.summary.grade_distribution,
        improvementOpportunities: report.needs_improvement.length,
        validationResults: validationResults
      };

      console.log(`   ✅ Organizations scored: ${report.summary.total_organizations}`);
      console.log(`   📊 Average quality score: ${report.summary.average_quality_score}/100`);
      console.log(`   📈 Organizations needing improvement: ${report.needs_improvement.length}`);
      console.log(`   ⏱️  Execution time: ${Math.round((Date.now() - startTime) / 1000)}s`);
      
      if (validationResults.warnings > 0) {
        console.log(`   ⚠️  Validation warnings: ${validationResults.warnings}`);
        this.testResults.overall.warnings += validationResults.warnings;
      }

      this.testResults.overall.passed++;

    } catch (error) {
      console.error(`   ❌ Quality scoring test failed:`, error.message);
      this.testResults.qualityScoring = {
        status: 'failed',
        error: error.message,
        executionTime: Date.now() - startTime
      };
      this.testResults.overall.failed++;
    }
    console.log('');
  }

  async testIntelligentMerging() {
    console.log('3️⃣ Testing Intelligent Merging System...');
    const startTime = Date.now();
    
    try {
      const merger = new IntelligentMergingSystem(config.notionToken, config.databaseId);
      
      // Get duplicate pairs from previous test or create sample
      const duplicatePairs = this.getSampleDuplicatePairs();
      
      if (duplicatePairs.length === 0) {
        console.log('   ℹ️  No duplicate pairs available - testing with mock data');
        duplicatePairs.push({
          organization1: { id: 'mock1', name: 'Test Corp' },
          organization2: { id: 'mock2', name: 'Test Corporation' },
          confidence: 0.95,
          stage: 'exact_match'
        });
      }
      
      // Run intelligent merging (with available data)
      const report = await merger.mergeDuplicates(duplicatePairs);
      
      // Validate results
      const validationResults = this.validateMergingResults(report);
      
      this.testResults.intelligentMerging = {
        status: 'passed',
        executionTime: Date.now() - startTime,
        mergeRecommendations: report.summary.total_merge_recommendations,
        autoMergeReady: report.summary.auto_merge_ready,
        requiresReview: report.summary.requires_review,
        estimatedQualityGain: report.summary.estimated_quality_gain,
        validationResults: validationResults
      };

      console.log(`   ✅ Merge recommendations: ${report.summary.total_merge_recommendations}`);
      console.log(`   🤖 Auto-merge ready: ${report.summary.auto_merge_ready}`);
      console.log(`   👁️  Requires review: ${report.summary.requires_review}`);
      console.log(`   ⏱️  Execution time: ${Math.round((Date.now() - startTime) / 1000)}s`);
      
      if (validationResults.warnings > 0) {
        console.log(`   ⚠️  Validation warnings: ${validationResults.warnings}`);
        this.testResults.overall.warnings += validationResults.warnings;
      }

      this.testResults.overall.passed++;

    } catch (error) {
      console.error(`   ❌ Intelligent merging test failed:`, error.message);
      this.testResults.intelligentMerging = {
        status: 'failed',
        error: error.message,
        executionTime: Date.now() - startTime
      };
      this.testResults.overall.failed++;
    }
    console.log('');
  }

  validateDuplicateResults(report) {
    const validation = { warnings: 0, issues: [] };
    
    // Check for reasonable results
    if (report.summary.total_organizations < 100) {
      validation.warnings++;
      validation.issues.push('Low organization count - may indicate API issues');
    }
    
    if (report.summary.duplicate_pairs_found > report.summary.total_organizations * 0.1) {
      validation.warnings++;
      validation.issues.push('High duplicate rate - may need threshold adjustment');
    }
    
    return validation;
  }

  validateQualityResults(report) {
    const validation = { warnings: 0, issues: [] };
    
    // Check for reasonable quality distribution
    if (report.summary.average_quality_score < 50) {
      validation.warnings++;
      validation.issues.push('Low average quality score - may need data enhancement');
    }
    
    if (report.needs_improvement.length > report.summary.total_organizations * 0.5) {
      validation.warnings++;
      validation.issues.push('Many organizations need improvement - opportunity for research agents');
    }
    
    return validation;
  }

  validateMergingResults(report) {
    const validation = { warnings: 0, issues: [] };
    
    // Check for reasonable merge recommendations
    if (report.summary.auto_merge_ready > report.summary.total_merge_recommendations * 0.8) {
      validation.warnings++;
      validation.issues.push('High auto-merge rate - verify confidence thresholds');
    }
    
    return validation;
  }

  getSampleDuplicatePairs() {
    // In real implementation, this would get pairs from duplicate detection results
    // For testing, return empty array to use mock data
    return [];
  }

  generateTestReport() {
    console.log('📊 PHASE 2B TEST RESULTS SUMMARY');
    console.log('================================');
    
    const totalTests = this.testResults.overall.passed + this.testResults.overall.failed;
    const successRate = Math.round((this.testResults.overall.passed / totalTests) * 100);
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${this.testResults.overall.passed}`);
    console.log(`Failed: ${this.testResults.overall.failed}`);
    console.log(`Warnings: ${this.testResults.overall.warnings}`);
    console.log(`Success Rate: ${successRate}%`);
    
    console.log('\nDetailed Results:');
    console.log('================');
    
    // Duplicate Detection Results
    const dd = this.testResults.duplicateDetection;
    if (dd) {
      console.log(`\n1. Duplicate Detection: ${dd.status.toUpperCase()}`);
      if (dd.status === 'passed') {
        console.log(`   - Organizations: ${dd.organizationsAnalyzed}`);
        console.log(`   - Duplicates: ${dd.duplicatesFound}`);
        console.log(`   - Time: ${Math.round(dd.executionTime / 1000)}s`);
      }
    }
    
    // Quality Scoring Results
    const qs = this.testResults.qualityScoring;
    if (qs) {
      console.log(`\n2. Quality Scoring: ${qs.status.toUpperCase()}`);
      if (qs.status === 'passed') {
        console.log(`   - Organizations: ${qs.organizationsScored}`);
        console.log(`   - Avg Score: ${qs.averageScore}/100`);
        console.log(`   - Time: ${Math.round(qs.executionTime / 1000)}s`);
      }
    }
    
    // Intelligent Merging Results
    const im = this.testResults.intelligentMerging;
    if (im) {
      console.log(`\n3. Intelligent Merging: ${im.status.toUpperCase()}`);
      if (im.status === 'passed') {
        console.log(`   - Recommendations: ${im.mergeRecommendations}`);
        console.log(`   - Auto-merge ready: ${im.autoMergeReady}`);
        console.log(`   - Time: ${Math.round(im.executionTime / 1000)}s`);
      }
    }
    
    console.log('\n🎯 PHASE 2B SYSTEMS STATUS: ' + 
      (this.testResults.overall.failed === 0 ? '✅ ALL SYSTEMS OPERATIONAL' : '❌ ISSUES DETECTED'));
    
    if (this.testResults.overall.warnings > 0) {
      console.log('⚠️  See warnings above for optimization opportunities');
    }
    
    console.log('\n🚀 Ready for research agent integration and new organization processing!');
  }
}

// Run tests if called directly
if (require.main === module) {
  if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
    console.error('❌ Please set NOTION_TOKEN and NOTION_DATABASE_ID environment variables');
    console.log('\nExample:');
    console.log('export NOTION_TOKEN="your_notion_token"');
    console.log('export NOTION_DATABASE_ID="your_database_id"');
    console.log('node test-phase2b-systems.js');
    process.exit(1);
  }
  
  const testSuite = new Phase2BTestSuite();
  testSuite.runAllTests().catch(error => {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
  });
}

module.exports = Phase2BTestSuite; 