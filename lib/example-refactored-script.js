#!/usr/bin/env node

/**
 * Example Refactored Script
 * Shows how to use shared utilities instead of duplicating code
 *
 * BEFORE: 200+ lines with duplicated Notion setup, error handling, etc.
 * AFTER: 50 lines focused on business logic
 */

const {
  notion,
  databaseIds,
  queryDatabaseAll,
  batchUpdatePages,
  withRetry
} = require('../lib/notion-client');
const { validateEmail, validateUrl } = require('../lib/validators');
const { log, logError, logSuccess } = require('../lib/logger');

async function enrichCompaniesWithMissingEmails() {
  log('🔍 Finding companies with missing emails...');

  try {
    // Query companies missing emails (using shared function)
    const companies = await queryDatabaseAll(
      databaseIds.aiCompanies,
      {
        and: [
          { property: 'Website', url: { is_not_empty: true } },
          { property: 'Email', email: { is_empty: true } }
        ]
      },
      [{ property: 'Year Founded', direction: 'descending' }]
    );

    log(`📊 Found ${companies.length} companies needing email enrichment`);

    // Process companies
    const updates = [];
    for (const company of companies) {
      const companyName = company.properties.Name?.title?.[0]?.plain_text || 'Unknown';
      const website = company.properties.Website?.url;

      if (!validateUrl(website)) {
        logError(`Invalid website for ${companyName}: ${website}`);
        continue;
      }

      // Find email (simplified - would call research function)
      const email = await findCompanyEmail(website, companyName);

      if (email && validateEmail(email)) {
        updates.push({
          pageId: company.id,
          properties: {
            Email: { email },
            'Last Updated': {
              date: { start: new Date().toISOString() }
            }
          }
        });
        log(`✅ Found email for ${companyName}: ${email}`);
      }
    }

    // Batch update all companies (using shared function)
    if (updates.length > 0) {
      log(`📝 Updating ${updates.length} companies...`);
      const results = await batchUpdatePages(updates, {
        batchSize: 10,
        delayMs: 200
      });

      logSuccess(`Successfully updated ${results.success.length} companies`);
      if (results.failed.length > 0) {
        logError(`Failed to update ${results.failed.length} companies`);
      }
    } else {
      log('No emails found to update');
    }

  } catch (error) {
    logError('Script failed:', error);
    process.exit(1);
  }
}

async function findCompanyEmail(website, companyName) {
  // Simplified email finding logic
  // In reality, would call web scraping utilities
  return `info@${new URL(website).hostname}`;
}

// Run if called directly
if (require.main === module) {
  enrichCompaniesWithMissingEmails()
    .then(() => {
      logSuccess('🎉 Email enrichment complete!');
      process.exit(0);
    })
    .catch(error => {
      logError('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { enrichCompaniesWithMissingEmails };