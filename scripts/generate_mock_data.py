import json
import random
import os
from datetime import datetime, timedelta
try:
    from sqlalchemy import create_engine, text
    import pandas as pd
except ImportError:
    print("Thiếu thư viện: sqlalchemy, pandas, psycopg2-binary. Vui lòng cài đặt nếu muốn lưu vào DB.")

# Dữ liệu gốc để sinh ngẫu nhiên
DISTRICTS = [
    {"name": "Hoàn Kiếm", "wards": ["Hàng Bông", "Hàng Buồm", "Hàng Đào", "Hàng Gai", "Cửa Đông", "Lý Thái Tổ", "Trần Hưng Đạo"], "lat_range": (21.025, 21.040), "lng_range": (105.845, 105.860), "price_mult": 2.5},
    {"name": "Ba Đình", "wards": ["Cống Vị", "Điện Biên", "Đội Cấn", "Giảng Võ", "Kim Mã", "Liễu Giai", "Ngọc Hà", "Ngọc Khánh", "Phúc Xá"], "lat_range": (21.028, 21.050), "lng_range": (105.810, 105.840), "price_mult": 2.0},
    {"name": "Đống Đa", "wards": ["Cát Linh", "Hàng Bột", "Khâm Thiên", "Khương Thượng", "Kim Liên", "Láng Hạ", "Láng Thượng", "Ô Chợ Dừa", "Phương Liên", "Quang Trung", "Thịnh Quang", "Trung Liệt", "Trung Phụng", "Văn Chương", "Văn Miếu"], "lat_range": (21.010, 21.030), "lng_range": (105.810, 105.835), "price_mult": 1.8},
    {"name": "Hai Bà Trưng", "wards": ["Bách Khoa", "Bạch Đằng", "Bạch Mai", "Cầu Dền", "Đồng Nhân", "Đồng Tâm", "Lê Đại Hành", "Minh Khai", "Ngô Thì Nhậm", "Nguyễn Du", "Phạm Đình Hổ", "Phố Huế", "Quỳnh Lôi", "Quỳnh Mai", "Thanh Lương", "Thanh Nhàn", "Trương Định", "Vĩnh Tuy"], "lat_range": (20.990, 21.015), "lng_range": (105.840, 105.870), "price_mult": 1.6},
    {"name": "Thanh Xuân", "wards": ["Hạ Đình", "Khương Đình", "Khương Mai", "Khương Trung", "Kim Giang", "Nhân Chính", "Phương Liệt", "Thanh Xuân Bắc", "Thanh Xuân Nam", "Thanh Xuân Trung", "Thượng Đình"], "lat_range": (20.985, 21.005), "lng_range": (105.800, 105.825), "price_mult": 1.4},
    {"name": "Cầu Giấy", "wards": ["Dịch Vọng", "Dịch Vọng Hậu", "Mai Dịch", "Nghĩa Đô", "Nghĩa Tân", "Quan Hoa", "Trung Hòa", "Yên Hòa"], "lat_range": (21.020, 21.045), "lng_range": (105.780, 105.810), "price_mult": 1.7},
    {"name": "Nam Từ Liêm", "wards": ["Cầu Diễn", "Đại Mỗ", "Mễ Trì", "Mỹ Đình 1", "Mỹ Đình 2", "Phú Đô", "Phương Canh", "Tây Mỗ", "Trung Văn", "Xuân Phương"], "lat_range": (20.995, 21.025), "lng_range": (105.755, 105.790), "price_mult": 1.3},
    {"name": "Bắc Từ Liêm", "wards": ["Cổ Nhuế 1", "Cổ Nhuế 2", "Đông Ngạc", "Đức Thắng", "Liên Mạc", "Minh Khai", "Phú Diễn", "Phúc Diễn", "Tây Tựu", "Thượng Cát", "Thụy Phương", "Xuân Đỉnh", "Xuân Tảo"], "lat_range": (21.050, 21.090), "lng_range": (105.755, 105.800), "price_mult": 1.1},
    {"name": "Hoàng Mai", "wards": ["Đại Kim", "Định Công", "Giáp Bát", "Hoàng Liệt", "Hoàng Văn Thụ", "Lĩnh Nam", "Mai Động", "Tân Mai", "Thanh Trì", "Thịnh Liệt", "Trần Phú", "Tương Mai", "Vĩnh Hưng", "Yên Sở"], "lat_range": (20.960, 20.995), "lng_range": (105.830, 105.870), "price_mult": 1.2},
    {"name": "Long Biên", "wards": ["Bồ Đề", "Cự Khối", "Đức Giang", "Gia Thụy", "Giang Biên", "Long Biên", "Ngọc Lâm", "Ngọc Thụy", "Phúc Đồng", "Phúc Lợi", "Sài Đồng", "Thạch Bàn", "Thượng Thanh", "Việt Hưng"], "lat_range": (21.030, 21.070), "lng_range": (105.870, 105.920), "price_mult": 1.0},
    {"name": "Hà Đông", "wards": ["Biên Giang", "Dương Nội", "Đồng Mai", "Hà Cầu", "Kiến Hưng", "La Khê", "Mộ Lao", "Nguyễn Trãi", "Phú La", "Phú Lãm", "Phú Lương", "Phúc La", "Quang Trung", "Văn Quán", "Vạn Phúc", "Yên Nghĩa", "Yết Kiêu"], "lat_range": (20.955, 20.990), "lng_range": (105.755, 105.800), "price_mult": 1.0},
    {"name": "Tây Hồ", "wards": ["Bưởi", "Nhật Tân", "Phú Thượng", "Quảng An", "Thụy Khuê", "Tứ Liên", "Xuân La", "Yên Phụ"], "lat_range": (21.050, 21.085), "lng_range": (105.810, 105.850), "price_mult": 1.9},
]

