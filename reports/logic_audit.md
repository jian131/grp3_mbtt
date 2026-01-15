# JFinder Logic Audit Report

**Generated:** 2026-01-16
**Auditor:** Senior Engineer / Repo Maintainer

## 1. Executive Summary

| Category            | Status   | Issues Found                                   |
| ------------------- | -------- | ---------------------------------------------- |
| Data Schema         | ⚠️ Minor | Field naming inconsistency between API and FE  |
| Geo Logic           | ✅ Fixed | Previously broken, now 100% verified           |
| ROI Calculation     | ⚠️ Note  | Business-focused ROI (retail), not real estate |
| Valuation Logic     | ⚠️ Note  | Field mapping issue with `district`            |
| Data Transformation | ✅ Good  | Proper aliasing in lib/api.ts                  |
| Image Handling      | ✅ Fixed | Fallback system in place                       |

## 2. Data Schema Analysis

### 2.1 Raw JSON Schema (vn_rental_3cities_verified.json)

```typescript
// Actual fields in verified JSON
{
  id: string; // "VN26000001"
  name: string; // "Mặt bằng 1 - streetfront"
  address: string;
  province: string; // "Thành phố Hồ Chí Minh"
  district: string; // "Quận 1"
  ward: string; // "Phường Tân Định"
  latitude: number;
  longitude: number;
  type: string; // "streetfront", "office", "shophouse"
  market_segment: string; // "street_retail", "shopping_mall"
  area: number; // NOTE: NOT area_m2
  frontage: number; // NOTE: NOT frontage_m
  floors: number;
  price: number; // NOTE: NOT price_million
  rent_per_sqm_million: number;
  currency: string;
  price_unit: string;
  images: string; // JSON string: "['url1', 'url2']"
  amenities_schools: number;
  amenities_offices: number;
  amenities_competitors: number;
  ai_suggested_price: number;
  ai_potential_score: number;
  ai_risk_level: string;
  views: number;
  savedCount: number; // NOTE: camelCase
  posted_at: string;
  owner: string; // JSON string: "{'name': '...', 'phone': '...'}"
  primary_image_url: string;
  // ... image attribution fields
}
```

### 2.2 Schema Discrepancies

| JSON Field        | FE Expected        | Status      | Fix                           |
| ----------------- | ------------------ | ----------- | ----------------------------- |
| `area`            | `area_m2`          | ⚠️ Mismatch | transformListing handles both |
| `frontage`        | `frontage_m`       | ⚠️ Mismatch | transformListing handles both |
| `price`           | `price_million`    | ⚠️ Mismatch | transformListing handles both |
| `savedCount`      | `saved_count`      | ⚠️ Mismatch | transformListing handles both |
| `images` (string) | `images[]` (array) | ⚠️ String   | transformListing parses JSON  |
| `owner` (string)  | `owner` (object)   | ⚠️ String   | route.ts parses JSON          |

**Verdict:** All mismatches are handled by `transformListing()` in lib/api.ts. No breaking bugs.

---

## 3. Geo Logic Audit

### 3.1 Previous Issue (FIXED)

Data had lat/lng coordinates that didn't match province_name. Example:

- province_name = "Hà Nội" but lat/lng pointed to Hồ Chí Minh

### 3.2 Current Status: ✅ VERIFIED

The `vn_rental_3cities_verified.json` dataset has been:

1. Processed through `geo_normalize.py`
2. Run through GADM point-in-polygon verification
3. Filtered to only include records where coordinates match province

**Evidence:**

- QC report shows 100% pass rate
- Only 1170 records remain (from 2500 original)
- Each record has `geo_status`, `geo_method`, `admin_match_level` fields

### 3.3 Geo Fields in API Response

```typescript
// listing/[id]/route.ts returns:
{
  latitude: number,
  longitude: number,
  lat: number,       // alias
  lon: number,       // alias
  province: string,
  district: string,
  ward: string,
  geo_status: string,
  geo_method: string,
  admin_match_level: string
}
```

