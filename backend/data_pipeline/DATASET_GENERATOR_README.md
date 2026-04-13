# BheedMitra Production Dataset Generator

## 🎯 Overview

A **production-quality** dataset generation pipeline for metro transit systems that creates realistic, station-wise hourly time series data for:

- 🚇 **Crowd Prediction**
- 🚦 **Congestion Analysis**  
- 🔍 **Anomaly Detection**

## ✨ Features

### Data Sources
- **GTFS Integration**: Parse stops, routes, and train schedules
- **Weather API**: Real historical weather data (Open-Meteo)
- **Realistic Simulation**: Physics-based ridership modeling
- **Multi-city Support**: DMRC (Delhi) & MTA (New York)

### Dataset Schema
```
station_id, station_name, route_id, timestamp, hour_of_day, day_of_week,
is_weekend, ridership_count, train_frequency, temperature, rainfall,
event_flag, rolling_demand_3h, is_peak_hour, ridership_per_train,
station_congestion_index, crowd_level
```

### Engineering Features
- **Rolling Demand**: 3-hour rolling sum
- **Congestion Index**: Normalized 0-1 metric
- **Crowd Level**: Categorical (low/medium/high)
- **Peak Detection**: Boolean flag
- **Per-train Metrics**: Ridership/train ratio

## 🚀 Quick Start

### Installation

```bash
pip install pandas numpy requests matplotlib seaborn
```

### Basic Usage

```python
from bheedmitra_production_pipeline import generate_dataset, DMRC_CONFIG
from datetime import datetime

# Generate DMRC dataset
df = generate_dataset(
    config=DMRC_CONFIG,
    start_date=datetime(2024, 1, 1),
    end_date=datetime(2024, 1, 31),
    output_dir="output"
)
```

### Run Complete Pipeline

```bash
python bheedmitra_production_pipeline.py
```

## 📊 Output Files

After running, you'll get:

```
output/
├── delhi_metro_dataset.csv          # Main dataset (10,000+ rows)
├── ridership_analysis.png            # Hourly patterns & distribution
├── ridership_heatmap.png             # Station x Hour heatmap
└── weather_impact.png                # Temperature/rain analysis
```

## 🏗️ Architecture

### Modular Pipeline

```
1. download_gtfs()         → Fetch GTFS data
2. parse_stations()        → Extract station metadata
3. compute_train_frequency() → Calculate hourly trains
4. fetch_weather_data()    → Get temperature/rainfall
5. simulate_ridership()    → Realistic crowd modeling
6. feature_engineering()   → Derive ML features
7. validate_dataset()      → Quality checks
8. generate_eda_plots()    → Visualizations
```

### Config-Driven Design

```python
@dataclass
class CityConfig:
    city_name: str
    latitude: float
    longitude: float
    gtfs_url: Optional[str]
    major_stations: List[str]
    routes: Dict[str, str]
    # ... simulation parameters
```

## 🧮 Simulation Logic

### Realistic Ridership Modeling

```
ridership = base_ridership 
          × peak_multiplier      (2.5-3.0x for rush hours)
          × weekend_multiplier   (0.65-0.75x on weekends)
          × weather_impact       (0.7-1.0x based on rain)
          × frequency_factor     (more trains = more riders)
          × noise                (15% gaussian noise)
```

### Peak Hours
- **Morning**: 8-10 AM (2.8x multiplier)
- **Evening**: 5-8 PM (2.8x multiplier)
- **Off-peak**: 10-17 (1.0x)
- **Night**: 21-24 (0.6x)

### Station Importance
- **Major Stations**: Rajiv Chowk, Kashmere Gate, etc. → Higher base ridership
- **Regular Stations**: 50% of major station traffic

## 📈 Dataset Statistics

| Metric | Value |
|--------|-------|
| Total Records | 10,000+ |
| Stations | 200+ (DMRC) |
| Date Range | 30 days (configurable) |
| Granularity | Hourly |
| Avg Ridership/Hour | 300-500 |
| Peak Ridership | 2,000+ |
| High Congestion % | ~15-20% |

## ✅ Data Validation

Automatic checks for:
- ✓ No null values in critical columns
- ✓ Positive ridership counts
- ✓ Congestion index in [0, 1]
- ✓ Continuous timestamps (no gaps)
- ✓ Minimum 10,000 rows
- ✓ Realistic value distributions

## 🎨 Visualizations

### 1. Ridership Analysis
- Hourly ridership pattern with confidence bands
- Congestion level distribution

### 2. Station Heatmap
- Top 20 stations × 24 hours
- Color-coded by ridership intensity

