"""
BheedMitra - Standalone Admin Dashboard
Run with: streamlit run streamlit_admin.py --server.port 8502
"""

import os
from datetime import datetime
from io import BytesIO

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

st.set_page_config(page_title="BheedMitra Admin", page_icon="👨‍💼", layout="wide", initial_sidebar_state="expanded")

st.markdown(
    """
<style>
* { font-family: Inter, sans-serif; }
.stApp { background: linear-gradient(140deg, #0a101c 0%, #111a2a 100%); color: #e8eef7; }
[data-testid="stSidebar"] { background: #101827; border-right: 1px solid #1e2a3d; }
.card { background:#141f31; border:1px solid #22304a; border-radius:14px; padding:14px; }
.kpi-card { background:#121c2c; border:1px solid #273651; border-radius:12px; padding:12px; }
.kpi-label { font-size:11px; color:#9fb2cd; text-transform:uppercase; letter-spacing:.08em; }
.kpi-value { font-size:28px; font-weight:800; color:#f0f5ff; margin-top:4px; }
.chip { font-size:10px; font-weight:700; padding:3px 7px; border-radius:999px; display:inline-block; }
.chip-red { background:#3b1720; color:#ff9ea9; border:1px solid #6a2735; }
.chip-amber { background:#3a2c16; color:#ffd08d; border:1px solid #715324; }
.chip-cyan { background:#13353a; color:#82ecf7; border:1px solid #1f5961; }
h1,h2,h3,h4,p,span,div,label { color:#e8eef7 !important; }
</style>
""",
    unsafe_allow_html=True,
)


@st.cache_data
def load_data(system: str = "DMRC"):
    system = (system or "DMRC").upper()
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, "..", "data")
    system_combined = "mta_timeseries_combined.csv" if system == "MTA" else "dmrc_timeseries_combined.csv"
    for path in (
        os.path.join(data_dir, system_combined),
        os.path.join(data_dir, "dmrc_timeseries_combined.csv"),
        os.path.join(data_dir, "delhi_metro_cleaned_final.csv"),
        system_combined,
        "dmrc_timeseries_combined.csv",
        "delhi_metro_cleaned_final.csv",
    ):
        if os.path.exists(path):
            df = pd.read_csv(path)
            if "timestamp" in df.columns:
                df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
            return df
    return pd.DataFrame()


def pick_cols(df):
    station = "station_name" if "station_name" in df.columns else "Source Station"
    crowd = "platform_crowd_level" if "platform_crowd_level" in df.columns else "Platform Crowd Level at Boarding Station"
    wait = "train_frequency" if "train_frequency" in df.columns else "Wait Time (mins)"
    return station, crowd, wait


def wait_series(sub, wait_col):
    if wait_col == "train_frequency":
        freq = pd.to_numeric(sub[wait_col], errors="coerce").replace(0, np.nan)
        return (60 / freq).fillna(5.0)
    return pd.to_numeric(sub[wait_col], errors="coerce").fillna(5.0)


def classify_crowd_level(score: float):
    if score >= 3.6:
        return "High", "HIGH RISK", "chip-red"
    if score >= 2.4:
        return "Medium", "ELEVATED", "chip-amber"
    return "Low", "NORMAL", "chip-cyan"


def classify_relative_level(station_score: float, population_scores: pd.Series):
    """Classify station score against current network distribution."""
    if population_scores.empty:
        return classify_crowd_level(station_score)
    q1 = float(population_scores.quantile(0.33))
    q2 = float(population_scores.quantile(0.66))
    if station_score >= q2:
        return "High", "HIGH RISK", "chip-red"
    if station_score >= q1:
        return "Medium", "ELEVATED", "chip-amber"
    return "Low", "NORMAL", "chip-cyan"


def parse_hour_from_label(matched_time_label: str) -> int:
    try:
        return int(str(matched_time_label).split(":")[0])
    except Exception:
        return datetime.now().hour


