#!/bin/bash

# Timer App Installation Script
# This script builds and installs the Timer App using pacman

set -e

echo "🔧 Building Timer App package..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the Timer app directory."
    exit 1
fi

# Check if PKGBUILD exists
if [ ! -f "PKGBUILD" ]; then
    echo "❌ Error: PKGBUILD not found. Please ensure PKGBUILD is in the current directory."
    exit 1
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf pkg/ *.pkg.tar.xz *.pkg.tar.zst 2>/dev/null || true

# Build the package
echo "📦 Building package with makepkg..."
makepkg -sf

# Find the built package
PACKAGE=$(ls *.pkg.tar.* 2>/dev/null | head -n1)

if [ -z "$PACKAGE" ]; then
    echo "❌ Error: No package file found after build."
    exit 1
fi

echo "📦 Package built: $PACKAGE"

# Remove existing installation if it exists
if pacman -Q timer-app &>/dev/null; then
    echo "🔄 Removing existing Timer App installation..."
    sudo pacman -R timer-app --noconfirm
fi

# Install the package
echo "🚀 Installing Timer App..."
sudo pacman -U "$PACKAGE" --noconfirm --overwrite '*'

echo "✅ Timer App installed successfully!"
echo "🎯 You can now find 'Timer App' in your application menu/drawer"
echo "🖥️  Or run 'timer-app' from the terminal"

# Update desktop database
echo "🔄 Updating desktop database..."
sudo update-desktop-database 2>/dev/null || true

echo "🎉 Installation complete! Enjoy your Timer App!"
