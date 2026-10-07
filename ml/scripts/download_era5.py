import argparse
import logging
from ml.pipeline.era5 import CITY_GROUPS, LOCATIONS, download


def resolve_cities(value):
    if value in ('india', 'all'):
        return list(LOCATIONS)
    if value in CITY_GROUPS:
        return list(CITY_GROUPS[value])
    return list(dict.fromkeys(city.strip() for city in value.split(',') if city.strip()))


def main():
    parser = argparse.ArgumentParser(description='Download ERA5 point series via Open-Meteo (explicit models=era5).')
    parser.add_argument('--cities', default='Pune,Mumbai', help=f'Comma-separated names, india8, india16, or india/all ({len(LOCATIONS)} configured cities)')
    parser.add_argument('--start-date', default='2015-01-01')
    parser.add_argument('--end-date', default='2025-12-31')
    parser.add_argument('--output-dir', default='ml/data/era5')
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format='%(asctime)s %(message)s')
    cities = resolve_cities(args.cities)
    result = download(args.output_dir, cities, args.start_date, args.end_date)
    print(f"Saved {result['rows']:,} hourly rows; manifest in {args.output_dir}")


if __name__ == '__main__':
    main()
