'use client';

import { useState, useEffect } from 'react';
import { BarChart3, PieChart, TrendingUp, Loader2, ExternalLink } from 'lucide-react';

export default function BIDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Superset Dashboard URL (sau khi tạo dashboard trong Superset)
  // Để lấy URL này:
  // 1. Truy cập http://localhost:8088
  // 2. Tạo Dashboard
  // 3. Click "Share" -> Copy Permalink
  const SUPERSET_URL = 'http://localhost:8088';

  useEffect(() => {
    // Check if Superset is accessible
    fetch(SUPERSET_URL)
      .then(() => {
        setLoading(false);
        setError(false);
      })
      .catch(() => {
        setLoading(false);
        setError(true);
      });
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-[1920px] mx-auto">

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-blue-200 mb-4">
            BI Dashboard - Apache Superset
          </h1>
          <div className="flex justify-between items-center">
            <p className="text-gray-400 text-lg">
              Dashboard phân tích chuyên sâu với công cụ BI chuyên nghiệp
            </p>
            <a
              href={SUPERSET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Mở Superset Toàn Màn Hình
            </a>
          </div>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { icon: BarChart3, label: 'Biểu đồ Tùy Chỉnhh', value: 'Drag & Drop', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
            { icon: PieChart, label: 'Nguồn Dữ Liệu', value: 'Google Sheets', color: 'text-green-400', bg: 'bg-green-500/10' },
            { icon: TrendingUp, label: 'Real-time Update', value: 'Auto Refresh', color: 'text-purple-400', bg: 'bg-purple-500/10' },
          ].map((stat, idx) => (
            <div key={idx} className="glass-card p-6 rounded-2xl flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">{stat.label}</div>
                <div className="text-lg font-bold text-white">{stat.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Superset Iframe */}
        <div className="glass-card rounded-2xl p-2 border border-white/10 relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-10">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Đang kết nối Superset...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-slate-900 rounded-xl p-16 text-center">
              <div className="text-red-400 text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-white mb-2">Không thể kết nối Superset</h3>
              <p className="text-gray-400 mb-6">
                Hãy đảm bảo Docker container Superset đang chạy.
              </p>
              <div className="bg-slate-800 rounded-lg p-4 text-left max-w-md mx-auto">
                <p className="text-sm text-gray-300 font-mono mb-2">Chạy lệnh sau trong terminal:</p>
                <code className="text-xs text-cyan-400">docker-compose up -d</code>
              </div>
              <a
                href={SUPERSET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-6 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white font-bold transition-colors"
              >
                Thử Mở Trực Tiếp
              </a>
            </div>
          )}

          {!loading && !error && (
            <div className="relative">
              <iframe
                src={`${SUPERSET_URL}/superset/welcome/`}
                className="w-full h-[800px] rounded-xl bg-white"
                title="Apache Superset Dashboard"
                onLoad={() => setLoading(false)}
              />
              <div className="absolute bottom-4 right-4 glass-panel px-3 py-2 rounded-lg">
                <span className="text-xs text-cyan-400 font-bold flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Superset Live
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Setup Guide */}
        <div className="mt-8 glass-card rounded-2xl p-8 border border-white/10">
          <h3 className="text-xl font-bold text-white mb-4">🚀 Hướng Dẫn Tạo Dashboard</h3>
          <ol className="space-y-3 text-gray-300">
            <li className="flex gap-3">
              <span className="font-bold text-cyan-400">1.</span>
              <span>Truy cập <a href={SUPERSET_URL} target="_blank" className="text-cyan-400 hover:underline">{SUPERSET_URL}</a> (Đăng nhập: admin / admin)</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-cyan-400">2.</span>
              <span>Click <strong>Settings → Database Connections</strong> → Kết nối <strong>Google Sheets</strong> (driver đã cài sẵn)</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-cyan-400">3.</span>
              <span>Tạo <strong>Dataset</strong> từ Google Sheets URL hoặc CSV đã upload</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-cyan-400">4.</span>
              <span>Tạo <strong>Charts</strong> (Bar, Pie, Line, Heatmap...)</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-cyan-400">5.</span>
              <span>Tạo <strong>Dashboard</strong> → Kéo thả charts vào</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-cyan-400">6.</span>
              <span>Copy <strong>Dashboard URL</strong> và cập nhật vào code (<code className="text-xs bg-slate-800 px-2 py-1 rounded">app/bi-dashboard/page.tsx</code>)</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
