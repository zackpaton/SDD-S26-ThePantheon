#!/usr/bin/env bash
# Run clang-tidy on all cpp-service translation units using build/compile_commands.json.
#
# Prepends -isystem for nlohmann/json so clang-tidy matches the compiler's "system"
# headers (compile_commands alone is not always enough). Project code includes JSON
# only via include/nlohmann_json_include.hpp (#pragma system_header).
#
# Usage: bash cpp-service/run-clang-tidy.sh [--fix] [other clang-tidy flags...]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD="${ROOT}/build"

if [[ ! -f "${BUILD}/compile_commands.json" ]]; then
  echo "Missing ${BUILD}/compile_commands.json"
  echo "Configure and build first:"
  echo "  cd \"${ROOT}\" && mkdir -p build && cd build && cmake .. && cmake --build ."
  exit 1
fi

JSON_INC=""
if [[ -f "${ROOT}/third_party/json/include/nlohmann/json.hpp" ]]; then
  JSON_INC="${ROOT}/third_party/json/include"
elif [[ -f "${BUILD}/_deps/nlohmann_json-src/include/nlohmann/json.hpp" ]]; then
  JSON_INC="${BUILD}/_deps/nlohmann_json-src/include"
fi

TIDY_EXTRA=()
if [[ -n "${JSON_INC}" ]]; then
  TIDY_EXTRA+=(--extra-arg-before=-isystem"${JSON_INC}")
fi

find "${ROOT}/src" -name '*.cpp' -print0 | sort -z |
  xargs -0 clang-tidy -p "${BUILD}" "${TIDY_EXTRA[@]}" "$@"
