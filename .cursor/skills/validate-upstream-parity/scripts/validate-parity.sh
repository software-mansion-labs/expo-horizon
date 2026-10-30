#!/usr/bin/env bash
# Compare against committed upstream sources without modifying either checkout.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
UPSTREAM="${1:-}"
REF="${2:-}"

if [[ "$REF" == '--restore' ]]; then
  echo 'This helper is now read-only; no restore was performed.' >&2
  echo 'Review any changes left by an older helper separately before discarding them.' >&2
  exit 2
fi
if [[ $# -ne 2 || -z "$UPSTREAM" || -z "$REF" ]]; then
  echo "Usage: $0 <path-to-expo-repo> <git-ref-or-commit>" >&2
  exit 2
fi
if ! COMMIT="$(git -C "$UPSTREAM" rev-parse --verify "${REF}^{commit}" 2>/dev/null)"; then
  echo "Cannot resolve upstream ref: $REF" >&2
  exit 2
fi

SCRATCH="$(mktemp -d "${TMPDIR:-/tmp}/horizon-parity.XXXXXX")"
trap 'rm -rf "$SCRATCH"' EXIT
mkdir -p "$SCRATCH/upstream" "$SCRATCH/local"
PKGS=(
  'expo-horizon-location:packages/expo-location'
  'expo-horizon-notifications:packages/expo-notifications'
)
if ! git -C "$UPSTREAM" archive "$COMMIT" packages/expo-location packages/expo-notifications | tar -xf - -C "$SCRATCH/upstream"; then
  echo 'Cannot read upstream package sources at the selected commit.' >&2
  exit 2
fi

# Validate every input before comparing; missing package trees are not a pass.
for entry in "${PKGS[@]}"; do
  local_root="$REPO_ROOT/${entry%%:*}"
  up_root="$SCRATCH/upstream/${entry#*:}"
  for tree in ios android/src/main src; do
    if [[ ! -d "$local_root/$tree" || ! -d "$up_root/$tree" ]]; then
      echo "Missing comparison tree: ${entry%%:*}/$tree" >&2
      exit 2
    fi
  done
  comparison="$SCRATCH/local/${entry#*:}"
  mkdir -p "$comparison/android/src"
  cp -R "$local_root/ios" "$comparison/ios"
  cp -R "$local_root/src" "$comparison/src"
  cp -R "$local_root/android/src/main" "$comparison/android/src/main"
  if [[ -d "$local_root/android/src/mobile" ]]; then
    cp -R "$local_root/android/src/mobile/." "$comparison/android/src/main/"
  fi
done

native_result=0
compare_tree() {
  local tree="$1" kind="$2" diff_status=0
  # Relative paths keep the report independent of random temporary directories.
  (cd "$SCRATCH" && diff -ru "upstream/$tree" "local/$tree") || diff_status=$?
  if [[ "$diff_status" -gt 1 ]]; then
    echo "Comparison failed: $tree" >&2
    exit 2
  fi
  if [[ "$kind" == native && "$diff_status" -eq 1 ]]; then
    native_result=1
  fi
}

printf 'Upstream commit: %s\n' "$COMMIT"
for entry in "${PKGS[@]}"; do
  printf '\n### %s — NATIVE (expect no diff)\n' "${entry%%:*}"
  compare_tree "${entry#*:}/ios" native
  compare_tree "${entry#*:}/android/src/main" native
  printf '\n### %s — TYPESCRIPT src/ (review every diff)\n' "${entry%%:*}"
  compare_tree "${entry#*:}/src" typescript
done
printf '\nNative comparison exit status: %s; both checkouts left untouched.\n' "$native_result"
exit "$native_result"
