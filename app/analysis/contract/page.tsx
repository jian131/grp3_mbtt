'use client';

import { useState, useRef } from 'react';
import { FileText, Upload, AlertTriangle, CheckCircle, Loader2, Download, Clipboard, X } from 'lucide-react';

interface RiskItem {
  title: string;
  severity: 'high' | 'medium' | 'low';
  matched_clause: string;
  recommendation: string;
  clause_type: string;
}

interface ReviewResult {
  success: boolean;
  risk_score: number;
  risk_level: 'high' | 'medium' | 'low';
  risk_items: RiskItem[];
  summary: string;
  total_clauses_checked: number;
  processing_time_ms: number;
}

const RISK_COLORS = {
  high: 'text-red-400 bg-red-500/10 border-red-500/30',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  low: 'text-green-400 bg-green-500/10 border-green-500/30'
};

const RISK_ICONS = {
  high: '🔴',
  medium: '🟡',
  low: '🟢'
};

export default function ContractReviewPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'file' | 'text'>('text');
  const [textInput, setTextInput] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      // Read file content
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setTextInput(content);
      };
      reader.readAsText(file);
    }
  };

  const handleReview = async () => {
    if (!textInput.trim()) {
      setError('Vui lòng nhập nội dung hợp đồng hoặc tải file lên.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Get API URL from env or use proxy
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const endpoint = `${apiUrl}/webhook/jfinder/contract/review`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          content: textInput,
          filename: fileName || 'pasted_text.txt'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Contract review error:', err);
      setError(`Lỗi kết nối: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setTextInput('');
    setFileName(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadReport = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract_review_${Date.now()}.json`;
    a.click();
  };

  const handlePasteSample = () => {
    setTextInput(`HỢP ĐỒNG THUÊ MẶT BẰNG KINH DOANH

Điều 1. Đối tượng hợp đồng
Bên A cho Bên B thuê mặt bằng kinh doanh tại địa chỉ: 123 Nguyễn Huệ, Quận 1, TP.HCM
Diện tích: 50m2

Điều 2. Thời hạn thuê
- Thời hạn thuê: 2 năm kể từ ngày ký hợp đồng.
- Bên A có quyền đơn phương chấm dứt hợp đồng bất cứ lúc nào mà không cần thông báo trước.

Điều 3. Giá thuê
- Giá thuê: 40.000.000 VNĐ/tháng
- Bên A được quyền tăng giá thuê 50% sau mỗi 6 tháng mà không cần sự đồng ý của Bên B.
- Bên B phải đặt cọc 6 tháng tiền thuê.

Điều 4. Điều khoản phạt
- Nếu Bên B chấm dứt hợp đồng trước hạn, Bên B mất toàn bộ tiền cọc và phải bồi thường 12 tháng tiền thuê.
- Bên B không được hoàn lại tiền cọc trong mọi trường hợp chấm dứt hợp đồng.

Điều 5. Nghĩa vụ các bên
- Bên B phải tự chịu mọi chi phí sửa chữa, bảo trì mặt bằng.
- Bên B không được phép khiếu nại về tình trạng mặt bằng.

Điều 6. Bất khả kháng
- Trong trường hợp bất khả kháng, Bên B vẫn phải thanh toán đầy đủ tiền thuê.
`);
    setFileName('sample_contract.txt');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <FileText className="w-8 h-8 text-cyan-400" />
            AI Legal Guard
          </h1>
          <p className="text-gray-400">Phát hiện điều khoản rủi ro trong hợp đồng thuê mặt bằng</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="glass-card rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Nội dung hợp đồng</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setInputMode('text')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${inputMode === 'text' ? 'bg-cyan-600 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                >
                  <Clipboard className="w-4 h-4 inline mr-1" />
                  Paste
                </button>
                <button
                  onClick={() => setInputMode('file')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${inputMode === 'file' ? 'bg-cyan-600 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                >
                  <Upload className="w-4 h-4 inline mr-1" />
                  Upload
                </button>
              </div>
            </div>

            {inputMode === 'file' ? (
              <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-cyan-500/50 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.doc,.docx,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  Chọn file (.txt, .doc, .pdf)
                </button>
                {fileName && (
                  <p className="mt-2 text-sm text-green-400">✓ {fileName}</p>
                )}
                <p className="mt-2 text-xs text-gray-500">Hoặc kéo thả file vào đây</p>
              </div>
            ) : (
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Dán nội dung hợp đồng vào đây..."
                className="w-full h-64 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:border-cyan-500 outline-none resize-none text-sm"
              />
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={handlePasteSample}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg text-sm transition-colors"
              >
                📋 Dùng mẫu
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg text-sm transition-colors"
              >
                <X className="w-4 h-4 inline mr-1" />
                Xóa
              </button>
              <button
                onClick={handleReview}
                disabled={loading || !textInput.trim()}
                className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 py-2 rounded-lg font-bold text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang phân tích...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    Rà soát ngay
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Result Section */}
          <div className="glass-card rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Kết quả phân tích</h2>
              {result && (
                <button
                  onClick={handleDownloadReport}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg text-sm transition-colors"
                >
                  <Download className="w-4 h-4 inline mr-1" />
                  Tải JSON
                </button>
              )}
            </div>

            {!result && !loading && (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Nhập nội dung hợp đồng và bấm "Rà soát ngay"</p>
                </div>
              </div>
            )}

            {loading && (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 mx-auto mb-4 text-cyan-400 animate-spin" />
                  <p className="text-gray-400">AI đang phân tích hợp đồng...</p>
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {/* Risk Score */}
                <div className={`p-4 rounded-xl border ${RISK_COLORS[result.risk_level]}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-70">Điểm rủi ro</p>
                      <p className="text-3xl font-bold">{result.risk_score}/100</p>
                    </div>
                    <div className="text-4xl">
                      {result.risk_level === 'high' ? '⚠️' : result.risk_level === 'medium' ? '⚡' : '✅'}
                    </div>
                  </div>
                  <p className="mt-2 text-sm opacity-80">{result.summary}</p>
                </div>

                {/* Risk Items */}
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {result.risk_items.map((item, idx) => (
                    <div key={idx} className={`p-3 rounded-lg border ${RISK_COLORS[item.severity]}`}>
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{RISK_ICONS[item.severity]}</span>
                        <div className="flex-1">
                          <p className="font-medium">{item.title}</p>
                          <p className="text-xs opacity-70 mt-1 italic">"{item.matched_clause}"</p>
                          <p className="text-xs mt-2">💡 {item.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {result.risk_items.length === 0 && (
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-center">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                    <p>Không phát hiện điều khoản rủi ro cao!</p>
                  </div>
                )}

                <p className="text-xs text-gray-500 text-center">
                  Đã kiểm tra {result.total_clauses_checked} quy tắc trong {result.processing_time_ms}ms
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
