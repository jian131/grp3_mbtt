# Test Checklist - JFinder System Fixes

**Version:** 2026-01-16
**Tester:** ******\_\_\_******
**Environment:** ☐ Local ☐ Vercel Production

---

## A. GEO DATA & MAP (Định vị)

### A1. Hoàn Kiếm Search Test

| Step | Action                             | Expected Result                                        | Pass |
| ---- | ---------------------------------- | ------------------------------------------------------ | ---- |
| 1    | Mở http://localhost:3000/search    | Page load không lỗi                                    | ☐    |
| 2    | Chọn Province = "Thành phố Hà Nội" | Dropdown cập nhật districts                            | ☐    |
| 3    | Chọn District = "Quận Hoàn Kiếm"   | Filter áp dụng                                         | ☐    |
| 4    | Bấm "Tìm kiếm"                     | Results hiển thị                                       | ☐    |
| 5    | Quan sát Map                       | **Map zoom đến khu vực Hoàn Kiếm (trung tâm HN)**      | ☐    |
| 6    | Check markers                      | **Markers nằm trong khu Hoàn Kiếm, không ở Long Biên** | ☐    |

### A2. Quận 1 (HCM) Test

| Step | Action                                  | Expected Result                  | Pass |
| ---- | --------------------------------------- | -------------------------------- | ---- |
| 1    | Chọn Province = "Thành phố Hồ Chí Minh" | Districts load                   | ☐    |
| 2    | Chọn District = "Quận 1"                | Filter áp dụng                   | ☐    |
| 3    | Bấm "Tìm kiếm"                          | Results hiển thị                 | ☐    |
| 4    | Check Map bounds                        | Map zoom vào Q1 (gần Bến Thành)  | ☐    |
| 5    | Check markers                           | Markers ở Q1, không ở Thủ Đức/Q7 | ☐    |

### A3. Script Verification (Developer)

```bash
cd grp3_mbtt
python scripts/check_hoan_kiem.py
```

**Expected:** `In bounds: 18/20` hoặc cao hơn (90%+)

☐ Pass | ☐ Fail

---

## B. CONTRACT REVIEW (AI Legal Guard)

### B1. Access Page

| Step | Action                                     | Expected Result    | Pass |
| ---- | ------------------------------------------ | ------------------ | ---- |
| 1    | Mở http://localhost:3000/analysis/contract | Page load với form | ☐    |
| 2    | Có 2 tab: Paste / Upload                   | Tabs hoạt động     | ☐    |

### B2. High Risk Sample Test

| Step | Action             | Expected Result                                                        | Pass |
| ---- | ------------------ | ---------------------------------------------------------------------- | ---- |
| 1    | Bấm "📋 Dùng mẫu"  | Text sample được paste                                                 | ☐    |
| 2    | Bấm "Rà soát ngay" | Loading spinner                                                        | ☐    |
| 3    | Đợi kết quả        | Hiển thị Risk Score                                                    | ☐    |
| 4    | Check Score        | **Score >= 60 (HIGH risk)**                                            | ☐    |
| 5    | Check Risk Items   | Có ít nhất 3 items severity=high                                       | ☐    |
| 6    | Check Items        | - Tăng giá đột ngột ✓<br>- Đơn phương chấm dứt ✓<br>- Không hoàn cọc ✓ | ☐    |

### B3. Safe Contract Test

| Step | Action                                                              | Expected Result              | Pass |
| ---- | ------------------------------------------------------------------- | ---------------------------- | ---- |
| 1    | Xóa text, paste nội dung từ `data/contract_samples/safe_sample.txt` | Text loaded                  | ☐    |
| 2    | Bấm "Rà soát ngay"                                                  | Loading                      | ☐    |
| 3    | Check Score                                                         | **Score <= 20 (LOW risk)**   | ☐    |
| 4    | Check summary                                                       | "Hợp đồng tương đối an toàn" | ☐    |

### B4. Download Report

| Step | Action                             | Expected Result             | Pass |
| ---- | ---------------------------------- | --------------------------- | ---- |
| 1    | Sau khi có kết quả, bấm "Tải JSON" | File downloaded             | ☐    |
| 2    | Open file                          | Valid JSON với risk_items[] | ☐    |

---

## C. BI DASHBOARD (Superset)

### C1. Page Access

| Step | Action                                | Expected Result                            | Pass |
| ---- | ------------------------------------- | ------------------------------------------ | ---- |
| 1    | Mở http://localhost:3000/bi-dashboard | Page load không blank                      | ☐    |
| 2    | Check mode                            | "Link Mode" selected (default)             | ☐    |
| 3    | Button visible                        | "Mở Superset" và "Mở Dashboard BI" buttons | ☐    |

### C2. Link Mode Test

| Step | Action                | Expected Result                        | Pass |
| ---- | --------------------- | -------------------------------------- | ---- |
| 1    | Bấm "Mở Superset"     | Opens http://localhost:8088 in new tab | ☐    |
| 2    | Login với admin/admin | Login thành công                       | ☐    |
| 3    | Navigate dashboards   | Có thể xem dashboards                  | ☐    |

### C3. Iframe Mode Test (Optional)

| Step | Action                   | Expected Result                           | Pass |
| ---- | ------------------------ | ----------------------------------------- | ---- |
| 1    | Toggle sang "Embed Mode" | Mode switched                             | ☐    |
| 2    | Wait 5s                  | Fallback message nếu không load được      | ☐    |
| 3    | Fallback                 | "Không thể embed" status + button mở link | ☐    |

---

## D. BACKEND SERVICES

### D1. Docker Status

```bash
docker ps | grep grp3_mbtt
```

| Service  | Port | Expected Status | Pass |
| -------- | ---- | --------------- | ---- |
| n8n      | 5678 | Up (healthy)    | ☐    |
| postgres | 5433 | Up (healthy)    | ☐    |
| superset | 8088 | Up (healthy)    | ☐    |
| redis    | -    | Up              | ☐    |

### D2. API Endpoints

| Endpoint         | Method | Test Command                                          | Pass |
| ---------------- | ------ | ----------------------------------------------------- | ---- |
| /listings        | GET    | `curl http://localhost:5678/webhook/jfinder/listings` | ☐    |
| /stats           | GET    | `curl http://localhost:5678/webhook/jfinder/stats`    | ☐    |
| /contract/review | POST   | See B2 above                                          | ☐    |

---

## E. BUILD TEST

```bash
cd grp3_mbtt
npm run build
```

☐ Build thành công (Exit code 0)
☐ Không có TypeScript errors
☐ Không có ESLint errors blocking

---

## Summary

| Category        | Tests Passed | Total | Status |
| --------------- | ------------ | ----- | ------ |
| A. Geo/Map      | \_\_\_/11    | 11    | ☐      |
| B. Contract     | \_\_\_/12    | 12    | ☐      |
| C. BI Dashboard | \_\_\_/9     | 9     | ☐      |
| D. Backend      | \_\_\_/8     | 8     | ☐      |
| E. Build        | \_\_\_/3     | 3     | ☐      |
| **TOTAL**       | \_\_\_/43    | 43    | ☐      |

**Tested By:** ******\_\_\_****** **Date:** ******\_\_\_******
