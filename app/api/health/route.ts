/**
 * Health Check API Route
 * Returns the status of the backend API (n8n)
 */

import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5678/webhook';
const HEALTH_TIMEOUT = 5000;

export async function GET() {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_TIMEOUT);

    const response = await fetch(`${API_BASE_URL}/search?limit=1`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const latency = Date.now() - startTime;

    if (!response.ok) {
      return NextResponse.json({
        status: 'unhealthy',
        backend: API_BASE_URL,
        latency,
        error: `HTTP ${response.status}`,
        timestamp: new Date().toISOString(),
      }, { status: 503 });
    }

    // Try to parse response
    const data = await response.json();
    const hasData = Array.isArray(data) || (data.data && Array.isArray(data.data));

    return NextResponse.json({
      status: 'healthy',
      backend: API_BASE_URL,
      latency,
      hasData,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    const latency = Date.now() - startTime;

    return NextResponse.json({
      status: 'unhealthy',
      backend: API_BASE_URL,
      latency,
      error: error.name === 'AbortError' ? 'Timeout' : error.message,
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
