"""
BheedMitra - Real-Time Prediction Module
Functions for predicting crowd levels, ridership, and congestion index
Updated for Time-Series Dataset
"""

import numpy as np
import pandas as pd
import pickle
import os
from functools import lru_cache
from typing import Dict, Any, Optional, List
from datetime import datetime

# =============================================================================
# CONFIGURATION
# =============================================================================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "..", "data", "saved_models")

# Feature configuration (will be loaded from pickle if available)
NUM_COLS = [
    "hour_of_day",
    "day_of_week",
    "ridership_count",
    "train_frequency",
    "temperature",
    "rainfall",
    "rolling_demand_3h",
    "ridership_per_train",
    "station_congestion_index",
    "is_weekend",
    "event_flag",
    "is_peak_hour"
]

CAT_COLS = [
    "station_id",
    "route_id",
    "weather_condition",
    "boarding_time_category",
    "crowd_level"
]

# Crowd level descriptions
CROWD_LEVELS = {
    1: {"label": "Very Low", "color": "green", "description": "Easy boarding, seats available"},
    2: {"label": "Low", "color": "lightgreen", "description": "Comfortable travel, some seats"},
    3: {"label": "Moderate", "color": "orange", "description": "Standing room, slight wait"},
    4: {"label": "High", "color": "red", "description": "Crowded, longer wait times"},
    5: {"label": "Very High", "color": "darkred", "description": "Very crowded, delays likely"}
}

# Time category mapping
TIME_CATEGORIES = {
    "Night": (0, 6),
    "Morning Peak": (8, 10),
    "Mid Morning": (10, 12),
    "Afternoon": (12, 17),
    "Evening Peak": (17, 20)
}

def get_time_category(hour: int) -> str:
    """Get time category from hour"""
    if hour < 6:
        return "Night"
    elif hour < 8:
        return "Morning Peak"
    elif hour < 10:
        return "Morning Peak"
    elif hour < 12:
        return "Mid Morning"
    elif hour < 17:
        return "Afternoon"
    elif hour < 20:
        return "Evening Peak"
    else:
        return "Night"


# =============================================================================
# MODEL LOADING
# =============================================================================

def _candidate_paths(filenames: List[str]) -> Optional[str]:
    for name in filenames:
        path = os.path.join(MODEL_DIR, name)
        if os.path.exists(path):
            return path
    return None


def _system_artifact_names(system: str) -> Dict[str, List[str]]:
    if system == "MTA":
        return {
            "xgb": ["mta_xgb_platform_crowd.pkl", "mta_crowd_classifier.pkl"],
            "encoder": ["mta_platform_encoder.pkl", "mta_encoder.pkl"],
            "scaler": ["mta_platform_scaler.pkl", "mta_scaler.pkl"],
            "config": ["mta_feature_config.pkl"],
            "ridership": ["mta_ridership_model.pkl"],
            "ridership_encoder": ["mta_ridership_encoder.pkl", "mta_encoder.pkl"],
            "ridership_scaler": ["mta_ridership_scaler.pkl", "mta_scaler.pkl"],
        }
    return {
        "xgb": ["xgb_platform_crowd.pkl", "crowd_classifier.pkl"],
        "encoder": ["platform_encoder.pkl"],
        "scaler": ["platform_scaler.pkl"],
        "config": ["feature_config.pkl"],
        "ridership": ["ridership_model.pkl"],
        "ridership_encoder": ["ridership_encoder.pkl", "platform_encoder.pkl"],
        "ridership_scaler": ["ridership_scaler.pkl", "platform_scaler.pkl"],
    }


@lru_cache(maxsize=4)
def load_models(system: str = "DMRC") -> Dict[str, Any]:
    """
    Load ML models with caching
    
    Returns:
        Dictionary with loaded models and preprocessors
    """
    models = {
        "xgb": None,
        "encoder": None,
        "scaler": None,
        "feature_config": None,
        "ridership_model": None,
        "ridership_encoder": None,
        "ridership_scaler": None,
        "loaded": False
    }
    
    system = (system or "DMRC").upper()
    artifacts = _system_artifact_names(system)

    try:
        # Load crowd classifier
        xgb_path = _candidate_paths(artifacts["xgb"])
        encoder_path = _candidate_paths(artifacts["encoder"])
        scaler_path = _candidate_paths(artifacts["scaler"])
        config_path = _candidate_paths(artifacts["config"])
        
        if xgb_path and encoder_path and scaler_path:
            models["xgb"] = pickle.load(open(xgb_path, "rb"))
            models["encoder"] = pickle.load(open(encoder_path, "rb"))
            models["scaler"] = pickle.load(open(scaler_path, "rb"))
            models["loaded"] = True
            print(f"{system} crowd classifier loaded")
             
            # Load feature configuration if available
            if config_path:
                models["feature_config"] = pickle.load(open(config_path, "rb"))
                print(f"{system} feature configuration loaded")
        
        # Load ridership model (optional)
        ridership_path = _candidate_paths(artifacts["ridership"])
        if ridership_path:
            models["ridership_model"] = pickle.load(open(ridership_path, "rb"))
             
            ridership_encoder_path = _candidate_paths(artifacts["ridership_encoder"])
            ridership_scaler_path = _candidate_paths(artifacts["ridership_scaler"])
             
            if ridership_encoder_path:
                models["ridership_encoder"] = pickle.load(open(ridership_encoder_path, "rb"))
            if ridership_scaler_path:
                models["ridership_scaler"] = pickle.load(open(ridership_scaler_path, "rb"))
             
            print(f"{system} ridership model loaded")
        
    except Exception as e:
        print(f"Error loading models: {e}")
    
    return models


