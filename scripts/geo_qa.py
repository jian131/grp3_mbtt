#!/usr/bin/env python3
"""
JFinder Geo QA Script
Analyzes geo data quality and generates QC report

Usage:
    python scripts/geo_qa.py
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime
from collections import defaultdict
from typing import Dict, List, Any, Tuple

# Vietnam bounds
VN_BOUNDS = {
    "lat_min": 8.5,
    "lat_max": 23.5,
    "lon_min": 102.0,
    "lon_max": 110.0
}

# City bounds (approximate)
CITY_BOUNDS = {
    "Thành phố Hà Nội": {
        "lat_min": 20.5, "lat_max": 21.4,
        "lon_min": 105.3, "lon_max": 106.1
    },
    "Thành phố Đà Nẵng": {
        "lat_min": 15.9, "lat_max": 16.2,
        "lon_min": 108.0, "lon_max": 108.4
    },
    "Thành phố Hồ Chí Minh": {
        "lat_min": 10.3, "lat_max": 11.2,
        "lon_min": 106.3, "lon_max": 107.0
    }
}


def is_valid_coords(lat: float, lon: float) -> bool:
    """Check if coordinates are valid for Vietnam"""
    try:
        lat = float(lat) if lat else 0
        lon = float(lon) if lon else 0
        return (
            VN_BOUNDS["lat_min"] <= lat <= VN_BOUNDS["lat_max"] and
            VN_BOUNDS["lon_min"] <= lon <= VN_BOUNDS["lon_max"]
        )
    except (TypeError, ValueError):
        return False


def is_coords_in_city(lat: float, lon: float, province: str) -> bool:
    """Check if coordinates fall within city bounds"""
    if province not in CITY_BOUNDS:
        return True  # Unknown city, assume valid

    bounds = CITY_BOUNDS[province]
    try:
        lat = float(lat)
        lon = float(lon)
        return (
            bounds["lat_min"] <= lat <= bounds["lat_max"] and
            bounds["lon_min"] <= lon <= bounds["lon_max"]
        )
    except (TypeError, ValueError):
        return False


def analyze_dataset(data: List[Dict]) -> Dict[str, Any]:
    """Analyze geo data quality"""

    total = len(data)
    valid_coords = 0
    invalid_coords = 0
    coords_outside_city = 0
    missing_lat = 0
    missing_lon = 0
    swapped_coords = 0  # lat/lon swapped

    by_province = defaultdict(lambda: {"total": 0, "valid": 0, "invalid": 0, "outside_city": 0})
    by_district = defaultdict(lambda: {"total": 0, "valid": 0, "invalid": 0})

    problem_records = []

    for record in data:
        lat = record.get("latitude") or record.get("lat")
        lon = record.get("longitude") or record.get("lon")
        province = record.get("province", "")
        district = record.get("district", "")

        key_province = province
        key_district = f"{province}|{district}"

        by_province[key_province]["total"] += 1
        by_district[key_district]["total"] += 1

        # Check for missing coords
        if lat is None or lat == "":
            missing_lat += 1
            invalid_coords += 1
            by_province[key_province]["invalid"] += 1
            by_district[key_district]["invalid"] += 1
            problem_records.append({
                "id": record.get("id"),
                "reason": "missing_lat",
                "lat": lat,
                "lon": lon,
                "province": province,
                "district": district
            })
            continue

        if lon is None or lon == "":
            missing_lon += 1
            invalid_coords += 1
            by_province[key_province]["invalid"] += 1
            by_district[key_district]["invalid"] += 1
            problem_records.append({
                "id": record.get("id"),
                "reason": "missing_lon",
                "lat": lat,
                "lon": lon,
                "province": province,
                "district": district
            })
            continue

        try:
            lat = float(lat)
            lon = float(lon)
        except (TypeError, ValueError):
            invalid_coords += 1
            by_province[key_province]["invalid"] += 1
            by_district[key_district]["invalid"] += 1
            problem_records.append({
                "id": record.get("id"),
                "reason": "invalid_format",
                "lat": lat,
                "lon": lon,
                "province": province,
                "district": district
            })
            continue

        # Check for swapped lat/lon (common error)
        if 102 <= lat <= 110 and 8.5 <= lon <= 23.5:
            swapped_coords += 1
            problem_records.append({
                "id": record.get("id"),
                "reason": "swapped_latlon",
                "lat": lat,
                "lon": lon,
                "province": province,
                "district": district
            })

        # Check if valid for Vietnam
        if not is_valid_coords(lat, lon):
            invalid_coords += 1
            by_province[key_province]["invalid"] += 1
            by_district[key_district]["invalid"] += 1
            problem_records.append({
                "id": record.get("id"),
                "reason": "outside_vietnam",
                "lat": lat,
                "lon": lon,
                "province": province,
                "district": district
            })
            continue

        # Check if within city bounds
        if not is_coords_in_city(lat, lon, province):
            coords_outside_city += 1
            by_province[key_province]["outside_city"] += 1
            problem_records.append({
                "id": record.get("id"),
                "reason": "outside_city_bounds",
                "lat": lat,
                "lon": lon,
                "province": province,
                "district": district
            })

        valid_coords += 1
        by_province[key_province]["valid"] += 1
        by_district[key_district]["valid"] += 1

    # Calculate rates
    valid_rate = valid_coords / total if total > 0 else 0

    province_stats = []
    for prov, stats in sorted(by_province.items()):
        prov_total = stats["total"]
        prov_valid = stats["valid"]
        province_stats.append({
            "province": prov,
            "total": prov_total,
            "valid": prov_valid,
            "invalid": stats["invalid"],
            "outside_city": stats["outside_city"],
            "valid_rate": prov_valid / prov_total if prov_total > 0 else 0
        })

    district_stats = []
    for dist_key, stats in sorted(by_district.items()):
        province, district = dist_key.split("|")
        dist_total = stats["total"]
        dist_valid = stats["valid"]
        district_stats.append({
            "province": province,
            "district": district,
            "total": dist_total,
            "valid": dist_valid,
            "invalid": stats["invalid"],
            "valid_rate": dist_valid / dist_total if dist_total > 0 else 0
        })

    # Sort problem districts by invalid count
    problem_districts = sorted(
        [d for d in district_stats if d["invalid"] > 0],
        key=lambda x: x["invalid"],
        reverse=True
    )[:10]

    return {
        "summary": {
            "total_records": total,
            "valid_coords": valid_coords,
            "invalid_coords": invalid_coords,
            "coords_outside_city": coords_outside_city,
            "missing_lat": missing_lat,
            "missing_lon": missing_lon,
            "swapped_coords": swapped_coords,
            "valid_rate": round(valid_rate * 100, 2),
            "analyzed_at": datetime.now().isoformat()
        },
        "by_province": province_stats,
        "by_district": district_stats,
        "top_problem_districts": problem_districts,
        "sample_problems": problem_records[:20]
    }


def generate_markdown_report(analysis: Dict[str, Any]) -> str:
    """Generate markdown report from analysis"""

    summary = analysis["summary"]

    md = f"""# Geo QC Report - JFinder

