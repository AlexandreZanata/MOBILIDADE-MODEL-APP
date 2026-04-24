# GovMobile — Arquitetura e Infraestrutura

## Visão Geral

GovMobile é um aplicativo mobile de administração pública construído com **React Native + Expo**,
TypeScript estrito, Redux Toolkit e Socket.IO. Atende três perfis de usuário — Passageiro,
Motorista e Admin — com fluxos de corrida em tempo real, chat, rastreamento GPS e notificações
push via OneSignal.

---

## Stack Principal

| Camada              | Tecnologia                                                |
|---------------------|-----------------------------------------------------------|
| Framework mobile    | React Native 0.81 + Expo SDK 54                           |
| Linguagem           | TypeScript 5.9 (strict)                                   |
| Estado global       | Redux Toolkit 2 + redux-persist                           |
| Navegação           | React Navigation 6 (stack + bottom tabs)                  |
| Realtime            | Socket.IO Client 4                                        |
| HTTP                | Axios 1.6                                                 |
| Mapas               | @rnmapbox/maps 10                                         |
| Push notifications  | react-native-onesignal 5 + onesignal-expo-plugin          |
| Internacionalização | i18next + react-i18next (pt-BR, en-US, es)                |
| Validação de schema | Zod 4                                                     |
| Testes              | Jest 29 + @testing-library/react-native 13 + fast-check 4 |
| Build/distribuição  | EAS Build (Expo Application Services)                     |
| Node mínimo         | 18                                                        |

---

## Estrutura de Pastas

```
govmobile-app/
├── android/                    # Projeto Android nativo (Gradle)
├── assets/                     # Ícones, splash screen, favicon
├── coverage/                   # Relatórios de cobertura gerados pelo Jest
├── dist/                       # Bundle de produção (gerado pelo EAS/Metro)
├── docs/                       # Documentação técnica e de produto
├── scripts/                    # Scripts de qualidade e CI local
├── src/                        # Todo o código-fonte da aplicação
│   ├── __mocks__/              # Mocks globais de módulos nativos
│   ├── components/             # Design system (Atomic Design)
│   ├── config/                 # Variáveis de ambiente tipadas
│   ├── context/                # React Contexts (NetworkContext)
│   ├── hooks/                  # Hooks de domínio reutilizáveis
│   ├── i18n/                   # Internacionalização
│   ├── models/                 # Tipos de domínio (entidades)
│   ├── navigation/             # Navegadores e tipos de rota
│   ├── polyfills/              # Guards para TurboModules
│   ├── screens/                # Telas agrupadas por domínio
│   ├── services/               # Camada de serviços (facades, WS, rede)
│   ├── store/                  # Redux store, slices e API base
│   ├── theme/                  # Tokens de design (cores, tipografia, espaçamento)
│   ├── types/                  # Tipos compartilhados entre camadas
│   └── utils/                  # Utilitários puros (CPF, token, logger)
├── .env / .env.example         # Variáveis de ambiente (não versionadas)
├── app.config.js               # Config dinâmica do Expo (lê .env em build time)
├── app.json                    # Config estática do Expo
├── babel.config.js             # Babel + module-resolver (aliases @)
├── eas.json                    # Perfis de build EAS (dev, preview, production)
├── jest.config.js              # Configuração do Jest
├── metro.config.js             # Bundler Metro
├── package.json                # Dependências e scripts npm
└── tsconfig.json               # TypeScript com paths absolutos
```

---

## Arquitetura de Camadas

```
┌─────────────────────────────────────────────────────┐
│                    Screens / UI                      │
│  (src/screens/*  +  src/components/*)               │
├─────────────────────────────────────────────────────┤
│               Hooks de Domínio                       │
│  (src/hooks/*  +  screens/*/use*.ts)                │
├─────────────────────────────────────────────────────┤
│                  Redux Store                         │
│  (src/store/slices/*  +  src/store/api/baseApi.ts)  │
├─────────────────────────────────────────────────────┤
│               Facade Layer                           │
│  (src/services/facades/*)                           │
├──────────────────────┬──────────────────────────────┤
│   HTTP (Axios)       │   WebSocket (Socket.IO)       │
│   src/store/api/     │   src/services/websocket/     │
└──────────────────────┴──────────────────────────────┘
```

