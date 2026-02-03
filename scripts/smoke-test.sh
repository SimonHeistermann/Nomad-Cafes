#!/bin/bash
# =============================================================================
# Smoke Test Script for Nomad Cafe Production Deployment
# =============================================================================
#
# This script runs basic health checks to verify the deployment is working.
#
# Usage:
#   ./scripts/smoke-test.sh https://nomadcafe.dev
#
# Exit codes:
#   0 - All tests passed
#   1 - One or more tests failed
#
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL
BASE_URL=${1:-http://localhost}

# Test counters
PASSED=0
FAILED=0

# Test function
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    local expected_content="$4"

    echo -n "Testing: $name... "

    # Make request
    RESPONSE=$(curl -s -w "\n%{http_code}" --max-time 10 "$url" 2>/dev/null || echo -e "\n000")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    # Check status code
    if [ "$HTTP_CODE" != "$expected_status" ]; then
        echo -e "${RED}FAILED${NC} (expected $expected_status, got $HTTP_CODE)"
        ((FAILED++))
        return 1
    fi

    # Check content if specified
    if [ -n "$expected_content" ]; then
        if echo "$BODY" | grep -q "$expected_content"; then
            echo -e "${GREEN}PASSED${NC}"
            ((PASSED++))
            return 0
        else
            echo -e "${RED}FAILED${NC} (content mismatch)"
            ((FAILED++))
            return 1
        fi
    fi

    echo -e "${GREEN}PASSED${NC}"
    ((PASSED++))
    return 0
}

# Test SSL certificate
test_ssl() {
    local domain="$1"

    echo -n "Testing: SSL Certificate... "

    if [[ "$domain" != https://* ]]; then
        echo -e "${YELLOW}SKIPPED${NC} (not HTTPS)"
        return 0
    fi

    # Extract hostname
    HOSTNAME=$(echo "$domain" | sed 's|https://||' | cut -d'/' -f1)

    # Check certificate
    CERT_INFO=$(echo | openssl s_client -servername "$HOSTNAME" -connect "$HOSTNAME:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "FAILED")

    if echo "$CERT_INFO" | grep -q "notAfter"; then
        echo -e "${GREEN}PASSED${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}FAILED${NC} (invalid certificate)"
        ((FAILED++))
        return 1
    fi
}

# Test HTTP to HTTPS redirect
test_https_redirect() {
    local url="$1"

    echo -n "Testing: HTTP→HTTPS Redirect... "

    if [[ "$url" != https://* ]]; then
        echo -e "${YELLOW}SKIPPED${NC} (not HTTPS URL)"
        return 0
    fi

    # Convert to HTTP
    HTTP_URL=$(echo "$url" | sed 's|https://|http://|')

    # Check redirect
    REDIRECT=$(curl -s -o /dev/null -w "%{redirect_url}" --max-time 10 "$HTTP_URL" 2>/dev/null || echo "")

    if [[ "$REDIRECT" == https://* ]]; then
        echo -e "${GREEN}PASSED${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}FAILED${NC} (no redirect to HTTPS)"
        ((FAILED++))
        return 1
    fi
}

# Test security headers
test_security_headers() {
    local url="$1"

    echo -n "Testing: Security Headers... "

    HEADERS=$(curl -s -I --max-time 10 "$url" 2>/dev/null || echo "")

    MISSING=""
    if ! echo "$HEADERS" | grep -qi "X-Frame-Options"; then
        MISSING="$MISSING X-Frame-Options"
    fi
    if ! echo "$HEADERS" | grep -qi "X-Content-Type-Options"; then
        MISSING="$MISSING X-Content-Type-Options"
    fi

    if [ -z "$MISSING" ]; then
        echo -e "${GREEN}PASSED${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${YELLOW}WARNING${NC} (missing:$MISSING)"
        ((PASSED++))
        return 0
    fi
}

# Test response time
test_response_time() {
    local name="$1"
    local url="$2"
    local max_time="${3:-2}"

    echo -n "Testing: $name Response Time... "

    TIME=$(curl -s -o /dev/null -w "%{time_total}" --max-time 10 "$url" 2>/dev/null || echo "999")

    if (( $(echo "$TIME < $max_time" | bc -l) )); then
        echo -e "${GREEN}PASSED${NC} (${TIME}s)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}FAILED${NC} (${TIME}s > ${max_time}s)"
        ((FAILED++))
        return 1
    fi
}

# Header
echo ""
echo -e "${GREEN}=== Nomad Cafe Smoke Tests ===${NC}"
echo ""
echo "Base URL: $BASE_URL"
echo ""
echo "-------------------------------------------"

# Run tests
test_endpoint "Health Check (Nginx)" "$BASE_URL/health" "200" "OK"
test_endpoint "API Health Check" "$BASE_URL/api/health/" "200" "healthy"
test_endpoint "API Ready Check" "$BASE_URL/api/ready/" "200"
test_endpoint "Frontend (index.html)" "$BASE_URL/" "200" "<!DOCTYPE html>"
test_endpoint "API Locations Endpoint" "$BASE_URL/api/locations/" "200" "results"
test_endpoint "API Cafes Endpoint" "$BASE_URL/api/cafes/" "200" "results"

# SSL tests (only for HTTPS)
test_ssl "$BASE_URL"
test_https_redirect "$BASE_URL"
test_security_headers "$BASE_URL"

# Performance tests
test_response_time "Health Check" "$BASE_URL/api/health/" "1"
test_response_time "Frontend" "$BASE_URL/" "2"

echo "-------------------------------------------"
echo ""

# Summary
TOTAL=$((PASSED + FAILED))
echo -e "Results: ${GREEN}$PASSED passed${NC}, ${RED}$FAILED failed${NC} (of $TOTAL tests)"
echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}=== SMOKE TESTS FAILED ===${NC}"
    exit 1
else
    echo -e "${GREEN}=== ALL SMOKE TESTS PASSED ===${NC}"
    exit 0
fi
