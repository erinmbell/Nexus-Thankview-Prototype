import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FocusTrap } from "@mantine/core";
import {
  ChevronLeft, ChevronRight, ChevronDown, Check, X, Mail, MessageSquare,
  Play, Plus, Type, Globe, Clock,
  Video, Camera, Film, Smile,
  Share2, TriangleAlert, CircleAlert, GitBranch, Timer, Trash2, Pencil, Flag, XCircle, Sparkles,
  FileText, ExternalLink, MailCheck, Lightbulb, Upload,
  Info, Users, Calendar, Send, Zap, CalendarClock, Repeat, Link2, Copy,
  CalendarDays, Cake, GraduationCap, Briefcase, Loader2, Eye, Palette,
  Download, Bookmark, Reply, Captions, Search, BarChart3, Maximize2, Settings2,
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { useDesignLibrary } from "../../contexts/DesignLibraryContext";
import { useTemplates, type CampaignTemplate, type TemplateStepContent } from "../../contexts/TemplateContext";
import { SaveChangesModal } from "../../components/SaveChangesModal";
import { VideoPickerView, VideoCreateView, PICKER_VIDEOS, type PickerVideo } from "./VideoModals";
import { ConstituentPanel } from "./ConstituentPanel";
import { LivePreviewPanel } from "./LivePreviewPanel";
import { DesignStepPanel, PAPER_TEXTURE, PerforatedStamp, HolidayGraphic, isDarkColor } from "./DesignStepPanel";
import { RichTextEditor } from "../../components/RichTextEditor";
import { MergeFieldPicker } from "../../components/MergeFieldPicker";
import { VRRecorderPanel } from "./VRRecorderPanel";
import { EnvelopeBuilderModal } from "./EnvelopeBuilderModal";
import { LandingPageBuilderModal } from "./LandingPageBuilderModal";
import {
  type FlowStepType, type FlowStep, type ConstituentDateFieldId,
  FLOW_STEP_TYPES, CONDITION_OPTIONS, WAIT_PRESETS, makeId, SMS_MAX,
  MERGE_FIELDS, LANDING_PAGES, CONSTITUENT_DATE_FIELDS,
  VR_DEFAULT_INSTRUCTIONS, VR_RECORDING_TIPS,
  LANGUAGE_OPTIONS, ENV_FONTS, ENVELOPE_DESIGNS,
} from "./types";
import { AIWritingPopover } from "../../components/AIWritingPopover";
import { Toggle } from "../../components/ui/Toggle";
import { TV } from "../../theme";
import { INPUT_CLS, TEXTAREA_CLS, SELECT_CLS, MERGE_PILL_CLS, RTE_BODY_CLS, TAG_INPUT_WRAPPER_CLS, INPUT_CLS_LG, INPUT_CLS_LG_FLEX, ICON_BTN_CLS, RTE_WRAPPER_CLS, RTE_WRAPPER_BASE_CLS } from "./styles";
import { SimpleRTE, MergeFieldDropdown, EmojiDropdown } from "./SharedUI";
import { MergeFieldValidation } from "../../components/MergeFieldValidation";
import { ConfigureStepPanel } from "./ConfigureStepPanel";
import { FloatingPreview } from "./FloatingPreview";
import { CharCount, BodyHeaderCount, SmsCharCounter, EmailBodyCharCounter, CHAR_LIMITS, htmlTextLength, getEditorWarnCls } from "../../components/CharCounters";
import { CtaButtonControls } from "../../components/CtaButtonControls";
import { EmailTemplateActions } from "../../components/EmailTemplateAndSignature";
import { TvTooltip } from "../../components/TvTooltip";

// ── SmsMergeMore — "+More" button that opens the full MergeFieldPicker ──────
function SmsMergeMore({ onInsert }: { onInsert: (token: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${open ? "bg-tv-brand-tint text-tv-brand" : "text-tv-brand hover:bg-tv-brand-tint"}`}
        style={{ fontWeight: 600 }}
      >
        + More
      </button>
      {open && (
        <MergeFieldPicker
          onInsert={token => onInsert(token)}
          onClose={() => setOpen(false)}
          compact
        />
      )}
    </div>
  );
}

// Runtime feature markers for audit auto-detection
export const __AUDIT_MARKERS__ = [
  'pdf-upload-zone', 'pdf-card-metadata', 'pdf-allow-download-toggle',
  'pdf-share-toggle',
  'form-embed-url', 'form-platform-detection', 'form-height-config',
  'form-fullwidth-toggle',
  'sms-tablet-preview', 'sms-desktop-info-banner',
  // Birthday / Anniversary automation config panel
  'bday-send-timing-row', 'bday-preset-chips', 'bday-mini-calendar',
  'bday-recur-annually-toggle', 'bday-feb29-banner', 'bday-future-constituents-note',
  'bday-date-field-picker', 'bday-drawer-trigger-type',
  // Merge field validation panel in pre-send flow
  'merge-field-scan-banner', 'merge-field-action-remove',
  'merge-field-action-fallback', 'merge-field-action-skip',
  'merge-field-success-state',
] as const;

// ── Flow Node ────────────────────────────────────────────────────────────────
function FlowNode({
  step,
  selected,
  onSelect,
  onDelete,
  onToggleAutomation,
}: {
  step: FlowStep;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onToggleAutomation?: () => void;
}) {
  const typeDef = FLOW_STEP_TYPES.find(t => t.id === step.type);
  const Icon = typeDef?.icon ?? Mail;
  const isCondition = step.type === "condition";
  const isWait = step.type === "wait";
  const isExit = step.type === "exit";

  if (isExit) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-tv-surface-muted border border-tv-border rounded-full text-[12px] text-tv-text-secondary" style={{ fontWeight: 500 }}>
        <Flag size={12} className="text-tv-text-secondary" />
        End
      </div>
    );
  }

  if (isWait) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } }}
        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full border-2 transition-all hover:shadow-md cursor-pointer ${
          selected ? "border-tv-brand-bg bg-tv-brand-tint shadow-md" : "border-tv-warning-border bg-tv-warning-bg hover:border-tv-warning"
        }`}
      >
        <Timer size={14} className="text-tv-warning" />
        <span className="text-[12px] text-tv-text-primary" style={{ fontWeight: 600 }}>
          Wait {step.waitDays || 3} day{(step.waitDays || 3) !== 1 ? "s" : ""}
        </span>
        <TvTooltip label="Edit wait step">
          <button onClick={e => { e.stopPropagation(); onSelect(); }} className="w-5 h-5 rounded-full hover:bg-white/60 flex items-center justify-center text-tv-text-secondary hover:text-tv-brand transition-colors ml-1">
            <Pencil size={10} />
          </button>
        </TvTooltip>
        <TvTooltip label="Delete wait step">
          <button onClick={e => { e.stopPropagation(); onDelete(); }} className="w-5 h-5 rounded-full hover:bg-white/60 flex items-center justify-center text-tv-text-secondary hover:text-tv-danger transition-colors">
            <X size={11} />
          </button>
        </TvTooltip>
      </div>
    );
  }

  // Helpers to detect whether this node has rich content filled in
  const hasEmailContent = step.type === "email" && !!(step.subject || step.body);
  const hasSmsContent = step.type === "sms" && !!step.smsBody;
  const bodyPlain = step.body ? step.body.replace(/<[^>]+>/g, "") : "";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } }}
      className={`w-[320px] text-left rounded-lg border-2 overflow-hidden transition-all hover:shadow-lg cursor-pointer ${
        selected ? "border-tv-brand-bg shadow-lg" : isCondition ? "border-tv-border hover:border-tv-brand-bg" : "border-tv-border-light hover:border-tv-border-strong"
      }`}
    >
      {/* Color bar */}
      <div className={`h-[3px] ${isCondition ? "bg-tv-brand" : step.type === "sms" ? "bg-tv-info" : step.type === "video-request" ? "bg-tv-warning" : "bg-tv-brand-bg"}`} />
      <div className="bg-white px-4 py-3">
        {/* ── Header row ── */}
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 ${typeDef?.bg || "bg-tv-brand-tint"}`}>
            <Icon size={15} className={typeDef?.color || "text-tv-brand"} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-tv-text-primary" style={{ fontWeight: 700 }}>{step.label || typeDef?.label}</p>
            {isCondition ? (
              <p className="text-[11px] text-tv-brand truncate" style={{ fontWeight: 500 }}>{step.conditionField || "Select condition\u2026"}</p>
            ) : step.type === "email" && !step.subject ? (
              <p className="text-[11px] text-tv-brand truncate" style={{ fontWeight: 500 }}>+ Add email content</p>
            ) : step.type === "sms" && !step.smsBody ? (
              <p className="text-[11px] text-tv-info truncate" style={{ fontWeight: 500 }}>+ Add SMS content</p>
            ) : step.type === "video-request" ? (
              <p className="text-[11px] text-tv-warning truncate" style={{ fontWeight: 500 }}>
                {step.vrDueDate ? `Due ${step.vrDueDate}` : "Configure request\u2026"}
              </p>
            ) : !hasEmailContent && !hasSmsContent ? (
              <p className="text-[11px] text-tv-brand" style={{ fontWeight: 500 }}>+ Add content</p>
            ) : null}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <TvTooltip label="Edit step">
              <button onClick={e => { e.stopPropagation(); onSelect(); }} className="w-6 h-6 rounded-full hover:bg-tv-surface flex items-center justify-center text-tv-text-secondary hover:text-tv-brand transition-colors">
                <Pencil size={11} />
              </button>
            </TvTooltip>
            <TvTooltip label="Delete step">
              <button onClick={e => { e.stopPropagation(); onDelete(); }} className="w-6 h-6 rounded-full hover:bg-tv-danger-bg flex items-center justify-center text-tv-text-secondary hover:text-tv-danger transition-colors">
                <Trash2 size={11} />
              </button>
            </TvTooltip>
          </div>
        </div>

        {/* ── Rich email content preview ── */}
        {hasEmailContent && (
          <div className="mt-2.5 p-2.5 bg-tv-surface-muted rounded-sm border border-tv-border-divider space-y-1.5">
            {step.senderName && (
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-tv-text-decorative uppercase tracking-wider shrink-0" style={{ fontWeight: 600 }}>From</span>
                <span className="text-[10px] text-tv-text-primary truncate" style={{ fontWeight: 600 }}>{step.senderName}</span>
                {step.senderEmail && <span className="text-[9px] text-tv-text-secondary truncate">&lt;{step.senderEmail}&gt;</span>}
              </div>
            )}
            {step.subject && (
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-tv-text-decorative uppercase tracking-wider shrink-0" style={{ fontWeight: 600 }}>Subj</span>
                <span className="text-[10px] text-tv-text-primary truncate" style={{ fontWeight: 500 }}>{step.subject}</span>
              </div>
            )}
            {bodyPlain && (
              <p className="text-[10px] text-tv-text-secondary leading-relaxed line-clamp-2">
                {bodyPlain.slice(0, 120)}{bodyPlain.length > 120 ? "\u2026" : ""}
              </p>
            )}
            {step.ctaText && step.landingPageEnabled && (
              <div className="flex items-center gap-1.5 pt-1">
                <span className="inline-flex items-center gap-1 text-[9px] text-white bg-tv-brand-bg px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>
                  <ExternalLink size={7} />{step.ctaText}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Rich SMS content preview ── */}
        {hasSmsContent && (
          <div className="mt-2.5 p-2.5 bg-tv-info-bg rounded-sm border border-tv-info-border/40 space-y-1.5">
            {step.senderName && (
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-tv-text-decorative uppercase tracking-wider shrink-0" style={{ fontWeight: 600 }}>From</span>
                <span className="text-[10px] text-tv-text-primary truncate" style={{ fontWeight: 600 }}>{step.senderName}</span>
              </div>
            )}
            <p className="text-[10px] text-tv-text-secondary leading-relaxed line-clamp-3">
              {step.smsBody!.slice(0, 160)}{step.smsBody!.length > 160 ? "\u2026" : ""}
            </p>
          </div>
        )}

        {/* ── Condition branch preview ── */}
        {isCondition && (
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <div className="p-1.5 rounded-sm bg-tv-success-bg border border-tv-success-border/40">
              <p className="text-[8px] text-tv-success uppercase tracking-wider" style={{ fontWeight: 700 }}>Yes</p>
              <p className="text-[9px] text-tv-text-secondary truncate" style={{ fontWeight: 500 }}>
                {step.trueBranch && step.trueBranch.length > 0
                  ? `${step.trueBranch.length} step${step.trueBranch.length > 1 ? "s" : ""}: ${step.trueBranch[0].label}`
                  : "No steps yet"}
              </p>
            </div>
            <div className="p-1.5 rounded-sm bg-tv-danger-bg border border-tv-danger-border/40">
              <p className="text-[8px] text-tv-danger uppercase tracking-wider" style={{ fontWeight: 700 }}>No</p>
              <p className="text-[9px] text-tv-text-secondary truncate" style={{ fontWeight: 500 }}>
                {step.falseBranch && step.falseBranch.length > 0
                  ? `${step.falseBranch.length} step${step.falseBranch.length > 1 ? "s" : ""}: ${step.falseBranch[0].label}`
                  : "No steps yet"}
              </p>
            </div>
          </div>
        )}

        {/* Status chips for video-request */}
        {step.type === "video-request" && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {step.vrDueDate && (
              <span className="inline-flex items-center gap-1 text-[9px] text-tv-warning bg-tv-warning-bg px-1.5 py-0.5 rounded-full border border-tv-warning-border" style={{ fontWeight: 500 }}>
                <Calendar size={8} />Due {step.vrDueDate}
              </span>
            )}
            {step.vrSubmissionsEnabled !== false && (
              <span className="inline-flex items-center gap-1 text-[9px] text-tv-success bg-tv-success-bg px-1.5 py-0.5 rounded-full border border-tv-success-border" style={{ fontWeight: 500 }}>
                <Check size={8} />Open
              </span>
            )}
            {step.vrDeliveryType === "link" && (
              <span className="inline-flex items-center gap-1 text-[9px] text-tv-info bg-tv-info-bg px-1.5 py-0.5 rounded-full border border-tv-info-border" style={{ fontWeight: 500 }}>
                <Link2 size={8} />Link
              </span>
            )}
          </div>
        )}
        {/* Chip badges for attachments (only when no rich preview shown) */}
        {!hasEmailContent && !hasSmsContent && (step.type === "email" || step.type === "sms") && (step.attachedVideo || step.landingPageEnabled) && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {step.attachedVideo && (
              <span className="inline-flex items-center gap-1 text-[9px] text-tv-brand bg-tv-brand-tint px-1.5 py-0.5 rounded-full border border-tv-border" style={{ fontWeight: 500 }}>
                <Video size={8} />Video
              </span>
            )}
            {step.landingPageEnabled && (
              <span className="inline-flex items-center gap-1 text-[9px] text-tv-brand bg-tv-brand-tint px-1.5 py-0.5 rounded-full border border-tv-border" style={{ fontWeight: 500 }}>
                <Globe size={8} />Landing Page
              </span>
            )}
          </div>
        )}
        {/* Automation row */}
        {!isCondition && (
          <div
            className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-tv-border-divider cursor-pointer hover:bg-tv-surface/40 -mx-3 px-3 -mb-2.5 pb-2.5 rounded-b-[10px] transition-colors"
            onClick={(e) => { e.stopPropagation(); onToggleAutomation?.(); }}
            role="switch"
            aria-checked={step.automationEnabled}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onToggleAutomation?.(); } }}
          >
            <Toggle enabled={step.automationEnabled} onToggle={() => {}} size="compact" className="pointer-events-none" />
            <span className={`text-[11px] ${step.automationEnabled ? "text-tv-brand" : "text-tv-text-secondary"}`} style={{ fontWeight: 500 }}>
              {step.automationEnabled && step.contactDateFieldId
                ? `By ${CONSTITUENT_DATE_FIELDS.find(f => f.id === step.contactDateFieldId)?.label ?? "date field"}`
                : `Automation ${step.automationEnabled ? "enabled" : "disabled"}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Sortable wrapper for FlowNode — enables drag-and-drop reordering */
