# 🏗️ JFinder Architecture

## Overview

Pure **Low-Code/No-Code** architecture theo yêu cầu đề cương:

- **n8n**: Backend API + ETL orchestration (duy nhất)
- **Apache Superset**: BI dashboards (duy nhất)
- **PostgreSQL + PostGIS**: Data storage
- **Next.js**: Frontend consumer

---

## Design Principles

### ✅ What We Use

| Component | Purpose | Why |
|-----------|---------|-----|
| n8n | All backend logic | Low-code, visual workflows |
| Superset | All visualizations | No-code dashboards |
| PostgreSQL | Data persistence | Reliable, supports PostGIS |
| Docker Compose | Deployment | Single command startup |

### ❌ What We Don't Use

| Excluded | Reason |
|----------|--------|
| Vision AI / Visual Search | Not in simplified scope |
| Vector DBs (Milvus/Qdrant) | Not needed |
| OCR / Legal AI | Not needed |
| LLM integration | AI = rule-based only |
| Node/Express API | n8n replaces this |
| Manual SQL files | Schema via n8n workflow |

---

## Data Flow

```
[JSON Dataset]
      │
      ▼ (HTTP Request from n8n)
┌─────────────────┐
│ n8n Import      │ ◄─── 1-import-data.json
│ Workflow        │
└────────┬────────┘
         │ INSERT with transform
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   (PostGIS)     │
│   - listings    │
│   - views       │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐  ┌─────────┐
│ n8n   │  │Superset │
│ API   │  │Dashboard│
└───┬───┘  └─────────┘
    │ JSON Response
    ▼
┌─────────────┐
│  Frontend   │
│  (Next.js)  │
└─────────────┘
```

---

## n8n Workflows

| File | Type | Endpoint | Purpose |
|------|------|----------|---------|
| `0-init-schema.json` | Setup | (manual) | Creates tables, indexes, views |
| `1-import-data.json` | ETL | (manual) | Imports 1170 listings from JSON |
| `search_api_workflow.json` | API | GET /webhook/search | Search with filters + radius |
| `listing_api_workflow.json` | API | GET /webhook/listing/:id | Listing detail |
| `stats_api_workflow.json` | API | GET /webhook/stats | District/ward statistics |
| `roi_api_workflow.json` | API | POST /webhook/roi | ROI calculation |
| `valuation_api_workflow.json` | API | POST /webhook/valuation | Price valuation |

---

## Database Schema

Created via n8n workflow `0-init-schema.json` (no SQL files in repo):

```
listings
├── id (TEXT PK)                  -- VN26000001 format
├── name, address (TEXT)
├── province, district, ward (TEXT)
├── admin_codes (JSONB)           -- {"level1_id", "level2_id", "level3_id"}
├── latitude, longitude (DOUBLE)
├── geom (GEOMETRY POINT 4326)    -- PostGIS point
├── type (TEXT)                   -- streetfront/shophouse/kiosk/office
├── market_segment (TEXT)         -- street_retail/shopping_mall/office
├── area_m2, frontage_m (NUMERIC)
├── floors (INTEGER)
├── price_million (NUMERIC)       -- Monthly rent in million VND
├── rent_per_sqm_million (NUMERIC)
├── views, saved_count (INTEGER)
├── owner (JSONB)                 -- {"name", "phone"}
├── primary_image_url (TEXT)
├── ai_suggested_price (NUMERIC)  -- Pre-calculated valuation
├── ai_potential_score (NUMERIC)
├── ai_risk_level (TEXT)
├── posted_at (TIMESTAMP)
├── created_at (TIMESTAMP)
└── raw_data (JSONB)              -- Full original record

Indexes:
├── idx_listings_geom (GIST)
├── idx_listings_province
├── idx_listings_district
├── idx_listings_ward
├── idx_listings_type
├── idx_listings_price
└── idx_listings_segment

Views:
├── view_ward_stats              -- Percentile stats by ward+type
└── view_district_stats          -- Percentile stats by district
```

---

## AI/Intelligence Features

| Feature | Implementation | Not ML |
|---------|---------------|--------|
| Price Valuation | Percentile (p25/p50/p75) + adjustment factors | Rule-based |
| Price Label | Compare to ai_suggested_price (ratio) | Simple math |
| ROI Calculator | Break-even formula | Calculations |
| Radius Search | Haversine formula in n8n Code node | Math formula |
| Risk Level | Pre-calculated in dataset | Static field |

---

## API Design

All endpoints are n8n webhooks with consistent response format:

```json
{
  "success": true,
  "data": [...],
  "count": 50
}
```

### Search Features

1. **Multi-filter**: city, district, ward, type, segment, price range, area range
2. **Radius Search**: Haversine formula calculates distance
3. **Price Labels**: cheap/fair/expensive based on ratio to ai_suggested_price
4. **Pagination**: limit/offset params

---

## Security Considerations

| Aspect | Current | Production |
|--------|---------|------------|
| Webhook Auth | None (localhost) | Add n8n auth tokens |
| CORS | Allow all | Restrict to frontend domain |
| Secrets | In .env | Use Docker secrets |
| PostgreSQL | Internal network | No external exposure |
| Superset | Basic auth | SSO integration |

---

## Scaling Notes

For production deployment:

1. **Add nginx reverse proxy** - Rate limiting, SSL
2. **Enable n8n webhook auth** - Token-based
3. **Use managed PostgreSQL** - RDS/Cloud SQL
4. **Deploy n8n to cloud** - Self-hosted or n8n.cloud
5. **Superset behind auth** - LDAP/OAuth

---

## File Organization

```
grp3_mbtt/
├── app/                       # Next.js app
│   ├── data/                  # Datasets (JSON/CSV)
│   ├── search/page.tsx        # Search feature
│   ├── analysis/page.tsx      # AI analysis
│   └── ...
├── components/
│   ├── Map/                   # Leaflet components
│   └── Analysis/              # Valuation UI
├── lib/
│   └── api.ts                 # Type-safe API client
├── n8n/                       # Workflow definitions
│   └── *.json
├── docs/                      # Documentation
├── docker-compose.yml
└── .env.example
```

---

**Last updated:** 2026-01-15
