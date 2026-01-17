import { NextRequest, NextResponse } from 'next/server';
import listingsData from '@/app/data/vn_rental_3cities_verified.json';

export async function GET() {
  const data = listingsData as Array<{ district: string; type: string; market_segment: string; price: number }>;

  // Get unique districts, types, segments
  const districts = [...new Set(data.map(d => d.district))].slice(0, 10);
  const types = [...new Set(data.map(d => d.type))];
  const segments = [...new Set(data.map(d => d.market_segment))];

  // Sample filter test
  const testDistrict = districts[0];
  const testFiltered = data.filter(d => d.district === testDistrict && d.type === 'streetfront' && d.market_segment === 'street_retail');

  return NextResponse.json({
    total_records: data.length,
    sample_districts: districts,
    types,
    segments,
    test_district: testDistrict,
    test_filtered_count: testFiltered.length,
    first_record: data[0]
  });
}
