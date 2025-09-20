# Maintainer: Timer App Developer <developer@timerapp.com>
pkgname=timer-app
pkgver=1.1.2
pkgrel=1
pkgdesc="A feature-rich timer application with Electron and Picture-in-Picture mode"
install=${pkgname}.install
arch=('x86_64')
url="https://github.com/yourusername/timer-app"
license=('custom')
depends=('electron' 'gtk3' 'libxss' 'nss')
makedepends=('npm' 'nodejs')
provides=('timer-app')
conflicts=('timer-app')
source=()
sha256sums=()

build() {
    cd "$startdir"
    npm install
}

package() {
    # Create application directory
    install -d "$pkgdir/opt/$pkgname"
    install -d "$pkgdir/usr/bin"
    install -d "$pkgdir/usr/share/applications"
    install -d "$pkgdir/usr/share/pixmaps"
    # Icon theme directories
    for sz in 16 24 32 48 64 128 256 512; do
        install -d "$pkgdir/usr/share/icons/hicolor/${sz}x${sz}/apps"
    done
    
    # Copy application files from startdir
    cp -r "$startdir/src/" "$pkgdir/opt/$pkgname/"
    cp -r "$startdir/public/" "$pkgdir/opt/$pkgname/"
    cp "$startdir/package.json" "$pkgdir/opt/$pkgname/"
    cp "$startdir/package-lock.json" "$pkgdir/opt/$pkgname/"
    
    # Install node_modules (production only)
    cd "$pkgdir/opt/$pkgname"
    npm install --production --no-optional
    
    # Create launcher script
    cat > "$pkgdir/usr/bin/$pkgname" << EOF
#!/bin/bash
cd /opt/$pkgname
electron .
EOF
    chmod +x "$pkgdir/usr/bin/$pkgname"
    
    # Install icons (reuse the PNG for multiple sizes to ensure DEs can find something)
    for sz in 16 24 32 48 64 128 256 512; do
        install -Dm644 "$startdir/public/assets/icon.png" "$pkgdir/usr/share/icons/hicolor/${sz}x${sz}/apps/$pkgname.png"
    done
    # Also place a pixmaps icon for DEs that look there
    install -Dm644 "$startdir/public/assets/icon.png" "$pkgdir/usr/share/pixmaps/$pkgname.png"
    
    # Install desktop file with WMClass for proper dock grouping
    cat > "$pkgdir/usr/share/applications/$pkgname.desktop" << EOF
[Desktop Entry]
Name=Timer App
Comment=A feature-rich timer application with Picture-in-Picture mode
Exec=$pkgname
Icon=$pkgname
Type=Application
Categories=Utility;Office;
Keywords=timer;pomodoro;productivity;
StartupNotify=true
StartupWMClass=Timer App
EOF
}