---

## 4. ROI Calculation Audit

### 4.1 Location: `/app/api/roi/route.ts`

### 4.2 Business Logic Review

```typescript
// Current ROI calculation is for RETAIL BUSINESS, not real estate investment
Input:
  - monthly_rent (triệu VND/tháng) - tiền thuê mặt bằng
  - product_price (VND) - giá sản phẩm bán
  - profit_margin (%) - biên lợi nhuận
  - daily_customers (số) - khách/ngày
  - operating_cost (triệu VND) - chi phí vận hành

Calculation:
  dailyProfit = productPrice * profitMargin * dailyCustomers
  monthlyRevenue = dailyProfit * 30
  totalMonthlyCost = monthlyRent + operatingCost
  monthlyNetProfit = monthlyRevenue - totalMonthlyCost
  breakEvenDays = totalMonthlyCost / dailyProfit
  roiPercent = (monthlyNetProfit / totalMonthlyCost) * 100
```

### 4.3 Issues

| Issue          | Severity | Description                                                            |
| -------------- | -------- | ---------------------------------------------------------------------- |
| Naming         | ⚠️ Low   | "ROI" is misleading - this is retail profitability, not investment ROI |
| Unit confusion | ⚠️ Low   | Some inputs in million VND, others in raw VND                          |
| No validation  | ⚠️ Low   | No input validation (negative values accepted)                         |

### 4.4 Recommendation

Rename to "Business Profitability Calculator" or add a real estate ROI calculator:

```typescript
// True real estate ROI formula:
grossYield = (annualRent / purchasePrice) * 100;
netYield = ((annualRent - expenses) / purchasePrice) * 100;
capRate = NOI / purchasePrice;
paybackYears = purchasePrice / netAnnualIncome;
```

---

## 5. Valuation Logic Audit

### 5.1 Location: `/app/api/valuation/route.ts`

### 5.2 Algorithm Review

```typescript
1. Load all listings from JSON
2. Filter by district (exact match)
3. If <10 samples, fallback to city-wide
4. Calculate rent per sqm for comparables
5. Get P25, median, P75
6. Apply adjustments:
   - frontage > 8m: +10%
   - frontage > 5m: +5%
   - frontage < 3m: -10%
   - floors > 2: +3% per extra floor (shophouse/office only)
7. Return suggested price = median * adjustment * area
```

### 5.3 Issues

| Issue                   | Severity | Description                                                            |
| ----------------------- | -------- | ---------------------------------------------------------------------- |
| District filter bug     | 🔴 HIGH  | Uses `l.district !== district` but comparison may fail due to encoding |
| City inference broken   | ⚠️ MED   | `district.includes('Hà Nội')` is wrong - district ≠ city               |
| Type filter not applied | ⚠️ MED   | `l.type !== type` but fallback ignores type                            |
| Low sample handling     | ✅ OK    | Fallback to city-wide is reasonable                                    |

### 5.4 Fix Required for Valuation

```typescript
// CURRENT (buggy)
if (district && l.district !== district) return false;
if (district.includes("Hà Nội") || listing.province?.includes("Hà Nội"))
  if (district && l.district.trim() !== district.trim())
    // SHOULD BE
    return false;
// Use province/city parameter, not infer from district name
if (city && l.province !== city) return false;
```

---

## 6. Data Transformation Audit

### 6.1 Location: `lib/api.ts::transformListing()`

### 6.2 Transformation Logic

```typescript
function transformListing(listing: any): Listing {
  // ✅ Parse images from JSON string to array
  // ✅ Handle both field naming conventions (area vs area_m2)
  // ✅ Calculate priceLabel from ai_suggested_price
  // ✅ Create ai object for backward compatibility
  // ✅ Add all aliases (lat, lon, area, price, frontage, title)

  return {
    ...listing,
    lat: listing.latitude || listing.lat,
    lon: listing.longitude || listing.lon,
    area: listing.area_m2 || listing.area,
    price: listing.price_million || listing.price,
    images: images,
    ai: {
      potentialScore: listing.ai_potential_score,
      priceLabel: priceLabel,
    },
  };
}
```

