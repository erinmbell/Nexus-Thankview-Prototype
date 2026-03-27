import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Upload, Film, ChevronRight, Check, Mic, MicOff,
  Camera, CameraOff, Play, Square, Scissors, Image as ImageIcon,
  RefreshCw, Download, Send, Clock, Volume2, X, Monitor,
  LayoutGrid, Wifi, ChevronDown, Sparkles, Folder, Globe,
  Lock, Settings, Type, RotateCw, Crop,
  FileText, Trash2, User, UploadCloud, ImagePlus, Combine,
  CircleAlert, Save,
} from "lucide-react";
import { useToast } from "../contexts/ToastContext";
import { TV } from "../theme";
import { TagSelect } from "../components/TagSelect";
import { fmtSec } from "../utils";
import { VideoEditor, type VideoEditorData } from "../../imports/VideoEditor";

// ── Types ──────────────────────────────────────────────────────────────────────
export type Source      = "record" | "upload" | "library" | "combine";
export type Step        = 1 | 2 | 3 | 4 | 5;
type RecordPhase = "setup" | "countdown" | "recording" | "review";

// ── Constants ─────────────────────────────────────────────��────────��───────────
export const STEPS = [
  { n: 1, label: "Source"    },
  { n: 2, label: "Setup"     },
  { n: 3, label: "Edit"      },
  { n: 4, label: "Thumbnail" },
  { n: 5, label: "Details"   },
];

const CAMERA_DEVICES = [
  "Built-in FaceTime HD Camera",
  "iPhone Camera (Continuity)",
  "USB HD Webcam",
];

const MIC_DEVICES = [
  "Built-in Microphone",
  "AirPods Pro",
  "USB Audio Device",
];

const RECORDING_MODES = [
  { key: "cam",        icon: Camera,     label: "Webcam",       desc: "Webcam only" },
  { key: "screen-cam", icon: LayoutGrid, label: "Screen + Cam", desc: "Screen with cam overlay" },
  { key: "screen",     icon: Monitor,    label: "Screen only",  desc: "Screen share" },
] as const;

const BG_OPTS = [
  { key: "none",    label: "None",    preview: "bg-[#1a1a2e]",                   gradient: false },
  { key: "blur",    label: "Blur",    preview: "bg-[#374151]",                   gradient: false },
  { key: "campus",  label: "Campus",  preview: "bg-gradient-to-br from-[#2A5038] to-[#15803d]", gradient: true },
  { key: "office",  label: "Office",  preview: "bg-gradient-to-br from-[#4A6280] to-[#8ba5c0]", gradient: true },
  { key: "branded", label: "Branded", preview: "bg-gradient-to-br from-[#7c45b0] to-[#7c45b0]", gradient: true },
];

const COUNTDOWN_OPTS = ["None", "3s", "5s", "10s"];

const LIBRARY_VIDEOS = [
  { id: 1, title: "Welcome Message – Class of 2026",  duration: "0:42", date: "Feb 14", views: 127, color: "from-[#7c45b0] to-[#7c45b0]" },
  { id: 2, title: "Annual Fund Thank You",             duration: "1:08", date: "Feb 10", views: 89,  color: "from-[#007c9e] to-[#00C0F5]" },
  { id: 3, title: "Campaign Kick-off – Spring 2026",  duration: "0:55", date: "Feb 6",  views: 203, color: "from-[#166534] to-[#15803d]" },
  { id: 4, title: "Personal Outreach – Major Donors", duration: "1:22", date: "Jan 28", views: 56,  color: "from-[#b45309] to-[#b45309]" },
  { id: 5, title: "Board Member Spotlight",           duration: "2:01", date: "Jan 20", views: 311, color: "from-[#7c45b0] to-[#7c45b0]" },
  { id: 6, title: "Matching Gift Challenge",          duration: "0:38", date: "Jan 15", views: 74,  color: "from-[#007c9e] to-[#00C0F5]" },
];

const CAPTIONS_DATA = [
  { id: 1, start: "0:00", end: "0:04", text: "Hi there, I'm Kelley from the Annual Fund team." },
  { id: 2, start: "0:05", end: "0:10", text: "I wanted to personally thank you for your incredible support this year." },
  { id: 3, start: "0:11", end: "0:17", text: "Your gift of $500 helped us provide 10 scholarships to first-generation students." },
  { id: 4, start: "0:18", end: "0:24", text: "Because of donors like you, we're able to make a real difference on campus." },
  { id: 5, start: "0:25", end: "0:31", text: "I'd love to tell you more — click below to see how your gift is being used." },
  { id: 6, start: "0:32", end: "0:38", text: "Thank you again. We're so grateful to have you in our community." },
];

// Deterministic waveform — no Math.random to avoid re-render flicker
const WAVEFORM = Array.from({ length: 60 }, (_, i) =>
  Math.max(14, Math.min(90,
    42 + Math.sin(i * 0.9) * 20 + Math.sin(i * 1.8 + 1.1) * 13 + Math.sin(i * 3.3) * 7
  ))
);

const THUMB_FRAMES = [
  { id: 1, ts: "0:03", gradient: "from-[#7c45b0] to-[#7c45b0]" },
  { id: 2, ts: "0:11", gradient: "from-[#0e4f6e] to-[#00C0F5]" },
  { id: 3, ts: "0:22", gradient: "from-[#7c3a00] to-[#b45309]" },
  { id: 4, ts: "0:31", gradient: "from-[#0a4a26] to-[#15803d]" },
  { id: 5, ts: "0:38", gradient: "from-[#4A1942] to-[#6B1E33]" },
  { id: 6, ts: "0:45", gradient: "from-[#1B3461] to-[#4A6280]" },
];

// ── Helpers ─────────────────────────────────────────────────────────────���──────
const fmtPct = (pct: number, total = 68) => { const s = Math.round((pct / 100) * total); return fmtSec(s); };

