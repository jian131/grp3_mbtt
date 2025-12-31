'use client';

import RentalHeatmap from '@/components/Map/RentalHeatmap';
import VisualSearch from '@/components/Search/VisualSearch';
import { Filter, Layers, Map as MapIcon, ChevronDown, Satellite } from 'lucide-react';

export default function MapPage() {
  return (
    <div className="flex h-[calc(100vh-80px)] mt-20 relative overflow-hidden font-sans">

      {/* Sidebar Filters - Glass Panel */}
      <div className="w-96 glass-panel border-r-0 border-r-white/10 flex flex-col gap-6 p-6 overflow-y-auto z-20 backdrop-blur-2xl bg-[#020617]/80">
        <h2 className="text-xl font-bold flex items-center gap-2 text-cyan-400">
          <Filter className="w-5 h-5" />
          Bộ Lọc Thông Minh
        </h2>

        {/* Visual Search Widget */}
        <VisualSearch />

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-300">Khoảng giá</span>
              <span className="text-cyan-400 font-bold">5Tr - 100Tr+</span>
            </div>
            <input type="range" min="5" max="100" className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>5 triệu</span>
              <span>100 triệu+</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Bán kính tìm kiếm</label>
            <div className="relative">
              <select className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-gray-200 appearance-none outline-none focus:border-cyan-500/50 transition-colors cursor-pointer hover:bg-white/10">
                <option>500m (Đi bộ được)</option>
                <option>1km (Khu vực lân cận)</option>
                <option>3km (Cấp Quận)</option>
                <option>5km (Toàn thành phố)</option>
              </select>
              <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/10">
            <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Lớp Dữ Liệu Môi Trường
            </label>
            <div className="space-y-3">
              {[
                { label: 'Trường học / Đại học', color: 'text-blue-400' },
                { label: 'Tòa nhà Văn phòng', color: 'text-indigo-400' },
                { label: 'Khu dân cư mật độ cao', color: 'text-pink-400' },
                { label: 'Đối thủ cạnh tranh', color: 'text-red-400' }
              ].map((item, idx) => (
                <label key={idx} className="flex items-center gap-3 text-sm text-gray-400 hover:text-white cursor-pointer group select-none">
                  <div className="relative flex items-center">
                    <input type="checkbox" className="peer w-5 h-5 appearance-none border border-gray-600 rounded bg-transparent checked:bg-cyan-600 checked:border-cyan-500 transition-all" defaultChecked={idx === 0} />
                    <svg className="absolute w-3.5 h-3.5 text-white left-1 opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <span className="group-hover:translate-x-1 transition-transform">{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative bg-slate-900 border-l border-white/10">
        <RentalHeatmap />

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
