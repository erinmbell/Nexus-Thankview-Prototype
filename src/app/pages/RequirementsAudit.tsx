import { useState, useMemo, useRef, useCallback } from "react";
import {
  CheckCircle2, XCircle, AlertTriangle, MinusCircle, ChevronDown, ChevronRight,
  Search, X, Upload, FileSpreadsheet, Trash2, Plus, Eye, EyeOff, Copy, Check,
} from "lucide-react";
import { TV } from "../theme";

/* ── Generate Claude Code prompt for a requirement ── */
function generatePrompt(r: { description: string; status: string; theme: string; notes: string; where: string; designReview: string }, tab: string): string {
  const action = r.status === "partial" ? "The design review says this is built but marked as '" + r.designReview + "'." : "This feature needs to be implemented.";
  const whereHint = r.where ? ` Check: ${r.where}.` : "";
  const notesHint = r.notes ? ` Context: ${r.notes}` : "";
  return `In the ThankView prototype (${tab} area), address this requirement: "${r.description}" — ${action}${whereHint}${notesHint} After completing, update the status for this item in RequirementsAudit.tsx CAMPAIGNS_REQUIREMENTS from "${r.status}" to "done".`;
}

/* ── Copy-to-clipboard prompt block component ── */
function PromptBlock({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="mt-3 rounded-md overflow-hidden" style={{ border: `1px solid ${TV.brandBg}30` }}>
      <div className="flex items-center justify-between px-3 py-1.5" style={{ backgroundColor: `${TV.brandBg}10` }}>
        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: TV.textBrand }}>Claude Code Prompt</span>
        <button onClick={handleCopy} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors hover:bg-white/80" style={{ fontWeight: 600, color: copied ? TV.success : TV.textBrand }}>
          {copied ? <><Check size={10} />Copied!</> : <><Copy size={10} />Copy</>}
        </button>
      </div>
      <div className="px-3 py-2" style={{ backgroundColor: "#1e1e2e" }}>
        <p className="text-[11px] font-mono leading-relaxed" style={{ color: "#e2e8f0", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{prompt}</p>
      </div>
    </div>
  );
}

/* ── Status types ── */
type Status = "done" | "partial" | "missing" | "n/a";

interface Requirement {
  id: number;
  theme: string;
  subTheme: string;
  description: string;
  priority: string;
  designReview: string;
  status: Status;
  where: string;
  notes: string;
}

/* ── Imported CSV types ── */
interface ImportedCsvRow {
  uid: string;           // unique per row across all imports
  theme: string;
  subTheme: string;
  description: string;
  priority: string;
  designReview: string;
  status: Status;        // user-editable
  where: string;
  notes: string;
  rawCols: Record<string, string>; // all original columns
}

interface ImportedCsv {
  id: string;
  filename: string;
  displayName: string;
  importedAt: string;
  rows: ImportedCsvRow[];
  visible: boolean;
}

/* ── CSV parser ── */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ",") { result.push(current); current = ""; }
      else { current += ch; }
    }
  }
  result.push(current);
  return result;
}

