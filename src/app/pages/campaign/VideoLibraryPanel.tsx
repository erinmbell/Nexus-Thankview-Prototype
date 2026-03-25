import { useState, useMemo, useCallback } from "react";
import {
  ArrowLeft, Search, Grid3X3, List, FolderOpen, ChevronDown,
  Play, Clock, Trash2, Download, Edit2, Info, Check, X,
  Heart, Copy,
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { FocusTrap } from "@mantine/core";
import { VideoEditorModal } from "./VideoEditorModal";

// ── Types ────────────────────────────────────────────────────────────────────
export interface LibraryVideo {
  id: number;
  name: string;
  folder: string;
  duration: string;
  createdAt: string;
  color: string;
  favorite: boolean;
}

export interface VideoLibraryProps {
  pickMode?: boolean;
  onBack: () => void;
  onSelectVideo?: (video: LibraryVideo) => void;
}

// ── Constants ────────────────────────────────────────────────────────────────
const FOLDERS = ["All Folders", "Campaign Videos", "Personalized", "Intros", "Outros", "Replies", "Drafts", "Archive"];
type SortKey = "newest" | "oldest" | "name-az" | "name-za" | "duration";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest",   label: "Newest" },
  { key: "oldest",   label: "Oldest" },
  { key: "name-az",  label: "Name A\u2192Z" },
  { key: "name-za",  label: "Name Z\u2192A" },
  { key: "duration", label: "Duration" },
];

const PREVIEW_COLORS = [
  "#6c3fc5", "#2563eb", "#0891b2", "#16a34a", "#d97706",
  "#dc2626", "#db2777", "#7c3aed", "#0d9488", "#ea580c",
  "#4f46e5", "#059669", "#b91c1c",
];

const INITIAL_VIDEOS: LibraryVideo[] = [
  { id: 1,  name: "Spring Appeal 2026",       folder: "Campaign Videos", duration: "1:42", createdAt: "Mar 12, 2026", color: PREVIEW_COLORS[0],  favorite: true },
  { id: 2,  name: "Scholarship Thank You",    folder: "Campaign Videos", duration: "2:15", createdAt: "Mar 10, 2026", color: PREVIEW_COLORS[1],  favorite: false },
  { id: 3,  name: "Year-End Giving",          folder: "Campaign Videos", duration: "1:58", createdAt: "Mar 8, 2026",  color: PREVIEW_COLORS[2],  favorite: false },
  { id: 4,  name: "Donor Spotlight \u2014 Sarah",    folder: "Personalized",    duration: "0:48", createdAt: "Mar 7, 2026",  color: PREVIEW_COLORS[3],  favorite: true },
  { id: 5,  name: "Donor Spotlight \u2014 James",    folder: "Personalized",    duration: "0:52", createdAt: "Mar 6, 2026",  color: PREVIEW_COLORS[4],  favorite: false },
  { id: 6,  name: "Welcome Intro",            folder: "Intros",          duration: "0:15", createdAt: "Mar 5, 2026",  color: PREVIEW_COLORS[5],  favorite: false },
  { id: 7,  name: "Branded Intro \u2014 Blue",      folder: "Intros",          duration: "0:12", createdAt: "Mar 4, 2026",  color: PREVIEW_COLORS[6],  favorite: true },
  { id: 8,  name: "Thank You Outro",          folder: "Outros",          duration: "0:18", createdAt: "Mar 3, 2026",  color: PREVIEW_COLORS[7],  favorite: false },
  { id: 9,  name: "CTA Outro \u2014 Donate",       folder: "Outros",          duration: "0:22", createdAt: "Mar 2, 2026",  color: PREVIEW_COLORS[8],  favorite: false },
  { id: 10, name: "Alumni Reply Compilation",  folder: "Replies",         duration: "3:05", createdAt: "Feb 28, 2026", color: PREVIEW_COLORS[9],  favorite: false },
  { id: 11, name: "Student Reply \u2014 Ava",       folder: "Replies",         duration: "1:10", createdAt: "Feb 26, 2026", color: PREVIEW_COLORS[10], favorite: true },
  { id: 12, name: "Impact Update Q1",         folder: "Campaign Videos", duration: "2:30", createdAt: "Feb 20, 2026", color: PREVIEW_COLORS[11], favorite: false },
  { id: 13, name: "Campus Tour Highlight",     folder: "Personalized",    duration: "1:35", createdAt: "Feb 15, 2026", color: PREVIEW_COLORS[12], favorite: false },
];

