# FE API Contract - JFinder

This document describes all API endpoints that the FE (Next.js) expects from the n8n backend.

## Base URL

```
http://localhost:5678/webhook
```

Configured in `lib/api.ts`:

```typescript
const N8N_BASE =
  process.env.NEXT_PUBLIC_N8N_URL || "http://localhost:5678/webhook";
```

---

## 1. Search Listings

### Endpoint

```
GET /webhook/search
```

### Query Parameters

| Parameter                 | Type   | Required | Description                                                  |
| ------------------------- | ------ | -------- | ------------------------------------------------------------ |
| `city` or `province`      | string | No       | Filter by city/province name                                 |
| `district`                | string | No       | Filter by district name                                      |
| `ward`                    | string | No       | Filter by ward name                                          |
| `type`                    | string | No       | Property type: `streetfront`, `shophouse`, `kiosk`, `office` |
| `segment`                 | string | No       | Market segment: `street_retail`, `shopping_mall`, `office`   |
| `min_price` or `minPrice` | number | No       | Minimum price (million VND/month)                            |
| `max_price` or `maxPrice` | number | No       | Maximum price (million VND/month)                            |
| `min_area` or `minArea`   | number | No       | Minimum area (m²)                                            |
| `max_area` or `maxArea`   | number | No       | Maximum area (m²)                                            |
| `lat`                     | number | No       | Center latitude for radius search                            |
| `lon`                     | number | No       | Center longitude for radius search                           |
| `radius_m`                | number | No       | Radius in meters                                             |
| `limit`                   | number | No       | Max results (default: 50)                                    |
| `offset`                  | number | No       | Pagination offset (default: 0)                               |

### Expected Response

```json
{
  "success": true,
  "data": [
    {
      "id": "VN26000001",
      "name": "Mặt bằng 1 - streetfront",
      "title": "Mặt bằng 1 - streetfront",
      "address": "221 Phố B8, Phường Tân Định, Quận 1, TP.HCM",
      "province": "Thành phố Hồ Chí Minh",
      "district": "Quận 1",
      "ward": "Phường Tân Định",
      "latitude": 10.836687,
      "longitude": 106.773752,
      "lat": 10.836687,
      "lon": 106.773752,
      "type": "streetfront",
      "market_segment": "street_retail",
      "area_m2": 75.2,
      "area": 75.2,
      "frontage_m": 4.0,
      "frontage": 4.0,
      "floors": 1,
      "price_million": 156.7,
      "price": 156.7,
      "rent_per_sqm_million": 2.084,
      "views": 150,
      "saved_count": 4,
      "savedCount": 4,
      "primary_image_url": "https://...",
      "ai_suggested_price": 154.2,
      "ai_potential_score": 16.1,
      "ai_risk_level": "High",
      "price_label": "fair",
      "posted_at": "2025-11-14T16:46:00",
      "created_at": "2025-11-14T16:46:00",
      "owner": {
        "name": "Trần Văn Thắng",
        "phone": "0502419543"
      },
      "geo_status": "matched",
      "geo_method": "unchanged",
      "admin_match_level": "ward"
    }
  ],
  "count": 50,
  "total": 2500,
  "limit": 50,
  "offset": 0
}
```

### FE Usage

```typescript
// lib/api.ts - fetchListings()
const url = `${N8N_BASE}/search${
  query.toString() ? "?" + query.toString() : ""
}`;
const res = await fetch(url);
const json = await res.json();
// Expects json.data to be array of listings
```

---

## 2. Listing Detail

### Endpoint

```
GET /webhook/listing/:id
```

### Path Parameters

| Parameter | Type   | Required | Description                     |
| --------- | ------ | -------- | ------------------------------- |
| `id`      | string | Yes      | Listing ID (e.g., "VN26000001") |

### Expected Response

