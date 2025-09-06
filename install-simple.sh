#!/bin/bash

# Simple Timer App Installation Script
# This script installs the Timer App directly to the system without packaging

set -e

APP_NAME="timer-app"
INSTALL_DIR="/opt/$APP_NAME"
BIN_DIR="/usr/local/bin"
DESKTOP_DIR="/usr/share/applications"
ICON_DIR="/usr/share/icons/hicolor/256x256/apps"

echo "🔧 Installing Timer App to system..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the Timer app directory."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create installation directories
echo "📁 Creating installation directories..."
sudo mkdir -p "$INSTALL_DIR"
sudo mkdir -p "$BIN_DIR"
sudo mkdir -p "$DESKTOP_DIR"
sudo mkdir -p "$ICON_DIR"

# Remove existing installation if it exists
if [ -d "$INSTALL_DIR" ]; then
    echo "🔄 Removing existing Timer App installation..."
    sudo rm -rf "$INSTALL_DIR"
fi

# Copy application files
echo "📋 Copying application files..."
sudo cp -r src/ "$INSTALL_DIR/"
sudo cp -r public/ "$INSTALL_DIR/"
sudo cp package.json "$INSTALL_DIR/"
sudo cp package-lock.json "$INSTALL_DIR/"

# Install production dependencies
echo "📦 Installing production dependencies..."
cd "$INSTALL_DIR"
sudo npm install --production --no-optional

# Create launcher script
echo "🚀 Creating launcher script..."
sudo tee "$BIN_DIR/$APP_NAME" > /dev/null << EOF
#!/bin/bash
cd "$INSTALL_DIR"
electron .
EOF

sudo chmod +x "$BIN_DIR/$APP_NAME"

# Install icon
echo "🎨 Installing icon..."
sudo cp "$INSTALL_DIR/public/assets/icon.png" "$ICON_DIR/$APP_NAME.png"

# Create desktop file
echo "🖥️  Creating desktop entry..."
sudo tee "$DESKTOP_DIR/$APP_NAME.desktop" > /dev/null << EOF
[Desktop Entry]
Name=Timer App
Comment=A feature-rich timer application with Picture-in-Picture mode
Exec=$APP_NAME
Icon=$APP_NAME
Type=Application
Categories=Utility;Office;
Keywords=timer;pomodoro;productivity;
StartupNotify=true
EOF

# Update desktop database
echo "🔄 Updating desktop database..."
sudo update-desktop-database 2>/dev/null || true

echo "✅ Timer App installed successfully!"
echo "🎯 You can now find 'Timer App' in your application menu/drawer"
echo "🖥️  Or run '$APP_NAME' from the terminal"
echo "🎉 Installation complete!"
