# ThankView Prototype vs. Requirements Audit

**Date:** 2026-03-23 (Updated 2026-03-23 — post-code-verification pass)
**Auditor:** Claude (with Erin)
**Source:** ThankView Rebuild Requirements (in progress) Google Sheet
**Scope:** All requirements tabs audited against current prototype codebase

---

## How to Read This Audit

- **✅ Met** — Requirement is implemented in the prototype codebase
- **⚠️ Partially Met** — Some aspects present but incomplete
- **❌ Not Met** — Requirement missing from the prototype
- **🔶 Deferred** — Intentionally deferred per Erin's decision

> **Note:** This audit was corrected after a full code-level verification pass. The initial screenshot-based audit over-reported gaps. Many features marked as missing were in fact already implemented.

---

## 1. Requirements: Settings

### General Portal Settings

| Status | Requirement | Notes |
|--------|------------|-------|
| ✅ | Admins can view the slug for their org | `Settings.tsx` General tab, line 443 — read-only slug display with "Contact support to update" text |
| ✅ | Admins can view & change Internal Name | `Settings.tsx` General tab, line 436 — editable org name with description |
| ✅ | Admins can view their custom URL | `Settings.tsx` General tab, line 449 — editable with "URL recipients visit when clicking your logo" helper |
| ✅ | Admins can add a logo for their organization | `Settings.tsx` General tab, line 458 — upload/replace with preview |
| ✅ | Admins can enable/disable SSO | `Settings.tsx` General tab, line 495 — full Microsoft SSO toggle with help link |

### Bulk Email & SMS Settings

| Status | Requirement | Notes |
|--------|------------|-------|
| ✅ | DNS Setup — custom domains with verification | `Settings.tsx` DNS Setup tab, line 626 — full domain management with add/verify/remove/set-default |
| ✅ | Per-user sending domain assignment | `Settings.tsx` Manage Users tab, line 1480 — modal with domain picker per user |
| ✅ | Default domain selection | `Settings.tsx` DNS Setup tab, line 659 — `handleSetDefault` with star badge |
| ✅ | "Contact support" CTA for DNS/SMS | `Settings.tsx` Email & SMS tab, line 568 and 593 — support contact text |
| ✅ | SMS area code visibility | `Settings.tsx` Email & SMS tab, line 588 — shows "+1 (617) Boston, MA" |

### Portal Campaign Settings (Default Assets)

| Status | Requirement | Notes |
|--------|------------|-------|
| ❌ | Default font for external messaging | Not in VideoTab — needs "Campaign Defaults" section |
| ❌ | Default envelope for external messaging | Not in VideoTab — needs envelope picker |
| ❌ | Default landing page for portal | Not in VideoTab — needs LP picker |
| ❌ | Default intro for videos | Not in VideoTab — needs intro picker |
| ✅ | Default outro for videos | `Settings.tsx` VideoTab, line 1770 — full outro selector with upload |
| ❌ | Hidden contact fields during recording | Not in VideoTab — needs field checklist |

### Caption Settings

| Status | Requirement | Notes |
|--------|------------|-------|
| ✅ | Human caption credits balance display | `Settings.tsx` VideoTab, line 1917 — credit balance card with $32.50 |
| ✅ | Auto-renew at $50 when balance below $0 | `Settings.tsx` VideoTab, line 1932 — auto-renew toggle with description |
| ✅ | AI captioning portal-level toggle | `Settings.tsx` VideoTab, line 1886 — AI closed captioning toggle |

### Subscription Details

| Status | Requirement | Notes |
|--------|------------|-------|
| ✅ | View subscription details | `Settings.tsx` SubscriptionTab, line 2260 — plan info, usage, storage |
| ✅ | Update Credit Card on file | `Settings.tsx` SubscriptionTab, line 2298 — Stripe-style card form in modal |

### User Level Notification Settings

