# Get current ngrok URL for Vercel configuration

Write-Host "=== Ngrok URL for Production ===" -ForegroundColor Cyan
Write-Host ""

# Check ngrok running
if (-not (Get-Process ngrok -ErrorAction SilentlyContinue)) {
  Write-Host "ERROR: Ngrok is not running!" -ForegroundColor Red
  Write-Host "Start it with: Start-Process ngrok -ArgumentList 'http 5678' -WindowStyle Minimized"
  exit 1
}

# Get tunnel URL
try {
  Start-Sleep -Seconds 2
  $tunnels = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels"
  $httpsUrl = ($tunnels.tunnels | Where-Object { $_.proto -eq 'https' }).public_url

  if ($httpsUrl) {
    $webhookUrl = "$httpsUrl/webhook"

    Write-Host "Ngrok URL: $httpsUrl" -ForegroundColor Green
    Write-Host "Backend API URL: $webhookUrl" -ForegroundColor Yellow
    Write-Host ""

    # Copy to clipboard
    Set-Clipboard -Value $webhookUrl
    Write-Host "Copied to clipboard!" -ForegroundColor Green
    Write-Host ""

    Write-Host "=== Vercel Setup ===" -ForegroundColor Cyan
    Write-Host "1. Go to: https://vercel.com/jian131/grp3-mbtt/settings/environment-variables"
    Write-Host "2. Add/Update: NEXT_PUBLIC_API_BASE_URL = $webhookUrl"
    Write-Host "3. Redeploy from: https://vercel.com/jian131/grp3-mbtt/deployments"
    Write-Host ""

    # Test backend
    try {
      $test = Invoke-RestMethod -Uri "$webhookUrl/search?limit=1" -TimeoutSec 5
      Write-Host "Backend test: OK" -ForegroundColor Green
    }
    catch {
      Write-Host "Backend test: FAILED" -ForegroundColor Red
    }

  }
  else {
    Write-Host "ERROR: No HTTPS tunnel found" -ForegroundColor Red
  }
}
catch {
  Write-Host "ERROR: Cannot connect to ngrok API" -ForegroundColor Red
}
