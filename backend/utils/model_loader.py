"""
BheedMitra - Model Loader Utility
Loads trained ML models for crowd prediction

This module supports legacy prediction helpers used by standalone dashboards.
"""

import pickle
import numpy as np
import pandas as pd
from functools import lru_cache
import os

# Model directory
MODEL_DIR = "saved_models"

# Numeric columns for preprocessing
NUM_COLS = [
    "Journey Time (mins)",
    "Wait Time (mins)",
    "Number of Line Changes",
    "official_ridership_scaled"
]


@lru_cache(maxsize=1)
def load_models():
    """
    Load ML models with caching
    
    Returns:
        Tuple of (xgb_model, encoder, scaler)
    """
    xgb_path = os.path.join(MODEL_DIR, "xgb_platform_crowd.pkl")
    encoder_path = os.path.join(MODEL_DIR, "platform_encoder.pkl")
    scaler_path = os.path.join(MODEL_DIR, "platform_scaler.pkl")
    
    if not os.path.exists(xgb_path):
        raise FileNotFoundError(f"Model not found: {xgb_path}")
    
    xgb = pickle.load(open(xgb_path, "rb"))
    enc = pickle.load(open(encoder_path, "rb"))
    scaler = pickle.load(open(scaler_path, "rb"))
    
    return xgb, enc, scaler


def preprocess_sample(sample, encoder, scaler):
    """
    Preprocess a single sample for prediction
    
    Args:
        sample: Dictionary with feature values
        encoder: Fitted OrdinalEncoder
        scaler: Fitted StandardScaler
    
    Returns:
        Preprocessed numpy array
    """
    df = pd.DataFrame([sample])
    
    # Identify numeric and categorical columns
    num_cols = [c for c in NUM_COLS if c in df.columns]
    cat_cols = [c for c in df.columns if c not in num_cols]
    
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


def predict_models(X, xgb):
    """
    Make prediction using XGBoost model
    
    Args:
        X: Preprocessed feature array
        xgb: Trained XGBoost model
    
    Returns:
        Dictionary with prediction results
    """
    pred_shifted = xgb.predict(X)[0]
    crowd_level = int(pred_shifted) + 1  # Shift back from 0-indexed
    
    return {"xgb": crowd_level}


def predict_with_confidence(X, xgb):
    """
    Make prediction with confidence score
    
    Args:
        X: Preprocessed feature array
        xgb: Trained XGBoost model
    
    Returns:
        Dictionary with prediction and confidence
    """
    pred_shifted = xgb.predict(X)[0]
    crowd_level = int(pred_shifted) + 1
    
    try:
        probas = xgb.predict_proba(X)[0]
        confidence = float(max(probas))
    except:
        confidence = 0.8
    
    return {
        "crowd_level": crowd_level,
        "confidence": confidence
    }


# Convenience function for full prediction
def predict_crowd_level(sample):
    """
    Full prediction pipeline for a sample
    
    Args:
        sample: Dictionary with journey features
    
    Returns:
        Predicted crowd level (1-5)
    """
    try:
        xgb, encoder, scaler = load_models()
        X = preprocess_sample(sample, encoder, scaler)
        result = predict_models(X, xgb)
        return result["xgb"]
    except Exception as e:
        print(f"Prediction error: {e}")
        # Fallback to heuristic
        return 3  # Default moderate level
