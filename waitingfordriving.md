# Screen Specs — Waiting for Driver & User Profile
> Part of the Mobility App Design System (extends MOBILITY_APP_DESIGN_README.md)
> Apply the same tokens, typography, spacing and dark mode rules defined in the base README.

---

## Screen A — Waiting for Driver (`/ride/matching`)

### Current Problems
| Issue | Impact |
|---|---|
| Blank white map with a single pin | User feels abandoned — no sense of progress |
| "Abrir chat" and "Cancelar corrida" same visual weight | User may accidentally cancel |
| No driver info shown while searching | Anxiety — user doesn't know what's happening |
| No animation or loading state | App feels frozen |
| Two top-level buttons with no hierarchy | Poor affordance |

---

### New Layout — Full Specification

#### Structure (top → bottom)
```
[Status Bar — transparent]
[Full-screen Map — animated]
[Persistent Bottom Sheet — non-dismissable]
[Bottom Navigation — hidden on this screen]
```

> Hide bottom navigation during active ride states. The user has one job: wait or cancel.

---

#### Map Area (full screen)
- Show the user's current location pin (same style as Home screen)
- Animate a **pulsing ring** around the user's location while searching:
  ```
  Ring: accent color, opacity 0.15 → 0
  Scale: 1.0 → 2.2
  Duration: 1.6s loop, ease-out
  ```
- Show nearby driver dots (ghost/muted, optional): small circles `#888` opacity 0.4, moving slightly — gives sense of a live network
- Do NOT show a blank beige map. Map must look active.

---

#### Bottom Sheet — Searching State

```
[handle — fixed, not draggable during search]

[top row]
  [left]
    [spinner — 20px, accent color, rotating]
    [title: "Procurando motorista"  — 17px / 500]
    [subtitle: "Buscando o melhor motorista..."  — 13px / text-secondary]
  [right]
    [timer: "0:32" — 20px / 500 / monospace]
    [label: "tempo de espera" — 9px / text-hint]

[divider]

[trip summary row]
  [origin icon]  [origin street name — truncated]
        ↓  (vertical dashed line, 24px)
  [dest icon]    [destination name — truncated]
  [right side: R$ XX,XX — 15px / 500]

[divider]

[ride type row]
  [car icon]  [type name: "Confort"]  [·]  [estimated arrival: "~4 min"]

[action row — full width, two buttons side by side]
  [ghost button: "Chat de suporte"  — border: 0.5px accent, text: accent]
  [danger ghost button: "Cancelar"  — border: 0.5px danger, text: danger]
```

**Button hierarchy rule**:
- Chat = secondary action → outlined, accent color
- Cancel = destructive → outlined, danger color (NOT filled — filled = too easy to tap by accident)
- Never use yellow/filled for a destructive action

---

#### Bottom Sheet — Driver Found State
Transition: sheet content cross-fades in 300ms after driver is matched.

```
[handle]

[status chip — top center]
  Pill: background success-soft (#EAF3DE), text success (#3B6D11)
  Icon: checkmark
  Text: "Motorista encontrado!"

[driver card]
  [avatar — 52px circle, border: 2px accent]    [name — 16px / 500]
                                                  [rating: ★ 4.92  — 13px, amber]
                                                  [car: Corolla Prata · ABC-1234 — 12px / text-secondary]
  [right: ETA badge]
    [value: "4" — 22px / 500]
    [unit: "min" — 11px / text-hint]

[divider]

[action row]
  [icon button: phone — 44px circle, surface-secondary bg]
  [icon button: chat  — 44px circle, surface-secondary bg]
  [CTA full-width: "Acompanhar no mapa" — primary button]
```

---

#### Cancellation Confirmation Dialog
Do NOT navigate away. Show an in-app dialog (modal overlay):

```
[overlay: rgba(0,0,0,0.5)]
[dialog card: surface, border-radius: radius-xl, padding: 24px]

  [icon: warning triangle — 32px, warning color]
  [title: "Cancelar corrida?"]
  [body: "Cancelamentos frequentes podem afetar sua conta."]

  [button row]
    [ghost: "Voltar" — flex 1]
    [filled danger: "Sim, cancelar" — flex 1, background: danger]
```

