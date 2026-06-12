#!/bin/bash

# Script to update Google Maps API key in all required locations
# Usage: ./scripts/update-gmaps-key.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Read API key from .env file
ENV_FILE="$MOBILE_APP_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: .env file not found at $ENV_FILE"
    echo "Please create .env file with: EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here"
    exit 1
fi

# Extract API key from .env file
API_KEY=$(grep -E "^EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=" "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)

if [ -z "$API_KEY" ]; then
    echo "❌ Error: Could not find EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env file"
    exit 1
fi

echo "✅ Found Google Maps API Key: ${API_KEY:0:20}..."
echo "📝 Updating all configuration files..."

# 1. Update AndroidManifest.xml
ANDROID_MANIFEST="$MOBILE_APP_DIR/android/app/src/main/AndroidManifest.xml"
if [ -f "$ANDROID_MANIFEST" ]; then
    sed -i "s|android:value=\"YOUR_GOOGLE_MAPS_API_KEY\"|android:value=\"$API_KEY\"|g" "$ANDROID_MANIFEST"
    echo "✅ Updated: $ANDROID_MANIFEST"
else
    echo "⚠️  Warning: $ANDROID_MANIFEST not found"
fi

# 2. Update iOS Info.plist
IOS_INFO_PLIST="$MOBILE_APP_DIR/ios/TempProject/Info.plist"
if [ -f "$IOS_INFO_PLIST" ]; then
    sed -i "s|<string>YOUR_GOOGLE_MAPS_API_KEY</string>|<string>$API_KEY</string>|g" "$IOS_INFO_PLIST"
    echo "✅ Updated: $IOS_INFO_PLIST"
else
    echo "⚠️  Warning: $IOS_INFO_PLIST not found"
fi

# 3. Update app.json (multiple locations)
APP_JSON="$MOBILE_APP_DIR/app.json"
if [ -f "$APP_JSON" ]; then
    # Use node to properly update JSON file
    node <<EOF
const fs = require('fs');
const appJson = JSON.parse(fs.readFileSync('$APP_JSON', 'utf8'));
const apiKey = '$API_KEY';

// Update iOS infoPlist
if (appJson.expo.ios.infoPlist.GMSApiKey) {
    appJson.expo.ios.infoPlist.GMSApiKey = apiKey;
}

// Update iOS config
if (appJson.expo.ios.config && appJson.expo.ios.config.googleMapsApiKey) {
    appJson.expo.ios.config.googleMapsApiKey = apiKey;
}

// Update Android config
if (appJson.expo.android.config && appJson.expo.android.config.googleMaps && appJson.expo.android.config.googleMaps.apiKey) {
    appJson.expo.android.config.googleMaps.apiKey = apiKey;
}

// Update extra
if (appJson.expo.extra && appJson.expo.extra.googleMapsApiKey) {
    appJson.expo.extra.googleMapsApiKey = apiKey;
}

fs.writeFileSync('$APP_JSON', JSON.stringify(appJson, null, 2) + '\n');
console.log('✅ Updated: $APP_JSON');
EOF
else
    echo "⚠️  Warning: $APP_JSON not found"
fi

echo ""
echo "✅ Google Maps API Key updated in all locations!"
echo "📋 Updated files:"
echo "   - AndroidManifest.xml"
echo "   - iOS Info.plist"
echo "   - app.json (iOS & Android configs)"
echo ""
echo "🚀 Next steps:"
echo "   1. Verify the key is correct in all files"
echo "   2. Run: npm start"
echo "   3. Test maps on both Android and iOS"

