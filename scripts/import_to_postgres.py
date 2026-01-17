"""
Import JFinder data from JSON file to PostgreSQL database
Updated schema for verified dataset with market_segment, type, frontage
"""
import psycopg2
from psycopg2.extras import execute_values
import json
from pathlib import Path

# Configuration
DATA_FILE = Path(__file__).parent.parent / "app" / "data" / "listings_vn_postmerge.json"
POSTGRES_CONFIG = {
    "host": "localhost",
    "port": 5433,
    "database": "jfinder_db",
    "user": "jfinder",
    "password": "jfinder_password"
}

def load_data():
    """Load data from JSON file"""
    print(f"📥 Loading data from {DATA_FILE}...")
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"✅ Loaded {len(data)} listings")
        return data
    except Exception as e:
        print(f"❌ Failed to load data: {e}")
        return None

def create_table(conn):
    """Create jfinder_listings table with new schema"""
    print("🔨 Creating table with new schema...")

    cursor = conn.cursor()

    # Drop table if exists
    cursor.execute("DROP TABLE IF EXISTS jfinder_listings CASCADE;")

    # Create table - NEW SCHEMA matching verified dataset
    create_table_sql = """
    CREATE TABLE jfinder_listings (
        id VARCHAR(50) PRIMARY KEY,
        name TEXT,
        address TEXT,
        province VARCHAR(100),
        district VARCHAR(100),
        ward VARCHAR(100),
        admin_codes TEXT,
        latitude REAL,
        longitude REAL,
        type VARCHAR(50),
        market_segment VARCHAR(50),
        area REAL,
        frontage REAL,
        floors INTEGER,
        rent_per_sqm_million REAL,
        price REAL,
        currency VARCHAR(10),
        price_unit VARCHAR(50),
        images TEXT,
        amenities_schools INTEGER,
        amenities_offices INTEGER,
        amenities_competitors INTEGER,
        ai_suggested_price REAL,
        ai_potential_score REAL,
        ai_risk_level VARCHAR(50),
        views INTEGER,
        saved_count INTEGER,
        posted_at TIMESTAMP,
        owner_name VARCHAR(200),
        owner_phone VARCHAR(50),
        primary_image_url TEXT,
        image_source VARCHAR(100),
        image_author VARCHAR(200),
        image_license_names TEXT,
        image_license_urls TEXT,
        image_page_url TEXT,
        image_required_credit VARCHAR(200)
    );
    """

    cursor.execute(create_table_sql)

    # Create indexes for common queries
    cursor.execute("CREATE INDEX idx_province ON jfinder_listings(province);")
    cursor.execute("CREATE INDEX idx_district ON jfinder_listings(district);")
    cursor.execute("CREATE INDEX idx_type ON jfinder_listings(type);")
    cursor.execute("CREATE INDEX idx_market_segment ON jfinder_listings(market_segment);")
    cursor.execute("CREATE INDEX idx_price ON jfinder_listings(price);")
    cursor.execute("CREATE INDEX idx_area ON jfinder_listings(area);")
    cursor.execute("CREATE INDEX idx_lat_lon ON jfinder_listings(latitude, longitude);")

    conn.commit()
    print("✅ Table created successfully")

def insert_data(conn, listings):
    """Insert listings into PostgreSQL with new schema"""
    print(f"💾 Inserting {len(listings)} listings...")

    cursor = conn.cursor()

    insert_sql = """
    INSERT INTO jfinder_listings (
        id, name, address, province, district, ward, admin_codes,
        latitude, longitude, type, market_segment,
        area, frontage, floors, rent_per_sqm_million, price, currency, price_unit,
        images, amenities_schools, amenities_offices, amenities_competitors,
        ai_suggested_price, ai_potential_score, ai_risk_level,
        views, saved_count, posted_at,
        owner_name, owner_phone, primary_image_url,
        image_source, image_author, image_license_names, image_license_urls,
        image_page_url, image_required_credit
    ) VALUES %s
    """

    def parse_owner(owner_str):
        """Parse owner string like {'name': 'X', 'phone': 'Y'}"""
        if not owner_str:
            return None, None
        if isinstance(owner_str, dict):
            return owner_str.get('name'), owner_str.get('phone')
        try:
            import ast
            owner_dict = ast.literal_eval(owner_str)
            return owner_dict.get('name'), owner_dict.get('phone')
        except:
            return None, None

    values = []
    for listing in listings:
        owner_name, owner_phone = parse_owner(listing.get('owner'))

        values.append((
            listing.get('id'),
            listing.get('name'),
            listing.get('address'),
            listing.get('province'),
            listing.get('district'),
            listing.get('ward'),
            listing.get('admin_codes'),
            listing.get('latitude'),
            listing.get('longitude'),
            listing.get('type'),
            listing.get('market_segment'),
            listing.get('area'),
            listing.get('frontage'),
            listing.get('floors'),
            listing.get('rent_per_sqm_million'),
            listing.get('price'),
            listing.get('currency', 'VND'),
            listing.get('price_unit', 'million_vnd_per_month'),
            listing.get('images'),
            listing.get('amenities_schools'),
            listing.get('amenities_offices'),
            listing.get('amenities_competitors'),
            listing.get('ai_suggested_price'),
            listing.get('ai_potential_score'),
            listing.get('ai_risk_level'),
            listing.get('views'),
            listing.get('savedCount'),
            listing.get('posted_at'),
            owner_name,
            owner_phone,
            listing.get('primary_image_url'),
            listing.get('image_source'),
            listing.get('image_author'),
            listing.get('image_license_names'),
            listing.get('image_license_urls'),
            listing.get('image_page_url'),
            listing.get('image_required_credit')
        ))

    execute_values(cursor, insert_sql, values)
    conn.commit()

    print(f"✅ Inserted {len(listings)} records successfully")

def main():
    print("\n" + "="*60)
    print("🚀 JFinder → PostgreSQL Import Tool (New Schema)")
    print("="*60 + "\n")

    # Step 1: Load data from file
    listings = load_data()
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
