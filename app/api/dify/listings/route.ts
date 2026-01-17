import { NextRequest, NextResponse } from 'next/server';
import listingsData from '@/app/data/vn_rental_3cities_verified.json';

interface Listing {
  id: string;
  name: string;
  district: string;
  ward: string;
  province: string;
  type: string;
  market_segment: string;
  area: number;
  frontage: number;
  floors: number;
  price: number;
  address: string;
  amenities_schools?: number;
  amenities_offices?: number;
  amenities_competitors?: number;
}

// API for Dify to query listings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      district,
      province,
      type,
      segment,
      min_price,
      max_price,
      min_area,
      max_area,
      limit = 10
    } = body;

    const listings = listingsData as Listing[];

    let filtered = listings;

    // Filter by criteria
    if (district) {
      filtered = filtered.filter(l =>
        l.district.toLowerCase().includes(district.toLowerCase())
      );
    }
    if (province) {
      filtered = filtered.filter(l =>
        l.province.toLowerCase().includes(province.toLowerCase())
      );
    }
    if (type) {
      filtered = filtered.filter(l => l.type === type);
    }
    if (segment) {
      filtered = filtered.filter(l => l.market_segment === segment);
    }
    if (min_price) {
      filtered = filtered.filter(l => l.price >= min_price);
    }
    if (max_price) {
      filtered = filtered.filter(l => l.price <= max_price);
    }
    if (min_area) {
      filtered = filtered.filter(l => l.area >= min_area);
    }
    if (max_area) {
      filtered = filtered.filter(l => l.area <= max_area);
    }

    // Return limited results with essential info
    const results = filtered.slice(0, limit).map(l => ({
      id: l.id,
      name: l.name,
      address: l.address,
      district: l.district,
      province: l.province,
      type: l.type,
      segment: l.market_segment,
      area: l.area,
      frontage: l.frontage,
      floors: l.floors,
      price_million: l.price,
      price_vnd: l.price * 1000000,
      amenities: {
        schools: l.amenities_schools || 0,
        offices: l.amenities_offices || 0,
        competitors: l.amenities_competitors || 0
      }
    }));

    return NextResponse.json({
      success: true,
      total: filtered.length,
      returned: results.length,
      listings: results
    });

  } catch (error) {
    console.error('Dify listings API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// GET method for stats
export async function GET() {
  const listings = listingsData as Listing[];

  const districts = [...new Set(listings.map(l => l.district))];
  const provinces = [...new Set(listings.map(l => l.province))];
  const types = [...new Set(listings.map(l => l.type))];
  const segments = [...new Set(listings.map(l => l.market_segment))];

  const priceStats = {
    min: Math.min(...listings.map(l => l.price)),
    max: Math.max(...listings.map(l => l.price)),
    avg: listings.reduce((sum, l) => sum + l.price, 0) / listings.length
  };

  return NextResponse.json({
    total_listings: listings.length,
    districts,
    provinces,
    types,
    segments,
    price_stats: priceStats
  });
}
