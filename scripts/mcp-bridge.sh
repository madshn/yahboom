#!/usr/bin/env bash
# mcp-bridge.sh — Auto-restarting supergateway wrapper for Streamable HTTP MCP
#
# Problem: n8n restarts destroy server-side MCP sessions. supergateway keeps
# the stale session ID and every subsequent request returns 404 "Session not found".
# supergateway does NOT exit on 404 — it stays running with the stale session.
#
# Fix: Poll supergateway's stderr log for "Session not found". When detected,
# kill the process to force a restart with a fresh session. Claude Code's MCP
# stdio transport automatically reconnects to the new process.
#
# Usage in .mcp.json:
#   "command": "bash",
#   "args": ["scripts/mcp-bridge.sh", "https://flow.rightaim.ai/mcp/endpoint", "Bearer TOKEN"]

URL="${1:?Usage: mcp-bridge.sh <streamableHttp-url> <auth-header-value>}"
AUTH="${2:?Usage: mcp-bridge.sh <streamableHttp-url> <auth-header-value>}"

MAX_RESTARTS=50
RESTART_DELAY=2
restart_count=0

while [ "$restart_count" -lt "$MAX_RESTARTS" ]; do
  ERRLOG=$(mktemp)

  npx -y supergateway \
    --streamableHttp "$URL" \
    --header "authorization:$AUTH" \
    --logLevel info \
    2>"$ERRLOG" &
  SG_PID=$!

  # Poll stderr log every 5s for stale session errors
  while kill -0 "$SG_PID" 2>/dev/null; do
    if grep -q "Session not found" "$ERRLOG" 2>/dev/null; then
      kill "$SG_PID" 2>/dev/null
      break
    fi
    sleep 5
  done

  wait "$SG_PID" 2>/dev/null || true
  rm -f "$ERRLOG"

  restart_count=$((restart_count + 1))
  sleep "$RESTART_DELAY"
done

exit 1
