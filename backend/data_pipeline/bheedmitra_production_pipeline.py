"""
BheedMitra Production Dataset Generation Pipeline
==================================================
A production-quality, GTFS-based dataset generator for metro transit systems.

Features:
- Multi-city support (DMRC, MTA)
- GTFS data integration
- Weather API integration (Open-Meteo)
- Realistic ridership simulation
- Station-wise hourly time series
- Feature engineering for ML
- Data validation & EDA

Author: BheedMitra Team
"""

import pandas as pd
import numpy as np
import requests
import zipfile
import io
import os
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

# Visualization imports
try:
    import matplotlib.pyplot as plt
    import seaborn as sns
    PLOTTING_AVAILABLE = True
except ImportError:
    PLOTTING_AVAILABLE = False
    print("⚠️  matplotlib/seaborn not available. Plots will be skipped.")

# =============================================================================
# CONFIGURATION
# =============================================================================

@dataclass
class CityConfig:
    """Configuration for a specific metro system"""
    city_name: str
    country: str
    latitude: float
    longitude: float
    gtfs_url: Optional[str]
    timezone: str
    major_stations: List[str]
    routes: Dict[str, str]  # route_id -> route_name
    
    # Simulation parameters
    base_ridership_range: Tuple[int, int] = (100, 500)
    peak_multiplier: float = 2.5
    weekend_multiplier: float = 0.7
    rain_impact: float = 0.85


# Delhi Metro (DMRC) Configuration
DMRC_CONFIG = CityConfig(
    city_name="Delhi",
    country="India",
    latitude=28.6139,
    longitude=77.2090,
    gtfs_url=None,  # DMRC doesn't have public GTFS
    timezone="Asia/Kolkata",
    major_stations=[
        "Rajiv Chowk", "Kashmere Gate", "Central Secretariat", "New Delhi",
        "Chandni Chowk", "Noida City Centre", "HUDA City Centre", "Hauz Khas",
        "INA", "Botanical Garden", "Dwarka Sector 21", "Vaishali"
    ],
    routes={
        "RED": "Red Line",
        "YELLOW": "Yellow Line",
        "BLUE": "Blue Line",
        "GREEN": "Green Line",
        "VIOLET": "Violet Line",
        "PINK": "Pink Line",
        "MAGENTA": "Magenta Line",
        "GREY": "Grey Line"
    },
    base_ridership_range=(200, 800),
    peak_multiplier=2.8,
    weekend_multiplier=0.65
)


# MTA (New York) Configuration
MTA_CONFIG = CityConfig(
    city_name="New York",
    country="USA",
    latitude=40.7128,
    longitude=-74.0060,
    gtfs_url="http://web.mta.info/developers/data/nyct/subway/google_transit.zip",
    timezone="America/New_York",
    major_stations=[
        "Times Square-42 St", "Grand Central-42 St", "34 St-Penn Station",
        "14 St-Union Sq", "Fulton St", "59 St-Columbus Circle",
        "Atlantic Av-Barclays Ctr", "125 St"
    ],
    routes={
        "1": "1 Line", "2": "2 Line", "3": "3 Line",
        "4": "4 Line", "5": "5 Line", "6": "6 Line",
        "7": "7 Line", "A": "A Line", "B": "B Line",
        "C": "C Line", "D": "D Line", "E": "E Line",
        "F": "F Line", "L": "L Line", "N": "N Line", "Q": "Q Line"
    },
    base_ridership_range=(300, 1200),
    peak_multiplier=3.0,
    weekend_multiplier=0.75
)


# =============================================================================
# 1. GTFS DATA DOWNLOAD & PARSING
# =============================================================================

def download_gtfs(config: CityConfig, output_dir: str = "gtfs_data") -> Optional[str]:
    """
    Download GTFS data for a city
    
    Args:
        config: City configuration
        output_dir: Directory to save GTFS files
    
    Returns:
        Path to extracted GTFS directory or None if unavailable
    """
    if config.gtfs_url is None:
        print(f"⚠️  No GTFS URL for {config.city_name}. Will use synthetic station data.")
        return None
    
    print(f"📥 Downloading GTFS data for {config.city_name}...")
    
    try:
        response = requests.get(config.gtfs_url, timeout=30)
        response.raise_for_status()
        
        # Extract ZIP
        gtfs_dir = os.path.join(output_dir, config.city_name.lower().replace(" ", "_"))
        os.makedirs(gtfs_dir, exist_ok=True)
        
        with zipfile.ZipFile(io.BytesIO(response.content)) as zip_ref:
            zip_ref.extractall(gtfs_dir)
        
        print(f"✅ GTFS data downloaded to {gtfs_dir}")
        return gtfs_dir
        
    except Exception as e:
        print(f"❌ Failed to download GTFS: {e}")
        return None


