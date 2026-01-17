#!/usr/bin/env python3
"""
JFinder Geo Normalize - Admin Level PIP
=======================================
Chuẩn hóa lat/lon theo boundary hành chính OFFLINE.
Sử dụng GADM Level 3 (phường/xã) cho 3 TP: Hà Nội, Đà Nẵng, TP.HCM.

Usage:
    python scripts/geo_normalize_admin.py
"""

import json
import csv
import os
import sys
import random
import hashlib
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
from collections import defaultdict
import unicodedata
import re

try:
    import geopandas as gpd
    from shapely.geometry import Point, shape
    from shapely.ops import unary_union
    import requests
except ImportError as e:
    print(f"Missing package: {e}")
    print("Run: pip install geopandas shapely requests")
    sys.exit(1)

# ==============================================================================
# CONFIGURATION
# ==============================================================================

GADM_URL = "https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_VNM_3.json.zip"
GADM_CACHE_DIR = Path("data/boundaries")
GADM_CACHE_FILE = GADM_CACHE_DIR / "gadm41_VNM_3.json"

# 3 Cities filter - GADM uses compact names without spaces: HồChíMinh, ĐàNẵng, HàNội
# After normalize_text, these become: hochiminh, danang, hanoi
TARGET_PROVINCES_GADM = ["HồChíMinh", "ĐàNẵng", "HàNội"]
TARGET_PROVINCES_NORM = ["hochiminh", "danang", "hanoi"]

# Alias mapping: all variants -> normalized GADM key
PROVINCE_ALIASES = {
    # Hà Nội
    "ha noi": "hanoi",
    "hanoi": "hanoi",
    "hn": "hanoi",
    "thanh pho ha noi": "hanoi",
    # Đà Nẵng
    "da nang": "danang",
    "danang": "danang",
    "dn": "danang",
    "thanh pho da nang": "danang",
    # Hồ Chí Minh
    "ho chi minh": "hochiminh",
    "hochiminh": "hochiminh",
    "hcm": "hochiminh",
    "tphcm": "hochiminh",
    "tp hcm": "hochiminh",
    "saigon": "hochiminh",
    "sai gon": "hochiminh",
    "thanh pho ho chi minh": "hochiminh",
}

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

ADMIN_PREFIXES = [
    "thành phố", "tỉnh", "quận", "huyện", "thị xã",
    "phường", "xã", "thị trấn", "tp", "tx", "tt", "p", "q", "h"
]

# ==============================================================================
# HELPER FUNCTIONS
# ==============================================================================

def normalize_text(text: str) -> str:
    """Normalize Vietnamese text for matching."""
    if not text:
        return ""
    text = str(text).lower().strip()
    text = unicodedata.normalize('NFC', text)
    for viet, ascii_char in VIET_CHARS.items():
        text = text.replace(viet, ascii_char)
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def remove_prefix(name: str) -> str:
    """Remove administrative prefixes and spaces for matching."""
    name_lower = normalize_text(name)
    for prefix in sorted(ADMIN_PREFIXES, key=len, reverse=True):
        prefix_norm = normalize_text(prefix)
        if name_lower.startswith(prefix_norm + " "):
            result = name_lower[len(prefix_norm)+1:].strip()
            return result.replace(" ", "")  # Remove spaces for GADM matching
        if name_lower.startswith(prefix_norm):
            rest = name_lower[len(prefix_norm):].strip()
            if rest and rest[0].isdigit():
                return rest
    return name_lower.replace(" ", "")  # Remove spaces for GADM matching


def normalize_district_number(name: str) -> str:
    """Normalize district numbers (Quận 1 -> 1) and remove spaces for matching."""
    name_clean = remove_prefix(name)
    # Handle "quan 1" -> "1"
    match = re.match(r'^(\d+)$', name_clean)
    if match:
        return match.group(1)
    # Remove spaces for matching (GADM uses HoànKiếm not Hoàn Kiếm)
    return name_clean.replace(" ", "")


def get_random_point_in_polygon(polygon) -> Tuple[float, float]:
    """Generate random point inside polygon."""
    minx, miny, maxx, maxy = polygon.bounds
    for _ in range(100):
        pnt = Point(random.uniform(minx, maxx), random.uniform(miny, maxy))
        if polygon.contains(pnt):
            return (pnt.y, pnt.x)  # lat, lon
    # Fallback to centroid
    centroid = polygon.centroid
    return (centroid.y, centroid.x)


