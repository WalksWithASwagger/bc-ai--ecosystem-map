import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

// Company logo mapping
const logoMapping: Record<string, string> = {
  'clio': 'Clio_logo.png',
  'd-wave': 'D_Wave_Systems_logo.png',
  'sanctuary': 'Sanctuary_AI_logo.png',
  'abcellera': 'AbCellera_logo.svg',
  'terramera': 'Terramera_logo.png',
  'hootsuite': 'Hootsuite_logo_clearbit.png',
  'procurify': 'Procurify_logo_clearbit.png',
  'klue': 'Klue_logo_clearbit.png',
  'plotly': 'Plotly_logo_clearbit.png',
  'metaoptima': 'MetaOptima_logo_clearbit.png',
  'avigilon': 'Avigilon_clearbit_logo.png',
  'urbanlogiq': 'UrbanLogiq_clearbit_logo.png',
  'nimble': 'Nimble_AI_clearbit_logo.png',
  'zenhub': 'Zenhub_clearbit_logo.png',
  'fingerfood': 'Finger_Food_ATG_clearbit_logo.png',
  'redlen': 'Redlen_Technologies_clearbit_logo.png',
  'ada': 'Ada_clearbit_logo.png',
  'trulioo': 'Trulioo_clearbit_logo.png',
  'dapper': 'Dapper_Labs_clearbit_logo.png',
  'finn': 'Finn_AI_clearbit_logo.png',
  'visioncritical': 'Vision_Critical_logo_clearbit.png',
  'mobify': 'Mobify_logo_clearbit.png',
  'builddirect': 'BuildDirect_logo_clearbit.png',
  'elasticpath': 'Elastic_Path_logo_clearbit.png'
}

export async function GET(
  request: NextRequest,
  { params }: { params: { company: string } }
) {
  try {
    const companySlug = params.company.toLowerCase()
    const logoFileName = logoMapping[companySlug]
    
    if (!logoFileName) {
      return new NextResponse('Logo not found', { status: 404 })
    }
    
    const logoPath = path.join(process.cwd(), 'logos', logoFileName)
    
    try {
      const logoBuffer = await readFile(logoPath)
      
      // Determine content type based on file extension
      const ext = path.extname(logoFileName).toLowerCase()
      const contentType = {
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp'
      }[ext] || 'image/png'
      
      return new NextResponse(logoBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      })
    } catch (fileError) {
      return new NextResponse('Logo file not found', { status: 404 })
    }
  } catch (error) {
    console.error('Error serving logo:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}