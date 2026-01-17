import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = 'AIzaSyAVLv-9OmNzwECmnOw0rP_JZb6MxLiBtCg';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contract_text } = body;

    if (!contract_text || contract_text.trim().length < 50) {
      return NextResponse.json({
        success: false,
        error: 'Vui lòng nhập nội dung hợp đồng (ít nhất 50 ký tự)',
        ai_powered: false
      }, { status: 400 });
    }

    // Build prompt
    const prompt = `Bạn là luật sư chuyên về hợp đồng bất động sản Việt Nam. Phân tích hợp đồng thuê mặt bằng sau:

${contract_text.substring(0, 5000)}

Hãy đưa ra (tối đa 400 từ):
1. Rủi ro pháp lý (2-3 điểm quan trọng)
2. Điều khoản cần lưu ý (2-3 điểm)
3. Đánh giá tổng thể: "safe" (an toàn), "review_needed" (cần xem xét thêm), hoặc "high_risk" (rủi ro cao)
4. Điều khoản nên thương lượng lại (nếu có)`;

    // Call Gemini API
    const geminiResponse = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 1024
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);

      return NextResponse.json({
        success: true,
        ai_powered: false,
        fallback_reason: `Gemini API error: ${geminiResponse.status}`,
        risk_level: 'review_needed',
        analysis: 'Hợp đồng cần được xem xét bởi chuyên gia pháp lý. Vui lòng liên hệ luật sư để được tư vấn chi tiết.',
        risks: ['Không thể phân tích tự động'],
        recommendations: ['Liên hệ luật sư để rà soát hợp đồng']
      });
    }

    const geminiData = await geminiResponse.json();
    const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Determine risk level
    let risk_level = 'review_needed';
    const lowerText = aiText.toLowerCase();
    if (lowerText.includes('high_risk') || lowerText.includes('rủi ro cao') || lowerText.includes('high risk')) {
      risk_level = 'high_risk';
    } else if (lowerText.includes('safe') || lowerText.includes('an toàn') || lowerText.includes('không có rủi ro')) {
      risk_level = 'safe';
    }

    return NextResponse.json({
      success: true,
      ai_powered: true,
      model: 'gemini-1.5-flash',
      risk_level,
      analysis: aiText,
      risks: ['Xem chi tiết trong phân tích'],
      recommendations: ['Xem chi tiết trong phân tích']
    });

  } catch (error) {
    console.error('Contract API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      ai_powered: false
    }, { status: 500 });
  }
}
