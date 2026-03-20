import { useState } from "react";
import {
  X, Search, Play, Check, ChevronRight, ChevronLeft, ArrowLeft,
  Video, Users,
} from "lucide-react";
import { VideoEditorView } from "./VideoEditorView";
import { VideoRecorder } from "./VideoRecorder";
import { PICKER_VIDEOS, type PickerVideo } from "./types";

// re-export for consumers
export { VideoEditorView };
export { PICKER_VIDEOS };
export type { PickerVideo };

// ═══════════════════════════════════════════════════════════════════════════════
//  VideoPickerView — inline full-area view for selecting an existing video
//  Now routes through VideoEditorView before completing the selection.
// ═══════════════════════════════════════════════════════════════════════════════
export function VideoPickerView({ onBack, onSelect }: { onBack: () => void; onSelect: (v: PickerVideo) => void }) {
  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [editorVideo, setEditorVideo] = useState<PickerVideo | null>(null);
  const filtered = PICKER_VIDEOS.filter(v => v.title.toLowerCase().includes(search.toLowerCase()));

  /* If a video is selected, show the editor instead of the grid */
  if (editorVideo) {
    return (
      <VideoEditorView
        video={editorVideo}
        onCancel={() => setEditorVideo(null)}
        onSave={(v) => onSelect(v)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-2.5 border-b border-tv-border-divider shrink-0">
        <button onClick={onBack} className="w-7 h-7 rounded-full bg-tv-surface flex items-center justify-center text-tv-text-secondary hover:bg-tv-surface-hover transition-colors shrink-0">
          <ArrowLeft size={13} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-[15px] font-black text-tv-text-primary">Select from Library</h2>
          <p className="text-[11px] text-tv-text-secondary">Choose a video from your library to attach.</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 py-3 border-b border-tv-border-divider shrink-0">
        <div className="flex items-center gap-2 bg-tv-surface rounded-full px-3.5 py-2 border border-tv-border-light max-w-sm">
          <Search size={13} className="text-tv-text-secondary" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search your videos&hellip;" className="bg-transparent text-[12px] outline-none flex-1 placeholder:text-tv-text-decorative" />
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 bg-tv-brand-tint rounded-full flex items-center justify-center"><Video size={20} className="text-tv-text-decorative" /></div>
            <p className="text-[13px] text-tv-text-secondary">No videos match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-3xl">
            {filtered.map(v => (
              <button
                key={v.id}
                onClick={() => setEditorVideo(v)}
                onMouseEnter={() => setHoveredId(v.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="rounded-lg overflow-hidden border border-tv-border-light hover:border-tv-brand-bg hover:shadow-lg transition-all text-left group"
              >
                <div className={`aspect-[4/3] bg-gradient-to-br ${v.color} flex items-center justify-center relative`}>
                  <div className={`w-9 h-9 rounded-full bg-white/20 border-2 border-white/60 flex items-center justify-center transition-transform ${hoveredId === v.id ? "scale-110" : ""}`}>
                    <Play size={14} className="text-white ml-0.5" fill="white" />
                  </div>
                  <span className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">{v.duration}</span>
                  {hoveredId === v.id && (
                    <div className="absolute inset-0 bg-tv-brand-bg/15 flex items-center justify-center">
                      <span className="bg-white text-tv-brand text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-md inline-flex items-center gap-1 whitespace-nowrap"><Check size={11} strokeWidth={3} />Use this video</span>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-white">
                  <p className="text-[12px] font-semibold text-tv-text-primary truncate">{v.title}</p>
                  <p className="text-[10px] text-tv-text-secondary mt-0.5">{v.date} &middot; {v.duration}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-tv-border-divider bg-tv-surface-muted shrink-0 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-tv-text-secondary border border-tv-border-light rounded-full hover:bg-tv-surface transition-colors">
          <ChevronLeft size={12} />Back
        </button>
        <p className="text-[10px] text-tv-text-secondary">
          Click any video above to attach it.
        </p>
      </div>
    </div>
  );
}

// ── Assigned video chip ───────────────────────────────────────────────────────
export function AssignedVideoChip({ video, onRemove }: { video: PickerVideo; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-tv-brand-tint border border-tv-border-strong rounded-lg">
      <div className={`w-10 h-7 rounded-sm bg-gradient-to-br ${video.color} flex items-center justify-center shrink-0`}>
        <Play size={10} className="text-white ml-0.5" fill="white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-tv-text-primary truncate">{video.title}</p>
        <p className="text-[10px] text-tv-text-secondary">{video.duration}</p>
      </div>
      <button onClick={onRemove} aria-label="Remove" className="w-5 h-5 rounded-full bg-white border border-tv-border-light flex items-center justify-center text-tv-text-secondary hover:text-tv-danger hover:border-tv-danger-border transition-colors shrink-0"><X size={10} /></button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  VideoCreateView — inline full-area view for recording / uploading a video
//  Now delegates to the shared VideoRecorder component, then routes through
//  VideoEditorView before completing.
// ═══════════════════════════════════════════════════════════════════════════════
export function VideoCreateView({
  onBack,
  onSave,
}: {
  onBack: () => void;
  onSave: (v: PickerVideo) => void;
}) {
  const [editorVideo, setEditorVideo] = useState<PickerVideo | null>(null);

  if (editorVideo) {
    return (
      <VideoEditorView
        video={editorVideo}
        onCancel={onBack}
        onSave={(v) => onSave(v)}
      />
    );
  }

  return (
    <VideoRecorder
      title="Record or Upload"
      subtitle="This clip will appear in every constituent's final video"
      contextLabel="Shared Video"
      contextSublabel="Same for all recipients"
      contextIcon={<Users size={10} />}
      maxDuration={120}
      onComplete={(result) => setEditorVideo(result.video)}
      onCancel={onBack}
      onEditVideo={(v) => setEditorVideo(v)}
    />
  );
}