### Princípio central — Facade Pattern

Toda comunicação com o backend passa por uma facade. As telas e hooks nunca chamam Axios ou
Socket.IO diretamente. Isso permite:
- Trocar a implementação real por mocks sem alterar nenhuma tela
- Testar hooks e telas com `FacadeProvider` injetando mocks
- Isolar contratos de API em um único lugar

Decisão documentada em `docs/decisions/adr-001-facade-pattern.md`.

---

## src/components — Design System (Atomic Design)

Organizado em três níveis conforme `docs/decisions/adr-002-atomic-design.md`:

```
src/components/
├── atoms/          # Primitivos: Button, Text, Input, Badge, Avatar, Icon, Skeleton, Divider
├── molecules/      # Compostos: RideCard, MessageBubble, SearchBar, CallCard, RoleTabBar...
├── organisms/      # Blocos de UI: AppHeader, BottomTabBar, GlobalToast, NetworkBanner
└── templates/      # (reservado para layouts de página)
```

---

## src/screens — Telas por Domínio

Cada domínio tem sua própria pasta com telas, estilos, hooks locais e testes:

```
src/screens/
├── Auth/           # LoginScreen
├── Calls/          # ActiveCallScreen, CallHistoryScreen, IncomingCallScreen
├── Chat/           # ConversationListScreen, ChatRoomScreen + componentes internos
├── Corridas/       # Fluxo completo de corrida (solicitar, acompanhar, avaliar, mensagens)
├── Frota/          # Gestão de frota (admin)
├── Home/           # HomeScreen com componentes internos
├── Motorista/      # MotoristaScreen, MinhaNotaScreen, VeiculoAssociation + componentes
├── Notifications/  # NotificationsScreen
├── Passageiro/     # PassageiroScreen (mapa + corrida ativa) + componentes
├── Profile/        # ProfileScreen, SettingsScreen
└── Servidores/     # ServidoresListScreen, ServidorDetailScreen
```

Padrão de cada domínio:
- `NomeScreen.tsx` — componente de tela
- `NomeScreen.styles.ts` — StyleSheet isolado
- `useNome.ts` — hook local com toda a lógica de estado e ações
- `components/` — subcomponentes específicos da tela (quando necessário)
- `__tests__/` — testes da tela e do hook

---

## src/hooks — Hooks de Domínio Global

Hooks reutilizáveis que não pertencem a uma tela específica:

| Hook | Responsabilidade |
|---|---|
| `useAuthSession` | Hidratação de sessão, refresh de token, restauração de status do motorista |
| `useRealtimeSession` | Ciclo de vida da conexão WebSocket (connect/disconnect baseado em auth) |
| `useRideReconnection` | Reconexão de corrida ativa após queda de socket (timer 3s + fallback REST) |
| `useNetworkManager` | Orquestra `ReconnectionManager` com backoff exponencial |
| `useNetworkStatus` | Monitora conectividade via `NetworkMonitor` |
| `useDriverLocationStream` | Streaming de GPS via `atualizar-posicao` a cada 1s |
| `usePassageiroRealtime` | Subscrição a eventos realtime do lado passageiro |
| `useNotifications` | Ciclo de vida do OneSignal (link/unlink de external user ID) |
| `useAppLocationBootstrap` | Inicialização de permissões de localização |
| `useCorridaContexto` | Sync de contexto de corrida ativa via REST |
| `useReverseGeocode` | Geocodificação reversa de coordenadas |

---

## src/services — Camada de Serviços

### facades/
Uma facade por domínio de API. Cada facade implementa uma interface (`IXxxFacade`) e retorna
`Result<T, FacadeError>` — nunca lança exceções.

