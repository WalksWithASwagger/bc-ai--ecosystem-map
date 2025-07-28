import { NextResponse } from 'next/server';
import { getOrganizations } from '@/lib/notion';

export async function GET() {
  try {
    const organizations = await getOrganizations();
    
    return NextResponse.json({
      organizations,
      count: organizations.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in organizations API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}