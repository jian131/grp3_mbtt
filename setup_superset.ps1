# Script cấu hình Superset (Chạy 1 lần sau khi docker-compose up)
# Đợi khoảng 2-3 phút sau khi container khởi động trước khi chạy script này

Write-Host "Dang cau hinh Superset..." -ForegroundColor Cyan
Write-Host "Luu y: Doi khoang 2-3 phut sau khi docker-compose up!" -ForegroundColor Yellow

# Tạo tài khoản Admin
Write-Host "`n1. Tao tai khoan Admin (user: admin / pass: admin)..." -ForegroundColor Green
docker exec -it grp3_mbtt-superset-1 superset fab create-admin `
  --username admin `
  --firstname Superset `
  --lastname Admin `
  --email admin@jfinder.com `
  --password admin

# Nâng cấp Database
Write-Host "`n2. Nang cap Database..." -ForegroundColor Green
docker exec -it grp3_mbtt-superset-1 superset db upgrade

# Khởi tạo quyền
Write-Host "`n3. Khoi tao quyen (Init)..." -ForegroundColor Green
docker exec -it grp3_mbtt-superset-1 superset init

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "CAU HINH SUPERSET HOAN TAT!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Truy cap: http://localhost:8088" -ForegroundColor Yellow
Write-Host "User: admin" -ForegroundColor Yellow
Write-Host "Pass: admin" -ForegroundColor Yellow
Write-Host "==========================================`n" -ForegroundColor Cyan
