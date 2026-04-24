#!/bin/bash

# Script para compilar APK do projeto VAMU Delivery
# Uso: ./build-apk.sh [debug|release]

set -e  # Para o script se houver erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Iniciando compilação do APK VAMU Delivery${NC}\n"

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: Execute este script na raiz do projeto${NC}"
    exit 1
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado. Por favor, instale o Node.js 20.x${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${YELLOW}⚠️  Aviso: Node.js versão $NODE_VERSION detectada. Recomendado: 20.x${NC}"
fi

# Verificar Java
if ! command -v java &> /dev/null; then
    echo -e "${RED}❌ Java não encontrado. Por favor, instale o JDK 11 ou superior${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js encontrado: $(node -v)${NC}"
echo -e "${GREEN}✓ Java encontrado: $(java -version 2>&1 | head -n 1)${NC}\n"

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Instalando dependências do Node.js...${NC}"
    npm install
else
    echo -e "${GREEN}✓ Dependências do Node.js já instaladas${NC}"
fi

# Determinar tipo de build
BUILD_TYPE=${1:-debug}

if [ "$BUILD_TYPE" != "debug" ] && [ "$BUILD_TYPE" != "release" ]; then
    echo -e "${RED}❌ Tipo de build inválido. Use: debug ou release${NC}"
    exit 1
fi

echo -e "\n${GREEN}📱 Compilando APK ${BUILD_TYPE}...${NC}\n"

# Navegar para o diretório android
cd android

# Limpar build anterior (opcional, mas recomendado)
# NOTA: Não fazemos clean completo para evitar erros de codegen
# Se precisar limpar completamente, use: rm -rf android/app/.cxx android/app/build android/build
echo -e "${YELLOW}🧹 Limpando outputs anteriores (sem clean completo)...${NC}"
rm -rf app/build/outputs build/outputs || true

# Compilar APK
if [ "$BUILD_TYPE" == "release" ]; then
    echo -e "${GREEN}🔨 Compilando APK de RELEASE...${NC}"
    ./gradlew assembleRelease
    
    APK_PATH="app/build/outputs/apk/release/app-release.apk"
    
    if [ -f "$APK_PATH" ]; then
        APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
        echo -e "\n${GREEN}✅ APK de RELEASE gerado com sucesso!${NC}"
        echo -e "${GREEN}📦 Localização: $(pwd)/$APK_PATH${NC}"
        echo -e "${GREEN}📊 Tamanho: $APK_SIZE${NC}"
    else
        echo -e "${RED}❌ Erro: APK não foi gerado${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}🔨 Compilando APK de DEBUG...${NC}"
    ./gradlew assembleDebug
    
    APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
    
    if [ -f "$APK_PATH" ]; then
        APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
        echo -e "\n${GREEN}✅ APK de DEBUG gerado com sucesso!${NC}"
        echo -e "${GREEN}📦 Localização: $(pwd)/$APK_PATH${NC}"
        echo -e "${GREEN}📊 Tamanho: $APK_SIZE${NC}"
    else
        echo -e "${RED}❌ Erro: APK não foi gerado${NC}"
        exit 1
    fi
fi

cd ..

echo -e "\n${GREEN}🎉 Compilação concluída!${NC}"
echo -e "${YELLOW}💡 Dica: Você pode instalar o APK em um dispositivo Android usando:${NC}"
echo -e "${YELLOW}   adb install android/$APK_PATH${NC}"


