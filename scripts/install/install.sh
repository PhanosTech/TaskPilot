#!/usr/bin/env bash
set -euo pipefail

DEST="/opt/taskpilot"
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SERVICE_USER="ahiya"
SERVICE_GROUP="ahiya"
DEFAULT_DB_JSON='{"projects":[],"tasks":[],"categories":[]}'

sudo mkdir -p "$DEST"
sudo rm -rf "$DEST/.next"
echo " copying code"
sudo rsync -a \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude 'test' \
  "$SRC_DIR"/ "$DEST"/

echo "copying scripts"
sudo mkdir -p "$DEST/bin" "$DEST/data"
sudo cp "$SRC_DIR/scripts/systemd/taskpilot-start.sh" "$DEST/bin/taskpilot-start.sh"
sudo chmod +x "$DEST/bin/taskpilot-start.sh"

echo "copying db file"
if [ ! -f "$DEST/data/taskpilot.db" ]; then
  if [ -f "$SRC_DIR/taskpilot.prod.db" ]; then
    sudo cp "$SRC_DIR/taskpilot.prod.db" "$DEST/data/taskpilot.db"
  else
    echo "$DEFAULT_DB_JSON" | sudo tee "$DEST/data/taskpilot.db" >/dev/null
  fi
fi

sudo chown -R "$SERVICE_USER:$SERVICE_GROUP" "$DEST"

sudo -u "$SERVICE_USER" bash -c "cd '$DEST' && npm install --omit=dev"
echo "copying service and starting"

sudo cp "$SRC_DIR/scripts/systemd/taskpilot.service" /etc/systemd/system/taskpilot.service
sudo systemctl daemon-reload
sudo systemctl enable --now taskpilot.service
