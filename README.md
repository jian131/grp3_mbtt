# JFinder - Nền tảng Tìm kiếm Mặt bằng Thông minh

> Hệ thống phân tích và tìm kiếm mặt bằng cho thuê tại Việt Nam

## 📊 Tổng quan

- **1,170** mặt bằng tại Việt Nam
- **100%** tọa độ đã xác minh
- Tích hợp AI phân tích tiềm năng kinh doanh

## 🚀 Cài đặt

### Yêu cầu

- Docker & Docker Compose
- Node.js 18+

### Khởi động

```bash
# 1. Start backend services
docker compose up -d

# 2. Start frontend
npm install
npm run dev
```

### Truy cập

| Dịch vụ  | URL                   | Tài khoản         |
| -------- | --------------------- | ----------------- |
| Frontend | http://localhost:3000 | -                 |
| n8n      | http://localhost:5678 | Tạo khi đăng nhập |
| Superset | http://localhost:8088 | admin / admin     |

## 🏗️ Kiến trúc

```
Frontend (Next.js:3000)
    ├── /search      → Tìm kiếm mặt bằng + Bản đồ
    ├── /listing/[id]→ Chi tiết + Chỉ đường
    ├── /analysis    → Phân tích ROI, Định giá AI
    ├── /landlord    → Công cụ chủ nhà
    └── /bi-dashboard→ Dashboard Superset

Backend
    ├── n8n (:5678)  → API workflows
    ├── Superset     → BI Analytics
    └── PostgreSQL   → Database
```

## 📂 Cấu trúc dự án

```
grp3_mbtt/
├── app/                    # Next.js pages
│   ├── search/            # Tìm kiếm + Map
│   ├── listing/[id]/      # Chi tiết mặt bằng
│   ├── analysis/          # Phân tích AI
│   └── api/               # API routes
├── components/            # React components
│   ├── Map/               # Heatmap, routing
│   └── Listing/           # Cards, Gallery
├── lib/                   # Utilities
├── app/data/              # JSON data (1170 listings)
└── docker-compose.yml     # Backend services
```

## ✨ Tính năng chính

1. **Tìm kiếm thông minh** - Lọc theo quận, giá, loại hình
2. **Bản đồ Heatmap** - Hiển thị giá/tiềm năng theo khu vực
3. **Chỉ đường** - Tính khoảng cách, thời gian di chuyển
4. **Phân tích AI** - Đánh giá tiềm năng, dự đoán doanh thu
5. **Định giá tự động** - Ước tính giá thuê hợp lý
6. **Dashboard BI** - Thống kê trực quan với Superset

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React, Tailwind CSS
- **Backend**: n8n (workflow automation)
- **Database**: PostgreSQL
- **BI**: Apache Superset
- **Map**: Leaflet, OSRM routing
- **AI**: Groq LLM (Llama 3.3)

## 👥 Nhóm phát triển

**Nhóm 3 - MBTT**

---

© 2026 JFinder - Đồ án môn học