def get_models(system: str = "DMRC") -> Dict[str, Any]:
    """Get cached models, loading if necessary"""
    return load_models(system.upper())


# =============================================================================
# PREPROCESSING
# =============================================================================

def preprocess_sample(sample: Dict[str, Any], encoder, scaler, feature_config=None) -> np.ndarray:
    """
    Preprocess a single sample for prediction
    
    Args:
        sample: Dictionary with feature values
        encoder: Fitted OrdinalEncoder
        scaler: Fitted StandardScaler
        feature_config: Optional feature configuration dict
    
    Returns:
        Preprocessed feature array
    """
    df = pd.DataFrame([sample])
    
    # Get column lists from config or defaults
    if feature_config:
        num_cols = feature_config.get("num_cols", NUM_COLS)
        cat_cols = feature_config.get("cat_cols", CAT_COLS)
    else:
        num_cols = [c for c in NUM_COLS if c in df.columns]
        cat_cols = [c for c in CAT_COLS if c in df.columns]
    
    # Ensure all required columns exist
    for col in num_cols:
        if col not in df.columns:
            df[col] = 0
    
    for col in cat_cols:
        if col not in df.columns:
            df[col] = "MISSING"
    
    # Clean numeric columns
    df[num_cols] = df[num_cols].apply(pd.to_numeric, errors='coerce').fillna(0)
    
    # Clean categorical columns
    df[cat_cols] = df[cat_cols].fillna("MISSING").astype(str)
    
    # Transform
    X = np.hstack([
        scaler.transform(df[num_cols]),
        encoder.transform(df[cat_cols])
    ])
    
    return X


# =============================================================================
# PREDICTION FUNCTIONS
# =============================================================================

def predict_crowd(sample: Dict[str, Any], models: Dict[str, Any] = None, system: str = "DMRC") -> Dict[str, Any]:
    """
    Predict crowd level for a given sample
    
    Args:
        sample: Dictionary with journey/station features
        models: Pre-loaded models dict (optional)
    
    Returns:
        Dictionary with prediction results
    """
    if models is None:
        models = get_models(system=system)
    
    if not models.get("loaded") or models.get("xgb") is None:
        # Fallback to heuristic prediction
        return predict_crowd_heuristic(sample)
    
    try:
        # Preprocess
        feature_config = models.get("feature_config")
        X = preprocess_sample(sample, models["encoder"], models["scaler"], feature_config)
        
        # Predict
        pred_shifted = models["xgb"].predict(X)[0]
        crowd_level = int(pred_shifted) + 1
        
        # Get probabilities if available
        try:
            probas = models["xgb"].predict_proba(X)[0]
            confidence = float(max(probas))
        except:
            confidence = 0.8  # Default confidence
        
        # Calculate congestion index (0-100)
        congestion_index = (crowd_level - 1) / 4 * 100
        
        # Get level info
        level_info = CROWD_LEVELS.get(crowd_level, CROWD_LEVELS[3])
        
        return {
            "crowd_level": crowd_level,
            "crowd_label": level_info["label"],
            "crowd_description": level_info["description"],
            "congestion_index": round(congestion_index, 1),
            "confidence": round(confidence, 3),
            "color": level_info["color"],
            "success": True
        }
    
    except Exception as e:
        print(f"Prediction error: {e}")
        return predict_crowd_heuristic(sample)


