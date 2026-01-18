# Checklist Deploy Production

## ✅ Code đã được push

- Commit mới nhất: `5b38727` (23:02)
- Branch: `main`
- Status: Đã push lên GitHub

## 🔧 Cần cấu hình Vercel

### 1. Thêm Environment Variable

**QUAN TRỌNG**: Production cần backend API URL để load dữ liệu map!

Vào: https://vercel.com/jian131/grp3-mbtt/settings/environment-variables

**Thêm biến:**

```
Key:   NEXT_PUBLIC_API_BASE_URL
Value: https://unset-unfearing-dewayne.ngrok-free.dev/webhook
Environments: ✅ Production, ✅ Preview
```

Click **Save**.

### 2. Redeploy với cache clear

Vào: https://vercel.com/jian131/grp3-mbtt/deployments

1. Click vào deployment mới nhất (vừa trigger bởi commit `5b38727`)
2. **QUAN TRỌNG**: Click menu "..." → **"Redeploy"** → Chọn **"Clear build cache and redeploy"**

### 3. Đợi build xong (~2-3 phút)

Monitor tại: https://vercel.com/jian131/grp3-mbtt/deployments

### 4. Test production site

Sau khi deployment "Ready":

1. **Clear browser cache**: Ctrl+Shift+R (Windows) hoặc Cmd+Shift+R (Mac)
2. Vào trang search
3. Click "Tìm Kiếm Ngay"
4. Chuyển sang **Map view**
5. Routing panel sẽ xuất hiện bên trái với:
   - Background xám đậm (slate-800)
   - Viền cyan nổi bật
   - Title: "Chỉ đường tới mặt bằng"

## 🐛 Nếu vẫn không thấy

### Debug 1: Check backend URL

Mở console (F12) trên production site, xem log:

```
[DATA SOURCE] fetchListings using: https://...
```

- Nếu thấy `http://localhost:5678` → Environment variable chưa được set
- Nếu thấy `https://unset-unfearing-dewayne.ngrok-free.dev` → OK

### Debug 2: Check ngrok

Local terminal chạy:

```powershell
.\scripts\get_ngrok_url.ps1
```

Xem "Backend test:" có OK không.

### Debug 3: Hard refresh

- **Chrome/Edge**: Ctrl+Shift+Delete → Clear cache → OK
- **Firefox**: Ctrl+Shift+Delete → Cached Web Content → Clear Now

Sau đó Ctrl+Shift+R để hard refresh page.

## 📝 Các thay đổi đã deploy

1. ✅ Routing panel visibility enhancement (commit `569695d`)
   - Background: `bg-slate-800/95` (đậm hơn)
   - Border: `border-cyan-500/30` (nổi bật hơn)
   - Z-index: `z-[1001]` (cao hơn)
   - Buttons: `bg-slate-700` (rõ hơn)

2. ✅ Analysis page dropdown/input improvements (commit `aab0f1e`, `62decca`)
   - Dropdowns: `bg-slate-700` với border rõ ràng
   - Inputs: `bg-slate-700` thay vì transparent

3. ✅ Backend production docs (commit `a79e7d6`)
   - `docs/BACKEND_PRODUCTION.md`
   - `scripts/get_ngrok_url.ps1`

## ⚠️ Lưu ý quan trọng

**Routing panel CHỈ HIỂN THI khi:**

1. ✅ Backend URL đã được cấu hình trong Vercel
2. ✅ Ngrok đang chạy trên máy local (hoặc backend deployed lên cloud)
3. ✅ Đang ở **Map view** (không phải Grid view)
4. ✅ Có dữ liệu listings để hiển thị

Nếu thiếu bất kỳ điều kiện nào → Panel sẽ không có dữ liệu để hoạt động (dù code đã có).
