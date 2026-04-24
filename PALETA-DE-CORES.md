# PALETA DE CORES - VAMU Delivery App

Documentação completa da paleta de cores do VAMU Delivery App, incluindo temas Light e Dark, e guia de aplicação para padronização em outros projetos.

## 📋 Índice

- [Tema Light](#tema-light)
- [Tema Dark](#tema-dark)
- [Cores de Status](#cores-de-status)
- [Aplicação em Outros Projetos](#aplicação-em-outros-projetos)
  - [CSS/SCSS](#cssscss)
  - [JavaScript/TypeScript](#javascripttypescript)
  - [React/React Native](#reactreact-native)
  - [Tailwind CSS](#tailwind-css)
  - [Figma/Design Tools](#figmadesign-tools)

---

## 🎨 Tema Light

### Cores Principais

| Cor | Nome | Hex | RGB | Uso |
|-----|------|-----|-----|-----|
| **Primary** | Azul Profundo | `#0B3D91` | `rgb(11, 61, 145)` | Botões principais, links, elementos de destaque |
| **Secondary** | Laranja Vibrante | `#FF6A3D` | `rgb(255, 106, 61)` | Botões secundários, CTAs, ações importantes |
| **Accent** | Verde Menta | `#2DD4BF` | `rgb(45, 212, 191)` | Elementos de destaque, badges, indicadores positivos |

### Cores de Fundo

| Cor | Nome | Hex | RGB | Uso |
|-----|------|-----|-----|-----|
| **Background** | Fundo Principal | `#F0F3F5` | `rgb(240, 243, 245)` | Fundo da aplicação |
| **Background Secondary** | Fundo Secundário | `#FFFFFF` | `rgb(255, 255, 255)` | Fundo de seções alternadas |
| **Card** | Fundo de Cartões | `#FFFFFF` | `rgb(255, 255, 255)` | Cards, modais, containers elevados |

### Cores de Texto

| Cor | Nome | Hex | RGB | Uso |
|-----|------|-----|-----|-----|
| **Text Primary** | Texto Principal | `#1F2937` | `rgb(31, 41, 55)` | Títulos, textos principais |
| **Text Secondary** | Texto Secundário | `#6B7280` | `rgb(107, 114, 128)` | Subtítulos, textos secundários, placeholders |

### Cores Auxiliares

| Cor | Nome | Hex | RGB | Uso |
|-----|------|-----|-----|-----|
| **Border** | Borda | `#E5E7EB` | `rgb(229, 231, 235)` | Bordas de inputs, divisores |
| **Shadow** | Sombra | `rgba(11,61,145,0.08)` | `rgba(11, 61, 145, 0.08)` | Sombras de elevação |

---

## 🌙 Tema Dark

### Cores Principais

| Cor | Nome | Hex | RGB | Uso |
|-----|------|-----|-----|-----|
| **Primary** | Azul Claro | `#3B82F6` | `rgb(59, 130, 246)` | Botões principais, links, elementos de destaque |
| **Secondary** | Laranja Vibrante | `#FF6A3D` | `rgb(255, 106, 61)` | Botões secundários, CTAs (mantém cor) |
| **Accent** | Verde Menta | `#2DD4BF` | `rgb(45, 212, 191)` | Elementos de destaque (mantém cor) |

### Cores de Fundo

| Cor | Nome | Hex | RGB | Uso |
|-----|------|-----|-----|-----|
| **Background** | Fundo Principal | `#1A1F2E` | `rgb(26, 31, 46)` | Fundo da aplicação |
| **Background Secondary** | Fundo Secundário | `#2D3646` | `rgb(45, 54, 70)` | Fundo de seções alternadas |
| **Card** | Fundo de Cartões | `#2D3646` | `rgb(45, 54, 70)` | Cards, modais, containers elevados |

### Cores de Texto

| Cor | Nome | Hex | RGB | Uso |
|-----|------|-----|-----|-----|
| **Text Primary** | Texto Principal | `#F0F4F8` | `rgb(240, 244, 248)` | Títulos, textos principais |
| **Text Secondary** | Texto Secundário | `#A8B3C1` | `rgb(168, 179, 193)` | Subtítulos, textos secundários |

### Cores Auxiliares

| Cor | Nome | Hex | RGB | Uso |
|-----|------|-----|-----|-----|
| **Border** | Borda | `#2D3442` | `rgb(45, 52, 66)` | Bordas de inputs, divisores |
| **Shadow** | Sombra | `rgba(0,0,0,0.4)` | `rgba(0, 0, 0, 0.4)` | Sombras de elevação |

---

## 🚦 Cores de Status

As cores de status são consistentes entre os temas Light e Dark:

| Status | Cor | Hex | RGB | Uso |
|--------|-----|-----|-----|-----|
| **Success** | Verde Menta | `#2DD4BF` | `rgb(45, 212, 191)` | Sucesso, confirmações, estados positivos |
| **Error** | Vermelho | `#EF4444` | `rgb(239, 68, 68)` | Erros, alertas críticos, ações destrutivas |
| **Warning** | Laranja/Amarelo | `#F59E0B` | `rgb(245, 158, 11)` | Avisos, alertas, atenção necessária |
| **Pending** | Cinza | `#6B7280` (Light) / `#A8B3C1` (Dark) | - | Estados pendentes, em processamento |

---

## 🔧 Aplicação em Outros Projetos

### CSS/SCSS

#### CSS Variables (Recomendado)

```css
:root {
  /* Light Theme */
  --color-primary: #0B3D91;
  --color-secondary: #FF6A3D;
  --color-accent: #2DD4BF;
  --color-background: #F0F3F5;
  --color-background-secondary: #FFFFFF;
  --color-card: #FFFFFF;
  --color-text-primary: #1F2937;
  --color-text-secondary: #6B7280;
  --color-border: #E5E7EB;
  --color-shadow: rgba(11, 61, 145, 0.08);
  
  /* Status Colors */
  --color-success: #2DD4BF;
  --color-error: #EF4444;
  --color-warning: #F59E0B;
  --color-pending: #6B7280;
}

[data-theme="dark"] {
  --color-primary: #3B82F6;
  --color-secondary: #FF6A3D;
  --color-accent: #2DD4BF;
  --color-background: #1A1F2E;
  --color-background-secondary: #2D3646;
  --color-card: #2D3646;
  --color-text-primary: #F0F4F8;
  --color-text-secondary: #A8B3C1;
  --color-border: #2D3442;
  --color-shadow: rgba(0, 0, 0, 0.4);
  --color-pending: #A8B3C1;
}

/* Uso */
.button-primary {
  background-color: var(--color-primary);
  color: var(--color-text-primary);
}

.card {
  background-color: var(--color-card);
  border: 1px solid var(--color-border);
  box-shadow: 0 2px 8px var(--color-shadow);
}
```

#### SCSS Variables

```scss
// Light Theme
$color-primary: #0B3D91;
$color-secondary: #FF6A3D;
$color-accent: #2DD4BF;
$color-background: #F0F3F5;
$color-background-secondary: #FFFFFF;
$color-card: #FFFFFF;
$color-text-primary: #1F2937;
$color-text-secondary: #6B7280;
$color-border: #E5E7EB;
$color-shadow: rgba(11, 61, 145, 0.08);

// Dark Theme
$color-primary-dark: #3B82F6;
$color-background-dark: #1A1F2E;
$color-card-dark: #2D3646;
$color-text-primary-dark: #F0F4F8;
$color-text-secondary-dark: #A8B3C1;
$color-border-dark: #2D3442;
$color-shadow-dark: rgba(0, 0, 0, 0.4);

// Status Colors
$color-success: #2DD4BF;
$color-error: #EF4444;
$color-warning: #F59E0B;
$color-pending: #6B7280;
$color-pending-dark: #A8B3C1;

// Mixin para tema
@mixin theme($theme: light) {
  @if $theme == dark {
    --color-primary: #{$color-primary-dark};
    --color-background: #{$color-background-dark};
    // ... outras variáveis dark
  } @else {
    --color-primary: #{$color-primary};
    --color-background: #{$color-background};
    // ... outras variáveis light
  }
}
```

### JavaScript/TypeScript

#### Objeto de Cores

```typescript
export const vamuColors = {
  light: {
    primary: '#0B3D91',
    secondary: '#FF6A3D',
    accent: '#2DD4BF',
    background: '#F0F3F5',
    backgroundSecondary: '#FFFFFF',
    card: '#FFFFFF',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    shadow: 'rgba(11,61,145,0.08)',
    status: {
      success: '#2DD4BF',
      error: '#EF4444',
      warning: '#F59E0B',
      pending: '#6B7280',
    },
  },
  dark: {
    primary: '#3B82F6',
    secondary: '#FF6A3D',
    accent: '#2DD4BF',
    background: '#1A1F2E',
    backgroundSecondary: '#2D3646',
    card: '#2D3646',
    textPrimary: '#F0F4F8',
    textSecondary: '#A8B3C1',
    border: '#2D3442',
    shadow: 'rgba(0,0,0,0.4)',
    status: {
      success: '#2DD4BF',
      error: '#EF4444',
      warning: '#F59E0B',
      pending: '#A8B3C1',
    },
  },
};

// Função helper
export const getThemeColors = (isDark: boolean = false) => {
  return isDark ? vamuColors.dark : vamuColors.light;
};
```

### React/React Native

#### Hook de Tema

```typescript
import { useState, useEffect, createContext, useContext } from 'react';

const ThemeContext = createContext<{
  isDark: boolean;
  colors: typeof vamuColors.light;
  toggleTheme: () => void;
} | null>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(false);

  const colors = isDark ? vamuColors.dark : vamuColors.light;

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// Uso em componentes
const MyComponent = () => {
  const { colors } = useTheme();
  
  return (
    <div style={{ 
      backgroundColor: colors.background,
      color: colors.textPrimary 
    }}>
      Conteúdo
    </div>
  );
};
```

### Tailwind CSS

#### Configuração do tailwind.config.js

```javascript
module.exports = {
  darkMode: 'class', // ou 'media'
  theme: {
    extend: {
      colors: {
        // Light Theme
        primary: {
          DEFAULT: '#0B3D91',
          light: '#3B82F6', // Para dark mode
        },
        secondary: '#FF6A3D',
        accent: '#2DD4BF',
        background: {
          DEFAULT: '#F0F3F5',
          dark: '#1A1F2E',
          secondary: '#FFFFFF',
          'secondary-dark': '#2D3646',
        },
        card: {
          DEFAULT: '#FFFFFF',
          dark: '#2D3646',
        },
        text: {
          primary: {
            DEFAULT: '#1F2937',
            dark: '#F0F4F8',
          },
          secondary: {
            DEFAULT: '#6B7280',
            dark: '#A8B3C1',
          },
        },
        border: {
          DEFAULT: '#E5E7EB',
          dark: '#2D3442',
        },
        status: {
          success: '#2DD4BF',
          error: '#EF4444',
          warning: '#F59E0B',
          pending: '#6B7280',
          'pending-dark': '#A8B3C1',
        },
      },
      boxShadow: {
        'vamu': '0 2px 8px rgba(11, 61, 145, 0.08)',
        'vamu-dark': '0 2px 8px rgba(0, 0, 0, 0.4)',
      },
    },
  },
};

// Uso
// <div className="bg-background dark:bg-background-dark text-text-primary dark:text-text-primary-dark">
```

### Figma/Design Tools

#### Variáveis de Cor no Figma

1. **Criar Variáveis de Cor:**
   - Light Theme:
     - `primary`: `#0B3D91`
     - `secondary`: `#FF6A3D`
     - `accent`: `#2DD4BF`
     - `background`: `#F0F3F5`
     - `card`: `#FFFFFF`
     - `text/primary`: `#1F2937`
     - `text/secondary`: `#6B7280`
   
   - Dark Theme:
     - `primary`: `#3B82F6`
     - `background`: `#1A1F2E`
     - `card`: `#2D3646`
     - `text/primary`: `#F0F4F8`
     - `text/secondary`: `#A8B3C1`

2. **Criar Modos de Cor:**
   - Criar modo "Light" e "Dark"
   - Associar as variáveis aos respectivos modos

3. **Exportar para CSS:**
   - Usar plugins como "Figma Tokens" ou "Style Dictionary"

---

## 📐 Guia de Padronização

### Regras de Uso

1. **Cores Principais:**
   - `primary`: Use para ações principais, links importantes, elementos de navegação
   - `secondary`: Use para CTAs, botões de ação secundária, destaques
   - `accent`: Use para badges, indicadores positivos, elementos de destaque sutil

2. **Cores de Fundo:**
   - `background`: Fundo principal da aplicação
   - `backgroundSecondary`: Use para criar contraste em seções alternadas
   - `card`: Use para cards, modais, containers elevados

3. **Cores de Texto:**
   - `textPrimary`: Títulos (H1-H6), textos importantes
   - `textSecondary`: Subtítulos, descrições, textos de apoio

4. **Cores de Status:**
   - Use consistentemente para feedback visual
   - Mantenha a mesma cor entre temas quando possível

### Contraste e Acessibilidade

- **WCAG AA:** Todos os textos devem ter contraste mínimo de 4.5:1 com o fundo
- **WCAG AAA:** Para textos grandes, contraste mínimo de 3:1
- Teste sempre os contrastes entre `textPrimary`/`textSecondary` e os fundos

### Exemplo de Aplicação

```css
/* Botão Primário */
.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-text-primary);
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
}

/* Card */
.card {
  background-color: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px var(--color-shadow);
}

/* Texto */
.heading {
  color: var(--color-text-primary);
  font-size: 24px;
  font-weight: 600;
}

.body-text {
  color: var(--color-text-secondary);
  font-size: 16px;
}
```

---

## 📝 Notas Importantes

- As cores `secondary` e `accent` são mantidas consistentes entre os temas para melhor reconhecimento visual
- A cor `primary` muda entre temas para melhor legibilidade e contraste
- Sempre teste a aplicação em ambos os temas (Light e Dark)
- Mantenha a consistência ao aplicar essas cores em diferentes plataformas

---

**Última atualização:** 2024

