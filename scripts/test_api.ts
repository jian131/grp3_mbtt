/**
 * JFinder API End-to-End Test Script
 * Tests both n8n and Next.js fallback APIs
 *
 * Usage: npx tsx scripts/test_api.ts
 */

const N8N_BASE = 'http://localhost:5678/webhook';
const NEXTJS_BASE = 'http://localhost:3000/api';

interface TestResult {
  name: string;
  endpoint: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  error?: string;
  details?: string;
}

const results: TestResult[] = [];

async function testEndpoint(
  name: string,
  url: string,
  options: RequestInit = {}
): Promise<TestResult> {
  const start = Date.now();
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    const duration = Date.now() - start;

    if (!response.ok) {
      return {
        name,
        endpoint: url,
        status: 'FAIL',
        duration,
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      name,
      endpoint: url,
      status: 'PASS',
      duration,
      details: JSON.stringify(data).substring(0, 100) + '...',
    };
  } catch (error) {
    return {
      name,
      endpoint: url,
      status: 'FAIL',
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function testGeoValidity(data: any[]): Promise<{ valid: number; invalid: number; issues: string[] }> {
  const issues: string[] = [];
  let valid = 0;
  let invalid = 0;

  // Bounding boxes for 3 cities
  const cityBounds: Record<string, { lat: [number, number]; lon: [number, number] }> = {
    'Hà Nội': { lat: [20.8, 21.2], lon: [105.7, 106.0] },
    'Đà Nẵng': { lat: [15.9, 16.2], lon: [108.1, 108.3] },
    'Hồ Chí Minh': { lat: [10.6, 11.0], lon: [106.5, 107.0] },
  };

  for (const item of data.slice(0, 100)) { // Check first 100
    const lat = item.latitude || item.lat;
    const lon = item.longitude || item.lon;
    const province = item.province || '';

    let inBounds = false;
    for (const [city, bounds] of Object.entries(cityBounds)) {
      if (province.includes(city) || city.includes('Hồ Chí Minh') && province.includes('TP.')) {
        if (lat >= bounds.lat[0] && lat <= bounds.lat[1] &&
            lon >= bounds.lon[0] && lon <= bounds.lon[1]) {
          inBounds = true;
        }
        break;
      }
    }

    if (inBounds) {
      valid++;
    } else {
      invalid++;
      if (issues.length < 5) {
        issues.push(`${item.id}: ${lat},${lon} not in ${province} bounds`);
      }
    }
  }

  return { valid, invalid, issues };
}

async function runTests() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║           JFinder API End-to-End Test Suite                  ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║ Testing n8n APIs and Next.js fallback routes                 ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Test n8n APIs
  console.log('🔄 Testing n8n APIs...\n');

  // 1. Search API
  results.push(await testEndpoint(
    'n8n: Search listings',
    `${N8N_BASE}/search?province=Hà Nội&limit=10`
  ));

  // 2. Listing Detail API
  results.push(await testEndpoint(
    'n8n: Listing detail',
    `${N8N_BASE}/listing/HN-20240101-001`
  ));

  // 3. Stats API
  results.push(await testEndpoint(
    'n8n: Stats',
    `${N8N_BASE}/stats`
  ));

  // 4. Districts API
  results.push(await testEndpoint(
    'n8n: Districts',
    `${N8N_BASE}/districts`
  ));

  // 5. ROI API
  results.push(await testEndpoint(
    'n8n: ROI calculation',
    `${N8N_BASE}/roi`,
    {
      method: 'POST',
      body: JSON.stringify({
        monthly_rent: 50,
        product_price: 50000,
        profit_margin: 0.3,
        target_daily_customers: 100,
        operating_cost: 10
      })
    }
  ));

  // 6. Valuation API
  results.push(await testEndpoint(
    'n8n: Valuation',
    `${N8N_BASE}/valuation`,
    {
      method: 'POST',
      body: JSON.stringify({
        district: 'Quận Hoàn Kiếm',
        type: 'streetfront',
        area_m2: 50,
        frontage_m: 5,
        floors: 2
      })
    }
  ));

  // Test Next.js fallback APIs
  console.log('\n🔄 Testing Next.js fallback APIs...\n');

  // 1. Listing Detail
  results.push(await testEndpoint(
    'Next.js: Listing detail',
    `${NEXTJS_BASE}/listing/HN-20240101-001`
  ));

  // 2. ROI
  results.push(await testEndpoint(
    'Next.js: ROI calculation',
    `${NEXTJS_BASE}/roi`,
    {
      method: 'POST',
      body: JSON.stringify({
        monthly_rent: 50,
        product_price: 50000,
        profit_margin: 0.3,
        target_daily_customers: 100,
        operating_cost: 10
      })
    }
  ));

  // 3. Valuation
  results.push(await testEndpoint(
    'Next.js: Valuation',
    `${NEXTJS_BASE}/valuation`,
    {
      method: 'POST',
      body: JSON.stringify({
        district: 'Quận Hoàn Kiếm',
        type: 'streetfront',
        area_m2: 50,
        frontage_m: 5,
        floors: 2
      })
    }
  ));

  // Geo validation test
  console.log('\n🔄 Testing geo-location validity...\n');

  try {
    const searchResponse = await fetch(`${N8N_BASE}/search?limit=100`);
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      const listings = searchData.data || searchData;

      if (Array.isArray(listings) && listings.length > 0) {
        const geoResults = await testGeoValidity(listings);
        results.push({
          name: 'Geo validation (100 samples)',
          endpoint: `${N8N_BASE}/search`,
          status: geoResults.invalid === 0 ? 'PASS' : 'FAIL',
          duration: 0,
          details: `Valid: ${geoResults.valid}, Invalid: ${geoResults.invalid}`,
          error: geoResults.issues.length > 0 ? geoResults.issues.join('; ') : undefined
        });
      }
    }
  } catch (error) {
    results.push({
      name: 'Geo validation',
      endpoint: `${N8N_BASE}/search`,
      status: 'SKIP',
      duration: 0,
      error: 'Could not fetch data for geo validation'
    });
  }

  // Print results
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST RESULTS                            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;

  for (const result of results) {
    const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
    console.log(`${statusIcon} ${result.name}`);
    console.log(`   Endpoint: ${result.endpoint}`);
    console.log(`   Duration: ${result.duration}ms`);
    if (result.error) console.log(`   Error: ${result.error}`);
    if (result.details) console.log(`   Details: ${result.details}`);
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Summary: ${passed} passed, ${failed} failed, ${skipped} skipped`);
  console.log('═══════════════════════════════════════════════════════════════');

  // Exit with error code if any tests failed
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(console.error);
