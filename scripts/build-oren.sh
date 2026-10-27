#!/usr/bin/env bash
set -euo pipefail
mkdir -p dist/metis dist/music
cp -R public/. dist/
cp metis/index.html metis/project.html metis/google-sync.js metis/mail-sync.js metis/oren-theme.css metis/manifest.webmanifest metis/sw.js metis/icon-192.png metis/icon-512.png dist/metis/
cp -R metis/music/. dist/music/
cp public/icons/janus-v1-192.png dist/icon-192.png
cp public/icons/janus-v1-512.png dist/icon-512.png
cp public/icons/janus-v1-180.png dist/apple-touch-icon.png
