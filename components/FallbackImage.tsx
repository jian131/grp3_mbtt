'use client';

import Image from 'next/image';
import { useState } from 'react';
import { MapPin } from 'lucide-react';

// Fallback placeholder images (reliable sources)
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80', // Restaurant
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80', // Store interior
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80', // Office
  'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80', // Modern office
  'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80', // Cafe
];

interface FallbackImageProps {
  src: string | undefined;
  alt: string;
  fill?: boolean;
  className?: string;
  fallbackIndex?: number;
}

export default function FallbackImage({
  src,
  alt,
  fill = true,
  className = '',
  fallbackIndex = 0
}: FallbackImageProps) {
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleError = () => {
    if (!error) {
      setError(true);
      // Use a consistent fallback based on the alt text hash
      const hash = alt.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const fallbackIdx = (hash + fallbackIndex) % FALLBACK_IMAGES.length;
      setCurrentSrc(FALLBACK_IMAGES[fallbackIdx]);
    }
  };

  if (!currentSrc || (error && !currentSrc)) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-gray-600">
        <div className="text-center">
          <MapPin className="w-12 h-12 mx-auto mb-2 text-cyan-500/30" />
          <span className="text-xs text-gray-500">Không có ảnh</span>
        </div>
      </div>
    );
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill={fill}
      className={className}
      onError={handleError}
      unoptimized // Skip Next.js image optimization for external URLs
    />
  );
}
