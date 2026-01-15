# API Compatibility Test Cases

This document provides test cases for verifying n8n API endpoints match FE expectations.

## Prerequisites

1. n8n is running at `http://localhost:5678`
2. Workflow `JFinder_API_NoPostgres.json` is imported and activated
3. Data file `vn_rental_3cities_verified.json` is mounted at `/data/files/`

---

## Test 1: Search Listings

### 1.1 Basic Search (All listings)

**Request:**

```bash
curl "http://localhost:5678/webhook/search?limit=10"
```

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "VN26000001",
      "name": "...",
      "latitude": 10.xxx,
      "longitude": 106.xxx,
      "lat": 10.xxx,
      "lon": 106.xxx,
      "district": "Quận 1",
      "price_million": 156.7,
      "price": 156.7,
      "area_m2": 75.2,
      "area": 75.2,
      "primary_image_url": "https://..."
    }
  ],
  "count": 10,
  "total": 2500
}
```

**Validation:**

- [ ] `success` is `true`
- [ ] `data` is array
- [ ] Each item has both `latitude` and `lat`
- [ ] Each item has both `price_million` and `price`
- [ ] Each item has both `area_m2` and `area`
- [ ] `count` equals length of `data`

### 1.2 Filter by District (Hoàn Kiếm test)

**Request:**

```bash
curl "http://localhost:5678/webhook/search?district=Ho%C3%A0n%20Ki%E1%BA%BFm&limit=50"
```

**Expected:**

- All returned listings have `district` containing "Hoàn Kiếm"
- All `latitude` values should be approximately 21.02-21.04
- All `longitude` values should be approximately 105.84-105.87
- **NO listings should have coordinates in Long Biên area (21.04-21.07, 105.87-105.92)**

**Validation Script:**

```javascript
const response = await fetch("/webhook/search?district=Hoàn Kiếm&limit=100");
const json = await response.json();

const hoanKiemBounds = {
  minLat: 21.01,
  maxLat: 21.045,
  minLon: 105.84,
  maxLon: 105.87,
};

const allInBounds = json.data.every(
  (l) =>
    l.latitude >= hoanKiemBounds.minLat &&
    l.latitude <= hoanKiemBounds.maxLat &&
    l.longitude >= hoanKiemBounds.minLon &&
    l.longitude <= hoanKiemBounds.maxLon
);

console.assert(allInBounds, "All Hoàn Kiếm listings should be within bounds");
```

### 1.3 Filter by Type

**Request:**

```bash
curl "http://localhost:5678/webhook/search?type=office&limit=20"
```

**Expected:**

- All returned listings have `type === "office"`

### 1.4 Price Range Filter

**Request:**

```bash
curl "http://localhost:5678/webhook/search?min_price=20&max_price=50&limit=20"
```

**Expected:**

- All returned listings have `price_million >= 20` AND `price_million <= 50`

---

## Test 2: Listing Detail

### 2.1 Get Valid Listing

**Request:**

```bash
curl "http://localhost:5678/webhook/listing/VN26000001"
```

**Expected Response:**

```json
{
  "success": true,
  "found": true,
  "data": {
    "id": "VN26000001",
    "name": "Mặt bằng 1 - streetfront",
    "title": "Mặt bằng 1 - streetfront",
    "district": "Quận 1",
    "latitude": 10.836687,
    "lat": 10.836687,
    "owner": {
      "name": "Trần Văn Thắng",
      "phone": "0502419543"
    },
    "area_stats": {
      "listing_count": 45,
      "median_price": 85.5
    }
  }
}
```

**Validation:**

- [ ] `success` is `true`
- [ ] `found` is `true`
- [ ] `data.owner` is object (not string)
- [ ] `area_stats` exists with statistics

### 2.2 Get Invalid Listing

**Request:**

```bash
curl "http://localhost:5678/webhook/listing/INVALID_ID"
```

**Expected Response:**

```json
{
  "success": false,
  "error": "Listing not found",
  "data": null
}
```

---

## Test 3: ROI Calculator

### 3.1 Standard Calculation

**Request:**

```bash
curl -X POST "http://localhost:5678/webhook/roi" \
  -H "Content-Type: application/json" \
  -d '{
    "monthly_rent": 30,
    "product_price": 50000,
    "profit_margin": 0.3,
    "target_daily_customers": 150,
    "operating_cost": 5
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "inputs": {
    "monthly_rent_million": 30,
    "product_price_vnd": 50000,
    "profit_margin": 0.3,
    "daily_customers": 150,
    "operating_cost_million": 5
  },
  "results": {
    "daily_profit_vnd": 2250000,
    "monthly_revenue_vnd": 67500000,
    "total_monthly_cost_vnd": 35000000,
    "monthly_net_profit_vnd": 32500000,
    "break_even_days": 16,
    "roi_percent": 92.9,
    "viability": "good"
  }
}
```

**Validation:**

- [ ] `success` is `true`
- [ ] `results.break_even_days` is calculated correctly
- [ ] `results.viability` matches break-even logic:
  - `>25 days` → `risky`
  - `20-25 days` → `moderate`
  - `15-20 days` → `good`
  - `<15 days` → `excellent`

### 3.2 Alternative Field Names

**Request:**

```bash
curl -X POST "http://localhost:5678/webhook/roi" \
  -H "Content-Type: application/json" \
  -d '{
    "monthlyRent": 30,
    "productPrice": 50000,
    "profitMargin": 0.3,
    "dailyCustomers": 150,
    "operatingCost": 5
  }'
