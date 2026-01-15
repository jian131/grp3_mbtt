# JFinder Repository Inventory

**Generated:** 2026-01-16
**Status:** Production Ready (3 Cities Dataset)

## 1. Directory Tree (3 levels)

```
grp3_mbtt/
├── app/                          # Next.js App Router
│   ├── analysis/                 # ROI + Valuation page
│   │   └── page.tsx
│   ├── api/                      # API Routes (fallback for n8n)
│   │   ├── export/               # CSV/JSON export
│   │   │   └── route.ts
│   │   ├── listing/[id]/         # Listing detail API
│   │   │   └── route.ts
│   │   ├── roi/                  # ROI calculation API
│   │   │   └── route.ts
│   │   └── valuation/            # Valuation API
│   │       └── route.ts
│   ├── bi-dashboard/             # Superset embed
│   │   └── page.tsx
│   ├── components/               # App-level components
│   │   ├── footer/
│   │   ├── navbar/
│   │   └── LeafletMap.tsx        # ⚠️ Unused
│   ├── dashboard/                # Stats dashboard
│   │   └── page.tsx
│   ├── data/                     # Dataset files (mounted to n8n)
│   │   ├── vn_rental_3cities.csv
│   │   ├── vn_rental_3cities.json
│   │   ├── vn_rental_3cities_verified.csv
│   │   └── vn_rental_3cities_verified.json
│   ├── landlord/                 # Landlord valuation page
│   │   └── page.tsx
│   ├── listing/[id]/             # Listing detail page
│   │   └── page.tsx
│   ├── search/                   # Search/filter page
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                  # Home page
├── components/                   # Shared components
│   ├── Analysis/
│   │   └── ValuationCard.tsx     # ✅ Used
│   ├── Listing/
│   │   └── ImageGallery.tsx      # ✅ Used
│   ├── Map/
│   │   ├── JFinderMap.tsx        # ⚠️ Unused (Google Maps)
│   │   ├── mapStyles.ts          # ⚠️ Unused (for JFinderMap)
│   │   └── RentalHeatmap.tsx     # ✅ Used (Leaflet)
│   └── FallbackImage.tsx         # ✅ Used
├── data/                         # Empty folder
├── docs/
│   ├── ARCHITECTURE.md           # ⚠️ Outdated (references Postgres)
│   ├── AUDIT.md                  # ⚠️ Outdated
│   ├── RUNBOOK.md                # ⚠️ Outdated
│   └── TESTING.md                # ⚠️ Outdated
├── lib/
│   ├── api.ts                    # ✅ Main API client
│   └── districts.ts              # ✅ District/province data
├── n8n/
│   ├── 0-init-schema.json        # ❌ DELETE - Postgres schema
│   ├── 1-import-data.json        # ❌ DELETE - Postgres import
│   ├── ALL_APIS_workflow.json    # ❌ DELETE - Uses Postgres
│   └── JFinder_API_NoPostgres.json # ✅ KEEP - File-based API
├── reports/
│   ├── api_compat_test.md
│   ├── fe_api_contract.md
│   ├── geo_qc_report.json
│   ├── geo_qc_report.md
│   └── system_audit.md
├── scripts/
│   ├── geo_normalize.py          # ✅ KEEP - Geo normalization
│   ├── import_to_postgres.py     # ✅ KEEP - For Superset data
│   ├── import_to_superset.py     # ⚠️ DELETE - Failed, not needed
│   ├── requirements.txt          # ✅ KEEP
│   ├── test_api.ts               # ✅ KEEP - API tests
│   └── upload_to_superset_manual.md # ⚠️ DELETE - Not needed now
├── docker-compose.yml            # ✅ Main deployment
├── Dockerfile.superset           # ⚠️ DELETE - Not used (build failed)
├── jfinder_data.db               # ✅ SQLite for Superset
├── superset_config.py            # ✅ Superset config
├── setup_n8n.py                  # ⚠️ DELETE - Not referenced
├── test-apis.bat                 # ⚠️ DELETE - Not referenced
├── .env.example
├── .env.local
├── package.json
├── README.md
├── SETUP.md                      # ⚠️ Consolidate into README
├── STATUS.md                     # ⚠️ DELETE - Outdated
├── SYSTEM_OVERVIEW.md            # ⚠️ Consolidate into README
└── tsconfig.json
```

## 2. Services Inventory

| Service  | Image                  | Port | Purpose                          | Status  |
| -------- | ---------------------- | ---- | -------------------------------- | ------- |
| postgres | postgis/postgis:15-3.3 | 5433 | Superset metadata + JFinder data | ✅ Keep |
| n8n      | n8nio/n8n:latest       | 5678 | API Backend (file-based)         | ✅ Keep |
| superset | apache/superset:latest | 8088 | BI Dashboard                     | ✅ Keep |
| redis    | redis:7-alpine         | -    | Superset cache                   | ✅ Keep |

**Note:** PostgreSQL is only used for:

1. Superset internal metadata
2. JFinder listings data (via `import_to_postgres.py`)

n8n workflows now use JSON file (`app/data/vn_rental_3cities_verified.json`), NOT Postgres queries.

