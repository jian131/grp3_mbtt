"""
Import JFinder data from Next.js API to PostgreSQL database
"""
import requests
import psycopg2
from psycopg2.extras import execute_values
import json

# Configuration
NEXTJS_API_URL = "http://localhost:3000/api/export?format=json"
POSTGRES_CONFIG = {
    "host": "localhost",
    "port": 5433,
    "database": "jfinder_db",
    "user": "jfinder",
    "password": "jfinder_password"
}

def fetch_jfinder_data():
    """Fetch data from Next.js API"""
    print("📥 Fetching JFinder data from Next.js API...")
    try:
        response = requests.get(NEXTJS_API_URL)
        response.raise_for_status()
        data = response.json()
        listings = data.get("data", [])
        print(f"✅ Fetched {len(listings)} listings")
        return listings
    except Exception as e:
        print(f"❌ Failed to fetch data: {e}")
        return None

def create_table(conn):
    """Create jfinder_listings table"""
    print("🔨 Creating table...")

    cursor = conn.cursor()

    # Drop table if exists
    cursor.execute("DROP TABLE IF EXISTS jfinder_listings CASCADE;")

    # Create table
    create_table_sql = """
    CREATE TABLE jfinder_listings (
        id VARCHAR(50) PRIMARY KEY,
        title TEXT,
        price BIGINT,
        area REAL,
        address TEXT,
        province VARCHAR(100),
        district VARCHAR(100),
        ward VARCHAR(100),
        lat REAL,
        lon REAL,
        bedrooms INTEGER,
        bathrooms INTEGER,
        toilets INTEGER,
        floors INTEGER,
        status VARCHAR(50),
        contact_name VARCHAR(200),
        contact_phone VARCHAR(50),
        is_verified BOOLEAN,
        images TEXT,
        ai_potential_score REAL,
        ai_suggested_price BIGINT,
        ai_risk_level VARCHAR(50),
        ai_price_label VARCHAR(50),
        roi_monthly_yield REAL,
        roi_annual_yield REAL,
        roi_occupancy_rate REAL,
        roi_market_demand VARCHAR(50),
        valuation_market_value BIGINT,
        valuation_confidence REAL,
        valuation_price_range_min BIGINT,
        valuation_price_range_max BIGINT,
        created_at TIMESTAMP,
        updated_at TIMESTAMP,
        scraped_at TIMESTAMP
    );
    """

    cursor.execute(create_table_sql)

    # Create indexes
    cursor.execute("CREATE INDEX idx_province ON jfinder_listings(province);")
    cursor.execute("CREATE INDEX idx_district ON jfinder_listings(district);")
    cursor.execute("CREATE INDEX idx_price ON jfinder_listings(price);")
    cursor.execute("CREATE INDEX idx_lat_lon ON jfinder_listings(lat, lon);")

    conn.commit()
    print("✅ Table created successfully")

def insert_data(conn, listings):
    """Insert listings into PostgreSQL"""
    print(f"💾 Inserting {len(listings)} listings...")

    cursor = conn.cursor()

    # Prepare data
    insert_sql = """
    INSERT INTO jfinder_listings (
        id, title, price, area, address, province, district, ward,
        lat, lon, bedrooms, bathrooms, toilets, floors,
        status, contact_name, contact_phone, is_verified,
        images,
        ai_potential_score, ai_suggested_price, ai_risk_level, ai_price_label,
        roi_monthly_yield, roi_annual_yield, roi_occupancy_rate, roi_market_demand,
        valuation_market_value, valuation_confidence, valuation_price_range_min, valuation_price_range_max,
        created_at, updated_at, scraped_at
    ) VALUES %s
    """

    values = []
    for listing in listings:
        # Handle images array - convert to JSON string
        images = listing.get('images', [])
        images_str = json.dumps(images) if images else '[]'

        values.append((
            listing.get('id'),
            listing.get('title'),
            listing.get('price'),
            listing.get('area'),
            listing.get('address'),
            listing.get('province'),
            listing.get('district'),
            listing.get('ward'),
            listing.get('lat'),
            listing.get('lon'),
            listing.get('bedrooms'),
            listing.get('bathrooms'),
            listing.get('toilets'),
            listing.get('floors'),
            listing.get('status'),
            listing.get('contact_name'),
            listing.get('contact_phone'),
            listing.get('is_verified', False),
            images_str,
            listing.get('ai_potential_score'),
            listing.get('ai_suggested_price'),
            listing.get('ai_risk_level'),
            listing.get('ai_price_label'),
            listing.get('roi_monthly_yield'),
            listing.get('roi_annual_yield'),
            listing.get('roi_occupancy_rate'),
            listing.get('roi_market_demand'),
            listing.get('valuation_market_value'),
            listing.get('valuation_confidence'),
            listing.get('valuation_price_range_min'),
            listing.get('valuation_price_range_max'),
            listing.get('created_at'),
            listing.get('updated_at'),
            listing.get('scraped_at')
        ))

    execute_values(cursor, insert_sql, values)
    conn.commit()

    print(f"✅ Inserted {len(listings)} records successfully")

def main():
    print("\n" + "="*60)
    print("🚀 JFinder → PostgreSQL Import Tool")
    print("="*60 + "\n")

    # Step 1: Fetch data
    listings = fetch_jfinder_data()
    if not listings:
        print("\n❌ No data to import")
        return

    # Step 2: Connect to PostgreSQL
    print("🔌 Connecting to PostgreSQL...")
    try:
        conn = psycopg2.connect(**POSTGRES_CONFIG)
        print("✅ Connected to PostgreSQL")
    except Exception as e:
        print(f"❌ Failed to connect to PostgreSQL: {e}")
        return

    try:
        # Step 3: Create table
        create_table(conn)

        # Step 4: Insert data
        insert_data(conn, listings)

        print("\n" + "="*60)
        print("✅ SUCCESS! Data imported to PostgreSQL")
        print("="*60)
        print(f"\n📊 Database: jfinder_db")
        print(f"📁 Table: jfinder_listings")
        print(f"📈 Records: {len(listings)}")
        print(f"\n🌐 Next steps:")
        print(f"   1. Open http://localhost:8088")
        print(f"   2. The PostgreSQL connection already exists")
        print(f"   3. Go to Datasets → + Dataset")
        print(f"   4. Select database 'jfinder_db'")
        print(f"   5. Select schema 'public'")
        print(f"   6. Select table 'jfinder_listings'")
        print(f"   7. Create charts and dashboards!")

    except Exception as e:
        print(f"❌ Error during import: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()
        print("\n🔌 Connection closed")

if __name__ == "__main__":
    main()
