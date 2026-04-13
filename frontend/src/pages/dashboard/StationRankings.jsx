/**
 * Station Rankings Component - Top congested stations
 * Updated to fetch data from API
 */

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import useStore from '../../store/useStore';

const defaultRankings = [
  { station: 'Rajiv Chowk', station_id: 'YL20', value: 4.2 },
  { station: 'Kashmere Gate', station_id: 'YL15', value: 3.9 },
  { station: 'Central Secretariat', station_id: 'YL04', value: 3.7 },
  { station: 'New Delhi', station_id: 'YL18', value: 3.5 },
  { station: 'Hauz Khas', station_id: 'YL10', value: 3.4 }
];

function StationRankings({ data }) {
  const { selectedSystem } = useStore();
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRankings();
  }, [selectedSystem]);

  const loadRankings = async () => {
    setLoading(true);
    try {
      console.log('[StationRankings] Fetching rankings...');
      const apiData = await api.getStationRankings('crowd', 5, selectedSystem);
      console.log('[StationRankings] Received:', apiData);
      if (Array.isArray(apiData) && apiData.length > 0) {
        setRankings(apiData);
      } else {
        console.warn('[StationRankings] Empty response, using defaults');
        setRankings(defaultRankings);
      }
    } catch (error) {
      console.error('[StationRankings] Error:', error);
      setRankings(defaultRankings);
    } finally {
      setLoading(false);
    }
  };

  // Use provided data or fetched rankings
  const displayData = data ? 
    Object.entries(data).map(([station, value]) => ({ station, value })).slice(0, 5) :
    rankings;

  const getCrowdColor = (level) => {
    if (level >= 4) return { bg: 'bg-red-500/20', text: 'text-red-400', bar: 'bg-red-500' };
    if (level >= 3) return { bg: 'bg-amber-500/20', text: 'text-amber-400', bar: 'bg-amber-500' };
    return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', bar: 'bg-emerald-500' };
  };

  if (loading && !data) {
    return (
      <div className="bg-[#0f1629] rounded-2xl border border-white/5 p-6 h-72 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#0f1629] rounded-2xl border border-white/5 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Station Rankings</h3>
          <p className="text-sm text-gray-500">Most congested stations</p>
        </div>
        <span className="material-symbols-outlined text-gray-500">leaderboard</span>
      </div>

      <div className="space-y-4">
        {displayData.map((item, index) => {
          const station = item.station || item.name;
          const level = item.value || item.avg_crowd || 3;
          const colors = getCrowdColor(level);
          const widthPercent = (level / 5) * 100;
          
          return (
            <div key={station} className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-lg ${colors.bg} ${colors.text} flex items-center justify-center text-sm font-bold`}>
                    {index + 1}
                  </span>
                  <span className="font-medium">{station}</span>
                </div>
                <span className={`text-sm font-semibold ${colors.text}`}>
                  {level.toFixed(1)}/5
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${colors.bar} rounded-full transition-all duration-500`}
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* View all link */}
      <button className="w-full mt-6 py-3 text-center text-sm text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition-colors">
        View All Stations →
      </button>
    </div>
  );
}

export default StationRankings;
