# 🏗️ JFinder Architecture

**Version:** 4.0 (File-based)
**Updated:** 2026-01-16

## Overview

JFinder uses a **pure file-based backend** architecture with minimal infrastructure dependencies:

- **n8n** - API backend reading JSON files (no database queries)
- **Apache Superset** - BI dashboards with PostgreSQL backend
- **Next.js** - Frontend application
- **PostgreSQL** - Used only by Superset for metadata + data warehouse

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│              Browser (User)                             │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│          Next.js Frontend (Port 3000)                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Pages:                                            │  │
│  │ • / (Home)                                        │  │
│  │ • /search (Search + Filters)                      │  │
│  │ • /listing/[id] (Detail)                          │  │
│  │ • /analysis (ROI + Valuation)                     │  │
│  │ • /landlord (Landlord Tools)                      │  │
│  │ • /dashboard (Stats)                              │  │
│  │ • /bi-dashboard (Superset Embed)                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  API Client: lib/api.ts                                 │
│  - fetchListings()                                      │
│  - fetchListing(id)                                     │
│  - calculateROI()                                       │
│  - getValuation()                                       │
└───────────┬──────────────────────────────────────────────┘
            │
            ├─────────────┬───────────────┐
            ▼             ▼               ▼
┌──────────────────┐ ┌─────────┐ ┌────────────────┐
│ n8n Webhooks     │ │FE APIs  │ │   Superset     │
│   Port 5678      │ │Port 3000│ │   Port 8088    │
├──────────────────┤ └─────────┘ └────────────────┘
│/webhook/search   │                     │
│/webhook/stats    │                     │
│/webhook/roi      │           ┌─────────▼─────────┐
│/webhook/valuation│           │    PostgreSQL     │
└────────┬─────────┘           │    Port 5433      │
         │                     │                   │
         │                     │ Tables:           │
         ▼                     │ • jfinder_listings│
┌──────────────────┐           │ (1170 records)    │
│  JSON File       │           └───────────────────┘
│  (Mounted Volume)│
├──────────────────┤
│ vn_rental_       │
│ 3cities_         │
│ verified.json    │
│                  │
│ 1170 records     │
└──────────────────┘
```

---

## Design Principles

### ✅ What We Use

| Component          | Purpose          | Rationale                                             |
| ------------------ | ---------------- | ----------------------------------------------------- |
| **n8n**            | API backend      | Visual workflow editor, no code deployment            |
| **JSON Files**     | Data source      | Simple, version-controllable, no database overhead    |
| **Superset**       | BI dashboards    | Powerful visualization, SQL-based analytics           |
| **PostgreSQL**     | Superset storage | Required by Superset, also stores listing data for BI |
| **Next.js**        | Frontend         | React framework with SSR/SSG                          |
| **Docker Compose** | Orchestration    | Single-command deployment                             |

### ❌ What We Don't Use

| Excluded                | Reason                                       |
| ----------------------- | -------------------------------------------- |
| AI/ML Models            | Pre-calculated fields in dataset             |
| Vector Databases        | No similarity search needed                  |
| Node.js API Server      | n8n handles all API logic                    |
| Manual SQL Scripts      | Schema created via n8n workflow (deprecated) |
| Database Queries in n8n | File-based reads only                        |

---

## Data Flow

### Primary Flow: File-based API

```
User Request
    ↓
Next.js Page
    ↓
lib/api.ts → HTTP Request
    ↓
n8n Webhook
    ↓
Read File Node → /data/vn_rental_3cities_verified.json
    ↓
Filter/Transform (JavaScript Code Nodes)
    ↓
Return JSON Response
    ↓
Next.js renders UI
```

### Secondary Flow: Superset Analytics

```
Import Script (scripts/import_to_postgres.py)
    ↓
Read JSON File
    ↓
Insert to PostgreSQL (jfinder_listings table)
    ↓
Superset connects to PostgreSQL
    ↓
Create Charts & Dashboards
    ↓
