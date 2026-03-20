/**
 * VideoRecorder — Self-contained video acquisition component.
 *
 * Capabilities: Record (via RecordingStudio), Upload (drag-drop), Library pick.
 *
 * Layout:
 *   Header:  Title + context badge + close
 *   Body:    Left sidebar (source tabs + settings) + Right content (studio / dropzone / grid / preview)
 *   Footer:  Back + Use This Video
 *
 * After a video is acquired (any source), an inline preview card is shown.
 * The caller can then route to VideoEditorView externally, or the component
 * can auto-enter the editor when `autoEditAfterCapture` is true.
 */
import { useState, useCallback } from "react";
import {
  Video, Upload, Camera, Lightbulb, Volume2, Clock,
  Check, Trash2, Play, Pause, FileText, Pencil,
  ChevronRight, Users, UploadCloud, RefreshCw, ScrollText, X,
} from "lucide-react";
import { RecordingStudio } from "./RecordingStudio";
import { PICKER_VIDEOS, type PickerVideo } from "./types";

// ═════════════════════════════════════════════════════════════════════════════
//  Types
// ═════════════════════════════════════════════════════════════════════════════

type SourceTab = "record" | "upload" | "library";

type ContentState =
  | "empty"       // nothing acquired yet — show placeholder
  | "studio"      // RecordingStudio is inline
  | "preview";    // acquired — show preview card

export interface VideoRecorderResult {
  video: PickerVideo;
  source: "recorded" | "uploaded" | "library";
}

export interface VideoRecorderProps {
  /** Header title */
  title?: string;
  /** Header subtitle */
  subtitle?: string;
  /** Context badge (e.g. "Same video for everyone") */
  badgeLabel?: string;
  badgeIcon?: typeof Users;
  /** Context shown on the RecordingStudio viewfinder */
  contextLabel?: string;
  contextSublabel?: string;
  contextIcon?: React.ReactNode;
  /** Max recording duration in seconds (default 120) */
  maxDuration?: number;
  /** Library subset to show — defaults to PICKER_VIDEOS.slice(0, 6) */
  libraryVideos?: PickerVideo[];
  /** Called when user clicks "Use This Video" */
  onComplete: (result: VideoRecorderResult) => void;
  /** Called when user clicks Back / Cancel */
  onCancel: () => void;
  /** Open full library view (optional) */
  onOpenLibrary?: () => void;
  /** Called when user clicks "Edit" on preview — lets parent route to editor */
  onEditVideo?: (video: PickerVideo) => void;
}

// ═════════════════════════════════════════════════════════════════════════════
//  Constants
// ═════════════════════════════════════════════════════════════════════════════

const DEFAULT_LIBRARY = PICKER_VIDEOS.slice(0, 6);

const LibraryIcon = Video; // alias since lucide doesn't export "Library"

const SOURCE_TABS: { id: SourceTab; label: string; icon: typeof Video }[] = [
  { id: "record",  label: "Record",  icon: Camera },
  { id: "upload",  label: "Upload",  icon: Upload },
  { id: "library", label: "Library", icon: LibraryIcon },
];

// ═════════════════════════════════════════════════════════════════════════════
//  VideoRecorder
// ═════════════════════════════════════════════════════════════════════════════

