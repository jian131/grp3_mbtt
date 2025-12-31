'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import for Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

import 'leaflet/dist/leaflet.css';

// Interface for Heatmap Data Points
interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number; // 0-1 (Price or Demand)
  price: number;
}

// Mock Data
const MOCK_POINTS: HeatmapPoint[] = [
  { lat: 10.7769, lng: 106.7009, intensity: 0.9, price: 2500 }, // Bitexco
  { lat: 10.7721, lng: 106.6983, intensity: 0.8, price: 1800 }, // Ben Thanh
  { lat: 10.7796, lng: 106.6990, intensity: 0.7, price: 1500 }, // Notre Dame
  { lat: 10.7626, lng: 106.6823, intensity: 0.6, price: 1200 }, // District 5 border
  { lat: 10.7826, lng: 106.6963, intensity: 0.85, price: 2100 }, // Turtle Lake
];

export default function RentalHeatmap() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="w-full h-full bg-gray-100 animate-pulse rounded-xl" />;
  }

  const getColor = (intensity: number) => {
    return intensity > 0.8 ? '#ef4444' : // Red - High
      intensity > 0.6 ? '#f59e0b' : // Orange - Med-High
        intensity > 0.4 ? '#eab308' : // Yellow - Med
          '#22c55e';  // Green - Low/Good
  };

  return (
    <div className="w-full h-[600px] rounded-xl overflow-hidden shadow-2xl border border-white/20 relative z-0">
      {/* @ts-ignore */}
      <MapContainer
        center={[10.7769, 106.7009]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        {/* @ts-ignore */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {MOCK_POINTS.map((point, idx) => (
          // @ts-ignore
          <CircleMarker
            key={idx}
            center={[point.lat, point.lng]}
            pathOptions={{
              color: getColor(point.intensity),
              fillColor: getColor(point.intensity),
              fillOpacity: 0.6
            }}
            radius={20}
          >
            {/* @ts-ignore */}
            <Popup>
              <div className="p-2 text-center">
                <h3 className="font-bold text-lg text-gray-800">${point.price}</h3>
                <p className="text-sm text-gray-500">Rent per month</p>
                <div className="mt-2 text-xs font-semibold px-2 py-1 rounded bg-gray-100 inline-block">
                  Demand: {point.intensity * 100}%
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Legend Overlay */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-4 rounded-lg shadow-lg z-[1000] space-y-2">
        <h4 className="font-bold text-gray-800 text-sm mb-2">Rental Price Heatmap</h4>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-4 h-4 rounded-full bg-red-500"></div> High ($2000+)
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-4 h-4 rounded-full bg-orange-500"></div> Medium ($1500+)
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-4 h-4 rounded-full bg-green-500"></div> Low (&lt;$1200)
        </div>
      </div>
    </div>
  );
}
