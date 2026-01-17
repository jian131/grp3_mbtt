# Hướng dẫn Import AI Workflows vào n8n

## 📋 Tổng quan

Có 3 workflows mới sử dụng **GPT-4o-mini** qua OpenAI API:

| Workflow              | File                         | Endpoint                                | Chức năng                         |
| --------------------- | ---------------------------- | --------------------------------------- | --------------------------------- |
| Contract Review AI    | `contract_review_ai.json`    | `POST /webhook/jfinder/contract/review` | Phân tích rủi ro hợp đồng với LLM |
| Decision Support AI   | `decision_support_ai.json`   | `POST /webhook/jfinder/ai/decision`     | Tư vấn quyết định thuê mặt bằng   |
| Valuation AI Enhanced | `valuation_ai_enhanced.json` | `POST /webhook/jfinder/ai/valuation`    | Định giá + insights từ LLM        |

## 🔑 Bước 1: Tạo OpenAI Credentials trong n8n

1. Truy cập n8n: http://localhost:5678
2. Vào **Settings** → **Credentials**
3. Click **Add Credential** → Tìm **"Header Auth"**
4. Cấu hình:
   - **Name**: `OpenAI API Key`
   - **Name** (header): `Authorization`
   - **Value**: `Bearer sk-YOUR_OPENAI_API_KEY_HERE`
5. Click **Save**

> ⚠️ **Quan trọng**: Thay `sk-YOUR_OPENAI_API_KEY_HERE` bằng API key thật từ https://platform.openai.com/api-keys

## 📥 Bước 2: Import Workflows

### Cách 1: Import qua UI

1. Trong n8n, click **Workflows** → **Import from File**
2. Chọn từng file:
   - `n8n/contract_review_ai.json`
   - `n8n/decision_support_ai.json`
   - `n8n/valuation_ai_enhanced.json`
3. Sau khi import, mỗi workflow cần:
   - Mở workflow
   - Click vào node **OpenAI** (HTTP Request node)
   - Chọn credential **"OpenAI API Key"** đã tạo
   - Click **Save**
   - Bật **Active** toggle (góc trên phải)

### Cách 2: Import qua CLI (nếu dùng Docker)

```bash
# Từ thư mục grp3_mbtt/
docker cp n8n/contract_review_ai.json grp3_mbtt-n8n-1:/tmp/
docker cp n8n/decision_support_ai.json grp3_mbtt-n8n-1:/tmp/
docker cp n8n/valuation_ai_enhanced.json grp3_mbtt-n8n-1:/tmp/
```

Sau đó vẫn cần vào UI để activate và gán credentials.

## ✅ Bước 3: Test Endpoints

### Test Contract Review AI

```bash
curl -X POST http://localhost:5678/webhook/jfinder/contract/review \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Bên A có quyền tăng giá 50% mà không cần thông báo. Bên B mất toàn bộ tiền cọc nếu chấm dứt hợp đồng.",
    "filename": "test.txt"
  }'
```

**Expected Response (với LLM):**

```json
{
  "success": true,
  "risk_score": 75,
  "risk_level": "high",
  "risk_items": [
    {
      "title": "Tăng giá đột ngột",
      "severity": "high",
      "matched_clause": "tăng giá 50% mà không cần thông báo",
      "recommendation": "Yêu cầu giới hạn tăng giá tối đa 10%/năm..."
    }
  ],
  "summary": "Phát hiện 2 điều khoản rủi ro cao...",
  "ai_powered": true,
  "model": "gpt-4o-mini"
}
```

### Test Decision Support AI

```bash
curl -X POST http://localhost:5678/webhook/jfinder/ai/decision \
  -H "Content-Type: application/json" \
  -d '{
    "listing_id": "L001",
    "user_intent": "Mở quán cafe",
    "budget": 50,
    "expected_revenue": 150
  }'
```

### Test Valuation AI Enhanced

```bash
curl -X POST http://localhost:5678/webhook/jfinder/ai/valuation \
  -H "Content-Type: application/json" \
  -d '{
    "district": "Quận 1",
    "province": "Hồ Chí Minh",
    "type": "streetfront",
    "segment": "street_retail",
    "area_m2": 50,
    "frontage_m": 6,
    "floors": 1
  }'
```

## 🔄 Fallback Behavior

Nếu OpenAI API không khả dụng (quota hết, network error, etc.), các workflows sẽ **tự động fallback** về rule-based analysis:

- Contract Review: Dùng keyword matching
- Decision Support: Dùng price comparison + heuristics
- Valuation: Vẫn trả về statistical valuation, chỉ thiếu `ai_insights`

Response sẽ có `"ai_powered": false` và `"fallback_reason": "..."`.

## 📱 Frontend Integration

Frontend gọi qua `NEXT_PUBLIC_API_URL` (hiện tại ngrok URL).

Các endpoints mới:

- Contract Review: Đã có FE (`/analysis/contract`)
- Decision Support: Cần thêm button/page trong listing detail
- Valuation Enhanced: Có thể dùng thay cho `/webhook/valuation` cũ

## 💰 Chi phí ước tính

| Endpoint           | Tokens/call | Cost/call (GPT-4o-mini) |
| ------------------ | ----------- | ----------------------- |
| Contract Review    | ~2000       | ~$0.0012                |
| Decision Support   | ~1500       | ~$0.0009                |
| Valuation Enhanced | ~1000       | ~$0.0006                |

GPT-4o-mini pricing: $0.15/1M input, $0.60/1M output tokens.

## 🚨 Troubleshooting

### "Credential not found"

→ Vào Settings → Credentials → Đảm bảo credential tên chính xác là `OpenAI API Key`

### "401 Unauthorized"

→ API key không đúng hoặc hết hạn. Check https://platform.openai.com/api-keys

### "429 Rate Limit"

→ Đạt giới hạn OpenAI. Đợi 1 phút hoặc upgrade plan.

### Response có `ai_powered: false`

→ LLM call failed, đang dùng fallback. Check n8n execution log.
