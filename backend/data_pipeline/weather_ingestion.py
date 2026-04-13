"""
BheedMitra - Weather Data Ingestion
Fetches weather data from Open-Meteo API for transit analysis
"""

import requests
import pandas as pd
from datetime import datetime, timedelta
from functools import lru_cache
import os

# =============================================================================
# CONFIGURATION
# =============================================================================

OPEN_METEO_API = "https://api.open-meteo.com/v1/forecast"

# City coordinates
CITY_COORDS = {
    "DMRC": {"lat": 28.6139, "lon": 77.2090, "name": "Delhi"},
    "MTA": {"lat": 40.7128, "lon": -74.0060, "name": "New York"},
    "MMRC": {"lat": 19.0760, "lon": 72.8777, "name": "Mumbai"},
    "BMRCL": {"lat": 12.9716, "lon": 77.5946, "name": "Bangalore"}
}

# Weather code mapping to conditions
WEATHER_CODE_MAP = {
    0: "Clear",
    1: "Clear",
    2: "Cloudy",
    3: "Cloudy",
    45: "Cloudy",
    48: "Cloudy",
    51: "Light Rain",
    53: "Light Rain",
    55: "Light Rain",
    61: "Light Rain",
    63: "Heavy Rain",
    65: "Heavy Rain",
    71: "Light Rain",  # Snow as rain for simplicity
    73: "Heavy Rain",
    75: "Heavy Rain",
    80: "Light Rain",
    81: "Heavy Rain",
    82: "Heavy Rain",
    95: "Heavy Rain",
    96: "Heavy Rain",
    99: "Heavy Rain"
}


# =============================================================================
# WEATHER FETCHING FUNCTIONS
# =============================================================================

