"""
Script tự động lấy dữ liệu từ n8n API và export ra CSV cho Superset
Chạy: python scripts/export_to_superset.py
"""

import requests
import csv
import json
from datetime import datetime

# n8n API endpoint
API_BASE = "http://localhost:5678/webhook"

def fetch_listings():
    """Lấy toàn bộ listings từ n8n API"""
    try:
        response = requests.get(f"{API_BASE}/listings?limit=1000")
        data = response.json()
        return data.get('data', [])
    except Exception as e:
        print(f"Error fetching listings: {e}")
        return []

def flatten_listing(listing):
    """Flatten nested JSON structure cho CSV"""
    return {
        'id': listing.get('id'),
        'name': listing.get('name'),
        'district': listing.get('district'),
        'type': listing.get('type'),
        'price': listing.get('price'),
        'area': listing.get('area'),
        'frontage': listing.get('frontage'),
        'floors': listing.get('floors'),
        'latitude': listing.get('latitude'),
        'longitude': listing.get('longitude'),
        'ai_potential_score': listing.get('ai', {}).get('potentialScore'),
        'ai_suggested_price': listing.get('ai', {}).get('suggestedPrice'),
        'ai_risk_level': listing.get('ai', {}).get('riskLevel'),
        'ai_price_label': listing.get('ai', {}).get('priceLabel'),
        'views': listing.get('views'),
        'created_date': datetime.now().strftime('%Y-%m-%d')
    }

def export_to_csv(listings, filename='data/superset_listings.csv'):
    """Export dữ liệu ra CSV"""
    if not listings:
        print("No data to export")
        return

    flattened = [flatten_listing(l) for l in listings]

    # Write to CSV
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        fieldnames = flattened[0].keys()
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(flattened)

    print(f"✅ Exported {len(flattened)} listings to {filename}")

if __name__ == "__main__":
    print("Fetching data from n8n API...")
    listings = fetch_listings()

    if listings:
        export_to_csv(listings)
        print(f"Total rows: {len(listings)}")
        print("\nBạn có thể import file này vào Superset:")
        print("1. Mở http://localhost:8088")
        print("2. Data → Upload a CSV")
        print("3. Chọn file: data/superset_listings.csv")
    else:
        print("❌ No data found. Make sure n8n is running and workflow is active.")