| Facade | Domínio |
|---|---|
| `AuthFacade` | Login, logout, refresh token |
| `CorridaFacade` | CRUD de corridas, lifecycle (aceitar, finalizar...) |
| `FrotaFacade` | Motoristas, veículos, status operacional |
| `RealtimeFacade` | WebSocket `/despacho` — conexão, eventos, telemetria |
| `PesquisaFacade` | Geocodificação, rotas, busca de endereços |
| `CartografiaFacade` | Dados cartográficos |
| `ChatFacade` | Mensagens de chat |
| `AvaliacoesFacade` | Avaliações de corrida |
| `NotificationFacade` | Notificações in-app |
| `ServidoresFacade` | Dados de servidores públicos |
| `CallFacade` | Chamadas de voz |
| `RunFacade` | Simulação de corridas (dev/mock) |

#### facades/mock/
Implementações mock de cada facade para desenvolvimento sem backend e para testes.
`RunSimulation.ts` simula o ciclo completo de uma corrida em tempo real.

### websocket/
`DespachoWebSocket.ts` — cliente Socket.IO tipado para o namespace `/despacho`.
Expõe callbacks tipados (`onConnected`, `onNovaCorridaDisponivel`, etc.) e um
`setTokenRefresher` para renovação automática de JWT em caso de 401.

### network/
- `ReconnectionManager.ts` — backoff exponencial, refresh de token antes de cada tentativa,
  callback `onSessionExpired` quando o refresh falha
- `NetworkMonitor.ts` — detecta online/offline via `expo-network`

### notifications/
`OneSignalService.ts` — abstração sobre `react-native-onesignal` para link/unlink de
external user ID e gestão do ciclo de vida de push.

### location/
`LocationService.ts` — abstração sobre `expo-location` para permissões e watch de posição.

---

## src/store — Estado Global (Redux Toolkit)

```
src/store/
├── index.ts              # configureStore + persistor (redux-persist)
├── api/
│   └── baseApi.ts        # Instância Axios com interceptors de auth e refresh
└── slices/
    ├── authSlice.ts       # Autenticação, token, servidorId, statusOperacional
    ├── corridaSlice.ts    # Corrida ativa, mensagens, histórico, fila de espera
    ├── realtimeSlice.ts   # connectionStatus, eventos realtime
    ├── locationSlice.ts   # GPS atual, lastKnown, fixStatus, permissionStatus
    ├── uiSlice.ts         # Toasts globais, modais
    ├── callsSlice.ts      # Estado de chamadas
    ├── chatSlice.ts       # Mensagens de chat
    └── notificationsSlice.ts # Notificações in-app
```

Persistência via `redux-persist` com `expo-secure-store` como storage seguro para tokens.
Decisão documentada em `docs/decisions/adr-003-redux-toolkit.md`.

---

## src/navigation — Navegação

Estrutura de navegadores aninhados:

```
RootNavigator
├── AuthNavigator          # Stack: Login
└── MainTabNavigator       # Bottom Tabs por papel
    ├── PassageiroNavigator
    │   ├── PassageiroHome (mapa)
    │   └── PassageiroCorridasNavigator (stack de corridas)
    ├── MotoristaNavigator
    │   ├── MotoristaHome (mapa + corridas)
    │   └── MotoristaCorridasNavigator
    ├── CorridasNavigator  # Admin
    ├── CallsNavigator
    ├── ChatNavigator
    └── ProfileNavigator
```

`navigationRef.ts` expõe navegação imperativa fora de componentes React.

---

## src/models — Entidades de Domínio

Tipos TypeScript puros que representam as entidades do backend:

| Modelo | Entidade |
|---|---|
| `Corrida.ts` | Corrida, status, coordenadas, funções de estado (`podeSerCancelada`, `normalizeStatus`) |
| `Motorista.ts` | Motorista, `MotoristaStatusOperacional` |
| `User.ts` | Usuário autenticado |
| `Servidor.ts` | Servidor público |
| `Veiculo.ts` | Veículo da frota |
| `Message.ts` | Mensagem de chat |
| `Call.ts` | Chamada de voz |
| `Notification.ts` | Notificação in-app |
| `Avaliacao.ts` | Avaliação de corrida |
| `Department.ts` | Departamento |

---

## src/types — Tipos Compartilhados

Tipos de request/response e contratos de API organizados por domínio:

