#!/usr/bin/env bash
set -euo pipefail

APP_ID="timer-app"
APP_NAME="Timer App"
REPO_DIR="$(pwd)"

usage() {
  cat <<'EOF'
Usage:
  ./install.sh [command] [options]

Commands:
  install            Install (default)
  update             Reinstall over an existing installation
  uninstall          Remove the installed app

Options:
  --system           Install system-wide (/opt, /usr/local, /usr/share). Requires sudo.
  --user             Install for current user (~/.local). (default)
  --no-deps          Do not attempt to install OS dependencies.
  -h, --help         Show this help.

Notes:
  - This installer installs the app as an Electron source app that runs with the system 'electron' binary.
  - You must have Node.js + npm and Electron available.
EOF
}

COMMAND="install"
SCOPE="user"
INSTALL_DEPS=1

while [[ ${1:-} != "" ]]; do
  case "$1" in
    install|update|uninstall) COMMAND="$1"; shift ;;
    --system) SCOPE="system"; shift ;;
    --user) SCOPE="user"; shift ;;
    --no-deps) INSTALL_DEPS=0; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1"; echo; usage; exit 2 ;;
  esac
done

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Error: missing required command: $1" >&2
    exit 1
  }
}

is_root() {
  [[ "$(id -u)" -eq 0 ]]
}

have_sudo() {
  command -v sudo >/dev/null 2>&1
}

run_as_root() {
  if is_root; then
    "$@"
  else
    if ! have_sudo; then
      echo "Error: sudo not found (needed for --system)." >&2
      exit 1
    fi
    sudo "$@"
  fi
}

ensure_repo_sane() {
  if [[ ! -f "$REPO_DIR/package.json" ]]; then
    echo "Error: package.json not found. Run this from the project root." >&2
    exit 1
  fi
  if [[ ! -d "$REPO_DIR/src" ]] || [[ ! -d "$REPO_DIR/public" ]]; then
    echo "Error: expected ./src and ./public folders. Run this from the project root." >&2
    exit 1
  fi
}

detect_pm() {
  if command -v pacman >/dev/null 2>&1; then echo pacman; return; fi
  if command -v apt-get >/dev/null 2>&1; then echo apt; return; fi
  if command -v dnf >/dev/null 2>&1; then echo dnf; return; fi
  if command -v zypper >/dev/null 2>&1; then echo zypper; return; fi
  if command -v apk >/dev/null 2>&1; then echo apk; return; fi
  echo none
}

install_os_deps() {
  [[ "$INSTALL_DEPS" -eq 1 ]] || return 0

  local pm
  pm="$(detect_pm)"

  echo "Installing OS dependencies (best-effort). Package manager: $pm"

  case "$pm" in
    pacman)
      run_as_root pacman -Sy --needed --noconfirm nodejs npm electron gtk3 libxss nss || true
      ;;
    apt)
      run_as_root apt-get update || true
      run_as_root apt-get install -y nodejs npm || true
      echo "Note: Debian/Ubuntu may not ship a recent 'electron' in apt. If 'electron' isn't found, install it via your distro or use an AppImage build." >&2
      ;;
    dnf)
      run_as_root dnf install -y nodejs npm || true
      echo "Note: Fedora may not include 'electron' by default. Ensure an 'electron' binary is available." >&2
      ;;
    zypper)
      run_as_root zypper -n install nodejs npm || true
      echo "Note: Ensure an 'electron' binary is available on your distro." >&2
      ;;
    apk)
      run_as_root apk add --no-cache nodejs npm || true
      echo "Note: Ensure an 'electron' binary is available on your distro." >&2
      ;;
    none)
      echo "No supported package manager detected. Skipping dependency installation." >&2
      ;;
  esac
}

paths_for_scope() {
  if [[ "$SCOPE" == "system" ]]; then
    APP_DIR="/opt/$APP_ID"
    BIN_DIR="/usr/local/bin"
    APPLICATIONS_DIR="/usr/share/applications"
    ICON_BASE_DIR="/usr/share/icons/hicolor"
  else
    APP_DIR="$HOME/.local/opt/$APP_ID"
    BIN_DIR="$HOME/.local/bin"
    APPLICATIONS_DIR="$HOME/.local/share/applications"
    ICON_BASE_DIR="$HOME/.local/share/icons/hicolor"
  fi
}

