# Troubleshooting Guide

## Quick Diagnosis

### System Health Check

```bash
# Check all services
curl -s http://localhost:3001/health | jq .

# Check API responsiveness
curl -s http://localhost:3001/api/opportunities | jq length

# Check frontend
curl -s -I http://localhost:8080 | head -1

# Check ports
lsof -i :3001,8080,8081
```

### Log Analysis

```bash
# Recent errors
tail -50 backend/python/logs/polyarb.log | grep ERROR

# Execution summary
grep "BOTH_FILLED\|ONE_FILLED\|FAILED" backend/python/logs/polyarb.log | tail -10

# Performance metrics
grep "Risk state updated" backend/python/logs/polyarb.log | tail -5
```

## Common Issues & Solutions

### 1. Port Already in Use

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solutions:**
```bash
# Kill existing processes
./kill-ports.sh

# Or manually
lsof -ti:3001,8080,8081 | xargs kill -9

# Check what's using ports
lsof -i :3001
```

### 2. Demo Mode Not Working

**Symptoms:**
- No "DEMO MODE" warnings in logs
- Real orders being placed

**Diagnosis:**
```bash
# Check environment variables
env | grep POLYMARKET

# Check .env file exists
ls -la .env

# Verify credentials format
cat .env | grep -v WALLET_PRIVATE_KEY  # Hide private key
```

**Solutions:**
```bash
# Remove credentials for demo mode
rm .env

# Or comment out credentials
# POLYMARKET_API_KEY=your_key  # Comment this line

# Restart services
./kill-ports.sh
./start_full.sh
```

### 3. Low Fill Rates

**Symptoms:**
- Many executions result in "ONE_FILLED" or "NONE_FILLED"
- Poor success rate in metrics

**Diagnosis:**
```bash
# Check recent executions
curl http://localhost:3001/api/logs | jq '.[] | select(.status != "BOTH_FILLED") | {id, status, details}' | tail -10

# Check market liquidity
curl http://localhost:3001/api/opportunities | jq '.[] | {market: .marketName, volume: .volume, edge: .edge}' | head -10
```

**Solutions:**
```bash
# Reduce position sizes
curl -X PUT http://localhost:3001/api/config \
  -H "Content-Type: application/json" \
  -d '{"max_position_size": 25}'

# Increase minimum edge threshold
curl -X PUT http://localhost:3001/api/config \
  -H "Content-Type: application/json" \
  -d '{"min_edge": 1.0}'

# Check market conditions
# Avoid low-volume markets
```

### 4. Emergency Stop Triggered

**Symptoms:**
- Trading suddenly stops
- "EMERGENCY STOP" in logs
- Bot becomes unresponsive

**Diagnosis:**
```bash
# Check risk status
curl http://localhost:3001/api/risk/status

# Check daily PnL
grep "EMERGENCY STOP" backend/python/logs/polyarb.log

# Check stop loss threshold
curl http://localhost:3001/api/config | jq .emergency_stop_loss
```

**Solutions:**
```bash
# Reset daily PnL (if false positive)
# Edit config to adjust stop loss
curl -X PUT http://localhost:3001/api/config \
  -H "Content-Type: application/json" \
  -d '{"emergency_stop_loss": -100}'

# Manual restart after investigation
./kill-ports.sh
./start_full.sh
```

### 5. API Connection Issues

**Symptoms:**
- "Failed to get market info" errors
- Network timeout errors
- Polymarket API unavailable

**Diagnosis:**
```bash
# Test connectivity
ping clob.polymarket.com

# Check API credentials
curl -H "Authorization: Bearer $POLYMARKET_API_KEY" \
     https://clob.polymarket.com/markets

# Check rate limits
grep "rate limit" backend/python/logs/polyarb.log
```

**Solutions:**
```bash
# Wait for API recovery (usually 5-10 minutes)
sleep 300

# Check Polymarket status
curl https://status.polymarket.com

# Reduce scan frequency
curl -X PUT http://localhost:3001/api/config \
  -H "Content-Type: application/json" \
  -d '{"scan_interval": 10000}'
```

### 6. Insufficient Wallet Balance

**Symptoms:**
- "INSUFFICIENT_BALANCE" errors
- Orders rejected immediately

**Diagnosis:**
```bash
# Check wallet balance (manual)
# Check POLYGON balance on wallet

# Check gas fees
curl https://api.polygonscan.com/api?module=gastracker&action=gasoracle
```

**Solutions:**
```bash
# Add POLYGON to wallet
# Reduce position sizes
curl -X PUT http://localhost:3001/api/config \
  -H "Content-Type: application/json" \
  -d '{"max_position_size": 10}'

# Use lower gas price network if available
```

### 7. Database Connection Issues

**Symptoms:**
- "Database connection failed" errors
- Logging stops working

**Diagnosis:**
```bash
# Check database status
sudo systemctl status postgresql

# Test connection
psql -h localhost -U polyarb -d polyarb -c "SELECT 1"

# Check disk space
df -h
```

**Solutions:**
```bash
# Restart database
sudo systemctl restart postgresql

# Check configuration
sudo -u postgres psql -c "SHOW config_file"

# Free disk space if needed
sudo du -sh /var/lib/postgresql/
```

### 8. Memory Issues

**Symptoms:**
- System becomes slow
- Out of memory errors
- Services crash unexpectedly

