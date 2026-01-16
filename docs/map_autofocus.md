# Map Auto-Focus Feature

**Version:** 1.0
**Updated:** 2026-01-16

## Overview

The RentalHeatmap component now includes intelligent auto-focus functionality that automatically pans and zooms the map to relevant areas based on user actions.

## Features

### 1. Filter-Based Auto-Focus

When users select filters, the map automatically focuses on the relevant area:

| Action               | Map Behavior              | Zoom Level |
| -------------------- | ------------------------- | ---------- |
| Select Province      | Fly to city center        | 12         |
| Select District      | Fit to district bounds    | 14         |
| Search with results  | Fit to all result markers | 14 (max)   |
| Click listing on map | Fly to listing location   | 17         |

### 2. Priority Order

The auto-focus logic follows this priority:

1. **Selected Listing** - If a listing is selected (from grid or map click), fly to its location
2. **District Filter** - If district is selected, fit to district bounds
3. **Province Filter** - If only province selected, fly to city center
4. **Results Bounds** - If no specific filter, fit to all markers

### 3. Map Controls

Two new control buttons are available:

- **🌏 Reset** - Reset view to show all Vietnam (zoom 6)
- **🎯 Fit Results** - Fit map to show all current search results

### 4. Zoom Level Constants

```typescript
export const MAP_ZOOM = {
  COUNTRY: 6, // Show all Vietnam
  CITY: 12, // City overview
  DISTRICT: 14, // District level
  WARD: 15, // Ward level
  LISTING: 17, // Individual listing
  MAX: 18, // Maximum zoom
};
```

## Implementation Details

### Component Props

```typescript
interface Props {
  filterProvince?: string; // Currently selected province
  filterDistrict?: string; // Currently selected district
  filterType?: string; // Listing type filter
  filterPriceMax?: number; // Max price filter
  listings?: Listing[]; // Pre-loaded listings (optional)
  selectedListingId?: string; // Currently selected listing ID
  onListingSelect?: (listing: Listing) => void; // Callback when listing clicked
  autoFocus?: boolean; // Enable/disable auto-focus (default: true)
}
```

### District Bounds Data

District centroids and bounds are defined in `lib/mapConfig.ts`:

```typescript
export const DISTRICT_GEO: Record<string, Record<string, DistrictGeo>> = {
  "Thành phố Hà Nội": {
    "Quận Hoàn Kiếm": {
      center: { lat: 21.0285, lon: 105.8542 },
      bounds: [
        [21.015, 105.84],
        [21.042, 105.87],
      ],
    },
    // ... other districts
  },
  // ... other cities
};
```

### Coordinate Validation

Only valid Vietnam coordinates are rendered on the map:

```typescript
export function isValidVietnamCoords(lat: number, lon: number): boolean {
  return (
    typeof lat === "number" &&
    typeof lon === "number" &&
    !isNaN(lat) &&
    !isNaN(lon) &&
    lat >= 8.5 &&
    lat <= 23.5 &&
    lon >= 102 &&
    lon <= 110
  );
}
```

## Usage Examples

### Basic Usage

```tsx
<RentalHeatmap listings={searchResults} />
```

### With Filters (Auto-Focus Enabled)

```tsx
<RentalHeatmap
  listings={searchResults}
  filterProvince={selectedProvince}
  filterDistrict={selectedDistrict}
  autoFocus={true}
/>
```

### With Listing Selection

```tsx
const [selectedId, setSelectedId] = useState<string>();

<RentalHeatmap
  listings={searchResults}
  filterProvince={selectedProvince}
  filterDistrict={selectedDistrict}
  selectedListingId={selectedId}
  onListingSelect={(listing) => setSelectedId(listing.id)}
/>;
```

### Disable Auto-Focus

```tsx
<RentalHeatmap listings={searchResults} autoFocus={false} />
```

## Animation Settings

All map movements use smooth animations:

- **Duration:** 0.5-0.8 seconds
- **Easing:** Default Leaflet easing
- **Padding:** 30-50px for bounds fitting

## Fallback Rules

1. **Missing District Bounds:** Calculate bounds from listing markers
2. **Empty Results:** Do not zoom (keep current view)
3. **Invalid Coordinates:** Skip markers, don't affect bounds calculation
4. **Unknown Province:** Use Vietnam center as fallback

## Test Checklist

- [ ] Search district=Hoàn Kiếm → map zooms to Hoàn Kiếm area
- [ ] Click marker on map → map flies to listing, popup opens
- [ ] Select province only → map zooms to city center
- [ ] Click "Reset" → map shows all Vietnam
- [ ] Click "Fit Results" → map fits all visible markers
- [ ] Change district filter → map smoothly transitions to new area
- [ ] Empty search results → map stays at current position
