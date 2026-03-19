import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams, useParams } from "react-router";
import {
  ChevronLeft, ChevronRight, Check, X,
  Mail, MessageSquare, Play, Video, Camera, Film,
  Users, Send,
  Bold, Italic, Underline, Link, List, AlignLeft,
  Sparkles, Globe, TriangleAlert, CircleAlert,
  Upload, GitBranch, Lightbulb,
  Bell, Videotape, Info,
  CalendarDays, Cake, Link2, Copy,
  Trash2, Plus, Search, Edit2, UserPlus,
  GraduationCap, Briefcase, Zap, CalendarClock, Repeat,
  IndentIncrease, IndentDecrease, Smile, StopCircle, RefreshCw,
  AlertTriangle, Target, BarChart3, Calendar,
  Signal, Wifi, Battery, Phone, Bookmark, Braces,
  AlignCenter, AlignRight, AlignJustify, Strikethrough, Minus, ChevronDown, PenLine, Tag, Palette, Lock,
} from "lucide-react";
import { SegmentedControl } from "@mantine/core";
import { useToast } from "../contexts/ToastContext";
import { useDesignLibrary } from "../contexts/DesignLibraryContext";
import { useTemplates, type CampaignTemplate } from "../contexts/TemplateContext";
import { SaveChangesModal } from "../components/SaveChangesModal";
import { MultiStepBuilder } from "./campaign/MultiStepBuilder";
import { VideoPickerView, VideoCreateView, type PickerVideo } from "./campaign/VideoModals";
import { VideoBuilder } from "./campaign/VideoBuilder";
import { ConstituentPanel } from "./campaign/ConstituentPanel";
import { ConfirmSend } from "./campaign/ConfirmSend";
import {
  type FlowStep,
  type ConstituentDateFieldId,
  type BuilderView,
  type VideoElements,
  type EnvelopeDesign,
  type LandingPageDef,
  makeId, SMS_MAX, MERGE_FIELDS, ALL_MERGE_TOKENS, LANDING_PAGES, ENVELOPE_DESIGNS,
  ENV_FONTS, CONSTITUENT_DATE_FIELDS,
  DEFAULT_VIDEO_ELEMENTS, DEFAULT_ELEMENT_ORDER,
  VR_DEFAULT_INSTRUCTIONS, VR_RECORDING_TIPS,
  SUCCESS_METRICS,
  EMAIL_BODY_FONTS, EMAIL_BODY_FONT_SIZES, EMAIL_BODY_LINE_HEIGHTS, EMAIL_TEXT_COLORS,
} from "./campaign/types";
import { LivePreviewPanel } from "./campaign/LivePreviewPanel";
import { DesignStepPanel } from "./campaign/DesignStepPanel";
import { MetricChip } from "../components/MetricChip";
import { TV } from "../theme";
import { INPUT_CLS, INPUT_CLS_FLEX, TEXTAREA_CLS, SELECT_CLS, LABEL_CLS, HELPER_CLS, RTE_WRAPPER_CLS, RTE_WRAPPER_BASE_CLS, RTE_BODY_CLS, MERGE_PILL_CLS, TOOLBAR_BTN_LG_CLS, TOOLBAR_BTN_ACTIVE_CLS, TOOLBAR_BTN_IDLE_CLS, ICON_BTN_CLS, TAG_INPUT_WRAPPER_CLS } from "./campaign/styles";
import { SimpleRTE, MergeFieldDropdown, EmojiDropdown, SAVED_SIGNATURES } from "./campaign/SharedUI";
import { TagPicker, CAMPAIGN_TAGS } from "./campaign/TagPicker";
import { MergeFieldPicker } from "../components/MergeFieldPicker";
import { ResizableSplitPane } from "../components/ResizableSplitPane";
import { CharCount, BodyHeaderCount, SmsCharCounter, EmailBodyCharCounter, CHAR_LIMITS, htmlTextLength, getEditorWarnCls } from "../components/CharCounters";
import { EmailTemplateActions } from "../components/EmailTemplateAndSignature";
import { TvTooltip } from "../components/TvTooltip";
// ── Campaign-level types (distinct from FlowStepType) ─────────────────────────
type CampaignGoal = "send-video" | "send-without-video" | "request-video";
type CampaignChannel = "email" | "sms";
type StepMode = "single" | "multi";

/** Data shape for editing an existing campaign — bridges CampaignDetail mock data to wizard state */
export interface EditCampaignData {
  id: number;
  name: string;
  goal: CampaignGoal;
  channel: CampaignChannel;
  subject: string;
  body: string;
  senderName: string;
  senderEmail: string;
  replyTo: string;
  envelopeId?: number;
  landingPageEnabled: boolean;
  landingPageId?: number;
  lpHeadline?: string;
  ctaText?: string;
  ctaUrl?: string;
  lpBody?: string;
  constituents?: Array<{ id: number; name: string; email: string; phone: string; source: string }>;
  selectedMetrics?: string[];
  tags?: string[];
  hasIntro?: boolean;
  hasOutro?: boolean;
  hasPersonalVideo?: boolean;
}