# ==============================================================================
# GADM BOUNDARY LOADER
# ==============================================================================

class GADMBoundaries:
    """Load and index GADM boundaries for Vietnam."""

    def __init__(self):
        self.gdf = None
        self.ward_index = {}  # (province_norm, district_norm, ward_norm) -> polygon
        self.district_index = {}  # (province_norm, district_norm) -> polygon
        self.province_index = {}  # province_norm -> polygon

    def download_gadm(self):
        """Download GADM data if not cached."""
        GADM_CACHE_DIR.mkdir(parents=True, exist_ok=True)

        if GADM_CACHE_FILE.exists():
            print(f"Using cached GADM: {GADM_CACHE_FILE}")
            return

        print(f"Downloading GADM from {GADM_URL}...")

        # Download zip
        import zipfile
        import io

        response = requests.get(GADM_URL, timeout=120)
        response.raise_for_status()

        # Extract JSON from zip
        with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
            for name in zf.namelist():
                if name.endswith('.json'):
                    with zf.open(name) as f:
                        data = json.load(f)
                        with open(GADM_CACHE_FILE, 'w', encoding='utf-8') as out:
                            json.dump(data, out)
                    print(f"Saved: {GADM_CACHE_FILE}")
                    return

        raise Exception("No JSON found in GADM zip")

    def load(self):
        """Load GADM and build indexes."""
        self.download_gadm()

        print("Loading GADM boundaries...")
        self.gdf = gpd.read_file(GADM_CACHE_FILE)

        # GADM columns are: NAME_1 (province), NAME_2 (district), NAME_3 (ward)
        # Don't use NL_NAME_* as they're mostly NA
        province_col = 'NAME_1'
        district_col = 'NAME_2'
        ward_col = 'NAME_3'

        print(f"Columns: {list(self.gdf.columns[:10])}")
        print(f"Using: province={province_col}, district={district_col}, ward={ward_col}")

        # Filter to target provinces (GADM uses HồChíMinh, ĐàNẵng, HàNội)
        mask = self.gdf[province_col].isin(TARGET_PROVINCES_GADM)
        self.gdf = self.gdf[mask].copy()

        print(f"Filtered to {len(self.gdf)} wards in 3 cities")

        # Build ward index - normalize province to match TARGET_PROVINCES_NORM
        gadm_to_norm = {
            "HồChíMinh": "hochiminh",
            "ĐàNẵng": "danang",
            "HàNội": "hanoi"
        }

        for idx, row in self.gdf.iterrows():
            province_gadm = str(row[province_col])
            district = str(row[district_col])
            ward = str(row[ward_col])
            geometry = row.geometry

            # Map GADM province name to normalized key
            province_norm = gadm_to_norm.get(province_gadm, normalize_text(province_gadm).replace(" ", ""))
            district_norm = normalize_district_number(district)
            ward_norm = remove_prefix(ward)

            # Ward index
            key = (province_norm, district_norm, ward_norm)
            self.ward_index[key] = geometry

            # District index (union of wards)
            dist_key = (province_norm, district_norm)
            if dist_key not in self.district_index:
                self.district_index[dist_key] = geometry
            else:
                self.district_index[dist_key] = unary_union([self.district_index[dist_key], geometry])

            # Province index
            if province_norm not in self.province_index:
                self.province_index[province_norm] = geometry
            else:
                self.province_index[province_norm] = unary_union([self.province_index[province_norm], geometry])

        print(f"Indexed: {len(self.ward_index)} wards, {len(self.district_index)} districts, {len(self.province_index)} provinces")

    def find_polygon(self, province: str, district: str, ward: str) -> Tuple[Optional[Any], str]:
        """Find polygon for admin unit, with fallback."""
        # Normalize province name and apply alias
        province_norm = normalize_text(province)
        # Remove spaces for matching (GADM: "hochiminh" not "ho chi minh")
        province_norm_nospace = province_norm.replace(" ", "")

        # Try direct alias lookup (with spaces)
        if province_norm in PROVINCE_ALIASES:
            province_norm = PROVINCE_ALIASES[province_norm]
        elif province_norm_nospace in PROVINCE_ALIASES:
            province_norm = PROVINCE_ALIASES[province_norm_nospace]
        else:
            # Try partial match
            for alias, canonical in PROVINCE_ALIASES.items():
                if alias in province_norm or province_norm in alias:
                    province_norm = canonical
                    break
            else:
                # Default: remove spaces
                province_norm = province_norm_nospace

        district_norm = normalize_district_number(district)
        ward_norm = remove_prefix(ward) if ward else ""

        # Try ward first
        if ward_norm:
            key = (province_norm, district_norm, ward_norm)
            if key in self.ward_index:
                return self.ward_index[key], "ward"

            # Try partial match
            for k, poly in self.ward_index.items():
                if k[0] == province_norm and k[1] == district_norm and ward_norm in k[2]:
                    return poly, "ward"

        # Fallback to district
        dist_key = (province_norm, district_norm)
        if dist_key in self.district_index:
            return self.district_index[dist_key], "district"

        # Try partial district match
        for k, poly in self.district_index.items():
            if k[0] == province_norm and district_norm in k[1]:
                return poly, "district"

        # Fallback to province
        if province_norm in self.province_index:
            return self.province_index[province_norm], "province"

        return None, "none"

    def point_in_polygon(self, lat: float, lon: float, polygon) -> bool:
        """Check if point is inside polygon."""
        if polygon is None:
            return False
        try:
            point = Point(lon, lat)  # shapely uses (x, y) = (lon, lat)
            return polygon.contains(point)
        except:
            return False


