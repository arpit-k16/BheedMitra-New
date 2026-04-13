import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <>
      {/* Top Navigation Shell */}
      <header className="w-full top-0 sticky z-50 glass-nav">
        <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
          <div className="text-2xl font-bold tracking-tight text-[#dfe2ec] font-headline">BheedMitra</div>
          <div className="flex items-center gap-6">
            <Link className="text-[#c0c7d0] hover:text-[#5cd7e5] transition-colors duration-200 text-sm font-medium" to="/login">Login</Link>
            <Link className="bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed px-5 py-2 rounded-xl text-sm font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all" to="/signup">Sign Up</Link>
          </div>
        </div>
      </header>
      <main>
        {/* Section 1: HERO */}
        <section className="relative min-h-[921px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-surface/40 via-surface/80 to-surface z-10"></div>
            <img className="w-full h-full object-cover grayscale opacity-40" data-alt="cinematic long exposure of a modern underground metro station platform with blurred light trails of a departing train at night" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBM75G6HWwhNuk2JSyETRZeqR59cZkdjxw8bYFhwTNk9eqMkXgAGVFIMBwblFHr3teQ1Fzlqej77_WXr_x_7RAFLoVRAm6Qy9PSYJZ5Quz3BKeBgAc5LChXx4mOC3w44-Wj4BHoYUBrcmdA3cWeweOmRVdkBgfzItqSo-I3UNE-r6oOvxh7D5XuibDw3kt88S9GxQJ9Xkwu9I7vq5xycrjLc_GZr1TfvzaKLwc9TKzc-KSpBpyTp5BvjslTZDdSseaNqJDpjF9-tj1d" alt="Hero background" />
            {/* Abstract transit line overlay */}
            <svg className="absolute top-0 left-0 w-full h-full opacity-10" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path d="M-10,50 Q25,10 50,50 T110,50" fill="none" stroke="#5cd7e5" strokeWidth="0.2"></path>
              <path d="M-10,60 Q30,20 60,60 T110,60" fill="none" stroke="#5cd7e5" strokeWidth="0.1"></path>
            </svg>
          </div>
          <div className="relative z-20 max-w-5xl mx-auto px-8 text-center">
            <h1 className="text-6xl md:text-8xl font-extrabold font-headline tracking-tighter text-on-surface mb-6 leading-[1.1]">
              BheedMitra
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-on-surface-variant mb-10 leading-relaxed">
              Making metro systems safer, smarter, and more efficient through data-driven insights. Designed for the high-density pulses of modern megacities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup" className="px-8 py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-bold rounded-xl shadow-xl hover:brightness-110 transition-all flex items-center justify-center gap-2">
                Get Started
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
              <Link to="/live-map" className="px-8 py-4 bg-surface-container text-on-surface font-semibold rounded-xl border border-outline-variant/30 hover:bg-surface-container-high transition-all">
                View Live Map
              </Link>
            </div>
          </div>
        </section>
        {/* Section 2: ABOUT THE PLATFORM */}
        <section className="py-24 px-8 bg-surface">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row gap-16 items-end mb-20">
              <div className="md:w-1/2">
                <h2 className="text-4xl font-extrabold font-headline mb-6">What is BheedMitra?</h2>
                <p className="text-xl text-on-surface-variant leading-relaxed">
                  BheedMitra uses AI-based crowd prediction to help passengers plan journeys and authorities manage congestion effectively. By analyzing millions of data points, we turn transit chaos into structured intelligence.
                </p>
              </div>
              <div className="md:w-1/2 flex justify-end">
                <div className="h-1 w-24 bg-primary rounded-full mb-4"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature Card 1 */}
              <div className="p-8 rounded-xl bg-surface-container-low border-b-2 border-transparent hover:border-primary transition-all group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <span className="material-symbols-outlined text-primary" data-icon="query_stats">query_stats</span>
                </div>
                <h3 className="text-xl font-bold font-headline mb-4">Crowd Prediction</h3>
                <p className="text-on-surface-variant leading-relaxed">
                  Forecast arrival and density patterns using proprietary deep learning models trained on multi-year transit data.
                </p>
              </div>
              {/* Feature Card 2 */}
              <div className="p-8 rounded-xl bg-surface-container-low border-b-2 border-transparent hover:border-primary transition-all group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <span className="material-symbols-outlined text-primary" data-icon="route">route</span>
                </div>
                <h3 className="text-xl font-bold font-headline mb-4">Smart Route Planning</h3>
                <p className="text-on-surface-variant leading-relaxed">
                  Optimize journeys based on real-time loads. Redirect commuters to less crowded carriages and alternative routes dynamically.
                </p>
              </div>
              {/* Feature Card 3 */}
              <div className="p-8 rounded-xl bg-surface-container-low border-b-2 border-transparent hover:border-primary transition-all group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <span className="material-symbols-outlined text-primary" data-icon="hub">hub</span>
                </div>
                <h3 className="text-xl font-bold font-headline mb-4">Real-time Insights</h3>
                <p className="text-on-surface-variant leading-relaxed">
                  Immediate visibility into station health. Automated alerts for station managers to deploy resources exactly where they are needed.
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* Section 3: INSPIRED BY REAL METRO SYSTEMS */}
        <section id="systems" className="py-24 px-8 bg-surface-container-lowest">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-extrabold font-headline mb-4">Inspired by Leading Metro Networks</h2>
              <p className="text-on-surface-variant">Global intelligence, locally optimized architectures.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* MTA */}
              <div className="relative group aspect-[4/5] rounded-xl overflow-hidden bg-primary/5 ring-2 ring-primary">
                <img className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700" data-alt="atmospheric shot of a New York City MTA subway train entering a station with motion blur and city lights" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCIkFpzZ1lZI6Uq-btA1cq64b5ag1voTl2DZKAesVnFZuHna9ViNdKyW2bf9MYGcGduo_OP82fBQJ60PHXydCLPkXRR05_Admdkj3dpNpQkK22_JdqBgKjtkWEZcQCLDrZZKhS1_leAS8_ykNp-8SHOf1TNXH_Z20c8O4kcMM6W082sANw20rtlCuYNfdTC0Rcd5N9yWiwrPcAArmmmn-UVuhZaPm_488EdSmeWL7uptmtGatpMzcJCbyZ3E-5cQXq58RFO2Y4XUsjX" alt="MTA Metro" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-container/80 via-transparent to-transparent"></div>
                <div className="absolute top-4 right-4 bg-primary text-on-primary-fixed px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter">Live Prototype</div>
                <div className="absolute bottom-0 left-0 p-6 w-full">
                  <div className="text-xs font-bold text-on-primary-container mb-2 uppercase tracking-widest">USA 🇺🇸</div>
                  <h4 className="text-xl font-bold font-headline text-on-surface">MTA</h4>
                  <div className="mt-4 flex items-center gap-2 text-xs text-on-primary-container">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    Current Implementation
                  </div>
                </div>
              </div>
              {/* DMRC - Highlighted */}
              <div className="relative group aspect-[4/5] rounded-xl overflow-hidden bg-primary/5 ring-2 ring-primary">
                <img className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700" data-alt="clean modern Delhi Metro train on an elevated track with clear blue sky in the background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBcTjdTBnoTvW0cuOd4tWo9kERfdLhusZfRNBmW5HRWigv2No-Eu4UpJYo-lAc_cKpZuyWyGMXpkxwEwXwQqB14qLbzwyB5Ik17BduMiiVePvCPK5zNWWRzciFTrZzC9O_z7t15tliEQlqv2jSqWwUDzRiND5PBsv8BcavzohXiH4YRVZEQPCpunbWxKb-7vkzFMa6Vdj45KecIF_Ut_JOOU15yXUd_wl3elVT2TyvClKYo8aNF0_3eK-54Y5CEs6pEUY29Z8f7S0fL" alt="DMRC Metro" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-container/80 via-transparent to-transparent"></div>
                <div className="absolute top-4 right-4 bg-primary text-on-primary-fixed px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter">Live Prototype</div>
                <div className="absolute bottom-0 left-0 p-6 w-full">
                  <div className="text-xs font-bold text-on-primary-container mb-2 uppercase tracking-widest">India 🇮🇳</div>
                  <h4 className="text-xl font-bold font-headline text-on-surface">DMRC</h4>
                  <div className="mt-4 flex items-center gap-2 text-xs text-on-primary-container">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    Current Implementation
                  </div>
                </div>
              </div>
              {/* MMRC */}
              <div className="relative group aspect-[4/5] rounded-xl overflow-hidden bg-surface-container">
                <img className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale group-hover:scale-110 transition-transform duration-700" data-alt="futuristic architectural concept of an underground transit station with modern lighting and sleek surfaces" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGyD5lUyrRxBrUJwM3unqmssS_I_9pGvxU_6Rd3ODgaz-I2VZoLaJSUSPNyZ_5-Euh5VZ6Xql9_SPPnHXZF3iTAMme91ydsJ8n8oPybTh4CLrnkXnsbjRIItN1vivaBkSxDaTlcxM10y8TeUNWjtnIftken-PN9VxtW-nrQ8BpcQKBvIP2KPCeBeJ8bsl9fn5psg39CApS2ZxfTVVMPSll1_jRle9sUNi2e1PyMN3ZbmNgOXX246rioyyXbd4LV_Vo9_zUVv4eFJ9c" alt="MMRC Metro" />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6 w-full">
                  <div className="text-xs font-bold text-outline mb-2 uppercase tracking-widest">India 🇮🇳</div>
                  <h4 className="text-xl font-bold font-headline">MMRC</h4>
                  <div className="mt-4 flex items-center gap-2 text-xs text-on-surface-variant">
                    <span className="w-2 h-2 rounded-full bg-surface-container-highest"></span>
                    Expansion in progress
                  </div>
                </div>
              </div>
              {/* BMRCL */}
              <div className="relative group aspect-[4/5] rounded-xl overflow-hidden bg-surface-container">
                <img className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale group-hover:scale-110 transition-transform duration-700" data-alt="cityscape of Bangalore with metro track viaducts running through urban greenery at sunset" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1xuSFw4y3oW4iKVhzlajZBe6VFVzbaia6UVkU8HByrkvX5RoRn0mz3F16QaYDC-Z11s0DuekDPsjZJx86r3N9BoiwkEtBgDSPtCnSTvExz-E7MnTxQAo_qMAIGJSKzypYmaEf7ZzYXtc_pYIoYSlXWwqL1urrnFb7uuqkWNeV3URyVPhoph3xh9g0ls4rmtLSdJXtauh1LoWH4opgzf1lTjFkpJ8T1XIN88HR5BHRCa-zYVtQgKHFgIUwmBlKY5XFomjNasP8uhF6" alt="BMRCL Metro" />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6 w-full">
                  <div className="text-xs font-bold text-outline mb-2 uppercase tracking-widest">India 🇮🇳</div>
                  <h4 className="text-xl font-bold font-headline">BMRCL</h4>
                  <div className="mt-4 flex items-center gap-2 text-xs text-on-surface-variant">
                    <span className="w-2 h-2 rounded-full bg-surface-container-highest"></span>
                    Expansion in progress
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Section 4: GET STARTED (CTA) */}
        <section id="about" className="py-24 px-8 relative overflow-hidden">
          <div className="absolute inset-0 hero-gradient opacity-10 blur-[100px] -z-10 transform translate-y-1/2"></div>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold font-headline mb-6">Ready to Experience Smarter Transit?</h2>
            <p className="text-xl text-on-surface-variant mb-12">
              Join the future of urban mobility with AI-powered insights. Start your implementation or explore our interactive sandbox today.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link to="/signup" className="w-full sm:w-auto px-10 py-5 bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-extrabold text-lg rounded-xl shadow-[0_10px_30px_rgba(92,215,229,0.3)] hover:scale-105 active:scale-95 transition-all inline-flex items-center justify-center">
                Get Started
              </Link>
              <button className="w-full sm:w-auto px-10 py-5 bg-surface-container-high text-on-surface font-bold text-lg rounded-xl border border-outline-variant/50 hover:bg-surface-bright transition-all flex items-center justify-center gap-3">
                <span className="material-symbols-outlined" data-icon="play_circle">play_circle</span>
                Explore Demo
              </button>
            </div>
          </div>
        </section>
      </main>
      {/* Footer */}
      <footer className="bg-surface-dim border-t border-outline-variant/15">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 py-12 w-full max-w-7xl mx-auto">
          <div className="mb-8 md:mb-0 text-center md:text-left">
            <div className="text-lg font-semibold text-[#dfe2ec] font-headline mb-2">BheedMitra</div>
            <p className="text-xs text-on-surface-variant max-w-xs uppercase tracking-widest font-label">
              Smart Transit Intelligence Platform. Multi-city version under development.
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end">
            <div className="text-[10px] text-outline uppercase tracking-[0.2em]">
              © 2024 BheedMitra. Platform Status: <span className="text-primary font-bold">Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Home;
