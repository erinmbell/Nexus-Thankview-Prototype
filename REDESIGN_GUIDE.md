# ThankView Redesign Guide — Complete Styling & Structure Reference

> **Purpose**: This document captures every visual detail of the ThankView prototype application — design tokens, component patterns, page structures, layout hierarchy, and interaction states. Use it to guide a redesign of the production ThankView app to match this prototype's styling exactly.
>
> **How to use**: This guide assumes your target repo already uses **Mantine** as its component library. You do NOT need to switch frameworks. Instead, you will override Mantine's default styling using its built-in `createTheme()` API and component-level `styles` props. The companion file `theme.ts` (Section 14) contains a complete `createTheme()` call you can drop into your app — it overrides every relevant Mantine component (Button, Modal, TextInput, etc.) to match this prototype's look. The Tailwind config and CSS variables handle everything outside of Mantine components.
>
> Section 1 contains copy-pasteable configuration files (theme, Tailwind config, CSS). Sections 2-12 describe how those tokens are applied throughout the UI. When implementing a page or component, cross-reference the page structure (Section 8) with the recurring patterns (Section 9) and component reference (Section 10).

---

## TABLE OF CONTENTS

**Upload Checklist**: To use this guide, upload TWO files to your new Claude chat:
1. ✅ This file (`REDESIGN_GUIDE.md`)
2. ✅ The Mantine theme file (`src/app/theme.ts` — 590 lines)

