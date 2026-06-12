#!/bin/bash
# Script to create properly padded Android Adaptive Icon foreground
# Creates a 1024x1024 icon with 22% padding (220px) on all sides
# This ensures the logo is fully visible in all Android launcher masks

set -e

ASSETS_DIR="./assets"
INPUT_ICON="$ASSETS_DIR/icon-new.png"
OUTPUT_ICON="$ASSETS_DIR/adaptive-icon-padded.png"

echo "📱 Creating properly padded Android Adaptive Icon..."

# Check if input exists
if [ ! -f "$INPUT_ICON" ]; then
  echo "❌ Error: $INPUT_ICON not found"
  exit 1
fi

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
  echo "❌ Error: ImageMagick (convert) is required but not installed"
  echo "   Install with: sudo apt-get install imagemagick"
  exit 1
fi

# Canvas size: 1024x1024 (Expo adaptive icon size)
CANVAS_SIZE=1024

# Padding: 22% on all sides (225px)
PADDING=225
LOGO_SIZE=$((CANVAS_SIZE - (PADDING * 2)))  # 574px logo area

echo "   Canvas size: ${CANVAS_SIZE}x${CANVAS_SIZE}px"
echo "   Padding: ${PADDING}px ($(echo "scale=1; $PADDING*100/$CANVAS_SIZE" | bc)%)"
echo "   Logo area: ${LOGO_SIZE}x${LOGO_SIZE}px"
echo "   Input: $INPUT_ICON"
echo "   Output: $OUTPUT_ICON"

# Create canvas with transparent background
# Resize logo to fit within padded area, then composite onto canvas
convert "$INPUT_ICON" \
  -resize "${LOGO_SIZE}x${LOGO_SIZE}" \
  -gravity center \
  -background transparent \
  -extent "${CANVAS_SIZE}x${CANVAS_SIZE}" \
  "$OUTPUT_ICON"

# Verify output
if [ -f "$OUTPUT_ICON" ]; then
  echo "✅ Adaptive icon created successfully!"
  echo "   Output: $OUTPUT_ICON"
  ls -lh "$OUTPUT_ICON"
  
  echo ""
  echo "📝 Next steps:"
  echo "   1. Replace adaptive-icon.png with adaptive-icon-padded.png:"
  echo "      cp $OUTPUT_ICON $ASSETS_DIR/adaptive-icon.png"
  echo "   2. Run: npx expo prebuild --clean"
  echo "   3. Or rebuild: npx expo run:android --variant release"
else
  echo "❌ Error: Failed to create adaptive icon"
  exit 1
fi

