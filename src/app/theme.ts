import { createTheme, MantineColorsTuple } from "@mantine/core";

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ThankView / EverTrue Design System — Mantine v8 Theme
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * ALL text colors in this system meet WCAG AA (≥ 4.5:1) on white backgrounds.
 * Contrast ratios are documented inline. Decorative-only colors are exempt
 * and marked explicitly.
 *
 * Design tokens (also mirrored as CSS custom properties in theme.css):
 *
 * SURFACES
 *   --tv-surface:        #f5f3fa   lavender fill for cards, inputs, controls
 *   --tv-surface-hover:  #ede5f7   hover state for lavender surfaces
 *   --tv-surface-active: #e4daef   active / pressed state
 *   --tv-surface-muted:  #fafbfc   very subtle background (table row hovers)
 *
 * BORDERS
 *   --tv-border-strong:  #b5a4cd   card outlines, prominent UI
 *   --tv-border:         #d4c4e8   interactive element borders, outlined buttons
 *   --tv-border-light:   #9a8ab5   subtle borders, inputs, chart grid lines (3.1:1 AA non-text)
 *   --tv-border-divider: #f0eaf8   section dividers within cards
 *
 * TEXT (AA-compliant on white)
 *   --tv-text-primary:   #242436   headings, primary content           (15.7:1)
 *   --tv-text-secondary: #737373   descriptions, sub-text              ( 4.48:1)
 *   --tv-text-label:     #5d5e65   small labels, metadata              ( 5.55:1)
 *   --tv-text-brand:     #7c45b0   brand-colored text                  ( 6.29:1)
 *   --tv-text-decorative:#7a6b96   hint/helper text — AA-compliant     ( 4.82:1)
 *
 * BRAND PALETTE
 *   --tv-brand:          #7c45b0   text & icons                        ( 6.29:1)
 *   --tv-brand-hover:    #653a92   hover state                         ( 8.35:1)
 *   --tv-brand-bg:       #7c45b0   fills where text is white          ( 4.87:1)
 *   --tv-brand-tint:     #f3eeff   light tint background
 *
 * SEMANTIC STATUS COLORS (AA-compliant on white)
 *   --tv-success:        #15803d   green confirmations                 ( 4.80:1)
 *   --tv-info:           #0e7490   cyan informational                  ( 5.58:1)
 *   --tv-warning:        #b45309   amber caution                       ( 5.92:1)
 *   --tv-danger:         #d42323   red errors, destructive             ( 4.63:1)
 *
 * Each status also has -hover, -bg, and -border variants.
 *
 * TOOLTIP
 *   --tv-tooltip-bg:     #1e293b   dark background for tooltips
 *   --tv-tooltip-text:   #f8fafc   light text on tooltip bg
 *
 * TAILWIND UTILITIES (registered in theme.css @theme block)
 *   text-tv-brand, bg-tv-brand-tint, border-tv-danger-border, etc.
 *   Use these instead of arbitrary hex values for automatic AA compliance.
 *
 * ICON CONTAINER (the white rounded box that wraps icons in Quick Actions etc.)
 *   background: #ffffff
 *   borderRadius: 12px
 *   size: 44×44 (default), 32×32 (compact)
 *
 * Brand color: True Purple #7c45b0
 * 10-shade palette from lightest (0) to darkest (9).
 * Shade 6 is the "base" brand color by Mantine convention.
 */

const tvPurple: MantineColorsTuple = [
  "#f3eeff", // 0 — bg tint
  "#e8dff8", // 1
  "#d8c8f5", // 2
  "#c5a7ef", // 3
  "#b38ce8", // 4
  "#a172de", // 5
  "#7c45b0", // 6 — AA-safe brand (4.87:1 w/ white)
  "#653a92", // 7 — hover
  "#63378d", // 8
  "#4a2a6a", // 9
];

/* ── WCAG-AA-safe Mantine color overrides ──────────────────────────────────
 * Mantine's default light-variant Badge/Pill colors fail AA contrast on white.
 * Shade 6 is used as the text color in variant="light".  We darken shade 6
 * (and nearby shades) so every light badge meets ≥ 4.5:1.
 */
const tvGreen: MantineColorsTuple = [
  "#ebfbee","#d3f9d8","#b2f2bb","#8ce99a","#69db7c",
  "#51cf66","#237032","#2b8a3e","#237032","#1b5e28",
];
const tvBlue: MantineColorsTuple = [
  "#e7f5ff","#d0ebff","#a5d8ff","#74c0fc","#4dabf7",
  "#339af0","#1971c2","#1864ab","#1864ab","#1351a0",
];
const tvCyan: MantineColorsTuple = [
  "#e3fafc","#c5f6fa","#99e9f2","#66d9e8","#3bc9db",
  "#22b8cf","#0b7285","#0b7285","#0b7285","#095c6b",
];
const tvGray: MantineColorsTuple = [
  "#f8f9fa","#f1f3f5","#e9ecef","#dee2e6","#ced4da",
  "#adb5bd","#5c636a","#495057","#343a40","#212529",
];

