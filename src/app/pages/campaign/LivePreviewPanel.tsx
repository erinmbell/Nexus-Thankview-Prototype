import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  Monitor, Smartphone, Tablet, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Play, FlaskConical, Camera, Reply, Download, Share2, Captions,
  Phone, Video, Signal, Wifi, Battery, Info, FileText, ExternalLink, FormInput,
  User, Pencil, Search, X, Plus, UserPlus, Trash2, Check,
  Mail, LayoutGrid,
} from "lucide-react";
import { ENVELOPE_DESIGNS, LANDING_PAGES } from "./types";
import { useDesignLibrary } from "../../contexts/DesignLibraryContext";

/** Paper/linen texture overlay for envelope renders */
const PAPER_TEXTURE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`;

function isDarkColor(hex: string) {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

/** Perforated stamp — matches ThankView's zigzag-edged postage stamp with play button */
function PerforatedStamp({ size = 48, accentColor = "#c09696" }: { size?: number; accentColor?: string }) {
  const notchR = size * 0.04;
  const notchCount = Math.round(size / (notchR * 3.2));
  const buildEdge = (x1: number, y1: number, x2: number, y2: number, count: number) => {
    const segs: string[] = [];
    for (let i = 0; i < count; i++) {
      const t2 = (i + 0.5) / count;
      const t3 = (i + 1) / count;
      const mx = x1 + (x2 - x1) * t2;
      const my = y1 + (y2 - y1) * t2;
      const ex = x1 + (x2 - x1) * t3;
      const ey = y1 + (y2 - y1) * t3;
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
    buildEdge(m, m, s - m, m, notchCount),
    buildEdge(s - m, m, s - m, s - m, notchCount),
    buildEdge(s - m, s - m, m, s - m, notchCount),
    buildEdge(m, s - m, m, m, notchCount),
    "Z",
  ].join(" ");
  const playSize = size * 0.32;
  const cx = size / 2;
  const cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <path d={path} fill={`${accentColor}40`} stroke={accentColor} strokeWidth={0.8} />
      <circle cx={cx} cy={cy} r={playSize * 0.58} fill="none" stroke={accentColor} strokeWidth={1.2} />
      <polygon
        points={`${cx - playSize * 0.18},${cy - playSize * 0.28} ${cx - playSize * 0.18},${cy + playSize * 0.28} ${cx + playSize * 0.28},${cy}`}
        fill={accentColor}
      />
    </svg>
  );
}

/** Holiday-themed SVG decorations for envelope renders */
function HolidayGraphic({ type, size = 48, color }: { type: string; size?: number; color: string }) {
  const s = size;
  switch (type) {
    case "winter":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
          <g stroke={color} strokeWidth={1.2} strokeLinecap="round" opacity={0.7}>
            <line x1="24" y1="8" x2="24" y2="40" /><line x1="10.1" y1="16" x2="37.9" y2="32" />
            <line x1="10.1" y1="32" x2="37.9" y2="16" />
            <line x1="24" y1="12" x2="20" y2="9" /><line x1="24" y1="12" x2="28" y2="9" />
            <line x1="24" y1="36" x2="20" y2="39" /><line x1="24" y1="36" x2="28" y2="39" />
          </g>
          <circle cx="8" cy="10" r="1.2" fill={color} opacity={0.3} />
          <circle cx="14" cy="38" r="1" fill={color} opacity={0.25} />
        </svg>
      );
    case "christmas":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="26" r="10" fill={`${color}25`} stroke={color} strokeWidth={1.2} opacity={0.7} />
          <rect x="22" y="15" width="4" height="3" rx="1" fill={color} opacity={0.6} />
          <path d="M34 12 Q38 8 42 12 Q38 10 34 12Z" fill={color} opacity={0.35} />
        </svg>
      );
    case "thanksgiving":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
          <path d="M16 28 Q12 20 16 14 Q18 18 20 14 Q22 18 24 14 Q26 18 28 14 Q32 2 28 28Z"
            fill={`${color}25`} stroke={color} strokeWidth={1} strokeLinejoin="round" opacity={0.6} />
          <line x1="22" y1="28" x2="22" y2="36" stroke={color} strokeWidth={1} opacity={0.4} />
        </svg>
      );
    case "greetings":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
          <path d="M24 8 L30 20 L27 20 L32 30 L28 30 L34 40 L14 40 L20 30 L16 30 L21 20 L18 20Z"
            fill={`${color}20`} stroke={color} strokeWidth={1} strokeLinejoin="round" opacity={0.6} />
          <rect x="22" y="40" width="4" height="4" rx="0.5" fill={color} opacity={0.4} />
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
        </svg>
      );
    case "eid-adha":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
          <g opacity={0.5}>
            <path d="M14 40 L14 28 Q14 20 24 16 Q34 20 34 28 L34 40Z"
              fill={`${color}20`} stroke={color} strokeWidth={1} />
          </g>
          <g transform="translate(22,6)" opacity={0.55}>
            <path d="M2 0 A3.5 3.5 0 1 0 2 8 A2.8 2.8 0 1 1 2 0Z" fill={color} opacity={0.5} />
          </g>
        </svg>
      );
    default:
      return null;
  }
}

type PreviewTab = "email" | "landing";

// ── Default test constituent seed values ─────────��──────────────────��─────────
const DEFAULT_TEST_CONSTITUENT: TestConstituent = {
  first_name: "James",
  last_name: "Whitfield",
  gift_amount: "$5,000",
  fund_name: "Annual Fund",
  last_fund: "Scholarship Fund",
  campaign_name: "Spring Thank You",
  sender_name: "Kelley Molt",
};

interface TestConstituent {
  first_name: string;
  last_name: string;
  gift_amount: string;
  fund_name: string;
  last_fund: string;
  campaign_name: string;
  sender_name: string;
  [key: string]: string;
}

// ── Preview constituent with optional personalized video ──────────────────────
export interface PreviewConstituent {
  first_name: string;
  last_name: string;
  gift_amount?: string;
  fund_name?: string;
  last_fund?: string;
  campaign_name?: string;
  sender_name?: string;
  class_year?: string;
  email?: string;
  /** Personalized video info — if present, thumbnail changes */
  personalizedVideo?: { color: string; title?: string };
  [key: string]: string | { color: string; title?: string } | undefined;
}

// ── Mock constituent database for search ─────────────────────────────────────
const CONSTITUENT_DATABASE: PreviewConstituent[] = [
  { first_name: "Sarah", last_name: "Chen", gift_amount: "$10,000", fund_name: "Annual Fund", last_fund: "Scholarship Fund", campaign_name: "Spring Thank You", sender_name: "Kelley Molt", class_year: "2015", email: "sarah.chen@alumni.edu" },
  { first_name: "Marcus", last_name: "Johnson", gift_amount: "$2,500", fund_name: "Scholarship Fund", last_fund: "Annual Fund", campaign_name: "Spring Thank You", sender_name: "Kelley Molt", class_year: "2008", email: "mjohnson@gmail.com" },
  { first_name: "Emily", last_name: "Rodriguez", gift_amount: "$5,000", fund_name: "Annual Fund", last_fund: "Capital Campaign", campaign_name: "Spring Thank You", sender_name: "Kelley Molt", class_year: "2019", email: "emily.r@company.com" },
  { first_name: "David", last_name: "Park", gift_amount: "$1,000", fund_name: "Capital Campaign", last_fund: "Annual Fund", campaign_name: "Spring Thank You", sender_name: "Kelley Molt", class_year: "2012", email: "dpark@email.com" },
  { first_name: "Aisha", last_name: "Williams", gift_amount: "$25,000", fund_name: "Endowment", last_fund: "Scholarship Fund", campaign_name: "Spring Thank You", sender_name: "Kelley Molt", class_year: "1998", email: "aisha.w@corp.com" },
  { first_name: "James", last_name: "O'Brien", gift_amount: "$500", fund_name: "Athletics", last_fund: "Athletics", campaign_name: "Spring Thank You", sender_name: "Kelley Molt", class_year: "2021", email: "jobrien@school.edu" },
  { first_name: "Priya", last_name: "Patel", gift_amount: "$7,500", fund_name: "Library Fund", last_fund: "Library Fund", campaign_name: "Spring Thank You", sender_name: "Kelley Molt", class_year: "2005", email: "priya.patel@alumni.edu" },
  { first_name: "Robert", last_name: "Martinez", gift_amount: "$3,000", fund_name: "Annual Fund", last_fund: "Endowment", campaign_name: "Spring Thank You", sender_name: "Kelley Molt", class_year: "2016", email: "rmartinez@email.com" },
  { first_name: "Lisa", last_name: "Thompson", gift_amount: "$15,000", fund_name: "Scholarship Fund", last_fund: "Capital Campaign", campaign_name: "Spring Thank You", sender_name: "Kelley Molt", class_year: "2001", email: "lisa.t@business.com" },
  { first_name: "Ahmed", last_name: "Hassan", gift_amount: "$2,000", fund_name: "Annual Fund", last_fund: "Annual Fund", campaign_name: "Spring Thank You", sender_name: "Kelley Molt", class_year: "2018", email: "ahassan@alumni.edu" },
  { first_name: "Jennifer", last_name: "Kim", gift_amount: "$4,000", fund_name: "Research Fund", last_fund: "Scholarship Fund", campaign_name: "Spring Thank You", sender_name: "Kelley Molt", class_year: "2010", email: "jkim@university.edu" },
  { first_name: "Michael", last_name: "Davis", gift_amount: "$8,500", fund_name: "Capital Campaign", last_fund: "Endowment", campaign_name: "Spring Thank You", sender_name: "Kelley Molt", class_year: "1995", email: "mdavis@corp.com" },
  { first_name: "Olivia", last_name: "Garcia", gift_amount: "$1,500", fund_name: "Annual Fund", last_fund: "Annual Fund", campaign_name: "Spring Thank You", sender_name: "Kelley Molt", class_year: "2020", email: "ogarcia@email.com" },
  { first_name: "Daniel", last_name: "Lee", gift_amount: "$6,000", fund_name: "Arts & Culture", last_fund: "Library Fund", campaign_name: "Spring Thank You", sender_name: "Kelley Molt", class_year: "2007", email: "dlee@company.com" },
  { first_name: "Rachel", last_name: "Brown", gift_amount: "$12,000", fund_name: "Endowment", last_fund: "Capital Campaign", campaign_name: "Spring Thank You", sender_name: "Kelley Molt", class_year: "2003", email: "rbrown@alumni.edu" },
  { first_name: "Thomas", last_name: "Wilson", gift_amount: "$750", fund_name: "Annual Fund", last_fund: "Athletics", campaign_name: "Spring Thank You", sender_name: "Kelley Molt", class_year: "2022", email: "twilson@school.edu" },
  { first_name: "Fatima", last_name: "Ali", gift_amount: "$3,500", fund_name: "Scholarship Fund", last_fund: "Scholarship Fund", campaign_name: "Spring Thank You", sender_name: "Kelley Molt", class_year: "2014", email: "fali@email.com" },
  { first_name: "Christopher", last_name: "Taylor", gift_amount: "$20,000", fund_name: "Capital Campaign", last_fund: "Capital Campaign", campaign_name: "Spring Thank You", sender_name: "Kelley Molt", class_year: "1990", email: "ctaylor@corp.com" },
  { first_name: "Hannah", last_name: "Anderson", gift_amount: "$900", fund_name: "Annual Fund", last_fund: "Research Fund", campaign_name: "Spring Thank You", sender_name: "Kelley Molt", class_year: "2023", email: "handerson@alumni.edu" },
  { first_name: "Kevin", last_name: "Nguyen", gift_amount: "$5,500", fund_name: "Library Fund", last_fund: "Annual Fund", campaign_name: "Spring Thank You", sender_name: "Kelley Molt", class_year: "2011", email: "knguyen@email.com" },
  { first_name: "Alexandra", last_name: "Moore", gift_amount: "$4,500", fund_name: "Annual Fund", last_fund: "Endowment", campaign_name: "Spring Thank You", sender_name: "Kelley Molt", class_year: "2017", email: "amoore@company.com" },
  { first_name: "Brandon", last_name: "Jackson", gift_amount: "$2,200", fund_name: "Athletics", last_fund: "Annual Fund", campaign_name: "Spring Thank You", sender_name: "Kelley Molt", class_year: "2009", email: "bjackson@alumni.edu" },
  { first_name: "Sophia", last_name: "White", gift_amount: "$11,000", fund_name: "Endowment", last_fund: "Scholarship Fund", campaign_name: "Spring Thank You", sender_name: "Kelley Molt", class_year: "2000", email: "swhite@business.com" },
  { first_name: "Ryan", last_name: "Clark", gift_amount: "$1,800", fund_name: "Annual Fund", last_fund: "Library Fund", campaign_name: "Spring Thank You", sender_name: "Kelley Molt", class_year: "2013", email: "rclark@email.com" },
  { first_name: "Natalie", last_name: "Wright", gift_amount: "$9,200", fund_name: "Scholarship Fund", last_fund: "Annual Fund", campaign_name: "Spring Thank You", sender_name: "Kelley Molt", class_year: "2006", email: "nwright@alumni.edu" },
  { first_name: "Tyler", last_name: "Scott", gift_amount: "$1,100", fund_name: "Annual Fund", last_fund: "Athletics", campaign_name: "Spring Thank You", sender_name: "Kelley Molt", class_year: "2019", email: "tscott@email.com" },
  { first_name: "Grace", last_name: "Campbell", gift_amount: "$6,800", fund_name: "Library Fund", last_fund: "Library Fund", campaign_name: "Spring Thank You", sender_name: "Kelley Molt", class_year: "2002", email: "gcampbell@corp.com" },
  { first_name: "Ethan", last_name: "Rivera", gift_amount: "$3,300", fund_name: "Athletics", last_fund: "Annual Fund", campaign_name: "Spring Thank You", sender_name: "Kelley Molt", class_year: "2015", email: "erivera@school.edu" },
  { first_name: "Isabella", last_name: "Phillips", gift_amount: "$14,000", fund_name: "Endowment", last_fund: "Capital Campaign", campaign_name: "Spring Thank You", sender_name: "Kelley Molt", class_year: "1997", email: "iphillips@business.com" },
];

/** Convert a PreviewConstituent to a TestConstituent (string-only fields) */
function constituentToTestData(r: PreviewConstituent): TestConstituent {
  return {
    first_name: r.first_name || "",
    last_name: r.last_name || "",
    gift_amount: r.gift_amount || "",
    fund_name: r.fund_name || "",
    last_fund: r.last_fund || "",
    campaign_name: r.campaign_name || "",
    sender_name: r.sender_name || "",
    class_year: r.class_year || "",
    email: r.email || "",
  };
}

// Merge field metadata for display
const MERGE_FIELD_META: { key: string; label: string; placeholder: string }[] = [
  { key: "first_name", label: "First Name", placeholder: "James" },
  { key: "last_name", label: "Last Name", placeholder: "Whitfield" },
  { key: "gift_amount", label: "Gift Amount", placeholder: "$5,000" },
  { key: "fund_name", label: "Fund Name", placeholder: "Annual Fund" },
  { key: "last_fund", label: "Last Fund", placeholder: "Scholarship Fund" },
  { key: "campaign_name", label: "Campaign Name", placeholder: "Spring Thank You" },
  { key: "sender_name", label: "Sender Name", placeholder: "Kelley Molt" },
];

type DeviceType = "desktop" | "tablet" | "mobile";

interface LivePreviewPanelProps {
  subject?: string;
  body?: string;
  senderName?: string;
  senderEmail?: string;
  font?: string;
  thumbnailType?: "envelope" | "static" | "animated";
  includeVideoThumbnail?: boolean;
  envelopeId?: number;
  btnBg?: string;
  btnText?: string;
  ctaText?: string;
  ctaUrl?: string;
  attachedVideo?: { id: number; title: string; duration: string; color: string } | null;
  isVideoRequest?: boolean;
  language?: string;
  allowSaveButton?: boolean;
  allowShareButton?: boolean;
  allowVideoReply?: boolean;
  allowEmailReply?: boolean;
  allowDownloadVideo?: boolean;
  closedCaptionsEnabled?: boolean;
  /* PDF embed props */
  pdfFileName?: string;
  pdfPages?: number;
  pdfSize?: string;
  /* Form embed props */
  formUrl?: string;
  formHeight?: number;
  formFullWidth?: boolean;
  /* SMS-specific props */
  smsMode?: boolean;
  smsBody?: string;
  smsPhoneNumber?: string;
  /** Fields that have missing constituent data — shown with amber dashed underline */
  fieldsWithMissingData?: string[];
  /** Campaign constituents for "Preview as" picker — uses CONSTITUENT_DATABASE if omitted */
  constituents?: PreviewConstituent[];
  /** Email body styling */
  bodyFontFamily?: string;
  bodyFontSize?: number;
  bodyTextColor?: string;
  bodyLineHeight?: number;
  /** Landing page branding — updates preview background in real time */
  landingPageColor?: string;
  landingPageAccent?: string;
  landingPageImage?: string;
  /** Envelope text customization — shown on envelope thumbnail */
  envTextBefore?: string;
  envNameFormat?: string;
  envTextAfter?: string;
  /** Selected email signature — rendered below email body in preview */
  selectedSignature?: { id: number; name: string; title?: string; org?: string; phone?: string; email?: string } | null;
}

function resolveMergeFields(text: string, constituent: TestConstituent): string {
  let result = text;
  for (const [key, value] of Object.entries(constituent)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value || `{{${key}}}`);
  }
  result = result.replace(/\{\{link\}\}/g, "https://thankview.com/v/abc123");
  return result;
}

/**
 * Resolve merge fields and wrap fields with missing data with amber dashed underlines.
 * Returns an array of React nodes.
 */
function resolveMergeFieldsWithHighlights(
  text: string,
  constituent: TestConstituent,
  missingFields: string[],
): React.ReactNode[] {
  // First resolve the link field
  const processed = text.replace(/\{\{link\}\}/g, "https://thankview.com/v/abc123");
  // Split on merge-field tokens, keeping the delimiters
  const parts = processed.split(/(\{\{\w+\}\})/g);

  return parts.map((part, i) => {
    const fieldMatch = part.match(/^\{\{(\w+)\}\}$/);
    if (fieldMatch) {
      const fieldName = fieldMatch[1];
      const value = constituent[fieldName] || part;
      const isMissing = missingFields.includes(fieldName);
      if (isMissing) {
        return (
          <span
            key={i}
            className="border-b-[2px] border-dashed border-tv-warning"
            title={`{{${fieldName}}} — some constituents missing data`}
            style={{ paddingBottom: "1px" }}
          >
            {value}
          </span>
        );
      }
      return <span key={i}>{value}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}

/** Detect which merge fields are actually used in the subject + body */
function detectUsedFields(subject: string, body: string): string[] {
  const combined = (subject || "") + " " + (body || "");
  const matches = [...combined.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]);
  return [...new Set(matches)];
}

// Runtime feature markers for audit auto-detection
export const __AUDIT_MARKERS__ = [
  'pdf-preview-block', 'form-preview-placeholder',
  'sms-tablet-preview', 'sms-mobile-preview', 'sms-desktop-info-banner',
  'merge-field-test-constituent', 'merge-field-highlights',
  'constituent-picker-dropdown', 'constituent-prev-next', 'constituent-counter',
  'personalized-video-thumbnail', 'constituent-search-picker',
] as const;

export function LivePreviewPanel({
  subject = "",
  body = "",
  senderName = "",
  senderEmail = "",
  font = "Serif (Garamond)",
  thumbnailType = "static",
  includeVideoThumbnail,
  envelopeId = 1,
  btnBg = "#7c45b0",
  btnText = "#ffffff",
  ctaText = "Give to the Annual Fund",
  ctaUrl,
  attachedVideo,
  isVideoRequest,
  language,
  allowSaveButton,
  allowShareButton,
  allowVideoReply,
  allowEmailReply,
  allowDownloadVideo,
  closedCaptionsEnabled,
  pdfFileName,
  pdfPages,
  pdfSize,
  formUrl,
  formHeight,
  formFullWidth,
  smsMode,
  smsBody,
  smsPhoneNumber,
  fieldsWithMissingData = [],
  constituents = CONSTITUENT_DATABASE,
  bodyFontFamily,
  bodyFontSize,
  bodyTextColor,
  bodyLineHeight,
  landingPageColor,
  landingPageAccent,
  landingPageImage,
  envTextBefore,
  envNameFormat,
  envTextAfter,
  selectedSignature,
}: LivePreviewPanelProps) {
  const { customEnvelopes: globalEnvelopes, customLandingPages: globalLandingPages } = useDesignLibrary();
  const allEnvelopeDesigns = [...globalEnvelopes, ...ENVELOPE_DESIGNS];
  const allLandingPageDesigns = [...globalLandingPages, ...LANDING_PAGES];
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [testConstituent, setTestConstituent] = useState<TestConstituent>(DEFAULT_TEST_CONSTITUENT);
  const [showTestForm, setShowTestForm] = useState(false);

  // ── Preview tab: Email / Landing Page / Envelope ──────────────────────────
  const [previewTab, setPreviewTab] = useState<PreviewTab>("email");


  // ── Custom merge fields (user-added beyond the built-in set) ───────────
  type MergeFieldDef = { key: string; label: string; placeholder: string; isCustom?: boolean };
  const [customFields, setCustomFields] = useState<MergeFieldDef[]>([]);
  const [showAddFieldForm, setShowAddFieldForm] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState("");
  const addFieldInputRef = useRef<HTMLInputElement>(null);

  // Combined merge fields: built-in + custom
  const allMergeFields = useMemo<MergeFieldDef[]>(() => [
    ...MERGE_FIELD_META,
    ...customFields,
  ], [customFields]);

  const addCustomField = useCallback(() => {
    const label = newFieldLabel.trim();
    if (!label) return;
    const key = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    if (allMergeFields.some(f => f.key === key)) return;
    const placeholder = newFieldPlaceholder.trim() || `Sample ${label}`;
    setCustomFields(prev => [...prev, { key, label, placeholder, isCustom: true }]);
    setTestConstituent(prev => ({ ...prev, [key]: placeholder }));
    setNewFieldLabel("");
    setNewFieldPlaceholder("");
    setShowAddFieldForm(false);
  }, [newFieldLabel, newFieldPlaceholder, allMergeFields]);

  const removeCustomField = useCallback((key: string) => {
    setCustomFields(prev => prev.filter(f => f.key !== key));
    setTestConstituent(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  // Auto-focus the add-field label input when form opens
  useEffect(() => {
    if (showAddFieldForm) {
      setTimeout(() => addFieldInputRef.current?.focus(), 50);
    }
  }, [showAddFieldForm]);

  // ── "Preview as" constituent picker state ─────────────────────────────────
  type PreviewMode = "custom" | "constituent";
  const [previewMode, setPreviewMode] = useState<PreviewMode>("constituent");
  const [constituentIndex, setConstituentIndex] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Constituent search + added preview users ───────────────────────────
  const [constituentSearch, setConstituentSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [addedPreviewUsers, setAddedPreviewUsers] = useState<PreviewConstituent[]>(() => [
    CONSTITUENT_DATABASE[0], // Sarah Chen
    CONSTITUENT_DATABASE[3], // David Park
  ]);

  // Filter constituent database by search query (excluding already-added users)
  const searchResults = useMemo(() => {
    if (!constituentSearch.trim()) return [];
    const q = constituentSearch.toLowerCase();
    return CONSTITUENT_DATABASE.filter(c => {
      const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
      const email = (c.email || "").toLowerCase();
      const isAlreadyAdded = addedPreviewUsers.some(
        a => a.first_name === c.first_name && a.last_name === c.last_name && a.email === c.email
      );
      return !isAlreadyAdded && (fullName.includes(q) || email.includes(q));
    }).slice(0, 6); // Show max 6 results
  }, [constituentSearch, addedPreviewUsers]);

  const addPreviewUser = useCallback((user: PreviewConstituent) => {
    setAddedPreviewUsers(prev => [...prev, user]);
    setConstituentSearch("");
    // Auto-select the newly added user
    setConstituentIndex(addedPreviewUsers.length); // will be the new last index
    setPreviewMode("constituent");
  }, [addedPreviewUsers.length]);

  const removePreviewUser = useCallback((idx: number) => {
    setAddedPreviewUsers(prev => prev.filter((_, i) => i !== idx));
    setConstituentIndex(i => {
      if (i >= idx && i > 0) return i - 1;
      return i;
    });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setConstituentSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (dropdownOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [dropdownOpen]);

  // Derived: active constituent from added preview users
  const activeConstituent = addedPreviewUsers[constituentIndex] ?? addedPreviewUsers[0] ?? null;

  // When in constituent mode, resolve from the selected constituent
  const effectiveTestConstituent: TestConstituent = previewMode === "constituent" && activeConstituent
    ? constituentToTestData(activeConstituent)
    : testConstituent;

  const goToPrev = useCallback(() => {
    if (addedPreviewUsers.length === 0) return;
    setConstituentIndex(i => (i <= 0 ? addedPreviewUsers.length - 1 : i - 1));
  }, [addedPreviewUsers.length]);

  const goToNext = useCallback(() => {
    if (addedPreviewUsers.length === 0) return;
    setConstituentIndex(i => (i >= addedPreviewUsers.length - 1 ? 0 : i + 1));
  }, [addedPreviewUsers.length]);

  const selectConstituent = useCallback((idx: number) => {
    setConstituentIndex(idx);
    setPreviewMode("constituent");
    setDropdownOpen(false);
    setConstituentSearch("");
  }, []);

  const switchToCustom = useCallback(() => {
    setPreviewMode("custom");
    setDropdownOpen(false);
    setConstituentSearch("");
    setShowTestForm(true);
  }, []);

  const resolvedSubject = resolveMergeFields(subject || "Your personal message", effectiveTestConstituent);
  const resolvedBody = resolveMergeFields(body || "Dear {{first_name}},\n\nThank you for your support.", effectiveTestConstituent);

  // Detect which merge fields are actively used in the content
  const usedFields = useMemo(() => detectUsedFields(subject, body), [subject, body]);
  const activeFieldCount = usedFields.filter(f => f !== "link").length;

  const envelope = allEnvelopeDesigns.find(e => e.id === envelopeId) || ENVELOPE_DESIGNS[0];

  const deviceWidths: Record<DeviceType, string> = {
    desktop: "w-full",
    tablet: "w-[400px] 2xl:w-[460px]",
    mobile: "w-[300px]",
  };

  const fontFamily = font?.includes("Garamond") ? "Georgia, Roboto, sans-serif"
    : font?.includes("Inter") ? "Inter, Roboto, sans-serif"
    : font?.includes("Playfair") ? "'Playfair Display', Roboto, sans-serif"
    : "'Montserrat', Roboto, sans-serif";

  const updateField = (key: string, value: string) => {
    setTestConstituent(prev => ({ ...prev, [key]: value }));
  };

  // Thumbnail color for video preview
  const thumbColor = "#7c45b0";

  return (
    <div className="bg-white rounded-[12px] border border-tv-border-light shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 lg:px-5 lg:py-3 bg-tv-surface/60 border-b border-tv-border-divider">
        <div className="flex items-center gap-2">
          <span className="text-[11px] lg:text-[12px] text-tv-text-primary" style={{ fontWeight: 600 }}>Live Preview</span>
          {smsMode && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-tv-info/10 text-tv-info text-[8px]" style={{ fontWeight: 600 }}>
              <Smartphone size={8} />SMS
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 lg:gap-1.5">
          {([
            { key: "desktop" as const, Icon: Monitor },
            { key: "tablet" as const, Icon: Tablet },
            { key: "mobile" as const, Icon: Smartphone },
          ]).map(({ key, Icon }) => (
            <button key={key} onClick={() => setDevice(key)}
              className={`w-6 h-6 lg:w-7 lg:h-7 rounded-[6px] flex items-center justify-center transition-colors ${device === key ? "bg-tv-brand-bg text-white" : "text-tv-text-secondary hover:bg-tv-surface-hover"}`}>
              <Icon size={12} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Preview tab bar: Email / Landing Page / Envelope ── */}
      {!smsMode && (
        <div className="flex items-center gap-1 px-4 py-2 bg-white border-b border-tv-border-divider">
          {([
            { key: "email" as PreviewTab, label: "Email", Icon: Mail },
            { key: "landing" as PreviewTab, label: "Landing Page", Icon: LayoutGrid },
          ]).map(({ key, label, Icon }) => {
            const active = previewTab === key;
            return (
              <button key={key} onClick={() => setPreviewTab(key)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] transition-all ${
                  active ? "bg-tv-brand-bg text-white shadow-sm" : "text-tv-text-secondary hover:text-tv-text-primary hover:bg-tv-surface-hover"
                }`}
                style={{ fontWeight: active ? 600 : 400 }}>
                <Icon size={12} />{label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── "Preview as" constituent picker bar ── */}
      <div className="px-3 py-2.5 bg-tv-brand-tint/40 border-b border-tv-border-divider">
        <div className="flex items-center gap-1.5">
          {/* Prev button */}
          <button
            onClick={goToPrev}
            disabled={previewMode === "custom" || addedPreviewUsers.length === 0}
            className={`w-6 h-6 rounded-[6px] flex items-center justify-center transition-colors shrink-0 ${
              previewMode === "custom" || addedPreviewUsers.length === 0 ? "text-tv-text-decorative cursor-not-allowed" : "text-tv-brand hover:bg-tv-brand-bg/10"
            }`}
          >
            <ChevronLeft size={14} />
          </button>

          {/* Dropdown trigger */}
          <div ref={dropdownRef} className="relative flex-1 min-w-0">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] bg-white border border-tv-border-light hover:border-tv-brand-bg/40 transition-colors"
            >
              <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center" style={{
                backgroundColor: previewMode === "custom"
                  ? "rgb(var(--tv-brand-bg) / 0.15)"
                  : activeConstituent
                    ? "rgb(var(--tv-brand-bg) / 0.7)"
                    : "rgb(var(--tv-brand-bg) / 0.15)"
              }}>
                {previewMode === "custom"
                  ? <Pencil size={9} className="text-tv-brand" />
                  : activeConstituent
                    ? <span className="text-[8px] text-white" style={{ fontWeight: 700 }}>
                        {activeConstituent.first_name?.[0]}{activeConstituent.last_name?.[0]}
                      </span>
                    : <UserPlus size={9} className="text-tv-brand" />
                }
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[10px] text-tv-text-primary truncate" style={{ fontWeight: 600 }}>
                  {previewMode === "custom"
                    ? "Custom (edit fields)"
                    : activeConstituent
                      ? `${activeConstituent.first_name} ${activeConstituent.last_name}`
                      : "Search to add a preview user"
                  }
                </p>
              </div>
              <ChevronDown size={12} className={`text-tv-text-secondary shrink-0 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-tv-border-light rounded-[10px] shadow-lg overflow-hidden">
                {/* Custom option */}
                <button
                  onClick={switchToCustom}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-tv-surface/60 transition-colors ${previewMode === "custom" ? "bg-tv-brand-tint/30" : ""}`}
                >
                  <div className="w-5 h-5 rounded-full bg-tv-brand-bg/15 flex items-center justify-center shrink-0">
                    <Pencil size={9} className="text-tv-brand" />
                  </div>
                  <span className="text-[10px] text-tv-text-primary" style={{ fontWeight: previewMode === "custom" ? 700 : 500 }}>Custom (edit fields)</span>
                </button>

                {/* Added preview users */}
                {addedPreviewUsers.length > 0 && (
                  <>
                    <div className="border-t border-tv-border-divider" />
                    <div className="px-3 pt-1.5 pb-0.5">
                      <p className="text-[8px] text-tv-text-decorative" style={{ fontWeight: 600 }}>PREVIEW USERS</p>
                    </div>
                    {addedPreviewUsers.map((r, idx) => (
                      <div
                        key={`${r.email}-${idx}`}
                        className={`flex items-center gap-2 px-3 py-1.5 hover:bg-tv-surface/60 transition-colors ${previewMode === "constituent" && constituentIndex === idx ? "bg-tv-brand-tint/30" : ""}`}
                      >
                        <button
                          onClick={() => selectConstituent(idx)}
                          className="flex items-center gap-2 flex-1 min-w-0 text-left"
                        >
                          <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center bg-tv-brand-bg/70">
                            <span className="text-[7px] text-white" style={{ fontWeight: 700 }}>{r.first_name[0]}{r.last_name[0]}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-tv-text-primary truncate" style={{ fontWeight: previewMode === "constituent" && constituentIndex === idx ? 700 : 400 }}>
                              {r.first_name} {r.last_name}
                            </p>
                            {r.email && (
                              <p className="text-[8px] text-tv-text-decorative truncate">{r.email}</p>
                            )}
                          </div>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); removePreviewUser(idx); }}
                          className="w-4 h-4 rounded-[4px] flex items-center justify-center text-tv-text-decorative hover:text-tv-error hover:bg-tv-error/10 transition-colors shrink-0"
                          title="Remove preview user"
                        >
                          <Trash2 size={8} />
                        </button>
                      </div>
                    ))}
                  </>
                )}

                {/* Search section */}
                <div className="border-t border-tv-border-divider" />
                <div className="px-3 pt-2 pb-1.5">
                  <div className="relative">
                    <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-tv-text-decorative" />
                    <input
                      ref={searchInputRef}
                      value={constituentSearch}
                      onChange={e => setConstituentSearch(e.target.value)}
                      placeholder="Search constituents by name or email…"
                      className="w-full pl-6 pr-2 py-1.5 rounded-full border border-tv-border-light bg-white text-[10px] text-tv-text-primary placeholder:text-tv-text-decorative outline-none transition-colors focus:border-tv-brand-bg/30 focus:ring-2 focus:ring-tv-brand/20"
                    />
                    {constituentSearch && (
                      <button
                        onClick={() => setConstituentSearch("")}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-tv-text-decorative hover:text-tv-text-secondary"
                      >
                        <X size={9} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Search results */}
                {constituentSearch.trim() && (
                  <div className="max-h-[160px] overflow-y-auto">
                    {searchResults.length > 0 ? (
                      searchResults.map((r, idx) => (
                        <button
                          key={`search-${r.email}-${idx}`}
                          onClick={() => addPreviewUser(r)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-tv-brand-tint/20 transition-colors"
                        >
                          <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center bg-tv-text-decorative/30">
                            <span className="text-[7px] text-white" style={{ fontWeight: 700 }}>{r.first_name[0]}{r.last_name[0]}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-tv-text-primary truncate" style={{ fontWeight: 400 }}>
                              {r.first_name} {r.last_name}
                            </p>
                            {r.email && (
                              <p className="text-[8px] text-tv-text-decorative truncate">{r.email}</p>
                            )}
                          </div>
                          <Plus size={10} className="text-tv-brand shrink-0" />
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-3 text-center">
                        <p className="text-[9px] text-tv-text-decorative">No matching constituents found</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Empty state hint when no search */}
                {!constituentSearch.trim() && addedPreviewUsers.length === 0 && (
                  <div className="px-3 py-3 text-center">
                    <UserPlus size={14} className="text-tv-text-decorative mx-auto mb-1" />
                    <p className="text-[9px] text-tv-text-decorative">Search above to add preview users</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Next button */}
          <button
            onClick={goToNext}
            disabled={previewMode === "custom" || addedPreviewUsers.length === 0}
            className={`w-6 h-6 rounded-[6px] flex items-center justify-center transition-colors shrink-0 ${
              previewMode === "custom" || addedPreviewUsers.length === 0 ? "text-tv-text-decorative cursor-not-allowed" : "text-tv-brand hover:bg-tv-brand-bg/10"
            }`}
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Counter + merge field count */}
        <div className="flex items-center justify-between mt-1.5 px-1">
          {previewMode === "constituent" && addedPreviewUsers.length > 0 ? (
            <p className="text-[8px] text-tv-text-secondary">
              <span className="text-tv-text-primary" style={{ fontWeight: 600 }}>{constituentIndex + 1}</span> of <span style={{ fontWeight: 600 }}>{addedPreviewUsers.length}</span> preview user{addedPreviewUsers.length !== 1 ? "s" : ""}
            </p>
          ) : previewMode === "custom" ? (
            <p className="text-[8px] text-tv-text-secondary">Editing custom test values</p>
          ) : (
            <p className="text-[8px] text-tv-text-decorative">No preview users added</p>
          )}
          {activeFieldCount > 0 && (
            <p className="text-[8px] text-tv-text-decorative">
              {activeFieldCount} merge field{activeFieldCount !== 1 ? "s" : ""} in use
            </p>
          )}
        </div>
      </div>

      {/* Collapsible custom test constituent form — only in custom mode */}
      {previewMode === "custom" && showTestForm && (
        <div className="px-4 py-3 bg-tv-surface/40 border-b border-tv-border-divider space-y-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[9px] text-tv-text-secondary">
              Enter test values for merge fields to preview how your message will look.
            </p>
            <button
              onClick={() => setTestConstituent(DEFAULT_TEST_CONSTITUENT)}
              className="text-[8px] text-tv-brand hover:underline shrink-0 ml-2"
            >
              Reset
            </button>
          </div>
          {allMergeFields.map(field => {
            const isUsed = usedFields.includes(field.key);
            return (
              <div key={field.key} className="flex items-center gap-2">
                <div className="w-[90px] shrink-0 flex items-center gap-1.5">
                  <span className={`text-[9px] ${isUsed ? "text-tv-text-primary" : "text-tv-text-decorative"}`} style={{ fontWeight: isUsed ? 600 : 400 }}>
                    {field.label}
                  </span>
                  {isUsed && (
                    <span className="w-1.5 h-1.5 rounded-full bg-tv-brand-bg shrink-0" title="Used in content" />
                  )}
                </div>
                <input
                  value={testConstituent[field.key] || ""}
                  onChange={e => updateField(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={`flex-1 border rounded-[6px] px-2 py-1 text-[10px] outline-none focus:ring-1 focus:ring-tv-brand/40 transition-colors ${
                    isUsed
                      ? "border-tv-brand-bg/30 bg-white focus:ring-2 focus:ring-tv-brand-bg/20 text-tv-text-primary"
                      : "border-tv-border-light bg-tv-surface/50 text-tv-text-secondary"
                  }`}
                />
                {field.isCustom && (
                  <button
                    onClick={() => removeCustomField(field.key)}
                    className="w-5 h-5 rounded-[4px] flex items-center justify-center text-tv-text-decorative hover:text-tv-error hover:bg-tv-error/10 transition-colors shrink-0"
                    title="Remove custom field"
                  >
                    <Trash2 size={9} />
                  </button>
                )}
              </div>
            );
          })}

          {/* ── + Add Merge Field form ── */}
          {showAddFieldForm ? (
            <div className="mt-1 p-2.5 rounded-[8px] border border-tv-brand-bg/20 bg-tv-brand-tint/20 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[9px] text-tv-text-primary" style={{ fontWeight: 600 }}>New Merge Field</p>
                <button
                  onClick={() => { setShowAddFieldForm(false); setNewFieldLabel(""); setNewFieldPlaceholder(""); }}
                  className="w-4 h-4 rounded-[4px] flex items-center justify-center text-tv-text-decorative hover:text-tv-text-secondary transition-colors"
                >
                  <X size={9} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-[90px] shrink-0">
                  <span className="text-[9px] text-tv-text-secondary" style={{ fontWeight: 500 }}>Label</span>
                </div>
                <input
                  ref={addFieldInputRef}
                  value={newFieldLabel}
                  onChange={e => setNewFieldLabel(e.target.value)}
                  placeholder="e.g. Graduation Year"
                  onKeyDown={e => { if (e.key === "Enter") addCustomField(); }}
                  className="flex-1 border border-tv-brand-bg/30 rounded-[6px] px-2 py-1 text-[10px] bg-white text-tv-text-primary outline-none focus:ring-2 focus:ring-tv-brand-bg/20"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-[90px] shrink-0">
                  <span className="text-[9px] text-tv-text-secondary" style={{ fontWeight: 500 }}>Test Value</span>
                </div>
                <input
                  value={newFieldPlaceholder}
                  onChange={e => setNewFieldPlaceholder(e.target.value)}
                  placeholder="e.g. 2024"
                  onKeyDown={e => { if (e.key === "Enter") addCustomField(); }}
                  className="flex-1 border border-tv-border-light rounded-[6px] px-2 py-1 text-[10px] bg-white text-tv-text-primary outline-none focus:ring-2 focus:ring-tv-brand-bg/20"
                />
              </div>
              {newFieldLabel.trim() && (
                <div className="flex items-center gap-1.5 px-1">
                  <span className="text-[8px] text-tv-text-decorative">Merge tag:</span>
                  <code className="text-[8px] px-1.5 py-0.5 rounded-[4px] bg-tv-surface border border-tv-border-light text-tv-brand" style={{ fontWeight: 600 }}>
                    {"{{"}{ newFieldLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") }{"}}"}
                  </code>
                </div>
              )}
              <div className="flex justify-end gap-1.5 pt-0.5">
                <button
                  onClick={() => { setShowAddFieldForm(false); setNewFieldLabel(""); setNewFieldPlaceholder(""); }}
                  className="px-2.5 py-1 rounded-[6px] text-[9px] text-tv-text-secondary border border-tv-border-light hover:bg-tv-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addCustomField}
                  disabled={!newFieldLabel.trim() || allMergeFields.some(f => f.key === newFieldLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""))}
                  className="px-2.5 py-1 rounded-full text-[9px] text-white bg-tv-brand-bg hover:bg-tv-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  style={{ fontWeight: 600 }}
                >
                  <Check size={9} />Add Field
                </button>
              </div>
              {newFieldLabel.trim() && allMergeFields.some(f => f.key === newFieldLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")) && (
                <p className="text-[8px] text-tv-error">A field with this key already exists.</p>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowAddFieldForm(true)}
              className="mt-0.5 flex items-center gap-1 text-[9px] text-tv-brand hover:text-tv-brand-bg/80 transition-colors"
              style={{ fontWeight: 500 }}
            >
              <Plus size={10} />Add merge field
            </button>
          )}

          <div className="border-t border-tv-border-divider pt-1.5 mt-1">
            <p className="text-[8px] text-tv-text-decorative flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-tv-brand-bg inline-block" />
              Fields with dots are currently used in your subject or body
            </p>
            {customFields.length > 0 && (
              <p className="text-[8px] text-tv-text-decorative mt-0.5">
                {customFields.length} custom field{customFields.length !== 1 ? "s" : ""} added
              </p>
            )}
          </div>
        </div>
      )}

      {/* Preview canvas */}
      <div className="px-4 py-5 lg:px-5 lg:py-6 bg-tv-surface/40 flex justify-center">
        <div className={`${smsMode ? (device === "tablet" ? "w-full max-w-[500px]" : "w-[280px]") : deviceWidths[device]} transition-all duration-300 mx-auto`}>

          {/* ══════════════════════════════════════════════════════════════════
               LANDING PAGE PREVIEW TAB
             ══════════════════════════════════════════════════════════════════ */}
          {!smsMode && previewTab === "landing" && (() => {
            const fallbackLp = allLandingPageDesigns[0] || LANDING_PAGES[0];
            const lpColor = landingPageColor || fallbackLp.color;
            const lpAccent = landingPageAccent || fallbackLp.accent;
            const lpImage = landingPageImage || fallbackLp.image;
            const envColor = envelope.color;
            const envAccent = envelope.accent;
            const envNameCol = (envelope as any).nameColor || (isDarkColor(envColor) ? "#ffffff" : "#1e293b");
            const isMobile = device === "mobile";
            const isTab = device === "tablet";

            const fmtName = envNameFormat === "[First Name]" ? effectiveTestConstituent.first_name
              : envNameFormat === "[Title] [Last Name]" ? "Mr. " + effectiveTestConstituent.last_name
              : envNameFormat === "[Full Name]" ? effectiveTestConstituent.first_name + " " + effectiveTestConstituent.last_name
              : envNameFormat === "[First Name] [Last Name]" ? effectiveTestConstituent.first_name + " " + effectiveTestConstituent.last_name
              : "Mr. " + effectiveTestConstituent.first_name + " " + effectiveTestConstituent.last_name;
            const personLines: string[] = [];
            if (envTextBefore) personLines.push(envTextBefore);
            personLines.push(fmtName);
            if (envTextAfter) personLines.push(envTextAfter);
            const nameString = fmtName;

            return (
              <div className="bg-white rounded-[12px] border border-tv-border-light shadow-lg overflow-hidden">
                {/* Organization header */}
                <div className="px-4 py-3 border-b border-tv-border-divider flex items-center gap-2.5 bg-white">
                  <div className="w-7 h-7 rounded-[6px] flex items-center justify-center" style={{ backgroundColor: lpColor }}>
                    <span className="text-white text-[10px]" style={{ fontWeight: 800 }}>E</span>
                  </div>
                  <span className={`text-tv-text-primary ${isMobile ? "text-[12px]" : "text-[13px]"}`} style={{ fontWeight: 700 }}>evertrue</span>
                </div>

                {/* Video / Background area with envelope overlay */}
                <div className={`relative ${isMobile ? "aspect-[4/3]" : "aspect-[16/10]"}`}
                  style={{ background: `linear-gradient(135deg, ${lpColor}, ${lpAccent})` }}>
                  {lpImage && (
                    <img src={lpImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />

                  {/* Envelope floating on video area */}
                  <div className="absolute inset-0 flex items-center justify-center p-5">
                    <div
                      className={`relative shadow-2xl overflow-hidden rounded-[2px] ${isMobile ? "w-[82%] max-w-[260px]" : isTab ? "w-[60%] max-w-[300px]" : "w-[56%] max-w-[340px]"}`}
                      style={{ backgroundColor: envColor, aspectRatio: "16/10" }}>
                      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: PAPER_TEXTURE, backgroundSize: "200px 200px", mixBlendMode: "overlay" }} />
                      {/* Holiday graphic decorations */}
                      {(envelope as any).holidayType && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                          <HolidayGraphic type={(envelope as any).holidayType} size={isMobile ? 60 : isTab ? 80 : 100} color={envAccent} />
                        </div>
                      )}
                      {/* Perforated stamp — top right */}
                      <div className={`absolute ${isMobile ? "top-2 right-2" : "top-3 right-3"}`}>
                        <PerforatedStamp size={isMobile ? 36 : isTab ? 44 : 52} accentColor={envAccent} />
                      </div>
                      {/* Postmark circle — top left */}
                      <div className={`absolute ${isMobile ? "top-[5%] left-[4%]" : "top-[5%] left-[4%]"}`}>
                        <svg width={isMobile ? 32 : isTab ? 40 : 48} height={isMobile ? 32 : isTab ? 40 : 48} viewBox="0 0 48 48" fill="none">
                          <circle cx="24" cy="24" r="18" stroke={envAccent} strokeWidth="1.2" opacity={0.3} />
                          <circle cx="24" cy="24" r="14" stroke={envAccent} strokeWidth="0.6" opacity={0.2} />
                          <line x1="4" y1="24" x2="44" y2="24" stroke={envAccent} strokeWidth="0.6" opacity={0.2} />
                          <text x="24" y="21" textAnchor="middle" fill={envAccent} opacity={0.35} style={{ fontSize: "5px", fontWeight: 600, letterSpacing: "0.08em" }}>THANK YOU</text>
                          <text x="24" y="29" textAnchor="middle" fill={envAccent} opacity={0.25} style={{ fontSize: "3.5px", letterSpacing: "0.05em" }}>THANKVIEW</text>
                        </svg>
                      </div>
                      {/* Constituent name centered */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <div className="text-center space-y-0">
                          {personLines.map((line, i) => (
                            <p key={i} style={{
                              color: line === nameString ? envNameCol : (isDarkColor(envColor) ? "rgba(255,255,255,0.55)" : "rgba(30,41,59,0.45)"),
                              fontSize: line === nameString ? (isMobile ? "12px" : isTab ? "15px" : "18px") : (isMobile ? "8px" : "10px"),
                              fontWeight: line === nameString ? 500 : 400,
                              fontStyle: line === nameString ? "italic" : "normal",
                              lineHeight: "1.5",
                              letterSpacing: line === nameString ? "0.02em" : "0",
                            }}>
                              {line}
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
                    {senderName || "Erin Beler"}
                  </p>
                  <p className={`text-tv-text-secondary text-center leading-relaxed ${isMobile ? "text-[10px] mb-3" : "text-[12px] mb-4"}`}>
                    {resolvedBody.slice(0, 120)}{resolvedBody.length > 120 ? "…" : ""}
                  </p>

                  {/* CTA Button */}
                  {ctaText && (
                    <div className="text-center mb-4">
                      <span className={`inline-block px-6 py-2.5 rounded-[8px] text-white transition-colors ${isMobile ? "text-[11px]" : "text-[13px]"}`}
                        style={{ backgroundColor: btnBg || lpColor, color: btnText || "#ffffff", fontWeight: 600 }}>
                        {isVideoRequest ? "Record Your Video" : ctaText}
                      </span>
                    </div>
                  )}

                  {/* PDF viewer block */}
                  {pdfFileName && (
                    <div className={`mb-4 rounded-[10px] border border-tv-border-light bg-tv-surface overflow-hidden ${isMobile ? "mx-1" : "mx-2"}`}>
                      <div className={`flex flex-col items-center justify-center ${isMobile ? "py-6 gap-2" : "py-8 gap-2.5"}`}>
                        <div className={`rounded-[10px] bg-tv-surface-active flex items-center justify-center ${isMobile ? "w-10 h-10" : "w-12 h-12"}`}>
                          <FileText size={isMobile ? 18 : 22} className="text-tv-text-secondary" />
                        </div>
                        <p className={`text-tv-text-primary text-center truncate max-w-[85%] ${isMobile ? "text-[10px]" : "text-[12px]"}`} style={{ fontWeight: 600 }}>{pdfFileName}</p>
                        <p className={`text-tv-text-decorative ${isMobile ? "text-[8px]" : "text-[9px]"}`}>{pdfPages || 12} pages · {pdfSize || "2.4 MB"}</p>
                        <span className={`inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-white ${isMobile ? "text-[9px]" : "text-[11px]"}`}
                          style={{ backgroundColor: btnBg || lpColor, fontWeight: 500 }}>
                          <FileText size={isMobile ? 9 : 11} />View PDF
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Form embed placeholder */}
                  {formUrl && (
                    <div className={`mb-4 border-2 border-dashed border-tv-border-light rounded-[10px] flex flex-col items-center justify-center gap-1.5 ${isMobile ? "mx-3 py-8" : "mx-6 py-12"}`}>
                      <FormInput size={isMobile ? 14 : 18} className="text-tv-text-decorative" />
                      <p className={`text-tv-text-primary ${isMobile ? "text-[9px]" : "text-[11px]"}`} style={{ fontWeight: 600 }}>Embedded Form</p>
                      <p className={`text-tv-text-decorative ${isMobile ? "text-[7px]" : "text-[9px]"}`}>Form will appear here</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className={`flex items-center justify-center ${isMobile ? "flex-wrap gap-1.5" : "gap-2.5"}`}>
                    {allowVideoReply !== false && (
                      <span className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] border text-[11px]`}
                        style={{ borderColor: btnBg || lpColor, color: btnBg || lpColor, fontWeight: 500 }}>
                        <Camera size={11} />Record Reply
                      </span>
                    )}
                    {allowEmailReply !== false && (
                      <span className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] border text-[11px]`}
                        style={{ borderColor: btnBg || lpColor, color: btnBg || lpColor, fontWeight: 500 }}>
                        <Reply size={11} />Reply
                      </span>
                    )}
                    {allowSaveButton !== false && (
                      <span className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] text-white text-[11px]`}
                        style={{ backgroundColor: "#22c55e", fontWeight: 500 }}>
                        <Download size={11} />Save
                      </span>
                    )}
                    {allowShareButton !== false && (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] border border-tv-border-light text-tv-text-primary text-[11px]" style={{ fontWeight: 500 }}>
                        Share <ExternalLink size={9} />
                      </span>
                    )}
                    {allowDownloadVideo !== false && (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] border border-tv-border-light text-tv-text-primary text-[11px]" style={{ fontWeight: 500 }}>
                        <Download size={11} />Download
                      </span>
                    )}
                  </div>
                  {closedCaptionsEnabled !== false && (
                    <div className="flex items-center justify-center gap-1 mt-3">
                      <Captions size={10} className="text-tv-text-secondary" />
                      <span className="text-[9px] text-tv-text-secondary">Closed captions enabled</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-tv-border-divider flex items-center justify-between bg-tv-surface/30">
                  <button className="text-[10px] text-tv-info hover:underline transition-colors">Privacy Policy</button>
                  <span className="text-[9px] text-tv-text-decorative italic">by <span style={{ fontWeight: 600 }}>thankview</span></span>
                </div>
              </div>
            );
          })()}

          {/* ══════════════════════════════════════════════════════════════════
               EMAIL PREVIEW TAB (+ SMS — existing code)
             ══════════════════════════════════════════════════════════════════ */}
          {(smsMode || previewTab === "email") && (() => { return (<>

          {/* ── SMS preview (device-differentiated) ── */}
          {smsMode ? (() => {
            const resolvedSms = resolveMergeFields(
              smsBody || "Hi {{first_name}}! Thank you for your support.",
              effectiveTestConstituent,
            );
            const hasLink = resolvedSms.includes("thankview.com") || (smsBody || "").includes("{{link}}");
            const senderInitial = (smsPhoneNumber || "TV")[0].toUpperCase();

            const isTabletView = device === "tablet";
            const shellRound = isTabletView ? "rounded-[28px]" : "rounded-[38px]";
            const shellPad = isTabletView ? "p-[5px]" : "p-[6px]";
            const bezelRound = isTabletView ? "rounded-[24px]" : "rounded-[32px]";
            const bubbleMaxW = isTabletView ? "max-w-[55%]" : "max-w-[80%]";
            const linkMaxW = isTabletView ? "max-w-[55%]" : "max-w-[80%]";
            const msgPadX = isTabletView ? "px-6" : "px-3";
            const navPadX = isTabletView ? "px-4" : "px-2.5";
            const statusPadX = isTabletView ? "px-8" : "px-6";
            const minMsgH = isTabletView ? "min-h-[300px]" : "min-h-[220px]";
            const inputPadX = isTabletView ? "px-4" : "px-2.5";
            const homeW = isTabletView ? "w-[100px]" : "w-[80px]";
            const frameWidth = isTabletView ? "w-full" : "w-[270px]";

            const phoneFrame = (
            <div className={`${frameWidth} mx-auto`}>
              <div className={`relative ${shellRound} bg-[#1c1c1e] ${shellPad} shadow-[0_8px_40px_rgba(0,0,0,0.25)]`}>
                {!isTabletView && (
                  <>
                    <div className="absolute -left-[2px] top-[72px] w-[2px] h-[14px] rounded-l-[2px] bg-[#2c2c2e]" />
                    <div className="absolute -left-[2px] top-[100px] w-[2px] h-[26px] rounded-l-[2px] bg-[#2c2c2e]" />
                    <div className="absolute -left-[2px] top-[132px] w-[2px] h-[26px] rounded-l-[2px] bg-[#2c2c2e]" />
                    <div className="absolute -right-[2px] top-[108px] w-[2px] h-[32px] rounded-r-[2px] bg-[#2c2c2e]" />
                  </>
                )}
                {isTabletView && (
                  <>
                    <div className="absolute -right-[2px] top-[40px] w-[2px] h-[28px] rounded-r-[2px] bg-[#2c2c2e]" />
                    <div className="absolute top-[8px] left-1/2 -translate-x-1/2 w-[2px] h-[16px] rounded-t-[2px] bg-[#2c2c2e] rotate-90" />
                  </>
                )}
                <div className={`${bezelRound} overflow-hidden bg-white`}>
                  <div className="flex justify-center pt-[6px] pb-[2px] bg-white">
                    <div className={`${isTabletView ? "w-[8px] h-[8px] rounded-full" : "w-[72px] h-[18px] rounded-full"} bg-[#1c1c1e]`} />
                  </div>
                  <div className={`flex items-center justify-between ${statusPadX} pt-[2px] pb-[6px] bg-white`}>
                    <span style={{ fontSize: isTabletView ? "11px" : "10px", fontWeight: 600 }} className="text-[#1c1c1e] tabular-nums">9:41</span>
                    <div className="flex items-center gap-[3px]">
                      <Signal size={isTabletView ? 10 : 9} className="text-[#1c1c1e]" />
                      <Wifi size={isTabletView ? 11 : 10} className="text-[#1c1c1e]" />
                      <Battery size={isTabletView ? 13 : 12} className="text-[#1c1c1e]" />
                    </div>
                  </div>
                  <div className={`flex items-center justify-between ${navPadX} pb-2 bg-white border-b border-[#c6c6c8]`}>
                    <button className="flex items-center gap-0.5 text-[#007aff]">
                      <ChevronLeft size={isTabletView ? 16 : 14} strokeWidth={2.5} />
                      <span style={{ fontSize: isTabletView ? "11px" : "10px" }}>Back</span>
                    </button>
                    <div className="flex flex-col items-center gap-0.5">
                      <div className={`${isTabletView ? "w-[32px] h-[32px]" : "w-[28px] h-[28px]"} rounded-full bg-[#c7c7cc] flex items-center justify-center`}>
                        <span style={{ fontSize: isTabletView ? "13px" : "12px", fontWeight: 600 }} className="text-white">{senderInitial}</span>
                      </div>
                      <span style={{ fontSize: isTabletView ? "10px" : "9px", fontWeight: 600 }} className={`text-[#1c1c1e] ${isTabletView ? "max-w-[200px]" : "max-w-[120px]"} truncate`}>
                        {smsPhoneNumber || "ThankView"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`${isTabletView ? "w-[26px] h-[26px]" : "w-[22px] h-[22px]"} rounded-full bg-[#f2f2f7] flex items-center justify-center`}>
                        <Phone size={isTabletView ? 11 : 10} className="text-[#007aff]" />
                      </div>
                      <div className={`${isTabletView ? "w-[26px] h-[26px]" : "w-[22px] h-[22px]"} rounded-full bg-[#f2f2f7] flex items-center justify-center`}>
                        <Video size={isTabletView ? 11 : 10} className="text-[#007aff]" />
                      </div>
                    </div>
                  </div>
                  <div className={`bg-white ${minMsgH} flex flex-col`}>
                    <div className="text-center pt-3 pb-1.5">
                      <span style={{ fontSize: isTabletView ? "9px" : "8px", fontWeight: 500 }} className="text-[#8e8e93] bg-[#f2f2f7] px-2 py-0.5 rounded-full">Today 9:41 AM</span>
                    </div>
                    <div className={`${msgPadX} pt-1.5 pb-1 flex justify-start`}>
                      <div className={`relative ${bubbleMaxW}`}>
                        <div className={`bg-[#34c759] rounded-[16px] rounded-bl-[4px] ${isTabletView ? "px-4 py-2.5" : "px-3 py-2"} shadow-sm`}>
                          <p style={{ fontSize: isTabletView ? "13px" : "11px", lineHeight: "1.45" }} className="text-white whitespace-pre-wrap">{resolvedSms}</p>
                        </div>
                        <svg className="absolute -bottom-[1px] -left-[5px]" width="12" height="10" viewBox="0 0 12 10" fill="none">
                          <path d="M12 0C12 0 5.5 0 2 3.5C0 5.5 0 10 0 10C0 10 2 6.5 5.5 5C8 4 12 4 12 4V0Z" fill="#34c759" />
                        </svg>
                      </div>
                    </div>
                    {hasLink && (
                      <div className={`${msgPadX} pt-1 pb-1 flex justify-start`}>
                        <div className={linkMaxW}>
                          <div className="bg-[#f2f2f7] rounded-[12px] overflow-hidden border border-[#e5e5ea] shadow-sm">
                            <div className={`bg-gradient-to-br from-[#7c45b0]/15 to-[#7c45b0]/5 ${isTabletView ? "h-[80px]" : "h-[60px]"} flex items-center justify-center`}>
                              <div className={`${isTabletView ? "w-8 h-8" : "w-7 h-7"} rounded-full bg-[#7c45b0] flex items-center justify-center shadow-sm`}>
                                <Play size={isTabletView ? 10 : 9} className="text-white ml-[1px]" fill="white" />
                              </div>
                            </div>
                            <div className={`${isTabletView ? "px-3 py-2" : "px-2.5 py-1.5"}`}>
                              <p style={{ fontSize: isTabletView ? "10px" : "9px", fontWeight: 600 }} className="text-[#1c1c1e]">ThankView</p>
                              <p style={{ fontSize: isTabletView ? "9px" : "8px" }} className="text-[#8e8e93]">A personal video message for you</p>
                              <p style={{ fontSize: isTabletView ? "8px" : "7px" }} className="text-[#007aff] mt-0.5">thankview.com</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className={`${msgPadX} pt-0.5 pb-1 flex justify-start`}>
                      <p style={{ fontSize: isTabletView ? "8px" : "7px", fontWeight: 500 }} className="text-[#8e8e93] pl-1">Delivered</p>
                    </div>
                    <div className="flex-1 min-h-[20px]" />
                    <div className="text-center pb-2">
                      <span style={{ fontSize: isTabletView ? "8px" : "7px" }} className="text-[#8e8e93] italic">Reply STOP to unsubscribe</span>
                    </div>
                  </div>
                  <div className={`flex items-end gap-1.5 ${inputPadX} py-2 border-t border-[#c6c6c8] bg-[#f9f9f9]`}>
                    <div className="w-[24px] h-[24px] rounded-full bg-[#007aff] flex items-center justify-center shrink-0 mb-[1px]">
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="white">
                        <path d="M8 2v12M2 8h12" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className="flex-1 flex items-center bg-white border border-[#c6c6c8] rounded-full px-3 py-[5px]">
                      <span style={{ fontSize: isTabletView ? "11px" : "10px" }} className="text-[#c7c7cc]">Text Message</span>
                    </div>
                    <div className="w-[24px] h-[24px] flex items-center justify-center shrink-0 mb-[1px]">
                      <svg width="11" height="14" viewBox="0 0 11 14" fill="none">
                        <rect x="3" y="0" width="5" height="9" rx="2.5" stroke="#007aff" strokeWidth="1.3" />
                        <path d="M0.5 6.5C0.5 9 2.5 11 5.5 11C8.5 11 10.5 9 10.5 6.5" stroke="#007aff" strokeWidth="1.3" strokeLinecap="round" />
                        <line x1="5.5" y1="11" x2="5.5" y2="13.5" stroke="#007aff" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex justify-center py-[6px] bg-[#f9f9f9]">
                    <div className={`${homeW} h-[3px] bg-[#1c1c1e] rounded-full`} />
                  </div>
                </div>
              </div>
            </div>
            );

            if (device === "desktop") {
              return (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-[10px] bg-tv-info/8 border border-tv-info/15">
                    <Info size={13} className="text-tv-info shrink-0" />
                    <p className="text-[10px] text-tv-text-secondary leading-snug">
                      <span className="text-tv-text-primary" style={{ fontWeight: 600 }}>SMS messages are received on mobile devices</span>
                      {" "}&mdash; showing mobile preview.
                    </p>
                  </div>
                  {phoneFrame}
                </div>
              );
            }

            return phoneFrame;
          })() : (
          /* ── Email preview ── */
          (() => {
            const envColor = envelope.color;
            const envAccent = envelope.accent;
            const envNameCol = (envelope as any).nameColor || (isDarkColor(envColor) ? "#ffffff" : "#1e293b");
            const envDark = isDarkColor(envColor);
            const isMob = device === "mobile";

            const fmtNameEmail = envNameFormat === "[First Name]" ? effectiveTestConstituent.first_name
              : envNameFormat === "[Title] [Last Name]" ? "Mr. " + effectiveTestConstituent.last_name
              : envNameFormat === "[Full Name]" ? effectiveTestConstituent.first_name + " " + effectiveTestConstituent.last_name
              : envNameFormat === "[First Name] [Last Name]" ? effectiveTestConstituent.first_name + " " + effectiveTestConstituent.last_name
              : "Mr. " + effectiveTestConstituent.first_name + " " + effectiveTestConstituent.last_name;
            const emailPersonLines: string[] = [];
            if (envTextBefore) emailPersonLines.push(envTextBefore);
            emailPersonLines.push(fmtNameEmail);
            if (envTextAfter) emailPersonLines.push(envTextAfter);

            return (
          <div className="bg-white rounded-[10px] lg:rounded-[12px] border border-tv-border-light shadow-sm overflow-hidden">
            {/* Email client chrome */}
            <div className="px-3.5 py-2.5 lg:px-4 lg:py-3 border-b border-tv-border-divider bg-tv-surface/30 space-y-0.5 lg:space-y-1">
              <p className="text-[10px] lg:text-[11px] text-tv-text-secondary leading-relaxed">From: <span className="text-tv-text-primary" style={{ fontWeight: 500 }}>{senderName || "Sender"} &lt;{senderEmail || "email@example.com"}&gt;</span></p>
              <p className="text-[10px] lg:text-[11px] text-tv-text-secondary leading-relaxed">Subject: <span className="text-tv-text-primary" style={{ fontWeight: 500 }}>{resolvedSubject}</span></p>
            </div>

            {/* 1) CTA Button — "View Your ThankView" */}
            <div className="flex justify-center px-4 pt-5 pb-3 lg:px-5 lg:pt-6 lg:pb-4">
              <div className="px-7 py-3 lg:px-8 lg:py-3.5 rounded-[8px] text-[11px] lg:text-[12px] text-center cursor-pointer shadow-sm transition-transform hover:scale-[1.02]" style={{ backgroundColor: btnBg, color: btnText, fontWeight: 600 }}>
                {isVideoRequest ? "Record Your Video" : (ctaText || "View Your ThankView")}
              </div>
            </div>

            {/* 2) Full envelope front — pixel-perfect with stamp, texture, postmark, name */}
            <div className="flex justify-center px-4 pb-4 lg:px-5 lg:pb-5">
              <div
                className={`relative overflow-hidden shadow-lg ${isMob ? "w-[90%]" : "w-[80%]"}`}
                style={{ backgroundColor: envColor, aspectRatio: "16/10", boxShadow: "4px 6px 20px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.06)" }}
              >
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: PAPER_TEXTURE, backgroundSize: "200px 200px", mixBlendMode: "overlay" }} />
                {(envelope as any).holidayType && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <HolidayGraphic type={(envelope as any).holidayType} size={isMob ? 50 : 70} color={envAccent} />
                  </div>
                )}
                <div className={`absolute ${isMob ? "top-[6%] right-[4%]" : "top-[6%] right-[4%]"}`}>
                  <PerforatedStamp size={isMob ? 32 : 44} accentColor={envAccent} />
                </div>
                <div className={`absolute ${isMob ? "top-[5%] left-[4%]" : "top-[5%] left-[4%]"}`}>
                  <svg width={isMob ? 36 : 48} height={isMob ? 36 : 48} viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="24" r="18" stroke={envAccent} strokeWidth="1.2" opacity={0.3} />
                    <circle cx="24" cy="24" r="14" stroke={envAccent} strokeWidth="0.6" opacity={0.2} />
                    <line x1="4" y1="24" x2="44" y2="24" stroke={envAccent} strokeWidth="0.6" opacity={0.2} />
                    <text x="24" y="21" textAnchor="middle" fill={envAccent} opacity={0.35} style={{ fontSize: "5px", fontWeight: 600, letterSpacing: "0.08em" }}>THANK YOU</text>
                    <text x="24" y="29" textAnchor="middle" fill={envAccent} opacity={0.25} style={{ fontSize: "3.5px", letterSpacing: "0.05em" }}>THANKVIEW</text>
                  </svg>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-center space-y-0">
                    {emailPersonLines.map((line, i) => {
                      const isName = line === fmtNameEmail;
                      return (
                        <p key={i} style={{
                          color: isName ? envNameCol : (envDark ? "rgba(255,255,255,0.55)" : "rgba(30,41,59,0.45)"),
                          fontSize: isName ? (isMob ? "13px" : "16px") : (isMob ? "8px" : "10px"),
                          fontWeight: isName ? 500 : 400,
                          fontStyle: isName ? "italic" : "normal",
                          lineHeight: "1.5",
                          letterSpacing: isName ? "0.02em" : "0",
                        }}>
                          {line}
                        </p>
                      );
                    })}
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-[8%] pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.06), transparent)" }} />
              </div>
            </div>

            {/* 3) Email body */}
            <div className="px-4 py-3.5 lg:px-5 lg:py-4 border-t border-tv-border-divider/50" style={{
              fontFamily: bodyFontFamily || fontFamily,
              fontSize: bodyFontSize ? `${Math.max(9, Math.round(bodyFontSize * 0.78))}px` : undefined,
              color: bodyTextColor || undefined,
              lineHeight: bodyLineHeight || 1.7,
            }}>
              <div className="text-[11px] lg:text-[12px] text-tv-text-primary whitespace-pre-wrap" style={{ fontSize: "inherit", color: "inherit", lineHeight: "inherit" }}>
                {fieldsWithMissingData.length > 0
                  ? resolveMergeFieldsWithHighlights(
                      body || "Dear {{first_name}},\n\nThank you for your support.",
                      effectiveTestConstituent,
                      fieldsWithMissingData,
                    )
                  : resolvedBody}
              </div>

              {/* Signature block — rendered when a signature is selected */}
              {selectedSignature && (
                <div className="mt-3 pt-2 border-t border-tv-border-divider/30">
                  <p className="text-[11px] lg:text-[12px] text-tv-text-primary" style={{ fontWeight: 500 }}>{selectedSignature.name}</p>
                  {selectedSignature.title && <p className="text-[10px] lg:text-[11px] text-tv-text-secondary">{selectedSignature.title}</p>}
                  {selectedSignature.org && <p className="text-[10px] lg:text-[11px] text-tv-text-secondary">{selectedSignature.org}</p>}
                  {selectedSignature.phone && <p className="text-[10px] lg:text-[11px] text-tv-text-secondary">{selectedSignature.phone}</p>}
                </div>
              )}
            </div>

            {/* PDF viewer block */}
            {pdfFileName && (
              <div className="mx-3 mb-4 lg:mx-4 lg:mb-5 rounded-[10px] lg:rounded-[12px] border border-tv-border-light bg-tv-surface overflow-hidden">
                <div className="flex flex-col items-center py-5 px-3 lg:py-6 lg:px-4 gap-2.5 lg:gap-3">
                  <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-[8px] lg:rounded-[10px] bg-tv-surface-active flex items-center justify-center">
                    <FileText size={22} className="text-tv-text-secondary" />
                  </div>
                  <p className="text-[11px] lg:text-[12px] text-tv-text-primary text-center truncate max-w-[85%]" style={{ fontWeight: 600 }}>
                    {pdfFileName}
                  </p>
                  <p className="text-[9px] lg:text-[10px] text-tv-text-secondary">{pdfPages || 12} pages, {pdfSize || "2.4 MB"}</p>
                  <span className="inline-flex items-center gap-1 px-3.5 py-1.5 lg:px-4 lg:py-2 rounded-full text-[10px] lg:text-[11px] text-white" style={{ fontWeight: 600, backgroundColor: btnBg || "#7c45b0" }}>
                    <ExternalLink size={9} />View PDF
                  </span>
                </div>
              </div>
            )}

            {/* Form embed placeholder */}
            {formUrl && (() => {
              const fLower = formUrl.toLowerCase();
              let platLabel = "Embedded";
              if (fLower.includes("givebutter.com")) platLabel = "Givebutter";
              else if (fLower.includes("boostmyschool.com")) platLabel = "BoostMySchool";
              else if (fLower.includes("typeform.com")) platLabel = "Typeform";
              else if (fLower.includes("jotform.com")) platLabel = "Jotform";
              else if (fLower.includes("google.com/forms") || fLower.includes("docs.google.com/forms")) platLabel = "Google Forms";
              else if (fLower.includes("wufoo.com")) platLabel = "Wufoo";
              const previewH = Math.max(60, Math.min(Math.round((formHeight ?? 600) * 0.35), 280));
              return (
                <div
                  className={`mb-4 border-2 border-dashed border-tv-border-light rounded-[10px] flex flex-col items-center justify-center gap-1.5 ${formFullWidth ? "mx-0" : "mx-4"}`}
                  style={{ height: previewH }}
                >
                  <FormInput size={18} className="text-tv-text-decorative" />
                  <p className="text-[11px] text-tv-text-primary" style={{ fontWeight: 600 }}>
                    {platLabel} Form
                  </p>
                  <p className="text-[9px] text-tv-text-decorative">
                    Form will appear here
                  </p>
                </div>
              );
            })()}

            {/* Footer */}
            <div className="px-4 py-2.5 lg:px-5 lg:py-3 border-t border-tv-border-divider text-center bg-tv-surface/20">
              <p className="text-[8px] lg:text-[9px] text-tv-text-decorative">Sent via ThankView by EverTrue &middot; <span className="underline cursor-pointer">Unsubscribe</span></p>
            </div>
          </div>
            );
          })()
          )}

          </>); })()}
        </div>
      </div>
    </div>
  );
}