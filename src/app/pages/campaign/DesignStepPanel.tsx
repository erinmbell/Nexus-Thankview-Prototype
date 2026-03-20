/**
 * DesignStepPanel — Shared design-step UI for both single-step wizard and
 * multi-step builder email creation modal.
 *
 * Layout: Icon tab rail (left) + scrollable tab content (center) + pinned preview (right).
 * Tab order mirrors the original ThankView flow:
 *   1. Landing Page — page picker, info, search, grid
 *   2. Envelope    — envelope picker (info, search, sections) → envelope appearance
 *   3. Content     — attachments, link/button, description, action toggles
 *   4. Tracking    — tracking pixel URL
 *
 * The live preview on the right stays pinned regardless of left-panel scroll.
 */
import { useState, useCallback, useEffect } from "react";
import { useToast } from "../../contexts/ToastContext";
import { LivePreviewModal } from "../../components/LivePreviewModal";
import { Toggle } from "../../components/ui/Toggle";
import { TV } from "../../theme";
import { INPUT_CLS_WHITE } from "./styles";
import { type EnvelopeDesign, type LandingPageDef } from "./types";
import { PillSearchInput } from "../../components/PillSearchInput";
import { CtaButtonControls } from "../../components/CtaButtonControls";
import {
  ChevronDown, Check,
  Link2, Mail, Pencil, Type, Smile,
  Monitor, Tablet, Smartphone, Download, Reply, Play,
  Image as ImageIcon, Code2, ToggleRight, LayoutGrid,
  Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  ExternalLink, FileText, FormInput, Info, Trash2,
  Sparkles, Film, Upload, Replace, X, Users, AlertTriangle, Maximize2,
} from "lucide-react";
import { TvTooltip } from "../../components/TvTooltip";

// ── Types ────────────────────────────────────────────────────────────────────
type DesignTab = "page" | "envelope" | "content" | "tracking";
type Viewport = "desktop" | "tablet" | "mobile";
type EmailContentType = "animated-thumbnail" | "envelope" | "static-image";
type AnimatedStyle = "gif" | "illustration";

// EnvelopeDesign imported from ./types
// LandingPageDef imported from ./types (aliased as LandingPage below for prop compat)
type LandingPage = LandingPageDef;

export interface DesignStepPanelProps {
  /** When true, renders as collapsible sections instead of tabbed layout (no preview column) */
  inline?: boolean;

  /* ── Landing page ─────────────────────────────────────────── */
  lpSearch: string;
  onLpSearchChange: (v: string) => void;
  lpSectionOpen: boolean;
  onLpSectionToggle: () => void;
  filteredLandingPages: LandingPage[];
  selectedLandingPageId: number | undefined;
  onSelectLandingPage: (id: number) => void;
  onNavigateToBuilder?: (path: string) => void;

  /* ── Envelope picker ────────────���─────────────────────────── */
  envelopeSearch: string;
  onEnvelopeSearchChange: (v: string) => void;
  envSectionOpen: Record<string, boolean>;
  onEnvSectionToggle: (key: string) => void;
  filteredEnvelopes: (cat: string) => EnvelopeDesign[];
  selectedEnvelopeId: number | undefined;
  onSelectEnvelope: (id: number) => void;

  /* ── Envelope appearance ─────────────────────────────────── */
  envTextBefore: string;
  onEnvTextBeforeChange: (v: string) => void;
  envLineBreakBefore: boolean;
  onEnvLineBreakBeforeChange: (v: boolean) => void;
  envNameFormat: string;
  onEnvNameFormatChange: (v: string) => void;
  envLineBreakAfter: boolean;
  onEnvLineBreakAfterChange: (v: boolean) => void;
  envTextAfter: string;
  onEnvTextAfterChange: (v: string) => void;

  /* ── Page content / interactions ──────────────── */
  attachmentType: "button" | "pdf" | "form";
  onAttachmentTypeChange: (v: "button" | "pdf" | "form") => void;
  step: {
    allowVideoReply?: boolean;
    allowEmailReply?: boolean;
    allowSaveButton?: boolean;
    allowShareButton?: boolean;
    allowDownloadVideo?: boolean;
    closedCaptionsEnabled?: boolean;
    btnBg?: string;
    btnText?: string;
    ctaUrl?: string;
    ctaText?: string;
  };
  onToggle: (key: "allowVideoReply" | "allowEmailReply" | "allowSaveButton" | "allowShareButton" | "allowDownloadVideo" | "closedCaptionsEnabled") => void;

  /* ── CTA button appearance callbacks ──────────────────── */
  onCtaTextChange?: (v: string) => void;
  onBtnBgChange?: (v: string) => void;
  onBtnTextChange?: (v: string) => void;

  /* ── Optional extended content fields (local fallback if absent) ── */
  linkTo?: string;
  onLinkToChange?: (v: string) => void;
  buttonText?: string;
  onButtonTextChange?: (v: string) => void;
  description?: string;
  onDescriptionChange?: (v: string) => void;

  /* ── Tracking pixel ───────────────────────────────────────── */
  trackingPixel: string;
  onTrackingPixelChange: (v: string) => void;

  /* ── Preview ──────────────────────────────────────────────── */
  previewViewport: Viewport;
  onPreviewViewportChange: (v: Viewport) => void;

  /* ── Resolved design data for live preview ─────────────────── */
  selectedEnvelopeData?: { color: string; accent: string; name: string; nameColor?: string; holidayType?: string };
  selectedLandingPageData?: { color: string; accent: string; name: string; image?: string };

  /** Callback fired whenever local design data changes — lets parent sync the live preview */
  onDesignDataChange?: (data: DesignSnapshot) => void;
}

export interface DesignSnapshot {
  pdfFileName?: string;
  pdfPages?: number;
  pdfSize?: string;
  formUrl?: string;
  formHeight?: number;
  formFullWidth?: boolean;
}

// ── Tab & viewport definitions ──────────────────────────────────────────────
const TABS: { id: DesignTab; label: string; icon: any }[] = [
  { id: "page",     label: "Page",     icon: LayoutGrid },
  { id: "envelope", label: "Envelope", icon: Mail },
  { id: "content",  label: "Content",  icon: ToggleRight },
  { id: "tracking", label: "Tracking", icon: Code2 },
];

const VIEWPORTS: { key: Viewport; icon: any; label: string }[] = [
  { key: "desktop", icon: Monitor,    label: "Desktop" },
  { key: "tablet",  icon: Tablet,     label: "Tablet" },
  { key: "mobile",  icon: Smartphone, label: "Mobile" },
];

const TAB_META: Record<DesignTab, { title: string; subtitle: string }> = {
  page:     { title: "Landing Page Appearance", subtitle: "Set page design that will appear in the background of your ThankView." },
  envelope: { title: "Choose an Envelope",      subtitle: "Choose or create a branded envelope to greet constituents when they first open up their ThankView." },
  content:  { title: "Email & Page Content",     subtitle: "Choose what appears in the email and drive constituents to take action." },
  tracking: { title: "Tracking Pixel",          subtitle: "An optional way to gather data for your own online marketing, analytics, or email marketing." },
};

const DESCRIPTION_MAX = 5000;
const BUTTON_TEXT_MAX = 50;

