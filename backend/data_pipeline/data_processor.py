"""
BheedMitra - Data Processor
Feature engineering and data preprocessing for ML models
"""

import pandas as pd
import numpy as np
from datetime import datetime
import os

# =============================================================================
# FEATURE ENGINEERING FUNCTIONS
# =============================================================================

def add_temporal_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add temporal features to the dataset
    
    Args:
        df: Input DataFrame
    
    Returns:
        DataFrame with added temporal features
    """
    df = df.copy()
    
    # Hour of day (derived from time category if no timestamp)
    if "hour_of_day" not in df.columns:
        time_to_hour = {
            "Morning Peak": 8,
            "Mid Morning": 11,
            "Afternoon": 15,
            "Evening Peak": 19,
            "Night": 22
        }
        if "Boarding Time Category" in df.columns:
            df["hour_of_day"] = df["Boarding Time Category"].map(time_to_hour).fillna(12)
        else:
            df["hour_of_day"] = 12
    
    # Day of week (0=Monday, 6=Sunday)
    if "day_of_week" not in df.columns:
        if "Day-Type" in df.columns:
            df["day_of_week"] = df["Day-Type"].apply(
                lambda x: np.random.randint(0, 5) if x == "Weekday" else np.random.randint(5, 7)
            )
        else:
            df["day_of_week"] = np.random.randint(0, 7, len(df))
    
    # Is weekend flag
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
    
    # Peak hour flags
    df["is_morning_peak"] = (df["Boarding Time Category"] == "Morning Peak").astype(int) if "Boarding Time Category" in df.columns else 0
    df["is_evening_peak"] = (df["Boarding Time Category"] == "Evening Peak").astype(int) if "Boarding Time Category" in df.columns else 0
    df["is_peak_hour"] = (df["is_morning_peak"] | df["is_evening_peak"]).astype(int)
    
    return df


def add_rolling_features(df: pd.DataFrame, window: int = 7) -> pd.DataFrame:
    """
    Add rolling/lagged demand features
    
    Args:
        df: Input DataFrame (should be sorted by time)
        window: Rolling window size
    
    Returns:
        DataFrame with rolling features
    """
    df = df.copy()
    
    if "Platform Crowd Level at Boarding Station" in df.columns:
        target_col = "Platform Crowd Level at Boarding Station"
        
        # Rolling mean
        df["rolling_crowd_mean"] = df[target_col].rolling(window=window, min_periods=1).mean()
        
        # Rolling std
        df["rolling_crowd_std"] = df[target_col].rolling(window=window, min_periods=1).std().fillna(0)
        
        # Lag features
        df["crowd_lag_1"] = df[target_col].shift(1).fillna(df[target_col].mean())
        df["crowd_lag_7"] = df[target_col].shift(7).fillna(df[target_col].mean())
    
    return df


def add_weather_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add weather-derived features
    
    Args:
        df: Input DataFrame with Weather Condition column
    
    Returns:
        DataFrame with weather features
    """
    df = df.copy()
    
    if "Weather Condition" in df.columns:
        # Weather severity score
        weather_severity = {
            "Clear": 0,
            "Cloudy": 1,
            "Light Rain": 2,
            "Heavy Rain": 3
        }
        df["weather_severity"] = df["Weather Condition"].map(weather_severity).fillna(0)
        
        # Binary flags
        df["is_rainy"] = df["Weather Condition"].isin(["Light Rain", "Heavy Rain"]).astype(int)
        df["is_heavy_rain"] = (df["Weather Condition"] == "Heavy Rain").astype(int)
    
    return df


def add_station_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add station-level aggregate features
    
    Args:
        df: Input DataFrame with Source Station column
    
    Returns:
        DataFrame with station features
    """
    df = df.copy()
    
    if "Source Station" in df.columns and "Platform Crowd Level at Boarding Station" in df.columns:
        # Station average crowd
        station_avg = df.groupby("Source Station")["Platform Crowd Level at Boarding Station"].mean()
        df["station_avg_crowd"] = df["Source Station"].map(station_avg)
        
        # Station crowd volatility
        station_std = df.groupby("Source Station")["Platform Crowd Level at Boarding Station"].std()
        df["station_crowd_volatility"] = df["Source Station"].map(station_std).fillna(0)
    
    return df


def add_train_frequency(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add estimated train frequency based on time category
    
    Args:
        df: Input DataFrame
    
    Returns:
        DataFrame with train frequency feature
    """
    df = df.copy()
    
    # Trains per hour by time category
    frequency_map = {
        "Morning Peak": 24,    # Every 2.5 minutes
        "Mid Morning": 15,     # Every 4 minutes
        "Afternoon": 12,       # Every 5 minutes
        "Evening Peak": 24,    # Every 2.5 minutes
        "Night": 8             # Every 7.5 minutes
    }
    
    if "Boarding Time Category" in df.columns:
        df["train_frequency"] = df["Boarding Time Category"].map(frequency_map).fillna(12)
    else:
        df["train_frequency"] = 12
    
    return df


