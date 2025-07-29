import { Client } from '@notionhq/client';
import { Organization } from '@/types/organization';

// Enhanced mock data for development
const mockOrganizations: Organization[] = [
  {
    id: 'mock-1',
    name: 'Vancouver AI Hub',
    website: 'https://vancouverai.hub',
    city: 'Vancouver',
    bcRegion: 'Lower Mainland',
    category: 'Start-ups & Scale-ups',
    aiFocusAreas: ['NLP/LLMs', 'Computer Vision'],
    shortBlurb: 'Leading AI research and development hub in Vancouver focusing on natural language processing and computer vision applications.',
    coordinates: { lat: 49.2827, lng: -123.1207 }
  },
  {
    id: 'mock-2', 
    name: 'Richmond AI Solutions',
    website: 'https://richmondai.com',
    city: 'Richmond',
    bcRegion: 'Lower Mainland',
    category: 'Start-ups & Scale-ups',
    aiFocusAreas: ['Data Science', 'MLOps'],
    shortBlurb: 'Data science and machine learning operations company serving enterprise clients across BC.',
    coordinates: { lat: 49.1666, lng: -123.1336 }
  },
  {
    id: 'mock-3',
    name: 'Victoria Tech Labs',
    website: 'https://victoriatech.ca',
    city: 'Victoria',
    bcRegion: 'Vancouver Island',
    category: 'Academic & Research Labs',
    aiFocusAreas: ['AI Ethics', 'Healthcare AI'],
    shortBlurb: 'University research lab focused on ethical AI development and healthcare applications.',
    coordinates: { lat: 48.4284, lng: -123.3656 }
  },
  {
    id: 'mock-4',
    name: 'Kelowna AI Collective',
    website: 'https://kelownaai.org',
    city: 'Kelowna',
    bcRegion: 'Interior',
    category: 'Grassroots Communities',
    aiFocusAreas: ['EdTech AI', 'CleanTech AI'],
    shortBlurb: 'Community-driven AI initiative focusing on education technology and clean technology solutions.',
    coordinates: { lat: 49.8880, lng: -119.4960 }
  },
  {
    id: 'mock-5',
    name: 'Prince George Tech Innovations',
    website: 'https://pgtech.ca',
    city: 'Prince George',
    bcRegion: 'Northern BC',
    category: 'Academic & Research Labs',
    aiFocusAreas: ['Resource Sector AI', 'Data Science'],
    shortBlurb: 'Research and development in AI applications for natural resource management and extraction.',
    coordinates: { lat: 53.9171, lng: -122.7497 }
  },
  {
    id: 'mock-6',
    name: 'Burnaby Enterprise AI',
    website: 'https://burnaby-ai.com',
    city: 'Burnaby',
    bcRegion: 'Lower Mainland',
    category: 'Enterprise / Corporate Divisions',
    aiFocusAreas: ['Robotics', 'Computer Vision', 'MLOps'],
    shortBlurb: 'Enterprise AI solutions for manufacturing and logistics optimization.',
    coordinates: { lat: 49.2488, lng: -122.9805 }
  },
  {
    id: 'mock-7',
    name: 'Indigenous AI Alliance',
    website: 'https://indigenous-ai.ca',
    city: 'Vancouver',
    bcRegion: 'Lower Mainland',
    category: 'Indigenous Tech & Creative Orgs',
    aiFocusAreas: ['Indigenous AI Applications', 'AI Ethics'],
    shortBlurb: 'Developing AI solutions that respect and incorporate Indigenous knowledge systems.',
    coordinates: { lat: 49.2608, lng: -123.2460 }
  },
  {
    id: 'mock-8',
    name: 'BC AI Investment Fund',
    website: 'https://bc-ai-fund.com',
    city: 'Vancouver',
    bcRegion: 'Lower Mainland',
    category: 'Investors & Funds',
    aiFocusAreas: ['GenAI', 'Healthcare AI', 'CleanTech AI'],
    shortBlurb: 'Venture capital fund specializing in early-stage AI companies across British Columbia.',
    coordinates: { lat: 49.2827, lng: -123.1080 }
  }
];

export async function getOrganizations(): Promise<Organization[]> {
  // Check if Notion credentials are properly configured
  if (!process.env.NOTION_TOKEN || 
      process.env.NOTION_TOKEN === 'your_notion_integration_token_here' ||
      !process.env.NOTION_DATABASE_ID || 
      process.env.NOTION_DATABASE_ID === 'your_notion_database_id_here') {
    console.log('🔧 Notion not configured - using mock data for development');
    return mockOrganizations;
  }

  const notion = new Client({
    auth: process.env.NOTION_TOKEN,
  });

  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      page_size: 100,
    });

    const organizations: Organization[] = [];

    for (const page of response.results) {
      if ('properties' in page) {
        try {
          const props = page.properties;

          // Extract organization data safely
          let name = '';
          if (props.Name?.type === 'title' && Array.isArray(props.Name.title) && props.Name.title.length > 0) {
            name = props.Name.title[0]?.plain_text || '';
          }

          if (!name) continue;

          const website = props.Website?.type === 'url' ? props.Website.url || undefined : undefined;
          const email = props.Email?.type === 'email' ? props.Email.email || undefined : undefined;
          
          let city = undefined;
          if (props['City/Region']?.type === 'rich_text' && Array.isArray(props['City/Region'].rich_text) && props['City/Region'].rich_text.length > 0) {
            city = props['City/Region'].rich_text[0]?.plain_text || undefined;
          }

          const bcRegion = props['BC Region']?.type === 'select' && props['BC Region'].select ? 
            props['BC Region'].select.name as Organization['bcRegion'] : 'Lower Mainland';

          const category = props.Category?.type === 'select' && props.Category.select ? 
            props.Category.select.name : 'Start-ups & Scale-ups';

          const aiFocusAreas = props['AI Focus Areas']?.type === 'multi_select' && Array.isArray(props['AI Focus Areas'].multi_select) ?
            props['AI Focus Areas'].multi_select.map((item: any) => item.name) : ['Data Science'];

          let shortBlurb = undefined;
          if (props['Short Blurb']?.type === 'rich_text' && Array.isArray(props['Short Blurb'].rich_text) && props['Short Blurb'].rich_text.length > 0) {
            shortBlurb = props['Short Blurb'].rich_text[0]?.plain_text || undefined;
          }

          const organization: Organization = {
            id: page.id,
            name,
            website,
            email,
            city,
            bcRegion,
            category,
            aiFocusAreas,
            shortBlurb,
          };

          organizations.push(organization);
        } catch (error) {
          console.warn(`Skipping organization due to parsing error:`, error);
          continue;
        }
      }
    }

    console.log(`✅ Loaded ${organizations.length} organizations from Notion`);
    return organizations;
  } catch (error) {
    console.error('❌ Error fetching organizations from Notion:', error);
    console.log('🔧 Falling back to mock data for development');
    return mockOrganizations;
  }
}