#!/bin/bash
set -ev

if [ -z "${TRAVIS_TAG}" ]; then
    yarn clean
    yarn lint
    yarn build
    yarn test
fi
