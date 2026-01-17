import { NextRequest, NextResponse } from 'next/server';
import listingsData from '@/app/data/vn_rental_3cities_verified.json';

const GEMINI_API_KEY = 'AIzaSyAVLv-9OmNzwECmnOw0rP_JZb6MxLiBtCg';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

interface Listing {
  district: string;
  type: string;
  market_segment: string;
  rental_price: number;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { district, province, type, segment, area, frontage, floors, current_price } = body;

    // Filter data for statistics
    const listings = listingsData as Listing[];
    const filtered = listings.filter(item =>
      item.district === district &&
      item.type === type &&
      item.market_segment === segment
    );

    if (filtered.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Không tìm thấy dữ liệu tham khảo cho khu vực này',
        ai_insights: {
          ai_powered: false,
          market_insight: 'Không đủ dữ liệu để định giá.'
        }
      });
    }

    // Calculate statistics
    const prices = filtered.map(item => item.rental_price).sort((a, b) => a - b);
    const p25 = prices[Math.floor(prices.length * 0.25)];
    const median = prices[Math.floor(prices.length * 0.5)];
    const p75 = prices[Math.floor(prices.length * 0.75)];
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    // Calculate adjustments
    const areaFactor = area > 30 ? 1 : (area || 30) / 30;
    const frontageFactor = frontage > 4 ? 1 : (frontage || 4) / 4;
    const floorFactor = 1 + (((floors || 1) - 1) * 0.15);
    const totalFactor = areaFactor * frontageFactor * floorFactor;

    const suggested_price = Math.round(median * totalFactor);
    const price_min = Math.round(p25 * totalFactor);
    const price_max = Math.round(p75 * totalFactor);

    // Build prompt for Gemini
    const prompt = `Bạn là chuyên gia thị trường bất động sản Việt Nam. Phân tích mặt bằng ${segment} tại ${district}, ${province}:

Thông tin mặt bằng:
- Diện tích: ${area}m²
- Mặt tiền: ${frontage}m
- Số tầng: ${floors}
- Giá đề xuất: ${suggested_price.toLocaleString()} VNĐ/tháng
- Khoảng giá thị trường: ${price_min.toLocaleString()} - ${price_max.toLocaleString()} VNĐ
- Số mẫu tham khảo: ${filtered.length}
${current_price ? `- Giá hiện tại đang hỏi: ${current_price.toLocaleString()} VNĐ/tháng` : ''}

Hãy đưa ra (tối đa 300 từ):
1. Nhận xét về mức giá và vị trí
2. Gợi ý nâng cấp để tăng giá trị (nếu có)
3. Lời khuyên khi thương lượng giá`;

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

    let aiText = '';
    let aiPowered = false;

    if (geminiResponse.ok) {
      const geminiData = await geminiResponse.json();
      aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      aiPowered = aiText.length > 0;
    } else {
      console.error('Gemini API error:', await geminiResponse.text());
      aiText = `Khu vực ${district} có ${filtered.length} tin rao ${segment}. Giá trung vị: ${median.toLocaleString()} VNĐ/tháng. Giá đề xuất cho mặt bằng ${area}m²: ${suggested_price.toLocaleString()} VNĐ/tháng.`;
    }

    return NextResponse.json({
      success: true,
      valuation: {
        suggested_price,
        price_range: { min: price_min, max: price_max },
        stats: {
          p25, median, p75, min, max,
          sample_size: filtered.length
        },
        adjustments: {
          area: areaFactor,
          frontage: frontageFactor,
          floors: floorFactor,
          total: totalFactor
        }
      },
      ai_insights: {
        ai_powered: aiPowered,
        model: aiPowered ? 'gemini-1.5-flash' : '',
        market_insight: aiText,
        upgrade_suggestions: [],
        negotiation_tips: []
      }
    });

  } catch (error) {
    console.error('Valuation API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
