#!/usr/bin/env node
/**
 * Admin Validation Script for Vietnam Rental Listings
 *
 * Validates province, district, ward against canonical list
 * Also validates and normalizes coordinates
 *
 * Usage: node scripts/validate_admin_vn_3cities.js
 * Output: reports/admin_validation.json, reports/admin_validation_summary.md
 */

const fs = require('fs');
const path = require('path');

// Config
const DATA_FILE = path.join(__dirname, '..', 'app', 'data', 'listings_vn_postmerge.json');
const ADMIN_FILE = path.join(__dirname, '..', 'data', 'admin_vn_3cities.json');
const OUTPUT_JSON = path.join(__dirname, '..', 'reports', 'admin_validation.json');
const OUTPUT_MD = path.join(__dirname, '..', 'reports', 'admin_validation_summary.md');

// Vietnam coordinate bounds
const VN_BOUNDS = {
  lat: { min: 8.0, max: 24.0 },
  lon: { min: 102.0, max: 110.0 }
};

// City-specific bounds (approximate)
const CITY_BOUNDS = {
  'Hà Nội': { lat: { min: 20.5, max: 21.5 }, lon: { min: 105.3, max: 106.1 } },
  'Hồ Chí Minh': { lat: { min: 10.3, max: 11.2 }, lon: { min: 106.3, max: 107.0 } },
  'Đà Nẵng': { lat: { min: 15.9, max: 16.3 }, lon: { min: 107.8, max: 108.4 } }
};

// Normalize function
function normalize(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim();
}

// Remove duplicate prefix like "Quận Quận" or "Phường Phường"
function removeDuplicatePrefix(str) {
  if (!str) return '';
  return str
    .replace(/^(Quận|Huyện|Thành phố|Thị xã)\s+\1\s+/gi, '$1 ')
    .replace(/^(Phường|Xã|Thị trấn)\s+\1\s+/gi, '$1 ')
    .trim();
}

// Normalize province name to canonical
function normalizeProvince(province, adminData) {
  if (!province) return null;

  const cleaned = removeDuplicatePrefix(province);
  const norm = normalize(cleaned);

  for (const [canonical, data] of Object.entries(adminData.provinces)) {
    if (normalize(canonical) === norm) return canonical;
    if (data.aliases && data.aliases.some(a => normalize(a) === norm)) return canonical;
  }

  // Fuzzy match
  for (const [canonical, data] of Object.entries(adminData.provinces)) {
    if (norm.includes(normalize(canonical)) || normalize(canonical).includes(norm)) return canonical;
  }

  return null;
}

// Find district in province
function findDistrict(district, province, adminData) {
  if (!district || !province) return null;

  const provinceData = adminData.provinces[province];
  if (!provinceData) return null;

  const cleaned = removeDuplicatePrefix(district);
  const norm = normalize(cleaned);

  for (const canonicalDist of Object.keys(provinceData.districts)) {
    if (normalize(canonicalDist) === norm) return canonicalDist;

    // Handle "Quận 1" vs "Quận 01" variations
    const distNum = norm.match(/quan\s*(\d+)/);
    const canonNum = normalize(canonicalDist).match(/quan\s*(\d+)/);
    if (distNum && canonNum && parseInt(distNum[1]) === parseInt(canonNum[1])) {
      return canonicalDist;
    }

    // Partial match
    if (norm.includes(normalize(canonicalDist.replace(/^(Quận|Huyện|Thành phố)\s+/i, '')))) {
      return canonicalDist;
    }
  }

  return null;
}

// Find ward in district
function findWard(ward, district, province, adminData) {
  if (!ward || !district || !province) return null;

  const provinceData = adminData.provinces[province];
  if (!provinceData) return null;

  const wards = provinceData.districts[district];
  if (!wards) return null;

  const cleaned = removeDuplicatePrefix(ward);
  const norm = normalize(cleaned);

  for (const canonicalWard of wards) {
    if (normalize(canonicalWard) === norm) return canonicalWard;

    // Handle numbered wards
    const wardNum = norm.match(/phuong\s*(\d+)/);
    const canonNum = normalize(canonicalWard).match(/phuong\s*(\d+)/);
    if (wardNum && canonNum && parseInt(wardNum[1]) === parseInt(canonNum[1])) {
      return canonicalWard;
    }

    // Partial match
    if (norm.includes(normalize(canonicalWard.replace(/^(Phường|Xã|Thị trấn)\s+/i, '')))) {
      return canonicalWard;
    }
  }

  return null;
}

