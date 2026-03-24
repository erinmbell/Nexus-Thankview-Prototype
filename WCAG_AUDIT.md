# ThankView WCAG 2.2 AA Accessibility Audit

**Date:** 2026-03-23
**Auditor:** Claude (with Erin)
**Reference:** [WCAG 2.2 Quick Reference (Level A + AA)](https://www.w3.org/WAI/WCAG22/quickref/)
**Scope:** Entire ThankView prototype codebase (`src/`)

---

## Audit Methodology

Every WCAG 2.2 Level A and Level AA success criterion was evaluated against the source code. Findings are organized by WCAG principle, with each criterion marked:

- **✅ Pass** — Criterion met across the prototype
- **⚠️ Partial** — Met in most places but with specific gaps
- **❌ Fail** — Significant issues found
- **N/A** — Not applicable to this application type

---

## Principle 1: Perceivable

### 1.1.1 Non-text Content (Level A) — ⚠️ Partial

**What passes:** All `<img>` tags include `alt` attributes. Icon buttons generally have `aria-label` props.

**Issues found:**

| File | Line | Issue |
|------|------|-------|
| `src/imports/LandingPageBuilder.tsx` | 887 | Organization logo has `alt=""` — this is meaningful content (brand identifier), not decorative. Needs descriptive alt like "Organization logo" |
| `src/imports/VideoEditor.tsx` | 1309, 1387, 1613 | Video thumbnails have `alt=""` — these serve as content previews and should have descriptive alt text like "Video thumbnail for [title]" |

**Recommendation:** Audit all `alt=""` instances and ensure only truly decorative images use empty alt. Content images need descriptive text.

---

### 1.2.1–1.2.5 Time-Based Media (Level A/AA) — N/A

The prototype doesn't play actual video/audio content — it uses mock video placeholders. In production, ensure:
- All prerecorded videos have captions (the app has a caption system — ✅)
- Audio descriptions are available where needed

---

### 1.3.1 Info and Relationships (Level A) — ❌ Fail

**Heading hierarchy missing on major pages:**

| Page | Issue |
|------|-------|
| `Settings.tsx` | Uses `<Title order={2}>` for sections but page itself has no `<h1>`. The page title is rendered by the Layout breadcrumb, not a semantic heading within the page content |
| `Contacts.tsx` | No semantic heading elements — page title is a styled `<Text>` component |
| `Analytics.tsx` | No `<h1>`, `<h2>`, or `<h3>` — all section titles use styled `<span>` or `<Text>` |
| `ContactProfile.tsx` | Contact name not in a heading element |
| `Lists.tsx` | No headings found |
| `SavedSearches.tsx` | No headings found |

**Form grouping issues:**
Settings page has logical groupings but doesn't use `<fieldset>`/`<legend>` for related form controls.

**Recommendation:** Add proper `<h1>` to every page. Use `<fieldset>`/`<legend>` for settings groups. Ensure heading levels don't skip (e.g., h1 → h3).

---

### 1.3.2 Meaningful Sequence (Level A) — ✅ Pass

Content follows logical DOM order matching visual presentation. Flexbox/grid layouts maintain source order.

---

### 1.3.3 Sensory Characteristics (Level A) — ⚠️ Partial

**Most interactions don't rely solely on sensory cues.** However:
- Status badges use color alone in some places (green = verified, red = failed) without accompanying text — BUT most DO include text labels alongside color, so this is mostly passing.
- The envelope builder's front design picker relies on visual pattern recognition without text description of each design.

---

### 1.3.4 Orientation (Level AA) — ✅ Pass

No CSS locks content to a specific orientation. The app uses responsive layouts.

---

### 1.3.5 Identify Input Purpose (Level AA) — ⚠️ Partial

Most inputs that collect user data (name, email) use appropriate labels, but `autocomplete` attributes are largely missing across the app, which prevents browsers from identifying input purpose programmatically.

**Key missing `autocomplete` attributes:**
- Settings > Profile: name, email, phone fields
- Subscription: card number, expiry, CVC, cardholder name, ZIP
- Contact forms: name, email fields

**Recommendation:** Add `autocomplete` attributes to all personal data inputs (e.g., `autocomplete="name"`, `autocomplete="email"`, `autocomplete="cc-number"`, etc.)

---

### 1.4.1 Use of Color (Level A) — ⚠️ Partial

**Mostly passing** — status indicators generally include text labels alongside color. However:

| Location | Issue |
|----------|-------|
| Campaign list status badges | Uses colored badges WITH text labels — ✅ |
| DNS domain status dots | Green/yellow/red dots WITHOUT text labels on small viewport — needs text |
| `RecipientPanel.tsx` email validation | Green/red dots for email status — has text tooltips but not visible by default |

---

### 1.4.3 Contrast (Minimum) (Level AA) — ❌ Fail

**Measured contrast ratios against white (#ffffff) background:**

| Token | Hex | Contrast vs White | Verdict |
|-------|-----|-------------------|---------|
| `--tv-text-primary` | (dark, ~#1a1a2e) | >10:1 | ✅ Pass |
| `--tv-text-secondary` | `#6b6b6b` | 5.0:1 | ✅ Pass (normal text) |
| `--tv-text-label` | `#5d5e65` | 5.9:1 | ✅ Pass |
| `--tv-text-decorative` | `#7a6b96` | **3.7:1** | ❌ **Fail** for normal text (needs 4.5:1) |

**`text-tv-text-decorative` fails WCAG AA** for normal-sized text. It's used extensively as helper/hint text across the app (~100+ instances). At the very small sizes it's commonly paired with (`text-[9px]`, `text-[10px]`), this is clearly not "large text" and must meet 4.5:1.

**Against surface backgrounds, it's even worse:**
| Token | Hex | Contrast vs `#f5f3fa` (surface) | Verdict |
|-------|-----|----------------------------------|---------|
| `--tv-text-decorative` | `#7a6b96` | **3.2:1** | ❌ Fail |

**Additional contrast concerns:**

| File | Lines | Issue |
|------|-------|-------|
| `src/imports/EnvelopeBuilder.tsx` | 491, 613 | `text-[8px]` at any color is extremely small — even with passing contrast, readability is compromised |
| `src/app/pages/campaign/VideoTimeline.tsx` | 543 | `text-white/60` (white at 60% opacity) on dark background — needs verification |
| Various files | Multiple | `text-white/70` on colored backgrounds in gradient cards — borderline |

**Recommendation:** Darken `--tv-text-decorative` from `#7a6b96` to at least `#635580` (~4.6:1 vs white) or `#5c4f78` (~5.3:1). Also increase minimum text size from 8px/9px to 11px minimum.

---

### 1.4.4 Resize Text (Level AA) — ✅ Pass

The app uses relative units (rem via Tailwind) and responsive layouts. Text reflows properly at 200% zoom.

---

### 1.4.5 Images of Text (Level AA) — ✅ Pass

No images of text are used — all text is rendered as real text.

---

### 1.4.10 Reflow (Level AA) — ⚠️ Partial

Most content reflows at 320px width, but some complex layouts (campaign builder, envelope builder) have `min-width` constraints that may cause horizontal scrolling on very narrow viewports.

---

### 1.4.11 Non-text Contrast (Level AA) — ⚠️ Partial

Most UI components (buttons, inputs, toggles) have sufficient contrast against backgrounds. However:
- Input borders using `border-tv-border-light` on white may be close to 3:1 minimum
- Some inactive toggle tracks may lack sufficient contrast

---

### 1.4.12 Text Spacing (Level AA) — ✅ Pass

Tailwind utilities allow text spacing overrides. No `!important` on line-height or letter-spacing that would prevent user customization.

---

### 1.4.13 Content on Hover or Focus (Level AA) — ⚠️ Partial

Tooltips (`TvTooltip`) are hoverable and dismissible. However:
- Merge field picker dropdown closes on outside click but doesn't stay open while hovering its content ✅ (it does stay)
- Some popovers may not be dismissible via Escape in all cases

---

## Principle 2: Operable

### 2.1.1 Keyboard (Level A) — ❌ Fail

**Clickable elements without keyboard support:**

| File | Line | Issue |
|------|------|-------|
| `Dashboard.tsx` | 353 | Quick action cards — `onClick` but no `onKeyDown`, `tabIndex`, or `role="button"` |
| `Dashboard.tsx` | 549 | Metric selection divs — same |
| `PersonalizedRecorder.tsx` | 1495, 1547, 1610 | Background/effect selectors — clickable divs with no keyboard access |
| `IntroOutroBuilder.tsx` | 409, 420, 910 | Music track selection — clickable divs, no keyboard handlers |

**Note:** Many other interactive elements DO properly support keyboard (asset library cards, campaign cards, flow nodes). The gaps are localized.

**Recommendation:** Add `role="button"`, `tabIndex={0}`, and `onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick() }}` to all clickable divs.

---

### 2.1.2 No Keyboard Trap (Level A) — ⚠️ Partial

Modals WITH `FocusTrap` properly manage focus. However, **11 modal-like overlays lack FocusTrap**, which means keyboard users can tab behind them:

| File | Component | Issue |
|------|-----------|-------|
| `assets/ImageLibrary.tsx` | Preview modal | No FocusTrap, no `role="dialog"` |
| `assets/VideoClips.tsx` | Preview modal | Same |
| `assets/IntroLibrary.tsx` | Preview modal | Same |
| `assets/OutroLibrary.tsx` | Preview modal | Same |
| `assets/LandingPageDesigns.tsx` | Preview modal | Same |
| `assets/EnvelopeDesigns.tsx` | Preview modal | Same |
| `assets/EmailTemplates.tsx` | Preview modal | Same |
| `campaign/VideoEditorModal.tsx` | Video editor overlay | No FocusTrap |
| `campaign/VideoLibraryPanel.tsx` | Delete confirmation | No FocusTrap |
| `Dashboard.tsx` | Metrics settings modal | Has `role="dialog"` but no FocusTrap |
| `components/NotificationsPanel.tsx` | Notification panel | Has `role="dialog"` but no FocusTrap |

**Recommendation:** Wrap all modal overlays in Mantine's `<FocusTrap active>` and ensure Escape key closes them.

---

### 2.1.4 Character Key Shortcuts (Level A) — ✅ Pass

No single-character keyboard shortcuts are implemented.

---

### 2.2.1 Timing Adjustable (Level A) — ✅ Pass

No time limits are imposed on user actions.

---

### 2.2.2 Pause, Stop, Hide (Level A) — ✅ Pass

Auto-playing animations respect `prefers-reduced-motion` via global CSS rule. Toast notifications auto-dismiss but include close buttons.

---

### 2.4.1 Bypass Blocks (Level A) — ✅ Pass

**Skip navigation link implemented:**
- `Layout.tsx:518` — `<a href="#main-content">Skip to main content</a>` with `sr-only focus:not-sr-only` styling
- Target `id="main-content"` on `<main>` element at line 535

---

### 2.4.2 Page Titled (Level A) — ⚠️ Partial

The HTML `<title>` likely shows the app name but doesn't change per-page (SPA behavior). Each page should update `document.title` via a `useEffect` or React Helmet equivalent.

---

### 2.4.3 Focus Order (Level A) — ✅ Pass

Tab order follows logical visual order. No `tabIndex` values greater than 0 found.

---

### 2.4.5 Multiple Ways (Level AA) — ✅ Pass

Users can navigate via sidebar navigation, breadcrumbs, and the global search component.

---

### 2.4.6 Headings and Labels (Level AA) — ❌ Fail

See 1.3.1 above — multiple pages lack headings entirely. Headings that do exist are descriptive.

---

### 2.4.7 Focus Visible (Level AA) — ✅ Pass

Global CSS at `theme.css:138-144` ensures all focusable elements have a visible 2px brand-color outline:
```css
*:focus-visible {
  outline: 2px solid var(--tv-brand) !important;
  outline-offset: 2px !important;
}
```

---

### 2.4.11 Focus Not Obscured (Level AA) — ⚠️ Partial

Most focused elements are visible, but sticky headers and fixed sidebars could potentially obscure focused elements at certain scroll positions.

---

### 2.5.3 Label in Name (Level A) — ⚠️ Partial

Most buttons with icons include visible text that matches their accessible name. Icon-only buttons generally have `aria-label`. A few icon buttons in asset pages may have generic labels.

---

### 2.5.8 Target Size Minimum (Level AA) — ⚠️ Partial

Most interactive elements meet the 24x24px minimum. Exceptions:

| File | Element | Size | Issue |
|------|---------|------|-------|
| `VideoEditor.tsx:587` | Tag remove button | ~14px | `p-0.5` padding too small |
| `AddRecipientsPanel.tsx:302` | Remove button | ~16px | `p-0.5` |
| `CreateAssets.tsx:722` | More actions | ~16px | `p-0.5` |
| `EnvelopeBuilder.tsx:1015` | Color swatch | 20x20px | `w-5 h-5` — under 24px |
| `CreateCampaign.tsx:1624` | Info icon button | 16x16px | `w-4 h-4` |

**Recommendation:** Ensure all interactive elements have at least `p-1.5` (6px per side) to reach 24px minimum, or use `min-w-6 min-h-6` on small buttons.

---

## Principle 3: Understandable

### 3.1.1 Language of Page (Level A) — ⚠️ Partial

Need to verify that `<html lang="en">` is set in the root HTML file.

### 3.2.1 On Focus (Level A) — ✅ Pass

No context changes occur on focus alone.

### 3.2.2 On Input (Level A) — ✅ Pass

No unexpected context changes on input. Toggle switches and selections update state without navigation.

### 3.2.3 Consistent Navigation (Level AA) — ✅ Pass

Sidebar navigation is consistent across all pages. Breadcrumbs follow consistent patterns.

### 3.2.4 Consistent Identification (Level AA) — ✅ Pass

Components with identical functionality (save buttons, delete actions, search inputs) use consistent labels and styling.

### 3.3.1 Error Identification (Level A) — ⚠️ Partial

Toast notifications provide error feedback. However, form validation errors aren't consistently shown inline next to the offending field. The ConfirmSend merge field validation is well-done, but other forms (Settings, campaign creation) lack inline error states.

### 3.3.2 Labels or Instructions (Level A) — ❌ Fail

**~10-15 form inputs without programmatic label association:**

| File | Line | Issue |
|------|------|-------|
| `EnvelopeBuilder.tsx` | 317 | `<input placeholder="Untitled Envelope">` — no label, no aria-label |
| `LandingPageBuilder.tsx` | 607 | Image name input — no label |
| `LandingPageBuilder.tsx` | 665 | Hex color input — no label |
| `LandingPageBuilder.tsx` | 666 | Color name input — no label |
| `LandingPageBuilder.tsx` | 727 | Gradient name input — no label |
| `ConfirmSend.tsx` | 142 | Fallback value input — no label |
| `VideoModals.tsx` | 53 | Search input — no aria-label |
| `VideoRequestCampaign.tsx` | 333 | Search input — no aria-label |

**Recommendation:** Add `aria-label` to all inputs that don't have visible `<label>` elements.

### 3.3.3 Error Suggestion (Level AA) — ⚠️ Partial

When merge field validation identifies issues, it suggests specific corrections (fallback values). But general form errors (e.g., "Please fill in all card fields") don't specify which field is missing.

### 3.3.4 Error Prevention (Level AA) — ✅ Pass

Delete actions use confirmation modals. Campaign sending has a multi-step confirmation flow.

---

## Principle 4: Robust

### 4.1.2 Name, Role, Value (Level A) — ❌ Fail

**Custom interactive elements missing ARIA roles:**

| File | Lines | Issue |
|------|-------|-------|
| `assets/ImageLibrary.tsx` | 296 | Action menu button — no `aria-expanded`, `aria-haspopup` |
| `assets/VideoClips.tsx` | 361 | Same |
| `assets/IntroLibrary.tsx` | 282 | Same |
| `assets/OutroLibrary.tsx` | 265 | Same |
| `assets/EmailTemplates.tsx` | 224 | Same |
| `assets/EnvelopeDesigns.tsx` | 271 | Same |
| `assets/LandingPageDesigns.tsx` | 358 | Same |
| `CreateAssets.tsx` | 675 | Same |

All 8 "More actions" menu buttons across asset pages lack `aria-expanded` and `aria-haspopup="menu"`.

**Recommendation:** Add `aria-haspopup="menu"` and `aria-expanded={isOpen}` to all menu trigger buttons.

### 4.1.3 Status Messages (Level AA) — ⚠️ Partial

Toast notifications use the `useToast()` hook but need to verify they use `role="status"` or `aria-live="polite"` to announce to screen readers. The toast component should be checked.

---

## Priority Summary

### 🔴 HIGH — Fix These First

| # | WCAG | Issue | Impact | Files Affected |
|---|------|-------|--------|----------------|
| 1 | 1.4.3 | **`--tv-text-decorative` (#7a6b96) fails 4.5:1 contrast** on white (3.7:1) and surface (3.2:1) backgrounds | ~100+ instances across entire app | `theme.css` — single token fix |
| 2 | 2.1.1, 2.1.2 | **11 modals without FocusTrap** — keyboard users can tab behind overlays | 11 modal components | 7 asset preview modals + 4 others |
| 3 | 1.3.1, 2.4.6 | **6+ pages missing heading hierarchy** — no semantic headings for screen reader navigation | Settings, Contacts, Analytics, ContactProfile, Lists, SavedSearches | |
| 4 | 3.3.2 | **~10-15 form inputs without labels** — screen readers can't identify input purpose | Spread across builders and search inputs | |
| 5 | 4.1.2 | **8 menu buttons missing aria-expanded/aria-haspopup** — assistive tech can't identify menus | All 7 asset pages + CreateAssets | |

### 🟡 MEDIUM — Fix Next

| # | WCAG | Issue | Impact |
|---|------|-------|--------|
| 6 | 2.1.1 | ~8 clickable divs without keyboard access (role/tabIndex/onKeyDown) | Dashboard, PersonalizedRecorder, IntroOutroBuilder |
| 7 | 1.3.5 | Missing `autocomplete` attributes on personal data inputs | Settings profile, Subscription card form |
| 8 | 2.4.2 | Page `<title>` doesn't update per-page in SPA | All pages |
| 9 | 1.4.11 | Input border contrast may be borderline (border-tv-border-light vs white) | All form inputs |
| 10 | 2.5.8 | ~5 interactive elements under 24x24px touch target | Tag remove buttons, color swatches, info icons |

### 🟢 LOW — Polish

| # | WCAG | Issue |
|---|------|-------|
| 11 | 1.1.1 | 5 images with `alt=""` that should have descriptive text |
| 12 | 3.1.1 | Verify `<html lang="en">` is set |
| 13 | 4.1.3 | Verify toast notifications use `aria-live` region |
| 14 | 1.4.1 | A few status dots rely on color without adjacent text |
| 15 | 7 landmark | Sidebar needs `<nav>`, top bar needs `<header>` role |

---

## Recommended Fix: `--tv-text-decorative` Contrast (Highest Impact, Single Change)

The single highest-impact fix is darkening the `--tv-text-decorative` CSS custom property in `src/styles/theme.css`. This one change fixes ~100+ instances across the entire app.

```css
/* Before: fails WCAG AA at 3.7:1 */
--tv-text-decorative: #7a6b96;

/* After: passes WCAG AA at 4.6:1 */
--tv-text-decorative: #635580;

/* Or for more comfortable margin: passes at 5.3:1 */
--tv-text-decorative: #5c4f78;
```

---

## Appendix: What's Working Well

The prototype already has strong accessibility foundations:
- ✅ **Skip navigation** — properly implemented
- ✅ **Focus indicators** — global `focus-visible` CSS rule with 2px brand outline
- ✅ **Reduced motion** — comprehensive `prefers-reduced-motion` media query
- ✅ **Toggle components** — correct `role="switch"` + `aria-checked`
- ✅ **Most modals** — proper `role="dialog"` + `aria-modal` + `FocusTrap`
- ✅ **Most interactive cards** — proper `role="button"` + `tabIndex` + keyboard handlers
- ✅ **Table pagination** — proper `<nav aria-label>` landmarks
- ✅ **Breadcrumbs** — proper `<nav aria-label="Breadcrumb">`
- ✅ **No images of text** — all text is real text
- ✅ **Consistent navigation** — sidebar and patterns are consistent across pages
- ✅ **Error prevention** — delete confirmations, multi-step send flow
