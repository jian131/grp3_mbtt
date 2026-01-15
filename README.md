# JFinder - Low-Code Rental Decision Support System

A simplified real estate analytics platform using **n8n** (backend/ETL) and **Apache Superset** (BI dashboards).

## 🚀 Quick Start

### 1. Setup Environment
```bash
cp .env.example .env
# Edit .env if needed (default values work for local dev)
```

### 2. Start Docker Stack
```bash
docker compose up -d
```

Wait ~30 seconds for all services to initialize. Check status:
```bash
docker compose ps
```

### 3. Initialize Database Schema
1. Open **n8n**: http://localhost:5678
2. Go to **Workflows** → **Import from File**
3. Import `n8n/0-init-schema.json`
4. Create **Postgres Credential**:
   - Host: `postgres`
   - Port: `5432`
   - Database: `jfinder_db`
   - User: `jfinder`
   - Password: `jfinder_password`
5. **Execute** the workflow (creates tables & indexes)

### 4. Import Data
1. Import `n8n/1-import-data.json`
2. Link to your Postgres credential
3. **Execute** workflow → 2500 listings imported

### 5. Enable API Endpoints
Import and **Activate** (toggle ON):
- `n8n/search_api_workflow.json` → `/webhook/search`
- `n8n/listing_api_workflow.json` → `/webhook/listing/:id`
- `n8n/stats_api_workflow.json` → `/webhook/stats`

### 6. Access Superset
- URL: http://localhost:8088
- Login: `admin` / `admin123`

---

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/webhook/search` | GET | Search listings with filters |
| `/webhook/listing/:id` | GET | Get single listing details |
| `/webhook/stats` | GET | District-level statistics |

### Search Parameters
```
?city=Hanoi
?district=Ba Dinh
?maxPrice=50
?minArea=100
?limit=20
```

### Example
```bash
curl "http://localhost:5678/webhook/search?city=Hanoi&limit=5"
```

---

## 🏗 Architecture

```
┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│    n8n      │
│  (Next.js)  │     │ (API/ETL)   │
└─────────────┘     └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  PostgreSQL │
                    │  (PostGIS)  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Superset   │
                    │    (BI)     │
                    └─────────────┘
```

### Services
| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL | 5433 | Data store (PostGIS enabled) |
| n8n | 5678 | Backend API + ETL automation |
| Superset | 8088 | BI dashboards |
| Redis | 6379 | Superset cache |

---

## 📁 Project Structure

```
├── app/                  # Next.js frontend
│   ├── data/            # Raw data files (listings.json)
│   └── search/          # Search page
├── n8n/                  # n8n workflow definitions
│   ├── 0-init-schema.json    # DB initialization
│   ├── 1-import-data.json    # Data import
│   ├── search_api_workflow.json
│   ├── listing_api_workflow.json
│   └── stats_api_workflow.json
├── docs/                 # Documentation
│   ├── ARCHITECTURE.md
│   └── TESTING.md
├── docker-compose.yml    # Docker services
└── .env.example          # Environment template
```

---

## 🧪 Testing

See [docs/TESTING.md](docs/TESTING.md) for complete test plan.

Quick API test:
```bash
curl http://localhost:5678/webhook/search?limit=1 | jq
```

---

## 🔧 Development

### Frontend
```bash
npm install
npm run dev
# Open http://localhost:3000
```

### Database Reset
```bash
docker compose down -v
docker compose up -d
# Re-run n8n workflows
```

---

## 📊 Dataset

- **Source**: Vietnam rental listings (3 cities)
- **Records**: 2,500 properties
- **Cities**: Hà Nội, Đà Nẵng, TP.HCM
- **Fields**: title, city, district, ward, price, area, lat/lon, type, views, savedCount

---

## 📝 License

MIT
