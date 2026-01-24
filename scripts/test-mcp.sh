#!/bin/bash

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly BASE_URL="${MCP_BASE_URL:-http://localhost:8787}"
readonly MCP_ENDPOINT="/mcp"
readonly VERBOSE="${VERBOSE:-false}"

readonly COLOR_RESET='\033[0m'
readonly COLOR_RED='\033[0;31m'
readonly COLOR_GREEN='\033[0;32m'
readonly COLOR_YELLOW='\033[0;33m'
readonly COLOR_BLUE='\033[0;34m'
readonly COLOR_CYAN='\033[0;36m'
readonly COLOR_BOLD='\033[1m'

TESTS_PASSED=0
TESTS_FAILED=0
FAILED_TESTS=()
START_TIME=$(date +%s)

print_header() {
    echo -e "${COLOR_BOLD}${COLOR_CYAN}"
    echo "🧪 LABUREN MCP SERVER - TEST SUITE"
    echo "====================================="
    echo -e "${COLOR_RESET}"
    echo -e "${COLOR_BLUE}📋 Configuración:${COLOR_RESET}"
    echo "   Base URL: ${BASE_URL}"
    echo "   Endpoint: ${MCP_ENDPOINT}"
    echo "   Database: laburen_sales"
    echo ""
}

print_suite_header() {
    local suite_name=$1
    echo -e "${COLOR_BOLD}${COLOR_CYAN}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "TEST SUITE: ${suite_name}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${COLOR_RESET}"
}

print_test() {
    local test_name=$1
    echo -e "${COLOR_YELLOW}▶ ${test_name}${COLOR_RESET}"
}

print_success() {
    local message=$1
    echo -e "${COLOR_GREEN}✅ ${message}${COLOR_RESET}"
    ((TESTS_PASSED++))
}

print_error() {
    local test_name=$1
    local message=$2
    echo -e "${COLOR_RED}❌ ${test_name}${COLOR_RESET}"
    echo -e "${COLOR_RED}   └─ ERROR: ${message}${COLOR_RESET}"
    ((TESTS_FAILED++))
    FAILED_TESTS+=("${test_name}: ${message}")
}

print_info() {
    local message=$1
    echo -e "   └─ ${message}"
}

call_mcp_tool() {
    local tool_name=$1
    local params=$2
    local start=$(date +%s.%N)
    
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
    
    if [[ "${VERBOSE}" == "true" ]]; then
        echo -e "${COLOR_CYAN}REQUEST:${COLOR_RESET}" >&2
        echo "${payload}" | jq '.' >&2
    fi
    
    local response=$(curl -s -X POST "${BASE_URL}${MCP_ENDPOINT}" \
        -H "Content-Type: application/json" \
        -d "${payload}")
    
    local end=$(date +%s.%N)
    local duration=$(echo "$end - $start" | bc)
    
    if [[ "${VERBOSE}" == "true" ]]; then
        echo -e "${COLOR_CYAN}RESPONSE:${COLOR_RESET}" >&2
        echo "${response}" | jq '.' >&2
        echo -e "${COLOR_CYAN}Duration: ${duration}s${COLOR_RESET}" >&2
    fi
    
    echo "${response}"
}

validate_response() {
    local response=$1
    local expected_field=$2
    
    if ! echo "${response}" | jq -e . >/dev/null 2>&1; then
        return 1
    fi
    
    if [[ -n "${expected_field}" ]]; then
        if ! echo "${response}" | jq -e "${expected_field}" >/dev/null 2>&1; then
            return 1
        fi
    fi
    
    return 0
}

