const { Client } = require('@notionhq/client');
const fs = require('fs');
const { NOTION_TOKEN, NOTION_DATABASE_ID } = require('./config');

const notion = new Client({ auth: NOTION_TOKEN });

async function addCohereHealthVancouver() {
  const company = {
    name: "Cohere Health Vancouver",
    properties: {
      'Name': {
        title: [{
          text: {
            content: "Cohere Health Vancouver"
          }
        }]
      },
      'Category': {
        select: {
          name: "Technology Companies"
        }
      },
      'BC Region': {
        select: {
          name: "Lower Mainland"
        }
      },
      'City/Region': {
        rich_text: [{
          text: {
            content: "Vancouver, BC"
          }
        }]
      },
      'Website': {
        url: "https://www.coherehealth.com"
      },
      'LinkedIn': {
        url: "https://www.linkedin.com/company/cohere-inc/"
      },
      'Funding': {
        rich_text: [{
          text: {
            content: "$80M Series C (March 2024) - Deerfield Management, Flare Capital Partners, Define Ventures"
          }
        }]
      },
      'Revenue': {
        rich_text: [{
          text: {
            content: "$100M+ ARR"
          }
        }]
      },
      'Employee Count': {
        rich_text: [{
          text: {
            content: "50+ in BC"
          }
        }]
      },
      'Year Founded': {
        number: 2019
      },
      'Short Blurb': {
        rich_text: [{
          text: {
            content: "Healthcare AI platform with BC R&D center, focusing on prior authorization automation and clinical intelligence."
          }
        }]
      },
      'Notable Projects': {
        rich_text: [{
          text: {
            content: "AI-powered prior authorization, Clinical decision support systems"
          }
        }]
      },
      'AI Focus Areas': {
        multi_select: [
          { name: "Healthcare AI" },
          { name: "Clinical Decision Support" }
        ]
      },
      'Data Source': {
        select: {
          name: 'Manual Research'
        }
      }
    }
  };

  try {
    const response = await notion.pages.create({
      parent: { database_id: NOTION_DATABASE_ID },
      properties: company.properties
    });

    console.log(`✓ Successfully added ${company.name}`);
    console.log(`Page ID: ${response.id}`);
    return response;
  } catch (error) {
    console.error(`✗ Failed to add ${company.name}:`, error.message);
    return null;
  }
}

// Run the addition
addCohereHealthVancouver()
  .then(result => {
    if (result) {
      console.log('\nCohere Health Vancouver successfully added to database!');
    } else {
      console.log('\nFailed to add Cohere Health Vancouver.');
    }
  })
  .catch(error => console.error('Error:', error));