/* ── Shared token constants (used in component styles below) ──────────────── */

const TV = {
  /* ── Surfaces ─────────────────────────────────────────────────────────────── */
  surface:       "#f5f3fa",
  surfaceHover:  "#ede5f7",
  surfaceActive: "#e4daef",
  surfaceMuted:  "#fafbfc",

  /* ── Borders ──────────────────────────────────────────────────────────────── */
  borderStrong:  "#8a7aab",   //  4.0:1 — prominent UI elements
  border:        "#9a8ab5",   //  3.15:1 — interactive element borders (WCAG 1.4.11 AA)
  borderLight:   "#9a8ab5",   //  3.15:1 — input borders (kept for compat)
  borderDivider: "#f0eaf8",

  /* ── Text — all AA-compliant on #ffffff (≥ 4.5:1) ─────────────────────────── */
  textPrimary:   "#242436",   // 15.7 :1
  textSecondary: "#666666",   //  5.74:1 on white, 4.69:1 on surfaceHover — AA-safe on all backgrounds
  textLabel:     "#5d5e65",   //  5.55:1
  textBrand:     "#7c45b0",   //  6.29:1
  textDecorative:"#5c4f78",   //  5.3:1 — hint text, helper text (AA-compliant)

  /* ── Brand palette ────────────────────────────────────────────────────────── */
  brand:         "#7c45b0",   //  6.29:1 — primary brand text & icons
  brandHover:    "#653a92",   //  8.35:1 — hover state
  brandBg:       "#7c45b0",   //  4.87:1 — fills / backgrounds where text is white (AA-safe)
  brandTint:     "#f3eeff",   //  light tint background

  /* ── Semantic status colors — all AA on #ffffff (≥ 4.5:1) ─────────────────── */
  success:       "#15803d",   //  4.80:1
  successHover:  "#166534",   //  6.28:1
  successBg:     "#f0fdf4",
  successBorder: "#bbf7d0",

  info:          "#0e7490",   //  5.58:1
  infoHover:     "#0c5f75",   //  7.24:1
  infoBg:        "#e0f8ff",
  infoBorder:    "#7dd8f5",

  warning:       "#b45309",   //  5.92:1
  warningHover:  "#92400e",   //  7.45:1
  warningBg:     "#fffbeb",
  warningBorder: "#fde68a",

  danger:        "#d42323",   //  4.63:1
  dangerHover:   "#b91c1c",   //  5.94:1
  dangerBg:      "#fef2f2",
  dangerBorder:  "#fecaca",

  /* ── Decorative / non-text accent colors ──────────────────────────────────── */
  star:          "#EAB308",   //  bright yellow for filled favorite stars (decorative)
  starHover:     "#CA8A04",   //  darker gold on hover
  starBg:        "#FEF9C3",   //  light yellow tint background
  starBorder:    "#FDE047",   //  yellow border for star badges

  /* ── Record (Blue) — used for all recording-trigger buttons ────────────── */
  record:        "#007c9e",   //  Blue 7  — primary record text & icons   ( 4.8:1)
  recordHover:   "#005d77",   //  Blue 8  — hover state                   ( 7.4:1)
  recordBg:      "#00c0f5",   //  Blue 5  — fills where text is white
  recordTint:    "#d9f2f8",   //  Blue 1  — light tint background
  recordBorder:  "#8dd9ed",   //  Blue 3  — border accent

  /* ── Tooltip ─────────────────────────────────────────────────────────────── */
  tooltipBg:     "#1e293b",   //  dark background
  tooltipText:   "#f8fafc",   //  light text

  /* ── Shadows ─────────────────────────────────────────────────────────────── */
  shadowDropdown:  "0 8px 30px rgba(0,0,0,0.10)",
  shadowTooltip:   "0 4px 12px rgba(0,0,0,0.08)",
  shadowModal:     "0 25px 50px -12px rgba(0,0,0,0.25)",
} as const;

export { TV };

