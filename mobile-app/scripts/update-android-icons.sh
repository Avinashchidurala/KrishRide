#!/bin/bash
# Script to update Android app icons from assets folder

echo "Updating Android app icons..."

ASSETS_DIR="./assets"
ANDROID_RES_DIR="./android/app/src/main/res"

# Check if assets exist
if [ ! -f "$ASSETS_DIR/icon.png" ]; then
  echo "❌ Error: $ASSETS_DIR/icon.png not found"
  exit 1
fi

# Create directories if they don't exist
mkdir -p "$ANDROID_RES_DIR/mipmap-mdpi"
mkdir -p "$ANDROID_RES_DIR/mipmap-hdpi"
mkdir -p "$ANDROID_RES_DIR/mipmap-xhdpi"
mkdir -p "$ANDROID_RES_DIR/mipmap-xxhdpi"
mkdir -p "$ANDROID_RES_DIR/mipmap-xxxhdpi"

# Function to resize and copy icon
copy_icon() {
  local size=$1
  local density=$2
  
  # Use ImageMagick if available, otherwise just copy
  if command -v convert &> /dev/null; then
    echo "Resizing icon to ${size}x${size} for $density..."
    convert "$ASSETS_DIR/icon.png" -resize "${size}x${size}" "$ANDROID_RES_DIR/mipmap-$density/ic_launcher.png"
    convert "$ASSETS_DIR/icon.png" -resize "${size}x${size}" "$ANDROID_RES_DIR/mipmap-$density/ic_launcher_round.png"
  else
    echo "⚠️  ImageMagick not found. Copying original icon to $density..."
    echo "   Please manually resize icons or install ImageMagick: sudo apt-get install imagemagick"
    cp "$ASSETS_DIR/icon.png" "$ANDROID_RES_DIR/mipmap-$density/ic_launcher.png"
    cp "$ASSETS_DIR/icon.png" "$ANDROID_RES_DIR/mipmap-$density/ic_launcher_round.png"
  fi
}

# Copy icons for different densities
# mdpi: 48x48
copy_icon 48 "mdpi"

# hdpi: 72x72
copy_icon 72 "hdpi"

# xhdpi: 96x96
copy_icon 96 "xhdpi"

# xxhdpi: 144x144
copy_icon 144 "xxhdpi"

# xxxhdpi: 192x192
copy_icon 192 "xxxhdpi"

echo "✅ Android icons updated!"
echo "   Location: $ANDROID_RES_DIR/mipmap-*/"

