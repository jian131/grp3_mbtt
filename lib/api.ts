// JFinder API Client - 3 Cities Dataset (FIXED FIELD MAPPING)

const N8N_BASE = process.env.NEXT_PUBLIC_N8N_URL || 'http://localhost:5678/webhook';

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
  monthly_rent: number;
  product_price: number;
  profit_margin: number;
  target_daily_customers: number;
  operating_cost?: number;
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
  type: string;
  area_m2: number;
  frontage_m?: number;
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
  return {
    ...listing,
    // Add aliases for backward compatibility
    lat: listing.latitude,
    lon: listing.longitude,
    area: listing.area_m2,
    price: listing.price_million,
    frontage: listing.frontage_m,
    title: listing.name,
    images: listing.primary_image_url ? [listing.primary_image_url] : [],
    ai: {
      potentialScore: listing.ai_potential_score,
      priceLabel: listing.price_label
    }
  };
}

// ==================== API FUNCTIONS ====================

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

    const url = `${N8N_BASE}/search${query.toString() ? '?' + query.toString() : ''}`;
    const res = await fetch(url);

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
    // Try n8n first
    const url = `${N8N_BASE}/listing/${id}`;
    const res = await fetch(url);

    if (!res.ok) {
      console.warn(`n8n listing API failed, using Next.js fallback`);
      // Fallback to Next.js API route
      const fallbackRes = await fetch(`/api/listing/${id}`);
      if (fallbackRes.ok) {
        const json = await fallbackRes.json();
        const rawData = json.success && json.data ? json.data : null;
        return rawData ? transformListing(rawData) : null;
      }
      return null;
    }

    const json = await res.json();

    let rawData: any = null;
    if (json.success && json.data) rawData = Array.isArray(json.data) ? json.data[0] : json.data;
    else if (Array.isArray(json) && json.length > 0) rawData = json[0];
    else if (typeof json === 'object' && json.id) rawData = json;

    return rawData ? transformListing(rawData) : null;
  } catch (error) {
    console.error('API Error (listing detail):', error);
    // Last resort fallback
    try {
      const fallbackRes = await fetch(`/api/listing/${id}`);
      if (fallbackRes.ok) {
        const json = await fallbackRes.json();
        const rawData = json.success && json.data ? json.data : null;
        return rawData ? transformListing(rawData) : null;
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
    }
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

    const res = await fetch(`${N8N_BASE}/stats?${query.toString()}`);
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
  try {
    const res = await fetch(`${N8N_BASE}/roi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });

    if (!res.ok) return null;

    const json = await res.json();
    return json.success ? json : null;
  } catch (error) {
    console.error('API Error (roi):', error);
    return null;
  }
}

/**
 * Get valuation for a property
 */
export async function getValuation(input: ValuationInput): Promise<ValuationResult | null> {
  try {
    const res = await fetch(`${N8N_BASE}/valuation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });

    if (!res.ok) return null;

    const json = await res.json();
    return json.success ? json : null;
  } catch (error) {
    console.error('API Error (valuation):', error);
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
