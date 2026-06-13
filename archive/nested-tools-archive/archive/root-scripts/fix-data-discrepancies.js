const { Client } = require('@notionhq/client');
const fs = require('fs');
const { NOTION_TOKEN, NOTION_DATABASE_ID } = require('./config');

const notion = new Client({ auth: NOTION_TOKEN });

// Data corrections based on cross-reference validation
const dataCorrections = [
  {
    name: "Clio",
    corrections: {
      revenue: "$200M+ ARR (2024)",
      valuation: "$3B (centaur status)",
      additionalNotes: "Series F funding round June 2024 - NEA, TCV, JMI Equity, T. Rowe Price, OMERS Growth Equity"
    },
    sources: ["TechCrunch June 2024", "Company Press Release"],
    priority: "high"
  },
  {
    name: "1Password",
    corrections: {
      valuation: "$6.8B (unicorn status)",
      additionalNotes: "Unicorn valuation achieved in Series C funding round"
    },
    sources: ["Crunchbase", "Company Blog January 2023"],
    priority: "high"
  },
  {
    name: "AbCellera",
    corrections: {
      funding: "Public company (NASDAQ: ABCL) - IPO raised $483M (2020-12) - Public markets, Viking Global, OrbiMed, Peter Thiel",
      valuation: "$1.4B market cap (2025-07-30)",
      additionalNotes: "Updated market cap as of July 2025"
    },
    sources: ["NASDAQ", "SEC filings"],
    priority: "high"
  },
  {
    name: "Dapper Labs",
    corrections: {
      funding: "$250M Series C (2021-09) - a16z, Coatue Management, Google Ventures, Samsung",
      revenue: "$100M+ (2021 peak), significant decline post-NFT boom",
      valuation: "$7.6B (unicorn at peak, now significantly lower)",
      additionalNotes: "Peak valuation during NFT boom, current valuation estimated much lower due to crypto market changes"
    },
    sources: ["A16z announcement", "CoinDesk", "The Block"],
    priority: "high"
  }
];

// Similar name resolutions for top priority cases
const similarNameResolutions = [
  {
    name1: "Photonic Inc.",
    name2: "Photonic Inc",
    resolution: "merge", // Same company, different formatting
    keepRecord: "Photonic Inc.",
    reason: "Formatting inconsistency - same company"
  },
  {
    name1: "OnDeck Fisheries AI",
    name2: "OnDeck Fisheries", 
    resolution: "merge", // Same company, AI suffix added
    keepRecord: "OnDeck Fisheries AI",
    reason: "Same company - AI suffix more descriptive"
  },
  {
    name1: "BC Regional AI Initiative",
    name2: "BC Regional AI Initiative Recipients",
    resolution: "separate", // Different entities
    reason: "Initiative vs Recipients are separate entities"
  },
  {
    name1: "MineSense Technologies",
    name2: "MineSense",
    resolution: "merge", // Same company
    keepRecord: "MineSense Technologies", 
    reason: "Same company - full name more appropriate"
  }
];

async function findOrganizationByName(name) {
  try {
    const response = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      filter: {
        property: 'Name',
        title: {
          contains: name
        }
      }
    });
    
    return response.results.length > 0 ? response.results[0] : null;
  } catch (error) {
    console.error(`Error finding organization ${name}:`, error);
    return null;
  }
}

async function updateOrganizationData(pageId, corrections) {
  try {
    const updates = {
      properties: {}
    };

    if (corrections.funding) {
      updates.properties['Funding'] = {
        rich_text: [{
          text: {
            content: corrections.funding
          }
        }]
      };
    }

    if (corrections.revenue) {
      updates.properties['Revenue'] = {
        rich_text: [{
          text: {
            content: corrections.revenue
          }
        }]
      };
    }

    if (corrections.valuation) {
      updates.properties['Valuation'] = {
        rich_text: [{
          text: {
            content: corrections.valuation
          }
        }]
      };
    }

    if (corrections.additionalNotes) {
      // Add to Notable Projects field
      const existingPage = await notion.pages.retrieve({ page_id: pageId });
      const currentNotes = existingPage.properties['Notable Projects']?.rich_text?.[0]?.text?.content || '';
      
      const updatedNotes = currentNotes 
        ? `${currentNotes}\n\nData Validation Update (${new Date().toISOString().split('T')[0]}):\n${corrections.additionalNotes}`
        : `Data Validation Update (${new Date().toISOString().split('T')[0]}):\n${corrections.additionalNotes}`;
      
      updates.properties['Notable Projects'] = {
        rich_text: [{
          text: {
            content: updatedNotes
          }
        }]
      };
    }

    const response = await notion.pages.update({
      page_id: pageId,
      ...updates
    });

    return response;
  } catch (error) {
    console.error(`Error updating organization:`, error);
    return null;
  }
}