def slice_df_for_current_time(df: pd.DataFrame):
    """
    Match current clock time to nearest timestamp time-of-day in dataset.
    Returns (time_slice_df, matched_time_label).
    """
    if "timestamp" not in df.columns:
        return df, "No timestamp column"

    tdf = df.dropna(subset=["timestamp"]).copy()
    if tdf.empty:
        return df, "No valid timestamps"

    tdf["minute_of_day"] = tdf["timestamp"].dt.hour * 60 + tdf["timestamp"].dt.minute
    now = datetime.now()
    now_minute = now.hour * 60 + now.minute

    available = tdf["minute_of_day"].unique()
    nearest_minute = min(available, key=lambda m: abs(int(m) - now_minute))
    sliced = tdf[tdf["minute_of_day"] == nearest_minute].copy()
    matched_label = f"{int(nearest_minute // 60):02d}:{int(nearest_minute % 60):02d}"
    return sliced, matched_label


def render_dashboard(df, df_now, station_col, crowd_col, wait_col, matched_time_label, preferred_station=None):
    stations = sorted(df[station_col].dropna().astype(str).unique().tolist())
    selected_index = 0
    if preferred_station:
        pref = str(preferred_station).strip().lower()
        for idx, candidate in enumerate(stations):
            if str(candidate).strip().lower() == pref:
                selected_index = idx
                break
    station = st.selectbox("Station", stations, index=selected_index)
    sub_now = df_now[df_now[station_col].astype(str) == station].copy()
    sub_hist = df[df[station_col].astype(str) == station].copy()
    if sub_now.empty and sub_hist.empty:
        st.warning("No station data found.")
        return
    sub = sub_now if not sub_now.empty else sub_hist

    crowd = pd.to_numeric(sub[crowd_col], errors="coerce").dropna()
    avg_crowd = crowd.mean() if len(crowd) else 3.0
    waits = wait_series(sub, wait_col)
    wait_m = waits.median()
    current_hour = parse_hour_from_label(matched_time_label)

    weather_factor = 0.0
    weather_label = "Unknown"
    if "weather_condition" in sub.columns:
        weather_series = sub["weather_condition"].dropna().astype(str)
        if not weather_series.empty:
            weather_label = weather_series.mode().iloc[0]
            weather_factor = {
                "Clear": -0.2,
                "Cloudy": 0.0,
                "Rainy": 0.3,
                "Foggy": 0.2,
            }.get(weather_label, 0.0)

    time_factor = 0.0
    if 7 <= current_hour <= 10 or 17 <= current_hour <= 20:
        time_factor = 0.3
    elif current_hour >= 22 or current_hour <= 5:
        time_factor = -0.2

    effective_score = float(np.clip(avg_crowd + weather_factor + time_factor, 1.0, 5.0))
    network_scores = pd.to_numeric(df_now[crowd_col], errors="coerce").dropna()
    level_text, level_badge, level_chip_class = classify_relative_level(effective_score, network_scores)
    congestion = int(round((effective_score / 5) * 100))
    active_alerts = int(max(0, (effective_score >= 3.2) + (crowd.max() >= 4.3 if len(crowd) else 0)))
    st.caption(f"Time-matched data slice: **{matched_time_label}** (nearest to current time)")
    st.caption(f"Weather context: **{weather_label}** | Score: **{effective_score:.2f}/5**")

    # Live series buffer for current station (used by line chart)
    if "live_series_station" not in st.session_state:
        st.session_state.live_series_station = station
    if "live_series_points" not in st.session_state:
        st.session_state.live_series_points = []
    if st.session_state.live_series_station != station:
        st.session_state.live_series_station = station
        st.session_state.live_series_points = []
    st.session_state.live_series_points.append(
        {"ts": datetime.now().strftime("%H:%M:%S"), "crowd": round(effective_score, 2)}
    )
    st.session_state.live_series_points = st.session_state.live_series_points[-60:]

    c1, c2, c3, c4 = st.columns(4)
    c1.markdown(f'<div class="kpi-card"><span class="chip {level_chip_class}">{level_badge}</span><div class="kpi-label">Current Crowd Level</div><div class="kpi-value">{level_text}</div></div>', unsafe_allow_html=True)
    c2.markdown(f'<div class="kpi-card"><span class="chip chip-amber">ELEVATED</span><div class="kpi-label">Congestion Index</div><div class="kpi-value">{congestion}%</div></div>', unsafe_allow_html=True)
    c3_chip = "chip-red" if wait_m >= 5 else ("chip-amber" if wait_m >= 3 else "chip-cyan")
    c3_label = "HIGH" if wait_m >= 5 else ("MODERATE" if wait_m >= 3 else "LOW")
    c3.markdown(f'<div class="kpi-card"><span class="chip {c3_chip}">{c3_label}</span><div class="kpi-label">Avg Waiting Time</div><div class="kpi-value">{int(round(wait_m*2.6))} <span style="font-size:14px;color:#9fb2cd;">mins</span></div></div>', unsafe_allow_html=True)
    c4_chip = "chip-red" if active_alerts >= 2 else ("chip-amber" if active_alerts == 1 else "chip-cyan")
    c4_tag = "CRITICAL" if active_alerts >= 2 else ("WATCH" if active_alerts == 1 else "CLEAR")
    c4.markdown(f'<div class="kpi-card"><span class="chip {c4_chip}">{c4_tag}</span><div class="kpi-label">Active Alerts</div><div class="kpi-value">{active_alerts}</div></div>', unsafe_allow_html=True)

    left, right = st.columns([1, 2])
    with left:
        st.markdown("#### Live Alerts")
        pri_badge = "HIGH PRIORITY" if level_text == "High" else ("MEDIUM PRIORITY" if level_text == "Medium" else "LOW PRIORITY")
        pri_border = "#ae3b4b" if level_text == "High" else ("#a5762c" if level_text == "Medium" else "#2a9db2")
        primary_msg = (
            f"{station} crowd pressure is high at {effective_score:.2f}/5."
            if level_text == "High"
            else f"{station} has moderate load at {effective_score:.2f}/5."
            if level_text == "Medium"
            else f"{station} is running with low load at {effective_score:.2f}/5."
        )
        if active_alerts >= 2:
            secondary_msg = f"Potential bottleneck risk due to {weather_label} conditions."
        elif active_alerts == 1:
            secondary_msg = f"Monitor interchange flow for next 30 minutes."
        else:
            secondary_msg = "No critical secondary alerts in current time slice."
        st.markdown(
            f"""
<div class="card" style="border-left:4px solid {pri_border};">
<div class="chip {'chip-red' if level_text == 'High' else 'chip-amber' if level_text == 'Medium' else 'chip-cyan'}">{pri_badge}</div>
<p style="margin:8px 0 0 0;"><b>{primary_msg}</b></p>
</div>
<div class="card" style="border-left:4px solid #a5762c; margin-top:10px;">
<div class="chip chip-amber">MEDIUM PRIORITY</div>
<p style="margin:8px 0 0 0;">{secondary_msg}</p>
</div>
""",
            unsafe_allow_html=True,
        )
        st.markdown("#### Suggested Actions")
        actions = []
        if level_text == "High":
            actions = [
                "Increase train frequency by 1 step",
                "Deploy additional marshals at platform gates",
                "Push commuter advisory to alternate stations",
            ]
        elif level_text == "Medium":
            actions = [
                "Keep reserve staff on standby",
                "Monitor gate inflow every 5 minutes",
                "Broadcast mild crowd advisory",
            ]
        else:
            actions = [
                "Continue standard operations",
                "Maintain passive monitoring",
                "Log current low-load window",
            ]
        st.markdown(
            f"""
<div class="card" style="border-left:4px solid #2a9db2;">
<ul style="margin:0; padding-left:16px;">
<li>{actions[0]}</li>
<li>{actions[1]}</li>
<li>{actions[2]}</li>
</ul>
</div>
""",
            unsafe_allow_html=True,
        )
        st.button("Apply Recommended Measures", use_container_width=True)

    with right:
        st.markdown("#### Station Analytics")
        # Row 1: hourly pattern + top congested stations
        a1, a2 = st.columns([1, 1])
        with a1:
            if "hour_of_day" in sub_hist.columns:
                hourly = sub_hist.groupby("hour_of_day")[crowd_col].mean().reindex(range(24)).fillna(method="ffill").fillna(0)
                fig = px.bar(
                    x=hourly.index,
                    y=hourly.values,
                    color=hourly.values,
                    color_continuous_scale="Tealrose",
                    labels={"x": "Hour of Day", "y": "Average Crowd Level (1-5)", "color": "Crowd Level"},
                )
                fig.update_traces(hovertemplate="Hour: %{x}:00<br>Avg Crowd: %{y:.2f}/5<extra></extra>")
                fig.update_layout(
                    height=280,
                    margin=dict(l=0, r=0, t=10, b=0),
                    paper_bgcolor="rgba(0,0,0,0)",
                    plot_bgcolor="rgba(0,0,0,0)",
                    xaxis_title="Hour of Day",
                    yaxis_title="Average Crowd Level (1-5)",
                )
                st.plotly_chart(fig, use_container_width=True)
        with a2:
            top = df_now.groupby(station_col)[crowd_col].mean().sort_values(ascending=False).head(3)
            if top.empty:
                top = df.groupby(station_col)[crowd_col].mean().sort_values(ascending=False).head(3)
            for s, v in top.items():
                pct = int(round((float(v) / 5) * 100))
                st.markdown(f"**{s}**")
                st.progress(min(100, pct), text=f"{pct}%")

        # Row 2: live line graph (timestamp vs crowd level)
        st.markdown("#### Live Crowd Trend")
        live_df = pd.DataFrame(st.session_state.live_series_points)
        if not live_df.empty:
            fig_live = go.Figure()
            fig_live.add_trace(
                go.Scatter(
                    x=live_df["ts"],
                    y=live_df["crowd"],
                    mode="lines+markers",
                    line=dict(color="#4bd4ff", width=2),
                    marker=dict(size=6, color="#9ee8ff"),
                    name="Crowd Level",
                )
            )
            fig_live.update_layout(
                height=260,
                margin=dict(l=0, r=0, t=10, b=0),
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                xaxis_title="Timestamp",
                yaxis_title="Crowd Level (1-5)",
                yaxis=dict(range=[1, 5]),
                showlegend=False,
            )
            st.plotly_chart(fig_live, use_container_width=True)

        st.markdown("#### Station Control")
        x1, x2, x3 = st.columns(3)
        x1.metric("Current Control", station)
        x2.metric("Current Headway", "3m 45s")
        x3.metric("Optimized Target", "2m 30s")
        st.button("Manual Override")


