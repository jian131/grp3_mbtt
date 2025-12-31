'use client';

import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

export default function ValuationCard() {
  return (
    <div className="glass-card rounded-2xl p-8 relative overflow-hidden group">
      {/* Decorative Blur */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-cyan-500/20 transition-all duration-700"></div>

      <div className="flex justify-between items-start relative z-10">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            Định Giá AI
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
          </h3>
          <p className="text-sm text-gray-400">JFinder Estimation</p>
        </div>
        <div className="bg-cyan-500/10 text-cyan-400 px-4 py-1.5 rounded-full text-xs font-bold border border-cyan-500/20 tracking-wide uppercase">
          Giá Hợp Lý
        </div>
      </div>

      <div className="mt-6 mb-8 text-center">
        <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-300 tracking-tight">
          28
        </div>
        <p className="text-sm text-gray-400 mt-1">Triệu VNĐ / Tháng</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/5 border border-white/5 p-4 rounded-xl text-center">
          <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Thị Trường</div>
          <div className="text-sm font-semibold text-gray-200">25 - 30 Tr</div>
        </div>
        <div className="bg-white/5 border border-white/5 p-4 rounded-xl text-center">
          <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Tăng Trưởng</div>
          <div className="text-sm font-bold text-green-400 flex items-center justify-center gap-1">
            <TrendingUp className="w-3 h-3" /> +5.2%
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-6 border-t border-white/5">
        <div className="flex items-center gap-3 text-sm group/item">
          <div className="p-1 rounded bg-green-500/10 text-green-500 group-hover/item:bg-green-500/20 transition-colors">
            <CheckCircle className="w-3.5 h-3.5" />
          </div>
          <span className="text-gray-300">Lưu lượng người cao</span>
        </div>
        <div className="flex items-center gap-3 text-sm group/item">
          <div className="p-1 rounded bg-green-500/10 text-green-500 group-hover/item:bg-green-500/20 transition-colors">
            <CheckCircle className="w-3.5 h-3.5" />
          </div>
          <span className="text-gray-300">Mức độ cạnh tranh thấp</span>
        </div>
        <div className="flex items-center gap-3 text-sm group/item">
          <div className="p-1 rounded bg-amber-500/10 text-amber-500 group-hover/item:bg-amber-500/20 transition-colors">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <span className="text-gray-300">Biến động theo mùa</span>
        </div>
      </div>

      <button className="w-full mt-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 py-3 rounded-xl text-white text-sm font-bold shadow-lg shadow-cyan-900/20 transition-all hover:scale-[1.02]">
        Xem Báo Cáo Chi Tiết
      </button>
    </div>
  );
}