install_files() {
  ensure_repo_sane
  paths_for_scope

  need_cmd npm

  if ! command -v electron >/dev/null 2>&1; then
    echo "Error: 'electron' binary not found in PATH." >&2
    echo "- Arch: sudo pacman -S electron" >&2
    echo "- Other distros: install Electron from your distro, or build and install an AppImage via electron-builder." >&2
    exit 1
  fi

  if [[ "$SCOPE" == "system" ]]; then
    run_as_root mkdir -p "$APP_DIR" "$BIN_DIR" "$APPLICATIONS_DIR" "$ICON_BASE_DIR" || true
  else
    mkdir -p "$APP_DIR" "$BIN_DIR" "$APPLICATIONS_DIR" "$ICON_BASE_DIR" || true
  fi

  echo "Copying app files to: $APP_DIR"

  if [[ "$SCOPE" == "system" ]]; then
    run_as_root rm -rf "$APP_DIR" || true
    run_as_root mkdir -p "$APP_DIR"
    run_as_root cp -r "$REPO_DIR/src" "$APP_DIR/"
    run_as_root cp -r "$REPO_DIR/public" "$APP_DIR/"
    run_as_root cp "$REPO_DIR/package.json" "$APP_DIR/"
    [[ -f "$REPO_DIR/package-lock.json" ]] && run_as_root cp "$REPO_DIR/package-lock.json" "$APP_DIR/" || true
  else
    rm -rf "$APP_DIR" || true
    mkdir -p "$APP_DIR"
    cp -r "$REPO_DIR/src" "$APP_DIR/"
    cp -r "$REPO_DIR/public" "$APP_DIR/"
    cp "$REPO_DIR/package.json" "$APP_DIR/"
    [[ -f "$REPO_DIR/package-lock.json" ]] && cp "$REPO_DIR/package-lock.json" "$APP_DIR/" || true
  fi

  echo "Installing production npm dependencies in: $APP_DIR"
  if [[ "$SCOPE" == "system" ]]; then
    run_as_root bash -lc "cd '$APP_DIR' && npm install --production --no-optional"
  else
    (cd "$APP_DIR" && npm install --production --no-optional)
  fi

  echo "Creating launcher: $BIN_DIR/$APP_ID"
  local launcher
  launcher="#!/usr/bin/env bash\nset -e\ncd '$APP_DIR'\nexec electron . \"$@\"\n"

  if [[ "$SCOPE" == "system" ]]; then
    printf "%b" "$launcher" | run_as_root tee "$BIN_DIR/$APP_ID" >/dev/null
    run_as_root chmod +x "$BIN_DIR/$APP_ID"
  else
    printf "%b" "$launcher" > "$BIN_DIR/$APP_ID"
    chmod +x "$BIN_DIR/$APP_ID"
  fi

  echo "Installing desktop entry"
  local desktop
  desktop="[Desktop Entry]\nName=$APP_NAME\nComment=A feature-rich timer application with Picture-in-Picture mode\nExec=$APP_ID\nIcon=$APP_ID\nType=Application\nCategories=Utility;Office;\nKeywords=timer;pomodoro;productivity;\nStartupNotify=true\nStartupWMClass=Timer App\n"

  if [[ "$SCOPE" == "system" ]]; then
    printf "%b" "$desktop" | run_as_root tee "$APPLICATIONS_DIR/$APP_ID.desktop" >/dev/null
  else
    printf "%b" "$desktop" > "$APPLICATIONS_DIR/$APP_ID.desktop"
  fi

  if [[ -f "$REPO_DIR/public/assets/icon.png" ]]; then
    for sz in 16 24 32 48 64 128 256 512; do
      local icon_dir
      icon_dir="$ICON_BASE_DIR/${sz}x${sz}/apps"
      if [[ "$SCOPE" == "system" ]]; then
        run_as_root mkdir -p "$icon_dir"
        run_as_root install -m 0644 "$REPO_DIR/public/assets/icon.png" "$icon_dir/$APP_ID.png"
      else
        mkdir -p "$icon_dir"
        install -m 0644 "$REPO_DIR/public/assets/icon.png" "$icon_dir/$APP_ID.png"
      fi
    done
  else
    echo "Warning: icon not found at public/assets/icon.png (desktop entry will still be created)." >&2
  fi

  if [[ "$SCOPE" == "system" ]]; then
    run_as_root bash -lc "command -v gtk-update-icon-cache >/dev/null 2>&1 && gtk-update-icon-cache -q /usr/share/icons/hicolor || true"
    run_as_root bash -lc "command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database -q || true"
  else
    command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "$HOME/.local/share/applications" >/dev/null 2>&1 || true
  fi

  echo
  echo "Installed $APP_NAME ($SCOPE scope)."
  echo "Run: $APP_ID"
  if [[ "$SCOPE" == "user" ]]; then
    if [[ ":${PATH}:" != *":$HOME/.local/bin:"* ]]; then
      echo "Note: '$HOME/.local/bin' is not in PATH in this shell. Log out/in or add it to your shell profile." >&2
    fi
  fi
}

uninstall_files() {
  paths_for_scope

  echo "Removing installation ($SCOPE scope)"

  if [[ "$SCOPE" == "system" ]]; then
    run_as_root rm -rf "$APP_DIR" || true
    run_as_root rm -f "$BIN_DIR/$APP_ID" || true
    run_as_root rm -f "$APPLICATIONS_DIR/$APP_ID.desktop" || true
    for sz in 16 24 32 48 64 128 256 512; do
      run_as_root rm -f "$ICON_BASE_DIR/${sz}x${sz}/apps/$APP_ID.png" || true
    done
    run_as_root bash -lc "command -v gtk-update-icon-cache >/dev/null 2>&1 && gtk-update-icon-cache -q /usr/share/icons/hicolor || true"
    run_as_root bash -lc "command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database -q || true"
  else
    rm -rf "$APP_DIR" || true
    rm -f "$BIN_DIR/$APP_ID" || true
    rm -f "$APPLICATIONS_DIR/$APP_ID.desktop" || true
    for sz in 16 24 32 48 64 128 256 512; do
      rm -f "$ICON_BASE_DIR/${sz}x${sz}/apps/$APP_ID.png" || true
    done
    command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "$HOME/.local/share/applications" >/dev/null 2>&1 || true
  fi

  echo "Uninstalled $APP_NAME."
}

main() {
  install_os_deps

  case "$COMMAND" in
    install) install_files ;;
    update) install_files ;;
    uninstall) uninstall_files ;;
    *) usage; exit 2 ;;
  esac
}

main
