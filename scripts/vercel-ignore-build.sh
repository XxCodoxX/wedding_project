#!/usr/bin/env bash
# Vercel "Ignored Build Step" (see vercel.json): exit 0 = skip this deploy, exit 1 = build it.
#
# A push to main with feat:/fix:/perf: commits is followed seconds later by the release workflow's
# "chore(release): vX.Y.Z" commit. Building both is wasted work and briefly serves the old version
# label, so production skips the first and deploys only the release commit.
#
# Anything unexpected falls through to "build" — a redundant deploy is fine, a missing one isn't.
# If the release workflow ever fails, re-run it in GitHub Actions (or push again) to deploy.

if [ "$VERCEL_GIT_COMMIT_REF" != "main" ]; then
  echo "Branch '$VERCEL_GIT_COMMIT_REF' — building (previews are never skipped)"
  exit 1
fi

case "$VERCEL_GIT_COMMIT_MESSAGE" in
  "chore(release)"*)
    echo "Release commit — building"
    exit 1
    ;;
esac

# Commits since the last production deploy. Vercel clones shallowly, so fall back to just this
# commit if the previous deploy isn't in the clone.
RANGE="-1"
if [ -n "$VERCEL_GIT_PREVIOUS_SHA" ] && git cat-file -e "$VERCEL_GIT_PREVIOUS_SHA^{commit}" 2>/dev/null; then
  RANGE="$VERCEL_GIT_PREVIOUS_SHA..HEAD"
fi

if bash "$(dirname "$0")/has-releasable-commits.sh" "$RANGE"; then
  echo "Release commits in $RANGE — skipping; the release commit will deploy"
  exit 0
fi

echo "No release commits in $RANGE — building"
exit 1
