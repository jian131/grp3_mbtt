# 🏢 JFinder - Smart Rental Decision Support System

**Hệ thống hỗ trợ ra quyết định thuê mặt bằng dựa trên phân tích địa lý và trí tuệ nhân tạo**

> Dự án phục vụ học phần "Hệ thống Kinh doanh Thông Minh" - Sử dụng chỉ **n8n** + **Apache Superset**

---

## 📊 Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                          │
│                    http://localhost:3000                        │
│                                                                 │
│  Pages: /, /search, /map, /analysis, /landlord,                │
│         /dashboard, /bi-dashboard                               │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP API
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                 n8n (Backend API + ETL)                         │
│                 http://localhost:5678                           │
│                                                                 │
│  Endpoints:                                                     │
│  • GET  /webhook/search     - Tìm kiếm với filters             │
│  • GET  /webhook/listing/:id - Chi tiết mặt bằng               │
│  • GET  /webhook/stats      - Thống kê khu vực                 │
│  • POST /webhook/roi        - Tính ROI/break-even              │
│  • POST /webhook/valuation  - Định giá AI                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL + PostGIS                         │
│                    localhost:5433                               │
│                                                                 │
│  • 1170 listings (3 thành phố)                                 │
│  • Views thống kê: view_district_stats, view_ward_stats        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Apache Superset (BI)                           │
│                  http://localhost:8088                          │
│                                                                 │
│  • Heatmap giá thuê                                            │
│  • Histogram phân bố giá                                       │
│  • Thống kê theo quận/phường                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Chuẩn bị môi trường

```bash
cp .env.example .env
```

### 2. Khởi động Docker

```bash
docker compose up -d
```

Đợi ~30s để các service khởi động, kiểm tra:

```bash
docker compose ps
```

### 3. Khởi động HTTP Server cho data

```bash
python -m http.server 8000 --directory app/data
```

### 4. Cấu hình n8n

1. Mở http://localhost:5678
2. Import các workflow trong `/n8n/`:
   - `0-init-schema.json` (chạy 1 lần)
   - `1-import-data.json` (chạy 1 lần)
   - `search_api_workflow.json` (bật Active)
   - `listing_api_workflow.json` (bật Active)
   - `stats_api_workflow.json` (bật Active)
   - `roi_api_workflow.json` (bật Active)
   - `valuation_api_workflow.json` (bật Active)

3. Tạo Postgres Credential:
   - Host: `postgres`
   - Port: `5432`
   - Database: `jfinder_db`
   - User: `jfinder`
   - Password: `jfinder_password`

### 5. Khởi động Frontend

```bash
npm install
npm run dev
# Mở http://localhost:3000
```

### 6. Truy cập Superset

- URL: http://localhost:8088
- Login: `admin` / `admin123`

---

## 📡 API Reference

### Search Listings

```bash
curl "http://localhost:5678/webhook/search?city=Hồ Chí Minh&limit=10"
```

**Query params:**
- `city`, `district`, `ward` - Lọc theo địa điểm
- `type` - streetfront/shophouse/kiosk/office
- `segment` - street_retail/shopping_mall/office
- `min_price`, `max_price` - Khoảng giá (triệu VND)
- `min_area`, `max_area` - Khoảng diện tích (m²)
- `lat`, `lon`, `radius_m` - Tìm theo bán kính
- `limit`, `offset` - Phân trang

### Get Listing Detail

```bash
curl "http://localhost:5678/webhook/listing/VN26000001"
```

### Get Statistics

```bash
curl "http://localhost:5678/webhook/stats?level=district&city=Hà Nội"
```

### Calculate ROI

```bash
curl -X POST "http://localhost:5678/webhook/roi" \
  -H "Content-Type: application/json" \
  -d '{"monthly_rent":50,"product_price":50000,"profit_margin":0.3,"target_daily_customers":100}'
```

### Get Valuation

