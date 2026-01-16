# ====================================
# DEPLOY HELPER SCRIPT
# ====================================
# Hướng dẫn deploy LocaFinder lên Vercel

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  LocaFinder - Vercel Deploy Helper" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if docker-compose is running
Write-Host "[1/5] Checking Docker services..." -ForegroundColor Yellow
$dockerStatus = docker-compose ps --services --filter "status=running" 2>&1
if ($dockerStatus -match "n8n") {
  Write-Host "✓ n8n is running" -ForegroundColor Green
}
else {
  Write-Host "✗ n8n is NOT running" -ForegroundColor Red
  Write-Host "  Start it: docker-compose up -d" -ForegroundColor Yellow
  exit 1
}

# Check if ngrok is installed
Write-Host ""
Write-Host "[2/5] Checking ngrok..." -ForegroundColor Yellow
$ngrokInstalled = Get-Command ngrok -ErrorAction SilentlyContinue
if ($ngrokInstalled) {
  Write-Host "✓ ngrok is installed" -ForegroundColor Green
}
else {
  Write-Host "✗ ngrok is NOT installed" -ForegroundColor Red
  Write-Host "  Install: choco install ngrok" -ForegroundColor Yellow
  Write-Host "  Or download: https://ngrok.com/download" -ForegroundColor Yellow
  exit 1
}

# Start ngrok in background
Write-Host ""
Write-Host "[3/5] Starting ngrok tunnel..." -ForegroundColor Yellow
Write-Host "  Exposing n8n (port 5678) via HTTPS..." -ForegroundColor Gray

# Kill existing ngrok processes
Stop-Process -Name "ngrok" -Force -ErrorAction SilentlyContinue

# Start ngrok
Start-Process -FilePath "ngrok" -ArgumentList "http 5678" -WindowStyle Minimized

# Wait for ngrok to start
Start-Sleep -Seconds 3

# Get ngrok URL
try {
  $ngrokApi = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
  $ngrokUrl = $ngrokApi.tunnels[0].public_url
  $webhookUrl = "$ngrokUrl/webhook"

  Write-Host "✓ Ngrok tunnel active" -ForegroundColor Green
  Write-Host "  URL: $ngrokUrl" -ForegroundColor Cyan
  Write-Host "  Webhook: $webhookUrl" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "  Dashboard: http://localhost:4040" -ForegroundColor Gray
}
catch {
  Write-Host "✗ Failed to get ngrok URL" -ForegroundColor Red
  Write-Host "  Check: http://localhost:4040" -ForegroundColor Yellow
  exit 1
}

# Test backend
Write-Host ""
Write-Host "[4/5] Testing backend..." -ForegroundColor Yellow
try {
  $testUrl = "$webhookUrl/search?limit=1"
  $response = Invoke-RestMethod -Uri $testUrl -TimeoutSec 10 -ErrorAction Stop
  Write-Host "✓ Backend responding" -ForegroundColor Green
}
catch {
  Write-Host "✗ Backend not responding" -ForegroundColor Red
  Write-Host "  URL: $testUrl" -ForegroundColor Yellow
  exit 1
}

# Instructions for Vercel
Write-Host ""
Write-Host "[5/5] Vercel Deployment" -ForegroundColor Yellow
Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  COPY THESE VALUES TO VERCEL:" -ForegroundColor White
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "NEXT_PUBLIC_API_BASE_URL" -ForegroundColor Yellow -NoNewline
Write-Host " = " -NoNewline
Write-Host $webhookUrl -ForegroundColor Green
Write-Host ""
Write-Host "NEXT_PUBLIC_BI_MODE" -ForegroundColor Yellow -NoNewline
Write-Host " = " -NoNewline
Write-Host "link" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT_PUBLIC_ENABLE_HEALTH_CHECK" -ForegroundColor Yellow -NoNewline
Write-Host " = " -NoNewline
Write-Host "true" -ForegroundColor Green
Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Next steps
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Go to: https://vercel.com/new" -ForegroundColor Gray
Write-Host "  2. Import repo: jian131/grp3_mbtt" -ForegroundColor Gray
Write-Host "  3. Add environment variables above" -ForegroundColor Gray
Write-Host "  4. Click Deploy!" -ForegroundColor Gray
Write-Host ""
Write-Host "OR use Vercel CLI:" -ForegroundColor White
Write-Host "  npm i -g vercel" -ForegroundColor Gray
Write-Host "  vercel --prod" -ForegroundColor Gray
Write-Host "  (Enter env vars when prompted)" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  IMPORTANT: Keep this terminal open!" -ForegroundColor Yellow
Write-Host "   Ngrok tunnel will close if you exit." -ForegroundColor Yellow
Write-Host ""
Write-Host "Press CTRL+C to stop ngrok and exit" -ForegroundColor Gray

# Keep script running
while ($true) {
  Start-Sleep -Seconds 30
  # Check if ngrok is still running
  $ngrokProcess = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue
  if (-not $ngrokProcess) {
    Write-Host ""
    Write-Host "✗ Ngrok stopped" -ForegroundColor Red
    exit 1
  }
}
