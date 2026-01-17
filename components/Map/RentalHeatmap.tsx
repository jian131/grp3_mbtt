'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { fetchListings, Listing } from '@/lib/api';
import { useMapEvents } from 'react-leaflet';
import {
  MAP_ZOOM,
  DEFAULT_CENTER,
  getDistrictGeo,
  getCityCenter,
  calculateBoundsFromPoints,
  isValidVietnamCoords
} from '@/lib/mapConfig';

// Dynamic import for Leaflet components
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then((mod) => mod.CircleMarker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then((mod) => mod.Polyline), { ssr: false });

type HeatmapMode = 'price' | 'potential';
type RouteProfile = 'driving' | 'walking';

interface RouteCacheEntry {
  coords: Array<[number, number]>;
  stats: { distanceKm: number; durationMin: number; durationLabel: string };
}

interface Props {
  filterProvince?: string;
  filterDistrict?: string;
  filterType?: Listing['type'];
  filterPriceMax?: number;
  listings?: Listing[];
  selectedListingId?: string;
  onListingSelect?: (listing: Listing) => void;
  autoFocus?: boolean;
}

const getPriceColor = (price: number): string => {
  if (price > 100) return '#ef4444';
  if (price > 50) return '#f59e0b';
  if (price > 25) return '#22c55e';
  return '#3b82f6';
};

const getPotentialColor = (score: number): string => {
  if (score >= 85) return '#22d3ee';
  if (score >= 70) return '#60a5fa';
  if (score >= 50) return '#818cf8';
  return '#a78bfa';
};

