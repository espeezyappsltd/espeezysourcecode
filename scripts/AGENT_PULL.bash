#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# espeezy.com — Agent Sync Script (Alias version)
# ──────────────────────────────────────────────────────────────────────────────
# This is a symlink-like script for consistency across environments.
# It delegates to the main sync logic.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$SCRIPT_DIR/ess.sh"
