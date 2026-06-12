#!/bin/bash
# Script to start Android emulator for this project

# Set Android environment variables
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools

# Check if ANDROID_HOME exists
if [ ! -d "$ANDROID_HOME" ]; then
    echo "❌ Error: ANDROID_HOME not found at $ANDROID_HOME"
    echo "Please install Android SDK or set ANDROID_HOME correctly"
    exit 1
fi

# Check if emulator is already running
if adb devices | grep -q "emulator.*device$"; then
    echo "✅ Emulator is already running!"
    echo ""
    echo "Connected devices:"
    adb devices
    echo ""
    echo "You can now run: npm run android"
    exit 0
fi

# List available AVDs
AVDS=$($ANDROID_HOME/emulator/emulator -list-avds 2>/dev/null)

if [ -z "$AVDS" ]; then
    echo "❌ No Android Virtual Devices (AVDs) found!"
    echo ""
    echo "To create an AVD:"
    echo "1. Open Android Studio"
    echo "2. Go to More Actions → Virtual Device Manager"
    echo "3. Click 'Create Device'"
    echo "4. Choose a device (e.g., Pixel 5)"
    echo "5. Select system image (API 33 or 34 recommended)"
    echo "6. Click Finish"
    exit 1
fi

# Use first AVD or the one specified as argument
AVD_NAME=${1:-$(echo "$AVDS" | head -n 1)}

echo "🚀 Starting Android Emulator: $AVD_NAME"
echo "This may take 1-2 minutes on first boot..."
echo ""

# Start emulator in background
$ANDROID_HOME/emulator/emulator -avd "$AVD_NAME" > /dev/null 2>&1 &

# Wait for emulator to boot
echo "⏳ Waiting for emulator to boot..."
sleep 5

# Check if emulator is starting
for i in {1..30}; do
    if adb devices | grep -q "emulator"; then
        echo "✅ Emulator is starting..."
        break
    fi
    sleep 2
    echo -n "."
done

echo ""
echo ""

# Wait for device to be fully ready
echo "⏳ Waiting for emulator to be fully ready..."
adb wait-for-device
sleep 10

# Final check
if adb devices | grep -q "device$"; then
    echo "✅ Emulator is ready!"
    echo ""
    echo "Connected devices:"
    adb devices
    echo ""
    echo "🎉 You can now run: npm run android"
else
    echo "⚠️  Emulator is starting but may need more time"
    echo "Check status with: adb devices"
    echo "Or wait a bit more and try: npm run android"
fi

