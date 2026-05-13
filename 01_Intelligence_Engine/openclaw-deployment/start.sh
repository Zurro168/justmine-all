#!/bin/bash
# Start both dashboard (port 3000) and wecom_bot (port 5000)

# Start dashboard in background
python openclaw-deployment/app_dashboard.py &
DASHBOARD_PID=$!

# Start wecom bot in background
python openclaw-deployment/wecom_bot.py &
WECOM_PID=$!

echo "Dashboard PID: $DASHBOARD_PID, WeCom PID: $WECOM_PID"

# Wait for either process to exit
wait $DASHBOARD_PID $WECOM_PID -n
EXIT_CODE=$?

# Kill the other process
kill $DASHBOARD_PID $WECOM_PID 2>/dev/null
wait

exit $EXIT_CODE
