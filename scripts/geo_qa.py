#!/usr/bin/env python3
"""
JFinder Geo QA - Admin Level Point-in-Polygon Verification
==========================================================
Validates that each listing's lat/lon is within the correct district polygon.
Uses GADM Level 3 boundaries for Vietnam.

Usage:
    python scripts/geo_qa.py
"""

import json
import unicodedata
import re
from pathlib import Path
from datetime import datetime
from collections import defaultdict

try:
    import geopandas as gpd
    from shapely.geometry import Point
    from shapely.ops import unary_union
except ImportError:
    print("pip install geopandas shapely")
    exit(1)

# Paths
DATA_FILE = Path("app/data/vn_rental_3cities_verified.json")
GADM_FILE = Path("data/boundaries/gadm41_VNM_3.json")
REPORT_MD = Path("reports/geo_qc_report.md")
REPORT_JSON = Path("reports/geo_qc_report.json")
BAD_SAMPLES_CSV = Path("reports/geo_bad_samples.csv")

CITIES = ["HồChíMinh", "ĐàNẵng", "HàNội"]

# Vietnamese character normalization
VIET_CHARS = {
    'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
    'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
    'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
    'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
    'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
    'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
    'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
    'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
    'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
    'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
    'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
    'đ': 'd', 'Đ': 'd'
}


def normalize_name(name: str) -> str:
    """Normalize Vietnamese admin name for matching."""
    if not name:
        return ""
    name = str(name).lower().strip()
    name = unicodedata.normalize('NFC', name)
    for viet, ascii_char in VIET_CHARS.items():
        name = name.replace(viet, ascii_char)
    name = re.sub(r'[^\w\s]', '', name)
    name = re.sub(r'\s+', ' ', name).strip()
    # Remove prefixes - handle both "quan 1" and "quan1" formats
    for prefix in ['quan', 'huyen', 'thi xa', 'phuong', 'xa', 'thi tran', 'thanh pho']:
        if name.startswith(prefix + ' '):
            name = name[len(prefix)+1:].strip()
        elif name.startswith(prefix) and len(name) > len(prefix) and name[len(prefix)].isdigit():
            # Handle "quan1" format (no space before number)
            name = name[len(prefix):].strip()
    return name.replace(' ', '')


def main():
    print("=" * 60)
    print("GEO QA - District-Level Point-in-Polygon Verification")
    print("=" * 60)

    # Load data
    print(f"\nLoading data from {DATA_FILE}...")
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(f"Loaded {len(data)} records")

    # Load GADM
    print(f"Loading GADM from {GADM_FILE}...")
    gdf = gpd.read_file(GADM_FILE)
    gdf = gdf[gdf['NAME_1'].isin(CITIES)]
    print(f"Filtered to {len(gdf)} wards in 3 cities")

    # Build district polygons - include all polygons regardless of district name
    district_polys = {}
    all_polys = []  # For checking if point is within any polygon
    for idx, row in gdf.iterrows():
        k = normalize_name(row['NAME_2'])
        all_polys.append(row.geometry)
        if k not in district_polys:
            district_polys[k] = row.geometry
        else:
            district_polys[k] = unary_union([district_polys[k], row.geometry])
    print(f"Built {len(district_polys)} district polygons")
    all_city_boundary = unary_union(all_polys)

    # Verify records - NEW LOGIC:
    # 1. geo_status=matched → point should be in district polygon
    # 2. geo_status=adjusted → trust metadata (already normalized)
    # 3. Check if ALL points are within city boundaries
    print("\nVerifying records...")
    match = 0
    fail = 0
    bad_samples = []
    by_province = defaultdict(lambda: {"total": 0, "ok": 0})
    by_district = defaultdict(lambda: {"total": 0, "ok": 0})

    for r in data:
        lat = r.get('latitude', 0)
        lon = r.get('longitude', 0)
        province = r.get('province', '')
        district = r.get('district', '')

        point = Point(lon, lat)
        k = normalize_name(district)

        by_province[province]["total"] += 1
        by_district[district]["total"] += 1

        if k in district_polys and district_polys[k].contains(point):
            match += 1
            by_province[province]["ok"] += 1
            by_district[district]["ok"] += 1
        else:
            fail += 1
            if len(bad_samples) < 100:
                bad_samples.append({
                    "id": r.get("id"),
                    "province": province,
                    "district": district,
                    "ward": r.get("ward", ""),
                    "latitude": lat,
                    "longitude": lon,
                    "geo_status": r.get("geo_status"),
                })

    rate = 100 * match / (match + fail) if (match + fail) > 0 else 0
    passed = rate >= 99

    # Generate report
    report_md = f"""# Geo QC Report - Admin Level Verification

**Generated:** {datetime.now().isoformat()}
**Dataset:** {DATA_FILE}
**Boundaries:** GADM Level 3 (Vietnam)

## Summary

| Metric | Value |
|--------|-------|
| Total Records | {len(data)} |
| District Match | {match} ({rate:.2f}%) |
| District Fail | {fail} |
| **Status** | **{"✅ PASS" if passed else "❌ FAIL"}** |

## Acceptance Criteria

- **District Match Rate >= 99%**: {"✅ PASS" if passed else "❌ FAIL"} ({rate:.2f}%)

## By Province

| Province | Total | Match | Rate |
|----------|-------|-------|------|
"""
    for prov, s in sorted(by_province.items()):
        pct = 100 * s["ok"] / s["total"] if s["total"] > 0 else 0
        report_md += f"| {prov} | {s['total']} | {s['ok']} | {pct:.1f}% |\n"

    report_md += """
## By District (Top 20)

| District | Total | Match | Rate |
|----------|-------|-------|------|
"""
    sorted_districts = sorted(by_district.items(), key=lambda x: x[1]["total"], reverse=True)[:20]
    for dist, s in sorted_districts:
        pct = 100 * s["ok"] / s["total"] if s["total"] > 0 else 0
        report_md += f"| {dist} | {s['total']} | {s['ok']} | {pct:.1f}% |\n"

    if bad_samples:
        report_md += f"""
## Bad Samples ({len(bad_samples)} records)

| ID | District | Lat | Lon |
|----|----------|-----|-----|
"""
        for s in bad_samples[:10]:
            report_md += f"| {s['id']} | {s['district']} | {s['latitude']:.5f} | {s['longitude']:.5f} |\n"

    # Save reports
    REPORT_MD.parent.mkdir(parents=True, exist_ok=True)
    with open(REPORT_MD, 'w', encoding='utf-8') as f:
        f.write(report_md)
    print(f"\nSaved: {REPORT_MD}")

    report_json = {
        "generated": datetime.now().isoformat(),
        "total": len(data),
        "district_match": match,
        "district_match_rate": rate,
        "district_fail": fail,
        "passed": passed,
        "by_province": dict(by_province),
        "bad_samples_count": len(bad_samples)
    }
    with open(REPORT_JSON, 'w', encoding='utf-8') as f:
        json.dump(report_json, f, indent=2, ensure_ascii=False)
    print(f"Saved: {REPORT_JSON}")

    if bad_samples:
        import csv
        with open(BAD_SAMPLES_CSV, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=bad_samples[0].keys())
            writer.writeheader()
            writer.writerows(bad_samples)
        print(f"Saved: {BAD_SAMPLES_CSV}")

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total: {len(data)}")
    print(f"District Match: {match} ({rate:.2f}%)")
    print(f"District Fail: {fail}")
    print(f"\n{'✅ PASS' if passed else '❌ FAIL'}: District >= 99%")

    return 0 if passed else 1


if __name__ == "__main__":
    exit(main())
