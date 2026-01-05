# JFinder - Smart Rental Decision Support System (DSS) 🏢✨

Hệ thống hỗ trợ ra quyết định thuê mặt bằng thông minh, tích hợp AI định giá và bản đồ nhiệt.

---

## 🌟 Tính Năng Chính

*   **Bản Đồ Thông Minh (Smart Map)**: Tìm kiếm theo bán kính, lớp phủ tiện ích (trường học, văn phòng).
*   **Định Giá AI (AI Valuation)**: Gợi ý giá thuê hợp lý dựa trên dữ liệu so sánh.
*   **Phân Tích Tiềm Năng**: Chấm điểm địa điểm (Potential Score).
*   **Dashboard Phân Tích**: Biểu đồ trực quan về thị trường.
*   **Hệ Thống Tự Động Hóa**: Crawler dữ liệu tự động với n8n.

---

## 🚀 Cài Đặt & Chạy Dự Án

### 1. Yêu Cầu
*   Node.js 18+
*   Docker & Docker Compose
*   Python 3.10+ (Optional, nếu chạy script thủ công)

### 2. Khởi Động Hạ Tầng (Infrastructure)
Chạy bộ 3 dịch vụ nền tảng (Database, Automation, Analytics):

```bash
docker-compose up -d
```

*   **n8n**: `http://localhost:5678`
*   **Superset**: `http://localhost:8088` (Admin/Admin)
*   **Postgres**: `localhost:5432`

### 3. Chạy Ứng Dụng Frontend (JFinder)

```bash
npm install
npm run dev
```
Truy cập: `http://localhost:3000`

---

## 🛠️ Hướng Dẫn Sử Dụng Nâng Cao

### A. Tự Động Hóa Dữ Liệu (n8n)
1.  Truy cập n8n.
2.  Import file `n8n_workflow.json` để có sẵn quy trình mẫu.
3.  Quy trình sẽ tự động chạy script `scripts/generate_mock_data.py` để lấy dữ liệu.

### B. Phân Tích Dữ Liệu (Superset)
1.  Đăng nhập Superset (`admin`/`admin`).
2.  Kết nối Database:
    *   Host: `db`
    *   Port: `5432`
    *   DB: `jfinder_db`
    *   User/Pass: `jfinder`/`jfinder_password`
3.  Tạo biểu đồ và Dashboard từ bảng `listings`.

### C. Sinh Dữ Liệu Mẫu Thủ Công
Nếu không muốn đợi n8n, bạn có thể chạy script python trực tiếp:

```bash
pip install pandas sqlalchemy psycopg2-binary
python scripts/generate_mock_data.py
```

---

## 📂 Cấu Trúc Dự Án

*   `app/`: Mã nguồn Next.js (Frontend).
*   `scripts/`: Mã nguồn Python (Crawler & Data Gen).
*   `crdt/`: Crawler Framework.
*   `docker-compose.yml`: Cấu hình hạ tầng.
*   `n8n_workflow.json`: Quy trình tự động hóa.

---

**Developed by Group 3 - MBTT**
