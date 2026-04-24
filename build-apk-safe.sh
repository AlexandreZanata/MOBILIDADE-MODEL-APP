#!/bin/bash

# Script para compilar APK sem fazer clean (evita erro de codegen)
# Uso: ./build-apk-safe.sh

set -e

echo "🔨 Compilando APK Release (sem clean)..."
echo ""

cd android

# Remove apenas os diretórios de build que não causam problemas
echo "🧹 Limpando build antigo (parcial)..."
rm -rf app/build/outputs
rm -rf build/outputs

# Faz o build release diretamente (sem clean)
echo "📦 Compilando APK Release..."
./gradlew :app:assembleRelease --no-daemon

echo ""
echo "✅ Build concluído!"
echo "📱 APK gerado em: android/app/build/outputs/apk/release/app-release.apk"