**Diagnosis:**
```bash
# Check memory usage
free -h
htop

# Check Python memory
ps aux | grep python | head -5

# Check for memory leaks
grep "MemoryError" backend/python/logs/polyarb.log
```

**Solutions:**
```bash
# Restart services
./kill-ports.sh
./start_full.sh

# Reduce concurrent executions
curl -X PUT http://localhost:3001/api/config \
  -H "Content-Type: application/json" \
  -d '{"max_concurrent_executions": 1}'

# Add swap space if needed
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### 9. High Latency

**Symptoms:**
- Slow response times
- Timeout errors
- Poor execution performance

**Diagnosis:**
```bash
# Test response times
time curl http://localhost:3001/api/opportunities > /dev/null

# Check system load
uptime
iostat -x 1 5

# Check network latency
ping -c 5 clob.polymarket.com
```

**Solutions:**
```bash
# Increase timeouts
curl -X PUT http://localhost:3001/api/config \
  -H "Content-Type: application/json" \
  -d '{"execution_timeout": 60}'

# Reduce scan frequency
curl -X PUT http://localhost:3001/api/config \
  -H "Content-Type: application/json" \
  -d '{"scan_interval": 15000}'

# Optimize system
# Update to faster CPU/memory
```

### 10. Position Validation Errors

**Symptoms:**
- "POSITION VALIDATION FAILED" warnings
- Naked position alerts

**Diagnosis:**
```bash
# Check active positions
curl http://localhost:3001/api/risk/positions

# Check for naked positions
curl http://localhost:3001/api/risk/status | jq .naked_positions

# Review recent executions
curl http://localhost:3001/api/logs | jq '.[] | select(.status == "ONE_FILLED")' | tail -5
```

**Solutions:**
```bash
# Emergency close naked positions
# Contact support if positions persist
# Review risk management logic

# Reduce position sizes temporarily
curl -X PUT http://localhost:3001/api/config \
  -H "Content-Type: application/json" \
  -d '{"max_position_size": 5}'
```

## Advanced Troubleshooting

### Log Analysis Scripts

```bash
#!/bin/bash
# analyze_logs.sh

echo "=== PolyArb Log Analysis ==="
echo "Last 24 hours summary:"
echo "Total executions: $(grep "ARBITRAGE EXECUTION START" logs/polyarb.log | wc -l)"
echo "Successful: $(grep "BOTH_FILLED" logs/polyarb.log | wc -l)"
echo "Partial: $(grep "ONE_FILLED" logs/polyarb.log | wc -l)"
echo "Failed: $(grep "FAILED\|TIMEOUT" logs/polyarb.log | wc -l)"
echo ""
echo "Error summary:"
grep "ERROR\|CRITICAL" logs/polyarb.log | tail -10
echo ""
echo "Performance metrics:"
grep "Risk state updated" logs/polyarb.log | tail -1
```

### Performance Monitoring

```bash
#!/bin/bash
# monitor_performance.sh

while true; do
    echo "$(date): CPU: $(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')% | MEM: $(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')% | OPS: $(curl -s http://localhost:3001/api/opportunities | jq length) markets"
    sleep 60
done
```

### Automated Health Checks

```bash
#!/bin/bash
# health_check.sh

# Backend health
if ! curl -s --max-time 5 http://localhost:3001/health > /dev/null; then
    echo "❌ Backend unhealthy"
    exit 1
fi

# Frontend health
if ! curl -s --max-time 5 http://localhost:8080 > /dev/null; then
    echo "❌ Frontend unhealthy"
    exit 1
fi

# API responsiveness
opportunities=$(curl -s http://localhost:3001/api/opportunities | jq length)
if [ "$opportunities" -lt 1 ]; then
    echo "❌ No opportunities data"
    exit 1
fi

# Risk status
naked_positions=$(curl -s http://localhost:3001/api/risk/status | jq '.naked_positions | length')
if [ "$naked_positions" -gt 0 ]; then
    echo "⚠️  Naked positions detected: $naked_positions"
fi

echo "✅ All systems healthy"
```

## Emergency Procedures

### Complete System Reset

```bash
# 1. Emergency stop
curl -X POST http://localhost:3001/api/risk/emergency-stop

# 2. Kill all processes
./kill-ports.sh
pkill -f python
pkill -f node

# 3. Clear logs
truncate -s 0 backend/python/logs/polyarb.log

# 4. Reset risk state (if needed)
# Edit code to reset risk_state dictionary

# 5. Restart with conservative settings
./start_full.sh
```

### Data Recovery

```bash
# Restore from backup
pg_restore -d polyarb backup_file.sql

# Recreate indices
# Run database migration scripts

# Verify data integrity
# Check execution logs match database
```

### Contact Support

If all troubleshooting steps fail:

1. **Gather diagnostic information:**
   ```bash
   # System info
   uname -a
   python --version
   node --version

   # Recent logs
   tail -100 backend/python/logs/polyarb.log

   # Configuration (without secrets)
   curl http://localhost:3001/api/config
   ```

2. **Create issue report:**
   - System information
   - Error logs
   - Configuration (redacted)
   - Steps to reproduce

3. **Contact channels:**
   - GitHub Issues: https://github.com/termaulmaul/polyarb-dashboard/issues
   - Email: support@polyarb.com (if available)

This troubleshooting guide covers the most common issues and provides systematic approaches to diagnosis and resolution. Regular monitoring and proactive maintenance will prevent most problems.