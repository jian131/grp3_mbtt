/**
 * District data for 3 Cities Dataset
 * Extracted from vn_rental_3cities.json
 */

export const DISTRICTS_BY_PROVINCE: Record<string, string[]> = {
  "Thành phố Hồ Chí Minh": [
    "Quận 1",
    "Quận 3",
    "Quận 4",
    "Quận 5",
    "Quận 7",
    "Quận 10",
    "Quận 11",
    "Quận Bình Thạnh",
    "Quận Gò Vấp",
    "Quận Phú Nhuận",
    "Quận Tân Bình",
    "Thành phố Thủ Đức"
  ],
  "Thành phố Hà Nội": [
    "Quận Ba Đình",
    "Quận Bắc Từ Liêm",
    "Quận Cầu Giấy",
    "Quận Hai Bà Trưng",
    "Quận Hoàn Kiếm",
    "Quận Hoàng Mai",
    "Quận Hà Đông",
    "Quận Long Biên",
    "Quận Nam Từ Liêm",
    "Quận Thanh Xuân",
    "Quận Tây Hồ",
    "Quận Đống Đa"
  ],
  "Thành phố Đà Nẵng": [
    "Quận Cẩm Lệ",
    "Quận Hải Châu",
    "Quận Liên Chiểu",
    "Quận Ngũ Hành Sơn",
    "Quận Sơn Trà",
    "Quận Thanh Khê"
  ]
};

export const PROVINCES = Object.keys(DISTRICTS_BY_PROVINCE);

// Short names for display
export const PROVINCE_SHORT_NAMES: Record<string, string> = {
  "Thành phố Hồ Chí Minh": "TP.HCM",
  "Thành phố Hà Nội": "Hà Nội",
  "Thành phố Đà Nẵng": "Đà Nẵng"
};

export function getDistrictsByProvince(province: string): string[] {
  return DISTRICTS_BY_PROVINCE[province] || [];
}

export function getProvinceShortName(province: string): string {
  return PROVINCE_SHORT_NAMES[province] || province;
}
