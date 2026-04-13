/**
 * Dashboard Layout - Main layout wrapper for authenticated pages
 * Includes sidebar navigation and header
 * Design matching Stitch UI - BheedMitra Admin/Passenger Panel
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import api from '../services/api';

const navItems = {
  passenger: [
    { path: '/dashboard', icon: 'home', label: 'Home' },
    { path: '/journey', icon: 'route', label: 'Journey Planner' },
    { path: '/insights', icon: 'train', label: 'Station View' },
    { path: '/saved', icon: 'bookmark', label: 'Saved Routes' },
  ],
  admin: [
    { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { path: '/maps', icon: 'map', label: 'Transit Map' },
    { path: '/alerts', icon: 'notifications_active', label: 'Alerts', badge: 3 },
    { path: '/reports', icon: 'assessment', label: 'Reports' },
  ]
};

function DashboardLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout, selectedSystem, demoMode } = useStore();
  const [apiStatus, setApiStatus] = useState({ status: 'checking', stations: 0 });

  // Check API connection on mount
  useEffect(() => {
    const checkApi = async () => {
      try {
        console.log('[DashboardLayout] Checking API health...');
        const health = await api.healthCheck(selectedSystem);
        console.log('[DashboardLayout] Health response:', health);
        setApiStatus({ 
          status: 'connected', 
          stations: health.total_stations || 0,
          records: health.data_records || 0
        });
      } catch (error) {
        console.error('[DashboardLayout] API check failed:', error);
        setApiStatus({ status: 'offline', stations: 0 });
      }
    };
    checkApi();
    const interval = setInterval(checkApi, 30000);
    return () => clearInterval(interval);
  }, [selectedSystem]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const items = navItems[role] || navItems.passenger;

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body flex">
      {/* Sidebar - Fixed */}
      <aside className="h-screen w-64 fixed left-0 top-0 z-40 bg-surface-container-low flex flex-col border-r border-outline-variant/15">
        {/* Logo Section */}
        <div className="px-6 py-8">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-on-primary-fixed" style={{fontVariationSettings: "'FILL' 1"}}>
                {role === 'admin' ? 'train' : 'directions_transit'}
              </span>
            </div>
            <div>
              <h1 className="text-lg font-black text-primary font-headline tracking-tighter">BheedMitra</h1>
              <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                {role === 'admin' ? 'System Orchestrator' : 'Smart Transit'}
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          {items.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-manrope text-sm font-semibold ${
                  isActive
                    ? 'bg-surface-container text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface hover:translate-x-1'
                }`}
              >
                <span 
                  className="material-symbols-outlined"
                  style={isActive ? {fontVariationSettings: "'FILL' 1"} : {}}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto bg-error-container text-on-error-container text-[10px] px-1.5 py-0.5 rounded font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* System Status Card */}
        <div className="px-4 pb-4">
          <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/10">
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-2">System Status</p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                apiStatus.status === 'connected' ? 'bg-primary' : 
                apiStatus.status === 'checking' ? 'bg-yellow-500' : 'bg-red-500'
              } animate-pulse`}></div>
              <span className="text-xs font-medium text-on-surface">
                {apiStatus.status === 'connected' ? 'API Online' : 
                 apiStatus.status === 'checking' ? 'Connecting...' : 'Offline Mode'}
              </span>
            </div>
            <p className="text-[10px] text-on-surface-variant mt-2">
              {apiStatus.status === 'connected' 
                ? `${apiStatus.stations} stations • ${(apiStatus.records / 1000000).toFixed(1)}M records`
                : apiStatus.status === 'checking' 
                ? 'Checking backend...'
                : 'Using demo data'}
            </p>
          </div>
        </div>

        {/* User Section & Logout */}
        <div className="p-4 border-t border-outline-variant/15 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center border border-outline-variant/20 overflow-hidden">
              <span className="text-sm font-bold text-primary">
                {user?.name?.[0]?.toUpperCase() || role?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-on-surface truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-on-surface-variant capitalize">{role} • {selectedSystem}</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-error/80 hover:bg-error-container/20 transition-all text-sm font-semibold"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        {/* Header */}
        <header className="fixed top-0 left-64 right-0 z-50 h-16 bg-surface-container-low/80 backdrop-blur-xl border-b border-outline-variant/10 flex items-center justify-between px-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-high rounded-lg">
              <span className="text-on-surface-variant text-xs">System:</span>
              <span className="font-semibold text-primary text-sm">{selectedSystem}</span>
            </div>
            {user?.station && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-high rounded-lg">
                <span className="text-on-surface-variant text-xs">Station:</span>
                <span className="font-semibold text-on-surface text-sm">{user.station}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Live Indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 border border-primary-container/30 rounded-full">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="text-[10px] font-bold tracking-widest text-primary uppercase">Live</span>
            </div>

            {/* Demo Mode Badge */}
            {demoMode && (
              <div className="px-3 py-1.5 bg-tertiary-container/20 border border-tertiary/20 rounded-lg text-tertiary text-[10px] font-bold uppercase tracking-wider">
                Demo Mode
              </div>
            )}

            {/* Notifications */}
            <button className="p-2 text-on-surface-variant hover:bg-surface-variant/40 transition-colors rounded-lg relative">
              <span className="material-symbols-outlined">notifications</span>
              {role === 'admin' && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full"></span>
              )}
            </button>

            {/* Settings */}
            <button className="p-2 text-on-surface-variant hover:bg-surface-variant/40 transition-colors rounded-lg">
              <span className="material-symbols-outlined">settings</span>
            </button>

            <div className="h-8 w-px bg-outline-variant/30"></div>

            {/* User Avatar */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-on-surface">{user?.name || 'User'}</p>
                <p className="text-[10px] text-on-surface-variant capitalize">{role}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary-fixed font-bold ring-2 ring-primary/20">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 pt-16 min-h-screen">
          <div className="p-8">
            {children}
          </div>
        </main>

        {/* Status Footer */}
        <footer className="hidden md:flex fixed bottom-0 left-64 right-0 bg-surface-container-lowest py-2 px-6 border-t border-outline-variant/10 justify-between items-center text-[10px] tracking-wider font-bold text-outline uppercase">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${
                apiStatus.status === 'connected' ? 'bg-primary' : 'bg-yellow-500'
              } animate-pulse`}></span>
              {apiStatus.status === 'connected' 
                ? 'Backend Connected' 
                : apiStatus.status === 'checking' 
                ? 'Connecting to API...'
                : 'Demo Mode Active'}
            </span>
            <span className="text-outline/40">|</span>
            <span>BheedMitra v3.0</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-on-surface-variant/60">
              {apiStatus.status === 'connected' 
                ? `${apiStatus.stations} stations loaded`
                : 'Using fallback data'}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default DashboardLayout;