**Generated:** {summary["analyzed_at"]}

## Summary

| Metric | Value |
|--------|-------|
| Total Records | {summary["total_records"]} |
| Valid Coordinates | {summary["valid_coords"]} ({summary["valid_rate"]}%) |
| Invalid Coordinates | {summary["invalid_coords"]} |
| Outside City Bounds | {summary["coords_outside_city"]} |
| Missing Latitude | {summary["missing_lat"]} |
| Missing Longitude | {summary["missing_lon"]} |
| Swapped Lat/Lon | {summary["swapped_coords"]} |

## By Province

| Province | Total | Valid | Invalid | Outside City | Valid Rate |
|----------|-------|-------|---------|--------------|------------|
"""

    for prov in analysis["by_province"]:
        md += f"| {prov['province']} | {prov['total']} | {prov['valid']} | {prov['invalid']} | {prov['outside_city']} | {round(prov['valid_rate'] * 100, 1)}% |\n"

    md += """
## Top Problem Districts

| Province | District | Total | Invalid | Valid Rate |
|----------|----------|-------|---------|------------|
"""

    for dist in analysis["top_problem_districts"]:
        md += f"| {dist['province']} | {dist['district']} | {dist['total']} | {dist['invalid']} | {round(dist['valid_rate'] * 100, 1)}% |\n"

    if not analysis["top_problem_districts"]:
        md += "| *None* | *All districts have valid coordinates* | - | - | - |\n"

    md += """