## 3. n8n Workflows

| File                          | Purpose                                  | Status               |
| ----------------------------- | ---------------------------------------- | -------------------- |
| `JFinder_API_NoPostgres.json` | Search, ROI, Valuation APIs (file-based) | ✅ **ACTIVE**        |
| `0-init-schema.json`          | Postgres table creation                  | ❌ DELETE (not used) |
| `1-import-data.json`          | Postgres data import                     | ❌ DELETE (not used) |
| `ALL_APIS_workflow.json`      | Old Postgres-based APIs                  | ❌ DELETE (replaced) |

## 4. FE Routes

| Route           | Page File               | Purpose         | API Dependencies            |
| --------------- | ----------------------- | --------------- | --------------------------- |
| `/`             | `page.tsx`              | Home            | None                        |
| `/search`       | `search/page.tsx`       | Search listings | n8n: `/search`              |
| `/listing/[id]` | `listing/[id]/page.tsx` | Listing detail  | FE: `/api/listing/[id]`     |
| `/analysis`     | `analysis/page.tsx`     | ROI + Valuation | n8n: `/roi`, `/valuation`   |
| `/landlord`     | `landlord/page.tsx`     | Landlord tools  | n8n: `/valuation`, `/stats` |
| `/dashboard`    | `dashboard/page.tsx`    | Stats dashboard | lib: `fetchStatsLegacy()`   |
| `/bi-dashboard` | `bi-dashboard/page.tsx` | Superset embed  | Superset iframe             |

## 5. API Endpoints

### n8n Webhooks (port 5678)

| Endpoint             | Method | Purpose                      |
| -------------------- | ------ | ---------------------------- |
| `/webhook/search`    | GET    | Search listings with filters |
| `/webhook/stats`     | GET    | District/ward statistics     |
| `/webhook/roi`       | POST   | ROI calculation              |
| `/webhook/valuation` | POST   | Property valuation           |

### Next.js API Routes (port 3000) - Fallback

| Endpoint            | Method | Purpose                      |
| ------------------- | ------ | ---------------------------- |
| `/api/listing/[id]` | GET    | Single listing detail        |
| `/api/roi`          | POST   | ROI calculation fallback     |
| `/api/valuation`    | POST   | Valuation fallback           |
| `/api/export`       | GET    | CSV/JSON export for Superset |

## 6. Data Files

| File                                       | Records | Purpose               | Status         |
| ------------------------------------------ | ------- | --------------------- | -------------- |
| `app/data/vn_rental_3cities_verified.json` | 1170    | Verified geo data     | ✅ **PRIMARY** |
| `app/data/vn_rental_3cities_verified.csv`  | 1170    | CSV version           | ✅ Keep        |
| `app/data/vn_rental_3cities.json`          | 2500    | Original (unverified) | ⚠️ DELETE      |
| `app/data/vn_rental_3cities.csv`           | 2500    | Original CSV          | ⚠️ DELETE      |
| `jfinder_data.db`                          | 1170    | SQLite for Superset   | ✅ Keep        |

## 7. Dependencies Analysis

### package.json - Used

- `next`, `react`, `react-dom` - Framework
- `leaflet`, `react-leaflet` - Map (RentalHeatmap)
- `lucide-react` - Icons
- `recharts` - Charts (dashboard)

### package.json - Potentially Unused

- `mapbox-gl` - Not used (JFinderMap uses Google Maps which isn't imported)
- `@react-google-maps/api` - Not in package.json but imported in JFinderMap

## 8. Summary: Files to Delete

### Safe Delete (0 references)

- `app/components/LeafletMap.tsx` - Not imported anywhere
- `components/Map/JFinderMap.tsx` - Not imported (uses @react-google-maps not installed)
- `components/Map/mapStyles.ts` - Only used by JFinderMap
- `n8n/0-init-schema.json` - Postgres workflow, not needed
- `n8n/1-import-data.json` - Postgres workflow, not needed
- `n8n/ALL_APIS_workflow.json` - Replaced by NoPostgres version
- `scripts/import_to_superset.py` - Failed, used manual method instead
- `scripts/upload_to_superset_manual.md` - Guide no longer needed
- `Dockerfile.superset` - Build failed, using base image
- `setup_n8n.py` - Not referenced anywhere
- `test-apis.bat` - Not referenced anywhere
- `data/` (root) - Empty folder
- `app/data/vn_rental_3cities.json` - Unverified data
- `app/data/vn_rental_3cities.csv` - Unverified data

### Maybe Delete (only in docs)

- `STATUS.md` - Outdated status report
- `SETUP.md` - Should consolidate into README
- `SYSTEM_OVERVIEW.md` - Should consolidate into README

### Keep

- All active pages in `app/`
- `lib/api.ts`, `lib/districts.ts`
- `components/FallbackImage.tsx`
- `components/Listing/ImageGallery.tsx`
- `components/Analysis/ValuationCard.tsx`
- `components/Map/RentalHeatmap.tsx`
- `n8n/JFinder_API_NoPostgres.json`
- `scripts/geo_normalize.py`, `import_to_postgres.py`, `test_api.ts`
- `reports/*`
- `docs/*` (update content)
