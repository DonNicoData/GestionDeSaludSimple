#!/bin/bash
# Setup del entorno Android para Fase 10 en WSL.
# Source este archivo desde tu shell: `source scripts/android-env.sh`
# Después podés correr `./scripts/run.sh build && cd android && ./gradlew assembleDebug`
#
# Todo el toolchain vive en $HOME (no requiere sudo):
#   - ~/jdk-21/        → Temurin 21 (Capacitor 7.6.8+ requiere 21, no 17)
#   - ~/android-sdk/   → platform-tools, platforms;android-35, build-tools;35.0.0
#
# Este script es idempotente: lo podés correr todas las veces que quieras.

# Java 21
export JAVA_HOME="$HOME/jdk-21"
if [ ! -x "$JAVA_HOME/bin/java" ]; then
  echo "ERROR: no se encontró Java en $JAVA_HOME"
  echo "Volvé a correr el setup de Fase 10 (ver MILESTONES v0.10.0-fase10-final)."
  return 1 2>/dev/null || exit 1
fi

# Android SDK
export ANDROID_HOME="$HOME/android-sdk"
if [ ! -d "$ANDROID_HOME/platforms/android-35" ]; then
  echo "ERROR: no se encontró platform android-35 en $ANDROID_HOME"
  echo "Volvé a correr el setup de Fase 10 (ver MILESTONES v0.10.0-fase10-final)."
  return 1 2>/dev/null || exit 1
fi

# PATH (JDK antes que /usr/bin, SDK después)
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

# Crear android/local.properties si no existe (no se commitea, está en .gitignore)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ ! -f "$PROJECT_ROOT/android/local.properties" ]; then
  echo "sdk.dir=$ANDROID_HOME" > "$PROJECT_ROOT/android/local.properties"
  echo "✓ Creado android/local.properties con sdk.dir=$ANDROID_HOME"
fi

# Verificación rápida
echo "=== Entorno Android listo ==="
echo "Java:       $(java -version 2>&1 | head -1)"
echo "JAVA_HOME:  $JAVA_HOME"
echo "ANDROID_HOME: $ANDROID_HOME"
echo "adb:        $(which adb)"
echo "sdkmanager: $(which sdkmanager)"
echo ""
echo "Para rebuildear el APK:"
echo "  cd $PROJECT_ROOT"
echo "  ./scripts/run.sh build"
echo "  rsync -a --delete /mnt/c/Users/User/projects_tmp/salud/dist/ dist/"
echo "  cd android && ./gradlew assembleDebug"
echo ""
echo "APK queda en: android/app/build/outputs/apk/debug/app-debug.apk"