test_suite_1_explore_products() {
    print_suite_header "1. Explorar Productos"
    
    print_test "Test 1.1: Listar todos los productos"
    local response=$(call_mcp_tool "list_products" '{}')
    
    if validate_response "${response}" ".content[0].text"; then
        local products=$(echo "${response}" | jq -r '.content[0].text' | jq '.products')
        local count=$(echo "${products}" | jq 'length')
        
        if [[ ${count} -gt 0 ]]; then
            print_success "Test 1.1: Listar todos los productos"
            print_info "Productos encontrados: ${count}"
        else
            print_error "Test 1.1" "No se encontraron productos"
        fi
    else
        print_error "Test 1.1" "Respuesta inválida del servidor"
    fi
    
    echo ""
    
    print_test "Test 1.2: Buscar productos por texto"
    response=$(call_mcp_tool "list_products" '{"search": "camiseta"}')
    
    if validate_response "${response}" ".content[0].text"; then
        local data=$(echo "${response}" | jq -r '.content[0].text' | jq '.')
        local products=$(echo "${data}" | jq '.products')
        local count=$(echo "${products}" | jq 'length')
        
        if [[ ${count} -gt 0 ]]; then
            local first_product=$(echo "${products}" | jq -r '.[0].name')
            local first_price=$(echo "${products}" | jq -r '.[0].price')
            print_success "Test 1.2: Buscar productos por texto"
            print_info "Productos encontrados: ${count}"
            print_info "Primer resultado: ${first_product} (\$${first_price})"
        else
            print_error "Test 1.2" "No se encontraron productos con 'camiseta'"
        fi
    else
        print_error "Test 1.2" "Respuesta inválida del servidor"
    fi
    
    echo ""
    
    print_test "Test 1.3: Filtrar por rango de precio"
    response=$(call_mcp_tool "list_products" '{"min_price": 500, "max_price": 1000}')
    
    if validate_response "${response}" ".content[0].text"; then
        local data=$(echo "${response}" | jq -r '.content[0].text' | jq '.')
        local products=$(echo "${data}" | jq '.products')
        local count=$(echo "${products}" | jq 'length')
        
        local all_in_range=true
        for i in $(seq 0 $((count - 1))); do
            local price=$(echo "${products}" | jq -r ".[$i].price")
            if (( $(echo "$price < 500 || $price > 1000" | bc -l) )); then
                all_in_range=false
                break
            fi
        done
        
        if [[ ${count} -gt 0 ]] && [[ "${all_in_range}" == "true" ]]; then
            print_success "Test 1.3: Filtrar por rango de precio"
            print_info "Productos en rango: ${count}"
            print_info "Todos dentro del rango: ✓"
        else
            print_error "Test 1.3" "Productos fuera del rango de precio"
        fi
    else
        print_error "Test 1.3" "Respuesta inválida del servidor"
    fi
    
    echo ""
    
    print_test "Test 1.4: Límite de resultados"
    response=$(call_mcp_tool "list_products" '{"limit": 5}')
    
    if validate_response "${response}" ".content[0].text"; then
        local data=$(echo "${response}" | jq -r '.content[0].text' | jq '.')
        local products=$(echo "${data}" | jq '.products')
        local count=$(echo "${products}" | jq 'length')
        
        if [[ ${count} -eq 5 ]]; then
            print_success "Test 1.4: Límite de resultados"
            print_info "Productos retornados: ${count}"
        else
            print_error "Test 1.4" "Retornó ${count} productos en lugar de 5"
        fi
    else
        print_error "Test 1.4" "Respuesta inválida del servidor"
    fi
    
    echo ""
}

test_suite_2_product_details() {
    print_suite_header "2. Detalles de Producto"
    
    print_test "Test 2.1: Obtener producto existente"
    local list_response=$(call_mcp_tool "list_products" '{"limit": 1}')
    local product_id=$(echo "${list_response}" | jq -r '.content[0].text' | jq -r '.products[0].id')
    
    if [[ -z "${product_id}" ]] || [[ "${product_id}" == "null" ]]; then
        print_error "Test 2.1" "No se pudo obtener un product_id válido"
        echo ""
        return
    fi
    
    local response=$(call_mcp_tool "get_product" "{\"product_id\": \"${product_id}\"}")
    
    if validate_response "${response}" ".content[0].text"; then
        local data=$(echo "${response}" | jq -r '.content[0].text' | jq '.')
        local product=$(echo "${data}" | jq '.product')
        
        if [[ "${product}" != "null" ]]; then
            local name=$(echo "${product}" | jq -r '.name')
            local stock=$(echo "${product}" | jq -r '.stock')
            print_success "Test 2.1: Obtener producto existente"
            print_info "ID: ${product_id}"
            print_info "Nombre: ${name}"
            print_info "Stock: ${stock}"
        else
            print_error "Test 2.1" "Producto no encontrado"
        fi
    else
        print_error "Test 2.1" "Respuesta inválida del servidor"
    fi
    
    echo ""
    
    print_test "Test 2.2: Obtener producto inexistente"
    response=$(call_mcp_tool "get_product" '{"product_id": "nonexistent-id-12345"}')
    
    if validate_response "${response}" ".content[0].text"; then
        local data=$(echo "${response}" | jq -r '.content[0].text' | jq '.')
        local error=$(echo "${data}" | jq -r '.error')
        
        if [[ "${error}" != "null" ]] && [[ "${error}" == "Product not found" ]]; then
            print_success "Test 2.2: Obtener producto inexistente (error esperado)"
            print_info "Error: ${error}"
        else
            print_error "Test 2.2" "Debería retornar error 'Product not found'"
        fi
    else
        print_error "Test 2.2" "Respuesta inválida del servidor"
    fi
    
    echo ""
}

