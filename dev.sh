#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Starting PolyArb Dashboard (Frontend + Backend)..."
echo ""

# Function to kill process on a specific port
kill_port() {
    local port=$1
    if lsof -i:$port > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port $port is in use. Killing existing process...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 1
        # Verify port is free
        if lsof -i:$port > /dev/null 2>&1; then
            echo -e "${RED}❌ Failed to free port $port${NC}"
            return 1
        fi
        echo -e "${GREEN}✅ Port $port is now free${NC}"
    else
        echo "✅ Port $port is free"
    fi
    return 0
}

# Kill all ports used by the application
echo "🧹 Cleaning up ports..."
echo ""
echo "Checking frontend ports (8080, 8081)..."
for port in 8080 8081; do
    kill_port $port
done
echo ""
echo "Checking backend port (3001)..."
kill_port 3001
echo ""

# Check if concurrently is installed
if ! command -v concurrently &> /dev/null; then
    echo "❌ concurrently not found. Installing..."
    npm install -g concurrently
fi

# Run both services
npx concurrently \
    --names "backend,frontend" \
    --prefix name \
    --prefix-colors "bgBlue.bold,bgGreen.bold" \
    "cd backend/python && python app.py" \
    "npm run dev"
