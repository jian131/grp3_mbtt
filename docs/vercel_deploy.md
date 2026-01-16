# Vercel Deployment Guide

Hướng dẫn deploy ứng dụng LocaFinder (Next.js) lên Vercel.

## 📋 Prerequisites

1. Tài khoản [Vercel](https://vercel.com)
2. Repository trên GitHub/GitLab/Bitbucket
3. Backend n8n đang chạy (local hoặc deployed)

## 🚀 Quick Deploy

### Option 1: Deploy via Vercel Dashboard

1. **Import Project**

   - Truy cập [vercel.com/new](https://vercel.com/new)
   - Chọn "Import Git Repository"
   - Authorize và chọn repo `grp3_mbtt`

2. **Configure Project**

   - Framework Preset: `Next.js`
   - Root Directory: `./` (hoặc `grp3_mbtt` nếu là subfolder)
   - Build Command: `npm run build`
   - Output Directory: `.next`

3. **Set Environment Variables**

   - Xem phần [Environment Variables](#-environment-variables) bên dưới

4. **Deploy**
   - Click "Deploy"
   - Chờ build hoàn tất (~2-3 phút)

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (từ thư mục grp3_mbtt)
cd grp3_mbtt
vercel

# Deploy to production
vercel --prod
```

## 🔑 Environment Variables

Set các biến sau trong Vercel Dashboard → Settings → Environment Variables:

| Variable                              | Required | Description             | Example                           |
| ------------------------------------- | -------- | ----------------------- | --------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`            | ✅       | n8n webhook URL (HTTPS) | `https://abc123.ngrok.io/webhook` |
| `NEXT_PUBLIC_SUPERSET_URL`            | ⚠️       | Superset URL            | `http://localhost:8088`           |
| `NEXT_PUBLIC_BI_MODE`                 | ❌       | `iframe` or `link`      | `link` (recommended)              |
| `NEXT_PUBLIC_SUPERSET_DASHBOARD_PATH` | ❌       | Dashboard path          | `/superset/dashboard/1/`          |
| `NEXT_PUBLIC_ENABLE_HEALTH_CHECK`     | ❌       | Enable health check     | `true`                            |
| `NEXT_PUBLIC_MAPBOX_TOKEN`            | ❌       | Mapbox API token        | `pk.xxx...`                       |

### Quan trọng về `NEXT_PUBLIC_API_BASE_URL`

Khi FE chạy trên Vercel (HTTPS), backend n8n phải:

- Được expose qua HTTPS (bắt buộc, browser chặn mixed content)
- Cho phép CORS từ domain Vercel

**Các cách expose n8n local:**

#### 1. Ngrok (Đơn giản nhất)

```bash
# Install ngrok
# Windows: choco install ngrok
# Mac: brew install ngrok

# Expose n8n (port 5678)
ngrok http 5678

# Output:
# Forwarding https://abc123.ngrok.io -> http://localhost:5678
```

Copy URL `https://abc123.ngrok.io` và thêm `/webhook`:

```
NEXT_PUBLIC_API_BASE_URL=https://abc123.ngrok.io/webhook
```

#### 2. Cloudflare Tunnel (Free, stable URL)

```bash
# Install cloudflared
# https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/

# Quick tunnel
cloudflared tunnel --url http://localhost:5678

# Named tunnel (stable URL)
cloudflared tunnel create n8n-tunnel
cloudflared tunnel route dns n8n-tunnel n8n.yourdomain.com
cloudflared tunnel run n8n-tunnel
```

#### 3. Deploy n8n lên cloud

- [Railway](https://railway.app) - 1-click deploy
- [Render](https://render.com)
- [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform)

## 📁 Project Structure for Vercel

```
grp3_mbtt/
├── app/                  # Next.js App Router
│   ├── api/             # API Routes (proxy, health check)
│   │   ├── proxy/       # Proxy to backend (bypass CORS)
│   │   ├── health/      # Health check endpoint
│   │   ├── roi/         # ROI calculator (fallback)
│   │   └── valuation/   # Valuation (fallback)
│   ├── bi-dashboard/    # BI Dashboard page
│   └── ...
├── lib/                  # Shared utilities
│   ├── api.ts           # API client
│   └── config.ts        # Configuration
├── .env.local           # Local env (not committed)
├── .env.example         # Example env
└── package.json
```

## 🔄 API Proxy

Ứng dụng có built-in proxy tại `/api/proxy/*` để bypass CORS:

- `GET /api/proxy/search` → `GET {API_BASE_URL}/search`
- `POST /api/proxy/roi` → `POST {API_BASE_URL}/roi`

Trong production (`NODE_ENV=production`), `lib/api.ts` tự động sử dụng proxy.

## 🔍 Verifying Deployment

### 1. Check Build Status

- Vercel Dashboard → Deployments
- Xem build logs để debug lỗi

### 2. Test Endpoints

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Proxy test (nếu backend đang chạy)
curl https://your-app.vercel.app/api/proxy/search?limit=1
```

### 3. Check Pages

- Home: `https://your-app.vercel.app/`
- Search: `https://your-app.vercel.app/search`
- BI Dashboard: `https://your-app.vercel.app/bi-dashboard`
- Analysis: `https://your-app.vercel.app/analysis`

## ⚠️ Troubleshooting

### Build fails

```bash
# Test build locally
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

### API calls fail (CORS)

1. Đảm bảo dùng HTTPS cho `NEXT_PUBLIC_API_BASE_URL`
2. Kiểm tra n8n CORS settings
3. Sử dụng proxy: requests sẽ đi qua `/api/proxy/*`

### Backend offline banner hiện

1. Kiểm tra ngrok/tunnel còn chạy không
2. Kiểm tra n8n container: `docker-compose ps`
3. Refresh page sau khi bật lại backend

### BI Dashboard blank

Xem [docs/bi_superset.md](./bi_superset.md) để biết cách fix.

## 📱 Demo Workflow

Khi demo cho người khác:

1. **Bật backend locally:**

   ```bash
   cd grp3_mbtt
   docker-compose up -d n8n postgres
   ngrok http 5678
   ```

2. **Update Vercel env:**

   - Copy ngrok URL
   - Update `NEXT_PUBLIC_API_BASE_URL` trong Vercel
   - Redeploy (hoặc chờ auto-redeploy)

3. **Share link:**

   - `https://your-app.vercel.app`

4. **Lưu ý:**
   - Ngrok free có rate limit
   - URL ngrok thay đổi mỗi lần restart
   - Có thể dùng Cloudflare Tunnel cho stable URL

## 🔐 Security Notes

- Không commit `.env.local` lên git
- Sử dụng Vercel Environment Variables cho secrets
- Ngrok URLs là public, ai có link đều access được n8n
- Trong production thực, cần authentication cho n8n webhooks

## 📚 Related Docs

- [BI Dashboard Setup](./bi_superset.md)
- [Architecture](./ARCHITECTURE.md)
- [Testing](./TESTING.md)
