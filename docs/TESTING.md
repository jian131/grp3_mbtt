# 🧪 JFinder Testing Guide

**Version:** 4.0
**Updated:** 2026-01-16

## Overview

This document describes the testing strategy, procedures, and tools for JFinder.

---

## Testing Pyramid

```
         ┌────────────┐
         │  Manual E2E │  ← Exploratory testing
         └──────┬──────┘
           ┌────┴────┐
           │ Smoke   │       ← Automated integration tests
           │ Tests   │
           └────┬────┘
         ┌──────┴───────┐
         │ API Tests    │    ← API endpoint verification
         └──────┬───────┘
       ┌────────┴─────────┐
       │   Build Tests    │  ← TypeScript compilation
       └──────────────────┘
```

---

## 1. Smoke Tests (Automated)

### Running Smoke Tests

```bash
cd grp3_mbtt
python scripts/smoke_test.py
```

### Test Coverage

| Test                | Description                                  | Pass Criteria                 |
| ------------------- | -------------------------------------------- | ----------------------------- |
| Data File Integrity | Verify JSON file exists and has 1170 records | File loads, count matches     |
| No Broken Imports   | Grep for deleted file imports                | 0 matches found               |
| n8n Health Check    | GET /healthz                                 | HTTP 200                      |
| Search API          | GET /webhook/search?limit=5                  | Returns 5 listings            |
| Search Filter       | Search with city filter                      | All results from correct city |
| Frontend Home       | GET /                                        | HTTP 200, contains "JFinder"  |
| Listing Detail API  | GET /api/listing/VN26000001                  | Returns listing object        |
| ROI Calculation     | POST /api/roi                                | Returns ROI results           |
| Valuation API       | POST /api/valuation                          | Returns valuation estimate    |

### Expected Output

```
==================================================
JFinder Smoke Test Suite
==================================================

✅ PASS | Data File Integrity
       Records: 1170
✅ PASS | No Broken Imports
       No deleted file imports found
✅ PASS | n8n Health Check
       Status: 200
✅ PASS | Search API
       Returned 5 listings
✅ PASS | Search Filter (City)
       5 results, all from HCM: True
✅ PASS | Frontend Home
       Status: 200
✅ PASS | Listing Detail API
       Found: Mặt bằng 1 - streetfront
✅ PASS | ROI Calculation
       ROI: 50%
✅ PASS | Valuation API
       Suggested: 98.7M, Samples: 17

==================================================
SUMMARY: 9 passed, 0 failed
==================================================

Results saved to reports/test_results.json and .md
```

### Test Results

Results are saved to:

- `reports/test_results.json` (machine-readable)
- `reports/test_results.md` (human-readable)

---

## 2. Build Tests

### TypeScript Compilation

```bash
npm run build
```

**Pass Criteria:**

- All TypeScript files compile without errors
- All routes generate successfully
- Build completes in <60 seconds

**Expected Output:**

```
✓ Compiled successfully in X.Xs
Route (app)
├ ○ /
├ ○ /_not-found
├ ○ /analysis
├ λ /api/export
├ λ /api/listing/[id]
├ λ /api/roi
├ λ /api/valuation
├ ○ /bi-dashboard
├ ○ /components/footer
├ ○ /components/navbar
├ ○ /dashboard
├ ○ /landlord
├ λ /listing/[id]
└ ○ /search
```

### Linting

```bash
npm run lint
```

**Pass Criteria:**

- No ESLint errors
- Warnings are acceptable (should be minimized)

---

## 3. API Tests

### n8n Webhook Tests

#### Test Search Endpoint

