# Admin Validation Report

**Generated:** 2026-01-17T14:51:47.783Z
**Dataset:** `app/data/listings_vn_postmerge.json`
**Total Records:** 1170

## Summary

| Metric | Count | Status |
|--------|-------|--------|
| Total Records | 1170 | - |
| Valid Records | 1170 | ✅ |
| Records with Errors | 0 | ✅ |
| Records with Warnings | 1170 | ⚠️ |

## Province Validation

| Province | Total | Errors | Warnings |
|----------|-------|--------|----------|
| Hồ Chí Minh | 520 | 0 | 520 |
| Hà Nội | 480 | 0 | 480 |
| Đà Nẵng | 170 | 0 | 170 |

## Coordinate Validation

| Metric | Count |
|--------|-------|
| Valid Coords | 1170 |
| Invalid Coords | 0 |
| Swapped & Fixed | 0 |
| Outside City Bounds | 0 |

## Duplicate Coordinates

| Metric | Count |
|--------|-------|
| Duplicate Groups | 0 |
| Affected Records | 0 |



## District/Ward Validation

| Level | Valid | Not in Canonical List |
|-------|-------|----------------------|
| District | 1170 | 0 |
| Ward | 1076 | 94 |



## Validation Result

✅ **PASSED** - No critical errors found

---
*Run with: `npm run validate:data`*
