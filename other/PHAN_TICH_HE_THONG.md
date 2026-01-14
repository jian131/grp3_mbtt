# PHÂN TÍCH CHI TIẾT HỆ THỐNG SMART RENTAL DSS (GRP3_MBTT)

Tài liệu này cung cấp phân tích sâu về cấu trúc, công nghệ và luồng hoạt động của hệ thống hỗ trợ ra quyết định thuê mặt bằng (Smart Rental DSS).

## 1. Tổng Quan Hệ Thống
Hệ thống là một ứng dụng web (Web Application) được xây dựng trên nền tảng **Next.js**, tập trung vào việc cung cấp thông tin, phân tích địa điểm và định giá mặt bằng cho thuê thông qua các thuật toán và dữ liệu thị trường (giả lập hoặc thực tế).

Điểm đặc biệt của kiến trúc này là việc sử dụng **n8n (Workflow Automation)** đóng vai trò như một **Backend API/Logic Layer**, giúp xử lý các nghiệp vụ phức tạp và AI valuation mà không cần một server backend truyền thống (như Express hay NestJS) trong giai đoạn này.

## 2. Cấu Trúc Thư Mục
Dự án được tổ chức theo cấu trúc tiêu chuẩn của Next.js App Router (v15+):

- **`/app`**: Chứa source code chính của ứng dụng Frontend (Pages, Layouts, Routing).
  - `page.tsx`: Landing page.
  - `search/`: Trang tìm kiếm và hiển thị bản đồ (Map/Grid view).
  - `listing/[id]/`: Trang chi tiết mặt bằng.
  - `dashboard/`, `bi-dashboard/`: Các trang quản trị và báo cáo thông minh.
  - `landlord/`: Phân hệ dành cho chủ nhà.
- **`/components`**: Chứa các UI Components tái sử dụng (Map, Charts, Cards).
- **`/lib`**: Chứa các hàm tiện ích và cấu hình API.
  - `api.ts`: File quan trọng nhất định nghĩa việc giao tiếp với Backend (n8n).
- **`/postgres_init`**: Chứa script khởi tạo cơ sở dữ liệu PostgreSQL (`init.sql`).
- **`n8n_backend.json`**: File định nghĩa toàn bộ logic backend ("No-code/Low-code backend").
- **`mockListings.json`**: Dữ liệu giả lập cho các mặt bằng.

## 3. Công Nghệ Sử Dụng

### Frontend
- **Framework**: Next.js 16.0.1 (React 19.2.0).
- **Styling**: Tailwind CSS v4.
- **Maps**: Leaflet, React-Leaflet, Mapbox GL (Hiển thị bản đồ và heatmap).
- **Icons**: Lucide React.
- **Charts**: Recharts (Biểu đồ thống kê).

### Backend & Data
- **Logic / API Gateway**: n8n (Workflow Automation Tool).
- **Database**: 
  - File-based (`/data/listings.json` được n8n đọc).
  - PostgreSQL (có cấu hình `postgres_init` nhưng logic hiện tại chủ yếu qua n8n).
- **AI/Algorithm**: Logic định giá và chấm điểm tiềm năng được viết bằng JavaScript Code Nodes bên trong n8n workflows.

## 4. Phân Tích Chuyên Sâu Backend & Luồng Dữ Liệu

Hệ thống **không sử dụng** mô hình Backend Controller-Service truyền thống (như Express/Java Spring) mà sử dụng **n8n Workflow** làm backend.

### Kiến trúc "n8n as a Backend"
File `lib/api.ts` đóng vai trò là Client SDK, gọi đến các Webhook của n8n.
Mỗi endpoint trong `lib/api.ts` tương ứng với một nhánh trong `n8n_backend.json`:

1.  **`GET /listings` (Fetch Listings)**
    - **Trigger**: Webhook `GET /listings`.
    - **Logic**: Node `Code` trong n8n đọc file JSON, thực hiện filter (theo quận, giá, loại), phân trang.
    - **Response**: Trả về danh sách JSON các mặt bằng đã lọc.

2.  **`POST /valuation` (AI Valuation)**
    - **Trigger**: Webhook `POST /valuation`.
    - **Logic**:
        - Nhận input: Quận, diện tích, mặt tiền, số tầng.
        - Thuật toán (viết trong n8n): Dựa trên giá cơ sở từng quận (ví dụ: Hoàn Kiếm 120tr, Hà Đông 50tr) + hệ số điều chỉnh (diện tích, mặt tiền).
        - Tính điểm tiềm năng (Random/Heuristic score).
    - **Response**: Giá gợi ý, dải giá, điểm tiềm năng, rủi ro.

3.  **`POST /roi` (ROI Calculator)**
    - **Trigger**: Webhook `POST /roi`.
    - **Logic**: Tính toán lợi nhuận/thua lỗ dựa trên giá thuê, chi phí vận hành, lượng khách dự kiến.

