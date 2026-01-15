// Next.js API Route - Valuation from Verified Data
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Cache for listings data
let listingsCache: any[] | null = null;

function loadListings(): any[] {
  if (listingsCache) return listingsCache;

  try {
    const dataPath = path.join(process.cwd(), 'app/data/vn_rental_3cities_verified.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    listingsCache = JSON.parse(rawData);
    return listingsCache || [];
  } catch (error) {
    console.error('Failed to load listings:', error);
    return [];
  }
}

function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const district = (body.district || '').trim();
  const city = (body.city || body.province || '').trim();
  const ward = (body.ward || '').trim();
  const type = body.type || 'streetfront';
  const area = Number(body.area_m2 || body.area) || 50;
  const frontage = Number(body.frontage_m || body.frontage) || 5;
  const floors = Number(body.floors) || 1;

  const listings = loadListings();

  // Filter comparable listings
  let comparables = listings.filter((l: any) => {
    // Same district (case-insensitive, trimmed)
    if (district && l.district?.trim().toLowerCase() !== district.toLowerCase()) return false;
    // Same type if specified
    if (type && l.type !== type) return false;
    return true;
  });

  // Fallback to city-wide if too few samples
  if (comparables.length < 10) {
    // Infer city from district if not provided
    let targetCity = city;
    if (!targetCity && district) {
      // Find a listing with this district to get its province
      const sampleListing = listings.find((l: any) =>
        l.district?.trim().toLowerCase() === district.toLowerCase()
      );
      if (sampleListing) {
        targetCity = sampleListing.province;
      }
    }

    if (targetCity) {
      const cityListings = listings.filter((l: any) => {
        return l.province?.includes(targetCity) ||
               targetCity.includes(l.province);
      });
      if (cityListings.length > comparables.length) {
        comparables = cityListings;
      }
    } else {
      // No city filter, use all listings
      comparables = listings;
    }
  }

  // Calculate rent per sqm for comparables
  const rentPerSqmValues = comparables
    .map((l: any) => l.rent_per_sqm_million || (l.price_million || l.price) / (l.area || l.area_m2 || 50))
    .filter((v: number) => v > 0 && v < 10);  // Filter outliers

  const sampleSize = rentPerSqmValues.length;
  const p25 = sampleSize > 0 ? calculatePercentile(rentPerSqmValues, 25) : 0.5;
  const median = sampleSize > 0 ? calculatePercentile(rentPerSqmValues, 50) : 1.0;
  const p75 = sampleSize > 0 ? calculatePercentile(rentPerSqmValues, 75) : 2.0;

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