```bash
curl "http://localhost:5678/webhook/search?limit=3" | jq
```

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "VN26000001",
      "name": "Mặt bằng...",
      "province": "Thành phố Hồ Chí Minh",
      ...
    }
  ],
  "count": 3,
  "total": 1170
}
```

**Validation:**

- `success` is `true`
- `data` is array with 3 items
- Each item has `id`, `name`, `province` fields
- `count` equals array length
- `total` equals 1170

#### Test Search with Filters

```bash
curl "http://localhost:5678/webhook/search?province=Hà Nội&type=office&limit=5" | jq
```

**Validation:**

- All results have `province` = "Thành phố Hà Nội"
- All results have `type` = "office"
- Count ≤ 5

#### Test ROI Calculation

```bash
curl -X POST "http://localhost:5678/webhook/roi" \
  -H "Content-Type: application/json" \
  -d '{
    "monthlyRent": 20,
    "productPrice": 50000,
    "profitMargin": 0.3,
    "dailyCustomers": 100,
    "operatingCost": 10
  }' | jq
```

**Expected Response:**

```json
{
  "success": true,
  "inputs": { ... },
  "results": {
    "daily_profit_vnd": 1500000,
    "monthly_revenue_vnd": 45000000,
    "total_monthly_cost_vnd": 30000000,
    "monthly_net_profit_vnd": 15000000,
    "break_even_days": 20,
    "roi_percent": 50,
    "viability": "good"
  }
}
```

**Validation:**

- `success` is `true`
- `results.roi_percent` is numeric
- `results.viability` is one of: excellent/good/moderate/risky

#### Test Valuation

```bash
curl -X POST "http://localhost:5678/webhook/valuation" \
  -H "Content-Type: application/json" \
  -d '{
    "district": "Quận 1",
    "city": "Thành phố Hồ Chí Minh",
    "area": 50,
    "type": "streetfront"
  }' | jq
```

**Expected Response:**

```json
{
  "success": true,
  "input": { ... },
  "market_stats": {
    "sample_size": 17,
    "p25_per_sqm": "1.234",
    "median_per_sqm": "1.567",
    "p75_per_sqm": "2.345"
  },
  "valuation": {
    "suggested_price_million": 98.7,
    "priceRange": {
      "min": 80.5,
      "max": 115.2
    },
    "confidence": "high"
  }
}
```

**Validation:**

- `market_stats.sample_size` > 0
- `valuation.suggested_price_million` is positive number
- `valuation.confidence` is one of: low/medium/high

### Next.js API Tests

#### Test Listing Detail

```bash
curl "http://localhost:3000/api/listing/VN26000001" | jq
```

**Validation:**

- `success` is `true`
- `data.id` equals "VN26000001"
- `data.latitude` and `data.longitude` are numbers
- `data.images` is array

---

## 4. Frontend Tests

### Manual E2E Testing

#### Home Page (`/`)

**Steps:**

1. Navigate to http://localhost:3000
2. Verify page loads within 2 seconds
3. Check hero section displays
4. Verify navigation menu works

**Pass Criteria:**

- ✅ No console errors
- ✅ All images load or show fallback
- ✅ Navigation links work

#### Search Page (`/search`)

**Steps:**

1. Navigate to /search
2. Select province "Hà Nội"
3. Select type "office"
4. Set max price 100
5. Click "Tìm kiếm" button
6. Verify results display

**Pass Criteria:**

- ✅ Filter form works
- ✅ Results display correctly
- ✅ All results match filters
- ✅ Map shows markers (if Leaflet loads)

#### Listing Detail (`/listing/[id]`)

**Steps:**

1. Navigate to /listing/VN26000001
2. Verify all data displays
3. Check image gallery works
4. Verify map shows location

**Pass Criteria:**

- ✅ All fields populated
- ✅ Images display or show fallback
- ✅ Map marker at correct location
- ✅ Price, area, address visible

#### Analysis Page (`/analysis`)

**Steps:**

1. Navigate to /analysis
2. Fill ROI form with:
   - Monthly rent: 20
   - Product price: 50000
   - Profit margin: 30
   - Daily customers: 100
3. Click "Tính ROI"
4. Verify results display
5. Fill valuation form with:
   - District: Quận 1
   - Area: 50
6. Click "Định Giá"
7. Verify valuation results

**Pass Criteria:**

- ✅ ROI calculation works
- ✅ Results show percentages
- ✅ Valuation shows price range
- ✅ No errors in console

#### Dashboard (`/dashboard`)

**Steps:**

1. Navigate to /dashboard
2. Wait for charts to load
3. Verify all charts display

**Pass Criteria:**

- ✅ Bar charts render
- ✅ Pie chart renders
- ✅ Statistics cards show numbers

#### BI Dashboard (`/bi-dashboard`)

**Steps:**

1. Navigate to /bi-dashboard
2. Wait for Superset iframe

**Pass Criteria:**

- ✅ Iframe loads (or shows error message with workaround)
- ✅ If error, link to http://localhost:8088 works

---

## 5. Performance Testing

### Load Time Benchmarks

| Page                | Target | Acceptable |
| ------------------- | ------ | ---------- |
| Home                | <1s    | <2s        |
| Search (no filters) | <2s    | <3s        |
| Listing detail      | <1.5s  | <2.5s      |
| Analysis            | <1s    | <2s        |
| Dashboard           | <2s    | <4s        |

### Measurement

```bash
# Using curl
time curl -s http://localhost:3000 > /dev/null

