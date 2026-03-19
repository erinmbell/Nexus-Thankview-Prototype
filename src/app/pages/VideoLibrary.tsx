import { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Plus, Search, Grid, List, MoreHorizontal, FolderPlus, Play,
  Camera, Upload, X, Check, Folder, Archive, Trash2,
  Tag, ChevronRight, Eye, Image,
  Captions, Star, Copy, Download, ArrowUpDown,
  ChevronDown, FolderInput, Pencil, Link2, ChartColumn,
  FileDown, Users, MessageSquareReply,
  User, Send,
  Film, ArrowRight, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import {
  type VideoItem, INITIAL_VIDEOS,
  THUMB_CLASSES, FOLDERS_WITH_ALL,
} from "../data/videos";
import { useToast } from "../contexts/ToastContext";
import { ViewToggle } from "../components/ViewToggle";
import { DeleteModal } from "../components/ui/DeleteModal";
import { FilterBar, FilterValues, DATE_CREATED_FILTER, dateFilterMatches } from "../components/FilterBar";
import type { FilterDef } from "../components/FilterBar";
import { TablePagination } from "../components/TablePagination";
import { fmtSec } from "../utils";
import { TV } from "../theme";
import { EditColumnsModal, ColumnsButton } from "../components/ColumnCustomizer";
import type { ColumnDef } from "../components/ColumnCustomizer";
import {
  RecordSetupStep, UploadSetupStep,
  LibrarySetupStep, CombineSetupStep,
  type Source as VSource,
} from "./VideoCreate";
import { VideoEditor, type VideoEditorData } from "../../imports/VideoEditor";
import { AddRecipientsPanel, type RecipientEntry } from "../../imports/AddRecipientsPanel";
import {
  Box, Stack, Text, Title, Button, UnstyledButton, ActionIcon,
  Badge, Menu, Tooltip, Modal, Drawer, Switch,
  Divider, CloseButton,
} from "@mantine/core";

type ViewMode = "grid" | "list";
type SortKey = "date" | "title" | "modified" | "duration";
type SortDir = "asc" | "desc";
type ArchivedFilter = "active" | "archived" | "all";
type ReplyFilter = "all" | "replies" | "non-replies";

// ── Column definitions for list view ──────────────────────────────────────────

const ALL_VIDEO_COLUMNS: ColumnDef[] = [
  { key: "title",      label: "Title",         group: "Summary", required: true },
  { key: "creator",    label: "Creator",        group: "Summary" },
  { key: "duration",   label: "Duration",       group: "Summary" },
  { key: "views",      label: "Views",          group: "Summary" },
  { key: "date",       label: "Date Created",   group: "Summary" },
  { key: "folder",     label: "Folder",         group: "Organization" },
  { key: "recipient",  label: "Recipient",      group: "Summary" },
  { key: "modified",   label: "Date Modified",  group: "Summary" },
  { key: "tags",       label: "Tags",           group: "Organization" },
  { key: "captions",   label: "Captions",       group: "Media" },
  { key: "type",       label: "Video Type",     group: "Organization" },
  { key: "status",     label: "Status",         group: "Organization" },
];

const DEFAULT_VIDEO_COLUMNS = ["title", "creator", "duration", "views", "date"];

const FOLDERS_INIT = FOLDERS_WITH_ALL;

const MONTH_ORDER: Record<string, number> = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
function parseDateVal(d: string): number {
  const parts = d.split(" ");
  if (parts.length < 2) return 0;
  return (MONTH_ORDER[parts[0]] || 0) * 100 + parseInt(parts[1] || "0");
}


// ── Add Video Modal (Setup → VideoEditor) ────────────────────────────────────
function AddVideoModal({ initialSource, onClose, onSave, folders }: {
  initialSource?: "record" | "upload";
  onClose: () => void;
  onSave: (title: string, folder: string) => void;
  folders: string[];
}) {
  const { show } = useToast();
  // Always start directly at the setup step — source selection screen is removed
  const [source] = useState<VSource>(initialSource ?? "record");
  const [showEditor, setShowEditor] = useState(false);

  const next = () => {
    setShowEditor(true);
  };

  const handleEditorSave = (data: VideoEditorData) => {
    onSave(data.name || "Annual Fund Thank You – Kelley Molt", data.folder || "Thank You Videos");
    show("Video saved to your library", "success");
  };

  // Once recording / upload / selection is done, show the full VideoEditor
  if (showEditor) {
    return (
      <Modal opened onClose={onClose} fullScreen withCloseButton={false} padding={0}
        styles={{ body: { height: "100%", display: "flex", flexDirection: "column" } }}>
        <VideoEditor
          initialName="Annual Fund Thank You – Kelley Molt"
          initialDuration="1:08"
          videoType={source === "record" ? "Recorded Video" : source === "upload" ? "Uploaded Video" : source === "combine" ? "Combined Video" : "Library Video"}
          onSave={handleEditorSave}
          onCancel={onClose}
        />
      </Modal>
    );
  }

  return (
    <Modal opened onClose={onClose} fullScreen withCloseButton={false} padding={0}
      styles={{ body: { height: "100%", overflow: "auto" } }}>
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
        <div className="sticky bottom-0 z-10 bg-white border-t border-tv-border-divider px-3 sm:px-6 py-3 flex items-center justify-end gap-2">
          <button onClick={onClose}
            className="text-[13px] text-tv-danger flex items-center gap-1.5 border border-tv-danger-border rounded-full px-4 py-2 hover:bg-tv-danger-bg transition-colors">
            <X size={13} />Cancel
          </button>
          <button onClick={next}
            className="flex items-center gap-1.5 text-[13px] font-semibold bg-tv-brand-bg text-white rounded-full px-4 py-2 hover:bg-tv-brand transition-colors">
            Continue<ChevronRight size={14} />
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Archive Confirmation Modal ────────────────────────────────────────────────
function ArchiveModal({ count, isUnarchive, onConfirm, onCancel }: { count: number; isUnarchive?: boolean; onConfirm: () => void; onCancel: () => void }) {
  const verb = isUnarchive ? "Unarchive" : "Archive";
  const noun = count === 1 ? "video" : `${count} videos`;
  return (
    <Modal opened onClose={onCancel} withCloseButton={false} size={420} padding="lg">
      <div className="flex items-start gap-4 mb-6" style={{ flexWrap: "nowrap" }}>
        <Box w={44} h={44} style={{ borderRadius: "50%", backgroundColor: TV.warningBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Archive size={20} style={{ color: TV.warning }} />
        </Box>
        <div style={{ flex: 1 }}>
          <Title order={3} fz={16} mb={4}>{verb} {noun}?</Title>
          <Text fz={13} c={TV.textSecondary}>
            {isUnarchive
              ? "This will restore the video to its original folder and make it visible in the default view."
              : "Archived videos are hidden from the default view but can be restored at any time."}
          </Text>
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="outline" color="red" onClick={onCancel}>Cancel</Button>
        <Button color="tvPurple" onClick={onConfirm}>{verb}</Button>
      </div>
    </Modal>
  );
}

// ── Move to Folder Modal ──────────────────────────────────────────────────────
function MoveToFolderModal({ folders, onMove, onClose, count }: { folders: string[]; onMove: (f: string) => void; onClose: () => void; count: number }) {
  const [sel, setSel] = useState("");
  return (
    <Modal opened onClose={onClose} title="Move to Folder" size={380}>
      <Text size="sm" c="dimmed" mb="md">Move {count} video{count > 1 ? "s" : ""} to a folder:</Text>
      <Stack gap={6} mb="lg" mah={200} style={{ overflowY: "auto" }}>
        {folders.filter(f => f !== "All Videos").map(f => (
          <UnstyledButton key={f} onClick={() => setSel(f)}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 10, border: `2px solid ${sel === f ? TV.borderStrong : TV.borderLight}`, backgroundColor: sel === f ? TV.surface : "transparent", color: sel === f ? "var(--mantine-color-tvPurple-6)" : TV.textLabel, fontWeight: sel === f ? 600 : 400, fontSize: 13, transition: "all 150ms" }}>
            <Folder size={14} />{f}
          </UnstyledButton>
        ))}
      </Stack>
      <div className="flex items-center gap-3">
        <Button variant="outline" color="red" onClick={onClose}>Cancel</Button>
        <Button leftSection={<FolderInput size={14} />} onClick={() => sel && onMove(sel)} disabled={!sel} style={{ flex: 1 }}>Move</Button>
      </div>
    </Modal>
  );
}

// ── 1:1 Export Modal ──────────────────────────────────────────────────────────
function ExportModal({ videos, onClose }: { videos: VideoItem[]; onClose: () => void }) {
  const { show } = useToast();
  const [includeMetrics, setIncludeMetrics] = useState(true);

  const handleExport = () => {
    const headers = ["Title", "Creator", "1:1 Link", ...(includeMetrics ? ["Total Views", "Open Rate %", "Click Rate %", "Reply Count", "Reply Rate %", "CTA Interactions", "CTA %", "Started Watching", "Started %", "Watched Full", "Full %", "Avg Duration"] : [])];
    const rows = videos.map(v => {
      const opens = Math.round(v.views * 1.4);
      const openRate = Math.round((v.views / Math.max(opens, 1)) * 100);
      const clicks = Math.round(v.views * 0.32);
      const clickRate = Math.round((clicks / Math.max(opens, 1)) * 100);
      const replies = Math.round(v.views * 0.08);
      const replyRate = Math.round((replies / Math.max(opens, 1)) * 100);
      return [
        v.title, v.creator, `https://tv.ht/${v.id}`,
        ...(includeMetrics ? [String(v.views), `${openRate}%`, `${clickRate}%`, String(replies), `${replyRate}%`, String(clicks), `${Math.round((clicks / Math.max(v.views, 1)) * 100)}%`, String(Math.round(v.views * 0.85)), `${Math.round(0.85 * 100)}%`, String(Math.round(v.views * 0.64)), `${Math.round(0.64 * 100)}%`, `${Math.round(v.durationSec * 0.72)}s`] : []),
      ];
    });
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "1-1-video-export.csv"; a.click();
    URL.revokeObjectURL(url);
    show("Export downloaded!", "success");
    onClose();
  };

  return (
    <Modal opened onClose={onClose} title="Export 1:1 Video Data" size={440}>
      <Text size="sm" c="dimmed" mb="md">Export a CSV with each video&apos;s title, creator, and 1:1 link.</Text>
      <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: TV.surface, border: `1px solid ${TV.borderLight}` }}>
        <Text size="xs" fw={600} mb="xs">{videos.length} video{videos.length !== 1 ? "s" : ""} will be exported</Text>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ChartColumn size={13} className="text-tv-brand" />
            <Text size="xs" c={TV.textLabel}>Include performance metrics</Text>
          </div>
          <Switch checked={includeMetrics} onChange={() => setIncludeMetrics(!includeMetrics)} size="sm" />
        </div>
        {includeMetrics && (
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {["Total Views", "Open Rate (%)", "Click Rate (%)", "Reply Count", "Reply Rate (%)", "CTA Interactions (%)", "Watch Start (%)", "Watch Complete (%)", "Avg View Duration"].map(m => (
              <Badge key={m} size="xs" variant="default" radius="sm">{m}</Badge>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" color="red" onClick={onClose}>Cancel</Button>
        <Button leftSection={<FileDown size={14} />} onClick={handleExport} style={{ flex: 1 }}>Export CSV</Button>
      </div>
    </Modal>
  );
}

// ── Send as 1:1 Drawer ───────────────────────────────────────────────────────

function SendAsOneToOneDrawer({ video, onClose }: { video: VideoItem; onClose: () => void }) {
  const { show } = useToast();
  const [recipients, setRecipients] = useState<RecipientEntry[]>([]);
  const [sending, setSending] = useState(false);

  const oneToOneLink = `https://tv.ht/${video.id}`;

  const handleSend = (finalRecipients: RecipientEntry[]) => {
    const count = finalRecipients.length;
    if (count === 0) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      show(`Sent "${video.title}" to ${count} constituent${count !== 1 ? "s" : ""}!`, "success");
      onClose();
    }, 1200);
  };

  return (
    <Drawer opened onClose={onClose} title="Send as 1:1 Video" position="right" size={820}
      styles={{ body: { padding: 0, display: "flex", flexDirection: "column", height: "calc(100% - 60px)" } }}
    >
      {/* Video preview + link — compact top bar */}
      <div className="px-5 pt-4 pb-3 border-b shrink-0" style={{ borderColor: TV.borderDivider }}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-14 h-9 rounded-sm bg-gradient-to-br ${THUMB_CLASSES[video.thumb]} flex items-center justify-center shrink-0`}>
            <Play size={12} className="text-white" fill="white" />
          </div>
          <div className="flex-1 min-w-0">
            <Text size="xs" fw={600} truncate>{video.title}</Text>
            <Text size="xs" c="dimmed">{video.duration} · {video.creator}</Text>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white border rounded-sm px-3 py-1.5 text-[11px] font-mono truncate" style={{ borderColor: TV.borderLight, color: TV.textSecondary }}>{oneToOneLink}</div>
          <Tooltip label="Copy link">
            <ActionIcon variant="default" size="sm" onClick={() => { navigator.clipboard.writeText(oneToOneLink).catch((_e) => {}); show("1:1 link copied!", "success"); }}>
              <Copy size={12} />
            </ActionIcon>
          </Tooltip>
        </div>
      </div>

      {/* Recipient picker panel — fills remaining space */}
      <AddRecipientsPanel
        className="flex-1 min-h-0"
        onRecipientsChange={setRecipients}
        onDone={handleSend}
        showDone
        doneLabel={sending ? "Sending…" : `Send to ${recipients.length || "…"} Constituent${recipients.length !== 1 ? "s" : ""}`}
      />
    </Drawer>
  );
}

// ── Shared card props ─────────────────────────────────────────────────────────
interface VideoCardProps {
  v: VideoItem;
  selected: number[];
  openMenu: number | null;
  onSelect: () => void;
  onOpen: () => void;
  onMenuToggle: () => void;
  onMenuClose: () => void;
  onEdit: () => void;
  onFavorite: () => void;
  onDuplicate: () => void;
  onCopyLink: () => void;
  onSendAs1to1: () => void;
  onDownload: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

function VideoCardMenu({ v, onEdit, onFavorite, onDuplicate, onCopyLink, onSendAs1to1, onDownload, onArchive, onDelete }: Pick<VideoCardProps, "v" | "onEdit" | "onFavorite" | "onDuplicate" | "onCopyLink" | "onSendAs1to1" | "onDownload" | "onArchive" | "onDelete">) {
  return (
    <>
      <Menu.Item leftSection={<Pencil size={12} />} onClick={onEdit}>Edit</Menu.Item>
      <Menu.Item leftSection={<Star size={12} />} onClick={onFavorite}>{v.favorited ? "Unfavorite" : "Favorite"}</Menu.Item>
      <Menu.Item leftSection={<Copy size={12} />} onClick={onDuplicate}>Duplicate</Menu.Item>
      <Menu.Item leftSection={<Link2 size={12} />} onClick={onCopyLink}>Copy 1:1 Link</Menu.Item>
      <Menu.Item leftSection={<Send size={12} />} onClick={onSendAs1to1}>Send as 1:1</Menu.Item>
      <Menu.Item leftSection={<Download size={12} />} onClick={onDownload}>Download</Menu.Item>
      <Menu.Item leftSection={<Archive size={12} />} onClick={onArchive}>{v.archived ? "Unarchive" : "Archive"}</Menu.Item>
      <Menu.Divider />
      <Menu.Item leftSection={<Trash2 size={12} />} color="red" onClick={onDelete}>Delete</Menu.Item>
    </>
  );
}

// ── Grid Card ─────────────────────────────────────────────────────────────────
function VideoGridCard({ v, selected, openMenu, onSelect, onOpen, onMenuToggle, onMenuClose, onEdit, onFavorite, onDuplicate, onCopyLink, onSendAs1to1, onDownload, onArchive, onDelete }: VideoCardProps) {
  return (
    <div className="group relative rounded-[14px] overflow-hidden border border-tv-border-light bg-white hover:shadow-lg transition-all cursor-pointer" role="button" tabIndex={0} onClick={onOpen} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); }}} aria-label={`Open video: ${v.title}`}>
      {/* Checkbox on hover */}
      <div role="button" tabIndex={0} aria-label="Select video" className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => { e.stopPropagation(); onSelect(); }} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onSelect(); } }}>
        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selected.includes(v.id) ? "bg-tv-brand-bg border-tv-brand-bg" : "bg-white border-tv-border-light"}`}>
          {selected.includes(v.id) && <Check size={10} className="text-white" strokeWidth={3} />}
        </div>
      </div>
      {/* Archived badge */}
      {v.archived && (
        <div className="absolute top-2 left-9 z-10 bg-black/50 text-white text-[8px] font-semibold px-1.5 py-0.5 rounded">Archived</div>
      )}
      {/* Favorite star — flush top-right corner, always clickable */}
      <button
        className={`absolute top-2 right-2 z-20 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
          v.favorited
            ? "bg-black/40 text-[#EAB308] opacity-100"
            : "bg-black/40 text-white/70 hover:text-[#EAB308] opacity-0 group-hover:opacity-100"
        }`}
        onClick={e => { e.stopPropagation(); onFavorite(); }}
        aria-label={v.favorited ? "Unfavorite" : "Favorite"}
      >
        <Star size={14} fill={v.favorited ? "currentColor" : "none"} />
      </button>
      {/* Thumbnail */}
      <div className={`h-32 bg-gradient-to-br ${THUMB_CLASSES[v.thumb]} flex items-center justify-center relative ${v.archived ? "opacity-60" : ""}`}>
        {v.thumbnailImage ? (
          <img src={v.thumbnailImage} alt={v.title || "Video thumbnail"} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <Play size={18} className="text-white/70 group-hover:text-white transition-colors" fill="currentColor" />
        )}
        <span className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">{v.duration}</span>
        {v.captionSource !== "none" && (
          <span className="absolute bottom-2 left-2 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1" style={{ fontWeight: 600 }}>
            <Captions size={10} />CC
          </span>
        )}
        {(v.thumbnailSaved || v.thumbnailImage) && !v.processing && (
          <span className="absolute top-2 left-2 bg-black/50 text-white text-[8px] px-1.5 py-0.5 rounded flex items-center gap-0.5" style={{ fontWeight: 600 }}>
            <Image size={8} />{v.thumbnailImage ? "Custom" : `${fmtSec(v.thumbnailTime)}`}
          </span>
        )}
        {v.processing && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white text-[11px] font-semibold animate-pulse">Processing…</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-[12px] font-semibold text-tv-text-primary truncate mb-0.5">{v.title}</p>
        {v.recipient && (
          <p className="text-[11px] text-tv-text-secondary truncate mb-0.5">
            <span className="text-tv-brand">→</span> {v.recipient}
          </p>
        )}
        <p className="text-[11px] text-tv-text-secondary">{v.creator} · {v.date}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-tv-border-strong flex items-center gap-1"><Eye size={10} />{v.views} views</span>
          {v.isReply && (
            <span className="text-[9px] text-[#0e7490] flex items-center gap-0.5"><MessageSquareReply size={9} />Reply</span>
          )}
        </div>
      </div>
      {/* ⋮ menu */}
      <div className="absolute top-2 right-10" onClick={e => e.stopPropagation()}>
        <Menu opened={openMenu === v.id} onChange={(o) => o ? onMenuToggle() : onMenuClose()} position="bottom-end" withinPortal>
          <Menu.Target>
            <ActionIcon variant="filled" size="sm" radius="xl" color="dark" className="!opacity-0 group-hover:!opacity-100 transition-opacity" onClick={onMenuToggle} aria-label="More actions">
              <MoreHorizontal size={12} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <VideoCardMenu v={v} onEdit={onEdit} onFavorite={onFavorite} onDuplicate={onDuplicate} onCopyLink={onCopyLink} onSendAs1to1={onSendAs1to1} onDownload={onDownload} onArchive={onArchive} onDelete={onDelete} />
          </Menu.Dropdown>
        </Menu>
      </div>
    </div>
  );
}

// ── List Row Cell Renderer ────────────────────────────────────────────────────
function VideoListCell({ colKey, v }: { colKey: string; v: VideoItem }) {
  switch (colKey) {
    case "creator":   return <div className="w-20 text-center text-[12px] text-tv-text-secondary truncate" title={v.creator}>{v.creator}</div>;
    case "duration":  return <div className="w-16 text-center text-[12px] text-tv-text-secondary font-mono">{v.duration}</div>;
    case "views":     return <div className="w-14 text-center flex items-center justify-center gap-1 text-[12px] text-tv-text-secondary"><Eye size={11} />{v.views}</div>;
    case "date":      return <div className="w-16 text-center text-[12px] text-tv-text-secondary">{v.date}</div>;
    case "folder":    return <div className="w-20 text-center text-[12px] text-tv-text-secondary truncate" title={v.folder}>{v.folder}</div>;
    case "recipient": return <div className="w-20 text-center text-[12px] text-tv-text-secondary truncate">{v.recipient || "—"}</div>;
    case "modified":  return <div className="w-16 text-center text-[12px] text-tv-text-secondary">{v.dateModified}</div>;
    case "tags":      return <div className="w-20 text-center text-[11px] text-tv-text-secondary truncate">{v.tags.length > 0 ? v.tags.join(", ") : "—"}</div>;
    case "captions":  return <div className="w-14 text-center text-[11px] text-tv-text-secondary">{v.captionSource !== "none" ? "CC" : "—"}</div>;
    case "type":      return <div className="w-16 text-center text-[11px] text-tv-text-secondary">{v.videoType === "clip" ? "1:1" : "Campaign"}</div>;
    case "status":    return <div className="w-16 text-center text-[11px] text-tv-text-secondary">{v.archived ? "Archived" : v.processing ? "Processing" : "Active"}</div>;
    default:          return null;
  }
}

const VIDEO_COL_WIDTHS: Record<string, string> = {
  creator: "w-20", duration: "w-16", views: "w-14", date: "w-16",
  folder: "w-20", recipient: "w-20", modified: "w-16", tags: "w-20",
  captions: "w-14", type: "w-16", status: "w-16",
};

// ── List Row ──────────────────────────────────────────────────────────────────
function VideoListRow({ v, selected, openMenu, onSelect, onOpen, onMenuToggle, onMenuClose, onEdit, onFavorite, onDuplicate, onCopyLink, onSendAs1to1, onDownload, onArchive, onDelete, activeCols }: VideoCardProps & { activeCols: string[] }) {
  return (
    <div role="button" tabIndex={0} onClick={onOpen} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); }}} aria-label={`Open video: ${v.title}`} className={`flex items-center gap-4 px-5 py-3.5 border-b border-tv-border-divider last:border-b-0 hover:bg-tv-surface-muted cursor-pointer group ${v.archived ? "opacity-60" : ""}`}>
      {/* Checkbox */}
      <div role="button" tabIndex={0} aria-label="Select video" onClick={e => { e.stopPropagation(); onSelect(); }} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onSelect(); } }} className="w-5 shrink-0">
        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selected.includes(v.id) ? "bg-tv-brand-bg border-tv-brand-bg" : "border-tv-border-light group-hover:border-tv-border-strong"}`}>
          {selected.includes(v.id) && <Check size={10} className="text-white" strokeWidth={3} />}
        </div>
      </div>
      <div className={`w-10 h-10 bg-gradient-to-br ${THUMB_CLASSES[v.thumb]} rounded-sm flex items-center justify-center shrink-0 relative overflow-hidden`}>
        {v.thumbnailImage ? (
          <img src={v.thumbnailImage} alt={v.title || "Video thumbnail"} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <Play size={13} className="text-white" fill="white" />
        )}
      </div>
      {/* Title column (always first / required) */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-[13px] font-semibold text-tv-text-primary truncate group-hover:text-tv-brand transition-colors">{v.title}</p>
          {v.favorited && <Star size={12} className="text-[#EAB308] shrink-0" fill="currentColor" />}
          {v.captionSource !== "none" && (
            <span className="inline-flex items-center gap-0.5 text-[9px] text-tv-text-secondary bg-tv-surface-muted border border-tv-border-light rounded px-1 py-px shrink-0" style={{ fontWeight: 600 }}>
              <Captions size={9} />CC
            </span>
          )}
          {v.isReply && <MessageSquareReply size={11} className="text-[#0e7490] shrink-0" />}
          {v.archived && <Archive size={11} className="text-tv-border-strong shrink-0" />}
        </div>
        <p className="text-[11px] text-tv-text-secondary truncate">
          {v.recipient ? <><span className="text-tv-brand">→</span> {v.recipient} · </> : ""}{v.folder}
        </p>
      </div>
      {/* Dynamic columns (skip "title" since it's rendered above) */}
      {activeCols.filter(k => k !== "title").map(colKey => (
        <VideoListCell key={colKey} colKey={colKey} v={v} />
      ))}
      <div className="w-8 shrink-0" onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") e.stopPropagation(); }}>
        <Menu opened={openMenu === v.id} onChange={(o) => o ? onMenuToggle() : onMenuClose()} position="bottom-end" withinPortal>
          <Menu.Target>
            <ActionIcon variant="subtle" size="sm" radius="xl" className="!opacity-0 group-hover:!opacity-100 transition-opacity" onClick={onMenuToggle} aria-label="More actions">
              <MoreHorizontal size={13} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <VideoCardMenu v={v} onEdit={onEdit} onFavorite={onFavorite} onDuplicate={onDuplicate} onCopyLink={onCopyLink} onSendAs1to1={onSendAs1to1} onDownload={onDownload} onArchive={onArchive} onDelete={onDelete} />
          </Menu.Dropdown>
        </Menu>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export function VideoLibrary() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [videos, setVideos]               = useState<VideoItem[]>(INITIAL_VIDEOS);
  const [folders, setFolders]             = useState(FOLDERS_INIT);
  const [activeFolder, setActiveFolder]   = useState("All Videos");
  const [viewMode, setViewMode]           = useState<ViewMode>("grid");
  const [search, setSearch]               = useState("");
  const [openMenu, setOpenMenu]           = useState<number | null>(null);
  const [showAdd, setShowAdd]             = useState<false | "record" | "upload">(false);
  const [addMenuOpen, setAddMenuOpen]     = useState(false);
  const [selected, setSelected]           = useState<number[]>([]);
  const [newFolder, setNewFolder]         = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Folder management
  const [editingFolder, setEditingFolder]     = useState<string | null>(null);
  const [editFolderName, setEditFolderName]   = useState("");
  const [folderMenu, setFolderMenu]           = useState<string | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<string | null>(null);

  // Filters
  const [sortBy, setSortBy]                 = useState<SortKey>("date");
  const [sortDir, setSortDir]               = useState<SortDir>("desc");
  const [videoFilterValues, setVideoFilterValues] = useState<FilterValues>({});
  const [videoFilterKeys, setVideoFilterKeys]     = useState<string[]>(["creator", "replyStatus", "status", "favorites", "tags", "dateCreated"]);


  // Modals
  const [showMoveModal, setShowMoveModal]         = useState(false);
  const [showExportModal, setShowExportModal]     = useState(false);
  const [archiveTarget, setArchiveTarget]         = useState<VideoItem | null>(null);
  const [bulkArchiving, setBulkArchiving]         = useState(false);
  const [deleteTarget, setDeleteTarget]           = useState<VideoItem | null>(null);
  const [bulkDeleting, setBulkDeleting]           = useState(false);
  const [sendAs1to1Target, setSendAs1to1Target]   = useState<VideoItem | null>(null);
  const [showLinksView, setShowLinksView]          = useState(false);
  const [activeVideoCols, setActiveVideoCols]      = useState<string[]>(DEFAULT_VIDEO_COLUMNS);
  const [showEditColumns, setShowEditColumns]      = useState(false);

  // Get unique creators from videos
  const uniqueCreators = useMemo(() => [...new Set(videos.map(v => v.creator))], [videos]);

  // Build dynamic filter defs for video library
  const videoFilters: FilterDef[] = useMemo(() => [
    { key: "videoType", label: "Video Type", icon: Film, group: "Video", type: "select" as const,
      options: [{ value: "clip", label: "Clip" }, { value: "campaign", label: "Campaign Video" }], essential: true },
    { key: "creator", label: "Creator", icon: User, group: "Video", type: "select" as const, searchable: true,
      options: uniqueCreators.map(c => ({ value: c, label: c })), essential: true },
    { key: "replyStatus", label: "Reply Status", icon: MessageSquareReply, group: "Video", type: "select" as const,
      options: [{ value: "replies", label: "Replies Only" }, { value: "non-replies", label: "Non-Replies" }], essential: true },
    { key: "status", label: "Status", icon: Archive, group: "Video", type: "select" as const,
      options: [{ value: "archived", label: "Archived" }, { value: "all", label: "All" }], essential: true },
    { key: "favorites", label: "Favorites", icon: Star, group: "Video", type: "select" as const,
      options: [{ value: "favorited", label: "Favorited Only" }], essential: true },
    { key: "tags", label: "Tags", icon: Tag, group: "Video", type: "multi-select" as const,
      options: [
        { value: "thank-you", label: "Thank You" },
        { value: "solicitation", label: "Appeals / Solicitation" },
        { value: "video-request", label: "Video Request" },
        { value: "event", label: "Event Related" },
        { value: "updates", label: "Updates" },
        { value: "birthdays", label: "Birthdays" },
        { value: "anniversaries", label: "Anniversaries" },
        { value: "endowment-reports", label: "Endowment Reports" },
        { value: "career-moves", label: "Career Moves" },
        { value: "other", label: "Other" },
      ], essential: true },
    DATE_CREATED_FILTER,
  ], [uniqueCreators]);

  // Derive filter values from FilterBar state
  const videoTypeFilter = videoFilterValues.videoType?.[0] ?? "all";
  const creatorFilter  = videoFilterValues.creator?.[0] ?? "all";
  const replyFilter    = (videoFilterValues.replyStatus?.[0] ?? "all") as ReplyFilter;
  const archivedFilter = (videoFilterValues.status?.[0] ?? "active") as ArchivedFilter;
  const favoriteFilter = (videoFilterValues.favorites?.[0] ?? "all") as "all" | "favorited";
  const tagsFilter     = videoFilterValues.tags ?? [];
  const dateCreatedFilter = videoFilterValues.dateCreated ?? [];

  // Filtering + sorting
  const filtered = useMemo(() => {
    let result = videos.filter(v => {
      const matchFolder = activeFolder === "All Videos" || v.folder === activeFolder;
      const matchSearch = v.title.toLowerCase().includes(search.toLowerCase()) || v.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
      const matchType = videoTypeFilter === "all" || v.videoType === videoTypeFilter;
      const matchCreator = creatorFilter === "all" || v.creator === creatorFilter;
      const matchReply = replyFilter === "all" || (replyFilter === "replies" ? v.isReply : !v.isReply);
      const matchArchived = archivedFilter === "all" || (archivedFilter === "archived" ? v.archived : !v.archived);
      const matchFavorite = favoriteFilter === "all" || v.favorited;
      const matchTags = tagsFilter.length === 0 || tagsFilter.some(t => v.tags.includes(t));
      let matchDate = true;
      if (dateCreatedFilter.length > 0) {
        const d = new Date(v.dateCreated);
        if (!isNaN(d.getTime())) {
          const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          matchDate = dateFilterMatches(iso, dateCreatedFilter);
        }
      }
      return matchFolder && matchSearch && matchType && matchCreator && matchReply && matchArchived && matchFavorite && matchTags && matchDate;
    });

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "date":     cmp = parseDateVal(b.date) - parseDateVal(a.date); break;
        case "title":    cmp = a.title.localeCompare(b.title); break;
        case "modified": cmp = parseDateVal(b.dateModified) - parseDateVal(a.dateModified); break;
        case "duration": cmp = a.durationSec - b.durationSec; break;
      }
      return sortDir === "desc" ? cmp : -cmp;
    });

    return result;
  }, [videos, activeFolder, search, videoTypeFilter, creatorFilter, replyFilter, archivedFilter, favoriteFilter, tagsFilter, sortBy, sortDir, dateCreatedFilter]);

  const clipFiltered = useMemo(() => filtered.filter(v => v.videoType === "clip"), [filtered]);
  const campaignFiltered = useMemo(() => filtered.filter(v => v.videoType === "campaign"), [filtered]);

  // Per-section pagination
  const [clipPage, setClipPage] = useState(1);
  const [clipPerPage, setClipPerPage] = useState(12);
  const [campPage, setCampPage] = useState(1);
  const [campPerPage, setCampPerPage] = useState(12);

  // Reset pages when filters change
  const clipTotal = clipFiltered.length;
  const campTotal = campaignFiltered.length;
  const prevClipTotal = useRef(clipTotal);
  const prevCampTotal = useRef(campTotal);
  if (prevClipTotal.current !== clipTotal) { prevClipTotal.current = clipTotal; if (clipPage !== 1) setClipPage(1); }
  if (prevCampTotal.current !== campTotal) { prevCampTotal.current = campTotal; if (campPage !== 1) setCampPage(1); }

  const clipPaged = useMemo(() => {
    const start = (clipPage - 1) * clipPerPage;
    return clipFiltered.slice(start, start + clipPerPage);
  }, [clipFiltered, clipPage, clipPerPage]);

  const campPaged = useMemo(() => {
    const start = (campPage - 1) * campPerPage;
    return campaignFiltered.slice(start, start + campPerPage);
  }, [campaignFiltered, campPage, campPerPage]);

  const activeFilterCount = Object.values(videoFilterValues).filter(v => v.length > 0).length;

  const handleSaveVideo = (title: string, folder: string) => {
    const thumbs: VideoItem["thumb"][] = ["purple", "teal", "green", "orange"];
    const newV: VideoItem = {
      id: Date.now(), title, duration: "0:00", durationSec: 0, originalDurationSec: 0, trimStart: 0, trimEnd: 0, isTrimmed: false,
      date: "Feb 25", dateCreated: "Feb 25, 2026 12:00 PM", dateModified: "Feb 25", views: 0,
      folder: folder || "Thank You Videos", thumb: thumbs[Math.floor(Math.random() * 4)], thumbnailSaved: false, thumbnailTime: 0, thumbnailImage: null, processing: true,
      tags: [], creator: "Kelley Molt", isReply: false, archived: false, favorited: false, description: "", recipient: "",
      captions: [], captionSource: "none", rotation: 0, crop: null, videoType: "clip",
    };
    setVideos(v => [newV, ...v]);
    setShowAdd(false);
    show("Video saved! Processing…", "success");
    setTimeout(() => setVideos(vs => vs.map(v => v.id === newV.id ? { ...v, processing: false } : v)), 3000);
  };

  const handleDeleteVideo = (id: number) => {
    setVideos(v => v.filter(x => x.id !== id));
  };

  const handleUpdateVideo = (updated: VideoItem) => {
    setVideos(vs => vs.map(v => v.id === updated.id ? updated : v));
  };

  const handleDuplicate = (v: VideoItem) => {
    // Per spec: copy = trimmed version becomes the full video
    // Inherited: video, title, description, tags, thumbnail, captions, rotation, folder
    // NOT inherited: crop (reset to null), favorite (always false)
    const trimmedDuration = v.trimEnd - v.trimStart;
    const dup: VideoItem = {
      ...v, id: Date.now(), title: `${v.title} (duplicate)`, views: 0,
      date: "Feb 25", dateCreated: "Feb 25, 2026 12:00 PM", dateModified: "Feb 25",
      favorited: false,
      crop: null,
      durationSec: trimmedDuration, originalDurationSec: trimmedDuration,
      duration: fmtSec(trimmedDuration),
      trimStart: 0, trimEnd: trimmedDuration, isTrimmed: false,
      // captions, captionSource, rotation, tags, description, thumbnail, folder all inherited via ...v
    };
    setVideos(vs => [dup, ...vs]);
    show(`"${v.title}" duplicated`, "success");
  };

  const toggleSelect = (id: number) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  // Folder CRUD
  const addFolder = () => {
    if (!newFolderName.trim()) return;
    setFolders(f => [...f, newFolderName.trim()]);
    setNewFolder(false);
    setNewFolderName("");
    show(`Folder "${newFolderName}" created`, "success");
  };

  const renameFolder = (oldName: string) => {
    if (!editFolderName.trim() || editFolderName === oldName) { setEditingFolder(null); return; }
    setFolders(f => f.map(fn => fn === oldName ? editFolderName.trim() : fn));
    setVideos(vs => vs.map(v => v.folder === oldName ? { ...v, folder: editFolderName.trim() } : v));
    if (activeFolder === oldName) setActiveFolder(editFolderName.trim());
    setEditingFolder(null);
    show(`Folder renamed to "${editFolderName}"`, "success");
  };

  const deleteFolder = (name: string) => {
    setFolders(f => f.filter(fn => fn !== name));
    setVideos(vs => vs.map(v => v.folder === name ? { ...v, folder: "Thank You Videos" } : v));
    if (activeFolder === name) setActiveFolder("All Videos");
    setDeleteFolderTarget(null);
    show(`Folder "${name}" deleted`, "success");
  };

  const handleBulkMove = (folder: string) => {
    setVideos(vs => vs.map(v => selected.includes(v.id) ? { ...v, folder } : v));
    show(`${selected.length} video(s) moved to "${folder}"`, "success");
    setSelected([]);
    setShowMoveModal(false);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Folder sidebar */}
      <div className="shrink-0 bg-white border-r border-tv-border-light flex flex-col transition-all duration-200 overflow-hidden" style={{ width: sidebarCollapsed ? 44 : 200 }}>
        {/* Header with collapse toggle */}
        <div className="px-3 py-3 border-b border-tv-border-divider flex items-center justify-between gap-2">
          {!sidebarCollapsed && <p className="text-[11px] font-semibold text-tv-text-label uppercase tracking-wider pl-1">Folders</p>}
          <Tooltip label={sidebarCollapsed ? "Show folders" : "Hide folders"} withArrow position="right" openDelay={300}>
            <button onClick={() => setSidebarCollapsed(c => !c)} className="w-7 h-7 rounded-[6px] flex items-center justify-center text-tv-text-secondary hover:bg-tv-surface hover:text-tv-brand transition-colors shrink-0">
              {sidebarCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
            </button>
          </Tooltip>
        </div>

        {sidebarCollapsed ? (
          /* Collapsed: icon-only folder buttons */
          <div className="flex-1 overflow-y-auto py-2 flex flex-col items-center gap-0.5">
            {folders.map(f => {
              const count = f === "All Videos" ? videos.filter(v => archivedFilter === "active" ? !v.archived : true).length : videos.filter(v => v.folder === f && (archivedFilter === "active" ? !v.archived : true)).length;
              return (
                <Tooltip key={f} label={`${f} (${count})`} withArrow position="right" openDelay={200}>
                  <button onClick={() => setActiveFolder(f)} className={`w-8 h-8 rounded-[6px] flex items-center justify-center transition-colors ${activeFolder === f ? "bg-tv-brand-tint text-tv-brand" : "text-tv-text-label hover:bg-tv-surface"}`}>
                    <Folder size={15} />
                  </button>
                </Tooltip>
              );
            })}
          </div>
        ) : (
          /* Expanded: full folder list */
          <>
            <div className="flex-1 overflow-y-auto py-2">
              {folders.map(f => (
                <div key={f} className="relative group">
                  {editingFolder === f ? (
                    <div className="flex items-center gap-1 px-3 py-1.5">
                      <input autoFocus value={editFolderName} onChange={e => setEditFolderName(e.target.value)} onKeyDown={e => e.key === "Enter" && renameFolder(f)} className="flex-1 border border-tv-border-strong rounded-[6px] px-2 py-1 text-[12px] outline-none focus:border-tv-brand-bg" />
                      <button onClick={() => renameFolder(f)} className="w-6 h-6 bg-tv-brand-bg rounded-full flex items-center justify-center text-white shrink-0"><Check size={10} /></button>
                      <button onClick={() => setEditingFolder(null)} className="w-6 h-6 bg-tv-surface rounded-full flex items-center justify-center text-tv-text-secondary shrink-0"><X size={10} /></button>
                    </div>
                  ) : (
                    <button onClick={() => setActiveFolder(f)} className={`w-full flex items-center gap-2 px-4 py-2.5 text-[13px] transition-all text-left ${activeFolder === f ? "bg-tv-brand-tint text-tv-brand font-semibold border-l-[3px] border-tv-brand-bg" : "text-tv-text-label hover:bg-tv-surface"}`}>
                      <Folder size={14} className="shrink-0" />
                      <span className="truncate flex-1">{f}</span>
                      <span className="text-[10px] text-tv-border-strong shrink-0">{f === "All Videos" ? videos.filter(v => archivedFilter === "active" ? !v.archived : true).length : videos.filter(v => v.folder === f && (archivedFilter === "active" ? !v.archived : true)).length}</span>
                    </button>
                  )}
                  {/* Folder context menu trigger */}
                  {f !== "All Videos" && editingFolder !== f && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <Menu opened={folderMenu === f} onChange={(o) => o ? setFolderMenu(f) : setFolderMenu(null)} position="bottom-end" withinPortal>
                        <Menu.Target>
                          <ActionIcon variant="subtle" size="xs" radius="xl" onClick={() => setFolderMenu(folderMenu === f ? null : f)} aria-label={`${f} folder actions`}>
                            <MoreHorizontal size={10} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item leftSection={<Pencil size={11} />} onClick={() => { setEditingFolder(f); setEditFolderName(f); setFolderMenu(null); }}>Rename</Menu.Item>
                          <Menu.Divider />
                          <Menu.Item leftSection={<Trash2 size={11} />} color="red" onClick={() => { setDeleteFolderTarget(f); setFolderMenu(null); }}>Delete</Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="border-t border-tv-border-divider p-3">
              {newFolder ? (
                <div className="flex gap-1">
                  <input autoFocus value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={e => e.key === "Enter" && addFolder()} placeholder="Folder name" className="flex-1 border border-tv-border-light rounded-sm px-2 py-1.5 text-[12px] outline-none focus:border-tv-brand-bg" />
                  <button onClick={addFolder} className="w-7 h-7 bg-tv-brand-bg rounded-full flex items-center justify-center text-white shrink-0"><Check size={11} /></button>
                </div>
              ) : (
                <Button variant="default" fullWidth leftSection={<FolderPlus size={13} />} size="xs" onClick={() => setNewFolder(true)}
                  style={{ border: `1px dashed ${TV.borderStrong}` }}>
                  New Folder
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Toolbar */}
        <div className="sticky top-0 z-10 flex items-center gap-3 px-5 py-4 bg-white border-b border-tv-border-light shrink-0 flex-wrap">
          <Title order={2}>{activeFolder}</Title>
          <Badge size="lg" variant="light" radius="md" color="gray" style={{ fontWeight: 600 }}>
            {filtered.length} video{filtered.length !== 1 ? "s" : ""}
          </Badge>
          <div className="flex items-center gap-2 bg-white rounded-full px-3 py-2 border border-tv-border-light flex-1 max-w-xs">
            <Search size={13} className="text-tv-text-secondary" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title or tag…" aria-label="Search videos by title or tag" className="bg-transparent text-[13px] text-tv-text-primary outline-none flex-1 placeholder:text-tv-text-secondary focus-visible:outline-none" />
          </div>
          <div className="ml-auto flex items-center gap-1.5 flex-wrap">
            <ViewToggle
              value={viewMode}
              onChange={(v) => setViewMode(v as ViewMode)}
              options={[
                { value: "grid", icon: <Grid size={13} />, label: "Grid View" },
                { value: "list", icon: <List size={13} />, label: "List View" },
              ]}
            />
            <Divider orientation="vertical" />
            {/* 1:1 Links View */}
            <Tooltip label="1:1 Links" withArrow position="bottom" openDelay={300}>
              <ActionIcon variant="default" size="lg" radius="xl" onClick={() => setShowLinksView(true)}>
                <Link2 size={14} />
              </ActionIcon>
            </Tooltip>
            {/* Export */}
            <Tooltip label="Export" withArrow position="bottom" openDelay={300}>
              <ActionIcon variant="default" size="lg" radius="xl" onClick={() => setShowExportModal(true)}>
                <FileDown size={14} />
              </ActionIcon>
            </Tooltip>
            <ColumnsButton onClick={() => setShowEditColumns(true)} />
            <Menu shadow="lg" width={300} position="bottom-end" opened={addMenuOpen} onChange={setAddMenuOpen}>
              <Menu.Target>
                <Button leftSection={<Plus size={14} />} rightSection={<ChevronDown size={12} />}>Add Video</Button>
              </Menu.Target>
              <Menu.Dropdown p={8}>
                {[
                  { key: "record", icon: Camera, label: "Record New Video", desc: "Open the video recorder to capture a new clip", action: () => { setAddMenuOpen(false); setShowAdd("record"); }, colorHex: "#007c9e", bgHex: "#d9f2f8" },
                  { key: "upload", icon: Upload, label: "Upload Video File", desc: "Upload an MP4, MOV, or WebM from your computer", action: () => { setAddMenuOpen(false); setShowAdd("upload"); } },
                  { key: "1to1", icon: Users, label: "Record 1:1 Videos", desc: "Record personalized videos for individual constituents", action: () => { setAddMenuOpen(false); navigate("/videos/record-1to1"); }, colorHex: "#007c9e", bgHex: "#d9f2f8" },
                ].map((opt) => {
                  const cHex = opt.colorHex ?? "#7c45b0";
                  const bHex = opt.bgHex ?? "#f3eeff";
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={opt.action}
                      className="w-full text-left rounded-xl p-2.5 flex items-start gap-2.5 transition-all hover:shadow-sm cursor-pointer border border-transparent"
                      style={{ backgroundColor: "transparent" }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = bHex; e.currentTarget.style.borderColor = cHex + "40"; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
                    >
                      <div
                        className="shrink-0 flex items-center justify-center rounded-lg"
                        style={{ width: 32, height: 32, backgroundColor: bHex }}
                      >
                        <opt.icon size={15} style={{ color: cHex }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-tv-text-primary">{opt.label}</p>
                        <p className="text-[10px] text-tv-text-secondary leading-tight mt-0.5">{opt.desc}</p>
                      </div>
                      <ArrowRight size={12} className="shrink-0 mt-1" style={{ color: TV.borderStrong }} />
                    </button>
                  );
                })}
              </Menu.Dropdown>
            </Menu>
          </div>
        </div>

        {/* Filter bar */}
        <div className="px-4 py-3 shrink-0">
          <FilterBar
            filters={videoFilters}
            activeFilterKeys={videoFilterKeys}
            filterValues={videoFilterValues}
            onFilterValuesChange={setVideoFilterValues}
            onActiveFilterKeysChange={setVideoFilterKeys}
            sortButton={
              <Menu position="bottom-end">
                <Menu.Target>
                  <Tooltip label="Sort" withArrow position="bottom" openDelay={300}>
                    <ActionIcon variant="subtle" size="lg" radius="xl" aria-label="Sort videos" style={{ color: TV.brand }}>
                      <ArrowUpDown size={14} />
                    </ActionIcon>
                  </Tooltip>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>Sort by</Menu.Label>
                  {([
                    { key: "date" as SortKey, label: "Date Created" },
                    { key: "title" as SortKey, label: "Title" },
                    { key: "modified" as SortKey, label: "Date Modified" },
                    { key: "duration" as SortKey, label: "Duration" },
                  ]).map(s => (
                    <Menu.Item key={s.key} onClick={() => { if (sortBy === s.key) { setSortDir(d => d === "asc" ? "desc" : "asc"); } else { setSortBy(s.key); setSortDir("desc"); } }}
                      rightSection={sortBy === s.key ? <Text size="xs" c="dimmed">{sortDir === "asc" ? "↑ Asc" : "↓ Desc"}</Text> : undefined}
                      style={sortBy === s.key ? { backgroundColor: TV.surface, color: TV.textBrand, fontWeight: 600 } : undefined}>
                      {s.label}
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>
            }
          />
        </div>

        {/* Bulk action bar */}
        {selected.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap px-4 py-2" style={{ backgroundColor: TV.surface, borderBottom: `1px solid ${TV.borderStrong}` }}>
            <Text size="sm" fw={600} c="tvPurple.6">{selected.length} selected</Text>
            <Tooltip label="Move to Folder" withArrow position="bottom" openDelay={300}>
              <ActionIcon variant="default" size="lg" radius="xl" onClick={() => setShowMoveModal(true)} aria-label="Move to Folder"><FolderInput size={14} aria-hidden="true" /></ActionIcon>
            </Tooltip>
            <Tooltip label="Archive" withArrow position="bottom" openDelay={300}>
              <ActionIcon variant="default" size="lg" radius="xl" onClick={() => setBulkArchiving(true)} aria-label="Archive"><Archive size={14} aria-hidden="true" /></ActionIcon>
            </Tooltip>
            <Tooltip label="Favorite" withArrow position="bottom" openDelay={300}>
              <ActionIcon variant="default" size="lg" radius="xl" color="yellow" onClick={() => { setVideos(vs => vs.map(v => selected.includes(v.id) ? { ...v, favorited: true } : v)); show(`${selected.length} video(s) favorited`, "success"); setSelected([]); }} aria-label="Favorite"><Star size={14} aria-hidden="true" /></ActionIcon>
            </Tooltip>
            <Tooltip label="Delete" withArrow position="bottom" openDelay={300}>
              <ActionIcon variant="default" size="lg" radius="xl" color="red" onClick={() => setBulkDeleting(true)} aria-label="Delete"><Trash2 size={14} aria-hidden="true" /></ActionIcon>
            </Tooltip>
            <Box style={{ flex: 1 }} />
            <Tooltip label="Clear Selection" withArrow position="bottom" openDelay={300}>
              <CloseButton onClick={() => setSelected([])} />
            </Tooltip>
          </div>
        )}

        <div className="flex-1 p-5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-14 h-14 bg-tv-brand-tint rounded-full flex items-center justify-center"><Play size={24} className="text-tv-brand" /></div>
              <p className="text-[16px] font-bold text-tv-text-primary">{activeFilterCount > 0 || search ? "No matching videos" : "No videos yet"}</p>
              <p className="text-[13px] text-tv-text-secondary">{activeFilterCount > 0 || search ? "Try adjusting your filters or search." : "Record or upload your first video."}</p>
              {!(activeFilterCount > 0 || search) && <Button leftSection={<Plus size={14} />} onClick={() => setShowAdd("record")}>Add Video</Button>}
            </div>
          ) : (
            <div className="space-y-8">
              {/* ── 1:1 Videos Section ─────────────────────────── */}
              {clipFiltered.length > 0 && (
                <div className="rounded-xl border border-tv-border-light bg-white overflow-hidden">
                  <div className="flex items-center gap-2.5 px-5 py-3 border-b border-tv-border-light bg-tv-surface-muted">
                    <div className="flex items-center gap-1.5 bg-white border border-tv-border-light rounded-full px-3 py-1 shadow-sm">
                      <Camera size={12} className="text-tv-text-label" />
                      <span className="text-[12px] font-semibold text-tv-text-primary">1:1 Videos</span>
                    </div>
                    <span className="text-[12px] text-tv-text-secondary font-medium">{clipFiltered.length}</span>
                    <span className="text-[10px] text-tv-border-strong hidden sm:inline">Individual recordings for specific constituents or universal use</span>
                  </div>
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                      {clipPaged.map(v => (
                        <VideoGridCard key={v.id} v={v} selected={selected} openMenu={openMenu} onSelect={() => toggleSelect(v.id)} onOpen={() => navigate(`/videos/${v.id}`)} onMenuToggle={() => setOpenMenu(openMenu === v.id ? null : v.id)} onMenuClose={() => setOpenMenu(null)} onEdit={() => { navigate(`/videos/${v.id}`); setOpenMenu(null); }} onFavorite={() => { handleUpdateVideo({ ...v, favorited: !v.favorited }); show(v.favorited ? "Removed from favorites" : "Added to favorites!", "success"); setOpenMenu(null); }} onDuplicate={() => { handleDuplicate(v); setOpenMenu(null); }} onCopyLink={() => { navigator.clipboard.writeText(`https://tv.ht/${v.id}`).catch((_e) => {}); show("1:1 link copied!", "success"); setOpenMenu(null); }} onSendAs1to1={() => { setSendAs1to1Target(v); setOpenMenu(null); }} onDownload={() => { show(`"${v.title}" downloaded`, "success"); setOpenMenu(null); }} onArchive={() => { setArchiveTarget(v); setOpenMenu(null); }} onDelete={() => { setDeleteTarget(v); setOpenMenu(null); }} />
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="sticky top-0 z-20 flex items-center gap-4 px-5 py-2.5 bg-tv-surface-muted border-b border-tv-border-light text-[10px] font-semibold text-tv-text-label uppercase tracking-wider">
                        <div className="w-10" /><div className="flex-1">Title</div>
                        {activeVideoCols.filter(k => k !== "title").map(colKey => {
                          const col = ALL_VIDEO_COLUMNS.find(c => c.key === colKey);
                          return <div key={colKey} className={`${VIDEO_COL_WIDTHS[colKey] || "w-16"} text-center`}>{col?.label ?? colKey}</div>;
                        })}
                        <div className="w-8" />
                      </div>
                      {clipPaged.map(v => (
                        <VideoListRow key={v.id} v={v} selected={selected} openMenu={openMenu} activeCols={activeVideoCols} onSelect={() => toggleSelect(v.id)} onOpen={() => navigate(`/videos/${v.id}`)} onMenuToggle={() => setOpenMenu(openMenu === v.id ? null : v.id)} onMenuClose={() => setOpenMenu(null)} onEdit={() => { navigate(`/videos/${v.id}`); setOpenMenu(null); }} onFavorite={() => { handleUpdateVideo({ ...v, favorited: !v.favorited }); show(v.favorited ? "Removed from favorites" : "Added to favorites!", "success"); setOpenMenu(null); }} onDuplicate={() => { handleDuplicate(v); setOpenMenu(null); }} onCopyLink={() => { navigator.clipboard.writeText(`https://tv.ht/${v.id}`).catch((_e) => {}); show("1:1 link copied!", "success"); setOpenMenu(null); }} onSendAs1to1={() => { setSendAs1to1Target(v); setOpenMenu(null); }} onDownload={() => { show(`"${v.title}" downloaded`, "success"); setOpenMenu(null); }} onArchive={() => { setArchiveTarget(v); setOpenMenu(null); }} onDelete={() => { setDeleteTarget(v); setOpenMenu(null); }} />
                      ))}
                    </>
                  )}
                  <TablePagination
                    page={clipPage} rowsPerPage={clipPerPage} totalRows={clipFiltered.length}
                    onPageChange={setClipPage} onRowsPerPageChange={setClipPerPage}
                    rowOptions={["12", "24", "48", "96"]}
                  />
                </div>
              )}

              {/* ── Campaign Videos Section ────────────────────── */}
              {campaignFiltered.length > 0 && (
                <div className="rounded-xl border border-tv-border-light bg-white overflow-hidden">
                  <div className="flex items-center gap-2.5 px-5 py-3 border-b border-tv-border-light bg-tv-surface-muted">
                    <div className="flex items-center gap-1.5 bg-tv-brand-tint border border-tv-brand-bg/20 rounded-full px-3 py-1 shadow-sm">
                      <Film size={12} className="text-tv-brand" />
                      <span className="text-[12px] font-semibold text-tv-brand">Campaign Videos</span>
                    </div>
                    <span className="text-[12px] text-tv-text-secondary font-medium">{campaignFiltered.length}</span>
                    <span className="text-[10px] text-tv-border-strong hidden sm:inline">Assembled videos with intro, clips, and outro for campaigns</span>
                  </div>
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                      {campPaged.map(v => (
                        <VideoGridCard key={v.id} v={v} selected={selected} openMenu={openMenu} onSelect={() => toggleSelect(v.id)} onOpen={() => navigate(`/videos/${v.id}`)} onMenuToggle={() => setOpenMenu(openMenu === v.id ? null : v.id)} onMenuClose={() => setOpenMenu(null)} onEdit={() => { navigate(`/videos/${v.id}`); setOpenMenu(null); }} onFavorite={() => { handleUpdateVideo({ ...v, favorited: !v.favorited }); show(v.favorited ? "Removed from favorites" : "Added to favorites!", "success"); setOpenMenu(null); }} onDuplicate={() => { handleDuplicate(v); setOpenMenu(null); }} onCopyLink={() => { navigator.clipboard.writeText(`https://tv.ht/${v.id}`).catch((_e) => {}); show("1:1 link copied!", "success"); setOpenMenu(null); }} onSendAs1to1={() => { setSendAs1to1Target(v); setOpenMenu(null); }} onDownload={() => { show(`"${v.title}" downloaded`, "success"); setOpenMenu(null); }} onArchive={() => { setArchiveTarget(v); setOpenMenu(null); }} onDelete={() => { setDeleteTarget(v); setOpenMenu(null); }} />
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="sticky top-0 z-20 flex items-center gap-4 px-5 py-2.5 bg-tv-surface-muted border-b border-tv-border-light text-[10px] font-semibold text-tv-text-label uppercase tracking-wider">
                        <div className="w-10" /><div className="flex-1">Title</div>
                        {activeVideoCols.filter(k => k !== "title").map(colKey => {
                          const col = ALL_VIDEO_COLUMNS.find(c => c.key === colKey);
                          return <div key={colKey} className={`${VIDEO_COL_WIDTHS[colKey] || "w-16"} text-center`}>{col?.label ?? colKey}</div>;
                        })}
                        <div className="w-8" />
                      </div>
                      {campPaged.map(v => (
                        <VideoListRow key={v.id} v={v} selected={selected} openMenu={openMenu} activeCols={activeVideoCols} onSelect={() => toggleSelect(v.id)} onOpen={() => navigate(`/videos/${v.id}`)} onMenuToggle={() => setOpenMenu(openMenu === v.id ? null : v.id)} onMenuClose={() => setOpenMenu(null)} onEdit={() => { navigate(`/videos/${v.id}`); setOpenMenu(null); }} onFavorite={() => { handleUpdateVideo({ ...v, favorited: !v.favorited }); show(v.favorited ? "Removed from favorites" : "Added to favorites!", "success"); setOpenMenu(null); }} onDuplicate={() => { handleDuplicate(v); setOpenMenu(null); }} onCopyLink={() => { navigator.clipboard.writeText(`https://tv.ht/${v.id}`).catch((_e) => {}); show("1:1 link copied!", "success"); setOpenMenu(null); }} onSendAs1to1={() => { setSendAs1to1Target(v); setOpenMenu(null); }} onDownload={() => { show(`"${v.title}" downloaded`, "success"); setOpenMenu(null); }} onArchive={() => { setArchiveTarget(v); setOpenMenu(null); }} onDelete={() => { setDeleteTarget(v); setOpenMenu(null); }} />
                      ))}
                    </>
                  )}
                  <TablePagination
                    page={campPage} rowsPerPage={campPerPage} totalRows={campaignFiltered.length}
                    onPageChange={setCampPage} onRowsPerPageChange={setCampPerPage}
                    rowOptions={["12", "24", "48", "96"]}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAdd && <AddVideoModal initialSource={showAdd} onClose={() => setShowAdd(false)} onSave={handleSaveVideo} folders={folders} />}
      {showMoveModal && <MoveToFolderModal folders={folders} count={selected.length} onClose={() => setShowMoveModal(false)} onMove={handleBulkMove} />}
      {showExportModal && <ExportModal videos={videos.filter(v => !v.archived)} onClose={() => setShowExportModal(false)} />}

      {deleteFolderTarget && <DeleteModal title={`Delete folder "${deleteFolderTarget}"?`} onConfirm={() => deleteFolder(deleteFolderTarget)} onCancel={() => setDeleteFolderTarget(null)} />}

      {/* Single video archive confirmation */}
      {archiveTarget && <ArchiveModal count={1} isUnarchive={archiveTarget.archived} onConfirm={() => { handleUpdateVideo({ ...archiveTarget, archived: !archiveTarget.archived }); show(archiveTarget.archived ? `"${archiveTarget.title}" unarchived` : `"${archiveTarget.title}" archived`, "info"); setArchiveTarget(null); }} onCancel={() => setArchiveTarget(null)} />}

      {/* Bulk archive confirmation */}
      {bulkArchiving && <ArchiveModal count={selected.length} onConfirm={() => { setVideos(vs => vs.map(v => selected.includes(v.id) ? { ...v, archived: true } : v)); show(`${selected.length} video${selected.length > 1 ? "s" : ""} archived`, "info"); setSelected([]); setBulkArchiving(false); }} onCancel={() => setBulkArchiving(false)} />}

      {/* Single video delete confirmation */}
      {deleteTarget && <DeleteModal title={`Delete "${deleteTarget.title}"?`} onConfirm={() => { handleDeleteVideo(deleteTarget.id); show(`"${deleteTarget.title}" deleted`); setDeleteTarget(null); }} onCancel={() => setDeleteTarget(null)} />}

      {/* Bulk delete confirmation */}
      {bulkDeleting && <DeleteModal title={`Delete ${selected.length} video${selected.length > 1 ? "s" : ""}?`} description={`This will permanently delete ${selected.length} video${selected.length > 1 ? "s" : ""}. This action cannot be undone.`} onConfirm={() => { setVideos(v => v.filter(x => !selected.includes(x.id))); show(`${selected.length} video${selected.length > 1 ? "s" : ""} deleted`); setSelected([]); setBulkDeleting(false); }} onCancel={() => setBulkDeleting(false)} />}

      {/* Edit Columns Modal */}
      {showEditColumns && (
        <EditColumnsModal columns={ALL_VIDEO_COLUMNS} active={activeVideoCols} onClose={() => setShowEditColumns(false)}
          onSave={cols => { setActiveVideoCols(cols); show("Columns updated!", "success"); }} />
      )}

      {/* Send as 1:1 drawer */}
      {sendAs1to1Target && <SendAsOneToOneDrawer video={sendAs1to1Target} onClose={() => setSendAs1to1Target(null)} />}

      {/* 1:1 Links View Drawer */}
      {showLinksView && (
        <Drawer opened onClose={() => setShowLinksView(false)} title="1:1 Video Links" position="right" size={560}>
          <Stack gap="sm">
            <Text size="sm" c="dimmed">All library videos with their 1:1 links. Copy any link to share via email.</Text>
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: TV.borderLight }}>
              {/* Header */}
              <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-2 bg-tv-surface-muted border-b text-[10px] font-semibold text-tv-text-label uppercase tracking-wider" style={{ borderColor: TV.borderLight }}>
                <div className="flex-1">Title</div>
                <div className="w-24 text-center">Creator</div>
                <div className="w-14 text-center">Views</div>
                <div className="w-20 text-center">Link</div>
              </div>
              {/* Rows */}
              {videos.filter(v => !v.archived).map(v => (
                <div key={v.id} className="flex items-center gap-3 px-4 py-2.5 border-b last:border-b-0 hover:bg-black/[0.015] transition-colors" style={{ borderColor: TV.borderLight }}>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`w-6 h-6 rounded-[4px] bg-gradient-to-br ${THUMB_CLASSES[v.thumb]} flex items-center justify-center shrink-0 overflow-hidden relative`}>
                      {v.thumbnailImage ? (
                        <img src={v.thumbnailImage} alt={v.title || "Video thumbnail"} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <Play size={8} className="text-white" fill="white" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] truncate" style={{ fontWeight: 600, color: TV.textPrimary }}>{v.title}</p>
                      <p className="text-[9px] truncate" style={{ color: TV.textSecondary }}>{v.duration}</p>
                    </div>
                  </div>
                  <div className="w-24 text-center text-[11px] truncate" style={{ color: TV.textSecondary }}>{v.creator}</div>
                  <div className="w-14 text-center text-[11px]" style={{ color: TV.textSecondary }}>{v.views}</div>
                  <div className="w-20 flex items-center justify-center gap-1">
                    <Tooltip label="Copy 1:1 link">
                      <ActionIcon variant="subtle" size="xs" onClick={() => { navigator.clipboard.writeText(`https://tv.ht/${v.id}`).catch((_e) => {}); show("Link copied!", "success"); }}>
                        <Copy size={11} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Send as 1:1">
                      <ActionIcon variant="subtle" size="xs" onClick={() => { setShowLinksView(false); setSendAs1to1Target(v); }}>
                        <Send size={11} />
                      </ActionIcon>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="default" leftSection={<FileDown size={13} />} onClick={() => { setShowLinksView(false); setShowExportModal(true); }}>
              Export All as CSV
            </Button>
          </Stack>
        </Drawer>
      )}
    </div>
  );
}
