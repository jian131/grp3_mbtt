// JFinder API Client - 3 Cities Dataset (FIXED FIELD MAPPING)
import {
  API_BASE_URL,
  getApiBaseUrl,
  API_TIMEOUT,
  USE_PROXY
} from './config';

// Helper to get the base URL (uses proxy in production)
const getBaseUrl = () => getApiBaseUrl();

// Legacy support for direct access
const N8N_BASE = API_BASE_URL;

// ==================== TYPES ====================

export interface Listing {
  id: string;
  name: string;
  address: string;
  province: string;
  district: string;
  ward: string;
  latitude: number;
  longitude: number;
  type: 'streetfront' | 'shophouse' | 'kiosk' | 'office';
  market_segment: 'street_retail' | 'shopping_mall' | 'office';
  area_m2: number;
  frontage_m: number;
  floors: number;
  price_million: number;
  rent_per_sqm_million: number;
  views: number;
  saved_count: number;
  primary_image_url: string;
  ai_suggested_price?: number;
  ai_potential_score?: number;
  ai_risk_level?: 'Low' | 'Medium' | 'High';
  price_label?: 'cheap' | 'fair' | 'expensive';
  posted_at?: string;
  created_at?: string;
  owner?: { name: string; phone: string };

  // COMPATIBILITY ALIASES for old components
  lat?: number;   // alias for latitude
  lon?: number;   // alias for longitude
  area?: number;  // alias for area_m2
  price?: number; // alias for price_million
  frontage?: number; // alias for frontage_m
  title?: string; // alias for name
  images?: string[]; // compat for primary_image_url
  ai?: {
    potentialScore?: number;
    priceLabel?: 'cheap' | 'fair' | 'expensive';
  };
}

export interface SearchParams {
  city?: string;
  province?: string;
  district?: string;
  ward?: string;
  type?: string;
  segment?: string;
  min_price?: number;
  max_price?: number;
  minPrice?: number; // compat
  maxPrice?: number; // compat
  min_area?: number;
  max_area?: number;
  minArea?: number; // compat
  maxArea?: number; // compat
  lat?: number;
  lon?: number;
  radius_m?: number;
  limit?: number;
  offset?: number;
}

export interface DistrictStat {
  province: string;
  district: string;
  listing_count: number;
  median_price: number;
  p25_price: number;
  p75_price: number;
  min_price?: number;
  max_price?: number;
  avg_views: number;
  total_saved: number;
}

export interface WardStat extends DistrictStat {
  ward: string;
  type: string;
}

export interface ROIInput {
  // Support both snake_case and camelCase
  monthly_rent?: number;
  monthlyRent?: number;
  product_price?: number;
  productPrice?: number;
  profit_margin?: number;
  profitMargin?: number;
  target_daily_customers?: number;
  dailyCustomers?: number;
  operating_cost?: number;
  operatingCost?: number;
}

export interface ROIResult {
  inputs: ROIInput;
  results: {
    daily_profit_vnd: number;
    monthly_revenue_vnd: number;
    total_monthly_cost_vnd: number;
    monthly_net_profit_vnd: number;
    break_even_days: number;
    roi_percent: number;
    viability: 'excellent' | 'good' | 'moderate' | 'risky';
  };
}

export interface ValuationInput {
  district: string;
  ward?: string;
  type?: string;
  area_m2?: number;
  area?: number;
  frontage_m?: number;
  frontage?: number;
  floors?: number;
}

export interface ValuationResult {
  input: ValuationInput;
  market_stats: {
    p25_per_sqm: string;
    median_per_sqm: string;
    p75_per_sqm: string;
    sample_size: number;
  };
  valuation: {
    suggested_price_million: number;
    price_range: { min: number; max: number };
    price_per_sqm: number;
    adjustment_applied: string;
    confidence: 'low' | 'medium' | 'high';
  };
}

// ==================== DATA MAPPING ====================

/**
 * Transform raw API response to add compatibility aliases
 */
function transformListing(listing: any): Listing {
  // Parse images if string
  let images = listing.images || [];
  if (typeof images === 'string') {
    try {
      images = JSON.parse(images.replace(/'/g, '"'));
    } catch (e) {
      images = listing.primary_image_url ? [listing.primary_image_url] : [];
    }
  }
  if (!Array.isArray(images) || images.length === 0) {
    images = listing.primary_image_url ? [listing.primary_image_url] : [];
  }

  // Determine price label
  const price = listing.price_million || listing.price || 0;
  const suggestedPrice = listing.ai_suggested_price || listing.ai?.suggestedPrice || price;
  let priceLabel = listing.price_label || listing.ai?.priceLabel || 'fair';
  if (!listing.price_label && suggestedPrice && price) {
    const ratio = price / suggestedPrice;
    if (ratio < 0.9) priceLabel = 'cheap';
    else if (ratio > 1.1) priceLabel = 'expensive';
  }

  return {
    ...listing,
    // Add aliases for backward compatibility
    lat: listing.latitude || listing.lat,
    lon: listing.longitude || listing.lon,
    area: listing.area_m2 || listing.area,
    price: listing.price_million || listing.price,
    frontage: listing.frontage_m || listing.frontage,
    title: listing.name || listing.title,
    images: images,
    ai: listing.ai || {
      potentialScore: listing.ai_potential_score !== undefined && listing.ai_potential_score !== null
        ? listing.ai_potential_score
        : 50,
      suggestedPrice: suggestedPrice,
      riskLevel: (listing.ai_risk_level || 'medium').toLowerCase(),
      priceLabel: priceLabel
    }
  };
}

// ==================== API FUNCTIONS ====================

/**
 * Create AbortController with timeout
 */
function createTimeoutController(timeout: number = API_TIMEOUT): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeout);
  return controller;
}

