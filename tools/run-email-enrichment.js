#!/usr/bin/env node
/**
 * Email Enrichment Pipeline with Validation
 * Finds emails for companies and validates before database insertion
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Email Enrichment Pipeline with Validation\n');

// Configuration
const NOTION_TOKEN = process.env.NOTION_TOKEN || '<REDACTED_NOTION_TOKEN>';
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || '1f0c6f799a3381bd8332ca0235c24655';
const BATCH_SIZE = 10;

// Create directories
const dataDir = path.join(__dirname, '../data/email-enrichment');
const reportsDir = path.join(__dirname, '../reports');
[dataDir, reportsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

try {
  console.log('📧 Step 1: Finding companies needing email addresses...');
  execSync(
    `NOTION_TOKEN=${NOTION_TOKEN} NOTION_DATABASE_ID=${NOTION_DATABASE_ID} ` +
    `node tools/04-research/find-and-research-missing-emails.js`,
    { stdio: 'inherit' }
  );

  console.log('\n🔍 Step 2: Running advanced email finder (limited batch)...');
  const timestamp = new Date().toISOString().split('T')[0];
  const emailDataFile = path.join(dataDir, `email-discoveries-${timestamp}.json`);
  
  // Run email finder but save to file instead of updating database
  execSync(
    `NOTION_TOKEN=${NOTION_TOKEN} NOTION_DATABASE_ID=${NOTION_DATABASE_ID} ` +
    `node tools/04-research/advanced-email-finder.js --limit=${BATCH_SIZE} --output=${emailDataFile}`,
    { stdio: 'inherit' }
  );

  console.log('\n✅ Step 3: Validating discovered emails...');
  const validatedFile = path.join(dataDir, `email-validated-${timestamp}.json`);
  
  execSync(
    `node tools/03-enrichment/validate-intelligence.js ` +
    `--input=${emailDataFile} --output=${validatedFile}`,
    { stdio: 'inherit' }
  );

  console.log('\n📊 Step 4: Reviewing validation results...');
  const validationReport = fs.readFileSync(
    path.join(reportsDir, `${timestamp}_validation-report.md`), 
    'utf8'
  );
  
  // Check for critical issues
  if (validationReport.includes('❌')) {
    console.log('⚠️  Critical issues found! Please review the validation report.');
    console.log('📄 Report location:', path.join(reportsDir, `${timestamp}_validation-report.md`));
    process.exit(1);
  }

  console.log('\n🚀 Step 5: Ready to apply validated emails to database');
  console.log('To apply the changes, run:');
  console.log(`node tools/03-enrichment/apply-validated-intelligence.js --updates=${validatedFile} --no-dryrun`);

} catch (error) {
  console.error('❌ Pipeline failed:', error.message);
  process.exit(1);
}

console.log('\n✨ Email enrichment pipeline complete!');