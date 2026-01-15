// Next.js API Route - Export data as CSV for Superset
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

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get('format') || 'json';

  const listings = loadListings();

  if (format === 'csv') {
    // CSV Export
    const headers = [
      'id', 'name', 'province', 'district', 'ward', 'type',
      'area', 'frontage', 'floors', 'price', 'rent_per_sqm',
      'latitude', 'longitude', 'ai_potential_score', 'ai_risk_level',
      'views', 'posted_at'
    ];

    const csvRows = [headers.join(',')];

    listings.forEach((l: any) => {
      const row = [
        l.id,
        `"${(l.name || '').replace(/"/g, '""')}"`,
        `"${(l.province || '').replace(/"/g, '""')}"`,
        `"${(l.district || '').replace(/"/g, '""')}"`,
        `"${(l.ward || '').replace(/"/g, '""')}"`,
        l.type,
        l.area || l.area_m2 || 0,
        l.frontage || l.frontage_m || 0,
        l.floors || 1,
        l.price || l.price_million || 0,
        l.rent_per_sqm_million || 0,
        l.latitude || 0,
        l.longitude || 0,
        l.ai_potential_score || 0,
        l.ai_risk_level || 'medium',
        l.views || 0,
        l.posted_at || ''
      ];
      csvRows.push(row.join(','));
    });

    return new NextResponse(csvRows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=jfinder_listings.csv'
      }
    });
  }

  // JSON Export
  return NextResponse.json({
    success: true,
    count: listings.length,
    data: listings.map((l: any) => ({
      id: l.id,
      name: l.name,
      province: l.province,
      district: l.district,
      ward: l.ward,
      type: l.type,
      area: l.area || l.area_m2,
      frontage: l.frontage || l.frontage_m,
      floors: l.floors,
      price: l.price || l.price_million,
      rent_per_sqm: l.rent_per_sqm_million,
      latitude: l.latitude,
      longitude: l.longitude,
      ai_potential_score: l.ai_potential_score,
      ai_risk_level: l.ai_risk_level,
      views: l.views,
      posted_at: l.posted_at
    }))
  });
}