### 6.3 Status: ✅ GOOD

The transformation function correctly handles:

- Snake_case ↔ camelCase conversion
- Field aliasing for backward compatibility
- JSON string parsing (images, owner)
- Price label calculation from AI data

---

## 7. Image Handling Audit

### 7.1 Components

- `FallbackImage.tsx` - Handles broken images with placeholder
- `ImageGallery.tsx` - Uses FallbackImage for listing images

### 7.2 Image URL Status

| Source              | Format                           | Status                        |
| ------------------- | -------------------------------- | ----------------------------- |
| `images` field      | JSON string of URLs              | ✅ Parsed in transformListing |
| `primary_image_url` | Direct URL                       | ✅ Used as fallback           |
| Wikimedia URLs      | https://upload.wikimedia.org/... | ✅ Working                    |

### 7.3 FallbackImage Logic

```typescript
// On error: Show placeholder
// On load: Show actual image
// Handles: null/undefined URLs, broken URLs, slow loading
```

---

## 8. n8n Workflow Audit

### 8.1 Active Workflow: `JFinder_API_NoPostgres.json`

**Endpoints:**

- `/webhook/search` - File-based search
- `/webhook/stats` - Aggregated statistics
- `/webhook/roi` - ROI calculation
- `/webhook/valuation` - Property valuation

### 8.2 Data Source

```
Volume mount: ./app/data → /data
File: /data/vn_rental_3cities_verified.json
Read method: Read File → Parse JSON → Filter
```

### 8.3 Status: ✅ CORRECT

- No Postgres queries
- All data from mounted JSON file
- Filtering done via JavaScript nodes

---

## 9. Summary of Required Fixes

### 9.1 High Priority

| Fix                       | File                         | Description                                        |
| ------------------------- | ---------------------------- | -------------------------------------------------- |
| Valuation district filter | `app/api/valuation/route.ts` | Fix string comparison with trim()                  |
| Valuation city parameter  | `app/api/valuation/route.ts` | Add explicit city param, don't infer from district |

### 9.2 Low Priority (Nice to Have)

| Fix                     | File                   | Description                                       |
| ----------------------- | ---------------------- | ------------------------------------------------- |
| Add input validation    | `app/api/roi/route.ts` | Validate numeric inputs                           |
| Rename ROI endpoint     | -                      | Clarify it's retail profitability, not investment |
| Standardize field names | -                      | Align JSON with TypeScript interface              |

---

## 10. Test Cases to Verify

```typescript
// Test 1: Valuation for specific district
POST /api/valuation
{ "district": "Quận 1", "area": 50 }
// Expected: Returns valuation with sample_size > 0

// Test 2: Listing detail
GET /api/listing/VN26000001
// Expected: Returns listing with lat, lon, images array

// Test 3: Search with type filter
GET /webhook/search?type=office
// Expected: Returns only office listings

// Test 4: ROI with valid inputs
POST /api/roi
{ "monthlyRent": 20, "productPrice": 50000, "profitMargin": 0.3, "dailyCustomers": 100 }
// Expected: Returns positive ROI
```

---

## Appendix: Field Mapping Reference

| JSON Field         | lib/api.ts Alias  | Component Usage        |
| ------------------ | ----------------- | ---------------------- |
| latitude           | lat               | RentalHeatmap, search  |
| longitude          | lon               | RentalHeatmap, search  |
| area               | area_m2           | search, listing detail |
| frontage           | frontage_m        | listing detail         |
| price              | price_million     | all price displays     |
| name               | title             | listing cards          |
| images (string)    | images (array)    | ImageGallery           |
| ai_potential_score | ai.potentialScore | listing detail         |
| savedCount         | saved_count       | listing detail         |