# ==============================================================================
# MAIN NORMALIZATION
# ==============================================================================

def normalize_dataset(input_file: Path, output_json: Path, output_csv: Path, boundaries: GADMBoundaries) -> Dict:
    """Normalize all listings in dataset."""

    print(f"\nProcessing: {input_file}")

    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"Total records: {len(data)}")

    stats = {
        "total": len(data),
        "matched": 0,
        "adjusted": 0,
        "failed": 0,
        "by_level": {"ward": 0, "district": 0, "province": 0},
        "by_province": defaultdict(lambda: {"total": 0, "matched": 0, "adjusted": 0, "failed": 0}),
        "by_district": defaultdict(lambda: {"total": 0, "matched": 0, "adjusted": 0, "failed": 0}),
        "sample_adjusted": [],
        "sample_failed": []
    }

    normalized_data = []

    for i, record in enumerate(data):
        if i % 100 == 0:
            print(f"Processing {i}/{len(data)}...")

        province = record.get("province", "")
        district = record.get("district", "")
        ward = record.get("ward", "")
        old_lat = record.get("latitude", 0)
        old_lon = record.get("longitude", 0)

        dist_key = f"{province}|{district}"
        stats["by_province"][province]["total"] += 1
        stats["by_district"][dist_key]["total"] += 1

        # Find polygon
        polygon, match_level = boundaries.find_polygon(province, district, ward)

        if polygon is None:
            # Failed - no polygon found
            record["geo_status"] = "failed"
            record["geo_method"] = "no_polygon"
            record["admin_match_level"] = "none"
            record["mismatch_reason"] = f"No polygon found for {province}/{district}/{ward}"
            stats["failed"] += 1
            stats["by_province"][province]["failed"] += 1
            stats["by_district"][dist_key]["failed"] += 1
            if len(stats["sample_failed"]) < 50:
                stats["sample_failed"].append({
                    "id": record["id"],
                    "province": province,
                    "district": district,
                    "ward": ward,
                    "reason": record["mismatch_reason"]
                })
        elif boundaries.point_in_polygon(old_lat, old_lon, polygon):
            # Point already in correct polygon
            record["geo_status"] = "matched"
            record["geo_method"] = "verified"
            record["admin_match_level"] = match_level
            record["mismatch_reason"] = None
            stats["matched"] += 1
            stats["by_level"][match_level] += 1
            stats["by_province"][province]["matched"] += 1
            stats["by_district"][dist_key]["matched"] += 1
        else:
            # Point outside - need to adjust
            new_lat, new_lon = get_random_point_in_polygon(polygon)

            record["latitude"] = round(new_lat, 6)
            record["longitude"] = round(new_lon, 6)
            record["geo_status"] = "adjusted"
            record["geo_method"] = "random_in_polygon"
            record["admin_match_level"] = match_level
            record["mismatch_reason"] = f"Moved from ({old_lat:.6f},{old_lon:.6f}) - was outside {match_level} polygon"
            record["original_latitude"] = old_lat
            record["original_longitude"] = old_lon

            stats["adjusted"] += 1
            stats["by_level"][match_level] += 1
            stats["by_province"][province]["adjusted"] += 1
            stats["by_district"][dist_key]["adjusted"] += 1

            if len(stats["sample_adjusted"]) < 50:
                stats["sample_adjusted"].append({
                    "id": record["id"],
                    "province": province,
                    "district": district,
                    "ward": ward,
                    "old_lat": old_lat,
                    "old_lon": old_lon,
                    "new_lat": new_lat,
                    "new_lon": new_lon,
                    "match_level": match_level
                })

        # Add normalized names
        record["province_norm"] = normalize_text(province)
        record["district_norm"] = normalize_district_number(district)
        record["ward_norm"] = remove_prefix(ward) if ward else ""

        normalized_data.append(record)

    # Save JSON
    print(f"\nSaving: {output_json}")
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(normalized_data, f, ensure_ascii=False, indent=2)

    # Save CSV
    print(f"Saving: {output_csv}")
    if normalized_data:
        keys = normalized_data[0].keys()
        with open(output_csv, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=keys)
            writer.writeheader()
            writer.writerows(normalized_data)

    # Calculate rates
    stats["match_rate"] = round(stats["matched"] / stats["total"] * 100, 2) if stats["total"] > 0 else 0
    stats["adjust_rate"] = round(stats["adjusted"] / stats["total"] * 100, 2) if stats["total"] > 0 else 0
    stats["fail_rate"] = round(stats["failed"] / stats["total"] * 100, 2) if stats["total"] > 0 else 0
    stats["success_rate"] = round((stats["matched"] + stats["adjusted"]) / stats["total"] * 100, 2) if stats["total"] > 0 else 0

    return stats


