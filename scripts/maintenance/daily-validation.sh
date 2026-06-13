#!/bin/bash
# Daily validation script
# Run at 9 AM daily via cron

cd "$(dirname "$0")/../.."

echo "======================================"
echo "🔍 Daily Validation - $(date)"
echo "======================================"

# Create daily report directory
mkdir -p reports/daily

# Run comprehensive scan
echo "Running database scan..."
node tools/01-validation/comprehensive-db-scanner.js > reports/daily/scan-$(date +%Y-%m-%d).log 2>&1

# Check results
if grep -q "Suspicious entries:" reports/daily/scan-$(date +%Y-%m-%d).log; then
  suspicious_count=$(grep "Suspicious entries:" reports/daily/scan-$(date +%Y-%m-%d).log | grep -oE '[0-9]+')
  
  if [ "$suspicious_count" -gt 0 ]; then
    echo "⚠️ ALERT: Found $suspicious_count suspicious entries!"
    echo "Check report: reports/daily/scan-$(date +%Y-%m-%d).log"
    
    # Create alert file for monitoring
    echo "$(date): $suspicious_count suspicious entries found" >> alerts/validation-alerts.log
  fi
else
  echo "✅ No suspicious entries found"
fi

# Quick stats
total=$(grep "Total entries:" reports/daily/scan-$(date +%Y-%m-%d).log | grep -oE '[0-9]+' | head -1)
echo "Total database entries: $total"

echo "Daily validation complete!"
echo "======================================"