# JFinder API Contract

**Generated:** 2026-01-16
**Version:** 2.0 (NoPostgres)

## 1. n8n Webhook APIs (Port 5678)

### 1.1 Search Listings

```http
GET /webhook/search
```

**Query Parameters:**

| Param    | Type   | Default | Description                           |
| -------- | ------ | ------- | ------------------------------------- |
| city     | string | -       | Province name filter (e.g., "Hà Nội") |
| district | string | -       | District name filter                  |
| ward     | string | -       | Ward name filter                      |
| minPrice | number | -       | Minimum price (VND)                   |
| maxPrice | number | -       | Maximum price (VND)                   |
| minArea  | number | -       | Minimum area (m²)                     |
| maxArea  | number | -       | Maximum area (m²)                     |
| bedrooms | number | -       | Number of bedrooms                    |
| page     | number | 1       | Page number                           |
| limit    | number | 20      | Items per page                        |

**Response:**

```typescript
{
  total: number;
  page: number;
  limit: number;
  data: Listing[];
}

interface Listing {
  id: number;
  title: string;
  price: number;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  latitude: number;
  longitude: number;
  province_name: string;
  district_name: string;
  ward_name: string;
  address?: string;
  images: string;           // Pipe-separated URLs
  description?: string;
  posted_date?: string;
  property_type?: string;
}
```

**Example:**

```bash
curl "http://localhost:5678/webhook/search?city=Hà Nội&minPrice=5000000&limit=10"
```

---

### 1.2 Get Statistics

```http
GET /webhook/stats
```

**Query Parameters:**

| Param   | Type   | Default    | Description                    |
| ------- | ------ | ---------- | ------------------------------ |
| groupBy | string | "district" | Group by: district, ward, city |
| city    | string | -          | Filter by city                 |

**Response:**

```typescript
{
  total: number;
  stats: StatItem[];
}

interface StatItem {
  name: string;           // District/ward/city name
  count: number;          // Number of listings
  avgPrice: number;       // Average price
  minPrice: number;
  maxPrice: number;
  avgArea: number;
  avgPricePerM2: number;
}
```

---

### 1.3 Calculate ROI

```http
POST /webhook/roi
Content-Type: application/json
```

**Request Body:**

```typescript
{
  purchasePrice: number;    // Property purchase price (VND)
  monthlyRent: number;      // Expected monthly rent (VND)
  downPayment?: number;     // Down payment percentage (default: 100)
  interestRate?: number;    // Annual interest rate % (default: 0)
  loanTerm?: number;        // Loan term in years (default: 0)
  maintenanceCost?: number; // Annual maintenance % of price (default: 1)
  vacancyRate?: number;     // Vacancy rate % (default: 5)
  managementFee?: number;   // Management fee % of rent (default: 10)
  propertyTax?: number;     // Annual property tax % (default: 0.03)
}
```

**Response:**

```typescript
{
  grossROI: number;         // Gross ROI percentage
  netROI: number;           // Net ROI after expenses
  annualIncome: number;     // Gross annual rental income
  annualExpenses: number;   // Total annual expenses
  netAnnualIncome: number;  // Net annual income
  paybackYears: number;     // Years to recover investment
  monthlyMortgage?: number; // Monthly mortgage payment (if applicable)
  cashOnCashReturn?: number; // Cash on cash return (if leveraged)
}
```

**Example:**

```bash
curl -X POST "http://localhost:5678/webhook/roi" \
  -H "Content-Type: application/json" \
  -d '{"purchasePrice": 2000000000, "monthlyRent": 15000000}'
```

---

### 1.4 Property Valuation

```http
POST /webhook/valuation
Content-Type: application/json
```

**Request Body:**

```typescript
{
  district: string;         // District name
  city?: string;            // City name (default: infer from district)
  area: number;             // Property area in m²
  bedrooms?: number;        // Number of bedrooms
  propertyType?: string;    // "apartment", "house", "villa"
  floor?: number;           // Floor number (for apartments)
  isFurnished?: boolean;    // Has furniture
}
```

**Response:**

```typescript
{
  estimatedValue: number;   // Estimated property value (VND)
  pricePerM2: number;       // Estimated price per m²
  confidence: "high" | "medium" | "low";
  comparableCount: number;  // Number of comparable properties found
  priceRange: {
    min: number;
    max: number;
    median: number;
  };
  recommendations?: string[];
}
```

---

## 2. Next.js API Routes (Port 3000)

### 2.1 Get Single Listing

