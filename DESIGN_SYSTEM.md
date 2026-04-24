# GovMobile — Design System & Component Architecture

> Single source of truth for all visual tokens, component patterns, and structural conventions used across the GovMobile React Native application.

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

GovMobile follows a **dark-navy government aesthetic** — authoritative, legible, and accessible. The visual language is built around three principles:

- **Token-first**: every color, size, and spacing value comes from `src/theme/index.ts`. No hardcoded hex, RGB, or raw pixel values anywhere in the codebase.
- **Semantic naming**: components consume tokens by semantic role (`primary`, `textMuted`, `success`) rather than by raw value. This makes light/dark mode switching trivial.
- **Atomic Design hierarchy**: UI is composed bottom-up — Atoms → Molecules → Organisms → Screens. No layer may import from a layer above it.

The primary surface is a deep navy (`#0D1B2A`). Interactive elements use a bright blue (`#2F80FF`). Accent highlights use a golden amber (`#C9972A`). Status signals use semantic greens, reds, and ambers.

---

## 2. Theme System

**File:** `src/theme/index.ts`

The theme is a single object created by `createTheme(mode)` and distributed via React Context. Every component accesses it through the `useTheme()` hook.

```typescript
import { useTheme } from 'src/theme';

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

Wrap the app root with `ThemeProvider`. The `mode` prop is read from `state.ui.themeMode` (persisted via Redux Persist).

```tsx
<ThemeProvider mode={themeMode}>
  {children}
</ThemeProvider>
```

### Theme shape

```typescript
type Theme = {
  mode: 'light' | 'dark';
  colors: ColorScale;       // semantic color tokens (mode-aware)
  design: DesignColors;     // raw design-system palette (mode-independent)
  typography: Typography;   // font families, weights, sizes, scale
  spacing: Spacing;         // base-4 spacing system
  shadows: Shadows;         // named shadow presets
  borderRadius: BorderRadius; // named radius presets
  zIndex: ZIndex;           // named z-index levels
};
```

---

## 3. Color Palette

### 3.1 Design Colors (`theme.design`) — mode-independent

These are the raw palette values from the design system. Use them when you need a specific color that does not change between light and dark mode (e.g. the navy tab bar, which is always dark).

| Token | Value | Usage |
|---|---|---|
| `navy900` | `#0B1623` | Deepest background, text on light |
| `navy800` | `#0D1B2A` | Primary app background, tab bar |
| `navy700` | `#152238` | Secondary dark surface |
| `navy600` | `#1E3048` | Tertiary dark surface |
| `amber500` | `#C9972A` | Primary accent / golden highlight |
| `amber400` | `#E0AD3D` | Warning, secondary accent |
| `amber100` | `#FFF4DC` | Amber tint background |
| `amber900` | `#7A5510` | Dark amber text |
| `blue500` | `#2F80FF` | Interactive / CTA blue |
| `blue100` | `#EFF6FF` | Blue tint background |
| `surface100` | `#FFFFFF` | Card / form background |
| `surface200` | `#F4F6F9` | Page background (light) |
| `surface300` | `#E8ECF2` | Dividers, subtle backgrounds |
| `surface400` | `#D0D6E2` | Borders |
| `textPrimary` | `#0B1623` | Primary text on light |
| `textSecondary` | `#4A5568` | Secondary text |
| `textTertiary` | `#8A94A6` | Muted / placeholder text |
| `textOnDark` | `#FFFFFF` | Text on dark surfaces |
| `textOnDarkMuted` | `#9AAFC7` | Muted text on dark surfaces |
| `success` | `#1D9E75` | Success state |
| `warning` | `#E0AD3D` | Warning state |
| `danger` | `#D85A30` | Error / destructive state |
| `info` | `#378ADD` | Informational state |

### 3.2 Semantic Colors (`theme.colors`) — mode-aware

These tokens change value between light and dark mode. Always prefer these over `theme.design` when the color should adapt to the current theme.

