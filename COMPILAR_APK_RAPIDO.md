# ⚡ Compilação Rápida de APK

## 🎯 Método Mais Rápido (Recomendado)

### Para APK de DEBUG (testes):
```bash
./build-apk.sh debug
```

### Para APK de RELEASE (produção):
```bash
./build-apk.sh release
```

## 📍 Onde encontrar o APK gerado?

- **Debug:** `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release:** `android/app/build/outputs/apk/release/app-release.apk`

## 🔧 Método Manual (se preferir)

### 1. Compilar APK Debug:
```bash
cd android
./gradlew assembleDebug
```

### 2. Compilar APK Release:
```bash
cd android
./gradlew assembleRelease
```

## ⚠️ Importante para Release

Se for compilar APK de RELEASE pela primeira vez, você precisa criar um keystore:

```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias release-key -keyalg RSA -keysize 2048 -validity 10000
```

Depois, edite `android/app/build.gradle` e configure o `signingConfigs.release` com as informações do keystore.

## 📱 Instalar no dispositivo

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

ou

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```


