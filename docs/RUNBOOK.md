# 📘 JFinder Operations Runbook

**Version:** 4.0 (File-based)
**Updated:** 2026-01-16

## Overview

This runbook covers day-to-day operations, troubleshooting, and maintenance procedures for JFinder.

---

## 🚀 Initial Setup

### Prerequisites

- Docker Desktop (or Docker + Docker Compose)
- Node.js 18+ and npm
- Python 3.8+ (for data scripts)
- Git

### First Time Setup

#### 1. Clone Repository

```bash
git clone <repository-url>
cd grp3_mbtt
```

#### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local
# NEXT_PUBLIC_N8N_URL=http://localhost:5678/webhook
# NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here (optional)
```

#### 3. Start Docker Services

```bash
# Start all services
docker compose up -d

# Wait 30 seconds for initialization
sleep 30

# Verify all services are running
docker compose ps
```

Expected output:

```
NAME                        STATUS
grp3_mbtt-postgres-1        Up (healthy)
grp3_mbtt-n8n-1             Up
grp3_mbtt-superset-1        Up
grp3_mbtt-redis-1           Up
```

#### 4. Configure n8n

1. **Access n8n**: Open http://localhost:5678
2. **First Visit**: Set up owner account (email/password)
3. **Import Workflow**:
   - Go to **Workflows** → **Add workflow** → **Import from file**
   - Select `n8n/JFinder_API_NoPostgres.json`
   - Click **Save**
4. **Activate Workflow**:
   - Toggle **Active** switch to ON
   - Verify webhook URLs are available

#### 5. Import Data to Superset

```bash
# Run import script
python scripts/import_to_postgres.py
```

Expected output:

```
Connected to PostgreSQL
Created table: jfinder_listings
Imported 1170 records
Done!
```

#### 6. Configure Superset

1. **Access Superset**: Open http://localhost:8088
2. **Login**: Username `admin`, Password `admin`
3. **Add Database**:
   - Settings → Database Connections → + Database
   - Select **PostgreSQL**
   - SQLAlchemy URI: `postgresql://jfinder:jfinder_password@postgres:5432/jfinder_db`
   - Test connection → Save
4. **Create Dataset**:
   - Datasets → + Dataset
   - Database: PostgreSQL
   - Schema: public
   - Table: jfinder_listings
   - Create
5. **Create Charts** (optional):
   - Charts → + Chart
   - Select dataset → Choose chart type → Configure

#### 7. Start Frontend

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at http://localhost:3000

---

## 🔄 Daily Operations

### Starting Services

```bash
# Start all services
docker compose up -d

# Start frontend
npm run dev
```

### Stopping Services

```bash
# Stop frontend (Ctrl+C in terminal)

# Stop docker services
docker compose down

# Stop and remove volumes (caution: deletes data)
docker compose down -v
```

### Checking Service Status

```bash
# All services
docker compose ps

# View logs
docker compose logs -f

# Specific service logs
docker compose logs -f n8n
docker compose logs -f postgres
docker compose logs -f superset
```

### Restarting Services

```bash
# Restart specific service
docker compose restart n8n

# Restart all services
docker compose restart

# Full restart (recreate containers)
docker compose down
docker compose up -d
```

---

## 🧪 Testing

### Smoke Tests

```bash
# Run all smoke tests
python scripts/smoke_test.py
```

Expected: 9/9 tests pass

### Manual API Testing

#### Test n8n Search

```bash
curl "http://localhost:5678/webhook/search?province=Hà Nội&limit=5"
```

Expected: JSON response with 5 listings from Hà Nội

#### Test ROI Calculation

```bash
curl -X POST "http://localhost:5678/webhook/roi" \
  -H "Content-Type: application/json" \
  -d '{"monthlyRent": 20, "productPrice": 50000, "profitMargin": 0.3, "dailyCustomers": 100}'
```

Expected: JSON with ROI calculation results

#### Test Valuation

```bash
curl -X POST "http://localhost:5678/webhook/valuation" \
  -H "Content-Type: application/json" \
  -d '{"district": "Quận 1", "city": "Thành phố Hồ Chí Minh", "area": 50}'
```

Expected: JSON with valuation estimate

### Frontend Testing

```bash
# Build test
npm run build

# Start production server
npm start
```

Visit http://localhost:3000 and verify:

- ✅ Home page loads
- ✅ Search page displays results
- ✅ Listing detail page works
- ✅ Analysis page calculates ROI
- ✅ Dashboard shows charts

---

## 🐛 Troubleshooting

### n8n Workflow Not Responding

**Symptoms:**

- API calls to `/webhook/*` return 404
- "Workflow not found" errors

**Solutions:**

1. **Check workflow is active**:
   - Go to http://localhost:5678
   - Workflows → JFinder_API_NoPostgres
   - Ensure **Active** toggle is ON

2. **Check webhook URLs**:
   - Click on Webhook nodes
   - Verify URLs match expected format: `/webhook/search`

3. **Restart n8n**:
   ```bash
   docker compose restart n8n
   ```

### Frontend Shows "Failed to fetch"

**Symptoms:**

- Search returns no results
- Console shows CORS errors or connection refused

**Solutions:**

1. **Check n8n is running**:

   ```bash
   curl http://localhost:5678/healthz
   ```

2. **Check environment variables**:
   - Verify `.env.local` has correct `NEXT_PUBLIC_N8N_URL`
   - Should be: `http://localhost:5678/webhook`

3. **Restart frontend**:
   ```bash
   # Stop (Ctrl+C)
   # Clear Next.js cache
   rm -rf .next
   # Restart
   npm run dev
   ```

