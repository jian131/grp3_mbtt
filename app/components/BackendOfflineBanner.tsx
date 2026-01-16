'use client';

import { useBackendStatus } from '@/lib/BackendStatusContext';
import { AlertTriangle, RefreshCw, Wifi, WifiOff, X } from 'lucide-react';
import { useState } from 'react';
import { API_BASE_URL } from '@/lib/config';

export default function BackendOfflineBanner() {
  const { isOnline, isChecking, error, latency, refresh } = useBackendStatus();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if online or dismissed
  if (isOnline || dismissed) {
    return null;
  }

  return (
    <div className="fixed top-16 left-0 right-0 z-50 animate-slide-down">
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              <WifiOff className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">
                Backend Offline
              </p>
              <p className="text-xs text-white/80">
                {error || 'Không thể kết nối tới n8n backend'}
                {latency && ` (${latency}ms)`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-white/70 hidden sm:block">
              <code className="bg-black/20 px-2 py-1 rounded">
                {API_BASE_URL}
              </code>
            </div>

            <button
              onClick={() => refresh()}
              disabled={isChecking}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              Thử lại
            </button>

            <button
              onClick={() => setDismissed(true)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Help text */}
        <div className="max-w-7xl mx-auto mt-2 text-xs text-white/70 flex items-center gap-2">
          <AlertTriangle className="w-3 h-3" />
          <span>
            Hãy bật n8n: <code className="bg-black/20 px-1 rounded">docker-compose up -d n8n</code>
            {' '}hoặc kiểm tra URL trong <code className="bg-black/20 px-1 rounded">.env.local</code>
          </span>
        </div>
      </div>
    </div>
  );
}

// Optional: Inline status indicator for specific pages
export function BackendStatusIndicator() {
  const { isOnline, isChecking, latency, refresh } = useBackendStatus();

  return (
    <button
      onClick={() => refresh()}
      disabled={isChecking}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
        isOnline
          ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
          : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
      }`}
      title={isOnline ? `Online (${latency}ms)` : 'Offline - click to retry'}
    >
      {isChecking ? (
        <RefreshCw className="w-3 h-3 animate-spin" />
      ) : isOnline ? (
        <Wifi className="w-3 h-3" />
      ) : (
        <WifiOff className="w-3 h-3" />
      )}
      <span>{isOnline ? 'Online' : 'Offline'}</span>
    </button>
  );
}
