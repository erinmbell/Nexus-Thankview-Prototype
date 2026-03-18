/**
 * ThankView Campaign Builder — Shared CSS class constants.
 *
 * Two approaches coexist (both are valid):
 *
 *   1. **CSS utility classes** defined in `/src/styles/theme.css`:
 *      `.tv-label`, `.tv-input`, `.tv-btn-primary`, `.tv-btn-secondary`
 *      MultiStepBuilder already uses these (e.g. `className="tv-label mb-1 block"`).
 *
 *   2. **JS string constants** exported here (Tailwind utility strings):
 *      `INPUT_CLS`, `LABEL_CLS`, `TEXTAREA_CLS`, etc.
 *      Used by CreateCampaign, CampaignDefaults, DesignStepPanel, LandingPageBuilder.
 *
 * For new code, either approach works. The CSS class approach is shorter in JSX;
 * the JS constant approach composes better with additional Tailwind classes.
 *
 * NOTE: Mantine components (TextInput, Select, etc.) are styled via theme.ts
 * overrides — these constants only apply to raw HTML inputs in builder panels.
 */

/* ── Standard <input> ──────────────────────────────────────────────────────── */
/** Shared base for <input> (excludes width — composed by INPUT_CLS and INPUT_CLS_FLEX) */
const INPUT_BASE =
  "border border-tv-border-light rounded-[8px] px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand";

export const INPUT_CLS = `w-full ${INPUT_BASE}`;

/* ── Standard <input> — smaller variant (12px text, tighter padding) ───── */
/** Used in LandingPageBuilder inline naming inputs */
export const INPUT_CLS_SM =
  "w-full border border-tv-border-light rounded-[8px] px-2.5 py-1.5 text-[12px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand";

/* ── Standard <input> — drawer hero variant (10px radius, roomier padding) */
/** Used for step-name / subject inputs in the MultiStepBuilder drawer */
const INPUT_LG_BASE =
  "border border-tv-border-light rounded-[10px] px-3.5 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand";
export const INPUT_CLS_LG      = `w-full ${INPUT_LG_BASE}`;
export const INPUT_CLS_LG_FLEX = `flex-1 ${INPUT_LG_BASE}`;

/* ── Standard <input> with flex-1 width (use inside flex containers) ─────── */
export const INPUT_CLS_FLEX = `flex-1 ${INPUT_BASE}`;

/* ── Standard <input> on white background (use inside colored panels) ───── */
export const INPUT_CLS_WHITE = `${INPUT_CLS} bg-white`;

/* ── Standard <textarea> ───────────────────────────────────────────────────── */
export const TEXTAREA_CLS = `${INPUT_CLS} resize-none`;

/* ── Standard <select> ─────────────────────────────────────────────────────── */
export const SELECT_CLS = INPUT_CLS;

/* ── <label> — micro uppercase label (10px, semibold, uppercase tracking) ── */
export const LABEL_CLS = "tv-label mb-1 block";

/* ── Pill-shaped primary action button ─────────────────────────────────────── */
export const BTN_PRIMARY_CLS =
  "flex items-center gap-1.5 px-6 py-2.5 text-[13px] text-white bg-tv-brand-bg rounded-full hover:bg-tv-brand-hover transition-colors";
export const BTN_PRIMARY_STYLE = { fontWeight: 600 } as const;

/* ── Pill-shaped outlined/secondary button ─────────────────────────────────── */
export const BTN_OUTLINE_CLS =
  "flex items-center gap-1.5 px-4 py-2 text-[13px] text-tv-text-primary border border-tv-border-light rounded-full hover:bg-tv-surface transition-colors";

/* ── Pill-shaped danger button ─────────────────────────────────────────────── */
export const BTN_DANGER_CLS =
  "flex items-center gap-1.5 px-4 py-2 text-[13px] text-tv-danger border border-tv-danger rounded-full hover:bg-tv-danger-bg transition-colors";

/* ── Disabled primary button (cursor-not-allowed) ─────────────────────────── */
export const BTN_PRIMARY_DISABLED_CLS =
  "flex items-center gap-1.5 px-6 py-2.5 text-[13px] text-white/60 bg-tv-brand-bg/40 rounded-full cursor-not-allowed";
export const BTN_PRIMARY_DISABLED_STYLE = { fontWeight: 600 } as const;

/* ── Small helper text (decorative) ────────────────────────────────────────── */
export const HELPER_CLS = "text-[9px] text-tv-text-decorative mt-1";

