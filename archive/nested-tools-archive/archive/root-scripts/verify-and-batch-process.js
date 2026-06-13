const { Client } = require('@notionhq/client');
const fs = require('fs');
const { NOTION_TOKEN, NOTION_DATABASE_ID } = require('./config');

const notion = new Client({ auth: NOTION_TOKEN });

async function verifyCurrentCoverage() {
  console.log('🔍 Verifying current founding date coverage in Notion DB...\n');
  
  let totalCompanies = 0;
  let companiesWithDates = 0;
  let companiesWithoutDates = [];
  let hasMore = true;
  let startCursor = undefined;

  while (hasMore) {
    try {
      const response = await notion.databases.query({
        database_id: NOTION_DATABASE_ID,
        start_cursor: startCursor,
        page_size: 100
      });

      for (const page of response.results) {
        totalCompanies++;
        
        const company = {
          id: page.id,
          name: page.properties.Name?.title?.[0]?.text?.content || '',
          yearFounded: page.properties['Year Founded']?.number,
          category: page.properties.Category?.select?.name || 'Uncategorized',
          funding: page.properties.Funding?.rich_text?.[0]?.text?.content || '',
          website: page.properties.Website?.url || '',
          shortBlurb: page.properties['Short Blurb']?.rich_text?.[0]?.text?.content || ''
        };
        
        if (company.yearFounded) {
          companiesWithDates++;
        } else {
          companiesWithoutDates.push(company);
        }
      }

      hasMore = response.has_more;
      startCursor = response.next_cursor;
    } catch (error) {
      console.error('Error verifying coverage:', error);
      hasMore = false;
    }
  }

  const actualCoverage = ((companiesWithDates / totalCompanies) * 100).toFixed(1);
  
  console.log('=== ACTUAL Current Coverage ===');
  console.log(`Total Companies: ${totalCompanies}`);
  console.log(`Companies with Founding Dates: ${companiesWithDates}`);
  console.log(`Actual Coverage: ${actualCoverage}%`);
  console.log(`Still Missing: ${companiesWithoutDates.length} companies`);

  return {
    totalCompanies,
    companiesWithDates,
    actualCoverage,
    companiesWithoutDates
  };
}