STREETS = [
    "Nguyễn Trãi", "Lê Văn Lương", "Trần Duy Hưng", "Nguyễn Chí Thanh", "Láng Hạ", "Hoàng Đạo Thúy",
    "Khuất Duy Tiến", "Phạm Hùng", "Tố Hữu", "Nguyễn Xiển", "Giải Phóng", "Trường Chinh",
    "Đại Cồ Việt", "Bạch Mai", "Lê Duẩn", "Đinh Tiên Hoàng", "Hai Bà Trưng", "Lý Thường Kiệt",
    "Trần Hưng Đạo", "Phố Huế", "Hàng Bài", "Hàng Khay", "Tràng Tiền", "Hàng Đào",
    "Cầu Giấy", "Xuân Thủy", "Phạm Văn Đồng", "Hoàng Quốc Việt", "Nguyễn Văn Huyên",
    "Kim Mã", "Đội Cấn", "Hoàng Hoa Thám", "Thụy Khuê", "Lạc Long Quân",
    "Võ Chí Công", "Âu Cơ", "Nghi Tàm", "Yên Phụ", "Thanh Niên",
    "Ngọc Hồi", "Nguyễn Hữu Thọ", "Tôn Thất Thuyết", "Dương Đình Nghệ"
]

TYPES = ["shophouse", "kiosk", "office", "retail"]
TYPE_NAMES = {
    "shophouse": ["Shophouse", "Nhà mặt phố", "Mặt bằng kinh doanh", "Nhà phố thương mại"],
    "kiosk": ["Kiosk", "Gian hàng", "Quầy bán hàng", "Ki-ốt"],
    "office": ["Văn phòng", "Office", "Văn phòng cho thuê", "Không gian làm việc"],
    "retail": ["Mặt bằng bán lẻ", "Cửa hàng", "Showroom", "Mặt bằng thương mại"]
}

BUSINESS_TYPES = [
    "Cafe", "Trà sữa", "Nhà hàng", "Quán ăn", "Spa", "Gym", "Siêu thị mini", "Cửa hàng tiện lợi",
    "Thời trang", "Mỹ phẩm", "Điện thoại", "Laptop", "Nội thất", "Trang sức", "Đồng hồ",
    "Phòng khám", "Nha khoa", "Thú y", "Giáo dục", "Trung tâm Anh ngữ", "Trung tâm tin học",
    "Ngân hàng", "Bảo hiểm", "Bất động sản", "Luật sư", "Kế toán", "Dịch vụ",
    "Hoa tươi", "Bánh ngọt", "Đồ ăn nhanh", "Pizza", "Gà rán", "Lẩu", "BBQ"
]

IMAGES = [
    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800",
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800",
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
    "https://images.unsplash.com/photo-1558857563-b371033873b8?w=800",
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800",
    "https://images.unsplash.com/photo-1582037928769-181f2644ecb7?w=800",
    "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=800",
]