```

**Expected:** Same as 3.1 (camelCase aliases work)

---

## Test 4: Valuation

### 4.1 Standard Valuation

**Request:**

```bash
curl -X POST "http://localhost:5678/webhook/valuation" \
  -H "Content-Type: application/json" \
  -d '{
    "district": "Quận 1",
    "ward": "Phường Tân Định",
    "type": "streetfront",
    "area_m2": 60,
    "frontage_m": 6,
    "floors": 1
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "input": {
    "district": "Quận 1",
    "ward": "Phường Tân Định",
    "type": "streetfront",
    "area_m2": 60,
    "frontage_m": 6,
    "floors": 1
  },
  "market_stats": {
    "p25_per_sqm": 0.8,
    "median_per_sqm": 1.5,
    "p75_per_sqm": 2.5,
    "sample_size": 45
  },
  "valuation": {
    "suggested_price_million": 94.5,
    "price_range": {
      "min": 47.9,
      "max": 157.5
    },
    "priceRange": {
      "min": 47.9,
      "max": 157.5
    },
    "confidence": "high",
    "riskLevel": "low",
    "potentialScore": 75
  }
}
```

**Validation:**

- [ ] `success` is `true`
- [ ] `market_stats.sample_size > 0`
- [ ] `valuation.confidence` is `high` if sample_size >= 30
- [ ] Both `price_range` and `priceRange` exist (FE compat)
- [ ] `suggested_price_million` is reasonable (area × median_per_sqm × adjustment)

### 4.2 Fallback to District

**Request:**

```bash
curl -X POST "http://localhost:5678/webhook/valuation" \
  -H "Content-Type: application/json" \
  -d '{
    "district": "Quận 1",
    "type": "streetfront",
    "area_m2": 50
  }'
```

**Expected:** Should return valuation using district-level comparables (no ward filter)

---

## Test 5: Statistics

### 5.1 District Level Stats

**Request:**

```bash
curl "http://localhost:5678/webhook/stats?level=district"
```

**Expected:**

```json
{
  "success": true,
  "level": "district",
  "data": [
    {
      "province": "Thành phố Hà Nội",
      "district": "Quận Hoàn Kiếm",
      "listing_count": 45,
      "median_price": 85.5,
      "p25_price": 45.0,
      "p75_price": 120.0
    }
  ],
  "count": 50
}
```

### 5.2 Ward Level Stats

**Request:**

```bash
curl "http://localhost:5678/webhook/stats?level=ward&city=Hà Nội"
```

**Expected:**

- All results have `province` containing "Hà Nội"
- Results include `ward` and `type` fields

---

## Test 6: Districts List

**Request:**

```bash
curl "http://localhost:5678/webhook/districts"
```

**Expected:**

```json
{
  "success": true,
  "data": [
    {
      "province": "Thành phố Hà Nội",
      "districts": ["Quận Ba Đình", "Quận Hoàn Kiếm", "..."]
    }
  ],
  "count": 50
}
```

---

## Test 7: Map Display Verification

### 7.1 Visual Verification

1. Open FE at `http://localhost:3000`
2. Navigate to search page with district filter "Hoàn Kiếm"
3. Verify on map:
   - All pins are within Hoàn Kiếm boundary
   - No pins appear in Long Biên or other districts
   - Popup shows correct district name

