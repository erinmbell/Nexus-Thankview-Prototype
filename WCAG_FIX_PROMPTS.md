# WCAG AA Fix Prompts — ThankView

Every remaining accessibility issue with a copy-paste prompt for Claude Code.

---

## 1. Hover-Only Buttons in Library Grid Views

**Issue:** Interactive buttons (select, star, actions menu) are hidden with `opacity-0` and only appear on `group-hover`. Keyboard and screen reader users can never reach them.
**WCAG:** 2.4.7 Focus Visible, 2.1.1 Keyboard
**Files:** `VideoLibrary.tsx` (lines 350, 414, 492, 778), `ImageLibrary.tsx` (lines 256, 267, 271), `OutroLibrary.tsx`, `IntroLibrary.tsx`, `VideoClips.tsx`, `LandingPageDesigns.tsx`

**Prompt:**
> In the ThankView prototype, there are interactive buttons across library/grid views that use `opacity-0 group-hover:opacity-100` to hide until mouse hover. This means keyboard and screen reader users can never access them. Fix every instance across these files: `VideoLibrary.tsx`, `ImageLibrary.tsx`, `OutroLibrary.tsx`, `IntroLibrary.tsx`, `VideoClips.tsx`, and `LandingPageDesigns.tsx`. For each, add `group-focus-within:opacity-100 focus-visible:opacity-100` alongside the existing `group-hover:opacity-100` so buttons also appear when any element in the card receives keyboard focus. Do not change the visual hover behavior — just add focus parity.

---

## 2. StatusChangeModal — Clickable Divs Without Keyboard Support

**Issue:** Step dots and step labels are clickable divs with `onClick` but no `role`, `tabIndex`, or `onKeyDown` handler.
**WCAG:** 2.1.1 Keyboard, 4.1.2 Name Role Value
**File:** `StatusChangeModal.tsx` (lines 193-207, 237)

**Prompt:**
> In `src/app/components/StatusChangeModal.tsx`, the step dots (around line 193-207) and step labels (around line 237) are clickable divs with `onClick` handlers but no keyboard support. For each clickable div: add `role="button"`, `tabIndex={0}`, and an `onKeyDown` handler that triggers the click on Enter or Space. Also add `onMouseEnter`/`onMouseLeave` focus equivalents — the hover highlight styles should also apply on `:focus-visible`. Don't change any visual styling.

---

## 3. CSVImportWizard — Drag-Drop Zone Missing Button Semantics

**Issue:** The file upload drag-drop zone has `onClick` but no `role="button"`, `tabIndex`, or keyboard handler.
**WCAG:** 4.1.2 Name Role Value, 2.1.1 Keyboard
**File:** `CSVImportWizard.tsx` (lines 333-342)

**Prompt:**
> In `src/app/components/CSVImportWizard.tsx`, the drag-and-drop file upload zone (around lines 333-342) is a div with `onClick`, `onDragOver`, `onDragLeave`, and `onDrop` handlers but no keyboard accessibility. Add `role="button"`, `tabIndex={0}`, and an `onKeyDown` handler that triggers the file picker on Enter or Space. Also add an `aria-label="Upload CSV file"` to the zone.

---

## 4. ConfirmSend — Icon-Only Close Button Missing aria-label

**Issue:** X button to close fallback editor has no accessible name.
**WCAG:** 1.1.1 Non-text Content, 4.1.2 Name Role Value
**File:** `ConfirmSend.tsx` (line 144)

**Prompt:**
> In `src/app/pages/campaign/ConfirmSend.tsx` around line 144, there's an icon-only close button (`<X size={11} />`) with no `aria-label`. Add `aria-label="Cancel fallback edit"` to this button.

---

## 5. ConfirmSend — Dynamic Merge Field Warnings Lack aria-live

**Issue:** Merge field warning section updates dynamically when users resolve fields but screen readers aren't notified.
**WCAG:** 4.1.3 Status Messages
**File:** `ConfirmSend.tsx` (lines 107-160)

**Prompt:**
> In `src/app/pages/campaign/ConfirmSend.tsx`, the merge field warnings section (around lines 107-160) updates dynamically as users resolve merge field issues. Add `aria-live="polite"` and `aria-atomic="true"` to the container that wraps these warnings so screen readers announce changes.

---

## 6. ConfigureStepPanel — Icon-Only Info Buttons Missing aria-label

**Issue:** Two info (i) toggle buttons have no accessible name.
**WCAG:** 1.1.1 Non-text Content
**File:** `ConfigureStepPanel.tsx` (lines 171, 219)

**Prompt:**
> In `src/app/pages/campaign/ConfigureStepPanel.tsx`, there are two icon-only info buttons (around lines 171 and 219) that toggle explanatory text. Each uses `<Info size={10} />` with no `aria-label`. Add `aria-label="Toggle metrics explanation"` to the first and `aria-label="Toggle drop-off explanation"` to the second. Also add `aria-expanded={showMetricsInfo}` and `aria-expanded={showDropoffInfo}` respectively.

---

## 7. ConfigureStepPanel — Select Dropdowns Without Labels

