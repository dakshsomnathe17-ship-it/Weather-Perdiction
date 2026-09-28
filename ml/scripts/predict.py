import argparse
import json
from pathlib import Path
import pandas as pd
from ml.prediction.predictor import WeatherPredictor


def main():
    parser = argparse.ArgumentParser(description='Predict from a supplied observation history; this does not fetch live weather.')
    parser.add_argument('--model-dir', default='ml/saved_models/era5_24h')
    parser.add_argument('--history', default='ml/data/era5/historical_weather.csv')
    parser.add_argument('--city', default='Pune')
    parser.add_argument('--at', help='UTC issue timestamp; defaults to latest supplied hour')
    args = parser.parse_args()
    report = json.loads((Path(args.model_dir) / 'report.json').read_text(encoding='utf-8'))
    raw = pd.read_csv(args.history)
    raw['time'] = pd.to_datetime(raw['time'], utc=True)
    raw = raw.set_index('time')
    if args.at:
        issue = pd.to_datetime(args.at, utc=True)
        if not ((raw.index == issue) & (raw['city'] == args.city)).any():
            parser.error('Requested issue hour is absent from this city history')
        raw = raw.loc[raw.index <= issue]
    print(json.dumps(WeatherPredictor(args.model_dir).predict_history(report['selected_model'], raw, args.city), indent=2))


if __name__ == '__main__':
    main()