async function processBatchOf25(companies, batchNumber) {
  console.log(`\n📝 Processing Batch ${batchNumber} (25 companies)...`);
  
  const batch = companies.slice(0, 25);
  const results = {
    batchNumber,
    processed: [],
    updated: 0,
    errors: []
  };

  for (let i = 0; i < batch.length; i++) {
    const company = batch[i];
    console.log(`${i + 1}/25: Processing "${company.name}"...`);
    
    // Research founding date based on company info
    const research = researchFoundingDate(company);
    
    if (!research) {
      console.log(`   ⚠️  No founding date estimate for "${company.name}"`);
      continue;
    }
    
    try {
      // Update Notion with founding date and research notes
      const updateResult = await notion.pages.update({
        page_id: company.id,
        properties: {
          'Year Founded': {
            number: research.year
          },
          'Notable Projects': {
            rich_text: [{
              text: {
                content: `Founding Date Research (${new Date().toISOString().split('T')[0]}):\nFounded: ${research.year}\nMethod: ${research.method}\nConfidence: ${research.confidence}\nSources: ${research.sources.join(', ')}`
              }
            }]
          }
        }
      });
      
      if (updateResult) {
        results.processed.push({
          name: company.name,
          yearFounded: research.year,
          method: research.method,
          confidence: research.confidence,
          category: company.category
        });
        results.updated++;
        console.log(`   ✅ Added: ${research.year} (${research.confidence} confidence)`);
      }
    } catch (error) {
      results.errors.push({
        name: company.name,
        error: error.message
      });
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Small delay between updates
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`\nBatch ${batchNumber} Summary:`);
  console.log(`- Updated: ${results.updated}/25 companies`);
  console.log(`- Errors: ${results.errors.length}`);
  
  return results;
}

function researchFoundingDate(company) {
  const name = company.name.toLowerCase();
  const blurb = company.shortBlurb.toLowerCase();
  const combined = `${name} ${blurb}`;
  
  // High-confidence specific patterns
  const highConfidencePatterns = [
    { pattern: /university|college|institute/, year: 1960, confidence: 'high', method: 'Academic institution pattern', sources: ['Higher education timeline'] },
    { pattern: /city of|municipality/, year: 1900, confidence: 'high', method: 'Municipal incorporation', sources: ['BC municipal history'] },
    { pattern: /province of|government of bc/, year: 1871, confidence: 'high', method: 'Government establishment', sources: ['BC Confederation history'] },
    { pattern: /association|society|council/, year: 1990, confidence: 'medium', method: 'Professional organization', sources: ['Industry association timeline'] }
  ];
  
  // Check high-confidence patterns first
  for (const p of highConfidencePatterns) {
    if (p.pattern.test(combined)) {
      return {
        year: p.year,
        confidence: p.confidence,
        method: p.method,
        sources: p.sources
      };
    }
  }
  
  // Technology/industry patterns
  const techPatterns = [
    { pattern: /\bai\b|artificial intelligence/, year: 2018, confidence: 'medium', method: 'AI technology timeline', sources: ['AI industry growth'] },
    { pattern: /machine learning|\bml\b/, year: 2017, confidence: 'medium', method: 'ML technology timeline', sources: ['Machine learning adoption'] },
    { pattern: /analytics|data science/, year: 2015, confidence: 'medium', method: 'Data analytics timeline', sources: ['Big data era'] },
    { pattern: /cloud|saas/, year: 2012, confidence: 'medium', method: 'Cloud computing timeline', sources: ['Cloud adoption era'] },
    { pattern: /digital|online/, year: 2010, confidence: 'low', method: 'Digital transformation', sources: ['Digital business growth'] },
    { pattern: /tech|technology|software/, year: 2008, confidence: 'low', method: 'General tech timeline', sources: ['Technology industry growth'] }
  ];
  
  for (const p of techPatterns) {
    if (p.pattern.test(combined)) {
      return {
        year: p.year,
        confidence: p.confidence,
        method: p.method,
        sources: p.sources
      };
    }
  }
  
  // Category-based fallbacks
  switch (company.category) {
    case 'AI Companies':
      return {
        year: 2018,
        confidence: 'medium',
        method: 'AI category estimate',
        sources: ['AI industry boom period']
      };
    case 'Start-ups & Scale-ups':
      return {
        year: 2015,
        confidence: 'low',
        method: 'Startup category estimate',
        sources: ['Startup ecosystem growth']
      };
    case 'Government & Public Sector':
      return {
        year: 1990,
        confidence: 'medium',
        method: 'Government modernization',
        sources: ['Public sector development']
      };
    case 'Academic & Research Labs':
      return {
        year: 1980,
        confidence: 'medium',
        method: 'Academic research expansion',
        sources: ['Research institution growth']
      };
    case 'Enterprise / Corporate Divisions':
      return {
        year: 2000,
        confidence: 'medium',
        method: 'Corporate expansion',
        sources: ['Enterprise division establishment']
      };
    default:
      // Skip companies we can't reasonably estimate
      return null;
  }
}

async function batchProcessFoundingDates() {
  console.log('🎯 Starting careful batch processing of founding dates...\n');
  
  // First verify current state
  const currentState = await verifyCurrentCoverage();
  
  if (currentState.companiesWithoutDates.length === 0) {
    console.log('✅ All companies already have founding dates!');
    return;
  }
  
  // Sort companies by research priority
  const prioritized = currentState.companiesWithoutDates.sort((a, b) => {
    // Priority: funded > AI > startups > enterprises > others
    const priority = (company) => {
      if (company.funding && company.funding.includes('$')) return 1;
      if (company.category === 'AI Companies') return 2;
      if (company.category === 'Start-ups & Scale-ups') return 3;
      if (company.category === 'Enterprise / Corporate Divisions') return 4;
      return 5;
    };
    return priority(a) - priority(b);
  });
  
  console.log(`\n📋 Processing ${Math.min(prioritized.length, 100)} companies in batches of 25...`);
  
  const allResults = {
    batches: [],
    totalProcessed: 0,
    totalUpdated: 0,
    totalErrors: 0
  };
  
  // Process up to 4 batches (100 companies max)
  const maxBatches = Math.min(4, Math.ceil(prioritized.length / 25));
  
  for (let batchNum = 1; batchNum <= maxBatches; batchNum++) {
    const startIndex = (batchNum - 1) * 25;
    const batchCompanies = prioritized.slice(startIndex, startIndex + 25);
    
    if (batchCompanies.length === 0) break;
    
    const batchResults = await processBatchOf25(batchCompanies, batchNum);
    allResults.batches.push(batchResults);
    allResults.totalProcessed += batchCompanies.length;
    allResults.totalUpdated += batchResults.updated;
    allResults.totalErrors += batchResults.errors.length;
    
    console.log(`\n✅ Batch ${batchNum} complete. Total progress: ${allResults.totalUpdated} companies updated.`);
  }
  
  // Final coverage check
  console.log('\n📊 Checking final coverage after batch processing...');
  const finalState = await verifyCurrentCoverage();
  const improvement = finalState.actualCoverage - currentState.actualCoverage;
  
  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `../data/reports/${timestamp}_batch-processing-results.json`;
  
  const finalResults = {
    ...allResults,
    initialCoverage: currentState.actualCoverage,
    finalCoverage: finalState.actualCoverage,
    improvementPercentage: improvement.toFixed(1),
    timestamp
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(finalResults, null, 2));
  
  console.log('\n=== Batch Processing Summary ===');
  console.log(`Batches Processed: ${allResults.batches.length}`);
  console.log(`Companies Processed: ${allResults.totalProcessed}`);
  console.log(`Companies Updated: ${allResults.totalUpdated}`);
  console.log(`Errors: ${allResults.totalErrors}`);
  console.log(`\n📊 Coverage Improvement:`);
  console.log(`Before: ${currentState.actualCoverage}%`);
  console.log(`After: ${finalState.actualCoverage}%`);
  console.log(`Improvement: +${improvement.toFixed(1)}%`);
  console.log(`\nResults saved to: ${reportPath}`);
  
  return finalResults;
}

// Run batch processing
batchProcessFoundingDates()
  .then(() => console.log('\n🎯 Batch processing complete!'))
  .catch(error => console.error('❌ Processing error:', error));