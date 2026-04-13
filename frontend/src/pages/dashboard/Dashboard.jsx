/**
 * Dashboard Page - Main analytics dashboard
 * Redesigned to match Stitch UI - Admin Panel Dashboard / Passenger Home
 */

import React, { useState, useEffect } from 'react';
import useStore from '../../store/useStore';
import api from '../../services/api';

function Dashboard() {
  const { role, selectedSystem, user } = useStore();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [selectedSystem]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      console.log('Fetching analytics from API...');
      const data = await api.getAnalytics(selectedSystem);
      console.log('API Response:', data);
      if (data && data.total_records !== undefined) {
        setAnalytics(data);
      } else {
        console.warn('Invalid API response, using mock data');
        setAnalytics(getMockAnalytics());
      }
    } catch (error) {
      console.error('API Error:', error);
      setAnalytics(getMockAnalytics());
    } finally {
      setLoading(false);
    }
  };

  const getMockAnalytics = () => ({
    total_records: 2500000,
    unique_stations: 286,
    avg_crowd_level: 2.8,
    avg_wait_time: 4.2,
    congestion_index: 68,
    active_alerts: 3,
    peak_stations: {
      'Rajiv Chowk': 4.2,
      'Kashmere Gate': 3.9,
      'Central Secretariat': 3.7,
      'New Delhi': 3.5,
      'Hauz Khas': 3.4
    }
  });

  // Merge API data with defaults for missing fields
  const mergeWithDefaults = (apiData) => {
    const defaults = getMockAnalytics();
    return {
      ...defaults,
      ...apiData,
      congestion_index: apiData.congestion_index ?? Math.round((apiData.avg_crowd_level / 5) * 100) ?? defaults.congestion_index,
      active_alerts: apiData.active_alerts ?? defaults.active_alerts
    };
  };

  const data = analytics ? mergeWithDefaults(analytics) : getMockAnalytics();
  
  // Show data source for debugging
  console.log('[Dashboard] Displaying data:', data, 'From API:', !!analytics);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-on-surface-variant">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  if (role === 'admin') {
    return <AdminDashboard data={data} user={user} selectedSystem={selectedSystem} onRefresh={loadDashboardData} />;
  }

  // Passenger Dashboard
  return <PassengerDashboard data={data} user={user} selectedSystem={selectedSystem} />;
}

