#!/usr/bin/env bash
#
# Sync upstream expo-location & expo-notifications into this repo using a
# real git merge with proper conflict detection.
#
# Maintains a local tracking branch (upstream-filtered) so that git has a
# merge base on subsequent syncs. Only files changed on BOTH sides conflict.
#
# Requirements: git-filter-repo (pip install git-filter-repo)
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
UPSTREAM_REPO="https://github.com/expo/expo.git"
TRACKING_BRANCH="upstream-filtered"

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
    echo "  --dry-run     Run the merge then abort — shows what would happen"
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

    # --- 0. Preflight checks ---
    if ! command -v git-filter-repo &>/dev/null; then
        error "git-filter-repo is not installed. Install with: pip install git-filter-repo"
        exit 1
    fi

    if [ -f "${REPO_ROOT}/.git/MERGE_HEAD" ]; then
        error "A merge is already in progress. Resolve it or run: git merge --abort"
        exit 1
    fi

    if ! git diff --quiet || ! git diff --cached --quiet; then
        error "Working tree is not clean. Commit or stash your changes first."
        exit 1
    fi

    # --- 1. Clone upstream and filter ---
    TEMP_DIR=$(mktemp -d)
    log "Cloning upstream at ref '${UPSTREAM_REF}'..."

    git clone --branch "${UPSTREAM_REF}" "${UPSTREAM_REPO}" "${TEMP_DIR}/upstream" 2>&1 \
        | while IFS= read -r line; do echo "  ${line}"; done

    log "Filtering to expo-location + expo-notifications..."

    cd "${TEMP_DIR}/upstream"
    git-filter-repo \
        --force \
        --path packages/expo-location \
        --path packages/expo-notifications \
        --path-rename packages/expo-location:expo-horizon-location \
        --path-rename packages/expo-notifications:expo-horizon-notifications

    UPSTREAM_SHA=$(git rev-parse --short HEAD)
    log "Filtered upstream HEAD: ${UPSTREAM_SHA}"

    # --- 2. Fetch filtered objects into local repo ---
    cd "${REPO_ROOT}"

    git remote remove filtered-upstream 2>/dev/null || true
    git remote add filtered-upstream "${TEMP_DIR}/upstream"
    git fetch filtered-upstream 2>/dev/null

    UPSTREAM_TREE=$(git rev-parse filtered-upstream/main^{tree})

    # --- 3. Update (or create) the tracking branch ---
    FIRST_SYNC=false

    if ! git rev-parse --verify "${TRACKING_BRANCH}" &>/dev/null; then
        if git fetch origin "${TRACKING_BRANCH}" 2>/dev/null; then
            git branch "${TRACKING_BRANCH}" "origin/${TRACKING_BRANCH}"
            log "Fetched tracking branch '${TRACKING_BRANCH}' from origin."
        fi
    fi

    if git rev-parse --verify "${TRACKING_BRANCH}" &>/dev/null; then
        PREV_TREE=$(git rev-parse "${TRACKING_BRANCH}^{tree}")
        if [ "${PREV_TREE}" = "${UPSTREAM_TREE}" ]; then
            success "Already up to date with upstream (${UPSTREAM_SHA}). Nothing to do."
            exit 0
        fi

        log "Updating tracking branch '${TRACKING_BRANCH}'..."
        PARENT=$(git rev-parse "${TRACKING_BRANCH}")
        NEW_COMMIT=$(git commit-tree "${UPSTREAM_TREE}" -p "${PARENT}" -m "upstream snapshot ${UPSTREAM_SHA}")
        git branch -f "${TRACKING_BRANCH}" "${NEW_COMMIT}"
    else
        log "First sync — creating tracking branch '${TRACKING_BRANCH}'..."
        NEW_COMMIT=$(git commit-tree "${UPSTREAM_TREE}" -m "initial upstream snapshot ${UPSTREAM_SHA}")
        git branch "${TRACKING_BRANCH}" "${NEW_COMMIT}"
        FIRST_SYNC=true
    fi

    # --- 4. Merge tracking branch into current branch ---
    log "Merging upstream changes..."

    MERGE_ARGS=(--no-commit --no-ff)
    if [ "${FIRST_SYNC}" = true ]; then
        MERGE_ARGS+=(--allow-unrelated-histories)
    fi

    MERGE_EXIT=0
    MERGE_OUTPUT=$(git merge "${MERGE_ARGS[@]}" "${TRACKING_BRANCH}" 2>&1) || MERGE_EXIT=$?

    echo "${MERGE_OUTPUT}"

    if echo "${MERGE_OUTPUT}" | grep -q "Already up to date"; then
        success "Already up to date. Nothing to do."
        exit 0
    fi

    if [ "${MERGE_EXIT}" -ne 0 ] && [ ! -f "${REPO_ROOT}/.git/MERGE_HEAD" ]; then
        error "Merge failed:"
        echo "${MERGE_OUTPUT}"
        exit 1
    fi

    # --- 5. Report results ---
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

    # --- 6. Dry run: abort ---
    if [ "${DRY_RUN}" = true ]; then
        git merge --abort 2>/dev/null || git reset --merge 2>/dev/null || true
        success "Dry run complete. Merge aborted, working tree restored."
        exit 0
    fi

    git diff --cached --stat 2>/dev/null
    echo

    if [ "${FIRST_SYNC}" = true ]; then
        warning "First sync — all files show as new/conflicted (no previous merge base)."
        echo "  This is expected. Accept upstream versions for files you haven't modified."
        echo
    fi

    if [ -n "${CONFLICTED}" ]; then
        warning "You are in a merge state with conflicts."
        echo
        echo "Resolve conflicts, then:"
        echo "  git add <resolved-file>"
        echo "  git commit"
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

    echo
    echo "After committing, push the tracking branch so others share the merge base:"
    echo "  git push origin ${TRACKING_BRANCH}"
}

main
