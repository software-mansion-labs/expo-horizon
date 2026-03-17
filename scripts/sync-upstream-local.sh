#!/usr/bin/env bash
#
# Pull upstream expo-location & expo-notifications changes into the working tree.
#
# What it does:
#   1. Shallow-clones the two upstream packages into a temp dir
#   2. Copies them over the local expo-horizon-{location,notifications} dirs
#   3. Stages everything so you can review with `git diff --cached`
#
# Conflicts / renames / deletions show up as normal staged changes.
# Nothing is committed — you decide what to keep.
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
UPSTREAM_REPO="https://github.com/expo/expo.git"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()     { echo -e "${BLUE}[sync]${NC} $1"; }
success() { echo -e "${GREEN}[sync] ✓${NC} $1"; }
warning() { echo -e "${YELLOW}[sync] !${NC} $1"; }
error()   { echo -e "${RED}[sync] ✗${NC} $1"; }

TEMP_DIR=""
cleanup() {
    if [ -n "${TEMP_DIR}" ] && [ -d "${TEMP_DIR}" ]; then
        rm -rf "${TEMP_DIR}"
    fi
}
trap cleanup EXIT

usage() {
    echo "Usage: $0 [--ref <git-ref>] [--dry-run]"
    echo
    echo "Options:"
    echo "  --ref <ref>   Upstream ref to sync from (default: main)"
    echo "  --dry-run     Show what would change without modifying files"
    echo "  -h, --help    Show this help"
    exit 0
}

UPSTREAM_REF="main"
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --ref)     UPSTREAM_REF="$2"; shift 2 ;;
        --dry-run) DRY_RUN=true; shift ;;
        -h|--help) usage ;;
        *)         error "Unknown option: $1"; usage ;;
    esac
done

UPSTREAM_PATHS=(
    "packages/expo-location"
    "packages/expo-notifications"
)
LOCAL_PATHS=(
    "expo-horizon-location"
    "expo-horizon-notifications"
)

main() {
    cd "${REPO_ROOT}"

    TEMP_DIR=$(mktemp -d)
    log "Cloning upstream (shallow, sparse) at ref '${UPSTREAM_REF}'..."

    git clone \
        --depth 1 \
        --branch "${UPSTREAM_REF}" \
        --filter=blob:none \
        --sparse \
        "${UPSTREAM_REPO}" \
        "${TEMP_DIR}/upstream" 2>&1 | tail -1

    cd "${TEMP_DIR}/upstream"
    git sparse-checkout set "${UPSTREAM_PATHS[@]}"
    git checkout 2>/dev/null

    UPSTREAM_SHA=$(git rev-parse --short HEAD)
    log "Upstream HEAD: ${UPSTREAM_SHA}"

    cd "${REPO_ROOT}"

    for i in "${!UPSTREAM_PATHS[@]}"; do
        upstream_path="${UPSTREAM_PATHS[$i]}"
        local_path="${LOCAL_PATHS[$i]}"
        src="${TEMP_DIR}/upstream/${upstream_path}"
        dst="${REPO_ROOT}/${local_path}"

        if [ ! -d "${src}" ]; then
            warning "Upstream path '${upstream_path}' not found — skipping"
            continue
        fi

        log "Syncing ${upstream_path} → ${local_path}"

        if [ "${DRY_RUN}" = true ]; then
            rsync -rcn --delete --itemize-changes \
                --exclude='build/' \
                --exclude='plugin/build/' \
                "${src}/" "${dst}/" | head -40
            echo "  ... (use without --dry-run to apply)"
        else
            rsync -rc --delete \
                --exclude='build/' \
                --exclude='plugin/build/' \
                "${src}/" "${dst}/"
        fi
    done

    if [ "${DRY_RUN}" = true ]; then
        success "Dry run complete. No files were modified."
        exit 0
    fi

    for local_path in "${LOCAL_PATHS[@]}"; do
        git add -A "${local_path}"
    done

    echo
    log "Upstream changes staged. Summary:"
    echo

    STAT=$(git diff --cached --stat -- "${LOCAL_PATHS[@]}")
    if [ -z "${STAT}" ]; then
        success "No differences from upstream."
        git reset HEAD -- "${LOCAL_PATHS[@]}" >/dev/null 2>&1
        exit 0
    fi

    echo "${STAT}"
    echo

    DELETED=$(git diff --cached --name-only --diff-filter=D -- "${LOCAL_PATHS[@]}")
    if [ -n "${DELETED}" ]; then
        warning "Files deleted upstream:"
        echo "${DELETED}" | sed 's/^/  /'
        echo
    fi

    ADDED=$(git diff --cached --name-only --diff-filter=A -- "${LOCAL_PATHS[@]}")
    if [ -n "${ADDED}" ]; then
        log "New files from upstream:"
        echo "${ADDED}" | sed 's/^/  /'
        echo
    fi

    success "All changes staged (not committed)."
    echo
    echo "Next steps:"
    echo "  Review:   git diff --cached"
    echo "  Unstage:  git reset HEAD <file>     (to keep your version)"
    echo "  Commit:   git commit -m 'chore: sync upstream ${UPSTREAM_SHA}'"
    echo "  Undo all: git reset HEAD -- ${LOCAL_PATHS[*]}"
}

main
