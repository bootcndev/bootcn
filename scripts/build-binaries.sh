#!/usr/bin/env bash
# Builds standalone bootcn executables (no Node.js needed to run them) with
# Bun, which compiles the CLI and its dependencies into one file per
# platform from a single machine.
#
#   scripts/build-binaries.sh [out-dir] [target ...]
#
# Targets default to every platform we publish. Writes SHA256SUMS too.
set -euo pipefail

out="${1:-dist-bin}"
shift || true
targets=("$@")
if [ "${#targets[@]}" -eq 0 ]; then
  targets=(linux-x64 linux-arm64 darwin-x64 darwin-arm64 windows-x64)
fi

mkdir -p "$out"
for target in "${targets[@]}"; do
  name="bootcn-${target}"
  [ "${target%%-*}" = "windows" ] && name="${name}.exe"
  echo "Building ${name}"
  bun build packages/cli/src/index.ts \
    --compile --minify --sourcemap=none \
    --target="bun-${target}" \
    --outfile "${out}/${name}"
done

(
  cd "$out"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum bootcn-* > SHA256SUMS
  else
    shasum -a 256 bootcn-* > SHA256SUMS
  fi
)
echo "Done:"
ls -la "$out"
