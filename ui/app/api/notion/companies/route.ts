
import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

const notion = new Client({
  auth: process.env.NOTION_TOKEN
})

const DATABASE_ID = process.env.NOTION_DATABASE_ID || '1f0c6f799a3381bd8332ca0235c24655'

export async function GET(request: NextRequest) {
  try {
    // Fetch companies with logos from real Notion database
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        property: 'Logo',
        files: {
          is_not_empty: true
        }
      },
      page_size: 50
    })
    
    const companies = response.results.map(page => {
      // Type guard to ensure we have a page with properties
      if (!('properties' in page)) {
        return null;
      }
      
      return {
        id: page.id,
        name: (page.properties as any).Name?.title?.[0]?.text?.content || '',
        category: (page.properties as any).Category?.select?.name || '',
        funding: (page.properties as any).Funding?.rich_text?.[0]?.text?.content || '',
        size: (page.properties as any).Size?.select?.name || '',
        website: (page.properties as any).Website?.url || '',
        region: (page.properties as any)['BC Region']?.select?.name || '',
        yearFounded: (page.properties as any)['Year Founded']?.number || null,
        logo: (page.properties as any).Logo?.files?.[0]?.external?.url || 
              (page.properties as any).Logo?.files?.[0]?.file?.url || null
      };
    }).filter(company => company !== null)
    
    return NextResponse.json(companies)
    
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
  }
}