// ── Step Indicator ─────────────────────────────────────────────────────────────
export function StepIndicator({ current, onStepClick }: { current: Step; onStepClick?: (step: Step) => void }) {
  return (
    <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-2">
      {STEPS.map((s, i) => {
        const completed = current > s.n;
        const active = current === s.n;
        const clickable = !!onStepClick && (completed || active);
        return (
          <div key={s.n} className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => clickable && onStepClick(s.n as Step)}
              className={`flex items-center gap-2 ${clickable ? "cursor-pointer group" : "cursor-default"}`}
              disabled={!clickable}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold border-2 transition-all ${
                completed ? "bg-tv-brand-bg border-tv-brand-bg text-white" :
                active    ? "bg-white border-tv-brand-bg text-tv-text-brand" :
                "bg-white border-[#d8d0e8] text-tv-text-decorative"
              } ${clickable ? "group-hover:scale-110 group-hover:shadow-md" : ""}`}>
                {completed ? <Check size={13} strokeWidth={3} /> : s.n}
              </div>
              <span className={`text-[12px] font-medium whitespace-nowrap transition-colors ${
                active    ? "text-tv-text-brand" :
                completed ? "text-tv-success" : "text-tv-text-decorative"
              } ${clickable ? "group-hover:text-tv-brand" : ""}`}>{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`w-12 h-[2px] mx-3 rounded ${completed ? "bg-tv-brand-bg" : "bg-[#ede9f5]"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Step 1: Source ─────────────────────────────────────────────────────────────
export function SourceStep({ onSelect }: { onSelect: (s: Source) => void }) {
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-[22px] font-black text-tv-text-primary mb-1">Add a video</h2>
      <p className="text-[14px] text-tv-text-secondary mb-8">Choose how you'd like to add your video.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {[
          { key: "record"  as Source, icon: Camera,  label: "Record Now",      desc: "Record directly in your browser using your webcam or phone camera.", color: "text-tv-record", bg: "bg-tv-record-tint", border: "border-tv-record-border" },
          { key: "upload"  as Source, icon: Upload,  label: "Upload File",     desc: "Upload an existing MP4, MOV, or WebM video from your device.",       color: "text-tv-brand", bg: "bg-tv-brand-tint", border: "border-tv-border" },
          { key: "library" as Source, icon: Film,    label: "From Library",    desc: "Select a previously recorded video from your ThankView library.",    color: "text-tv-brand", bg: "bg-tv-brand-tint", border: "border-tv-border" },
          { key: "combine" as Source, icon: Combine, label: "Combine Videos",  desc: "Splice multiple library videos together to create a new video.",     color: "text-tv-brand", bg: "bg-tv-brand-tint", border: "border-tv-border" },
        ].map(opt => (
          <button key={opt.key} onClick={() => onSelect(opt.key)}
            className="group flex flex-col items-center gap-4 p-8 bg-white rounded-xl border border-tv-border-light hover:border-tv-border-strong hover:shadow-lg transition-all text-center cursor-pointer">
            <div className={`w-16 h-16 rounded-[18px] ${opt.bg} border ${opt.border} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <opt.icon size={28} className={opt.color} />
            </div>
            <div>
              <p className="text-[15px] font-bold text-tv-text-primary mb-1">{opt.label}</p>
              <p className="text-[12px] text-tv-text-secondary leading-relaxed">{opt.desc}</p>
            </div>
            <div className="mt-auto flex items-center gap-1 text-[12px] font-semibold text-tv-text-brand opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
              Select <ChevronRight size={13} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Step 2: Setup (record mode) — Loom-inspired immersive layout ───────────────
export function RecordSetupStep({ onNext }: { onNext: () => void }) {
  const [phase, setPhase]         = useState<RecordPhase>("setup");
  const [camera,  setCamera]      = useState(CAMERA_DEVICES[0]);
  const [mic,     setMic]         = useState(MIC_DEVICES[0]);
  const [quality, setQuality]     = useState<"480p" | "720p" | "1080p">("1080p");
  const [mode,    setMode]        = useState<string>("cam");
  const [bg,      setBg]          = useState("none");
  const [countdown, setCountdown] = useState("3s");
  const [micOn,   setMicOn]       = useState(true);
  const [camOn,   setCamOn]       = useState(true);
  const [elapsed, setElapsed]     = useState(0);
  const [cdNum,   setCdNum]       = useState(3);
  const [audioLvl, setAudioLvl]  = useState(62);
  const [scriptText, setScriptText] = useState("");
  const [showScript, setShowScript] = useState(false);
  const [customBgUpl, setCustomBgUpl] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [micMenu, setMicMenu]     = useState(false);
  const [camMenu, setCamMenu]     = useState(false);

  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const cdRef      = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animate audio level in setup phase
  useEffect(() => {
    audioRef.current = setInterval(() => {
      setAudioLvl(Math.floor(45 + Math.random() * 40));
    }, 300);
    return () => { if (audioRef.current) clearInterval(audioRef.current); };
  }, []);

  const beginCountdown = () => {
    const cdSec = countdown === "None" ? 0 : parseInt(countdown);
    if (cdSec === 0) { startRecording(); return; }
    setCdNum(cdSec);
    setPhase("countdown");
    setDrawerOpen(false);
    let n = cdSec;
    cdRef.current = setInterval(() => {
      n--;
      if (n <= 0) {
        clearInterval(cdRef.current!);
        startRecording();
      } else {
        setCdNum(n);
      }
    }, 1000);
  };

  const startRecording = () => {
    setPhase("recording");
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("review");
  };

  const reRecord = () => {
    setElapsed(0);
    setPhase("setup");
  };

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (cdRef.current)    clearInterval(cdRef.current);
  }, []);

  const selectedBg = BG_OPTS.find(b => b.key === bg) ?? { key: "custom", label: "Custom", preview: "bg-gradient-to-br from-[#4A6280] to-[#8ba5c0]", gradient: true };
  const modeInfo = RECORDING_MODES.find(m => m.key === mode)!;

  /* Shared immersive camera preview */
  function CameraPreview({ className = "", children }: { className?: string; children?: React.ReactNode }) {
    return (
      <div className={`relative rounded-[24px] overflow-hidden flex items-center justify-center ${selectedBg.preview} ${className}`}>
        {bg === "blur" && <div className="absolute inset-0 backdrop-blur-md bg-black/20" />}
        {(mode === "screen-cam" || mode === "screen") && (
          <div className="absolute inset-0 flex items-center justify-center z-[1]">
            <div className="bg-black/50 rounded-xl px-6 py-4 text-center backdrop-blur-sm">
              <Monitor size={28} className="text-white/80 mx-auto mb-2" />
              <p className="text-white/80 text-[13px] font-medium">Your screen will appear here</p>
            </div>
          </div>
        )}
        {mode !== "screen" && (
          <div className={`relative z-[2] flex flex-col items-center gap-3 ${mode === "screen-cam" ? "absolute bottom-5 right-5" : ""}`}>
            {camOn ? (
              <>
                <div className={`${mode === "screen-cam" ? "w-20 h-20" : "w-32 h-32"} bg-tv-brand-bg/20 rounded-full flex items-center justify-center ring-4 ring-white/10`}>
                  <div className={`${mode === "screen-cam" ? "w-14 h-14 text-[18px]" : "w-24 h-24 text-[36px]"} bg-tv-brand-bg rounded-full flex items-center justify-center text-white font-black`}>KM</div>
                </div>
                {mode === "cam" && <p className="text-white/90 text-[13px] font-medium">Kelley Molt</p>}
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-white/30">
                <CameraOff size={mode === "screen-cam" ? 24 : 48} />
                {mode === "cam" && <span className="text-[13px]">Camera is off</span>}
              </div>
            )}
          </div>
        )}
        {showScript && scriptText && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent px-6 py-5 z-20">
            <div className="flex items-center gap-1.5 mb-2">
              <Type size={11} className="text-white/80" />
              <span className="text-white/80 text-[10px] font-semibold uppercase tracking-wider">Teleprompter</span>
            </div>
            <p className="text-white/90 text-[14px] leading-relaxed max-w-lg">{scriptText}</p>
          </div>
        )}
        {children}
      </div>
    );
  }

  // ── Setup phase ──────────────────────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <div className="max-w-5xl mx-auto relative" style={{ height: "calc(100vh - 190px)", minHeight: 360 }}>
        <CameraPreview className="w-full h-full shadow-xl bg-[#0e0e1a]">
          {/* Top-left: mode + quality pills */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
            <div className="bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1.5">
              <modeInfo.icon size={11} className="text-white" />
              <span className="text-white text-[10px] font-medium">{modeInfo.label}</span>
            </div>
            <div className="bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1">
              <span className="text-white text-[10px] font-medium">{quality}</span>
            </div>
          </div>
          {/* Top-right: connection */}
          <div className="absolute top-3 right-3 z-10">
            <div className="bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1.5">
              <Wifi size={10} className="text-[#4ade80]" />
              <span className="text-white/80 text-[10px] font-medium">Strong</span>
            </div>
          </div>
        </CameraPreview>

        {/* ── Floating bottom control bar (Loom-style) ───────────────────────── */}
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center z-20">
          <div className="bg-white/95 backdrop-blur-md rounded-xl border border-[#e8e4f0] shadow-lg px-3 py-2 flex items-center gap-1.5">
            {/* Mic toggle + inline audio level + device dropdown */}
            <div className="relative">
              <div className="flex items-center">
                <button onClick={() => setMicOn(!micOn)} aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${micOn ? "bg-tv-surface text-tv-text-primary hover:bg-tv-surface-hover" : "bg-tv-danger-bg text-tv-danger hover:bg-tv-danger-bg"}`}>
                  {micOn ? <Mic size={16} /> : <MicOff size={16} />}
                </button>
                {micOn && (
                  <div className="w-10 h-1.5 bg-black/5 rounded-full overflow-hidden mx-0.5">
                    <div className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${audioLvl}%`, background: audioLvl > 80 ? "#dc2626" : "linear-gradient(to right, #4ade80, #a78bfa)" }} />
                  </div>
                )}
                <button onClick={() => { setMicMenu(!micMenu); setCamMenu(false); }} aria-label="Choose microphone"
                  className="w-5 h-8 flex items-center justify-center text-tv-text-secondary hover:text-tv-text-primary">
                  <ChevronDown size={11} />
                </button>
              </div>
              {micMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMicMenu(false)} />
                  <div className="absolute bottom-full mb-2 left-0 w-[260px] bg-white rounded-lg border border-tv-border-light shadow-xl z-40 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-tv-border-divider">
                      <p className="text-[11px] font-semibold text-tv-text-label uppercase tracking-wider">Microphone</p>
                    </div>
                    {MIC_DEVICES.map(d => (
                      <button key={d} onClick={() => { setMic(d); setMicMenu(false); }}
                        className={`w-full text-left px-4 py-2.5 text-[12px] flex items-center gap-2 transition-colors ${mic === d ? "bg-tv-brand-tint text-tv-text-brand font-semibold" : "text-tv-text-primary hover:bg-tv-surface-muted"}`}>
                        {mic === d && <Check size={12} className="text-tv-text-brand shrink-0" />}
                        <span className={mic === d ? "" : "ml-5"}>{d}</span>
                      </button>
                    ))}
                    <div className="px-4 py-3 border-t border-tv-border-divider">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-tv-text-secondary">Level</span>
                        <div className="flex-1 h-1.5 bg-tv-border-divider rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-300"
                            style={{ width: micOn ? `${audioLvl}%` : "0%", background: audioLvl > 80 ? "#dc2626" : "linear-gradient(to right, #4ade80, #a78bfa)" }} />
                        </div>
                        <span className="text-[10px] font-mono text-tv-text-secondary w-7 text-right">{micOn ? audioLvl : 0}%</span>
                      </div>
                      {audioLvl > 80 && micOn && (
                        <p className="text-[9px] text-tv-danger mt-1 flex items-center gap-1">
                          <span className="inline-block w-1 h-1 bg-tv-danger rounded-full" />Input too high
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Camera toggle + device dropdown */}
            <div className="relative">
              <div className="flex items-center">
                <button onClick={() => setCamOn(!camOn)} aria-label={camOn ? "Turn camera off" : "Turn camera on"}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${camOn ? "bg-tv-surface text-tv-text-primary hover:bg-tv-surface-hover" : "bg-tv-danger-bg text-tv-danger hover:bg-tv-danger-bg"}`}>
                  {camOn ? <Camera size={16} /> : <CameraOff size={16} />}
                </button>
                <button onClick={() => { setCamMenu(!camMenu); setMicMenu(false); }} aria-label="Choose camera"
                  className="w-5 h-8 flex items-center justify-center text-tv-text-secondary hover:text-tv-text-primary">
                  <ChevronDown size={11} />
                </button>
              </div>
              {camMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setCamMenu(false)} />
                  <div className="absolute bottom-full mb-2 left-0 w-[260px] bg-white rounded-lg border border-tv-border-light shadow-xl z-40 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-tv-border-divider">
                      <p className="text-[11px] font-semibold text-tv-text-label uppercase tracking-wider">Camera</p>
                    </div>
                    {CAMERA_DEVICES.map(d => (
                      <button key={d} onClick={() => { setCamera(d); setCamMenu(false); }}
                        className={`w-full text-left px-4 py-2.5 text-[12px] flex items-center gap-2 transition-colors ${camera === d ? "bg-tv-brand-tint text-tv-text-brand font-semibold" : "text-tv-text-primary hover:bg-tv-surface-muted"}`}>
                        {camera === d && <Check size={12} className="text-tv-text-brand shrink-0" />}
                        <span className={camera === d ? "" : "ml-5"}>{d}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="h-7 w-px bg-[#e8e4f0] mx-1" />

            {/* Recording mode — pill toggle */}
            <div className="flex items-center bg-tv-surface rounded-full p-1 gap-0.5">
              {RECORDING_MODES.map(m => (
                <button key={m.key} onClick={() => setMode(m.key)} title={m.desc}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${mode === m.key ? "bg-white text-tv-text-primary shadow-sm" : "text-tv-text-secondary hover:text-tv-text-primary"}`}>
                  <m.icon size={13} />
                  <span className="hidden sm:inline">{m.label}</span>
                </button>
              ))}
            </div>

            <div className="h-7 w-px bg-[#e8e4f0] mx-1" />

            {/* Settings drawer toggle */}
            <button onClick={() => setDrawerOpen(!drawerOpen)} aria-label="Recording settings"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${drawerOpen ? "bg-tv-brand text-white" : "bg-tv-surface text-tv-text-label hover:bg-tv-surface-hover"}`}>
              <Settings size={15} />
            </button>

            <div className="h-7 w-px bg-[#e8e4f0] mx-1" />

            {/* Record button */}
            <button onClick={beginCountdown}
              className="flex items-center gap-2 bg-tv-record hover:bg-tv-record-hover text-white font-semibold pl-4 pr-5 py-2.5 rounded-full transition-colors shadow-md">
              <span className="w-3.5 h-3.5 bg-white rounded-full shrink-0" />
              <span className="text-[13px] whitespace-nowrap">{countdown === "None" ? "Record" : `Record (${countdown})`}</span>
            </button>
          </div>
        </div>

        {/* Settings drawer (overlays preview top-right) */}
        {drawerOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setDrawerOpen(false)} />
            <div className="absolute top-0 right-0 w-[340px] bg-white rounded-xl border border-tv-border-light shadow-2xl z-30 max-h-[calc(100%-80px)] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-tv-border-divider px-5 py-4 flex items-center justify-between rounded-t-[20px] z-10">
                <p className="text-[15px] font-bold text-tv-text-primary">Recording settings</p>
                <button onClick={() => setDrawerOpen(false)} aria-label="Close settings"
                  className="w-7 h-7 rounded-full bg-tv-surface flex items-center justify-center text-tv-text-secondary hover:bg-tv-surface-hover">
                  <X size={13} />
                </button>
              </div>
              <div className="p-5 space-y-6">
                {/* Quality */}
                <div>
                  <label className="text-[11px] font-semibold text-tv-text-label uppercase tracking-wider mb-2 block">Video quality</label>
                  <div className="flex gap-2">
                    {(["480p", "720p", "1080p"] as const).map(q => (
                      <button key={q} onClick={() => setQuality(q)}
                        className={`flex-1 py-2 rounded-md text-[12px] font-medium transition-all ${quality === q ? "bg-tv-brand text-white shadow-sm" : "bg-tv-surface text-tv-text-secondary hover:bg-tv-surface-hover"}`}>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Background */}
                <div>
                  <label className="text-[11px] font-semibold text-tv-text-label uppercase tracking-wider mb-2 block">Background</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-2">
                    {BG_OPTS.map(b => (
                      <button key={b.key} onClick={() => setBg(b.key)}
                        className={`flex flex-col items-center gap-1.5 p-1.5 rounded-md border-2 transition-all ${bg === b.key ? "border-tv-brand shadow-sm" : "border-transparent hover:border-tv-border-light"}`}>
                        <div className={`w-full aspect-video rounded-[5px] ${b.preview}`} />
                        <span className="text-[9px] text-tv-text-secondary font-medium leading-tight text-center">{b.label}</span>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => { setCustomBgUpl(!customBgUpl); if (!customBgUpl) setBg("custom"); }}
                    className={`w-full flex items-center gap-2 text-[11px] font-medium border-2 border-dashed rounded-md px-3 py-2 transition-colors ${customBgUpl ? "border-tv-brand bg-tv-brand-tint text-tv-brand" : "border-tv-border-light text-tv-text-secondary hover:border-tv-border-strong"}`}>
                    <ImagePlus size={13} />
                    {customBgUpl ? "Custom image set" : "Upload background"}
                    {customBgUpl && <Check size={11} className="ml-auto text-tv-brand" />}
                  </button>
                </div>
                {/* Countdown */}
                <div>
                  <label className="text-[11px] font-semibold text-tv-text-label uppercase tracking-wider mb-2 block">Countdown</label>
                  <div className="flex gap-1.5">
                    {COUNTDOWN_OPTS.map(c => (
                      <button key={c} onClick={() => setCountdown(c)}
                        className={`flex-1 py-2 rounded-md text-[12px] font-medium transition-all ${countdown === c ? "bg-tv-brand text-white shadow-sm" : "bg-tv-surface text-tv-text-secondary hover:bg-tv-surface-hover"}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Teleprompter */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-semibold text-tv-text-label uppercase tracking-wider">Teleprompter</label>
                    <button onClick={() => setShowScript(!showScript)} aria-label={showScript ? "Disable teleprompter" : "Enable teleprompter"}
                      className="relative w-9 h-5 rounded-full transition-colors shrink-0"
                      style={{ backgroundColor: showScript ? TV.brand : TV.borderStrong }}>
                      <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all" style={{ left: showScript ? 17 : 2 }} />
                    </button>
                  </div>
                  <textarea value={scriptText} onChange={e => setScriptText(e.target.value)}
                    placeholder="Paste or type your script here…" rows={5}
                    className="w-full bg-tv-surface border border-tv-border-light rounded-md px-3 py-2.5 text-[12px] text-tv-text-primary outline-none focus:ring-2 focus:ring-tv-brand/30 focus:border-tv-brand resize-none leading-relaxed placeholder:text-tv-text-decorative" />
                  <p className="text-[10px] text-tv-text-secondary mt-1">Your script will overlay the preview while recording.</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Countdown phase ──────────────────────────────────────────────────────────
  if (phase === "countdown") {
    return (
      <div className="max-w-5xl mx-auto relative" style={{ height: "calc(100vh - 190px)", minHeight: 360 }}>
        <CameraPreview className="w-full h-full shadow-xl bg-[#0e0e1a]">
          <div className="absolute inset-0 bg-black/40 z-10" />
          <div className="relative z-20 flex flex-col items-center gap-5">
            <div className="w-36 h-36 rounded-full bg-white/10 border-4 border-white/30 flex items-center justify-center backdrop-blur-sm animate-pulse motion-reduce:animate-none">
              <span className="text-white font-black" style={{ fontSize: 72 }}>{cdNum}</span>
            </div>
            <p className="text-white/90 text-[16px] font-semibold tracking-wide">Get ready…</p>
          </div>
        </CameraPreview>
      </div>
    );
  }

  // ── Recording phase ──────────────────────────────────────────────────────────
  if (phase === "recording") {
    return (
      <div className="max-w-5xl mx-auto relative" style={{ height: "calc(100vh - 190px)", minHeight: 360 }}>
        <CameraPreview className="w-full h-full shadow-xl bg-[#0e0e1a]">
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 z-10">
            <span className="w-2 h-2 bg-tv-danger-bg0 rounded-full animate-pulse motion-reduce:animate-none" />
            <span className="text-white text-[13px] font-mono font-semibold">{fmtSec(elapsed)}</span>
          </div>
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1 z-10">
            <span className="text-white text-[10px] font-medium">{quality} · REC</span>
          </div>
        </CameraPreview>

        {/* Floating recording controls */}
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center z-20">
          <div className="bg-white/95 backdrop-blur-md rounded-xl border border-[#e8e4f0] shadow-lg px-4 py-2 flex items-center gap-3">
            <button onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setElapsed(0); setPhase("setup"); }}
              className="flex items-center gap-1.5 text-tv-text-secondary hover:text-tv-danger px-3 py-2 rounded-full text-[12px] font-medium transition-colors hover:bg-tv-danger-bg">
              <Trash2 size={14} />
              <span className="hidden sm:inline">Discard</span>
            </button>
            <div className="h-7 w-px bg-[#e8e4f0]" />
            <button onClick={() => setMicOn(!micOn)} aria-label={micOn ? "Mute" : "Unmute"}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${micOn ? "bg-tv-surface text-tv-text-primary hover:bg-tv-surface-hover" : "bg-tv-danger-bg text-tv-danger"}`}>
              {micOn ? <Mic size={18} /> : <MicOff size={18} />}
            </button>
            <button onClick={() => setCamOn(!camOn)} aria-label={camOn ? "Turn camera off" : "Turn camera on"}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${camOn ? "bg-tv-surface text-tv-text-primary hover:bg-tv-surface-hover" : "bg-tv-danger-bg text-tv-danger"}`}>
              {camOn ? <Camera size={18} /> : <CameraOff size={18} />}
            </button>
            <div className="h-7 w-px bg-[#e8e4f0]" />
            <span className="text-[12px] text-tv-text-secondary">{mic.split(" ").slice(0, 2).join(" ")}</span>
            <div className="h-7 w-px bg-[#e8e4f0]" />
            <button onClick={stopRecording}
              className="flex items-center gap-2 bg-tv-text-primary text-white px-5 py-2.5 rounded-full text-[13px] font-semibold hover:bg-black transition-colors">
              <Square size={13} fill="white" />Stop
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Review phase ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto relative" style={{ height: "calc(100vh - 190px)", minHeight: 360 }}>
      <CameraPreview className="w-full h-full shadow-xl bg-[#0e0e1a]">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <div className="relative z-20 flex flex-col items-center gap-4">
          <button className="w-20 h-20 rounded-full bg-white/15 border-2 border-white/40 flex items-center justify-center hover:bg-white/25 transition-colors" aria-label="Play preview">
            <Play size={32} className="text-white ml-1" fill="white" />
          </button>
          <p className="text-white/90 text-[14px] font-medium">Click to preview your recording</p>
        </div>
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5 z-10">
          <Check size={11} className="text-[#4ade80]" />
          <span className="text-white text-[11px] font-medium">Recording complete</span>
        </div>
        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-[11px] px-2.5 py-1 rounded-full font-mono z-10">
          {fmtSec(elapsed)}
        </div>
      </CameraPreview>

      {/* Floating review controls */}
      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center z-20">
        <div className="bg-white/95 backdrop-blur-md rounded-xl border border-[#e8e4f0] shadow-lg px-4 py-2 flex items-center gap-3">
          <button onClick={reRecord}
            className="flex items-center gap-2 bg-tv-surface text-tv-text-label px-4 py-2 rounded-full text-[12px] font-medium hover:bg-tv-surface-hover transition-colors">
            <RefreshCw size={13} />Re-record
          </button>
          <button onClick={() => { setElapsed(0); setPhase("setup"); }}
            className="flex items-center gap-1.5 text-tv-text-secondary hover:text-tv-danger px-3 py-2 rounded-full text-[12px] font-medium transition-colors hover:bg-tv-danger-bg">
            <Trash2 size={13} />Discard
          </button>
          <div className="h-7 w-px bg-[#e8e4f0]" />
          <span className="text-[11px] text-tv-text-secondary">
            <span className="font-semibold text-tv-text-primary">{fmtSec(elapsed)}</span> recorded
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Upload flow ─────────────────���──────────────────────────────────────
export function UploadSetupStep({ onNext }: { onNext: () => void }) {
  const [state, setState] = useState<"idle" | "uploading" | "processing" | "done">("idle");
  const [progress, setProgress] = useState(0);

  const startUpload = () => {
    setState("uploading");
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 12 + 4;
      if (p >= 100) {
        p = 100;
        clearInterval(iv);
        setProgress(100);
        setTimeout(() => {
          setState("processing");
          let pp = 0;
          const iv2 = setInterval(() => {
            pp += Math.random() * 15 + 5;
            if (pp >= 100) {
              pp = 100;
              clearInterval(iv2);
              setProgress(100);
              setTimeout(() => setState("done"), 400);
            } else {
              setProgress(Math.round(pp));
            }
          }, 250);
        }, 300);
      } else {
        setProgress(Math.round(p));
      }
    }, 180);
  };

  if (state === "done") {
    return (
      <div className="max-w-xl mx-auto">
        <h2 className="text-[22px] font-black text-tv-text-primary mb-1">Upload complete</h2>
        <p className="text-[14px] text-tv-text-secondary mb-6">Your video is ready to trim and customize.</p>
        <div className="bg-white border border-tv-border-light rounded-xl p-6 flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-tv-success-bg rounded-lg flex items-center justify-center shrink-0">
            <Check size={24} className="text-tv-success" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-tv-text-primary">annual_fund_thank_you.mp4</p>
            <p className="text-[12px] text-tv-text-secondary">24.7 MB · 1:08 · 1080p · H.264 · Formatted to 4:3</p>
          </div>
          <div className="shrink-0 text-right">
            <span className="inline-flex items-center gap-1 bg-tv-success-bg border border-tv-success-border text-tv-success text-[11px] font-semibold px-3 py-1 rounded-full">
              <Check size={10} strokeWidth={3} />Ready
            </span>
          </div>
        </div>
        {/* Next button is in the sticky header */}
      </div>
    );
  }

  if (state === "uploading" || state === "processing") {
    return (
      <div className="max-w-xl mx-auto">
        <h2 className="text-[22px] font-black text-tv-text-primary mb-1">
          {state === "uploading" ? "Uploading…" : "Processing…"}
        </h2>
        <p className="text-[14px] text-tv-text-secondary mb-8">
          {state === "uploading" ? "Uploading your video to ThankView." : "Analyzing and optimizing your video."}
        </p>
        <div className="bg-white border border-tv-border-light rounded-xl p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-md bg-tv-brand-tint flex items-center justify-center shrink-0">
              <Upload size={20} className="text-tv-text-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-tv-text-primary mb-0.5">annual_fund_thank_you.mp4</p>
              <p className="text-[11px] text-tv-text-secondary">24.7 MB</p>
            </div>
            <span className="text-[13px] font-semibold text-tv-text-brand">{progress}%</span>
          </div>
          <div className="w-full h-2.5 bg-tv-border-divider rounded-full overflow-hidden">
            <div className="h-full bg-tv-brand-bg rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[11px] text-tv-text-secondary mt-3 text-center">
            {state === "uploading" ? "Uploading at 4.2 MB/s…" : "Transcoding for playback…"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-[22px] font-black text-tv-text-primary mb-1">Upload a video</h2>
      <p className="text-[14px] text-tv-text-secondary mb-6">Drag & drop or click to browse your files.</p>
      <button type="button" onClick={startUpload}
        className="w-full border-2 border-dashed border-tv-border-strong rounded-xl bg-[#fafbff] p-16 flex flex-col items-center gap-4 cursor-pointer hover:bg-tv-brand-tint hover:border-tv-brand-bg transition-all group">
        <div className="w-16 h-16 bg-tv-brand-tint rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
          <Upload size={28} className="text-tv-text-brand" />
        </div>
        <div className="text-center">
          <p className="text-[15px] font-bold text-tv-text-primary mb-1">Drop your video here</p>
          <p className="text-[13px] text-tv-text-secondary">MP4, MOV or WebM · Max 2 GB</p>
        </div>
        <div className="bg-tv-brand-bg text-white px-6 py-2 rounded-full text-[13px] font-semibold">Browse files</div>
      </button>

      {/* Format hints */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
        {[
          { fmt: "MP4 / H.264", note: "Recommended" },
          { fmt: "MOV / ProRes", note: "High quality" },
          { fmt: "WebM / VP9",  note: "Web optimized" },
        ].map(f => (
          <div key={f.fmt} className="bg-white border border-tv-border-light rounded-lg px-4 py-3 text-center">
            <p className="text-[12px] font-semibold text-tv-text-primary">{f.fmt}</p>
            <p className="text-[10px] text-tv-text-secondary">{f.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step 2: Library flow ───────────────────────────────────────────────────────
export function LibrarySetupStep({ onNext }: { onNext: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [search,   setSearch]   = useState("");
  const filtered = LIBRARY_VIDEOS.filter(v => v.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[22px] font-black text-tv-text-primary mb-0.5">Select from Library</h2>
          <p className="text-[13px] text-tv-text-secondary">Choose a previously recorded video.</p>
        </div>
        <div className="relative">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search videos…" aria-label="Search videos"
            className="border border-tv-border-light bg-white rounded-full px-4 py-2 text-[13px] text-tv-text-primary w-52 placeholder:text-tv-text-decorative focus-visible:outline-2 focus-visible:outline-tv-brand focus-visible:outline-offset-2 pr-8" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {filtered.map(v => (
          <button key={v.id} onClick={() => setSelected(v.id)}
            className={`rounded-lg overflow-hidden border-2 transition-all text-left ${selected === v.id ? "border-tv-brand-bg shadow-lg" : "border-tv-border-light hover:border-tv-border-strong"}`}>
            <div className={`h-28 bg-gradient-to-br ${v.color} flex items-center justify-center relative`}>
              <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/60 flex items-center justify-center">
                <Play size={16} className="text-white ml-0.5" fill="white" />
              </div>
              <span className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">{v.duration}</span>
              {selected === v.id && (
                <div className="absolute inset-0 bg-tv-brand-bg/20 flex items-center justify-center">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                    <Check size={14} className="text-tv-text-brand" strokeWidth={3} />
                  </div>
                </div>
              )}
            </div>
            <div className="p-3 bg-white">
              <p className="text-[12px] font-semibold text-tv-text-primary truncate">{v.title}</p>
              <p className="text-[10px] text-tv-text-secondary mt-0.5">{v.date} · {v.views} views</p>
            </div>
          </button>
        ))}
      </div>

      <p className="text-[12px] text-tv-text-secondary">{selected ? "1 video selected" : "No video selected"}</p>
    </div>
  );
}

// ── Step 2: Combine / Splice Videos ────────────────────────────────────────────
export function CombineSetupStep({ onNext }: { onNext: () => void }) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const filtered = LIBRARY_VIDEOS.filter(v => v.title.toLowerCase().includes(search.toLowerCase()));

  const toggleVideo = (id: number) => {
    setSelectedIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setSelectedIds(s => { const arr = [...s]; [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]; return arr; });
  };

  const moveDown = (idx: number) => {
    if (idx >= selectedIds.length - 1) return;
    setSelectedIds(s => { const arr = [...s]; [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]; return arr; });
  };

  const selectedVideos = selectedIds.map(id => LIBRARY_VIDEOS.find(v => v.id === id)).filter(Boolean) as typeof LIBRARY_VIDEOS;
  const totalDuration = selectedVideos.reduce((sum, v) => {
    const parts = v.duration.split(":");
    return sum + parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }, 0);
  const fmtTotal = `${Math.floor(totalDuration / 60)}:${String(totalDuration % 60).padStart(2, "0")}`;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[22px] font-black text-tv-text-primary mb-0.5">Combine Videos</h2>
          <p className="text-[13px] text-tv-text-secondary">Select and arrange library videos to splice together.</p>
        </div>
        <div className="relative">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search videos…" aria-label="Search videos"
            className="border border-tv-border-light bg-white rounded-full px-4 py-2 text-[13px] text-tv-text-primary w-52 placeholder:text-tv-text-decorative focus-visible:outline-2 focus-visible:outline-tv-brand focus-visible:outline-offset-2 pr-8" />
        </div>
      </div>

      <div className="flex gap-6">
        {/* Video selection grid */}
        <div className="flex-1">
          <p className="text-[11px] font-semibold text-tv-text-label uppercase tracking-wider mb-2">Library Videos</p>
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(v => (
              <button key={v.id} onClick={() => toggleVideo(v.id)}
                className={`rounded-lg overflow-hidden border-2 transition-all text-left ${selectedIds.includes(v.id) ? "border-tv-brand-bg shadow-md" : "border-tv-border-light hover:border-tv-border-strong"}`}>
                <div className={`h-20 bg-gradient-to-br ${v.color} flex items-center justify-center relative`}>
                  <Play size={14} className="text-white/90" fill="white" />
                  <span className="absolute bottom-1.5 right-1.5 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">{v.duration}</span>
                  {selectedIds.includes(v.id) && (
                    <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-tv-brand-bg rounded-full flex items-center justify-center text-white text-[9px] font-bold">
                      {selectedIds.indexOf(v.id) + 1}
                    </div>
                  )}
                </div>
                <div className="p-2 bg-white">
                  <p className="text-[11px] font-semibold text-tv-text-primary truncate">{v.title}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Arrange panel */}
        <div className="w-[300px] shrink-0">
          <p className="text-[11px] font-semibold text-tv-text-label uppercase tracking-wider mb-2">Arrangement ({selectedIds.length} clips)</p>
          {selectedIds.length === 0 ? (
            <div className="bg-[#fafbff] border-2 border-dashed border-[#d8d0e8] rounded-lg p-6 text-center">
              <Combine size={24} className="text-tv-text-decorative mx-auto mb-2" />
              <p className="text-[12px] text-tv-text-secondary">Select videos from the left to add them to your sequence.</p>
            </div>
          ) : (
            <div className="space-y-1.5 mb-4">
              {selectedVideos.map((v, idx) => (
                <div key={v.id} className="flex items-center gap-2 bg-white border border-tv-border-light rounded-md px-3 py-2">
                  <span className="w-5 h-5 bg-tv-brand-tint text-tv-text-brand rounded-full text-[10px] font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-tv-text-primary truncate">{v.title}</p>
                    <p className="text-[9px] text-tv-text-secondary font-mono">{v.duration}</p>
                  </div>
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button onClick={() => moveUp(idx)} disabled={idx === 0} className="text-tv-text-secondary hover:text-tv-brand disabled:opacity-30 disabled:cursor-not-allowed"><ChevronDown size={10} className="rotate-180" /></button>
                    <button onClick={() => moveDown(idx)} disabled={idx === selectedIds.length - 1} className="text-tv-text-secondary hover:text-tv-brand disabled:opacity-30 disabled:cursor-not-allowed"><ChevronDown size={10} /></button>
                  </div>
                  <button onClick={() => toggleVideo(v.id)} className="text-tv-text-secondary hover:text-tv-danger transition-colors shrink-0"><X size={11} /></button>
                </div>
              ))}
            </div>
          )}
          {selectedIds.length >= 2 && (
            <div className="bg-tv-brand-tint rounded-md p-3 mb-4 border border-tv-border-strong">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-tv-text-label">Total duration:</span>
                <span className="font-semibold text-tv-text-brand font-mono">{fmtTotal}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center mt-6">
        {selectedIds.length < 2 && (
          <div className="flex items-center gap-1.5 text-[12px] text-[#b45309]">
            <CircleAlert size={13} />Select at least 2 videos to combine.
          </div>
        )}
        {/* Next button is in the sticky header */}
      </div>
    </div>
  );
}

// ── Step 3: Trim, Crop & Rotate ────────────────────────────────────────────────
const CROP_PRESETS = [
  { key: "original", label: "Original", ratio: null },
  { key: "4:3",      label: "4:3",      ratio: 4 / 3 },
  { key: "16:9",     label: "16:9",     ratio: 16 / 9 },
  { key: "1:1",      label: "1:1",      ratio: 1 },
  { key: "9:16",     label: "9:16",     ratio: 9 / 16 },
] as const;

export function TrimStep({ onNext }: { onNext: () => void }) {
  const TOTAL_SEC = 68;
  const [startPct, setStartPct] = useState(8);
  const [endPct,   setEndPct]   = useState(90);
  const [cropKey,  setCropKey]  = useState("original");
  const [rotation, setRotation] = useState(0);
  const [flipH,    setFlipH]    = useState(false);
  const [flipV,    setFlipV]    = useState(false);
  const [playing,  setPlaying]  = useState(false);
  const [headPct,  setHeadPct]  = useState(8);
  const [speed,    setSpeed]    = useState<number>(1);
  const [volume,   setVolume]   = useState(80);
  const [muted,    setMuted]    = useState(false);
  const [splits,   setSplits]   = useState<number[]>([]);
  const [history,  setHistory]  = useState<Array<{ startPct: number; endPct: number; cropKey: string; rotation: number; flipH: boolean; flipV: boolean }>>([]);
  const [redoStack, setRedoStack] = useState<typeof history>([]);
  const waveRef  = useRef<HTMLDivElement>(null);
  const playRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const trimmedSec = Math.round(((endPct - startPct) / 100) * TOTAL_SEC);

  const snap = () => ({ startPct, endPct, cropKey, rotation, flipH, flipV });
  const pushHistory = () => { setHistory(h => [...h, snap()]); setRedoStack([]); };
  const undo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setRedoStack(r => [...r, snap()]);
    setHistory(h => h.slice(0, -1));
    setStartPct(prev.startPct); setEndPct(prev.endPct);
    setCropKey(prev.cropKey); setRotation(prev.rotation);
    setFlipH(prev.flipH); setFlipV(prev.flipV);
  };
  const redo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory(h => [...h, snap()]);
    setRedoStack(r => r.slice(0, -1));
    setStartPct(next.startPct); setEndPct(next.endPct);
    setCropKey(next.cropKey); setRotation(next.rotation);
    setFlipH(next.flipH); setFlipV(next.flipV);
  };

  useEffect(() => {
    if (playing) {
      const stepMs = 50;
      const pctPerStep = (speed * (stepMs / 1000) / TOTAL_SEC) * 100;
      playRef.current = setInterval(() => {
        setHeadPct(h => {
          const next = h + pctPerStep;
          if (next >= endPct) { setPlaying(false); return endPct; }
          return next;
        });
      }, stepMs);
    }
    return () => { if (playRef.current) clearInterval(playRef.current); };
  }, [playing, speed, endPct]);

  const togglePlay = () => {
    if (playing) { setPlaying(false); return; }
    if (headPct >= endPct || headPct < startPct) setHeadPct(startPct);
    setPlaying(true);
  };

  const seekFromEvent = (e: React.MouseEvent) => {
    if (!waveRef.current) return;
    const rect = waveRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    setHeadPct(pct); setPlaying(false);
  };

  const startDrag = (handle: "start" | "end") => (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    pushHistory();
    const rect = waveRef.current?.getBoundingClientRect();
    if (!rect) return;
    const onMove = (ev: MouseEvent) => {
      const pct = Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100));
      if (handle === "start") setStartPct(Math.min(pct, endPct - 5));
      else setEndPct(Math.max(pct, startPct + 5));
    };
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const splitAtHead = () => {
    if (headPct > startPct && headPct < endPct && !splits.includes(Math.round(headPct)))
      setSplits(s => [...s, Math.round(headPct)].sort((a, b) => a - b));
  };
  const removeSplit = (pct: number) => setSplits(s => s.filter(v => v !== pct));

  const setCropH    = (k: string) => { pushHistory(); setCropKey(k); };
  const rotateH     = () => { pushHistory(); setRotation(r => (r + 90) % 360); };
  const resetRot    = () => { pushHistory(); setRotation(0); };
  const toggleFlipH = () => { pushHistory(); setFlipH(f => !f); };
  const toggleFlipV = () => { pushHistory(); setFlipV(f => !f); };

  const SPEEDS = [0.5, 1, 1.5, 2];
  const previewTransform = [`rotate(${rotation}deg)`, flipH ? "scaleX(-1)" : "", flipV ? "scaleY(-1)" : ""].filter(Boolean).join(" ");

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-[22px] font-black text-tv-text-primary mb-1">Trim, crop & rotate</h2>
      <p className="text-[14px] text-tv-text-secondary mb-6">Drag handles to trim, click the waveform to seek, and use the toolbar below.</p>

      <div className="bg-white rounded-xl border border-tv-border-light p-6">
        {/* Preview */}
        <button type="button" className="w-full rounded-lg bg-tv-brand-bg aspect-video mb-5 flex items-center justify-center relative overflow-hidden cursor-pointer group" onClick={togglePlay}>
          <div className="flex items-center justify-center transition-transform duration-300" style={{ transform: previewTransform }}>
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <div className="w-14 h-14 bg-tv-brand-bg rounded-full flex items-center justify-center text-white text-[22px] font-black">KM</div>
            </div>
          </div>

          {!playing && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
              <div className="w-14 h-14 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Play size={22} className="text-white ml-0.5" fill="white" />
              </div>
            </div>
          )}

          {cropKey !== "original" && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-4 border-2 border-white/50 border-dashed rounded-sm" />
              <div className="absolute top-2 right-2 bg-black/50 rounded-full px-2 py-0.5">
                <span className="text-white text-[10px] font-medium">{cropKey}</span>
              </div>
            </div>
          )}

          <div className="absolute bottom-3 left-4 flex items-center gap-2 text-white/80 text-[11px] bg-black/40 backdrop-blur-sm rounded-full px-3 py-1">
            {playing ? <span className="w-1.5 h-1.5 bg-tv-danger rounded-full animate-pulse motion-reduce:animate-none" /> : <Clock size={11} />}
            <span className="font-mono">{fmtPct(headPct)}</span>
            <span className="text-white/40">/</span>
            <span className="font-mono">{fmtSec(TOTAL_SEC)}</span>
          </div>
          <div className="absolute bottom-3 right-4 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1 text-white/80 text-[11px] font-mono">
            {fmtSec(trimmedSec)} selected
          </div>
          {rotation !== 0 && (
            <div className="absolute top-3 left-4 bg-black/50 rounded-full px-2.5 py-0.5 flex items-center gap-1 z-10">
              <RotateCw size={10} className="text-white" /><span className="text-white text-[10px] font-medium">{rotation}°</span>
            </div>
          )}
          {(flipH || flipV) && (
            <div className={`absolute top-3 ${rotation !== 0 ? "left-[80px]" : "left-4"} bg-black/50 rounded-full px-2.5 py-0.5 z-10`}>
              <span className="text-white text-[10px] font-medium">{flipH && "↔"}{flipH && flipV && " "}{flipV && "↕"} Flipped</span>
            </div>
          )}
          {speed !== 1 && (
            <div className="absolute top-3 right-4 bg-black/50 rounded-full px-2.5 py-0.5 z-10">
              <span className="text-white text-[10px] font-medium">{speed}×</span>
            </div>
          )}
        </button>

        {/* Waveform timeline */}
        <div className="mb-5">
          <div ref={waveRef} role="slider" tabIndex={0} aria-label="Audio waveform timeline" className="relative h-16 bg-tv-surface rounded-md overflow-hidden select-none cursor-pointer" onClick={seekFromEvent} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); seekFromEvent(e as any); } }}>
            <div className="absolute inset-0 flex items-center px-2 gap-[2px] pointer-events-none">
              {WAVEFORM.map((h, i) => {
                const pct = (i / WAVEFORM.length) * 100;
                const inRange = pct >= startPct && pct <= endPct;
                return <div key={i} className={`flex-1 rounded-sm transition-colors ${inRange ? "bg-tv-brand-bg" : "bg-[#d8d0e8]"}`} style={{ height: `${h}%` }} />;
              })}
            </div>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: `linear-gradient(to right, rgba(245,243,250,0.75) ${startPct}%, transparent ${startPct}%, transparent ${endPct}%, rgba(245,243,250,0.75) ${endPct}%)` }} />

            {/* Split markers */}
            {splits.map(s => (
              <div key={s} className="absolute top-0 bottom-0 w-0.5 bg-[#b45309] z-10 pointer-events-none" style={{ left: `${s}%` }}>
                <button onClick={e => { e.stopPropagation(); removeSplit(s); }}
                  className="absolute -top-1.5 -left-[5px] w-3 h-3 bg-[#b45309] rounded-full flex items-center justify-center pointer-events-auto hover:bg-[#d97706] transition-colors" title="Remove split">
                  <X size={6} className="text-white" />
                </button>
              </div>
            ))}

            {/* Playhead */}
            <div className="absolute top-0 bottom-0 w-0.5 bg-tv-danger-bg0 z-20 pointer-events-none transition-[left] duration-75" style={{ left: `${headPct}%` }}>
              <div className="absolute -top-1 -left-[4px] w-[9px] h-2.5 bg-tv-danger-bg0 rounded-b-sm" />
            </div>

            {/* Start handle �� draggable */}
            <div className="absolute top-0 bottom-0 w-1 bg-tv-brand-bg z-10" style={{ left: `${startPct}%` }}>
              <div onMouseDown={startDrag("start")} className="absolute top-1/2 -translate-y-1/2 -left-2 w-5 h-8 bg-tv-brand-bg rounded-md flex items-center justify-center cursor-ew-resize hover:bg-tv-brand transition-colors pointer-events-auto">
                <div className="flex flex-col gap-0.5">{[0,1,2].map(i => <div key={i} className="w-1.5 h-[2px] bg-white/70 rounded" />)}</div>
              </div>
            </div>
            {/* End handle — draggable */}
            <div className="absolute top-0 bottom-0 w-1 bg-tv-brand-bg z-10" style={{ left: `${endPct}%` }}>
              <div onMouseDown={startDrag("end")} className="absolute top-1/2 -translate-y-1/2 -right-2 w-5 h-8 bg-tv-brand-bg rounded-md flex items-center justify-center cursor-ew-resize hover:bg-tv-brand transition-colors pointer-events-auto">
                <div className="flex flex-col gap-0.5">{[0,1,2].map(i => <div key={i} className="w-1.5 h-[2px] bg-white/70 rounded" />)}</div>
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-2 text-[11px] text-tv-text-secondary">
            <span className="font-mono">0:00</span>
            <span className="font-semibold text-tv-text-brand">
              {fmtSec(trimmedSec)} selected of {fmtSec(TOTAL_SEC)}
              {splits.length > 0 && <span className="text-tv-warning ml-2">· {splits.length} split{splits.length > 1 ? "s" : ""}</span>}
            </span>
            <span className="font-mono">{fmtSec(TOTAL_SEC)}</span>
          </div>
        </div>

        {/* Transport controls */}
        <div className="flex items-center justify-between bg-[#f9f8fc] rounded-lg px-4 py-3 mb-5">
          <div className="flex items-center gap-2">
            <button onClick={undo} disabled={history.length === 0} title="Undo" aria-label="Undo"
              className="w-8 h-8 rounded-full flex items-center justify-center text-tv-text-secondary hover:bg-white hover:text-tv-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <RotateCw size={14} className="scale-x-[-1]" />
            </button>
            <button onClick={redo} disabled={redoStack.length === 0} title="Redo" aria-label="Redo"
              className="w-8 h-8 rounded-full flex items-center justify-center text-tv-text-secondary hover:bg-white hover:text-tv-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <RotateCw size={14} />
            </button>
            <div className="h-5 w-px bg-tv-border-light mx-1" />
            <button onClick={togglePlay} title={playing ? "Pause" : "Play"} aria-label={playing ? "Pause" : "Play"}
              className="w-9 h-9 rounded-full bg-tv-brand-bg hover:bg-tv-brand text-white flex items-center justify-center transition-colors shadow-sm">
              {playing ? <Square size={12} fill="white" /> : <Play size={14} className="ml-0.5" fill="white" />}
            </button>
            <button onClick={splitAtHead} title="Split at playhead" aria-label="Split at playhead"
              className="w-8 h-8 rounded-full flex items-center justify-center text-tv-text-secondary hover:bg-white hover:text-tv-warning transition-colors">
              <Scissors size={14} />
            </button>
          </div>

          <span className="text-[12px] font-mono text-tv-text-primary">{fmtPct(headPct)} <span className="text-tv-text-secondary">/ {fmtSec(TOTAL_SEC)}</span></span>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white rounded-full p-0.5 gap-0.5 border border-tv-border-light">
              {SPEEDS.map(s => (
                <button key={s} onClick={() => setSpeed(s)}
                  className={`px-2 py-1 rounded-full text-[10px] font-semibold transition-all ${speed === s ? "bg-tv-brand-bg text-white shadow-sm" : "text-tv-text-secondary hover:text-tv-text-primary"}`}>
                  {s}×
                </button>
              ))}
            </div>
            <div className="h-5 w-px bg-tv-border-light mx-0.5" />
            <button onClick={() => setMuted(!muted)} title={muted ? "Unmute" : "Mute"} aria-label={muted ? "Unmute" : "Mute"}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${muted ? "text-tv-danger bg-tv-danger-bg" : "text-tv-text-secondary hover:bg-white hover:text-tv-text-primary"}`}>
              {muted ? <MicOff size={13} /> : <Volume2 size={13} />}
            </button>
            <input type="range" min={0} max={100} value={muted ? 0 : volume} onChange={e => { setVolume(Number(e.target.value)); if (muted) setMuted(false); }}
              className="w-16 accent-tv-brand h-1" title={`Volume: ${muted ? 0 : volume}%`} />
          </div>
        </div>

        {/* Crop / Rotate / Flip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#f9f8fc] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Crop size={14} className="text-tv-text-brand" />
              <label className="text-[12px] font-semibold text-tv-text-primary">Crop</label>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CROP_PRESETS.map(c => (
                <button key={c.key} onClick={() => setCropH(c.key)}
                  className={`px-3 py-1.5 rounded-sm text-[11px] font-medium border-2 transition-all ${cropKey === c.key ? "border-tv-brand-bg bg-tv-brand-tint text-tv-text-brand" : "border-tv-border-light text-tv-text-secondary hover:border-tv-border-strong"}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#f9f8fc] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <RotateCw size={14} className="text-tv-text-brand" />
              <label className="text-[12px] font-semibold text-tv-text-primary">Rotate</label>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={rotateH}
                className="flex items-center gap-1.5 border-2 border-tv-border-light hover:border-tv-border-strong rounded-sm px-3 py-1.5 text-[11px] font-medium text-tv-text-primary transition-colors">
                <RotateCw size={12} className="text-tv-text-brand" />90°
              </button>
              <span className="text-[11px] font-mono text-tv-text-secondary">{rotation}°</span>
              {rotation !== 0 && <button onClick={resetRot} className="text-[11px] text-tv-text-brand font-medium hover:underline">Reset</button>}
            </div>
          </div>

          <div className="bg-[#f9f8fc] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw size={14} className="text-tv-text-brand" />
              <label className="text-[12px] font-semibold text-tv-text-primary">Flip</label>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleFlipH}
                className={`flex items-center gap-1.5 border-2 rounded-sm px-3 py-1.5 text-[11px] font-medium transition-all ${flipH ? "border-tv-brand-bg bg-tv-brand-tint text-tv-text-brand" : "border-tv-border-light text-tv-text-secondary hover:border-tv-border-strong"}`}>
                ↔ Horiz
              </button>
              <button onClick={toggleFlipV}
                className={`flex items-center gap-1.5 border-2 rounded-sm px-3 py-1.5 text-[11px] font-medium transition-all ${flipV ? "border-tv-brand-bg bg-tv-brand-tint text-tv-text-brand" : "border-tv-border-light text-tv-text-secondary hover:border-tv-border-strong"}`}>
                ↕ Vert
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Next button is in the sticky header */}
    </div>
  );
}

// ── Step 4: Thumbnail ──────────────────────────────────────────────────────────
export function ThumbnailStep({ onNext }: { onNext: () => void }) {
  const [selected,  setSelected]  = useState(1);
  const [gifMode,   setGifMode]   = useState(false);
  const [customUpl, setCustomUpl] = useState(false);

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-[22px] font-black text-tv-text-primary mb-1">Choose a thumbnail</h2>
      <p className="text-[14px] text-tv-text-secondary mb-6">Select a frame or upload a custom image. Recipients see this before they open your video.</p>

      {/* Frame grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {THUMB_FRAMES.map(f => (
          <button key={f.id} onClick={() => { setSelected(f.id); setCustomUpl(false); }}
            className={`rounded-lg overflow-hidden border-2 transition-all relative group ${selected === f.id && !customUpl ? "border-tv-brand-bg shadow-lg scale-[1.02]" : "border-tv-border-light hover:border-tv-border-strong"}`}>
            <div className={`h-28 bg-gradient-to-br ${f.gradient} flex items-center justify-center relative`}>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">KM</div>
              {gifMode && (
                <div className="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">GIF</div>
              )}
            </div>
            <div className="p-2 bg-white text-center">
              <span className="text-[11px] text-tv-text-secondary font-mono">{f.ts}</span>
            </div>
            {selected === f.id && !customUpl && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-tv-brand-bg rounded-full flex items-center justify-center">
                <Check size={11} className="text-white" strokeWidth={3} />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Custom upload */}
      <button onClick={() => { setCustomUpl(!customUpl); setSelected(0); }}
        className={`w-full flex items-center justify-center gap-2 text-[13px] font-medium border-2 border-dashed rounded-lg px-5 py-3 mb-4 transition-colors ${customUpl ? "border-tv-brand-bg bg-tv-brand-tint text-tv-text-brand" : "border-[#d8d0e8] text-tv-text-secondary hover:border-tv-border-strong hover:text-tv-brand"}`}>
        <ImageIcon size={15} />
        {customUpl ? "Custom image selected (hartwell_thumb.jpg)" : "Upload custom thumbnail"}
        {customUpl && <Check size={13} className="text-tv-text-brand" />}
      </button>

      {/* Animated GIF toggle */}
      <div className="flex items-center justify-between bg-white border border-tv-border-light rounded-lg px-5 py-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-tv-brand-tint rounded-sm flex items-center justify-center">
            <Sparkles size={14} className="text-tv-text-brand" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-tv-text-primary">Animated GIF preview</p>
            <p className="text-[11px] text-tv-text-secondary">Show a 2-second loop instead of a static frame</p>
          </div>
        </div>
        <button onClick={() => setGifMode(!gifMode)}
          className="w-9 h-5 rounded-full relative transition-colors shrink-0"
          style={{ backgroundColor: gifMode ? TV.brand : TV.borderStrong }}>
          <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all" style={{ left: gifMode ? 17 : 2 }} />
        </button>
      </div>

      {/* Next button is in the sticky header */}
    </div>
  );
}

// ── Step 5: Captions + Details ─────────────────────────────────────────────────
export function CaptionsStep({ onFinish, onSaveOnly }: { onFinish: () => void; onSaveOnly: () => void }) {
  const { show } = useToast();
  const [captions,    setCaptions]    = useState(CAPTIONS_DATA);
  const [editing,     setEditing]     = useState<number | null>(null);
  const [editText,    setEditText]    = useState("");
  const [activeCapId, setActiveCapId] = useState(1);
  const [videoTitle,  setVideoTitle]  = useState("Annual Fund Thank You – Kelley Molt");
  const [description, setDescription] = useState("");
  const [tags,        setTags]        = useState<string[]>([]);
  const [recipient,   setRecipient]   = useState("");
  const [folder,      setFolder]      = useState("Thank You Videos");
  const [privacy,     setPrivacy]     = useState<"private" | "org" | "public">("private");
  const [captionSrc,  setCaptionSrc]  = useState<"ai" | "upload" | "rev" | "none">("ai");
  const [captionProcessing, setCaptionProcessing] = useState(false);
  const processingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveEdit = () => {
    setCaptions(c => c.map(cap => cap.id === editing ? { ...cap, text: editText } : cap));
    setEditing(null);
  };

  const handleUploadSrt = () => {
    setCaptionSrc("upload");
    show("Caption file imported successfully", "success");
  };

  const handleGenerateAI = () => {
    setCaptionProcessing(true);
    show("Generating AI captions…", "info");
    processingTimerRef.current = setTimeout(() => {
      setCaptionProcessing(false);
      setCaptionSrc("ai");
      setCaptions(CAPTIONS_DATA);
      show("AI captions generated", "success");
    }, 2500);
  };

  const handleRequestRev = () => {
    setCaptionProcessing(true);
    show("REV human captioning requested — this may take a few hours", "info");
    processingTimerRef.current = setTimeout(() => {
      setCaptionProcessing(false);
      setCaptionSrc("rev");
      setCaptions(CAPTIONS_DATA);
      show("REV captions ready!", "success");
    }, 3500);
  };

  const handleCancelProcessing = () => {
    if (processingTimerRef.current) clearTimeout(processingTimerRef.current);
    setCaptionProcessing(false);
    show("Caption processing cancelled", "info");
  };

  const handleDeleteCaptions = () => {
    setCaptions([]);
    setCaptionSrc("none");
    show("Captions removed", "success");
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[22px] font-black text-tv-text-primary mb-0.5">Review & finalize</h2>
          <p className="text-[13px] text-tv-text-secondary">Edit captions, name your video, and set privacy before saving.</p>
        </div>
        {captionProcessing && (
          <span className="flex items-center gap-1.5 text-[12px] text-tv-text-brand bg-tv-brand-tint border border-tv-border-strong rounded-full px-3 py-1 font-medium">
            <div className="w-3 h-3 border-2 border-tv-brand-bg border-t-transparent rounded-full animate-spin" />Processing…
          </span>
        )}
        {!captionProcessing && captionSrc === "ai" && captions.length > 0 && (
          <span className="flex items-center gap-1.5 text-[12px] text-tv-success bg-tv-success-bg border border-tv-success-border rounded-full px-3 py-1 font-medium">
            <Check size={12} strokeWidth={3} />AI captions
          </span>
        )}
        {!captionProcessing && captionSrc === "upload" && captions.length > 0 && (
          <span className="flex items-center gap-1.5 text-[12px] text-tv-info bg-tv-info-bg border border-tv-info-border rounded-full px-3 py-1 font-medium">
            <FileText size={12} />Imported from file
          </span>
        )}
        {!captionProcessing && captionSrc === "rev" && captions.length > 0 && (
          <span className="flex items-center gap-1.5 text-[12px] text-[#b45309] bg-[#FEF3C7] border border-[#FCD34D] rounded-full px-3 py-1 font-medium">
            <Check size={12} strokeWidth={3} />REV human captions
          </span>
        )}
      </div>

      <div className="flex gap-6">
        {/* Left: video preview + details */}
        <div className="w-[340px] shrink-0 space-y-4">
          {/* Mini video preview */}
          <div className="relative rounded-xl overflow-hidden bg-tv-brand-bg aspect-video flex items-center justify-center shadow-md">
            <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/60 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
              <Play size={22} className="text-white ml-1" fill="white" />
            </div>
            {/* Active caption overlay */}
            {captions.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-2">
                <p className="text-white text-[10px] text-center leading-relaxed">
                  {captions.find(c => c.id === activeCapId)?.text}
                </p>
              </div>
            )}
            <div className="absolute top-2 left-2 bg-black/50 rounded-full px-2 py-0.5 text-white text-[9px] font-mono">1:08</div>
          </div>

          {/* Video details form */}
          <div className="bg-white border border-tv-border-light rounded-xl p-4 space-y-4">
            {/* Title (required) */}
            <div>
              <label className="text-[10px] font-semibold text-tv-text-label uppercase tracking-wider mb-1.5 flex items-center gap-1">
                Video title <span className="text-tv-danger">*</span>
              </label>
              <input value={videoTitle} onChange={e => setVideoTitle(e.target.value)}
                className="w-full border border-tv-border-light rounded-sm px-3 py-2 text-[12px] outline-none focus:ring-2 focus:ring-tv-brand-bg/30 focus:border-tv-brand-bg" />
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] font-semibold text-tv-text-label uppercase tracking-wider mb-1.5 block">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Add a description for this video…"
                rows={3}
                className="w-full border border-tv-border-light rounded-sm px-3 py-2 text-[12px] outline-none focus:ring-2 focus:ring-tv-brand-bg/30 focus:border-tv-brand-bg resize-none leading-relaxed" />
            </div>

            {/* Tags */}
            <TagSelect value={tags} onChange={setTags} label="Tags" compact />

            {/* Recipient */}
            <div>
              <label className="text-[10px] font-semibold text-tv-text-label uppercase tracking-wider mb-1.5 block">Recipient (optional)</label>
              <div className="relative">
                <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-tv-text-secondary" />
                <input value={recipient} onChange={e => setRecipient(e.target.value)}
                  placeholder="Who is this video for?"
                  className="w-full border border-tv-border-light rounded-sm pl-8 pr-3 py-2 text-[12px] outline-none focus:ring-2 focus:ring-tv-brand-bg/30 focus:border-tv-brand-bg" />
              </div>
            </div>

            {/* Folder */}
            <div>
              <label className="text-[10px] font-semibold text-tv-text-label uppercase tracking-wider mb-1.5 block">Folder</label>
              <div className="relative">
                <Folder size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-tv-text-secondary" />
                <select value={folder} onChange={e => setFolder(e.target.value)}
                  className="w-full border border-tv-border-light rounded-sm pl-8 pr-3 py-2 text-[12px] text-tv-text-primary outline-none appearance-none focus:ring-2 focus:ring-tv-brand-bg/30">
                  {["Thank You Videos", "Solicitation 2025", "Replies", "No folder"].map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label className="text-[10px] font-semibold text-tv-text-label uppercase tracking-wider mb-1.5 block">Visibility</label>
              <div className="space-y-1.5">
                {[
                  { key: "private" as const, icon: Lock,  label: "Private",         sub: "Only you can see this" },
                  { key: "org"     as const, icon: Globe, label: "Organization",     sub: "Anyone at Hartwell" },
                ].map(opt => (
                  <button key={opt.key} onClick={() => setPrivacy(opt.key)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-sm border-2 transition-all ${privacy === opt.key ? "border-tv-brand-bg bg-tv-brand-tint" : "border-tv-border-light hover:border-tv-border-strong"}`}>
                    <opt.icon size={13} className={privacy === opt.key ? "text-tv-text-brand" : "text-tv-text-secondary"} />
                    <div className="flex-1 text-left">
                      <p className={`text-[11px] font-semibold ${privacy === opt.key ? "text-tv-text-primary" : "text-tv-text-secondary"}`}>{opt.label}</p>
                      <p className="text-[10px] text-tv-text-secondary">{opt.sub}</p>
                    </div>
                    {privacy === opt.key && <Check size={11} className="text-tv-text-brand" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: captions */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Caption management toolbar */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <button onClick={handleGenerateAI} disabled={captionProcessing}
              className={`flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full border transition-colors disabled:opacity-40 ${captionSrc === "ai" && captions.length > 0 ? "border-tv-success bg-tv-success-bg text-tv-success" : "border-tv-border-light text-tv-text-secondary hover:border-tv-border-strong hover:text-tv-brand"}`}>
              <Sparkles size={11} />Generate AI captions
            </button>
            <button onClick={handleUploadSrt} disabled={captionProcessing}
              className={`flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full border transition-colors disabled:opacity-40 ${captionSrc === "upload" && captions.length > 0 ? "border-tv-info bg-tv-info-bg text-tv-info" : "border-tv-border-light text-tv-text-secondary hover:border-tv-border-strong hover:text-tv-brand"}`}>
              <UploadCloud size={11} />Upload SRT / VTT
            </button>
            <button onClick={handleRequestRev} disabled={captionProcessing}
              className={`flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full border transition-colors disabled:opacity-40 ${captionSrc === "rev" && captions.length > 0 ? "border-[#b45309] bg-[#FEF3C7] text-[#b45309]" : "border-tv-border-light text-tv-text-secondary hover:border-[#b45309] hover:text-[#b45309]"}`}>
              <FileText size={11} />REV (Human)
            </button>
            {captionProcessing && (
              <button onClick={handleCancelProcessing}
                className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full border border-tv-danger-border text-tv-danger hover:bg-tv-danger-bg transition-colors">
                <X size={11} />Cancel Processing
              </button>
            )}
            {captions.length > 0 && !captionProcessing && (
              <button onClick={handleDeleteCaptions}
                className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full border border-tv-border-light text-tv-text-secondary hover:border-tv-danger-border hover:text-tv-danger hover:bg-tv-danger-bg transition-colors ml-auto">
                <Trash2 size={11} />Remove captions
              </button>
            )}
          </div>

          {captionProcessing ? (
            <div className="flex-1 bg-[#fafbff] border-2 border-dashed border-tv-border-strong rounded-xl flex flex-col items-center justify-center gap-3 py-12">
              <div className="w-10 h-10 border-3 border-tv-brand-bg border-t-transparent rounded-full animate-spin" />
              <p className="text-[14px] font-semibold text-tv-text-primary">Processing captions…</p>
              <p className="text-[12px] text-tv-text-secondary">This may take a moment. You can cancel if it seems stuck.</p>
              <button onClick={handleCancelProcessing} className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-tv-danger border border-tv-danger-border rounded-full px-4 py-2 hover:bg-tv-danger-bg transition-colors">
                <X size={12} />Cancel Processing
              </button>
            </div>
          ) : captions.length > 0 ? (
            <div className="bg-white rounded-xl border border-tv-border-light divide-y divide-tv-border-divider overflow-hidden flex-1">
              {captions.map(cap => (
                <div key={cap.id}
                  onClick={() => setActiveCapId(cap.id)}
                  className={`flex items-start gap-4 px-5 py-4 group cursor-pointer transition-colors ${activeCapId === cap.id ? "bg-[#f9f7fc]" : "hover:bg-tv-surface-muted"}`}>
                  <span className="text-[11px] font-mono text-tv-text-brand pt-0.5 shrink-0 w-20 text-right leading-relaxed">{cap.start} → {cap.end}</span>
                  <div className="flex-1 min-w-0">
                    {editing === cap.id ? (
                      <div className="flex items-center gap-2">
                        <input value={editText} onChange={e => setEditText(e.target.value)}
                          className="flex-1 text-[13px] text-tv-text-primary border border-tv-border-strong rounded-sm px-3 py-1.5 outline-none focus:border-tv-brand-bg"
                          onKeyDown={e => e.key === "Enter" && saveEdit()} autoFocus />
                        <button onClick={saveEdit} className="w-7 h-7 bg-tv-brand-bg rounded-full flex items-center justify-center text-white shrink-0"><Check size={12} /></button>
                        <button onClick={() => setEditing(null)} className="w-7 h-7 bg-tv-surface rounded-full flex items-center justify-center text-tv-text-secondary shrink-0"><X size={12} /></button>
                      </div>
                    ) : (
                      <button onClick={e => { e.stopPropagation(); setEditing(cap.id); setEditText(cap.text); }}
                        className="text-[13px] text-tv-text-primary text-left hover:text-tv-brand transition-colors leading-relaxed w-full">
                        {cap.text}
                      </button>
                    )}
                  </div>
                  <Volume2 size={13} className={`shrink-0 mt-1 transition-colors ${activeCapId === cap.id ? "text-tv-text-brand" : "text-[#d8d0e8] group-hover:text-tv-text-brand"}`} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 bg-[#fafbff] border-2 border-dashed border-[#d8d0e8] rounded-xl flex flex-col items-center justify-center gap-3 py-12">
              <div className="w-12 h-12 bg-tv-brand-tint rounded-full flex items-center justify-center">
                <FileText size={20} className="text-tv-text-decorative" />
              </div>
              <p className="text-[14px] font-semibold text-tv-text-secondary">No captions</p>
              <p className="text-[12px] text-tv-text-secondary">Generate AI captions or upload an SRT/VTT file.</p>
            </div>
          )}

          <div className="flex items-center mt-5">
            {captions.length > 0 ? (
              <button className="flex items-center gap-2 text-[13px] font-medium text-tv-text-secondary hover:text-tv-brand transition-colors">
                <Download size={14} />Download .SRT
              </button>
            ) : null}
            {/* Save/Send buttons are in the sticky header */}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Root ───────────��───────────────────────────────────────────────────────────
/* ── Empty / Onboarding State for first-time users ─────────────────────────── */
const SOURCE_OPTIONS = [
  { key: "record"  as Source, icon: Camera,     label: "Record a Video",      desc: "Use your webcam or screen to record a personalized video message." },
  { key: "upload"  as Source, icon: UploadCloud, label: "Upload a Video",     desc: "Upload an existing video file from your computer." },
  { key: "library" as Source, icon: Film,        label: "Choose from Library", desc: "Select a previously recorded or uploaded video." },
  { key: "combine" as Source, icon: Combine,     label: "Combine Clips",       desc: "Merge multiple video clips into a single video." },
];

export function VideoCreate() {
  const navigate  = useNavigate();
  const { show } = useToast();
  const [source, setSource] = useState<Source | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const next = () => {
    setShowEditor(true);
  };

  const handleEditorSave = (data: VideoEditorData) => {
    show("Video saved to your library", "success");
    setTimeout(() => navigate("/videos"), 800);
  };

  const handleEditorCancel = () => {
    navigate("/videos");
  };

  // Full-screen VideoEditor after recording/upload/selection is complete
  if (showEditor) {
    return (
      <div className="min-h-full flex flex-col">
        <VideoEditor
          initialName="Annual Fund Thank You – Kelley Molt"
          initialDuration="1:08"
          videoType={source === "record" ? "Recorded Video" : source === "upload" ? "Uploaded Video" : source === "combine" ? "Combined Video" : "Library Video"}
          onSave={handleEditorSave}
          onCancel={handleEditorCancel}
        />
      </div>
    );
  }

  // ── Empty / onboarding state — no source selected yet ─────────────────────
  if (source === null) {
    return (
      <div className="min-h-full">
        {/* Top header */}
        <div className="sticky top-0 z-10 bg-white border-b border-tv-border-divider px-3 sm:px-6 py-3">
          <h1 className="text-[22px] sm:text-[24px] font-black text-tv-text-primary">Create a Video</h1>
          <p className="text-[13px] text-tv-text-secondary">Choose how you'd like to get started</p>
        </div>

        <div className="p-3 sm:p-6 flex flex-col items-center">
          {/* Hero illustration area */}
          <div className="flex flex-col items-center text-center max-w-lg mx-auto pt-8 sm:pt-12 pb-8">
            <div className="w-20 h-20 bg-tv-brand-tint rounded-full flex items-center justify-center mb-5">
              <Film size={36} style={{ color: TV.textDecorative }} />
            </div>
            <h2 className="text-[18px] sm:text-[20px] font-black text-tv-text-primary mb-2">
              Ready to create your next video?
            </h2>
            <p className="text-[13px] text-tv-text-secondary leading-relaxed max-w-md">
              Personalized video messages are the most engaging way to connect with your audience.
              Record a webcam message, upload an existing video, pick one from your library, or combine multiple clips.
            </p>
          </div>

          {/* Source selection cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
            {SOURCE_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setSource(opt.key)}
                className="flex items-start gap-4 p-5 bg-white rounded-xl border-2 text-left transition-all hover:border-tv-border-strong hover:shadow-md group"
                style={{ borderColor: TV.borderLight }}
              >
                <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 transition-colors group-hover:bg-tv-brand-tint"
                  style={{ backgroundColor: TV.surface }}>
                  <opt.icon size={20} style={{ color: TV.textBrand }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-tv-text-primary mb-0.5">{opt.label}</p>
                  <p className="text-[12px] text-tv-text-secondary leading-relaxed">{opt.desc}</p>
                </div>
                <ChevronRight size={16} className="shrink-0 mt-1 text-tv-text-secondary group-hover:text-tv-text-brand transition-colors" />
              </button>
            ))}
          </div>

          {/* Helpful tips */}
          <div className="mt-8 p-4 rounded-xl max-w-2xl w-full" style={{ backgroundColor: TV.surface, border: `1px solid ${TV.borderDivider}` }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: TV.textLabel }}>Quick Tips</p>
            <ul className="text-[12px] text-tv-text-secondary space-y-1.5">
              <li className="flex items-start gap-2"><Sparkles size={12} className="shrink-0 mt-0.5" style={{ color: TV.textBrand }} /> <span>Keep videos under 2 minutes for the best engagement rates.</span></li>
              <li className="flex items-start gap-2"><Mic size={12} className="shrink-0 mt-0.5" style={{ color: TV.textBrand }} /> <span>Use a quiet environment and face a light source for best results.</span></li>
              <li className="flex items-start gap-2"><User size={12} className="shrink-0 mt-0.5" style={{ color: TV.textBrand }} /> <span>Address recipients by name to increase open and watch rates.</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Nav */}
        <div className="sticky bottom-0 z-10 bg-white border-t border-tv-border-divider px-3 sm:px-6 py-3 flex items-center justify-end">
          <button onClick={() => navigate("/videos")}
            className="text-[13px] text-tv-text-secondary flex items-center gap-1.5 border border-tv-border-light rounded-full px-4 py-2 hover:bg-tv-surface transition-colors">
            <X size={13} />Back to Library
          </button>
        </div>
      </div>
    );
  }

  // ── Source selected — show the setup step for the chosen source ────────────
  return (
    <div className="min-h-full">
      {/* Top header */}
      <div className="sticky top-0 z-10 bg-white border-b border-tv-border-divider px-3 sm:px-6 py-3">
        <h1 className="text-[22px] sm:text-[24px] font-black text-tv-text-primary">Video Creation</h1>
        <p className="text-[13px] text-tv-text-secondary">Record, upload, or select from your library</p>
      </div>

      <div className="p-3 sm:p-6">
        <div className="pb-16">
          {source === "record"  && <RecordSetupStep  onNext={next} />}
          {source === "upload"  && <UploadSetupStep  onNext={next} />}
          {source === "library" && <LibrarySetupStep onNext={next} />}
          {source === "combine" && <CombineSetupStep onNext={next} />}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="sticky bottom-0 z-10 bg-white border-t border-tv-border-divider px-3 sm:px-6 py-3 flex items-center justify-between gap-2">
        <button onClick={() => setSource(null)}
          className="text-[13px] text-tv-text-secondary flex items-center gap-1.5 border border-tv-border-light rounded-full px-4 py-2 hover:bg-tv-surface transition-colors">
          <ChevronRight size={13} className="rotate-180" />Back
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/videos")}
            className="text-[13px] text-tv-danger flex items-center gap-1.5 border border-tv-danger-border rounded-full px-4 py-2 hover:bg-tv-danger-bg transition-colors">
            <X size={13} />Cancel
          </button>
          <button onClick={next}
            className="flex items-center gap-1.5 text-[13px] font-semibold bg-tv-brand-bg text-white rounded-full px-4 py-2 hover:bg-tv-brand transition-colors">
            Continue<ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
