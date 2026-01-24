#!/bin/bash

set -euo pipefail

readonly BASE_URL="${MCP_BASE_URL:-http://localhost:8787}"
readonly MCP_ENDPOINT="/mcp"

readonly COLOR_RESET='\033[0m'
readonly COLOR_GREEN='\033[0;32m'
readonly COLOR_RED='\033[0;31m'
readonly COLOR_CYAN='\033[0;36m'

TESTS_PASSED=0
TESTS_FAILED=0

call_mcp_tool() {
    local tool_name=$1
    local params=$2
    
    local payload=$(cat <<EOF
{
  "method": "tools/call",
  "params": {
    "name": "${tool_name}",
    "arguments": ${params}
  }
}
EOF
)
    
    curl -s -X POST "${BASE_URL}${MCP_ENDPOINT}" \
        -H "Content-Type: application/json" \
        -d "${payload}"
}

run_test() {
    local test_name=$1
    local tool=$2
    local params=$3
    
    echo -n "Testing ${test_name}... "
    
    local response=$(call_mcp_tool "${tool}" "${params}")
    
    if echo "${response}" | jq -e '.content[0].text' >/dev/null 2>&1; then
        echo -e "${COLOR_GREEN}✅${COLOR_RESET}"
        ((TESTS_PASSED++))
    else
        echo -e "${COLOR_RED}❌${COLOR_RESET}"
        ((TESTS_FAILED++))
    fi
}

echo -e "${COLOR_CYAN}🧪 QUICK MCP TEST SUITE${COLOR_RESET}"
echo "========================"
echo ""

if ! curl -s "${BASE_URL}/health" > /dev/null 2>&1; then
    echo -e "${COLOR_RED}ERROR: Server not reachable at ${BASE_URL}${COLOR_RESET}"
    exit 1
fi

run_test "list_products" "list_products" '{}'
run_test "search products" "list_products" '{"search": "camiseta"}'
run_test "filter by price" "list_products" '{"min_price": 500, "max_price": 1000}'

PRODUCT_ID=$(call_mcp_tool "list_products" '{"limit": 1}' | jq -r '.content[0].text' | jq -r '.products[0].id')
run_test "get_product" "get_product" "{\"product_id\": \"${PRODUCT_ID}\"}"

CONV_ID="quick-test-$(date +%s)"
run_test "create_cart" "create_cart" "{\"conversation_id\": \"${CONV_ID}\", \"product_id\": \"${PRODUCT_ID}\", \"quantity\": 1}"
run_test "get_cart" "get_cart" "{\"conversation_id\": \"${CONV_ID}\"}"
run_test "update_cart_item" "update_cart_item" "{\"conversation_id\": \"${CONV_ID}\", \"product_id\": \"${PRODUCT_ID}\", \"quantity\": 2}"

echo ""
echo "========================"
TOTAL=$((TESTS_PASSED + TESTS_FAILED))
echo -e "Total: ${TOTAL} | ${COLOR_GREEN}Passed: ${TESTS_PASSED}${COLOR_RESET} | ${COLOR_RED}Failed: ${TESTS_FAILED}${COLOR_RESET}"

[[ ${TESTS_FAILED} -eq 0 ]] && exit 0 || exit 1
