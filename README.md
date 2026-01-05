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
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                   │
│              localhost:3000 - Web Portal                │
└───────────────────────────┬─────────────────────────────┘
                            │ API Calls
                            ▼
┌─────────────────────────────────────────────────────────┐
│               BACKEND API (n8n Automation)              │
│         localhost:5678/webhook/* - REST APIs            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              BI DASHBOARD (Apache Superset)             │
│       localhost:8088 - Biểu đồ phân tích chuyên sâu     │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Tính năng

| Chức năng | Mô tả | Component |
|-----------|-------|-----------|
| **Heatmap** | Bản đồ nhiệt giá/tiềm năng | Next.js + Leaflet |
| **Lọc nâng cao** | Theo quận, loại, giá | n8n API |
| **AI Định giá** | Gợi ý giá, nhãn "Rẻ/Đắt" | n8n API |
| **ROI Calculator** | Tính break-even | n8n API |
| **Dashboard BI** | Biểu đồ chuyên sâu | **Superset** |
| **Landlord Portal** | Gợi ý giá cho chủ nhà | Next.js |

---

## 🚀 Cài đặt & Chạy

### 1. Yêu cầu
- Node.js 18+
- Docker Desktop

### 2. Khởi động Backend (n8n + Superset)
```bash
docker-compose up -d
```

### 3. Cấu hình Superset (chạy 1 lần, đợi 2-3 phút sau docker up)
```powershell
.\setup_superset.ps1
```

### 4. Import n8n Workflow
1. Mở `http://localhost:5678` (admin/admin)
2. Menu → Import from File → Chọn `n8n_backend.json`
3. **Bật workflow** (Toggle ON)

### 5. Chạy Frontend
```bash
npm install
npm run dev
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
├── app/                    # Next.js Pages
├── components/             # React Components
├── lib/api.ts              # API Helper
├── n8n_backend.json        # Workflow n8n
├── docker-compose.yml      # n8n + Superset
├── setup_superset.ps1      # Script cấu hình Superset
└── README.md
```

---

## 🔌 n8n API Endpoints

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/webhook/listings` | GET | Danh sách mặt bằng |
| `/webhook/stats` | GET | Thống kê |
| `/webhook/districts` | GET | Danh sách quận |
| `/webhook/valuation` | POST | AI định giá |
| `/webhook/roi` | POST | Tính ROI |

---

## 📊 Sử dụng Superset

Superset dùng để tạo **Dashboard BI chuyên sâu**:
1. Đăng nhập Superset
2. Tạo **Database Connection** (có thể kết nối CSV hoặc API)
3. Tạo **Charts** (Bar, Pie, Heatmap...)
4. Tạo **Dashboard** và nhúng vào Next.js

---

**Developed by Group 3 - MBTT @ Đại học Thủy Lợi**
