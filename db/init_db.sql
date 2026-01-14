-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Main Listings Table
CREATE TABLE IF NOT EXISTS listings (
    id SERIAL PRIMARY KEY,
    title TEXT,
    city TEXT,
    district TEXT,
    ward TEXT,

    price_million NUMERIC, -- Triệu VND/tháng
    area_m2 NUMERIC,
    rent_per_sqm_million NUMERIC, -- Triệu VND/m2

    lat DOUBLE PRECISION,
    lon DOUBLE PRECISION,
    geom GEOMETRY(POINT, 4326),

    type TEXT,
    image_url TEXT,

    raw_data JSONB, -- Backup full JSON
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Indexes for Performance (Superset & Geospatial)
CREATE INDEX IF NOT EXISTS idx_listings_geom ON listings USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings (price_million);
CREATE INDEX IF NOT EXISTS idx_listings_district ON listings (district);
CREATE INDEX IF NOT EXISTS idx_listings_city ON listings (city);

-- 3. Analytics Views for Superset (Pre-calculated)
-- View: District Stats (Median Price, Demand)
CREATE OR REPLACE VIEW view_district_stats AS
SELECT
    city,
    district,
    COUNT(*) as listing_count,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price_million) as median_price,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY rent_per_sqm_million) as median_rent_per_sqm,
    AVG(price_million)::NUMERIC(10,2) as avg_price
FROM listings
GROUP BY city, district;

-- View: Price Segments
CREATE OR REPLACE VIEW view_price_heatmap AS
SELECT
    id,
    lat,
    lon,
    price_million,
    rent_per_sqm_million,
    type
FROM listings;
