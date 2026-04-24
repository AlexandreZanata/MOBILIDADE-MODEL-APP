# GovMobile — Design System & Component Architecture

> Single source of truth for all visual tokens, component patterns, and structural
> conventions used across the GovMobile React Native application.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Theme System](#2-theme-system)
3. [Color Palette](#3-color-palette)
4. [Typography](#4-typography)
5. [Spacing](#5-spacing)
6. [Border Radius](#6-border-radius)
7. [Shadows & Elevation](#7-shadows--elevation)
8. [Z-Index Scale](#8-z-index-scale)
9. [Component Architecture (Atomic Design)](#9-component-architecture-atomic-design)
10. [Atoms](#10-atoms)
11. [Molecules](#11-molecules)
12. [Organisms](#12-organisms)
13. [Screen-Level Styles](#13-screen-level-styles)
14. [Navigation Structure](#14-navigation-structure)
15. [State Management](#15-state-management)
16. [Internationalization](#16-internationalization)
17. [Rules & Conventions](#17-rules--conventions)

---

## 1. Design Philosophy

GovMobile follows a **dark-navy government aesthetic** — authoritative, legible, and accessible.
The visual language is built around three principles:

- **Token-first**: every color, size, and spacing value comes from `src/theme/index.ts`.
  No hardcoded hex, RGB, or raw pixel values anywhere in the codebase.
- **Semantic naming**: components consume tokens by semantic role (`primary`, `textMuted`,
  `success`) rather than by raw value. This makes light/dark mode switching trivial.
- **Atomic Design hierarchy**: UI is composed bottom-up — Atoms → Molecules → Organisms →
  Screens. No layer may import from a layer above it.

---

## 2. Theme System

**File:** `src/theme/index.ts`

The theme is a single object created by `createTheme(mode)` and distributed via React Context.
Every component accesses it through the `useTheme()` hook.

```typescript
import { useTheme } from '@theme/index';

const MyComponent = () => {
  const theme = useTheme();
  // theme.colors.primary       → '#0A1628'
  // theme.spacing[4]           → 16
  // theme.typography.scale.bodyMd
  // theme.shadows.card
  // theme.borderRadius.radius.lg
};
```

### ThemeProvider

Wrap the app root with `ThemeProvider`. The `mode` prop is read from `state.ui.themeMode`
(persisted via Redux Persist).

```tsx
<ThemeProvider mode={themeMode}>
  {children}
</ThemeProvider>
```

### Theme shape

```typescript
type Theme = {
  mode: 'light' | 'dark';
  colors: ColorScale;         // semantic color tokens (mode-aware)
  design: DesignColors;       // raw design-system palette (mode-independent)
  typography: Typography;     // font families, weights, sizes, scale
  spacing: Spacing;           // base-4 spacing system
  shadows: Shadows;           // named shadow presets
  borderRadius: BorderRadius; // named radius presets
  zIndex: ZIndex;             // named z-index levels
};
```

---

## 3. Color Palette

### 3.1 Design Colors (`theme.design`) — mode-independent

Raw palette values. Use when the color must not change between light and dark mode
(e.g. the always-dark navy tab bar).

| Token             | Value     | Usage                             |
|-------------------|-----------|-----------------------------------|
| `navy900`         | `#0B1623` | Deepest background, text on light |
| `navy800`         | `#0D1B2A` | Primary app background, tab bar   |
| `navy700`         | `#152238` | Secondary dark surface            |
| `navy600`         | `#1E3048` | Tertiary dark surface             |
| `amber500`        | `#C9972A` | Primary accent / golden highlight |
| `amber400`        | `#E0AD3D` | Warning, secondary accent         |
| `amber100`        | `#FFF4DC` | Amber tint background             |
| `amber900`        | `#7A5510` | Dark amber text                   |
| `blue500`         | `#2F80FF` | Interactive / CTA blue            |
| `blue100`         | `#EFF6FF` | Blue tint background              |
| `surface100`      | `#FFFFFF` | Card / form background            |
| `surface200`      | `#F4F6F9` | Page background (light)           |
| `surface300`      | `#E8ECF2` | Dividers, subtle backgrounds      |
| `surface400`      | `#D0D6E2` | Borders                           |
| `textPrimary`     | `#0B1623` | Primary text on light             |
| `textSecondary`   | `#4A5568` | Secondary text                    |
| `textTertiary`    | `#8A94A6` | Muted / placeholder text          |
| `textOnDark`      | `#FFFFFF` | Text on dark surfaces             |
| `textOnDarkMuted` | `#9AAFC7` | Muted text on dark surfaces       |
| `success`         | `#1D9E75` | Success state                     |
| `warning`         | `#E0AD3D` | Warning state                     |
| `danger`          | `#D85A30` | Error / destructive state         |
| `info`            | `#378ADD` | Informational state               |

### 3.2 Semantic Colors (`theme.colors`) — mode-aware

These tokens change value between light and dark mode. Always prefer these over `theme.design`
when the color should adapt to the current theme.

| Token         | Light                 | Dark              | Usage                          |
|---------------|-----------------------|-------------------|--------------------------------|
| `primary`     | `#0A1628`             | `#0A1628`         | Primary brand color, header bg |
| `secondary`   | `#1B3A6B`             | `#1B3A6B`         | Secondary brand, avatar bg     |
| `accent`      | `#C9992A`             | `#C9992A`         | Accent highlights              |
| `background`  | `#F6F8FB`             | `#0A1628`         | Screen background              |
| `surface`     | `#FFFFFF`             | `#141F31`         | Card / sheet background        |
| `surfaceAlt`  | `#EDF1F7`             | `#253348`         | Alternate surface (read items) |
| `border`      | `#D8E0EA`             | `#3A4A60`         | Dividers, input borders        |
| `text`        | `#0A1628`             | `#F6F8FB`         | Primary body text              |
| `textMuted`   | `#52647A`             | `#BCC8D9`         | Secondary / placeholder text   |
| `textInverse` | `#FFFFFF`             | `#0A1628`         | Text on colored backgrounds    |
| `overlay`     | `rgba(10,22,40,0.35)` | `rgba(0,0,0,0.5)` | Modal backdrops                |
| `success`     | `#1E7A3A`             | `#41B86A`         | Success feedback               |
| `warning`     | `#A76A00`             | `#E0A93F`         | Warning feedback               |
| `error`       | `#B4232A`             | `#F16A71`         | Error / destructive feedback   |
| `info`        | `#1B5FA8`             | `#67A8E8`         | Informational feedback         |
| `gray50–900`  | (scale)               | (scale)           | Neutral gray scale             |

### 3.3 Screen-specific color constants

Some screens define local color constants for values that are intentionally fixed
(not theme-aware). Always document them at the top of the style file.

**DriverScreen** (`DriverColors`):
```typescript
navBg: '#0D1B2A'                          // always dark navy
interactive: '#2F80FF'                    // always blue
success: '#1D9E75'                        // always green
danger: '#D85A30'                         // always red
statusBadgeActiveBg: 'rgba(29,158,117,0.25)'
statusBadgeOfflineBg: 'rgba(216,90,48,0.25)'
```

**RoleTabBar**:
```typescript
INTERACTIVE: '#FFFFFF'
TEXT_MUTED: 'rgba(255,255,255,0.45)'
NAV_BG: '#0D1B2A'
```

These are intentionally hardcoded because the tab bar and driver screen are always rendered
on a dark navy background regardless of the system theme.

---

## 4. Typography

**File:** `src/theme/index.ts` → `typography`

The system font is used on all platforms (`System` on iOS, `sans-serif` on Android).

### 4.1 Font weights

| Token      | Value   |
|------------|---------|
| `regular`  | `'400'` |
| `medium`   | `'500'` |
| `semibold` | `'600'` |
| `bold`     | `'700'` |

### 4.2 Legacy font size scale (backward-compat)

| Token | px |
|-------|----|
| `xs`  | 12 |
| `sm`  | 14 |
| `md`  | 16 |
| `lg`  | 18 |
| `xl`  | 20 |
| `2xl` | 24 |
| `3xl` | 30 |

### 4.3 Design-system type scale (`theme.typography.scale`)

Prefer these over the legacy scale for all new code. Each entry is a complete style object
with `fontSize`, `fontWeight`, `lineHeight`, and optional `letterSpacing`.

| Token       | fontSize | fontWeight | lineHeight | letterSpacing | Usage                        |
|-------------|----------|------------|------------|---------------|------------------------------|
| `displayLg` | 28       | 700        | 34         | -0.5          | Hero titles                  |
| `displayMd` | 22       | 700        | 28         | -0.3          | Section heroes               |
| `headingLg` | 20       | 600        | 26         | —             | Screen titles                |
| `headingMd` | 17       | 600        | 22         | —             | Card titles                  |
| `headingSm` | 15       | 600        | 20         | —             | Sub-section titles           |
| `bodyLg`    | 16       | 400        | 24         | —             | Primary body text            |
| `bodyMd`    | 14       | 400        | 21         | —             | Standard body text           |
| `bodySm`    | 13       | 400        | 19         | —             | Small body text              |
| `labelLg`   | 14       | 600        | 18         | —             | Button labels, strong labels |
| `labelMd`   | 12       | 600        | 16         | 0.3           | Badge text, tab labels       |
| `labelSm`   | 11       | 500        | 14         | 0.5           | Micro labels                 |
| `caption`   | 12       | 400        | 16         | —             | Timestamps, helper text      |

**Usage:**
```typescript
const styles = StyleSheet.create({
  title: {
    ...theme.typography.scale.headingMd,
    color: theme.colors.text,
  },
});
```

### 4.4 Text atom variants

| Variant      | fontSize | fontWeight | lineHeight |
|--------------|----------|------------|------------|
| `heading`    | 30       | 700        | 38         |
| `subheading` | 20       | 600        | 28         |
| `body`       | 16       | 400        | 24         |
| `caption`    | 12       | 400        | 16         |
| `label`      | 14       | 500        | 20         |

---

## 5. Spacing

**File:** `src/theme/index.ts` → `spacing`

Base-4 system. All spacing values are multiples of 4px.

### 5.1 Numeric keys (preferred for new code)

| Token         | px | Common usage                      |
|---------------|----|-----------------------------------|
| `spacing[1]`  | 4  | Micro gaps, icon padding          |
| `spacing[2]`  | 8  | Small gaps between elements       |
| `spacing[3]`  | 12 | Input padding, small card padding |
| `spacing[4]`  | 16 | Standard padding, card padding    |
| `spacing[5]`  | 20 | Medium padding                    |
| `spacing[6]`  | 24 | Large padding, section gaps       |
| `spacing[8]`  | 32 | Extra large padding               |
| `spacing[10]` | 40 | Bottom scroll padding             |
| `spacing[12]` | 48 | —                                 |
| `spacing[16]` | 64 | —                                 |

### 5.2 Named keys (legacy, backward-compat)

| Token            | px |
|------------------|----|
| `spacing.xs`     | 4  |
| `spacing.sm`     | 8  |
| `spacing.md`     | 12 |
| `spacing.lg`     | 16 |
| `spacing.xl`     | 20 |
| `spacing['2xl']` | 24 |
| `spacing['3xl']` | 32 |
| `spacing['4xl']` | 40 |
| `spacing['5xl']` | 48 |
| `spacing['6xl']` | 64 |

---

## 6. Border Radius

**File:** `src/theme/index.ts` → `borderRadius`

### 6.1 Design-system keys (preferred)

| Token                      | px   | Usage                    |
|----------------------------|------|--------------------------|
| `borderRadius.radius.sm`   | 6    | Small chips, tags        |
| `borderRadius.radius.md`   | 10   | Buttons, inputs, cards   |
| `borderRadius.radius.lg`   | 16   | Large cards              |
| `borderRadius.radius.xl`   | 24   | Bottom sheets, modals    |
| `borderRadius.radius.full` | 9999 | Pills, circular elements |

### 6.2 Legacy keys (backward-compat)

| Token               | px  |
|---------------------|-----|
| `borderRadius.none` | 0   |
| `borderRadius.sm`   | 4   |
| `borderRadius.md`   | 8   |
| `borderRadius.lg`   | 12  |
| `borderRadius.xl`   | 16  |
| `borderRadius.pill` | 999 |

---

## 7. Shadows & Elevation

**File:** `src/theme/index.ts` → `shadows`

Each preset includes `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`,
and `elevation` (Android).

| Token               | elevation | Usage                          |
|---------------------|-----------|--------------------------------|
| `shadows.none`      | 0         | Flat elements                  |
| `shadows.sm`        | 1         | Subtle lift                    |
| `shadows.md`        | 4         | Toasts, dropdowns              |
| `shadows.lg`        | 8         | Modals, bottom sheets          |
| `shadows.card`      | 3         | Standard card shadow           |
| `shadows.cardHover` | 6         | Pressed/hovered card           |
| `shadows.tabBar`    | 10        | Bottom tab bar (upward shadow) |

**Usage:**
```typescript
const styles = StyleSheet.create({
  card: {
    ...theme.shadows.card,
    backgroundColor: theme.colors.surface,
  },
});
```

---

## 8. Z-Index Scale

**File:** `src/theme/index.ts` → `zIndex`

| Token             | Value | Usage                        |
|-------------------|-------|------------------------------|
| `zIndex.base`     | 0     | Default layer                |
| `zIndex.dropdown` | 100   | Dropdowns, popovers          |
| `zIndex.sticky`   | 200   | Sticky headers               |
| `zIndex.overlay`  | 400   | Loading overlays             |
| `zIndex.modal`    | 1000  | Modals, bottom sheets        |
| `zIndex.toast`    | 1100  | Global toast (always on top) |

---

## 9. Component Architecture (Atomic Design)

**Directory:** `src/components/`

Components are organized in three layers. Each layer may only import from layers below it.

```
src/components/
├── atoms/       ← primitive building blocks
├── molecules/   ← composed from atoms
├── organisms/   ← composed from molecules + atoms, may read Redux
└── templates/   ← (reserved, currently empty)
```

**Rule:** Screens import from any component layer. Organisms may read Redux state directly
(e.g. `RoleTabBar` reads `unreadCount`). Molecules and atoms are pure — they receive all
data via props.

All components:
- Use `useTheme()` for all style values — no hardcoded colors or sizes
- Export a `displayName` for React DevTools
- Accept a `testID` prop for test targeting
- Are documented with JSDoc `@param` and `@returns`

---

## 10. Atoms

**Directory:** `src/components/atoms/`

Atoms are the smallest reusable UI primitives. They have no business logic and no Redux
dependency.

### Button

**File:** `src/components/atoms/Button.tsx`

Themed pressable button with loading state and icon slots.

```typescript
interface ButtonProps {
  label: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
```

| Variant     | Background       | Border                 | Text                 |
|-------------|------------------|------------------------|----------------------|
| `primary`   | `colors.primary` | none                   | `colors.textInverse` |
| `secondary` | `colors.surface` | `colors.primary` (1px) | `colors.primary`     |
| `ghost`     | `colors.surface` | none                   | `colors.text`        |
| `danger`    | `colors.error`   | none                   | `colors.white`       |

| Size | Min height | Vertical padding  |
|------|------------|-------------------|
| `sm` | 64px       | `spacing.sm` (8)  |
| `md` | 72px       | `spacing.md` (12) |
| `lg` | 80px       | `spacing.lg` (16) |

When `loading=true`, the label is replaced by an `ActivityIndicator`. When `disabled=true`
or `loading=true`, opacity drops to 0.5.

### Text

**File:** `src/components/atoms/Text.tsx`

Themed text wrapper with semantic variant mapping.

```typescript
interface TextProps extends RNTextProps {
  variant?: 'heading' | 'subheading' | 'body' | 'caption' | 'label';
  color?: keyof Theme['colors'];
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
  testID?: string;
}
```

Default variant: `body`. Default color: `text`.

### Input

**File:** `src/components/atoms/Input.tsx`

Themed text input with label, error/helper feedback, icon slots, and secure toggle.
Supports `ref` forwarding.

```typescript
interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  secureToggle?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}
```

Border behavior: default 1px `colors.border` → focused 2px `colors.secondary`
→ error 2px `colors.error`.

### Avatar

**File:** `src/components/atoms/Avatar.tsx`

User avatar with image support, initial fallback, and online badge.

```typescript
interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  testID?: string;
}
```

| Size | px  |
|------|-----|
| `xs` | 40  |
| `sm` | 48  |
| `md` | 64  |
| `lg` | 88  |
| `xl` | 104 |

### Badge

**File:** `src/components/atoms/Badge.tsx`

Semantic pill badge for status and count display.

```typescript
interface BadgeProps {
  value: string | number;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
```

### Icon

**File:** `src/components/atoms/Icon.tsx`

Themed wrapper around `@expo/vector-icons` `MaterialIcons`.

```typescript
interface IconProps {
  name: MaterialIcons['name'];
  color?: keyof Theme['colors'];
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
  testID?: string;
}
```

Minimum touch target: 24×24px.

### Skeleton

**File:** `src/components/atoms/Skeleton.tsx`

Animated loading placeholder with pulsing opacity (0.45 → 1 → 0.45, 800ms per cycle).

```typescript
interface SkeletonProps {
  width?: number | `${number}%` | 'auto';
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
```

Background: `colors.surfaceAlt`. Default border radius: `borderRadius.md`.

### Divider

**File:** `src/components/atoms/Divider.tsx`

Horizontal or vertical separator with optional centered label.

```typescript
interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
```

Line color: `colors.border` at `StyleSheet.hairlineWidth`.
