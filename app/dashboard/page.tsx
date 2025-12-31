'use client';

import React from 'react';
import { LayoutDashboard, Users, TrendingUp, DollarSign, Activity, PieChart, BarChart } from 'lucide-react';

export default function Dashboard() {
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
            <p className="text-gray-400">Overview of system performance and market insights.</p>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase font-bold tracking-widest">Server Status</div>
              <div className="text-green-400 font-bold flex items-center justify-end gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
              </div>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Rental Requests', value: '1,284', change: '+12%', icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
            { label: 'Avg. Rental Price', value: '$1,200', change: '+5.4%', icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10' },
            { label: 'Active Listings', value: '3,405', change: '-2%', icon: Activity, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { label: 'Market Demand', value: 'High', change: 'Stable', icon: TrendingUp, color: 'text-orange-400', bg: 'bg-orange-500/10' },
          ].map((stat, idx) => (
            <div key={idx} className="glass-card p-6 rounded-2xl flex items-center gap-4 hover:bg-white/5 transition-colors">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">{stat.label}</div>
                <div className="text-2xl font-bold flex items-baseline gap-2">
                  {stat.value}
                  <span className={`text-xs font-bold ${stat.change.includes('+') ? 'text-green-500' : 'text-red-500'}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section Mockup */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-card p-8 rounded-2xl min-h-[400px] border border-white/10 relative overflow-hidden group">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <BarChart className="w-5 h-5 text-blue-400" />
              Rental Price Trends
            </h3>
            {/* Mock Chart Visual */}
            <div className="flex items-end justify-between h-64 gap-2 px-4">
              {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 100].map((h, i) => (
                <div key={i} className="w-full bg-blue-500/20 rounded-t-lg group-hover:bg-blue-500/30 transition-all duration-500 relative overflow-hidden" style={{ height: `${h}%` }}>
                  <div className="absolute bottom-0 w-full bg-gradient-to-t from-blue-600 to-cyan-400 opacity-50 h-full"></div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-8 rounded-2xl min-h-[400px] border border-white/10 relative overflow-hidden">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-400" />
              Category Distribution
            </h3>
            <div className="flex items-center justify-center h-64 relative">
              <div className="w-48 h-48 rounded-full border-[16px] border-cyan-500/20 border-t-cyan-500 border-r-purple-500 border-b-blue-500 rotate-45 group hover:scale-105 transition-transform"></div>
              <div className="absolute text-center">
                <div className="text-3xl font-black text-white">45%</div>
                <div className="text-xs text-gray-400">Retail</div>
              </div>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2 text-sm text-gray-400"><div className="w-3 h-3 rounded-full bg-cyan-500"></div> Retail</div>
              <div className="flex items-center gap-2 text-sm text-gray-400"><div className="w-3 h-3 rounded-full bg-purple-500"></div> F&B</div>
              <div className="flex items-center gap-2 text-sm text-gray-400"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Office</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
