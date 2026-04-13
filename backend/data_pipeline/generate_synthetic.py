"""
BheedMitra - Synthetic Data Generator
Generates synthetic ridership data for DMRC and MTA transit systems
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import os

# =============================================================================
# DMRC STATIONS (Delhi Metro)
# =============================================================================
DMRC_STATIONS = [
    "Rajiv Chowk", "Kashmere Gate", "Central Secretariat", "New Delhi",
    "Chandni Chowk", "Karol Bagh", "Dwarka Sector 21", "Noida City Centre",
    "HUDA City Centre", "Vaishali", "Botanical Garden", "Nehru Place",
    "South Extension", "Janakpuri West", "Rohini West", "Lajpat Nagar",
    "Hauz Khas", "Saket", "Malviya Nagar", "Greater Kailash",
    "Kalkaji Mandir", "Govindpuri", "Okhla", "Jasola Apollo",
    "Sarita Vihar", "Mohan Estate", "Tughlakabad", "Badarpur Border",
    "Escorts Mujesar", "Ballabhgarh", "Faridabad", "Old Faridabad",
    "Neelam Chowk Ajronda", "Bata Chowk", "NHPC Chowk", "Mewala Maharajpur",
    "Sector 28", "Badkhal Mor", "Sector 21", "Sector 42-43",
    "IFFCO Chowk", "MG Road", "Sikanderpur", "Guru Dronacharya",
    "Sultanpur", "Chattarpur", "Qutub Minar", "Saket",
    "INA", "AIIMS", "Green Park", "Moti Bagh"
]

DMRC_LINES = [
    "Red Line", "Yellow Line", "Blue Line", "Green Line",
    "Violet Line", "Orange Line (Airport Express)", "Pink Line",
    "Magenta Line", "Grey Line", "Rapid Metro"
]

# =============================================================================
# MTA STATIONS (New York)
# =============================================================================
MTA_STATIONS = [
    "Times Square-42 St", "Grand Central-42 St", "34 St-Penn Station",
    "14 St-Union Sq", "Fulton St", "Chambers St", "Canal St",
    "Brooklyn Bridge-City Hall", "Wall St", "Bowling Green",
    "59 St-Columbus Circle", "125 St", "86 St", "72 St",
    "50 St", "42 St-Port Authority", "28 St", "23 St",
    "Christopher St-Sheridan Sq", "West 4 St-Washington Sq",
    "Bleecker St", "Astor Pl", "8 St-NYU", "Houston St",
    "Spring St", "Prince St", "Broadway-Lafayette St",
    "Delancey St-Essex St", "East Broadway", "York St",
    "High St-Brooklyn Bridge", "Jay St-MetroTech", "DeKalb Av",
    "Atlantic Av-Barclays Ctr", "Nevins St", "Bergen St"
]

MTA_LINES = [
    "1 Line", "2 Line", "3 Line", "4 Line", "5 Line",
    "6 Line", "7 Line", "A Line", "B Line", "C Line",
    "D Line", "E Line", "F Line", "G Line", "J Line",
    "L Line", "M Line", "N Line", "Q Line", "R Line"
]

# =============================================================================
# TIME CATEGORIES
# =============================================================================
TIME_CATEGORIES = {
    "Morning Peak": (6, 10),
    "Mid Morning": (10, 14),
    "Afternoon": (14, 17),
    "Evening Peak": (17, 21),
    "Night": (21, 24)
}

# =============================================================================
# WEATHER CONDITIONS
# =============================================================================
WEATHER_CONDITIONS = ["Clear", "Cloudy", "Light Rain", "Heavy Rain"]
WEATHER_WEIGHTS = [0.5, 0.3, 0.15, 0.05]  # Probability weights

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_time_category(hour: int) -> str:
    """Get time category from hour"""
    for category, (start, end) in TIME_CATEGORIES.items():
        if start <= hour < end:
            return category
    return "Night"


def get_crowd_multiplier(time_category: str, weather: str, is_event: bool = False) -> float:
    """Get crowd level multiplier based on conditions"""
    # Base multipliers by time
    time_multipliers = {
        "Morning Peak": 1.4,
        "Mid Morning": 1.0,
        "Afternoon": 0.9,
        "Evening Peak": 1.5,
        "Night": 0.6
    }
    
    # Weather adjustments
    weather_adjustments = {
        "Clear": 0,
        "Cloudy": 0.1,
        "Light Rain": 0.2,
        "Heavy Rain": -0.3  # Fewer people travel in heavy rain
    }
    
    multiplier = time_multipliers.get(time_category, 1.0)
    multiplier += weather_adjustments.get(weather, 0)
    
    # Event boost
    if is_event:
        multiplier += 0.5
    
    return max(0.5, min(2.0, multiplier))


def generate_ridership_value(base: float, multiplier: float, noise: float = 0.2) -> float:
    """Generate ridership value with noise"""
    value = base * multiplier
    value *= (1 + np.random.normal(0, noise))
    return max(0.1, min(1.0, value))


def generate_crowd_level(ridership: float, multiplier: float) -> int:
    """Generate crowd level (1-5) based on ridership and conditions"""
    base_level = ridership * 5 * multiplier
    # Add some randomness
    level = base_level + np.random.normal(0, 0.5)
    return max(1, min(5, int(round(level))))


def generate_wait_time(crowd_level: int) -> float:
    """Generate wait time based on crowd level"""
    base_wait = {1: 2, 2: 3, 3: 5, 4: 7, 5: 10}
    wait = base_wait.get(crowd_level, 5)
    wait += np.random.normal(0, 1)
    return max(1, round(wait, 1))


def generate_journey_time(num_stations: int = None) -> int:
    """Generate journey time"""
    if num_stations is None:
        num_stations = random.randint(3, 15)
    # Approximate 3 minutes per station
    base_time = num_stations * 3
    return max(5, int(base_time + np.random.normal(0, 5)))


# =============================================================================
# MAIN GENERATOR FUNCTIONS
# =============================================================================

def generate_dmrc_dataset(n_records: int = 100000, output_path: str = None) -> pd.DataFrame:
    """
    Generate synthetic DMRC dataset
    
    Args:
        n_records: Number of records to generate
        output_path: Optional path to save CSV
    
    Returns:
        DataFrame with synthetic data
    """
    print(f"Generating {n_records:,} DMRC records...")
    
    data = []
    
    # Generate station ridership base values
    station_ridership = {
        station: random.uniform(0.3, 0.9) for station in DMRC_STATIONS
    }
    
    # Higher ridership for major stations
    major_stations = ["Rajiv Chowk", "Kashmere Gate", "Central Secretariat", "New Delhi", 
                      "Chandni Chowk", "HUDA City Centre", "Noida City Centre"]
    for station in major_stations:
        if station in station_ridership:
            station_ridership[station] = random.uniform(0.7, 1.0)
    
    for i in range(n_records):
        # Random source and destination
        source = random.choice(DMRC_STATIONS)
        dest_options = [s for s in DMRC_STATIONS if s != source]
        destination = random.choice(dest_options)
        
        # Random datetime within last year
        days_ago = random.randint(0, 365)
        hour = random.randint(5, 23)
        minute = random.randint(0, 59)
        
        base_date = datetime.now() - timedelta(days=days_ago)
        travel_time = base_date.replace(hour=hour, minute=minute)
        
        # Time category
        time_category = get_time_category(hour)
        
        # Day type
        day_type = "Weekday" if travel_time.weekday() < 5 else "Weekend"
        
        # Weather
        weather = random.choices(WEATHER_CONDITIONS, WEATHER_WEIGHTS)[0]
        
        # Special event (10% chance on weekends, 5% on weekdays)
        event_prob = 0.10 if day_type == "Weekend" else 0.05
        special_event = "Yes" if random.random() < event_prob else "No"
        
        # Calculate multiplier
        multiplier = get_crowd_multiplier(time_category, weather, special_event == "Yes")
        
        # Weekend adjustment
        if day_type == "Weekend":
            multiplier *= 0.8
        
        # Ridership
        base_ridership = station_ridership[source]
        ridership = generate_ridership_value(base_ridership, multiplier)
        
        # Crowd level
        crowd_level = generate_crowd_level(ridership, multiplier)
        
        # Wait time
        wait_time = generate_wait_time(crowd_level)
        
        # Journey time
        journey_time = generate_journey_time()
        
        # Line changes
        line_changes = random.choices([0, 1, 2], weights=[0.6, 0.3, 0.1])[0]
        
        # Metro line
        metro_line = random.choice(DMRC_LINES)
        
        # Other attributes
        purpose = random.choice(["Work/Office", "Education", "Shopping", "Leisure", "General"])
        age_group = random.choice(["18-24", "25-34", "35-44", "45-54", "55+"])
        frequency = random.choice(["Daily", "Weekly", "Occasionally", "First Time"])
        got_seat = "Yes" if crowd_level <= 2 and random.random() > 0.3 else "No"
        peak_point = random.choice(["Boarding Station", "Mid Journey", "Destination"])
        
        # Train crowd levels
        train_crowd = min(5, max(1, crowd_level + random.randint(-1, 1)))
        dest_crowd = min(5, max(1, crowd_level + random.randint(-1, 1)))
        
        # Overall satisfaction (inversely related to crowd)
        satisfaction = max(1, min(5, 6 - crowd_level + random.randint(-1, 1)))
        
        record = {
            "Source Station": source,
            "Destination Station": destination,
            "Metro Line Used (Primary)": metro_line,
            "Boarding Time Category": time_category,
            "Day-Type": day_type,
            "Weather Condition": weather,
            "Purpose of Travel": purpose,
            "Age Group": age_group,
            "Frequency of Metro Usage": frequency,
            "Journey Time (mins)": journey_time,
            "Wait Time (mins)": wait_time,
            "Number of Line Changes": line_changes,
            "official_ridership_scaled": round(ridership, 4),
            "Could You Get a Seat Immediately?": got_seat,
            "Peak Crowd Point During Journey": peak_point,
            "Special Event Nearby": special_event,
            "Platform Crowd Level at Boarding Station": crowd_level,
            "Train Crowd Level When You Boarded": train_crowd,
            "Crowd Level at Destination Station": dest_crowd,
            "Overall Journey Satisfaction": satisfaction
        }
        
        data.append(record)
        
        if (i + 1) % 10000 == 0:
            print(f"  Generated {i + 1:,} records...")
    
    df = pd.DataFrame(data)
    
    if output_path:
        df.to_csv(output_path, index=False)
        print(f"Saved to {output_path}")
    
    print(f"✅ Generated {len(df):,} DMRC records")
    return df


def generate_mta_dataset(n_records: int = 100000, output_path: str = None) -> pd.DataFrame:
    """
    Generate synthetic MTA dataset
    
    Args:
        n_records: Number of records to generate
        output_path: Optional path to save CSV
    
    Returns:
        DataFrame with synthetic data
    """
    print(f"Generating {n_records:,} MTA records...")
    
    data = []
    
    # Station ridership base values
    station_ridership = {
        station: random.uniform(0.3, 0.9) for station in MTA_STATIONS
    }
    
    # Higher ridership for major stations
    major_stations = ["Times Square-42 St", "Grand Central-42 St", "34 St-Penn Station",
                      "14 St-Union Sq", "Fulton St", "59 St-Columbus Circle"]
    for station in major_stations:
        if station in station_ridership:
            station_ridership[station] = random.uniform(0.75, 1.0)
    
    for i in range(n_records):
        source = random.choice(MTA_STATIONS)
        dest_options = [s for s in MTA_STATIONS if s != source]
        destination = random.choice(dest_options)
        
        days_ago = random.randint(0, 365)
        hour = random.randint(5, 23)
        minute = random.randint(0, 59)
        
        base_date = datetime.now() - timedelta(days=days_ago)
        travel_time = base_date.replace(hour=hour, minute=minute)
        
        time_category = get_time_category(hour)
        day_type = "Weekday" if travel_time.weekday() < 5 else "Weekend"
        weather = random.choices(WEATHER_CONDITIONS, WEATHER_WEIGHTS)[0]
        
        event_prob = 0.15 if day_type == "Weekend" else 0.08  # NYC has more events
        special_event = "Yes" if random.random() < event_prob else "No"
        
        multiplier = get_crowd_multiplier(time_category, weather, special_event == "Yes")
        if day_type == "Weekend":
            multiplier *= 0.75
        
        base_ridership = station_ridership[source]
        ridership = generate_ridership_value(base_ridership, multiplier)
        crowd_level = generate_crowd_level(ridership, multiplier)
        wait_time = generate_wait_time(crowd_level)
        journey_time = generate_journey_time()
        line_changes = random.choices([0, 1, 2, 3], weights=[0.4, 0.35, 0.2, 0.05])[0]
        metro_line = random.choice(MTA_LINES)
        
        purpose = random.choice(["Work/Office", "Education", "Shopping", "Leisure", "General"])
        age_group = random.choice(["18-24", "25-34", "35-44", "45-54", "55+"])
        frequency = random.choice(["Daily", "Weekly", "Occasionally", "First Time"])
        got_seat = "Yes" if crowd_level <= 2 and random.random() > 0.4 else "No"
        peak_point = random.choice(["Boarding Station", "Mid Journey", "Destination"])
        
        train_crowd = min(5, max(1, crowd_level + random.randint(-1, 1)))
        dest_crowd = min(5, max(1, crowd_level + random.randint(-1, 1)))
        satisfaction = max(1, min(5, 6 - crowd_level + random.randint(-1, 1)))
        
        record = {
            "Source Station": source,
            "Destination Station": destination,
            "Metro Line Used (Primary)": metro_line,
            "Boarding Time Category": time_category,
            "Day-Type": day_type,
            "Weather Condition": weather,
            "Purpose of Travel": purpose,
            "Age Group": age_group,
            "Frequency of Metro Usage": frequency,
            "Journey Time (mins)": journey_time,
            "Wait Time (mins)": wait_time,
            "Number of Line Changes": line_changes,
            "official_ridership_scaled": round(ridership, 4),
            "Could You Get a Seat Immediately?": got_seat,
            "Peak Crowd Point During Journey": peak_point,
            "Special Event Nearby": special_event,
            "Platform Crowd Level at Boarding Station": crowd_level,
            "Train Crowd Level When You Boarded": train_crowd,
            "Crowd Level at Destination Station": dest_crowd,
            "Overall Journey Satisfaction": satisfaction
        }
        
        data.append(record)
        
        if (i + 1) % 10000 == 0:
            print(f"  Generated {i + 1:,} records...")
    
    df = pd.DataFrame(data)
    
    if output_path:
        df.to_csv(output_path, index=False)
        print(f"Saved to {output_path}")
    
    print(f"✅ Generated {len(df):,} MTA records")
    return df


def generate_all_datasets(output_dir: str = "output"):
    """Generate all synthetic datasets"""
    os.makedirs(output_dir, exist_ok=True)
    
    print("=" * 60)
    print("BheedMitra Synthetic Data Generator")
    print("=" * 60)
    
    # Generate DMRC dataset
    dmrc_df = generate_dmrc_dataset(
        n_records=100000,
        output_path=os.path.join(output_dir, "dmrc_dataset.csv")
    )
    
    print()
    
    # Generate MTA dataset
    mta_df = generate_mta_dataset(
        n_records=100000,
        output_path=os.path.join(output_dir, "mta_dataset.csv")
    )
    
    print()
    print("=" * 60)
    print("Dataset Generation Complete!")
    print(f"DMRC: {len(dmrc_df):,} records")
    print(f"MTA:  {len(mta_df):,} records")
    print("=" * 60)
    
    return dmrc_df, mta_df


if __name__ == "__main__":
    generate_all_datasets()