| Token | Light | Dark | Usage |
|---|---|---|---|
| `primary` | `#0A1628` | `#0A1628` | Primary brand color, header bg |
| `secondary` | `#1B3A6B` | `#1B3A6B` | Secondary brand, avatar bg |
| `accent` | `#C9992A` | `#C9992A` | Accent highlights |
| `background` | `#F6F8FB` | `#0A1628` | Screen background |
| `surface` | `#FFFFFF` | `#141F31` | Card / sheet background |
| `surfaceAlt` | `#EDF1F7` | `#253348` | Alternate surface (read items) |
| `border` | `#D8E0EA` | `#3A4A60` | Dividers, input borders |
| `text` | `#0A1628` | `#F6F8FB` | Primary body text |
| `textMuted` | `#52647A` | `#BCC8D9` | Secondary / placeholder text |
| `textInverse` | `#FFFFFF` | `#0A1628` | Text on colored backgrounds |
| `overlay` | `rgba(10,22,40,0.35)` | `rgba(0,0,0,0.5)` | Modal backdrops |
| `success` | `#1E7A3A` | `#41B86A` | Success feedback |
| `warning` | `#A76A00` | `#E0A93F` | Warning feedback |
| `error` | `#B4232A` | `#F16A71` | Error / destructive feedback |
| `info` | `#1B5FA8` | `#67A8E8` | Informational feedback |
| `gray50–900` | (scale) | (scale) | Neutral gray scale |

### 3.3 Screen-specific color constants

Some screens define their own local color constants for values that are intentionally fixed (not theme-aware). These are always documented at the top of the styles file.

**MotoristaScreen** (`MotoristaColors`):
```typescript
navBg: '#0D1B2A'          // always dark navy
interactive: '#2F80FF'    // always blue
success: '#1D9E75'        // always green
danger: '#D85A30'         // always red
statusBadgeActiveBg: 'rgba(29,158,117,0.25)'
statusBadgeOfflineBg: 'rgba(216,90,48,0.25)'
```

**RoleTabBar**:
```typescript
INTERACTIVE: '#FFFFFF'
TEXT_MUTED: 'rgba(255,255,255,0.45)'
NAV_BG: '#0D1B2A'
```

These are intentionally hardcoded because the tab bar and driver screen are always rendered on a dark navy background regardless of the system theme.

---

## 4. Typography

**File:** `src/theme/index.ts` → `typography`

The system font is used on all platforms (`System` on iOS, `sans-serif` on Android).

### 4.1 Font weights

| Token | Value |
|---|---|
| `regular` | `'400'` |
| `medium` | `'500'` |
| `semibold` | `'600'` |
| `bold` | `'700'` |

### 4.2 Legacy font size scale (backward-compat)

| Token | px |
|---|---|
| `xs` | 12 |
| `sm` | 14 |
| `md` | 16 |
| `lg` | 18 |
| `xl` | 20 |
| `2xl` | 24 |
| `3xl` | 30 |

### 4.3 Design-system type scale (`theme.typography.scale`)

Prefer these over the legacy scale for all new code. Each entry is a complete style object with `fontSize`, `fontWeight`, `lineHeight`, and optional `letterSpacing`.

| Token | fontSize | fontWeight | lineHeight | letterSpacing | Usage |
|---|---|---|---|---|---|
| `displayLg` | 28 | 700 | 34 | -0.5 | Hero titles |
| `displayMd` | 22 | 700 | 28 | -0.3 | Section heroes |
| `headingLg` | 20 | 600 | 26 | — | Screen titles |
| `headingMd` | 17 | 600 | 22 | — | Card titles |
| `headingSm` | 15 | 600 | 20 | — | Sub-section titles |
| `bodyLg` | 16 | 400 | 24 | — | Primary body text |
| `bodyMd` | 14 | 400 | 21 | — | Standard body text |
| `bodySm` | 13 | 400 | 19 | — | Small body text |
| `labelLg` | 14 | 600 | 18 | — | Button labels, strong labels |
| `labelMd` | 12 | 600 | 16 | 0.3 | Badge text, tab labels |
| `labelSm` | 11 | 500 | 14 | 0.5 | Micro labels |
| `caption` | 12 | 400 | 16 | — | Timestamps, helper text |

