import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import {
  Camera, Mic, Settings2, ScrollText, ChevronDown, Check, X,
  TriangleAlert, Circle, Square, Upload, Image,
  RotateCcw,
} from "lucide-react";
import { TV } from "../../theme";

// ── Types ────────────────────────────────────────────────────────────────────
type StudioState = "setup" | "recording" | "cancel-confirm";
type QualityOption = "480p" | "720p" | "1080p";

interface RecordingResult {
  duration: string;
  seconds: number;
}

export interface RecordingStudioProps {
  contextLabel?: string;
  contextSublabel?: string;
  contextIcon?: ReactNode;
  onRecordingComplete: (result: RecordingResult) => void;
  onClose: () => void;
  maxDuration?: number;
  /** When provided, the script/teleprompter state is controlled externally */
  scriptText?: string;
  scriptVisible?: boolean;
  /** Hide the built-in script panel & toolbar button (caller renders them elsewhere) */
  hideBuiltInScript?: boolean;
}

// ── Mock devices ────────────────────────────────────────────────────────────
const MOCK_CAMERAS = [
  { id: "cam1", label: "FaceTime HD Camera" },
  { id: "cam2", label: "USB Webcam (Logitech C920)" },
  { id: "cam3", label: "Elgato Facecam" },
];

const MOCK_MICS = [
  { id: "mic1", label: "Internal Microphone" },
  { id: "mic2", label: "AirPods Pro" },
  { id: "mic3", label: "Blue Yeti USB" },
  { id: "mic4", label: "Elgato Wave:3" },
];

const QUALITY_OPTIONS: { id: QualityOption; label: string; recommended?: boolean }[] = [
  { id: "480p",  label: "480p" },
  { id: "720p",  label: "720p", recommended: true },
  { id: "1080p", label: "1080p" },
];