// Validate coordinates
function validateCoords(lat, lon, province) {
  const errors = [];

  // Parse to float
  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);

  if (isNaN(latNum) || isNaN(lonNum)) {
    errors.push('INVALID_COORDS: lat/lon is NaN');
    return { valid: false, errors, lat: null, lon: null };
  }

  // Check if swapped (lat in lon range, lon in lat range)
  let actualLat = latNum;
  let actualLon = lonNum;
  let swapped = false;

  if (latNum >= VN_BOUNDS.lon.min && latNum <= VN_BOUNDS.lon.max &&
      lonNum >= VN_BOUNDS.lat.min && lonNum <= VN_BOUNDS.lat.max) {
    // Likely swapped
    actualLat = lonNum;
    actualLon = latNum;
    swapped = true;
    errors.push('COORDS_SWAPPED: lat/lon were swapped and corrected');
  }

  // Validate against VN bounds
  if (actualLat < VN_BOUNDS.lat.min || actualLat > VN_BOUNDS.lat.max) {
    errors.push(`LAT_OUT_OF_BOUNDS: ${actualLat} not in [${VN_BOUNDS.lat.min}, ${VN_BOUNDS.lat.max}]`);
  }

  if (actualLon < VN_BOUNDS.lon.min || actualLon > VN_BOUNDS.lon.max) {
    errors.push(`LON_OUT_OF_BOUNDS: ${actualLon} not in [${VN_BOUNDS.lon.min}, ${VN_BOUNDS.lon.max}]`);
  }

  // Validate against city bounds if province known
  if (province && CITY_BOUNDS[province]) {
    const bounds = CITY_BOUNDS[province];
    if (actualLat < bounds.lat.min || actualLat > bounds.lat.max ||
        actualLon < bounds.lon.min || actualLon > bounds.lon.max) {
      errors.push(`COORDS_OUTSIDE_CITY: point may be outside ${province} bounds`);
    }
  }

  return {
    valid: errors.filter(e => !e.startsWith('COORDS_SWAPPED') && !e.startsWith('COORDS_OUTSIDE_CITY')).length === 0,
    errors,
    lat: actualLat,
    lon: actualLon,
    swapped
  };
}

// Check for duplicate coordinates
function findDuplicateCoords(listings) {
  const coordMap = new Map();
  const duplicates = [];

  listings.forEach(l => {
    const key = `${l.latitude.toFixed(6)},${l.longitude.toFixed(6)}`;
    if (coordMap.has(key)) {
      coordMap.get(key).push(l.id);
    } else {
      coordMap.set(key, [l.id]);
    }
  });

  coordMap.forEach((ids, coord) => {
    if (ids.length > 1) {
      duplicates.push({ coord, count: ids.length, ids });
    }
  });

  return duplicates;
}

// Apply jitter to duplicate coordinates
function applyJitter(lat, lon, index, total) {
  // Spread in a circle, 10-30 meters radius
  const radius = 0.0002 + (Math.random() * 0.0001); // ~20-30m
  const angle = (2 * Math.PI * index) / total;

  return {
    lat: lat + radius * Math.cos(angle),
    lon: lon + radius * Math.sin(angle)
  };
}