# Browser DevTools
# Network tab → Reload page → Check "Load" time
```

### API Response Time

| Endpoint           | Target | Acceptable |
| ------------------ | ------ | ---------- |
| /webhook/search    | <200ms | <500ms     |
| /webhook/roi       | <50ms  | <100ms     |
| /webhook/valuation | <200ms | <500ms     |
| /api/listing/[id]  | <100ms | <200ms     |

---

## 6. Regression Testing

### Pre-Deployment Checklist

Before merging to main or deploying:

- [ ] All smoke tests pass (9/9)
- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] Manual E2E tests pass
- [ ] No broken links in UI
- [ ] Images load or fallback works
- [ ] Maps display correctly
- [ ] ROI calculation works
- [ ] Valuation works
- [ ] Superset accessible

### Known Issues

Check [reports/logic_audit.md](../reports/logic_audit.md) for known issues.

---

## 7. Test Data

### Sample Test Cases

#### Search Filters

| Province              | Type        | Expected Min Results |
| --------------------- | ----------- | -------------------- |
| Thành phố Hà Nội      | streetfront | 200+                 |
| Thành phố Hồ Chí Minh | office      | 100+                 |
| Thành phố Đà Nẵng     | shophouse   | 50+                  |

#### Known Listing IDs

- `VN26000001` - Quận 1, Hồ Chí Minh, streetfront
- `VN26000002` - Phú Nhuận, Hồ Chí Minh, office
- `VN26000490` - Thủ Đức, Hồ Chí Minh, streetfront

#### ROI Test Cases

| Monthly Rent | Product Price | Profit Margin | Daily Customers | Expected ROI |
| ------------ | ------------- | ------------- | --------------- | ------------ |
| 20           | 50000         | 0.3           | 100             | 50%          |
| 30           | 100000        | 0.2           | 50              | -25% (loss)  |
| 10           | 20000         | 0.4           | 200             | 380%         |

---

## 8. CI/CD Integration (Future)

### GitHub Actions Example

```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run build
      - run: docker compose up -d
      - run: sleep 30
      - run: python scripts/smoke_test.py
```

---

## Troubleshooting Tests

### Smoke Tests Fail

**Issue:** Connection refused errors

**Solution:**

```bash
# Verify services are running
docker compose ps

# Restart if needed
docker compose restart

# Wait for services to be ready
sleep 30

# Re-run tests
python scripts/smoke_test.py
```

### Build Fails

**Issue:** TypeScript errors

**Solution:**

```bash
# Clear cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Try build again
npm run build
```

---

For operational procedures, see [RUNBOOK.md](RUNBOOK.md)
