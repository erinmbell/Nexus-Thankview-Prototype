import React, { useState } from "react";
import {
  X, Play, Save, Pause,
  Scissors, Crop, Captions, RotateCw,
  FolderOpen, Image, Plus, Tag, User, Upload,
  FileText, ChevronDown,
  Wand2, Trash2, Download, Loader2, Eye, EyeOff, Ban, FileUp, Sparkles,
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { ConstituentTooltip } from "../../components/ConstituentTooltip";
import type { PickerVideo } from "./types";

// ═══════════════════════════════════════════════════════════════════════════════
//  VideoEditorView — full-screen inline "Edit Video" view with tabbed editor
//  Tabs: Details, Trim, Crop & Rotate, Captions, Thumbnail
// ═══════════════════════════════════════════════════════════════════════════════

type EditorTab = "details" | "trim" | "crop" | "captions" | "thumbnail";

const EDITOR_TABS: { key: EditorTab; icon: typeof FileText; label: string }[] = [
  { key: "details",   icon: FileText, label: "Details" },
  { key: "trim",      icon: Scissors, label: "Trim" },
  { key: "crop",      icon: Crop,     label: "Crop & Rotate" },
  { key: "captions",  icon: Captions, label: "Captions" },
  { key: "thumbnail", icon: Image,    label: "Thumbnail" },
];

const TEXT_COLORS  = ["#ffffff", "#1a1a1a", "#6b7280", "#22c55e", "#f97316", "#60a5fa"];
const BG_COLORS    = ["#1a1a1a", "#ffffff", "#374151", "#1e3a5f", "#6c3fc5", "#d1d5db"];
const CROP_PRESETS = ["4:3", "16:9", "1:1", "9:16"];
const TRIM_QUICK   = ["First 5s", "First 10s", "Last 10s", "Middle half"];
const ROTATION_OPTIONS = [
  { deg: 0,   label: "0\u00b0 \u2014 Original" },
  { deg: 90,  label: "90\u00b0 \u2014 Right" },
  { deg: 180, label: "180\u00b0 \u2014 Upside Down" },
  { deg: 270, label: "270\u00b0 \u2014 Left" },
];

const FOLDERS = ["Uncategorized", "Campaign Videos", "Personalized", "Intros", "Outros", "Drafts", "Archive"];
const SUGGESTED_TAGS = ["thank-you", "spring", "scholarship", "impact", "personalized", "intro", "outro", "branded", "campus", "appeal", "year-end", "cta", "tour"];

function fmtSec(s: number): string {
  return `${Math.floor(s / 60)}:${String(Math.round(s) % 60).padStart(2, "0")}`;
}

function parseDuration(d: string): number {
  const parts = d.split(":").map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

export function VideoEditorView({
  video,
  onCancel,
  onSave,
}: {
  video: PickerVideo;
  onCancel: () => void;
  onSave: (v: PickerVideo) => void;
}) {
  const { show } = useToast();
  const [tab, setTab]               = useState<EditorTab>("details");
  const [videoName, setVideoName]   = useState(video.title);
  const [description, setDescription] = useState("");
  const [recipient, setRecipient]   = useState("");
  const [tags, setTags]             = useState<string[]>([]);
  const [tagInput, setTagInput]     = useState("");
  const [tagInputFocused, setTagInputFocused] = useState(false);
  const [folder, setFolder]         = useState("Uncategorized");
  const [folderOpen, setFolderOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [playing, setPlaying]       = useState(false);
  const [scrubber, setScrubber]     = useState(0);
  const [rotation, setRotation]    = useState(0);

  // Trim
  const [trimStart, setTrimStart]   = useState("0:00");
  const [trimEnd, setTrimEnd]       = useState(video.duration);
  const [isTrimmed, setIsTrimmed]   = useState(false);

  // Crop
  const [cropPreset, setCropPreset] = useState("4:3");
  const [cropW, setCropW]           = useState(100);
  const [cropH, setCropH]           = useState(100);

  // Captions
  const [captionsOn, setCaptionsOn]     = useState(false);
  const [captionLang, setCaptionLang]   = useState("English");
  const [captionSize, setCaptionSize]   = useState<"Small" | "Medium" | "Large">("Medium");
  const [captionPos, setCaptionPos]     = useState<"Top" | "Bottom">("Bottom");
  const [textColor, setTextColor]       = useState("#ffffff");
  const [bgColor, setBgColor]           = useState("#1a1a1a");
  const [bgOpacity, setBgOpacity]       = useState(75);
  const [captionLines, setCaptionLines] = useState<{ id: number; text: string; start: string; end: string }[]>([]);
  const [captionSource, setCaptionSource] = useState<"none" | "upload" | "ai" | "rev">("none");
  const [captionProcessing, setCaptionProcessing] = useState<"idle" | "ai" | "rev">("idle");
  const [showCaptionsByDefault, setShowCaptionsByDefault] = useState(true);
  const [captionAppearanceOpen, setCaptionAppearanceOpen] = useState(false);

  // Thumbnail
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailSource, setThumbnailSource] = useState<"none" | "frame" | "upload">("none");
  const [selectedFrameIdx, setSelectedFrameIdx] = useState<number | null>(null);
  const thumbnailInputRef = React.useRef<HTMLInputElement>(null);
  const originalDuration = parseDuration(video.duration);
  const FRAME_COUNT = 8;
  const frameTimes = Array.from({ length: FRAME_COUNT }, (_, i) =>
    Math.round((i / (FRAME_COUNT - 1)) * originalDuration)
  );

  const markChanged = () => { if (!hasChanges) setHasChanges(true); };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    setTags(prev => [...prev, tagInput.trim()]);
    setTagInput("");
    markChanged();
  };

  const handleSave = () => {
    const name = videoName.trim() || video.title;
    onSave({ ...video, title: name });
  };

  const generateSampleCaptions = () => {
    setCaptionLines([
      { id: 1, text: "Hi there! Thank you for your generous contribution.", start: "0:00", end: "0:05" },
      { id: 2, text: "Your support means the world to our students.", start: "0:05", end: "0:10" },
      { id: 3, text: "Together, we can build a brighter future.", start: "0:10", end: "0:15" },
    ]);
    markChanged();
    show("Sample captions generated", "success");
  };

  const handleCaptionFileUpload = () => {
    setCaptionLines([
      { id: 101, text: "Welcome to our campus. We're so glad you're here.", start: "0:00", end: "0:04" },
      { id: 102, text: "Your generosity has made a real difference.", start: "0:04", end: "0:08" },
      { id: 103, text: "Let me show you the impact of your gift.", start: "0:08", end: "0:12" },
      { id: 104, text: "Thank you from the bottom of our hearts.", start: "0:12", end: "0:16" },
    ]);
    setCaptionSource("upload");
    setCaptionsOn(true);
    markChanged();
    show("Caption file imported successfully", "success");
  };

  const handleAICaptions = () => {
    setCaptionProcessing("ai");
    markChanged();
    show("Generating captions with AI\u2026", "info");
    setTimeout(() => {
      setCaptionLines([
        { id: 201, text: "Hi there! Thank you for your generous contribution.", start: "0:00", end: "0:05" },
        { id: 202, text: "Your support means the world to our students.", start: "0:05", end: "0:10" },
        { id: 203, text: "Together, we can build a brighter future.", start: "0:10", end: "0:15" },
        { id: 204, text: "We couldn't do this without you.", start: "0:15", end: "0:19" },
      ]);
      setCaptionSource("ai");
      setCaptionProcessing("idle");
      setCaptionsOn(true);
      show("AI captions generated successfully", "success");
    }, 3000);
  };

  const handleREVCaptions = () => {
    setCaptionProcessing("rev");
    markChanged();
    show("Ordering human captions from REV\u2026 (1 credit)", "info");
    setTimeout(() => {
      setCaptionLines([
        { id: 301, text: "Hello, and thank you for your generous support.", start: "0:00", end: "0:04" },
        { id: 302, text: "Your gift truly makes a difference in the lives of our students.", start: "0:04", end: "0:09" },
        { id: 303, text: "We are so grateful for partners like you.", start: "0:09", end: "0:14" },
        { id: 304, text: "Thank you again. We couldn't do this without you.", start: "0:14", end: "0:19" },
      ]);
      setCaptionSource("rev");
      setCaptionProcessing("idle");
      setCaptionsOn(true);
      show("REV captions delivered", "success");
    }, 5000);
  };

  const handleCancelProcessing = () => {
    setCaptionProcessing("idle");
    show("Caption processing cancelled", "info");
  };

  const handleDownloadCaptions = () => {
    const vtt = "WEBVTT\n\n" + captionLines.map((l, i) =>
      `${i + 1}\n${l.start}.000 --> ${l.end}.000\n${l.text}\n`
    ).join("\n");
    const blob = new Blob([vtt], { type: "text/vtt" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${videoName || "video"}-captions.vtt`;
    a.click();
    URL.revokeObjectURL(url);
    show("Captions downloaded as VTT", "success");
  };

  const handleDeleteAllCaptions = () => {
    setCaptionLines([]);
    setCaptionSource("none");
    markChanged();
    show("All captions deleted", "info");
  };

  const generateFrameThumbnail = (sec: number, hue: number) => {
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
  };

  /* ── Reusable sidebar section header ── */
  const SidebarSection = ({ icon: Icon, title, children }: { icon: typeof Scissors; title: string; children: React.ReactNode }) => (
    <>
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-tv-border-divider">
        <div className="w-6 h-6 rounded-[6px] bg-tv-brand-tint flex items-center justify-center shrink-0">
          <Icon size={12} className="text-tv-brand" />
        </div>
        <span className="text-[13px] font-semibold text-tv-text-primary">{title}</span>
      </div>
      {children}
    </>
  );

  /* ── Compact video info card ── */
  const VideoInfoCard = () => (
    <div className="mb-4 p-3 bg-tv-surface rounded-[8px] border border-tv-border-light">
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-[8px] bg-[#1a1a2e] flex items-center justify-center shrink-0">
          <Play size={10} className="text-white ml-0.5" fill="white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-tv-text-primary truncate">{videoName || video.title}</p>
          <p className="text-[10px] text-tv-text-secondary">{video.duration} &middot; {folder}</p>
        </div>
      </div>
    </div>
  );

  /* ── Details panel ── */
  const renderDetailsPanel = () => (
    <SidebarSection icon={FileText} title="Video Details">
      <VideoInfoCard />
      <div className="mb-4">
        <label className="text-[12px] font-semibold text-tv-text-primary mb-1.5 block">Video Name</label>
        <input value={videoName} onChange={e => { setVideoName(e.target.value); markChanged(); }}
          className="w-full border border-tv-border-light rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-tv-brand-bg focus:ring-2 focus:ring-tv-brand-bg/20 transition-colors" />
      </div>
      <div className="mb-4">
        <label className="text-[12px] font-semibold text-tv-text-primary mb-1.5 block">Description</label>
        <textarea value={description} onChange={e => { setDescription(e.target.value); markChanged(); }}
          placeholder="Add a description for this video" rows={3}
          className="w-full border border-tv-border-light rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-tv-brand-bg focus:ring-2 focus:ring-tv-brand-bg/20 transition-colors resize-none placeholder:text-tv-text-secondary" />
      </div>
      <div className="mb-4">
        <label className="text-[12px] font-semibold text-tv-text-primary mb-1.5 flex items-center gap-1.5"><User size={12} />Constituent <ConstituentTooltip size={11} /></label>
        <input value={recipient} onChange={e => { setRecipient(e.target.value); markChanged(); }}
          placeholder="Who is this video for?"
          className="w-full border border-tv-border-light rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-tv-brand-bg focus:ring-2 focus:ring-tv-brand-bg/20 transition-colors placeholder:text-tv-text-secondary" />
      </div>
      <div className="mb-4">
        <label className="text-[12px] font-semibold text-tv-text-primary mb-1.5 flex items-center gap-1.5"><Tag size={12} />Tags</label>
        <div className="flex items-center gap-2">
          <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddTag()}
            placeholder="Add a tag"
            className="flex-1 border border-tv-border-light rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-tv-brand-bg focus:ring-2 focus:ring-tv-brand-bg/20 transition-colors placeholder:text-tv-text-secondary"
            onFocus={() => setTagInputFocused(true)} onBlur={() => setTagInputFocused(false)} />
          <button onClick={handleAddTag} className="w-8 h-8 rounded-[8px] border border-tv-border-light flex items-center justify-center text-tv-text-secondary hover:bg-tv-surface transition-colors shrink-0">
            <Plus size={14} />
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map((t, i) => (
              <span key={i} className="inline-flex items-center gap-1 bg-tv-brand-tint text-tv-brand text-[11px] font-medium px-2 py-0.5 rounded-full">
                {t}
                <button onClick={() => { setTags(prev => prev.filter((_, idx) => idx !== i)); markChanged(); }} className="hover:text-tv-danger" aria-label="Remove tag"><X size={10} /></button>
              </span>
            ))}
          </div>
        )}
        {(() => {
          if (!tagInputFocused && !tagInput.trim()) return null;
          const available = SUGGESTED_TAGS.filter(st => !tags.includes(st) && (!tagInput.trim() || st.includes(tagInput.toLowerCase())));
          if (available.length === 0) return null;
          return (
            <div className="mt-2">
              <p className="text-[10px] text-tv-text-decorative mb-1">Suggestions</p>
              <div className="flex flex-wrap gap-1">
                {available.slice(0, 6).map(st => (
                  <button key={st} onClick={() => { setTags(prev => [...prev, st]); setTagInput(""); markChanged(); }}
                    className="inline-flex items-center gap-0.5 bg-tv-surface text-tv-text-secondary text-[10px] px-2 py-0.5 rounded-full hover:bg-tv-brand-tint hover:text-tv-brand transition-colors border border-tv-border-light">
                    <Plus size={8} />{st}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
      <div className="relative">
        <label className="text-[12px] font-semibold text-tv-text-primary mb-1.5 flex items-center gap-1.5"><FolderOpen size={12} />Folder</label>
        <button className="w-full border border-tv-border-light rounded-[8px] px-3 py-2 text-[13px] text-left flex items-center justify-between hover:bg-tv-surface transition-colors"
          onClick={() => setFolderOpen(!folderOpen)}>
          <span>{folder}</span>
          <ChevronDown size={14} className={`text-tv-text-secondary transition-transform ${folderOpen ? "rotate-180" : ""}`} />
        </button>
        {folderOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-tv-border-light rounded-[8px] shadow-lg z-10 overflow-hidden">
            {FOLDERS.map(f => (
              <button key={f} onClick={() => { setFolder(f); setFolderOpen(false); markChanged(); }}
                className={`block w-full text-left px-3 py-2 text-[12px] transition-colors ${
                  folder === f ? "bg-tv-brand-tint text-tv-brand font-semibold" : "text-tv-text-primary hover:bg-tv-surface"
                }`}>
                {f}
              </button>
            ))}
          </div>
        )}
      </div>
    </SidebarSection>
  );

  /* ── Trim panel ── */
  const renderTrimPanel = () => (
    <SidebarSection icon={Scissors} title="Trim Video">
      <VideoInfoCard />
      {isTrimmed && (
        <div className="flex items-center justify-between mb-3">
          <span className="px-2 py-0.5 bg-tv-brand-tint text-tv-brand text-[10px] font-semibold rounded-full">Trimmed</span>
          <button onClick={() => { setTrimStart("0:00"); setTrimEnd(video.duration); setIsTrimmed(false); markChanged(); show("Trim reverted to original", "info"); }}
            className="text-[10px] text-tv-danger font-medium hover:underline">Revert to Original</button>
        </div>
      )}
      <div className="mb-3">
        <label className="text-[11px] text-tv-text-secondary mb-1.5 block">Timeline</label>
        <div className="relative h-12 bg-tv-brand-tint rounded-[8px] overflow-hidden border-2 border-tv-brand-bg">
          <div className="absolute inset-0 flex items-center px-1">
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} className="flex-1 mx-px bg-tv-brand-bg rounded-full"
                style={{ height: `${20 + Math.sin(i * 0.5) * 30 + ((i * 7 + 3) % 20)}%` }} />
            ))}
          </div>
          <div className="absolute top-0 bottom-0 left-0 w-2 bg-tv-brand-bg rounded-l-[6px] cursor-ew-resize flex items-center justify-center"><div className="w-0.5 h-3 bg-white rounded-full" /></div>
          <div className="absolute top-0 bottom-0 right-0 w-2 bg-tv-brand-bg rounded-r-[6px] cursor-ew-resize flex items-center justify-center"><div className="w-0.5 h-3 bg-white rounded-full" /></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="text-[10px] text-tv-text-secondary mb-1 block">Start</label>
          <input value={trimStart} onChange={e => { setTrimStart(e.target.value); setIsTrimmed(true); markChanged(); }}
            className="w-full border border-tv-border-light rounded-[8px] px-2.5 py-1.5 text-[12px] font-mono text-center outline-none focus:border-tv-brand-bg" />
        </div>
        <div>
          <label className="text-[10px] text-tv-text-secondary mb-1 block">End</label>
          <input value={trimEnd} onChange={e => { setTrimEnd(e.target.value); setIsTrimmed(true); markChanged(); }}
            className="w-full border border-tv-border-light rounded-[8px] px-2.5 py-1.5 text-[12px] font-mono text-center outline-none focus:border-tv-brand-bg" />
        </div>
      </div>
      <p className="text-[10px] text-tv-text-secondary mb-3">Original duration: {video.duration}</p>
      <div className="border-t border-tv-border-divider pt-3">
        <label className="text-[11px] text-tv-text-secondary mb-2 block">Quick Trim</label>
        <div className="grid grid-cols-2 gap-1.5">
          {TRIM_QUICK.map(q => (
            <button key={q} onClick={() => { setIsTrimmed(true); markChanged(); show(`Applied "${q}"`, "info"); }}
              className="text-[11px] text-tv-brand font-medium hover:bg-tv-brand-tint px-2.5 py-1.5 rounded-[8px] transition-colors border border-tv-border-light text-center">
              {q}
            </button>
          ))}
        </div>
      </div>
    </SidebarSection>
  );

  /* ── Crop & Rotate panel ── */
  const renderCropPanel = () => (
    <SidebarSection icon={Crop} title="Crop & Rotate">
      <VideoInfoCard />

      {/* Crop section */}
      <div className="mb-4">
        <label className="text-[11px] font-semibold text-tv-text-primary mb-2 flex items-center gap-1.5">
          <Crop size={12} />Aspect Ratio
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {CROP_PRESETS.map(p => (
            <button key={p} onClick={() => { setCropPreset(p); markChanged(); }}
              className={`text-[12px] font-medium px-3 py-2 rounded-[8px] border transition-colors ${
                cropPreset === p
                  ? "bg-tv-brand-bg text-white border-tv-brand-bg"
                  : "border-tv-border-light text-tv-text-primary hover:bg-tv-surface"
              }`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => { markChanged(); show("Cropping mode activated", "info"); }}
        className="w-full flex items-center justify-center gap-1.5 bg-tv-brand-bg text-white text-[12px] font-semibold px-3.5 py-2.5 rounded-[8px] hover:bg-tv-brand-hover transition-colors mb-4">
        <Crop size={13} />Start Cropping
      </button>

      {/* Divider */}
      <div className="border-t border-tv-border-divider pt-4 mt-2">
        <label className="text-[11px] font-semibold text-tv-text-primary mb-3 flex items-center gap-1.5">
          <RotateCw size={12} />Rotation
          {rotation !== 0 && (
            <span className="text-[9px] text-tv-brand bg-tv-brand-tint px-1.5 py-0.5 rounded-full font-semibold">{rotation}&deg;</span>
          )}
        </label>

        <div className="space-y-1.5 mb-3">
          {ROTATION_OPTIONS.map(opt => (
            <button
              key={opt.deg}
              onClick={() => { setRotation(opt.deg); markChanged(); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-[8px] border transition-colors ${
                rotation === opt.deg
                  ? "border-tv-brand-bg bg-tv-brand-tint text-tv-brand"
                  : "border-tv-border-light text-tv-text-primary hover:bg-tv-surface"
              }`}
            >
              <RotateCw size={13} style={{ transform: `rotate(${opt.deg}deg)`, transition: "transform 0.3s" }} />
              <span className="text-[11px]" style={{ fontWeight: rotation === opt.deg ? 600 : 400 }}>{opt.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <button onClick={() => { setRotation(r => (r + 90) % 360); markChanged(); }}
            className="w-full flex items-center justify-center gap-1.5 bg-tv-brand-bg text-white text-[12px] font-semibold px-3.5 py-2.5 rounded-[8px] hover:bg-tv-brand-hover transition-colors">
            <RotateCw size={13} />Rotate 90&deg; Clockwise
          </button>
          {rotation !== 0 && (
            <button onClick={() => { setRotation(0); markChanged(); }}
              className="w-full flex items-center justify-center gap-1.5 border border-tv-border-light text-tv-text-label text-[12px] font-semibold px-3.5 py-2.5 rounded-[8px] hover:bg-tv-surface transition-colors">
              Reset to 0&deg;
            </button>
          )}
        </div>
      </div>
    </SidebarSection>
  );

  /* ── Captions panel ── */
  const renderCaptionsPanel = () => (
    <SidebarSection icon={Captions} title="Captions">
      <div className="flex items-center justify-between mb-4">
        <label className="text-[12px] font-semibold text-tv-text-primary flex items-center gap-1.5"><Captions size={12} />Closed Captions</label>
        <button onClick={() => { setCaptionsOn(!captionsOn); markChanged(); }}
          className={`rounded-full relative transition-colors ${captionsOn ? "bg-tv-brand-bg" : "bg-tv-border-light"}`}
          style={{ width: 36, height: 20 }}>
          <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm absolute transition-all" style={{ left: captionsOn ? 19 : 2, top: 3 }} />
        </button>
      </div>

      {captionsOn && (
        <>
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-tv-border-divider">
            <div>
              <label className="text-[11px] font-semibold text-tv-text-primary flex items-center gap-1.5">
                {showCaptionsByDefault ? <Eye size={11} /> : <EyeOff size={11} />}
                Show by default
              </label>
              <p className="text-[9px] text-tv-text-secondary mt-0.5">Viewers can still toggle off</p>
            </div>
            <button onClick={() => { setShowCaptionsByDefault(!showCaptionsByDefault); markChanged(); }}
              className={`rounded-full relative transition-colors ${showCaptionsByDefault ? "bg-tv-brand-bg" : "bg-tv-border-light"}`}
              style={{ width: 36, height: 20 }}>
              <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm absolute transition-all" style={{ left: showCaptionsByDefault ? 19 : 2, top: 3 }} />
            </button>
          </div>

          <div className="mb-4 pb-4 border-b border-tv-border-divider">
            <label className="text-[11px] text-tv-text-secondary mb-2 block">Add Captions</label>
            {captionProcessing !== "idle" && (
              <div className="mb-3 p-2.5 bg-tv-info-bg border border-tv-info-border rounded-[8px]">
                <div className="flex items-center gap-2 mb-1.5">
                  <Loader2 size={12} className="text-tv-info animate-spin" />
                  <span className="text-[11px] font-semibold text-tv-text-primary">
                    {captionProcessing === "ai" ? "AI is generating captions\u2026" : "REV is processing captions\u2026"}
                  </span>
                </div>
                <p className="text-[9px] text-tv-text-secondary mb-2">
                  {captionProcessing === "ai" ? "Usually takes a few seconds" : "Human transcription \u2014 may take up to 24 hours"}
                </p>
                <button onClick={handleCancelProcessing} className="inline-flex items-center gap-1 text-[10px] text-tv-danger font-medium hover:underline"><Ban size={9} />Cancel processing</button>
              </div>
            )}
            <div className="space-y-1.5">
              <button onClick={handleCaptionFileUpload} disabled={captionProcessing !== "idle"}
                className="w-full flex items-center gap-2.5 p-2.5 bg-tv-surface border border-tv-border-light rounded-[8px] text-left hover:bg-tv-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <div className="w-7 h-7 rounded-[6px] bg-white border border-tv-border-light flex items-center justify-center shrink-0"><FileUp size={13} className="text-tv-text-secondary" /></div>
                <div><p className="text-[11px] font-semibold text-tv-text-primary">Upload VTT / SRT file</p><p className="text-[9px] text-tv-text-secondary">Import existing caption file</p></div>
                {captionSource === "upload" && <span className="ml-auto text-[8px] font-semibold text-tv-success bg-tv-success-bg px-1.5 py-0.5 rounded-full">Active</span>}
              </button>
              <button onClick={handleAICaptions} disabled={captionProcessing !== "idle"}
                className="w-full flex items-center gap-2.5 p-2.5 bg-tv-surface border border-tv-border-light rounded-[8px] text-left hover:bg-tv-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <div className="w-7 h-7 rounded-[6px] bg-white border border-tv-border-light flex items-center justify-center shrink-0"><Sparkles size={13} className="text-tv-brand" /></div>
                <div><p className="text-[11px] font-semibold text-tv-text-primary">Auto-generate (AI)</p><p className="text-[9px] text-tv-text-secondary">Transcribe audio automatically</p></div>
                {captionSource === "ai" && <span className="ml-auto text-[8px] font-semibold text-tv-success bg-tv-success-bg px-1.5 py-0.5 rounded-full">Active</span>}
              </button>
              <button onClick={handleREVCaptions} disabled={captionProcessing !== "idle"}
                className="w-full flex items-center gap-2.5 p-2.5 bg-tv-surface border border-tv-border-light rounded-[8px] text-left hover:bg-tv-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <div className="w-7 h-7 rounded-[6px] bg-white border border-tv-border-light flex items-center justify-center shrink-0"><Wand2 size={13} className="text-tv-text-secondary" /></div>
                <div><p className="text-[11px] font-semibold text-tv-text-primary">Human captions (REV)</p><p className="text-[9px] text-tv-text-secondary">Professional transcription &middot; 1 credit</p></div>
                {captionSource === "rev" && <span className="ml-auto text-[8px] font-semibold text-tv-success bg-tv-success-bg px-1.5 py-0.5 rounded-full">Active</span>}
              </button>
            </div>
          </div>

          {/* Appearance */}
          <div className="border-b border-tv-border-divider pb-4 mb-4">
            <button onClick={() => setCaptionAppearanceOpen(!captionAppearanceOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] border transition-colors ${captionAppearanceOpen ? "bg-tv-surface border-tv-border-light" : "bg-transparent border-tv-border-light hover:bg-tv-surface-muted"}`}>
              <span className="text-[12px] font-semibold text-tv-text-primary">Customize Appearance</span>
              <ChevronDown size={14} className={`text-tv-text-secondary transition-transform ${captionAppearanceOpen ? "rotate-180" : ""}`} />
            </button>
            {!captionAppearanceOpen && (
              <p className="text-[10px] text-tv-text-decorative mt-2 px-1">{captionLang} &middot; {captionSize} &middot; {captionPos} position</p>
            )}
            {captionAppearanceOpen && (
              <div className="mt-3 space-y-4">
                <div>
                  <label className="text-[11px] text-tv-text-secondary mb-1 block">Language</label>
                  <select value={captionLang} onChange={e => { setCaptionLang(e.target.value); markChanged(); }}
                    className="w-full border border-tv-border-light rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-tv-brand-bg bg-white">
                    <option>English</option><option>Spanish</option><option>French</option><option>German</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-tv-text-secondary mb-1 block">Size</label>
                  <div className="flex gap-1">
                    {(["Small", "Medium", "Large"] as const).map(s => (
                      <button key={s} onClick={() => { setCaptionSize(s); markChanged(); }}
                        className={`px-3 py-1.5 text-[11px] font-medium rounded-[8px] border transition-colors ${captionSize === s ? "bg-tv-brand-bg text-white border-tv-brand-bg" : "border-tv-border-light text-tv-text-primary hover:bg-tv-surface"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-tv-text-secondary mb-1 block">Position</label>
                  <div className="flex gap-1">
                    {(["Top", "Bottom"] as const).map(p => (
                      <button key={p} onClick={() => { setCaptionPos(p); markChanged(); }}
                        className={`px-3 py-1.5 text-[11px] font-medium rounded-[8px] border transition-colors ${captionPos === p ? "bg-tv-brand-bg text-white border-tv-brand-bg" : "border-tv-border-light text-tv-text-primary hover:bg-tv-surface"}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-tv-text-secondary mb-1 block">Text</label>
                  <div className="flex items-center gap-1.5">
                    {TEXT_COLORS.map(c => (
                      <button key={c} onClick={() => { setTextColor(c); markChanged(); }}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${textColor === c ? "border-tv-brand-bg scale-110" : "border-tv-border-light"}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-tv-text-secondary mb-1 block">BG</label>
                  <div className="flex items-center gap-1.5">
                    {BG_COLORS.map(c => (
                      <button key={c} onClick={() => { setBgColor(c); markChanged(); }}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${bgColor === c ? "border-tv-brand-bg scale-110" : "border-tv-border-light"}`}
                        style={{ backgroundColor: c }} />
                    ))}
                    <div className="flex-1 ml-2 flex items-center gap-2">
                      <input type="range" min={0} max={100} value={bgOpacity} onChange={e => { setBgOpacity(Number(e.target.value)); markChanged(); }}
                        className="flex-1 h-1.5 accent-tv-brand-bg" />
                      <span className="text-[11px] text-tv-text-secondary w-8 text-right">{bgOpacity}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Caption lines */}
          <div className="border-t border-tv-border-divider pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[12px] font-semibold text-tv-text-primary">Caption Lines ({captionLines.length})</p>
              <div className="flex items-center gap-2">
                <button onClick={generateSampleCaptions} className="text-[11px] text-tv-brand font-medium hover:underline">Generate Sample</button>
                <button onClick={() => { setCaptionLines(prev => [...prev, { id: Date.now(), text: "", start: "0:00", end: "0:05" }]); markChanged(); }}
                  className="text-[11px] bg-tv-brand-bg text-white px-2.5 py-1 rounded-full font-medium flex items-center gap-1 hover:bg-tv-brand-hover transition-colors">
                  <Plus size={10} />Add
                </button>
              </div>
            </div>
            {captionLines.length === 0 ? (
              <div className="text-center py-8">
                <Captions size={28} className="text-tv-text-secondary/30 mx-auto mb-2" />
                <p className="text-[12px] text-tv-text-secondary">No captions yet. Click &ldquo;Add&rdquo; to create a caption line,<br />or use one of the sources above.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {captionLines.map((line, idx) => (
                    <div key={line.id} className="bg-tv-surface border border-tv-border-light rounded-[8px] p-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono text-tv-text-secondary">{line.start} &ndash; {line.end}</span>
                        <button onClick={() => { setCaptionLines(prev => prev.filter((_, i) => i !== idx)); markChanged(); }}
                          aria-label="Remove caption line" className="text-tv-text-secondary hover:text-tv-danger"><X size={11} /></button>
                      </div>
                      <input value={line.text} onChange={e => { setCaptionLines(prev => prev.map((l, i) => i === idx ? { ...l, text: e.target.value } : l)); markChanged(); }}
                        className="w-full bg-white border border-tv-border-light rounded-[6px] px-2.5 py-1.5 text-[12px] outline-none focus:border-tv-brand-bg" placeholder="Caption text..." />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-tv-border-divider">
                  <button onClick={handleDownloadCaptions} className="inline-flex items-center gap-1 text-[11px] text-tv-brand font-medium hover:underline"><Download size={10} />Download VTT</button>
                  <button onClick={handleDeleteAllCaptions} className="inline-flex items-center gap-1 text-[11px] text-tv-danger font-medium hover:underline"><Trash2 size={10} />Delete all</button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </SidebarSection>
  );

  /* ── Thumbnail panel ── */
  const renderThumbnailPanel = () => (
    <SidebarSection icon={Image} title="Thumbnail">
      <VideoInfoCard />

      {/* Current thumbnail preview */}
      {thumbnailUrl ? (
        <div className="relative rounded-[8px] overflow-hidden border border-tv-border-light mb-4">
          <img src={thumbnailUrl} alt="Current thumbnail" className="w-full h-[130px] object-cover" />
          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/60 text-white text-[8px] font-semibold rounded backdrop-blur-sm">
            {thumbnailSource === "frame" ? "From video" : thumbnailSource === "upload" ? "Uploaded" : "Custom"}
          </div>
          <button onClick={() => { setThumbnailUrl(null); setThumbnailSource("none"); setSelectedFrameIdx(null); markChanged(); }}
            className="absolute top-1.5 right-1.5 flex items-center gap-1 px-2 py-1 bg-black/60 text-white text-[10px] font-medium rounded-[6px] hover:bg-black/80 transition-colors backdrop-blur-sm">
            <X size={10} />Remove
          </button>
        </div>
      ) : (
        <div className="bg-tv-surface rounded-[8px] p-4 text-center mb-4">
          <Image size={20} className="text-tv-text-secondary/40 mx-auto mb-1" />
          <p className="text-[10px] text-tv-text-secondary">No thumbnail set</p>
          <p className="text-[8px] text-tv-text-decorative mt-0.5">Choose from a frame or upload an image</p>
        </div>
      )}

      {/* Pick from video frame */}
      <div className="mb-4">
        <p className="text-[11px] font-semibold text-tv-text-primary mb-2 flex items-center gap-1.5">
          <Play size={11} />Choose from video frame
        </p>
        <p className="text-[9px] text-tv-text-secondary mb-2">Select a frame from the video timeline</p>
        <div className="grid grid-cols-4 gap-1.5 mb-2">
          {frameTimes.map((sec, idx) => {
            const hue = (idx / FRAME_COUNT) * 360;
            return (
              <button key={idx}
                onClick={() => {
                  setSelectedFrameIdx(idx);
                  setThumbnailSource("frame");
                  setThumbnailUrl(generateFrameThumbnail(sec, hue));
                  markChanged();
                }}
                className={`relative aspect-video rounded-[6px] overflow-hidden border-2 transition-all ${
                  selectedFrameIdx === idx && thumbnailSource === "frame"
                    ? "border-tv-brand-bg ring-2 ring-tv-brand-bg/30 scale-[1.02]"
                    : "border-tv-border-light hover:border-tv-border-strong"
                }`}>
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
        <button onClick={() => {
          const currentSec = Math.round((scrubber / 100) * originalDuration);
          const hue = (scrubber / 100) * 360;
          setSelectedFrameIdx(null);
          setThumbnailSource("frame");
          setThumbnailUrl(generateFrameThumbnail(currentSec, hue));
          markChanged();
          show(`Thumbnail set from ${fmtSec(currentSec)}`, "success");
        }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[11px] text-tv-brand font-medium border border-tv-brand-bg/30 rounded-[8px] hover:bg-tv-brand-tint transition-colors">
          <Play size={11} />Use current position ({fmtSec(Math.round((scrubber / 100) * originalDuration))})
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 border-t border-tv-border-divider" />
        <span className="text-[9px] text-tv-text-decorative">or</span>
        <div className="flex-1 border-t border-tv-border-divider" />
      </div>

      {/* Upload */}
      <div>
        <p className="text-[11px] font-semibold text-tv-text-primary mb-2 flex items-center gap-1.5">
          <Upload size={11} />Upload custom image
        </p>
        <input ref={thumbnailInputRef} type="file" accept="image/jpeg,image/png,image/gif" className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              setThumbnailUrl(reader.result as string);
              setThumbnailSource("upload");
              setSelectedFrameIdx(null);
              markChanged();
              show("Thumbnail uploaded", "success");
            };
            reader.readAsDataURL(file);
            e.target.value = "";
          }}
        />
        <button onClick={() => thumbnailInputRef.current?.click()}
          className="w-full border-2 border-dashed border-tv-border-light rounded-[8px] p-5 flex flex-col items-center justify-center cursor-pointer hover:border-tv-border-strong hover:bg-tv-surface/50 transition-colors">
          <Upload size={20} className="text-tv-text-secondary mb-2" />
          <p className="text-[12px] text-tv-text-primary font-medium">Click to upload</p>
          <p className="text-[10px] text-tv-text-secondary mt-0.5">JPG, PNG, or GIF &middot; Max 5 MB</p>
        </button>
      </div>
    </SidebarSection>
  );

  /* ── Sidebar content router ── */
  const renderSidebarContent = () => {
    switch (tab) {
      case "details":   return renderDetailsPanel();
      case "trim":      return renderTrimPanel();
      case "crop":      return renderCropPanel();
      case "captions":  return renderCaptionsPanel();
      case "thumbnail": return renderThumbnailPanel();
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-tv-border-divider shrink-0">
        <div className="w-8 h-8 rounded-full bg-tv-brand-tint flex items-center justify-center shrink-0">
          <Scissors size={14} className="text-tv-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[14px] font-black text-tv-text-primary">Edit Video</h2>
          <p className="text-[11px] text-tv-text-secondary">Shared Video &middot; {video.duration}</p>
        </div>
        {hasChanges && (
          <span className="text-[11px] text-tv-warning font-medium">Unsaved changes</span>
        )}
        <button onClick={onCancel}
          className="w-7 h-7 rounded-full border border-tv-border-light flex items-center justify-center text-tv-text-secondary hover:bg-tv-surface transition-colors shrink-0"
          aria-label="Close editor">
          <X size={12} />
        </button>
      </div>

      {/* ── Tab bar ── */}
      <div className="px-5 shrink-0 border-b border-tv-border-divider">
        <div className="flex gap-1">
          {EDITOR_TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium border-b-2 -mb-px transition-colors ${
                tab === t.key
                  ? "border-tv-brand-bg text-tv-brand"
                  : "border-transparent text-tv-text-secondary hover:text-tv-text-primary"
              }`}>
              <t.icon size={13} />{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body: split layout ── */}
      <div className="flex-1 min-h-0 relative">
        {/* Left column — contextual settings panel */}
        <div className="absolute top-0 left-0 w-[300px] border-r border-tv-border-divider bg-white z-20 flex flex-col shadow-sm" style={{ bottom: '-120px' }}>
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            {renderSidebarContent()}
          </div>
        </div>

        {/* Right column — video preview + scrubber + actions */}
        <div className="h-full flex flex-col min-w-0 bg-white ml-[300px]">
          {/* Video preview */}
          <div className="flex-1 flex items-center justify-center px-6 py-3 bg-[#f8f8fa] min-h-0">
            <div
              className="relative rounded-[12px] overflow-hidden bg-[#1a1a2e] flex items-center justify-center w-full max-w-[580px] max-h-full cursor-pointer aspect-[16/9]"
              onClick={() => { setPlaying(!playing); if (!playing) show("Playing preview\u2026", "info"); }}
              style={{ transform: `rotate(${rotation}deg)`, transition: "transform 0.3s ease" }}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center hover:bg-white/20 transition-colors">
                  {playing ? <Pause size={22} className="text-white" /> : <Play size={22} className="text-white ml-0.5" fill="white" />}
                </div>
                <p className="text-white/40 text-[13px]">Video Preview</p>
              </div>

              {/* Thumbnail overlay */}
              {thumbnailUrl && tab === "thumbnail" && (
                <img src={thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
              )}
            </div>
          </div>

          {/* Playback scrubber */}
          <div className="px-5 py-2.5 shrink-0 flex items-center gap-3 bg-white border-t border-tv-border-divider">
            <button onClick={() => setPlaying(!playing)} className="text-tv-text-secondary hover:text-tv-text-primary transition-colors">
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <input type="range" min={0} max={100} value={scrubber}
              onChange={e => setScrubber(Number(e.target.value))}
              className="flex-1 h-1 accent-tv-brand-bg" />
            <span className="text-[11px] font-mono text-tv-text-secondary whitespace-nowrap">0:00 / {video.duration}</span>
          </div>

          {/* Save / Cancel actions */}
          <div className="flex items-center justify-between px-5 py-2 shrink-0 bg-white border-t border-tv-border-divider">
            <button onClick={onCancel}
              className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-tv-text-label border border-tv-border-light rounded-full hover:bg-tv-surface transition-colors">
              Cancel
            </button>
            {hasChanges && (
              <span className="text-[11px] text-tv-warning font-medium">Unsaved changes</span>
            )}
            <button onClick={handleSave}
              className={`flex items-center gap-1.5 px-5 py-2 text-[13px] font-semibold rounded-full transition-colors ${
                hasChanges
                  ? "bg-[#007c9e] text-white hover:bg-[#005d77]"
                  : "bg-[#007c9e]/50 text-white/70 cursor-not-allowed"
              }`}
              disabled={!hasChanges}>
              <Save size={13} />Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