// Main validation
async function main() {
  console.log('🔍 Admin Validation for VN Rental Listings\n');

  // Load data
  if (!fs.existsSync(DATA_FILE)) {
    console.error(`❌ Data file not found: ${DATA_FILE}`);
    process.exit(1);
  }

  if (!fs.existsSync(ADMIN_FILE)) {
    console.error(`❌ Admin file not found: ${ADMIN_FILE}`);
    process.exit(1);
  }

  const listings = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  const adminData = JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf-8'));

  console.log(`📊 Loaded ${listings.length} listings`);
  console.log(`📍 Canonical provinces: ${Object.keys(adminData.provinces).join(', ')}\n`);

  // Validation results
  const results = {
    total: listings.length,
    valid: 0,
    errors: [],
    warnings: [],
    stats: {
      province: { valid: 0, invalid: 0, normalized: 0 },
      district: { valid: 0, invalid: 0, notInList: 0 },
      ward: { valid: 0, invalid: 0, notInList: 0 },
      coords: { valid: 0, invalid: 0, swapped: 0, outsideCity: 0 },
      duplicateCoords: { count: 0, affected: 0, jittered: 0 }
    },
    byProvince: {},
    invalidRecords: []
  };

  // Process each listing
  listings.forEach(listing => {
    const recordErrors = [];
    const recordWarnings = [];

    // 1. Validate province
    const canonicalProvince = normalizeProvince(listing.province, adminData);
    if (!canonicalProvince) {
      recordErrors.push(`INVALID_PROVINCE: "${listing.province}" not in whitelist`);
      results.stats.province.invalid++;
    } else {
      if (canonicalProvince !== listing.province) {
        recordWarnings.push(`PROVINCE_NORMALIZED: "${listing.province}" → "${canonicalProvince}"`);
        results.stats.province.normalized++;
      }
      results.stats.province.valid++;
    }

    // 2. Validate district
    let canonicalDistrict = null;
    if (canonicalProvince) {
      canonicalDistrict = findDistrict(listing.district, canonicalProvince, adminData);
      if (!canonicalDistrict) {
        recordWarnings.push(`DISTRICT_NOT_IN_LIST: "${listing.district}" not found in ${canonicalProvince}`);
        results.stats.district.notInList++;
      } else {
        results.stats.district.valid++;
      }
    } else {
      results.stats.district.invalid++;
    }

    // 3. Validate ward
    if (canonicalProvince && canonicalDistrict) {
      const canonicalWard = findWard(listing.ward, canonicalDistrict, canonicalProvince, adminData);
      if (!canonicalWard) {
        recordWarnings.push(`WARD_NOT_IN_LIST: "${listing.ward}" not found in ${canonicalDistrict}`);
        results.stats.ward.notInList++;
      } else {
        results.stats.ward.valid++;
      }
    } else {
      if (listing.ward) {
        results.stats.ward.notInList++;
      }
    }

    // 4. Validate coordinates
    const coordResult = validateCoords(listing.latitude, listing.longitude, canonicalProvince);
    if (!coordResult.valid) {
      recordErrors.push(...coordResult.errors.filter(e => !e.startsWith('COORDS_')));
      results.stats.coords.invalid++;
    } else {
      results.stats.coords.valid++;
    }

    if (coordResult.swapped) {
      results.stats.coords.swapped++;
    }

    if (coordResult.errors.some(e => e.startsWith('COORDS_OUTSIDE_CITY'))) {
      results.stats.coords.outsideCity++;
    }

    // Track by province
    const provKey = canonicalProvince || 'UNKNOWN';
    if (!results.byProvince[provKey]) {
      results.byProvince[provKey] = { total: 0, errors: 0, warnings: 0 };
    }
    results.byProvince[provKey].total++;

    // Aggregate
    if (recordErrors.length === 0) {
      results.valid++;
    } else {
      results.byProvince[provKey].errors++;
      results.invalidRecords.push({
        id: listing.id,
        province: listing.province,
        district: listing.district,
        ward: listing.ward,
        errors: recordErrors
      });
    }

    if (recordWarnings.length > 0) {
      results.byProvince[provKey].warnings++;
      results.warnings.push({
        id: listing.id,
        warnings: recordWarnings
      });
    }

    if (recordErrors.length > 0) {
      results.errors.push({
        id: listing.id,
        errors: recordErrors
      });
    }
  });

  // Check for duplicate coordinates
  const duplicates = findDuplicateCoords(listings);
  results.stats.duplicateCoords.count = duplicates.length;
  results.stats.duplicateCoords.affected = duplicates.reduce((sum, d) => sum + d.count, 0);

  if (duplicates.length > 0) {
    console.log(`⚠️  Found ${duplicates.length} duplicate coordinate groups (${results.stats.duplicateCoords.affected} records)`);

    // Log top duplicates
    duplicates.slice(0, 5).forEach(d => {
      console.log(`   ${d.coord}: ${d.count} records`);
    });
  }

  // Generate summary
  const summary = `# Admin Validation Report

**Generated:** ${new Date().toISOString()}
**Dataset:** \`app/data/listings_vn_postmerge.json\`
**Total Records:** ${results.total}

## Summary

| Metric | Count | Status |
|--------|-------|--------|
| Total Records | ${results.total} | - |
| Valid Records | ${results.valid} | ${results.valid === results.total ? '✅' : '⚠️'} |
| Records with Errors | ${results.errors.length} | ${results.errors.length === 0 ? '✅' : '❌'} |
| Records with Warnings | ${results.warnings.length} | ${results.warnings.length === 0 ? '✅' : '⚠️'} |

## Province Validation

| Province | Total | Errors | Warnings |
|----------|-------|--------|----------|
${Object.entries(results.byProvince).map(([p, s]) =>
  `| ${p} | ${s.total} | ${s.errors} | ${s.warnings} |`
).join('\n')}

## Coordinate Validation

| Metric | Count |
|--------|-------|
| Valid Coords | ${results.stats.coords.valid} |
| Invalid Coords | ${results.stats.coords.invalid} |
| Swapped & Fixed | ${results.stats.coords.swapped} |
| Outside City Bounds | ${results.stats.coords.outsideCity} |

## Duplicate Coordinates

| Metric | Count |
|--------|-------|
| Duplicate Groups | ${results.stats.duplicateCoords.count} |
| Affected Records | ${results.stats.duplicateCoords.affected} |

${duplicates.length > 0 ? `
### Top Duplicate Locations

${duplicates.slice(0, 10).map(d => `- \`${d.coord}\`: ${d.count} records`).join('\n')}
` : ''}

## District/Ward Validation

| Level | Valid | Not in Canonical List |
|-------|-------|----------------------|
| District | ${results.stats.district.valid} | ${results.stats.district.notInList} |
| Ward | ${results.stats.ward.valid} | ${results.stats.ward.notInList} |

${results.invalidRecords.length > 0 ? `
## Invalid Records (${results.invalidRecords.length})

| ID | Province | District | Errors |
|----|----------|----------|--------|
${results.invalidRecords.slice(0, 20).map(r =>
  `| ${r.id} | ${r.province} | ${r.district} | ${r.errors.join('; ')} |`
).join('\n')}
${results.invalidRecords.length > 20 ? `\n*...and ${results.invalidRecords.length - 20} more*` : ''}
` : ''}

## Validation Result

${results.errors.length === 0 ? '✅ **PASSED** - No critical errors found' : `❌ **FAILED** - ${results.errors.length} records have critical errors`}

---
*Run with: \`npm run validate:data\`*
`;

  // Ensure reports directory exists
  const reportsDir = path.dirname(OUTPUT_JSON);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Write outputs
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(results, null, 2));
  fs.writeFileSync(OUTPUT_MD, summary);

  // Console output
  console.log('\n📋 Validation Results:');
  console.log(`   ✅ Valid: ${results.valid}/${results.total}`);
  console.log(`   ❌ Errors: ${results.errors.length}`);
  console.log(`   ⚠️  Warnings: ${results.warnings.length}`);
  console.log(`\n📄 Reports written to:`);
  console.log(`   ${OUTPUT_JSON}`);
  console.log(`   ${OUTPUT_MD}`);

  // Exit with error if critical issues
  if (results.stats.coords.invalid > 0) {
    console.error(`\n❌ FAIL: ${results.stats.coords.invalid} records have invalid coordinates`);
    process.exit(1);
  }

  if (results.stats.province.invalid > 0) {
    console.error(`\n❌ FAIL: ${results.stats.province.invalid} records have invalid province`);
    process.exit(1);
  }

  console.log('\n✅ Validation PASSED');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