def generate_report(stats: Dict, output_md: Path, output_json: Path):
    """Generate QC reports."""

    # JSON report
    report = {
        "generated_at": datetime.now().isoformat(),
        "method": "Offline Point-in-Polygon using GADM Level 3 boundaries",
        "summary": {
            "total_records": stats["total"],
            "matched": stats["matched"],
            "adjusted": stats["adjusted"],
            "failed": stats["failed"],
            "match_rate_percent": stats["match_rate"],
            "adjust_rate_percent": stats["adjust_rate"],
            "fail_rate_percent": stats["fail_rate"],
            "success_rate_percent": stats["success_rate"]
        },
        "by_match_level": stats["by_level"],
        "by_province": dict(stats["by_province"]),
        "by_district": dict(stats["by_district"]),
        "sample_adjusted": stats["sample_adjusted"][:20],
        "sample_failed": stats["sample_failed"][:20]
    }

    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    # Markdown report
    md = f"""# Geo QC Report - Admin Level Verification

**Generated:** {report['generated_at']}
**Method:** {report['method']}

## Summary

| Metric | Value |
|--------|-------|
| Total Records | {stats['total']} |
| Matched (point in correct polygon) | {stats['matched']} ({stats['match_rate']}%) |
| Adjusted (moved to correct polygon) | {stats['adjusted']} ({stats['adjust_rate']}%) |
| Failed (no polygon found) | {stats['failed']} ({stats['fail_rate']}%) |
| **Success Rate** | **{stats['success_rate']}%** |

## By Match Level

| Level | Count |
|-------|-------|
| Ward | {stats['by_level'].get('ward', 0)} |
| District | {stats['by_level'].get('district', 0)} |
| Province | {stats['by_level'].get('province', 0)} |

## By Province

| Province | Total | Matched | Adjusted | Failed | Success Rate |
|----------|-------|---------|----------|--------|--------------|
"""

    for prov, pstats in sorted(stats['by_province'].items()):
        success = pstats['matched'] + pstats['adjusted']
        rate = round(success / pstats['total'] * 100, 1) if pstats['total'] > 0 else 0
        md += f"| {prov} | {pstats['total']} | {pstats['matched']} | {pstats['adjusted']} | {pstats['failed']} | {rate}% |\n"

    # Top problem districts
    problem_districts = sorted(
        [(k, v) for k, v in stats['by_district'].items() if v['adjusted'] + v['failed'] > 0],
        key=lambda x: x[1]['adjusted'] + x[1]['failed'],
        reverse=True
    )[:15]

    md += """
## Top Districts with Adjustments

| District | Total | Matched | Adjusted | Failed |
|----------|-------|---------|----------|--------|
"""
    for k, dstats in problem_districts:
        province, district = k.split('|')
        md += f"| {district} ({province[:10]}...) | {dstats['total']} | {dstats['matched']} | {dstats['adjusted']} | {dstats['failed']} |\n"

    # Sample adjusted
    md += """
## Sample Adjusted Records

| ID | District | Ward | Old Lat/Lon | New Lat/Lon | Level |
|----|----------|------|-------------|-------------|-------|
"""
    for s in stats['sample_adjusted'][:20]:
        md += f"| {s['id']} | {s['district']} | {s.get('ward','')} | ({s['old_lat']:.4f}, {s['old_lon']:.4f}) | ({s['new_lat']:.4f}, {s['new_lon']:.4f}) | {s['match_level']} |\n"

    if stats['sample_failed']:
        md += """
## Sample Failed Records

| ID | Province | District | Ward | Reason |
|----|----------|----------|------|--------|
"""
        for s in stats['sample_failed'][:20]:
            md += f"| {s['id']} | {s['province']} | {s['district']} | {s.get('ward','')} | {s['reason'][:50]}... |\n"

    md += """
## Verification Target

| Target | Required | Actual | Status |
|--------|----------|--------|--------|
"""
    district_success = stats['success_rate']
    md += f"| District Match | >= 99% | {district_success}% | {'✅' if district_success >= 99 else '⚠️'} |\n"
    md += f"| Failed Records | <= 1% | {stats['fail_rate']}% | {'✅' if stats['fail_rate'] <= 1 else '⚠️'} |\n"

    with open(output_md, 'w', encoding='utf-8') as f:
        f.write(md)

    print(f"Reports saved: {output_md}, {output_json}")


