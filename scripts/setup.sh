#!/bin/bash
set -e

echo "🌍 Setting up WeatherAI..."

# Check prerequisites
command -v python3 >/dev/null 2>&1 || { echo >&2 "Python3 is required but not installed. Aborting."; exit 1; }
command -v node >/dev/null 2>&1 || { echo >&2 "Node.js is required but not installed. Aborting."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo >&2 "npm is required but not installed. Aborting."; exit 1; }

# Create virtual environment
echo "🐍 Creating virtual environment..."
python3 -m venv .venv
source .venv/bin/activate

# Install backend dependencies
echo "📦 Installing backend dependencies..."
pip install --upgrade pip
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
else
    echo "requirements.txt not found, skipping backend dependencies."
fi

# Install frontend dependencies
echo "🎨 Installing frontend dependencies..."
if [ -d "frontend" ]; then
    cd frontend
    npm install
    cd ..
else
    echo "frontend directory not found, skipping frontend dependencies."
fi

# Create .env
echo "🔧 Configuring environment..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "Created .env from .env.example"
    else
        echo "Warning: .env.example not found."
    fi
else
    echo ".env already exists."
fi

# Initialize database (placeholder logic)
echo "🗄️ Initializing database..."
# Example: alembic upgrade head
echo "Database initialized (placeholder)."

echo "✅ Setup complete! Run 'bash scripts/dev.sh' to start development servers."
