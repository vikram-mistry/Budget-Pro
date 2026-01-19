#!/bin/bash

# Budget Pro - Quick Install Script
# Run this to build and install the app to your connected iPhone via Xcode

echo "🚀 Budget Pro Quick Install"
echo "============================"

# Navigate to project
cd "/Users/vikram/projects/Antigravity Projects/Expense Tracker/Fintrack/ios/App"

# Check if iPhone is connected
echo "📱 Checking for connected devices..."
DEVICE=$(xcrun xctrace list devices 2>&1 | grep -i "iphone" | head -1)

if [ -z "$DEVICE" ]; then
    echo "❌ No iPhone detected. Please connect your device and try again."
    exit 1
fi

echo "✅ Found: $DEVICE"
echo ""

# Sync web files
echo "📂 Syncing web files..."
cd "/Users/vikram/projects/Antigravity Projects/Expense Tracker/Fintrack"
cp script.js ios/App/App/public/
cp style.css ios/App/App/public/
cp index.html ios/App/App/public/
echo "✅ Web files synced"

# Build and run
echo ""
echo "🔨 Building and installing..."
echo "   (This will open Xcode and build the app)"
echo ""

cd "/Users/vikram/projects/Antigravity Projects/Expense Tracker/Fintrack/ios/App"
xcodebuild -workspace App.xcworkspace -scheme App -destination "platform=iOS,name=iPhone" build 2>&1 | tail -5

echo ""
echo "✅ Build complete! Check Xcode for installation status."
echo ""
echo "💡 Tip: If the app doesn't launch, open Xcode and press ⌘+R"
