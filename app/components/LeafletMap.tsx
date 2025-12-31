'use client';

import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LeafletMapProps {
  points: any[];
  onMarkerClick: (point: any) => void;
}

export default function LeafletMap({ points, onMarkerClick }: LeafletMapProps) {
  useEffect(() => {
    // Khởi tạo map
    const map = L.map('map').setView([21.0239, 105.8208], 13);

    // Thêm tile layer từ OpenStreetMap (MIỄN PHÍ - không cần API key)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Thêm markers
    const markers: L.Marker[] = [];
    points.forEach((point) => {
      if (point.lat && point.lng) {
        // Tạo custom icon với màu tím
        const customIcon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              width: 32px;
              height: 32px;
              background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
              border: 3px solid white;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 4px 10px rgba(139, 92, 246, 0.5);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                transform: rotate(45deg);
                color: white;
                font-weight: bold;
                font-size: 16px;
              ">📍</div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });

        const marker = L.marker([point.lat, point.lng], { icon: customIcon }).addTo(map);

        // Popup với theme tím
        const popupContent = `
          <div style="font-family: sans-serif; min-width: 200px;">
            ${point.image ? `<img src="${point.image}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />` : ''}
            <h3 style="margin: 0 0 8px 0; color: #8b5cf6; font-size: 16px; font-weight: bold;">${point.name}</h3>
            <p style="margin: 0 0 4px 0; color: #64748b; font-size: 13px;">${point.address}</p>
            <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 12px;">${point.desc || ''}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="color: #f59e0b; font-weight: bold; font-size: 15px;">💰 ${point.price} tr/th</span>
              <span style="color: #64748b; font-size: 12px;">${point.area || '-'} m²</span>
            </div>
            ${point.star ? `<div style="color: #f59e0b; font-size: 13px;">${'⭐'.repeat(Math.floor(point.star))} ${point.star}</div>` : ''}
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.on('click', () => {
          onMarkerClick(point);
        });

        markers.push(marker);
      }
    });

    // Fit bounds nếu có nhiều markers
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds(), { padding: [50, 50] });
    }

    // Cleanup khi unmount
    return () => {
      map.remove();
    };
  }, [points, onMarkerClick]);

  return (
    <div
      id="map"
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '12px',
        overflow: 'hidden'
      }}
    />
  );
}
