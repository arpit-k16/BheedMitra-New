"""
System-aware model training utilities for BheedMitra.

Supports:
- DMRC: existing timeseries schema
- MTA: raw MTA hourly ridership CSV schema
"""

import os
import pickle
from datetime import datetime

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OrdinalEncoder, StandardScaler
from sklearn.metrics import accuracy_score, balanced_accuracy_score
from sklearn.ensemble import RandomForestClassifier

try:
    from xgboost import XGBClassifier
    HAS_XGBOOST = True
except Exception:
    HAS_XGBOOST = False


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
SAVE_DIR = os.path.join(DATA_DIR, "saved_models")

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
    "is_peak_hour",
]

CAT_COLS = [
    "station_id",
    "route_id",
    "weather_condition",
    "boarding_time_category",
    "crowd_level",
]


def _time_category(hour: int) -> str:
    if hour < 6:
        return "Night"
    if hour < 10:
        return "Morning Peak"
    if hour < 12:
        return "Mid Morning"
    if hour < 17:
        return "Afternoon"
    if hour < 20:
        return "Evening Peak"
    return "Night"


def _ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def _save_pickle(obj, filename: str) -> None:
    _ensure_dir(SAVE_DIR)
    with open(os.path.join(SAVE_DIR, filename), "wb") as f:
        pickle.dump(obj, f)


