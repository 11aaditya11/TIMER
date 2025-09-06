#!/bin/bash

# Timer App Update Script
# This script updates the Timer App to the latest version

set -e

APP_NAME="timer-app"
INSTALL_DIR="/opt/$APP_NAME"

echo "🔄 Updating Timer App..."

# Check if app is currently installed
if [ ! -d "$INSTALL_DIR" ]; then
    echo "❌ Timer App is not currently installed. Use install-simple.sh to install it first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the Timer app directory."
    exit 1
fi

# Get current and new versions
if [ -f "$INSTALL_DIR/package.json" ]; then
    CURRENT_VERSION=$(grep '"version"' "$INSTALL_DIR/package.json" | sed 's/.*"version": "\(.*\)".*/\1/')
    echo "📋 Current version: $CURRENT_VERSION"
fi

NEW_VERSION=$(grep '"version"' package.json | sed 's/.*"version": "\(.*\)".*/\1/')
echo "📋 New version: $NEW_VERSION"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Stop any running instances (optional)
echo "🛑 Stopping any running Timer App instances..."
pkill -f "timer-app" 2>/dev/null || true
pkill -f "electron.*timer" 2>/dev/null || true

# Backup current installation (optional)
if [ -d "$INSTALL_DIR" ]; then
    echo "💾 Creating backup of current installation..."
    sudo cp -r "$INSTALL_DIR" "$INSTALL_DIR.backup.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
fi

# Remove current installation
echo "🗑️  Removing current installation..."
sudo rm -rf "$INSTALL_DIR"

# Copy new files
echo "📋 Installing new version..."
sudo mkdir -p "$INSTALL_DIR"
sudo cp -r src/ "$INSTALL_DIR/"
sudo cp -r public/ "$INSTALL_DIR/"
sudo cp package.json "$INSTALL_DIR/"
sudo cp package-lock.json "$INSTALL_DIR/"

# Install production dependencies
echo "📦 Installing production dependencies..."
cd "$INSTALL_DIR"
sudo npm install --production --no-optional

# Update desktop database
echo "🔄 Updating desktop database..."
sudo update-desktop-database 2>/dev/null || true

echo "✅ Timer App updated successfully!"
echo "📋 Updated from version $CURRENT_VERSION to $NEW_VERSION"
echo "🎯 You can now launch the updated Timer App from your application menu"
echo "🖥️  Or run 'timer-app' from the terminal"
