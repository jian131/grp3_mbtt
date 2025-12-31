'use client';

import React from 'react';
import { Mail, Map, Shuffle, MapPin, Github } from 'lucide-react';

export default function Footer() {
  const Links = [
    { name: 'Heatmap', href: '/map', icon: Map },
    { name: 'AI Decision', href: '/analysis', icon: Shuffle },
    { name: 'Landlord', href: '/landlord', icon: MapPin },
  ];

  return (
    <footer className="w-full relative py-12 overflow-hidden border-t border-white/5">
      {/* Background Glows */}
      <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-cyan-900/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">

          {/* Brand */}
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-2">
              JFinder System
            </h2>
            <p className="text-gray-500 text-sm">
              Location Intelligence & Smart Rental Decision Support.
            </p>
          </div>

          {/* Navigation */}
          <div className="flex gap-6">
            {Links.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-gray-400 hover:text-cyan-400 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </a>
            ))}
          </div>

          {/* Social / Contact */}
          <div className="flex gap-4">
            <a href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/10 hover:text-cyan-400 text-gray-400 transition-all">
              <Github className="w-5 h-5" />
            </a>
            <a href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/10 hover:text-cyan-400 text-gray-400 transition-all">
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div className="mt-12 text-center border-t border-white/5 pt-8">
          <p className="text-gray-600 text-xs">
            © 2025 JFinder Intelligence. Powered by Data.
          </p>
        </div>
      </div>
    </footer>
  );
}