test_suite_3_create_cart() {
    print_suite_header "3. Crear Carrito"
    
    local conv_id="test-conv-$(date +%s)"
    
    print_test "Test 3.1: Crear carrito nuevo con 1 producto"
    local list_response=$(call_mcp_tool "list_products" '{"limit": 1}')
    local product_id=$(echo "${list_response}" | jq -r '.content[0].text' | jq -r '.products[0].id')
    
    if [[ -z "${product_id}" ]] || [[ "${product_id}" == "null" ]]; then
        print_error "Test 3.1" "No se pudo obtener un product_id válido"
        echo ""
        return
    fi
    
    local response=$(call_mcp_tool "create_cart" "{\"conversation_id\": \"${conv_id}\", \"product_id\": \"${product_id}\", \"quantity\": 1}")
    
    if validate_response "${response}" ".content[0].text"; then
        local data=$(echo "${response}" | jq -r '.content[0].text' | jq '.')
        local cart=$(echo "${data}" | jq '.cart')
        
        if [[ "${cart}" != "null" ]]; then
            print_success "Test 3.1: Crear carrito nuevo"
            print_info "Conversation ID: ${conv_id}"
            print_info "Producto agregado: ${product_id}"
        else
            print_error "Test 3.1" "No se pudo crear el carrito"
        fi
    else
        print_error "Test 3.1" "Respuesta inválida del servidor"
    fi
    
    echo ""
    
    print_test "Test 3.2: Agregar otro producto al mismo carrito"
    list_response=$(call_mcp_tool "list_products" '{"limit": 2}')
    local second_product_id=$(echo "${list_response}" | jq -r '.content[0].text' | jq -r '.products[1].id')
    
    response=$(call_mcp_tool "create_cart" "{\"conversation_id\": \"${conv_id}\", \"product_id\": \"${second_product_id}\", \"quantity\": 1}")
    
    if validate_response "${response}" ".content[0].text"; then
        local data=$(echo "${response}" | jq -r '.content[0].text' | jq '.')
        local cart=$(echo "${data}" | jq '.cart')
        local items_count=$(echo "${cart}" | jq '.items | length')
        
        if [[ ${items_count} -eq 2 ]]; then
            print_success "Test 3.2: Agregar otro producto"
            print_info "Items en carrito: ${items_count}"
        else
            print_error "Test 3.2" "Carrito debería tener 2 items, tiene ${items_count}"
        fi
    else
        print_error "Test 3.2" "Respuesta inválida del servidor"
    fi
    
    echo ""
    
    print_test "Test 3.3: Agregar el mismo producto (debe sumar quantity)"
    response=$(call_mcp_tool "create_cart" "{\"conversation_id\": \"${conv_id}\", \"product_id\": \"${product_id}\", \"quantity\": 2}")
    
    if validate_response "${response}" ".content[0].text"; then
        local data=$(echo "${response}" | jq -r '.content[0].text' | jq '.')
        local cart=$(echo "${data}" | jq '.cart')
        local first_item_qty=$(echo "${cart}" | jq -r '.items[0].quantity')
        
        if [[ ${first_item_qty} -eq 3 ]]; then
            print_success "Test 3.3: Sumar quantity del mismo producto"
            print_info "Quantity actualizada: ${first_item_qty}"
        else
            print_error "Test 3.3" "Quantity debería ser 3, es ${first_item_qty}"
        fi
    else
        print_error "Test 3.3" "Respuesta inválida del servidor"
    fi
    
    echo ""
}

