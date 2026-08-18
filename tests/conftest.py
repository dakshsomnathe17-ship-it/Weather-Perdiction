import pytest

@pytest.fixture
def sample_weather_data():
    """Fixture providing sample weather payload."""
    return {
        "temperature": 22.5,
        "humidity": 45,
        "wind_speed": 10.2
    }

@pytest.fixture
def mock_provider():
    """Fixture for mocking external weather APIs."""
    class MockProvider:
        def get_current(self, lat, lon):
            return {"temp": 20}
    return MockProvider()

@pytest.fixture
def test_database():
    """Fixture for setting up an in-memory SQLite DB for tests."""
    pass

@pytest.fixture
def sample_ml_features():
    """Fixture providing a small synthetic dataset for ML tests."""
    import pandas as pd
    import numpy as np
    
    return pd.DataFrame({
        "temperature": np.random.normal(20, 5, 100),
        "humidity": np.random.normal(50, 10, 100),
        "pressure": np.random.normal(1013, 10, 100)
    })

@pytest.fixture
def test_client():
    """Fixture providing a FastAPI TestClient."""
    from fastapi.testclient import TestClient
    # This assumes we have an app
    # from app.main import app
    # return TestClient(app)
    return None
