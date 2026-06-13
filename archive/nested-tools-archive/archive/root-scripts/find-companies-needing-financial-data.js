const { Client } = require('@notionhq/client');
const fs = require('fs');
const { NOTION_TOKEN, NOTION_DATABASE_ID } = require('./config');

const notion = new Client({ auth: NOTION_TOKEN });

async function findCompaniesNeedingFinancialData() {
  console.log('Searching for companies missing financial data...\n');
  
  const companies = {
    noFunding: [],
    noRevenue: [],
    noEmployeeCount: [],
    noKeyPeople: [],
    noYearFounded: [],
    aiMlCompanies: [],
    recentlyAdded: []
  };

  let hasMore = true;
  let startCursor = undefined;

  while (hasMore) {
    try {
      const response = await notion.databases.query({
        database_id: NOTION_DATABASE_ID,
        start_cursor: startCursor,
        page_size: 100,
        filter: {
          or: [
            {
              property: 'Category',
              select: {
                equals: 'Startup'
              }
            },
            {
              property: 'Category',
              select: {
                equals: 'Scale-up'
              }
            },
            {
              property: 'Category',
              select: {
                equals: 'AI Companies'
              }
            },
            {
              property: 'Category',
              select: {
                equals: 'Technology Companies'
              }
            }
          ]
        }
      });

      for (const page of response.results) {
        const name = page.properties.Name?.title?.[0]?.text?.content || 'Unknown';
        const funding = page.properties.Funding?.rich_text?.[0]?.text?.content || '';
        const revenue = page.properties.Revenue?.rich_text?.[0]?.text?.content || '';
        const employeeCount = page.properties['Employee Count']?.rich_text?.[0]?.text?.content || '';
        const keyPeople = page.properties['Key People']?.rich_text?.[0]?.text?.content || '';
        const yearFounded = page.properties['Year Founded']?.number;
        const category = page.properties.Category?.select?.name || '';
        const aiFocusAreas = page.properties['AI Focus Areas']?.multi_select || [];
        
        // Check if it's an AI/ML company
        const isAiMl = category.toLowerCase().includes('ai') || 
          category.toLowerCase().includes('tech') ||
          category.toLowerCase().includes('startup') ||
          aiFocusAreas.length > 0;
        
        // Track companies missing financial data
        if (!funding) {
          companies.noFunding.push({ name, pageId: page.id });
        }
        if (!revenue) {
          companies.noRevenue.push({ name, pageId: page.id });
        }
        if (!employeeCount) {
          companies.noEmployeeCount.push({ name, pageId: page.id });
        }
        if (!keyPeople) {
          companies.noKeyPeople.push({ name, pageId: page.id });
        }
        if (!yearFounded) {
          companies.noYearFounded.push({ name, pageId: page.id });
        }
        
        // Track AI/ML companies for focused research
        if (isAiMl && (!funding || !revenue)) {
          companies.aiMlCompanies.push({
            name,
            pageId: page.id,
            category: category,
            aiFocusAreas: aiFocusAreas.map(c => c.name),
            hasFunding: !!funding,
            hasRevenue: !!revenue,
            hasEmployeeCount: !!employeeCount
          });
        }
      }

      hasMore = response.has_more;
      startCursor = response.next_cursor;
    } catch (error) {
      console.error('Error querying database:', error);
      hasMore = false;
    }
  }

  // Sort and prioritize
  companies.aiMlCompanies.sort((a, b) => {
    // Prioritize companies with no funding data
    if (!a.hasFunding && b.hasFunding) return -1;
    if (a.hasFunding && !b.hasFunding) return 1;
    return a.name.localeCompare(b.name);
  });

  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `../data/reports/${timestamp}_companies-needing-financial-data.json`;
  
  fs.writeFileSync(reportPath, JSON.stringify(companies, null, 2));
  
  console.log('=== Companies Missing Financial Data Summary ===');
  console.log(`No Funding Data: ${companies.noFunding.length} companies`);
  console.log(`No Revenue Data: ${companies.noRevenue.length} companies`);
  console.log(`No Employee Count: ${companies.noEmployeeCount.length} companies`);
  console.log(`No Key People: ${companies.noKeyPeople.length} companies`);
  console.log(`No Year Founded: ${companies.noYearFounded.length} companies`);
  console.log(`\nAI/ML Companies Needing Data: ${companies.aiMlCompanies.length}`);
  
  console.log('\nTop 20 AI/ML Companies Missing Financial Data:');
  companies.aiMlCompanies.slice(0, 20).forEach(company => {
    console.log(`  - ${company.name} (Funding: ${company.hasFunding ? 'Yes' : 'No'}, Revenue: ${company.hasRevenue ? 'Yes' : 'No'})`);
  });
  
  console.log(`\nFull report saved to: ${reportPath}`);
  
  return companies;
}

// Run the analysis
findCompaniesNeedingFinancialData()
  .then(() => console.log('\nAnalysis complete!'))
  .catch(error => console.error('Error:', error));