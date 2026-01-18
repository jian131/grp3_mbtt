/**
 * Chat Context Builder - RAG for internal JSON only
 * Extracts filters from user question and builds context from listings
 */

import { searchListings, getTopListings, statsBy, SearchFilters, Listing } from './listingsStore';

interface ExtractedFilters extends SearchFilters {
  intent?: 'search' | 'stats' | 'top' | 'compare';
  sortBy?: 'price' | 'area' | 'potentialScore';
  compareDistricts?: string[];
}

/**
 * Extract filters from natural language query (Vietnamese)
 */
function extractFilters(question: string): ExtractedFilters {
  const q = question.toLowerCase();
  const filters: ExtractedFilters = {};

  // Province detection
  if (q.includes('hà nội') || q.includes('ha noi')) {
    filters.province = 'Hà Nội';
  } else if (q.includes('hồ chí minh') || q.includes('hcm') || q.includes('sài gòn') || q.includes('saigon')) {
    filters.province = 'Hồ Chí Minh';
  } else if (q.includes('đà nẵng') || q.includes('da nang')) {
    filters.province = 'Đà Nẵng';
  }

  // District detection (common patterns)
  const districtPatterns = [
    /quận\s+(\d+|[a-zàáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ\s]+)/i,
    /huyện\s+([a-zàáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ\s]+)/i,
    /(ba đình|ba dinh|hoàn kiếm|hoan kiem|đống đa|dong da|hai bà trưng|tây hồ|cầu giấy|cau giay|thanh xuân|hoàng mai)/i
  ];

  for (const pattern of districtPatterns) {
    const match = q.match(pattern);
    if (match) {
      filters.district = match[1] || match[0];
      break;
    }
  }

  // Ward/Phuong detection
  const wardMatch = q.match(/phường\s+([a-zàáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ\s\d]+)/i);
  if (wardMatch) {
    filters.ward = wardMatch[1];
  }

  // Type detection
  if (q.includes('office') || q.includes('văn phòng')) {
    filters.type = 'office';
  } else if (q.includes('streetfront') || q.includes('mặt tiền') || q.includes('mat tien')) {
    filters.type = 'streetfront';
  } else if (q.includes('shophouse') || q.includes('nhà phố')) {
    filters.type = 'shophouse';
  } else if (q.includes('kiosk') || q.includes('ki ốt')) {
    filters.type = 'kiosk';
  }

  // Price range (triệu VNĐ)
  const pricePatterns = [
    /(?:giá|gia)\s*(?:dưới|duoi|<)\s*(\d+)\s*(?:tr|triệu|trieu)/i,
    /(?:giá|gia)\s*(?:từ|tu)\s*(\d+)\s*(?:-|đến|den)\s*(\d+)\s*(?:tr|triệu|trieu)/i,
    /<\s*(\d+)\s*(?:tr|triệu|trieu)/i,
    /(\d+)\s*-\s*(\d+)\s*(?:tr|triệu|trieu)/i
  ];

  for (const pattern of pricePatterns) {
    const match = q.match(pattern);
    if (match) {
      if (match[2]) {
        filters.minPrice = parseInt(match[1]);
        filters.maxPrice = parseInt(match[2]);
      } else {
        filters.maxPrice = parseInt(match[1]);
      }
      break;
    }
  }

  // Area range (m2)
  const areaPatterns = [
    /(?:diện tích|dien tich)\s*(?:>|trên|tren)\s*(\d+)\s*m2?/i,
    /(?:diện tích|dien tich)\s*(?:từ|tu)\s*(\d+)\s*(?:-|đến|den)\s*(\d+)\s*m2?/i,
    />\s*(\d+)\s*m2?/i,
    /(\d+)\s*-\s*(\d+)\s*m2?/i
  ];

  for (const pattern of areaPatterns) {
    const match = q.match(pattern);
    if (match) {
      if (match[2]) {
        filters.minArea = parseInt(match[1]);
        filters.maxArea = parseInt(match[2]);
      } else {
        filters.minArea = parseInt(match[1]);
      }
      break;
    }
  }

  // Intent detection
  if (q.includes('top') || q.includes('tốt nhất') || q.includes('tiềm năng cao')) {
    filters.intent = 'top';
    filters.sortBy = 'potentialScore';
  } else if (q.includes('so sánh') || q.includes('compare')) {
    filters.intent = 'compare';
  } else if (q.includes('thống kê') || q.includes('trung bình') || q.includes('avg') || q.includes('giá/m2')) {
    filters.intent = 'stats';
  } else {
    filters.intent = 'search';
  }

  return filters;
}

/**
 * Build context string for Dify from listings
 */
export function buildChatContext(question: string): {
  context: string;
  listings: Listing[];
  filters: ExtractedFilters;
} {
  const filters = extractFilters(question);
  let listings: Listing[] = [];

  // Execute query based on intent
  switch (filters.intent) {
    case 'top':
      listings = getTopListings('potentialScore', 'desc', 10, filters);
      break;

    case 'stats':
      // For stats, still need sample listings
      listings = searchListings(filters, 30);
      break;

    case 'search':
    default:
      listings = searchListings(filters, 30);

      // Fallback if no results
      if (listings.length === 0 && filters.province) {
        listings = getTopListings('potentialScore', 'desc', 10, { province: filters.province });
      } else if (listings.length === 0) {
        listings = getTopListings('potentialScore', 'desc', 10);
      }
  }

  // Build compact context
  const contextLines = [
    '=== DỮ LIỆU NỘI BỘ TỪ JSON ===',
    `Tìm được ${listings.length} mặt bằng phù hợp:`,
    ''
  ];

  listings.forEach((listing, idx) => {
    const mini = {
      id: listing.id,
      name: listing.name,
      province: listing.province,
      district: listing.district,
      ward: listing.ward || 'N/A',
      address: listing.address,
      type: listing.type,
      area: listing.area,
      price: listing.price,
      potentialScore: listing.ai?.potentialScore || 0,
      lat: listing.latitude,
      lon: listing.longitude
    };
    contextLines.push(`${idx + 1}. ${JSON.stringify(mini)}`);
  });

  // Add stats if needed
  if (filters.intent === 'stats' && listings.length > 0) {
    const priceStats = statsBy('price', filters);
    const areaStats = statsBy('area', filters);
    contextLines.push('');
    contextLines.push('THỐNG KÊ:');
    contextLines.push(`- Giá: min=${priceStats.min}tr, max=${priceStats.max}tr, avg=${priceStats.avg.toFixed(1)}tr`);
    contextLines.push(`- Diện tích: min=${areaStats.min}m2, max=${areaStats.max}m2, avg=${areaStats.avg.toFixed(1)}m2`);
  }

  contextLines.push('');
  contextLines.push('CHỈ trả lời dựa trên dữ liệu trên. Nếu không có trong danh sách => nói "không có trong dữ liệu".');

  return {
    context: contextLines.join('\n'),
    listings,
    filters
  };
}
