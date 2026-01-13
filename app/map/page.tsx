'use client';

import { useEffect, useState } from 'react';
import RentalHeatmap from '@/components/Map/RentalHeatmap';
import { Filter, Layers, Map as MapIcon, ChevronDown, Satellite, Loader2 } from 'lucide-react';
import { fetchDistricts, District, Listing } from '@/lib/api';

export default function MapPage() {
  const [district, setDistrict] = useState<string>('');
  const [priceRange, setPriceRange] = useState<number>(200);
  const [listingType, setListingType] = useState<Listing['type'] | undefined>(undefined);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDistricts().then(data => {
      setDistricts(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="flex h-[calc(100vh-80px)] mt-20 relative overflow-hidden font-sans">

      {/* Sidebar Filters */}
      <div className="w-96 glass-panel border-r-0 flex flex-col gap-6 p-6 overflow-y-auto z-20 backdrop-blur-2xl bg-[#020617]/80">
        <h2 className="text-xl font-bold flex items-center gap-2 text-cyan-400">
          <Filter className="w-5 h-5" />
          Bộ Lọc Thông Minh
          {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
        </h2>


        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-300">Khoảng giá tối đa</span>
              <span className="text-cyan-400 font-bold">{priceRange} Triệu</span>
            </div>
            <input
              type="range"
              min="10"
              max="300"
              step="10"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>10 triệu.</span>
              <span>300 triệu.</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Khu vực (Quận/Huyện)</label>
            <div className="relative">
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-gray-200 appearance-none outline-none focus:border-cyan-500/50 transition-colors cursor-pointer hover:bg-white/10"
              >
                <option value="">Toàn Thành Phố</option>
                {districts.map(d => (
                  <option key={d.id} value={d.name}>{d.name} (~{d.avgPrice}tr)</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Loại mặt bằng</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'shophouse', label: 'Shophouse' },
                { id: 'kiosk', label: 'Kiosk' },
                { id: 'office', label: 'Văn phòng' },
                { id: 'retail', label: 'Cửa hàng' },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setListingType(listingType === type.id ? undefined : type.id as Listing['type'])}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${listingType === type.id
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/10">
            <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Data Source
            </label>
            <div className="glass-card p-3 rounded-lg text-xs text-gray-400">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-green-400 font-bold">n8n API Connected</span>
              </div>
              <p>Dữ liệu real-time từ Backend n8n</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative bg-slate-900 border-l border-white/10">
        <RentalHeatmap
          filterDistrict={district || undefined}
          filterType={listingType}
          filterPriceMax={priceRange}
        />

        {/* Floating Map Controls */}
        <div className="absolute top-6 left-6 z-[400] flex gap-2">
          <button className="glass-panel px-4 py-2 rounded-lg text-sm font-bold text-white hover:bg-white/10 flex items-center gap-2 transition-colors">
            <MapIcon className="w-4 h-4 text-cyan-400" /> Bản đồ
          </button>
          <button className="glass-panel px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/10 hover:text-white flex items-center gap-2 transition-colors">
            <Satellite className="w-4 h-4" /> Vệ tinh
          </button>
        </div>
      </div>
    </div>
  );
}
