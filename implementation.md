# Mobility App — UI/UX Design System & Flow Specification

> **Target**: Agent implementation guide for a ride-hailing app (Android/iOS)
> **Modes**: Light & Dark (mandatory support)
> **Language**: Portuguese (BR)
> **Design Philosophy**: Clean, flat, minimal friction — every tap must feel intentional.

---

## 1. Design Tokens

### Colors

| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `primary` | `#1A1A1A` | `#FFFFFF` | CTA buttons, headings |
| `accent` | `#534AB7` | `#7F77DD` | Icons, active states, links |
| `accent-soft` | `#F0EFF8` | `#2A2650` | Active chip bg, icon bg |
| `surface` | `#FFFFFF` | `#1C1C1E` | Cards, sheets |
| `surface-secondary` | `#F5F5F0` | `#2C2C2E` | Page bg, inactive areas |
| `border` | `#EBEBEB` | `#3A3A3C` | Dividers, card borders |
| `text-primary` | `#1A1A1A` | `#F5F5F0` | Main text |
| `text-secondary` | `#888888` | `#8E8E93` | Subtitles, labels |
| `text-hint` | `#AAAAAA` | `#636366` | Placeholders, hints |
| `success` | `#3B6D11` | `#639922` | PIX icon, success states |
| `warning` | `#854F0B` | `#EF9F27` | Cash icon, warnings |
| `danger` | `#A32D2D` | `#E24B4A` | Errors, destructive |
| `map-bg` | `#E8F0E8` | `#1A2420` | Map base fill |
| `map-road` | `#FFFFFF` | `#2E3830` | Road lines on map |
| `map-block` | `#D8D4CC` | `#2A2A28` | Building blocks |
| `map-park` | `#C5DDB8` | `#1E3020` | Park/green areas |

### Typography

```
Font: System default (SF Pro on iOS · Roboto on Android)

Display:    22px / weight 500
Title:      18px / weight 500
Subtitle:   15px / weight 500
Body:       14px / weight 400 / line-height 1.6
Caption:    12px / weight 400
Label:      11px / weight 500 / letter-spacing 0.07em / UPPERCASE
Micro:      10px / weight 500
```

> **Rule**: Use sentence case everywhere. Never ALL CAPS in body content. Labels/tabs are the only uppercase exception.

### Spacing & Radius

```
xs:   4px
sm:   8px
md:   12px
lg:   16px
xl:   20px
2xl:  24px

radius-sm:   8px   → chips, tags, input fields
radius-md:   12px  → buttons, payment options
radius-lg:   16px  → cards, sheets inner sections
radius-xl:   24px  → bottom sheets top corners
radius-full: 50px  → pills, search bar, avatar
```

### Shadows (Light Mode Only)

```
shadow-sm:  0 1px 6px rgba(0,0,0,0.08)   → map buttons
shadow-md:  0 2px 12px rgba(0,0,0,0.12)  → search bar, floating cards
shadow-lg:  0 4px 24px rgba(0,0,0,0.16)  → bottom sheets
```

> In dark mode: replace shadows with `border: 0.5px solid [border token]`. No shadows on dark.

---

## 2. Component Library

### Search Bar (Floating Pill)
```
Shape:      border-radius: 50px
Background: surface
Height:     48px
Padding:    12px 16px
Left icon:  colored dot (accent, 8px circle) — represents "your location"
Right icon: search icon button (32x32, surface-secondary bg, circle)
Shadow:     shadow-md
```

### Bottom Sheet
```
Background:     surface
Top corners:    border-radius: 24px 24px 0 0
Handle:         36x4px, border-radius: 2px, color: border
Padding:        0 20px 24px
Shadow:         shadow-lg
Drag behavior:  swipe down to dismiss
Animation:      slide up, 280ms ease-out
```

### Ride Type Chip
```
Height:         auto (min 70px)
Min-width:      80px
Padding:        8px 14px
Border:         0.5px solid [border]
Border-radius:  radius-md

Active state:
  border-color: accent
  background:   accent-soft

Layout (vertical):
  [icon 20px]
  [name — Caption, weight 500]
  [price — Micro, text-secondary]
```

