#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/taskpilot}"
PORT="${PORT:-3000}"

cd "$APP_DIR"

export NODE_ENV="${NODE_ENV:-production}"
export DB_PATH="${DB_PATH:-/opt/taskpilot/data/taskpilot.db}"

exec "$APP_DIR/node_modules/.bin/next" start --hostname 0.0.0.0 --port "$PORT"
