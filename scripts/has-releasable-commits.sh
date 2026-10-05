#!/usr/bin/env bash
# Exit 0 if the given git log range contains commits that cut a release, 1 otherwise.
# The single source of this rule — used by .github/workflows/release.yml (whether to release)
# and scripts/vercel-ignore-build.sh (whether to wait for the release commit to deploy).
#
# Usage: has-releasable-commits.sh <range>    e.g. v1.2.0..HEAD, or -1 for just HEAD
git log "$@" --format='%s%n%b' | grep -qE '^(feat|fix|perf)(\([^)]*\))?!?:|^BREAKING CHANGE'
