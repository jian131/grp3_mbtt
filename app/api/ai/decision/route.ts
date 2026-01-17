import { NextRequest, NextResponse } from 'next/server';
import listingsData from '@/app/data/vn_rental_3cities_verified.json';

const GEMINI_API_KEY = 'AIzaSyAVLv-9OmNzwECmnOw0rP_JZb6MxLiBtCg';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

interface Listing {
  listing_id: string;
  district: string;
  ward: string;
  province: string;
  market_segment: string;
  area: number;
  frontage: number;
  floors: number;
  rental_price: number;
  description: string;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listing_id, user_intent } = body;

    // Find listing
    const listings = listingsData as Listing[];
    const listing = listings.find(l => l.listing_id === listing_id);

    if (!listing) {
      return NextResponse.json({
        success: false,
        error: 'Listing not found',
        listing_id
      }, { status: 404 });
    }

    // Build prompt
    const prompt = `Bạn là chuyên gia tư vấn bất động sản Việt Nam. Khách hàng đang xem mặt bằng:

- ID: ${listing.listing_id}
- Địa điểm: ${listing.ward}, ${listing.district}, ${listing.province}
- Loại: ${listing.market_segment}
- Diện tích: ${listing.area}m²
- Mặt tiền: ${listing.frontage}m
- Số tầng: ${listing.floors}
- Giá thuê: ${listing.rental_price.toLocaleString()} VNĐ/tháng
- Mô tả: ${listing.description?.substring(0, 300) || 'Không có mô tả'}

Mục đích thuê của khách: ${user_intent || 'Chưa xác định'}

Hãy đưa ra đánh giá ngắn gọn (tối đa 250 từ):
1. Ưu điểm (2-3 điểm chính)
2. Nhược điểm (2-3 điểm)
3. Khuyến nghị: "highly_recommended" / "recommended" / "consider" / "not_suitable"
4. Lý do cho khuyến nghị`;

    // Call Gemini API
    const geminiResponse = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);

      // Return fallback response
      return NextResponse.json({
        success: true,
        listing_id: listing.listing_id,
        ai_powered: false,
        fallback_reason: `Gemini API error: ${geminiResponse.status}`,
        verdict: 'consider',
        analysis: 'Mặt bằng này có vị trí thuận tiện. Hãy đến xem trực tiếp để đánh giá chi tiết hơn về không gian và tiện ích xung quanh.',
        pros: ['Vị trí thuận tiện', 'Giá hợp lý'],
        cons: ['Cần khảo sát thực tế']
      });
    }

    const geminiData = await geminiResponse.json();
    const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Determine verdict from AI response
    let verdict = 'consider';
    const lowerText = aiText.toLowerCase();
    if (lowerText.includes('highly_recommended') || lowerText.includes('rất phù hợp') || lowerText.includes('highly recommended')) {
      verdict = 'highly_recommended';
    } else if (lowerText.includes('recommended') || lowerText.includes('phù hợp') || lowerText.includes('nên thuê')) {
      verdict = 'recommended';
    } else if (lowerText.includes('not_suitable') || lowerText.includes('không phù hợp') || lowerText.includes('không nên')) {
      verdict = 'not_suitable';
    }

    return NextResponse.json({
      success: true,
      listing_id: listing.listing_id,
      ai_powered: true,
      model: 'gemini-1.5-flash',
      verdict,
      analysis: aiText,
      pros: ['Xem chi tiết trong phân tích'],
      cons: ['Xem chi tiết trong phân tích']
    });

  } catch (error) {
    console.error('Decision API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      ai_powered: false
    }, { status: 500 });
  }
}