Embed in /bi-dashboard via iframe
```

---

## n8n Workflows

| Workflow                      | Type   | Endpoints                                                                       | Data Source |
| ----------------------------- | ------ | ------------------------------------------------------------------------------- | ----------- |
| `JFinder_API_NoPostgres.json` | Active | `/webhook/search`<br>`/webhook/stats`<br>`/webhook/roi`<br>`/webhook/valuation` | JSON File   |

**Deprecated Workflows (removed in cleanup):**

- `0-init-schema.json` - Database schema creation
- `1-import-data.json` - Database import
- `ALL_APIS_workflow.json` - Old PostgreSQL-based API

### Workflow Design

All workflows follow this pattern:

1. **Webhook Trigger** - Listen for HTTP request
2. **Read File** - Load `/data/vn_rental_3cities_verified.json`
3. **Filter** - JavaScript code node applies filters
4. **Transform** - Map fields, calculate derived values
5. **Respond** - Return JSON with consistent format

**No database queries are executed in n8n workflows.**

---

## Database Schema (PostgreSQL)

Used **only by Superset** for BI analytics. Not queried by n8n.

### Table: `jfinder_listings`

```sql
CREATE TABLE jfinder_listings (
    id TEXT PRIMARY KEY,                    -- VN26000001
    name TEXT,
    address TEXT,
    province TEXT,
    district TEXT,
    ward TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    type TEXT,                              -- streetfront/shophouse/office/kiosk
    market_segment TEXT,                    -- street_retail/shopping_mall/office
    area DOUBLE PRECISION,
    frontage DOUBLE PRECISION,
    floors INTEGER,
    price DOUBLE PRECISION,                 -- Monthly rent in million VND
    rent_per_sqm_million DOUBLE PRECISION,
    views INTEGER,
    saved_count INTEGER,
    ai_suggested_price DOUBLE PRECISION,
    ai_potential_score DOUBLE PRECISION,
    ai_risk_level TEXT,                     -- Low/Medium/High
    posted_at TIMESTAMP,
    primary_image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Note:** PostGIS extension available but not actively used.

---

## API Design

### Response Format

All n8n webhooks return:

```typescript
{
  success: boolean;
  data: any;          // Array or object
  count?: number;     // For paginated responses
  total?: number;     // Total records
  limit?: number;
  offset?: number;
}
```

### Error Handling

```typescript
{
  success: false;
  error: string;
  code?: string;
}
```

### Frontend Fallback APIs

Next.js API routes (`/app/api/*`) provide fallback functionality:

- Same logic as n8n but runs in Next.js server
- Used if n8n is down or for server-side rendering
- Reads the same JSON file

---

## Intelligence Features

All "AI" features are **rule-based calculations**, not machine learning:

| Feature             | Implementation                                            |
| ------------------- | --------------------------------------------------------- |
| **Price Label**     | Compare actual price to `ai_suggested_price` (ratio)      |
| **Valuation**       | Percentile calculation (P25/P50/P75) + adjustment factors |
| **ROI Calculator**  | Break-even formula: `cost / (revenue - expenses)`         |
| **Potential Score** | Pre-calculated in dataset (0-100)                         |
| **Risk Level**      | Pre-calculated in dataset (Low/Medium/High)               |

---

## Component Architecture

### Frontend Components

```
components/
├── Analysis/
│   └── ValuationCard.tsx      # Display valuation results
├── Listing/
│   └── ImageGallery.tsx       # Image carousel with fallback
├── Map/
│   └── RentalHeatmap.tsx      # Leaflet map with markers
└── FallbackImage.tsx          # Broken image handler
```

### Lib Functions

```typescript
// lib/api.ts
export interface Listing { ... }
export function fetchListings(filters: SearchParams): Promise<Listing[]>
export function fetchListing(id: string): Promise<Listing>
export function calculateROI(params: ROIInput): Promise<ROIResult>
export function getValuation(params: ValuationInput): Promise<ValuationResult>
```

### Data Transformation

```typescript
function transformListing(raw: any): Listing {
  // Parse JSON strings (images, owner)
  // Add compatibility aliases (lat/lon, area, price)
  // Calculate derived fields (pricePerM2, priceLabel)
  // Return typed Listing object
}
```

---

## Deployment

### Local Development

```bash
# 1. Start services
docker compose up -d

# 2. Start frontend
npm run dev

# 3. Access
# - Frontend: http://localhost:3000
# - n8n: http://localhost:5678
# - Superset: http://localhost:8088
```

### Production

1. Update environment variables in `.env.production`
2. Build frontend: `npm run build`
3. Start frontend: `npm start`
4. Ensure n8n workflows are active
5. Configure reverse proxy (nginx) for ports 3000, 5678, 8088

### Docker Compose Services

| Service  | Container              | Port | Restart Policy |
| -------- | ---------------------- | ---- | -------------- |
| postgres | postgis/postgis:15-3.3 | 5433 | always         |
| n8n      | n8nio/n8n:latest       | 5678 | always         |
| superset | apache/superset:latest | 8088 | always         |
| redis    | redis:7-alpine         | -    | always         |

---

## Performance Considerations

### File-based Reads

- **Pros:** Simple, no database overhead, version control
- **Cons:** Not suitable for >10k records
- **Mitigation:** Cache JSON in memory (n8n), pagination

### Pagination

Implemented client-side in n8n workflows:

- Load all data (1170 records ~2MB)
- Filter in JavaScript
- Slice array for pagination
- Return paginated results

For production scale (>10k records), consider:

- Database queries with indexes
- Caching layer (Redis)

### Superset Performance

- PostgreSQL with 1170 records: <50ms queries
- Charts render in <1s
- Dashboard loads in <3s

---

## Security

### CORS

- n8n webhooks: Allow all origins (development only)
- Production: Configure specific origins

### Authentication

- Frontend: No authentication (public demo)
- n8n: Basic auth (set on first visit)
- Superset: Username/password (admin/admin)

### Data Privacy

- No personal data in dataset
- Phone numbers in `owner` field are synthetic

---

## Monitoring

### Health Checks

```bash
# n8n
curl http://localhost:5678/healthz

# PostgreSQL
docker exec -it grp3_mbtt-postgres-1 pg_isready

# Superset
curl http://localhost:8088/health
```

### Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f n8n
```

---

## Future Considerations

### Scaling

- Move to database queries when dataset grows
- Add Redis caching layer
- Implement proper pagination server-side

### Features

- Real-time updates via WebSocket
- User authentication & favorites
- Notifications for price changes

### Infrastructure

- Kubernetes deployment
- Load balancer for n8n
- CDN for static assets

---

For operational procedures, see [RUNBOOK.md](RUNBOOK.md)
