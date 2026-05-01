#!/usr/bin/env bash
# Build calendar_service as a Linux binary for Render (same OS/glibc as the server).
#
# Render runs Linux x86_64. Building on native Windows (MSVC/Clang) cannot produce
# that binary—use WSL (recommended: Ubuntu 22.04) or any Linux x86_64 machine.
#
# One-time in WSL: sudo apt-get update && sudo apt-get install -y cmake build-essential
# Then from repo root:  bash cpp-service/build-for-render.sh
# Commit:                git add cpp-service/build/calendar_service && git commit -m "Update calendar_service for Render"

set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

if [[ "$(uname -s)" != Linux ]]; then
  echo "error: run this script under Linux or WSL (uname reports a non-Linux OS)." >&2
  exit 1
fi

cmake -S . -B build
cmake --build build
echo "Built $ROOT/build/calendar_service — add and commit that file for Render."
