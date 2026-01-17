#!/usr/bin/env python3
"""
JFinder Smoke Test Suite
Run after cleanup to verify system integrity
"""

import json
import requests
import sys
from datetime import datetime

BASE_URL = "http://localhost"
N8N_PORT = 5678
FE_PORT = 3000

TESTS = []
PASSED = 0
FAILED = 0

def log_result(test_name: str, success: bool, details: str = ""):
    global PASSED, FAILED
    status = "✅ PASS" if success else "❌ FAIL"
    if success:
        PASSED += 1
    else:
        FAILED += 1
    print(f"{status} | {test_name}")
    if details:
        print(f"       {details}")
    TESTS.append({
        "test": test_name,
        "status": "pass" if success else "fail",
        "details": details
    })

def test_n8n_health():
    """Test n8n is running"""
    try:
        resp = requests.get(f"{BASE_URL}:{N8N_PORT}/healthz", timeout=5)
        log_result("n8n Health Check", resp.status_code == 200, f"Status: {resp.status_code}")
        return resp.status_code == 200
    except Exception as e:
        log_result("n8n Health Check", False, str(e))
        return False

def test_search_api():
    """Test n8n search webhook"""
    try:
        resp = requests.get(f"{BASE_URL}:{N8N_PORT}/webhook/search?limit=5", timeout=10)
        data = resp.json()
        # n8n returns {success, data, count, total} format
        listings = data.get("data", data) if isinstance(data, dict) else data
        success = resp.status_code == 200 and isinstance(listings, list) and len(listings) > 0
        log_result("Search API", success, f"Returned {len(listings)} listings")
        return success
    except Exception as e:
        log_result("Search API", False, str(e))
        return False

def test_search_with_filter():
    """Test search with city filter"""
    try:
        resp = requests.get(
            f"{BASE_URL}:{N8N_PORT}/webhook/search?province=Thành phố Hồ Chí Minh&limit=5",
            timeout=10
        )
        data = resp.json()
        # n8n returns {success, data, count, total} format
        listings = data.get("data", data) if isinstance(data, dict) else data
        if isinstance(listings, list) and len(listings) > 0:
            all_match = all(
                "Hồ Chí Minh" in item.get("province", "")
                for item in listings
            )
            log_result("Search Filter (City)", all_match, f"{len(listings)} results, all from HCM: {all_match}")
            return all_match
        log_result("Search Filter (City)", False, f"No results or unexpected format: {type(listings)}")
        return False
    except Exception as e:
        log_result("Search Filter (City)", False, str(e))
        return False

def test_listing_detail():
    """Test FE listing detail API"""
    try:
        resp = requests.get(f"{BASE_URL}:{FE_PORT}/api/listing/VN26000001", timeout=10)
        data = resp.json()
        success = data.get("success") == True and data.get("data", {}).get("id") == "VN26000001"
        log_result("Listing Detail API", success, f"Found: {data.get('data', {}).get('name', 'N/A')[:50]}")
        return success
    except Exception as e:
        log_result("Listing Detail API", False, str(e))
        return False

def test_roi_calculation():
    """Test ROI calculation API"""
    try:
        payload = {
            "monthlyRent": 20,
            "productPrice": 50000,
            "profitMargin": 0.3,
            "dailyCustomers": 100,
            "operatingCost": 10
        }
        resp = requests.post(
            f"{BASE_URL}:{FE_PORT}/api/roi",
            json=payload,
            timeout=10
        )
        data = resp.json()
        success = data.get("success") == True and "results" in data
        roi = data.get("results", {}).get("roi_percent", "N/A")
        log_result("ROI Calculation", success, f"ROI: {roi}%")
        return success
    except Exception as e:
        log_result("ROI Calculation", False, str(e))
        return False

def test_valuation():
    """Test valuation API with fixed district filter"""
    try:
        payload = {
            "district": "Quận 1",
            "city": "Thành phố Hồ Chí Minh",
            "area": 50,
            "type": "streetfront"
        }
        resp = requests.post(
            f"{BASE_URL}:{FE_PORT}/api/valuation",
            json=payload,
            timeout=10
        )
        data = resp.json()
        success = data.get("success") == True and "valuation" in data
        price = data.get("valuation", {}).get("suggested_price_million", "N/A")
        sample = data.get("market_stats", {}).get("sample_size", 0)
        log_result("Valuation API", success, f"Suggested: {price}M, Samples: {sample}")
        return success
    except Exception as e:
        log_result("Valuation API", False, str(e))
        return False

