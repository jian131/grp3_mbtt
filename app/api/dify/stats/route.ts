import { NextRequest, NextResponse } from 'next/server';
import listingsData from '@/app/data/listings_vn_postmerge.json';

interface Listing {
  district: string;
  province: string;
  type: string;
  market_segment: string;
  price: number;
  area: number;
}

// Market statistics API for Dify
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { district, province, type, segment } = body;

    const listings = listingsData as Listing[];

    let filtered = listings;

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

    if (filtered.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Không tìm thấy dữ liệu phù hợp'
      });
    }

    // Calculate statistics
    const prices = filtered.map(l => l.price).sort((a, b) => a - b);
    const areas = filtered.map(l => l.area);

    const stats = {
      count: filtered.length,
      price: {
        min: Math.min(...prices),
        max: Math.max(...prices),
        avg: prices.reduce((a, b) => a + b, 0) / prices.length,
        median: prices[Math.floor(prices.length / 2)],
        p25: prices[Math.floor(prices.length * 0.25)],
        p75: prices[Math.floor(prices.length * 0.75)]
      },
      area: {
        min: Math.min(...areas),
        max: Math.max(...areas),
        avg: areas.reduce((a, b) => a + b, 0) / areas.length
      }
    };

    return NextResponse.json({
      success: true,
      filters: { district, province, type, segment },
      stats
    });

  } catch (error) {
    console.error('Dify stats API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