def generate_listing(index):
    district = random.choice(DISTRICTS)
    ward = random.choice(district["wards"])
    street = random.choice(STREETS)
    house_number = random.randint(1, 500)
    listing_type = random.choice(TYPES)
    business = random.choice(BUSINESS_TYPES)

    # Tọa độ ngẫu nhiên trong phạm vi quận
    lat = round(random.uniform(*district["lat_range"]), 6)
    lng = round(random.uniform(*district["lng_range"]), 6)

    # Giá dựa trên loại và quận
    base_price = {
        "shophouse": random.randint(30, 150),
        "kiosk": random.randint(8, 35),
        "office": random.randint(40, 300),
        "retail": random.randint(20, 100)
    }[listing_type]
    price = round(base_price * district["price_mult"])

    # Diện tích
    area = {
        "shophouse": random.randint(40, 200),
        "kiosk": random.randint(6, 25),
        "office": random.randint(50, 500),
        "retail": random.randint(20, 150)
    }[listing_type]

    # Mặt tiền
    frontage = round(random.uniform(2, 15), 1)
    floors = random.randint(1, 5) if listing_type != "kiosk" else 1

    # POI data
    schools = random.randint(0, 8)
    offices = random.randint(0, 30)
    competitors = random.randint(0, 25)
    bus_stops = random.randint(0, 6)
    markets = random.randint(0, 4)

    # AI Analysis
    potential_base = 50 + schools * 2 + offices * 1.5 - competitors * 1.2 + bus_stops * 3
    potential_score = max(20, min(98, int(potential_base + random.randint(-10, 15))))

    suggested_price = round(price * random.uniform(0.85, 1.15))
    if price > suggested_price * 1.1:
        price_label = "expensive"
    elif price < suggested_price * 0.9:
        price_label = "cheap"
    else:
        price_label = "fair"

    risk_levels = ["low", "medium", "high"]
    risk_weights = [0.5, 0.35, 0.15] if potential_score > 70 else [0.2, 0.4, 0.4]
    risk_level = random.choices(risk_levels, weights=risk_weights)[0]

    growth_forecast = round(random.uniform(1, 12), 1)

    # Views & Saved
    views = random.randint(100, 5000)
    saved_count = random.randint(5, int(views * 0.1))

    # Date
    days_ago = random.randint(1, 90)
    posted_at = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")

    # Owner
    first_names = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ"]
    middle_names = ["Văn", "Thị", "Hữu", "Đức", "Minh", "Hoàng", "Quốc", "Thành", "Hồng", "Xuân"]
    last_names = ["Anh", "Bình", "Cường", "Dũng", "Hùng", "Lan", "Mai", "Nam", "Phương", "Quân", "Sơn", "Tùng", "Việt"]

    owner_name = f"{random.choice(first_names)} {random.choice(middle_names)} {random.choice(last_names)}"
    phone = f"09{random.randint(10000000, 99999999)}"

    type_name = random.choice(TYPE_NAMES[listing_type])
    name = f"{type_name} {business} - {street}"

    return {
        "id": f"MB{str(index).zfill(4)}",
        "name": name,
        "address": f"{house_number} {street}, Phường {ward}",
        "district": district["name"],
        "ward": ward,
        "latitude": lat,
        "longitude": lng,
        "price": price,
        "area": area,
        "frontage": frontage,
        "floors": floors,
        "type": listing_type,
        "images": [random.choice(IMAGES)],
        "amenities_schools": schools,
        "amenities_offices": offices,
        "amenities_competitors": competitors,
        "ai_suggested_price": suggested_price,
        "ai_potential_score": potential_score,
        "ai_risk_level": risk_level,
        "views": views,
        "posted_at": posted_at,
        "savedCount": saved_count,
        "owner": {
            "name": owner_name,
            "phone": phone
        }
    }

def save_to_db(listings):
    # Kết nối DB từ biến môi trường hoặc mặc định
    db_user = os.getenv("POSTGRES_USER", "jfinder")
    db_pass = os.getenv("POSTGRES_PASSWORD", "jfinder_password")
    db_host = os.getenv("POSTGRES_HOST", "localhost")
    db_port = os.getenv("POSTGRES_PORT", "5432")
    db_name = os.getenv("POSTGRES_DB", "jfinder_db")

    connection_str = f"postgresql://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"

    try:
        print(f"Đang kết nối Database: {db_host}...")
        engine = create_engine(connection_str)

        # Chuyển list dict thành DataFrame
        df = pd.DataFrame(listings)

        # Lưu vào bảng 'listings' (tự tạo bảng nếu chưa có)
        df.to_sql('listings', engine, if_exists='replace', index=False)
        print("✅ Đã lưu thành công 1000 bản ghi vào PostgreSQL!")

    except Exception as e:
        print(f"❌ Lỗi kết nối DB: {e}")
        print("💡 Gợi ý: Hãy chắc chắn Docker container 'db' đang chạy.")

def main():
    print("Đang sinh 1000 bản ghi...")
    listings = [generate_listing(i + 1) for i in range(1000)]

    # Lưu JSON
    with open("mockListings.json", "w", encoding="utf-8") as f:
        json.dump(listings, f, ensure_ascii=False, indent=2)

    print(f"Đã sinh {len(listings)} bản ghi vào file mockListings.json")

    # Lưu vào Database (cho Superset/BI)
    save_to_db(listings)

    # Thống kê
    districts = {}
    types = {}
    for l in listings:
        districts[l["district"]] = districts.get(l["district"], 0) + 1
        types[l["type"]] = types.get(l["type"], 0) + 1

    print("\n=== THỐNG KÊ ===")
    print("\nTheo Quận:")
    for d, c in sorted(districts.items(), key=lambda x: -x[1]):
        print(f"  {d}: {c}")
    print("\nTheo Loại:")
    for t, c in sorted(types.items(), key=lambda x: -x[1]):
        print(f"  {t}: {c}")

if __name__ == "__main__":
    main()