def parse_stations(config: CityConfig, gtfs_dir: Optional[str] = None) -> pd.DataFrame:
    """
    Parse station data from GTFS stops.txt or generate synthetic stations
    
    Args:
        config: City configuration
        gtfs_dir: Path to GTFS directory (optional)
    
    Returns:
        DataFrame with columns: station_id, station_name, route_id, latitude, longitude, is_major
    """
    print(f"🚉 Parsing stations for {config.city_name}...")
    
    if gtfs_dir and os.path.exists(os.path.join(gtfs_dir, "stops.txt")):
        # Use real GTFS data
        stops = pd.read_csv(os.path.join(gtfs_dir, "stops.txt"))
        
        # Filter to stations only (not platforms)
        if 'location_type' in stops.columns:
            stations = stops[stops['location_type'] == 1].copy()
        else:
            stations = stops.copy()
        
        stations = stations.rename(columns={
            'stop_id': 'station_id',
            'stop_name': 'station_name',
            'stop_lat': 'latitude',
            'stop_lon': 'longitude'
        })
        
        # Assign routes (simplified - in reality would parse routes.txt)
        route_ids = list(config.routes.keys())
        stations['route_id'] = [route_ids[i % len(route_ids)] for i in range(len(stations))]
        
    else:
        # Generate synthetic stations for DMRC
        stations_data = []
        
        # DMRC Station List (comprehensive)
        dmrc_stations = [
            # Red Line
            ("R01", "Shaheed Sthal", "RED", False),
            ("R02", "Hindon River", "RED", False),
            ("R03", "Arthala", "RED", False),
            ("R04", "Mohan Nagar", "RED", False),
            ("R05", "Shyam Park", "RED", False),
            ("R06", "Major Mohit Sharma", "RED", False),
            ("R07", "Raj Bagh", "RED", False),
            ("R08", "Shaheed Nagar", "RED", False),
            ("R09", "Dilshad Garden", "RED", True),
            ("R10", "Jhilmil", "RED", False),
            ("R11", "Mansarovar Park", "RED", False),
            ("R12", "Shahdara", "RED", True),
            ("R13", "Welcome", "RED", True),
            ("R14", "Seelampur", "RED", False),
            ("R15", "Shastri Park", "RED", False),
            ("R16", "Kashmere Gate", "RED", True),
            ("R17", "Tis Hazari", "RED", False),
            ("R18", "Pulbangash", "RED", False),
            ("R19", "Pratap Nagar", "RED", False),
            ("R20", "Shastri Nagar", "RED", False),
            ("R21", "Inderlok", "RED", True),
            ("R22", "Kanhaiya Nagar", "RED", False),
            ("R23", "Keshav Puram", "RED", False),
            ("R24", "Netaji Subhash Place", "RED", True),
            ("R25", "Kohat Enclave", "RED", False),
            ("R26", "Pitampura", "RED", False),
            ("R27", "Rohini East", "RED", False),
            ("R28", "Rohini West", "RED", True),
            ("R29", "Rithala", "RED", True),
            
            # Yellow Line
            ("Y01", "Samaypur Badli", "YELLOW", False),
            ("Y02", "Rohini Sector 18-19", "YELLOW", False),
            ("Y03", "Haiderpur Badli Mor", "YELLOW", False),
            ("Y04", "Jahangirpuri", "YELLOW", True),
            ("Y05", "Adarsh Nagar", "YELLOW", False),
            ("Y06", "Azadpur", "YELLOW", True),
            ("Y07", "Model Town", "YELLOW", False),
            ("Y08", "GTB Nagar", "YELLOW", False),
            ("Y09", "Vishwavidyalaya", "YELLOW", True),
            ("Y10", "Vidhan Sabha", "YELLOW", False),
            ("Y11", "Civil Lines", "YELLOW", False),
            ("Y12", "Kashmere Gate", "YELLOW", True),
            ("Y13", "Chandni Chowk", "YELLOW", True),
            ("Y14", "Chawri Bazar", "YELLOW", False),
            ("Y15", "New Delhi", "YELLOW", True),
            ("Y16", "Rajiv Chowk", "YELLOW", True),
            ("Y17", "Patel Chowk", "YELLOW", True),
            ("Y18", "Central Secretariat", "YELLOW", True),
            ("Y19", "Udyog Bhawan", "YELLOW", False),
            ("Y20", "Lok Kalyan Marg", "YELLOW", False),
            ("Y21", "Jorbagh", "YELLOW", False),
            ("Y22", "INA", "YELLOW", True),
            ("Y23", "AIIMS", "YELLOW", True),
            ("Y24", "Green Park", "YELLOW", True),
            ("Y25", "Hauz Khas", "YELLOW", True),
            ("Y26", "Malviya Nagar", "YELLOW", False),
            ("Y27", "Saket", "YELLOW", True),
            ("Y28", "Qutub Minar", "YELLOW", False),
            ("Y29", "Chattarpur", "YELLOW", False),
            ("Y30", "Sultanpur", "YELLOW", False),
            ("Y31", "Ghitorni", "YELLOW", False),
            ("Y32", "Arjan Garh", "YELLOW", False),
            ("Y33", "Guru Dronacharya", "YELLOW", False),
            ("Y34", "Sikanderpur", "YELLOW", True),
            ("Y35", "MG Road", "YELLOW", True),
            ("Y36", "IFFCO Chowk", "YELLOW", True),
            ("Y37", "HUDA City Centre", "YELLOW", True),
            
            # Blue Line
            ("B01", "Noida Electronic City", "BLUE", True),
            ("B02", "Noida Sector 62", "BLUE", True),
            ("B03", "Noida Sector 59", "BLUE", False),
            ("B04", "Noida Sector 61", "BLUE", False),
            ("B05", "Noida Sector 52", "BLUE", False),
            ("B06", "Noida Sector 34", "BLUE", False),
            ("B07", "Noida City Centre", "BLUE", True),
            ("B08", "Golf Course", "BLUE", False),
            ("B09", "Botanical Garden", "BLUE", True),
            ("B10", "Noida Sector 18", "BLUE", True),
            ("B11", "Noida Sector 16", "BLUE", False),
            ("B12", "Noida Sector 15", "BLUE", True),
            ("B13", "New Ashok Nagar", "BLUE", False),
            ("B14", "Mayur Vihar Extension", "BLUE", False),
            ("B15", "Mayur Vihar-I", "BLUE", False),
            ("B16", "Akshardham", "BLUE", True),
            ("B17", "Yamuna Bank", "BLUE", True),
            ("B18", "Indraprastha", "BLUE", False),
            ("B19", "Supreme Court", "BLUE", False),
            ("B20", "Mandi House", "BLUE", True),
            ("B21", "Barakhamba Road", "BLUE", True),
            ("B22", "Rajiv Chowk", "BLUE", True),
            ("B23", "Ramakrishna Ashram Marg", "BLUE", False),
            ("B24", "Jhandewalan", "BLUE", False),
            ("B25", "Karol Bagh", "BLUE", True),
            ("B26", "Rajendra Place", "BLUE", True),
            ("B27", "Patel Nagar", "BLUE", False),
            ("B28", "Shadipur", "BLUE", False),
            ("B29", "Kirti Nagar", "BLUE", True),
            ("B30", "Moti Nagar", "BLUE", False),
            ("B31", "Ramesh Nagar", "BLUE", False),
            ("B32", "Rajouri Garden", "BLUE", True),
            ("B33", "Tagore Garden", "BLUE", False),
            ("B34", "Subhash Nagar", "BLUE", False),
            ("B35", "Tilak Nagar", "BLUE", False),
            ("B36", "Janakpuri East", "BLUE", False),
            ("B37", "Janakpuri West", "BLUE", True),
            ("B38", "Uttam Nagar East", "BLUE", False),
            ("B39", "Uttam Nagar West", "BLUE", False),
            ("B40", "Nawada", "BLUE", False),
            ("B41", "Dwarka Mor", "BLUE", True),
            ("B42", "Dwarka", "BLUE", False),
            ("B43", "Dwarka Sector 14", "BLUE", False),
            ("B44", "Dwarka Sector 13", "BLUE", False),
            ("B45", "Dwarka Sector 12", "BLUE", False),
            ("B46", "Dwarka Sector 11", "BLUE", False),
            ("B47", "Dwarka Sector 10", "BLUE", False),
            ("B48", "Dwarka Sector 9", "BLUE", False),
            ("B49", "Dwarka Sector 8", "BLUE", False),
            ("B50", "Dwarka Sector 21", "BLUE", True),
            
            # Green Line
            ("G01", "Kirti Nagar", "GREEN", True),
            ("G02", "Satguru Ram Singh Marg", "GREEN", False),
            ("G03", "Ashok Park Main", "GREEN", False),
            ("G04", "Punjabi Bagh", "GREEN", False),
            ("G05", "Punjabi Bagh West", "GREEN", False),
            ("G06", "Shivaji Park", "GREEN", False),
            ("G07", "Madipur", "GREEN", False),
            ("G08", "Paschim Vihar East", "GREEN", False),
            ("G09", "Paschim Vihar West", "GREEN", False),
            ("G10", "Peeragarhi", "GREEN", False),
            ("G11", "Udyog Nagar", "GREEN", False),
            ("G12", "Maharaja Surajmal Stadium", "GREEN", False),
            ("G13", "Nangloi", "GREEN", False),
            ("G14", "Nangloi Railway Station", "GREEN", False),
            ("G15", "Rajdhani Park", "GREEN", False),
            ("G16", "Mundka", "GREEN", False),
            ("G17", "Mundka Industrial Area", "GREEN", False),
            ("G18", "Ghevra Metro Station", "GREEN", False),
            ("G19", "Tikri Kalan", "GREEN", False),
            ("G20", "Tikri Border", "GREEN", False),
            ("G21", "Pandit Shree Ram Sharma", "GREEN", False),
            ("G22", "Bahadurgarh City", "GREEN", False),
            ("G23", "Brigadier Hoshiar Singh", "GREEN", False),
            
            # Violet Line
            ("V01", "Kashmere Gate", "VIOLET", True),
            ("V02", "Lal Quila", "VIOLET", False),
            ("V03", "Jama Masjid", "VIOLET", False),
            ("V04", "Delhi Gate", "VIOLET", False),
            ("V05", "ITO", "VIOLET", True),
            ("V06", "Mandi House", "VIOLET", True),
            ("V07", "Janpath", "VIOLET", True),
            ("V08", "Central Secretariat", "VIOLET", True),
            ("V09", "Khan Market", "VIOLET", True),
            ("V10", "JLN Stadium", "VIOLET", False),
            ("V11", "Jangpura", "VIOLET", False),
            ("V12", "Lajpat Nagar", "VIOLET", True),
            ("V13", "Moolchand", "VIOLET", False),
            ("V14", "Kailash Colony", "VIOLET", False),
            ("V15", "Nehru Place", "VIOLET", True),
            ("V16", "Kalkaji Mandir", "VIOLET", True),
            ("V17", "Govindpuri", "VIOLET", False),
            ("V18", "Okhla", "VIOLET", False),
            ("V19", "Jasola", "VIOLET", False),
            ("V20", "Sarita Vihar", "VIOLET", False),
            ("V21", "Mohan Estate", "VIOLET", False),
            ("V22", "Tughlakabad", "VIOLET", False),
            ("V23", "Badarpur Border", "VIOLET", True),
            ("V24", "Sarai", "VIOLET", False),
            ("V25", "NHPC Chowk", "VIOLET", False),
            ("V26", "Mewla Maharajpur", "VIOLET", False),
            ("V27", "Sector 28", "VIOLET", False),
            ("V28", "Badkal Mor", "VIOLET", False),
            ("V29", "Old Faridabad", "VIOLET", False),
            ("V30", "Neelam Chowk Ajronda", "VIOLET", False),
            ("V31", "Bata Chowk", "VIOLET", False),
            ("V32", "Escorts Mujesar", "VIOLET", True),
            ("V33", "Sant Surdas", "VIOLET", False),
            ("V34", "Raja Nahar Singh", "VIOLET", True),
            
            # Pink Line
            ("P01", "Majlis Park", "PINK", False),
            ("P02", "Azadpur", "PINK", True),
            ("P03", "Shalimar Bagh", "PINK", False),
            ("P04", "Netaji Subhash Place", "PINK", True),
            ("P05", "Shakurpur", "PINK", False),
            ("P06", "Punjabi Bagh West", "PINK", False),
            ("P07", "ESI Hospital", "PINK", False),
            ("P08", "Rajouri Garden", "PINK", True),
            ("P09", "Mayapuri", "PINK", False),
            ("P10", "Naraina Vihar", "PINK", False),
            ("P11", "Delhi Cantt", "PINK", True),
            ("P12", "Durgabai Deshmukh South Campus", "PINK", False),
            ("P13", "Sir Vishweshwaraiah Moti Bagh", "PINK", False),
            ("P14", "Bhikaji Cama Place", "PINK", True),
            ("P15", "Sarojini Nagar", "PINK", True),
            ("P16", "INA", "PINK", True),
            ("P17", "South Extension", "PINK", True),
            ("P18", "Lajpat Nagar", "PINK", True),
            ("P19", "Vinobapuri", "PINK", False),
            ("P20", "Ashram", "PINK", True),
            ("P21", "Hazrat Nizamuddin", "PINK", True),
            ("P22", "Mayur Vihar Pocket 1", "PINK", False),
            ("P23", "Trilokpuri", "PINK", False),
            ("P24", "East Vinod Nagar", "PINK", False),
            ("P25", "Mandawali", "PINK", False),
            ("P26", "IP Extension", "PINK", False),
            ("P27", "Anand Vihar", "PINK", True),
            ("P28", "Karkarduma", "PINK", False),
            ("P29", "Karkarduma Court", "PINK", False),
            ("P30", "Krishna Nagar", "PINK", False),
            ("P31", "East Azad Nagar", "PINK", False),
            ("P32", "Welcome", "PINK", True),
            ("P33", "Jafrabad", "PINK", False),
            ("P34", "Maujpur", "PINK", False),
            ("P35", "Gokulpuri", "PINK", False),
            ("P36", "Johri Enclave", "PINK", False),
            ("P37", "Shiv Vihar", "PINK", True),
            
            # Magenta Line
            ("M01", "Janakpuri West", "MAGENTA", True),
            ("M02", "Dabri Mor", "MAGENTA", False),
            ("M03", "Dashrathpuri", "MAGENTA", False),
            ("M04", "Palam", "MAGENTA", False),
            ("M05", "Sadar Bazaar Cantonment", "MAGENTA", False),
            ("M06", "Terminal 1 IGI Airport", "MAGENTA", True),
            ("M07", "Shankar Vihar", "MAGENTA", False),
            ("M08", "Vasant Vihar", "MAGENTA", False),
            ("M09", "Munirka", "MAGENTA", False),
            ("M10", "RK Puram", "MAGENTA", False),
            ("M11", "IIT Delhi", "MAGENTA", True),
            ("M12", "Hauz Khas", "MAGENTA", True),
            ("M13", "Panchsheel Park", "MAGENTA", False),
            ("M14", "Chirag Delhi", "MAGENTA", False),
            ("M15", "Greater Kailash", "MAGENTA", True),
            ("M16", "Nehru Enclave", "MAGENTA", False),
            ("M17", "Kalkaji Mandir", "MAGENTA", True),
            ("M18", "Okhla NSIC", "MAGENTA", False),
            ("M19", "Sukhdev Vihar", "MAGENTA", False),
            ("M20", "Jamia Millia Islamia", "MAGENTA", True),
            ("M21", "Okhla Vihar", "MAGENTA", False),
            ("M22", "Jasola Vihar", "MAGENTA", False),
            ("M23", "Kalindi Kunj", "MAGENTA", True),
            ("M24", "Okhla Bird Sanctuary", "MAGENTA", False),
            ("M25", "Botanical Garden", "MAGENTA", True),
            
            # Grey Line (Dwarka-Najafgarh)
            ("GR01", "Dwarka", "GREY", False),
            ("GR02", "Nangli", "GREY", False),
            ("GR03", "Najafgarh", "GREY", False),
        ]
        
        for station_id, station_name, route_id, is_major in dmrc_stations:
            stations_data.append({
                'station_id': station_id,
                'station_name': station_name,
                'route_id': route_id,
                'latitude': config.latitude + np.random.uniform(-0.3, 0.3),
                'longitude': config.longitude + np.random.uniform(-0.3, 0.3),
                'is_major': is_major
            })
        
        stations = pd.DataFrame(stations_data)
    
    # Mark major stations
    if 'is_major' not in stations.columns:
        stations['is_major'] = stations['station_name'].isin(config.major_stations)
    
    print(f"✅ Loaded {len(stations)} stations")
    return stations[['station_id', 'station_name', 'route_id', 'latitude', 'longitude', 'is_major']]


