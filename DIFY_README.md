# 🤖 Dify AI Chatbot - Quick Start

## ✅ Đã setup sẵn:

- ✅ API `/api/dify/listings` - Tìm kiếm mặt bằng
- ✅ API `/api/dify/stats` - Thống kê thị trường
- ✅ Component `DifyChatWidget` - Widget chat
- ✅ Integrated vào home page

## 🚀 Next Steps (3 phút):

### 1. Tạo Dify Chatbot (FREE)

```bash
# Truy cập
https://cloud.dify.ai/

# Sign up → Create App → Chatbot
# Name: "JFinder AI"
```

### 2. Setup trong Dify

**Instructions:**

```
Bạn là chuyên gia tư vấn mặt bằng cho thuê tại Việt Nam.
Tư vấn dựa trên data từ 1170 listings ở HN/DN/HCM.
Luôn dùng API tools để trả lời chính xác về giá và thị trường.
```

**Add Tools:**

Tool 1 - Search Listings:

- URL: `https://grp3mbtt.vercel.app/api/dify/listings`
- Method: POST
- Body: `{"district":"Quận 1","limit":5}`

Tool 2 - Market Stats:

- URL: `https://grp3mbtt.vercel.app/api/dify/stats`
- Method: POST
- Body: `{"district":"Quận 1","type":"streetfront"}`

### 3. Get API Key & Deploy

```bash
# Copy API key từ Dify → API Access

# Tạo .env.local
echo "NEXT_PUBLIC_DIFY_API_KEY=your-key-here" > .env.local

# Deploy
npm run build
npx vercel --prod
```

## 📝 Test queries:

- "Tìm mặt bằng mở cafe ở Quận 1"
- "Giá thuê trung bình ở Hà Nội"
- "So sánh Quận 1 và Phú Nhuận"

## 📊 Available data:

- **1170 listings** (HN, DN, HCM)
- **32 districts** across 3 cities
- **4 types:** streetfront, office, shophouse, kiosk
- **3 segments:** street_retail, office, shopping_mall

## 🔄 Update data:

Khi có data mới:

```bash
# 1. Replace file
cp new_data.json app/data/vn_rental_3cities_verified.json

# 2. Redeploy
npx vercel --prod
```

Chatbot tự động dùng data mới!

## 📖 Chi tiết:

Xem `docs/DIFY_SETUP.md` để config nâng cao.