async function deleteOrganization(pageId) {
  try {
    // Notion doesn't allow deletion, so we'll archive it instead
    const response = await notion.pages.update({
      page_id: pageId,
      archived: true
    });
    return response;
  } catch (error) {
    console.error(`Error archiving organization:`, error);
    return null;
  }
}

async function fixDataDiscrepancies() {
  console.log('🔧 Starting data discrepancy fixes...\n');
  
  const results = {
    fixed: [],
    merged: [],
    errors: [],
    totalFixed: 0
  };

  // Fix high-priority data discrepancies
  console.log('💰 Fixing financial data discrepancies...');
  for (const correction of dataCorrections) {
    console.log(`🔎 Fixing ${correction.name}...`);
    
    const company = await findOrganizationByName(correction.name);
    
    if (!company) {
      results.errors.push({
        name: correction.name,
        error: 'Company not found'
      });
      console.log(`❌ ${correction.name} not found`);
      continue;
    }

    const updateResult = await updateOrganizationData(company.id, correction.corrections);
    
    if (updateResult) {
      results.fixed.push({
        name: correction.name,
        pageId: company.id,
        corrections: Object.keys(correction.corrections),
        sources: correction.sources
      });
      results.totalFixed++;
      console.log(`✅ Fixed ${correction.name} (${Object.keys(correction.corrections).length} fields)`);
    } else {
      results.errors.push({
        name: correction.name,
        error: 'Failed to update'
      });
      console.log(`❌ Failed to fix ${correction.name}`);
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Handle similar name resolutions (merge duplicates)
  console.log('\n🔄 Resolving similar name issues...');
  for (const resolution of similarNameResolutions) {
    if (resolution.resolution === 'merge') {
      console.log(`🔗 Merging "${resolution.name1}" and "${resolution.name2}"...`);
      
      const company1 = await findOrganizationByName(resolution.name1);
      const company2 = await findOrganizationByName(resolution.name2);
      
      if (!company1 || !company2) {
        console.log(`⚠️  Could not find both companies for merge: ${resolution.name1}, ${resolution.name2}`);
        continue;
      }

      // Keep the preferred record, archive the other
      const keepCompany = resolution.keepRecord === resolution.name1 ? company1 : company2;
      const archiveCompany = resolution.keepRecord === resolution.name1 ? company2 : company1;
      
      // Add merge note to kept record
      await updateOrganizationData(keepCompany.id, {
        additionalNotes: `Merged duplicate entry: Previously also listed as "${resolution.keepRecord === resolution.name1 ? resolution.name2 : resolution.name1}". Reason: ${resolution.reason}`
      });
      
      // Archive the duplicate
      const archiveResult = await deleteOrganization(archiveCompany.id);
      
      if (archiveResult) {
        results.merged.push({
          kept: resolution.keepRecord,
          archived: resolution.keepRecord === resolution.name1 ? resolution.name2 : resolution.name1,
          reason: resolution.reason
        });
        console.log(`✅ Merged: Kept "${resolution.keepRecord}", archived duplicate`);
      } else {
        console.log(`❌ Failed to archive duplicate for ${resolution.name1}/${resolution.name2}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  // Generate fix report
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `../data/reports/${timestamp}_data-discrepancy-fixes.json`;
  
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  console.log('\n=== Data Discrepancy Fix Summary ===');
  console.log(`Companies Fixed: ${results.fixed.length}`);
  console.log(`Duplicates Merged: ${results.merged.length}`);
  console.log(`Errors: ${results.errors.length}`);
  console.log(`Total Corrections: ${results.totalFixed}`);
  
  if (results.fixed.length > 0) {
    console.log('\n✅ Successfully fixed:');
    results.fixed.forEach(fix => {
      console.log(`  - ${fix.name}: ${fix.corrections.join(', ')}`);
    });
  }
  
  if (results.merged.length > 0) {
    console.log('\n🔗 Successfully merged:');
    results.merged.forEach(merge => {
      console.log(`  - Kept: ${merge.kept}, Archived: ${merge.archived}`);
    });
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    results.errors.forEach(error => {
      console.log(`  - ${error.name}: ${error.error}`);
    });
  }
  
  console.log(`\nResults saved to: ${reportPath}`);
  
  return results;
}

// Run the fixes
fixDataDiscrepancies()
  .then(() => console.log('\n🎯 Data discrepancy fixes complete!'))
  .catch(error => console.error('❌ Fix error:', error));