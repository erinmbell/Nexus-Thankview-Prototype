import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Check, ChevronRight, ChevronDown, Users,
  Camera, Play, Circle, X, ArrowLeft, Trash2,
  CheckCircle2, AlertCircle, Upload, Grid3X3,
  Eye, Volume2, Settings, MonitorPlay, VideoOff,
  FileText, Lightbulb, Mic, Square, Search,
  Globe, ExternalLink, Copy, Link2,
  Monitor, Tablet, Smartphone, RotateCcw,
  Send, SkipForward,
  Zap, UserPlus,
  Landmark, Star, Mail, Image as ImageIcon, Droplets, Palette,
  ArrowDown, ArrowRight, ArrowDownRight, ArrowDownLeft,
  Info, Plus, Pencil,
} from "lucide-react";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import { VideoEditor, type VideoEditorData } from "../../../imports/VideoEditor";

/* ── Video data type (previously in VideoEditorModal) ── */
export interface VideoData {
  id: string;
  contactName: string;
  durationSec: number;
  trimStart: number;
  trimEnd: number;
  rotation: 0 | 90 | 180 | 270;
  cropPreset: string;
  flipH: boolean;
  flipV: boolean;
  title: string;
  description: string;
  tags: string[];
  folder: string;
  captionLang: string;
  captionSize: "small" | "medium" | "large";
  captionPosition: "bottom" | "top";
  captionTextColor: string;
  captionBgColor: string;
  captionBgOpacity: number;
}

function createDefaultVideoData(contactName: string, durationSec: number): VideoData {
  return {
    id: crypto.randomUUID(),
    contactName,
    durationSec,
    trimStart: 0,
    trimEnd: durationSec,
    rotation: 0,
    cropPreset: "original",
    flipH: false,
    flipV: false,
    title: `Video for ${contactName}`,
    description: "",
    tags: [],
    folder: "",
    captionLang: "en",
    captionSize: "medium",
    captionPosition: "bottom",
    captionTextColor: "#ffffff",
    captionBgColor: "#000000",
    captionBgOpacity: 60,
  };
}
import { TV } from "../../theme";
import { useToast } from "../../contexts/ToastContext";
import { INIT_CONTACTS, buildMergeFields } from "../../data/contacts";
import { EnvelopePreview } from "../../components/EnvelopePreview";
import { AddRecipientsPanel, type RecipientEntry } from "../../../imports/AddRecipientsPanel";

/* ── Adapt shared contacts ── */
interface RecorderContact {
  id: number;
  name: string;
  email: string;
  avatar: string;
  color: string;
  tags: string[];
  givingLevel: string;
  mergeFields: Record<string, string>;
}

const ALL_CONTACTS: RecorderContact[] = INIT_CONTACTS.map(c => ({
  id: c.id,
  name: `${c.first} ${c.last}`,
  email: c.email,
  avatar: c.avatar,
  color: c.color,
  tags: c.tags,
  givingLevel: c.givingLevel,
  mergeFields: buildMergeFields(c),
})).sort((a, b) => a.name.localeCompare(b.name));

/* ── Lists & filter helpers ── */
const SAVED_LISTS = [
  { id: 1, name: "Spring Gala Invitees", contactIds: [1, 5, 8, 11, 13, 17, 19, 23, 28, 32] },
  { id: 2, name: "Major Donors – Q1 Outreach", contactIds: [1, 5, 8, 11, 13, 19, 23, 28, 32, 37] },
  { id: 3, name: "Alumni Phonathon 2025", contactIds: [2, 9, 12, 14, 15, 20, 22, 25, 27, 29, 31, 33] },
  { id: 4, name: "Board Members", contactIds: [4, 13, 17, 30, 34] },
  { id: 5, name: "New Donor Welcome", contactIds: [3, 9, 15, 25, 35] },
];



/* ── Merge field resolver ── */
function resolveScript(template: string, contact: RecorderContact): string {
  return template.replace(/\{\{(.+?)\}\}/g, (_match, key: string) => {
    const k = key.trim();
    const val = contact.mergeFields[k];
    return val && val !== "—" ? val : `{{${k}}}`;
  });
}

/* ── Device mocks ── */
const CAMERAS = [
  { id: "cam1", label: "FaceTime HD Camera" },
  { id: "cam2", label: "Logitech C920" },
  { id: "cam3", label: "External Webcam" },
];
const MICS = [
  { id: "mic1", label: "Internal Microphone" },
  { id: "mic2", label: "AirPods Pro" },
  { id: "mic3", label: "Blue Yeti" },
  { id: "mic4", label: "External Condenser" },
];
const QUALITY_OPTIONS = ["480p", "720p", "1080p"] as const;

/* ── Types ── */
type Phase = "queue" | "record" | "upload" | "library" | "editor" | "saved" | "landing" | "review";

type SendStatus = "unsent" | "sent";

interface RecordedItem {
  contactId: number;
  videoData: VideoData;
  sendStatus: SendStatus;
}

/* ── Landing page background types ── */
type BgKind = "image" | "color" | "gradient";
type GradientDir = "to bottom" | "to right" | "to bottom right" | "to bottom left" | "to top" | "to left";

interface LpBackground {
  id: number;
  name: string;
  kind: BgKind;
  url?: string;
  color?: string;
  gradientFrom?: string;
  gradientTo?: string;
  gradientDir?: GradientDir;
}

