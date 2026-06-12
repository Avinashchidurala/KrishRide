#!/bin/bash
# Quick script to start Android emulator

export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools

# Check if emulator is already running
if adb devices | grep -q "emulator.*device$"; then
    echo "✅ Emulator is already running!"
    adb devices
    exit 0
fi

# List available AVDs
AVDS=$($ANDROID_HOME/emulator/emulator -list-avds 2>/dev/null)

if [ -z "$AVDS" ]; then
    echo "❌ No AVDs found!"
    echo "Please create an AVD using Android Studio"
    exit 1
fi

# Use first AVD or specified one
AVD_NAME=${1:-$(echo "$AVDS" | head -n 1)}

echo "🚀 Starting emulator: $AVD_NAME"
$ANDROID_HOME/emulator/emulator -avd "$AVD_NAME" > /dev/null 2>&1 &

echo "⏳ Waiting for emulator to boot..."
sleep 5

# Wait for device
adb wait-for-device
sleep 10

echo "✅ Emulator is ready!"
adb devices
