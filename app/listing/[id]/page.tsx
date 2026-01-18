'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchListing, fetchListings, Listing, getAIDecision, DecisionResult } from '@/lib/api';
import ImageGallery from '@/components/Listing/ImageGallery';
import { MapPin, Home, Ruler, TrendingUp, Eye, Calendar, Heart, Phone, User, Building2, School, Briefcase, Store, Sparkles, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { getCityCenter, getDistrictGeo, isValidVietnamCoords } from '@/lib/mapConfig';
import { useMapEvents } from 'react-leaflet';

const MapComponent = dynamic(() => import('@/components/Map/RentalHeatmap'), { ssr: false });
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then((mod) => mod.Polyline), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then((mod) => mod.CircleMarker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiDecision, setAIDecision] = useState<DecisionResult | null>(null);
  const [aiLoading, setAILoading] = useState(false);
  const [altLoading, setAltLoading] = useState(false);
  const [altError, setAltError] = useState<string | null>(null);
  const [altCandidates, setAltCandidates] = useState<Listing[]>([]);
  const [recommendations, setRecommendations] = useState<Array<{
    listing: Listing;
    distanceKm: number;
    etaMin: number;
    priceDiff: number;
    betterOn: string[];
  }>>([]);
  const [travelMode, setTravelMode] = useState<'driving' | 'walking'>('driving');
  const [origin, setOrigin] = useState<{ lat: number; lon: number } | null>(null);
  const [originStatus, setOriginStatus] = useState<'idle' | 'ok' | 'denied' | 'error'>('idle');
  const [routeCoords, setRouteCoords] = useState<Array<[number, number]>>([]);
  const [routeStats, setRouteStats] = useState<{ distanceKm: number; etaMin: number } | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  useEffect(() => {
    const id = params.id as string;
    if (id) {
      fetchListing(id).then(data => {
        setListing(data);
        setLoading(false);
      });
    }
  }, [params.id]);

  // Try to get user location (best-effort)
  useEffect(() => {
    if (!listing) return;
    if (!navigator?.geolocation) {
      setOriginStatus('error');
      return;
    }
    setOriginStatus('idle');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        if (isValidVietnamCoords(lat, lon)) {
          setOrigin({ lat, lon });
          setOriginStatus('ok');
        } else {
          setOriginStatus('error');
        }
      },
      () => setOriginStatus('denied'),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [listing]);

  // Fallback origin if user location not available
  const fallbackOrigin = useMemo(() => {
    if (!listing) return null;
    const districtGeo = getDistrictGeo(listing.province, listing.district);
    if (districtGeo?.center) {
      return { lat: districtGeo.center.lat, lon: districtGeo.center.lon };
    }
    const cityCenter = getCityCenter(listing.province);
    if (cityCenter) return { lat: cityCenter.lat, lon: cityCenter.lon };
    return {
      lat: listing.lat || listing.latitude || 0,
      lon: listing.lon || listing.longitude || 0
    };
  }, [listing]);

  // Fetch alternative candidates in same district
  useEffect(() => {
    if (!listing) return;
    setAltLoading(true);
    setAltError(null);
    fetchListings({
      district: listing.district,
      province: listing.province,
      limit: 200
    })
      .then(data => {
        const filtered = data.filter(l =>
          l.id !== listing.id &&
          isValidVietnamCoords(l.lat || l.latitude || 0, l.lon || l.longitude || 0)
        );
        setAltCandidates(filtered);
      })
      .catch(err => {
        console.error('Load alternatives failed', err);
        setAltError('Không tải được gợi ý thay thế');
      })
      .finally(() => setAltLoading(false));
  }, [listing]);

  const computeDistanceKm = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLon = ((b.lon - a.lon) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const c = 2 * Math.atan2(
      Math.sqrt(sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon),
      Math.sqrt(1 - (sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon))
    );
    return R * c;
  };

  const getSpeedKmh = (mode: 'driving' | 'walking') => (mode === 'walking' ? 4.5 : 25);
  const toNumber = (val: any) => {
    const n = Number(val);
    return Number.isFinite(n) ? n : 0;
  };

  const fetchOsrmRoute = async (from: { lat: number; lon: number }, to: { lat: number; lon: number }, mode: 'driving' | 'walking') => {
    const url = `https://router.project-osrm.org/route/v1/${mode}/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const data = await res.json();
    if (!data?.routes?.length) throw new Error('No route');
    const route = data.routes[0];
    const coords = route.geometry.coordinates.map((pt: [number, number]) => [pt[1], pt[0]] as [number, number]);
    return {
      coords,
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      etaMin: Math.round((route.duration / 60) * 10) / 10
    };
  };

  // Route for current listing (map + base ETA)
  useEffect(() => {
    if (!listing || (!origin && !fallbackOrigin)) return;
    const originPoint = origin || fallbackOrigin!;
    const destPoint = {
      lat: listing.lat || listing.latitude || 0,
      lon: listing.lon || listing.longitude || 0
    };
    setRouteLoading(true);
    setRouteError(null);
    fetchOsrmRoute(originPoint, destPoint, travelMode)
      .then(r => {
        setRouteCoords(r.coords);
        setRouteStats({ distanceKm: r.distanceKm, etaMin: r.etaMin });
      })
      .catch(() => {
        // fallback to straight-line
        const dist = computeDistanceKm(originPoint, destPoint);
        const eta = Math.round((dist / getSpeedKmh(travelMode)) * 60 * 10) / 10;
        setRouteCoords([]);
        setRouteStats({ distanceKm: Math.round(dist * 10) / 10, etaMin: eta });
        setRouteError('Không lấy được tuyến OSRM, dùng ước tính khoảng cách thẳng.');
      })
      .finally(() => setRouteLoading(false));
  }, [listing, origin, fallbackOrigin, travelMode]);

  const MapClickHandler = () => {
    useMapEvents({
      click: (event) => {
        setOrigin({ lat: event.latlng.lat, lon: event.latlng.lng });
        setOriginStatus('ok');
      }
    });
    return null;
  };

  // Build recommendations when we have candidates and an origin (or fallback)
  useEffect(() => {
    if (!listing || (!origin && !fallbackOrigin) || altCandidates.length === 0) return;

    const originPoint = origin || fallbackOrigin!;
    const currentPrice = toNumber(listing.price || listing.price_million);
    const currentPoint = {
      lat: listing.lat || listing.latitude || 0,
      lon: listing.lon || listing.longitude || 0
    };
    const baseDistance = computeDistanceKm(originPoint, currentPoint);
    const speed = getSpeedKmh(travelMode);
    const ETA_IMPROVE_PCT = 10; // cần tốt hơn ít nhất 10%
    const PRICE_IMPROVE_M = 3;  // hoặc rẻ hơn ít nhất 3 triệu
    const MAX_CANDIDATES = 15; // tránh spam OSRM

    const nearest = [...altCandidates]
      .map(c => {
        const pt = { lat: c.lat || c.latitude || 0, lon: c.lon || c.longitude || 0 };
        return { cand: c, dist: computeDistanceKm(originPoint, pt) };
      })
      .sort((a, b) => a.dist - b.dist)
      .slice(0, MAX_CANDIDATES);

    let cancelled = false;

    const build = async () => {
      // base ETA via OSRM (with fallback)
      let baseEta = Math.round((baseDistance / speed) * 60 * 10) / 10;
      try {
        const baseRoute = await fetchOsrmRoute(originPoint, currentPoint, travelMode);
        baseEta = baseRoute.etaMin;
      } catch {
        // fallback already set
      }

      const results: typeof recommendations = [];

      for (const item of nearest) {
        if (cancelled) break;
        const candPoint = { lat: item.cand.lat || item.cand.latitude || 0, lon: item.cand.lon || item.cand.longitude || 0 };
        let distKm = item.dist;
        let eta = Math.round((distKm / speed) * 60 * 10) / 10;
        try {
          const route = await fetchOsrmRoute(originPoint, candPoint, travelMode);
          distKm = route.distanceKm;
          eta = route.etaMin;
        } catch {
          // fallback ok
        }
        const price = toNumber(item.cand.price || item.cand.price_million);
        const priceDiff = price - currentPrice;
        const betterOn: string[] = [];
        const etaBetter = eta <= baseEta * (1 - ETA_IMPROVE_PCT / 100);
        const priceBetter = priceDiff <= -PRICE_IMPROVE_M;
        if (etaBetter) betterOn.push('ETA');
        if (priceBetter) betterOn.push('Giá');
        if (!etaBetter && !priceBetter) continue;
        results.push({
          listing: item.cand,
          distanceKm: Math.round(distKm * 10) / 10,
          etaMin: eta,
          priceDiff,
          betterOn,
          score: (baseEta - eta) * 2 + (currentPrice - price) * 0.3
        });
      }

      if (!cancelled) {
        let best = results
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);
        // fallback: nếu không có ứng viên thỏa ngưỡng, hiển thị 3 gần nhất
        if (best.length === 0) {
          best = nearest.slice(0, 3).map(item => {
            const price = toNumber(item.cand.price || item.cand.price_million);
            return {
              listing: item.cand,
              distanceKm: Math.round(item.dist * 10) / 10,
              etaMin: Math.round((item.dist / speed) * 60 * 10) / 10,
              priceDiff: price - currentPrice,
              betterOn: [],
              score: 0
            };
          });
        }
        setRecommendations(best);
      }
    };

    build();
    return () => { cancelled = true; };
  }, [listing, origin, fallbackOrigin, altCandidates, travelMode]);

  const handleAIConsult = async () => {
    if (!listing) return;
    setAILoading(true);
    try {
      const result = await getAIDecision({
        listing_id: listing.id,
        user_intent: 'Kinh doanh F&B / Cửa hàng',
        budget: listing.price || 50,
        expected_revenue: (listing.price || 50) * 3
      });
      setAIDecision(result);
    } catch (e) {
      console.error('AI Decision error:', e);
    } finally {
      setAILoading(false);
    }
  };

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

  const priceLabel = listing.ai?.priceLabel === 'cheap'
    ? { text: 'Giá Tốt', color: 'bg-green-500/10 text-green-400 border-green-500/20' }
    : listing.ai?.priceLabel === 'expensive'
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

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <div className="text-2xl font-black text-green-400">{listing.price} Tr</div>
                  <div className="text-xs text-gray-500 mt-1">Giá thuê / tháng</div>
                </div>
                {listing.rent_per_sqm_million && (
                  <div className="text-center p-4 bg-white/5 rounded-xl">
                    <div className="text-2xl font-black text-cyan-400">{listing.rent_per_sqm_million.toFixed(2)} Tr/m²</div>
                    <div className="text-xs text-gray-500 mt-1">Giá thuê / m²</div>
                  </div>
                )}
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
            {listing.ai && (
            <div className="glass-card rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                Phân Tích AI
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-purple-500/10 to-transparent p-6 rounded-xl border border-purple-500/20">
                  <div className="text-sm text-purple-300 mb-2">Điểm Tiềm Năng</div>
                  <div className="text-4xl font-black text-white">{listing.ai.potentialScore !== undefined ? listing.ai.potentialScore : 'N/A'}/100</div>
                </div>
                <div className="bg-gradient-to-br from-cyan-500/10 to-transparent p-6 rounded-xl border border-cyan-500/20">
                  <div className="text-sm text-cyan-300 mb-2">Giá Gợi Ý</div>
                  <div className="text-4xl font-black text-white">{listing.ai.suggestedPrice ?? listing.price} Tr</div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-white/5 rounded-lg">
                <div className="text-sm text-gray-400">
                  Mức độ rủi ro: <span className={`font-bold ${listing.ai.riskLevel === 'low' ? 'text-green-400' :
                    listing.ai.riskLevel === 'high' ? 'text-red-400' : 'text-yellow-400'
                    }`}>{listing.ai.riskLevel === 'low' ? 'Thấp' : listing.ai.riskLevel === 'high' ? 'Cao' : 'Trung bình'}</span>
                </div>
              </div>

              {/* AI Decision Support Button */}
              {!aiDecision && (
                <button
                  onClick={handleAIConsult}
                  disabled={aiLoading}
                  className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl text-white font-bold transition-all disabled:opacity-50"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang phân tích...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Tư Vấn AI Chi Tiết
                    </>
                  )}
                </button>
              )}
            </div>
            )}

            {/* AI Decision Result */}
            {aiDecision && (
              <div className="glass-card rounded-2xl p-8 border-2 border-purple-500/30">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Tư Vấn AI
                    {aiDecision.ai_powered && (
                      <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                        {aiDecision.model || 'Gemini'}
                      </span>
                    )}
                  </h3>
                  <div className={`text-2xl font-black ${
                    aiDecision.verdict === 'recommend' ? 'text-green-400' :
                    aiDecision.verdict === 'avoid' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {aiDecision.verdict === 'recommend' ? '✓ Khuyến nghị' :
                     aiDecision.verdict === 'avoid' ? '✗ Không nên' : '⚖ Cân nhắc'}
                  </div>
                </div>

                <p className="text-gray-300 mb-6">{aiDecision.summary}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Pros */}
                  <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/20">
                    <h4 className="font-bold text-green-400 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Điểm mạnh
                    </h4>
                    <ul className="space-y-2">
                      {aiDecision.pros.map((pro, i) => (
                        <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                          <span className="text-green-400 mt-1">•</span>
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cons */}
                  <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                    <h4 className="font-bold text-red-400 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Điểm yếu
                    </h4>
                    <ul className="space-y-2">
                      {aiDecision.cons.map((con, i) => (
                        <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                          <span className="text-red-400 mt-1">•</span>
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Actions */}
                {aiDecision.recommended_actions && aiDecision.recommended_actions.length > 0 && (
                  <div className="bg-white/5 p-4 rounded-xl">
                    <h4 className="font-bold text-cyan-400 mb-3">Hành động khuyến nghị</h4>
                    <div className="flex flex-wrap gap-2">
                      {aiDecision.recommended_actions.map((action, i) => (
                        <span key={i} className="text-xs bg-cyan-500/20 text-cyan-300 px-3 py-1.5 rounded-full">
                          {action}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 text-xs text-gray-500 text-right">
                  AI Score: {aiDecision.ai_score}/100 | Confidence: {aiDecision.confidence} | {aiDecision.processing_time_ms}ms
                </div>
              </div>
            )}

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

            {/* Alternatives */}
            <div className="glass-card rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white">Gợi ý thay thế gần hơn</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTravelMode('driving')}
                    className={`px-2 py-1 rounded text-xs font-bold transition-all ${travelMode === 'driving' ? 'bg-cyan-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                  >
                    Lái xe
                  </button>
                  <button
                    onClick={() => setTravelMode('walking')}
                    className={`px-2 py-1 rounded text-xs font-bold transition-all ${travelMode === 'walking' ? 'bg-cyan-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                  >
                    Đi bộ
                  </button>
                </div>
              </div>
              {originStatus === 'denied' && (
                <div className="text-xs text-yellow-300 mb-2">Không truy cập được vị trí, dùng trung tâm quận để ước tính.</div>
              )}
              {altLoading && <div className="text-sm text-gray-400">Đang tính toán gợi ý...</div>}
              {altError && <div className="text-sm text-red-400">{altError}</div>}
              {!altLoading && !altError && recommendations.length === 0 && (
                <div className="text-sm text-gray-400">Chưa có gợi ý tốt hơn trong quận.</div>
              )}
              <div className="space-y-3">
                {recommendations.map((rec) => {
                  const price = toNumber(rec.listing.price || rec.listing.price_million);
                  const priceDiffLabel = rec.priceDiff < 0 ? `- ${Math.abs(rec.priceDiff).toFixed(1)} Tr/tháng` : `+ ${rec.priceDiff.toFixed(1)} Tr/tháng`;
                  return (
                    <Link
                      key={rec.listing.id}
                      href={`/listing/${rec.listing.id}`}
                      className="block bg-white/5 hover:bg-white/10 rounded-xl p-3 border border-white/5 transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-white">{rec.listing.title || rec.listing.name}</div>
                          <div className="text-xs text-gray-400">{rec.listing.ward}, {rec.listing.district}</div>
                          <div className="mt-1 text-xs text-cyan-300">
                            {rec.distanceKm} km • ~{rec.etaMin} phút ({travelMode === 'walking' ? 'đi bộ' : 'lái xe'})
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-green-300">{price.toFixed(1)} Tr</div>
                          <div className={`text-xs ${rec.priceDiff <= 0 ? 'text-green-300' : 'text-red-300'}`}>{priceDiffLabel}</div>
                        </div>
                      </div>
                      {rec.betterOn.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {rec.betterOn.includes('ETA') && (
                            <span className="text-[11px] bg-cyan-500/20 text-cyan-200 px-2 py-1 rounded-full">Gần hơn</span>
                          )}
                          {rec.betterOn.includes('Giá') && (
                            <span className="text-[11px] bg-green-500/20 text-green-200 px-2 py-1 rounded-full">Giá tốt hơn</span>
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

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

            {/* Route to listing */}
            <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white">Chỉ đường đến mặt bằng</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTravelMode('driving')}
                    className={`px-2 py-1 rounded text-xs font-bold transition-all ${travelMode === 'driving' ? 'bg-cyan-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                  >
                    Lái xe
                  </button>
                  <button
                    onClick={() => setTravelMode('walking')}
                    className={`px-2 py-1 rounded text-xs font-bold transition-all ${travelMode === 'walking' ? 'bg-cyan-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                  >
                    Đi bộ
                  </button>
                </div>
              </div>
              {originStatus === 'denied' && (
                <div className="text-xs text-yellow-300">Không truy cập được vị trí, dùng trung tâm quận/city.</div>
              )}
              {(!origin && originStatus !== 'ok') && (
                <div className="text-xs text-gray-400">Bật vị trí để mở Google Maps.</div>
              )}
              {routeLoading && <div className="text-sm text-gray-400">Đang tính tuyến...</div>}
              {routeError && <div className="text-sm text-yellow-300">{routeError}</div>}
              {routeStats && (
                <div className="text-sm text-cyan-300">
                  {routeStats.distanceKm} km • ~{routeStats.etaMin} phút ({travelMode === 'walking' ? 'đi bộ' : 'lái xe'})
                </div>
              )}
              <div className="flex justify-end">
                <a
                  className={`text-xs font-bold px-3 py-2 rounded ${origin ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-white/10 text-gray-500 cursor-not-allowed'}`}
                  href={
                    origin
                      ? `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lon}&destination=${(listing.lat || listing.latitude)?.toString()},${(listing.lon || listing.longitude)?.toString()}&travelmode=${travelMode === 'walking' ? 'walking' : 'driving'}`
                      : undefined
                  }
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={!origin}
                >
                  Mở Google Maps
                </a>
              </div>
              <div className="h-64 rounded-lg overflow-hidden border border-white/10">
                {/* @ts-ignore */}
                <MapContainer
                  center={[
                    listing.lat || listing.latitude || 0,
                    listing.lon || listing.longitude || 0
                  ]}
                  zoom={13}
                  style={{ height: '100%', width: '100%', background: '#020617' }}
                >
                  <MapClickHandler />
                  {/* @ts-ignore */}
                  <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  />
                  {origin && (
                    // @ts-ignore
                    <CircleMarker
                      center={[origin.lat, origin.lon]}
                      pathOptions={{ fillColor: '#f97316', color: '#f97316', weight: 2, opacity: 1, fillOpacity: 0.9 }}
                      radius={7}
                    >
                      {/* @ts-ignore */}
                      <Popup>
                        <div className="p-2 text-xs text-white bg-slate-900 rounded-lg">Điểm xuất phát</div>
                      </Popup>
                    </CircleMarker>
                  )}
                  {/* destination */}
                  {/* @ts-ignore */}
                  <CircleMarker
                    center={[listing.lat || listing.latitude || 0, listing.lon || listing.longitude || 0]}
                    pathOptions={{ fillColor: '#22d3ee', color: '#22d3ee', weight: 2, opacity: 1, fillOpacity: 0.9 }}
                    radius={7}
                  >
                    {/* @ts-ignore */}
                    <Popup>
                      <div className="p-2 text-xs text-white bg-slate-900 rounded-lg">Mặt bằng</div>
                    </Popup>
                  </CircleMarker>
                  {routeCoords.length > 1 && (
                    // @ts-ignore
                    <Polyline
                      positions={routeCoords}
                      pathOptions={{ color: '#22d3ee', weight: 4, opacity: 0.9 }}
                    />
                  )}
                </MapContainer>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