/* ── Section heading inside builder panels ─────────────────────────────────── */
export const SECTION_HEADING_CLS =
  "text-[11px] text-tv-text-label uppercase tracking-wider";
export const SECTION_HEADING_STYLE = { fontWeight: 600 } as const;

/* ── Toolbar icon button (used inside rich-text / formatting toolbars) ────── */
export const TOOLBAR_BTN_CLS =
  "w-6 h-6 rounded-[4px] flex items-center justify-center text-tv-text-secondary hover:bg-white hover:text-tv-brand transition-colors";

/* ── Toolbar icon button — larger variant (expanded email body editor) ────── */
export const TOOLBAR_BTN_LG_CLS =
  "w-7 h-7 rounded-[5px] flex items-center justify-center transition-colors";

/* ── Toolbar button state modifiers (pair with TOOLBAR_BTN_LG_CLS) ───────── */
export const TOOLBAR_BTN_ACTIVE_CLS = "bg-tv-brand-bg text-white";
export const TOOLBAR_BTN_IDLE_CLS = "text-tv-text-secondary hover:bg-white hover:text-tv-brand";

/* ── Merge field pill chip (inline insertable merge tokens) ───────────────── */
export const MERGE_PILL_CLS =
  "text-[9px] font-mono text-tv-brand bg-tv-brand-tint border border-tv-border px-1 py-0.5 rounded hover:bg-tv-surface-hover transition-colors";

/* ── Merge dropdown item (inside popover merge-field lists) ───────────────── */
export const MERGE_DROPDOWN_ITEM_CLS =
  "w-full text-left px-3 py-2 text-[11px] font-mono text-tv-brand hover:bg-tv-brand-tint transition-colors border-b border-tv-border-divider last:border-b-0";

/* ── Dropdown popover container ────────────────────────────────────────────── */
export const DROPDOWN_CLS =
  "absolute right-0 top-full mt-1 bg-white rounded-[10px] border border-tv-border-light shadow-xl z-50 overflow-hidden";

/* ── Rich-text editor wrapper (border + rounded container with toolbar) ──── */
/** NOTE: overflow-visible so dropdowns (merge fields, templates, color pickers)
 *  are never clipped. Child bars get rounded-t, editor body gets rounded-b. */
export const RTE_WRAPPER_CLS =
  "border border-tv-border-light rounded-[10px] overflow-visible";
/** RTE wrapper base — border width + shape but NO border color (for warning overrides) */
export const RTE_WRAPPER_BASE_CLS =
  "border rounded-[10px] overflow-visible";

/* ── Rich-text editor toolbar row ──────────────────────────────────────────── */
export const RTE_TOOLBAR_CLS =
  "flex items-center gap-0.5 px-2 py-1.5 bg-tv-surface border-b border-tv-border-light flex-wrap";

/** Apply to the FIRST bar inside an RTE wrapper to clip its bg to the parent's top corners */
export const RTE_FIRST_BAR_CLS = "rounded-t-[9px]";

/* ── Rich-text editor textarea body ────────────────────────────────────────── */
export const RTE_BODY_CLS =
  "w-full px-3 py-2.5 text-[13px] text-tv-text-primary outline-none resize-none rounded-b-[9px]";

/* ── Card border — default (selectable cards, option tiles) ────────────────── */
export const CARD_BORDER_CLS =
  "border-tv-border-light bg-white hover:border-tv-border-strong";

/* ── Card border — selected / active state ────────────────────────────────── */
export const CARD_BORDER_ACTIVE_CLS =
  "border-tv-brand bg-tv-brand-tint";

/* ── Emoji item button (inside emoji picker popover) ──────────────────────── */
export const EMOJI_ITEM_CLS =
  "w-7 h-7 text-[15px] hover:bg-tv-surface rounded transition-colors flex items-center justify-center";

/* ── Icon trigger button (merge-field picker, emoji picker, etc.) ──────── */
export const ICON_BTN_CLS =
  "p-2.5 border border-tv-border-light rounded-[8px] text-tv-text-secondary hover:text-tv-brand hover:border-tv-border-strong transition-colors";

/* ── Tag-chip input wrapper (Reply-To, Test Group — multi-value pills) ── */
export const TAG_INPUT_WRAPPER_CLS =
  "border border-tv-border-light rounded-[8px] px-2.5 py-1.5 flex flex-wrap gap-1 items-center min-h-[38px] focus-within:ring-2 focus-within:ring-tv-brand/40 focus-within:border-tv-brand";
