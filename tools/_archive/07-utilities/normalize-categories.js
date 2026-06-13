#!/usr/bin/env node
/**
 * Normalize categories and AI focus areas in the Notion database
 * Usage: NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/normalize-categories.js
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');

if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
  console.error('Set NOTION_TOKEN and NOTION_DATABASE_ID env vars');
  process.exit(1);
}

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const dbId = process.env.NOTION_DATABASE_ID;

// Category normalization mapping
const CATEGORY_MAPPING = {
  // Startups
  'Startup': 'Start-ups & Scale-ups',
  'Scale-up': 'Start-ups & Scale-ups',
  'Start-up': 'Start-ups & Scale-ups',
  
  // Research
  'Research Lab': 'Academic & Research Labs',
  'Research Center': 'Academic & Research Labs',
  'Research & Education': 'Academic & Research Labs',
  'Academic Department': 'Academic & Research Labs',
  
  // Government
  'Government Program': 'Government & Public Sector',
  'Government Initiative': 'Government & Public Sector',
  'Government / Public Sector': 'Government & Public Sector',
  'Government & Crown Programs': 'Government & Public Sector',
  
  // Non-profits
  'Non-profit / Community Orgs': 'Non-Profit',
  
  // Accelerators
  'Accelerator': 'Accelerators / Incubators',
  'Accelerator Program': 'Accelerators / Incubators',
  'Scale-up Accelerator': 'Accelerators / Incubators',
  'University Accelerator': 'Accelerators / Incubators',
  
  // Innovation hubs
  'Innovation Hub': 'Innovation Centres & Hubs',
  'Innovation Centre': 'Innovation Centres & Hubs',
  'Innovation Center': 'Innovation Centres & Hubs',
  'Innovation Cluster': 'Innovation Centres & Hubs',
  
  // Conferences
  'Annual Conference': 'Industry Conferences & Events',
  'Industry Conference': 'Industry Conferences & Events',
  'Annual Summit': 'Industry Conferences & Events',
  'Annual Community Event': 'Industry Conferences & Events',
  'International Conference': 'Industry Conferences & Events',
  
  // Industry groups
  'Industry Group': 'Industry Association',
  'Industry Consortium': 'Industry Association',
  'Industry Cluster': 'Industry Association',
  'Mining Association': 'Industry Association'
};

// AI Focus Areas normalization mapping
const FOCUS_AREA_MAPPING = {
  // NLP
  'NLP': 'NLP/LLMs',
  'Natural Language Processing': 'NLP/LLMs',
  
  // GenAI
  'generative AI': 'GenAI',
  'Generative AI': 'GenAI',
  
  // Healthcare
  'AI in healthcare': 'Healthcare AI',
  'AI in healthcare technology': 'Healthcare AI',
  'AI in healthcare delivery': 'Healthcare AI',
  'AI for health and medicine': 'Healthcare AI',
  'Healthtech and life sciences AI': 'Healthcare AI',
  'AI-powered remote patient monitoring': 'Healthcare AI',
  'AI tools for patient care optimization': 'Healthcare AI',
  'AI in drug discovery and personalized medicine': 'Healthcare AI',
  'Life sciences and AI': 'Healthcare AI',
  'Drug Discovery': 'Healthcare AI',
  'Medical Imaging': 'Healthcare AI',
  
  // CleanTech
  'AI for sustainability': 'CleanTech AI',
  'AI and digitalization for industrial decarbonization': 'CleanTech AI',
  'Energy efficiency with AI technologies': 'CleanTech AI',
  'AI in clean energy': 'CleanTech AI',
  
  // Machine Learning
  'ML': 'Data Science',
  'Machine Learning': 'Data Science',
  'AI/ML education and research': 'Data Science',
  'AI and ML research': 'Data Science',
  
  // AgTech
  'Agriculture': 'AgTech AI',
  'Farm Management': 'AgTech AI',
  'Precision Irrigation': 'AgTech AI',
  'Satellite-based crop monitoring with AI': 'AgTech AI',
  'Science and technology for food security': 'AgTech AI',
  'Agricultural and agrifood programs': 'AgTech AI',
  
  // Robotics
  'Robotic Grasping': 'Robotics',
  'Collaborative robotics': 'Robotics',
  'Robotic equipment': 'Robotics',
  
  // Cybersecurity
  'AI safety risks and cybersecurity': 'AI Ethics',
  'Cybersecurity innovations and AI': 'AI Ethics',
  'Cybersecurity and AI combined curriculum': 'AI Ethics',
  'Consumer Privacy Protection Act (CPPA) compliance': 'AI Ethics',
  'Privacy and security with AI integration': 'AI Ethics'
};

// Helper to safely extract property values
function getPropertyValue(page, propName) {
  const prop = page.properties[propName];
  if (!prop) return null;

  switch (prop.type) {
    case 'select':
      return prop.select?.name || null;
    case 'multi_select':
      return prop.multi_select.length > 0 ? prop.multi_select.map(s => s.name) : null;
    default:
      return null;
  }
}

async function normalizeCategories() {
  console.log('🔍 Fetching organizations from Notion...');
  
  // Fetch all pages from the database
  const pages = [];
  let cursor;
  
  do {
    const response = await notion.databases.query({
      database_id: dbId,
      start_cursor: cursor,
      page_size: 100
    });
    
    pages.push(...response.results);
    cursor = response.has_more ? response.next_cursor : null;
    console.log(`Fetched ${pages.length} organizations so far...`);
  } while (cursor);
  
  console.log(`Total: ${pages.length} organizations`);
  
  // Find categories to normalize
  const categoriesToNormalize = [];
  pages.forEach(page => {
    const name = page.properties.Name.title[0]?.plain_text || 'Unnamed';
    const category = getPropertyValue(page, 'Category');
    
    if (category && CATEGORY_MAPPING[category]) {
      categoriesToNormalize.push({ 
        id: page.id, 
        name, 
        oldCategory: category,
        newCategory: CATEGORY_MAPPING[category]
      });
    }
  });
  
  console.log(`Found ${categoriesToNormalize.length} categories to normalize`);
  
  // Find AI focus areas to normalize
  const focusAreasToNormalize = [];
  pages.forEach(page => {
    const name = page.properties.Name.title[0]?.plain_text || 'Unnamed';
    const focusAreas = getPropertyValue(page, 'AI Focus Areas');
    
    if (focusAreas && Array.isArray(focusAreas)) {
      const areasToUpdate = [];
      
      focusAreas.forEach(area => {
        if (FOCUS_AREA_MAPPING[area]) {
          areasToUpdate.push({
            oldArea: area,
            newArea: FOCUS_AREA_MAPPING[area]
          });
        }
      });
      
      if (areasToUpdate.length > 0) {
        focusAreasToNormalize.push({
          id: page.id,
          name,
          currentAreas: focusAreas,
          areasToUpdate
        });
      }
    }
  });
  
  console.log(`Found ${focusAreasToNormalize.length} organizations with AI focus areas to normalize`);
  
  // Normalize categories
  const categoriesFixed = [];
  const categoriesFailed = [];
  
  for (const org of categoriesToNormalize) {
    try {
      await notion.pages.update({
        page_id: org.id,
        properties: {
          Category: { 
            select: { 
              name: org.newCategory 
            } 
          }
        }
      });
      
      console.log(`✅ Normalized category for ${org.name}: ${org.oldCategory} -> ${org.newCategory}`);
      categoriesFixed.push(org);
    } catch (error) {
      console.error(`❌ Failed to normalize category for ${org.name}:`, error.message);
      categoriesFailed.push({ ...org, error: error.message });
    }
  }
  
  // Normalize AI focus areas
  const focusAreasFixed = [];
  const focusAreasFailed = [];
  
  for (const org of focusAreasToNormalize) {
    try {
      // Create new focus areas list with normalized values
      const updatedAreas = [...org.currentAreas];
      
      // Replace old areas with new ones
      org.areasToUpdate.forEach(update => {
        const index = updatedAreas.indexOf(update.oldArea);
        if (index !== -1) {
          updatedAreas[index] = update.newArea;
        }
      });
      
      // Remove duplicates that might have been created by normalization
      const uniqueAreas = [...new Set(updatedAreas)];
      
      // Update the page
      await notion.pages.update({
        page_id: org.id,
        properties: {
          'AI Focus Areas': { 
            multi_select: uniqueAreas.map(area => ({ name: area }))
          }
        }
      });
      
      console.log(`✅ Normalized AI focus areas for ${org.name}`);
      focusAreasFixed.push({
        name: org.name,
        oldAreas: org.currentAreas,
        newAreas: uniqueAreas
      });
    } catch (error) {
      console.error(`❌ Failed to normalize AI focus areas for ${org.name}:`, error.message);
      focusAreasFailed.push({ 
        name: org.name, 
        areas: org.currentAreas,
        error: error.message 
      });
    }
  }
  
  // Create report
  const timestamp = new Date().toISOString().split('T')[0];
  const reportPath = path.join('reports', `${timestamp}_category-normalization.md`);
  let reportContent = `# Category and AI Focus Area Normalization Report\n\n`;
  reportContent += `*Generated on ${new Date().toLocaleString()}*\n\n`;
  
  reportContent += `## Summary\n\n`;
  reportContent += `- **Total Organizations**: ${pages.length}\n`;
  reportContent += `- **Categories Normalized**: ${categoriesFixed.length}\n`;
  reportContent += `- **AI Focus Areas Normalized**: ${focusAreasFixed.length}\n`;
  reportContent += `- **Failed Category Updates**: ${categoriesFailed.length}\n`;
  reportContent += `- **Failed Focus Area Updates**: ${focusAreasFailed.length}\n\n`;
  
  reportContent += `## Normalized Categories\n\n`;
  reportContent += `| Organization | Old Category | New Category |\n`;
  reportContent += `|--------------|-------------|-------------|\n`;
  
  categoriesFixed.forEach(org => {
    reportContent += `| ${org.name} | ${org.oldCategory} | ${org.newCategory} |\n`;
  });
  
  reportContent += `\n## Normalized AI Focus Areas\n\n`;
  reportContent += `| Organization | Old Areas | New Areas |\n`;
  reportContent += `|--------------|-----------|----------|\n`;
  
  focusAreasFixed.forEach(org => {
    reportContent += `| ${org.name} | ${org.oldAreas.join(', ')} | ${org.newAreas.join(', ')} |\n`;
  });
  
  if (categoriesFailed.length > 0) {
    reportContent += `\n## Failed Category Updates\n\n`;
    reportContent += `| Organization | Category | Error |\n`;
    reportContent += `|--------------|----------|-------|\n`;
    
    categoriesFailed.forEach(org => {
      reportContent += `| ${org.name} | ${org.oldCategory} | ${org.error} |\n`;
    });
  }
  
  if (focusAreasFailed.length > 0) {
    reportContent += `\n## Failed Focus Area Updates\n\n`;
    reportContent += `| Organization | Areas | Error |\n`;
    reportContent += `|--------------|-------|-------|\n`;
    
    focusAreasFailed.forEach(org => {
      reportContent += `| ${org.name} | ${org.areas.join(', ')} | ${org.error} |\n`;
    });
  }
  
  // Ensure reports directory exists
  if (!fs.existsSync('reports')) {
    fs.mkdirSync('reports');
  }
  
  // Write the report
  fs.writeFileSync(reportPath, reportContent);
  
  console.log(`\n📊 Results:`);
  console.log(`   ✅ Categories normalized: ${categoriesFixed.length}`);
  console.log(`   ✅ AI focus areas normalized: ${focusAreasFixed.length}`);
  console.log(`   ❌ Failed category updates: ${categoriesFailed.length}`);
  console.log(`   ❌ Failed focus area updates: ${focusAreasFailed.length}`);
  console.log(`   📝 Report written to: ${reportPath}`);
}

// Run the script
normalizeCategories().catch(error => {
  console.error('Error:', error.message);
  if (error.body) console.error('API Error:', error.body);
  process.exit(1);
}); 