def predict_crowd_heuristic(sample: Dict[str, Any]) -> Dict[str, Any]:
    """
    Heuristic crowd prediction (fallback when model unavailable)
    Updated for time-series features
    
    Args:
        sample: Dictionary with features
    
    Returns:
        Prediction results
    """
    # Base crowd level
    crowd_level = 3.0
    
    # Adjust based on time category
    time_adjustments = {
        "Morning Peak": 1.5,
        "Mid Morning": 0,
        "Afternoon": -0.5,
        "Evening Peak": 1.5,
        "Night": -1.5
    }
    time_cat = sample.get("boarding_time_category", sample.get("Boarding Time Category", "Afternoon"))
    crowd_level += time_adjustments.get(time_cat, 0)
    
    # Adjust based on hour
    hour = sample.get("hour_of_day", 12)
    if 8 <= hour <= 10 or 18 <= hour <= 20:
        crowd_level += 0.5
    elif hour < 6 or hour > 22:
        crowd_level -= 0.5
    
    # Adjust based on weather
    weather_adjustments = {
        "Clear": 0,
        "Cloudy": 0.1,
        "Rainy": -0.3,
        "Foggy": -0.2
    }
    weather = sample.get("weather_condition", sample.get("Weather Condition", "Clear"))
    crowd_level += weather_adjustments.get(weather, 0)
    
    # Adjust for special events
    event_flag = sample.get("event_flag", 0)
    if event_flag == 1 or sample.get("Special Event Nearby") == "Yes":
        crowd_level += 1
    
    # Adjust based on weekend
    is_weekend = sample.get("is_weekend", 0)
    if is_weekend:
        crowd_level -= 0.3
    
    # Adjust based on peak hour flag
    is_peak = sample.get("is_peak_hour", 0)
    if is_peak:
        crowd_level += 0.3
    
    # Adjust based on congestion index if available
    congestion_idx = sample.get("station_congestion_index", 0.5)
    crowd_level += (congestion_idx - 0.5) * 2
    
    # Clamp to valid range
    crowd_level = max(1, min(5, int(round(crowd_level))))
    
    level_info = CROWD_LEVELS.get(crowd_level, CROWD_LEVELS[3])
    congestion_index = (crowd_level - 1) / 4 * 100
    
    return {
        "crowd_level": crowd_level,
        "crowd_label": level_info["label"],
        "crowd_description": level_info["description"],
        "congestion_index": round(congestion_index, 1),
        "confidence": 0.6,  # Lower confidence for heuristic
        "color": level_info["color"],
        "success": True,
        "method": "heuristic"
    }


def predict_ridership(sample: Dict[str, Any], models: Dict[str, Any] = None, system: str = "DMRC") -> Dict[str, Any]:
    """
    Predict ridership value for a station/time combination
    
    Args:
        sample: Dictionary with features
        models: Pre-loaded models (optional)
    
    Returns:
        Dictionary with ridership prediction
    """
    if models is None:
        models = get_models(system=system)
    
    if models.get("ridership_model") is None:
        # Fallback
        return {
            "ridership": 0.5,
            "ridership_scaled": 0.5,
            "success": False,
            "method": "default"
        }
    
    try:
        encoder = models.get("ridership_encoder", models["encoder"])
        scaler = models.get("ridership_scaler", models["scaler"])
        
        # Remove target columns from sample
        sample_clean = {k: v for k, v in sample.items() 
                       if k not in ["official_ridership_scaled", "Platform Crowd Level at Boarding Station"]}
        
        X = preprocess_sample(sample_clean, encoder, scaler)
        pred = models["ridership_model"].predict(X)[0]
        
        return {
            "ridership": round(float(pred), 4),
            "ridership_scaled": round(float(pred), 4),
            "success": True
        }
    
    except Exception as e:
        return {
            "ridership": 0.5,
            "ridership_scaled": 0.5,
            "success": False,
            "error": str(e)
        }


