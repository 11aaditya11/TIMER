# Maintainer: Timer App Developer <developer@timerapp.com>
pkgname=timer-app
pkgver=1.1.2
pkgrel=1
pkgdesc="A feature-rich timer application with Electron and Picture-in-Picture mode"
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
    install -d "$pkgdir/usr/share/icons/hicolor/256x256/apps"
    
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
    
    # Install icon
    install -Dm644 "$startdir/public/assets/icon.png" "$pkgdir/usr/share/icons/hicolor/256x256/apps/$pkgname.png"
    
    # Install desktop file
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
EOF
}
