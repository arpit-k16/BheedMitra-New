"""
BheedMitra - Time Series Data Aggregation Script
Combines all 286 station CSV files into a single unified dataset
"""

import os
import glob
import pandas as pd
from datetime import datetime

# =============================================================================
# CONFIGURATION
# =============================================================================

INPUT_DIR = "dataset_new/DMRC"
OUTPUT_FILE = "dmrc_timeseries_combined.csv"
OUTPUT_SUMMARY_FILE = "dmrc_stations_summary.csv"

# =============================================================================
# AGGREGATION FUNCTION
# =============================================================================

def aggregate_dmrc_timeseries(input_dir: str = INPUT_DIR, 
                               output_file: str = OUTPUT_FILE,
                               output_summary: str = OUTPUT_SUMMARY_FILE) -> pd.DataFrame:
    """
    Combine all individual station CSVs into a single time-series dataset
    
    Args:
        input_dir: Directory containing station CSV files
        output_file: Path for combined output CSV
        output_summary: Path for station summary CSV
    
    Returns:
        Combined DataFrame
    """
    print("=" * 60)
    print("BheedMitra - Time Series Data Aggregation")
    print("=" * 60)
    
    # Find all CSV files
    pattern = os.path.join(input_dir, "*.csv")
    files = sorted(glob.glob(pattern))
    
    print(f"\nFound {len(files)} station CSV files")
    
    if not files:
        print(f"ERROR: No CSV files found in {input_dir}")
        return pd.DataFrame()
    
    # Load and combine all files
    dfs = []
    station_info = []
    
    for i, filepath in enumerate(files):
        filename = os.path.basename(filepath)
        
        try:
            df = pd.read_csv(filepath)
            
            # Extract station info
            if len(df) > 0:
                station_id = df['station_id'].iloc[0]
                station_name = df['station_name'].iloc[0]
                route_id = df['route_id'].iloc[0]
                
                station_info.append({
                    'station_id': station_id,
                    'station_name': station_name,
                    'route_id': route_id,
                    'filename': filename,
                    'record_count': len(df)
                })
            
            dfs.append(df)
            
            if (i + 1) % 50 == 0:
                print(f"  Processed {i + 1}/{len(files)} files...")
                
        except Exception as e:
            print(f"  Error loading {filename}: {e}")
    
    print(f"\nCombining {len(dfs)} DataFrames...")
    
    # Combine all DataFrames
    combined = pd.concat(dfs, ignore_index=True)
    
    # Convert timestamp to datetime
    combined['timestamp'] = pd.to_datetime(combined['timestamp'])
    
    # Sort by timestamp and station
    combined = combined.sort_values(['timestamp', 'station_id']).reset_index(drop=True)
    
    # Save combined dataset
    print(f"\nSaving combined dataset to {output_file}...")
    combined.to_csv(output_file, index=False)
    
    # Create and save station summary
    summary_df = pd.DataFrame(station_info)
    summary_df = summary_df.sort_values('station_id').reset_index(drop=True)
    summary_df.to_csv(output_summary, index=False)
    
    # Print statistics
    print("\n" + "=" * 60)
    print("AGGREGATION COMPLETE")
    print("=" * 60)
    print(f"Total records: {len(combined):,}")
    print(f"Unique stations: {combined['station_id'].nunique()}")
    print(f"Date range: {combined['timestamp'].min()} to {combined['timestamp'].max()}")
    print(f"Columns: {list(combined.columns)}")
    print(f"\nOutput files:")
    print(f"  - {output_file} ({os.path.getsize(output_file) / 1024 / 1024:.1f} MB)")
    print(f"  - {output_summary}")
    
    return combined


def get_station_list(summary_file: str = OUTPUT_SUMMARY_FILE) -> list:
    """
    Get list of all station names from summary file
    
    Args:
        summary_file: Path to station summary CSV
    
    Returns:
        List of station names
    """
    if os.path.exists(summary_file):
        df = pd.read_csv(summary_file)
        return df['station_name'].tolist()
    return []


def load_station_data(station_id: str, input_dir: str = INPUT_DIR) -> pd.DataFrame:
    """
    Load data for a single station
    
    Args:
        station_id: Station ID (e.g., 'YL01')
        input_dir: Directory containing station CSV files
    
    Returns:
        DataFrame with station data
    """
    pattern = os.path.join(input_dir, f"{station_id}_*.csv")
    files = glob.glob(pattern)
    
    if files:
        return pd.read_csv(files[0])
    return pd.DataFrame()


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    # Run aggregation
    combined_df = aggregate_dmrc_timeseries()
    
    if len(combined_df) > 0:
        print("\n" + "-" * 40)
        print("Sample data (first 5 rows):")
        print(combined_df.head().to_string())
        
        print("\n" + "-" * 40)
        print("Crowd level distribution:")
        print(combined_df['platform_crowd_level'].value_counts().sort_index())
        
        print("\n" + "-" * 40)
        print("Records by route:")
        print(combined_df['route_id'].value_counts())
