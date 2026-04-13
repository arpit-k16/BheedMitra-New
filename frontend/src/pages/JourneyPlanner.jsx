/**
 * Journey Planner Page - Passenger Panel Journey Planner
 * Redesigned to match Stitch UI
 * Updated for Time-Series Dataset v3.0
 */

import React, { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import api from '../services/api';

const timeSlots = [
  { value: 'now', label: 'Leave Now' },
  { value: 'Morning Peak', label: 'Morning Peak (8-10 AM)' },
  { value: 'Afternoon', label: 'Midday (12-2 PM)' },
  { value: 'Evening Peak', label: 'Evening Peak (6-8 PM)' },
  { value: 'Night', label: 'Night (9-11 PM)' },
];

const mockRouteOptions = [
  { 
    id: 1,
    type: 'Fastest',
    time: '24 min',
    via: 'Blue Line Direct',
    crowdLevel: 'medium',
    transfers: 0,
    steps: ['Board Blue Line', 'Travel 8 stations', 'Arrive at destination']
  },
  { 
    id: 2,
    type: 'Less Crowded',
    time: '32 min',
    via: 'Yellow → Blue Line',
    crowdLevel: 'low',
    transfers: 1,
    steps: ['Board Yellow Line', 'Change at Rajiv Chowk', 'Board Blue Line', 'Arrive']
  },
  { 
    id: 3,
    type: 'Scenic',
    time: '45 min',
    via: 'Violet → Magenta → Blue',
    crowdLevel: 'low',
    transfers: 2,
    steps: ['Board Violet Line', 'Change at Central Sec.', 'Board Magenta', 'Change at Hauz Khas', 'Arrive']
  },
];

function JourneyPlanner() {
  const { stations, setStations, selectedSystem } = useStore();
  const [journey, setJourney] = useState({
    source: '',
    destination: '',
    time: 'now',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [crowdPrediction, setCrowdPrediction] = useState(null);
  const [stationList, setStationList] = useState([]);

  // Load stations from API on mount
  useEffect(() => {
    const loadStations = async () => {
      try {
        const data = await api.getStations(selectedSystem);
        if (data && data.length > 0) {
          setStationList(data);
          setStations(data);
        } else {
          setStationList(getDefaultStations());
        }
      } catch (error) {
        console.error('Failed to load stations:', error);
        setStationList(getDefaultStations());
      }
    };
    loadStations();
  }, [selectedSystem]);

  const getDefaultStations = () => [
    'Adarsh Nagar', 'AIIMS', 'Azadpur', 'Botanical Garden', 'Central Secretariat',
    'Chandni Chowk', 'Chhatarpur', 'Dwarka', 'GTB Nagar', 'Hauz Khas',
    'Huda City Center', 'IFFCO Chowk', 'Kashmere Gate', 'Nehru Place',
    'New Delhi', 'Noida City Centre', 'Rajiv Chowk', 'Saket', 'Vaishali'
  ];

  const displayStations = stationList.length > 0 ? stationList : 
    (stations.length > 0 ? stations : getDefaultStations());

  const handlePlan = async () => {
    if (!journey.source || !journey.destination) return;
    
    setLoading(true);
    try {
      // Get crowd prediction for source station
      const timeCategory = journey.time === 'now' 
        ? getCurrentTimeCategory() 
        : journey.time;
      
      const prediction = await api.predict({
        station: journey.source,
        system: selectedSystem,
        timeCategory: timeCategory,
        weather: 'Clear'
      }).catch(() => null);
      
      setCrowdPrediction(prediction);
      
      // Update mock routes with crowd info
      const updatedRoutes = mockRouteOptions.map(route => ({
        ...route,
        crowdLevel: prediction ? 
          (prediction.crowd_level <= 2 ? 'low' : prediction.crowd_level >= 4 ? 'high' : 'medium') 
          : route.crowdLevel
      }));
      
      setResult(updatedRoutes);
      setSelectedRoute(updatedRoutes[0]);
    } catch (error) {
      setResult(mockRouteOptions);
      setSelectedRoute(mockRouteOptions[0]);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTimeCategory = () => {
    const hour = new Date().getHours();
    if (hour >= 8 && hour < 10) return 'Morning Peak';
    if (hour >= 10 && hour < 12) return 'Mid Morning';
    if (hour >= 12 && hour < 17) return 'Afternoon';
    if (hour >= 17 && hour < 20) return 'Evening Peak';
    return 'Night';
  };

  const getCrowdStyles = (level) => {
    if (level === 'high') return { bg: 'bg-error-container/20', text: 'text-error', label: 'High Crowd' };
    if (level === 'medium') return { bg: 'bg-tertiary-container/20', text: 'text-tertiary', label: 'Moderate' };
    return { bg: 'bg-primary-container/20', text: 'text-primary', label: 'Low Crowd' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-on-surface font-headline">Journey Planner</h1>
          <p className="text-sm text-on-surface-variant mt-1">Find the best route with real-time crowd insights</p>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-surface-container rounded-xl text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-lg">history</span>
            Recent
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-surface-container rounded-xl text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-lg">bookmark</span>
            Saved
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Planning Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface-container-low rounded-2xl border border-white/5 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">route</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface">Plan Your Trip</h3>
                <p className="text-xs text-on-surface-variant">Enter journey details</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Source */}
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 flex flex-col items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <div className="w-0.5 h-10 bg-outline-variant/30 my-1"></div>
                  <div className="w-3 h-3 rounded-full border-2 border-primary bg-surface"></div>
                </div>
                
                <div className="space-y-3 ml-10">
                  <div>
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Origin</label>
                    <select
                      value={journey.source}
                      onChange={(e) => setJourney({ ...journey, source: e.target.value })}
                      className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:outline-none text-on-surface"
                    >
                      <option value="">Select station...</option>
                      {displayStations.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Destination</label>
                    <select
                      value={journey.destination}
                      onChange={(e) => setJourney({ ...journey, destination: e.target.value })}
                      className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:outline-none text-on-surface"
                    >
                      <option value="">Select station...</option>
                      {displayStations.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Swap button */}
              <div className="flex justify-start ml-10">
                <button
                  onClick={() => setJourney({ ...journey, source: journey.destination, destination: journey.source })}
                  className="p-2 bg-surface-container hover:bg-surface-container-high rounded-lg transition-colors group"
                >
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-on-surface text-lg">swap_vert</span>
                </button>
              </div>

              {/* Time Selection */}
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Departure</label>
                <div className="flex flex-wrap gap-2">
                  {timeSlots.slice(0, 3).map(t => (
                    <button
                      key={t.value}
                      onClick={() => setJourney({ ...journey, time: t.value })}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        journey.time === t.value 
                          ? 'bg-primary text-on-primary-fixed' 
                          : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {t.value === 'now' && <span className="material-symbols-outlined text-sm mr-1 align-middle">schedule</span>}
                      {t.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handlePlan}
                disabled={!journey.source || !journey.destination || loading}
                className="w-full py-3.5 bg-gradient-to-r from-primary to-primary-container text-on-primary-fixed font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Finding Routes...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">search</span>
                    Find Routes
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Tips Card */}
          <div className="bg-surface-container-low rounded-2xl border border-white/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-tertiary">lightbulb</span>
              <h4 className="text-sm font-bold text-on-surface">Smart Tips</h4>
            </div>
            <ul className="space-y-2 text-xs text-on-surface-variant">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-sm mt-0.5">check</span>
                Avoid peak hours (8-10 AM, 6-8 PM)
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-sm mt-0.5">check</span>
                First/last coach is usually less crowded
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-sm mt-0.5">check</span>
                Check real-time crowd before boarding
              </li>
            </ul>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {result ? (
            <>
              {/* Route Options */}
              <div className="bg-surface-container-low rounded-2xl border border-white/5 p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-lg font-bold text-on-surface">Available Routes</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {journey.source} → {journey.destination}
                    </p>
                  </div>
                  <div className="text-xs text-on-surface-variant">
                    {result.length} routes found
                  </div>
                </div>
                
                <div className="space-y-3">
                  {result.map((route) => {
                    const crowdStyles = getCrowdStyles(route.crowdLevel);
                    const isSelected = selectedRoute?.id === route.id;
                    
                    return (
                      <button
                        key={route.id}
                        onClick={() => setSelectedRoute(route)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          isSelected 
                            ? 'bg-primary-container/10 border-primary/30' 
                            : 'bg-surface-container border-white/5 hover:bg-surface-container-high'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              route.type === 'Fastest' ? 'bg-primary-container/20 text-primary' :
                              route.type === 'Less Crowded' ? 'bg-tertiary-container/20 text-tertiary' :
                              'bg-surface-container text-on-surface-variant'
                            }`}>
                              {route.type}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${crowdStyles.bg} ${crowdStyles.text}`}>
                              {crowdStyles.label}
                            </span>
                          </div>
                          <span className="text-lg font-black text-on-surface">{route.time}</span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-on-surface-variant">{route.via}</span>
                          {route.transfers > 0 && (
                            <span className="text-xs text-on-surface-variant flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">sync_alt</span>
                              {route.transfers} transfer{route.transfers > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Route Details */}
              {selectedRoute && (
                <div className="bg-surface-container-low rounded-2xl border border-white/5 p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-on-surface">Route Details</h3>
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-surface-container rounded-lg text-xs font-semibold text-on-surface-variant hover:text-on-surface">
                      <span className="material-symbols-outlined text-sm">bookmark_border</span>
                      Save Route
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {selectedRoute.steps.map((step, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            index === 0 ? 'bg-primary text-on-primary-fixed' :
                            index === selectedRoute.steps.length - 1 ? 'bg-primary-container text-primary' :
                            'bg-surface-container text-on-surface-variant'
                          }`}>
                            {index === 0 ? (
                              <span className="material-symbols-outlined text-sm">directions_subway</span>
                            ) : index === selectedRoute.steps.length - 1 ? (
                              <span className="material-symbols-outlined text-sm">flag</span>
                            ) : (
                              <span className="text-xs font-bold">{index}</span>
                            )}
                          </div>
                          {index < selectedRoute.steps.length - 1 && (
                            <div className="w-0.5 h-8 bg-outline-variant/30"></div>
                          )}
                        </div>
                        <div className="flex-1 pt-1.5">
                          <p className="text-sm font-semibold text-on-surface">{step}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button className="w-full mt-6 py-3 bg-gradient-to-r from-primary to-primary-container text-on-primary-fixed font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">navigation</span>
                    Start Navigation
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-surface-container-low rounded-2xl border border-white/5 p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant">route</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface mb-2">Plan Your Journey</h3>
              <p className="text-sm text-on-surface-variant max-w-sm mx-auto">
                Select your origin and destination to discover the best routes with real-time crowd information
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default JourneyPlanner;
