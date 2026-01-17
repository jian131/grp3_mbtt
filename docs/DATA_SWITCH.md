# DATA_SWITCH.md - Dataset Migration Guide

## 📅 Last Updated: 2026-01-17

## 🎯 Overview

Dataset migration from original verified data to Nominatim-geocoded data with corrected lat/lon coordinates.

## 📂 Dataset Path

**Current Active Dataset:**

```
app/data/vn_rental_3cities_verified.json
```

**Total Records:** 1170
**Cities:** Hà Nội (479), Hồ Chí Minh (521), Đà Nẵng (170)

## 🔄 Data Sources

### Source File:

```
vn_rental_listings_3cities_nominatim_fixed_admin.csv
```

### Processing:

- Source: CSV with Nominatim geocoded coordinates + fixed admin boundaries
- Province normalized: Removed "Thành phố" prefix
- Numeric fields converted: latitude, longitude, price, area, etc.
- Coordinates: Accurate lat/lon from Nominatim geocoding

## 📊 Schema (Normalized)

```typescript
interface Listing {
  // Identifiers
  id: string; // "VN26000001"
  name: string; // "Mặt bằng 1 - streetfront"

  // Location (FIXED)
  province: string; // "Hồ Chí Minh" | "Hà Nội" | "Đà Nẵng"
  district: string; // "Quận 1", "Hoàn Kiếm", etc.
  ward: string; // "Tân Định", etc.
  address: string; // Full address
  latitude: number; // 10.7898998 (from Nominatim)
  longitude: number; // 106.6900513 (from Nominatim)

  // Property Details
  type: "streetfront" | "shophouse" | "kiosk" | "office";
  market_segment: "street_retail" | "shopping_mall" | "office";
  area: number; // m² (e.g., 75.2)
  frontage: number; // meters (e.g., 4.0)
  floors: number; // 1, 2, 20...

  // Pricing
  price: number; // Million VND/month (e.g., 156.7)
  rent_per_sqm_million: number; // Price per m² (e.g., 2.084)
  currency: "VND";
  price_unit: "million_vnd_per_month";

  // AI Fields
  ai_suggested_price: number;
  ai_potential_score: number;
  ai_risk_level: "Low" | "Medium" | "High";

  // Amenities
  amenities_schools: number;
  amenities_offices: number;
  amenities_competitors: number;

  // Engagement
  views: number;
  savedCount: number;
  posted_at: string; // ISO datetime

  // Owner (JSON string or object)
  owner: string | { name: string; phone: string };

  // Images
  primary_image_url: string;
  image_source: string;
  image_author: string;
  image_license_names: string;
  image_required_credit: string;

  // Geo Verification (NEW)
  geo_verified?: boolean; // true if lat/lon from Nominatim
  geo_source?: string; // "nominatim"
}
```

## 🔌 Endpoints Using Dataset

### Next.js API Routes (Direct JSON Import)

| Endpoint             | Method   | Import Path                                  |
| -------------------- | -------- | -------------------------------------------- |
| `/api/ai/decision`   | POST     | `@/app/data/vn_rental_3cities_verified.json` |
| `/api/ai/valuation`  | POST     | `@/app/data/vn_rental_3cities_verified.json` |
| `/api/ai/contract`   | POST     | (no data import, text analysis only)         |
| `/api/dify/listings` | GET/POST | `@/app/data/vn_rental_3cities_verified.json` |
| `/api/dify/stats`    | POST     | `@/app/data/vn_rental_3cities_verified.json` |

### n8n Workflow Endpoints

| Endpoint       | Path in n8n                |
| -------------- | -------------------------- |
| Search         | GET `/webhook/search`      |
| Listing Detail | GET `/webhook/listing/:id` |
| Stats          | GET `/webhook/stats`       |
| Districts      | GET `/webhook/districts`   |
| ROI Calculator | POST `/webhook/roi`        |
| Valuation      | POST `/webhook/valuation`  |

**n8n Data Source:**

```
/data/files/listings_vn_postmerge.json  (Docker volume mount)
```

### Superset

**Data Source:** SQLite database in `superset_data/`

- Requires separate data import via Superset UI
- See `docs/bi_superset.md` for import instructions