**Usage:**
```typescript
const styles = StyleSheet.create({
  title: {
    ...theme.typography.scale.headingMd,
    color: theme.colors.text,
  },
});
```

### 4.4 Text component variants

The `Text` atom maps to the legacy scale:

| Variant | fontSize | fontWeight | lineHeight |
|---|---|---|---|
| `heading` | 30 (3xl) | bold (700) | 38 |
| `subheading` | 20 (xl) | semibold (600) | 28 |
| `body` | 16 (md) | regular (400) | 24 |
| `caption` | 12 (xs) | regular (400) | 16 |
| `label` | 14 (sm) | medium (500) | 20 |

---

## 5. Spacing

**File:** `src/theme/index.ts` → `spacing`

Base-4 system. All spacing values are multiples of 4px.

### 5.1 Numeric keys (design-system, preferred for new code)

| Token | px | Common usage |
|---|---|---|
| `spacing[1]` | 4 | Micro gaps, icon padding |
| `spacing[2]` | 8 | Small gaps between elements |
| `spacing[3]` | 12 | Input padding, small card padding |
| `spacing[4]` | 16 | Standard padding, card padding |
| `spacing[5]` | 20 | Medium padding |
| `spacing[6]` | 24 | Large padding, section gaps |
| `spacing[7]` | 28 | — |
| `spacing[8]` | 32 | Extra large padding |
| `spacing[10]` | 40 | Bottom scroll padding |
| `spacing[12]` | 48 | — |
| `spacing[16]` | 64 | — |

### 5.2 Named keys (legacy, backward-compat)

| Token | px |
|---|---|
| `spacing.xs` | 4 |
| `spacing.sm` | 8 |
| `spacing.md` | 12 |
| `spacing.lg` | 16 |
| `spacing.xl` | 20 |
| `spacing['2xl']` | 24 |
| `spacing['3xl']` | 32 |
| `spacing['4xl']` | 40 |
| `spacing['5xl']` | 48 |
| `spacing['6xl']` | 64 |

---

## 6. Border Radius

**File:** `src/theme/index.ts` → `borderRadius`

### 6.1 Design-system keys (preferred)

| Token | px | Usage |
|---|---|---|
| `borderRadius.radius.sm` | 6 | Small chips, tags |
| `borderRadius.radius.md` | 10 | Buttons, inputs, cards |
| `borderRadius.radius.lg` | 16 | Large cards |
| `borderRadius.radius.xl` | 24 | Bottom sheets, modals |
| `borderRadius.radius.full` | 9999 | Pills, circular elements |

### 6.2 Legacy keys (backward-compat)

| Token | px |
|---|---|
| `borderRadius.none` | 0 |
| `borderRadius.sm` | 4 |
| `borderRadius.md` | 8 |
| `borderRadius.lg` | 12 |
| `borderRadius.xl` | 16 |
| `borderRadius.pill` | 999 |

---

## 7. Shadows & Elevation

**File:** `src/theme/index.ts` → `shadows`

Each shadow preset includes `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`, and `elevation` (Android).

| Token | elevation | Usage |
|---|---|---|
| `shadows.none` | 0 | Flat elements |
| `shadows.sm` | 1 | Subtle lift |
| `shadows.md` | 4 | Toasts, dropdowns |
| `shadows.lg` | 8 | Modals, bottom sheets |
| `shadows.card` | 3 | Standard card shadow |
| `shadows.cardHover` | 6 | Pressed/hovered card |
| `shadows.tabBar` | 10 | Bottom tab bar (upward shadow) |

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

| Token | Value | Usage |
|---|---|---|
| `zIndex.base` | 0 | Default layer |
| `zIndex.dropdown` | 100 | Dropdowns, popovers |
| `zIndex.sticky` | 200 | Sticky headers |
| `zIndex.overlay` | 400 | Loading overlays |
| `zIndex.modal` | 1000 | Modals, bottom sheets |
| `zIndex.toast` | 1100 | Global toast (always on top) |

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

**Rule:** Screens import from any component layer. Organisms may read Redux state directly (e.g. `RoleTabBar` reads `naoVisualizadasCount`). Molecules and atoms are pure — they receive all data via props.