# ==============================================================================
# MAIN
# ==============================================================================

def main():
    script_dir = Path(__file__).parent
    project_root = script_dir.parent

    # ARCHIVED: This script was used to normalize old dataset
    # Current dataset: app/data/listings_vn_postmerge.json (already normalized)
    # Input/output paths (for reference only)
    input_file = project_root / "app" / "data" / "vn_rental_3cities_verified.json"
    output_json = project_root / "app" / "data" / "vn_rental_3cities_geo_verified.json"
    output_csv = project_root / "app" / "data" / "vn_rental_3cities_geo_verified.csv"
    report_md = project_root / "reports" / "geo_qc_report_admin.md"
    report_json = project_root / "reports" / "geo_qc_report_admin.json"

    # Ensure directories
    (project_root / "data" / "boundaries").mkdir(parents=True, exist_ok=True)
    (project_root / "reports").mkdir(parents=True, exist_ok=True)

    # Load boundaries
    boundaries = GADMBoundaries()
    boundaries.load()

    # Normalize dataset
    stats = normalize_dataset(input_file, output_json, output_csv, boundaries)

    # Generate reports
    generate_report(stats, report_md, report_json)

    # Print summary
    print("\n" + "="*60)
    print("NORMALIZATION COMPLETE")
    print("="*60)
    print(f"Total: {stats['total']}")
    print(f"Matched: {stats['matched']} ({stats['match_rate']}%)")
    print(f"Adjusted: {stats['adjusted']} ({stats['adjust_rate']}%)")
    print(f"Failed: {stats['failed']} ({stats['fail_rate']}%)")
    print(f"Success Rate: {stats['success_rate']}%")
    print(f"\nOutput: {output_json}")
    print(f"Report: {report_md}")

    return 0 if stats['success_rate'] >= 99 else 1


if __name__ == "__main__":
    sys.exit(main())
