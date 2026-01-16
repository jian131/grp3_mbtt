/**
 * Application Configuration
 * Centralized config using environment variables with fallbacks
 */

// ===========================================
// API Configuration
// ===========================================

/**
 * Backend API base URL (n8n webhook endpoint)
 * Used for: /search, /roi, /valuation, /stats
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5678/webhook';

/**
 * Check if we're in production (Vercel)
 */
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Check if backend health check is enabled
 */
export const ENABLE_HEALTH_CHECK =
  process.env.NEXT_PUBLIC_ENABLE_HEALTH_CHECK !== 'false';

// ===========================================
// Superset / BI Dashboard Configuration
// ===========================================

/**
 * Superset base URL
 */
export const SUPERSET_URL =
  process.env.NEXT_PUBLIC_SUPERSET_URL || 'http://localhost:8088';

/**
 * BI Dashboard mode: 'iframe' | 'link'
 * - iframe: Embed Superset in page (requires proper CORS/X-Frame-Options config)
 * - link: Show button to open Superset in new tab (safer, always works)
 */
export const BI_MODE: 'iframe' | 'link' =
  (process.env.NEXT_PUBLIC_BI_MODE as 'iframe' | 'link') || 'link';

/**
 * Superset dashboard path (appended to SUPERSET_URL)
 */
export const SUPERSET_DASHBOARD_PATH =
  process.env.NEXT_PUBLIC_SUPERSET_DASHBOARD_PATH || '/superset/dashboard/1/';

/**
 * Full Superset dashboard URL
 */
export const SUPERSET_DASHBOARD_URL = `${SUPERSET_URL}${SUPERSET_DASHBOARD_PATH}`;

// ===========================================
// API Endpoints (relative to API_BASE_URL)
// ===========================================

export const API_ENDPOINTS = {
  search: '/search',
  stats: '/stats',
  roi: '/roi',
  valuation: '/valuation',
  health: '/search?limit=1', // Use search with limit 1 as health check
} as const;

// ===========================================
// Proxy Configuration (for Vercel deployment)
// ===========================================

/**
 * Whether to use the internal proxy for API calls
 * This avoids CORS issues when FE is on Vercel and BE is elsewhere
 */
export const USE_PROXY = IS_PRODUCTION;

/**
 * Proxy base URL (Next.js API routes)
 */
export const PROXY_BASE_URL = '/api/proxy';

/**
 * Get the appropriate base URL for API calls
 * Uses proxy in production, direct URL in development
 */
export function getApiBaseUrl(): string {
  return USE_PROXY ? PROXY_BASE_URL : API_BASE_URL;
}

// ===========================================
// Timeouts and Limits
// ===========================================

export const API_TIMEOUT = 10000; // 10 seconds
export const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds
export const DEFAULT_LISTINGS_LIMIT = 50;
export const MAX_LISTINGS_LIMIT = 1000;