function parseDurationToSec(d: string): number {
  const [m, s] = d.split(":").map(Number);
  return (m || 0) * 60 + (s || 0);
}

// ── Component ────────────────────────────────────────────────────────────────
export function VideoLibrary({ pickMode = false, onBack, onSelectVideo }: VideoLibraryProps) {
  const { show } = useToast();

  // state
  const [videos, setVideos] = useState<LibraryVideo[]>(INITIAL_VIDEOS);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [folder, setFolder] = useState("All Folders");
  const [sort, setSort] = useState<SortKey>("newest");
  const [favOnly, setFavOnly] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LibraryVideo | null>(null);
  const [editTarget, setEditTarget] = useState<LibraryVideo | null>(null);

  // filtered + sorted list
  const filtered = useMemo(() => {
    let list = videos.filter(v => {
      if (folder !== "All Folders" && v.folder !== folder) return false;
      if (favOnly && !v.favorite) return false;
      if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "newest":  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "name-az": return a.name.localeCompare(b.name);
        case "name-za": return b.name.localeCompare(a.name);
        case "duration": return parseDurationToSec(a.duration) - parseDurationToSec(b.duration);
        default: return 0;
      }
    });
    return list;
  }, [videos, folder, sort, favOnly, search]);

  const toggleFavorite = useCallback((id: number) => {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, favorite: !v.favorite } : v));
  }, []);

  const duplicateVideo = useCallback((v: LibraryVideo) => {
    const copy: LibraryVideo = { ...v, id: Date.now(), name: `${v.name} (Copy)`, favorite: false, createdAt: "Mar 18, 2026" };
    setVideos(prev => [copy, ...prev]);
    show("Video duplicated", "success");
  }, [show]);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    setVideos(prev => prev.filter(v => v.id !== deleteTarget.id));
    show(`"${deleteTarget.name}" deleted`, "success");
    setDeleteTarget(null);
  }, [deleteTarget, show]);

  const handleEditorSave = useCallback(() => {
    show("Video saved", "success");
    setEditTarget(null);
  }, [show]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-tv-surface-muted">
      {/* Header */}
      <div className="shrink-0 bg-white border-b border-tv-border-light px-6 py-4">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={onBack} className="p-1.5 -ml-1.5 rounded-lg hover:bg-tv-surface-hover transition-colors">
            <ArrowLeft size={18} className="text-tv-text-secondary" />
          </button>
          <h1 className="text-[20px] text-tv-text-primary font-display" style={{ fontWeight: 800 }}>Video Library</h1>
        </div>

        {pickMode && (
          <div className="flex items-center gap-2 mt-3 px-3 py-2.5 bg-tv-brand-tint border border-tv-brand-bg/20 rounded-md">
            <Info size={14} className="text-tv-brand shrink-0" />
            <p className="text-[12px] text-tv-brand" style={{ fontWeight: 500 }}>Select a video to use in your campaign</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="shrink-0 bg-white border-b border-tv-border-light px-6 py-3 flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tv-text-tertiary" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search videos\u2026"
            className="w-full pl-9 pr-3 py-2 text-[12px] border border-tv-border-light rounded-sm outline-none focus:ring-2 focus:ring-tv-brand-bg/20 bg-tv-surface-muted"
          />
        </div>

        {/* Grid / List toggle */}
        <div className="flex border border-tv-border-light rounded-sm overflow-hidden">
          {(["grid", "list"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`p-2 transition-colors ${view === v ? "bg-tv-brand-bg text-white" : "text-tv-text-secondary hover:bg-tv-surface-hover"}`}>
              {v === "grid" ? <Grid3X3 size={14} /> : <List size={14} />}
            </button>
          ))}
        </div>

        {/* Folder dropdown */}
        <div className="relative">
          <button onClick={() => { setFolderOpen(!folderOpen); setSortOpen(false); }}
            className="flex items-center gap-1.5 px-3 py-2 text-[12px] border border-tv-border-light rounded-sm hover:bg-tv-surface-hover transition-colors text-tv-text-primary">
            <FolderOpen size={13} className="text-tv-text-tertiary" />
            <span style={{ fontWeight: 500 }}>{folder}</span>
            <ChevronDown size={12} className="text-tv-text-tertiary" />
          </button>
          {folderOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md border border-tv-border-light shadow-xl z-50 py-1">
              {FOLDERS.map(f => (
                <button key={f} onClick={() => { setFolder(f); setFolderOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-[12px] transition-colors hover:bg-tv-surface-hover flex items-center justify-between ${folder === f ? "text-tv-brand" : "text-tv-text-primary"}`}>
                  <span style={{ fontWeight: folder === f ? 600 : 400 }}>{f}</span>
                  {folder === f && <Check size={13} className="text-tv-brand" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <button onClick={() => { setSortOpen(!sortOpen); setFolderOpen(false); }}
            className="flex items-center gap-1.5 px-3 py-2 text-[12px] border border-tv-border-light rounded-sm hover:bg-tv-surface-hover transition-colors text-tv-text-primary">
            <Clock size={13} className="text-tv-text-tertiary" />
            <span style={{ fontWeight: 500 }}>{SORT_OPTIONS.find(s => s.key === sort)?.label}</span>
            <ChevronDown size={12} className="text-tv-text-tertiary" />
          </button>
          {sortOpen && (
            <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-md border border-tv-border-light shadow-xl z-50 py-1">
              {SORT_OPTIONS.map(s => (
                <button key={s.key} onClick={() => { setSort(s.key); setSortOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-[12px] transition-colors hover:bg-tv-surface-hover flex items-center justify-between ${sort === s.key ? "text-tv-brand" : "text-tv-text-primary"}`}>
                  <span style={{ fontWeight: sort === s.key ? 600 : 400 }}>{s.label}</span>
                  {sort === s.key && <Check size={13} className="text-tv-brand" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Favorites chip */}
        <button onClick={() => setFavOnly(!favOnly)}
          className={`flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-sm border transition-colors ${favOnly ? "bg-tv-brand-bg text-white border-tv-brand-bg" : "border-tv-border-light text-tv-text-secondary hover:bg-tv-surface-hover"}`}>
          <Heart size={13} fill={favOnly ? "currentColor" : "none"} />
          <span style={{ fontWeight: 500 }}>Favorites</span>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen size={36} className="text-tv-text-tertiary mb-3" />
            <p className="text-[14px] text-tv-text-secondary" style={{ fontWeight: 600 }}>No videos found</p>
            <p className="text-[12px] text-tv-text-tertiary mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : view === "grid" ? (
          /* ── Grid View ── */
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(v => (
              <div key={v.id} className="group bg-white rounded-lg border border-tv-border-light shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Preview area */}
                <div className="relative aspect-video flex items-center justify-center" style={{ backgroundColor: v.color }}>
                  <Play size={28} className="text-white/70 group-hover:text-white transition-colors" />
                  {/* Duration badge */}
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white tabular-nums" style={{ fontWeight: 500 }}>
                    {v.duration}
                  </span>
                  {/* Favorite indicator */}
                  {v.favorite && (
                    <Heart size={13} className="absolute top-2 right-2 text-white" fill="currentColor" />
                  )}
                  {/* Hover actions overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {pickMode ? (
                      <button onClick={() => onSelectVideo?.(v)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-tv-brand-bg text-white text-[11px] rounded-sm hover:bg-tv-brand-bg/90 transition-colors" style={{ fontWeight: 600 }}>
                        <Check size={13} /> Use This Video
                      </button>
                    ) : (
                      <>
                        <button onClick={() => toggleFavorite(v.id)} className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors" title="Favorite">
                          <Heart size={14} className={v.favorite ? "text-tv-danger" : "text-tv-text-secondary"} fill={v.favorite ? "currentColor" : "none"} />
                        </button>
                        <button onClick={() => setEditTarget(v)} className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors" title="Edit">
                          <Edit2 size={14} className="text-tv-text-secondary" />
                        </button>
                        <button onClick={() => show("Download started", "success")} className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors" title="Download">
                          <Download size={14} className="text-tv-text-secondary" />
                        </button>
                        <button onClick={() => duplicateVideo(v)} className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors" title="Duplicate">
                          <Copy size={14} className="text-tv-text-secondary" />
                        </button>
                        <button onClick={() => setDeleteTarget(v)} className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors" title="Delete">
                          <Trash2 size={14} className="text-tv-danger" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {/* Card info */}
                <div className="px-3 py-2.5">
                  <p className="text-[13px] text-tv-text-primary truncate" style={{ fontWeight: 600 }}>{v.name}</p>
                  <p className="text-[11px] text-tv-text-tertiary mt-0.5">{v.folder} &middot; {v.createdAt}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── List View ── */
          <div className="bg-white rounded-lg border border-tv-border-light shadow-sm overflow-hidden">
            <table className="w-full text-left" aria-label="Video library">
              <thead>
                <tr className="border-b border-tv-border-light bg-tv-surface-muted">
                  {["Name", "Folder", "Duration", "Created", "Actions"].map(h => (
                    <th scope="col" key={h} className="px-4 py-2.5 text-[11px] text-tv-text-tertiary uppercase tracking-wide" style={{ fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => (
                  <tr key={v.id} className="border-b border-tv-border-light last:border-b-0 hover:bg-tv-surface-hover/50 transition-colors group">
                    <td className="px-4 py-3 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: v.color }}>
                        <Play size={12} className="text-white" />
                      </div>
                      <span className="text-[13px] text-tv-text-primary truncate" style={{ fontWeight: 500 }}>{v.name}</span>
                      {v.favorite && <Heart size={11} className="text-tv-danger shrink-0" fill="currentColor" />}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-tv-text-secondary">{v.folder}</td>
                    <td className="px-4 py-3 text-[12px] text-tv-text-secondary tabular-nums">{v.duration}</td>
                    <td className="px-4 py-3 text-[12px] text-tv-text-secondary">{v.createdAt}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {pickMode ? (
                          <button onClick={() => onSelectVideo?.(v)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-tv-brand-bg text-white text-[11px] rounded-md hover:bg-tv-brand-bg/90 transition-colors" style={{ fontWeight: 600 }}>
                            <Check size={12} /> Use
                          </button>
                        ) : (
                          <>
                            <button onClick={() => toggleFavorite(v.id)} className="p-1 rounded hover:bg-tv-surface-hover" title="Favorite">
                              <Heart size={13} className={v.favorite ? "text-tv-danger" : "text-tv-text-tertiary"} fill={v.favorite ? "currentColor" : "none"} />
                            </button>
                            <button onClick={() => setEditTarget(v)} className="p-1 rounded hover:bg-tv-surface-hover" title="Edit">
                              <Edit2 size={13} className="text-tv-text-tertiary" />
                            </button>
                            <button onClick={() => show("Download started", "success")} className="p-1 rounded hover:bg-tv-surface-hover" title="Download">
                              <Download size={13} className="text-tv-text-tertiary" />
                            </button>
                            <button onClick={() => duplicateVideo(v)} className="p-1 rounded hover:bg-tv-surface-hover" title="Duplicate">
                              <Copy size={13} className="text-tv-text-tertiary" />
                            </button>
                            <button onClick={() => setDeleteTarget(v)} className="p-1 rounded hover:bg-tv-surface-hover" title="Delete">
                              <Trash2 size={13} className="text-tv-danger" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Delete confirmation modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-label="Delete Video" onKeyDown={(e) => { if (e.key === "Escape") setDeleteTarget(null); }}>
          <FocusTrap active>
          <div className="bg-white rounded-[14px] shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-6 pt-6 pb-4">
              <div className="w-10 h-10 rounded-full bg-tv-danger-bg flex items-center justify-center mb-3">
                <Trash2 size={18} className="text-tv-danger" />
              </div>
              <h3 className="text-[16px] text-tv-text-primary" style={{ fontWeight: 700 }}>Delete Video</h3>
              <p className="text-[13px] text-tv-text-secondary mt-1.5 leading-relaxed">
                Are you sure you want to delete <span style={{ fontWeight: 600 }}>"{deleteTarget.name}"</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-tv-border-light bg-tv-surface-muted">
              <button onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-[12px] text-tv-text-secondary border border-tv-border-light rounded-sm hover:bg-tv-surface-hover transition-colors" style={{ fontWeight: 500 }}>
                Cancel
              </button>
              <button onClick={confirmDelete}
                className="px-4 py-2 text-[12px] text-white bg-tv-danger rounded-sm hover:opacity-90 transition-colors" style={{ fontWeight: 600 }}>
                Delete
              </button>
            </div>
          </div>
          </FocusTrap>
        </div>
      )}

      {/* ── Video editor modal ── */}
      {editTarget && (
        <VideoEditorModal
          initialName={editTarget.name}
          initialDuration={editTarget.duration}
          canDelete
          onSave={handleEditorSave}
          onDelete={() => {
            setVideos(prev => prev.filter(v => v.id !== editTarget.id));
            show(`"${editTarget.name}" deleted`, "success");
            setEditTarget(null);
          }}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}