export default function RentalHeatmap({
  filterProvince,
  filterDistrict,
  filterType,
  filterPriceMax,
  listings: externalListings,
  selectedListingId,
  onListingSelect,
  autoFocus = true
}: Props) {
  const [isClient, setIsClient] = useState(false);
  const [mode, setMode] = useState<HeatmapMode>('price');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [origin, setOrigin] = useState<{ lat: number; lon: number } | null>(null);
  const [originInput, setOriginInput] = useState({ lat: '', lon: '' });
  const [routeCoords, setRouteCoords] = useState<Array<[number, number]>>([]);
  const [routeStats, setRouteStats] = useState<{ distanceKm: number; durationMin: number; durationLabel: string } | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeProfile, setRouteProfile] = useState<RouteProfile>('driving');
  const mapRef = useRef<L.Map | null>(null);
  const lastFocusKeyRef = useRef<string>('');
  const routeAbortRef = useRef<AbortController | null>(null);
  const routeCacheRef = useRef<Map<string, RouteCacheEntry>>(new Map());

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (externalListings) {
      // Filter only valid geo coordinates
      const validListings = externalListings.filter(l =>
        isValidVietnamCoords(l.lat || l.latitude || 0, l.lon || l.longitude || 0)
      );
      // DEBUG: Ba Đình coord validation
      validListings.forEach(l => {
        const lat = l.lat || l.latitude || 0;
        const lon = l.lon || l.longitude || 0;
        const district = (l.district || '').toLowerCase();
        if (district.includes('ba đình') || district.includes('ba dinh')) {
          // Ba Đình bounds: lat [21.02, 21.06], lon [105.80, 105.86]
          if (lat < 21.02 || lat > 21.06 || lon < 105.80 || lon > 105.86) {
            console.warn(`⚠️ WRONG COORDS for Ba Đình listing ${l.id}: lat=${lat}, lon=${lon} (expected: lat 21.02-21.06, lon 105.80-105.86)`);
          }
        }
      });
      setListings(validListings);
      setLoading(false);
      return;
    }

    async function loadData() {
      setLoading(true);
      console.log('[DATA SOURCE] RentalHeatmap loading via fetchListings');
      const data = await fetchListings({
        province: filterProvince,
        district: filterDistrict,
        type: filterType,
        maxPrice: filterPriceMax,
        limit: 500,
      });
      // Filter valid coordinates
      const validData = data.filter(l =>
        isValidVietnamCoords(l.lat || l.latitude || 0, l.lon || l.longitude || 0)
      );
      // DEBUG: Ba Đình coord validation
      validData.forEach(l => {
        const lat = l.lat || l.latitude || 0;
        const lon = l.lon || l.longitude || 0;
        const district = (l.district || '').toLowerCase();
        if (district.includes('ba đình') || district.includes('ba dinh')) {
          if (lat < 21.02 || lat > 21.06 || lon < 105.80 || lon > 105.86) {
            console.warn(`⚠️ WRONG COORDS for Ba Đình listing ${l.id}: lat=${lat}, lon=${lon} (expected: lat 21.02-21.06, lon 105.80-105.86)`);
          }
        }
      });
      setListings(validData);
      setLoading(false);
    }
    loadData();
  }, [filterProvince, filterDistrict, filterType, filterPriceMax, externalListings]);

  // Auto-focus logic when filters change
  useEffect(() => {
    if (!mapReady || !mapRef.current || !autoFocus) return;

    const map = mapRef.current;
    const focusKey = `${filterProvince || ''}-${filterDistrict || ''}-${selectedListingId || ''}-${listings.length}`;

    // Don't refocus if nothing changed
    if (focusKey === lastFocusKeyRef.current) return;
    lastFocusKeyRef.current = focusKey;

    // Priority 1: Selected listing - fly to it
    if (selectedListingId) {
      const selected = listings.find(l => l.id === selectedListingId);
      if (selected) {
        const lat = selected.lat || selected.latitude || 0;
        const lon = selected.lon || selected.longitude || 0;
        if (isValidVietnamCoords(lat, lon)) {
          map.flyTo([lat, lon], MAP_ZOOM.LISTING, { duration: 0.8 });
          return;
        }
      }
    }

    // Priority 2: District filter - fit to district bounds
    if (filterDistrict && filterProvince) {
      const districtGeo = getDistrictGeo(filterProvince, filterDistrict);
      if (districtGeo) {
        map.flyToBounds(districtGeo.bounds, {
          padding: [30, 30],
          duration: 0.8,
          maxZoom: MAP_ZOOM.DISTRICT
        });
        return;
      }
    }

    // Priority 3: Province filter - fly to city center
    if (filterProvince) {
      const cityCenter = getCityCenter(filterProvince);
      if (cityCenter) {
        map.flyTo([cityCenter.lat, cityCenter.lon], cityCenter.zoom, { duration: 0.8 });
        return;
      }
    }

    // Priority 4: Fit to all results
    if (listings.length > 0) {
      const points = listings.map(l => ({
        lat: l.lat || l.latitude || 0,
        lon: l.lon || l.longitude || 0
      })).filter(p => isValidVietnamCoords(p.lat, p.lon));

      const bounds = calculateBoundsFromPoints(points);
      if (bounds) {
        map.flyToBounds(bounds, {
          padding: [50, 50],
          duration: 0.8,
          maxZoom: MAP_ZOOM.DISTRICT
        });
        return;
      }
    }
  }, [mapReady, filterProvince, filterDistrict, selectedListingId, listings, autoFocus]);

  // Handle map ready
  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map;
    setMapReady(true);
  }, []);

  // Reset view to show all Vietnam
  const handleResetView = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.flyTo([DEFAULT_CENTER.lat, DEFAULT_CENTER.lon], DEFAULT_CENTER.zoom, { duration: 0.5 });
    }
  }, []);

  // Fit to current results
  const handleFitToResults = useCallback(() => {
    if (!mapRef.current || listings.length === 0) return;

    const points = listings.map(l => ({
      lat: l.lat || l.latitude || 0,
      lon: l.lon || l.longitude || 0
    })).filter(p => isValidVietnamCoords(p.lat, p.lon));

    const bounds = calculateBoundsFromPoints(points);
    if (bounds) {
      mapRef.current.flyToBounds(bounds, {
        padding: [50, 50],
        duration: 0.5,
        maxZoom: MAP_ZOOM.DISTRICT
      });
    }
  }, [listings]);

  const selectedListing = selectedListingId
    ? listings.find(l => l.id === selectedListingId)
    : null;

  const clearRoute = useCallback(() => {
    setRouteCoords([]);
    setRouteStats(null);
    setRouteError(null);
  }, []);

  const handleUseLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setRouteError('Trình duyệt không hỗ trợ định vị');
      return;
    }

    setRouteError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        if (!isValidVietnamCoords(lat, lon)) {
          setRouteError('Vị trí ngoài phạm vi Việt Nam');
          return;
        }
        setOrigin({ lat, lon });
      },
      (err) => {
        setRouteError(err.message || 'Không lấy được vị trí');
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }, []);

  const handleSetManualOrigin = useCallback(() => {
    const lat = Number(originInput.lat);
    const lon = Number(originInput.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      setRouteError('Lat/Lon không hợp lệ');
      return;
    }
    if (!isValidVietnamCoords(lat, lon)) {
      setRouteError('Vị trí ngoài phạm vi Việt Nam');
      return;
    }
    setRouteError(null);
    setOrigin({ lat, lon });
  }, [originInput.lat, originInput.lon]);

  const handleSetOriginFromMap = useCallback((lat: number, lon: number) => {
    if (!isValidVietnamCoords(lat, lon)) {
      setRouteError('Vị trí ngoài phạm vi Việt Nam');
      return;
    }
    setRouteError(null);
    setOrigin({ lat, lon });
    setOriginInput({ lat: lat.toFixed(6), lon: lon.toFixed(6) });
  }, []);

  useEffect(() => {
    if (!origin || !selectedListing) {
      clearRoute();
      return;
    }

    const destLat = selectedListing.lat || selectedListing.latitude || 0;
    const destLon = selectedListing.lon || selectedListing.longitude || 0;
    if (!isValidVietnamCoords(destLat, destLon)) {
      setRouteError('Điểm đến không hợp lệ');
      clearRoute();
      return;
    }

    const cacheKey = `${routeProfile}:${origin.lat.toFixed(6)},${origin.lon.toFixed(6)}->${destLat.toFixed(6)},${destLon.toFixed(6)}`;
    const cached = routeCacheRef.current.get(cacheKey);
    if (cached) {
      setRouteCoords(cached.coords);
      setRouteStats(cached.stats);
      setRouteError(null);
      return;
    }

    if (routeAbortRef.current) {
      routeAbortRef.current.abort();
    }

    const controller = new AbortController();
    routeAbortRef.current = controller;
    setRouteLoading(true);
    setRouteError(null);

    const url = `https://router.project-osrm.org/route/v1/${routeProfile}/${origin.lon},${origin.lat};${destLon},${destLat}?overview=full&geometries=geojson`;

    fetch(url, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (!data?.routes?.length) {
          throw new Error('Không tìm được tuyến đường');
        }
        const route = data.routes[0];
        const coords = route.geometry.coordinates.map((pt: [number, number]) => [pt[1], pt[0]] as [number, number]);
        const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
        const avgSpeedKmh = routeProfile === 'walking' ? 4.5 : 25;
        const durationMin = Math.round(((distanceKm / avgSpeedKmh) * 60) * 10) / 10;
        const stats = {
          distanceKm,
          durationMin,
          durationLabel: 'Ước tính'
        };
        setRouteCoords(coords);
        setRouteStats(stats);
        routeCacheRef.current.set(cacheKey, { coords, stats });
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        setRouteError(err?.message || 'Lỗi chỉ đường');
        clearRoute();
      })
      .finally(() => {
        setRouteLoading(false);
      });
  }, [origin, selectedListing, routeProfile, clearRoute]);

  useEffect(() => {
    if (!mapRef.current || routeCoords.length < 2) return;
    const points = routeCoords.map(([lat, lon]) => ({ lat, lon }));
    const bounds = calculateBoundsFromPoints(points);
    if (bounds) {
      mapRef.current.flyToBounds(bounds, {
        padding: [50, 50],
        duration: 0.6,
        maxZoom: MAP_ZOOM.DISTRICT
      });
    }
  }, [routeCoords]);

  const MapClickHandler = () => {
    useMapEvents({
      click: (event) => {
        handleSetOriginFromMap(event.latlng.lat, event.latlng.lng);
      }
    });
    return null;
  };

  if (!isClient) {
    return (
      <div className="w-full h-full bg-slate-900 animate-pulse rounded-xl flex items-center justify-center text-cyan-500">
        <div className="text-center">
          <div className="text-xl font-bold mb-2">JFinder Intelligence</div>
          <div className="text-sm text-gray-400">Loading map...</div>
        </div>
      </div>
    );
  }

  const getColor = (listing: Listing) => {
    return mode === 'price'
      ? getPriceColor(listing.price_million || listing.price || 0)
      : getPotentialColor(listing.ai?.potentialScore || listing.ai_potential_score || 50);
  };

  const getRadius = (listing: Listing) => {
    const views = listing.views || 0;
    const base = mode === 'price' ? views / 200 : 7;
    return Math.max(5, Math.min(15, base || 5));
  };

  // Calculate initial center
  const initialCenter = filterProvince
    ? getCityCenter(filterProvince) || DEFAULT_CENTER
    : DEFAULT_CENTER;

  return (
    <div className="w-full h-[600px] rounded-xl overflow-hidden shadow-2xl border border-white/10 relative z-0">
      {/* Mode Toggle */}
      <div className="absolute top-4 left-4 z-[1000] flex gap-2">
        <button
          onClick={() => setMode('price')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'price' ? 'bg-cyan-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
        >
          💰 Price Map
        </button>
        <button
          onClick={() => setMode('potential')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'potential' ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
        >
          🎯 Potential Map
        </button>
      </div>

      {/* Route Controls - Enhanced Visibility */}
      <div className="absolute top-14 left-4 z-[1001] bg-slate-800/95 backdrop-blur-md p-3 rounded-lg w-[260px] space-y-2 border border-cyan-500/30 shadow-xl">
        <div className="text-xs font-bold text-cyan-400">Chỉ đường tới mặt bằng</div>
        <div className="flex gap-2">
          <button
            onClick={handleUseLocation}
            className="px-2 py-1 rounded text-xs font-bold bg-slate-700 text-gray-200 hover:bg-slate-600 transition-all"
          >
            Dùng vị trí của tôi
          </button>
          <button
            onClick={() => {
              setOrigin(null);
              clearRoute();
            }}
            className="px-2 py-1 rounded text-xs font-bold bg-slate-700 text-gray-200 hover:bg-slate-600 transition-all"
          >
            Xóa
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setRouteProfile('driving')}
            className={`px-2 py-1 rounded text-xs font-bold transition-all ${routeProfile === 'driving' ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-gray-200 hover:bg-slate-600'}`}
          >
            Lái xe
          </button>
          <button
            onClick={() => setRouteProfile('walking')}
            className={`px-2 py-1 rounded text-xs font-bold transition-all ${routeProfile === 'walking' ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-gray-200 hover:bg-slate-600'}`}
          >
            Đi bộ
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            value={originInput.lat}
            onChange={(e) => setOriginInput(prev => ({ ...prev, lat: e.target.value }))}
            placeholder="Lat"
            className="bg-black/30 text-xs text-white px-2 py-1 rounded border border-white/10"
          />
          <input
            value={originInput.lon}
            onChange={(e) => setOriginInput(prev => ({ ...prev, lon: e.target.value }))}
            placeholder="Lon"
            className="bg-black/30 text-xs text-white px-2 py-1 rounded border border-white/10"
          />
        </div>
        <button
          onClick={handleSetManualOrigin}
          className="w-full px-2 py-1 rounded text-xs font-bold bg-slate-700 text-gray-200 hover:bg-slate-600 transition-all"
        >
          Đặt điểm xuất phát
        </button>
        <div className="text-[11px] text-gray-400">Mẹo: bấm vào bản đồ để đặt điểm xuất phát.</div>
        <div className="text-[11px] text-gray-400">
          {origin
            ? `Điểm xuất phát: ${origin.lat.toFixed(5)}, ${origin.lon.toFixed(5)}`
            : 'Cần điểm xuất phát để vẽ tuyến'}
        </div>
        <div className="text-[11px] text-gray-400">
          {selectedListing
            ? `Điểm đến: ${selectedListing.title || selectedListing.name}`
            : 'Chọn một mặt bằng'}
        </div>
        {routeLoading && <div className="text-[11px] text-cyan-400">Đang tìm tuyến...</div>}
        {routeStats && (
          <div className="text-[11px] text-green-400">
            {routeStats.distanceKm} km | {routeStats.durationMin} phút ({routeStats.durationLabel})
          </div>
        )}
        {routeError && <div className="text-[11px] text-red-400">{routeError}</div>}
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex gap-2">
        <button
          onClick={handleResetView}
          className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/10 text-gray-300 hover:bg-white/20 transition-all"
          title="Reset view to Vietnam"
        >
          🌏 Reset
        </button>
        <button
          onClick={handleFitToResults}
          disabled={listings.length === 0}
          className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/10 text-gray-300 hover:bg-white/20 transition-all disabled:opacity-50"
          title="Fit to current results"
        >
          🎯 Fit Results
        </button>
      </div>

      {/* Stats Badge */}
      <div className="absolute top-14 right-4 z-[1000] glass-panel px-3 py-1.5 rounded-full">
        <span className="text-xs text-cyan-400 font-bold">
          {loading ? 'Loading...' : `${listings.length} listings`}
        </span>
      </div>

      {/* District info badge */}
      {filterDistrict && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] glass-panel px-4 py-2 rounded-full">
          <span className="text-xs text-white font-bold">
            📍 {filterDistrict}
            {filterProvince && `, ${filterProvince.replace('Thành phố ', '')}`}
          </span>
        </div>
      )}

      {/* @ts-ignore */}
      <MapContainer
        center={[initialCenter.lat, initialCenter.lon]}
        zoom={initialCenter.zoom}
        style={{ height: '100%', width: '100%', background: '#020617' }}
        className="z-0"
        ref={(map: L.Map | null) => {
          if (map && !mapRef.current) {
            handleMapReady(map);
          }
        }}
      >
        {/* @ts-ignore */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <MapClickHandler />

        {routeCoords.length > 1 && (
          // @ts-ignore
          <Polyline
            positions={routeCoords}
            pathOptions={{ color: '#22d3ee', weight: 4, opacity: 0.9 }}
          />
        )}

        {origin && (
          // @ts-ignore
          <CircleMarker
            center={[origin.lat, origin.lon]}
            pathOptions={{ fillColor: '#f97316', color: '#f97316', weight: 2, opacity: 1, fillOpacity: 0.9 }}
            radius={7}
          >
            {/* @ts-ignore */}
            <Popup>
              <div className="p-2 text-xs text-white bg-slate-900 rounded-lg">Origin</div>
            </Popup>
          </CircleMarker>
        )}

        {listings.map((listing) => {
          const lat = listing.lat || listing.latitude || 0;
          const lon = listing.lon || listing.longitude || 0;

          if (!isValidVietnamCoords(lat, lon)) return null;

          const isSelected = listing.id === selectedListingId;

          return (
            // @ts-ignore
            <CircleMarker
              key={listing.id}
              center={[lat, lon]}
              pathOptions={{
                fillColor: isSelected ? '#ffffff' : getColor(listing),
                color: isSelected ? '#22d3ee' : getColor(listing),
                weight: isSelected ? 3 : 1,
                opacity: 1,
                fillOpacity: isSelected ? 1 : 0.8,
              }}
              radius={isSelected ? 12 : getRadius(listing)}
              eventHandlers={{
                click: () => {
                  if (onListingSelect) {
                    onListingSelect(listing);
                  }
                  // Fly to clicked marker
                  if (mapRef.current) {
                    mapRef.current.flyTo([lat, lon], MAP_ZOOM.LISTING, { duration: 0.5 });
                  }
                }
              }}
            >
              {/* @ts-ignore */}
              <Popup>
                <div className="p-3 min-w-[220px] bg-slate-900 text-white rounded-lg">
                  <h3 className="font-bold text-sm text-cyan-400 mb-2 line-clamp-2">
                    {listing.title || listing.name}
                  </h3>
                  {/* DEBUG: Show ID and coords */}
                  <div className="text-[10px] text-gray-500 font-mono mb-2 border-b border-gray-700 pb-1">
                    ID: {listing.id}<br/>
                    Lat: {lat.toFixed(6)} | Lon: {lon.toFixed(6)}
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Giá thuê:</span>
                      <span className="font-bold text-green-400">
                        {listing.price_million || listing.price} tr/tháng
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Diện tích:</span>
                      <span>{listing.area_m2 || listing.area} m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">AI Score:</span>
                      <span className="font-bold text-purple-400">
                        {listing.ai?.potentialScore || listing.ai_potential_score || 'N/A'}/100
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-white/10 text-xs text-gray-400">
                    📍 {listing.ward && `${listing.ward}, `}{listing.district}
                  </div>
                  <a
                    href={`/listing/${listing.id}`}
                    className="mt-2 block text-center text-xs text-cyan-400 hover:text-cyan-300 font-bold"
                  >
                    Xem chi tiết →
                  </a>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 glass-panel p-4 rounded-lg shadow-lg z-[1000] space-y-2 border border-white/10">
        <h4 className="font-bold text-cyan-400 text-sm mb-2 uppercase tracking-wider">
          {mode === 'price' ? '💰 Price Heatmap' : '🎯 Potential Map'}
        </h4>
        {mode === 'price' ? (
          <>
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <div className="w-4 h-4 rounded-full bg-red-500"></div> Cao (&gt;100tr)
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <div className="w-4 h-4 rounded-full bg-orange-500"></div> Trung bình (50-100tr)
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <div className="w-4 h-4 rounded-full bg-green-500"></div> Thấp (25-50tr)
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div> Rất thấp (&lt;25tr)
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <div className="w-4 h-4 rounded-full bg-cyan-400"></div> Rất cao (&gt;85)
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <div className="w-4 h-4 rounded-full bg-blue-400"></div> Cao (70-85)
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <div className="w-4 h-4 rounded-full bg-indigo-400"></div> Trung bình (50-70)
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <div className="w-4 h-4 rounded-full bg-purple-400"></div> Thấp (&lt;50)
            </div>
          </>
        )}
      </div>
    </div>
  );
}
