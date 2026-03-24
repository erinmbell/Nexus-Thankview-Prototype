# ThankView Multi-Step Campaign Builder — Standalone Spec

> **Purpose:** Drop this file into a new Claude chat along with your target project to have the multi-step campaign builder recreated. This spec covers the complete architecture, data model, component hierarchy, UI patterns, and behavioral logic.
>
> **Stack:** React 18 + TypeScript + Tailwind CSS + Framer Motion + @dnd-kit + @tanstack/react-virtual + Mantine (FocusTrap) + Lucide icons

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Core Data Model (types.ts)](#2-core-data-model)
3. [Shared Styles (styles.ts)](#3-shared-styles)
4. [Shared UI Components (SharedUI.tsx)](#4-shared-ui-components)
5. [MultiStepBuilder — The Orchestrator](#5-multistepbuilder)
6. [FlowNode — Step Card](#6-flownode)
7. [StepDrawer — Step Editor](#7-stepdrawer)
8. [ConfigureStepPanel — Step 1](#8-configuresteppanel)
9. [DesignStepPanel — Envelope/LP/Content/Tracking](#9-designsteppanel)
10. [LivePreviewPanel — Real-time Preview](#10-livepreviewpanel)
11. [RecipientPanel — Constituent Management](#11-recipientpanel)
12. [VideoBuilder — Video Assembly](#12-videobuilder)
13. [IntroOutroBuilder — Themes & Customization](#13-introoutrobuilder)
14. [TagPicker — Campaign Tags](#14-tagpicker)
15. [Template System (TemplateContext)](#15-template-system)
16. [Design Library (DesignLibraryContext)](#16-design-library)
17. [Key Patterns & Conventions](#17-key-patterns)

---

## 1. Architecture Overview

```
CreateCampaign (page)
├── Mode selection (single-step / multi-step / template)
├── MultiStepBuilder (multi-step mode)
│   ├── Flow Canvas (left, scrollable, vertical)
│   │   ├── FlowNode (per step, drag-sortable)
│   │   ├── Connector lines
│   │   └── AddStepButton (between steps)
│   ├── StepDrawer (right slide-in, 380px→expandable)
│   │   ├── Requirements validation
│   │   ├── Step info (name, description)
│   │   ├── Step-specific sections:
│   │   │   ├── Email: sender, subject, body (RTE), envelope, thumbnail, LP
│   │   │   ├── SMS: phone, body, auto-responder
│   │   │   ├── Wait: duration presets or custom
│   │   │   ├── Condition: behavior-based branching
│   │   │   └── Video Request: delivery, instructions, due date
│   │   ├── Automation & timing
│   │   └── Social sharing
│   └── LivePreviewPanel (right, inline or floating)
├── ConfigureStepPanel (metrics, tags, advanced)
├── RecipientPanel (constituent management)
├── VideoBuilder (intro/main/outro assembly)
└── ConfirmSend (pre-send validation)
```

**Navigation flow:** The builder has 4-5 phases accessed via a top breadcrumb bar:
1. **Configure** → Metrics, tags, settings
2. **Build Flow** → Multi-step canvas + drawer editing
3. **Video** → Video assembly (intro/main/outro)
4. **Constituents** → Recipient selection
5. **Review & Send** → Confirmation + scheduling

---

## 2. Core Data Model

### FlowStepType

```typescript
type FlowStepType = "email" | "sms" | "wait" | "condition" | "exit" | "video-request";
```

### FlowStep (The Master Interface)

```typescript
interface FlowStep {
  id: string;
  type: FlowStepType;
  label: string;
  description: string;
  automationEnabled: boolean;
  sendTimePreference: string;

  // ── Wait ──
  waitDays?: number;
  waitUntilDate?: string;

  // ── Condition ──
  conditionField?: string;
  trueBranch?: FlowStep[];   // recursive
  falseBranch?: FlowStep[];  // recursive

  // ── Email Content ──
  subject?: string;
  body?: string;
  senderName?: string;
  senderEmail?: string;
  replyTo?: string;
  replyToList?: string[];       // multiple reply-to
  ccAddresses?: string;
  bccAddresses?: string;
  font?: string;
  bodyFontFamily?: string;
  bodyFontSize?: number;
  bodyTextColor?: string;
  bodyLineHeight?: number;
  signatureId?: number | null;
  envelopeId?: number;
  thumbnailType?: "envelope" | "static" | "animated";
  includeVideoThumbnail?: boolean;
  btnBg?: string;
  btnText?: string;

  // ── SMS Content ──
  smsBody?: string;
  smsPhoneNumber?: string;
  smsReplyToPhone?: string;
  smsAutoResponder?: string;
  smsQuietHours?: boolean;

  // ── Video Attachment ──
  attachedVideo?: { id: number; title: string; duration: string; color: string } | null;

  // ── Landing Page ──
  landingPageEnabled?: boolean;
  landingPageId?: number;
  lpModule?: "none" | "cta" | "pdf" | "form";
  ctaText?: string;
  ctaUrl?: string;
  allowEmailReply?: boolean;
  allowVideoReply?: boolean;
  allowSaveButton?: boolean;
  allowShareButton?: boolean;
  allowDownloadVideo?: boolean;
  closedCaptionsEnabled?: boolean;
  lpWhiteGradient?: boolean;

  // ── Envelope Text ──
  envelopePreText?: string;
  envelopePostText?: string;

  // ── PDF Attachment (LP module) ──
  pdfFileName?: string;
  pdfPages?: number;
  pdfSize?: string;
  pdfAllowDownload?: boolean;
  pdfShareWithConstituents?: boolean;

  // ── Form Embed (LP module) ──
  formUrl?: string;
  formHeight?: number;
  formFullWidth?: boolean;

  // ── Misc ──
  subscribeCta?: boolean;
  language?: string;

  // ── Video Request ──
  vrDeliveryType?: "email" | "sms" | "link";
  vrInstructions?: string;
  vrInstructionVideoId?: number;
  vrDueDate?: string;
  vrReminderDays?: number[];
  vrReminderEnabled?: boolean;
  vrSubmissionsEnabled?: boolean;

  // ── Social Sharing ──
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;

  // ── ODDER / Endowment ──
  odderReportTabs?: OdderReportTab[];
  odderPassword?: string;
  odderPasswordEnabled?: boolean;

  // ── Contact Date Field Automation ──
  contactDateFieldId?: string;  // "birthday" | "anniversary" | etc.
  contactFieldDaysBefore?: number;
  contactFieldRecurAnnually?: boolean;
  contactFieldLeapYear?: "feb28" | "mar1";
  contactFieldSendTime?: string;
}
```

### Key Constants

```typescript
const FLOW_STEP_TYPES = [
  { id: "email",         label: "Email",         icon: Mail,          color: "text-tv-brand",   bg: "bg-tv-brand-tint" },
  { id: "sms",           label: "SMS",           icon: MessageSquare, color: "text-tv-info",    bg: "bg-tv-info-bg" },
  { id: "wait",          label: "Wait",          icon: Timer,         color: "text-tv-warning", bg: "bg-tv-warning-bg" },
  { id: "condition",     label: "Condition",      icon: GitBranch,     color: "text-tv-brand",   bg: "bg-tv-brand-tint" },
  { id: "video-request", label: "Video Request",  icon: Bell,          color: "text-tv-warning", bg: "bg-tv-warning-bg" },
];

const CONDITION_OPTIONS = [
  { id: "email_opened",    label: "Email Opened?",             channels: ["email"] },
  { id: "responded_email", label: "Responded to Email?",       channels: ["email"] },
  { id: "sms_responded",   label: "Responded to SMS?",         channels: ["sms"] },
  { id: "sms_viewed_link", label: "Viewed Link in SMS?",       channels: ["sms"] },
  { id: "had_interaction", label: "Had Interaction" },
  { id: "made_gift",      label: "Made Gift" },
  { id: "portfolio_stage", label: "Moved into Portfolio Stage" },
  { id: "saved_search",   label: "Qualified for Saved Search" },
];

const WAIT_PRESETS = [1, 2, 3, 5, 7, 14, 30];  // days
const SMS_MAX = 160;

const CONSTITUENT_DATE_FIELDS = [
  { id: "birthday",        label: "Birthday",        icon: Cake },
  { id: "anniversary",     label: "Anniversary",     icon: Calendar },
  { id: "enrollment_date", label: "Enrollment Date",  icon: GraduationCap },
  { id: "graduation_date", label: "Graduation Date",  icon: GraduationCap },
  { id: "hire_date",       label: "Hire Date",        icon: Briefcase },
  { id: "custom_date_1",   label: "Custom Date 1",    icon: CalendarDays },
  { id: "custom_date_2",   label: "Custom Date 2",    icon: CalendarDays },
];

const LANGUAGE_OPTIONS = [
  "English", "French (Canada)", "Spanish", "Portuguese",
  "German", "Chinese (Simplified)", "Japanese", "Korean"
];
```

### Merge Field Registry (10 categories, ~120 tokens)

Categories: Contact Info, Address, Giving History, Education & Affiliation, Employment, Relationships, Events & Engagement, Campaign & Sender, System & Dates, Custom Fields.

Each field has `{ token: "{{field}}", label: "Human Label", example: "Preview Value" }`.

### Envelope Designs (18 designs)

```typescript
interface EnvelopeDesign {
  id: number; name: string; color: string; accent: string;
  nameColor: string; branded: boolean; lastUsed: string;
  category: "standard" | "holiday" | "legacy";
  holidayType?: "winter" | "christmas" | "greetings" | "thanksgiving" | "spring" | "eid-fitr" | "eid-adha";
}
// 6 standard + 6 holiday + 4 legacy + 2 user-created = 18 total
```

### Landing Pages (6 pages)

```typescript
interface LandingPageDef {
  id: number; name: string; color: string; accent: string; image: string;
}
```

### Success Metrics (20 metrics)

```typescript
interface SuccessMetricDef {
  id: string; label: string; icon: LucideIcon;
  category: "delivery" | "engagement" | "negative";
  channels?: ("email" | "sms")[];
  description?: string; benchmark?: string;
}
// 6 delivery + 10 engagement + 4 negative
```

---

## 3. Shared Styles

All campaign builder components share CSS class constants (Tailwind utility strings):

```typescript
export const INPUT_CLS       = "w-full border border-tv-border-light rounded-[8px] px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-tv-brand/40";
export const INPUT_CLS_LG    = "w-full border border-tv-border-light rounded-[10px] px-3.5 py-2.5 text-[13px] ...";
export const SELECT_CLS      = INPUT_CLS + " appearance-none pr-8 bg-[...chevron-svg...]";
export const TEXTAREA_CLS    = INPUT_CLS + " resize-none";
export const BTN_PRIMARY_CLS = "flex items-center gap-1.5 px-6 py-2.5 text-[13px] text-white bg-tv-brand-bg rounded-full hover:bg-tv-brand-hover";
export const BTN_OUTLINE_CLS = "flex items-center gap-1.5 px-4 py-2 text-[13px] border border-tv-border-light rounded-full hover:bg-tv-surface";
export const LABEL_CLS       = "tv-label mb-1 block";  // 10px, uppercase, semibold, tracking-wider
export const MERGE_PILL_CLS  = "text-[9px] font-mono text-tv-brand bg-tv-brand-tint border border-tv-border px-1 py-0.5 rounded";
export const RTE_WRAPPER_CLS = "border border-tv-border-light rounded-[10px] overflow-visible";
export const RTE_TOOLBAR_CLS = "flex items-center gap-0.5 px-2 py-1.5 bg-tv-surface border-b border-tv-border-light";
export const RTE_BODY_CLS    = "w-full px-3 py-2.5 text-[13px] outline-none resize-none rounded-b-[9px]";
export const TAG_INPUT_WRAPPER_CLS = "border border-tv-border-light rounded-[8px] px-2.5 py-1.5 flex flex-wrap gap-1 items-center min-h-[38px]";
```

**Design token prefix:** `tv-` — e.g., `text-tv-brand`, `bg-tv-surface`, `border-tv-border-light`, `text-tv-text-primary`, `text-tv-text-secondary`, `text-tv-text-decorative`, `bg-tv-brand-tint`, `bg-tv-surface-hover`, `text-tv-danger`, `bg-tv-danger-bg`, `text-tv-info`, `bg-tv-info-bg`, `text-tv-warning`, `bg-tv-warning-bg`.

---

## 4. Shared UI Components

### TvLabel
Design-system `<label>` with 10px uppercase semibold tracking.

### RichTextToolbar
Formatting toolbar: Bold, Italic, Underline, Link, Align, List, Indent+, Indent−. Optional merge field picker button + signature picker button. Uses TvTooltip for each icon button.

### SimpleRTE
Self-contained rich-text editor = RichTextToolbar + `<textarea>`. Accepts `onInsertMerge`, `onInsertSignature`, `wrapperClassName` (for warning borders), `bodyStyle` (font/size/color).

### MergeFieldDropdown
Wraps the full MergeFieldPicker (search, categories, favorites).

### EmojiDropdown
2-category (Smileys, Gestures) emoji picker with tab switcher and 8×N grid.

### EmailSignature system
`SAVED_SIGNATURES` — 4 pre-built signatures with name, title, org, phone, email, isDefault flag, and pre-formatted HTML for insertion.

---

## 5. MultiStepBuilder

**Layout:** Full-width, two-column. Left side is the scrollable flow canvas (centered, max-w ~400px). Right side is the StepDrawer when a step is selected.

**State:**
- `steps: FlowStep[]` — the ordered flow
- `selectedStepId: string | null`
- `showAddPopover: string | null` — which "+" button is showing its popover
- `dirty: boolean` — unsaved changes flag

**Drag-and-Drop:** `@dnd-kit` with `DndContext`, `closestCenter` collision, `PointerSensor`, `SortableContext`+`verticalListSortingStrategy`. On `DragEnd`, uses `arrayMove` to reorder steps.

**Flow rendering:**
```
[FlowNode step 1]
    |  Connector
[AddStepButton]
    |  Connector
[FlowNode step 2]
    |  Connector
[AddStepButton]
    ...
[FlowNode: Exit]
```

**Adding steps:** `AddStepPopover` shows the 5 `FLOW_STEP_TYPES` as cards. Selected type creates a new `FlowStep` with `makeId()` and inserts at the button's index. New steps are auto-selected.

---

## 6. FlowNode

Renders a step card (320px wide) with:
- Left color bar (2px) matching step type color
- Header: type icon + label + edit/delete buttons
- Rich content preview (subject line, body snippet, envelope thumbnail)
- For **condition** steps: shows True/False branch indicators
- For **video-request** steps: shows delivery type + due date chips
- Footer: automation toggle row with send-time indicator
- **Wait** steps render as a compact rounded pill (no drawer)
- **Exit** steps render as a simple pill

Selected state: blue ring + slightly elevated shadow.

---

## 7. StepDrawer

Slides in from right, 380px default width. Has an "expand" button that widens to `calc(100vw - 340px)`.

**Header:** Step type icon + label input + close (X) button.

**Content (accordion sections via `DrawerSection`):**

### 7.1 Requirements (always first)
Validation checklist. Error (red), Warning (amber), Info (blue) severity badges. Auto-populated based on step type:
- Email: subject required, body required, sender name/email, reply-to, landing page required when video attached
- SMS: phone required, body required, under 160 chars
- Video Request: delivery method, instructions, due date

### 7.2 Step Info
Label + description text inputs.

### 7.3 Wait Duration (wait steps only)
Preset day chips `[1, 2, 3, 5, 7, 14, 30]` + custom days input + "Wait until date" date picker.

### 7.4 Condition (condition steps only)
Filtered by preceding step channel. Shows `CONDITION_OPTIONS` as radio cards.

### 7.5 Video Request Config (VR steps only)
- Delivery: 3 radio cards (Email, SMS, Shareable Link)
- Instructions: textarea with merge fields
- Instruction Video: attach video from library
- Due Date: date picker
- Reminders: enable toggle + day chips (14, 7, 5, 3, 2, 1)
- Submissions: enable/disable toggle
- Include Library Video: toggle + picker
- Branded Landing Page: LP picker

### 7.6 Video (email/SMS steps)
Three source options: Record, Upload, Select from Library. Attached video shows gradient card with title/duration, swap/re-record/upload actions.

### 7.7 Email Content
- Sender info grid: Name, Email, Reply-To (tag input with multiple addresses), Font select
- CC/BCC: collapsible section
- Subject line: input with emoji picker + merge field picker
- Message body: RichTextEditor with body font/size/color/line-height controls
- Email signature: insertion from saved signatures
- AI Writing: popover with prompt → generate → stop → retry → insert flow
- Envelope: 6-card grid + "Browse All" + "Create New" buttons
- Thumbnail: 3 options (static image, animated GIF, envelope render)

### 7.8 SMS Content
- Sender name/phone inputs
- Reply-to phone
- Template loader dropdown (4 built-in SMS templates)
- Body: textarea with merge pill bar + emoji
- SMS Options: quiet hours toggle
- Auto-responder: textarea (250 char limit)
- AI Writing popover
- Compliance info block

### 7.9 Landing Page (email/SMS steps)
- Enable toggle
- LP grid picker (6 pages + Browse/Create)
- CTA module selector: none / CTA Button / PDF / Form Embed
- CTA: text + URL + button color controls (bg + text hex pickers)
- PDF: upload zone + metadata card (filename, pages, size) + download/share toggles
- Form: URL input with auto-detected platform badges (Givebutter, BoostMySchool, Typeform, etc.) + height config + full-width toggle
- Subscribe CTA toggle
- Button toggles: Email Reply, Video Reply, Save, Share, Download Video, Closed Captions
- Live preview strip showing button states
- White gradient overlay toggle
- Language selector

### 7.10 Automation & Timing
- Enable toggle
- Trigger type: time-based vs. contact date field
- Date field picker: 7 options as selectable cards (Birthday, Anniversary, Enrollment Date, Graduation Date, Hire Date, Custom Date 1, Custom Date 2)
- **AutomationConfigPanel** (for date-field mode):
  - Days-before: chip selector (0, 1, 3, 5, 7) + custom input
  - Mini calendar preview
  - Send time picker
  - Recur annually toggle
  - Leap year handling (Feb 28 or Mar 1) with info banner
  - Future constituents info note

### 7.11 Social Sharing
- Enable toggle
- OG title, description, image URL fields
- Mini Facebook OG card preview

---

## 8. ConfigureStepPanel

**Three sections:**

### 8.1 Success Metrics (Required)
Select 1-5 KPIs from 20 metrics across Delivery / Engagement / Drop-off categories. Uses `MetricChip` component (pill with icon + label). Warning when 0 selected, info badge when 5 reached.

### 8.2 Campaign Tags
Delegates to `TagPicker`. 11 preset tags + recent + custom creation.

### 8.3 Advanced Settings (Collapsible)
- **Sharing:** Private / Organization / Selected People (searchable team member picker with pills)
- **Auto-Removal Rules:** Dynamic list with condition dropdown (7 options: Bounced, Unsubscribed, Replied, Clicked CTA, Viewed video, No engagement after 3 sends, Spam), send-final-email toggle, email template selector

---

## 9. DesignStepPanel

**Two render modes:**
1. **Tabbed** (default): 4-tab icon rail (60px) + content area + pinned preview column
2. **Inline** (`inline` prop): 4 collapsible `<details>` sections

**Tabs:**
1. **Landing Page** — Grid picker, search, info cards
2. **Envelope** — Grid picker + appearance customizer (text before/after name, line breaks, name format)
3. **Content** — Attachment type selector (animated thumbnail / envelope render / static image), PDF upload, form embed, description editor
4. **Tracking** — Tracking pixel URL input

**Exported helpers:** `PAPER_TEXTURE` (SVG noise overlay), `PerforatedStamp` (SVG postage stamp with play button), `HolidayGraphic` (7 holiday type renderers), `isDarkColor(hex)`.

---

## 10. LivePreviewPanel

**Real-time preview with merge field resolution.**

### Preview modes:
- Email view (subject, body, video, envelope)
- Landing page view (full page with header, video player, CTA, buttons)
- SMS view (phone mockup with conversation bubble)

### Device viewport switching:
Desktop (max-w-[640px]), Tablet (max-w-[420px]), Mobile (max-w-[320px])

### Constituent cycling:
"Preview as" toolbar with dropdown selector. 28-constituent mock database. Custom merge field editing via expandable form. Prev/Next navigation arrows.

### Merge field resolution:
`resolveMergeFields(text, constituent)` — replaces `{{token}}` patterns with constituent data.
`resolveMergeFieldsWithHighlights()` — same but wraps missing fields in amber dashed underline `<span>`.

---

## 11. RecipientPanel

**Full constituent management with multi-source import.**

### Source categories:
- **Integrations:** Salesforce, Blackbaud (simulated connection + sync flows)
- **ThankView:** TV Lists (7), Saved Searches (5)
- **Direct:** Browse All (2,000 mock constituents), CSV Upload (wizard), Manual Add (form)

### Layout:
Left panel (420px) with source sidebar + content. Right panel is campaign constituent list.

### Virtual scrolling:
`@tanstack/react-virtual`, ROW_HEIGHT=44, overscan=15.

### Filtering:
Search by name, filter by group/status/video/classYear/city. Active filter count badge.

### Column configuration:
Configurable via settings popover. 9 available columns (Name, Email, Group, Status, Video, Phone, Class Year, City, Last Gift).

### Bulk actions:
Multi-select with checkbox column. Select all / deselect all. Bulk add / remove / assign video.

---

## 12. VideoBuilder

**Orchestrates video assembly from segments.**

### Video Elements (toggleable):
1. Intro — theme-based title card
2. Personalized Clip — webcam recording or library pick
3. Shared Video — common video for all recipients
4. Outro — closing card with CTA

### Element ordering:
Drag-reorderable via element order array.

### Sub-views:
`overview` → `intro-builder` / `personalized-recorder` / `shared-recording` / `outro-builder` / `library`

### Completion tracking:
`hasIntro`, `hasMain`, `hasOutro`, `hasOverlay` flags. `isVideoComplete` derived when all enabled elements are done.

---

## 13. IntroOutroBuilder

### Theme system:
9 intro themes with CSS gradients. Categories: Image Templates, Message Templates, Holiday Templates, Legacy.

### Customization:
- Intro text input
- Font selector: 7 Google Fonts as pills
- Color palette: 7 brand colors + hex picker
- Music: 4 moods (Uplifting, Calm, Corporate, Festive) × 2 tracks each = 8 total
- Custom thumbnail upload

### Layout:
Left sidebar (260px) with collapsible theme sections + thumbnails. Main area has video preview (16:9) with gradient background and configuration panel.

---

## 14. TagPicker

### Presets:
11 built-in tags: Thank You, Appeals/Solicitation, Video Request, Events, Updates, Birthdays, Anniversaries, Endowment Reports, Career Moves, Student Engagement, Other.

### TagManagerModal:
Full-screen modal with search, 3 sections (Presets, Recently Used, All Tags ~40), checkbox selection, "Create from search" when no match, custom tag creation footer, inline toasts.

---

## 15. Template System

### Template interface:
```typescript
interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  mode: "single" | "multi";
  goal: "send-video" | "send-without-video" | "request-video" | null;
  channel: "email" | "sms" | null;
  tags: string[];
  stepContent: TemplateStepContent;      // primary step
  multiSteps?: TemplateStepContent[];    // for multi-step flows
  createdAt: string;
  builtIn?: boolean;
}
```

### Built-in templates (5):
1. Thank You Video (single, email, send-video)
2. Event Invitation (single, email, send-without-video)
3. Student Video Request (single, email, request-video)
4. Birthday Greeting SMS (single, sms)
5. Annual Fund Appeal Sequence (multi, email, 7 steps: 2 emails → wait → condition → 2 branch emails → wait → final email)

### Context API:
`useTemplates()` → `{ templates, addTemplate, removeTemplate, updateTemplate }`

---

## 16. Design Library

### Context API:
`useDesignLibrary()` → `{ assets, logos, headers, footers, backgrounds, customEnvelopes, customLandingPages, loading, refresh }`

### Asset types:
`DesignAsset { id, name, url, type: "logo"|"header"|"footer"|"background" }`
`CustomEnvelope { id, name, color, textColor, thumbnail? }`
`CustomLandingPage { id, name, thumbnail? }`

---

## 17. Key Patterns & Conventions

### Dirty tracking
Most components accept `markDirty?: () => void` to bubble unsaved-change signals.

### Toast system
`useToast()` → `{ showToast(message, type) }` for success/error/info notifications.

### Accordion sections
`DrawerSection` component: `{ title, icon, iconColor?, open, onToggle, badge?, children }`. Used throughout StepDrawer for collapsible content groups.

### Animation
- Framer Motion (`motion/react`) for drawer width transitions and section expand/collapse
- `@dnd-kit` for drag-and-drop step reordering
- `AnimatePresence` for enter/exit animations on popovers and modals

### Accessibility
- `@mantine/core` `FocusTrap` for modal focus management
- All icon buttons have `aria-label` + `TvTooltip`
- Keyboard: Escape closes drawers/modals/popovers

### Character counting
`CHAR_LIMITS` object with per-field limits. `CharCount`, `SmsCharCounter`, `EmailBodyCharCounter` components. `getEditorWarnCls(count, limit)` returns warning/error border classes.

### ID generation
`makeId()` → `"s" + Math.random().toString(36).slice(2, 8)` — used for all new FlowStep IDs.

---

## Implementation Notes

When recreating this system:

1. **Start with types.ts** — define all interfaces and constants first
2. **Build the flow canvas** — FlowNode + Connector + AddStepButton + DnD
3. **Build the StepDrawer** — accordion-based editor with per-type sections
4. **Add the preview panel** — merge field resolution + device viewport switching
5. **Add RecipientPanel** — virtual scrolled constituent table with multi-source import
6. **Add ConfigureStepPanel** — metrics + tags + advanced settings
7. **Wire up contexts** — TemplateContext + DesignLibraryContext + ToastContext

The flow canvas is the centerpiece. Everything else composes around it.
