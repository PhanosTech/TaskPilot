#!/usr/bin/env bash
set -euo pipefail

DEST="/opt/taskpilot"
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SERVICE_USER="ahiya"
SERVICE_GROUP="ahiya"
DEFAULT_DB_JSON='{"projects":[],"tasks":[],"categories":[]}'

DB_PATH="$DEST/data/taskpilot.db"
NODE_MODULES_PATH="$DEST/node_modules"

echo "[TaskPilot Install] Starting install script"
echo "[TaskPilot Install] Source directory: $SRC_DIR"
echo "[TaskPilot Install] Destination directory: $DEST"

echo "[TaskPilot Install] Ensuring destination directory exists"
sudo mkdir -p "$DEST"

if sudo systemctl is-active --quiet taskpilot.service; then
  echo "[TaskPilot Install] Stopping existing taskpilot.service before updating files"
  sudo systemctl stop taskpilot.service
fi

if sudo test -d "$DEST/.next"; then
  echo "[TaskPilot Install] Removing existing build artifacts at $DEST/.next"
  sudo rm -rf "$DEST/.next"
fi

echo "[TaskPilot Install] Syncing application files to $DEST (preserving node_modules)"
sudo rsync -a \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude 'test' \
  "$SRC_DIR"/ "$DEST"/

if [ ! -d "$SRC_DIR/node_modules" ]; then
  echo "[TaskPilot Install] No node_modules directory in source; skipping copy"
elif sudo test -d "$NODE_MODULES_PATH"; then
  echo "[TaskPilot Install] Destination already has node_modules; leaving in place"
else
  echo "[TaskPilot Install] Copying node_modules from source to destination"
  sudo mkdir -p "$NODE_MODULES_PATH"
  sudo rsync -a "$SRC_DIR/node_modules/" "$NODE_MODULES_PATH/"
fi

echo "[TaskPilot Install] Creating required subdirectories"
sudo mkdir -p "$DEST/bin" "$DEST/data"

echo "[TaskPilot Install] Installing startup script"
sudo cp "$SRC_DIR/scripts/systemd/taskpilot-start.sh" "$DEST/bin/taskpilot-start.sh"
sudo chmod +x "$DEST/bin/taskpilot-start.sh"

if ! sudo test -f "$DB_PATH"; then
  echo "[TaskPilot Install] Provisioning default database"
  if [ -f "$SRC_DIR/taskpilot.prod.db" ]; then
    sudo cp "$SRC_DIR/taskpilot.prod.db" "$DB_PATH"
  else
    echo "$DEFAULT_DB_JSON" | sudo tee "$DB_PATH" >/dev/null
  fi
else
  echo "[TaskPilot Install] Reusing existing database at $DB_PATH"
fi

echo "[TaskPilot Install] Setting ownership to $SERVICE_USER:$SERVICE_GROUP"
sudo chown -R "$SERVICE_USER:$SERVICE_GROUP" "$DEST"

if sudo test -d "$NODE_MODULES_PATH"; then
  echo "[TaskPilot Install] Reusing existing node_modules at $NODE_MODULES_PATH"
else
  echo "[TaskPilot Install] Installing npm dependencies (first install)"
  sudo -u "$SERVICE_USER" bash -c "cd '$DEST' && npm install --omit=dev"
fi

echo "[TaskPilot Install] Installing systemd service unit"
sudo cp "$SRC_DIR/scripts/systemd/taskpilot.service" /etc/systemd/system/taskpilot.service

echo "[TaskPilot Install] Reloading systemd daemon and enabling service"
sudo systemctl daemon-reload
sudo systemctl enable taskpilot.service
sudo systemctl restart taskpilot.service

echo "[TaskPilot Install] Installation complete"
