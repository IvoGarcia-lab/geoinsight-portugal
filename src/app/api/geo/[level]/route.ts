import { NextRequest, NextResponse } from 'next/server';
import { fetchPortugalGeo } from '@/lib/gisco';
import type { NutsLevel } from '@/types/indicators';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ level: string }> }
) {
  const { level: levelStr } = await params;
  const level = parseInt(levelStr) as NutsLevel;

  if (![1, 2, 3].includes(level)) {
    return NextResponse.json(
      { error: 'Invalid NUTS level. Use 1, 2, or 3.' },
      { status: 400 }
    );
  }

  try {
    const geoData = await fetchPortugalGeo(level);

    return NextResponse.json(geoData, {
      headers: {
        'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Geo API error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to fetch geo data',
      },
      { status: 500 }
    );
  }
}
