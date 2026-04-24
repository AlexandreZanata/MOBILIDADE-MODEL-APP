# Como Recompilar o APK após Mudanças no Código

## ⚠️ Importante
Após fazer mudanças no código TypeScript/React Native, você **DEVE** recompilar o aplicativo para que as mudanças tenham efeito no APK compilado.

## Passos para Recompilar

### Opção 1: Script Automatizado (Recomendado)

```bash
# Limpar cache e recompilar
./build-apk.sh release
```

### Opção 2: Passo a Passo Manual

1. **Limpar cache e builds anteriores:**
```bash
cd android
./gradlew clean
cd ..
```

2. **Limpar cache do Metro Bundler:**
```bash
rm -rf node_modules/.cache
npm start -- --reset-cache
```

3. **Recompilar o APK:**
```bash
cd android
./gradlew assembleRelease
```

4. **O APK estará em:**
```
android/app/build/outputs/apk/release/app-release.apk
```

### Opção 3: Rebuild Completo (se houver problemas)

```bash
# Rebuild completo incluindo módulos nativos
./rebuild-android.sh
```

## Verificação

Após recompilar, verifique:
1. ✅ O tamanho do APK deve estar menor (~5-10MB a menos)
2. ✅ O envio de CNH deve funcionar normalmente
3. ✅ Não deve aparecer mais a mensagem "Função indisponível"

## Nota
O código fonte já está correto e não contém mais a mensagem de "função indisponível". O problema é que o APK compilado ainda está usando uma versão antiga do código.


