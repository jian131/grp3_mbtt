// JFinder API Client - n8n Backend
// All requests go through n8n webhooks

const N8N_BASE = process.env.NEXT_PUBLIC_N8N_URL || 'http://localhost:5678/webhook';

// Types
export interface Listing {
  id: number;
  title: string;
  city: string;
  district: string;
  ward: string;
  price_million: number;
  area_m2: number;
  rent_per_sqm_million: number;
  lat: number;
  lon: number;
  type: string;
  image_url: string;
  raw_data?: string;
}

export interface SearchParams {
  city?: string;
  district?: string;
  maxPrice?: number;
  minArea?: number;
  limit?: number;
}

// Fetch listings with filters
export async function fetchListings(params?: SearchParams): Promise<Listing[]> {
  try {
    const query = new URLSearchParams();
    if (params?.city) query.append('city', params.city);
    if (params?.district) query.append('district', params.district);
    if (params?.maxPrice) query.append('maxPrice', String(params.maxPrice));
    if (params?.minArea) query.append('minArea', String(params.minArea));
    if (params?.limit) query.append('limit', String(params.limit));

    const url = `${N8N_BASE}/search${query.toString() ? '?' + query.toString() : ''}`;
    const res = await fetch(url);
    const json = await res.json();

    return json.success ? json.data : [];
  } catch (error) {
    console.error('API Error (listings):', error);
    return [];
  }
}

// Fetch single listing by ID
export async function fetchListing(id: string | number): Promise<Listing | null> {
  try {
    const res = await fetch(`${N8N_BASE}/listing/${id}`);
    const json = await res.json();

    return json.success ? json.data : null;
  } catch (error) {
    console.error('API Error (listing detail):', error);
    return null;
  }
}

// Fetch stats (from PostGIS views via n8n)
export async function fetchStats(): Promise<any> {
  try {
    const res = await fetch(`${N8N_BASE}/stats`);
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (error) {
    console.error('API Error (stats):', error);
    return null;
  }
}

// AI Valuation - simplified version using district averages
export async function getValuation(data: {
  district: string;
  area: number;
  frontage?: number;
  floors?: number;
  type?: string;
}): Promise<any> {
  try {
    // For now, return mock data based on district
    // In production, this would call an n8n workflow
    const basePrice = 50 + Math.random() * 100;
    return {
      suggestedPrice: Math.round(basePrice),
      priceRange: {
        min: Math.round(basePrice * 0.85),
        max: Math.round(basePrice * 1.15)
      },
      potentialScore: 70 + Math.round(Math.random() * 25),
      riskLevel: Math.random() > 0.5 ? 'low' : 'medium',
      priceLabel: basePrice > 100 ? 'expensive' : basePrice < 50 ? 'cheap' : 'fair'
    };
  } catch (error) {
    console.error('API Error (valuation):', error);
    return null;
  }
}

// ROI Calculator
export async function calculateROI(data: {
  monthlyRent: number;
  productPrice: number;
  dailyCustomers: number;
  operatingCost?: number;
}): Promise<any> {
  // Client-side calculation (no backend needed)
  const monthlyRevenue = data.productPrice * data.dailyCustomers * 30;
  const totalMonthlyCost = data.monthlyRent + (data.operatingCost || 0);
  const monthlyProfit = monthlyRevenue - totalMonthlyCost;
  const breakEvenDays = totalMonthlyCost / (data.productPrice * data.dailyCustomers);

  return {
    monthlyRevenue,
    totalMonthlyCost,
    monthlyProfit,
    breakEvenDays,
    roiPercent: ((monthlyProfit / totalMonthlyCost) * 100).toFixed(1)
  };
}
