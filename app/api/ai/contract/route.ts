import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = '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';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

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

    // Call Groq API
    const groqResponse = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 1200
      })
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Groq API error:', errorText);

      return NextResponse.json({
        success: true,
        ai_powered: false,
        fallback_reason: `Groq API error: ${groqResponse.status}`,
        risk_level: 'review_needed',
        analysis: 'Hợp đồng cần được xem xét bởi chuyên gia pháp lý. Vui lòng liên hệ luật sư để được tư vấn chi tiết.',
        risks: ['Không thể phân tích tự động'],
        recommendations: ['Liên hệ luật sư để rà soát hợp đồng']
      });
    }

    const groqData = await groqResponse.json();
    const aiText = groqData.choices?.[0]?.message?.content || '';

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
      model: 'llama-3.3-70b',
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
