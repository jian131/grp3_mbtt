# Cấu hình Backend cho Production (Vercel)

## Vấn đề hiện tại

Production site trên Vercel **không có backend n8n**, nên:

- Map không load được dữ liệu
- Routing panel không hoạt động (dù đã có trong code)
- Banner "Backend Offline" xuất hiện

## Giải pháp tạm thời: Dùng ngrok

### Bước 1: Đảm bảo ngrok đang chạy local

```powershell
# Ngrok URL hiện tại:
https://unset-unfearing-dewayne.ngrok-free.dev
```

### Bước 2: Cấu hình Vercel Environment Variable

1. Vào Vercel Dashboard: https://vercel.com/jian131/grp3-mbtt
2. Chọn project **grp3_mbtt**
3. Vào **Settings** → **Environment Variables**
4. Thêm biến mới:
   - **Key**: `NEXT_PUBLIC_API_BASE_URL`
   - **Value**: `https://unset-unfearing-dewayne.ngrok-free.dev/webhook`
   - **Environments**: ✅ Production, ✅ Preview, ⬜ Development

5. **Redeploy**:
   - Vào tab **Deployments**
   - Click vào deployment mới nhất
   - Click **"Redeploy"** button

### Bước 3: Kiểm tra

Sau khi redeploy xong, test:

1. Vào trang search trên production
2. Thử tìm kiếm → map sẽ hiện dữ liệu
3. Panel "Chỉ đường tới mặt bằng" sẽ xuất hiện bên trái map

## ⚠️ Lưu ý với ngrok

- **Ngrok URL thay đổi** mỗi khi restart → Phải update lại Vercel env var
- **Ngrok chỉ chạy khi máy local bật** → Production phụ thuộc vào máy local
- **Không phù hợp cho production thực sự**

## Giải pháp lâu dài: Deploy n8n lên cloud

### Option 1: Fly.io (Miễn phí tier đủ dùng)

```bash
# Install flyctl
flyctl launch --name jfinder-n8n --region sin

# Deploy n8n
flyctl deploy
```

### Option 2: Railway.app (Dễ dùng, $5/month)

1. Connect GitHub repo
2. Deploy từ `docker-compose.yml`
3. Expose n8n port 5678

### Option 3: DigitalOcean App Platform ($5/month)

1. Create new app from Docker Hub
2. Image: `n8nio/n8n`
3. Mount volume cho `/home/node/.n8n`

Sau khi deploy n8n lên cloud, update Vercel env var với URL mới:

```
NEXT_PUBLIC_API_BASE_URL=https://your-n8n-instance.fly.dev/webhook
```

## Kiểm tra backend đang dùng URL nào

Trong production console (F12), xem log:

```
[DATA SOURCE] fetchListings using: https://...
```

Nếu thấy `http://localhost:5678` → Backend chưa được cấu hình đúng.
