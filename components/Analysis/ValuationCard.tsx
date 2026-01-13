'use client';

import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { Listing } from '@/app/data/mockListings';

interface ValuationCardProps {
  listing?: Listing;
}

export default function ValuationCard({ listing }: ValuationCardProps) {
  // Mock data fallback if no listing provided.
  const data = listing ? {
    price: listing.price,
    suggestedPrice: listing.ai.suggestedPrice,
    growth: listing.ai.growthForecast,
    label: listing.ai.priceLabel === 'cheap' ? 'Giá Rẻ' : listing.ai.priceLabel === 'fair' ? 'Giá Hợp Lý' : 'Giá Cao',
    score: listing.ai.potentialScore
  } : {
    price: 35,
    suggestedPrice: 32,
    growth: 5.2,
    label: 'Giá Hợp Lý',
    score: 78
  };

  const marketRange = `${Math.round(data.suggestedPrice * 0.9)} - ${Math.round(data.suggestedPrice * 1.1)} Tr`;

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
        <div className={`px-4 py-1.5 rounded-full text-xs font-bold border tracking-wide uppercase ${data.label === 'Giá Rẻ' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
            data.label === 'Giá Cao' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
              'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
          }`}>
          {data.label}
        </div>
      </div>

      <div className="mt-6 mb-8 text-center">
        <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-300 tracking-tight">
          {data.suggestedPrice}
        </div>
        <p className="text-sm text-gray-400 mt-1">Triệu VNĐ / Tháng (Gợi ý)</p>
        <p className="text-xs text-gray-500 mt-1">Giá hiện tại: {data.price} Tr</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/5 border border-white/5 p-4 rounded-xl text-center">
          <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Thị Trường</div>
          <div className="text-sm font-semibold text-gray-200">{marketRange}</div>
        </div>
        <div className="bg-white/5 border border-white/5 p-4 rounded-xl text-center">
          <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Tăng Trưởng</div>
          <div className="text-sm font-bold text-green-400 flex items-center justify-center gap-1">
            <TrendingUp className="w-3 h-3" /> +{data.growth}%
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-6 border-t border-white/5">
        <div className="flex items-center gap-3 text-sm group/item">
          <div className="p-1 rounded bg-green-500/10 text-green-500 group-hover/item:bg-green-500/20 transition-colors">
            <CheckCircle className="w-3.5 h-3.5" />
          </div>
          <span className="text-gray-300">Điểm tiềm năng: <span className="font-bold text-white">{data.score}/100</span></span>
        </div>
        <div className="flex items-center gap-3 text-sm group/item">
          <div className="p-1 rounded bg-green-500/10 text-green-500 group-hover/item:bg-green-500/20 transition-colors">
            <CheckCircle className="w-3.5 h-3.5" />
          </div>
          <span className="text-gray-300">Mức độ cạnh tranh trung bình</span>
        </div>
        <div className="flex items-center gap-3 text-sm group/item">
          <div className="p-1 rounded bg-amber-500/10 text-amber-500 group-hover/item:bg-amber-500/20 transition-colors">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <span className="text-gray-300">Biến động theo mùa.</span>
        </div>
      </div>

      <button className="w-full mt-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 py-3 rounded-xl text-white text-sm font-bold shadow-lg shadow-cyan-900/20 transition-all hover:scale-[1.02]">
        Xem Báo Cáo Chi Tiết.
      </button>
    </div>
  );
}
