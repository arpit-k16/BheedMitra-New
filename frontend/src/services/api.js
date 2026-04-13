/**
 * API Service - Backend Communication
 * Handles all API calls to FastAPI backend
 * Updated for Time-Series Dataset v3.0
 */

// Use empty string to use relative URLs (works with Vite proxy)
// or use the full URL when proxy doesn't work
const API_BASE_URL = '';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.isConnected = false;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`[API] Fetching: ${url}`);
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      console.log(`[API] Response status: ${response.status}`);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`[API] Response data:`, data);
      this.isConnected = true;
      return data;
    } catch (error) {
      console.error(`[API] Error [${endpoint}]:`, error);
      this.isConnected = false;
      throw error;
    }
  }

  // Check if backend is available
  async checkConnection(system = 'DMRC') {
    try {
      await this.request(`/health?system=${encodeURIComponent(system)}`);
      this.isConnected = true;
      return true;
    } catch {
      this.isConnected = false;
      return false;
    }
  }

  // Health check
  async healthCheck(system = 'DMRC') {
    return this.request(`/health?system=${encodeURIComponent(system)}`);
  }

  // Auth: signup
  async signup(payload) {
    return this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Auth: login
  async login(payload) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Prediction endpoint - Updated with hour parameter
  async predict({ station, system = 'DMRC', timeCategory, weather = 'Clear', dayType = 'Weekday', specialEvent = 'No', hour = null }) {
    const params = new URLSearchParams({
      station,
      system,
      time_category: timeCategory,
      weather,
      day_type: dayType,
      special_event: specialEvent
    });
    if (hour !== null) {
      params.append('hour', hour);
    }
    return this.request(`/api/predict?${params}`);
  }

  // Get all stations
  async getStations(system = 'DMRC') {
    return this.request(`/api/stations?system=${system}`);
  }

  // Get station IDs with names - New endpoint
  async getStationIds(system = 'DMRC') {
    return this.request(`/api/stations/ids?system=${encodeURIComponent(system)}`);
  }

  // Get station details
  async getStationInfo(stationName, system = 'DMRC') {
    return this.request(`/api/stations/${encodeURIComponent(stationName)}?system=${encodeURIComponent(system)}`);
  }

  // Get time-series data for a station - New endpoint
  async getStationTimeSeries(stationId, startDate = null, endDate = null, limit = 168, system = 'DMRC') {
    const params = new URLSearchParams({ limit: limit.toString(), system });
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return this.request(`/api/timeseries/${encodeURIComponent(stationId)}?${params}`);
  }

  // Get analytics summary
  async getAnalytics(system = 'DMRC') {
    return this.request(`/api/analytics/summary?system=${encodeURIComponent(system)}`);
  }

  // Get crowd trends by time category
  async getCrowdTrends(station = null, system = 'DMRC') {
    const params = new URLSearchParams({ system });
    if (station) params.append('station', station);
    return this.request(`/api/analytics/trends?${params}`);
  }

  // Get hourly crowd trends - New endpoint
  async getHourlyTrends(station = null, system = 'DMRC') {
    const params = new URLSearchParams({ system });
    if (station) params.append('station', station);
    return this.request(`/api/analytics/hourly?${params}`);
  }

  // Get peak hours data
  async getPeakHours(system = 'DMRC') {
    return this.request(`/api/analytics/peak-hours?system=${encodeURIComponent(system)}`);
  }

  // Get station rankings
  async getStationRankings(metric = 'crowd', limit = 10, system = 'DMRC') {
    return this.request(`/api/analytics/rankings?metric=${metric}&limit=${limit}&system=${encodeURIComponent(system)}`);
  }

  // Get weather impact - New endpoint
  async getWeatherImpact(system = 'DMRC') {
    return this.request(`/api/analytics/weather-impact?system=${encodeURIComponent(system)}`);
  }

  // Export data
  async exportData(format = 'csv', system = 'DMRC') {
    const response = await fetch(`${this.baseUrl}/api/export?format=${format}&system=${encodeURIComponent(system)}`);
    if (!response.ok) throw new Error('Export failed');
    return response.blob();
  }
}

export const api = new ApiService();
export default api;
