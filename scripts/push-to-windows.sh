#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <windows-user@host> '<remote-windows-path>' [--build]"
  echo "Example: $0 arijit@192.168.1.40 'C:\\Users\\arijit\\Projects\\csca-practice' --build"
  exit 1
fi

HOST="$1"
REMOTE_DIR="$2"
BUILD="${3:-}"

ssh "$HOST" "powershell -NoProfile -Command \"New-Item -ItemType Directory -Force -Path '$REMOTE_DIR' | Out-Null\""
tar --exclude='./node_modules' --exclude='./release' --exclude='./.git' -cf - . \
  | ssh "$HOST" "tar -xf - -C '$REMOTE_DIR'"

echo "Synced project to $HOST:$REMOTE_DIR"
if [[ "$BUILD" == "--build" ]]; then
  ssh "$HOST" "powershell -NoProfile -ExecutionPolicy Bypass -File '$REMOTE_DIR\\scripts\\windows\\build.ps1'"
fi
