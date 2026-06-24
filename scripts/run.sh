#!/bin/bash
# Wrapper para correr npm/node tools en WSL cuando solo hay node de Windows.
# Sincroniza fuentes a un path nativo de Windows para evitar el problema de
# rutas UNC con esbuild, y luego ejecuta el comando deseado.
set -e

PROJECT_WIN="/mnt/c/Users/User/projects_tmp/salud"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NODE_WIN="/mnt/c/Program Files/nodejs/node.exe"

export HOME="/mnt/c/Users/User"

sync_to_win() {
  mkdir -p "$PROJECT_WIN"
  # Excluir node_modules y dist (se reconstruye en Windows path)
  rsync -a --delete \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='.git' \
    "$PROJECT_ROOT"/ "$PROJECT_WIN"/ >/dev/null
}

cmd="${1:-}"
shift || true

case "$cmd" in
  install)
    mkdir -p "$PROJECT_WIN"
    rsync -a --delete \
      --exclude='node_modules' --exclude='dist' --exclude='.git' \
      "$PROJECT_ROOT"/ "$PROJECT_WIN"/ >/dev/null
    cd "$PROJECT_WIN"
    "$NODE_WIN" "/mnt/c/Program Files/nodejs/npm.cmd" install "$@"
    ;;
  build)
    sync_to_win
    cd "$PROJECT_WIN"
    "$NODE_WIN" node_modules/vite/bin/vite.js build "$@"
    ;;
  dev)
    sync_to_win
    cd "$PROJECT_WIN"
    "$NODE_WIN" node_modules/vite/bin/vite.js "$@"
    ;;
  preview)
    sync_to_win
    cd "$PROJECT_WIN"
    "$NODE_WIN" node_modules/vite/bin/vite.js preview "$@"
    ;;
  typecheck)
    sync_to_win
    cd "$PROJECT_WIN"
    "$NODE_WIN" node_modules/typescript/bin/tsc --noEmit "$@"
    ;;
  sync)
    sync_to_win
    echo "Sincronizado a $PROJECT_WIN"
    ;;
  *)
    echo "Uso: $0 {install|build|dev|preview|typecheck|sync}"
    exit 1
    ;;
esac
