#!/bin/bash

case $1 in
    major|minor|patch)
        yarn version  --no-git-tag-version --new-version $1
    ;;

    *)
        echo "Usage: ./release.sh VERSION, where VERSION is major, minor, patch"
        exit 1
    ;;    
esac

VERSION=$(cat package.json | jq -r .version)

git commit -am "$VERSION"
git tag -a "$VERSION" -m "$VERSION"
git push --follow-tags