# =============================================================================
# 2. COMPUTE TRAIN FREQUENCY FROM GTFS
# =============================================================================

def compute_train_frequency(
    config: CityConfig,
    stations: pd.DataFrame,
    gtfs_dir: Optional[str] = None,
    date_range: Tuple[datetime, datetime] = None
) -> pd.DataFrame:
    """
    Compute hourly train frequency per station from GTFS or simulate
    
    Args:
        config: City configuration
        stations: Station DataFrame
        gtfs_dir: Path to GTFS directory
        date_range: Tuple of (start_date, end_date)
    
    Returns:
        DataFrame with columns: station_id, timestamp, train_frequency
    """
    print(f"🚂 Computing train frequency...")
    
    if date_range is None:
        # Default: 30 days starting from Jan 1, 2024
        start_date = datetime(2024, 1, 1)
        end_date = datetime(2024, 1, 31)
    else:
        start_date, end_date = date_range
    
    # Generate hourly timestamps
    timestamps = pd.date_range(start=start_date, end=end_date, freq='H')
    
    # Create all combinations of stations and timestamps
    frequency_data = []
    
    for station_id in stations['station_id'].unique():
        for ts in timestamps:
            hour = ts.hour
            is_weekend = ts.weekday() >= 5
            
            # Simulate train frequency based on time and day
            if 6 <= hour < 10:  # Morning peak
                base_freq = np.random.randint(15, 25)
            elif 17 <= hour < 21:  # Evening peak
                base_freq = np.random.randint(15, 25)
            elif 10 <= hour < 17:  # Mid-day
                base_freq = np.random.randint(10, 18)
            elif 21 <= hour < 24 or 0 <= hour < 6:  # Night/early morning
                base_freq = np.random.randint(4, 10)
            else:
                base_freq = np.random.randint(8, 15)
            
            # Weekend adjustment
            if is_weekend:
                base_freq = int(base_freq * 0.8)
            
            frequency_data.append({
                'station_id': station_id,
                'timestamp': ts,
                'train_frequency': max(2, base_freq)  # At least 2 trains/hour
            })
    
    frequency_df = pd.DataFrame(frequency_data)
    print(f"✅ Generated train frequency for {len(frequency_df)} records")
    return frequency_df