**Issue:** Two native `<select>` elements for removal conditions and email templates have no associated label.
**WCAG:** 1.3.1 Info and Relationships, 3.3.2 Labels
**File:** `ConfigureStepPanel.tsx` (lines 383, 406)

**Prompt:**
> In `src/app/pages/campaign/ConfigureStepPanel.tsx`, there are `<select>` elements around lines 383 and 406 that lack associated labels. Add an `aria-label` to each: `aria-label="Removal condition"` for the first and `aria-label="Email template"` for the second. If there's visual label text nearby, use `<label htmlFor>` instead.

---

## 8. ConfigureStepPanel — Reduced Opacity on Danger Text

**Issue:** `text-tv-danger/80` applies 80% opacity to error text, reducing contrast below 4.5:1.
**WCAG:** 1.4.3 Contrast (Minimum)
**File:** `ConfigureStepPanel.tsx` (line 225)

**Prompt:**
> In `src/app/pages/campaign/ConfigureStepPanel.tsx` around line 225, there's a paragraph using `text-tv-danger/80` (danger color at 80% opacity). The base `tv-danger` (#dc2626) is 4.63:1 on white — applying 80% opacity drops it below 4.5:1 AA minimum. Change `text-tv-danger/80` to `text-tv-danger` (full opacity).

---

## 9. MultiStepBuilder — Drag Handle Missing aria-label

**Issue:** Drag handle button has a `title` attribute but no `aria-label`.
**WCAG:** 1.1.1 Non-text Content
**File:** `MultiStepBuilder.tsx` (line 341)

**Prompt:**
> In `src/app/pages/campaign/MultiStepBuilder.tsx` around line 341, there's a drag handle button that uses `title` but no `aria-label`. Add `aria-label="Drag to reorder"` to the button element.

---

## 10. MultiStepBuilder — Collapsible Section Missing aria-expanded

**Issue:** DrawerSection toggle button doesn't communicate expanded/collapsed state.
**WCAG:** 4.1.2 Name Role Value
**File:** `MultiStepBuilder.tsx` (line 421)

**Prompt:**
> In `src/app/pages/campaign/MultiStepBuilder.tsx` around line 421, there's a collapsible DrawerSection with a toggle button that doesn't have `aria-expanded`. Add `aria-expanded={open}` to the button that toggles the section open/closed (where `open` is the state variable controlling visibility).

---

## 11. RecipientPanel — Column Visibility Button Missing aria-label

**Issue:** Icon-only button for showing/hiding table columns has no accessible name.
**WCAG:** 1.1.1 Non-text Content
**File:** `RecipientPanel.tsx` (line 1219)

**Prompt:**
> In `src/app/pages/campaign/RecipientPanel.tsx` around line 1219, there's an icon-only button for toggling column visibility with no `aria-label`. Add `aria-label="Customize visible columns"`.

---

## 12. DeleteModal — Hidden Title Without aria-labelledby

**Issue:** Modal title is hidden with `display: "none"` but no `aria-labelledby` connects the modal to its accessible name.
**WCAG:** 1.3.1 Info and Relationships
**File:** `ui/DeleteModal.tsx` (line 21)

**Prompt:**
> In `src/app/components/ui/DeleteModal.tsx` around line 21, the Mantine Modal's title is hidden with `styles={{ title: { display: "none" } }}`. Since the title is visually hidden, add `aria-label` to the Modal component with a descriptive string like the `title` prop value (e.g., `aria-label="Confirm deletion"`), or switch from `display: "none"` to a `sr-only` CSS class so the title is still available to screen readers.

---

## 13. NotificationsPanel — role="listitem" Without Parent role="list"

**Issue:** Notification items have `role="listitem"` but their container doesn't have `role="list"`.
**WCAG:** 1.3.1 Info and Relationships
**File:** `NotificationsPanel.tsx` (line 141)

**Prompt:**
> In `src/app/components/NotificationsPanel.tsx`, notification items around line 141 use `role="listitem"` but the parent container doesn't have `role="list"`. Add `role="list"` to the wrapping container element (the Stack or div that contains the notification items).

---

## 14. NotificationsPanel — Mark-as-Read Button Hidden on Hover

**Issue:** The mark-as-read button uses `opacity-0 group-hover:opacity-100`, making it inaccessible to keyboard users.
**WCAG:** 2.4.7 Focus Visible, 2.1.1 Keyboard
**File:** `NotificationsPanel.tsx` (line 162)

**Prompt:**
> In `src/app/components/NotificationsPanel.tsx` around line 162, the mark-as-read button is hidden with `opacity-0 group-hover:opacity-100`. Add `focus-visible:opacity-100 group-focus-within:opacity-100` so the button is also visible when it receives keyboard focus or when any element in the notification item is focused.

---

## 15. RichTextEditor — contentEditable Div Missing aria-label

**Issue:** The contentEditable editing area has no accessible name.
**WCAG:** 1.3.1 Info and Relationships
**File:** `RichTextEditor.tsx`

**Prompt:**
> In `src/app/components/RichTextEditor.tsx`, the `contentEditable` div that serves as the text editing area has no `aria-label`. Add `aria-label="Rich text editor"` and `role="textbox"` to the contentEditable div so screen readers identify it as an editable text region.

