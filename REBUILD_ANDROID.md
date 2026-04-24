# Instruções para Rebuild do Android com expo-image-picker

O erro "Cannot find native module 'ExponentImagePicker'" indica que o módulo nativo não está vinculado corretamente.

## Solução: Rebuild Completo

Execute os seguintes comandos na ordem:

### 1. Limpar tudo
```bash
cd android
./gradlew clean
cd ..
rm -rf android/app/build
rm -rf android/build
```

### 2. Rebuild com Expo Prebuild
```bash
# Remove as pastas android/ios se necessário (faz backup antes!)
# npx expo prebuild --clean
```

**OU** se preferir manter as configurações atuais:

### 3. Rebuild apenas Android (mais rápido)
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

### 4. Se ainda não funcionar, faça prebuild completo:
```bash
# Remove node_modules e reinstala
rm -rf node_modules
npm install

# Rebuild nativo
npx expo prebuild --clean --platform android

# Compila
cd android
./gradlew clean
./gradlew assembleRelease
```

## Verificação

Após o rebuild, o módulo `expo-image-picker` deve estar vinculado corretamente e o erro não deve mais aparecer.




