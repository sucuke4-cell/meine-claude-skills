#!/usr/bin/env bash
# Baut für jeden Skill eine ZIP-Datei in download/, zum Hochladen in der Claude-App
# (Einstellungen → Capabilities → Skills). "watch" fehlt absichtlich: läuft nur in Claude Code.
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf download && mkdir -p download
for d in skills/*/; do
  n=$(basename "$d")
  [ "$n" = "watch" ] && continue
  (cd skills && zip -qr -X "../download/$n.zip" "$n" -x '*/__pycache__/*' '*.pyc' '*/tests/*')
done
ls -la download
