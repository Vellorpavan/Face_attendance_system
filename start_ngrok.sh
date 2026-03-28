#!/bin/bash
# ─────────────────────────────────────────────
#  SVPCET AI Attendance — Start Script
#  Starts HTTP server + ngrok public tunnel
# ─────────────────────────────────────────────

PROJECT_DIR="/Users/pavan/Desktop/collage face"
NGROK="npx ngrok"
PORT=8080

echo "🔴 Stopping any existing servers..."
lsof -ti:$PORT | xargs kill -9 2>/dev/null
pkill -f "ngrok" 2>/dev/null
sleep 1

echo "🟢 Starting HTTP server on port $PORT..."
cd "$PROJECT_DIR"
python3 -m http.server $PORT &
HTTP_PID=$!
sleep 2

echo "🌐 Starting ngrok tunnel..."
$NGROK http $PORT --log=stdout &
NGROK_PID=$!
sleep 6

# Get the public URL
PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels | python3 -c "
import sys,json
try:
    t=json.load(sys.stdin)['tunnels']
    url=[x['public_url'] for x in t if x['public_url'].startswith('https')]
    print(url[0] if url else 'ERROR: no https tunnel found')
except Exception as e:
    print('ERROR:', e)
")

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SVPCET AI Attendance is LIVE!"
echo ""
echo "  🌐 Public URL (share this):"
echo "  $PUBLIC_URL/login.html"
echo ""
echo "  📱 Open on any device, no WiFi needed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C to stop"

# Wait for either process to exit
wait $HTTP_PID $NGROK_PID