## ✅ Test Checklist (10 Cases)

### Map & Search Tests

| #   | Test Case                       | Expected Result                        | Status |
| --- | ------------------------------- | -------------------------------------- | ------ |
| 1   | Search "Hà Nội"                 | 480 results, markers in HN bounds      | ☐      |
| 2   | Search "Quận 1" + "Hồ Chí Minh" | Markers in Q1 area, not random         | ☐      |
| 3   | Click listing                   | Map flyTo correct lat/lon, popup shows | ☐      |
| 4   | Heatmap toggle                  | Heat clusters match listing density    | ☐      |
| 5   | Filter by type=office           | Only office listings shown             | ☐      |

### AI Feature Tests

| #   | Test Case                           | Expected Result                   | Status |
| --- | ----------------------------------- | --------------------------------- | ------ |
| 6   | Decision API (VN26000001)           | Returns AI analysis with verdict  | ☐      |
| 7   | Valuation API (Quận 1, streetfront) | Returns price range + comps       | ☐      |
| 8   | Contract Review                     | Paste sample text → risk analysis | ☐      |

### BI & Integration Tests

| #   | Test Case          | Expected Result                       | Status |
| --- | ------------------ | ------------------------------------- | ------ |
| 9   | Open /bi-dashboard | Superset link/iframe loads            | ☐      |
| 10  | ROI Calculator     | Input values → break-even calculation | ☐      |

## 🗑️ Archived Files

### app/data/archive/

- `vn_rental_3cities_verified_OLD_BUGGED.json` - Had incorrect lat/lon
- `vn_rental_3cities_verified_backup.json` - Pre-merge backup

### n8n/archive/

- `contract_gemini_v3.json` - Old Gemini workflow (replaced by API route)
- `contract_review.json` - Old workflow
- `contract_review_ai.json` - Old workflow
- `contract_review_ai_v2.json` - Old workflow
- `decision_gemini_v3.json` - Old Gemini workflow
- `decision_support_ai.json` - Old workflow
- `decision_support_ai_v2.json` - Old workflow
- `valuation_ai_enhanced.json` - Old workflow
- `valuation_ai_enhanced_v2.json` - Old workflow
- `valuation_gemini_v3.json` - Old Gemini workflow

## 🚀 Deployment Steps

### 1. Update Next.js (Vercel)

```bash
cd grp3_mbtt
git add .
git commit -m "chore: switch to nominatim-geocoded dataset"
git push origin main

# Or force deploy
npx vercel --prod
```

### 2. Update n8n (Docker)

```bash
# Copy updated JSON to Docker volume
docker cp app/data/listings_vn_postmerge.json n8n_container:/data/files/

# Restart n8n to reload data
docker-compose restart n8n
```

### 3. Update Superset (Docker)

1. Open Superset UI: http://localhost:8088
2. Go to Data → Databases
3. Upload new CSV or update SQLite database
4. Refresh datasets

## 🔧 Environment Variables

| Variable                   | Required | Value                                       |
| -------------------------- | -------- | ------------------------------------------- |
| `GROQ_API_KEY`             | ✅       | Groq API key for AI features                |
| `NEXT_PUBLIC_API_BASE_URL` | ✅       | n8n webhook base URL                        |
| `NEXT_PUBLIC_SUPERSET_URL` | ⚠️       | Superset URL (local: http://localhost:8088) |
| `NEXT_PUBLIC_DIFY_API_KEY` | ⚠️       | Dify chatbot API key                        |

## 📌 Notes

1. **Province Names:** Dataset uses clean names ("Hồ Chí Minh", "Hà Nội", "Đà Nẵng") - NOT Nominatim's new administrative divisions ("Thành phố Thủ Đức")

2. **Lat/Lon Precision:** Coordinates from Nominatim are ~5-7 decimal places accurate

3. **Price Format:** All prices in `million VND/month` (e.g., 156.7 = 156,700,000 VND)

4. **Area Format:** All areas in `m²` (square meters)

5. **Backward Compatibility:** API responses include aliases (`lat`/`latitude`, `lon`/`longitude`, `area`/`area_m2`, `price`/`price_million`)
