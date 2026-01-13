'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Users, Eye, ArrowUpRight, Loader2 } from 'lucide-react';
import { getValuation, fetchStats } from '@/lib/api';

export default function LandlordPage() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>({ totalViews: 12500, total: 1000, avgPrice: 67.5 });
  const [formData, setFormData] = useState({
    address: 'Cầu Giấy',
    area: 80,
    frontage: 5,
    floors: 2,
    type: 'shophouse'
  });
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetchStats().then(data => {
      if (data) setStats({ ...stats, ...data, totalViews: data.total * 15 });
    });
  }, []);

  const handleValuation = async () => {
    setLoading(true);
    try {
      // Giả lập lấy quận từ địa chỉ (trong thực tế sẽ dùng Google Maps API)
      const districtMap: Record<string, string> = {
        'Cầu Giấy': 'Cầu Giấy', 'Hoàn Kiếm': 'Hoàn Kiếm', 'Ba Đình': 'Ba Đình',
        'Đống Đa': 'Đống Đa', 'Tây Hồ': 'Tây Hồ', 'Thanh Xuân': 'Thanh Xuân',
        'Hai Bà Trưng': 'Hai Bà Trưng', 'Hoàng Mai': 'Hoàng Mai', 'Long Biên': 'Long Biên',
        'Nam Từ Liêm': 'Nam Từ Liêm', 'Bắc Từ Liêm': 'Bắc Từ Liêm', 'Hà Đông': 'Hà Đông'
      };

      const district = Object.keys(districtMap).find(d => formData.address.includes(d)) || 'Cầu Giấy';

      const data = await getValuation({
        district,
        area: formData.area,
        frontage: formData.frontage,
        floors: formData.floors,
        type: formData.type
      });

      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 text-center">
          <div className="inline-block px-3 py-1 bg-green-900/30 border border-green-500/30 rounded-full text-green-400 text-xs font-bold mb-4">
            KÊNH CHỦ NHÀ
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-2">
            Tối Đa Hóa Giá Trị Tài Sản
          </h1>
          <p className="text-gray-400">Định giá & quản lý thông minh với Dữ liệu JFinder.</p>
        </header>

        {/* Dashboard KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: 'Lượt Xem Tin', val: stats.totalViews.toLocaleString(), sub: '30 ngày qua', icon: Eye, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { label: 'Khách Quan Tâm', val: Math.round(stats.total / 3).toLocaleString(), sub: 'Độ quan tâm cao', icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
            { label: 'Tiềm Năng Tăng Giá', val: '+12.5%', sub: 'So với năm ngoái', icon: ArrowUpRight, color: 'text-green-400', bg: 'bg-green-500/10' }
          ].map((stat, idx) => (
            <div key={idx} className="glass-card p-6 rounded-2xl flex items-center gap-5 hover:bg-white/5 transition-colors">
              <div className={`p-4 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <div className="text-3xl font-bold text-white leading-none mb-1">{stat.val}</div>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="glass-card rounded-3xl p-1 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="bg-[#0f172a]/80 backdrop-blur-xl rounded-[20px] p-8 md:p-12">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-white">
              <span className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white shadow-lg shadow-cyan-500/20">
                <DollarSign className="w-5 h-5" />
              </span>
              Công Cụ Định Giá Thông Minh (AI Valuation)
            </h2>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Khu vực (Quận)</label>
                  <select
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-white/5 border-b border-white/10 focus:border-cyan-500 p-3 text-white outline-none transition-all cursor-pointer"
                  >
                    {['Cầu Giấy', 'Hoàn Kiếm', 'Ba Đình', 'Đống Đa', 'Tây Hồ', 'Thanh Xuân', 'Hai Bà Trưng', 'Hoàng Mai', 'Long Biên', 'Nam Từ Liêm', 'Hà Đông'].map(d => (
                      <option key={d} value={d} className="bg-slate-900">{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Diện Tích (m²)</label>
                  <input
                    type="number"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: Number(e.target.value) })}
                    className="w-full bg-white/5 border-b border-white/10 focus:border-cyan-500 p-3 text-white outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Mặt Tiền (m)</label>
                  <input
                    type="number"
                    value={formData.frontage}
                    onChange={(e) => setFormData({ ...formData, frontage: Number(e.target.value) })}
                    className="w-full bg-white/5 border-b border-white/10 focus:border-cyan-500 p-3 text-white outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Số Tầng</label>
                  <input
                    type="number"
                    value={formData.floors}
                    onChange={(e) => setFormData({ ...formData, floors: Number(e.target.value) })}
                    className="w-full bg-white/5 border-b border-white/10 focus:border-cyan-500 p-3 text-white outline-none transition-all"
                  />
                </div>
              </div>

              <div className="p-8 rounded-2xl bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-cyan-500/30 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex-1">
                  <div className="text-xs text-cyan-400 font-bold uppercase tracking-widest mb-1">Mức Giá AI Gợi Ý</div>
                  {result ? (
                    <div className="animate-fade-in-up">
                      <div className="text-3xl md:text-5xl font-black text-white tracking-tight flex items-baseline gap-2">
                        {result.priceRange.min} - {result.priceRange.max} <span className="text-lg font-medium text-gray-400">Triệu / Tháng</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-2">
                        Độ tin cậy: <span className="text-green-400 font-bold">{result.riskLevel === 'low' ? 'Cao' : 'Trung bình'}</span> •
                        Điểm tiềm năng: <span className="text-cyan-400 font-bold">{result.potentialScore}/100</span>
                      </p>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-lg italic">
                      Nhập thông tin và bấm nút để định giá...
                    </div>
                  )}
                </div>
                <button
                  onClick={handleValuation}
                  disabled={loading}
                  type="button"
                  className="px-8 py-4 bg-white text-black rounded-xl font-bold hover:bg-cyan-50 transition-colors shadow-xl text-nowrap flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Đang Tính Toán...' : 'Định Giá Ngay'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
