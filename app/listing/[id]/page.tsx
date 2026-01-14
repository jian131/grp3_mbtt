'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchListingById, Listing } from '@/lib/api';
import ImageGallery from '@/components/Listing/ImageGallery';
import { MapPin, Home, Ruler, TrendingUp, Eye, Calendar, Heart, Phone, User, Building2, School, Briefcase, Store } from 'lucide-react';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/Map/RentalHeatmap'), { ssr: false });

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params.id as string;
    if (id) {
      fetchListingById(id).then(data => {
        setListing(data);
        setLoading(false);
      });
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-8 flex items-center justify-center  ">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-8 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Không tìm thấy mặt bằng</h2>
          <button
            onClick={() => router.push('/search')}
            className="mt-4 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white font-bold"
          >
            Quay lại tìm kiếm
          </button>
        </div>
      </div>
    );
  }

  const priceLabel = listing.ai.priceLabel === 'cheap'
    ? { text: 'Giá Tốt', color: 'bg-green-500/10 text-green-400 border-green-500/20' }
    : listing.ai.priceLabel === 'expensive'
      ? { text: 'Giá Cao', color: 'bg-red-500/10 text-red-400 border-red-500/20' }
      : { text: 'Hợp Lý', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-400">
          <button onClick={() => router.push('/search')} className="hover:text-cyan-400">Tìm kiếm</button>
          <span>/</span>
          <span className="text-white">{listing.name}</span>
        </div>

        {/* Image Gallery */}
        <ImageGallery images={listing.images || []} title={listing.name} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">

          {/* Left Column: Property Details */}
          <div className="lg:col-span-2 space-y-6">

            {/* Header */}
            <div className="glass-card rounded-2xl p-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl font-black text-white mb-2">{listing.name}</h1>
                  <p className="text-gray-400 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {listing.address || `${listing.ward}, ${listing.district}`}
                  </p>
                </div>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${priceLabel.color}`}>
                  {priceLabel.text}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <div className="text-2xl font-black text-green-400">{listing.price} Tr</div>
                  <div className="text-xs text-gray-500 mt-1">Giá thuê / tháng</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <div className="text-2xl font-black text-white">{listing.area} m²</div>
                  <div className="text-xs text-gray-500 mt-1">Diện tích</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <div className="text-2xl font-black text-white">{listing.frontage}m</div>
                  <div className="text-xs text-gray-500 mt-1">Mặt tiền</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <div className="text-2xl font-black text-white">{listing.floors}</div>
                  <div className="text-xs text-gray-500 mt-1">Số tầng</div>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div className="glass-card rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                Phân Tích AI
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-purple-500/10 to-transparent p-6 rounded-xl border border-purple-500/20">
                  <div className="text-sm text-purple-300 mb-2">Điểm Tiềm Năng</div>
                  <div className="text-4xl font-black text-white">{listing.ai.potentialScore}/100</div>
                </div>
                <div className="bg-gradient-to-br from-cyan-500/10 to-transparent p-6 rounded-xl border border-cyan-500/20">
                  <div className="text-sm text-cyan-300 mb-2">Giá Gợi Ý</div>
                  <div className="text-4xl font-black text-white">{listing.ai.suggestedPrice} Tr</div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-white/5 rounded-lg">
                <div className="text-sm text-gray-400">
                  Mức độ rủi ro: <span className={`font-bold ${listing.ai.riskLevel === 'low' ? 'text-green-400' :
                      listing.ai.riskLevel === 'high' ? 'text-red-400' : 'text-yellow-400'
                    }`}>{listing.ai.riskLevel === 'low' ? 'Thấp' : listing.ai.riskLevel === 'high' ? 'Cao' : 'Trung bình'}</span>
                </div>
              </div>
            </div>

            {/* Amenities */}
            {listing.amenities && (
              <div className="glass-card rounded-2xl p-8">
                <h3 className="text-xl font-bold text-white mb-6">Tiện Ích Lân Cận</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-500/10 rounded-xl">
                    <School className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{listing.amenities.schools}</div>
                    <div className="text-xs text-gray-400 mt-1">Trường học</div>
                  </div>
                  <div className="text-center p-4 bg-green-500/10 rounded-xl">
                    <Briefcase className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{listing.amenities.offices}</div>
                    <div className="text-xs text-gray-400 mt-1">Văn phòng</div>
                  </div>
                  <div className="text-center p-4 bg-orange-500/10 rounded-xl">
                    <Store className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{listing.amenities.competitors}</div>
                    <div className="text-xs text-gray-400 mt-1">Đối thủ</div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Contact & Stats */}
          <div className="space-y-6">

            {/* Owner Contact */}
            {listing.owner && (
              <div className="glass-card rounded-2xl p-6 border border-white/10">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-cyan-400" />
                  Thông Tin Chủ Nhà
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold">
                      {listing.owner.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{listing.owner.name}</div>
                      <div className="text-sm text-gray-400">Chủ sở hữu</div>
                    </div>
                  </div>
                  <a
                    href={`tel:${listing.owner.phone}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl text-white font-bold transition-all"
                  >
                    <Phone className="w-5 h-5" />
                    {listing.owner.phone}
                  </a>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4">Thống Kê</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Lượt xem
                  </span>
                  <span className="font-bold text-white">{listing.views.toLocaleString()}</span>
                </div>
                {listing.savedCount && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Đã lưu
                    </span>
                    <span className="font-bold text-white">{listing.savedCount}</span>
                  </div>
                )}
                {listing.postedAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Đăng ngày
                    </span>
                    <span className="font-bold text-white">{new Date(listing.postedAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Loại hình
                  </span>
                  <span className="font-bold text-white capitalize">{listing.type}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
