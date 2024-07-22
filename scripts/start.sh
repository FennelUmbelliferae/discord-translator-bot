#!/bin/sh

# Ensure the script fails on any error
set -e

# Change to the project root directory
cd "$(dirname "$0")/.."

# Run your application
node src/bot.js