```
src/types/
├── realtime.ts     # RealtimeConnectionStatus, RealtimeEvent, payloads WS
├── corrida.ts      # Inputs de lifecycle (aceitar, finalizar...)
├── frota.ts        # Inputs de frota e status
├── pesquisa.ts     # Geocodificação, rotas
├── servidores.ts   # Inputs de servidores
├── User.ts         # Auth inputs
├── Message.ts      # Chat inputs
├── Call.ts         # Call inputs
├── cartografia.ts  # Dados cartográficos
└── Run.ts          # Simulação
```

---

## src/i18n — Internacionalização

```
src/i18n/
├── index.ts              # Inicialização do i18next
├── useLanguage.ts        # Hook para troca de idioma
├── useTranslation.ts     # Re-export tipado do hook de tradução
└── locales/
    ├── pt-BR.json        # Português (padrão)
    ├── en-US.json        # Inglês
    └── es.json           # Espanhol
```

---

## src/config — Configuração de Ambiente

`env.ts` lê as variáveis do `expo-constants` (injetadas pelo `app.config.js` em build time)
e exporta um objeto `ENV` tipado:

```typescript
ENV.apiUrl        // URL da API REST
ENV.wsUrl         // URL do WebSocket
ENV.appEnv        // 'development' | 'staging' | 'production'
ENV.mockMode      // boolean — ativa facades mock
ENV.MAPBOX_ACCESS_TOKEN
ENV.oneSignalAppId
```

---

## src/__mocks__ — Mocks Globais de Módulos Nativos

Mocks automáticos do Jest para módulos que não funcionam em ambiente Node:

| Mock | Módulo substituído |
|---|---|
| `expo-secure-store.ts` | Armazenamento seguro |
| `expo-constants.ts` | Constantes do Expo |
| `react-native-safe-area-context.tsx` | Safe area insets |
| `react-native-onesignal.ts` | SDK OneSignal |
| `react-native-keyboard-controller.ts` | Controlador de teclado |
| `@expo/vector-icons.tsx` | Ícones vetoriais |

---

## Estratégia de Testes

### Filosofia

Dois tipos de teste convivem no projeto:

1. **Testes de comportamento (`.test.ts`)** — verificam contratos e comportamentos esperados
2. **Testes POC (`.poc.test.ts`)** — Proof of Concept, exploram comportamento real do componente
   em cenários específicos, frequentemente usados para documentar bugs e suas correções

### Property-Based Testing (PBT)

O projeto usa `fast-check` para testes baseados em propriedades. A metodologia segue três fases:

- **Bug Condition** (`.bugCondition.test.ts`) — testes que DEVEM FALHAR no código não corrigido,
  confirmando que o bug existe
- **Preservation** (`.preservation.test.ts`) — testes que DEVEM PASSAR antes e depois da correção,
  garantindo que comportamentos corretos não regridem
- **Fix Checking** — os mesmos testes de bug condition, agora PASSANDO após a correção

### Cobertura

Threshold mínimo configurado: **45% de linhas** (global).
Relatórios gerados em `coverage/` nos formatos `text`, `lcov` e `html`.

### Localização dos Testes

Cada módulo tem seus testes em `__tests__/` co-localizados:

