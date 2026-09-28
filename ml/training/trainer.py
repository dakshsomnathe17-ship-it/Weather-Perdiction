"""Chronological validation with a gap for future labels, never shuffled folds."""
import numpy as np
import pandas as pd
from sklearn.model_selection import TimeSeriesSplit
from .evaluator import ModelEvaluator


def issue_times(index):
    return index.get_level_values('time') if isinstance(index, pd.MultiIndex) else index


class ModelTrainer:
    def __init__(self, random_state=42, horizon_hours=24):
        self.random_state = random_state
        self.horizon_hours = horizon_hours
        self.evaluator = ModelEvaluator()

    def train(self, model, X, y, validation_split=.2):
        if not 0 < validation_split < 1:
            raise ValueError('validation_split must be between zero and one')
        times = pd.DatetimeIndex(issue_times(X.index))
        unique = times.unique().sort_values()
        cutoff = unique[int(len(unique) * (1 - validation_split))]
        train = times + pd.Timedelta(hours=self.horizon_hours) < cutoff
        test = times >= cutoff
        if not train.any() or not test.any():
            raise ValueError('Not enough chronological data for the forecast horizon')
        model.train(X.loc[train], y.loc[train])
        model.metrics = self.evaluator.evaluate(y.loc[test], model.predict(X.loc[test]))
        return model.metrics

    def cross_validate(self, model, X, y, cv=5):
        times = pd.DatetimeIndex(issue_times(X.index))
        unique = times.unique().sort_values()
        folds = []
        for _, test_indices in TimeSeriesSplit(n_splits=cv).split(unique):
            first, last = unique[test_indices[0]], unique[test_indices[-1]]
            train = times + pd.Timedelta(hours=self.horizon_hours) < first
            test = (times >= first) & (times <= last)
            if not train.any():
                raise ValueError('Not enough data for purged chronological folds')
            model.train(X.loc[train], y.loc[train])
            folds.append(self.evaluator.evaluate(y.loc[test], model.predict(X.loc[test])))
        model.train(X, y)  # Save the final fit, not whichever fold happened to run last.
        model.metrics = {target: {metric: float(np.mean([f[target][metric] for f in folds]))
                                 for metric in folds[0][target]} for target in folds[0]}
        return model.metrics

    def train_all_models(self, X, y, models):
        from ml.models.model_registry import registry
        return {name: self.train(registry.create(name), X, y) for name in models}
