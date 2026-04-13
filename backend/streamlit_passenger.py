"""
BheedMitra - Standalone Passenger Dashboard
Run with: streamlit run streamlit_passenger.py --server.port 8501

This is the passenger-facing panel for crowd predictions and journey planning.
Designed to receive redirects from React login page.
"""

import streamlit as st
import pandas as pd
import numpy as np
import os
import sys
from datetime import datetime, timedelta
import plotly.express as px
import plotly.graph_objects as go

# =============================================================================
# PAGE CONFIG - Must be first Streamlit command
# =============================================================================
st.set_page_config(
    page_title="BheedMitra - Passenger",
    page_icon="🚇",
    layout="wide",
    initial_sidebar_state="expanded"
)

# =============================================================================
# CUSTOM CSS - Dark Theme
# =============================================================================
DARK_CSS = '''
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    
    * { font-family: 'Inter', sans-serif; }
    
    .main, .block-container, .stApp { color: #E6EEF8 !important; }
    p, div, span, li, td, th, label, .stMarkdown, .stText { color: #E6EEF8 !important; }
    .main { background: linear-gradient(135deg, #0f1724 0%, #1e293b 100%); }
    
    .big-title { 
        font-size: 48px; 
        font-weight: 800; 
        color: #E6EEF8 !important; 
        padding: 20px 0; 
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 15px;
    }
    
    .big-title-text {
        background: linear-gradient(135deg, #9BD1FF 0%, #667eea 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    
    .section-title { 
        font-size: 28px; 
        font-weight: 700; 
        color: #9BD1FF !important; 
        margin: 30px 0 20px 0;
        padding-bottom: 10px;
        border-bottom: 3px solid #9BD1FF;
    }
    
    .card { 
        background: #0b1220; 
        padding: 25px; 
        border-radius: 16px; 
        box-shadow: 0 8px 32px rgba(0,0,0,0.3); 
        margin-bottom: 20px;
        border-left: 4px solid #1f6feb;
        color: #E6EEF8 !important;
    }
    
    .card p, .card li, .card div, .card span, .card ul { color: #E6EEF8 !important; }
    .card h3 { color: #9BD1FF !important; }
    
    .stat-card {
        background: linear-gradient(135deg, #1f6feb 0%, #764ba2 100%);
        color: white !important;
        padding: 20px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 4px 15px rgba(31, 111, 235, 0.4);
    }
    
    .stat-card * { color: white !important; }
    
    .metric-container {
        background: #0b1220;
        padding: 15px;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        margin: 10px 0;
        color: #E6EEF8 !important;
    }
    
    h1, h2, h3, h4, h5, h6 { color: #E6EEF8 !important; }
    
    .info-box {
        background: #1e3a5f;
        padding: 15px;
        border-radius: 8px;
        border-left: 4px solid #1f6feb;
        margin: 15px 0;
        color: #E6EEF8 !important;
    }
    
    .info-box p, .info-box div, .info-box span, .info-box strong { color: #E6EEF8 !important; }
    
    .stSelectbox label, .stTextInput label, .stNumberInput label { color: #E6EEF8 !important; }
    .stDataFrame, .stTable { color: #E6EEF8 !important; }
    
    [data-testid="stMarkdownContainer"] p,
    [data-testid="stMarkdownContainer"] li,
    [data-testid="stMarkdownContainer"] div,
    [data-testid="stText"],
    [class*="stText"],
    [class*="element-container"] p,
    [class*="element-container"] div { color: #E6EEF8 !important; }
    
    .stMarkdown, .stText { color: #E6EEF8 !important; }
    
    .role-badge-passenger {
        background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
        color: white;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: bold;
        display: inline-block;
    }
    
    .demo-banner {
        background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
        color: white;
        padding: 10px 20px;
        border-radius: 8px;
        text-align: center;
        margin-bottom: 20px;
        font-weight: 500;
    }
    
    .alert-critical {
        background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
        color: white;
        padding: 15px;
        border-radius: 8px;
        margin: 10px 0;
    }
    
    .alert-warning {
        background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
        color: white;
        padding: 15px;
        border-radius: 8px;
        margin: 10px 0;
    }
    
    .alert-success {
        background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
        color: white;
        padding: 15px;
        border-radius: 8px;
        margin: 10px 0;
    }
</style>
'''

