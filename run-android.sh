#!/bin/bash

# Script para executar o app Android com JAVA_HOME correto
# Este script define o JAVA_HOME para o JDK 17 que tem o compilador Java

export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH

echo "=========================================="
echo "Configurando ambiente Java para Android"
echo "=========================================="
echo "JAVA_HOME: $JAVA_HOME"
echo "Java version:"
java -version
echo ""
echo "Javac version:"
javac -version
echo "=========================================="
echo ""

# Executa o comando do Expo/React Native
cd "$(dirname "$0")"
npx expo run:android "$@"




