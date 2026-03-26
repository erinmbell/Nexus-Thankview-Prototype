import { useState, useRef, useCallback, useEffect } from "react";
import {
  Play, Pause, Plus, Check, Trash2, Pencil,
  Clapperboard, Users, Video, MonitorPlay, Settings2,
  GripVertical, Volume2, Maximize, RotateCcw, Monitor,
} from "lucide-react";
import { createPortal } from "react-dom";
import type { BuilderView, VideoElements } from "./types";

// ── Segment metadata ────────────────────────────────────────────────────────
export interface SegmentMeta {
  key: keyof VideoElements;
  label: string;
  desc: string;
  icon: typeof Video;
  color: string;
  bgColor: string;
  activeColor: string;
  builderView: BuilderView;
}

export const SEGMENT_DEFS: SegmentMeta[] = [
  { key: "intro",            label: "Intro",                    desc: "Same for all",         icon: Clapperboard, color: "text-tv-brand",   bgColor: "bg-tv-brand-tint",  activeColor: "border-tv-brand-bg",   builderView: "intro-builder" },
  { key: "personalizedClip", label: "Personalized Video",       desc: "Unique per recipient", icon: Users,        color: "text-tv-info",    bgColor: "bg-tv-info-bg",     activeColor: "border-tv-info",       builderView: "personalized-recorder" },
  { key: "sharedVideo",      label: "Video for All Recipients", desc: "Same for all",         icon: Video,        color: "text-tv-success", bgColor: "bg-tv-success-bg",  activeColor: "border-tv-success",    builderView: "shared-recording" },
  { key: "addOnClip",        label: "Add-On Clip",              desc: "Extra clip for all",   icon: Plus,         color: "text-cyan-600",   bgColor: "bg-cyan-50",        activeColor: "border-cyan-500",      builderView: "addon-clip" },
  { key: "outro",            label: "Outro",                    desc: "Same for all",         icon: MonitorPlay,  color: "text-tv-warning", bgColor: "bg-tv-warning-bg",  activeColor: "border-tv-warning",    builderView: "outro-builder" },
];

function getSegmentDef(key: keyof VideoElements) {
  return SEGMENT_DEFS.find(d => d.key === key)!;
}

function isDone(key: keyof VideoElements, doneFlags: Record<string, boolean>) {
  if (key === "intro") return doneFlags.hasIntro;
  if (key === "personalizedClip" || key === "sharedVideo" || key === "addOnClip") return doneFlags.hasMain;
  if (key === "outro") return doneFlags.hasOutro;
  return false;
}

function isEditing(key: keyof VideoElements, builderView: BuilderView) {
  const def = getSegmentDef(key);
  return builderView === def.builderView;
}

