const { Client } = require('@notionhq/client');
const { NOTION_TOKEN, NOTION_DATABASE_ID } = require('./config');

const notion = new Client({ auth: NOTION_TOKEN });

async function findUnicornsAndHighValue() {
  console.log('🦄 Finding unicorns and high-value companies needing financial/people updates...\n');
  
  const highValueCompanies = [];
  const unicornKeywords = ['unicorn', 'billion', 'acquisition', 'ipo', 'exit', 'acquired'];
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
                equals: 'Unicorn'
              }
            },
            {
              property: 'Category',
              select: {
                equals: 'Enterprise / Corporate Divisions'
              }
            },
            {
              property: 'Category',
              select: {
                equals: 'Technology Companies'
              }
            },
            {
              property: 'Employee Count',
              rich_text: {
                contains: '500'
              }
            },
            {
              property: 'Employee Count',
              rich_text: {
                contains: '1000'
              }
            },
            {
              property: 'Employee Count',
              rich_text: {
                contains: '2000'
              }
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
          shortBlurb: page.properties['Short Blurb']?.rich_text?.[0]?.text?.content || '',
          funding: page.properties.Funding?.rich_text?.[0]?.text?.content || '',
          revenue: page.properties.Revenue?.rich_text?.[0]?.text?.content || '',
          keyPeople: page.properties['Key People']?.rich_text?.[0]?.text?.content || '',
          employeeCount: page.properties['Employee Count']?.rich_text?.[0]?.text?.content || '',
          notableProjects: page.properties['Notable Projects']?.rich_text?.[0]?.text?.content || ''
        };
        
        // Check for unicorn indicators
        const allText = `${company.name} ${company.shortBlurb} ${company.notableProjects}`.toLowerCase();
        const hasUnicornIndicator = unicornKeywords.some(keyword => allText.includes(keyword));
        
        // Check for high employee count
        const employeeNum = parseInt(company.employeeCount) || 0;
        const isLargeCompany = employeeNum >= 100;
        
        // Check if needs financial/people updates
        const needsFinancialUpdate = !company.funding || company.funding.length < 50;
        const needsPeopleUpdate = !company.keyPeople || company.keyPeople.length < 50;
        
        if ((hasUnicornIndicator || isLargeCompany || company.category === 'Unicorn') && 
            (needsFinancialUpdate || needsPeopleUpdate) && 
            (company.website || company.linkedin)) {
          company.priority = hasUnicornIndicator ? 'UNICORN' : isLargeCompany ? 'LARGE' : 'HIGH';
          company.needsFinancial = needsFinancialUpdate;
          company.needsPeople = needsPeopleUpdate;
          highValueCompanies.push(company);
        }
      }

      hasMore = response.has_more;
      startCursor = response.next_cursor;
    } catch (error) {
      console.error('Error querying database:', error);
      hasMore = false;
    }
  }

  // Sort by priority
  highValueCompanies.sort((a, b) => {
    const priorityOrder = { 'UNICORN': 0, 'LARGE': 1, 'HIGH': 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  console.log(`Found ${highValueCompanies.length} high-value companies needing updates\n`);
  
  // Display top companies
  console.log('🎯 Top Priority Companies for Research:');
  console.log('=====================================\n');
  
  const topBatch = highValueCompanies.slice(0, 25);
  
  topBatch.forEach((company, i) => {
    console.log(`${i + 1}. [${company.priority}] ${company.name}`);
    console.log(`   Category: ${company.category}`);
    console.log(`   Founded: ${company.yearFounded || 'Unknown'}`);
    console.log(`   Employees: ${company.employeeCount || 'Unknown'}`);
    console.log(`   Current Funding: ${company.funding ? company.funding.substring(0, 50) + '...' : 'None'}`);
    console.log(`   Needs: ${company.needsFinancial ? 'Financial' : ''} ${company.needsPeople ? 'People' : ''}`);
    console.log(`   Description: ${company.shortBlurb.substring(0, 100)}...`);
    console.log('');
  });

  // Save for research
  const fs = require('fs');
  fs.writeFileSync(
    '../data/reports/unicorns-high-value-research.json',
    JSON.stringify(topBatch.map(c => ({
      name: c.name,
      category: c.category,
      priority: c.priority,
      website: c.website,
      linkedin: c.linkedin,
      currentData: {
        funding: c.funding,
        employees: c.employeeCount,
        people: c.keyPeople ? 'Has some' : 'None'
      },
      needs: {
        financial: c.needsFinancial,
        people: c.needsPeople
      }
    })), null, 2)
  );

  return topBatch;
}

findUnicornsAndHighValue()
  .then(companies => {
    console.log(`\n✅ Identified ${companies.length} high-priority companies for deep research`);
  })
  .catch(error => console.error('Error:', error));