# VAMU Delivery App

Aplicativo React Native de entregas (tipo Uber) - versão visual apenas.

## Características

- Design moderno com paleta de cores personalizada
- Navegação completa entre telas (React Navigation)
- Componentes reutilizáveis (Button, Card, Avatar, Modal, Input, FAB)
- Layout responsivo
- Animações suaves e transições
- Suporte a fontes Poppins (opcional)

## Paleta de Cores

- **Primária**: Azul Profundo `#0B3D91`
- **Secundária**: Laranja Vibrante `#FF6A3D`
- **Acento**: Verde Menta `#2DD4BF`
- **Fundo claro**: `#F7F9FB`
- **Fundo escuro / carta**: `#FFFFFF`
- **Texto principal**: `#1F2937`
- **Texto secundário**: `#6B7280`

## Instalação

1. Instale as dependências:
```bash
npm install
```

2. (Opcional) Instale as fontes Poppins:
   - Baixe as fontes de https://fonts.google.com/specimen/Poppins
   - Coloque os arquivos na pasta `assets/fonts/`:
     - Poppins-Regular.ttf
     - Poppins-SemiBold.ttf
     - Poppins-Bold.ttf

3. Execute o aplicativo:
```bash
expo start
```

## Estrutura do Projeto

```
src/
  components/     # Componentes reutilizáveis
  screens/        # Telas do aplicativo
  theme/          # Tema e tokens de design
  types/          # Tipos TypeScript
```

## Telas

- Splash Screen
- Onboarding (2 telas)
- Home / Cliente (mapa visual)
- Seleção de Serviço
- Tela do Motorista
- Pedido em Andamento
- Histórico de Pedidos
- Perfil / Configurações

## Notas

Este é um aplicativo apenas visual, sem funcionalidades de backend ou APIs. Todas as telas utilizam mock data estático para demonstração.

