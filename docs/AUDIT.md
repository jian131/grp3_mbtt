# JFinder System Audit Report

**Date**: 2026-01-15
**Auditor**: Principal Engineer (Refactor Specialist)
**Objective**: Simplify to n8n + Superset only, eliminate manual SQL, remove AI/Vision services

---

## Executive Summary

✅ **GOOD NEWS**: No AI/Vision/Vector DB code found
🚨 **CRITICAL**: Manual SQL scripts violate no-code principle
⚠️ **MEDIUM**: Python import script bypasses n8n
✅ **ARCHITECTURE**: Docker Compose already minimal (n8n + Superset + Postgres + Redis)

---

## 1. Current State

###  Services Running (Docker)
| Service | Image | Port | Purpose | **Status** |
|---------|-------|------|---------|-----------|
| postgres | postgis/postgis:15-3.3 | 5433 | Data store | ✅ **KEEP** |
| n8n | n8nio/n8n:latest | 5678 | Backend/ETL | ✅ **KEEP** |
| superset | apache/superset:latest | 8088 | BI Dashboard | ✅ **KEEP** |
| redis | redis:7 | 6379 | Superset cache | ✅ **KEEP** |

### Frontend (Not in Docker)
- **Next.js** (npm run dev, port 3000) - Consumer of n8n API

---

## 2. Critical Findings

### 🚨 **VIOLATION #1: Manual SQL Script**
**File**: `db/init_db.sql`
**Severity**: **CRITICAL**
**Issue**:
- 56 lines of hand-written SQL (CREATE TABLE, INDEX, VIEW)
- Mounted to postgres container as init script
- Violates "no manual SQL in repo" rule

**Impact**:
- Dev must maintain schema SQL
- Hard to version/migrate
- Not "low-code friendly"