/**
 * Fetch listings with filters
 */
export async function fetchListings(params?: SearchParams): Promise<Listing[]> {
  try {
    const query = new URLSearchParams();

    if (params?.city) query.append('city', params.city);
    if (params?.province) query.append('province', params.province);
    if (params?.district) query.append('district', params.district);
    if (params?.ward) query.append('ward', params.ward);
    if (params?.type) query.append('type', params.type);
    if (params?.segment) query.append('segment', params.segment);

    const minPrice = params?.min_price || params?.minPrice;
    const maxPrice = params?.max_price || params?.maxPrice;
    const minArea = params?.min_area || params?.minArea;
    const maxArea = params?.max_area || params?.maxArea;

    if (minPrice) query.append('min_price', String(minPrice));
    if (maxPrice) query.append('max_price', String(maxPrice));
    if (minArea) query.append('min_area', String(minArea));
    if (maxArea) query.append('max_area', String(maxArea));
    if (params?.lat) query.append('lat', String(params.lat));
    if (params?.lon) query.append('lon', String(params.lon));
    if (params?.radius_m) query.append('radius_m', String(params.radius_m));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.offset) query.append('offset', String(params.offset));

    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/search${query.toString() ? '?' + query.toString() : ''}`;
    const controller = createTimeoutController();

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'ngrok-skip-browser-warning': '1' }
    });

    if (!res.ok) {
      console.error(`API Error ${res.status}: ${res.statusText}`);
      return [];
    }

    const json = await res.json();

    // Support both direct array and wrapped response
    let rawData: any[] = [];
    if (Array.isArray(json)) rawData = json;
    else if (json.data && Array.isArray(json.data)) rawData = json.data;
    else if (json.success && Array.isArray(json.data)) rawData = json.data;

    // Transform all listings to add compatibility aliases
    return rawData.map(transformListing);
  } catch (error) {
    console.error('API Error (listings):', error);
    return [];
  }
}

/**
 * Fetch single listing by ID
 */
export async function fetchListing(id: string): Promise<Listing | null> {
  try {
    // First try Next.js API (direct file access, most reliable)
    const fallbackRes = await fetch(`/api/listing/${id}`);
    if (fallbackRes.ok) {
      const json = await fallbackRes.json();
      const rawData = json.success && json.data ? json.data : null;
      if (rawData) return transformListing(rawData);
    }

    // If that fails, use n8n search and filter client-side
    console.warn(`Next.js API failed, trying n8n search`);
    const baseUrl = getBaseUrl();
    const searchUrl = `${baseUrl}/search?limit=5000`;
    const controller = createTimeoutController();
    const searchRes = await fetch(searchUrl, {
      signal: controller.signal,
      headers: { 'ngrok-skip-browser-warning': '1' }
    });

    if (searchRes.ok) {
      const json = await searchRes.json();
      const listings = json.data || json;
      if (Array.isArray(listings) && listings.length > 0) {
        const found = listings.find((l: any) => l.id === id);
        if (found) return transformListing(found);
      }
    }

    return null;
  } catch (error) {
    console.error('API Error (listing detail):', error);
    return null;
  }
}

/**
 * Fetch statistics (district or ward level)
 */
export async function fetchStats(level: 'district' | 'ward' = 'district', city?: string): Promise<DistrictStat[] | WardStat[]> {
  try {
    const query = new URLSearchParams();
    query.append('level', level);
    if (city) query.append('city', city);

    const baseUrl = getBaseUrl();
    const controller = createTimeoutController();
    const res = await fetch(`${baseUrl}/stats?${query.toString()}`, {
      signal: controller.signal,
      headers: { 'ngrok-skip-browser-warning': '1' }
    });
    if (!res.ok) return [];

    const json = await res.json();

    if (Array.isArray(json)) return json;
    if (json.data && Array.isArray(json.data)) return json.data;

    return [];
  } catch (error) {
    console.error('API Error (stats):', error);
    return [];
  }
}

/**
 * Calculate ROI
 */
export async function calculateROI(input: ROIInput): Promise<ROIResult | null> {
  const baseUrl = getBaseUrl();

  try {
    const controller = createTimeoutController();
    const res = await fetch(`${baseUrl}/roi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': '1'
      },
      body: JSON.stringify(input),
      signal: controller.signal
    });

    if (!res.ok) {
      console.warn('n8n ROI API failed, using Next.js fallback');
      const fallbackRes = await fetch('/api/roi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
      if (fallbackRes.ok) {
        const json = await fallbackRes.json();
        return json.success ? json : null;
      }
      return null;
    }

    // Try to parse JSON - n8n sometimes returns empty body
    try {
      const json = await res.json();
      return json.success ? json : null;
    } catch (parseError) {
      console.warn('n8n ROI returned invalid JSON, using fallback');
      const fallbackRes = await fetch('/api/roi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
      if (fallbackRes.ok) {
        const json = await fallbackRes.json();
        return json.success ? json : null;
      }
      return null;
    }
  } catch (error) {
    console.error('API Error (roi):', error);
    try {
      const fallbackRes = await fetch('/api/roi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
      if (fallbackRes.ok) {
        const json = await fallbackRes.json();
        return json.success ? json : null;
      }
    } catch (fallbackError) {
      console.error('ROI fallback also failed:', fallbackError);
    }
    return null;
  }
}

/**
 * Get valuation for a property
 */
export async function getValuation(input: ValuationInput): Promise<ValuationResult | null> {
  const baseUrl = getBaseUrl();

  try {
    const controller = createTimeoutController();
    const res = await fetch(`${baseUrl}/valuation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': '1'
      },
      body: JSON.stringify(input),
      signal: controller.signal
    });

    if (!res.ok) {
      console.warn('n8n Valuation API failed, using Next.js fallback');
      const fallbackRes = await fetch('/api/valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
      if (fallbackRes.ok) {
        const json = await fallbackRes.json();
        return json.success ? json : null;
      }
      return null;
    }

    // Try to parse JSON - n8n sometimes returns empty body
    try {
      const json = await res.json();
      return json.success ? json : null;
    } catch (parseError) {
      console.warn('n8n Valuation returned invalid JSON, using fallback');
      const fallbackRes = await fetch('/api/valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
      if (fallbackRes.ok) {
        const json = await fallbackRes.json();
        return json.success ? json : null;
      }
      return null;
    }
  } catch (error) {
    console.error('API Error (valuation):', error);
    try {
      const fallbackRes = await fetch('/api/valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
      if (fallbackRes.ok) {
        const json = await fallbackRes.json();
        return json.success ? json : null;
      }
    } catch (fallbackError) {
      console.error('Valuation fallback also failed:', fallbackError);
    }
    return null;
  }
}

// ==================== LEGACY COMPATIBILITY ====================

export interface Stats {
  total: number;
  avgPrice: number;
  avgArea: number;
  avgPotential: number;
  byDistrict: Record<string, number>;
  byType: Record<string, number>;
  priceDistribution?: Record<string, number>;
}

/**
 * Fetch stats in legacy format (for dashboard compatibility)
 */
export async function fetchStatsLegacy(): Promise<Stats | null> {
  try {
    const districtStats = await fetchStats('district');

    if (!districtStats.length) {
      return { total: 0, avgPrice: 0, avgArea: 0, avgPotential: 0, byDistrict: {}, byType: {} };
    }

    let totalListings = 0;
    let totalPriceSum = 0;
    const byDistrict: Record<string, number> = {};

    districtStats.forEach(item => {
      const count = Number(item.listing_count) || 0;
      const price = Number(item.median_price) || 0;

      totalListings += count;
      totalPriceSum += price * count;
      byDistrict[item.district] = count;
    });

    const avgPrice = totalListings > 0 ? totalPriceSum / totalListings : 0;

    const byType: Record<string, number> = {
      streetfront: Math.floor(totalListings * 0.35),
      shophouse: Math.floor(totalListings * 0.25),
      office: Math.floor(totalListings * 0.25),
      kiosk: Math.floor(totalListings * 0.15)
    };

    return {
      total: totalListings,
      avgPrice,
      avgArea: 80,
      avgPotential: 25,
      byDistrict,
      byType,
      priceDistribution: {
        '< 20tr': Math.floor(totalListings * 0.2),
        '20-50tr': Math.floor(totalListings * 0.35),
        '50-100tr': Math.floor(totalListings * 0.3),
        '> 100tr': Math.floor(totalListings * 0.15)
      }
    };
  } catch (error) {
    console.error('API Error (stats legacy):', error);
    return null;
  }
}

// ==================== HEALTH CHECK ====================

export interface HealthCheckResult {
  online: boolean;
  latency?: number;
  error?: string;
}

/**
 * Check if backend API is available
 * Uses /search?limit=1 as a lightweight health check
 */
export async function checkBackendHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const baseUrl = getBaseUrl();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout for health check

    const res = await fetch(`${baseUrl}/search?limit=1`, {
      signal: controller.signal,
      headers: { 'ngrok-skip-browser-warning': '1' }
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return {
        online: false,
        error: `HTTP ${res.status}`,
        latency: Date.now() - startTime
      };
    }

    // Try to parse response
    const json = await res.json();
    const hasData = Array.isArray(json) || (json.data && Array.isArray(json.data));

    return {
      online: hasData,
      latency: Date.now() - startTime
    };
  } catch (error: any) {
    return {
      online: false,
      error: error.name === 'AbortError' ? 'Timeout' : error.message,
      latency: Date.now() - startTime
    };
  }
}
