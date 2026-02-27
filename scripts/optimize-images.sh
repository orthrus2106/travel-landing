#!/usr/bin/env bash
set -euo pipefail

if ! command -v convert >/dev/null 2>&1; then
  echo "ImageMagick 'convert' is required but not found." >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIRS=("$ROOT_DIR/src/assets" "$ROOT_DIR/public")

optimize_image() {
  local file="$1"
  local ext tmp
  ext="${file##*.}"
  ext="$(printf '%s' "$ext" | tr '[:upper:]' '[:lower:]')"
  tmp="${file}.tmp"

  case "$ext" in
    jpg|jpeg)
      convert "$file" -strip -resize '1920x1920>' -interlace Plane -sampling-factor 4:2:0 -quality 72 "$tmp"
      ;;
    png)
      convert "$file" -strip -resize '1920x1920>' -quality 82 "$tmp"
      ;;
    webp)
      convert "$file" -strip -resize '1920x1920>' -quality 75 "$tmp"
      ;;
    *)
      return 0
      ;;
  esac

  if [ -s "$tmp" ]; then
    mv "$tmp" "$file"
  else
    rm -f "$tmp"
  fi
}

for dir in "${TARGET_DIRS[@]}"; do
  [ -d "$dir" ] || continue

  while IFS= read -r -d '' image; do
    optimize_image "$image"
  done < <(find "$dir" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' \) -print0)
done

echo "Image optimization completed."
