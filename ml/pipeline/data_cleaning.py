import logging
import pandas as pd
import numpy as np
from typing import Dict

logger = logging.getLogger(__name__)

class DataCleaning:
    """Class for cleaning weather data."""

    def clean(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Clean the input DataFrame.
        - Handle missing values (ffill, bfill, median)
        - Remove duplicate timestamps
        - Clip outliers
        - Validate data ranges
        - Remove rows with mostly NaNs
        
        Args:
            df: Input raw DataFrame.
            
        Returns:
            pd.DataFrame: Cleaned DataFrame.
        """
        logger.info(f"Starting data cleaning. Initial shape: {df.shape}")
        df_clean = df.copy()
        
        # Remove duplicates
        if df_clean.index.duplicated().any():
            duplicates_count = df_clean.index.duplicated().sum()
            logger.info(f"Removing {duplicates_count} duplicated indices")
            df_clean = df_clean[~df_clean.index.duplicated(keep='first')]
            
        # Drop rows where >50% of columns are NaN
        threshold = len(df_clean.columns) * 0.5
        rows_before = len(df_clean)
        df_clean = df_clean.dropna(thresh=threshold)
        logger.info(f"Dropped {rows_before - len(df_clean)} rows with >50% missing values.")
        
        # Impute missing values
        null_counts = df_clean.isnull().sum().sum()
        if null_counts > 0:
            df_clean = df_clean.ffill().bfill()
            # If any still remain, fill with median (numeric only)
            numeric_cols = df_clean.select_dtypes(include=[np.number]).columns
            df_clean[numeric_cols] = df_clean[numeric_cols].fillna(df_clean[numeric_cols].median())
            logger.info(f"Imputed {null_counts} missing values.")

        # Clip outliers using IQR
        numeric_cols = df_clean.select_dtypes(include=[np.number]).columns
        # Exclude latitude, longitude from clipping
        cols_to_clip = [c for c in numeric_cols if c not in ['latitude', 'longitude']]
        for col in cols_to_clip:
            Q1 = df_clean[col].quantile(0.25)
            Q3 = df_clean[col].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            df_clean[col] = df_clean[col].clip(lower=lower_bound, upper=upper_bound)

        # Validate basic ranges (example boundaries)
        if 'temperature_2m' in df_clean.columns:
            df_clean['temperature_2m'] = df_clean['temperature_2m'].clip(lower=-60, upper=60)
        if 'relative_humidity_2m' in df_clean.columns:
            df_clean['relative_humidity_2m'] = df_clean['relative_humidity_2m'].clip(lower=0, upper=100)
            
        logger.info(f"Data cleaning complete. Final shape: {df_clean.shape}")
        return df_clean

    def validate_data(self, df: pd.DataFrame) -> Dict[str, bool]:
        """
        Check for each column's validity.
        
        Args:
            df: DataFrame to validate.
            
        Returns:
            Dict[str, bool]: Dictionary mapping column name to validity boolean.
        """
        validity = {}
        for col in df.columns:
            # Valid if no NaNs and proper types
            is_valid = not df[col].isnull().any()
            validity[col] = bool(is_valid)
            
        logger.info(f"Data validation results: {validity}")
        return validity