---

#### Copy (PT-BR) — Waiting Screen

| Element | Text |
|---|---|
| Searching title | `Procurando motorista` |
| Searching subtitle | `Buscando o melhor motorista para você` |
| Timer label | `tempo de espera` |
| Driver found chip | `Motorista encontrado!` |
| Chat button | `Chat de suporte` |
| Cancel button | `Cancelar corrida` |
| Follow map CTA | `Acompanhar no mapa` |
| Cancel dialog title | `Cancelar corrida?` |
| Cancel dialog body | `Cancelamentos frequentes podem afetar sua conta.` |
| Cancel confirm | `Sim, cancelar` |
| Cancel dismiss | `Voltar` |

---

#### What NOT to Build — Waiting Screen

| ❌ Avoid | ✅ Do instead |
|---|---|
| Blank map with single static pin | Animated pulse ring + nearby driver dots |
| Yellow filled "Cancelar" button | Outlined danger-colored ghost button |
| "Abrir chat" with no context | "Chat de suporte" — secondary outlined |
| No progress feedback | Elapsed timer + spinner |
| Immediate cancel (no confirm) | Confirmation dialog with warning copy |
| Bottom nav visible during ride | Hide it — one task at a time |

---
---

## Screen B — User Profile (`/profile`)

### Current Problems
| Issue | Impact |
|---|---|
| "Informacoes pessoais" — missing accent | Typo visible to user |
| Personal data (CPF, email, phone) always visible | Privacy risk on shoulder surfing |
| "Atualizar foto" is a primary-style button but low priority | Wastes visual hierarchy |
| Flat list for settings (Métodos, Histórico…) looks like a form | Should feel like navigation |
| No section grouping logic | Hard to scan |
| Avatar area too small and generic | Missed trust/identity moment |
| "Tipo de conta: Usuário" shown as data field | Should be a badge, not a row |

---

### New Layout — Full Specification

#### Structure (top → bottom)
```
[Status Bar]
[Profile Header Card]
[Personal Info Section — collapsible]
[Settings Sections — grouped]
[Danger Zone — bottom]
[Bottom Navigation]
```

---

#### Profile Header Card
Background: surface  
Padding: 24px top, 20px sides

```
[avatar — 72px circle]
  Border: 2.5px accent
  Edit overlay: small camera icon badge (22px circle, primary bg, white icon)
  Tap: opens image picker directly (remove "Atualizar foto" button)

[name — 18px / 500 — centered]
[account type badge — pill]
  bg: accent-soft, text: accent, icon: shield or user icon
  Text: "Passageiro" or "Motorista"

[rating row — only show if user has a rating]
  ★ 4.9  ·  32 corridas
  13px / text-secondary / centered
```

> Remove the standalone "Atualizar foto" button — the camera badge on the avatar IS the action. Saves vertical space and looks modern.

---

#### Personal Info Section
Label: `INFORMAÇÕES PESSOAIS` (section label style)

Display fields in a **card container** (surface, border-radius: radius-lg, border: 0.5px border):

```
[row: Nome]
  label left: "Nome"  |  value right: "Nome Passageiro"

[divider — inset, starts after label]

[row: E-mail]
  label left: "E-mail"  |  value right: "user@email.com"
  right icon: green dot (verified) or warning dot (unverified)

[divider]

[row: CPF]
  label left: "CPF"  |  value right: "•••.•••.040-89"  (masked by default)
  right icon: eye toggle (tap to reveal)

[divider]

[row: Telefone]
  label left: "Telefone"  |  value right: "(98) •••••-9982"  (masked)
  right icon: eye toggle

[divider]

[row: Data de nascimento]
  label left: "Data de nascimento"  |  value right: "09/09/2000"
```

**Privacy masking rule**:
- CPF and Phone are masked by default (`•••.•••.040-89`)
- Single eye icon button on the right reveals full value
- Reveal state resets when user leaves the screen
- Email shows only if verified (green dot); otherwise shows "Verificar e-mail" link in accent color

