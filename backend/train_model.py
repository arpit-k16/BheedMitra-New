"""
BheedMitra - Model Training Script
Updated for Time-Series Dataset from dataset_new/DMRC/
"""

import warnings
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
import pickle
import os
import glob

from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.preprocessing import OrdinalEncoder, StandardScaler
from sklearn.utils.class_weight import compute_sample_weight
from sklearn.metrics import accuracy_score, balanced_accuracy_score

from xgboost import XGBClassifier

# --------------------------------------------------
# CONFIG
# --------------------------------------------------
# Use combined time-series data or aggregate from individual files
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
COMBINED_DATA_PATH = os.path.join(BASE_DIR, "..", "data", "dmrc_timeseries_combined.csv")
INDIVIDUAL_DATA_DIR = os.path.join(BASE_DIR, "..", "data", "dataset_new", "DMRC")
SAVE_DIR = os.path.join(BASE_DIR, "..", "data", "saved_models")
TARGET = "platform_crowd_level"  # Updated for new dataset

os.makedirs(SAVE_DIR, exist_ok=True)

# --------------------------------------------------
# LOAD DATASET (Time-Series Format)
# --------------------------------------------------
def load_timeseries_data():
    """Load the combined time-series dataset or aggregate from individual files"""
    
    if os.path.exists(COMBINED_DATA_PATH):
        print(f"Loading combined dataset from {COMBINED_DATA_PATH}...")
        return pd.read_csv(COMBINED_DATA_PATH)
    
    # Aggregate from individual files
    print(f"Combined file not found. Aggregating from {INDIVIDUAL_DATA_DIR}...")
    pattern = os.path.join(INDIVIDUAL_DATA_DIR, "*.csv")
    files = sorted(glob.glob(pattern))
    
    if not files:
        raise FileNotFoundError(f"No CSV files found in {INDIVIDUAL_DATA_DIR}")
    
    dfs = []
    for i, f in enumerate(files):
        df = pd.read_csv(f)
        dfs.append(df)
        if (i + 1) % 50 == 0:
            print(f"  Loaded {i + 1}/{len(files)} files...")
    
    combined = pd.concat(dfs, ignore_index=True)
    combined.to_csv(COMBINED_DATA_PATH, index=False)
    print(f"Saved combined data to {COMBINED_DATA_PATH}")
    return combined

print("\n[INFO] Loading time-series dataset...")
df = load_timeseries_data()

# Filter valid target values
df = df[df[TARGET].notna()].reset_index(drop=True)
print(f"Total records: {len(df):,}")

# --------------------------------------------------
# FEATURE CONFIGURATION (Updated for new dataset)
# --------------------------------------------------
# Numeric features from time-series data
num_cols = [
    "hour_of_day",
    "day_of_week",
    "ridership_count",
    "train_frequency",
    "temperature",
    "rainfall",
    "rolling_demand_3h",
    "ridership_per_train",
    "station_congestion_index"
]

# Categorical features
cat_cols = [
    "station_id",
    "route_id",
    "weather_condition",
    "boarding_time_category",
    "crowd_level"  # low/medium/high categorical
]

# Binary features (treat as numeric)
binary_cols = [
    "is_weekend",
    "event_flag",
    "is_peak_hour"
]

# Columns to drop (not used as features)
drop_cols = [
    "station_name",  # Use station_id instead
    "timestamp",     # Temporal features extracted
    "event_name"     # Too many unique values
]

# Build feature list
features = [c for c in num_cols + cat_cols + binary_cols if c in df.columns]
features = [c for c in features if c not in drop_cols + [TARGET]]

# Update cat_cols to only include those in features
cat_cols = [c for c in cat_cols if c in features]
num_cols = [c for c in num_cols + binary_cols if c in features and c not in cat_cols]

print(f"Features: {len(features)}")
print(f"  Numeric: {num_cols}")
print(f"  Categorical: {cat_cols}")

# Clean numerics
df[num_cols] = df[num_cols].apply(pd.to_numeric, errors="coerce").fillna(0)
df[cat_cols] = df[cat_cols].fillna("MISSING").astype(str)

# --------------------------------------------------
# LABEL FIX (1–5 → 0–4)
# --------------------------------------------------
df["target_shifted"] = df[TARGET].astype(int) - 1
y = df["target_shifted"]
X = df[features]

print(f"\nTarget distribution:")
print(y.value_counts().sort_index())

# --------------------------------------------------
# TRAIN / TEST SPLIT (Time-aware: use last 20% for test)
# --------------------------------------------------
# For time-series, we split chronologically rather than randomly
if 'timestamp' in df.columns:
    df_sorted = df.sort_values('timestamp')
    split_idx = int(len(df_sorted) * 0.8)
    train_df = df_sorted.iloc[:split_idx]
    test_df = df_sorted.iloc[split_idx:]
    X_train = train_df[features]
    X_test = test_df[features]
    y_train = train_df["target_shifted"]
    y_test = test_df["target_shifted"]
else:
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

print(f"\nTrain size: {len(X_train):,}")
print(f"Test size: {len(X_test):,}")

# --------------------------------------------------
# ENCODING + SCALING
# --------------------------------------------------
encoder = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
encoder.fit(X_train[cat_cols])

scaler = StandardScaler()
scaler.fit(X_train[num_cols])

X_train_final = np.hstack([
    scaler.transform(X_train[num_cols]),
    encoder.transform(X_train[cat_cols])
])

X_test_final = np.hstack([
    scaler.transform(X_test[num_cols]),
    encoder.transform(X_test[cat_cols])
])

sample_weights = compute_sample_weight("balanced", y_train)

# --------------------------------------------------
# TRAIN XGBOOST
# --------------------------------------------------
print("\n[INFO] Training XGBoost Model...")

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
best_model = search.best_estimator_

# --------------------------------------------------
# TESTING
# --------------------------------------------------
pred_shifted = best_model.predict(X_test_final)
pred = pred_shifted + 1
y_true = y_test + 1

print("\nAccuracy:", accuracy_score(y_true, pred))
print("Balanced Accuracy:", balanced_accuracy_score(y_true, pred))

# --------------------------------------------------
# SAVE MODEL + PREPROCESSORS
# --------------------------------------------------
pickle.dump(best_model, open(f"{SAVE_DIR}/xgb_platform_crowd.pkl", "wb"))
pickle.dump(encoder, open(f"{SAVE_DIR}/platform_encoder.pkl", "wb"))
pickle.dump(scaler, open(f"{SAVE_DIR}/platform_scaler.pkl", "wb"))

# Save feature configuration for predict.py
feature_config = {
    "num_cols": num_cols,
    "cat_cols": cat_cols,
    "features": features,
    "target": TARGET
}
pickle.dump(feature_config, open(f"{SAVE_DIR}/feature_config.pkl", "wb"))

print("\n✅ Model and preprocessors saved in:", SAVE_DIR)
print("   - xgb_platform_crowd.pkl")
print("   - platform_encoder.pkl")
print("   - platform_scaler.pkl")
print("   - feature_config.pkl")
