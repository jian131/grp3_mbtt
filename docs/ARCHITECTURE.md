# JFinder Architecture

## Overview
Pure **Low-Code/No-Code** architecture using only:
- **n8n**: Backend API + ETL orchestration
- **Apache Superset**: BI dashboards
- **PostgreSQL + PostGIS**: Data storage

## Design Principles

### ✅ What We Use
- n8n workflows for all backend logic
- Superset for all visualizations
- PostgreSQL for data persistence
- Docker Compose for deployment

### ❌ What We Don't Use
- Manual SQL scripts (schema via n8n)
- Python/Node backend services
- AI/ML/Vision models
- Vector databases
- Custom API servers

## Data Flow

```
[JSON/CSV Data]
      │
      ▼
┌─────────────────┐
│ n8n Import      │ ◄─── 1-import-data.json
│ Workflow        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   (PostGIS)     │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐  ┌─────────┐
│ n8n   │  │Superset │
│ API   │  │Dashboard│
└───┬───┘  └─────────┘
    │
    ▼
┌─────────────┐
│  Frontend   │
│  (Next.js)  │
└─────────────┘
```

## n8n Workflows

| Workflow | Type | Purpose |
|----------|------|---------|
| 0-init-schema.json | Setup | Creates tables & indexes |
| 1-import-data.json | ETL | Imports listings from JSON |
| search_api_workflow.json | API | GET /webhook/search |
| listing_api_workflow.json | API | GET /webhook/listing/:id |
| stats_api_workflow.json | API | GET /webhook/stats |

## Database Schema

Created via n8n workflow (no SQL files):

```
listings
├── id (SERIAL PK)
├── title (TEXT)
├── city, district, ward (TEXT)
├── price_million (NUMERIC)
├── area_m2 (NUMERIC)
├── rent_per_sqm_million (NUMERIC)
├── lat, lon (DOUBLE PRECISION)
├── geom (GEOMETRY POINT)
├── type, segment (TEXT)
├── frontage (NUMERIC)
├── floors (INTEGER)
├── views, saved_count (INTEGER)
├── image_url (TEXT)
├── raw_data (JSONB)
└── created_at (TIMESTAMP)
```

## Security

- Secrets stored in `.env` (gitignored)
- n8n webhooks: No auth (localhost only)
- Superset: Admin login required
- PostgreSQL: Internal network only

## Scaling Notes

For production:
1. Add nginx reverse proxy
2. Enable n8n webhook auth tokens
3. Use managed PostgreSQL (RDS/Cloud SQL)
4. Deploy n8n to Kubernetes
