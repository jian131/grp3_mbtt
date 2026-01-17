# JFinder Post-Merge Test Checklist

**Date:** 2026-01-17  
**Dataset:** `listings_vn_postmerge.csv` (1,170 listings)  
**Admin Catalog:** `admin_catalog_vn_postmerge.json` (3 provinces, 30 districts, 329 wards)

## Pre-Test Verification

- [x] Dataset copied: `app/data/listings_vn_postmerge.csv`
- [x] JSON generated: `app/data/listings_vn_postmerge.json`
- [x] Admin catalog: `app/data/admin_catalog_vn_postmerge.json`
- [x] FE imports updated (5 API routes)
- [x] n8n workflow updated
- [x] SQLite for Superset updated
- [x] Build passes: `npm run build`

---

## Test Cases

### TC01: Filter by Province → Map Auto-Fit

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to `/search` | Page loads with listings |
| 2 | Select Province = "Hồ Chí Minh" | Map zooms to HCM area (lat ~10.7-10.9) |
| 3 | Verify listings | Only HCM listings shown (520 total) |

**Status:** [ ] Pass / [ ] Fail

---

### TC02: Filter by District → Map Auto-Fit

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select Province = "Hà Nội" | Map zooms to Hanoi |
| 2 | Select District = "Hoàn Kiếm" | Map zooms to Hoàn Kiếm area |
| 3 | Verify listings | Only Hoàn Kiếm listings shown |

**Status:** [ ] Pass / [ ] Fail

---

### TC03: Click Listing → FlyTo Correct Location

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click on any listing card | Map flies to exact lat/lon of listing |
| 2 | Check marker position | Marker is at correct location |
| 3 | Verify coordinates | lat/lon match listing data |

**Status:** [ ] Pass / [ ] Fail

---

### TC04: Heatmap Points in Correct Area

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enable heatmap view | Heatmap displays |
| 2 | Filter by "Đà Nẵng" | Heatmap points cluster in DN area (lat ~16.0) |
| 3 | No stray points | No points outside Đà Nẵng |

**Status:** [ ] Pass / [ ] Fail

---

### TC05: ROI Calculator

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to listing detail | Detail page loads |
| 2 | Enter ROI parameters | Calculator accepts input |
| 3 | Calculate ROI | Returns valid ROI percentage |

**Status:** [ ] Pass / [ ] Fail

---

### TC06: Valuation API

```bash
curl -X POST http://localhost:3000/api/ai/valuation \
  -H "Content-Type: application/json" \
  -d '{"district":"Quận 1","type":"streetfront","segment":"street_retail","area":50}'
```

**Status:** [ ] Pass / [ ] Fail

---

### TC07: Decision Support API

```bash
curl -X POST http://localhost:3000/api/ai/decision \
  -H "Content-Type: application/json" \
  -d '{"listing_id":"VN26000001","user_intent":"mở quán cafe"}'
```

**Status:** [ ] Pass / [ ] Fail

---

### TC08: Legal Review Endpoint

**Status:** [ ] Pass / [ ] Fail

---

### TC09: Superset Dashboard Embed

**Superset URL:** http://localhost:8088

**Status:** [ ] Pass / [ ] Fail

---

### TC10: n8n Webhook Endpoints

**n8n URL:** http://localhost:5678

**Status:** [ ] Pass / [ ] Fail

---

## Summary

| Test | Description | Status |
|------|-------------|--------|
| TC01 | Filter Province | ⬜ |
| TC02 | Filter District | ⬜ |
| TC03 | Click → FlyTo | ⬜ |
| TC04 | Heatmap | ⬜ |
| TC05 | ROI Calculator | ⬜ |
| TC06 | Valuation API | ⬜ |
| TC07 | Decision API | ⬜ |
| TC08 | Legal Review | ⬜ |
| TC09 | Superset | ⬜ |
| TC10 | n8n Webhooks | ⬜ |

**Pass Rate:** ___ / 10
