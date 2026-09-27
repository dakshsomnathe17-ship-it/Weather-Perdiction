# Deployment Guide

## Docker Compose Deployment
The simplest way to deploy WeatherAI is using Docker Compose.

1. Clone the repository on your server.
2. Copy `.env.example` to `.env` and fill in production secrets.
   Leave `VITE_ARCGIS_ACCESS_TOKEN` blank for Natural Earth; set it before building to enable Esri imagery and labels.
   Compose passes the backend settings in this file to FastAPI. The Esri token is compiled into public browser code; use a browser token restricted to your domain.
3. Build and start services:
   ```bash
   docker-compose -f docker-compose.yml up -d --build
   ```

## Environment Configuration
Ensure the following variables are set in production `.env`:
- `DATABASE_URL`: Must point to the PostgreSQL container.
- `REDIS_URL`: Must point to the Redis container.
- `DEBUG`: Set to `false`.
- `LOG_LEVEL`: Set to `WARNING` or `ERROR`.
- `NOMINATIM_CACHE_PATH`: Compose stores the shared search cache in a named volume. Keep one cache/rate gate for all backend workers on a host; multiple hosts need a centrally limited or self-hosted search service.

Compose supplies the backend's PostgreSQL and Redis container addresses. Its explicit `DATABASE_URL` and `REDIS_URL` settings take precedence over values in `.env`; update the Compose file and database credentials together if you change those connections.

## Database Setup
On first run, initialize the database schema:
```bash
docker-compose exec backend alembic upgrade head
```

## Production Checklist
- [ ] Change default PostgreSQL passwords.
- [ ] Ensure API keys (Open-Meteo, NOAA) are valid and have sufficient quota.
- [ ] Set up HTTPS/SSL on the Nginx reverse proxy or an upstream load balancer (e.g., AWS ALB, Cloudflare).
- [ ] Verify CORS origins are restricted to your actual domain.

## Monitoring
- **Logs**: Use `docker logs -f weather-ai_backend_1`
- **APM**: Consider integrating Prometheus/Grafana or Sentry for application monitoring and error tracking.

## Backup Strategy
- Set up a cron job to run `pg_dump` daily and upload it to an S3 bucket.
- No need to back up Redis as it is only used for ephemeral caching.