// ── SmsMergeBar — SMS textarea with quick-insert pills + full merge picker ──
function SmsMergeBar({ onInsert, body, onChange, placeholder }: {
  onInsert: (token: string) => void;
  body: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const warn = getEditorWarnCls(body.length, CHAR_LIMITS.sms);
  return (
    <div className={`${RTE_WRAPPER_BASE_CLS} transition-colors ${warn.wrapperCls || "border-tv-border-light"}`}>
      <div className="flex items-center gap-1 px-2.5 py-1.5 bg-tv-surface border-b border-tv-border-light flex-wrap rounded-t-[9px]">
        <span className="text-[9px] text-tv-text-secondary select-none">Insert:</span>
        {[...MERGE_FIELDS.slice(0, 3), "{{link}}"].map(f => (
          <button key={f} onClick={() => onInsert(f)}
            className={MERGE_PILL_CLS}>{f}</button>
        ))}
        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${showPicker ? "bg-tv-brand-tint text-tv-brand" : "text-tv-brand hover:bg-tv-brand-tint"} font-semibold`}
          >
            + More
          </button>
          {showPicker && (
            <MergeFieldPicker
              onInsert={token => onInsert(token)}
              onClose={() => setShowPicker(false)}
              compact
            />
          )}
        </div>
      </div>
      <textarea value={body} onChange={e => onChange(e.target.value)} rows={4}
        placeholder={placeholder}
        aria-label="SMS body"
        className={`${RTE_BODY_CLS} transition-colors ${warn.bodyCls}`} />
    </div>
  );
}

// CAMPAIGN_TAGS now imported from ./campaign/TagPicker

// ── Video Request specific constants ──────────────────────────────────────────
const VR_DELIVERY_TYPES = [
  { id: "email" as const,    label: "Email",          desc: "Send request via email",          icon: Mail },
  { id: "sms" as const,      label: "SMS",            desc: "Send request via text message",   icon: MessageSquare },
  { id: "link" as const,     label: "Shareable Link", desc: "Share a link anywhere you like",  icon: Link2 },
];
type VrDeliveryType = "email" | "sms" | "link";

// ── Helper: create a default FlowStep for single-step mode ────────────────────
function makeDefaultStep(type: "email" | "sms"): FlowStep {
  return {
    id: makeId(),
    type,
    label: type === "email" ? "Email" : "SMS",
    description: "",
    automationEnabled: false,
    sendTimePreference: "none",
    subject: type === "email" ? "" : undefined,
    body: type === "email" ? "" : undefined,
    senderName: type === "email" ? "Kelley Molt" : "Hartwell University",
    senderEmail: type === "email" ? "kelley.molt@hartwell.edu" : undefined,
    replyTo: type === "email" ? "giving@hartwell.edu" : undefined,
    font: type === "email" ? "Serif (Garamond)" : undefined,
    envelopeId: type === "email" ? 1 : undefined,
    thumbnailType: type === "email" ? "static" : undefined,
    includeVideoThumbnail: type === "email" ? true : undefined,
    btnBg: type === "email" ? TV.brand : undefined,
    btnText: type === "email" ? "#ffffff" : undefined,
    smsBody: type === "sms" ? "" : undefined,
    smsPhoneNumber: type === "sms" ? "+1 (555) 012-3456" : undefined,
    linkShortening: type === "sms" ? true : undefined,
    attachedVideo: null,
    landingPageEnabled: false,
    landingPageId: 1,
    lpModule: "cta",
    ctaText: "Give to the Annual Fund",
    ctaUrl: "https://hartwell.edu/give",
    allowEmailReply: true,
    allowVideoReply: false,
    allowSaveButton: true,
    allowShareButton: true,
    allowDownloadVideo: true,
    closedCaptionsEnabled: true,
    lpWhiteGradient: true,
    envelopePreText: type === "email" ? "" : undefined,
    envelopePostText: type === "email" ? "" : undefined,
    replyToList: type === "email" ? ["giving@hartwell.edu"] : undefined,
  };
}

// ════════════════════════════════════════���══════════════════════════════════════
//  StepSetupModal — full-screen 4-step wizard that opens when adding an
//  Email or SMS step in multi-step mode
// ═══════════════════════════════════════════════════════════════════════════════
const SETUP_STEPS = [
  { key: "basics",  label: "Step Basics" },
  { key: "content", label: "Content" },
  { key: "video",   label: "Video" },
  { key: "review",  label: "Review" },
] as const;
type SetupStepKey = (typeof SETUP_STEPS)[number]["key"];

function StepSetupModal({
  stepType,
  onComplete,
  onCancel,
}: {
  stepType: "email" | "sms";
  onComplete: (step: FlowStep) => void;
  onCancel: () => void;
}) {
  const { show } = useToast();
  const [phase, setPhaseRaw] = useState<SetupStepKey>("basics");
  const phaseIdx = SETUP_STEPS.findIndex(s => s.key === phase);
  const isEmail = stepType === "email";

  // Step data — backed by a FlowStep
  const [step, setStep] = useState<FlowStep>(makeDefaultStep(stepType));

  // ── Dirty tracking + autosave ─────────────────────────────────────────────
  const [setupDirty, setSetupDirty] = useState(false);
  const [pendingSetupPhase, setPendingSetupPhase] = useState<SetupStepKey | null>(null);
  const markSetupDirty = useCallback(() => { if (!setupDirty) setSetupDirty(true); }, [setupDirty]);

  /** Navigate phase via breadcrumb — confirms if dirty */
  const navigateSetupPhase = useCallback((key: SetupStepKey) => {
    if (key === phase) return;
    if (setupDirty) { setPendingSetupPhase(key); return; }
    setPhaseRaw(key);
  }, [phase, setupDirty]);

  const confirmSetupSave = useCallback(() => {
    if (pendingSetupPhase) { show("✓ Progress saved", "success"); setSetupDirty(false); setPhaseRaw(pendingSetupPhase); setPendingSetupPhase(null); }
  }, [pendingSetupPhase, show]);
  const confirmSetupDiscard = useCallback(() => {
    if (pendingSetupPhase) { setSetupDirty(false); setPhaseRaw(pendingSetupPhase); setPendingSetupPhase(null); }
  }, [pendingSetupPhase]);
  const cancelSetupNav = useCallback(() => { setPendingSetupPhase(null); }, []);

  /** Wrap setPhase for Next/Back — auto-saves silently */
  const setPhase = useCallback((key: SetupStepKey) => {
    if (setupDirty) { show("✓ Progress saved", "success"); setSetupDirty(false); }
    setPhaseRaw(key);
  }, [setupDirty, show]);

  useEffect(() => { setSetupDirty(false); }, [phase]);

  // Video modals
  const [showPicker, setShowPicker] = useState(false);
  const [showRecord, setShowRecord] = useState(false);

  // AI state
  const [showAi, setShowAi] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

  // Merge dropdown
  const [showMerge, setShowMerge] = useState(false);

  const smsLen = (step.smsBody || "").length;

  const goNext = () => {
    const next = SETUP_STEPS[phaseIdx + 1];
    if (next) setPhase(next.key);
  };
  const goBack = () => {
    const prev = SETUP_STEPS[phaseIdx - 1];
    if (prev) setPhase(prev.key);
    else onCancel();
  };

  const handleAiGenerate = () => {
    setAiGenerating(true);
    setTimeout(() => {
      if (isEmail) {
        setStep(s => ({ ...s, body: "Dear {{first_name}},\n\nYour incredible generosity has made a transformative difference for students at Hartwell University this year. Thanks to supporters like you, we\u2019ve been able to fund 12 new scholarships and expand our mentoring program to reach over 200 first-generation students.\n\nI wanted to take a moment to share a personal video message with you \u2014 because your impact truly deserves more than just words on a screen.\n\nWith gratitude,\nKelley Molt" }));
      } else {
        setStep(s => ({ ...s, smsBody: "Hi {{first_name}}! Thank you for your generous support of the Annual Fund. Your gift is making a real difference for students at Hartwell. Click here to see a message from us: {{link}}" }));
      }
      setAiGenerating(false);
      setShowAi(false);
    }, 1500);
  };

  const handleFinish = () => {
    onComplete(step);
  };

  // ── Phase: basics ─────────────────────────────────────────────────────────
  const renderBasics = () => (
    <div className="max-w-[600px] xl:max-w-[700px] 2xl:max-w-[820px] mx-auto space-y-5">
      <div>
        <label className={LABEL_CLS}>Step Name</label>
        <input value={step.label} onChange={e => setStep(s => ({ ...s, label: e.target.value }))}
          placeholder={isEmail ? "e.g. Welcome Email" : "e.g. Thank-you SMS"}
          className={INPUT_CLS} />
      </div>
      <div>
        <label className={LABEL_CLS}>Description (optional)</label>
        <textarea value={step.description} onChange={e => setStep(s => ({ ...s, description: e.target.value }))}
          placeholder="Brief description of what this step does\u2026" rows={2}
          className={TEXTAREA_CLS} />
      </div>
      {isEmail && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={LABEL_CLS}>Sender Name</label>
              <CharCount current={(step.senderName || "").length} max={CHAR_LIMITS.senderName} />
            </div>
            <input value={step.senderName || ""} onChange={e => setStep(s => ({ ...s, senderName: e.target.value }))}
              maxLength={CHAR_LIMITS.senderName}
              className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Sender Email</label>
            <input value={step.senderEmail || ""} onChange={e => setStep(s => ({ ...s, senderEmail: e.target.value }))}
              className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Reply-To</label>
            <input value={step.replyTo || ""} onChange={e => setStep(s => ({ ...s, replyTo: e.target.value }))}
              className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Font</label>
            <select value={step.font || "Serif (Garamond)"} onChange={e => setStep(s => ({ ...s, font: e.target.value }))}
              className={SELECT_CLS}>
              {ENV_FONTS.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          {/* CC / BCC (collapsible) */}
          <details className="group col-span-2">
            <summary className="text-[10px] text-tv-brand uppercase tracking-wider cursor-pointer hover:underline list-none flex items-center gap-1 font-semibold">
              <ChevronRight size={10} className="transition-transform group-open:rotate-90" />CC / BCC <span className="text-tv-text-decorative normal-case" style={{ fontWeight: 400 }}>(optional)</span>
            </summary>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className={LABEL_CLS}>CC</label>
                <input value={step.ccAddresses || ""} onChange={e => setStep(s => ({ ...s, ccAddresses: e.target.value }))}
                  placeholder="cc@example.com"
                  className={INPUT_CLS} />
              </div>
              <div>
                <label className={LABEL_CLS}>BCC</label>
                <input value={step.bccAddresses || ""} onChange={e => setStep(s => ({ ...s, bccAddresses: e.target.value }))}
                  placeholder="bcc@example.com"
                  className={INPUT_CLS} />
              </div>
            </div>
            <p className={HELPER_CLS}>Comma-separated. Applies per constituent on send.</p>
          </details>
        </div>
      )}
      {!isEmail && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={LABEL_CLS}>Sender Name</label>
              <CharCount current={(step.senderName || "").length} max={CHAR_LIMITS.senderName} />
            </div>
            <input value={step.senderName || ""} onChange={e => setStep(s => ({ ...s, senderName: e.target.value }))}
              maxLength={CHAR_LIMITS.senderName}
              className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Phone Number</label>
            <input value={step.smsPhoneNumber || ""} onChange={e => setStep(s => ({ ...s, smsPhoneNumber: e.target.value }))}
              className={INPUT_CLS} />
          </div>
        </div>
      )}
    </div>
  );

  // ── Phase: content ────────────────────────────────────────────────────────
  const renderContent = () => (
    <div className="max-w-[660px] xl:max-w-[760px] 2xl:max-w-[880px] mx-auto space-y-4">
      {isEmail ? (
        <>
          {/* Template & Signature actions */}
          <EmailTemplateActions
            compact
            onApplyTemplate={(tpl) => {
              setStep(s => ({ ...s, subject: tpl.subject, body: tpl.body }));
            }}
          />

          {/* Subject */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={LABEL_CLS}>Subject Line</label>
              <CharCount current={(step.subject || "").length} max={CHAR_LIMITS.subject} />
            </div>
            <div className="flex items-center gap-1.5">
              <input value={step.subject || ""} onChange={e => setStep(s => ({ ...s, subject: e.target.value }))}
                maxLength={CHAR_LIMITS.subject}
                placeholder="A personal message for you, {{first_name}}"
                className={INPUT_CLS_FLEX} />
              <div className="relative">
                <button onClick={() => setShowMerge(!showMerge)} className={ICON_BTN_CLS} title="Insert merge field">
                  <span className="font-mono text-[11px]">{"{}"}</span>
                </button>
                {showMerge && (
                  <MergeFieldDropdown
                    onSelect={f => setStep(s => ({ ...s, subject: (s.subject || "") + " " + f }))}
                    onClose={() => setShowMerge(false)}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Body with toolbar — collapsible */}
          <details open className="group/body">
            <summary className="flex items-center justify-between cursor-pointer list-none select-none mb-1 [&::-webkit-details-marker]:hidden">
              <div className="flex items-center gap-1.5">
                <ChevronRight size={12} className="text-tv-text-decorative transition-transform group-open/body:rotate-90" />
                <label className={LABEL_CLS} style={{ marginBottom: 0, cursor: "pointer" }}>Message Body</label>
                {(step.body || "").trim().length > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-tv-success-bg text-tv-success shrink-0 font-semibold">
                    {htmlTextLength(step.body || "").toLocaleString()} chars
                  </span>
                )}
              </div>
              <BodyHeaderCount length={htmlTextLength(step.body || "")} limit={CHAR_LIMITS.body} />
            </summary>
            <div className="mt-1 space-y-2">
            {/* Compact font & styling bar */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Font family */}
              <div className="flex items-center gap-1.5">
                <label className="text-[10px] text-tv-text-secondary uppercase tracking-wider whitespace-nowrap font-semibold">Font</label>
                <select
                  value={step.bodyFontFamily || EMAIL_BODY_FONTS[0].value}
                  onChange={e => setStep(s => ({ ...s, bodyFontFamily: e.target.value }))}
                  title="Font Family"
                  className="border border-tv-border-light rounded-sm px-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand bg-white cursor-pointer"
                  style={{ fontFamily: step.bodyFontFamily || EMAIL_BODY_FONTS[0].value }}
                >
                  {EMAIL_BODY_FONTS.map(f => (
                    <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div className="h-5 w-px bg-tv-border-light" />
              {/* Font size */}
              <div className="flex items-center gap-1.5">
                <label className="text-[10px] text-tv-text-secondary uppercase tracking-wider whitespace-nowrap font-semibold">Size</label>
                <select
                  value={step.bodyFontSize || 14}
                  onChange={e => setStep(s => ({ ...s, bodyFontSize: Number(e.target.value) }))}
                  title="Font Size"
                  className="border border-tv-border-light rounded-sm px-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand bg-white cursor-pointer"
                >
                  {EMAIL_BODY_FONT_SIZES.map(s => (
                    <option key={s} value={s}>{s}px</option>
                  ))}
                </select>
              </div>
              <div className="h-5 w-px bg-tv-border-light" />
              {/* Text color picker */}
              <div className="flex items-center gap-1.5">
                <label className="text-[10px] text-tv-text-secondary uppercase tracking-wider whitespace-nowrap font-semibold">Color</label>
                <div className="relative group/tc2">
                  <button type="button" title="Text Color" className="flex items-center gap-1.5 border border-tv-border-light rounded-sm px-3 py-1.5 text-[13px] bg-white hover:border-tv-border-strong transition-colors cursor-pointer">
                    <span className="w-4 h-4 rounded-[4px] border border-tv-border-light shrink-0" style={{ backgroundColor: step.bodyTextColor || "#1e293b" }} />
                    <span className="text-tv-text-primary">{EMAIL_TEXT_COLORS.find(c => c.value === (step.bodyTextColor || "#1e293b"))?.label || "Custom"}</span>
                    <ChevronDown size={11} className="text-tv-text-secondary" />
                  </button>
                  <div className="absolute top-full left-0 mt-1.5 p-2.5 bg-white border border-tv-border-light rounded-md shadow-xl z-30 hidden group-hover/tc2:grid grid-cols-5 gap-1.5 w-[155px]">
                    {EMAIL_TEXT_COLORS.map(c => (
                      <button key={c.value} type="button" onClick={() => setStep(s => ({ ...s, bodyTextColor: c.value }))} title={c.label}
                        className={`w-5.5 h-5.5 rounded-full border-2 transition-transform hover:scale-110 ${(step.bodyTextColor || "#1e293b") === c.value ? "border-tv-brand ring-1 ring-tv-brand/30" : "border-tv-border-light"}`}
                        style={{ backgroundColor: c.value }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {(() => { const _w = getEditorWarnCls(htmlTextLength(step.body || ""), CHAR_LIMITS.body); return (
            <SimpleRTE
              value={step.body || ""}
              onChange={v => setStep(s => ({ ...s, body: v }))}
              placeholder={"Dear {{first_name}},\n\nI wanted to reach out personally\u2026"}
              ariaLabel="Email body"
              rows={6}
              onInsertMerge={f => setStep(s => ({ ...s, body: (s.body || "") + " " + f }))}
              wrapperClassName={_w.wrapperCls}
              bodyClassName={_w.bodyCls}
              bodyStyle={{
                fontFamily: step.bodyFontFamily || EMAIL_BODY_FONTS[0].value,
                fontSize: `${step.bodyFontSize || 14}px`,
                color: step.bodyTextColor || "#1e293b",
                lineHeight: step.bodyLineHeight || 1.5,
              }}
              onInsertSignature={(sigHtml) => setStep(s => ({ ...s, body: (s.body || "") + sigHtml }))}
            />); })()}
            <EmailBodyCharCounter length={htmlTextLength(step.body || "")} />
            </div>
          </details>
        </>
      ) : (
        <>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={LABEL_CLS}>Message Body</label>
              <BodyHeaderCount length={smsLen} limit={CHAR_LIMITS.sms} />
            </div>
            <SmsMergeBar
              onInsert={token => setStep(s => ({ ...s, smsBody: (s.smsBody || "") + " " + token }))}
              body={step.smsBody || ""}
              onChange={v => setStep(s => ({ ...s, smsBody: v }))}
              placeholder={"Hi {{first_name}}! I have a personal message for you\u2026"}
            />
            <SmsCharCounter length={smsLen} />
          </div>

          {/* SMS compliance */}
          <div className="p-2.5 bg-tv-warning-bg border border-tv-warning-border rounded-md flex gap-2">
            <CircleAlert size={12} className="text-tv-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] text-tv-warning font-semibold">SMS Compliance</p>
              <p className="text-[10px] text-tv-warning">&ldquo;Reply STOP to unsubscribe&rdquo; will be automatically appended.</p>
            </div>
          </div>
        </>
      )}

      {/* AI writer (shared) */}
      <div>
        <button onClick={() => setShowAi(!showAi)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[14px] border transition-all ${showAi ? "border-tv-brand-bg bg-tv-brand-tint text-tv-brand" : "border-tv-border-light text-tv-text-secondary hover:border-tv-border-strong hover:text-tv-brand"}`} style={{ fontWeight: 500 }}>
          <Sparkles size={13} />Write with AI
        </button>
        {showAi && (
          <div className="mt-2 p-2.5 bg-tv-brand-tint border border-tv-border-strong rounded-md space-y-2">
            <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
              placeholder={isEmail ? "e.g. Write a heartfelt thank-you message\u2026" : "e.g. Write a brief thank-you SMS\u2026"} rows={2}
              aria-label="AI writing prompt"
              className="w-full border border-tv-border rounded-sm px-2.5 py-1.5 text-[12px] outline-none resize-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand" />
            <div className="flex items-center gap-2">
              <button onClick={() => setShowAi(false)} className="px-2.5 py-1 text-[11px] text-tv-text-secondary hover:text-tv-brand">Cancel</button>
              <button onClick={handleAiGenerate} disabled={!aiPrompt.trim() || aiGenerating}
                className="px-3 py-1 bg-tv-brand-bg text-white text-[11px] rounded-full hover:bg-tv-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 font-semibold">
                {aiGenerating ? <><div className="w-2.5 h-2.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Generating&hellip;</> : <><Sparkles size={10} />Generate</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── Phase: video (replaced with placeholder) ────────────────────────────
  const renderVideo = () => (
    <div className="max-w-[520px] xl:max-w-[600px] 2xl:max-w-[700px] mx-auto flex flex-col items-center justify-center py-10 text-center">
      <div className="w-16 h-16 rounded-lg bg-tv-surface-muted border border-tv-border-light flex items-center justify-center mb-5">
        <Video size={28} className="text-tv-text-decorative" />
      </div>
      <p className="text-[36px] text-tv-text-decorative mb-1.5" style={{ fontWeight: 900 }}>404</p>
      <p className="text-[14px] text-tv-text-primary mb-1.5" style={{ fontWeight: 700 }}>See TV Video Builder for this content</p>
      <p className="text-[12px] text-tv-text-secondary max-w-[320px]">
        Video building has moved to a dedicated prototype. You can skip this step and continue.
      </p>
    </div>
  );

  // ── Phase: review ─────────────────────────────────────────────────────────
  const renderReview = () => (
    <div className="max-w-[600px] xl:max-w-[700px] 2xl:max-w-[820px] mx-auto space-y-3">
      <p className="text-[13px] text-tv-text-secondary mb-3">Confirm the details for this step, then add it to your flow.</p>
      {[
        { label: "Step Type",  value: isEmail ? "Email" : "SMS" },
        { label: "Name",       value: step.label || "\u2014" },
        { label: isEmail ? "Subject" : "SMS Preview", value: isEmail ? (step.subject || "\u2014") : ((step.smsBody || "").slice(0, 60) || "\u2014") },
        { label: "Video",      value: "See TV Video Builder" },
        { label: "Sender",     value: step.senderName || "\u2014" },
      ].map((row, i) => (
        <div key={i} className="flex items-center justify-between px-4 py-3 rounded-md bg-tv-surface-muted border border-tv-border-divider">
          <span className="text-[11px] text-tv-text-label uppercase tracking-wider font-semibold">{row.label}</span>
          <span className="text-[13px] text-tv-text-primary truncate max-w-[60%] text-right">{row.value}</span>
        </div>
      ))}
    </div>
  );

  const renderPhase = () => {
    switch (phase) {
      case "basics":  return renderBasics();
      case "content": return renderContent();
      case "video":   return renderVideo();
      case "review":  return renderReview();
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-white flex flex-col">
      {/* Header — hidden when a video sub-view owns the full area */}
      {!showPicker && !showRecord && (
        <div className="border-b border-tv-border-divider px-6 py-4 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 ${isEmail ? "bg-tv-brand-tint" : "bg-tv-info-bg"}`}>
                {isEmail ? <Mail size={15} className="text-tv-brand" /> : <MessageSquare size={15} className="text-tv-info" />}
              </div>
              <div>
                <h2 className="text-[16px] text-tv-text-primary">New {isEmail ? "Email" : "SMS"} Step</h2>
                <p className="text-[11px] text-tv-text-secondary">Step {phaseIdx + 1} of {SETUP_STEPS.length} &middot; {SETUP_STEPS[phaseIdx].label}</p>
              </div>
            </div>
            <button onClick={onCancel} aria-label="Close builder" className="w-8 h-8 rounded-full bg-tv-surface flex items-center justify-center text-tv-text-secondary hover:bg-tv-surface-hover transition-colors">
              <X size={15} />
            </button>
          </div>
          {/* Progress dots — clickable */}
          <div className="flex items-center gap-2" role="tablist" aria-label={`Step ${phaseIdx + 1} of ${SETUP_STEPS.length}: ${SETUP_STEPS[phaseIdx]?.label ?? ""}`}>
            {SETUP_STEPS.map((s, i) => (
              <button
                key={s.key}
                onClick={() => navigateSetupPhase(s.key)}
                className="flex items-center gap-2 flex-1 cursor-pointer group"
                role="tab"
                aria-selected={i === phaseIdx}
                aria-label={`Go to ${s.label}`}
              >
                <div className={`h-1.5 flex-1 rounded-full transition-colors group-hover:opacity-80 ${i <= phaseIdx ? "bg-tv-brand-bg" : "bg-tv-border-light group-hover:bg-tv-border-strong"}`} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Body — when a video sub-view is active, it takes over the full area */}
      {showPicker ? (
        <div className="flex-1 overflow-hidden flex flex-col">
          <VideoPickerView
            onBack={() => setShowPicker(false)}
            onSelect={(v: PickerVideo) => {
              setStep(s => ({ ...s, attachedVideo: { id: v.id, title: v.title, duration: v.duration, color: v.color } }));
              setShowPicker(false);
              show(`"${v.title}" attached`, "success");
            }}
          />
        </div>
      ) : showRecord ? (
        <div className="flex-1 overflow-hidden flex flex-col">
          <VideoCreateView
            onBack={() => setShowRecord(false)}
            onSave={(v) => {
              setStep(s => ({ ...s, attachedVideo: { id: v.id, title: v.title, duration: v.duration, color: v.color } }));
              setShowRecord(false);
              show(`"${v.title}" recorded & attached`, "success");
            }}
          />
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-auto p-6 sm:p-8" onInput={markSetupDirty} onClick={markSetupDirty}>
            {renderPhase()}
          </div>

          {/* Footer — Back left, Next/Add Step right */}
          <div className="border-t border-tv-border-divider px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 bg-white">
            <button onClick={goBack}
              className="flex items-center gap-1 px-4 py-2 text-[12px] text-tv-text-secondary border border-tv-border-light rounded-full hover:bg-tv-surface transition-colors" style={{ fontWeight: 500 }}>
              <ChevronLeft size={13} />
              {phaseIdx === 0 ? "Cancel" : "Back"}
            </button>
            {phase === "review" ? (
              <button onClick={handleFinish}
                className="flex items-center gap-1.5 px-5 py-2.5 text-[13px] text-white bg-tv-brand-bg rounded-full hover:bg-tv-brand-hover transition-colors font-semibold">
                <Check size={13} />Add to Flow
              </button>
            ) : (
              <button onClick={goNext}
                className="flex items-center gap-1.5 px-5 py-2.5 text-[13px] text-white bg-tv-brand-bg rounded-full hover:bg-tv-brand-hover transition-colors font-semibold">
                Next<ChevronRight size={13} />
              </button>
            )}
          </div>
        </>
      )}

      {/* Save changes confirmation — breadcrumb phase jump */}
      {pendingSetupPhase !== null && (
        <SaveChangesModal
          fromStep={SETUP_STEPS[phaseIdx]?.label}
          toStep={SETUP_STEPS.find(s => s.key === pendingSetupPhase)?.label}
          onSaveAndContinue={confirmSetupSave}
          onDiscard={confirmSetupDiscard}
          onStay={cancelSetupNav}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  StepModeSelect — first screen in campaign creation
// ═══════════════════════════════════════════════════════════════════════════════
function StepModeSelect({ onSelect }: { onSelect: (mode: StepMode) => void }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<StepMode | null>(null);

  const MODES: { id: StepMode; icon: typeof Send; title: string; desc: string; tags: string[] }[] = [
    { id: "single", icon: Send, title: "Single-Step Campaign", desc: "Send one message to your constituents \u2014 great for thank-yous, event invites, and one-time outreach.", tags: ["Email", "SMS", "Video"] },
    { id: "multi", icon: GitBranch, title: "Multi-Step Campaign", desc: "Build a sequence of touchpoints with waits, conditions, and branching \u2014 ideal for appeals, stewardship, and drip campaigns.", tags: ["Sequences", "Branching", "Automation"] },
  ];

  return (
    <div className="flex-1 flex flex-col bg-tv-surface/40">
      {/* Breadcrumb */}
      <div className="px-6 py-4 border-b border-tv-border-divider bg-white">
        <div className="flex items-center gap-2 text-[13px]">
          <span className="text-tv-text-secondary">Campaigns</span>
          <ChevronRight size={12} className="text-tv-text-decorative" />
          <span className="text-tv-text-primary">Create Campaign</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[900px] 2xl:max-w-[1060px]">
          <div className="text-center mb-10">
            <h1 className="font-display text-tv-text-primary mb-2" style={{ fontSize: "32px", fontWeight: 900 }}>
              Let&rsquo;s Create a Campaign
            </h1>
            <p className="text-[15px] text-tv-text-secondary">Choose how your campaign is structured. You can always change this later.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {MODES.map(m => {
              const isSelected = selected === m.id;
              const Icon = m.icon;
              return (
                <button key={m.id} onClick={() => setSelected(m.id)}
                  className={`text-left p-7 rounded-lg border-2 bg-white relative flex flex-col transition-all ${
                    isSelected
                      ? "border-tv-brand-bg shadow-md"
                      : "border-tv-border hover:border-tv-border-strong hover:shadow-sm"
                  }`}>
                  {isSelected && (
                    <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-tv-brand-bg flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-5 mx-auto ${isSelected ? "bg-tv-brand-bg" : "bg-tv-brand-tint"}`}>
                    <Icon size={22} className={isSelected ? "text-white" : "text-tv-brand"} />
                  </div>
                  <h3 className="text-tv-text-primary text-center mb-2" style={{ fontSize: "18px", fontWeight: 700 }}>{m.title}</h3>
                  <p className="text-[13px] text-tv-text-secondary leading-relaxed text-center mb-5">{m.desc}</p>
                  <div className="flex items-center justify-center gap-2 flex-wrap mt-auto">
                    {m.tags.map(t => (
                      <span key={t} className="text-[11px] text-tv-text-secondary border border-tv-border-light rounded-full px-2.5 py-0.5">{t}</span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="sticky bottom-0 bg-white border-t border-tv-border-divider px-4 sm:px-6 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/campaigns")}
            className="flex items-center gap-1.5 px-4 py-2 text-[13px] text-tv-text-primary border border-tv-border-light rounded-full hover:bg-tv-surface transition-colors">
            <ChevronLeft size={13} />Back
          </button>
          <div className="flex-1" />
          <button onClick={() => selected && onSelect(selected)}
            disabled={!selected}
            className={`flex items-center gap-1.5 px-6 py-2.5 text-[13px] rounded-full transition-colors ${
              selected
                ? "text-white bg-tv-brand-bg hover:bg-tv-brand-hover"
                : "text-white/60 bg-tv-brand-bg/40 cursor-not-allowed"
            } font-semibold`}>
            Next<ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SingleStepWizard — 6-step wizard (Configure → Content & Design → Constituents → Video → Schedule → Review)
// ═══════════════════════════════════════════════════════════════════════════════
const WIZARD_STEPS = [
  { key: "configure",     label: "Configure" },
  { key: "content",       label: "Content & Design" },
  { key: "constituents",  label: "Constituents" },
  { key: "video",         label: "Video" },
  { key: "schedule",      label: "Schedule" },
  { key: "review",        label: "Review" },
] as const;
type WizardStepKey = (typeof WIZARD_STEPS)[number]["key"];

function SingleStepWizard({ onBack, initialGoal = null, initialTemplate = null, editCampaign = null }: { onBack: () => void; initialGoal?: CampaignGoal | null; initialTemplate?: CampaignTemplate | null; editCampaign?: EditCampaignData | null }) {
  const isEditMode = editCampaign !== null;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { show } = useToast();
  const { customEnvelopes: globalEnvelopes, customLandingPages: globalLandingPages, addEnvelope: globalAddEnvelope, addLandingPage: globalAddLandingPage } = useDesignLibrary();
  const { addTemplate } = useTemplates();
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  // Send Test modal state (declared before Escape handler that references it)
  const [showSendTestModal, setShowSendTestModal] = useState(false);
  const [sendTestEmail, setSendTestEmail] = useState("kelley.molt@hartwell.edu");
  const [sendTestPreviewAs, setSendTestPreviewAs] = useState(0);
  const [sendTestSending, setSendTestSending] = useState(false);
  const [sendTestGroup, setSendTestGroup] = useState<string[]>(["kelley.molt@hartwell.edu", "james.okafor@hartwell.edu"]);

  // Close modals on Escape (WCAG 2.1.1)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showSendTestModal) { setShowSendTestModal(false); setSendTestSending(false); }
        else if (showSaveTemplate) setShowSaveTemplate(false);
      }
    };
    if (showSendTestModal || showSaveTemplate) {
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }
  }, [showSendTestModal, showSaveTemplate]);
  const [saveTemplateName, setSaveTemplateName] = useState("");
  const [saveTemplateDesc, setSaveTemplateDesc] = useState("");

  // Clear the returnStep URL param after reading it (keep URL clean)
  const returnStep = searchParams.get("returnStep");
  useEffect(() => {
    if (returnStep) {
      setSearchParams({}, { replace: true });
    }
  }, [returnStep, setSearchParams]);

  // Resolve initial step index from returnStep param
  const resolveInitialStep = (): number => {
    if (returnStep) {
      const idx = WIZARD_STEPS.findIndex(s => s.key === returnStep);
      if (idx >= 0) return idx;
    }
    return 0;
  };

  const [stepIndex, setStepIndexRaw] = useState(resolveInitialStep);
  const currentKey = WIZARD_STEPS[stepIndex].key;
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Configure step must be completed before any other step is accessible
  const [configureCompleted, setConfigureCompleted] = useState(() => isEditMode || resolveInitialStep() > 0);

  // ── Dirty tracking + autosave ─────────────────────────────────────────────
  const [isDirty, setIsDirty] = useState(false);
  const [pendingStepNav, setPendingStepNav] = useState<number | null>(null);
  const markDirty = useCallback(() => { if (!isDirty) setIsDirty(true); }, [isDirty]);

  /** Navigate to a step, showing confirmation if current step is dirty */
  const navigateToStep = useCallback((targetIdx: number) => {
    if (targetIdx === stepIndex) return;
    // Block navigation to non-configure steps until configure is completed
    if (targetIdx !== 0 && !configureCompleted) return;
    if (isDirty) {
      setPendingStepNav(targetIdx);
      return;
    }
    setStepIndexRaw(targetIdx);
  }, [stepIndex, isDirty, configureCompleted]);

  /** Confirm save & navigate — autosave (state is already in React) + toast */
  const confirmSaveAndNav = useCallback(() => {
    if (pendingStepNav !== null) {
      show("✓ Progress saved", "success");
      setIsDirty(false);
      setStepIndexRaw(pendingStepNav);
      setPendingStepNav(null);
    }
  }, [pendingStepNav, show]);

  /** Discard changes and navigate */
  const confirmDiscardAndNav = useCallback(() => {
    if (pendingStepNav !== null) {
      setIsDirty(false);
      setStepIndexRaw(pendingStepNav);
      setPendingStepNav(null);
    }
  }, [pendingStepNav]);

  /** Cancel pending navigation */
  const cancelPendingNav = useCallback(() => {
    setPendingStepNav(null);
  }, []);

  /** Wrapper to set step index (used by Next/Back) — auto-saves + toasts */
  const setStepIndex = useCallback((idx: number) => {
    if (isDirty) {
      show("✓ Progress saved", "success");
      setIsDirty(false);
    }
    setStepIndexRaw(idx);
  }, [isDirty, show]);

  // Reset dirty flag when step changes
  useEffect(() => {
    setIsDirty(false);
  }, [stepIndex]);

  // Campaign-level state — hydrate from template or editCampaign when provided
  const [campaignName, setCampaignName] = useState(editCampaign?.name ?? (initialTemplate ? initialTemplate.name : ""));
  const [campaignGoal, setCampaignGoal] = useState<CampaignGoal | null>(
    editCampaign?.goal ?? initialTemplate?.goal ?? initialGoal
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(editCampaign?.tags ?? initialTemplate?.tags ?? []);
  // customTags, newTagInput, editingTagIdx, editingTagValue — now managed inside TagPicker
  const [campaignCh, setCampaignCh] = useState<CampaignChannel | null>(
    editCampaign?.channel ?? initialTemplate?.channel ?? null
  );

  // Hydrate step state from template content
  useEffect(() => {
    if (initialTemplate?.stepContent) {
      const sc = initialTemplate.stepContent;
      const isSms = sc.type === "sms";
      // If switching to SMS, rebuild from SMS defaults then overlay template values
      const base = isSms ? makeDefaultStep("sms") : undefined;
      setStep(s => ({
        ...(base ?? s),
        type: isSms ? "sms" : s.type,
        label: sc.label || (base ?? s).label,
        subject: sc.subject ?? (base ?? s).subject,
        body: sc.body ?? (base ?? s).body,
        senderName: sc.senderName ?? (base ?? s).senderName,
        senderEmail: sc.senderEmail ?? (base ?? s).senderEmail,
        replyTo: sc.replyTo ?? (base ?? s).replyTo,
        font: sc.font ?? (base ?? s).font,
        smsBody: sc.smsBody ?? (base ?? s).smsBody,
        landingPageEnabled: sc.landingPageEnabled ?? (base ?? s).landingPageEnabled,
        ctaText: sc.ctaText ?? (base ?? s).ctaText,
        ctaUrl: sc.ctaUrl ?? (base ?? s).ctaUrl,
      }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Video Request state
  const [vrDeliveryType, setVrDeliveryType] = useState<VrDeliveryType | null>(null);
  const [vrDueDate, setVrDueDate] = useState("");
  const [vrReminderEnabled, setVrReminderEnabled] = useState(true);
  const [vrReminderDays, setVrReminderDays] = useState<number[]>([7, 3, 1]);
  const [vrSubmissionsEnabled, setVrSubmissionsEnabled] = useState(true);
  const [vrIncludeLibraryVideo, setVrIncludeLibraryVideo] = useState(false);
  const [vrShareableUrl] = useState("https://thankview.com/r/hrtw-2026-spring");
  const [vrInstructions, setVrInstructions] = useState(VR_DEFAULT_INSTRUCTIONS);
  const [vrBrandedLandingPage, setVrBrandedLandingPage] = useState(1);
  const [vrLibraryVideoId, setVrLibraryVideoId] = useState<number | null>(null);
  const [vrLibraryVideoTitle, setVrLibraryVideoTitle] = useState("");
  const [showVrLibraryPicker, setShowVrLibraryPicker] = useState(false);

  // Schedule state
  type ScheduleType = "now" | "later" | "contact-field";
  const [scheduleType, setScheduleType] = useState<ScheduleType | null>(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [contactDateField, setContactDateField] = useState<ConstituentDateFieldId | null>(null);
  const [leapYearHandling, setLeapYearHandling] = useState<"feb28" | "mar1">("feb28");
  const [contactFieldSendTime, setContactFieldSendTime] = useState("09:00");

  // Success metrics state (1-5 selectable)
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(editCampaign?.selectedMetrics ?? []);
  const [showMetricsInfo, setShowMetricsInfo] = useState(false);
  const [showDropoffInfo, setShowDropoffInfo] = useState(false);
  const toggleMetric = (id: string) => {
    if (isEditMode) return;
    setSelectedMetrics(prev => {
      if (prev.includes(id)) return prev.filter(m => m !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  };

  // (Send Test modal state moved above Escape handler)
  const [sendTestNewEmail, setSendTestNewEmail] = useState("");
  const [sendTestMode, setSendTestMode] = useState<"single" | "group">("single");
  const SEND_TEST_CONSTITUENTS = [
    { id: 0, name: "James Whitfield", email: "j.whitfield@alumni.edu" },
    { id: 1, name: "Sarah Chen", email: "s.chen@foundation.org" },
    { id: 2, name: "Marcus Reid", email: "m.reid@email.com" },
  ];

  // The single FlowStep that holds all channel/content state
  const [step, setStep] = useState<FlowStep>(() => {
    // Hydrate from editCampaign when editing
    if (editCampaign) {
      const base = makeDefaultStep(editCampaign.channel);
      return {
        ...base,
        subject: editCampaign.subject,
        body: editCampaign.body,
        senderName: editCampaign.senderName,
        senderEmail: editCampaign.senderEmail,
        replyTo: editCampaign.replyTo,
        envelopeId: editCampaign.envelopeId ?? base.envelopeId,
        landingPageEnabled: editCampaign.landingPageEnabled,
        landingPageId: editCampaign.landingPageId ?? base.landingPageId,
        ctaText: editCampaign.ctaText ?? base.ctaText,
        ctaUrl: editCampaign.ctaUrl ?? base.ctaUrl,
      };
    }
    // Restore step state if returning from an external builder
    try {
      const saved = sessionStorage.getItem("tv-wizard-step-state");
      if (saved) {
        sessionStorage.removeItem("tv-wizard-step-state");
        return JSON.parse(saved) as FlowStep;
      }
    } catch { /* ignore */ }
    return makeDefaultStep("email");
  });

  // ── Video builder state (Step 4) ────────────��─────────────────────────────
  const [builderView, setBuilderView] = useState<BuilderView>("overview");

  // Element done flags — whether each section is complete
  const [hasIntro, setHasIntro] = useState(editCampaign?.hasIntro ?? false);
  const [hasMain, setHasMain] = useState(editCampaign?.hasPersonalVideo ?? false);
  const [hasOutro, setHasOutro] = useState(editCampaign?.hasOutro ?? false);
  const [hasOverlay, setHasOverlay] = useState(false);

  // Element toggles — whether intro/outro are turned on
  const [introEnabled, setIntroEnabled] = useState(true);
  const [outroEnabled, setOutroEnabled] = useState(true);

  // Element composition — which element types are in the video
  const [videoElements, setVideoElements] = useState<VideoElements>({ ...DEFAULT_VIDEO_ELEMENTS });

  // Element order — controls segment display order in the timeline
  const [elementOrder, setElementOrder] = useState<(keyof VideoElements)[]>([...DEFAULT_ELEMENT_ORDER]);

  // Library pick target — which element triggered the library open
  type LibraryTarget = "intro" | "personalized" | "shared" | "outro" | null;
  const [libraryPickTarget, setLibraryPickTarget] = useState<LibraryTarget>(null);

  // Derived: is the video step complete?
  const hasAnyVideoElement = Object.values(videoElements).some(Boolean);
  const isVideoComplete = hasAnyVideoElement && (
    (!videoElements.intro || hasIntro) &&
    (!videoElements.personalizedClip || hasMain) &&
    (!videoElements.sharedVideo || hasMain) &&
    (!videoElements.outro || hasOutro)
  );

  // Constituent list state
  const DEFAULT_CONSTITUENTS = [
    { id: 1, name: "James Whitfield", email: "j.whitfield@alumni.edu", phone: "+1 (555) 123-4567", source: "Major Donors" },
    { id: 2, name: "Sarah Chen", email: "s.chen@foundation.org", phone: "+1 (555) 234-5678", source: "Major Donors" },
    { id: 3, name: "Marcus Reid", email: "m.reid@email.com", phone: "+1 (555) 345-6789", source: "CSV Upload" },
    { id: 4, name: "Emily Torres", email: "e.torres@corp.com", phone: "+1 (555) 456-7890", source: "New Donors 2025" },
    { id: 5, name: "David Park", email: "d.park@alumni.edu", phone: "+1 (555) 567-8901", source: "All Donors" },
  ];
  const [constituents, setConstituents] = useState<{ id: number; name: string; email: string; phone: string; source: string }[]>(editCampaign?.constituents ?? DEFAULT_CONSTITUENTS);
  const [constituentSearch, setConstituentSearch] = useState("");
  const [editingConstituent, setEditingConstituent] = useState<number | null>(null);
  const [showAddMethod, setShowAddMethod] = useState<"csv" | "manual" | "list" | null>(null);

  // ── Custom envelopes — sourced from global DesignLibraryContext ─────────────
  // On mount / return from builder, check if a new envelope was just saved via sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("tv-saved-envelope");
      if (raw) {
        const env = JSON.parse(raw) as EnvelopeDesign;
        sessionStorage.removeItem("tv-saved-envelope");
        globalAddEnvelope(env);
        setStep(s => ({ ...s, envelopeId: env.id }));
      }
    } catch { /* ignore */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Merged envelope list: global custom envelopes + built-in designs
  const allEnvelopes = [...globalEnvelopes, ...ENVELOPE_DESIGNS];
  const [envelopeCategory, setEnvelopeCategory] = useState<"standard" | "holiday" | "legacy">("standard");
  const [envelopeSearch, setEnvelopeSearch] = useState("");

  // Design step — landing page search + collapsible sections + preview viewport
  const [lpSearch, setLpSearch] = useState("");
  const [lpSectionOpen, setLpSectionOpen] = useState(true);
  const [envSectionOpen, setEnvSectionOpen] = useState<Record<string, boolean>>({ branded: true, holiday: false, legacy: false });
  // ── Design-step UI state — restored from sessionStorage on builder round-trip ──
  const _designUiCache = useRef<Record<string, any> | null>(null);
  const _getDesignUi = () => {
    if (_designUiCache.current !== null) return _designUiCache.current;
    try {
      const raw = sessionStorage.getItem("tv-wizard-design-ui");
      _designUiCache.current = raw ? JSON.parse(raw) : {};
    } catch { _designUiCache.current = {}; }
    return _designUiCache.current!;
  };
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "tablet" | "mobile">(() => _getDesignUi().previewViewport || "desktop");
  const [envTextBefore, setEnvTextBefore] = useState(() => _getDesignUi().envTextBefore || "");
  const [envTextAfter, setEnvTextAfter] = useState(() => _getDesignUi().envTextAfter || "");
  const [envNameFormat, setEnvNameFormat] = useState(() => _getDesignUi().envNameFormat || "[Title] [First Name] [Last Name]");
  const [envLineBreakBefore, setEnvLineBreakBefore] = useState(() => _getDesignUi().envLineBreakBefore ?? false);
  const [envLineBreakAfter, setEnvLineBreakAfter] = useState(() => _getDesignUi().envLineBreakAfter ?? false);
  const [attachmentType, setAttachmentType] = useState<"button" | "pdf" | "form">(() => _getDesignUi().attachmentType || "button");
  const [trackingPixel, setTrackingPixel] = useState(() => _getDesignUi().trackingPixel || "");

  // ── Design snapshot from DesignStepPanel (PDF/form data for live preview) ──
  const [designSnapshot, setDesignSnapshot] = useState<import("./campaign/DesignStepPanel").DesignSnapshot>(() => _getDesignUi().designSnapshot || {});

  // Clean up the design-ui sessionStorage key after all initializers have read,
  // and purge any stale wizard keys older than 30 minutes (e.g. if the user
  // navigated away from the builder without returning).
  useEffect(() => {
    const STALE_MS = 30 * 60 * 1000; // 30 minutes
    const WIZARD_KEYS = [
      "tv-wizard-step-state",
      "tv-wizard-design-ui",
      "tv-wizard-timestamp",
      "tv-saved-envelope",
      "tv-saved-landing-page",
    ];
    try {
      // Always clean the design-ui cache ref after initializers consumed it
      _designUiCache.current = null;

      const ts = sessionStorage.getItem("tv-wizard-timestamp");
      if (ts && Date.now() - Number(ts) > STALE_MS) {
        // Keys are stale — remove them all
        WIZARD_KEYS.forEach(k => sessionStorage.removeItem(k));
      } else {
        // Not stale — only clean the design-ui key (already consumed by initializers)
        sessionStorage.removeItem("tv-wizard-design-ui");
      }
    } catch { /* ignore */ }
  }, []);

  // ── Custom landing pages — sourced from global DesignLibraryContext ─────────
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("tv-saved-landing-page");
      if (raw) {
        const lp = JSON.parse(raw) as LandingPageDef;
        sessionStorage.removeItem("tv-saved-landing-page");
        globalAddLandingPage(lp);
        setStep(s => ({ ...s, landingPageId: lp.id, landingPageEnabled: true }));
      }
    } catch { /* ignore */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const allLandingPages: LandingPageDef[] = [...globalLandingPages, ...LANDING_PAGES];

  /** Navigate to an external builder (e.g. envelope designer) */
  const navigateToBuilder = useCallback((builderPath: string) => {
    const currentStep = WIZARD_STEPS[stepIndex].key;
    // Persist current wizard state so it survives the round-trip to the builder
    try {
      sessionStorage.setItem("tv-wizard-step-state", JSON.stringify(step));
      // Custom designs are now persisted globally via DesignLibraryContext (localStorage)
      // No need to save them to sessionStorage for round-trips
      // Persist design-step UI state
      sessionStorage.setItem("tv-wizard-design-ui", JSON.stringify({
        previewViewport, envTextBefore, envTextAfter, envNameFormat,
        envLineBreakBefore, envLineBreakAfter, attachmentType, trackingPixel, designSnapshot,
      }));
      // Record timestamp so stale keys can be cleaned up
      sessionStorage.setItem("tv-wizard-timestamp", String(Date.now()));
    } catch { /* ignore */ }
    const separator = builderPath.includes("?") ? "&" : "?";
    navigate(`${builderPath}${separator}returnTo=${encodeURIComponent(`/campaigns/create?returnStep=${currentStep}`)}`);
  }, [stepIndex, navigate, step, previewViewport, envTextBefore, envTextAfter, envNameFormat, envLineBreakBefore, envLineBreakAfter, attachmentType, trackingPixel, designSnapshot]);

  // Channel switching resets the step
  const switchChannel = (ch: "email" | "sms") => {
    if (ch !== step.type) setStep(makeDefaultStep(ch));
  };

  // AI
  const [showAi, setShowAi] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState(false);
  const [aiHasResult, setAiHasResult] = useState(false);
  const [showMerge, setShowMerge] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showBodyMergePicker, setShowBodyMergePicker] = useState(false);
  const [showBodySigPicker, setShowBodySigPicker] = useState(false);
  const bodySigRef = useRef<HTMLDivElement>(null);
  const [replyToInput, setReplyToInput] = useState("");
  const [contentTab, setContentTab] = useState<"message" | "design">("message");
  const [campaignLanguage, setCampaignLanguage] = useState("en");
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const bodyMergeRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState<Set<number>>(new Set());

  // RTE toolbar actions
  const applyFormat = useCallback((index: number) => {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = step.body || "";
    const selected = text.substring(start, end);
    let before = text.substring(0, start);
    let after = text.substring(end);
    let insert = "";
    let cursorOffset = 0;

    switch (index) {
      case 0: // Bold
        insert = selected ? `**${selected}**` : "**bold text**";
        cursorOffset = selected ? 0 : -2;
        break;
      case 1: // Italic
        insert = selected ? `*${selected}*` : "*italic text*";
        cursorOffset = selected ? 0 : -1;
        break;
      case 2: // Underline
        insert = selected ? `<u>${selected}</u>` : "<u>underline</u>";
        cursorOffset = selected ? 0 : -4;
        break;
      case 3: // Strikethrough
        insert = selected ? `~~${selected}~~` : "~~strikethrough~~";
        cursorOffset = selected ? 0 : -2;
        break;
      case 4: // AlignLeft (no-op for plaintext)
      case 5: // AlignCenter (no-op)
      case 6: // AlignRight (no-op)
      case 7: // AlignJustify (no-op)
        return;
      case 8: { // List
        const lineStart = text.lastIndexOf("\n", start - 1) + 1;
        before = text.substring(0, lineStart);
        const line = text.substring(lineStart, end);
        after = text.substring(end);
        insert = `• ${line}`;
        break;
      }
      case 9: // Indent
        insert = `  ${selected || ""}`;
        break;
      case 10: { // Outdent
        if (before.endsWith("  ")) {
          before = before.slice(0, -2);
          insert = selected;
        } else {
          insert = selected;
        }
        break;
      }
      case 11: // Link
        insert = selected ? `[${selected}](url)` : "[link text](url)";
        cursorOffset = selected ? -1 : -1;
        break;
      case 12: // Horizontal Rule
        insert = "\n---\n";
        break;
      default:
        return;
    }
    const newBody = before + insert + after;
    setStep(s => ({ ...s, body: newBody }));
    // Toggle active state for visual feedback
    setActiveFormats(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
    setTimeout(() => {
      setActiveFormats(prev => { const next = new Set(prev); next.delete(index); return next; });
    }, 200);
    setTimeout(() => {
      ta.focus();
      const newPos = before.length + insert.length + cursorOffset;
      ta.setSelectionRange(newPos, newPos);
    }, 10);
  }, [step.body, setStep]);

  const isEmail = step.type === "email";
  const smsLen = (step.smsBody || "").length;

  // Merge field validation �� check body for fields that aren't in constituent data
  const usedMergeFields = [...new Set([...((step.body || "") + (step.subject || "")).matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]))];
  const knownFields = ALL_MERGE_TOKENS.map(t => t.replace(/\{\{|\}\}/g, ""));
  const unknownMergeFields = usedMergeFields.filter(f => !knownFields.includes(f));

  // Merge field missing-data warning — simulate that some constituents are missing certain fields
  const FIELDS_WITH_GAPS: Record<string, { count: number; constituents: string[] }> = {
    gift_amount: { count: 4, constituents: ["Marcus Reid", "Emily Torres", "David Park", "Lisa Hamilton"] },
    fund_name:   { count: 3, constituents: ["Sarah Chen", "Marcus Reid", "Brian Kazuki"] },
    first_name:  { count: 2, constituents: ["Priya Nair", "David Park"] },
  };
  const mergeFieldsWithMissingData = usedMergeFields
    .filter(f => knownFields.includes(f) && FIELDS_WITH_GAPS[f])
    .map(f => ({
      field: f,
      missingCount: FIELDS_WITH_GAPS[f].count,
      affectedConstituents: FIELDS_WITH_GAPS[f].constituents,
    }));

  const handleAiGenerate = () => {
    setAiGenerating(true);
    setAiError(false);
    // Simulate 10% chance of error for realistic behavior
    const willError = Math.random() < 0.1;
    setTimeout(() => {
      if (willError) {
        setAiError(true);
        setAiGenerating(false);
        return;
      }
      if (isEmail) {
        setStep(s => ({ ...s, body: "Dear {{first_name}},\n\nYour incredible generosity has made a transformative difference for students at Hartwell University this year. Thanks to supporters like you, we\u2019ve been able to fund 12 new scholarships and expand our mentoring program to reach over 200 first-generation students.\n\nI wanted to take a moment to share a personal video message with you \u2014 because your impact truly deserves more than just words on a screen.\n\nWith gratitude,\nKelley Molt" }));
      } else {
        setStep(s => ({ ...s, smsBody: "Hi {{first_name}}! Thank you for your generous support of the Annual Fund. Your gift is making a real difference for students at Hartwell. Click here to see a message from us: {{link}}" }));
      }
      setAiGenerating(false);
      setAiHasResult(true);
      setShowAi(false);
    }, 1500);
  };

  // Steps to skip based on goal/delivery
  const shouldSkipStep = (key: WizardStepKey): boolean => {
    // Skip Video step for send-without-video (no video for this type)
    if (key === "video" && campaignGoal === "send-without-video") return true;
    // Skip Content & Design step for shareable link delivery (no email/SMS to compose)
    if (key === "content" && campaignGoal === "request-video" && vrDeliveryType === "link") return true;
    return false;
  };

  // Whether to show design sections in the combined content step
  const showDesignSections = isEmail && !(campaignGoal === "request-video" && vrDeliveryType === "link");

  const goNext = () => {
    // Mark configure as completed when advancing past it
    if (stepIndex === 0 && !configureCompleted) setConfigureCompleted(true);
    let next = stepIndex + 1;
    while (next < WIZARD_STEPS.length && shouldSkipStep(WIZARD_STEPS[next].key)) next++;
    if (next < WIZARD_STEPS.length) setStepIndex(next);
  };
  const [showModeConfirm, setShowModeConfirm] = useState(false);
  const goBack = () => {
    if (stepIndex === 0) {
      // At the first step — ask for confirmation if the user has made any progress
      const hasProgress = campaignGoal || campaignName !== "Untitled Campaign" || step.subject || step.body || constituents.length > 0;
      if (hasProgress) { setShowModeConfirm(true); return; }
      onBack();
      return;
    }
    let prev = stepIndex - 1;
    while (prev > 0 && shouldSkipStep(WIZARD_STEPS[prev].key)) prev--;
    setStepIndex(prev);
  };

  const handleFinish = () => {
    if (isEditMode) {
      show("✓ Campaign updated successfully!", "success");
      navigate(`/campaigns/${editCampaign!.id}`);
    } else {
      show("\ud83c\udf89 Campaign created!", "success");
      navigate("/campaigns");
    }
  };

  // toggleTag, addCustomTag, removeCustomTag, saveEditTag — now managed inside TagPicker

  // ── Step 1: Configure Your Campaign — type-aware layout ─────────────────
  const renderConfigureStep = () => {
    const isVideoRequest = campaignGoal === "request-video";
    // Whether the goal was pre-selected from the dropdown, template, or edit mode
    const goalPreSelected = isEditMode || initialGoal !== null || (initialTemplate?.goal != null);

    // Type metadata for the pre-selected banner
    const TYPE_META: Record<string, { icon: any; label: string; desc: string; color: string; bg: string }> = {
      "send-video":          { icon: Videotape, label: "Send with Video",    desc: "Record or choose a video to include in your campaign.",                    color: "#6d28d9", bg: "#f3eefa" },
      "send-without-video":  { icon: Mail,      label: "Send without Video", desc: "Email or SMS only — no video attachment.",                                  color: "#6d28d9", bg: "#f3eefa" },
      "request-video":       { icon: Bell,      label: "Video Request",      desc: "Collect videos from constituents via email, SMS, or a shareable link.",     color: "#15803d", bg: "#e6f9ed" },
    };

    const typeMeta = campaignGoal ? TYPE_META[campaignGoal] : null;

    return (
    <div className="max-w-[700px] xl:max-w-[800px] 2xl:max-w-[900px] mx-auto space-y-5">

      {/* ── Edit mode banner ── */}
      {isEditMode && (
        <div className="flex items-center gap-3 p-3.5 rounded-lg border border-tv-warning-border bg-tv-warning-bg">
          <div className="w-9 h-9 rounded-sm flex items-center justify-center shrink-0 bg-white">
            <Lock size={15} className="text-tv-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-tv-text-primary font-semibold">
              Configuration is locked
            </p>
            <p className="text-[11px] text-tv-text-secondary">
              Campaign name, type, channel, and metrics cannot be changed after creation. You can still add or remove tags.
            </p>
          </div>
        </div>
      )}

      {/* ── Template banner ── */}
      {initialTemplate && !isEditMode && (
        <div className="flex items-center gap-3 p-3.5 rounded-lg border border-tv-info-border bg-tv-info-bg">
          <div className="w-9 h-9 rounded-sm flex items-center justify-center shrink-0 bg-white">
            <Bookmark size={15} className="text-tv-info" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-tv-text-primary font-semibold">
              Started from template: {initialTemplate.name}
            </p>
            <p className="text-[11px] text-tv-text-secondary">
              Configuration has been pre-populated. Feel free to customize anything below.
            </p>
          </div>
        </div>
      )}

      {/* ── Section 1: Campaign Name ── */}
      <section className={`rounded-lg border border-tv-border-light bg-white overflow-hidden ${isEditMode ? "opacity-60" : ""}`}>
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-[13px] text-tv-text-primary" style={{ fontWeight: 700 }}>Campaign Name</p>
          </div>
          <input
            id="cfg-name"
            type="text"
            autoComplete="off"
            value={campaignName}
            onChange={e => { if (!isEditMode) { setCampaignName(e.target.value); markDirty(); } }}
            readOnly={isEditMode}
            placeholder="e.g. Spring Annual Fund Appeal"
            className={`w-full border border-tv-border-light rounded-md px-4 py-3 text-[14px] text-tv-text-primary outline-none transition-colors placeholder:text-tv-text-decorative ${isEditMode ? "bg-tv-surface text-tv-text-secondary cursor-not-allowed" : "focus:ring-2 focus:ring-tv-brand/30 focus:border-tv-brand"}`}
          />
          <p className="text-[11px] text-tv-text-secondary mt-2">{isEditMode ? "Campaign name cannot be changed after creation." : "Give your campaign a memorable name so it's easy to find later."}</p>
        </div>
      </section>

      {/* ── Section 2: Campaign Type ── */}
      {goalPreSelected && typeMeta ? (
        <section className={`rounded-lg border border-tv-border-light bg-white overflow-hidden ${isEditMode ? "opacity-60" : ""}`}>
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="w-11 h-11 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: typeMeta.bg }}>
              <typeMeta.icon size={20} style={{ color: typeMeta.color }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] text-tv-text-primary" style={{ fontWeight: 700 }}>{typeMeta.label}</p>
              <p className="text-[12px] text-tv-text-secondary leading-relaxed">{isEditMode ? "Campaign type cannot be changed after creation." : typeMeta.desc}</p>
            </div>
          </div>
        </section>
      ) : (
        <section className={`rounded-lg border border-tv-border-light bg-white overflow-hidden ${isEditMode ? "opacity-60 pointer-events-none" : ""}`}>
          <div className="flex items-center justify-between px-5 py-3.5 bg-tv-surface/50 border-b border-tv-border-divider">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-tv-brand-tint rounded-sm flex items-center justify-center">
                <Videotape size={15} className="text-tv-brand" />
              </div>
              <div>
                <p className="text-[13px] text-tv-text-primary" style={{ fontWeight: 700 }}>Campaign Type</p>
                <p className="text-[11px] text-tv-text-secondary">{isEditMode ? "Campaign type cannot be changed after creation." : "Will this campaign include a video?"}</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-3">
              {([
                { goal: "send-video" as CampaignGoal,         icon: Videotape, label: "Send with Video",    desc: "Record or choose a video to include" },
                { goal: "send-without-video" as CampaignGoal, icon: Mail,      label: "Send without Video", desc: "Email or SMS only — no video attachment" },
              ]).map(opt => {
                const selected = campaignGoal === opt.goal;
                return (
                  <button key={opt.goal} onClick={() => { if (!isEditMode) { setCampaignGoal(opt.goal); markDirty(); } }}
                    disabled={isEditMode}
                    className={`relative p-5 rounded-lg border-2 text-left transition-all ${
                      selected ? "border-tv-brand-bg bg-tv-brand-tint shadow-sm" : "border-tv-border-light hover:border-tv-border-strong"
                    } ${isEditMode ? "opacity-60 cursor-not-allowed" : ""}`}>
                    <div className={`w-10 h-10 rounded-md ${selected ? "bg-tv-brand-tint" : "bg-tv-surface"} flex items-center justify-center mb-3`}>
                      <opt.icon size={18} className={selected ? "text-tv-brand" : "text-tv-text-secondary"} />
                    </div>
                    <p className="text-[14px] text-tv-text-primary font-semibold">{opt.label}</p>
                    <p className="text-[11px] text-tv-text-secondary mt-0.5">{opt.desc}</p>
                    {selected && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-tv-brand-bg flex items-center justify-center">
                        <Check size={11} className="text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Section 3: Delivery — type-aware ── */}
      <section className={`rounded-lg border border-tv-border-light bg-white overflow-hidden ${isEditMode ? "opacity-60 pointer-events-none" : ""}`}>
        <div className="flex items-center justify-between px-5 py-3.5 bg-tv-surface/50 border-b border-tv-border-divider">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-tv-brand-tint rounded-sm flex items-center justify-center">
              <Send size={15} className="text-tv-brand" />
            </div>
            <div>
              <p className="text-[13px] text-tv-text-primary" style={{ fontWeight: 700 }}>{isVideoRequest ? "Delivery Method" : "Delivery Channel"}</p>
              <p className="text-[11px] text-tv-text-secondary">{isEditMode ? "Delivery channel cannot be changed after creation." : isVideoRequest ? "How do you want to reach your recorders?" : "How do you want to reach your constituents?"}</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          {isVideoRequest ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                {VR_DELIVERY_TYPES.map(dt => {
                  const selected = vrDeliveryType === dt.id;
                  return (
                    <button key={dt.id} onClick={() => { if (!isEditMode) { setVrDeliveryType(dt.id); if (dt.id !== "link") switchChannel(dt.id); markDirty(); } }}
                      disabled={isEditMode}
                      className={`p-5 rounded-lg border-2 text-left transition-all ${
                        selected ? "border-tv-brand-bg bg-tv-brand-tint shadow-sm" : "border-tv-border-light hover:border-tv-border-strong"
                      } ${isEditMode ? "opacity-60 cursor-not-allowed" : ""}`}>
                      <div className={`w-10 h-10 rounded-md ${selected ? "bg-tv-brand-tint" : "bg-tv-surface"} flex items-center justify-center mb-3`}>
                        <dt.icon size={18} className={selected ? "text-tv-brand" : "text-tv-text-secondary"} />
                      </div>
                      <p className="text-[14px] text-tv-text-primary font-semibold">{dt.label}</p>
                      <p className="text-[11px] text-tv-text-secondary mt-0.5">{dt.desc}</p>
                    </button>
                  );
                })}
              </div>
              {vrDeliveryType === "link" && (
                <div className="mt-4 p-3 bg-tv-info-bg border border-tv-info-border rounded-md flex gap-2">
                  <Info size={12} className="text-tv-info shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] text-tv-info font-semibold">Shareable Link</p>
                    <p className="text-[10px] text-tv-info">A unique URL will be generated that you can copy and share anywhere — social media, websites, QR codes, etc.</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {([
                { type: "email" as CampaignChannel, icon: Mail,          label: "Email", desc: campaignGoal === "send-video" ? "Send a personalized email with video" : "Send a personalized email campaign", color: "text-tv-brand", bg: "bg-tv-brand-tint" },
                { type: "sms" as CampaignChannel,   icon: MessageSquare, label: "SMS",   desc: campaignGoal === "send-video" ? "Send a text message with video link" : "Send a text message campaign",       color: "text-tv-info",  bg: "bg-tv-info-bg" },
              ]).map(ch => {
                const selected = campaignCh === ch.type;
                return (
                  <button key={ch.type} onClick={() => { if (!isEditMode) { setCampaignCh(ch.type); switchChannel(ch.type); markDirty(); } }}
                    disabled={isEditMode}
                    className={`p-5 rounded-lg border-2 text-left transition-all ${
                      selected ? "border-tv-brand-bg bg-tv-brand-tint shadow-sm" : "border-tv-border-light hover:border-tv-border-strong"
                    } ${isEditMode ? "opacity-60 cursor-not-allowed" : ""}`}>
                    <div className={`w-10 h-10 rounded-md ${selected ? ch.bg : "bg-tv-surface"} flex items-center justify-center mb-3`}>
                      <ch.icon size={18} className={selected ? ch.color : "text-tv-text-secondary"} />
                    </div>
                    <p className="text-[14px] text-tv-text-primary font-semibold">{ch.label}</p>
                    <p className="text-[11px] text-tv-text-secondary mt-0.5">{ch.desc}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Section 4: Success Metrics ── */}
      <section className={`rounded-lg border border-tv-border-light bg-white overflow-hidden ${isEditMode ? "opacity-60 pointer-events-none" : ""}`}>
        <div className="flex items-center justify-between px-5 py-3.5 bg-tv-surface/50 border-b border-tv-border-divider">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-tv-brand-tint rounded-sm flex items-center justify-center">
              <Target size={15} className="text-tv-brand" />
            </div>
            <div>
              <p className="text-[13px] text-tv-text-primary" style={{ fontWeight: 700 }}>Success Metrics</p>
              <p className="text-[11px] text-tv-text-secondary">{isEditMode ? "Metrics cannot be changed after creation." : "Define how you'll measure success (add multiple)"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowMetricsInfo(v => !v)} aria-label="What are success metrics?" className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${showMetricsInfo ? "bg-tv-brand-bg text-white" : "bg-tv-surface text-tv-text-secondary hover:bg-tv-surface-hover"}`}>
              <Info size={10} />
            </button>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedMetrics.length >= 1 ? "bg-tv-success-bg text-tv-success border border-tv-success-border" : "bg-tv-surface text-tv-text-secondary border border-tv-border-light"}`} style={{ fontWeight: 700 }}>
              {selectedMetrics.length}/5
            </span>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-tv-danger-bg text-tv-danger border border-tv-danger-border font-semibold">REQUIRED</span>
          </div>
        </div>
        <div className="p-5 space-y-3">
          {showMetricsInfo && (
            <div className="p-3 bg-tv-brand-tint border border-tv-brand-bg/20 rounded-sm">
              <p className="text-[11px] text-tv-brand leading-relaxed">
                Success metrics define which KPIs appear on your campaign dashboard after sending. Pick the outcomes that matter most to your team — whether that&rsquo;s maximizing opens and clicks, or monitoring deliverability. Selected metrics will be tracked in real time and included in post-campaign reports.
              </p>
            </div>
          )}

          {selectedMetrics.length === 0 && (
            <div className="flex items-center gap-1.5 p-2.5 bg-tv-warning-bg border border-tv-warning-border rounded-sm">
              <TriangleAlert size={11} className="text-tv-warning shrink-0" />
              <p className="text-[10px] text-tv-warning">Select at least 1 metric to continue.</p>
            </div>
          )}
          {selectedMetrics.length >= 5 && (
            <div className="flex items-center gap-1.5 p-2.5 bg-tv-info-bg border border-tv-info-border rounded-sm">
              <Info size={11} className="text-tv-info shrink-0" />
              <p className="text-[10px] text-tv-info">Maximum reached. Deselect one to swap.</p>
            </div>
          )}

          <div>
            <p className="text-[10px] text-tv-text-label uppercase tracking-wider mb-1.5 font-semibold">Delivery</p>
            <div className="flex flex-wrap gap-1.5">
              {SUCCESS_METRICS.filter(m => m.category === "delivery").map(m => <MetricChip key={m.id} metric={m} active={selectedMetrics.includes(m.id)} disabled={!selectedMetrics.includes(m.id) && selectedMetrics.length >= 5} onToggle={toggleMetric} />)}
            </div>
          </div>

          <div>
            <p className="text-[10px] text-tv-text-label uppercase tracking-wider mb-1.5 font-semibold">Engagement</p>
            <div className="flex flex-wrap gap-1.5">
              {SUCCESS_METRICS.filter(m => m.category === "engagement").map(m => <MetricChip key={m.id} metric={m} active={selectedMetrics.includes(m.id)} disabled={!selectedMetrics.includes(m.id) && selectedMetrics.length >= 5} onToggle={toggleMetric} />)}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <p className="text-[10px] text-tv-text-label uppercase tracking-wider font-semibold">Drop-off & Issues</p>
              <button onClick={() => setShowDropoffInfo(v => !v)} className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${showDropoffInfo ? "bg-tv-danger text-white" : "bg-tv-surface text-tv-text-decorative hover:bg-tv-surface-hover"}`}>
                <Info size={8} />
              </button>
            </div>
            {showDropoffInfo && (
              <div className="p-2.5 bg-tv-danger-bg border border-tv-danger/15 rounded-sm mb-1.5">
                <p className="text-[10px] text-tv-danger/80 leading-relaxed">
                  These are watchdog metrics — track them to spot deliverability problems early (bounces, spam complaints), identify who didn&rsquo;t engage for follow-up outreach, and catch unsubscribe spikes before they affect sender reputation.
                </p>
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {SUCCESS_METRICS.filter(m => m.category === "negative").map(m => <MetricChip key={m.id} metric={m} active={selectedMetrics.includes(m.id)} disabled={!selectedMetrics.includes(m.id) && selectedMetrics.length >= 5} negative onToggle={toggleMetric} />)}
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 5: Campaign Tags ── */}
      <section className="rounded-lg border border-tv-border-light bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 bg-tv-surface/50 border-b border-tv-border-divider">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-tv-brand-tint rounded-sm flex items-center justify-center">
              <Tag size={15} className="text-tv-brand" />
            </div>
            <div>
              <p className="text-[13px] text-tv-text-primary" style={{ fontWeight: 700 }}>Campaign Tags</p>
              <p className="text-[11px] text-tv-text-secondary">Organize and categorize your campaign</p>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-tv-surface border border-tv-border-light text-tv-text-secondary font-semibold">OPTIONAL</span>
        </div>
        <div className="p-5">
          <TagPicker
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            markDirty={markDirty}
          />
        </div>
      </section>
    </div>
    );
  };

  // ── Step 5: Design (two-column: scrolling left + sticky preview right) ────────
  const filteredLandingPages = allLandingPages.filter(p => !lpSearch || p.name.toLowerCase().includes(lpSearch.toLowerCase()));
  const brandedEnvelopes = allEnvelopes.filter(e => (e as any).category === "standard");
  const holidayEnvelopes = allEnvelopes.filter(e => (e as any).category === "holiday");
  const legacyEnvelopes = allEnvelopes.filter(e => (e as any).category === "legacy");
  const filteredEnvelopes = (cat: string) => {
    const src = cat === "branded" ? brandedEnvelopes : cat === "holiday" ? holidayEnvelopes : legacyEnvelopes;
    return src.filter(e => !envelopeSearch || e.name.toLowerCase().includes(envelopeSearch.toLowerCase()));
  };

  // ── Step 2: Content & Design ────────────────────────────────────────────────
  const isVideoRequestContent = campaignGoal === "request-video" && vrDeliveryType !== "link";

  const renderContentStep = () => (
    <div className="max-w-[1020px] xl:max-w-[1160px] 2xl:max-w-[1360px] mx-auto">
      {/* Video Request email/SMS gets a tailored header */}
      {isVideoRequestContent ? (
        <>
          <h2 className="text-tv-text-primary mb-2" style={{ fontSize: "24px", fontWeight: 900 }}>Video Request Message</h2>
          <p className="text-[13px] text-tv-text-secondary mb-2">Compose the {vrDeliveryType === "email" ? "email" : "SMS"} that invites people to record a video.</p>
          <div className="p-3 bg-tv-info-bg border border-tv-info-border rounded-md flex gap-2 mb-5">
            <Info size={12} className="text-tv-info shrink-0 mt-0.5" />
            <p className="text-[10px] text-tv-info">A "Record Video" CTA button will be automatically included. You can customize it below.</p>
          </div>
        </>
      ) : (
        <>
          <h2 className="text-tv-text-primary mb-2" style={{ fontSize: "24px", fontWeight: 900 }}>{isEmail ? "Content & Design" : "SMS Content"}</h2>
          <p className="text-[13px] text-tv-text-secondary mb-5">{isEmail ? "Compose your message, customize the envelope, landing page, and CTA — all in one place." : "Compose your message below."}</p>
        </>
      )}

      {isEmail ? (
        <ResizableSplitPane
          defaultRightPercent={42}
          minRightPercent={25}
          maxRightPercent={60}
          stickyRight
          stickyTop="1rem"
          left={
          <div className="space-y-4">

          {/* ── Tab bar: Message / Design ── */}
          {showDesignSections && (
            <SegmentedControl
              value={contentTab}
              onChange={v => {
                setContentTab(v as "message" | "design");
                setShowEmoji(false);
                setShowMerge(false);
                setShowBodySigPicker(false);
                setShowBodyMergePicker(false);
              }}
              fullWidth
              size="sm"
              data={[
                { value: "message", label: (
                  <div className="flex items-center gap-1.5 justify-center">
                    <Mail size={13} />
                    <span>Message</span>
                  </div>
                )},
                { value: "design", label: (
                  <div className="flex items-center gap-1.5 justify-center">
                    <Palette size={13} />
                    <span>Design</span>
                  </div>
                )},
              ]}
            />
          )}

          {(contentTab === "message" || !showDesignSections) && <>
          {/* Template & Signature actions */}
          <EmailTemplateActions
            onApplyTemplate={(tpl) => {
              setStep(s => ({ ...s, subject: tpl.subject, body: tpl.body }));
            }}
          />

          {/* Subject */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={LABEL_CLS}>Subject Line</label>
              <CharCount current={(step.subject || "").length} max={CHAR_LIMITS.subject} />
            </div>
            <div className="flex items-center gap-1.5">
              <input value={step.subject || ""} onChange={e => setStep(s => ({ ...s, subject: e.target.value }))}
                maxLength={CHAR_LIMITS.subject}
                placeholder="A personal message for you, {{first_name}}"
                className={INPUT_CLS_FLEX} />
              {/* Emoji picker */}
              <div className="relative">
                <button onClick={() => { setShowEmoji(!showEmoji); setShowMerge(false); }} className={ICON_BTN_CLS} title="Insert emoji">
                  <Smile size={14} />
                </button>
                {showEmoji && (
                  <EmojiDropdown
                    onSelect={e => setStep(s => ({ ...s, subject: (s.subject || "") + e }))}
                    onClose={() => setShowEmoji(false)}
                  />
                )}
              </div>
              {/* Merge field picker */}
              <div className="relative">
                <button onClick={() => { setShowMerge(!showMerge); setShowEmoji(false); }} className={ICON_BTN_CLS} title="Insert merge field">
                  <span className="font-mono text-[11px]">{"{}"}</span>
                </button>
                {showMerge && (
                  <MergeFieldDropdown
                    onSelect={f => setStep(s => ({ ...s, subject: (s.subject || "") + " " + f }))}
                    onClose={() => setShowMerge(false)}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Sender info */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={LABEL_CLS}>Sender Name</label>
                <CharCount current={(step.senderName || "").length} max={CHAR_LIMITS.senderName} />
              </div>
              <input value={step.senderName || ""} onChange={e => setStep(s => ({ ...s, senderName: e.target.value }))} maxLength={CHAR_LIMITS.senderName} className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Sender Email</label>
              <input value={step.senderEmail || ""} onChange={e => setStep(s => ({ ...s, senderEmail: e.target.value }))} className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Reply-To <span className="text-tv-text-decorative normal-case" style={{ fontWeight: 400 }}>(multiple allowed)</span></label>
              <div className={TAG_INPUT_WRAPPER_CLS}>
                {(step.replyToList || []).map((email, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-tv-brand-tint border border-tv-border rounded-full px-2 py-0.5 text-[11px] text-tv-brand">
                    {email}
                    <button onClick={() => setStep(s => ({ ...s, replyToList: (s.replyToList || []).filter((_, j) => j !== i) }))} className="hover:text-tv-danger" aria-label={`Remove ${email}`}><X size={9} /></button>
                  </span>
                ))}
                <input value={replyToInput} onChange={e => setReplyToInput(e.target.value)}
                  onKeyDown={e => {
                    if ((e.key === "Enter" || e.key === ",") && replyToInput.trim()) {
                      e.preventDefault();
                      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyToInput.trim())) {
                        setStep(s => ({ ...s, replyToList: [...(s.replyToList || []), replyToInput.trim()] }));
                        setReplyToInput("");
                      }
                    }
                  }}
                  onBlur={() => { if (replyToInput.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyToInput.trim())) { setStep(s => ({ ...s, replyToList: [...(s.replyToList || []), replyToInput.trim()] })); setReplyToInput(""); } }}
                  placeholder={(step.replyToList || []).length === 0 ? "giving@hartwell.edu" : "Add another…"}
                  aria-label="Reply-to email address"
                  className="flex-1 min-w-[100px] text-[12px] outline-none focus:ring-1 focus:ring-tv-brand/40 bg-transparent" />
              </div>
            </div>
          </div>

          {/* CC / BCC (collapsible) */}
          <details className="group">
            <summary className="text-[10px] text-tv-brand uppercase tracking-wider cursor-pointer hover:underline list-none flex items-center gap-1 font-semibold">
              <ChevronRight size={10} className="transition-transform group-open:rotate-90" />CC / BCC <span className="text-tv-text-decorative normal-case" style={{ fontWeight: 400 }}>(optional)</span>
            </summary>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className={LABEL_CLS}>CC</label>
                <input value={step.ccAddresses || ""} onChange={e => setStep(s => ({ ...s, ccAddresses: e.target.value }))}
                  placeholder="cc@example.com"
                  className={INPUT_CLS} />
              </div>
              <div>
                <label className={LABEL_CLS}>BCC</label>
                <input value={step.bccAddresses || ""} onChange={e => setStep(s => ({ ...s, bccAddresses: e.target.value }))}
                  placeholder="bcc@example.com"
                  className={INPUT_CLS} />
              </div>
            </div>
            <p className={HELPER_CLS}>Comma-separated. Applies per constituent on send.</p>
          </details>

          {/* Message Body */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <label className={LABEL_CLS} style={{ marginBottom: 0 }}>Message Body</label>
                {(step.body || "").trim().length > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-tv-success-bg text-tv-success shrink-0 font-semibold">
                    {htmlTextLength(step.body || "").toLocaleString()} chars
                  </span>
                )}
              </div>
              <BodyHeaderCount length={htmlTextLength(step.body || "")} limit={CHAR_LIMITS.body} />
            </div>
            <div className="space-y-3">
            {(() => { const _ew = getEditorWarnCls(htmlTextLength(step.body || ""), CHAR_LIMITS.body); return (
            <div className={`${RTE_WRAPPER_BASE_CLS} relative transition-colors ${_ew.wrapperCls || "border-tv-border-light"}`}>
              {/* Row 1: Font family, size, text color, line height */}
              <div className="flex items-center gap-2.5 px-3 py-2 bg-tv-surface border-b border-tv-border-light flex-wrap rounded-t-[9px]">
                {/* Font family */}
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] text-tv-text-secondary uppercase tracking-wider whitespace-nowrap font-semibold">Font</label>
                  <select
                    value={step.bodyFontFamily || EMAIL_BODY_FONTS[0].value}
                    onChange={e => setStep(s => ({ ...s, bodyFontFamily: e.target.value }))}
                    title="Font Family"
                    className="border border-tv-border-light rounded-sm px-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand bg-white cursor-pointer"
                    style={{ fontFamily: step.bodyFontFamily || EMAIL_BODY_FONTS[0].value }}
                  >
                    {EMAIL_BODY_FONTS.map(f => (
                      <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div className="h-5 w-px bg-tv-border-light" />
                {/* Font size */}
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] text-tv-text-secondary uppercase tracking-wider whitespace-nowrap font-semibold">Size</label>
                  <select
                    value={step.bodyFontSize || 14}
                    onChange={e => setStep(s => ({ ...s, bodyFontSize: Number(e.target.value) }))}
                    title="Font Size"
                    className="border border-tv-border-light rounded-sm px-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand bg-white cursor-pointer"
                  >
                    {EMAIL_BODY_FONT_SIZES.map(s => (
                      <option key={s} value={s}>{s}px</option>
                    ))}
                  </select>
                </div>
                <div className="h-5 w-px bg-tv-border-light" />
                {/* Text color picker */}
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] text-tv-text-secondary uppercase tracking-wider whitespace-nowrap font-semibold">Color</label>
                  <div className="relative group/tcolor">
                    <button
                      type="button"
                      title="Text Color"
                      className="flex items-center gap-1.5 border border-tv-border-light rounded-sm px-3 py-1.5 text-[13px] bg-white hover:border-tv-border-strong transition-colors cursor-pointer"
                    >
                      <span className="w-4 h-4 rounded-[4px] border border-tv-border-light shrink-0" style={{ backgroundColor: step.bodyTextColor || "#1e293b" }} />
                      <span className="text-tv-text-primary">{EMAIL_TEXT_COLORS.find(c => c.value === (step.bodyTextColor || "#1e293b"))?.label || "Custom"}</span>
                      <ChevronDown size={11} className="text-tv-text-secondary" />
                    </button>
                    <div className="absolute top-full left-0 mt-1.5 p-2.5 bg-white border border-tv-border-light rounded-md shadow-xl z-30 hidden group-hover/tcolor:grid grid-cols-5 gap-1.5 w-[155px]">
                      {EMAIL_TEXT_COLORS.map(c => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setStep(s => ({ ...s, bodyTextColor: c.value }))}
                          title={c.label}
                          className={`w-5.5 h-5.5 rounded-full border-2 transition-transform hover:scale-110 ${(step.bodyTextColor || "#1e293b") === c.value ? "border-tv-brand ring-1 ring-tv-brand/30" : "border-tv-border-light"}`}
                          style={{ backgroundColor: c.value }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="h-5 w-px bg-tv-border-light" />
                {/* Line height */}
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] text-tv-text-secondary uppercase tracking-wider whitespace-nowrap font-semibold">Spacing</label>
                  <select
                    value={step.bodyLineHeight || 1.5}
                    onChange={e => setStep(s => ({ ...s, bodyLineHeight: Number(e.target.value) }))}
                    title="Line Spacing"
                    className="border border-tv-border-light rounded-sm px-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand bg-white cursor-pointer"
                  >
                    {EMAIL_BODY_LINE_HEIGHTS.map(lh => (
                      <option key={lh.value} value={lh.value}>{lh.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Row 2: Formatting buttons + merge fields */}
              <div className="flex items-center gap-0.5 px-3 py-1.5 bg-tv-surface border-b border-tv-border-light flex-wrap">
                {[Bold, Italic, Underline, Strikethrough].map((TbIcon, i) => (
                  <button key={i} onClick={() => applyFormat(i)} title={["Bold", "Italic", "Underline", "Strikethrough"][i]} className={`${TOOLBAR_BTN_LG_CLS} ${activeFormats.has(i) ? TOOLBAR_BTN_ACTIVE_CLS : TOOLBAR_BTN_IDLE_CLS}`}><TbIcon size={13} /></button>
                ))}
                <div className="h-4 w-px bg-tv-border-light mx-1" />
                {[AlignLeft, AlignCenter, AlignRight, AlignJustify].map((TbIcon, i) => (
                  <button key={`a${i}`} onClick={() => applyFormat(i + 4)} title={["Align Left", "Align Center", "Align Right", "Justify"][i]} className={`${TOOLBAR_BTN_LG_CLS} ${activeFormats.has(i + 4) ? TOOLBAR_BTN_ACTIVE_CLS : TOOLBAR_BTN_IDLE_CLS}`}><TbIcon size={13} /></button>
                ))}
                <div className="h-4 w-px bg-tv-border-light mx-1" />
                <button onClick={() => applyFormat(8)} title="Bulleted List" className={`${TOOLBAR_BTN_LG_CLS} ${activeFormats.has(8) ? TOOLBAR_BTN_ACTIVE_CLS : TOOLBAR_BTN_IDLE_CLS}`}><List size={13} /></button>
                <button onClick={() => applyFormat(9)} title="Indent" className={`${TOOLBAR_BTN_LG_CLS} ${TOOLBAR_BTN_IDLE_CLS}`}><IndentIncrease size={13} /></button>
                <button onClick={() => applyFormat(10)} title="Outdent" className={`${TOOLBAR_BTN_LG_CLS} ${TOOLBAR_BTN_IDLE_CLS}`}><IndentDecrease size={13} /></button>
                <div className="h-4 w-px bg-tv-border-light mx-1" />
                <button onClick={() => applyFormat(11)} title="Insert Link" className={`${TOOLBAR_BTN_LG_CLS} ${TOOLBAR_BTN_IDLE_CLS}`}><Link size={13} /></button>
                <button onClick={() => applyFormat(12)} title="Horizontal Rule" className={`${TOOLBAR_BTN_LG_CLS} ${TOOLBAR_BTN_IDLE_CLS}`}><Minus size={13} /></button>
                {/* Signature insert */}
                <div className="relative" ref={bodySigRef}>
                  <button
                    type="button"
                    onClick={() => { setShowBodySigPicker(!showBodySigPicker); setShowBodyMergePicker(false); }}
                    className={`${TOOLBAR_BTN_LG_CLS} ${showBodySigPicker ? TOOLBAR_BTN_ACTIVE_CLS : TOOLBAR_BTN_IDLE_CLS}`}
                    title="Insert Signature"
                    aria-label="Insert email signature"
                  >
                    <PenLine size={13} />
                  </button>
                  {showBodySigPicker && createPortal(
                    <>
                      <div className="fixed inset-0 z-[9998]" onClick={() => setShowBodySigPicker(false)} />
                      <div
                        className="fixed z-[9999] w-[260px] bg-white rounded-md border border-tv-border-light shadow-xl overflow-hidden"
                        style={(() => {
                          const r = bodySigRef.current?.getBoundingClientRect();
                          if (!r) return { visibility: "hidden" as const };
                          let left = r.left;
                          if (left + 260 > window.innerWidth - 8) left = window.innerWidth - 268;
                          return { top: r.bottom + 6, left };
                        })()}
                      >
                        <div className="px-3 py-2 border-b border-tv-border-divider">
                          <p className="text-[11px] text-tv-text-primary font-semibold">Insert Signature</p>
                        </div>
                        <div className="py-1.5 max-h-[240px] overflow-y-auto">
                          {SAVED_SIGNATURES.map(sig => (
                            <button
                              key={sig.id}
                              onClick={() => {
                                setStep(s => ({ ...s, body: (s.body || "") + sig.html }));
                                setShowBodySigPicker(false);
                              }}
                              className="w-full text-left px-3 py-2 flex items-start gap-2 transition-colors hover:bg-tv-surface-hover"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] text-tv-text-primary truncate" style={{ fontWeight: 500 }}>
                                  {sig.name}
                                  {sig.isDefault && (
                                    <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-tv-brand-bg/10 text-tv-brand" style={{ fontWeight: 500 }}>Default</span>
                                  )}
                                </p>
                                {sig.title && <p className="text-[10px] text-tv-text-secondary truncate">{sig.title}</p>}
                                {sig.org && <p className="text-[10px] text-tv-text-decorative truncate">{sig.org}</p>}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>,
                    document.body,
                  )}
                </div>
                <div className="h-4 w-px bg-tv-border-light mx-1" />
                <div className="relative" ref={bodyMergeRef}>
                  <button
                    type="button"
                    onClick={() => setShowBodyMergePicker(!showBodyMergePicker)}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded-[6px] text-[11px] transition-colors ${
                      showBodyMergePicker
                        ? "bg-tv-brand-bg/10 text-tv-brand"
                        : "text-tv-text-secondary hover:bg-tv-surface-hover hover:text-tv-text-primary"
                    }`}
                    style={{ fontWeight: 500 }}
                    title="Insert Merge Field"
                  >
                    <Braces size={12} />
                    <span className="hidden sm:inline">Merge Fields</span>
                  </button>
                  {showBodyMergePicker && (
                    <MergeFieldPicker
                      onInsert={token => setStep(s => ({ ...s, body: (s.body || "") + " " + token }))}
                      onClose={() => setShowBodyMergePicker(false)}
                    />
                  )}
                </div>
              </div>
              <textarea ref={bodyRef} value={step.body || ""} onChange={e => setStep(s => ({ ...s, body: e.target.value }))} rows={8}
                placeholder={"Dear {{first_name}},\n\nI wanted to reach out personally\u2026"}
                aria-label="Email body"
                style={{
                  fontFamily: step.bodyFontFamily || EMAIL_BODY_FONTS[0].value,
                  fontSize: `${step.bodyFontSize || 14}px`,
                  color: step.bodyTextColor || "#1e293b",
                  lineHeight: step.bodyLineHeight || 1.5,
                }}
                className={`${RTE_BODY_CLS} transition-colors ${_ew.bodyCls}`} />
            </div>); })()}
            <EmailBodyCharCounter length={htmlTextLength(step.body || "")} />
            {/* Merge field warning — unrecognized fields */}
            {unknownMergeFields.length > 0 && (
              <div className="p-2 bg-tv-warning-bg border border-tv-warning-border rounded-sm flex items-start gap-1.5">
                <AlertTriangle size={11} className="text-tv-warning shrink-0 mt-0.5" />
                <p className="text-[10px] text-tv-warning">Unrecognized merge field{unknownMergeFields.length > 1 ? "s" : ""}: {unknownMergeFields.map(f => `{{${f}}}`).join(", ")}. These may appear blank for some constituents.</p>
              </div>
            )}
            {/* Merge field warning — missing constituent data */}
            {mergeFieldsWithMissingData.length > 0 && (
              <div className="p-2 bg-tv-warning-bg border border-tv-warning-border rounded-sm flex items-start gap-1.5">
                <CircleAlert size={11} className="text-tv-warning shrink-0 mt-0.5" />
                <div className="text-[10px] text-tv-warning">
                  <p className="mb-0.5 font-semibold">Some constituents are missing data for merge fields you&rsquo;re using:</p>
                  <ul className="space-y-0.5">
                    {mergeFieldsWithMissingData.map(f => (
                      <li key={f.field}><span className="font-mono">{`{{${f.field}}}`}</span> &mdash; {f.missingCount} constituent{f.missingCount > 1 ? "s" : ""} missing this field (will appear blank)</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* AI writer — inline with the RTE */}
            <div>
              <button onClick={() => setShowAi(!showAi)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[14px] border transition-all ${showAi ? "border-tv-brand-bg bg-tv-brand-tint text-tv-brand" : "border-tv-border-light text-tv-text-secondary hover:border-tv-border-strong hover:text-tv-brand"}`} style={{ fontWeight: 500 }}>
                <Sparkles size={13} />Write with AI
              </button>
              {showAi && (
                <div className="mt-2 p-2.5 bg-tv-brand-tint border border-tv-border-strong rounded-md space-y-2">
                  <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="e.g. Write a heartfelt thank-you message&#x2026;" rows={2}
                    aria-label="AI writing prompt"
                    className="w-full border border-tv-border rounded-sm px-2.5 py-1.5 text-[12px] outline-none resize-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand" />
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowAi(false)} className="px-2.5 py-1 text-[11px] text-tv-text-secondary hover:text-tv-brand">Cancel</button>
                    {aiGenerating ? (
                      <button onClick={() => { setAiGenerating(false); }} className="px-3 py-1 bg-tv-danger text-white text-[11px] rounded-full hover:bg-tv-danger-hover transition-colors flex items-center gap-1 font-semibold">
                        <StopCircle size={10} />Stop
                      </button>
                    ) : (
                      <>
                        <button onClick={handleAiGenerate} disabled={!aiPrompt.trim()}
                          className="px-3 py-1 bg-tv-brand-bg text-white text-[11px] rounded-full hover:bg-tv-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 font-semibold">
                          <Sparkles size={10} />{aiHasResult ? "Regenerate" : "Generate"}
                        </button>
                        {aiHasResult && (
                          <button onClick={() => { setAiPrompt(""); setAiHasResult(false); handleAiGenerate(); }}
                            className="px-3 py-1 border border-tv-border-light text-tv-text-secondary text-[11px] rounded-full hover:border-tv-brand hover:text-tv-brand transition-colors flex items-center gap-1 font-semibold">
                            <RefreshCw size={10} />New prompt
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  {aiError && (
                    <div className="p-2 bg-tv-danger-bg border border-tv-danger-border rounded-sm flex items-start gap-1.5">
                      <AlertTriangle size={11} className="text-tv-danger shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-tv-danger font-semibold">AI service unavailable</p>
                        <p className="text-[10px] text-tv-danger">The AI writing service is temporarily down. Please try again in a moment or write your message manually.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            </div>
          </div>

          {/* Video thumbnail toggle (only for email campaigns with video) */}
          {step.type === "email" && campaignGoal !== "send-without-video" && (
            null
          )}
          </>}

          {/* ── Design tab ── */}
          {contentTab === "design" && showDesignSections && (
            <>
              <DesignStepPanel
                inline
                hideVideoActions={campaignGoal === "send-without-video"}
                lpSearch={lpSearch}
                onLpSearchChange={setLpSearch}
                lpSectionOpen={lpSectionOpen}
                onLpSectionToggle={() => setLpSectionOpen(o => !o)}
                filteredLandingPages={filteredLandingPages}
                selectedLandingPageId={step.landingPageId}
                onSelectLandingPage={id => setStep(s => ({ ...s, landingPageId: id }))}
                onNavigateToBuilder={navigateToBuilder}
                envelopeSearch={envelopeSearch}
                onEnvelopeSearchChange={setEnvelopeSearch}
                envSectionOpen={envSectionOpen}
                onEnvSectionToggle={key => setEnvSectionOpen(prev => ({ ...prev, [key]: !prev[key] }))}
                filteredEnvelopes={filteredEnvelopes}
                selectedEnvelopeId={step.envelopeId}
                onSelectEnvelope={id => setStep(s => ({ ...s, envelopeId: id }))}
                envTextBefore={envTextBefore}
                onEnvTextBeforeChange={setEnvTextBefore}
                envLineBreakBefore={envLineBreakBefore}
                onEnvLineBreakBeforeChange={setEnvLineBreakBefore}
                envNameFormat={envNameFormat}
                onEnvNameFormatChange={setEnvNameFormat}
                envLineBreakAfter={envLineBreakAfter}
                onEnvLineBreakAfterChange={setEnvLineBreakAfter}
                envTextAfter={envTextAfter}
                onEnvTextAfterChange={setEnvTextAfter}
                attachmentType={attachmentType}
                onAttachmentTypeChange={setAttachmentType}
                step={step}
                onToggle={key => { const enabled = step[key] !== false; setStep(s => ({ ...s, [key]: !enabled })); }}
                onCtaTextChange={v => setStep(s => ({ ...s, ctaText: v }))}
                onBtnBgChange={v => setStep(s => ({ ...s, btnBg: v }))}
                onBtnTextChange={v => setStep(s => ({ ...s, btnText: v }))}
                trackingPixel={trackingPixel}
                onTrackingPixelChange={setTrackingPixel}
                previewViewport={previewViewport}
                onPreviewViewportChange={setPreviewViewport}
                selectedEnvelopeData={allEnvelopes.find(e => e.id === (step.envelopeId || 1)) as any}
                selectedLandingPageData={allLandingPages.find(p => p.id === (step.landingPageId || 1)) as any}
                onDesignDataChange={setDesignSnapshot}
              />
            </>
          )}

          </div>
          }
          right={
          <div>
            <LivePreviewPanel
              subject={step.subject}
              body={step.body}
              senderName={step.senderName}
              senderEmail={step.senderEmail}
              font={step.font}
              thumbnailType={campaignGoal === "send-without-video" ? undefined : step.thumbnailType}
              includeVideoThumbnail={campaignGoal === "send-without-video" ? false : step.includeVideoThumbnail}
              envelopeId={step.envelopeId}
              btnBg={step.btnBg}
              btnText={step.btnText}
              ctaText={step.ctaText}
              ctaUrl={step.ctaUrl}
              attachedVideo={campaignGoal === "send-without-video" ? null : step.attachedVideo}
              isVideoRequest={campaignGoal === "request-video"}
              language={campaignLanguage}
              allowEmailReply={step.allowEmailReply}
              allowVideoReply={campaignGoal === "send-without-video" ? false : step.allowVideoReply}
              allowSaveButton={campaignGoal === "send-without-video" ? false : step.allowSaveButton}
              allowShareButton={campaignGoal === "send-without-video" ? false : step.allowShareButton}
              allowDownloadVideo={campaignGoal === "send-without-video" ? false : step.allowDownloadVideo}
              closedCaptionsEnabled={campaignGoal === "send-without-video" ? false : step.closedCaptionsEnabled}
              smsMode={step.type === "sms"}
              smsBody={step.smsBody}
              smsPhoneNumber={step.smsPhoneNumber}
              fieldsWithMissingData={mergeFieldsWithMissingData.map(f => f.field)}
              bodyFontFamily={step.bodyFontFamily}
              bodyFontSize={step.bodyFontSize}
              bodyTextColor={step.bodyTextColor}
              bodyLineHeight={step.bodyLineHeight}
              landingPageColor={(allLandingPages.find(p => p.id === (step.landingPageId || 1)) as any)?.color}
              landingPageAccent={(allLandingPages.find(p => p.id === (step.landingPageId || 1)) as any)?.accent}
              landingPageImage={(allLandingPages.find(p => p.id === (step.landingPageId || 1)) as any)?.image}
              envTextBefore={envTextBefore}
              envNameFormat={envNameFormat}
              envTextAfter={envTextAfter}
              pdfFileName={designSnapshot.pdfFileName}
              pdfPages={designSnapshot.pdfPages}
              pdfSize={designSnapshot.pdfSize}
              formUrl={designSnapshot.formUrl}
              formHeight={designSnapshot.formHeight}
              formFullWidth={designSnapshot.formFullWidth}
              hideVideo={campaignGoal === "send-without-video"}
            />
          </div>
          }
        />
      ) : (() => {
        /* SMS content — two-column layout with iPhone preview */
        const smsS = step;
        const setSmsS = setStep;
        const sl = (smsS.smsBody || "").length;
        const segs = Math.max(1, Math.ceil(sl / SMS_MAX));
        const left = SMS_MAX * segs - sl;

        /* Resolve merge fields for live preview */
        const mergeMap: Record<string, string> = {
          "{{first_name}}": "Sarah",
          "{{last_name}}": "Johnson",
          "{{email}}": "sarah.johnson@alumni.edu",
          "{{amount}}": "$500",
          "{{gift_amount}}": "$500",
          "{{fund_name}}": "Annual Excellence Fund",
          "{{campaign_name}}": campaignName || "Spring Giving Campaign",
          "{{sender_name}}": smsS.senderName || "Dean Williams",
          "{{link}}": "thankview.com/v/abc123",
        };
        const previewBody = Object.entries(mergeMap).reduce(
          (text, [token, value]) => text.replace(new RegExp(token.replace(/[{}]/g, "\\$&"), "g"), value),
          smsS.smsBody || "Hi {{first_name}}! Thank you for your generous {{gift_amount}} gift to the {{fund_name}}. We\u2019d love to share a personal message with you: {{link}}",
        );
        const hasLink = previewBody.includes("thankview.com") || (smsS.smsBody || "").includes("{{link}}");
        const senderInitial = (smsS.smsPhoneNumber || smsS.senderName || "TV").charAt(0).toUpperCase();
        const senderLabel = smsS.smsPhoneNumber || smsS.senderName || "ThankView";

        return (
        <ResizableSplitPane
          defaultRightPercent={32}
          minRightPercent={22}
          maxRightPercent={50}
          stickyRight
          stickyTop="7rem"
          left={
          <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={LABEL_CLS}>Message Body</label>
              <BodyHeaderCount length={sl} limit={CHAR_LIMITS.sms} />
            </div>
            <SmsMergeBar
              onInsert={token => setSmsS(s => ({ ...s, smsBody: (s.smsBody || "") + " " + token }))}
              body={smsS.smsBody || ""}
              onChange={v => setSmsS(s => ({ ...s, smsBody: v }))}
              placeholder={"Hi {{first_name}}! I have a personal message for you\u2026"}
            />
            <SmsCharCounter length={sl} />
          </div>

          {/* Sender info (SMS) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={LABEL_CLS}>Sender Name</label>
                <CharCount current={(smsS.senderName || "").length} max={CHAR_LIMITS.senderName} />
              </div>
              <input value={smsS.senderName || ""} onChange={e => setSmsS(s => ({ ...s, senderName: e.target.value }))} maxLength={CHAR_LIMITS.senderName} className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Phone Number</label>
              <input value={smsS.smsPhoneNumber || ""} onChange={e => setSmsS(s => ({ ...s, smsPhoneNumber: e.target.value }))} className={INPUT_CLS} />
            </div>
          </div>

          {/* Link shortening toggle */}
          <button onClick={() => setSmsS(s => ({ ...s, linkShortening: !s.linkShortening }))}
            role="switch" aria-checked={smsS.linkShortening} aria-label="Shorten links"
            className="w-full flex items-center justify-between p-2.5 bg-white rounded-md border border-tv-border-light">
            <div>
              <p className="text-[11px] text-tv-text-primary font-semibold">Shorten Links</p>
              <p className="text-[9px] text-tv-text-secondary">Replace long URLs with trackable short links</p>
            </div>
            <div className={`w-9 h-5 rounded-full relative shrink-0 transition-colors ${smsS.linkShortening ? "bg-tv-brand-bg" : "bg-tv-surface-active"}`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${smsS.linkShortening ? "left-[17px]" : "left-0.5"}`} />
            </div>
          </button>

          {/* SMS compliance */}
          <div className="p-2.5 bg-tv-warning-bg border border-tv-warning-border rounded-md flex gap-2">
            <CircleAlert size={12} className="text-tv-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] text-tv-warning font-semibold">SMS Compliance</p>
              <p className="text-[10px] text-tv-warning">&ldquo;Reply STOP to unsubscribe&rdquo; will be automatically appended.</p>
            </div>
          </div>

          {/* AI writer */}
          <div>
            <button onClick={() => setShowAi(!showAi)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[14px] border transition-all ${showAi ? "border-tv-brand-bg bg-tv-brand-tint text-tv-brand" : "border-tv-border-light text-tv-text-secondary hover:border-tv-border-strong hover:text-tv-brand"}`} style={{ fontWeight: 500 }}>
              <Sparkles size={13} />Write with AI
            </button>
            {showAi && (
              <div className="mt-2 p-2.5 bg-tv-brand-tint border border-tv-border-strong rounded-md space-y-2">
                <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="e.g. Write a brief thank-you SMS\u2026" rows={2}
                  aria-label="AI writing prompt"
                  className="w-full border border-tv-border rounded-sm px-2.5 py-1.5 text-[12px] outline-none resize-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand" />
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowAi(false)} className="px-2.5 py-1 text-[11px] text-tv-text-secondary">Cancel</button>
                  <button onClick={handleAiGenerate} disabled={!aiPrompt.trim() || aiGenerating}
                    className="px-3 py-1 bg-tv-brand-bg text-white text-[11px] rounded-full hover:bg-tv-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 font-semibold">
                    {aiGenerating ? <><div className="w-2.5 h-2.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />&hellip;</> : <><Sparkles size={10} />Generate</>}
                  </button>
                </div>
              </div>
            )}
          </div>
          </div>
          }
          right={
          <div>
            <p className="text-[10px] text-tv-text-label uppercase tracking-wider mb-2 font-semibold">Live Preview</p>
            <div className="w-[280px] max-w-full mx-auto">
              {/* iPhone shell */}
              <div className="relative rounded-[38px] bg-[#1c1c1e] p-[6px] shadow-[0_8px_40px_rgba(0,0,0,0.25)]">
                {/* Hardware buttons */}
                <div className="absolute -left-[2px] top-[72px] w-[2px] h-[14px] rounded-l-[2px] bg-[#2c2c2e]" />
                <div className="absolute -left-[2px] top-[100px] w-[2px] h-[26px] rounded-l-[2px] bg-[#2c2c2e]" />
                <div className="absolute -left-[2px] top-[132px] w-[2px] h-[26px] rounded-l-[2px] bg-[#2c2c2e]" />
                <div className="absolute -right-[2px] top-[108px] w-[2px] h-[32px] rounded-r-[2px] bg-[#2c2c2e]" />
                <div className="rounded-[32px] overflow-hidden bg-white">
                  {/* Dynamic Island */}
                  <div className="flex justify-center pt-[6px] pb-[2px] bg-white">
                    <div className="w-[72px] h-[18px] rounded-full bg-[#1c1c1e]" />
                  </div>
                  {/* Status bar */}
                  <div className="flex items-center justify-between px-6 pt-[2px] pb-[6px] bg-white">
                    <span style={{ fontSize: "10px" }} className="text-[#1c1c1e] tabular-nums font-semibold">9:41</span>
                    <div className="flex items-center gap-[3px]">
                      <Signal size={9} className="text-[#1c1c1e]" />
                      <Wifi size={10} className="text-[#1c1c1e]" />
                      <Battery size={12} className="text-[#1c1c1e]" />
                    </div>
                  </div>
                  {/* Nav bar */}
                  <div className="flex items-center justify-between px-2.5 pb-2 bg-white border-b border-[#c6c6c8]">
                    <button className="flex items-center gap-0.5 text-[#007aff]">
                      <ChevronLeft size={14} strokeWidth={2.5} />
                      <span style={{ fontSize: "10px" }}>Back</span>
                    </button>
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-[28px] h-[28px] rounded-full bg-[#c7c7cc] flex items-center justify-center">
                        <span style={{ fontSize: "12px" }} className="text-white font-semibold">{senderInitial}</span>
                      </div>
                      <span style={{ fontSize: "9px" }} className="text-[#1c1c1e] max-w-[120px] truncate font-semibold">{senderLabel}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-[22px] h-[22px] rounded-full bg-[#f2f2f7] flex items-center justify-center">
                        <Phone size={10} className="text-[#007aff]" />
                      </div>
                      {campaignGoal !== "send-without-video" && (
                        <div className="w-[22px] h-[22px] rounded-full bg-[#f2f2f7] flex items-center justify-center">
                          <Video size={10} className="text-[#007aff]" />
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Messages area */}
                  <div className="bg-white min-h-[340px] flex flex-col">
                    <div className="text-center pt-3 pb-1.5">
                      <span style={{ fontSize: "8px", fontWeight: 500 }} className="text-[#8e8e93] bg-[#f2f2f7] px-2 py-0.5 rounded-full">Today 9:41 AM</span>
                    </div>
                    <div className="px-3 pt-1.5 pb-1 flex justify-start">
                      <div className="relative max-w-[80%]">
                        <div className="bg-[#34c759] rounded-xl rounded-bl-[4px] px-3 py-2 shadow-sm">
                          <p style={{ fontSize: "11px", lineHeight: "1.45" }} className="text-white whitespace-pre-wrap">{previewBody || "Your message preview will appear here\u2026"}</p>
                        </div>
                        <svg className="absolute -bottom-[1px] -left-[5px]" width="12" height="10" viewBox="0 0 12 10" fill="none">
                          <path d="M12 0C12 0 5.5 0 2 3.5C0 5.5 0 10 0 10C0 10 2 6.5 5.5 5C8 4 12 4 12 4V0Z" fill="#34c759" />
                        </svg>
                      </div>
                    </div>
                    {hasLink && (
                      <div className="px-3 pt-1 pb-1 flex justify-start">
                        <div className="max-w-[80%]">
                          <div className="bg-[#f2f2f7] rounded-lg overflow-hidden border border-[#e5e5ea] shadow-sm">
                            <div className="bg-gradient-to-br from-[#7c45b0]/15 to-[#7c45b0]/5 h-[60px] flex items-center justify-center">
                              {campaignGoal !== "send-without-video" ? (
                                <div className="w-7 h-7 rounded-full bg-[#7c45b0] flex items-center justify-center shadow-sm">
                                  <Play size={9} className="text-white ml-[1px]" fill="white" />
                                </div>
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-[#7c45b0] flex items-center justify-center shadow-sm">
                                  <Mail size={9} className="text-white" />
                                </div>
                              )}
                            </div>
                            <div className="px-2.5 py-1.5">
                              <p style={{ fontSize: "9px" }} className="text-[#1c1c1e] font-semibold">ThankView</p>
                              <p style={{ fontSize: "8px" }} className="text-[#8e8e93]">{campaignGoal === "send-without-video" ? "A personal message for you" : "A personal video message for you"}</p>
                              <p style={{ fontSize: "7px" }} className="text-[#007aff] mt-0.5">thankview.com</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="px-3 pt-0.5 pb-1 flex justify-start">
                      <p style={{ fontSize: "7px", fontWeight: 500 }} className="text-[#8e8e93] pl-1">Delivered</p>
                    </div>
                    <div className="flex-1 min-h-[20px]" />
                    <div className="text-center pb-2">
                      <span style={{ fontSize: "7px" }} className="text-[#8e8e93] italic">Reply STOP to unsubscribe</span>
                    </div>
                  </div>
                  {/* Input bar */}
                  <div className="flex items-end gap-1.5 px-2.5 py-2 border-t border-[#c6c6c8] bg-[#f9f9f9]">
                    <div className="w-[24px] h-[24px] rounded-full bg-[#007aff] flex items-center justify-center shrink-0 mb-[1px]">
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="white">
                        <path d="M8 2v12M2 8h12" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className="flex-1 flex items-center bg-white border border-[#c6c6c8] rounded-full px-3 py-[5px]">
                      <span style={{ fontSize: "10px" }} className="text-[#c7c7cc]">Text Message</span>
                    </div>
                    <div className="w-[24px] h-[24px] flex items-center justify-center shrink-0 mb-[1px]">
                      <svg width="11" height="14" viewBox="0 0 11 14" fill="none">
                        <rect x="3" y="0" width="5" height="9" rx="2.5" stroke="#007aff" strokeWidth="1.3" />
                        <path d="M0.5 6.5C0.5 9 2.5 11 5.5 11C8.5 11 10.5 9 10.5 6.5" stroke="#007aff" strokeWidth="1.3" strokeLinecap="round" />
                        <line x1="5.5" y1="11" x2="5.5" y2="13.5" stroke="#007aff" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                  {/* Home indicator */}
                  <div className="flex justify-center py-[6px] bg-[#f9f9f9]">
                    <div className="w-[80px] h-[3px] bg-[#1c1c1e] rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          }
        />
        );
      })()}
    </div>
  );

  // ── Step 4: Video ──────────────────────────────────────────────────────────
  // For "send-video" goal → the full-area VideoBuilder takes over (handled below).
  // For "request-video" goal → show Recording Setup inline (instructions, branding, library video).
  // For "send-without-video" → this step is skipped in the stepper.

  const renderVideoRequestSetup = () => (
    <div className="max-w-[600px] xl:max-w-[700px] 2xl:max-w-[820px] mx-auto">
      <h2 className="text-tv-text-primary mb-2" style={{ fontSize: "24px", fontWeight: 900 }}>Recording Setup</h2>
      <p className="text-[13px] text-tv-text-secondary mb-5">Configure the recording experience for your video requestees.</p>

      <div className="space-y-5">
        {/* Recording Instructions — rich text editor */}
        <div className="bg-white rounded-lg border border-tv-border-light p-4 space-y-3">
          <div>
            <label className={LABEL_CLS}>Recording Instructions</label>
            <p className="text-[10px] text-tv-text-secondary mb-2">These instructions will be shown to recorders on the landing page.</p>
            <SimpleRTE
              value={vrInstructions}
              onChange={setVrInstructions}
              rows={4}
              ariaLabel="Video request instructions"
              variant="mini"
            />
            <button onClick={() => setVrInstructions(VR_DEFAULT_INSTRUCTIONS)}
              className="mt-1.5 text-[10px] text-tv-info hover:underline">
              Reset to default instructions
            </button>
          </div>

          {/* Recording Tips — shown to recorders alongside instructions */}
          <div className="p-3 bg-tv-surface rounded-md border border-tv-border-divider">
            <div className="flex items-center gap-1.5 mb-2">
              <Lightbulb size={11} className="text-tv-info" />
              <span className="text-[10px] text-tv-text-label uppercase tracking-wider font-semibold">Recording Tips (shown to recorders)</span>
            </div>
            <div className="space-y-1">
              {VR_RECORDING_TIPS.map((tip, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check size={9} className="text-tv-success shrink-0" />
                  <span className="text-[11px] text-tv-text-secondary">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Branded Landing Page */}
        <div className="bg-white rounded-lg border border-tv-border-light p-4">
          <div className="mb-2">
            <label className="text-[10px] text-tv-text-label uppercase tracking-wider font-semibold">Branded Landing Page</label>
          </div>
          <div className="space-y-1.5">
            {allLandingPages.map(p => (
              <button key={p.id} onClick={() => setVrBrandedLandingPage(p.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md border text-left transition-all ${vrBrandedLandingPage === p.id ? "border-tv-brand-bg bg-tv-brand-tint" : "border-tv-border-light hover:border-tv-border-strong"}`}>
                <div className="w-7 h-5 rounded-[4px] flex items-center justify-center shrink-0"
                  style={{ background: `linear-gradient(135deg, ${(p as any).color || "#7c45b0"}, ${(p as any).accent || "#a78bfa"})` }}>
                  <Camera size={7} className="text-white" />
                </div>
                <span className="text-[12px] text-tv-text-primary flex-1" style={{ fontWeight: 500 }}>{p.name}</span>
                {vrBrandedLandingPage === p.id && <Check size={12} className="text-tv-brand" />}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-tv-text-secondary mt-2">This is the page recorders will see when they open the recording link.</p>
        </div>

        {/* Include a video from library */}
        <div className="bg-white rounded-lg border border-tv-border-light p-4 space-y-3">
          <button onClick={() => setVrIncludeLibraryVideo(!vrIncludeLibraryVideo)}
            role="switch" aria-checked={vrIncludeLibraryVideo} aria-label="Include instruction video"
            className="w-full flex items-center justify-between">
            <div>
              <p className="text-[12px] text-tv-text-primary font-semibold">Include Instruction Video</p>
              <p className="text-[10px] text-tv-text-secondary">Attach a video from your library to accompany the recording instructions</p>
            </div>
            <div className={`w-9 h-5 rounded-full relative shrink-0 transition-colors ${vrIncludeLibraryVideo ? "bg-tv-brand-bg" : "bg-tv-surface-active"}`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${vrIncludeLibraryVideo ? "left-[17px]" : "left-0.5"}`} />
            </div>
          </button>

          {vrIncludeLibraryVideo && (
            <div className="pt-2 border-t border-tv-border-divider">
              {vrLibraryVideoId ? (
                <div className="flex items-center gap-3 p-3 bg-tv-brand-tint border border-tv-border-strong rounded-md">
                  <div className="w-12 h-8 rounded-[6px] bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
                    <Play size={10} className="text-white ml-0.5" fill="white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-tv-text-primary truncate font-semibold">{vrLibraryVideoTitle}</p>
                    <p className="text-[10px] text-tv-text-secondary">Instruction video</p>
                  </div>
                  <button onClick={() => { setVrLibraryVideoId(null); setVrLibraryVideoTitle(""); }}
                    className="w-6 h-6 rounded-full bg-white border border-tv-border-light flex items-center justify-center text-tv-text-secondary hover:text-tv-danger shrink-0">
                    <X size={11} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowVrLibraryPicker(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-md border-2 border-dashed border-tv-border-light hover:border-tv-brand-bg hover:bg-tv-brand-tint/30 transition-all text-left">
                  <div className="w-10 h-10 rounded-md bg-tv-surface flex items-center justify-center shrink-0">
                    <Film size={16} className="text-tv-text-secondary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[12px] text-tv-text-primary font-semibold">Select from Library</p>
                    <p className="text-[10px] text-tv-text-secondary">Choose a video to show alongside your instructions</p>
                  </div>
                  <ChevronRight size={14} className="text-tv-text-decorative" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Automated Reminders */}
        <div className="bg-white rounded-lg border border-tv-border-light p-4 space-y-3">
          <label className="text-[10px] text-tv-text-label uppercase tracking-wider block font-semibold">Automated Reminders</label>
          <p className="text-[10px] text-tv-text-secondary">Send reminders to people who haven&rsquo;t submitted a video yet.</p>
          <div className="space-y-1.5">
            {vrReminderDays.map((days, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2.5 bg-tv-surface rounded-sm border border-tv-border-light">
                <Bell size={12} className="text-tv-brand shrink-0" />
                <span className="text-[11px] text-tv-text-secondary shrink-0">Reminder {idx + 1}:</span>
                <select value={days} onChange={e => {
                  const val = Number(e.target.value);
                  setVrReminderDays(prev => prev.map((d, i) => i === idx ? val : d));
                }} aria-label={`Reminder ${idx + 1} days`} className="border border-tv-border-light rounded-[6px] px-2 py-1 text-[11px] outline-none focus:ring-1 focus:ring-tv-brand/40 bg-white">
                  {[1, 2, 3, 5, 7, 10, 14, 21, 30].map(d => (
                    <option key={d} value={d}>{d} day{d !== 1 ? "s" : ""} before deadline</option>
                  ))}
                </select>
                <div className="flex-1" />
                {vrReminderDays.length > 1 && (
                  <button onClick={() => setVrReminderDays(prev => prev.filter((_, i) => i !== idx))}
                    className="p-1 rounded-full hover:bg-tv-danger-bg text-tv-text-secondary hover:text-tv-danger transition-colors">
                    <X size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {vrReminderDays.length < 5 && (
            <button onClick={() => setVrReminderDays(prev => [...prev, 1])}
              className="flex items-center gap-1 text-[11px] text-tv-brand hover:text-tv-brand-hover transition-colors" style={{ fontWeight: 500 }}>
              <Plus size={11} />Add Reminder
            </button>
          )}
        </div>

        <div className="p-3 bg-tv-surface border border-tv-border-light rounded-md flex items-start gap-2">
          <Info size={12} className="text-tv-brand shrink-0 mt-0.5" />
          <p className="text-[11px] text-tv-text-secondary">Submitted videos will appear on the campaign&rsquo;s &ldquo;Replies&rdquo; page and in the &ldquo;Requests&rdquo; folder of your Video Library.</p>
        </div>
      </div>
    </div>
  );

  // ── Step 3: Constituents ──────────────────────────────────────────────────
  const isVideoRequest = campaignGoal === "request-video";

  const removeConstituent = (id: number) => setConstituents(r => r.filter(x => x.id !== id));
  const addManualConstituent = () => {
    const newId = Date.now();
    setConstituents(r => [...r, { id: newId, name: "", email: "", phone: "", source: "Manual" }]);
    setEditingConstituent(newId);
    setShowAddMethod(null);
  };
  const addCsvConstituents = () => {
    const newConstituents = [
      { id: Date.now(),     name: "Lisa Hamilton",   email: "l.hamilton@alumni.edu", phone: "+1 (555) 678-9012", source: "CSV Upload" },
      { id: Date.now() + 1, name: "Brian Kazuki",    email: "b.kazuki@corp.com",     phone: "+1 (555) 789-0123", source: "CSV Upload" },
      { id: Date.now() + 2, name: "Priya Nair",      email: "p.nair@foundation.org", phone: "+1 (555) 890-1234", source: "CSV Upload" },
    ];
    setConstituents(r => [...r, ...newConstituents]);
    show(`${newConstituents.length} constituents imported from CSV`, "success");
    setShowAddMethod(null);
  };
  const addFromList = (listName: string, count: number) => {
    const newConstituents = Array.from({ length: Math.min(count, 3) }, (_, i) => ({
      id: Date.now() + i,
      name: `${listName} Constituent ${i + 1}`,
      email: `constituent${i + 1}@${listName.toLowerCase().replace(/\s/g, "")}.edu`,
      phone: `+1 (555) ${String(100 + i).padStart(3, "0")}-${String(4000 + i).padStart(4, "0")}`,
      source: listName,
    }));
    setConstituents(r => [...r, ...newConstituents]);
    show(`${count} constituents added from "${listName}"`, "success");
    setShowAddMethod(null);
  };

  const filteredConstituents = constituents.filter(r =>
    r.name.toLowerCase().includes(constituentSearch.toLowerCase()) ||
    r.email.toLowerCase().includes(constituentSearch.toLowerCase())
  );

  const renderConstituentsStep = () => {
    // For non-video-request campaigns, use the new 2-panel ConstituentPanel
    if (!isVideoRequest) {
      return (
        <div className="max-w-full mx-auto -mx-2" style={{ height: "calc(100vh - 280px)" }}>
          <ConstituentPanel hasPersonalizedClips={videoElements.personalizedClip} />
        </div>
      );
    }
    // Video request campaigns keep the original list layout
    return (
    <div className="max-w-[620px] xl:max-w-[720px] 2xl:max-w-[840px] mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-tv-text-primary" style={{ fontSize: "24px", fontWeight: 900 }}>
          {isVideoRequest ? "Recorders" : "Constituents"}
        </h2>
      </div>
      <p className="text-[13px] text-tv-text-secondary mb-5">
        {isVideoRequest
          ? "Choose who you'd like to request a video from."
          : "Choose who will receive this campaign."}
      </p>

      {/* Shareable link — skip constituent list, just show the link */}
      {isVideoRequest && vrDeliveryType === "link" ? (
        <div className="space-y-3">
          <div className="p-4 rounded-lg border border-tv-border-light bg-white">
            <label className="text-[10px] text-tv-text-label uppercase tracking-wider mb-2 block font-semibold">Shareable Video Request Link</label>
            <div className="flex items-center gap-2 bg-tv-surface rounded-sm px-3 py-2.5 border border-tv-border-light">
              <Link2 size={14} className="text-tv-brand shrink-0" />
              <span className="text-[13px] text-tv-text-primary font-mono flex-1 truncate">{vrShareableUrl}</span>
              <button onClick={() => show("Link copied!", "success")}
                className="px-2.5 py-1 bg-tv-brand-bg text-white text-[11px] rounded-full hover:bg-tv-brand-hover transition-colors flex items-center gap-1 shrink-0 font-semibold">
                <Copy size={10} />Copy
              </button>
            </div>
            <p className="text-[10px] text-tv-text-secondary mt-2">Share this link via social media, QR codes, or anywhere you like. Anyone with the link can submit a video.</p>
          </div>

          <button onClick={() => setVrSubmissionsEnabled(!vrSubmissionsEnabled)}
            role="switch" aria-checked={vrSubmissionsEnabled} aria-label="Accept submissions"
            className="w-full flex items-center justify-between p-3.5 bg-white rounded-md border border-tv-border-light">
            <div>
              <p className="text-[12px] text-tv-text-primary font-semibold">Accept Submissions</p>
              <p className="text-[10px] text-tv-text-secondary">{vrSubmissionsEnabled ? "Submissions are open" : "Link is disabled — no new submissions"}</p>
            </div>
            <div className={`w-9 h-5 rounded-full relative shrink-0 transition-colors ${vrSubmissionsEnabled ? "bg-tv-brand-bg" : "bg-tv-surface-active"}`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${vrSubmissionsEnabled ? "left-[17px]" : "left-0.5"}`} />
            </div>
          </button>

          {/* Submissions routing */}
          {vrSubmissionsEnabled && (
            <div className="p-3.5 bg-white rounded-md border border-tv-border-light space-y-2">
              <p className="text-[11px] text-tv-text-primary font-semibold">Submission Routing</p>
              <p className="text-[9px] text-tv-text-secondary">Choose where submitted videos are delivered after approval.</p>
              <div className="space-y-1.5">
                {([
                  { id: "replies", label: "Campaign Replies Only", desc: "Videos stay in this campaign\u2019s reply feed" },
                  { id: "library", label: "Video Library", desc: "Also copy to your Video Library for reuse" },
                  { id: "both", label: "Replies + Library + Email", desc: "Notify admins by email and save everywhere" },
                ] as const).map(opt => (
                  <label key={opt.id} className="flex items-start gap-2 px-2.5 py-2 rounded-sm border border-tv-border-light hover:bg-tv-surface cursor-pointer transition-colors">
                    <input type="radio" name="vr-routing" defaultChecked={opt.id === "library"} className="mt-0.5 accent-tv-brand" />
                    <div>
                      <p className="text-[10px] text-tv-text-primary font-semibold">{opt.label}</p>
                      <p className="text-[9px] text-tv-text-secondary">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 bg-tv-info-bg border border-tv-info-border rounded-md flex items-start gap-2">
            <Info size={12} className="text-tv-info shrink-0 mt-0.5" />
            <p className="text-[11px] text-tv-info">Submitted videos will appear on the campaign&rsquo;s Replies page and in the &ldquo;Requests&rdquo; folder of your Video Library.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Add methods */}
          <div className="p-4 rounded-lg border border-tv-border-light bg-white">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] text-tv-text-label uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                Add {isVideoRequest ? "Recorders" : "Constituents"}
              </label>
              <span className="text-[11px] text-tv-text-secondary">{constituents.length} added</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {([
                { key: "csv" as const,    icon: Upload,   label: "Upload CSV",    desc: "Import from file" },
                { key: "manual" as const, icon: UserPlus, label: "Add Manually",  desc: "Enter details" },
                { key: "list" as const,   icon: Users,    label: "From List",     desc: "Use saved list" },
              ]).map(m => (
                <button key={m.key} onClick={() => setShowAddMethod(showAddMethod === m.key ? null : m.key)}
                  className={`flex flex-col items-center text-center p-3 rounded-md border transition-all ${showAddMethod === m.key ? "border-tv-brand-bg bg-tv-brand-tint" : "border-tv-border-light hover:border-tv-border-strong"}`}>
                  <m.icon size={16} className={showAddMethod === m.key ? "text-tv-brand" : "text-tv-text-secondary"} />
                  <p className={`text-[11px] mt-1.5 ${showAddMethod === m.key ? "text-tv-brand" : "text-tv-text-primary"} font-semibold`}>{m.label}</p>
                  <p className="text-[9px] text-tv-text-secondary">{m.desc}</p>
                </button>
              ))}
            </div>

            {/* CSV Upload panel */}
            {showAddMethod === "csv" && (
              <div className="p-3 bg-tv-surface rounded-md border border-tv-border-light space-y-2">
                <div className="border-2 border-dashed border-tv-border-light rounded-md p-6 text-center hover:border-tv-brand-bg transition-colors cursor-pointer" role="button" tabIndex={0} onClick={addCsvConstituents} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); addCsvConstituents(); } }}>
                  <Upload size={20} className="text-tv-text-secondary mx-auto mb-2" />
                  <p className="text-[12px] text-tv-text-primary font-semibold">Drop a CSV file here or click to browse</p>
                  <p className="text-[10px] text-tv-text-secondary mt-1">Columns: Name, Email, Phone (optional)</p>
                </div>
                <p className="text-[9px] text-tv-text-secondary">Errors and duplicates will be flagged after upload. Max 10,000 rows per file.</p>
              </div>
            )}

            {/* Manual add panel */}
            {showAddMethod === "manual" && (
              <div className="p-3 bg-tv-surface rounded-md border border-tv-border-light space-y-2">
                <p className="text-[11px] text-tv-text-primary font-semibold">Add a constituent manually</p>
                <button onClick={addManualConstituent}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-[12px] text-tv-brand border border-tv-brand-bg/30 rounded-sm hover:bg-tv-brand-tint transition-colors font-semibold">
                  <Plus size={12} />Add Constituent
                </button>
              </div>
            )}

            {/* From List panel */}
            {showAddMethod === "list" && (
              <div className="p-3 bg-tv-surface rounded-md border border-tv-border-light space-y-1.5">
                {[
                  { name: "All Donors", count: 2340 },
                  { name: "Major Donors", count: 128 },
                  { name: "New Donors 2025", count: 456 },
                  { name: "Lapsed Donors", count: 312 },
                  { name: "Board Members", count: 24 },
                ].map(l => (
                  <button key={l.name} onClick={() => addFromList(l.name, l.count)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-sm border border-tv-border-light bg-white hover:border-tv-brand-bg hover:bg-tv-brand-tint transition-all text-left">
                    <div className="flex items-center gap-2">
                      <Users size={12} className="text-tv-text-secondary" />
                      <span className="text-[12px] text-tv-text-primary">{l.name}</span>
                    </div>
                    <span className="text-[11px] text-tv-text-secondary font-mono">{l.count.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Constituent table */}
          {constituents.length > 0 && (
            <div className="p-4 rounded-lg border border-tv-border-light bg-white">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] text-tv-text-label uppercase tracking-wider font-semibold">{isVideoRequest ? "Recorder" : "Constituent"} List</label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 border border-tv-border-light rounded-full px-2 py-1">
                    <Search size={10} className="text-tv-text-secondary" />
                    <input value={constituentSearch} onChange={e => setConstituentSearch(e.target.value)} placeholder="Search..." aria-label="Search constituents" className="text-[10px] w-[80px] outline-none focus:ring-1 focus:ring-tv-brand/40 rounded" />
                  </div>
                  <span className="text-[10px] text-tv-text-secondary">{filteredConstituents.length} of {constituents.length}</span>
                </div>
              </div>

              {/* Table header + rows */}
              <div className="overflow-x-auto">
                <div className="min-w-[480px]">
              <div className="grid grid-cols-[1fr_1.2fr_0.8fr_0.6fr_44px] gap-1.5 px-2 py-1.5 text-[9px] text-tv-text-label uppercase tracking-wider border-b border-tv-border-divider font-semibold">
                <span>Name</span><span>Email</span><span>Phone</span><span>Source</span><span />
              </div>

              {/* Rows */}
              <div className="max-h-[220px] overflow-y-auto divide-y divide-tv-border-divider">
                {filteredConstituents.map(r => (
                  <div key={r.id} className="grid grid-cols-[1fr_1.2fr_0.8fr_0.6fr_44px] gap-1.5 px-2 py-2 items-center group hover:bg-tv-surface transition-colors">
                    {editingConstituent === r.id ? (
                      <>
                        <input value={r.name} onChange={e => setConstituents(rs => rs.map(x => x.id === r.id ? { ...x, name: e.target.value } : x))} className="text-[11px] border border-tv-border-light rounded px-1.5 py-0.5 outline-none" placeholder="Name" aria-label="Constituent name" autoFocus />
                        <input value={r.email} onChange={e => setConstituents(rs => rs.map(x => x.id === r.id ? { ...x, email: e.target.value } : x))} className="text-[11px] border border-tv-border-light rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-tv-brand/40" placeholder="Email" aria-label="Constituent email" />
                        <input value={r.phone} onChange={e => setConstituents(rs => rs.map(x => x.id === r.id ? { ...x, phone: e.target.value } : x))} className="text-[11px] border border-tv-border-light rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-tv-brand/40" placeholder="Phone" aria-label="Constituent phone" />
                        <span className="text-[10px] text-tv-text-secondary truncate">{r.source}</span>
                        <button onClick={() => setEditingConstituent(null)} className="text-tv-brand text-[10px] font-semibold">Done</button>
                      </>
                    ) : (
                      <>
                        <span className="text-[11px] text-tv-text-primary truncate">{r.name || "—"}</span>
                        <span className="text-[11px] text-tv-text-secondary truncate">{r.email || "—"}</span>
                        <span className="text-[10px] text-tv-text-secondary truncate">{r.phone || "—"}</span>
                        <span className="text-[10px] text-tv-text-decorative truncate">{r.source}</span>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <TvTooltip label="Edit"><button onClick={() => setEditingConstituent(r.id)} className="w-5 h-5 rounded flex items-center justify-center hover:bg-tv-brand-tint text-tv-text-secondary hover:text-tv-brand transition-colors" aria-label="Edit constituent"><Edit2 size={10} /></button></TvTooltip>
                          <TvTooltip label="Remove"><button onClick={() => removeConstituent(r.id)} className="w-5 h-5 rounded flex items-center justify-center hover:bg-tv-danger-bg text-tv-text-secondary hover:text-tv-danger transition-colors" aria-label="Remove constituent"><Trash2 size={10} /></button></TvTooltip>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
                </div>
              </div>
            </div>
          )}

          {/* Estimated count */}
          <div className="p-4 rounded-lg border border-tv-border-light bg-white">
            <label className="text-[10px] text-tv-text-label uppercase tracking-wider mb-1 flex items-center gap-1.5 font-semibold">
              Estimated {isVideoRequest ? "Recorders" : "Constituents"}
            </label>
            <p className="font-display text-[24px] text-tv-brand" style={{ fontWeight: 900 }}>{constituents.length.toLocaleString()}</p>
            <p className="text-[11px] text-tv-text-secondary">After deduplication and suppression filters</p>
          </div>

          {/* Video Request: due date & reminders */}
          {isVideoRequest && (
            <>
              <div className="p-4 rounded-lg border border-tv-border-light bg-white space-y-3">
                <div>
                  <label className={LABEL_CLS}>Due Date</label>
                  <input type="date" value={vrDueDate} onChange={e => setVrDueDate(e.target.value)}
                    className={INPUT_CLS} />
                  <p className="text-[10px] text-tv-text-secondary mt-1">Recorders will see this deadline on their landing page.</p>
                </div>
                <button onClick={() => setVrReminderEnabled(!vrReminderEnabled)}
                  role="switch" aria-checked={vrReminderEnabled} aria-label="Automated reminders"
                  className="w-full flex items-center justify-between p-2.5 bg-tv-surface rounded-sm border border-tv-border-light">
                  <div>
                    <p className="text-[11px] text-tv-text-primary font-semibold">Automated Reminders</p>
                    <p className="text-[9px] text-tv-text-secondary">Send reminders before the due date</p>
                  </div>
                  <div className={`w-9 h-5 rounded-full relative shrink-0 transition-colors ${vrReminderEnabled ? "bg-tv-brand-bg" : "bg-tv-surface-active"}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${vrReminderEnabled ? "left-[17px]" : "left-0.5"}`} />
                  </div>
                </button>

                {/* Multiple reminder schedule */}
                {vrReminderEnabled && (
                  <div className="space-y-2 pl-1">
                    <label className="text-[9px] text-tv-text-label uppercase tracking-wider font-semibold">Remind before due date</label>
                    <div className="flex flex-wrap gap-1.5">
                      {[14, 7, 5, 3, 2, 1].map(d => {
                        const active = vrReminderDays.includes(d);
                        return (
                          <button key={d} onClick={() => setVrReminderDays(prev => active ? prev.filter(x => x !== d) : [...prev, d].sort((a, b) => b - a))}
                            className={`px-4 py-2 rounded-full text-[14px] border transition-all ${active ? "border-tv-brand-bg bg-tv-brand-tint text-tv-brand" : "border-tv-border-light text-tv-text-secondary hover:border-tv-border-strong"}`} style={{ fontWeight: 500 }}>
                            {d} day{d !== 1 ? "s" : ""}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[9px] text-tv-text-secondary">{vrReminderDays.length} reminder{vrReminderDays.length !== 1 ? "s" : ""} scheduled</p>
                  </div>
                )}
              </div>

              <button onClick={() => setVrSubmissionsEnabled(!vrSubmissionsEnabled)}
                role="switch" aria-checked={vrSubmissionsEnabled} aria-label="Accept submissions"
                className="w-full flex items-center justify-between p-3.5 bg-white rounded-md border border-tv-border-light">
                <div>
                  <p className="text-[12px] text-tv-text-primary font-semibold">Accept Submissions</p>
                  <p className="text-[10px] text-tv-text-secondary">{vrSubmissionsEnabled ? "Submissions are open" : "Submissions are closed"}</p>
                </div>
                <div className={`w-9 h-5 rounded-full relative shrink-0 transition-colors ${vrSubmissionsEnabled ? "bg-tv-brand-bg" : "bg-tv-surface-active"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${vrSubmissionsEnabled ? "left-[17px]" : "left-0.5"}`} />
                </div>
              </button>
            </>
          )}

          <div className="p-3 bg-tv-surface border border-tv-border-light rounded-md flex items-start gap-2">
            <CircleAlert size={13} className="text-tv-brand shrink-0 mt-0.5" />
            <p className="text-[11px] text-tv-text-secondary">
              {isVideoRequest
                ? "Recorders will receive an email with a link to record and submit their video."
                : "Constituents with missing email addresses or unsubscribed constituents will be automatically excluded."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
  };

  // ── Schedule validation ────────────────────────────────────────────────────
  const CONSTITUENT_FIELD_ICONS: Record<string, any> = {
    Cake, CalendarDays, GraduationCap, Briefcase,
  };

  const isScheduleValid = (() => {
    if (!scheduleType) return false;
    if (scheduleType === "now") return true;
    if (scheduleType === "later") {
      if (!scheduledDate) return false;
      const selected = new Date(`${scheduledDate}T${scheduledTime || "00:00"}`);
      return selected > new Date();
    }
    if (scheduleType === "contact-field") return !!contactDateField;
    return false;
  })();

  const scheduleDateInPast = scheduleType === "later" && scheduledDate
    ? new Date(`${scheduledDate}T${scheduledTime || "00:00"}`) <= new Date()
    : false;

  const scheduleLabel = (() => {
    if (!scheduleType) return "Not set";
    if (scheduleType === "now") return "Send immediately";
    if (scheduleType === "later") {
      if (!scheduledDate) return "Date not selected";
      const d = new Date(`${scheduledDate}T${scheduledTime || "00:00"}`);
      return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) + " at " + (scheduledTime || "00:00");
    }
    if (scheduleType === "contact-field" && contactDateField) {
      const f = CONSTITUENT_DATE_FIELDS.find(c => c.id === contactDateField);
      return `Per constituent — ${f?.label || contactDateField}`;
    }
    return "Not set";
  })();

  // ── Step 6: Schedule ─────────────────────────────────────────────────────
  const renderScheduleStep = () => {
    // Today's date as min for the date picker
    const today = new Date().toISOString().split("T")[0];

    // Compact schedule card helper
    const ScheduleCard = ({ type, icon: CardIcon, label, desc }: { type: "now" | "later" | "contact-field"; icon: any; label: string; desc: string }) => {
      const active = scheduleType === type;
      return (
        <button onClick={() => setScheduleType(type)}
          className={`flex-1 min-w-0 p-3 rounded-lg border-2 text-left transition-all flex flex-col items-center text-center gap-1.5 ${
            active ? "border-tv-brand-bg bg-tv-brand-tint shadow-md" : "border-tv-border-light hover:border-tv-border-strong bg-white"
          }`}>
          <div className={`w-9 h-9 rounded-sm flex items-center justify-center shrink-0 ${active ? "bg-tv-brand-bg" : "bg-tv-surface"}`}>
            <CardIcon size={16} className={active ? "text-white" : "text-tv-text-secondary"} />
          </div>
          <p className={`text-[12px] ${active ? "text-tv-brand" : "text-tv-text-primary"} font-semibold`}>{label}</p>
          <p className="text-[10px] text-tv-text-secondary leading-tight">{desc}</p>
        </button>
      );
    };

    return (
      <div className="max-w-[920px] xl:max-w-[1040px] 2xl:max-w-[1200px] mx-auto">
        {/* ── Header row ── */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-tv-text-primary" style={{ fontSize: "24px", fontWeight: 900 }}>Schedule</h2>
            <p className="text-[13px] text-tv-text-secondary mt-1">Choose when your campaign should start sending.</p>
          </div>
          <button
            onClick={() => setShowSendTestModal(true)}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 text-[12px] text-tv-brand border border-tv-brand-bg/30 rounded-full hover:bg-tv-brand-tint transition-colors font-semibold"
          >
            <Send size={12} />Send Test
          </button>
        </div>

        {/* Send Test Modal */}
        {showSendTestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl border border-tv-border-light shadow-xl w-full max-w-[560px] overflow-hidden">
              <div className="px-6 pt-5 pb-3 border-b border-tv-border-divider flex items-center justify-between">
                <div>
                  <h3 className="text-[16px] text-tv-text-primary" style={{ fontWeight: 900 }}>Send Test</h3>
                  <p className="text-[11px] text-tv-text-secondary mt-0.5">Preview exactly what your constituents will receive.</p>
                </div>
                <TvTooltip label="Close"><button onClick={() => { setShowSendTestModal(false); setSendTestSending(false); }} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-tv-surface transition-colors" aria-label="Close send test modal"><X size={14} className="text-tv-text-secondary" /></button></TvTooltip>
              </div>
              <div className="px-6 py-4 space-y-4">
                {/* Single vs Group toggle */}
                <div className="flex rounded-sm border border-tv-border-light overflow-hidden">
                  <button onClick={() => setSendTestMode("single")} className={`flex-1 py-2 text-[11px] transition-colors ${sendTestMode === "single" ? "bg-tv-brand-bg text-white" : "text-tv-text-secondary hover:bg-tv-surface-hover"} font-semibold`}>Single Email</button>
                  <button onClick={() => setSendTestMode("group")} className={`flex-1 py-2 text-[11px] transition-colors ${sendTestMode === "group" ? "bg-tv-brand-bg text-white" : "text-tv-text-secondary hover:bg-tv-surface-hover"} font-semibold`}>Test Group</button>
                </div>
                {sendTestMode === "single" ? (
                <div>
                  <label className={LABEL_CLS}>Send test to</label>
                  <input value={sendTestEmail} onChange={e => setSendTestEmail(e.target.value)}
                    placeholder="Enter email address"
                    className={INPUT_CLS} />
                  <p className="text-[10px] text-tv-text-decorative mt-1">The test will be sent to this email address.</p>
                </div>
                ) : (
                <div>
                  <label className={LABEL_CLS}>Test Group ({sendTestGroup.length} addresses)</label>
                  <div className={`${TAG_INPUT_WRAPPER_CLS} mb-1`}>
                    {sendTestGroup.map((email, i) => (
                      <span key={i} className="inline-flex items-center gap-1 bg-tv-brand-tint border border-tv-border rounded-full px-2 py-0.5 text-[10px] text-tv-brand">
                        {email}
                        <button onClick={() => setSendTestGroup(g => g.filter((_, j) => j !== i))} className="hover:text-tv-danger" aria-label={`Remove ${email}`}><X size={8} /></button>
                      </span>
                    ))}
                    <input value={sendTestNewEmail} onChange={e => setSendTestNewEmail(e.target.value)}
                      onKeyDown={e => {
                        if ((e.key === "Enter" || e.key === ",") && sendTestNewEmail.trim()) {
                          e.preventDefault();
                          if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sendTestNewEmail.trim()) && !sendTestGroup.includes(sendTestNewEmail.trim())) {
                            setSendTestGroup(g => [...g, sendTestNewEmail.trim()]);
                            setSendTestNewEmail("");
                          }
                        }
                      }}
                      placeholder={sendTestGroup.length === 0 ? "Add email addresses..." : "Add another..."}
                      aria-label="Test email address"
                      className="flex-1 min-w-[80px] text-[11px] outline-none focus:ring-1 focus:ring-tv-brand/40 bg-transparent" />
                  </div>
                  <p className="text-[9px] text-tv-text-decorative">Press Enter or comma to add. This group persists across test sends.</p>
                </div>
                )}
                <div>
                  <label className="text-[10px] text-tv-text-label uppercase tracking-wider mb-1.5 block flex items-center gap-1 font-semibold">
                    Preview as constituent
                    <span className="text-[8px] px-1.5 py-0.5 bg-tv-brand-tint text-tv-brand rounded-full" style={{ fontWeight: 700 }}>Merge fields</span>
                  </label>
                  <p className="text-[10px] text-tv-text-secondary mb-2">Select which constituent&rsquo;s data to use for merge field resolution in the test.</p>
                  <div className="space-y-1.5">
                    {SEND_TEST_CONSTITUENTS.map(r => (
                      <button key={r.id} onClick={() => setSendTestPreviewAs(r.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm border text-left transition-all ${sendTestPreviewAs === r.id ? "border-tv-brand-bg bg-tv-brand-tint" : "border-tv-border-light hover:border-tv-border-strong"}`}>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${sendTestPreviewAs === r.id ? "border-tv-brand-bg bg-tv-brand-bg" : "border-tv-border-light"}`}>
                          {sendTestPreviewAs === r.id && <Check size={8} className="text-white" />}
                        </div>
                        <div>
                          <p className="text-[12px] text-tv-text-primary">{r.name}</p>
                          <p className="text-[10px] text-tv-text-secondary">{r.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-6 pb-5 flex items-center justify-between">
                <button onClick={() => { setShowSendTestModal(false); setSendTestSending(false); }}
                  className="px-4 py-2 text-[12px] text-tv-text-secondary border border-tv-border-light rounded-full hover:bg-tv-surface transition-colors" style={{ fontWeight: 500 }}>Cancel</button>
                <button
                  onClick={() => {
                    setSendTestSending(true);
                    setTimeout(() => {
                      setSendTestSending(false);
                      setShowSendTestModal(false);
                      const target = sendTestMode === "group" ? `${sendTestGroup.length} addresses in test group` : sendTestEmail;
                      show(`Test sent to ${target} (previewing as ${SEND_TEST_CONSTITUENTS[sendTestPreviewAs].name})`, "success");
                    }, 1500);
                  }}
                  disabled={(sendTestMode === "single" ? !sendTestEmail.trim() : sendTestGroup.length === 0) || sendTestSending}
                  className={`flex items-center gap-1.5 px-5 py-2.5 text-[13px] rounded-full transition-colors ${sendTestSending ? "bg-tv-brand-bg/70 text-white cursor-not-allowed" : "bg-tv-brand-bg text-white hover:bg-tv-brand-hover"} disabled:opacity-50 font-semibold`}
                >
                  {sendTestSending ? <><span className="animate-spin">&#9696;</span>Sending...</> : <><Send size={12} />Send Test</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">

          {/* ─── LEFT COLUMN: Schedule ─── */}
          <div className="space-y-4">
            {/* Schedule mode — compact 3-across row */}
            <div className="p-4 rounded-lg border border-tv-border-light bg-white">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={13} className="text-tv-brand" />
                <p className="text-[12px] text-tv-text-primary" style={{ fontWeight: 700 }}>Scheduling</p>
                {scheduleType && (
                  <span className="ml-auto text-[10px] text-tv-success bg-tv-success-bg border border-tv-success-border px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                    <Check size={8} />{scheduleType === "now" ? "Immediate" : scheduleType === "later" ? "Scheduled" : "Date Field"}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <ScheduleCard type="now" icon={Zap} label="Send Now" desc="Immediately after creation" />
                <ScheduleCard type="later" icon={CalendarClock} label="Schedule" desc="Pick a date & time" />
                <ScheduleCard type="contact-field" icon={Repeat} label="Date Field" desc="Birthday, anniversary, etc." />
              </div>
            </div>

            {/* Expanded config panels */}
            {scheduleType === "later" && (
              <div className="p-4 rounded-lg border border-tv-brand-bg/20 bg-tv-brand-tint/30 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL_CLS}>Date</label>
                    <input type="date" value={scheduledDate} min={today} onChange={e => setScheduledDate(e.target.value)}
                      className={`${INPUT_CLS} bg-white`} />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Time</label>
                    <input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)}
                      className={`${INPUT_CLS} bg-white`} />
                  </div>
                </div>
                {scheduleDateInPast && (
                  <div className="flex items-center gap-2 p-2.5 bg-tv-warning-bg border border-tv-warning-border rounded-sm">
                    <TriangleAlert size={12} className="text-tv-warning shrink-0" />
                    <p className="text-[10px] text-tv-warning">This date is in the past. Choose a future date.</p>
                  </div>
                )}
                {scheduledDate && !scheduleDateInPast && (
                  <div className="flex items-center gap-2 p-2.5 bg-tv-success-bg border border-tv-success-border rounded-sm">
                    <Check size={12} className="text-tv-success shrink-0" />
                    <p className="text-[10px] text-tv-success">
                      {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} at {scheduledTime}
                    </p>
                  </div>
                )}
              </div>
            )}

            {scheduleType === "contact-field" && (
              <div className="p-4 rounded-lg border border-tv-brand-bg/20 bg-tv-brand-tint/30 space-y-3">
                <label className="text-[10px] text-tv-text-label uppercase tracking-wider block font-semibold">Select Date Field</label>
                <div className="grid grid-cols-2 gap-2">
                  {CONSTITUENT_DATE_FIELDS.map(f => {
                    const Icon = CONSTITUENT_FIELD_ICONS[f.icon] || CalendarDays;
                    const selected = contactDateField === f.id;
                    return (
                      <button key={f.id} onClick={() => setContactDateField(f.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-sm border text-left transition-all ${
                          selected ? "border-tv-brand-bg bg-white text-tv-brand" : "border-tv-border-light bg-white hover:border-tv-border-strong text-tv-text-secondary"
                        }`}>
                        <Icon size={13} className={selected ? "text-tv-brand" : "text-tv-text-decorative"} />
                        <p className={`text-[11px] truncate ${selected ? "font-semibold" : ""}`}>{f.label}</p>
                        {selected && <Check size={10} className="text-tv-brand shrink-0 ml-auto" />}
                      </button>
                    );
                  })}
                </div>

                {contactDateField && (
                  <>
                    <div className="flex items-center gap-2 p-2.5 bg-tv-brand-tint border border-tv-brand-bg/20 rounded-sm">
                      <Info size={11} className="text-tv-brand shrink-0" />
                      <p className="text-[10px] text-tv-brand">
                        {CONSTITUENT_DATE_FIELDS.find(c => c.id === contactDateField)?.desc}. Missing constituents will be skipped.
                      </p>
                    </div>

                    {/* Date field validation */}
                    {constituents.length > 0 && (() => {
                      const fieldLabel = CONSTITUENT_DATE_FIELDS.find(c => c.id === contactDateField)?.label || contactDateField;
                      const missingCount = Math.max(1, Math.floor(constituents.length * 0.15));
                      const malformedCount = Math.max(0, Math.floor(constituents.length * 0.03));
                      const validCount = constituents.length - missingCount - malformedCount;
                      return (
                        <div className="p-3 bg-white border border-tv-warning-border rounded-sm space-y-2">
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle size={11} className="text-tv-warning shrink-0" />
                            <p className="text-[10px] text-tv-warning font-semibold">Date Field Validation</p>
                          </div>
                          <div className="flex items-center gap-3 text-[10px]">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-tv-success inline-block" /> <span className="font-semibold">{validCount}</span> valid</span>
                            <span className="flex items-center gap-1 text-tv-warning"><span className="w-2 h-2 rounded-full bg-tv-warning inline-block" /> <span className="font-semibold">{missingCount}</span> missing</span>
                            {malformedCount > 0 && <span className="flex items-center gap-1 text-tv-danger"><span className="w-2 h-2 rounded-full bg-tv-danger inline-block" /> <span className="font-semibold">{malformedCount}</span> bad format</span>}
                          </div>
                          <div className="h-1.5 bg-tv-border-light rounded-full overflow-hidden flex">
                            <div className="h-full bg-tv-success rounded-full" style={{ width: `${(validCount / constituents.length) * 100}%` }} />
                            <div className="h-full bg-tv-warning" style={{ width: `${(missingCount / constituents.length) * 100}%` }} />
                            {malformedCount > 0 && <div className="h-full bg-tv-danger" style={{ width: `${(malformedCount / constituents.length) * 100}%` }} />}
                          </div>
                          <button className="text-[9px] text-tv-warning underline" style={{ fontWeight: 500 }}>View affected constituents</button>
                        </div>
                      );
                    })()}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={LABEL_CLS}>Send Time</label>
                        <input type="time" value={contactFieldSendTime} onChange={e => setContactFieldSendTime(e.target.value)}
                          className={`${INPUT_CLS} bg-white`} />
                      </div>
                      {(contactDateField === "birthday" || contactDateField === "anniversary") && (
                        <div>
                          <label className={LABEL_CLS}>Feb 29 Handling</label>
                          <div className="flex gap-1.5">
                            <button onClick={() => setLeapYearHandling("feb28")}
                              className={`flex-1 px-2 py-2 rounded-sm border text-[10px] transition-all ${leapYearHandling === "feb28" ? "border-tv-brand-bg bg-white text-tv-brand font-semibold" : "border-tv-border-light bg-white text-tv-text-secondary"}`}>
                              Feb 28
                            </button>
                            <button onClick={() => setLeapYearHandling("mar1")}
                              className={`flex-1 px-2 py-2 rounded-sm border text-[10px] transition-all ${leapYearHandling === "mar1" ? "border-tv-brand-bg bg-white text-tv-brand font-semibold" : "border-tv-border-light bg-white text-tv-text-secondary"}`}>
                              Mar 1
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {!scheduleType && (
              <div className="flex items-center gap-2 p-3 bg-tv-surface-muted border border-tv-border-light rounded-md">
                <Info size={12} className="text-tv-text-secondary shrink-0" />
                <p className="text-[11px] text-tv-text-secondary">Select a scheduling option above to continue.</p>
              </div>
            )}

            {/* Timezone — inline compact */}
            <div className="p-3.5 rounded-lg border border-tv-border-light bg-white flex items-center gap-3">
              <Globe size={13} className="text-tv-text-secondary shrink-0" />
              <label className="text-[10px] text-tv-text-label uppercase tracking-wider shrink-0 font-semibold">Timezone</label>
              <select aria-label="Timezone" className="flex-1 border border-tv-border-light rounded-sm px-2.5 py-1.5 text-[11px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand bg-white">
                <option>(UTC-05:00) Eastern Time (US &amp; Canada)</option>
                <option>(UTC-06:00) Central Time (US &amp; Canada)</option>
                <option>(UTC-07:00) Mountain Time (US &amp; Canada)</option>
                <option>(UTC-08:00) Pacific Time (US &amp; Canada)</option>
                <option>(UTC+00:00) UTC</option>
                <option>(UTC+01:00) Central European Time</option>
              </select>
            </div>
          </div>

          {/* ─── RIGHT COLUMN: Summary ─── */}
          <div className="space-y-4">
            {/* Metrics summary chip — compact reminder that metrics are set in Configure */}
            {selectedMetrics.length > 0 && (
              <div className="p-3 rounded-lg border border-tv-success-border bg-tv-success-bg/50 flex items-center gap-2">
                <Target size={12} className="text-tv-success shrink-0" />
                <p className="text-[11px] text-tv-success flex-1">
                  <span className="font-semibold">{selectedMetrics.length} metric{selectedMetrics.length !== 1 ? "s" : ""}</span> selected in Configure step
                </p>
                <Check size={11} className="text-tv-success shrink-0" />
              </div>
            )}
            {selectedMetrics.length === 0 && (
              <div className="p-3 rounded-lg border border-tv-warning-border bg-tv-warning-bg flex items-center gap-2">
                <TriangleAlert size={12} className="text-tv-warning shrink-0" />
                <p className="text-[11px] text-tv-warning">No success metrics selected — go back to Configure to add them.</p>
              </div>
            )}

            {/* Campaign Summary — sticky card */}
            <div className="p-4 rounded-lg border border-tv-border-light bg-white space-y-1.5 lg:sticky lg:top-4">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 size={13} className="text-tv-text-secondary" />
                <p className="text-[12px] text-tv-text-primary" style={{ fontWeight: 700 }}>Summary</p>
              </div>
              {[
                { label: "Constituents", value: `${constituents.length} constituents`, ok: constituents.length > 0 },
                { label: "Video", value: step.attachedVideo ? step.attachedVideo.duration : "N/A", ok: !!step.attachedVideo },
                { label: "Delivery", value: scheduleType === "now" ? "Immediately" : scheduleType === "later" && scheduledDate ? scheduledDate : scheduleType === "contact-field" ? "By date field" : "Not set", ok: !!scheduleType },
                { label: "Metrics", value: selectedMetrics.length > 0 ? `${selectedMetrics.length} selected` : "None", ok: selectedMetrics.length > 0 },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-tv-border-divider last:border-b-0">
                  <span className="text-[10px] text-tv-text-secondary flex items-center gap-1.5">
                    {row.ok ? <Check size={9} className="text-tv-success" /> : <div className="w-[9px] h-[9px] rounded-full border border-tv-border-light" />}
                    {row.label}
                  </span>
                  <span className={`text-[10px] ${row.ok ? "text-tv-text-primary" : "text-tv-text-decorative"} font-semibold`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Video Step: Full VideoBuilder ───────────────────────────────────────────
  const renderVideoStep = () => (
    <div className="flex-1 flex flex-col min-h-0">
      <VideoBuilder
        onPreviousStep={goBack}
        onNextStep={goNext}
        backLabel="Back"
        nextLabel="Next: Schedule"
        hideFooter={false}
      />
    </div>
  );

  // ── Step 7: Confirm & Send ──────────────────────────────────────────────────
  // Dummy video data (video builder removed — see TV Video Builder prototype)
  const confirmVideoSegments = ["Personalized Video (placeholder)"];
  const confirmPersonalizedCount = constituents.length;
  const confirmDeliveryType = scheduleType === "now" ? "Immediately" : scheduleType === "later" && scheduledDate
    ? `Scheduled — ${new Date(`${scheduledDate}T${scheduledTime}`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} at ${scheduledTime}`
    : "Not set";

  const renderReviewStep = () => (
    <ConfirmSend
      constituentCount={constituents.length}
      videoSegments={campaignGoal === "send-without-video" ? [] : confirmVideoSegments}
      personalizedCount={confirmPersonalizedCount}
      deliveryType={confirmDeliveryType}
      mergeFieldWarnings={mergeFieldsWithMissingData}
      campaignName={campaignName || "Untitled Campaign"}
      deliveryMethod={step.type === "email" ? "Email" : "SMS"}
      contentSummary={step.type === "email" ? (step.subject || "No subject") : ((step.smsBody || "").slice(0, 60) || "No content")}
      isEditMode={isEditMode}
      onBack={goBack}
      onSend={handleFinish}
    />
  );

  const renderStep = () => {
    switch (currentKey) {
      case "configure":  return renderConfigureStep();
      case "content":    return renderContentStep();
      case "video":      return isVideoRequest ? renderVideoRequestSetup() : renderVideoStep();
      case "constituents":return renderConstituentsStep();
      case "schedule":  return renderScheduleStep();
      case "review":    return renderReviewStep();
      default:          return null;
    }
  };

  return (
    <div className="min-h-full flex flex-col">
      {/* Breadcrumb + stepper */}
      <div className="px-6 py-3 border-b border-tv-border-divider bg-white shrink-0">
        <div className="flex items-center gap-2 text-[13px]">
          <span className="text-tv-text-secondary">Campaigns</span>
          <ChevronRight size={12} className="text-tv-text-decorative" />
          <span className="text-tv-text-primary">{isEditMode ? "Edit Campaign" : "Create Campaign"}</span>
          <span className="text-tv-text-decorative">&middot;</span>
          <span className="text-tv-brand">{isEditMode ? campaignName : "Single-Step"}</span>
          {initialTemplate && (
            <>
              <span className="text-tv-text-decorative">&middot;</span>
              <span className="text-[12px] text-tv-warning flex items-center gap-1"><Bookmark size={10} />{initialTemplate.name}</span>
            </>
          )}
        </div>
      </div>

      <div className="sticky top-0 z-10 bg-white border-b border-tv-border-divider px-4 sm:px-6 py-4 shrink-0">
        <div className="flex items-center justify-center max-w-[800px] 2xl:max-w-[960px] mx-auto">
          {(() => {
            const visibleSteps = WIZARD_STEPS
              .map((s, i) => ({ ...s, origIdx: i }))
              .filter(s => !shouldSkipStep(s.key));

            return visibleSteps.map((s, visIdx) => {
              const isActive = s.origIdx === stepIndex;
              const isPast = s.origIdx < stepIndex;
              const isLocked = s.origIdx !== 0 && !configureCompleted;
              return (
              <div key={s.key} className="flex items-center flex-1 last:flex-none min-w-0">
                <button
                  onClick={() => navigateToStep(s.origIdx)}
                  disabled={isLocked}
                  className={`flex items-center gap-1.5 shrink-0 rounded-full py-0.5 transition-colors ${isLocked ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:opacity-80"} ${isActive ? "bg-tv-brand-tint pl-1 pr-2.5" : ""}`}
                  aria-current={isActive ? "step" : undefined}
                  aria-label={isLocked ? `${s.label} (complete Configure first)` : `Go to ${s.label}`}
                  title={isLocked ? "Complete the Configure step first" : undefined}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] border-2 transition-colors shrink-0 ${
                    isPast
                      ? "bg-tv-brand-bg border-tv-brand-bg text-white"
                      : isActive
                      ? "bg-white border-tv-brand-bg text-tv-brand"
                      : "bg-white border-tv-border-light text-tv-text-decorative hover:border-tv-border-strong"
                  } font-semibold`}>
                    {isPast ? <Check size={11} /> : visIdx + 1}
                  </div>
                  <span className={`text-[11px] whitespace-nowrap hidden sm:inline transition-colors ${
                    isActive ? "text-tv-brand" : isPast ? "text-tv-brand" : "text-tv-text-decorative hover:text-tv-text-secondary"
                  }`} style={{ fontWeight: isActive ? 500 : 400 }}>
                    {s.key === "video" && isVideoRequest
                      ? "Recording"
                      : s.key === "constituents" && isVideoRequest
                      ? "Recorders"
                      : s.label}

                  </span>
                </button>
                {visIdx < visibleSteps.length - 1 && (
                  <div className={`flex-1 h-px mx-1.5 min-w-[8px] ${isPast ? "bg-tv-brand-bg" : "bg-tv-border-light"}`} />
                )}
              </div>
              );
            });
          })()}
        </div>
      </div>

      {/* ── Content area ── */}
      <div
        className={`flex-1 ${currentKey === "video" ? "overflow-hidden flex flex-col" : `overflow-y-auto p-6 sm:p-8 ${currentKey === "review" ? "flex flex-col" : ""}`}`}
        onInput={markDirty}
        onClick={markDirty}
      >
        {renderStep()}
      </div>

      {/* Video Timeline Bar removed — see TV Video Builder prototype */}

      {/* ── Bottom navigation ── */}
      {stepIndex <= 2 ? (
        /* Steps 1–3 (Configure, Content & Design, Constituents): Cancel | Back / Change Mode | Next nav */
        <div className="sticky bottom-0 bg-white border-t border-tv-border-divider px-4 sm:px-6 py-3 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => { if (isEditMode) { navigate(`/campaigns/${editCampaign!.id}`); } else { setShowCancelConfirm(true); } }}
              className="flex items-center gap-1.5 px-4 py-2 text-[13px] text-tv-danger border border-tv-danger rounded-full hover:bg-tv-danger-bg transition-colors">
              <X size={13} />Cancel
            </button>
            <button onClick={goBack}
              className="flex items-center gap-1.5 px-4 py-2 text-[13px] text-tv-text-primary border border-tv-border-light rounded-full hover:bg-tv-surface transition-colors">
              <ChevronLeft size={13} />
              {stepIndex === 0 ? (isEditMode ? "Back to Campaign" : "Change Mode") : "Back"}
            </button>
            {!isEditMode && (
            <button onClick={() => { setSaveTemplateName(campaignName || ""); setSaveTemplateDesc(""); setShowSaveTemplate(true); }}
              className="flex items-center gap-1.5 px-4 py-2 text-[13px] text-tv-text-secondary border border-tv-border-light rounded-full hover:bg-tv-surface hover:text-tv-text-primary transition-colors"
              title="Save current configuration as a reusable template">
              <Bookmark size={13} /><span className="hidden sm:inline">Save as Template</span>
            </button>
            )}
            <div className="flex-1" />
            {(() => {
              const configBlocked = stepIndex === 0 && (!campaignName.trim() || !campaignGoal || (campaignGoal === "request-video" ? !vrDeliveryType : !campaignCh) || selectedMetrics.length < 1);
              return (
                <div className="relative group shrink-0">
                  <button onClick={goNext}
                    disabled={configBlocked}
                    className={`flex items-center gap-1.5 px-6 py-2.5 text-[13px] rounded-full transition-colors ${
                      configBlocked
                        ? "text-white/60 bg-tv-brand-bg/40 cursor-not-allowed"
                        : "text-white bg-tv-brand-bg hover:bg-tv-brand-hover"
                    } font-semibold`}>
                    Next<ChevronRight size={13} />
                  </button>
                  {configBlocked && (
                    <div className="absolute bottom-full mb-2 right-0 w-52 p-2.5 bg-[#1e293b] text-white text-[11px] rounded-sm shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                      {!campaignName.trim() ? "Enter a campaign name." : !campaignGoal ? "Select a campaign type." : (campaignGoal === "request-video" ? !vrDeliveryType : !campaignCh) ? "Select a delivery channel." : selectedMetrics.length < 1 ? "Select at least 1 success metric." : "Complete configuration."}
                      <div className="absolute -bottom-1 right-6 w-2 h-2 bg-[#1e293b] rotate-45" />
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      ) : currentKey === "review" ? null : currentKey === "video" ? null : (
        /* Step 5 (Schedule): unified bottom nav — Back | Center progress | Forward */
        <div className="sticky bottom-0 bg-white border-t border-tv-border-divider px-4 sm:px-6 py-3 shrink-0 z-10">
          <div className="flex items-center gap-3">

            {/* ── LEFT: Back + Save as Template ── */}
            <button onClick={goBack}
              className="flex items-center gap-1.5 px-4 py-2 text-[13px] border rounded-full transition-colors shrink-0 text-tv-text-primary border-tv-border-light hover:bg-tv-surface">
              <ChevronLeft size={13} />
              <span className="hidden sm:inline">Previous Step</span>
            </button>

            {/* ── CENTER: spacer ── */}
            <div className="flex-1" />

            {/* ── RIGHT: Forward action ── */}
            {(() => {
              // Step 4 (Video) — simple Next to Schedule
              if (currentKey === "video") {
                return (
                  <button onClick={goNext}
                    className="flex items-center gap-1.5 px-6 py-2.5 text-[13px] text-white bg-tv-brand-bg rounded-full hover:bg-tv-brand-hover transition-colors shrink-0 font-semibold">
                    Next: Schedule<ChevronRight size={13} />
                  </button>
                );
              }
              // Step 5 (Schedule)
              if (currentKey === "schedule") {
                const canAdvance = isScheduleValid;
                return (
                  <div className="relative group shrink-0">
                    <button onClick={() => { if (canAdvance) goNext(); }} disabled={!canAdvance}
                      className={`flex items-center gap-1.5 px-6 py-2.5 text-[13px] rounded-full transition-colors ${
                        canAdvance
                          ? "text-white bg-tv-brand-bg hover:bg-tv-brand-hover"
                          : "text-white/60 bg-tv-brand-bg/40 cursor-not-allowed"
                      } font-semibold`}>
                      Next: Review &amp; Send<ChevronRight size={13} />
                    </button>
                    {!canAdvance && (
                      <div className="absolute bottom-full mb-2 right-0 w-52 p-2.5 bg-[#1e293b] text-white text-[11px] rounded-sm shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                        {!scheduleType ? "Please select a scheduling option." : scheduleDateInPast ? "Scheduled date is in the past." : "Complete the send configuration."}
                        <div className="absolute -bottom-1 right-6 w-2 h-2 bg-[#1e293b] rotate-45" />
                      </div>
                    )}
                  </div>
                );
              }
              // Step 7 — ConfirmSend has its own footer; no forward button needed here
              if (currentKey === "review") return null;
              return null;
            })()}
          </div>
        </div>
      )}

      {/* Video Request — library picker overlay */}
      {showVrLibraryPicker && (
        <div className="fixed inset-0 z-[70] bg-white flex flex-col">
          <VideoPickerView
            onBack={() => setShowVrLibraryPicker(false)}
            onSelect={(v: PickerVideo) => {
              setVrLibraryVideoId(v.id);
              setVrLibraryVideoTitle(v.title);
              setShowVrLibraryPicker(false);
              show(`"${v.title}" selected as instruction video`, "success");
            }}
          />
        </div>
      )}

      {/* Cancel confirmation overlay */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-labelledby="discard-campaign-title">
          <div className="bg-white rounded-xl border border-tv-border-light shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 id="discard-campaign-title" className="text-tv-text-primary mb-2">Discard campaign?</h3>
            <p className="text-[13px] text-tv-text-secondary mb-6">
              All progress on this campaign will be lost. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-5 py-2 text-[13px] text-tv-text-primary border border-tv-border-light rounded-full hover:bg-tv-surface transition-colors"
              >
                Keep Editing
              </button>
              <button
                onClick={() => navigate("/campaigns")}
                className="px-5 py-2 text-[13px] text-white bg-tv-danger rounded-full hover:opacity-90 transition-colors"
              >
                Discard Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save changes confirmation — breadcrumb step jump */}
      {pendingStepNav !== null && (
        <SaveChangesModal
          fromStep={WIZARD_STEPS[stepIndex]?.label}
          toStep={(() => {
            const target = WIZARD_STEPS[pendingStepNav];
            if (!target) return undefined;
            if (target.key === "video" && isVideoRequest) return "Recording";
            if (target.key === "constituents" && isVideoRequest) return "Recorders";
            return target.label;
          })()}
          onSaveAndContinue={confirmSaveAndNav}
          onDiscard={confirmDiscardAndNav}
          onStay={cancelPendingNav}
        />
      )}

      {showModeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-labelledby="leave-builder-title">
          <div className="bg-white rounded-xl border border-tv-border-light shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 id="leave-builder-title" className="text-tv-text-primary mb-2">Leave campaign builder?</h3>
            <p className="text-[13px] text-tv-text-secondary mb-6">
              Your current progress will be lost. Are you sure you want to go back?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModeConfirm(false)}
                className="px-5 py-2 text-[13px] text-tv-text-primary border border-tv-border-light rounded-full hover:bg-tv-surface transition-colors"
              >
                Keep Editing
              </button>
              <button
                onClick={() => { setShowModeConfirm(false); onBack(); }}
                className="px-5 py-2 text-[13px] text-white bg-tv-brand-bg rounded-full hover:bg-tv-brand-hover transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Save as Template modal ── */}
      {showSaveTemplate && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center" onClick={() => setShowSaveTemplate(false)} role="dialog" aria-modal="true" aria-labelledby="save-template-title">
          <div className="bg-white rounded-xl border border-tv-border-light shadow-xl w-full max-w-[460px] mx-4" onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4 border-b border-tv-border-divider">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0 bg-tv-star-bg">
                  <Bookmark size={18} className="text-tv-warning" />
                </div>
                <div>
                  <h3 id="save-template-title" className="text-tv-text-primary" style={{ fontSize: "16px", fontWeight: 700 }}>Save as Template</h3>
                  <p className="text-[12px] text-tv-text-secondary">Save this campaign configuration for reuse.</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-[12px] text-tv-text-label mb-1.5 block font-semibold">Template Name</label>
                <input
                  type="text"
                  autoComplete="off"
                  value={saveTemplateName}
                  onChange={e => setSaveTemplateName(e.target.value)}
                  placeholder="e.g. Annual Fund Thank You"
                  className={INPUT_CLS}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[12px] text-tv-text-label mb-1.5 block font-semibold">Description <span className="text-tv-text-decorative">(optional)</span></label>
                <textarea
                  value={saveTemplateDesc}
                  onChange={e => setSaveTemplateDesc(e.target.value)}
                  placeholder="Brief description of what this template is for…"
                  rows={3}
                  className={TEXTAREA_CLS}
                />
              </div>
              {/* Summary of what will be saved */}
              <div className="p-3 bg-tv-surface rounded-md border border-tv-border-divider">
                <p className="text-[10px] text-tv-text-label uppercase tracking-wider mb-2 font-semibold">Configuration to save</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <span className="text-[11px] text-tv-text-secondary">Mode:</span>
                  <span className="text-[11px] text-tv-text-primary" style={{ fontWeight: 500 }}>Single-Step</span>
                  <span className="text-[11px] text-tv-text-secondary">Goal:</span>
                  <span className="text-[11px] text-tv-text-primary" style={{ fontWeight: 500 }}>
                    {campaignGoal === "send-video" ? "Send with Video" : campaignGoal === "send-without-video" ? "Send without Video" : campaignGoal === "request-video" ? "Video Request" : "—"}
                  </span>
                  <span className="text-[11px] text-tv-text-secondary">Channel:</span>
                  <span className="text-[11px] text-tv-text-primary" style={{ fontWeight: 500 }}>{campaignCh === "email" ? "Email" : campaignCh === "sms" ? "SMS" : "—"}</span>
                  <span className="text-[11px] text-tv-text-secondary">Tags:</span>
                  <span className="text-[11px] text-tv-text-primary" style={{ fontWeight: 500 }}>{selectedTags.length > 0 ? selectedTags.join(", ") : "—"}</span>
                  {step.subject && <>
                    <span className="text-[11px] text-tv-text-secondary">Subject:</span>
                    <span className="text-[11px] text-tv-text-primary truncate" style={{ fontWeight: 500 }}>{step.subject}</span>
                  </>}
                  {step.senderName && <>
                    <span className="text-[11px] text-tv-text-secondary">Sender:</span>
                    <span className="text-[11px] text-tv-text-primary truncate" style={{ fontWeight: 500 }}>{step.senderName}</span>
                  </>}
                  {step.body && <>
                    <span className="text-[11px] text-tv-text-secondary">Body:</span>
                    <span className="text-[11px] text-tv-text-primary truncate" style={{ fontWeight: 500 }}>{step.body.replace(/<[^>]+>/g, "").slice(0, 50)}{(step.body.replace(/<[^>]+>/g, "").length > 50) ? "\u2026" : ""}</span>
                  </>}
                  {step.smsBody && <>
                    <span className="text-[11px] text-tv-text-secondary">SMS:</span>
                    <span className="text-[11px] text-tv-text-primary truncate" style={{ fontWeight: 500 }}>{step.smsBody.slice(0, 50)}{step.smsBody.length > 50 ? "\u2026" : ""}</span>
                  </>}
                  {step.landingPageEnabled && <>
                    <span className="text-[11px] text-tv-text-secondary">CTA:</span>
                    <span className="text-[11px] text-tv-text-primary truncate" style={{ fontWeight: 500 }}>{step.ctaText || "\u2014"}</span>
                  </>}
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex justify-end gap-2">
              <button onClick={() => setShowSaveTemplate(false)}
                className="px-4 py-2 text-[13px] text-tv-text-primary border border-tv-border-light rounded-full hover:bg-tv-surface transition-colors">
                Cancel
              </button>
              <button
                disabled={!saveTemplateName.trim()}
                onClick={() => {
                  addTemplate({
                    name: saveTemplateName.trim(),
                    description: saveTemplateDesc.trim(),
                    mode: "single",
                    goal: campaignGoal,
                    channel: campaignCh,
                    tags: selectedTags,
                    stepContent: {
                      type: step.type as "email" | "sms",
                      label: step.label,
                      subject: step.subject,
                      body: step.body,
                      senderName: step.senderName,
                      senderEmail: step.senderEmail,
                      replyTo: step.replyTo,
                      font: step.font,
                      bodyFontFamily: step.bodyFontFamily,
                      bodyFontSize: step.bodyFontSize,
                      bodyTextColor: step.bodyTextColor,
                      bodyLineHeight: step.bodyLineHeight,
                      smsBody: step.smsBody,
                      landingPageEnabled: step.landingPageEnabled,
                      ctaText: step.ctaText,
                      ctaUrl: step.ctaUrl,
                    },
                  });
                  setShowSaveTemplate(false);
                  show(`Template "${saveTemplateName.trim()}" saved`, "success");
                }}
                className={`flex items-center gap-1.5 px-5 py-2 text-[13px] rounded-full transition-colors ${
                  saveTemplateName.trim()
                    ? "text-white bg-tv-brand-bg hover:bg-tv-brand-hover"
                    : "text-white/60 bg-tv-brand-bg/40 cursor-not-allowed"
                } font-semibold`}>
                <Bookmark size={13} />Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CreateCampaign — top-level page component
// ═══════════════════════════════════════════════════════════════════════════════
/** Mock campaign data lookup for edit mode (mirrors CampaignDetail MOCK_CAMPAIGNS) */
function loadEditCampaignData(id: string): EditCampaignData | null {
  const EDIT_MOCK: Record<string, EditCampaignData> = {
    "1": {
      id: 1, name: "Spring Annual Fund Appeal", goal: "send-video", channel: "email",
      subject: "A personal message about your impact this spring",
      body: "Dear {{first_name}},\n\nThis spring, our community came together in an extraordinary way. Your generous gift of {{gift_amount}} helped us reach 12 first-generation students who would not otherwise have access to a Hartwell education.\n\nI recorded a quick video just for you — please take a moment to watch it.\n\nWarmly,\nKelley Molt",
      senderName: "Kelley Molt", senderEmail: "kelley.molt@hartwell.edu", replyTo: "giving@hartwell.edu",
      envelopeId: 1, landingPageEnabled: true, landingPageId: 1,
      lpHeadline: "Thank you, {{first_name}}!", ctaText: "Make Another Gift", ctaUrl: "https://give.hartwell.edu/donate",
      lpBody: "Your generous support of {{gift_amount}} is making a real difference at Hartwell University.",
      selectedMetrics: ["open-rate", "click-rate", "reply-rate"],
      tags: ["Solicitation"],
      hasIntro: true, hasOutro: true, hasPersonalVideo: true,
      constituents: [
        { id: 1, name: "James Whitfield", email: "j.whitfield@alumni.edu", phone: "+1 (555) 123-4567", source: "Major Donors" },
        { id: 2, name: "Sarah Chen", email: "s.chen@foundation.org", phone: "+1 (555) 234-5678", source: "Major Donors" },
        { id: 3, name: "Marcus Reid", email: "m.reid@email.com", phone: "+1 (555) 345-6789", source: "CSV Upload" },
        { id: 4, name: "Emily Torres", email: "e.torres@corp.com", phone: "+1 (555) 456-7890", source: "New Donors 2025" },
        { id: 5, name: "David Park", email: "d.park@alumni.edu", phone: "+1 (555) 567-8901", source: "All Donors" },
        { id: 6, name: "Alicia Grant", email: "a.grant@corp.com", phone: "+1 (555) 678-9012", source: "CSV Upload" },
        { id: 7, name: "Tom Hernandez", email: "t.hernandez@alumni.edu", phone: "+1 (555) 789-0123", source: "All Donors" },
      ],
    },
    "2": {
      id: 2, name: "Thank You – Multi-Step 2.0", goal: "send-video", channel: "email",
      subject: "Thank you for your generous support", body: "Dear {{first_name}},\n\nThank you for your generous support...",
      senderName: "Kelley Molt", senderEmail: "kelley.molt@hartwell.edu", replyTo: "giving@hartwell.edu",
      landingPageEnabled: true, selectedMetrics: ["open-rate", "reply-rate"], tags: ["Thank You"],
      hasIntro: true, hasOutro: false, hasPersonalVideo: true,
      constituents: [
        { id: 1, name: "James Whitfield", email: "j.whitfield@alumni.edu", phone: "+1 (555) 123-4567", source: "All Donors" },
        { id: 2, name: "Sarah Chen", email: "s.chen@foundation.org", phone: "+1 (555) 234-5678", source: "All Donors" },
      ],
    },
  };
  return EDIT_MOCK[id] ?? null;
}

export function CreateCampaign() {
  const [searchParams] = useSearchParams();
  const { id: editId } = useParams();
  const { templates } = useTemplates();
  // Auto-select mode from URL params (dropdown links) or returnStep (returning from builder)
  const returningStep = searchParams.get("returnStep");
  const urlMode = searchParams.get("mode");
  const templateId = searchParams.get("template");

  // Resolve template from URL param
  const resolvedTemplate = templateId ? templates.find(t => t.id === templateId) ?? null : null;

  // Edit mode: load existing campaign data when route has :id
  const editCampaign = editId ? loadEditCampaignData(editId) : null;

  const resolveInitialMode = (): StepMode | null => {
    if (editCampaign) return "single"; // Edit always uses single-step wizard
    if (returningStep) return "single";
    if (resolvedTemplate) return resolvedTemplate.mode;
    if (urlMode === "single" || urlMode === "video-request") return "single";
    if (urlMode === "multi") return "multi";
    return "single"; // Default to single-step — skip the mode-select screen
  };

  const [mode, setMode] = useState<StepMode | null>(resolveInitialMode);

  // StepSetupModal state for multi-step mode
  const [setupType, setSetupType] = useState<"email" | "sms" | null>(null);

  const navigate = useNavigate();
  const handleBackToModeSelect = useCallback(() => {
    if (editCampaign) {
      navigate(`/campaigns/${editCampaign.id}`);
    } else {
      navigate("/campaigns");
    }
  }, [navigate, editCampaign]);

  // Derive initialGoal for SingleStepWizard when coming from dropdown items
  const initialGoal: CampaignGoal | null = urlMode === "video-request" ? "request-video" : null;

  if (!mode) {
    return (
      <div className="min-h-full flex flex-col bg-tv-surface-muted">
        <StepModeSelect onSelect={setMode} />
      </div>
    );
  }

  if (mode === "multi") {
    return (
      <>
        <MultiStepBuilder onBack={handleBackToModeSelect} initialTemplate={resolvedTemplate?.mode === "multi" ? resolvedTemplate : null} />
        {setupType && (
          <StepSetupModal
            stepType={setupType}
            onComplete={() => setSetupType(null)}
            onCancel={() => setSetupType(null)}
          />
        )}
      </>
    );
  }

  return <SingleStepWizard onBack={handleBackToModeSelect} initialGoal={initialGoal} initialTemplate={resolvedTemplate} editCampaign={editCampaign} />;
}
