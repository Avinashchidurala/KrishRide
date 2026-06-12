#!/bin/bash
# Quick script to set up and start Android emulator

echo "🔍 Checking Android SDK setup..."

# Set ANDROID_HOME if not set
if [ -z "$ANDROID_HOME" ]; then
    export ANDROID_HOME=$HOME/Android/Sdk
fi

# Add to PATH
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Check if ANDROID_HOME is valid
if [ ! -d "$ANDROID_HOME" ]; then
    echo "❌ ANDROID_HOME directory not found: $ANDROID_HOME"
    echo "Please install Android SDK or set ANDROID_HOME correctly"
    exit 1
fi

echo "✅ ANDROID_HOME: $ANDROID_HOME"

# Check if emulator exists
if [ ! -f "$ANDROID_HOME/emulator/emulator" ]; then
    echo "❌ Emulator not found at $ANDROID_HOME/emulator"
    echo "Please install Android SDK and emulator via Android Studio"
    exit 1
fi

echo "✅ Emulator found"

# List available AVDs
echo ""
echo "📱 Available Android Virtual Devices (AVDs):"
AVDS=$($ANDROID_HOME/emulator/emulator -list-avds 2>/dev/null)

if [ -z "$AVDS" ]; then
    echo "❌ No AVDs found!"
    echo ""
    echo "To create an AVD:"
    echo "1. Open Android Studio"
    echo "2. Go to More Actions → Virtual Device Manager"
    echo "3. Click 'Create Device'"
    echo "4. Choose Pixel 5 or Pixel 6"
    echo "5. Download API 33 or API 34"
    echo "6. Click Finish"
    echo ""
    echo "Or use command line:"
    echo "  avdmanager create avd -n Pixel5_API33 -k \"system-images;android-33;google_apis;x86_64\" -d \"pixel_5\""
    exit 1
fi

echo "$AVDS"
echo ""

# Check if emulator is already running
RUNNING=$(adb devices | grep -E "emulator-[0-9]+" | wc -l)
if [ "$RUNNING" -gt 0 ]; then
    echo "✅ Emulator is already running!"
    adb devices
    echo ""
    echo "You can now run: npm run android"
    exit 0
fi

# Ask which AVD to start
echo "Which AVD would you like to start?"
echo "Enter the AVD name (or press Enter for first one):"
read -r AVD_NAME

if [ -z "$AVD_NAME" ]; then
    AVD_NAME=$(echo "$AVDS" | head -n 1)
fi

if [ -z "$AVD_NAME" ]; then
    echo "❌ No AVD selected"
    exit 1
fi

echo ""
echo "🚀 Starting emulator: $AVD_NAME"
echo "This may take 1-2 minutes on first boot..."
echo ""

# Start emulator in background
$ANDROID_HOME/emulator/emulator -avd "$AVD_NAME" > /dev/null 2>&1 &

# Wait for emulator to boot
echo "⏳ Waiting for emulator to boot..."
sleep 5

# Check if emulator is booting
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

# Wait for emulator to be fully booted
echo "⏳ Waiting for emulator to fully boot..."
adb wait-for-device
sleep 10

# Check final status
if adb devices | grep -q "device$"; then
    echo "✅ Emulator is ready!"
    echo ""
    adb devices
    echo ""
    echo "🎉 You can now run: npm run android"
else
    echo "⚠️  Emulator is starting but may not be fully ready yet"
    echo "Wait a bit more and check with: adb devices"
fi