### 7.2 Coordinate Bounds Check

| District     | Expected Lat Range | Expected Lon Range |
| ------------ | ------------------ | ------------------ |
| Hoàn Kiếm    | 21.01 - 21.045     | 105.84 - 105.87    |
| Ba Đình      | 21.03 - 21.06      | 105.81 - 105.85    |
| Long Biên    | 21.04 - 21.10      | 105.87 - 105.95    |
| Quận 1 (HCM) | 10.76 - 10.80      | 106.68 - 106.72    |

---

## Automated Test Script

```javascript
// test-api.js
const BASE = "http://localhost:5678/webhook";

async function runTests() {
  const results = [];

  // Test 1: Search
  const search = await fetch(`${BASE}/search?limit=10`).then((r) => r.json());
  results.push({
    test: "Search Basic",
    pass:
      search.success &&
      search.data.length > 0 &&
      search.data[0].lat !== undefined,
  });

  // Test 2: District Filter
  const hoanKiem = await fetch(
    `${BASE}/search?district=Hoàn Kiếm&limit=50`
  ).then((r) => r.json());
  const allCorrect = hoanKiem.data.every(
    (l) =>
      l.district.includes("Hoàn Kiếm") &&
      l.latitude > 21.01 &&
      l.latitude < 21.05
  );
  results.push({
    test: "District Filter Hoàn Kiếm",
    pass: allCorrect,
  });

  // Test 3: Listing Detail
  const listing = await fetch(`${BASE}/listing/VN26000001`).then((r) =>
    r.json()
  );
  results.push({
    test: "Listing Detail",
    pass:
      listing.success && listing.data && typeof listing.data.owner === "object",
  });

  // Test 4: ROI
  const roi = await fetch(`${BASE}/roi`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      monthly_rent: 30,
      product_price: 50000,
      profit_margin: 0.3,
      target_daily_customers: 150,
      operating_cost: 5,
    }),
  }).then((r) => r.json());
  results.push({
    test: "ROI Calculator",
    pass: roi.success && roi.results.break_even_days > 0,
  });

  // Test 5: Valuation
  const val = await fetch(`${BASE}/valuation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      district: "Quận 1",
      type: "streetfront",
      area_m2: 50,
    }),
  }).then((r) => r.json());
  results.push({
    test: "Valuation",
    pass: val.success && val.valuation.suggested_price_million > 0,
  });

  // Print results
  console.log("\n=== API Test Results ===\n");
  results.forEach((r) => {
    console.log(`${r.pass ? "✅" : "❌"} ${r.test}`);
  });

  const passed = results.filter((r) => r.pass).length;
  console.log(`\n${passed}/${results.length} tests passed`);
}

runTests().catch(console.error);
```

---

## Acceptance Criteria

| Test                                | Criteria                                   | Status |
| ----------------------------------- | ------------------------------------------ | ------ |
| Search returns valid data           | `success: true`, array with listings       | ⬜     |
| Field aliases work                  | Both `lat/latitude`, `price/price_million` | ⬜     |
| District filter works correctly     | Only matching district, coords in bounds   | ⬜     |
| Hoàn Kiếm not mixing with Long Biên | Coordinates verified                       | ⬜     |
| Listing detail returns owner object | Not string                                 | ⬜     |
| ROI calculation correct             | Break-even days formula                    | ⬜     |
| Valuation uses real market data     | sample_size > 0                            | ⬜     |
| Map pins display correctly          | Visual verification                        | ⬜     |
| Ward match rate >= 95%              | From geo_qc_report                         | ⬜     |
| District match rate >= 99%          | From geo_qc_report                         | ⬜     |
