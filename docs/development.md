# Development Guide

## Prerequisites
- Python 3.12
- Node.js 22+
- Docker (optional, but recommended for DB/Redis)

## Local Setup
1. **Clone**: `git clone <repo_url> && cd weather-ai`
2. **Setup**: Run `bash scripts/setup.sh`
3. **Environment**: Ensure `.env` is populated correctly.
4. **Run**: `bash scripts/dev.sh` starts both backend (port 8000) and frontend (port 5173).

## Project Structure
- `/backend`: FastAPI app.
  - `/api`: Route handlers.
  - `/services`: Business logic (Weather, Chat, ML inference).
  - `/models`: Database ORM models.
  - `/schemas`: Pydantic models for validation.
- `/frontend`: React app.
  - `/src/components`: UI components.
  - `/src/hooks`: Custom React hooks.
  - `/src/services`: API client calls.

## Code Style Guide
- **Python**: Follow PEP 8. We use `black` for formatting and `flake8` for linting.
  ```bash
  black backend/
  flake8 backend/
  ```
- **TypeScript**: We use `eslint` and `prettier`.
  ```bash
  cd frontend && npm run lint
  ```

## Testing
We use `pytest` for backend testing.
```bash
# Run all tests
pytest tests/

# Run with coverage
pytest tests/ --cov=backend
```

## Git Workflow
- `main` branch is for production releases.
- `develop` branch is for active development.
- Create feature branches from `develop`: `feature/add-new-provider`
- Submit a Pull Request for code review before merging.

## Adding New Weather Providers
1. Create a new service class inheriting from a base `WeatherProvider` interface.
2. Implement `get_current()` and `get_forecast()`.
3. Add the provider to the factory pattern in `weather_service.py`.

## Adding New ML Models
1. Add training script to a separate `ml_pipeline` repository or directory.
2. Train and export model using `joblib`.
3. Place model in `ml_models/`.
4. Update `inference.py` to load and serve the new model.
