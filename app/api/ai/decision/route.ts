import { NextRequest, NextResponse } from 'next/server';
import listingsData from '@/app/data/vn_rental_3cities_verified.json';

// Get API key from environment variable
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface Listing {
  id: string;
  district: string;
  ward: string;
  province: string;
  market_segment: string;
  area: number;
  frontage: number;
  floors: number;
  price: number;
  name: string;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listing_id, user_intent } = body;

    // Find listing
    const listings = listingsData as Listing[];
    const listing = listings.find(l => l.id === listing_id);

    if (!listing) {
      return NextResponse.json({
        success: false,
        error: 'Listing not found',
        listing_id
      }, { status: 404 });
    }

    // Build prompt
    const prompt = `Bạn là chuyên gia tư vấn bất động sản Việt Nam. Khách hàng đang xem mặt bằng:

- ID: ${listing.id}
- Địa điểm: ${listing.ward}, ${listing.district}, ${listing.province}
- Loại: ${listing.market_segment}
- Diện tích: ${listing.area}m²
- Mặt tiền: ${listing.frontage}m
- Số tầng: ${listing.floors}
- Giá thuê: ${(listing.price * 1000000).toLocaleString()} VNĐ/tháng
- Tên: ${listing.name || 'Không có tên'}

Mục đích thuê của khách: ${user_intent || 'Chưa xác định'}

Hãy đưa ra đánh giá ngắn gọn (tối đa 250 từ):
1. Ưu điểm (2-3 điểm chính)
2. Nhược điểm (2-3 điểm)
3. Khuyến nghị: "highly_recommended" / "recommended" / "consider" / "not_suitable"
4. Lý do cho khuyến nghị`;

    // Call Groq API (free, fast LLM)
    const groqResponse = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Groq API error:', errorText);

      // Return fallback response
      return NextResponse.json({
        success: true,
        listing_id: listing.id,
        ai_powered: false,
        fallback_reason: `Groq API error: ${groqResponse.status}`,
        verdict: 'consider',
        analysis: 'Mặt bằng này có vị trí thuận tiện. Hãy đến xem trực tiếp để đánh giá chi tiết hơn về không gian và tiện ích xung quanh.',
        pros: ['Vị trí thuận tiện', 'Giá hợp lý'],
        cons: ['Cần khảo sát thực tế']
      });
    }

    const groqData = await groqResponse.json();
    const aiText = groqData.choices?.[0]?.message?.content || '';

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
      listing_id: listing.id,
      ai_powered: true,
      model: 'llama-3.3-70b',
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