### Superset Can't Connect to Database

**Symptoms:**

- "Database connection failed" in Superset
- Charts show no data

**Solutions:**

1. **Check PostgreSQL is running**:

   ```bash
   docker compose ps postgres
   docker exec -it grp3_mbtt-postgres-1 psql -U jfinder -d jfinder_db -c "SELECT COUNT(*) FROM jfinder_listings;"
   ```

2. **Verify connection string**:
   - In Superset: Settings → Database Connections
   - Edit PostgreSQL connection
   - URI: `postgresql://jfinder:jfinder_password@postgres:5432/jfinder_db`
   - Note: Use `postgres` (not `localhost`) as hostname

3. **Re-import data**:
   ```bash
   python scripts/import_to_postgres.py
   ```

### Docker Container Won't Start

**Symptoms:**

- `docker compose up` fails
- Port already in use errors

**Solutions:**

1. **Check port conflicts**:

   ```bash
   # Windows
   netstat -ano | findstr :5678
   netstat -ano | findstr :3000
   netstat -ano | findstr :8088

   # Kill conflicting processes if needed
   ```

2. **Clear Docker volumes**:

   ```bash
   docker compose down -v
   docker compose up -d
   ```

3. **Check Docker resources**:
   - Docker Desktop → Settings → Resources
   - Ensure at least 4GB RAM allocated

### Data Not Showing in Charts

**Symptoms:**

- Superset charts are empty
- Dataset shows 0 rows

**Solutions:**

1. **Verify data import**:

   ```bash
   docker exec -it grp3_mbtt-postgres-1 psql -U jfinder -d jfinder_db
   \dt
   SELECT COUNT(*) FROM jfinder_listings;
   \q
   ```

2. **Re-import data**:

   ```bash
   python scripts/import_to_postgres.py
   ```

3. **Refresh Superset metadata**:
   - Datasets → jfinder_listings → Edit
   - Columns tab → Sync columns from source

---

## 🔧 Maintenance

### Update Dataset

If dataset file changes:

1. **Replace JSON file**:

   ```bash
   cp new_data.json app/data/listings_vn_postmerge.json
   ```

2. **Restart n8n** (to reload file):

   ```bash
   docker compose restart n8n
   ```

3. **Re-import to Superset**:

   ```bash
   python scripts/import_to_postgres.py
   ```

4. **Verify**:
   ```bash
   python scripts/smoke_test.py
   ```

### Update n8n Workflow

1. **Export current workflow**:
   - n8n → Workflows → JFinder_API_NoPostgres
   - ⋯ Menu → Download
   - Save to `n8n/` folder

2. **Make changes in n8n UI**

3. **Test thoroughly**

4. **Export again** to save changes

### Database Backup

```bash
# Backup
docker exec grp3_mbtt-postgres-1 pg_dump -U jfinder jfinder_db > backup_$(date +%Y%m%d).sql

# Restore
docker exec -i grp3_mbtt-postgres-1 psql -U jfinder jfinder_db < backup_20260116.sql
```

### Log Rotation

Docker handles log rotation automatically. To manually clear logs:

```bash
# View log size
docker compose logs --tail=0 | wc -l

# Clear logs (restart containers)
docker compose restart
```

---

## 📊 Monitoring

### Health Check Script

Create `scripts/health_check.sh`:

```bash
#!/bin/bash
echo "Checking JFinder services..."

# n8n
curl -sf http://localhost:5678/healthz > /dev/null && echo "✅ n8n OK" || echo "❌ n8n DOWN"

# Frontend
curl -sf http://localhost:3000 > /dev/null && echo "✅ Frontend OK" || echo "❌ Frontend DOWN"

# Superset
curl -sf http://localhost:8088/health > /dev/null && echo "✅ Superset OK" || echo "❌ Superset DOWN"

# PostgreSQL
docker exec grp3_mbtt-postgres-1 pg_isready -U jfinder && echo "✅ PostgreSQL OK" || echo "❌ PostgreSQL DOWN"
```

Run: `bash scripts/health_check.sh`

### Performance Monitoring

```bash
# Docker resource usage
docker stats

# PostgreSQL slow queries
docker exec -it grp3_mbtt-postgres-1 psql -U jfinder -d jfinder_db -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"
```

---

## 🚢 Deployment

### Production Checklist

- [ ] Update `.env.production` with production URLs
- [ ] Set strong passwords for Superset admin
- [ ] Configure n8n authentication
- [ ] Set up SSL/TLS certificates
- [ ] Configure reverse proxy (nginx)
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Configure automated backups
- [ ] Test disaster recovery

### Production Environment Variables

```bash
# .env.production
NEXT_PUBLIC_N8N_URL=https://api.jfinder.com/webhook
NODE_ENV=production
```

### Reverse Proxy Example (nginx)

```nginx
server {
    listen 80;
    server_name jfinder.com;

    location / {
        proxy_pass http://localhost:3000;
    }

    location /api/n8n/ {
        proxy_pass http://localhost:5678/webhook/;
    }

    location /superset/ {
        proxy_pass http://localhost:8088/;
    }
}
```

---

## 📞 Support

### Getting Help

1. Check this runbook first
2. Review [ARCHITECTURE.md](ARCHITECTURE.md) for system design
3. Check [reports/logic_audit.md](../reports/logic_audit.md) for known issues
4. Search GitHub issues

### Reporting Issues

Include:

- System info (OS, Docker version, Node version)
- Steps to reproduce
- Expected vs actual behavior
- Relevant logs
- Output of `python scripts/smoke_test.py`

---

For architecture details, see [ARCHITECTURE.md](ARCHITECTURE.md)
