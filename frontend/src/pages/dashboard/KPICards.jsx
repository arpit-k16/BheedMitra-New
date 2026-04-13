/**
 * KPI Cards Component - Key Performance Indicators
 */

import React from 'react';

const kpiConfig = [
  {
    key: 'total_records',
    label: 'Total Passengers',
    icon: 'group',
    color: 'cyan',
    format: (v) => v?.toLocaleString() || '0'
  },
  {
    key: 'avg_crowd_level',
    label: 'Avg Crowd Level',
    icon: 'trending_up',
    color: 'amber',
    format: (v) => `${(v || 0).toFixed(1)}/5`
  },
  {
    key: 'unique_stations',
    label: 'Active Stations',
    icon: 'location_on',
    color: 'emerald',
    format: (v) => v || '0'
  },
  {
    key: 'avg_wait_time',
    label: 'Avg Wait Time',
    icon: 'schedule',
    color: 'purple',
    format: (v) => `${(v || 0).toFixed(1)} min`
  }
];

const colorClasses = {
  cyan: {
    bg: 'from-cyan-500/20 to-cyan-600/10',
    border: 'border-cyan-500/30',
    icon: 'bg-cyan-500/20 text-cyan-400',
    text: 'text-cyan-400'
  },
  amber: {
    bg: 'from-amber-500/20 to-amber-600/10',
    border: 'border-amber-500/30',
    icon: 'bg-amber-500/20 text-amber-400',
    text: 'text-amber-400'
  },
  emerald: {
    bg: 'from-emerald-500/20 to-emerald-600/10',
    border: 'border-emerald-500/30',
    icon: 'bg-emerald-500/20 text-emerald-400',
    text: 'text-emerald-400'
  },
  purple: {
    bg: 'from-purple-500/20 to-purple-600/10',
    border: 'border-purple-500/30',
    icon: 'bg-purple-500/20 text-purple-400',
    text: 'text-purple-400'
  }
};

function KPICards({ data }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiConfig.map((kpi) => {
        const colors = colorClasses[kpi.color];
        const value = data?.[kpi.key];
        
        return (
          <div
            key={kpi.key}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colors.bg} border ${colors.border} p-6`}
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative">
              <div className={`w-12 h-12 rounded-xl ${colors.icon} flex items-center justify-center mb-4`}>
                <span className="material-symbols-outlined">{kpi.icon}</span>
              </div>
              
              <p className="text-gray-400 text-sm font-medium mb-1">{kpi.label}</p>
              <p className={`text-3xl font-bold ${colors.text}`}>
                {kpi.format(value)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default KPICards;
