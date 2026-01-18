/**
 * Data Access Layer - Single Source of Truth
 * ONLY reads from internal JSON file: app/data/listings_vn_postmerge.json
 * NO external DB/HTTP queries allowed
 */

import fs from 'fs';
import path from 'path';

export interface Listing {
  id: string;
  name: string;
  province: string;
  district: string;
  ward?: string;
  address: string;
  type: string;
  area: number;
  price: number;
  frontage?: number;
  latitude: number;
  longitude: number;
  views?: number;
  images?: string[];
  ai?: {
    potentialScore?: number;
    priceLabel?: string;
  };
}

export interface SearchFilters {
  province?: string;
  district?: string;
  ward?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  minPotentialScore?: number;
}

let cachedListings: Listing[] | null = null;

/**
 * Load JSON once and cache in memory
 */
function loadListings(): Listing[] {
  if (cachedListings) return cachedListings;

  const filePath = path.join(process.cwd(), 'app/data/listings_vn_postmerge.json');

  if (!fs.existsSync(filePath)) {
    throw new Error(`Listings file not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);

  // Normalize data
  cachedListings = data.map((item: any) => ({
    id: item.id,
    name: item.name || item.title || 'N/A',
    province: item.province || '',
    district: item.district || '',
    ward: item.ward || item.phuong || '',
    address: item.address || '',
    type: item.type || 'unknown',
    area: parseFloat(item.area) || 0,
    price: parseFloat(item.price) || 0,
    frontage: item.frontage ? parseFloat(item.frontage) : undefined,
    latitude: parseFloat(item.latitude) || 0,
    longitude: parseFloat(item.longitude) || 0,
    views: item.views || 0,
    images: item.images || [],
    ai: {
      potentialScore: item.ai?.potentialScore || item.ai_potential_score || 0,
      priceLabel: item.ai?.priceLabel || item.ai_price_label,
    }
  }));

  return cachedListings;
}

/**
 * Search listings with filters
 */
export function searchListings(filters: SearchFilters = {}, limit: number = 30): Listing[] {
  const listings = loadListings();

  let results = listings.filter(listing => {
    // Province filter (case insensitive, normalize)
    if (filters.province) {
      const normalizedProvince = filters.province.toLowerCase()
        .replace('thành phố ', '')
        .replace('tỉnh ', '');
      const listingProvince = listing.province.toLowerCase()
        .replace('thành phố ', '')
        .replace('tỉnh ', '');
      if (!listingProvince.includes(normalizedProvince)) return false;
    }

    // District filter
    if (filters.district) {
      const normalizedDistrict = filters.district.toLowerCase();
      const listingDistrict = listing.district.toLowerCase();
      if (!listingDistrict.includes(normalizedDistrict)) return false;
    }

    // Ward filter
    if (filters.ward) {
      const normalizedWard = filters.ward.toLowerCase();
      const listingWard = (listing.ward || '').toLowerCase();
      if (!listingWard.includes(normalizedWard)) return false;
    }

    // Type filter
    if (filters.type) {
      if (listing.type.toLowerCase() !== filters.type.toLowerCase()) return false;
    }

    // Price range
    if (filters.minPrice !== undefined && listing.price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && listing.price > filters.maxPrice) return false;

    // Area range
    if (filters.minArea !== undefined && listing.area < filters.minArea) return false;
    if (filters.maxArea !== undefined && listing.area > filters.maxArea) return false;

    // Potential score
    if (filters.minPotentialScore !== undefined) {
      const score = listing.ai?.potentialScore || 0;
      if (score < filters.minPotentialScore) return false;
    }

    return true;
  });

  // Sort by potential score desc, then views desc
  results.sort((a, b) => {
    const scoreA = a.ai?.potentialScore || 0;
    const scoreB = b.ai?.potentialScore || 0;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return (b.views || 0) - (a.views || 0);
  });

  return results.slice(0, limit);
}

/**
 * Get statistics by field
 */
export function statsBy(field: 'price' | 'area', filters: SearchFilters = {}): {
  count: number;
  min: number;
  max: number;
  avg: number;
  total: number;
} {
  const listings = searchListings(filters, 9999);

  if (listings.length === 0) {
    return { count: 0, min: 0, max: 0, avg: 0, total: 0 };
  }

  const values = listings.map(l => l[field]).filter(v => v > 0);
  const total = values.reduce((sum, v) => sum + v, 0);

  return {
    count: listings.length,
    min: Math.min(...values),
    max: Math.max(...values),
    avg: total / values.length,
    total
  };
}

/**
 * Get all listings count (for validation)
 */
export function getTotalCount(): number {
  return loadListings().length;
}

/**
 * Get top listings by criteria
 */
export function getTopListings(
  sortBy: 'price' | 'area' | 'potentialScore' | 'views' = 'potentialScore',
  order: 'asc' | 'desc' = 'desc',
  limit: number = 10,
  filters: SearchFilters = {}
): Listing[] {
  const listings = searchListings(filters, 9999);

  listings.sort((a, b) => {
    let valA: number, valB: number;

    switch (sortBy) {
      case 'potentialScore':
        valA = a.ai?.potentialScore || 0;
        valB = b.ai?.potentialScore || 0;
        break;
      case 'views':
        valA = a.views || 0;
        valB = b.views || 0;
        break;
      default:
        valA = a[sortBy] || 0;
        valB = b[sortBy] || 0;
    }

    return order === 'desc' ? valB - valA : valA - valB;
  });

  return listings.slice(0, limit);
}
