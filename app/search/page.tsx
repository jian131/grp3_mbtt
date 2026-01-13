'use client';

import { useState } from 'react';
import { Search, MapPin, DollarSign, Home, TrendingUp, Eye, Loader2, Filter } from 'lucide-react';
import { fetchListings, fetchDistricts, Listing, District } from '@/lib/api';
import { useEffect } from 'react';
import Link from 'next/link';

export default function SearchPage() {
  const [loading, setLoading] = useState(false);
  const [districts, setDistricts] = useState<District[]>([]);
  const [results, setResults] = useState<Listing[]>([]);

  const [filters, setFilters] = useState({
    district: '',
    type: '' as '' | 'shophouse' | 'kiosk' | 'office' | 'retail',
    maxPrice: 200,
    minArea: 0
  });

  useEffect(() => {
    fetchDistricts().then(data => setDistricts(data));
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await fetchListings({
        district: filters.district || undefined,
        type: filters.type || undefined,
        maxPrice: filters.maxPrice,
        limit: 50
      });

      // Filter by area client-side if needed
      const filtered = filters.minArea > 0
        ? data.filter(item => item.area >= filters.minArea)
        : data;

      setResults(filtered);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getPriceLabel = (listing: Listing) => {
    switch (listing.ai?.priceLabel) {
      case 'cheap': return { text: 'Giá Tốt', color: 'bg-green-500/10 text-green-400 border-green-500/20' };
      case 'expensive': return { text: 'Giá Cao', color: 'bg-red-500/10 text-red-400 border-red-500/20' };
      default: return { text: 'Hợp Lý', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' };
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-blue-200 mb-4">
            Tìm Kiếm Mặt Bằng
          </h1>
          <p className="text-gray-400 text-lg">
            Tìm kiếm và lọc theo nhu cầu. Dữ liệu real-time từ n8n Backend.
          </p>
        </header>

        {/* Search Form */}
        <div className="glass-card rounded-2xl p-8 mb-10 border border-white/10">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
            <Filter className="w-5 h-5 text-cyan-400" />
            Bộ Lọc Tìm Kiếm
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {/* District Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">Quận / Huyện</label>
              <select
                value={filters.district}
                onChange={e => setFilters({ ...filters, district: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-500 outline-none transition-all cursor-pointer"
              >
                <option value="" className="bg-slate-900">Tất cả khu vực</option>
                {districts.map(d => (
                  <option key={d.id} value={d.name} className="bg-slate-900">{d.name}</option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">Loại Hình</label>
              <select
                value={filters.type}
                onChange={e => setFilters({ ...filters, type: e.target.value as any })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-500 outline-none transition-all cursor-pointer"
              >
                <option value="" className="bg-slate-900">Tất cả loại</option>
                <option value="shophouse" className="bg-slate-900">Shophouse</option>
                <option value="kiosk" className="bg-slate-900">Kiosk</option>
                <option value="office" className="bg-slate-900">Văn phòng</option>
                <option value="retail" className="bg-slate-900">Cửa hàng</option>
              </select>
            </div>

            {/* Price Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                Giá tối đa: <span className="text-cyan-400">{filters.maxPrice} Tr</span>
              </label>
              <input
                type="range"
                min="10"
                max="300"
                step="10"
                value={filters.maxPrice}
                onChange={e => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Area Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">Diện tích tối thiểu (m²)</label>
              <input
                type="number"
                value={filters.minArea}
                onChange={e => setFilters({ ...filters, minArea: Number(e.target.value) })}
                placeholder="0"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-bold text-white shadow-lg shadow-cyan-900/40 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang tìm kiếm...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Tìm Kiếm Ngay
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                Tìm thấy <span className="text-cyan-400">{results.length}</span> mặt bằng
              </h3>
              <Link href="/map" className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Xem trên bản đồ
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map(listing => {
                const priceLabel = getPriceLabel(listing);
                return (
                  <div key={listing.id} className="glass-card rounded-xl p-6 hover:bg-white/5 transition-all group border border-white/10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h4 className="font-bold text-white mb-1 line-clamp-1">{listing.name}</h4>
                        <p className="text-sm text-gray-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {listing.district}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${priceLabel.color}`}>
                        {priceLabel.text}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Giá thuê:</span>
                        <span className="font-bold text-green-400">{listing.price} Tr/tháng</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Diện tích:</span>
                        <span className="text-white">{listing.area} m²</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Mặt tiền:</span>
                        <span className="text-white">{listing.frontage}m</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1 text-purple-400">
                          <TrendingUp className="w-3 h-3" />
                          <span className="font-bold">{listing.ai?.potentialScore || 'N/A'}/100</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Eye className="w-3 h-3" />
                          {listing.views}
                        </div>
                      </div>
                      <button className="text-xs text-cyan-400 hover:text-cyan-300 font-bold">
                        Chi tiết →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : !loading && (
          <div className="text-center py-20">
            <Home className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              Nhấn nút <span className="text-cyan-400 font-bold">"Tìm Kiếm Ngay"</span> để xem kết quả
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
