#!/bin/sh
# Re-encode promo clips for the phone-sized modal (renders ~340 px wide).
# Target: 540x960, h264 high, CRF 27, AAC 64k, faststart. 6.5 MB → ~1 MB.
#
# Usage:
#   scripts/shrink-clips.sh                 # every public/*.mp4 that needs it
#   scripts/shrink-clips.sh a.mp4 b.mp4     # only these
# A clip "needs it" when it is wider than 540 px OR larger than 1.2 MB.
# Wired into .git/hooks/pre-commit (see scripts/install-hooks.sh) so a freshly
# generated 720p clip can never reach the repo at full size again.

set -e
FFMPEG="${FFMPEG:-ffmpeg}"
FFPROBE="${FFPROBE:-ffprobe}"
# Windows (WinGet) fallback when ffmpeg is not on PATH.
WINGET_FF="$LOCALAPPDATA/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-full_build/bin"
if ! command -v "$FFMPEG" >/dev/null 2>&1 && [ -x "$WINGET_FF/ffmpeg.exe" ]; then
  FFMPEG="$WINGET_FF/ffmpeg.exe"; FFPROBE="$WINGET_FF/ffprobe.exe"
fi
command -v "$FFMPEG" >/dev/null 2>&1 || { echo "shrink-clips: ffmpeg not found, skipping" >&2; exit 0; }

MAX_BYTES=$((1200 * 1024))
MAX_W=540

if [ $# -gt 0 ]; then FILES="$@"; else FILES=$(ls public/*.mp4 2>/dev/null); fi

for f in $FILES; do
  [ -f "$f" ] || continue
  size=$(wc -c < "$f")
  width=$("$FFPROBE" -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$f" 2>/dev/null || echo 0)
  if [ "$size" -le "$MAX_BYTES" ] && [ "${width:-0}" -le "$MAX_W" ]; then continue; fi
  tmp="${f%.mp4}.__tmp__.mp4"
  "$FFMPEG" -y -v error -i "$f" -vf "scale=${MAX_W}:-2" \
    -c:v libx264 -profile:v high -preset slow -crf 27 -pix_fmt yuv420p \
    -c:a aac -b:a 64k -movflags +faststart "$tmp"
  mv -f "$tmp" "$f"
  echo "shrink-clips: $f $((size / 1024)) KB → $(( $(wc -c < "$f") / 1024 )) KB"
done
