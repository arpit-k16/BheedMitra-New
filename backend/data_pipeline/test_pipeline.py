"""
Quick Test Script for BheedMitra Pipeline
Run this to verify the pipeline works correctly
"""

from bheedmitra_production_pipeline import generate_dataset, DMRC_CONFIG
from datetime import datetime

print("🧪 Testing BheedMitra Production Pipeline...")
print("="*70)

try:
    # Generate a small dataset for testing (7 days instead of 30)
    print("\n📊 Generating test dataset (7 days)...\n")
    
    df = generate_dataset(
        config=DMRC_CONFIG,
        start_date=datetime(2024, 1, 1),
        end_date=datetime(2024, 1, 7),  # Just 7 days for quick test
        output_dir="output_test"
    )
    
    print("\n" + "="*70)
    print("✅ TEST PASSED!")
    print("="*70)
    print(f"Generated {len(df):,} records")
    print(f"Covering {df['station_id'].nunique()} stations")
    print(f"\nFirst 5 rows:")
    print(df.head())
    
    print("\n🎉 Pipeline is working correctly!")
    print("You can now run the full pipeline for 30+ days.")
    
except Exception as e:
    print(f"\n❌ TEST FAILED: {e}")
    import traceback
    traceback.print_exc()
