"""
BheedMitra - ML Model Training
Training scripts for ridership prediction and crowd classification models
"""

import warnings
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
import pickle
import os
import sys

from sklearn.model_selection import train_test_split, RandomizedSearchCV, cross_val_score
from sklearn.preprocessing import OrdinalEncoder, StandardScaler
from sklearn.utils.class_weight import compute_sample_weight
from sklearn.metrics import (
    accuracy_score, balanced_accuracy_score, classification_report,
    mean_squared_error, mean_absolute_error, r2_score
)
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor

try:
    from xgboost import XGBClassifier, XGBRegressor
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False
    print("Warning: XGBoost not available. Using RandomForest only.")

# =============================================================================
# CONFIGURATION
# =============================================================================
DATA_PATH = "delhi_metro_cleaned_final.csv"
ALT_DATA_PATH = "output/dmrc_dataset.csv"
SAVE_DIR = "saved_models"
TARGET_CLASSIFICATION = "Platform Crowd Level at Boarding Station"
TARGET_REGRESSION = "official_ridership_scaled"

NUM_COLS = [
    "Journey Time (mins)",
    "Wait Time (mins)",
    "Number of Line Changes",
    "official_ridership_scaled"
]

DROP_COLS = [
    "Train Crowd Level When You Boarded",
    "Crowd Level at Destination Station",
    "Overall Journey Satisfaction"
]


# =============================================================================
# DATA LOADING
# =============================================================================

def load_dataset(path: str = None) -> pd.DataFrame:
    """Load dataset from file"""
    paths_to_try = [path, DATA_PATH, ALT_DATA_PATH] if path else [DATA_PATH, ALT_DATA_PATH]
    
    for p in paths_to_try:
        if p and os.path.exists(p):
            print(f"Loading dataset from: {p}")
            return pd.read_csv(p)
    
    # Generate synthetic data if nothing found
    print("No dataset found. Generating synthetic data...")
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from data_pipeline.generate_synthetic import generate_dmrc_dataset
    return generate_dmrc_dataset(n_records=50000)


def prepare_data(df: pd.DataFrame, target_col: str) -> tuple:
    """Prepare data for training"""
    # Remove rows with missing target
    df = df[df[target_col].notna()].reset_index(drop=True)
    
    # Identify feature columns
    features = [c for c in df.columns if c not in DROP_COLS + [target_col]]
    
    # Identify numeric and categorical columns
    num_cols = [c for c in NUM_COLS if c in features]
    cat_cols = [c for c in features if c not in num_cols]
    
    # Clean numeric columns
    df[num_cols] = df[num_cols].apply(pd.to_numeric, errors='coerce').fillna(0)
    df[cat_cols] = df[cat_cols].fillna("MISSING").astype(str)
    
    X = df[features]
    y = df[target_col]
    
    return X, y, num_cols, cat_cols


# =============================================================================
# CLASSIFICATION MODEL TRAINING
# =============================================================================

