#!/bin/bash
# EAS Build Post-Install Hook
# This script renames the APK to HushRyd_v1.apk after the build

set -e

echo "📦 Renaming APK to HushRyd_v1.apk..."

# Find the generated APK in the release output directory
APK_DIR="android/app/build/outputs/apk/release"
if [ -d "$APK_DIR" ]; then
    # Find any APK file and rename it
    for apk_file in "$APK_DIR"/*.apk; do
        if [ -f "$apk_file" ]; then
            new_name="$APK_DIR/HushRyd_v1.apk"
            echo "   Renaming: $(basename "$apk_file") -> HushRyd_v1.apk"
            mv "$apk_file" "$new_name"
            echo "✅ APK renamed successfully to HushRyd_v1.apk"
            break
        fi
    done
else
    echo "⚠️  APK directory not found: $APK_DIR"
fi

