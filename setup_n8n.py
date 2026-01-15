"""
JFinder n8n Auto Setup
Xóa workflows cũ, import workflow mới, activate và test
"""
import requests
import json
import time

N8N_URL = "http://localhost:5678"
WORKFLOW_FILE = "n8n/ALL_APIS_workflow.json"

print("=" * 60)
print("JFinder n8n Auto Setup")
print("=" * 60)

# Step 1: Get all workflows
print("\n[1/5] Đang lấy danh sách workflows...")
try:
    r = requests.get(f"{N8N_URL}/api/v1/workflows")
    workflows = r.json().get('data', [])
    print(f"✓ Tìm thấy {len(workflows)} workflows")
except Exception as e:
    print(f"✗ Lỗi: {e}")
    print("Đảm bảo n8n đang chạy tại http://localhost:5678")
    exit(1)

# Step 2: Delete old API workflows
print("\n[2/5] Đang xóa workflows cũ...")
deleted = 0
for wf in workflows:
    name = wf.get('name', '')
    wf_id = wf.get('id')

    # Delete if it's an API workflow
    if any(x in name for x in ['API -', 'JFinder API', 'Search', 'Listing', 'Stats', 'ROI', 'Valuation']):
        try:
            requests.delete(f"{N8N_URL}/api/v1/workflows/{wf_id}")
            print(f"  ✓ Đã xóa: {name}")
            deleted += 1
        except:
            print(f"  ✗ Không xóa được: {name}")

print(f"✓ Đã xóa {deleted} workflows")

# Step 3: Import new workflow
print("\n[3/5] Đang import workflow mới...")
try:
    with open(WORKFLOW_FILE, 'r', encoding='utf-8') as f:
        workflow_data = json.load(f)

    # Import workflow
    r = requests.post(
        f"{N8N_URL}/api/v1/workflows",
        json=workflow_data
    )

    if r.status_code in [200, 201]:
        new_wf = r.json().get('data') or r.json()
        wf_id = new_wf.get('id')
        print(f"✓ Import thành công! Workflow ID: {wf_id}")
    else:
        print(f"✗ Import thất bại: {r.text}")
        exit(1)

except FileNotFoundError:
    print(f"✗ Không tìm thấy file: {WORKFLOW_FILE}")
    exit(1)
except Exception as e:
    print(f"✗ Lỗi: {e}")
    exit(1)

# Step 4: Activate workflow
print("\n[4/5] Đang activate workflow...")
try:
    # Update workflow to set active=true
    workflow_data['active'] = True
    r = requests.patch(
        f"{N8N_URL}/api/v1/workflows/{wf_id}",
        json=workflow_data
    )

    if r.status_code == 200:
        print("✓ Workflow đã ACTIVE!")
    else:
        print(f"! Activate thủ công trong n8n UI")

except Exception as e:
    print(f"! Activate thủ công: {e}")

# Step 5: Test endpoints
print("\n[5/5] Đang test endpoints...")
time.sleep(2)  # Wait for webhooks to register

endpoints = [
    ("Search", "GET", f"{N8N_URL}/webhook/search?limit=1"),
    ("Listing", "GET", f"{N8N_URL}/webhook/listing/VN26000001"),
    ("Stats", "GET", f"{N8N_URL}/webhook/stats?level=district"),
    ("ROI", "POST", f"{N8N_URL}/webhook/roi", {"monthly_rent": 50, "product_price": 50000, "profit_margin": 0.3, "target_daily_customers": 100}),
    ("Valuation", "POST", f"{N8N_URL}/webhook/valuation", {"district": "Quận 1", "type": "streetfront", "area_m2": 100})
]

success_count = 0
for test in endpoints:
    name = test[0]
    method = test[1]
    url = test[2]
    data = test[3] if len(test) > 3 else None

    try:
        if method == "GET":
            r = requests.get(url, timeout=5)
        else:
            r = requests.post(url, json=data, timeout=5)

        if r.status_code == 200:
            print(f"  ✓ {name} API: OK (200)")
            success_count += 1
        else:
            print(f"  ✗ {name} API: HTTP {r.status_code}")
    except Exception as e:
        print(f"  ✗ {name} API: {e}")

print("\n" + "=" * 60)
print(f"KẾT QUẢ: {success_count}/5 endpoints hoạt động")
print("=" * 60)

if success_count == 5:
    print("\n🎉 HOÀN THÀNH! Tất cả APIs đã sẵn sàng!")
    print("\nTest ngay:")
    print("  curl http://localhost:5678/webhook/search?limit=2")
else:
    print("\n⚠️  Một số APIs chưa hoạt động.")
    print("Kiểm tra n8n UI tại: http://localhost:5678")
    print("Đảm bảo:")
    print("  1. Workflow 'JFinder API - All Endpoints' có toggle Active ON")
    print("  2. Tất cả Postgres nodes đã link credential 'JFinder DB'")
