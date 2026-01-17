# Gemini API Setup Guide

## 1. Lấy Gemini API Key (FREE)

### Bước 1: Truy cập Google AI Studio

1. Vào: https://aistudio.google.com/
2. Đăng nhập bằng tài khoản Google
3. Click **"Get API Key"** ở sidebar

### Bước 2: Tạo API Key

1. Click **"Create API Key"**
2. Chọn Google Cloud project (hoặc tạo mới)
3. Copy API key (format: `AIzaSy...`)

**Lưu ý:** Gemini API có free tier rất hào phóng:

- 15 requests/minute
- 1 million tokens/minute
- 1,500 requests/day
- **Miễn phí hoàn toàn!**

---

## 2. Setup n8n Credentials

### Bước 1: Tạo Credential

1. Mở n8n: http://localhost:5678
2. Vào **Settings → Credentials**
3. Click **Add Credential**
4. Chọn **Header Auth**

### Bước 2: Cấu hình

```
Name: Gemini API Key
Header Name: x-goog-api-key
Value: AIzaSy... (API key của bạn)
```

**Note:** Gemini dùng API key trong URL query param, không phải header. n8n workflow đã config sẵn.

---

## 3. Import Workflows

### Import 3 workflows này vào n8n:

1. **Contract Review AI**: `n8n/contract_review_ai.json`
   - Endpoint: `POST /webhook/jfinder/contract/review`

2. **Decision Support AI**: `n8n/decision_support_ai.json`
   - Endpoint: `POST /webhook/jfinder/ai/decision`

3. **Valuation AI Enhanced**: `n8n/valuation_ai_enhanced.json`
   - Endpoint: `POST /webhook/jfinder/ai/valuation`

### Cách import:

1. Workflows → Import from File
2. Chọn file JSON
3. Click vào node HTTP Request
4. Gán credential "Gemini API Key"
5. **Activate workflow** (toggle ON)

---

## 4. Test Endpoints

### Contract Review

```bash
curl -X POST http://localhost:5678/webhook/jfinder/contract/review \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hợp đồng thuê mặt bằng... Bên A có quyền đơn phương chấm dứt...",
    "filename": "test.txt"
  }'
```

### Decision Support

```bash
curl -X POST http://localhost:5678/webhook/jfinder/ai/decision \
  -H "Content-Type: application/json" \
  -d '{
    "listing_id": "HN_0001",
    "user_intent": "Kinh doanh F&B",
    "budget": 50,
    "expected_revenue": 150
  }'
```

### Valuation

```bash
curl -X POST http://localhost:5678/webhook/jfinder/ai/valuation \
  -H "Content-Type: application/json" \
  -d '{
    "district": "Quận 1",
    "province": "Hồ Chí Minh",
    "type": "streetfront",
    "segment": "street_retail",
    "area": 50,
    "frontage": 5,
    "floors": 2
  }'
```

---

## 5. Expose với ngrok (Production)

```bash
ngrok http 5678
```

Copy ngrok URL (e.g., `https://abc123.ngrok-free.app`)

Update Vercel env:

```
NEXT_PUBLIC_API_URL=https://abc123.ngrok-free.app/webhook
```

Redeploy:

```bash
vercel --prod
```

---

## Troubleshooting

### Lỗi: "API key not valid"

- Kiểm tra format: `AIzaSy...`
- Key phải được enable tại Google Cloud Console
- Chờ 1-2 phút sau khi tạo key mới

### Lỗi: "Resource exhausted"

- Đã vượt free quota (15 req/min)
- Đợi 1 phút rồi thử lại

### Response JSON không parse được

- Check n8n execution log
- Gemini đôi khi trả text thay vì JSON
- Workflow có fallback logic

---

## So sánh Gemini vs OpenAI

| Feature         | Gemini 1.5 Flash | GPT-4o-mini      |
| --------------- | ---------------- | ---------------- |
| **Free Tier**   | ✅ 1500 req/day  | ❌ Cần billing   |
| **Speed**       | ~1-2s            | ~2-3s            |
| **Vietnamese**  | ✅ Tốt           | ✅ Tốt           |
| **JSON Mode**   | ✅ Native        | ✅ Native        |
| **Cost (paid)** | $0.075/1M tokens | $0.150/1M tokens |

**Khuyến nghị:** Dùng Gemini cho development và production nhỏ. Free tier đủ dùng!