**Sections:**
0. [Design Principles & Visual Identity](#0-design-principles--visual-identity)
1. [Design System Foundation](#1-design-system-foundation) — copy-pasteable configs (CSS, Tailwind, fonts)
2. [Typography System](#2-typography-system)
3. [Color Tokens](#3-color-tokens)
4. [Spacing, Radius & Shadows](#4-spacing-radius--shadows)
5. [Layout Architecture](#5-layout-architecture) — sidebar + topbar + main content shell
6. [Sidebar Navigation](#6-sidebar-navigation) — complete nav item list & styling
7. [TopBar & Global Search](#7-topbar--global-search)
8. [Page-by-Page Structure](#8-page-by-page-structure) — every page's layout blueprint
9. [Recurring UI Patterns](#9-recurring-ui-patterns) — tables, cards, modals, drawers, buttons
10. [Reusable Component Patterns](#10-reusable-component-patterns) — copy-pasteable HTML/CSS for cards, filters, inputs, buttons, RTE, etc.
11. [Responsive Behavior](#11-responsive-behavior)
12. [Accessibility Standards](#12-accessibility-standards)
13. [Mantine Component Restyling Guide](#13-mantine-component-restyling-guide) — what changes from default Mantine & how
14. [Companion File: theme.ts](#companion-file-themets-mantine-theme--590-lines)
15. [Shared Components](#shared-components-copy-pasteable) — DashCard, ChartBox, DRAWER_STYLES

---

## 0. DESIGN PRINCIPLES & VISUAL IDENTITY

Before diving into tokens and components, understand the overall aesthetic:

### Visual Identity
- **Color personality**: Purple-forward brand (#7c45b0) with lavender tints. The app feels "warm professional" — not corporate-cold, not playful-bright.
- **Surface strategy**: White cards on a very subtle off-white background (#fafbfc). Cards use lavender-purple borders (#8a7aab, #9a8ab5), not gray. This is distinctive — everything has a slight purple tint.
- **Typography**: Roboto for all UI text. Fraunces (a variable serif display font) ONLY for stat numbers and hero text — never for body copy or headings. Headings use Roboto at weight 900 (black).
- **Shape language**: Everything is soft and rounded. Buttons are pill-shaped (full radius). Cards have 20px radius. Inputs have 10px radius. There are no sharp corners anywhere.
- **Interaction model**: Hover states use lavender backgrounds (#ede5f7, #f5f3fa). Active/selected states use light purple tint (#f3eeff) with purple borders. Purple text (#7c45b0) indicates clickable/interactive elements.

### Key Distinctions from Typical SaaS Styling
1. **Purple borders everywhere** — not gray. Even subtle borders use #9a8ab5 (a muted purple), not #e5e7eb.
2. **Pill-shaped buttons** — all buttons use `border-radius: 9999px`, never squared or slightly rounded.
3. **Circular checkboxes** — checkboxes render as circles (radio-style), not squares.
4. **Ultra-rounded cards** — 20px radius on cards/modals, not 8px or 12px.
5. **Uppercase micro-labels** — all form labels are 11px, semibold, uppercase, with wide letter-spacing. This is a signature pattern.
6. **Weight 900 headings** — headings are "black" weight, not bold (700). This creates a distinctive chunky feel.
7. **Lavender surfaces** — background tints are purple-tinged (#f5f3fa), not blue-gray.
8. **No gray palette** — where most apps use gray-100/200/300, this app uses purple-tinged equivalents (surface, surfaceHover, surfaceActive).

### The "Token Test"
If you're unsure whether you've matched the styling, check these 5 things:
1. Are your card borders purple-tinted (#9a8ab5), not gray?
2. Are your buttons pill-shaped (fully rounded)?
3. Are your form labels 11px uppercase semibold?
4. Are your card corners 20px radius?
5. Is your background #fafbfc with #f5f3fa lavender tints (not plain gray)?

If all 5 are yes, you're on track.

---

## 1. DESIGN SYSTEM FOUNDATION

### Tech Stack
- **UI Library**: Mantine v7 (`@mantine/core` ^7.17.0)
- **CSS Framework**: Tailwind CSS (with custom token extensions)
- **Icons**: Lucide React v0.468.0
- **Charts**: Recharts v2.15.0
- **Animation**: Motion (motion/react) v12.38.0
- **Fonts**: Google Fonts — Roboto (body) + Fraunces (display)
- **Primary Color Key**: `tvPurple` (Shade 6)
- **Default Radius**: 8px (sm)

### Google Fonts Import (copy-paste this URL)
```
https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,700;9..144,900&family=Roboto:wght@300;400;500;600;700;900&display=swap
```

### Copy-Pasteable: Tailwind Config Colors
Drop this into your `tailwind.config` under `theme.extend.colors`:
```js
'tv-brand':          '#7c45b0',
'tv-brand-hover':    '#653a92',
'tv-brand-bg':       '#7c45b0',
'tv-brand-tint':     '#f3eeff',
'tv-surface':        '#f5f3fa',
'tv-surface-hover':  '#ede5f7',
'tv-surface-active': '#e4daef',
'tv-surface-muted':  '#fafbfc',
'tv-border-strong':  '#8a7aab',
'tv-border':         '#9a8ab5',
'tv-border-light':   '#9a8ab5',
'tv-border-divider': '#f0eaf8',
'tv-text-primary':   '#242436',
'tv-text-secondary': '#6b6b6b',
'tv-text-label':     '#5d5e65',
'tv-text-brand':     '#7c45b0',
'tv-text-decorative':'#5c4f78',
'tv-success':        '#15803d',
'tv-success-bg':     '#f0fdf4',
'tv-success-border': '#bbf7d0',
'tv-success-hover':  '#166534',
'tv-info':           '#0e7490',
'tv-info-bg':        '#e0f8ff',
'tv-info-border':    '#7dd8f5',
'tv-info-hover':     '#0c5f75',
'tv-warning':        '#b45309',
'tv-warning-bg':     '#fffbeb',
'tv-warning-border': '#fde68a',
'tv-warning-hover':  '#92400e',
'tv-danger':         '#d42323',
'tv-danger-bg':      '#fef2f2',
'tv-danger-border':  '#fecaca',
'tv-danger-hover':   '#b91c1c',
'tv-star':           '#EAB308',
'tv-star-hover':     '#CA8A04',
'tv-star-bg':        '#FEF9C3',
'tv-star-border':    '#FDE047',
'tv-record':         '#007c9e',
'tv-record-hover':   '#005d77',
'tv-record-bg':      '#00c0f5',
'tv-record-tint':    '#d9f2f8',
'tv-record-border':  '#8dd9ed',
```
And under `theme.extend.fontFamily`:
```js
display: ['Fraunces', 'Roboto', 'sans-serif'],
```

### Copy-Pasteable: Complete Global CSS (theme.css — verbatim from source)
Drop this into your global CSS file. **IMPORTANT**: Also add the `.tv-label` class at the bottom — it's used everywhere in the app but was missing from the original CSS.
```css
:root {
  --font-size: 16px;
  --background: #ffffff;
  --foreground: #242436;

  /* ── ThankView Design Tokens ───────────────────────────────────── */
  /* Surfaces */
  --tv-surface:        #f5f3fa;
  --tv-surface-hover:  #ede5f7;
  --tv-surface-active: #e4daef;
  --tv-surface-muted:  #fafbfc;

  /* Borders */
  --tv-border-strong:  #8a7aab; /* 4.0:1 — prominent UI elements */
  --tv-border:         #9a8ab5; /* 3.15:1 — interactive element borders (WCAG 1.4.11 AA) */
  --tv-border-light:   #9a8ab5; /* 3.15:1 — input borders */
  --tv-border-divider: #f0eaf8;

  /* Text — all AA-compliant on #ffffff backgrounds (≥ 4.5:1) */
  --tv-text-primary:   #242436;
  --tv-text-secondary: #6b6b6b;
  --tv-text-label:     #5d5e65;
  --tv-text-brand:     #7c45b0;
  --tv-text-decorative:#5c4f78; /* darkened from #7a6b96 (3.7:1) → 5.3:1 vs white — WCAG AA pass */

  /* Brand palette — AA-safe text & interactive states */
  --tv-brand:          #7c45b0;
  --tv-brand-hover:    #653a92;
  --tv-brand-bg:       #7c45b0;

  /* Semantic status colors — all AA-compliant on #ffffff (≥ 4.5:1) */
  --tv-success:        #15803d;
  --tv-success-hover:  #166534;
  --tv-info:           #0e7490;
  --tv-info-hover:     #0c5f75;
  --tv-warning:        #b45309;
  --tv-warning-hover:  #92400e;
  --tv-danger:         #d42323;
  --tv-danger-hover:   #b91c1c;

  /* Status tint backgrounds */
  --tv-success-bg:     #f0fdf4;
  --tv-success-border: #bbf7d0;
  --tv-info-bg:        #e0f8ff;
  --tv-info-border:    #7dd8f5;
  --tv-warning-bg:     #fffbeb;
  --tv-warning-border: #fde68a;
  --tv-danger-bg:      #fef2f2;
  --tv-danger-border:  #fecaca;
  --tv-brand-tint:     #f3eeff;

  /* Decorative / non-text accent colors */
  --tv-star:           #EAB308;
  --tv-star-hover:     #CA8A04;
  --tv-star-bg:        #FEF9C3;
  --tv-star-border:    #FDE047;

  /* Record (Blue) */
  --tv-record:         #007c9e;
  --tv-record-hover:   #005d77;
  --tv-record-bg:      #00c0f5;
  --tv-record-tint:    #d9f2f8;
  --tv-record-border:  #8dd9ed;

  /* Tooltip */
  --tv-tooltip-bg:     #1e293b;
  --tv-tooltip-text:   #f8fafc;

  --font-weight-medium: 500;
  --font-weight-normal: 400;
}

@layer base {
  body {
    background-color: var(--background);
    color: var(--foreground);
    font-family: 'Roboto', sans-serif;
  }

  html {
    font-size: var(--font-size);
  }

  h1 { font-size: 1.5rem; font-weight: var(--font-weight-medium); line-height: 1.5; }
  h2 { font-size: 1.25rem; font-weight: var(--font-weight-medium); line-height: 1.5; }
  h3 { font-size: 1.125rem; font-weight: var(--font-weight-black); line-height: 1.5; }
  h4 { font-size: 1rem; font-weight: var(--font-weight-medium); line-height: 1.5; }

  label, button, input, select, textarea {
    font-size: 0.875rem;
    line-height: 1.5;
  }

  button { font-weight: var(--font-weight-medium); }
}

/* Utility: Fraunces display font for stat numbers and non-heading display text */
.font-display {
  font-family: 'Fraunces', 'Roboto', sans-serif;
}

/* Hide scrollbar while keeping scroll functionality */
.scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
.scrollbar-none::-webkit-scrollbar { display: none; }

/* AA focus indicator for all interactive elements */
:focus-visible { outline: 2px solid var(--tv-brand) !important; outline-offset: 2px !important; }

/* Ensure inputs with outline-none still show focus-visible indicator */
input:focus-visible, select:focus-visible, textarea:focus-visible {
  outline: 2px solid var(--tv-brand) !important; outline-offset: 2px !important;
}

/* Respect reduced-motion preferences */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   IMPORTANT: .tv-label utility class
   Used everywhere (LABEL_CLS = "tv-label mb-1 block") but needs explicit definition.
   ═══════════════════════════════════════════════════════════════════════════════ */
.tv-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--tv-text-label);
}

/* ═══════════════════════════════════════════════════════════════════════════════
   WCAG AA Color Accessibility Overrides
   Safety net for legacy hex values that may appear in imported/generated code.
   These remap non-AA colors to their AA-safe equivalents.
   ═══════════════════════════════════════════════════════════════════════════════ */

/* Primary Purple: #995cd3 → #7c45b0 */
.text-\[\#995cd3\]  { color: #7c45b0 !important; }
.bg-\[\#995cd3\]    { background-color: #7c45b0 !important; }
.border-\[\#995cd3\] { border-color: #7c45b0 !important; }
.hover\:text-\[\#995cd3\]:hover   { color: #7c45b0 !important; }
.hover\:bg-\[\#995cd3\]:hover     { background-color: #7c45b0 !important; }
.hover\:border-\[\#995cd3\]:hover { border-color: #7c45b0 !important; }
.hover\:bg-\[\#7c45b0\]:hover     { background-color: #653a92 !important; }
.focus\:ring-\[\#995cd3\]\/30:focus { --tw-ring-color: rgb(124 69 176 / 0.3) !important; }
.focus\:border-\[\#995cd3\]:focus   { border-color: #7c45b0 !important; }
.bg-\[\#995cd3\]\/20 { background-color: rgb(124 69 176 / 0.2) !important; }
.bg-\[\#995cd3\]\/15 { background-color: rgb(124 69 176 / 0.15) !important; }
.bg-\[\#995cd3\]\/30 { background-color: rgb(124 69 176 / 0.3) !important; }

/* Green: #16b364 → #15803d */
.text-\[\#16b364\]   { color: #15803d !important; }
.bg-\[\#16b364\]     { background-color: #15803d !important; }
.border-\[\#16b364\] { border-color: #15803d !important; }

/* Cyan: #00C0F5 → #0e7490 */
.text-\[\#00C0F5\]  { color: #0e7490 !important; }
.bg-\[\#00C0F5\]    { background-color: #0e7490 !important; }

/* Amber: #F59E0B → #b45309 */
.text-\[\#F59E0B\]  { color: #b45309 !important; }
.bg-\[\#F59E0B\]    { background-color: #b45309 !important; }

/* Orange: #c97c0a → #92400e */
.text-\[\#c97c0a\]  { color: #92400e !important; }
.border-\[\#c97c0a\] { border-color: #92400e !important; }
.hover\:border-\[\#c97c0a\]:hover { border-color: #92400e !important; }
.hover\:text-\[\#c97c0a\]:hover   { color: #92400e !important; }

/* Red: #ef4444 → #dc2626 */
.text-\[\#ef4444\]  { color: #dc2626 !important; }
.border-\[\#ef4444\] { border-color: #dc2626 !important; }
.bg-\[\#ef4444\]    { background-color: #dc2626 !important; }
.text-red-500       { color: #dc2626 !important; }
.hover\:text-red-500:hover { color: #dc2626 !important; }

/* Muted purple text: #b5a4cd → #7a6b96 (AA 4.82:1) */
.text-\[\#b5a4cd\]  { color: #7a6b96 !important; }
.text-\[\#d0cdd8\]  { color: #7a6b96 !important; }
.text-\[\#d8d0e8\]  { color: #7a6b96 !important; }
.text-\[\#e0daea\]  { color: #7a6b96 !important; }
```

### Copy-Pasteable: Complete Tailwind Config (verbatim from source)
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'tv-brand':          '#7c45b0',
        'tv-brand-hover':    '#653a92',
        'tv-brand-bg':       '#7c45b0',
        'tv-brand-tint':     '#f3eeff',
        'tv-surface':        '#f5f3fa',
        'tv-surface-hover':  '#ede5f7',
        'tv-surface-active': '#e4daef',
        'tv-surface-muted':  '#fafbfc',
        'tv-border-strong':  '#8a7aab',
        'tv-border':         '#9a8ab5',
        'tv-border-light':   '#9a8ab5',
        'tv-border-divider': '#f0eaf8',
        'tv-text-primary':   '#242436',
        'tv-text-secondary': '#6b6b6b',
        'tv-text-label':     '#5d5e65',
        'tv-text-brand':     '#7c45b0',
        'tv-text-decorative':'#5c4f78',
        'tv-success':        '#15803d',
        'tv-success-bg':     '#f0fdf4',
        'tv-success-border': '#bbf7d0',
        'tv-info':           '#0e7490',
        'tv-info-bg':        '#e0f8ff',
        'tv-info-border':    '#7dd8f5',
        'tv-warning':        '#b45309',
        'tv-warning-bg':     '#fffbeb',
        'tv-warning-border': '#fde68a',
        'tv-danger':         '#d42323',
        'tv-danger-bg':      '#fef2f2',
        'tv-danger-border':  '#fecaca',
        'tv-success-hover':  '#166534',
        'tv-info-hover':     '#0c5f75',
        'tv-warning-hover':  '#92400e',
        'tv-danger-hover':   '#b91c1c',
        'tv-star':           '#EAB308',
        'tv-star-hover':     '#CA8A04',
        'tv-star-bg':        '#FEF9C3',
        'tv-star-border':    '#FDE047',
        'tv-record':         '#007c9e',
        'tv-record-hover':   '#005d77',
        'tv-record-bg':      '#00c0f5',
        'tv-record-tint':    '#d9f2f8',
        'tv-record-border':  '#8dd9ed',
      },
      fontFamily: {
        display: ['Fraunces', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

### Copy-Pasteable: Mantine Brand Purple Palette
If using Mantine, use this 10-shade tuple as your primary color:
```ts
const tvPurple: MantineColorsTuple = [
  "#f3eeff", // 0 — bg tint
  "#e8dff8", // 1
  "#d8c8f5", // 2
  "#c5a7ef", // 3
  "#b38ce8", // 4
  "#a172de", // 5
  "#7c45b0", // 6 — BASE (primary brand)
  "#653a92", // 7 — hover
  "#63378d", // 8
  "#4a2a6a", // 9
];
```

---

## 2. TYPOGRAPHY SYSTEM

### Font Families
| Role | Family | Fallback |
|------|--------|----------|
| Body / UI | Roboto | sans-serif |
| Display / Stats | Fraunces | Roboto, sans-serif |

### Font Size Scale
| Token | Size | Usage |
|-------|------|-------|
| xxs | 9px | Merge pill labels, helper text |
| xs | 10px | Micro labels, uppercase section headers, badge text |
| sm | 11px | Small labels, metadata, filter summaries, timestamps |
| base | 12px | Descriptions, secondary text, tooltips |
| md | 13px | Default body text, menu items, button text, input text |
| lg | 14px | Nav items, search input, card titles |
| xl | 16px | Modal titles, section headings |
| 2xl | 18px | Widget titles, h3 |
| 3xl | 20-22px | Page titles (mobile/tablet) |
| 4xl | 24-26px | Page titles (desktop) |
| 5xl | 38px | Hero banner title |

### Font Weights
| Weight | Value | Usage |
|--------|-------|-------|
| Light | 300 | Rarely used |
| Normal | 400 | Body text, inactive items |
| Medium | 500 | Nav items, descriptions, medium emphasis |
| Semibold | 600 | Buttons, labels, active states, section headers |
| Bold | 700 | Card titles, search result names |
| Black | 900 | **All headings** (h1-h4 via Mantine theme), page titles, drawer/modal titles, brand text |

> **Important**: The Mantine theme sets `headings.fontWeight: "900"` globally. All `<Title>` components render at weight 900 regardless of order. This is a distinctive design choice — headings are always "black" weight.

### Label Pattern (Universal)
All form labels follow this exact pattern:
```
font-size: 11px
font-weight: 600
text-transform: uppercase
letter-spacing: 0.05em
color: #5d5e65 (TV.textLabel)
margin-bottom: 6px
```

---

## 3. COLOR TOKENS

### Brand Purple Palette (tvPurple — 10 Mantine shades)
```
Shade 0: #f3eeff  (lightest — background tint)
Shade 1: #e8dff8
Shade 2: #d8c8f5
Shade 3: #c5a7ef
Shade 4: #b38ce8
Shade 5: #a172de
Shade 6: #7c45b0  (BASE — primary brand)
Shade 7: #653a92  (hover state)
Shade 8: #63378d
Shade 9: #4a2a6a  (darkest)
```

### Surface Colors
| Token | Hex | Usage |
|-------|-----|-------|
| surface | #f5f3fa | Card fills, input backgrounds, filter bar bg, toolbar bg |
| surfaceHover | #ede5f7 | Hover state for lavender surfaces |
| surfaceActive | #e4daef | Active/pressed state, active nav item bg |
| surfaceMuted | #fafbfc | Main content area bg, subtle row hover |

### Border Colors
| Token | Hex | Contrast | Usage |
|-------|-----|----------|-------|
| borderStrong | #8a7aab | 4.0:1 | Card outlines, sidebar border, prominent UI |
| border / borderLight | #9a8ab5 | 3.15:1 | Input borders, interactive elements, dividers |
| borderDivider | #f0eaf8 | — | Section dividers within cards, drawer headers |

### Text Colors (All WCAG AA on white)
| Token | Hex | Contrast | Usage |
|-------|-----|----------|-------|
| textPrimary | #242436 | 15.7:1 | Headings, primary content, nav active |
| textSecondary | #6b6b6b | 4.97:1 | Descriptions, body text, inactive icons |
| textLabel | #5d5e65 | 5.55:1 | Form labels, metadata, uppercase headers |
| textBrand | #7c45b0 | 6.29:1 | Brand-colored text, links, active filters |
| textDecorative | #5c4f78 | 5.3:1 | Hints, helper text, timestamps |

### Brand Action Colors
| Token | Hex | Usage |
|-------|-----|-------|
| brand | #7c45b0 | Primary text & icon color |
| brandHover | #653a92 | Hover state |
| brandBg | #7c45b0 | Filled button backgrounds (white text) |
| brandTint | #f3eeff | Active filter bg, selected card bg, chip bg |

### Semantic Status Colors
| Status | Base | Hover | Background | Border |
|--------|------|-------|------------|--------|
| Success | #15803d | #166534 | #f0fdf4 | #bbf7d0 |
| Info | #0e7490 | #0c5f75 | #e0f8ff | #7dd8f5 |
| Warning | #b45309 | #92400e | #fffbeb | #fde68a |
| Danger | #d42323 | #b91c1c | #fef2f2 | #fecaca |

### Special Accent Colors
| Token | Hex | Usage |
|-------|-----|-------|
| star | #EAB308 | Filled favorite stars |
| starHover | #CA8A04 | Star hover |
| starBg | #FEF9C3 | Star tint bg |
| record | #007c9e | Recording buttons (blue) |
| recordBg | #00c0f5 | Record fills |
| recordTint | #d9f2f8 | Record light tint |

### Tooltip Colors
```
Background: #1e293b
Text: #f8fafc
```

---

## 4. SPACING, RADIUS & SHADOWS

### Spacing Scale (Tailwind default, 1 unit = 4px)
| Class | Value | Common Usage |
|-------|-------|-------------|
| 0.5 | 2px | Tight gaps |
| 1 | 4px | Inline icon gaps |
| 1.5 | 6px | Small padding |
| 2 | 8px | Standard inline gap |
| 2.5 | 10px | Input padding |
| 3 | 12px | Card content padding, button horizontal padding |
| 4 | 16px | Section padding, nav item padding |
| 5 | 20px | Drawer body padding |
| 6 | 24px | Large card padding, page section margins |
| 8 | 32px | Hero banner padding |

### Border Radius Scale
| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Toolbar buttons, focus states, small toggles |
| sm | 8px | Default — standard inputs, buttons, drawers |
| md | 10px | Inputs, select, modals, builder elements |
| lg | 12px | Icon containers, cards, filter bar container |
| xl | 20px | Paper/Card radius, modals, drawer content |
| full | 9999px | Pill buttons, badges, avatars, chips |

### Shadow Values
| Token | Value | Usage |
|-------|-------|-------|
| shadowDropdown | 0 8px 30px rgba(0,0,0,0.10) | Dropdowns, popovers |
| shadowTooltip | 0 4px 12px rgba(0,0,0,0.08) | Tooltips |
| shadowModal | 0 25px 50px -12px rgba(0,0,0,0.25) | Modals, notification panel |

### Z-Index Scale
| Value | Usage |
|-------|-------|
| 1-9 | Minor element stacking |
| 40 | Backdrop overlays |
| 50 | Mobile sidebar |
| 60-80 | Modal layers in builders |
| 90-100 | Builder drawers, picker modals |
| 999 | Tag pickers, color pickers |
| 9998-9999 | RTE dropdowns, top-level modals |
| 10000 | Tooltips, share modals (highest) |

---

## 5. LAYOUT ARCHITECTURE

### Overall Structure
```
<Box className="h-screen flex overflow-hidden">
  ├── Sidebar (fixed on mobile / relative on desktop)
  └── <Box className="flex flex-col flex-1 overflow-hidden">
       ├── TopBar (h-60px, z-10, shrink-0)
       └── <main> Main Content (flex-1, overflow-y-auto)
```

### Key Dimensions
| Element | Value |
|---------|-------|
| Sidebar expanded width | 277px |
| Sidebar collapsed width | 64px |
| TopBar height | 60px |
| Main content background | #fafbfc (surfaceMuted) |
| Sidebar transition | 0.25s cubic-bezier(0.4, 0, 0.2, 1) |

---

## 6. SIDEBAR NAVIGATION

### Structure
- **Background**: White (#ffffff)
- **Right border**: 1px solid #8a7aab (borderStrong)
- **Height**: 100vh

### Header (Logo Area)
- Height: 77px
- Padding: 14px horizontal (px-3.5)
- Bottom border: 1px solid borderStrong
- Logo icon: Custom SVG, 36×36px container, 30px icon
- Brand text: "ThankView" — Fraunces font, 20px, weight 900, color textPrimary
- Collapse toggle: ActionIcon 28×28px, color borderStrong

### Navigation Items (Expanded)
- Height: 41px per item
- Padding: 16px horizontal
- Gap between icon and label: 12px (gap-3)
- Icon: 20×20px
- Label: 14px, line-height 21px
- **Active state**: bg surfaceActive (#e4daef), font-weight 600, color textPrimary
- **Inactive state**: transparent bg, font-weight 500
- **Hover (inactive)**: bg surfaceHover
- Border-radius: 4px
- Transition: colors

### Navigation Items (Complete List)
1. Homepage — `/` — Home icon
2. Constituents — `/contacts` — Users icon
3. Lists — `/lists` — List icon
4. Saved Searches — `/saved-searches` — Search icon
5. Campaigns — `/campaigns` — Mail icon
6. ThankView Metrics — `/analytics` — BarChart icon
7. Video Library — `/videos` — Video icon
8. Assets and Templates — Collapsible group — Layers icon
   - All Assets — `/assets`
   - Email & SMS Templates — `/assets/templates`
   - Envelope Designs — `/assets/envelopes`
   - Landing Page Designs — `/assets/landing-pages`
   - Intros & Outros — `/assets/intros-outros`
   - Images — `/assets/images`

### Assets Sub-Navigation
- Font size: 12px, line-height 18px, weight 500
- Inactive opacity: 0.7, color textSecondary
- Active: opacity 1.0, color textBrand
- Visual connector lines: 1px bg-tv-border vertical + horizontal elbow

### Sidebar Footer
- Background: surface (#f5f3fa)
- Top border: 1px solid borderStrong
- "LAST DATA UPDATE" label: 11px, weight 600, uppercase, letterSpacing 0.6px, color brandHover
- Timestamp: 13px, weight 500, color textPrimary
- Status dot: 8×8px green circle (#53a744) + "All Systems Operational" (12px, weight 500)
- Help Center button: full width, pill-shaped, tvPurple color, 44px height, 14px text

### Collapsed State
- Width: 64px
- Icon-only navigation: 36px height items, center-aligned
- Footer: single ActionIcon (36×36px, filled tvPurple, radius-xl)

---

## 7. TOPBAR & GLOBAL SEARCH

### TopBar
- Height: 60px
- Background: white
- Border-bottom: 1px solid borderLight
- Padding: 12px horizontal
- Display: flex, items-center, gap-3

### Global Search
- Max-width: 560px, flex-1
- Container: border 1px solid borderLight, border-radius 12px
- Scope selector (left): px-10, py-8, border-right, text brandText 12px bold, ChevronDown icon
- Input: 14px, transparent bg, no border, placeholder textSecondary
- Keyboard shortcut: "⌘K" badge (10px, borderLight border)
- Clear button (X): shows when input has text

### Search Results Dropdown
- Position: absolute, below search, full width
- Border-radius: 12px
- Border: 1px solid borderLight
- Shadow: shadowDropdown
- Max-height: 520px (ScrollArea)
- Result groups: Contacts, Interactions, Campaigns, Videos, Lists, Saved Searches, Assets
- Each result: flex gap-3, px-md, py-sm, hover bg surfaceMuted
- Name text: 13px bold, color textBrand
- Meta text: 12px, color textSecondary

### Notifications
- Bell icon: 18px, color textLabel, hover textBrand
- Badge: tvPurple, size 16px, offset 3px, font 9px
- Panel: 380px wide, max-height 520px, border-radius 20px, shadow modal
- Notification item: px-md, py-sm, unread bg #faf7ff
- Avatar: 32×32px, rounded-xl, colored initials
- Title: 13px, weight 500 (unread) / 400 (read)
- Timestamp: 11px, color textDecorative
- Mark-read button: opacity-0, visible on hover

### User Menu
- Avatar: 32px, rounded-xl, tvPurple, initials
- Dropdown: 200px wide, Menu with items at 13px
- Items: My Profile, Settings, Switch Organization, Log Out (red)

---

## 8. PAGE-BY-PAGE STRUCTURE

### Dashboard
- **Hero Banner**: bg-tv-brand, rounded-xl, px-4/8, py-5/7, animated background circles
  - Title: Fraunces font, 24px mobile / 38px desktop, weight 900, white
  - Stat pills: bg white/15, backdrop-blur, rounded-full, px-3/4, py-2
- **Key Stats Bar**: 4 stat buttons in horizontal flex (desktop) / 2×2 grid (mobile)
  - Icon container: 44×44px, rounded-lg, colored bg
  - Value: Fraunces 20-22px bold
  - Label: 10px uppercase, textLabel
- **Campaigns Widget**: White card, rounded-xl, border borderLight
  - Campaign rows: thumbnail (110×82px rounded-lg) + content
  - Progress bars: 5px height, rounded-full
- **Quick Actions**: 2×2 grid, bg brandTint, rounded-lg cards with hover shadow + scale
  - Icon container: white bg, rounded-md, 40×40px
- **Performance Chart**: Collapsible BarChart, radius [4,4,0,0], barSize 10
- **Recent Activity**: Tabs (Videos/Activity), avatar + action text rows
- **Most Successful**: 3-column grid, image cards with play overlay + success badge

### Campaigns List
- **Page Header**: Title + Create Campaign dropdown button
- **Create Dropdown**: 300px min width, borderRadius 10, grouped sections
  - Items: icon box (40×40 rounded-md) + label + description
- **Filter Bar**: ChipFilter components (Campaign, Status, Date, Type)
- **Campaign Rows**: Thumbnail (100×68px) + title + status badge + metrics
- **Pagination**: TablePagination at bottom

### Contacts
- **Table**: Mantine Table with SortableHeader columns
  - Row hover: bg surfaceMuted
  - Selected row: bg brandTint
  - Avatar: 32px rounded-xl with contrast-aware text color
  - Star rating: 5-star interactive component
  - Tag badges: rounded-full, colored pills
- **Bulk Action Bar**: Appears on multi-select (Add to list, Send, Export, Merge)
- **Column Customizer**: Two-column modal (Available | Active) with reorder

### Contact Profile
- **Header**: Avatar + name + email + phone + action buttons
- **Tabs**: Overview, Giving History, Campaign History, Landing Page Interactions, Profile, Engagement
- **Profile Edit**: Inline editable fields with save/cancel

### Lists
- **Card Grid**: Cards with name, description, member count, last updated
- **Detail View**: Members table with add/remove, pagination

### Saved Searches
- **Criteria Builder**: Field dropdown → Operator → Value input, add/remove conditions
- **Search Cards**: Criteria chips, match count badge, Active/Paused status

### Video Library
- **Folder Sidebar**: Vertical folder list, active highlight, CRUD actions
- **Grid View**: Cards with 148px thumbnail, duration badge, play overlay, hover actions
- **List View**: Table with sortable columns, checkbox selection
- **Bulk Actions**: Move to Folder, Archive, Delete

### Analytics
- **Page Header**: Title (22-26px) + Export button (outline, pill-shaped)
- **Filter Bar**: bg surface, rounded-12px, border borderLight, contains ChipFilter chips
- **Portal Selector**: Building2 icon + "PORTAL" label + Menu dropdown (280px wide)
  - Items: Globe/Building2 icons + portal name + send count + check mark
- **Tabs**: Mantine Tabs, color tvPurple, font-weight 600, font-size 13px
  - Overview, Performance, PDF, Endowment, 1:1 Video, Visualizations, Tags
- **Metric Cards**: Grouped rows with icon + label + value + sub-text

### Settings
- **Tab Navigation**: Horizontal tabs with icons (User, Building2, Mail, Users, Bell, Video, etc.)
- **Form Sections**: SectionHeader (bg surfaceMuted, icon + title) → form fields
- **Toggle Rows**: Label left, Switch right, full-width
- **User Management**: Table with role badges (color-coded), invite modal with radio cards
- **Role Cards**: border-2, selected = brand border + brandTint bg + checkmark

### Campaign Builder (Multi-Step)
- **Stepper**: 5-phase wizard (Configure → Builder → Constituents → Schedule → Review)
  - Step indicators: numbered circles with labels
  - Active: filled brand color
  - Completed: green check
- **Builder Canvas**: Drag-drop flow with step cards, branching conditions
- **Step Editor Drawer**: Right sidebar with expandable sections
- **Preview Panel**: Floating or integrated, device toggle (desktop/tablet/mobile)

---

## 9. RECURRING UI PATTERNS

### Tables
```
Header: SortableHeader with sort icons (ArrowUpDown), 12px weight 600
Row: border-b borderLight, hover bg surfaceMuted, transition-colors
Selected: bg brandTint
Cell patterns: Avatar+name (gap-2), badges (rounded-full), dates (textSecondary)
Pagination: TablePagination — rows-per-page select + page buttons
  Selected page: filled tvPurple
  Container: px-5 py-3 border-t, flex justify-between
```

### Cards
```
Standard: bg-white rounded-xl border borderLight
  Header: px-4/6 py-4/5 border-b borderDivider
  Content: px-4/6 py-4/5
  Footer: px-4/6 py-3 border-t borderDivider
Clickable: + hover:shadow-md cursor-pointer
Selectable: border-2, selected = border-brand bg-brandTint
Stat: flex items-center gap-3, icon box (40×40 rounded-md colored) + values
```

### Modals (Mantine Modal)
```
radius: xl (20px)
centered: true
overlay: backgroundOpacity 0.4, blur 0
header: border-bottom 1px borderDivider
title: weight 900, 16px, color textPrimary
content: Stack gap="md"
buttons: right-aligned, gap-3
  Cancel: variant="outline" color="red"
  Confirm: color="tvPurple"
```

### Drawers (Right-side)
```
DRAWER_STYLES:
  header: padding 14px 20px 10px, border-bottom 1px borderDivider
  title: 15px, weight 900, color textPrimary
  body: padding 16px 20px 20px
  close: 28×28px, color textSecondary
  content: borderRadius 20px 0 0 20px
```

### Filter Chips (ChipFilter)
```
Container: pill button, rounded-xl, py-6 px-12
Active: border borderStrong, bg brandTint, icon/text textBrand
Inactive: border borderLight, bg white, icon/text textSecondary
Dropdown: 260-320px, search input + scrollable checkbox list
  Selected option: bg brandTint, checkbox tvPurple
Summary: "All" | "Label Name" | "N selected"
```

### Buttons
```
Primary (filled): bg brandBg, text white, weight 600, rounded-full, px-6 py-2.5
  Hover: bg brandHover
Outline: border borderLight, text textPrimary, rounded-full, px-4 py-2
  Hover: bg surface
Danger outline: border danger, text danger, rounded-full
  Hover: bg dangerBg
Subtle: no border, text textBrand or textSecondary
  Hover: bg surface
Disabled: opacity 40%, cursor not-allowed
Icon button (ActionIcon): variant subtle/default/filled, sizes sm/md/lg, radius md/lg/xl
```

### Form Inputs (Campaign Builder)
```
Standard: border borderLight, rounded-8px, px-3 py-2, 13px
  Focus: ring-2 brand/40, border brand
Small: rounded-8px, px-2.5 py-1.5, 12px
Large (hero): rounded-10px, px-3.5 py-2.5, 13px
Select: + appearance-none pr-8 + custom chevron SVG
Textarea: + resize-none
```

### Rich Text Editor
```
Wrapper: border borderLight, rounded-10px
Toolbar: flex gap-0.5, px-2 py-1.5, bg surface, border-b borderLight
  Button: 24×24px rounded-4px, hover bg-white text-brand
  Active: bg brandBg text white
Body: px-3 py-2.5, 13px, rounded-b-9px
```

### Empty States
```
Container: flex-col items-center justify-center py-12 gap-3
Icon: 48px, color textDecorative
Title: 16px bold textPrimary
Message: 13px textSecondary
CTA button: below message
```

### Error/Warning Banners
```
Error: p-4 rounded-lg bg dangerBg border dangerBorder, text danger
Warning: bg warningBg border warningBorder, text warning
Info: bg infoBg border infoBorder, text info
Success: bg successBg border successBorder, text success
```

### Badges & Status Indicators
```
Pill badge: rounded-full, px-2.5 py-0.5, 10-11px, semibold
  Status colors: green (success), yellow (warning), red (danger), gray (neutral)
Live indicator: ping animation + relative dot (8×8px)
Unread dot: 8×8px rounded-full brand color
```

### Hover & Interaction States
```
Background hover: bg surfaceMuted, transition-colors
Border hover: borderStrong
Shadow hover: shadow-md
Scale hover: scale-[1.02], active scale-[0.98]
Reveal on hover: opacity-0 → group-hover:opacity-100
Color hover: text brand
Focus: ring-2 brand/40, outline-none, border brand
```

---

## 10. REUSABLE COMPONENT PATTERNS

These are the component archetypes used throughout the app. Your redesign should implement equivalent components following these exact styling specs.

### Standard Card Shell
Every content section uses this pattern:
```html
<div class="bg-white rounded-xl border" style="border-color: #9a8ab5">
  <!-- Optional header -->
  <div class="px-4 sm:px-6 py-4 border-b" style="border-color: #f0eaf8">
    <span class="text-[11px] uppercase tracking-[0.6px] font-semibold" style="color: #5d5e65">SECTION TITLE</span>
  </div>
  <!-- Content -->
  <div class="px-4 sm:px-6 py-4">...</div>
  <!-- Optional footer -->
  <div class="px-4 sm:px-6 py-3 border-t" style="border-color: #f0eaf8">...</div>
</div>
```

### Filter Chip Button
The pill-shaped filter buttons used in filter bars:
```html
<!-- Inactive state -->
<button class="flex items-center gap-1.5 py-1.5 px-3 rounded-xl transition-all"
  style="border: 1px solid #9a8ab5; background: white">
  <Icon size={13} color="#6b6b6b" />
  <span class="text-[12px] font-semibold" style="color: #242436">Label</span>
  <span class="w-px h-[14px]" style="background: rgba(124,69,176,0.3)"></span>
  <span class="text-[12px]" style="color: #6b6b6b">All</span>
  <ChevronDown size={13} color="#6b6b6b" />
</button>

<!-- Active state: border #8a7aab, bg #f3eeff, text/icon color #7c45b0 -->
```

### Sortable Table Header
```html
<th class="cursor-pointer select-none">
  <div class="flex items-center gap-1">
    <span class="text-[12px] font-semibold">Column Name</span>
    <!-- ArrowUpDown (inactive) or ArrowUp/ArrowDown (sorted) -->
    <Icon size={13} color="#6b6b6b" /> <!-- #7c45b0 when active -->
  </div>
</th>
```

### Table Pagination Footer
```html
<div class="flex items-center justify-between flex-wrap gap-y-2 px-5 py-3 border-t"
  style="border-color: #9a8ab5">
  <!-- Left: rows per page -->
  <div class="flex items-center gap-2">
    <span class="text-[12px]" style="color: #6b6b6b">Rows per page</span>
    <select>...</select>
    <span class="text-[12px]" style="color: #6b6b6b">1-25 of 342</span>
  </div>
  <!-- Right: page buttons -->
  <div class="flex gap-1">
    <button class="px-3 py-1 rounded-full text-[12px]">1</button>
    <!-- Active page: bg #7c45b0 text white -->
  </div>
</div>
```

### Drawer (Right-side Panel)
Standard drawer styling object — apply to all right-side panels:
```typescript
const DRAWER_STYLES = {
  header: {
    padding: "14px 20px 10px 20px",
    borderBottom: "1px solid #f0eaf8",
    marginBottom: 0,
    minHeight: "unset",
  },
  title: {
    fontSize: "15px",
    fontWeight: 900,
    color: "#242436",
    lineHeight: 1.4,
  },
  body: { padding: "16px 20px 20px 20px" },
  close: { color: "#6b6b6b", width: 28, height: 28, minWidth: 28, minHeight: 28 },
  content: { borderRadius: "20px 0 0 20px" },
};
```

### Confirmation Modal
```html
<Modal radius="xl" centered>
  <Stack gap="md">
    <!-- Content here -->
  </Stack>
  <div class="flex items-center justify-end gap-3 mt-5">
    <Button variant="outline" color="red" radius="xl">Cancel</Button>
    <Button color="tvPurple" radius="xl">Confirm</Button>
  </div>
</Modal>
```

### COMPLETE Tailwind Class Constants (for raw HTML inputs/buttons)

Copy-paste these string constants for use anywhere outside Mantine components. Each is a complete, self-contained Tailwind class string.

```typescript
/* ── Inputs ──────────────────────────────────────────────────────────────── */

// Standard full-width input
const INPUT_CLS = "w-full border border-tv-border-light rounded-[8px] px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand";

// Small input (12px text, tighter padding) — for inline naming inputs
const INPUT_CLS_SM = "w-full border border-tv-border-light rounded-[8px] px-2.5 py-1.5 text-[12px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand";

// Large input (10px radius, roomier) — for hero/drawer step-name inputs
const INPUT_CLS_LG = "w-full border border-tv-border-light rounded-[10px] px-3.5 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand";

// Flex-1 width variant (for use inside flex containers instead of w-full)
const INPUT_CLS_FLEX = "flex-1 border border-tv-border-light rounded-[8px] px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand";
const INPUT_CLS_LG_FLEX = "flex-1 border border-tv-border-light rounded-[10px] px-3.5 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand";

// White background variant (for use inside colored panels)
const INPUT_CLS_WHITE = `${INPUT_CLS} bg-white`;

// Textarea (no resize)
const TEXTAREA_CLS = `${INPUT_CLS} resize-none`;

// Select with custom chevron SVG
const SELECT_CLS = `${INPUT_CLS} appearance-none pr-8 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:14px] bg-[right_10px_center] bg-no-repeat cursor-pointer`;

// Tag-chip input wrapper (multi-value pill inputs like Reply-To)
const TAG_INPUT_WRAPPER_CLS = "border border-tv-border-light rounded-[8px] px-2.5 py-1.5 flex flex-wrap gap-1 items-center min-h-[38px] focus-within:ring-2 focus-within:ring-tv-brand/40 focus-within:border-tv-brand";

/* ── Labels ──────────────────────────────────────────────────────────────── */

// Micro uppercase label (the signature ThankView label style)
// NOTE: "tv-label" is a CSS utility class defined as:
//   .tv-label { font-size: 10px; font-weight: 600; text-transform: uppercase;
//               letter-spacing: 0.05em; color: #5d5e65; }
const LABEL_CLS = "tv-label mb-1 block";

// Section heading inside builder panels
const SECTION_HEADING_CLS = "text-[11px] text-tv-text-label uppercase tracking-wider";
// + inline style: { fontWeight: 600 }

// Helper text below inputs
const HELPER_CLS = "text-[9px] text-tv-text-decorative mt-1";

/* ── Buttons ─────────────────────────────────────────────────────────────── */

// Primary action (pill, filled purple)
const BTN_PRIMARY_CLS = "flex items-center gap-1.5 px-6 py-2.5 text-[13px] text-white bg-tv-brand-bg rounded-full hover:bg-tv-brand-hover transition-colors";
// + inline style: { fontWeight: 600 }

// Primary disabled
const BTN_PRIMARY_DISABLED_CLS = "flex items-center gap-1.5 px-6 py-2.5 text-[13px] text-white/60 bg-tv-brand-bg/40 rounded-full cursor-not-allowed";

// Outlined / secondary button
const BTN_OUTLINE_CLS = "flex items-center gap-1.5 px-4 py-2 text-[13px] text-tv-text-primary border border-tv-border-light rounded-full hover:bg-tv-surface transition-colors";

// Danger button
const BTN_DANGER_CLS = "flex items-center gap-1.5 px-4 py-2 text-[13px] text-tv-danger border border-tv-danger rounded-full hover:bg-tv-danger-bg transition-colors";

// Icon trigger button (merge-field picker, emoji picker, etc.)
const ICON_BTN_CLS = "p-2.5 border border-tv-border-light rounded-[8px] text-tv-text-secondary hover:text-tv-brand hover:border-tv-border-strong transition-colors";

/* ── Rich Text Editor ────────────────────────────────────────────────────── */

// RTE wrapper (border + rounded container)
// NOTE: overflow-visible so merge field dropdowns aren't clipped
const RTE_WRAPPER_CLS = "border border-tv-border-light rounded-[10px] overflow-visible";
const RTE_WRAPPER_BASE_CLS = "border rounded-[10px] overflow-visible"; // no border-color (for warning overrides)

// RTE toolbar row
const RTE_TOOLBAR_CLS = "flex items-center gap-0.5 px-2 py-1.5 bg-tv-surface border-b border-tv-border-light flex-wrap";
const RTE_FIRST_BAR_CLS = "rounded-t-[9px]"; // clip bg to parent's top corners

// RTE body (the editable area)
const RTE_BODY_CLS = "w-full px-3 py-2.5 text-[13px] text-tv-text-primary outline-none resize-none rounded-b-[9px]";

// Toolbar icon button (small, 24×24)
const TOOLBAR_BTN_CLS = "w-6 h-6 rounded-[4px] flex items-center justify-center text-tv-text-secondary hover:bg-white hover:text-tv-brand transition-colors";

// Toolbar icon button (larger, 28×28 — for expanded editor)
const TOOLBAR_BTN_LG_CLS = "w-7 h-7 rounded-[5px] flex items-center justify-center transition-colors";
const TOOLBAR_BTN_ACTIVE_CLS = "bg-tv-brand-bg text-white";
const TOOLBAR_BTN_IDLE_CLS = "text-tv-text-secondary hover:bg-white hover:text-tv-brand";

/* ── Inline Tokens & Dropdowns ───────────────────────────────────────────── */

// Merge field pill chip (inline insertable merge tokens)
const MERGE_PILL_CLS = "text-[9px] font-mono text-tv-brand bg-tv-brand-tint border border-tv-border px-1 py-0.5 rounded hover:bg-tv-surface-hover transition-colors";

// Merge dropdown item (inside popover merge-field lists)
const MERGE_DROPDOWN_ITEM_CLS = "w-full text-left px-3 py-2 text-[11px] font-mono text-tv-brand hover:bg-tv-brand-tint transition-colors border-b border-tv-border-divider last:border-b-0";

// Dropdown popover container
const DROPDOWN_CLS = "absolute right-0 top-full mt-1 bg-white rounded-[10px] border border-tv-border-light shadow-xl z-50 overflow-hidden";

/* ── Cards ────────────────────────────────────────────────────────────────── */

// Selectable card — default state
const CARD_BORDER_CLS = "border-tv-border-light bg-white hover:border-tv-border-strong";

// Selectable card — active/selected state
const CARD_BORDER_ACTIVE_CLS = "border-tv-brand bg-tv-brand-tint";

// Emoji item button (inside emoji picker popover)
const EMOJI_ITEM_CLS = "w-7 h-7 text-[15px] hover:bg-tv-surface rounded transition-colors flex items-center justify-center";
```

---

## 11. RESPONSIVE BEHAVIOR

### Breakpoints (Tailwind defaults)
| Breakpoint | Width | Description |
|------------|-------|-------------|
| base | 0 | Mobile first |
| sm | 640px | Small devices |
| md | 768px | Tablets — sidebar becomes relative |
| lg | 1024px | Small laptops |
| xl | 1280px | Desktop |
| 2xl | 1536px | Large desktop |

### Mobile Layout (< 768px)
- Sidebar: Fixed position, slides in from left, z-50
- Backdrop: fixed inset-0 bg-black/40 z-40
- Sidebar hidden by default, toggle via hamburger
- Nav items close sidebar on selection
- Grids: cols-1 or cols-2
- Font sizes: smaller variants
- Padding: px-3 (vs px-6 desktop)

### Desktop Layout (≥ 768px)
- Sidebar: relative position, collapsible
- No backdrop
- Normal flex layout
- Grids: cols-2 to cols-4
- Full font sizes
- Generous padding

### Common Responsive Patterns
```
Padding: px-3 sm:px-6
Grid: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
Font: text-[18px] sm:text-[24px]
Display: hidden sm:flex (desktop only) / sm:hidden (mobile only)
```

---

## 12. ACCESSIBILITY STANDARDS

### WCAG AA Compliance
- All text colors ≥ 4.5:1 contrast on white backgrounds
- Border colors meet 3.15:1 (AA non-text, WCAG 1.4.11)
- Brand-bg buttons (#7c45b0 on white text): 4.87:1

### Focus Indicators
```css
:focus-visible {
  outline: 2px solid #7c45b0;
  outline-offset: 2px;
}
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Patterns
- Skip-to-content link (sr-only, visible on focus)
- Document title updates per route
- Semantic navigation landmarks
- ARIA labels on icon-only buttons
- FocusTrap on modal dialogs
- Keyboard navigation (Escape to close, arrow keys)
- Proper heading hierarchy

---

## 13. MANTINE COMPONENT RESTYLING GUIDE

This section explains how each Mantine component differs from its default styling. Your repo already uses Mantine — these overrides make it match the prototype.

### What Changes from Default Mantine

| Component | Default Mantine | ThankView Override | Why |
|-----------|----------------|-------------------|-----|
| **Button** | `radius: sm` (4px), gray border | `radius: xl` (pill), purple border, fw 600 | Pill-shaped buttons are a signature look |
| **Checkbox** | Square with rounded corners | `radius: xl` (circular) | All checkboxes render as circles |
| **Paper** | `radius: sm`, gray border | `radius: xl` (20px), purple border (#8a7aab) | Ultra-rounded cards with purple tint |
| **TextInput** | Standard label, gray border | Uppercase 11px label, purple border (#9a8ab5) | Signature micro-label pattern |
| **Select** | Same as TextInput | Same overrides as TextInput | Consistent form styling |
| **Modal** | Left-aligned, gray header | Centered, purple divider, fw-900 title | Branded modal style |
| **Drawer** | Standard header | Purple divider, fw-900 title, 20px left radius | Matches modal branding |
| **Badge** | `radius: sm` | `radius: xl` (pill) | Everything is pill-shaped |
| **SegmentedControl** | Gray background, blue active | Lavender bg (#f5f3fa), purple active | Purple brand theming |
| **ActionIcon** | Transparent subtle | Lavender bg (#f5f3fa) subtle | Soft lavender hover areas |
| **Menu** | Gray border, standard shadow | Purple border, elevated shadow | Consistent purple theming |
| **Tooltip** | No border | Purple border (#9a8ab5), 12px text | Branded tooltips |
| **Divider** | Gray | Light lavender (#f0eaf8) | Soft purple-tinted dividers |
| **Title** | Mantine default color | Always #242436 | Consistent heading color |
| **Tabs** | System font | Roboto font-family | Font consistency |
| **Switch** | Default cursor | Pointer cursor on track | Better UX affordance |

### How to Apply: Per-Component `styles` Prop

If you can't use the global theme (e.g., you need to override only in specific places), here's how to apply the same overrides per-component:

```tsx
// Example: Making a single Button match the prototype
<Button
  radius="xl"
  styles={{ root: { fontWeight: 600, borderColor: '#9a8ab5', color: '#7c45b0' } }}
  variant="outline"
>
  Click Me
</Button>

// Example: Making a TextInput match the prototype
<TextInput
  radius="md"
  label="Email Address"
  styles={{
    label: {
      fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
      letterSpacing: '0.05em', color: '#5d5e65', marginBottom: '6px',
    },
    input: { fontSize: '13px', borderColor: '#9a8ab5' },
  }}
/>

// Example: Making a Modal match the prototype
<Modal
  radius="xl"
  centered
  overlayProps={{ backgroundOpacity: 0.4, blur: 0 }}
  styles={{
    header: { borderBottom: '1px solid #f0eaf8' },
    title: { fontWeight: 900, color: '#242436' },
  }}
>
  ...
</Modal>
```

### Important: Color Prop Values
When using Mantine's `color` prop on components like Button, Badge, SegmentedControl, etc., use `"tvPurple"` as the color key (not a hex value). This requires registering the tvPurple palette in your theme's `colors` object. For status colors, use the overridden `"green"`, `"blue"`, `"cyan"` palettes which have been darkened to meet AA contrast.

```tsx
<Button color="tvPurple">Primary Action</Button>
<Badge color="green">Active</Badge>
<SegmentedControl color="tvPurple" data={[...]} />
```

---

## COMPANION FILE: theme.ts (Mantine Theme — 590 lines)

> ⚠️ **CRITICAL**: Upload `theme.ts` alongside this guide. It is the single most important file. Without it, this guide is incomplete.

**File**: `src/app/theme.ts` (590 lines)
**What it exports:**
1. `TV` — Object with ~45 design token constants (all the hex values for colors, borders, shadows). Import anywhere you need inline styles.
2. `thankviewTheme` — Complete `createTheme()` result. Pass to `<MantineProvider theme={thankviewTheme}>`.

**How to use in your project:**
```tsx
// In your app's root:
import { MantineProvider } from "@mantine/core";
import { thankviewTheme, TV } from "./theme";

function App() {
  return (
    <MantineProvider theme={thankviewTheme}>
      {/* Your app here — all Mantine components are now ThankView-styled */}
    </MantineProvider>
  );
}

// In any component:
import { TV } from "./theme";

// Use TV tokens for inline styles on non-Mantine elements:
<div style={{ borderColor: TV.borderLight, color: TV.textSecondary }}>
```

**⚠️ HEADER COMMENT WARNING**: The theme.ts file header comments list slightly different border values (e.g., `#b5a4cd`, `#d4c4e8`) than what the actual `TV` object uses (`#8a7aab`, `#9a8ab5`). **Always trust the TV object values**, not the header comments. The code is correct; the comments are outdated.

**Quick-reference TV token cheatsheet:**
```
BRAND:    TV.brand=#7c45b0  TV.brandHover=#653a92  TV.brandBg=#7c45b0  TV.brandTint=#f3eeff
SURFACE:  TV.surface=#f5f3fa  TV.surfaceHover=#ede5f7  TV.surfaceActive=#e4daef  TV.surfaceMuted=#fafbfc
BORDER:   TV.borderStrong=#8a7aab  TV.border=#9a8ab5  TV.borderLight=#9a8ab5  TV.borderDivider=#f0eaf8
TEXT:     TV.textPrimary=#242436  TV.textSecondary=#6b6b6b  TV.textLabel=#5d5e65  TV.textBrand=#7c45b0  TV.textDecorative=#5c4f78
STATUS:   TV.success=#15803d  TV.danger=#d42323  TV.info=#0e7490  TV.warning=#b45309
SPECIAL:  TV.record=#007c9e  TV.star=#EAB308
SHADOWS:  TV.shadowDropdown  TV.shadowTooltip  TV.shadowModal
```

**Component overrides in the theme (what changes from default Mantine):**
| Component | Override |
|-----------|---------|
| Checkbox | `radius: "xl"` (circular) |
| Paper | `radius: "xl"`, borderColor: `TV.borderStrong` |
| Button | `radius: "xl"`, fw 600, variant-aware border/text colors |
| ActionIcon | subtle variant: `bg TV.surface` |
| All 6 input types | `radius: "md"`, 11px uppercase label, 13px input, purple border |
| Drawer/Modal | `TV.borderDivider` header border, fw-900 title, centered modal |
| SegmentedControl | `radius: "xl"`, lavender bg, tvPurple active |
| Badge | `radius: "xl"`, light variant |
| Menu | purple border, modal shadow, 13px items |
| Tooltip | `radius: "md"`, purple border, 12px text |
| Divider | `TV.borderDivider` |
| Title | `TV.textPrimary` color |
| Switch | pointer cursor on track |

---

## SHARED COMPONENTS (copy-pasteable)

### DashCard — Reusable Section Card Shell
```tsx
import { TV } from "./theme";

export function DashCard({ children, className = "", id }: {
  children: React.ReactNode; className?: string; id?: string;
}) {
  return (
    <div id={id} className={`bg-white rounded-xl border ${className}`}
      style={{ borderColor: TV.borderLight }}>
      {children}
    </div>
  );
}
```

### ChartBox — Responsive Chart Container
```tsx
export function ChartBox({ height, flex, children }: {
  height?: number; flex?: boolean;
  children: (w: number, h: number) => React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.floor(entry.contentRect.width);
      const h = Math.floor(entry.contentRect.height);
      if (w > 0 && h > 0) setSize({ w, h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      width: "100%",
      ...(flex ? { flex: "1 1 0%", minHeight: 120 } : { height: height ?? 250 }),
      minWidth: 0, overflow: "visible", position: "relative",
    }}>
      {size.w > 0 && size.h > 0 ? children(size.w, size.h) : null}
    </div>
  );
}
```

### DRAWER_STYLES — Standard Drawer Styling Object
```tsx
export const DRAWER_STYLES = {
  header: {
    padding: "14px 20px 10px 20px",
    borderBottom: `1px solid ${TV.borderDivider}`,
    marginBottom: 0,
    minHeight: "unset" as const,
  },
  title: { fontSize: 15, fontWeight: 900, color: TV.textPrimary, lineHeight: 1.4 },
  body: { padding: "16px 20px 20px 20px" },
  close: { color: TV.textSecondary, width: 28, height: 28, minWidth: 28, minHeight: 28 },
  content: { borderRadius: "20px 0 0 20px" },
};

// Usage: <Drawer styles={DRAWER_STYLES} ...>
```

---

*Generated from ThankView prototype codebase — March 2026*
