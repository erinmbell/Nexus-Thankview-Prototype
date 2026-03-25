# Campaign Requirements — Fix Prompts for Claude Code

Copy-paste each prompt into Claude Code to fix one requirement at a time.
After each fix, update the status in `RequirementsAudit.tsx` CAMPAIGNS_REQUIREMENTS from `"partial"` or `"missing"` to `"done"`.

---

## PARTIAL Items (built but design review failed — needs refinement)

### P1. Share - Facebook (#3)
> In the ThankView prototype, the Facebook share feature exists but the design review marked it "Fail." Check `CampaignDetail.tsx` and `FacebookShareModal.tsx` — ensure there is a clear "Share on Facebook" button on the campaign detail page, and that the share modal includes an OG image preview, share URL, and a working "Copy Link" action. The share should also be accessible from the landing page preview. After fixing, update `RequirementsAudit.tsx` CAMPAIGNS_REQUIREMENTS id 3 status from "partial" to "done".

### P2. Birthday automated sends (#12)
> In `CreateCampaign.tsx`, the birthday/anniversary automated scheduling exists (contact-field schedule type) but design review says "Fail." Verify that: (1) users can select "Birthday" or "Anniversary" from a contact date field dropdown, (2) there's a clear "days before/after" offset input, (3) the UI clearly communicates "Send on each contact's birthday" rather than a fixed date. Ensure the scheduling section visually distinguishes this mode from standard scheduling. After fixing, update CAMPAIGNS_REQUIREMENTS id 12 status to "done".

### P3. Anniversary automated sends (#13)
> Same as P2 above — ensure "Anniversary" is a selectable date field option in the automated scheduling flow in `CreateCampaign.tsx`. Verify it's listed alongside Birthday in the contact date field picker. After fixing, update CAMPAIGNS_REQUIREMENTS id 13 status to "done".

### P4. Birthday/Anniversary error handling (#14)
> In `CreateCampaign.tsx`, ensure the birthday/anniversary scheduling flow handles edge cases: (1) show a warning when a contact is missing the selected date field, (2) handle Feb 29 birthdays with an option to send on Feb 28 or Mar 1 in non-leap years, (3) warn when dates are in invalid format. Check around the `contactDateField` state and scheduling section. After fixing, update CAMPAIGNS_REQUIREMENTS id 14 status to "done".

### P5. Video Request — Shareable Link (#17)
> In `VideoRequestCampaign.tsx`, the shareable link delivery option exists but design review says "Fail." Verify that: (1) when "Shareable Link" is selected as delivery type, a URL is generated and shown with a prominent "Copy Link" button, (2) the link is visually displayed in a copiable text field, (3) there's clear messaging that this link can be shared anywhere. After fixing, update CAMPAIGNS_REQUIREMENTS id 17 status to "done".

### P6. Video Request — Add Recorders (#18)
> In `VideoRequestCampaign.tsx`, the "Add Recorders" functionality exists but design review says "Fail." Verify that: (1) users can add recorders via a constituent picker, (2) the recorder list shows name, email, and status, (3) there's a way to remove recorders. The "Recorders" tab should function identically to adding recipients. After fixing, update CAMPAIGNS_REQUIREMENTS id 18 status to "done".

### P7. Video Request — Automated Reminders (#19)
> In `VideoRequestCampaign.tsx`, the reminder scheduling exists but design review says "Fail." Verify that: (1) there's a due date picker, (2) users can configure multiple reminders at different intervals (1, 2, 3, 5, 7, 14 days before due), (3) the reminder toggle shows count of active reminders, (4) there's a clear indication of which reminders are active. After fixing, update CAMPAIGNS_REQUIREMENTS id 19 status to "done".

