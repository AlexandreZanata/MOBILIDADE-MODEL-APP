# 📱 Guia Completo: Como Compilar e Gerar APK do Projeto VAMU Delivery

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

1. **Node.js** (versão 20.x conforme especificado no package.json)
2. **Java JDK** (versão 11 ou superior)
3. **Android Studio** (para ter o Android SDK)
4. **Variáveis de ambiente configuradas:**
   - `JAVA_HOME` apontando para o JDK
   - `ANDROID_HOME` apontando para o Android SDK

## 🔧 Passo 1: Verificar e Instalar Dependências

### 1.1 Instalar dependências do Node.js
```bash
npm install
```

### 1.2 Verificar se o Java está instalado
```bash
java -version
```
Deve mostrar versão 11 ou superior.

### 1.3 Verificar se o Android SDK está configurado
```bash
echo $ANDROID_HOME
```
Deve mostrar o caminho do Android SDK (geralmente `~/Android/Sdk`).

## 🏗️ Passo 2: Preparar o Projeto

### 2.1 Gerar arquivos nativos (se necessário)
Se você ainda não executou o prebuild, execute:
```bash
npx expo prebuild --platform android
```

### 2.2 Verificar se o keystore existe
O projeto já tem um `debug.keystore` configurado em `android/app/debug.keystore`.

## 📦 Passo 3: Compilar o APK

### Opção A: Compilar APK de Debug (Mais Rápido - Para Testes)

```bash
cd android
./gradlew assembleDebug
```

O APK será gerado em:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Opção B: Compilar APK de Release (Para Produção)

**⚠️ IMPORTANTE:** Para produção, você precisa criar um keystore próprio!

#### 3.1 Criar um keystore para release (se ainda não tiver)
```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias release-key -keyalg RSA -keysize 2048 -validity 10000
```

Você será solicitado a fornecer:
- Senha do keystore (guarde bem essa senha!)
- Informações pessoais (nome, organização, etc.)

#### 3.2 Configurar o keystore no build.gradle

Edite `android/app/build.gradle` e adicione a configuração de release:

```gradle
signingConfigs {
    debug {
        storeFile file('debug.keystore')
        storePassword 'android'
        keyAlias 'androiddebugkey'
        keyPassword 'android'
    }
    release {
        storeFile file('release.keystore')
        storePassword 'SUA_SENHA_AQUI'
        keyAlias 'release-key'
        keyPassword 'SUA_SENHA_AQUI'
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        // ... resto da configuração
    }
}
```

#### 3.3 Compilar o APK de release
```bash
cd android
./gradlew assembleRelease
```

O APK será gerado em:
```
android/app/build/outputs/apk/release/app-release.apk
```

## 🚀 Passo 4: Compilar usando Expo CLI (Alternativa)

Você também pode usar o comando do Expo:

```bash
npx expo run:android --variant release
```

Ou para debug:
```bash
npx expo run:android
```

## 📍 Localização dos APKs Gerados

- **Debug APK:** `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release APK:** `android/app/build/outputs/apk/release/app-release.apk`

## 🔍 Verificar o APK Gerado

Para verificar informações do APK:
```bash
aapt dump badging android/app/build/outputs/apk/release/app-release.apk
```

## ⚠️ Problemas Comuns e Soluções

### Erro: "SDK location not found"
Configure a variável ANDROID_HOME:
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### Erro: "JAVA_HOME not set"
Configure o JAVA_HOME:
```bash
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64  # Ajuste o caminho conforme sua instalação
```

### Erro de memória durante compilação
Aumente a memória do Gradle editando `android/gradle.properties`:
```
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
```

### Limpar build anterior
```bash
cd android
./gradlew clean
```

## 📝 Notas Importantes

1. **Keystore de Debug:** O keystore de debug já está configurado e pode ser usado para testes.

2. **Keystore de Release:** Para publicar na Play Store, você DEVE criar seu próprio keystore e guardá-lo com segurança. Se perder o keystore, não poderá atualizar o app na Play Store.

3. **Tamanho do APK:** O APK pode ser grande devido às dependências nativas. Considere usar AAB (Android App Bundle) para publicação na Play Store.

4. **Assinatura:** O APK de release precisa ser assinado. Sem assinatura, não pode ser instalado em dispositivos.

## 🎯 Comandos Rápidos (Resumo)

```bash
# 1. Instalar dependências
npm install

# 2. Compilar APK Debug
cd android && ./gradlew assembleDebug

# 3. Compilar APK Release (após configurar keystore)
cd android && ./gradlew assembleRelease

# 4. Limpar build
cd android && ./gradlew clean
```


