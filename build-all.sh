#!/bin/bash

echo "🚀 Building Timer App for all platforms..."
echo "================================================"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/

# Build for Linux
echo "🐧 Building for Linux..."
npm run build-linux
if [ $? -eq 0 ]; then
    echo "✅ Linux build completed successfully!"
else
    echo "❌ Linux build failed!"
fi

# Build for Windows (if on Linux/Mac with wine)
echo "🪟 Building for Windows..."
npm run build-win
if [ $? -eq 0 ]; then
    echo "✅ Windows build completed successfully!"
else
    echo "❌ Windows build failed (wine might not be installed)!"
fi

# Build for macOS (only works on macOS)
echo "🍎 Building for macOS..."
npm run build-mac
if [ $? -eq 0 ]; then
    echo "✅ macOS build completed successfully!"
else
    echo "❌ macOS build failed (only works on macOS)!"
fi

echo "================================================"
echo "📦 Build process completed!"
echo "📁 Check the 'dist/' folder for your packaged apps"

# Show what was built
echo ""
echo "Built files:"
ls -la dist/ | grep -E '\.(AppImage|exe|dmg|deb)$'
