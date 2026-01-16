'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { fetchListings, Listing } from '@/lib/api';
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

type HeatmapMode = 'price' | 'potential';

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
  const mapRef = useRef<L.Map | null>(null);
  const lastFocusKeyRef = useRef<string>('');

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (externalListings) {
      // Filter only valid geo coordinates
      const validListings = externalListings.filter(l =>
        isValidVietnamCoords(l.lat || l.latitude || 0, l.lon || l.longitude || 0)
      );
      setListings(validListings);
      setLoading(false);
      return;
    }

    async function loadData() {
      setLoading(true);
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
