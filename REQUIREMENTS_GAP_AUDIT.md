# ThankView Requirements Gap Audit
**Date:** 2026-03-24
**Source:** "ThankView Rebuild Requirements (in progress)" Google Sheet by Kelley Johnson
**Scope:** All items where Kelley's Priority = "High" AND Erin's Edits column is NOT "Done"

---

## Summary

Out of ~55 High-priority items not yet marked "Done" by Erin, the audit found:

- **Already implemented in prototype (just not marked Done):** ~20 items
- **Genuine gaps needing prototype work:** ~18 items
- **N/A to Design (backend/migration):** ~12 items
- **Needs investigation:** ~5 items

---

## GAPS — High Priority Items Missing or Incomplete in Prototype

### Envelope Builder (12 items — biggest gap)

The Envelope Builder (`EnvelopeBuilder.tsx`) exists but the design review column shows "Fail" on nearly all items, and none are marked Done. Current state vs requirements:

| Requirement | Status |
|-------------|--------|
| Name envelope to save | Has name field but marked Fail |
| Outer envelope color via hex | PRESENT — color picker exists |
| Liner color via hex | PRESENT — liner color picker exists |
| Copy color via hex | PRESENT — text color picker exists |
| Front logo | PRESENT — logo upload area |
| Back flap logo | PRESENT — back logo area |
| Black/white/no postmark | MISSING — no postmark style selector |
| Postmark text (40 chars) | MISSING — no postmark text input |
| Stamp image | MISSING — no stamp image upload |
| Single Swoop design | MISSING — no front design pattern picker |
| Double Swoop design | MISSING — no front design pattern picker |
| Single/Double/Triple/Air Mail Stripe designs | MISSING — no front design pattern picker |
| Text BEFORE name (merge fields + emoji) | MISSING — no pre-text input |
| Text AFTER name (merge fields + emoji) | MISSING — no post-text input |

**What's needed:** A front design pattern picker (swoop/stripe options with color controls), postmark customization (style + text), stamp image upload, and pre/post name text fields.

---

### Landing Page Builder (3 items)

`LandingPageBuilder.tsx` exists but key customization marked Fail:

| Requirement | Status |
|-------------|--------|
| Header color via hex code | Needs verification — nav bar color exists but marked Fail |
| Add logo to landing page | Needs verification — logo section exists but marked Fail |
| Add background image | Needs verification — background picker exists but marked Fail |

**Assessment:** The builder likely has these features but they may not match the spec exactly. Needs re-review with Kelley to reconcile Fail status vs what's built.

---

### Video Intros in Campaign Builder (2 items)

| Requirement | Status |
|-------------|--------|
| Add intro to campaign videos | PRESENT in campaign builder (hasIntro toggle) but marked Fail |
| Top 9 intro themes recreated | PARTIAL — 7 themes found, need 9 |

**What's needed:** Add 2 more intro themes to match the top 9 most-used.

---

### Content Creation — Not Marked Done (7 items)

| Requirement | Priority | Design Review | Status in Prototype |
|-------------|----------|---------------|---------------------|
| Animated thumbnail option | High | Fail | PRESENT — DesignStepPanel has animated option |
| Sender email address | High | Needs Work | PRESENT — sender email field exists |
| Reply-to email address | High | Needs Work | PRESENT — reply-to field exists |
| Multiple reply-to addresses | High | Fail | PARTIAL — single field, type supports array |
| RTE merge field insertion | High | Needs Work | PRESENT — MergeFieldPicker component |
| Preview as specific recipient | High | Fail | PRESENT — LivePreviewPanel has recipient selector |
| Real-time preview updates | High | Needs Work | PRESENT — preview updates on edit |

**What's needed:** Multi-reply-to UI needs to support adding multiple email addresses (chip/tag input pattern).

---

### Personalized Video Task Assignment (2 items — fully missing)

| Requirement | Status |
|-------------|--------|
| Assign portal user to record personalized video for recipient(s) | MISSING |
| Unassign users from personalized video tasks | MISSING |

**What's needed:** A task assignment modal in the campaign recipient view where users can select recipients and assign a portal user to record their personalized clip. Note: Only 1% of portals use this feature.

---

### Personalized Video Search/Filter (1 item)

| Requirement | Status |
|-------------|--------|
| Search/filter through recipients when assigning personalized clips | Fail — needs verification |

**What's needed:** Verify that the recipient table in the personalized recorder flow has search and filter capabilities.

---

### Sending Campaigns (3 items — not marked Done)

| Requirement | Status |
|-------------|--------|
| Send test to self/others with recipient selection | PRESENT — test send exists |
| Send Now / Schedule Send | PRESENT — scheduling UI exists |
| Recipient send status tracking | PRESENT — status column in recipient table |

**Assessment:** These appear implemented but not marked Done. May need Kelley review.

---

## Items Marked "N/A to Design" (No Prototype Work Needed)

These are backend/migration concerns, not prototype gaps:

- Legacy envelopes continue to work on old campaigns
- Legacy landing pages continue to work on old campaigns
- Previously created branded envelopes visible in new app
- Previously created landing pages visible in new app
- Legacy intros/outros READ ONLY in new app
- Legacy overlays visible on old videos
- Closed caption download on landing pages
- Caption toggle on video player
- RTE emoji support (backend)

---

## SETTINGS TAB — Gaps Not Marked Done

Most Settings items ARE marked Done. Remaining unmarked items:

| Theme | Requirement | Priority | Status |
|-------|-------------|----------|--------|
| General Portal Settings | Add org logo (default for landing pages) | High | PRESENT but not marked Done |
| Campaign Settings | Default outro selection | High | Fail/Done — contradicts |
| Notification Settings | All 8 notification preference rows | Med-High | Not marked in Erin's column |

**Notification Settings:** The Settings page has a Notifications tab but the individual toggle preferences (in-app campaign notifications, 1:1 video emails, reply emails, automated reports, SFTP import, SSO requests, weekly task report, task progress report, recorder assignment) need to be verified as individually present.

---

## Priority Action Items

### Must Fix (High priority, genuinely missing):
1. **Envelope Builder front design patterns** — Add swoop/stripe design picker with color controls
2. **Envelope Builder postmark** — Add postmark style (black/white/none) + text input
3. **Envelope Builder stamp** — Add stamp image upload
4. **Envelope pre/post name text** — Add text fields with merge field + emoji support
5. **Multi-reply-to email** — Convert single reply-to input to multi-email chip input
6. **Intro themes** — Add 2 more themes to reach top 9

### Should Investigate (marked Fail but may actually be present):
7. **Landing Page Builder** — Header color, logo, background image all appear built but marked Fail
8. **Animated thumbnail** — Appears present in DesignStepPanel but marked Fail
9. **Preview as specific recipient** — Appears present but marked Fail
10. **Campaign status/type filters** — Appear present but marked Fail

### Low Priority (very low usage):
11. **Task assignment for personalized videos** — Only 1% of portals use this
12. **Notification preferences** — Need individual toggles verified