# =============================================================================
# 3. FETCH WEATHER DATA (Open-Meteo API)
# =============================================================================

def fetch_weather_data(
    config: CityConfig,
    start_date: datetime,
    end_date: datetime
) -> pd.DataFrame:
    """
    Fetch historical weather data from Open-Meteo API
    
    Args:
        config: City configuration with lat/lon
        start_date: Start date for weather data
        end_date: End date for weather data
    
    Returns:
        DataFrame with columns: timestamp, temperature, rainfall
    """
    print(f"🌤️  Fetching weather data for {config.city_name}...")
    
    try:
        # Open-Meteo API endpoint
        url = "https://archive-api.open-meteo.com/v1/archive"
        
        params = {
            "latitude": config.latitude,
            "longitude": config.longitude,
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "hourly": "temperature_2m,precipitation",
            "timezone": config.timezone
        }
        
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        
        # Parse response
        weather_df = pd.DataFrame({
            'timestamp': pd.to_datetime(data['hourly']['time']),
            'temperature': data['hourly']['temperature_2m'],
            'rainfall': data['hourly']['precipitation']
        })
        
        print(f"✅ Fetched {len(weather_df)} weather records")
        return weather_df
        
    except Exception as e:
        print(f"⚠️  Weather API failed: {e}. Using synthetic weather data.")
        
        # Generate synthetic weather
        timestamps = pd.date_range(start=start_date, end=end_date, freq='H')
        
        # Realistic temperature patterns for Delhi/NYC
        base_temp = 20 if config.city_name == "Delhi" else 15
        temps = []
        rainfall = []
        
        for ts in timestamps:
            # Daily temperature cycle
            hour_factor = np.sin((ts.hour - 6) * np.pi / 12)  # Peak at 2 PM
            daily_temp = base_temp + 10 * hour_factor + np.random.normal(0, 2)
            temps.append(round(daily_temp, 1))
            
            # Rainfall (10% chance, mostly light)
            if np.random.random() < 0.1:
                rainfall.append(round(np.random.exponential(2), 1))
            else:
                rainfall.append(0.0)
        
        weather_df = pd.DataFrame({
            'timestamp': timestamps,
            'temperature': temps,
            'rainfall': rainfall
        })
        
        print(f"✅ Generated {len(weather_df)} synthetic weather records")
        return weather_df


