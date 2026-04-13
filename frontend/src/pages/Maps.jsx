/**
 * Maps Page - Transit Map
 * Redesigned to match Stitch UI - Admin Panel Transit Map
 */

import React, { useState } from 'react';
import useStore from '../store/useStore';

const mockStations = [
  { id: 1, name: 'Rajiv Chowk', line: 'Yellow/Blue', crowdLevel: 4, density: 78, congestion: 84, frequency: '3m', commuters: 4821, waitTime: 5.2 },
  { id: 2, name: 'Kashmere Gate', line: 'Red/Yellow/Violet', crowdLevel: 3, density: 62, congestion: 68, frequency: '4m', commuters: 3240, waitTime: 4.1 },
  { id: 3, name: 'Central Secretariat', line: 'Yellow/Violet', crowdLevel: 2, density: 45, congestion: 48, frequency: '5m', commuters: 2100, waitTime: 3.2 },
  { id: 4, name: 'Hauz Khas', line: 'Yellow/Magenta', crowdLevel: 2, density: 38, congestion: 42, frequency: '5m', commuters: 1850, waitTime: 2.8 },
  { id: 5, name: 'Botanical Garden', line: 'Blue', crowdLevel: 2, density: 35, congestion: 40, frequency: '6m', commuters: 1620, waitTime: 2.5 },
];

const lines = [
  { id: 'blue', name: 'Blue Line', color: '#0072CE' },
  { id: 'yellow', name: 'Yellow Line', color: '#FFD100' },
  { id: 'violet', name: 'Violet Line', color: '#8B008B' },
];

