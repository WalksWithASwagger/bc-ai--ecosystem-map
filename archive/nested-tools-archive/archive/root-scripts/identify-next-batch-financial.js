const { Client } = require('@notionhq/client');
const { NOTION_TOKEN, NOTION_DATABASE_ID } = require('./config');

const notion = new Client({ auth: NOTION_TOKEN });

async function identifyNextBatch() {
  console.log('🔍 Identifying next batch of companies needing financial data...\n');
  
  const highPriorityCompanies = [];
  let hasMore = true;
  let startCursor = undefined;

  while (hasMore) {
    try {
      const response = await notion.databases.query({
        database_id: NOTION_DATABASE_ID,
        start_cursor: startCursor,
        page_size: 100,
        filter: {
          and: [
            {
              property: 'Funding',
              rich_text: {
                is_empty: true
              }
            },
            {
              or: [
                {
                  property: 'Category',
                  select: {
                    equals: 'AI Companies'
                  }
                },
                {
                  property: 'Category',
                  select: {
                    equals: 'Start-ups & Scale-ups'
                  }
                },
                {
                  property: 'Category',
                  select: {
                    equals: 'Technology Companies'
                  }
                },
                {
                  property: 'Category',
                  select: {
                    equals: 'Healthcare & Biotech'
                  }
                },
                {
                  property: 'Category',
                  select: {
                    equals: 'Fintech'
                  }
                }
              ]
            }
          ]
        }
      });

      for (const page of response.results) {
        const company = {
          id: page.id,
          name: page.properties.Name?.title?.[0]?.text?.content || '',
          category: page.properties.Category?.select?.name || 'Uncategorized',
          yearFounded: page.properties['Year Founded']?.number,
          website: page.properties.Website?.url || '',
          linkedin: page.properties.LinkedIn?.url || '',
          shortBlurb: page.properties['Short Blurb']?.rich_text?.[0]?.text?.content || ''
        };
        
        // Prioritize companies with websites/LinkedIn for research
        if (company.website || company.linkedin) {
          highPriorityCompanies.push(company);
        }
      }

      hasMore = response.has_more;
      startCursor = response.next_cursor;
    } catch (error) {
      console.error('Error querying database:', error);
      hasMore = false;
    }
  }

  // Sort by year founded (newer companies often have more accessible data)
  highPriorityCompanies.sort((a, b) => {
    if (!a.yearFounded) return 1;
    if (!b.yearFounded) return -1;
    return b.yearFounded - a.yearFounded;
  });

  console.log(`Found ${highPriorityCompanies.length} high-priority companies needing financial data\n`);
  
  // Take top 25 for batch processing
  const batch = highPriorityCompanies.slice(0, 25);
  
  console.log('Next batch for financial research:');
  console.log('=================================\n');
  
  batch.forEach((company, i) => {
    console.log(`${i + 1}. ${company.name}`);
    console.log(`   Category: ${company.category}`);
    console.log(`   Founded: ${company.yearFounded || 'Unknown'}`);
    console.log(`   Website: ${company.website || 'None'}`);
    console.log(`   Description: ${company.shortBlurb.substring(0, 100)}...`);
    console.log('');
  });

  return batch;
}

identifyNextBatch()
  .then(batch => {
    console.log(`\n✅ Identified ${batch.length} companies for next financial research batch`);
  })
  .catch(error => console.error('Error:', error));