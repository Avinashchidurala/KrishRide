#!/bin/bash
# Script to sync assets from frontend to mobile-app

FRONTEND_ASSETS="../frontend/public/images"
MOBILE_ASSETS="./assets"

echo "Syncing assets from frontend to mobile-app..."

# Copy main assets
cp "$FRONTEND_ASSETS/icon.png" "$MOBILE_ASSETS/icon.png"
cp "$FRONTEND_ASSETS/favicon.png" "$MOBILE_ASSETS/favicon.png"
cp "$FRONTEND_ASSETS/hushryd-logo-new.jpg" "$MOBILE_ASSETS/logo.jpg"

# Use icon as adaptive icon if no specific one exists
if [ ! -f "$MOBILE_ASSETS/adaptive-icon.png" ]; then
  cp "$FRONTEND_ASSETS/icon.png" "$MOBILE_ASSETS/adaptive-icon.png"
fi

# Copy favicon sizes if needed
cp "$FRONTEND_ASSETS/favicon-192.png" "$MOBILE_ASSETS/favicon-192.png" 2>/dev/null || true
cp "$FRONTEND_ASSETS/favicon-512.png" "$MOBILE_ASSETS/favicon-512.png" 2>/dev/null || true

echo "✅ Assets synced successfully!"
echo "Assets location: $MOBILE_ASSETS"
ls -lh "$MOBILE_ASSETS"

