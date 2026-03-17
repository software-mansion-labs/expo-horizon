#!/usr/bin/env bash
#
# Sync upstream expo-location & expo-notifications into this repo using a
# real git merge. Produces proper conflict markers when both sides changed
# the same file. Nothing is committed — you resolve and commit manually.
#
# Requirements: git-filter-repo (pip install git-filter-repo)
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
    cd "${REPO_ROOT}" 2>/dev/null || true
    git remote remove filtered-upstream 2>/dev/null || true
    if [ -n "${TEMP_DIR}" ] && [ -d "${TEMP_DIR}" ]; then
        rm -rf "${TEMP_DIR}"
    fi
}
trap cleanup EXIT

usage() {
    echo "Usage: $0 [--ref <git-ref>] [--dry-run]"
    echo
    echo "Options:"
    echo "  --ref <ref>   Upstream git ref to sync from (default: main)"
    echo "  --dry-run     Run the merge then abort — shows conflicts without changing anything"
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

main() {
    cd "${REPO_ROOT}"

    if ! command -v git-filter-repo &>/dev/null; then
        error "git-filter-repo is not installed. Install with: pip install git-filter-repo"
        exit 1
    fi

    # --- 1. Clone upstream into a temp directory ---
    TEMP_DIR=$(mktemp -d)
    log "Cloning upstream at ref '${UPSTREAM_REF}' into temp dir..."

    git clone --branch "${UPSTREAM_REF}" "${UPSTREAM_REPO}" "${TEMP_DIR}/upstream" 2>&1 \
        | while IFS= read -r line; do echo "  ${line}"; done

    # --- 2. Filter to only the packages we track, rename to local paths ---
    log "Filtering upstream to expo-location + expo-notifications..."

    cd "${TEMP_DIR}/upstream"
    git-filter-repo \
        --force \
        --path packages/expo-location \
        --path packages/expo-notifications \
        --path-rename packages/expo-location:expo-horizon-location \
        --path-rename packages/expo-notifications:expo-horizon-notifications

    UPSTREAM_SHA=$(git rev-parse --short HEAD)
    log "Filtered upstream HEAD: ${UPSTREAM_SHA}"

    # --- 3. Add filtered repo as a remote and fetch ---
    cd "${REPO_ROOT}"

    git remote remove filtered-upstream 2>/dev/null || true
    git remote add filtered-upstream "${TEMP_DIR}/upstream"
    git fetch filtered-upstream 2>/dev/null

    # --- 4. Merge with --no-commit so nothing is auto-committed ---
    log "Merging filtered upstream into current branch..."

    MERGE_EXIT=0
    MERGE_OUTPUT=$(git merge --no-commit --no-ff --allow-unrelated-histories filtered-upstream/main 2>&1) || MERGE_EXIT=$?

    if echo "${MERGE_OUTPUT}" | grep -q "Already up to date"; then
        success "Already up to date with upstream. Nothing to do."
        exit 0
    fi

    echo
    log "Merge result (upstream ${UPSTREAM_SHA}):"
    echo

    CONFLICTED=$(git diff --name-only --diff-filter=U 2>/dev/null || true)
    MODIFIED=$(git diff --cached --name-only --diff-filter=M 2>/dev/null || true)
    ADDED=$(git diff --cached --name-only --diff-filter=A 2>/dev/null || true)
    DELETED=$(git diff --cached --name-only --diff-filter=D 2>/dev/null || true)

    if [ -n "${ADDED}" ]; then
        log "New files from upstream:"
        echo "${ADDED}" | sed 's/^/  /'
        echo
    fi

    if [ -n "${MODIFIED}" ]; then
        log "Modified (auto-merged):"
        echo "${MODIFIED}" | sed 's/^/  /'
        echo
    fi

    if [ -n "${DELETED}" ]; then
        warning "Deleted upstream:"
        echo "${DELETED}" | sed 's/^/  /'
        echo
    fi

    if [ -n "${CONFLICTED}" ]; then
        warning "CONFLICTS — resolve manually:"
        echo "${CONFLICTED}" | sed 's/^/  /'
        echo
    fi

    # --- 5. Dry run: abort the merge ---
    if [ "${DRY_RUN}" = true ]; then
        git merge --abort 2>/dev/null || git reset --merge 2>/dev/null || true
        success "Dry run complete. Merge aborted, working tree restored."
        exit 0
    fi

    # --- 6. Print next steps ---
    git diff --cached --stat 2>/dev/null
    echo

    if [ -n "${CONFLICTED}" ]; then
        warning "You are in a merge state with conflicts."
        echo
        echo "Resolve conflicts, then:"
        echo "  git add <resolved-file>"
        echo "  git commit -m 'chore: sync upstream ${UPSTREAM_SHA}'"
        echo
        echo "To abort:"
        echo "  git merge --abort"
    else
        success "All changes merged cleanly (not committed)."
        echo
        echo "Review and commit:"
        echo "  git diff --cached"
        echo "  git commit -m 'chore: sync upstream ${UPSTREAM_SHA}'"
        echo
        echo "To abort:"
        echo "  git merge --abort"
    fi
}

main
