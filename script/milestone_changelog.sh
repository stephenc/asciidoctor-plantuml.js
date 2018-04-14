#!/usr/bin/env bash

loghub -t $GITHUB_TOKEN -f release -m $TRAVIS_TAG \
  -ilg bug Bugfixes \
  -ilg infrastructure "Project infrastructure" \
  -ilg feature "New functionality" \
  --template script/milestone_changelog.j2 \
  --no-prs "$TRAVIS_REPO_SLUG"
#  | sed -n -e '/^@@@@$/,/^@@@@$/{ /^@@@@$/d; /^@@@@$/d; p; }'
