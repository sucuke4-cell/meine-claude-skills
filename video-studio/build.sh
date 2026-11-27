#!/usr/bin/env bash
# Build one episode: voices -> music/sfx mix -> frames -> MP4.
# Usage: ./build.sh episodes/part2 [--skip-frames]
set -euo pipefail
cd "$(dirname "$0")"
EP="$1"; ROOT="$(pwd)"; NAME="$(basename "$EP")"
mkdir -p "$EP/audio"
(cd "$EP" && python3 make_vo.py "$ROOT/voices" && python3 make_audio.py)
ffmpeg -loglevel error -y -i "$EP/audio/mix.wav" -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 "$EP/audio/final.wav"
if [ "${2:-}" != "--skip-frames" ]; then rm -rf "$EP/frames"; WORKERS=${WORKERS:-4} node shared/render.mjs "$EP" 30; fi
mkdir -p out
ffmpeg -loglevel error -y -framerate 30 -i "$EP/frames/f%05d.jpg" -i "$EP/audio/final.wav" \
  -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -profile:v high -movflags +faststart \
  -c:a aac -b:a 192k -shortest "out/$NAME.mp4"
echo "Done: out/$NAME.mp4"
