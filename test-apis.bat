@echo off
echo === TESTING ALL n8n ENDPOINTS ===
echo.

echo 1. Testing Search API...
curl -s -o nul -w "Status: %%{http_code}\n" "http://localhost:5678/webhook/search?limit=1"
echo.

echo 2. Testing Listing API...
curl -s -o nul -w "Status: %%{http_code}\n" "http://localhost:5678/webhook/listing/VN26000001"
echo.

echo 3. Testing Stats API...
curl -s -o nul -w "Status: %%{http_code}\n" "http://localhost:5678/webhook/stats"
echo.

echo 4. Testing ROI API...
curl -s -o nul -w "Status: %%{http_code}\n" -X POST "http://localhost:5678/webhook/roi" -H "Content-Type: application/json" -d "{\"monthly_rent\":50,\"product_price\":50000,\"profit_margin\":0.3,\"target_daily_customers\":100}"
echo.

echo 5. Testing Valuation API...
curl -s -o nul -w "Status: %%{http_code}\n" -X POST "http://localhost:5678/webhook/valuation" -H "Content-Type: application/json" -d "{\"district\":\"Quận 1\",\"type\":\"streetfront\",\"area_m2\":100}"
echo.

echo === TEST COMPLETE ===
echo Expected: All should return 200
echo If you see 404, that workflow is NOT active in n8n
pause
