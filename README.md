# JFinder - Rental Property Intelligence Platform

**3-City Verified Dataset | n8n Backend | Apache Superset BI**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Coverage](https://img.shields.io/badge/tests-9%2F9-brightgreen)]()
[![Stack](https://img.shields.io/badge/stack-Next.js%20%7C%20n8n%20%7C%20Superset-blue)]()

## 📊 Quick Stats

- **1,170** verified rental listings across 3 cities (Hà Nội, Hồ Chí Minh, Đà Nẵng)
- **100%** geo-verified coordinates
- **9/9** smoke tests passed
- **Zero** database queries in n8n workflows (file-based)

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+
- Python 3.8+ (for data scripts)

### 1. Start Services

```bash
# Start all services (postgres, n8n, superset, redis)
docker compose up -d

# Wait for services to be ready (~30s)
docker compose ps
```

### 2. Start Frontend

```bash
npm install
npm run dev
```

### 3. Access Applications

| Service  | URL                   | Credentials        |
| -------- | --------------------- | ------------------ |
| Frontend | http://localhost:3000 | -                  |
| n8n      | http://localhost:5678 | Set on first visit |
| Superset | http://localhost:8088 | admin / admin      |

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                       │
│                      Port 3000                              │
├────────────────────────────────────────────────────────────┤
│  Routes:                                                    │
│  /              → Home                                      │
│  /search        → Search + Filter                           │
│  /listing/[id]  → Detail page                               │
│  /analysis      → ROI + Valuation                           │
│  /landlord      → Landlord tools                            │
│  /dashboard     → Stats dashboard                           │
│  /bi-dashboard  → Superset embed                            │
└───────────────────┬────────────────────────────────────────┘
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
┌──────────────────┐   ┌──────────────────┐
│   n8n Backend    │   │  Next.js API     │
│    Port 5678     │   │  (Fallback)      │
├──────────────────┤   └──────────────────┘
│  /webhook/search │
│  /webhook/stats  │   Data Source:
│  /webhook/roi    │   vn_rental_3cities_verified.json
│  /webhook/val    │   (1170 records)
└──────────────────┘

┌──────────────────────────────────────────────────────────┐
│                 Apache Superset BI                        │
│                    Port 8088                              │
├──────────────────────────────────────────────────────────┤
│  Data: PostgreSQL (jfinder_listings table)               │
│  Charts: Bar, Pie, Big Number                             │
└──────────────────────────────────────────────────────────┘
```

### Key Design Decisions

✅ **File-based n8n workflows** - No SQL queries, reads JSON directly
✅ **Geo-verified dataset** - 100% coordinate accuracy via GADM
✅ **Superset for BI** - PostgreSQL backend for complex analytics
✅ **Zero dead code** - 15 unused files removed, all imports verified

---

## 📂 Project Structure

```
grp3_mbtt/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes (fallback)
│   │   ├── listing/[id]/     # Listing detail
│   │   ├── roi/              # ROI calculation
│   │   └── valuation/        # Property valuation
│   ├── data/                 # Verified dataset (1170 records)
│   │   └── vn_rental_3cities_verified.json
│   ├── search/               # Search page
│   ├── listing/[id]/         # Detail page
│   ├── analysis/             # ROI + Valuation page
│   ├── landlord/             # Landlord tools
│   ├── dashboard/            # Stats dashboard
│   └── bi-dashboard/         # Superset iframe
├── components/               # Shared components
│   ├── Analysis/             # ValuationCard
│   ├── Listing/              # ImageGallery
│   ├── Map/                  # RentalHeatmap (Leaflet)
│   └── FallbackImage.tsx     # Image error handling
├── lib/
│   ├── api.ts                # API client functions
│   └── districts.ts          # Province/district data
├── n8n/
│   └── JFinder_API_NoPostgres.json  # Active workflow
├── scripts/
│   ├── geo_normalize.py      # Geo verification
│   ├── import_to_postgres.py # Superset data import
│   └── smoke_test.py         # System tests
├── reports/                  # Audit & test reports
│   ├── repo_inventory.md
│   ├── system_flow.md
│   ├── api_contract.md
│   ├── logic_audit.md
│   ├── cleanup_plan.md
│   └── test_results.md
└── docker-compose.yml        # Service orchestration
```

---

## 🔧 Configuration

### Environment Variables

Create `.env.local`:

```bash
# Backend API URL (n8n webhook)
NEXT_PUBLIC_API_BASE_URL=http://localhost:5678/webhook

# Superset Configuration
NEXT_PUBLIC_SUPERSET_URL=http://localhost:8088
NEXT_PUBLIC_BI_MODE=link          # 'link' (default) or 'iframe'
NEXT_PUBLIC_SUPERSET_DASHBOARD_PATH=/superset/dashboard/1/

# Feature Flags
NEXT_PUBLIC_ENABLE_HEALTH_CHECK=true

# Optional: Mapbox for enhanced maps
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here
```

### Docker Services

| Service  | Image                  | Port | Purpose                          |
| -------- | ---------------------- | ---- | -------------------------------- |
| postgres | postgis/postgis:15-3.3 | 5433 | Superset metadata + JFinder data |
| n8n      | n8nio/n8n:latest       | 5678 | API backend (file-based)         |
| superset | apache/superset:latest | 8088 | BI dashboards                    |
| redis    | redis:7-alpine         | -    | Superset cache                   |

---

## 🚀 Vercel Deployment

### Quick Deploy

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com/new)
3. Set environment variables:
   - `NEXT_PUBLIC_API_BASE_URL` = Your ngrok/tunnel URL + `/webhook`
   - `NEXT_PUBLIC_BI_MODE` = `link`
4. Deploy!

### Backend for Demo

Since n8n runs locally, expose it via tunnel:

```bash
# Install ngrok
ngrok http 5678

# Use the HTTPS URL
# https://abc123.ngrok.io/webhook
```

📖 See [docs/vercel_deploy.md](docs/vercel_deploy.md) for full guide.

---

## 📡 API Reference

### n8n Webhooks (Port 5678)

#### Search Listings

```http
GET /webhook/search?province=Hà Nội&limit=10
```

**Response:**

```json
{
  "success": true,
  "data": [...],
  "count": 10,
  "total": 1170
}
```

#### Calculate ROI

```http
POST /webhook/roi
Content-Type: application/json

{
  "monthlyRent": 20,
  "productPrice": 50000,
  "profitMargin": 0.3,
  "dailyCustomers": 100
}
```

#### Property Valuation

```http
POST /webhook/valuation
Content-Type: application/json

{
  "district": "Quận 1",
  "city": "Thành phố Hồ Chí Minh",
  "area": 50
}
```

### Next.js API Routes (Port 3000)

- `GET /api/listing/[id]` - Single listing detail
- `POST /api/roi` - ROI calculation (fallback)
- `POST /api/valuation` - Valuation (fallback)
- `GET /api/export` - CSV/JSON export

📖 **Full API documentation:** [reports/api_contract.md](reports/api_contract.md)

---

## 🧪 Testing

### Run Smoke Tests

```bash
python scripts/smoke_test.py
```

**Test Coverage:**

- ✅ Data file integrity (1170 records)
- ✅ No broken imports
- ✅ n8n health check
- ✅ Search API
- ✅ Search filters
- ✅ Frontend home
- ✅ Listing detail API
- ✅ ROI calculation
- ✅ Valuation API

**Latest Results:** [reports/test_results.md](reports/test_results.md)

### Build Verification

```bash
npm run build
```

All routes compile successfully after cleanup.

---

## 📊 Data

### Dataset: vn_rental_3cities_verified.json

- **Total Records:** 1,170
- **Cities:** Hà Nội (490), Hồ Chí Minh (580), Đà Nẵng (100)
- **Geo Verification:** 100% (GADM point-in-polygon)
- **Fields:** 35+ attributes including:
  - Location: lat/lng, province, district, ward
  - Property: type, area, frontage, floors
  - Pricing: price, rent_per_sqm
  - AI: suggested_price, potential_score, risk_level
  - Amenities: schools, offices, competitors

### Data Processing

```bash
# Geo-normalize dataset (already done)
python scripts/geo_normalize.py

# Import to PostgreSQL for Superset
python scripts/import_to_postgres.py
```

---

## 🚢 Deployment

### Development

```bash
docker compose up -d
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

### Environment

- Development: http://localhost:3000
- Production: Configure domain in `.env.production`

---

## 📚 Documentation

| Document                                               | Description                     |
| ------------------------------------------------------ | ------------------------------- |
| [docs/vercel_deploy.md](docs/vercel_deploy.md)         | Vercel deployment guide         |
| [docs/bi_superset.md](docs/bi_superset.md)             | BI Dashboard setup              |
| [reports/repo_inventory.md](reports/repo_inventory.md) | Directory tree, services, files |
| [reports/system_flow.md](reports/system_flow.md)       | Architecture & data flow        |
| [reports/api_contract.md](reports/api_contract.md)     | API endpoints & schemas         |
| [reports/logic_audit.md](reports/logic_audit.md)       | Code audit & bug fixes          |
| [reports/cleanup_plan.md](reports/cleanup_plan.md)     | Removed files & rationale       |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)           | Technical architecture          |
| [docs/RUNBOOK.md](docs/RUNBOOK.md)                     | Operations guide                |

---

## 🐛 Known Issues & Fixes

### Fixed in Latest Version

✅ **Valuation district filter** - Case-sensitive comparison fixed
✅ **Image fallbacks** - FallbackImage component handles broken URLs
✅ **Geo-location mismatches** - Dataset re-verified with GADM
✅ **AI data display** - Handles `ai_potential_score = 0` correctly
✅ **BI Dashboard** - Link/Iframe mode with fallback
✅ **Backend offline** - Banner shows when n8n unavailable
✅ **Vercel deployment** - API proxy for CORS bypass

### Superset Iframe Embedding

⚠️ **Status:** X-Frame-Options may block iframe in some browsers

**Solution:** Use Link Mode (default) - opens Superset in new tab

**Alternative:** Configure Superset to allow embedding (see [docs/bi_superset.md](docs/bi_superset.md))

---

## 🤝 Contributing

### Code Quality

- All TypeScript with strict mode
- ESLint + Prettier configured
- Build must pass before commit

### Adding Features

1. Update types in `lib/api.ts`
2. Add API route or n8n workflow
3. Create UI component
4. Add smoke test
5. Update documentation

---

## 📄 License

MIT License - See LICENSE file

---

## 🎯 Roadmap

- [ ] Real-time data updates via WebSocket
- [ ] User authentication
- [ ] Favorite listings
- [ ] Email alerts for price changes
- [ ] Mobile app (React Native)
- [ ] Expand to more cities

---

## 📞 Support

- **Issues:** GitHub Issues
- **Documentation:** `/reports/` and `/docs/`
- **API Contract:** [reports/api_contract.md](reports/api_contract.md)

---

**Built with ❤️ using Next.js 16, n8n, Apache Superset**
