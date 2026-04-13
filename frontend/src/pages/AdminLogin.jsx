import React from 'react';
import { Link } from 'react-router-dom';

function AdminLogin() {
  return (
    <div className="bg-background font-body text-on-surface min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0">
        <img className="w-full h-full object-cover opacity-20 blur-[2px]" data-alt="cinematic wide shot of a futuristic dark metro tunnel with subtle cyan glowing lines and atmospheric haze" src="https://lh3.googleusercontent.com/aida-public/AB6AXuApuXftX9EJn3yjiZPr3dWq4xMnGSdB3aAZBTi9hGEVdCly2HpMeIjQ0Zmq22c3ng7tI_D3OsasUJiBBaRFAfAzYFk5NiBmMcyLnWde_RLoVo3EwoRaWsxByQEHwzxT6BYp9GfSFM7DxRU7v_4uppPWBjcuC-MDK3wwD5EQ7SKHH0vLZOlpqnuRCwgxam_thJzPwlSrBUkKjc5g2h6QW2WOEXJC5Xysy5ZGA6wmlhU_TBrO-85HAbOhUkjJaMcee1R8BIFn1_dwa30b" alt="Background" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background"></div>
      </div>
      {/* Main Login Container */}
      <main className="relative z-10 w-full max-w-[480px] px-6 py-12">
        {/* glass-bg translated to Tailwind classes */}
        <div className="bg-[#181c23]/80 backdrop-blur-[20px] border border-outline-variant/15 rounded-xl p-8 shadow-2xl">
          {/* Header Section */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 bg-primary-container/30 rounded-full flex items-center justify-center mb-4 border border-primary/20">
              <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
            </div>
            <h1 className="font-headline text-2xl font-bold text-on-surface mb-1">Admin Control Access</h1>
            <p className="text-on-surface-variant text-sm tracking-wide">Secure Terminal Entry Protocol</p>
          </div>
          {/* Form */}
          <form className="space-y-5">
            {/* Organization Dropdown */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant ml-1">Organization / Authority</label>
              <div className="relative group">
                <select className="w-full h-12 bg-surface-container-lowest border-none rounded-lg px-4 text-on-surface appearance-none focus:ring-1 focus:ring-primary/30 transition-all cursor-pointer">
                  <option>DMRC - Delhi Metro Rail Corp</option>
                  <option>MTA - Metropolitan Transit Authority</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-3 text-outline pointer-events-none">expand_more</span>
              </div>
            </div>
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant ml-1">Official Email</label>
              <div className="relative">
                <input className="w-full h-12 bg-surface-container-lowest border-none rounded-lg px-4 pl-11 text-on-surface placeholder:text-outline/50 focus:ring-1 focus:ring-primary/30 transition-all" placeholder="admin@metro.gov" type="email" />
                <span className="material-symbols-outlined absolute left-4 top-3 text-outline text-lg">alternate_email</span>
              </div>
            </div>
            {/* Operator ID & Password Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant ml-1">Operator ID</label>
                <input className="w-full h-12 bg-surface-container-lowest border-none rounded-lg px-4 text-on-surface placeholder:text-outline/50 focus:ring-1 focus:ring-primary/30 transition-all" placeholder="OP-10234" type="text" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant ml-1">Password</label>
                <input className="w-full h-12 bg-surface-container-lowest border-none rounded-lg px-4 text-on-surface placeholder:text-outline/50 focus:ring-1 focus:ring-primary/30 transition-all" placeholder="••••••••" type="password" />
              </div>
            </div>
            {/* Toggles & Links */}
            <div className="flex flex-col gap-4 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative inline-flex h-5 w-9 items-center rounded-full bg-surface-container-highest cursor-pointer group">
                    <input className="sr-only peer" id="2fa" type="checkbox" />
                    <div className="peer h-5 w-9 rounded-full bg-surface-container-highest transition-colors peer-checked:bg-primary-container"></div>
                    <div className="absolute left-1 h-3 w-3 rounded-full bg-on-surface-variant transition-transform peer-checked:translate-x-4 peer-checked:bg-on-primary-container"></div>
                  </div>
                  <label className="text-sm text-on-surface-variant cursor-pointer" htmlFor="2fa">2-Factor Authentication</label>
                </div>
                <a className="text-sm text-primary hover:text-primary-fixed transition-colors font-medium" href="#">Forgot Password?</a>
              </div>
              <div className="flex items-center gap-2">
                <input className="w-4 h-4 rounded bg-surface-container-lowest border-none text-primary-container focus:ring-0 focus:ring-offset-0" id="remember" type="checkbox" />
                <label className="text-sm text-on-surface-variant" htmlFor="remember">Remember this device</label>
              </div>
            </div>
            {/* Primary CTA */}
            <button className="w-full h-12 bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-headline font-bold rounded-lg shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2" type="button">
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>login</span>
              Login to Control System
            </button>
            {/* Secondary Link */}
            <div className="pt-4 text-center">
              <Link className="text-sm text-outline hover:text-on-surface transition-colors inline-flex items-center gap-2 group" to="/login">
                Switch to Passenger Login
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </Link>
            </div>
          </form>
        </div>
        {/* Warning Notice */}
        <div className="mt-8 p-4 rounded-lg bg-error-container/10 border border-error/20 flex gap-4">
          <span className="material-symbols-outlined text-error shrink-0">warning</span>
          <p className="text-[11px] leading-relaxed text-error font-medium uppercase tracking-wider">
            This portal is restricted to authorized metro personnel. Unauthorized access is prohibited and subject to federal surveillance and legal prosecution.
          </p>
        </div>
      </main>
      {/* Footer (Shell Implementation) */}
      <footer className="fixed bottom-0 w-full z-40 flex flex-col md:flex-row justify-between items-center px-8 py-4 gap-4 bg-[#0f141a] border-t border-[#40484f]/15">
        <p className="font-body text-[10px] uppercase tracking-widest text-[#8a919a]">
          © 2024 BheedMitra Smart City Solutions. All Rights Reserved. Enterprise Grade Security.
        </p>
        <div className="flex gap-6">
          <a className="font-body text-[10px] uppercase tracking-widest text-[#8a919a] hover:text-[#dfe2ec] transition-colors" href="#">Privacy Policy</a>
          <a className="font-body text-[10px] uppercase tracking-widest text-[#8a919a] hover:text-[#dfe2ec] transition-colors" href="#">Terms of Service</a>
          <a className="font-body text-[10px] uppercase tracking-widest text-[#8a919a] hover:text-[#dfe2ec] transition-colors" href="#">Security Audit</a>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            <span className="font-body text-[10px] uppercase tracking-widest text-[#5cd7e5]">System Status: Nominal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default AdminLogin;