function fmtSec(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}:${String(sec).padStart(2, "0")}` : `${sec}s`;
}

// Placeholder durations (will be wired to real data later)
const PLACEHOLDER_DURATION: Record<keyof VideoElements, number> = {
  intro: 8,
  personalizedClip: 30,
  sharedVideo: 45,
  addOnClip: 20,
  outro: 6,
};

// ═════════════════════════════════════════════════════════════════════════════
//  VideoTimelineBar — persistent timeline between content and bottom nav
// ═════════════════════════════════════════════════════════════════════════════
export interface VideoTimelineBarProps {
  videoElements: VideoElements;
  elementOrder: (keyof VideoElements)[];
  builderView: BuilderView;
  doneFlags: { hasIntro: boolean; hasMain: boolean; hasOutro: boolean; hasOverlay: boolean };
  onNavigate: (view: BuilderView) => void;
  onAddElement: (key: keyof VideoElements) => void;
  onRemoveElement: (key: keyof VideoElements) => void;
  onReorder: (newOrder: (keyof VideoElements)[]) => void;
}

const RULER_MARKS = [0, 10, 20, 30, 40, 50, 60];

export function VideoTimelineBar({
  videoElements,
  elementOrder,
  builderView,
  doneFlags,
  onNavigate,
  onAddElement,
  onRemoveElement,
  onReorder,
}: VideoTimelineBarProps) {
  const [reorderMode, setReorderMode] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  // Playback (cosmetic)
  const [playing, setPlaying] = useState(false);
  const [playheadSec, setPlayheadSec] = useState(0);

  // Drag state
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);

  const activeSegments = elementOrder.filter(k => videoElements[k]);
  const totalDuration = activeSegments.reduce((sum, k) => sum + PLACEHOLDER_DURATION[k], 0);

  // Position the add-menu popover via portal
  const openAddMenu = useCallback(() => {
    if (addBtnRef.current) {
      const r = addBtnRef.current.getBoundingClientRect();
      setMenuPos({ top: r.top, left: r.left + r.width / 2 });
    }
    setAddMenuOpen(true);
  }, []);

  // ── Drag-and-drop handlers ──────────────────────────────────────────────
  const handleDragStart = (idx: number) => (e: React.DragEvent) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(idx));
  };

  const handleDragOver = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropIdx(idx);
  };

  const handleDrop = (targetIdx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === targetIdx) {
      setDragIdx(null);
      setDropIdx(null);
      return;
    }
    const newActive = [...activeSegments];
    const [moved] = newActive.splice(dragIdx, 1);
    newActive.splice(targetIdx, 0, moved);

    // Rebuild full order: replace active items in their positions, keep inactive items
    const inactive = elementOrder.filter(k => !videoElements[k]);
    // Merge: active segments in their new order, then inactive at end
    onReorder([...newActive, ...inactive]);
    setDragIdx(null);
    setDropIdx(null);
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setDropIdx(null);
  };

  const handleModifyStructure = () => {
    setAddMenuOpen(false);
    setReorderMode(true);
    onNavigate("overview");
  };

  return (
    <div className="bg-white border-t border-tv-border-divider px-4 sm:px-5 shrink-0">

      {/* ── Reorder banner ── */}
      {reorderMode && (
        <div className="flex items-center justify-between py-2 border-b border-tv-border-divider">
          <div className="flex items-center gap-2">
            <GripVertical size={14} className="text-tv-text-decorative" />
            <span className="text-[12px] text-tv-text-secondary">Drag clips to reorder your video structure</span>
          </div>
          <button
            onClick={() => setReorderMode(false)}
            className="px-4 py-1.5 text-[12px] font-semibold text-white bg-tv-brand-bg rounded-full hover:bg-tv-brand-hover transition-colors"
          >
            Done Reordering
          </button>
        </div>
      )}

      {/* ── Row 1: Playback controls ── */}
      {!reorderMode && (
        null
      )}

      {/* ── Row 2: Time ruler ── */}
      {!reorderMode && (
        <div className="relative h-3 mb-[10px]">
          {RULER_MARKS.map(sec => (
            <div key={sec} className="absolute flex flex-col items-center" style={{ left: `${(sec / 60) * 100}%` }}>
              <div className="w-px h-1.5 bg-tv-border-strong" />
              <span className="text-[8px] text-tv-text-secondary font-mono mt-px">{sec}s</span>
            </div>
          ))}
          {[5, 15, 25, 35, 45, 55].map(sec => (
            <div key={sec} className="absolute" style={{ left: `${(sec / 60) * 100}%` }}>
              <div className="w-px h-1 bg-tv-border-light" />
            </div>
          ))}
        </div>
      )}

      {/* ── Row 3: Segment track ── */}
      <div className="flex items-center gap-1.5 py-1 overflow-x-auto">
        {activeSegments.map((key, idx) => {
          const def = getSegmentDef(key);
          const done = isDone(key, doneFlags);
          const active = isEditing(key, builderView) && !reorderMode;
          const dragging = dragIdx === idx;

          return (
            <div key={key} className="flex items-center shrink-0">
              {/* Drop indicator before this segment */}
              {reorderMode && dropIdx === idx && dragIdx !== null && dragIdx !== idx && (
                <div className="w-0.5 h-10 bg-tv-brand-bg rounded-full mx-0.5 shrink-0" />
              )}
              <div
                draggable={reorderMode}
                onDragStart={reorderMode ? handleDragStart(idx) : undefined}
                onDragOver={reorderMode ? handleDragOver(idx) : undefined}
                onDrop={reorderMode ? handleDrop(idx) : undefined}
                onDragEnd={reorderMode ? handleDragEnd : undefined}
                onClick={() => { if (!reorderMode) onNavigate(def.builderView); }}
                className={`group relative flex items-center gap-2 px-2.5 py-1.5 rounded-sm transition-all shrink-0 ${
                  reorderMode ? "cursor-grab" : "cursor-pointer"
                } ${
                  dragging ? "opacity-40 scale-95" : ""
                } ${
                  active
                    ? `bg-tv-brand-tint border-2 ${def.activeColor}`
                    : done
                    ? "bg-white border-2 border-tv-border-strong"
                    : "bg-white border-2 border-dashed border-tv-border-light"
                }`}
              >
                {/* Grip handle (reorder mode only) */}
                {reorderMode && (
                  <GripVertical size={12} className="text-tv-text-decorative shrink-0" />
                )}

                {/* Icon */}
                <div className={`w-6 h-6 rounded-[5px] ${def.bgColor} flex items-center justify-center shrink-0`}>
                  {done ? (
                    <Check size={12} className="text-tv-success" />
                  ) : (
                    <Plus size={12} className={def.color} />
                  )}
                </div>

                {/* Label + duration */}
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-tv-text-primary whitespace-nowrap">{def.label}</p>
                  <p className="text-[9px] text-tv-text-secondary whitespace-nowrap">
                    {done ? fmtSec(PLACEHOLDER_DURATION[key]) : "Not started"}
                  </p>
                </div>

                {/* Done badge */}
                {done && !reorderMode && (
                  <div className="w-4 h-4 rounded-full bg-tv-success flex items-center justify-center shrink-0">
                    <Check size={8} className="text-white" />
                  </div>
                )}

                {/* Hover actions (not in reorder mode) */}
                {!reorderMode && (
                  <div className="absolute top-1 right-1 hidden group-hover:flex items-center gap-0.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); onNavigate(def.builderView); }}
                      className="w-5 h-5 rounded bg-white shadow-sm border border-tv-border-light flex items-center justify-center text-tv-text-secondary hover:text-tv-brand transition-colors"
                      title={`Edit ${def.label}`}
                      aria-label={`Edit ${def.label}`}
                    >
                      <Pencil size={9} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemoveElement(key); }}
                      className="w-5 h-5 rounded bg-white shadow-sm border border-tv-border-light flex items-center justify-center text-tv-text-secondary hover:text-tv-danger transition-colors"
                      title={`Remove ${def.label}`}
                      aria-label={`Remove ${def.label}`}
                    >
                      <Trash2 size={9} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Drop indicator after the last segment (for reorder) */}
        {reorderMode && activeSegments.length > 0 && dropIdx === activeSegments.length && dragIdx !== null && (
          <div className="w-0.5 h-10 bg-tv-brand-bg rounded-full mx-0.5 shrink-0"
            onDragOver={(e) => { e.preventDefault(); setDropIdx(activeSegments.length); }}
            onDrop={handleDrop(activeSegments.length)}
          />
        )}

        {/* After-last drop zone (invisible) */}
        {reorderMode && (
          <div
            className="w-6 h-10 shrink-0"
            onDragOver={(e) => { e.preventDefault(); setDropIdx(activeSegments.length); }}
            onDrop={handleDrop(activeSegments.length)}
          />
        )}

        {/* "+" Add button (hidden in reorder mode) */}
        {!reorderMode && (
          <button
            ref={addBtnRef}
            onClick={openAddMenu}
            className="w-8 h-8 rounded-sm bg-tv-brand-bg text-white flex items-center justify-center shrink-0 hover:bg-tv-brand-hover transition-colors shadow-sm"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {/* ── Add menu popover (portal) ── */}
      {addMenuOpen && menuPos && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setAddMenuOpen(false)} />
          <div
            ref={(el) => {
              if (!el) return;
              const rect = el.getBoundingClientRect();
              const pad = 8;
              let top = menuPos.top - 8 - rect.height;
              let left = menuPos.left - 140;
              if (top < pad) top = menuPos.top + 48;
              if (left < pad) left = pad;
              if (left + rect.width > window.innerWidth - pad) left = window.innerWidth - pad - rect.width;
              if (top + rect.height > window.innerHeight - pad) top = window.innerHeight - pad - rect.height;
              el.style.top = `${top}px`;
              el.style.left = `${left}px`;
              el.style.visibility = "visible";
            }}
            className="fixed z-[9999] w-[280px] bg-white rounded-lg shadow-2xl border border-tv-border-light overflow-hidden"
            style={{ top: -9999, left: -9999, visibility: "hidden" as const }}
          >
            <div className="px-3 pt-2.5 pb-1">
              <p className="text-[10px] font-semibold text-tv-text-secondary uppercase tracking-wider">Add Section</p>
            </div>
            {SEGMENT_DEFS.map(def => {
              const alreadyAdded = videoElements[def.key];
              const done = isDone(def.key, doneFlags);
              return (
                <button
                  key={def.key}
                  onClick={() => {
                    if (!alreadyAdded) {
                      onAddElement(def.key);
                    }
                    onNavigate(def.builderView);
                    setAddMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-tv-surface cursor-pointer"
                >
                  <div className={`w-8 h-8 rounded-sm ${def.bgColor} flex items-center justify-center shrink-0`}>
                    <def.icon size={14} className={def.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-tv-text-primary">{def.label}</p>
                    <p className="text-[10px] text-tv-text-secondary">
                      {alreadyAdded ? (done ? "Completed" : "In progress") : def.desc}
                    </p>
                  </div>
                  {done ? (
                    <Check size={13} className="text-tv-success shrink-0" />
                  ) : alreadyAdded ? (
                    <Pencil size={12} className="text-tv-text-secondary shrink-0" />
                  ) : (
                    <Plus size={13} className="text-tv-text-decorative shrink-0" />
                  )}
                </button>
              );
            })}
            <div className="border-t border-tv-border-divider">
              <button
                onClick={handleModifyStructure}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-tv-surface transition-colors"
              >
                <div className="w-8 h-8 rounded-sm bg-tv-surface flex items-center justify-center shrink-0">
                  <Settings2 size={14} className="text-tv-text-secondary" />
                </div>
                <div className="flex-1 min-w-0 gap-0.5 flex flex-col">
                  <p className="text-[12px] font-semibold text-tv-text-primary">Modify Video Structure</p>
                  <p className="text-[10px] text-tv-text-secondary">Reorder or manage elements</p>
                </div>
              </button>
            </div>
          </div>
        </>,
        document.body,
      )}
    </div>
  );
}


// ═════════════════════════════════════════════════════════════════════════════
//  VideoOverview — Step 5 landing page (builderView === "overview")
// ═════════════════════════════════════════════════════════════════════════════
export interface VideoOverviewProps {
  videoElements: VideoElements;
  elementOrder: (keyof VideoElements)[];
  doneFlags: { hasIntro: boolean; hasMain: boolean; hasOutro: boolean; hasOverlay: boolean };
  hasAnyVideoElement: boolean;
  isVideoComplete: boolean;
  onNavigate: (view: BuilderView) => void;
  onOpenLibrary?: () => void;
}

type PlayState = "idle" | "playing" | "finished";

export function VideoOverview({
  videoElements,
  elementOrder,
  doneFlags,
  hasAnyVideoElement,
  isVideoComplete,
  onNavigate,
  onOpenLibrary,
}: VideoOverviewProps) {
  const [playState, setPlayState] = useState<PlayState>("idle");
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeSegments = elementOrder.filter(k => videoElements[k]);

  // Simulate playback
  useEffect(() => {
    if (playState === "playing") {
      timerRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(timerRef.current!);
            setPlayState("finished");
            return 100;
          }
          return p + 0.5;
        });
      }, 50);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playState]);

  const handlePlay = () => {
    if (playState === "finished") {
      setProgress(0);
    }
    setPlayState("playing");
  };

  const handlePause = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPlayState("idle");
  };

  const handleReplay = () => {
    setProgress(0);
    setPlayState("playing");
  };

  const totalDuration = activeSegments.reduce((sum, k) => sum + PLACEHOLDER_DURATION[k], 0);

  return (
    <div className="flex-1 overflow-auto flex flex-col">
      {/* ── Header bar ── */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-tv-border-divider shrink-0">
        <h2 className="text-[15px] font-black text-tv-text-primary">
          {hasAnyVideoElement ? "Review & Preview" : "Video Preview"}
        </h2>
        <button
          onClick={onOpenLibrary}
          className="flex items-center gap-1.5 text-[12px] font-medium text-tv-brand hover:text-tv-brand-hover transition-colors"
        >
          <Monitor size={13} />Video Library
        </button>
      </div>

      {/* ── Main preview area ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-[720px] max-h-[60vh] aspect-[4/3] rounded-lg overflow-hidden bg-[#1a1a2e] relative flex items-center justify-center">

          {/* ── Empty state ── */}
          {!hasAnyVideoElement && (
            <div className="flex flex-col items-center gap-3 px-6 text-center">
              <div className="w-16 h-16 rounded-xl bg-white/[0.07] flex items-center justify-center">
                <Video size={30} className="text-white/30" />
              </div>
              <p className="text-white/80 text-[16px] font-semibold">No Elements Added Yet</p>
              <p className="text-white/40 text-[13px] max-w-[340px]">
                Use the <span className="inline-flex items-center justify-center w-5 h-5 bg-tv-brand-bg rounded-[5px] text-white align-middle mx-0.5"><Plus size={11} /></span> button in the timeline below to start building your video.
              </p>
            </div>
          )}

          {/* ── Has elements, not playing ── */}
          {hasAnyVideoElement && playState === "idle" && (
            <div className="flex flex-col items-center gap-4">
              {/* Play button */}
              <button
                onClick={handlePlay}
                className="w-16 h-16 rounded-full bg-tv-brand-bg border-4 border-white/30 flex items-center justify-center hover:bg-tv-brand-hover hover:scale-105 transition-all shadow-lg"
              >
                <Play size={24} className="text-white ml-1" fill="white" />
              </button>
              <p className="text-white/80 text-[15px] font-semibold">
                {isVideoComplete ? "Your Video is Ready" : "Preview Your Video"}
              </p>
              {/* Element badges */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {activeSegments.map(key => {
                  const def = getSegmentDef(key);
                  const done = isDone(key, doneFlags);
                  return (
                    <div key={key} className="flex items-center gap-1.5 bg-white/10 rounded-full px-2.5 py-1">
                      <def.icon size={10} className="text-white/60" />
                      <span className="text-[10px] text-white/80 font-medium">{def.label.split(" ")[0]}</span>
                      {done && <Check size={9} className="text-tv-success" />}
                    </div>
                  );
                })}
              </div>

              {/* Bottom player controls */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-4 pt-8 pb-3">
                <div className="flex items-center gap-3">
                  <button onClick={handlePlay} className="text-white/70 hover:text-white transition-colors">
                    <Play size={14} fill="currentColor" />
                  </button>
                  <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-tv-brand-bg rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="text-[10px] text-white/50 font-mono shrink-0">{fmtSec(totalDuration)}</span>
                  <button aria-label="Volume" className="text-white/40 hover:text-white/70 transition-colors"><Volume2 size={12} /></button>
                  <button aria-label="Fullscreen" className="text-white/40 hover:text-white/70 transition-colors"><Maximize size={12} /></button>
                </div>
              </div>
            </div>
          )}

          {/* ── Playing ── */}
          {hasAnyVideoElement && playState === "playing" && (
            <div className="absolute inset-0 flex flex-col">
              {/* Simulated video content */}
              <div className="flex-1 flex items-center justify-center relative group">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-tv-brand-bg animate-pulse" />
                  <p className="text-white/60 text-[13px] animate-pulse">Playing preview&hellip;</p>
                </div>
                {/* Pause overlay on hover */}
                <button
                  onClick={handlePause}
                  className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-white/0 group-hover:bg-white/20 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
                    <Pause size={20} className="text-white" />
                  </div>
                </button>
              </div>
              {/* Progress bar */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-4 pt-8 pb-3">
                <div className="flex items-center gap-3">
                  <button onClick={handlePause} className="text-white/70 hover:text-white transition-colors">
                    <Pause size={14} />
                  </button>
                  <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-tv-brand-bg rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="text-[10px] text-white/50 font-mono shrink-0">
                    {fmtSec(Math.round(totalDuration * progress / 100))} / {fmtSec(totalDuration)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── Finished ── */}
          {hasAnyVideoElement && playState === "finished" && (
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={handleReplay}
                className="w-14 h-14 rounded-full bg-white/15 border-2 border-white/30 flex items-center justify-center hover:bg-white/25 transition-colors"
              >
                <RotateCcw size={20} className="text-white" />
              </button>
              <p className="text-white/70 text-[14px] font-semibold">Preview Complete</p>
              {/* Bottom controls */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-4 pt-8 pb-3">
                <div className="flex items-center gap-3">
                  <button onClick={handleReplay} className="text-white/70 hover:text-white transition-colors">
                    <RotateCcw size={14} />
                  </button>
                  <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-tv-brand-bg rounded-full" style={{ width: "100%" }} />
                  </div>
                  <span className="text-[10px] text-white/50 font-mono shrink-0">{fmtSec(totalDuration)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hint text */}
        {hasAnyVideoElement && playState === "idle" && !isVideoComplete && (
          <p className="text-[12px] text-tv-text-secondary mt-3 text-center">
            Click play to watch a preview of your assembled video
          </p>
        )}
      </div>
    </div>
  );
}
