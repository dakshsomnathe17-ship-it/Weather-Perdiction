import argparse
import logging
import os
from datetime import datetime, timedelta
from ml.pipeline.data_ingestion import DataIngestion, DEFAULT_CITIES

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    parser = argparse.ArgumentParser(description="Ingest historical weather data.")
    parser.add_argument("--cities", type=str, help="Comma-separated list of city names to fetch (default: all)", default="all")
    
    # Default to last 2 years
    end = datetime.now()
    start = end - timedelta(days=2*365)
    
    parser.add_argument("--start-date", type=str, default=start.strftime('%Y-%m-%d'), help="Start date (YYYY-MM-DD)")
    parser.add_argument("--end-date", type=str, default=end.strftime('%Y-%m-%d'), help="End date (YYYY-MM-DD)")
    parser.add_argument("--output-dir", type=str, default="./data", help="Output directory")
    
    args = parser.parse_args()
    
    cities_to_fetch = DEFAULT_CITIES
    if args.cities != "all":
        city_names = [c.strip() for c in args.cities.split(",")]
        cities_to_fetch = [c for c in DEFAULT_CITIES if c['name'] in city_names]
        if not cities_to_fetch:
            logger.error("No valid cities found matching provided names.")
            return

    ingestion = DataIngestion()
    df = ingestion.fetch_multiple_cities(cities_to_fetch, args.start_date, args.end_date)
    
    if not df.empty:
        output_file = os.path.join(args.output_dir, "historical_weather.csv")
        ingestion.save_dataset(df, output_file)
    else:
        logger.error("No data fetched.")

if __name__ == "__main__":
    main()