@lru_cache(maxsize=128)
def fetch_current_weather(system: str = "DMRC") -> dict:
    """
    Fetch current weather for a transit system location
    
    Args:
        system: Transit system code (DMRC, MTA, etc.)
    
    Returns:
        Dictionary with weather data
    """
    coords = CITY_COORDS.get(system, CITY_COORDS["DMRC"])
    
    try:
        params = {
            "latitude": coords["lat"],
            "longitude": coords["lon"],
            "current_weather": True,
            "timezone": "auto"
        }
        
        response = requests.get(OPEN_METEO_API, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        current = data.get("current_weather", {})
        weather_code = current.get("weathercode", 0)
        
        return {
            "temperature": current.get("temperature", 25),
            "weather_code": weather_code,
            "weather_condition": WEATHER_CODE_MAP.get(weather_code, "Clear"),
            "wind_speed": current.get("windspeed", 10),
            "timestamp": current.get("time", datetime.now().isoformat()),
            "city": coords["name"],
            "success": True
        }
    
    except requests.RequestException as e:
        # Return default weather on API failure
        return {
            "temperature": 25,
            "weather_code": 0,
            "weather_condition": "Clear",
            "wind_speed": 10,
            "timestamp": datetime.now().isoformat(),
            "city": coords.get("name", "Unknown"),
            "success": False,
            "error": str(e)
        }


def fetch_hourly_forecast(system: str = "DMRC", days: int = 7) -> pd.DataFrame:
    """
    Fetch hourly weather forecast
    
    Args:
        system: Transit system code
        days: Number of forecast days (1-16)
    
    Returns:
        DataFrame with hourly forecast
    """
    coords = CITY_COORDS.get(system, CITY_COORDS["DMRC"])
    
    try:
        params = {
            "latitude": coords["lat"],
            "longitude": coords["lon"],
            "hourly": ["temperature_2m", "weathercode", "precipitation", "windspeed_10m"],
            "forecast_days": min(days, 16),
            "timezone": "auto"
        }
        
        response = requests.get(OPEN_METEO_API, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        hourly = data.get("hourly", {})
        
        df = pd.DataFrame({
            "timestamp": pd.to_datetime(hourly.get("time", [])),
            "temperature": hourly.get("temperature_2m", []),
            "weather_code": hourly.get("weathercode", []),
            "precipitation": hourly.get("precipitation", []),
            "wind_speed": hourly.get("windspeed_10m", [])
        })
        
        # Map weather codes to conditions
        df["weather_condition"] = df["weather_code"].map(
            lambda x: WEATHER_CODE_MAP.get(x, "Clear")
        )
        
        df["hour"] = df["timestamp"].dt.hour
        df["day_of_week"] = df["timestamp"].dt.day_name()
        
        return df
    
    except requests.RequestException as e:
        # Return empty DataFrame on failure
        return pd.DataFrame(columns=[
            "timestamp", "temperature", "weather_code", 
            "precipitation", "wind_speed", "weather_condition",
            "hour", "day_of_week"
        ])


def get_weather_impact_multiplier(weather_condition: str, temperature: float = None) -> float:
    """
    Calculate crowd impact multiplier based on weather
    
    Args:
        weather_condition: Weather condition string
        temperature: Temperature in Celsius
    
    Returns:
        Multiplier for crowd predictions
    """
    # Base weather impact
    weather_multipliers = {
        "Clear": 1.0,
        "Cloudy": 1.05,
        "Light Rain": 0.9,
        "Heavy Rain": 0.7
    }
    
    multiplier = weather_multipliers.get(weather_condition, 1.0)
    
    # Temperature adjustments (optional)
    if temperature is not None:
        if temperature > 40:  # Very hot
            multiplier *= 0.85
        elif temperature < 5:  # Very cold
            multiplier *= 0.9
    
    return multiplier


def enrich_dataset_with_weather(df: pd.DataFrame, system: str = "DMRC") -> pd.DataFrame:
    """
    Enrich a dataset with weather-based features
    
    Args:
        df: Input DataFrame with datetime information
        system: Transit system code
    
    Returns:
        DataFrame with added weather features
    """
    # Add weather impact multiplier based on existing weather column
    if "Weather Condition" in df.columns:
        df["weather_impact"] = df["Weather Condition"].apply(
            lambda x: get_weather_impact_multiplier(x)
        )
    else:
        df["weather_impact"] = 1.0
    
    # Add temperature-based adjustments (simulated if not available)
    if "temperature" not in df.columns:
        # Simulate temperature based on time category
        temp_by_time = {
            "Morning Peak": 22,
            "Mid Morning": 28,
            "Afternoon": 32,
            "Evening Peak": 28,
            "Night": 20
        }
        
        if "Boarding Time Category" in df.columns:
            df["temperature"] = df["Boarding Time Category"].map(temp_by_time).fillna(25)
        else:
            df["temperature"] = 25
    
    return df


def save_weather_data(system: str = "DMRC", output_dir: str = "output"):
    """
    Fetch and save weather data to CSV
    
    Args:
        system: Transit system code
        output_dir: Output directory for CSV
    """
    os.makedirs(output_dir, exist_ok=True)
    
    # Fetch forecast
    forecast_df = fetch_hourly_forecast(system, days=7)
    
    if not forecast_df.empty:
        output_path = os.path.join(output_dir, f"{system.lower()}_weather_forecast.csv")
        forecast_df.to_csv(output_path, index=False)
        print(f"✅ Saved weather forecast to {output_path}")
        return forecast_df
    else:
        print(f"❌ Failed to fetch weather data for {system}")
        return None


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("BheedMitra Weather Data Ingestion")
    print("=" * 60)
    
    for system in ["DMRC", "MTA"]:
        print(f"\nFetching weather for {system}...")
        
        # Current weather
        current = fetch_current_weather(system)
        print(f"  Current: {current['weather_condition']}, {current['temperature']}°C")
        
        # Save forecast
        save_weather_data(system)
    
    print("\n" + "=" * 60)
    print("Weather ingestion complete!")
    print("=" * 60)
