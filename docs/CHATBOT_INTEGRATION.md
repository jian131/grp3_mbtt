# Dify Chatbot Integration

## Overview

Chatbot tích hợp với Dify AI, **CHỈ trả lời dựa trên file JSON listings nội bộ**.

**Nguồn dữ liệu duy nhất:** `app/data/listings_vn_postmerge.json`

## Architecture

```
User Question
     ↓
ChatWidget (UI) → POST /api/chat
     ↓
chatContext.ts (extract filters, build context from JSON)
     ↓
Dify API (với system prompt khóa chặt: "only use context")
     ↓
Response + Listings
```

## Files Added/Modified

### 1. Core Libraries

- **`lib/listingsStore.ts`** - Data Access Layer (chỉ đọc JSON, cache in-memory)
  - `searchListings(filters, limit)` - Tìm kiếm với filters
  - `statsBy(field, filters)` - Thống kê (min/max/avg)
  - `getTopListings(sortBy, order, limit)` - Top listings
  - `getTotalCount()` - Validation

- **`lib/chatContext.ts`** - RAG Builder (chỉ dựa vào JSON)
  - `extractFilters(question)` - Parse tiếng Việt
  - `buildChatContext(question)` - Tạo context cho Dify

### 2. API Route

- **`app/api/chat/route.ts`** - Dify integration endpoint
  - POST `/api/chat` - Nhận message, trả answer + listings
  - GET `/api/chat` - Health check
  - System prompt: **"CHỈ dùng context, không suy đoán"**

### 3. UI Components

- **`components/ChatWidget.tsx`** - Chat interface
  - Message list với listings preview
  - Quick prompts
  - Conversation history

- **`components/ChatButton.tsx`** - Floating button

- **`app/layout.tsx`** - Thêm `<ChatButton />` global

### 4. Configuration

- **`.env.example`** - Thêm Dify credentials

## Environment Variables

Thêm vào `.env.local`:

```bash
# Dify AI Chat
DIFY_API_KEY=app-xxxxxxxxx
DIFY_BASE_URL=https://api.dify.ai/v1
DIFY_APP_ID=your-app-id  # Optional
```

**Lấy credentials:**

1. Đăng ký tại: https://cloud.dify.ai
2. Tạo app mới (type: Chat App)
3. Copy API key từ settings

## Running Locally

```bash
# 1. Install dependencies (nếu chưa)
npm install

# 2. Set environment variables
cp .env.example .env.local
# Sau đó edit .env.local và thêm DIFY_API_KEY

# 3. Start dev server
npm run dev

# 4. Test chat
# - Click nút chat ở góc phải dưới
# - Hoặc vào: http://localhost:3000 và click icon MessageSquare
```

## Usage Examples

### Example 1: Filter by location + price

**User:** "Mặt bằng ở Quận Ba Đình, giá dưới 30tr"

**Expected Response:**

```
Có 12 mặt bằng phù hợp ở Quận Ba Đình với giá < 30tr:

1. VN26000660 - Mặt bằng kinh doanh phố Nguyễn Công Trứ
   📍 Phường Nguyễn Trung Trực, Quận Ba Đình, Hà Nội
   💰 25tr/tháng • 45m² • Điểm tiềm năng: 78/100
   📌 Tọa độ: 21.0328, 105.8195

2. VN26000656 - Shop mặt phố Phan Đình Phùng
   📍 Phường Quán Thánh, Quận Ba Đình, Hà Nội
   💰 28tr/tháng • 50m² • Điểm tiềm năng: 82/100
   ...
```

### Example 2: Top by potential score

**User:** "Top 5 tiềm năng cao nhất ở Hà Nội"

**Expected Response:**

```
Top 5 mặt bằng tiềm năng cao nhất tại Hà Nội:

1. VN26000891 - Điểm: 95/100
   📍 Quận Hoàn Kiếm • 60m² • 45tr/tháng

2. VN26000723 - Điểm: 92/100
   📍 Quận Ba Đình • 55m² • 38tr/tháng
...
```

### Example 3: Stats comparison

**User:** "So sánh giá/m2 giữa Quận 1 và Phú Nhuận"

**Expected Response:**

```
Thống kê giá/m² (triệu VNĐ/m²):

Quận 1 (52 mẫu):
- Min: 0.4 tr/m² | Max: 2.1 tr/m² | Avg: 0.87 tr/m²

Phú Nhuận (38 mẫu):
- Min: 0.35 tr/m² | Max: 1.2 tr/m² | Avg: 0.62 tr/m²

→ Quận 1 cao hơn trung bình 40%
```

## Validation (Data Source Enforcement)

### Runtime Guards

- `listingsStore.ts` CHỈ load từ `app/data/listings_vn_postmerge.json`
- Nếu file không tồn tại → throw error rõ ràng
- Không có code query DB/HTTP nào trong luồng chat

### Testing

```bash
# Run unit test (TODO: add tests)
npm test

# Verify data source
grep -r "fetch\|axios\|http" lib/listingsStore.ts  # Should be empty
grep -r "SELECT\|INSERT" lib/chatContext.ts        # Should be empty
```

### CI Check (TODO)

Thêm vào `.github/workflows/ci.yml`:

```yaml
- name: Validate Chat Data Source
  run: |
    if grep -r "fetch.*listing" lib/chat*.ts; then
      echo "ERROR: Chat libs must not fetch from external sources"
      exit 1
    fi
```

## Guardrails

### System Prompt (in API route)

```
Bạn là trợ lý tìm kiếm mặt bằng.

QUY TẮC NGHIÊM NGẶT:
1. CHỈ trả lời dựa trên CONTEXT
2. KHÔNG suy đoán ngoài context
3. Nếu không có → nói "Không có dữ liệu"
4. Mỗi câu PHẢI kèm ID listing
5. Trả lời tiếng Việt
```

### Context Format

```
=== DỮ LIỆU NỘI BỘ ===
Tìm được 12 mặt bằng:

1. {"id":"VN26000660","name":"...","district":"Ba Đình",...}
2. {"id":"VN26000656","name":"...","district":"Ba Đình",...}
...

CHỈ trả lời dựa trên dữ liệu trên.
```

## Troubleshooting

### Error: "Dify API key not configured"

→ Chưa set `DIFY_API_KEY` trong `.env.local`

### Error: "Listings file not found"

→ File `app/data/listings_vn_postmerge.json` bị xóa hoặc path sai

### Chat returns "Không có dữ liệu" cho mọi câu hỏi

→ Kiểm tra:

1. File JSON có data không? `npm run validate:data`
2. Dify app có được train chưa?
3. Check logs: `console.log` trong `/api/chat`

### Dify trả lời sai (ngoài context)

→ Tăng độ strict của system prompt:

- Thêm "TUYỆT ĐỐI không suy đoán"
- Hoặc dùng Dify's "Knowledge Base" mode thay vì "Chat" mode

## Next Steps

1. **Unit Tests:** Thêm tests cho `listingsStore.ts`, `chatContext.ts`
2. **E2E Tests:** Mock Dify API, test full flow
3. **Analytics:** Log user questions để improve filters
4. **Multilingual:** Support English queries
5. **Voice:** Tích hợp speech-to-text

## Notes

- Chatbot **KHÔNG** cần database, **KHÔNG** cần n8n backend
- Tất cả dữ liệu đều từ file JSON nội bộ (1170 listings)
- Dify chỉ dùng để generate natural language response, không lưu data
