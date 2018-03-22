#!/bin/bash

case $1 in
    major|minor|patch)
        yarn version --new-version $1
    ;;

    *)
        echo "Usage: ./release.sh VERSION, where VERSION is major, minor, patch"
        exit 1
    ;;    
esac

VERSION=$(cat package.json | jq -r .version)

echo $VERSION

git tag -a "$VERSION" -m "$VERSION"
git commit -am "$VERSION"
git push --tags origin/master
