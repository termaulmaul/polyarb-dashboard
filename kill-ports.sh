#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Ports used by the application
PORTS=(3001 8080 8081)

echo "🧹 Killing processes on application ports..."
echo ""

# Function to kill process on a specific port
kill_port() {
    local port=$1
    local killed=0

    # Try lsof first (most reliable on macOS/Linux)
    if command -v lsof &> /dev/null; then
        if lsof -i:$port > /dev/null 2>&1; then
            local pids=$(lsof -ti:$port)
            if [ -n "$pids" ]; then
                echo -e "${YELLOW}⚠️  Port $port in use. Killing process(es): $pids${NC}"
                echo "$pids" | xargs kill -9 2>/dev/null || true
                killed=1
            fi
        fi
    # Fallback to ss (Linux)
    elif command -v ss &> /dev/null; then
        if ss -tlnp "sport = :$port" | grep -q LISTEN; then
            local pid=$(ss -tlnp "sport = :$port" | grep -oP 'pid=\K[0-9]+' | head -1)
            if [ -n "$pid" ]; then
                echo -e "${YELLOW}⚠️  Port $port in use. Killing process: $pid${NC}"
                kill -9 $pid 2>/dev/null || true
                killed=1
            fi
        fi
    # Fallback to netstat (older systems)
    elif command -v netstat &> /dev/null; then
        if netstat -tlnp 2>/dev/null | grep -q ":$port "; then
            local pid=$(netstat -tlnp 2>/dev/null | grep ":$port " | grep -oP '\s[0-9]+/' | head -1 | tr -d ' /')
            if [ -n "$pid" ]; then
                echo -e "${YELLOW}⚠️  Port $port in use. Killing process: $pid${NC}"
                kill -9 $pid 2>/dev/null || true
                killed=1
            fi
        fi
    fi

    sleep 1

    # Verify port is free
    if lsof -i:$port > /dev/null 2>&1; then
        echo -e "${RED}❌ Failed to free port $port${NC}"
        return 1
    elif [ $killed -eq 1 ]; then
        echo -e "${GREEN}✅ Port $port is now free${NC}"
    else
        echo -e "${GREEN}✅ Port $port is already free${NC}"
    fi
    return 0
}

# Kill all ports
for port in "${PORTS[@]}"; do
    kill_port $port
done

echo ""
echo "✨ All application ports have been cleaned up!"