// Admin Dashboard Component
function AdminDashboard({ data, user, selectedSystem, onRefresh }) {
  const crowdLevel = data.avg_crowd_level > 3 ? 'High' : data.avg_crowd_level > 2 ? 'Medium' : 'Low';
  const crowdLevelColor = crowdLevel === 'High' ? 'text-error' : crowdLevel === 'Medium' ? 'text-tertiary' : 'text-primary';
  
  return (
    <div className="space-y-8">
      {/* KPI Cards Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface-container-low p-6 rounded-xl space-y-4">
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-error p-2 bg-error-container/20 rounded-lg">groups</span>
            <span className="text-[10px] font-bold text-error uppercase tracking-widest bg-error-container/20 px-2 py-0.5 rounded-full">
              {crowdLevel === 'High' ? 'High Risk' : crowdLevel === 'Medium' ? 'Elevated' : 'Normal'}
            </span>
          </div>
          <div>
            <p className="text-on-surface-variant text-sm">Current Crowd Level</p>
            <h3 className={`text-3xl font-headline font-bold ${crowdLevelColor} mt-1`}>{crowdLevel}</h3>
          </div>
        </div>

        <div className="bg-surface-container-low p-6 rounded-xl space-y-4">
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-tertiary p-2 bg-tertiary-container/20 rounded-lg">traffic</span>
            <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest bg-tertiary-container/20 px-2 py-0.5 rounded-full">
              {data.congestion_index > 70 ? 'Elevated' : 'Moderate'}
            </span>
          </div>
          <div>
            <p className="text-on-surface-variant text-sm">Congestion Index</p>
            <h3 className="text-3xl font-headline font-bold text-on-surface mt-1">{data.congestion_index}%</h3>
          </div>
        </div>

        <div className="bg-surface-container-low p-6 rounded-xl space-y-4">
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-tertiary p-2 bg-tertiary-container/20 rounded-lg">timer</span>
            <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest bg-tertiary-container/20 px-2 py-0.5 rounded-full">Moderate</span>
          </div>
          <div>
            <p className="text-on-surface-variant text-sm">Avg Waiting Time</p>
            <h3 className="text-3xl font-headline font-bold text-on-surface mt-1">
              {Math.round(data.avg_wait_time * 3)} <span className="text-sm font-normal text-on-surface-variant">mins</span>
            </h3>
          </div>
        </div>

        <div className="bg-surface-container-low p-6 rounded-xl space-y-4">
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-error p-2 bg-error-container/20 rounded-lg">warning</span>
            <span className="text-[10px] font-bold text-error uppercase tracking-widest bg-error-container/20 px-2 py-0.5 rounded-full">Critical</span>
          </div>
          <div>
            <p className="text-on-surface-variant text-sm">Active Alerts</p>
            <h3 className="text-3xl font-headline font-bold text-on-surface mt-1">{data.active_alerts}</h3>
          </div>
        </div>
      </section>

      {/* Layout Grid */}
      <div className="grid grid-cols-12 gap-8">
        {/* Live Alerts & Suggested Actions */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          {/* Live Alerts Panel */}
          <div className="bg-surface-container-low rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant/10 flex justify-between items-center">
              <h3 className="font-headline font-bold text-on-surface">Live Alerts</h3>
              <span className="material-symbols-outlined text-on-surface-variant">bolt</span>
            </div>
            <div className="p-4 space-y-4">
              <div className="p-4 rounded-lg bg-error-container/10 border-l-4 border-error">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-error uppercase">High Priority</span>
                  <span className="text-[10px] text-on-surface-variant">2m ago</span>
                </div>
                <p className="text-sm text-on-surface leading-tight font-medium">
                  {user?.station || 'Rajiv Chowk'} congestion exceeds safe threshold
                </p>
                <div className="mt-3 flex gap-2">
                  <button className="text-[10px] font-bold bg-error text-on-error px-3 py-1.5 rounded-md">Deploy Staff</button>
                  <button className="text-[10px] font-bold bg-surface-container-high text-on-surface px-3 py-1.5 rounded-md">Dismiss</button>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-tertiary-container/10 border-l-4 border-tertiary">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-tertiary uppercase">Medium Priority</span>
                  <span className="text-[10px] text-on-surface-variant">14m ago</span>
                </div>
                <p className="text-sm text-on-surface leading-tight font-medium">Train delay affecting Line Blue - Platforms 3/4</p>
                <div className="mt-3 flex gap-2">
                  <button className="text-[10px] font-bold bg-tertiary text-on-tertiary px-3 py-1.5 rounded-md">Broadcast</button>
                </div>
              </div>
            </div>
          </div>

          {/* Suggested Actions Panel */}
          <div className="bg-primary-container/10 border border-primary/20 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>auto_awesome</span>
                <h3 className="font-headline font-bold text-primary">Suggested Actions</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-lowest/50 border border-outline-variant/10">
                  <span className="material-symbols-outlined text-primary text-lg">add_circle</span>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">Increase train frequency</p>
                    <p className="text-xs text-on-surface-variant">Shorten headway to 2.5 mins on Line Yellow.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-lowest/50 border border-outline-variant/10">
                  <span className="material-symbols-outlined text-primary text-lg">person_add</span>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">Deploy additional staff</p>
                    <p className="text-xs text-on-surface-variant">Move 4 marshals to Platform 1 exits.</p>
                  </div>
                </li>
              </ul>
              <button className="w-full mt-6 py-2.5 bg-primary text-on-primary-fixed font-bold rounded-lg text-sm hover:opacity-90 transition-opacity">
                Apply Recommended Measures
              </button>
            </div>
          </div>
        </div>

        {/* Station Analytics */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <div className="bg-surface-container-low rounded-xl p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h3 className="font-headline text-xl font-bold text-on-surface">Station Analytics</h3>
                <p className="text-on-surface-variant text-sm">Real-time throughput and station comparison</p>
              </div>
              <div className="flex bg-surface-container rounded-lg p-1">
                <button className="px-4 py-1.5 bg-surface-container-highest text-primary text-xs font-bold rounded-md">Hourly</button>
                <button className="px-4 py-1.5 text-on-surface-variant text-xs font-bold rounded-md">Daily</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Hourly Crowd Trends */}
              <div className="space-y-4">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Hourly Crowd Trends</p>
                <div className="h-48 flex items-end justify-between gap-1 group">
                  {[30, 45, 65, 85, 95, 90, 70, 50, 40, 35, 30, 25].map((height, i) => (
                    <div 
                      key={i}
                      className={`w-full rounded-t-sm hover:opacity-80 transition-all ${
                        height > 80 ? 'bg-error' : height > 60 ? 'bg-primary/40' : 'bg-primary/20'
                      }`}
                      style={{ height: `${height}%` }}
                    ></div>
                  ))}
                </div>
              </div>

              {/* Top Congested Stations */}
              <div className="space-y-4">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Top Congested Stations</p>
                <div className="space-y-4">
                  {Object.entries(data.peak_stations).slice(0, 3).map(([station, value]) => (
                    <div key={station} className="space-y-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium">{station}</span>
                        <span className={`font-bold ${value > 80 ? 'text-error' : value > 60 ? 'text-tertiary' : 'text-primary'}`}>
                          {value}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${value > 80 ? 'bg-error' : value > 60 ? 'bg-tertiary' : 'bg-primary'}`}
                          style={{ width: `${value}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Station Control */}
          <div className="bg-surface-container-low rounded-xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3">
              <div className="p-8 border-b md:border-b-0 md:border-r border-outline-variant/10 space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Current Control</h4>
                  <h3 className="text-xl font-headline font-bold">{user?.station || 'Rajiv Chowk'}</h3>
                </div>
                <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/10">
                  <p className="text-[10px] text-on-surface-variant uppercase mb-2">Crowd Inflow</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">428</span>
                    <span className="text-xs text-error font-medium">/ min</span>
                  </div>
                </div>
              </div>
              <div className="p-8 col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Train Frequency Management</h4>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    <span className="text-xs font-bold text-on-surface">Auto-Optimization ON</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-10">
                  <div className="space-y-1">
                    <p className="text-[10px] text-on-surface-variant uppercase">Current Headway</p>
                    <p className="text-2xl font-bold text-on-surface">3m 45s</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-on-surface-variant uppercase">Optimized Target</p>
                    <p className="text-2xl font-bold text-primary">2m 30s</p>
                  </div>
                  <div className="ml-auto flex items-center">
                    <button className="px-6 py-2.5 bg-surface-container-highest hover:bg-surface-bright text-on-surface text-sm font-bold rounded-lg transition-colors border border-outline-variant/20">
                      Manual Override
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Passenger Dashboard Component
function PassengerDashboard({ data, user, selectedSystem }) {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Hero Section */}
      <header className="mb-10">
        <h2 className="text-3xl md:text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">
          Hello, {user?.name?.split(' ')[0] || 'Commuter'}
        </h2>
        <p className="text-on-surface-variant">Plan your journey with real-time crowd insights.</p>
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Journey Planner Card */}
        <section className="lg:col-span-8 bg-surface-container-low rounded-xl p-6 md:p-8 relative overflow-hidden border border-outline-variant/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-primary">route</span>
            <h3 className="text-xl font-bold font-headline">Journey Planner</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-outline tracking-wider uppercase ml-1">From Station</label>
              <div className="flex items-center bg-surface-container-lowest rounded-xl p-4 focus-within:ring-2 focus-within:ring-primary/30 transition-all border border-transparent">
                <span className="material-symbols-outlined text-outline mr-3">location_on</span>
                <input 
                  className="bg-transparent border-none focus:ring-0 text-on-surface w-full placeholder:text-outline/50 font-medium outline-none" 
                  placeholder="Rajiv Chowk" 
                  type="text"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-outline tracking-wider uppercase ml-1">To Station</label>
              <div className="flex items-center bg-surface-container-lowest rounded-xl p-4 focus-within:ring-2 focus-within:ring-primary/30 transition-all border border-transparent">
                <span className="material-symbols-outlined text-outline mr-3">sports_score</span>
                <input 
                  className="bg-transparent border-none focus:ring-0 text-on-surface w-full placeholder:text-outline/50 font-medium outline-none" 
                  placeholder="Noida Sector 62" 
                  type="text"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 bg-surface-container rounded-full p-1 pl-4">
              <span className="text-sm font-semibold text-on-surface-variant">Time:</span>
              <button className="bg-primary text-on-primary-fixed px-6 py-2 rounded-full text-sm font-bold shadow-lg shadow-primary/20">Now</button>
              <button className="text-on-surface-variant hover:text-on-surface px-6 py-2 rounded-full text-sm font-medium transition-colors">Schedule</button>
            </div>
            <button className="w-full md:w-auto bg-gradient-to-r from-primary to-primary-container text-on-primary-fixed font-bold py-4 px-8 rounded-xl shadow-xl shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              Check Crowd & Route
              <span className="material-symbols-outlined">trending_flat</span>
            </button>
          </div>
        </section>

        {/* Crowd Insight Card */}
        <section className="lg:col-span-4 bg-surface-container rounded-xl p-6 border border-outline-variant/10 flex flex-col">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-lg font-bold font-headline text-on-surface">Crowd Insight</h3>
              <p className="text-xs text-on-surface-variant">Live station density</p>
            </div>
            <div className="bg-primary-container/20 text-primary px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
              Verified
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center py-4">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle className="text-surface-container-highest" cx="80" cy="80" fill="transparent" r="70" stroke="currentColor" strokeWidth="8"></circle>
                <circle className="text-primary" cx="80" cy="80" fill="transparent" r="70" stroke="currentColor" strokeDasharray="440" strokeDashoffset="330" strokeLinecap="round" strokeWidth="8"></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-black font-headline text-primary">LOW</span>
                <span className="text-[10px] text-outline font-bold tracking-widest uppercase">Current Level</span>
              </div>
            </div>
            <div className="mt-6 text-center">
              <div className="flex items-center gap-2 justify-center mb-1">
                <span className="text-2xl font-bold font-headline text-on-surface">87%</span>
                <span className="material-symbols-outlined text-primary text-sm">verified_user</span>
              </div>
              <p className="text-xs text-on-surface-variant font-medium">Confidence Score</p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-outline-variant/10">
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="text-on-surface-variant font-medium">Platform Congestion</span>
              <span className="text-on-surface font-bold">24%</span>
            </div>
            <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{width: '24%'}}></div>
            </div>
          </div>
        </section>

        {/* Best Recommendation */}
        <section className="lg:col-span-7 space-y-4">
          <h3 className="text-lg font-bold font-headline px-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">map</span>
            Best Recommendation
          </h3>
          <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 relative group hover:bg-surface-container transition-colors">
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                    <span className="text-blue-400 font-bold text-xs">BLUE</span>
                  </div>
                  <div className="flex items-center text-on-surface font-bold text-lg">
                    Rajiv Chowk
                    <span className="material-symbols-outlined mx-2 text-outline">arrow_forward</span>
                    Noida City Center
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1.5 text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-lg text-xs font-medium">
                    <span className="material-symbols-outlined text-base">schedule</span>
                    42 mins
                  </div>
                  <div className="flex items-center gap-1.5 text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-lg text-xs font-medium">
                    <span className="material-symbols-outlined text-base">swap_horiz</span>
                    1 Interchange
                  </div>
                  <div className="flex items-center gap-1.5 text-primary bg-primary-container/10 px-3 py-1.5 rounded-lg text-xs font-bold">
                    <span className="material-symbols-outlined text-base">person_check</span>
                    High Comfort
                  </div>
                </div>
              </div>
              <div className="md:w-32 flex flex-col justify-center items-end">
                <div className="text-right">
                  <p className="text-xs text-outline font-bold uppercase tracking-tighter mb-1">Fare</p>
                  <p className="text-2xl font-black font-headline text-on-surface">₹45</p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2">
              <span className="text-[10px] font-bold text-outline-variant uppercase">Via</span>
              <span className="text-[11px] font-semibold text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded">Yamuna Bank</span>
            </div>
          </div>
        </section>

        {/* Smart Suggestions */}
        <section className="lg:col-span-5">
          <h3 className="text-lg font-bold font-headline px-1 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">lightbulb</span>
            Smart Suggestions
          </h3>
          <div className="space-y-4">
            <div className="bg-surface-container-low p-5 rounded-xl border-l-4 border-primary">
              <div className="flex gap-4">
                <span className="material-symbols-outlined text-primary">eco</span>
                <div>
                  <p className="text-sm font-semibold text-on-surface mb-1">Beat the Rush</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Travel after 10:30 AM to avoid peak rush. Commuter volume drops by 35% after the morning peak.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-low p-5 rounded-xl border-l-4 border-tertiary">
              <div className="flex gap-4">
                <span className="material-symbols-outlined text-tertiary">alt_route</span>
                <div>
                  <p className="text-sm font-semibold text-on-surface mb-1">Alternate Route Available</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    The Blue Line is currently less crowded than the Magenta Line for your destination.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Live Map Section */}
      <section className="bg-surface-container-lowest rounded-2xl overflow-hidden h-64 relative border border-outline-variant/10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary-container/10"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-8xl text-primary/20">map</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest to-transparent"></div>
        <div className="absolute bottom-6 left-6 flex items-center gap-3">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full border-2 border-surface-container bg-primary-container text-[10px] flex items-center justify-center font-bold">D</div>
            <div className="w-8 h-8 rounded-full border-2 border-surface-container bg-blue-500 text-[10px] flex items-center justify-center font-bold">B</div>
            <div className="w-8 h-8 rounded-full border-2 border-surface-container bg-yellow-500 text-[10px] flex items-center justify-center font-bold text-black">Y</div>
          </div>
          <span className="text-xs font-bold text-on-surface-variant bg-surface-container-lowest/80 backdrop-blur-md px-3 py-1 rounded-full">All Lines Operational</span>
        </div>
        <div className="absolute top-6 right-6">
          <button className="bg-surface-bright/80 backdrop-blur-md p-2 rounded-full shadow-lg border border-white/5 active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-on-surface">fullscreen</span>
          </button>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