**Edit mode**:
- Add an "Editar" text button (accent, top-right of section header)
- Tapping enters edit mode: fields become inputs, button becomes "Salvar"
- Do NOT make every row individually tappable for edit — too chaotic

---

#### Settings Sections
Group into logical clusters. Each group is a **card container** with dividers between rows.

**Group 1 — Minha conta**
```
[Métodos de pagamento]   →  chevron right
[Endereços salvos]       →  chevron right
[Cupons e descontos]     →  chevron right + badge (count if any)
```

**Group 2 — Atividade**
```
[Histórico de corridas]  →  chevron right
[Avaliações]             →  chevron right
```

**Group 3 — Preferências**
```
[Notificações]           →  toggle switch (no navigation)
[Idioma]                 →  current value right + chevron
[Modo escuro]            →  toggle switch (no navigation)
```

**Group 4 — Suporte**
```
[Central de ajuda]       →  chevron right
[Fale conosco]           →  chevron right
[Termos e privacidade]   →  chevron right
```

**Row spec (each setting row)**:
```
Height: 52px
Padding: 0 16px
Layout: [icon 20px text-secondary] [label 14px/400 flex-1] [right element]

Right element options:
  → Chevron: ti-chevron-right, 16px, text-hint
  → Toggle: system-style switch, accent color when ON
  → Badge: pill, accent-soft bg, accent text, 11px/500
  → Value: 13px, text-secondary + chevron
```

---

#### Danger Zone (bottom of scroll)
Standalone, NO card container — visually separated with extra top margin (32px).

```
[button: "Sair da conta"]
  Full width, outlined, border: 0.5px danger, text: danger, height: 48px
  Icon left: ti-logout

[button: "Excluir conta"]  — only show if legally required
  Full width, text-only, text: text-hint, 13px
  Tap: confirmation dialog before any action
```

---

#### Logout Confirmation Dialog
```
[overlay]
[dialog card]
  [icon: ti-logout — 28px, text-secondary]
  [title: "Sair da conta?"]
  [body: "Você precisará fazer login novamente."]
  [ghost: "Cancelar"]  [filled primary: "Sair"]
```

---

#### Copy (PT-BR) — Profile Screen

| Element | Text |
|---|---|
| Section: personal | `Informações pessoais` |
| Section subtitle | `Dados cadastrados na sua conta` |
| Edit button | `Editar` |
| Save button | `Salvar` |
| Group 1 label | `Minha conta` |
| Group 2 label | `Atividade` |
| Group 3 label | `Preferências` |
| Group 4 label | `Suporte` |
| Logout button | `Sair da conta` |
| Delete button | `Excluir conta` |
| Logout dialog title | `Sair da conta?` |
| Logout dialog body | `Você precisará fazer login novamente.` |

---

#### What NOT to Build — Profile Screen

| ❌ Avoid | ✅ Do instead |
|---|---|
| "Atualizar foto" as standalone button | Camera badge overlay on avatar |
| CPF and phone always visible | Masked by default with eye toggle |
| Flat unstructured list for settings | Grouped card containers with section labels |
| "Tipo de conta" as a data row | Account type badge below name |
| "Informacoes" without accent | `Informações` — correct PT-BR |
| Edit each row individually | Section-level edit mode with Salvar |
| Logout at same visual level as settings | Danger zone at bottom, visually separated |
| No privacy controls | Mask sensitive fields by default |

---

## Shared Rules (both screens)

1. **Bottom nav**: visible on Profile, hidden on Waiting screen
2. **Dark mode**: apply same token swap from base README — no exceptions
3. **Empty states**: if no ride history, no saved addresses — show illustrated empty state with a helpful CTA, never a blank list
4. **Loading states**: skeleton loaders (shimmer) for async data (profile info, history count) — never show blank fields
5. **Scroll**: Profile scrolls freely; Waiting sheet is fixed height, no scroll
6. **Safe area**: always respect bottom safe area inset (notch devices, gesture nav bar)

---

*Document version: 1.0 — Waiting Screen & Profile Screen specs.*
*Must be read alongside: MOBILITY_APP_DESIGN_README.md*