# Auto-start backend services for JFinder
# Run this script every time you open your computer

Write-Host "=== Starting JFinder Backend Services ===" -ForegroundColor Cyan
Write-Host ""

# Navigate to project directory
Set-Location "C:\Users\User\OneDrive\Documents\VSCode\HTTM\grp3_mbtt"

# 1. Start Docker containers
Write-Host "Starting Docker containers..." -ForegroundColor Yellow
docker-compose up -d

Start-Sleep -Seconds 5

# 2. Check Docker status
Write-Host ""
Write-Host "Docker containers status:" -ForegroundColor Yellow
docker-compose ps

# 3. Start ngrok tunnel
Write-Host ""
Write-Host "Starting ngrok tunnel..." -ForegroundColor Yellow
Start-Process ngrok -ArgumentList "http 5678" -WindowStyle Minimized

# 4. Wait for ngrok to initialize
Start-Sleep -Seconds 3

# 5. Get ngrok URL
Write-Host ""
.\scripts\get_ngrok_url.ps1

Write-Host ""
Write-Host "=== Backend Ready ===" -ForegroundColor Green
Write-Host "Local app: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start Next.js dev server, run: npm run dev" -ForegroundColor Gray
