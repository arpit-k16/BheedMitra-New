/**
 * Mock Data - Fallback data when API is not available
 * Based on actual DMRC time-series dataset structure
 */

// Station list from the dataset
export const MOCK_STATIONS = [
  'Adarsh Nagar', 'AIIMS', 'Akshardham', 'Anand Vihar ISBT', 'Arjan Garh',
  'Ashok Park Main', 'Azadpur', 'Barakhamba Road', 'Botanical Garden',
  'Central Secretariat', 'Chandni Chowk', 'Chawri Bazar', 'Chhatarpur',
  'Chirag Delhi', 'Civil Lines', 'Dabri Mor Janakpuri South', 'Delhi Gate',
  'Dilshad Garden', 'Dwarka', 'Dwarka Mor', 'Dwarka Sector 21',
  'GTB Nagar', 'Green Park', 'Guru Dronacharya', 'Hauz Khas',
  'Huda City Center', 'IFFCO Chowk', 'INA', 'ITO', 'Jahangirpuri',
  'Jama Masjid', 'Janak Puri West', 'Janpath', 'Jasola Apollo',
  'Kailash Colony', 'Kalkaji Mandir', 'Karol Bagh', 'Kashmere Gate',
  'Khan Market', 'Kirti Nagar', 'Lajpat Nagar', 'Lok Kalyan Marg',
  'MG Road', 'Mandi House', 'Mayur Vihar Phase1', 'Model Town',
  'Moolchand', 'Mundka', 'Nehru Place', 'New Delhi',
  'Noida City Centre', 'Noida Sector 18', 'Patel Chowk', 'Pragati Maidan',
  'Punjabi Bagh', 'Qutab Minar', 'RK Ashram Marg', 'Rajendra Place',
  'Rajiv Chowk', 'Rajouri Garden', 'Rohini West', 'Saket',
  'Sikandarpur', 'Vaishali', 'Vishwavidyalaya', 'Yamuna Bank'
];

// Analytics summary
export const MOCK_ANALYTICS = {
  total_records: 2486400,
  unique_stations: 286,
  avg_crowd_level: 2.8,
  avg_wait_time: 4.2,
  peak_stations: {
    'Rajiv Chowk': 4.2,
    'Kashmere Gate': 3.9,
    'Central Secretariat': 3.7,
    'New Delhi': 3.5,
    'Hauz Khas': 3.4
  }
};

// Crowd trends by time category
export const MOCK_TRENDS = {
  'Night': 1.5,
  'Morning Peak': 4.2,
  'Mid Morning': 2.8,
  'Afternoon': 2.5,
  'Evening Peak': 4.3
};

// Hourly trends
export const MOCK_HOURLY = {
  '0': 1.2, '1': 1.0, '2': 1.0, '3': 1.0, '4': 1.1, '5': 1.3,
  '6': 2.0, '7': 3.2, '8': 4.2, '9': 4.0, '10': 3.2, '11': 2.8,
  '12': 2.5, '13': 2.4, '14': 2.3, '15': 2.5, '16': 3.0, '17': 3.8,
  '18': 4.3, '19': 4.0, '20': 3.2, '21': 2.5, '22': 1.8, '23': 1.4
};

// Peak hours
export const MOCK_PEAK_HOURS = {
  morning_peak: { start: '08:00', end: '10:00', avg_crowd: 4.2 },
  evening_peak: { start: '18:00', end: '20:00', avg_crowd: 4.3 },
  least_crowded: { start: '14:00', end: '16:00', avg_crowd: 2.3 }
};

// Station rankings
export const MOCK_RANKINGS = [
  { station: 'Rajiv Chowk', station_id: 'YL20', value: 4.2 },
  { station: 'Kashmere Gate', station_id: 'YL15', value: 3.9 },
  { station: 'Central Secretariat', station_id: 'YL04', value: 3.7 },
  { station: 'New Delhi', station_id: 'YL18', value: 3.5 },
  { station: 'Hauz Khas', station_id: 'YL10', value: 3.4 },
  { station: 'Chandni Chowk', station_id: 'YL05', value: 3.3 },
  { station: 'AIIMS', station_id: 'YL02', value: 3.2 },
  { station: 'Nehru Place', station_id: 'VL07', value: 3.1 },
  { station: 'Botanical Garden', station_id: 'BL03', value: 3.0 },
  { station: 'Dwarka Sector 21', station_id: 'BL45', value: 2.9 }
];

// Weather impact
export const MOCK_WEATHER_IMPACT = {
  'Clear': 3.2,
  'Cloudy': 3.0,
  'Rainy': 2.5,
  'Foggy': 2.8
};

// Generate prediction
export const generateMockPrediction = (station, timeCategory, weather) => {
  const baseLevels = {
    'Morning Peak': 4,
    'Mid Morning': 3,
    'Afternoon': 2,
    'Evening Peak': 4,
    'Night': 1
  };
  
  const weatherAdjust = {
    'Clear': 0,
    'Cloudy': 0,
    'Rainy': -1,
    'Foggy': 0
  };
  
  let level = (baseLevels[timeCategory] || 3) + (weatherAdjust[weather] || 0);
  level = Math.max(1, Math.min(5, level));
  
  const labels = {
    1: 'Very Low',
    2: 'Low',
    3: 'Moderate',
    4: 'High',
    5: 'Very High'
  };
  
  return {
    station,
    crowd_level: level,
    crowd_label: labels[level],
    congestion_index: level * 20,
    confidence: 0.75 + Math.random() * 0.2,
    recommendation: level >= 4 
      ? 'High crowd expected. Consider alternative routes or delay travel.'
      : level >= 3 
      ? 'Moderate crowd expected. Plan accordingly.'
      : 'Good time to travel! Low crowd expected.'
  };
};

export default {
  MOCK_STATIONS,
  MOCK_ANALYTICS,
  MOCK_TRENDS,
  MOCK_HOURLY,
  MOCK_PEAK_HOURS,
  MOCK_RANKINGS,
  MOCK_WEATHER_IMPACT,
  generateMockPrediction
};
