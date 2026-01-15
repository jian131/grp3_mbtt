# 📘 JFinder Runbook

## Hướng dẫn vận hành từ A-Z

**Ngày cập nhật:** 2026-01-15
**Version:** 3.0 (3 Cities Pivot)

---

## 🚀 Lần đầu Setup

### Bước 1: Clone và chuẩn bị

```bash
# Copy .env
cp .env.example .env
```

### Bước 2: Khởi động Docker Stack

```bash
docker compose up -d
```

Đợi ~30 giây, kiểm tra:

```bash
docker compose ps
# Expected: postgres (healthy), n8n, superset, redis all "Up"
```

### Bước 3: Khởi động Data Server

**Giữ terminal này mở:**
```bash
python -m http.server 8000 --directory app/data
```

### Bước 4: Cấu hình n8n

1. Mở http://localhost:5678
2. Nếu lần đầu, bỏ qua setup wizard hoặc tạo account local

3. **Tạo Postgres Credential:**
   - Vào **Settings** → **Credentials** → **Add Credential**
   - Chọn **Postgres**
   - Điền:
     - Name: `JFinder DB`
     - Host: `postgres`
     - Port: `5432`
     - Database: `jfinder_db`
     - User: `jfinder`
     - Password: `jfinder_password`
   - Save

4. **Import và chạy Init Schema:**
   - **Workflows** → **Add Workflow** → **Import from File**
   - Chọn `n8n/0-init-schema.json`
   - Link credential "JFinder DB" vào tất cả Postgres nodes
   - Click **Execute Workflow**
   - Expected: "Schema initialized for 3 cities dataset!"

5. **Import và chạy Data Import:**
   - Import `n8n/1-import-data.json`
   - Link credential
   - Execute
   - Expected: "Imported 1170 listings from 3 cities!"

6. **Import và BẬT các API workflows:**
   - Import từng file:
     - `search_api_workflow.json`
     - `listing_api_workflow.json`
     - `stats_api_workflow.json`
     - `roi_api_workflow.json`
     - `valuation_api_workflow.json`
   - Link credential cho mỗi workflow
   - Toggle **Active** (ON) cho mỗi workflow

### Bước 5: Test API

```bash
# Search
curl "http://localhost:5678/webhook/search?limit=1"

# Stats
curl "http://localhost:5678/webhook/stats"

# ROI
curl -X POST "http://localhost:5678/webhook/roi" \
  -H "Content-Type: application/json" \
  -d '{"monthly_rent":50,"product_price":50000,"profit_margin":0.3,"target_daily_customers":100}'
```

### Bước 6: Khởi động Frontend

```bash
npm install
npm run dev
# Mở http://localhost:3000
```

---

## 📊 Cấu hình Superset

### Kết nối Database

1. Mở http://localhost:8088
2. Login: `admin` / `admin123`
3. Vào **Settings** → **Database Connections** → **+ Database**
4. Chọn **PostgreSQL**
5. Điền connection string:
   ```
   postgresql://jfinder:jfinder_password@postgres:5432/jfinder_db
   ```
6. Test Connection → Connect

### Tạo Dataset

1. Vào **SQL Lab** → **SQL Editor**
2. Chọn database vừa tạo
3. Chạy thử:
   ```sql
   SELECT * FROM listings LIMIT 10;
   ```
4. Click **Save** → **Save as Dataset**
5. Đặt tên: `listings`

### Tạo Charts (gợi ý)

| Chart Type | Dataset | Metrics | Dimensions |
|------------|---------|---------|------------|
| Pie | listings | COUNT(*) | type |
| Bar | listings | AVG(price_million) | district |
| Table | view_district_stats | * | - |
| Scatter (Map) | listings | price_million | lat, lon |

---

## 🔧 Vận hành hàng ngày

### Kiểm tra services

```bash
docker compose ps
docker compose logs -n 20 n8n
```

### Restart services

```bash
docker compose restart
```

### Xem logs realtime

```bash
docker compose logs -f n8n
docker compose logs -f postgres
```

### Query database trực tiếp

```bash
docker exec -it grp3_mbtt-postgres-1 psql -U jfinder -d jfinder_db

# Ví dụ queries:
SELECT COUNT(*) FROM listings;
SELECT * FROM view_district_stats LIMIT 5;
\q
```

---

## 🔄 Reset hoàn toàn

```bash
# Dừng và xóa volumes
docker compose down -v

# Xóa data folders (nếu cần)
rm -rf postgres_data n8n_data superset_data

# Khởi động lại
docker compose up -d

# Cấu hình lại n8n từ bước 4
```

---

## 🐛 Troubleshooting

### n8n không kết nối được Postgres

- Kiểm tra postgres đã healthy: `docker compose ps`
- Host phải là `postgres` (không phải `localhost`)
- Port là `5432` (internal port)

### Import workflow báo lỗi HTTP Request

- Đảm bảo `python -m http.server 8000` đang chạy
- URL trong workflow là `http://host.docker.internal:8000/vn_rental_3cities.json`

### Superset không thấy data

1. Vào SQL Lab test query trước
2. Nếu không có data → chạy lại import workflow trong n8n
3. Refresh dataset trong Superset

### Frontend báo lỗi API

- Kiểm tra n8n workflows đã Active
- Kiểm tra URL: `http://localhost:5678/webhook/search`
- CORS đã được enable trong n8n

---

## 📋 Checklist Demo

Trước khi demo cho giảng viên:

1. ⬜ Docker all services up
2. ⬜ Data import 1170 records
3. ⬜ API /search trả về data
4. ⬜ API /stats trả về statistics
5. ⬜ API /roi tính toán đúng
6. ⬜ API /valuation trả về price range
7. ⬜ Frontend hiển thị listings
8. ⬜ Heatmap hiển thị markers
9. ⬜ Superset dashboard có charts

---

## 📞 Liên hệ hỗ trợ

**Technical Issues:** Check `docs/TESTING.md` trước

**Architecture Questions:** Check `docs/ARCHITECTURE.md`

---

**Happy Coding! 🚀**
