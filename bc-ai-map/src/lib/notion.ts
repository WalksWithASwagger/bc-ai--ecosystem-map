import { Client } from '@notionhq/client';
import { Organization } from '@/types/organization';

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID!;

// Mock data for development when Notion is not configured
const mockOrganizations: Organization[] = [
  {
    id: 'mock-1',
    name: 'Vancouver AI Hub',
    website: 'https://vancouverai.hub',
    city: 'Vancouver',
    bcRegion: 'Lower Mainland',
    category: 'Start-ups & Scale-ups',
    aiFocusAreas: ['NLP/LLMs', 'Computer Vision'],
    coordinates: {
      lat: 49.2827,
      lng: -123.1207
    }
  },
  {
    id: 'mock-2', 
    name: 'Richmond AI Solutions',
    website: 'https://richmondai.com',
    city: 'Richmond',
    bcRegion: 'Lower Mainland',
    category: 'Start-ups & Scale-ups',
    aiFocusAreas: ['Data Science', 'MLOps'],
    coordinates: {
      lat: 49.1666,
      lng: -123.1336
    }
  },
  {
    id: 'mock-3',
    name: 'Victoria Tech Labs',
    website: 'https://victoriatech.ca',
    city: 'Victoria',
    bcRegion: 'Vancouver Island',
    category: 'Academic & Research Labs',
    aiFocusAreas: ['AI Ethics', 'Healthcare AI'],
    coordinates: {
      lat: 48.4284,
      lng: -123.3656
    }
  }
];

export async function getOrganizations(): Promise<Organization[]> {
  // Check if Notion credentials are configured
  if (!process.env.NOTION_TOKEN || process.env.NOTION_TOKEN === 'your_notion_integration_token_here' ||
      !process.env.NOTION_DATABASE_ID || process.env.NOTION_DATABASE_ID === 'your_notion_database_id_here') {
    console.log('🔧 Notion not configured - using mock data for development');
    return mockOrganizations;
  }

  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      page_size: 100,
    });

    const organizations: Organization[] = [];

    for (const page of response.results) {
      if ('properties' in page) {
        const props = page.properties;

        // Extract properties with proper type checking
        const name = props.Name?.type === 'title' ? 
          props.Name.title[0]?.plain_text || '' : '';

        const website = props.Website?.type === 'url' ? 
          props.Website.url || undefined : undefined;

        const linkedin = props.LinkedIn?.type === 'url' ? 
          props.LinkedIn.url || undefined : undefined;

        const email = props.Email?.type === 'email' ? 
          props.Email.email || undefined : undefined;

        const phone = props.Phone?.type === 'phone_number' ? 
          props.Phone.phone_number || undefined : undefined;

        const city = props['City/Region']?.type === 'rich_text' ?
          props['City/Region'].rich_text[0]?.plain_text || undefined : undefined;

        const bcRegion = props['BC Region']?.type === 'select' && props['BC Region'].select && 'name' in props['BC Region'].select ?
          props['BC Region'].select.name as Organization['bcRegion'] : undefined;

        const category = props.Category?.type === 'select' && props.Category.select && 'name' in props.Category.select ?
          props.Category.select.name || undefined : undefined;

        const size = props.Size?.type === 'select' && props.Size.select && 'name' in props.Size.select ?
          props.Size.select.name || undefined : undefined;

        const yearFounded = props['Year Founded']?.type === 'number' ?
          props['Year Founded'].number || undefined : undefined;

        const aiFocusAreas = props['AI Focus Areas']?.type === 'multi_select' && Array.isArray(props['AI Focus Areas'].multi_select) ?
          props['AI Focus Areas'].multi_select.map((item: any) => item.name) || [] : [];

        const shortBlurb = props['Short Blurb']?.type === 'rich_text' && Array.isArray(props['Short Blurb'].rich_text) ?
          props['Short Blurb'].rich_text[0]?.plain_text || undefined : undefined;

        const focusNotes = props['Focus Notes']?.type === 'rich_text' && Array.isArray(props['Focus Notes'].rich_text) ?
          props['Focus Notes'].rich_text[0]?.plain_text || undefined : undefined;

        const primaryContact = props['Primary Contact']?.type === 'rich_text' && Array.isArray(props['Primary Contact'].rich_text) ?
          props['Primary Contact'].rich_text[0]?.plain_text || undefined : undefined;

        const keyPeople = props['Key People']?.type === 'rich_text' && Array.isArray(props['Key People'].rich_text) ?
          props['Key People'].rich_text[0]?.plain_text || undefined : undefined;

        const logo = props.Logo?.type === 'files' && props.Logo.files.length > 0 ?
          props.Logo.files[0].type === 'external' ? props.Logo.files[0].external.url :
          props.Logo.files[0].type === 'file' ? props.Logo.files[0].file.url : undefined : undefined;

        // Skip organizations without a name
        if (!name) continue;

        const organization: Organization = {
          id: page.id,
          name,
          website,
          linkedin,
          email,
          phone,
          primaryContact,
          keyPeople,
          city,
          bcRegion,
          category,
          size,
          yearFounded,
          aiFocusAreas,
          shortBlurb,
          focusNotes,
          logo,
          // Note: coordinates would need to be geocoded separately
        };

        organizations.push(organization);
      }
    }

    console.log(`✅ Loaded ${organizations.length} organizations from Notion`);
    return organizations;
  } catch (error) {
    console.error('Error fetching organizations from Notion:', error);
    console.log('🔧 Falling back to mock data');
    return mockOrganizations;
  }
}