### Payment Option Row
```
Height:     56px
Padding:    0 (full-width, divider only)
Layout:     [icon 32px] [text block flex-1] [radio 18px]

Icon box:   32x32, border-radius: radius-sm, colored bg per method
Radio:      18px circle, border: 1.5px solid accent
            Selected: inner dot 8px, fill: accent

Methods & icon colors:
  Credit card →  bg: primary (#1A1A1A), icon: white
  Debit card  →  bg: accent-soft,       icon: accent
  PIX         →  bg: #EAF3DE,           icon: success (#3B6D11)
  Cash        →  bg: #FAEEDA,           icon: warning (#854F0B)
```

### Primary CTA Button
```
Height:         52px
Background:     primary
Color:          white (light) / #1A1A1A (dark)
Border-radius:  radius-md (14px)
Font:           15px / weight 500
Letter-spacing: 0.01em
Active state:   scale(0.97), 120ms
```

### Map Control Button
```
Size:           36x36px
Background:     surface
Border-radius:  radius-sm (10px)
Shadow:         shadow-sm
Icon:           20px, text-secondary
```

### Section Label
```
Font:           Label style (11px / 500 / uppercase / 0.07em)
Color:          text-hint
Margin-bottom:  8px
```

---

## 3. Screen Specifications

### Screen 1 — Home / Map

**Layout**: Full-screen map + floating UI elements + bottom sheet

#### Status Bar
- Transparent overlay on map
- Icons and time adapt to map background (dark text on light map)

#### Floating Search Bar
- Position: top of screen, 16px margin all sides, below status bar
- Placeholder: `"Para onde você vai?"`
- Left: accent dot (origin indicator)
- Right: search icon in circle button
- Tap: opens destination search screen

#### Map Area
- Full screen (behind all UI elements)
- Shows: road grid, building blocks, parks, route line, pins
- Route line: 2px solid accent color, dashed or solid
- Origin pin: `map-pin-filled` icon, accent color, 28px
- Destination pin: 14px circle — primary fill, white border (2.5px), outer ring primary (2px)
- User location dot: 18px circle, accent fill, white border (3px), outer glow ring rgba(accent, 0.25)

#### Map Controls (right side, below search)
- 2 stacked buttons: `[focus/locate]` and `[layers]`
- Gap: 8px between buttons

#### Bottom Sheet — Ride Confirmation
Persistent, non-dismissable from home screen.

```
[handle]
[section label: "NOVA CORRIDA"]

[destination row]
  [icon box: map-pin in accent-soft]  [name bold + address muted]  [ETA: 20px/500 + "min" label]

[divider]

[ride type chips — horizontal scroll, no scrollbar visible]
  Padrão | Confort | Premium | (etc.)

[divider]

[payment selector row — tap to change]
  [card icon black box]  [Card name + ••••XXXX]  [right: "Alterar" accent text + chevron]

[price row]
  [left: type name · X min]  [right: R$ XX,XX bold]

[CTA button full width: "Solicitar corrida"]
```

#### Bottom Navigation Bar
```
Background: surface
Border-top: 0.5px solid border
Height:     64px (+ safe area inset)
Items:      Início · Corridas · Pagamentos · Perfil
Active tab: accent color icon + label + 4px dot indicator below
Inactive:   text-hint color
```

---

### Screen 2 — Payment Selection (Bottom Sheet)

> **Critical UX decision**: This is NOT a separate screen/route. It is a bottom sheet modal that slides up over the map when the user taps "Alterar" on the payment selector.

**Trigger**: Tap on the payment row in the ride confirmation sheet.
**Dismiss**: Swipe down OR tap outside OR tap back chevron.

#### Sheet Header
```
[handle]
[← back chevron 24px circle button]  [Title: "Como deseja pagar?"]
```

#### Payment Options List
Each option follows the Payment Option Row component spec above.

```
Options (in order):
  1. [Last used card]     — pre-selected (radio filled)
  2. [Other saved cards]  — if any
  3. PIX                  — green icon
  4. Dinheiro             — amber icon
  5. [+ Adicionar cartão] — ghost button, accent text, plus icon
```

**Do NOT show card brand tags (Visa, Mastercard, Elo) as chips/tags.**
Instead: show the brand logo (small 20x14px SVG) inline next to the card number `•••• 4821`.

#### Sheet Footer
```
[CTA button: "Confirmar pagamento"]
```

After confirming: sheet closes, payment row on Screen 1 updates to reflect the new selection. No page navigation occurs.

---

### Screen 3 — Destination Search

Triggered by tapping the search bar on the home screen.