```
src/
├── components/atoms/__tests__/          Button.test.tsx
├── components/molecules/__tests__/      MessageBubble.test.tsx
├── hooks/__tests__/                     useAuthSession.statusRestore.test.ts
│                                        useRealtimeSession.bugCondition.test.ts
│                                        useRealtimeSession.preservation.test.ts
│                                        useRideReconnection.poc.test.ts
│                                        usePassageiroRealtime.poc.test.ts
├── models/__tests__/                    models.test.ts
├── navigation/__tests__/                navigation.test.tsx
├── screens/Auth/__tests__/              LoginScreen.test.tsx
├── screens/Calls/__tests__/             IncomingCallScreen.test.tsx
├── screens/Chat/__tests__/              ChatRoomScreen.test.tsx
├── screens/Corridas/__tests__/          CorridaMensagensScreen.poc.test.tsx
│                                        cancelarCorrida.poc.test.tsx
│                                        AdminAvaliacoesScreen.poc.test.tsx
├── screens/Home/__tests__/              HomeScreen.test.tsx
├── screens/Motorista/__tests__/         MotoristaScreen.test.tsx
│                                        useMotoristaRealtime.poc.test.ts
├── screens/Passageiro/__tests__/        PassageiroScreen.test.tsx
│                                        MotoristaInfoModal.poc.test.tsx
├── screens/Profile/__tests__/           ProfileScreen.test.tsx
│                                        ProfileChangePassword.poc.test.tsx
├── services/facades/__tests__/          AuthFacade.test.ts
│                                        RealtimeFacade.bugCondition.test.ts
│                                        corridaFacade.poc.test.ts
│                                        ContractParity.test.ts
├── services/network/__tests__/          ReconnectionManager.reconnect.test.ts
│                                        NetworkMonitor.test.ts
├── services/notifications/__tests__/    OneSignalService.poc.test.ts
├── store/__tests__/                     authSlice.test.ts
│                                        authPersist.bugCondition.test.ts
│                                        authPersist.preservation.test.ts
├── theme/__tests__/                     theme.test.ts
└── i18n/__tests__/                      i18n.test.ts
```

### Configuração Jest (`jest.config.js`)

- Preset: `react-native`
- `maxWorkers: 2` — evita pressão de memória em suites grandes
- `forceExit: true` — previne travamento por handles abertos (timers, sockets)
- `testTimeout: 15000ms`
- Aliases `@components`, `@services`, `@store`, etc. mapeados via `moduleNameMapper`
- `transformIgnorePatterns` configurado para transpilar pacotes Expo/RN que usam ESM

---

## Scripts de Qualidade

```
scripts/
├── guard-all.sh          # type-check + testes (usado localmente antes de push)
├── guard-strict.sh       # type-check + lint + testes (gate completo)
├── guard-changed.sh      # roda testes apenas nos arquivos alterados
├── run-tests-ci.sh       # jest --watchAll=false --coverage (usado pelo CI)
├── install-pre-push-hook.sh  # instala guard-all como git pre-push hook
├── emulator.sh           # inicia emulador Android
└── README.md             # documentação dos scripts
```

### Comandos npm

| Comando | O que faz |
|---|---|
| `npm test` | Jest em modo watch |
| `npm run test:ci` | Jest sem watch, com cobertura |
| `npm run test:coverage` | Jest com relatório de cobertura |
| `npm run lint` | ESLint em todos os .ts/.tsx |
| `npm run lint:fix` | ESLint com auto-fix |
| `npm run type-check` | `tsc --noEmit` |
| `npm run guard:all` | type-check + testes |
| `npm run guard:strict` | type-check + lint + testes |
| `npm run guard:changed` | testes apenas nos arquivos alterados |
| `npm run guard:install-hook` | instala pre-push hook |
| `npm start` | Expo dev server |
| `npm run android` | Build e run no Android |
| `npm run build:dev:android` | EAS build de desenvolvimento |

---

## CI/CD — GitHub Actions

Arquivo: `.github/workflows/ci.yml`

Dispara em: `pull_request` e push em `main` / `develop`.

```
Jobs:
  ci (ubuntu-latest, Node 18)
    1. Checkout
    2. Setup Node 18 (cache npm)
    3. npm ci
    4. npm run lint          ← ESLint
    5. npm run type-check    ← tsc --noEmit
    6. npm run test:ci       ← Jest + cobertura
    7. Upload coverage artifact (retido 7 dias)
```

Builds de distribuição são feitos via **EAS Build** (Expo Application Services), com três perfis:

| Perfil | Distribuição | APP_ENV |
|---|---|---|
| `development` | Internal (APK) | development |
| `preview` | Internal | staging |
| `production` | Store | production |

---

## Configuração de Ambiente

Variáveis lidas pelo `app.config.js` em build time via `dotenv`:

