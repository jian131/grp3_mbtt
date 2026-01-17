// Next.js API Route - Listing Detail from Verified Data
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Cache for listings data
let listingsCache: any[] | null = null;

function loadListings(): any[] {
  if (listingsCache) return listingsCache;

  try {
    const dataPath = path.join(process.cwd(), 'app/data/listings_vn_postmerge.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    listingsCache = JSON.parse(rawData);
    return listingsCache || [];
  } catch (error) {
    console.error('Failed to load listings:', error);
    return [];
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js 16: params is now a Promise
    const { id } = await params;
    console.log('Requesting listing ID:', id);

    const listings = loadListings();
    console.log('Loaded listings count:', listings.length);

    // Find listing by ID
    const listing = listings.find((l: any) => l.id === id);
    console.log('Found listing:', listing ? 'YES' : 'NO');

    if (!listing) {
      return NextResponse.json({
        success: false,
        error: 'Listing not found',
        data: null,
        debug: { searchId: id, totalListings: listings.length }
      }, { status: 404 });
    }

    // Parse owner if string
    let owner = listing.owner;
    if (typeof owner === 'string') {
      try {
        owner = JSON.parse(owner.replace(/'/g, '"'));
      } catch (e) {
        owner = { name: 'Unknown', phone: '' };
      }
    }

    // Calculate price label
    const price = listing.price || listing.price_million || 0;
    let priceLabel = 'fair';
    if (listing.ai_suggested_price && price) {
      const ratio = price / listing.ai_suggested_price;
      if (ratio < 0.9) priceLabel = 'cheap';
      else if (ratio > 1.1) priceLabel = 'expensive';
    }

    // Parse images if string
    let images = listing.images || [];
    if (typeof images === 'string') {
      try {
        images = JSON.parse(images.replace(/'/g, '"'));
      } catch (e) {
        images = listing.primary_image_url ? [listing.primary_image_url] : [];
      }
    }
    if (!Array.isArray(images)) {
      images = listing.primary_image_url ? [listing.primary_image_url] : [];
    }

    // Parse amenities
    const amenities = {
      schools: listing.amenities_schools || 0,
      offices: listing.amenities_offices || 0,
      competitors: listing.amenities_competitors || 0
    };

    // AI data - transform to expected format
    // Note: Some listings have ai_potential_score = 0, which is valid data
    const aiPotentialScore = listing.ai_potential_score !== undefined && listing.ai_potential_score !== null
      ? listing.ai_potential_score
      : 50;

    const ai = {
      suggestedPrice: listing.ai_suggested_price || price,
      potentialScore: aiPotentialScore,
      riskLevel: (listing.ai_risk_level || 'medium').toLowerCase(),
      priceLabel: priceLabel
    };

    return NextResponse.json({
      success: true,
      data: {
        id: listing.id,
        name: listing.name,
        title: listing.name,
        address: listing.address,
        province: listing.province,
        district: listing.district,
        ward: listing.ward,
        latitude: listing.latitude,
        longitude: listing.longitude,
        lat: listing.latitude,
        lon: listing.longitude,
        type: listing.type,
        market_segment: listing.market_segment,
        area_m2: listing.area || listing.area_m2,
        area: listing.area || listing.area_m2,
        frontage_m: listing.frontage || listing.frontage_m,
        frontage: listing.frontage || listing.frontage_m,
        floors: listing.floors,
        price_million: price,
        price: price,
        rent_per_sqm_million: listing.rent_per_sqm_million,
        views: listing.views || 0,
        saved_count: listing.savedCount || listing.saved_count || 0,
        savedCount: listing.savedCount || listing.saved_count || 0,
        postedAt: listing.posted_at,
        images: images,
        amenities: amenities,
        ai: ai,
        owner: owner,
        found: true,
        geo_status: listing.geo_status,
        geo_method: listing.geo_method,
        admin_match_level: listing.admin_match_level
      }
    });
  } catch (error) {
    console.error('Next.js API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      debug: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
