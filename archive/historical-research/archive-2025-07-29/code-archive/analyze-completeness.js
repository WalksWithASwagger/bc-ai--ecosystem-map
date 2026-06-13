const { Client } = require('@notionhq/client');

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const databaseId = '1f0c6f79-9a33-81bd-8332-ca0235c24655';

async function fetchAllOrganizations() {
  const organizations = [];
  let hasMore = true;
  let startCursor = undefined;

  while (hasMore) {
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: startCursor,
      page_size: 100,
    });

    organizations.push(...response.results);
    hasMore = response.has_more;
    startCursor = response.next_cursor;
  }

  return organizations;
}

async function analyzeCompleteness() {
  try {
    const orgs = await fetchAllOrganizations();
    console.log(`Found ${orgs.length} organizations`);
    
    const completenessData = [];
    
    for (const org of orgs) {
      if (!('properties' in org)) continue;
      
      const props = org.properties;
      const data = {
        id: org.id,
        url: org.url,
        name: props.Name?.title?.[0]?.plain_text || 'Unknown',
        missingFields: [],
        completenessScore: 0,
        contactScore: 0
      };
      
      // Check each field with weights
      const fieldWeights = {
        'Email': 25,
        'Website': 20,
        'LinkedIn URL': 15,
        'Phone': 15,
        'City/Region': 5,
        'BC Region': 3,
        'Category': 3,
        'AI Focus Areas': 5,
        'Logo': 3,
        'Short Blurb': 3,
        'Year Founded': 2,
        'Size': 1
      };
      
      const fields = {
        'Email': props.Email?.email,
        'Website': props.Website?.url,
        'LinkedIn URL': props['LinkedIn URL']?.url,
        'Phone': props.Phone?.phone_number,
        'City/Region': props['City/Region']?.rich_text?.[0]?.plain_text,
        'BC Region': props['BC Region']?.select?.name,
        'Category': props.Category?.select?.name,
        'AI Focus Areas': props['AI Focus Areas']?.multi_select?.length > 0,
        'Logo': props.Logo?.files?.length > 0,
        'Short Blurb': props['Short Blurb']?.rich_text?.[0]?.plain_text,
        'Year Founded': props['Year Founded']?.number,
        'Size': props.Size?.select?.name
      };
      
      let filledFields = 0;
      let totalWeight = 0;
      let earnedWeight = 0;
      const totalFields = Object.keys(fields).length;
      
      // Calculate contact score (Email, Website, LinkedIn, Phone only)
      const contactFields = ['Email', 'Website', 'LinkedIn URL', 'Phone'];
      let contactWeight = 0;
      let earnedContactWeight = 0;
      
      for (const [field, value] of Object.entries(fields)) {
        const weight = fieldWeights[field] || 0;
        totalWeight += weight;
        
        if (contactFields.includes(field)) {
          contactWeight += weight;
        }
        
        if (!value) {
          data.missingFields.push(field);
        } else {
          filledFields++;
          earnedWeight += weight;
          if (contactFields.includes(field)) {
            earnedContactWeight += weight;
          }
        }
      }
      
      data.completenessScore = Math.round((filledFields / totalFields) * 100);
      data.contactScore = Math.round((earnedContactWeight / contactWeight) * 100);
      data.impactWeight = totalWeight - earnedWeight; // Higher = more impact potential
      
      completenessData.push(data);
    }
    
    // Sort by highest impact weight (most missing high-value fields)
    completenessData.sort((a, b) => b.impactWeight - a.impactWeight);
    
    // Save as JSON for processing
    const fs = require('fs');
    fs.writeFileSync('completeness-analysis.json', JSON.stringify(completenessData, null, 2));
    console.log('Analysis complete, saved to completeness-analysis.json');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

analyzeCompleteness();