st.markdown(DARK_CSS, unsafe_allow_html=True)

# =============================================================================
# CONSTANTS
# =============================================================================
CROWD_LEVELS = {
    1: {"label": "Very Low", "color": "#4caf50", "emoji": "🟢"},
    2: {"label": "Low", "color": "#8bc34a", "emoji": "🟡"},
    3: {"label": "Moderate", "color": "#ff9800", "emoji": "🟠"},
    4: {"label": "High", "color": "#f44336", "emoji": "🔴"},
    5: {"label": "Very High", "color": "#b71c1c", "emoji": "🔴🔴"}
}

TIME_CATEGORIES = ["Morning Peak", "Mid Morning", "Afternoon", "Evening Peak", "Night"]


# =============================================================================
# DATA LOADING
# =============================================================================
@st.cache_data
def load_data(system: str = "DMRC"):
    """Load the time-series dataset"""
    system = (system or "DMRC").upper()
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, "..", "data")
    system_combined = "mta_timeseries_combined.csv" if system == "MTA" else "dmrc_timeseries_combined.csv"
    paths_to_try = [
        os.path.join(data_dir, system_combined),
        os.path.join(data_dir, "dmrc_timeseries_combined.csv"),
        system_combined,
        f"./{system_combined}",
        "dmrc_timeseries_combined.csv",
        "./dmrc_timeseries_combined.csv",
        "delhi_metro_cleaned_final.csv",
        "./delhi_metro_cleaned_final.csv"
    ]
    
    for path in paths_to_try:
        if os.path.exists(path):
            try:
                df = pd.read_csv(path)
                if 'timestamp' in df.columns:
                    df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
                return df
            except Exception as e:
                continue
    
    st.error("Dataset not found! Please ensure dmrc_timeseries_combined.csv exists.")
    return pd.DataFrame()


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================
def get_stations_from_df(df: pd.DataFrame) -> list:
    """Extract unique stations from DataFrame"""
    if df.empty:
        return []
    if 'station_name' in df.columns:
        return sorted(df['station_name'].dropna().unique().tolist())
    if 'Source Station' in df.columns:
        return sorted(set(df["Source Station"].unique()) | set(df["Destination Station"].unique()))
    return []


def get_station_data(df: pd.DataFrame, station: str) -> pd.DataFrame:
    """Get data for a specific station"""
    if df.empty:
        return pd.DataFrame()
    if 'station_name' in df.columns:
        return df[df['station_name'] == station].copy()
    if 'Source Station' in df.columns:
        return df[df['Source Station'] == station].copy()
    return pd.DataFrame()


def get_time_category_from_hour(hour: int) -> str:
    """Determine time category based on hour (0-23)"""
    if 6 <= hour < 10:
        return "Morning Peak"
    elif 10 <= hour < 14:
        return "Mid Morning"
    elif 14 <= hour < 17:
        return "Afternoon"
    elif 17 <= hour < 21:
        return "Evening Peak"
    else:
        return "Night"


def get_boarding_time_category(travel_time_option: str) -> str:
    """Convert travel time option to actual time category"""
    now = datetime.now()
    
    if travel_time_option == "Now":
        hour = now.hour
    elif travel_time_option == "In 30 minutes":
        future_time = now + timedelta(minutes=30)
        hour = future_time.hour
    elif travel_time_option == "1 hour":
        future_time = now + timedelta(hours=1)
        hour = future_time.hour
    elif travel_time_option in TIME_CATEGORIES:
        return travel_time_option
    else:
        hour = now.hour
    
    return get_time_category_from_hour(hour)


