#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Ports used by the application
FRONTEND_PORTS=(8080 8081)
BACKEND_PORT=3001

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
for port in "${FRONTEND_PORTS[@]}"; do
    kill_port $port
done

echo ""
echo "Checking backend port ($BACKEND_PORT)..."
kill_port $BACKEND_PORT

echo ""

# Function to cleanup background processes
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down servers...${NC}"
    kill $backend_pid $frontend_pid 2>/dev/null || true
    exit
}

# Set trap to cleanup on script exit
trap cleanup EXIT INT TERM

# Start backend in background
echo "🔧 Starting backend server..."
cd backend/python
python app.py &
backend_pid=$!

# Wait for backend to start (give it time)
echo "⏳ Waiting for backend to initialize..."
sleep 5

# Check if backend is running
if curl -s --max-time 5 http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend server started successfully on port 3001${NC}"
else
    echo -e "${RED}❌ Backend server failed to start or is not responding${NC}"
    echo "   Check backend logs above for errors"
    exit 1
fi

# Go back to root directory
cd ../..

# Start frontend
echo ""
echo "🌐 Starting frontend server..."
npm run dev &
frontend_pid=$!

# Wait for frontend to start
echo "⏳ Waiting for frontend to initialize..."
sleep 8

# Check if frontend is responding (basic check)
if curl -s --max-time 5 http://localhost:8080 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend server started successfully on port 8080${NC}"
    FRONTEND_URL="http://localhost:8080"
elif curl -s --max-time 5 http://localhost:8081 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend server started successfully on port 8081${NC}"
    FRONTEND_URL="http://localhost:8081"
else
    echo -e "${YELLOW}⚠️  Frontend may still be starting up...${NC}"
    FRONTEND_URL="http://localhost:8080 or 8081"
fi

echo ""
echo -e "${GREEN}🎉 Servers are starting up!${NC}"
echo "  📊 Frontend: $FRONTEND_URL"
echo "  🔧 Backend:  http://localhost:3001"
echo ""
echo "📋 API Status Check:"
echo "  Health: $(curl -s http://localhost:3001/health | jq -r '.status' 2>/dev/null || echo 'N/A')"
echo "  Opportunities: $(curl -s http://localhost:3001/api/opportunities | jq '. | length' 2>/dev/null || echo 'N/A') items"
echo "  Logs: $(curl -s http://localhost:3001/api/logs | jq '. | length' 2>/dev/null || echo 'N/A') items"
echo ""
echo "💡 Tips:"
echo "  - Open $FRONTEND_URL in your browser"
echo "  - Check browser console (F12) for any frontend errors"
echo "  - Backend logs will show above if there are issues"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $frontend_pid $backend_pid 2>/dev/null || true
