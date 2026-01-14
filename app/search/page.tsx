'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, MapPin, TrendingUp, Eye, Loader2, Filter, Grid3X3, Map as MapIcon } from 'lucide-react';
import { fetchListings, fetchDistricts, Listing, District } from '@/lib/api';
import dynamic from 'next/dynamic';

const RentalHeatmap = dynamic(() => import('@/components/Map/RentalHeatmap'), { ssr: false });

export default function SearchPage() {
  const [loading, setLoading] = useState(false);
  const [districts, setDistricts] = useState<District[]>([]);
  const [results, setResults] = useState<Listing[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

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
        limit: 100
      });

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
            {results.length > 0 ? `Tìm thấy ${results.length} mặt bằng` : 'Tìm kiếm và lọc theo nhu cầu. Dữ liệu real-time từ n8n Backend.'}
          </p>
        </header>

        {/* Search Form */}
        <div className="glass-card rounded-2xl p-8 mb-10 border border-white/10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <Filter className="w-5 h-5 text-cyan-400" />
              Bộ Lọc Tìm Kiếm
            </h2>

            {/* View Toggle */}
            {results.length > 0 && (
              <div className="flex gap-2 bg-white/5 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${viewMode === 'grid' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${viewMode === 'map' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                >
                  <MapIcon className="w-4 h-4" />
                  Map
                </button>
              </div>
            )}
          </div>

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
          viewMode === 'grid' ? (
            // Grid View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map(listing => {
                const priceLabel = getPriceLabel(listing);
                return (
                  <Link
                    key={listing.id}
                    href={`/listing/${listing.id}`}
                    className="glass-card rounded-xl overflow-hidden hover:bg-white/10 transition-all group border border-white/10 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-900/20"
                  >
                    {/* Image Thumbnail */}
                    <div className="relative w-full h-48 bg-slate-800">
                      {listing.images && listing.images.length > 0 ? (
                        <Image
                          src={listing.images[0]}
                          alt={listing.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                          <MapPin className="w-12 h-12" />
                        </div>
                      )}
                      <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded-full border backdrop-blur-sm ${priceLabel.color}`}>
                        {priceLabel.text}
                      </span>
                    </div>

                    {/* Card Content */}
                    <div className="p-6">
                      <h4 className="font-bold text-white mb-2 line-clamp-1 group-hover:text-cyan-400 transition-colors">{listing.name}</h4>
                      <p className="text-sm text-gray-400 flex items-center gap-1 mb-4">
                        <MapPin className="w-3 h-3" />
                        {listing.district}
                      </p>

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
                        <span className="text-xs text-cyan-400 font-bold group-hover:underline">
                          Chi tiết →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            // Map View
            <div className="h-[700px] rounded-2xl overflow-hidden border border-white/10">
              <RentalHeatmap listings={results} />
            </div>
          )
        ) : !loading && (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              Nhấn nút <span className="text-cyan-400 font-bold">"Tìm Kiếm Ngay"</span> để xem kết quả
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
