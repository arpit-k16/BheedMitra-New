/**
 * Prediction Widget Component - Quick crowd prediction
 * Updated for Time-Series Dataset v3.0
 */

import React, { useState, useEffect } from 'react';
import useStore from '../../store/useStore';
import api from '../../services/api';

const timeCategories = ['Morning Peak', 'Mid Morning', 'Afternoon', 'Evening Peak', 'Night'];
const weatherOptions = ['Clear', 'Cloudy', 'Rainy', 'Foggy'];

const crowdLabels = {
  1: { label: 'Very Low', color: 'emerald', emoji: '🟢' },
  2: { label: 'Low', color: 'green', emoji: '🟡' },
  3: { label: 'Moderate', color: 'amber', emoji: '🟠' },
  4: { label: 'High', color: 'orange', emoji: '🔴' },
  5: { label: 'Very High', color: 'red', emoji: '🔴🔴' },
};

function PredictionWidget() {
  const { stations, selectedSystem } = useStore();
  const [formData, setFormData] = useState({
    station: '',
    timeCategory: 'Morning Peak',
    weather: 'Clear',
    hour: new Date().getHours()
  });
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stationList, setStationList] = useState([]);

  // Load stations from API
  useEffect(() => {
    const loadStations = async () => {
      try {
        console.log('[PredictionWidget] Fetching stations...');
        const data = await api.getStations(selectedSystem);
        console.log('[PredictionWidget] Received:', data);
        setStationList(data && data.length > 0 ? data : getDefaultStations());
      } catch (error) {
        console.error('[PredictionWidget] Error:', error);
        setStationList(getDefaultStations());
      }
    };
    loadStations();
  }, [selectedSystem]);

  const getDefaultStations = () => (
    selectedSystem === 'MTA'
      ? ['Times Sq-42 St', 'Grand Central-42 St', '34 St-Penn Station', 'Fulton St', 'Canal St']
      : ['Adarsh Nagar', 'AIIMS', 'Azadpur', 'Central Secretariat', 'Chandni Chowk', 'Rajiv Chowk']
  );

  const displayStations = stationList.length > 0 ? stationList : 
    (stations.length > 0 ? stations : getDefaultStations());

  const handlePredict = async () => {
    if (!formData.station) return;
    
    setLoading(true);
    try {
      const result = await api.predict({
        station: formData.station,
        system: selectedSystem,
        timeCategory: formData.timeCategory,
        weather: formData.weather,
        hour: formData.hour
      });
      setPrediction(result);
    } catch (error) {
      // Mock prediction for demo
      const mockLevel = Math.floor(Math.random() * 3) + 2; // 2-4
      setPrediction({
        crowd_level: mockLevel,
        crowd_label: crowdLabels[mockLevel].label,
        congestion_index: mockLevel * 20 + Math.random() * 10,
        confidence: 0.75 + Math.random() * 0.2,
        recommendation: mockLevel >= 4 
          ? 'Consider delaying travel or using alternate stations.'
          : 'Good time to travel. Moderate crowd expected.'
      });
    } finally {
      setLoading(false);
    }
  };

  const levelInfo = prediction ? crowdLabels[prediction.crowd_level] || crowdLabels[3] : null;

  return (
    <div className="bg-[#0f1629] rounded-2xl border border-white/5 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Quick Prediction</h3>
          <p className="text-sm text-gray-500">Check crowd levels</p>
        </div>
        <span className="material-symbols-outlined text-cyan-400">psychology</span>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Station</label>
          <select
            value={formData.station}
            onChange={(e) => setFormData({ ...formData, station: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 focus:outline-none transition-colors"
          >
            <option value="">Select station...</option>
            {displayStations.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Time</label>
            <select
              value={formData.timeCategory}
              onChange={(e) => setFormData({ ...formData, timeCategory: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-cyan-500/50 focus:outline-none"
            >
              {timeCategories.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Hour</label>
            <select
              value={formData.hour}
              onChange={(e) => setFormData({ ...formData, hour: parseInt(e.target.value) })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-cyan-500/50 focus:outline-none"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 block">Weather</label>
          <div className="grid grid-cols-4 gap-2">
            {weatherOptions.map(w => (
              <button
                key={w}
                onClick={() => setFormData({ ...formData, weather: w })}
                className={`py-2 px-2 text-xs rounded-lg transition-all ${
                  formData.weather === w 
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                    : 'bg-white/5 text-gray-400 border border-white/5 hover:border-white/20'
                }`}
              >
                {w === 'Clear' && '☀️'}
                {w === 'Cloudy' && '☁️'}
                {w === 'Rainy' && '🌧️'}
                {w === 'Foggy' && '🌫️'}
                <span className="ml-1">{w}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handlePredict}
          disabled={!formData.station || loading}
          className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Predicting...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-sm">query_stats</span>
              Predict Crowd
            </>
          )}
        </button>
      </div>

      {/* Result */}
      {prediction && (
        <div className="mt-6 pt-6 border-t border-white/5">
          <div className="text-center mb-4">
            <span className="text-4xl">{levelInfo?.emoji}</span>
            <p className={`text-2xl font-bold mt-2 text-${levelInfo?.color}-400`}>
              {prediction.crowd_label}
            </p>
            <p className="text-sm text-gray-400">
              Level {prediction.crowd_level}/5 • {prediction.congestion_index?.toFixed(0)}% congestion
            </p>
          </div>
          
          {/* Confidence */}
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Confidence</span>
              <span className="text-cyan-400">{(prediction.confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-cyan-500 rounded-full"
                style={{ width: `${prediction.confidence * 100}%` }}
              />
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-white/5 rounded-xl p-3 text-sm text-gray-300">
            <span className="material-symbols-outlined text-amber-400 text-sm mr-1 align-middle">tips_and_updates</span>
            {prediction.recommendation}
          </div>
        </div>
      )}
    </div>
  );
}

export default PredictionWidget;