def predict_full(station: str, time_category: str, weather: str = "Clear",
                 day_type: str = "Weekday", special_event: str = "No",
                 hour: Optional[int] = None, system: str = "DMRC") -> Dict[str, Any]:
    """
    Full prediction function with all outputs
    Updated for time-series features
    
    Args:
        station: Station name or ID
        time_category: Time category (Morning Peak, etc.)
        weather: Weather condition
        day_type: Weekday or Weekend
        special_event: Yes or No
        hour: Optional hour of day (0-23)
    
    Returns:
        Complete prediction result
    """
    # Determine hour and day of week
    now = datetime.now()
    if hour is None:
        hour = now.hour
    
    day_of_week = now.weekday()
    is_weekend = 1 if day_type == "Weekend" or day_of_week >= 5 else 0
    
    # Determine time category from hour if not specified
    if time_category == "Auto":
        time_category = get_time_category(hour)
    
    # Determine peak hour
    is_peak_hour = 1 if (8 <= hour <= 10 or 17 <= hour <= 20) else 0
    
    # Build sample with time-series features
    default_station_id = "MTA_001" if system == "MTA" else "YL20"
    default_route = "Subway" if system == "MTA" else "Yellow Line"
    station_id = station if len(str(station)) <= 12 else default_station_id

    sample = {
        # Categorical features
        "station_id": station_id,
        "route_id": default_route,
        "weather_condition": weather,
        "boarding_time_category": time_category,
        "crowd_level": "medium",  # Default, will be predicted
        
        # Numeric features
        "hour_of_day": hour,
        "day_of_week": day_of_week,
        "is_weekend": is_weekend,
        "ridership_count": 500,  # Default estimate
        "train_frequency": 15,   # Default trains per hour
        "temperature": 25.0,     # Default
        "rainfall": 0.0 if weather != "Rainy" else 5.0,
        "rolling_demand_3h": 1500,
        "is_peak_hour": is_peak_hour,
        "ridership_per_train": 33.3,
        "station_congestion_index": 0.5,
        "event_flag": 1 if special_event == "Yes" else 0
    }
    
    # Get predictions
    crowd_result = predict_crowd(sample, system=system)
    ridership_result = predict_ridership(sample, system=system)
    
    return {
        "station": station,
        "time_category": time_category,
        "weather": weather,
        "day_type": day_type,
        "special_event": special_event,
        "system": system,
        "hour": hour,
        "crowd_level": crowd_result["crowd_level"],
        "crowd_label": crowd_result["crowd_label"],
        "congestion_index": crowd_result["congestion_index"],
        "confidence": crowd_result["confidence"],
        "predicted_ridership": ridership_result.get("ridership", 500),
        "recommendation": get_recommendation(crowd_result["crowd_level"])
    }


def get_recommendation(crowd_level: int) -> str:
    """Get travel recommendation based on crowd level"""
    if crowd_level >= 4:
        return "Consider delaying travel or using alternate stations. High congestion expected."
    elif crowd_level == 3:
        return "Moderate crowd expected. Travel is acceptable but not optimal."
    else:
        return "Good time to travel! Low crowd expected with comfortable boarding."


# =============================================================================
# BATCH PREDICTION
# =============================================================================

def predict_batch(samples: list) -> pd.DataFrame:
    """
    Batch prediction for multiple samples
    
    Args:
        samples: List of sample dictionaries
    
    Returns:
        DataFrame with predictions
    """
    results = []
    models = get_models()
    
    for sample in samples:
        result = predict_crowd(sample, models)
        result.update(sample)
        results.append(result)
    
    return pd.DataFrame(results)


# =============================================================================
# MAIN / TESTING
# =============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("BheedMitra Prediction Module Test")
    print("=" * 60)
    
    # Test prediction
    test_sample = {
        "Source Station": "Rajiv Chowk",
        "Destination Station": "Kashmere Gate",
        "Metro Line Used (Primary)": "Yellow Line",
        "Boarding Time Category": "Morning Peak",
        "Day-Type": "Weekday",
        "Weather Condition": "Clear",
        "Purpose of Travel": "Work/Office",
        "Age Group": "25-34",
        "Frequency of Metro Usage": "Daily",
        "Journey Time (mins)": 12,
        "Wait Time (mins)": 3,
        "Number of Line Changes": 0,
        "official_ridership_scaled": 0.75,
        "Could You Get a Seat Immediately?": "No",
        "Peak Crowd Point During Journey": "Boarding Station",
        "Special Event Nearby": "No"
    }
    
    print("\nTest Sample:")
    print(f"  Station: {test_sample['Source Station']}")
    print(f"  Time: {test_sample['Boarding Time Category']}")
    print(f"  Weather: {test_sample['Weather Condition']}")
    
    result = predict_crowd(test_sample)
    
    print("\nPrediction Result:")
    print(f"  Crowd Level: {result['crowd_level']}/5 ({result['crowd_label']})")
    print(f"  Congestion Index: {result['congestion_index']}%")
    print(f"  Confidence: {result['confidence']:.1%}")
    print(f"  Recommendation: {get_recommendation(result['crowd_level'])}")
    
    # Test full prediction
    print("\n" + "-" * 40)
    print("Full Prediction Test:")
    full_result = predict_full(
        station="Central Secretariat",
        time_category="Evening Peak",
        weather="Light Rain"
    )
    print(f"  Station: {full_result['station']}")
    print(f"  Crowd Level: {full_result['crowd_level']}")
    print(f"  Congestion: {full_result['congestion_index']}%")
    
    print("\n" + "=" * 60)
    print("Test Complete!")
    print("=" * 60)
    system = (system or "DMRC").upper()