function Maps() {
  const { selectedSystem, user, role } = useStore();
  const [selectedStation, setSelectedStation] = useState(mockStations[0]);
  const [selectedLine, setSelectedLine] = useState('all');
  const [timeFilter, setTimeFilter] = useState('current');

  const getCrowdStyles = (level) => {
    if (level >= 4) return { color: '#93000a', label: 'Critical Alert', borderColor: 'border-error' };
    if (level >= 3) return { color: '#8f5201', label: 'Elevated', borderColor: 'border-tertiary' };
    return { color: '#006b74', label: 'Normal', borderColor: 'border-primary' };
  };

  return (
    <div className="h-[calc(100vh-10rem)] relative">
      {/* Map Background */}
      <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl">
        <div className="relative w-full h-full bg-surface-container-lowest flex items-center justify-center">
          {/* Abstract Map Texture */}
          <div 
            className="absolute inset-0 opacity-20" 
            style={{
              backgroundImage: 'radial-gradient(#40484f 1px, transparent 1px)',
              backgroundSize: '30px 30px'
            }}
          ></div>
          
          {/* Metro Lines SVG */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 600" preserveAspectRatio="none">
            {/* Blue Line */}
            <path 
              d="M100,500 L300,400 L400,200 L600,150 L800,100" 
              fill="none" 
              stroke="#0072CE" 
              strokeWidth="6" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            {/* Yellow Line */}
            <path 
              d="M200,100 L350,250 L400,200 L500,350 L700,500" 
              fill="none" 
              stroke="#FFD100" 
              strokeWidth="6" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            
            {/* Station Nodes */}
            {/* Green (Low) */}
            <circle cx="100" cy="500" r="8" fill="#181c23" stroke="#006b74" strokeWidth="4" />
            <circle cx="200" cy="100" r="8" fill="#181c23" stroke="#006b74" strokeWidth="4" />
            <circle cx="800" cy="100" r="8" fill="#181c23" stroke="#006b74" strokeWidth="4" />
            
            {/* Yellow (Moderate) */}
            <circle cx="300" cy="400" r="8" fill="#181c23" stroke="#8f5201" strokeWidth="4" />
            <circle cx="350" cy="250" r="8" fill="#181c23" stroke="#8f5201" strokeWidth="4" />
            <circle cx="600" cy="150" r="8" fill="#181c23" stroke="#8f5201" strokeWidth="4" />
            
            {/* Red (High) - Central Node */}
            <g className="animate-pulse">
              <circle cx="400" cy="200" r="16" fill="none" stroke="#ffb4ab" strokeWidth="2" opacity="0.6" />
              <circle cx="400" cy="200" r="12" fill="#93000a" />
            </g>
            
            {/* Station Labels */}
            <text x="420" y="205" fill="#dfe2ec" fontFamily="Manrope" fontSize="14" fontWeight="700">
              {user?.station || 'Rajiv Chowk'}
            </text>
            <text x="310" y="420" fill="#c0c7d0" fontFamily="Inter" fontSize="11">Karol Bagh</text>
            <text x="615" y="165" fill="#c0c7d0" fontFamily="Inter" fontSize="11">Kashmere Gate</text>
          </svg>
        </div>
      </div>

      {/* Filter Overlay (Top) */}
      <div className="absolute top-6 left-6 right-6 z-20 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between pointer-events-none">
        <div className="flex gap-4 pointer-events-auto">
          {/* Line Filter */}
          <div className="flex items-center gap-3 bg-surface-container-low/80 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/5 shadow-2xl">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Line Selection</span>
            <div className="flex gap-2">
              {lines.map(line => (
                <button 
                  key={line.id}
                  onClick={() => setSelectedLine(line.id)}
                  className={`w-8 h-8 rounded-full border-2 border-white/20 flex items-center justify-center transition-all ${
                    selectedLine === line.id || selectedLine === 'all' ? 'ring-2 ring-primary' : ''
                  }`}
                  style={{ backgroundColor: line.color }}
                >
                  <span className={`text-[10px] font-bold ${line.id === 'yellow' ? 'text-black' : 'text-white'}`}>
                    {line.id[0].toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Time Filter */}
          <div className="flex items-center gap-3 bg-surface-container-low/80 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/5 shadow-2xl">
            <span className="material-symbols-outlined text-primary text-sm">schedule</span>
            <select 
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="bg-transparent border-none text-sm font-semibold focus:ring-0 text-on-surface py-0 cursor-pointer"
            >
              <option value="current">Current ({new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})</option>
              <option value="morning">Peak Morning (08:00)</option>
              <option value="evening">Peak Evening (18:00)</option>
              <option value="prediction">Prediction (+1h)</option>
            </select>
          </div>
        </div>
        
        {/* Legend */}
        <div className="bg-surface-container-low/80 backdrop-blur-xl px-6 py-3 rounded-xl border border-white/5 shadow-2xl pointer-events-auto">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-primary-container"></div>
              <span className="text-xs font-medium text-on-surface-variant">Low</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-tertiary-container"></div>
              <span className="text-xs font-medium text-on-surface-variant">Moderate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-error-container"></div>
              <span className="text-xs font-medium text-on-surface-variant">High Density</span>
            </div>
          </div>
        </div>
      </div>

      {/* Station Detail Side Panel */}
      <div className="absolute top-6 right-6 bottom-6 w-80 z-20 pointer-events-none">
        <div className="h-full bg-surface-container-low/80 backdrop-blur-2xl rounded-2xl border border-white/5 shadow-[0_40px_80px_rgba(0,0,0,0.6)] flex flex-col pointer-events-auto overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-outline-variant/15">
            <div className="flex items-center justify-between mb-4">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest border ${
                getCrowdStyles(selectedStation.crowdLevel).borderColor
              } ${selectedStation.crowdLevel >= 4 ? 'bg-error-container/20 text-error' : selectedStation.crowdLevel >= 3 ? 'bg-tertiary-container/20 text-tertiary' : 'bg-primary-container/20 text-primary'}`}>
                {getCrowdStyles(selectedStation.crowdLevel).label}
              </span>
              <button className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <h2 className="text-2xl font-extrabold text-on-surface font-headline leading-tight">{selectedStation.name}</h2>
            <p className="text-on-surface-variant text-xs mt-1">Interchange: {selectedStation.line}</p>
          </div>
          
          {/* Stats Grid */}
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface-container rounded-xl">
                <p className="text-xs text-on-surface-variant mb-1 font-medium">Density</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-on-surface">{selectedStation.density}%</span>
                  <span className={`material-symbols-outlined text-sm ${selectedStation.density > 70 ? 'text-error' : 'text-tertiary'}`}>
                    trending_up
                  </span>
                </div>
              </div>
              <div className="p-4 bg-surface-container rounded-xl">
                <p className="text-xs text-on-surface-variant mb-1 font-medium">Congestion</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-on-surface">{selectedStation.congestion}%</span>
                  <span className="material-symbols-outlined text-tertiary text-sm">warning</span>
                </div>
              </div>
            </div>
            
            {/* Flow Prediction Chart */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-on-surface uppercase tracking-wider">Flow Prediction</p>
                <span className="text-[10px] text-on-surface-variant">Last 4 Hours</span>
              </div>
              <div className="h-24 w-full bg-surface-container-lowest rounded-lg relative overflow-hidden flex items-end px-1 gap-1">
                {[40, 50, 70, 90, 95, 85, 60].map((h, i) => (
                  <div 
                    key={i}
                    className={`flex-1 rounded-t-sm ${
                      h > 85 ? 'bg-error-container/40' : h > 70 ? 'bg-tertiary-container/40' : 'bg-primary-container/40'
                    }`}
                    style={{ height: `${h}%` }}
                  ></div>
                ))}
              </div>
            </div>
            
            {/* Info List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">timer</span>
                  <span className="text-sm font-medium text-on-surface-variant">Avg. Frequency</span>
                </div>
                <span className="text-sm font-bold text-on-surface">{selectedStation.frequency}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">groups</span>
                  <span className="text-sm font-medium text-on-surface-variant">Active Commuters</span>
                </div>
                <span className="text-sm font-bold text-on-surface">{selectedStation.commuters.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">door_open</span>
                  <span className="text-sm font-medium text-on-surface-variant">Wait Time</span>
                </div>
                <span className="text-sm font-bold text-on-surface">{selectedStation.waitTime}m</span>
              </div>
            </div>
          </div>
          
          {/* Footer Action */}
          <div className="p-6 bg-surface-container-high/50">
            {role === 'admin' ? (
              <button className="w-full py-3 bg-white/5 hover:bg-white/10 transition-colors border border-white/10 rounded-xl text-sm font-bold text-on-surface flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg">send</span>
                Broadcast Alerts
              </button>
            ) : (
              <button className="w-full py-3 bg-gradient-to-r from-primary to-primary-container text-on-primary-fixed font-bold rounded-xl text-sm hover:opacity-90 transition-opacity">
                Start Journey
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-2">
        <button className="w-10 h-10 bg-surface-container-low/80 backdrop-blur-xl border border-white/5 rounded-full flex items-center justify-center text-on-surface hover:bg-primary hover:text-on-primary-fixed transition-all shadow-xl">
          <span className="material-symbols-outlined">add</span>
        </button>
        <button className="w-10 h-10 bg-surface-container-low/80 backdrop-blur-xl border border-white/5 rounded-full flex items-center justify-center text-on-surface hover:bg-primary hover:text-on-primary-fixed transition-all shadow-xl">
          <span className="material-symbols-outlined">remove</span>
        </button>
        <button className="w-10 h-10 mt-2 bg-surface-container-low/80 backdrop-blur-xl border border-white/5 rounded-full flex items-center justify-center text-on-surface hover:bg-primary hover:text-on-primary-fixed transition-all shadow-xl">
          <span className="material-symbols-outlined">my_location</span>
        </button>
      </div>

      {/* Station Quick Select */}
      <div className="absolute bottom-6 left-20 right-[22rem] z-20">
        <div className="bg-surface-container-low/80 backdrop-blur-xl rounded-xl border border-white/5 p-4">
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            {mockStations.map(station => {
              const styles = getCrowdStyles(station.crowdLevel);
              return (
                <button
                  key={station.id}
                  onClick={() => setSelectedStation(station)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    selectedStation.id === station.id 
                      ? 'bg-primary text-on-primary-fixed' 
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  <span className={`inline-block w-2 h-2 rounded-full mr-2`} style={{ backgroundColor: styles.color }}></span>
                  {station.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Maps;