def get_crowd_recommendation(crowd_level: int) -> dict:
    """Get recommendation based on crowd level"""
    if crowd_level >= 4:
        return {
            "type": "critical",
            "title": "🚨 High Crowd Expected",
            "message": """
            - Consider delaying your journey by 30-60 minutes
            - Check alternate stations nearby
            - Allow extra time for boarding
            - Be prepared for longer wait times
            """,
            "action": "delay"
        }
    elif crowd_level == 3:
        return {
            "type": "warning",
            "title": "⚠️ Moderate Crowd",
            "message": """
            - Current time is acceptable but not optimal
            - Consider travelling slightly earlier or later
            - Expect moderate wait times
            """,
            "action": "monitor"
        }
    else:
        return {
            "type": "success",
            "title": "✅ Low Crowd - Great Time to Travel!",
            "message": """
            - Optimal travel conditions
            - Minimal wait times expected
            - Comfortable boarding experience
            """,
            "action": "proceed"
        }


def safe_predict_full(station: str, boarding_time: str, weather: str, hour: int, system: str = "DMRC"):
    """Run model prediction with stable fallback metadata."""
    try:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from models.predict import predict_full, get_models

        models = get_models(system=system)
        model_loaded = bool(models.get("loaded", False))
        prediction = predict_full(
            station=station,
            system=system,
            time_category=boarding_time,
            weather=weather,
            day_type="Weekday",
            special_event="No",
            hour=hour
        )
        return prediction, ("ml_model" if model_loaded else "heuristic_fallback")
    except Exception:
        return None, "data_fallback"


def render_crowd_level_display(crowd_level: int, large: bool = False):
    """Render a crowd level indicator"""
    level_info = CROWD_LEVELS.get(crowd_level, CROWD_LEVELS[3])
    color = level_info["color"]
    label = level_info["label"]
    emoji = level_info["emoji"]
    
    if large:
        st.markdown(f"""
        <div class="card" style="text-align:center; background: linear-gradient(135deg, {color} 0%, {color}88 100%); color: white;">
            <h1 style="color: white; margin: 10px 0;">Predicted Crowd Level</h1>
            <h2 style="color: white; font-size: 72px; margin: 20px 0;">{crowd_level}/5</h2>
            <h3 style="color: white; margin: 10px 0;">{emoji} {label}</h3>
        </div>
        """, unsafe_allow_html=True)
    else:
        st.markdown(f"""
        <span style="color: {color}; font-weight: bold;">{emoji} {crowd_level}/5 - {label}</span>
        """, unsafe_allow_html=True)


# =============================================================================
# SIDEBAR
# =============================================================================
def render_sidebar(df: pd.DataFrame, system: str):
    """Render sidebar"""
    with st.sidebar:
        st.markdown("### 👤 Passenger Panel")
        st.markdown(f'<span class="role-badge-passenger">PASSENGER MODE</span>', unsafe_allow_html=True)
        st.caption(f"System: {system}")
        
        st.markdown("---")
        
        # Dataset stats
        st.markdown("**📊 Data Overview**")
        st.metric("Records", f"{len(df):,}")
        
        if 'station_name' in df.columns:
            unique_stations = df['station_name'].nunique()
        elif 'station_id' in df.columns:
            unique_stations = df['station_id'].nunique()
        else:
            unique_stations = 0
        st.metric("Stations", unique_stations)
        
        # Time range
        if 'timestamp' in df.columns and not df.empty:
            try:
                min_date = df['timestamp'].min()
                max_date = df['timestamp'].max()
                st.caption(f"📅 {min_date.strftime('%Y-%m-%d')} to {max_date.strftime('%Y-%m-%d')}")
            except:
                pass
        
        st.markdown("---")
        
        # Navigation
        st.markdown("**🔗 Navigation**")
        if st.button("🏠 Back to Home", use_container_width=True):
            st.markdown('<meta http-equiv="refresh" content="0;url=http://localhost:5173/">', unsafe_allow_html=True)
        
        if st.button("🔄 Refresh Data", use_container_width=True):
            st.cache_data.clear()
            st.rerun()
        
        st.markdown("---")
        st.caption("BheedMitra v3.0.0")


