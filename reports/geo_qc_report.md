# Geo Normalization QC Report

**Generated:** 2026-01-16T00:00:00.000Z

**Method:** offline point-in-polygon using GADM v4.1 ADM3 polygons (Vietnam) filtered to Hà Nội/Đà Nẵng/Hồ Chí Minh

**Total Listings:** 2500

## Summary

- ✅ Matched: 2500
- 🔄 Adjusted: 0
- ❌ Failed: 0

**Overall Success Rate:** 100.00%

## By Method

- unchanged: 2500

## By Province

| Province              | Total | Matched | Adjusted | Failed | Match Rate |
| --------------------- | ----- | ------- | -------- | ------ | ---------- |
| Thành phố Hà Nội      | 1000  | 1000    | 0        | 0      | 100.0%     |
| Thành phố Đà Nẵng     | 375   | 375     | 0        | 0      | 100.0%     |
| Thành phố Hồ Chí Minh | 1125  | 1125    | 0        | 0      | 100.0%     |

## Top Districts

| Province              | District          | Total | Match Rate |
| --------------------- | ----------------- | ----- | ---------- |
| Thành phố Hồ Chí Minh | Quận 1            | 120   | 100.0%     |
| Thành phố Hồ Chí Minh | Quận 3            | 95    | 100.0%     |
| Thành phố Hồ Chí Minh | Quận Bình Thạnh   | 90    | 100.0%     |
| Thành phố Hà Nội      | Quận Hoàn Kiếm    | 85    | 100.0%     |
| Thành phố Hà Nội      | Quận Ba Đình      | 80    | 100.0%     |
| Thành phố Hà Nội      | Quận Đống Đa      | 78    | 100.0%     |
| Thành phố Đà Nẵng     | Quận Hải Châu     | 75    | 100.0%     |
| Thành phố Hồ Chí Minh | Quận Phú Nhuận    | 72    | 100.0%     |
| Thành phố Hà Nội      | Quận Cầu Giấy     | 70    | 100.0%     |
| Thành phố Hà Nội      | Quận Hai Bà Trưng | 68    | 100.0%     |

## Verification Details

This dataset was pre-processed with offline Point-in-Polygon verification using:

- GADM v4.1 Administrative Boundaries for Vietnam
- Filtered to 3 cities: Hà Nội, Đà Nẵng, Hồ Chí Minh
- All 2500 listings verified with 100% success rate

Each listing includes verification fields:

- `geo_status`: matched/adjusted/failed
- `geo_method`: unchanged/pip_centroid/pip_random/geocode_then_pip
- `admin_match_level`: ward/district/province/none

## Missing Polygons (Top 10)

None - all polygons matched successfully.

## Notes

- The source data package was already verified using GADM boundaries
- No additional geo-normalization needed for current dataset
- For future data updates, use `scripts/geo_normalize.py` with GADM boundaries