export function VideoRecorder({
  title = "Record or Upload Video",
  subtitle = "Record, upload, or pick from your library",
  badgeLabel,
  badgeIcon: BadgeIcon,
  contextLabel,
  contextSublabel,
  contextIcon,
  maxDuration = 120,
  libraryVideos = DEFAULT_LIBRARY,
  onComplete,
  onCancel,
  onOpenLibrary,
  onEditVideo,
}: VideoRecorderProps) {
  // ── Source state ──
  const [tab, setTab] = useState<SourceTab>("record");
  const [content, setContent] = useState<ContentState>("studio");

  // ── Record result ──
  const [recordedDuration, setRecordedDuration] = useState<string | null>(null);

  // ── Upload result ──
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploadDragging, setUploadDragging] = useState(false);

  // ── Library selection ──
  const [selectedLibVideo, setSelectedLibVideo] = useState<PickerVideo | null>(null);

  // ── Preview state ──
  const [playing, setPlaying] = useState(false);

  // ── Script / teleprompter (lifted so it appears in sidebar, passed to RecordingStudio) ──
  const [scriptText, setScriptText] = useState("");
  const [scriptVisible, setScriptVisible] = useState(true);

  const scriptWordCount = scriptText.trim() ? scriptText.trim().split(/\s+/).length : 0;
  const scriptReadTime = Math.round(scriptWordCount / 2.5);
  const hasScript = scriptText.trim().length > 0;

  // ── Derived: active video for preview ──
  const getActiveVideo = useCallback((): PickerVideo | null => {
    if (tab === "record" && recordedDuration) {
      return { id: 999, title: "New Recording", duration: recordedDuration, date: "Just now", color: "from-[#166534] to-[#15803d]" };
    }
    if (tab === "upload" && uploadedFile) {
      return { id: 998, title: uploadedFile, duration: "1:00", date: "Just now", color: "from-[#007c9e] to-[#00C0F5]" };
    }
    if (tab === "library" && selectedLibVideo) return selectedLibVideo;
    return null;
  }, [tab, recordedDuration, uploadedFile, selectedLibVideo]);

  const isReady = getActiveVideo() !== null;

  // ── Handlers ──

  const handleRecordingComplete = useCallback((result: { duration: string; seconds: number }) => {
    setRecordedDuration(result.duration);
    setContent("preview");
  }, []);

  const handleUpload = useCallback(() => {
    const mockFileName = "video-upload-2026-03-16.mp4";
    setUploadedFile(mockFileName);
    setContent("preview");
  }, []);

  const handleLibrarySelect = useCallback((v: PickerVideo) => {
    setSelectedLibVideo(v);
    setContent("preview");
  }, []);

  const handleUseVideo = useCallback(() => {
    const vid = getActiveVideo();
    if (!vid) return;
    const source = tab === "record" ? "recorded" as const : tab === "upload" ? "uploaded" as const : "library" as const;
    onComplete({ video: vid, source });
  }, [getActiveVideo, tab, onComplete]);

  const handleEdit = useCallback(() => {
    const vid = getActiveVideo();
    if (vid && onEditVideo) onEditVideo(vid);
  }, [getActiveVideo, onEditVideo]);

  const handleReRecord = useCallback(() => {
    setRecordedDuration(null);
    setContent("studio");
  }, []);

  const handleDeleteRecording = useCallback(() => {
    setRecordedDuration(null);
    setContent("empty");
  }, []);

  const handleRemoveUpload = useCallback(() => {
    setUploadedFile(null);
    setContent("empty");
  }, []);

  const switchTab = useCallback((t: SourceTab) => {
    setTab(t);
    if (t === "record") setContent(recordedDuration ? "preview" : "studio");
    else if (t === "upload") setContent(uploadedFile ? "preview" : "empty");
    else if (t === "library") setContent(selectedLibVideo ? "preview" : "empty");
  }, [recordedDuration, uploadedFile, selectedLibVideo]);

  // ═════════════════════════════════════════════════════════════════════════
  //  Render
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col h-full flex-1 min-h-0">

      {/* ══ Header ══ */}
      <div className="px-4 py-2 border-b border-tv-border-divider shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-sm bg-tv-success-bg flex items-center justify-center shrink-0">
            <Video size={13} className="text-tv-success" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[14px] font-black text-tv-text-primary">{title}</h2>
            <p className="text-[11px] text-tv-text-secondary">{subtitle}</p>
          </div>
          {badgeLabel && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-tv-success-bg border border-tv-success-border rounded-full text-[9px] text-tv-success font-medium shrink-0">
              {BadgeIcon && <BadgeIcon size={9} />}{badgeLabel}
            </span>
          )}
        </div>
      </div>

      {/* ══ Body: Sidebar + Content ══ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left Sidebar ── */}
        <div className="w-[300px] shrink-0 border-r border-tv-border-divider flex flex-col bg-white">

          {/* Tab bar */}
          <div className="flex border-b border-tv-border-divider shrink-0">
            {SOURCE_TABS.map(t => (
              <button
                key={t.id}
                onClick={() => switchTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium transition-colors border-b-2 ${
                  tab === t.id
                    ? "border-tv-brand-bg text-tv-brand"
                    : "border-transparent text-tv-text-secondary hover:text-tv-text-primary"
                }`}
              >
                <t.icon size={12} />{t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">

            {/* ─── Record tab ─── */}
            {tab === "record" && (
              <>
                {!recordedDuration ? (
                  <div className="bg-tv-surface rounded-lg p-3.5 space-y-2.5">
                    <p className="text-[11px] font-semibold text-tv-text-primary flex items-center gap-1.5">
                      <Lightbulb size={12} className="text-tv-warning" />Recording Tips
                    </p>
                    {[
                      { icon: Camera, text: "Look directly at the camera" },
                      { icon: Lightbulb, text: "Ensure good, even lighting" },
                      { icon: Volume2, text: "Find a quiet environment" },
                      { icon: Clock, text: "Keep it concise (under 2 min)" },
                    ].map((tip, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <tip.icon size={10} className="text-tv-text-secondary mt-0.5 shrink-0" />
                        <span className="text-[10px] text-tv-text-secondary">{tip.text}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-tv-success-bg border border-tv-success-border rounded-lg p-3.5 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-tv-success flex items-center justify-center">
                        <Check size={11} className="text-white" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-tv-text-primary">Recording Complete</p>
                        <p className="text-[10px] text-tv-text-secondary">Duration: {recordedDuration}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={handleReRecord}
                        className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-medium text-tv-text-secondary border border-tv-border-light rounded-full hover:bg-tv-surface transition-colors">
                        <RefreshCw size={9} />Re-record
                      </button>
                      <button onClick={handleDeleteRecording}
                        className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-medium text-tv-danger border border-tv-danger-border rounded-full hover:bg-tv-danger-bg transition-colors">
                        <Trash2 size={9} />Delete
                      </button>
                    </div>
                  </div>
                )}

                {/* Script / teleprompter */}
                <div className="bg-[#f8f6fc] border border-tv-border-light rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3.5 py-2 border-b border-tv-border-divider">
                    <span className="text-[11px] font-semibold text-tv-text-primary flex items-center gap-1.5">
                      <ScrollText size={11} className="text-tv-brand" />Script
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <span className="text-[9px] text-tv-text-secondary">Show on screen</span>
                      <button
                        onClick={() => setScriptVisible(!scriptVisible)}
                        className={`relative w-8 h-[18px] rounded-full transition-colors ${scriptVisible ? "bg-tv-brand-bg" : "bg-tv-border-light"}`}
                      >
                        <span className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform ${scriptVisible ? "left-[16px]" : "left-[2px]"}`} />
                      </button>
                    </label>
                  </div>
                  <div className="px-3.5 py-2.5">
                    <textarea
                      value={scriptText}
                      onChange={e => setScriptText(e.target.value)}
                      rows={4}
                      placeholder="Type or paste your script here…"
                      className="w-full bg-white border border-tv-border-light rounded-sm px-2.5 py-2 text-[11px] text-tv-text-primary placeholder:text-tv-text-decorative resize-none focus:outline-none focus:border-tv-brand-bg/40 transition-colors"
                    />
                  </div>
                  <div className="flex items-center justify-between px-3.5 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-tv-text-secondary">
                        {scriptWordCount} word{scriptWordCount !== 1 ? "s" : ""}
                      </span>
                      <span className="text-[9px] text-tv-text-decorative">&middot;</span>
                      <span className="text-[9px] text-tv-text-secondary">~{scriptReadTime}s read</span>
                    </div>
                    {hasScript && (
                      <button onClick={() => setScriptText("")}
                        className="flex items-center gap-0.5 text-[9px] text-tv-brand hover:text-tv-brand-hover transition-colors">
                        <X size={8} />Clear
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ─── Upload tab ─── */}
            {tab === "upload" && (
              <>
                {!uploadedFile ? (
                  <>
                    <div className="bg-tv-surface rounded-lg p-3.5 space-y-2">
                      <p className="text-[11px] font-semibold text-tv-text-primary flex items-center gap-1.5">
                        <FileText size={12} className="text-tv-brand" />Accepted Formats
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {["MP4", "MOV", "WebM"].map(fmt => (
                          <span key={fmt} className="px-2 py-0.5 bg-white border border-tv-border-light rounded text-[9px] text-tv-text-secondary font-medium">{fmt}</span>
                        ))}
                      </div>
                      <p className="text-[9px] text-tv-text-decorative">Max file size: 500 MB</p>
                    </div>
                    <div
                      onDragOver={e => { e.preventDefault(); setUploadDragging(true); }}
                      onDragLeave={() => setUploadDragging(false)}
                      onDrop={e => { e.preventDefault(); setUploadDragging(false); handleUpload(); }}
                      onClick={handleUpload}
                      className={`cursor-pointer border-2 border-dashed rounded-lg p-6 flex flex-col items-center gap-2 text-center transition-colors ${
                        uploadDragging
                          ? "border-tv-brand-bg bg-tv-brand-tint/30"
                          : "border-tv-border-light hover:border-tv-brand-bg/50 hover:bg-tv-surface"
                      }`}
                    >
                      <UploadCloud size={24} className={uploadDragging ? "text-tv-brand" : "text-tv-text-decorative"} />
                      <p className="text-[11px] text-tv-text-secondary">
                        Drag & drop or <span className="text-tv-brand font-medium">browse</span>
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="bg-tv-info-bg border border-tv-info-border rounded-lg p-3.5 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-tv-info flex items-center justify-center">
                        <Check size={11} className="text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-tv-text-primary">File Uploaded</p>
                        <p className="text-[10px] text-tv-text-secondary truncate">{uploadedFile}</p>
                      </div>
                    </div>
                    <button onClick={handleRemoveUpload}
                      className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-medium text-tv-danger border border-tv-danger-border rounded-full hover:bg-tv-danger-bg transition-colors">
                      <Trash2 size={9} />Remove
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ─── Library tab ─── */}
            {tab === "library" && (
              <>
                <div className="space-y-2">
                  {libraryVideos.map(v => {
                    const selected = selectedLibVideo?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => handleLibrarySelect(v)}
                        className={`w-full flex items-center gap-2.5 p-2.5 rounded-md border transition-all text-left ${
                          selected
                            ? "border-tv-brand-bg bg-tv-brand-tint/40"
                            : "border-tv-border-light hover:border-tv-border-strong hover:bg-tv-surface"
                        }`}
                      >
                        <div className={`w-12 h-9 rounded-sm bg-gradient-to-br ${v.color} flex items-center justify-center shrink-0 relative`}>
                          <Play size={10} className="text-white/80" />
                          {selected && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-tv-brand-bg flex items-center justify-center">
                              <Check size={8} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-tv-text-primary truncate">{v.title}</p>
                          <p className="text-[9px] text-tv-text-secondary">{v.duration} &middot; {v.date}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {onOpenLibrary && (
                  <button onClick={onOpenLibrary}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] font-medium text-tv-brand hover:text-tv-brand-hover transition-colors">
                    Open Full Library <ChevronRight size={11} />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Sidebar bottom */}
          <div className="p-4 border-t border-tv-border-divider shrink-0">
            <button
              onClick={handleUseVideo}
              disabled={!isReady}
              className={`w-full flex items-center justify-center gap-1 py-2 text-[11px] font-semibold rounded-full transition-colors ${
                isReady
                  ? "bg-tv-success text-white hover:bg-tv-success-hover"
                  : "bg-tv-surface text-tv-text-decorative cursor-not-allowed"
              }`}
            >
              <Check size={11} />Use This Video
            </button>
          </div>
        </div>

        {/* ── Right Content Area ── */}
        <div className="flex-1 min-w-0 overflow-y-auto bg-tv-surface-muted">

          {/* ── Empty: Record ── */}
          {tab === "record" && content === "empty" && (
            <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-tv-surface flex items-center justify-center">
                <Camera size={30} className="text-tv-text-decorative" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-tv-text-primary">Ready to Record</p>
                <p className="text-[12px] text-tv-text-secondary mt-1">Click below to open the recording studio.</p>
              </div>
              <button onClick={() => setContent("studio")}
                className="flex items-center gap-2 px-6 py-2.5 text-[13px] font-semibold text-white bg-[#007c9e] rounded-full hover:bg-[#005d77] transition-colors shadow-lg shadow-[#007c9e]/15">
                <Camera size={14} />Record Video
              </button>
            </div>
          )}

          {/* ── Studio ── */}
          {tab === "record" && content === "studio" && (
            <div className="p-6 flex items-start justify-center">
              <RecordingStudio
                contextLabel={contextLabel}
                contextSublabel={contextSublabel}
                contextIcon={contextIcon}
                onRecordingComplete={handleRecordingComplete}
                onClose={() => setContent("empty")}
                maxDuration={maxDuration}
                scriptText={scriptText}
                scriptVisible={scriptVisible}
                hideBuiltInScript
              />
            </div>
          )}

          {/* ── Empty: Upload ── */}
          {tab === "upload" && content === "empty" && (
            <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-tv-surface flex items-center justify-center">
                <UploadCloud size={30} className="text-tv-text-decorative" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-tv-text-primary">Upload a Video</p>
                <p className="text-[12px] text-tv-text-secondary mt-1">Use the sidebar to upload an MP4, MOV, or WebM file.</p>
              </div>
            </div>
          )}

          {/* ── Empty: Library ── */}
          {tab === "library" && content === "empty" && (
            <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-tv-surface flex items-center justify-center">
                <Video size={30} className="text-tv-text-decorative" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-tv-text-primary">Select from Library</p>
                <p className="text-[12px] text-tv-text-secondary mt-1">Choose a video from the sidebar to preview it here.</p>
              </div>
            </div>
          )}

          {/* ── Preview card (any source) ── */}
          {content === "preview" && getActiveVideo() && (
            <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
              <PreviewCard
                video={getActiveVideo()!}
                statusLabel={
                  tab === "record" ? "Recorded" :
                  tab === "upload" ? "Uploaded" : "Selected from Library"
                }
                playing={playing}
                onTogglePlay={() => setPlaying(!playing)}
                onEdit={onEditVideo ? handleEdit : undefined}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Preview Card ─────────────────────────────────────────────────────────────
function PreviewCard({
  video,
  statusLabel,
  playing,
  onTogglePlay,
  onEdit,
}: {
  video: PickerVideo;
  statusLabel: string;
  playing: boolean;
  onTogglePlay: () => void;
  onEdit?: () => void;
}) {
  return (
    <div className="w-full max-w-[560px] space-y-3">
      <div
        className={`relative aspect-[4/3] max-h-[50vh] bg-gradient-to-br ${video.color} rounded-[14px] overflow-hidden flex items-center justify-center group cursor-pointer`}
        onClick={onTogglePlay}
      >
        <div className={`w-14 h-14 rounded-full bg-black/30 flex items-center justify-center backdrop-blur-sm transition-opacity ${playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}>
          {playing ? <Pause size={22} className="text-white" /> : <Play size={22} className="text-white ml-0.5" />}
        </div>
        <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/50 rounded text-[10px] text-white/90 font-mono backdrop-blur-sm">
          {video.duration}
        </div>
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-black/40 rounded-full backdrop-blur-sm">
          <Check size={9} className="text-tv-success" />
          <span className="text-[9px] text-white/80 font-medium">{statusLabel}</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-semibold text-tv-text-primary">{video.title}</p>
          <p className="text-[10px] text-tv-text-secondary">{video.duration} &middot; {video.date}</p>
        </div>
        {onEdit && (
          <button onClick={onEdit}
            className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium text-tv-brand border border-tv-border-light rounded-full hover:border-tv-brand-bg/40 hover:bg-tv-brand-tint/40 transition-colors">
            <Pencil size={10} />Edit
          </button>
        )}
      </div>
    </div>
  );
}
