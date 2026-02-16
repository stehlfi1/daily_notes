#!/bin/bash
# Install native messaging host for Daily Primer extension.
# The extension uses a stable key, so the ID is always the same.

set -e

EXT_ID="ccjacchmoojfgckhlfcancgggngikngh"
HOST_NAME="com.dailyprimer.host"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HOST_SCRIPT="$SCRIPT_DIR/native-host/daily_primer_host.py"

# Make the host script executable
chmod +x "$HOST_SCRIPT"

# Native messaging host manifest
MANIFEST="{
  \"name\": \"$HOST_NAME\",
  \"description\": \"Daily Primer - reads Obsidian daily notes\",
  \"path\": \"$HOST_SCRIPT\",
  \"type\": \"stdio\",
  \"allowed_origins\": [\"chrome-extension://$EXT_ID/\"]
}"

OS="$(uname -s)"

if [ "$OS" = "Darwin" ]; then
  # macOS: install for Brave and Chrome
  for DIR in \
    "$HOME/Library/Application Support/BraveSoftware/Brave-Browser/NativeMessagingHosts" \
    "$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"; do
    mkdir -p "$DIR"
    echo "$MANIFEST" > "$DIR/$HOST_NAME.json"
    echo "Installed: $DIR/$HOST_NAME.json"
  done
elif [ "$OS" = "Linux" ]; then
  # Linux: install for Brave and Chrome
  for DIR in \
    "$HOME/.config/BraveSoftware/Brave-Browser/NativeMessagingHosts" \
    "$HOME/.config/google-chrome/NativeMessagingHosts"; do
    mkdir -p "$DIR"
    echo "$MANIFEST" > "$DIR/$HOST_NAME.json"
    echo "Installed: $DIR/$HOST_NAME.json"
  done
else
  echo "Unsupported OS: $OS"
  echo "Manually place the native messaging manifest for your browser."
  exit 1
fi

echo ""
echo "Done. Restart your browser and reload the extension."