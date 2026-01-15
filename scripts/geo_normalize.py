#!/usr/bin/env python3
"""
JFinder Geo Normalize Script
Chuẩn hóa lat/lon cho dataset 3 thành phố: Hà Nội, Đà Nẵng, TP.HCM
Sử dụng offline Point-in-Polygon (PIP) với GADM boundaries

Usage:
    python scripts/geo_normalize.py --input data/input.json --output data/verified.json
"""

import json
import csv
import argparse
import os
import sys
import random
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from collections import defaultdict
import unicodedata
import re

# Check for required packages
try:
    from shapely.geometry import Point, shape, mapping
    from shapely.ops import transform
    import pyproj
except ImportError:
    print("Installing required packages...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "shapely", "pyproj"])
    from shapely.geometry import Point, shape, mapping
    from shapely.ops import transform
    import pyproj

# ==============================================================================
# CONSTANTS & CONFIGURATION
# ==============================================================================

PROVINCES_3CITIES = {
    "Thành phố Hà Nội": ["ha noi", "hanoi", "hà nội", "hn"],
    "Thành phố Đà Nẵng": ["da nang", "danang", "đà nẵng", "dn"],
    "Thành phố Hồ Chí Minh": ["ho chi minh", "hcm", "hồ chí minh", "saigon", "sài gòn", "tp hcm", "tphcm"]
}

DISTRICT_PREFIXES = ["quận", "huyện", "thành phố", "thị xã", "tx", "tp"]
WARD_PREFIXES = ["phường", "xã", "thị trấn", "tt", "p."]

# Vietnamese character mapping for normalization
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

# ==============================================================================
# HELPER FUNCTIONS
# ==============================================================================

def normalize_text(text: str) -> str:
    """Normalize Vietnamese text for matching."""
    if not text:
        return ""

    # Lowercase and strip
    text = text.lower().strip()

    # Normalize unicode
    text = unicodedata.normalize('NFC', text)

    # Replace Vietnamese chars with ASCII
    for viet, ascii_char in VIET_CHARS.items():
        text = text.replace(viet, ascii_char)

    # Remove punctuation except spaces
    text = re.sub(r'[^\w\s]', '', text)

    # Collapse multiple spaces
    text = re.sub(r'\s+', ' ', text).strip()

    return text


def remove_prefix(name: str, prefixes: List[str]) -> str:
    """Remove administrative prefixes from name."""
    name_lower = name.lower().strip()

    for prefix in prefixes:
        if name_lower.startswith(prefix + " "):
            return name[len(prefix)+1:].strip()
        if name_lower.startswith(prefix + "."):
            return name[len(prefix)+1:].strip()

    return name


def normalize_admin_name(name: str, admin_type: str = 'ward') -> str:
    """Normalize administrative name for matching."""
    if not name:
        return ""

    # Remove prefixes based on type
    if admin_type == 'district':
        name = remove_prefix(name, DISTRICT_PREFIXES)
    elif admin_type == 'ward':
        name = remove_prefix(name, WARD_PREFIXES)

    return normalize_text(name)


def extract_number(text: str) -> Optional[int]:
    """Extract number from text like 'Quận 1' -> 1."""
    match = re.search(r'\d+', text)
    return int(match.group()) if match else None


class BoundaryIndex:
    """Index for admin boundaries with fast lookup."""

    def __init__(self):
        self.provinces: Dict[str, Any] = {}
        self.districts: Dict[str, Dict[str, Any]] = defaultdict(dict)
        self.wards: Dict[str, Dict[str, Dict[str, Any]]] = defaultdict(lambda: defaultdict(dict))
        self.province_polygons = {}
        self.district_polygons = {}
        self.ward_polygons = {}

    def add_polygon(self, province: str, district: str, ward: str, geometry: Any):
        """Add a polygon to the index."""
        prov_norm = normalize_admin_name(province, 'province')
        dist_norm = normalize_admin_name(district, 'district')
        ward_norm = normalize_admin_name(ward, 'ward')

        # Create shapely geometry
        try:
            poly = shape(geometry)
            if not poly.is_valid:
                poly = poly.buffer(0)

            key = f"{prov_norm}|{dist_norm}|{ward_norm}"
            self.ward_polygons[key] = {
                'polygon': poly,
                'centroid': poly.centroid,
                'province': province,
                'district': district,
                'ward': ward
            }

            # Also index at district level
            dist_key = f"{prov_norm}|{dist_norm}"
            if dist_key not in self.district_polygons:
                self.district_polygons[dist_key] = {
                    'polygons': [],
                    'province': province,
                    'district': district
                }
            self.district_polygons[dist_key]['polygons'].append(poly)

            # Province level
            if prov_norm not in self.province_polygons:
                self.province_polygons[prov_norm] = {
                    'polygons': [],
                    'province': province
                }
            self.province_polygons[prov_norm]['polygons'].append(poly)

        except Exception as e:
            print(f"Warning: Could not process polygon for {province}/{district}/{ward}: {e}")

    def find_ward_polygon(self, province: str, district: str, ward: str) -> Optional[Dict]:
        """Find ward polygon by normalized names."""
        prov_norm = normalize_admin_name(province, 'province')
        dist_norm = normalize_admin_name(district, 'district')
        ward_norm = normalize_admin_name(ward, 'ward')

        key = f"{prov_norm}|{dist_norm}|{ward_norm}"

        if key in self.ward_polygons:
            return self.ward_polygons[key]

        # Try matching with number extraction for numbered wards
        ward_num = extract_number(ward)
        if ward_num is not None:
            for k, v in self.ward_polygons.items():
                parts = k.split('|')
                if len(parts) == 3 and parts[0] == prov_norm and parts[1] == dist_norm:
                    existing_num = extract_number(parts[2])
                    if existing_num == ward_num:
                        return v

        return None

    def find_district_centroid(self, province: str, district: str) -> Optional[Tuple[float, float]]:
        """Get centroid of district."""
        prov_norm = normalize_admin_name(province, 'province')
        dist_norm = normalize_admin_name(district, 'district')

        dist_key = f"{prov_norm}|{dist_norm}"

        if dist_key in self.district_polygons:
            polys = self.district_polygons[dist_key]['polygons']
            if polys:
                from shapely.ops import unary_union
                merged = unary_union(polys)
                centroid = merged.centroid
                return (centroid.y, centroid.x)

        return None

    def find_province_centroid(self, province: str) -> Optional[Tuple[float, float]]:
        """Get centroid of province."""
        prov_norm = normalize_admin_name(province, 'province')

        if prov_norm in self.province_polygons:
            polys = self.province_polygons[prov_norm]['polygons']
            if polys:
                from shapely.ops import unary_union
                merged = unary_union(polys)
                centroid = merged.centroid
                return (centroid.y, centroid.x)

        return None

    def point_in_polygon(self, lat: float, lon: float, polygon: Any) -> bool:
        """Check if point is inside polygon."""
        point = Point(lon, lat)
        return polygon.contains(point)

    def get_random_point_in_polygon(self, polygon: Any) -> Tuple[float, float]:
        """Get random point inside polygon."""
        minx, miny, maxx, maxy = polygon.bounds

        for _ in range(100):
            random_point = Point(
                random.uniform(minx, maxx),
                random.uniform(miny, maxy)
            )
            if polygon.contains(random_point):
                return (random_point.y, random_point.x)

        # Fallback to centroid
        centroid = polygon.centroid
        return (centroid.y, centroid.x)


def load_geojson_boundaries(geojson_path: str, index: BoundaryIndex) -> int:
    """Load GeoJSON boundaries into index."""
    count = 0

    with open(geojson_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    features = data.get('features', [])

    for feature in features:
        props = feature.get('properties', {})
        geometry = feature.get('geometry')

        if not geometry:
            continue

        # GADM field names (may vary)
        province = props.get('NAME_1', props.get('province', props.get('VARNAME_1', '')))
        district = props.get('NAME_2', props.get('district', props.get('VARNAME_2', '')))
        ward = props.get('NAME_3', props.get('ward', props.get('VARNAME_3', '')))

        if province and district and ward:
            index.add_polygon(province, district, ward, geometry)
            count += 1

    return count


def generate_sample_boundaries() -> BoundaryIndex:
    """Generate sample boundary centroids for 3 cities when GADM not available."""
    index = BoundaryIndex()

    # Sample centroids for major districts
    # This is fallback data - real GADM should be used in production
    sample_data = {
        "Thành phố Hà Nội": {
            "Quận Hoàn Kiếm": (21.0285, 105.8541),
            "Quận Ba Đình": (21.0373, 105.8178),
            "Quận Đống Đa": (21.0147, 105.8258),
            "Quận Hai Bà Trưng": (21.0058, 105.8608),
            "Quận Hoàng Mai": (20.9740, 105.8640),
            "Quận Thanh Xuân": (20.9930, 105.8080),
            "Quận Cầu Giấy": (21.0320, 105.7830),
            "Quận Long Biên": (21.0420, 105.8870),
            "Quận Tây Hồ": (21.0690, 105.8190),
            "Quận Nam Từ Liêm": (21.0160, 105.7420),
            "Quận Bắc Từ Liêm": (21.0640, 105.7350),
            "Quận Hà Đông": (20.9580, 105.7590),
        },
        "Thành phố Đà Nẵng": {
            "Quận Hải Châu": (16.0540, 108.2210),
            "Quận Thanh Khê": (16.0690, 108.1790),
            "Quận Sơn Trà": (16.1050, 108.2480),
            "Quận Ngũ Hành Sơn": (16.0020, 108.2580),
            "Quận Liên Chiểu": (16.0760, 108.1480),
            "Quận Cẩm Lệ": (16.0110, 108.2010),
            "Huyện Hòa Vang": (15.9830, 108.0580),
        },
        "Thành phố Hồ Chí Minh": {
            "Quận 1": (10.7769, 106.6979),
            "Quận 2": (10.7878, 106.7501),
            "Quận 3": (10.7818, 106.6878),
            "Quận 4": (10.7578, 106.7068),
            "Quận 5": (10.7558, 106.6688),
            "Quận 6": (10.7468, 106.6348),
            "Quận 7": (10.7338, 106.7218),
            "Quận 8": (10.7228, 106.6358),
            "Quận 9": (10.8348, 106.8178),
            "Quận 10": (10.7718, 106.6658),
            "Quận 11": (10.7658, 106.6438),
            "Quận 12": (10.8668, 106.6548),
            "Quận Bình Thạnh": (10.8098, 106.7118),
            "Quận Phú Nhuận": (10.7978, 106.6778),
            "Quận Gò Vấp": (10.8368, 106.6658),
            "Quận Tân Bình": (10.8008, 106.6528),
            "Quận Tân Phú": (10.7898, 106.6258),
            "Quận Bình Tân": (10.7658, 106.6028),
            "Quận Thủ Đức": (10.8548, 106.7578),
        }
    }

    # Store as simple centroid lookup
    for province, districts in sample_data.items():
        prov_norm = normalize_admin_name(province, 'province')
        index.province_polygons[prov_norm] = {
            'province': province,
            'centroid': None,
            'polygons': []
        }

        for district, (lat, lon) in districts.items():
            dist_norm = normalize_admin_name(district, 'district')
            dist_key = f"{prov_norm}|{dist_norm}"

            index.district_polygons[dist_key] = {
                'province': province,
                'district': district,
                'centroid': (lat, lon),
                'polygons': []
            }

    return index


# ==============================================================================
# MAIN PROCESSING
# ==============================================================================

def process_listing(listing: Dict, index: BoundaryIndex) -> Dict:
    """Process a single listing for geo normalization."""
    result = listing.copy()

    province = listing.get('province', '')
    district = listing.get('district', '')
    ward = listing.get('ward', '')
    lat = listing.get('latitude', 0)
    lon = listing.get('longitude', 0)

    # Initialize geo fields
    result['geo_method'] = 'unchanged'
    result['geo_status'] = 'matched'
    result['admin_match_level'] = 'none'
    result['mismatch_reason'] = ''

    # Try to find ward polygon
    ward_data = index.find_ward_polygon(province, district, ward)

    if ward_data:
        polygon = ward_data['polygon']
        result['admin_match_level'] = 'ward'

        # Check if current lat/lon is in polygon
        if lat and lon and index.point_in_polygon(lat, lon, polygon):
            result['geo_method'] = 'unchanged'
            result['geo_status'] = 'matched'
        else:
            # Use centroid
            centroid = ward_data['centroid']
            if polygon.contains(centroid):
                result['latitude'] = centroid.y
                result['longitude'] = centroid.x
                result['geo_method'] = 'pip_centroid'
            else:
                # Use random point
                new_lat, new_lon = index.get_random_point_in_polygon(polygon)
                result['latitude'] = new_lat
                result['longitude'] = new_lon
                result['geo_method'] = 'pip_random'

            result['geo_status'] = 'adjusted'
            result['mismatch_reason'] = 'Original coordinates outside ward boundary'
    else:
        # Fallback to district centroid
        dist_centroid = index.find_district_centroid(province, district)

        if dist_centroid:
            result['latitude'] = dist_centroid[0]
            result['longitude'] = dist_centroid[1]
            result['geo_method'] = 'pip_centroid'
            result['geo_status'] = 'adjusted'
            result['admin_match_level'] = 'district'
            result['mismatch_reason'] = 'Ward polygon not found, using district centroid'
        else:
            # Fallback to province
            prov_centroid = index.find_province_centroid(province)

            if prov_centroid:
                result['latitude'] = prov_centroid[0]
                result['longitude'] = prov_centroid[1]
                result['geo_method'] = 'pip_centroid'
                result['geo_status'] = 'adjusted'
                result['admin_match_level'] = 'province'
                result['mismatch_reason'] = 'District not found, using province centroid'
            else:
                # Complete failure - keep original but mark as failed
                result['geo_status'] = 'failed'
                result['admin_match_level'] = 'none'
                result['mismatch_reason'] = 'No matching boundary found'

    return result


def generate_report(listings: List[Dict]) -> Dict:
    """Generate QC report from processed listings."""
    report = {
        'timestamp': datetime.now().isoformat(),
        'method': 'offline point-in-polygon using GADM boundaries',
        'total_listings': len(listings),
        'summary': {
            'matched': 0,
            'adjusted': 0,
            'failed': 0
        },
        'by_method': {},
        'by_province': [],
        'by_district': [],
        'by_ward': [],
        'missing_polygons': []
    }

    # Count by status and method
    for l in listings:
        status = l.get('geo_status', 'unknown')
        method = l.get('geo_method', 'unknown')

        report['summary'][status] = report['summary'].get(status, 0) + 1
        report['by_method'][method] = report['by_method'].get(method, 0) + 1

    # Aggregate by province
    prov_stats = defaultdict(lambda: {'total': 0, 'matched': 0, 'adjusted': 0, 'failed': 0})
    dist_stats = defaultdict(lambda: {'total': 0, 'matched': 0, 'adjusted': 0, 'failed': 0})
    ward_stats = defaultdict(lambda: {'total': 0, 'matched': 0, 'adjusted': 0, 'failed': 0})
    missing = set()

    for l in listings:
        prov = l.get('province', 'Unknown')
        dist = l.get('district', 'Unknown')
        ward = l.get('ward', 'Unknown')
        status = l.get('geo_status', 'unknown')
        match_level = l.get('admin_match_level', 'none')

        prov_stats[prov]['total'] += 1
        prov_stats[prov][status] += 1

        dist_key = f"{prov}|{dist}"
        dist_stats[dist_key]['total'] += 1
        dist_stats[dist_key][status] += 1
        dist_stats[dist_key]['province'] = prov
        dist_stats[dist_key]['district'] = dist

        ward_key = f"{prov}|{dist}|{ward}"
        ward_stats[ward_key]['total'] += 1
        ward_stats[ward_key][status] += 1
        ward_stats[ward_key]['province'] = prov
        ward_stats[ward_key]['district'] = dist
        ward_stats[ward_key]['ward'] = ward

        if match_level == 'none' or match_level == 'district':
            missing.add(ward_key)

    # Convert to lists
    for prov, stats in prov_stats.items():
        match_rate = (stats['matched'] / stats['total']) if stats['total'] > 0 else 0
        report['by_province'].append({
            'province': prov,
            **stats,
            'match_rate': round(match_rate, 4)
        })

    for key, stats in dist_stats.items():
        match_rate = (stats['matched'] / stats['total']) if stats['total'] > 0 else 0
        report['by_district'].append({
            'province': stats.get('province', ''),
            'district': stats.get('district', ''),
            'total': stats['total'],
            'matched': stats['matched'],
            'adjusted': stats['adjusted'],
            'failed': stats['failed'],
            'match_rate': round(match_rate, 4)
        })

    for key, stats in ward_stats.items():
        match_rate = (stats['matched'] / stats['total']) if stats['total'] > 0 else 0
        report['by_ward'].append({
            'province': stats.get('province', ''),
            'district': stats.get('district', ''),
            'ward': stats.get('ward', ''),
            'total': stats['total'],
            'matched': stats['matched'],
            'adjusted': stats['adjusted'],
            'failed': stats['failed'],
            'match_rate': round(match_rate, 4)
        })

    # Top missing polygons
    report['missing_polygons'] = list(missing)[:50]

    # Calculate overall match rate
    total = report['summary']['matched'] + report['summary']['adjusted'] + report['summary']['failed']
    if total > 0:
        report['overall_match_rate'] = round(
            (report['summary']['matched'] + report['summary']['adjusted']) / total, 4
        )
    else:
        report['overall_match_rate'] = 0

    return report


def generate_markdown_report(report: Dict) -> str:
    """Generate Markdown report."""
    md = []
    md.append("# Geo Normalization QC Report")
    md.append(f"\n**Generated:** {report['timestamp']}")
    md.append(f"\n**Method:** {report['method']}")
    md.append(f"\n**Total Listings:** {report['total_listings']}")

    md.append("\n## Summary")
    md.append(f"\n- ✅ Matched: {report['summary']['matched']}")
    md.append(f"- 🔄 Adjusted: {report['summary']['adjusted']}")
    md.append(f"- ❌ Failed: {report['summary']['failed']}")
    md.append(f"\n**Overall Success Rate:** {report['overall_match_rate'] * 100:.2f}%")

    md.append("\n## By Method")
    for method, count in report['by_method'].items():
        md.append(f"- {method}: {count}")

    md.append("\n## By Province")
    md.append("\n| Province | Total | Matched | Adjusted | Failed | Match Rate |")
    md.append("|----------|-------|---------|----------|--------|------------|")
    for p in report['by_province']:
        md.append(f"| {p['province']} | {p['total']} | {p['matched']} | {p['adjusted']} | {p['failed']} | {p['match_rate']*100:.1f}% |")

    md.append("\n## Top Districts")
    md.append("\n| Province | District | Total | Match Rate |")
    md.append("|----------|----------|-------|------------|")
    sorted_districts = sorted(report['by_district'], key=lambda x: x['total'], reverse=True)[:20]
    for d in sorted_districts:
        md.append(f"| {d['province'][:15]} | {d['district']} | {d['total']} | {d['match_rate']*100:.1f}% |")

    if report['missing_polygons']:
        md.append("\n## Missing Polygons (Top 10)")
        for mp in report['missing_polygons'][:10]:
            md.append(f"- {mp}")

    return "\n".join(md)


def main():
    parser = argparse.ArgumentParser(description='Geo normalize listings dataset')
    parser.add_argument('--input', '-i', required=True, help='Input JSON or CSV file')
    parser.add_argument('--output', '-o', required=True, help='Output base path (without extension)')
    parser.add_argument('--boundaries', '-b', help='GeoJSON boundaries file (optional)')
    parser.add_argument('--report-dir', '-r', default='reports', help='Reports directory')

    args = parser.parse_args()

    # Load boundary index
    index = BoundaryIndex()

    if args.boundaries and os.path.exists(args.boundaries):
        print(f"Loading boundaries from {args.boundaries}...")
        count = load_geojson_boundaries(args.boundaries, index)
        print(f"Loaded {count} ward polygons")
    else:
        print("No boundaries file provided, using sample centroids...")
        index = generate_sample_boundaries()

    # Load input data
    print(f"Loading input data from {args.input}...")

    if args.input.endswith('.csv'):
        with open(args.input, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            listings = list(reader)
    else:
        with open(args.input, 'r', encoding='utf-8') as f:
            listings = json.load(f)

    print(f"Loaded {len(listings)} listings")

    # Process listings
    print("Processing listings...")
    processed = []
    for i, listing in enumerate(listings):
        result = process_listing(listing, index)
        processed.append(result)

        if (i + 1) % 500 == 0:
            print(f"  Processed {i + 1}/{len(listings)}")

    print(f"Processed {len(processed)} listings")

    # Generate report
    print("Generating report...")
    report = generate_report(processed)

    # Create output directory
    output_dir = os.path.dirname(args.output)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)
    os.makedirs(args.report_dir, exist_ok=True)

    # Write outputs
    json_output = args.output if args.output.endswith('.json') else args.output + '.json'
    csv_output = args.output.replace('.json', '') + '.csv'

    with open(json_output, 'w', encoding='utf-8') as f:
        json.dump(processed, f, ensure_ascii=False, indent=2)
    print(f"Written JSON to {json_output}")

    # Write CSV
    if processed:
        with open(csv_output, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=processed[0].keys())
            writer.writeheader()
            writer.writerows(processed)
        print(f"Written CSV to {csv_output}")

    # Write reports
    report_json = os.path.join(args.report_dir, 'geo_qc_report.json')
    report_md = os.path.join(args.report_dir, 'geo_qc_report.md')

    with open(report_json, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(f"Written report to {report_json}")

    with open(report_md, 'w', encoding='utf-8') as f:
        f.write(generate_markdown_report(report))
    print(f"Written report to {report_md}")

    # Print summary
    print("\n" + "="*50)
    print("SUMMARY")
    print("="*50)
    print(f"Total: {report['total_listings']}")
    print(f"Matched: {report['summary']['matched']}")
    print(f"Adjusted: {report['summary']['adjusted']}")
    print(f"Failed: {report['summary']['failed']}")
    print(f"Overall success rate: {report['overall_match_rate']*100:.2f}%")


if __name__ == '__main__':
    main()
