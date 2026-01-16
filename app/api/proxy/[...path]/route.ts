/**
 * API Proxy Route
 * Proxies requests to the backend API (n8n) to avoid CORS issues in production
 *
 * Usage:
 * - GET /api/proxy/search?limit=10 → GET {API_BASE_URL}/search?limit=10
 * - POST /api/proxy/roi → POST {API_BASE_URL}/roi
 */

import { NextRequest, NextResponse } from 'next/server';

// Get backend URL from env (server-side, no NEXT_PUBLIC prefix needed)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5678/webhook';
const PROXY_TIMEOUT = 15000; // 15 seconds

// Allowed methods
const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

// Headers to forward from client
const FORWARD_REQUEST_HEADERS = [
  'content-type',
  'accept',
  'accept-language',
];

// Headers to forward from backend response
const FORWARD_RESPONSE_HEADERS = [
  'content-type',
  'content-length',
  'cache-control',
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxy(request, await params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxy(request, await params);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxy(request, await params);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxy(request, await params);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxy(request, await params);
}

async function handleProxy(
  request: NextRequest,
  params: { path: string[] }
) {
  const method = request.method;

  // Validate method
  if (!ALLOWED_METHODS.includes(method)) {
    return NextResponse.json(
      { error: 'Method not allowed', method },
      { status: 405 }
    );
  }

  // Build target URL
  const pathSegments = params.path || [];
  const path = '/' + pathSegments.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const targetUrl = `${API_BASE_URL}${path}${searchParams ? '?' + searchParams : ''}`;

  console.log(`[Proxy] ${method} ${path} → ${targetUrl}`);

  try {
    // Prepare headers
    const headers: Record<string, string> = {};
    FORWARD_REQUEST_HEADERS.forEach((name) => {
      const value = request.headers.get(name);
      if (value) headers[name] = value;
    });

    // Get body for POST/PUT/PATCH
    let body: string | undefined;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        body = await request.text();
      } catch {
        body = undefined;
      }
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROXY_TIMEOUT);

    // Make request to backend
    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Get response body
    const responseText = await response.text();

    // Build response headers
    const responseHeaders: Record<string, string> = {};
    FORWARD_RESPONSE_HEADERS.forEach((name) => {
      const value = response.headers.get(name);
      if (value) responseHeaders[name] = value;
    });

    // Add CORS headers
    responseHeaders['Access-Control-Allow-Origin'] = '*';
    responseHeaders['Access-Control-Allow-Methods'] = ALLOWED_METHODS.join(', ');

    // Return proxied response
    return new NextResponse(responseText, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error(`[Proxy] Error:`, error.message);

    // Handle timeout
    if (error.name === 'AbortError') {
      return NextResponse.json(
        {
          error: 'Backend timeout',
          message: `Request to ${path} timed out after ${PROXY_TIMEOUT}ms`,
          target: API_BASE_URL,
        },
        { status: 504 }
      );
    }

    // Handle connection errors
    if (error.cause?.code === 'ECONNREFUSED') {
      return NextResponse.json(
        {
          error: 'Backend unavailable',
          message: 'Cannot connect to backend API. Is n8n running?',
          target: API_BASE_URL,
          hint: 'Run: docker-compose up -d n8n',
        },
        { status: 503 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        error: 'Proxy error',
        message: error.message || 'Unknown error',
        target: API_BASE_URL,
      },
      { status: 502 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': ALLOWED_METHODS.join(', '),
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Access-Control-Max-Age': '86400',
    },
  });
}
