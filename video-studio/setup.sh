#!/usr/bin/env bash
# One-time setup: three.js, Python packages and the free Kokoro voice model (~120 MB, not in git).
set -euo pipefail
cd "$(dirname "$0")"
npm install --no-audit --no-fund
pip install -q kokoro-onnx soundfile scipy numpy
mkdir -p voices
[ -f voices/kokoro.onnx ] || curl -fL -o voices/kokoro.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.int8.onnx
[ -f voices/voices.bin ] || curl -fL -o voices/voices.bin https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
node -e "require('playwright')" 2>/dev/null || echo "Note: Playwright with Chromium is needed for rendering (npm i -g playwright && npx playwright install chromium)."
echo "Setup done."
