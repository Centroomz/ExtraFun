#!/bin/sh
# Adds the clip-shrink step to .git/hooks/pre-commit (idempotent). Keeps whatever
# is already in the hook (code-review-graph installs its own line there).
set -e
HOOK=.git/hooks/pre-commit
MARK="# shrink-clips"
[ -f "$HOOK" ] || printf '#!/bin/sh\n' > "$HOOK"
if ! grep -q "$MARK" "$HOOK"; then
  cat >> "$HOOK" <<'EOF'

# shrink-clips: re-encode any staged promo clip that is still 720p / >1.2 MB,
# then re-stage it so the commit carries the small version.
STAGED_MP4=$(git diff --cached --name-only --diff-filter=AM -- 'public/*.mp4')
if [ -n "$STAGED_MP4" ]; then
  sh scripts/shrink-clips.sh $STAGED_MP4 && git add $STAGED_MP4
fi
EOF
  echo "pre-commit: shrink-clips step installed"
else
  echo "pre-commit: shrink-clips step already present"
fi
chmod +x "$HOOK"