All components:
- Use `useTheme()` for all style values — no hardcoded colors or sizes
- Export a `displayName` for React DevTools
- Accept a `testID` prop for test targeting
- Are documented with JSDoc `@param` and `@returns`

---

## 10. Atoms

**Directory:** `src/components/atoms/`

Atoms are the smallest reusable UI primitives. They have no business logic and no Redux dependency.

---

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

| Variant | Background | Border | Text |
|---|---|---|---|
| `primary` | `colors.primary` | none | `colors.textInverse` |
| `secondary` | `colors.surface` | `colors.primary` (1px) | `colors.primary` |
| `ghost` | `colors.surface` | none | `colors.text` |
| `danger` | `colors.error` | none | `colors.white` |

| Size | Min height | Vertical padding |
|---|---|---|
| `sm` | 64px | `spacing.sm` (8) |
| `md` | 72px | `spacing.md` (12) |
| `lg` | 80px | `spacing.lg` (16) |

When `loading=true`, the label is replaced by an `ActivityIndicator` in the variant's text color. When `disabled=true` or `loading=true`, opacity drops to 0.5.

---

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

---

### Input

**File:** `src/components/atoms/Input.tsx`

Themed text input with label, error/helper feedback, icon slots, and secure toggle. Supports `ref` forwarding.

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

Border behavior:
- Default: 1px `colors.border`
- Focused: 2px `colors.secondary`
- Error: 2px `colors.error`

The `secureToggle` prop adds a visibility toggle button using the `Icon` atom.

---

### Avatar

**File:** `src/components/atoms/Avatar.tsx`

User avatar with image support, initials fallback, and online badge.

```typescript
interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  testID?: string;
}
```

| Size | px |
|---|---|
| `xs` | 40 |
| `sm` | 48 |
| `md` | 64 |
| `lg` | 88 |
| `xl` | 104 |

Initials are derived from the first and last word of `name`. The fallback background is `colors.secondary`. The online badge is `colors.success` with a `colors.surface` border.

---

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

| Variant | Background | Text |
|---|---|---|
| `default` | `surfaceAlt` | `text` |
| `primary` | `secondary` | `textInverse` |
| `success` | `success` | `white` |
| `warning` | `warning` | `white` |
| `error` | `error` | `white` |

---

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

| Size | px (maps to `typography.fontSize`) |
|---|---|
| `xs` | 12 |
| `sm` | 14 |
| `md` | 16 |
| `lg` | 18 |
| `xl` | 20 |

Minimum touch target: 24×24px.

---

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

Background: `colors.surfaceAlt`. Default border radius: `borderRadius.md` (8px).

---

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

Line color: `colors.border` at `StyleSheet.hairlineWidth`. Label text uses `caption` variant in `textMuted`.

---

## 11. Molecules

**Directory:** `src/components/molecules/`

Molecules compose atoms into functional UI units. They are pure (no Redux) unless explicitly noted.

---

### SearchBar

**File:** `src/components/molecules/SearchBar.tsx`

Expandable search input with debounced callback and animated expand/collapse.

```typescript
interface SearchBarProps {
  value?: string;
  onChangeText?: (value: string) => void;
  onDebouncedChange?: (value: string) => void;
  debounceMs?: number;           // default: 300
  placeholderKey?: string;       // i18n key, default: 'common.search'
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
```

Collapsed state shows a square icon button. Expanded state shows a full `Input` with a clear button. Expand/collapse is animated with `Easing.out(Easing.cubic)` over 220ms.

---

### MessageBubble

**File:** `src/components/molecules/MessageBubble.tsx`

Chat message bubble with delivery status ticks and press animation.

```typescript
interface MessageBubbleProps {
  message: Message;
  isSentByCurrentUser: boolean;
  timestamp: string;
  style?: StyleProp<ViewStyle>;
  onPress?: (message: Message) => void;
  testID?: string;
}
```