def render_map(df_now, station_col, crowd_col, matched_time_label):
    st.markdown("### Transit Map")
    st.caption(f"Map values matched to time: **{matched_time_label}**")
    top = df_now.groupby(station_col)[crowd_col].mean().sort_values(ascending=False).head(7).reset_index()
    top["x"] = [0, 1, 2, 2.8, 3.5, 4.2, 5.0]
    top["y"] = [0, 0.8, 0.2, 1.3, 0.4, 1.1, 0.3]
    fig = px.scatter(top, x="x", y="y", text=station_col, color=crowd_col, size=crowd_col, size_max=25, color_continuous_scale="Turbo")
    fig.update_traces(textposition="top center")
    fig.update_layout(height=550, xaxis=dict(visible=False), yaxis=dict(visible=False), paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="#0e1624", margin=dict(l=10, r=10, t=10, b=10))
    st.plotly_chart(fig, use_container_width=True)


def render_alerts(df_now, station_col, crowd_col, matched_time_label):
    st.markdown("### Active Alerts")
    st.caption(f"Alerts from nearest timestamp slice: **{matched_time_label}**")
    top = df_now.groupby(station_col)[crowd_col].mean().sort_values(ascending=False).head(8)
    rows = [{"station": s, "avg_crowd": round(float(v), 2), "severity": "High" if v >= 4 else "Medium"} for s, v in top.items()]
    st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)


