# 🔍 JFinder System Audit Report v2.0

**Date**: 2026-01-15
**Auditor**: Senior Architect + Lead Engineer
**Objective**: Pivot dự án theo hướng mới - chỉ n8n + Superset, loại bỏ all AI/Vision/Vector/manual SQL

---

## 📋 Executive Summary

| Hạng mục | Trạng thái | Ghi chú |
|----------|-----------|---------|
| ✅ Docker Stack | **OK** | n8n + Superset + Postgres + Redis |
| ✅ No AI/Vision/Vector | **OK** | Không phát hiện code liên quan |
| ✅ No Node/Express API | **OK** | Frontend chỉ gọi n8n webhook |
| ⚠️ Schema via n8n | **PARTIAL** | Đã có workflow nhưng cần refine |
| ⚠️ Dataset mismatch | **TODO** | Cần update sang dataset 3 cities mới |
| ⚠️ Missing features | **TODO** | Radius search, price label, pagination |

---

## 1️⃣ Current Architecture Analysis

### Services (Docker Compose)
```yaml
services:
  postgres:   # PostGIS 15-3.3, port 5433     ✅ KEEP
  n8n:        # Backend API/ETL, port 5678    ✅ KEEP
  superset:   # BI Dashboard, port 8088       ✅ KEEP
  redis:      # Superset cache                ✅ KEEP
```

### Frontend (Next.js)
- Port 3000, consumes n8n webhooks
- Pages: `/`, `/search`, `/map`, `/analysis`, `/landlord`, `/dashboard`, `/bi-dashboard`

### ✅ KHÔNG CÓ các thành phần cần loại bỏ:
- ❌ Vision AI / Visual Search
- ❌ Vector DB (Milvus/Qdrant/Pinecone)
- ❌ OCR / Legal AI / LLM integration
- ❌ Node/Express/NestJS/FastAPI riêng
- ❌ Mobile app / camera features
- ❌ File `.sql` thủ công trong repo (đã xóa trước đó)

---

## 2️⃣ Dataset Analysis

### Dataset hiện tại trong repo: `app/data/listings.json`
- **Format**: JSON array
- **Records**: ~2500 (old dataset)
- **Fields**: `listing_id, category, title, address, province, district, ward, lat, lon, area_m2, frontage_m, rent_vnd_month, rent_vnd_m2, image_url`
- **Problem**: Thiếu nhiều trường quan trọng

### Dataset mới (cần import): `vn_rental_listings_3cities_realimg_pricefixed.csv`
- **Location**: `Downloads/vn_rental_3cities_gadm_pip_2500_package/`
- **Format**: CSV + JSON
- **Records**: 1170 listings (3 cities: Hà Nội, Đà Nẵng, TP.HCM)
- **Full fields**:
  ```
  id, name, address, province, district, ward, admin_codes,
  latitude, longitude, type, market_segment,
  area, frontage, floors, rent_per_sqm_million, price, currency, price_unit,
  images, amenities_schools, amenities_offices, amenities_competitors,
  ai_suggested_price, ai_potential_score, ai_risk_level,
  views, savedCount, posted_at, owner, primary_image_url,
  image_source, image_author, image_license_names, image_license_urls
  ```

### Field Mapping (old → new)
| Old Field | New Field | Notes |
|-----------|-----------|-------|
| listing_id | id | ID format khác |
| category | type | Values: streetfront/shophouse/kiosk/office |
| rent_vnd_month | price | Now in million VND |
| rent_vnd_m2 | rent_per_sqm_million | Already in millions |
| lat | latitude | Same |
| lon | longitude | Same |
| - | floors | NEW |
| - | market_segment | NEW |
| - | views, savedCount | NEW - engagement |
| - | ai_suggested_price | Can be used for valuation |
| image_url | primary_image_url | Real images from Wikimedia |

---

## 3️⃣ n8n Workflows Audit

### Existing Workflows (in `/n8n/`)
| File | Purpose | Status | Action |
|------|---------|--------|--------|
| `0-init-schema.json` | Create tables | ⚠️ | Update schema for new fields |
| `1-import-data.json` | Import JSON | ⚠️ | Need CSV reader + new fields |
| `search_api_workflow.json` | GET /search | ⚠️ | Add radius search, pagination |
| `listing_api_workflow.json` | GET /listing/:id | ✅ | OK |
| `stats_api_workflow.json` | GET /stats | ⚠️ | Add ward-level stats |

### Missing Workflows (per requirements)
| Workflow | Endpoint | Description |
|----------|----------|-------------|
| **roi_api_workflow.json** | POST /roi | ROI/break-even calculator |
| **valuation_api_workflow.json** | POST /valuation | Price percentile scoring |
| **compute_stats_workflow.json** | Manual | Pre-compute area stats |

---

## 4️⃣ Schema Requirements (New)

