#!/bin/bash
# Script para capturar logs quando tentar acessar imagem

echo "=== Limpando logs anteriores ==="
adb logcat -c

echo ""
echo "=== Aguardando tentativa de acesso à imagem ==="
echo "Por favor, abra o app e tente escolher uma foto da galeria ou tirar uma foto"
echo "Os logs serão capturados automaticamente..."
echo ""

# Captura logs relacionados ao app e ImagePicker
adb logcat | grep -E "ProfilePhotoPicker|ImagePicker|expo-image-picker|AndroidRuntime|FATAL|com.anonymous.vamudelivery|Permission|MediaStore" | tee image_picker_logs.txt



