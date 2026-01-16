/**
 * Map Configuration and Geo Utilities
 * Centralized map settings, zoom levels, and district bounds
 */

// ==============================================================================
// ZOOM LEVEL CONSTANTS
// ==============================================================================

export const MAP_ZOOM = {
  COUNTRY: 6,
  CITY: 12,
  DISTRICT: 14,
  WARD: 15,
  LISTING: 17,
  MAX: 18,
} as const;

// ==============================================================================
// CITY CENTERS (for initial view and reset)
// ==============================================================================

export const CITY_CENTERS: Record<string, { lat: number; lon: number; zoom: number }> = {
  "Thành phố Hà Nội": { lat: 21.0285, lon: 105.8542, zoom: MAP_ZOOM.CITY },
  "Thành phố Đà Nẵng": { lat: 16.0544, lon: 108.2022, zoom: MAP_ZOOM.CITY },
  "Thành phố Hồ Chí Minh": { lat: 10.8231, lon: 106.6297, zoom: MAP_ZOOM.CITY },
};

// Short name aliases
export const CITY_ALIASES: Record<string, string> = {
  "Hà Nội": "Thành phố Hà Nội",
  "HN": "Thành phố Hà Nội",
  "Đà Nẵng": "Thành phố Đà Nẵng",
  "DN": "Thành phố Đà Nẵng",
  "Hồ Chí Minh": "Thành phố Hồ Chí Minh",
  "HCM": "Thành phố Hồ Chí Minh",
  "TP.HCM": "Thành phố Hồ Chí Minh",
  "TPHCM": "Thành phố Hồ Chí Minh",
  "Sài Gòn": "Thành phố Hồ Chí Minh",
};

// Default center (Vietnam)
export const DEFAULT_CENTER = { lat: 16.0, lon: 107.0, zoom: MAP_ZOOM.COUNTRY };

// ==============================================================================
// DISTRICT CENTROIDS AND BOUNDS
// Extracted from GADM data for 3 cities
// ==============================================================================

export interface DistrictGeo {
  center: { lat: number; lon: number };
  bounds: [[number, number], [number, number]]; // [[south, west], [north, east]]
}

export const DISTRICT_GEO: Record<string, Record<string, DistrictGeo>> = {
  "Thành phố Hà Nội": {
    "Quận Ba Đình": {
      center: { lat: 21.0358, lon: 105.8194 },
      bounds: [[21.0150, 105.7950], [21.0550, 105.8450]]
    },
    "Quận Hoàn Kiếm": {
      center: { lat: 21.0285, lon: 105.8542 },
      bounds: [[21.0150, 105.8400], [21.0420, 105.8700]]
    },
    "Quận Hai Bà Trưng": {
      center: { lat: 21.0067, lon: 105.8600 },
      bounds: [[20.9850, 105.8400], [21.0280, 105.8800]]
    },
    "Quận Đống Đa": {
      center: { lat: 21.0167, lon: 105.8283 },
      bounds: [[20.9950, 105.8050], [21.0380, 105.8520]]
    },
    "Quận Tây Hồ": {
      center: { lat: 21.0667, lon: 105.8167 },
      bounds: [[21.0450, 105.7900], [21.0880, 105.8450]]
    },
    "Quận Cầu Giấy": {
      center: { lat: 21.0333, lon: 105.7833 },
      bounds: [[21.0150, 105.7650], [21.0520, 105.8050]]
    },
    "Quận Long Biên": {
      center: { lat: 21.0403, lon: 105.8889 },
      bounds: [[21.0100, 105.8600], [21.0700, 105.9200]]
    },
    "Quận Hoàng Mai": {
      center: { lat: 20.9792, lon: 105.8611 },
      bounds: [[20.9500, 105.8350], [21.0080, 105.8880]]
    },
    "Quận Thanh Xuân": {
      center: { lat: 20.9931, lon: 105.8106 },
      bounds: [[20.9750, 105.7900], [21.0120, 105.8350]]
    },
    "Quận Hà Đông": {
      center: { lat: 20.9717, lon: 105.7772 },
      bounds: [[20.9450, 105.7500], [20.9980, 105.8050]]
    },
    "Quận Nam Từ Liêm": {
      center: { lat: 21.0175, lon: 105.7522 },
      bounds: [[20.9950, 105.7300], [21.0400, 105.7750]]
    },
    "Quận Bắc Từ Liêm": {
      center: { lat: 21.0667, lon: 105.7500 },
      bounds: [[21.0450, 105.7250], [21.0880, 105.7750]]
    },
  },
  "Thành phố Đà Nẵng": {
    "Quận Hải Châu": {
      center: { lat: 16.0678, lon: 108.2208 },
      bounds: [[16.0450, 108.2000], [16.0900, 108.2450]]
    },
    "Quận Thanh Khê": {
      center: { lat: 16.0731, lon: 108.1833 },
      bounds: [[16.0550, 108.1650], [16.0920, 108.2050]]
    },
    "Quận Sơn Trà": {
      center: { lat: 16.1167, lon: 108.2500 },
      bounds: [[16.0900, 108.2200], [16.1450, 108.2800]]
    },
    "Quận Ngũ Hành Sơn": {
      center: { lat: 16.0167, lon: 108.2500 },
      bounds: [[15.9900, 108.2200], [16.0450, 108.2800]]
    },
    "Quận Liên Chiểu": {
      center: { lat: 16.1000, lon: 108.1333 },
      bounds: [[16.0700, 108.1050], [16.1300, 108.1650]]
    },
    "Quận Cẩm Lệ": {
      center: { lat: 16.0167, lon: 108.2000 },
      bounds: [[15.9900, 108.1750], [16.0450, 108.2250]]
    },
  },
  "Thành phố Hồ Chí Minh": {
    "Quận 1": {
      center: { lat: 10.7756, lon: 106.7019 },
      bounds: [[10.7600, 106.6850], [10.7920, 106.7200]]
    },
    "Quận 3": {
      center: { lat: 10.7833, lon: 106.6833 },
      bounds: [[10.7700, 106.6650], [10.7970, 106.7020]]
    },
    "Quận 4": {
      center: { lat: 10.7583, lon: 106.7017 },
      bounds: [[10.7450, 106.6850], [10.7720, 106.7200]]
    },
    "Quận 5": {
      center: { lat: 10.7542, lon: 106.6625 },
      bounds: [[10.7400, 106.6450], [10.7680, 106.6800]]
    },
    "Quận 7": {
      center: { lat: 10.7333, lon: 106.7167 },
      bounds: [[10.7050, 106.6900], [10.7620, 106.7450]]
    },
    "Quận 10": {
      center: { lat: 10.7717, lon: 106.6667 },
      bounds: [[10.7550, 106.6500], [10.7880, 106.6850]]
    },
    "Quận 11": {
      center: { lat: 10.7617, lon: 106.6433 },
      bounds: [[10.7450, 106.6250], [10.7780, 106.6620]]
    },
    "Quận Bình Thạnh": {
      center: { lat: 10.8108, lon: 106.7092 },
      bounds: [[10.7850, 106.6850], [10.8370, 106.7350]]
    },
    "Quận Gò Vấp": {
      center: { lat: 10.8383, lon: 106.6533 },
      bounds: [[10.8150, 106.6300], [10.8620, 106.6780]]
    },
    "Quận Phú Nhuận": {
      center: { lat: 10.7992, lon: 106.6803 },
      bounds: [[10.7850, 106.6650], [10.8130, 106.6960]]
    },
    "Quận Tân Bình": {
      center: { lat: 10.8017, lon: 106.6533 },
      bounds: [[10.7800, 106.6300], [10.8240, 106.6780]]
    },
    "Thành phố Thủ Đức": {
      center: { lat: 10.8700, lon: 106.7600 },
      bounds: [[10.8200, 106.7100], [10.9200, 106.8100]]
    },
  }
};

