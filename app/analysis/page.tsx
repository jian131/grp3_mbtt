'use client';

import { useState } from 'react';
import ValuationCard from '@/components/Analysis/ValuationCard';
import { Calculator, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { calculateROI, getValuation } from '@/lib/api';

export default function AnalysisPage() {
  const [loading, setLoading] = useState(false);

  // State for Valuation Form
  const [valForm, setValForm] = useState({
    district: '',
    area: '',
    price: '',
    type: 'F&B / Cà phê'
  });
  const [valuationResult, setValuationResult] = useState<any>(null);

  // State for ROI Calculator
  const [roiForm, setRoiForm] = useState({
    rent: 40000000,
    productPrice: 35000,
    customers: 120,
    cost: 15000000
  });
  const [roiResult, setRoiResult] = useState<any>(null);

  const handleAnalysis = async () => {
    setLoading(true);
    try {
      // 1. Get Valuation
      // Simple parsing district from address string or default to Hoan Kiem for demo
      const districtStr = valForm.district || 'Hoàn Kiếm';
      const areaNum = Number(valForm.area) || 50;

      const valData = await getValuation({
        district: districtStr,
        area: areaNum,
        frontage: 5,
        floors: 1,
        type: 'shophouse'
      });
      setValuationResult(valData);

      // 2. Calculate ROI (Initial calculation based on form defaults)
      const roiData = await calculateROI({
        monthlyRent: Number(valForm.price) * 1000000 || roiForm.rent,
        productPrice: roiForm.productPrice,
        dailyCustomers: roiForm.customers,
        operatingCost: roiForm.cost
      });
      setRoiResult(roiData);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateROI = async () => {
    const data = await calculateROI({
      monthlyRent: Number(valForm.price) * 1000000 || roiForm.rent,
      productPrice: roiForm.productPrice,
      dailyCustomers: roiForm.customers,
      operatingCost: roiForm.cost
    });
    setRoiResult(data);
  };

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
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider group-focus-within:text-cyan-400 transition-colors">Khu vực (Quận)</label>
                  <select
                    value={valForm.district}
                    onChange={e => setValForm({ ...valForm, district: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-cyan-500/50 focus:bg-white/10 outline-none transition-all cursor-pointer"
                  >
                    <option value="" className="bg-slate-900">Chọn Quận...</option>
                    {['Hoàn Kiếm', 'Ba Đình', 'Đống Đa', 'Hai Bà Trưng', 'Cầu Giấy', 'Tây Hồ'].map(d => (
                      <option key={d} value={d} className="bg-slate-900">{d}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="group">
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider group-focus-within:text-cyan-400 transition-colors">Diện tích (m²)</label>
                    <input
                      type="number"
                      value={valForm.area}
                      onChange={e => setValForm({ ...valForm, area: e.target.value })}
                      placeholder="50"
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-cyan-500/50 focus:bg-white/10 outline-none transition-all"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider group-focus-within:text-cyan-400 transition-colors">Giá thuê (Tr.VNĐ)</label>
                    <input
                      type="number"
                      value={valForm.price}
                      onChange={e => setValForm({ ...valForm, price: e.target.value })}
                      placeholder="25"
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-cyan-500/50 focus:bg-white/10 outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAnalysis}
                  disabled={loading}
                  className="w-full mt-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 py-4 rounded-xl font-bold text-white shadow-lg shadow-cyan-900/40 transition-all hover:scale-[1.01] flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <>Tạo Báo Cáo Phân Tích <ArrowRight className="w-5 h-5" /></>}
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
                <div className="w-16 h-16 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center hover:border-cyan-500/50 transition-colors">
                  <span className="text-2xl text-gray-600 group-hover:text-cyan-500">+</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Result */}
          <div className="space-y-8 animate-fade-in-up delay-200">
            {/* Valuation Card - Dynamic Data */}
            <ValuationCard listing={valuationResult ? {
              // @ts-ignore
              price: Number(valForm.price) || 0,
              // @ts-ignore
              ai: valuationResult
            } : undefined} />

            {/* ROI Calculator */}
            <div className="glass-card rounded-2xl p-8 border border-white/10">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full"></span>
                Tính Điểm Hòa Vốn (Break-even)
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Giá bán SP (VNĐ)</label>
                  <input
                    type="number"
                    value={roiForm.productPrice}
                    onChange={e => { setRoiForm({ ...roiForm, productPrice: Number(e.target.value) }); }}
                    onBlur={updateROI}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Khách/Ngày</label>
                  <input
                    type="number"
                    value={roiForm.customers}
                    onChange={e => { setRoiForm({ ...roiForm, customers: Number(e.target.value) }); }}
                    onBlur={updateROI}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-end border-b border-white/5 pb-4">
                  <span className="text-gray-400">Tổng chi phí mỗi tháng</span>
                  <span className="text-2xl font-bold text-white">
                    {roiResult ? (roiResult.totalMonthlyCost / 1000000).toFixed(1) : ((roiForm.rent + roiForm.cost) / 1000000).toFixed(1)}
                    <span className="text-sm text-gray-500 font-normal ml-1">Tr VNĐ</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-purple-500/10 to-transparent p-5 rounded-2xl border border-purple-500/20 text-center">
                    <div className="text-[10px] text-purple-300 uppercase font-black tracking-widest mb-1">Cần bán (Ngày)</div>
                    <div className="text-3xl font-black text-white">
                      {roiResult ? Math.ceil(roiResult.breakEvenDays) : '-'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Sản phẩm để hòa vốn</div>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-500/10 to-transparent p-5 rounded-2xl border border-cyan-500/20 text-center">
                    <div className="text-[10px] text-cyan-300 uppercase font-black tracking-widest mb-1">Mục tiêu ngày</div>
                    <div className="text-xl font-black text-white">
                      {roiResult ? (roiResult.monthlyRevenue / 30 / 1000000).toFixed(1) : '-'} Tr
                      <span className="text-xs font-normal text-gray-400">/ngày</span>
                    </div>
                  </div>
                </div>

                {roiResult && (
                  <div className={`text-center text-sm font-bold p-2 rounded-lg ${roiResult.monthlyProfit > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {roiResult.monthlyProfit > 0
                      ? `Lãi dự kiến: ${(roiResult.monthlyProfit / 1000000).toFixed(1)} Tr/tháng`
                      : `Lỗ dự kiến: ${(Math.abs(roiResult.monthlyProfit) / 1000000).toFixed(1)} Tr/tháng`
                    }
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