/** Paper/linen texture overlay — subtle SVG noise as a data-URL background */
export const PAPER_TEXTURE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`;

/* ── Shared sub-components ────────────────────────────────────────────────── */

/** Standard input matching the app's `rounded-md px-3 py-2.5 text-[13px]` pattern */
const inputCls = "w-full border border-tv-border-light rounded-md px-3 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand bg-white";

/** Standardised section label */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] text-tv-text-label uppercase tracking-wider mb-1.5 block" style={{ fontWeight: 600 }}>{children}</label>;
}

/* Toggle imported from ../../components/ui/Toggle */

/** Perforated stamp — matches ThankView's zigzag-edged postage stamp with play button */
export function PerforatedStamp({ size = 48, accentColor = "#c09696" }: { size?: number; accentColor?: string }) {
  const notchR = size * 0.04;
  const notchCount = Math.round(size / (notchR * 3.2));

  // Build scalloped path
  const buildEdge = (x1: number, y1: number, x2: number, y2: number, count: number) => {
    const segs: string[] = [];
    for (let i = 0; i < count; i++) {
      const t1 = i / count;
      const t2 = (i + 0.5) / count;
      const t3 = (i + 1) / count;
      const mx = x1 + (x2 - x1) * t2;
      const my = y1 + (y2 - y1) * t2;
      const ex = x1 + (x2 - x1) * t3;
      const ey = y1 + (y2 - y1) * t3;
      // perpendicular direction
      const dx = x2 - x1, dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = -dy / len * notchR * 1.2, ny = dx / len * notchR * 1.2;
      segs.push(`Q ${mx + nx} ${my + ny} ${ex} ${ey}`);
    }
    return segs.join(" ");
  };

  const m = notchR * 2;
  const s = size;
  const path = [
    `M ${m} ${m}`,
    buildEdge(m, m, s - m, m, notchCount),       // top
    buildEdge(s - m, m, s - m, s - m, notchCount), // right
    buildEdge(s - m, s - m, m, s - m, notchCount), // bottom
    buildEdge(m, s - m, m, m, notchCount),         // left
    "Z",
  ].join(" ");

  const playSize = size * 0.32;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <path d={path} fill={`${accentColor}40`} stroke={accentColor} strokeWidth={0.8} />
      {/* Play circle */}
      <circle cx={cx} cy={cy} r={playSize * 0.58} fill="none" stroke={accentColor} strokeWidth={1.2} />
      {/* Play triangle */}
      <polygon
        points={`${cx - playSize * 0.18},${cy - playSize * 0.28} ${cx - playSize * 0.18},${cy + playSize * 0.28} ${cx + playSize * 0.28},${cy}`}
        fill={accentColor}
      />
    </svg>
  );
}

/** Cute holiday-themed SVG decorations for envelope thumbnails & preview */
export function HolidayGraphic({ type, size = 48, color }: { type: string; size?: number; color: string }) {
  const s = size;
  switch (type) {
    case "winter":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
          <g stroke={color} strokeWidth={1.2} strokeLinecap="round" opacity={0.7}>
            <line x1="24" y1="8" x2="24" y2="40" />
            <line x1="10.1" y1="16" x2="37.9" y2="32" />
            <line x1="10.1" y1="32" x2="37.9" y2="16" />
            <line x1="24" y1="12" x2="20" y2="9" /><line x1="24" y1="12" x2="28" y2="9" />
            <line x1="24" y1="36" x2="20" y2="39" /><line x1="24" y1="36" x2="28" y2="39" />
          </g>
          <g stroke={color} strokeWidth={0.8} strokeLinecap="round" opacity={0.4}>
            <line x1="38" y1="6" x2="38" y2="14" /><line x1="34" y1="10" x2="42" y2="10" />
            <line x1="35.2" y1="7.2" x2="40.8" y2="12.8" /><line x1="40.8" y1="7.2" x2="35.2" y2="12.8" />
          </g>
          <circle cx="8" cy="10" r="1.2" fill={color} opacity={0.3} />
          <circle cx="14" cy="38" r="1" fill={color} opacity={0.25} />
          <circle cx="42" cy="36" r="0.8" fill={color} opacity={0.2} />
        </svg>
      );

    case "christmas":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="26" r="10" fill={`${color}25`} stroke={color} strokeWidth={1.2} opacity={0.7} />
          <rect x="22" y="15" width="4" height="3" rx="1" fill={color} opacity={0.6} />
          <path d="M19 22 Q21 20 23 22" stroke={color} strokeWidth={0.8} fill="none" opacity={0.4} />
          <path d="M34 12 Q38 8 42 12 Q38 10 34 12Z" fill={color} opacity={0.35} />
          <path d="M36 10 Q40 6 44 10 Q40 8 36 10Z" fill={color} opacity={0.25} />
          <circle cx="36" cy="13" r="1.5" fill={color} opacity={0.5} />
          <circle cx="38.5" cy="11.5" r="1.3" fill={color} opacity={0.4} />
          <g transform="translate(8,8)" opacity={0.35}>
            <line x1="0" y1="3" x2="6" y2="3" stroke={color} strokeWidth={0.8} />
            <line x1="3" y1="0" x2="3" y2="6" stroke={color} strokeWidth={0.8} />
          </g>
        </svg>
      );

    case "greetings":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
          <path d="M24 8 L30 20 L27 20 L32 30 L28 30 L34 40 L14 40 L20 30 L16 30 L21 20 L18 20Z"
            fill={`${color}20`} stroke={color} strokeWidth={1} strokeLinejoin="round" opacity={0.6} />
          <rect x="22" y="40" width="4" height="4" rx="0.5" fill={color} opacity={0.4} />
          <circle cx="24" cy="6" r="1.5" fill={color} opacity={0.5} />
          <g transform="translate(38,14)" opacity={0.3}>
            <line x1="0" y1="2.5" x2="5" y2="2.5" stroke={color} strokeWidth={0.8} />
            <line x1="2.5" y1="0" x2="2.5" y2="5" stroke={color} strokeWidth={0.8} />
          </g>
          <circle cx="6" cy="20" r="1" fill={color} opacity={0.25} />
        </svg>
      );

    case "thanksgiving":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
          <path d="M16 28 Q12 20 16 14 Q18 18 20 14 Q22 18 24 14 Q26 18 28 14 Q32 20 28 28Z"
            fill={`${color}25`} stroke={color} strokeWidth={1} strokeLinejoin="round" opacity={0.6} />
          <line x1="22" y1="28" x2="22" y2="36" stroke={color} strokeWidth={1} opacity={0.4} />
          <ellipse cx="38" cy="30" rx="4" ry="5" fill={`${color}20`} stroke={color} strokeWidth={0.8} opacity={0.5} />
          <path d="M34 28 Q38 25 42 28" fill={color} opacity={0.35} />
          <line x1="38" y1="25" x2="38" y2="22" stroke={color} strokeWidth={0.8} opacity={0.3} />
          <ellipse cx="8" cy="12" rx="2.5" ry="1.5" fill={color} opacity={0.2} transform="rotate(-30 8 12)" />
          <ellipse cx="40" cy="10" rx="2" ry="1.2" fill={color} opacity={0.15} transform="rotate(20 40 10)" />
        </svg>
      );

    case "spring":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
          <g transform="translate(20,20)" opacity={0.6}>
            {[0, 60, 120, 180, 240, 300].map((angle) => (
              <ellipse key={angle} cx="0" cy="-6" rx="3" ry="5"
                fill={`${color}30`} stroke={color} strokeWidth={0.8}
                transform={`rotate(${angle})`} />
            ))}
            <circle cx="0" cy="0" r="2.5" fill={color} opacity={0.5} />
          </g>
          <g transform="translate(36,10)" opacity={0.4}>
            <ellipse cx="-3" cy="-2" rx="3.5" ry="2.5" fill={`${color}30`} stroke={color} strokeWidth={0.7} transform="rotate(-20)" />
            <ellipse cx="3" cy="-2" rx="3.5" ry="2.5" fill={`${color}30`} stroke={color} strokeWidth={0.7} transform="rotate(20)" />
            <line x1="0" y1="-1" x2="0" y2="3" stroke={color} strokeWidth={0.6} />
          </g>
          <path d="M20 30 Q18 36 20 42" stroke={color} strokeWidth={0.8} fill="none" opacity={0.35} />
          <ellipse cx="17" cy="36" rx="3" ry="1.5" fill={color} opacity={0.2} transform="rotate(-30 17 36)" />
          <circle cx="8" cy="16" r="1" fill={color} opacity={0.2} />
          <circle cx="42" cy="38" r="0.8" fill={color} opacity={0.15} />
        </svg>
      );

    case "eid-fitr":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
          <path d="M18 10 A12 12 0 1 0 18 38 A9 9 0 1 1 18 10Z"
            fill={`${color}25`} stroke={color} strokeWidth={1.2} opacity={0.65} />
          <g transform="translate(34,12)" opacity={0.6}>
            <polygon points="0,-5 1.5,-1.5 5.5,-1.5 2.5,1 3.5,5 0,2.5 -3.5,5 -2.5,1 -5.5,-1.5 -1.5,-1.5"
              fill={color} opacity={0.5} />
          </g>
          <g transform="translate(8,6)" opacity={0.4}>
            <line x1="4" y1="0" x2="4" y2="3" stroke={color} strokeWidth={0.8} />
            <rect x="1" y="3" width="6" height="2" rx="0.5" fill={color} opacity={0.5} />
            <path d="M1 5 Q0 9 1.5 13 L6.5 13 Q8 9 7 5Z" fill={`${color}30`} stroke={color} strokeWidth={0.8} />
            <rect x="1.5" y="13" width="5" height="1.5" rx="0.5" fill={color} opacity={0.5} />
          </g>
          <circle cx="40" cy="30" r="1" fill={color} opacity={0.3} />
          <circle cx="36" cy="36" r="0.7" fill={color} opacity={0.2} />
          <circle cx="30" cy="8" r="0.8" fill={color} opacity={0.25} />
        </svg>
      );

    case "eid-adha":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
          <g opacity={0.5}>
            <path d="M14 40 L14 28 Q14 20 24 16 Q34 20 34 28 L34 40Z"
              fill={`${color}20`} stroke={color} strokeWidth={1} />
            <rect x="8" y="24" width="3" height="16" rx="0.5" fill={`${color}15`} stroke={color} strokeWidth={0.7} />
            <circle cx="9.5" cy="23" r="2" fill={`${color}20`} stroke={color} strokeWidth={0.7} />
            <line x1="9.5" y1="21" x2="9.5" y2="18" stroke={color} strokeWidth={0.7} />
            <rect x="37" y="24" width="3" height="16" rx="0.5" fill={`${color}15`} stroke={color} strokeWidth={0.7} />
            <circle cx="38.5" cy="23" r="2" fill={`${color}20`} stroke={color} strokeWidth={0.7} />
            <line x1="38.5" y1="21" x2="38.5" y2="18" stroke={color} strokeWidth={0.7} />
            <path d="M20 40 L20 33 Q20 29 24 29 Q28 29 28 33 L28 40" fill={`${color}15`} stroke={color} strokeWidth={0.7} />
          </g>
          <g transform="translate(22,6)" opacity={0.55}>
            <path d="M2 0 A3.5 3.5 0 1 0 2 8 A2.8 2.8 0 1 1 2 0Z" fill={color} opacity={0.5} />
            <circle cx="6" cy="2" r="1" fill={color} opacity={0.4} />
          </g>
          <g opacity={0.2}>
            <circle cx="6" cy="10" r="1" fill={color} />
            <circle cx="42" cy="8" r="0.8" fill={color} />
            <circle cx="4" cy="36" r="0.6" fill={color} />
          </g>
        </svg>
      );

    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Main component
// ═══════════════════════════════════════════════════════════════════════════════
export function DesignStepPanel(props: DesignStepPanelProps) {
  const [activeTab, setActiveTab] = useState<DesignTab>("page");
  const [livePreviewOpen, setLivePreviewOpen] = useState(false);

  // Derive LivePreviewModal props from selected envelope data
  const envData = props.selectedEnvelopeData;
  const envColor = envData?.color || "#7c45b0";
  const envAccent = envData?.accent || "#a78bfa";

  // Local state for fields that may not be controlled by parent
  const [localLinkTo, setLocalLinkTo] = useState(props.step.ctaUrl || "https://alumni.exampleuniv.edu");
  const [localButtonText, setLocalButtonText] = useState(props.step.ctaText || "Make a Gift");
  const [localDescription, setLocalDescription] = useState("Add a warm and fuzzy message to your constituents to let them know how much you appreciate them.");
  const [descBold, setDescBold] = useState(false);
  const [descItalic, setDescItalic] = useState(false);
  const [descUnderline, setDescUnderline] = useState(false);
  const [emailContentType, setEmailContentType] = useState<EmailContentType>("static-image");
  const [animatedStyle, setAnimatedStyle] = useState<AnimatedStyle>("gif");
  const [staticImageFile, setStaticImageFile] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<{ name: string; pages: number; size: string } | null>(null);
  const [pdfAllowDownload, setPdfAllowDownload] = useState(true);
  const [pdfShareWithConstituents, setPdfShareWithConstituents] = useState(true);
  const [formEmbedUrl, setFormEmbedUrl] = useState("");
  const [formHeight, setFormHeight] = useState(600);
  const [formFullWidth, setFormFullWidth] = useState(false);

  // Fire design data callback whenever PDF/form state changes — gated by attachment type
  useEffect(() => {
    props.onDesignDataChange?.({
      pdfFileName: props.attachmentType === "pdf" ? pdfFile?.name : undefined,
      pdfPages: props.attachmentType === "pdf" ? pdfFile?.pages : undefined,
      pdfSize: props.attachmentType === "pdf" ? pdfFile?.size : undefined,
      formUrl: props.attachmentType === "form" && formEmbedUrl ? formEmbedUrl : undefined,
      formHeight: props.attachmentType === "form" ? formHeight : undefined,
      formFullWidth: props.attachmentType === "form" ? formFullWidth : undefined,
    });
  }, [pdfFile, formEmbedUrl, formHeight, formFullWidth, props.attachmentType, props.onDesignDataChange]);

  const linkTo = props.linkTo ?? localLinkTo;
  const setLinkTo = props.onLinkToChange ?? setLocalLinkTo;
  const buttonText = props.buttonText ?? localButtonText;
  const setButtonText = props.onButtonTextChange ?? setLocalButtonText;
  const description = props.description ?? localDescription;
  const setDescription = props.onDescriptionChange ?? setLocalDescription;

  const meta = TAB_META[activeTab];

  const contentTabProps = {
    ...props,
    linkTo, setLinkTo,
    buttonText, setButtonText,
    description, setDescription,
    descBold, setDescBold,
    descItalic, setDescItalic,
    descUnderline, setDescUnderline,
    emailContentType, setEmailContentType,
    animatedStyle, setAnimatedStyle,
    staticImageFile, setStaticImageFile,
    pdfFile, setPdfFile,
    pdfAllowDownload, setPdfAllowDownload,
    pdfShareWithConstituents, setPdfShareWithConstituents,
    formEmbedUrl, setFormEmbedUrl,
    formHeight, setFormHeight,
    formFullWidth, setFormFullWidth,
  };

  // ── Inline mode: collapsible sections (no tab rail, no preview column) ──
  if (props.inline) {
    const INLINE_SECTIONS: { id: DesignTab; label: string; icon: any; desc: string }[] = [
      { id: "envelope", label: "Envelope Design",     icon: Mail,        desc: "Choose a branded envelope to greet constituents" },
      { id: "page",     label: "Landing Page",        icon: LayoutGrid,  desc: "Set the background page design for your ThankView" },
      { id: "content",  label: "CTA & Page Content",  icon: ToggleRight,  desc: "Buttons, attachments, and action toggles" },
      { id: "tracking", label: "Tracking",            icon: Code2,       desc: "Optional tracking pixel for analytics" },
    ];

    return (
      <div className="space-y-2 mt-2">
        {INLINE_SECTIONS.map(sec => (
          <details key={sec.id} className="group/design border border-tv-border-light rounded-lg overflow-hidden bg-white">
            <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden hover:bg-tv-surface/50 transition-colors">
              <div className="w-8 h-8 rounded-sm bg-tv-brand-tint flex items-center justify-center shrink-0">
                <sec.icon size={15} className="text-tv-brand" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-tv-text-primary" style={{ fontWeight: 600 }}>{sec.label}</p>
                <p className="text-[10px] text-tv-text-secondary">{sec.desc}</p>
              </div>
              <ChevronDown size={14} className="text-tv-text-secondary transition-transform group-open/design:rotate-180 shrink-0" />
            </summary>
            <div className="px-4 pb-4 border-t border-tv-border-light pt-3">
              {sec.id === "page" && <PageTab {...props} />}
              {sec.id === "envelope" && <EnvelopeTab {...props} />}
              {sec.id === "content" && <ContentTab {...contentTabProps} />}
              {sec.id === "tracking" && <TrackingTab {...props} />}
            </div>
          </details>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0">
      {/* ═══ LEFT: Tab rail + scrollable tab content ════════════════════════ */}
      <div className="flex shrink-0 h-full border-r border-tv-border-light">

        {/* ── Vertical icon-tab rail ── */}
        <div className="w-[60px] bg-tv-surface/40 border-r border-tv-border-divider flex flex-col py-3 gap-1 shrink-0">
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`mx-1.5 flex flex-col items-center gap-1 py-2.5 rounded-md transition-all ${
                  active
                    ? "bg-tv-brand-bg text-white shadow-sm"
                    : "text-tv-text-secondary hover:bg-tv-surface-hover hover:text-tv-text-primary"
                }`}
                title={TAB_META[tab.id].title}>
                <tab.icon size={17} />
                <span className="text-[8px] leading-none" style={{ fontWeight: active ? 700 : 500 }}>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Tab content panel (scrolls independently) ── */}
        <div className="w-[360px] xl:w-[400px] 2xl:w-[440px] overflow-y-auto bg-white">
          <div className="px-5 py-5">
            {/* Tab header — consistent with app section headings */}
            <div className="mb-5">
              <h3 className="text-tv-text-primary mb-1" style={{ fontSize: "17px", fontWeight: 800 }}>
                {meta.title}
              </h3>
              <p className="text-[12px] text-tv-text-secondary leading-relaxed">
                {meta.subtitle}
              </p>
            </div>

            {activeTab === "page" && <PageTab {...props} />}
            {activeTab === "envelope" && <EnvelopeTab {...props} />}
            {activeTab === "content" && (
              <ContentTab {...props}
                linkTo={linkTo} setLinkTo={setLinkTo}
                buttonText={buttonText} setButtonText={setButtonText}
                description={description} setDescription={setDescription}
                descBold={descBold} setDescBold={setDescBold}
                descItalic={descItalic} setDescItalic={setDescItalic}
                descUnderline={descUnderline} setDescUnderline={setDescUnderline}
                emailContentType={emailContentType} setEmailContentType={setEmailContentType}
                animatedStyle={animatedStyle} setAnimatedStyle={setAnimatedStyle}
                staticImageFile={staticImageFile} setStaticImageFile={setStaticImageFile}
                pdfFile={pdfFile} setPdfFile={setPdfFile}
                pdfAllowDownload={pdfAllowDownload} setPdfAllowDownload={setPdfAllowDownload}
                pdfShareWithConstituents={pdfShareWithConstituents} setPdfShareWithConstituents={setPdfShareWithConstituents}
                formEmbedUrl={formEmbedUrl} setFormEmbedUrl={setFormEmbedUrl}
                formHeight={formHeight} setFormHeight={setFormHeight}
                formFullWidth={formFullWidth} setFormFullWidth={setFormFullWidth}
              />
            )}
            {activeTab === "tracking" && <TrackingTab {...props} />}
          </div>
        </div>
      </div>

      {/* ═══ RIGHT: Pinned live preview ═════════════════════════════════════ */}
      <div className="flex-1 min-w-0 bg-tv-surface/30 flex flex-col min-h-0 h-full">
        {/* Viewport switcher toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-tv-border-divider bg-white/60 shrink-0">
          <p className="text-[11px] text-tv-text-label uppercase tracking-wider" style={{ fontWeight: 600 }}>Live Preview</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLivePreviewOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-tv-brand-bg text-white text-[11px] hover:bg-tv-brand-hover transition-colors"
              style={{ fontWeight: 600 }}
            >
              <Play size={11} />
              <span>Preview Animation</span>
            </button>
            <div className="flex items-center gap-0.5 bg-tv-surface rounded-md p-1">
              {VIEWPORTS.map(vp => (
                <button key={vp.key} onClick={() => props.onPreviewViewportChange(vp.key)}
                  className={`px-2.5 py-1.5 rounded-sm transition-all flex items-center gap-1.5 ${
                    props.previewViewport === vp.key
                      ? "bg-white text-tv-brand shadow-sm"
                      : "text-tv-text-secondary hover:text-tv-text-primary"
                  }`}
                  title={vp.label}>
                  <vp.icon size={14} />
                  <span className="text-[10px] hidden xl:inline" style={{ fontWeight: props.previewViewport === vp.key ? 600 : 500 }}>{vp.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview frame — pinned, scrolls internally if preview is taller than viewport */}
        <div className="flex-1 min-h-0 overflow-y-auto flex items-start justify-center px-6 py-6">
          <PreviewFrame
            viewport={props.previewViewport}
            step={props.step}
            envelopeData={props.selectedEnvelopeData}
            landingPageData={props.selectedLandingPageData}
            envTextBefore={props.envTextBefore}
            envLineBreakBefore={props.envLineBreakBefore}
            envNameFormat={props.envNameFormat}
            envLineBreakAfter={props.envLineBreakAfter}
            envTextAfter={props.envTextAfter}
            attachmentType={props.attachmentType}
            linkTo={linkTo}
            buttonText={buttonText}
            description={description}
            pdfFile={pdfFile}
            formEmbedUrl={formEmbedUrl}
            formHeight={formHeight}
            formFullWidth={formFullWidth}
          />
        </div>
      </div>

      {/* Animated envelope preview modal */}
      <LivePreviewModal
        open={livePreviewOpen}
        onClose={() => setLivePreviewOpen(false)}
        envelopeColor={envColor}
        nameColor={envData?.nameColor || (isDarkColor(envColor) ? "#ffffff" : "#1e293b")}
        primaryColor={envAccent}
        linerColor={envAccent}
        design="none"
        swoop1Color={envAccent}
        swoop2Color={envColor}
        stripe1Color={envAccent}
        stripe2Color={envColor}
        postmark="black"
        postmarkText="THANK YOU"
        stampPreview={null}
        logoPreview={null}
        backFlapLogoPreview={null}
      />
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
//  TAB 1: Landing Page
// ═══════════════════════════════════════════════════════════════════════════════
function PageTab(props: DesignStepPanelProps) {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const { show: showToast } = useToast();
  const handleCopyLink = useCallback(() => {
    const url = "https://thankview.com/lp/spring-giving-2026";
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiedLink("page");
    showToast("Link copied!", "success");
    setTimeout(() => setCopiedLink(null), 1800);
  }, [showToast]);

  return (
    <div className="space-y-4">
      {/* Info card — matches app pattern: brand-tint bg + border-light */}
      

      {/* Stat line */}
      <p className="text-[12px] text-tv-text-secondary">
        You have created <span className="text-tv-brand" style={{ fontWeight: 600 }}>{props.filteredLandingPages.length}</span> landing pages.
      </p>

      {/* Action buttons — pill style */}
      <div className="flex gap-2">
        <button onClick={() => handleCopyLink()}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full border text-[12px] transition-colors ${
            copiedLink === "page"
              ? "border-tv-success bg-tv-success-bg text-tv-success"
              : "border-tv-brand-bg/30 text-tv-brand hover:bg-tv-brand-tint"
          }`} style={{ fontWeight: 500 }}>
          {copiedLink === "page" ? <Check size={12} /> : <Link2 size={12} />}
          <span>{copiedLink === "page" ? "Copied!" : "Copy Link"}</span>
        </button>
        <button onClick={() => props.onNavigateToBuilder?.("/assets/landing-page-builder")}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full bg-tv-brand-bg text-[12px] text-white hover:bg-tv-brand-hover transition-colors" style={{ fontWeight: 500 }}>
          <ImageIcon size={12} />
          <span>Create New</span>
        </button>
      </div>

      {/* Search */}
      <PillSearchInput value={props.lpSearch} onChange={props.onLpSearchChange} placeholder="Search for a landing page" size="sm" />

      {/* Collapsible: All Landing Pages */}
      <div>
        <button onClick={props.onLpSectionToggle}
          className="w-full flex items-center justify-between py-2.5 text-[13px] text-tv-text-primary" style={{ fontWeight: 600 }}>
          <span>All Landing Pages <span className="text-tv-text-secondary" style={{ fontWeight: 400 }}>({props.filteredLandingPages.length})</span></span>
          <ChevronDown size={15} className={`text-tv-text-secondary transition-transform ${props.lpSectionOpen ? "rotate-0" : "-rotate-90"}`} />
        </button>
        {props.lpSectionOpen && (
          <div className="grid grid-cols-3 gap-2.5 pt-2 pb-1">
            {props.filteredLandingPages.slice(0, 6).map(p => {
              const active = (props.selectedLandingPageId || 1) === p.id;
              return (
                <div key={p.id} onClick={() => props.onSelectLandingPage(p.id)}
                  role="button" tabIndex={0}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); props.onSelectLandingPage(p.id); } }}
                  className={`group rounded-md border-2 overflow-hidden transition-all text-left relative cursor-pointer ${
                    active ? "border-tv-brand-bg ring-1 ring-tv-brand-bg/50" : "border-tv-border-light hover:border-tv-border-strong"
                  }`}>
                  <div className="aspect-[4/3] relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${(p as any).color || "#7c45b0"}, ${(p as any).accent || "#a78bfa"})` }}>
                    {(p as any).image && (
                      <img src={(p as any).image} alt={p.name}
                        className="absolute inset-0 w-full h-full object-cover" />
                    )}
                    {/* Hover overlay with action icons */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                    <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={e => { e.stopPropagation(); }}
                        className="w-[22px] h-[22px] rounded-[5px] bg-white/90 hover:bg-white flex items-center justify-center shadow-sm transition-colors">
                        <Pencil size={9} className="text-tv-text-primary" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); }}
                        className="w-[22px] h-[22px] rounded-[5px] bg-white/90 hover:bg-white flex items-center justify-center shadow-sm transition-colors">
                        <Trash2 size={9} className="text-tv-text-primary" />
                      </button>
                    </div>
                    {active && (
                      <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-tv-brand-bg flex items-center justify-center shadow-sm">
                        <Check size={9} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <div className={`px-2 py-1.5 ${active ? "bg-tv-brand-tint" : "bg-white"}`}>
                    <p className={`text-[10px] truncate ${active ? "text-tv-brand" : "text-tv-text-primary"}`} style={{ fontWeight: active ? 600 : 500 }}>{p.name}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
//  TAB 2: Envelope — picker first, then appearance (matches screenshot order)
// ═══════════════════════════════════════════════════════════════════════════════
function EnvelopeTab(props: DesignStepPanelProps) {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const { show: showToast } = useToast();
  const handleCopyLink = useCallback(() => {
    const url = "https://thankview.com/env/branded-spring-2026";
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiedLink("envelope");
    showToast("Link copied!", "success");
    setTimeout(() => setCopiedLink(null), 1800);
  }, [showToast]);

  return (
    <div className="space-y-4">
      {/* ── Part A: Choose an Envelope ─────────────────────────────────────── */}

      {/* Info card */}
      

      {/* Action buttons — pill style */}
      <div className="flex gap-2">
        <button onClick={() => handleCopyLink()}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full border text-[12px] transition-colors ${
            copiedLink === "envelope"
              ? "border-tv-success bg-tv-success-bg text-tv-success"
              : "border-tv-brand-bg/30 text-tv-brand hover:bg-tv-brand-tint"
          }`} style={{ fontWeight: 500 }}>
          {copiedLink === "envelope" ? <Check size={12} /> : <Link2 size={12} />}
          <span>{copiedLink === "envelope" ? "Copied!" : "Copy Link"}</span>
        </button>
        <button onClick={() => props.onNavigateToBuilder?.("/assets/envelope-builder")}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full bg-tv-brand-bg text-[12px] text-white hover:bg-tv-brand-hover transition-colors" style={{ fontWeight: 500 }}>
          <Mail size={12} />
          <span>Create New</span>
        </button>
      </div>

      {/* Search */}
      <PillSearchInput value={props.envelopeSearch} onChange={props.onEnvelopeSearchChange} placeholder="Search for an envelope" size="sm" />

      {/* Collapsible envelope category sections */}
      {([
        { key: "branded", label: "Your Branded Envelopes" },
        { key: "holiday", label: "Holiday Envelopes" },
        { key: "legacy",  label: "Legacy Envelopes" },
      ] as const).map(sec => {
        const envs = props.filteredEnvelopes(sec.key);
        return (
        <div key={sec.key}>
          <button onClick={() => props.onEnvSectionToggle(sec.key)}
            className="w-full flex items-center justify-between py-2.5 text-[13px] text-tv-text-primary" style={{ fontWeight: 600 }}>
            <span>{sec.label} <span className="text-tv-text-secondary" style={{ fontWeight: 400 }}>({envs.length})</span></span>
            <ChevronDown size={15} className={`text-tv-text-secondary transition-transform ${props.envSectionOpen[sec.key] ? "rotate-0" : "-rotate-90"}`} />
          </button>
          {props.envSectionOpen[sec.key] && (
            <div className="grid grid-cols-3 gap-2.5 pt-2 pb-1">
              {envs.slice(0, 9).map(env => {
                const active = (props.selectedEnvelopeId || 1) === env.id;
                const nColor = env.nameColor || (isDarkColor(env.color) ? "#ffffff" : "#1e293b");
                return (
                  <button key={env.id} onClick={() => props.onSelectEnvelope(env.id)}
                    className={`rounded-md border-2 overflow-hidden transition-all text-left relative ${
                      active ? "border-tv-brand-bg ring-1 ring-tv-brand-bg/50" : "border-tv-border-light hover:border-tv-border-strong"
                    }`}>
                    {/* Flat envelope face — matches ThankView style */}
                    <div className="aspect-[4/3] relative" style={{ backgroundColor: env.color }}>
                      {/* Paper texture overlay */}
                      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: PAPER_TEXTURE, backgroundSize: "200px 200px", mixBlendMode: "overlay" }} />
                      {/* Holiday graphic decorations */}
                      {env.holidayType && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                          <HolidayGraphic type={env.holidayType} size={48} color={env.accent} />
                        </div>
                      )}
                      {/* Perforated stamp — top right */}
                      <div className="absolute top-[6%] right-[6%]">
                        <PerforatedStamp size={28} accentColor={env.accent} />
                      </div>
                      {/* Centered constituent name */}
                      <div className="absolute inset-0 flex items-center justify-center pt-2">
                        <span className="text-[7px] italic opacity-80" style={{ color: nColor, fontWeight: 500 }}>Constituent Name</span>
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
          )}
        </div>
        );
      })}

      {/* ── Part B: Envelope Appearance */}
      <div className="pt-4 mt-2 border-t border-tv-border-divider">
        <h4 className="text-tv-text-primary mb-1" style={{ fontSize: "15px", fontWeight: 700 }}>Envelope Appearance</h4>
        <p className="text-[12px] text-tv-text-secondary mb-4 leading-relaxed">
          Personally address your constituents on the front of the envelope.
        </p>

        <div className="space-y-4">
          {/* Text before name */}
          <div>
            <SectionLabel>Text before constituent's name <span className="text-tv-text-decorative normal-case tracking-normal" style={{ fontWeight: 400 }}>({props.envTextBefore.length}/40)</span></SectionLabel>
            <div className="relative">
              <input value={props.envTextBefore} onChange={e => { if (e.target.value.length <= 40) props.onEnvTextBeforeChange(e.target.value); }}
                className={`${inputCls} !pr-16`} />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button className="p-1 rounded-sm hover:bg-tv-surface transition-colors"><Type size={13} className="text-tv-text-secondary" /></button>
                <button className="p-1 rounded-sm hover:bg-tv-surface transition-colors"><Smile size={13} className="text-tv-text-secondary" /></button>
              </div>
            </div>
          </div>

          {/* Line break before */}
          <label className="flex items-center gap-2.5 cursor-pointer py-0.5">
            <input type="checkbox" checked={props.envLineBreakBefore} onChange={e => props.onEnvLineBreakBeforeChange(e.target.checked)}
              className="w-4 h-4 rounded border-tv-border-light accent-tv-brand-bg cursor-pointer" />
            <span className="text-[13px] text-tv-text-primary">Add Line Break</span>
          </label>

          {/* Name format */}
          <div>
            <SectionLabel>Name format</SectionLabel>
            <select value={props.envNameFormat} onChange={e => props.onEnvNameFormatChange(e.target.value)}
              className={inputCls}>
              <option>[Title] [First Name] [Last Name]</option>
              <option>[First Name] [Last Name]</option>
              <option>[First Name]</option>
              <option>[Title] [Last Name]</option>
              <option>[Full Name]</option>
            </select>
          </div>

          {/* Line break after */}
          <label className="flex items-center gap-2.5 cursor-pointer py-0.5">
            <input type="checkbox" checked={props.envLineBreakAfter} onChange={e => props.onEnvLineBreakAfterChange(e.target.checked)}
              className="w-4 h-4 rounded border-tv-border-light accent-tv-brand-bg cursor-pointer" />
            <span className="text-[13px] text-tv-text-primary">Add Line Break</span>
          </label>

          {/* Text after name */}
          <div>
            <SectionLabel>Text after constituent's name <span className="text-tv-text-decorative normal-case tracking-normal" style={{ fontWeight: 400 }}>({props.envTextAfter.length}/40)</span></SectionLabel>
            <div className="relative">
              <input value={props.envTextAfter} onChange={e => { if (e.target.value.length <= 40) props.onEnvTextAfterChange(e.target.value); }}
                className={`${inputCls} !pr-16`} />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button className="p-1 rounded-sm hover:bg-tv-surface transition-colors"><Type size={13} className="text-tv-text-secondary" /></button>
                <button className="p-1 rounded-sm hover:bg-tv-surface transition-colors"><Smile size={13} className="text-tv-text-secondary" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Form platform detection helpers ──────────────────────────────────────────

// Runtime feature markers for audit auto-detection
export const __AUDIT_MARKERS__ = [
  'pdf-upload-zone', 'pdf-card-metadata', 'pdf-allow-download-toggle',
  'pdf-share-toggle', 'pdf-preview-block',
  'form-embed-url', 'form-platform-detection', 'form-height-config',
  'form-fullwidth-toggle', 'form-preview-placeholder',
] as const;

type DetectedPlatform = { name: string; color: string; bg: string } | null;

function detectFormPlatform(url: string): DetectedPlatform {
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.includes("givebutter.com")) return { name: "Givebutter", color: "#16a34a", bg: "#f0fdf4" };
  if (lower.includes("boostmyschool.com")) return { name: "BoostMySchool", color: "#2563eb", bg: "#eff6ff" };
  if (lower.includes("typeform.com")) return { name: "Typeform", color: "#8b5cf6", bg: "#f5f3ff" };
  if (lower.includes("jotform.com")) return { name: "Jotform", color: "#f97316", bg: "#fff7ed" };
  if (lower.includes("google.com/forms") || lower.includes("docs.google.com/forms")) return { name: "Google Forms", color: "#7c3aed", bg: "#faf5ff" };
  if (lower.includes("wufoo.com")) return { name: "Wufoo", color: "#dc2626", bg: "#fef2f2" };
  // If it looks like a URL but no match
  if (lower.startsWith("http://") || lower.startsWith("https://")) return { name: "__unknown__", color: "#dc2626", bg: "#fef2f2" };
  return null;
}

function FormEmbedSection({ url, onUrlChange, height, onHeightChange, fullWidth, onFullWidthChange }: {
  url: string; onUrlChange: (v: string) => void;
  height: number; onHeightChange: (v: number) => void;
  fullWidth: boolean; onFullWidthChange: (v: boolean) => void;
}) {
  const platform = detectFormPlatform(url);

  return (
    <div className="pl-5 border-l-2 border-tv-brand-bg/20 ml-2 space-y-3">
      {/* URL input */}
      <div>
        <SectionLabel>Form Embed URL</SectionLabel>
        <input
          value={url}
          onChange={e => onUrlChange(e.target.value)}
          placeholder="Paste your Givebutter, BoostMySchool, or Typeform URL"
          className={inputCls}
        />
      </div>

      {/* Auto-detection badge */}
      {platform && (
        platform.name === "__unknown__" ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-tv-danger-bg border border-tv-danger-border w-fit">
            <AlertTriangle size={11} className="text-tv-danger" />
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
          <SectionLabel>Height (px)</SectionLabel>
          <input
            type="number"
            value={height}
            onChange={e => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v > 0) onHeightChange(v);
            }}
            min={200}
            max={2000}
            className={INPUT_CLS_WHITE}
          />
        </div>
        <div className="pt-5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={fullWidth}
              aria-label="Full width layout"
              onClick={() => onFullWidthChange(!fullWidth)}
              className={`w-9 h-5 rounded-full relative shrink-0 transition-colors ${fullWidth ? "bg-tv-brand-bg" : "bg-tv-surface-active"}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-[2px] shadow-sm transition-all ${fullWidth ? "left-[17px]" : "left-[2px]"}`} />
            </button>
            <div className="flex items-center gap-1">
              <Maximize2 size={11} className={fullWidth ? "text-tv-brand" : "text-tv-text-secondary"} />
              <span className="text-[12px] text-tv-text-primary whitespace-nowrap" style={{ fontWeight: 500 }}>Full Width</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function isDarkColor(hex: string) {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB 3: Page Content — attachments → link/button → description → toggles
// ═══════════════════════════════════════════════════════════════════════════════
function ContentTab(props: DesignStepPanelProps & {
  linkTo: string; setLinkTo: (v: string) => void;
  buttonText: string; setButtonText: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  descBold: boolean; setDescBold: (v: boolean) => void;
  descItalic: boolean; setDescItalic: (v: boolean) => void;
  descUnderline: boolean; setDescUnderline: (v: boolean) => void;
  emailContentType: EmailContentType; setEmailContentType: (v: EmailContentType) => void;
  animatedStyle: AnimatedStyle; setAnimatedStyle: (v: AnimatedStyle) => void;
  staticImageFile: string | null; setStaticImageFile: (v: string | null) => void;
  pdfFile: { name: string; pages: number; size: string } | null;
  setPdfFile: (v: { name: string; pages: number; size: string } | null) => void;
  pdfAllowDownload: boolean; setPdfAllowDownload: (v: boolean) => void;
  pdfShareWithConstituents: boolean; setPdfShareWithConstituents: (v: boolean) => void;
  formEmbedUrl: string; setFormEmbedUrl: (v: string) => void;
  formHeight: number; setFormHeight: (v: number) => void;
  formFullWidth: boolean; setFormFullWidth: (v: boolean) => void;
}) {
  const {
    linkTo, setLinkTo, buttonText, setButtonText,
    description, setDescription,
    descBold, setDescBold, descItalic, setDescItalic, descUnderline, setDescUnderline,
    emailContentType, setEmailContentType, animatedStyle, setAnimatedStyle,
    staticImageFile, setStaticImageFile,
    pdfFile, setPdfFile, pdfAllowDownload, setPdfAllowDownload,
    pdfShareWithConstituents, setPdfShareWithConstituents,
    formEmbedUrl, setFormEmbedUrl, formHeight, setFormHeight,
    formFullWidth, setFormFullWidth,
  } = props;

  const EMAIL_CONTENT_OPTIONS: { key: EmailContentType; icon: typeof Film; label: string; desc: string }[] = [
    { key: "static-image",       icon: ImageIcon, label: "Static Thumbnail",    desc: "A still image from your video displayed in the email" },
    { key: "animated-thumbnail", icon: Film,      label: "Animated Thumbnail",  desc: "Eye-catching GIF or illustrated animation that autoplays" },
    { key: "envelope",           icon: Mail,      label: "Envelope",            desc: "Optional branded envelope with flip-open animation" },
  ];

  const handleStaticUpload = () => {
    // Simulate file picker — in production this opens a real file dialog
    setStaticImageFile("campaign-hero-image.jpg");
  };

  return (
    <div className="space-y-5">
      {/* ── Email Content Type ─────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Email Content</SectionLabel>
        <p className="text-[12px] text-tv-text-secondary mb-3 mt-1">
          Choose what constituents see in the email body.
        </p>
        <div className="space-y-2">
          {EMAIL_CONTENT_OPTIONS.map(opt => {
            const active = emailContentType === opt.key;
            const Icon = opt.icon;
            return (
              <button
                key={opt.key}
                onClick={() => setEmailContentType(opt.key)}
                className={`w-full flex items-center gap-3 p-3 rounded-md border text-left transition-all ${
                  active
                    ? "border-tv-brand-bg bg-tv-brand-tint/30 shadow-sm"
                    : "border-tv-border-light hover:border-tv-brand-bg/40 hover:bg-tv-surface/60"
                }`}
              >
                <div className={`w-9 h-9 rounded-sm flex items-center justify-center shrink-0 transition-colors ${
                  active ? "bg-tv-brand-bg" : "bg-tv-surface"
                }`}>
                  <Icon size={16} className={active ? "text-white" : "text-tv-text-secondary"} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-[13px] block ${active ? "text-tv-brand" : "text-tv-text-primary"}`} style={{ fontWeight: 600 }}>{opt.label}</span>
                  <span className="text-[11px] text-tv-text-secondary">{opt.desc}</span>
                </div>
                <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  active ? "border-tv-brand-bg" : "border-tv-border-strong"
                }`}>
                  {active && <div className="w-2.5 h-2.5 rounded-full bg-tv-brand-bg" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Animated Thumbnail sub-options ── */}
        {emailContentType === "animated-thumbnail" && (
          <div className="mt-3 pl-4 border-l-2 border-tv-brand-bg/20 ml-1 space-y-3">
            <SectionLabel>Animation Style</SectionLabel>
            <div className="flex gap-2">
              {([
                { key: "gif" as const, icon: Sparkles, label: "GIF", desc: "Auto-playing animated preview" },
                { key: "illustration" as const, icon: Film, label: "Illustration", desc: "Stylized animated graphic" },
              ]).map(animOpt => {
                const active = animatedStyle === animOpt.key;
                const Icon = animOpt.icon;
                return (
                  <button
                    key={animOpt.key}
                    onClick={() => setAnimatedStyle(animOpt.key)}
                    className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-md border transition-all ${
                      active
                        ? "border-tv-brand-bg bg-tv-brand-tint/30"
                        : "border-tv-border-light hover:border-tv-brand-bg/40"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-sm flex items-center justify-center transition-colors ${
                      active ? "bg-tv-brand-bg" : "bg-tv-surface"
                    }`}>
                      <Icon size={18} className={active ? "text-white" : "text-tv-text-secondary"} />
                    </div>
                    <span className={`text-[12px] ${active ? "text-tv-brand" : "text-tv-text-primary"}`} style={{ fontWeight: 600 }}>{animOpt.label}</span>
                    <span className="text-[10px] text-tv-text-secondary text-center leading-snug">{animOpt.desc}</span>
                  </button>
                );
              })}
            </div>
            <div className="p-3 bg-tv-surface/60 rounded-sm flex items-start gap-2">
              <Info size={12} className="text-tv-text-decorative shrink-0 mt-0.5" />
              <p className="text-[11px] text-tv-text-secondary leading-relaxed">
                {animatedStyle === "gif"
                  ? "A short looping GIF of the video will autoplay in most email clients, drawing attention to your ThankView."
                  : "An illustrated animation adds personality with a stylized, brand-themed motion graphic that invites constituents to click."}
              </p>
            </div>
          </div>
        )}

        {/* ── Envelope sub-info ── */}
        {emailContentType === "envelope" && (
          <div className="mt-3 pl-4 border-l-2 border-tv-brand-bg/20 ml-1 space-y-2">
            <div className="p-3 bg-tv-surface/60 rounded-sm flex items-start gap-2">
              <Mail size={12} className="text-tv-brand shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] text-tv-text-primary leading-relaxed" style={{ fontWeight: 600 }}>
                  Your branded envelope will appear in the email.
                </p>
                <p className="text-[11px] text-tv-text-secondary leading-relaxed mt-1">
                  Constituents see a personalized envelope with their name, stamp, and postmark. Clicking it triggers
                  the flip-and-open animation on the landing page. Configure the envelope design in the <strong>Envelope</strong> tab.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Static Image upload ── */}
        {emailContentType === "static-image" && (
          <div className="mt-3 pl-4 border-l-2 border-tv-brand-bg/20 ml-1 space-y-2">
            <SectionLabel>Upload Image</SectionLabel>
            {staticImageFile ? (
              <div className="relative border border-tv-border-light rounded-md overflow-hidden">
                <div className="h-[120px] bg-gradient-to-br from-tv-surface to-tv-surface-active flex items-center justify-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <ImageIcon size={24} className="text-tv-text-secondary" />
                    <span className="text-[11px] text-tv-text-primary" style={{ fontWeight: 500 }}>{staticImageFile}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between px-3 py-2 bg-white border-t border-tv-border-light">
                  <span className="text-[10px] text-tv-text-decorative">JPG • 1200×628 recommended</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleStaticUpload}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] text-tv-text-label border border-tv-border-light rounded-full hover:bg-tv-surface transition-colors"
                      style={{ fontWeight: 500 }}
                    >
                      <Replace size={9} />Replace
                    </button>
                    <button
                      onClick={() => setStaticImageFile(null)}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] text-tv-danger border border-tv-danger-border rounded-full hover:bg-tv-danger-bg transition-colors"
                      style={{ fontWeight: 500 }}
                    >
                      <Trash2 size={9} />Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={handleStaticUpload}
                className="w-full border-2 border-dashed border-tv-border-light rounded-lg p-5 text-center hover:border-tv-brand/40 transition-colors cursor-pointer"
              >
                <Upload size={20} className="mx-auto text-tv-text-secondary mb-1.5" />
                <p className="text-[12px] text-tv-text-secondary">Click to upload or drag & drop</p>
                <p className="text-[10px] text-tv-text-decorative mt-1">PNG, JPG, or GIF — 1200×628 recommended</p>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Attachments ───────────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Attachments</SectionLabel>
        <div className="space-y-2.5 mt-2">
          {([
            { key: "button" as const, label: "CTA Button",    icon: ExternalLink },
            { key: "pdf" as const,    label: "Display a PDF",  icon: FileText },
            { key: "form" as const,   label: "Embed a Form",   icon: FormInput },
          ] as const).map(opt => (
            <label key={opt.key} className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                props.attachmentType === opt.key ? "border-tv-brand-bg" : "border-tv-border-strong group-hover:border-tv-text-secondary"
              }`}>
                {props.attachmentType === opt.key && <div className="w-2.5 h-2.5 rounded-full bg-tv-brand-bg" />}
              </div>
              <input type="radio" name="ds-attachmentType" value={opt.key}
                checked={props.attachmentType === opt.key}
                onChange={() => props.onAttachmentTypeChange(opt.key)} className="sr-only" />
              <opt.icon size={14} className="text-tv-text-secondary" />
              <span className="text-[13px] text-tv-text-primary">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ── Button sub-fields ─────────────────────────────────────────────── */}
      {props.attachmentType === "button" && (
        <div className="space-y-4 pl-5 border-l-2 border-tv-brand-bg/20 ml-2">
          <div>
            <SectionLabel>Link To</SectionLabel>
            <input value={linkTo} onChange={e => setLinkTo(e.target.value)}
              placeholder="Example: http://alumni.exuniv.edu"
              className={inputCls} />
          </div>
          <CtaButtonControls
            ctaText={props.step.ctaText || buttonText || ""}
            btnBg={props.step.btnBg || ""}
            btnText={props.step.btnText || ""}
            onCtaTextChange={v => {
              setButtonText(v);
              props.onCtaTextChange?.(v);
            }}
            onBtnBgChange={v => props.onBtnBgChange?.(v)}
            onBtnTextChange={v => props.onBtnTextChange?.(v)}
          />
        </div>
      )}

      {/* PDF upload */}
      {props.attachmentType === "pdf" && (
        <div className="pl-5 border-l-2 border-tv-brand-bg/20 ml-2 space-y-3">
          <SectionLabel>Upload PDF</SectionLabel>

          {!pdfFile ? (
            /* ── Upload zone ─────────────────────────────────────────── */
            <button
              type="button"
              onClick={() => setPdfFile({ name: "Impact_Report_2025.pdf", pages: 12, size: "2.4 MB" })}
              className="w-full border-2 border-dashed border-tv-border-light rounded-lg p-6 flex flex-col items-center gap-2 hover:border-tv-brand/40 hover:bg-tv-brand-tint/30 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-md bg-tv-surface flex items-center justify-center group-hover:bg-tv-brand-tint transition-colors">
                <FileText size={20} className="text-tv-text-secondary group-hover:text-tv-brand transition-colors" />
              </div>
              <p className="text-[12px] text-tv-text-primary" style={{ fontWeight: 500 }}>Upload PDF</p>
              <p className="text-[10px] text-tv-text-decorative">Accepts .pdf — up to 10 MB</p>
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-tv-brand-bg text-tv-brand text-[11px] group-hover:bg-tv-brand-bg group-hover:text-white transition-colors" style={{ fontWeight: 500 }}>
                <Upload size={11} />Browse Files
              </span>
            </button>
          ) : (
            /* ── Uploaded PDF card ───────────────────────────────────── */
            <div className="flex items-center gap-3 p-3 bg-white border border-tv-border-light rounded-lg">
              <div className="w-10 h-10 rounded-sm bg-tv-danger-bg flex items-center justify-center shrink-0">
                <FileText size={18} className="text-tv-danger" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-tv-text-primary truncate" style={{ fontWeight: 600 }}>{pdfFile.name}</p>
                <p className="text-[10px] text-tv-text-secondary">{pdfFile.pages} pages, {pdfFile.size}</p>
              </div>
              <button
                type="button"
                onClick={() => setPdfFile(null)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-tv-text-decorative hover:bg-tv-danger-bg hover:text-tv-danger transition-colors shrink-0"
                title="Remove PDF"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* ── Toggles ──────────────────────────────────────────────── */}
          {pdfFile && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download size={12} className={pdfAllowDownload ? "text-tv-brand" : "text-tv-text-secondary"} />
                  <span className="text-[12px] text-tv-text-primary" style={{ fontWeight: 500 }}>Allow Download</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={pdfAllowDownload}
                  aria-label="Allow download"
                  onClick={() => setPdfAllowDownload(!pdfAllowDownload)}
                  className={`w-9 h-5 rounded-full relative shrink-0 transition-colors ${pdfAllowDownload ? "bg-tv-brand-bg" : "bg-tv-surface-active"}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-[2px] shadow-sm transition-all ${pdfAllowDownload ? "left-[17px]" : "left-[2px]"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={12} className={pdfShareWithConstituents ? "text-tv-brand" : "text-tv-text-secondary"} />
                  <span className="text-[12px] text-tv-text-primary" style={{ fontWeight: 500 }}>Share with Constituents</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={pdfShareWithConstituents}
                  aria-label="Share with constituents"
                  onClick={() => setPdfShareWithConstituents(!pdfShareWithConstituents)}
                  className={`w-9 h-5 rounded-full relative shrink-0 transition-colors ${pdfShareWithConstituents ? "bg-tv-brand-bg" : "bg-tv-surface-active"}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-[2px] shadow-sm transition-all ${pdfShareWithConstituents ? "left-[17px]" : "left-[2px]"}`} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form embed */}
      {props.attachmentType === "form" && (
        <FormEmbedSection
          url={formEmbedUrl} onUrlChange={setFormEmbedUrl}
          height={formHeight} onHeightChange={setFormHeight}
          fullWidth={formFullWidth} onFullWidthChange={setFormFullWidth}
        />
      )}

      {/* ── Description (rich text) ───────────────────────────────────────── */}
      <div>
        <SectionLabel>Description</SectionLabel>
        {/* Formatting toolbar */}
        <div className="flex items-center gap-0.5 border border-tv-border-light border-b-0 rounded-t-[10px] px-2 py-1.5 bg-tv-surface/40">
          {/* Bold / Italic / Underline */}
          <ToolbarBtn active={descBold} onClick={() => setDescBold(!descBold)}><Bold size={13} /></ToolbarBtn>
          <ToolbarBtn active={descItalic} onClick={() => setDescItalic(!descItalic)}><Italic size={13} /></ToolbarBtn>
          <ToolbarBtn active={descUnderline} onClick={() => setDescUnderline(!descUnderline)}><Underline size={13} /></ToolbarBtn>
          <ToolbarDivider />
          <ToolbarBtn><Link2 size={13} /></ToolbarBtn>
          <ToolbarDivider />
          <ToolbarBtn><List size={13} /></ToolbarBtn>
          <ToolbarBtn><ListOrdered size={13} /></ToolbarBtn>
          <ToolbarDivider />
          <ToolbarBtn><AlignLeft size={13} /></ToolbarBtn>
          <ToolbarBtn><AlignCenter size={13} /></ToolbarBtn>
          <ToolbarBtn><AlignRight size={13} /></ToolbarBtn>
        </div>
        <textarea
          value={description}
          onChange={e => { if (e.target.value.length <= DESCRIPTION_MAX) setDescription(e.target.value); }}
          rows={4}
          placeholder="Add a warm and fuzzy message to your constituents..."
          className="w-full border border-tv-border-light rounded-b-[10px] px-3 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand resize-y min-h-[90px]"
          style={{
            fontWeight: descBold ? 700 : 400,
            fontStyle: descItalic ? "italic" : "normal",
            textDecoration: descUnderline ? "underline" : "none",
          }}
        />
        <p className="text-[10px] text-tv-text-decorative text-right mt-1">{description.length}/{DESCRIPTION_MAX}</p>
      </div>

      {/* ── Action Buttons ─────────────────────────────────────────────────── */}
      <div className="border-t border-tv-border-divider pt-5">
        <SectionLabel>Action Buttons</SectionLabel>
        <p className="text-[12px] text-tv-text-secondary mb-3 mt-1">Allow your constituents to:</p>
        <div className="space-y-3">
          {([
            { key: "allowVideoReply" as const,       label: "Reply with a video recording" },
            { key: "allowEmailReply" as const,       label: "Reply with an email" },
            { key: "allowSaveButton" as const,       label: "Save your video" },
            { key: "allowShareButton" as const,      label: "Share your video on Facebook" },
            { key: "allowDownloadVideo" as const,    label: "Download your video" },
            { key: "closedCaptionsEnabled" as const, label: "Enable closed captions" },
          ]).map(opt => {
            const enabled = props.step[opt.key] !== false;
            return (
              <div key={opt.key} className="flex items-center justify-between gap-3">
                <span className="text-[13px] text-tv-text-primary leading-snug">{opt.label}</span>
                <Toggle enabled={enabled} onToggle={() => props.onToggle(opt.key)} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
//  TAB 4: Tracking Pixel
// ═══════════════════════════════════════════════════════════════════════════════
function TrackingTab(props: DesignStepPanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <SectionLabel>Tracking Pixel URL</SectionLabel>
        <input value={props.trackingPixel} onChange={e => props.onTrackingPixelChange(e.target.value)}
          placeholder="Add a tracking pixel to your landing page"
          className={inputCls} />
      </div>
      <div className="rounded-md p-3.5 bg-tv-info-bg border border-tv-info-border">
        <div className="flex gap-2">
          <Info size={13} className="text-tv-info shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] text-tv-info leading-relaxed">
              Tracking pixels allow you to gather additional analytics data from visits to your landing page.
            </p>
            <button className="text-[11px] text-tv-info hover:text-tv-info-hover hover:underline mt-1.5 inline-block transition-colors" style={{ fontWeight: 600 }}>Learn more</button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ── Small helpers for the rich-text toolbar ─────────────────────────────────
function ToolbarBtn({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      className={`p-1.5 rounded-sm transition-colors ${
        active ? "bg-tv-brand-bg/10 text-tv-brand" : "text-tv-text-secondary hover:bg-tv-surface-hover hover:text-tv-text-primary"
      }`}>
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-4 bg-tv-border-divider mx-1" />;
}


// ═══════════════════════════════════════════════════════════════════════════════
//  Preview Frame — Landing page with envelope overlay on the video area
// ══════════════════════════════════════��════════════════════════════════════════
function PreviewFrame({
  viewport, step, envelopeData, landingPageData,
  envTextBefore, envLineBreakBefore, envNameFormat, envLineBreakAfter, envTextAfter,
  attachmentType, linkTo, buttonText, description, pdfFile,
  formEmbedUrl, formHeight = 600, formFullWidth,
}: {
  viewport: Viewport;
  step: DesignStepPanelProps["step"];
  envelopeData?: { color: string; accent: string; name: string; nameColor?: string; holidayType?: string };
  landingPageData?: { color: string; accent: string; name: string; image?: string };
  envTextBefore: string;
  envLineBreakBefore: boolean;
  envNameFormat: string;
  envLineBreakAfter: boolean;
  envTextAfter: string;
  attachmentType: "button" | "pdf" | "form";
  linkTo: string;
  buttonText: string;
  description: string;
  pdfFile?: { name: string; pages: number; size: string } | null;
  formEmbedUrl?: string;
  formHeight?: number;
  formFullWidth?: boolean;
}) {
  const widthClass = viewport === "desktop" ? "w-full max-w-[560px] 2xl:max-w-[680px]" : viewport === "tablet" ? "w-[420px] 2xl:w-[480px]" : "w-[320px]";

  const formatName = (fmt: string) => {
    const map: Record<string, string> = {
      "[Title] [First Name] [Last Name]": "Mr. John Smith",
      "[First Name] [Last Name]": "John Smith",
      "[First Name]": "John",
      "[Title] [Last Name]": "Mr. Smith",
      "[Full Name]": "John David Smith",
    };
    return map[fmt] || "John Smith";
  };

  const envColor = envelopeData?.color || "#ffffff";
  const envAccent = envelopeData?.accent || "#7c45b0";
  const lpColor = landingPageData?.color || "#7c45b0";
  const lpAccent = landingPageData?.accent || "#a78bfa";

  const personalizationLines: string[] = [];
  if (envTextBefore) personalizationLines.push(envTextBefore);
  if (envLineBreakBefore && envTextBefore) personalizationLines.push("");
  personalizationLines.push(formatName(envNameFormat));
  if (envLineBreakAfter && envTextAfter) personalizationLines.push("");
  if (envTextAfter) personalizationLines.push(envTextAfter);

  const isDark = (hex: string) => {
    const c = hex.replace("#", "");
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  };
  const envTextColor = isDark(envColor) ? "#ffffff" : "#1e293b";
  const envSubtleColor = isDark(envColor) ? "rgba(255,255,255,0.55)" : "rgba(30,41,59,0.45)";

  const isMobile = viewport === "mobile";
  const isTablet = viewport === "tablet";

  return (
    <div className={`bg-white rounded-lg border border-tv-border-light shadow-lg overflow-hidden transition-all ${widthClass}`}>
      {/* Organization header bar */}
      <div className="px-4 py-3 border-b border-tv-border-divider flex items-center gap-2.5 bg-white">
        <div className="w-7 h-7 rounded-sm flex items-center justify-center" style={{ backgroundColor: lpColor }}>
          <span className="text-white text-[10px]" style={{ fontWeight: 800 }}>E</span>
        </div>
        <span className={`text-tv-text-primary ${isMobile ? "text-[12px]" : "text-[13px]"}`} style={{ fontWeight: 700 }}>evertrue</span>
      </div>

      {/* Video / Background area with envelope overlay */}
      <div className={`relative ${isMobile ? "aspect-[4/3]" : "aspect-[16/10]"}`}
        style={{ background: `linear-gradient(135deg, ${lpColor}, ${lpAccent})` }}>
        {/* Landing page photo background */}
        {landingPageData?.image && (
          <img src={landingPageData.image} alt="Landing page background"
            className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />

        {/* Envelope — static, floating on the video area */}
        <div className="absolute inset-0 flex items-center justify-center p-5">
          <div
            className={`relative shadow-2xl overflow-hidden ${isMobile ? "w-[82%] max-w-[260px]" : isTablet ? "w-[60%] max-w-[300px]" : "w-[56%] max-w-[340px]"}`}
            style={{ backgroundColor: envColor, aspectRatio: "16/10" }}
          >
            {/* Paper texture overlay */}
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: PAPER_TEXTURE, backgroundSize: "200px 200px", mixBlendMode: "overlay" }} />
            {/* Holiday graphic decorations */}
            {envelopeData?.holidayType && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <HolidayGraphic type={envelopeData.holidayType} size={isMobile ? 60 : isTablet ? 80 : 100} color={envAccent} />
              </div>
            )}
            {/* Perforated stamp — top right */}
            <div className={`absolute ${isMobile ? "top-2 right-2" : "top-3 right-3"}`}>
              <PerforatedStamp size={isMobile ? 36 : isTablet ? 44 : 52} accentColor={envAccent} />
            </div>

            {/* Centered constituent name */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-center space-y-0">
                {personalizationLines.map((line, i) => (
                  <p key={i} style={{
                    color: line === "" ? "transparent" : (line === formatName(envNameFormat) ? (envelopeData as any)?.nameColor || envTextColor : envSubtleColor),
                    fontSize: line === formatName(envNameFormat) ? (isMobile ? "12px" : isTablet ? "15px" : "18px") : (isMobile ? "9px" : "11px"),
                    fontWeight: line === formatName(envNameFormat) ? 500 : 400,
                    fontStyle: line === formatName(envNameFormat) ? "italic" : "normal",
                    lineHeight: line === "" ? "8px" : "1.5",
                    letterSpacing: line === formatName(envNameFormat) ? "0.02em" : "0",
                  }}>
                    {line || "\u00a0"}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content below video */}
      <div className={`${isMobile ? "px-4 py-4" : "px-5 py-5"}`}>
        <p className={`text-tv-text-primary text-center ${isMobile ? "text-[12px] mb-1" : "text-[14px] mb-1.5"}`} style={{ fontWeight: 600 }}>
          Erin Beler
        </p>

        {description && (
          <p className={`text-tv-text-secondary text-center leading-relaxed ${isMobile ? "text-[10px] mb-3" : "text-[12px] mb-4"}`}>
            {description}
          </p>
        )}

        {attachmentType === "button" && buttonText && (
          <div className="text-center mb-4">
            <span className={`inline-block px-6 py-2.5 rounded-sm text-white ${isMobile ? "text-[11px]" : "text-[13px]"}`}
              style={{ backgroundColor: step.btnBg || lpColor, fontWeight: 600 }}>
              {buttonText}
            </span>
          </div>
        )}

        {/* Form embed placeholder */}
        {attachmentType === "form" && formEmbedUrl && (() => {
          const plat = detectFormPlatform(formEmbedUrl);
          const platLabel = plat && plat.name !== "__unknown__" ? plat.name : "Embedded";
          // Scale preview height proportionally (preview is ~50% of real)
          const previewH = Math.max(60, Math.min(Math.round(formHeight * 0.35), 280));
          return (
            <div
              className={`mb-4 border-2 border-dashed border-tv-border-light rounded-md flex flex-col items-center justify-center gap-1.5 ${formFullWidth ? "" : isMobile ? "mx-3" : "mx-6"}`}
              style={{ height: previewH }}
            >
              <FormInput size={isMobile ? 14 : 18} className="text-tv-text-decorative" />
              <p className={`text-tv-text-primary ${isMobile ? "text-[9px]" : "text-[11px]"}`} style={{ fontWeight: 600 }}>
                {platLabel} Form
              </p>
              <p className={`text-tv-text-decorative ${isMobile ? "text-[7px]" : "text-[9px]"}`}>
                Form will appear here
              </p>
            </div>
          );
        })()}

        {/* PDF viewer block */}
        {attachmentType === "pdf" && pdfFile && (
          <div className={`mb-4 rounded-md border border-tv-border-light bg-tv-surface overflow-hidden ${isMobile ? "mx-1" : "mx-2"}`}>
            <div className={`flex flex-col items-center justify-center ${isMobile ? "py-6 gap-2" : "py-8 gap-2.5"}`}>
              <div className={`rounded-md bg-tv-surface-active flex items-center justify-center ${isMobile ? "w-10 h-10" : "w-12 h-12"}`}>
                <FileText size={isMobile ? 18 : 22} className="text-tv-text-secondary" />
              </div>
              <p className={`text-tv-text-primary text-center truncate max-w-[85%] ${isMobile ? "text-[10px]" : "text-[12px]"}`} style={{ fontWeight: 600 }}>
                {pdfFile.name}
              </p>
              <p className={`text-tv-text-decorative ${isMobile ? "text-[8px]" : "text-[9px]"}`}>
                {pdfFile.pages} pages · {pdfFile.size}
              </p>
              <span className={`inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-white ${isMobile ? "text-[9px]" : "text-[11px]"}`}
                style={{ backgroundColor: lpColor, fontWeight: 500 }}>
                <FileText size={isMobile ? 9 : 11} />View PDF
              </span>
            </div>
          </div>
        )}

        <div className={`flex items-center justify-center ${isMobile ? "flex-wrap gap-1.5" : "gap-2.5"}`}>
          {step.allowVideoReply !== false && step.allowEmailReply !== false && (
            <span className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm border border-tv-brand-bg text-tv-brand ${isMobile ? "text-[9px]" : "text-[11px]"}`} style={{ fontWeight: 500 }}>
              <Reply size={isMobile ? 10 : 11} />Reply
            </span>
          )}
          {step.allowSaveButton !== false && (
            <span className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm text-white ${isMobile ? "text-[9px]" : "text-[11px]"}`}
              style={{ backgroundColor: TV.success, fontWeight: 500 }}>
              <Download size={isMobile ? 10 : 11} />Save
            </span>
          )}
          {step.allowShareButton !== false && (
            <span className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm border border-tv-border-light text-tv-text-primary ${isMobile ? "text-[9px]" : "text-[11px]"}`} style={{ fontWeight: 500 }}>
              Share <ExternalLink size={isMobile ? 8 : 9} />
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-tv-border-divider flex items-center justify-between bg-tv-surface/30">
        <button className="text-[10px] text-tv-info hover:underline transition-colors">Privacy Policy</button>
        <span className="text-[9px] text-tv-text-decorative italic">by <span style={{ fontWeight: 600 }}>thankview</span></span>
      </div>
    </div>
  );
}