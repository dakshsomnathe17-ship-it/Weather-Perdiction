"""
WeatherAI Backend - FastAPI Application Entry Point.

This module initializes the FastAPI application, configures middleware,
registers routers, and manages application lifecycle events.
"""

import time
import logging
from collections import defaultdict
from contextlib import asynccontextmanager
from typing import Dict, Tuple

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import init_db, engine
from app.routers import weather, predictions, chat

# ---------------------------------------------------------------------------
# Logging Configuration
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("weatherai")


# ---------------------------------------------------------------------------
# Lifespan (startup / shutdown)
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown."""
    logger.info("🚀  Starting WeatherAI Backend …")
    await init_db()
    logger.info("✅  Database initialised")
    yield
    # Shutdown
    await engine.dispose()
    logger.info("🛑  WeatherAI Backend shut down")


# ---------------------------------------------------------------------------
# FastAPI Application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="WeatherAI API",
    description=(
        "AI-powered weather prediction platform with ML models, "
        "live weather data, and an intelligent chat assistant."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)


# ---------------------------------------------------------------------------
# CORS Middleware
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Simple In-Memory Rate Limiter Middleware
# ---------------------------------------------------------------------------
_rate_limit_store: Dict[str, Tuple[float, int]] = defaultdict(lambda: (0.0, 0))
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX = 120     # requests per window


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Basic per-IP rate limiting (in-memory)."""
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    window_start, count = _rate_limit_store[client_ip]

    if now - window_start > RATE_LIMIT_WINDOW:
        # Reset the window
        _rate_limit_store[client_ip] = (now, 1)
    else:
        count += 1
        if count > RATE_LIMIT_MAX:
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Please try again later."},
            )
        _rate_limit_store[client_ip] = (window_start, count)

    return await call_next(request)


# ---------------------------------------------------------------------------
# Request Logging Middleware
# ---------------------------------------------------------------------------
@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    """Log every request with timing information."""
    start = time.perf_counter()
    response: Response = await call_next(request)
    elapsed_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s → %s (%.1f ms)",
        request.method,
        request.url.path,
        response.status_code,
        elapsed_ms,
    )
    return response


# ---------------------------------------------------------------------------
# Register Routers
# ---------------------------------------------------------------------------
app.include_router(weather.router, prefix="/api")
app.include_router(predictions.router, prefix="/api")
app.include_router(chat.router, prefix="/api")


# ---------------------------------------------------------------------------
# Root & Health-check Endpoints
# ---------------------------------------------------------------------------
@app.get("/", tags=["Root"])
async def root():
    """API root – basic information."""
    return {
        "name": "WeatherAI API",
        "version": "1.0.0",
        "docs": "/api/docs",
        "health": "/api/health",
    }


@app.get("/api/health", tags=["Health"])
async def health_check():
    """Liveness / readiness probe."""
    return {
        "status": "healthy",
        "service": "weatherai-backend",
        "version": "1.0.0",
    }
