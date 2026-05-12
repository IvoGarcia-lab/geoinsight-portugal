import { NextRequest, NextResponse } from 'next/server';
import { fetchIndicatorForPortugal } from '@/lib/eurostat';
import { parseLatestValues, parseTimeSeries } from '@/lib/transforms';
import { INDICATOR_MAP, INDICATORS } from '@/config/indicators';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nutsCode: string }> }
) {
  const { nutsCode } = await params;

  try {
    // If nutsCode is "all", fetch all regions for the active indicator
    if (nutsCode === 'all') {
      const indicatorId =
        request.nextUrl.searchParams.get('indicator') || 'population';
      const level = parseInt(
        request.nextUrl.searchParams.get('level') || '2'
      ) as 1 | 2 | 3;
      const yearStr = request.nextUrl.searchParams.get('year');
      const year = yearStr ? parseInt(yearStr) : null;

      const indicator = INDICATOR_MAP.get(indicatorId);
      if (!indicator) {
        return NextResponse.json(
          { error: `Unknown indicator: ${indicatorId}` },
          { status: 400 }
        );
      }

      let response;
      if (year) {
        // Try fetching from DB first
        try {
          const dbData = await db.dataPoint.findMany({
            where: {
              indicator: { code: indicatorId },
              year: year,
              region: { level: level === 2 ? 'NUTS II' : 'NUTS III' }
            },
            include: { region: true }
          });
          
          if (dbData && dbData.length > 0) {
            const values = dbData.map(point => ({
              nutsCode: point.region.nutsCode,
              value: point.value,
              year: point.year
            }));
            
            return NextResponse.json({
              indicator: indicatorId,
              level,
              year,
              values,
              source: 'database'
            });
          }
        } catch (e) {
          console.warn('Database error or missing data, falling back to Eurostat:', e);
        }

        const { fetchIndicatorByYear } = await import('@/lib/eurostat');
        response = await fetchIndicatorByYear(indicator.datasetId, level, year);
      } else {
        response = await fetchIndicatorForPortugal(indicator.datasetId, level);
      }
      
      const values = parseLatestValues(response);

      return NextResponse.json({
        indicator: indicatorId,
        level,
        year,
        values,
        source: 'eurostat'
      });
    }

    // Fetch all indicators for a specific region
    const level = parseInt(
      request.nextUrl.searchParams.get('level') || '2'
    ) as 1 | 2 | 3;

    const results: Record<
      string,
      { value: number | null; year: number; unit: string; labelPt: string }
    > = {};

    // Try fetching everything for this region from DB first
    let dbData: any[] = [];
    try {
      dbData = await db.dataPoint.findMany({
        where: { region: { nutsCode } },
        include: { indicator: true },
        orderBy: { year: 'desc' }
      });
    } catch (e) {
      console.warn('Database error or missing data, falling back to Eurostat:', e);
    }

    // Fetch each indicator in parallel
    const fetchPromises = INDICATORS.map(async (indicator) => {
      try {
        // If we have DB data for this indicator, use the most recent year
        const dbIndicatorData = dbData.filter(d => d.indicator.code === indicator.id);
        if (dbIndicatorData.length > 0) {
          const latestDbData = dbIndicatorData[0]; // ordered by year desc
          
          // Also construct a simple time series
          const timeSeriesData = dbIndicatorData
            .map(d => ({ year: d.year, value: d.value }))
            .sort((a, b) => a.year - b.year);

          return {
            id: indicator.id,
            value: latestDbData.value,
            year: latestDbData.year,
            unit: indicator.unit,
            labelPt: indicator.labelPt,
            timeSeries: timeSeriesData
          };
        }

        const response = await fetchIndicatorForPortugal(
          indicator.datasetId,
          level,
          { sinceTimePeriod: '2010' }
        );
        const values = parseLatestValues(response);
        const regionValue = values.find((v) => v.nutsCode === nutsCode);
        const timeSeries = parseTimeSeries(response, nutsCode);

        return {
          id: indicator.id,
          value: regionValue?.value ?? null,
          year: regionValue?.year ?? 0,
          unit: indicator.unit,
          labelPt: indicator.labelPt,
          timeSeries: timeSeries[0]?.values || [],
        };
      } catch {
        return {
          id: indicator.id,
          value: null,
          year: 0,
          unit: indicator.unit,
          labelPt: indicator.labelPt,
          timeSeries: [],
        };
      }
    });

    const indicatorResults = await Promise.all(fetchPromises);

    const indicators: Record<string, (typeof indicatorResults)[0]> = {};
    for (const result of indicatorResults) {
      indicators[result.id] = result;
    }

    return NextResponse.json({
      nutsCode,
      level,
      indicators,
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to fetch stats',
      },
      { status: 500 }
    );
  }
}