const DEFAULT_LP_BACKGROUNDS: LpBackground[] = [
  { id: 1, kind: "image", name: "Campus Aerial", url: "https://images.unsplash.com/photo-1605221011656-10dff4f1549b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwYWVyaWFsJTIwZHJvbmUlMjBncmVlbiUyMHF1YWR8ZW58MXx8fHwxNzczMDc3OTEyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
  { id: 2, kind: "image", name: "Graduation Day", url: "https://images.unsplash.com/photo-1747836385998-91224d0fe041?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFkdWF0aW9uJTIwY2VyZW1vbnklMjBjYXBzJTIwdGhyb3duJTIwc3Vubnl8ZW58MXx8fHwxNzczMDc3OTEyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
  { id: 3, kind: "image", name: "Library Interior", url: "https://images.unsplash.com/photo-1629059465910-a5498f0bc2f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcm5hdGUlMjBjb2xsZWdlJTIwbGlicmFyeSUyMHJlYWRpbmclMjByb29tJTIwc3VubGlnaHR8ZW58MXx8fHwxNzczMDc3OTEyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
  { id: 4, kind: "image", name: "Autumn Walkway", url: "https://images.unsplash.com/photo-1742093151014-c736bdb64368?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdXR1bW4lMjB0cmVlJTIwbGluZWQlMjBjYW1wdXMlMjB3YWxrd2F5JTIwZ29sZGVuJTIwbGVhdmVzfGVufDF8fHx8MTc3MzA3NzkxM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
  { id: 5, kind: "image", name: "Spring Walkway", url: "https://images.unsplash.com/photo-1771042101874-0c109ad92fa7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVycnklMjBibG9zc29tJTIwdW5pdmVyc2l0eSUyMGNhbXB1cyUyMHNwcmluZyUyMHBhdGh3YXl8ZW58MXx8fHwxNzczMDc3OTEzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
  { id: 6, kind: "image", name: "Campus Building", url: "https://images.unsplash.com/photo-1621009047117-30b97f97965b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpdnklMjBjb3ZlcmVkJTIwYnJpY2slMjB1bml2ZXJzaXR5JTIwaGFsbCUyMGJsdWUlMjBza3l8ZW58MXx8fHwxNzczMDc3OTE3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
  { id: 100, kind: "color", name: "Deep Navy", color: "#1a1a2e" },
  { id: 101, kind: "color", name: "Warm Ivory", color: "#f5f0e8" },
  { id: 102, kind: "color", name: "Sage Green", color: "#a8c5a0" },
  { id: 103, kind: "color", name: "Soft Blush", color: "#f4d9d0" },
  { id: 200, kind: "gradient", name: "Sunset Glow", gradientFrom: "#f093fb", gradientTo: "#f5576c", gradientDir: "to bottom right" },
  { id: 201, kind: "gradient", name: "Ocean Breeze", gradientFrom: "#4facfe", gradientTo: "#00f2fe", gradientDir: "to right" },
  { id: 202, kind: "gradient", name: "Forest Mist", gradientFrom: "#0ba360", gradientTo: "#3cba92", gradientDir: "to bottom" },
  { id: 203, kind: "gradient", name: "Warm Dusk", gradientFrom: "#a18cd1", gradientTo: "#fbc2eb", gradientDir: "to bottom right" },
];

const LP_GRADIENT_DIRS: { dir: GradientDir; icon: typeof ArrowDown; label: string }[] = [
  { dir: "to bottom", icon: ArrowDown, label: "↓" },
  { dir: "to right", icon: ArrowRight, label: "→" },
  { dir: "to bottom right", icon: ArrowDownRight, label: "↘" },
  { dir: "to bottom left", icon: ArrowDownLeft, label: "↙" },
];

function lpBgCss(bg: LpBackground): string {
  if (bg.kind === "color") return bg.color || "#ffffff";
  if (bg.kind === "gradient") return `linear-gradient(${bg.gradientDir || "to bottom"}, ${bg.gradientFrom || "#000"}, ${bg.gradientTo || "#fff"})`;
  return "";
}

const LP_LOGO_OPTIONS = [
  { id: "shield" as const, label: "Shield Crest", icon: Landmark },
  { id: "star" as const, label: "Star Mark", icon: Star },
  { id: "mail" as const, label: "Letter Mark", icon: Mail },
  { id: "none" as const, label: "None", icon: X },
] as const;
type LpLogoId = (typeof LP_LOGO_OPTIONS)[number]["id"];

function lpSafeHex(hex: string): string {
  const clean = hex.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
  return "#" + clean.padEnd(6, "0");
}

function lpIsDark(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

/* ── Landing page config ── */
interface LandingPageConfig {
  headline: string;
  subheadline: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  showReply: boolean;
  showFundContext: boolean;
  envelopeIdx: number;
  /* Nav bar */
  navBarColor: string;
  logo: LpLogoId;
  logoFile: string | null;
  /* Background */
  selectedBgId: number | null;
  fadeGradient: boolean;
  /* Button colors */
  ctaTextColor: string;
  ctaBtnColor: string;
  secondaryBtnTextColor: string;
  replyBtnColor: string;
  saveBtnColor: string;
  shareBtnColor: string;
}

const DEFAULT_LP_CONFIG: LandingPageConfig = {
  headline: "A personal message for you.",
  subheadline: "We recorded this video just for you — press play to watch.",
  body: "",
  ctaLabel: "Give to the Annual Fund",
  ctaUrl: "https://give.hartwell.edu",
  showReply: true,
  showFundContext: false,
  envelopeIdx: 0,
  navBarColor: "#7c45b0",
  logo: "shield",
  logoFile: null,
  selectedBgId: 1,
  fadeGradient: true,
  ctaTextColor: "#ffffff",
  ctaBtnColor: "#7c45b0",
  secondaryBtnTextColor: "#374151",
  replyBtnColor: "#374151",
  saveBtnColor: "#7c45b0",
  shareBtnColor: "#14532d",
};

const ENVELOPE_PRESETS = [
  { title: "Hartwell Navy", envelopeColor: "#1B3461", linerColor: "#C8962A", primaryColor: "#1B3461", secondaryColor: "#C8962A", frontDesign: "swoops" as const, frontDesignColor: "#C8962A", frontLeftLogo: "shield" as const, stampSelection: "classic" as const, postmarkColor: "#C8962A", recipientNameColor: "#FFFFFF" },
  { title: "True Purple", envelopeColor: "#7c45b0", linerColor: "#C8962A", primaryColor: "#7c45b0", secondaryColor: "#C8962A", frontDesign: "swoops" as const, frontDesignColor: "#C8962A", frontLeftLogo: "shield" as const, stampSelection: "forever" as const, postmarkColor: "#FFFFFF", recipientNameColor: "#FFFFFF" },
  { title: "Heritage Maroon", envelopeColor: "#6B1E33", linerColor: "#C8962A", primaryColor: "#6B1E33", secondaryColor: "#C8962A", frontDesign: "swoops" as const, frontDesignColor: "#C8962A", frontLeftLogo: "seal" as const, stampSelection: "university" as const, postmarkColor: "#C8962A", recipientNameColor: "#C8962A" },
  { title: "Slate Minimal", envelopeColor: "#374151", linerColor: "#C8962A", primaryColor: "#374151", secondaryColor: "#C8962A", frontDesign: "none" as const, frontDesignColor: "#C8962A", frontLeftLogo: "wordmark" as const, stampSelection: "classic" as const, postmarkColor: "#C8962A", recipientNameColor: "#FFFFFF" },
];

/* (LP_BRAND_COLORS removed — replaced by per-field color pickers in accordion) */

/* ── Props ── */
interface PersonalizedRecorderProps {
  onBack: () => void;
  onRecordingAdded?: () => void;
  onOpenLibrary?: () => void;
  onDone?: () => void;
}

/* ── Word/time estimator ── */
function scriptStats(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const seconds = Math.round(words * 0.5); // ~120 wpm
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return { words, time: `${m > 0 ? m + "m " : ""}~${s}s` };
}

const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

export function PersonalizedRecorder({ onBack, onRecordingAdded, onDone }: PersonalizedRecorderProps) {
  const { show } = useToast();

  /* ── Contact selection (setup) ── */
  const [selected, setSelected] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [search, setSearch] = useState("");
  const [sessionStarted, setSessionStarted] = useState(false);

  /* ── Mid-session add state ── */
  const [showAddMidSession, setShowAddMidSession] = useState(false);

  /* ── Rapid-record settings ── */
  const [autoAdvance, setAutoAdvance] = useState(true);

  /* ── Flow state ── */
  const [phase, setPhase] = useState<Phase>("queue");
  const [currentContactId, setCurrentContactId] = useState<number | null>(null);
  const [recordings, setRecordings] = useState<RecordedItem[]>([]);
  const [editingVideo, setEditingVideo] = useState<VideoData | null>(null);
  const [editorCtx, setEditorCtx] = useState<{ name: string; duration: string } | null>(null);

  /* ── Script ── */
  const [showScript, setShowScript] = useState(false);
  const [script, setScript] = useState("");

  /* ── Recording state ── */
  const [recPhase, setRecPhase] = useState<"idle" | "countdown" | "recording">("idle");
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [camera, setCamera] = useState(CAMERAS[0].id);
  const [mic, setMic] = useState(MICS[0].id);
  const [quality, setQuality] = useState<typeof QUALITY_OPTIONS[number]>("720p");
  const [openDrop, setOpenDrop] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Upload state ── */
  const [uploaded, setUploaded] = useState(false);

  /* ── Landing page config ── */
  const [lpConfig, setLpConfig] = useState<LandingPageConfig>({ ...DEFAULT_LP_CONFIG });
  const updateLp = (patch: Partial<LandingPageConfig>) => setLpConfig(prev => ({ ...prev, ...patch }));
  const [copiedLinkId, setCopiedLinkId] = useState<number | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [landingOrigin, setLandingOrigin] = useState<"recording" | "review">("recording");

  /* ── LP builder accordion + background state ── */
  const [lpAccordion, setLpAccordion] = useState<Record<string, boolean>>({ content: true, navbar: false, background: false, buttons: false });
  const toggleLpSection = useCallback((key: string) => setLpAccordion(prev => ({ ...prev, [key]: !prev[key] })), []);
  const [lpBackgrounds, setLpBackgrounds] = useState<LpBackground[]>(DEFAULT_LP_BACKGROUNDS);
  const [lpBgTab, setLpBgTab] = useState<BgKind>("image");
  const [lpBgDragOver, setLpBgDragOver] = useState(false);
  const [lpShowUploadNaming, setLpShowUploadNaming] = useState(false);
  const [lpNewBgName, setLpNewBgName] = useState("");
  const [lpPendingBgFile, setLpPendingBgFile] = useState<string | null>(null);
  const [lpNewColorHex, setLpNewColorHex] = useState("#1a1a2e");
  const [lpNewColorName, setLpNewColorName] = useState("");
  const [lpNewGradFrom, setLpNewGradFrom] = useState("#f093fb");
  const [lpNewGradTo, setLpNewGradTo] = useState("#f5576c");
  const [lpNewGradDir, setLpNewGradDir] = useState<GradientDir>("to bottom right");
  const [lpNewGradName, setLpNewGradName] = useState("");
  const [lpRenamingId, setLpRenamingId] = useState<number | null>(null);
  const [lpRenameValue, setLpRenameValue] = useState("");
  const lpLogoInputRef = useRef<HTMLInputElement>(null);
  const lpBgInputRef = useRef<HTMLInputElement>(null);

  const lpSelectedBg = useMemo(() => lpBackgrounds.find(b => b.id === lpConfig.selectedBgId), [lpBackgrounds, lpConfig.selectedBgId]);

  const lpDeleteBg = (id: number) => {
    const bg = lpBackgrounds.find(b => b.id === id);
    setLpBackgrounds(prev => prev.filter(b => b.id !== id));
    if (lpConfig.selectedBgId === id) updateLp({ selectedBgId: null });
    if (bg) show(`"${bg.name}" removed`, "info");
  };
  const lpStartRename = (id: number) => {
    const bg = lpBackgrounds.find(b => b.id === id);
    if (bg) { setLpRenamingId(id); setLpRenameValue(bg.name); }
  };
  const lpConfirmRename = () => {
    if (lpRenamingId && lpRenameValue.trim()) {
      setLpBackgrounds(prev => prev.map(b => b.id === lpRenamingId ? { ...b, name: lpRenameValue.trim() } : b));
      setLpRenamingId(null);
    }
  };
  const handleLpLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    updateLp({ logoFile: URL.createObjectURL(file) });
    e.target.value = "";
  };

  /* ── Derived ── */
  const selectedContacts = useMemo(() => ALL_CONTACTS.filter(c => selected.includes(c.id)), [selected]);
  const currentContact = useMemo(() => ALL_CONTACTS.find(c => c.id === currentContactId) ?? null, [currentContactId]);
  const completedIds = useMemo(() => new Set(recordings.map(r => r.contactId)), [recordings]);
  const recordedCount = recordings.length;
  const unrecordedContacts = useMemo(() => selectedContacts.filter(c => !completedIds.has(c.id)), [selectedContacts, completedIds]);
  const sentCount = useMemo(() => recordings.filter(r => r.sendStatus === "sent").length, [recordings]);
  const unsentRecordings = useMemo(() => recordings.filter(r => r.sendStatus === "unsent"), [recordings]);

  /* ── Countdown effect ── */
  useEffect(() => {
    if (recPhase !== "countdown") return;
    if (countdown <= 0) { setRecPhase("recording"); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [recPhase, countdown]);

  /* ── Recording timer ── */
  useEffect(() => {
    if (recPhase === "recording") {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [recPhase]);

  /* ── Auto-advance after save ── */
  useEffect(() => {
    if (phase === "saved" && autoAdvance) {
      const t = setTimeout(() => advanceToNext(), 1200);
      return () => clearTimeout(t);
    }
  }, [phase, autoAdvance]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    if (!sessionStarted) return;
    const handler = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (phase === "record" && recPhase === "idle" && e.code === "Space") {
        e.preventDefault();
        startRecording();
      } else if (phase === "record" && recPhase === "recording" && e.code === "Space") {
        e.preventDefault();
        stopRecording();
      } else if (phase === "saved" && e.code === "ArrowRight") {
        e.preventDefault();
        advanceToNext();
      } else if (phase === "queue" && e.code === "Space") {
        e.preventDefault();
        setPhase("record");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [sessionStarted, phase, recPhase, currentContact]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Unsaved session warning ── */
  useEffect(() => {
    if (!sessionStarted || recordings.length === 0) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [sessionStarted, recordings.length]);

  /* ── Handlers ── */
  const importFromList = (listId: number) => {
    const list = SAVED_LISTS.find(l => l.id === listId);
    if (!list) return;
    const newIds = list.contactIds.filter(id => !selected.includes(id) && ALL_CONTACTS.some(c => c.id === id));
    setSelected(prev => [...prev, ...newIds]);
    show(`Added ${newIds.length} constituents from "${list.name}"`, "success");
  };

  const startSession = (overrideIds?: number[]) => {
    const ids = overrideIds ?? selected;
    const contacts = ALL_CONTACTS.filter(c => ids.includes(c.id));
    if (contacts.length === 0) return;
    if (overrideIds) { setSelected(overrideIds); setSelectAll(overrideIds.length === ALL_CONTACTS.length); }
    setSessionStarted(true);
    // Set current to first unrecorded contact
    const first = contacts.find(c => !completedIds.has(c.id)) ?? contacts[0];
    setCurrentContactId(first.id);
    setPhase("queue");
  };

  const advanceToNext = () => {
    const nextUnrecorded = unrecordedContacts.find(c => c.id !== currentContactId);
    if (nextUnrecorded) {
      setCurrentContactId(nextUnrecorded.id);
      setPhase("queue");
    } else {
      // All done — landing page first, then review
      setLandingOrigin("recording");
      setPhase("landing");
    }
  };

  const startRecording = () => { setCountdown(3); setRecPhase("countdown"); setElapsed(0); };
  const stopRecording = () => {
    setRecPhase("idle");
    if (timerRef.current) clearInterval(timerRef.current);
    const dur = Math.max(elapsed, 3);
    const name = currentContact?.name ?? "recipient";
    const vd = createDefaultVideoData(name, dur);
    setEditingVideo(vd);
    const mins = Math.floor(dur / 60);
    const secs = String(dur % 60).padStart(2, "0");
    setEditorCtx({ name: `Video for ${name}`, duration: `${mins}:${secs}` });
    setPhase("editor");
  };
  const discardRecording = () => {
    setRecPhase("idle");
    setElapsed(0);
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("queue");
  };

  const handleSaveEdited = (data: VideoEditorData) => {
    if (!currentContact) return;
    // Map VideoEditorData back to VideoData for internal storage
    const dur = data.trimEnd - data.trimStart;
    const vd = createDefaultVideoData(currentContact.name, dur);
    vd.title = data.name || `Video for ${currentContact.name}`;
    vd.description = data.description;
    vd.tags = data.tags;
    vd.folder = data.folder;
    vd.trimStart = data.trimStart;
    vd.trimEnd = data.trimEnd;
    vd.rotation = data.rotation as 0 | 90 | 180 | 270;
    const newRec: RecordedItem = {
      contactId: currentContact.id,
      videoData: { ...vd, id: crypto.randomUUID(), contactName: currentContact.name },
      sendStatus: "unsent",
    };
    setRecordings(prev => [...prev.filter(r => r.contactId !== currentContact.id), newRec]);
    setEditingVideo(null);
    setEditorCtx(null);
    setPhase("saved");
    onRecordingAdded?.();
  };

  const handleDeleteEdited = () => {
    setEditingVideo(null);
    setEditorCtx(null);
    setPhase("record");
    show("Recording discarded — re-record when ready", "info");
  };

  const handleUploadSave = () => {
    if (!currentContact) return;
    const vd = createDefaultVideoData(currentContact.name, 68);
    const newRec: RecordedItem = {
      contactId: currentContact.id,
      videoData: { ...vd, title: `Uploaded video for ${currentContact.name}` },
      sendStatus: "unsent",
    };
    setRecordings(prev => [...prev.filter(r => r.contactId !== currentContact.id), newRec]);
    setUploaded(false);
    setPhase("saved");
    onRecordingAdded?.();
  };

  const handleLibrarySelect = () => {
    if (!currentContact) return;
    const vd = createDefaultVideoData(currentContact.name, 45);
    const newRec: RecordedItem = {
      contactId: currentContact.id,
      videoData: { ...vd, title: `Library video for ${currentContact.name}` },
      sendStatus: "unsent",
    };
    setRecordings(prev => [...prev.filter(r => r.contactId !== currentContact.id), newRec]);
    setPhase("saved");
    onRecordingAdded?.();
  };

  const sendToContact = (contactId: number) => {
    const c = ALL_CONTACTS.find(x => x.id === contactId)!;
    setRecordings(prev => prev.map(r => r.contactId === contactId ? { ...r, sendStatus: "sent" as SendStatus } : r));
    show(`Video sent to ${c.name}!`, "success");
  };

  const sendAllUnsent = () => {
    setRecordings(prev => prev.map(r => r.sendStatus === "unsent" ? { ...r, sendStatus: "sent" as SendStatus } : r));
    show(`Sent ${unsentRecordings.length} video${unsentRecordings.length !== 1 ? "s" : ""}!`, "success");
  };

  const stats = scriptStats(script);
  const resolvedScript = currentContact && script ? resolveScript(script, currentContact) : script;

  /* ── Dropdown helper (for camera toolbar) ── */
  const ToolbarBtn = ({ id, icon, label, children }: { id: string; icon: React.ReactNode; label: string; children: React.ReactNode }) => (
    <div className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpenDrop(openDrop === id ? null : id); }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[12px] transition-all hover:bg-black/5"
        style={{ fontWeight: 500, color: TV.textSecondary }}
      >
        {icon}<span>{label}</span><ChevronDown size={10} />
      </button>
      {openDrop === id && (
        <div className="absolute bottom-full mb-2 left-0 bg-white border rounded-lg p-1.5 min-w-[180px] shadow-xl z-50" style={{ borderColor: TV.borderLight }}>
          {children}
        </div>
      )}
    </div>
  );

  const DropItem = ({ sel, onClick, children }: { sel?: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      onClick={() => { onClick(); setOpenDrop(null); }}
      className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-sm text-[11px] transition-colors hover:bg-black/5"
      style={{ fontWeight: sel ? 600 : 400, color: sel ? TV.textBrand : TV.textSecondary }}
    >
      {children}
      {sel && <Check size={10} className="ml-auto" style={{ color: TV.brand }} />}
    </button>
  );

  /* ── Contact queue sidebar (shown during session) ── */
  const ContactQueue = () => (
    <div className="w-[220px] flex flex-col border-r shrink-0 bg-white" style={{ borderColor: TV.borderLight }}>
      {/* Progress header */}
      <div className="px-4 py-3 border-b" style={{ borderColor: TV.borderLight }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[12px]" style={{ fontWeight: 700, color: TV.textPrimary }}>Recording Queue</p>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ fontWeight: 600, backgroundColor: `${TV.brand}12`, color: TV.textBrand }}>
            {recordedCount}/{selectedContacts.length}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: TV.surface }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${selectedContacts.length > 0 ? (recordedCount / selectedContacts.length) * 100 : 0}%`, backgroundColor: TV.brand }}
          />
        </div>
      </div>

      {/* Contact list */}
      <div className="flex-1 overflow-y-auto">
        {selectedContacts.map(c => {
          const isDone = completedIds.has(c.id);
          const isCurrent = c.id === currentContactId;
          const rec = recordings.find(r => r.contactId === c.id);
          const isSent = rec?.sendStatus === "sent";
          return (
            <button
              key={c.id}
              onClick={() => { setCurrentContactId(c.id); if (phase !== "landing") setPhase("queue"); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-all hover:bg-black/[0.02]"
              style={{ backgroundColor: isCurrent ? `${TV.brand}06` : "transparent" }}
            >
              {/* Status indicator */}
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: c.color }}>
                <span className="text-white text-[8px]" style={{ fontWeight: 700 }}>{c.name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] truncate" style={{ fontWeight: isCurrent ? 700 : 500, color: TV.textPrimary }}>{c.name}</p>
                <p className="text-[9px] truncate" style={{ color: TV.textSecondary }}>
                  {isSent ? "Sent ✓" : isDone ? "Ready to send" : isCurrent ? "Recording…" : "Pending"}
                </p>
              </div>
              {/* Status icon */}
              {isSent ? (
                <Check size={12} style={{ color: TV.success }} />
              ) : isDone ? (
                <CheckCircle2 size={12} style={{ color: TV.brand }} />
              ) : isCurrent ? (
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TV.brand }} />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Add more contacts mid-session */}
      <div className="border-t p-2" style={{ borderColor: TV.borderLight }}>
        <button
          onClick={() => setShowAddMidSession(!showAddMidSession)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-sm text-[11px] transition-colors hover:bg-black/[0.03]"
          style={{ fontWeight: 500, color: TV.textBrand }}
        >
          <UserPlus size={11} />Add Constituents
        </button>
      </div>

      {/* Mid-session add popup */}
      {showAddMidSession && (
        <div className="absolute bottom-14 left-2 right-2 bg-white border rounded-lg shadow-xl z-50 max-h-[280px] flex flex-col overflow-hidden" style={{ borderColor: TV.borderLight }}>
          <div className="px-3 py-2 border-b" style={{ borderColor: TV.borderLight }}>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px]" style={{ fontWeight: 700, color: TV.textPrimary }}>Add to Queue</p>
              <button onClick={() => setShowAddMidSession(false)} className="p-0.5 rounded-full hover:bg-black/5"><X size={10} style={{ color: TV.textSecondary }} /></button>
            </div>
            <div className="relative">
              <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-tv-text-secondary" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" aria-label="Search recipients" className="w-full border border-tv-border-light bg-white rounded-sm pl-6 pr-2 py-1 text-[10px] text-tv-text-primary outline-none placeholder:text-tv-text-decorative focus:border-tv-border-strong" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {ALL_CONTACTS.filter(c => !selected.includes(c.id)).filter(c => {
              const q = search.toLowerCase().trim();
              return !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
            }).slice(0, 20).map(c => (
              <button key={c.id} onClick={() => { setSelected(prev => [...prev, c.id]); show(`Added ${c.name} to queue`, "success"); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-black/[0.02] transition-colors">
                <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[7px] shrink-0" style={{ backgroundColor: c.color, fontWeight: 700 }}>{c.name.charAt(0)}</div>
                <span className="text-[10px] truncate" style={{ fontWeight: 500, color: TV.textPrimary }}>{c.name}</span>
              </button>
            ))}
          </div>
          {/* Import from list shortcut */}
          <div className="border-t p-2" style={{ borderColor: TV.borderLight }}>
            {SAVED_LISTS.slice(0, 3).map(l => (
              <button key={l.id} onClick={() => { importFromList(l.id); setShowAddMidSession(false); }} className="w-full flex items-center gap-1.5 px-2 py-1 text-left rounded-[4px] hover:bg-black/[0.02] transition-colors">
                <Users size={9} style={{ color: TV.brand }} />
                <span className="text-[9px] truncate" style={{ fontWeight: 500, color: TV.textSecondary }}>{l.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  /* ── Header text ── */
  const headerTitle = !sessionStarted
    ? "Add Personalized Videos"
    : phase === "record" || phase === "editor"
    ? `Record for ${currentContact?.name ?? "—"}`
    : phase === "upload"
    ? `Upload for ${currentContact?.name ?? "—"}`
    : phase === "library"
    ? `Choose from Library — ${currentContact?.name ?? "—"}`
    : phase === "saved"
    ? "Video Saved!"
    : phase === "landing"
    ? "Customize Landing Page"
    : phase === "review"
    ? "Review & Send"
    : `Video for ${currentContact?.name ?? "—"}`;

  const headerSub = !sessionStarted
    ? `${selectedContacts.length} recipient${selectedContacts.length !== 1 ? "s" : ""} selected`
    : phase === "saved"
    ? `Video for ${currentContact?.name ?? "—"} is ready. Continue to the next contact.`
    : phase === "landing"
    ? `Design the landing page all ${recordedCount} recipient${recordedCount !== 1 ? "s" : ""} will see when they open your 1:1 video link.`
    : phase === "review"
    ? `${recordedCount} video${recordedCount !== 1 ? "s" : ""} recorded · ${sentCount} sent · ${unsentRecordings.length} ready to send`
    : `${recordedCount}/${selectedContacts.length} recorded · ${unrecordedContacts.length} remaining`;

  /* ── Render ── */
  return (
    <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-6" onClick={() => openDrop && setOpenDrop(null)}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[1100px] h-[min(92vh,740px)] flex flex-col overflow-hidden">

        {/* ══ Header ══ */}
        <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: TV.borderLight }}>
          <div className="flex-1 min-w-0">
            <p className="text-[17px]" style={{ fontWeight: 800, color: TV.textPrimary }}>{headerTitle}</p>
            <p className="text-[12px] mt-0.5 truncate" style={{ color: TV.textSecondary }}>{headerSub}</p>
          </div>
          <button onClick={onBack} className="w-9 h-9 rounded-full border flex items-center justify-center hover:bg-black/5 transition-colors shrink-0" style={{ borderColor: TV.borderLight }}>
            <X size={16} style={{ color: TV.textSecondary }} />
          </button>
        </div>

        {/* ══ Body ══ */}
        <div className="flex-1 flex overflow-hidden min-h-0">

          {/* ══════════════════════════════ */}
          {/* PRE-SESSION: Contact picker   */}
          {/* ══════════════════════════════ */}
          {!sessionStarted && (
            <AddRecipientsPanel
              className="flex-1"
              onRecipientsChange={(recipients: RecipientEntry[]) => {
                setSelected(recipients.map(r => r.id));
                setSelectAll(recipients.length === ALL_CONTACTS.length);
              }}
              onDone={(recipients: RecipientEntry[]) => {
                if (recipients.length === 0) return;
                startSession(recipients.map(r => r.id));
              }}
              showDone
              doneLabel="Start Recording Session"
            />
          )}

          {/* ══════════════════════════════════════ */}
          {/* SESSION STARTED: Queue sidebar + main */}
          {/* ══════════════════════════════════════ */}
          {sessionStarted && phase !== "landing" && phase !== "review" && (
            <>
              <ContactQueue />

              <div className="flex-1 flex flex-col overflow-hidden min-w-0">

                {/* ═══ QUEUE PHASE: Choose how to add video for current contact ═══ */}
                {phase === "queue" && currentContact && (
                  <div className="flex-1 overflow-y-auto p-6">
                    {/* Current contact card */}
                    <div className="flex items-center gap-4 mb-6 p-4 rounded-[14px] border" style={{ borderColor: TV.borderLight, backgroundColor: TV.surfaceMuted }}>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[16px] shrink-0" style={{ fontWeight: 800, backgroundColor: currentContact.color }}>
                        {currentContact.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[16px]" style={{ fontWeight: 800, color: TV.textPrimary }}>{currentContact.name}</p>
                        <p className="text-[12px] truncate" style={{ color: TV.textSecondary }}>{currentContact.email}</p>
                        {currentContact.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {currentContact.tags.slice(0, 3).map(t => (
                              <span key={t} className="px-2 py-0.5 rounded-full text-[9px]" style={{ fontWeight: 500, backgroundColor: `${TV.brand}10`, color: TV.textBrand }}>{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      {completedIds.has(currentContact.id) && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: TV.successBg }}>
                          <CheckCircle2 size={13} style={{ color: TV.success }} />
                          <span className="text-[11px]" style={{ fontWeight: 600, color: TV.success }}>Recorded</span>
                        </div>
                      )}
                    </div>

                    {/* Re-record notice if already done */}
                    {completedIds.has(currentContact.id) && (
                      <div className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-md border" style={{ borderColor: TV.warningBorder, backgroundColor: TV.warningBg }}>
                        <AlertCircle size={13} style={{ color: TV.warning }} />
                        <span className="text-[11px]" style={{ color: TV.warningHover }}>This constituent already has a video. Recording again will replace it.</span>
                      </div>
                    )}

                    {/* 3 option cards */}
                    <p className="text-[11px] mb-3" style={{ fontWeight: 700, color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {completedIds.has(currentContact.id) ? "Re-record or Replace" : "Choose how to add a video"}
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                      <button
                        onClick={() => setPhase("record")}
                        className="group flex flex-col items-center gap-3 p-8 rounded-xl border-2 transition-all hover:border-tv-brand-bg hover:shadow-md"
                        style={{ borderColor: TV.borderLight }}
                      >
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center transition-colors" style={{ backgroundColor: TV.surface }}>
                          <Camera size={22} style={{ color: TV.textBrand }} />
                        </div>
                        <div className="text-center">
                          <p className="text-[14px]" style={{ fontWeight: 600, color: TV.textPrimary }}>Record</p>
                          <p className="text-[11px] mt-0.5" style={{ color: TV.textSecondary }}>Use your webcam</p>
                        </div>
                      </button>

                      <button
                        onClick={() => setPhase("upload")}
                        className="group flex flex-col items-center gap-3 p-8 rounded-xl border-2 transition-all hover:border-tv-brand-bg hover:shadow-md"
                        style={{ borderColor: TV.borderLight }}
                      >
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center transition-colors" style={{ backgroundColor: TV.surface }}>
                          <Upload size={22} style={{ color: TV.textBrand }} />
                        </div>
                        <div className="text-center">
                          <p className="text-[14px]" style={{ fontWeight: 600, color: TV.textPrimary }}>Upload</p>
                          <p className="text-[11px] mt-0.5" style={{ color: TV.textSecondary }}>Upload a file</p>
                        </div>
                      </button>

                      <button
                        onClick={() => setPhase("library")}
                        className="group flex flex-col items-center gap-3 p-8 rounded-xl border-2 transition-all hover:border-tv-brand-bg hover:shadow-md"
                        style={{ borderColor: TV.borderLight }}
                      >
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center transition-colors" style={{ backgroundColor: TV.surface }}>
                          <Grid3X3 size={22} style={{ color: TV.textBrand }} />
                        </div>
                        <div className="text-center">
                          <p className="text-[14px]" style={{ fontWeight: 600, color: TV.textPrimary }}>Library</p>
                          <p className="text-[11px] mt-0.5" style={{ color: TV.textSecondary }}>Choose existing</p>
                        </div>
                      </button>
                    </div>

                    {/* Skip contact */}
                    {unrecordedContacts.length > 1 && !completedIds.has(currentContact.id) && (
                      <div className="mt-4 text-center">
                        <button
                          onClick={advanceToNext}
                          className="inline-flex items-center gap-1.5 text-[12px] hover:underline transition-colors"
                          style={{ fontWeight: 500, color: TV.textSecondary }}
                        >
                          <SkipForward size={12} />Skip to next constituent
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ═══ SAVED PHASE: Just saved, continue to next ═══ */}
                {phase === "saved" && currentContact && (
                  <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: TV.successBg }}>
                      <CheckCircle2 size={32} style={{ color: TV.success }} />
                    </div>
                    <h3 className="text-[18px] mb-1 text-center" style={{ fontWeight: 800, color: TV.textPrimary }}>
                      Video for {currentContact.name} saved!
                    </h3>
                    <p className="text-[13px] mb-2 text-center" style={{ color: TV.textSecondary }}>
                      {unrecordedContacts.length > 0
                        ? `${unrecordedContacts.length} contact${unrecordedContacts.length !== 1 ? "s" : ""} remaining — continue recording.`
                        : "All constituents have videos! Review and customize the landing page before sending."}
                    </p>

                    {/* Auto-advance indicator */}
                    {autoAdvance && unrecordedContacts.length > 0 && (
                      <div className="flex items-center gap-2 mb-4 px-4 py-2 rounded-full" style={{ backgroundColor: `${TV.brand}08` }}>
                        <Zap size={12} style={{ color: TV.brand }} />
                        <span className="text-[11px]" style={{ fontWeight: 500, color: TV.textBrand }}>Auto-advancing to next constituent…</span>
                      </div>
                    )}



                    <div className="flex items-center gap-3">
                      {unrecordedContacts.length > 0 ? (
                        <button
                          onClick={advanceToNext}
                          className="flex items-center gap-2 px-6 py-3 rounded-full text-[13px] text-white transition-all hover:opacity-90 shadow-md"
                          style={{ fontWeight: 700, backgroundColor: TV.brand }}
                        >
                          Next Constituent <ChevronRight size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => { setLandingOrigin("recording"); setPhase("landing"); }}
                          className="flex items-center gap-2 px-6 py-3 rounded-full text-[13px] text-white transition-all hover:opacity-90 shadow-md"
                          style={{ fontWeight: 700, backgroundColor: TV.brand }}
                        >
                          Customize Landing Page <ChevronRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* ═══ RECORD PHASE ═══ */}
                {phase === "record" && (
                  <div className="flex-1 flex overflow-hidden min-h-0">
                    {/* Middle column: tips + script */}
                    <div className="w-[250px] flex flex-col border-r shrink-0 overflow-y-auto p-5" style={{ borderColor: TV.borderLight }}>
                      <button onClick={() => setPhase("queue")} className="flex items-center gap-1 text-[12px] mb-4 hover:underline" style={{ fontWeight: 500, color: TV.textBrand }}>
                        <ArrowLeft size={13} />Back
                      </button>

                      {/* Current contact mini-card */}
                      {currentContact && (
                        <div className="flex items-center gap-2.5 mb-5 p-3 rounded-md border" style={{ borderColor: TV.borderLight }}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] shrink-0" style={{ fontWeight: 700, backgroundColor: currentContact.color }}>
                            {currentContact.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] truncate" style={{ fontWeight: 700, color: TV.textPrimary }}>{currentContact.name}</p>
                            <p className="text-[9px] truncate" style={{ color: TV.textSecondary }}>{currentContact.email}</p>
                          </div>
                        </div>
                      )}

                      {/* Tips card */}
                      <div className="rounded-lg border p-4 mb-4" style={{ borderColor: TV.borderLight }}>
                        <div className="flex items-center gap-2 mb-3">
                          <Lightbulb size={14} style={{ color: TV.warning }} />
                          <p className="text-[12px]" style={{ fontWeight: 700, color: TV.textPrimary }}>Tips</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Eye size={12} style={{ color: TV.textSecondary }} />
                            <span className="text-[11px]" style={{ color: TV.textSecondary }}>Look at the camera</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Volume2 size={12} style={{ color: TV.textSecondary }} />
                            <span className="text-[11px]" style={{ color: TV.textSecondary }}>Quiet environment</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertCircle size={12} style={{ color: TV.textSecondary }} />
                            <span className="text-[11px]" style={{ color: TV.textSecondary }}>Keep it under 2 min</span>
                          </div>
                        </div>
                      </div>

                      {/* Script card */}
                      <div className="rounded-lg border p-4" style={{ borderColor: showScript ? TV.brand : TV.borderLight, backgroundColor: showScript ? `${TV.brand}05` : "transparent" }}>
                        <div className="flex items-center gap-2 mb-3">
                          <FileText size={14} style={{ color: TV.textBrand }} />
                          <p className="text-[12px] flex-1" style={{ fontWeight: 700, color: TV.textPrimary }}>Script</p>
                          <span className="text-[10px] mr-1" style={{ color: TV.textSecondary }}>Show</span>
                          <button
                            onClick={() => setShowScript(!showScript)}
                            className="w-9 h-5 rounded-full relative transition-colors"
                            style={{ backgroundColor: showScript ? TV.brand : TV.borderStrong }}
                          >
                            <div className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all" style={{ left: showScript ? 18 : 2 }} />
                          </button>
                        </div>
                        {showScript && (
                          <>
                            <textarea
                              value={script}
                              onChange={e => setScript(e.target.value)}
                              placeholder="Hi {{First Name}}, thank you for…"
                              className="w-full border rounded-md p-3 text-[12px] outline-none resize-none"
                              style={{ borderColor: TV.borderLight, color: TV.textPrimary, minHeight: 100 }}
                              rows={5}
                            />
                            <p className="text-[10px] mt-1.5" style={{ color: TV.textSecondary }}>
                              {stats.words}w · {stats.time}
                            </p>
                            {/* Merge field helper */}
                            <div className="mt-2 pt-2 border-t" style={{ borderColor: TV.borderLight }}>
                              <p className="text-[9px] mb-1" style={{ fontWeight: 600, color: TV.textSecondary }}>Insert merge field:</p>
                              <div className="flex flex-wrap gap-1">
                                {["First Name", "Last Name", "Giving Level", "Company", "Affiliation"].map(f => (
                                  <button key={f} onClick={() => setScript(prev => prev + `{{${f}}}`)} className="px-1.5 py-0.5 rounded text-[8px] transition-colors hover:bg-black/5" style={{ fontWeight: 500, color: TV.textBrand, border: `1px solid ${TV.borderLight}` }}>
                                    {`{{${f}}}`}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {/* Resolved preview */}
                            {currentContact && script.includes("{{") && (
                              <div className="mt-2 p-2 rounded-sm text-[10px]" style={{ backgroundColor: `${TV.brand}06`, color: TV.textPrimary, lineHeight: "1.5" }}>
                                <p className="text-[8px] mb-0.5" style={{ fontWeight: 700, color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Preview for {currentContact.name}:</p>
                                {resolvedScript}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right column: Camera preview + floating controls (matches VideoCreate) */}
                    <div className="flex-1 relative overflow-hidden" onClick={() => openDrop && setOpenDrop(null)}>
                      {/* Dark camera viewfinder — full area */}
                      <div className="absolute inset-0 rounded-r-xl bg-[#0e0e1a] flex items-center justify-center overflow-hidden" style={{ borderRadius: "0 12px 12px 0" }}>
                        {camOn ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-20 h-20 rounded-full flex items-center justify-center bg-white/10">
                              <Camera size={32} className="text-white/60" />
                            </div>
                            <p className="text-[14px] text-white/70" style={{ fontWeight: 500 }}>Camera Preview</p>
                            <p className="text-[11px] text-white/40">{CAMERAS.find(c => c.id === camera)?.label}</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-white/30">
                            <VideoOff size={36} />
                            <span className="text-[12px]">Camera off</span>
                          </div>
                        )}

                        {/* Top-left: contact name badge + recording indicator */}
                        {currentContact && recPhase !== "recording" && (
                          <div className="absolute top-3 left-3 flex items-center gap-2.5 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 z-10">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] shrink-0" style={{ backgroundColor: currentContact.color, fontWeight: 800 }}>
                              {currentContact.name.split(" ").map(n => n[0]).join("")}
                            </div>
                            <span className="text-white text-[12px]" style={{ fontWeight: 600 }}>{currentContact.name}</span>
                          </div>
                        )}

                        {/* Recording indicator (replaces contact badge during recording) */}
                        {recPhase === "recording" && (
                          <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 z-10">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-white text-[13px] font-mono" style={{ fontWeight: 600 }}>{fmt(elapsed)}</span>
                            {currentContact && (
                              <>
                                <div className="w-px h-3 bg-white/20 mx-0.5" />
                                <span className="text-white/70 text-[11px]" style={{ fontWeight: 500 }}>{currentContact.name}</span>
                              </>
                            )}
                          </div>
                        )}

                        {/* Top-right: quality pill */}
                        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1 z-10">
                          <span className="text-white/80 text-[10px]" style={{ fontWeight: 500 }}>{quality}{recPhase === "recording" ? " · REC" : ""}</span>
                        </div>

                        {/* Countdown overlay */}
                        {recPhase === "countdown" && (
                          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-4 z-20">
                            <div className="w-32 h-32 rounded-full bg-white/10 border-4 border-white/30 flex items-center justify-center backdrop-blur-sm animate-pulse">
                              <span className="text-white" style={{ fontSize: 64, fontWeight: 900 }}>{countdown}</span>
                            </div>
                            <p className="text-white/80 text-[15px]" style={{ fontWeight: 600 }}>Get ready…</p>
                          </div>
                        )}

                        {/* Script overlay during recording */}
                        {showScript && script && recPhase === "recording" && (
                          <div className="absolute inset-x-0 bottom-16 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-6 py-5 pt-10 z-10">
                            <div className="flex items-center gap-1.5 mb-2">
                              <FileText size={11} className="text-white/70" />
                              <span className="text-white/70 text-[10px] uppercase tracking-wider" style={{ fontWeight: 600 }}>Teleprompter</span>
                            </div>
                            <p className="text-white/90 text-[14px] leading-relaxed max-w-lg" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
                              {resolvedScript}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Floating bottom control bar (Loom-style — matches VideoCreate) */}
                      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center z-20">
                        <div className="bg-white/95 backdrop-blur-md rounded-xl border border-[#e8e4f0] shadow-lg px-3 py-2 flex items-center gap-1.5">
                          {/* Mic toggle */}
                          <button onClick={() => setMicOn(!micOn)} aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${micOn ? "bg-tv-surface text-tv-text-primary hover:bg-tv-surface-hover" : "bg-tv-danger-bg text-tv-danger"}`}>
                            <Mic size={16} />
                          </button>

                          {/* Camera toggle */}
                          <button onClick={() => setCamOn(!camOn)} aria-label={camOn ? "Turn camera off" : "Turn camera on"}
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${camOn ? "bg-tv-surface text-tv-text-primary hover:bg-tv-surface-hover" : "bg-tv-danger-bg text-tv-danger"}`}>
                            {camOn ? <Camera size={16} /> : <VideoOff size={16} />}
                          </button>

                          <div className="h-7 w-px bg-[#e8e4f0] mx-0.5" />

                          {/* Quality quick-select */}
                          <div className="flex items-center bg-tv-surface rounded-full p-0.5 gap-0.5">
                            {QUALITY_OPTIONS.map(q => (
                              <button key={q} onClick={() => setQuality(q)}
                                className={`px-2.5 py-1.5 rounded-full text-[10px] transition-all ${quality === q ? "bg-white text-tv-text-primary shadow-sm" : "text-tv-text-secondary hover:text-tv-text-primary"}`}
                                style={{ fontWeight: quality === q ? 600 : 500 }}>
                                {q}
                              </button>
                            ))}
                          </div>

                          <div className="h-7 w-px bg-[#e8e4f0] mx-0.5" />

                          {/* Record / Stop / Cancel */}
                          {recPhase === "idle" && (
                            <button onClick={startRecording}
                              className="flex items-center gap-2 pl-4 pr-5 py-2.5 rounded-full text-white shadow-md transition-colors hover:opacity-90"
                              style={{ fontWeight: 600, fontSize: 13, backgroundColor: TV.record }}>
                              <span className="w-3.5 h-3.5 bg-white rounded-full shrink-0" />
                              Record
                            </button>
                          )}
                          {recPhase === "countdown" && (
                            <button onClick={() => { setRecPhase("idle"); setCountdown(3); }}
                              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-tv-danger text-[12px] border border-tv-danger-border hover:bg-tv-danger-bg transition-colors"
                              style={{ fontWeight: 500 }}>
                              <X size={13} />Cancel
                            </button>
                          )}
                          {recPhase === "recording" && (
                            <>
                              <button onClick={discardRecording}
                                className="flex items-center gap-1.5 text-tv-text-secondary hover:text-tv-danger px-3 py-2 rounded-full text-[12px] transition-colors hover:bg-tv-danger-bg"
                                style={{ fontWeight: 500 }}>
                                <Trash2 size={13} />
                              </button>
                              <button onClick={stopRecording}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-[13px] transition-colors hover:bg-black"
                                style={{ fontWeight: 600, backgroundColor: TV.textPrimary }}>
                                <Square size={12} fill="white" />Stop
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ═══ UPLOAD PHASE ═══ */}
                {phase === "upload" && (
                  <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <button onClick={() => setPhase("queue")} className="self-start flex items-center gap-1 text-[12px] mb-6 hover:underline" style={{ fontWeight: 500, color: TV.textBrand }}>
                      <ArrowLeft size={13} />Back
                    </button>
                    {currentContact && (
                      <p className="text-[14px] mb-4" style={{ fontWeight: 700, color: TV.textPrimary }}>Upload video for {currentContact.name}</p>
                    )}
                    <div
                      onClick={() => setUploaded(true)}
                      className="w-full max-w-[400px] border-2 border-dashed rounded-xl p-12 flex flex-col items-center gap-3 cursor-pointer transition-all"
                      style={{ borderColor: uploaded ? TV.success : TV.borderStrong, backgroundColor: uploaded ? TV.successBg : "transparent" }}
                    >
                      {uploaded ? (
                        <>
                          <Check size={36} style={{ color: TV.success }} />
                          <p className="text-[14px]" style={{ fontWeight: 700, color: TV.textPrimary }}>annual_fund_video.mp4</p>
                          <p className="text-[12px]" style={{ color: TV.textSecondary }}>48.3 MB · 1:08</p>
                        </>
                      ) : (
                        <>
                          <Upload size={36} style={{ color: TV.brand }} />
                          <p className="text-[14px]" style={{ fontWeight: 700, color: TV.textPrimary }}>Drag your video here, or click to browse</p>
                          <p className="text-[12px]" style={{ color: TV.textSecondary }}>Supports MP4, MOV, AVI</p>
                        </>
                      )}
                    </div>
                    {uploaded && (
                      <div className="flex gap-3 mt-6">
                        <button onClick={() => setUploaded(false)} className="px-4 py-2 rounded-md text-[12px] border hover:bg-black/5 transition-colors" style={{ fontWeight: 500, borderColor: TV.borderLight, color: TV.textPrimary }}>
                          Replace
                        </button>
                        <button onClick={handleUploadSave} className="px-6 py-2 rounded-md text-[12px] text-white hover:opacity-90 transition-colors" style={{ fontWeight: 600, backgroundColor: TV.brand }}>
                          Use This Video
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ═══ LIBRARY PHASE ═══ */}
                {phase === "library" && (
                  <div className="flex-1 flex flex-col p-6 overflow-y-auto">
                    <button onClick={() => setPhase("queue")} className="self-start flex items-center gap-1 text-[12px] mb-4 hover:underline" style={{ fontWeight: 500, color: TV.textBrand }}>
                      <ArrowLeft size={13} />Back
                    </button>
                    {currentContact && (
                      <p className="text-[14px] mb-4" style={{ fontWeight: 700, color: TV.textPrimary }}>Choose from Library for {currentContact.name}</p>
                    )}
                    <div className="grid grid-cols-3 gap-3">
                      {["Annual Fund Thank You", "Welcome Message", "Scholarship Update", "Event Recap", "Campaign Kickoff", "Board Thank You"].map((title, i) => (
                        <button
                          key={title}
                          onClick={handleLibrarySelect}
                          className="rounded-lg border overflow-hidden text-left transition-all hover:border-tv-brand-bg hover:shadow-md"
                          style={{ borderColor: TV.borderLight }}
                        >
                          <div className="aspect-video flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${["#7c45b0", "#0e7490", "#15803d", "#b45309", "#dc2626", "#3b5998"][i]}40, ${["#7c45b0", "#0e7490", "#15803d", "#b45309", "#dc2626", "#3b5998"][i]}20)` }}>
                            <Play size={20} style={{ color: ["#7c45b0", "#0e7490", "#15803d", "#b45309", "#dc2626", "#3b5998"][i] }} />
                          </div>
                          <div className="p-3">
                            <p className="text-[11px]" style={{ fontWeight: 600, color: TV.textPrimary }}>{title}</p>
                            <p className="text-[10px]" style={{ color: TV.textSecondary }}>0:{30 + i * 7}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ══════════════════════════════════ */}
          {/* LANDING PAGE PHASE (full-width)   */}
          {/* ══════════════════════════════════ */}
          {sessionStarted && phase === "landing" && (
            <div className="flex-1 flex overflow-hidden min-h-0">
              {/* Hidden file inputs */}
              <input type="file" accept=".png,.jpg,.jpeg" ref={lpLogoInputRef} onChange={handleLpLogoFile}
                aria-hidden="true" tabIndex={-1}
                style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }} />
              <input type="file" accept=".png,.jpg,.jpeg" ref={lpBgInputRef} onChange={e => {
                  const file = e.target.files?.[0];
                  if (file && file.type.startsWith("image/")) {
                    setLpPendingBgFile(URL.createObjectURL(file));
                    setLpNewBgName("");
                    setLpShowUploadNaming(true);
                  }
                  e.target.value = "";
                }}
                aria-hidden="true" tabIndex={-1}
                style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }} />

              {/* ── Left accordion panel ── */}
              <div className="w-[380px] shrink-0 flex flex-col border-r min-h-0" style={{ borderColor: TV.borderLight }}>
                {/* Fixed header: back link + recipients */}
                <div className="px-5 pt-5 pb-3 shrink-0 border-b overflow-hidden" style={{ borderColor: TV.borderDivider }}>
                  <button onClick={() => setPhase(landingOrigin === "review" ? "review" : "queue")} className="flex items-center gap-1 text-[12px] mb-3 hover:underline" style={{ fontWeight: 500, color: TV.textBrand }}>
                    <ArrowLeft size={13} />{landingOrigin === "review" ? "Back to review" : "Back to recording"}
                  </button>

                  {/* Recipients summary */}
                  <div className="rounded-md border p-3" style={{ borderColor: TV.borderLight, backgroundColor: TV.surfaceMuted }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Users size={13} style={{ color: TV.brand }} />
                      <p className="text-[11px]" style={{ fontWeight: 700, color: TV.textPrimary }}>
                        {selectedContacts.length} Recipient{selectedContacts.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {selectedContacts.slice(0, 6).map(c => (
                        <span key={c.id} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]" style={{ fontWeight: 500, backgroundColor: "white", border: `1px solid ${TV.borderLight}`, color: TV.textPrimary }}>
                          <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[7px] shrink-0" style={{ backgroundColor: c.color, fontWeight: 700 }}>{c.name.charAt(0)}</span>
                          {c.name.split(" ")[0]}
                        </span>
                      ))}
                      {selectedContacts.length > 6 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px]" style={{ fontWeight: 500, color: TV.textSecondary, backgroundColor: "white", border: `1px solid ${TV.borderLight}` }}>
                          +{selectedContacts.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Scrollable accordion body */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 px-5 pb-5">
                  {/* ── Accordion 1: Content ── */}
                  <LpAccordionSection title="Page Content" open={!!lpAccordion.content} onToggle={() => toggleLpSection("content")}
                    helper="Configure headline, body, and call-to-action.">
                    <div className="space-y-3">
                      {/* Envelope picker */}
                      <div>
                        <label className="text-[10px] uppercase tracking-wider mb-2 block" style={{ fontWeight: 600, color: TV.textSecondary, letterSpacing: "0.5px" }}>Envelope Design</label>
                        <div className="grid grid-cols-4 gap-2">
                          {ENVELOPE_PRESETS.map((ep, i) => (
                            <button key={ep.title} onClick={() => updateLp({ envelopeIdx: i })} className="rounded-sm border-2 p-1 transition-all hover:shadow-sm" style={{ borderColor: lpConfig.envelopeIdx === i ? TV.brand : TV.borderLight }}>
                              <EnvelopePreview envelopeColor={ep.envelopeColor} linerColor={ep.linerColor} primaryColor={ep.primaryColor} secondaryColor={ep.secondaryColor} frontDesign={ep.frontDesign} frontDesignColor={ep.frontDesignColor} frontLeftLogo={ep.frontLeftLogo} stampSelection={ep.stampSelection} postmarkColor={ep.postmarkColor} recipientNameColor={ep.recipientNameColor} mode="thumbnail" width={60} />
                              <p className="text-[8px] text-center mt-0.5 truncate" style={{ color: lpConfig.envelopeIdx === i ? TV.textBrand : TV.textSecondary, fontWeight: lpConfig.envelopeIdx === i ? 600 : 400 }}>{ep.title}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider mb-1.5 block" style={{ fontWeight: 600, color: TV.textSecondary, letterSpacing: "0.5px" }}>Headline</label>
                        <input value={lpConfig.headline} onChange={e => updateLp({ headline: e.target.value })} className="w-full border rounded-md px-3 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-tv-brand/30 bg-white" style={{ borderColor: TV.borderLight, color: TV.textPrimary }} />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider mb-1.5 block" style={{ fontWeight: 600, color: TV.textSecondary, letterSpacing: "0.5px" }}>Sub-headline</label>
                        <input value={lpConfig.subheadline} onChange={e => updateLp({ subheadline: e.target.value })} className="w-full border rounded-md px-3 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-tv-brand/30 bg-white" style={{ borderColor: TV.borderLight, color: TV.textPrimary }} />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider mb-1.5 block" style={{ fontWeight: 600, color: TV.textSecondary, letterSpacing: "0.5px" }}>Body Text <span className="font-normal normal-case">(optional)</span></label>
                        <textarea value={lpConfig.body} onChange={e => updateLp({ body: e.target.value })} placeholder="Impact story or personal note…" className="w-full box-border border rounded-md px-3 py-2.5 text-[13px] outline-none resize-y focus:ring-2 focus:ring-tv-brand/30 bg-white" style={{ borderColor: TV.borderLight, color: TV.textPrimary, minHeight: 72, lineHeight: "1.5" }} rows={3} />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider mb-1.5 block" style={{ fontWeight: 600, color: TV.textSecondary, letterSpacing: "0.5px" }}>Call to Action</label>
                        <div className="flex gap-2">
                          <input value={lpConfig.ctaLabel} onChange={e => updateLp({ ctaLabel: e.target.value })} placeholder="Button label" className="flex-1 min-w-0 border rounded-md px-3 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-tv-brand/30 bg-white" style={{ borderColor: TV.borderLight, color: TV.textPrimary }} />
                          <input value={lpConfig.ctaUrl} onChange={e => updateLp({ ctaUrl: e.target.value })} placeholder="URL" className="flex-1 min-w-0 border rounded-md px-3 py-2.5 text-[13px] outline-none font-mono focus:ring-2 focus:ring-tv-brand/30 bg-white" style={{ borderColor: TV.borderLight, color: TV.textPrimary }} />
                        </div>
                      </div>
                      {/* Toggles */}
                      <div className="space-y-2.5">
                        {[
                          { key: "showReply" as const, label: "Reply form", desc: "Let recipients reply with a video or text" },
                          { key: "showFundContext" as const, label: "Fund context", desc: "Show fund name and goal progress" },
                        ].map(tog => (
                          <div key={tog.key} className="flex items-center gap-3">
                            <button onClick={() => updateLp({ [tog.key]: !lpConfig[tog.key] })} className="w-9 h-5 rounded-full relative transition-colors shrink-0" style={{ backgroundColor: lpConfig[tog.key] ? TV.brand : TV.borderStrong }}>
                              <div className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all" style={{ left: lpConfig[tog.key] ? 18 : 2 }} />
                            </button>
                            <div>
                              <p className="text-[11px]" style={{ fontWeight: 600, color: TV.textPrimary }}>{tog.label}</p>
                              <p className="text-[9px]" style={{ color: TV.textSecondary }}>{tog.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </LpAccordionSection>

                  {/* ── Accordion 2: Navigation Bar ── */}
                  <LpAccordionSection title="Navigation Bar" open={!!lpAccordion.navbar} onToggle={() => toggleLpSection("navbar")}
                    helper="Style your landing page with branded elements." hasInfo>
                    <div className="space-y-4">
                      {/* Nav bar color */}
                      <LpColorField label="Navigation Bar Color" value={lpConfig.navBarColor} onChange={v => updateLp({ navBarColor: v })} required />

                      {/* Organization Logo */}
                      <div>
                        <label className="text-[10px] uppercase tracking-wider mb-2 block" style={{ fontWeight: 600, color: TV.textSecondary, letterSpacing: "0.5px" }}>Organization Logo</label>
                        <div className="grid grid-cols-4 gap-1.5 mb-3">
                          {LP_LOGO_OPTIONS.map(lo => {
                            const active = lpConfig.logo === lo.id;
                            return (
                              <button key={lo.id} onClick={() => updateLp({ logo: lo.id })}
                                className="flex flex-col items-center gap-1 py-2.5 rounded-md border transition-all text-[10px]"
                                style={{ fontWeight: active ? 600 : 400, borderColor: active ? TV.brand : TV.borderLight, color: active ? TV.textBrand : TV.textSecondary, backgroundColor: active ? `${TV.brand}08` : "transparent" }}>
                                <lo.icon size={15} />
                                {lo.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Upload zone */}
                        {lpConfig.logoFile ? (
                          <div className="relative w-full h-20 rounded-md border overflow-hidden flex items-center justify-center group mb-2" style={{ borderColor: TV.borderLight, backgroundColor: `${TV.surfaceMuted}30` }}>
                            <img src={lpConfig.logoFile} alt="Logo" className="max-h-full max-w-full object-contain" />
                            <button type="button" onClick={() => updateLp({ logoFile: null })}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-tv-danger/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <X size={10} strokeWidth={3} />
                            </button>
                          </div>
                        ) : null}
                        <button type="button" onClick={() => lpLogoInputRef.current?.click()}
                          className="w-full border-2 border-dashed rounded-lg p-5 text-center transition-colors cursor-pointer hover:border-tv-brand/40" style={{ borderColor: TV.borderLight }}>
                          <Upload size={20} className="mx-auto mb-1.5" style={{ color: TV.textSecondary }} />
                          <p className="text-[12px]" style={{ color: TV.textSecondary }}>Drag an image to upload</p>
                          <p className="text-[9px] mt-1" style={{ color: TV.textSecondary }}>High-quality .png or .jpeg recommended.</p>
                        </button>
                        <button type="button" onClick={() => lpLogoInputRef.current?.click()}
                          className="mt-2 w-full py-2.5 text-center rounded-md border text-[12px] transition-all cursor-pointer hover:border-tv-brand" style={{ fontWeight: 500, borderColor: TV.borderLight, color: TV.textPrimary }}>
                          Choose File
                        </button>
                      </div>
                    </div>
                  </LpAccordionSection>

                  {/* ── Accordion 3: Your Background ── */}
                  <LpAccordionSection title="Your Background" open={!!lpAccordion.background} onToggle={() => toggleLpSection("background")}
                    helper="Place an image, solid color, or gradient behind your video." hasInfo>
                    <div className="space-y-4">
                      {/* Tab bar: Image | Color | Gradient */}
                      <div className="flex rounded-md border overflow-hidden" style={{ borderColor: TV.borderLight }}>
                        {([
                          { key: "image" as BgKind, label: "Image", icon: ImageIcon },
                          { key: "color" as BgKind, label: "Color", icon: Palette },
                          { key: "gradient" as BgKind, label: "Gradient", icon: Droplets },
                        ]).map(tab => (
                          <button key={tab.key} type="button" onClick={() => setLpBgTab(tab.key)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] transition-colors ${
                              lpBgTab === tab.key ? "bg-tv-brand text-white" : "hover:bg-black/5"
                            }`} style={{ fontWeight: lpBgTab === tab.key ? 600 : 400, color: lpBgTab !== tab.key ? TV.textSecondary : undefined }}>
                            <tab.icon size={12} />
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      {/* Fade gradient toggle */}
                      <button type="button" onClick={() => updateLp({ fadeGradient: !lpConfig.fadeGradient })}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-md border text-[12px] transition-all"
                        style={{ borderColor: lpConfig.fadeGradient ? TV.brand : TV.borderLight, backgroundColor: lpConfig.fadeGradient ? `${TV.brand}08` : "transparent" }}>
                        <div className="text-left">
                          <p style={{ fontWeight: 500, color: TV.textPrimary }}>Fade to white overlay</p>
                          <p className="text-[9px]" style={{ color: TV.textSecondary }}>Softens bottom edge for text readability</p>
                        </div>
                        <div className="w-9 h-5 rounded-full relative shrink-0 transition-colors" style={{ backgroundColor: lpConfig.fadeGradient ? TV.brand : TV.borderStrong }}>
                          <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm" style={{ left: lpConfig.fadeGradient ? 17 : 2 }} />
                        </div>
                      </button>

                      {/* IMAGE TAB */}
                      {lpBgTab === "image" && (
                        <div className="space-y-3">
                          <div
                            onDragOver={e => { e.preventDefault(); setLpBgDragOver(true); }}
                            onDragLeave={() => setLpBgDragOver(false)}
                            onDrop={e => {
                              e.preventDefault(); setLpBgDragOver(false);
                              const file = e.dataTransfer.files?.[0];
                              if (file && file.type.startsWith("image/")) {
                                setLpPendingBgFile(URL.createObjectURL(file));
                                setLpNewBgName("");
                                setLpShowUploadNaming(true);
                              }
                            }}
                            onClick={() => lpBgInputRef.current?.click()}
                            className={`w-full border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all ${
                              lpBgDragOver ? "border-tv-brand scale-[1.01]" : "hover:border-tv-brand/40"
                            }`} style={{ borderColor: lpBgDragOver ? TV.brand : TV.borderLight, backgroundColor: lpBgDragOver ? `${TV.brand}08` : "transparent" }}>
                            <Upload size={20} className="mx-auto mb-1.5" style={{ color: lpBgDragOver ? TV.brand : TV.textSecondary }} />
                            <p className="text-[12px]" style={{ color: TV.textSecondary }}>
                              {lpBgDragOver ? "Drop image here" : "Drag an image or click to upload"}
                            </p>
                            <p className="text-[9px] mt-1" style={{ color: TV.textSecondary }}>.png or .jpeg · saved for future use</p>
                          </div>

                          {/* Upload naming dialog */}
                          {lpShowUploadNaming && (
                            <div className="p-3 rounded-md border space-y-2" style={{ backgroundColor: TV.surfaceMuted, borderColor: TV.borderLight }}>
                              {lpPendingBgFile && (
                                <div className="w-full h-16 rounded-sm overflow-hidden mb-1">
                                  <img src={lpPendingBgFile} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                              )}
                              <label className="text-[10px] uppercase tracking-wider block" style={{ fontWeight: 600, color: TV.textSecondary, letterSpacing: "0.5px" }}>Name this image *</label>
                              <input autoFocus value={lpNewBgName} onChange={e => setLpNewBgName(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === "Enter" && lpNewBgName.trim()) {
                                    const newBg: LpBackground = { id: Date.now(), kind: "image", name: lpNewBgName.trim(), url: lpPendingBgFile || "" };
                                    setLpBackgrounds(prev => [...prev, newBg]); updateLp({ selectedBgId: newBg.id }); setLpShowUploadNaming(false); setLpNewBgName(""); setLpPendingBgFile(null); show(`"${newBg.name}" saved`, "success");
                                  }
                                  if (e.key === "Escape") { setLpShowUploadNaming(false); setLpPendingBgFile(null); }
                                }}
                                placeholder="e.g. Spring Campus 2026"
                                className="w-full border rounded-sm px-2.5 py-1.5 text-[12px] outline-none focus:ring-2 focus:ring-tv-brand/30" style={{ borderColor: TV.borderLight }} />
                              <div className="flex items-center gap-2">
                                <button type="button" onClick={() => { setLpShowUploadNaming(false); setLpPendingBgFile(null); }} className="px-2.5 py-1 text-[11px] font-medium text-tv-danger border border-tv-danger-border rounded-full hover:bg-tv-danger-bg transition-colors">Cancel</button>
                                <button type="button" onClick={() => {
                                  if (!lpNewBgName.trim()) return;
                                  const newBg: LpBackground = { id: Date.now(), kind: "image", name: lpNewBgName.trim(), url: lpPendingBgFile || "" };
                                  setLpBackgrounds(prev => [...prev, newBg]); updateLp({ selectedBgId: newBg.id }); setLpShowUploadNaming(false); setLpNewBgName(""); setLpPendingBgFile(null); show(`"${newBg.name}" saved`, "success");
                                }} disabled={!lpNewBgName.trim()}
                                  className="px-3 py-1 text-white text-[11px] rounded-full transition-colors disabled:opacity-40 flex items-center gap-1" style={{ fontWeight: 600, backgroundColor: TV.brand }}>
                                  <Upload size={10} />Save
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Thumbnail grid */}
                          <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => updateLp({ selectedBgId: null })}
                              className={`group relative rounded-md overflow-hidden border-2 transition-all ${lpConfig.selectedBgId === null ? "border-tv-brand ring-2 ring-tv-brand/20" : "hover:border-tv-border-strong"}`} style={{ borderColor: lpConfig.selectedBgId === null ? TV.brand : TV.borderLight }}>
                              <div className="aspect-[4/3] flex items-center justify-center" style={{ backgroundColor: TV.surfaceMuted }}><X size={16} style={{ color: TV.textSecondary }} /></div>
                              <div className="px-2 py-1.5 bg-white"><p className="text-[10px] truncate" style={{ fontWeight: 500, color: lpConfig.selectedBgId === null ? TV.textBrand : TV.textSecondary }}>No Background</p></div>
                              {lpConfig.selectedBgId === null && (<div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: TV.brand }}><Check size={10} className="text-white" strokeWidth={3} /></div>)}
                            </button>
                            {lpBackgrounds.filter(bg => bg.kind === "image").map(bg => (
                              <div key={bg.id} className={`group relative rounded-md overflow-hidden border-2 transition-all cursor-pointer ${lpConfig.selectedBgId === bg.id ? "ring-2 ring-tv-brand/20" : "hover:border-tv-border-strong"}`} style={{ borderColor: lpConfig.selectedBgId === bg.id ? TV.brand : TV.borderLight }} onClick={() => updateLp({ selectedBgId: bg.id })}>
                                <div className="aspect-[4/3] overflow-hidden">{bg.url?.startsWith("blob:") ? <img src={bg.url} alt={bg.name} className="w-full h-full object-cover" /> : <ImageWithFallback src={bg.url!} alt={bg.name} className="w-full h-full object-cover" />}</div>
                                <div className="px-2 py-1.5 bg-white flex items-center justify-between">
                                  {lpRenamingId === bg.id ? (
                                    <div className="flex items-center gap-1 flex-1" onClick={e => e.stopPropagation()}>
                                      <input autoFocus value={lpRenameValue} onChange={e => setLpRenameValue(e.target.value)} onKeyDown={e => e.key === "Enter" && lpConfirmRename()} className="flex-1 min-w-0 text-[10px] border rounded px-1 py-0.5 outline-none" style={{ borderColor: TV.borderLight }} />
                                      <button onClick={lpConfirmRename} style={{ color: TV.brand }}><Check size={10} /></button>
                                    </div>
                                  ) : (<>
                                    <p className="text-[10px] truncate flex-1" style={{ fontWeight: 500, color: lpConfig.selectedBgId === bg.id ? TV.textBrand : TV.textPrimary }}>{bg.name}</p>
                                    <div className="flex items-center gap-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                      <button onClick={() => lpStartRename(bg.id)} className="p-0.5" style={{ color: TV.textSecondary }} title="Rename"><Pencil size={9} /></button>
                                      <button onClick={() => lpDeleteBg(bg.id)} className="p-0.5 hover:text-tv-danger" style={{ color: TV.textSecondary }} title="Delete"><Trash2 size={9} /></button>
                                    </div></>)}
                                </div>
                                {lpConfig.selectedBgId === bg.id && (<div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: TV.brand }}><Check size={10} className="text-white" strokeWidth={3} /></div>)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* COLOR TAB */}
                      {lpBgTab === "color" && (
                        <div className="space-y-3">
                          <div className="p-3 rounded-md border space-y-3" style={{ backgroundColor: TV.surfaceMuted, borderColor: TV.borderLight }}>
                            <p className="text-[10px] uppercase tracking-wider" style={{ fontWeight: 600, color: TV.textSecondary, letterSpacing: "0.5px" }}>Create Solid Color</p>
                            <div className="flex items-center gap-2">
                              <label className="w-12 h-12 rounded-md border cursor-pointer shrink-0 relative overflow-hidden shadow-sm" style={{ backgroundColor: lpSafeHex(lpNewColorHex), borderColor: TV.borderLight }}>
                                <input type="color" value={lpSafeHex(lpNewColorHex)} onChange={e => setLpNewColorHex(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                              </label>
                              <div className="flex-1 space-y-1.5">
                                <input value={lpNewColorHex} onChange={e => { let v = e.target.value; if (!v.startsWith("#")) v = "#" + v; if (v.length <= 7) setLpNewColorHex(v); }} className="w-full border rounded-sm px-2.5 py-1.5 text-[12px] font-mono outline-none focus:ring-2 focus:ring-tv-brand/30" style={{ borderColor: TV.borderLight }} placeholder="#1a1a2e" />
                                <input value={lpNewColorName} onChange={e => setLpNewColorName(e.target.value)} placeholder="Name (e.g. Deep Navy)" className="w-full border rounded-sm px-2.5 py-1.5 text-[12px] outline-none focus:ring-2 focus:ring-tv-brand/30" style={{ borderColor: TV.borderLight }} />
                              </div>
                            </div>
                            <button type="button" onClick={() => {
                              const cName = lpNewColorName.trim() || lpSafeHex(lpNewColorHex);
                              const newBg: LpBackground = { id: Date.now(), kind: "color", name: cName, color: lpSafeHex(lpNewColorHex) };
                              setLpBackgrounds(prev => [...prev, newBg]); updateLp({ selectedBgId: newBg.id }); setLpNewColorName(""); show(`"${cName}" added`, "success");
                            }} className="w-full py-2 text-white text-[11px] rounded-full transition-colors flex items-center justify-center gap-1" style={{ fontWeight: 600, backgroundColor: TV.brand }}>
                              <Plus size={11} />Add Color
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => updateLp({ selectedBgId: null })}
                              className={`group relative rounded-md overflow-hidden border-2 transition-all ${lpConfig.selectedBgId === null ? "ring-2 ring-tv-brand/20" : ""}`} style={{ borderColor: lpConfig.selectedBgId === null ? TV.brand : TV.borderLight }}>
                              <div className="aspect-[4/3] flex items-center justify-center" style={{ backgroundColor: TV.surfaceMuted }}><X size={16} style={{ color: TV.textSecondary }} /></div>
                              <div className="px-2 py-1.5 bg-white"><p className="text-[10px] truncate" style={{ fontWeight: 500, color: lpConfig.selectedBgId === null ? TV.textBrand : TV.textSecondary }}>No Background</p></div>
                              {lpConfig.selectedBgId === null && (<div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: TV.brand }}><Check size={10} className="text-white" strokeWidth={3} /></div>)}
                            </button>
                            {lpBackgrounds.filter(bg => bg.kind === "color").map(bg => (
                              <div key={bg.id} className={`group relative rounded-md overflow-hidden border-2 transition-all cursor-pointer ${lpConfig.selectedBgId === bg.id ? "ring-2 ring-tv-brand/20" : ""}`} style={{ borderColor: lpConfig.selectedBgId === bg.id ? TV.brand : TV.borderLight }} onClick={() => updateLp({ selectedBgId: bg.id })}>
                                <div className="aspect-[4/3]" style={{ backgroundColor: bg.color }} />
                                <div className="px-2 py-1.5 bg-white flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 flex-1 min-w-0"><div className="w-3 h-3 rounded-full shrink-0 border" style={{ backgroundColor: bg.color, borderColor: TV.borderLight }} /><p className="text-[10px] truncate" style={{ fontWeight: 500, color: lpConfig.selectedBgId === bg.id ? TV.textBrand : TV.textPrimary }}>{bg.name}</p></div>
                                  <button className="p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:text-tv-danger" style={{ color: TV.textSecondary }} onClick={e => { e.stopPropagation(); lpDeleteBg(bg.id); }} title="Delete"><Trash2 size={9} /></button>
                                </div>
                                {lpConfig.selectedBgId === bg.id && (<div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: TV.brand }}><Check size={10} className="text-white" strokeWidth={3} /></div>)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* GRADIENT TAB */}
                      {lpBgTab === "gradient" && (
                        <div className="space-y-3">
                          <div className="p-3 rounded-md border space-y-3" style={{ backgroundColor: TV.surfaceMuted, borderColor: TV.borderLight }}>
                            <p className="text-[10px] uppercase tracking-wider" style={{ fontWeight: 600, color: TV.textSecondary, letterSpacing: "0.5px" }}>Create Gradient</p>
                            <div className="h-14 rounded-md border overflow-hidden" style={{ borderColor: TV.borderLight, background: `linear-gradient(${lpNewGradDir}, ${lpSafeHex(lpNewGradFrom)}, ${lpSafeHex(lpNewGradTo)})` }} />
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] mb-1 block" style={{ color: TV.textSecondary }}>From</label>
                                <div className="flex items-center gap-1.5">
                                  <label className="w-8 h-8 rounded-sm border cursor-pointer shrink-0 relative overflow-hidden" style={{ backgroundColor: lpSafeHex(lpNewGradFrom), borderColor: TV.borderLight }}><input type="color" value={lpSafeHex(lpNewGradFrom)} onChange={e => setLpNewGradFrom(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" /></label>
                                  <input value={lpNewGradFrom} onChange={e => { let v = e.target.value; if (!v.startsWith("#")) v = "#" + v; if (v.length <= 7) setLpNewGradFrom(v); }} className="flex-1 min-w-0 border rounded-sm px-2 py-1 text-[10px] font-mono outline-none focus:ring-1 focus:ring-tv-brand/30" style={{ borderColor: TV.borderLight }} />
                                </div>
                              </div>
                              <div>
                                <label className="text-[9px] mb-1 block" style={{ color: TV.textSecondary }}>To</label>
                                <div className="flex items-center gap-1.5">
                                  <label className="w-8 h-8 rounded-sm border cursor-pointer shrink-0 relative overflow-hidden" style={{ backgroundColor: lpSafeHex(lpNewGradTo), borderColor: TV.borderLight }}><input type="color" value={lpSafeHex(lpNewGradTo)} onChange={e => setLpNewGradTo(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" /></label>
                                  <input value={lpNewGradTo} onChange={e => { let v = e.target.value; if (!v.startsWith("#")) v = "#" + v; if (v.length <= 7) setLpNewGradTo(v); }} className="flex-1 min-w-0 border rounded-sm px-2 py-1 text-[10px] font-mono outline-none focus:ring-1 focus:ring-tv-brand/30" style={{ borderColor: TV.borderLight }} />
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="text-[9px] mb-1 block" style={{ color: TV.textSecondary }}>Direction</label>
                              <div className="flex items-center gap-1.5">
                                {LP_GRADIENT_DIRS.map(d => (
                                  <button key={d.dir} type="button" onClick={() => setLpNewGradDir(d.dir)}
                                    className="w-8 h-8 rounded-sm flex items-center justify-center border transition-all"
                                    style={{ borderColor: lpNewGradDir === d.dir ? TV.brand : TV.borderLight, backgroundColor: lpNewGradDir === d.dir ? `${TV.brand}08` : "transparent", color: lpNewGradDir === d.dir ? TV.brand : TV.textSecondary }}
                                    title={d.dir}><d.icon size={13} /></button>
                                ))}
                              </div>
                            </div>
                            <input value={lpNewGradName} onChange={e => setLpNewGradName(e.target.value)} placeholder="Name (e.g. Sunset Glow)" className="w-full border rounded-sm px-2.5 py-1.5 text-[12px] outline-none focus:ring-2 focus:ring-tv-brand/30" style={{ borderColor: TV.borderLight }} />
                            <button type="button" onClick={() => {
                              const gName = lpNewGradName.trim() || `${lpSafeHex(lpNewGradFrom)} → ${lpSafeHex(lpNewGradTo)}`;
                              const newBg: LpBackground = { id: Date.now(), kind: "gradient", name: gName, gradientFrom: lpSafeHex(lpNewGradFrom), gradientTo: lpSafeHex(lpNewGradTo), gradientDir: lpNewGradDir };
                              setLpBackgrounds(prev => [...prev, newBg]); updateLp({ selectedBgId: newBg.id }); setLpNewGradName(""); show(`"${gName}" added`, "success");
                            }} className="w-full py-2 text-white text-[11px] rounded-full transition-colors flex items-center justify-center gap-1" style={{ fontWeight: 600, backgroundColor: TV.brand }}>
                              <Plus size={11} />Add Gradient
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => updateLp({ selectedBgId: null })}
                              className={`group relative rounded-md overflow-hidden border-2 transition-all ${lpConfig.selectedBgId === null ? "ring-2 ring-tv-brand/20" : ""}`} style={{ borderColor: lpConfig.selectedBgId === null ? TV.brand : TV.borderLight }}>
                              <div className="aspect-[4/3] flex items-center justify-center" style={{ backgroundColor: TV.surfaceMuted }}><X size={16} style={{ color: TV.textSecondary }} /></div>
                              <div className="px-2 py-1.5 bg-white"><p className="text-[10px] truncate" style={{ fontWeight: 500, color: lpConfig.selectedBgId === null ? TV.textBrand : TV.textSecondary }}>No Background</p></div>
                              {lpConfig.selectedBgId === null && (<div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: TV.brand }}><Check size={10} className="text-white" strokeWidth={3} /></div>)}
                            </button>
                            {lpBackgrounds.filter(bg => bg.kind === "gradient").map(bg => (
                              <div key={bg.id} className={`group relative rounded-md overflow-hidden border-2 transition-all cursor-pointer ${lpConfig.selectedBgId === bg.id ? "ring-2 ring-tv-brand/20" : ""}`} style={{ borderColor: lpConfig.selectedBgId === bg.id ? TV.brand : TV.borderLight }} onClick={() => updateLp({ selectedBgId: bg.id })}>
                                <div className="aspect-[4/3]" style={{ background: lpBgCss(bg) }} />
                                <div className="px-2 py-1.5 bg-white flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 flex-1 min-w-0"><div className="w-3 h-3 rounded-full shrink-0 border" style={{ background: lpBgCss(bg), borderColor: TV.borderLight }} /><p className="text-[10px] truncate" style={{ fontWeight: 500, color: lpConfig.selectedBgId === bg.id ? TV.textBrand : TV.textPrimary }}>{bg.name}</p></div>
                                  <button className="p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:text-tv-danger" style={{ color: TV.textSecondary }} onClick={e => { e.stopPropagation(); lpDeleteBg(bg.id); }} title="Delete"><Trash2 size={9} /></button>
                                </div>
                                {lpConfig.selectedBgId === bg.id && (<div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: TV.brand }}><Check size={10} className="text-white" strokeWidth={3} /></div>)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </LpAccordionSection>

                  {/* ── Accordion 4: Button Colors ── */}
                  <LpAccordionSection title="Button Colors" open={!!lpAccordion.buttons} onToggle={() => toggleLpSection("buttons")}
                    helper="Use bold colors to grab your recipients' attention." hasInfo>
                    <div className="space-y-3">
                      <LpColorField label="Call to Action Text" value={lpConfig.ctaTextColor} onChange={v => updateLp({ ctaTextColor: v })} />
                      <LpColorField label="Call to Action Button" value={lpConfig.ctaBtnColor} onChange={v => updateLp({ ctaBtnColor: v })} required />
                      <LpColorField label="Secondary Button Text" value={lpConfig.secondaryBtnTextColor} onChange={v => updateLp({ secondaryBtnTextColor: v })} />
                      <LpColorField label="Reply Button" value={lpConfig.replyBtnColor} onChange={v => updateLp({ replyBtnColor: v })} />
                      <LpColorField label="Save Button" value={lpConfig.saveBtnColor} onChange={v => updateLp({ saveBtnColor: v })} />
                      <LpColorField label="Share Button" value={lpConfig.shareBtnColor} onChange={v => updateLp({ shareBtnColor: v })} />
                    </div>
                  </LpAccordionSection>
                </div>
              </div>

              {/* ── Right: Live preview ── */}
              <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: TV.surface }}>
                {/* Preview toolbar */}
                <div className="flex items-center justify-between px-5 py-3 border-b bg-white shrink-0" style={{ borderColor: TV.borderLight }}>
                  <div className="flex items-center gap-3">
                    <p className="text-[14px]" style={{ fontWeight: 600, color: TV.textPrimary, fontStyle: "italic", fontFamily: "var(--tv-font-display, 'Fraunces', Roboto, sans-serif)" }}>1:1 Landing Page</p>
                    <button
                      onClick={() => setEnvelopeOpen(!envelopeOpen)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] transition-all hover:shadow-sm"
                      style={{ fontWeight: 600, borderColor: envelopeOpen ? TV.brand : TV.borderLight, color: envelopeOpen ? TV.textBrand : TV.textSecondary, backgroundColor: envelopeOpen ? `${TV.brand}08` : "white" }}
                    >
                      {envelopeOpen ? <><RotateCcw size={11} />Replay</> : <><Play size={11} />Open envelope</>}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px]" style={{ fontWeight: 500, color: TV.textSecondary }}>Preview as:</span>
                    <div className="flex items-center gap-1 rounded-md p-1 border" style={{ backgroundColor: TV.surfaceMuted, borderColor: TV.borderLight }}>
                      {([
                        { key: "desktop" as const, icon: Monitor, label: "Desktop" },
                        { key: "tablet" as const, icon: Tablet, label: "Tablet" },
                        { key: "mobile" as const, icon: Smartphone, label: "Mobile" },
                      ]).map(d => (
                        <button key={d.key} onClick={() => setPreviewDevice(d.key)} title={d.label}
                          className={`w-8 h-8 rounded-sm flex items-center justify-center transition-all ${
                            previewDevice === d.key ? "bg-white shadow-sm border" : ""
                          }`}
                          style={{
                            borderColor: previewDevice === d.key ? TV.borderLight : "transparent",
                            color: previewDevice === d.key ? TV.brand : TV.textSecondary,
                          }}>
                          <d.icon size={14} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Scrollable preview area */}
                <div className="flex-1 overflow-y-auto p-6 flex justify-center">
                  {(() => {
                    const pvWidth = previewDevice === "desktop" ? 560 : previewDevice === "tablet" ? 380 : 280;
                    const isMobile = previewDevice === "mobile";
                    const navTextColor = lpIsDark(lpConfig.navBarColor) ? "#ffffffee" : "#1a1a1a";

                    return (
                      <div style={{ width: pvWidth }} className="transition-all duration-300 shrink-0">
                        {/* Browser chrome */}
                        <div className="bg-[#2d2d2d] rounded-t-[12px] px-3.5 py-2.5 flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                          </div>
                          <div className="flex-1 bg-[#1a1a1a] rounded-sm px-3 py-1 flex items-center gap-1.5 min-w-0">
                            <Globe size={9} className="text-white/30 shrink-0" />
                            <span className="text-[9px] text-white/50 font-mono truncate">hartwell.thankview.com/1to1/abc123</span>
                          </div>
                        </div>

                        {/* Page body */}
                        <div className="rounded-b-[12px] overflow-hidden shadow-xl border border-t-0 bg-white" style={{ borderColor: TV.borderLight }}>
                          {/* Nav bar */}
                          <div className="relative px-4 py-3 flex items-center" style={{ backgroundColor: lpConfig.navBarColor }}>
                            {lpConfig.logo !== "none" || lpConfig.logoFile ? (
                              <div className="flex items-center gap-2">
                                {lpConfig.logoFile ? (
                                  <img src={lpConfig.logoFile} alt="Organization logo" className="h-5 object-contain" style={{ filter: lpIsDark(lpConfig.navBarColor) ? "brightness(10)" : "none" }} />
                                ) : (
                                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: lpIsDark(lpConfig.navBarColor) ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)" }}>
                                    {lpConfig.logo === "shield" && <Landmark size={11} style={{ color: navTextColor }} />}
                                    {lpConfig.logo === "star" && <Star size={11} style={{ color: navTextColor }} />}
                                    {lpConfig.logo === "mail" && <Mail size={11} style={{ color: navTextColor }} />}
                                  </div>
                                )}
                                <span className="text-[10px]" style={{ color: navTextColor, fontWeight: 600 }}>Hartwell University</span>
                              </div>
                            ) : (
                              <span className="text-[10px]" style={{ color: navTextColor, fontWeight: 600 }}>Hartwell University</span>
                            )}
                            <span className="ml-auto text-[8px]" style={{ color: navTextColor, opacity: 0.4 }}>thankview.com</span>
                          </div>

                          {/* Background area */}
                          {lpSelectedBg ? (
                            lpSelectedBg.kind === "image" ? (
                              <div className="relative">
                                <div style={{ aspectRatio: isMobile ? "1.4/1" : "2.2/1" }} className="overflow-hidden relative">
                                  {lpSelectedBg.url?.startsWith("blob:") ? (
                                    <img src={lpSelectedBg.url} alt={lpSelectedBg.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <ImageWithFallback src={lpSelectedBg.url!} alt={lpSelectedBg.name} className="w-full h-full object-cover" />
                                  )}
                                  {/* Envelope overlay */}
                                  <div className="absolute inset-0 flex justify-center items-center z-10">
                                    <div className="transition-all ease-in-out" style={{
                                      transitionDuration: "800ms",
                                      transform: envelopeOpen ? "scale(0.8) translateY(-12px)" : "scale(1)",
                                      opacity: envelopeOpen ? 0 : 1,
                                      filter: envelopeOpen ? "blur(4px)" : "none",
                                    }}>
                                      {(() => {
                                        const env = ENVELOPE_PRESETS[lpConfig.envelopeIdx];
                                        return (
                                          <EnvelopePreview envelopeColor={env.envelopeColor} linerColor={env.linerColor} primaryColor={env.primaryColor} secondaryColor={env.secondaryColor} frontDesign={env.frontDesign} frontDesignColor={env.frontDesignColor} frontLeftLogo={env.frontLeftLogo} stampSelection={env.stampSelection} postmarkColor={env.postmarkColor} recipientNameColor={env.recipientNameColor} mode="front" showName width={isMobile ? 140 : previewDevice === "tablet" ? 180 : 220} />
                                        );
                                      })()}
                                    </div>
                                    {/* Video player */}
                                    <div className="absolute inset-0 flex justify-center items-center transition-all ease-in-out z-20" style={{
                                      transitionDuration: "600ms",
                                      transitionDelay: envelopeOpen ? "400ms" : "0ms",
                                      opacity: envelopeOpen ? 1 : 0,
                                      transform: envelopeOpen ? "translateY(0) scale(1)" : "translateY(20px) scale(0.9)",
                                      pointerEvents: envelopeOpen ? "auto" : "none",
                                    }}>
                                      <div className="rounded-md overflow-hidden shadow-lg" style={{ width: isMobile ? "90%" : "80%" }}>
                                        <div style={{ aspectRatio: isMobile ? "1/1" : "16/9" }} className="bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative">
                                          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `radial-gradient(circle at 50% 50%, ${lpConfig.ctaBtnColor} 0%, transparent 70%)` }} />
                                          <div className={`${isMobile ? "w-10 h-10" : "w-14 h-14"} rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm border border-white/20`}>
                                            <Play size={isMobile ? 14 : 20} className="text-white ml-0.5" fill="white" />
                                          </div>
                                          <span className="absolute bottom-2 right-2 text-[8px] font-mono px-1.5 py-0.5 rounded bg-black/50 text-white">1:08</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                {lpConfig.fadeGradient && (
                                  <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-gradient-to-t from-white to-transparent" />
                                )}
                              </div>
                            ) : (
                              <div className="relative">
                                <div style={{ aspectRatio: isMobile ? "1.4/1" : "2.2/1", background: lpSelectedBg.kind === "color" ? lpSelectedBg.color : lpBgCss(lpSelectedBg) }} className="flex items-center justify-center relative">
                                  {/* Envelope overlay on color/gradient */}
                                  <div className="absolute inset-0 flex justify-center items-center z-10">
                                    <div className="transition-all ease-in-out" style={{
                                      transitionDuration: "800ms",
                                      transform: envelopeOpen ? "scale(0.8) translateY(-12px)" : "scale(1)",
                                      opacity: envelopeOpen ? 0 : 1,
                                      filter: envelopeOpen ? "blur(4px)" : "none",
                                    }}>
                                      {(() => {
                                        const env = ENVELOPE_PRESETS[lpConfig.envelopeIdx];
                                        return (
                                          <EnvelopePreview envelopeColor={env.envelopeColor} linerColor={env.linerColor} primaryColor={env.primaryColor} secondaryColor={env.secondaryColor} frontDesign={env.frontDesign} frontDesignColor={env.frontDesignColor} frontLeftLogo={env.frontLeftLogo} stampSelection={env.stampSelection} postmarkColor={env.postmarkColor} recipientNameColor={env.recipientNameColor} mode="front" showName width={isMobile ? 140 : previewDevice === "tablet" ? 180 : 220} />
                                        );
                                      })()}
                                    </div>
                                    <div className="absolute inset-0 flex justify-center items-center transition-all ease-in-out z-20" style={{
                                      transitionDuration: "600ms",
                                      transitionDelay: envelopeOpen ? "400ms" : "0ms",
                                      opacity: envelopeOpen ? 1 : 0,
                                      transform: envelopeOpen ? "translateY(0) scale(1)" : "translateY(20px) scale(0.9)",
                                      pointerEvents: envelopeOpen ? "auto" : "none",
                                    }}>
                                      <div className="rounded-md overflow-hidden shadow-lg" style={{ width: isMobile ? "90%" : "80%" }}>
                                        <div style={{ aspectRatio: isMobile ? "1/1" : "16/9" }} className="bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative">
                                          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `radial-gradient(circle at 50% 50%, ${lpConfig.ctaBtnColor} 0%, transparent 70%)` }} />
                                          <div className={`${isMobile ? "w-10 h-10" : "w-14 h-14"} rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm border border-white/20`}>
                                            <Play size={isMobile ? 14 : 20} className="text-white ml-0.5" fill="white" />
                                          </div>
                                          <span className="absolute bottom-2 right-2 text-[8px] font-mono px-1.5 py-0.5 rounded bg-black/50 text-white">1:08</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                {lpConfig.fadeGradient && (
                                  <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-gradient-to-t from-white to-transparent" />
                                )}
                              </div>
                            )
                          ) : (
                            <div style={{ aspectRatio: isMobile ? "1.4/1" : "2.2/1" }} className="bg-gradient-to-b from-gray-100 to-white flex items-center justify-center relative">
                              <div className="text-center z-10">
                                <ImageIcon size={20} className="mx-auto mb-1" style={{ color: TV.textSecondary }} />
                                <p className="text-[10px]" style={{ color: TV.textSecondary }}>No background selected</p>
                              </div>
                              {/* Envelope on no-bg */}
                              <div className="absolute inset-0 flex justify-center items-center z-10">
                                <div className="transition-all ease-in-out" style={{
                                  transitionDuration: "800ms",
                                  transform: envelopeOpen ? "scale(0.8) translateY(-12px)" : "scale(1)",
                                  opacity: envelopeOpen ? 0 : 1,
                                  filter: envelopeOpen ? "blur(4px)" : "none",
                                }}>
                                  {(() => {
                                    const env = ENVELOPE_PRESETS[lpConfig.envelopeIdx];
                                    return (
                                      <EnvelopePreview envelopeColor={env.envelopeColor} linerColor={env.linerColor} primaryColor={env.primaryColor} secondaryColor={env.secondaryColor} frontDesign={env.frontDesign} frontDesignColor={env.frontDesignColor} frontLeftLogo={env.frontLeftLogo} stampSelection={env.stampSelection} postmarkColor={env.postmarkColor} recipientNameColor={env.recipientNameColor} mode="front" showName width={isMobile ? 140 : previewDevice === "tablet" ? 180 : 220} />
                                    );
                                  })()}
                                </div>
                                <div className="absolute inset-0 flex justify-center items-center transition-all ease-in-out z-20" style={{
                                  transitionDuration: "600ms",
                                  transitionDelay: envelopeOpen ? "400ms" : "0ms",
                                  opacity: envelopeOpen ? 1 : 0,
                                  transform: envelopeOpen ? "translateY(0) scale(1)" : "translateY(20px) scale(0.9)",
                                  pointerEvents: envelopeOpen ? "auto" : "none",
                                }}>
                                  <div className="rounded-md overflow-hidden shadow-lg" style={{ width: isMobile ? "90%" : "80%" }}>
                                    <div style={{ aspectRatio: isMobile ? "1/1" : "16/9" }} className="bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative">
                                      <div className={`${isMobile ? "w-10 h-10" : "w-14 h-14"} rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm border border-white/20`}>
                                        <Play size={isMobile ? 14 : 20} className="text-white ml-0.5" fill="white" />
                                      </div>
                                      <span className="absolute bottom-2 right-2 text-[8px] font-mono px-1.5 py-0.5 rounded bg-black/50 text-white">1:08</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* CTA Button */}
                          <div className="px-5 py-3 flex justify-center">
                            {lpConfig.ctaLabel && (
                              <span className={`inline-block ${isMobile ? "px-5 py-2" : "px-7 py-2.5"} rounded-full text-[12px] cursor-default`}
                                style={{ backgroundColor: lpConfig.ctaBtnColor, color: lpConfig.ctaTextColor, fontWeight: 600 }}>
                                {lpConfig.ctaLabel} <ExternalLink size={11} className="inline ml-1" />
                              </span>
                            )}
                          </div>

                          {/* Content */}
                          <div className={`${isMobile ? "px-3" : "px-5"} py-3`}>
                            <div className="text-center mb-3">
                              <h3 className="leading-tight mb-1 text-[14px]" style={{ fontWeight: 800, color: TV.textPrimary }}>{lpConfig.headline || "Your headline here"}</h3>
                              <p className="text-[11px] leading-relaxed" style={{ color: TV.textSecondary }}>{lpConfig.subheadline}</p>
                            </div>
                            {lpConfig.body && (
                              <p className="text-[11px] leading-relaxed mb-3" style={{ color: TV.textLabel }}>{lpConfig.body}</p>
                            )}
                            {lpConfig.showFundContext && (
                              <div className="rounded-md p-4 border mb-3" style={{ borderColor: TV.borderLight }}>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-[11px]" style={{ fontWeight: 700, color: TV.textPrimary }}>Hartwell Annual Fund</p>
                                  <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ fontWeight: 600, backgroundColor: `${lpConfig.ctaBtnColor}15`, color: lpConfig.ctaBtnColor }}>68%</span>
                                </div>
                                <div className="h-2 rounded-full overflow-hidden mb-1.5" style={{ backgroundColor: TV.surfaceMuted }}>
                                  <div className="h-full rounded-full" style={{ width: "68%", backgroundColor: lpConfig.ctaBtnColor }} />
                                </div>
                                <div className="flex justify-between text-[9px]" style={{ color: TV.textSecondary }}>
                                  <span style={{ fontWeight: 600, color: TV.textPrimary }}>$342,000 raised</span>
                                  <span>Goal: $500,000</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Divider */}
                          <div className="mx-5 border-t" style={{ borderColor: TV.borderLight }} />

                          {/* Action buttons row */}
                          <div className={`px-5 py-3 flex ${isMobile ? "flex-col gap-2" : "flex-row items-center justify-center gap-2"}`}>
                            {lpConfig.showReply && (
                              <span className={`inline-flex items-center justify-center gap-1 ${isMobile ? "w-full" : ""} px-4 py-2 rounded-full border text-[10px] cursor-default`}
                                style={{ color: lpConfig.replyBtnColor, borderColor: lpConfig.replyBtnColor + "60", fontWeight: 500 }}>
                                Reply
                              </span>
                            )}
                            <span className={`inline-flex items-center justify-center gap-1 ${isMobile ? "w-full" : ""} px-4 py-2 rounded-full text-[10px] text-white cursor-default`}
                              style={{ backgroundColor: lpConfig.saveBtnColor, fontWeight: 500 }}>
                              Save
                            </span>
                            <span className={`inline-flex items-center justify-center gap-1 ${isMobile ? "w-full" : ""} px-4 py-2 rounded-full text-[10px] text-white cursor-default`}
                              style={{ backgroundColor: lpConfig.shareBtnColor, fontWeight: 500 }}>
                              Share
                            </span>
                          </div>

                          {/* Footer */}
                          <div className="px-5 py-3 border-t text-center" style={{ backgroundColor: TV.surfaceMuted, borderColor: TV.borderLight }}>
                            <p className="text-[7px]" style={{ color: TV.textSecondary }}>Powered by ThankView by EverTrue</p>
                          </div>
                        </div>

                        {/* Label */}
                        <div className="text-center mt-4">
                          <p className="text-[12px]" style={{ fontWeight: 600, color: TV.textPrimary }}>1:1 Landing Page</p>
                          <p className="text-[10px] mt-0.5" style={{ color: TV.textSecondary }}>
                            {previewDevice === "desktop" ? "Desktop" : previewDevice === "tablet" ? "Tablet" : "Mobile"} Preview · {lpSelectedBg ? lpSelectedBg.name : "No background"}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════ */}
          {/* REVIEW & SEND PHASE             */}
          {/* ════════════════════════════════ */}
          {sessionStarted && phase === "review" && (
            <div className="flex-1 overflow-y-auto p-6">
              {/* Stats row */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ backgroundColor: `${TV.brand}12` }}>
                    <Link2 size={18} style={{ color: TV.brand }} />
                  </div>
                  <div>
                    <p className="text-[15px]" style={{ fontWeight: 700, color: TV.textPrimary }}>Review & Send</p>
                    <p className="text-[11px]" style={{ color: TV.textSecondary }}>
                      {recordedCount} video{recordedCount !== 1 ? "s" : ""} recorded · {sentCount} sent · {unsentRecordings.length} ready to send
                    </p>
                  </div>
                </div>
                {/* Back to recording */}
                {unrecordedContacts.length > 0 && (
                  <button
                    onClick={() => {
                      const next = unrecordedContacts[0];
                      setCurrentContactId(next.id);
                      setPhase("queue");
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full border text-[12px] transition-colors hover:bg-black/[0.02]"
                    style={{ fontWeight: 500, borderColor: TV.borderLight, color: TV.textBrand }}
                  >
                    <Camera size={12} />{unrecordedContacts.length} still need videos
                  </button>
                )}
              </div>

              {/* Contact rows */}
              <div className="space-y-2">
                {selectedContacts.map(c => {
                  const rec = recordings.find(r => r.contactId === c.id);
                  const link = rec ? `https://tv.ht/1to1/${rec.videoData.id.slice(0, 8)}` : null;
                  const isCopied = copiedLinkId === c.id;
                  const isSent = rec?.sendStatus === "sent";
                  return (
                    <div key={c.id} className="flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors" style={{ borderColor: TV.borderLight, backgroundColor: isSent ? TV.successBg : isCopied ? "#faf5ff" : "white" }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] shrink-0" style={{ fontWeight: 700, backgroundColor: c.color }}>
                        {c.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[12px] truncate" style={{ fontWeight: 600, color: TV.textPrimary }}>{c.name}</p>
                          {isSent && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px]" style={{ fontWeight: 600, backgroundColor: TV.successBg, color: TV.success }}>
                              <Check size={8} />Sent
                            </span>
                          )}
                        </div>
                        {link ? (
                          <p className="text-[10px] font-mono truncate" style={{ color: TV.textSecondary }}>{link}</p>
                        ) : (
                          <p className="text-[10px]" style={{ color: TV.warning, fontWeight: 500 }}>No video yet</p>
                        )}
                      </div>
                      {rec ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(link!).catch((_e) => {});
                              setCopiedLinkId(c.id);
                              show(`Link copied for ${c.name}`, "success");
                              setTimeout(() => setCopiedLinkId(prev => prev === c.id ? null : prev), 2000);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-[11px] transition-all hover:bg-black/[0.02]"
                            style={{ fontWeight: 500, borderColor: isCopied ? TV.brand : TV.borderLight, color: isCopied ? TV.textBrand : TV.textSecondary }}
                          >
                            {isCopied ? <Check size={11} /> : <Copy size={11} />}
                            {isCopied ? "Copied" : "Copy"}
                          </button>
                          {!isSent ? (
                            <button
                              onClick={() => sendToContact(c.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[11px] text-white transition-all hover:opacity-90"
                              style={{ fontWeight: 500, backgroundColor: TV.brand }}
                            >
                              <Send size={11} />Send
                            </button>
                          ) : (
                            <button
                              onClick={() => sendToContact(c.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-[11px] transition-all hover:bg-black/[0.02]"
                              style={{ fontWeight: 500, borderColor: TV.borderLight, color: TV.textSecondary }}
                            >
                              <Send size={11} />Resend
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => { setCurrentContactId(c.id); setPhase("queue"); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-[11px] transition-all hover:bg-black/[0.02]"
                          style={{ fontWeight: 500, borderColor: TV.borderLight, color: TV.textBrand }}
                        >
                          <Camera size={11} />Record
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bulk actions */}
              {recordings.length > 0 && (
                <div className="mt-5 pt-4 border-t flex items-center justify-between" style={{ borderColor: TV.borderLight }}>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        const rows = recordings.map(rec => {
                          const c = ALL_CONTACTS.find(x => x.id === rec.contactId)!;
                          return `"${c.name}","${c.email}","https://tv.ht/1to1/${rec.videoData.id.slice(0, 8)}"`;
                        });
                        const csv = `"Name","Email","1:1 Link"\n${rows.join("\n")}`;
                        const blob = new Blob([csv], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a"); a.href = url; a.download = "1to1-links.csv"; a.click();
                        URL.revokeObjectURL(url);
                        show("CSV downloaded!", "success");
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-sm border text-[12px] transition-all hover:bg-black/[0.02]"
                      style={{ fontWeight: 500, borderColor: TV.borderLight, color: TV.textPrimary }}
                    >
                      <ExternalLink size={12} />Export CSV
                    </button>
                  </div>
                  {unsentRecordings.length > 0 && (
                    <button
                      onClick={sendAllUnsent}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] text-white transition-all hover:opacity-90 shadow-md"
                      style={{ fontWeight: 700, backgroundColor: TV.brand }}
                    >
                      <Send size={13} />Send All {unsentRecordings.length} Unsent
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ══ Footer ══ */}
        <div className="flex items-center gap-3 px-6 py-3 border-t" style={{ borderColor: TV.borderLight }}>
          {!sessionStarted ? (
            <>
              <button onClick={onBack} className="px-5 py-2 rounded-full text-[13px] text-tv-danger border border-tv-danger-border transition-colors hover:bg-tv-danger-bg" style={{ fontWeight: 500 }}>
                Cancel
              </button>
              <div className="flex-1" />
              <span className="text-[12px]" style={{ color: TV.textSecondary }}>
                <span style={{ fontWeight: 600 }}>{selectedContacts.length}</span> contact{selectedContacts.length !== 1 ? "s" : ""} selected
              </span>
              <button
                onClick={() => startSession()}
                disabled={selectedContacts.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full text-[13px] text-white transition-all hover:opacity-90 disabled:opacity-40"
                style={{ fontWeight: 700, backgroundColor: TV.record }}
              >
                Start Recording Session <ChevronRight size={14} />
              </button>
            </>
          ) : phase === "review" ? (
            <>
              <button onClick={() => { setLandingOrigin("review"); setPhase("landing"); }} className="flex items-center gap-1.5 px-5 py-2 rounded-full text-[13px] border transition-colors hover:bg-black/5" style={{ fontWeight: 500, borderColor: TV.borderLight, color: TV.textPrimary }}>
                <Globe size={13} />Edit Landing Page
              </button>
              <div className="flex-1" />
              {/* Progress summary */}
              <div className="flex items-center gap-3 mr-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TV.success }} />
                  <span className="text-[11px]" style={{ color: TV.textSecondary }}>{sentCount} sent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TV.brand }} />
                  <span className="text-[11px]" style={{ color: TV.textSecondary }}>{unsentRecordings.length} ready</span>
                </div>
                {unrecordedContacts.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TV.borderStrong }} />
                    <span className="text-[11px]" style={{ color: TV.textSecondary }}>{unrecordedContacts.length} pending</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => { show(`Session complete! ${sentCount} sent, ${unsentRecordings.length} queued.`, "success"); onDone?.(); }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full text-[13px] text-white transition-all hover:opacity-90"
                style={{ fontWeight: 700, backgroundColor: TV.brand }}
              >
                Done <CheckCircle2 size={14} />
              </button>
            </>
          ) : phase === "landing" ? (
            <>
              <button onClick={() => setPhase(landingOrigin === "review" ? "review" : "queue")} className="px-5 py-2 rounded-full text-[13px] border transition-colors hover:bg-black/5" style={{ fontWeight: 500, borderColor: TV.borderLight, color: TV.textPrimary }}>
                Back
              </button>
              <div className="flex-1" />
              <span className="text-[12px]" style={{ color: TV.textSecondary }}>
                <span style={{ fontWeight: 600 }}>{recordedCount}</span> video{recordedCount !== 1 ? "s" : ""} ready
              </span>
              <button
                onClick={() => setPhase("review")}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full text-[13px] text-white transition-all hover:opacity-90"
                style={{ fontWeight: 700, backgroundColor: TV.brand }}
              >
                {landingOrigin === "review" ? "Save Changes" : "Save & Review"} <ChevronRight size={14} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  if (recordings.length > 0) {
                    setLandingOrigin("recording");
                    setPhase("landing");
                  } else {
                    setSessionStarted(false);
                    setPhase("queue");
                  }
                }}
                className="px-5 py-2 rounded-full text-[13px] border transition-colors hover:bg-black/5"
                style={{ fontWeight: 500, borderColor: TV.borderLight, color: TV.textPrimary }}
              >
                {recordings.length > 0 ? "Landing Page" : "Back"}
              </button>
              {/* Auto-advance toggle */}
              <button
                onClick={() => setAutoAdvance(!autoAdvance)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] transition-all"
                style={{ fontWeight: 500, borderColor: autoAdvance ? TV.brand : TV.borderLight, color: autoAdvance ? TV.textBrand : TV.textSecondary, backgroundColor: autoAdvance ? `${TV.brand}08` : "transparent" }}
                title="Automatically advance to next constituent after saving"
              >
                <Zap size={10} />Auto-advance
              </button>
              <div className="flex-1" />

              {/* Progress indicator */}
              <div className="flex items-center gap-2 mr-2">
                <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: TV.surface }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${selectedContacts.length > 0 ? (recordedCount / selectedContacts.length) * 100 : 0}%`, backgroundColor: TV.brand }}
                  />
                </div>
                <span className="text-[11px]" style={{ fontWeight: 600, color: TV.textSecondary }}>
                  {recordedCount}/{selectedContacts.length}
                </span>
              </div>
              {recordedCount > 0 && recordedCount === selectedContacts.length ? (
                <button
                  onClick={() => { setLandingOrigin("recording"); setPhase("landing"); }}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full text-[13px] text-white transition-all hover:opacity-90"
                  style={{ fontWeight: 700, backgroundColor: TV.brand }}
                >
                  <Globe size={14} />Customize Landing Page <ChevronRight size={14} />
                </button>
              ) : recordedCount > 0 ? (
                <button
                  onClick={() => { setLandingOrigin("recording"); setPhase("landing"); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] border transition-colors hover:bg-black/[0.02]"
                  style={{ fontWeight: 500, borderColor: TV.borderLight, color: TV.textBrand }}
                >
                  <Globe size={12} />Landing Page ({recordedCount}) <ChevronRight size={13} />
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* ── Video editor (shared component) ── */}
      {phase === "editor" && editingVideo && editorCtx && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <VideoEditor
            initialName={editorCtx.name}
            initialDuration={editorCtx.duration}
            videoType="1:1 Personalized"
            recipientName={currentContact?.name}
            canDelete
            initialData={editingVideo ? {
              tags: editingVideo.tags,
              description: editingVideo.description,
              trimStart: editingVideo.trimStart,
              trimEnd: editingVideo.trimEnd,
              isTrimmed: editingVideo.trimStart > 0 || editingVideo.trimEnd < editingVideo.durationSec,
              rotation: editingVideo.rotation,
            } : undefined}
            onSave={handleSaveEdited}
            onDelete={handleDeleteEdited}
            onCancel={() => { setEditingVideo(null); setEditorCtx(null); setPhase("record"); }}
          />
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  LP Accordion Section (used in landing page phase)
// ═════════════════════════════════════════════════════════════════════════════
function LpAccordionSection({ title, open, onToggle, helper, hasInfo, children }: {
  title: string; open: boolean; onToggle: () => void;
  helper?: string; hasInfo?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="border-b" style={{ borderColor: TV.borderLight }}>
      <button onClick={onToggle} type="button"
        className="w-full flex items-center justify-between py-3.5 text-left group">
        <span className="text-[13px]" style={{ fontWeight: 700, color: TV.textPrimary }}>{title}</span>
        <ChevronDown size={15} className={`transition-transform ${open ? "rotate-0" : "-rotate-90"}`} style={{ color: TV.textSecondary }} />
      </button>
      {open && (
        <div className="pb-4">
          {helper && (
            <p className="text-[11px] leading-relaxed mb-3 flex items-start gap-1.5" style={{ color: TV.textSecondary }}>
              <span>{helper}</span>
              {hasInfo && (
                <span className="shrink-0 mt-0.5" title={helper}>
                  <Info size={11} style={{ color: TV.textSecondary }} />
                </span>
              )}
            </p>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  LP Color Field (used in landing page phase)
// ═════════════════════════════════════════════════════════════════════════════
function LpColorField({ label, value, onChange, required }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider mb-1.5 block" style={{ fontWeight: 600, color: TV.textSecondary, letterSpacing: "0.5px" }}>
        {label} {required && <span style={{ color: TV.danger }}>*</span>}
      </label>
      <div className="flex items-center gap-2">
        <input value={value} onChange={e => {
          let v = e.target.value;
          if (!v.startsWith("#")) v = "#" + v;
          if (v.length <= 7) onChange(v);
        }}
          className="flex-1 min-w-0 border rounded-md px-3 py-2.5 text-[13px] font-mono outline-none focus:ring-2 focus:ring-tv-brand/30 bg-white"
          style={{ borderColor: TV.borderLight, color: TV.textPrimary }}
          placeholder="#000000" />
        <label className="w-10 h-10 rounded-sm border cursor-pointer shrink-0 relative overflow-hidden shadow-sm"
          style={{ backgroundColor: lpSafeHex(value), borderColor: TV.borderLight }}>
          <input type="color" value={lpSafeHex(value)} onChange={e => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
        </label>
      </div>
    </div>
  );
}
