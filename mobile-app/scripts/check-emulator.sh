#!/bin/bash
# Script to check emulator setup and status

echo "🔍 Checking Android Emulator Setup..."
echo ""

# Check ANDROID_HOME
if [ -z "$ANDROID_HOME" ]; then
    export ANDROID_HOME=$HOME/Android/Sdk
fi

export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools

# Check if ANDROID_HOME exists
if [ ! -d "$ANDROID_HOME" ]; then
    echo "❌ ANDROID_HOME not found: $ANDROID_HOME"
    exit 1
fi
echo "✅ ANDROID_HOME: $ANDROID_HOME"

# Check if emulator exists
if [ ! -f "$ANDROID_HOME/emulator/emulator" ]; then
    echo "❌ Emulator not found"
    exit 1
fi
echo "✅ Emulator found"

# Check if adb exists
if ! command -v adb &> /dev/null; then
    echo "❌ ADB not found in PATH"
    exit 1
fi
echo "✅ ADB found"

# Check local.properties
if [ -f "android/local.properties" ]; then
    SDK_DIR=$(grep "sdk.dir" android/local.properties | cut -d'=' -f2)
    if [ "$SDK_DIR" = "$ANDROID_HOME" ]; then
        echo "✅ android/local.properties configured correctly"
    else
        echo "⚠️  android/local.properties SDK path: $SDK_DIR"
    fi
else
    echo "⚠️  android/local.properties not found"
fi

# List AVDs
echo ""
echo "📱 Available AVDs:"
AVDS=$($ANDROID_HOME/emulator/emulator -list-avds 2>/dev/null)
if [ -z "$AVDS" ]; then
    echo "   ❌ No AVDs found"
else
    echo "$AVDS" | sed 's/^/   ✅ /'
fi

# Check running devices
echo ""
echo "🖥️  Connected devices:"
DEVICES=$(adb devices | tail -n +2 | grep -v "^$")
if [ -z "$DEVICES" ]; then
    echo "   ⚠️  No devices connected"
    echo ""
    echo "💡 To start emulator: npm run emulator:start"
else
    echo "$DEVICES" | sed 's/^/   ✅ /'
fi

echo ""
echo "✅ Setup check complete!"

