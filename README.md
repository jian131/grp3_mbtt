# JFinder - Smart Rental Decision Support System 🏢✨

Hệ thống hỗ trợ quyết định tìm kiếm mặt bằng cho thuê thông minh.

---

## 🎯 Mục tiêu

Chuyển đổi từ **"Tìm kiếm thụ động"** sang **"Tư vấn chủ động"**:
- Trả lời câu hỏi: *"Tại sao tôi nên thuê chỗ này?"*
- Kết hợp **BI**, **Geo-marketing** và **AI định giá**

---

## 🏗️ Kiến trúc hệ thống

```
┌──────────────────────────────────────────────────────────────┐
│                 FRONTEND (Next.js :3000)                     │
│  • Tìm kiếm  • Heatmap  • AI Analysis  • Dashboard           │
└────────────────────────┬─────────────────────────────────────┘
                         │ REST API
                         ▼
┌──────────────────────────────────────────────────────────────┐
│               BACKEND API (n8n :5678)                        │
│  • /webhook/listings  • /webhook/stats  • /webhook/valuation │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│            BI DASHBOARD (Apache Superset :8088)              │
│  • Custom Charts  • SQL Lab  • Data Visualization            │
└──────────────────────────────────────────────────────────────┘
```

---

## ✅ Tính năng

| Chức năng | Mô tả | Tech Stack |
|-----------|-------|------------|
| **Tìm Kiếm Mặt Bằng** | Form filter + Grid results | Next.js + n8n API |
| **Heatmap (Bản đồ nhiệt)** | Giá/Tiềm năng trên bản đồ | React Leaflet |
| **AI Định giá** | Gợi ý giá thuê hợp lý | n8n Workflow (JS Code) |
| **ROI Calculator** | Tính break-even point | n8n API |
| **Dashboard BI** | Biểu đồ phân tích chuyên sâu | **Apache Superset** |
| **Landlord Portal** | Công cụ định giá cho chủ nhà | Next.js |
| **Statistics** | Thống kê thị trường | n8n API |

---

## 🚀 Cài đặt & Chạy

### 1. Yêu cầu
- Node.js 18+
- Docker Desktop
- Python 3.10+ (cho scripts)

### 2. Khởi động Backend (n8n + Superset)
```bash
docker-compose up -d
```

### 3. Cấu hình Superset (chạy 1 lần)
```powershell
.\setup_superset.ps1
```

### 4. Import n8n Workflow
1. Mở `http://localhost:5678` (admin/admin)
2. Menu → Import from File → Chọn `n8n_backend.json`
3. **Bật workflow** (Toggle ON ở góc phải)

### 5. Chạy Frontend
```bash
npm install
npm run dev
```

### 6. Export dữ liệu cho Superset (tùy chọn)
```bash
python scripts/export_to_superset.py
```

---

## 🔗 Truy cập hệ thống

| Service | URL | Đăng nhập |
|---------|-----|-----------|
| **JFinder Web** | http://localhost:3000 | - |
| **n8n Backend** | http://localhost:5678 | admin / admin |
| **Superset BI** | http://localhost:8088 | admin / admin |

---

## 📁 Cấu trúc dự án

```
grp3_mbtt/
├── app/                          # Next.js Pages
│   ├── page.tsx                 # Home
│   ├── search/                  # 🔍 Tìm kiếm mặt bằng (NEW)
│   ├── map/                     # 🗺️ Heatmap
│   ├── analysis/                # 🤖 AI Analysis + ROI
│   ├── landlord/                # 💰 Định giá cho chủ nhà
│   ├── dashboard/               # 📊 Dashboard thống kê
│   └── bi-dashboard/            # 📈 Superset BI (NEW)
├── components/
│   ├── Map/                     # Heatmap component
│   └── Analysis/                # Valuation card
├── lib/
│   └── api.ts                   # API Helper (n8n proxy)
├── scripts/
│   ├── export_to_superset.py    # Export data to CSV
│   └── ...
├── data/
│   ├── superset_listings.csv    # Data for Superset
│   └── jfinder_listings.csv     # Static data
├── n8n_backend.json             # 🔧 n8n Workflow chính
├── docker-compose.yml           # Docker config
├── setup_superset.ps1           # Superset setup script
└── README.md
```

---

## 🔌 n8n API Endpoints

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/webhook/listings` | GET | Danh sách mặt bằng (filter: district, type, maxPrice) |
| `/webhook/stats` | GET | Thống kê tổng hợp |
| `/webhook/districts` | GET | Danh sách quận + giá TB |
| `/webhook/valuation` | POST | AI định giá |
| `/webhook/roi` | POST | Tính ROI |

**Lưu ý**: Frontend gọi qua proxy `/api/n8n/*` để tránh CORS.

---

## 📊 Sử dụng Superset

### Quick Start:
1. Truy cập `http://localhost:8088` (admin/admin)
2. **Data → Datasets → +Dataset**
3. Chọn database: **Google Sheets** (đã cài driver)
4. Paste Google Sheet URL hoặc upload CSV từ `data/superset_listings.csv`
5. **Charts → +Chart** → Chọn dataset → Chọn loại biểu đồ
6. **Dashboards → +Dashboard** → Kéo thả charts vào

### Export data mới từ n8n:
```bash
python scripts/export_to_superset.py
```

File sẽ được lưu tại `data/superset_listings.csv`.

---

## 🔧 Troubleshooting

### Lỗi "Failed to fetch" ở Frontend
**Nguyên nhân**: n8n chưa chạy hoặc workflow chưa Active.

**Giải pháp**:
1. Kiểm tra Docker: `docker ps` (phải thấy container n8n)
2. Vào n8n UI → Bật workflow ON
3. Restart Next.js: `Ctrl+C` → `npm run dev`

### Superset không hiển thị
**Nguyên nhân**: Container chưa khởi động hoàn toàn (mất 1-2 phút).

**Giải pháp**:
```bash
docker-compose restart superset
```

### CORS Error
Đã giải quyết bằng Next.js proxy (`rewrites` trong `next.config.ts`).

---

## 👥 Đối tượng sử dụng

1. **Người thuê**: Tìm mặt bằng, xem phân tích tiềm năng
2. **Chủ cho thuê**: Định giá tài sản thông minh
3. **Quản trị viên**: Dashboard BI, phân tích xu hướng

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend API**: n8n (Low-code Automation)
- **BI Dashboard**: Apache Superset
- **Map**: React Leaflet
- **Containerization**: Docker Compose

---

**Developed by Group 3 - MBTT @ Đại học Thủy Lợi**
