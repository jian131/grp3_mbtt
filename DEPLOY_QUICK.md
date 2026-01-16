# 🚀 Deploy LocaFinder lên Vercel - HƯỚNG DẪN NHANH

## Bước 1: Cài đặt Ngrok

### Option A: Chocolatey (Recommended)

```powershell
choco install ngrok
```

### Option B: Manual Download

1. Download: https://ngrok.com/download
2. Giải nén vào `C:\Program Files\ngrok\`
3. Add vào PATH

### Option C: Skip Ngrok (dùng Cloudflare Tunnel)

```powershell
# Install cloudflared
# https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/

# Quick tunnel
cloudflared tunnel --url http://localhost:5678
```

---

## Bước 2: Start Backend + Expose qua HTTPS

### Terminal 1: Docker Services

```powershell
cd c:\Users\User\OneDrive\Documents\VSCode\HTTM\grp3_mbtt
docker-compose up -d
docker-compose ps  # Verify n8n running
```

### Terminal 2: Ngrok/Tunnel

```powershell
# Ngrok
ngrok http 5678

# Hoặc Cloudflare Tunnel
cloudflared tunnel --url http://localhost:5678
```

**COPY HTTPS URL** hiển thị, ví dụ:

- Ngrok: `https://abc123.ngrok.io`
- Cloudflare: `https://xyz.trycloudflare.com`

---

## Bước 3: Test Backend qua Tunnel

```powershell
# Thay YOUR_URL bằng URL từ bước 2
curl https://YOUR_URL/webhook/search?limit=1

# Ví dụ:
curl https://abc123.ngrok.io/webhook/search?limit=1
```

Phải thấy JSON response với listings.

---

## Bước 4: Deploy lên Vercel

### Option A: Dashboard (Dễ nhất)

1. **Truy cập:** https://vercel.com/new

2. **Import Repository:**

   - Connect GitHub
   - Chọn repository: `jian131/grp3_mbtt`
   - Root Directory: `./`

3. **Framework Settings:**

   - Framework Preset: `Next.js`
   - Build Command: `npm run build`
   - Output Directory: `.next`

4. **Environment Variables** - Click "Add":

   | Variable                          | Value                      |
   | --------------------------------- | -------------------------- |
   | `NEXT_PUBLIC_API_BASE_URL`        | `https://YOUR_URL/webhook` |
   | `NEXT_PUBLIC_BI_MODE`             | `link`                     |
   | `NEXT_PUBLIC_ENABLE_HEALTH_CHECK` | `true`                     |
   | `NEXT_PUBLIC_SUPERSET_URL`        | `http://localhost:8088`    |

   **QUAN TRỌNG:** Thay `YOUR_URL` bằng URL ngrok/cloudflare của bạn!

5. **Click Deploy** và chờ ~2-3 phút

### Option B: CLI

```powershell
# Install Vercel CLI (một lần)
npm install -g vercel

# Login
vercel login

# Deploy (từ thư mục grp3_mbtt)
cd c:\Users\User\OneDrive\Documents\VSCode\HTTM\grp3_mbtt
vercel

# Khi được hỏi env vars, nhập:
# NEXT_PUBLIC_API_BASE_URL? https://YOUR_URL/webhook
# NEXT_PUBLIC_BI_MODE? link
# NEXT_PUBLIC_ENABLE_HEALTH_CHECK? true

# Deploy to production
vercel --prod
```

---

## Bước 5: Verify Deployment

### Check Vercel Dashboard

- Status: `Ready`
- Domains: Copy production URL (vd: `https://grp3-mbtt.vercel.app`)

### Test Endpoints

```powershell
# Thay YOUR_APP bằng Vercel URL
$APP = "https://grp3-mbtt.vercel.app"

# Health check
curl "$APP/api/health"
# Expected: {"status":"healthy",...}

# Proxy test
curl "$APP/api/proxy/search?limit=1"
# Expected: JSON array với listings
```

### Test Pages (trong browser)

✅ Home: `https://YOUR_APP.vercel.app/`
✅ Search: `https://YOUR_APP.vercel.app/search`
✅ BI Dashboard: `https://YOUR_APP.vercel.app/bi-dashboard`
✅ Analysis: `https://YOUR_APP.vercel.app/analysis`
✅ Listing Detail: `https://YOUR_APP.vercel.app/listing/LISTING_HN_000001`

---

## 🧪 Final Checklist

- [ ] Docker containers running (`docker-compose ps`)
- [ ] Ngrok/tunnel active và có HTTPS URL
- [ ] Backend responding qua tunnel
- [ ] Vercel build successful
- [ ] Health check endpoint returns `{"status":"healthy"}`
- [ ] Home page loads
- [ ] Search page shows listings
- [ ] BI Dashboard có nút "Mở Dashboard BI"
- [ ] Backend offline banner KHÔNG hiện (nếu hiện = ngrok/backend issue)

---

## ⚠️ Troubleshooting

### Backend Offline Banner hiện

**Nguyên nhân:** Frontend không connect được tới backend

**Fix:**

1. Check ngrok/tunnel vẫn running
2. Check URL trong Vercel env vars đúng
3. Test trực tiếp: `curl https://YOUR_URL/webhook/search?limit=1`
4. Redeploy Vercel nếu đã đổi URL

### Build fails trên Vercel

```powershell
# Test build locally
cd c:\Users\User\OneDrive\Documents\VSCode\HTTM\grp3_mbtt
npm run build

# Fix errors, commit, push
git add .
git commit -m "Fix build"
git push origin main

# Vercel auto redeploy
```

### CORS errors

Không vấn đề! API proxy (`/api/proxy/*`) tự động handle CORS.

### Ngrok URL thay đổi

Ngrok free thay đổi URL mỗi lần restart.

**Solution:**

1. Restart ngrok → copy new URL
2. Update Vercel env var `NEXT_PUBLIC_API_BASE_URL`
3. Redeploy hoặc chờ auto-redeploy

**Better:** Dùng Cloudflare Tunnel (stable URL)

---

## 📱 Demo Tips

1. **Prepare trước:**

   - Start all services: `docker-compose up -d`
   - Start ngrok TRƯỚC khi demo
   - Deploy Vercel TRƯỚC khi demo
   - Test all pages

2. **During demo:**

   - Mở Vercel URL
   - Show features: Search, BI Dashboard, Analysis
   - Keep ngrok terminal visible (show it's tunneling)

3. **Backup plan:**
   - Nếu Vercel chậm: Show localhost (`npm run dev`)
   - Nếu ngrok down: Deploy n8n lên Railway/Render

---

## 🎉 Success!

Khi tất cả checkmarks ✅ hoàn thành:

**FE trên Vercel:** `https://YOUR_APP.vercel.app`
**BE qua tunnel:** `https://YOUR_URL.ngrok.io`
**Offline banner:** Không hiện (backend online)
**BI Dashboard:** Link mode hoạt động

**SHARE LINK:** `https://YOUR_APP.vercel.app` 🚀

---

Need help? Check [docs/vercel_deploy.md](docs/vercel_deploy.md) or [DEPLOY.md](DEPLOY.md)
