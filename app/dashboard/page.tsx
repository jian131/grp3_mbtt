'use client';

import React, { useMemo } from 'react';
import { LayoutDashboard, Users, TrendingUp, DollarSign, Activity, PieChart, BarChart, MapPin, Building2, Store, Briefcase } from 'lucide-react';
import { mockListings, getStatistics, getDistrictStats, getTopPotential, Listing } from '@/app/data/mockListings';

export default function Dashboard() {
  const stats = useMemo(() => getStatistics(), []);
  const districtStats = useMemo(() => getDistrictStats(), []);
  const topListings = useMemo(() => getTopPotential(5), []);

  // Thống kê theo loại
  const typeStats = useMemo(() => {
    const types: Record<string, number> = {};
    mockListings.forEach(l => {
      types[l.type] = (types[l.type] || 0) + 1;
    });
    return types;
  }, []);

  // Thống kê theo nhãn giá
  const priceLabels = useMemo(() => {
    const labels: Record<string, number> = { cheap: 0, fair: 0, expensive: 0 };
    mockListings.forEach(l => {
      labels[l.ai.priceLabel]++;
    });
    return labels;
  }, []);

  // Top 10 quận theo số lượng
  const topDistricts = useMemo(() => {
    return Object.entries(districtStats)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);
  }, [districtStats]);

  const typeIcons: Record<string, React.ReactNode> = {
    shophouse: <Store className="w-5 h-5" />,
    office: <Briefcase className="w-5 h-5" />,
    retail: <Building2 className="w-5 h-5" />,
    kiosk: <MapPin className="w-5 h-5" />
  };

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
                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span> Live Mock Data
              </div>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Tổng Mặt Bằng', value: stats.total.toLocaleString(), change: '+100%', icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
            { label: 'Giá TB (triệu/th)', value: stats.avgPrice.toFixed(1), change: 'VND', icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10' },
            { label: 'Diện tích TB (m²)', value: stats.avgArea.toFixed(0), change: 'm²', icon: Activity, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { label: 'Potential TB', value: stats.avgPotential.toFixed(0), change: '/100', icon: TrendingUp, color: 'text-orange-400', bg: 'bg-orange-500/10' },
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
              Phân bố theo Quận
            </h3>
            <div className="space-y-3">
              {topDistricts.map(([district, data], idx) => (
                <div key={district} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-gray-400 truncate">{district}</div>
                  <div className="flex-1 h-8 bg-slate-800 rounded-lg overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-600 to-blue-500 rounded-lg transition-all duration-500"
                      style={{ width: `${(data.count / topDistricts[0][1].count) * 100}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-between px-3">
                      <span className="text-xs font-bold text-white">{data.count}</span>
                      <span className="text-xs text-gray-300">~{data.avgPrice}tr/th</span>
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
              {Object.entries(typeStats).map(([type, count]) => {
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
                        <span className="text-gray-300">{typeLabels[type]}</span>
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

        {/* Price Label & Top Listings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Price Label Distribution */}
          <div className="glass-card p-6 rounded-2xl border border-white/10">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              Phân tích Giá AI
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="text-3xl font-black text-green-400">{priceLabels.cheap}</div>
                <div className="text-sm text-gray-400 mt-1">Giá rẻ</div>
                <div className="text-xs text-green-500 mt-2">✓ Nên thuê</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <div className="text-3xl font-black text-yellow-400">{priceLabels.fair}</div>
                <div className="text-sm text-gray-400 mt-1">Hợp lý</div>
                <div className="text-xs text-yellow-500 mt-2">~ Cân nhắc</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="text-3xl font-black text-red-400">{priceLabels.expensive}</div>
                <div className="text-sm text-gray-400 mt-1">Đắt</div>
                <div className="text-xs text-red-500 mt-2">✗ Thương lượng</div>
              </div>
            </div>
          </div>

          {/* Top Potential Listings */}
          <div className="glass-card p-6 rounded-2xl border border-white/10">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Top Tiềm Năng
            </h3>
            <div className="space-y-3">
              {topListings.map((listing, idx) => (
                <div key={listing.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{listing.name}</div>
                    <div className="text-xs text-gray-400">{listing.district} • {listing.price}tr/th</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-cyan-400">{listing.ai.potentialScore}</div>
                    <div className="text-xs text-gray-500">score</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