```json
{
  "success": true,
  "found": true,
  "data": {
    "id": "VN26000001",
    "name": "Mặt bằng 1 - streetfront",
    "title": "Mặt bằng 1 - streetfront",
    "address": "...",
    "province": "Thành phố Hồ Chí Minh",
    "district": "Quận 1",
    "ward": "Phường Tân Định",
    "latitude": 10.836687,
    "longitude": 106.773752,
    "lat": 10.836687,
    "lon": 106.773752,
    "type": "streetfront",
    "market_segment": "street_retail",
    "area_m2": 75.2,
    "area": 75.2,
    "frontage_m": 4.0,
    "frontage": 4.0,
    "floors": 1,
    "price_million": 156.7,
    "price": 156.7,
    "rent_per_sqm_million": 2.084,
    "views": 150,
    "saved_count": 4,
    "savedCount": 4,
    "primary_image_url": "https://...",
    "ai_suggested_price": 154.2,
    "ai_potential_score": 16.1,
    "ai_risk_level": "High",
    "price_label": "fair",
    "posted_at": "2025-11-14T16:46:00",
    "created_at": "2025-11-14T16:46:00",
    "owner": {
      "name": "Trần Văn Thắng",
      "phone": "0502419543"
    },
    "area_stats": {
      "listing_count": 45,
      "median_price": 85.5,
      "p25_price": 45.0,
      "p75_price": 120.0
    }
  }
}
```

### FE Usage

```typescript
// lib/api.ts - fetchListing()
const url = `${N8N_BASE}/listing/${id}`;
const res = await fetch(url);
const json = await res.json();
// Expects json.success && json.data
```

---

## 3. Statistics

### Endpoint

```
GET /webhook/stats
```

### Query Parameters

| Parameter            | Type   | Required | Description                    |
| -------------------- | ------ | -------- | ------------------------------ |
| `level`              | string | No       | `district` (default) or `ward` |
| `city` or `province` | string | No       | Filter by city                 |

### Expected Response

```json
{
  "success": true,
  "level": "district",
  "data": [
    {
      "province": "Thành phố Hồ Chí Minh",
      "district": "Quận 1",
      "ward": null,
      "type": null,
      "listing_count": 120,
      "median_price": 85.5,
      "p25_price": 45.0,
      "p75_price": 150.0,
      "min_price": 15.0,
      "max_price": 500.0,
      "avg_views": 245,
      "total_saved": 1250
    }
  ],
  "count": 50
}
```

---

## 4. ROI Calculator

### Endpoint

```
POST /webhook/roi
```

### Request Body

```json
{
  "monthly_rent": 50,
  "product_price": 50000,
  "profit_margin": 0.3,
  "target_daily_customers": 100,
  "operating_cost": 10
}
```

| Field                                        | Type   | Required | Description                  |
| -------------------------------------------- | ------ | -------- | ---------------------------- |
| `monthly_rent` or `monthlyRent`              | number | Yes      | Monthly rent (million VND)   |
| `product_price` or `productPrice`            | number | Yes      | Product price (VND)          |
| `profit_margin` or `profitMargin`            | number | Yes      | Profit margin (0-1)          |
| `target_daily_customers` or `dailyCustomers` | number | Yes      | Target daily customers       |
| `operating_cost` or `operatingCost`          | number | No       | Operating cost (million VND) |

### Expected Response

```json
{
  "success": true,
  "inputs": {
    "monthly_rent_million": 50,
    "product_price_vnd": 50000,
    "profit_margin": 0.3,
    "daily_customers": 100,
    "operating_cost_million": 10
  },
  "results": {
    "daily_profit_vnd": 1500000,
    "monthly_revenue_vnd": 45000000,
    "total_monthly_cost_vnd": 60000000,
    "monthly_net_profit_vnd": -15000000,
    "yearly_revenue_vnd": 540000000,
    "yearly_net_profit_vnd": -180000000,
    "break_even_days": 40,
    "roi_percent": -25.0,
    "yearly_roi_percent": -25.0,
    "viability": "risky"
  },
  "assumptions": {
    "days_per_month": 30,
    "rent_unit": "million VND/month",
    "operating_cost_unit": "million VND/month",
    "product_price_unit": "VND"
  }
}
```

### FE Usage

```typescript
// lib/api.ts - calculateROI()
const res = await fetch(`${N8N_BASE}/roi`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(input),
});
const json = await res.json();
// Expects json.success, json.inputs, json.results
```

