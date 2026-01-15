// Next.js API Route - Mock Valuation
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const district = body.district || '';
  const ward = body.ward || '';
  const type = body.type || 'streetfront';
  const area = Number(body.area_m2 || body.area) || 50;
  const frontage = Number(body.frontage_m || body.frontage) || 5;
  const floors = Number(body.floors) || 1;

  // Mock percentiles (thực tế nên query từ DB)
  const p25 = 0.5;
  const median = 1.0;
  const p75 = 2.0;
  const sampleSize = 45; // mock

  // Adjustment factor
  let adjustmentFactor = 1.0;
  if (frontage > 8) adjustmentFactor += 0.1;
  else if (frontage > 5) adjustmentFactor += 0.05;
  else if (frontage < 3) adjustmentFactor -= 0.1;

  if ((type === 'shophouse' || type === 'office') && floors > 2) {
    adjustmentFactor += (floors - 2) * 0.03;
  }

  const suggestedPricePerSqm = median * adjustmentFactor;
  const minPricePerSqm = p25 * adjustmentFactor * 0.95;
  const maxPricePerSqm = p75 * adjustmentFactor * 1.05;

  const suggestedPrice = suggestedPricePerSqm * area;
  const minPrice = minPricePerSqm * area;
  const maxPrice = maxPricePerSqm * area;

  let confidence = sampleSize >= 30 ? 'high' : sampleSize >= 10 ? 'medium' : 'low';

  return NextResponse.json({
    success: true,
    input: {
      district,
      ward,
      type,
      area_m2: area,
      frontage_m: frontage,
      floors
    },
    market_stats: {
      p25_per_sqm: p25.toFixed(3),
      median_per_sqm: median.toFixed(3),
      p75_per_sqm: p75.toFixed(3),
      sample_size: sampleSize
    },
    valuation: {
      suggested_price_million: Math.round(suggestedPrice * 10) / 10,
      priceRange: {
        min: Math.round(minPrice * 10) / 10,
        max: Math.round(maxPrice * 10) / 10
      },
      price_per_sqm: Math.round(suggestedPricePerSqm * 1000) / 1000,
      adjustment_applied: Math.round(adjustmentFactor * 100 - 100) + '%',
      confidence,
      riskLevel: confidence === 'high' ? 'low' : 'medium',
      potentialScore: 75
    }
  });
}