```
Full screen overlay, slides up.

[back button]  [search input — autofocused]

[section: "Recentes"]
  [list of recent destinations — icon + name + neighborhood]

[section: "Sugeridos"]
  [smart suggestions based on time/location]

[map region selector — optional tag chips: Sorriso · Cuiabá · ...]
```

---

## 4. User Flow

```
App Open
    │
    ▼
[Home Screen — Map]
    │
    ├─► Tap search bar ──► [Destination Search Screen]
    │                              │
    │                     User selects destination
    │                              │
    │                              ▼
    │                   [Home Screen — Map updates]
    │                   [Bottom sheet shows trip details]
    │                              │
    ├─────────────────────────────►│
    │
    ▼
[Bottom Sheet: Ride Confirmation]
    │
    ├─► Select ride type chip (Padrão / Confort / Premium)
    │         └─ Price updates inline. No navigation.
    │
    ├─► Tap "Alterar" on payment row
    │         └─► [Payment Bottom Sheet slides up]
    │                   │
    │                   ├─ User selects method
    │                   ├─ Taps "Confirmar pagamento"
    │                   └─► Sheet closes, row updates inline
    │
    └─► Tap "Solicitar corrida"
              └─► [Ride Matching Screen — driver found]
```

**Total taps to request a ride (happy path)**: 3
1. Tap destination
2. Tap ride type chip
3. Tap "Solicitar corrida"

> Payment is pre-selected from last session — user only interacts with it if they want to change.

---

## 5. Dark Mode Rules

1. Never use shadows in dark mode — use `border: 0.5px solid [border-dark]` instead
2. Map background must darken: use `#1A2420` base, desaturated road lines
3. Bottom sheet background: `#1C1C1E` (not pure black)
4. CTA button: background `#FFFFFF`, text `#1A1A1A` (inverted from light)
5. Accent color brightens: `#534AB7` → `#7F77DD`
6. All icon colored backgrounds must use dark equivalents (e.g., accent-soft → `#2A2650`)
7. Status bar icons: always white in dark mode

---

## 6. Animation & Interaction

| Element | Animation | Duration | Easing |
|---|---|---|---|
| Bottom sheet open | Slide up | 280ms | ease-out |
| Bottom sheet close | Slide down | 220ms | ease-in |
| Payment sheet open | Slide up (partial, 70% screen) | 260ms | ease-out |
| Chip selection | Border + bg color transition | 150ms | ease |
| CTA press | scale(0.97) | 120ms | ease |
| Map pin drop | Scale 0 → 1.1 → 1.0 | 300ms | spring |
| Price update | Fade out → in | 180ms | ease |

---

## 7. Accessibility

- Minimum tap target: **44x44px** for all interactive elements
- Color is never the only indicator — always pair with icon or text
- Radio buttons must have accessible labels
- Bottom sheets must trap focus when open
- Screen reader labels for map pins: `"Origem"`, `"Destino"`, `"Sua localização"`
- Contrast ratio: minimum **4.5:1** for all text against its background

---

## 8. Copy Guidelines (PT-BR)

| Element | Text |
|---|---|
| Search placeholder | `Para onde você vai?` |
| Sheet title | `Nova corrida` |
| Payment row label | `Pagamento` |
| Change payment link | `Alterar` |
| Main CTA | `Solicitar corrida` |
| Payment sheet title | `Como deseja pagar?` |
| Payment CTA | `Confirmar pagamento` |
| Add card | `+ Adicionar cartão` |
| ETA unit | `min` |
| Cash option | `Dinheiro` |
| Cash subtitle | `Com troco` |
| PIX subtitle | `Instantâneo` |

> **Never use**: "Metodo de Pagamento" (missing accent), "Confirmar e Solicitar Corrida" (too long), "Selecione como deseja pagar pela viagem" (too verbose).

---

## 9. What NOT to Build

| ❌ Avoid | ✅ Do instead |
|---|---|
| Separate payment screen with own route | Bottom sheet modal over map |
| Card brand chips (Visa, Elo, Hipercard) in payment list | Brand logo inline next to card number |
| "Confirmar e Solicitar Corrida" (long) | "Solicitar corrida" |
| Drop shadows in dark mode | Subtle borders |
| Gradient backgrounds | Flat solid fills |
| Notification bell as large floating button | Small icon button (36px) in top-right cluster |
| ALL CAPS headings | Sentence case everywhere |
| 3+ separate steps to book a ride | Max 3 taps on happy path |

---

*Document version: 1.0 — Generated for agent implementation.*