### P8. Video Request — Branded Landing Page (#20)
> In `VideoRequestCampaign.tsx`, the branded landing page selection is missing from the UI. Add a landing page picker in the Setup tab where users can select from their saved landing page designs (similar to how it works in `CreateCampaign.tsx`'s DesignStepPanel). Show a preview of the selected landing page. After fixing, update CAMPAIGNS_REQUIREMENTS id 20 status to "done".

### P9. Video Request — Enable/Disable Submissions (#23)
> In `VideoRequestCampaign.tsx`, the "Accept Submissions" toggle exists but design review says "Fail." Verify the toggle is clearly labeled, shows open/closed status, and is in a logical location in the Setup tab. After fixing, update CAMPAIGNS_REQUIREMENTS id 23 status to "done".

### P10. Campaign Data (#26)
> In `CampaignDetail.tsx`, verify the campaign detail page shows ALL of these metrics: (1) # of personalized videos added, (2) # of messages sent, (3) open rate, (4) # of replies received, (5) spam report rate, (6) bounce rate. The design review says "Needs Work" — check that all 6 metrics are present and clearly displayed. After fixing, update CAMPAIGNS_REQUIREMENTS id 26 status to "done".

### P11. Filter by status (#28)
> In `CampaignsList.tsx`, verify the campaigns list has a working status filter with options like: All, Draft, Scheduled, Sending, Sent, Paused, Completed. The design review says "Fail" — ensure the filter pill shows the active selection and that clicking a status actually filters the list. After fixing, update CAMPAIGNS_REQUIREMENTS id 28 status to "done".

### P12. Filter by type (#29)
> In `CampaignsList.tsx`, verify there's a campaign type filter. This should let users filter by: Single Step, Multi-Step, Video Request, Endowment Report. Design review says "Fail." After fixing, update CAMPAIGNS_REQUIREMENTS id 29 status to "done".

### P13. Filter by delivery method (#30)
> In `CampaignsList.tsx`, verify there's a delivery method/channel filter with options: Email, SMS, Email + SMS, Shareable Link. Design review says "Needs Work." After fixing, update CAMPAIGNS_REQUIREMENTS id 30 status to "done".

### P14. Change campaign status (#32)
> In `CampaignsList.tsx`, verify users can change a campaign's status (Draft → Active → Paused → Completed etc.) via a menu action or modal. The `StatusChangeModal.tsx` component exists — ensure it's accessible from the campaign row's action menu. Design review says "Needs Work." After fixing, update CAMPAIGNS_REQUIREMENTS id 32 status to "done".

### P15. Duplicate multi-step campaign (#39)
> In `CampaignsList.tsx`, when duplicating a multi-step campaign, verify the duplication copies: all steps, step templates, automation settings, wait times, and conditions. The DuplicateModal should handle multi-step campaigns differently from single-step ones. Design review says "Fail." After fixing, update CAMPAIGNS_REQUIREMENTS id 39 status to "done".

### P16. Duplicate — include success metric option (#42)
> In `CampaignsList.tsx` DuplicateModal, verify there's a checkbox/toggle option to "Include success metrics" when duplicating a campaign. Design review says "Needs Work." After fixing, update CAMPAIGNS_REQUIREMENTS id 42 status to "done".

### P17. Remove contacts from campaign (#47)
> In the campaign builder recipient panel (`RecipientPanel.tsx`), verify users can select and remove individual contacts from the campaign's recipient list. There should be a delete/remove action per recipient row. Design review says "Needs Work." After fixing, update CAMPAIGNS_REQUIREMENTS id 47 status to "done".

### P18. Upload CSV to campaign (#48)
> In the campaign builder recipient panel (`RecipientPanel.tsx` and `RecipientSourcePicker.tsx`), verify the CSV upload option for adding recipients works: file picker, column mapping, error handling, and import confirmation. Design review says "Needs Work." After fixing, update CAMPAIGNS_REQUIREMENTS id 48 status to "done".

### P19. Add recipients manually (#49)
> In the campaign builder, verify users can add a recipient manually via an in-app form (name, email, phone, etc.) through `RecipientSourcePicker.tsx`. Design review says "Needs Work." After fixing, update CAMPAIGNS_REQUIREMENTS id 49 status to "done".

### P20. Add from Contacts (#50)
> In the campaign builder, verify users can browse and select contacts from their contact list to add as recipients via `RecipientSourcePicker.tsx`. Design review says "Needs Work." After fixing, update CAMPAIGNS_REQUIREMENTS id 50 status to "done".

### P21. Add from Lists (#51)
> In the campaign builder, verify users can select a contact list to add all its members as campaign recipients via `RecipientSourcePicker.tsx`. Design review says "Needs Work." After fixing, update CAMPAIGNS_REQUIREMENTS id 51 status to "done".

### P22. Recipient table in campaign (#55)
> In the campaign builder, verify that after adding recipients, users can see a table showing all recipients with columns like name, email, status. Design review says "Needs Work." After fixing, update CAMPAIGNS_REQUIREMENTS id 55 status to "done".

### P23. Include envelope in campaign (#58)
> In `DesignStepPanel.tsx`, verify "Envelope" is a selectable content display type alongside static thumbnail and animated thumbnail. When selected, users should see their envelope library and be able to pick one. Design review says "Fail." After fixing, update CAMPAIGNS_REQUIREMENTS id 58 status to "done".

### P24. Video outro in campaign (#107)
> In the campaign builder, verify users can add an outro that applies to all videos in the campaign. Check `CreateCampaign.tsx` and `IntroOutroBuilder.tsx` — the outro selection should be accessible and show the user's outro library. Design review says "Fail." After fixing, update CAMPAIGNS_REQUIREMENTS id 107 status to "done".

### P25. Save outro as template (#109)
> In `IntrosAndOutros.tsx` and the outro creation flow, verify users can save a customized outro as a reusable template. There should be a "Save as Template" option during outro creation or editing. Design review says "Fail." After fixing, update CAMPAIGNS_REQUIREMENTS id 109 status to "done".

### P26. Landing Page Builder — name to save (#126)
> In `LandingPageBuilder.tsx`, verify there's a name input field that users must fill in to save their landing page. Design review says "Fail." After fixing, update CAMPAIGNS_REQUIREMENTS id 126 status to "done".

---

## MISSING Items (not yet built — need implementation)

### M1. Animated thumbnail (#59)
> In `DesignStepPanel.tsx`, the animated thumbnail option exists in EMAIL_DISPLAY_OPTIONS but design review says "Fail" and Erin's Edits column is empty. Verify the animated thumbnail option works when selected: it should show sub-options for GIF vs Illustration animation style. If the option is present but not marked done, just update CAMPAIGNS_REQUIREMENTS id 59 status to "done". If it's actually broken, fix it.

### M2. Envelope pre-text (#65)
> In the envelope display within the campaign builder (either `DesignStepPanel.tsx` or `EnvelopeBuilder.tsx`), add a text input field for "Text before name" that: (1) allows up to 200 characters, (2) supports merge field insertion via MergeFieldPicker, (3) has a toggle for "same line as name" vs "line above name." This text appears before the recipient's name on the envelope front. After implementing, update CAMPAIGNS_REQUIREMENTS id 65 status to "done".

### M3. Envelope post-text (#66)
> Same as M2 but for text AFTER the name. Add a "Text after name" input field with merge field support and same-line/new-line toggle. After implementing, update CAMPAIGNS_REQUIREMENTS id 66 status to "done".

### M4. Email subject emoji support (#67)
> In `CreateCampaign.tsx`, verify the email subject line TextInput supports emoji input. If not, add an emoji picker button next to the subject line field (similar to the approach in `RichTextEditor.tsx`). After fixing, update CAMPAIGNS_REQUIREMENTS id 67 status to "done".

### M5. Email subject merge fields (#68)
> In `CreateCampaign.tsx`, verify the email subject line supports merge field insertion. If not, add a merge field picker button next to the subject line that inserts `{{field_name}}` tokens. This feature likely already exists — check and mark done if so. After fixing, update CAMPAIGNS_REQUIREMENTS id 68 status to "done".

### M6. Sender Name field (#69)
> In `CreateCampaign.tsx`, verify there's a "Sender Name" / "From Name" TextInput in the email configuration section. This lets users specify who the email appears to come from. If present, mark done. After fixing, update CAMPAIGNS_REQUIREMENTS id 69 status to "done".

### M7. Sender Email field (#70)
> In `CreateCampaign.tsx`, verify there's a "Sender Email" / "From Address" field that lets users pick from their verified sending domains. If present, mark done. After fixing, update CAMPAIGNS_REQUIREMENTS id 70 status to "done".

### M8. Reply-to Email (#71)
> In `CreateCampaign.tsx`, verify there's a "Reply-To" email address field. If present, mark done. After fixing, update CAMPAIGNS_REQUIREMENTS id 71 status to "done".

### M9. Multiple reply-to emails (#72)
> In `CreateCampaign.tsx`, the reply-to field should support multiple email addresses (12% of campaigns use this). Convert the single reply-to TextInput into a multi-email chip/tag input that allows adding multiple addresses. After implementing, update CAMPAIGNS_REQUIREMENTS id 72 status to "done".

### M10. Font selection (#73)
> In `CreateCampaign.tsx`, verify there's a font family selector for the campaign's email/landing page content. If present (likely in the design step), mark done. After fixing, update CAMPAIGNS_REQUIREMENTS id 73 status to "done".

### M11. Rich text editor features (#74)
> In `RichTextEditor.tsx`, verify the editor supports: bold, italics, underline, links, text alignment, bullets, numbered lists, indentation, email template insertion, signature insertion, and image insertion. Design review says "Needs Work" — identify and fix any missing features. After fixing, update CAMPAIGNS_REQUIREMENTS id 74 status to "done".

### M12. RTE merge field insertion (#76)
> In `RichTextEditor.tsx`, verify merge field insertion works: there should be a toolbar button that opens `MergeFieldPicker.tsx` and inserts a merge field token at the cursor position. If present, mark done. After fixing, update CAMPAIGNS_REQUIREMENTS id 76 status to "done".

### M13. Merge field missing data warning (#77)
> In the campaign send flow (`ConfirmSend.tsx` or `CreateCampaign.tsx`), verify the merge field validation system works: (1) detects when a contact is missing data for a used merge field, (2) shows a warning with resolution options: remove field, set fallback text, or skip affected contacts. The `MergeFieldValidation.tsx` component handles this. If present, mark done. After fixing, update CAMPAIGNS_REQUIREMENTS id 77 status to "done".

### M14. AI writing assistant (#78)
> In the campaign content creation area, verify the AI writing assistant exists and includes: (1) a text prompt input, (2) a "stop" button during generation, (3) a "try again" button, (4) an error state. Check `AIWritingPopover.tsx`. If present, mark done. After fixing, update CAMPAIGNS_REQUIREMENTS id 78 status to "done".

### M15. Button colors via hex (#80)
> In the campaign design step, verify users can specify CTA button text color and background color via hex code inputs. Check `CtaButtonControls.tsx` or the design step. If present, mark done. After fixing, update CAMPAIGNS_REQUIREMENTS id 80 status to "done".

### M16. Landing page selection in campaign (#81)
> In the campaign design step, verify users can select a landing page from their library. Check `DesignStepPanel.tsx` for a landing page picker. If present, mark done. After fixing, update CAMPAIGNS_REQUIREMENTS id 81 status to "done".

### M17. Landing page — no attachment option (#83)
> In the campaign landing page configuration, verify users can choose "None" for the landing page module/attachment (no CTA, no PDF, no form). If present, mark done. After fixing, update CAMPAIGNS_REQUIREMENTS id 83 status to "done".

### M18. Landing page — CTA button (#84)
> In the campaign landing page config, verify users can add a CTA button with custom text and URL. If present, mark done. After fixing, update CAMPAIGNS_REQUIREMENTS id 84 status to "done".

### M19. Landing page — disable video replies (#89)
> In the campaign landing page settings, verify there's a toggle to disable video replies from recipients. If present, mark done. After fixing, update CAMPAIGNS_REQUIREMENTS id 89 status to "done".

### M20. Landing page — disable video download (#90)
> In the campaign landing page settings, verify there's a toggle to disable video downloads. If present, mark done. After fixing, update CAMPAIGNS_REQUIREMENTS id 90 status to "done".

### M21. Landing page — disable sharing (#91)
> In the campaign landing page settings, verify there's a toggle to disable sharing. If present, mark done. After fixing, update CAMPAIGNS_REQUIREMENTS id 91 status to "done".

### M22. Real-time preview updates (#97)
> In the campaign builder, verify that the email/SMS/landing page preview updates in real-time as users edit content. Check `LivePreviewPanel.tsx` and `FloatingPreview.tsx`. If the preview reactively reflects changes, mark done. After fixing, update CAMPAIGNS_REQUIREMENTS id 97 status to "done".

### M23. Preview as specific recipient (#100)
> In the campaign builder preview panel (`LivePreviewPanel.tsx`), verify users can select a specific campaign recipient to preview with their merge fields filled in and personalized video shown. If present, mark done. After fixing, update CAMPAIGNS_REQUIREMENTS id 100 status to "done".

### M24. Add intro to campaign videos (#101)
> In the campaign builder, verify users can add an intro to all campaign videos. Check for an intro selection step or toggle in `CreateCampaign.tsx`. If present, mark done. After fixing, update CAMPAIGNS_REQUIREMENTS id 101 status to "done".

### M25. Top 9 intro themes (#102)
> In `IntrosAndOutros.tsx` or `IntroLibrary.tsx`, verify at least 9 intro themes are available (Logo Reveal, Full Frame, Tryptic, Light Leak, Clean Minimal, Holiday, Celebration + 2 more). If only 7 exist, add 2 more themes. After fixing, update CAMPAIGNS_REQUIREMENTS id 102 status to "done".

### M26. Same video to all recipients (#112)
> In the campaign video step, verify there's a clear path for users to select one shared video that goes to all recipients (not personalized). Check the video builder in `CreateCampaign.tsx`. If present, mark done. After fixing, update CAMPAIGNS_REQUIREMENTS id 112 status to "done".

### M27. Personalized video per recipient (#113)
> In the campaign video step, verify users can tie a specific personalized video clip to individual recipients. Check `PersonalizedRecorder.tsx` and the video builder. If present, mark done. After fixing, update CAMPAIGNS_REQUIREMENTS id 113 status to "done".

### M28. Search/filter recipients for video assignment (#114)
> In the personalized video recording flow, verify users can search and filter through campaign recipients when deciding who gets which video clip. If present, mark done. After fixing, update CAMPAIGNS_REQUIREMENTS id 114 status to "done".

### M29. Swap personalized video (#115)
> In the personalized recording flow, verify users can edit or swap a previously assigned personalized video clip for a recipient. If present, mark done. After fixing, update CAMPAIGNS_REQUIREMENTS id 115 status to "done".

### M30. Additional shared video clip (#116)
> In the campaign video step, verify users can add an additional shared video clip that's included in every recipient's final video alongside any personalized clip. If present, mark done. After fixing, update CAMPAIGNS_REQUIREMENTS id 116 status to "done".

### M31. Send test campaign (#117)
> In the campaign builder, verify users can send a test version of the campaign to themselves or others, with the ability to select which recipient's data is used for the test. Check `ConfirmSend.tsx`. If present, mark done. After fixing, update CAMPAIGNS_REQUIREMENTS id 117 status to "done".

### M32. Landing page link (#118)
> In the campaign builder, verify users can get a direct link to the campaign's landing page for preview purposes. If present, mark done. After fixing, update CAMPAIGNS_REQUIREMENTS id 118 status to "done".

### M33. Send now / Schedule send (#120)
> In `ConfirmSend.tsx`, verify users can either "Send Now" or "Schedule Send" for a future date/time. If present, mark done. After fixing, update CAMPAIGNS_REQUIREMENTS id 120 status to "done".

### M34. Recipient send status (#121)
> In the campaign detail or recipient table, verify each recipient shows their send status: N/A, Video Added, Send Scheduled, Sending, Failed, Delivered. If present, mark done. After fixing, update CAMPAIGNS_REQUIREMENTS id 121 status to "done".

### M35. Landing Page Builder — header color (#127)
> In `LandingPageBuilder.tsx`, verify users can set the header/nav bar color via a hex code color picker. The nav bar color picker likely exists — check and ensure it uses a hex input. If present, mark done. After fixing, update CAMPAIGNS_REQUIREMENTS id 127 status to "done".

### M36. Landing Page Builder — logo (#128)
> In `LandingPageBuilder.tsx`, verify users can add a logo to their landing page via image upload. If present, mark done. After fixing, update CAMPAIGNS_REQUIREMENTS id 128 status to "done".

### M37. Landing Page Builder — background image (#129)
> In `LandingPageBuilder.tsx`, verify users can add a background image to their landing page. If present, mark done. After fixing, update CAMPAIGNS_REQUIREMENTS id 129 status to "done".

### M38. Envelope Builder — name field (#133)
> In `EnvelopeBuilder.tsx`, verify there's a required name TextInput to save the envelope. If present, mark done. If missing, add a name field at the top of the builder. After fixing, update CAMPAIGNS_REQUIREMENTS id 133 status to "done".

### M39. Envelope Builder — outer color (#134)
> In `EnvelopeBuilder.tsx`, verify users can set the outer envelope color via hex code color picker. If present, mark done. After fixing, update CAMPAIGNS_REQUIREMENTS id 134 status to "done".

### M40. Envelope Builder — liner color (#135)
> In `EnvelopeBuilder.tsx`, verify users can set the envelope liner color via hex code. If present, mark done. After fixing, update CAMPAIGNS_REQUIREMENTS id 135 status to "done".

### M41. Envelope Builder — copy color (#136)
> In `EnvelopeBuilder.tsx`, verify users can set the text/copy color on the envelope via hex code. If present, mark done. After fixing, update CAMPAIGNS_REQUIREMENTS id 136 status to "done".

### M42. Envelope Builder — front logo (#137)
> In `EnvelopeBuilder.tsx`, verify users can add a logo to the top-left of the envelope front. If present, mark done. After fixing, update CAMPAIGNS_REQUIREMENTS id 137 status to "done".

### M43. Envelope Builder — back flap logo (#138)
> In `EnvelopeBuilder.tsx`, verify users can add a logo to the outer back flap. If present, mark done. After fixing, update CAMPAIGNS_REQUIREMENTS id 138 status to "done".

### M44. Envelope Builder — postmark style (#139)
> In `EnvelopeBuilder.tsx`, add a postmark style selector with 3 options: Black postmark, White postmark, No postmark. Use a segmented control or radio group. After implementing, update CAMPAIGNS_REQUIREMENTS id 139 status to "done".

### M45. Envelope Builder — postmark text (#140)
> In `EnvelopeBuilder.tsx`, add a TextInput for postmark text, limited to 40 characters, with a character counter. This text appears in the postmark area. After implementing, update CAMPAIGNS_REQUIREMENTS id 140 status to "done".

### M46. Envelope Builder — stamp image (#141)
> In `EnvelopeBuilder.tsx`, add a stamp image upload area where users can upload a custom image for the envelope stamp. Include a preview of the stamp. After implementing, update CAMPAIGNS_REQUIREMENTS id 141 status to "done".

### M47. Envelope Builder — Single Swoop design (#142)
> In `EnvelopeBuilder.tsx`, add a "Front Design" section with pattern options. Include "Single Swoop" as an option with a color picker for the swoop color. Show a visual preview of the pattern on the envelope. After implementing, update CAMPAIGNS_REQUIREMENTS id 142 status to "done".

### M48. Envelope Builder — Double Swoop design (#143)
> In `EnvelopeBuilder.tsx`, add "Double Swoop" as a front design option with two color pickers (one per swoop). After implementing, update CAMPAIGNS_REQUIREMENTS id 143 status to "done".

### M49. Envelope Builder — Single Stripe design (#144)
> In `EnvelopeBuilder.tsx`, add "Single Stripe" as a front design option with one color picker. After implementing, update CAMPAIGNS_REQUIREMENTS id 144 status to "done".

### M50. Envelope Builder — Double Stripe design (#145)
> In `EnvelopeBuilder.tsx`, add "Double Stripe" as a front design option with two color pickers. After implementing, update CAMPAIGNS_REQUIREMENTS id 145 status to "done".

### M51. Envelope Builder — Triple Stripe design (#146)
> In `EnvelopeBuilder.tsx`, add "Triple Stripe" as a front design option with three color pickers. After implementing, update CAMPAIGNS_REQUIREMENTS id 146 status to "done".

### M52. Envelope Builder — Air Mail Stripe design (#147)
> In `EnvelopeBuilder.tsx`, add "Air Mail Stripe" as a front design option with color pickers for the stripe colors. After implementing, update CAMPAIGNS_REQUIREMENTS id 147 status to "done".

### M53. Assign Tasks — assign recorder (#148)
> In the campaign recipient panel, add a "Assign Recorder" action that lets users select one or more recipients and assign a portal user to record personalized video clips for those recipients. This requires: (1) a selection mechanism on the recipient table, (2) an "Assign" button that opens a modal, (3) a user picker in the modal, (4) confirmation that saves the assignment. Note: only 1% of portals use this feature. After implementing, update CAMPAIGNS_REQUIREMENTS id 148 status to "done".

### M54. Assign Tasks — unassign recorder (#149)
> In the campaign recipient panel, add the ability to unassign previously assigned recorders from recipients. This could be a menu option on assigned recipients. After implementing, update CAMPAIGNS_REQUIREMENTS id 149 status to "done".
