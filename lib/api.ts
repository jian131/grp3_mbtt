// API Configuration & Helper Functions
// Kết nối Frontend với n8n Backend

// Xác định API Base dựa trên môi trường chạy (Client hay Server)
const IS_SERVER = typeof window === 'undefined';
const API_BASE = IS_SERVER
  ? 'http://localhost:5678/webhook'  // Server-side: Gọi trực tiếp Docker container/Localhost
  : '/api/n8n';                      // Client-side: Gọi qua Next.js Proxy để tránh CORS

export interface Listing {
  id: string;
  name: string;
  province?: string; // Thành phố Hồ Chí Minh, Hà Nội, Đà Nẵng
  district: string;
  ward?: string;
  address?: string;
  type: 'shophouse' | 'kiosk' | 'office' | 'retail' | 'streetfront';
  market_segment?: string;
  price: number;
  rent_per_sqm_million?: number;
  area: number;
  frontage: number;
  floors: number;
  latitude: number;
  longitude: number;
  images?: string[];
  amenities?: {
    schools: number;
    offices: number;
    competitors: number;
  };
  owner?: {
    name: string;
    phone: string;
  };
  postedAt?: string;
  savedCount?: number;
  ai: {
    potentialScore: number;
    suggestedPrice: number;
    riskLevel: 'low' | 'medium' | 'high';
    priceLabel: 'cheap' | 'fair' | 'expensive';
  };
  views: number;
  image_meta?: any;
}

export interface Stats {
  total: number;
  avgPrice: number;
  avgArea: number;
  avgPotential: number;
  byDistrict: Record<string, number>;
  byType: Record<string, number>;
}

export interface District {
  id: string;
  name: string;
  avgPrice: number;
  listings: number;
}

// Fetch danh sách mặt bằng
export async function fetchListings(params?: {
  province?: string;
  district?: string;
  type?: string;
  maxPrice?: number;
  limit?: number;
}): Promise<Listing[]> {
  try {
    const query = new URLSearchParams();
    if (params?.province) query.append('province', params.province);
    if (params?.district) query.append('district', params.district);
    if (params?.type) query.append('type', params.type);
    if (params?.maxPrice) query.append('maxPrice', String(params.maxPrice));
    if (params?.limit) query.append('limit', String(params.limit));

    const url = `${API_BASE}/listings${query.toString() ? '?' + query.toString() : ''}`;
    const res = await fetch(url);
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error('API Error (listings):', error);
    return [];
  }
}

// Fetch thống kê
export async function fetchStats(): Promise<Stats | null> {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    const json = await res.json();
    return json.stats || null;
  } catch (error) {
    console.error('API Error (stats):', error);
    return null;
  }
}

// Fetch danh sách quận
export async function fetchDistricts(): Promise<District[]> {
  try {
    const res = await fetch(`${API_BASE}/districts`);
    const json = await res.json();
    return json.districts || [];
  } catch (error) {
    console.error('API Error (districts):', error);
    return [];
  }
}

// Gọi AI Valuation
export async function getValuation(data: {
  district: string;
  area: number;
  frontage: number;
  floors: number;
  type: string;
}): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/valuation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json.valuation || null;
  } catch (error) {
    console.error('API Error (valuation):', error);
    return null;
  }
}

// Tính ROI
export async function calculateROI(data: {
  monthlyRent: number;
  productPrice: number;
  dailyCustomers: number;
  operatingCost?: number;
}): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/roi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json.analysis || null;
  } catch (error) {
    console.error('API Error (roi):', error);
    return null;
  }
}

// Fetch chi tiết mặt bằng theo ID
export async function fetchListingById(id: string): Promise<Listing | null> {
  try {
    const res = await fetch(`${API_BASE}/listings?id=${id}&limit=1`);
    const json = await res.json();
    if (json.success && json.data && json.data.length > 0) {
      return json.data[0];
    }
    return null;
  } catch (error) {
    console.error('API Error (fetchListingById):', error);
    return null;
  }
}
