# 🌍 WeatherAI - Intelligent Weather Prediction Platform

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.12-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

An intelligent weather platform combining real-time API integrations, machine learning forecasts, and a natural language chat interface.

## ✨ Features
- 🌦️ **Real-time Weather Data**: Integrated with Open-Meteo and NOAA.
- 🤖 **ERA5 ML Experiments**: Trained Random Forest, XGBoost, and LightGBM models for offline 24-hour Pune/Mumbai hindcasts; these are not connected to live forecasts.
- 💬 **Natural Language Chat**: Query weather conditions conversational style.
- 🗺️ **3D Interactive Map**: Visualize global weather patterns dynamically.
- ⚡ **High Performance**: Built with FastAPI and React/TypeScript.

## 📸 Screenshots
*(Screenshots coming soon)*

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React, TypeScript, Vite, Three.js, Tailwind CSS |
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
   git clone https://github.com/example/weather-ai.git
   cd weather-ai
   ```

2. Run the setup script:
   ```bash
   bash scripts/setup.sh
   ```

3. Download 3D map textures:
   ```bash
   bash scripts/download_textures.sh
   ```

4. Start development servers:
   ```bash
   bash scripts/dev.sh
   ```

## 🐳 Docker Deployment
To deploy using Docker Compose:
```bash
docker-compose up -d --build
```
This will start the frontend, backend, PostgreSQL database, and Redis cache.

## 📁 Project Structure
```
weather-ai/
├── backend/       # FastAPI application
├── frontend/      # React/Vite application
├── ml/            # ERA5 acquisition, training, local models, and evaluation reports
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
| GET | `/api/ml/predict` | Placeholder endpoint; does not serve the trained ERA5 models |

See [API Docs](docs/api.md) for details.

## 🔑 Environment Variables
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL or SQLite connection string |
| `REDIS_URL` | Redis cache connection string |
| `OPEN_METEO_BASE_URL` | Base URL for weather provider |
| `LLM_API_KEY` | Key for Chat functionality (if using external LLM) |

## 🧠 ML Models
The first completed experiment uses 192,864 hourly ERA5 records for Pune and Mumbai (2015–2025), downloaded through Open-Meteo with `models=era5`. All three models predict six weather quantities 24 hours ahead. Training and validation precede a held-out 2025 evaluation; LightGBM was selected on validation temperature RMSE. Its holdout temperature MAE is 0.665°C versus 0.690°C for persistence. These are reanalysis hindcast results, not evidence of live or global forecast accuracy.

See [ML Workflow](docs/ml-workflow.md) for download/train/predict commands and the [model card](ml/reports/era5_24h/MODEL_CARD.md) for scores, limitations, and dataset provenance. Large datasets and trained binaries stay in local ignored directories; compact reports are versioned. The existing backend ML endpoint remains a placeholder.

## 🤝 Contributing
Please read [Development Guide](docs/development.md) for details on our code of conduct, and the process for submitting pull requests.

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