- Outgoing: `colors.primary` background, `textInverse` text, right-aligned
- Incoming: `colors.surface` background, `text` text, left-aligned, 1px `colors.border`
- Max width: 75% of container
- Status icons: `done` (sent/delivered) or `done-all` (read) in `colors.accent`; `colors.error` on failure
- Press animation: scale 1 → 0.98 → 1 over 100ms

---

### UserListItem

**File:** `src/components/molecules/UserListItem.tsx`

User row with avatar, name, role, status, and chevron. Press animation: scale 1 → 0.98.

```typescript
interface UserListItemProps {
  user: User;
  onPress?: (user: User) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
```

---

### NotificationItem

**File:** `src/components/molecules/NotificationItem.tsx`

Swipeable notification row with left-swipe dismiss gesture and priority color stripe.

```typescript
interface NotificationItemProps {
  notification: Notification;
  timeLabel: string;
  onPress?: (notification: Notification) => void;
  onDismiss?: (notification: Notification) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
```

Priority stripe colors:
- `CRITICAL` → `colors.error`
- `HIGH` → `colors.warning`
- `MEDIUM` → `colors.info`
- `LOW` → `colors.border`

Unread items use `colors.surface`; read items use `colors.surfaceAlt`.

Swipe threshold: 64px left → triggers dismiss animation then `onDismiss` callback.

---

### QuickActionCard

**File:** `src/components/molecules/QuickActionCard.tsx`

Dashboard action card with icon, optional label, and press animation.

```typescript
interface QuickActionCardProps {
  iconName: MaterialIcons['name'];
  label?: string;
  description?: string;
  onPress?: () => void;
  showLabels?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
```

Icon container: `colors.surfaceAlt` background, `borderRadius.md`. Press animation: scale 1 → 0.97.

---

### RoleTabBar

**File:** `src/components/molecules/RoleTabBar.tsx`

Shared dark-navy bottom tab bar used by both `MotoristaNavigator` and `PassageiroNavigator`. **Reads Redux state directly** (`corrida.naoVisualizadasCount`) for the message badge.

```typescript
interface RoleTabBarProps extends BottomTabBarProps {
  tabConfig: Record<string, TabConfig>;
  testIdPrefix?: string;
}

interface TabConfig {
  activeIcon: TabIconName;
  inactiveIcon: TabIconName;
  labelKey: string;  // i18n key
}
```

Visual constants (always dark, not theme-aware):
- Background: `#0D1B2A`
- Active icon/label: `#FFFFFF`
- Inactive icon/label: `rgba(255,255,255,0.45)`
- Active indicator: 20×3px white pill at top of tab
- Badge: `colors.error` background, `colors.textInverse` text, 16px circle

Badge routes: `PassageiroCorridas`, `MotoristaCorridas`.

---

### CorridaStatusBadge

**File:** `src/components/molecules/CorridaStatusBadge.tsx`

Pill badge for corrida status. Uses `statusColor()` from `CorridasScreens.styles.ts` for the background color.

```typescript
interface CorridaStatusBadgeProps {
  status: CorridaStatus;
  testID?: string;
}
```

Status → color mapping:
| Status | Color token |
|---|---|
| `SOLICITADA` | `colors.info` |
| `ACEITA` | `colors.success` |
| `RECUSADA` | `colors.error` |
| `EM_DESLOCAMENTO` | `colors.warning` |
| `PASSAGEIRO_EMBARCADO` | `colors.accent` |
| `FINALIZADA` | `colors.success` |
| `CANCELADA` | `colors.error` |

---

### RideCard

**File:** `src/components/molecules/RideCard.tsx`

Pressable card showing corrida summary: status pill, date/time, origin, destination, and motivo. Uses `HistoricoCorridas.styles.ts` for layout.

```typescript
interface RideCardProps {
  corrida: Corrida;
  onPress: (corridaId: string) => void;
  isLast?: boolean;
  testID?: string;
}
```

---

### RouteInfoRow

**File:** `src/components/molecules/RouteInfoRow.tsx`

Single row showing an origin or destination with icon and address text. Used in ride detail screens.

---

### CallCard

**File:** `src/components/molecules/CallCard.tsx`

Call history row with caller info, duration, and call type icon.

---

### MapboxContainer

