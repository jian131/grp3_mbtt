# JFinder Test Plan

## Prerequisites
- Docker Desktop running
- Port 5433, 5678, 8088 available
- `app/data/listings.json` exists (2500 listings)

---

## Test 1: Docker Stack Startup

**Command:**
```bash
cp .env.example .env
docker compose up -d
docker compose ps
```

**Expected:**
- All 4 containers running: postgres, n8n, superset, redis
- postgres: healthy
- n8n: listening on 5678
- superset: listening on 8088

**Pass Criteria:**
```
NAME                   STATUS
grp3_mbtt-postgres-1   Up (healthy)
grp3_mbtt-n8n-1        Up
grp3_mbtt-superset-1   Up
grp3_mbtt-redis-1      Up
```

---

## Test 2: n8n Schema Initialization

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
 Schema |   Name   | Type  | Owner
--------+----------+-------+---------
 public | listings | table | jfinder
```

---

## Test 3: Data Import

**Steps:**
1. Import `n8n/1-import-data.json`
2. Link to Postgres credential
3. Execute workflow

**Verify:**
```bash
docker exec grp3_mbtt-postgres-1 psql -U jfinder -d jfinder_db \
  -c "SELECT COUNT(*) FROM listings;"
```

**Expected:** `2500` rows

---

## Test 4: Search API

**Command:**
```bash
curl "http://localhost:5678/webhook/search?limit=3" | jq
```

**Expected:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "...",
      "city": "Hanoi",
      "lat": 21.xxx,
      "lon": 105.xxx,
      ...
    }
  ],
  "count": 3
}
```

**Pass Criteria:**
- HTTP 200
- `success: true`
- `data` array with all fields (id, title, city, lat, lon, views, saved_count, etc.)

---

## Test 5: Listing Detail API

**Command:**
```bash
curl "http://localhost:5678/webhook/listing/1" | jq
```

**Expected:**
- `success: true`
- Single listing object with full details

---

## Test 6: Stats API

**Command:**
```bash
curl "http://localhost:5678/webhook/stats" | jq
```

**Expected:**
- District-level aggregations
- median_price, p25_price, p75_price
- avg_views, total_saved

---

## Test 7: Superset Access

**Steps:**
1. Open http://localhost:8088
2. Login: admin / admin123

**Expected:**
- Dashboard loads
- Can connect to PostgreSQL via SQL Lab

**Database Connection:**
```
postgresql://jfinder:jfinder_password@postgres:5432/jfinder_db
```

---

## Test 8: End-to-End (Frontend if running)

**Command:**
```bash
npm run dev
# Open http://localhost:3000/search
```

**Expected:**
- Listings display with map markers
- Filter by city/district works
- Click listing shows detail page

---

## Cleanup (Optional)

```bash
docker compose down -v
rm -rf postgres_data n8n_data superset_data
```