---

## 16. CSVImportWizard — Table Headers Missing scope

**Issue:** Table `<th>` elements don't have `scope="col"` for proper header-cell association.
**WCAG:** 1.3.1 Info and Relationships
**File:** `CSVImportWizard.tsx` (lines 488-499)

**Prompt:**
> In `src/app/components/CSVImportWizard.tsx` around lines 488-499, the data preview table has `<th>` elements without `scope` attributes. Add `scope="col"` to each `<th>` in the header row so screen readers properly associate headers with their column cells.

---

## 17. CSVImportWizard — Column Mapping Select Without Label

**Issue:** The column mapping `<select>` dropdown in the mapping step has no associated label.
**WCAG:** 1.3.1 Info and Relationships, 3.3.2 Labels
**File:** `CSVImportWizard.tsx` (lines 420-434)

**Prompt:**
> In `src/app/components/CSVImportWizard.tsx` around lines 420-434, each column mapping `<select>` dropdown lacks an associated label. Add `aria-label` to each select that includes the CSV column name, e.g., `aria-label={`Map ${header} to ThankView field`}` where `header` is the CSV column header string.

---

## 18. ImageUploadModal — Close Button Focus Visibility

**Issue:** The overlay close button (X on dark semi-transparent background) may not show a visible focus ring.
**WCAG:** 2.4.7 Focus Visible
**File:** `ui/ImageUploadModal.tsx` (lines 356-359)

**Prompt:**
> In `src/app/components/ui/ImageUploadModal.tsx` around lines 356-359, there's a close button with `className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50"` and an X icon. The global `:focus-visible` outline (purple on 2px offset) may not be visible against the dark overlay. Add `focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2` to ensure the focus indicator is visible on the dark background.

---

## 19. ImageUploadModal — Generic Image Alt Text

**Issue:** Preview image uses `alt="Preview"` which doesn't describe the content.
**WCAG:** 1.1.1 Non-text Content
**File:** `ui/ImageUploadModal.tsx` (line 350)

**Prompt:**
> In `src/app/components/ui/ImageUploadModal.tsx` around line 350, the uploaded image preview uses `alt="Preview"`. Change it to something more descriptive like `alt="Uploaded image preview"` or pass through the filename: `alt={`Preview of ${file?.name || "uploaded image"}`}`.

---

## 20. LandingPageLivePreviewModal — Spans Styled as Buttons

**Issue:** CTA elements are `<span>` tags with `cursor-default` instead of actual buttons.
**WCAG:** 4.1.2 Name Role Value
**File:** `LandingPageLivePreviewModal.tsx` (lines 204, 225-230)

**Prompt:**
> In `src/app/components/LandingPageLivePreviewModal.tsx` around lines 204 and 225-230, there are `<span>` elements styled to look like buttons (with padding, border-radius, background colors) but they use `cursor-default` and have no button semantics. Since these are a non-interactive preview of what the landing page CTA will look like, add `role="img"` and `aria-label="CTA button preview: [button text]"` to communicate that these are visual previews, not interactive elements. If they are interactive, convert them to `<button>` elements.

---

## 21. Settings — Form Groups Without fieldset/legend

**Issue:** Settings page has logical groups of form controls but doesn't use `<fieldset>`/`<legend>`.
**WCAG:** 1.3.1 Info and Relationships
**File:** `Settings.tsx`

**Prompt:**
> In `src/app/pages/Settings.tsx`, settings sections like "Organization Settings", "Email Configuration", "SMS Configuration" etc. group related form controls but don't use `<fieldset>` and `<legend>`. For each section that contains a `<Title order={2}>` followed by form inputs, wrap the section in a `<fieldset>` with `className="border-0 p-0 m-0"` (to avoid default fieldset styling) and convert the `<Title order={2}>` to a `<legend>` element styled identically. This gives screen readers proper form grouping context.

---

## 22. DesignStepPanel — Display Type Buttons Without aria-label

**Issue:** Design display type and animation style selector buttons lack accessible names.
**WCAG:** 1.1.1 Non-text Content
**File:** `DesignStepPanel.tsx` (lines 429-452, 470-487)

**Prompt:**
> In `src/app/pages/campaign/DesignStepPanel.tsx`, the display type selector buttons (around lines 429-452) and animation style buttons (around lines 470-487) lack `aria-label` attributes. Add `aria-label={opt.label}` to each display type button and `aria-label={animOpt.label}` to each animation style button so screen readers can identify the options.

---

## 23. CreateCampaign — SmsMergeBar "More" Button Needs aria-label

**Issue:** The "+ More" button in the SMS merge field toolbar lacks a descriptive accessible name.
**WCAG:** 2.4.4 Link Purpose
**File:** `CreateCampaign.tsx` (lines 106-111)

**Prompt:**
> In `src/app/pages/CreateCampaign.tsx` around lines 106-111, the SmsMergeBar has a "+ More" button that opens additional merge field options. Add `aria-label="Show additional merge fields"` to make its purpose clear to screen reader users.
