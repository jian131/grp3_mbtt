# Hướng dẫn Tích hợp Hệ sinh thái JFinder (n8n + Superset + Next.js)

Tài liệu này hướng dẫn cách vận hành mô hình "3 Nhà" (Backend, Automation, Frontend) như đề cương.

## 1. Khởi động Hạ tầng (Infrastructure)

Chúng ta sử dụng Docker để chạy các service nền tảng mà không cần cài đặt rườm rà.

### Bước 1: Cài đặt Docker Desktop
Nếu chưa có, hãy cài đặt Docker Desktop cho Windows. Bật ứng dụng lên.

### Bước 2: Chạy Stack công nghệ
Mở terminal tại thư mục gốc dự án (`grp3_mbtt`) và chạy:

```bash
docker-compose up -d
```

### Bước 3: Truy cập các công cụ
Sau khi container khởi động xong (đợi khoảng 2-3 phút cho Superset):

1.  **n8n Automation**: `http://localhost:5678`
    *   User/Pass: `admin` / `admin`
2.  **Superset BI**: `http://localhost:8088`
    *   User/Pass mặc định: `admin` / `admin` (Cần chạy lệnh setup lần đầu, xem mục dưới).
3.  **PostgreSQL**: `localhost:5432`
    *   User/Pass: `jfinder` / `jfinder_password`

---

## 2. Cấu hình Superset lần đầu (Chỉ làm 1 lần)

Để đăng nhập vào Superset, bạn cần tạo tài khoản admin. Chạy các lệnh sau trong terminal:

```bash
# 1. Tạo tài khoản admin
docker exec -it grp3_mbtt-superset-1 superset fab create-admin --username admin --firstname Superset --lastname Admin --email admin@jfinder.com --password admin

# 2. Nâng cấp DB
docker exec -it grp3_mbtt-superset-1 superset db upgrade

# 3. Khởi tạo
docker exec -it grp3_mbtt-superset-1 superset init
```

---

## 3. Cách tích hợp vào Next.js (JFinder App)

### Cách 1: Nguồn dữ liệu (Database)
Hiện tại JFinder đang dùng `mockListings.ts`. Khi có Database thật:
1.  Dùng **Prisma** hoặc **TypeORM** trong Next.js để kết nối `localhost:5432`.
2.  Thay thế các hàm trong `mockListings.ts` bằng các câu lệnh truy vấn DB thật.

### Cách 2: Nhúng Dashboard Superset vào Web Portal
Trong file `app/dashboard/page.tsx` hoặc `app/landlord/page.tsx`:

Thay vì tự vẽ biểu đồ bằng code (khó và lâu), bạn dùng thẻ `iframe` trỏ về Superset:

```tsx
// Ví dụ nhúng Dashboard Timeline
<div className="w-full h-[600px] glass-card rounded-2xl overflow-hidden">
  <iframe
    src="http://localhost:8088/superset/dashboard/p/xxxx/?standalone=true" // Link từ Superset
    width="100%"
    height="100%"
    className="border-0"
  ></iframe>
</div>
```

**Lợi ích:** Bạn sửa biểu đồ trong Superset, trên Web App tự động cập nhật theo mà không cần sửa code React.

---

## 4. Cách n8n tự động hóa
Trong n8n, bạn tạo một quy trình (Workflow) như sau để thực hiện đề cương đề tài:

1.  **Node "Schedule"**: Chạy mỗi ngày lúc 00:00.
2.  **Node "Execute Command"**: Chạy script python crawl dữ liệu.
    *   Command: `python /scripts/generate_mock_data.py` (hoặc crawler thật).
3.  **Node "Read File"**: Đọc file JSON kết quả.
4.  **Node "Postgres"**: Insert dữ liệu vào bảng `listings` trong Database `jfinder_db`.

-> Lúc này, Database có dữ liệu -> Superset tự vẽ biểu đồ -> Next.js tự hiển thị dữ liệu mới nhất.
