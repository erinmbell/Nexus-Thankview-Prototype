import { useState, useCallback, useRef } from "react";
import {
  X, Play, Pause, Save,
  Scissors, Crop, Captions, RotateCw,
  FolderOpen, Image, Plus, Tag, User, Upload,
  FileText, Trash2, Undo2, ChevronDown,
  Wand2, Download, Loader2, Eye, EyeOff, Ban, FileUp, Sparkles,
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { fmtSec } from "../../utils";

// ── VideoData shape ──────────────────────────────────────────────────────────
export interface VideoData {
  id: number;
  name: string;
  description: string;
  tags: string[];
  recipientName: string;
  folder: string;
  thumbnailUrl: string | null;
  duration: string;
  rotation: number;          // 0 | 90 | 180 | 270
  trimStart: number;         // seconds
  trimEnd: number;           // seconds
  originalDuration: number;  // seconds
  isTrimmed: boolean;
  cropArea: { x: number; y: number; w: number; h: number } | null;
  captions: CaptionLine[];
  createdAt: string;
  url: string | null;
}

interface CaptionLine {
  id: number;
  text: string;
  start: string;
  end: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function parseDuration(d: string): number {
  const parts = d.split(":").map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

function makeDefaultVideoData(opts: { name: string; duration: string; recipientName?: string }): VideoData {
  const dur = parseDuration(opts.duration);
  return {
    id: Date.now(),
    name: opts.name,
    description: "",
    tags: [],
    recipientName: opts.recipientName ?? "",
    folder: "Uncategorized",
    thumbnailUrl: null,
    duration: opts.duration,
    rotation: 0,
    trimStart: 0,
    trimEnd: dur,
    originalDuration: dur,
    isTrimmed: false,
    cropArea: null,
    captions: [],
    createdAt: "Mar 3, 2026",
    url: null,
  };
}

// ── Constants ────────────────────────────────────────────────────────────────
type EditorTab = "details" | "trim" | "crop" | "captions" | "thumbnail";

const TABS: { key: EditorTab; icon: typeof FileText; label: string }[] = [
  { key: "details",   icon: FileText, label: "Details" },
  { key: "trim",      icon: Scissors, label: "Trim" },
  { key: "crop",      icon: Crop,     label: "Crop & Rotate" },
  { key: "captions",  icon: Captions, label: "Captions" },
  { key: "thumbnail", icon: Image,    label: "Thumbnail" },
];

const FOLDERS = ["Uncategorized", "Campaign Videos", "Personalized", "Intros", "Outros", "Drafts", "Archive"];
const SUGGESTED_TAGS = ["thank-you", "spring", "scholarship", "impact", "personalized", "intro", "outro", "branded", "campus", "appeal", "year-end", "cta", "tour"];
const LANGUAGES = ["English", "Spanish", "French", "German", "Portuguese", "Japanese", "Chinese", "Korean", "Italian"];
const TEXT_COLORS  = ["#ffffff", "#1a1a1a", "#6b7280", "#22c55e", "#f97316", "#60a5fa"];
const BG_COLORS    = ["#1a1a1a", "#ffffff", "#374151", "#1e3a5f", "#6c3fc5", "transparent"];
const CROP_PRESETS: { label: string; ratio: string }[] = [
  { label: "Original", ratio: "original" },
  { label: "16:9",     ratio: "16:9" },
  { label: "9:16",     ratio: "9:16" },
  { label: "4:3",      ratio: "4:3" },
  { label: "1:1",      ratio: "1:1" },
];
const ROTATION_OPTIONS = [
  { deg: 0,   label: "0\u00b0 \u2014 Original" },
  { deg: 90,  label: "90\u00b0 \u2014 Right" },
  { deg: 180, label: "180\u00b0 \u2014 Upside Down" },
  { deg: 270, label: "270\u00b0 \u2014 Left" },
];

// ═════════════════════════════════════════════════════════════════════════════
//  VideoEditorModal
// ═════════════════════════════════════════════════════════════════════════════
export interface VideoEditorModalProps {
  initialName: string;
  initialDuration: string;
  recipientName?: string;
  canDelete?: boolean;
  onSave: (data: VideoData) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function VideoEditorModal({
  initialName,
  initialDuration,
  recipientName,
  canDelete = false,
  onSave,
  onDelete,
  onClose,
}: VideoEditorModalProps) {
  const { show } = useToast();
  const triggerRef = useRef<HTMLElement | null>(null);

  // Capture the element that triggered the modal for focus return (WCAG 2.4.3)
  useState(() => {
    triggerRef.current = document.activeElement as HTMLElement;
  });

  const handleClose = () => {
    onClose();
    triggerRef.current?.focus();
  };

  // ── Video data state ──
  const [data, setData] = useState<VideoData>(() =>
    makeDefaultVideoData({ name: initialName, duration: initialDuration, recipientName })
  );

  const [tab, setTab] = useState<EditorTab>("details");
  const [hasChanges, setHasChanges] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [scrubber, setScrubber] = useState(0);
  const [tagInput, setTagInput] = useState("");
  const [folderOpen, setFolderOpen] = useState(false);

  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // ── Thumbnail state ──
  const [thumbnailSource, setThumbnailSource] = useState<"none" | "frame" | "upload">("none");
  const [selectedFrameIdx, setSelectedFrameIdx] = useState<number | null>(null);
  const FRAME_COUNT = 8;
  const frameTimes = Array.from({ length: FRAME_COUNT }, (_, i) =>
    Math.round((i / (FRAME_COUNT - 1)) * data.originalDuration)
  );

  const upd = useCallback(<K extends keyof VideoData>(key: K, val: VideoData[K]) => {
    setData(prev => ({ ...prev, [key]: val }));
    setHasChanges(true);
  }, []);

  // ── Trim ──
  const handleTrimStartPct = useCallback((pct: number) => {
    const s = Math.round((pct / 100) * data.originalDuration);
    upd("trimStart", Math.min(s, data.trimEnd - 1));
    upd("isTrimmed", true);
  }, [data.originalDuration, data.trimEnd, upd]);

  const handleTrimEndPct = useCallback((pct: number) => {
    const s = Math.round((pct / 100) * data.originalDuration);
    upd("trimEnd", Math.max(s, data.trimStart + 1));
    upd("isTrimmed", true);
  }, [data.originalDuration, data.trimStart, upd]);

  const resetTrim = useCallback(() => {
    upd("trimStart", 0);
    upd("trimEnd", data.originalDuration);
    upd("isTrimmed", false);
  }, [data.originalDuration, upd]);

  // ── Rotate ──
  const rotate90 = useCallback(() => {
    upd("rotation", ((data.rotation + 90) % 360) as 0 | 90 | 180 | 270);
  }, [data.rotation, upd]);

  const setRotationDeg = useCallback((deg: number) => {
    upd("rotation", deg as 0 | 90 | 180 | 270);
  }, [upd]);

  // ── Tags ──
  const addTag = useCallback(() => {
    if (!tagInput.trim()) return;
    upd("tags", [...data.tags, tagInput.trim()]);
    setTagInput("");
  }, [tagInput, data.tags, upd]);

  const removeTag = useCallback((idx: number) => {
    upd("tags", data.tags.filter((_, i) => i !== idx));
  }, [data.tags, upd]);

  // ── Captions ──
  const addCaption = useCallback(() => {
    upd("captions", [...data.captions, { id: Date.now(), text: "", start: "0:00", end: "0:05" }]);
  }, [data.captions, upd]);

  const removeCaption = useCallback((idx: number) => {
    upd("captions", data.captions.filter((_, i) => i !== idx));
  }, [data.captions, upd]);

  const updateCaption = useCallback((idx: number, patch: Partial<CaptionLine>) => {
    upd("captions", data.captions.map((c, i) => i === idx ? { ...c, ...patch } : c));
  }, [data.captions, upd]);

  const generateSampleCaptions = useCallback(() => {
    upd("captions", [
      { id: 1, text: "Hi there! Thank you for your generous contribution.", start: "0:00", end: "0:05" },
      { id: 2, text: "Your support means the world to our students.", start: "0:05", end: "0:10" },
      { id: 3, text: "Together, we can build a brighter future.", start: "0:10", end: "0:15" },
    ]);
    show("Sample captions generated", "success");
  }, [upd, show]);

  // ── Crop ──
  const [cropPreset, setCropPreset] = useState("original");
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropW, setCropW] = useState(100);
  const [cropH, setCropH] = useState(100);

  const applyCrop = useCallback(() => {
    upd("cropArea", { x: cropX, y: cropY, w: cropW, h: cropH });
  }, [cropX, cropY, cropW, cropH, upd]);

  const resetCrop = useCallback(() => {
    setCropX(0); setCropY(0); setCropW(100); setCropH(100);
    setCropPreset("original");
    upd("cropArea", null);
  }, [upd]);

  // ── Caption controls state ──
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [captionLang, setCaptionLang] = useState("English");
  const [captionSize, setCaptionSize] = useState<"S" | "M" | "L">("M");
  const [captionPos, setCaptionPos] = useState<"Top" | "Bottom">("Bottom");
  const [textColor, setTextColor] = useState("#ffffff");
  const [bgColor, setBgColor] = useState("#1a1a1a");
  const [bgOpacity, setBgOpacity] = useState(75);
  const [captionSource, setCaptionSource] = useState<"none" | "upload" | "ai" | "rev">("none");
  const [captionProcessing, setCaptionProcessing] = useState<"idle" | "ai" | "rev">("idle");
  const [showCaptionsByDefault, setShowCaptionsByDefault] = useState(true);

  /** Req 40 — simulate VTT/SRT file upload */
  const handleCaptionFileUpload = useCallback(() => {
    upd("captions", [
      { id: 101, text: "Welcome to our campus. We're so glad you're here.", start: "0:00", end: "0:04" },
      { id: 102, text: "Your generosity has made a real difference.", start: "0:04", end: "0:08" },
      { id: 103, text: "Let me show you the impact of your gift.", start: "0:08", end: "0:12" },
      { id: 104, text: "Thank you from the bottom of our hearts.", start: "0:12", end: "0:16" },
    ]);
    setCaptionSource("upload");
    setCaptionsEnabled(true);
    show("Caption file imported successfully", "success");
  }, [upd, show]);

  /** Req 41 — simulate AI captioning with processing state */
  const handleAICaptions = useCallback(() => {
    setCaptionProcessing("ai");
    setHasChanges(true);
    show("Generating captions with AI\u2026", "info");
    setTimeout(() => {
      upd("captions", [
        { id: 201, text: "Hi there! Thank you for your generous contribution.", start: "0:00", end: "0:05" },
        { id: 202, text: "Your support means the world to our students.", start: "0:05", end: "0:10" },
        { id: 203, text: "Together, we can build a brighter future.", start: "0:10", end: "0:15" },
        { id: 204, text: "We couldn't do this without you.", start: "0:15", end: "0:19" },
      ]);
      setCaptionSource("ai");
      setCaptionProcessing("idle");
      setCaptionsEnabled(true);
      show("AI captions generated successfully", "success");
    }, 3000);
  }, [upd, show]);

  /** Req 42 — simulate REV human captions order */
  const handleREVCaptions = useCallback(() => {
    setCaptionProcessing("rev");
    setHasChanges(true);
    show("Ordering human captions from REV\u2026 (1 credit)", "info");
    setTimeout(() => {
      upd("captions", [
        { id: 301, text: "Hello, and thank you for your generous support.", start: "0:00", end: "0:04" },
        { id: 302, text: "Your gift truly makes a difference in the lives of our students.", start: "0:04", end: "0:09" },
        { id: 303, text: "We are so grateful for partners like you.", start: "0:09", end: "0:14" },
        { id: 304, text: "Thank you again. We couldn't do this without you.", start: "0:14", end: "0:19" },
      ]);
      setCaptionSource("rev");
      setCaptionProcessing("idle");
      setCaptionsEnabled(true);
      show("REV captions delivered", "success");
    }, 5000);
  }, [upd, show]);

  const handleCancelProcessing = useCallback(() => {
    setCaptionProcessing("idle");
    show("Caption processing cancelled", "info");
  }, [show]);

  const handleDownloadCaptions = useCallback(() => {
    const vtt = "WEBVTT\n\n" + data.captions.map((l, i) =>
      `${i + 1}\n${l.start}.000 --> ${l.end}.000\n${l.text}\n`
    ).join("\n");
    const blob = new Blob([vtt], { type: "text/vtt" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.name || "video"}-captions.vtt`;
    a.click();
    URL.revokeObjectURL(url);
    show("Captions downloaded as VTT", "success");
  }, [data.captions, data.name, show]);

  const handleDeleteAllCaptions = useCallback(() => {
    upd("captions", []);
    setCaptionSource("none");
    show("All captions deleted", "info");
  }, [upd, show]);

  // ── Save / undo ──
  const handleSave = useCallback(() => {
    onSave(data);
    show("Video saved", "success");
  }, [data, onSave, show]);

  const handleUndo = useCallback(() => {
    setData(makeDefaultVideoData({ name: initialName, duration: initialDuration, recipientName }));
    setHasChanges(false);
    show("Changes undone", "info");
  }, [initialName, initialDuration, recipientName, show]);

  const handleDelete = useCallback(() => {
    onDelete?.();
    show("Video deleted", "info");
  }, [onDelete, show]);

  // ── Derived for trim slider ──
  const trimStartPct = data.originalDuration > 0 ? (data.trimStart / data.originalDuration) * 100 : 0;
  const trimEndPct = data.originalDuration > 0 ? (data.trimEnd / data.originalDuration) * 100 : 100;
  const trimmedDuration = data.trimEnd - data.trimStart;

  // ── Helper: generate canvas thumbnail for frame picker ──
  const generateFrameThumbnail = useCallback((sec: number, hue: number) => {
    const canvas = document.createElement("canvas");
    canvas.width = 320; canvas.height = 180;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 320, 180);
      grad.addColorStop(0, `hsl(${hue}, 40%, 25%)`);
      grad.addColorStop(1, `hsl(${(hue + 60) % 360}, 50%, 35%)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 320, 180);
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "center";
      ctx.fillText(fmtSec(sec), 160, 100);
    }
    return canvas.toDataURL("image/png");
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl flex flex-col w-full max-w-[1000px] max-h-[92vh] overflow-hidden">

        {/* ══ Header ══ */}
        <div className="px-6 py-3.5 border-b border-tv-border-divider shrink-0 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-black text-tv-text-primary truncate">{data.name}</h3>
            <p className="text-[11px] text-tv-text-secondary mt-0.5">{data.duration} &middot; {data.createdAt}</p>
          </div>
          {canDelete && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium border border-tv-danger/30 text-tv-danger rounded-full hover:bg-tv-danger/5 transition-colors"
            >
              <Trash2 size={11} />Delete Video
            </button>
          )}
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-full border border-tv-border-light flex items-center justify-center hover:bg-tv-surface transition-colors shrink-0"
          >
            <X size={12} className="text-tv-text-secondary" />
          </button>
        </div>

        {/* ══ Tab bar ══ */}
        <div className="px-6 shrink-0 border-b border-tv-border-divider flex items-center gap-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium border-b-2 -mb-px transition-colors ${
                tab === t.key
                  ? "border-tv-brand-bg text-tv-brand"
                  : "border-transparent text-tv-text-secondary hover:text-tv-text-primary"
              }`}
            >
              <t.icon size={13} />{t.label}
            </button>
          ))}
        </div>

        {/* ══ Body ══ */}
        <div className="flex-1 flex min-h-0 overflow-hidden">

          {/* ── Left: Settings panel ── */}
          <div className="w-[300px] border-r border-tv-border-divider overflow-y-auto p-5 shrink-0 bg-white">

            {/* ━━ DETAILS TAB ━━ */}
            {tab === "details" && (
              <>
                <div className="mb-4">
                  <label className="text-[11px] font-semibold text-tv-text-primary mb-1.5 block">Name</label>
                  <input
                    value={data.name}
                    onChange={e => upd("name", e.target.value)}
                    className="w-full border border-tv-border-light rounded-sm px-3 py-2 text-[12px] outline-none focus:border-tv-brand-bg focus:ring-2 focus:ring-tv-brand-bg/20 transition-colors"
                  />
                </div>
                <div className="mb-4">
                  <label className="text-[11px] font-semibold text-tv-text-primary mb-1.5 block">Description</label>
                  <textarea
                    value={data.description}
                    onChange={e => upd("description", e.target.value)}
                    placeholder="Add a description\u2026"
                    rows={3}
                    className="w-full border border-tv-border-light rounded-sm px-3 py-2 text-[12px] outline-none focus:border-tv-brand-bg focus:ring-2 focus:ring-tv-brand-bg/20 transition-colors resize-none placeholder:text-tv-text-decorative"
                  />
                </div>
                <div className="mb-4">
                  <label className="text-[11px] font-semibold text-tv-text-primary mb-1.5 flex items-center gap-1.5">
                    <User size={11} />Constituent Name
                  </label>
                  <input
                    value={data.recipientName}
                    onChange={e => upd("recipientName", e.target.value)}
                    placeholder="Who is this video for?"
                    className="w-full border border-tv-border-light rounded-sm px-3 py-2 text-[12px] outline-none focus:border-tv-brand-bg focus:ring-2 focus:ring-tv-brand-bg/20 transition-colors placeholder:text-tv-text-decorative"
                  />
                </div>
                <div className="mb-4">
                  <label className="text-[11px] font-semibold text-tv-text-primary mb-1.5 flex items-center gap-1.5">
                    <Tag size={11} />Tags
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addTag()}
                      placeholder="Add a tag"
                      className="flex-1 border border-tv-border-light rounded-sm px-3 py-2 text-[12px] outline-none focus:border-tv-brand-bg focus:ring-2 focus:ring-tv-brand-bg/20 transition-colors placeholder:text-tv-text-decorative"
                    />
                    <button onClick={addTag} className="w-8 h-8 rounded-sm border border-tv-border-light flex items-center justify-center text-tv-text-secondary hover:bg-tv-surface transition-colors shrink-0">
                      <Plus size={13} />
                    </button>
                  </div>
                  {data.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {data.tags.map((t, i) => (
                        <span key={i} className="inline-flex items-center gap-1 bg-tv-brand-tint text-tv-brand text-[10px] font-medium px-2 py-0.5 rounded-full">
                          {t}
                          <button onClick={() => removeTag(i)} className="hover:text-tv-danger" aria-label="Remove tag"><X size={9} /></button>
                        </span>
                      ))}
                    </div>
                  )}
                  {(() => {
                    const available = SUGGESTED_TAGS.filter(st => !data.tags.includes(st) && (!tagInput.trim() || st.includes(tagInput.toLowerCase())));
                    if (available.length === 0) return null;
                    return (
                      <div className="mt-2">
                        <p className="text-[9px] text-tv-text-decorative mb-1">Suggestions</p>
                        <div className="flex flex-wrap gap-1">
                          {available.slice(0, 6).map(st => (
                            <button key={st} onClick={() => { upd("tags", [...data.tags, st]); setTagInput(""); }}
                              className="inline-flex items-center gap-0.5 bg-tv-surface text-tv-text-secondary text-[9px] px-1.5 py-0.5 rounded-full hover:bg-tv-brand-tint hover:text-tv-brand transition-colors border border-tv-border-light">
                              <Plus size={7} />{st}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div className="relative">
                  <label className="text-[11px] font-semibold text-tv-text-primary mb-1.5 flex items-center gap-1.5">
                    <FolderOpen size={11} />Folder
                  </label>
                  <button
                    onClick={() => setFolderOpen(!folderOpen)}
                    className="w-full border border-tv-border-light rounded-sm px-3 py-2 text-[12px] text-left flex items-center justify-between hover:bg-tv-surface transition-colors"
                  >
                    <span>{data.folder}</span>
                    <ChevronDown size={12} className={`text-tv-text-secondary transition-transform ${folderOpen ? "rotate-180" : ""}`} />
                  </button>
                  {folderOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-tv-border-light rounded-sm shadow-lg z-10 overflow-hidden">
                      {FOLDERS.map(f => (
                        <button
                          key={f}
                          onClick={() => { upd("folder", f); setFolderOpen(false); }}
                          className={`w-full text-left px-3 py-2 text-[11px] hover:bg-tv-surface transition-colors ${
                            data.folder === f ? "bg-tv-brand-tint text-tv-brand font-medium" : "text-tv-text-primary"
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ━━ TRIM TAB ━━ */}
            {tab === "trim" && (
              <div className="space-y-3">
                <p className="text-[11px] font-semibold text-tv-text-primary">Trim Settings</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[9px] text-tv-text-secondary mb-0.5 block">Start</label>
                    <input value={fmtSec(data.trimStart)} readOnly className="w-full border border-tv-border-light rounded-sm px-2 py-1.5 text-[11px] font-mono text-center bg-tv-surface" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[9px] text-tv-text-secondary mb-0.5 block">End</label>
                    <input value={fmtSec(data.trimEnd)} readOnly className="w-full border border-tv-border-light rounded-sm px-2 py-1.5 text-[11px] font-mono text-center bg-tv-surface" />
                  </div>
                </div>
                <div className="bg-tv-surface rounded-sm p-3 text-center">
                  <p className="text-[10px] text-tv-text-secondary">Trimmed duration</p>
                  <p className="text-[18px] font-mono text-tv-text-primary mt-1">{fmtSec(trimmedDuration)}</p>
                  <p className="text-[9px] text-tv-text-decorative mt-0.5">Original: {data.duration}</p>
                </div>
              </div>
            )}

            {/* ━━ CROP & ROTATE TAB ━━ */}
            {tab === "crop" && (
              <div className="space-y-4">
                {/* Crop section */}
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-tv-text-primary flex items-center gap-1.5">
                    <Crop size={12} />Crop
                  </p>
                  <div className="bg-tv-surface rounded-sm p-3">
                    <p className="text-[10px] text-tv-text-secondary mb-1">Active preset</p>
                    <p className="text-[13px] font-medium text-tv-text-primary">
                      {CROP_PRESETS.find(p => p.ratio === cropPreset)?.label ?? "Custom"}
                    </p>
                  </div>
                  {data.cropArea && (
                    <div className="bg-tv-brand-tint rounded-sm p-3 text-[10px] text-tv-brand">
                      Crop applied: {data.cropArea.x},{data.cropArea.y} &mdash; {data.cropArea.w}&times;{data.cropArea.h}
                    </div>
                  )}
                </div>

                <div className="border-t border-tv-border-divider" />

                {/* Rotate section */}
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-tv-text-primary flex items-center gap-1.5">
                    <RotateCw size={12} />Rotate
                    {data.rotation !== 0 && (
                      <span className="text-[9px] text-tv-brand bg-tv-brand-tint px-1.5 py-0.5 rounded-full font-semibold">{data.rotation}&deg;</span>
                    )}
                  </p>
                  <div className="space-y-1.5">
                    {ROTATION_OPTIONS.map(opt => (
                      <button
                        key={opt.deg}
                        onClick={() => setRotationDeg(opt.deg)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm border transition-colors ${
                          data.rotation === opt.deg
                            ? "border-tv-brand-bg bg-tv-brand-tint text-tv-brand"
                            : "border-tv-border-light text-tv-text-primary hover:bg-tv-surface"
                        }`}
                      >
                        <RotateCw size={13} style={{ transform: `rotate(${opt.deg}deg)`, transition: "transform 0.3s" }} />
                        <span className="text-[11px]" style={{ fontWeight: data.rotation === opt.deg ? 600 : 400 }}>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                  <button onClick={rotate90}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[11px] text-tv-brand font-medium border border-tv-brand-bg/30 rounded-sm hover:bg-tv-brand-tint transition-colors">
                    <RotateCw size={12} />Rotate 90&deg; clockwise
                  </button>
                  {data.rotation !== 0 && (
                    <button onClick={() => setRotationDeg(0)} className="w-full text-center text-[10px] text-tv-danger font-medium hover:underline">
                      Reset rotation
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ━━ CAPTIONS TAB ━━ */}
            {tab === "captions" && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-[11px] font-semibold text-tv-text-primary flex items-center gap-1.5">
                    <Captions size={12} />Closed Captions
                  </label>
                  <button
                    onClick={() => { setCaptionsEnabled(!captionsEnabled); setHasChanges(true); }}
                    className={`rounded-full relative transition-colors ${captionsEnabled ? "bg-tv-brand-bg" : "bg-tv-border-light"}`}
                    style={{ width: 36, height: 20 }}
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm absolute transition-all" style={{ left: captionsEnabled ? 19 : 2, top: 3 }} />
                  </button>
                </div>

                {captionsEnabled && (
                  <>
                    {/* Show by default */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-tv-border-divider">
                      <div>
                        <label className="text-[10px] font-semibold text-tv-text-primary flex items-center gap-1.5">
                          {showCaptionsByDefault ? <Eye size={10} /> : <EyeOff size={10} />}
                          Show by default
                        </label>
                        <p className="text-[8px] text-tv-text-secondary mt-0.5">Viewers can still toggle off</p>
                      </div>
                      <button
                        onClick={() => { setShowCaptionsByDefault(!showCaptionsByDefault); setHasChanges(true); }}
                        className={`rounded-full relative transition-colors ${showCaptionsByDefault ? "bg-tv-brand-bg" : "bg-tv-border-light"}`}
                        style={{ width: 36, height: 20 }}
                      >
                        <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm absolute transition-all" style={{ left: showCaptionsByDefault ? 19 : 2, top: 3 }} />
                      </button>
                    </div>

                    {/* Sources */}
                    <div className="mb-3 pb-3 border-b border-tv-border-divider">
                      <label className="text-[9px] text-tv-text-secondary mb-1.5 block">Add Captions</label>
                      {captionProcessing !== "idle" && (
                        <div className="mb-2 p-2 bg-tv-info-bg border border-tv-info-border rounded-sm">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Loader2 size={10} className="text-tv-info animate-spin" />
                            <span className="text-[10px] font-semibold text-tv-text-primary">
                              {captionProcessing === "ai" ? "AI generating\u2026" : "REV processing\u2026"}
                            </span>
                          </div>
                          <p className="text-[8px] text-tv-text-secondary mb-1.5">
                            {captionProcessing === "ai" ? "Usually a few seconds" : "May take up to 24 hours"}
                          </p>
                          <button onClick={handleCancelProcessing} className="inline-flex items-center gap-0.5 text-[9px] text-tv-danger font-medium hover:underline">
                            <Ban size={8} />Cancel
                          </button>
                        </div>
                      )}
                      <div className="space-y-1">
                        <button onClick={handleCaptionFileUpload} disabled={captionProcessing !== "idle"}
                          className="w-full flex items-center gap-2 p-2 bg-tv-surface border border-tv-border-light rounded-sm text-left hover:bg-tv-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          <div className="w-6 h-6 rounded-[5px] bg-white border border-tv-border-light flex items-center justify-center shrink-0"><FileUp size={11} className="text-tv-text-secondary" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-tv-text-primary">Upload VTT / SRT</p>
                            <p className="text-[8px] text-tv-text-secondary">Import caption file</p>
                          </div>
                          {captionSource === "upload" && <span className="text-[7px] font-semibold text-tv-success bg-tv-success-bg px-1 py-0.5 rounded-full shrink-0">Active</span>}
                        </button>
                        <button onClick={handleAICaptions} disabled={captionProcessing !== "idle"}
                          className="w-full flex items-center gap-2 p-2 bg-tv-surface border border-tv-border-light rounded-sm text-left hover:bg-tv-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          <div className="w-6 h-6 rounded-[5px] bg-white border border-tv-border-light flex items-center justify-center shrink-0"><Sparkles size={11} className="text-tv-brand" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-tv-text-primary">Auto-generate (AI)</p>
                            <p className="text-[8px] text-tv-text-secondary">Transcribe automatically</p>
                          </div>
                          {captionSource === "ai" && <span className="text-[7px] font-semibold text-tv-success bg-tv-success-bg px-1 py-0.5 rounded-full shrink-0">Active</span>}
                        </button>
                        <button onClick={handleREVCaptions} disabled={captionProcessing !== "idle"}
                          className="w-full flex items-center gap-2 p-2 bg-tv-surface border border-tv-border-light rounded-sm text-left hover:bg-tv-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          <div className="w-6 h-6 rounded-[5px] bg-white border border-tv-border-light flex items-center justify-center shrink-0"><Wand2 size={11} className="text-tv-text-secondary" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-tv-text-primary">Human captions (REV)</p>
                            <p className="text-[8px] text-tv-text-secondary">Professional &middot; 1 credit</p>
                          </div>
                          {captionSource === "rev" && <span className="text-[7px] font-semibold text-tv-success bg-tv-success-bg px-1 py-0.5 rounded-full shrink-0">Active</span>}
                        </button>
                      </div>
                    </div>

                    {/* Language */}
                    <div className="mb-3">
                      <label className="text-[9px] text-tv-text-secondary mb-1 block">Language</label>
                      <select value={captionLang} onChange={e => { setCaptionLang(e.target.value); setHasChanges(true); }}
                        className="w-full border border-tv-border-light rounded-[8px] px-3 py-1.5 text-[11px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand bg-white appearance-none pr-7 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_8px_center] bg-no-repeat cursor-pointer">
                        {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="text-[9px] text-tv-text-secondary mb-1 block">Font Size</label>
                      <div className="flex gap-1">
                        {(["S", "M", "L"] as const).map(s => (
                          <button key={s} onClick={() => { setCaptionSize(s); setHasChanges(true); }}
                            className={`px-3 py-1 text-[10px] font-medium rounded-sm border transition-colors ${captionSize === s ? "bg-tv-brand-bg text-white border-tv-brand-bg" : "border-tv-border-light text-tv-text-primary hover:bg-tv-surface"}`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="text-[9px] text-tv-text-secondary mb-1 block">Position</label>
                      <div className="flex gap-1">
                        {(["Top", "Bottom"] as const).map(p => (
                          <button key={p} onClick={() => { setCaptionPos(p); setHasChanges(true); }}
                            className={`px-3 py-1 text-[10px] font-medium rounded-sm border transition-colors ${captionPos === p ? "bg-tv-brand-bg text-white border-tv-brand-bg" : "border-tv-border-light text-tv-text-primary hover:bg-tv-surface"}`}>
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="text-[9px] text-tv-text-secondary mb-1 block">Font Color</label>
                      <div className="flex items-center gap-1.5">
                        {TEXT_COLORS.map(c => (
                          <button key={c} onClick={() => { setTextColor(c); setHasChanges(true); }}
                            className={`w-5 h-5 rounded-full border-2 transition-all ${textColor === c ? "border-tv-brand-bg scale-110" : "border-tv-border-light"}`}
                            style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="text-[9px] text-tv-text-secondary mb-1 block">Background Color</label>
                      <div className="flex items-center gap-1.5 mb-2">
                        {BG_COLORS.map(c => (
                          <button key={c} onClick={() => { setBgColor(c); setHasChanges(true); }}
                            className={`w-5 h-5 rounded-full border-2 transition-all ${bgColor === c ? "border-tv-brand-bg scale-110" : "border-tv-border-light"} ${c === "transparent" ? "bg-[repeating-conic-gradient(#ddd_0%_25%,transparent_0%_50%)] bg-[length:8px_8px]" : ""}`}
                            style={c !== "transparent" ? { backgroundColor: c } : {}} />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-tv-text-secondary">Opacity</span>
                        <input type="range" min={0} max={100} value={bgOpacity} onChange={e => { setBgOpacity(Number(e.target.value)); setHasChanges(true); }} className="flex-1 h-1 accent-tv-brand-bg" />
                        <span className="text-[10px] text-tv-text-secondary w-7 text-right">{bgOpacity}%</span>
                      </div>
                    </div>

                    {/* Caption lines */}
                    <div className="border-t border-tv-border-divider pt-3 mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] font-semibold text-tv-text-primary">Lines ({data.captions.length})</p>
                        <div className="flex items-center gap-2">
                          <button onClick={generateSampleCaptions} className="text-[10px] text-tv-brand font-medium hover:underline">Generate Sample</button>
                          <button onClick={addCaption} className="text-[10px] bg-tv-brand-bg text-white px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5 hover:bg-tv-brand-hover transition-colors">
                            <Plus size={9} />Add Line
                          </button>
                        </div>
                      </div>
                      {data.captions.length === 0 ? (
                        <div className="text-center py-5">
                          <Captions size={22} className="text-tv-text-secondary/30 mx-auto mb-1" />
                          <p className="text-[10px] text-tv-text-secondary">No captions yet. Use a source above or add manually.</p>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2 max-h-[200px] overflow-y-auto">
                            {data.captions.map((line, idx) => (
                              <div key={line.id} className="bg-tv-surface border border-tv-border-light rounded-sm p-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[9px] font-mono text-tv-text-secondary">{line.start} &ndash; {line.end}</span>
                                  <button onClick={() => removeCaption(idx)} className="text-tv-text-secondary hover:text-tv-danger"><X size={10} /></button>
                                </div>
                                <input value={line.text} onChange={e => updateCaption(idx, { text: e.target.value })}
                                  className="w-full bg-white border border-tv-border-light rounded-sm px-2 py-1 text-[11px] outline-none focus:border-tv-brand-bg" placeholder="Caption text&hellip;" />
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-tv-border-divider">
                            <button onClick={handleDownloadCaptions} className="inline-flex items-center gap-0.5 text-[10px] text-tv-brand font-medium hover:underline"><Download size={9} />Download VTT</button>
                            <button onClick={handleDeleteAllCaptions} className="inline-flex items-center gap-0.5 text-[10px] text-tv-danger font-medium hover:underline"><Trash2 size={9} />Delete all</button>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {/* ━━ THUMBNAIL TAB ━━ */}
            {tab === "thumbnail" && (
              <div className="space-y-4">
                <p className="text-[11px] font-semibold text-tv-text-primary">Video Thumbnail</p>

                {/* Current thumbnail preview */}
                {data.thumbnailUrl ? (
                  <div className="relative rounded-sm overflow-hidden border border-tv-border-light">
                    <img src={data.thumbnailUrl} alt="Current thumbnail" className="w-full h-[130px] object-cover" />
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/60 text-white text-[8px] font-semibold rounded backdrop-blur-sm">
                      {thumbnailSource === "frame" ? "From video" : thumbnailSource === "upload" ? "Uploaded" : "Custom"}
                    </div>
                    <button
                      onClick={() => { upd("thumbnailUrl", null); setThumbnailSource("none"); setSelectedFrameIdx(null); }}
                      className="absolute top-1.5 right-1.5 flex items-center gap-1 px-2 py-1 bg-black/60 text-white text-[10px] font-medium rounded-sm hover:bg-black/80 transition-colors backdrop-blur-sm"
                    >
                      <X size={10} />Remove
                    </button>
                  </div>
                ) : (
                  <div className="bg-tv-surface rounded-sm p-4 text-center">
                    <Image size={20} className="text-tv-text-secondary/40 mx-auto mb-1" />
                    <p className="text-[10px] text-tv-text-secondary">No thumbnail set</p>
                    <p className="text-[8px] text-tv-text-decorative mt-0.5">Choose from a frame or upload an image</p>
                  </div>
                )}

                {/* Pick from video frame */}
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-tv-text-primary flex items-center gap-1.5">
                    <Play size={10} />Choose from video frame
                  </p>
                  <p className="text-[8px] text-tv-text-secondary">Select a frame from the video timeline</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {frameTimes.map((sec, idx) => {
                      const hue = (idx / FRAME_COUNT) * 360;
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedFrameIdx(idx);
                            setThumbnailSource("frame");
                            upd("thumbnailUrl", generateFrameThumbnail(sec, hue));
                          }}
                          className={`relative aspect-video rounded-sm overflow-hidden border-2 transition-all ${
                            selectedFrameIdx === idx && thumbnailSource === "frame"
                              ? "border-tv-brand-bg ring-2 ring-tv-brand-bg/30 scale-[1.02]"
                              : "border-tv-border-light hover:border-tv-border-strong"
                          }`}
                        >
                          <div className="absolute inset-0 flex items-center justify-center"
                            style={{ background: `linear-gradient(135deg, hsl(${hue}, 40%, 25%), hsl(${(hue + 60) % 360}, 50%, 35%))` }}>
                            <span className="text-white/80 text-[9px] font-mono font-semibold">{fmtSec(sec)}</span>
                          </div>
                          {selectedFrameIdx === idx && thumbnailSource === "frame" && (
                            <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-tv-brand-bg flex items-center justify-center">
                              <svg width="7" height="7" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => {
                      const currentSec = Math.round((scrubber / 100) * data.originalDuration);
                      const hue = (scrubber / 100) * 360;
                      setSelectedFrameIdx(null);
                      setThumbnailSource("frame");
                      upd("thumbnailUrl", generateFrameThumbnail(currentSec, hue));
                      show(`Thumbnail set from ${fmtSec(currentSec)}`, "success");
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[11px] text-tv-brand font-medium border border-tv-brand-bg/30 rounded-sm hover:bg-tv-brand-tint transition-colors"
                  >
                    <Play size={11} />Use current position ({fmtSec(Math.round((scrubber / 100) * data.originalDuration))})
                  </button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-tv-border-divider" />
                  <span className="text-[9px] text-tv-text-decorative">or</span>
                  <div className="flex-1 border-t border-tv-border-divider" />
                </div>

                {/* Upload */}
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-tv-text-primary flex items-center gap-1.5">
                    <Upload size={10} />Upload custom image
                  </p>
                  <input ref={thumbnailInputRef} type="file" accept="image/jpeg,image/png,image/gif" className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        upd("thumbnailUrl", reader.result as string);
                        setThumbnailSource("upload");
                        setSelectedFrameIdx(null);
                        show("Thumbnail uploaded", "success");
                      };
                      reader.readAsDataURL(file);
                      e.target.value = "";
                    }}
                  />
                  <button onClick={() => thumbnailInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-tv-border-light rounded-sm p-4 flex flex-col items-center justify-center cursor-pointer hover:border-tv-border-strong hover:bg-tv-surface/50 transition-colors">
                    <Upload size={18} className="text-tv-text-secondary mb-1.5" />
                    <p className="text-[11px] text-tv-text-primary font-medium">Click to upload</p>
                    <p className="text-[9px] text-tv-text-secondary mt-0.5">JPG, PNG, or GIF &middot; Max 5 MB</p>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Video preview + tab-specific controls ── */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-tv-surface-muted overflow-y-auto">
            <div className="flex-1 flex items-center justify-center p-4 min-h-0">
              <div
                className="relative rounded-lg overflow-hidden bg-[#1a1a2e] flex items-center justify-center w-full max-w-[500px] max-h-full cursor-pointer aspect-[4/3]"
                onClick={() => setPlaying(!playing)}
                style={{ transform: `rotate(${data.rotation}deg)`, transition: "transform 0.3s ease" }}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center hover:bg-white/20 transition-colors">
                    {playing ? <Pause size={22} className="text-white" /> : <Play size={22} className="text-white ml-0.5" fill="white" />}
                  </div>
                  <p className="text-white/40 text-[12px]">Video Preview</p>
                </div>

                {/* Thumbnail overlay */}
                {data.thumbnailUrl && tab === "thumbnail" && (
                  <img src={data.thumbnailUrl} alt="Video thumbnail" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                )}

                {/* Crop overlay */}
                {tab === "crop" && data.cropArea && (
                  <div className="absolute border-2 border-dashed border-white/60 rounded"
                    style={{ left: `${data.cropArea.x}%`, top: `${data.cropArea.y}%`, width: `${data.cropArea.w}%`, height: `${data.cropArea.h}%` }} />
                )}

                {/* Captions preview */}
                {tab === "captions" && captionsEnabled && data.captions.length > 0 && (
                  <div className={`absolute left-4 right-4 ${captionPos === "Top" ? "top-4" : "bottom-4"}`}>
                    <div className="mx-auto max-w-[80%] px-3 py-1.5 rounded text-center"
                      style={{
                        color: textColor,
                        backgroundColor: bgColor === "transparent" ? "transparent" : `${bgColor}${Math.round(bgOpacity * 2.55).toString(16).padStart(2, "0")}`,
                        fontSize: captionSize === "S" ? 11 : captionSize === "M" ? 14 : 17,
                      }}>
                      {data.captions[0]?.text || "Caption preview"}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Scrubber */}
            <div className="px-5 pb-3 shrink-0 flex items-center gap-3">
              <button onClick={() => setPlaying(!playing)} className="text-tv-text-secondary hover:text-tv-text-primary transition-colors">
                {playing ? <Pause size={15} /> : <Play size={15} />}
              </button>
              <input type="range" min={0} max={100} value={scrubber} onChange={e => setScrubber(Number(e.target.value))} className="flex-1 h-1.5 accent-tv-brand-bg" />
              <span className="text-[10px] font-mono text-tv-text-secondary whitespace-nowrap">
                {fmtSec(Math.round((scrubber / 100) * data.originalDuration))} / {data.duration}
              </span>
            </div>

            {/* Trim controls */}
            {tab === "trim" && (
              <div className="mx-5 mb-4 p-4 bg-white border border-tv-border-light rounded-lg shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[12px] font-semibold text-tv-text-primary">Trim Video</p>
                  <div className="flex items-center gap-2">
                    {data.isTrimmed && <span className="px-2 py-0.5 bg-tv-brand-tint text-tv-brand text-[10px] font-semibold rounded-full">Trimmed</span>}
                    {data.isTrimmed && <button onClick={resetTrim} className="text-[10px] text-tv-danger font-medium hover:underline">Reset Trim</button>}
                  </div>
                </div>
                <div className="relative h-10 bg-tv-surface rounded-sm overflow-hidden mb-3 border border-tv-border-light">
                  <div className="absolute inset-0 flex items-center px-1">
                    {Array.from({ length: 50 }).map((_, i) => (
                      <div key={i} className="flex-1 mx-px rounded-full"
                        style={{
                          height: `${20 + Math.sin(i * 0.5) * 30 + ((i * 7 + 3) % 20)}%`,
                          backgroundColor: (i / 50) * 100 >= trimStartPct && (i / 50) * 100 <= trimEndPct ? "var(--color-tv-brand-bg)" : "var(--color-tv-border-light)",
                        }} />
                    ))}
                  </div>
                  <div className="absolute top-0 bottom-0 bg-tv-brand-bg/10" style={{ left: `${trimStartPct}%`, width: `${trimEndPct - trimStartPct}%` }} />
                  <input type="range" min={0} max={100} value={trimStartPct} onChange={e => handleTrimStartPct(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize" style={{ zIndex: 2 }} />
                  <input type="range" min={0} max={100} value={trimEndPct} onChange={e => handleTrimEndPct(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize" style={{ zIndex: 3 }} />
                  <div className="absolute top-0 bottom-0 w-1.5 bg-tv-brand-bg rounded-l cursor-ew-resize pointer-events-none" style={{ left: `${trimStartPct}%` }} />
                  <div className="absolute top-0 bottom-0 w-1.5 bg-tv-brand-bg rounded-r cursor-ew-resize pointer-events-none" style={{ left: `calc(${trimEndPct}% - 6px)` }} />
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-tv-text-secondary mb-2">
                  <span>{fmtSec(data.trimStart)}</span>
                  <span>Duration: {fmtSec(trimmedDuration)}</span>
                  <span>{fmtSec(data.trimEnd)}</span>
                </div>
              </div>
            )}

            {/* Crop & Rotate controls */}
            {tab === "crop" && (
              <div className="mx-5 mb-4 p-4 bg-white border border-tv-border-light rounded-lg shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[12px] font-semibold text-tv-text-primary">Crop & Rotate</p>
                  <button onClick={rotate90}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] text-tv-brand font-medium border border-tv-brand-bg/30 rounded-sm hover:bg-tv-brand-tint transition-colors">
                    <RotateCw size={11} />Rotate 90&deg;
                    {data.rotation !== 0 && <span className="text-[9px] opacity-70">({data.rotation}&deg;)</span>}
                  </button>
                </div>
                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                  {CROP_PRESETS.map(p => (
                    <button key={p.ratio} onClick={() => { setCropPreset(p.ratio); setHasChanges(true); }}
                      className={`px-2.5 py-1 text-[10px] font-medium rounded-sm border transition-colors ${cropPreset === p.ratio ? "bg-tv-brand-bg text-white border-tv-brand-bg" : "border-tv-border-light text-tv-text-primary hover:bg-tv-surface"}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {([["X", cropX, setCropX] as const, ["Y", cropY, setCropY] as const, ["W", cropW, setCropW] as const, ["H", cropH, setCropH] as const]).map(([label, val, setter]) => (
                    <div key={label}>
                      <label className="text-[9px] text-tv-text-secondary mb-0.5 block">{label}</label>
                      <input type="number" min={0} max={100} value={val} onChange={e => { setter(Number(e.target.value)); setHasChanges(true); }}
                        className="w-full border border-tv-border-light rounded-sm px-2 py-1 text-[11px] font-mono text-center outline-none focus:border-tv-brand-bg" />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={applyCrop} className="flex items-center gap-1 px-3 py-1.5 bg-tv-brand-bg text-white text-[11px] font-semibold rounded-full hover:bg-tv-brand-hover transition-colors">
                    <Crop size={11} />Apply Crop
                  </button>
                  {data.cropArea && <button onClick={resetCrop} className="text-[10px] text-tv-danger font-medium hover:underline">Reset Crop</button>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ══ Footer ══ */}
        <div className="px-6 py-3 border-t border-tv-border-divider shrink-0 flex items-center justify-between gap-3">
          <div>
            {canDelete && (
              <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-tv-danger hover:bg-tv-danger/5 rounded-full transition-colors">
                <Trash2 size={11} />Delete Video
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <button onClick={handleUndo} className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium text-tv-text-secondary border border-tv-border-light rounded-full hover:border-tv-border-strong transition-colors">
                <Undo2 size={11} />Undo Changes
              </button>
            )}
            <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-white bg-tv-brand-bg rounded-full hover:bg-tv-brand-hover transition-colors">
              <Save size={12} />Save & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

