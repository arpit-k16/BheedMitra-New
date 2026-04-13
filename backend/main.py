"""
BheedMitra - FastAPI Backend
REST API for crowd prediction and transit data
Updated for multi-system (DMRC + MTA) support

Run with: uvicorn backend.main:app --reload
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict
import pandas as pd
import numpy as np
import sys
import os
import io
import glob

try:
    from .auth_db import init_auth_db, create_user, authenticate_user
except ImportError:
    from auth_db import init_auth_db, create_user, authenticate_user

# Add parent directory for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

app = FastAPI(
    title="BheedMitra API",
    description="AI-driven Crowd Management System for Urban Transit",
    version="3.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

init_auth_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


SUPPORTED_SYSTEMS = {"DMRC", "MTA"}

DEFAULT_STATIONS = {
    "DMRC": [
        "Rajiv Chowk",
        "Kashmere Gate",
        "Central Secretariat",
        "New Delhi",
        "Connaught Place",
        "Chandni Chowk",
        "AIIMS",
        "Hauz Khas",
        "Nehru Place",
        "Botanical Garden",
    ],
    "MTA": [
        "Times Sq-42 St",
        "Grand Central-42 St",
        "34 St-Penn Station",
        "Fulton St",
        "Canal St",
        "Union Sq-14 St",
        "Atlantic Av-Barclays Ctr",
        "59 St-Columbus Circle",
        "Jackson Hts-Roosevelt Av",
        "Flushing-Main St",
    ],
}


def normalize_system(system: Optional[str]) -> str:
    normalized = (system or "DMRC").strip().upper()
    if normalized not in SUPPORTED_SYSTEMS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported system '{system}'. Supported systems: {sorted(SUPPORTED_SYSTEMS)}",
        )
    return normalized


def _system_slug(system: str) -> str:
    return system.lower()


def load_dataset_for_system(system: str) -> pd.DataFrame:
    system = normalize_system(system)
    base_dir = os.path.dirname(os.path.abspath(__file__))
    slug = _system_slug(system)

    combined_paths = [
        os.path.join(base_dir, "..", "data", f"{slug}_timeseries_combined.csv"),
        f"{slug}_timeseries_combined.csv",
        f"../{slug}_timeseries_combined.csv",
        os.path.join(os.path.dirname(__file__), "..", f"{slug}_timeseries_combined.csv"),
    ]

    for path in combined_paths:
        if os.path.exists(path):
            print(f"Loading {system} data from {path}")
            df = pd.read_csv(path)
            if "timestamp" in df.columns:
                df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
            return df

    individual_dirs = [
        os.path.join(base_dir, "..", "data", "dataset_new", system),
        f"dataset_new/{system}",
        f"../dataset_new/{system}",
        os.path.join(os.path.dirname(__file__), "..", "dataset_new", system),
    ]
    for input_dir in individual_dirs:
        if os.path.isdir(input_dir):
            pattern = os.path.join(input_dir, "*.csv")
            files = sorted(glob.glob(pattern))
            if files:
                dfs = [pd.read_csv(f) for f in files[:50]]
                combined = pd.concat(dfs, ignore_index=True)
                if "timestamp" in combined.columns:
                    combined["timestamp"] = pd.to_datetime(combined["timestamp"], errors="coerce")
                return combined

    print(f"WARNING: No data files found for system={system}")
    return pd.DataFrame()


def load_station_summary(system: str) -> pd.DataFrame:
    system = normalize_system(system)
    base_dir = os.path.dirname(os.path.abspath(__file__))
    slug = _system_slug(system)
    summary_paths = [
        os.path.join(base_dir, "..", "data", f"{slug}_stations_summary.csv"),
        f"{slug}_stations_summary.csv",
        f"../{slug}_stations_summary.csv",
        os.path.join(os.path.dirname(__file__), "..", f"{slug}_stations_summary.csv"),
    ]
    for path in summary_paths:
        if os.path.exists(path):
            return pd.read_csv(path)
    return pd.DataFrame()


def load_prediction_models(system: str):
    try:
        from .models.predict import get_models
        return get_models(system=normalize_system(system))
    except Exception:
        try:
            from models.predict import get_models
            return get_models(system=normalize_system(system))
        except Exception:
            return {"loaded": False}


_df_cache: Dict[str, pd.DataFrame] = {}
_models_cache: Dict[str, Dict] = {}
_station_summary_cache: Dict[str, pd.DataFrame] = {}


def get_df(system: str = "DMRC") -> pd.DataFrame:
    system = normalize_system(system)
    if system not in _df_cache:
        _df_cache[system] = load_dataset_for_system(system)
    return _df_cache[system]


def get_models(system: str = "DMRC") -> Dict:
    system = normalize_system(system)
    if system not in _models_cache:
        _models_cache[system] = load_prediction_models(system)
    return _models_cache[system]


def get_station_summary(system: str = "DMRC") -> pd.DataFrame:
    system = normalize_system(system)
    if system not in _station_summary_cache:
        _station_summary_cache[system] = load_station_summary(system)
    return _station_summary_cache[system]


class PredictionResponse(BaseModel):
    station: str
    crowd_level: int
    crowd_label: str
    congestion_index: float
    confidence: float
    recommendation: str


class StationInfo(BaseModel):
    name: str
    station_id: str
    line: str
    avg_crowd: float
    peak_crowd: int
    avg_train_frequency: float
    avg_ridership: float


class AnalyticsSummary(BaseModel):
    total_records: int
    unique_stations: int
    avg_crowd_level: float
    avg_wait_time: float
    congestion_index: float
    active_alerts: int
    peak_stations: Dict[str, float]


class HealthCheck(BaseModel):
    status: str
    version: str
    models_loaded: bool
    data_loaded: bool
    total_stations: int
    data_records: int


class SignupRequest(BaseModel):
    full_name: str
    email: str
    password: str
    role: str
    system: Optional[str] = "DMRC"
    station: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str
    role: str


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to BheedMitra API",
        "docs": "/api/docs",
        "version": "3.0.0",
        "dataset": "DMRC + MTA Time-Series",
    }


@app.get("/health", response_model=HealthCheck, tags=["Health"])
async def health_check(system: str = Query("DMRC", description="Transit system")):
    system = normalize_system(system)
    models = get_models(system)
    df = get_df(system)
    return {
        "status": "healthy",
        "version": "3.0.0",
        "models_loaded": models.get("loaded", False),
        "data_loaded": len(df) > 0,
        "total_stations": df["station_id"].nunique() if len(df) > 0 and "station_id" in df.columns else 0,
        "data_records": len(df),
    }


@app.get("/api/ports", tags=["Config"])
async def get_port_config():
    import json

    config_paths = [
        ".port_config.json",
        "../.port_config.json",
        os.path.join(os.path.dirname(__file__), ".port_config.json"),
        os.path.join(os.path.dirname(__file__), "..", ".port_config.json"),
    ]
    for path in config_paths:
        if os.path.exists(path):
            try:
                with open(path, "r") as f:
                    config = json.load(f)
                    return {
                        "passenger_port": config.get("passenger_port", 8501),
                        "admin_port": config.get("admin_port", 8502),
                        "backend_port": config.get("backend_port", 8000),
                        "source": "config_file",
                    }
            except Exception:
                pass
    return {"passenger_port": 8501, "admin_port": 8502, "backend_port": 8000, "source": "defaults"}


@app.post("/api/auth/signup", tags=["Auth"])
async def signup(payload: SignupRequest):
    if not payload.full_name.strip():
        raise HTTPException(status_code=400, detail="Full name is required")
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    try:
        user = create_user(
            email=payload.email,
            password=payload.password,
            role=payload.role,
            full_name=payload.full_name,
            station=payload.station,
            system=payload.system or "DMRC",
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"message": "Account created successfully", "user": user}


@app.post("/api/auth/login", tags=["Auth"])
async def login(payload: LoginRequest):
    user = authenticate_user(email=payload.email, password=payload.password, role=payload.role)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid email, password, or role")
    return {"message": "Login successful", "user": user}


@app.get("/api/predict", response_model=PredictionResponse, tags=["Prediction"])
async def predict_crowd(
    station: str = Query(..., description="Station name or ID"),
    system: str = Query("DMRC", description="Transit system"),
    time_category: str = Query("Afternoon", description="Time category"),
    weather: str = Query("Clear", description="Weather condition"),
    day_type: str = Query("Weekday", description="Day type"),
    special_event: str = Query("No", description="Special event nearby"),
    hour: Optional[int] = Query(None, description="Hour of day (0-23)"),
):
    system = normalize_system(system)
    try:
        try:
            from .models.predict import predict_full
        except Exception:
            from models.predict import predict_full
        result = predict_full(
            station=station,
            system=system,
            time_category=time_category,
            weather=weather,
            day_type=day_type,
            special_event=special_event,
            hour=hour,
        )
        return {
            "station": result["station"],
            "crowd_level": result["crowd_level"],
            "crowd_label": result["crowd_label"],
            "congestion_index": result["congestion_index"],
            "confidence": result["confidence"],
            "recommendation": result["recommendation"],
        }
    except Exception:
        df = get_df(system)
        if len(df) > 0 and "station_name" in df.columns:
            station_data = df[df["station_name"].str.contains(station, case=False, na=False)]
            if len(station_data) > 0:
                level = int(station_data["platform_crowd_level"].mean())
                labels = {1: "Very Low", 2: "Low", 3: "Moderate", 4: "High", 5: "Very High"}
                return {
                    "station": station,
                    "crowd_level": level,
                    "crowd_label": labels.get(level, "Moderate"),
                    "congestion_index": float(station_data["station_congestion_index"].mean() * 100),
                    "confidence": 0.75,
                    "recommendation": "Moderate crowd expected." if level <= 3 else "Consider alternate routes.",
                }
        import random
        level = random.randint(2, 4)
        labels = {1: "Very Low", 2: "Low", 3: "Moderate", 4: "High", 5: "Very High"}
        return {
            "station": station,
            "crowd_level": level,
            "crowd_label": labels.get(level, "Moderate"),
            "congestion_index": level * 20 + random.random() * 10,
            "confidence": 0.7 + random.random() * 0.2,
            "recommendation": "Moderate crowd expected." if level <= 3 else "Consider alternate routes.",
        }


@app.get("/api/stations", response_model=List[str], tags=["Stations"])
async def get_stations(system: str = Query("DMRC", description="Transit system")):
    system = normalize_system(system)
    df = get_df(system)
    if df.empty or "station_name" not in df.columns:
        return DEFAULT_STATIONS[system]
    return sorted(df["station_name"].dropna().astype(str).unique().tolist())


@app.get("/api/stations/ids", tags=["Stations"])
async def get_station_ids(system: str = Query("DMRC", description="Transit system")):
    system = normalize_system(system)
    df = get_df(system)
    if df.empty:
        return []
    required = ["station_id", "station_name", "route_id"]
    cols = [c for c in required if c in df.columns]
    if not cols:
        return []
    stations = df[cols].drop_duplicates()
    return stations.to_dict(orient="records")


@app.get("/api/stations/{station_name}", response_model=StationInfo, tags=["Stations"])
async def get_station_info(station_name: str, system: str = Query("DMRC", description="Transit system")):
    system = normalize_system(system)
    df = get_df(system)
    if df.empty:
        return {
            "name": station_name,
            "station_id": "Unknown",
            "line": "Unknown",
            "avg_crowd": 3.0,
            "peak_crowd": 4,
            "avg_train_frequency": 12.0,
            "avg_ridership": 0.0,
        }
    station_data = df[
        (df["station_name"].astype(str).str.contains(station_name, case=False, na=False))
        | (df["station_id"].astype(str).str.contains(station_name, case=False, na=False))
    ]
    if station_data.empty:
        raise HTTPException(status_code=404, detail=f"Station '{station_name}' not found")
    return {
        "name": station_data["station_name"].iloc[0],
        "station_id": station_data["station_id"].iloc[0],
        "line": station_data["route_id"].iloc[0] if "route_id" in station_data.columns else "Unknown",
        "avg_crowd": float(station_data["platform_crowd_level"].mean()) if "platform_crowd_level" in station_data.columns else 3.0,
        "peak_crowd": int(station_data["platform_crowd_level"].max()) if "platform_crowd_level" in station_data.columns else 4,
        "avg_train_frequency": float(station_data["train_frequency"].replace(0, np.nan).mean()) if "train_frequency" in station_data.columns else 12.0,
        "avg_ridership": float(station_data["ridership_count"].mean()) if "ridership_count" in station_data.columns else 0.0,
    }


@app.get("/api/timeseries/{station_id}", tags=["Time Series"])
async def get_station_timeseries(
    station_id: str,
    system: str = Query("DMRC", description="Transit system"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    limit: int = Query(168, description="Number of hours to return (default: 1 week)"),
):
    system = normalize_system(system)
    df = get_df(system)
    if df.empty:
        raise HTTPException(status_code=404, detail="No data available")
    station_data = df[df["station_id"].astype(str) == station_id].copy()
    if station_data.empty:
        station_data = df[df["station_id"].astype(str).str.contains(station_id, case=False, na=False)].copy()
    if station_data.empty:
        raise HTTPException(status_code=404, detail=f"Station '{station_id}' not found")
    if start_date and "timestamp" in station_data.columns:
        station_data = station_data[station_data["timestamp"] >= start_date]
    if end_date and "timestamp" in station_data.columns:
        station_data = station_data[station_data["timestamp"] <= end_date]
    if "timestamp" in station_data.columns:
        station_data = station_data.sort_values("timestamp", ascending=False).head(limit)
    available_cols = [
        c
        for c in [
            "timestamp",
            "hour_of_day",
            "day_of_week",
            "is_weekend",
            "ridership_count",
            "platform_crowd_level",
            "station_congestion_index",
            "weather_condition",
            "temperature",
            "event_flag",
            "boarding_time_category",
        ]
        if c in station_data.columns
    ]
    result = station_data[available_cols].copy()
    if "timestamp" in result.columns:
        result["timestamp"] = result["timestamp"].astype(str)
    return result.to_dict(orient="records")


@app.get("/api/analytics/summary", response_model=AnalyticsSummary, tags=["Analytics"])
async def get_analytics_summary(system: str = Query("DMRC", description="Transit system")):
    system = normalize_system(system)
    df = get_df(system)
    if df.empty:
        return {
            "total_records": 100000,
            "unique_stations": 286 if system == "DMRC" else 472,
            "avg_crowd_level": 2.8,
            "avg_wait_time": 4.2,
            "congestion_index": 68,
            "active_alerts": 3,
            "peak_stations": {s: 3.5 + i * 0.1 for i, s in enumerate(DEFAULT_STATIONS[system][:5])},
        }
    peak_stations = (
        df.groupby("station_name")["platform_crowd_level"].mean().nlargest(5).to_dict()
        if {"station_name", "platform_crowd_level"}.issubset(df.columns)
        else {}
    )
    avg_wait = 60 / df["train_frequency"].replace(0, 12).mean() if "train_frequency" in df.columns else 4.0
    avg_crowd = float(df["platform_crowd_level"].mean()) if "platform_crowd_level" in df.columns else 2.8
    congestion_index = round((avg_crowd / 5) * 100)
    if "platform_crowd_level" in df.columns and "station_name" in df.columns:
        active_alerts = int((df.groupby("station_name")["platform_crowd_level"].mean() >= 4).sum())
    else:
        active_alerts = 0
    return {
        "total_records": len(df),
        "unique_stations": df["station_id"].nunique() if "station_id" in df.columns else 0,
        "avg_crowd_level": avg_crowd,
        "avg_wait_time": float(avg_wait),
        "congestion_index": congestion_index,
        "active_alerts": max(active_alerts, 0),
        "peak_stations": peak_stations,
    }


@app.get("/api/analytics/trends", tags=["Analytics"])
async def get_crowd_trends(
    station: Optional[str] = None,
    system: str = Query("DMRC", description="Transit system"),
):
    system = normalize_system(system)
    df = get_df(system)
    if df.empty or "boarding_time_category" not in df.columns:
        return {"Morning Peak": 4.1, "Mid Morning": 2.5, "Afternoon": 2.8, "Evening Peak": 4.3, "Night": 1.8}
    if station and "station_name" in df.columns:
        df = df[df["station_name"].astype(str).str.contains(station, case=False, na=False)]
    trends = df.groupby("boarding_time_category")["platform_crowd_level"].mean().to_dict()
    return {k: float(v) for k, v in trends.items()}


@app.get("/api/analytics/hourly", tags=["Analytics"])
async def get_hourly_trends(
    station: Optional[str] = None,
    system: str = Query("DMRC", description="Transit system"),
):
    system = normalize_system(system)
    df = get_df(system)
    if df.empty or "hour_of_day" not in df.columns:
        return {str(h): 2.5 for h in range(24)}
    if station and "station_name" in df.columns:
        df = df[df["station_name"].astype(str).str.contains(station, case=False, na=False)]
    trends = df.groupby("hour_of_day")["platform_crowd_level"].mean().to_dict()
    return {str(k): float(v) for k, v in trends.items()}


@app.get("/api/analytics/peak-hours", tags=["Analytics"])
async def get_peak_hours(system: str = Query("DMRC", description="Transit system")):
    system = normalize_system(system)
    df = get_df(system)
    if df.empty or "hour_of_day" not in df.columns or "platform_crowd_level" not in df.columns:
        return {
            "morning_peak": {"start": "08:00", "end": "10:00", "avg_crowd": 4.1},
            "evening_peak": {"start": "18:00", "end": "20:00", "avg_crowd": 4.3},
            "least_crowded": {"start": "14:00", "end": "16:00", "avg_crowd": 2.3},
        }
    hourly_crowd = df.groupby("hour_of_day")["platform_crowd_level"].mean()
    morning = hourly_crowd.loc[6:12]
    evening = hourly_crowd.loc[16:22]
    morning_peak_hour = int(morning.idxmax()) if not morning.empty else 8
    evening_peak_hour = int(evening.idxmax()) if not evening.empty else 18
    least_crowded_hour = int(hourly_crowd.idxmin())
    return {
        "morning_peak": {"start": f"{morning_peak_hour:02d}:00", "end": f"{(morning_peak_hour + 2) % 24:02d}:00", "avg_crowd": float(morning.max()) if not morning.empty else 4.1},
        "evening_peak": {"start": f"{evening_peak_hour:02d}:00", "end": f"{(evening_peak_hour + 2) % 24:02d}:00", "avg_crowd": float(evening.max()) if not evening.empty else 4.3},
        "least_crowded": {"start": f"{least_crowded_hour:02d}:00", "end": f"{(least_crowded_hour + 2) % 24:02d}:00", "avg_crowd": float(hourly_crowd.min())},
    }


@app.get("/api/analytics/rankings", tags=["Analytics"])
async def get_station_rankings(
    metric: str = Query("crowd", description="Ranking metric"),
    limit: int = Query(10, description="Number of results"),
    system: str = Query("DMRC", description="Transit system"),
):
    system = normalize_system(system)
    df = get_df(system)
    if df.empty:
        return [{"station": s, "station_id": f"{system}_{i+1}", "value": 4.2 - i * 0.2} for i, s in enumerate(DEFAULT_STATIONS[system][:5])]
    if metric == "ridership" and "ridership_count" in df.columns:
        rankings = df.groupby(["station_name", "station_id"])["ridership_count"].mean()
    elif metric == "congestion" and "station_congestion_index" in df.columns:
        rankings = df.groupby(["station_name", "station_id"])["station_congestion_index"].mean()
    else:
        rankings = df.groupby(["station_name", "station_id"])["platform_crowd_level"].mean()
    top = rankings.nlargest(limit)
    return [{"station": k[0], "station_id": k[1], "value": float(v)} for k, v in top.items()]


@app.get("/api/analytics/weather-impact", tags=["Analytics"])
async def get_weather_impact(system: str = Query("DMRC", description="Transit system")):
    system = normalize_system(system)
    df = get_df(system)
    if df.empty or "weather_condition" not in df.columns:
        return {"Clear": 3.2, "Cloudy": 3.0, "Rainy": 2.5, "Foggy": 2.8}
    impact = df.groupby("weather_condition")["platform_crowd_level"].mean().to_dict()
    return {k: float(v) for k, v in impact.items()}


@app.get("/api/export", tags=["Export"])
async def export_data(
    format: str = Query("csv", description="Export format"),
    system: str = Query("DMRC", description="Transit system"),
):
    system = normalize_system(system)
    df = get_df(system)
    if df.empty:
        raise HTTPException(status_code=404, detail="No data available")
    if format == "csv":
        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=bheedmitra_export_{system.lower()}.csv"},
        )
    if format == "json":
        return df.head(1000).to_dict(orient="records")
    raise HTTPException(status_code=400, detail="Unsupported format")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
