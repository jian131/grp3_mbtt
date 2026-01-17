# AI Legal Guard - Contract Review MVP

## Overview

AI Legal Guard là tính năng rà soát hợp đồng thuê mặt bằng, phát hiện các điều khoản rủi ro bằng phương pháp rule-based.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   FE Page   │────▶│ n8n Webhook │────▶│  Rule-based │
│  /analysis/ │     │  /contract/ │     │   Analyzer  │
│  contract   │◀────│   review    │◀────│             │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Endpoints

### POST `/webhook/jfinder/contract/review`

**Request:**

```json
{
  "content": "Nội dung hợp đồng...",
  "filename": "hopdong.txt"
}
```

**Response:**

```json
{
  "success": true,
  "risk_score": 75,
  "risk_level": "high",
  "risk_items": [
    {
      "title": "Tăng giá đột ngột",
      "severity": "high",
      "matched_clause": "...tăng giá thuê 50% sau mỗi 6 tháng...",
      "recommendation": "Yêu cầu giới hạn tăng giá tối đa 10-15%/năm",
      "clause_type": "price_increase"
    }
  ],
  "summary": "Phát hiện 3 điều khoản rủi ro cao. Cần đàm phán lại trước khi ký.",
  "total_clauses_checked": 9,
  "processing_time_ms": 45
}
```

## Risk Rules

| Rule ID                  | Title                     | Severity | Keywords                           |
| ------------------------ | ------------------------- | -------- | ---------------------------------- |
| `price_increase`         | Tăng giá đột ngột         | HIGH     | tăng 50%, tăng gấp đôi             |
| `unilateral_termination` | Đơn phương chấm dứt       | HIGH     | đơn phương chấm dứt bất cứ lúc nào |
| `no_deposit_refund`      | Không hoàn cọc            | HIGH     | không hoàn cọc, mất tiền cọc       |
| `excessive_penalty`      | Phạt quá mức              | HIGH     | bồi thường 12 tháng                |
| `force_majeure_unfair`   | Bất khả kháng bất lợi     | MEDIUM   | vẫn phải thanh toán                |
| `no_complaint`           | Từ bỏ quyền khiếu nại     | MEDIUM   | không được khiếu nại               |
| `high_deposit`           | Tiền cọc cao              | MEDIUM   | cọc 6 tháng                        |
| `tenant_all_cost`        | Bên thuê chịu mọi chi phí | LOW      | tự chịu mọi chi phí                |
| `unclear_duration`       | Thời hạn mơ hồ            | LOW      | thời hạn không xác định            |

## Risk Score Calculation

- HIGH severity = +25 points
- MEDIUM severity = +15 points
- LOW severity = +8 points
- Maximum score: 100

**Risk Level:**

- 0-29: LOW (✅ An toàn)
- 30-59: MEDIUM (⚡ Cần lưu ý)
- 60-100: HIGH (⚠️ Rủi ro cao)

## Usage

### FE Route

`/analysis/contract`

### Test Samples

- `data/contract_samples/high_risk_sample.txt` - Mẫu rủi ro cao (expected score: 75+)
- `data/contract_samples/medium_risk_sample.txt` - Mẫu rủi ro trung bình (expected: 30-50)
- `data/contract_samples/safe_sample.txt` - Mẫu an toàn (expected: 0-20)

## Limitations

1. **Text only**: Hiện chỉ hỗ trợ .txt và paste text. PDF/DOCX cần OCR/parsing riêng.
2. **Rule-based**: Không phải ML/LLM, chỉ dựa vào keywords và regex patterns.
3. **Vietnamese only**: Chỉ hỗ trợ tiếng Việt.

## Future Improvements

1. Integrate PDF parsing (pdf-parse)
2. DOCX parsing (mammoth)
3. LLM-based analysis for more complex clauses
4. Multi-language support
