#!/bin/bash
# Script to list all available Android Virtual Devices

export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools

echo "📱 Available Android Virtual Devices (AVDs):"
echo ""

AVDS=$($ANDROID_HOME/emulator/emulator -list-avds 2>/dev/null)

if [ -z "$AVDS" ]; then
    echo "❌ No AVDs found!"
    echo ""
    echo "To create an AVD:"
    echo "1. Open Android Studio"
    echo "2. Go to More Actions → Virtual Device Manager"
    echo "3. Click 'Create Device'"
    exit 1
fi

echo "$AVDS"
echo ""

# Check running emulators
echo "🖥️  Running emulators:"
RUNNING=$(adb devices | grep "emulator" | grep "device$")
if [ -z "$RUNNING" ]; then
    echo "   None (no emulators currently running)"
else
    echo "$RUNNING"
fi

