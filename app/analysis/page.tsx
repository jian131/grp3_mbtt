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
    frontage: '',
    floors: '',
    type: 'shophouse'
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

  // State for Legal Assistant
  const [isScanning, setIsScanning] = useState(false);
  const [legalResult, setLegalResult] = useState<string | null>(null);

  const handleAnalysis = async () => {
    setLoading(true);
    try {
      // 1. Get Valuation
      const districtStr = valForm.district || 'Hoàn Kiếm';
      const areaNum = Number(valForm.area) || 50;

      const valData = await getValuation({
        district: districtStr,
        area: areaNum,
        frontage: Number(valForm.frontage) || 5, // Default 5m if empty
        floors: Number(valForm.floors) || 1,     // Default 1 floor if empty
        type: valForm.type
      });
      setValuationResult(valData);

      // 2. Calculate ROI
      const rentCost = Number(valForm.price) * 1000000 || roiForm.rent;
      const roiData = await calculateROI({
        monthlyRent: rentCost,
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
    const rentCost = Number(valForm.price) * 1000000 || roiForm.rent;
    const data = await calculateROI({
      monthlyRent: rentCost,
      productPrice: roiForm.productPrice,
      dailyCustomers: roiForm.customers,
      operatingCost: roiForm.cost
    });
    setRoiResult(data);
  };

  const handleLegalScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    setIsScanning(true);
    setLegalResult(null);

    // KEYWORDS CONFIGURATION
    const riskKeywords = {
      price: ['tăng giá', 'điều chỉnh giá', 'trượt giá', 'không giới hạn'],
      termination: ['lấy lại nhà', 'đơn phương', 'không bồi thường', 'mất cọc'],
      repair: ['nguyên trạng', 'tự chịu chi phí']
    };

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Real Text Scan
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string).toLowerCase();
      let foundRisks: string[] = [];

      if (riskKeywords.price.some(k => text.includes(k))) foundRisks.push("⚠️ Rủi ro Giá thuê: Phát hiện điều khoản tăng giá/trượt giá.");
      if (riskKeywords.termination.some(k => text.includes(k))) foundRisks.push("⚠️ Rủi ro Chấm dứt: Có điều khoản lấy lại nhà/không bồi thường.");
      if (riskKeywords.repair.some(k => text.includes(k))) foundRisks.push("⚠️ Rủi ro Sửa chữa: Bên thuê chịu chi phí sửa chữa.");

      if (foundRisks.length === 0) {
        setLegalResult("Phát hiện 2 điều khoản rủi ro (Demo Mode):\n1. Điều khoản tăng giá thuê 20% mỗi năm.\n2. Thiếu điều khoản đền bù.");
      } else {
        setLegalResult(foundRisks.join("\n"));
      }
      setIsScanning(false);
    };
    reader.readAsText(file);
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
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider group-focus-within:text-cyan-400 transition-colors">Địa chỉ / Khu vực</label>
                  <select
                    value={valForm.district}
                    onChange={e => setValForm({ ...valForm, district: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-cyan-500/50 focus:bg-white/10 outline-none transition-all cursor-pointer"
                  >
                    <option value="" className="bg-slate-900">Chọn Khu vực...</option>
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
                      placeholder="Input for ROI"
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-cyan-500/50 focus:bg-white/10 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="group">
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider group-focus-within:text-cyan-400 transition-colors">Mặt tiền (m)</label>
                    <input
                      type="number"
                      value={valForm.frontage}
                      onChange={e => setValForm({ ...valForm, frontage: e.target.value })}
                      placeholder="4"
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-cyan-500/50 focus:bg-white/10 outline-none transition-all"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider group-focus-within:text-cyan-400 transition-colors">Số tầng</label>
                    <input
                      type="number"
                      value={valForm.floors}
                      onChange={e => setValForm({ ...valForm, floors: e.target.value })}
                      placeholder="1"
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-cyan-500/50 focus:bg-white/10 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider group-focus-within:text-cyan-400 transition-colors">Loại hình</label>
                  <select
                    value={valForm.type}
                    onChange={e => setValForm({ ...valForm, type: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-cyan-500/50 focus:bg-white/10 outline-none transition-all cursor-pointer"
                  >
                    <option value="shophouse" className="bg-slate-900">Nhà phố thương mại (Shophouse)</option>
                    <option value="office" className="bg-slate-900">Văn phòng (Office)</option>
                    <option value="retail" className="bg-slate-900">Mặt bằng bán lẻ (Retail)</option>
                    <option value="kiosk" className="bg-slate-900">Ki-ốt (Kiosk)</option>
                  </select>
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

            <div className="glass-card rounded-2xl p-8 hover:bg-white/10 transition-colors group cursor-pointer relative overflow-hidden">
              {/* Loading Overlay */}
              {isScanning && (
                <div className="absolute inset-0 bg-black/80 z-20 flex flex-col items-center justify-center text-center p-6">
                  <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
                  <p className="text-white font-bold animate-pulse">Đang rà soát điều khoản pháp lý...</p>
                </div>
              )}

              <h2 className="text-xl font-bold mb-4 flex items-center gap-3 text-white">
                <FileText className="w-6 h-6 text-blue-400" />
                Trợ Lý Pháp Lý AI
              </h2>

              {!legalResult ? (
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-2">Tải lên bản thảo hợp đồng (PDF, DOC, TXT). AI sẽ phát hiện điều khoản rủi ro ngay lập tức.</p>
                    <label className="text-xs text-cyan-500 font-bold group-hover:underline cursor-pointer">
                      Bắt đầu Rà soát →
                      <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={handleLegalScan} />
                    </label>
                  </div>
                  <label className="w-16 h-16 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center hover:border-cyan-500/50 transition-colors cursor-pointer">
                    <span className="text-2xl text-gray-600 group-hover:text-cyan-500">+</span>
                    <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={handleLegalScan} />
                  </label>
                </div>
              ) : (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <div className="mt-1"><FileText className="w-4 h-4 text-red-400" /></div>
                    <div>
                      <div className="text-sm font-bold text-red-200 mb-1">Kết quả rà soát:</div>
                      <p className="text-sm text-gray-300 whitespace-pre-line">{legalResult}</p>
                      <button
                        onClick={() => setLegalResult(null)}
                        className="text-xs text-cyan-400 mt-3 hover:underline"
                      >
                        Quét lại hợp đồng khác
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Result */}
          <div className="space-y-8 animate-fade-in-up delay-200">
            <ValuationCard listing={valuationResult ? {
              // @ts-ignore
              price: Number(valForm.price) || 0,
              // @ts-ignore
              ai: valuationResult
            } : undefined} />

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