**File:** `src/components/molecules/MapboxContainer.tsx`

Safe wrapper around `@rnmapbox/maps` that exports `MapboxGL` as `null` when the native module is unavailable (Expo Go, web, CI). Screens check `if (MapboxGL)` before rendering map content.

---

## 12. Organisms

**Directory:** `src/components/organisms/`

Organisms are complex UI blocks that may read from Redux and compose multiple molecules and atoms.

---

### AppHeader

**File:** `src/components/organisms/AppHeader.tsx`

Top navigation bar with optional back button and right action slot. Reads the current route name from React Navigation to infer the title when none is provided.

```typescript
interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
```

Background: `colors.primary`. Title: `textInverse`, `label` variant, centered. Back button: `MaterialIcons` `arrow-back`, 44×44px touch target. Safe area inset is applied to `paddingTop`.

---

### BottomTabBar

**File:** `src/components/organisms/BottomTabBar.tsx`

Legacy tab bar used by `MainTabNavigator` (non-role-specific flows). Superseded by `RoleTabBar` for driver and passenger navigators.

---

### GlobalToast

**File:** `src/components/organisms/GlobalToast.tsx`

Global toast notification queue. Renders the first toast from `state.ui.toasts`. Auto-dismisses after `toast.duration` ms (default 3000ms). Positioned above all content via `zIndex.toast` (1100).

```typescript
// Dispatching a toast:
dispatch(addToast({
  id: `unique-id-${Date.now()}`,
  message: 'Operation successful',
  type: 'success',  // 'success' | 'error' | 'warning' | 'info'
  duration: 3000,   // optional
}));
```

| Type | Background | Text |
|---|---|---|
| `success` | `colors.success` | `white` |
| `error` | `colors.error` | `white` |
| `warning` | `colors.warning` | `white` |
| `info` | `colors.info` | `white` |

---

### NetworkBanner

**File:** `src/components/organisms/NetworkBanner.tsx`

Full-screen modal overlay that blocks interaction during network outages and WebSocket reconnection. Shows a 2-second green success flash on recovery.

States:
- `hidden` — renders nothing (healthy connection)
- `offline` — wifi-off icon, `colors.error`, blocks all interaction
- `reconnecting` — spinner + retry count + retry button, blocks interaction
- `recovered` — green check, `colors.success` background, auto-hides after 2s

Startup grace period: 8 seconds after app activation before showing the reconnecting banner. This prevents the overlay from blocking the UI during the initial WebSocket handshake.

Reads from `NetworkContext` when available; falls back to Redux `ui.isConnected` + `realtime.connectionStatus`.

---

## 13. Screen-Level Styles

Each screen domain has a co-located styles file that creates a `StyleSheet` from theme tokens.

### Pattern

```typescript
// NomeScreen.styles.ts
import { StyleSheet } from 'react-native';
import { type Theme } from '../../theme';

export const createNomeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    // ...
  });
```

```typescript
// NomeScreen.tsx
const styles = useMemo(() => createNomeStyles(theme), [theme]);
```

The `useMemo` ensures the stylesheet is only recreated when the theme changes (e.g. light/dark toggle).

### Shared Corridas styles

**File:** `src/screens/Corridas/CorridasScreens.styles.ts`

Shared across all corrida screens. Exports `createCorridasStyles(theme)` and the `statusColor(status, theme)` helper.

Key style groups:
- `container` / `scrollContent` — screen layout
- `card` / `cardTitle` / `cardRow` / `cardLabel` / `cardValue` — info cards
- `actionButton` / `actionButtonPrimary` / `actionButtonSuccess` / `actionButtonDanger` — CTA buttons
- `sectionHeader` — section titles
- `emptyContainer` / `emptyTitle` / `emptySubtitle` — empty states
- `messageBubble` / `messageBubbleSelf` / `messageBubbleOther` — inline chat
- `loadingOverlay` — full-screen loading

### MotoristaScreen styles

**File:** `src/screens/Motorista/MotoristaScreen.styles.ts`

