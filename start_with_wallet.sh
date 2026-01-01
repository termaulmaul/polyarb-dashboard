#!/bin/bash

echo "🚀 Starting PolyArb Dashboard with Wallet Support..."
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

echo "🔑 Wallet connection features:"
echo "  ✅ MetaMask support"
echo "  ✅ WalletConnect support"
echo "  ✅ Coinbase Wallet support"
echo "  ✅ Polygon network validation"
echo ""

echo "🌐 Starting development server..."
pnpm run dev