test_suite_4_get_cart() {
    print_suite_header "4. Ver Carrito"
    
    local conv_id="test-conv-$(date +%s)"
    
    print_test "Test 4.1: Crear carrito con items para testing"
    local list_response=$(call_mcp_tool "list_products" '{"limit": 1}')
    local product_id=$(echo "${list_response}" | jq -r '.content[0].text' | jq -r '.products[0].id')
    call_mcp_tool "create_cart" "{\"conversation_id\": \"${conv_id}\", \"product_id\": \"${product_id}\", \"quantity\": 2}" > /dev/null
    
    local response=$(call_mcp_tool "get_cart" "{\"conversation_id\": \"${conv_id}\"}")
    
    if validate_response "${response}" ".content[0].text"; then
        local data=$(echo "${response}" | jq -r '.content[0].text' | jq '.')
        local cart=$(echo "${data}" | jq '.cart')
        local items=$(echo "${cart}" | jq '.items')
        local total=$(echo "${cart}" | jq -r '.total')
        
        if [[ "${cart}" != "null" ]] && [[ $(echo "${items}" | jq 'length') -gt 0 ]]; then
            print_success "Test 4.1: Obtener carrito con items"
            print_info "Items en carrito: $(echo "${items}" | jq 'length')"
            print_info "Total: \$${total}"
        else
            print_error "Test 4.1" "Carrito vacío o inválido"
        fi
    else
        print_error "Test 4.1" "Respuesta inválida del servidor"
    fi
    
    echo ""
    
    print_test "Test 4.2: Obtener carrito inexistente"
    response=$(call_mcp_tool "get_cart" '{"conversation_id": "nonexistent-conv-12345"}')
    
    if validate_response "${response}" ".content[0].text"; then
        local data=$(echo "${response}" | jq -r '.content[0].text' | jq '.')
        local message=$(echo "${data}" | jq -r '.message')
        
        if [[ "${message}" == *"not found"* ]] || [[ "${message}" == *"No active cart"* ]]; then
            print_success "Test 4.2: Carrito inexistente (error esperado)"
            print_info "Mensaje: ${message}"
        else
            print_error "Test 4.2" "Debería retornar error de carrito no encontrado"
        fi
    else
        print_error "Test 4.2" "Respuesta inválida del servidor"
    fi
    
    echo ""
}

test_suite_5_update_cart() {
    print_suite_header "5. Editar Carrito"
    
    local conv_id="test-conv-$(date +%s)"
    
    print_test "Test 5.1: Crear carrito para testing"
    local list_response=$(call_mcp_tool "list_products" '{"limit": 2}')
    local product_id=$(echo "${list_response}" | jq -r '.content[0].text' | jq -r '.products[0].id')
    call_mcp_tool "create_cart" "{\"conversation_id\": \"${conv_id}\", \"product_id\": \"${product_id}\", \"quantity\": 1}" > /dev/null
    
    local response=$(call_mcp_tool "update_cart_item" "{\"conversation_id\": \"${conv_id}\", \"product_id\": \"${product_id}\", \"quantity\": 3}")
    
    if validate_response "${response}" ".content[0].text"; then
        local data=$(echo "${response}" | jq -r '.content[0].text' | jq '.')
        local cart=$(echo "${data}" | jq '.cart')
        local qty=$(echo "${cart}" | jq -r '.items[0].quantity')
        
        if [[ ${qty} -eq 3 ]]; then
            print_success "Test 5.1: Actualizar cantidad de item"
            print_info "Quantity actualizada: ${qty}"
        else
            print_error "Test 5.1" "Quantity debería ser 3, es ${qty}"
        fi
    else
        print_error "Test 5.1" "Respuesta inválida del servidor"
    fi
    
    echo ""
    
    print_test "Test 5.2: Eliminar item (quantity = 0)"
    response=$(call_mcp_tool "update_cart_item" "{\"conversation_id\": \"${conv_id}\", \"product_id\": \"${product_id}\", \"quantity\": 0}")
    
    if validate_response "${response}" ".content[0].text"; then
        local data=$(echo "${response}" | jq -r '.content[0].text' | jq '.')
        local cart=$(echo "${data}" | jq '.cart')
        local items_count=$(echo "${cart}" | jq '.items | length')
        
        if [[ ${items_count} -eq 0 ]]; then
            print_success "Test 5.2: Eliminar item del carrito"
            print_info "Items restantes: ${items_count}"
        else
            print_error "Test 5.2" "Carrito debería estar vacío, tiene ${items_count} items"
        fi
    else
        print_error "Test 5.2" "Respuesta inválida del servidor"
    fi
    
    echo ""
}

