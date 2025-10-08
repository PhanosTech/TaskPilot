#!/usr/bin/env bash
set -euo pipefail

DEST="/opt/taskpilot"
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SERVICE_USER="ahiya"
SERVICE_GROUP="ahiya"
DEFAULT_DB_JSON='{"projects":[],"tasks":[],"categories":[]}'

echo "[TaskPilot Install] Starting install script"

TMP_DB=""
if sudo test -f "$DEST/data/taskpilot.db"; then
  TMP_DB="$(mktemp -p /tmp taskpilot.db.XXXXXX)"
  echo "[TaskPilot Install] Backing up existing database to $TMP_DB"
  sudo cp "$DEST/data/taskpilot.db" "$TMP_DB"
else
  echo "[TaskPilot Install] No existing database found at $DEST/data/taskpilot.db"
fi

if sudo test -d "$DEST"; then
  echo "[TaskPilot Install] Removing existing destination directory $DEST"
  sudo rm -rf "$DEST"
fi

echo "[TaskPilot Install] Creating destination directory $DEST"
sudo mkdir -p "$DEST"

echo "[TaskPilot Install] Syncing application files to $DEST"
sudo rsync -a \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude 'test' \
  "$SRC_DIR"/ "$DEST"/

echo "[TaskPilot Install] Creating required subdirectories"
sudo mkdir -p "$DEST/bin" "$DEST/data"

echo "[TaskPilot Install] Installing startup script"
sudo cp "$SRC_DIR/scripts/systemd/taskpilot-start.sh" "$DEST/bin/taskpilot-start.sh"
sudo chmod +x "$DEST/bin/taskpilot-start.sh"

if [ -n "$TMP_DB" ] && [ -f "$TMP_DB" ]; then
  echo "[TaskPilot Install] Restoring database from $TMP_DB"
  sudo cp "$TMP_DB" "$DEST/data/taskpilot.db"
  sudo chown "$SERVICE_USER:$SERVICE_GROUP" "$DEST/data/taskpilot.db"
  rm -f "$TMP_DB"
else
  echo "[TaskPilot Install] No database backup to restore"
fi

if [ ! -f "$DEST/data/taskpilot.db" ]; then
  echo "[TaskPilot Install] Provisioning default database"
  if [ -f "$SRC_DIR/taskpilot.prod.db" ]; then
    sudo cp "$SRC_DIR/taskpilot.prod.db" "$DEST/data/taskpilot.db"
  else
    echo "$DEFAULT_DB_JSON" | sudo tee "$DEST/data/taskpilot.db" >/dev/null
  fi
fi

echo "[TaskPilot Install] Setting ownership to $SERVICE_USER:$SERVICE_GROUP"
sudo chown -R "$SERVICE_USER:$SERVICE_GROUP" "$DEST"

echo "[TaskPilot Install] Installing npm dependencies (this may take a while)"
sudo -u "$SERVICE_USER" bash -c "cd '$DEST' && npm install --omit=dev"

echo "[TaskPilot Install] Installing systemd service unit"
sudo cp "$SRC_DIR/scripts/systemd/taskpilot.service" /etc/systemd/system/taskpilot.service

echo "[TaskPilot Install] Reloading systemd daemon and enabling service"
sudo systemctl daemon-reload
sudo systemctl enable --now taskpilot.service

echo "[TaskPilot Install] Installation complete"