function SortableStepItem({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="flex items-center">
        <button {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-tv-text-decorative hover:text-tv-text-secondary -ml-6 mr-1 opacity-0 group-hover/sortable:opacity-100 transition-opacity" title="Drag to reorder">
          <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor"><circle cx="3" cy="2" r="1.2"/><circle cx="7" cy="2" r="1.2"/><circle cx="3" cy="7" r="1.2"/><circle cx="7" cy="7" r="1.2"/><circle cx="3" cy="12" r="1.2"/><circle cx="7" cy="12" r="1.2"/></svg>
        </button>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

function AddStepButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-px h-5 bg-tv-border" />
      <TvTooltip label="Add step">
        <button
          onClick={onClick}
          className="w-7 h-7 rounded-full border border-tv-border-strong bg-white flex items-center justify-center text-tv-brand hover:bg-tv-brand-tint hover:border-tv-brand-bg transition-all hover:scale-110"
        >
          <Plus size={13} />
        </button>
      </TvTooltip>
      <div className="w-px h-5 bg-tv-border" />
    </div>
  );
}

function Connector() {
  return <div className="w-px h-6 bg-tv-border mx-auto" />;
}

function AddStepPopover({ onAdd, onClose }: { onAdd: (type: FlowStepType) => void; onClose: () => void }) {
  const popRef = useRef<HTMLDivElement>(null);
  const [above, setAbove] = useState(false);

  // Measure on mount: if not enough room below, flip above
  useEffect(() => {
    const el = popRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.bottom > window.innerHeight - 20) setAbove(true);
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={popRef}
        className={`absolute left-1/2 -translate-x-1/2 z-50 bg-white rounded-md border border-tv-border-light shadow-xl p-2 w-[220px] ${above ? "bottom-full mb-2" : "top-full mt-2"}`}
      >
        <p className="tv-label px-2 py-1.5 text-tv-text-secondary">Add Step</p>
        {FLOW_STEP_TYPES.map(t => (
          <button
            key={t.id}
            onClick={() => { onAdd(t.id); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm hover:bg-tv-surface transition-colors text-left"
          >
            <div className={`w-7 h-7 rounded-sm ${t.bg} flex items-center justify-center shrink-0`}>
              <t.icon size={13} className={t.color} />
            </div>
            <div>
              <p className="text-[12px] text-tv-text-primary" style={{ fontWeight: 600 }}>{t.label}</p>
              <p className="text-[10px] text-tv-text-secondary">{t.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

/* ── Collapsible drawer section ──────────────────────────────��───────────────── */


function DrawerSection({
  title, icon: SectionIcon, iconColor = "text-tv-brand", open, onToggle, badge, children,
}: {
  title: string; icon: any; iconColor?: string; open: boolean; onToggle: () => void; badge?: string; children: ReactNode;
}) {
  return (
    <div className="border border-tv-border-light rounded-md overflow-visible">
      <button onClick={onToggle} className={`w-full flex items-center gap-2.5 px-3.5 py-3 bg-tv-surface-muted hover:bg-tv-surface transition-colors text-left rounded-t-[9px] ${!open ? "rounded-b-[9px]" : ""}`}>
        <SectionIcon size={13} className={iconColor} />
        <span className="flex-1 text-[12px] text-tv-text-primary" style={{ fontWeight: 600 }}>{title}</span>
        {badge && <span className="text-[9px] text-tv-brand bg-tv-brand-tint px-1.5 py-0.5 rounded-full" style={{ fontWeight: 600 }}>{badge}</span>}
        <ChevronDown size={12} className={`text-tv-text-secondary transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-3.5 pb-3.5 pt-1 space-y-3">{children}</div>}
    </div>
  );
}

/* ── Social Sharing Card (Facebook OG config) ────────────────────────────────── */
function SocialSharingCard({
  ogTitle, ogDescription, ogImage, onChange,
}: {
  ogTitle: string; ogDescription: string; ogImage: string;
  onChange: (t: string, d: string, img: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-[#1877F2] flex items-center justify-center shrink-0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </div>
        <span className="text-[12px] text-tv-text-primary" style={{ fontWeight: 600 }}>Facebook Share Settings</span>
      </div>

      <p className="text-[10px] text-tv-text-secondary leading-relaxed">
        Configure how this campaign appears when shared on Facebook. These values populate the Open Graph meta tags.
      </p>

      <div>
        <label className="tv-label mb-1 block">Title</label>
        <input
          value={ogTitle}
          onChange={e => onChange(e.target.value, ogDescription, ogImage)}
          placeholder="Page title…"
          className={INPUT_CLS}
        />
      </div>
      <div>
        <label className="tv-label mb-1 block">Description</label>
        <textarea
          value={ogDescription}
          onChange={e => onChange(ogTitle, e.target.value, ogImage)}
          placeholder="Page description…"
          rows={2}
          className={TEXTAREA_CLS}
        />
      </div>
      <div>
        <label className="tv-label mb-1 block">Image URL</label>
        <input
          value={ogImage}
          onChange={e => onChange(ogTitle, ogDescription, e.target.value)}
          placeholder="https://example.com/image.jpg"
          className={`${INPUT_CLS} font-mono`}
        />
      </div>

      {/* Mini OG preview */}
      <div className="border border-[#dadde1] rounded-sm overflow-hidden bg-[#f0f2f5]">
        <div className="flex">
          <div className="w-[100px] shrink-0 bg-[#e4e6eb] flex items-center justify-center overflow-hidden" style={{ minHeight: 72 }}>
            {ogImage ? (
              <img src={ogImage} alt="Step preview" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <Globe size={16} className="text-[#bec3c9]" />
            )}
          </div>
          <div className="flex-1 min-w-0 px-2.5 py-2 flex flex-col justify-center gap-0.5 bg-[#f0f2f5]">
            <span className="text-[8px] text-[#65676b] uppercase tracking-wide">hartwell.thankview.com</span>
            <span className="text-[11px] text-[#1c1e21] leading-tight line-clamp-1" style={{ fontWeight: 600 }}>
              {ogTitle || "Untitled"}
            </span>
            <span className="text-[9px] text-[#65676b] leading-snug line-clamp-2">
              {ogDescription || "No description."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step Drawer ─────────────────────────────────────────���────────────────────
function StepDrawer({
  step,
  onUpdate,
  onClose,
  showPreview,
  onTogglePreview,
  precedingStepType,
}: {
  step: FlowStep;
  onUpdate: (updated: FlowStep) => void;
  onClose: () => void;
  showPreview: boolean;
  onTogglePreview: () => void;
  precedingStepType?: FlowStepType;
}) {
  const { show } = useToast();
  const { customEnvelopes: globalEnvelopes, customLandingPages: globalLandingPages } = useDesignLibrary();
  const typeDef = FLOW_STEP_TYPES.find(t => t.id === step.type);
  const Icon = typeDef?.icon ?? Mail;
  const isEmail = step.type === "email";
  const isSms = step.type === "sms";
  const isVR = step.type === "video-request";
  const isMessaging = isEmail || isSms;

  // Expandable drawer width
  const [expanded, setExpanded] = useState(false);

  // Accordion state — multiple sections can be open
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    requirements: false, info: false, content: false, video: false, landing: false, settings: false, social: false,
    wait: false, condition: false,
    vrDelivery: false, vrInstructions: false, vrSchedule: false, vrLanding: false,
  });
  const toggleSection = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  // Video picker + create modals
  const [showVideoPicker, setShowVideoPicker] = useState(false);
  const [showVideoCreate, setShowVideoCreate] = useState(false);
  const [videoCreateInitialTab, setVideoCreateInitialTab] = useState<"record" | "upload" | "library">("record");

  // Envelope library + builder modals
  const [showEnvelopeLibrary, setShowEnvelopeLibrary] = useState(false);
  const [showEnvelopeBuilder, setShowEnvelopeBuilder] = useState(false);
  const [envLibSearch, setEnvLibSearch] = useState("");

  // Landing page library + builder modals
  const [showLpLibrary, setShowLpLibrary] = useState(false);
  const [showLpBuilder, setShowLpBuilder] = useState(false);
  const [lpLibSearch, setLpLibSearch] = useState("");

  // Instruction video picker (VR Recording Instructions)
  const [showInstructionVideoPicker, setShowInstructionVideoPicker] = useState(false);

  // Close instruction video picker on Escape (WCAG 2.1.1)
  useEffect(() => {
    if (!showInstructionVideoPicker) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setShowInstructionVideoPicker(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [showInstructionVideoPicker]);
  const [instrVidSearch, setInstrVidSearch] = useState("");

  // AI state
  const [showAi, setShowAi] = useState(false);

  // Merge field dropdown
  const [showMerge, setShowMerge] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyToInput, setReplyToInput] = useState("");

  // SMS helpers
  const smsLen = (step.smsBody || "").length;

  // All envelopes merged (custom + built-in)
  const allEnvelopes = [...globalEnvelopes, ...ENVELOPE_DESIGNS];
  // All landing pages merged
  const allLandingPages = [...globalLandingPages, ...LANDING_PAGES];
  // isDarkColor imported from DesignStepPanel

  // ── Validation requirements ──────────────────────────────────────────────
  const requirements: { key: string; label: string; met: boolean; severity: "error" | "warning" | "info" }[] = [];

  if (isEmail) {
    requirements.push(
      { key: "subject", label: "Subject line", met: !!(step.subject && step.subject.trim()), severity: "error" },
      { key: "body", label: "Message body", met: !!(step.body && step.body.trim()), severity: "error" },
      { key: "sender", label: "Sender name", met: !!(step.senderName && step.senderName.trim()), severity: "warning" },
      { key: "senderEmail", label: "Sender email", met: !!(step.senderEmail && step.senderEmail.trim()), severity: "warning" },
    );
  }
  if (isSms) {
    requirements.push(
      { key: "smsBody", label: "SMS message body", met: !!(step.smsBody && step.smsBody.trim()), severity: "error" },
      { key: "smsPhone", label: "Phone number", met: !!(step.smsPhoneNumber && step.smsPhoneNumber.trim()), severity: "warning" },
    );
  }
  if (isVR) {
    requirements.push(
      { key: "vrInstr", label: "Recording instructions", met: !!(step.vrInstructions && step.vrInstructions.trim()), severity: "warning" },
      { key: "vrDue", label: "Due date", met: !!step.vrDueDate, severity: "warning" },
    );
  }
  // Landing page is required when video is attached
  if (isMessaging && step.attachedVideo) {
    requirements.push(
      { key: "lpRequired", label: "Landing page (required with video)", met: !!step.landingPageEnabled, severity: "error" },
    );
  }
  const unmetErrors = requirements.filter(r => !r.met && r.severity === "error");
  const unmetWarnings = requirements.filter(r => !r.met && r.severity === "warning");
  const allRequiredMet = unmetErrors.length === 0;

  const isVideoViewActive = showVideoPicker || showVideoCreate;

  return (
    <>
    <motion.div
      initial={{ width: 380 }}
      animate={{ width: (expanded || isVideoViewActive) ? "calc(100vw - 340px)" : 380 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="shrink-0 border-l border-tv-border-divider bg-white flex flex-col overflow-y-auto"
    >
      {/* Drawer header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-tv-border-divider shrink-0">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className={`w-7 h-7 rounded-sm ${typeDef?.bg || "bg-tv-brand-tint"} flex items-center justify-center shrink-0`}>
            <Icon size={13} className={typeDef?.color || "text-tv-brand"} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-tv-text-primary truncate" style={{ fontWeight: 700 }}>{step.label || typeDef?.label}</p>
            <p className="text-[10px] text-tv-text-secondary">{typeDef?.desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {(isEmail || isSms) && (
            <button
              onClick={onTogglePreview}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors ${showPreview ? "bg-tv-brand-tint text-tv-brand border border-tv-brand/20" : "bg-tv-surface text-tv-text-secondary hover:bg-tv-surface-hover border border-tv-border-light"}`}
            >
              <Eye size={11} />
              {showPreview ? "Hide Preview" : "Show Preview"}
            </button>
          )}
          <TvTooltip label={expanded ? "Collapse editor" : "Full-width editor"}>
            <button
              onClick={() => setExpanded(e => !e)}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${expanded ? "bg-tv-brand-tint text-tv-brand" : "bg-tv-surface text-tv-text-secondary hover:bg-tv-surface-hover"}`}
            >
              <Maximize2 size={11} className={expanded ? "rotate-180" : ""} />
            </button>
          </TvTooltip>
          <TvTooltip label="Close">
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-tv-surface flex items-center justify-center text-tv-text-secondary hover:bg-tv-surface-hover transition-colors">
              <X size={13} />
            </button>
          </TvTooltip>
        </div>
      </div>

      {/* Body — when a video sub-view is active, it takes over the full area (matches single-step builder) */}
      {showVideoPicker ? (
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <VideoPickerView
            onBack={() => setShowVideoPicker(false)}
            onSelect={(v) => {
              if (step.type === "video-request") {
                onUpdate({ ...step, vrLibraryVideoId: v.id, vrLibraryVideoTitle: v.title });
              } else {
                onUpdate({ ...step, attachedVideo: { id: v.id, title: v.title, duration: v.duration, color: v.color } });
              }
              setShowVideoPicker(false);
              show(`"${v.title}" ${step.type === "video-request" ? "selected" : "attached"}`, "success");
            }}
          />
        </div>
      ) : showVideoCreate ? (
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <VideoCreateView
            onBack={() => setShowVideoCreate(false)}
            onSave={(v) => {
              if (step.type === "video-request") {
                onUpdate({ ...step, vrLibraryVideoId: v.id, vrLibraryVideoTitle: v.title });
              } else {
                onUpdate({ ...step, attachedVideo: { id: v.id, title: v.title, duration: v.duration, color: v.color } });
              }
              setShowVideoCreate(false);
              show(`"${v.title}" ${step.type === "video-request" ? "selected" : "recorded & attached"}`, "success");
            }}
          />
        </div>
      ) : (
      <>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

        {/* ── Requirements & Alerts panel ── */}
        {(isEmail || isSms || isVR) && (
          <DrawerSection
            title="Requirements"
            icon={allRequiredMet ? Check : CircleAlert}
            iconColor={unmetErrors.length > 0 ? "text-tv-danger" : unmetWarnings.length > 0 ? "text-tv-warning" : "text-tv-success"}
            open={openSections.requirements}
            onToggle={() => toggleSection("requirements")}
            badge={allRequiredMet ? (unmetWarnings.length > 0 ? `${unmetWarnings.length} optional` : "All met") : `${unmetErrors.length} required`}
          >
            <div className="space-y-1.5">
              {requirements.map(r => (
                <div key={r.key} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-sm transition-colors ${
                  r.met
                    ? "bg-tv-success-bg/50"
                    : r.severity === "error" ? "bg-tv-danger-bg" : r.severity === "warning" ? "bg-tv-warning-bg/50" : "bg-tv-surface"
                }`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                    r.met ? "bg-tv-success text-white" : r.severity === "error" ? "border-2 border-tv-danger" : r.severity === "warning" ? "border-2 border-tv-warning" : "border-2 border-tv-border-light"
                  }`}>
                    {r.met && <Check size={9} />}
                  </div>
                  <span className={`text-[11px] flex-1 ${r.met ? "text-tv-text-secondary line-through" : r.severity === "error" ? "text-tv-danger" : "text-tv-text-primary"}`} style={{ fontWeight: r.met ? 400 : 500 }}>
                    {r.label}
                  </span>
                  {r.met ? (
                    <span className="text-[9px] text-tv-success" style={{ fontWeight: 600 }}>Done</span>
                  ) : r.severity === "info" ? (
                    <span className="text-[9px] text-tv-text-decorative" style={{ fontWeight: 500 }}>Optional</span>
                  ) : r.severity === "warning" ? (
                    <span className="text-[9px] text-tv-warning" style={{ fontWeight: 500 }}>Recommended</span>
                  ) : (
                    <span className="text-[9px] text-tv-danger" style={{ fontWeight: 600 }}>Required</span>
                  )}
                </div>
              ))}
            </div>
            {!allRequiredMet && (
              <div className="mt-2 p-2.5 bg-tv-danger-bg border border-tv-danger-border rounded-sm flex items-start gap-2">
                <TriangleAlert size={11} className="text-tv-danger shrink-0 mt-0.5" />
                <p className="text-[10px] text-tv-danger leading-relaxed">
                  Complete all required fields before sending this step. Missing fields will block campaign activation.
                </p>
              </div>
            )}
          </DrawerSection>
        )}



        {/* Step Info section */}
        <DrawerSection title="Step Info" icon={Type} open={openSections.info} onToggle={() => toggleSection("info")}>
          <div>
            <label className="tv-label mb-1 block">Step Name</label>
            <input value={step.label} onChange={e => onUpdate({ ...step, label: e.target.value })} className={INPUT_CLS} />
          </div>
          <div>
            <label className="tv-label mb-1 block">Description</label>
            <textarea value={step.description} onChange={e => onUpdate({ ...step, description: e.target.value })} placeholder="Brief description\u2026" rows={2} className={TEXTAREA_CLS} />
          </div>
        </DrawerSection>

        {/* Wait-specific */}
        {step.type === "wait" && (
          <DrawerSection title="Wait Duration" icon={Timer} iconColor="text-tv-warning" open={openSections.wait} onToggle={() => toggleSection("wait")} badge={`${step.waitDays || 3} days`}>
            <div className="flex flex-wrap gap-2">
              {WAIT_PRESETS.map(d => (
                <button key={d} onClick={() => onUpdate({ ...step, waitDays: d })}
                  className={`px-4 py-2 rounded-full text-[14px] border transition-all ${(step.waitDays || 3) === d ? "bg-tv-brand-bg text-white border-tv-brand-bg" : "border-tv-border-light text-tv-text-secondary hover:border-tv-border-strong"}`} style={{ fontWeight: 500 }}>
                  {d} day{d !== 1 ? "s" : ""}
                </button>
              ))}
            </div>
            <div className="flex items-end gap-4">
              <div>
                <label className="tv-label mb-1 block">Custom (days)</label>
                <input type="number" min={1} max={365} value={step.waitDays || 3} onChange={e => onUpdate({ ...step, waitDays: Math.max(1, parseInt(e.target.value) || 1) })} className="w-24 border border-tv-border-light rounded-sm px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand" />
              </div>
              <div className="text-[11px] text-tv-text-decorative" style={{ fontWeight: 500 }}>or</div>
              <div>
                <label className="tv-label mb-1 block">Select a Date</label>
                <input type="date" value={step.waitUntilDate || ""} onChange={e => onUpdate({ ...step, waitUntilDate: e.target.value })}
                  className="border border-tv-border-light rounded-sm px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand" />
              </div>
            </div>
          </DrawerSection>
        )}

        {/* Condition-specific */}
        {step.type === "condition" && (
          <DrawerSection title="Condition" icon={GitBranch} open={openSections.condition} onToggle={() => toggleSection("condition")} badge={step.conditionField || undefined}>
            <div className="space-y-1.5">
              {CONDITION_OPTIONS.filter(opt => {
                if (!opt.channels) return true;
                const prevChannel = precedingStepType === "email" ? "email" : precedingStepType === "sms" ? "sms" : undefined;
                return !prevChannel || opt.channels.includes(prevChannel);
              }).map(opt => (
                <button key={opt.id} onClick={() => onUpdate({ ...step, conditionField: opt.label })}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-sm border transition-all text-[12px] ${step.conditionField === opt.label ? "border-tv-brand-bg bg-tv-brand-tint text-tv-brand" : "border-tv-border-light text-tv-text-secondary hover:border-tv-border-strong"}`}>
                  <div className="text-left">
                    <span className="block">{opt.label}</span>
                    <span className="text-[10px] opacity-70">{opt.desc}</span>
                  </div>
                  {step.conditionField === opt.label && <Check size={11} className="text-tv-brand shrink-0 ml-2" />}
                </button>
              ))}
            </div>
          </DrawerSection>
        )}

        {/* Video Request Configuration */}
        {step.type === "video-request" && (
          <>
            {/* Delivery Method */}
            <DrawerSection title="Delivery Method" icon={Send} iconColor="text-tv-info" open={openSections.vrDelivery ?? true} onToggle={() => toggleSection("vrDelivery")}
              badge={step.vrDeliveryType === "link" ? "Link" : step.vrDeliveryType === "sms" ? "SMS" : "Email"}>
              <div className="space-y-1.5">
                {([
                  { id: "email" as const, label: "Email", desc: "Send request via email", icon: Mail },
                  { id: "sms" as const,   label: "SMS",   desc: "Send via text message", icon: MessageSquare },
                  { id: "link" as const,  label: "Shareable Link", desc: "Share a link anywhere", icon: Link2 },
                ] as const).map(dt => (
                  <button key={dt.id} onClick={() => onUpdate({ ...step, vrDeliveryType: dt.id })}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-sm border text-left transition-all ${(step.vrDeliveryType || "email") === dt.id ? "border-tv-brand-bg bg-tv-brand-tint" : "border-tv-border-light hover:border-tv-border-strong"}`}>
                    <dt.icon size={13} className={(step.vrDeliveryType || "email") === dt.id ? "text-tv-brand" : "text-tv-text-secondary"} />
                    <div className="flex-1">
                      <p className={`text-[11px] ${(step.vrDeliveryType || "email") === dt.id ? "text-tv-brand" : "text-tv-text-primary"}`} style={{ fontWeight: 600 }}>{dt.label}</p>
                      <p className="text-[9px] text-tv-text-secondary">{dt.desc}</p>
                    </div>
                    {(step.vrDeliveryType || "email") === dt.id && <Check size={10} className="text-tv-brand" />}
                  </button>
                ))}
              </div>
              {(step.vrDeliveryType || "email") === "link" && (
                <div className="mt-2 p-2.5 bg-tv-info-bg border border-tv-info-border rounded-sm">
                  <label className="tv-label mb-1 block text-tv-info">Shareable URL</label>
                  <div className="flex items-center gap-1.5 bg-white rounded-sm px-2 py-1.5 border border-tv-border-light">
                    <Link2 size={11} className="text-tv-info shrink-0" />
                    <span className="text-[10px] font-mono text-tv-text-primary flex-1 truncate">{step.vrShareableUrl || "https://thankview.com/r/..."}</span>
                    <button onClick={() => show("Link copied!", "success")}
                      className="px-2 py-0.5 bg-tv-brand-bg text-white text-[9px] rounded-full hover:bg-tv-brand-hover transition-colors flex items-center gap-0.5 shrink-0" style={{ fontWeight: 600 }}>
                      <Copy size={8} />Copy
                    </button>
                  </div>
                </div>
              )}
            </DrawerSection>

            {/* Instructions */}
            <DrawerSection title="Recording Instructions" icon={FileText} open={openSections.vrInstructions ?? true} onToggle={() => toggleSection("vrInstructions")}>
              <div>
                <textarea value={step.vrInstructions || VR_DEFAULT_INSTRUCTIONS}
                  onChange={e => onUpdate({ ...step, vrInstructions: e.target.value })} rows={4}
                  className="w-full border border-tv-border-light rounded-sm px-3 py-2 text-[12px] outline-none resize-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand" />
                <button onClick={() => onUpdate({ ...step, vrInstructions: VR_DEFAULT_INSTRUCTIONS })}
                  className="mt-1 text-[9px] text-tv-info hover:underline">Reset to default</button>
              </div>

              {/* Instruction video attachment */}
              <div>
                {step.vrInstructionVideoId ? (
                  <>
                    <div className="flex items-center gap-2.5 p-2.5 bg-tv-surface rounded-sm border border-tv-border-light">
                      <div className={`w-[80px] h-[45px] rounded-sm bg-gradient-to-br ${step.vrInstructionVideoColor || "from-tv-info to-tv-info-hover"} flex items-center justify-center shrink-0`}>
                        <Play size={14} className="text-white ml-0.5" fill="white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-tv-text-primary truncate" style={{ fontWeight: 600 }}>{step.vrInstructionVideoTitle}</p>
                        <p className="text-[9px] text-tv-text-secondary">{step.vrInstructionVideoDuration}</p>
                      </div>
                      <button onClick={() => onUpdate({ ...step, vrInstructionVideoId: undefined, vrInstructionVideoTitle: undefined, vrInstructionVideoDuration: undefined, vrInstructionVideoColor: undefined })}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-tv-danger hover:bg-tv-danger-bg transition-colors shrink-0" title="Remove">
                        <X size={10} />
                      </button>
                    </div>
                    <p className="mt-1.5 text-[9px] text-tv-text-secondary">This video will be shown to recorders before they begin recording.</p>
                  </>
                ) : (
                  <button onClick={() => { setInstrVidSearch(""); setShowInstructionVideoPicker(true); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-sm text-[11px] text-white bg-tv-info hover:bg-tv-info-hover transition-colors"
                    style={{ fontWeight: 600 }}>
                    <Film size={12} />Attach Instruction Video
                  </button>
                )}
              </div>

              <div className="p-2.5 bg-tv-surface rounded-sm border border-tv-border-divider space-y-1">
                <div className="flex items-center gap-1 mb-1">
                  <Lightbulb size={10} className="text-tv-info" />
                  <span className="tv-label">Tips shown to recorders</span>
                </div>
                {VR_RECORDING_TIPS.map((tip, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <Check size={8} className="text-tv-success shrink-0" />
                    <span className="text-[10px] text-tv-text-secondary">{tip}</span>
                  </div>
                ))}
              </div>
            </DrawerSection>

            {/* Due Date & Reminders */}
            <DrawerSection title="Due Date & Reminders" icon={Calendar} iconColor="text-tv-warning" open={openSections.vrSchedule ?? true} onToggle={() => toggleSection("vrSchedule")}
              badge={step.vrDueDate || undefined}>
              <div>
                <label className="tv-label mb-1 block">Due Date</label>
                <input type="date" value={step.vrDueDate || ""} onChange={e => onUpdate({ ...step, vrDueDate: e.target.value })}
                  className="w-full border border-tv-border-light rounded-sm px-3 py-2 text-[12px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand" />
                <p className="text-[9px] text-tv-text-secondary mt-1">Recorders see this deadline on their landing page.</p>
              </div>
              <button onClick={() => onUpdate({ ...step, vrReminderEnabled: !(step.vrReminderEnabled ?? true) })}
                role="switch" aria-checked={step.vrReminderEnabled ?? true} aria-label="Automated reminders"
                className="w-full flex items-center justify-between p-2.5 bg-tv-surface rounded-sm border border-tv-border-light">
                <div>
                  <p className="text-[11px] text-tv-text-primary" style={{ fontWeight: 600 }}>Automated Reminders</p>
                  <p className="text-[9px] text-tv-text-secondary">Send before the due date</p>
                </div>
                <div className={`w-8 h-[18px] rounded-full relative shrink-0 transition-colors ${(step.vrReminderEnabled ?? true) ? "bg-tv-brand-bg" : "bg-tv-surface-active"}`}>
                  <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[2px] transition-all shadow-sm ${(step.vrReminderEnabled ?? true) ? "left-[15px]" : "left-[2px]"}`} />
                </div>
              </button>
              {(step.vrReminderEnabled ?? true) && (
                <div className="space-y-1.5">
                  <div className="flex flex-wrap gap-1.5">
                    {[14, 7, 5, 3, 2, 1].map(d => {
                      const days = step.vrReminderDays || [7, 3, 1];
                      const active = days.includes(d);
                      return (
                        <button key={d} onClick={() => onUpdate({ ...step, vrReminderDays: active ? days.filter(x => x !== d) : [...days, d].sort((a, b) => b - a) })}
                          className={`px-3.5 py-1.5 rounded-full text-[14px] border transition-all ${active ? "border-tv-brand-bg bg-tv-brand-tint text-tv-brand" : "border-tv-border-light text-tv-text-secondary hover:border-tv-border-strong"}`} style={{ fontWeight: 500 }}>
                          {d}d
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-tv-text-secondary">{(step.vrReminderDays || [7, 3, 1]).length} reminder{(step.vrReminderDays || [7, 3, 1]).length !== 1 ? "s" : ""} scheduled</p>
                </div>
              )}
            </DrawerSection>

            {/* Landing Page & Submissions */}
            <DrawerSection title="Landing Page & Submissions" icon={Globe} open={openSections.vrLanding ?? false} onToggle={() => toggleSection("vrLanding")}
              badge={step.vrSubmissionsEnabled !== false ? "Open" : "Closed"}>
              <div>
                <label className="tv-label mb-1 block">Branded Landing Page</label>
                <div className="space-y-1.5">
                  {[...globalLandingPages, ...LANDING_PAGES].map(p => (
                    <button key={p.id} onClick={() => onUpdate({ ...step, vrBrandedLandingPage: p.id })}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-sm border text-left transition-all ${(step.vrBrandedLandingPage || 1) === p.id ? "border-tv-brand-bg bg-tv-brand-tint" : "border-tv-border-light hover:border-tv-border-strong"}`}>
                      <div className="w-5 h-3.5 rounded-[2px] overflow-hidden shrink-0">
                        {p.image ? (
                          <img src={p.image} alt={p.name || "Landing page thumbnail"} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"
                            style={{ background: `linear-gradient(135deg, ${p.color}, ${p.accent})` }}><Camera size={5} className="text-white" /></div>
                        )}
                      </div>
                      <span className="text-[11px] text-tv-text-primary flex-1" style={{ fontWeight: 500 }}>{p.name}</span>
                      {(step.vrBrandedLandingPage || 1) === p.id && <Check size={10} className="text-tv-brand" />}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => onUpdate({ ...step, vrSubmissionsEnabled: !(step.vrSubmissionsEnabled ?? true) })}
                role="switch" aria-checked={step.vrSubmissionsEnabled ?? true} aria-label="Accept submissions"
                className="w-full flex items-center justify-between p-2.5 bg-white rounded-sm border border-tv-border-light">
                <div>
                  <p className="text-[11px] text-tv-text-primary" style={{ fontWeight: 600 }}>Accept Submissions</p>
                  <p className="text-[9px] text-tv-text-secondary">{(step.vrSubmissionsEnabled ?? true) ? "Submissions are open" : "Link is disabled"}</p>
                </div>
                <div className={`w-8 h-[18px] rounded-full relative shrink-0 transition-colors ${(step.vrSubmissionsEnabled ?? true) ? "bg-tv-brand-bg" : "bg-tv-surface-active"}`}>
                  <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[2px] transition-all shadow-sm ${(step.vrSubmissionsEnabled ?? true) ? "left-[15px]" : "left-[2px]"}`} />
                </div>
              </button>
              {/* Include Library Video toggle */}
              <button onClick={() => onUpdate({ ...step, vrIncludeLibraryVideo: !step.vrIncludeLibraryVideo })}
                role="switch" aria-checked={!!step.vrIncludeLibraryVideo} aria-label="Instruction video"
                className="w-full flex items-center justify-between p-2.5 bg-white rounded-sm border border-tv-border-light">
                <div>
                  <p className="text-[11px] text-tv-text-primary" style={{ fontWeight: 600 }}>Instruction Video</p>
                  <p className="text-[9px] text-tv-text-secondary">Attach a video from your library</p>
                </div>
                <div className={`w-8 h-[18px] rounded-full relative shrink-0 transition-colors ${step.vrIncludeLibraryVideo ? "bg-tv-brand-bg" : "bg-tv-surface-active"}`}>
                  <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[2px] transition-all shadow-sm ${step.vrIncludeLibraryVideo ? "left-[15px]" : "left-[2px]"}`} />
                </div>
              </button>
              {step.vrIncludeLibraryVideo && !step.vrLibraryVideoTitle && (
                <button onClick={() => setShowVideoPicker(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-sm border border-dashed border-tv-border-light hover:border-tv-brand-bg hover:bg-tv-brand-tint/30 transition-all text-left">
                  <Film size={12} className="text-tv-text-secondary" />
                  <span className="text-[11px] text-tv-text-secondary">Select from Library</span>
                </button>
              )}
              {step.vrIncludeLibraryVideo && step.vrLibraryVideoTitle && (
                <div className="flex items-center gap-2 p-2 bg-tv-brand-tint rounded-sm border border-tv-border-strong">
                  <Play size={9} className="text-tv-brand shrink-0" />
                  <span className="text-[11px] text-tv-text-primary flex-1 truncate" style={{ fontWeight: 500 }}>{step.vrLibraryVideoTitle}</span>
                  <button onClick={() => onUpdate({ ...step, vrLibraryVideoId: undefined, vrLibraryVideoTitle: undefined })}
                    aria-label="Remove library video" className="w-5 h-5 rounded-full bg-white border border-tv-border-light flex items-center justify-center text-tv-text-secondary hover:text-tv-danger shrink-0" title="Remove library video"><X size={8} /></button>
                </div>
              )}
              <div className="p-2 bg-tv-surface rounded-sm border border-tv-border-divider flex items-start gap-1.5">
                <Info size={10} className="text-tv-brand shrink-0 mt-0.5" />
                <p className="text-[9px] text-tv-text-secondary">Submitted videos appear on the Replies page and in the Requests folder.</p>
              </div>
            </DrawerSection>
          </>
        )}

        {/* Video Attachment (for email/sms) */}
        {isMessaging && (
          <DrawerSection title="Video" icon={Video} iconColor="text-tv-brand" open={openSections.video} onToggle={() => toggleSection("video")}
            badge={step.attachedVideo ? "\u2713 Attached" : "Optional"}>
            {step.attachedVideo ? (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 px-3 py-2.5 bg-tv-brand-tint border border-tv-border-strong rounded-md">
                  <div className={`w-11 h-7 rounded-sm bg-gradient-to-br ${step.attachedVideo.color} flex items-center justify-center shrink-0`}>
                    <Play size={10} className="text-white ml-0.5" fill="white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-tv-text-primary truncate" style={{ fontWeight: 600 }}>{step.attachedVideo.title}</p>
                    <p className="text-[9px] text-tv-text-secondary">{step.attachedVideo.duration}</p>
                  </div>
                  <TvTooltip label="Remove video"><button onClick={() => onUpdate({ ...step, attachedVideo: null })}
                    aria-label="Remove attached video" className="w-5 h-5 rounded-full bg-white border border-tv-border-light flex items-center justify-center text-tv-text-secondary hover:text-tv-danger shrink-0"><X size={9} /></button></TvTooltip>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => { setVideoCreateInitialTab("record"); setShowVideoCreate(true); }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-tv-border-light text-[10px] text-tv-text-secondary hover:border-tv-info hover:text-tv-info hover:bg-tv-info-bg transition-all" style={{ fontWeight: 500 }}>
                    <Camera size={10} />Re-record
                  </button>
                  <button onClick={() => { setVideoCreateInitialTab("upload"); setShowVideoCreate(true); }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-tv-border-light text-[10px] text-tv-text-secondary hover:border-tv-brand-bg hover:text-tv-brand hover:bg-tv-brand-tint transition-all" style={{ fontWeight: 500 }}>
                    <Upload size={10} />Upload different
                  </button>
                  <button onClick={() => setShowVideoPicker(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-tv-border-light text-[10px] text-tv-text-secondary hover:border-tv-brand-bg hover:text-tv-brand hover:bg-tv-brand-tint transition-all" style={{ fontWeight: 500 }}>
                    <Film size={10} />Swap from library
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <button onClick={() => { setVideoCreateInitialTab("record"); setShowVideoCreate(true); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md border border-tv-border-light hover:border-tv-info hover:bg-tv-info-bg transition-all text-left">
                  <div className="w-7 h-7 rounded-sm bg-tv-info-bg flex items-center justify-center shrink-0">
                    <Camera size={13} className="text-tv-info" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] text-tv-text-primary" style={{ fontWeight: 600 }}>Record</p>
                    <p className="text-[9px] text-tv-text-secondary">Use your camera to record a video</p>
                  </div>
                </button>
                <button onClick={() => { setVideoCreateInitialTab("upload"); setShowVideoCreate(true); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md border border-tv-border-light hover:border-tv-brand-bg hover:bg-tv-brand-tint transition-all text-left">
                  <div className="w-7 h-7 rounded-sm bg-tv-brand-tint flex items-center justify-center shrink-0">
                    <Upload size={13} className="text-tv-brand" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] text-tv-text-primary" style={{ fontWeight: 600 }}>Upload</p>
                    <p className="text-[9px] text-tv-text-secondary">Upload an MP4, MOV, or WebM file</p>
                  </div>
                </button>
                <button onClick={() => setShowVideoPicker(true)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md border border-tv-border-light hover:border-tv-brand-bg hover:bg-tv-brand-tint transition-all text-left">
                  <div className="w-7 h-7 rounded-sm bg-tv-surface flex items-center justify-center shrink-0">
                    <Film size={13} className="text-tv-text-secondary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] text-tv-text-primary" style={{ fontWeight: 600 }}>Select from Library</p>
                    <p className="text-[9px] text-tv-text-secondary">Choose an existing video</p>
                  </div>
                </button>
              </div>
            )}
            <p className="text-[9px] text-tv-text-secondary leading-relaxed">
              Adding a video is optional. You can send a text-only {isEmail ? "email" : "SMS"}.
            </p>
          </DrawerSection>
        )}

        {/* Email Content */}
        {isEmail && (
          <DrawerSection title="Email Content" icon={Mail} open={openSections.content} onToggle={() => toggleSection("content")}
            badge={step.subject ? "\u2713" : undefined}>
            {/* Template & Signature actions */}
            <EmailTemplateActions
              compact
              onApplyTemplate={(tpl) => {
                onUpdate({ ...step, subject: tpl.subject, body: tpl.body });
              }}
            />

            {/* Sender info */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="tv-label">Sender Name</label>
                  <CharCount current={(step.senderName || "").length} max={CHAR_LIMITS.senderName} />
                </div>
                <div className="relative">
                  <input value={step.senderName || ""} onChange={e => onUpdate({ ...step, senderName: e.target.value })} maxLength={CHAR_LIMITS.senderName} className="w-full border border-tv-border-light rounded-sm px-2.5 py-2 pr-8 text-[12px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand" />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2">
                    <SmsMergeMore onInsert={token => onUpdate({ ...step, senderName: (step.senderName || "") + token })} />
                  </div>
                </div>
              </div>
              <div>
                <label className="tv-label mb-1 block">Sender Email</label>
                <input value={step.senderEmail || ""} onChange={e => onUpdate({ ...step, senderEmail: e.target.value })} className="w-full border border-tv-border-light rounded-sm px-2.5 py-2 text-[12px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand" />
              </div>
              <div className="col-span-2">
                <label className="tv-label mb-1 block">Reply-To <span className="text-tv-text-decorative normal-case" style={{ fontWeight: 400 }}>(multiple allowed)</span></label>
                <div className="border border-tv-border-light rounded-sm px-2 py-1.5 flex flex-wrap gap-1 items-center min-h-[34px] focus-within:ring-2 focus-within:ring-tv-brand/40 focus-within:border-tv-brand">
                  {(step.replyToList || []).map((email, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-tv-brand-tint border border-tv-border rounded-full px-2 py-0.5 text-[10px] text-tv-brand">
                      {email}
                      <TvTooltip label="Remove email"><button onClick={() => onUpdate({ ...step, replyToList: (step.replyToList || []).filter((_, j) => j !== i) })} aria-label={`Remove ${email}`} className="hover:text-tv-danger"><X size={8} /></button></TvTooltip>
                    </span>
                  ))}
                  <input value={replyToInput} onChange={e => setReplyToInput(e.target.value)}
                    onKeyDown={e => {
                      if ((e.key === "Enter" || e.key === ",") && replyToInput.trim()) {
                        e.preventDefault();
                        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyToInput.trim())) {
                          onUpdate({ ...step, replyToList: [...(step.replyToList || []), replyToInput.trim()] });
                          setReplyToInput("");
                        }
                      }
                    }}
                    onBlur={() => { if (replyToInput.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyToInput.trim())) { onUpdate({ ...step, replyToList: [...(step.replyToList || []), replyToInput.trim()] }); setReplyToInput(""); } }}
                    placeholder={(step.replyToList || []).length === 0 ? "giving@hartwell.edu" : "Add another…"}
                    className="flex-1 min-w-[80px] text-[11px] outline-none focus:ring-1 focus:ring-tv-brand/40 bg-transparent" />
                </div>
              </div>
              <div>
                <label className="tv-label mb-1 block">Font</label>
                <select value={step.font || "Serif (Garamond)"} onChange={e => onUpdate({ ...step, font: e.target.value })} className={SELECT_CLS}>
                  <option>Serif (Garamond)</option><option>Sans-Serif (Inter)</option><option>Script (Playfair)</option>
                </select>
              </div>
            </div>

            {/* CC / BCC (collapsible) */}

            {/* Subject */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="tv-label">Subject Line</label>
                <CharCount current={(step.subject || "").length} max={CHAR_LIMITS.subject} />
              </div>
              <div className="flex items-center gap-1.5">
                <input value={step.subject || ""} onChange={e => onUpdate({ ...step, subject: e.target.value })}
                  maxLength={CHAR_LIMITS.subject}
                  placeholder="A personal message for you, {{first_name}}"
                  className="flex-1 border border-tv-border-light rounded-sm px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand" />
                {/* Emoji picker */}
                <div className="relative">
                  <button onClick={() => { setShowEmoji(!showEmoji); setShowMerge(false); }} className="p-2 border border-tv-border-light rounded-sm text-tv-text-secondary hover:text-tv-brand hover:border-tv-border-strong transition-colors" title="Insert emoji">
                    <Smile size={13} />
                  </button>
                  {showEmoji && (
                    <EmojiDropdown
                      onSelect={e => onUpdate({ ...step, subject: (step.subject || "") + e })}
                      onClose={() => setShowEmoji(false)}
                    />
                  )}
                </div>
                <div className="relative">
                  <button onClick={() => { setShowMerge(!showMerge); setShowEmoji(false); }} className="p-2 border border-tv-border-light rounded-sm text-tv-text-secondary hover:text-tv-brand hover:border-tv-border-strong transition-colors" title="Insert merge field">
                    <span className="font-mono text-[11px]">{"{}"}</span>
                  </button>
                  {showMerge && (
                    <MergeFieldDropdown
                      onSelect={f => onUpdate({ ...step, subject: (step.subject || "") + " " + f })}
                      onClose={() => setShowMerge(false)}
                    />
                  )}
                </div>
              </div>
            </div>
            <details className="group">
              <summary className="tv-label text-tv-brand cursor-pointer hover:underline list-none flex items-center gap-1">
                <ChevronRight size={10} className="transition-transform group-open:rotate-90" />CC / BCC <span className="text-tv-text-decorative normal-case" style={{ fontWeight: 400 }}>(optional)</span>
              </summary>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="tv-label mb-1 block">CC</label>
                  <input value={step.ccAddresses || ""} onChange={e => onUpdate({ ...step, ccAddresses: e.target.value })}
                    placeholder="cc@example.com"
                    className="w-full border border-tv-border-light rounded-sm px-2.5 py-2 text-[12px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand" />
                </div>
                <div>
                  <label className="tv-label mb-1 block">BCC</label>
                  <input value={step.bccAddresses || ""} onChange={e => onUpdate({ ...step, bccAddresses: e.target.value })}
                    placeholder="bcc@example.com"
                    className="w-full border border-tv-border-light rounded-sm px-2.5 py-2 text-[12px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand" />
                </div>
              </div>
              <p className="text-[9px] text-tv-text-decorative mt-1">Comma-separated. Applies per constituent on send.</p>
            </details>

            {/* Message body */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="tv-label">Message Body</label>
                <BodyHeaderCount length={htmlTextLength(step.body || "")} limit={CHAR_LIMITS.body} />
              </div>
              {(() => { const _ew = getEditorWarnCls(htmlTextLength(step.body || ""), CHAR_LIMITS.body); return (
              <RichTextEditor
                value={step.body || ""}
                onChange={html => onUpdate({ ...step, body: html })}
                placeholder="Dear {{first_name}}, I wanted to reach out personally…"
                compact
                wrapperClassName={_ew.wrapperCls}
                bodyClassName={_ew.bodyCls}
                bodyFontFamily={step.bodyFontFamily}
                bodyFontSize={step.bodyFontSize}
                bodyTextColor={step.bodyTextColor}
                bodyLineHeight={step.bodyLineHeight}
                onBodyFontFamilyChange={v => onUpdate({ ...step, bodyFontFamily: v })}
                onBodyFontSizeChange={v => onUpdate({ ...step, bodyFontSize: v })}
                onBodyTextColorChange={v => onUpdate({ ...step, bodyTextColor: v })}
                onBodyLineHeightChange={v => onUpdate({ ...step, bodyLineHeight: v })}
                onInsertSignature={(sigHtml) => onUpdate({ ...step, body: (step.body || "") + sigHtml })}
              />); })()}
              <EmailBodyCharCounter length={htmlTextLength(step.body || "")} />
            </div>

            {/* AI writer */}
            <div>
              <button onClick={() => setShowAi(!showAi)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[14px] border transition-all ${showAi ? "border-tv-brand-bg bg-tv-brand-tint text-tv-brand" : "border-tv-border-light text-tv-text-secondary hover:border-tv-border-strong hover:text-tv-brand"}`} style={{ fontWeight: 500 }}>
                <Sparkles size={13} />Write with AI
              </button>
              {showAi && (
                <AIWritingPopover
                  channel="email"
                  size="sm"
                  onInsertBelow={(text) => { onUpdate({ ...step, body: (step.body || "") + "\n\n" + text }); setShowAi(false); }}
                  onReplaceBody={(text) => { onUpdate({ ...step, body: text }); setShowAi(false); }}
                  onClose={() => setShowAi(false)}
                />
              )}
            </div>

            {/* Envelope design — grid picker */}
            <div>
              <label className="tv-label mb-1.5 block">Envelope Design</label>
              <div className="grid grid-cols-3 gap-2">
                {allEnvelopes.slice(0, 6).map(env => {
                  const active = (step.envelopeId || 1) === env.id;
                  const nColor = env.nameColor || (isDarkColor(env.color) ? "#ffffff" : "#1e293b");
                  return (
                    <button key={env.id} onClick={() => onUpdate({ ...step, envelopeId: env.id })}
                      className={`rounded-sm border-2 overflow-hidden transition-all text-left relative ${active ? "border-tv-brand-bg ring-1 ring-tv-brand-bg/50" : "border-tv-border-light hover:border-tv-border-strong"}`}>
                      <div className="aspect-[4/3] relative" style={{ backgroundColor: env.color }}>
                        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: PAPER_TEXTURE, backgroundSize: "200px 200px", mixBlendMode: "overlay" }} />
                        {(env as any).holidayType && (
                          <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            <HolidayGraphic type={(env as any).holidayType} size={36} color={(env as any).accent || env.color} />
                          </div>
                        )}
                        <div className="absolute top-[6%] right-[6%]">
                          <PerforatedStamp size={22} accentColor={(env as any).accent || env.color} />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center pt-1">
                          <span className="text-[7px] italic opacity-80" style={{ color: nColor, fontWeight: 500 }}>Constituent Name</span>
                        </div>
                        {active && (
                          <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-tv-brand-bg flex items-center justify-center shadow-sm">
                            <Check size={8} className="text-white" strokeWidth={3} />
                          </div>
                        )}
                        {(env as any).branded && (
                          <span className="absolute bottom-0.5 right-0.5 text-[6px] px-1 py-[1px] rounded-[3px] bg-white/90 text-tv-text-label shadow-sm" style={{ fontWeight: 600 }}>Branded</span>
                        )}
                      </div>
                      <div className={`px-1.5 py-1 text-center ${active ? "bg-tv-brand-tint" : "bg-white"}`}>
                        <p className={`text-[9px] truncate ${active ? "text-tv-brand" : "text-tv-text-primary"}`} style={{ fontWeight: active ? 600 : 500 }}>{env.name}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => setShowEnvelopeLibrary(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] text-tv-brand border border-tv-border rounded-full hover:bg-tv-brand-tint transition-colors" style={{ fontWeight: 500 }}>
                  <Search size={11} />Browse All
                </button>
                <button onClick={() => setShowEnvelopeBuilder(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] text-tv-brand border border-tv-border rounded-full hover:bg-tv-brand-tint transition-colors" style={{ fontWeight: 500 }}>
                  <Plus size={11} />Create New
                </button>
              </div>
            </div>

            {/* Thumbnail style — pick one of 3 */}
            <div>
              <label className="tv-label mb-1.5 block">Email Thumbnail</label>
              <p className="text-[11px] text-tv-text-secondary mb-2">Choose what constituents see in the email body.</p>
              <div className="space-y-1.5">
                {([
                  { key: "static" as const, icon: Eye, label: "Static Thumbnail", desc: "A still image from your video" },
                  { key: "animated" as const, icon: Film, label: "Animated Thumbnail", desc: "Eye-catching GIF that autoplays" },
                  { key: "envelope" as const, icon: Mail, label: "Envelope", desc: "Branded envelope with flip animation" },
                ]).map(opt => {
                  const active = (step.thumbnailType || "static") === opt.key;
                  const Icon = opt.icon;
                  return (
                    <button key={opt.key} onClick={() => onUpdate({ ...step, thumbnailType: opt.key })}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md border text-left transition-all ${
                        active
                          ? "border-tv-brand-bg bg-tv-brand-tint/30 shadow-sm"
                          : "border-tv-border-light hover:border-tv-brand-bg/40 hover:bg-tv-surface/60"
                      }`}>
                      <div className={`w-7 h-7 rounded-sm flex items-center justify-center shrink-0 transition-colors ${
                        active ? "bg-tv-brand-bg" : "bg-tv-surface"
                      }`}>
                        <Icon size={13} className={active ? "text-white" : "text-tv-text-secondary"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-[12px] block ${active ? "text-tv-brand" : "text-tv-text-primary"}`} style={{ fontWeight: 600 }}>{opt.label}</span>
                        <span className="text-[10px] text-tv-text-secondary">{opt.desc}</span>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        active ? "border-tv-brand-bg" : "border-tv-border-strong"
                      }`}>
                        {active && <div className="w-2 h-2 rounded-full bg-tv-brand-bg" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </DrawerSection>
        )}

        {/* SMS Content — aligned with Email Content section patterns */}
        {isSms && (
          <DrawerSection title="SMS Content" icon={MessageSquare} iconColor="text-tv-info" open={openSections.content} onToggle={() => toggleSection("content")}
            badge={step.smsBody ? "\u2713" : undefined}>

            {/* Sender info — matches email's 2-column grid pattern */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="tv-label">Sender Name</label>
                  <CharCount current={(step.senderName || "").length} max={CHAR_LIMITS.senderName} />
                </div>
                <div className="relative">
                  <input value={step.senderName || ""} onChange={e => onUpdate({ ...step, senderName: e.target.value })}
                    maxLength={CHAR_LIMITS.senderName}
                    placeholder="ThankView"
                    className="w-full border border-tv-border-light rounded-sm px-2.5 py-2 pr-8 text-[12px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand" />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2">
                    <SmsMergeMore onInsert={token => onUpdate({ ...step, senderName: (step.senderName || "") + token })} />
                  </div>
                </div>
              </div>
              <div>
                <label className="tv-label mb-1 block">Phone Number</label>
                <input value={step.smsPhoneNumber || ""} onChange={e => onUpdate({ ...step, smsPhoneNumber: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full border border-tv-border-light rounded-sm px-2.5 py-2 text-[12px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand" />
              </div>
            </div>
            <p className="text-[9px] text-tv-text-decorative -mt-1">The phone number constituents will see. Must be a verified number.</p>

            {/* Reply-To Phone */}
            <div>
              <label className="tv-label mb-1 block">Reply-To Phone Number</label>
              <input value={step.smsReplyToPhone || ""} onChange={e => onUpdate({ ...step, smsReplyToPhone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full border border-tv-border-light rounded-sm px-2.5 py-2 text-[12px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand" />
              <p className="text-[9px] text-tv-text-decorative mt-0.5">When constituents reply to your SMS, their reply will go to this number.</p>
            </div>

            {/* SMS Template loader */}
            <div className="flex items-center gap-2">
              <label className="tv-label shrink-0">Load Template</label>
              <select
                onChange={e => { if (e.target.value) onUpdate({ ...step, smsBody: e.target.value }); e.target.value = ""; }}
                className="flex-1 border border-tv-border-light rounded-sm px-2 py-1.5 text-[11px] text-tv-text-secondary outline-none focus:ring-2 focus:ring-tv-brand/40 bg-white"
                defaultValue="">
                <option value="" disabled>Select a template…</option>
                <option value="Hi {{first_name}}, thank you for your generous gift of {{gift_amount}}! Watch this personal video message from our team.">Thank You — Gift Acknowledgment</option>
                <option value="Hi {{first_name}}! We have a special video message just for you. Tap the link to watch!">General Outreach</option>
                <option value="{{first_name}}, as a member of the Class of {{class_year}}, you're invited to watch this message from your fellow alumni.">Alumni Engagement</option>
                <option value="Hi {{first_name}}, mark your calendar! Watch this video for event details and how to RSVP.">Event Invitation</option>
              </select>
            </div>

            {/* Message Body — matches email RichTextEditor container pattern */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="tv-label">Message Body</label>
                <BodyHeaderCount length={smsLen} limit={CHAR_LIMITS.sms} />
              </div>
              {(() => { const _sw = getEditorWarnCls(smsLen, CHAR_LIMITS.sms); return (<>
              <div className={`${RTE_WRAPPER_BASE_CLS} transition-colors ${_sw.wrapperCls || "border-tv-border-light"}`}>
                {/* Toolbar — merge fields + emoji/merge popover buttons */}
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-tv-surface border-b border-tv-border-light rounded-t-[9px]">
                  <span className="text-[10px] text-tv-text-secondary select-none shrink-0">Insert:</span>
                  <div className="flex items-center gap-1 flex-wrap flex-1 min-w-0">
                    {[...MERGE_FIELDS.slice(0, 3), "{{link}}"].map(f => (
                      <button key={f} onClick={() => onUpdate({ ...step, smsBody: (step.smsBody || "") + " " + f })}
                        className={MERGE_PILL_CLS}>{f}</button>
                    ))}
                    <SmsMergeMore onInsert={token => onUpdate({ ...step, smsBody: (step.smsBody || "") + " " + token })} />
                  </div>
                  {/* Emoji picker — same pattern as email subject */}
                  <div className="relative shrink-0">
                    <button onClick={() => { setShowEmoji(!showEmoji); setShowMerge(false); }}
                      className="p-1.5 border border-tv-border-light rounded-sm text-tv-text-secondary hover:text-tv-brand hover:border-tv-border-strong transition-colors" title="Insert emoji">
                      <Smile size={12} />
                    </button>
                    {showEmoji && (
                      <EmojiDropdown
                        onSelect={e => onUpdate({ ...step, smsBody: (step.smsBody || "") + e })}
                        onClose={() => setShowEmoji(false)}
                      />
                    )}
                  </div>
                  {/* Merge field popover — same pattern as email subject */}
                  <div className="relative shrink-0">
                    <button onClick={() => { setShowMerge(!showMerge); setShowEmoji(false); }}
                      className="p-1.5 border border-tv-border-light rounded-sm text-tv-text-secondary hover:text-tv-brand hover:border-tv-border-strong transition-colors" title="Insert merge field">
                      <span className="font-mono text-[10px]">{"{}"}</span>
                    </button>
                    {showMerge && (
                      <MergeFieldDropdown
                        onSelect={f => onUpdate({ ...step, smsBody: (step.smsBody || "") + " " + f })}
                        onClose={() => setShowMerge(false)}
                      />
                    )}
                  </div>
                </div>
                <textarea value={step.smsBody || ""} onChange={e => onUpdate({ ...step, smsBody: e.target.value })} rows={4}
                  placeholder="Hi {{first_name}}! I have a personal message for you\u2026"
                  className={`${RTE_BODY_CLS} transition-colors ${_sw.bodyCls}`} />
              </div>
              </>); })()}
              <SmsCharCounter length={smsLen} />
            </div>

            {/* SMS Options — collapsible, mirrors email's CC/BCC pattern */}
            <details className="group">
              <summary className="tv-label text-tv-brand cursor-pointer hover:underline list-none flex items-center gap-1">
                <ChevronRight size={10} className="transition-transform group-open:rotate-90" />SMS Options <span className="text-tv-text-decorative normal-case" style={{ fontWeight: 400 }}>(delivery settings)</span>
              </summary>
              <div className="space-y-2.5 mt-2">
                {/* Quiet hours toggle */}
                <button onClick={() => onUpdate({ ...step, smsQuietHours: !step.smsQuietHours })}
                  role="switch" aria-checked={!!step.smsQuietHours} aria-label="Quiet hours"
                  className="w-full flex items-center justify-between p-2.5 bg-white rounded-md border border-tv-border-light">
                  <div>
                    <p className="text-[11px] text-tv-text-primary" style={{ fontWeight: 600 }}>Quiet Hours</p>
                    <p className="text-[9px] text-tv-text-secondary">Don't send between 9 PM – 8 AM constituent local time</p>
                  </div>
                  <div className={`w-9 h-5 rounded-full relative shrink-0 transition-colors ${step.smsQuietHours ? "bg-tv-brand-bg" : "bg-tv-surface-active"}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${step.smsQuietHours ? "left-[17px]" : "left-0.5"}`} />
                  </div>
                </button>
                <p className="text-[9px] text-tv-text-decorative">Queued messages will be sent at 8 AM in the constituent's timezone.</p>
              </div>
            </details>

            {/* Text Message Auto-Responder */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="tv-label">Text Message Auto-Responder</label>
                <CharCount current={(step.smsAutoResponder || "").length} max={250} />
              </div>
              <textarea value={step.smsAutoResponder || ""} onChange={e => onUpdate({ ...step, smsAutoResponder: e.target.value.slice(0, 250) })}
                maxLength={250} rows={2}
                placeholder="Thank you for your response! We appreciate your support."
                className="w-full border border-tv-border-light rounded-sm px-2.5 py-2 text-[12px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand resize-none" />
              <p className="text-[9px] text-tv-text-decorative mt-0.5">Automatically sent when a constituent replies to this SMS. 250 character limit.</p>
            </div>

            {/* AI writer — identical pattern to email */}
            <div>
              <button onClick={() => setShowAi(!showAi)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[14px] border transition-all ${showAi ? "border-tv-brand-bg bg-tv-brand-tint text-tv-brand" : "border-tv-border-light text-tv-text-secondary hover:border-tv-border-strong hover:text-tv-brand"}`} style={{ fontWeight: 500 }}>
                <Sparkles size={13} />Write with AI
              </button>
              {showAi && (
                <AIWritingPopover
                  channel="sms"
                  size="sm"
                  onInsertBelow={(text) => { onUpdate({ ...step, smsBody: (step.smsBody || "") + " " + text }); setShowAi(false); }}
                  onReplaceBody={(text) => { onUpdate({ ...step, smsBody: text }); setShowAi(false); }}
                  onClose={() => setShowAi(false)}
                />
              )}
            </div>

            {/* SMS compliance — non-editable, legally required */}
            <div className="p-3 bg-tv-surface rounded-md border border-tv-border-light space-y-1.5">
              <p className="text-[11px] text-tv-text-primary" style={{ fontWeight: 600 }}>SMS Compliance (auto-appended)</p>
              <div className="p-2 bg-white rounded border border-tv-border-divider">
                <p className="text-[10px] text-tv-text-secondary italic">Click the link to watch the video from [ORG NAME]</p>
                <p className="text-[10px] text-tv-text-secondary italic mt-1">Reply STOP to unsubscribe. Msg & data rates may apply. Msg frequency varies.</p>
              </div>
              <p className="text-[9px] text-tv-text-decorative">This compliance text is automatically appended to every SMS and cannot be edited.</p>
            </div>
          </DrawerSection>
        )}

        {/* Landing Page (for email/sms) */}
        {isMessaging && (
          <DrawerSection title="Landing Page" icon={Globe} open={openSections.landing} onToggle={() => toggleSection("landing")}
            badge={step.landingPageEnabled ? "Enabled" : "Off"}>
            {/* Enable toggle */}
            <button onClick={() => onUpdate({ ...step, landingPageEnabled: !step.landingPageEnabled })}
              role="switch" aria-checked={!!step.landingPageEnabled} aria-label="Enable landing page"
              className="w-full flex items-center justify-between p-2.5 bg-white rounded-md border border-tv-border-light">
              <div>
                <p className="text-[11px] text-tv-text-primary" style={{ fontWeight: 600 }}>Enable Landing Page</p>
                <p className="text-[9px] text-tv-text-secondary flex items-center gap-1">Constituents see this after clicking through</p>
              </div>
              <div className={`w-9 h-5 rounded-full relative shrink-0 transition-colors ${step.landingPageEnabled ? "bg-tv-brand-bg" : "bg-tv-surface-active"}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${step.landingPageEnabled ? "left-[17px]" : "left-0.5"}`} />
              </div>
            </button>

            {step.landingPageEnabled && (
              <>
                {/* Page selector — grid picker */}
                <div>
                  <label className="tv-label mb-1.5 block">Landing Page</label>
                  <div className="grid grid-cols-3 gap-2">
                    {allLandingPages.slice(0, 6).map(p => {
                      const active = (step.landingPageId || 1) === p.id;
                      return (
                        <button key={p.id} onClick={() => onUpdate({ ...step, landingPageId: p.id })}
                          className={`rounded-sm border-2 overflow-hidden transition-all text-left relative group ${active ? "border-tv-brand-bg ring-1 ring-tv-brand-bg/50" : "border-tv-border-light hover:border-tv-border-strong"}`}>
                          <div className="aspect-[4/3] relative overflow-hidden"
                            style={{ background: `linear-gradient(135deg, ${p.color || "#7c45b0"}, ${p.accent || "#a78bfa"})` }}>
                            {p.image && <img src={p.image} alt={p.name || "Landing page option"} className="absolute inset-0 w-full h-full object-cover" />}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                            {active && (
                              <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-tv-brand-bg flex items-center justify-center shadow-sm">
                                <Check size={8} className="text-white" strokeWidth={3} />
                              </div>
                            )}
                          </div>
                          <div className={`px-1.5 py-1 text-center ${active ? "bg-tv-brand-tint" : "bg-white"}`}>
                            <p className={`text-[9px] truncate ${active ? "text-tv-brand" : "text-tv-text-primary"}`} style={{ fontWeight: active ? 600 : 500 }}>{p.name}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setShowLpLibrary(true)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] text-tv-brand border border-tv-border rounded-full hover:bg-tv-brand-tint transition-colors" style={{ fontWeight: 500 }}>
                      <Search size={11} />Browse All
                    </button>
                    <button onClick={() => setShowLpBuilder(true)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] text-tv-brand border border-tv-border rounded-full hover:bg-tv-brand-tint transition-colors" style={{ fontWeight: 500 }}>
                      <Plus size={11} />Create New
                    </button>
                  </div>
                </div>

                {/* CTA module */}
                <div>
                  <label className="tv-label mb-1 block">CTA Module</label>
                  <div className="flex gap-1.5">
                    {(["none", "cta", "pdf", "form"] as const).map(m => (
                      <button key={m} onClick={() => onUpdate({ ...step, lpModule: m })}
                        className={`flex-1 py-1.5 rounded-full border text-[10px] capitalize transition-all ${(step.lpModule || "cta") === m ? "border-tv-brand-bg bg-tv-brand-tint text-tv-brand" : "border-tv-border-light text-tv-text-secondary hover:border-tv-border-strong"}`} style={{ fontWeight: 500 }}>
                        {m === "cta" ? "CTA" : m === "pdf" ? "PDF" : m === "none" ? "None" : "Form"}
                      </button>
                    ))}
                  </div>
                </div>

                {(step.lpModule === "cta" || !step.lpModule) && (
                  <div className="space-y-3">
                    <CtaButtonControls
                      ctaText={step.ctaText || ""}
                      btnBg={step.btnBg || ""}
                      btnText={step.btnText || ""}
                      onCtaTextChange={v => onUpdate({ ...step, ctaText: v })}
                      onBtnBgChange={v => onUpdate({ ...step, btnBg: v })}
                      onBtnTextChange={v => onUpdate({ ...step, btnText: v })}
                    />
                    <div>
                      <label className="tv-label mb-1 block">Button URL</label>
                      <input value={step.ctaUrl || ""} onChange={e => onUpdate({ ...step, ctaUrl: e.target.value })} className="w-full border border-tv-border-light rounded-sm px-2.5 py-2 text-[12px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand" />
                    </div>
                  </div>
                )}

                {/* PDF attachment upload */}
                {step.lpModule === "pdf" && (
                  <div className="space-y-3">
                    <label className="tv-label mb-1 block">PDF Attachment</label>
                    {step.pdfFileName ? (
                      <div className="flex items-center gap-2.5 p-3 bg-tv-surface rounded-lg border border-tv-border-light">
                        <div className="w-8 h-8 bg-tv-danger-bg rounded-sm flex items-center justify-center shrink-0">
                          <FileText size={14} className="text-tv-danger" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] text-tv-text-primary truncate" style={{ fontWeight: 600 }}>{step.pdfFileName}</p>
                          <p className="text-[10px] text-tv-text-secondary">{step.pdfPages || 12} pages, {step.pdfSize || "2.4 MB"}</p>
                        </div>
                        <button onClick={() => onUpdate({ ...step, pdfFileName: undefined, pdfPages: undefined, pdfSize: undefined })}
                          className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-tv-danger-bg text-tv-text-secondary hover:text-tv-danger transition-colors">
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="w-full border-2 border-dashed border-tv-border-light rounded-lg p-5 flex flex-col items-center gap-2 hover:border-tv-brand-bg hover:bg-tv-brand-tint/30 transition-all cursor-pointer"
                        onClick={() => onUpdate({ ...step, pdfFileName: "Impact_Report_2025.pdf", pdfPages: 12, pdfSize: "2.4 MB", pdfAllowDownload: true, pdfShareWithConstituents: true })}
                      >
                        <div className="w-10 h-10 rounded-sm bg-tv-surface-active flex items-center justify-center">
                          <FileText size={18} className="text-tv-text-secondary" />
                        </div>
                        <p className="text-[12px] text-tv-text-primary" style={{ fontWeight: 600 }}>Upload PDF</p>
                        <p className="text-[10px] text-tv-text-secondary">Accepts .pdf</p>
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-tv-border-light bg-white text-[11px] text-tv-text-primary hover:border-tv-brand-bg hover:text-tv-brand transition-colors" style={{ fontWeight: 500 }}>
                          <Upload size={11} />Browse Files
                        </span>
                      </div>
                    )}

                    {/* Toggles */}
                    {step.pdfFileName && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Download size={12} className={(step.pdfAllowDownload ?? true) ? "text-tv-brand" : "text-tv-text-secondary"} />
                            <span className="text-[12px] text-tv-text-primary" style={{ fontWeight: 500 }}>Allow Download</span>
                          </div>
                          <button
                            role="switch"
                            aria-checked={step.pdfAllowDownload ?? true}
                            aria-label="Allow download"
                            onClick={() => onUpdate({ ...step, pdfAllowDownload: !(step.pdfAllowDownload ?? true) })}
                            className={`w-9 h-5 rounded-full relative shrink-0 transition-colors ${(step.pdfAllowDownload ?? true) ? "bg-tv-brand-bg" : "bg-tv-surface-active"}`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-[2px] shadow-sm transition-all ${(step.pdfAllowDownload ?? true) ? "left-[17px]" : "left-[2px]"}`} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users size={12} className={(step.pdfShareWithConstituents ?? true) ? "text-tv-brand" : "text-tv-text-secondary"} />
                            <span className="text-[12px] text-tv-text-primary" style={{ fontWeight: 500 }}>Share with Constituents</span>
                          </div>
                          <button
                            role="switch"
                            aria-checked={step.pdfShareWithConstituents ?? true}
                            aria-label="Share with constituents"
                            onClick={() => onUpdate({ ...step, pdfShareWithConstituents: !(step.pdfShareWithConstituents ?? true) })}
                            className={`w-9 h-5 rounded-full relative shrink-0 transition-colors ${(step.pdfShareWithConstituents ?? true) ? "bg-tv-brand-bg" : "bg-tv-surface-active"}`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-[2px] shadow-sm transition-all ${(step.pdfShareWithConstituents ?? true) ? "left-[17px]" : "left-[2px]"}`} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Form integration */}
                {step.lpModule === "form" && (() => {
                  const formUrl = step.formUrl || "";
                  const lower = formUrl.toLowerCase();
                  type DetectedPlat = { name: string; color: string; bg: string } | null;
                  let platform: DetectedPlat = null;
                  if (formUrl) {
                    if (lower.includes("givebutter.com")) platform = { name: "Givebutter", color: "#16a34a", bg: "#f0fdf4" };
                    else if (lower.includes("boostmyschool.com")) platform = { name: "BoostMySchool", color: "#2563eb", bg: "#eff6ff" };
                    else if (lower.includes("typeform.com")) platform = { name: "Typeform", color: "#8b5cf6", bg: "#f5f3ff" };
                    else if (lower.includes("jotform.com")) platform = { name: "Jotform", color: "#f97316", bg: "#fff7ed" };
                    else if (lower.includes("google.com/forms") || lower.includes("docs.google.com/forms")) platform = { name: "Google Forms", color: "#7c3aed", bg: "#faf5ff" };
                    else if (lower.includes("wufoo.com")) platform = { name: "Wufoo", color: "#dc2626", bg: "#fef2f2" };
                    else if (lower.startsWith("http://") || lower.startsWith("https://")) platform = { name: "__unknown__", color: "#dc2626", bg: "#fef2f2" };
                  }
                  return (
                    <div className="space-y-3">
                      {/* URL input */}
                      <div>
                        <label className="tv-label mb-1 block">Form Embed URL</label>
                        <div className="relative">
                          <ExternalLink size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tv-text-secondary" />
                          <input value={formUrl} onChange={e => onUpdate({ ...step, formUrl: e.target.value })}
                            placeholder="Paste your Givebutter, BoostMySchool, or Typeform URL"
                            className="w-full border border-tv-border-light rounded-sm pl-7 pr-2.5 py-2 text-[11px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand" />
                        </div>
                      </div>

                      {/* Auto-detection badge */}
                      {platform && (
                        platform.name === "__unknown__" ? (
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-tv-danger-bg border border-tv-danger-border w-fit">
                            <TriangleAlert size={11} className="text-tv-danger" />
                            <span className="text-[10px] text-tv-danger" style={{ fontWeight: 600 }}>Unknown platform</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full w-fit border"
                            style={{ backgroundColor: platform.bg, borderColor: `${platform.color}30` }}>
                            <Check size={11} style={{ color: platform.color }} />
                            <span className="text-[10px]" style={{ color: platform.color, fontWeight: 600 }}>
                              Detected: {platform.name}
                            </span>
                          </div>
                        )
                      )}

                      {/* Configuration row */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <label className="tv-label mb-1 block">Height (px)</label>
                          <input
                            type="number"
                            value={step.formHeight ?? 600}
                            onChange={e => {
                              const v = parseInt(e.target.value, 10);
                              if (!isNaN(v) && v > 0) onUpdate({ ...step, formHeight: v });
                            }}
                            min={200}
                            max={2000}
                            className="w-full border border-tv-border-light rounded-sm px-2.5 py-2 text-[12px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand"
                          />
                        </div>
                        <div className="pt-5">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={step.formFullWidth ?? false}
                              aria-label="Full width form"
                              onClick={() => onUpdate({ ...step, formFullWidth: !(step.formFullWidth ?? false) })}
                              className={`w-9 h-5 rounded-full relative shrink-0 transition-colors ${(step.formFullWidth ?? false) ? "bg-tv-brand-bg" : "bg-tv-surface-active"}`}
                            >
                              <div className={`w-4 h-4 bg-white rounded-full absolute top-[2px] shadow-sm transition-all ${(step.formFullWidth ?? false) ? "left-[17px]" : "left-[2px]"}`} />
                            </button>
                            <div className="flex items-center gap-1">
                              <Maximize2 size={11} className={(step.formFullWidth ?? false) ? "text-tv-brand" : "text-tv-text-secondary"} />
                              <span className="text-[12px] text-tv-text-primary whitespace-nowrap" style={{ fontWeight: 500 }}>Full Width</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Subscribe CTA toggle */}
                <button onClick={() => onUpdate({ ...step, subscribeCta: !step.subscribeCta })}
                  role="switch" aria-checked={!!step.subscribeCta} aria-label="Subscribe CTA"
                  className="w-full flex items-center justify-between px-2.5 py-2 bg-white rounded-sm border border-tv-border-light">
                  <div className="flex items-center gap-1.5">
                    <MailCheck size={11} className="text-tv-text-secondary" />
                    <div>
                      <p className="text-[11px] text-tv-text-primary text-left">Subscribe CTA</p>
                      <p className="text-[8px] text-tv-text-secondary text-left">Newsletter opt-in</p>
                    </div>
                  </div>
                  <div className={`w-8 h-[18px] rounded-full relative shrink-0 transition-colors ${step.subscribeCta ? "bg-tv-brand-bg" : "bg-tv-surface-active"}`}>
                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[2px] transition-all shadow-sm ${step.subscribeCta ? "left-[15px]" : "left-[2px]"}`} />
                  </div>
                </button>

                {/* Reply options */}
                <div className="space-y-2">
                  <label className="tv-label block">Landing Page Buttons</label>

                  {/* Live preview strip */}
                  <div className="p-2.5 bg-tv-surface rounded-sm border border-tv-border-divider">
                    <p className="tv-label mb-1.5" style={{ fontSize: 8 }}>Preview</p>
                    <div className="bg-white rounded-sm border border-tv-border-light px-2 py-1.5">
                      {(step.allowEmailReply || step.allowVideoReply || step.allowSaveButton || step.allowShareButton || step.allowDownloadVideo || step.closedCaptionsEnabled) ? (
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          {step.allowEmailReply && <span className="inline-flex items-center gap-0.5 px-1.5 py-1 rounded-full bg-tv-surface border border-tv-border-light text-[8px] text-tv-text-primary"><Reply size={8} className="text-tv-text-secondary" />Reply</span>}
                          {step.allowVideoReply && <span className="inline-flex items-center gap-0.5 px-1.5 py-1 rounded-full bg-tv-surface border border-tv-border-light text-[8px] text-tv-text-primary"><Video size={8} className="text-tv-text-secondary" />Video</span>}
                          {step.allowSaveButton && <span className="inline-flex items-center gap-0.5 px-1.5 py-1 rounded-full bg-tv-surface border border-tv-border-light text-[8px] text-tv-text-primary"><Bookmark size={8} className="text-tv-text-secondary" />Save</span>}
                          {step.allowShareButton && <span className="inline-flex items-center gap-0.5 px-1.5 py-1 rounded-full bg-tv-surface border border-tv-border-light text-[8px] text-tv-text-primary"><Share2 size={8} className="text-tv-text-secondary" />Share</span>}
                          {step.allowDownloadVideo && <span className="inline-flex items-center gap-0.5 px-1.5 py-1 rounded-full bg-tv-surface border border-tv-border-light text-[8px] text-tv-text-primary"><Download size={8} className="text-tv-text-secondary" />Download</span>}
                          {step.closedCaptionsEnabled && <span className="inline-flex items-center gap-0.5 px-1.5 py-1 rounded-full bg-tv-surface border border-tv-border-light text-[8px] text-tv-text-primary"><Captions size={8} className="text-tv-text-secondary" />CC</span>}
                        </div>
                      ) : (
                        <p className="text-[8px] text-tv-text-decorative text-center italic py-0.5">No buttons enabled</p>
                      )}
                    </div>
                  </div>

                  {/* Toggle rows with inline previews */}
                  {([
                    { key: "allowEmailReply" as const, label: "Reply button", chip: "Reply", icon: Reply },
                    { key: "allowVideoReply" as const, label: "Video reply", chip: "Video Reply", icon: Video },
                    { key: "allowSaveButton" as const, label: "Save button", chip: "Save", icon: Bookmark },
                    { key: "allowShareButton" as const, label: "Share button", chip: "Share", icon: Share2 },
                    { key: "allowDownloadVideo" as const, label: "Download video", chip: "Download", icon: Download },
                    { key: "closedCaptionsEnabled" as const, label: "Closed captions (CC)", chip: "CC", icon: Captions },
                  ] as const).map(opt => {
                    const enabled = !!step[opt.key];
                    return (
                      <button key={opt.key} onClick={() => onUpdate({ ...step, [opt.key]: !step[opt.key] })}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-sm border transition-all ${enabled ? "bg-white border-tv-brand-bg/40" : "bg-white border-tv-border-light"}`}>
                        <span className={`shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border text-[8px] transition-all ${
                          enabled ? "bg-tv-surface border-tv-border-light text-tv-text-primary" : "bg-tv-surface/50 border-dashed border-tv-border-light text-tv-text-decorative line-through"
                        }`}>
                          <opt.icon size={8} />{opt.chip}
                        </span>
                        <span className="flex-1 text-[11px] text-tv-text-primary text-left">{opt.label}</span>
                        <div className={`w-8 h-[18px] rounded-full relative shrink-0 transition-colors ${enabled ? "bg-tv-brand-bg" : "bg-tv-surface-active"}`}>
                          <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[2px] transition-all shadow-sm ${enabled ? "left-[15px]" : "left-[2px]"}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* White gradient overlay */}
                <button onClick={() => onUpdate({ ...step, lpWhiteGradient: !step.lpWhiteGradient })}
                  role="switch" aria-checked={!!step.lpWhiteGradient} aria-label="White gradient overlay"
                  className="w-full flex items-center justify-between px-2.5 py-2 bg-white rounded-sm border border-tv-border-light">
                  <div>
                    <p className="text-[11px] text-tv-text-primary text-left">White Gradient Overlay</p>
                    <p className="text-[9px] text-tv-text-secondary text-left">Fade background for readability</p>
                  </div>
                  <div className={`w-8 h-[18px] rounded-full relative shrink-0 transition-colors ${step.lpWhiteGradient ? "bg-tv-brand-bg" : "bg-tv-surface-active"}`}>
                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[2px] transition-all shadow-sm ${step.lpWhiteGradient ? "left-[15px]" : "left-[2px]"}`} />
                  </div>
                </button>

                {/* Language selector */}
                <div>
                  <label className="tv-label mb-1 block">Language</label>
                  <select value={step.language || "en"} onChange={e => onUpdate({ ...step, language: e.target.value })}
                    className={SELECT_CLS}>
                    {LANGUAGE_OPTIONS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                  </select>
                  <p className="text-[9px] text-tv-text-secondary mt-0.5">Applies to unsubscribe link and button text</p>
                </div>
              </>
            )}
          </DrawerSection>
        )}

        {/* Automation & Timing */}
        {step.type !== "wait" && step.type !== "condition" && (
          <DrawerSection title="Automation & Timing" icon={Clock} open={openSections.settings} onToggle={() => toggleSection("settings")}>
            {/* Automation toggle */}
            <button type="button"
              onClick={() => onUpdate({ ...step, automationEnabled: !step.automationEnabled })}
              className="w-full flex items-center gap-3 px-3 py-2.5 bg-tv-surface border border-tv-border-light rounded-md hover:bg-tv-surface-hover transition-colors cursor-pointer text-left">
              <Toggle enabled={step.automationEnabled} onToggle={() => {}} className="pointer-events-none" />
              <span className={`text-[12px] ${step.automationEnabled ? "text-tv-brand" : "text-tv-text-secondary"}`} style={{ fontWeight: 500 }}>
                Automation {step.automationEnabled ? "enabled" : "disabled"}
              </span>
            </button>

            {step.automationEnabled && (
              <>
                {/* Scheduling mode selector */}
                <div>
                  <label className="tv-label mb-1.5 block">Trigger Type</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => onUpdate({ ...step, contactDateFieldId: undefined })}
                      className={`px-2.5 py-2 rounded-sm border text-[11px] text-left transition-all ${
                        !step.contactDateFieldId
                          ? "border-tv-brand-bg bg-tv-brand-tint text-tv-brand"
                          : "border-tv-border-light bg-white text-tv-text-secondary hover:border-tv-border-strong"
                      }`}
                      style={{ fontWeight: !step.contactDateFieldId ? 600 : 400 }}
                    >
                      <Clock size={12} className="inline mr-1.5 -mt-px" />Time-based
                    </button>
                    <button
                      onClick={() => onUpdate({ ...step, contactDateFieldId: step.contactDateFieldId || "birthday" })}
                      className={`px-2.5 py-2 rounded-sm border text-[11px] text-left transition-all ${
                        step.contactDateFieldId
                          ? "border-tv-brand-bg bg-tv-brand-tint text-tv-brand"
                          : "border-tv-border-light bg-white text-tv-text-secondary hover:border-tv-border-strong"
                      }`}
                      style={{ fontWeight: step.contactDateFieldId ? 600 : 400 }}
                    >
                      <Cake size={12} className="inline mr-1.5 -mt-px" />Date field
                    </button>
                  </div>
                </div>

                {/* Time-based: simple send-time dropdown */}
                {!step.contactDateFieldId && (
                  <div>
                    <label className="tv-label mb-1 block">Send Time Preference</label>
                    <select value={step.sendTimePreference} onChange={e => onUpdate({ ...step, sendTimePreference: e.target.value })}
                      className={SELECT_CLS}>
                      <option value="none">No preference</option>
                      <option value="morning">Morning (8-11 AM)</option>
                      <option value="afternoon">Afternoon (12-4 PM)</option>
                      <option value="evening">Evening (5-8 PM)</option>
                    </select>
                  </div>
                )}

                {/* Date-field: full automation config panel */}
                {step.contactDateFieldId && (
                  <div className="space-y-2.5">
                    {/* Date field picker */}
                    <div>
                      <label className="tv-label mb-1.5 block">Constituent Date Field</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {CONSTITUENT_DATE_FIELDS.map(f => {
                          const CFIcon = ({ Cake, CalendarDays, GraduationCap, Briefcase } as Record<string, any>)[f.icon] || CalendarDays;
                          const sel = step.contactDateFieldId === f.id;
                          return (
                            <button key={f.id} onClick={() => onUpdate({ ...step, contactDateFieldId: f.id })}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border text-left transition-all ${
                                sel ? "border-tv-brand-bg bg-white text-tv-brand" : "border-tv-border-light bg-white hover:border-tv-border-strong text-tv-text-secondary"
                              }`}>
                              <CFIcon size={11} className={sel ? "text-tv-brand" : "text-tv-text-decorative"} />
                              <span className="text-[10px] truncate" style={{ fontWeight: sel ? 600 : 400 }}>{f.label}</span>
                              {sel && <Check size={9} className="text-tv-brand shrink-0 ml-auto" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {/* Inline AutomationConfigPanel */}
                    <AutomationConfigPanel
                      contactDateField={step.contactDateFieldId}
                      fieldLabel={CONSTITUENT_DATE_FIELDS.find(c => c.id === step.contactDateFieldId)?.label ?? "Date"}
                      fieldDesc={CONSTITUENT_DATE_FIELDS.find(c => c.id === step.contactDateFieldId)?.desc ?? ""}
                      daysBefore={step.contactFieldDaysBefore ?? 0}
                      setDaysBefore={v => onUpdate({ ...step, contactFieldDaysBefore: v })}
                      contactFieldSendTime={step.contactFieldSendTime ?? "09:00"}
                      setContactFieldSendTime={v => onUpdate({ ...step, contactFieldSendTime: v })}
                      recurAnnually={step.contactFieldRecurAnnually ?? true}
                      setRecurAnnually={v => onUpdate({ ...step, contactFieldRecurAnnually: v })}
                      leapYearHandling={step.contactFieldLeapYear ?? "feb28"}
                      setLeapYearHandling={v => onUpdate({ ...step, contactFieldLeapYear: v })}
                    />
                  </div>
                )}
              </>
            )}

            {/* Action Required notice */}
            {isMessaging && !step.automationEnabled && (
              <div className="p-2.5 bg-tv-warning-bg border border-tv-warning-border rounded-md">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-tv-warning-bg flex items-center justify-center shrink-0 mt-0.5">
                    <TriangleAlert size={9} className="text-tv-warning" />
                  </div>
                  <div>
                    <p className="text-[11px] text-tv-warning-hover" style={{ fontWeight: 600 }}>Action Required</p>
                    <p className="text-[10px] text-tv-warning mt-0.5 leading-relaxed">
                      Constituents will be paused at this step until a manual task is completed.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DrawerSection>
        )}

        {/* Social Sharing — email & sms steps only */}
        {isMessaging && (
          <DrawerSection title="Social Sharing" icon={Share2} iconColor="text-[#1877F2]" open={openSections.social} onToggle={() => toggleSection("social")}
            badge={step.socialSharingEnabled ? "Enabled" : "Off"}>
            {/* Social sharing toggle */}
            <button onClick={() => onUpdate({ ...step, socialSharingEnabled: !step.socialSharingEnabled })}
              role="switch" aria-checked={!!step.socialSharingEnabled} aria-label="Enable social sharing"
              className="w-full flex items-center justify-between p-2.5 bg-white rounded-md border border-tv-border-light mb-3">
              <div>
                <p className="text-[11px] text-tv-text-primary" style={{ fontWeight: 600 }}>Enable Social Sharing</p>
                <p className="text-[9px] text-tv-text-secondary">Allow recipients to share the video/landing page on social media</p>
              </div>
              <div className={`w-9 h-5 rounded-full relative shrink-0 transition-colors ${step.socialSharingEnabled ? "bg-tv-brand-bg" : "bg-tv-surface-active"}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${step.socialSharingEnabled ? "left-[17px]" : "left-0.5"}`} />
              </div>
            </button>
            {step.socialSharingEnabled && (
              <SocialSharingCard
                ogTitle={step.ogTitle ?? "Your ThankView from Hartwell University"}
                ogDescription={step.ogDescription ?? "Thanks to the generosity of alumni like you, we\u2019ve been able to fund 42 new scholarships this year. Your support truly makes a difference."}
                ogImage={step.ogImage ?? "https://images.unsplash.com/photo-1523050854058-8df90110c476?w=600&q=80"}
                onChange={(t, d, img) => onUpdate({ ...step, ogTitle: t, ogDescription: d, ogImage: img })}
              />
            )}
          </DrawerSection>
        )}
      </div>

      {/* Drawer footer — status only (close via header X, navigation via global bottom bar) */}
      <div className="px-4 py-2.5 border-t border-tv-border-divider bg-tv-surface-muted shrink-0">
        <div className="flex items-center gap-1.5">
          {unmetErrors.length > 0 ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-tv-danger" style={{ fontWeight: 500 }}>
              <CircleAlert size={10} />{unmetErrors.length} required field{unmetErrors.length !== 1 ? "s" : ""} missing
            </span>
          ) : unmetWarnings.length > 0 ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-tv-warning" style={{ fontWeight: 500 }}>
              <TriangleAlert size={10} />{unmetWarnings.length} recommended
            </span>
          ) : (requirements.length > 0 ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-tv-success" style={{ fontWeight: 500 }}>
              <Check size={10} />All changes saved
            </span>
          ) : null)}
        </div>
      </div>
      </>
      )}

      {/* Instruction video picker modal */}
      {showInstructionVideoPicker && (
        <FocusTrap active>
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-labelledby="instruction-video-title">
          <div className="bg-white rounded-xl border border-tv-border-light shadow-2xl w-full max-w-xl mx-4 overflow-hidden flex flex-col" style={{ maxHeight: "80vh" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-tv-border-divider shrink-0">
              <div>
                <h3 id="instruction-video-title" className="text-[14px] text-tv-text-primary" style={{ fontWeight: 700 }}>Select Instruction Video</h3>
                <p className="text-[11px] text-tv-text-secondary mt-0.5">Choose a video from your library</p>
              </div>
              <button onClick={() => setShowInstructionVideoPicker(false)}
                className="w-7 h-7 rounded-full bg-tv-surface flex items-center justify-center text-tv-text-secondary hover:bg-tv-surface-hover transition-colors">
                <X size={13} />
              </button>
            </div>
            {/* Search */}
            <div className="px-5 py-2.5 border-b border-tv-border-divider shrink-0">
              <div className="flex items-center gap-2 border border-tv-border-light rounded-sm px-3 py-2">
                <Search size={13} className="text-tv-text-secondary shrink-0" />
                <input value={instrVidSearch} onChange={e => setInstrVidSearch(e.target.value)}
                  placeholder="Search videos…"
                  className="flex-1 text-[12px] text-tv-text-primary placeholder:text-tv-text-decorative outline-none focus:ring-1 focus:ring-tv-brand/40 bg-transparent" />
              </div>
            </div>
            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {(() => {
                const filtered = PICKER_VIDEOS.filter(v => v.title.toLowerCase().includes(instrVidSearch.toLowerCase()));
                if (filtered.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                      <Video size={24} className="text-tv-text-decorative" />
                      <p className="text-[12px] text-tv-text-secondary">No videos found.</p>
                    </div>
                  );
                }
                return (
                  <div className="grid grid-cols-3 gap-3">
                    {filtered.map(v => (
                      <button key={v.id} onClick={() => {
                        onUpdate({
                          ...step,
                          vrInstructionVideoId: v.id,
                          vrInstructionVideoTitle: v.title,
                          vrInstructionVideoDuration: v.duration,
                          vrInstructionVideoColor: v.color,
                        });
                        setShowInstructionVideoPicker(false);
                        show(`"${v.title}" attached as instruction video`, "success");
                      }}
                        className="rounded-md overflow-hidden border border-tv-border-light hover:border-tv-brand-bg hover:shadow-md transition-all group text-left">
                        <div className={`aspect-[16/9] bg-gradient-to-br ${v.color} flex items-center justify-center relative`}>
                          <div className="w-8 h-8 rounded-full bg-white/20 border border-white/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Play size={12} className="text-white ml-0.5" fill="white" />
                          </div>
                          <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-[4px] font-mono">{v.duration}</span>
                        </div>
                        <div className="px-2.5 py-2">
                          <p className="text-[11px] text-tv-text-primary truncate" style={{ fontWeight: 500 }}>{v.title}</p>
                          <p className="text-[9px] text-tv-text-secondary mt-0.5">{v.date}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
        </FocusTrap>
      )}
    </motion.div>

    {/* ── Envelope Library Modal ───────────────────────────────────────── */}
    {showEnvelopeLibrary && (
      <FocusTrap active>
      <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Envelope library"
        onClick={(e: React.MouseEvent) => { if (e.target === e.currentTarget) setShowEnvelopeLibrary(false); }}
        onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Escape") setShowEnvelopeLibrary(false); }}>
        <div className="w-full max-w-[680px] bg-white rounded-xl border border-tv-border-light shadow-2xl flex flex-col" style={{ maxHeight: "85vh" }}>
          <div className="px-5 py-4 border-b border-tv-border-divider shrink-0 flex items-center justify-between">
            <div>
              <h2 className="text-[17px] text-tv-text-primary" style={{ fontWeight: 900 }}>Envelope Library</h2>
              <p className="text-[11px] text-tv-text-secondary mt-0.5">Choose an envelope design for this step</p>
            </div>
            <button onClick={() => setShowEnvelopeLibrary(false)} className="w-8 h-8 rounded-full bg-tv-surface flex items-center justify-center text-tv-text-secondary hover:bg-tv-surface-hover transition-colors" aria-label="Close">
              <X size={14} />
            </button>
          </div>
          <div className="px-5 py-3 border-b border-tv-border-divider shrink-0">
            <div className="flex items-center gap-2 border border-tv-border-light rounded-sm px-3 py-2">
              <Search size={13} className="text-tv-text-secondary shrink-0" />
              <input value={envLibSearch} onChange={e => setEnvLibSearch(e.target.value)} placeholder="Search envelopes…" aria-label="Search envelopes"
                className="flex-1 text-[12px] text-tv-text-primary placeholder:text-tv-text-decorative outline-none bg-transparent" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {(["standard", "holiday", "legacy"] as const).map(cat => {
              const envs = allEnvelopes.filter((e: any) => (e.category || "standard") === cat && (!envLibSearch || e.name.toLowerCase().includes(envLibSearch.toLowerCase())));
              if (envs.length === 0) return null;
              return (
                <div key={cat}>
                  <p className="text-[10px] font-semibold text-tv-text-label uppercase tracking-wider mb-2">{cat === "standard" ? "Standard" : cat === "holiday" ? "Holiday" : "Legacy"}</p>
                  <div className="grid grid-cols-4 gap-2.5">
                    {envs.map((env: any) => {
                      const active = (step.envelopeId || 1) === env.id;
                      const nColor = env.nameColor || (isDarkColor(env.color) ? "#ffffff" : "#1e293b");
                      return (
                        <button key={env.id} onClick={() => { onUpdate({ ...step, envelopeId: env.id }); setShowEnvelopeLibrary(false); show(`"${env.name}" selected`, "success"); }}
                          className={`rounded-md border-2 overflow-hidden transition-all text-left relative ${active ? "border-tv-brand-bg ring-1 ring-tv-brand-bg/50" : "border-tv-border-light hover:border-tv-border-strong"}`}>
                          <div className="aspect-[4/3] relative" style={{ backgroundColor: env.color }}>
                            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: PAPER_TEXTURE, backgroundSize: "200px 200px", mixBlendMode: "overlay" }} />
                            {env.holidayType && (
                              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                <HolidayGraphic type={env.holidayType} size={42} color={env.accent || env.color} />
                              </div>
                            )}
                            <div className="absolute top-[6%] right-[6%]">
                              <PerforatedStamp size={26} accentColor={env.accent || env.color} />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center pt-1">
                              <span className="text-[8px] italic opacity-80" style={{ color: nColor, fontWeight: 500 }}>Constituent Name</span>
                            </div>
                            {active && (
                              <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-tv-brand-bg flex items-center justify-center shadow-sm">
                                <Check size={9} className="text-white" strokeWidth={3} />
                              </div>
                            )}
                            {env.branded && (
                              <span className="absolute bottom-1 right-1 text-[7px] px-1 py-[2px] rounded-[4px] bg-white/90 text-tv-text-label shadow-sm" style={{ fontWeight: 600 }}>Branded</span>
                            )}
                          </div>
                          <div className={`px-2 py-1.5 text-center ${active ? "bg-tv-brand-tint" : "bg-white"}`}>
                            <p className={`text-[10px] truncate ${active ? "text-tv-brand" : "text-tv-text-primary"}`} style={{ fontWeight: active ? 600 : 500 }}>{env.name}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-5 py-3 border-t border-tv-border-divider shrink-0 flex justify-end">
            <button onClick={() => { setShowEnvelopeLibrary(false); setShowEnvelopeBuilder(true); }}
              className="flex items-center gap-1.5 px-4 py-2 text-[12px] text-white rounded-full bg-tv-brand-bg hover:bg-tv-brand-hover transition-colors" style={{ fontWeight: 600 }}>
              <Plus size={13} />Create New Envelope
            </button>
          </div>
        </div>
      </div>
      </FocusTrap>
    )}

    {/* ── Envelope Builder Modal ───────────────────────────────────────── */}
    {showEnvelopeBuilder && (
      <EnvelopeBuilderModal
        onSave={(env) => { onUpdate({ ...step, envelopeId: env.id }); setShowEnvelopeBuilder(false); show(`"${env.name}" created and selected`, "success"); }}
        onClose={() => setShowEnvelopeBuilder(false)}
      />
    )}

    {/* ── Landing Page Library Modal ──────────────────────────────────── */}
    {showLpLibrary && (
      <FocusTrap active>
      <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Landing page library"
        onClick={(e: React.MouseEvent) => { if (e.target === e.currentTarget) setShowLpLibrary(false); }}
        onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Escape") setShowLpLibrary(false); }}>
        <div className="w-full max-w-[680px] bg-white rounded-xl border border-tv-border-light shadow-2xl flex flex-col" style={{ maxHeight: "85vh" }}>
          <div className="px-5 py-4 border-b border-tv-border-divider shrink-0 flex items-center justify-between">
            <div>
              <h2 className="text-[17px] text-tv-text-primary" style={{ fontWeight: 900 }}>Landing Page Library</h2>
              <p className="text-[11px] text-tv-text-secondary mt-0.5">Choose a landing page for this step</p>
            </div>
            <button onClick={() => setShowLpLibrary(false)} className="w-8 h-8 rounded-full bg-tv-surface flex items-center justify-center text-tv-text-secondary hover:bg-tv-surface-hover transition-colors" aria-label="Close">
              <X size={14} />
            </button>
          </div>
          <div className="px-5 py-3 border-b border-tv-border-divider shrink-0">
            <div className="flex items-center gap-2 border border-tv-border-light rounded-sm px-3 py-2">
              <Search size={13} className="text-tv-text-secondary shrink-0" />
              <input value={lpLibSearch} onChange={e => setLpLibSearch(e.target.value)} placeholder="Search landing pages…" aria-label="Search landing pages"
                className="flex-1 text-[12px] text-tv-text-primary placeholder:text-tv-text-decorative outline-none bg-transparent" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="grid grid-cols-3 gap-2.5">
              {allLandingPages.filter((p: any) => !lpLibSearch || p.name.toLowerCase().includes(lpLibSearch.toLowerCase())).map((p: any) => {
                const active = (step.landingPageId || 1) === p.id;
                return (
                  <button key={p.id} onClick={() => { onUpdate({ ...step, landingPageId: p.id }); setShowLpLibrary(false); show(`"${p.name}" selected`, "success"); }}
                    className={`rounded-md border-2 overflow-hidden transition-all text-left relative group ${active ? "border-tv-brand-bg ring-1 ring-tv-brand-bg/50" : "border-tv-border-light hover:border-tv-border-strong"}`}>
                    <div className="aspect-[4/3] relative overflow-hidden"
                      style={{ background: `linear-gradient(135deg, ${p.color || "#7c45b0"}, ${p.accent || "#a78bfa"})` }}>
                      {p.image && <img src={p.image} alt={p.name || "Landing page option"} className="absolute inset-0 w-full h-full object-cover" />}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      {active && (
                        <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-tv-brand-bg flex items-center justify-center shadow-sm">
                          <Check size={9} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <div className={`px-2 py-1.5 text-center ${active ? "bg-tv-brand-tint" : "bg-white"}`}>
                      <p className={`text-[10px] truncate ${active ? "text-tv-brand" : "text-tv-text-primary"}`} style={{ fontWeight: active ? 600 : 500 }}>{p.name}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="px-5 py-3 border-t border-tv-border-divider shrink-0 flex justify-end">
            <button onClick={() => { setShowLpLibrary(false); setShowLpBuilder(true); }}
              className="flex items-center gap-1.5 px-4 py-2 text-[12px] text-white rounded-full bg-tv-brand-bg hover:bg-tv-brand-hover transition-colors" style={{ fontWeight: 600 }}>
              <Plus size={13} />Create New Landing Page
            </button>
          </div>
        </div>
      </div>
      </FocusTrap>
    )}

    {/* ── Landing Page Builder Modal ─────────────────────────────────── */}
    {showLpBuilder && (
      <LandingPageBuilderModal
        onSave={(lp) => { onUpdate({ ...step, landingPageId: lp.id, landingPageColor: lp.color, landingPageAccent: lp.accent, landingPageImage: lp.image }); setShowLpBuilder(false); show(`"${lp.name}" created and selected`, "success"); }}
        onClose={() => setShowLpBuilder(false)}
      />
    )}
    </>
  );
}

// ── Step Creation Modal removed — all step types now use the unified StepDrawer ──
// (Only ConditionCreationModal remains for condition-type steps)
type CreationTab = "design" | "content" | "video" | "settings" | "vr-setup" | "vr-recorders" | "vr-schedule" | "vr-landing";

// StepCreationModal — superseded by the unified expandable StepDrawer.
// Retained as dead code; no longer called from the builder.
function StepCreationModal({
  step: initialStep,
  onSave,
  onCancel,
}: {
  step: FlowStep;
  onSave: (step: FlowStep) => void;
  onCancel: () => void;
}) {
  const { show } = useToast();
  const { customEnvelopes: globalEnvelopes, customLandingPages: globalLandingPages } = useDesignLibrary();
  const [step, setStep] = useState<FlowStep>(initialStep);
  const isEmail = step.type === "email";
  const isSms = step.type === "sms";
  const isVR = step.type === "video-request";
  const [activeTab, setActiveTab] = useState<CreationTab>(isVR ? "vr-setup" : isEmail ? "design" : "content");

  // Design step state (consolidated Appearance + Landing Page)
  const [lpSearch, setLpSearch] = useState("");
  const [envelopeSearch, setEnvelopeSearch] = useState("");
  const [lpSectionOpen, setLpSectionOpen] = useState(true);
  const [envSectionOpen, setEnvSectionOpen] = useState<Record<string, boolean>>({ branded: true, holiday: false, legacy: false });
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [envTextBefore, setEnvTextBefore] = useState("");
  const [envTextAfter, setEnvTextAfter] = useState("");
  const [envNameFormat, setEnvNameFormat] = useState("[Title] [First Name] [Last Name]");
  const [envLineBreakBefore, setEnvLineBreakBefore] = useState(false);
  const [envLineBreakAfter, setEnvLineBreakAfter] = useState(false);
  const [attachmentType, setAttachmentType] = useState<"button" | "pdf" | "form">("button");
  const [trackingPixel, setTrackingPixel] = useState("");

  const [showMerge, setShowMerge] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyToInput, setReplyToInput] = useState("");

  // AI state
  const [showAi, setShowAi] = useState(false);

  // Video modals
  const [showVideoPicker, setShowVideoPicker] = useState(false);
  const [showVideoCreate, setShowVideoCreate] = useState(false);
  const [videoCreateInitialTab, setVideoCreateInitialTab] = useState<"record" | "upload" | "library">("record");

  // SMS helpers
  const smsLen = (step.smsBody || "").length;

  const TABS: { id: CreationTab; label: string; icon: any }[] = isVR ? [
    { id: "vr-setup",      label: "Instructions",  icon: FileText },
    { id: "vr-recorders",  label: "Recorders",     icon: Users },
    { id: "vr-schedule",   label: "Due Date",      icon: Calendar },
    { id: "vr-landing",    label: "Landing & Link", icon: Globe },
    { id: "settings",      label: "Settings",      icon: Clock },
  ] : isEmail ? [
    { id: "design" as CreationTab, label: "Design", icon: Palette },
    { id: "content",  label: "Email Content", icon: Mail },
    { id: "video",    label: "Video",         icon: Video },
    { id: "settings", label: "Settings",      icon: Clock },
  ] : [
    { id: "content",  label: "SMS Content",   icon: MessageSquare },
    { id: "settings", label: "Settings",      icon: Clock },
  ];

  // Derived envelope lists (includes global custom designs)
  const allEnvelopeDesigns = [...globalEnvelopes, ...ENVELOPE_DESIGNS];
  const brandedEnvelopes = allEnvelopeDesigns.filter(e => e.category === "standard");
  const holidayEnvelopes = allEnvelopeDesigns.filter(e => e.category === "holiday");
  const legacyEnvelopes = allEnvelopeDesigns.filter(e => e.category === "legacy");
  const filteredEnvelopes = (cat: string) => {
    const src = cat === "branded" ? brandedEnvelopes : cat === "holiday" ? holidayEnvelopes : legacyEnvelopes;
    return src.filter(e => !envelopeSearch || e.name.toLowerCase().includes(envelopeSearch.toLowerCase()));
  };
  const allLandingPageDesigns = [...globalLandingPages, ...LANDING_PAGES];
  const filteredLandingPages = allLandingPageDesigns.filter(p => !lpSearch || p.name.toLowerCase().includes(lpSearch.toLowerCase()));

  const typeDef = FLOW_STEP_TYPES.find(t => t.id === step.type);

  // Full-screen video picker / creator overlays
  if (showVideoPicker) {
    return (
      <div className="fixed inset-0 z-[80] bg-white flex flex-col [&>*]:flex-1">
        <VideoPickerView
          onBack={() => setShowVideoPicker(false)}
          onSelect={(v) => {
            if (isVR) {
              setStep(s => ({ ...s, vrLibraryVideoId: v.id, vrLibraryVideoTitle: v.title }));
            } else {
              setStep(s => ({ ...s, attachedVideo: { id: v.id, title: v.title, duration: v.duration, color: v.color } }));
            }
            setShowVideoPicker(false);
            show(`"${v.title}" ${isVR ? "selected as instruction video" : "attached"}`, "success");
          }}
        />
      </div>
    );
  }

  if (showVideoCreate) {
    return (
      <div className="fixed inset-0 z-[80] bg-white flex flex-col [&>*]:flex-1">
        <VideoCreateView
          onBack={() => setShowVideoCreate(false)}
          onSave={(v) => {
            if (isVR) {
              setStep(s => ({ ...s, vrLibraryVideoId: v.id, vrLibraryVideoTitle: v.title }));
            } else {
              setStep(s => ({ ...s, attachedVideo: { id: v.id, title: v.title, duration: v.duration, color: v.color } }));
            }
            setShowVideoCreate(false);
            show(`"${v.title}" ${isVR ? "selected as instruction video" : "recorded & attached"}`, "success");
          }}
        />
      </div>
    );
  }

  return (
    <FocusTrap active>
    <div className="fixed inset-0 z-[70] flex items-center justify-center" role="dialog" aria-modal="true" aria-label={isVR ? "Video Request step setup" : isEmail ? "Email step setup" : "SMS step setup"}>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={`relative w-[95vw] ${activeTab === "design" ? "max-w-[1060px] 2xl:max-w-[1320px]" : "max-w-[900px] xl:max-w-[1020px] 2xl:max-w-[1200px]"} max-h-[90vh] bg-white rounded-xl border border-tv-border-light shadow-2xl flex flex-col overflow-hidden transition-[max-width] duration-300`}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-tv-border-divider shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-md ${typeDef?.bg || "bg-tv-brand-tint"} flex items-center justify-center shrink-0`}>
              {typeDef?.icon && <typeDef.icon size={17} className={typeDef?.color || "text-tv-brand"} />}
            </div>
            <div>
              <h2 className="text-tv-text-primary" style={{ fontSize: "18px", fontWeight: 800 }}>
                Create {isVR ? "Video Request" : isEmail ? "Email" : "SMS"} Step
              </h2>
              <p className="text-[12px] text-tv-text-secondary">{isVR ? "Configure the recording request, then save to add it to your campaign flow." : "Fill out the details for this step, then save to add it to your campaign flow."}</p>
            </div>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-full bg-tv-surface flex items-center justify-center text-tv-text-secondary hover:bg-tv-surface-hover transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* ── Step name ── */}
        <div className="px-6 pt-4 shrink-0">
          <label className="tv-label mb-1 block">Step Name</label>
          <input
            value={step.label}
            onChange={e => setStep(s => ({ ...s, label: e.target.value }))}
            className={`${INPUT_CLS_LG} text-[14px]`}
          />
        </div>

        {/* ── Tab bar ── */}
        <div className="px-6 pt-4 shrink-0">
          <div className="flex gap-1 bg-tv-surface rounded-md p-1">
            {TABS.map(tab => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-sm text-[12px] transition-all ${
                    active
                      ? "bg-white text-tv-brand shadow-sm"
                      : "text-tv-text-secondary hover:text-tv-text-primary"
                  }`} style={{ fontWeight: 600 }}
                >
                  <tab.icon size={13} />
                  {tab.label}
                  {tab.id === "video" && step.attachedVideo && (
                    <span className="w-1.5 h-1.5 rounded-full bg-tv-brand" />
                  )}
                  {tab.id === "design" && (step.envelopeId || step.landingPageEnabled) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-tv-brand" />
                  )}
                  {tab.id === "settings" && step.automationEnabled && (
                    <span className="w-1.5 h-1.5 rounded-full bg-tv-brand" />
                  )}
                  {tab.id === "vr-setup" && step.vrInstructions && (
                    <span className="w-1.5 h-1.5 rounded-full bg-tv-brand" />
                  )}
                  {tab.id === "vr-schedule" && step.vrDueDate && (
                    <span className="w-1.5 h-1.5 rounded-full bg-tv-warning" />
                  )}
                  {tab.id === "vr-landing" && (step.vrSubmissionsEnabled ?? true) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-tv-success" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tab content ── */}
        <div className={`flex-1 ${activeTab === "design" ? "overflow-y-auto" : "overflow-y-auto"} ${activeTab === "design" ? "" : "px-6 py-5"}`}>
          {/* ═════ DESIGN TAB (consolidated Appearance + Landing Page) ═════ */}
          {activeTab === "design" && isEmail && (
            <DesignStepPanel
              inline
              lpSearch={lpSearch}
              onLpSearchChange={setLpSearch}
              lpSectionOpen={lpSectionOpen}
              onLpSectionToggle={() => setLpSectionOpen(o => !o)}
              filteredLandingPages={filteredLandingPages}
              selectedLandingPageId={step.landingPageId}
              onSelectLandingPage={id => setStep(s => ({ ...s, landingPageId: id, landingPageEnabled: true }))}
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
              selectedEnvelopeData={allEnvelopeDesigns.find(e => e.id === (step.envelopeId || 1))}
              selectedLandingPageData={allLandingPageDesigns.find(p => p.id === (step.landingPageId || 1))}
            />
          )}

          {/* ═════ CONTENT TAB ═════ */}
          {activeTab === "content" && isEmail && (
            <div className="flex gap-6 items-start">
            {/* Left: form controls */}
            <div className="flex-1 min-w-0 space-y-5">
              {/* Template & Signature actions */}
              <EmailTemplateActions
                onApplyTemplate={(tpl) => {
                  setStep(s => ({ ...s, subject: tpl.subject, body: tpl.body }));
                }}
              />

              {/* Sender info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="tv-label">Sender Name</label>
                    <CharCount current={(step.senderName || "").length} max={CHAR_LIMITS.senderName} />
                  </div>
                  <div className="relative">
                    <input value={step.senderName || ""} onChange={e => setStep(s => ({ ...s, senderName: e.target.value }))} maxLength={CHAR_LIMITS.senderName} className={`${INPUT_CLS} pr-8`} />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2">
                      <SmsMergeMore onInsert={token => setStep(s => ({ ...s, senderName: (s.senderName || "") + token }))} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="tv-label mb-1 block">Sender Email</label>
                  <input value={step.senderEmail || ""} onChange={e => setStep(s => ({ ...s, senderEmail: e.target.value }))} className={INPUT_CLS} />
                </div>
                <div className="col-span-2">
                  <label className="tv-label mb-1 block">Reply-To <span className="text-tv-text-decorative normal-case" style={{ fontWeight: 400 }}>(multiple allowed)</span></label>
                  <div className={TAG_INPUT_WRAPPER_CLS}>
                    {(step.replyToList || []).map((email, i) => (
                      <span key={i} className="inline-flex items-center gap-1 bg-tv-brand-tint border border-tv-border rounded-full px-2.5 py-0.5 text-[11px] text-tv-brand">
                        {email}
                        <TvTooltip label="Remove email"><button onClick={() => setStep(s => ({ ...s, replyToList: (s.replyToList || []).filter((_, j) => j !== i) }))} aria-label={`Remove ${email}`} className="hover:text-tv-danger"><X size={9} /></button></TvTooltip>
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
                      className="flex-1 min-w-[100px] text-[12px] outline-none focus:ring-1 focus:ring-tv-brand/40 bg-transparent" />
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="tv-label">Subject Line</label>
                  <CharCount current={(step.subject || "").length} max={CHAR_LIMITS.subject} />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={step.subject || ""}
                    onChange={e => setStep(s => ({ ...s, subject: e.target.value }))}
                    maxLength={CHAR_LIMITS.subject}
                    placeholder="A personal message for you, {{first_name}}"
                    className={INPUT_CLS_LG_FLEX}
                  />
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
                  <div className="relative">
                    <button onClick={() => { setShowMerge(!showMerge); setShowEmoji(false); }} className={ICON_BTN_CLS} title="Insert merge field">
                      <span className="font-mono text-[12px]">{"{}"}</span>
                    </button>
                    {showMerge && (
                      <MergeFieldDropdown
                        onSelect={f => { setStep(s => ({ ...s, subject: (s.subject || "") + " " + f })); setShowMerge(false); }}
                        onClose={() => setShowMerge(false)}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Message body */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="tv-label">Message Body</label>
                  <BodyHeaderCount length={htmlTextLength(step.body || "")} limit={CHAR_LIMITS.body} />
                </div>
                {(() => { const _ew = getEditorWarnCls(htmlTextLength(step.body || ""), CHAR_LIMITS.body); return (
                <RichTextEditor
                  value={step.body || ""}
                  onChange={html => setStep(s => ({ ...s, body: html }))}
                  placeholder="Dear {{first_name}}, I wanted to reach out personally…"
                  extraMergeFields={isVR ? [{ token: "{{recorder_name}}", label: "Recorder Name", example: "John Smith" }] : undefined}
                  wrapperClassName={_ew.wrapperCls}
                  bodyClassName={_ew.bodyCls}
                  bodyFontFamily={step.bodyFontFamily}
                  bodyFontSize={step.bodyFontSize}
                  bodyTextColor={step.bodyTextColor}
                  bodyLineHeight={step.bodyLineHeight}
                  onBodyFontFamilyChange={v => setStep(s => ({ ...s, bodyFontFamily: v }))}
                  onBodyFontSizeChange={v => setStep(s => ({ ...s, bodyFontSize: v }))}
                  onBodyTextColorChange={v => setStep(s => ({ ...s, bodyTextColor: v }))}
                  onBodyLineHeightChange={v => setStep(s => ({ ...s, bodyLineHeight: v }))}
                  onInsertSignature={(sigHtml) => setStep(s => ({ ...s, body: (s.body || "") + sigHtml }))}
                />); })()}
                <EmailBodyCharCounter length={htmlTextLength(step.body || "")} />
              </div>

              {/* AI writer */}
              <div>
                <button onClick={() => setShowAi(!showAi)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[14px] border transition-all ${showAi ? "border-tv-brand-bg bg-tv-brand-tint text-tv-brand" : "border-tv-border-light text-tv-text-secondary hover:border-tv-border-strong hover:text-tv-brand"}`} style={{ fontWeight: 500 }}>
                  <Sparkles size={13} />Write with AI
                </button>
                {showAi && (
                  <AIWritingPopover
                    channel="email"
                    size="lg"
                    onInsertBelow={(text) => { setStep(s => ({ ...s, body: (s.body || "") + "\n\n" + text })); setShowAi(false); }}
                    onReplaceBody={(text) => { setStep(s => ({ ...s, body: text })); setShowAi(false); }}
                    onClose={() => setShowAi(false)}
                  />
                )}
              </div>

              {/* Skip to design shortcut */}
              <button onClick={() => setActiveTab("design")}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-md border border-dashed border-tv-border-light text-tv-text-secondary hover:border-tv-brand hover:text-tv-brand transition-colors">
                <Palette size={12} />
                <span className="text-[12px]">Skip to Design &amp; Landing Page</span>
              </button>
            </div>{/* end left column */}

            {/* Right: Live Preview */}
            <div className="w-[380px] lg:w-[42%] xl:w-[44%] 2xl:w-[46%] max-w-[560px] shrink-0 sticky top-0">
              <LivePreviewPanel
                subject={step.subject}
                body={step.body}
                senderName={step.senderName}
                senderEmail={step.senderEmail}
                font={step.font}
                thumbnailType={step.thumbnailType}
                includeVideoThumbnail={step.includeVideoThumbnail}
                envelopeId={step.envelopeId}
                btnBg={step.btnBg}
                btnText={step.btnText}
                ctaText={step.ctaText}
                ctaUrl={step.ctaUrl}
                attachedVideo={step.attachedVideo}
                isVideoRequest={isVR}
                language={step.language}
                allowEmailReply={step.allowEmailReply}
                allowVideoReply={step.allowVideoReply}
                allowSaveButton={step.allowSaveButton}
                allowShareButton={step.allowShareButton}
                allowDownloadVideo={step.allowDownloadVideo}
                closedCaptionsEnabled={step.closedCaptionsEnabled}
                pdfFileName={step.lpModule === "pdf" ? step.pdfFileName : undefined}
                pdfPages={step.pdfPages}
                pdfSize={step.pdfSize}
                formUrl={step.lpModule === "form" ? step.formUrl : undefined}
                formHeight={step.formHeight}
                formFullWidth={step.formFullWidth}
                smsMode={step.type === "sms"}
                smsBody={step.smsBody}
                smsPhoneNumber={step.smsPhoneNumber}
                fieldsWithMissingData={["gift_amount", "fund_name", "campaign_name"]}
                bodyFontFamily={step.bodyFontFamily}
                bodyFontSize={step.bodyFontSize}
                bodyTextColor={step.bodyTextColor}
                bodyLineHeight={step.bodyLineHeight}
                landingPageColor={allLandingPageDesigns.find(p => p.id === (step.landingPageId || 1))?.color}
                landingPageAccent={allLandingPageDesigns.find(p => p.id === (step.landingPageId || 1))?.accent}
                landingPageImage={allLandingPageDesigns.find(p => p.id === (step.landingPageId || 1))?.image}
                envTextBefore={envTextBefore}
                envNameFormat={envNameFormat}
                envTextAfter={envTextAfter}
                selectedSignature={null}
              />
            </div>
            </div>
          )}

          {activeTab === "content" && isSms && (
            <div className="space-y-5 max-w-[620px] xl:max-w-[720px] 2xl:max-w-[840px]">
              {/* SMS Registration Gate — shown when org hasn't registered for SMS */}
              {/* In production, this would check a real registration status flag */}
              {false /* smsNotRegistered */ && (
                <div className="flex items-start gap-3 p-4 bg-tv-warning-bg border border-tv-warning-border rounded-lg">
                  <CircleAlert size={16} className="text-tv-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] text-tv-warning-hover" style={{ fontWeight: 700 }}>SMS Not Registered</p>
                    <p className="text-[12px] text-tv-warning mt-1">Your organization has not registered for text messaging. You must complete SMS registration before creating SMS campaigns.</p>
                    <button className="mt-2 px-4 py-1.5 text-[12px] text-white bg-tv-warning rounded-full hover:bg-tv-warning-hover transition-colors" style={{ fontWeight: 600 }}>
                      Register for SMS
                    </button>
                  </div>
                </div>
              )}

              {/* Phone mockup preview */}
              <div className="flex justify-center mb-2">
                <div className="w-[280px] rounded-[28px] border-[3px] border-tv-text-primary/20 bg-white p-3 shadow-lg">
                  {/* Phone notch */}
                  <div className="w-20 h-1.5 bg-tv-text-primary/10 rounded-full mx-auto mb-3" />
                  {/* Message preview */}
                  <div className="bg-tv-surface rounded-xl p-3 min-h-[120px] space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-tv-brand-tint flex items-center justify-center">
                        <MessageSquare size={10} className="text-tv-brand" />
                      </div>
                      <span className="text-[10px] text-tv-text-primary" style={{ fontWeight: 600 }}>{step.senderName || "ThankView"}</span>
                    </div>
                    <div className="bg-tv-brand-tint rounded-lg rounded-tl-none px-3 py-2">
                      <p className="text-[10px] text-tv-text-primary leading-relaxed">
                        {step.smsBody || "Your SMS message preview will appear here…"}
                      </p>
                    </div>
                    <p className="text-[8px] text-tv-text-decorative text-center">SMS Preview</p>
                  </div>
                </div>
              </div>

              {/* SMS Template loader */}
              <div className="flex items-center gap-2">
                <label className="tv-label shrink-0">Load Template</label>
                <select
                  onChange={e => { if (e.target.value) setStep(s => ({ ...s, smsBody: e.target.value })); e.target.value = ""; }}
                  className="flex-1 border border-tv-border-light rounded-lg px-3 py-2 text-[12px] text-tv-text-secondary outline-none focus:ring-2 focus:ring-tv-brand/40 bg-white"
                  defaultValue="">
                  <option value="" disabled>Select a template…</option>
                  <option value="Hi {{first_name}}, thank you for your generous gift of {{gift_amount}}! Watch this personal video message from our team.">Thank You — Gift Acknowledgment</option>
                  <option value="Hi {{first_name}}! We have a special video message just for you. Tap the link to watch!">General Outreach</option>
                  <option value="{{first_name}}, as a member of the Class of {{class_year}}, you're invited to watch this message from your fellow alumni.">Alumni Engagement</option>
                  <option value="Hi {{first_name}}, mark your calendar! Watch this video for event details and how to RSVP.">Event Invitation</option>
                </select>
              </div>

              {/* SMS Body — aligned with email content tab patterns */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="tv-label">Message Body</label>
                  <BodyHeaderCount length={smsLen} limit={CHAR_LIMITS.sms} />
                </div>
                {(() => { const _sw2 = getEditorWarnCls(smsLen, CHAR_LIMITS.sms); return (<>
                <div className={`${RTE_WRAPPER_BASE_CLS} transition-colors ${_sw2.wrapperCls || "border-tv-border-light"}`}>
                  {/* Toolbar — merge quick-insert + emoji/merge popover buttons */}
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-tv-surface border-b border-tv-border-light rounded-t-[9px]">
                    <span className="text-[10px] text-tv-text-secondary select-none shrink-0">Insert:</span>
                    <div className="flex items-center gap-1 flex-wrap flex-1 min-w-0">
                      {[...MERGE_FIELDS.slice(0, 3), "{{link}}"].map(f => (
                        <button key={f} onClick={() => setStep(s => ({ ...s, smsBody: (s.smsBody || "") + " " + f }))}
                          className={MERGE_PILL_CLS}>{f}</button>
                      ))}
                      <SmsMergeMore onInsert={token => setStep(s => ({ ...s, smsBody: (s.smsBody || "") + " " + token }))} />
                    </div>
                    {/* Emoji picker — same pattern as email subject */}
                    <div className="relative shrink-0">
                      <button onClick={() => { setShowEmoji(!showEmoji); setShowMerge(false); }}
                        className="p-2 border border-tv-border-light rounded-sm text-tv-text-secondary hover:text-tv-brand hover:border-tv-border-strong transition-colors" title="Insert emoji">
                        <Smile size={13} />
                      </button>
                      {showEmoji && (
                        <EmojiDropdown
                          onSelect={e => setStep(s => ({ ...s, smsBody: (s.smsBody || "") + e }))}
                          onClose={() => setShowEmoji(false)}
                        />
                      )}
                    </div>
                  </div>
                  <textarea
                    value={step.smsBody || ""}
                    onChange={e => setStep(s => ({ ...s, smsBody: e.target.value }))}
                    rows={5}
                    placeholder="Hi {{first_name}}! I have a personal message for you\u2026"
                    className={`w-full px-3.5 py-3 text-[13px] text-tv-text-primary outline-none focus:ring-2 focus:ring-tv-brand/30 resize-none transition-colors ${_sw2.bodyCls}`}
                  />
                </div>
                </>); })()}
                <SmsCharCounter length={smsLen} />
              </div>

              {/* Sender info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="tv-label">Sender Name</label>
                    <CharCount current={(step.senderName || "").length} max={CHAR_LIMITS.senderName} />
                  </div>
                  <div className="relative">
                    <input value={step.senderName || ""} onChange={e => setStep(s => ({ ...s, senderName: e.target.value }))}
                      maxLength={CHAR_LIMITS.senderName}
                      placeholder="ThankView"
                      className={`${INPUT_CLS} pr-8`} />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2">
                      <SmsMergeMore onInsert={token => setStep(s => ({ ...s, senderName: (s.senderName || "") + token }))} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="tv-label mb-1 block">Phone Number</label>
                  <input value={step.smsPhoneNumber || ""} onChange={e => setStep(s => ({ ...s, smsPhoneNumber: e.target.value }))}
                    placeholder="+1 (555) 000-0000"
                    className={INPUT_CLS} />
                </div>
              </div>
              <p className="text-[10px] text-tv-text-decorative -mt-3">The phone number constituents will see. Must be a verified number.</p>

              {/* Reply-To Phone */}
              <div>
                <label className="tv-label mb-1 block">Reply-To Phone Number</label>
                <input value={step.smsReplyToPhone || ""} onChange={e => setStep(s => ({ ...s, smsReplyToPhone: e.target.value }))}
                  placeholder="+1 (555) 000-0000"
                  className={INPUT_CLS} />
                <p className="text-[10px] text-tv-text-decorative mt-1">When constituents reply, their reply goes to this number.</p>
              </div>

              {/* SMS Options — delivery settings */}
              <div className="space-y-3">
                {/* Quiet hours */}
                <button onClick={() => setStep(s => ({ ...s, smsQuietHours: !s.smsQuietHours }))}
                  role="switch" aria-checked={!!step.smsQuietHours} aria-label="Quiet hours"
                  className="w-full flex items-center justify-between p-3.5 bg-white rounded-lg border border-tv-border-light">
                  <div>
                    <p className="text-[12px] text-tv-text-primary" style={{ fontWeight: 600 }}>Quiet Hours</p>
                    <p className="text-[10px] text-tv-text-secondary">Don't send between 9 PM – 8 AM constituent local time</p>
                  </div>
                  <div className={`w-9 h-5 rounded-full relative shrink-0 transition-colors ${step.smsQuietHours ? "bg-tv-brand-bg" : "bg-tv-surface-active"}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${step.smsQuietHours ? "left-[17px]" : "left-0.5"}`} />
                  </div>
                </button>
                <p className="text-[10px] text-tv-text-decorative -mt-1">Queued messages will be sent at 8 AM in the constituent's timezone.</p>
              </div>

              {/* Text Message Auto-Responder */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="tv-label">Text Message Auto-Responder</label>
                  <CharCount current={(step.smsAutoResponder || "").length} max={250} />
                </div>
                <textarea value={step.smsAutoResponder || ""} onChange={e => setStep(s => ({ ...s, smsAutoResponder: e.target.value.slice(0, 250) }))}
                  maxLength={250} rows={2}
                  placeholder="Thank you for your response! We appreciate your support."
                  className="w-full border border-tv-border-light rounded-lg px-3.5 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand resize-none" />
                <p className="text-[10px] text-tv-text-decorative mt-1">Automatically sent when a constituent replies to this SMS. 250 character limit.</p>
              </div>

              {/* AI writer — identical pattern to email */}
              <div>
                <button onClick={() => setShowAi(!showAi)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[14px] border transition-all ${showAi ? "border-tv-brand-bg bg-tv-brand-tint text-tv-brand" : "border-tv-border-light text-tv-text-secondary hover:border-tv-border-strong hover:text-tv-brand"}`} style={{ fontWeight: 500 }}>
                  <Sparkles size={13} />Write with AI
                </button>
                {showAi && (
                  <AIWritingPopover
                    channel="sms"
                    size="lg"
                    onInsertBelow={(text) => { setStep(s => ({ ...s, smsBody: (s.smsBody || "") + " " + text })); setShowAi(false); }}
                    onReplaceBody={(text) => { setStep(s => ({ ...s, smsBody: text })); setShowAi(false); }}
                    onClose={() => setShowAi(false)}
                  />
                )}
              </div>

              {/* SMS compliance — non-editable, legally required */}
              <div className="p-3.5 bg-tv-surface rounded-lg border border-tv-border-light space-y-2">
                <p className="text-[12px] text-tv-text-primary" style={{ fontWeight: 600 }}>SMS Compliance (auto-appended)</p>
                <div className="p-2.5 bg-white rounded-md border border-tv-border-divider">
                  <p className="text-[11px] text-tv-text-secondary italic">Click the link to watch the video from [ORG NAME]</p>
                  <p className="text-[11px] text-tv-text-secondary italic mt-1">Reply STOP to unsubscribe. Msg & data rates may apply. Msg frequency varies.</p>
                </div>
                <p className="text-[10px] text-tv-text-decorative">This compliance text is automatically appended to every SMS and cannot be edited.</p>
              </div>
            </div>
          )}

          {/* ═════ VIDEO TAB (replaced — see TV Video Builder prototype) ═════ */}
          {activeTab === "video" && (
            <div className="max-w-[620px] xl:max-w-[720px] 2xl:max-w-[840px] flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 rounded-lg bg-tv-surface-muted border border-tv-border-light flex items-center justify-center mb-5">
                <Video size={28} className="text-tv-text-decorative" />
              </div>
              <p className="text-[36px] text-tv-text-decorative mb-1.5" style={{ fontWeight: 900 }}>404</p>
              <p className="text-[14px] text-tv-text-primary mb-1.5" style={{ fontWeight: 700 }}>See TV Video Builder for this content</p>
              <p className="text-[12px] text-tv-text-secondary max-w-[320px]">
                Video building has moved to a dedicated prototype. You can skip this tab and continue configuring your step.
              </p>
            </div>
          )}

          {/* ═════ VR SETUP TAB ═════ */}
          {activeTab === "vr-setup" && (
            <div className="max-w-[620px] xl:max-w-[720px] 2xl:max-w-[840px] space-y-5">
              {/* Delivery method */}
              <div>
                <label className="tv-label mb-2 block">Delivery Method</label>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { id: "email" as const, label: "Email", desc: "Send request via email", icon: Mail },
                    { id: "sms" as const,   label: "SMS",   desc: "Send via text message", icon: MessageSquare },
                    { id: "link" as const,  label: "Shareable Link", desc: "Share a link anywhere", icon: Link2 },
                  ] as const).map(dt => (
                    <button key={dt.id} onClick={() => setStep(s => ({ ...s, vrDeliveryType: dt.id }))}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${(step.vrDeliveryType || "email") === dt.id ? "border-tv-brand-bg bg-tv-brand-tint shadow-md" : "border-tv-border-light hover:border-tv-border-strong"}`}>
                      <dt.icon size={16} className={(step.vrDeliveryType || "email") === dt.id ? "text-tv-brand" : "text-tv-text-secondary"} />
                      <p className={`text-[12px] mt-2 ${(step.vrDeliveryType || "email") === dt.id ? "text-tv-brand" : "text-tv-text-primary"}`} style={{ fontWeight: 600 }}>{dt.label}</p>
                      <p className="text-[10px] text-tv-text-secondary mt-0.5">{dt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recording instructions */}
              <div>
                <label className="tv-label mb-1.5 block">Recording Instructions</label>
                <p className="text-[10px] text-tv-text-secondary mb-2">These instructions will be shown to recorders on the landing page.</p>
                <SimpleRTE
                  value={step.vrInstructions || VR_DEFAULT_INSTRUCTIONS}
                  onChange={v => setStep(s => ({ ...s, vrInstructions: v }))}
                  rows={5}
                  ariaLabel="Recording instructions"
                />
                <button onClick={() => setStep(s => ({ ...s, vrInstructions: VR_DEFAULT_INSTRUCTIONS }))}
                  className="mt-1.5 text-[10px] text-tv-info hover:underline">Reset to default</button>
              </div>

              {/* Recording tips */}
              <div className="p-3.5 bg-tv-surface rounded-lg border border-tv-border-divider">
                <div className="flex items-center gap-1.5 mb-2">
                  <Lightbulb size={12} className="text-tv-info" />
                  <span className="tv-label">Recording Tips (shown to recorders)</span>
                </div>
                <div className="space-y-1.5">
                  {VR_RECORDING_TIPS.map((tip, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check size={9} className="text-tv-success shrink-0" />
                      <span className="text-[11px] text-tv-text-secondary">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Include instruction video */}
              <div className="bg-white rounded-lg border border-tv-border-light p-4 space-y-3">
                <button onClick={() => setStep(s => ({ ...s, vrIncludeLibraryVideo: !s.vrIncludeLibraryVideo }))}
                  role="switch" aria-checked={!!step.vrIncludeLibraryVideo} aria-label="Include instruction video"
                  className="w-full flex items-center justify-between">
                  <div>
                    <p className="text-[12px] text-tv-text-primary" style={{ fontWeight: 600 }}>Include Instruction Video</p>
                    <p className="text-[10px] text-tv-text-secondary">Attach a video from your library</p>
                  </div>
                  <div className={`w-9 h-5 rounded-full relative shrink-0 transition-colors ${step.vrIncludeLibraryVideo ? "bg-tv-brand-bg" : "bg-tv-surface-active"}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${step.vrIncludeLibraryVideo ? "left-[17px]" : "left-0.5"}`} />
                  </div>
                </button>
                {step.vrIncludeLibraryVideo && (
                  <div className="pt-2 border-t border-tv-border-divider">
                    {step.vrLibraryVideoTitle ? (
                      <div className="flex items-center gap-3 p-3 bg-tv-brand-tint border border-tv-border-strong rounded-md">
                        <div className="w-10 h-7 rounded-[5px] bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
                          <Play size={9} className="text-white ml-0.5" fill="white" />
                        </div>
                        <span className="text-[12px] text-tv-text-primary flex-1 truncate" style={{ fontWeight: 600 }}>{step.vrLibraryVideoTitle}</span>
                        <TvTooltip label="Remove video"><button onClick={() => setStep(s => ({ ...s, vrLibraryVideoId: undefined, vrLibraryVideoTitle: undefined }))}
                          aria-label="Remove library video" className="w-6 h-6 rounded-full bg-white border border-tv-border-light flex items-center justify-center text-tv-text-secondary hover:text-tv-danger shrink-0"><X size={10} /></button></TvTooltip>
                      </div>
                    ) : (
                      <button onClick={() => setShowVideoPicker(true)}
                        className="w-full flex items-center gap-3 p-3 rounded-md border-2 border-dashed border-tv-border-light hover:border-tv-brand-bg hover:bg-tv-brand-tint/30 transition-all text-left">
                        <Film size={16} className="text-tv-text-secondary shrink-0" />
                        <div className="flex-1">
                          <p className="text-[12px] text-tv-text-primary" style={{ fontWeight: 600 }}>Select from Library</p>
                          <p className="text-[10px] text-tv-text-secondary">Choose a video to accompany your instructions</p>
                        </div>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═════ VR RECORDERS TAB ═════ */}
          {activeTab === "vr-recorders" && (
            <div className="max-w-[620px]">
              <VRRecorderPanel />
            </div>
          )}

          {/* ═════ VR SCHEDULE TAB ═════ */}
          {activeTab === "vr-schedule" && (
            <div className="max-w-[620px] xl:max-w-[720px] 2xl:max-w-[840px] space-y-5">
              {/* Due date */}
              <div>
                <label className="tv-label mb-1.5 block">Due Date</label>
                <input type="date" value={step.vrDueDate || ""} onChange={e => setStep(s => ({ ...s, vrDueDate: e.target.value }))}
                  className={INPUT_CLS_LG} />
                <p className="text-[10px] text-tv-text-secondary mt-1.5">Recorders will see this deadline on their landing page.</p>
              </div>

              {/* Automated reminders */}
              <div className="bg-white rounded-lg border border-tv-border-light p-4 space-y-3">
                <button onClick={() => setStep(s => ({ ...s, vrReminderEnabled: !(s.vrReminderEnabled ?? true) }))}
                  className="w-full flex items-center justify-between">
                  <div>
                    <p className="text-[12px] text-tv-text-primary" style={{ fontWeight: 600 }}>Automated Reminders</p>
                    <p className="text-[10px] text-tv-text-secondary">Send reminders before the due date to non-submitters</p>
                  </div>
                  <div className={`w-9 h-5 rounded-full relative shrink-0 transition-colors ${(step.vrReminderEnabled ?? true) ? "bg-tv-brand-bg" : "bg-tv-surface-active"}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${(step.vrReminderEnabled ?? true) ? "left-[17px]" : "left-0.5"}`} />
                  </div>
                </button>
                {(step.vrReminderEnabled ?? true) && (
                  <div className="pt-2 border-t border-tv-border-divider space-y-2">
                    <label className="tv-label block">Remind before due date</label>
                    <div className="flex flex-wrap gap-2">
                      {[14, 7, 5, 3, 2, 1].map(d => {
                        const days = step.vrReminderDays || [7, 3, 1];
                        const active = days.includes(d);
                        return (
                          <button key={d} onClick={() => setStep(s => ({ ...s, vrReminderDays: active ? days.filter(x => x !== d) : [...days, d].sort((a, b) => b - a) }))}
                            className={`px-4 py-2 rounded-full text-[14px] border transition-all ${active ? "border-tv-brand-bg bg-tv-brand-tint text-tv-brand" : "border-tv-border-light text-tv-text-secondary hover:border-tv-border-strong"}`} style={{ fontWeight: 500 }}>
                            {d} day{d !== 1 ? "s" : ""}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-tv-text-secondary">{(step.vrReminderDays || [7, 3, 1]).length} reminder{(step.vrReminderDays || [7, 3, 1]).length !== 1 ? "s" : ""} scheduled</p>
                  </div>
                )}
              </div>

              {step.vrDueDate && (
                <div className="flex items-center gap-2 p-3.5 bg-tv-success-bg border border-tv-success-border rounded-lg">
                  <Check size={13} className="text-tv-success shrink-0" />
                  <p className="text-[11px] text-tv-success">
                    Due {new Date(step.vrDueDate + "T00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                    {(step.vrReminderEnabled ?? true) && ` with ${(step.vrReminderDays || [7, 3, 1]).length} reminder${(step.vrReminderDays || [7, 3, 1]).length !== 1 ? "s" : ""}`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ═════ VR LANDING TAB ═════ */}
          {activeTab === "vr-landing" && (
            <div className="max-w-[620px] xl:max-w-[720px] 2xl:max-w-[840px] space-y-5">
              {/* Shareable link */}
              {(step.vrDeliveryType || "email") === "link" && (
                <div className="bg-white rounded-lg border border-tv-border-light p-4">
                  <label className="tv-label mb-2 block">Shareable Video Request Link</label>
                  <div className="flex items-center gap-2 bg-tv-surface rounded-sm px-3 py-2.5 border border-tv-border-light">
                    <Link2 size={14} className="text-tv-brand shrink-0" />
                    <span className="text-[13px] text-tv-text-primary font-mono flex-1 truncate">{step.vrShareableUrl || "https://thankview.com/r/..."}</span>
                    <button onClick={() => show("Link copied!", "success")}
                      className="px-2.5 py-1 bg-tv-brand-bg text-white text-[11px] rounded-full hover:bg-tv-brand-hover transition-colors flex items-center gap-1 shrink-0" style={{ fontWeight: 600 }}>
                      <Copy size={10} />Copy
                    </button>
                  </div>
                  <p className="text-[10px] text-tv-text-secondary mt-2">Share via social media, QR codes, or anywhere you like.</p>

                  {/* Language & Font options for shareable link */}
                  <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-tv-border-divider">
                    <div>
                      <label className="tv-label mb-1 block">Language</label>
                      <select value={step.language || "en"} onChange={e => setStep(s => ({ ...s, language: e.target.value }))}
                        className="w-full border border-tv-border-light rounded-sm px-2.5 py-2 text-[12px] outline-none focus:ring-2 focus:ring-tv-brand/40 bg-white">
                        {LANGUAGE_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="tv-label mb-1 block">Font</label>
                      <select value={step.bodyFontFamily || "Roboto"} onChange={e => setStep(s => ({ ...s, bodyFontFamily: e.target.value }))}
                        className="w-full border border-tv-border-light rounded-sm px-2.5 py-2 text-[12px] outline-none focus:ring-2 focus:ring-tv-brand/40 bg-white">
                        {ENV_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Branded landing page */}
              <div className="bg-white rounded-lg border border-tv-border-light p-4">
                <label className="tv-label mb-2 block">Branded Landing Page</label>
                <div className="space-y-1.5">
                  {allLandingPageDesigns.map(p => (
                    <button key={p.id} onClick={() => setStep(s => ({ ...s, vrBrandedLandingPage: p.id }))}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md border text-left transition-all ${(step.vrBrandedLandingPage || 1) === p.id ? "border-tv-brand-bg bg-tv-brand-tint" : "border-tv-border-light hover:border-tv-border-strong"}`}>
                      <div className="w-7 h-5 rounded-[4px] flex items-center justify-center shrink-0"
                        style={{ background: `linear-gradient(135deg, ${p.color}, ${p.accent})` }}>
                        <Camera size={7} className="text-white" />
                      </div>
                      <span className="text-[12px] text-tv-text-primary flex-1" style={{ fontWeight: 500 }}>{p.name}</span>
                      {(step.vrBrandedLandingPage || 1) === p.id && <Check size={12} className="text-tv-brand" />}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-tv-text-secondary mt-2">This is the page recorders see when they open the recording link.</p>
              </div>

              {/* Submissions toggle */}
              <div className="bg-white rounded-lg border border-tv-border-light p-4">
                <button onClick={() => setStep(s => ({ ...s, vrSubmissionsEnabled: !(s.vrSubmissionsEnabled ?? true) }))}
                  className="w-full flex items-center justify-between">
                  <div>
                    <p className="text-[12px] text-tv-text-primary" style={{ fontWeight: 600 }}>Accept Submissions</p>
                    <p className="text-[10px] text-tv-text-secondary">{(step.vrSubmissionsEnabled ?? true) ? "Submissions are open" : "Link is disabled — no new submissions"}</p>
                  </div>
                  <div className={`w-9 h-5 rounded-full relative shrink-0 transition-colors ${(step.vrSubmissionsEnabled ?? true) ? "bg-tv-brand-bg" : "bg-tv-surface-active"}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${(step.vrSubmissionsEnabled ?? true) ? "left-[17px]" : "left-0.5"}`} />
                  </div>
                </button>
              </div>

              {/* Replies / Video Submissions section */}
              <div className="bg-white rounded-lg border border-tv-border-light p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] text-tv-text-primary" style={{ fontWeight: 700 }}>Video Submissions</p>
                    <p className="text-[10px] text-tv-text-secondary">Manage videos submitted by recorders</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-tv-success-bg text-tv-success text-[11px] rounded-full" style={{ fontWeight: 600 }}>3 received</span>
                    <span className="px-2.5 py-1 bg-tv-warning-bg text-tv-warning text-[11px] rounded-full" style={{ fontWeight: 600 }}>5 pending</span>
                  </div>
                </div>
                {/* Mock submission list */}
                <div className="space-y-1.5">
                  {[
                    { name: "Sarah Chen", status: "submitted", date: "Mar 18, 2026", duration: "1:42" },
                    { name: "James Wright", status: "submitted", date: "Mar 17, 2026", duration: "2:05" },
                    { name: "Maria Rodriguez", status: "submitted", date: "Mar 16, 2026", duration: "0:58" },
                  ].map((sub, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-md border border-tv-border-light hover:bg-tv-surface-muted transition-colors">
                      <div className="w-6 h-6 rounded-full bg-tv-success-bg flex items-center justify-center shrink-0">
                        <Check size={10} className="text-tv-success" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-tv-text-primary truncate" style={{ fontWeight: 600 }}>{sub.name}</p>
                        <p className="text-[10px] text-tv-text-secondary">{sub.date} · {sub.duration}</p>
                      </div>
                      <button className="px-2.5 py-1 text-[10px] text-tv-brand border border-tv-border-light rounded-full hover:bg-tv-brand-tint transition-colors" style={{ fontWeight: 600 }}>
                        <Play size={8} className="inline mr-1" />Review
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-tv-text-decorative">Submitted videos also appear in the "Requests" folder of your Video Library.</p>
              </div>
            </div>
          )}

          {/* ═════ SETTINGS TAB ═════ */}
          {activeTab === "settings" && (
            <div className="max-w-[620px] xl:max-w-[720px] 2xl:max-w-[840px] space-y-5">
              {/* Description */}
              <div>
                <label className="tv-label mb-1.5 block">Description (Optional)</label>
                <textarea
                  value={step.description}
                  onChange={e => setStep(s => ({ ...s, description: e.target.value }))}
                  placeholder="Brief description of this step\u2026"
                  rows={2}
                  className={`${INPUT_CLS_LG} resize-none`}
                />
              </div>

              {/* Automation toggle */}
              <button type="button"
                onClick={() => setStep(s => ({ ...s, automationEnabled: !s.automationEnabled }))}
                className="w-full flex items-center gap-4 px-4 py-4 bg-white border-2 border-tv-border-light rounded-lg hover:bg-tv-surface transition-colors cursor-pointer text-left">
                <Toggle enabled={step.automationEnabled} onToggle={() => {}} className="pointer-events-none" />
                <div>
                  <p className={`text-[13px] ${step.automationEnabled ? "text-tv-brand" : "text-tv-text-primary"}`} style={{ fontWeight: 600 }}>
                    Automation {step.automationEnabled ? "Enabled" : "Disabled"}
                  </p>
                  <p className="text-[11px] text-tv-text-secondary">
                    {step.automationEnabled ? "This step will send automatically when triggered." : "This step will require manual action to send."}
                  </p>
                </div>
              </button>

              {step.automationEnabled && (
                <>
                  {/* Trigger type selector */}
                  <div>
                    <label className="tv-label mb-1.5 block">Trigger Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setStep(s => ({ ...s, contactDateFieldId: undefined }))}
                        className={`flex items-center gap-2.5 px-3.5 py-3 rounded-md border-2 text-left transition-all ${
                          !step.contactDateFieldId
                            ? "border-tv-brand-bg bg-tv-brand-tint"
                            : "border-tv-border-light hover:border-tv-border-strong"
                        }`}
                      >
                        <Clock size={16} className={!step.contactDateFieldId ? "text-tv-brand" : "text-tv-text-secondary"} />
                        <div>
                          <p className={`text-[12px] ${!step.contactDateFieldId ? "text-tv-brand" : "text-tv-text-primary"}`} style={{ fontWeight: 600 }}>Time-based</p>
                          <p className="text-[10px] text-tv-text-secondary mt-0.5">Send at a preferred time</p>
                        </div>
                      </button>
                      <button
                        onClick={() => setStep(s => ({ ...s, contactDateFieldId: s.contactDateFieldId || "birthday" }))}
                        className={`flex items-center gap-2.5 px-3.5 py-3 rounded-md border-2 text-left transition-all ${
                          step.contactDateFieldId
                            ? "border-tv-brand-bg bg-tv-brand-tint"
                            : "border-tv-border-light hover:border-tv-border-strong"
                        }`}
                      >
                        <Cake size={16} className={step.contactDateFieldId ? "text-tv-brand" : "text-tv-text-secondary"} />
                        <div>
                          <p className={`text-[12px] ${step.contactDateFieldId ? "text-tv-brand" : "text-tv-text-primary"}`} style={{ fontWeight: 600 }}>Date field</p>
                          <p className="text-[10px] text-tv-text-secondary mt-0.5">Trigger by birthday, etc.</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Time-based: send time preference grid */}
                  {!step.contactDateFieldId && (
                    <div>
                      <label className="tv-label mb-1.5 block">Send Time Preference</label>
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          { value: "none", label: "No Preference", desc: "Send immediately when triggered" },
                          { value: "morning", label: "Morning", desc: "8\u201311 AM constituent local time" },
                          { value: "afternoon", label: "Afternoon", desc: "12\u20134 PM constituent local time" },
                          { value: "evening", label: "Evening", desc: "5\u20138 PM constituent local time" },
                        ] as const).map(opt => (
                          <button key={opt.value} onClick={() => setStep(s => ({ ...s, sendTimePreference: opt.value }))}
                            className={`text-left px-3.5 py-3 rounded-md border-2 transition-all ${step.sendTimePreference === opt.value ? "border-tv-brand-bg bg-tv-brand-tint" : "border-tv-border-light hover:border-tv-border-strong"}`}>
                            <p className={`text-[12px] ${step.sendTimePreference === opt.value ? "text-tv-brand" : "text-tv-text-primary"}`} style={{ fontWeight: 600 }}>{opt.label}</p>
                            <p className="text-[10px] text-tv-text-secondary mt-0.5">{opt.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Date-field: field picker + automation config panel */}
                  {step.contactDateFieldId && (
                    <div className="space-y-3">
                      <div>
                        <label className="tv-label mb-1.5 block">Constituent Date Field</label>
                        <div className="grid grid-cols-2 gap-2">
                          {CONSTITUENT_DATE_FIELDS.map(f => {
                            const CFIcon = ({ Cake, CalendarDays, GraduationCap, Briefcase } as Record<string, any>)[f.icon] || CalendarDays;
                            const sel = step.contactDateFieldId === f.id;
                            return (
                              <button key={f.id} onClick={() => setStep(s => ({ ...s, contactDateFieldId: f.id }))}
                                className={`flex items-center gap-2 px-3 py-2 rounded-sm border text-left transition-all ${
                                  sel ? "border-tv-brand-bg bg-white text-tv-brand" : "border-tv-border-light bg-white hover:border-tv-border-strong text-tv-text-secondary"
                                }`}>
                                <CFIcon size={13} className={sel ? "text-tv-brand" : "text-tv-text-decorative"} />
                                <p className="text-[11px] truncate" style={{ fontWeight: sel ? 600 : 400 }}>{f.label}</p>
                                {sel && <Check size={10} className="text-tv-brand shrink-0 ml-auto" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <AutomationConfigPanel
                        contactDateField={step.contactDateFieldId}
                        fieldLabel={CONSTITUENT_DATE_FIELDS.find(c => c.id === step.contactDateFieldId)?.label ?? "Date"}
                        fieldDesc={CONSTITUENT_DATE_FIELDS.find(c => c.id === step.contactDateFieldId)?.desc ?? ""}
                        daysBefore={step.contactFieldDaysBefore ?? 0}
                        setDaysBefore={v => setStep(s => ({ ...s, contactFieldDaysBefore: v }))}
                        contactFieldSendTime={step.contactFieldSendTime ?? "09:00"}
                        setContactFieldSendTime={v => setStep(s => ({ ...s, contactFieldSendTime: v }))}
                        recurAnnually={step.contactFieldRecurAnnually ?? true}
                        setRecurAnnually={v => setStep(s => ({ ...s, contactFieldRecurAnnually: v }))}
                        leapYearHandling={step.contactFieldLeapYear ?? "feb28"}
                        setLeapYearHandling={v => setStep(s => ({ ...s, contactFieldLeapYear: v }))}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Action Required notice */}
              {!step.automationEnabled && (
                <div className="p-3.5 bg-tv-warning-bg border border-tv-warning-border rounded-lg">
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-tv-warning-bg flex items-center justify-center shrink-0 mt-0.5">
                      <TriangleAlert size={11} className="text-tv-warning" />
                    </div>
                    <div>
                      <p className="text-[12px] text-tv-warning-hover" style={{ fontWeight: 600 }}>Action Required</p>
                      <p className="text-[11px] text-tv-warning mt-0.5 leading-relaxed">
                        Constituents will be paused at this step until a manual task is completed.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-tv-border-divider bg-tv-surface-muted shrink-0">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-tv-text-decorative">
              {isVR
                ? `${step.vrDeliveryType === "link" ? "Link" : step.vrDeliveryType === "sms" ? "SMS" : "Email"} · Due ${step.vrDueDate || "not set"} · Submissions ${(step.vrSubmissionsEnabled ?? true) ? "open" : "closed"}`
                : `${step.attachedVideo ? "Video attached" : "No video"} · Landing page ${step.landingPageEnabled ? "on" : "off"} · ${step.automationEnabled && step.contactDateFieldId ? `By ${CONSTITUENT_DATE_FIELDS.find(f => f.id === step.contactDateFieldId)?.label ?? "date"}` : `Automation ${step.automationEnabled ? "on" : "off"}`}`}
            </p>
            <div className="flex items-center gap-2.5">
              <button onClick={onCancel} className="px-5 py-2.5 text-[13px] text-tv-text-secondary border border-tv-border-light rounded-full hover:bg-tv-surface transition-colors" style={{ fontWeight: 500 }}>
                Cancel
              </button>
              <button
                onClick={() => onSave(step)}
                className="px-5 py-2.5 text-[13px] text-white bg-tv-brand-bg rounded-full hover:bg-tv-brand-hover transition-colors flex items-center gap-2" style={{ fontWeight: 600 }}
              >
                <Check size={13} />
                Create Step
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
    </FocusTrap>
  );
}

// ── Condition Creation Modal ─────────────────────────────────────────────────
function ConditionCreationModal({
  step: initialStep,
  onSave,
  onCancel,
}: {
  step: FlowStep;
  onSave: (step: FlowStep) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(initialStep.conditionField || null);

  return (
    <FocusTrap active>
    <div className="fixed inset-0 z-[70] flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Condition step setup">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative w-[95vw] max-w-[600px] max-h-[90vh] bg-white rounded-xl border border-tv-border-light shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-tv-border-divider shrink-0">
          <div>
            <h2 className="text-tv-text-primary" style={{ fontSize: "18px", fontWeight: 800 }}>
              Add Condition
            </h2>
            <p className="text-[13px] text-tv-text-secondary mt-0.5">Create a conditional branch in your campaign flow</p>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-full bg-tv-surface flex items-center justify-center text-tv-text-secondary hover:bg-tv-surface-hover transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Options list */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
          {CONDITION_OPTIONS.map(opt => {
            const isSelected = selected === opt.label;
            return (
              <button
                key={opt.id}
                onClick={() => setSelected(opt.label)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? "border-tv-brand-bg bg-tv-brand-tint"
                    : "border-tv-border-light hover:border-tv-border-strong"
                }`}
              >
                {/* Radio circle */}
                <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                  isSelected ? "border-tv-brand-bg" : "border-tv-border-strong"
                }`}>
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-tv-brand-bg" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[14px] ${isSelected ? "text-tv-brand" : "text-tv-text-primary"}`} style={{ fontWeight: 600 }}>{opt.label}</p>
                  <p className="text-[12px] text-tv-text-secondary mt-0.5">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-tv-border-divider bg-tv-surface-muted shrink-0">
          <div className="flex items-center justify-end gap-2.5">
            <button onClick={onCancel} className="px-5 py-2.5 text-[13px] text-tv-text-secondary border border-tv-border-light rounded-full hover:bg-tv-surface transition-colors" style={{ fontWeight: 500 }}>
              Cancel
            </button>
            <button
              onClick={() => {
                if (!selected) return;
                onSave({ ...initialStep, conditionField: selected, label: selected });
              }}
              disabled={!selected}
              className="px-5 py-2.5 text-[13px] text-white bg-tv-brand-bg rounded-full hover:bg-tv-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" style={{ fontWeight: 600 }}
            >
              <Check size={13} />
              Add Condition
            </button>
          </div>
        </div>
      </motion.div>
    </div>
    </FocusTrap>
  );
}

// ── Branch Add Button ────────────────────────────────────────────────────────
function BranchAddButton({ parentId, branchType, onAdd }: { parentId: string; branchType: "true" | "false"; onAdd: (parentId: string, branch: "true" | "false", type: FlowStepType) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(true)}
        className="w-6 h-6 rounded-full border border-tv-border-strong bg-white flex items-center justify-center text-tv-brand hover:bg-tv-brand-tint hover:border-tv-brand-bg transition-all hover:scale-110"
      >
        <Plus size={11} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 bg-white rounded-md border border-tv-border-light shadow-xl p-2 w-[200px]">
            <p className="text-[10px] text-tv-text-secondary uppercase tracking-wider px-2 py-1" style={{ fontWeight: 600 }}>Add to {branchType} branch</p>
            {[...FLOW_STEP_TYPES, { id: "exit" as FlowStepType, label: "End Campaign", icon: XCircle, color: "text-tv-danger", bg: "bg-tv-danger-bg", desc: "End the flow here" }].map(t => (
              <button
                key={t.id}
                onClick={() => { onAdd(parentId, branchType, t.id); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-sm hover:bg-tv-surface transition-colors text-left"
              >
                <div className={`w-6 h-6 rounded-[5px] ${t.bg} flex items-center justify-center shrink-0`}>
                  <t.icon size={11} className={t.color} />
                </div>
                <span className="text-[11px] text-tv-text-primary" style={{ fontWeight: 500 }}>{t.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Multi-Step Phase Navigation ──────────────────────────────────────────────
type MultiPhase = "configure" | "builder" | "constituents" | "schedule" | "review";

const MULTI_PHASES: { id: MultiPhase; label: string; icon: any }[] = [
  { id: "configure",     label: "Configure",      icon: Settings2 },
  { id: "builder",       label: "Builder",       icon: GitBranch },
  { id: "constituents",  label: "Constituents",  icon: Users },
  { id: "schedule",      label: "Schedule",      icon: Calendar },
  { id: "review",        label: "Review",        icon: Eye },
];

// ── Mock birthday data (20+ spread across the next 30 days) ──────────────────
const MOCK_BIRTHDAYS = (() => {
  const names = [
    "Sarah Chen", "Marcus Reid", "Elena Vasquez", "James Okafor", "Priya Sharma",
    "David Kim", "Maria Santos", "Ahmed Hassan", "Sophie Laurent", "Tomás Rivera",
    "Yuki Tanaka", "Olga Petrov", "Daniel Nyström", "Fatima Al-Rashid", "Liam O'Brien",
    "Ana Moretti", "Wei Zhang", "Rachel Thompson", "Carlos Fuentes", "Ingrid Larsen",
    "Kwame Asante", "Isabella Cruz", "Ben Whitfield", "Nadia Kovac",
  ];
  const today = new Date();
  // Deterministic day offsets within the next 30 days — some days share birthdays
  const offsets = [0,1,2,2,3,5,6,7,7,9,10,12,13,14,14,16,18,19,21,23,25,26,28,29];
  return names.map((name, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsets[i]);
    return { name, month: d.getMonth(), day: d.getDate() };
  });
})();

// Count of mock Feb-29 birthdays for leap-year edge-case demo
const FEB29_COUNT = 3;

// Preset chips for the days-before stepper
const DAYS_BEFORE_PRESETS = [
  { value: 0,  label: "On the day" },
  { value: 3,  label: "3 days before" },
  { value: 7,  label: "7 days before" },
];

/** Compact 30-day mini-calendar with birthday dot badges. */
function BirthdayMiniCalendar({ daysBefore }: { daysBefore: number }) {
  const today = new Date();
  // Build 30 days starting from today
  const days: { date: Date; count: number; isSendDay: boolean }[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const count = MOCK_BIRTHDAYS.filter(b => b.month === d.getMonth() && b.day === d.getDate()).length;
    // A "send day" is daysBefore offset before a birthday
    const sendDate = new Date(d);
    sendDate.setDate(sendDate.getDate() + daysBefore);
    const isSendDay = MOCK_BIRTHDAYS.some(b => b.month === sendDate.getMonth() && b.day === sendDate.getDate());
    days.push({ date: d, count, isSendDay });
  }

  const DOW = ["S","M","T","W","T","F","S"];
  // Leading blanks to align the first day to its weekday column
  const startDow = days[0].date.getDay();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className="w-[240px]">
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 gap-px mb-1">
        {DOW.map((d, i) => (
          <div key={i} className="text-center text-[8px] text-tv-text-decorative" style={{ fontWeight: 600 }}>{d}</div>
        ))}
      </div>
      {/* Day cells */}
      <div className="grid grid-cols-7 gap-px">
        {Array.from({ length: startDow }).map((_, i) => <div key={`blank-${i}`} />)}
        {days.map((d, i) => {
          const isToday = i === 0;
          const dayNum = d.date.getDate();
          const hasBirthdays = d.count > 0;
          return (
            <div
              key={i}
              className="relative flex flex-col items-center py-0.5"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <span className={`text-[9px] w-5 h-5 flex items-center justify-center rounded-full ${
                isToday
                  ? "bg-tv-brand-bg text-white"
                  : d.isSendDay
                  ? "bg-tv-brand-tint text-tv-brand"
                  : "text-tv-text-secondary"
              }`} style={{ fontWeight: isToday || hasBirthdays ? 600 : 400 }}>
                {dayNum}
              </span>
              {hasBirthdays && (
                <div className="flex gap-px mt-0.5">
                  {Array.from({ length: Math.min(d.count, 3) }).map((_, di) => (
                    <div key={di} className="w-[3px] h-[3px] rounded-full bg-tv-brand-bg" />
                  ))}
                  {d.count > 3 && <span className="text-[6px] text-tv-brand ml-px">+</span>}
                </div>
              )}
              {/* Tooltip */}
              {hoveredIdx === i && hasBirthdays && (
                <div className="absolute bottom-full mb-1 px-2 py-1 bg-tv-text-primary text-white text-[9px] rounded-[4px] whitespace-nowrap z-20 shadow-lg pointer-events-none" style={{ fontWeight: 500 }}>
                  {d.count} birthday{d.count !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Full automation configuration panel for constituent-date-field scheduling. */
function AutomationConfigPanel({
  contactDateField, fieldLabel, fieldDesc,
  daysBefore, setDaysBefore,
  contactFieldSendTime, setContactFieldSendTime,
  recurAnnually, setRecurAnnually,
  leapYearHandling, setLeapYearHandling,
}: {
  contactDateField: ConstituentDateFieldId;
  fieldLabel: string;
  fieldDesc: string;
  daysBefore: number;
  setDaysBefore: (n: number) => void;
  contactFieldSendTime: string;
  setContactFieldSendTime: (t: string) => void;
  recurAnnually: boolean;
  setRecurAnnually: (v: boolean) => void;
  leapYearHandling: "feb28" | "mar1";
  setLeapYearHandling: (v: "feb28" | "mar1") => void;
}) {
  const isBirthday = contactDateField === "birthday";
  const fieldNoun = isBirthday ? "birthday" : fieldLabel.toLowerCase();

  return (
    <div className="space-y-3">
      {/* Info banner */}
      <div className="flex items-center gap-2 p-2.5 bg-tv-brand-tint border border-tv-brand-bg/20 rounded-sm">
        <Info size={11} className="text-tv-brand shrink-0" />
        <p className="text-[10px] text-tv-brand">
          {fieldDesc}. Missing constituents will be skipped.
        </p>
      </div>

      {/* ── 1. Send timing row ── */}
      <div className="space-y-2">
        <label className="tv-label block">Send Timing</label>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-tv-text-primary" style={{ fontWeight: 500 }}>Send</span>
          {/* Number stepper */}
          <div className="flex items-center border border-tv-border-light rounded-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setDaysBefore(Math.max(0, daysBefore - 1))}
              disabled={daysBefore <= 0}
              className="w-6 h-7 flex items-center justify-center text-tv-text-secondary hover:bg-tv-surface disabled:opacity-30 transition-colors"
            >
              <span className="text-[13px]" style={{ fontWeight: 700 }}>−</span>
            </button>
            <input
              type="number"
              min={0}
              max={30}
              value={daysBefore}
              onChange={e => {
                const v = Math.max(0, Math.min(30, Number(e.target.value) || 0));
                setDaysBefore(v);
              }}
              className="w-8 h-7 text-center text-[11px] border-x border-tv-border-light outline-none focus:ring-1 focus:ring-tv-brand/40 bg-white"
              style={{ fontWeight: 600 }}
            />
            <button
              type="button"
              onClick={() => setDaysBefore(Math.min(30, daysBefore + 1))}
              disabled={daysBefore >= 30}
              className="w-6 h-7 flex items-center justify-center text-tv-text-secondary hover:bg-tv-surface disabled:opacity-30 transition-colors"
            >
              <span className="text-[13px]" style={{ fontWeight: 700 }}>+</span>
            </button>
          </div>
          <span className="text-[11px] text-tv-text-primary" style={{ fontWeight: 500 }}>
            {daysBefore === 0 ? `on each constituent's ${fieldNoun}` : `day${daysBefore !== 1 ? "s" : ""} before each constituent's ${fieldNoun}`}
          </span>
        </div>
        {/* Preset chips */}
        <div className="flex gap-1.5 flex-wrap">
          {DAYS_BEFORE_PRESETS.map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => setDaysBefore(p.value)}
              className={`px-4 py-2 rounded-full text-[14px] border transition-all ${
                daysBefore === p.value
                  ? "bg-tv-brand-bg text-white border-tv-brand-bg"
                  : "border-tv-border-light text-tv-text-secondary hover:border-tv-border-strong bg-white"
              }`}
              style={{ fontWeight: daysBefore === p.value ? 600 : 400 }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Send time */}
      <div>
        <label className="tv-label mb-1 block">Send Time</label>
        <input
          type="time"
          value={contactFieldSendTime}
          onChange={e => setContactFieldSendTime(e.target.value)}
          className="w-full border border-tv-border-light rounded-sm px-3 py-2 text-[12px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand bg-white"
        />
      </div>

      {/* ── 2. Mini calendar ── */}
      {isBirthday && (
        <div>
          <label className="tv-label mb-2 block">
            Upcoming Birthdays (Next 30 Days)
          </label>
          <div className="p-3 border border-tv-border-light rounded-md bg-white inline-block">
            <BirthdayMiniCalendar daysBefore={daysBefore} />
          </div>
          <p className="text-[8px] text-tv-text-decorative mt-1.5">
            Dots indicate days with constituent birthdays. Highlighted dates are scheduled send days.
          </p>
        </div>
      )}

      {/* ── 3. Recur annually toggle ── */}
      <div className="flex items-center justify-between p-2.5 border border-tv-border-light rounded-sm bg-white">
        <div className="flex items-center gap-2">
          <Repeat size={12} className={recurAnnually ? "text-tv-brand" : "text-tv-text-secondary"} />
          <div>
            <p className="text-[11px] text-tv-text-primary" style={{ fontWeight: 500 }}>Recur annually</p>
            <p className="text-[8px] text-tv-text-secondary">
              Automatically re-send every year on each constituent's {fieldNoun}
            </p>
          </div>
        </div>
        <Toggle enabled={recurAnnually} onToggle={() => setRecurAnnually(!recurAnnually)} size="compact" />
      </div>

      {/* ── 4. Feb 29 leap-year banner ── */}
      {isBirthday && FEB29_COUNT > 0 && (
        <div className="p-2.5 bg-tv-warning-bg border border-tv-warning-border rounded-sm space-y-2">
          <div className="flex items-center gap-1.5">
            <TriangleAlert size={11} className="text-tv-warning shrink-0" />
            <span className="text-[10px] text-tv-warning" style={{ fontWeight: 600 }}>
              {FEB29_COUNT} constituent{FEB29_COUNT !== 1 ? "s" : ""} ha{FEB29_COUNT !== 1 ? "ve" : "s"} Feb 29 birthdays
            </span>
          </div>
          <div className="flex gap-1.5">
            {([
              { value: "feb28" as const, label: "Send on Feb 28" },
              { value: "mar1" as const,  label: "Send on Mar 1" },
            ]).map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setLeapYearHandling(opt.value)}
                className={`flex items-center gap-1.5 flex-1 px-2.5 py-1.5 rounded-full border text-[10px] transition-all ${
                  leapYearHandling === opt.value
                    ? "border-tv-warning bg-white text-tv-warning"
                    : "border-tv-warning-border bg-tv-warning-bg/50 text-tv-warning hover:bg-white"
                }`}
                style={{ fontWeight: leapYearHandling === opt.value ? 600 : 400 }}
              >
                {leapYearHandling === opt.value && <Check size={9} className="text-tv-warning shrink-0" />}
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. Future constituents note ── */}
      <p className="text-[9px] text-tv-text-decorative leading-relaxed">
        Constituents added after activation will be included in the next eligible send.
      </p>
    </div>
  );
}

// ── Multi-Step Campaign Builder ──────────────────────────────────────────────
/** Convert a TemplateStepContent into a full FlowStep */
function templateStepToFlowStep(tsc: TemplateStepContent): FlowStep {
  const id = makeId();
  const isEmail = tsc.type === "email";
  const isSms = tsc.type === "sms";
  const isWait = tsc.type === "wait";
  const isCond = tsc.type === "condition";
  return {
    id,
    type: tsc.type as FlowStepType,
    label: tsc.label || (isEmail ? "Email" : isSms ? "SMS" : isWait ? `Wait ${tsc.waitDays ?? 3} days` : "Condition"),
    description: "",
    automationEnabled: false,
    sendTimePreference: "none",
    // Wait
    waitDays: isWait ? (tsc.waitDays ?? 3) : undefined,
    // Condition
    conditionField: isCond ? (tsc.conditionField ?? "Opened previous email") : undefined,
    // Email
    subject: isEmail ? (tsc.subject ?? "") : undefined,
    body: isEmail ? (tsc.body ?? "") : undefined,
    senderName: isEmail ? (tsc.senderName ?? "Kelley Molt") : isSms ? (tsc.senderName ?? "Hartwell University") : undefined,
    senderEmail: isEmail ? (tsc.senderEmail ?? "kelley.molt@hartwell.edu") : undefined,
    replyTo: isEmail ? (tsc.replyTo ?? "giving@hartwell.edu") : undefined,
    font: isEmail ? (tsc.font ?? "Serif (Garamond)") : undefined,
    envelopeId: isEmail ? 1 : undefined,
    thumbnailType: isEmail ? "static" : undefined,
    includeVideoThumbnail: isEmail ? true : undefined,
    btnBg: isEmail ? "#7c45b0" : undefined,
    btnText: isEmail ? "#ffffff" : undefined,
    // SMS
    smsBody: isSms ? (tsc.smsBody ?? "") : undefined,
    smsPhoneNumber: isSms ? "+1 (555) 012-3456" : undefined,
    // Landing page
    attachedVideo: null,
    landingPageEnabled: tsc.landingPageEnabled ?? false,
    landingPageId: 1,
    lpModule: "cta",
    ctaText: tsc.ctaText ?? "Give to the Annual Fund",
    ctaUrl: tsc.ctaUrl ?? "https://hartwell.edu/give",
    allowEmailReply: true,
    allowVideoReply: false,
    allowSaveButton: true,
    allowShareButton: true,
    allowDownloadVideo: true,
    closedCaptionsEnabled: true,
    lpWhiteGradient: true,
    replyToList: isEmail ? [(tsc.replyTo ?? "giving@hartwell.edu")] : undefined,
    // Condition branches (populated later by hydration logic)
    trueBranch: isCond ? [] : undefined,
    falseBranch: isCond ? [] : undefined,
  };
}

export function MultiStepBuilder({ onBack, initialTemplate = null }: { onBack: () => void; initialTemplate?: CampaignTemplate | null }) {
  const navigate = useNavigate();
  const { show } = useToast();
  const { addTemplate } = useTemplates();

  // Save as Template state
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  // Send Test modal state (declared before Escape handler that references it)
  const [showSendTestModal, setShowSendTestModal] = useState(false);
  const [sendTestEmail, setSendTestEmail] = useState("kelley.molt@hartwell.edu");
  const [sendTestPreviewAs, setSendTestPreviewAs] = useState(0);
  const [sendTestSending, setSendTestSending] = useState(false);

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

  // Phase navigation
  const [phase, setPhaseRaw] = useState<MultiPhase>("configure");
  const phaseIdx = MULTI_PHASES.findIndex(p => p.id === phase);

  // Configure step must be completed before any other step is accessible
  const [configureCompleted, setConfigureCompleted] = useState(false);

  // ── Dirty tracking + autosave ─────────────────────────────────────────────
  const [multiDirty, setMultiDirty] = useState(false);
  const [pendingMultiPhase, setPendingMultiPhase] = useState<MultiPhase | null>(null);
  const markMultiDirty = useCallback(() => { if (!multiDirty) setMultiDirty(true); }, [multiDirty]);

  /** Navigate phase via breadcrumb — confirms if dirty */
  const navigateMultiPhase = useCallback((id: MultiPhase) => {
    if (id === phase) return;
    // Block navigation to non-configure steps until configure is completed
    if (id !== "configure" && !configureCompleted) return;
    if (multiDirty) { setPendingMultiPhase(id); return; }
    setPhaseRaw(id);
  }, [phase, multiDirty, configureCompleted]);

  const confirmMultiSave = useCallback(() => {
    if (pendingMultiPhase) { show("✓ Progress saved", "success"); setMultiDirty(false); setPhaseRaw(pendingMultiPhase); setPendingMultiPhase(null); }
  }, [pendingMultiPhase, show]);
  const confirmMultiDiscard = useCallback(() => {
    if (pendingMultiPhase) { setMultiDirty(false); setPhaseRaw(pendingMultiPhase); setPendingMultiPhase(null); }
  }, [pendingMultiPhase]);
  const cancelMultiNav = useCallback(() => { setPendingMultiPhase(null); }, []);

  /** Wrap setPhase for Next/Back — auto-saves silently */
  const setPhase = useCallback((id: MultiPhase) => {
    if (multiDirty) { show("✓ Progress saved", "success"); setMultiDirty(false); }
    setPhaseRaw(id);
  }, [multiDirty, show]);

  useEffect(() => { setMultiDirty(false); }, [phase]);

  // Builder state — hydrate from template if provided
  const [steps, setSteps] = useState<FlowStep[]>(() => {
    if (initialTemplate?.multiSteps && initialTemplate.multiSteps.length > 0) {
      // Build a flat list first, then wire condition branches
      const raw = initialTemplate.multiSteps;
      const result: FlowStep[] = [];
      let i = 0;
      while (i < raw.length) {
        const fs = templateStepToFlowStep(raw[i]);
        if (raw[i].type === "condition" && i + 2 < raw.length) {
          // Next two steps are the true/false branches
          fs.trueBranch = [templateStepToFlowStep(raw[i + 1])];
          fs.falseBranch = [templateStepToFlowStep(raw[i + 2])];
          i += 3;
        } else {
          i++;
        }
        result.push(fs);
      }
      return result;
    }
    return [];
  });
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (initialTemplate?.multiSteps && initialTemplate.multiSteps.length > 0) return null;
    return null;
  });
  const [addingAtIndex, setAddingAtIndex] = useState<number | null>(null);
  const [campaignName, setCampaignName] = useState(initialTemplate ? initialTemplate.name : "Untitled Campaign");
  const [editingName, setEditingName] = useState(false);
  const [templateBannerDismissed, setTemplateBannerDismissed] = useState(false);

  // Floating live preview state
  const [showPreview, setShowPreview] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // DnD sensors and handler for step reordering
  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSteps(prev => {
        const oldIndex = prev.findIndex(s => s.id === active.id);
        const newIndex = prev.findIndex(s => s.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, []);

  // Schedule state
  type ScheduleType = "now" | "later" | "contact-field";
  const [scheduleType, setScheduleType] = useState<ScheduleType | null>(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("09:00");

  const MSB_TEST_CONSTITUENTS = [
    { id: 0, name: "James Whitfield", email: "j.whitfield@alumni.edu", classYear: 1998, city: "Boston, MA" },
    { id: 1, name: "Sarah Chen", email: "s.chen@foundation.org", classYear: 2005, city: "San Francisco, CA" },
    { id: 2, name: "Marcus Reid", email: "m.reid@email.com", classYear: 2012, city: "Chicago, IL" },
  ];
  const [contactDateField, setContactDateField] = useState<ConstituentDateFieldId | null>(null);
  const [leapYearHandling, setLeapYearHandling] = useState<"feb28" | "mar1">("feb28");
  const [contactFieldSendTime, setContactFieldSendTime] = useState("09:00");
  const [daysBefore, setDaysBefore] = useState(0);
  const [recurAnnually, setRecurAnnually] = useState(true);

  // Success metrics state (1-5 selectable) — configured in step 1, shown in summary
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);

  // Campaign tags state — managed in Configure step
  const [campaignTags, setCampaignTags] = useState<string[]>([]);

  // Review / send state
  const [sendState, setSendState] = useState<"review" | "sending" | "success">("review");

  // Creation modal state: holds the pending step + where to insert it
  const [creatingStep, setCreatingStep] = useState<{ step: FlowStep; insertAt: number; branch?: { parentId: string; type: "true" | "false" } } | null>(null);

  const selectedStep = selectedId ? findStep(steps, selectedId) : null;

  // Schedule validation
  const CONSTITUENT_FIELD_ICONS: Record<string, any> = { Cake, CalendarDays, GraduationCap, Briefcase };

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
    if (scheduleType === "now") return "Start immediately";
    if (scheduleType === "later") {
      if (!scheduledDate) return "Date not selected";
      const d = new Date(`${scheduledDate}T${scheduledTime || "00:00"}`);
      return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) + " at " + (scheduledTime || "00:00");
    }
    if (scheduleType === "contact-field") {
      const field = CONSTITUENT_DATE_FIELDS.find(f => f.id === contactDateField);
      if (!field) return "Field not selected";
      const timing = daysBefore > 0 ? ` (${daysBefore}d before)` : "";
      return `By ${field.label}${timing}${recurAnnually ? ", recurring" : ""}`;
    }
    return "Not set";
  })();

  // Count steps by type for the review summary
  const countSteps = (arr: FlowStep[]): Record<string, number> => {
    const counts: Record<string, number> = {};
    for (const s of arr) {
      counts[s.type] = (counts[s.type] || 0) + 1;
      if (s.trueBranch) { const sub = countSteps(s.trueBranch); for (const k in sub) counts[k] = (counts[k] || 0) + sub[k]; }
      if (s.falseBranch) { const sub = countSteps(s.falseBranch); for (const k in sub) counts[k] = (counts[k] || 0) + sub[k]; }
    }
    return counts;
  };
  const stepCounts = countSteps(steps);

  // Send simulation
  useEffect(() => {
    if (sendState !== "sending") return;
    const timer = setTimeout(() => { setSendState("success"); }, 2000);
    return () => clearTimeout(timer);
  }, [sendState]);

  function findStep(arr: FlowStep[], id: string): FlowStep | null {
    for (const s of arr) {
      if (s.id === id) return s;
      if (s.trueBranch) { const f = findStep(s.trueBranch, id); if (f) return f; }
      if (s.falseBranch) { const f = findStep(s.falseBranch, id); if (f) return f; }
    }
    return null;
  }

  function updateStepInArr(arr: FlowStep[], id: string, updated: FlowStep): FlowStep[] {
    return arr.map(s => {
      if (s.id === id) return updated;
      return {
        ...s,
        trueBranch: s.trueBranch ? updateStepInArr(s.trueBranch, id, updated) : undefined,
        falseBranch: s.falseBranch ? updateStepInArr(s.falseBranch, id, updated) : undefined,
      };
    });
  }

  function deleteStepInArr(arr: FlowStep[], id: string): FlowStep[] {
    return arr.filter(s => s.id !== id).map(s => ({
      ...s,
      trueBranch: s.trueBranch ? deleteStepInArr(s.trueBranch, id) : undefined,
      falseBranch: s.falseBranch ? deleteStepInArr(s.falseBranch, id) : undefined,
    }));
  }

  const makeNewStep = (type: FlowStepType): FlowStep => ({
    id: makeId(),
    type,
    label: type === "wait" ? "Wait" : type === "condition" ? "Condition" : type === "sms" ? "SMS" : type === "exit" ? "End Campaign" : type === "video-request" ? "Video Request" : "Email",
    description: "",
    automationEnabled: false,
    sendTimePreference: "none",
    waitDays: type === "wait" ? 3 : undefined,
    conditionField: type === "condition" ? "" : undefined,
    // Email defaults
    subject: type === "email" ? "" : undefined,
    body: type === "email" ? "" : undefined,
    senderName: type === "email" || type === "video-request" ? "Kelley Molt" : type === "sms" ? "Hartwell University" : undefined,
    senderEmail: type === "email" || type === "video-request" ? "kelley.molt@hartwell.edu" : undefined,
    replyTo: type === "email" ? "giving@hartwell.edu" : undefined,
    replyToList: type === "email" ? ["giving@hartwell.edu"] : undefined,
    language: type === "email" ? "en" : undefined,
    font: type === "email" ? "Serif (Garamond)" : undefined,
    envelopeId: type === "email" ? 1 : undefined,
    thumbnailType: type === "email" ? "static" : undefined,
    btnBg: type === "email" ? TV.brand : undefined,
    btnText: type === "email" ? "#ffffff" : undefined,
    // SMS defaults
    smsBody: type === "sms" ? "" : undefined,
    smsPhoneNumber: type === "sms" ? "+1 (555) 012-3456" : undefined,
    // Video attachment (email/sms)
    attachedVideo: (type === "email" || type === "sms") ? null : undefined,
    // Landing page
    landingPageEnabled: (type === "email" || type === "sms") ? false : undefined,
    landingPageId: (type === "email" || type === "sms") ? 1 : undefined,
    lpModule: (type === "email" || type === "sms") ? "cta" : undefined,
    ctaText: (type === "email" || type === "sms") ? "Give to the Annual Fund" : undefined,
    ctaUrl: (type === "email" || type === "sms") ? "https://hartwell.edu/give" : undefined,
    allowEmailReply: (type === "email" || type === "sms") ? true : undefined,
    allowVideoReply: (type === "email" || type === "sms") ? false : undefined,
    allowSaveButton: (type === "email" || type === "sms") ? true : undefined,
    allowShareButton: (type === "email" || type === "sms") ? true : undefined,
    allowDownloadVideo: (type === "email" || type === "sms") ? true : undefined,
    closedCaptionsEnabled: (type === "email" || type === "sms") ? true : undefined,
    lpWhiteGradient: (type === "email" || type === "sms") ? true : undefined,
    trueBranch: type === "condition" ? [] : undefined,
    falseBranch: type === "condition" ? [] : undefined,
    // Video Request defaults
    vrDeliveryType: type === "video-request" ? "email" : undefined,
    vrInstructions: type === "video-request" ? VR_DEFAULT_INSTRUCTIONS : undefined,
    vrDueDate: type === "video-request" ? "" : undefined,
    vrReminderDays: type === "video-request" ? [7, 3, 1] : undefined,
    vrReminderEnabled: type === "video-request" ? true : undefined,
    vrSubmissionsEnabled: type === "video-request" ? true : undefined,
    vrIncludeLibraryVideo: type === "video-request" ? false : undefined,
    vrBrandedLandingPage: type === "video-request" ? 1 : undefined,
    vrShareableUrl: type === "video-request" ? "https://thankview.com/r/" + makeId() : undefined,
  });

  const addStep = (type: FlowStepType, index: number) => {
    const newStep = makeNewStep(type);
    setAddingAtIndex(null);

    // Condition → still uses a small creation modal for the condition picker
    if (type === "condition") {
      setSelectedId(null);
      setCreatingStep({ step: newStep, insertAt: index });
      return;
    }

    // All other types: insert directly into the flow and open the drawer
    setSteps(prev => [...prev.slice(0, index), newStep, ...prev.slice(index)]);
    setSelectedId(newStep.id);
    // Step added silently — drawer opens automatically
  };

  const deleteStep = (id: string) => {
    setSteps(prev => deleteStepInArr(prev, id));
    if (selectedId === id) setSelectedId(null);
  };

  const updateStep = (updated: FlowStep) => {
    setSteps(prev => updateStepInArr(prev, updated.id, updated));
  };

  // Recursively insert a step into a condition branch at any nesting depth
  function insertIntoBranch(arr: FlowStep[], parentId: string, branchType: "true" | "false", newStep: FlowStep): FlowStep[] {
    return arr.map(s => {
      if (s.id === parentId) {
        if (branchType === "true") return { ...s, trueBranch: [...(s.trueBranch || []), newStep] };
        return { ...s, falseBranch: [...(s.falseBranch || []), newStep] };
      }
      return {
        ...s,
        trueBranch: s.trueBranch ? insertIntoBranch(s.trueBranch, parentId, branchType, newStep) : undefined,
        falseBranch: s.falseBranch ? insertIntoBranch(s.falseBranch, parentId, branchType, newStep) : undefined,
      };
    });
  }

  // Add step into a condition branch
  const addToBranch = (parentId: string, branch: "true" | "false", type: FlowStepType) => {
    const newStep = makeNewStep(type);

    // Condition → still uses a small creation modal for the condition picker
    if (type === "condition") {
      setSelectedId(null);
      setCreatingStep({ step: newStep, insertAt: -1, branch: { parentId, type: branch } });
      return;
    }

    // All other types: insert directly and open drawer
    setSteps(prev => insertIntoBranch(prev, parentId, branch, newStep));
    setSelectedId(newStep.id);
  };

  // Handle creation modal save: insert the fully-configured step into the flow
  const handleCreationSave = (finishedStep: FlowStep) => {
    if (!creatingStep) return;

    if (creatingStep.branch) {
      // Insert into a condition branch (recursive for nested conditions)
      const { parentId, type: branchType } = creatingStep.branch;
      setSteps(prev => insertIntoBranch(prev, parentId, branchType, finishedStep));
    } else {
      // Insert into main flow at the specified index
      const idx = creatingStep.insertAt;
      setSteps(prev => [...prev.slice(0, idx), finishedStep, ...prev.slice(idx)]);
    }

    setSelectedId(null); // don't auto-open drawer after creation
    setCreatingStep(null);
    const typeLabel = finishedStep.type === "email" ? "Email" : finishedStep.type === "sms" ? "SMS" : finishedStep.type === "video-request" ? "Video Request" : "Condition";
    show(`${typeLabel} step created`, "success");
  };

  const handleSave = () => {
    show("Campaign saved as draft", "info");
    navigate("/campaigns");
  };

  // Render a branch (array of steps + end node)
  const renderBranch = (branchSteps: FlowStep[], parentId: string, branchType: "true" | "false") => (
    <div className="flex flex-col items-center">
      <div className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full mb-1 ${branchType === "true" ? "bg-tv-success text-white" : "bg-tv-danger text-white"}`} style={{ fontWeight: 700 }}>
        {branchType === "true" ? "TRUE" : "FALSE"}
      </div>
      <div className="w-px h-4 bg-tv-border" />
      {branchSteps.map((bs, bi) => (
        <div key={bs.id} className="flex flex-col items-center">
          <FlowNode
            step={bs}
            selected={selectedId === bs.id}
            onSelect={() => setSelectedId(bs.id)}
            onDelete={() => deleteStep(bs.id)}
            onToggleAutomation={() => updateStep({ ...bs, automationEnabled: !bs.automationEnabled })}
          />
          {bi < branchSteps.length - 1 && <Connector />}
        </div>
      ))}
      {branchSteps.length === 0 && (
        <div className="border border-tv-border rounded-lg px-5 py-4 text-center">
          <p className="text-[11px] text-tv-text-decorative">No steps yet</p>
        </div>
      )}
      <div className="w-px h-3 bg-tv-border" />
      <BranchAddButton parentId={parentId} branchType={branchType} onAdd={addToBranch} />
    </div>
  );

  const goNext = () => {
    // Mark configure as completed when advancing past it
    if (phase === "configure" && !configureCompleted) setConfigureCompleted(true);
    const next = MULTI_PHASES[phaseIdx + 1];
    if (next) { setPhase(next.id); setSelectedId(null); }
  };
  const [showModeConfirm, setShowModeConfirm] = useState(false);
  const goBack = () => {
    const prev = MULTI_PHASES[phaseIdx - 1];
    if (prev) { setPhase(prev.id); return; }
    // At the first phase — ask for confirmation if the user has built steps
    const hasProgress = steps.length > 0 || campaignName !== "Untitled Campaign" || selectedMetrics.length > 0 || campaignTags.length > 0;
    if (hasProgress) { setShowModeConfirm(true); return; }
    onBack();
  };

  // ── Success state ──
  if (sendState === "success") {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <div className="w-full max-w-[560px] text-center">
          <div className="w-16 h-16 rounded-full bg-tv-success-bg flex items-center justify-center mx-auto mb-5">
            <Check size={28} className="text-tv-success" />
          </div>
          <h2 className="font-display text-tv-text-primary mb-2" style={{ fontSize: "22px", fontWeight: 900 }}>Campaign Activated!</h2>
          <p className="text-[13px] text-tv-text-secondary leading-relaxed">
            Your multi-step campaign <span className="text-tv-text-primary" style={{ fontWeight: 600 }}>{campaignName}</span> with{" "}
            <span className="text-tv-text-primary" style={{ fontWeight: 600 }}>{steps.length} steps</span> is now live and will begin processing constituents{" "}
            {scheduleType === "now" ? "immediately" : scheduleLabel.toLowerCase()}.
          </p>
          <button onClick={() => navigate("/campaigns")}
            className="mt-6 px-6 py-3 text-[13px] text-white bg-tv-brand-bg rounded-full hover:bg-tv-brand-hover transition-colors" style={{ fontWeight: 600 }}>
            Done — Go to Campaigns
          </button>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  // ── Per-phase advancement gating ────────────────────────────────────────────
  // Builder: at least 1 step AND every messaging step's required (error-severity) fields filled
  const allStepsRequiredMet = steps.length > 0 && steps.every(s => {
    const isEmail = s.type === "email";
    const isSms   = s.type === "sms";
    if (isEmail) {
      return !!(s.subject && s.subject.trim()) && !!(s.body && s.body.trim());
    }
    if (isSms) {
      return !!(s.smsBody && s.smsBody.trim());
    }
    // wait, condition, exit, video-request have no hard "error" requirements
    return true;
  });

  const canAdvancePhase = (() => {
    if (phase === "configure") return selectedMetrics.length >= 1;
    if (phase === "builder") return allStepsRequiredMet;
    if (phase === "schedule") return isScheduleValid;
    return true; // constituents — always allowed
  })();

  const advanceBlockReason = (() => {
    if (phase === "configure") {
      if (selectedMetrics.length < 1) return "Select at least 1 success metric.";
      return "";
    }
    if (phase === "builder") {
      if (steps.length === 0) return "Add at least one step to your campaign.";
      if (!allStepsRequiredMet) return "Complete all required fields in every step before proceeding.";
    }
    if (phase === "schedule") {
      if (!scheduleType) return "Please select a scheduling option.";
      return "Complete the send configuration.";
    }
    return "";
  })();

  // Next step labels for the bottom bar
  const nextStepLabel = (() => {
    if (phase === "configure") return "Next: Builder";
    if (phase === "builder") return "Next: Constituents";
    if (phase === "constituents") return "Next: Schedule";
    if (phase === "schedule") return "Next: Review & Send";
    return "";
  })();

  return (
    <div className="min-h-full flex flex-col">
      {/* ── Stepper header (matches single-step wizard) ── */}
      <div className="sticky top-0 z-10 bg-white border-b border-tv-border-divider px-4 sm:px-6 py-4 shrink-0">
        <div className="flex items-center justify-center max-w-[800px] 2xl:max-w-[960px] mx-auto">
          {MULTI_PHASES.map((p, i) => {
            const isActive = i === phaseIdx;
            const isPast = i < phaseIdx;
            const isLocked = p.id !== "configure" && !configureCompleted;
            return (
              <div key={p.id} className="flex items-center flex-1 last:flex-none min-w-0">
                <button
                  onClick={() => navigateMultiPhase(p.id)}
                  disabled={isLocked}
                  className={`flex items-center gap-1.5 shrink-0 rounded-full py-0.5 transition-colors ${isLocked ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:opacity-80"} ${isActive ? "bg-tv-brand-tint pl-1 pr-2.5" : ""}`}
                  aria-current={isActive ? "step" : undefined}
                  aria-label={isLocked ? `${p.label} (complete Configure first)` : `Go to ${p.label}`}
                  title={isLocked ? "Complete the Configure step first" : undefined}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] border-2 transition-colors shrink-0 ${
                    isPast
                      ? "bg-tv-brand-bg border-tv-brand-bg text-white"
                      : isActive
                      ? "bg-white border-tv-brand-bg text-tv-brand"
                      : "bg-white border-tv-border-light text-tv-text-decorative hover:border-tv-border-strong"
                  }`}>
                    {isPast ? <Check size={11} /> : i + 1}
                  </div>
                  <span className={`text-[11px] whitespace-nowrap hidden sm:inline transition-colors ${
                    isActive ? "text-tv-brand" : isPast ? "text-tv-brand" : "text-tv-text-decorative hover:text-tv-text-secondary"
                  }`} style={{ fontWeight: isActive ? 500 : 400 }}>
                    {p.label}

                  </span>
                </button>
                {i < MULTI_PHASES.length - 1 && (
                  <div className={`flex-1 h-px mx-1.5 min-w-[8px] ${isPast ? "bg-tv-brand-bg" : "bg-tv-border-light"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ════ CONFIGURE PHASE ════ */}
      {phase === "configure" && (
        <div className="flex-1 overflow-auto p-6 sm:p-8" onInput={markMultiDirty} onClick={markMultiDirty}>
          <ConfigureStepPanel
            campaignName={campaignName}
            onCampaignNameChange={setCampaignName}
            selectedMetrics={selectedMetrics}
            onMetricsChange={setSelectedMetrics}
            selectedTags={campaignTags}
            onTagsChange={setCampaignTags}
            markDirty={markMultiDirty}
          />
        </div>
      )}

      {/* ════ BUILDER PHASE ════ */}
      {phase === "builder" && (
        <div className="flex flex-1 overflow-hidden" onInput={markMultiDirty} onClick={markMultiDirty}>
          {/* Canvas */}
          <div ref={canvasRef} className="flex-1 overflow-auto bg-tv-surface-muted p-8 relative">
            {/* Template banner */}
            {initialTemplate && !templateBannerDismissed && (
              <div className="mb-4 max-w-[600px] xl:max-w-[700px] 2xl:max-w-[820px] mx-auto flex items-center gap-3 p-3.5 rounded-lg border border-tv-info-border bg-tv-info-bg">
                <div className="w-9 h-9 rounded-sm flex items-center justify-center shrink-0 bg-white">
                  <Bookmark size={15} className="text-tv-info" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-tv-text-primary" style={{ fontWeight: 600 }}>
                    Started from template: {initialTemplate.name}
                  </p>
                  <p className="text-[11px] text-tv-text-secondary">
                    {initialTemplate.multiSteps?.length ?? 0} steps pre-populated. Edit, add, or remove steps as needed.
                  </p>
                </div>
                <button
                  onClick={() => setTemplateBannerDismissed(true)}
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-tv-info hover:bg-tv-info-bg transition-colors"
                  aria-label="Dismiss template banner"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <div className="flex flex-col items-center min-w-[500px]">
              <div className="w-px h-4 bg-tv-border" />

              {steps.length === 0 ? (
                <div className="flex flex-col items-center">
                  <div className="border border-tv-border rounded-lg px-8 py-7 text-center relative">
                    <p className="text-[14px] text-tv-text-primary mb-3 text-center" style={{ fontWeight: 700 }}>
                      {campaignName}
                    </p>
                    <div className="relative">
                      <button onClick={() => setAddingAtIndex(0)}
                        className="px-4 py-2 border-2 border-tv-brand-bg text-tv-brand rounded-full text-[12px] hover:bg-tv-brand-tint transition-colors" style={{ fontWeight: 600 }}>
                        + Add Step
                      </button>
                      {addingAtIndex === 0 && (
                        <AddStepPopover onAdd={type => addStep(type, 0)} onClose={() => setAddingAtIndex(null)} />
                      )}
                    </div>
                    <p className="text-[12px] text-tv-text-decorative mt-2.5">Add steps to build your campaign flow</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Campaign name (read-only — edit in Configure step) */}
                  <p className="text-[14px] text-tv-text-primary mb-2 text-center" style={{ fontWeight: 700 }}>
                    {campaignName}
                  </p>
                  <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  {steps.map((step, i) => (
                    <div key={step.id} className="flex flex-col items-center group/sortable">
                      <div className="relative">
                        <AddStepButton onClick={() => setAddingAtIndex(i)} />
                        {addingAtIndex === i && (
                          <div className="absolute left-1/2 -translate-x-1/2 top-[22px] z-50">
                            <AddStepPopover onAdd={type => addStep(type, i)} onClose={() => setAddingAtIndex(null)} />
                          </div>
                        )}
                      </div>
                      <SortableStepItem id={step.id}>
                        <FlowNode step={step} selected={selectedId === step.id} onSelect={() => setSelectedId(step.id)} onDelete={() => deleteStep(step.id)} onToggleAutomation={() => updateStep({ ...step, automationEnabled: !step.automationEnabled })} />
                      </SortableStepItem>
                      {step.type === "condition" && (
                        <>
                          <Connector />
                          <div className="flex gap-10 items-start">
                            {renderBranch(step.trueBranch || [], step.id, "true")}
                            {renderBranch(step.falseBranch || [], step.id, "false")}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  </SortableContext>
                  </DndContext>
                </>
              )}

              {steps.length > 0 && (
                <div className="relative">
                  <AddStepButton onClick={() => setAddingAtIndex(steps.length)} />
                  {addingAtIndex === steps.length && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-[22px] z-50">
                      <AddStepPopover onAdd={type => addStep(type, steps.length)} onClose={() => setAddingAtIndex(null)} />
                    </div>
                  )}
                </div>
              )}

              <FlowNode
                step={{ id: "__end__", type: "exit", label: "End", description: "", automationEnabled: false, sendTimePreference: "none" }}
                selected={false} onSelect={() => {}} onDelete={() => {}}
              />
              <div className="h-16" />
            </div>

            {/* Floating live preview — shown for visual step types */}
            {selectedStep && (selectedStep.type === "email" || selectedStep.type === "sms") && (
              <FloatingPreview
                step={selectedStep}
                visible={showPreview}
                onClose={() => setShowPreview(false)}
                constraintRef={canvasRef}
              />
            )}
          </div>

          {selectedStep && (
            <StepDrawer key={selectedStep.id} step={selectedStep} onUpdate={updateStep} onClose={() => setSelectedId(null)} showPreview={showPreview} onTogglePreview={() => setShowPreview(p => !p)}
              precedingStepType={(() => { const idx = steps.findIndex(s => s.id === selectedStep.id); return idx > 0 ? steps[idx - 1].type : undefined; })()} />
          )}
        </div>
      )}

      {/* ════ CONSTITUENTS PHASE ════ */}
      {phase === "constituents" && (
        <div className="flex-1 overflow-auto" onInput={markMultiDirty} onClick={markMultiDirty}>
          <ConstituentPanel campaignChannel={steps.some(s => s.type === "sms") ? "sms" : "email"} />
        </div>
      )}

      {/* ════ SCHEDULE PHASE ════ */}
      {phase === "schedule" && (
        <div className="flex-1 overflow-auto p-6 sm:p-8" onInput={markMultiDirty} onClick={markMultiDirty}>
          <div className="max-w-[700px] xl:max-w-[800px] 2xl:max-w-[900px] mx-auto">
            {/* ── Header row ── */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-tv-text-primary" style={{ fontSize: "24px", fontWeight: 900 }}>Schedule</h2>
                <p className="text-[13px] text-tv-text-secondary mt-1">Set when your campaign should start sending.</p>
              </div>
              <button
                onClick={() => setShowSendTestModal(true)}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2 text-[12px] text-tv-brand border border-tv-brand-bg/30 rounded-full hover:bg-tv-brand-tint transition-colors" style={{ fontWeight: 600 }}
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
                    <TvTooltip label="Close"><button onClick={() => { setShowSendTestModal(false); setSendTestSending(false); }} aria-label="Close send test modal" className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-tv-surface transition-colors"><X size={14} className="text-tv-text-secondary" /></button></TvTooltip>
                  </div>
                  <div className="px-6 py-4 space-y-4">
                    <div>
                      <label className="tv-label mb-1 block">Send test to</label>
                      <input value={sendTestEmail} onChange={e => setSendTestEmail(e.target.value)}
                        placeholder="Enter email address"
                        className="w-full border border-tv-border-light rounded-sm px-3 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand" />
                      <p className="text-[10px] text-tv-text-decorative mt-1">The test will be sent to this email address.</p>
                    </div>
                    <div>
                      <label className="tv-label mb-1.5 flex items-center gap-1">
                        Preview as constituent
                        <span className="text-[8px] px-1.5 py-0.5 bg-tv-brand-tint text-tv-brand rounded-full" style={{ fontWeight: 700 }}>Merge fields</span>
                      </label>
                      <p className="text-[10px] text-tv-text-secondary mb-2">Select which constituent&rsquo;s data to use for merge field resolution.</p>
                      <div className="space-y-1.5">
                        {MSB_TEST_CONSTITUENTS.map(r => (
                          <button key={r.id} onClick={() => setSendTestPreviewAs(r.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm border text-left transition-all ${sendTestPreviewAs === r.id ? "border-tv-brand-bg bg-tv-brand-tint" : "border-tv-border-light hover:border-tv-border-strong"}`}>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${sendTestPreviewAs === r.id ? "border-tv-brand-bg bg-tv-brand-bg" : "border-tv-border-light"}`}>
                              {sendTestPreviewAs === r.id && <Check size={8} className="text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-[12px] text-tv-text-primary">{r.name}</p>
                                {r.classYear && <span className="text-[9px] text-tv-text-decorative">'{String(r.classYear).slice(-2)}</span>}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <p className="text-[10px] text-tv-text-secondary truncate">{r.email}</p>
                                {r.city && <span className="text-[9px] text-tv-text-decorative shrink-0">{r.city}</span>}
                              </div>
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
                          show(`Test sent to ${sendTestEmail} (previewing as ${MSB_TEST_CONSTITUENTS[sendTestPreviewAs].name})`, "success");
                        }, 1500);
                      }}
                      disabled={!sendTestEmail.trim() || sendTestSending}
                      className={`flex items-center gap-1.5 px-5 py-2.5 text-[13px] rounded-full transition-colors ${sendTestSending ? "bg-tv-brand-bg/70 text-white cursor-not-allowed" : "bg-tv-brand-bg text-white hover:bg-tv-brand-hover"} disabled:opacity-50`} style={{ fontWeight: 600 }}
                    >
                      {sendTestSending ? <><span className="animate-spin">&#9696;</span>Sending...</> : <><Send size={12} />Send Test</>}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Merge Field Validation ── */}
            <div className="mb-5">
              <MergeFieldValidation compact />
            </div>

            {/* ── Schedule options ── */}
            <div className="space-y-4 mb-16">
              <div className="space-y-4">
                {/* Schedule mode — compact 3-across row */}
                <div className="p-4 rounded-lg border border-tv-border-light bg-white">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={13} className="text-tv-brand" />
                    <p className="text-[12px] text-tv-text-primary" style={{ fontWeight: 700 }}>Scheduling</p>
                    {scheduleType && (
                      <span className="ml-auto text-[10px] text-tv-success bg-tv-success-bg border border-tv-success-border px-2 py-0.5 rounded-full flex items-center gap-1" style={{ fontWeight: 600 }}>
                        <Check size={8} />{scheduleType === "now" ? "Immediate" : scheduleType === "later" ? "Scheduled" : "Date Field"}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {([
                      { type: "now" as const, icon: Zap, label: "Start Now", desc: "Begin first step immediately" },
                      { type: "later" as const, icon: CalendarClock, label: "Schedule", desc: "Pick a date & time" },
                      { type: "contact-field" as const, icon: Repeat, label: "Date Field", desc: "Birthday, anniversary, etc." },
                    ]).map(card => {
                      const active = scheduleType === card.type;
                      return (
                        <button key={card.type} onClick={() => setScheduleType(card.type)}
                          className={`flex-1 min-w-0 p-3 rounded-lg border-2 transition-all flex flex-col items-center text-center gap-1.5 ${
                            active ? "border-tv-brand-bg bg-tv-brand-tint shadow-md" : "border-tv-border-light hover:border-tv-border-strong bg-white"
                          }`}>
                          <div className={`w-9 h-9 rounded-sm flex items-center justify-center shrink-0 ${active ? "bg-tv-brand-bg" : "bg-tv-surface"}`}>
                            <card.icon size={16} className={active ? "text-white" : "text-tv-text-secondary"} />
                          </div>
                          <p className={`text-[12px] ${active ? "text-tv-brand" : "text-tv-text-primary"}`} style={{ fontWeight: 600 }}>{card.label}</p>
                          <p className="text-[10px] text-tv-text-secondary leading-tight">{card.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Expanded config panels */}
                {scheduleType === "later" && (
                  <div className="p-4 rounded-lg border border-tv-brand-bg/20 bg-tv-brand-tint/30 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="tv-label mb-1 block">Date</label>
                        <input type="date" value={scheduledDate} min={today} onChange={e => setScheduledDate(e.target.value)} aria-label="Scheduled date"
                          className="w-full border border-tv-border-light rounded-sm px-3 py-2 text-[12px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand bg-white" />
                      </div>
                      <div>
                        <label className="tv-label mb-1 block">Time</label>
                        <input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} aria-label="Scheduled time"
                          className="w-full border border-tv-border-light rounded-sm px-3 py-2 text-[12px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand bg-white" />
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
                    <label className="tv-label block">Select Date Field</label>
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
                            <p className="text-[11px] truncate" style={{ fontWeight: selected ? 600 : 400 }}>{f.label}</p>
                            {selected && <Check size={10} className="text-tv-brand shrink-0 ml-auto" />}
                          </button>
                        );
                      })}
                    </div>
                    {contactDateField && (
                      <AutomationConfigPanel
                        contactDateField={contactDateField}
                        fieldLabel={CONSTITUENT_DATE_FIELDS.find(c => c.id === contactDateField)?.label ?? "Date"}
                        fieldDesc={CONSTITUENT_DATE_FIELDS.find(c => c.id === contactDateField)?.desc ?? ""}
                        daysBefore={daysBefore}
                        setDaysBefore={setDaysBefore}
                        contactFieldSendTime={contactFieldSendTime}
                        setContactFieldSendTime={setContactFieldSendTime}
                        recurAnnually={recurAnnually}
                        setRecurAnnually={setRecurAnnually}
                        leapYearHandling={leapYearHandling}
                        setLeapYearHandling={setLeapYearHandling}
                      />
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
                  <label className="tv-label shrink-0">Timezone</label>
                  <select aria-label="Timezone" className="flex-1 border border-tv-border-light rounded-[8px] px-2.5 py-1.5 text-[11px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand bg-white appearance-none pr-7 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_8px_center] bg-no-repeat cursor-pointer">
                    <option>(UTC-05:00) Eastern Time (US &amp; Canada)</option>
                    <option>(UTC-06:00) Central Time (US &amp; Canada)</option>
                    <option>(UTC-07:00) Mountain Time (US &amp; Canada)</option>
                    <option>(UTC-08:00) Pacific Time (US &amp; Canada)</option>
                    <option>(UTC+00:00) UTC</option>
                    <option>(UTC+01:00) Central European Time</option>
                  </select>
                </div>
              </div>

              {/* Campaign Summary */}
              <div className="p-4 rounded-lg border border-tv-border-light bg-white space-y-1.5">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 size={13} className="text-tv-text-secondary" />
                    <p className="text-[12px] text-tv-text-primary" style={{ fontWeight: 700 }}>Summary</p>
                  </div>
                  {[
                    { label: "Steps", value: `${steps.length} total`, ok: steps.length > 0 },
                    { label: "Email / SMS", value: `${stepCounts.email || 0} / ${stepCounts.sms || 0}`, ok: (stepCounts.email || 0) + (stepCounts.sms || 0) > 0 },
                    { label: "Constituents", value: "250 constituents", ok: true },
                    { label: "Start", value: scheduleType ? (scheduleType === "now" ? "Immediately" : scheduleType === "later" && scheduledDate ? scheduledDate : scheduleType === "contact-field" && contactDateField ? `By ${CONSTITUENT_DATE_FIELDS.find(c => c.id === contactDateField)?.label ?? "date field"}${daysBefore > 0 ? ` (${daysBefore}d before)` : ""}` : "Not set") : "Not set", ok: !!scheduleType },
                    { label: "Metrics", value: selectedMetrics.length > 0 ? `${selectedMetrics.length} selected` : "None", ok: selectedMetrics.length > 0 },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-tv-border-divider last:border-b-0">
                      <span className="text-[10px] text-tv-text-secondary flex items-center gap-1.5">
                        {row.ok ? <Check size={9} className="text-tv-success" /> : <div className="w-[9px] h-[9px] rounded-full border border-tv-border-light" />}
                        {row.label}
                      </span>
                      <span className={`text-[10px] ${row.ok ? "text-tv-text-primary" : "text-tv-text-decorative"}`} style={{ fontWeight: 600 }}>{row.value}</span>
                    </div>
                  ))}
                </div>
            </div>
          </div>
        </div>
      )}

      {/* ════ REVIEW PHASE ════ */}
      {phase === "review" && (
        <div className="flex-1 overflow-auto p-6 sm:p-8">
          <div className="max-w-[640px] xl:max-w-[740px] 2xl:max-w-[860px] mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-tv-text-primary mb-1" style={{ fontSize: "24px", fontWeight: 900 }}>Review &amp; Activate</h2>
                <p className="text-[13px] text-tv-text-secondary">Review your campaign settings before activating.</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button onClick={handleSave}
                  className="px-5 py-2.5 text-[13px] text-tv-text-secondary border border-tv-border-light rounded-full hover:bg-tv-surface transition-colors" style={{ fontWeight: 500 }}>
                  Save as Draft
                </button>
                <button onClick={() => {
                    if (steps.length === 0) { show("Add at least one step to your campaign", "error"); return; }
                    if (!isScheduleValid) { show("Please configure a schedule before activating", "error"); return; }
                    setSendState("sending");
                  }}
                  disabled={sendState === "sending"}
                  className="px-5 py-2.5 text-[13px] text-white bg-tv-brand-bg rounded-full hover:bg-tv-brand-hover transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" style={{ fontWeight: 600 }}>
                  {sendState === "sending" ? (
                    <><Loader2 size={14} className="animate-spin" />Activating…</>
                  ) : (
                    <><Play size={13} fill="white" />Activate Campaign</>
                  )}
                </button>
              </div>
            </div>

            <div className="p-5 rounded-lg border border-tv-border-light bg-white space-y-4 mb-5">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-md bg-tv-brand-tint flex items-center justify-center">
                  <GitBranch size={18} className="text-tv-brand" />
                </div>
                <div>
                  <p className="text-[14px] text-tv-text-primary" style={{ fontWeight: 700 }}>{campaignName}</p>
                  <p className="text-[11px] text-tv-text-secondary">Multi-step campaign</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Mail, label: "Email Steps", value: String(stepCounts.email || 0), color: "text-tv-brand" },
                  { icon: MessageSquare, label: "SMS Steps", value: String(stepCounts.sms || 0), color: "text-tv-info" },
                  { icon: GitBranch, label: "Conditions", value: String(stepCounts.condition || 0), color: "text-tv-brand" },
                ].map(card => (
                  <div key={card.label} className="p-3 rounded-md bg-tv-surface text-center">
                    <card.icon size={16} className={`${card.color} mx-auto mb-1`} />
                    <p className="text-[16px] text-tv-text-primary" style={{ fontWeight: 700 }}>{card.value}</p>
                    <p className="text-[10px] text-tv-text-secondary">{card.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-lg border border-tv-border-light bg-white space-y-3 mb-5">
              {[
                { icon: Users, label: "Constituents", value: "250 constituents", status: "ok" as const },
                { icon: Calendar, label: "Schedule", value: scheduleLabel, status: (isScheduleValid ? "ok" : "warn") as const },
                { icon: Timer, label: "Wait Steps", value: `${stepCounts.wait || 0}`, status: "ok" as const },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-2 border-b border-tv-border-divider last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-sm bg-tv-surface flex items-center justify-center">
                      <row.icon size={14} className="text-tv-text-secondary" />
                    </div>
                    <span className="text-[13px] text-tv-text-secondary">{row.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-tv-text-primary" style={{ fontWeight: 600 }}>{row.value}</span>
                    {row.status === "ok" ? (
                      <div className="w-5 h-5 rounded-full bg-tv-success-bg flex items-center justify-center"><Check size={11} className="text-tv-success" /></div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-tv-warning-bg flex items-center justify-center"><TriangleAlert size={11} className="text-tv-warning" /></div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Merge Field Validation */}
            <div className="mb-5">
              <MergeFieldValidation />
            </div>

            {steps.length === 0 && (
              <div className="flex items-start gap-3 p-4 bg-tv-warning-bg border border-tv-warning-border rounded-lg mb-5">
                <TriangleAlert size={15} className="text-tv-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-[12px] text-tv-warning-hover" style={{ fontWeight: 600 }}>No Steps Added</p>
                  <p className="text-[11px] text-tv-warning mt-0.5">Your campaign has no steps. Go back to the Builder to add at least one step.</p>
                </div>
              </div>
            )}

            {selectedMetrics.length === 0 && (
              <div className="flex items-start gap-3 p-4 bg-tv-warning-bg border border-tv-warning-border rounded-lg mb-5">
                <TriangleAlert size={15} className="text-tv-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-[12px] text-tv-warning-hover" style={{ fontWeight: 600 }}>No Success Metrics</p>
                  <p className="text-[11px] text-tv-warning mt-0.5">Go back to the Configure step to select at least 1 success metric.</p>
                </div>
              </div>
            )}

            {!isScheduleValid && (
              <div className="flex items-start gap-3 p-4 bg-tv-warning-bg border border-tv-warning-border rounded-lg mb-5">
                <TriangleAlert size={15} className="text-tv-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-[12px] text-tv-warning-hover" style={{ fontWeight: 600 }}>Send Not Scheduled</p>
                  <p className="text-[11px] text-tv-warning mt-0.5">Go back to the Schedule step to set your send schedule.</p>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── Bottom navigation (matches single-step wizard) — hidden on Review ── */}
      {phase !== "review" && (
        <div className="sticky bottom-0 bg-white border-t border-tv-border-divider px-4 sm:px-6 py-3 shrink-0 z-10">
          <div className="flex items-center gap-3">
            {/* LEFT: Previous Step / Back */}
            <button onClick={goBack}
              className="flex items-center gap-1.5 px-4 py-2 text-[13px] border rounded-full transition-colors shrink-0 text-tv-text-primary border-tv-border-light hover:bg-tv-surface">
              <ChevronLeft size={13} />
              <span className="hidden sm:inline">{phaseIdx === 0 ? "Change Mode" : "Previous Step"}</span>
            </button>
            <button onClick={() => { setSaveTemplateName(campaignName || ""); setSaveTemplateDesc(""); setShowSaveTemplate(true); }}
              className="flex items-center gap-1.5 px-4 py-2 text-[13px] text-tv-text-secondary border border-tv-border-light rounded-full hover:bg-tv-surface hover:text-tv-text-primary transition-colors shrink-0"
              title="Save current configuration as a reusable template">
              <Bookmark size={13} /><span className="hidden sm:inline">Save as Template</span>
            </button>

            {/* CENTER: spacer */}
            <div className="flex-1" />

            {/* RIGHT: Forward action */}
            <div className="relative group shrink-0">
              <button onClick={() => { if (canAdvancePhase) goNext(); }} disabled={!canAdvancePhase}
                className={`flex items-center gap-1.5 px-6 py-2.5 text-[13px] rounded-full transition-colors ${
                  canAdvancePhase ? "text-white bg-tv-brand-bg hover:bg-tv-brand-hover" : "text-white/60 bg-tv-brand-bg/40 cursor-not-allowed"
                }`} style={{ fontWeight: 600 }}>
                {nextStepLabel}<ChevronRight size={13} />
              </button>
              {!canAdvancePhase && advanceBlockReason && (
                <div className="absolute bottom-full mb-2 right-0 w-56 p-2.5 bg-[#1e293b] text-white text-[11px] rounded-sm shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 leading-relaxed">
                  {advanceBlockReason}
                  <div className="absolute -bottom-1 right-6 w-2 h-2 bg-[#1e293b] rotate-45" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Creation modals — only condition still uses a modal ── */}
      <AnimatePresence>
        {creatingStep && creatingStep.step.type === "condition" && (
          <ConditionCreationModal key={creatingStep.step.id} step={creatingStep.step} onSave={handleCreationSave} onCancel={() => setCreatingStep(null)} />
        )}
      </AnimatePresence>

      {/* Save changes confirmation — breadcrumb phase jump */}
      {pendingMultiPhase !== null && (
        <SaveChangesModal
          fromStep={MULTI_PHASES[phaseIdx]?.label}
          toStep={MULTI_PHASES.find(p => p.id === pendingMultiPhase)?.label}
          onSaveAndContinue={confirmMultiSave}
          onDiscard={confirmMultiDiscard}
          onStay={cancelMultiNav}
        />
      )}

      {/* Change Mode confirmation overlay */}
      {showModeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl border border-tv-border-light shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-tv-text-primary mb-2">Change campaign mode?</h3>
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
                Change Mode
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Save as Template modal ── */}
      {showSaveTemplate && (
        <FocusTrap active>
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center" onClick={() => setShowSaveTemplate(false)} role="dialog" aria-modal="true" aria-labelledby="ms-save-template-title">
          <div className="bg-white rounded-xl border border-tv-border-light shadow-xl w-full max-w-[460px] mx-4" onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4 border-b border-tv-border-divider">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0 bg-tv-star-bg">
                  <Bookmark size={18} className="text-tv-warning" />
                </div>
                <div>
                  <h3 id="ms-save-template-title" className="text-tv-text-primary" style={{ fontSize: "16px", fontWeight: 700 }}>Save as Template</h3>
                  <p className="text-[12px] text-tv-text-secondary">Save this multi-step campaign as a reusable template.</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-[12px] text-tv-text-label mb-1.5 block" style={{ fontWeight: 600 }}>Template Name</label>
                <input
                  type="text"
                  autoComplete="off"
                  value={saveTemplateName}
                  onChange={e => setSaveTemplateName(e.target.value)}
                  placeholder="e.g. Annual Fund Drip Sequence"
                  className={INPUT_CLS}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[12px] text-tv-text-label mb-1.5 block" style={{ fontWeight: 600 }}>Description <span className="text-tv-text-decorative">(optional)</span></label>
                <textarea
                  value={saveTemplateDesc}
                  onChange={e => setSaveTemplateDesc(e.target.value)}
                  placeholder="Brief description of this template…"
                  rows={3}
                  className={TEXTAREA_CLS}
                />
              </div>
              <div className="p-3 bg-tv-surface rounded-md border border-tv-border-divider">
                <p className="text-[10px] text-tv-text-label uppercase tracking-wider mb-2" style={{ fontWeight: 600 }}>Configuration to save</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <span className="text-[11px] text-tv-text-secondary">Mode:</span>
                  <span className="text-[11px] text-tv-text-primary" style={{ fontWeight: 500 }}>Multi-Step</span>
                  <span className="text-[11px] text-tv-text-secondary">Steps:</span>
                  <span className="text-[11px] text-tv-text-primary" style={{ fontWeight: 500 }}>
                    {steps.length} step{steps.length !== 1 ? "s" : ""} ({steps.filter(s => s.type === "email").length} email, {steps.filter(s => s.type === "sms").length} SMS, {steps.filter(s => s.type === "wait").length} wait, {steps.filter(s => s.type === "condition").length} condition)
                  </span>
                  {steps.find(s => s.subject) && <>
                    <span className="text-[11px] text-tv-text-secondary">First subject:</span>
                    <span className="text-[11px] text-tv-text-primary truncate" style={{ fontWeight: 500 }}>{steps.find(s => s.subject)?.subject}</span>
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
                  // Flatten steps into TemplateStepContent array
                  const flatSteps: TemplateStepContent[] = [];
                  const flatten = (arr: FlowStep[]) => {
                    for (const s of arr) {
                      flatSteps.push({
                        type: s.type as "email" | "sms" | "wait" | "condition",
                        label: s.label,
                        subject: s.subject,
                        body: s.body,
                        senderName: s.senderName,
                        senderEmail: s.senderEmail,
                        replyTo: s.replyTo,
                        font: s.font,
                        smsBody: s.smsBody,
                        waitDays: s.waitDays,
                        conditionField: s.conditionField,
                        landingPageEnabled: s.landingPageEnabled,
                        ctaText: s.ctaText,
                        ctaUrl: s.ctaUrl,
                      });
                      if (s.type === "condition") {
                        if (s.trueBranch?.[0]) flatten(s.trueBranch);
                        if (s.falseBranch?.[0]) flatten(s.falseBranch);
                      }
                    }
                  };
                  flatten(steps);
                  const firstEmail = flatSteps.find(s => s.type === "email");
                  addTemplate({
                    name: saveTemplateName.trim(),
                    description: saveTemplateDesc.trim(),
                    mode: "multi",
                    goal: null,
                    channel: firstEmail ? "email" : "sms",
                    tags: [],
                    stepContent: firstEmail || flatSteps[0] || { type: "email", label: "Email" },
                    multiSteps: flatSteps,
                  });
                  setShowSaveTemplate(false);
                  show(`Template "${saveTemplateName.trim()}" saved`, "success");
                }}
                className={`flex items-center gap-1.5 px-5 py-2 text-[13px] rounded-full transition-colors ${
                  saveTemplateName.trim()
                    ? "text-white bg-tv-brand-bg hover:bg-tv-brand-hover"
                    : "text-white/60 bg-tv-brand-bg/40 cursor-not-allowed"
                }`} style={{ fontWeight: 600 }}>
                <Bookmark size={13} />Save Template
              </button>
            </div>
          </div>
        </div>
        </FocusTrap>
      )}
    </div>
  );
}