```bash
curl -X POST "http://localhost:5678/webhook/valuation" \
  -H "Content-Type: application/json" \
  -d '{"district":"Quận 1","type":"streetfront","area_m2":100,"frontage_m":6}'
```

---

## 📁 Cấu trúc dự án

```
├── app/                      # Next.js frontend
│   ├── data/                 # Dataset files
│   │   ├── vn_rental_3cities.json   # Dataset chính (1170 listings)
│   │   └── vn_rental_3cities.csv
│   ├── search/               # Trang tìm kiếm
│   ├── analysis/             # Trang phân tích AI
│   └── ...
├── components/               # React components
│   ├── Map/                  # Heatmap components
│   └── Analysis/             # Valuation cards
├── lib/
│   └── api.ts                # API client
├── n8n/                      # n8n workflow definitions
│   ├── 0-init-schema.json    # Khởi tạo DB
│   ├── 1-import-data.json    # Import data
│   ├── search_api_workflow.json
│   ├── listing_api_workflow.json
│   ├── stats_api_workflow.json
│   ├── roi_api_workflow.json
│   └── valuation_api_workflow.json
├── docs/                     # Documentation
│   ├── AUDIT.md              # Báo cáo audit
│   ├── ARCHITECTURE.md       # Kiến trúc
│   └── TESTING.md            # Test plan
├── docker-compose.yml        # Docker services
└── .env.example              # Environment template
```

---

## 📊 Dataset

**Source:** Vietnam Rental Listings (3 Cities)
**Records:** 1170 mặt bằng
**Cities:** Hà Nội, Đà Nẵng, TP. Hồ Chí Minh

**Key Fields:**
| Field | Description |
|-------|-------------|
| `id` | Mã listing (VN26xxxxxx) |
| `province` | Thành phố |
| `district`, `ward` | Quận, Phường |
| `type` | streetfront/shophouse/kiosk/office |
| `price_million` | Giá thuê (triệu VND/tháng) |
| `area_m2`, `frontage_m`, `floors` | Thông số BĐS |
| `views`, `saved_count` | Tương tác |
| `ai_suggested_price` | Giá gợi ý (pre-calculated) |
| `primary_image_url` | Ảnh thật (Wikimedia) |

---

## 🎯 Tính năng DSS

### 1. Smart Search
- Filter đa tiêu chí (city/district/type/price/area)
- **Radius Search**: Tìm theo bán kính với công thức Haversine
- **Price Label**: Gắn nhãn rẻ/hợp lý/đắt so với khu vực

### 2. AI Valuation
- Định giá dựa trên percentile (p25/median/p75) theo khu vực
- Điều chỉnh theo frontage, floors
- Confidence score dựa trên sample size

### 3. ROI Calculator
- Tính break-even days
- Tính monthly profit và ROI %
- Đánh giá viability (excellent/good/moderate/risky)

### 4. BI Dashboard (Superset)
- Heatmap giá thuê
- Phân tích theo type/segment
- Thống kê percentile theo quận/phường

---

## 🔧 Development

### Reset Database

```bash
docker compose down -v
docker compose up -d
# Re-import via n8n
```

### View Logs

```bash
docker compose logs -f n8n
docker compose logs -f postgres
```

---

## 📝 Credentials

| Service | URL | Username | Password |
|---------|-----|----------|----------|
| n8n | http://localhost:5678 | - | - |
| Superset | http://localhost:8088 | admin | admin123 |
| PostgreSQL | localhost:5433 | jfinder | jfinder_password |

---

## ⚠️ Lưu ý quan trọng

- **Không có AI/ML nặng**: "AI" ở đây là rule-based scoring + percentile stats
- **Không có Visual Search/OCR/LLM**
- **Schema tạo qua n8n workflow**, không có file .sql thủ công
- **Radius search dùng Haversine** trong n8n Code node (không cần PostGIS functions)

---

**Last updated:** 2026-01-15
**Version:** 3.0 (3 Cities Pivot)
