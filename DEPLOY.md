# Vercel Deployment Quick Start

## 🚀 Automated Deploy Helper

```bash
# Chạy script tự động
npm run deploy:setup
```

Script sẽ:

- ✓ Check Docker services
- ✓ Start ngrok tunnel
- ✓ Test backend
- ✓ Hiển thị env vars để copy vào Vercel

## 📋 Manual Deploy Steps

### 1. Start Backend + Ngrok

```bash
# Terminal 1: Start services
docker-compose up -d

# Terminal 2: Start ngrok
ngrok http 5678

# Copy HTTPS URL (ví dụ: https://abc123.ngrok.io)
```

### 2. Deploy to Vercel

#### Option A: Dashboard (Recommended)

1. Go to https://vercel.com/new
2. Import `jian131/grp3_mbtt`
3. Add Environment Variables:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://abc123.ngrok.io/webhook
   NEXT_PUBLIC_BI_MODE=link
   NEXT_PUBLIC_ENABLE_HEALTH_CHECK=true
   ```
4. Click **Deploy**

#### Option B: CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Enter env vars when prompted
```

### 3. Verify Deployment

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Proxy test
curl https://your-app.vercel.app/api/proxy/search?limit=1
```

### 4. Test Pages

- Home: `https://your-app.vercel.app/`
- Search: `https://your-app.vercel.app/search`
- BI Dashboard: `https://your-app.vercel.app/bi-dashboard`
- Analysis: `https://your-app.vercel.app/analysis`

## ⚠️ Important Notes

- **Keep ngrok running** while demo
- Ngrok free: URL thay đổi mỗi lần restart
- For stable URL: Use Cloudflare Tunnel hoặc deploy n8n

## 🔧 Troubleshooting

### Build fails

```bash
npm run build
# Fix errors, push, redeploy
```

### Backend offline banner shows

- Check ngrok is running
- Check n8n container: `docker-compose ps`
- Verify URL in Vercel env vars

### CORS errors

- Ensure using HTTPS for API_BASE_URL
- Proxy sẽ tự động handle CORS

## 📚 Full Documentation

See [docs/vercel_deploy.md](../docs/vercel_deploy.md) for complete guide.
