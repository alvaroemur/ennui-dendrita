#!/bin/bash
# Script para ejecutar la identificación de archivos de test/debug
# Este script puede ejecutarse manualmente o automáticamente cada 24 horas

set -e

# Directorio del proyecto
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$PROJECT_DIR"

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔍 Identificando archivos de test y debug...${NC}\n"

# Verificar si node está disponible
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: node no está instalado o no está en PATH${NC}"
    exit 1
fi

# Verificar si ts-node está disponible
if command -v ts-node &> /dev/null; then
    RUNNER="ts-node"
elif command -v npx &> /dev/null && npx -y ts-node --version &> /dev/null; then
    RUNNER="npx -y ts-node"
elif [ -f "node_modules/.bin/ts-node" ]; then
    RUNNER="./node_modules/.bin/ts-node"
else
    echo -e "${YELLOW}⚠️  ts-node no está disponible, intentando compilar TypeScript...${NC}"
    
    # Intentar compilar TypeScript si está disponible
    if command -v tsc &> /dev/null; then
        echo "Compilando TypeScript..."
        tsc .dendrita/integrations/scripts/utils/archive-tools/identify-test-debug-files.ts --outDir .dendrita/integrations/scripts/utils/archive-tools/.archived/dist --module commonjs --target es2020 --moduleResolution node --esModuleInterop --skipLibCheck
        
        if [ -f ".dendrita/integrations/scripts/utils/archive-tools/.archived/dist/identify-test-debug-files.js" ]; then
            node .dendrita/integrations/scripts/utils/archive-tools/.archived/dist/identify-test-debug-files.js
            exit 0
        fi
    fi
    
    echo -e "${RED}❌ Error: No se puede ejecutar TypeScript. Por favor instala ts-node:${NC}"
    echo "   npm install -g ts-node"
    echo "   o"
    echo "   npm install ts-node --save-dev"
    exit 1
fi

# Ejecutar el script
echo "Ejecutando con: $RUNNER"
$RUNNER .dendrita/integrations/scripts/utils/archive-tools/identify-test-debug-files.ts

echo -e "\n${GREEN}✅ Identificación completada${NC}"
echo -e "   Revisa el reporte en: .dendrita/integrations/scripts/utils/archive-tools/.archived/test-debug-report.md"
