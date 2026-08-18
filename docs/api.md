# API Documentation

## Base URL
Local Development: `http://localhost:8000/api`
Production: `https://yourdomain.com/api`

## Authentication
*(Authentication is planned for a future release via OAuth2/JWT)*

## Endpoints

| Method | Path | Description | Parameters | Response |
|--------|------|-------------|------------|----------|
| GET | `/weather/current` | Get current weather | `lat`, `lon` | `200 OK`: Weather JSON |
| GET | `/weather/forecast` | Get 7-day forecast | `lat`, `lon` | `200 OK`: Forecast JSON |
| GET | `/weather/search` | Search for location | `q` (query) | `200 OK`: Location array |
| POST | `/chat` | Chat query | `{ "message": string }` | `200 OK`: Chat Response |

## Request/Response Examples

### GET `/weather/current`
**Request:**
`GET /api/weather/current?lat=51.50&lon=-0.12`

**Response:**
```json
{
  "location": {
    "lat": 51.50,
    "lon": -0.12
  },
  "current": {
    "temperature": 15.2,
    "condition": "Cloudy",
    "humidity": 76,
    "wind_speed": 12.5
  }
}
```

### POST `/chat`
**Request:**
```json
{
  "message": "What is the weather like in London tomorrow?"
}
```

**Response:**
```json
{
  "reply": "Tomorrow in London, it is expected to be rainy with a high of 14°C and a low of 9°C.",
  "intent": "forecast",
  "location": "London"
}
```

## Error Codes
- `400 Bad Request`: Invalid parameters or malformed JSON.
- `404 Not Found`: Resource or location not found.
- `422 Unprocessable Entity`: Validation error (Pydantic).
- `500 Internal Server Error`: Backend exception or external API failure.
