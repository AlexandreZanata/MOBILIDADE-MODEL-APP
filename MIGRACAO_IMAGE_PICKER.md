# Migração: expo-image-picker → react-native-image-picker

## Resumo

Este documento descreve a migração de `expo-image-picker` para `react-native-image-picker` para reduzir o tamanho do APK e melhorar o desempenho.

## Mudanças Realizadas

### 1. Dependências
- ✅ Removido: `expo-image-picker` (~16.0.4)
- ✅ Adicionado: `react-native-image-picker` (~7.1.2)
- ✅ Removido plugin do `app.json`

### 2. Arquivos Atualizados
- ✅ `src/components/ProfilePhotoPicker.tsx`
- ✅ `src/screens/ProfileScreen.tsx`
- ✅ `src/screens/DriverVehiclesScreen.tsx`
- ✅ `android/app/proguard-rules.pro`

### 3. Otimizações de Tamanho
- ✅ Build release já configurado com:
  - `shrinkResources = true` (remove recursos não utilizados)
  - `minifyEnabled = true` (minifica código)
  - `crunchPngs = true` (comprime imagens PNG)

## Instalação

### Passo 1: Instalar dependências
```bash
npm install
```

### Passo 2: Rebuild do Android (necessário após mudança de módulo nativo)
```bash
cd android
./gradlew clean
cd ..
npm run android
```

Ou use o script fornecido:
```bash
./rebuild-android.sh
```

## Diferenças de API

### expo-image-picker (antigo)
```typescript
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
});
```

### react-native-image-picker (novo)
```typescript
launchImageLibrary(
  {
    mediaType: 'photo',
    quality: 0.8,
    selectionLimit: 1,
  },
  (response) => {
    if (response.assets?.[0]?.uri) {
      // usar response.assets[0].uri
    }
  }
);
```

## Notas Importantes

1. **Permissões**: As permissões são gerenciadas pelo `permissionsService.ts` que já estava usando `react-native-image-picker`.

2. **Editing/Crop**: O `react-native-image-picker` não suporta `allowsEditing` e `aspect` diretamente. Se necessário, use uma biblioteca de crop separada.

3. **Callback vs Promise**: `react-native-image-picker` usa callbacks ao invés de Promises, mas o código foi adaptado para manter a mesma interface.

4. **Tamanho do APK**: Espera-se uma redução de aproximadamente 5-10MB no tamanho do APK final.

## Verificação

Após a instalação, verifique:
1. ✅ Seleção de foto da galeria funciona
2. ✅ Captura de foto da câmera funciona
3. ✅ Permissões são solicitadas corretamente
4. ✅ Upload de imagens funciona

## Troubleshooting

### Erro: "Cannot find native module"
Execute um rebuild completo:
```bash
cd android
./gradlew clean
cd ..
rm -rf node_modules
npm install
npm run android
```

### Erro de permissões no Android
Verifique se o `AndroidManifest.xml` tem as permissões necessárias (já configurado).

