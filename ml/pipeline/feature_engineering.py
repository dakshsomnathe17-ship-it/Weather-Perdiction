import pandas as pd
import numpy as np
import logging
from typing import List

logger = logging.getLogger(__name__)

class FeatureEngineering:
    """Class for engineering features for weather prediction."""
    
    def __init__(self):
        self.engineered_features = []
        
    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Generate time, cyclical, lag, rolling, rate of change, and interaction features.
        
        Args:
            df: Input cleaned DataFrame with DatetimeIndex.
            
        Returns:
            pd.DataFrame: DataFrame with engineered features.
        """
        logger.info("Starting feature engineering.")
        df_feat = df.copy()
        
        # Time features
        df_feat['hour'] = df_feat.index.hour
        df_feat['day_of_week'] = df_feat.index.dayofweek
        df_feat['month'] = df_feat.index.month
        df_feat['day_of_year'] = df_feat.index.dayofyear
        
        # Cyclical encoding
        df_feat['hour_sin'] = np.sin(2 * np.pi * df_feat['hour'] / 24)
        df_feat['hour_cos'] = np.cos(2 * np.pi * df_feat['hour'] / 24)
        df_feat['day_of_week_sin'] = np.sin(2 * np.pi * df_feat['day_of_week'] / 7)
        df_feat['day_of_week_cos'] = np.cos(2 * np.pi * df_feat['day_of_week'] / 7)
        df_feat['month_sin'] = np.sin(2 * np.pi * df_feat['month'] / 12)
        df_feat['month_cos'] = np.cos(2 * np.pi * df_feat['month'] / 12)
        df_feat['day_of_year_sin'] = np.sin(2 * np.pi * df_feat['day_of_year'] / 365.25)
        df_feat['day_of_year_cos'] = np.cos(2 * np.pi * df_feat['day_of_year'] / 365.25)
        
        # Lag and Rolling features
        lag_vars = ['temperature_2m', 'relative_humidity_2m', 'pressure_msl', 'wind_speed_10m']
        lags = [1, 3, 6, 12, 24]
        
        # Sort by city (if exists) and time to ensure proper lag calculations
        if 'city' in df_feat.columns:
            groupby_col = 'city'
            groups = df_feat.groupby(groupby_col)
        else:
            groupby_col = None
            groups = [('all', df_feat)]
            
        engineered_dfs = []
        for name, group in groups if groupby_col else [(None, df_feat)]:
            g = group.copy()
            for var in lag_vars:
                if var not in g.columns:
                    continue
                # Lag features
                for lag in lags:
                    g[f'{var}_lag_{lag}h'] = g[var].shift(lag)
                # Rolling features
                for window in [3, 6, 12, 24]:
                    g[f'{var}_rolling_{window}h_mean'] = g[var].rolling(window=window, min_periods=1).mean()
                    
            # Rate of change
            if 'temperature_2m' in g.columns:
                g['temperature_change_1h'] = g['temperature_2m'] - g['temperature_2m'].shift(1)
            if 'pressure_msl' in g.columns:
                g['pressure_change_3h'] = g['pressure_msl'] - g['pressure_msl'].shift(3)
                
            engineered_dfs.append(g)
            
        df_feat = pd.concat(engineered_dfs)
        
        # Interaction features
        if 'temperature_2m' in df_feat.columns and 'wind_speed_10m' in df_feat.columns:
            df_feat['wind_chill'] = df_feat['temperature_2m'] * df_feat['wind_speed_10m']
            
        if 'relative_humidity_2m' in df_feat.columns and 'pressure_msl' in df_feat.columns:
            # Adding epsilon to avoid division by zero
            df_feat['humidity_pressure_ratio'] = df_feat['relative_humidity_2m'] / (df_feat['pressure_msl'] + 1e-6)
            
        # Drop rows with NaN resulting from shifts
        rows_before = len(df_feat)
        df_feat.dropna(inplace=True)
        logger.info(f"Dropped {rows_before - len(df_feat)} rows due to NaNs from lag features.")
        
        self.engineered_features = list(df_feat.columns)
        logger.info("Feature engineering complete.")
        return df_feat
        
    def get_feature_names(self) -> List[str]:
        """
        Get the list of engineered feature names.
        
        Returns:
            List[str]: List of column names.
        """
        return self.engineered_features
