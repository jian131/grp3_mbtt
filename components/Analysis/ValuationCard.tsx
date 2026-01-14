'use client';

import { useState } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { Listing } from '@/app/data/mockListings';

interface ValuationCardProps {
  listing?: Listing;
}

export default function ValuationCard({ listing }: ValuationCardProps) {
  const [showDetail, setShowDetail] = useState(false);

  // Mock data fallback if no listing provided
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
          <span className="text-gray-300">Biến động theo mùa</span>
        </div>
      </div>

      <button
        onClick={() => setShowDetail(true)}
        className="w-full mt-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 py-3 rounded-xl text-white text-sm font-bold shadow-lg shadow-cyan-900/20 transition-all hover:scale-[1.02]"
      >
        Xem Báo Cáo Chi Tiết
      </button>

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative animate-slide-up">
            <button
              onClick={() => setShowDetail(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="text-cyan-400" />
              Chi Tiết Định Giá
            </h3>

            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-sm text-gray-400 mb-1">Giá trị ước tính</div>
                <div className="text-3xl font-black text-white">{data.suggestedPrice} <span className="text-lg font-normal text-gray-400">Tr/tháng</span></div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Các Yếu Tố Ảnh Hưởng</h4>
                <div className="space-y-2">
                  {/* @ts-ignore */}
                  {listing?.ai?.factors?.map((f: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-white/5 text-sm">
                      <span className="text-gray-300">{f.name}</span>
                      <div className="text-right">
                        <div className={`font-bold ${f.impact === 'positive' || f.impact === 'high' ? 'text-green-400' : 'text-yellow-400'}`}>
                          {f.note}
                        </div>
                      </div>
                    </div>
                  )) || (
                      <div className="text-gray-500 italic text-sm">Chưa có dữ liệu chi tiết cho bất động sản này.</div>
                    )}
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 mt-4">
                <p className="text-xs text-center text-gray-500">
                  Báo cáo được tạo tự động bởi JFinder AI Valuation Engine dựa trên dữ liệu thị trường thực tế.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