4.  **`GET /stats` & `GET /districts`**
    - Trả về dữ liệu thống kê tổng hợp hard-coded hoặc tính toán từ dữ liệu thô.

**Ưu điểm của mô hình này**: Triển khai cực nhanh, dễ sửa logic thuật toán mà không cần redeploy backend code.

## 5. Dữ Liệu Sử Dụng

### Mô hình dữ liệu chính (Listings)
### Mô hình dữ liệu chính (Listings)
Dữ liệu mặt bằng bao gồm các trường chi tiết, được chia theo nhóm chức năng:

**1. Thông tin cơ bản (Identity & Location)**
- `id` (Mã định danh): Key duy nhất định danh mặt bằng.
- `name` (Tên mặt bằng): Tiêu đề hiển thị ngắn gọn.
- `address` (Địa chỉ), `ward` (Phường), `district` (Quận): Xác định vị trí hành chính.
- `latitude`, `longitude` (Tọa độ): Vị trí chính xác trên bản đồ, dùng để tính toán bán kính tìm kiếm và heatmap.

**2. Thông số kỹ thuật (Specs)**
- `price` (Giá thuê - Triệu VNĐ): Chi phí thuê hàng tháng.
- `area` (Diện tích - m²): Tổng diện tích sử dụng.
- `frontage` (Mặt tiền - m): Độ rộng mặt tiền tiếp xúc đường, yếu tố quan trọng cho bán lẻ.
- `floors` (Số tầng): Quy mô kết cấu.
- `type` (Loại hình): `shophouse` (nhà phố), `kiosk` (ki-ốt), `office` (văn phòng), `retail` (bán lẻ nói chung).
- `images` (Hình ảnh): Danh sách URL ảnh thực tế.

**3. Chỉ số phân tích AI (AI Metrics)**
- `amenities_schools`, `amenities_offices`: Số lượng trường học/văn phòng trong bán kính gần, chỉ số cầu tiềm năng.
- `amenities_competitors`: Số lượng đối thủ cạnh tranh cùng ngành hàng gần đó.
- `ai_suggested_price` (Giá AI gợi ý): Mức giá tham chiếu dựa trên dữ liệu thị trường và vị trí.
- `ai_potential_score` (Điểm tiềm năng): Thang điểm 0-100 đánh giá khả năng sinh lời.
- `ai_risk_level` (Mức độ rủi ro): `low` (thấp), `medium` (trung bình), `high` (cao).

**4. Tương tác & Metadata (Engagement)**
- `views` (Lượt xem): Mức độ quan tâm của cộng đồng.
- `savedCount` (Lượt lưu): Số lượng người dùng quan tâm đặc biệt.
- `posted_at` (Ngày đăng): Thời gian tin bắt đầu hiển thị.
- `owner` (Chủ sở hữu): Object chứa `name`, `phone` để liên hệ.

### Nguồn dữ liệu
- Hiện tại hệ thống đang sử dụng dữ liệu tĩnh hoặc file JSON (`/data/listings.json`) được mount vào n8n container để phục vụ truy vấn.
- `postgres_init/init.sql` cho thấy kế hoạch chuyển sang PostgreSQL với bảng `listings` có cấu trúc tương tự.

## 6. Các Chức Năng Chính (Features)

1.  **Tìm kiếm & Lọc Mặt Bằng (Search Engine)**:
    - Lọc theo Quận, Loại hình, Giá, Diện tích.
    - Hiển thị dạng Lưới (Grid) hoặc Bản đồ (Map).

2.  **Bản đồ Heatmap (Rental Heatmap)**:
    - Trực quan hóa độ "nóng" của thị trường trên bản đồ số.
    - Hiển thị vị trí các mặt bằng.

3.  **Định giá AI (AI Valuation)**:
    - Nhập thông số mặt bằng -> Hệ thống đề xuất giá thuê hợp lý.
    - Đánh giá rủi ro và tiềm năng kinh doanh.

4.  **Phân tích ROI (Return on Investment)**:
    - Công cụ tính toán bài toán kinh doanh cho người thuê.

5.  **Dashboard Thống kê (Market Intelligence)**:
    - Biểu đồ giá trung bình theo quận.
    - Phân bổ nguồn cung.

## 7. Kết Luận
Hệ thống **Smart Rental DSS** là một ứng dụng hiện đại, tối ưu hóa cho việc ra quyết định nhanh. Việc sử dụng **n8n** làm backend là một cách tiếp cận sáng tạo cho việc prototyping và xử lý logic phức tạp (như valuation models) một cách linh hoạt. Frontend sử dụng stack mới nhất (Next.js 16 + Tailwind 4) đảm bảo hiệu năng và trải nghiệm người dùng mượt mà.