## Sample Problem Records

| ID | Reason | Lat | Lon | Province | District |
|----|--------|-----|-----|----------|----------|
"""

    for rec in analysis["sample_problems"][:20]:
        md += f"| {rec['id']} | {rec['reason']} | {rec['lat']} | {rec['lon']} | {rec['province']} | {rec['district']} |\n"

    if not analysis["sample_problems"]:
        md += "| *None* | *No problems detected* | - | - | - | - |\n"

    md += """
## Recommendations

"""

    if summary["valid_rate"] >= 99:
        md += "✅ **Data quality is excellent** - All coordinates are valid and within expected bounds.\n"
    elif summary["valid_rate"] >= 95:
        md += "⚠️ **Data quality is good** - Minor issues detected, review sample problems above.\n"
    else:
        md += "❌ **Data quality needs improvement** - Significant coordinate issues detected.\n"
        md += "\n### Suggested Actions:\n"
        if summary["swapped_coords"] > 0:
            md += f"1. Fix {summary['swapped_coords']} records with swapped lat/lon\n"
        if summary["missing_lat"] > 0 or summary["missing_lon"] > 0:
            md += f"2. Add missing coordinates ({summary['missing_lat']} missing lat, {summary['missing_lon']} missing lon)\n"
        if summary["coords_outside_city"] > 0:
            md += f"3. Verify {summary['coords_outside_city']} records with coordinates outside expected city bounds\n"

    return md


def main():
    """Main function"""

    # Determine paths
    script_dir = Path(__file__).parent
    project_root = script_dir.parent

    # Input file - try multiple locations
    input_paths = [
        project_root / "app" / "data" / "vn_rental_3cities_verified.json",
        Path(os.environ.get("GADM_PACKAGE", "")) / "vn_rental_listings_3cities_realimg_pricefixed.json",
    ]

    input_file = None
    for path in input_paths:
        if path.exists():
            input_file = path
            break

    if not input_file:
        print("ERROR: No input file found")
        print("Looked in:")
        for p in input_paths:
            print(f"  - {p}")
        sys.exit(1)

    print(f"Analyzing: {input_file}")

    # Load data
    with open(input_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"Loaded {len(data)} records")

    # Analyze
    analysis = analyze_dataset(data)

    # Output paths
    reports_dir = project_root / "reports"
    reports_dir.mkdir(exist_ok=True)

    json_report = reports_dir / "geo_qc_report.json"
    md_report = reports_dir / "geo_qc_report.md"

    # Save JSON report
    with open(json_report, "w", encoding="utf-8") as f:
        json.dump(analysis, f, indent=2, ensure_ascii=False)
    print(f"Saved: {json_report}")

    # Save Markdown report
    md_content = generate_markdown_report(analysis)
    with open(md_report, "w", encoding="utf-8") as f:
        f.write(md_content)
    print(f"Saved: {md_report}")

    # Print summary
    print("\n" + "="*50)
    print("SUMMARY")
    print("="*50)
    print(f"Total: {analysis['summary']['total_records']}")
    print(f"Valid: {analysis['summary']['valid_coords']} ({analysis['summary']['valid_rate']}%)")
    print(f"Invalid: {analysis['summary']['invalid_coords']}")
    print(f"Outside city: {analysis['summary']['coords_outside_city']}")

    return 0 if analysis["summary"]["valid_rate"] >= 95 else 1


if __name__ == "__main__":
    sys.exit(main())
