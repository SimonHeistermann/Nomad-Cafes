#!/bin/bash
# Script to check if OpenAPI schema types are up-to-date
# Usage: ./scripts/check-api-schema.sh [--from-file|--from-server]
#
# Options:
#   --from-file   Check against local openapi-schema.json (default, for CI)
#   --from-server Check against live server at localhost:8000
#
# This script is intended to be run in CI to detect API contract drift.

set -e

MODE="${1:---from-file}"

echo "🔍 Checking OpenAPI schema drift..."

# Store current directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$(dirname "$SCRIPT_DIR")"

cd "$FRONTEND_DIR"

# Create temp file for comparison
TEMP_SCHEMA=$(mktemp)
trap "rm -f $TEMP_SCHEMA" EXIT

if [ "$MODE" = "--from-server" ]; then
    echo "📡 Fetching schema from server..."
    if ! curl -s http://localhost:8000/api/schema/ > "$TEMP_SCHEMA"; then
        echo "❌ Failed to fetch schema from server. Is the backend running?"
        exit 1
    fi

    # Generate types from server
    npx openapi-typescript http://localhost:8000/api/schema/ -o "$TEMP_SCHEMA.ts" 2>/dev/null
else
    echo "📄 Using local schema file..."
    if [ ! -f "./openapi-schema.json" ]; then
        echo "❌ openapi-schema.json not found. Run 'npm run generate:api:file' first."
        exit 1
    fi

    # Generate types from local file
    npx openapi-typescript ./openapi-schema.json -o "$TEMP_SCHEMA.ts" 2>/dev/null
fi

# Compare with committed schema
if [ ! -f "./src/api/generated/schema.ts" ]; then
    echo "❌ Generated schema.ts not found. Run 'npm run generate:api:file' first."
    exit 1
fi

# Check if files differ (ignoring the auto-generated header with timestamp)
if diff -q <(tail -n +5 "$TEMP_SCHEMA.ts") <(tail -n +5 "./src/api/generated/schema.ts") > /dev/null 2>&1; then
    echo "✅ API schema is up-to-date!"
    exit 0
else
    echo "❌ API schema has drifted!"
    echo ""
    echo "The generated TypeScript types don't match the OpenAPI schema."
    echo "To fix this:"
    echo "  1. Regenerate types: npm run generate:api:file"
    echo "  2. Review changes: git diff src/api/generated/schema.ts"
    echo "  3. Commit the updated schema.ts"
    echo ""
    exit 1
fi
