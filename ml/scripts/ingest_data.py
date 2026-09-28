"""Compatibility CLI: historical ingestion now uses the verified ERA5 downloader."""
from ml.scripts.download_era5 import main


if __name__ == '__main__':
    main()
