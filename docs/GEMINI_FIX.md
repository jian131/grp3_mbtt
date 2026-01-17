# ⚠️ QUAN TRỌNG: Gemini API Configuration

## Vấn đề hiện tại

Workflows đang dùng credential placeholder `{{ $credentials.gemini_api_key }}` trong URL, nhưng **n8n không hỗ trợ trực tiếp credentials trong URL parameters**.

## ✅ Giải pháp: Dùng HTTP Request với Query Parameters

### Bước 1: Tạo credential Generic Credential Type

1. **Settings → Credentials → Add Credential**
2. Chọn: **Generic Credential Type**
3. Cấu hình:
   ```
   Credential Name: Gemini API Key
   Credential Type: Header Auth
   ```

   - **Header Name**: `x-api-key` (placeholder, không dùng)
   - **Value**: `YOUR_GEMINI_API_KEY` (AIzaSy...)

### Bước 2: Update workflow trong n8n UI

**Đối với mỗi workflow (Contract/Decision/Valuation):**

1. Mở workflow trong n8n
2. Click vào HTTP Request node (Gemini Analysis/Decision/Insight)
3. **Thay đổi URL từ:**

   ```
   https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={{ $credentials.gemini_api_key }}
   ```

   **Thành:**

   ```
   https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
   ```

4. **Thêm Query Parameters:**
   - Authentication: None (remove credential)
   - Scroll xuống **Query Parameters**
   - Click **Add Parameter**
     - **Name**: `key`
     - **Value**: `YOUR_GEMINI_API_KEY` (paste trực tiếp)

5. **Save và Test**

---

## 🚀 Cách nhanh: Dùng environment variable

### Option 1: Hardcode API key (đơn giản nhất)

Trong n8n HTTP Request node:

- **URL**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
- **Query Parameters**:
  - Name: `key`
  - Value: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXX` (paste API key trực tiếp)

### Option 2: Dùng n8n expression với environment

1. Set env trong docker-compose:

   ```yaml
   n8n:
     environment:
       - GEMINI_API_KEY=AIzaSy...
   ```

2. Restart n8n:

   ```bash
   docker-compose restart n8n
   ```

3. Trong HTTP Request node, Query Parameters:
   - Name: `key`
   - Value: `{{ $env.GEMINI_API_KEY }}`

---

## 📝 Test sau khi fix

```powershell
# Test Decision Support
$body = @{
    listing_id = "HN_0001"
    user_intent = "Kinh doanh F&B"
    budget = 50
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5678/webhook/jfinder/ai/decision" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body `
    -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json
```

Nếu thành công, `ai_powered` sẽ là `true` và `model` sẽ là `gemini-1.5-flash`.

---

## 🔑 Lấy Gemini API Key

1. Truy cập: https://aistudio.google.com/app/apikey
2. Click **"Create API Key"**
3. Chọn project hoặc tạo mới
4. Copy key (format: `AIzaSy...`)

**Free tier:**

- 15 requests/minute
- 1,500 requests/day
- MIỄN PHÍ hoàn toàn!
