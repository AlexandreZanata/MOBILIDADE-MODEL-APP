#!/bin/bash

# Script para rebuild completo do Android com expo-image-picker
# Resolve o erro "Cannot find native module 'ExponentImagePicker'"

echo "🔧 Iniciando rebuild completo do Android..."

# Configurar Java 17 explicitamente
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH

echo "☕ Usando Java: $JAVA_HOME"
java -version
javac -version 2>&1 || echo "⚠️  javac não encontrado, mas continuando..."

# 1. Limpar builds anteriores
echo ""
echo "📦 Limpando builds anteriores..."
cd android
./gradlew clean -Dorg.gradle.java.home=$JAVA_HOME
cd ..
rm -rf android/app/build
rm -rf android/build

# 2. Rebuild nativo com Expo Prebuild
echo ""
echo "🔨 Fazendo prebuild do Expo (isso pode demorar alguns minutos)..."
npx expo prebuild --platform android --clean

# 3. Compilar APK
echo ""
echo "🏗️  Compilando APK..."
cd android
./gradlew assembleRelease -Dorg.gradle.java.home=$JAVA_HOME

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Rebuild completo! O APK está em: android/app/build/outputs/apk/release/"
    echo ""
    echo "📱 Para instalar no dispositivo conectado:"
    echo "   adb install android/app/build/outputs/apk/release/app-release.apk"
else
    echo ""
    echo "❌ Erro na compilação. Verifique os logs acima."
    exit 1
fi