### 3. Weather Impact
- Temperature bins vs ridership
- Rain vs no-rain comparison

## 🌍 Multi-City Support

### DMRC (Delhi Metro)
- 200+ stations across 8 lines
- Red, Yellow, Blue, Green, Violet, Pink, Magenta, Grey
- Realistic Indian weather patterns

### MTA (New York)
- GTFS-based (real data)
- Multiple subway lines
- US weather patterns

### Add Your City

```python
MY_CITY_CONFIG = CityConfig(
    city_name="Mumbai",
    latitude=19.0760,
    longitude=72.8777,
    gtfs_url="https://...",
    major_stations=["CST", "Churchgate", ...],
    routes={"1": "Line 1", ...}
)

df = generate_dataset(config=MY_CITY_CONFIG)
```

## 🔬 Use Cases

### Machine Learning
```python
# Ready for scikit-learn
X = df[['hour_of_day', 'day_of_week', 'temperature', 
        'train_frequency', 'rolling_demand_3h']]
y = df['crowd_level']

from sklearn.ensemble import RandomForestClassifier
model = RandomForestClassifier()
model.fit(X, y)
```

### Time Series Analysis
```python
# Prophet forecasting
from prophet import Prophet

prophet_df = df[['timestamp', 'ridership_count']].rename(
    columns={'timestamp': 'ds', 'ridership_count': 'y'}
)
model = Prophet()
model.fit(prophet_df)
```

### Anomaly Detection
```python
# Isolation Forest
from sklearn.ensemble import IsolationForest

iso = IsolationForest(contamination=0.1)
df['anomaly'] = iso.fit_predict(
    df[['ridership_count', 'station_congestion_index']]
)
```

## 📝 Sample Output

```csv
station_id,station_name,route_id,timestamp,hour_of_day,day_of_week,is_weekend,ridership_count,train_frequency,temperature,rainfall,event_flag,rolling_demand_3h,is_peak_hour,ridership_per_train,station_congestion_index,crowd_level
Y16,Rajiv Chowk,YELLOW,2024-01-01 08:00:00,8,0,0,1450,18,14.5,0.0,0,3800,1,80.6,0.81,high
Y16,Rajiv Chowk,YELLOW,2024-01-01 09:00:00,9,0,0,1620,20,15.2,0.0,0,4320,1,81.0,0.84,high
Y16,Rajiv Chowk,YELLOW,2024-01-01 10:00:00,10,0,0,1250,18,16.8,0.0,0,4320,1,69.4,0.72,high
```

## 🔧 Configuration Options

### Date Range
```python
generate_dataset(
    config=DMRC_CONFIG,
    start_date=datetime(2024, 1, 1),
    end_date=datetime(2024, 12, 31),  # Full year
    output_dir="output"
)
```

### Simulation Parameters
```python
DMRC_CONFIG.base_ridership_range = (300, 1000)  # Increase traffic
DMRC_CONFIG.peak_multiplier = 3.5              # Higher peaks
DMRC_CONFIG.weekend_multiplier = 0.5           # Quieter weekends
```

## 🐛 Troubleshooting

### Weather API Fails
Pipeline automatically falls back to synthetic weather:
```
⚠️  Weather API failed: timeout. Using synthetic weather data.
✅ Generated 744 synthetic weather records
```

### No GTFS Data
For cities without GTFS (like DMRC), synthetic stations are generated:
```
⚠️  No GTFS URL for Delhi. Will use synthetic station data.
✅ Loaded 200 stations
```

## 📚 Dependencies

```
pandas>=1.5.0
numpy>=1.23.0
requests>=2.28.0
matplotlib>=3.6.0
seaborn>=0.12.0
```

## 🤝 Contributing

Want to add a new city? Follow these steps:

1. Create a `CityConfig` with your city's parameters
2. Add station list or provide GTFS URL
3. Adjust simulation parameters for local patterns
4. Test with `generate_dataset()`
5. Submit PR!

## 📄 License

MIT License - Feel free to use in your projects!

## 🙏 Acknowledgments

- **GTFS**: General Transit Feed Specification
- **Open-Meteo**: Free weather API
- **DMRC**: Delhi Metro Rail Corporation
- **MTA**: Metropolitan Transportation Authority (NYC)

## 📬 Support

For issues or questions:
- 📧 Email: bheedmitra@example.com
- 🐛 Issues: GitHub Issues
- 💬 Discussions: GitHub Discussions

---

**Made with ❤️ by the BheedMitra Team**

*Empowering smart transit with production-quality data*