// ==============================================================================
// HELPER FUNCTIONS
// ==============================================================================

/**
 * Get city center coordinates
 */
export function getCityCenter(province: string): { lat: number; lon: number; zoom: number } | null {
  const normalizedName = CITY_ALIASES[province] || province;
  return CITY_CENTERS[normalizedName] || null;
}

/**
 * Get district geo data (center + bounds)
 */
export function getDistrictGeo(province: string, district: string): DistrictGeo | null {
  const normalizedProvince = CITY_ALIASES[province] || province;
  const provinceData = DISTRICT_GEO[normalizedProvince];
  if (!provinceData) return null;
  return provinceData[district] || null;
}

/**
 * Calculate bounds from array of points
 */
export function calculateBoundsFromPoints(
  points: Array<{ lat: number; lon: number }>
): [[number, number], [number, number]] | null {
  if (!points || points.length === 0) return null;

  let minLat = Infinity, maxLat = -Infinity;
  let minLon = Infinity, maxLon = -Infinity;

  for (const p of points) {
    if (p.lat && p.lon) {
      minLat = Math.min(minLat, p.lat);
      maxLat = Math.max(maxLat, p.lat);
      minLon = Math.min(minLon, p.lon);
      maxLon = Math.max(maxLon, p.lon);
    }
  }

  if (minLat === Infinity) return null;

  // Add padding (about 10%)
  const latPadding = (maxLat - minLat) * 0.1 || 0.005;
  const lonPadding = (maxLon - minLon) * 0.1 || 0.005;

  return [
    [minLat - latPadding, minLon - lonPadding],
    [maxLat + latPadding, maxLon + lonPadding]
  ];
}

/**
 * Check if coordinates are valid for Vietnam
 */
export function isValidVietnamCoords(lat: number, lon: number): boolean {
  // Vietnam bounds: lat 8.5-23.5, lon 102-110
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    !isNaN(lat) &&
    !isNaN(lon) &&
    lat >= 8.5 &&
    lat <= 23.5 &&
    lon >= 102 &&
    lon <= 110
  );
}

/**
 * Get appropriate zoom level for context
 */
export function getZoomForContext(context: 'country' | 'city' | 'district' | 'ward' | 'listing'): number {
  switch (context) {
    case 'country': return MAP_ZOOM.COUNTRY;
    case 'city': return MAP_ZOOM.CITY;
    case 'district': return MAP_ZOOM.DISTRICT;
    case 'ward': return MAP_ZOOM.WARD;
    case 'listing': return MAP_ZOOM.LISTING;
    default: return MAP_ZOOM.CITY;
  }
}
