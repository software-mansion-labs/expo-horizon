#!/usr/bin/env bash
# Prepare an upstream delta for manual/AI resolution, without a tracking branch.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec python3 "${SCRIPT_DIR}/sync_upstream.py" "$@"