---

## 5. Valuation

### Endpoint

```
POST /webhook/valuation
```

### Request Body

```json
{
  "district": "Quận 1",
  "ward": "Phường Tân Định",
  "type": "streetfront",
  "area_m2": 50,
  "frontage_m": 5,
  "floors": 1,
  "province": "Thành phố Hồ Chí Minh"
}
```

| Field                      | Type   | Required | Description               |
| -------------------------- | ------ | -------- | ------------------------- |
| `district`                 | string | Yes      | District name             |
| `ward`                     | string | No       | Ward name (more specific) |
| `type`                     | string | Yes      | Property type             |
| `area_m2` or `area`        | number | Yes      | Area in m²                |
| `frontage_m` or `frontage` | number | No       | Frontage in meters        |
| `floors`                   | number | No       | Number of floors          |
| `province` or `city`       | string | No       | Province/city name        |

### Expected Response

```json
{
  "success": true,
  "input": {
    "district": "Quận 1",
    "ward": "Phường Tân Định",
    "type": "streetfront",
    "area_m2": 50,
    "frontage_m": 5,
    "floors": 1,
    "province": "Thành phố Hồ Chí Minh"
  },
  "market_stats": {
    "p25_per_sqm": 0.8,
    "median_per_sqm": 1.5,
    "p75_per_sqm": 2.5,
    "sample_size": 45,
    "comparable_listings": [
      {
        "id": "VN26000010",
        "name": "Mặt bằng Quận 1",
        "price": 75.0,
        "area": 50,
        "rent_per_sqm": 1.5
      }
    ]
  },
  "valuation": {
    "suggested_price_million": 78.8,
    "price_range": {
      "min": 38.0,
      "max": 131.3
    },
    "priceRange": {
      "min": 38.0,
      "max": 131.3
    },
    "price_per_sqm": 1.575,
    "adjustment_applied": "+5%",
    "adjustment_reasons": ["Good frontage (+5%)"],
    "confidence": "high",
    "riskLevel": "low",
    "potentialScore": 75
  }
}
```

### FE Usage

```typescript
// lib/api.ts - getValuation()
const res = await fetch(`${N8N_BASE}/valuation`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(input),
});
const json = await res.json();
// Expects json.success, json.input, json.market_stats, json.valuation
```

---

## 6. Districts List

### Endpoint

```
GET /webhook/districts
```

### Query Parameters

| Parameter            | Type   | Required | Description    |
| -------------------- | ------ | -------- | -------------- |
| `city` or `province` | string | No       | Filter by city |

### Expected Response

```json
{
  "success": true,
  "data": [
    {
      "province": "Thành phố Hà Nội",
      "districts": ["Quận Ba Đình", "Quận Hoàn Kiếm", "Quận Đống Đa", "..."]
    },
    {
      "province": "Thành phố Đà Nẵng",
      "districts": ["Quận Hải Châu", "Quận Thanh Khê", "..."]
    },
    {
      "province": "Thành phố Hồ Chí Minh",
      "districts": ["Quận 1", "Quận 3", "Quận Bình Thạnh", "..."]
    }
  ],
  "count": 50
}
```

---

## Field Mapping: FE vs Backend

| FE Field            | Backend Field        | Notes                  |
| ------------------- | -------------------- | ---------------------- |
| `lat`               | `latitude`           | Alias provided         |
| `lon`               | `longitude`          | Alias provided         |
| `area`              | `area_m2`            | Alias provided         |
| `price`             | `price_million`      | Alias provided         |
| `frontage`          | `frontage_m`         | Alias provided         |
| `title`             | `name`               | Alias provided         |
| `savedCount`        | `saved_count`        | Both provided          |
| `images`            | `primary_image_url`  | FE transforms to array |
| `ai.potentialScore` | `ai_potential_score` | FE transforms          |
| `ai.priceLabel`     | `price_label`        | FE transforms          |

---

## Error Handling

All endpoints should return:

```json
{
  "success": false,
  "error": "Error message",
  "data": null
}
```

FE handles errors gracefully with fallback to Next.js API routes.

---

## CORS Headers

All responses include:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```
