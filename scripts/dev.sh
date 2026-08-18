#!/bin/bash
set -e

echo "🚀 Starting WeatherAI Development Servers..."

# Cleanup function to kill background processes on exit
cleanup() {
    echo "🛑 Stopping servers..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Set up trap to call cleanup on INT and TERM signals
trap cleanup INT TERM

# Start Backend
echo "🐍 Starting backend server on port 8000..."
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

if [ -d "backend" ]; then
    cd backend
    uvicorn app.main:app --reload --port 8000 &
    BACKEND_PID=$!
    cd ..
else
    echo "Warning: backend directory not found. Trying from root."
    uvicorn app.main:app --reload --port 8000 &
    BACKEND_PID=$!
fi

# Start Frontend
echo "🎨 Starting frontend dev server..."
if [ -d "frontend" ]; then
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
else
    echo "Error: frontend directory not found."
    kill $BACKEND_PID
    exit 1
fi

echo "✅ Servers running!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "Press Ctrl+C to stop both servers."

# Wait for both processes
wait