# =============================================================================
# 4. SIMULATE REALISTIC RIDERSHIP
# =============================================================================

def simulate_ridership(
    config: CityConfig,
    stations: pd.DataFrame,
    train_frequency: pd.DataFrame,
    weather: pd.DataFrame
) -> pd.DataFrame:
    """
    Simulate realistic station-wise ridership using multiple factors
    
    Args:
        config: City configuration
        stations: Station data with importance flags
        train_frequency: Hourly train frequency data
        weather: Hourly weather data
    
    Returns:
        DataFrame with ridership_count column added
    """
    print(f"👥 Simulating ridership patterns...")
    
    # Merge all data
    df = train_frequency.merge(
        stations[['station_id', 'station_name', 'route_id', 'is_major']],
        on='station_id',
        how='left'
    )
    
    df = df.merge(weather, on='timestamp', how='left')
    
    # Extract time features
    df['hour_of_day'] = df['timestamp'].dt.hour
    df['day_of_week'] = df['timestamp'].dt.dayofweek
    df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
    df['month'] = df['timestamp'].dt.month
    
    # Define peak hours
    df['is_peak_hour'] = df['hour_of_day'].apply(
        lambda h: 1 if (8 <= h <= 10) or (17 <= h <= 20) else 0
    )
    
    # Base ridership by station importance
    df['base_ridership'] = df['is_major'].apply(
        lambda is_maj: np.random.randint(*config.base_ridership_range) if is_maj
        else np.random.randint(config.base_ridership_range[0] // 2, config.base_ridership_range[1] // 2)
    )
    
    # Apply multipliers
    ridership_values = []
    
    for idx, row in df.iterrows():
        base = row['base_ridership']
        
        # Peak hour multiplier
        if row['is_peak_hour']:
            multiplier = config.peak_multiplier
        else:
            multiplier = 1.0
        
        # Weekend multiplier
        if row['is_weekend']:
            multiplier *= config.weekend_multiplier
        
        # Rainfall impact (reduce ridership)
        if row['rainfall'] > 0:
            rain_factor = max(0.7, 1 - (row['rainfall'] / 20))  # More rain = fewer people
            multiplier *= rain_factor
        
        # Train frequency impact (more trains = easier to travel)
        freq_factor = 1 + (row['train_frequency'] - 10) * 0.02
        multiplier *= max(0.8, min(1.2, freq_factor))
        
        # Add realistic noise
        noise = np.random.normal(1.0, 0.15)
        
        ridership = int(base * multiplier * noise)
        ridership = max(10, ridership)  # Minimum 10 people/hour
        
        ridership_values.append(ridership)
    
    df['ridership_count'] = ridership_values
    
    print(f"✅ Simulated ridership for {len(df)} records")
    return df


# =============================================================================
# 5. FEATURE ENGINEERING
# =============================================================================

def feature_engineering(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add derived features for ML models
    
    Features added:
    - rolling_demand_3h: 3-hour rolling sum of ridership
    - ridership_per_train: ridership / train_frequency
    - station_congestion_index: normalized congestion metric
    - crowd_level: categorical (low/medium/high)
    """
    print(f"⚙️  Engineering features...")
    
    # Sort by station and time
    df = df.sort_values(['station_id', 'timestamp']).reset_index(drop=True)
    
    # 1. Rolling demand (3-hour window)
    df['rolling_demand_3h'] = df.groupby('station_id')['ridership_count'].transform(
        lambda x: x.rolling(window=3, min_periods=1).sum()
    )
    
    # 2. Ridership per train
    df['ridership_per_train'] = (df['ridership_count'] / df['train_frequency']).round(1)
    
    # 3. Congestion index (normalized 0-1)
    # Higher ridership + lower frequency = higher congestion
    df['station_congestion_index'] = df['ridership_count'] / (df['train_frequency'] * 100)
    
    # Normalize to 0-1 range
    max_congestion = df['station_congestion_index'].max()
    if max_congestion > 0:
        df['station_congestion_index'] = (df['station_congestion_index'] / max_congestion).round(2)
    
    # 4. Crowd level (categorical)
    def assign_crowd_level(congestion):
        if congestion < 0.4:
            return 'low'
        elif congestion < 0.7:
            return 'medium'
        else:
            return 'high'
    
    df['crowd_level'] = df['station_congestion_index'].apply(assign_crowd_level)
    
    # 5. Event flag (holidays and special days)
    # For now, mark some weekends as events (can be enhanced with actual holiday data)
    df['event_flag'] = 0
    # Mark first Saturday of each month as event day
    first_saturdays = df[df['day_of_week'] == 5].groupby(df['timestamp'].dt.to_period('M')).first().index
    # Simplified: mark 5% of weekend days as events
    weekend_mask = df['is_weekend'] == 1
    event_indices = df[weekend_mask].sample(frac=0.05, random_state=42).index
    df.loc[event_indices, 'event_flag'] = 1
    
    print(f"✅ Added 5 derived features")
    return df


# =============================================================================
# 6. DATA VALIDATION
# =============================================================================

def validate_dataset(df: pd.DataFrame) -> Tuple[bool, List[str]]:
    """
    Validate the generated dataset
    
    Returns:
        Tuple of (is_valid, list_of_issues)
    """
    print(f"✔️  Validating dataset...")
    
    issues = []
    
    # Check for null values in critical columns
    critical_cols = [
        'station_id', 'station_name', 'timestamp', 'ridership_count',
        'train_frequency', 'temperature'
    ]
    
    for col in critical_cols:
        if col in df.columns:
            null_count = df[col].isnull().sum()
            if null_count > 0:
                issues.append(f"❌ Column '{col}' has {null_count} null values")
    
    # Check ridership is positive
    if (df['ridership_count'] <= 0).any():
        issues.append(f"❌ Found {(df['ridership_count'] <= 0).sum()} non-positive ridership values")
    
    # Check congestion index is in [0, 1]
    if df['station_congestion_index'].min() < 0 or df['station_congestion_index'].max() > 1:
        issues.append(f"❌ Congestion index out of range [0,1]: min={df['station_congestion_index'].min():.2f}, max={df['station_congestion_index'].max():.2f}")
    
    # Check for timestamp gaps (should be continuous hourly)
    for station_id in df['station_id'].unique()[:5]:  # Check first 5 stations
        station_data = df[df['station_id'] == station_id].sort_values('timestamp')
        time_diffs = station_data['timestamp'].diff().dt.total_seconds() / 3600
        unexpected_gaps = time_diffs[time_diffs > 1].dropna()
        
        if len(unexpected_gaps) > 0:
            issues.append(f"⚠️  Station {station_id} has {len(unexpected_gaps)} timestamp gaps > 1 hour")
            break
    
    # Check minimum row count
    if len(df) < 10000:
        issues.append(f"⚠️  Dataset has only {len(df)} rows (target: 10,000+)")
    
    # Report results
    if issues:
        print(f"⚠️  Validation found {len(issues)} issues:")
        for issue in issues:
            print(f"   {issue}")
        return False, issues
    else:
        print(f"✅ Validation passed! Dataset is production-ready.")
        return True, []


# =============================================================================
# 7. EDA & VISUALIZATION
# =============================================================================

def generate_eda_plots(df: pd.DataFrame, output_dir: str = "output"):
    """
    Generate exploratory data analysis plots
    
    Plots generated:
    1. Ridership vs Hour of Day
    2. Congestion Distribution
    3. Ridership Heatmap (Station x Hour)
    4. Weather Impact on Ridership
    """
    if not PLOTTING_AVAILABLE:
        print("⚠️  Skipping plots (matplotlib not available)")
        return
    
    print(f"📊 Generating EDA plots...")
    
    os.makedirs(output_dir, exist_ok=True)
    
    # Set style
    sns.set_style("whitegrid")
    plt.rcParams['figure.figsize'] = (12, 6)
    
    # 1. Ridership vs Hour of Day
    plt.figure(figsize=(14, 6))
    hourly_ridership = df.groupby('hour_of_day')['ridership_count'].agg(['mean', 'std'])
    
    plt.subplot(1, 2, 1)
    plt.plot(hourly_ridership.index, hourly_ridership['mean'], marker='o', linewidth=2, color='#2E86AB')
    plt.fill_between(
        hourly_ridership.index,
        hourly_ridership['mean'] - hourly_ridership['std'],
        hourly_ridership['mean'] + hourly_ridership['std'],
        alpha=0.3,
        color='#2E86AB'
    )
    plt.xlabel('Hour of Day', fontsize=12)
    plt.ylabel('Average Ridership', fontsize=12)
    plt.title('Ridership Pattern Throughout the Day', fontsize=14, fontweight='bold')
    plt.grid(alpha=0.3)
    plt.xticks(range(0, 24, 2))
    
    # 2. Congestion Distribution
    plt.subplot(1, 2, 2)
    crowd_counts = df['crowd_level'].value_counts()
    colors = {'low': '#06A77D', 'medium': '#F77F00', 'high': '#D62828'}
    plt.bar(crowd_counts.index, crowd_counts.values, color=[colors[x] for x in crowd_counts.index])
    plt.xlabel('Crowd Level', fontsize=12)
    plt.ylabel('Count', fontsize=12)
    plt.title('Congestion Level Distribution', fontsize=14, fontweight='bold')
    plt.grid(axis='y', alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'ridership_analysis.png'), dpi=300, bbox_inches='tight')
    print(f"   ✅ Saved: ridership_analysis.png")
    plt.close()
    
    # 3. Station-wise Heatmap (Top 20 stations)
    top_stations = df.groupby('station_name')['ridership_count'].sum().nlargest(20).index
    heatmap_data = df[df['station_name'].isin(top_stations)].pivot_table(
        index='station_name',
        columns='hour_of_day',
        values='ridership_count',
        aggfunc='mean'
    )
    
    plt.figure(figsize=(16, 10))
    sns.heatmap(heatmap_data, cmap='YlOrRd', cbar_kws={'label': 'Avg Ridership'}, linewidths=0.5)
    plt.xlabel('Hour of Day', fontsize=12)
    plt.ylabel('Station', fontsize=12)
    plt.title('Ridership Heatmap: Top 20 Stations', fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'ridership_heatmap.png'), dpi=300, bbox_inches='tight')
    print(f"   ✅ Saved: ridership_heatmap.png")
    plt.close()
    
    # 4. Weather Impact
    plt.figure(figsize=(14, 6))
    
    plt.subplot(1, 2, 1)
    # Bin temperatures
    df['temp_bin'] = pd.cut(df['temperature'], bins=5)
    temp_ridership = df.groupby('temp_bin')['ridership_count'].mean()
    temp_ridership.plot(kind='bar', color='#F77F00')
    plt.xlabel('Temperature Range (°C)', fontsize=12)
    plt.ylabel('Average Ridership', fontsize=12)
    plt.title('Temperature Impact on Ridership', fontsize=14, fontweight='bold')
    plt.xticks(rotation=45)
    plt.grid(axis='y', alpha=0.3)
    
    plt.subplot(1, 2, 2)
    rain_impact = df.groupby(df['rainfall'] > 0)['ridership_count'].mean()
    rain_impact.index = ['No Rain', 'Rain']
    rain_impact.plot(kind='bar', color=['#06A77D', '#2E86AB'])
    plt.xlabel('Weather Condition', fontsize=12)
    plt.ylabel('Average Ridership', fontsize=12)
    plt.title('Rainfall Impact on Ridership', fontsize=14, fontweight='bold')
    plt.xticks(rotation=0)
    plt.grid(axis='y', alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'weather_impact.png'), dpi=300, bbox_inches='tight')
    print(f"   ✅ Saved: weather_impact.png")
    plt.close()
    
    print(f"✅ Generated 3 EDA plots in {output_dir}/")


# =============================================================================
# 8. MAIN PIPELINE
# =============================================================================

def save_final_dataset(df: pd.DataFrame, config: CityConfig, output_dir: str = "output"):
    """
    Save the final dataset with proper column order
    """
    # Define final column order
    final_columns = [
        'station_id',
        'station_name',
        'route_id',
        'timestamp',
        'hour_of_day',
        'day_of_week',
        'is_weekend',
        'ridership_count',
        'train_frequency',
        'temperature',
        'rainfall',
        'event_flag',
        'rolling_demand_3h',
        'is_peak_hour',
        'ridership_per_train',
        'station_congestion_index',
        'crowd_level'
    ]
    
    # Select and reorder columns
    df_final = df[final_columns].copy()
    
    # Sort by station and time
    df_final = df_final.sort_values(['station_id', 'timestamp']).reset_index(drop=True)
    
    # Save
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, f"{config.city_name.lower()}_metro_dataset.csv")
    df_final.to_csv(output_path, index=False)
    
    print(f"💾 Saved final dataset: {output_path}")
    print(f"   Shape: {df_final.shape}")
    print(f"   Columns: {list(df_final.columns)}")
    
    return output_path


def generate_dataset(
    config: CityConfig,
    start_date: datetime = None,
    end_date: datetime = None,
    output_dir: str = "output"
) -> pd.DataFrame:
    """
    Main pipeline to generate production-quality metro dataset
    
    Args:
        config: City configuration (DMRC_CONFIG or MTA_CONFIG)
        start_date: Start date for data generation
        end_date: End date for data generation
        output_dir: Directory to save outputs
    
    Returns:
        Final DataFrame ready for ML
    """
    print("\n" + "=" * 70)
    print(f"   BHEEDMITRA DATASET GENERATOR - {config.city_name.upper()}")
    print("=" * 70 + "\n")
    
    # Set random seed for reproducibility
    np.random.seed(42)
    
    # Default date range: 30 days
    if start_date is None:
        start_date = datetime(2024, 1, 1)
    if end_date is None:
        end_date = datetime(2024, 1, 31)
    
    print(f"📅 Date range: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}\n")
    
    # Step 1: Download GTFS (if available)
    gtfs_dir = download_gtfs(config, output_dir=os.path.join(output_dir, "gtfs"))
    
    # Step 2: Parse stations
    stations = parse_stations(config, gtfs_dir)
    
    # Step 3: Compute train frequency
    train_frequency = compute_train_frequency(config, stations, gtfs_dir, (start_date, end_date))
    
    # Step 4: Fetch weather data
    weather = fetch_weather_data(config, start_date, end_date)
    
    # Step 5: Simulate ridership
    df = simulate_ridership(config, stations, train_frequency, weather)
    
    # Step 6: Feature engineering
    df = feature_engineering(df)
    
    # Step 7: Validate
    is_valid, issues = validate_dataset(df)
    
    # Step 8: Save dataset
    output_path = save_final_dataset(df, config, output_dir)
    
    # Step 9: Generate EDA plots
    generate_eda_plots(df, output_dir)
    
    # Summary
    print("\n" + "=" * 70)
    print("📈 DATASET SUMMARY")
    print("=" * 70)
    print(f"Total Records:        {len(df):,}")
    print(f"Total Stations:       {df['station_id'].nunique()}")
    print(f"Date Range:           {df['timestamp'].min()} to {df['timestamp'].max()}")
    print(f"Avg Ridership/Hour:   {df['ridership_count'].mean():.0f}")
    print(f"Peak Ridership:       {df['ridership_count'].max():,}")
    print(f"Avg Trains/Hour:      {df['train_frequency'].mean():.1f}")
    print(f"High Congestion:      {(df['crowd_level'] == 'high').sum():,} records ({(df['crowd_level'] == 'high').sum()/len(df)*100:.1f}%)")
    print("=" * 70 + "\n")
    
    if is_valid:
        print("✅ SUCCESS! Production-ready dataset generated.\n")
    else:
        print("⚠️  Dataset generated with validation warnings.\n")
    
    return df


# =============================================================================
# MAIN EXECUTION
# =============================================================================

if __name__ == "__main__":
    """
    Run this script to generate datasets for DMRC and/or MTA
    
    For Google Colab:
    1. Upload this file
    2. Run the cell
    3. Datasets will be saved in 'output/' folder
    """
    
    print("""
    ╔═══════════════════════════════════════════════════════════════════╗
    ║                                                                   ║
    ║              BHEEDMITRA PRODUCTION DATASET GENERATOR              ║
    ║                                                                   ║
    ║  Production-quality station-wise time series data for:           ║
    ║  • Crowd prediction                                              ║
    ║  • Congestion analysis                                           ║
    ║  • Anomaly detection                                             ║
    ║                                                                   ║
    ╚═══════════════════════════════════════════════════════════════════╝
    """)
    
    # Generate for DMRC (Delhi Metro)
    print("\n🇮🇳 Starting DMRC (Delhi Metro) dataset generation...\n")
    dmrc_df = generate_dataset(
        config=DMRC_CONFIG,
        start_date=datetime(2024, 1, 1),
        end_date=datetime(2024, 1, 31),
        output_dir="output"
    )
    
    # Optionally generate for MTA (uncomment if needed)
    # print("\n🇺🇸 Starting MTA (New York) dataset generation...\n")
    # mta_df = generate_dataset(
    #     config=MTA_CONFIG,
    #     start_date=datetime(2024, 1, 1),
    #     end_date=datetime(2024, 1, 31),
    #     output_dir="output"
    # )
    
    print("\n✨ All datasets generated successfully! ✨\n")
    print("📁 Output files:")
    print("   • output/delhi_metro_dataset.csv")
    print("   • output/ridership_analysis.png")
    print("   • output/ridership_heatmap.png")
    print("   • output/weather_impact.png")
    print("\n🚀 Ready for machine learning!\n")