Driver home screen with map + bottom sheets. Key groups:
- `container` / `mapWrapper` / `map` — full-screen map layout
- `fabColumn` / `fab` / `fabLocation` — floating action buttons
- `statusHeaderRow` / `statusInlineBadge` / `statusPillDot` — status header
- `idleSheet` / `activeSheet` — bottom sheet containers (position: absolute, bottom: 0)
- `dragHandle` — sheet drag indicator
- `actionButton*` — lifecycle action buttons
- `chatFab` / `chatFabBadge` — floating chat button
- `userMarkerPulse` / `userMarkerRing` / `userMarkerDot` — GPS marker
- `destinationPin` / `originPin` — map pins
- `loadingOverlay` — full-screen loading

### LoginScreen styles

**File:** `src/screens/Auth/LoginScreen.styles.ts`

Two-zone layout:
- Top 35%: `logoArea` on `design.navy800` — logo mark (4 amber squares) + app name
- Bottom 65%: `card` on `design.surface100` with `borderRadius.radius.xl` top corners

Logo mark: 4×18px amber squares in a 2×2 grid with `spacing[1]` gap.

---

## 14. Navigation Structure

**Directory:** `src/navigation/`

React Navigation 6 with typed param lists for every navigator.

### Navigator tree

```
RootNavigator (Stack)
├── Auth (Stack)
│   ├── Login
│   └── ForgotPassword
├── Main (Bottom Tabs) — legacy, non-role flows
│   ├── HomeTab
│   ├── ChatTab (Stack) → ConversationList, ChatRoom, NewConversation
│   ├── CallsTab (Stack) → CallHistory, ActiveCall, IncomingCall
│   ├── NotificationsTab
│   └── ProfileTab (Stack) → Profile, Settings
├── Passageiro (Bottom Tabs) — USUARIO / ADMIN role
│   ├── PassageiroHome (map + active ride)
│   ├── PassageiroCorridas (Stack)
│   │   ├── PassageiroCorridasList
│   │   ├── AcompanharCorrida
│   │   ├── CorridaMensagens
│   │   ├── AvaliarCorrida
│   │   └── AdminAvaliacoes
│   ├── PassageiroNotificacoes
│   └── PassageiroProfile
└── Motorista (Bottom Tabs) — MOTORISTA role
    ├── MotoristaHome (map + active ride)
    ├── MotoristaCorridas (Stack)
    │   ├── MotoristaCorridasList
    │   ├── MotoristaCorridaDetalhe
    │   ├── MotoristaCorridaAction
    │   ├── CorridaMensagens
    │   ├── VeiculoAssociation
    │   └── MinhaNota
    ├── MotoristaNotificacoes
    └── MotoristaProfile
```

### Role routing

`RootNavigator` reads `state.auth.motoristaId` and `state.auth.papeis` to decide which navigator to render:
- `motoristaId` non-null → `Motorista`
- `papeis` includes `USUARIO` or `ADMIN` → `Passageiro`
- Fallback → `Passageiro`

While `state.auth.isHydrating` is true, a full-screen `HydrationSplash` is shown to prevent role mis-routing during cold start.

### navigationRef

**File:** `src/navigation/navigationRef.ts`

A `createNavigationContainerRef<RootStackParamList>()` attached to `<NavigationContainer ref={navigationRef}>` in `App.tsx`. Used for imperative navigation from outside the React tree (push notification deep-links, killed-app cold-start).

```typescript
import { navigationRef } from 'src/navigation/navigationRef';

if (navigationRef.isReady()) {
  navigationRef.navigate('Motorista', { screen: 'MotoristaCorridas', ... });
}
```

### Typed params

All screen params are typed in `src/navigation/types.ts`. Every `useRoute<RouteProp<ParamList, 'ScreenName'>>()` call must use these types.

---

## 15. State Management

**Directory:** `src/store/`

Redux Toolkit with `redux-persist` for selective persistence.

### Slices

