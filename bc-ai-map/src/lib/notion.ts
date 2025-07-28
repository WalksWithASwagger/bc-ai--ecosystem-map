import { Client } from '@notionhq/client';
import { Organization } from '@/types/organization';

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID!;

export async function getOrganizations(): Promise<Organization[]> {
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

        const bcRegion = props['BC Region']?.type === 'select' ?
          props['BC Region'].select?.name as Organization['bcRegion'] : undefined;

        const category = props.Category?.type === 'select' ?
          props.Category.select?.name || undefined : undefined;

        const size = props.Size?.type === 'select' ?
          props.Size.select?.name || undefined : undefined;

        const yearFounded = props['Year Founded']?.type === 'number' ?
          props['Year Founded'].number || undefined : undefined;

        const aiFocusAreas = props['AI Focus Areas']?.type === 'multi_select' ?
          props['AI Focus Areas'].multi_select.map(item => item.name) : [];

        const shortBlurb = props['Short Blurb']?.type === 'rich_text' ?
          props['Short Blurb'].rich_text[0]?.plain_text || undefined : undefined;

        const focusNotes = props['Focus & Notes']?.type === 'rich_text' ?
          props['Focus & Notes'].rich_text[0]?.plain_text || undefined : undefined;

        // Skip organizations without names
        if (!name) continue;

        const organization: Organization = {
          id: page.id,
          name,
          website,
          linkedin,
          email,
          phone,
          city,
          bcRegion,
          category,
          size,
          yearFounded,
          aiFocusAreas,
          shortBlurb,
          focusNotes,
        };

        organizations.push(organization);
      }
    }

    return organizations;
  } catch (error) {
    console.error('Error fetching organizations from Notion:', error);
    return [];
  }
}