# =============================================================================
# MAIN PASSENGER DASHBOARD
# =============================================================================
def main():
    """Main passenger dashboard"""
    # Get query params
    query_params = st.query_params
    system = query_params.get("system", "DMRC")
    
    # Load data
    df = load_data(system)
    
    if df.empty:
        st.error("No data available. Please check the dataset.")
        return
    
    # Render sidebar
    render_sidebar(df, system)
    
    # Header
    st.markdown("""
    <div class="big-title">
        <span>🚇</span>
        <span class="big-title-text">BheedMitra Passenger Panel</span>
    </div>
    """, unsafe_allow_html=True)
    
    # Section title
    st.markdown('<div class="section-title">👤 Journey Planner</div>', unsafe_allow_html=True)
    
    # Get unique stations
    stations = get_stations_from_df(df)
    
    if not stations:
        st.error("No station data available.")
        return
    
    # Journey Planning Section
    st.markdown("### 🗺️ Plan Your Journey")
    
    col1, col2, col3 = st.columns([2, 1, 1])
    
    with col1:
        src = st.selectbox(
            "📍 Select Your Station", 
            stations, 
            help="Choose your boarding station",
            key="passenger_source"
        )
        dest = st.selectbox(
            "🎯 Destination Station", 
            stations, 
            help="Choose your destination",
            index=min(1, len(stations)-1),
            key="passenger_dest"
        )
    
    with col2:
        travel_time = st.selectbox(
            "🕐 When are you travelling?", 
            ["Now", "In 30 minutes", "1 hour", "Morning Peak", "Evening Peak"],
            help="Select your travel time",
            key="passenger_time"
        )
        
        # Hour selector
        current_hour = datetime.now().hour
        selected_hour = st.slider("Hour", 0, 23, current_hour, key="passenger_hour")
    
    with col3:
        weather = st.selectbox(
            "🌤️ Weather", 
            ["Clear", "Cloudy", "Rainy", "Foggy"],
            help="Current weather condition",
            key="passenger_weather"
        )

    # React-format section: Crowd Insight + Smart Suggestions
    si1, si2 = st.columns([1, 1])
    with si1:
        st.markdown("### 📌 Crowd Insight")
        st.markdown("""
        <div class="card">
            <h3 style="margin-bottom:10px;">Live station density snapshot</h3>
            <p style="margin:0;">Select station/time and run prediction to get confidence-backed crowd level.</p>
        </div>
        """, unsafe_allow_html=True)
    with si2:
        st.markdown("### 💡 Smart Suggestions")
        st.markdown("""
        <div class="card">
            <ul style="margin:0; padding-left:18px;">
                <li>Avoid 08:00-10:00 and 18:00-20:00 for lower wait times.</li>
                <li>Interchange hubs can spike quickly during rain/event windows.</li>
                <li>Use the best recommendation card after prediction.</li>
            </ul>
        </div>
        """, unsafe_allow_html=True)
    
    # Calculate time category
    boarding_time = get_boarding_time_category(travel_time)
    
    # Display time info
    if travel_time in ["Now", "In 30 minutes", "1 hour"]:
        now = datetime.now()
        if travel_time == "Now":
            display_time = now.strftime("%H:%M")
            time_info = f"Current time: {display_time}"
        elif travel_time == "In 30 minutes":
            future_time = now + timedelta(minutes=30)
            display_time = future_time.strftime("%H:%M")
            time_info = f"Travel time: {display_time}"
        else:
            future_time = now + timedelta(hours=1)
            display_time = future_time.strftime("%H:%M")
            time_info = f"Travel time: {display_time}"
        
        st.info(f"🕐 {time_info} → Time Category: **{boarding_time}**")
    
    # Prediction button
    if st.button("🔍 Check Crowd Level & Get Recommendations", key='passenger_predict', use_container_width=True):
        with st.spinner("Analyzing crowd patterns..."):
            # Get station data
            src_data = get_station_data(df, src)
            
            prediction, prediction_mode = safe_predict_full(src, boarding_time, weather, selected_hour, system=system)
            if prediction:
                crowd_level = int(prediction.get("crowd_level", 3))
            elif not src_data.empty:
                if 'platform_crowd_level' in src_data.columns:
                    if 'hour_of_day' in src_data.columns:
                        hour_data = src_data[src_data['hour_of_day'] == selected_hour]
                        crowd_level = int(round(hour_data['platform_crowd_level'].mean())) if not hour_data.empty else int(round(src_data['platform_crowd_level'].mean()))
                    else:
                        crowd_level = int(round(src_data['platform_crowd_level'].mean()))
                elif 'Platform Crowd Level at Boarding Station' in src_data.columns:
                    crowd_level = int(round(src_data['Platform Crowd Level at Boarding Station'].mean()))
                else:
                    crowd_level = 3
            else:
                crowd_level = 3
            
            st.markdown("---")
            
            # Display crowd level
            render_crowd_level_display(crowd_level, large=True)
            if prediction_mode == "ml_model":
                st.success("Prediction Source: ML model")
            elif prediction_mode == "heuristic_fallback":
                st.warning("Prediction Source: heuristic fallback (model unavailable)")
            else:
                st.info("Prediction Source: historical data fallback")
            
            # Station statistics
            if not src_data.empty:
                st.markdown("### 📊 Station Statistics")
                stat_cols = st.columns(4)
                
                if 'platform_crowd_level' in src_data.columns:
                    avg_crowd = src_data['platform_crowd_level'].mean()
                    max_crowd = src_data['platform_crowd_level'].max()
                    min_crowd = src_data['platform_crowd_level'].min()
                elif 'Platform Crowd Level at Boarding Station' in src_data.columns:
                    avg_crowd = src_data['Platform Crowd Level at Boarding Station'].mean()
                    max_crowd = src_data['Platform Crowd Level at Boarding Station'].max()
                    min_crowd = src_data['Platform Crowd Level at Boarding Station'].min()
                else:
                    avg_crowd = crowd_level
                    max_crowd = crowd_level
                    min_crowd = crowd_level
                
                stat_cols[0].metric("Historical Avg", f"{avg_crowd:.2f}/5")
                stat_cols[1].metric("Predicted Now", f"{crowd_level}/5")
                stat_cols[2].metric("Peak Level", f"{max_crowd:.0f}/5")
                stat_cols[3].metric("Min Level", f"{min_crowd:.0f}/5")
            
            # Recommendations
            st.markdown("### 💡 Recommendations")
            recommendation = get_crowd_recommendation(crowd_level)
            
            if recommendation["type"] == "critical":
                st.error(f"**{recommendation['title']}**\n{recommendation['message']}")
            elif recommendation["type"] == "warning":
                st.warning(f"**{recommendation['title']}**\n{recommendation['message']}")
            else:
                st.success(f"**{recommendation['title']}**\n{recommendation['message']}")

            # React-format section: Best Recommendation
            st.markdown("### ✅ Best Recommendation")
            rec_eta = "24 min" if crowd_level <= 2 else ("32 min" if crowd_level == 3 else "42 min")
            rec_comfort = "High Comfort" if crowd_level <= 2 else ("Balanced" if crowd_level == 3 else "Crowd Avoidance")
            st.markdown(f"""
            <div class="card">
                <h3 style="margin-bottom:6px;">{src} → {dest}</h3>
                <p style="margin-bottom:10px;">ETA: <strong>{rec_eta}</strong> | Profile: <strong>{rec_comfort}</strong></p>
                <p style="margin:0;">Boarding window: <strong>{boarding_time}</strong> | Weather: <strong>{weather}</strong></p>
            </div>
            """, unsafe_allow_html=True)
            
            # Hourly trends if available
            if not src_data.empty and 'hour_of_day' in src_data.columns:
                st.markdown("### 📈 Hourly Crowd Trends")
                hourly_avg = src_data.groupby('hour_of_day')['platform_crowd_level'].mean()
                
                fig = px.line(
                    x=hourly_avg.index,
                    y=hourly_avg.values,
                    labels={'x': 'Hour of Day', 'y': 'Avg Crowd Level'},
                    title=f'Crowd Trends at {src}'
                )
                fig.add_vline(x=selected_hour, line_dash="dash", line_color="red", annotation_text="Selected hour")
                fig.update_layout(
                    height=350,
                    plot_bgcolor='rgba(0,0,0,0)',
                    paper_bgcolor='rgba(0,0,0,0)',
                    font=dict(color='#E6EEF8')
                )
                st.plotly_chart(fig, use_container_width=True)
                
                # Best times to travel
                st.markdown("#### ⏰ Best Times to Travel (Lowest Crowd)")
                best_hours = hourly_avg.nsmallest(5)
                best_df = pd.DataFrame({
                    'Hour': [f"{h:02d}:00" for h in best_hours.index],
                    'Avg Crowd': best_hours.values.round(2)
                })
                st.dataframe(best_df, use_container_width=True, hide_index=True)
    
    else:
        # Show quick insights before prediction
        st.markdown("### 📊 Quick Station Insights")
        
        src_data = get_station_data(df, src)
        if not src_data.empty:
            quick_cols = st.columns(4)
            
            if 'platform_crowd_level' in src_data.columns:
                avg_crowd = src_data['platform_crowd_level'].mean()
                max_crowd = src_data['platform_crowd_level'].max()
            elif 'Platform Crowd Level at Boarding Station' in src_data.columns:
                avg_crowd = src_data['Platform Crowd Level at Boarding Station'].mean()
                max_crowd = src_data['Platform Crowd Level at Boarding Station'].max()
            else:
                avg_crowd = 3.0
                max_crowd = 5
            
            quick_cols[0].metric("Current Avg", f"{avg_crowd:.1f}/5")
            quick_cols[1].metric("Peak Level", f"{int(max_crowd)}/5")
            
            if 'ridership_count' in src_data.columns:
                quick_cols[2].metric("Avg Ridership", f"{src_data['ridership_count'].mean():,.0f}")
            else:
                quick_cols[2].metric("Records", f"{len(src_data):,}")
            
            quick_cols[3].metric("Data Points", f"{len(src_data):,}")
            
            # Show hourly distribution chart
            if 'hour_of_day' in src_data.columns and 'platform_crowd_level' in src_data.columns:
                st.markdown("### 📈 Crowd by Hour of Day")
                hourly = src_data.groupby('hour_of_day')['platform_crowd_level'].mean()
                
                fig = px.bar(
                    x=hourly.index,
                    y=hourly.values,
                    labels={'x': 'Hour', 'y': 'Avg Crowd Level'},
                    color=hourly.values,
                    color_continuous_scale='RdYlGn_r'
                )
                fig.update_layout(
                    height=300,
                    plot_bgcolor='rgba(0,0,0,0)',
                    paper_bgcolor='rgba(0,0,0,0)',
                    font=dict(color='#E6EEF8')
                )
                st.plotly_chart(fig, use_container_width=True)
        else:
            st.info(f"Select a station and click 'Check Crowd Level' to see predictions.")


if __name__ == "__main__":
    main()
