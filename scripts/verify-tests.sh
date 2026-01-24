#!/bin/bash

echo "🧪 Manual Test Verification"
echo "============================"
echo ""

echo "1. Verificando que los scripts existen..."
if [ -f "test-mcp.sh" ] && [ -f "test-mcp-quick.sh" ]; then
    echo "✅ Scripts encontrados"
else
    echo "❌ Scripts no encontrados"
    exit 1
fi

echo ""
echo "2. Verificando permisos de ejecución..."
if [ -x "test-mcp.sh" ] && [ -x "test-mcp-quick.sh" ]; then
    echo "✅ Scripts son ejecutables"
else
    echo "❌ Scripts no son ejecutables"
    exit 1
fi

echo ""
echo "3. Verificando sintaxis bash..."
bash -n test-mcp.sh && echo "✅ test-mcp.sh: sintaxis correcta" || echo "❌ test-mcp.sh: error de sintaxis"
bash -n test-mcp-quick.sh && echo "✅ test-mcp-quick.sh: sintaxis correcta" || echo "❌ test-mcp-quick.sh: error de sintaxis"

echo ""
echo "4. Verificando dependencias..."
command -v curl >/dev/null 2>&1 && echo "✅ curl instalado" || echo "❌ curl no instalado"
command -v jq >/dev/null 2>&1 && echo "✅ jq instalado" || echo "❌ jq no instalado"
command -v bc >/dev/null 2>&1 && echo "✅ bc instalado" || echo "❌ bc no instalado"

echo ""
echo "5. Verificando estructura del proyecto..."
[ -f "src/index.ts" ] && echo "✅ src/index.ts existe" || echo "❌ src/index.ts no existe"
[ -f "wrangler.toml" ] && echo "✅ wrangler.toml existe" || echo "❌ wrangler.toml no existe"
[ -f "package.json" ] && echo "✅ package.json existe" || echo "❌ package.json no existe"

echo ""
echo "6. Verificando TypeScript..."
npm run type-check && echo "✅ TypeScript compila sin errores" || echo "❌ Errores de TypeScript"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 INSTRUCCIONES PARA TESTING MANUAL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Para probar el MCP server:"
echo ""
echo "1. En una terminal, inicia el servidor:"
echo "   wrangler dev --port 8787"
echo ""
echo "2. En otra terminal, ejecuta los tests:"
echo "   ./test-mcp-quick.sh"
echo "   o"
echo "   ./test-mcp.sh"
echo ""
echo "3. Para modo verbose:"
echo "   VERBOSE=true ./test-mcp.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
