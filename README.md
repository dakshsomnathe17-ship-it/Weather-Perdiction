# 🌍 WeatherAI - Intelligent Weather Prediction Platform

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.12-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

A weather workspace for current conditions, daily forecasts, an interactive Earth and historical weather-model research.

## ✨ Features
- 🌦️ **Local Weather**: Search for a place and view Open-Meteo conditions, a selectable seven-day forecast and precipitation insights.
- 🤖 **Model Lab**: Recorded Random Forest, XGBoost and LightGBM evaluation results for eight Indian cities. These historical ERA5 models are not connected to live forecasting.
- 📱 **Responsive Interface**: Weather-first mobile layout, bottom navigation, saved unit preferences and clear loading/retry states.
- 🗺️ **Interactive Earth**: Cesium globe with street detail, location picking, distance measurement and Canvas fallback.
- ⚡ **High Performance**: Built with FastAPI and React/TypeScript.

## 📸 Screenshots
![Weather overview with test weather fixtures](docs/screenshots/weather-overview.png)

[Mobile forecast](docs/screenshots/weather-forecast-mobile.png) · [Model lab](docs/screenshots/weather-model-lab.png)

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React, TypeScript, Vite, CesiumJS, Canvas fallback, Tailwind CSS |
| **Backend** | FastAPI, Python 3.12, SQLAlchemy, Pydantic |
| **ML & Data**| Scikit-learn, XGBoost, LightGBM, Pandas |
| **Infra**    | Docker, Docker Compose, PostgreSQL, Redis, Nginx |

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- Node.js 22+
- Docker & Docker Compose (optional for local deployment)

### Local Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/dakshsomnathe17-ship-it/Weather-Perdiction.git
   cd Weather-Perdiction
   ```

2. Run the setup script:
   ```bash
   bash scripts/setup.sh
   ```

3. Natural Earth imagery is bundled with attribution. To optionally regenerate the Canvas image from Cesium's local tiles:
   ```bash
   bash scripts/download_textures.sh
   ```

4. Start development servers:
   ```bash
   bash scripts/dev.sh
   ```

For frontend-only setup, Windows-friendly commands, globe controls and tests, see
[Interactive Earth](docs/interactive-earth.md). From `frontend`, run `npm ci` then
`npm run dev`. Natural Earth needs no API key. Optional Esri imagery and labels use your ArcGIS token in `frontend/.env.local` (see `frontend/.env.example`). Weather and submitted Nominatim place searches require the backend;
global weather overlays display “Awaiting data” while the existing map API returns no points.

See [Weather interface](docs/weather-ui.md) for the redesigned screens, Windows run commands,
UI verification and the model evaluation snapshot's provenance.

## 🐳 Docker Deployment
To deploy using Docker Compose:
```bash
cp .env.example .env
docker-compose up -d --build
```
This will start the frontend, backend, PostgreSQL database, and Redis cache.

## 📁 Project Structure
```
weather-ai/
├── backend/       # FastAPI application
├── frontend/      # React/Vite application
├── ml_models/     # Serialized machine learning models
├── docker/        # Dockerfiles and configurations
├── scripts/       # Automation scripts
├── docs/          # Project documentation
└── tests/         # Unit and integration tests
```

## 🔌 API Endpoints (Quick Reference)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/weather/current` | Get current weather for a location |
| GET | `/api/weather/forecast` | Get 7-day forecast |
| POST | `/api/chat` | Send a natural language query |
| GET | `/api/ml/predict` | Get ML-enhanced prediction |

See [API Docs](docs/api.md) for details.

## 🔑 Environment Variables
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL or SQLite connection string |
| `REDIS_URL` | Redis cache connection string |
| `OPEN_METEO_BASE_URL` | Base URL for weather provider |
| `LLM_API_KEY` | Key for Chat functionality (if using external LLM) |

## 🧠 ML Models
Model lab displays the completed eight-city, 24-hour ERA5 experiment: 771,456 hourly records spanning 2015–2025, with 2025 evaluation scores and verified historical examples. LightGBM was selected on validation temperature RMSE. The live weather screens use Open-Meteo; there is no live ML inference in this interface. See [snapshot provenance](docs/weather-ui.md#research-snapshot-provenance) and the linked training model card for the full method and limitations.

## 🤝 Contributing
Please read [Development Guide](docs/development.md) for details on our code of conduct, and the process for submitting pull requests.

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
