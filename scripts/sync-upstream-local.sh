#!/usr/bin/env bash
#
# Local script for syncing upstream changes with conflict resolution support
# This mirrors the GitHub Actions workflow but allows manual conflict resolution
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
UPSTREAM_REPO="https://github.com/expo/expo.git"
BRANCH_NAME="chore/upstream-sync-$(date +%s)"
TEMP_DIR=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

cleanup() {
    if [ -n "${TEMP_DIR}" ] && [ -d "${TEMP_DIR}" ]; then
        # Remove the remote before cleaning up the directory
        git remote remove filtered-upstream 2>/dev/null || true
        log "Cleaning up temporary directory: ${TEMP_DIR}"
        rm -rf "${TEMP_DIR}"
    fi
}

# Trap cleanup on exit
trap cleanup EXIT

main() {
    log "Starting upstream sync process..."

    # Ensure we're in the repo root
    cd "${REPO_ROOT}"

    # Check if we're in a clean state
    if ! git diff --quiet || ! git diff --cached --quiet; then
        error "Working directory is not clean. Please commit or stash your changes."
        exit 1
    fi

    # 1) Setup upstream remote if needed
    log "Setting up upstream remote..."
    if ! git remote | grep -q '^upstream$'; then
        git remote add upstream "${UPSTREAM_REPO}"
    fi
    git fetch upstream --tags --force

    # 2) Create filtered upstream branch in separate clone
    log "Creating filtered upstream branch..."
    TEMP_DIR=$(mktemp -d)
    log "Using temporary directory: ${TEMP_DIR}"

    # Clone upstream repo to temp directory
    git clone "${UPSTREAM_REPO}" "${TEMP_DIR}/upstream-repo"
    cd "${TEMP_DIR}/upstream-repo"

    # Filter to only keep the two packages and rename them
    git filter-repo \
        --force \
        --path packages/expo-location \
        --path packages/expo-notifications \
        --path-rename packages/expo-location:expo-horizon-location \
        --path-rename packages/expo-notifications:expo-horizon-notifications

    # Go back to original repo and add the filtered repo as a remote
    cd "${REPO_ROOT}"

    # Remove existing filtered-upstream remote if it exists
    git remote remove filtered-upstream 2>/dev/null || true

    # Verify the filtered repo exists and has content
    if [ ! -d "${TEMP_DIR}/upstream-repo/.git" ]; then
        error "Filtered repository not found at ${TEMP_DIR}/upstream-repo"
        exit 1
    fi

    # Add the filtered repo as a remote
    log "Adding filtered repository as remote..."
    git remote add filtered-upstream "${TEMP_DIR}/upstream-repo"

    log "Fetching from filtered repository..."
    git fetch filtered-upstream

    # 3) Create working branch
    log "Creating working branch: ${BRANCH_NAME}"
    git checkout -B "${BRANCH_NAME}" main

    # 4) Attempt merge and handle conflicts
    log "Attempting to merge upstream changes..."

    MERGE_OUTPUT=$(git merge --no-commit --no-ff filtered-upstream/main 2>&1) || true

    if echo "$MERGE_OUTPUT" | grep -q "Already up to date"; then
        success "Already up to date with upstream. No changes to merge."
        git checkout main
        git branch -D "${BRANCH_NAME}"
        # Clean up the remote since we're done
        git remote remove filtered-upstream 2>/dev/null || true
        exit 0
    fi

    # Check for conflicts
    if git diff --name-only --diff-filter=U | grep -q .; then
        warning "Merge conflicts detected!"
        echo
        echo "Files with conflicts:"
        git diff --name-only --diff-filter=U | sed 's/^/  - /'
        echo
        echo "To resolve conflicts:"
        echo "  1. Edit the conflicted files to resolve conflicts"
        echo "  2. Add the resolved files: git add <file>"
        echo "  3. Complete the merge: git commit"
        echo "  4. Push the branch: git push -u origin ${BRANCH_NAME}"
        echo "  5. Create a PR manually or run: gh pr create --base main --head ${BRANCH_NAME}"
        echo
        echo "To abort the merge:"
        echo "  git merge --abort"
        echo "  git checkout main"
        echo "  git branch -D ${BRANCH_NAME}"
        echo
        warning "You are now on branch '${BRANCH_NAME}' with conflicts to resolve."
        exit 1
    else
        # No conflicts, complete the merge
        git commit -m "Merge latest upstream (filtered) into ${BRANCH_NAME}"
        success "Successfully merged upstream changes without conflicts!"

        # Clean up the remote since merge is complete
        git remote remove filtered-upstream 2>/dev/null || true

        # Check if there are actual changes
        if git diff --quiet main..HEAD; then
            log "No actual changes after merge. Cleaning up..."
            git checkout main
            git branch -D "${BRANCH_NAME}"
            success "No changes to create PR for."
            exit 0
        fi

        echo
        echo "Next steps:"
        echo "  1. Review the changes: git log --oneline main..HEAD"
        echo "  2. Push the branch: git push -u origin ${BRANCH_NAME}"
        echo "  3. Create a PR: gh pr create --base main --head ${BRANCH_NAME} --title 'chore: sync from upstream (filtered)' --body 'Merges latest filtered upstream changes'"
        echo
        echo "Or to push and create PR in one go:"
        echo "  git push -u origin ${BRANCH_NAME} && gh pr create --base main --head ${BRANCH_NAME} --title 'chore: sync from upstream (filtered)' --body 'Merges latest filtered upstream changes from expo/expo for expo-location and expo-notifications'"

        success "You are now on branch '${BRANCH_NAME}' with merged changes ready to push."
    fi
}

# Show usage if help requested
if [[ "${1:-}" == "--help" ]] || [[ "${1:-}" == "-h" ]]; then
    echo "Usage: $0"
    echo
    echo "This script syncs filtered upstream changes from expo/expo repository."
    echo "It creates a new branch and attempts to merge the changes."
    echo
    echo "If conflicts occur, you'll be left on the working branch to resolve them manually."
    echo "If no conflicts, you'll get instructions on how to push and create a PR."
    echo
    echo "Requirements:"
    echo "  - git-filter-repo (pip install git-filter-repo)"
    echo "  - gh CLI tool (for creating PRs)"
    exit 0
fi

main "$@"