test_suite_6_integration() {
    print_suite_header "6. Flujo Completo de Integración"
    
    local conv_id="integration-test-$(date +%s)"
    
    print_test "Test 6.1: Flujo completo de compra"
    
    local list_response=$(call_mcp_tool "list_products" '{"search": "camiseta", "limit": 3}')
    if ! validate_response "${list_response}" ".content[0].text"; then
        print_error "Test 6.1" "Fallo en búsqueda de productos"
        echo ""
        return
    fi
    
    local product_id=$(echo "${list_response}" | jq -r '.content[0].text' | jq -r '.products[0].id')
    
    local detail_response=$(call_mcp_tool "get_product" "{\"product_id\": \"${product_id}\"}")
    if ! validate_response "${detail_response}" ".content[0].text"; then
        print_error "Test 6.1" "Fallo en obtener detalles del producto"
        echo ""
        return
    fi
    
    local create_response=$(call_mcp_tool "create_cart" "{\"conversation_id\": \"${conv_id}\", \"product_id\": \"${product_id}\", \"quantity\": 2}")
    if ! validate_response "${create_response}" ".content[0].text"; then
        print_error "Test 6.1" "Fallo en crear carrito"
        echo ""
        return
    fi
    
    local cart_response=$(call_mcp_tool "get_cart" "{\"conversation_id\": \"${conv_id}\"}")
    if ! validate_response "${cart_response}" ".content[0].text"; then
        print_error "Test 6.1" "Fallo en obtener carrito"
        echo ""
        return
    fi
    
    local update_response=$(call_mcp_tool "update_cart_item" "{\"conversation_id\": \"${conv_id}\", \"product_id\": \"${product_id}\", \"quantity\": 3}")
    if ! validate_response "${update_response}" ".content[0].text"; then
        print_error "Test 6.1" "Fallo en actualizar carrito"
        echo ""
        return
    fi
    
    print_success "Test 6.1: Flujo completo de compra"
    print_info "Búsqueda → Detalles → Crear carrito → Ver carrito → Editar → ✓"
    
    echo ""
}

print_summary() {
    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))
    
    echo -e "${COLOR_BOLD}${COLOR_CYAN}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 RESUMEN FINAL"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${COLOR_RESET}"
    
    local total=$((TESTS_PASSED + TESTS_FAILED))
    echo "Total de tests: ${total}"
    echo -e "${COLOR_GREEN}✅ Pasados: ${TESTS_PASSED}${COLOR_RESET}"
    echo -e "${COLOR_RED}❌ Fallados: ${TESTS_FAILED}${COLOR_RESET}"
    echo "⏱️  Tiempo total: ${duration}s"
    echo ""
    
    if [[ ${TESTS_FAILED} -gt 0 ]]; then
        echo -e "${COLOR_RED}Tests fallidos:${COLOR_RESET}"
        for test in "${FAILED_TESTS[@]}"; do
            echo -e "${COLOR_RED}  - ${test}${COLOR_RESET}"
        done
        echo ""
        exit 1
    else
        echo -e "${COLOR_GREEN}🎉 Todos los tests pasaron exitosamente!${COLOR_RESET}"
        exit 0
    fi
}

main() {
    print_header
    
    if ! command -v jq &> /dev/null; then
        echo -e "${COLOR_RED}ERROR: jq no está instalado. Instálalo con: sudo apt install jq${COLOR_RESET}"
        exit 1
    fi
    
    if ! curl -s "${BASE_URL}/health" > /dev/null 2>&1; then
        echo -e "${COLOR_RED}ERROR: No se puede conectar al servidor en ${BASE_URL}${COLOR_RESET}"
        echo "Asegúrate de que el servidor esté corriendo con: wrangler dev"
        exit 1
    fi
    
    test_suite_1_explore_products
    test_suite_2_product_details
    test_suite_3_create_cart
    test_suite_4_get_cart
    test_suite_5_update_cart
    test_suite_6_integration
    
    print_summary
}

main "$@"
