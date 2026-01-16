# BI Dashboard (Superset) Setup Guide

Hướng dẫn cấu hình Apache Superset để tích hợp với LocaFinder.

## 📋 Overview

BI Dashboard sử dụng Apache Superset để phân tích dữ liệu mặt bằng cho thuê.

### Hai chế độ hiển thị

| Mode     | Ưu điểm                          | Nhược điểm                      |
| -------- | -------------------------------- | ------------------------------- |
| `link`   | Luôn hoạt động, không cần config | Mở tab mới, UX kém hơn          |
| `iframe` | Tích hợp trong app, UX tốt       | Cần config CORS/X-Frame-Options |

**Khuyến nghị:** Sử dụng `link` mode cho demo, `iframe` cho production đã cấu hình.

## 🔧 Configuration

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPERSET_URL=http://localhost:8088
NEXT_PUBLIC_BI_MODE=link                    # 'link' hoặc 'iframe'
NEXT_PUBLIC_SUPERSET_DASHBOARD_PATH=/superset/dashboard/1/
```

### Switching Modes

Trong UI, người dùng có thể chuyển đổi giữa Link Mode và Embed Mode.

Hoặc set env var:

```bash
# Link mode (mặc định, an toàn)
NEXT_PUBLIC_BI_MODE=link

# Iframe mode (cần config Superset)
NEXT_PUBLIC_BI_MODE=iframe
```

## ⚠️ Vì sao Iframe bị chặn?

Trình duyệt chặn iframe vì các lý do bảo mật:

### 1. X-Frame-Options Header

```
X-Frame-Options: DENY
X-Frame-Options: SAMEORIGIN
```

Superset mặc định set `SAMEORIGIN`, chặn embed từ domain khác.

### 2. Content-Security-Policy (CSP)

```
Content-Security-Policy: frame-ancestors 'self'
```

Chặn trang được embed trong iframe từ domain khác.

### 3. Mixed Content

Nếu FE là HTTPS nhưng Superset là HTTP:

```
Mixed Content: The page was loaded over HTTPS, but requested an insecure frame
```

Browser tự động chặn.

### 4. SameSite Cookies

Superset cần cookies để authenticate. Cookies với `SameSite=Strict` hoặc `Lax` không được gửi trong iframe cross-origin.

## ✅ Cách Fix (cho Iframe Mode)

### Option 1: Sửa superset_config.py

File `superset_config.py` đã được cấu hình:

```python
# Enable embedding in iframes
HTTP_HEADERS = {'X-Frame-Options': 'ALLOWALL'}

# Enable CORS
ENABLE_CORS = True
CORS_OPTIONS = {
    'supports_credentials': True,
    'allow_headers': ['*'],
    'resources': ['*'],
    'origins': ['http://localhost:3000', 'http://127.0.0.1:3000']
}

# Enable standalone mode for embedding
EMBEDDED_SUPERSET = True

# Disable CSRF for embedded dashboards
WTF_CSRF_ENABLED = False
```

**Thêm FE domain vào origins:**

```python
CORS_OPTIONS = {
    ...
    'origins': [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://your-app.vercel.app',  # Thêm Vercel domain
    ]
}
```

### Option 2: Disable Talisman (CSP)

Superset sử dụng Flask-Talisman cho CSP. Để disable:

```python
# superset_config.py
TALISMAN_ENABLED = False

# Hoặc cấu hình cụ thể
TALISMAN_CONFIG = {
    'content_security_policy': {
        'frame-ancestors': ['*'],  # Allow all origins
    }
}
```

### Option 3: Use Guest Token (Secure Embedding)

Superset 2.0+ hỗ trợ Guest Tokens cho secure embedding:

```python
# superset_config.py
GUEST_ROLE_NAME = "Public"
GUEST_TOKEN_JWT_SECRET = "your-secret-key-change-this"
GUEST_TOKEN_JWT_ALGO = "HS256"
GUEST_TOKEN_HEADER_NAME = "X-GuestToken"
GUEST_TOKEN_JWT_EXP_SECONDS = 300
```

Cần implement guest token flow trong FE (phức tạp hơn).

### Option 4: Reverse Proxy (Nginx/Caddy)

Dùng reverse proxy để inject headers:

```nginx
# nginx.conf
location /superset/ {
    proxy_pass http://superset:8088/;
    proxy_hide_header X-Frame-Options;
    add_header X-Frame-Options "ALLOWALL";
    add_header Content-Security-Policy "frame-ancestors *";
}
```

## 🔄 Restart Superset

Sau khi sửa config:

```bash
# Restart container
docker-compose restart superset

# Hoặc rebuild
docker-compose up -d --build superset
```

## 📊 Tạo Dashboard trong Superset

### 1. Đăng nhập

- URL: http://localhost:8088
- Username: `admin`
- Password: `admin123`

### 2. Import Data

**Option A: PostgreSQL (Recommended)**

```bash
# Chạy script import
python scripts/import_to_postgres.py
```

Sau đó trong Superset:

1. Settings → Database Connections → + Database
2. Chọn PostgreSQL
3. Connection string: `postgresql://jfinder:jfinder_password@postgres:5432/jfinder_db`

**Option B: CSV Upload**

1. Download CSV: http://localhost:3000/api/export?format=csv
2. Superset → Data → Upload a CSV
3. Upload file

### 3. Tạo Charts

1. Charts → + Chart
2. Chọn dataset `rental_listings`
3. Chọn loại chart (Bar, Pie, Line, Table, Map...)
4. Cấu hình dimensions, metrics
5. Save

### 4. Tạo Dashboard

1. Dashboards → + Dashboard
2. Kéo thả charts vào
3. Arrange layout
4. Save
5. Note: Dashboard ID (trong URL) để cấu hình `NEXT_PUBLIC_SUPERSET_DASHBOARD_PATH`

## 🐛 Troubleshooting

### Iframe blank/không load

1. Mở DevTools (F12) → Console
2. Tìm lỗi liên quan đến:
   - `X-Frame-Options`
   - `Content-Security-Policy`
   - `Mixed Content`
3. Kiểm tra Network tab xem request có bị block

### Superset không khởi động

```bash
# Check logs
docker-compose logs superset

# Common issues:
# - Database not ready: wait for postgres to start first
# - Permission issues: check superset_data volume
```

### CORS errors

```bash
# Check superset_config.py
# Ensure FE origin is in CORS_OPTIONS['origins']
```

### Session/Auth issues

Iframe cross-origin không gửi cookies mặc định.

**Workaround:**

- Dùng Guest Token
- Hoặc public dashboards (không auth)
- Hoặc link mode (recommended)

## 📱 Demo Recommendations

Cho demo, recommend:

1. **Dùng Link Mode** - Luôn hoạt động
2. **Chạy Superset local** - http://localhost:8088
3. **Tạo sẵn dashboard** - Import data, tạo charts
4. **Mở Superset riêng** - Show iframe trong app, demo full features ở tab riêng

## 📚 Related Docs

- [Vercel Deployment](./vercel_deploy.md)
- [Superset Documentation](https://superset.apache.org/docs/)
- [Superset Embedded](https://superset.apache.org/docs/security/#embedded-dashboards)
