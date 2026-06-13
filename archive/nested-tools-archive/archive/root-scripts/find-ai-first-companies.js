const { Client } = require('@notionhq/client');
const fs = require('fs');
const { NOTION_TOKEN, NOTION_DATABASE_ID } = require('./config');

const notion = new Client({ auth: NOTION_TOKEN });

async function findAIFirstCompanies() {
  console.log('Searching for AI-first companies in BC ecosystem...\n');
  
  const aiCompanies = {
    computerVision: [],
    nlpConversational: [],
    predictiveAnalytics: [],
    roboticsAutonomous: [],
    healthcareAI: [],
    fintechAI: [],
    generalAI: [],
    needingFinancialData: []
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
              property: 'AI Focus Areas',
              multi_select: {
                is_not_empty: true
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
                equals: 'Start-ups & Scale-ups'
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
        const aiFocusAreas = page.properties['AI Focus Areas']?.multi_select || [];
        const category = page.properties.Category?.select?.name || '';
        const shortBlurb = page.properties['Short Blurb']?.rich_text?.[0]?.text?.content || '';
        const notableProjects = page.properties['Notable Projects']?.rich_text?.[0]?.text?.content || '';
        
        // Only process if it has AI focus areas or AI-related content
        const isAICompany = aiFocusAreas.length > 0 || 
          category.toLowerCase().includes('ai') ||
          shortBlurb.toLowerCase().includes('ai') ||
          shortBlurb.toLowerCase().includes('machine learning') ||
          notableProjects.toLowerCase().includes('ai');
        
        if (isAICompany) {
          const companyData = {
            name,
            pageId: page.id,
            aiFocusAreas: aiFocusAreas.map(a => a.name),
            hasFunding: !!funding,
            hasRevenue: !!revenue,
            hasEmployeeCount: !!employeeCount,
            shortBlurb,
            category
          };
          
          // Categorize by AI type based on focus areas and description
          const focusAreasStr = aiFocusAreas.map(a => a.name).join(' ').toLowerCase();
          const descriptionStr = (shortBlurb + ' ' + notableProjects).toLowerCase();
          
          if (focusAreasStr.includes('computer vision') || descriptionStr.includes('computer vision') || 
              descriptionStr.includes('image') || descriptionStr.includes('visual')) {
            aiCompanies.computerVision.push(companyData);
          }
          
          if (focusAreasStr.includes('nlp') || focusAreasStr.includes('conversational') || 
              descriptionStr.includes('natural language') || descriptionStr.includes('chatbot') ||
              descriptionStr.includes('voice') || descriptionStr.includes('speech')) {
            aiCompanies.nlpConversational.push(companyData);
          }
          
          if (focusAreasStr.includes('predictive') || focusAreasStr.includes('analytics') || 
              descriptionStr.includes('predictive') || descriptionStr.includes('forecast') ||
              descriptionStr.includes('analytics platform')) {
            aiCompanies.predictiveAnalytics.push(companyData);
          }
          
          if (focusAreasStr.includes('robotics') || focusAreasStr.includes('autonomous') || 
              descriptionStr.includes('robot') || descriptionStr.includes('autonomous') ||
              descriptionStr.includes('automation')) {
            aiCompanies.roboticsAutonomous.push(companyData);
          }
          
          if (focusAreasStr.includes('healthcare') || focusAreasStr.includes('medical') || 
              descriptionStr.includes('health') || descriptionStr.includes('medical') ||
              descriptionStr.includes('clinical')) {
            aiCompanies.healthcareAI.push(companyData);
          }
          
          if (focusAreasStr.includes('fintech') || focusAreasStr.includes('financial') || 
              descriptionStr.includes('financial') || descriptionStr.includes('payment') ||
              descriptionStr.includes('investment')) {
            aiCompanies.fintechAI.push(companyData);
          }
          
          // Track companies needing financial data
          if (!funding || !revenue || !employeeCount) {
            aiCompanies.needingFinancialData.push({
              ...companyData,
              missingData: {
                funding: !funding,
                revenue: !revenue,
                employeeCount: !employeeCount
              }
            });
          }
          
          // Add to general AI if not categorized
          const categorized = aiCompanies.computerVision.includes(companyData) ||
                            aiCompanies.nlpConversational.includes(companyData) ||
                            aiCompanies.predictiveAnalytics.includes(companyData) ||
                            aiCompanies.roboticsAutonomous.includes(companyData) ||
                            aiCompanies.healthcareAI.includes(companyData) ||
                            aiCompanies.fintechAI.includes(companyData);
          
          if (!categorized) {
            aiCompanies.generalAI.push(companyData);
          }
        }
      }

      hasMore = response.has_more;
      startCursor = response.next_cursor;
    } catch (error) {
      console.error('Error querying database:', error);
      hasMore = false;
    }
  }

  // Sort companies needing financial data by priority
  aiCompanies.needingFinancialData.sort((a, b) => {
    const aPriority = (a.missingData.funding ? 3 : 0) + 
                     (a.missingData.revenue ? 2 : 0) + 
                     (a.missingData.employeeCount ? 1 : 0);
    const bPriority = (b.missingData.funding ? 3 : 0) + 
                     (b.missingData.revenue ? 2 : 0) + 
                     (b.missingData.employeeCount ? 1 : 0);
    return bPriority - aPriority;
  });

  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `../data/reports/${timestamp}_ai-first-companies-analysis.json`;
  
  fs.writeFileSync(reportPath, JSON.stringify(aiCompanies, null, 2));
  
  console.log('=== AI-First Companies Analysis ===');
  console.log(`Computer Vision: ${aiCompanies.computerVision.length} companies`);
  console.log(`NLP/Conversational: ${aiCompanies.nlpConversational.length} companies`);
  console.log(`Predictive Analytics: ${aiCompanies.predictiveAnalytics.length} companies`);
  console.log(`Robotics/Autonomous: ${aiCompanies.roboticsAutonomous.length} companies`);
  console.log(`Healthcare AI: ${aiCompanies.healthcareAI.length} companies`);
  console.log(`Fintech AI: ${aiCompanies.fintechAI.length} companies`);
  console.log(`General AI: ${aiCompanies.generalAI.length} companies`);
  console.log(`\nTotal needing financial data: ${aiCompanies.needingFinancialData.length}`);
  
  console.log('\nTop 20 AI Companies Needing Financial Data:');
  aiCompanies.needingFinancialData.slice(0, 20).forEach(company => {
    const missing = [];
    if (company.missingData.funding) missing.push('Funding');
    if (company.missingData.revenue) missing.push('Revenue');
    if (company.missingData.employeeCount) missing.push('Employees');
    console.log(`  - ${company.name} (Missing: ${missing.join(', ')})`);
    console.log(`    Focus: ${company.aiFocusAreas.join(', ') || 'General AI'}`);
  });
  
  console.log(`\nFull report saved to: ${reportPath}`);
  
  return aiCompanies;
}

// Run the analysis
findAIFirstCompanies()
  .then(() => console.log('\nAI-first companies analysis complete!'))
  .catch(error => console.error('Error:', error));