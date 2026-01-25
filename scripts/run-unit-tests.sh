#!/bin/bash
cd "$(dirname "$0")/.."
npx vitest run tests/unit --reporter=verbose
