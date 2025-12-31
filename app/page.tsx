export default function HomePage() {
  return (
    <div className="min-h-screen text-white font-sans selection:bg-cyan-500/30 selection:text-cyan-200">

      {/* BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        {/* Deep blue gradient background */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150 contrast-150 mix-blend-overlay"></div>
      </div>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-40 px-4 overflow-hidden">
        <div className="max-w-6xl mx-auto text-center relative z-10">


          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-xs font-bold tracking-widest text-cyan-300 uppercase">JFinder Intelligent System</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-tight">
            <span className="block text-white">Location Intelligence</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-gradient-x">
              Decoded by AI
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-400 mb-12 max-w-3xl mx-auto font-light leading-relaxed">
            Ngừng tìm kiếm cảm tính. Bắt đầu quyết định bằng dữ liệu.
            <strong className="text-cyan-200 font-semibold"> JFinder </strong>
            phân tích hàng triệu điểm dữ liệu để trả lời câu hỏi "Tại sao nên thuê ở đây?" thay vì chỉ "Giá bao nhiêu?".
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <a href="/map" className="relative group px-8 py-4 bg-cyan-500 rounded-full font-bold text-white shadow-[0_0_40px_-10px_rgba(6,182,212,0.5)] transition-all hover:scale-105 hover:bg-cyan-400 overflow-hidden">
              <span className="relative z-10 flex items-center gap-2">
                Tìm Mặt Bằng <span className="text-lg">→</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </a>
            <a href="/analysis" className="px-8 py-4 rounded-full font-semibold text-cyan-100 glass-panel hover:bg-white/5 hover:border-cyan-500/50 transition-all flex items-center gap-2">
              Chạy Phân tích AI
            </a>
          </div>
        </div>

        {/* Floating UI Elements Mockup */}
        <div className="mt-20 relative max-w-5xl mx-auto perspective-1000">
          <div className="glass-card p-4 rounded-2xl border border-white/10 shadow-2xl transform rotate-x-12 hover:rotate-x-0 transition-transform duration-700 ease-out">
            <div className="flex gap-4 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            {/* Mock Map Interface */}
            <div className="w-full h-[400px] bg-[#0f172a] rounded-xl relative overflow-hidden group">
              <div className="absolute inset-0 opacity-40 bg-[url('https://assets.website-files.com/62e8d2ea4a168c6e7a2a3e00/62e8d2ea4a168c78352a3e35_map.png')] bg-cover bg-center grayscale mix-blend-luminosity"></div>
              {/* Animated Heatmap Points */}
              <div className="absolute top-[40%] left-[30%] w-32 h-32 bg-cyan-500/30 rounded-full blur-2xl animate-pulse"></div>
              <div className="absolute top-[60%] right-[20%] w-40 h-40 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-700"></div>

              {/* Floating Card */}
              <div className="absolute bottom-6 left-6 glass-panel p-4 rounded-xl flex items-center gap-4 animate-float">
                <div className="bg-green-500/20 p-2 rounded-lg text-green-400">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Doanh thu Dự kiến</div>
                  <div className="text-lg font-bold text-white">45 Triệu <span className="text-green-400 text-sm">▲ 12%</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES */}
      <section className="py-32 px-4 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'Heatmap Intel', desc: 'Trực quan hóa vùng nóng về nhu cầu và giá thuê tức thì.', bg: 'from-orange-500/20 to-red-500/5' },
            { title: 'AI Valuation', desc: 'Ước tính giá thuê hợp lý dựa trên hàng triệu dữ liệu học máy.', bg: 'from-cyan-500/20 to-blue-500/5' },
            { title: 'Visual Search', desc: 'Tìm mặt bằng theo phong cách kiến trúc tương đồng bằng hình ảnh.', bg: 'from-purple-500/20 to-pink-500/5' },
          ].map((feature, idx) => (
            <div key={idx} className="glass-card p-8 rounded-2xl hover:bg-white/5 transition-all duration-300 group hover:-translate-y-2">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.bg} mb-6 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform`}>
                <div className="w-6 h-6 bg-white/50 rounded-full blur-md"></div>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed translate-y-0 opacity-90">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
