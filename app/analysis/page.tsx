'use client';

import ValuationCard from '@/components/Analysis/ValuationCard';
import { Calculator, FileText, ArrowRight } from 'lucide-react';

export default function AnalysisPage() {
  return (
    <div className="min-h-screen pt-24 pb-20 px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="mb-8 relative">
          <div className="absolute top-0 left-0 w-20 h-20 bg-cyan-500/20 rounded-full blur-3xl"></div>
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-blue-200 mb-4">
            Phân Tích & Hỗ Trợ Ra Quyết Định
          </h1>
          <p className="text-gray-400 max-w-2xl text-lg font-light">
            Phân tích chuyên sâu bởi JFinder Intelligence. Xác thực vị trí kinh doanh của bạn bằng dữ liệu, không phải phỏng đoán.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
          {/* Left Column: Input */}
          <div className="space-y-8">
            <div className="glass-card rounded-2xl p-8 border-t border-white/10">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
                <div className="p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg">
                  <Calculator className="w-5 h-5 text-cyan-400" />
                </div>
                Thông Số Mặt Bằng
              </h2>
              <form className="space-y-5">
                <div className="group">
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider group-focus-within:text-cyan-400 transition-colors">Địa chỉ / Khu vực</label>
                  <input type="text" placeholder="VD: 123 Nguyễn Huệ, Q.1" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-cyan-500/50 focus:bg-white/10 outline-none transition-all placeholder:text-gray-600" />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="group">
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider group-focus-within:text-cyan-400 transition-colors">Diện tích (m²)</label>
                    <input type="number" placeholder="50" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-cyan-500/50 focus:bg-white/10 outline-none transition-all" />
                  </div>
                  <div className="group">
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider group-focus-within:text-cyan-400 transition-colors">Giá thuê (Tr.VNĐ)</label>
                    <input type="number" placeholder="25" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-cyan-500/50 focus:bg-white/10 outline-none transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Loại hình kinh doanh</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['F&B / Cà phê', 'Bán lẻ / Thời trang', 'Văn phòng', 'Showroom'].map(type => (
                      <label key={type} className="cursor-pointer">
                        <input type="radio" name="bizType" className="peer sr-only" />
                        <div className="text-center p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 peer-checked:bg-cyan-600/20 peer-checked:border-cyan-500 peer-checked:text-cyan-300 hover:bg-white/10 transition-all">
                          {type}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <button type="button" className="w-full mt-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 py-4 rounded-xl font-bold text-white shadow-lg shadow-cyan-900/40 transition-all hover:scale-[1.01] flex items-center justify-center gap-2">
                  Tạo Báo Cáo Phân Tích <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            </div>

            <div className="glass-card rounded-2xl p-8 hover:bg-white/10 transition-colors group cursor-pointer">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-3 text-white">
                <FileText className="w-6 h-6 text-blue-400" />
                Trợ Lý Pháp Lý AI
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-400 mb-2">Tải lên bản thảo hợp đồng. AI sẽ phát hiện điều khoản rủi ro ngay lập tức.</p>
                  <span className="text-xs text-cyan-500 font-bold group-hover:underline">Bắt đầu Rà soát →</span>
                </div>
                <div className="w-16 h-16 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center">
                  <span className="text-2xl text-gray-600">+</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Result */}
          <div className="space-y-8 animate-fade-in-up delay-200">
            <ValuationCard />

            <div className="glass-card rounded-2xl p-8 border border-white/10">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full"></span>
                Tính Điểm Hòa Vốn (Break-even)
              </h3>
              <div className="space-y-6">
                <div className="flex justify-between items-end border-b border-white/5 pb-4">
                  <span className="text-gray-400">Tổng chi phí mỗi tháng</span>
                  <span className="text-2xl font-bold text-white">40,000,000 <span className="text-sm text-gray-500 font-normal">VNĐ</span></span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-purple-500/10 to-transparent p-5 rounded-2xl border border-purple-500/20 text-center">
                    <div className="text-[10px] text-purple-300 uppercase font-black tracking-widest mb-1">Cần bán (Ngày)</div>
                    <div className="text-3xl font-black text-white">120</div>
                    <div className="text-xs text-gray-500 mt-1">Sản phẩm (TB 35k)</div>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-500/10 to-transparent p-5 rounded-2xl border border-cyan-500/20 text-center">
                    <div className="text-[10px] text-cyan-300 uppercase font-black tracking-widest mb-1">Mục tiêu ngày</div>
                    <div className="text-xl font-black text-white">4.8 Tr <span className="text-xs font-normal text-gray-400">/ngày</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
