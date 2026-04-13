# 🚀 BheedMitra Production Pipeline - Quick Start Guide

## 📦 What's Included

```
data_pipeline/
├── bheedmitra_production_pipeline.py    # Main pipeline (production-ready)
├── test_pipeline.py                      # Quick test script
├── requirements_pipeline.txt             # Python dependencies
├── DATASET_GENERATOR_README.md           # Full documentation
├── BheedMitra_Dataset_Generator.ipynb    # Google Colab notebook
└── output/                               # Generated datasets & plots
```

## ⚡ Quick Start (3 Steps)

### Step 1: Install Dependencies

```bash
pip install -r requirements_pipeline.txt
```

### Step 2: Run Test (Optional but Recommended)

```bash
python test_pipeline.py
```

This generates a small 7-day dataset to verify everything works.

### Step 3: Generate Full Dataset

```bash
python bheedmitra_production_pipeline.py
```

This generates a full 30-day dataset with 144,000+ records.

## 📊 What You Get

After running, check the `output/` folder:

```
output/
├── delhi_metro_dataset.csv           # 144,000+ rows, ML-ready
├── ridership_analysis.png            # Hourly patterns + distribution
├── ridership_heatmap.png             # Top 20 stations × 24 hours
└── weather_impact.png                # Temperature/rainfall analysis
```

## 🔧 Customization

### Change Date Range

Edit `bheedmitra_production_pipeline.py` (line ~1450):

```python
dmrc_df = generate_dataset(
    config=DMRC_CONFIG,
    start_date=datetime(2024, 1, 1),
    end_date=datetime(2024, 12, 31),  # Full year!
    output_dir="output"
)
```

### Adjust Simulation Parameters

Edit the config (line ~90):

```python
DMRC_CONFIG = CityConfig(
    # ...
    base_ridership_range=(200, 800),    # Adjust traffic levels
    peak_multiplier=2.8,                # Adjust peak intensity
    weekend_multiplier=0.65             # Adjust weekend traffic
)
```

## 📓 Google Colab

1. Upload `bheedmitra_production_pipeline.py` to Colab
2. Open `BheedMitra_Dataset_Generator.ipynb`
3. Run all cells
4. Download generated files

## 🎯 Use Cases

### Machine Learning
```python
from sklearn.ensemble import RandomForestClassifier

X = df[['hour_of_day', 'train_frequency', 'temperature']]
y = df['crowd_level']

model = RandomForestClassifier()
model.fit(X, y)
```

### Time Series Forecasting
```python
from prophet import Prophet

prophet_df = df[['timestamp', 'ridership_count']].rename(
    columns={'timestamp': 'ds', 'ridership_count': 'y'}
)
model = Prophet()
model.fit(prophet_df)
```

### Anomaly Detection
```python
from sklearn.ensemble import IsolationForest

iso = IsolationForest(contamination=0.1)
anomalies = iso.fit_predict(df[['ridership_count', 'station_congestion_index']])
```

## 📝 Dataset Schema

| Column | Type | Description |
|--------|------|-------------|
| `station_id` | str | Unique station identifier |
| `station_name` | str | Human-readable station name |
| `route_id` | str | Metro line (RED, YELLOW, BLUE, etc.) |
| `timestamp` | datetime | Hourly timestamp |
| `hour_of_day` | int | 0-23 |
| `day_of_week` | int | 0=Monday, 6=Sunday |
| `is_weekend` | int | 0 or 1 |
| `ridership_count` | int | Number of passengers/hour |
| `train_frequency` | int | Trains per hour |
| `temperature` | float | Temperature in °C |
| `rainfall` | float | Rainfall in mm |
| `event_flag` | int | Special event indicator |
| `rolling_demand_3h` | int | 3-hour rolling sum |
| `is_peak_hour` | int | Peak hour flag |
| `ridership_per_train` | float | Avg passengers per train |
| `station_congestion_index` | float | Normalized 0-1 |
| `crowd_level` | str | low / medium / high |

## ✅ Data Quality

Built-in validation checks:
- ✓ No null values in critical columns
- ✓ Positive ridership counts
- ✓ Congestion index in [0, 1]
- ✓ Continuous hourly timestamps
- ✓ Minimum 10,000 rows
- ✓ Realistic distributions

## 🐛 Troubleshooting

### "ModuleNotFoundError: No module named 'X'"
```bash
pip install -r requirements_pipeline.txt
```

### "Weather API timeout"
Don't worry! Pipeline automatically falls back to synthetic weather:
```
⚠️  Weather API failed: timeout. Using synthetic weather data.
✅ Generated 744 synthetic weather records
```

### Memory issues with large datasets
Reduce the date range:
```python
end_date=datetime(2024, 1, 7)  # Just 1 week
```

## 📞 Support

- 📖 Full Docs: `DATASET_GENERATOR_README.md`
- 🐛 Issues: GitHub Issues
- 💬 Questions: GitHub Discussions

## 🎉 You're Ready!

```bash
python bheedmitra_production_pipeline.py
```

Then check `output/delhi_metro_dataset.csv` 🚀

---

**Made with ❤️ by BheedMitra Team**