| Status | Requirement | Notes |
|--------|------------|-------|
| ✅ | In-app notification toggles (5 types) | `Settings.tsx` NotificationsTab, line 1602 — campaign sent, reply received, video processed, weekly digest, delivery failure |
| ✅ | Email notification toggles (8 types) | `Settings.tsx` NotificationsTab, line 1610 — forwarding, complete, export, team invite, digest, failure, billing, new contact |
| ❌ | "Assigned as recorder" notification | Not in ITEMS or EMAIL_ITEMS arrays |
| ❌ | "SSO access request" notification | Not in ITEMS or EMAIL_ITEMS arrays |
| ❌ | 1:1 video notification frequency (daily/weekly) | No frequency selector in NotificationsTab |

---

## 2. Requirements: Campaigns

### Campaign Types & Configurations

| Status | Requirement | Notes |
|--------|------------|-------|
| ✅ | Birthday/Anniversary automated campaigns | `MultiStepBuilder.tsx` — AutomationConfigPanel with date field picker, days-before, recur annually, leap year handling |
| ✅ | Video Request — Shareable Link delivery | `MultiStepBuilder.tsx` line 824 — `vrDeliveryType: "link"` option |
| ✅ | Video Request — Reminders with due dates | `MultiStepBuilder.tsx` line 925 — reminder day chips [14,7,5,3,2,1] |
| ✅ | Video Request — Enable/Disable submissions | `MultiStepBuilder.tsx` line 964 — `vrSubmissionsEnabled` toggle |
| ❌ | Video Request — Standalone campaign page | VR features only exist in multi-step drawer, no dedicated `/campaigns/video-request` page |
| 🔶 | Task assignment system | **Deferred** — complex feature, flagged for future |

### Campaign Filtering

| Status | Requirement | Notes |
|--------|------------|-------|
| ✅ | Filter campaigns by status | `CampaignsList.tsx` line 188 — status filter chips (Sent/Scheduled/Draft/Paused/Archived) |
| ✅ | Filter campaigns by channel/type | `CampaignsList.tsx` line 198 — channel filter chips (Email/SMS) |

### Content Creation

| Status | Requirement | Notes |
|--------|------------|-------|
| ✅ | Envelope as email thumbnail | `MultiStepBuilder.tsx` line 1305 — `thumbnailType: "envelope"` option |
| ✅ | Animated thumbnail option | `MultiStepBuilder.tsx` line 1305 — `thumbnailType: "animated"` option |
| ✅ | Envelope text before/after name | `DesignStepPanel.tsx` line 828 — envTextBefore/After inputs with 40-char limit |
| ✅ | Multiple reply-to email addresses | `MultiStepBuilder.tsx` line 1115 — tag input with `replyToList` array |
| ✅ | Merge field validation (remove/fallback/skip) | `ConfirmSend.tsx` line 107 — MergeFieldWarning with 3 action buttons |
| ✅ | Preview as specific recipient | `LivePreviewPanel.tsx` line 652 — "Preview as" constituent picker with 28 mock contacts |

### Envelope Builder

| Status | Requirement | Notes |
|--------|------------|-------|
| ⚠️ | Envelope builder configuration | `EnvelopeBuilderModal.tsx` exists but is a lighter modal — detailed envelope customization happens inline in `DesignStepPanel.tsx`. The full standalone envelope builder with hex inputs for all colors, postmark text, stamp upload, and 6 front designs needs verification of completeness |

### Landing Page Builder

| Status | Requirement | Notes |
|--------|------------|-------|
| ✅ | Name/title field | `LandingPageBuilderModal.tsx` line 46 — `lpTitle` input |
| ⚠️ | Hex color input | `LandingPageBuilderModal.tsx` line 49 — has ColorSwatchPicker but not raw hex text input field |
| ⚠️ | Gradient toggle for background images | Needs verification |

### Video Intros & Outros

| Status | Requirement | Notes |
|--------|------------|-------|
| ⚠️ | 9 specific intro themes | `IntroOutroBuilder.tsx` line 27 — has 9 themes but named "Welcome", "Thank You", "Hello" etc., not the required names (Logo, Full Frame, Tryptic, Light Leak, Cubed, Clean, Linen, Emboss, Balloons) |
| ✅ | Save outro as template | `IntroOutroBuilder.tsx` line 555 — "Save as reusable template" checkbox |