```http
GET /api/listing/{id}
```

**Path Parameters:**

| Param | Type   | Description |
| ----- | ------ | ----------- |
| id    | string | Listing ID  |

**Response:**

```typescript
interface ListingDetail {
  id: string;
  title: string;
  description?: string;
  price: number;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  location: {
    latitude: number;
    longitude: number;
    city: string;
    district: string;
    ward: string;
    address: string;
  };
  images: string[];
  pricePerM2: number;
  amenities?: string[];
  postedDate?: string;
  features?: Record<string, string | number>;
}
```

**Error Response:**

```typescript
{
  error: string;
  status: number;
}
```

---

### 2.2 ROI Calculation (Fallback)

```http
POST /api/roi
Content-Type: application/json
```

Same request/response as n8n `/webhook/roi`.

---

### 2.3 Valuation (Fallback)

```http
POST /api/valuation
Content-Type: application/json
```

Same request/response as n8n `/webhook/valuation`.

---

### 2.4 Export Data

```http
GET /api/export
```

**Query Parameters:**

| Param  | Type   | Default | Description                    |
| ------ | ------ | ------- | ------------------------------ |
| format | string | "json"  | Output format: "json" or "csv" |
| city   | string | -       | Filter by city                 |
| limit  | number | 1000    | Max records                    |

**Response:**

- `format=json`: Returns JSON array
- `format=csv`: Returns CSV file with Content-Disposition header

---

## 3. Frontend API Client (lib/api.ts)

### Type Definitions

```typescript
export interface Listing {
  id: string;
  title: string;
  price: number;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  location: {
    latitude: number;
    longitude: number;
    city: string;
    district: string;
    ward: string;
    address: string;
  };
  images: string[];
  pricePerM2: number;
  description?: string;
  amenities?: string[];
  postedDate?: string;
  features?: Record<string, string | number>;
}

export interface SearchFilters {
  city?: string;
  district?: string;
  ward?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  bedrooms?: number;
  page?: number;
  limit?: number;
}

export interface ROIParams {
  purchasePrice: number;
  monthlyRent: number;
  downPayment?: number;
  interestRate?: number;
  loanTerm?: number;
  maintenanceCost?: number;
  vacancyRate?: number;
  managementFee?: number;
  propertyTax?: number;
}

export interface ROIResult {
  grossROI: number;
  netROI: number;
  annualIncome: number;
  annualExpenses: number;
  netAnnualIncome: number;
  paybackYears: number;
  monthlyMortgage?: number;
  cashOnCashReturn?: number;
}

export interface ValuationParams {
  district: string;
  city?: string;
  area: number;
  bedrooms?: number;
  propertyType?: string;
  floor?: number;
  isFurnished?: boolean;
}

export interface ValuationResult {
  estimatedValue: number;
  pricePerM2: number;
  confidence: "high" | "medium" | "low";
  comparableCount: number;
  priceRange: {
    min: number;
    max: number;
    median: number;
  };
  recommendations?: string[];
}
```

### Function Signatures

```typescript
// Fetch listings with filters
export async function fetchListings(filters: SearchFilters): Promise<{
  data: Listing[];
  total: number;
  page: number;
  limit: number;
}>;

// Fetch single listing
export async function fetchListing(id: string): Promise<Listing>;

// Get district statistics
export async function fetchStats(
  groupBy?: string,
  city?: string
): Promise<{
  total: number;
  stats: StatItem[];
}>;

// Calculate ROI
export async function calculateROI(params: ROIParams): Promise<ROIResult>;

// Get property valuation
export async function getValuation(
  params: ValuationParams
): Promise<ValuationResult>;

// Legacy stats function (local JSON)
export async function fetchStatsLegacy(): Promise<StatItem[]>;
```

---

## 4. Error Handling

All APIs return errors in this format:

```typescript
{
  error: string;       // Human-readable error message
  status?: number;     // HTTP status code
  code?: string;       // Error code for programmatic handling
  details?: unknown;   // Additional error details
}
```

**Common Status Codes:**

| Code | Meaning                          |
| ---- | -------------------------------- |
| 200  | Success                          |
| 400  | Bad request (invalid parameters) |
| 404  | Listing not found                |
| 500  | Server error                     |
| 503  | Service unavailable (n8n down)   |

---

## 5. Rate Limits

Currently no rate limits applied. For production:

- Recommended: 100 requests/minute per IP
- Search API: Cache results for 5 minutes
- ROI/Valuation: No caching (dynamic calculations)
