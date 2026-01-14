'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { fetchListings, Listing } from '@/lib/api';

// Dynamic import for Leaflet components
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then((mod) => mod.CircleMarker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });

type HeatmapMode = 'price' | 'potential';

interface Props {
  filterDistrict?: string;
  filterType?: Listing['type'];
  filterPriceMax?: number;
  listings?: Listing[]; // Nhận listings từ parent nếu có
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

export default function RentalHeatmap({ filterDistrict, filterType, filterPriceMax, listings: externalListings }: Props) {
  const [isClient, setIsClient] = useState(false);
  const [mode, setMode] = useState<HeatmapMode>('price');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Nếu có external listings (từ Search page), dùng luôn
    if (externalListings) {
      setListings(externalListings);
      setLoading(false);
      return;
    }

    // Nếu không, tự fetch
    async function loadData() {
      setLoading(true);
      const data = await fetchListings({
        district: filterDistrict,
        type: filterType,
        maxPrice: filterPriceMax,
        limit: 500,
      });
      setListings(data);
      setLoading(false);
    }
    loadData();
  }, [filterDistrict, filterType, filterPriceMax, externalListings]);

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
      ? getPriceColor(listing.price)
      : getPotentialColor(listing.ai?.potentialScore || 50);
  };

  const getRadius = (listing: Listing) => {
    const base = mode === 'price' ? listing.views / 200 : (listing.ai?.potentialScore || 50) / 10;
    return Math.max(5, Math.min(15, base));
  };

  return (
    <div className="w-full h-[600px] rounded-xl overflow-hidden shadow-2xl border border-white/10 relative z-0">
      {/* Mode Toggle */}
      <div className="absolute top-4 left-4 z-[1000] flex gap-2">
        <button
          onClick={() => setMode('price')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'price' ? 'bg-cyan-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
        >
          💰 Price Map
        </button>
        <button
          onClick={() => setMode('potential')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'potential' ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
        >
          🎯 Potential Map
        </button>
      </div>

      {/* Stats Badge */}
      <div className="absolute top-4 right-20 z-[1000] glass-panel px-3 py-1.5 rounded-full">
        <span className="text-xs text-cyan-400 font-bold">
          {loading ? 'Loading...' : `${listings.length} listings (n8n API)`}
        </span>
      </div>

      {/* @ts-ignore */}
      <MapContainer
        center={[21.0285, 105.8542]}
        zoom={12}
        style={{ height: '100%', width: '100%', background: '#020617' }}
        className="z-0"
      >
        {/* @ts-ignore */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {listings.map((listing) => (
          // @ts-ignore
          <CircleMarker
            key={listing.id}
            center={[listing.latitude, listing.longitude]}
            pathOptions={{
              color: getColor(listing),
              fillColor: getColor(listing),
              fillOpacity: 0.6,
              weight: 1
            }}
            radius={getRadius(listing)}
          >
            {/* @ts-ignore */}
            <Popup>
              <div className="p-3 min-w-[220px] bg-slate-900 text-white rounded-lg">
                <h3 className="font-bold text-sm text-cyan-400 mb-2 line-clamp-2">{listing.name}</h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Giá thuê:</span>
                    <span className="font-bold text-green-400">{listing.price} tr/tháng</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Diện tích:</span>
                    <span>{listing.area} m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">AI Score:</span>
                    <span className="font-bold text-purple-400">{listing.ai?.potentialScore || 'N/A'}/100</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-white/10 text-xs text-gray-400">
                  📍 {listing.district}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
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
