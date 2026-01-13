'use client';

import React, { useState } from 'react';
import { Map, MessageCircle, LayoutDashboard, Shuffle, Menu, X, Home, MapPin, Search } from 'lucide-react';

const navItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Tìm Kiếm', href: '/search', icon: Search },
  { name: 'Heatmap', href: '/map', icon: Map },
  { name: 'AI Analysis', href: '/analysis', icon: Shuffle },
  { name: 'Landlord', href: '/landlord', icon: MapPin },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
];

const JFinderLogo = () => (
  <div className="relative w-8 h-8 flex items-center justify-center">
    <div className="absolute inset-0 bg-cyan-500 blur-lg opacity-40 animate-pulse"></div>
    <svg className="w-8 h-8 relative z-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 12L12 22L22 12L12 2Z" stroke="#38bdf8" strokeWidth="2" fill="none" />
      <path d="M12 6L6 12L12 18L18 12L12 6Z" fill="#0ea5e9" className="opacity-80" />
    </svg>
  </div>
);

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  // @ts-ignore
  const NavLink = ({ item, onClick }) => {
    const Icon = item.icon;
    return (
      <a
        href={item.href}
        onClick={onClick}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full
                   text-gray-300 hover:text-white hover:bg-white/10 hover:shadow-[0_0_15px_rgba(56,189,248,0.3)]
                   transition-all duration-300 group border border-transparent hover:border-white/10"
      >
        <Icon className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
        {item.name}
      </a>
    );
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#020617]/50 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo Brand */}
          <a href="/" className="flex-shrink-0 flex items-center gap-3 group">
            <JFinderLogo />
            <span className="text-2xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 group-hover:to-cyan-300 transition-all duration-500">
              JFinder
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-2 bg-white/5 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md">
            {navItems.map((item) => (
              <NavLink key={item.name} item={item} onClick={() => { }} />
            ))}
          </div>



          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md
                         text-gray-400 hover:text-white hover:bg-white/10"
            >
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Content */}
      {isOpen && (
        <div className="md:hidden absolute w-full bg-[#020617]/95 backdrop-blur-xl border-b border-white/10">
          <div className="px-4 pt-4 pb-6 space-y-2">
            {navItems.map((item) => (
              <NavLink key={item.name} item={item} onClick={() => setIsOpen(false)} />
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