def encode_categorical_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Encode categorical features for ML
    
    Args:
        df: Input DataFrame
    
    Returns:
        DataFrame with encoded features
    """
    df = df.copy()
    
    # One-hot encode key categorical features
    categorical_cols = [
        "Boarding Time Category",
        "Day-Type",
        "Weather Condition"
    ]
    
    for col in categorical_cols:
        if col in df.columns:
            dummies = pd.get_dummies(df[col], prefix=col.replace(" ", "_").replace("-", "_"))
            df = pd.concat([df, dummies], axis=1)
    
    return df


def preprocess_for_ml(df: pd.DataFrame, include_target: bool = True) -> tuple:
    """
    Full preprocessing pipeline for ML
    
    Args:
        df: Input DataFrame
        include_target: Whether to include target column
    
    Returns:
        Tuple of (feature DataFrame, target Series or None)
    """
    # Add all features
    df = add_temporal_features(df)
    df = add_weather_features(df)
    df = add_train_frequency(df)
    df = add_station_features(df)
    df = add_rolling_features(df)
    
    # Define feature columns
    numeric_features = [
        "Journey Time (mins)",
        "Wait Time (mins)",
        "Number of Line Changes",
        "official_ridership_scaled",
        "hour_of_day",
        "day_of_week",
        "is_weekend",
        "is_peak_hour",
        "weather_severity",
        "train_frequency",
        "station_avg_crowd"
    ]
    
    # Filter to available columns
    available_features = [f for f in numeric_features if f in df.columns]
    
    X = df[available_features].fillna(0)
    
    if include_target and "Platform Crowd Level at Boarding Station" in df.columns:
        y = df["Platform Crowd Level at Boarding Station"]
        return X, y
    
    return X, None


def create_unified_dataset(dmrc_path: str = None, mta_path: str = None, 
                          output_path: str = "output/unified_dataset.csv") -> pd.DataFrame:
    """
    Create a unified dataset combining multiple transit systems
    
    Args:
        dmrc_path: Path to DMRC dataset
        mta_path: Path to MTA dataset
        output_path: Output path for unified dataset
    
    Returns:
        Unified DataFrame
    """
    dfs = []
    
    if dmrc_path and os.path.exists(dmrc_path):
        dmrc_df = pd.read_csv(dmrc_path)
        dmrc_df["system"] = "DMRC"
        dfs.append(dmrc_df)
        print(f"Loaded DMRC: {len(dmrc_df):,} records")
    
    if mta_path and os.path.exists(mta_path):
        mta_df = pd.read_csv(mta_path)
        mta_df["system"] = "MTA"
        dfs.append(mta_df)
        print(f"Loaded MTA: {len(mta_df):,} records")
    
    if not dfs:
        print("No datasets found!")
        return pd.DataFrame()
    
    # Combine datasets
    unified_df = pd.concat(dfs, ignore_index=True)
    
    # Apply feature engineering
    unified_df = add_temporal_features(unified_df)
    unified_df = add_weather_features(unified_df)
    unified_df = add_train_frequency(unified_df)
    
    # Save
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    unified_df.to_csv(output_path, index=False)
    print(f"✅ Saved unified dataset: {len(unified_df):,} records to {output_path}")
    
    return unified_df


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("BheedMitra Data Processor")
    print("=" * 60)
    
    # Create unified dataset
    unified_df = create_unified_dataset(
        dmrc_path="output/dmrc_dataset.csv",
        mta_path="output/mta_dataset.csv",
        output_path="output/unified_dataset.csv"
    )
    
    if not unified_df.empty:
        print("\nDataset Statistics:")
        print(f"  Total records: {len(unified_df):,}")
        print(f"  Features: {len(unified_df.columns)}")
        print(f"  Systems: {unified_df['system'].unique().tolist()}")
        
        # Preprocess for ML
        X, y = preprocess_for_ml(unified_df)
        print(f"\nML-ready features: {X.shape[1]}")
        print(f"Target distribution: {y.value_counts().to_dict()}")
    
    print("\n" + "=" * 60)
    print("Data processing complete!")
    print("=" * 60)
