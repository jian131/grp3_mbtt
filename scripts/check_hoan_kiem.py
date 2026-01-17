#!/usr/bin/env python3
"""Check Hoàn Kiếm records geo accuracy."""
import json

# Hoàn Kiếm bounds (approximate)
# Center: 21.0285, 105.8542
# Bounds: lat 21.02-21.04, lon 105.84-105.86
HK_BOUNDS = {
    "lat_min": 21.02,
    "lat_max": 21.04,
    "lon_min": 105.84,
    "lon_max": 105.86
}

with open('app/data/listings_vn_postmerge.json', encoding='utf-8') as f:
    data = json.load(f)

hk_records = [r for r in data if 'Hoàn Kiếm' in str(r.get('district', ''))]
print(f"Total Hoàn Kiếm records: {len(hk_records)}")
print(f"Expected bounds: lat {HK_BOUNDS['lat_min']}-{HK_BOUNDS['lat_max']}, lon {HK_BOUNDS['lon_min']}-{HK_BOUNDS['lon_max']}")
print()

correct = 0
wrong = 0

for r in hk_records[:20]:
    lat = r.get('latitude', 0)
    lon = r.get('longitude', 0)
    status = r.get('geo_status', 'N/A')

    in_bounds = (HK_BOUNDS['lat_min'] <= lat <= HK_BOUNDS['lat_max'] and
                 HK_BOUNDS['lon_min'] <= lon <= HK_BOUNDS['lon_max'])

    mark = "✓" if in_bounds else "✗"
    print(f"{mark} {r['id']}: lat={lat:.5f}, lon={lon:.5f}, status={status}")

    if in_bounds:
        correct += 1
    else:
        wrong += 1

print(f"\nIn bounds: {correct}/{len(hk_records[:20])}")
print(f"Out of bounds: {wrong}/{len(hk_records[:20])}")