```bash
API_URL=             # URL base da API REST
WS_URL=              # URL do servidor WebSocket
APP_ENV=             # development | staging | production
MOCK_MODE=           # true | false — ativa facades mock
MAPBOX_ACCESS_TOKEN= # Token público do Mapbox
MAPBOX_SECRET_TOKEN= # Token secreto do Mapbox (download de tiles)
ONESIGNAL_APP_ID=    # App ID do OneSignal
```

---

## Aliases de Importação

Configurados em `babel.config.js` (runtime) e `tsconfig.json` (type-check):

| Alias | Caminho real |
|---|---|
| `@components/*` | `src/components/*` |
| `@screens/*` | `src/screens/*` |
| `@navigation/*` | `src/navigation/*` |
| `@services/*` | `src/services/*` |
| `@models/*` | `src/models/*` |
| `@store/*` | `src/store/*` |
| `@hooks/*` | `src/hooks/*` |
| `@i18n/*` | `src/i18n/*` |
| `@theme/*` | `src/theme/*` |
| `@utils/*` | `src/utils/*` |
| `@config/*` | `src/config/*` |

---

## Documentação Técnica (`docs/`)

```
docs/
├── ARCHITECTURE.md                    # este arquivo
├── README.md                          # índice da documentação
├── GOVMOB_DOCUMENTATION.md            # documentação geral do produto
├── api-contract.md                    # contrato da API REST
├── backend-flow.md                    # fluxos de backend
├── commit-rules.md                    # convenções de commit
├── devops.md                          # infraestrutura e deploy
├── engineering-standards.md           # padrões de engenharia
├── git-workflow.md                    # fluxo de branches
├── security.md                        # práticas de segurança
├── testing-strategy.md                # estratégia de testes
├── testing-system-guide.md            # guia do sistema de testes
├── android-build.md                   # build Android
├── keyboard-chat-gap-fix.md           # fix de teclado no chat
├── ONESIGNAL.md                       # integração OneSignal
├── ONESIGNAL_FRONTEND_QUICKSTART.md   # quickstart OneSignal
├── architecture/
│   └── system-design.md              # design de sistema
├── decisions/                         # Architecture Decision Records (ADRs)
│   ├── adr-001-facade-pattern.md
│   ├── adr-002-atomic-design.md
│   └── adr-003-redux-toolkit.md
├── design-pattern/                    # padrões de interação e UX
├── design-system/                     # sistema de design (tokens, componentes)
├── implementation/                    # guias de implementação de features
│   ├── realtime-integration-govmob-v1.2.md
│   └── websocket-integration-govmob.md
├── product/                           # visão de produto e casos de uso
└── ux/                                # fluxos de UX
```

---

## Fluxo de Dados Realtime

```
Socket.IO Server (/despacho)
        │
        ▼
DespachoWebSocketClient      ← src/services/websocket/DespachoWebSocket.ts
        │
        ▼
RealtimeFacadeImpl           ← src/services/facades/RealtimeFacade.ts
  - wasEverConnected flag    (emite 'connected' na 1ª conexão, 'reconnecting' nas demais)
  - emitConnectionStatus()
        │
        ├──► onConnectionStatusChange() ──► useRealtimeSession
        │                                        │
        │                                        ▼
        │                                   realtimeSlice
        │                                   (connectionStatus)
        │                                        │
        │                                        ▼
        │                               useDriverLocationStream
        │                               (inicia telemetria quando 'connected')
        │
        └──► onEvent() ──► useMotoristaRealtime / usePassageiroRealtime
                                │
                                ▼
                          corridaSlice / authSlice
```

---

## Reconexão e Resiliência

```
Queda de rede / socket drop
        │
        ▼
NetworkMonitor (expo-network)
        │
        ▼
useNetworkManager
        │
        ▼
ReconnectionManager
  - backoff exponencial
  - refresh de JWT antes de cada tentativa
  - onSessionExpired() se refresh retorna null → toast + logout
        │
        ▼
RealtimeFacade.connect()
        │
        ▼
useRideReconnection (timer 3s)
  - aguarda 'reconexao-concluida' do servidor
  - fallback REST se não chegar em 3s
  - confirmConnected() → emite 'connected'
```
