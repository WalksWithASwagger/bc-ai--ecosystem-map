#!/bin/bash

# Setup Daily Sync for Funding Database
# This script sets up a cron job to run the automated sync daily

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname $(dirname $SCRIPT_DIR))"
SYNC_SCRIPT="$SCRIPT_DIR/automated-funding-sync.js"

echo "🔧 Setting up daily sync for Funding Database"
echo ""

# Check if sync script exists
if [ ! -f "$SYNC_SCRIPT" ]; then
    echo "❌ Sync script not found at: $SYNC_SCRIPT"
    exit 1
fi

# Create a wrapper script that includes environment setup
WRAPPER_SCRIPT="$SCRIPT_DIR/run-sync.sh"

cat > "$WRAPPER_SCRIPT" << EOF
#!/bin/bash
# Automated Funding Database Sync Runner

# Set up environment
export PATH=/usr/local/bin:/usr/bin:/bin
cd "$PROJECT_ROOT"

# Log start time
echo "[\$(date)] Starting funding database sync" >> logs/funding-sync-cron.log

# Run the sync
/usr/local/bin/node "$SYNC_SCRIPT" >> logs/funding-sync-cron.log 2>&1

# Log completion
echo "[\$(date)] Sync completed" >> logs/funding-sync-cron.log
echo "" >> logs/funding-sync-cron.log
EOF

chmod +x "$WRAPPER_SCRIPT"

echo "✅ Created wrapper script at: $WRAPPER_SCRIPT"
echo ""

# Add to crontab
echo "📅 Setting up cron job..."
echo ""
echo "Choose sync schedule:"
echo "1) Daily at 2 AM"
echo "2) Daily at 9 AM"
echo "3) Every 6 hours"
echo "4) Every hour (testing)"
echo "5) Manual setup"
echo ""

read -p "Enter choice (1-5): " choice

case $choice in
    1)
        CRON_SCHEDULE="0 2 * * *"
        SCHEDULE_DESC="Daily at 2 AM"
        ;;
    2)
        CRON_SCHEDULE="0 9 * * *"
        SCHEDULE_DESC="Daily at 9 AM"
        ;;
    3)
        CRON_SCHEDULE="0 */6 * * *"
        SCHEDULE_DESC="Every 6 hours"
        ;;
    4)
        CRON_SCHEDULE="0 * * * *"
        SCHEDULE_DESC="Every hour"
        ;;
    5)
        echo ""
        echo "To manually add the cron job, run:"
        echo "crontab -e"
        echo ""
        echo "Then add this line:"
        echo "0 2 * * * $WRAPPER_SCRIPT"
        echo ""
        echo "This will run the sync daily at 2 AM"
        exit 0
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "$WRAPPER_SCRIPT"; then
    echo "⚠️  Cron job already exists. Updating..."
    # Remove existing job
    crontab -l | grep -v "$WRAPPER_SCRIPT" | crontab -
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_SCHEDULE $WRAPPER_SCRIPT") | crontab -

echo "✅ Cron job added: $SCHEDULE_DESC"
echo ""
echo "📋 Current cron jobs:"
crontab -l | grep funding-sync || echo "No funding sync jobs found"
echo ""

# Test run option
read -p "Run a test sync now? (y/n): " test_run

if [ "$test_run" = "y" ] || [ "$test_run" = "Y" ]; then
    echo ""
    echo "🚀 Running test sync..."
    "$WRAPPER_SCRIPT"
    echo ""
    echo "✅ Test complete. Check logs at: logs/funding-sync-cron.log"
fi

echo ""
echo "🎉 Daily sync setup complete!"
echo ""
echo "📊 Monitor sync logs at:"
echo "   - Detailed: logs/funding-sync.log"
echo "   - Cron output: logs/funding-sync-cron.log"
echo ""
echo "🛠️ Manage sync:"
echo "   - View jobs: crontab -l"
echo "   - Edit jobs: crontab -e"
echo "   - Run manually: $WRAPPER_SCRIPT"
echo ""