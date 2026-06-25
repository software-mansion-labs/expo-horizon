#!/usr/bin/env bash
#
# Validate that this repo's fork of expo-location & expo-notifications matches
# upstream expo/expo, accounting for the Android quest/mobile flavor split.
#
# Per package, in the UPSTREAM working copy:
#   - replace ios/ with the local ios/
#   - rebuild android/src/main from local src/main + src/mobile (exclude quest)
#   - replace TypeScript src/ with the local src/
# then `git diff` shows what differs. Nothing in THIS repo is changed.
#
# Usage:
#   validate-parity.sh <upstream-path>            # show the diff
#   validate-parity.sh <upstream-path> --restore  # undo, leave upstream clean
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"

UPSTREAM="${1:-}"
MODE="${2:-}"

if [ -z "${UPSTREAM}" ] || [ ! -d "${UPSTREAM}/packages/expo-location" ]; then
    echo "Usage: $0 <path-to-expo/expo> [--restore]" >&2
    exit 1
fi

# local-dir : upstream-package-path
PKGS=(
    "expo-horizon-location:packages/expo-location"
    "expo-horizon-notifications:packages/expo-notifications"
)

if [ "${MODE}" = "--restore" ]; then
    for entry in "${PKGS[@]}"; do
        up="${entry#*:}"
        git -C "${UPSTREAM}" checkout -- "${up}" 2>/dev/null || true
        git -C "${UPSTREAM}" clean -fdq -- "${up}" 2>/dev/null || true
    done
    echo "Restored upstream working tree."
    exit 0
fi

for entry in "${PKGS[@]}"; do
    local_root="${REPO_ROOT}/${entry%%:*}"
    up_root="${UPSTREAM}/${entry#*:}"

    # iOS: straight replace
    rm -rf "${up_root}/ios"
    [ -d "${local_root}/ios" ] && cp -R "${local_root}/ios" "${up_root}/ios"

    # Android: rebuild src/main from local main + mobile (quest excluded)
    if [ -d "${local_root}/android/src/main" ]; then
        rm -rf "${up_root}/android/src/main"
        mkdir -p "${up_root}/android/src/main"
        cp -R "${local_root}/android/src/main/." "${up_root}/android/src/main/"
        [ -d "${local_root}/android/src/mobile" ] && \
            cp -R "${local_root}/android/src/mobile/." "${up_root}/android/src/main/"
    fi

    # TypeScript src/: straight replace
    rm -rf "${up_root}/src"
    [ -d "${local_root}/src" ] && cp -R "${local_root}/src" "${up_root}/src"

    echo
    echo "### ${entry%%:*} — NATIVE (expect no diff)"
    git -C "${UPSTREAM}" diff -- "${entry#*:}/ios" "${entry#*:}/android/src/main" || true
    echo
    echo "### ${entry%%:*} — TYPESCRIPT src/ (review unexpected diffs)"
    git -C "${UPSTREAM}" diff -- "${entry#*:}/src" || true
done

echo
echo "Done. Undo with: $0 \"${UPSTREAM}\" --restore"
