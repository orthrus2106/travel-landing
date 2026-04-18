#!/usr/bin/env bash
set -euo pipefail

if ! command -v convert >/dev/null 2>&1; then
  echo "ImageMagick 'convert' is required but not found." >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ASSET_DIR="$ROOT_DIR/src/assets"
QUALITY="${WEBP_QUALITY:-78}"
DRY_RUN=0
declare -A TARGET_COUNTS=()
SOURCE_FILES=()

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=1
fi

if [[ ! -d "$ASSET_DIR" ]]; then
  echo "Asset directory not found: $ASSET_DIR" >&2
  exit 1
fi

while IFS= read -r -d '' source_file; do
  SOURCE_FILES+=("$source_file")
done < <(
  find "$ROOT_DIR" \
    \( -path "$ROOT_DIR/node_modules" -o -path "$ROOT_DIR/dist" \) -prune \
    -o -type f \( -name '*.html' -o -name '*.js' -o -name '*.css' -o -name '*.scss' \) \
    -print0
)

target_for_source() {
  local source="$1"
  local ext="${source##*.}"
  local target_base="${source%.*}.webp"

  ext="$(printf '%s' "$ext" | tr '[:upper:]' '[:lower:]')"

  if [[ "${TARGET_COUNTS[$target_base]}" -gt 1 ]]; then
    printf '%s-%s.webp' "${source%.*}" "$ext"
  else
    printf '%s' "$target_base"
  fi
}

convert_image() {
  local source="$1"
  local target

  target="$(target_for_source "$source")"

  if [[ "$source" == "$target" ]]; then
    return 0
  fi

  if [[ -f "$target" && "$target" -nt "$source" ]]; then
    echo "up to date: ${target#$ROOT_DIR/}"
    return 0
  fi

  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "would convert: ${source#$ROOT_DIR/} -> ${target#$ROOT_DIR/}"
    return 0
  fi

  convert "$source" \
    -auto-orient \
    -strip \
    -resize '1920x1920>' \
    -quality "$QUALITY" \
    "$target"

  echo "converted: ${source#$ROOT_DIR/} -> ${target#$ROOT_DIR/}"
}

rewrite_reference() {
  local source="$1"
  local target
  local relative_from_assets="${source#$ASSET_DIR/}"
  local webp_relative

  target="$(target_for_source "$source")"
  webp_relative="${target#$ASSET_DIR/}"

  if [[ "$DRY_RUN" -eq 1 ]]; then
    return 0
  fi

  perl -0pi -e "s#assets/\\Q$relative_from_assets\\E#assets/$webp_relative#g" "${SOURCE_FILES[@]}"
}

while IFS= read -r -d '' image; do
  target="${image%.*}.webp"
  TARGET_COUNTS["$target"]="$(( ${TARGET_COUNTS[$target]:-0} + 1 ))"
done < <(find "$ASSET_DIR" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) -print0)

while IFS= read -r -d '' image; do
  convert_image "$image"
  rewrite_reference "$image"
done < <(find "$ASSET_DIR" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) -print0)

if [[ "$DRY_RUN" -eq 0 ]]; then
  perl -0pi -e \
    "s#'\\./assets/gallery/\\*\\*/\\*\\.\\{jpg,jpeg,png,webp\\}'#'./assets/gallery/**/*.webp'#g" \
    "$ROOT_DIR/src/main.js"
fi

echo "WebP conversion completed. Originals were kept in place."
