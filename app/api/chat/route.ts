/**
 * Chat API Route - Integrates with Dify
 * ONLY uses internal JSON context via chatContext.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { buildChatContext } from '@/lib/chatContext';

const DIFY_API_KEY = process.env.DIFY_API_KEY || '';
const DIFY_BASE_URL = process.env.DIFY_BASE_URL || 'https://api.dify.ai/v1';
const DIFY_APP_ID = process.env.DIFY_APP_ID || '';

interface ChatRequest {
  message: string;
  conversationId?: string;
}

interface DifyResponse {
  answer?: string;
  conversation_id?: string;
  message_id?: string;
  [key: string]: any;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, conversationId } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Validate Dify config
    if (!DIFY_API_KEY) {
      return NextResponse.json(
        { error: 'Dify API key not configured. Set DIFY_API_KEY in environment.' },
        { status: 500 }
      );
    }

    // Build context from internal JSON ONLY
    const { context, listings, filters } = buildChatContext(message);

    console.log('[Chat API] Query:', message);
    console.log('[Chat API] Filters:', filters);
    console.log('[Chat API] Listings found:', listings.length);

    // System prompt - LOCK DOWN to context only
    const systemPrompt = `Bạn là trợ lý tìm kiếm mặt bằng thương mại tại Việt Nam.

QUY TẮC NGHIÊM NGẶT:
1. CHỈ trả lời dựa trên CONTEXT dữ liệu bên dưới
2. KHÔNG suy đoán, bịa đặt thông tin ngoài context
3. Nếu không có trong context => nói "Không có dữ liệu phù hợp"
4. Mỗi câu trả lời PHẢI kèm ID listing cụ thể
5. Trả lời bằng tiếng Việt, ngắn gọn, chuyên nghiệp

CONTEXT DỮ LIỆU NỘI BỘ:
${context}

Hãy trả lời câu hỏi của người dùng dựa HOÀN TOÀN trên context trên.`;

    // Call Dify API
    const difyPayload = {
      inputs: {
        context: context,
        system_prompt: systemPrompt
      },
      query: message,
      response_mode: 'blocking',
      conversation_id: conversationId || '',
      user: 'user-' + Date.now()
    };

    console.log('[Chat API] Calling Dify...');

    const difyResponse = await fetch(`${DIFY_BASE_URL}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(difyPayload)
    });

    if (!difyResponse.ok) {
      const errorText = await difyResponse.text();
      console.error('[Chat API] Dify error:', difyResponse.status, errorText);
      return NextResponse.json(
        { error: `Dify API error: ${difyResponse.status}`, details: errorText },
        { status: difyResponse.status }
      );
    }

    const difyResult: DifyResponse = await difyResponse.json();
    console.log('[Chat API] Dify response received');

    // Return combined result
    return NextResponse.json({
      answer: difyResult.answer || 'Không có phản hồi từ AI',
      conversationId: difyResult.conversation_id || conversationId,
      messageId: difyResult.message_id,
      listings: listings.slice(0, 10).map(l => ({
        id: l.id,
        name: l.name,
        province: l.province,
        district: l.district,
        ward: l.ward,
        address: l.address,
        type: l.type,
        area: l.area,
        price: l.price,
        potentialScore: l.ai?.potentialScore || 0,
        latitude: l.latitude,
        longitude: l.longitude
      })),
      filters: filters,
      metadata: {
        totalListingsFound: listings.length,
        contextLength: context.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('[Chat API] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Chat API is running',
    env: {
      hasDifyKey: !!DIFY_API_KEY,
      difyBaseUrl: DIFY_BASE_URL
    }
  });
}
