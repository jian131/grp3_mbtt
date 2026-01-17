# Hướng dẫn tích hợp Dify AI Chatbot

## 1. Tạo tài khoản Dify (MIỄN PHÍ)

1. Truy cập: https://cloud.dify.ai/
2. Sign up với Google/GitHub
3. Tạo workspace mới

## 2. Tạo Chatbot Agent

1. Click **"Create App"** → Chọn **"Chatbot"**
2. Đặt tên: `JFinder Tư vấn Mặt bằng`
3. Chọn Model: **GPT-3.5-turbo** (free tier) hoặc **Groq Llama 3.3** (nhanh hơn)

## 3. Cấu hình Instructions (System Prompt)

Paste vào Instructions:

```
Bạn là chuyên gia tư vấn bất động sản cho thuê mặt bằng tại Việt Nam (Hà Nội, Đà Nẵng, TP.HCM).

Nhiệm vụ:
1. Tư vấn chọn mặt bằng phù hợp dựa trên nhu cầu khách hàng (F&B, văn phòng, retail...)
2. Trả lời câu hỏi về thị trường: giá thuê, vị trí, xu hướng
3. So sánh các quận/khu vực
4. Gợi ý mặt bằng từ database

Luôn trả lời bằng tiếng Việt, thân thiện, chuyên nghiệp.
Khi khách hỏi về giá/thống kê, sử dụng API tools để lấy data chính xác.
```

## 4. Thêm API Tools

### Tool 1: Tìm kiếm mặt bằng

- Name: `search_listings`
- Method: `POST`
- URL: `https://grp3mbtt.vercel.app/api/dify/listings`
- Description: Tìm kiếm mặt bằng theo tiêu chí
- Parameters:
  ```json
  {
    "district": "string (optional)",
    "province": "string (optional)",
    "type": "string (optional): streetfront/office/shophouse/kiosk",
    "segment": "string (optional): street_retail/office/shopping_mall",
    "min_price": "number (optional)",
    "max_price": "number (optional)",
    "limit": "number (default: 10)"
  }
  ```

### Tool 2: Thống kê thị trường

- Name: `market_stats`
- Method: `POST`
- URL: `https://grp3mbtt.vercel.app/api/dify/stats`
- Description: Lấy thống kê giá thuê theo khu vực
- Parameters:
  ```json
  {
    "district": "string (optional)",
    "province": "string (optional)",
    "type": "string (optional)",
    "segment": "string (optional)"
  }
  ```

### Tool 3: Danh sách khu vực

- Name: `get_available_areas`
- Method: `GET`
- URL: `https://grp3mbtt.vercel.app/api/dify/listings`
- Description: Lấy danh sách quận/tỉnh có sẵn

## 5. Test Chatbot

Test trong Dify UI:

- "Tìm mặt bằng mở quán cafe ở Quận 1"
- "Giá thuê trung bình ở Hà Nội là bao nhiêu?"
- "So sánh Quận 1 và Phú Nhuận về giá thuê"

## 6. Deploy và Embed vào website

1. Click **"Publish"** trong Dify
2. Copy **API Key** từ tab "API Access"
3. Tạo file `.env.local`:
   ```env
   NEXT_PUBLIC_DIFY_API_KEY=your-dify-api-key-here
   ```
4. Rebuild và deploy:
   ```bash
   npm run build
   npx vercel --prod
   ```

## 7. Cập nhật Data mới

Khi có data mới:

1. Thay file `app/data/listings_vn_postmerge.json`
2. Redeploy: `npx vercel --prod`
3. Chatbot tự động dùng data mới

## Thay thế: Embed trực tiếp (không cần code)

Nếu muốn đơn giản hơn, dùng iframe:

```tsx
// Trong app/page.tsx
<iframe
  src="https://udify.app/chatbot/YOUR_CHATBOT_ID"
  style={{
    position: "fixed",
    bottom: "20px",
    right: "20px",
    width: "400px",
    height: "600px",
    border: "none",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    zIndex: 9999,
  }}
/>
```

## URLs quan trọng

- Dify Dashboard: https://cloud.dify.ai/
- API Listings: https://grp3mbtt.vercel.app/api/dify/listings
- API Stats: https://grp3mbtt.vercel.app/api/dify/stats