def _normalize_dmrc(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    if "timestamp" in df.columns:
        df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    else:
        raise ValueError("DMRC dataset must contain 'timestamp'")
    return df


def _normalize_mta(raw: pd.DataFrame) -> pd.DataFrame:
    df = raw.copy()
    required = {"transit_timestamp", "station_complex_id", "station_complex", "ridership"}
    missing = sorted(required - set(df.columns))
    if missing:
        raise ValueError(f"MTA dataset missing required columns: {missing}")

    df = df[df.get("transit_mode", "subway").astype(str).str.lower() == "subway"].copy()
    df["timestamp"] = pd.to_datetime(df["transit_timestamp"], errors="coerce")
    df = df.dropna(subset=["timestamp"])

    station_complex = df["station_complex"].astype(str)
    df["station_id"] = "MTA_" + df["station_complex_id"].astype(str)
    df["station_name"] = station_complex.str.replace(r"\s*\([^)]*\)\s*$", "", regex=True).str.strip()
    df["route_id"] = station_complex.str.extract(r"\(([^)]*)\)", expand=False).fillna("Subway")

    df["ridership_count"] = pd.to_numeric(df["ridership"], errors="coerce").fillna(0.0)
    df["hour_of_day"] = df["timestamp"].dt.hour
    df["day_of_week"] = df["timestamp"].dt.dayofweek
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
    df["is_peak_hour"] = df["hour_of_day"].isin([8, 9, 17, 18, 19]).astype(int)
    df["event_flag"] = 0
    df["weather_condition"] = "Clear"
    df["temperature"] = 20.0
    df["rainfall"] = 0.0
    df["boarding_time_category"] = df["hour_of_day"].apply(_time_category)

    df = df.sort_values(["station_id", "timestamp"])
    df["rolling_demand_3h"] = (
        df.groupby("station_id")["ridership_count"]
        .rolling(window=3, min_periods=1)
        .sum()
        .reset_index(level=0, drop=True)
    )
    df["train_frequency"] = np.where(df["is_peak_hour"] == 1, 20.0, 12.0)
    df["ridership_per_train"] = df["ridership_count"] / df["train_frequency"].replace(0, 1)
    station_mean = df.groupby("station_id")["ridership_count"].transform("mean")
    df["station_congestion_index"] = (df["ridership_count"] / station_mean.replace(0, 1)).clip(0, 5)

    # Quantile-based crowd target in [1..5]
    quantile_labels = pd.qcut(
        df["ridership_count"].rank(method="first"),
        q=5,
        labels=[1, 2, 3, 4, 5],
    )
    df["platform_crowd_level"] = quantile_labels.astype(int)
    df["crowd_level"] = df["platform_crowd_level"].map(
        {1: "very_low", 2: "low", 3: "moderate", 4: "high", 5: "very_high"}
    )
    return df


def _load_training_df(system: str, data_path: str = None, sample_size: int = 2_000_000) -> pd.DataFrame:
    system = (system or "DMRC").upper()
    if system == "MTA":
        path = data_path or os.path.join(DATA_DIR, "MTA_Subway_Hourly_Ridership.csv")
        raw = pd.read_csv(path, nrows=sample_size)
        return _normalize_mta(raw)

    # DMRC
    path = data_path or os.path.join(DATA_DIR, "dmrc_timeseries_combined.csv")
    if not os.path.exists(path):
        raise FileNotFoundError(f"DMRC training data not found: {path}")
    return _normalize_dmrc(pd.read_csv(path))


def _fit_classifier(df: pd.DataFrame):
    work = df.copy()
    for col in NUM_COLS:
        if col not in work.columns:
            work[col] = 0
    for col in CAT_COLS:
        if col not in work.columns:
            work[col] = "MISSING"
    if "platform_crowd_level" not in work.columns:
        raise ValueError("Training data must contain 'platform_crowd_level'")

    work = work.dropna(subset=["platform_crowd_level"])
    y = work["platform_crowd_level"].astype(int) - 1
    X_num = work[NUM_COLS].apply(pd.to_numeric, errors="coerce").fillna(0.0)
    X_cat = work[CAT_COLS].fillna("MISSING").astype(str)

    X_train_num, X_test_num, X_train_cat, X_test_cat, y_train, y_test = train_test_split(
        X_num, X_cat, y, test_size=0.2, random_state=42, stratify=y
    )

    encoder = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
    scaler = StandardScaler()
    X_train = np.hstack([scaler.fit_transform(X_train_num), encoder.fit_transform(X_train_cat)])
    X_test = np.hstack([scaler.transform(X_test_num), encoder.transform(X_test_cat)])

    if HAS_XGBOOST:
        model = XGBClassifier(
            objective="multi:softprob",
            num_class=5,
            eval_metric="mlogloss",
            random_state=42,
            n_estimators=200,
            max_depth=8,
            learning_rate=0.1,
        )
    else:
        model = RandomForestClassifier(
            n_estimators=250, max_depth=14, random_state=42, n_jobs=-1, class_weight="balanced"
        )

    model.fit(X_train, y_train)
    pred = model.predict(X_test)
    return model, encoder, scaler, {
        "accuracy": float(accuracy_score(y_test + 1, pred + 1)),
        "balanced_accuracy": float(balanced_accuracy_score(y_test + 1, pred + 1)),
        "train_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
    }


def _save_system_artifacts(system: str, model, encoder, scaler):
    system = system.upper()
    if system == "MTA":
        _save_pickle(model, "mta_xgb_platform_crowd.pkl")
        _save_pickle(encoder, "mta_platform_encoder.pkl")
        _save_pickle(scaler, "mta_platform_scaler.pkl")
        _save_pickle({"num_cols": NUM_COLS, "cat_cols": CAT_COLS}, "mta_feature_config.pkl")
    else:
        _save_pickle(model, "xgb_platform_crowd.pkl")
        _save_pickle(encoder, "platform_encoder.pkl")
        _save_pickle(scaler, "platform_scaler.pkl")
        _save_pickle({"num_cols": NUM_COLS, "cat_cols": CAT_COLS}, "feature_config.pkl")


def train_system_models(system: str = "DMRC", data_path: str = None, sample_size: int = 2_000_000):
    system = (system or "DMRC").upper()
    if system not in {"DMRC", "MTA"}:
        raise ValueError("system must be DMRC or MTA")

    df = _load_training_df(system=system, data_path=data_path, sample_size=sample_size)
    model, encoder, scaler, metrics = _fit_classifier(df)
    _save_system_artifacts(system, model, encoder, scaler)

    # Save combined + summary for MTA pipeline completion
    if system == "MTA":
        combined_path = os.path.join(DATA_DIR, "mta_timeseries_combined.csv")
        summary_path = os.path.join(DATA_DIR, "mta_stations_summary.csv")
        df.to_csv(combined_path, index=False)
        summary = (
            df.groupby(["station_id", "station_name", "route_id"], as_index=False)
            .agg(
                avg_crowd=("platform_crowd_level", "mean"),
                avg_ridership=("ridership_count", "mean"),
                avg_train_frequency=("train_frequency", "mean"),
            )
        )
        summary.to_csv(summary_path, index=False)

    return {
        "system": system,
        "metrics": metrics,
        "rows_used": int(len(df)),
        "saved_at": datetime.utcnow().isoformat() + "Z",
    }


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Train BheedMitra models for a transit system")
    parser.add_argument("--system", default="DMRC", choices=["DMRC", "MTA"], help="Transit system")
    parser.add_argument("--data-path", default=None, help="Optional custom CSV path")
    parser.add_argument("--sample-size", type=int, default=2_000_000, help="Rows to read for large CSVs")
    args = parser.parse_args()

    result = train_system_models(system=args.system, data_path=args.data_path, sample_size=args.sample_size)
    print(result)
