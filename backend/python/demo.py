#!/usr/bin/env python3
"""
PolyArb Polymarket API Integration Demo
Shows how to fetch markets and detect arbitrage opportunities
"""

import requests
import json
from datetime import datetime

# Polymarket API endpoints
GAMMA_API = "https://gamma-api.polymarket.com"
DATA_API = "https://data-api.polymarket.com"


def fetch_active_markets(limit=10):
    """Fetch active markets from Gamma API"""
    response = requests.get(
        f"{GAMMA_API}/markets",
        params={
            "limit": limit,
            "active": True,
            "closed": False,
            "order": "volume24hr",
            "ascending": False,
        },
    )
    response.raise_for_status()
    return response.json()


def analyze_market_for_arbitrage(market):
    """Analyze a market for arbitrage opportunities"""
    outcome_prices_str = market.get("outcomePrices")
    if not outcome_prices_str:
        return None

    try:
        outcome_prices = json.loads(outcome_prices_str)
        if len(outcome_prices) < 2:
            return None

        yes_price = float(outcome_prices[0])
        no_price = float(outcome_prices[1])
        total_cost = yes_price + no_price

        # Calculate potential profit
        edge = (1.0 - total_cost) * 100 if total_cost < 1.0 else 0

        if edge > 0.1:  # Any arbitrage opportunity
            return {
                "market": market["question"][:50] + "...",
                "yes_price": yes_price,
                "no_price": no_price,
                "total_cost": total_cost,
                "edge_percent": round(edge, 2),
                "volume": round(market.get("volume24hr", 0), 0),
            }

    except (ValueError, json.JSONDecodeError):
        pass

    return None


def main():
    print("🚀 PolyArb Polymarket API Integration Demo")
    print("=" * 50)

    # Fetch markets
    print("📊 Fetching active markets from Polymarket...")
    markets = fetch_active_markets(20)
    print(f"✅ Found {len(markets)} active markets\n")

    # Analyze for arbitrage
    print("🔍 Analyzing markets for arbitrage opportunities...")
    opportunities = []

    for market in markets:
        opportunity = analyze_market_for_arbitrage(market)
        if opportunity:
            opportunities.append(opportunity)

    # Display results
    if opportunities:
        print(f"🎯 Found {len(opportunities)} arbitrage opportunities:\n")

        for i, opp in enumerate(opportunities[:5], 1):  # Show top 5
            print(f"{i}. {opp['market']}")
            print(f"   YES: {opp['yes_price']:.4f} | NO: {opp['no_price']:.4f}")
            print(
                f"   Total Cost: {opp['total_cost']:.4f} | Edge: {opp['edge_percent']:.2f}%"
            )
            print(f"   24h Volume: ${opp['volume']:,.0f}")
            print()
    else:
        print("✅ No arbitrage opportunities found (markets are efficiently priced)")
        print("\n💡 This is normal! Polymarket is generally very efficient.")

    # Show market examples
    print("\n📈 Sample Markets:")
    for market in markets[:3]:
        outcome_prices = json.loads(market.get("outcomePrices", '["N/A", "N/A"]'))
        print(f"• {market['question'][:60]}...")
        print(f"  YES: {outcome_prices[0]} | NO: {outcome_prices[1]}")
        print(f"  Volume: ${market.get('volume24hr', 0):,.0f}")
        print()

    print("🎉 Demo complete! The backend now integrates with Polymarket APIs.")


if __name__ == "__main__":
    main()
