# 🧪 JFinder Test Plan

## Prerequisites

- Docker Desktop running
- Ports 5433, 5678, 8088 available
- Python 3.x (for HTTP server)
- Node.js 18+ (for frontend)

---

## Test 1: Docker Stack Startup

**Command:**
```bash
cp .env.example .env
docker compose up -d
docker compose ps
```

**Expected:**
```
NAME                   STATUS
grp3_mbtt-postgres-1   Up (healthy)
grp3_mbtt-n8n-1        Up
grp3_mbtt-superset-1   Up
grp3_mbtt-redis-1      Up
```

**Pass Criteria:** All 4 containers running, postgres healthy.

---

## Test 2: Data Server

**Command:**
```bash
python -m http.server 8000 --directory app/data
```

**Verify:**
```bash
curl http://localhost:8000/vn_rental_3cities.json | head -c 500
```

**Expected:** JSON array starts with `[{"id":"VN26000001"...`

---

## Test 3: n8n Schema Initialization

**Steps:**
1. Open http://localhost:5678
2. Import `n8n/0-init-schema.json`
3. Create Postgres credential:
   - Host: `postgres`
   - Port: `5432`
   - Database: `jfinder_db`
   - User: `jfinder`
   - Password: `jfinder_password`
4. Execute workflow

**Verify:**
```bash
docker exec grp3_mbtt-postgres-1 psql -U jfinder -d jfinder_db -c "\dt"
```

**Expected:**
```
 Schema |   Name   | Type
--------+----------+-------
 public | listings | table
```

---

## Test 4: Data Import

**Steps:**
1. Import `n8n/1-import-data.json`
2. Link to Postgres credential
3. Execute workflow

**Verify:**
```bash
docker exec grp3_mbtt-postgres-1 psql -U jfinder -d jfinder_db \
  -c "SELECT COUNT(*) FROM listings;"
```

**Expected:** `1170` rows

**Verify Data Quality:**
```bash
docker exec grp3_mbtt-postgres-1 psql -U jfinder -d jfinder_db \
  -c "SELECT province, COUNT(*) FROM listings GROUP BY province;"
```

**Expected:** Data from 3 provinces (HCM, Hà Nội, Đà Nẵng)

---

## Test 5: Search API

**Activate workflow:** Import and toggle ON `search_api_workflow.json`

**Test Basic:**
```bash
curl "http://localhost:5678/webhook/search?limit=3" | jq
```

**Expected:**
```json
{
  "success": true,
  "data": [
    {
      "id": "VN26000xxx",
      "name": "...",
      "province": "...",
      "price_million": ...,
      "price_label": "fair|cheap|expensive"
    }
  ],
  "count": 3
}
```

**Test with Filters:**
```bash
curl "http://localhost:5678/webhook/search?city=Hồ Chí Minh&type=streetfront&max_price=100" | jq '.count'
```

**Test Radius Search:**
```bash
curl "http://localhost:5678/webhook/search?lat=10.78&lon=106.65&radius_m=5000&limit=5" | jq '.count'
```

---

## Test 6: Listing Detail API

**Activate:** `listing_api_workflow.json`

**Command:**
```bash
curl "http://localhost:5678/webhook/listing/VN26000001" | jq
```

**Expected:**
- `success: true`
- `data.id: "VN26000001"`
- `data.price_label` exists
- `data.area_stats` (may be null if view not populated)

---

## Test 7: Stats API

**Activate:** `stats_api_workflow.json`

**District Level:**
```bash
curl "http://localhost:5678/webhook/stats?level=district" | jq '.count'
```

**Ward Level with City Filter:**
```bash
curl "http://localhost:5678/webhook/stats?level=ward&city=Hà Nội" | jq '.data[0]'
```

**Expected fields:** `province, district, ward, listing_count, median_price, p25_price, p75_price`

---

## Test 8: ROI Calculator API

**Activate:** `roi_api_workflow.json`

**Command:**
```bash
curl -X POST "http://localhost:5678/webhook/roi" \
  -H "Content-Type: application/json" \
  -d '{"monthly_rent":50,"product_price":50000,"profit_margin":0.3,"target_daily_customers":100}' | jq
```

**Expected:**
```json
{
  "success": true,
  "inputs": {...},
  "results": {
    "break_even_days": ...,
    "monthly_net_profit_vnd": ...,
    "roi_percent": ...,
    "viability": "excellent|good|moderate|risky"
  }
}
```

---

## Test 9: Valuation API

**Activate:** `valuation_api_workflow.json`

**Command:**
```bash
curl -X POST "http://localhost:5678/webhook/valuation" \
  -H "Content-Type: application/json" \
  -d '{"district":"Quận 1","type":"streetfront","area_m2":100,"frontage_m":6}' | jq
```

**Expected:**
```json
{
  "success": true,
  "market_stats": {
    "median_per_sqm": "...",
    "sample_size": ...
  },
  "valuation": {
    "suggested_price_million": ...,
    "price_range": {"min": ..., "max": ...},
    "confidence": "low|medium|high"
  }
}
```

---

## Test 10: Superset Access

**Steps:**
1. Open http://localhost:8088
2. Login: `admin` / `admin123`

**Verify DB Connection:**
1. Go to **Settings** → **Database Connections**
2. Add connection: `postgresql://jfinder:jfinder_password@postgres:5432/jfinder_db`
3. Test connection

**Create Dataset:**
1. Go to **SQL Lab**
2. Run: `SELECT * FROM listings LIMIT 10`
3. Save as Dataset

---

## Test 11: Frontend (Optional)

**Command:**
```bash
npm install
npm run dev
```

**Verify:**
1. Open http://localhost:3000
2. Navigate to `/search`
3. Click "Tìm kiếm" - should show listings
4. Navigate to `/map` - should show heatmap markers

---

## Cleanup

```bash
docker compose down -v
rm -rf postgres_data n8n_data superset_data
```

---

## Checklist Summary

| Test | Status |
|------|--------|
| Docker up | ⬜ |
| Data server | ⬜ |
| Schema init | ⬜ |
| Data import (1170 rows) | ⬜ |
| Search API | ⬜ |
| Listing API | ⬜ |
| Stats API | ⬜ |
| ROI API | ⬜ |
| Valuation API | ⬜ |
| Superset login | ⬜ |
| Frontend loads | ⬜ |

---

**Last updated:** 2026-01-15