---

## 3. Requirements: Video Creation & Managing

| Status | Requirement | Notes |
|--------|------------|-------|
| ✅ | Resolution selection (480/720/1080) | `Settings.tsx` VideoTab, line 1695 — resolution picker; `RecordingStudio.tsx` has resolution setting |
| ✅ | Cancel recording → stop or start over | `RecordingStudio.tsx` line 300/347 — "Stop & Save" and "Start Over" buttons |
| ✅ | Revert trimmed video | `VideoEditorView.tsx` line 346 — "Revert to Original" button |

---

## 4. Requirements: Contact Creation & Managing

| Status | Requirement | Notes |
|--------|------------|-------|
| ✅ | Contact profiles are full pages | `/contacts/:id` route exists as a full page (not drawer) |
| 🔶 | Lists page rebuild | **Deferred** — needs complete rebuild to match Signal experience |
| 🔶 | Contact deliverability filters | **Deferred** — part of contacts page improvements, Erin said profiles are "good enough" |

---

## 5. Requirements: Metrics

| Status | Requirement | Notes |
|--------|------------|-------|
| 🔶 | All metrics gaps | **Deferred** — the analytics page needs a bigger design pass. Endowment metrics and 1:1 video metrics are missing but deferred per Erin's decision |

---

## 6. Additional Design Feedback (2/25 Review)

| Status | Requirement | Notes |
|--------|------------|-------|
| ✅ | Contact profiles as full pages | `/contacts/:id` page exists |
| ⚠️ | Mobile experience | Responsive breakpoints exist but no dedicated mobile pass |
| ⚠️ | Video editing layout | Complex layout may still feel cramped |
| ⚠️ | Metrics filters per-tab | Needs contextual filter behavior |

---

## 7. Moving Historic Campaigns & Assets

| Status | Requirement | Notes |
|--------|------------|-------|
| 🔶 | All historic asset migration | **Deferred** — skip for now per Erin's decision |

---

## Summary: Remaining Work Items

### ❌ Still Missing (To Be Implemented)

1. **Campaign Defaults section** in Settings Video & Recording tab — default font, envelope, landing page, intro, hidden recording fields
2. **Notification types** — "Assigned as recorder" and "SSO access request" toggles
3. **Notification frequency** — daily/weekly selector for 1:1 video notifications
4. **Intro theme renaming** — rename 9 themes to match requirements (Logo, Full Frame, Tryptic, Light Leak, Cubed, Clean, Linen, Emboss, Balloons) with distinct visual characteristics
5. **LP Builder hex text input** — add raw hex string input alongside color swatch picker
6. **Standalone Video Request campaign page** — dedicated page at `/campaigns/video-request/new`

### 🔶 Intentionally Deferred

| Item | Rationale |
|------|-----------|
| Lists page rebuild | Per Erin — flagged but not building now |
| Metrics/Analytics | Per Erin — needs bigger design pass |
| Task assignment system | Per Erin — complex feature, defer |
| Historic asset migration | Per Erin — data concern, defer |
| Contact profile enhancements | Per Erin — already good enough |

### ✅ Previously Flagged as Missing — Actually Implemented

The following items were incorrectly flagged in the initial audit and have been verified as existing in the codebase:

- Slug field, Org URL, SSO toggle, Logo upload
- DNS domain management with per-user assignment and default selection
- Support contact CTAs in DNS/SMS
- SMS area code display
- Caption credit balance + auto-renew toggle
- Credit card update (Stripe-style modal)
- Campaign list status/channel filtering
- Envelope/animated thumbnail options
- Envelope text before/after name
- Multiple reply-to addresses (tag input)
- Merge field validation with remove/fallback/skip actions
- Preview as specific recipient
- Video Request shareable link, reminders, submissions toggle
- Birthday/Anniversary automation with full config panel
- Recording resolution picker, cancel/restart flow, revert trim
- Save outro as template