| Slice | Persisted | Key data |
|---|---|---|
| `authSlice` | ✅ | `user`, `token`, `isAuthenticated`, `papeis`, `motoristaId`, `municipioId`, `statusOperacional`, `servidorId` |
| `uiSlice` | ✅ | `themeMode`, `language` |
| `locationSlice` | ✅ | `lastKnown`, `lastFixAt`, `permissionStatus` |
| `corridaSlice` | ❌ | `activeCorrida`, `mensagens`, `posicaoMotoristaAtual`, `unreadMensagens` |
| `realtimeSlice` | ❌ | `connectionStatus`, `pendingOffer`, `availableCorridaIds` |
| `notificationsSlice` | ❌ | `notifications`, `unreadCount`, `permissionStatus` |
| `chatSlice` | ❌ | conversations, messages |
| `callsSlice` | ❌ | call history, active call |

### Toast system

Toasts are queued in `uiSlice.toasts`. `GlobalToast` renders the first item and auto-dismisses it. Dispatch `addToast` from any hook or thunk.

### Driver status persistence

`statusOperacional` is persisted in `authSlice`. On cold start, `useAuthSession` calls `getMe()` and, if the server returns `OFFLINE` but the persisted status was `DISPONIVEL`, automatically calls `PATCH /frota/motoristas/me/status` to restore the driver's intent.

---

## 16. Internationalization

**Directory:** `src/i18n/`

`i18next` + `react-i18next`. Three locales: `pt-BR` (default), `en-US`, `es`.

### Usage

```typescript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
t('corridas.status.aceita')  // → 'Aceita' / 'Accepted' / 'Aceptada'
```

### Namespace structure (flat JSON)

```
common.*          — shared labels (loading, cancel, confirm, roles, statuses)
home.*            — home screen
auth.*            — login, logout, CPF, password
errors.*          — network error, session expired
navigation.*      — tab labels, screen titles
ui.*              — toast dismiss, network banner messages
corridas.*        — full ride lifecycle (status, actions, errors, messages)
motorista.*       — driver-specific (status, map, tabs)
passageiro.*      — passenger-specific (map, tabs, ride request)
frota.*           — fleet management
servidores.*      — public servants
notifications.*   — notification inbox + push notification copy
profile.*         — profile screen
chat.*            — chat messages, status ticks
calls.*           — call history, active call
```

### Language switching

```typescript
import { useLanguage } from 'src/i18n/useLanguage';

const { language, changeLanguage } = useLanguage();
changeLanguage('en-US');
```

The active language is persisted in `uiSlice.language`.

---

## 17. Rules & Conventions

### Styling rules

1. **Never hardcode colors.** Use `theme.colors.*` or `theme.design.*`.
2. **Never hardcode spacing.** Use `theme.spacing[N]` or `theme.spacing.sm/md/lg`.
3. **Never hardcode border radius.** Use `theme.borderRadius.radius.*`.
4. **Never hardcode shadows.** Use `theme.shadows.*`.
5. **Always wrap StyleSheet creation in `useMemo`** when it depends on the theme.
6. **Screen-specific color constants** (like `MotoristaColors`) are allowed only when the values are intentionally fixed (e.g. always-dark surfaces). Document them clearly.

### Component rules

1. **Atoms are pure** — no Redux, no side effects, all data via props.
2. **Molecules are pure** — same rule. Exception: `RoleTabBar` reads Redux for the badge count.
3. **Organisms may read Redux** — but should not dispatch actions directly; use callbacks.
4. **Every exported component has `displayName`** for React DevTools.
5. **Every exported component accepts `testID`** for test targeting.
6. **JSDoc on every exported symbol** — `@param`, `@returns`, English only.

### i18n rules

1. **Zero hardcoded user-facing strings.** Every visible string uses `t('key')`.
2. **All three locales must be updated** when adding new strings.
3. **Keys follow dot-notation namespacing** — `domain.sub.key`.

### Import aliases

Always use path aliases, never relative paths that cross module boundaries:

```typescript
import { Button } from '@components/atoms';
import { useTheme } from '@theme/index';
import { useAppSelector } from '@store/index';
import { Corrida } from '@models/Corrida';
```

Available aliases: `@components`, `@screens`, `@navigation`, `@services`, `@models`, `@store`, `@hooks`, `@i18n`, `@theme`, `@utils`, `@config`.
