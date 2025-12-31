# Hướng dẫn cấu hình Mapbox Token

## ✅ Đã hoàn thành

- ✅ Tạo mock data cho 12 mặt bằng tại Hà Nội
- ✅ Map, Filter, Dashboard hoạt động với mock data
- ✅ Chat AI hoạt động với mock responses
- ✅ Không cần n8n backend

## 🗺️ Để Map hoạt động đầy đủ cần Mapbox Token

### Bước 1: Đăng ký Mapbox (MIỄN PHÍ)

1. Truy cập: https://account.mapbox.com/auth/signup/
2. Đăng ký tài khoản miễn phí (50,000 lượt tải bản đồ/tháng)
3. Xác nhận email

### Bước 2: Lấy Access Token

1. Đăng nhập vào: https://account.mapbox.com/
2. Vào mục **Access tokens**
3. Copy **Default public token** (bắt đầu bằng `pk.`)

### Bước 3: Cấu hình Token

Mở file `.env.local` và thay token:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=pk.YOUR_ACTUAL_TOKEN_HERE
```

### Bước 4: Restart Server

```bash
# Dừng server (Ctrl+C)
# Chạy lại:
npm run dev
```

## 🎯 Các trang hiện đang hoạt động

| Trang                      | Trạng thái   | Mô tả                                                |
| -------------------------- | ------------ | ---------------------------------------------------- |
| **Home** (/)               | ✅ Hoạt động | Trang giới thiệu với nội dung đề cương               |
| **Map** (/map)             | ⚠️ Cần token | Bản đồ với 12 mặt bằng, cần Mapbox token để hiển thị |
| **Filter** (/filter)       | ⚠️ Cần token | Tìm kiếm và lọc mặt bằng, cần Mapbox token           |
| **Dashboard** (/dashboard) | ✅ Hoạt động | Dashboard BI với biểu đồ thống kê                    |
| **Chat** (/chat)           | ✅ Hoạt động | AI Chatbot với mock responses                        |

## 📝 Dữ liệu Mock

File: `app/data/mockData.ts`

Chứa 12 mặt bằng mẫu với:

- Tọa độ GPS (lat, lng)
- Giá thuê (18-45 triệu/tháng)
- Diện tích (20-80 m²)
- Loại hình (Shophouse, Office, Kiosk)
- Hình ảnh placeholder
- Đánh giá (star rating)

## 🔧 Không có Mapbox Token?

Map vẫn hiển thị nhưng không có tiles (nền bản đồ). Chỉ thấy markers.

**Giải pháp tạm thời:** Sử dụng Dashboard hoặc Chat để demo chức năng.
