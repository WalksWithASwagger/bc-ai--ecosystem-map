const { Client } = require('@notionhq/client');
const { NOTION_TOKEN, NOTION_DATABASE_ID } = require('./config');

const notion = new Client({ auth: NOTION_TOKEN });

async function findRecentlyFoundedCompanies() {
  console.log('🔍 Finding recently founded companies (2023-2025) for deep financial & people research...\n');
  
  const recentCompanies = [];
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
              property: 'Year Founded',
              number: {
                greater_than_or_equal_to: 2023
              }
            }
          ]
        },
        sorts: [
          {
            property: 'Year Founded',
            direction: 'descending'
          }
        ]
      });

      for (const page of response.results) {
        const company = {
          id: page.id,
          name: page.properties.Name?.title?.[0]?.text?.content || '',
          category: page.properties.Category?.select?.name || 'Uncategorized',
          yearFounded: page.properties['Year Founded']?.number,
          website: page.properties.Website?.url || '',
          linkedin: page.properties.LinkedIn?.url || '',
          shortBlurb: page.properties['Short Blurb']?.rich_text?.[0]?.text?.content || '',
          funding: page.properties.Funding?.rich_text?.[0]?.text?.content || '',
          keyPeople: page.properties['Key People']?.rich_text?.[0]?.text?.content || '',
          employeeCount: page.properties['Employee Count']?.rich_text?.[0]?.text?.content || ''
        };
        
        recentCompanies.push(company);
      }

      hasMore = response.has_more;
      startCursor = response.next_cursor;
    } catch (error) {
      console.error('Error querying database:', error);
      hasMore = false;
    }
  }

  // Group by year and category
  const byYear = {};
  const priorityCompanies = [];
  
  recentCompanies.forEach(company => {
    const year = company.yearFounded || 'Unknown';
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(company);
    
    // Prioritize companies without funding/people data but with web presence
    if ((!company.funding || !company.keyPeople) && (company.website || company.linkedin)) {
      priorityCompanies.push(company);
    }
  });

  console.log(`Found ${recentCompanies.length} companies founded 2023-2025\n`);
  
  // Display breakdown by year
  console.log('📊 Breakdown by Year:');
  console.log('====================');
  Object.entries(byYear)
    .sort(([a], [b]) => b - a)
    .forEach(([year, companies]) => {
      console.log(`\n${year}: ${companies.length} companies`);
      
      // Show category breakdown
      const categories = {};
      companies.forEach(c => {
        categories[c.category] = (categories[c.category] || 0) + 1;
      });
      
      Object.entries(categories)
        .sort(([,a], [,b]) => b - a)
        .forEach(([cat, count]) => {
          console.log(`  - ${cat}: ${count}`);
        });
    });
  
  console.log('\n\n🎯 Priority Companies for Deep Dive (missing financial/people data):');
  console.log('================================================================\n');
  
  // Take top 30 priority companies
  const deepDiveBatch = priorityCompanies.slice(0, 30);
  
  deepDiveBatch.forEach((company, i) => {
    console.log(`${i + 1}. ${company.name} (${company.yearFounded})`);
    console.log(`   Category: ${company.category}`);
    console.log(`   Current Funding: ${company.funding || 'None'}`);
    console.log(`   Current People: ${company.keyPeople ? 'Has data' : 'Missing'}`);
    console.log(`   Website: ${company.website || 'None'}`);
    console.log(`   Description: ${company.shortBlurb.substring(0, 100)}...`);
    console.log('');
  });

  // Save list for research
  const fs = require('fs');
  const researchList = deepDiveBatch.map(c => ({
    name: c.name,
    year: c.yearFounded,
    category: c.category,
    website: c.website,
    linkedin: c.linkedin,
    description: c.shortBlurb
  }));
  
  fs.writeFileSync(
    '../data/reports/recent-companies-research-list.json', 
    JSON.stringify(researchList, null, 2)
  );

  console.log(`\n✅ Saved ${deepDiveBatch.length} companies for deep dive research`);
  
  return deepDiveBatch;
}

findRecentlyFoundedCompanies()
  .then(companies => {
    console.log(`\n🎯 Ready for deep financial and people research on ${companies.length} recent companies`);
  })
  .catch(error => console.error('Error:', error));