function parseCsvText(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  // Parse headers and strip empty trailing headers (from trailing commas)
  const rawHeaders = parseCsvLine(lines[0]);
  const headers = rawHeaders.map(h => h.trim()).filter(h => h.length > 0);
  const headerCount = headers.length;
  return lines.slice(1)
    .map(line => {
      const vals = parseCsvLine(line);
      const row: Record<string, string> = {};
      // Only map up to the number of real headers — ignore extra trailing fields
      for (let i = 0; i < headerCount; i++) {
        row[headers[i]] = (vals[i] ?? "").trim();
      }
      return row;
    })
    // Skip rows where every value is empty (blank lines / rows of only commas)
    .filter(row => Object.values(row).some(v => v.length > 0));
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Clean a cell value: collapse duplicate commas, strip leading/trailing commas & whitespace */
function cleanVal(v: string): string {
  return v.replace(/,{2,}/g, ",").replace(/^[,\s]+|[,\s]+$/g, "").trim();
}

function findCol(row: Record<string, string>, ...candidates: string[]): string {
  const normCands = candidates.map(normalizeHeader);
  for (const key of Object.keys(row)) {
    const norm = normalizeHeader(key);
    if (norm.length < 2) continue; // skip ghost single-char headers
    for (const c of normCands) {
      if (norm === c || norm.includes(c) || c.includes(norm)) return cleanVal(row[key]);
    }
  }
  return "";
}

function csvRowToImported(raw: Record<string, string>, index: number, csvId: string): ImportedCsvRow {
  return {
    uid: `${csvId}-${index}`,
    theme: findCol(raw, "theme", "category", "area", "section") || "Imported",
    subTheme: findCol(raw, "subtheme", "sub theme", "sub-theme", "subcategory") || "",
    description: findCol(raw, "description", "requirement", "need", "feature", "user story") || cleanVal(Object.values(raw).find(v => v.length > 20) ?? "") || "",
    priority: findCol(raw, "priority", "moscow", "mus cow") || "",
    designReview: findCol(raw, "design review", "designreview", "design rev", "tv only design review") || "",
    status: "missing",
    where: findCol(raw, "where", "location", "component", "file", "page") || "",
    notes: findCol(raw, "notes", "note", "comments", "comment") || "",
    rawCols: raw,
  };
}

/* ═══════════════════════════════════════════════
   HARDCODED REQUIREMENTS (original 62)
   ═══════════════════════════════════════════════ */
const REQUIREMENTS: Requirement[] = [
  { id: 1, theme: "Adding a New Video", subTheme: "General", description: "Users should be able to add a new video to TV either in the campaign flow or from the video library page", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "VideoLibrary (AddVideoModal), PersonalizedRecorder", notes: "Video Library has full add-video wizard (record/upload/library/combine). Campaign flow uses PersonalizedRecorder for 1:1 batch recording." },
  { id: 2, theme: "Adding a New Video", subTheme: "Recording in app", description: "Users should be able to record a video, from within the ThankView web app, on their computer", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "PersonalizedRecorder (record phase), VideoLibrary (AddVideoModal → RecordSetupStep), VideoCreate", notes: "Full webcam recording UI with countdown, elapsed timer, start/stop controls in both PersonalizedRecorder and the library's add-video wizard." },
  { id: 3, theme: "Adding a New Video", subTheme: "Recording in app", description: "Users should be able to record a video on their phone within the ThankView web app", priority: "MUST HAVE", designReview: "N/A to Design", status: "n/a", where: "—", notes: "Marked N/A to Design. Mobile-responsive recording would require native camera APIs; no UI mock needed for this prototype." },
  { id: 4, theme: "Adding a New Video", subTheme: "Recording in app", description: "Script visible on screen while recording (teleprompter)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "PersonalizedRecorder (script panel + overlay)", notes: "Script panel with toggle, merge-field support ({{First Name}}), resolved live preview, and transparent overlay on camera view during recording." },
  { id: 5, theme: "Adding a New Video", subTheme: "Recording in app", description: "Select which camera to use for recording", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "PersonalizedRecorder (ToolbarBtn camera dropdown)", notes: "Camera dropdown in toolbar with 3 mock devices. Selection persists across constituents." },
  { id: 6, theme: "Adding a New Video", subTheme: "Recording in app", description: "Select which microphone to use for recording", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "PersonalizedRecorder (ToolbarBtn mic dropdown)", notes: "Mic dropdown in toolbar with 4 mock devices." },
  { id: 7, theme: "Adding a New Video", subTheme: "Recording in app", description: "Select recording quality: 480 / 720 / 1080", priority: "MUST HAVE", designReview: "Fail", status: "done", where: "PersonalizedRecorder (ToolbarBtn quality dropdown)", notes: "Quality dropdown with 480p/720p/1080p options. Note: design review said \"Fail\" — may need visual polish." },
  { id: 8, theme: "Adding a New Video", subTheme: "Recording in app", description: "Cancel recording — option to stop or start over", priority: "MUST HAVE", designReview: "Fail", status: "done", where: "PersonalizedRecorder (countdown cancel + discard button)", notes: "Cancel during countdown (X button) returns to idle. During recording, Discard button stops and returns to queue. Design review said \"Fail\" — may need clearer UX." },
  { id: 9, theme: "Adding a New Video", subTheme: "Recording in app", description: "Blur background option", priority: "COULD HAVE", designReview: "N/A to Design", status: "n/a", where: "—", notes: "Marked N/A to Design. Would require real camera API + ML background segmentation. Not prototyped." },
  { id: 10, theme: "Adding a New Video", subTheme: "Recording in app", description: "Virtual background image selection", priority: "COULD HAVE", designReview: "N/A to Design", status: "n/a", where: "—", notes: "Marked N/A to Design. Similar to blur — requires live video processing. Not prototyped." },
  { id: 11, theme: "Adding a New Video", subTheme: "Recording in app", description: "Trash video and re-record after recording", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "PersonalizedRecorder (discardRecording), VideoEditorModal (onDelete)", notes: "Discard during recording returns to queue. After editing, Delete button discards and returns to record phase with toast notification." },
  { id: 12, theme: "Adding a New Video", subTheme: "Upload Video", description: "Import a pre-recorded video into ThankView (put into 4:3 video)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "PersonalizedRecorder (upload phase), VideoLibrary (AddVideoModal → UploadSetupStep)", notes: "Drag-and-drop upload zone in both PersonalizedRecorder and library wizard. 4:3 conversion is noted in requirements but is a backend concern; UI accepts the file." },
  { id: 13, theme: "Adding a New Video", subTheme: "Combine existing TV Videos", description: "Combine / splice multiple videos from library to create a new library video", priority: "MUST HAVE", designReview: "N/A to Design", status: "done", where: "VideoLibrary (AddVideoModal → CombineSetupStep), VideoCreate", notes: "CombineSetupStep in the add-video wizard allows selecting multiple library videos. Marked N/A to Design and Low priority." },
  { id: 14, theme: "Adding a New Video", subTheme: "After recorded / uploaded", description: "Name video before save (required)", priority: "", designReview: "Pass", status: "done", where: "VideoEditorModal (Details tab → title field), VideoLibrary (CaptionsStep has save)", notes: "VideoEditorModal's Details tab has a \"Video Name\" text input. Library wizard's final step also has naming. The 1:1 recorder auto-names as \"Video for [Name]\"." },
  { id: 15, theme: "Adding a New Video", subTheme: "After recorded / uploaded", description: "Option to add a description before saving", priority: "", designReview: "Pass", status: "done", where: "VideoEditorModal (Details tab → description textarea), VideoLibrary (detail panel)", notes: "Description textarea added to VideoEditorModal's Details tab (between title and tags). Also editable in the library detail panel's edit mode." },
  { id: 16, theme: "Adding a New Video", subTheme: "After recorded / uploaded", description: "Option to add tags before saving", priority: "", designReview: "Needs Work", status: "done", where: "VideoEditorModal (Details tab → tags), VideoLibrary (detail panel tags)", notes: "Tag picker with suggested tags in both VideoEditorModal and library detail panel. Design review flagged \"Needs Work\" — may want free-text tag entry alongside presets." },
  { id: 17, theme: "Adding a New Video", subTheme: "After recorded / uploaded", description: "Option to specify folder before saving", priority: "", designReview: "Needs Work", status: "done", where: "VideoEditorModal (Details tab → folder select), VideoLibrary (detail panel)", notes: "Folder dropdown in VideoEditorModal and library detail panel. Design review flagged \"Needs Work\"." },
  { id: 18, theme: "Editing Videos", subTheme: "General", description: "Users should be able to edit a video either in the campaign flow or from the video library page", priority: "MUST HAVE", designReview: "Needs Work", status: "done", where: "VideoEditorModal (campaign flow), VideoLibrary (detail panel edit mode)", notes: "Full editing in campaign flow via VideoEditorModal (trim/crop/rotate/captions/details). Library has inline detail panel with edit mode. Design review flagged \"Needs Work\"." },
  { id: 19, theme: "Editing Videos", subTheme: "Thumbnail", description: "Upload an image to use as the thumbnail for a video", priority: "SHOULD HAVE", designReview: "Needs Work", status: "done", where: "VideoLibrary (ThumbnailPicker + Upload Image button in thumbnail editor)", notes: "Frame-based thumbnail picker with scrubber, plus a dedicated \"Upload Image (JPG, PNG)\" section below. Uploaded image previews inline with a Remove option. Custom images show an \"IMG\" badge on the thumbnail preview." },
  { id: 20, theme: "Editing Videos", subTheme: "Crop", description: "Crop video", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "VideoEditorModal (Crop tab), VideoLibrary (detail panel crop controls)", notes: "Crop presets (Original, 4:3, 16:9, 1:1, 9:16) in VideoEditorModal. Library detail panel also has a crop rectangle editor with numeric inputs." },
  { id: 21, theme: "Editing Videos", subTheme: "Trim", description: "Trim video", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "VideoEditorModal (Trim tab), VideoLibrary (TrimSlider)", notes: "Dual-handle waveform trimmer in VideoEditorModal. Library detail panel has a TrimSlider with draggable handles." },
  { id: 22, theme: "Editing Videos", subTheme: "Trim", description: "Revert trimmed video back to untrimmed version", priority: "MUST HAVE", designReview: "Fail", status: "done", where: "VideoEditorModal (\"Reset to full length\" button), VideoLibrary (\"Revert to original\" button)", notes: "VideoEditorModal shows \"Reset to full length\" link when trimmed. Library detail panel has a \"Revert to original\" button that restores originalDurationSec. Design review said \"Fail\" — may need more prominent placement." },
  { id: 23, theme: "Editing Videos", subTheme: "Rotate", description: "Rotate video", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "VideoEditorModal (Rotate tab), VideoLibrary (detail panel rotation dropdown)", notes: "90° rotation with live preview transform in VideoEditorModal. Library has rotation dropdown (0°/90°/180°/270°) with flip options." },
  { id: 24, theme: "Editing Videos", subTheme: "Metadata", description: "Rename video", priority: "", designReview: "Pass", status: "done", where: "VideoEditorModal (Details tab), VideoLibrary (detail panel edit mode)", notes: "Title text input in both VideoEditorModal and library detail panel's edit mode." },
  { id: 25, theme: "Editing Videos", subTheme: "Metadata", description: "Update description", priority: "", designReview: "Pass", status: "done", where: "VideoLibrary (detail panel edit mode → Textarea)", notes: "Description textarea in library detail panel edit mode. View mode shows description or \"No description\" italic placeholder." },
  { id: 26, theme: "Editing Videos", subTheme: "Metadata", description: "Add / update tags", priority: "", designReview: "Needs Work", status: "done", where: "VideoEditorModal (Details tab), VideoLibrary (detail panel → TagSelect)", notes: "Tag selection in both places. Library uses a TagSelect component. Design review flagged \"Needs Work\"." },
  { id: 27, theme: "Editing Videos", subTheme: "Metadata", description: "Type in a \"recipient\" name to clarify who the video was made for", priority: "", designReview: "Pass", status: "done", where: "VideoLibrary (detail panel → recipient TextInput)", notes: "Recipient text input in library detail panel edit mode." },
  { id: 28, theme: "Editing Videos", subTheme: "Metadata", description: "Update which folder the video is in", priority: "", designReview: "Needs Work", status: "done", where: "VideoEditorModal (Details tab → folder select), VideoLibrary (detail panel, Move to Folder modal)", notes: "Folder dropdown in both locations. Library also has a dedicated MoveToFolderModal for single and bulk operations." },
  { id: 29, theme: "Editing Videos", subTheme: "Actions", description: "Download a previously saved video", priority: "", designReview: "Pass", status: "done", where: "VideoLibrary (detail panel Download button, card context menu)", notes: "Download button in detail panel actions grid and in the per-card context menu." },
  { id: 30, theme: "Editing Videos", subTheme: "Actions", description: "Delete a previously saved video", priority: "", designReview: "Pass", status: "done", where: "VideoLibrary (detail panel Delete button → DeleteModal, card context menu)", notes: "Delete with confirmation modal in both detail panel and card context menu. Bulk delete also supported." },
  { id: 31, theme: "Closed Captions", subTheme: "General", description: "Adjust closed captions either in the campaign flow or from the video library page", priority: "MUST HAVE", designReview: "Needs Work", status: "done", where: "VideoEditorModal (Captions tab), VideoLibrary (detail panel captions section)", notes: "VideoEditorModal has a Captions tab with language, size, position, and color settings. Library detail panel has a full captions editor with line-by-line editing. Design review flagged \"Needs Work\"." },
  { id: 32, theme: "Closed Captions", subTheme: "Add captions", description: "Add closed captions via uploading a VTT or SRT caption file", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "VideoLibrary (detail panel → Upload VTT/SRT action)", notes: "Upload caption file action in the library detail panel's caption section. captionSource tracks 'upload' origin." },
  { id: 33, theme: "Closed Captions", subTheme: "Add captions", description: "Add closed captions via AI closed captioning", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "VideoLibrary (detail panel → AI caption generation with Sparkles icon)", notes: "AI captioning button with simulated processing state, progress bar, and auto-generated captions. captionSource tracks 'ai'." },
  { id: 34, theme: "Closed Captions", subTheme: "Add captions", description: "Add closed captions via human-written captions (REV)", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "VideoLibrary (detail panel → REV caption request action)", notes: "REV caption ordering action. captionSource tracks 'rev'." },
  { id: 35, theme: "Closed Captions", subTheme: "Processing", description: "Cancel stuck caption processing and retry", priority: "COULD HAVE", designReview: "Pass", status: "done", where: "VideoLibrary (detail panel → cancel processing action)", notes: "Cancel button visible during caption processing state." },
  { id: 36, theme: "Closed Captions", subTheme: "Manage captions", description: "Download captions from a video", priority: "COULD HAVE", designReview: "Pass", status: "done", where: "VideoLibrary (detail panel → Download Captions tooltip+ActionIcon)", notes: "Download button in caption section header. Simulates .srt download." },
  { id: 37, theme: "Closed Captions", subTheme: "Manage captions", description: "Delete captions from a video", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "VideoLibrary (detail panel → Delete captions → DeleteModal confirmation)", notes: "Delete with confirmation modal: \"Remove all captions? This action cannot be undone.\"" },
  { id: 38, theme: "Closed Captions", subTheme: "Manage captions", description: "Edit caption text copy within ThankView (not timing)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "VideoLibrary (detail panel → inline caption line editing)", notes: "Line-by-line caption text editing in the detail panel. Each line has an editable text field. Timing is displayed but not editable per spec." },
  { id: 39, theme: "Closed Captions", subTheme: "Display", description: "Auto-show captions by default; viewers can turn off", priority: "MUST HAVE", designReview: "N/A to Design", status: "n/a", where: "—", notes: "Marked N/A to Design. Runtime behavior for the viewer-facing landing page. The notes suggest making this always-on with no toggle, so no UI needed." },
  { id: 40, theme: "Managing Videos", subTheme: "Video Folders", description: "Create, rename, and/or delete Video Folders", priority: "MUST HAVE", designReview: "Needs Work", status: "done", where: "VideoLibrary (folder sidebar with create/rename/delete)", notes: "Folder sidebar with + New Folder button, inline rename, and delete. Design review flagged \"Needs Work\"." },
  { id: 41, theme: "Managing Videos", subTheme: "Actions", description: "Archive a single video", priority: "MUST HAVE", designReview: "Needs Work", status: "done", where: "VideoLibrary (card menu → Archive, detail panel → Archive, ArchiveModal)", notes: "Archive action in card context menu and detail panel. ArchiveModal with confirmation. Unarchive also supported." },
  { id: 42, theme: "Managing Videos", subTheme: "Actions", description: "Archive videos in bulk", priority: "MUST HAVE", designReview: "Needs Work", status: "done", where: "VideoLibrary (bulk action bar → Archive selected)", notes: "Checkbox selection + bulk action bar with Archive button and count-aware ArchiveModal." },
  { id: 43, theme: "Managing Videos", subTheme: "Actions", description: "Move a single video to a folder", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "VideoLibrary (card menu → Move, detail panel → Move, MoveToFolderModal)", notes: "MoveToFolderModal with folder list and selection. Available from card menu and detail panel." },
  { id: 44, theme: "Managing Videos", subTheme: "Actions", description: "Move videos to a folder in bulk", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "VideoLibrary (bulk action bar → Move to Folder)", notes: "Bulk selection + MoveToFolderModal for batch moves." },
  { id: 45, theme: "Managing Videos", subTheme: "Actions", description: "Delete a single video", priority: "MUST HAVE", designReview: "Needs Work", status: "done", where: "VideoLibrary (card menu → Delete, detail panel → Delete, DeleteModal)", notes: "Delete with confirmation modal in card menu and detail panel. Design review flagged \"Needs Work\"." },
  { id: 46, theme: "Managing Videos", subTheme: "Actions", description: "Delete videos in bulk", priority: "", designReview: "Needs Work", status: "done", where: "VideoLibrary (bulk action bar → Delete selected)", notes: "Bulk delete with DeleteModal confirmation showing count." },
  { id: 47, theme: "Managing Videos", subTheme: "Actions", description: "Favorite a video", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "VideoLibrary (card menu → Favorite, card heart icon, detail panel)", notes: "Heart/Star toggle on card overlay and in card context menu. Favorited filter in FilterBar." },
  { id: 48, theme: "Managing Videos", subTheme: "Actions", description: "Duplicate a video", priority: "", designReview: "Pass", status: "done", where: "VideoLibrary (card menu → Duplicate)", notes: "Duplicate action in card context menu. Creates a copy with \"(Copy)\" suffix." },
  { id: 49, theme: "Searching / Filtering", subTheme: "View modes", description: "Grid or table view for videos", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "VideoLibrary (ViewToggle component, grid/list rendering)", notes: "ViewToggle component with Grid and List icons. Grid shows cards; List shows a table with columns." },
  { id: 50, theme: "Searching / Filtering", subTheme: "Search", description: "Search for a video by video title", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "VideoLibrary (search input in header)", notes: "Search input filters videos by title (case-insensitive)." },
  { id: 51, theme: "Searching / Filtering", subTheme: "Filter", description: "Search or filter for a video by video tags", priority: "", designReview: "\"Not ideal, but good enough for Jul 31\"", status: "done", where: "VideoLibrary (FilterBar → tag filter)", notes: "Tag filter in FilterBar component with multi-select. Design review noted it's functional but not ideal." },
  { id: 52, theme: "Searching / Filtering", subTheme: "Filter", description: "Filter videos based on the video creator", priority: "MUST HAVE", designReview: "Needs Work", status: "done", where: "VideoLibrary (FilterBar → creator filter)", notes: "Creator filter with list of unique creators. Design review flagged \"Needs Work\"." },
  { id: 53, theme: "Searching / Filtering", subTheme: "Filter", description: "Filter videos based on if they are a reply or not", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "VideoLibrary (FilterBar → reply status filter)", notes: "Reply filter with All / Replies / Non-replies options." },
  { id: 54, theme: "Searching / Filtering", subTheme: "Filter", description: "Filter videos based on archived status", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "VideoLibrary (archived filter toggle)", notes: "Archived filter with Active / Archived / All options." },
  { id: 55, theme: "Searching / Filtering", subTheme: "Filter", description: "Filter videos based on \"favorite\" status", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "VideoLibrary (FilterBar → favorites filter)", notes: "Favorites toggle filter in FilterBar." },
  { id: 56, theme: "Searching / Filtering", subTheme: "Sort", description: "Sort videos by Date Created, Title, Date Modified, Video Duration", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "VideoLibrary (sort dropdown with all 4 options + asc/desc)", notes: "Full sort with all 4 keys and ascending/descending toggle." },
  { id: 57, theme: "1:1 Video", subTheme: "Constituent selection", description: "Select a list of constituents to record videos for in back-to-back succession", priority: "", designReview: "Needs Work", status: "done", where: "PersonalizedRecorder (contact picker with filters, list import, mid-session add)", notes: "Full contact picker with search, tag/giving-level filters, saved list import, select all, and mid-session \"+ Add Contacts\" popup." },
  { id: 58, theme: "1:1 Video", subTheme: "Rapid recording", description: "Quickly record one video after another for a large list of constituents", priority: "", designReview: "Needs Work", status: "done", where: "PersonalizedRecorder (auto-advance, queue sidebar, keyboard shortcuts)", notes: "Contact queue sidebar with progress bar. Auto-advance toggle with countdown. Keyboard shortcuts (Space to record/stop, → to advance). Prominent contact name overlay on camera." },
  { id: 59, theme: "1:1 Video", subTheme: "Send as 1:1", description: "Every library video can be sent as a 1:1 (copy link → email thumbnail → landing page)", priority: "", designReview: "Pass", status: "done", where: "VideoLibrary (SendAsOneToOneDrawer, card menu \"Send as 1:1\", detail panel 1:1 link section)", notes: "\"Send as 1:1\" in every card's context menu. Right drawer with video preview, email thumbnail preview, contact picker, batch send. Detail panel shows 1:1 link with copy + email thumbnail preview card." },
  { id: 60, theme: "1:1 Video", subTheme: "Landing page", description: "Default landing page settings per portal, editable per video", priority: "", designReview: "Needs Work", status: "done", where: "PersonalizedRecorder (landing page builder with envelope picker, headline, CTA, brand color, toggles, live preview)", notes: "Full landing page builder with envelope design picker, headline/subheadline/body, CTA button, accent color, reply form toggle, fund context, logo options, and responsive desktop/tablet/mobile preview. Default config (DEFAULT_LP_CONFIG) acts as portal default. Design review flagged \"Needs Work\"." },
  { id: 61, theme: "1:1 Video", subTheme: "Links management", description: "View and/or export a list of each library video's title, creator, and 1:1 video link", priority: "", designReview: "Pass", status: "done", where: "VideoLibrary (1:1 Links drawer with table, per-row copy/send, CSV export via ExportModal)", notes: "Dedicated 1:1 Links drawer accessible from header. Shows table with title, creator, link. Per-row copy and send actions. Export modal generates CSV." },
  { id: 62, theme: "1:1 Video", subTheme: "Metrics", description: "View and/or export 1:1 performance metrics (views, CTA %, watch start/complete %, avg duration)", priority: "", designReview: "Pass", status: "done", where: "VideoLibrary (ExportModal with includeMetrics toggle)", notes: "ExportModal includes a toggle for performance metrics. When enabled, CSV includes: Total Views, Open Rate, Click Rate, Reply Count/Rate, CTA Interactions/%, Started Watching/%, Watched Full/%, Avg Duration. Uses simulated data." },
];

/* ── Status config ── */
const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  done:    { label: "Done",    color: TV.success, bg: TV.successBg, icon: CheckCircle2 },
  partial: { label: "Partial", color: TV.warning, bg: TV.warningBg, icon: AlertTriangle },
  missing: { label: "Missing", color: TV.danger, bg: TV.dangerBg, icon: XCircle },
  "n/a":   { label: "N/A",     color: "#737373", bg: "#f5f5f5", icon: MinusCircle },
};

const THEME_ORDER = [
  "Adding a New Video",
  "Editing Videos",
  "Closed Captions",
  "Managing Videos",
  "Searching / Filtering",
  "1:1 Video",
];

/* ═══════════════════════════════════════════════
   HARDCODED SETTINGS REQUIREMENTS
   ═══════════════════════════════════════════════ */
const SETTINGS_THEME_ORDER = [
  "My Profile",
  "General Portal",
  "Email & SMS",
  "DNS Setup",
  "Manage Users",
  "Notifications",
  "Video & Recording",
  "1:1 Video Settings",
  "Subscription & Billing",
];

const SETTINGS_REQUIREMENTS: Requirement[] = [
  { id: 1, theme: "My Profile", subTheme: "Profile Info", description: "Edit first name, last name, and job title with save confirmation", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings (ProfileTab → TextInput + Select for job title)", notes: "First/last name TextInputs, job title Select with 20 role options, Save Profile button with toast." },
  { id: 2, theme: "My Profile", subTheme: "Profile Info", description: "Display avatar with initials, email, and current role badge", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings (ProfileTab → avatar header)", notes: "64px circular avatar with initials, email address, and TV Admin badge." },
  { id: 3, theme: "My Profile", subTheme: "Password", description: "Change password with current/new/confirm validation", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings (ProfileTab → password section)", notes: "Expandable password form with PasswordInput fields. Validates match and minimum 8 chars." },
  { id: 4, theme: "My Profile", subTheme: "Security", description: "Enable/disable SMS-based two-step verification", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Settings (ProfileTab → 2FA section)", notes: "Multi-step flow: Enter phone → Send code → Verify 6-digit code. Active state shows masked phone." },
  { id: 5, theme: "General Portal", subTheme: "Organization", description: "Edit organization name with description", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings (GeneralTab → org name TextInput)", notes: "Organization name TextInput with description 'This is what appears in the org switcher.'" },
  { id: 6, theme: "General Portal", subTheme: "Organization", description: "Display organization slug (read-only, non-editable)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings (GeneralTab → slug display)", notes: "Read-only slug display: hartwell.thankview.com. 'Slug cannot be changed. Contact support to update.'" },
  { id: 7, theme: "General Portal", subTheme: "Organization", description: "Edit organization URL (linked from landing page logo)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings (GeneralTab → URL TextInput)", notes: "TextInput with description explaining recipients are taken to this URL when clicking logo." },
  { id: 8, theme: "General Portal", subTheme: "Branding", description: "Upload/replace organization logo with preview", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings (GeneralTab → logo upload)", notes: "96px logo preview with Upload/Replace button. Accepts PNG or SVG, recommended 200x80px." },
  { id: 9, theme: "General Portal", subTheme: "SSO", description: "Microsoft SSO toggle with configuration guidance", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Settings (GeneralTab → SSO section)", notes: "Microsoft-only SSO toggle with contextual info card. Links to help center setup guide." },
  { id: 10, theme: "Email & SMS", subTheme: "Domains", description: "View verified email sending domains with status badges", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings (EmailSmsTab → domain list)", notes: "List of domains with green dot and 'Verified' badge." },
  { id: 11, theme: "Email & SMS", subTheme: "Domains", description: "Add custom domain via modal with DNS TXT record instructions", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings (EmailSmsTab → Add Custom Domain modal)", notes: "Modal with DNS TXT record details (Type, Host, Value) and domain TextInput." },
  { id: 12, theme: "Email & SMS", subTheme: "SMS", description: "Display SMS area code with location context", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Settings (EmailSmsTab → SMS area code display)", notes: "Read-only display: +1 (617) Boston, MA. Contact support to update." },
  { id: 13, theme: "DNS Setup", subTheme: "Domain Management", description: "Add sending domain with step-by-step DNS record generation", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings (DnsSetupTab → Add Domain modal)", notes: "Modal with domain TextInput and 3-step 'What happens next' guide." },
  { id: 14, theme: "DNS Setup", subTheme: "Domain Management", description: "View required DNS records per domain (TXT, CNAME, SPF)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings (DnsSetupTab → expandable DNS records per domain)", notes: "4 records (TXT verify, CNAME bounce, CNAME DKIM, TXT SPF) with copy buttons and purpose labels." },
  { id: 15, theme: "DNS Setup", subTheme: "Domain Management", description: "Re-check domain verification status", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Settings (DnsSetupTab → RefreshCw ActionIcon per pending domain)", notes: "Re-check button visible only for pending domains." },
  { id: 16, theme: "DNS Setup", subTheme: "Domain Management", description: "Set default domain when multiple domains configured", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Settings (DnsSetupTab → Star ActionIcon per non-default domain)", notes: "Star icon to set default. Only visible when multiple domains exist." },
  { id: 17, theme: "DNS Setup", subTheme: "Domain Management", description: "Remove domain with confirmation modal", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Settings (DnsSetupTab → Trash2 ActionIcon → Remove modal)", notes: "Remove with confirmation modal. Falls back to default domain or @mail-et.com." },
  { id: 18, theme: "DNS Setup", subTheme: "Fallback", description: "Display fallback sending domain info (@mail-et.com)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings (DnsSetupTab → Fallback Sending Domain section)", notes: "Info section explaining @mail-et.com as pre-warmed shared domain." },
  { id: 19, theme: "Manage Users", subTheme: "User List", description: "View user table with name, email, role, domain, status, last login", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings (UsersTab → desktop Table + mobile cards)", notes: "Responsive: desktop table with columns; mobile card layout. Badge count in header." },
  { id: 20, theme: "Manage Users", subTheme: "User List", description: "Invite new user via modal with email and role selection", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings (UsersTab → Invite User button → InviteModal)", notes: "Modal with email TextInput and 4 role option cards with descriptions." },
  { id: 21, theme: "Manage Users", subTheme: "User Actions", description: "Change user role via modal with role cards", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings (UsersTab → user menu → Change Role modal)", notes: "Modal showing user avatar/email, 4 role cards, 'Current' badge on active role." },
  { id: 22, theme: "Manage Users", subTheme: "User Actions", description: "Assign per-user sending domain (verified domains only)", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Settings (UsersTab → user menu → Assign Domain modal)", notes: "'Use Organization Default' option + each verified domain. Warning for pending domains." },
  { id: 23, theme: "Manage Users", subTheme: "User Actions", description: "Resend invite for pending users", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Settings (UsersTab → user menu → Resend Invite)", notes: "Menu item visible only for 'Pending' status users." },
  { id: 24, theme: "Manage Users", subTheme: "User Actions", description: "Remove user from organization", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings (UsersTab → user menu → Remove User)", notes: "Destructive red menu item. Removes user from list with toast." },
  { id: 25, theme: "Manage Users", subTheme: "Permissions", description: "Role permissions matrix with 11 permission keys across 4 roles", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Settings (UsersTab → collapsible Role Permissions Matrix)", notes: "Expandable table: 11 permissions × 4 roles. Collapsed by default." },
  { id: 26, theme: "Notifications", subTheme: "In-App", description: "Toggle in-app notifications (campaign sent, reply, video processed, digest, failure)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings (NotificationsTab → In-App Notifications section)", notes: "5 toggle rows with label and description." },
  { id: 27, theme: "Notifications", subTheme: "Email", description: "Toggle email notifications (8 categories including billing, exports, team invites)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings (NotificationsTab → Email Notifications section)", notes: "8 toggle rows: Reply Forwarding, Campaign Complete, Export Ready, Team Invite, Digest, Delivery, Billing, New Constituent." },
  { id: 28, theme: "Video & Recording", subTheme: "Recording Defaults", description: "Set default recording resolution (480p / 720p / 1080p)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings (VideoTab → resolution picker)", notes: "3-button picker (480p Standard / 720p HD / 1080p Full HD)." },
  { id: 29, theme: "Video & Recording", subTheme: "Recording Defaults", description: "Script / teleprompter toggle (org-wide default)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings (VideoTab → teleprompter ToggleRow)", notes: "Toggle to allow users to type a script visible on-screen while recording." },
  { id: 30, theme: "Video & Recording", subTheme: "Recording Defaults", description: "Background blur toggle", priority: "COULD HAVE", designReview: "Pass", status: "done", where: "Settings (VideoTab → bgBlur ToggleRow)", notes: "Toggle to allow users to blur background during desktop recording." },
  { id: 31, theme: "Video & Recording", subTheme: "Recording Defaults", description: "Virtual background toggle with default org background upload", priority: "COULD HAVE", designReview: "Pass", status: "done", where: "Settings (VideoTab → virtual bg toggle + upload)", notes: "Toggle with conditional upload zone for default org background image." },
  { id: 32, theme: "Video & Recording", subTheme: "Outro", description: "Default outro enable/disable with clip selection and upload", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Settings (VideoTab → Default Outro section)", notes: "Enable toggle + Select dropdown with 3 outros + upload new outro zone." },
  { id: 33, theme: "Video & Recording", subTheme: "Captions", description: "AI closed captioning toggle (org-wide)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings (VideoTab → AI captioning toggle)", notes: "Sparkles icon." },
  { id: 34, theme: "Video & Recording", subTheme: "Captions", description: "Human-written captions (REV) toggle with credit balance and auto-renew", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Settings (VideoTab → REV captions toggle + credits)", notes: "Paid badge. Credit balance display, auto-renew toggle, timing note." },
  { id: 35, theme: "Video & Recording", subTheme: "Captions", description: "Caption download and edit toggles", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Settings (VideoTab → captionEdit + captionDownload ToggleRows)", notes: "Edit Captions In-App, Caption Download (VTT/SRT). Footer note about manual upload." },
  { id: 36, theme: "Video & Recording", subTheme: "Library Defaults", description: "Default video library view (grid/table) and sort order", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Settings (VideoTab → SegmentedControl + Select)", notes: "SegmentedControl for grid/table. Select for sort order (4 options)." },
  { id: 37, theme: "Video & Recording", subTheme: "Library Defaults", description: "Video tags, custom thumbnails, combine/splice, auto-convert toggles", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Settings (VideoTab → 4 ToggleRows with usage stats)", notes: "Tags, Thumbnails, Combine, Auto-Convert 4:3 toggle rows." },
  { id: 38, theme: "1:1 Video Settings", subTheme: "Landing Page", description: "Default accent color with presets and custom color picker", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Settings (OneToOneTab → accent color presets + custom picker)", notes: "5 preset swatches + custom color input with check icon on selection." },
  { id: 39, theme: "1:1 Video Settings", subTheme: "Landing Page", description: "Default CTA button text configuration", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Settings (OneToOneTab → CTA TextInput)", notes: "TextInput for the primary button text on the landing page." },
  { id: 40, theme: "1:1 Video Settings", subTheme: "Landing Page", description: "Show CTA and Show Reply Form toggles", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Settings (OneToOneTab → 2 ToggleRows)", notes: "Toggle CTA button and reply/comment form visibility on 1:1 landing page." },
  { id: 41, theme: "1:1 Video Settings", subTheme: "Landing Page", description: "Live mini preview of landing page configuration", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Settings (OneToOneTab → mini preview card)", notes: "280px preview showing accent color bar, video, CTA, reply form. Updates in real-time." },
  { id: 42, theme: "1:1 Video Settings", subTheme: "Links", description: "Link format selection (short link vs full URL) with examples", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Settings (OneToOneTab → link format picker)", notes: "Short Link (tv.ht/abc123) vs Full URL (thankview.com/hartwell/v/abc123)." },
  { id: 43, theme: "1:1 Video Settings", subTheme: "Links", description: "View tracking toggle and link expiration setting", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Settings (OneToOneTab → tracking toggle + expiry Select)", notes: "View tracking toggle. Expiration: Never / 30d / 90d / 1yr." },
  { id: 44, theme: "1:1 Video Settings", subTheme: "Metrics", description: "1:1 video metrics toggles (views, CTA, watch completion, avg duration)", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Settings (OneToOneTab → 4 metrics ToggleRows)", notes: "Total Views, CTA Interactions, Watch Completion, Average View Duration." },
  { id: 45, theme: "Subscription & Billing", subTheme: "Plan", description: "View current subscription plan details (name, price, renewal date)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings (SubscriptionTab → plan card)", notes: "ThankView Pro, Active badge, annual billing, renewal date." },
  { id: 46, theme: "Subscription & Billing", subTheme: "Plan", description: "View usage stats (users included, videos this period, storage used)", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Settings (SubscriptionTab → usage SimpleGrid)", notes: "Usage stats grid showing users included, videos this period, and storage used." },
  { id: 47, theme: "Subscription & Billing", subTheme: "Payment", description: "View and update payment method (credit card on file)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings (SubscriptionTab → payment card + Update Card modal)", notes: "Visa •••• 4242 display. Modal with card name, number, expiry, CVC, ZIP." },
  { id: 48, theme: "Subscription & Billing", subTheme: "History", description: "View billing history table with date, description, amount, status", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Settings (SubscriptionTab → billing history Table)", notes: "Striped table with 4 charges. 'Paid' badges. Footer with billing contact." },
];

/* ═══════════════════════════════════════════════
   HARDCODED CAMPAIGNS REQUIREMENTS
   ═══════════════════════════════════════════════ */
/* Theme order: foundational/standalone builders first, then content plumbing,
   then campaign types, then recipient/video flows, then send/management last.
   This way fixing a builder cascades into all campaign features that reference it. */
const CAMPAIGNS_THEME_ORDER = [
  // ── Standalone Builders (fix these first — cascades into campaign design step) ──
  "Envelope Builder",
  "Landing Page Builder",
  // ── Core Content Plumbing (email fields, RTE, merge fields) ──
  "Content Creation",
  "Content Creation Envelopes",
  "Content Creation Landing Pages",
  // ── Preview Layer (depends on content being built) ──
  "Email / SMS / Landing Page Previews",
  // ── Campaign Setup & Types ──
  "Campaign Channel",
  "Standard Campaign Types",
  "Birthday / Anniversary Type",
  "Career Moves Type",
  "Video Request Campaigns",
  // ── Video Assets (standalone, used by campaign video step) ──
  "Adding Videos to Campaigns Video Intros",
  "Adding Videos to Campaigns Video Outros",
  "Adding Videos to Campaigns Video Overlays",
  "Adding Videos to Campaigns Video Clips",
  // ── Recipients (depends on contacts system) ──
  "Add Recipients to Campaigns",
  // ── Campaign Management (display/filter/actions — depends on campaigns existing) ──
  "Campaign Data",
  "Searching / Filtering through Campaigns",
  "Take Actions on Campaigns",
  // ── Send Flow (depends on content + recipients + video all working) ──
  "Sending Campaigns",
  "Resending Campaigns",
  // ── Lowest Priority (1% usage, depends on recipients + video) ──
  "Assign Tasks",
];

const CAMPAIGNS_REQUIREMENTS: Requirement[] = [
  { id: 1, theme: "Envelope Builder", subTheme: "", description: "Users can, and must, name an envelope in order to save it", priority: "—", designReview: "Pass", status: "done", where: "EnvelopeBuilderModal, EnvelopeBuilder", notes: "" },
  { id: 2, theme: "Envelope Builder", subTheme: "", description: "Users can select the color for the outer portion of their envelope via hex code", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "EnvelopeBuilderModal, EnvelopeBuilder", notes: "" },
  { id: 3, theme: "Envelope Builder", subTheme: "", description: "Users can select their envelope liner color via hex code", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "EnvelopeBuilderModal, EnvelopeBuilder", notes: "" },
  { id: 4, theme: "Envelope Builder", subTheme: "", description: "Users can select what color the copy on their envelope will be, via hex code", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "EnvelopeBuilder (Recipient Name Color SwatchRow)", notes: "" },
  { id: 5, theme: "Envelope Builder", subTheme: "", description: "Users can choose \"Single Swoop\" for the front design of their envelope + select the color of the swoop via hex code", priority: "—", designReview: "Pass", status: "done", where: "EnvelopeBuilder (Single Swoop radio + Swoop Color SwatchRow)", notes: "" },
  { id: 6, theme: "Envelope Builder", subTheme: "", description: "Users can choose \"Double Swoop\" for the front design of their envelope + select the colors for the swoops via hex code", priority: "—", designReview: "Pass", status: "done", where: "EnvelopeBuilder (Double Swoop radio + 2 SwatchRow hex inputs)", notes: "" },
  { id: 7, theme: "Envelope Builder", subTheme: "", description: "Users can choose \"Single Stripe\" for the front design of their envelope + select the color of the stripe via hex code", priority: "—", designReview: "Pass", status: "done", where: "EnvelopeBuilder (Single Stripe radio + Stripe Color SwatchRow)", notes: "" },
  { id: 8, theme: "Envelope Builder", subTheme: "", description: "Users can choose \"Double Stripe\" for the front design of their envelope + select the colors for the stripes via hex code", priority: "—", designReview: "Pass", status: "done", where: "EnvelopeBuilder (Double Stripes radio + 2 SwatchRow hex inputs)", notes: "" },
  { id: 9, theme: "Envelope Builder", subTheme: "", description: "Users can choose \"Triple Stripe\" for the front design of their envelope + select the colors for the stripes via hex code", priority: "—", designReview: "Pass", status: "done", where: "EnvelopeBuilder (Triple Stripes radio + 2 SwatchRow hex inputs)", notes: "" },
  { id: 10, theme: "Envelope Builder", subTheme: "", description: "Users can choose \"Air Mail Stripe\" for the front design of their envelope + select the colors for the stripes via hex code", priority: "—", designReview: "Pass", status: "done", where: "EnvelopeBuilder (Air Mail Stripe radio + 2 SwatchRow hex inputs)", notes: "" },
  { id: 11, theme: "Envelope Builder", subTheme: "", description: "Users can choose to add a logo to the top left of the front of their envelope", priority: "—", designReview: "Pass", status: "done", where: "EnvelopeBuilder (Logos tab → Front Left Logo: upload, drag & drop, recently used, presets)", notes: "" },
  { id: 12, theme: "Envelope Builder", subTheme: "", description: "Users can choose to add a logo to the outer back flap of their envelope", priority: "—", designReview: "Pass", status: "done", where: "EnvelopeBuilder (Logos tab → Back Flap Logo: upload, drag & drop, recently used, presets)", notes: "" },
  { id: 13, theme: "Envelope Builder", subTheme: "", description: "Users can choose to have a black, white, or no postmark", priority: "—", designReview: "Pass", status: "done", where: "EnvelopeBuilder (Marks tab → No postmark / Black Postmark / White Postmark radios)", notes: "" },
  { id: 14, theme: "Envelope Builder", subTheme: "", description: "Users can choose to add up to 40 characters of text in their postmark", priority: "—", designReview: "Pass", status: "done", where: "EnvelopeBuilder (Marks tab → postmark text input, 40-char limit with counter)", notes: "" },
  { id: 15, theme: "Envelope Builder", subTheme: "", description: "Users can choose to add an image to the stamp on their envelope", priority: "—", designReview: "Pass", status: "done", where: "EnvelopeBuilder (Marks tab → stamp image upload, drag & drop, style picker)", notes: "" },
  { id: 16, theme: "Landing Page Builder", subTheme: "", description: "Users can, and must, name a landing page in order to save it", priority: "—", designReview: "Fail", status: "done", where: "LandingPageBuilder + LandingPageBuilderModal (name required with validation)", notes: "" },
  { id: 17, theme: "Landing Page Builder", subTheme: "", description: "Users can update the color of the header on their landing page via hex code", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "LandingPageBuilder (ColorField hex input + native color picker for Navigation Bar Color)", notes: "" },
  { id: 18, theme: "Landing Page Builder", subTheme: "", description: "Users can add a logo to their landing page", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "LandingPageBuilder (Organization Logo: upload, preset icons, file input)", notes: "" },
  { id: 19, theme: "Landing Page Builder", subTheme: "", description: "Users can add a background image to their landing page", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "LandingPageBuilder (Your Background section: image upload, presets grid, solid colors, gradient toggle)", notes: "" },
  { id: 20, theme: "Landing Page Builder", subTheme: "", description: "Any image imported as a landing page background must be named and will automatically be saved so it can be used for future landing page creation as well.", priority: "MUST HAVE", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
  { id: 21, theme: "Landing Page Builder", subTheme: "", description: "Users can delete and/or rename previously imported landing page background images from the landing page builder area.", priority: "—", designReview: "N/A to Design", status: "n/a", where: "", notes: "There needs to be some area to remove / edit these. It seems like the assets / templates page would be better" },
  { id: 22, theme: "Landing Page Builder", subTheme: "", description: "Users can choose to remove the fade to white gradient that applies to the bottom of landing page images.", priority: "SHOULD HAVE, COULD HAVE", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
  { id: 23, theme: "Content Creation", subTheme: "", description: "The rich text editor allows for everything the Signal RTE supports. Including but not necessarily limited to: - bold, italics, underline, adding links, adjusting text alignment, bullets, indentation, inputting rich text email templates, inputting signature templates, inputting impages", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "RichTextEditor (toolbar: B/I/U/Strikethrough, Link, Image, Align L/C/R/J, UL/OL, Indent/Outdent, Templates, Signatures)", notes: "" },
  { id: 24, theme: "Content Creation", subTheme: "", description: "The rich text editor allows for users to insert a merge field. Fields supported include all TV contact fields + the campaign notes field + any custom field.", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "RichTextEditor → MergeFieldPicker (100+ fields across 10 categories, searchable, favorites, contact/campaign/custom fields)", notes: "" },
  { id: 25, theme: "Content Creation", subTheme: "", description: "The rich text editor supports emojis", priority: "COULD HAVE", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
  { id: 26, theme: "Content Creation", subTheme: "", description: "If merge field is inserted into the message or landing page copy somewhere, and a given contact in the campaign does not have a value in that field, the user will get a warning. The user can choose to: 1. Remove impacted contact(s) from the campaign 2. Adjust their message to not include the offe...", priority: "—", designReview: "Pass", status: "done", where: "MergeFieldValidation (warning banner with per-field resolution: remove field, skip contacts, or set fallback text)", notes: "Note: The current TV process results in the whole campaign not being able to be sent until a value is added in the relevant field for the relevant contact. This doesn't work well considering that s..." },
  { id: 27, theme: "Content Creation", subTheme: "", description: "In the main content of the email/sms/landing page, a user will be able to write an AI prompt in order to have an AI write the content in this area for them. The UX will include: - A way to \"stop\" the AI's writing progress - A way to have the AI \"try again\" with the same prompt - An error stat...", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "AIWritingPopover (prompt input, streaming with stop, try again, error state, insert/discard)", notes: "" },
  { id: 28, theme: "Content Creation", subTheme: "", description: "Users can define the Sender Name", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "MultiStepBuilder (Sender Name input with char count + merge field insertion)", notes: "" },
  { id: 29, theme: "Content Creation", subTheme: "", description: "Users can define the Sender Email Address", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "MultiStepBuilder (Sender Email input field)", notes: "" },
  { id: 30, theme: "Content Creation", subTheme: "", description: "Users can define the \"reply to\" Email Address", priority: "—", designReview: "Pass", status: "done", where: "MultiStepBuilder (Reply-To input with email validation, pill chips, multiple allowed)", notes: "" },
  { id: 31, theme: "Content Creation", subTheme: "", description: "Users can add multiple email addresses in the \"reply to\" area", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "MultiStepBuilder (Reply-To field supports multiple emails via pill chips, Enter/comma to add)", notes: "" },
  { id: 32, theme: "Content Creation", subTheme: "", description: "Email subject Lines can include emjois (not available for SMS)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "MultiStepBuilder (EmojiDropdown in subject line toolbar)", notes: "" },
  { id: 33, theme: "Content Creation", subTheme: "", description: "Email subject Lines can include merge fields", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "MultiStepBuilder (MergeFieldDropdown in subject line toolbar)", notes: "" },
  { id: 34, theme: "Content Creation", subTheme: "", description: "Users can select the font they want used for their campaign", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "MultiStepBuilder (font select dropdown + bodyFontFamily picker)", notes: "" },
  { id: 35, theme: "Content Creation", subTheme: "", description: "For content, users can choose to include a static thumbnail", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 36, theme: "Content Creation", subTheme: "", description: "For content, users can choose to include an Envelope", priority: "MUST HAVE", designReview: "Fail", status: "done", where: "DesignStepPanel (envelope display type option)", notes: "" },
  { id: 37, theme: "Content Creation", subTheme: "", description: "For content, users can choose to include an animated thumbnail", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "MultiStepBuilder + DesignStepPanel (Animated Thumbnail option with GIF autoplay)", notes: "" },
  { id: 38, theme: "Content Creation", subTheme: "", description: "Users can specify the button text & background colors (via hexcodes) for buttons on emails & landing pages", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "LandingPageBuilder (ColorField hex inputs for CTA/secondary/reply/save/share buttons) + PersonalizedRecorder", notes: "" },
  { id: 39, theme: "Content Creation", subTheme: "", description: "Users will be able to select the language they want their email unsubscribe verbage to be in, and we will translate the unsubscribe messaging into this language.", priority: "COULD HAVE", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
  { id: 40, theme: "Content Creation", subTheme: "", description: "Users should have the option to add a Tracking Pixel to their landing page", priority: "COULD HAVE", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
  { id: 41, theme: "Content Creation Envelopes", subTheme: "", description: "If a user chooses to use an envelope for their campaign, they should be able to use an envelope that was custom created for their organization (e.g. \"Branded\" category envelope)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 42, theme: "Content Creation Envelopes", subTheme: "", description: "If a user chooses to use an envelope for their campaign, they should be able to use one of ThankView's pre-designed legacy or holiday envelopes", priority: "SHOULD HAVE", designReview: "N/A to Design", status: "n/a", where: "", notes: "If we do use these, I suggest we only rebuild the most commonly used ones. All non-recreated envelopes would be read-only." },
  { id: 43, theme: "Content Creation Envelopes", subTheme: "", description: "When looking for an envelope, users should be able to use a search input to search through all the envelope options", priority: "MUST HAVE", designReview: "N/A to Design", status: "n/a", where: "", notes: "This will be true if we continue to offer the legacy and holiday envelopes." },
  { id: 44, theme: "Content Creation Envelopes", subTheme: "", description: "Any previously created envelopes that were sent out with campaigns will continue to work. This means if a recipient opens an old TV email or views an old TV landing page for a campaign that used an envelope, they should still see the envelope as it was before.", priority: "MUST HAVE", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
  { id: 45, theme: "Content Creation Envelopes", subTheme: "", description: "In the new app, users will see all of their previously created \"branded\" envelopes, and they will be able to edit and/or use those previously created envelopes for future campaigns", priority: "—", designReview: "N/A to Design", status: "n/a", where: "", notes: "Previously created branded envelopes should remain available for reuse in future campaigns." },
  { id: 46, theme: "Content Creation Envelopes", subTheme: "", description: "User can add text BEFORE the name area on an envelope & choose for that text to show on the same line as the name, or a line above it - This text supports merge fields & emoji", priority: "MUST HAVE", designReview: "Fail", status: "done", where: "DesignStepPanel → EnvelopePreview", notes: "" },
  { id: 47, theme: "Content Creation Envelopes", subTheme: "", description: "User can add text AFTER the name area on an envelope & choose for that text to show on the same line as the name, or a line above it - This text supports merge fields & emoji", priority: "MUST HAVE", designReview: "Fail", status: "done", where: "DesignStepPanel → EnvelopePreview", notes: "" },
  { id: 48, theme: "Content Creation Landing Pages", subTheme: "", description: "Users can select which landing page they'd like to use for a given campaign.", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "DesignStepPanel (LandingPageSection grid picker)", notes: "" },
  { id: 49, theme: "Content Creation Landing Pages", subTheme: "", description: "When looking for a landing page, users should be able to use a search input to search through all the landing page options", priority: "SHOULD HAVE", designReview: "Pass", status: "n/a", where: "", notes: "" },
  { id: 50, theme: "Content Creation Landing Pages", subTheme: "", description: "Users will be able to choose not to add any \"attachment\" (cta button, pdf, form, or thanksgiving campaign to their landing page)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "DesignStepPanel (None option in attachment type selector)", notes: "" },
  { id: 51, theme: "Content Creation Landing Pages", subTheme: "", description: "Users will be able to choose a CTA button for their landing page module, and they'll be able to select the text & URL for the button", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "DesignStepPanel (CTA & Page Content section — link, text, color controls)", notes: "" },
  { id: 52, theme: "Content Creation Landing Pages", subTheme: "", description: "Users will be able to choose a PDF embed for their landing page module, and they'll be able to upload a PDF & choose if it can be shared from the landing page or not. Recipients will be able to view, or download the PDF (and share it if the sender allows)", priority: "SHOULD HAVE", designReview: "Needs Work", status: "n/a", where: "", notes: "" },
  { id: 53, theme: "Content Creation Landing Pages", subTheme: "", description: "Users will be able to choose a form embed for their landing page module, and they'll be able to paste in a link to their form (Givebutter, BoostMySchool, and Typeform all supported)", priority: "COULD HAVE", designReview: "Needs Work", status: "n/a", where: "", notes: "" },
  { id: 54, theme: "Content Creation Landing Pages", subTheme: "", description: "Users will be able to choose \"Link to Thankgiving Campaign\" for their landing page module, and they'll be able to select which Givebutter campagin to tie the landing page to", priority: "COULD HAVE", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
  { id: 55, theme: "Content Creation Landing Pages", subTheme: "", description: "Users should be able to turn off the ability for recipients to respond to their campaign via email", priority: "MUST HAVE", designReview: "Pass", status: "n/a", where: "", notes: "" },
  { id: 56, theme: "Content Creation Landing Pages", subTheme: "", description: "Users should be able to turn off the ability for recipients to respond to their campaign via video", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "DesignStepPanel (allowVideoReply toggle)", notes: "" },
  { id: 57, theme: "Content Creation Landing Pages", subTheme: "", description: "Users should be able to turn off the ability for recipients to download their ThankView video", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "DesignStepPanel (allowDownloadVideo toggle)", notes: "" },
  { id: 58, theme: "Content Creation Landing Pages", subTheme: "", description: "Users should be able to turn off the ability for recipients to share their ThankView", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "DesignStepPanel (allowShareButton toggle)", notes: "" },
  { id: 59, theme: "Content Creation Landing Pages", subTheme: "", description: "If a video shown on a landing page includes closed captions, there will be an area on the landing page where recipients can download these captions (this is not something ThankView users can disable)", priority: "MUST HAVE", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
  { id: 60, theme: "Content Creation Landing Pages", subTheme: "", description: "If a video shown on a landing page includes closed captions, the video player on the landing page will include a tool that allows watchers to turn the closed captions on or off (this is not something ThankView users can disable)", priority: "—", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
  { id: 61, theme: "Content Creation Landing Pages", subTheme: "", description: "Any previously created landing pages that were sent out with campaigns will continue to work. This means if a recipient clicks on a link for an old ThankView landing page, they should still be taken to that landing page and see the content as it was before.", priority: "MUST HAVE", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
  { id: 62, theme: "Content Creation Landing Pages", subTheme: "", description: "In the new app, users will see all of their previously created landing pages, and they will be able to edit and/or use those previously created landing pages for future campaigns", priority: "—", designReview: "N/A to Design", status: "n/a", where: "", notes: "Previously created landing pages should remain available for reuse in future campaigns." },
  { id: 63, theme: "Email / SMS / Landing Page Previews", subTheme: "", description: "Previews of email, sms, and landing pages update in real-time as users make edits / adjustments", priority: "MUST HAVE", designReview: "Needs Work", status: "done", where: "LivePreviewPanel (receives live-updating props from CreateCampaign)", notes: "" },
  { id: 64, theme: "Email / SMS / Landing Page Previews", subTheme: "", description: "For email campaigns, users can preview what an email and landing page will look like on desktop, tablet, or mobile device", priority: "MUST HAVE", designReview: "Needs Work", status: "n/a", where: "", notes: "" },
  { id: 65, theme: "Email / SMS / Landing Page Previews", subTheme: "", description: "For SMS campaigns, users can preview what an SMS and landing page will look like on a tablet or mobile device", priority: "MUST HAVE", designReview: "Needs Work", status: "n/a", where: "", notes: "" },
  { id: 66, theme: "Email / SMS / Landing Page Previews", subTheme: "", description: "Users can preview email, sms, and/or landing pages as a specific campaign recipient (relevant merge fields filled in, in previews in as applicable)", priority: "MUST HAVE", designReview: "Fail", status: "done", where: "LivePreviewPanel (constituent picker with merge field resolution)", notes: "" },
  { id: 67, theme: "Campaign Channel", subTheme: "", description: "Email via Postmark", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 68, theme: "Campaign Channel", subTheme: "", description: "SMS via Twilio", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 69, theme: "Campaign Channel", subTheme: "", description: "Share - Facebook", priority: "COULD HAVE", designReview: "Fail", status: "done", where: "FacebookShareModal (OG preview + share URL)", notes: "Is this referring to the \"sharable link\" option for video request campaigns?" },
  { id: 70, theme: "Standard Campaign Types", subTheme: "", description: "Standard Campaigns - Thank you", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "", notes: "Note for all \"standard Campaign Types\" rows: Moving forward, we will no longer have different \"campaign types\" in ThankView. However, there will be essentially campagin configurations as follow..." },
  { id: 71, theme: "Standard Campaign Types", subTheme: "", description: "Standard Campaigns - Appeals", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 72, theme: "Standard Campaign Types", subTheme: "", description: "Standard Campaigns - Events", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 73, theme: "Standard Campaign Types", subTheme: "", description: "Standard Campaigns - Updates", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 74, theme: "Standard Campaign Types", subTheme: "", description: "Standard Campaigns - Other", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 75, theme: "Standard Campaign Types", subTheme: "", description: "Endowment Campaigns (ODDER)", priority: "—", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 76, theme: "Standard Campaign Types", subTheme: "", description: "Student Engagement", priority: "WON'T HAVE (for this release), COULD HAVE", designReview: "—", status: "n/a", where: "", notes: "What is this?" },
  { id: 77, theme: "Standard Campaign Types", subTheme: "", description: "RNL Engage", priority: "WON'T HAVE (for this release), COULD HAVE", designReview: "—", status: "n/a", where: "", notes: "What is this?" },
  { id: 78, theme: "Birthday / Anniversary Type", subTheme: "", description: "Automated scheduled sends based on birthdate date in future", priority: "MUST HAVE", designReview: "Fail", status: "done", where: "MultiStepBuilder (birthday automation with contact date field)", notes: "In order to continue supporting the previous Birthday & Anniversary campaign flow, users will be able to create automated campaigns triggered by contact date fields." },
  { id: 79, theme: "Birthday / Anniversary Type", subTheme: "", description: "Automated scheduled sends based on anniversary date in future", priority: "SHOULD HAVE", designReview: "Fail", status: "done", where: "MultiStepBuilder (anniversary automation with contact date field)", notes: "" },
  { id: 80, theme: "Birthday / Anniversary Type", subTheme: "", description: "Error handling if missing dates or in wrong format or past", priority: "MUST HAVE", designReview: "Fail", status: "done", where: "MultiStepBuilder (date validation for automation fields)", notes: "" },
  { id: 81, theme: "Career Moves Type", subTheme: "", description: "Career Move Specific Default Text", priority: "COULD HAVE", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
  { id: 82, theme: "Career Moves Type", subTheme: "", description: "MISSING: Tie in with Career Moves files in Signal", priority: "WON'T HAVE (for this release), COULD HAVE", designReview: "Pass", status: "done", where: "", notes: "We'll support this not via a specific campaign \"type\" but through the fact that users will be able to tie the campaign audience to a saved search of \"Got new job withing the last X days\"" },
  { id: 83, theme: "Video Request Campaigns", subTheme: "", description: "New Delivery Type Option: Shareable Link -- Link for landing page is shown in the campaigns creation flow so that user can copy it and share where they like", priority: "MUST HAVE", designReview: "Fail", status: "done", where: "CampaignDetail + MultiStepBuilder (Shareable Link delivery type)", notes: "" },
  { id: 84, theme: "Video Request Campaigns", subTheme: "", description: "Add Recorders (same functionality as recipients but these will record)", priority: "MUST HAVE", designReview: "Fail", status: "done", where: "VRRecorderPanel (video request recorder flow)", notes: "" },
  { id: 85, theme: "Video Request Campaigns", subTheme: "", description: "Send automated reminders with DUE DATE x/days before due date (Can send multiple)", priority: "MUST HAVE", designReview: "Fail", status: "done", where: "MultiStepBuilder (vrReminderDays + vrReminderEnabled)", notes: "" },
  { id: 86, theme: "Video Request Campaigns", subTheme: "", description: "Branded Landing page selection (Does not include builder access)", priority: "MUST HAVE", designReview: "Fail", status: "done", where: "MultiStepBuilder (landingPageId in video request step)", notes: "" },
  { id: 87, theme: "Video Request Campaigns", subTheme: "", description: "Text editor includes default instructions on how to record and recording tips", priority: "COULD HAVE", designReview: "N/A to Design", status: "done", where: "", notes: "" },
  { id: 88, theme: "Video Request Campaigns", subTheme: "", description: "Users can include a video from their video library as part of the \"instructions\" in their video request campaign.", priority: "COULD HAVE", designReview: "N/A to Design", status: "done", where: "", notes: "" },
  { id: 89, theme: "Video Request Campaigns", subTheme: "", description: "Enable | Disable Submissions Link", priority: "MUST HAVE", designReview: "Fail", status: "done", where: "MultiStepBuilder (vrSubmissionsEnabled toggle)", notes: "" },
  { id: 90, theme: "Video Request Campaigns", subTheme: "", description: "When a person submits a video to a video request campaign, these are shown on the campaign \"replies\" page", priority: "MUST HAVE", designReview: "N/A to Design", status: "done", where: "", notes: "There could be a better UX / UI answer to this. If we run out of time though, we can just recreate this flow" },
  { id: 91, theme: "Video Request Campaigns", subTheme: "", description: "All videos that are submitted as a result of video request campaigns, show in the \"replies\" folder in the video library", priority: "MUST HAVE", designReview: "N/A to Design", status: "done", where: "", notes: "There could be a better UX / UI answer to this. If we run out of time though, we can just recreate this flow" },
  { id: 92, theme: "Adding Videos to Campaigns Video Intros", subTheme: "", description: "Users should be able to add an intro that will be applied to all the videos sent out in the given campaign", priority: "MUST HAVE", designReview: "Fail", status: "done", where: "CreateCampaign video step (IntroOutroBuilder)", notes: "" },
  { id: 93, theme: "Adding Videos to Campaigns Video Intros", subTheme: "", description: "For the initial launch, ThankView users will be able to select from at least one of the top nine most used intro themes (Highlighted here in green) to use as an intro for their ThankView campaigns For these intro themes... we will not recreate every intro or intro template that a user has ever ma...", priority: "—", designReview: "Fail", status: "done", where: "IntroOutroBuilder (INTRO_IMAGE_THEMES grid with theme selection)", notes: "" },
  { id: 94, theme: "Adding Videos to Campaigns Video Intros", subTheme: "", description: "Any past intros or intro templates made with an old intro theme (whether it relied on one of the old intro themes we're recreating or not) will continue to be visible when a recipient watches an old video and also visible in the campaign builder.... but the intro will be READ ONLY. This means tha...", priority: "—", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
  { id: 95, theme: "Adding Videos to Campaigns Video Intros", subTheme: "", description: "Once users customize an intro theme for their campaign, they can choose to save that customization as a \"template\" in their portal so it can quickly be re-used in future campaigns", priority: "SHOULD HAVE", designReview: "—", status: "n/a", where: "", notes: "" },
  { id: 96, theme: "Adding Videos to Campaigns Video Intros", subTheme: "", description: "Users can select music from our music library to their intro if desired", priority: "SHOULD HAVE", designReview: "—", status: "n/a", where: "", notes: "" },
  { id: 97, theme: "Adding Videos to Campaigns Video Intros", subTheme: "", description: "Users can import custom music that can be added to intros in their specific portal", priority: "COULD HAVE", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
  { id: 98, theme: "Adding Videos to Campaigns Video Outros", subTheme: "", description: "Users should be able to add an outro that will be applied to all the videos sent out in the given campaign", priority: "MUST HAVE", designReview: "Fail", status: "done", where: "IntroOutroBuilder (outro builder in video step)", notes: "" },
  { id: 99, theme: "Adding Videos to Campaigns Video Outros", subTheme: "", description: "Any past outros or outro templates made within the legacy TV app will continue to be visible when a recipient watches an old video and also visible in the campaign builder.... but the outro will be READ ONLY. This means that a user will not be able to change the image, colors, text, font, music, ...", priority: "—", designReview: "N/A to Design", status: "n/a", where: "", notes: "I'm assuming that it would be ALOT of work for us to reacreate the tens of thousands of existing outros in a way in which they would still be editable. If this is not the case, and this would be a ..." },
  { id: 100, theme: "Adding Videos to Campaigns Video Outros", subTheme: "", description: "Users can choose to save a customized outro as a \"template\" in their portal so it can quickly be re-used in future campaigns", priority: "SHOULD HAVE", designReview: "Fail", status: "done", where: "IntrosAndOutros asset library (save as template)", notes: "" },
  { id: 101, theme: "Adding Videos to Campaigns Video Overlays", subTheme: "", description: "Users should be able to add an overlay to the video clips that will be shown in their campagin", priority: "SHOULD HAVE", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
  { id: 102, theme: "Adding Videos to Campaigns Video Overlays", subTheme: "", description: "Any overlays used in past campaigns will continue to be visible when a recipient watches an old video.", priority: "—", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
  { id: 103, theme: "Adding Videos to Campaigns Video Clips", subTheme: "", description: "There will be a quick way for users to send the same \"final video\" to all recipients in the campaign", priority: "—", designReview: "Pass", status: "done", where: "VideoBuilder (sharedVideo element — 'Video for All Recipients')", notes: "" },
  { id: 104, theme: "Adding Videos to Campaigns Video Clips", subTheme: "", description: "There will be a way for users to include a personalized video clip in the \"final video\" and easily tie this video to one or multiple campaign recipient(s)", priority: "SHOULD HAVE", designReview: "Needs Work", status: "done", where: "VideoBuilder (personalizedClip element + PersonalizedRecorder)", notes: "" },
  { id: 105, theme: "Adding Videos to Campaigns Video Clips", subTheme: "", description: "There will be an easy way for users to be able to search and filter through campaign recipients when determining which recipients will be tied to given \"personalized video clips\".", priority: "SHOULD HAVE", designReview: "Fail", status: "done", where: "PersonalizedRecorder (AddRecipientsPanel pre-session + tag/attribute search mid-session)", notes: "" },
  { id: 106, theme: "Adding Videos to Campaigns Video Clips", subTheme: "", description: "If a personalized video clip has been tied to a recipient, users should have a way to edit / swap it out with a different personalized video clip if they want to.", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "PersonalizedRecorder (Replace/Remove on queue hover + Re-record or Replace main view)", notes: "" },
  { id: 107, theme: "Adding Videos to Campaigns Video Clips", subTheme: "", description: "Users will be able to add an additional video clip into the campaign that will be a part of every campaign recipients \"final video\"", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "VideoTimeline (Add-On Clip segment) + VideoBuilder (addon-clip view)", notes: "" },
  { id: 108, theme: "Add Recipients to Campaigns", subTheme: "", description: "Users can Edit contacts while in the campaign flow", priority: "—", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
  { id: 109, theme: "Add Recipients to Campaigns", subTheme: "", description: "Users can remove contacts from a campaign after they've been added", priority: "—", designReview: "Needs Work", status: "done", where: "AddRecipientsPanel (removeContact per-recipient)", notes: "" },
  { id: 110, theme: "Add Recipients to Campaigns", subTheme: "", description: "Upload CSV (error handling and notifications)", priority: "—", designReview: "Needs Work", status: "done", where: "CSVImportWizard (4-step upload with field mapping)", notes: "" },
  { id: 111, theme: "Add Recipients to Campaigns", subTheme: "", description: "Add Manually (via in app form)", priority: "—", designReview: "Needs Work", status: "done", where: "RecipientSourcePicker (Browse tab for manual search/add)", notes: "" },
  { id: 112, theme: "Add Recipients to Campaigns", subTheme: "", description: "Add from Contacts", priority: "—", designReview: "Needs Work", status: "done", where: "RecipientSourcePicker (Browse Individuals tab)", notes: "" },
  { id: 113, theme: "Add Recipients to Campaigns", subTheme: "", description: "Add From Lists", priority: "—", designReview: "Needs Work", status: "done", where: "RecipientSourcePicker (Lists and Saved Searches tabs)", notes: "" },
  { id: 114, theme: "Add Recipients to Campaigns", subTheme: "", description: "Import from BB RE NXT (w/ Field Mapping) (requires integration enabled)", priority: "—", designReview: "Come back to review this Kelley!", status: "n/a", where: "", notes: "Depends on how many of our customers are using this" },
  { id: 115, theme: "Add Recipients to Campaigns", subTheme: "", description: "Import from Salesforce (w/ Field mapping) (required integration enabled)", priority: "—", designReview: "—", status: "n/a", where: "", notes: "Depends on how many of our customers are using this" },
  { id: 116, theme: "Add Recipients to Campaigns", subTheme: "", description: "Import from Bloomerang (w/field mapping) (requires integration enabled)", priority: "—", designReview: "—", status: "n/a", where: "", notes: "Depends on how many of our customers are using this" },
  { id: 117, theme: "Add Recipients to Campaigns", subTheme: "", description: "When a user adds a list of recipients to the campaign, at some point they'll be able to see a table of those recipients in the campaign experience", priority: "—", designReview: "Needs Work", status: "done", where: "CampaignDetail (constituents_list table with status, delivery, replies)", notes: "" },
  { id: 118, theme: "Add Recipients to Campaigns", subTheme: "", description: "When a user adds a list of recipients to the campaign, at some point they'll be able to see a table of those recipients in the campaign experience AND they'll be able to adjust which columns are shown in the table", priority: "—", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
  { id: 119, theme: "Campaign Data", subTheme: "", description: "Users will be able to see the following data for each campaign: - # of personalized videos added - # of messages sent - open rate - # of replies recieved - spam report rate - bounce rate", priority: "MUST HAVE", designReview: "Needs Work", status: "done", where: "CampaignDetail (openRate, replies, videos, spamRate, bounceRate, clickRate)", notes: "" },
  { id: 120, theme: "Searching / Filtering through Campaigns", subTheme: "", description: "Users will be able to search through their campaigns by name", priority: "—", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 121, theme: "Searching / Filtering through Campaigns", subTheme: "", description: "Users willl be able to filter their campaigns by status (status options TBD)", priority: "—", designReview: "Fail", status: "done", where: "CampaignsList (FilterBar with status filter)", notes: "" },
  { id: 122, theme: "Searching / Filtering through Campaigns", subTheme: "", description: "Users willl be able to filter their campaigns by type", priority: "—", designReview: "Fail", status: "done", where: "CampaignsList (FilterBar with type tabs: Single Step, Multi-Step, Video Request)", notes: "" },
  { id: 123, theme: "Searching / Filtering through Campaigns", subTheme: "", description: "Users willl be able to filter their campaigns by delivery method", priority: "—", designReview: "Needs Work", status: "done", where: "CampaignsList (FilterBar with channel filter: Email, SMS, Email+SMS)", notes: "" },
  { id: 124, theme: "Searching / Filtering through Campaigns", subTheme: "", description: "Users willl be able to filter campaigns based on who created the campaign", priority: "—", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 125, theme: "Take Actions on Campaigns", subTheme: "", description: "Users will be able to change the status of a single campaign", priority: "—", designReview: "Needs Work", status: "done", where: "StatusChangeModal (Draft → Scheduled → Sending → Sent → Archived)", notes: "" },
  { id: 126, theme: "Take Actions on Campaigns", subTheme: "", description: "Users will be able to change the status of campaigns in bulk", priority: "—", designReview: "N/A to Design", status: "done", where: "", notes: "" },
  { id: 127, theme: "Take Actions on Campaigns", subTheme: "", description: "Users will be able to delete a single campaign", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 128, theme: "Take Actions on Campaigns", subTheme: "", description: "Users will be able to delete campaigns in bulk", priority: "—", designReview: "N/A to Design", status: "done", where: "", notes: "" },
  { id: 129, theme: "Take Actions on Campaigns", subTheme: "", description: "Users will be able to rename a given campaign", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 130, theme: "Take Actions on Campaigns", subTheme: "", description: "Users will be able to duplicate a given campaign", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 131, theme: "Take Actions on Campaigns", subTheme: "", description: "If a user duplicates a single step campaign, their duplication will always \"copy\" all of the following from the original campaign: --- Message type copy (may have to convert from email body to SMS or vice versa --- Landing page settings & copy --- Video content ------- *If recipient selection i...", priority: "—", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 132, theme: "Take Actions on Campaigns", subTheme: "", description: "If a user duplicates a multi-step campaign, their duplication will always \"copy\" all of the following from the original campaign: --- Step setup ------- Including each step (plus templates & automation settings in the steps), wait times, and conditions", priority: "—", designReview: "Fail", status: "done", where: "CampaignsList DuplicateModal (copies steps, templates, automation)", notes: "" },
  { id: 133, theme: "Take Actions on Campaigns", subTheme: "", description: "If a user attempts to duplicate a single step campaign, they will have the option to decide if the new campaign will be sent via email or SMS", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 134, theme: "Take Actions on Campaigns", subTheme: "", description: "If a user attempts to duplicate a campaign, they will have the option to include the recipient selection in their duplication", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 135, theme: "Take Actions on Campaigns", subTheme: "", description: "If a user attempts to duplicate a campaign, they will have the option to include the success metric in their duplication", priority: "—", designReview: "Needs Work", status: "done", where: "CampaignsList DuplicateModal (successMetric checkbox)", notes: "" },
  { id: 136, theme: "Take Actions on Campaigns", subTheme: "", description: "If a user attempts to duplicate a campaign, they will have the option to include the same share settings in their duplication", priority: "—", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 137, theme: "Take Actions on Campaigns", subTheme: "", description: "If a user attempts to duplicate a campaign, they will have the option to include the same tags in their duplication", priority: "—", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 138, theme: "Take Actions on Campaigns", subTheme: "", description: "If a user attempts to duplicate a campaign, they will have the option to include the same failure event in their duplication", priority: "—", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 139, theme: "Sending Campaigns", subTheme: "", description: "Users should be able to send themselves (or others) a test version of their campaign. When they send this test, they should be able to select which recipient will be used when sending the test (e.g. which recipient will be used for the variables and/or personalized video when sending the test)", priority: "MUST HAVE", designReview: "Needs Work", status: "done", where: "CreateCampaign review step (test send with recipient picker)", notes: "" },
  { id: 140, theme: "Sending Campaigns", subTheme: "", description: "Users should be able to get a link to a landing page for the campaign, so that they can experience what the landing page will be like for recipients", priority: "COULD HAVE", designReview: "Pass", status: "done", where: "DesignStepPanel (Copy Link button in Landing Page section)", notes: "" },
  { id: 141, theme: "Sending Campaigns", subTheme: "", description: "Users should be able to get a link to a specific recipient's landing page / video for the campaign, so that they can experience what the landing page & video will be like for that specific recipient. Note: User should be made aware that viewing this landing page and/or video will impact their dat...", priority: "SHOULD HAVE", designReview: "Needs Work", status: "n/a", where: "", notes: "" },
  { id: 142, theme: "Sending Campaigns", subTheme: "", description: "When users have filled out all required info for the campaign, they should be able to either \"Send now\" or \"schedule send\" for a date / time in the future.", priority: "MUST HAVE", designReview: "Needs Work", status: "done", where: "CreateCampaign schedule step (Send Now / Schedule for later)", notes: "" },
  { id: 143, theme: "Sending Campaigns", subTheme: "", description: "Users should be able to see the \"status\" of the campaign for each recipient tied to a campaign. Status options include: 1. N/A (e.g. the recipient is added to the campaign, but no action has been taken for them 2. Video Added (e.g. the recipient has a video tied to them in this campaign that wi...", priority: "MUST HAVE", designReview: "Needs Work", status: "done", where: "CampaignDetail (deriveStatus with N/A, Video Added, Sent, Opened, Clicked, Replied, Bounced badges)", notes: "" },
  { id: 144, theme: "Resending Campaigns", subTheme: "", description: "Users should be able to resend the same message, landing page, and video to a recipient / list of recipients from the campaign as long as the given recipient meets ALL of the following: 1. Hasn't already clicked the CTA in the message 2. Hasn't gotten 3 or more messages from this campaign already...", priority: "SHOULD HAVE", designReview: "Fail", status: "n/a", where: "", notes: "" },
  { id: 145, theme: "Resending Campaigns", subTheme: "", description: "When users resend an email from the campaign, they should have the option to update the subject line.", priority: "SHOULD HAVE", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
  { id: 146, theme: "Resending Campaigns", subTheme: "", description: "When users resend an SMS from the campaign, they should have the option to update the SMS copy.", priority: "SHOULD HAVE", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
  { id: 147, theme: "Resending Campaigns", subTheme: "", description: "Data for a given campaign needs to be clearly broken out between the initial message sent to a recipient, the first re-send, and the final resend.", priority: "SHOULD HAVE", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
  { id: 148, theme: "Assign Tasks", subTheme: "", description: "A user can select one or more recipients from the campaign, and select a portal user who will be assigned the task of tying a personalized video clip to the selected recipient(s)", priority: "SHOULD HAVE", designReview: "Fail", status: "done", where: "CampaignDetail (Assign Video Task in recipient action menu → modal with user picker)", notes: "" },
  { id: 149, theme: "Assign Tasks", subTheme: "", description: "A user can select one or more recipients from the campaign and UNassign people from adding personalized video clips for them", priority: "SHOULD HAVE", designReview: "Fail", status: "done", where: "CampaignDetail (Unassign Video Task in recipient action menu)", notes: "If we build this feature set, this should be included." },
  { id: 150, theme: "Assign Tasks", subTheme: "", description: "When users assigns a personalized video task to another user, they can include instructions telling them what / how to do it.", priority: "SHOULD HAVE", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
  { id: 151, theme: "Assign Tasks", subTheme: "", description: "When a user is assigned or unassigned a personalized video task, it will send them an email, notifying them of the task the've been assigned.", priority: "SHOULD HAVE", designReview: "N/A to Design", status: "n/a", where: "", notes: "If we build this feature set, this should be included." },
  { id: 152, theme: "Assign Tasks", subTheme: "", description: "When a user is assigned or unassigned a personalized video task, they will get an in app notification, notifying them of the task the've been assigned.", priority: "SHOULD HAVE", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
];


/* ═══════════════════════════════════════════════
   HARDCODED CONTACTS REQUIREMENTS
   ═══════════════════════════════════════════════ */
const CONTACTS_THEME_ORDER = [
  "Contacts Table & Display",
  "Search & Filtering",
  "Adding Contacts – CSV Import",
  "Adding Contacts – Manual & Integrations",
  "Contact Profile",
  "Bulk Actions & Export",
  "Lists Management",
  "Saved Searches",
];

const CONTACTS_REQUIREMENTS: Requirement[] = [
  { id: 1, theme: "Contacts Table & Display", subTheme: "Table", description: "Sortable contact table with click-to-sort column headers (asc/desc/none tri-state)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Contacts.tsx (SortableHeader, handleSort)", notes: "SortableHeader component with ArrowUp/ArrowDown/ArrowUpDown icons. Tri-state sort on each column key." },
  { id: 2, theme: "Contacts Table & Display", subTheme: "Columns", description: "Column customization modal — add, remove, and drag-reorder columns grouped by category", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Contacts.tsx (EditColumnsModal)", notes: "Two-panel modal: Available (grouped by Summary/Profile/Engagement/etc.) and Active with GripVertical reorder and moveUp/moveDown." },
  { id: 3, theme: "Contacts Table & Display", subTheme: "Columns", description: "28 available columns across 6 groups (Summary, Profile, Engagement, Contact Info, Address, Custom Fields)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Contacts.tsx (ALL_COLUMNS)", notes: "28 ColumnDef entries including cf_preferred_name, cf_spouse_name, cf_graduation_year, cf_degree, cf_interest_area, cf_board_term, cf_committee, cf_department." },
  { id: 4, theme: "Contacts Table & Display", subTheme: "Pagination", description: "Pagination with configurable rows-per-page (10/25/50/100)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Contacts.tsx (Pagination component)", notes: "Page navigation with rows-per-page select, 'Showing X–Y of Z' display, and ChevronLeft/ChevronRight page buttons." },
  { id: 5, theme: "Contacts Table & Display", subTheme: "Layout", description: "Total constituent count shown in header (542,578)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Contacts.tsx (TOTAL_COUNT + header subtitle)", notes: "TOTAL_COUNT displayed formatted with comma separator under the page title." },
  { id: 6, theme: "Contacts Table & Display", subTheme: "Layout", description: "Responsive mobile card layout for contacts (hidden on desktop, visible on mobile)", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Contacts.tsx (Box hiddenFrom='md' / visibleFrom='md')", notes: "Desktop gets full Table; mobile gets stacked cards with avatar, name, affiliation, email." },
  { id: 7, theme: "Contacts Table & Display", subTheme: "Navigation", description: "Click any contact row to navigate to their profile page", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Contacts.tsx (Table.Tr onClick → navigate('/contacts/${c.id}'))", notes: "Both desktop rows and mobile cards navigate to /contacts/:id on click." },
  { id: 8, theme: "Contacts Table & Display", subTheme: "Empty State", description: "Empty state with illustration when no contacts match search/filter", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Contacts.tsx (filtered.length === 0 block)", notes: "Purple circle icon, 'No contacts found' heading, suggestion text, and 'Add Contact' button." },
  { id: 9, theme: "Search & Filtering", subTheme: "Search", description: "Global text search across name, email, remote ID, and company", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Contacts.tsx (search state + filtered useMemo)", notes: "TextInput with Search icon. Filters across first last email remoteId company concatenation." },
  { id: 10, theme: "Search & Filtering", subTheme: "FilterBar", description: "Reusable FilterBar component with configurable filter pills and add-filter dropdown", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Contacts.tsx (FilterBar component), components/FilterBar.tsx", notes: "FilterBar accepts FilterDef[] and renders active filter pills with popover dropdowns. Supports add/remove filters." },
  { id: 11, theme: "Search & Filtering", subTheme: "Filters", description: "Filter contacts by star rating", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Contacts.tsx (filterValues.starRating case)", notes: "Multi-select star rating filter (1–5 stars)." },
  { id: 12, theme: "Search & Filtering", subTheme: "Filters", description: "Filter contacts by email status (valid, bounced, unsubscribed, spam)", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Contacts.tsx (hasValidEmail, hasBouncedEmail, hasSpamEmail, hasUnsubscribedEmail)", notes: "Four separate boolean filters for each email status." },
  { id: 13, theme: "Search & Filtering", subTheme: "Filters", description: "Filter contacts by phone status (valid, bounced, unsubscribed)", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Contacts.tsx (hasValidPhone, hasBouncedPhone, hasUnsubscribedPhone)", notes: "Three phone-status boolean filters." },
  { id: 14, theme: "Search & Filtering", subTheme: "Filters", description: "Filter contacts by custom field existence (e.g. 'has Graduation Year')", priority: "COULD HAVE", designReview: "Pass", status: "done", where: "Contacts.tsx (customField filter case)", notes: "Checks that all selected custom fields exist in c.customFields." },
  { id: 15, theme: "Adding Contacts – CSV Import", subTheme: "Upload", description: "CSV file upload with drag-and-drop zone", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "AddContacts.tsx (CsvFlow → upload step)", notes: "Full drag-and-drop zone with dashed border, file icon, size/row display. Also supports click-to-browse." },
  { id: 16, theme: "Adding Contacts – CSV Import", subTheme: "Import Mode", description: "Three import modes: Add New, Update Existing, and Full Replace", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "AddContacts.tsx (IMPORT_MODES → mode step)", notes: "Radio card selection: Add (Plus icon), Update (RefreshCw), Replace (Replace icon, danger styled). Each has description text." },
  { id: 17, theme: "Adding Contacts – CSV Import", subTheme: "Mapping", description: "Auto-mapping CSV columns to ThankView fields with manual override via Select dropdown", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "AddContacts.tsx (mapping step → Select with TV_FIELDS_GROUPED)", notes: "Table showing CSV header, sample values, and grouped Select dropdown for TV field mapping. 'Skip this column' option available." },
  { id: 18, theme: "Adding Contacts – CSV Import", subTheme: "Validation", description: "Validation step with animated progress bar and error/warning display", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "AddContacts.tsx (validating + review steps)", notes: "Animated progress bar (0→100%). Errors table shows row, column, value, error message. Severity badges: red error, yellow warning." },
  { id: 19, theme: "Adding Contacts – CSV Import", subTheme: "Validation", description: "Error rows individually dismissable; 'Skip errored rows' toggle", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "AddContacts.tsx (skipErrors Switch)", notes: "Switch toggle 'Skip errored rows and import valid ones only'. Show/hide all errors." },
  { id: 20, theme: "Adding Contacts – CSV Import", subTheme: "Replace Mode", description: "Full Replace confirmation requires typing 'DELETE {count}' before proceeding", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "AddContacts.tsx (confirmText match)", notes: "Danger zone with red styling. Exact text match required. Button disabled until confirmed." },
  { id: 21, theme: "Adding Contacts – CSV Import", subTheme: "Review", description: "Review summary card showing valid, flagged, matched, new, and deleted counts", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "AddContacts.tsx (review step stats display)", notes: "Stats grid with icons: valid (green), flagged (red), matched (blue), new rows (purple), deleted (red, replace only)." },
  { id: 22, theme: "Adding Contacts – Manual & Integrations", subTheme: "Method Picker", description: "Method picker page with cards for CSV, Manual, RE NXT, Salesforce, Bloomerang", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "AddContacts.tsx (MethodCard components)", notes: "Five MethodCard buttons with icon, title, description, arrow. Salesforce and Bloomerang show 'Coming Soon' badge and are disabled." },
  { id: 23, theme: "Adding Contacts – Manual & Integrations", subTheme: "Manual Entry", description: "Manual single-contact form with configurable field picker (enable/disable fields)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "AddContacts.tsx (ManualFlow → MANUAL_FIELDS, enabledFields)", notes: "Two-panel layout: field picker left (checkboxes by group), form right. 16 available fields across Core/Profile/Address/Other. Donor ID required by default." },
  { id: 24, theme: "Adding Contacts – Manual & Integrations", subTheme: "Manual Entry", description: "Multi-contact staging queue — add contacts to a queue before bulk saving", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "AddContacts.tsx (StagedContact[], staged state)", notes: "Queue list with avatar, name, email badge. Remove individual contacts. 'Save All' button to commit." },
  { id: 25, theme: "Adding Contacts – Manual & Integrations", subTheme: "Manual Entry", description: "Tag selection on manual form with preset tags (TagSelect component)", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "AddContacts.tsx (ManualFlow → TagSelect)", notes: "TagSelect component with CONTACT_PRESET_TAGS. Searchable, multi-select, create custom tags." },
  { id: 26, theme: "Adding Contacts – Manual & Integrations", subTheme: "RE NXT", description: "RE NXT integration flow: OAuth connect → query builder → field mapping → preview → import", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "AddContacts.tsx (RenxtFlow, RENXT_FIELDS, DEFAULT_RENXT_MAPPING)", notes: "5-step wizard: connect (simulated OAuth), query builder with criteria, field mapping table, preview with mock results, animated import progress." },
  { id: 27, theme: "Adding Contacts – Manual & Integrations", subTheme: "Integrations", description: "Salesforce and Bloomerang placeholders shown as 'Coming Soon' disabled cards", priority: "COULD HAVE", designReview: "Pass", status: "done", where: "AddContacts.tsx (MethodCard disabled + 'Coming Soon' badge)", notes: "Salesforce and Bloomerang cards grayed out, cursor: not-allowed, cyan 'Coming Soon' badge." },
  { id: 28, theme: "Adding Contacts – Manual & Integrations", subTheme: "Navigation", description: "Add Contacts menu dropdown from Contacts page header (single, CSV, RE NXT, Salesforce, Bloomerang)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Contacts.tsx (Menu.Dropdown with navigate('/contacts/add?method=...'))", notes: "ActionIcon UserPlus with Tooltip opens Menu: Add Single Contact, then Bulk Import section with CSV, RE NXT, Salesforce, Bloomerang." },
  { id: 29, theme: "Contact Profile", subTheme: "Hero Card", description: "Contact detail page with hero card: avatar, name, tags, affiliation, quick stats", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "ContactProfile.tsx (DashCard hero section + SimpleGrid stats)", notes: "84px avatar with initials/color. Tags as Mantine Badges. Quick stats: Campaigns Received, Avg. Engagement, Total Giving, Giving Level." },
  { id: 30, theme: "Contact Profile", subTheme: "Edit Mode", description: "Inline edit mode for all contact fields (name, email, phone, company, title, remote ID, affiliation, assignee)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "ContactProfile.tsx (editing state, TextInput/Select fields)", notes: "Edit button toggles editing. All fields become editable. Cancel resets via resetEditFields(). Save shows toast." },
  { id: 31, theme: "Contact Profile", subTheme: "Edit Mode", description: "Address editing: line 1, line 2, city, state, zip in a grid layout", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "ContactProfile.tsx (editAddr1/editAddr2/editCity/editState/editZip)", notes: "Divider-separated Address section. Line 1 full-width, Line 2 full-width, City/State/Zip in 3-col grid." },
  { id: 32, theme: "Contact Profile", subTheme: "Edit Mode", description: "Custom fields editing — add, edit, and remove key-value pairs", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "ContactProfile.tsx (editCustomFields, newCfKey/newCfValue)", notes: "Existing fields: read-only key, editable value, red delete button. New field: key/value inputs + green add button." },
  { id: 33, theme: "Contact Profile", subTheme: "Edit Mode", description: "Tags editing with TagSelect and preset tag options", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "ContactProfile.tsx (TagSelect with CONTACT_PRESET_TAGS)", notes: "Divider-labeled Tags section with full TagSelect component in edit mode." },
  { id: 34, theme: "Contact Profile", subTheme: "Tabs", description: "Four profile tabs: Overview, Activity Timeline, Campaign History, Engagement", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "ContactProfile.tsx (Tabs with 4 panels)", notes: "Mantine Tabs with tvPurple color and xl radius. Each tab has an icon: User, Clock, Send, BarChart3." },
  { id: 35, theme: "Contact Profile", subTheme: "Overview", description: "Delivery status cards showing email and phone status with color-coded badges", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "ContactProfile.tsx (Delivery Status section)", notes: "Email/Phone status cards with contextual styling: green/red/orange/gray. Icons: CircleCheckBig, AlertTriangle, ShieldAlert, Ban." },
  { id: 36, theme: "Contact Profile", subTheme: "Overview", description: "Star rating, CT Score, and Video Score displays with visual indicators", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "ContactProfile.tsx (Star rating + CT/Video score progress bars)", notes: "5-star visual display. CT/Video Scores as horizontal progress bars with color bands (green ≥70, yellow ≥40, red <40)." },
  { id: 37, theme: "Contact Profile", subTheme: "Activity", description: "Activity timeline with vertical connector line and event icons (sent, opened, played, CTA, shared, downloaded, replied)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "ContactProfile.tsx (activity tab → event timeline)", notes: "Vertical line with 7 event types, each with colored circle icon. Shows time and campaign name per event." },
  { id: 38, theme: "Contact Profile", subTheme: "Campaigns", description: "Campaign history table: Campaign, Sender, Channel, Status, View %, Watch %, Score, Sent date", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "ContactProfile.tsx (campaigns tab → desktop table + mobile cards)", notes: "8-column grid on desktop. Mobile card view with key metrics. Status badges with color coding." },
  { id: 39, theme: "Contact Profile", subTheme: "Actions", description: "Delete contact with confirmation modal", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "ContactProfile.tsx (DeleteModal, showDelete)", notes: "Trash2 ActionIcon triggers DeleteModal. Confirms with 'Delete' and shows toast on confirm." },
  { id: 40, theme: "Contact Profile", subTheme: "Navigation", description: "Contextual back navigation (from analytics, from campaign, default to contacts list)", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "ContactProfile.tsx (handleBack, searchParams 'from')", notes: "Back checks searchParams: 'analytics' → /analytics?tab=sends, campaign prefix → navigate(-1), default → /contacts." },
  { id: 41, theme: "Contact Profile", subTheme: "Overview", description: "CC and BCC addresses displayed on contact profile", priority: "COULD HAVE", designReview: "Pass", status: "done", where: "ContactProfile.tsx (CC Addresses + BCC Addresses rows)", notes: "Listed in Contact Information section. Shows comma-joined addresses or '—' if empty." },
  { id: 42, theme: "Bulk Actions & Export", subTheme: "Selection", description: "Checkbox selection per row with 'select all on page' toggle", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Contacts.tsx (Checkbox per row + toggleAll)", notes: "Individual Checkbox per row. Header toggles all on page. Indeterminate state when partial." },
  { id: 43, theme: "Bulk Actions & Export", subTheme: "Action Bar", description: "Bulk action bar appears when contacts selected — shows count, actions, and dismiss", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Contacts.tsx (selected.length > 0 block)", notes: "Purple tint bar with '{N} selected' count. Action buttons: Add to…, Export, Delete. X to deselect all." },
  { id: 44, theme: "Bulk Actions & Export", subTheme: "Actions", description: "Add selected contacts to campaign or list via dropdown menu", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Contacts.tsx (Menu: Campaign + List options)", notes: "'Add to…' dropdown: Campaign (Send icon, toast), List (Users icon, opens AddToListModal)." },
  { id: 45, theme: "Bulk Actions & Export", subTheme: "Actions", description: "Add to List modal with existing list selection or create new list", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Contacts.tsx (AddToListModal)", notes: "Modal with list search, radio select, or 'Create new list' option. Confirms with toast." },
  { id: 46, theme: "Bulk Actions & Export", subTheme: "Actions", description: "Bulk delete selected contacts", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Contacts.tsx (Delete button in bulk bar)", notes: "Red outline button with Trash2 icon. Deletes all selected, shows toast, clears selection." },
  { id: 47, theme: "Bulk Actions & Export", subTheme: "Export", description: "Export modal with scope selection (selected, filtered, all) and field picker by category", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Contacts.tsx (ExportModal, EXPORT_CATEGORIES)", notes: "3 scope radio options. Category sidebar with all/none toggles. Field checkboxes. Footer shows counts." },
  { id: 48, theme: "Bulk Actions & Export", subTheme: "Export", description: "Export categories: Biographical, Contact Info, Address, Engagement, Custom Fields with nested field groups", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Contacts.tsx (EXPORT_CATEGORIES array)", notes: "5 export categories each with color and fieldGroups. Total ~45 exportable fields." },
  { id: 49, theme: "Lists Management", subTheme: "Table", description: "Lists table with sortable columns, search, and column customization", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Lists.tsx (Table + SortableHeader + EditColumnsModal)", notes: "8 columns: List, Contacts, Creator, Last Updated, Created, Shared, Folder, Tags." },
  { id: 50, theme: "Lists Management", subTheme: "Folders", description: "Folder organization for lists with colored folder icons", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Lists.tsx (ListFolder[], folderId)", notes: "3 folders: Spring Campaigns, Cultivation, Phonathon with distinct colors." },
  { id: 51, theme: "Lists Management", subTheme: "CRUD", description: "Create, edit, and delete lists with modals", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Lists.tsx (Create/Edit/Delete modals)", notes: "Create: name + description + folder. Edit: same. Delete: DeleteModal confirmation." },
  { id: 52, theme: "Lists Management", subTheme: "Archive", description: "Archive and unarchive lists with status filter", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Lists.tsx (archived flag, Archive/ArchiveRestore)", notes: "Archive action in row menu. Filter by Active/Archived. ArchiveRestore to unarchive." },
  { id: 53, theme: "Lists Management", subTheme: "Sharing", description: "Share lists with team members and filter by shared status", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Lists.tsx (sharedWith[], Share2 icon, shared filter)", notes: "Share action. Filter: Shared with me, Not shared, Shared by me." },
  { id: 54, theme: "Lists Management", subTheme: "Filters", description: "List-specific filters: creator, folder, tags, date, contact count, shared, status", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Lists.tsx (LIST_FILTERS + FilterBar)", notes: "7 filter definitions using same FilterBar component as Contacts." },
  { id: 55, theme: "Saved Searches", subTheme: "Table", description: "Saved searches table with criteria preview, match count, and status", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "SavedSearches.tsx (Table + columns)", notes: "8 columns: Search, Criteria, Matches, Creator, Last Refreshed, Created, Status, Auto-Refresh." },
  { id: 56, theme: "Saved Searches", subTheme: "CRUD", description: "Create saved search with multi-criteria builder (field + operator + value)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "SavedSearches.tsx (CriterionDef, criteria builder)", notes: "Each criterion has field, operator, value, category. Add/remove criteria. Preview match count." },
  { id: 57, theme: "Saved Searches", subTheme: "Status", description: "Active/Paused toggle for saved searches with Zap icon status indicator", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "SavedSearches.tsx (active flag, Play/Pause icons)", notes: "Toggle between active (green) and paused (gray). Status column in table." },
  { id: 58, theme: "Saved Searches", subTheme: "Settings", description: "Auto-refresh toggle per saved search", priority: "COULD HAVE", designReview: "Pass", status: "done", where: "SavedSearches.tsx (autoRefresh flag, RefreshCw icon)", notes: "Boolean toggle. Column shows active/off state." },
  { id: 59, theme: "Saved Searches", subTheme: "Actions", description: "Duplicate, edit, and delete saved search actions", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "SavedSearches.tsx (MoreHorizontal menu → Copy, Edit2, Trash2)", notes: "Row action menu with duplicate, edit modal, and delete confirmation." },
];

/* ═══════════════════════════════════════════════
   GAP ANALYSIS — FULL 134-REQUIREMENT AUDIT
   ═══════════════════════════════════════════════ */
const GAP_ANALYSIS_THEME_ORDER = [
  "Global Navigation",
  "Home Dashboard",
  "Campaign List",
  "Campaign Editor — Recipients",
  "Campaign Editor — Message",
  "Campaign Editor — Page",
  "Campaign Editor — Videos",
  "Campaign Editor — Sends",
  "Campaign Editor — Replies",
  "Contacts",
  "Lists",
  "Video Library",
  "1:1 Video",
  "Metrics & Analytics",
  "Account Settings",
  "Integrations",
  "Cross-Cutting Features",
];

const GAP_ANALYSIS_REQUIREMENTS: Requirement[] = [
  // ── Global Navigation (NAV-01 to NAV-06) ──
  { id: 1, theme: "Global Navigation", subTheme: "NAV-01", description: "Persistent top navigation bar with logo that links to home", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Layout.tsx (TopBar + logo UnstyledButton → navigate('/'))", notes: "TopBar renders on every page with ThankViewLogoIcon that navigates to /." },
  { id: 2, theme: "Global Navigation", subTheme: "NAV-02", description: "Primary nav items: Home, Campaigns, Contacts, Lists, Video Library, 1:1 Video, Metrics, Integrations", priority: "MUST HAVE", designReview: "Partial", status: "partial", where: "Layout.tsx (sidebar nav links)", notes: "WHAT EXISTS: Layout.tsx sidebar has Home, Campaigns, Contacts, Lists, Video Library, and Metrics nav items with icons and active-state highlighting. WHAT'S MISSING: 'Integrations' has no sidebar entry; '1:1 Video' is only accessible via Dashboard quick action, not as a primary nav item. APPROACH: Add 'Integrations' and '1:1 Video' nav links in Layout.tsx sidebar." },
  { id: 3, theme: "Global Navigation", subTheme: "NAV-03", description: "Campaign selector dropdown in top navigation for quick campaign switching", priority: "SHOULD HAVE", designReview: "Missing", status: "missing", where: "Layout.tsx (TopBar)", notes: "CURRENT STATE: Layout.tsx TopBar has GlobalSearch, NotificationsPanel, and Avatar menu. No campaign context switching in top bar. THE GAP: No campaign selector/switcher dropdown for jumping between campaigns without returning to campaign list. APPROACH: Add campaign selector dropdown in Layout.tsx TopBar between GlobalSearch and notifications." },
  { id: 4, theme: "Global Navigation", subTheme: "NAV-04", description: "Help button (?) in top-right corner", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Layout.tsx (sidebar footer — HelpCircle icon)", notes: "Help Center button with HelpCircle icon in sidebar footer." },
  { id: 5, theme: "Global Navigation", subTheme: "NAV-05", description: "Notification badge with count indicator", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Layout.tsx (Indicator + Bell icon + NotificationsPanel)", notes: "Bell icon with Indicator showing count '3'. NotificationsPanel opens on click." },
  { id: 6, theme: "Global Navigation", subTheme: "NAV-06", description: "User avatar/initials button for account menu", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Layout.tsx (Avatar + Menu.Dropdown)", notes: "Avatar showing initials 'KM' with dropdown: My Profile, Settings, Org Switcher, Logout." },

  // ── Home Dashboard (HOME-01 to HOME-10) ──
  { id: 7, theme: "Home Dashboard", subTheme: "HOME-01", description: "Personalized greeting with user's first name and current date", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Dashboard.tsx (greeting section)", notes: "'Welcome, Kelley!' with date display." },
  { id: 8, theme: "Home Dashboard", subTheme: "HOME-02", description: "Account Health indicator showing Good/Warning/Poor status", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Dashboard.tsx (metrics pool — account_health)", notes: "Account Health metric with 'Good' value and 'All signals healthy' sub-text." },
  { id: 9, theme: "Home Dashboard", subTheme: "HOME-03", description: "Spam Rate percentage display", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Dashboard.tsx (metrics pool — spam_rate)", notes: "Spam Rate: 0.00%." },
  { id: 10, theme: "Home Dashboard", subTheme: "HOME-04", description: "Bounce Rate percentage display", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Dashboard.tsx (metrics pool — bounce_rate)", notes: "Bounce Rate: 0.3%." },
  { id: 11, theme: "Home Dashboard", subTheme: "HOME-05", description: "SMS Opt-Out percentage display", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Dashboard.tsx (metrics pool — sms_optout)", notes: "SMS Opt-Out: 2.29%." },
  { id: 12, theme: "Home Dashboard", subTheme: "HOME-06", description: "Recent Campaigns section with campaign cards (name, recipients, type, delivery, videos, sent, open rate, replies, spam/bounce)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Dashboard.tsx (CampaignCard component)", notes: "Campaign cards with thumbnail, title, meta, videosAdded, sent, openRate, replies, spam/bounce." },
  { id: 13, theme: "Home Dashboard", subTheme: "HOME-07", description: "Quick action buttons: Record a 1:1 Video and Create New Campaign", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Dashboard.tsx (QuickActionsWidget)", notes: "4 quick actions: New Campaign, Create Video, Add Constituents, Create Assets." },
  { id: 14, theme: "Home Dashboard", subTheme: "HOME-08", description: "Link to full campaigns list", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Dashboard.tsx ('Go to your campaigns' link)", notes: "UnstyledButton navigates to /campaigns." },
  { id: 15, theme: "Home Dashboard", subTheme: "HOME-09", description: "Product Updates feed with dated announcements and Learn More links", priority: "SHOULD HAVE", designReview: "Missing", status: "missing", where: "Dashboard.tsx", notes: "CURRENT STATE: Dashboard.tsx has activity feed with Videos/Activity tabs showing engagement events. THE GAP: No 'Product Updates' or 'Announcements' section with dated entries and 'Learn More' links. APPROACH: Add ProductUpdates widget in Dashboard.tsx with hardcoded announcements array." },
  { id: 16, theme: "Home Dashboard", subTheme: "HOME-10", description: "Campaign thumbnail preview on dashboard cards", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Dashboard.tsx (campaign.image in CampaignCard)", notes: "Thumbnail images displayed on each campaign card." },

  // ── Campaign List (CAM-01 to CAM-11) ──
  { id: 17, theme: "Campaign List", subTheme: "CAM-01", description: "Paginated campaign list (10 per page with total count)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "CampaignsList.tsx (rowsPerPage=10, TablePagination)", notes: "Paginated at 10/page with total count display." },
  { id: 18, theme: "Campaign List", subTheme: "CAM-02", description: "Search for a Campaign", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "CampaignsList.tsx (PillSearchInput)", notes: "Text search filters by campaign name." },
  { id: 19, theme: "Campaign List", subTheme: "CAM-03", description: "Create New Campaign button", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "CampaignsList.tsx (CreateCampaignDropdown)", notes: "Plus icon with dropdown: Single-Step, Multi-Step, Video Request." },
  { id: 20, theme: "Campaign List", subTheme: "CAM-04", description: "Status filter: Active, Archived, Deleted", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "CampaignsList.tsx (STATUSES array)", notes: "Status tabs: All, Sent, Scheduled, Draft, Paused, Archived." },
  { id: 21, theme: "Campaign List", subTheme: "CAM-05", description: "Type filter with categories (Thank You, Appeals, Video Request, etc.)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "CampaignsList.tsx (VIEW_TABS)", notes: "Filter tabs with all campaign type categories." },
  { id: 22, theme: "Campaign List", subTheme: "CAM-06", description: "Delivery method filter: Email, Text Message, Shareable Link", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "CampaignsList.tsx (CHANNELS)", notes: "All three delivery channel filters implemented." },
  { id: 23, theme: "Campaign List", subTheme: "CAM-07", description: "User filter (All Users / specific user)", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "CampaignsList.tsx (creator filter)", notes: "Searchable creator selector with filter logic." },
  { id: 24, theme: "Campaign List", subTheme: "CAM-08", description: "Bulk selection with checkboxes and bulk actions (delete, archive)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "CampaignsList.tsx (bulkSelected + bulk action bar)", notes: "Checkboxes with indeterminate state; bulk delete and archive actions." },
  { id: 25, theme: "Campaign List", subTheme: "CAM-09", description: "Campaign card with full metadata (thumbnail, name, recipients, type, delivery, videos, sent, open rate, replies, spam/bounce, creator, dates)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "CampaignsList.tsx (Campaign interface + card)", notes: "All metadata fields present in campaign cards." },
  { id: 26, theme: "Campaign List", subTheme: "CAM-10", description: "Edit button per campaign", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "CampaignsList.tsx (Edit2 menu item → navigate)", notes: "Edit navigates to /campaigns/:id." },
  { id: 27, theme: "Campaign List", subTheme: "CAM-11", description: "Campaign action dropdown menu (Rename, Copy, Resend, Archive, Delete)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "CampaignsList.tsx (per-card Menu)", notes: "Full dropdown: Edit, Rename, Duplicate, Status changes, Delete." },

  // ── Campaign Editor — Recipients (CAM-12 to CAM-23) ──
  { id: 28, theme: "Campaign Editor — Recipients", subTheme: "CAM-12", description: "Multi-step campaign editor with 6 steps: Recipients → Message → Page → Videos → Sends → Replies", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "campaign/MultiStepBuilder.tsx", notes: "Full 6-step workflow implemented." },
  { id: 29, theme: "Campaign Editor — Recipients", subTheme: "CAM-13", description: "Add Recipients button", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "campaign/RecipientPanel.tsx (add button)", notes: "Manual add with email/name input." },
  { id: 30, theme: "Campaign Editor — Recipients", subTheme: "CAM-14", description: "Recipient table with core sortable columns (First Name, Last Name, Email, Phone, Has Video, Title, Score, Preferred Name, Company, Donor ID)", priority: "MUST HAVE", designReview: "Partial", status: "partial", where: "campaign/RecipientPanel.tsx", notes: "WHAT EXISTS: campaign/RecipientPanel.tsx renders Name, Email, Phone, Group, Status, Video columns. WHAT'S MISSING: Column headers lack SortableHeader (used in Contacts.tsx and Lists.tsx). Missing required columns: Title, Score, Preferred Name, Company, Donor ID. APPROACH: Import SortableHeader into RecipientPanel.tsx, add sort state, expand visible columns." },
  { id: 31, theme: "Campaign Editor — Recipients", subTheme: "CAM-15", description: "Recipient table with extended data columns (Notes, Anniversary, Birthday, Ask Amount, Last Donation, Designation, Class Year, Years Giving)", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "campaign/RecipientPanel.tsx (extended fields)", notes: "Extended fields supported in constituent data." },
  { id: 32, theme: "Campaign Editor — Recipients", subTheme: "CAM-16", description: "Custom data fields support", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "campaign/RecipientPanel.tsx (constituent interface)", notes: "Extensible constituent interface supports custom fields." },
  { id: 33, theme: "Campaign Editor — Recipients", subTheme: "CAM-17", description: "Toggle Columns control", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "CampaignDetail.tsx (ColumnsButton + EditColumnsModal)", notes: "Column visibility toggle via EditColumnsModal." },
  { id: 34, theme: "Campaign Editor — Recipients", subTheme: "CAM-18", description: "Filter By dropdown", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "campaign/RecipientPanel.tsx (FilterDropdown)", notes: "Multiple filter types: Group, Status, Video, ClassYear, City." },
  { id: 35, theme: "Campaign Editor — Recipients", subTheme: "CAM-19", description: "Search within recipients", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "campaign/RecipientPanel.tsx (PillSearchInput)", notes: "Text search scoped to recipient list." },
  { id: 36, theme: "Campaign Editor — Recipients", subTheme: "CAM-20", description: "Create Task button with dropdown options", priority: "SHOULD HAVE", designReview: "Missing", status: "missing", where: "campaign/RecipientPanel.tsx", notes: "CURRENT STATE: campaign/RecipientPanel.tsx has recipient table with bulk actions but no task creation. CampaignDetail.tsx separately has 'Assign Video Task' in recipient action menu. THE GAP: No 'Create Task' button with dropdown in RecipientPanel.tsx. APPROACH: Add 'Create Task' button with Menu.Dropdown in RecipientPanel.tsx toolbar." },
  { id: 37, theme: "Campaign Editor — Recipients", subTheme: "CAM-21", description: "Bulk select and actions via menu", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "campaign/RecipientPanel.tsx (checkboxes + bulk actions)", notes: "Checkbox multi-select with bulk action support." },
  { id: 38, theme: "Campaign Editor — Recipients", subTheme: "CAM-22", description: "Pagination for recipients list", priority: "SHOULD HAVE", designReview: "Partial", status: "partial", where: "campaign/RecipientPanel.tsx", notes: "WHAT EXISTS: RecipientPanel.tsx uses @tanstack/react-virtual for efficient rendering of large lists. WHAT'S MISSING: No page navigation controls (page numbers, prev/next) — other tables use the reusable TablePagination component for this. APPROACH: Add TablePagination component below the recipient table, following the Contacts.tsx pattern." },
  { id: 39, theme: "Campaign Editor — Recipients", subTheme: "CAM-23", description: "Next Step / Go Back navigation", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "campaign/MultiStepBuilder.tsx", notes: "ChevronLeft/ChevronRight navigation between steps." },

  // ── Campaign Editor — Message (CAM-24 to CAM-40) ──
  { id: 40, theme: "Campaign Editor — Message", subTheme: "CAM-24", description: "ThankView Format selection (Envelope, Thumbnail of Video, Animated Thumbnail)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "campaign/DesignStepPanel.tsx (EnvelopePreview)", notes: "Format selection with envelope design options." },
  { id: 41, theme: "Campaign Editor — Message", subTheme: "CAM-25", description: "Subject Line input (char count max 150, merge tags, emoji)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "CharCounters.tsx (CHAR_LIMITS.subject=150)", notes: "Subject input with 150 char limit, merge tag picker, emoji." },
  { id: 42, theme: "Campaign Editor — Message", subTheme: "CAM-26", description: "Sender Name input (char count max 50, merge tags, emoji)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "CharCounters.tsx (CHAR_LIMITS.senderName=50)", notes: "Sender name with 50 char limit, merge tags, emoji." },
  { id: 43, theme: "Campaign Editor — Message", subTheme: "CAM-27", description: "Sender Email Address input", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "campaign/types.ts (senderEmail field)", notes: "Sender email input in FlowStep interface." },
  { id: 44, theme: "Campaign Editor — Message", subTheme: "CAM-28", description: "Reply Email with multiple addresses", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "campaign/types.ts (replyToList?: string[])", notes: "Multiple reply-to emails supported." },
  { id: 45, theme: "Campaign Editor — Message", subTheme: "CAM-29", description: "Language selector dropdown", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "campaign/types.ts (LANGUAGE_OPTIONS)", notes: "Language selector with options list." },
  { id: 46, theme: "Campaign Editor — Message", subTheme: "CAM-30", description: "Font selector dropdown", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "campaign/types.ts (ENV_FONTS)", notes: "4 font options: Serif, Sans-Serif, Script, Modern." },
  { id: 47, theme: "Campaign Editor — Message", subTheme: "CAM-31", description: "Email Message rich text editor (Bold, Italic, Underline, Link, Alignment, Lists, Merge Tags, Emoji, Handwriting)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "campaign/DesignStepPanel.tsx (RichTextEditor + MergeFieldDropdown)", notes: "Full RTE with all formatting options." },
  { id: 48, theme: "Campaign Editor — Message", subTheme: "CAM-32", description: "Email message character count (max 5000)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "CharCounters.tsx (CHAR_LIMITS.body=5000)", notes: "EmailBodyCharCounter component with 5000 limit." },
  { id: 49, theme: "Campaign Editor — Message", subTheme: "CAM-33", description: "Merge tag support in subject, sender name, and body", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "MergeFieldPicker.tsx + MERGE_FIELDS constant", notes: "{{firstName}}, {{lastName}}, {{email}}, etc. across all fields." },
  { id: 50, theme: "Campaign Editor — Message", subTheme: "CAM-34", description: "Button Text customization (char count max 50, merge tags, emoji)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "CtaButtonControls.tsx (ctaText prop)", notes: "CTA button text input with customization." },
  { id: 51, theme: "Campaign Editor — Message", subTheme: "CAM-35", description: "Button Color customization (hex color picker)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "CtaButtonControls.tsx (CTA_COLOR_PRESETS + ColorPickerField)", notes: "Color picker with presets and hex input." },
  { id: 52, theme: "Campaign Editor — Message", subTheme: "CAM-36", description: "Share on Facebook fields (Share Title max 200, Share Message max 255)", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "FacebookShareModal.tsx (OgData interface)", notes: "OG title and description with modal." },
  { id: 53, theme: "Campaign Editor — Message", subTheme: "CAM-37", description: "Live email preview panel with recipient selector dropdown", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "campaign/LivePreviewPanel.tsx (PreviewConstituent)", notes: "Comprehensive preview with test recipient database." },
  { id: 54, theme: "Campaign Editor — Message", subTheme: "CAM-38", description: "Preview recipient cycling (prev/next arrows)", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "campaign/LivePreviewPanel.tsx (prevConstituent/nextConstituent)", notes: "ChevronLeft/ChevronRight to cycle recipients." },
  { id: 55, theme: "Campaign Editor — Message", subTheme: "CAM-39", description: "Responsive preview toggle (Desktop, Tablet, Mobile)", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "campaign/LivePreviewPanel.tsx (Monitor, Tablet, Smartphone icons)", notes: "Device toggle for preview widths." },
  { id: 56, theme: "Campaign Editor — Message", subTheme: "CAM-40", description: "Save button", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "campaign/MultiStepBuilder.tsx", notes: "Save functionality at each step." },

  // ── Campaign Editor — Page (CAM-41 to CAM-48) ──
  { id: 57, theme: "Campaign Editor — Page", subTheme: "CAM-41", description: "Landing Page Appearance configuration", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "campaign/LandingPageBuilderModal.tsx", notes: "Full builder with color and appearance customization." },
  { id: 58, theme: "Campaign Editor — Page", subTheme: "CAM-42", description: "Landing page gallery with search", priority: "MUST HAVE", designReview: "Partial", status: "done", where: "campaign/DesignStepPanel.tsx", notes: "Landing page template gallery with PillSearchInput search ('Search for a landing page') in DesignStepPanel.tsx line 1104. Search filters templates by name." },
  { id: 59, theme: "Campaign Editor — Page", subTheme: "CAM-43", description: "Landing page edit and delete actions", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "campaign/LandingPageBuilderModal.tsx (save/close)", notes: "Edit and delete via modal with color/accent editing." },
  { id: 60, theme: "Campaign Editor — Page", subTheme: "CAM-44", description: "Create Landing Page button", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "campaign/MultiStepBuilder.tsx → LandingPageBuilderModal", notes: "Create triggers LandingPageBuilderModal." },
  { id: 61, theme: "Campaign Editor — Page", subTheme: "CAM-45", description: "Copy Shareable Link button", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "campaign/DesignStepPanel.tsx (handleCopyLink)", notes: "Copy Link button in design panel." },
  { id: 62, theme: "Campaign Editor — Page", subTheme: "CAM-46", description: "Choose an Envelope section", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "campaign/EnvelopeBuilderModal.tsx", notes: "Envelope selection and customization." },
  { id: 63, theme: "Campaign Editor — Page", subTheme: "CAM-47", description: "Live landing page preview (recipient selector, desktop/tablet/mobile toggle)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "campaign/LivePreviewPanel.tsx", notes: "Preview with device toggle (Monitor, Tablet, Smartphone)." },
  { id: 64, theme: "Campaign Editor — Page", subTheme: "CAM-48", description: "Landing page content elements (logo, video player, recipient name, Reply/Save/Share buttons, Privacy Policy, branding)", priority: "MUST HAVE", designReview: "Partial", status: "partial", where: "LandingPageBuilder.tsx / LivePreviewPanel.tsx", notes: "WHAT EXISTS: LandingPageBuilder.tsx has logo upload, video player placeholder, and button color config (replyBtnColor, saveBtnColor, shareBtnColor). WHAT'S MISSING: Privacy Policy link missing from preview footer. Reply/Save/Share buttons have colors configured but aren't rendered as interactive elements in the preview. APPROACH: Render styled Reply/Save/Share buttons below video player and add Privacy Policy footer link." },

  // ── Campaign Editor — Videos (CAM-49 to CAM-60) ──
  { id: 65, theme: "Campaign Editor — Videos", subTheme: "CAM-49", description: "Video step with sub-tabs: Intro Theme, Recordings, Outro, Add-Ons", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "campaign/IntroOutroBuilder.tsx + VideoBuilder.tsx", notes: "Separate Intro/Outro sections with recordings management." },
  { id: 66, theme: "Campaign Editor — Videos", subTheme: "CAM-50", description: "Intro Theme enable/disable toggle", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "campaign/IntroOutroBuilder.tsx (INTRO_IMAGE_THEMES)", notes: "Toggle support with theme selection." },
  { id: 67, theme: "Campaign Editor — Videos", subTheme: "CAM-51", description: "Intro template categories (Featured, Your Intro Templates, Image Templates, Message Templates, Giving Days, Birthdays)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "campaign/IntroOutroBuilder.tsx (BuilderThemeSection)", notes: "Top Intro Themes, Your Intro Templates, Image Templates, Message Templates." },
  { id: 68, theme: "Campaign Editor — Videos", subTheme: "CAM-52", description: "Music selector for intros (category filter, track selection, audio preview)", priority: "SHOULD HAVE", designReview: "Partial", status: "partial", where: "campaign/IntroOutroBuilder.tsx", notes: "WHAT EXISTS: IntrosAndOutros.tsx defines musicTrack property on intro items with values like 'Upbeat Piano', 'Warm Strings'. Music icon and track name displayed at line 293. WHAT'S MISSING: No interactive music picker UI — users cannot browse, filter by category, or preview audio tracks. APPROACH: Build MusicPicker component for IntroOutroBuilder.tsx with category tabs, track list, and play/preview button." },
  { id: 69, theme: "Campaign Editor — Videos", subTheme: "CAM-53", description: "Save as Template for intro themes", priority: "SHOULD HAVE", designReview: "Partial", status: "done", where: "campaign/IntroOutroBuilder.tsx", notes: "IntroOutroBuilder.tsx has saveAsTemplate state (line 555) with checkbox (line 964) labeled 'Save as reusable template'. Saved Templates section with expandable gallery." },
  { id: 70, theme: "Campaign Editor — Videos", subTheme: "CAM-54", description: "Play Intro and Remove Intro buttons", priority: "SHOULD HAVE", designReview: "Partial", status: "partial", where: "campaign/LivePreviewPanel.tsx / IntroOutroBuilder.tsx", notes: "WHAT EXISTS: LivePreviewPanel.tsx has play controls for previewing assembled video including intro. IntroOutroBuilder.tsx has intro selection gallery. WHAT'S MISSING: No 'Remove Intro' button — once selected, there's no one-click way to deselect/remove an intro. APPROACH: Add clear/X button near the selected intro display in IntroOutroBuilder.tsx." },
  { id: 71, theme: "Campaign Editor — Videos", subTheme: "CAM-55", description: "Recordings tab with recipient list (video status, search, Select All, expand view)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "campaign/VideoRecorder.tsx", notes: "Recording management with recipient list and status." },
  { id: 72, theme: "Campaign Editor — Videos", subTheme: "CAM-56", description: "Video recording completion indicator ('Videos are complete!')", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "campaign/VideoRecorder.tsx", notes: "Recording status indicators for completed recordings." },
  { id: 73, theme: "Campaign Editor — Videos", subTheme: "CAM-57", description: "Outro enable/disable with template gallery", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "campaign/IntroOutroBuilder.tsx (OutroBuilder + OUTRO_THEMES)", notes: "Outro builder with template gallery." },
  { id: 74, theme: "Campaign Editor — Videos", subTheme: "CAM-58", description: "Create Image Outro with logo upload", priority: "SHOULD HAVE", designReview: "Partial", status: "partial", where: "campaign/IntroOutroBuilder.tsx", notes: "WHAT EXISTS: IntroOutroBuilder.tsx has OutroBuilder section with OUTRO_THEMES gallery of pre-designed templates. WHAT'S MISSING: No 'Create Custom' flow for uploading a logo/image to generate a new outro — only pre-made templates available. APPROACH: Add a 'Create Custom' card in outro gallery that opens upload modal (reuse ImageUploadModal pattern)." },
  { id: 75, theme: "Campaign Editor — Videos", subTheme: "CAM-59", description: "Add-Ons: Add-On Video and Overlays", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "campaign/types.ts (addOnClip, overlay BuilderView)", notes: "VideoElements interface includes addOnClip boolean and overlay support." },
  { id: 76, theme: "Campaign Editor — Videos", subTheme: "CAM-60", description: "Preview Sequence button (full assembled video: intro + recording + outro)", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "campaign/LivePreviewPanel.tsx (play controls)", notes: "Preview functionality with play controls." },

  // ── Campaign Editor — Sends (CAM-61 to CAM-66) ──
  { id: 77, theme: "Campaign Editor — Sends", subTheme: "CAM-61", description: "Send tracking dashboard with status filters (All, Recorded, Scheduled, Sending, Failed Send, Delivered) with counts", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "CampaignDetail.tsx (send tracking)", notes: "Status filters with counts for all delivery states." },
  { id: 78, theme: "Campaign Editor — Sends", subTheme: "CAM-62", description: "Send Test button", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "SendTestModal.tsx", notes: "Modal for testing email/SMS sends." },
  { id: 79, theme: "Campaign Editor — Sends", subTheme: "CAM-63", description: "Resend Campaign button", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "CampaignDetail.tsx (resend logic)", notes: "Resend with constituent messaging." },
  { id: 80, theme: "Campaign Editor — Sends", subTheme: "CAM-64", description: "Delivery table with tracking columns (Name, Email, Status, Opened, Last Sent, Actions)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "CampaignDetail.tsx (SendEvent interface)", notes: "SendEvent with date, status, opened, clicked fields." },
  { id: 81, theme: "Campaign Editor — Sends", subTheme: "CAM-65", description: "Search within sends", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "CampaignDetail.tsx", notes: "Search integration in send list." },
  { id: 82, theme: "Campaign Editor — Sends", subTheme: "CAM-66", description: "Bulk selection within sends", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "CampaignDetail.tsx", notes: "Checkbox multi-select for sends." },

  // ── Campaign Editor — Replies (CAM-67 to CAM-70) ──
  { id: 83, theme: "Campaign Editor — Replies", subTheme: "CAM-67", description: "Reply inbox displaying video and text replies from recipients", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "CampaignDetail.tsx (ConstituentReply interface)", notes: "Reply content tracking with replyContent array." },
  { id: 84, theme: "Campaign Editor — Replies", subTheme: "CAM-68", description: "Search Replies", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "CampaignDetail.tsx", notes: "Search patterns consistent across application." },
  { id: 85, theme: "Campaign Editor — Replies", subTheme: "CAM-69", description: "Filter By dropdown for replies", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "CampaignDetail.tsx", notes: "FilterDropdown pattern applicable to replies." },
  { id: 86, theme: "Campaign Editor — Replies", subTheme: "CAM-70", description: "Actions menu for individual replies (three-dot or similar)", priority: "SHOULD HAVE", designReview: "Partial", status: "partial", where: "CampaignDetail.tsx", notes: "WHAT EXISTS: CampaignDetail.tsx defines ConstituentReply interface and displays reply content. WHAT'S MISSING: No three-dot MoreHorizontal action menu on individual reply items (expected: Play, Download, Flag, Delete). APPROACH: Add Menu.Dropdown with MoreHorizontal trigger per reply row, following CampaignsList.tsx per-row action pattern." },

  // ── Contacts (CON-01 to CON-10) ──
  { id: 87, theme: "Contacts", subTheme: "CON-01", description: "Contacts list with sortable columns (First Name, Last Name, Email, Phone, Title, Score, Preferred Name, Company, Donor ID)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Contacts.tsx (ALL_COLUMNS + SortableHeader)", notes: "All columns defined with sortable headers." },
  { id: 88, theme: "Contacts", subTheme: "CON-02", description: "Pagination with total count", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Contacts.tsx (TOTAL_COUNT + TablePagination)", notes: "542,578 total with 25/page pagination." },
  { id: 89, theme: "Contacts", subTheme: "CON-03", description: "Search contacts", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Contacts.tsx (TextInput with Search icon)", notes: "Searches by name, email, remoteId, company." },
  { id: 90, theme: "Contacts", subTheme: "CON-04", description: "Filter By dropdown", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Contacts.tsx (FilterBar + CONTACT_FILTERS)", notes: "Filters: starRating, hasValidEmail, hasValidPhone, state, classYear, givingLevel, donorStatus, tags, dateCreated." },
  { id: 91, theme: "Contacts", subTheme: "CON-05", description: "Toggle Columns control", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Contacts.tsx (EditColumnsModal + ColumnsButton)", notes: "Column visibility customization." },
  { id: 92, theme: "Contacts", subTheme: "CON-06", description: "Add Contacts button", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Contacts.tsx (UserPlus + Menu)", notes: "Add Single Constituent + bulk import (CSV, RE NXT, Salesforce, Bloomerang)." },
  { id: 93, theme: "Contacts", subTheme: "CON-07", description: "Bulk actions menu", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Contacts.tsx (bulk action bar — Send, Export, Delete)", notes: "Bulk actions visible when contacts selected." },
  { id: 94, theme: "Contacts", subTheme: "CON-08", description: "Bulk selection via checkboxes", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Contacts.tsx (toggleAll + toggleSelect)", notes: "Checkboxes with page-level select all." },
  { id: 95, theme: "Contacts", subTheme: "CON-09", description: "Clickable contact names linking to detail view", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Contacts.tsx (Table.Tr onClick → navigate)", notes: "Row click navigates to /contacts/:id." },
  { id: 96, theme: "Contacts", subTheme: "CON-10", description: "Star rating system (1-5 stars) per contact", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Contacts.tsx (Star rating column with 5 stars)", notes: "5-star interactive rating with fill based on contact.starRating." },

  // ── Lists (LST-01 to LST-08) ──
  { id: 97, theme: "Lists", subTheme: "LST-01", description: "Lists management view", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Lists.tsx (Lists component)", notes: "Dedicated page with table of lists." },
  { id: 98, theme: "Lists", subTheme: "LST-02", description: "Create New List button", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Lists.tsx (ActionIcon + Plus icon)", notes: "Plus button opens create flow." },
  { id: 99, theme: "Lists", subTheme: "LST-03", description: "Search for a List", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Lists.tsx (TextInput with Search icon)", notes: "Filters lists by name." },
  { id: 100, theme: "Lists", subTheme: "LST-04", description: "Sort By dropdown", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Lists.tsx (sortKey/sortDir + Sort menu)", notes: "Sort by Name, Constituents, Created, Last Used." },
  { id: 101, theme: "Lists", subTheme: "LST-05", description: "Status filter (Active Lists, Archived, etc.)", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Lists.tsx (filter bar with archived toggle)", notes: "Filter by active/archived/all." },
  { id: 102, theme: "Lists", subTheme: "LST-06", description: "List card metadata (name, star rating, Created On, contact count, Last Used)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Lists.tsx (ALL_COLUMNS + table)", notes: "Columns: listName, contacts, createdAt, updatedAt, shared." },
  { id: 103, theme: "Lists", subTheme: "LST-07", description: "Per-list actions menu", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Lists.tsx (Menu with Edit, Share, Delete, Archive)", notes: "Full per-row action menu." },
  { id: 104, theme: "Lists", subTheme: "LST-08", description: "Star rating per list", priority: "SHOULD HAVE", designReview: "Partial", status: "partial", where: "Lists.tsx", notes: "WHAT EXISTS: Contacts.tsx has working 5-star interactive rating per contact. Lists.tsx has ContactList interface and ALL_COLUMNS but no star rating. WHAT'S MISSING: No starRating property on ContactList, no star column in ALL_COLUMNS. APPROACH: Add starRating to ContactList interface, add column to ALL_COLUMNS, render same star component from Contacts.tsx." },

  // ── Video Library (VID-01 to VID-11) ──
  { id: 105, theme: "Video Library", subTheme: "VID-01", description: "Video grid with thumbnails (duration overlay, title, creation date)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "VideoLibrary.tsx (grid view with duration span)", notes: "Thumbnails with duration overlay, title, date." },
  { id: 106, theme: "Video Library", subTheme: "VID-02", description: "List/grid view toggle", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "VideoLibrary.tsx (viewMode + ViewToggle)", notes: "Toggle between grid and list views." },
  { id: 107, theme: "Video Library", subTheme: "VID-03", description: "Search for a Video", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "VideoLibrary.tsx (TextInput + Search icon)", notes: "Filters by title/tags." },
  { id: 108, theme: "Video Library", subTheme: "VID-04", description: "User filter (All Users)", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "VideoLibrary.tsx (creatorFilter + FilterBar)", notes: "Creator filter with filtering logic." },
  { id: 109, theme: "Video Library", subTheme: "VID-05", description: "Sort by Date Created", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "VideoLibrary.tsx (sortBy/sortDir state)", notes: "Sort by Date Created, Title, Date Modified, Duration." },
  { id: 110, theme: "Video Library", subTheme: "VID-06", description: "Total video count display", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "VideoLibrary.tsx (filtered.length + ' videos')", notes: "Shows filtered video count." },
  { id: 111, theme: "Video Library", subTheme: "VID-07", description: "Add or Combine Videos button", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "VideoLibrary.tsx (Add or Combine menu)", notes: "Record Video, Upload Video, Combine Videos." },
  { id: 112, theme: "Video Library", subTheme: "VID-08", description: "Sidebar navigation: All, Favorites, Replies, Archive", priority: "SHOULD HAVE", designReview: "Partial", status: "partial", where: "VideoLibrary.tsx (folder sidebar)", notes: "WHAT EXISTS: VideoLibrary.tsx has folder sidebar with 'All Videos' default plus user-created folders with CRUD. Filter states for favorites/archived/replies exist as filter controls. WHAT'S MISSING: Dedicated sidebar nav items for Favorites, Replies, Archive — currently only via filter dropdowns. APPROACH: Add fixed nav items (All, Favorites, Replies, Archive) above user folders in sidebar." },
  { id: 113, theme: "Video Library", subTheme: "VID-09", description: "Folder management (create, view, organize)", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "VideoLibrary.tsx (folder rename/delete/create)", notes: "Full folder CRUD in sidebar." },
  { id: 114, theme: "Video Library", subTheme: "VID-10", description: "Per-video actions (edit, favorite, more options)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "VideoLibrary.tsx (VideoCardMenu)", notes: "Edit, Favorite, Duplicate, Copy Link, Send as 1:1, Download, Archive, Delete." },
  { id: 115, theme: "Video Library", subTheme: "VID-11", description: "Closed captions badge (CC) on captioned videos", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "VideoLibrary.tsx (captionSource !== 'none' → CC badge)", notes: "CC badge with Captions icon on both grid and list views." },

  // ── 1:1 Video (PV-01 to PV-06) ──
  { id: 116, theme: "1:1 Video", subTheme: "PV-01", description: "Video list sidebar showing recipients queued for personal video recording", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "campaign/PersonalizedRecorder.tsx (ContactQueue, lines 602-750)", notes: "Implemented in campaign builder's PersonalizedRecorder. ContactQueue component shows 'Recording Queue' sidebar with progress tracking, recipient list with status indicators (Sent, Ready to send, Recording, Pending), and progress bar showing completed/total count." },
  { id: 117, theme: "1:1 Video", subTheme: "PV-02", description: "Add recipient via + button", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "campaign/PersonalizedRecorder.tsx (lines 681-748)", notes: "Implemented in campaign builder's PersonalizedRecorder. 'Add Constituents' button with UserPlus icon opens mid-session popup with full constituent search, tags filter, and ability to add individual recipients to the recording queue." },
  { id: 118, theme: "1:1 Video", subTheme: "PV-03", description: "Add from Contact List button/link", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "campaign/PersonalizedRecorder.tsx (lines 737-745)", notes: "Implemented in campaign builder's PersonalizedRecorder. The Add Constituents popup includes saved list shortcuts (e.g., 'Spring Gala Invitees', 'Major Donors', 'Alumni Phonathon') with importFromList() integration for bulk-adding recipients from contact lists." },
  { id: 119, theme: "1:1 Video", subTheme: "PV-04", description: "1:1 Video Library button", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "campaign/VideoBuilder.tsx (lines 208-216) + campaign/VideoLibraryPanel.tsx", notes: "Implemented in campaign builder. VideoBuilder passes onOpenLibrary callback to PersonalizedRecorder. VideoLibraryPanel provides full library browsing with pickMode support for selecting existing videos within the campaign flow." },
  { id: 120, theme: "1:1 Video", subTheme: "PV-05", description: "Video recording interface (in-browser webcam/screen)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "VideoCreate.tsx (RecordSetupStep)", notes: "Comprehensive recording: cam, screen-cam, screen modes; mic/camera selection; countdown; audio visualization." },
  { id: 121, theme: "1:1 Video", subTheme: "PV-06", description: "Empty state with guidance when no videos exist", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "VideoCreate.tsx (source === null block)", notes: "Onboarding empty state with purple circle Film icon, heading, descriptive copy, 4 source selection cards (Record, Upload, Library, Combine) with icons and descriptions, and Quick Tips section with engagement guidance." },

  // ── Metrics & Analytics (MET-01 to MET-21) ──
  { id: 122, theme: "Metrics & Analytics", subTheme: "MET-01", description: "Portal selector dropdown for multi-portal accounts", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Analytics.tsx", notes: "Portal selector dropdown added above tabs with 4 mock portals (Main Campus, Medical Center, Athletics, Alumni Association). Supports 'All Portals' aggregate view and individual portal selection with send counts, reset button, and check marks." },
  { id: 123, theme: "Metrics & Analytics", subTheme: "MET-02", description: "Performance Dashboard with sub-views (Overview, Sent, Delivered, expandable)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Analytics.tsx (Tabs: overview, performance)", notes: "Overview and Performance tabs implemented." },
  { id: 124, theme: "Metrics & Analytics", subTheme: "MET-03", description: "Fundraising Dashboard", priority: "SHOULD HAVE", designReview: "Partial", status: "partial", where: "Analytics.tsx", notes: "WHAT EXISTS: Analytics.tsx has tabs for overview, performance, pdf, endowment, video_1_1. WHAT'S MISSING: No dedicated 'Fundraising' tab with donation conversion, giving amounts, ROI metrics. APPROACH: Add 'fundraising' tab in Analytics.tsx with conversion rate, total giving, average gift, and trends." },
  { id: 125, theme: "Metrics & Analytics", subTheme: "MET-04", description: "Endowment Dashboard", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Analytics.tsx (Tabs.Tab value='endowment')", notes: "Endowment tab exists (conditional on HAS_ODDER flag)." },
  { id: 126, theme: "Metrics & Analytics", subTheme: "MET-05", description: "PDF Display Dashboard", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Analytics.tsx (Tabs.Tab value='pdf')", notes: "PDF tab implemented." },
  { id: 127, theme: "Metrics & Analytics", subTheme: "MET-06", description: "1:1 Video Dashboard", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Analytics.tsx (Tabs.Tab value='video_1_1')", notes: "1:1 Video tab implemented." },
  { id: 128, theme: "Metrics & Analytics", subTheme: "MET-07", description: "Metrics filters (time period, campaign filter, advanced filter)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Analytics.tsx (FilterBar + FilterValues)", notes: "Filter bar with time period and campaign filtering." },
  { id: 129, theme: "Metrics & Analytics", subTheme: "MET-08", description: "Export Metrics dropdown", priority: "SHOULD HAVE", designReview: "Missing", status: "done", where: "Analytics.tsx", notes: "Analytics.tsx has ExportModal component (line 1094), exportOpen state (line 1203), and Export button in toolbar (line 1690). Also has ODDER CSV export action." },
  { id: 130, theme: "Metrics & Analytics", subTheme: "MET-09", description: "Sent metrics (total sent, unsubscribed count/%, spam reports count/%)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Analytics.tsx (SEND_RECORDS + Dashboard metrics)", notes: "Sent, unsubscribed, spam tracking." },
  { id: 131, theme: "Metrics & Analytics", subTheme: "MET-10", description: "Delivered metrics (delivered count/%, bounced count/%)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Analytics.tsx (delivery metrics)", notes: "Delivered and bounced tracking with percentages." },
  { id: 132, theme: "Metrics & Analytics", subTheme: "MET-11", description: "Opened metrics with industry comparison bar", priority: "MUST HAVE", designReview: "Partial", status: "done", where: "Analytics.tsx", notes: "Analytics.tsx defines industryOpenRate (line 285) and renders comparison with directional arrows — 'above/below X% industry avg' (line 1628). Dedicated Industry Std. Open Rate card with benchmark (line 1630)." },
  { id: 133, theme: "Metrics & Analytics", subTheme: "MET-12", description: "Clicked metrics with industry comparison bar", priority: "MUST HAVE", designReview: "Partial", status: "done", where: "Analytics.tsx", notes: "Analytics.tsx defines industryClickRate (line 286) and renders comparison with directional arrows — 'above/below X% industry avg' (line 1629). Dedicated Industry Std. Click Rate card with benchmark (line 1631)." },
  { id: 134, theme: "Metrics & Analytics", subTheme: "MET-13", description: "Started Watching count/%", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Analytics.tsx (TREND_DATA — started)", notes: "Started watching tracked in trend data." },
  { id: 135, theme: "Metrics & Analytics", subTheme: "MET-14", description: "Finished Watching count/%", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Analytics.tsx (TREND_DATA — finished)", notes: "Finished watching tracked." },
  { id: 136, theme: "Metrics & Analytics", subTheme: "MET-15", description: "Total Views count", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Analytics.tsx (total views metric)", notes: "Total views tracked." },
  { id: 137, theme: "Metrics & Analytics", subTheme: "MET-16", description: "Average View percentage", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Analytics.tsx", notes: "Average view percentage tracked." },
  { id: 138, theme: "Metrics & Analytics", subTheme: "MET-17", description: "CTA Clicks count", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Analytics.tsx (DEFAULT_EXTRA_KEYS)", notes: "CTA clicks tracked." },
  { id: 139, theme: "Metrics & Analytics", subTheme: "MET-18", description: "Shares count", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Analytics.tsx", notes: "Shares tracked." },
  { id: 140, theme: "Metrics & Analytics", subTheme: "MET-19", description: "Downloads count", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Analytics.tsx", notes: "Downloads tracked." },
  { id: 141, theme: "Metrics & Analytics", subTheme: "MET-20", description: "Replies count", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Analytics.tsx", notes: "Replies tracked." },
  { id: 142, theme: "Metrics & Analytics", subTheme: "MET-21", description: "Location Metrics with Engagement Map", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Analytics.tsx (UsMap + WorldMap components)", notes: "US and World map components imported and used for geographic engagement." },

  // ── Account Settings (SET-01 to SET-19) ──
  { id: 143, theme: "Account Settings", subTheme: "SET-01", description: "View and edit login info (name, email)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings.tsx (ProfileTab) + UserProfile.tsx", notes: "Editable name fields and email display." },
  { id: 144, theme: "Account Settings", subTheme: "SET-02", description: "Change password", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings.tsx (ProfileTab) + UserProfile.tsx", notes: "Password change with current/new/confirm validation." },
  { id: 145, theme: "Account Settings", subTheme: "SET-03", description: "User role display", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "UserProfile.tsx (Badge 'TV Admin') + Settings.tsx", notes: "Role badge displayed on profile." },
  { id: 146, theme: "Account Settings", subTheme: "SET-04", description: "Job Function selector", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "UserProfile.tsx (Select + JOB_TITLES array)", notes: "Dropdown with 20 job title options." },
  { id: 147, theme: "Account Settings", subTheme: "SET-05", description: "Organization Name", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings.tsx (GeneralTab → org name TextInput)", notes: "Editable organization name field." },
  { id: 148, theme: "Account Settings", subTheme: "SET-06", description: "Organization Type", priority: "SHOULD HAVE", designReview: "Partial", status: "partial", where: "Settings.tsx (GeneralTab)", notes: "WHAT EXISTS: Settings.tsx GeneralTab has Organization Name as editable TextInput. WHAT'S MISSING: No separate Organization Type dropdown (University, Foundation, Healthcare, K-12, Other). APPROACH: Add Select dropdown in GeneralTab below organization name." },
  { id: 149, theme: "Account Settings", subTheme: "SET-07", description: "Custom URL / subdomain", priority: "SHOULD HAVE", designReview: "Partial", status: "partial", where: "Settings.tsx (GeneralTab → slug display)", notes: "WHAT EXISTS: Settings.tsx GeneralTab displays subdomain slug as read-only text (e.g., 'hartwell.thankview.com') with note to contact support. WHAT'S MISSING: No in-app editing capability for the custom URL. APPROACH: Convert to editable TextInput with validation or add 'Request Change' button." },
  { id: 150, theme: "Account Settings", subTheme: "SET-08", description: "Portal Logo upload with preview and delete", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings.tsx (GeneralTab → logo upload)", notes: "96px logo preview with Upload/Replace button. PNG or SVG." },
  { id: 151, theme: "Account Settings", subTheme: "SET-09", description: "Organization URL", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Settings.tsx (GeneralTab → URL TextInput)", notes: "TextInput for org website URL." },
  { id: 152, theme: "Account Settings", subTheme: "SET-10", description: "Internal Name", priority: "COULD HAVE", designReview: "Partial", status: "partial", where: "Settings.tsx (GeneralTab)", notes: "WHAT EXISTS: Settings.tsx GeneralTab has organization name and URL fields. WHAT'S MISSING: No 'Internal Name' optional field — a display alias for internal reports/admin views. APPROACH: Add 'Internal Name (optional)' TextInput in GeneralTab." },
  { id: 153, theme: "Account Settings", subTheme: "SET-11", description: "Custom Email domain with DNS setup", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings.tsx (DnsSetupTab)", notes: "Full DNS domain management with Add Domain modal, record display, verification status." },
  { id: 154, theme: "Account Settings", subTheme: "SET-12", description: "Custom Area Code for SMS", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Settings.tsx (EmailSmsTab → SMS Area Code)", notes: "Read-only display: +1 (617) Boston, MA." },
  { id: 155, theme: "Account Settings", subTheme: "SET-13", description: "Customer Success Manager display", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Settings.tsx (GeneralTab — 'Your Success Team' card)", notes: "Two-column card in General tab: (1) CSM card with avatar initials, name, title, email, phone, and 'Schedule a Call' CTA linking to Calendly; (2) EverTrue Support card with email, help center link, and availability hours." },
  { id: 156, theme: "Account Settings", subTheme: "SET-14", description: "Campaign Defaults (Font, Envelope, Landing Page, Intro, Outro, Recording Details)", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Settings.tsx (Campaign Defaults section header)", notes: "Campaign Defaults section exists with Sparkles icon." },
  { id: 157, theme: "Account Settings", subTheme: "SET-15", description: "My Subscription management", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings.tsx (Subscription & Billing tab)", notes: "Subscription & Billing tab with CreditCard icon." },
  { id: 158, theme: "Account Settings", subTheme: "SET-16", description: "Security settings", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "UserProfile.tsx (Two-Step Verification)", notes: "SMS-based 2FA with enable/disable flow." },
  { id: 159, theme: "Account Settings", subTheme: "SET-17", description: "Manage Users", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings.tsx (UsersTab)", notes: "User invitation, role assignment, management with MOCK_USERS." },
  { id: 160, theme: "Account Settings", subTheme: "SET-18", description: "Video Captions settings", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Settings.tsx (Video & Recording tab)", notes: "AI captioning toggle, REV captions with credits, download/edit toggles." },
  { id: 161, theme: "Account Settings", subTheme: "SET-19", description: "Notifications preferences", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings.tsx (Notifications tab) + NotificationsPanel.tsx", notes: "5 in-app + 8 email notification toggles." },

  // ── Integrations (INT-01 to INT-11) ──
  { id: 162, theme: "Integrations", subTheme: "INT-01", description: "Blackbaud Raiser's Edge NXT (2-way) integration", priority: "MUST HAVE", designReview: "Missing", status: "missing", where: "No file exists", notes: "CURRENT STATE: No Integrations page exists. AddContacts.tsx references RE NXT as contact import source with simulated OAuth flow. THE GAP: No dedicated integration management card with connection status, sync config. APPROACH: Create Integrations.tsx page with card grid; add RE NXT card with logo, 2-way sync badge, Connect button. Add 'Integrations' to Layout.tsx sidebar." },
  { id: 163, theme: "Integrations", subTheme: "INT-02", description: "Bloomerang (1-way) integration", priority: "SHOULD HAVE", designReview: "Missing", status: "missing", where: "No file exists", notes: "CURRENT STATE: No Integrations page. AddContacts.tsx shows Bloomerang as 'Coming Soon' disabled card. THE GAP: No integration card for Bloomerang. APPROACH: Add Bloomerang card in Integrations.tsx with 1-way sync badge." },
  { id: 164, theme: "Integrations", subTheme: "INT-03", description: "Community Funded (1-way) integration", priority: "COULD HAVE", designReview: "Missing", status: "missing", where: "No file exists", notes: "CURRENT STATE: No Integrations page exists. THE GAP: No integration card for Community Funded. APPROACH: Add Community Funded card in Integrations.tsx with 1-way sync badge." },
  { id: 165, theme: "Integrations", subTheme: "INT-04", description: "EverTrue (1-way) integration", priority: "COULD HAVE", designReview: "Missing", status: "missing", where: "No file exists", notes: "CURRENT STATE: No Integrations page exists. THE GAP: No integration card for EverTrue. APPROACH: Add EverTrue card in Integrations.tsx with 1-way sync badge." },
  { id: 166, theme: "Integrations", subTheme: "INT-05", description: "Givebutter (2-way) integration", priority: "COULD HAVE", designReview: "Missing", status: "missing", where: "No file exists", notes: "CURRENT STATE: No Integrations page exists. THE GAP: No integration card for Givebutter. APPROACH: Add Givebutter card in Integrations.tsx with 2-way sync badge." },
  { id: 167, theme: "Integrations", subTheme: "INT-06", description: "RNL Engage (2-way) integration", priority: "COULD HAVE", designReview: "Missing", status: "missing", where: "No file exists", notes: "CURRENT STATE: No Integrations page exists. THE GAP: No integration card for RNL Engage. APPROACH: Add RNL Engage card in Integrations.tsx with 2-way sync badge." },
  { id: 168, theme: "Integrations", subTheme: "INT-07", description: "RNL Scalefunder (2-way) integration", priority: "COULD HAVE", designReview: "Missing", status: "missing", where: "No file exists", notes: "CURRENT STATE: No Integrations page exists. THE GAP: No integration card for RNL Scalefunder. APPROACH: Add RNL Scalefunder card in Integrations.tsx with 2-way sync badge." },
  { id: 169, theme: "Integrations", subTheme: "INT-08", description: "Salesforce (2-way) integration", priority: "MUST HAVE", designReview: "Missing", status: "missing", where: "No file exists", notes: "CURRENT STATE: No Integrations page. AddContacts.tsx shows Salesforce as 'Coming Soon' disabled card. THE GAP: No integration card for Salesforce. APPROACH: Add Salesforce card in Integrations.tsx with 2-way sync badge." },
  { id: 170, theme: "Integrations", subTheme: "INT-09", description: "Zapier (2-way) integration", priority: "SHOULD HAVE", designReview: "Missing", status: "missing", where: "No file exists", notes: "CURRENT STATE: No Integrations page exists. THE GAP: No integration card for Zapier. APPROACH: Add Zapier card in Integrations.tsx with 2-way sync badge." },
  { id: 171, theme: "Integrations", subTheme: "INT-10", description: "Integration status indicators (Connected/Disconnected with actions)", priority: "MUST HAVE", designReview: "Missing", status: "missing", where: "No file exists", notes: "CURRENT STATE: No integrations UI exists. THE GAP: No Connected/Disconnected status indicators with action buttons (Connect, Disconnect, Sync Now, View Logs). APPROACH: Build status badges and actions as part of each integration card in Integrations.tsx." },
  { id: 172, theme: "Integrations", subTheme: "INT-11", description: "Column mapping for integration data sync", priority: "SHOULD HAVE", designReview: "Missing", status: "missing", where: "No file exists", notes: "CURRENT STATE: CSVImportWizard.tsx has robust column mapping UI with grouped Select dropdowns, sample data preview, and auto-mapping. THE GAP: No integration-specific column mapping for CRM-to-ThankView field sync. APPROACH: Adapt CSVImportWizard mapping pattern into IntegrationMappingModal for CRM field mapping." },

  // ── Cross-Cutting Features (XCF-01 to XCF-34) ──
  { id: 173, theme: "Cross-Cutting Features", subTheme: "XCF-01", description: "In-browser video recording (webcam/screen)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "VideoCreate.tsx (RecordSetupStep — cam, screen-cam, screen modes)", notes: "Full recording with mic/camera device selection, countdown, audio viz." },
  { id: 174, theme: "Cross-Cutting Features", subTheme: "XCF-02", description: "Video upload from file", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "VideoCreate.tsx (SourceStep — Upload File option)", notes: "Upload MP4, MOV, or WebM." },
  { id: 175, theme: "Cross-Cutting Features", subTheme: "XCF-03", description: "Video thumbnails with duration", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "VideoLibrary.tsx (duration overlay on thumbnails)", notes: "Duration overlay on grid and list views." },
  { id: 176, theme: "Cross-Cutting Features", subTheme: "XCF-04", description: "Video intro/outro template framework", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "campaign/IntroOutroBuilder.tsx + assets/IntrosAndOutros.tsx", notes: "Intro and outro template system." },
  { id: 177, theme: "Cross-Cutting Features", subTheme: "XCF-05", description: "Background music on intros", priority: "SHOULD HAVE", designReview: "Partial", status: "partial", where: "IntrosAndOutros.tsx (musicTrack property)", notes: "WHAT EXISTS: IntrosAndOutros.tsx mock data includes musicTrack strings on intro items. Track name displayed with Music icon at line 293. WHAT'S MISSING: No interactive music selection UI — same gap as CAM-52. APPROACH: Build shared MusicPicker component used in both IntroOutroBuilder.tsx and IntrosAndOutros.tsx." },
  { id: 178, theme: "Cross-Cutting Features", subTheme: "XCF-06", description: "Video overlays", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "campaign/types.ts (overlay BuilderView type)", notes: "Overlay support in video builder." },
  { id: 179, theme: "Cross-Cutting Features", subTheme: "XCF-07", description: "Closed captions support", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "VideoCreate.tsx (CAPTIONS_DATA) + Settings.tsx (VideoTab)", notes: "Caption data with timestamps. AI and REV caption settings." },
  { id: 180, theme: "Cross-Cutting Features", subTheme: "XCF-08", description: "Video combining/stitching", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "VideoCreate.tsx (SourceStep — Combine Videos option)", notes: "Combine Videos to splice multiple library videos." },
  { id: 181, theme: "Cross-Cutting Features", subTheme: "XCF-09", description: "Merge tag system (%first_name%, %last_name%, etc.)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "MergeFieldPicker.tsx + EmailTemplateBuilder.tsx (MERGE_TAGS)", notes: "Full merge tag system across subject, sender, body." },
  { id: 182, theme: "Cross-Cutting Features", subTheme: "XCF-10", description: "Custom data fields beyond standard contact fields", priority: "SHOULD HAVE", designReview: "Partial", status: "partial", where: "MergeFieldPicker.tsx (extraFields prop) + ContactProfile.tsx", notes: "WHAT EXISTS: MergeFieldPicker.tsx accepts extraFields prop for additional field definitions. ContactProfile.tsx has per-contact custom field editing (add/edit/delete key-value pairs). WHAT'S MISSING: No centralized Custom Field Definitions admin page for defining field types, defaults, required status globally. APPROACH: Add 'Custom Fields' section in Settings.tsx with CRUD table for field definitions." },
  { id: 183, theme: "Cross-Cutting Features", subTheme: "XCF-11", description: "Contact import via CSV/file upload", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "AddContacts.tsx + CSVImportWizard.tsx", notes: "CSV import with column mapping wizard." },
  { id: 184, theme: "Cross-Cutting Features", subTheme: "XCF-12", description: "Contact import from integrations (Bloomerang, Salesforce, etc.)", priority: "SHOULD HAVE", designReview: "Missing", status: "missing", where: "No integrations page", notes: "CURRENT STATE: AddContacts.tsx has CSV import with column mapping wizard and RE NXT with simulated OAuth. Salesforce/Bloomerang are 'Coming Soon' placeholder cards. THE GAP: No actual import flows for Salesforce, Bloomerang, or other platforms. APPROACH: Once Integrations page exists (INT-01 through INT-09), add import flows to AddContacts.tsx following the RenxtFlow pattern." },
  { id: 185, theme: "Cross-Cutting Features", subTheme: "XCF-13", description: "Star/score rating system (1-5) for contacts and lists", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "Contacts.tsx (Star rating column)", notes: "Interactive 5-star rating on contacts." },
  { id: 186, theme: "Cross-Cutting Features", subTheme: "XCF-14", description: "Email delivery channel", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "CreateCampaign.tsx + EmailTemplateBuilder.tsx", notes: "Full email channel with HTML rendering." },
  { id: 187, theme: "Cross-Cutting Features", subTheme: "XCF-15", description: "SMS delivery channel", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "CreateCampaign.tsx (SMS channel option)", notes: "SMS as campaign channel with tracking." },
  { id: 188, theme: "Cross-Cutting Features", subTheme: "XCF-16", description: "Shareable Link delivery", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "CampaignsList.tsx (Shareable Link channel)", notes: "Shareable URL delivery method." },
  { id: 189, theme: "Cross-Cutting Features", subTheme: "XCF-17", description: "Send scheduling (future delivery)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "CreateCampaign.tsx (scheduleType, scheduledDate, scheduledTime)", notes: "Schedule type with date/time selection." },
  { id: 190, theme: "Cross-Cutting Features", subTheme: "XCF-18", description: "Send test before live send", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "SendTestModal.tsx", notes: "Send Test modal for email/SMS testing." },
  { id: 191, theme: "Cross-Cutting Features", subTheme: "XCF-19", description: "Campaign resend", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "CampaignDetail.tsx (resend logic)", notes: "Resend with constituent messaging." },
  { id: 192, theme: "Cross-Cutting Features", subTheme: "XCF-20", description: "Delivery status tracking (Delivered, Opened, Bounced, Failed)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Analytics.tsx (SEND_RECORDS) + CampaignDetail.tsx", notes: "Full status tracking with timestamps." },
  { id: 193, theme: "Cross-Cutting Features", subTheme: "XCF-21", description: "Unsubscribe handling (track and respect opt-outs)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Analytics.tsx + CreateCampaign.tsx", notes: "Unsubscribed contacts tracked in metrics." },
  { id: 194, theme: "Cross-Cutting Features", subTheme: "XCF-22", description: "Spam reporting tracking", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Analytics.tsx (SEND_RECORDS spam field)", notes: "Spam metrics tracked in send records." },
  { id: 195, theme: "Cross-Cutting Features", subTheme: "XCF-23", description: "Branded landing page creation with custom backgrounds", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "LandingPageBuilder.tsx", notes: "2-step wizard with customizable title, navbar, background, button colors." },
  { id: 196, theme: "Cross-Cutting Features", subTheme: "XCF-24", description: "Landing page template library (searchable, CRUD)", priority: "MUST HAVE", designReview: "Partial", status: "partial", where: "LandingPageBuilder.tsx (DEFAULT_BACKGROUNDS)", notes: "WHAT EXISTS: LandingPageBuilder.tsx has DEFAULT_BACKGROUNDS array with 6 pre-configured templates, each with full color/logo/background config. WHAT'S MISSING: No searchable template library UI with CRUD — cannot search, create new, or delete/rename templates. APPROACH: Add template management panel with search, rename, duplicate, delete actions per template card." },
  { id: 197, theme: "Cross-Cutting Features", subTheme: "XCF-25", description: "Branded envelope creation", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "EnvelopeBuilder.tsx", notes: "2-step wizard (Build + Finish) with design/colors/logos." },
  { id: 198, theme: "Cross-Cutting Features", subTheme: "XCF-26", description: "Organization logo on landing pages", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "LandingPageBuilder.tsx (logo in navigation bar)", notes: "Logo section in landing page builder." },
  { id: 199, theme: "Cross-Cutting Features", subTheme: "XCF-27", description: "Privacy Policy link on landing pages", priority: "MUST HAVE", designReview: "Missing", status: "missing", where: "LandingPageBuilder.tsx", notes: "CURRENT STATE: LandingPageBuilder.tsx builds landing pages with nav bar, logo, background, button colors. No privacy policy reference anywhere. THE GAP: No Privacy Policy link in landing page footer or nav. APPROACH: Add footer section to landing page preview in LandingPageBuilder.tsx with centered 'Privacy Policy' link." },
  { id: 200, theme: "Cross-Cutting Features", subTheme: "XCF-28", description: "Reply, Save, Share buttons on landing pages", priority: "MUST HAVE", designReview: "Partial", status: "partial", where: "LandingPageBuilder.tsx (replyBtnColor, saveBtnColor, shareBtnColor)", notes: "WHAT EXISTS: LandingPageBuilder.tsx data model includes replyBtnColor, saveBtnColor, shareBtnColor with ColorField inputs for configuration. WHAT'S MISSING: Landing page preview does not render actual Reply, Save, Share buttons — only color config exists. APPROACH: Add styled button elements below video player in preview, using configured colors." },
  { id: 201, theme: "Cross-Cutting Features", subTheme: "XCF-29", description: "Custom email domain for branded sending", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings.tsx (DnsSetupTab)", notes: "Custom domain management with verification." },
  { id: 202, theme: "Cross-Cutting Features", subTheme: "XCF-30", description: "Multi-user accounts with roles", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings.tsx (UsersTab + MOCK_USERS)", notes: "4 roles: TV Admin, Basic TV User, TV Video Recorder, TV Content Creator." },
  { id: 203, theme: "Cross-Cutting Features", subTheme: "XCF-31", description: "User management page (invite, edit, remove)", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings.tsx (UsersTab)", notes: "Full user management with invite, role assignment, deletion." },
  { id: 204, theme: "Cross-Cutting Features", subTheme: "XCF-32", description: "Activity filtered by user", priority: "SHOULD HAVE", designReview: "Pass", status: "done", where: "CampaignsList.tsx (creator filter) + VideoLibrary.tsx (creatorFilter)", notes: "Campaign and video filtering by creator/user." },
  { id: 205, theme: "Cross-Cutting Features", subTheme: "XCF-33", description: "Security settings page", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "UserProfile.tsx (Two-Step Verification) + Settings.tsx", notes: "Security settings with 2FA." },
  { id: 206, theme: "Cross-Cutting Features", subTheme: "XCF-34", description: "Subscription management", priority: "MUST HAVE", designReview: "Pass", status: "done", where: "Settings.tsx (Subscription & Billing tab)", notes: "Subscription & Billing tab." },
];

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */
export function RequirementsAudit() {
  const [expandedThemes, setExpandedThemes] = useState<Set<string>>(new Set([...THEME_ORDER, ...SETTINGS_THEME_ORDER, ...CONTACTS_THEME_ORDER, ...GAP_ANALYSIS_THEME_ORDER]));
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [search, setSearch] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  /* ── Persisted status overrides (localStorage) ── */
  const STORAGE_KEY = "tv-audit-status-overrides";
  const [statusOverrides, setStatusOverrides] = useState<Record<string, Status>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const updateStatus = useCallback((key: string, status: Status) => {
    setStatusOverrides(prev => {
      const next = { ...prev, [key]: status };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  /** Apply overrides to a requirement list */
  const withOverrides = useCallback((rows: Requirement[], prefix: string): Requirement[] => {
    return rows.map(r => {
      const key = `${prefix}-${r.id}`;
      const override = statusOverrides[key];
      return override ? { ...r, status: override } : r;
    });
  }, [statusOverrides]);

  /* ── All tabs use persisted overrides ── */
  const baseRows = useMemo(() => withOverrides(REQUIREMENTS, "base"), [withOverrides]);
  const settingsRows = useMemo(() => withOverrides(SETTINGS_REQUIREMENTS, "settings"), [withOverrides]);
  const contactsRows = useMemo(() => withOverrides(CONTACTS_REQUIREMENTS, "contacts"), [withOverrides]);
  const campaignsRows = useMemo(() => withOverrides(CAMPAIGNS_REQUIREMENTS, "campaigns"), [withOverrides]);
  const gapRows = useMemo(() => withOverrides(GAP_ANALYSIS_REQUIREMENTS, "gap"), [withOverrides]);

  const updateGapStatus = useCallback((id: number, status: Status) => {
    updateStatus(`gap-${id}`, status);
  }, [updateStatus]);

  /* ── Imported CSVs ── */
  const [importedCsvs, setImportedCsvs] = useState<ImportedCsv[]>([]);
  const [expandedImports, setExpandedImports] = useState<Set<string>>(new Set());
  const [expandedImportRows, setExpandedImportRows] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Active tab ── */
  type Tab = "base" | "settings" | "contacts" | "campaigns" | "gap-analysis" | string;
  const [activeTab, setActiveTab] = useState<Tab>("base");

  const handleImportCsv = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (!text) return;
      const rawRows = parseCsvText(text);
      if (rawRows.length === 0) return;
      const csvId = crypto.randomUUID();
      const rows = rawRows.map((raw, i) => csvRowToImported(raw, i, csvId));
      const baseName = file.name.replace(/\.csv$/i, "").replace(/[_-]/g, " ");
      const newCsv: ImportedCsv = {
        id: csvId,
        filename: file.name,
        displayName: baseName,
        importedAt: new Date().toLocaleString(),
        rows,
        visible: true,
      };
      setImportedCsvs(prev => [...prev, newCsv]);
      setActiveTab(csvId);
      // Auto-expand all themes for the new import
      const themes = new Set(rows.map(r => r.theme));
      setExpandedImports(prev => {
        const next = new Set(prev);
        themes.forEach(t => next.add(`${csvId}::${t}`));
        return next;
      });
    };
    reader.readAsText(file);
    e.target.value = "";
  }, []);

  const removeCsv = useCallback((csvId: string) => {
    setImportedCsvs(prev => prev.filter(c => c.id !== csvId));
    if (activeTab === csvId) setActiveTab("base");
  }, [activeTab]);

  const toggleCsvVisibility = useCallback((csvId: string) => {
    setImportedCsvs(prev => prev.map(c => c.id === csvId ? { ...c, visible: !c.visible } : c));
  }, []);

  const updateImportedRowStatus = useCallback((csvId: string, uid: string, status: Status) => {
    setImportedCsvs(prev => prev.map(c =>
      c.id === csvId
        ? { ...c, rows: c.rows.map(r => r.uid === uid ? { ...r, status } : r) }
        : c
    ));
  }, []);

  const renameCsv = useCallback((csvId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setImportedCsvs(prev => prev.map(c => c.id === csvId ? { ...c, displayName: trimmed } : c));
  }, []);

  /* ── Inline tab rename ── */
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabName, setEditingTabName] = useState("");
  const tabInputRef = useRef<HTMLInputElement>(null);

  const startRenameTab = useCallback((csv: ImportedCsv) => {
    setEditingTabId(csv.id);
    setEditingTabName(csv.displayName);
    // Focus after render
    setTimeout(() => tabInputRef.current?.select(), 0);
  }, []);

  const commitRenameTab = useCallback(() => {
    if (editingTabId) {
      renameCsv(editingTabId, editingTabName);
    }
    setEditingTabId(null);
  }, [editingTabId, editingTabName, renameCsv]);

  /* ── Base requirements filtering ── */
  const filtered = useMemo(() => {
    let items: Requirement[] = baseRows;
    if (statusFilter !== "all") items = items.filter(r => r.status === statusFilter);
    const q = search.toLowerCase().trim();
    if (q) items = items.filter(r =>
      r.description.toLowerCase().includes(q) ||
      r.notes.toLowerCase().includes(q) ||
      r.where.toLowerCase().includes(q)
    );
    return items;
  }, [baseRows, statusFilter, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, Requirement[]>();
    for (const theme of THEME_ORDER) map.set(theme, []);
    for (const r of filtered) {
      const group = map.get(r.theme) ?? [];
      group.push(r);
      map.set(r.theme, group);
    }
    return map;
  }, [filtered]);

  const stats = useMemo(() => {
    const total = baseRows.length;
    const done = baseRows.filter(r => r.status === "done").length;
    const partial = baseRows.filter(r => r.status === "partial").length;
    const missing = baseRows.filter(r => r.status === "missing").length;
    const na = baseRows.filter(r => r.status === "n/a").length;
    return { total, done, partial, missing, na };
  }, [baseRows]);

  /* ── Settings requirements filtering ── */
  const settingsFiltered = useMemo(() => {
    let items: Requirement[] = settingsRows;
    if (statusFilter !== "all") items = items.filter(r => r.status === statusFilter);
    const q = search.toLowerCase().trim();
    if (q) items = items.filter(r =>
      r.description.toLowerCase().includes(q) ||
      r.notes.toLowerCase().includes(q) ||
      r.where.toLowerCase().includes(q)
    );
    return items;
  }, [settingsRows, statusFilter, search]);

  const settingsGrouped = useMemo(() => {
    const map = new Map<string, Requirement[]>();
    for (const theme of SETTINGS_THEME_ORDER) map.set(theme, []);
    for (const r of settingsFiltered) {
      const group = map.get(r.theme) ?? [];
      group.push(r);
      map.set(r.theme, group);
    }
    return map;
  }, [settingsFiltered]);

  const settingsStats = useMemo(() => {
    const total = settingsRows.length;
    const done = settingsRows.filter(r => r.status === "done").length;
    const partial = settingsRows.filter(r => r.status === "partial").length;
    const missing = settingsRows.filter(r => r.status === "missing").length;
    const na = settingsRows.filter(r => r.status === "n/a").length;
    return { total, done, partial, missing, na };
  }, [settingsRows]);

  /* ── Contacts requirements filtering ── */
  const contactsFiltered = useMemo(() => {
    let items: Requirement[] = contactsRows;
    if (statusFilter !== "all") items = items.filter(r => r.status === statusFilter);
    const q = search.toLowerCase().trim();
    if (q) items = items.filter(r =>
      r.description.toLowerCase().includes(q) ||
      r.notes.toLowerCase().includes(q) ||
      r.where.toLowerCase().includes(q)
    );
    return items;
  }, [contactsRows, statusFilter, search]);

  const contactsGrouped = useMemo(() => {
    const map = new Map<string, Requirement[]>();
    for (const theme of CONTACTS_THEME_ORDER) map.set(theme, []);
    for (const r of contactsFiltered) {
      const group = map.get(r.theme) ?? [];
      group.push(r);
      map.set(r.theme, group);
    }
    return map;
  }, [contactsFiltered]);

  const contactsStats = useMemo(() => {
    const total = contactsRows.length;
    const done = contactsRows.filter(r => r.status === "done").length;
    const partial = contactsRows.filter(r => r.status === "partial").length;
    const missing = contactsRows.filter(r => r.status === "missing").length;
    const na = contactsRows.filter(r => r.status === "n/a").length;
    return { total, done, partial, missing, na };
  }, [contactsRows]);

  /* ── Campaigns requirements filtering ── */
  const campaignsFiltered = useMemo(() => {
    let items: Requirement[] = campaignsRows;
    if (statusFilter !== "all") items = items.filter(r => r.status === statusFilter);
    const q = search.toLowerCase().trim();
    if (q) items = items.filter(r =>
      r.description.toLowerCase().includes(q) ||
      r.notes.toLowerCase().includes(q) ||
      r.where.toLowerCase().includes(q)
    );
    return items;
  }, [campaignsRows, statusFilter, search]);

  const campaignsGrouped = useMemo(() => {
    const map = new Map<string, Requirement[]>();
    for (const theme of CAMPAIGNS_THEME_ORDER) map.set(theme, []);
    for (const r of campaignsFiltered) {
      const group = map.get(r.theme) ?? [];
      group.push(r);
      map.set(r.theme, group);
    }
    return map;
  }, [campaignsFiltered]);

  const campaignsStats = useMemo(() => {
    const total = campaignsRows.length;
    const done = campaignsRows.filter(r => r.status === "done").length;
    const partial = campaignsRows.filter(r => r.status === "partial").length;
    const missing = campaignsRows.filter(r => r.status === "missing").length;
    const na = campaignsRows.filter(r => r.status === "n/a").length;
    return { total, done, partial, missing, na };
  }, [campaignsRows]);

  /* ── Gap Analysis filtering & grouping ── */
  const gapFiltered = useMemo(() => {
    let items: Requirement[] = gapRows;
    if (statusFilter !== "all") items = items.filter(r => r.status === statusFilter);
    const q = search.toLowerCase().trim();
    if (q) items = items.filter(r =>
      r.description.toLowerCase().includes(q) ||
      r.notes.toLowerCase().includes(q) ||
      r.where.toLowerCase().includes(q) ||
      r.subTheme.toLowerCase().includes(q)
    );
    return items;
  }, [statusFilter, search, gapRows]);

  const gapGrouped = useMemo(() => {
    const map = new Map<string, Requirement[]>();
    for (const theme of GAP_ANALYSIS_THEME_ORDER) map.set(theme, []);
    for (const r of gapFiltered) {
      const group = map.get(r.theme) ?? [];
      group.push(r);
      map.set(r.theme, group);
    }
    return map;
  }, [gapFiltered]);

  const gapStats = useMemo(() => {
    const total = gapRows.length;
    const done = gapRows.filter(r => r.status === "done").length;
    const partial = gapRows.filter(r => r.status === "partial").length;
    const missing = gapRows.filter(r => r.status === "missing").length;
    const na = gapRows.filter(r => r.status === "n/a").length;
    return { total, done, partial, missing, na };
  }, [gapRows]);

  /* ── Imported CSV filtering & grouping ── */
  const getImportedGrouped = useCallback((csv: ImportedCsv) => {
    let rows = csv.rows;
    if (statusFilter !== "all") rows = rows.filter(r => r.status === statusFilter);
    const q = search.toLowerCase().trim();
    if (q) rows = rows.filter(r =>
      r.description.toLowerCase().includes(q) ||
      r.notes.toLowerCase().includes(q) ||
      r.where.toLowerCase().includes(q) ||
      r.theme.toLowerCase().includes(q)
    );
    const themes: string[] = [];
    const map = new Map<string, ImportedCsvRow[]>();
    for (const r of rows) {
      if (!map.has(r.theme)) { themes.push(r.theme); map.set(r.theme, []); }
      map.get(r.theme)!.push(r);
    }
    return { themes, map, filteredRows: rows };
  }, [statusFilter, search]);

  const getImportStats = useCallback((csv: ImportedCsv) => {
    const total = csv.rows.length;
    const done = csv.rows.filter(r => r.status === "done").length;
    const partial = csv.rows.filter(r => r.status === "partial").length;
    const missing = csv.rows.filter(r => r.status === "missing").length;
    const na = csv.rows.filter(r => r.status === "n/a").length;
    return { total, done, partial, missing, na };
  }, []);

  const toggleTheme = (theme: string) => {
    setExpandedThemes(prev => {
      const next = new Set(prev);
      if (next.has(theme)) next.delete(theme); else next.add(theme);
      return next;
    });
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleImportTheme = (key: string) => {
    setExpandedImports(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleImportRow = (uid: string) => {
    setExpandedImportRows(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      return next;
    });
  };

  const activeCsv = importedCsvs.find(c => c.id === activeTab);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8f6fc" }}>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b shadow-sm" style={{ borderColor: TV.borderLight }}>
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-[24px]" style={{ fontWeight: 900, color: TV.textPrimary }}>
                Requirements Audit
              </h1>
              <p className="text-[13px] mt-1" style={{ color: TV.textSecondary }}>
                {stats.total} video creation + {settingsStats.total} settings + {contactsStats.total} contacts + {gapStats.total} gap analysis requirements{importedCsvs.length > 0 ? ` + ${importedCsvs.reduce((s, c) => s + c.rows.length, 0)} imported` : ""} checked against the current prototype
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleImportCsv}
            />
          </div>

          {/* Tabs row */}
          <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab("base")}
              className="flex items-center gap-2 px-4 py-2 rounded-sm text-[12px] transition-all shrink-0 font-bold"
              style={{
                backgroundColor: activeTab === "base" ? TV.brandBg : "transparent",
                color: activeTab === "base" ? "white" : TV.textSecondary,
              }}
            >
              <FileSpreadsheet size={13} />
              Video Creation ({stats.total})
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className="flex items-center gap-2 px-4 py-2 rounded-sm text-[12px] transition-all shrink-0 font-bold"
              style={{
                backgroundColor: activeTab === "settings" ? TV.brandBg : "transparent",
                color: activeTab === "settings" ? "white" : TV.textSecondary,
              }}
            >
              <FileSpreadsheet size={13} />
              Settings ({settingsStats.total})
            </button>
            <button
              onClick={() => setActiveTab("contacts")}
              className="flex items-center gap-2 px-4 py-2 rounded-sm text-[12px] transition-all shrink-0 font-bold"
              style={{
                backgroundColor: activeTab === "contacts" ? TV.brandBg : "transparent",
                color: activeTab === "contacts" ? "white" : TV.textSecondary,
              }}
            >
              <FileSpreadsheet size={13} />
              Contacts ({contactsStats.total})
            </button>
            <button
              onClick={() => setActiveTab("campaigns")}
              className="flex items-center gap-2 px-4 py-2 rounded-sm text-[12px] transition-all shrink-0 font-bold"
              style={{
                backgroundColor: activeTab === "campaigns" ? TV.brandBg : "transparent",
                color: activeTab === "campaigns" ? "white" : TV.textSecondary,
              }}
            >
              <FileSpreadsheet size={13} />
              Campaigns ({campaignsStats.total})
            </button>
            <button
              onClick={() => setActiveTab("gap-analysis")}
              className="flex items-center gap-2 px-4 py-2 rounded-sm text-[12px] transition-all shrink-0 font-bold"
              style={{
                backgroundColor: activeTab === "gap-analysis" ? "#0e7490" : "transparent",
                color: activeTab === "gap-analysis" ? "white" : TV.textSecondary,
              }}
            >
              <AlertTriangle size={13} />
              Gap Analysis ({gapStats.total})
            </button>
            {importedCsvs.map(csv => {
              const iStats = getImportStats(csv);
              const isEditing = editingTabId === csv.id;
              return (
                <div key={csv.id} className="flex items-center gap-0 shrink-0">
                  {isEditing ? (
                    <input
                      ref={tabInputRef}
                      value={editingTabName}
                      onChange={e => setEditingTabName(e.target.value)}
                      onBlur={commitRenameTab}
                      onKeyDown={e => { if (e.key === "Enter") commitRenameTab(); if (e.key === "Escape") setEditingTabId(null); }}
                      className="px-3 py-2 rounded-l-[8px] text-[12px] outline-none border-2"
                      style={{ fontWeight: 600, borderColor: "#3730a3", backgroundColor: "#e0e7ff", color: "#3730a3", minWidth: 100, maxWidth: 260 }}
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => setActiveTab(csv.id)}
                      onDoubleClick={() => startRenameTab(csv)}
                      className="flex items-center gap-2 px-3 py-2 rounded-l-[8px] text-[12px] transition-all"
                      style={{
                        fontWeight: 600,
                        backgroundColor: activeTab === csv.id ? "#e0e7ff" : "transparent",
                        color: activeTab === csv.id ? "#3730a3" : TV.textSecondary,
                      }}
                      title="Double-click to rename"
                    >
                      <FileSpreadsheet size={12} />
                      {csv.displayName} ({iStats.total})
                    </button>
                  )}
                  <button
                    onClick={() => toggleCsvVisibility(csv.id)}
                    className="p-2 transition-colors hover:bg-black/5 rounded-none"
                    title={csv.visible ? "Hide from combined view" : "Show in combined view"}
                  >
                    {csv.visible ? <Eye size={11} style={{ color: TV.textSecondary }} /> : <EyeOff size={11} style={{ color: TV.textSecondary }} />}
                  </button>
                  <button
                    onClick={() => removeCsv(csv.id)}
                    className="p-2 transition-colors hover:bg-tv-danger-bg rounded-r-[8px]"
                    title="Remove imported CSV"
                  >
                    <X size={11} style={{ color: TV.danger }} />
                  </button>
                </div>
              );
            })}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-3 py-2 rounded-sm text-[11px] transition-colors hover:bg-black/5 shrink-0"
              style={{ color: TV.textSecondary }}
            >
              <Plus size={12} />
              Add CSV
            </button>
          </div>

          {/* Stats bar — context-sensitive */}
          {(activeTab === "base" || activeTab === "settings" || activeTab === "contacts" || activeTab === "campaigns" || activeTab === "gap-analysis") ? (() => {
            const s_ = activeTab === "base" ? stats : activeTab === "settings" ? settingsStats : activeTab === "campaigns" ? campaignsStats : activeTab === "gap-analysis" ? gapStats : contactsStats;
            const actionable = s_.total - s_.na;
            return (
            <div className="flex items-center gap-3 mb-3">
              {(["done", "partial", "missing", "n/a"] as Status[]).map(s => {
                const cfg = STATUS_CONFIG[s];
                const count = s === "done" ? s_.done : s === "partial" ? s_.partial : s === "missing" ? s_.missing : s_.na;
                const Icon = cfg.icon;
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(prev => prev === s ? "all" : s)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all"
                    style={{
                      borderColor: statusFilter === s ? cfg.color : TV.borderLight,
                      backgroundColor: statusFilter === s ? cfg.bg : "white",
                    }}
                  >
                    <Icon size={14} style={{ color: cfg.color }} />
                    <span className="text-[13px] font-bold" style={{ color: cfg.color }}>{count}</span>
                    <span className="text-[12px]" style={{ fontWeight: 500, color: TV.textSecondary }}>{cfg.label}</span>
                  </button>
                );
              })}
              <div className="flex-1" />
              {actionable > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[12px]" style={{ fontWeight: 600, color: TV.textSecondary }}>Coverage</span>
                <div className="w-40 h-2.5 rounded-full overflow-hidden flex" style={{ backgroundColor: TV.surface }}>
                  <div className="h-full" style={{ width: `${(s_.done / actionable) * 100}%`, backgroundColor: TV.success }} />
                  <div className="h-full" style={{ width: `${(s_.partial / actionable) * 100}%`, backgroundColor: TV.warning }} />
                  <div className="h-full" style={{ width: `${(s_.missing / actionable) * 100}%`, backgroundColor: TV.danger }} />
                </div>
                <span className="text-[13px] font-bold" style={{ color: s_.done === actionable ? TV.success : TV.textSecondary }}>
                  {Math.round(((s_.done + s_.partial * 0.5) / actionable) * 100)}%
                </span>
              </div>
              )}
            </div>
            );
          })() : activeCsv ? (
            <ImportStatsBar csv={activeCsv} getStats={getImportStats} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
          ) : null}

          {/* Search */}
          <div className="relative max-w-[400px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tv-text-secondary" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search requirements…"
              aria-label="Search requirements"
              className="w-full border border-tv-border-light bg-white rounded-full pl-9 pr-8 py-2 text-[13px] text-tv-text-primary outline-none transition-colors placeholder:text-tv-text-decorative focus:border-tv-border-strong focus:ring-1 focus:ring-tv-border-strong/30"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-black/5">
                <X size={12} style={{ color: TV.textSecondary }} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {/* ── BASE SPEC TAB ── */}
        {activeTab === "base" && (
          <>
            {THEME_ORDER.map(theme => {
              const items = grouped.get(theme) ?? [];
              if (items.length === 0 && statusFilter !== "all") return null;
              const isExpanded = expandedThemes.has(theme);
              const themeTotal = baseRows.filter(r => r.theme === theme).length;
              const themeDone = baseRows.filter(r => r.theme === theme && r.status === "done").length;
              const themePartial = baseRows.filter(r => r.theme === theme && r.status === "partial").length;
              const themeNA = baseRows.filter(r => r.theme === theme && r.status === "n/a").length;
              const themeActionable = themeTotal - themeNA;

              return (
                <div key={theme} className="mb-4">
                  <button
                    onClick={() => toggleTheme(theme)}
                    className="w-full flex items-center gap-3 px-5 py-3 rounded-t-[14px] transition-colors hover:bg-white/80"
                    style={{ backgroundColor: "white", borderBottom: isExpanded ? `1px solid ${TV.borderLight}` : "none", borderRadius: isExpanded ? "14px 14px 0 0" : "14px" }}
                  >
                    {isExpanded ? <ChevronDown size={16} style={{ color: TV.textSecondary }} /> : <ChevronRight size={16} style={{ color: TV.textSecondary }} />}
                    <span className="text-[15px]" style={{ fontWeight: 800, color: TV.textPrimary }}>{theme}</span>
                    <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ fontWeight: 600, backgroundColor: TV.surfaceMuted, color: TV.textSecondary }}>
                      {items.length} / {themeTotal}
                    </span>
                    <div className="flex-1" />
                    {themeActionable > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full overflow-hidden flex" style={{ backgroundColor: TV.surface }}>
                          <div className="h-full" style={{ width: `${(themeDone / themeActionable) * 100}%`, backgroundColor: TV.success }} />
                          <div className="h-full" style={{ width: `${(themePartial / themeActionable) * 100}%`, backgroundColor: TV.warning }} />
                        </div>
                        <span className="text-[11px]" style={{ fontWeight: 600, color: themeDone === themeActionable ? TV.success : TV.textSecondary }}>
                          {themeDone}/{themeActionable}
                        </span>
                      </div>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="bg-white rounded-b-[14px] overflow-hidden shadow-sm" style={{ border: `1px solid ${TV.borderLight}`, borderTop: "none" }}>
                      <div className="flex items-center gap-3 px-5 py-2" style={{ backgroundColor: TV.surfaceMuted }}>
                        <span className="w-6 text-center text-[9px] font-bold" style={{ color: TV.textSecondary }}>#</span>
                        <span className="text-[9px] flex-1 font-bold" style={{ color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Requirement</span>
                        <span className="text-[9px] w-[72px] text-center font-bold" style={{ color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Priority</span>
                        <span className="text-[9px] w-[80px] text-center font-bold" style={{ color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Design Rev</span>
                        <span className="text-[9px] w-[80px] text-center font-bold" style={{ color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Prototype</span>
                      </div>
                      {items.map((r, i) => {
                        const cfg = STATUS_CONFIG[r.status];
                        const Icon = cfg.icon;
                        const rowKey = `base-${r.id}`;
                        const isOpen = expandedRows.has(rowKey);
                        return (
                          <div key={r.id} style={{ borderTop: i > 0 ? `1px solid ${TV.borderLight}` : "none" }}>
                            <div
                              onClick={() => toggleRow(rowKey)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleRow(rowKey); } }}
                              className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-black/[0.01] cursor-pointer"
                              style={{ backgroundColor: isOpen ? `${cfg.bg}80` : "transparent" }}
                            >
                              <span className="w-6 text-center text-[10px]" style={{ fontWeight: 600, color: TV.textSecondary }}>{r.id}</span>
                              <div className="flex-1 min-w-0">
                                {r.subTheme && r.subTheme !== "General" && (
                                  <span className="text-[9px] mr-2 px-1.5 py-0.5 rounded" style={{ fontWeight: 500, backgroundColor: TV.surfaceMuted, color: TV.textSecondary }}>{r.subTheme}</span>
                                )}
                                <span className="text-[12px]" style={{ fontWeight: 500, color: TV.textPrimary }}>
                                  {r.description.length > 120 ? r.description.slice(0, 120) + "…" : r.description}
                                </span>
                              </div>
                              <span className="w-[72px] text-center text-[10px] shrink-0" style={{
                                fontWeight: 600,
                                color: r.priority === "MUST HAVE" ? TV.danger : r.priority === "SHOULD HAVE" ? TV.warning : r.priority === "COULD HAVE" ? "#0e7490" : TV.textSecondary,
                              }}>
                                {r.priority || "—"}
                              </span>
                              <span className="w-[80px] text-center text-[10px] shrink-0" style={{
                                fontWeight: 500,
                                color: r.designReview === "Pass" ? TV.success : r.designReview.includes("Fail") ? TV.danger : r.designReview === "Needs Work" ? TV.warning : TV.textSecondary,
                              }}>
                                {r.designReview.length > 14 ? r.designReview.slice(0, 14) + "…" : r.designReview}
                              </span>
                              <div className="w-[80px] flex justify-center shrink-0">
                                <GapStatusToggle status={r.status} onChange={(s) => updateStatus("base-" + r.id, s)} />
                              </div>
                            </div>
                            {isOpen && (
                              <div className="px-5 pb-4 pt-1" style={{ backgroundColor: `${cfg.bg}40`, marginLeft: 24 }}>
                                <div className="rounded-md p-4" style={{ backgroundColor: "white", border: `1px solid ${TV.borderLight}` }}>
                                  <p className="text-[12px] mb-3" style={{ color: TV.textPrimary, lineHeight: "1.6" }}>{r.description}</p>
                                  <div className="flex items-start gap-2 mb-2">
                                    <span className="text-[9px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: TV.surfaceMuted, color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Where</span>
                                    <span className="text-[11px] font-mono" style={{ color: TV.textBrand, lineHeight: "1.5" }}>{r.where}</span>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <span className="text-[9px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: TV.surfaceMuted, color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Notes</span>
                                    <span className="text-[11px]" style={{ color: TV.textSecondary, lineHeight: "1.6" }}>{r.notes}</span>
                                  </div>
                                  {(r.status === "partial" || r.status === "missing") && (
                                    <PromptBlock prompt={generatePrompt(r, "Video Creation")} />
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Summary */}
            <div className="mt-8 rounded-xl p-6" style={{ backgroundColor: "white", border: `1px solid ${TV.borderLight}` }}>
              <h2 className="text-[16px] mb-4" style={{ fontWeight: 800, color: TV.textPrimary }}>Summary</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg p-4" style={{ backgroundColor: TV.warningBg, border: `1px solid ${TV.warningBorder}` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={16} style={{ color: TV.warning }} />
                    <span className="text-[13px] font-bold" style={{ color: TV.warningHover }}>Partial — Needs Attention ({stats.partial})</span>
                  </div>
                  <ul className="space-y-2">
                    {baseRows.filter(r => r.status === "partial").map(r => (
                      <li key={r.id} className="flex items-start gap-2">
                        <span className="text-[10px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded-full" style={{ fontWeight: 600, backgroundColor: "#fef3c7", color: TV.warningHover }}>#{r.id}</span>
                        <span className="text-[11px]" style={{ color: "#78350f", lineHeight: "1.5" }}>
                          <span style={{ fontWeight: 600 }}>{r.description.slice(0, 80)}{r.description.length > 80 ? "…" : ""}</span>
                          {" — "}{r.notes}
                        </span>
                      </li>
                    ))}
                    {stats.partial === 0 && (
                      <li className="text-[12px]" style={{ color: TV.warningHover }}>None — all actionable requirements are fully addressed!</li>
                    )}
                  </ul>
                </div>
                <div className="rounded-lg p-4" style={{ backgroundColor: "#f5f5f5", border: "1px solid #e5e5e5" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <MinusCircle size={16} style={{ color: "#737373" }} />
                    <span className="text-[13px] font-bold" style={{ color: "#525252" }}>Not Applicable to Prototype ({stats.na})</span>
                  </div>
                  <ul className="space-y-2">
                    {baseRows.filter(r => r.status === "n/a").map(r => (
                      <li key={r.id} className="flex items-start gap-2">
                        <span className="text-[10px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded-full" style={{ fontWeight: 600, backgroundColor: "#e5e5e5", color: "#525252" }}>#{r.id}</span>
                        <span className="text-[11px]" style={{ color: "#525252", lineHeight: "1.5" }}>{r.description.slice(0, 100)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── SETTINGS TAB ── */}
        {activeTab === "settings" && (
          <>
            {SETTINGS_THEME_ORDER.map(theme => {
              const items = settingsGrouped.get(theme) ?? [];
              if (items.length === 0 && statusFilter !== "all") return null;
              const isExpanded = expandedThemes.has(theme);
              const themeTotal = settingsRows.filter(r => r.theme === theme).length;
              const themeDone = settingsRows.filter(r => r.theme === theme && r.status === "done").length;
              const themePartial = settingsRows.filter(r => r.theme === theme && r.status === "partial").length;
              const themeNA = settingsRows.filter(r => r.theme === theme && r.status === "n/a").length;
              const themeActionable = themeTotal - themeNA;

              return (
                <div key={theme} className="mb-4">
                  <button
                    onClick={() => toggleTheme(theme)}
                    className="w-full flex items-center gap-3 px-5 py-3 rounded-t-[14px] transition-colors hover:bg-white/80"
                    style={{ backgroundColor: "white", borderBottom: isExpanded ? `1px solid ${TV.borderLight}` : "none", borderRadius: isExpanded ? "14px 14px 0 0" : "14px" }}
                  >
                    {isExpanded ? <ChevronDown size={16} style={{ color: TV.textSecondary }} /> : <ChevronRight size={16} style={{ color: TV.textSecondary }} />}
                    <span className="text-[15px]" style={{ fontWeight: 800, color: TV.textPrimary }}>{theme}</span>
                    <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ fontWeight: 600, backgroundColor: TV.surfaceMuted, color: TV.textSecondary }}>
                      {items.length} / {themeTotal}
                    </span>
                    <div className="flex-1" />
                    {themeActionable > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full overflow-hidden flex" style={{ backgroundColor: TV.surface }}>
                          <div className="h-full" style={{ width: `${(themeDone / themeActionable) * 100}%`, backgroundColor: TV.success }} />
                          <div className="h-full" style={{ width: `${(themePartial / themeActionable) * 100}%`, backgroundColor: TV.warning }} />
                        </div>
                        <span className="text-[11px]" style={{ fontWeight: 600, color: themeDone === themeActionable ? TV.success : TV.textSecondary }}>
                          {themeDone}/{themeActionable}
                        </span>
                      </div>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="bg-white rounded-b-[14px] overflow-hidden shadow-sm" style={{ border: `1px solid ${TV.borderLight}`, borderTop: "none" }}>
                      <div className="flex items-center gap-3 px-5 py-2" style={{ backgroundColor: TV.surfaceMuted }}>
                        <span className="w-6 text-center text-[9px] font-bold" style={{ color: TV.textSecondary }}>#</span>
                        <span className="text-[9px] flex-1 font-bold" style={{ color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Requirement</span>
                        <span className="text-[9px] w-[72px] text-center font-bold" style={{ color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Priority</span>
                        <span className="text-[9px] w-[80px] text-center font-bold" style={{ color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Design Rev</span>
                        <span className="text-[9px] w-[80px] text-center font-bold" style={{ color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Prototype</span>
                      </div>
                      {items.map((r, i) => {
                        const cfg = STATUS_CONFIG[r.status];
                        const Icon = cfg.icon;
                        const rowKey = `settings-${r.id}`;
                        const isOpen = expandedRows.has(rowKey);
                        return (
                          <div key={r.id} style={{ borderTop: i > 0 ? `1px solid ${TV.borderLight}` : "none" }}>
                            <div
                              onClick={() => toggleRow(rowKey)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleRow(rowKey); } }}
                              className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-black/[0.01] cursor-pointer"
                              style={{ backgroundColor: isOpen ? `${cfg.bg}80` : "transparent" }}
                            >
                              <span className="w-6 text-center text-[10px]" style={{ fontWeight: 600, color: TV.textSecondary }}>{r.id}</span>
                              <div className="flex-1 min-w-0">
                                {r.subTheme && r.subTheme !== "General" && (
                                  <span className="text-[9px] mr-2 px-1.5 py-0.5 rounded" style={{ fontWeight: 500, backgroundColor: TV.surfaceMuted, color: TV.textSecondary }}>{r.subTheme}</span>
                                )}
                                <span className="text-[12px]" style={{ fontWeight: 500, color: TV.textPrimary }}>
                                  {r.description.length > 120 ? r.description.slice(0, 120) + "…" : r.description}
                                </span>
                              </div>
                              <span className="w-[72px] text-center text-[10px] shrink-0" style={{
                                fontWeight: 600,
                                color: r.priority === "MUST HAVE" ? TV.danger : r.priority === "SHOULD HAVE" ? TV.warning : r.priority === "COULD HAVE" ? "#0e7490" : TV.textSecondary,
                              }}>
                                {r.priority || "—"}
                              </span>
                              <span className="w-[80px] text-center text-[10px] shrink-0" style={{
                                fontWeight: 500,
                                color: r.designReview === "Pass" ? TV.success : r.designReview.includes("Fail") ? TV.danger : r.designReview === "Needs Work" ? TV.warning : TV.textSecondary,
                              }}>
                                {r.designReview.length > 14 ? r.designReview.slice(0, 14) + "…" : r.designReview}
                              </span>
                              <div className="w-[80px] flex justify-center shrink-0">
                                <GapStatusToggle status={r.status} onChange={(s) => updateStatus("settings-" + r.id, s)} />
                              </div>
                            </div>
                            {isOpen && (
                              <div className="px-5 pb-4 pt-1" style={{ backgroundColor: `${cfg.bg}40`, marginLeft: 24 }}>
                                <div className="rounded-md p-4" style={{ backgroundColor: "white", border: `1px solid ${TV.borderLight}` }}>
                                  <p className="text-[12px] mb-3" style={{ color: TV.textPrimary, lineHeight: "1.6" }}>{r.description}</p>
                                  <div className="flex items-start gap-2 mb-2">
                                    <span className="text-[9px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: TV.surfaceMuted, color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Where</span>
                                    <span className="text-[11px] font-mono" style={{ color: TV.textBrand, lineHeight: "1.5" }}>{r.where}</span>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <span className="text-[9px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: TV.surfaceMuted, color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Notes</span>
                                    <span className="text-[11px]" style={{ color: TV.textSecondary, lineHeight: "1.6" }}>{r.notes}</span>
                                  </div>
                                  {(r.status === "partial" || r.status === "missing") && (
                                    <PromptBlock prompt={generatePrompt(r, "Settings")} />
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Summary */}
            <div className="mt-8 rounded-xl p-6" style={{ backgroundColor: "white", border: `1px solid ${TV.borderLight}` }}>
              <h2 className="text-[16px] mb-4" style={{ fontWeight: 800, color: TV.textPrimary }}>Summary</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg p-4" style={{ backgroundColor: TV.warningBg, border: `1px solid ${TV.warningBorder}` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={16} style={{ color: TV.warning }} />
                    <span className="text-[13px] font-bold" style={{ color: TV.warningHover }}>Partial — Needs Attention ({settingsStats.partial})</span>
                  </div>
                  <ul className="space-y-2">
                    {settingsRows.filter(r => r.status === "partial").map(r => (
                      <li key={r.id} className="flex items-start gap-2">
                        <span className="text-[10px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded-full" style={{ fontWeight: 600, backgroundColor: "#fef3c7", color: TV.warningHover }}>#{r.id}</span>
                        <span className="text-[11px]" style={{ color: "#78350f", lineHeight: "1.5" }}>
                          <span style={{ fontWeight: 600 }}>{r.description.slice(0, 80)}{r.description.length > 80 ? "…" : ""}</span>
                          {" — "}{r.notes}
                        </span>
                      </li>
                    ))}
                    {settingsStats.partial === 0 && (
                      <li className="text-[12px]" style={{ color: TV.warningHover }}>None — all actionable requirements are fully addressed!</li>
                    )}
                  </ul>
                </div>
                <div className="rounded-lg p-4" style={{ backgroundColor: "#f5f5f5", border: "1px solid #e5e5e5" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <MinusCircle size={16} style={{ color: "#737373" }} />
                    <span className="text-[13px] font-bold" style={{ color: "#525252" }}>Not Applicable to Prototype ({settingsStats.na})</span>
                  </div>
                  <ul className="space-y-2">
                    {settingsRows.filter(r => r.status === "n/a").map(r => (
                      <li key={r.id} className="flex items-start gap-2">
                        <span className="text-[10px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded-full" style={{ fontWeight: 600, backgroundColor: "#e5e5e5", color: "#525252" }}>#{r.id}</span>
                        <span className="text-[11px]" style={{ color: "#525252", lineHeight: "1.5" }}>{r.description.slice(0, 100)}</span>
                      </li>
                    ))}
                    {settingsStats.na === 0 && (
                      <li className="text-[12px]" style={{ color: "#525252" }}>None — all settings requirements are applicable.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── CAMPAIGNS TAB ── */}
        {activeTab === "campaigns" && (
          <>
            {CAMPAIGNS_THEME_ORDER.map(theme => {
              const items = campaignsGrouped.get(theme) ?? [];
              if (items.length === 0 && statusFilter !== "all") return null;
              const isExpanded = expandedThemes.has(theme);
              const themeTotal = campaignsRows.filter(r => r.theme === theme).length;
              const themeDone = campaignsRows.filter(r => r.theme === theme && r.status === "done").length;
              const themePartial = campaignsRows.filter(r => r.theme === theme && r.status === "partial").length;
              const themeNA = campaignsRows.filter(r => r.theme === theme && r.status === "n/a").length;
              const themeActionable = themeTotal - themeNA;

              return (
                <div key={theme} className="mb-4">
                  <button
                    onClick={() => toggleTheme(theme)}
                    className="w-full flex items-center gap-3 px-5 py-3 rounded-t-[14px] transition-colors hover:bg-white/80"
                    style={{ backgroundColor: "white", borderBottom: isExpanded ? `1px solid ${TV.borderLight}` : "none", borderRadius: isExpanded ? "14px 14px 0 0" : "14px" }}
                  >
                    {isExpanded ? <ChevronDown size={16} style={{ color: TV.textSecondary }} /> : <ChevronRight size={16} style={{ color: TV.textSecondary }} />}
                    <span className="text-[15px]" style={{ fontWeight: 800, color: TV.textPrimary }}>{theme}</span>
                    <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ fontWeight: 600, backgroundColor: TV.surfaceMuted, color: TV.textSecondary }}>
                      {items.length} / {themeTotal}
                    </span>
                    <div className="flex-1" />
                    {themeActionable > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full overflow-hidden flex" style={{ backgroundColor: TV.surface }}>
                          <div className="h-full" style={{ width: `${(themeDone / themeActionable) * 100}%`, backgroundColor: TV.success }} />
                          <div className="h-full" style={{ width: `${(themePartial / themeActionable) * 100}%`, backgroundColor: TV.warning }} />
                        </div>
                        <span className="text-[11px]" style={{ fontWeight: 600, color: themeDone === themeActionable ? TV.success : TV.textSecondary }}>
                          {themeDone}/{themeActionable}
                        </span>
                      </div>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="bg-white rounded-b-[14px] overflow-hidden shadow-sm" style={{ border: `1px solid ${TV.borderLight}`, borderTop: "none" }}>
                      <div className="flex items-center gap-3 px-5 py-2" style={{ backgroundColor: TV.surfaceMuted }}>
                        <span className="w-6 text-center text-[9px] font-bold" style={{ color: TV.textSecondary }}>#</span>
                        <span className="text-[9px] flex-1 font-bold" style={{ color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Requirement</span>
                        <span className="text-[9px] w-[72px] text-center font-bold" style={{ color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Priority</span>
                        <span className="text-[9px] w-[80px] text-center font-bold" style={{ color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Design Rev</span>
                        <span className="text-[9px] w-[80px] text-center font-bold" style={{ color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Prototype</span>
                      </div>
                      {items.map((r, i) => {
                        const cfg = STATUS_CONFIG[r.status];
                        const Icon = cfg.icon;
                        const rowKey = `campaigns-${r.id}`;
                        const isOpen = expandedRows.has(rowKey);
                        return (
                          <div key={r.id} style={{ borderTop: i > 0 ? `1px solid ${TV.borderLight}` : "none" }}>
                            <div
                              onClick={() => toggleRow(rowKey)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleRow(rowKey); } }}
                              className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-black/[0.01] cursor-pointer"
                              style={{ backgroundColor: isOpen ? `${cfg.bg}80` : "transparent" }}
                            >
                              <span className="w-6 text-center text-[10px]" style={{ fontWeight: 600, color: TV.textSecondary }}>{r.id}</span>
                              <div className="flex-1 min-w-0">
                                {r.subTheme && r.subTheme !== "General" && (
                                  <span className="text-[9px] mr-2 px-1.5 py-0.5 rounded" style={{ fontWeight: 500, backgroundColor: TV.surfaceMuted, color: TV.textSecondary }}>{r.subTheme}</span>
                                )}
                                <span className="text-[12px]" style={{ fontWeight: 500, color: TV.textPrimary }}>
                                  {r.description.length > 120 ? r.description.slice(0, 120) + "\u2026" : r.description}
                                </span>
                              </div>
                              <span className="w-[72px] text-center text-[10px] shrink-0" style={{
                                fontWeight: 600,
                                color: r.priority === "MUST HAVE" ? TV.danger : r.priority === "SHOULD HAVE" ? TV.warning : r.priority === "COULD HAVE" ? "#0e7490" : TV.textSecondary,
                              }}>
                                {r.priority || "\u2014"}
                              </span>
                              <span className="w-[80px] text-center text-[10px] shrink-0" style={{
                                fontWeight: 500,
                                color: r.designReview === "Pass" ? TV.success : r.designReview.includes("Fail") ? TV.danger : r.designReview === "Needs Work" ? TV.warning : TV.textSecondary,
                              }}>
                                {r.designReview.length > 14 ? r.designReview.slice(0, 14) + "\u2026" : r.designReview}
                              </span>
                              <div className="w-[80px] flex justify-center shrink-0">
                                <GapStatusToggle status={r.status} onChange={(s) => updateStatus("campaigns-" + r.id, s)} />
                              </div>
                            </div>
                            {isOpen && (
                              <div className="px-5 pb-4 pt-1" style={{ backgroundColor: `${cfg.bg}40`, marginLeft: 24 }}>
                                <div className="rounded-md p-4" style={{ backgroundColor: "white", border: `1px solid ${TV.borderLight}` }}>
                                  <p className="text-[12px] mb-3" style={{ color: TV.textPrimary, lineHeight: "1.6" }}>{r.description}</p>
                                  {r.where && (
                                    <div className="flex items-start gap-2 mb-2">
                                      <span className="text-[9px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: TV.surfaceMuted, color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Where</span>
                                      <span className="text-[11px] font-mono" style={{ color: TV.textBrand, lineHeight: "1.5" }}>{r.where}</span>
                                    </div>
                                  )}
                                  {r.notes && (
                                    <div className="flex items-start gap-2">
                                      <span className="text-[9px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: TV.surfaceMuted, color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Notes</span>
                                      <span className="text-[11px]" style={{ color: TV.textSecondary, lineHeight: "1.6" }}>{r.notes}</span>
                                    </div>
                                  )}

                                  {(r.status === "partial" || r.status === "missing") && (
                                    <PromptBlock prompt={generatePrompt(r, "Campaigns")} />
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Summary */}
            <div className="mt-8 rounded-xl p-6" style={{ backgroundColor: "white", border: `1px solid ${TV.borderLight}` }}>
              <h2 className="text-[16px] mb-4" style={{ fontWeight: 800, color: TV.textPrimary }}>Summary</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg p-4" style={{ backgroundColor: TV.warningBg, border: `1px solid ${TV.warningBorder}` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={16} style={{ color: TV.warning }} />
                    <span className="text-[13px] font-bold" style={{ color: TV.warningHover }}>Partial \u2014 Needs Attention ({campaignsStats.partial})</span>
                  </div>
                  <ul className="space-y-2">
                    {campaignsRows.filter(r => r.status === "partial").map(r => (
                      <li key={r.id} className="flex items-start gap-2">
                        <span className="text-[10px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded-full" style={{ fontWeight: 600, backgroundColor: "#fef3c7", color: TV.warningHover }}>#{r.id}</span>
                        <span className="text-[11px]" style={{ color: "#78350f", lineHeight: "1.5" }}>
                          <span style={{ fontWeight: 600 }}>{r.description.slice(0, 80)}{r.description.length > 80 ? "\u2026" : ""}</span>
                          {r.notes ? " \u2014 " + r.notes : ""}
                        </span>
                      </li>
                    ))}
                    {campaignsStats.partial === 0 && (
                      <li className="text-[12px]" style={{ color: TV.warningHover }}>None \u2014 all actionable requirements are fully addressed!</li>
                    )}
                  </ul>
                </div>
                <div className="rounded-lg p-4" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle size={16} style={{ color: TV.danger }} />
                    <span className="text-[13px] font-bold" style={{ color: "#991b1b" }}>Missing \u2014 Not Yet Built ({campaignsStats.missing})</span>
                  </div>
                  <ul className="space-y-2">
                    {campaignsRows.filter(r => r.status === "missing").map(r => (
                      <li key={r.id} className="flex items-start gap-2">
                        <span className="text-[10px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded-full" style={{ fontWeight: 600, backgroundColor: "#fecaca", color: "#991b1b" }}>#{r.id}</span>
                        <span className="text-[11px]" style={{ color: "#991b1b", lineHeight: "1.5" }}>
                          <span style={{ fontWeight: 600 }}>{r.description.slice(0, 80)}{r.description.length > 80 ? "\u2026" : ""}</span>
                          {r.notes ? " \u2014 " + r.notes : ""}
                        </span>
                      </li>
                    ))}
                    {campaignsStats.missing === 0 && (
                      <li className="text-[12px]" style={{ color: "#991b1b" }}>None \u2014 all high-priority requirements are addressed!</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── GAP ANALYSIS TAB ── */}
        {activeTab === "gap-analysis" && (
          <>
            {GAP_ANALYSIS_THEME_ORDER.map(theme => {
              const items = gapGrouped.get(theme) ?? [];
              if (items.length === 0 && statusFilter !== "all") return null;
              const isExpanded = expandedThemes.has(theme);
              const themeTotal = gapRows.filter(r => r.theme === theme).length;
              const themeDone = gapRows.filter(r => r.theme === theme && r.status === "done").length;
              const themePartial = gapRows.filter(r => r.theme === theme && r.status === "partial").length;
              const themeNA = gapRows.filter(r => r.theme === theme && r.status === "n/a").length;
              const themeActionable = themeTotal - themeNA;

              return (
                <div key={theme} className="mb-4">
                  <button
                    onClick={() => toggleTheme(theme)}
                    className="w-full flex items-center gap-3 px-5 py-3 rounded-t-[14px] transition-colors hover:bg-white/80"
                    style={{ backgroundColor: "white", borderBottom: isExpanded ? `1px solid ${TV.borderLight}` : "none", borderRadius: isExpanded ? "14px 14px 0 0" : "14px" }}
                  >
                    {isExpanded ? <ChevronDown size={16} style={{ color: TV.textSecondary }} /> : <ChevronRight size={16} style={{ color: TV.textSecondary }} />}
                    <span className="text-[15px]" style={{ fontWeight: 800, color: TV.textPrimary }}>{theme}</span>
                    <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ fontWeight: 600, backgroundColor: TV.surfaceMuted, color: TV.textSecondary }}>
                      {items.length} / {themeTotal}
                    </span>
                    <div className="flex-1" />
                    {themeActionable > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full overflow-hidden flex" style={{ backgroundColor: TV.surface }}>
                          <div className="h-full" style={{ width: `${(themeDone / themeActionable) * 100}%`, backgroundColor: TV.success }} />
                          <div className="h-full" style={{ width: `${(themePartial / themeActionable) * 100}%`, backgroundColor: TV.warning }} />
                        </div>
                        <span className="text-[11px]" style={{ fontWeight: 600, color: themeDone === themeActionable ? TV.success : TV.textSecondary }}>
                          {themeDone}/{themeActionable}
                        </span>
                      </div>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="bg-white rounded-b-[14px] shadow-sm" style={{ border: `1px solid ${TV.borderLight}`, borderTop: "none", position: "relative" }}>
                      <div className="flex items-center gap-3 px-5 py-2" style={{ backgroundColor: TV.surfaceMuted }}>
                        <span className="w-8 text-center text-[9px] font-bold" style={{ color: TV.textSecondary }}>ID</span>
                        <span className="text-[9px] flex-1 font-bold" style={{ color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Requirement</span>
                        <span className="text-[9px] w-[72px] text-center font-bold" style={{ color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Priority</span>
                        <span className="text-[9px] w-[80px] text-center font-bold" style={{ color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Design Rev</span>
                        <span className="text-[9px] w-[80px] text-center font-bold" style={{ color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</span>
                      </div>
                      {items.map((r, i) => {
                        const cfg = STATUS_CONFIG[r.status];
                        const Icon = cfg.icon;
                        const rowKey = `gap-${r.id}`;
                        const isOpen = expandedRows.has(rowKey);
                        return (
                          <div key={r.id} style={{ borderTop: i > 0 ? `1px solid ${TV.borderLight}` : "none" }}>
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => toggleRow(rowKey)}
                              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleRow(rowKey); } }}
                              className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-black/[0.01] cursor-pointer"
                              style={{ backgroundColor: isOpen ? `${cfg.bg}80` : "transparent" }}
                            >
                              <span className="w-8 text-center text-[10px]" style={{ fontWeight: 600, color: TV.textBrand }}>{r.subTheme}</span>
                              <div className="flex-1 min-w-0">
                                <span className="text-[12px]" style={{ fontWeight: 500, color: TV.textPrimary }}>
                                  {r.description.length > 120 ? r.description.slice(0, 120) + "…" : r.description}
                                </span>
                              </div>
                              <span className="w-[72px] text-center text-[10px] shrink-0" style={{
                                fontWeight: 600,
                                color: r.priority === "MUST HAVE" ? TV.danger : r.priority === "SHOULD HAVE" ? TV.warning : r.priority === "COULD HAVE" ? "#0e7490" : TV.textSecondary,
                              }}>
                                {r.priority || "—"}
                              </span>
                              <span className="w-[80px] text-center text-[10px] shrink-0" style={{
                                fontWeight: 500,
                                color: r.designReview === "Pass" ? TV.success : r.designReview.includes("Missing") ? TV.danger : r.designReview === "Partial" ? TV.warning : TV.textSecondary,
                              }}>
                                {r.designReview}
                              </span>
                              <div className="w-[80px] flex justify-center shrink-0" onClick={e => e.stopPropagation()}>
                                <GapStatusToggle status={r.status} onChange={(s) => updateGapStatus(r.id, s)} />
                              </div>
                            </div>
                            {isOpen && (
                              <div className="px-5 pb-4 pt-1" style={{ backgroundColor: `${cfg.bg}40`, marginLeft: 24 }}>
                                <div className="rounded-md p-4" style={{ backgroundColor: "white", border: `1px solid ${TV.borderLight}` }}>
                                  <p className="text-[12px] mb-3" style={{ color: TV.textPrimary, lineHeight: "1.6" }}>{r.description}</p>
                                  <div className="flex items-start gap-2 mb-2">
                                    <span className="text-[9px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: TV.surfaceMuted, color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Where</span>
                                    <span className="text-[11px] font-mono" style={{ color: TV.textBrand, lineHeight: "1.5" }}>{r.where}</span>
                                  </div>
                                  <div className="flex items-start gap-2 mb-3">
                                    <span className="text-[9px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: TV.surfaceMuted, color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Notes</span>
                                    <span className="text-[11px]" style={{ color: TV.textSecondary, lineHeight: "1.6" }}>{r.notes}</span>
                                  </div>
                                  <div className="flex items-center gap-2 mb-3">
                                    <span className="text-[9px] shrink-0 px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: TV.surfaceMuted, color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</span>
                                    <div className="flex gap-1">
                                      {(["done", "partial", "missing", "n/a"] as Status[]).map(s => {
                                        const sc = STATUS_CONFIG[s];
                                        const SIcon = sc.icon;
                                        const isActive = r.status === s;
                                        return (
                                          <button
                                            key={s}
                                            onClick={() => updateGapStatus(r.id, s)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] transition-all border"
                                            style={{
                                              fontWeight: 600,
                                              backgroundColor: isActive ? sc.bg : "white",
                                              color: isActive ? sc.color : TV.textSecondary,
                                              borderColor: isActive ? sc.color : TV.borderLight,
                                              opacity: isActive ? 1 : 0.6,
                                            }}
                                          >
                                            <SIcon size={10} />{sc.label}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                  {(r.status === "partial" || r.status === "missing") && (
                                    <PromptBlock prompt={generatePrompt(r, "Gap Analysis")} />
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Gap Analysis Summary */}
            <div className="mt-8 rounded-xl p-6" style={{ backgroundColor: "white", border: `1px solid ${TV.borderLight}` }}>
              <h2 className="text-[16px] mb-4" style={{ fontWeight: 800, color: TV.textPrimary }}>Gap Analysis Summary</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg p-4" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle size={16} style={{ color: TV.danger }} />
                    <span className="text-[13px] font-bold" style={{ color: "#991b1b" }}>Missing — Not Implemented ({gapStats.missing})</span>
                  </div>
                  <ul className="space-y-2">
                    {gapRows.filter(r => r.status === "missing").map(r => (
                      <li key={r.id} className="flex items-start gap-2">
                        <span className="text-[10px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded-full" style={{ fontWeight: 600, backgroundColor: "#fecaca", color: "#991b1b" }}>{r.subTheme}</span>
                        <span className="text-[11px]" style={{ color: "#991b1b", lineHeight: "1.5" }}>
                          <span style={{ fontWeight: 600 }}>{r.description.slice(0, 80)}{r.description.length > 80 ? "…" : ""}</span>
                          {" — "}{r.notes.slice(0, 100)}{r.notes.length > 100 ? "…" : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg p-4" style={{ backgroundColor: TV.warningBg, border: `1px solid ${TV.warningBorder}` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={16} style={{ color: TV.warning }} />
                    <span className="text-[13px] font-bold" style={{ color: TV.warningHover }}>Partial — Needs Attention ({gapStats.partial})</span>
                  </div>
                  <ul className="space-y-2">
                    {gapRows.filter(r => r.status === "partial").map(r => (
                      <li key={r.id} className="flex items-start gap-2">
                        <span className="text-[10px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded-full" style={{ fontWeight: 600, backgroundColor: "#fef3c7", color: TV.warningHover }}>{r.subTheme}</span>
                        <span className="text-[11px]" style={{ color: "#78350f", lineHeight: "1.5" }}>
                          <span style={{ fontWeight: 600 }}>{r.description.slice(0, 80)}{r.description.length > 80 ? "…" : ""}</span>
                          {" — "}{r.notes.slice(0, 100)}{r.notes.length > 100 ? "…" : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── CONTACTS TAB ── */}
        {activeTab === "contacts" && (
          <>
            {CONTACTS_THEME_ORDER.map(theme => {
              const items = contactsGrouped.get(theme) ?? [];
              if (items.length === 0 && statusFilter !== "all") return null;
              const isExpanded = expandedThemes.has(theme);
              const themeTotal = contactsRows.filter(r => r.theme === theme).length;
              const themeDone = contactsRows.filter(r => r.theme === theme && r.status === "done").length;
              const themePartial = contactsRows.filter(r => r.theme === theme && r.status === "partial").length;
              const themeNA = contactsRows.filter(r => r.theme === theme && r.status === "n/a").length;
              const themeActionable = themeTotal - themeNA;

              return (
                <div key={theme} className="mb-4">
                  <button
                    onClick={() => toggleTheme(theme)}
                    className="w-full flex items-center gap-3 px-5 py-3 rounded-t-[14px] transition-colors hover:bg-white/80"
                    style={{ backgroundColor: "white", borderBottom: isExpanded ? `1px solid ${TV.borderLight}` : "none", borderRadius: isExpanded ? "14px 14px 0 0" : "14px" }}
                  >
                    {isExpanded ? <ChevronDown size={16} style={{ color: TV.textSecondary }} /> : <ChevronRight size={16} style={{ color: TV.textSecondary }} />}
                    <span className="text-[15px]" style={{ fontWeight: 800, color: TV.textPrimary }}>{theme}</span>
                    <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ fontWeight: 600, backgroundColor: TV.surfaceMuted, color: TV.textSecondary }}>
                      {items.length} / {themeTotal}
                    </span>
                    <div className="flex-1" />
                    {themeActionable > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full overflow-hidden flex" style={{ backgroundColor: TV.surface }}>
                          <div className="h-full" style={{ width: `${(themeDone / themeActionable) * 100}%`, backgroundColor: TV.success }} />
                          <div className="h-full" style={{ width: `${(themePartial / themeActionable) * 100}%`, backgroundColor: TV.warning }} />
                        </div>
                        <span className="text-[11px]" style={{ fontWeight: 600, color: themeDone === themeActionable ? TV.success : TV.textSecondary }}>
                          {themeDone}/{themeActionable}
                        </span>
                      </div>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="bg-white rounded-b-[14px] overflow-hidden shadow-sm" style={{ border: `1px solid ${TV.borderLight}`, borderTop: "none" }}>
                      <div className="flex items-center gap-3 px-5 py-2" style={{ backgroundColor: TV.surfaceMuted }}>
                        <span className="w-6 text-center text-[9px] font-bold" style={{ color: TV.textSecondary }}>#</span>
                        <span className="text-[9px] flex-1 font-bold" style={{ color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Requirement</span>
                        <span className="text-[9px] w-[72px] text-center font-bold" style={{ color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Priority</span>
                        <span className="text-[9px] w-[80px] text-center font-bold" style={{ color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Design Rev</span>
                        <span className="text-[9px] w-[80px] text-center font-bold" style={{ color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Prototype</span>
                      </div>
                      {items.map((r, i) => {
                        const cfg = STATUS_CONFIG[r.status];
                        const Icon = cfg.icon;
                        const rowKey = `contacts-${r.id}`;
                        const isOpen = expandedRows.has(rowKey);
                        return (
                          <div key={r.id} style={{ borderTop: i > 0 ? `1px solid ${TV.borderLight}` : "none" }}>
                            <div
                              onClick={() => toggleRow(rowKey)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleRow(rowKey); } }}
                              className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-black/[0.01] cursor-pointer"
                              style={{ backgroundColor: isOpen ? `${cfg.bg}80` : "transparent" }}
                            >
                              <span className="w-6 text-center text-[10px]" style={{ fontWeight: 600, color: TV.textSecondary }}>{r.id}</span>
                              <div className="flex-1 min-w-0">
                                {r.subTheme && r.subTheme !== "General" && (
                                  <span className="text-[9px] mr-2 px-1.5 py-0.5 rounded" style={{ fontWeight: 500, backgroundColor: TV.surfaceMuted, color: TV.textSecondary }}>{r.subTheme}</span>
                                )}
                                <span className="text-[12px]" style={{ fontWeight: 500, color: TV.textPrimary }}>
                                  {r.description.length > 120 ? r.description.slice(0, 120) + "…" : r.description}
                                </span>
                              </div>
                              <span className="w-[72px] text-center text-[10px] shrink-0" style={{
                                fontWeight: 600,
                                color: r.priority === "MUST HAVE" ? TV.danger : r.priority === "SHOULD HAVE" ? TV.warning : r.priority === "COULD HAVE" ? "#0e7490" : TV.textSecondary,
                              }}>
                                {r.priority || "—"}
                              </span>
                              <span className="w-[80px] text-center text-[10px] shrink-0" style={{
                                fontWeight: 500,
                                color: r.designReview === "Pass" ? TV.success : r.designReview.includes("Fail") ? TV.danger : r.designReview === "Needs Work" ? TV.warning : TV.textSecondary,
                              }}>
                                {r.designReview.length > 14 ? r.designReview.slice(0, 14) + "…" : r.designReview}
                              </span>
                              <div className="w-[80px] flex justify-center shrink-0">
                                <GapStatusToggle status={r.status} onChange={(s) => updateStatus("contacts-" + r.id, s)} />
                              </div>
                            </div>
                            {isOpen && (
                              <div className="px-5 pb-4 pt-1" style={{ backgroundColor: `${cfg.bg}40`, marginLeft: 24 }}>
                                <div className="rounded-md p-4" style={{ backgroundColor: "white", border: `1px solid ${TV.borderLight}` }}>
                                  <p className="text-[12px] mb-3" style={{ color: TV.textPrimary, lineHeight: "1.6" }}>{r.description}</p>
                                  <div className="flex items-start gap-2 mb-2">
                                    <span className="text-[9px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: TV.surfaceMuted, color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Where</span>
                                    <span className="text-[11px] font-mono" style={{ color: TV.textBrand, lineHeight: "1.5" }}>{r.where}</span>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <span className="text-[9px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: TV.surfaceMuted, color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Notes</span>
                                    <span className="text-[11px]" style={{ color: TV.textSecondary, lineHeight: "1.6" }}>{r.notes}</span>
                                  </div>
                                  {(r.status === "partial" || r.status === "missing") && (
                                    <PromptBlock prompt={generatePrompt(r, "Contacts")} />
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Summary */}
            <div className="mt-8 rounded-xl p-6" style={{ backgroundColor: "white", border: `1px solid ${TV.borderLight}` }}>
              <h2 className="text-[16px] mb-4" style={{ fontWeight: 800, color: TV.textPrimary }}>Summary</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg p-4" style={{ backgroundColor: TV.warningBg, border: `1px solid ${TV.warningBorder}` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={16} style={{ color: TV.warning }} />
                    <span className="text-[13px] font-bold" style={{ color: TV.warningHover }}>Partial — Needs Attention ({contactsStats.partial})</span>
                  </div>
                  <ul className="space-y-2">
                    {contactsRows.filter(r => r.status === "partial").map(r => (
                      <li key={r.id} className="flex items-start gap-2">
                        <span className="text-[10px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded-full" style={{ fontWeight: 600, backgroundColor: "#fef3c7", color: TV.warningHover }}>#{r.id}</span>
                        <span className="text-[11px]" style={{ color: "#78350f", lineHeight: "1.5" }}>
                          <span style={{ fontWeight: 600 }}>{r.description.slice(0, 80)}{r.description.length > 80 ? "…" : ""}</span>
                          {" — "}{r.notes}
                        </span>
                      </li>
                    ))}
                    {contactsStats.partial === 0 && (
                      <li className="text-[12px]" style={{ color: TV.warningHover }}>None — all actionable requirements are fully addressed!</li>
                    )}
                  </ul>
                </div>
                <div className="rounded-lg p-4" style={{ backgroundColor: "#f5f5f5", border: "1px solid #e5e5e5" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <MinusCircle size={16} style={{ color: "#737373" }} />
                    <span className="text-[13px] font-bold" style={{ color: "#525252" }}>Not Applicable to Prototype ({contactsStats.na})</span>
                  </div>
                  <ul className="space-y-2">
                    {contactsRows.filter(r => r.status === "n/a").map(r => (
                      <li key={r.id} className="flex items-start gap-2">
                        <span className="text-[10px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded-full" style={{ fontWeight: 600, backgroundColor: "#e5e5e5", color: "#525252" }}>#{r.id}</span>
                        <span className="text-[11px]" style={{ color: "#525252", lineHeight: "1.5" }}>{r.description.slice(0, 100)}</span>
                      </li>
                    ))}
                    {contactsStats.na === 0 && (
                      <li className="text-[12px]" style={{ color: "#525252" }}>None — all contacts requirements are applicable.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── IMPORTED CSV TAB ── */}
        {activeCsv && (
          <ImportedCsvView
            csv={activeCsv}
            statusFilter={statusFilter}
            search={search}
            getGrouped={getImportedGrouped}
            expandedImports={expandedImports}
            toggleImportTheme={toggleImportTheme}
            expandedImportRows={expandedImportRows}
            toggleImportRow={toggleImportRow}
            updateStatus={updateImportedRowStatus}
          />
        )}

        {/* Empty state for no imported CSVs */}
        {activeTab !== "base" && activeTab !== "settings" && activeTab !== "contacts" && activeTab !== "campaigns" && activeTab !== "gap-analysis" && !activeCsv && (
          <div className="flex flex-col items-center justify-center py-20">
            <FileSpreadsheet size={48} style={{ color: TV.borderLight }} />
            <p className="text-[14px] mt-4" style={{ fontWeight: 600, color: TV.textSecondary }}>This imported CSV was removed.</p>
            <button
              onClick={() => setActiveTab("base")}
              className="mt-3 px-4 py-2 rounded-sm text-[12px]"
              style={{ fontWeight: 600, backgroundColor: TV.brandBg, color: "white" }}
            >
              Back to Video Creation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════ */

/* ── Gap Analysis status toggle (inline badge that opens a picker) ── */
function GapStatusToggle({ status, onChange }: { status: Status; onChange: (s: Status) => void }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;

  const openMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.right - 130 });
    }
    setOpen(o => !o);
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={openMenu}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] transition-all hover:ring-2 hover:ring-offset-1"
        style={{ fontWeight: 600, backgroundColor: cfg.bg, color: cfg.color, cursor: "pointer" }}
        title="Click to change status"
      >
        <Icon size={11} />{cfg.label}
        <ChevronDown size={9} style={{ marginLeft: 1, opacity: 0.6 }} />
      </button>
      {open && (
        <div>
          <div className="fixed inset-0 z-[9998]" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
          <div
            className="fixed z-[9999] rounded-lg shadow-lg py-1 min-w-[130px]"
            style={{ top: pos.top, left: pos.left, backgroundColor: "white", border: `1px solid ${TV.borderLight}` }}
          >
            {(["done", "partial", "missing", "n/a"] as Status[]).map(s => {
              const sc = STATUS_CONFIG[s];
              const SIcon = sc.icon;
              return (
                <button
                  key={s}
                  onClick={(e) => { e.stopPropagation(); onChange(s); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-black/[0.03]"
                  style={{ backgroundColor: status === s ? sc.bg : "transparent" }}
                >
                  <SIcon size={12} style={{ color: sc.color }} />
                  <span className="text-[11px]" style={{ fontWeight: status === s ? 700 : 500, color: status === s ? sc.color : TV.textPrimary }}>{sc.label}</span>
                  {status === s && <Check size={10} style={{ color: sc.color, marginLeft: "auto" }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ImportStatsBar({ csv, getStats, statusFilter, setStatusFilter }: {
  csv: ImportedCsv;
  getStats: (csv: ImportedCsv) => { total: number; done: number; partial: number; missing: number; na: number };
  statusFilter: Status | "all";
  setStatusFilter: React.Dispatch<React.SetStateAction<Status | "all">>;
}) {
  const iStats = getStats(csv);
  const actionable = iStats.total - iStats.na;
  return (
    <div className="flex items-center gap-3 mb-3">
      {(["done", "partial", "missing", "n/a"] as Status[]).map(s => {
        const cfg = STATUS_CONFIG[s];
        const count = s === "done" ? iStats.done : s === "partial" ? iStats.partial : s === "missing" ? iStats.missing : iStats.na;
        const Icon = cfg.icon;
        return (
          <button
            key={s}
            onClick={() => setStatusFilter(prev => prev === s ? "all" : s)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all"
            style={{
              borderColor: statusFilter === s ? cfg.color : TV.borderLight,
              backgroundColor: statusFilter === s ? cfg.bg : "white",
            }}
          >
            <Icon size={14} style={{ color: cfg.color }} />
            <span className="text-[13px] font-bold" style={{ color: cfg.color }}>{count}</span>
            <span className="text-[12px]" style={{ fontWeight: 500, color: TV.textSecondary }}>{cfg.label}</span>
          </button>
        );
      })}
      <div className="flex-1" />
      {actionable > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-[12px]" style={{ fontWeight: 600, color: TV.textSecondary }}>Coverage</span>
          <div className="w-40 h-2.5 rounded-full overflow-hidden flex" style={{ backgroundColor: TV.surface }}>
            <div className="h-full" style={{ width: `${(iStats.done / actionable) * 100}%`, backgroundColor: TV.success }} />
            <div className="h-full" style={{ width: `${(iStats.partial / actionable) * 100}%`, backgroundColor: TV.warning }} />
            <div className="h-full" style={{ width: `${(iStats.missing / actionable) * 100}%`, backgroundColor: TV.danger }} />
          </div>
          <span className="text-[13px] font-bold" style={{ color: iStats.done === actionable ? TV.success : TV.textSecondary }}>
            {actionable > 0 ? Math.round(((iStats.done + iStats.partial * 0.5) / actionable) * 100) : 0}%
          </span>
        </div>
      )}
    </div>
  );
}

function ImportedCsvView({ csv, statusFilter, search, getGrouped, expandedImports, toggleImportTheme, expandedImportRows, toggleImportRow, updateStatus }: {
  csv: ImportedCsv;
  statusFilter: Status | "all";
  search: string;
  getGrouped: (csv: ImportedCsv) => { themes: string[]; map: Map<string, ImportedCsvRow[]>; filteredRows: ImportedCsvRow[] };
  expandedImports: Set<string>;
  toggleImportTheme: (key: string) => void;
  expandedImportRows: Set<string>;
  toggleImportRow: (uid: string) => void;
  updateStatus: (csvId: string, uid: string, status: Status) => void;
}) {
  const { themes, map, filteredRows } = getGrouped(csv);
  const allRows = csv.rows;
  const iStats = {
    total: allRows.length,
    done: allRows.filter(r => r.status === "done").length,
    partial: allRows.filter(r => r.status === "partial").length,
    missing: allRows.filter(r => r.status === "missing").length,
    na: allRows.filter(r => r.status === "n/a").length,
  };

  return (
    <>
      {themes.map(theme => {
        const rows = map.get(theme) ?? [];
        const themeKey = `${csv.id}::${theme}`;
        const isExpanded = expandedImports.has(themeKey);
        const allThemeRows = allRows.filter(r => r.theme === theme);
        const tDone = allThemeRows.filter(r => r.status === "done").length;
        const tPartial = allThemeRows.filter(r => r.status === "partial").length;
        const tNA = allThemeRows.filter(r => r.status === "n/a").length;
        const tActionable = allThemeRows.length - tNA;

        return (
          <div key={themeKey} className="mb-4">
            <button
              onClick={() => toggleImportTheme(themeKey)}
              className="w-full flex items-center gap-3 px-5 py-3 rounded-t-[14px] transition-colors hover:bg-white/80"
              style={{ backgroundColor: "white", borderBottom: isExpanded ? `1px solid ${TV.borderLight}` : "none", borderRadius: isExpanded ? "14px 14px 0 0" : "14px" }}
            >
              {isExpanded ? <ChevronDown size={16} style={{ color: TV.textSecondary }} /> : <ChevronRight size={16} style={{ color: TV.textSecondary }} />}
              <span className="text-[15px]" style={{ fontWeight: 800, color: TV.textPrimary }}>{theme}</span>
              <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ fontWeight: 600, backgroundColor: TV.surfaceMuted, color: TV.textSecondary }}>
                {rows.length} / {allThemeRows.length}
              </span>
              <div className="flex-1" />
              {tActionable > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 rounded-full overflow-hidden flex" style={{ backgroundColor: TV.surface }}>
                    <div className="h-full" style={{ width: `${(tDone / tActionable) * 100}%`, backgroundColor: TV.success }} />
                    <div className="h-full" style={{ width: `${(tPartial / tActionable) * 100}%`, backgroundColor: TV.warning }} />
                  </div>
                  <span className="text-[11px]" style={{ fontWeight: 600, color: tDone === tActionable ? TV.success : TV.textSecondary }}>
                    {tDone}/{tActionable}
                  </span>
                </div>
              )}
            </button>

            {isExpanded && (
              <div className="bg-white rounded-b-[14px] overflow-hidden shadow-sm" style={{ border: `1px solid ${TV.borderLight}`, borderTop: "none" }}>
                <div className="flex items-center gap-3 px-5 py-2" style={{ backgroundColor: TV.surfaceMuted }}>
                  <span className="w-6 text-center text-[9px] font-bold" style={{ color: TV.textSecondary }}>#</span>
                  <span className="text-[9px] flex-1 font-bold" style={{ color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Requirement</span>
                  <span className="text-[9px] w-[72px] text-center font-bold" style={{ color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Priority</span>
                  <span className="text-[9px] w-[80px] text-center font-bold" style={{ color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Design Rev</span>
                  <span className="text-[9px] w-[80px] text-center font-bold" style={{ color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Prototype</span>
                </div>

                {rows.map((r, i) => {
                  const cfg = STATUS_CONFIG[r.status];
                  const Icon = cfg.icon;
                  const isOpen = expandedImportRows.has(r.uid);

                  return (
                    <div key={r.uid} style={{ borderTop: i > 0 ? `1px solid ${TV.borderLight}` : "none" }}>
                      <button
                        onClick={() => toggleImportRow(r.uid)}
                        className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-black/[0.01]"
                        style={{ backgroundColor: isOpen ? `${cfg.bg}80` : "transparent" }}
                      >
                        <span className="w-6 text-center text-[10px]" style={{ fontWeight: 600, color: TV.textSecondary }}>{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          {r.subTheme && (
                            <span className="text-[9px] mr-2 px-1.5 py-0.5 rounded" style={{ fontWeight: 500, backgroundColor: TV.surfaceMuted, color: TV.textSecondary }}>{r.subTheme}</span>
                          )}
                          <span className="text-[12px]" style={{ fontWeight: 500, color: TV.textPrimary }}>
                            {r.description.length > 120 ? r.description.slice(0, 120) + "…" : r.description}
                          </span>
                        </div>
                        <span className="w-[72px] text-center text-[10px] shrink-0" style={{
                          fontWeight: 600,
                          color: r.priority.toUpperCase().includes("MUST") ? TV.danger : r.priority.toUpperCase().includes("SHOULD") ? TV.warning : r.priority.toUpperCase().includes("COULD") ? "#0e7490" : TV.textSecondary,
                        }}>
                          {r.priority || "—"}
                        </span>
                        <span className="w-[80px] text-center text-[10px] shrink-0" style={{
                          fontWeight: 500,
                          color: r.designReview.toLowerCase().includes("pass") ? TV.success : r.designReview.toLowerCase().includes("fail") ? TV.danger : r.designReview.toLowerCase().includes("needs") ? TV.warning : TV.textSecondary,
                        }}>
                          {r.designReview.length > 14 ? r.designReview.slice(0, 14) + "…" : r.designReview || "—"}
                        </span>
                        {/* Editable status pill */}
                        <div className="w-[80px] flex justify-center shrink-0" onClick={e => e.stopPropagation()}>
                          <select
                            value={r.status}
                            onChange={e => updateStatus(csv.id, r.uid, e.target.value as Status)}
                            className="text-[10px] px-2.5 py-1 rounded-full border-none outline-none cursor-pointer"
                            style={{ fontWeight: 600, backgroundColor: cfg.bg, color: cfg.color, WebkitAppearance: "none", MozAppearance: "none", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg width='8' height='5' viewBox='0 0 8 5' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L4 4L7 1' stroke='${encodeURIComponent(cfg.color)}' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 6px center", paddingRight: 18 }}
                          >
                            <option value="done">Done</option>
                            <option value="partial">Partial</option>
                            <option value="missing">Missing</option>
                            <option value="n/a">N/A</option>
                          </select>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-4 pt-1" style={{ backgroundColor: `${cfg.bg}40`, marginLeft: 24 }}>
                          <div className="rounded-md p-4" style={{ backgroundColor: "white", border: `1px solid ${TV.borderLight}` }}>
                            <p className="text-[12px] mb-3" style={{ color: TV.textPrimary, lineHeight: "1.6" }}>{r.description}</p>
                            {r.where && (
                              <div className="flex items-start gap-2 mb-2">
                                <span className="text-[9px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: TV.surfaceMuted, color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Where</span>
                                <span className="text-[11px] font-mono" style={{ color: TV.textBrand, lineHeight: "1.5" }}>{r.where}</span>
                              </div>
                            )}
                            {r.notes && (
                              <div className="flex items-start gap-2 mb-2">
                                <span className="text-[9px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: TV.surfaceMuted, color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Notes</span>
                                <span className="text-[11px]" style={{ color: TV.textSecondary, lineHeight: "1.6" }}>{r.notes}</span>
                              </div>
                            )}
                            {/* Collapsed raw CSV data */}
                            <details className="mt-2 pt-2 border-t" style={{ borderColor: TV.borderLight }}>
                              <summary className="text-[9px] cursor-pointer select-none font-bold" style={{ color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>All CSV Columns</summary>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                                {Object.entries(r.rawCols).map(([key, val]) => (
                                  <div key={key} className="flex items-start gap-2">
                                    <span className="text-[9px] shrink-0 mt-0.5 px-1 py-0.5 rounded" style={{ fontWeight: 600, backgroundColor: TV.surfaceMuted, color: TV.textSecondary }}>{key}</span>
                                    <span className="text-[10px]" style={{ color: TV.textPrimary, lineHeight: "1.4" }}>{val || "—"}</span>
                                  </div>
                                ))}
                              </div>
                            </details>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Summary */}
      <div className="mt-8 rounded-xl p-6" style={{ backgroundColor: "white", border: `1px solid ${TV.borderLight}` }}>
        <h2 className="text-[16px] mb-4" style={{ fontWeight: 800, color: TV.textPrimary }}>Summary</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg p-4" style={{ backgroundColor: TV.warningBg, border: `1px solid ${TV.warningBorder}` }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} style={{ color: TV.warning }} />
              <span className="text-[13px] font-bold" style={{ color: TV.warningHover }}>Partial — Needs Attention ({iStats.partial})</span>
            </div>
            <ul className="space-y-2">
              {allRows.filter(r => r.status === "partial").map(r => (
                <li key={r.uid} className="flex items-start gap-2">
                  <span className="text-[10px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded-full" style={{ fontWeight: 600, backgroundColor: "#fef3c7", color: TV.warningHover }}>#{allRows.indexOf(r) + 1}</span>
                  <span className="text-[11px]" style={{ color: "#78350f", lineHeight: "1.5" }}>
                    <span style={{ fontWeight: 600 }}>{r.description.slice(0, 80)}{r.description.length > 80 ? "…" : ""}</span>
                    {r.notes ? ` — ${r.notes}` : ""}
                  </span>
                </li>
              ))}
              {iStats.partial === 0 && (
                <li className="text-[12px]" style={{ color: TV.warningHover }}>None — all actionable requirements are fully addressed!</li>
              )}
            </ul>
          </div>
          <div className="rounded-lg p-4" style={{ backgroundColor: TV.dangerBg, border: "1px solid #fecaca" }}>
            <div className="flex items-center gap-2 mb-3">
              <XCircle size={16} style={{ color: TV.danger }} />
              <span className="text-[13px] font-bold" style={{ color: "#b91c1c" }}>Missing — Not Yet Built ({iStats.missing})</span>
            </div>
            <ul className="space-y-2">
              {allRows.filter(r => r.status === "missing").map(r => (
                <li key={r.uid} className="flex items-start gap-2">
                  <span className="text-[10px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded-full" style={{ fontWeight: 600, backgroundColor: TV.dangerBg, color: "#b91c1c" }}>#{allRows.indexOf(r) + 1}</span>
                  <span className="text-[11px]" style={{ color: "#b91c1c", lineHeight: "1.5" }}>
                    <span style={{ fontWeight: 600 }}>{r.description.slice(0, 80)}{r.description.length > 80 ? "…" : ""}</span>
                    {r.notes ? ` — ${r.notes}` : ""}
                  </span>
                </li>
              ))}
              {iStats.missing === 0 && (
                <li className="text-[12px]" style={{ color: "#b91c1c" }}>None — all requirements have been addressed!</li>
              )}
            </ul>
          </div>
        </div>
        {iStats.na > 0 && (
          <div className="rounded-lg p-4 mt-4" style={{ backgroundColor: "#f5f5f5", border: "1px solid #e5e5e5" }}>
            <div className="flex items-center gap-2 mb-3">
              <MinusCircle size={16} style={{ color: "#737373" }} />
              <span className="text-[13px] font-bold" style={{ color: "#525252" }}>Not Applicable ({iStats.na})</span>
            </div>
            <ul className="space-y-2">
              {allRows.filter(r => r.status === "n/a").map(r => (
                <li key={r.uid} className="flex items-start gap-2">
                  <span className="text-[10px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded-full" style={{ fontWeight: 600, backgroundColor: "#e5e5e5", color: "#525252" }}>#{allRows.indexOf(r) + 1}</span>
                  <span className="text-[11px]" style={{ color: "#525252", lineHeight: "1.5" }}>{r.description.slice(0, 100)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {filteredRows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <Search size={32} style={{ color: TV.borderLight }} />
          <p className="text-[13px] mt-3" style={{ color: TV.textSecondary }}>No matching rows in this CSV.</p>
        </div>
      )}
    </>
  );
}
