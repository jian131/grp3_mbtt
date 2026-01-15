// Next.js API Route - Mock Listing Detail
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // Mock data - you can replace this with real DB query later
  const mockListing = {
    success: true,
    data: {
      id: id,
      name: "Mặt bằng Sample - " + id,
      address: "123 Phố Sample, Phường Sample",
      province: "Thành phố Hà Nội",
      district: "Quận Hoàn Kiếm",
      ward: "Phường Hàng Bạc",
      latitude: 21.028511,
      longitude: 105.852183,
      type: "streetfront",
      market_segment: "street_retail",
      area_m2: 85,
      frontage_m: 5,
      floors: 3,
      price_million: 42.5,
      rent_per_sqm_million: 0.5,
      views: 156,
      saved_count: 23,
      primary_image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Hanoi_Old_Quarter.jpg/1200px-Hanoi_Old_Quarter.jpg",
      ai_suggested_price: 40,
      ai_potential_score: 75,
      ai_risk_level: "Low",
      price_label: "fair",
      posted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      owner: {
        name: "Chủ Nhà Sample",
        phone: "0901234567"
      },
      found: true
    }
  };

  return NextResponse.json(mockListing);
}
