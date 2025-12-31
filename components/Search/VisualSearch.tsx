'use client';

import { useState } from 'react';
import { Camera, Upload, Search, ScanLine } from 'lucide-react';
import Image from 'next/image';

export default function VisualSearch() {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
      {/* Scanning Line Animation Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 translate-y-[-100%] animate-[scan_3s_ease-in-out_infinite] pointer-events-none"></div>

      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 relative z-10">
        <ScanLine className="w-5 h-5 text-cyan-400" />
        <span className="text-gradient-blue">Tìm kiếm hình ảnh</span>
      </h3>

      <div className="space-y-4 relative z-10">
        <div className="border border-dashed border-white/20 hover:border-cyan-500/50 hover:bg-cyan-500/5 rounded-xl p-8 text-center transition-all cursor-pointer relative group">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          />

          {preview ? (
            <div className="relative h-48 w-full">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-contain rounded-lg shadow-2xl"
              />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setPreview(null);
                }}
                className="absolute top-2 right-2 bg-black/60 backdrop-blur text-white p-1.5 rounded-full hover:bg-red-500/80 transition-colors z-30"
              >
                x
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Camera className="w-6 h-6 text-cyan-400" />
              </div>
              <p className="text-gray-300 font-medium text-sm">Tải lên ảnh cửa hàng mẫu</p>
              <span className="text-xs text-gray-500">AI sẽ tìm kiến trúc tương đồng</span>
            </div>
          )}
        </div>

        <button
          disabled={!preview}
          className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 text-sm
            ${preview
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
              : 'bg-white/5 text-gray-500 cursor-not-allowed'
            }`}
        >
          <Search className="w-4 h-4" />
          Tìm Theo Ảnh
        </button>
      </div>
    </div>
  );
}