const BACKGROUND_PRESETS = [
  { id: "none",        label: "None",        color: "transparent", emoji: "" },
  { id: "light-blur",  label: "Light Blur",  color: "#e0daea",     emoji: "" },
  { id: "strong-blur", label: "Strong Blur", color: "#b5a4cd",     emoji: "" },
  { id: "office",      label: "Office",       color: "#dbeafe",     emoji: "" },
  { id: "bookshelf",   label: "Bookshelf",    color: "#fef3c7",     emoji: "" },
  { id: "nature",      label: "Nature",       color: "#dcfce7",     emoji: "" },
  { id: "gradient",    label: "Gradient",     color: "linear-gradient(135deg, #7c45b0, #00C0F5)", emoji: "" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtTimer(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ── Dropdown wrapper (reusable for each toolbar button) ─────────────────────
function ToolbarDropdown({
  icon,
  label,
  isOpen,
  onToggle,
  children,
  dotIndicator,
  align = "left",
}: {
  icon: ReactNode;
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  dotIndicator?: boolean;
  align?: "left" | "right";
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        panelRef.current && !panelRef.current.contains(e.target as Node)
      ) {
        onToggle();
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [isOpen, onToggle]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={onToggle}
        className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-[11px] transition-colors ${
          isOpen ? "bg-white/20 text-white" : "text-white/70 hover:text-white hover:bg-white/10"
        }`}
      >
        {icon}
        <span className="hidden sm:inline">{label}</span>
        <ChevronDown size={10} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
        {dotIndicator && (
          <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-tv-brand-bg border border-[#1a1a2e]" />
        )}
      </button>
      {isOpen && (
        <div
          ref={panelRef}
          className={`absolute bottom-full mb-2 ${align === "right" ? "right-0" : "left-0"} z-50 min-w-[220px] bg-[#2a2a3e] border border-white/10 rounded-lg shadow-2xl overflow-hidden`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  RecordingStudio
// ═════════════════════════════════════════════════════════════════════════════
export function RecordingStudio({
  contextLabel,
  contextSublabel,
  contextIcon,
  onRecordingComplete,
  onClose,
  maxDuration = 120,
  scriptText: externalScriptText,
  scriptVisible: externalScriptVisible,
  hideBuiltInScript,
}: RecordingStudioProps) {
  // ── State ────────────────────────────────────────────────────────────────
  const [state, setState] = useState<StudioState>("setup");
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Device / settings state
  const [selectedCamera, setSelectedCamera] = useState(MOCK_CAMERAS[0].id);
  const [selectedMic, setSelectedMic] = useState(MOCK_MICS[0].id);
  const [quality, setQuality] = useState<QualityOption>("720p");
  const [background, setBackground] = useState("none");
  const [scriptText, setScriptText] = useState("");
  const [scriptVisible, setScriptVisible] = useState(true);
  const [scriptPanelOpen, setScriptPanelOpen] = useState(false);

  // Toolbar dropdown state — only one open at a time
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const toggleDropdown = useCallback((id: string) => {
    setOpenDropdown(prev => prev === id ? null : id);
  }, []);

  // Mock audio level (animated)
  const [audioLevel, setAudioLevel] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setAudioLevel(Math.random() * 80 + 10), 200);
    return () => clearInterval(iv);
  }, []);

  // ── Recording timer ──────────────────────────────────────────────────────
  const startRecording = useCallback(() => {
    setElapsed(0);
    setState("recording");
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (next >= maxDuration) {
          // auto-stop
          clearInterval(timerRef.current!);
          return maxDuration;
        }
        return next;
      });
    }, 1000);
  }, [maxDuration]);

  // Auto-complete when timer hits maxDuration
  useEffect(() => {
    if (state === "recording" && elapsed >= maxDuration) {
      stopAndSave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, maxDuration, state]);

  const stopAndSave = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const sec = Math.max(3, elapsed);
    onRecordingComplete({ duration: fmtTimer(sec), seconds: sec });
  }, [elapsed, onRecordingComplete]);

  const cancelRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setState("cancel-confirm");
  }, []);

  const resumeRecording = useCallback(() => {
    setState("recording");
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (next >= maxDuration) {
          clearInterval(timerRef.current!);
          return maxDuration;
        }
        return next;
      });
    }, 1000);
  }, [maxDuration]);

  const startOver = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setElapsed(0);
    setState("setup");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Derived
  const cameraName = MOCK_CAMERAS.find(c => c.id === selectedCamera)?.label ?? "";
  const micName = MOCK_MICS.find(m => m.id === selectedMic)?.label ?? "";
  const bgLabel = BACKGROUND_PRESETS.find(b => b.id === background)?.label ?? "None";

  // Resolve script values: use external props if provided, otherwise internal state
  const resolvedScriptText = hideBuiltInScript ? (externalScriptText ?? "") : scriptText;
  const resolvedScriptVisible = hideBuiltInScript ? (externalScriptVisible ?? true) : scriptVisible;
  const wordCount = resolvedScriptText.trim() ? resolvedScriptText.trim().split(/\s+/).length : 0;
  const readTimeSec = Math.round(wordCount / 2.5);
  const hasScript = resolvedScriptText.trim().length > 0;

  return (
    <div className="flex flex-col gap-0 w-full max-w-[720px] mx-auto">

      {/* ═══════════ VIEWFINDER ═══════════ */}
      <div className="relative aspect-[16/10] max-h-[50vh] bg-[#1a1a2e] rounded-t-[14px] overflow-hidden flex items-center justify-center select-none">

        {/* ── Setup state ── */}
        {state === "setup" && (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-white/[0.06] flex items-center justify-center">
              <Camera size={28} className="text-white/30" />
            </div>
            <p className="text-white/70 text-[14px] font-semibold">Camera Preview</p>
            <p className="text-white/35 text-[11px]">{cameraName}</p>
          </div>
        )}

        {/* ── Recording state ── */}
        {state === "recording" && (
          <>
            {/* Simulated camera feed (dark gradient) */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#2a2a3e] via-[#1a1a2e] to-[#0f0f1e]" />

            {/* Top-left: rec dot + timer + max */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-tv-danger animate-pulse" />
              <span className="text-white/90 text-[13px] font-mono font-semibold">{fmtTimer(elapsed)}</span>
              <span className="text-white/30 text-[10px] font-mono">/ {fmtTimer(maxDuration)}</span>
            </div>

            {/* Top-right: quality + background labels */}
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] text-white/50 font-medium">{quality}</span>
              {background !== "none" && (
                <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] text-white/50 font-medium">{bgLabel}</span>
              )}
            </div>

            {/* Bottom: floating action buttons — Cancel, Stop & Save, Start Over */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent pt-10 pb-4 flex items-center justify-center gap-3 z-10">
              <button
                onClick={cancelRecording}
                className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-medium text-white/80 border border-white/25 rounded-full hover:bg-white/10 hover:text-white transition-colors backdrop-blur-sm"
                aria-label="Cancel recording"
              >
                <X size={12} />
                Cancel
              </button>
              <button
                onClick={stopAndSave}
                className="flex items-center gap-1.5 px-6 py-2.5 text-[13px] font-semibold text-white bg-tv-success rounded-full hover:bg-tv-success-hover transition-colors shadow-lg shadow-black/30"
              >
                <Square size={11} fill="currentColor" />
                Stop &amp; Save
              </button>
              <button
                onClick={startOver}
                className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-medium text-[#5eead4] border border-[#5eead4]/25 rounded-full hover:bg-white/10 hover:text-[#99f6e4] transition-colors backdrop-blur-sm"
                aria-label="Start over"
              >
                <RotateCcw size={11} />
                Restart
              </button>
            </div>

            {/* Bottom-left: context badge */}
            {contextLabel && (
              <div className="absolute bottom-16 left-3 flex items-center gap-2 bg-black/40 rounded-full px-2.5 py-1 z-10">
                {contextIcon && <span className="text-white/60">{contextIcon}</span>}
                <div>
                  <p className="text-[10px] text-white/80 font-medium">{contextLabel}</p>
                  {contextSublabel && <p className="text-[8px] text-white/40">{contextSublabel}</p>}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Cancel-confirm overlay ── */}
        {state === "cancel-confirm" && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
            <div className="flex flex-col items-center gap-4 px-6 text-center max-w-[340px]">
              <div className="w-12 h-12 rounded-full bg-tv-warning-bg flex items-center justify-center">
                <TriangleAlert size={22} className="text-tv-warning" />
              </div>
              <p className="text-white text-[16px] font-semibold">Cancel Recording?</p>
              <p className="text-white/50 text-[12px]">
                You have recorded <span className="text-white/80 font-medium">{fmtTimer(elapsed)}</span> so far.
              </p>
              <div className="flex flex-col items-center gap-2 w-full mt-1">
                <button
                  onClick={resumeRecording}
                  className="w-full px-5 py-2.5 text-[13px] font-semibold text-white bg-tv-brand-bg rounded-full hover:bg-tv-brand-hover transition-colors"
                >
                  Resume Recording
                </button>
                <button
                  onClick={startOver}
                  className="w-full px-5 py-2 text-[13px] font-medium text-white/80 border border-white/20 rounded-full hover:bg-white/10 transition-colors"
                >
                  Start Over
                </button>
                <button
                  onClick={onClose}
                  className="mt-1 text-[12px] text-tv-danger hover:text-tv-danger-hover transition-colors"
                >
                  Discard &amp; Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Teleprompter overlay ── */}
        {(state === "recording" || state === "setup") && hasScript && resolvedScriptVisible && (
          <div className={`absolute inset-x-0 pointer-events-none ${state === "recording" ? "bottom-14 z-[9]" : "bottom-0 z-10"}`}>
            <div className="bg-gradient-to-t from-black/80 via-black/50 to-transparent px-5 pt-10 pb-4">
              <p className="text-white/90 text-[13px] leading-relaxed whitespace-pre-wrap line-clamp-3">
                {resolvedScriptText}
              </p>
            </div>
          </div>
        )}

        {/* ── Start Recording — floated over the viewfinder ── */}
        {state === "setup" && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent pt-10 pb-4 flex flex-col items-center gap-2 z-10">
            <button
              onClick={startRecording}
              className="flex items-center gap-2.5 px-8 py-3 text-[14px] font-semibold text-white bg-[#007c9e] rounded-full hover:bg-[#005d77] transition-colors shadow-lg shadow-black/30"
            >
              <Circle size={14} fill="currentColor" />
              Start Recording
            </button>
            {/* Settings summary */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-full text-[9px] text-white/70">
                <Camera size={9} />{cameraName.split("(")[0].trim()}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-full text-[9px] text-white/70">
                <Mic size={9} />{micName.split("(")[0].trim()}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-full text-[9px] text-white/70">
                <Settings2 size={9} />{quality}
              </span>
              {background !== "none" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-full text-[9px] text-white/70">
                  <Image size={9} />{bgLabel}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════ TOOLBAR STRIP ═══════════ */}
      <div className="flex items-center bg-[#1a1a2e] rounded-b-[14px] px-2 py-1.5 gap-0 relative">

        {/* 1. Camera */}
        <ToolbarDropdown
          icon={<Camera size={13} />}
          label="Camera"
          isOpen={openDropdown === "camera"}
          onToggle={() => toggleDropdown("camera")}
        >
          <div className="px-2 pt-2 pb-1">
            <p className="text-[9px] font-semibold text-white/40 uppercase tracking-wider px-1">Camera</p>
          </div>
          {MOCK_CAMERAS.map(cam => (
            <button
              key={cam.id}
              onClick={() => { setSelectedCamera(cam.id); setOpenDropdown(null); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-white/5 transition-colors"
            >
              <span className="w-4 shrink-0">{selectedCamera === cam.id && <Check size={12} className="text-tv-brand-bg" />}</span>
              <span className="text-[12px] text-white/80">{cam.label}</span>
            </button>
          ))}
        </ToolbarDropdown>

        <div className="w-px h-5 bg-white/10 mx-1 shrink-0" />

        {/* 2. Microphone */}
        <ToolbarDropdown
          icon={<Mic size={13} />}
          label="Mic"
          isOpen={openDropdown === "mic"}
          onToggle={() => toggleDropdown("mic")}
        >
          <div className="px-2 pt-2 pb-1">
            <p className="text-[9px] font-semibold text-white/40 uppercase tracking-wider px-1">Microphone</p>
          </div>
          {MOCK_MICS.map(mic => (
            <button
              key={mic.id}
              onClick={() => { setSelectedMic(mic.id); setOpenDropdown(null); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-white/5 transition-colors"
            >
              <span className="w-4 shrink-0">{selectedMic === mic.id && <Check size={12} className="text-tv-brand-bg" />}</span>
              <span className="text-[12px] text-white/80">{mic.label}</span>
            </button>
          ))}
          {/* Audio level meter */}
          <div className="px-3 py-2 border-t border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-white/40">Level</span>
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${audioLevel}%`,
                    background: audioLevel > 80 ? TV.danger : audioLevel > 50 ? TV.warning : TV.success,
                  }}
                />
              </div>
            </div>
          </div>
        </ToolbarDropdown>

        <div className="w-px h-5 bg-white/10 mx-1 shrink-0" />

        {/* 3. Quality */}
        <ToolbarDropdown
          icon={<Settings2 size={13} />}
          label={quality}
          isOpen={openDropdown === "quality"}
          onToggle={() => toggleDropdown("quality")}
        >
          <div className="px-2 pt-2 pb-1">
            <p className="text-[9px] font-semibold text-white/40 uppercase tracking-wider px-1">Quality</p>
          </div>
          {QUALITY_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => { setQuality(opt.id); setOpenDropdown(null); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-white/5 transition-colors"
            >
              <span className="w-4 shrink-0">{quality === opt.id && <Check size={12} className="text-tv-brand-bg" />}</span>
              <span className="text-[12px] text-white/80">{opt.label}</span>
              {opt.recommended && <span className="ml-auto text-[9px] text-tv-brand-bg">Recommended</span>}
            </button>
          ))}
        </ToolbarDropdown>

        <div className="w-px h-5 bg-white/10 mx-1 shrink-0" />

        {/* 4. Background */}
        <ToolbarDropdown
          icon={<Image size={13} />}
          label="BG"
          isOpen={openDropdown === "bg"}
          onToggle={() => toggleDropdown("bg")}
        >
          <div className="px-2 pt-2 pb-1">
            <p className="text-[9px] font-semibold text-white/40 uppercase tracking-wider px-1">Virtual Background</p>
          </div>
          <div className="grid grid-cols-4 gap-1.5 px-2.5 py-2">
            {BACKGROUND_PRESETS.map(bg => (
              <button
                key={bg.id}
                onClick={() => { setBackground(bg.id); }}
                className={`flex flex-col items-center gap-1 p-1.5 rounded-sm transition-all ${
                  background === bg.id
                    ? "ring-2 ring-tv-brand-bg bg-white/10"
                    : "hover:bg-white/5"
                }`}
              >
                <div
                  className="w-10 h-10 rounded-sm flex items-center justify-center text-[16px] border border-white/10"
                  style={{
                    background: bg.color.startsWith("linear") ? bg.color : bg.color === "transparent" ? "#2a2a3e" : bg.color,
                  }}
                >
                  {bg.emoji}
                </div>
                <span className="text-[8px] text-white/50 whitespace-nowrap">{bg.label}</span>
              </button>
            ))}
            {/* Upload option */}
            <button
              onClick={() => { /* upload handler */ }}
              className="flex flex-col items-center gap-1 p-1.5 rounded-sm hover:bg-white/5 transition-colors"
            >
              <div className="w-10 h-10 rounded-sm border border-dashed border-white/20 flex items-center justify-center">
                <Upload size={14} className="text-white/30" />
              </div>
              <span className="text-[8px] text-white/50">Upload</span>
            </button>
          </div>
          {background !== "none" && (
            <div className="px-3 pb-2">
              <button
                onClick={() => setBackground("none")}
                className="text-[10px] text-tv-brand-bg hover:underline"
              >
                Remove background
              </button>
            </div>
          )}
        </ToolbarDropdown>

        <div className="w-px h-5 bg-white/10 mx-1 shrink-0" />

        {/* Spacer pushes script to the right */}
        <div className="flex-1" />

        {/* 5. Script/Teleprompter (right-aligned) */}
        {!hideBuiltInScript && (
          <ToolbarDropdown
            icon={<ScrollText size={13} />}
            label="Script"
            isOpen={openDropdown === "script"}
            onToggle={() => {
              toggleDropdown("script");
              if (openDropdown !== "script") setScriptPanelOpen(true);
            }}
            dotIndicator={hasScript}
            align="right"
          >
            {/* The script dropdown is minimal — the real panel is below */}
            <div className="px-3 py-2">
              <button
                onClick={() => { setScriptPanelOpen(!scriptPanelOpen); setOpenDropdown(null); }}
                className="text-[12px] text-white/80 hover:text-white transition-colors"
              >
                {scriptPanelOpen ? "Hide Script Panel" : "Show Script Panel"}
              </button>
            </div>
          </ToolbarDropdown>
        )}

        {/* "Start Over" during recording */}
        {state === "recording" && (
          <>
            <div className="w-px h-5 bg-white/10 mx-1 shrink-0" />
            <button
              onClick={startOver}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] text-[#5eead4] hover:text-[#99f6e4] rounded-sm hover:bg-white/5 transition-colors"
            >
              <RotateCcw size={11} />
              <span className="hidden sm:inline">Start Over</span>
            </button>
          </>
        )}
      </div>

      {/* ══════════ SCRIPT PANEL (collapsible) ═══════════ */}
      {!hideBuiltInScript && scriptPanelOpen && (
        <div className="bg-[#f8f6fc] border border-tv-border-light rounded-lg mt-2 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-tv-border-divider">
            <span className="text-[12px] font-semibold text-tv-text-primary">Script / Teleprompter</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-[11px] text-tv-text-secondary">Show on screen</span>
              <button
                onClick={() => setScriptVisible(!scriptVisible)}
                className={`relative w-8 h-[18px] rounded-full transition-colors ${
                  scriptVisible ? "bg-tv-brand-bg" : "bg-tv-border-light"
                }`}
              >
                <span className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform ${
                  scriptVisible ? "left-[16px]" : "left-[2px]"
                }`} />
              </button>
            </label>
          </div>
          <div className="px-4 py-3">
            <textarea
              value={scriptText}
              onChange={e => setScriptText(e.target.value)}
              rows={3}
              placeholder="Type or paste your script here…"
              className="w-full bg-white border border-tv-border-light rounded-sm px-3 py-2 text-[12px] text-tv-text-primary placeholder:text-tv-text-decorative resize-none focus:outline-none focus:border-tv-brand-bg/40 transition-colors"
            />
          </div>
          <div className="flex items-center justify-between px-4 pb-3">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-tv-text-secondary">
                {wordCount} word{wordCount !== 1 ? "s" : ""}
              </span>
              <span className="text-[10px] text-tv-text-decorative">&middot;</span>
              <span className="text-[10px] text-tv-text-secondary">
                ~{readTimeSec}s read time
              </span>
            </div>
            {hasScript && (
              <button
                onClick={() => setScriptText("")}
                className="text-[10px] text-tv-brand hover:text-tv-brand-hover transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Action buttons are now floating inside the viewfinder during recording */}
    </div>
  );
}