```sql
-- Created via n8n workflow, NOT manual SQL file
CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,                    -- VN26000001 format
  name TEXT,
  address TEXT,
  province TEXT,                          -- city/province
  district TEXT,
  ward TEXT,
  admin_codes JSONB,                      -- {level1_id, level2_id, level3_id}
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  geom GEOMETRY(POINT, 4326),             -- PostGIS point
  type TEXT,                              -- streetfront/shophouse/kiosk/office
  market_segment TEXT,                    -- street_retail/shopping_mall/office
  area_m2 NUMERIC,
  frontage_m NUMERIC,
  floors INTEGER,
  price_million NUMERIC,                  -- monthly rent in million VND
  rent_per_sqm_million NUMERIC,
  views INTEGER DEFAULT 0,
  saved_count INTEGER DEFAULT 0,
  owner JSONB,                            -- {name, phone}
  primary_image_url TEXT,
  ai_suggested_price NUMERIC,             -- pre-calculated
  ai_potential_score NUMERIC,
  ai_risk_level TEXT,
  posted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  raw_data JSONB                          -- Full original record
);

-- Indexes
CREATE INDEX idx_listings_geom ON listings USING GIST (geom);
CREATE INDEX idx_listings_province ON listings (province);
CREATE INDEX idx_listings_district ON listings (district);
CREATE INDEX idx_listings_ward ON listings (ward);
CREATE INDEX idx_listings_type ON listings (type);
CREATE INDEX idx_listings_price ON listings (price_million);

-- Stats View (pre-aggregated)
CREATE OR REPLACE VIEW view_ward_stats AS
SELECT
  province, district, ward, type,
  COUNT(*) as listing_count,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price_million) as median_price,
  PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY price_million) as p25_price,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY price_million) as p75_price,
  AVG(views) as avg_views,
  SUM(saved_count) as total_saved
FROM listings
GROUP BY province, district, ward, type;

CREATE OR REPLACE VIEW view_district_stats AS
SELECT
  province, district,
  COUNT(*) as listing_count,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price_million) as median_price,
  PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY price_million) as p25_price,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY price_million) as p75_price,
  MIN(price_million) as min_price,
  MAX(price_million) as max_price,
  AVG(views) as avg_views,
  SUM(saved_count) as total_saved
FROM listings
GROUP BY province, district;
```

---

## 5️⃣ API Specification (Required)

### GET /webhook/search
**Query params**:
```
city, district, ward, type, segment,
min_price, max_price, min_area, max_area,
lat, lon, radius_m,
limit, offset
```

**Response**:
```json
{
  "success": true,
  "data": [...],
  "count": 50,
  "total": 1170,
  "page": 1
}
```

**Features**:
- Radius search via Haversine formula in Code node (no PostGIS SQL needed)
- Price label: `cheap/fair/expensive` based on percentile vs ward stats

### GET /webhook/listing/:id
Returns single listing with full details.

### GET /webhook/stats
**Query params**: `level=ward|district`, `city`

**Response**: Aggregated stats per area

### POST /webhook/roi
**Body**:
```json
{
  "monthly_rent": 50,
  "product_price": 50000,
  "profit_margin": 0.3,
  "target_daily_customers": 100
}
```

**Response**:
```json
{
  "break_even_days": 33,
  "monthly_profit": 45000000,
  "roi_percent": 90
}
```

### POST /webhook/valuation
**Body**: district, ward, type, area_m2, frontage_m, floors

**Response**: suggested_price_range based on percentile

---

## 6️⃣ Files to Clean Up

### DELETE (if exist)
- `app/data/mockListings.json` (941KB) - Old mock data
- `app/data/mockData.ts` - Hardcoded data
- `app/data/mockListings.ts` - Hardcoded data
- `data/superset_listings.csv` - Stale
- `data/jfinder_listings.csv` - Stale

### UPDATE
- `app/data/listings.json` → Replace with new dataset converted to JSON
- `n8n/*.json` → All workflows need update
- `lib/api.ts` → Add new endpoints/types
- `docker-compose.yml` → Already good

### CREATE
- `n8n/2-compute-stats.json` - Pre-compute stats workflow
- `n8n/roi_api_workflow.json` - ROI calculator
- `n8n/valuation_api_workflow.json` - Price valuation

---

## 7️⃣ Assumptions Made

1. **Dataset location**: User will copy CSV to `app/data/` for n8n to read
2. **PostGIS not strictly required**: Radius search can be done via Haversine in n8n Code node
3. **No auth on webhooks**: Local dev only (production would add tokens)
4. **Superset config not exported**: User creates dashboards manually
5. **Price in millions**: Dataset uses `price` (million VND/month)

---

## 8️⃣ Refactor Plan (Commit-by-Commit)

### Phase 1: Data Preparation
1. Copy new dataset CSV → `app/data/vn_rental_3cities.csv`
2. Create JSON version for n8n compatibility
3. Delete old mock data files

### Phase 2: Schema Update
4. Update `n8n/0-init-schema.json` with new fields
5. Update `n8n/1-import-data.json` for CSV/JSON format

### Phase 3: API Workflows
6. Update `n8n/search_api_workflow.json`:
   - Add all filter params
   - Add radius search (Haversine in Code node)
   - Add pagination
   - Add price label computation
7. Update `n8n/stats_api_workflow.json`:
   - Support ward/district level
   - Add type breakdown
8. Create `n8n/roi_api_workflow.json`
9. Create `n8n/valuation_api_workflow.json`

### Phase 4: Frontend
10. Update `lib/api.ts` types and functions
11. Verify all pages work with new schema

### Phase 5: Documentation
12. Update `README.md`
13. Update `docs/ARCHITECTURE.md`
14. Update `docs/TESTING.md`
15. Create Runbook in README

---

## ✅ Compliance Checklist

| Requirement | Status | Notes |
|------------|--------|-------|
| Only n8n + Superset | ✅ | No other backend |
| No Vision/Vector/OCR/LLM | ✅ | Not present |
| No manual SQL in repo | ✅ | Schema via n8n workflow |
| 3 cities dataset | 🔄 | Import pending |
| Radius search | 🔄 | Haversine in n8n |
| Price labels | 🔄 | Percentile logic in n8n |
| ROI calculator | 🔄 | Workflow needed |
| Valuation API | 🔄 | Workflow needed |
| Superset dashboard | 🔄 | User creates manually |

---

**Next Actions**: Proceed with refactor plan Phase 1-5