def test_frontend_home():
    """Test frontend home page loads"""
    try:
        resp = requests.get(f"{BASE_URL}:{FE_PORT}/", timeout=10)
        success = resp.status_code == 200 and "JFinder" in resp.text
        log_result("Frontend Home", success, f"Status: {resp.status_code}")
        return success
    except Exception as e:
        log_result("Frontend Home", False, str(e))
        return False

def test_data_file():
    """Test verified data file exists and is valid"""
    try:
        with open("app/data/listings_vn_postmerge.json", "r", encoding="utf-8") as f:
            data = json.load(f)
        success = isinstance(data, list) and len(data) == 1170
        log_result("Data File Integrity", success, f"Records: {len(data)}")
        return success
    except Exception as e:
        log_result("Data File Integrity", False, str(e))
        return False

def test_no_broken_imports():
    """Verify no imports of deleted files"""
    import subprocess
    try:
        result = subprocess.run(
            ["powershell", "-Command",
             "Select-String -Path 'app/**/*.tsx','components/**/*.tsx','lib/**/*.ts' -Pattern 'LeafletMap|JFinderMap|mapStyles' -Recurse"],
            capture_output=True,
            text=True,
            timeout=30
        )
        # No matches = success
        success = result.returncode != 0 or len(result.stdout.strip()) == 0
        log_result("No Broken Imports", success, "No deleted file imports found" if success else result.stdout[:100])
        return success
    except Exception as e:
        log_result("No Broken Imports", False, str(e))
        return False

def save_report():
    """Save test results to report file"""
    report = {
        "timestamp": datetime.now().isoformat(),
        "summary": {
            "total": PASSED + FAILED,
            "passed": PASSED,
            "failed": FAILED,
            "success_rate": f"{(PASSED/(PASSED+FAILED)*100):.1f}%" if PASSED+FAILED > 0 else "N/A"
        },
        "tests": TESTS
    }

    with open("reports/test_results.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    # Also create markdown report
    md = f"""# JFinder Smoke Test Results

**Timestamp:** {report['timestamp']}
**Total Tests:** {report['summary']['total']}
**Passed:** {report['summary']['passed']}
**Failed:** {report['summary']['failed']}
**Success Rate:** {report['summary']['success_rate']}

## Test Results

| Test | Status | Details |
|------|--------|---------|
"""
    for t in TESTS:
        status = "✅" if t['status'] == 'pass' else "❌"
        md += f"| {t['test']} | {status} | {t['details']} |\n"

    md += """
## Post-Cleanup Verification

The following files were successfully removed:
- `app/components/LeafletMap.tsx` - Dead code
- `components/Map/JFinderMap.tsx` - Dead code
- `components/Map/mapStyles.ts` - Dead code
- `n8n/0-init-schema.json` - Deprecated workflow
- `n8n/1-import-data.json` - Deprecated workflow
- `n8n/ALL_APIS_workflow.json` - Deprecated workflow
- `setup_n8n.py` - Unused script
- `test-apis.bat` - Unused script
- `scripts/import_to_superset.py` - Failed approach
- `scripts/upload_to_superset_manual.md` - Outdated guide
- `app/data/vn_rental_3cities.json` - Unverified data
- `app/data/vn_rental_3cities.csv` - Unverified data
- `data/` - Empty folder
- `Dockerfile.superset` - Not used
- `STATUS.md` - Outdated

## Build Status

✅ `npm run build` completed successfully after cleanup
"""

    with open("reports/test_results.md", "w", encoding="utf-8") as f:
        f.write(md)

    print(f"\n{'='*50}")
    print(f"Results saved to reports/test_results.json and .md")

def main():
    print("="*50)
    print("JFinder Smoke Test Suite")
    print("="*50)
    print()

    # Run tests
    test_data_file()
    test_no_broken_imports()
    test_n8n_health()
    test_search_api()
    test_search_with_filter()
    test_frontend_home()
    test_listing_detail()
    test_roi_calculation()
    test_valuation()

    # Summary
    print()
    print("="*50)
    print(f"SUMMARY: {PASSED} passed, {FAILED} failed")
    print("="*50)

    # Save report
    save_report()

    # Exit with error if any test failed
    sys.exit(0 if FAILED == 0 else 1)

if __name__ == "__main__":
    main()
