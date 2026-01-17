# Valuation Fix Summary

**Date:** 2026-01-16
**Issue:** AI định giá 74 triệu cho thuê 25 triệu

---

## Root Causes Identified

### 1. **FE hardcode `type: 'shophouse'`** (đã fix)

- **Old code:** `type: 'shophouse'` trong `handleAnalysis()`
- **Issue:** Luôn so sánh với shophouse (giá cao)
- **Fix:** Dùng `valForm.type` từ dropdown

### 2. **Thiếu dropdown chọn loại hình BĐS** (đã fix)

- **Old:** Không có UI chọn type
- **Fix:** Thêm dropdown với 5 options:
  - Mặt tiền đường (Streetfront)
  - Shophouse
  - Văn phòng (Office) ← **Default**
  - Ki-ốt
  - Nhà phố

### 3. **Data Tây Hồ phân bổ theo type**

| Loại hình       | Count | Median rent/m² | 50m² price      |
| --------------- | ----- | -------------- | --------------- |
| **Shophouse**   | 8     | 1.5 tr/m²      | **74 triệu**    |
| **Office**      | 9     | 0.51 tr/m²     | **25 triệu** ✅ |
| **Streetfront** | 21    | 1.3 tr/m²      | 65 triệu        |
| **Kiosk**       | 5     | 1.4 tr/m²      | 70 triệu        |

---

## API Test Results

### ✅ Office (Fixed - Correct)

```bash
POST /webhook/valuation
{
  "district": "Quận Tây Hồ",
  "area": 50,
  "type": "office",
  "frontage": 5,
  "floors": 1
}

Response:
{
  "market_stats": {
    "sample_size": 9,
    "median_per_sqm": 0.505
  },
  "valuation": {
    "suggested_price_million": 25.3  ✅
  }
}
```

### ❌ Shophouse (Old behavior)

```bash
POST /webhook/valuation
{
  "district": "Quận Tây Hồ",
  "area": 50,
  "type": "shophouse",
  "frontage": 5,
  "floors": 1
}

Response:
{
  "market_stats": {
    "sample_size": 8,
    "median_per_sqm": 1.51
  },
  "valuation": {
    "suggested_price_million": 75.5  ❌ (đúng với shophouse)
  }
}
```

---

## Changes Made

### File: `app/analysis/page.tsx`

**1. Added property type options:**

```typescript
const PROPERTY_TYPES = [
  { label: "Mặt tiền đường (Streetfront)", value: "streetfront" },
  { label: "Shophouse", value: "shophouse" },
  { label: "Văn phòng (Office)", value: "office" },
  { label: "Ki-ốt", value: "kiosk" },
  { label: "Nhà phố", value: "townhouse" },
];
```

**2. Changed default type:**

```typescript
const [valForm, setValForm] = useState({
  province: "",
  district: "",
  area: "",
  price: "",
  type: "office", // Changed from 'F&B / Cà phê'
});
```

**3. Use form type in API call:**

```typescript
const valData = await getValuation({
  district: valForm.district || "Quận 1",
  area: Number(valForm.area) || 50,
  frontage: 5,
  floors: 1,
  type: valForm.type || "office", // Use selected type
});
```

**4. Added UI dropdown:**

```tsx
<select
  value={valForm.type}
  onChange={(e) => setValForm({ ...valForm, type: e.target.value })}
  className="..."
>
  {PROPERTY_TYPES.map((t) => (
    <option key={t.value} value={t.value}>
      {t.label}
    </option>
  ))}
</select>
```

---

## User Instructions

1. **Refresh trang** (hard refresh: Ctrl+Shift+R)
2. **Chọn thành phố:** Hà Nội
3. **Chọn quận:** Quận Tây Hồ
4. **Chọn loại hình:** Văn phòng (Office) ← **QUAN TRỌNG**
5. **Nhập diện tích:** 50 m²
6. **Nhập giá thuê:** 25 triệu
7. **Click "Tạo Báo Cáo Phân Tích"**

**Kết quả mong đợi:**

- Định giá AI: **~25 triệu/tháng** ✅
- Giá thuê 25 triệu: **Fair** hoặc **Cheap** ✅

---

## Data Insights

### Tây Hồ Market Stats (Office)

- **Sample size:** 9 listings
- **P25:** 0.5 tr/m²
- **Median:** 0.51 tr/m²
- **P75:** 0.59 tr/m²
- **Range:** 0.42 - 1.1 tr/m²

### Why Shophouse is 3x more expensive?

1. Shophouse = mặt bằng kinh doanh cao cấp
2. Vị trí mặt tiền, người qua lại đông
3. Phù hợp F&B, retail, showroom
4. Office = văn phòng thông thường, ít traffic

---

## Verification Checklist

- [x] API trả về đúng 25.3 triệu cho office
- [x] Build thành công không lỗi
- [x] Dropdown property type hiển thị đúng
- [x] Default là office (không phải shophouse)
- [x] Data có 9 office Tây Hồ
- [x] n8n workflow active và load data đúng

---

## Notes

- **District name:** Phải gửi đầy đủ "Quận Tây Hồ" (có prefix)
- **n8n cache:** Restart docker nếu data không update
- **Property type matter:** Office ≠ Shophouse ≠ Streetfront
