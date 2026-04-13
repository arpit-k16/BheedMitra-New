/**
 * Insights Page - Station Insight (Passenger Panel)
 * Redesigned to match Stitch UI
 * Updated for Time-Series Dataset v3.0
 */

import React, { useState, useEffect, useRef } from 'react';
import useStore from '../store/useStore';
import api from '../services/api';

const tips = [
  { icon: 'lightbulb', text: 'Board from the last coach for fewer crowds' },
  { icon: 'schedule', text: 'Peak hours: 8-10 AM and 6-8 PM' },
  { icon: 'info', text: 'Platform A3 is usually less crowded' },
];

function Insights() {
  const { user, selectedSystem } = useStore();
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedStationName, setSelectedStationName] = useState('');
  const [hourlyData, setHourlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const latestRequestRef = useRef(0);

  useEffect(() => {
    loadStations();
  }, [selectedSystem]);

  useEffect(() => {
    if (selectedStationName) {
      loadStationDetails(selectedStationName);
    }
  }, [selectedStationName, selectedSystem]);

  const loadStations = async () => {
    try {
      const allStations = await api.getStations(selectedSystem);
      if (allStations && allStations.length > 0) {
        setStations(allStations);
        setSelectedStationName(allStations[0]);
      } else {
        setStations(getDefaultStations());
        setSelectedStationName(getDefaultStations()[0]);
      }
    } catch (error) {
      setStations(getDefaultStations());
      setSelectedStationName(getDefaultStations()[0]);
    } finally {
      setLoading(false);
    }
  };

  const loadStationDetails = async (stationName) => {
    const requestId = ++latestRequestRef.current;
    try {
      const info = await api.getStationInfo(stationName, selectedSystem);
      let ts = [];
      try {
        ts = await api.getStationTimeSeries(info.station_id, null, null, 48, selectedSystem);
      } catch {
        ts = [];
      }

      if (requestId !== latestRequestRef.current) return;

      const avgCrowd = Number(info?.avg_crowd ?? 3);
      const recent = ts.slice(0, 12);
      const latestPoint = ts[0] || {};
      const latestCrowd = Number(latestPoint.platform_crowd_level ?? avgCrowd);
      const recentAvgCrowd = recent.length
        ? recent.reduce((sum, row) => sum + Number(row.platform_crowd_level || 0), 0) / recent.length
        : avgCrowd;
      const recentPeakCrowd = recent.length
        ? Math.max(...recent.map((row) => Number(row.platform_crowd_level || 0)))
        : avgCrowd;

      // Strongly weight latest value so status changes station-by-station
      const crowdScore = (latestCrowd * 0.70) + (recentAvgCrowd * 0.20) + (recentPeakCrowd * 0.10);
      const crowdLevel = Math.max(1, Math.min(5, Math.round(crowdScore)));

      const latestRidership = Number(latestPoint.ridership_count ?? 0);
      const avgRidership = Number(info?.avg_ridership ?? latestRidership);
      const ridershipForCard = latestRidership > 0 ? latestRidership : avgRidership;
      const ridershipBoost = Math.min(15, ridershipForCard / 1800);
      const rawCongestion = (crowdScore / 5) * 100 + ridershipBoost;
      const congestion = Math.max(15, Math.min(95, Math.round(rawCongestion)));

      const avgFreqFromInfo = Number(info?.avg_train_frequency);
      const avgFreq = Number.isFinite(avgFreqFromInfo) && avgFreqFromInfo > 0 ? avgFreqFromInfo : 12;
      const waitTime = (60 / avgFreq).toFixed(1);
      const nextTrainMins = Math.max(1, Math.round(Number(waitTime)));

      const platformNum = (Number(info?.peak_crowd ?? 1) % 4) + 1;

      setSelectedStation({
        name: info.name || stationName,
        station_id: info.station_id || stationName,
        line: info.line || 'Multiple Lines',
        crowdLevel,
        congestion,
        waitTime,
        nextTrain: `${nextTrainMins} min`,
        platform: `A${platformNum}`,
        ridership: Math.round(ridershipForCard),
        amenities: ['Lift', 'Toilet', 'ATM'],
      });

      // Build station-specific hourly chart from this station's own time-series
      const byHour = {};
      ts.forEach((row) => {
        const hour = Number(row.hour_of_day);
        const level = Number(row.platform_crowd_level);
        if (!Number.isFinite(hour) || !Number.isFinite(level)) return;
        if (!byHour[hour]) byHour[hour] = [];
        byHour[hour].push(level);
      });

      const times = ['6AM', '8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM', '10PM'];
      const hours = [6, 8, 10, 12, 14, 16, 18, 20, 22];
      const chartData = times.map((time, i) => {
        const hour = hours[i];
        const arr = byHour[hour] || [];
        const meanLevel = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : crowdScore;
        return { time, crowd: Math.round((meanLevel / 5) * 100) };
      });
      setHourlyData(chartData);
    } catch {
      if (requestId !== latestRequestRef.current) return;
      setSelectedStation({
        name: stationName,
        station_id: stationName,
        line: 'Multiple Lines',
        crowdLevel: 3,
        congestion: 60,
        waitTime: '3.0',
        nextTrain: '3 min',
        platform: 'A1',
        ridership: 0,
        amenities: ['Lift', 'Toilet', 'ATM'],
      });
      setHourlyData(getDefaultHourlyData());
    }
  };

  const getDefaultStations = () => [
    'Rajiv Chowk',
    'Kashmere Gate',
    'Central Secretariat',
    'Hauz Khas',
  ];

  const getDefaultHourlyData = () => [
    { time: '6AM', crowd: 25 },
    { time: '8AM', crowd: 78 },
    { time: '10AM', crowd: 55 },
    { time: '12PM', crowd: 42 },
    { time: '2PM', crowd: 38 },
    { time: '4PM', crowd: 52 },
    { time: '6PM', crowd: 85 },
    { time: '8PM', crowd: 62 },
    { time: '10PM', crowd: 30 },
  ];

  const getCrowdStyles = (level) => {
    if (level >= 4) return { bg: 'bg-error-container/20', text: 'text-error', border: 'border-error', label: 'High' };
    if (level >= 2.5) return { bg: 'bg-tertiary-container/20', text: 'text-tertiary', border: 'border-tertiary', label: 'Moderate' };
    return { bg: 'bg-primary-container/20', text: 'text-primary', border: 'border-primary', label: 'Low' };
  };

  if (loading || !selectedStation || !selectedStationName) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-on-surface-variant">Loading station data...</p>
        </div>
      </div>
    );
  }

  const statusLevel = selectedStation.crowdLevel >= 4 ? 4 : selectedStation.crowdLevel >= 3 ? 3 : 2;
  const styles = getCrowdStyles(statusLevel);
  const displayHourlyData = hourlyData.length > 0 ? hourlyData : getDefaultHourlyData();
  const actionItems = statusLevel >= 4
    ? ['Use alternate nearby station', 'Delay by 20-30 mins if possible', 'Board end coaches to reduce crowding']
    : statusLevel >= 3
    ? ['Prefer non-peak coach positions', 'Keep 10 mins buffer for entry', 'Track live updates before boarding']
    : ['Good time to travel', 'Use fastest route available', 'Station flow is smooth currently'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-on-surface font-headline">Station Insight</h1>
          <p className="text-sm text-on-surface-variant mt-1">Real-time station information and crowd analytics</p>
        </div>
        <select
          value={selectedStationName}
          onChange={(e) => setSelectedStationName(e.target.value)}
          className="bg-surface-container border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-primary/50 focus:outline-none text-on-surface"
        >
          {stations.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Station Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Station Overview */}
          <div className="bg-surface-container-low rounded-2xl border border-white/5 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-black text-on-surface">{selectedStation.name}</h2>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${styles.bg} ${styles.text}`}>
                    {styles.label} Crowd
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant">Lines: {selectedStation.line}</p>
              </div>
              <button className="p-2 bg-surface-container rounded-lg hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant">bookmark_border</span>
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-surface-container rounded-xl p-4 text-center">
                <p className="text-xs text-on-surface-variant mb-1">Congestion</p>
                <p className={`text-2xl font-black ${styles.text}`}>{selectedStation.congestion}%</p>
              </div>
              <div className="bg-surface-container rounded-xl p-4 text-center">
                <p className="text-xs text-on-surface-variant mb-1">Wait Time</p>
                <p className="text-2xl font-black text-on-surface">{selectedStation.waitTime}m</p>
              </div>
              <div className="bg-surface-container rounded-xl p-4 text-center">
                <p className="text-xs text-on-surface-variant mb-1">Next Train</p>
                <p className="text-2xl font-black text-primary">{selectedStation.nextTrain}</p>
              </div>
              <div className="bg-surface-container rounded-xl p-4 text-center">
                <p className="text-xs text-on-surface-variant mb-1">Ridership</p>
                <p className="text-2xl font-black text-on-surface">{selectedStation.ridership?.toLocaleString() || 0}</p>
              </div>
            </div>

            {/* Crowd Trend Chart - Simple Bar Chart */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Today's Crowd Pattern</h3>
                  <p className="text-xs text-on-surface-variant">Hourly congestion levels</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                  <span className="text-on-surface-variant">Crowd %</span>
                </div>
              </div>
              <div className="h-48 flex items-end gap-2 px-2">
                {displayHourlyData.map((item, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1">
                    <div 
                      className="w-full bg-gradient-to-t from-primary/30 to-primary rounded-t transition-all hover:from-primary/50"
                      style={{ height: `${item.crowd * 1.6}px` }}
                      title={`${item.time}: ${item.crowd}%`}
                    ></div>
                    <span className="text-[10px] text-on-surface-variant">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Station Amenities */}
          <div className="bg-surface-container-low rounded-2xl border border-white/5 p-6">
            <h3 className="text-sm font-bold text-on-surface mb-4">Station Amenities</h3>
            <div className="flex flex-wrap gap-3">
              {selectedStation.amenities.map((amenity) => (
                <div key={amenity} className="flex items-center gap-2 px-4 py-2 bg-surface-container rounded-xl">
                  <span className="material-symbols-outlined text-primary text-lg">
                    {amenity === 'Lift' ? 'elevator' : amenity === 'Toilet' ? 'wc' : amenity === 'ATM' ? 'local_atm' : 'info'}
                  </span>
                  <span className="text-sm font-medium text-on-surface">{amenity}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 px-4 py-2 bg-surface-container rounded-xl">
                <span className="material-symbols-outlined text-primary text-lg">wheelchair_pickup</span>
                <span className="text-sm font-medium text-on-surface">Accessible</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Live Status Card */}
          <div className={`rounded-2xl border p-6 ${styles.bg} ${styles.border}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl ${styles.bg} flex items-center justify-center`}>
                <span className={`material-symbols-outlined ${styles.text} text-2xl`}>groups</span>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant font-medium">Current Status</p>
                <p className={`text-lg font-black ${styles.text}`}>{styles.label} Congestion</p>
              </div>
            </div>
            
            {/* Crowd Gauge */}
            <div className="relative h-4 bg-surface rounded-full overflow-hidden mb-4">
              <div 
                className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
                  selectedStation.crowdLevel >= 4 ? 'bg-error' : 
                  selectedStation.crowdLevel >= 3 ? 'bg-tertiary' : 'bg-primary'
                }`}
                style={{ width: `${selectedStation.congestion}%` }}
              ></div>
            </div>
            
             <p className="text-sm text-on-surface-variant">
               {statusLevel >= 4 
                 ? 'Station is very crowded. Consider alternative routes.'
                 : statusLevel >= 3
                 ? 'Moderate crowd expected. Plan accordingly.'
                 : 'Great time to travel! Station is relatively empty.'}
             </p>
           </div>

          {/* Suggested Actions */}
          <div className="bg-surface-container-low rounded-2xl border border-white/5 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">bolt</span>
              <h3 className="text-sm font-bold text-on-surface">Suggested Actions</h3>
            </div>
            <div className="space-y-3">
              {actionItems.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-surface-container rounded-xl">
                  <span className="material-symbols-outlined text-primary text-lg mt-0.5">check_circle</span>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Smart Tips */}
          <div className="bg-surface-container-low rounded-2xl border border-white/5 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-tertiary">auto_awesome</span>
              <h3 className="text-sm font-bold text-on-surface">Smart Tips</h3>
            </div>
            <div className="space-y-3">
              {tips.map((tip, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-surface-container rounded-xl">
                  <span className="material-symbols-outlined text-primary text-lg mt-0.5">{tip.icon}</span>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{tip.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-surface-container-low rounded-2xl border border-white/5 p-6">
            <h3 className="text-sm font-bold text-on-surface mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 p-3 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined text-primary">directions</span>
                <span className="text-sm font-medium text-on-surface">Get Directions</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined text-primary">notifications</span>
                <span className="text-sm font-medium text-on-surface">Set Alert</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined text-primary">share</span>
                <span className="text-sm font-medium text-on-surface">Share Status</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Other Stations */}
      <div className="bg-surface-container-low rounded-2xl border border-white/5 p-6">
        <h3 className="text-lg font-bold text-on-surface mb-4">Nearby Stations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stations.filter(s => s !== selectedStation.name).slice(0, 3).map((stationName) => {
            const stationStyles = getCrowdStyles(2);
            return (
              <button
                key={stationName}
                onClick={() => setSelectedStationName(stationName)}
                className="text-left p-4 bg-surface-container rounded-xl border border-white/5 hover:bg-surface-container-high transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-on-surface">{stationName}</h4>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${stationStyles.bg} ${stationStyles.text}`}>
                    {stationStyles.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    from live data
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">train</span>
                    live
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Insights;
