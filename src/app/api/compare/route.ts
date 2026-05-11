import { NextRequest, NextResponse } from 'next/server';
import { fetchIndicatorForPortugal } from '@/lib/eurostat';
import { parseLatestValues, toValueMap } from '@/lib/transforms';
import { buildScatterData, calculateCorrelation } from '@/lib/correlations';
import { INDICATOR_MAP } from '@/config/indicators';
import { getNutsName } from '@/lib/nuts';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const xIndicator = searchParams.get('x');
  const yIndicator = searchParams.get('y');
  const level = parseInt(searchParams.get('level') || '2') as 1 | 2 | 3;

  if (!xIndicator || !yIndicator) {
    return NextResponse.json(
      { error: 'Both x and y indicator IDs are required' },
      { status: 400 }
    );
  }

  const xDef = INDICATOR_MAP.get(xIndicator);
  const yDef = INDICATOR_MAP.get(yIndicator);

  if (!xDef || !yDef) {
    return NextResponse.json(
      { error: `Unknown indicator: ${!xDef ? xIndicator : yIndicator}` },
      { status: 400 }
    );
  }

  try {
    const [xResponse, yResponse] = await Promise.all([
      fetchIndicatorForPortugal(xDef.datasetId, level),
      fetchIndicatorForPortugal(yDef.datasetId, level),
    ]);

    const xValues = toValueMap(parseLatestValues(xResponse));
    const yValues = toValueMap(parseLatestValues(yResponse));

    // Build labels
    const allCodes = new Set([...Object.keys(xValues), ...Object.keys(yValues)]);
    const labels: Record<string, string> = {};
    allCodes.forEach((code) => {
      labels[code] = getNutsName(code);
    });

    const scatterData = buildScatterData(xValues, yValues, labels);
    const correlation = calculateCorrelation(scatterData);

    return NextResponse.json({
      xIndicator: { id: xIndicator, label: xDef.labelPt, unit: xDef.unit },
      yIndicator: { id: yIndicator, label: yDef.labelPt, unit: yDef.unit },
      scatterData,
      correlation,
      level,
    });
  } catch (error) {
    console.error('Compare API error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to compare data',
      },
      { status: 500 }
    );
  }
}
