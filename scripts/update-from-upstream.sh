#!/usr/bin/env bash
set -euo pipefail

# Fetch latest upstream
git fetch upstream --tags

# Reset upstream-split to upstream/main (or another ref)
git checkout -B upstream-split upstream/main

# Re-run the filter with the SAME arguments as initial extraction
git filter-repo \
  --path packages/expo-location \
  --path packages/expo-notifications \
  --path-rename packages/expo-location:expo-quest-location \
  --path-rename packages/expo-notifications:expo-quest-notifications

# Merge into main
git checkout main
# A normal merge is usually fine; resolve conflicts if any.
git merge --no-ff upstream-split -m "Merge latest upstream (filtered) into main"