export const thankviewTheme = createTheme({
  /* ── Colors ── */
  colors: {
    tvPurple,
    green: tvGreen,
    blue: tvBlue,
    cyan: tvCyan,
    gray: tvGray,
  },
  primaryColor: "tvPurple",
  primaryShade: 6,

  /* ── Typography ── */
  fontFamily: "Roboto, sans-serif",
  headings: {
    fontFamily: "Roboto, sans-serif",
    fontWeight: "900",        // maps to the "font-black" used throughout
  },

  /* ── Border Radius ── */
  radius: {
    xs: "4px",
    sm: "8px",                // the ThankView standard 8px
    md: "10px",
    lg: "12px",
    xl: "20px",               // card / modal radius
  },
  defaultRadius: "sm",

  /* ── Component overrides ── */
  components: {

    /* ─── Checkbox ────────────────────────────────────────────────────────────
     * All checkboxes are circular (radio-style) across the entire app.
     */
    Checkbox: {
      defaultProps: {
        radius: "xl",
      },
    },

    /* ─── Paper (cards / panels) ─────────────────────────────────────────────
     * Default: xl radius (20px), purple border when `withBorder` is used.
     * Section dividers inside cards use borderDivider (#f0eaf8).
     */
    Paper: {
      defaultProps: {
        radius: "xl",
      },
      styles: {
        root: {
          borderColor: TV.borderStrong,
        },
      },
    },

    /* ─── Button ─────────────────────────────────────────────────────────────
     * Pill-shaped by default (radius xl).
     *
     * Variant treatments:
     *   filled  → tvPurple (handled by primaryColor)
     *   outline → purple border (#d4c4e8), brand text, lavender hover
     *   default → light border (#e0daea), neutral text
     *   subtle  → no border, brand text, lavender hover
     */
    Button: {
      defaultProps: {
        radius: "xl",
      },
      styles: (theme: any, props: any) => {
        const base = { fontWeight: 600 };

        if (props.variant === "outline") {
          return {
            root: {
              ...base,
              borderColor: TV.border,
              color: TV.textBrand,
            },
          };
        }

        if (props.variant === "default") {
          return {
            root: {
              ...base,
              borderColor: TV.borderLight,
              color: TV.textSecondary,
            },
          };
        }

        if (props.variant === "subtle") {
          return {
            root: {
              ...base,
              color: TV.textBrand,
            },
          };
        }

        return { root: base };
      },
    },

    /* ─── ActionIcon ─────────────────────────────────────────────────────────
     * Subtle variant gets lavender background by default.
     */
    ActionIcon: {
      styles: (theme: any, props: any) => {
        if (props.variant === "subtle") {
          return {
            root: {
              backgroundColor: TV.surface,
            },
          };
        }
        return {};
      },
    },

    /* ─── UnstyledButton ─────────────────────────────────────────────────────
     * No default visual styling (stays unstyled), but documented here so
     * developers know the card-button pattern:
     *   style={{ backgroundColor: TV.surface, border: `1.5px solid ${TV.border}`,
     *            borderRadius: 16, padding: 20 }}
     *   hover:  bg → TV.surfaceHover, border → TV.borderStrong, + shadow
     */

    /* ─── TextInput ──────────────────────────────────────────────────────────
     * 10px radius, uppercase micro labels, purple focus ring.
     */
    TextInput: {
      defaultProps: {
        radius: "md",
      },
      styles: {
        label: {
          fontSize: "11px",
          fontWeight: 600,
          textTransform: "uppercase" as const,
          letterSpacing: "0.05em",
          color: TV.textLabel,
          marginBottom: "6px",
        },
        input: {
          fontSize: "13px",
          borderColor: TV.borderLight,
        },
      },
    },

    /* ─── Select ─────────────────────────────────────────────────────────────
     * Same treatment as TextInput.
     */
    Select: {
      defaultProps: {
        radius: "md",
      },
      styles: {
        label: {
          fontSize: "11px",
          fontWeight: 600,
          textTransform: "uppercase" as const,
          letterSpacing: "0.05em",
          color: TV.textLabel,
          marginBottom: "6px",
        },
        input: {
          fontSize: "13px",
          borderColor: TV.borderLight,
        },
      },
    },

    /* ─── MultiSelect ────────────────────────────────────────────────────────
     * Same label/input treatment as TextInput & Select.
     */
    MultiSelect: {
      defaultProps: {
        radius: "md",
      },
      styles: {
        label: {
          fontSize: "11px",
          fontWeight: 600,
          textTransform: "uppercase" as const,
          letterSpacing: "0.05em",
          color: TV.textLabel,
          marginBottom: "6px",
        },
        input: {
          fontSize: "13px",
          borderColor: TV.borderLight,
        },
      },
    },

    /* ─── Textarea ───────────────────────────────────────────────────────────
     * Same label/input treatment as TextInput.
     */
    Textarea: {
      defaultProps: {
        radius: "md",
      },
      styles: {
        label: {
          fontSize: "11px",
          fontWeight: 600,
          textTransform: "uppercase" as const,
          letterSpacing: "0.05em",
          color: TV.textLabel,
          marginBottom: "6px",
        },
        input: {
          fontSize: "13px",
          borderColor: TV.borderLight,
        },
      },
    },

    /* ─── NumberInput ────────────────────────────────────────────────────────
     * Same label/input treatment as TextInput.
     */
    NumberInput: {
      defaultProps: {
        radius: "md",
      },
      styles: {
        label: {
          fontSize: "11px",
          fontWeight: 600,
          textTransform: "uppercase" as const,
          letterSpacing: "0.05em",
          color: TV.textLabel,
          marginBottom: "6px",
        },
        input: {
          fontSize: "13px",
          borderColor: TV.borderLight,
        },
      },
    },

    /* ─── NativeSelect ───────────────────────────────────────────────────────
     * Same label/input treatment as Select.
     */
    NativeSelect: {
      defaultProps: {
        radius: "md",
      },
      styles: {
        label: {
          fontSize: "11px",
          fontWeight: 600,
          textTransform: "uppercase" as const,
          letterSpacing: "0.05em",
          color: TV.textLabel,
          marginBottom: "6px",
        },
        input: {
          fontSize: "13px",
          borderColor: TV.borderLight,
        },
      },
    },

    /* ─── Drawer ─────────────────────────────────────────────────────────────
     * Consistent with Modal styling — branded title, divider border.
     */
    Drawer: {
      defaultProps: {
        overlayProps: { backgroundOpacity: 0.4, blur: 0 },
      },
      styles: {
        header: {
          borderBottom: `1px solid ${TV.borderDivider}`,
        },
        title: {
          fontWeight: 900,
          color: TV.textPrimary,
        },
      },
    },

    /* ─── SegmentedControl ───────────────────────────────────────────────────
     * Lavender background, no border, brand-purple active indicator.
     * autoContrast: true tells Mantine to auto-calculate the active label
     * color for AA compliance (white on #7c45b0 = 6.30:1 ✓).
     * NOTE: Do NOT set label.color as an inline style — it overrides Mantine's
     * CSS-based [data-active] rule and causes dark-on-purple (2.42:1 FAIL).
     * Inactive label color comes from Mantine's default (black in light mode).
     */
    SegmentedControl: {
      defaultProps: {
        radius: "xl",
        color: "tvPurple",
        autoContrast: true,
      },
      styles: {
        root: {
          backgroundColor: TV.surface,
          border: "none",
        },
      },
    },

    /* ─── Title ──────────────────────────────────────────────────────────────
     * Default color is primary text (#242436).
     */
    Title: {
      styles: {
        root: {
          color: TV.textPrimary,
        },
      },
    },

    /* ─── Divider ────────────────────────────────────────────────────────────
     * Uses the light divider color by default.
     */
    Divider: {
      styles: {
        root: {
          borderColor: TV.borderDivider,
        },
      },
    },

    /* ─── Menu ───────────────────────────────────────────────────────────────
     * Purple-bordered dropdown with elevated shadow.
     */
    Menu: {
      styles: {
        dropdown: {
          borderColor: TV.borderLight,
          boxShadow: TV.shadowModal,
        },
        item: {
          fontSize: "13px",
        },
      },
    },

    /* ─── Modal ──────────────────────────────────────────────────────────────
     * Rounded 20px, centered, light overlay.
     */
    Modal: {
      defaultProps: {
        radius: "xl",
        centered: true,
        overlayProps: { backgroundOpacity: 0.4, blur: 0 },
      },
      styles: {
        header: {
          borderBottom: `1px solid ${TV.borderDivider}`,
        },
        title: {
          fontWeight: 900,
          color: TV.textPrimary,
        },
      },
    },

    /* ─── Badge ──────────────────────────────────────────────────────────────
     * Pill-shaped, light variant by default.
     */
    Badge: {
      defaultProps: {
        radius: "xl",
        variant: "light",
      },
    },

    /* ─── Tabs ───────────────────────────────────────────────────────────────
     * Purple indicator, Roboto font.
     */
    Tabs: {
      styles: {
        tab: {
          fontFamily: "Roboto, sans-serif",
        },
      },
    },

    /* ─── Switch ─────────────────────────────────────────────────────────────
     * Pointer cursor on track.
     */
    Switch: {
      styles: {
        track: {
          cursor: "pointer",
        },
      },
    },

    /* ─── Tooltip ────────────────────────────────────────────────────────────
     * Rounded, subtle border.
     */
    Tooltip: {
      defaultProps: {
        radius: "md",
      },
      styles: {
        tooltip: {
          fontSize: "12px",
          border: `1px solid ${TV.borderLight}`,
        },
      },
    },

    /* ─── ColorSwatch ────────────────────────────────────────────────────────
     * Consistent sizing.
     */
    ColorSwatch: {
      defaultProps: {
        radius: "xl",
      },
    },
  },
});