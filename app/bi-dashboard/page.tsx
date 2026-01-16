'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, PieChart, TrendingUp, Loader2, ExternalLink,
  RefreshCw, AlertTriangle, CheckCircle2, XCircle
} from 'lucide-react';
import {
  SUPERSET_URL,
  SUPERSET_DASHBOARD_URL,
  BI_MODE
} from '@/lib/config';

type ConnectionStatus = 'checking' | 'connected' | 'error' | 'unavailable';

export default function BIDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking');
  const [biMode, setBiMode] = useState<'iframe' | 'link'>(BI_MODE);
  const [retryCount, setRetryCount] = useState(0);

  // Check Superset connectivity
  const checkSupersetConnection = useCallback(async () => {
    setConnectionStatus('checking');

    // For link mode, we don't need to check connectivity - just show the link
    if (biMode === 'link') {
      setConnectionStatus('connected');
      setLoading(false);
      return;
    }

    // For iframe mode, we check if we can load
    // Note: We can't directly fetch due to CORS, so we rely on iframe load events
    const timer = setTimeout(() => {
      setLoading(false);
      // If iframe hasn't loaded after timeout, show fallback
      if (!iframeLoaded) {
        setConnectionStatus('unavailable');
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [biMode, iframeLoaded]);

  useEffect(() => {
    checkSupersetConnection();
  }, [checkSupersetConnection, retryCount]);

  const handleIframeLoad = () => {
    setIframeLoaded(true);
    setConnectionStatus('connected');
    setLoading(false);
  };

  const handleIframeError = () => {
    setConnectionStatus('error');
    setLoading(false);
  };

  const handleRetry = () => {
    setLoading(true);
    setIframeLoaded(false);
    setRetryCount(prev => prev + 1);
  };

  const switchToLinkMode = () => {
    setBiMode('link');
    setConnectionStatus('connected');
    setLoading(false);
  };

  // Status indicator component
  const StatusIndicator = () => {
    const statusConfig = {
      checking: { icon: Loader2, color: 'text-yellow-400', bg: 'bg-yellow-500/10', text: 'Đang kiểm tra...', animate: true },
      connected: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10', text: 'Đã kết nối', animate: false },
      error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', text: 'Lỗi kết nối', animate: false },
      unavailable: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', text: 'Không thể embed', animate: false },
    };

    const config = statusConfig[connectionStatus];
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg}`}>
        <Icon className={`w-4 h-4 ${config.color} ${config.animate ? 'animate-spin' : ''}`} />
        <span className={`text-sm font-medium ${config.color}`}>{config.text}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-[1920px] mx-auto">

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-blue-200 mb-4">
            BI Dashboard - Apache Superset
          </h1>
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <p className="text-gray-400 text-lg">
                Dashboard phân tích chuyên sâu với công cụ BI chuyên nghiệp
              </p>
              <StatusIndicator />
            </div>
            <div className="flex items-center gap-3">
              {/* Mode Toggle */}
              <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setBiMode('link')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    biMode === 'link' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Link Mode
                </button>
                <button
                  onClick={() => setBiMode('iframe')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    biMode === 'iframe' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Embed Mode
                </button>
              </div>
              <a
                href={SUPERSET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Mở Superset
              </a>
            </div>
          </div>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { icon: BarChart3, label: 'Biểu đồ Tùy Chỉnh', value: 'Drag & Drop', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
            { icon: PieChart, label: 'Nguồn Dữ Liệu', value: 'PostgreSQL', color: 'text-green-400', bg: 'bg-green-500/10' },
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

        {/* Main BI Content */}
        {biMode === 'link' ? (
          /* Link Mode - Always works */
          <div className="glass-card rounded-2xl p-12 border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
            <div className="text-center max-w-2xl mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
                <BarChart3 className="w-10 h-10 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Apache Superset BI Dashboard
              </h2>
              <p className="text-gray-400 mb-8">
                Truy cập dashboard BI đầy đủ với công cụ phân tích chuyên nghiệp.
                Tạo biểu đồ, báo cáo và dashboard tương tác từ dữ liệu mặt bằng.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <a
                  href={SUPERSET_DASHBOARD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-white font-bold text-lg transition-all hover:scale-105"
                >
                  <ExternalLink className="w-5 h-5" />
                  Mở Dashboard BI
                </a>
                <a
                  href={SUPERSET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-bold text-lg transition-all"
                >
                  Superset Home
                </a>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-4 text-left">
                <p className="text-sm text-gray-400 mb-2">
                  <strong className="text-white">Thông tin đăng nhập:</strong>
                </p>
                <div className="flex gap-8">
                  <div>
                    <span className="text-gray-500">Username:</span>
                    <span className="ml-2 text-cyan-400 font-mono">admin</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Password:</span>
                    <span className="ml-2 text-cyan-400 font-mono">admin123</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Iframe Mode - Embed Superset */
          <div className="glass-card rounded-2xl p-2 border border-white/10 relative overflow-hidden">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-10">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">Đang kết nối Superset...</p>
                  <p className="text-gray-500 text-sm mt-2">URL: {SUPERSET_DASHBOARD_URL}</p>
                </div>
              </div>
            )}

            {(connectionStatus === 'error' || connectionStatus === 'unavailable') && !loading && (
              <div className="bg-slate-900 rounded-xl p-16 text-center">
                <div className="text-amber-400 text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {connectionStatus === 'error' ? 'Lỗi Kết Nối Superset' : 'Không Thể Embed Dashboard'}
                </h3>
                <p className="text-gray-400 mb-4 max-w-lg mx-auto">
                  {connectionStatus === 'error'
                    ? 'Container Superset đang khởi động hoặc chưa sẵn sàng. Thường mất 1-2 phút.'
                    : 'Superset đang chặn embedding qua iframe do cấu hình bảo mật (X-Frame-Options/CSP).'}
                </p>

                <div className="bg-slate-800 rounded-lg p-4 text-left max-w-md mx-auto mb-6">
                  <p className="text-sm text-gray-300 font-mono mb-2">
                    {connectionStatus === 'error'
                      ? 'Nếu container chưa chạy:'
                      : 'Nguyên nhân có thể:'}
                  </p>
                  {connectionStatus === 'error' ? (
                    <code className="text-xs text-cyan-400">docker-compose up -d superset</code>
                  ) : (
                    <ul className="text-xs text-gray-400 space-y-1">
                      <li>• X-Frame-Options: DENY/SAMEORIGIN</li>
                      <li>• Content-Security-Policy frame-ancestors</li>
                      <li>• Mixed content (HTTPS ↔ HTTP)</li>
                    </ul>
                  )}
                </div>

                <div className="flex gap-4 justify-center flex-wrap">
                  <button
                    onClick={handleRetry}
                    className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white font-bold transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Thử Lại
                  </button>
                  <button
                    onClick={switchToLinkMode}
                    className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg text-white font-bold transition-colors"
                  >
                    Chuyển Link Mode
                  </button>
                  <a
                    href={SUPERSET_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-bold transition-colors flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Mở Trực Tiếp
                  </a>
                </div>
              </div>
            )}

            {connectionStatus !== 'error' && connectionStatus !== 'unavailable' && (
              <div className="relative">
                <iframe
                  src={SUPERSET_DASHBOARD_URL}
                  className="w-full h-[800px] rounded-xl bg-white"
                  title="Apache Superset Dashboard"
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                  allow="fullscreen"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                />
                {iframeLoaded && (
                  <div className="absolute bottom-4 right-4 glass-panel px-3 py-2 rounded-lg">
                    <span className="text-xs text-cyan-400 font-bold flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Superset Live
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quick Data Export */}
        <div className="mt-8 glass-card rounded-2xl p-8 border border-green-500/20 bg-green-500/5">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            📊 Export Data cho Superset
          </h3>
          <p className="text-gray-400 mb-4">Download CSV để import vào Superset:</p>
          <div className="flex gap-4 flex-wrap">
            <a
              href="/api/export?format=csv"
              download="jfinder_listings.csv"
              className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg text-white font-bold transition-colors flex items-center gap-2"
            >
              📥 Download CSV (1170 listings)
            </a>
            <a
              href="/api/export?format=json"
              target="_blank"
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-bold transition-colors"
            >
              View JSON
            </a>
          </div>
        </div>

        {/* Environment Info (for debugging) */}
        <div className="mt-8 glass-card rounded-2xl p-6 border border-white/5">
          <details className="group">
            <summary className="cursor-pointer text-gray-500 hover:text-gray-300 text-sm">
              🔧 Thông tin cấu hình (Debug)
            </summary>
            <div className="mt-4 bg-slate-800/50 rounded-lg p-4 font-mono text-xs text-gray-400 space-y-1">
              <div>SUPERSET_URL: <span className="text-cyan-400">{SUPERSET_URL}</span></div>
              <div>DASHBOARD_URL: <span className="text-cyan-400">{SUPERSET_DASHBOARD_URL}</span></div>
              <div>BI_MODE (env): <span className="text-cyan-400">{BI_MODE}</span></div>
              <div>BI_MODE (active): <span className="text-cyan-400">{biMode}</span></div>
              <div>Status: <span className="text-cyan-400">{connectionStatus}</span></div>
            </div>
          </details>
        </div>

        {/* Setup Guide */}
        <div className="mt-8 glass-card rounded-2xl p-8 border border-white/10">
          <h3 className="text-xl font-bold text-white mb-4">🚀 Hướng Dẫn Import Data</h3>
          <ol className="space-y-3 text-gray-300">
            <li className="flex gap-3">
              <span className="font-bold text-cyan-400">1.</span>
              <span>Download CSV từ nút trên</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-cyan-400">2.</span>
              <span>
                Truy cập <a href={SUPERSET_URL} target="_blank" className="text-cyan-400 hover:underline">{SUPERSET_URL}</a>
                {' '}(Đăng nhập: <strong>admin</strong> / <strong>admin123</strong>)
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-cyan-400">3.</span>
              <span>Vào <strong>Settings → Database Connections → + Database</strong> → Chọn <strong>PostgreSQL</strong></span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-cyan-400">4.</span>
              <span>Hoặc: <strong>Data → Upload a CSV</strong> → Chọn file vừa download</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-cyan-400">5.</span>
              <span>Tạo <strong>Charts</strong> (Bar, Pie, Line, Map...)</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-cyan-400">6.</span>
              <span>Tạo <strong>Dashboard</strong> → Kéo thả charts vào</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