def render_reports(df, df_now, station_col, crowd_col, matched_time_label):
    st.markdown("### System Performance Reports")
    total = len(df_now)
    unique = df_now[station_col].nunique()
    avg = float(pd.to_numeric(df_now[crowd_col], errors="coerce").mean())
    st.caption(f"Report period: nearest time slice **{matched_time_label}**")
    c1, c2, c3 = st.columns(3)
    c1.metric("Records", f"{total:,}")
    c2.metric("Stations", unique)
    c3.metric("Avg Crowd", f"{avg:.2f}/5")
    rank = df_now.groupby(station_col)[crowd_col].mean().sort_values(ascending=False).head(10)
    fig = px.bar(x=rank.index, y=rank.values, color=rank.values, color_continuous_scale="Sunset")
    fig.update_layout(height=360, xaxis_title="Station", yaxis_title="Avg Crowd", paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
    st.plotly_chart(fig, use_container_width=True)
    buf = BytesIO()
    rank.to_frame("avg_crowd").to_csv(buf)
    st.download_button("Download CSV", buf.getvalue(), "admin_station_ranking.csv", "text/csv")


def main():
    query = st.query_params
    system = query.get("system", "DMRC")
    station_param = query.get("station", "")
    if isinstance(station_param, list):
        station_param = station_param[0] if station_param else ""
    df = load_data(system)
    if df.empty:
        st.error("Dataset not found. Put `dmrc_timeseries_combined.csv` in `data/`.")
        return

    station_col, crowd_col, wait_col = pick_cols(df)
    df_now, matched_time_label = slice_df_for_current_time(df)

    with st.sidebar:
        st.markdown("## BheedMitra")
        st.caption("System Orchestrator")
        nav = st.radio(
            "Navigation",
            ["Dashboard", "Transit Map", "Alerts", "Reports"],
            label_visibility="collapsed",
        )
        st.markdown("---")
        st.caption(f"System: {system}")
        if station_param:
            st.caption(f"Assigned station: {station_param}")
        st.caption(f"Matched timestamp: {matched_time_label}")
        st.caption(f"Updated: {datetime.now().strftime('%H:%M:%S')}")
        auto_refresh = st.checkbox("Auto-refresh (30s)", value=True)
        if auto_refresh:
            st.caption("Auto refresh is ON")
        if st.button("Back to React", use_container_width=True):
            st.markdown('<meta http-equiv="refresh" content="0;url=http://localhost:5173/">', unsafe_allow_html=True)

    top_l, top_r = st.columns([3, 2])
    with top_l:
        st.markdown("## Admin Control Panel")
    with top_r:
        st.markdown('<div style="text-align:right;"><span class="chip chip-cyan">LIVE</span></div>', unsafe_allow_html=True)

    if nav == "Dashboard":
        render_dashboard(
            df,
            df_now,
            station_col,
            crowd_col,
            wait_col,
            matched_time_label,
            preferred_station=station_param,
        )
    elif nav == "Transit Map":
        render_map(df_now, station_col, crowd_col, matched_time_label)
    elif nav == "Alerts":
        render_alerts(df_now, station_col, crowd_col, matched_time_label)
    else:
        render_reports(df, df_now, station_col, crowd_col, matched_time_label)

    if auto_refresh:
        st.markdown('<meta http-equiv="refresh" content="30">', unsafe_allow_html=True)


if __name__ == "__main__":
    main()