**Solution**:
Remove `db/init_db.sql` and replace with:
1. **n8n workflow** that creates table via `Postgres` node (Execute Query)
2. OR use **Superset Metadata** to auto-create datasets (but this doesn't create tables)
3. OR **Hasura/Directus** (but not in scope)

**Recommended**: Create `n8n/init_db_workflow.json` that runs:
```sql
CREATE TABLE IF NOT EXISTS listings (...);
CREATE INDEX IF NOT EXISTS ...;
```
via n8n Postgres node, triggered manually once.

---

### ⚠️ **VIOLATION #2: Python Import Script**
**File**: `scripts/import_data.py`
**Severity**: **MEDIUM**
**Issue**:
- Hardcoded DB connection
- Bypasses n8n (user ran Python directly to import 2500 listings)
- Not reproducible via n8n UI

**Solution**:
- **DELETE** `scripts/import_data.py`
- Use existing `n8n/import_workflow.json` (already exists!)
- Fix workflow to work properly (current version has issues)

---

### ⚠️ **VIOLATION #3: Hardcoded Secrets**
**File**: `docker-compose.yml`
**Lines**: 10, 47
**Issue**:
- `POSTGRES_PASSWORD: jfinder_password` (plaintext)
- `SUPERSET_SECRET_KEY: YOUR_OWN_RANDOM_GENERATED_SECRET_KEY` (placeholder)

**Solution**:
- Move to `.env` file
- Use `docker-compose.yml` with `${VAR}` syntax

---

### ℹ️ **INFO #4: Incomplete n8n Workflows**
**Files**:
- `n8n/import_workflow.json` ✅ Exists (but buggy - Binary read issue)
- `n8n/search_api_workflow.json` ✅ Exists
- `n8n/listing_api_workflow.json` ✅ Exists

**Issues**:
1. Import workflow fails due to file path/permission (fixed via Python workaround)
2. Workflows not committed to Git in exported format
3. No "init DB schema" workflow

---

### ℹ️ **INFO #5: Missing Superset Setup**
**Current**: Manual container exec commands
**Files**: `scripts/setup_superset.sh`, `setup_superset.ps1`

**Issue**:
- Scripts exist but not integrated into `docker-compose` healthcheck
- No exported Superset metadata (dashboards, datasets, charts)

**Solution**:
- Add Superset init as `entrypoint` override in compose
- Export Superset config as JSON (via CLI)

---

### ℹ️ **INFO #6: Orphaned Files**
**Unnecessary files in repo**:
- `mockListings.json` (821KB) - Mock data, not used
- `n8n_backend.json` (12KB) - Legacy workflow?
- `extract_districts.js` - One-off script
- `env_setup_guide.txt` - Outdated

**Action**: Delete or move to `archive/`

---

## 3. Data Flow Audit

### Current Flow
```
[CSV/JSON] → Python script → [Postgres] ← n8n (API) → Frontend
                                ↓
                            Superset (BI)
```

### Target Flow (No Python)
```
[CSV/JSON] → n8n (Import workflow) → [Postgres] ← n8n (API) → Frontend
                                         ↓
                                     Superset (BI)
```

---

## 4. Schema Consistency Check

### Postgres Columns (Actual)
```
id, title, city, district, ward,
price_million, area_m2, rent_per_sqm_million,
lat, lon, geom, type, image_url, raw_data, created_at
```

### Dataset Expected Columns (User requirement)
```
id, title, city/district/ward + admin_codes,
lat, lon, type/segment,
price_million, rent_per_sqm_million, area_m2,
frontage, floors, views, savedCount, createdAt,
primary_image_url
```

### Missing in DB Schema
❌ `frontage`, `floors`, `segment`, `admin_codes`
❌ `views`, `savedCount` (engagement metrics)
❌ `primary_image_url` vs `image_url`

**Impact**: Frontend expects these fields but DB doesn't have them!

**Solution**:
- Add missing columns to schema
- OR Parse from `raw_data` JSONB in queries
- OR Update dataset to remove unavailable fields

---

## 5. Security & Performance

### Findings
✅ **CORS**: Properly configured (`N8N_CORS_ALLOW_ORIGIN`)
⚠️ **Secrets**: Hardcoded in compose (move to .env)
✅ **Indexes**: Present (geom, price, district, city)
❌ **Auth**: No webhook auth on n8n endpoints (public!)
❌ **Rate Limit**: No API rate limiting

### Recommendations
1. Add n8n webhook auth tokens
2. Add nginx reverse proxy for rate limiting (optional)
3. Use `.env` for all secrets

---

## 6. Removal Plan

### DELETE immediately
- ❌ `db/init_db.sql` (56 lines)
- ❌ `scripts/import_data.py` (60 lines)
- ❌ `mockListings.json` (800KB)
- ❌ `extract_districts.js`
- ❌ `n8n_backend.json` (if legacy)

### UPDATE
- ✏️ `docker-compose.yml` - Move secrets to .env
- ✏️ `n8n/import_workflow.json` - Fix file read issues
- ✏️ Add `n8n/init_schema_workflow.json` (replaces SQL)

### CREATE
- ➕ `.env.example` template
- ➕ `docs/TESTING.md` (test plan)
- ➕ Superset metadata export (JSON)

---

## 7. Architecture Recommendation

### Minimal Setup (Target)
```yaml
services:
  postgres:       # Data store ONLY
  n8n:            # ETL + API
  superset:       # BI
  redis:          # Superset cache
```

### Schema Management Strategy
**Option A (Recommended)**:
- n8n workflow `0-init-schema.json` runs once
- Contains CREATE TABLE SQL in Postgres node
- Idempotent (IF NOT EXISTS)

**Option B**:
- Use Hasura/Directus (adds service - NOT recommended per requirements)

**Option C**:
- Keep init_db.sql but document as "exception" (least preferred)

**DECISION**: Use Option A

---

## 8. Assumptions

Since user did not provide:
1. Exact dataset file location → **Assumed**: `app/data/listings.json`
2. Missing columns strategy → **Assumed**: Parse from `raw_data` JSONB
3. Superset dashboard requirements → **Assumed**: Price heatmap, district stats, trend charts
4. Auth requirements → **Assumed**: Local dev (no auth for now)

---

## Next Steps

1. ✅ Create implementation plan (commit-by-commit)
2. 🔄 Implement refactor
3. 🧪 Test full flow
4. 📝 Update docs

**Estimated effort**: 2-3 hours
