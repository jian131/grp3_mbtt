'use client';

import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Users, TrendingUp, DollarSign, Activity, PieChart, BarChart, MapPin, Building2, Store, Briefcase, Loader2 } from 'lucide-react';
import { fetchStats, Stats } from '@/lib/api';

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
/*
  Gọi API n8n để lấy dữ liệu dashboard
  Chỉ chạy 1 lần khi component mount
*/
  useEffect(() => {
    fetchStats().then(data => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Đang tải dữ liệu từ n8n Backend...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <p className="text-red-400">Không thể kết nối API. Hãy chắc chắn n8n đang chạy.</p>
      </div>
    );
  }
// Lấy top 10 quận có số lượng mặt bằng nhiều nhất
  const topDistricts = Object.entries(stats.byDistrict)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
// Icon hiển thị theo từng loại mặt bằng
  const typeIcons: Record<string, React.ReactNode> = {
    shophouse: <Store className="w-5 h-5" />,
    office: <Briefcase className="w-5 h-5" />,
    retail: <Building2 className="w-5 h-5" />,
    kiosk: <MapPin className="w-5 h-5" />
  };

  // Nhãn hiển thị tiếng Việt cho từng loại mặt bằng
  const typeLabels: Record<string, string> = {
    shophouse: 'Shophouse',
    office: 'Văn phòng',
    retail: 'Bán lẻ',
    kiosk: 'Kiosk'
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-8 text-white font-sans">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* Header */}
        <header className="flex justify-between items-end border-b border-white/10 pb-8">
          <div>
            <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-cyan-400" />
              JFinder Dashboard
            </h1>
            <p className="text-gray-400">Real-time analytics from {stats.total.toLocaleString()} listings across Hanoi.</p>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase font-bold tracking-widest">Data Source</div>
              <div className="text-cyan-400 font-bold flex items-center justify-end gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> n8n API Live
              </div>
            </div>
          </div>
        </header>

        {/* Stats Grid - Hiển thị các chỉ số tổng quan */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Tổng Mặt Bằng', value: stats.total.toLocaleString(), change: 'listings', icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
            { label: 'Giá TB (triệu/th)', value: stats.avgPrice.toFixed(1), change: 'VND', icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10' },
            { label: 'Diện tích TB (m²)', value: String(stats.avgArea), change: 'm²', icon: Activity, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { label: 'Potential TB', value: String(stats.avgPotential), change: '/100', icon: TrendingUp, color: 'text-orange-400', bg: 'bg-orange-500/10' },
          ].map((stat, idx) => (
            <div key={idx} className="glass-card p-6 rounded-2xl flex items-center gap-4 hover:bg-white/5 transition-colors border border-white/5">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">{stat.label}</div>
                <div className="text-2xl font-bold flex items-baseline gap-2">
                  {stat.value}
                  <span className="text-xs font-normal text-gray-500">{stat.change}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* District Distribution Bar Chart */}
          <div className="glass-card p-6 rounded-2xl border border-white/10 col-span-2">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <BarChart className="w-5 h-5 text-blue-400" />
              Phân bố theo Quận (từ n8n API)
            </h3>
            <div className="space-y-3">
              {topDistricts.map(([district, count], idx) => (
                <div key={district} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-gray-400 truncate">{district}</div>
                  <div className="flex-1 h-8 bg-slate-800 rounded-lg overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-600 to-blue-500 rounded-lg transition-all duration-500"
                      style={{ width: `${(count / topDistricts[0][1]) * 100}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-between px-3">
                      <span className="text-xs font-bold text-white">{count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Type Distribution Pie */}
          <div className="glass-card p-6 rounded-2xl border border-white/10">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-400" />
              Loại Mặt Bằng
            </h3>
            <div className="space-y-4">
              {Object.entries(stats.byType).map(([type, count]) => {
                const percent = ((count / stats.total) * 100).toFixed(1);
                const colors: Record<string, string> = {
                  shophouse: 'bg-cyan-500',
                  office: 'bg-blue-500',
                  retail: 'bg-purple-500',
                  kiosk: 'bg-pink-500'
                };
                return (
                  <div key={type} className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colors[type]}/20`}>
                      {typeIcons[type]}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">{typeLabels[type] || type}</span>
                        <span className="font-bold text-white">{count}</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full ${colors[type]} rounded-full`} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