def train_crowd_classifier(df: pd.DataFrame = None, save_models: bool = True) -> dict:
    """
    Train crowd level classifier (predicts 1-5 crowd levels)
    
    Args:
        df: Input DataFrame (optional, will load if not provided)
        save_models: Whether to save trained models
    
    Returns:
        Dictionary with trained models and metrics
    """
    print("\n" + "=" * 60)
    print("Training Crowd Level Classifier")
    print("=" * 60)
    
    if df is None:
        df = load_dataset()
    
    # Prepare data
    X, y, num_cols, cat_cols = prepare_data(df, TARGET_CLASSIFICATION)
    
    # Shift labels to 0-indexed for XGBoost
    y_shifted = y.astype(int) - 1
    
    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_shifted, test_size=0.2, stratify=y_shifted, random_state=42
    )
    
    print(f"Training samples: {len(X_train):,}")
    print(f"Test samples: {len(X_test):,}")
    print(f"Features: {len(X.columns)}")
    
    # Fit encoders
    encoder = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
    encoder.fit(X_train[cat_cols])
    
    scaler = StandardScaler()
    scaler.fit(X_train[num_cols])
    
    # Transform features
    X_train_final = np.hstack([
        scaler.transform(X_train[num_cols]),
        encoder.transform(X_train[cat_cols])
    ])
    
    X_test_final = np.hstack([
        scaler.transform(X_test[num_cols]),
        encoder.transform(X_test[cat_cols])
    ])
    
    # Compute sample weights for class imbalance
    sample_weights = compute_sample_weight("balanced", y_train)
    
    # Train XGBoost if available, else RandomForest
    if HAS_XGBOOST:
        print("\nTraining XGBoost Classifier...")
        
        xgb = XGBClassifier(
            objective="multi:softprob",
            num_class=5,
            eval_metric="mlogloss",
            tree_method="hist",
            random_state=42
        )
        
        param_grid = {
            "n_estimators": [200, 400],
            "max_depth": [6, 10],
            "learning_rate": [0.05, 0.1],
            "subsample": [0.8, 1.0],
            "colsample_bytree": [0.8, 1.0]
        }
        
        search = RandomizedSearchCV(
            xgb, param_grid, n_iter=10, scoring="balanced_accuracy",
            cv=3, random_state=42, n_jobs=2
        )
        
        search.fit(X_train_final, y_train, sample_weight=sample_weights)
        model = search.best_estimator_
        model_type = "xgboost"
    else:
        print("\nTraining RandomForest Classifier...")
        
        model = RandomForestClassifier(
            n_estimators=200,
            max_depth=15,
            min_samples_split=5,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1
        )
        model.fit(X_train_final, y_train, sample_weight=sample_weights)
        model_type = "randomforest"
    
    # Evaluate
    pred_shifted = model.predict(X_test_final)
    pred = pred_shifted + 1
    y_true = y_test + 1
    
    accuracy = accuracy_score(y_true, pred)
    balanced_acc = balanced_accuracy_score(y_true, pred)
    
    print(f"\n{model_type.upper()} Results:")
    print(f"  Accuracy: {accuracy:.4f}")
    print(f"  Balanced Accuracy: {balanced_acc:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_true, pred))
    
    # Save models
    if save_models:
        os.makedirs(SAVE_DIR, exist_ok=True)
        
        pickle.dump(model, open(f"{SAVE_DIR}/xgb_platform_crowd.pkl", "wb"))
        pickle.dump(encoder, open(f"{SAVE_DIR}/platform_encoder.pkl", "wb"))
        pickle.dump(scaler, open(f"{SAVE_DIR}/platform_scaler.pkl", "wb"))
        
        # Also save as crowd_classifier.pkl for new naming convention
        pickle.dump(model, open(f"{SAVE_DIR}/crowd_classifier.pkl", "wb"))
        
        print(f"\n✅ Models saved to {SAVE_DIR}/")
    
    return {
        "model": model,
        "encoder": encoder,
        "scaler": scaler,
        "accuracy": accuracy,
        "balanced_accuracy": balanced_acc,
        "model_type": model_type,
        "feature_names": list(num_cols) + list(cat_cols)
    }


# =============================================================================
# REGRESSION MODEL TRAINING
# =============================================================================

def train_ridership_regressor(df: pd.DataFrame = None, save_models: bool = True) -> dict:
    """
    Train ridership regression model
    
    Args:
        df: Input DataFrame
        save_models: Whether to save trained models
    
    Returns:
        Dictionary with trained model and metrics
    """
    print("\n" + "=" * 60)
    print("Training Ridership Regression Model")
    print("=" * 60)
    
    if df is None:
        df = load_dataset()
    
    # For regression, we'll predict ridership from other features
    target_col = "official_ridership_scaled"
    
    if target_col not in df.columns:
        print(f"Target column '{target_col}' not found. Skipping regression training.")
        return None
    
    # Features for regression (exclude target and related columns)
    exclude_cols = [target_col, TARGET_CLASSIFICATION] + DROP_COLS
    features = [c for c in df.columns if c not in exclude_cols]
    
    num_cols = ["Journey Time (mins)", "Wait Time (mins)", "Number of Line Changes"]
    num_cols = [c for c in num_cols if c in features]
    cat_cols = [c for c in features if c not in num_cols]
    
    # Clean data
    df = df[df[target_col].notna()].reset_index(drop=True)
    df[num_cols] = df[num_cols].apply(pd.to_numeric, errors='coerce').fillna(0)
    df[cat_cols] = df[cat_cols].fillna("MISSING").astype(str)
    
    X = df[features]
    y = df[target_col]
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    print(f"Training samples: {len(X_train):,}")
    print(f"Test samples: {len(X_test):,}")
    
    # Fit encoders
    encoder = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
    encoder.fit(X_train[cat_cols])
    
    scaler = StandardScaler()
    scaler.fit(X_train[num_cols])
    
    # Transform
    X_train_final = np.hstack([
        scaler.transform(X_train[num_cols]),
        encoder.transform(X_train[cat_cols])
    ])
    
    X_test_final = np.hstack([
        scaler.transform(X_test[num_cols]),
        encoder.transform(X_test[cat_cols])
    ])
    
    # Train model
    if HAS_XGBOOST:
        print("\nTraining XGBoost Regressor...")
        model = XGBRegressor(
            n_estimators=200,
            max_depth=8,
            learning_rate=0.1,
            random_state=42
        )
    else:
        print("\nTraining RandomForest Regressor...")
        model = RandomForestRegressor(
            n_estimators=200,
            max_depth=15,
            random_state=42,
            n_jobs=-1
        )
    
    model.fit(X_train_final, y_train)
    
    # Evaluate
    pred = model.predict(X_test_final)
    
    mse = mean_squared_error(y_test, pred)
    mae = mean_absolute_error(y_test, pred)
    r2 = r2_score(y_test, pred)
    
    print(f"\nRegression Results:")
    print(f"  MSE: {mse:.6f}")
    print(f"  MAE: {mae:.6f}")
    print(f"  R²:  {r2:.4f}")
    
    # Save
    if save_models:
        os.makedirs(SAVE_DIR, exist_ok=True)
        pickle.dump(model, open(f"{SAVE_DIR}/ridership_model.pkl", "wb"))
        pickle.dump(encoder, open(f"{SAVE_DIR}/ridership_encoder.pkl", "wb"))
        pickle.dump(scaler, open(f"{SAVE_DIR}/ridership_scaler.pkl", "wb"))
        print(f"\n✅ Ridership model saved to {SAVE_DIR}/")
    
    return {
        "model": model,
        "encoder": encoder,
        "scaler": scaler,
        "mse": mse,
        "mae": mae,
        "r2": r2
    }


# =============================================================================
# MAIN
# =============================================================================

def train_all_models(data_path: str = None):
    """Train all models"""
    print("=" * 60)
    print("BheedMitra ML Model Training")
    print("=" * 60)
    
    # Load data
    df = load_dataset(data_path)
    print(f"\nLoaded dataset: {len(df):,} records, {len(df.columns)} columns")
    
    # Train classification model
    classifier_results = train_crowd_classifier(df, save_models=True)
    
    # Train regression model
    regressor_results = train_ridership_regressor(df, save_models=True)
    
    print("\n" + "=" * 60)
    print("Training Complete!")
    print("=" * 60)
    print("\nSummary:")
    print(f"  Classifier Balanced Accuracy: {classifier_results['balanced_accuracy']:.4f}")
    if regressor_results:
        print(f"  Regressor R²: {regressor_results['r2']:.4f}")
    
    return classifier_results, regressor_results


if __name__ == "__main__":
    train_all_models()
