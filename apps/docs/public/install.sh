#!/bin/sh
# Installs the standalone bootcn executable (no Node.js needed).
#
#   curl -fsSL https://bootcn.dev/install.sh | sh
#
# Options (environment variables):
#   BOOTCN_VERSION   a CLI version such as 0.6.0 (default: the latest)
#   BOOTCN_INSTALL   where to put it (default: $HOME/.local/bin)
#
# The download is checked against the release's SHA256SUMS before it is
# installed. Read this script first if you like: it only downloads two
# files from github.com/bootcndev/bootcn and copies one into place.
set -eu

REPO="bootcndev/bootcn"
INSTALL_DIR="${BOOTCN_INSTALL:-$HOME/.local/bin}"

fail() {
  printf 'bootcn install: %s\n' "$1" >&2
  exit 1
}

need() {
  command -v "$1" >/dev/null 2>&1 || fail "$1 is required"
}

need curl
need uname

case "$(uname -s)" in
  Linux) os="linux" ;;
  Darwin) os="darwin" ;;
  *) fail "unsupported system $(uname -s). On Windows, download bootcn-windows-x64.exe from https://github.com/$REPO/releases" ;;
esac

case "$(uname -m)" in
  x86_64 | amd64) arch="x64" ;;
  arm64 | aarch64) arch="arm64" ;;
  *) fail "unsupported processor $(uname -m)" ;;
esac

# An Intel build of a shell on Apple silicon still gets the native binary.
if [ "$os" = "darwin" ] && [ "$arch" = "x64" ] && [ "$(sysctl -n sysctl.proc_translated 2>/dev/null || echo 0)" = "1" ]; then
  arch="arm64"
fi

if [ -n "${BOOTCN_VERSION:-}" ]; then
  version="${BOOTCN_VERSION#v}"
else
  version="$(curl -fsSL "https://api.github.com/repos/$REPO/releases?per_page=30" |
    grep -o '"tag_name": *"cli-v[0-9][^"]*"' | head -n 1 | sed 's/.*"cli-v\([^"]*\)"/\1/')"
  [ -n "$version" ] || fail "could not find the latest version; set BOOTCN_VERSION"
fi

asset="bootcn-$os-$arch"
# BOOTCN_BASE_URL is for tests (a local copy of the release files).
base="${BOOTCN_BASE_URL:-https://github.com/$REPO/releases/download}/cli-v$version"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT INT TERM

printf 'Downloading bootcn %s for %s-%s\n' "$version" "$os" "$arch"
curl -fsSL "$base/$asset" -o "$tmp/$asset" ||
  fail "bootcn $version has no $asset download (standalone executables start with 0.6.0)"
curl -fsSL "$base/SHA256SUMS" -o "$tmp/SHA256SUMS" || fail "could not download SHA256SUMS"

expected="$(grep " $asset\$" "$tmp/SHA256SUMS" | cut -d ' ' -f 1)"
[ -n "$expected" ] || fail "$asset is not listed in SHA256SUMS"
if command -v sha256sum >/dev/null 2>&1; then
  actual="$(sha256sum "$tmp/$asset" | cut -d ' ' -f 1)"
else
  actual="$(shasum -a 256 "$tmp/$asset" | cut -d ' ' -f 1)"
fi
[ "$actual" = "$expected" ] || fail "checksum mismatch for $asset; nothing was installed"

mkdir -p "$INSTALL_DIR"
chmod +x "$tmp/$asset"
mv "$tmp/$asset" "$INSTALL_DIR/bootcn"

printf 'Installed %s\n' "$INSTALL_DIR/bootcn"
case ":$PATH:" in
  *":$INSTALL_DIR:"*) "$INSTALL_DIR/bootcn" --version >/dev/null && printf 'Run: bootcn init\n' ;;
  *) printf 'Add %s to your PATH, for example:\n  echo '\''export PATH="%s:$PATH"'\'' >> ~/.profile\n' "$INSTALL_DIR" "$INSTALL_DIR" ;;
esac
