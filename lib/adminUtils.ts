/**
 * Admin Utilities for Vietnam Post-Merge Administrative Units
 * Provides normalization, lookup, and validation functions
 */

import adminCatalog from '@/app/data/admin_catalog_vn_postmerge.json';

interface Province {
  code: string;
  name: string;
  type: string;
  center_lat: number;
  center_lon: number;
  bbox: [number, number, number, number];
  listing_count: number;
}

interface District {
  code: string;
  name: string;
  province: string;
  province_code: string;
  center_lat: number;
  center_lon: number;
  bbox: [number, number, number, number];
  listing_count: number;
}

interface Ward {
  code: string;
  name: string;
  district: string;
  district_code: string;
  center_lat: number;
  center_lon: number;
  listing_count: number;
}

interface AdminCatalog {
  version: string;
  generated_at: string;
  source: string;
  stats: {
    total_listings: number;
    provinces: number;
    districts: number;
    wards: number;
  };
  provinces: Province[];
  districts: District[];
  wards: Ward[];
}

const catalog = adminCatalog as AdminCatalog;

/**
 * Normalize Vietnamese administrative unit name
 * Removes prefixes like "Thành phố", "Tỉnh", "Quận", "Huyện", "Phường", "Xã", etc.
 * Normalizes unicode and converts to lowercase for comparison
 */
export function normalizeAdminName(name: string): string {
  if (!name) return '';

  // Remove common prefixes
  let normalized = name
    .replace(/^Thành phố\s+/i, '')
    .replace(/^Tỉnh\s+/i, '')
    .replace(/^Quận\s+/i, '')
    .replace(/^Huyện\s+/i, '')
    .replace(/^Thị xã\s+/i, '')
    .replace(/^Phường\s+/i, '')
    .replace(/^Xã\s+/i, '')
    .replace(/^Thị trấn\s+/i, '')
    .trim();

  // Normalize unicode (NFD) and remove diacritics for fuzzy matching
  return normalized
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normalize district names with common variations
 * "Quận 1" ~ "Q1" ~ "Q.1" ~ "1"
 */
export function normalizeDistrictName(name: string): string {
  if (!name) return '';

  // Handle "Q1", "Q.1", "Q 1" -> "Quận 1"
  let normalized = name
    .replace(/^Q\.?\s*/i, 'Quận ')
    .trim();

  return normalizeAdminName(normalized);
}

/**
 * Get all provinces from catalog
 */
export function getProvinces(): Province[] {
  return catalog.provinces;
}

/**
 * Get districts by province name
 */
export function getDistrictsByProvince(provinceName: string): District[] {
  const normalizedProvince = normalizeAdminName(provinceName);
  return catalog.districts.filter(d =>
    normalizeAdminName(d.province) === normalizedProvince
  );
}

/**
 * Get wards by district name
 */
export function getWardsByDistrict(districtName: string): Ward[] {
  const normalizedDistrict = normalizeAdminName(districtName);
  return catalog.wards.filter(w =>
    normalizeAdminName(w.district) === normalizedDistrict
  );
}

/**
 * Find province by name (fuzzy match)
 */
export function findProvince(name: string): Province | undefined {
  const normalized = normalizeAdminName(name);
  return catalog.provinces.find(p =>
    normalizeAdminName(p.name) === normalized
  );
}

/**
 * Find district by name (fuzzy match)
 */
export function findDistrict(name: string, provinceName?: string): District | undefined {
  const normalizedDistrict = normalizeDistrictName(name);

  let candidates = catalog.districts.filter(d =>
    normalizeAdminName(d.name) === normalizedDistrict ||
    normalizeDistrictName(d.name) === normalizedDistrict
  );

  if (provinceName && candidates.length > 1) {
    const normalizedProvince = normalizeAdminName(provinceName);
    candidates = candidates.filter(d =>
      normalizeAdminName(d.province) === normalizedProvince
    );
  }

  return candidates[0];
}

/**
 * Get center coordinates for a province
 */
export function getProvinceCenter(provinceName: string): { lat: number; lon: number } | null {
  const province = findProvince(provinceName);
  if (!province) return null;
  return { lat: province.center_lat, lon: province.center_lon };
}

/**
 * Get center coordinates for a district
 */
export function getDistrictCenter(districtName: string, provinceName?: string): { lat: number; lon: number } | null {
  const district = findDistrict(districtName, provinceName);
  if (!district) return null;
  return { lat: district.center_lat, lon: district.center_lon };
}

/**
 * Get bounding box for a province
 */
export function getProvinceBounds(provinceName: string): [number, number, number, number] | null {
  const province = findProvince(provinceName);
  if (!province) return null;
  return province.bbox;
}

/**
 * Get bounding box for a district
 */
export function getDistrictBounds(districtName: string, provinceName?: string): [number, number, number, number] | null {
  const district = findDistrict(districtName, provinceName);
  if (!district) return null;
  return district.bbox;
}

/**
 * Check if a point is within a bounding box
 */
export function isPointInBounds(lat: number, lon: number, bbox: [number, number, number, number]): boolean {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
}

/**
 * Validate listing admin labels against coordinates
 */
export function validateListingAdmin(
  lat: number,
  lon: number,
  province: string,
  district: string
): { valid: boolean; expected_province?: string; expected_district?: string } {
  // Find which province bbox contains this point
  const matchingProvince = catalog.provinces.find(p =>
    isPointInBounds(lat, lon, p.bbox)
  );

  if (!matchingProvince) {
    return { valid: false };
  }

  // Find which district bbox contains this point
  const provincialDistricts = catalog.districts.filter(d => d.province === matchingProvince.name);
  const matchingDistrict = provincialDistricts.find(d =>
    isPointInBounds(lat, lon, d.bbox)
  );

  const normalizedProvince = normalizeAdminName(province);
  const normalizedDistrict = normalizeAdminName(district);
  const expectedProvince = normalizeAdminName(matchingProvince.name);
  const expectedDistrict = matchingDistrict ? normalizeAdminName(matchingDistrict.name) : '';

  const valid = normalizedProvince === expectedProvince &&
    (!matchingDistrict || normalizedDistrict === expectedDistrict);

  return {
    valid,
    expected_province: matchingProvince.name,
    expected_district: matchingDistrict?.name
  };
}

/**
 * Get catalog stats
 */
export function getCatalogStats() {
  return catalog.stats;
}

/**
 * Get catalog version
 */
export function getCatalogVersion() {
  return catalog.version;
}

export default {
  normalizeAdminName,
  normalizeDistrictName,
  getProvinces,
  getDistrictsByProvince,
  getWardsByDistrict,
  findProvince,
  findDistrict,
  getProvinceCenter,
  getDistrictCenter,
  getProvinceBounds,
  getDistrictBounds,
  isPointInBounds,
  validateListingAdmin,
  getCatalogStats,
  getCatalogVersion
};
