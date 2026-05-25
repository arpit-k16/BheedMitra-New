# BheedMitra  
## AI-Driven Smart Transit Intelligence and Crowd Management System

BheedMitra is a data-driven crowd prediction and decision-support system for urban metro networks. It helps passengers plan better journeys and supports metro authorities in monitoring congestion through analytics, dashboards, and crowd-level prediction.

---

## 🚇 Project Overview

Urban metro systems face unpredictable crowd congestion, especially during peak hours. BheedMitra addresses this problem by analyzing station-wise ridership patterns, weather conditions, train frequency, and time-based trends to predict crowd levels.

The current prototype is demonstrated using a DMRC-style metro network scenario, while a generalized multi-city version is under development.

---

## ✨ Key Features

### Passenger Panel
- Source and destination selection
- Crowd level insights
- Route planning support
- Travel-time suggestions

### Admin Panel
- Congestion monitoring dashboard
- Live alerts
- Transit map view
- Reports and analytics
- Decision-support insights

---

## 📊 Dataset

BheedMitra uses a hybrid dataset approach:

- **MTA:** Official hourly ridership data from government sources
- **DMRC:** Realistic simulated station-wise time-series dataset
- **GTFS:** Transit structure and train frequency data
- **Weather:** Temperature and rainfall data using Open-Meteo API

Each dataset row represents:

```text
One station + One hour
```

Important features include:

- station_id
- station_name
- timestamp
- ridership_count
- train_frequency
- temperature
- rainfall
- rolling_demand_3h
- congestion_index
- crowd_level

---

## 🧠 Analytics & ML

The system uses feature engineering and machine learning to analyze and predict crowd levels.

Engineered features include:

- Peak hour flag
- Weekend indicator
- Rolling demand
- Ridership per train
- Congestion index
- Crowd level classification

Crowd levels are classified as:

- Low
- Medium
- High

---

## 🛠️ Tech Stack

- **Frontend:** React
- **Dashboards:** Streamlit
- **Backend/Data Processing:** Python
- **Libraries:** Pandas, NumPy, Scikit-learn, Matplotlib
- **Data Sources:** MTA Open Data, GTFS, Open-Meteo API

---

## 🏗️ System Architecture

```text
React Frontend
      ↓
Streamlit Dashboards
      ↓
ML Prediction Engine
      ↓
Hybrid Dataset Pipeline
      ↓
MTA + DMRC + GTFS + Weather
```

---

## 📁 Project Structure

```text
BheedMitra/
│
├── frontend/
│   └── React landing and login pages
│
├── dashboard/
│   └── Streamlit passenger and admin panels
│
├── data/
│   ├── raw/
│   └── processed/
│
├── models/
│   └── trained ML models
│
├── notebooks/
│   └── EDA and experimentation
│
├── scripts/
│   └── dataset generation and preprocessing
│
└── README.md
```

---

## 🚀 How to Run

### 1. Clone the repository

```bash
git clone https://github.com/your-username/bheedmitra.git
cd bheedmitra
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Run Streamlit dashboard

```bash
streamlit run app.py
```

### 4. Run React frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 📈 Use Cases

- Passenger journey planning
- Station-wise crowd monitoring
- Congestion alert generation
- Transit authority decision support
- Urban mobility analytics

---

## 🔮 Future Scope

- Real-time data integration
- Multi-city metro support
- AI-based route recommendations
- WhatsApp chatbot / IVR integration
- Advanced forecasting models
- Deployment-ready API layer

---


## 📌 Status

Current version: Prototype  
DMRC system implemented  
Multi-city version under development

---

## 📄 License

This project is developed for academic and demonstration purposes.
