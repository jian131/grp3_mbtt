# JFinder System Flow

**Generated:** 2026-01-16

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Next.js)                             │
│                              Port 3000                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  Routes:                                                                 │
│  /              → Home page (static)                                     │
│  /search        → Listing search + filter (uses RentalHeatmap)          │
│  /listing/[id]  → Detail page (ImageGallery + RentalHeatmap)            │
│  /analysis      → ROI + Valuation (ValuationCard)                        │
│  /landlord      → Landlord tools                                         │
│  /dashboard     → Stats dashboard (recharts)                             │
│  /bi-dashboard  → Superset iframe embed                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                     ┌──────────────┴──────────────┐
                     ▼                              ▼
┌────────────────────────────────┐   ┌────────────────────────────────────┐
│         lib/api.ts             │   │    /app/api/* (Fallback Routes)    │
│   (API Client Functions)       │   │    Port 3000                       │
│ ───────────────────────────── │   │ ─────────────────────────────────  │
│ fetchListings()  → n8n/search │   │ /api/listing/[id] → reads JSON     │
│ fetchListing()   → FE API      │   │ /api/roi          → calc ROI       │
│ fetchStats()     → n8n/stats   │   │ /api/valuation    → calc valuation │
│ calculateROI()   → n8n/roi     │   │ /api/export       → Superset data  │
│ getValuation()   → n8n/val     │   └────────────────────────────────────┘
└────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           n8n Workflow                                   │
│                     JFinder_API_NoPostgres.json                         │
│                              Port 5678                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  Webhooks:                                                               │
│  /webhook/search    → Read JSON → Filter → Return listings              │
│  /webhook/stats     → Read JSON → Aggregate → Return stats              │
│  /webhook/roi       → Compute ROI from params                           │
│  /webhook/valuation → Compute valuation from params                     │
│                                                                          │
│  Data Source: /data/vn_rental_3cities_verified.json (mounted volume)    │
│  Query Method: File Read + JavaScript filtering (NO SQL)                │
└─────────────────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Data Layer                                      │
├─────────────────────────────────────────────────────────────────────────┤
│  PRIMARY: app/data/vn_rental_3cities_verified.json                      │
│    - 1170 listings                                                       │
│    - 3 cities: Hà Nội, Hồ Chí Minh, Đà Nẵng                            │
│    - 100% geo-verified (lat/lng match province_name)                    │
│                                                                          │
│  SUPERSET: jfinder_data.db (SQLite)                                     │
│    - Same data imported for BI dashboards                               │
│    - Created by scripts/import_to_postgres.py                           │
└─────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                    BI Dashboard (Apache Superset)                        │
│                              Port 8088                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  Data Source: PostgreSQL (jfinder_listings table)                       │
│  Charts: Bar charts, Pie charts, Big Number                             │
│  Access: http://localhost:8088                                           │
│  Embedded at: /bi-dashboard via iframe (CORS configured)                │
└─────────────────────────────────────────────────────────────────────────┘
```

## 2. Request Flow Examples

### 2.1 Search Listings

```
User → /search page
      → Selects city="Hà Nội", minPrice=5000000
      ↓
lib/api.ts::fetchListings({ city: "Hà Nội", minPrice: 5000000 })
      ↓
GET http://localhost:5678/webhook/search?city=Hà Nội&minPrice=5000000
      ↓
n8n Workflow:
  1. Read File Node → load vn_rental_3cities_verified.json
  2. Filter Node → JavaScript: item.province_name === "Hà Nội" && item.price >= 5000000
  3. Sort Node → By price ascending
  4. Respond to Webhook → Return filtered listings
      ↓
FE receives array of listings
      ↓
Renders SearchResultCard[] + RentalHeatmap
```

### 2.2 View Listing Detail

```
User → clicks listing card
      → navigates to /listing/[id]
      ↓
lib/api.ts::fetchListing(id)
      ↓
GET http://localhost:3000/api/listing/123
      ↓
app/api/listing/[id]/route.ts:
  1. Read vn_rental_3cities_verified.json
  2. Find listing by ID
  3. Return single listing
      ↓
Renders ImageGallery + property details + RentalHeatmap
```

### 2.3 Calculate ROI

```
User → /analysis page
      → Enters: price=2000000000, monthlyRent=15000000
      ↓
lib/api.ts::calculateROI({ purchasePrice, monthlyRent, ... })
      ↓
POST http://localhost:5678/webhook/roi
Body: { purchasePrice: 2000000000, monthlyRent: 15000000, ... }
      ↓
n8n Workflow:
  1. Parse JSON body
  2. Calculate: annualRent = monthlyRent * 12
  3. Calculate: grossROI = (annualRent / purchasePrice) * 100
  4. Calculate: netROI with expenses
  5. Return { grossROI, netROI, paybackYears, ... }
      ↓
FE renders ValuationCard with results
```

### 2.4 Property Valuation

```
User → /landlord page
      → Selects district, area, bedrooms
      ↓
lib/api.ts::getValuation({ district, area, bedrooms })
      ↓
POST http://localhost:5678/webhook/valuation
      ↓
n8n Workflow:
  1. Read all listings
  2. Filter comparable properties (same district, similar area)
  3. Calculate median price per m²
  4. Estimate value = medianPricePerM2 * area
  5. Return { estimatedValue, pricePerM2, comparableCount, ... }
      ↓
FE renders valuation results
```

## 3. Data Transformation

### 3.1 Raw Data → Frontend Format

```typescript
// Raw JSON (vn_rental_3cities_verified.json)
{
  "id": 123,
  "title": "Cho thuê căn hộ 2PN tại Vinhomes",
  "price": 15000000,
  "area": 70,
  "latitude": 21.0285,
  "longitude": 105.8542,
  "province_name": "Hà Nội",
  "district_name": "Hai Bà Trưng",
  "ward_name": "Bạch Đằng",
  "images": "https://...|https://..."
}

// Transformed (lib/api.ts::transformListing)
{
  id: "123",
  title: "Cho thuê căn hộ 2PN tại Vinhomes",
  price: 15000000,
  area: 70,
  location: {
    latitude: 21.0285,
    longitude: 105.8542,
    city: "Hà Nội",
    district: "Hai Bà Trưng",
    ward: "Bạch Đằng",
    address: "Hai Bà Trưng, Hà Nội"
  },
  images: ["https://...", "https://..."],
  pricePerM2: 214286
}
```

## 4. Service Dependencies

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Next.js    │────▶│     n8n      │────▶│  JSON File   │
│   (Port 3000)│     │  (Port 5678) │     │ (Volume)     │
└──────────────┘     └──────────────┘     └──────────────┘
       │
       │ (fallback if n8n down)
       ▼
┌──────────────┐
│  /app/api/*  │────▶ Same JSON File
└──────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Superset   │────▶│  PostgreSQL  │     │    Redis     │
│  (Port 8088) │     │  (Port 5433) │     │   (Cache)    │
└──────────────┘     └──────────────┘     └──────────────┘
```

## 5. Startup Order

1. `docker compose up -d postgres redis` - Database + Cache
2. `docker compose up -d n8n` - API Backend
3. `docker compose up -d superset` - BI Dashboard
4. `npm run dev` - Frontend

## 6. Health Checks

| Service    | URL                                  | Expected             |
| ---------- | ------------------------------------ | -------------------- |
| n8n        | http://localhost:5678/healthz        | `{ "status": "ok" }` |
| Superset   | http://localhost:8088/health         | `OK`                 |
| Frontend   | http://localhost:3000                | HTML page            |
| Search API | http://localhost:5678/webhook/search | JSON array           |
