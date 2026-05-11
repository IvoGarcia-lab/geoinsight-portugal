import { NextRequest } from 'next/server';
import { fetchIndicatorForPortugal } from '@/lib/eurostat';
import { parseLatestValues } from '@/lib/transforms';
import { INDICATORS } from '@/config/indicators';
import { getNutsName } from '@/lib/nuts';
import { analyzeRegionStream } from '@/lib/gemini';
import type { RegionIndicatorData } from '@/lib/gemini';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ nutsCode: string }> }
) {
  const { nutsCode } = await params;
  const regionName = getNutsName(nutsCode);

  try {
    // Fetch all indicators in parallel
    const indicatorResults = await Promise.all(
      INDICATORS.map(async (indicator) => {
        try {
          const response = await fetchIndicatorForPortugal(
            indicator.datasetId,
            nutsCode.length <= 3 ? 1 : nutsCode.length === 4 ? 2 : 3
          );
          const values = parseLatestValues(response);
          const regionValue = values.find((v) => v.nutsCode === nutsCode);

          return {
            id: indicator.id,
            data: {
              label: indicator.labelPt,
              value: regionValue?.value ?? null,
              unit: indicator.unit,
              year: regionValue?.year ?? 0,
            } as RegionIndicatorData,
          };
        } catch {
          return {
            id: indicator.id,
            data: {
              label: indicator.labelPt,
              value: null,
              unit: indicator.unit,
              year: 0,
            } as RegionIndicatorData,
          };
        }
      })
    );

    const indicators: Record<string, RegionIndicatorData> = {};
    for (const result of indicatorResults) {
      indicators[result.id] = result.data;
    }

    // Stream analysis from Gemini
    const stream = await analyzeRegionStream({
      regionName,
      nutsCode,
      indicators,
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Analyze API error:', error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : 'Analysis failed',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
