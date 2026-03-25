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
  kelleyPriority: string;
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
  kelleyPriority: string;
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
    kelleyPriority: findCol(raw, "kelley", "kelleypriority", "kelley priority", "product priority") || "",
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
  { id: 1, theme: "Adding a New Video", subTheme: "General", description: "Users should be able to add a new video to TV either in the campaign flow or from the video library page", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "VideoLibrary (AddVideoModal), PersonalizedRecorder", notes: "Video Library has full add-video wizard (record/upload/library/combine). Campaign flow uses PersonalizedRecorder for 1:1 batch recording." },
  { id: 2, theme: "Adding a New Video", subTheme: "Recording in app", description: "Users should be able to record a video, from within the ThankView web app, on their computer", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "PersonalizedRecorder (record phase), VideoLibrary (AddVideoModal → RecordSetupStep), VideoCreate", notes: "Full webcam recording UI with countdown, elapsed timer, start/stop controls in both PersonalizedRecorder and the library's add-video wizard." },
  { id: 3, theme: "Adding a New Video", subTheme: "Recording in app", description: "Users should be able to record a video on their phone within the ThankView web app", priority: "MUST HAVE", kelleyPriority: "High", designReview: "N/A to Design", status: "n/a", where: "—", notes: "Marked N/A to Design. Mobile-responsive recording would require native camera APIs; no UI mock needed for this prototype." },
  { id: 4, theme: "Adding a New Video", subTheme: "Recording in app", description: "Script visible on screen while recording (teleprompter)", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "PersonalizedRecorder (script panel + overlay)", notes: "Script panel with toggle, merge-field support ({{First Name}}), resolved live preview, and transparent overlay on camera view during recording." },
  { id: 5, theme: "Adding a New Video", subTheme: "Recording in app", description: "Select which camera to use for recording", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "PersonalizedRecorder (ToolbarBtn camera dropdown)", notes: "Camera dropdown in toolbar with 3 mock devices. Selection persists across constituents." },
  { id: 6, theme: "Adding a New Video", subTheme: "Recording in app", description: "Select which microphone to use for recording", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "PersonalizedRecorder (ToolbarBtn mic dropdown)", notes: "Mic dropdown in toolbar with 4 mock devices." },
  { id: 7, theme: "Adding a New Video", subTheme: "Recording in app", description: "Select recording quality: 480 / 720 / 1080", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Fail", status: "done", where: "PersonalizedRecorder (ToolbarBtn quality dropdown)", notes: "Quality dropdown with 480p/720p/1080p options. Note: design review said \"Fail\" — may need visual polish." },
  { id: 8, theme: "Adding a New Video", subTheme: "Recording in app", description: "Cancel recording — option to stop or start over", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Fail", status: "done", where: "PersonalizedRecorder (countdown cancel + discard button)", notes: "Cancel during countdown (X button) returns to idle. During recording, Discard button stops and returns to queue. Design review said \"Fail\" — may need clearer UX." },
  { id: 9, theme: "Adding a New Video", subTheme: "Recording in app", description: "Blur background option", priority: "COULD HAVE", kelleyPriority: "Med", designReview: "N/A to Design", status: "n/a", where: "—", notes: "Marked N/A to Design. Would require real camera API + ML background segmentation. Not prototyped." },
  { id: 10, theme: "Adding a New Video", subTheme: "Recording in app", description: "Virtual background image selection", priority: "COULD HAVE", kelleyPriority: "Med", designReview: "N/A to Design", status: "n/a", where: "—", notes: "Marked N/A to Design. Similar to blur — requires live video processing. Not prototyped." },
  { id: 11, theme: "Adding a New Video", subTheme: "Recording in app", description: "Trash video and re-record after recording", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "PersonalizedRecorder (discardRecording), VideoEditorModal (onDelete)", notes: "Discard during recording returns to queue. After editing, Delete button discards and returns to record phase with toast notification." },
  { id: 12, theme: "Adding a New Video", subTheme: "Upload Video", description: "Import a pre-recorded video into ThankView (put into 4:3 video)", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "PersonalizedRecorder (upload phase), VideoLibrary (AddVideoModal → UploadSetupStep)", notes: "Drag-and-drop upload zone in both PersonalizedRecorder and library wizard. 4:3 conversion is noted in requirements but is a backend concern; UI accepts the file." },
  { id: 13, theme: "Adding a New Video", subTheme: "Combine existing TV Videos", description: "Combine / splice multiple videos from library to create a new library video", priority: "MUST HAVE", kelleyPriority: "Low", designReview: "N/A to Design", status: "done", where: "VideoLibrary (AddVideoModal → CombineSetupStep), VideoCreate", notes: "CombineSetupStep in the add-video wizard allows selecting multiple library videos. Marked N/A to Design and Low priority; only 2.81% of library videos use this." },
  { id: 14, theme: "Adding a New Video", subTheme: "After recorded / uploaded", description: "Name video before save (required)", priority: "", kelleyPriority: "High", designReview: "Pass", status: "done", where: "VideoEditorModal (Details tab → title field), VideoLibrary (CaptionsStep has save)", notes: "VideoEditorModal's Details tab has a \"Video Name\" text input. Library wizard's final step also has naming. The 1:1 recorder auto-names as \"Video for [Name]\"." },
  { id: 15, theme: "Adding a New Video", subTheme: "After recorded / uploaded", description: "Option to add a description before saving", priority: "", kelleyPriority: "High", designReview: "Pass", status: "done", where: "VideoEditorModal (Details tab → description textarea), VideoLibrary (detail panel)", notes: "Description textarea added to VideoEditorModal's Details tab (between title and tags). Also editable in the library detail panel's edit mode." },
  { id: 16, theme: "Adding a New Video", subTheme: "After recorded / uploaded", description: "Option to add tags before saving", priority: "", kelleyPriority: "High", designReview: "Needs Work", status: "done", where: "VideoEditorModal (Details tab → tags), VideoLibrary (detail panel tags)", notes: "Tag picker with suggested tags in both VideoEditorModal and library detail panel. Design review flagged \"Needs Work\" — may want free-text tag entry alongside presets." },
  { id: 17, theme: "Adding a New Video", subTheme: "After recorded / uploaded", description: "Option to specify folder before saving", priority: "", kelleyPriority: "Low", designReview: "Needs Work", status: "done", where: "VideoEditorModal (Details tab → folder select), VideoLibrary (detail panel)", notes: "Folder dropdown in VideoEditorModal and library detail panel. Design review flagged \"Needs Work\"." },
  { id: 18, theme: "Editing Videos", subTheme: "General", description: "Users should be able to edit a video either in the campaign flow or from the video library page", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Needs Work", status: "done", where: "VideoEditorModal (campaign flow), VideoLibrary (detail panel edit mode)", notes: "Full editing in campaign flow via VideoEditorModal (trim/crop/rotate/captions/details). Library has inline detail panel with edit mode. Design review flagged \"Needs Work\"." },
  { id: 19, theme: "Editing Videos", subTheme: "Thumbnail", description: "Upload an image to use as the thumbnail for a video", priority: "SHOULD HAVE", kelleyPriority: "High", designReview: "Needs Work", status: "done", where: "VideoLibrary (ThumbnailPicker + Upload Image button in thumbnail editor)", notes: "Frame-based thumbnail picker with scrubber, plus a dedicated \"Upload Image (JPG, PNG)\" section below. Uploaded image previews inline with a Remove option. Custom images show an \"IMG\" badge on the thumbnail preview. 36% of library videos use custom uploaded thumbnails." },
  { id: 20, theme: "Editing Videos", subTheme: "Crop", description: "Crop video", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "VideoEditorModal (Crop tab), VideoLibrary (detail panel crop controls)", notes: "Crop presets (Original, 4:3, 16:9, 1:1, 9:16) in VideoEditorModal. Library detail panel also has a crop rectangle editor with numeric inputs." },
  { id: 21, theme: "Editing Videos", subTheme: "Trim", description: "Trim video", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "VideoEditorModal (Trim tab), VideoLibrary (TrimSlider)", notes: "Dual-handle waveform trimmer in VideoEditorModal. Library detail panel has a TrimSlider with draggable handles." },
  { id: 22, theme: "Editing Videos", subTheme: "Trim", description: "Revert trimmed video back to untrimmed version", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Fail", status: "done", where: "VideoEditorModal (\"Reset to full length\" button), VideoLibrary (\"Revert to original\" button)", notes: "VideoEditorModal shows \"Reset to full length\" link when trimmed. Library detail panel has a \"Revert to original\" button that restores originalDurationSec. Design review said \"Fail\" — may need more prominent placement." },
  { id: 23, theme: "Editing Videos", subTheme: "Rotate", description: "Rotate video", priority: "SHOULD HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "VideoEditorModal (Rotate tab), VideoLibrary (detail panel rotation dropdown)", notes: "90° rotation with live preview transform in VideoEditorModal. Library has rotation dropdown (0°/90°/180°/270°) with flip options." },
  { id: 24, theme: "Editing Videos", subTheme: "Metadata", description: "Rename video", priority: "", kelleyPriority: "High", designReview: "Pass", status: "done", where: "VideoEditorModal (Details tab), VideoLibrary (detail panel edit mode)", notes: "Title text input in both VideoEditorModal and library detail panel's edit mode." },
  { id: 25, theme: "Editing Videos", subTheme: "Metadata", description: "Update description", priority: "", kelleyPriority: "High", designReview: "Pass", status: "done", where: "VideoLibrary (detail panel edit mode → Textarea)", notes: "Description textarea in library detail panel edit mode. View mode shows description or \"No description\" italic placeholder." },
  { id: 26, theme: "Editing Videos", subTheme: "Metadata", description: "Add / update tags", priority: "", kelleyPriority: "High", designReview: "Needs Work", status: "done", where: "VideoEditorModal (Details tab), VideoLibrary (detail panel → TagSelect)", notes: "Tag selection in both places. Library uses a TagSelect component. Design review flagged \"Needs Work\"." },
  { id: 27, theme: "Editing Videos", subTheme: "Metadata", description: "Type in a \"recipient\" name to clarify who the video was made for", priority: "", kelleyPriority: "Low", designReview: "Pass", status: "done", where: "VideoLibrary (detail panel → recipient TextInput)", notes: "Recipient text input in library detail panel edit mode. Only ~3% of library videos use this field." },
  { id: 28, theme: "Editing Videos", subTheme: "Metadata", description: "Update which folder the video is in", priority: "", kelleyPriority: "High", designReview: "Needs Work", status: "done", where: "VideoEditorModal (Details tab → folder select), VideoLibrary (detail panel, Move to Folder modal)", notes: "Folder dropdown in both locations. Library also has a dedicated MoveToFolderModal for single and bulk operations." },
  { id: 29, theme: "Editing Videos", subTheme: "Actions", description: "Download a previously saved video", priority: "", kelleyPriority: "High", designReview: "Pass", status: "done", where: "VideoLibrary (detail panel Download button, card context menu)", notes: "Download button in detail panel actions grid and in the per-card context menu." },
  { id: 30, theme: "Editing Videos", subTheme: "Actions", description: "Delete a previously saved video", priority: "", kelleyPriority: "High", designReview: "Pass", status: "done", where: "VideoLibrary (detail panel Delete button → DeleteModal, card context menu)", notes: "Delete with confirmation modal in both detail panel and card context menu. Bulk delete also supported." },
  { id: 31, theme: "Closed Captions", subTheme: "General", description: "Adjust closed captions either in the campaign flow or from the video library page", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Needs Work", status: "done", where: "VideoEditorModal (Captions tab), VideoLibrary (detail panel captions section)", notes: "VideoEditorModal has a Captions tab with language, size, position, and color settings. Library detail panel has a full captions editor with line-by-line editing. Design review flagged \"Needs Work\"." },
  { id: 32, theme: "Closed Captions", subTheme: "Add captions", description: "Add closed captions via uploading a VTT or SRT caption file", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "VideoLibrary (detail panel → Upload VTT/SRT action)", notes: "Upload caption file action in the library detail panel's caption section. captionSource tracks 'upload' origin." },
  { id: 33, theme: "Closed Captions", subTheme: "Add captions", description: "Add closed captions via AI closed captioning", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "VideoLibrary (detail panel → AI caption generation with Sparkles icon)", notes: "AI captioning button with simulated processing state, progress bar, and auto-generated captions. captionSource tracks 'ai'." },
  { id: 34, theme: "Closed Captions", subTheme: "Add captions", description: "Add closed captions via human-written captions (REV)", priority: "SHOULD HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "VideoLibrary (detail panel → REV caption request action)", notes: "REV caption ordering action. captionSource tracks 'rev'. Only 0.1% of videos use this." },
  { id: 35, theme: "Closed Captions", subTheme: "Processing", description: "Cancel stuck caption processing and retry", priority: "COULD HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "VideoLibrary (detail panel → cancel processing action)", notes: "Cancel button visible during caption processing state." },
  { id: 36, theme: "Closed Captions", subTheme: "Manage captions", description: "Download captions from a video", priority: "COULD HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "VideoLibrary (detail panel → Download Captions tooltip+ActionIcon)", notes: "Download button in caption section header. Simulates .srt download." },
  { id: 37, theme: "Closed Captions", subTheme: "Manage captions", description: "Delete captions from a video", priority: "SHOULD HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "VideoLibrary (detail panel → Delete captions → DeleteModal confirmation)", notes: "Delete with confirmation modal: \"Remove all captions? This action cannot be undone.\"" },
  { id: 38, theme: "Closed Captions", subTheme: "Manage captions", description: "Edit caption text copy within ThankView (not timing)", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "VideoLibrary (detail panel → inline caption line editing)", notes: "Line-by-line caption text editing in the detail panel. Each line has an editable text field. Timing is displayed but not editable per spec." },
  { id: 39, theme: "Closed Captions", subTheme: "Display", description: "Auto-show captions by default; viewers can turn off", priority: "MUST HAVE", kelleyPriority: "Low", designReview: "N/A to Design", status: "n/a", where: "—", notes: "Marked N/A to Design. Runtime behavior for the viewer-facing landing page. The notes suggest making this always-on with no toggle, so no UI needed." },
  { id: 40, theme: "Managing Videos", subTheme: "Video Folders", description: "Create, rename, and/or delete Video Folders", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Needs Work", status: "done", where: "VideoLibrary (folder sidebar with create/rename/delete)", notes: "Folder sidebar with + New Folder button, inline rename, and delete. Design review flagged \"Needs Work\"." },
  { id: 41, theme: "Managing Videos", subTheme: "Actions", description: "Archive a single video", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Needs Work", status: "done", where: "VideoLibrary (card menu → Archive, detail panel → Archive, ArchiveModal)", notes: "Archive action in card context menu and detail panel. ArchiveModal with confirmation. Unarchive also supported." },
  { id: 42, theme: "Managing Videos", subTheme: "Actions", description: "Archive videos in bulk", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Needs Work", status: "done", where: "VideoLibrary (bulk action bar → Archive selected)", notes: "Checkbox selection + bulk action bar with Archive button and count-aware ArchiveModal." },
  { id: 43, theme: "Managing Videos", subTheme: "Actions", description: "Move a single video to a folder", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "VideoLibrary (card menu → Move, detail panel → Move, MoveToFolderModal)", notes: "MoveToFolderModal with folder list and selection. Available from card menu and detail panel." },
  { id: 44, theme: "Managing Videos", subTheme: "Actions", description: "Move videos to a folder in bulk", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "VideoLibrary (bulk action bar → Move to Folder)", notes: "Bulk selection + MoveToFolderModal for batch moves." },
  { id: 45, theme: "Managing Videos", subTheme: "Actions", description: "Delete a single video", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Needs Work", status: "done", where: "VideoLibrary (card menu → Delete, detail panel → Delete, DeleteModal)", notes: "Delete with confirmation modal in card menu and detail panel. Design review flagged \"Needs Work\"." },
  { id: 46, theme: "Managing Videos", subTheme: "Actions", description: "Delete videos in bulk", priority: "", kelleyPriority: "High", designReview: "Needs Work", status: "done", where: "VideoLibrary (bulk action bar → Delete selected)", notes: "Bulk delete with DeleteModal confirmation showing count." },
  { id: 47, theme: "Managing Videos", subTheme: "Actions", description: "Favorite a video", priority: "MUST HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "VideoLibrary (card menu → Favorite, card heart icon, detail panel)", notes: "Heart/Star toggle on card overlay and in card context menu. Favorited filter in FilterBar." },
  { id: 48, theme: "Managing Videos", subTheme: "Actions", description: "Duplicate a video", priority: "", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "VideoLibrary (card menu → Duplicate)", notes: "Duplicate action in card context menu. Creates a copy with \"(Copy)\" suffix." },
  { id: 49, theme: "Searching / Filtering", subTheme: "View modes", description: "Grid or table view for videos", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "VideoLibrary (ViewToggle component, grid/list rendering)", notes: "ViewToggle component with Grid and List icons. Grid shows cards; List shows a table with columns." },
  { id: 50, theme: "Searching / Filtering", subTheme: "Search", description: "Search for a video by video title", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "VideoLibrary (search input in header)", notes: "Search input filters videos by title (case-insensitive)." },
  { id: 51, theme: "Searching / Filtering", subTheme: "Filter", description: "Search or filter for a video by video tags", priority: "", kelleyPriority: "High", designReview: "\"Not ideal, but good enough for Jul 31\"", status: "done", where: "VideoLibrary (FilterBar → tag filter)", notes: "Tag filter in FilterBar component with multi-select. Design review noted it's functional but not ideal." },
  { id: 52, theme: "Searching / Filtering", subTheme: "Filter", description: "Filter videos based on the video creator", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Needs Work", status: "done", where: "VideoLibrary (FilterBar → creator filter)", notes: "Creator filter with list of unique creators. Design review flagged \"Needs Work\"." },
  { id: 53, theme: "Searching / Filtering", subTheme: "Filter", description: "Filter videos based on if they are a reply or not", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "VideoLibrary (FilterBar → reply status filter)", notes: "Reply filter with All / Replies / Non-replies options." },
  { id: 54, theme: "Searching / Filtering", subTheme: "Filter", description: "Filter videos based on archived status", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "VideoLibrary (archived filter toggle)", notes: "Archived filter with Active / Archived / All options." },
  { id: 55, theme: "Searching / Filtering", subTheme: "Filter", description: "Filter videos based on \"favorite\" status", priority: "MUST HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "VideoLibrary (FilterBar → favorites filter)", notes: "Favorites toggle filter in FilterBar." },
  { id: 56, theme: "Searching / Filtering", subTheme: "Sort", description: "Sort videos by Date Created, Title, Date Modified, Video Duration", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "VideoLibrary (sort dropdown with all 4 options + asc/desc)", notes: "Full sort with all 4 keys and ascending/descending toggle." },
  { id: 57, theme: "1:1 Video", subTheme: "Constituent selection", description: "Select a list of constituents to record videos for in back-to-back succession", priority: "", kelleyPriority: "High", designReview: "Needs Work", status: "done", where: "PersonalizedRecorder (contact picker with filters, list import, mid-session add)", notes: "Full contact picker with search, tag/giving-level filters, saved list import, select all, and mid-session \"+ Add Contacts\" popup." },
  { id: 58, theme: "1:1 Video", subTheme: "Rapid recording", description: "Quickly record one video after another for a large list of constituents", priority: "", kelleyPriority: "High", designReview: "Needs Work", status: "done", where: "PersonalizedRecorder (auto-advance, queue sidebar, keyboard shortcuts)", notes: "Contact queue sidebar with progress bar. Auto-advance toggle with countdown. Keyboard shortcuts (Space to record/stop, → to advance). Prominent contact name overlay on camera." },
  { id: 59, theme: "1:1 Video", subTheme: "Send as 1:1", description: "Every library video can be sent as a 1:1 (copy link → email thumbnail → landing page)", priority: "", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "VideoLibrary (SendAsOneToOneDrawer, card menu \"Send as 1:1\", detail panel 1:1 link section)", notes: "\"Send as 1:1\" in every card's context menu. Right drawer with video preview, email thumbnail preview, contact picker, batch send. Detail panel shows 1:1 link with copy + email thumbnail preview card." },
  { id: 60, theme: "1:1 Video", subTheme: "Landing page", description: "Default landing page settings per portal, editable per video", priority: "", kelleyPriority: "Med", designReview: "Needs Work", status: "done", where: "PersonalizedRecorder (landing page builder with envelope picker, headline, CTA, brand color, toggles, live preview)", notes: "Full landing page builder with envelope design picker, headline/subheadline/body, CTA button, accent color, reply form toggle, fund context, logo options, and responsive desktop/tablet/mobile preview. Default config (DEFAULT_LP_CONFIG) acts as portal default. Design review flagged \"Needs Work\"." },
  { id: 61, theme: "1:1 Video", subTheme: "Links management", description: "View and/or export a list of each library video's title, creator, and 1:1 video link", priority: "", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "VideoLibrary (1:1 Links drawer with table, per-row copy/send, CSV export via ExportModal)", notes: "Dedicated 1:1 Links drawer accessible from header. Shows table with title, creator, link. Per-row copy and send actions. Export modal generates CSV." },
  { id: 62, theme: "1:1 Video", subTheme: "Metrics", description: "View and/or export 1:1 performance metrics (views, CTA %, watch start/complete %, avg duration)", priority: "", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "VideoLibrary (ExportModal with includeMetrics toggle)", notes: "ExportModal includes a toggle for performance metrics. When enabled, CSV includes: Total Views, Open Rate, Click Rate, Reply Count/Rate, CTA Interactions/%, Started Watching/%, Watched Full/%, Avg Duration. Uses simulated data." },
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
  { id: 1, theme: "My Profile", subTheme: "Profile Info", description: "Edit first name, last name, and job title with save confirmation", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "Settings (ProfileTab → TextInput + Select for job title)", notes: "First/last name TextInputs, job title Select with 20 role options, Save Profile button with toast." },
  { id: 2, theme: "My Profile", subTheme: "Profile Info", description: "Display avatar with initials, email, and current role badge", priority: "MUST HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Settings (ProfileTab → avatar header)", notes: "64px circular avatar with initials, email address, and TV Admin badge." },
  { id: 3, theme: "My Profile", subTheme: "Password", description: "Change password with current/new/confirm validation", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "Settings (ProfileTab → password section)", notes: "Expandable password form with PasswordInput fields. Validates match and minimum 8 chars." },
  { id: 4, theme: "My Profile", subTheme: "Security", description: "Enable/disable SMS-based two-step verification", priority: "SHOULD HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Settings (ProfileTab → 2FA section)", notes: "Multi-step flow: Enter phone → Send code → Verify 6-digit code. Active state shows masked phone." },
  { id: 5, theme: "General Portal", subTheme: "Organization", description: "Edit organization name with description", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "Settings (GeneralTab → org name TextInput)", notes: "Organization name TextInput with description 'This is what appears in the org switcher.'" },
  { id: 6, theme: "General Portal", subTheme: "Organization", description: "Display organization slug (read-only, non-editable)", priority: "MUST HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Settings (GeneralTab → slug display)", notes: "Read-only slug display: hartwell.thankview.com. 'Slug cannot be changed. Contact support to update.'" },
  { id: 7, theme: "General Portal", subTheme: "Organization", description: "Edit organization URL (linked from landing page logo)", priority: "MUST HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Settings (GeneralTab → URL TextInput)", notes: "TextInput with description explaining recipients are taken to this URL when clicking logo." },
  { id: 8, theme: "General Portal", subTheme: "Branding", description: "Upload/replace organization logo with preview", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "Settings (GeneralTab → logo upload)", notes: "96px logo preview with Upload/Replace button. Accepts PNG or SVG, recommended 200x80px." },
  { id: 9, theme: "General Portal", subTheme: "SSO", description: "Microsoft SSO toggle with configuration guidance", priority: "SHOULD HAVE", kelleyPriority: "Low", designReview: "Pass", status: "done", where: "Settings (GeneralTab → SSO section)", notes: "Microsoft-only SSO toggle with contextual info card. Links to help center setup guide." },
  { id: 10, theme: "Email & SMS", subTheme: "Domains", description: "View verified email sending domains with status badges", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "Settings (EmailSmsTab → domain list)", notes: "List of domains with green dot and 'Verified' badge." },
  { id: 11, theme: "Email & SMS", subTheme: "Domains", description: "Add custom domain via modal with DNS TXT record instructions", priority: "MUST HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Settings (EmailSmsTab → Add Custom Domain modal)", notes: "Modal with DNS TXT record details (Type, Host, Value) and domain TextInput." },
  { id: 12, theme: "Email & SMS", subTheme: "SMS", description: "Display SMS area code with location context", priority: "SHOULD HAVE", kelleyPriority: "Low", designReview: "Pass", status: "done", where: "Settings (EmailSmsTab → SMS area code display)", notes: "Read-only display: +1 (617) Boston, MA. Contact support to update." },
  { id: 13, theme: "DNS Setup", subTheme: "Domain Management", description: "Add sending domain with step-by-step DNS record generation", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "Settings (DnsSetupTab → Add Domain modal)", notes: "Modal with domain TextInput and 3-step 'What happens next' guide." },
  { id: 14, theme: "DNS Setup", subTheme: "Domain Management", description: "View required DNS records per domain (TXT, CNAME, SPF)", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "Settings (DnsSetupTab → expandable DNS records per domain)", notes: "4 records (TXT verify, CNAME bounce, CNAME DKIM, TXT SPF) with copy buttons and purpose labels." },
  { id: 15, theme: "DNS Setup", subTheme: "Domain Management", description: "Re-check domain verification status", priority: "SHOULD HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Settings (DnsSetupTab → RefreshCw ActionIcon per pending domain)", notes: "Re-check button visible only for pending domains." },
  { id: 16, theme: "DNS Setup", subTheme: "Domain Management", description: "Set default domain when multiple domains configured", priority: "SHOULD HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Settings (DnsSetupTab → Star ActionIcon per non-default domain)", notes: "Star icon to set default. Only visible when multiple domains exist." },
  { id: 17, theme: "DNS Setup", subTheme: "Domain Management", description: "Remove domain with confirmation modal", priority: "SHOULD HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Settings (DnsSetupTab → Trash2 ActionIcon → Remove modal)", notes: "Remove with confirmation modal. Falls back to default domain or @mail-et.com." },
  { id: 18, theme: "DNS Setup", subTheme: "Fallback", description: "Display fallback sending domain info (@mail-et.com)", priority: "MUST HAVE", kelleyPriority: "Low", designReview: "Pass", status: "done", where: "Settings (DnsSetupTab → Fallback Sending Domain section)", notes: "Info section explaining @mail-et.com as pre-warmed shared domain." },
  { id: 19, theme: "Manage Users", subTheme: "User List", description: "View user table with name, email, role, domain, status, last login", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "Settings (UsersTab → desktop Table + mobile cards)", notes: "Responsive: desktop table with columns; mobile card layout. Badge count in header." },
  { id: 20, theme: "Manage Users", subTheme: "User List", description: "Invite new user via modal with email and role selection", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "Settings (UsersTab → Invite User button → InviteModal)", notes: "Modal with email TextInput and 4 role option cards with descriptions." },
  { id: 21, theme: "Manage Users", subTheme: "User Actions", description: "Change user role via modal with role cards", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "Settings (UsersTab → user menu → Change Role modal)", notes: "Modal showing user avatar/email, 4 role cards, 'Current' badge on active role." },
  { id: 22, theme: "Manage Users", subTheme: "User Actions", description: "Assign per-user sending domain (verified domains only)", priority: "SHOULD HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Settings (UsersTab → user menu → Assign Domain modal)", notes: "'Use Organization Default' option + each verified domain. Warning for pending domains." },
  { id: 23, theme: "Manage Users", subTheme: "User Actions", description: "Resend invite for pending users", priority: "SHOULD HAVE", kelleyPriority: "Low", designReview: "Pass", status: "done", where: "Settings (UsersTab → user menu → Resend Invite)", notes: "Menu item visible only for 'Pending' status users." },
  { id: 24, theme: "Manage Users", subTheme: "User Actions", description: "Remove user from organization", priority: "MUST HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Settings (UsersTab → user menu → Remove User)", notes: "Destructive red menu item. Removes user from list with toast." },
  { id: 25, theme: "Manage Users", subTheme: "Permissions", description: "Role permissions matrix with 11 permission keys across 4 roles", priority: "SHOULD HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Settings (UsersTab → collapsible Role Permissions Matrix)", notes: "Expandable table: 11 permissions × 4 roles. Collapsed by default." },
  { id: 26, theme: "Notifications", subTheme: "In-App", description: "Toggle in-app notifications (campaign sent, reply, video processed, digest, failure)", priority: "MUST HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Settings (NotificationsTab → In-App Notifications section)", notes: "5 toggle rows with label and description." },
  { id: 27, theme: "Notifications", subTheme: "Email", description: "Toggle email notifications (8 categories including billing, exports, team invites)", priority: "MUST HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Settings (NotificationsTab → Email Notifications section)", notes: "8 toggle rows: Reply Forwarding, Campaign Complete, Export Ready, Team Invite, Digest, Delivery, Billing, New Constituent." },
  { id: 28, theme: "Video & Recording", subTheme: "Recording Defaults", description: "Set default recording resolution (480p / 720p / 1080p)", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "Settings (VideoTab → resolution picker)", notes: "3-button picker (480p Standard / 720p HD / 1080p Full HD)." },
  { id: 29, theme: "Video & Recording", subTheme: "Recording Defaults", description: "Script / teleprompter toggle (org-wide default)", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "Settings (VideoTab → teleprompter ToggleRow)", notes: "Toggle to allow users to type a script visible on-screen while recording." },
  { id: 30, theme: "Video & Recording", subTheme: "Recording Defaults", description: "Background blur toggle", priority: "COULD HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Settings (VideoTab → bgBlur ToggleRow)", notes: "Toggle to allow users to blur background during desktop recording." },
  { id: 31, theme: "Video & Recording", subTheme: "Recording Defaults", description: "Virtual background toggle with default org background upload", priority: "COULD HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Settings (VideoTab → virtual bg toggle + upload)", notes: "Toggle with conditional upload zone for default org background image." },
  { id: 32, theme: "Video & Recording", subTheme: "Outro", description: "Default outro enable/disable with clip selection and upload", priority: "SHOULD HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Settings (VideoTab → Default Outro section)", notes: "Enable toggle + Select dropdown with 3 outros + upload new outro zone." },
  { id: 33, theme: "Video & Recording", subTheme: "Captions", description: "AI closed captioning toggle (org-wide)", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "Settings (VideoTab → AI captioning toggle)", notes: "Sparkles icon. ~20% of library videos use AI captions." },
  { id: 34, theme: "Video & Recording", subTheme: "Captions", description: "Human-written captions (REV) toggle with credit balance and auto-renew", priority: "SHOULD HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Settings (VideoTab → REV captions toggle + credits)", notes: "Paid badge. Credit balance ($32.50), auto-renew toggle, timing note." },
  { id: 35, theme: "Video & Recording", subTheme: "Captions", description: "Caption download and edit toggles", priority: "SHOULD HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Settings (VideoTab → captionEdit + captionDownload ToggleRows)", notes: "Edit Captions In-App, Caption Download (VTT/SRT). Footer note about manual upload." },
  { id: 36, theme: "Video & Recording", subTheme: "Library Defaults", description: "Default video library view (grid/table) and sort order", priority: "SHOULD HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Settings (VideoTab → SegmentedControl + Select)", notes: "SegmentedControl for grid/table. Select for sort order (4 options)." },
  { id: 37, theme: "Video & Recording", subTheme: "Library Defaults", description: "Video tags, custom thumbnails, combine/splice, auto-convert toggles", priority: "SHOULD HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Settings (VideoTab → 4 ToggleRows with usage stats)", notes: "Tags (~20%), Thumbnails (~36%), Combine (~3%), Auto-Convert 4:3." },
  { id: 38, theme: "1:1 Video Settings", subTheme: "Landing Page", description: "Default accent color with presets and custom color picker", priority: "SHOULD HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Settings (OneToOneTab → accent color presets + custom picker)", notes: "5 preset swatches + custom color input with check icon on selection." },
  { id: 39, theme: "1:1 Video Settings", subTheme: "Landing Page", description: "Default CTA button text configuration", priority: "SHOULD HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Settings (OneToOneTab → CTA TextInput)", notes: "TextInput for the primary button text on the landing page." },
  { id: 40, theme: "1:1 Video Settings", subTheme: "Landing Page", description: "Show CTA and Show Reply Form toggles", priority: "SHOULD HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Settings (OneToOneTab → 2 ToggleRows)", notes: "Toggle CTA button and reply/comment form visibility on 1:1 landing page." },
  { id: 41, theme: "1:1 Video Settings", subTheme: "Landing Page", description: "Live mini preview of landing page configuration", priority: "SHOULD HAVE", kelleyPriority: "Low", designReview: "Pass", status: "done", where: "Settings (OneToOneTab → mini preview card)", notes: "280px preview showing accent color bar, video, CTA, reply form. Updates in real-time." },
  { id: 42, theme: "1:1 Video Settings", subTheme: "Links", description: "Link format selection (short link vs full URL) with examples", priority: "SHOULD HAVE", kelleyPriority: "Low", designReview: "Pass", status: "done", where: "Settings (OneToOneTab → link format picker)", notes: "Short Link (tv.ht/abc123) vs Full URL (thankview.com/hartwell/v/abc123)." },
  { id: 43, theme: "1:1 Video Settings", subTheme: "Links", description: "View tracking toggle and link expiration setting", priority: "SHOULD HAVE", kelleyPriority: "Low", designReview: "Pass", status: "done", where: "Settings (OneToOneTab → tracking toggle + expiry Select)", notes: "View tracking toggle. Expiration: Never / 30d / 90d / 1yr." },
  { id: 44, theme: "1:1 Video Settings", subTheme: "Metrics", description: "1:1 video metrics toggles (views, CTA, watch completion, avg duration)", priority: "SHOULD HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Settings (OneToOneTab → 4 metrics ToggleRows)", notes: "Total Views, CTA Interactions, Watch Completion, Average View Duration." },
  { id: 45, theme: "Subscription & Billing", subTheme: "Plan", description: "View current subscription plan details (name, price, renewal date)", priority: "MUST HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Settings (SubscriptionTab → plan card)", notes: "ThankView Pro, Active badge, annual billing, renewal date, $2,400/yr." },
  { id: 46, theme: "Subscription & Billing", subTheme: "Plan", description: "View usage stats (users included, videos this period, storage used)", priority: "SHOULD HAVE", kelleyPriority: "Low", designReview: "Pass", status: "done", where: "Settings (SubscriptionTab → usage SimpleGrid)", notes: "Users (25), Videos (1,247), Storage (18.3 GB / 50 GB)." },
  { id: 47, theme: "Subscription & Billing", subTheme: "Payment", description: "View and update payment method (credit card on file)", priority: "MUST HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Settings (SubscriptionTab → payment card + Update Card modal)", notes: "Visa •••• 4242 display. Modal with card name, number, expiry, CVC, ZIP." },
  { id: 48, theme: "Subscription & Billing", subTheme: "History", description: "View billing history table with date, description, amount, status", priority: "SHOULD HAVE", kelleyPriority: "Low", designReview: "Pass", status: "done", where: "Settings (SubscriptionTab → billing history Table)", notes: "Striped table with 4 charges. 'Paid' badges. Footer with billing contact." },
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
  { id: 1, theme: "Envelope Builder", subTheme: "", description: "Users can, and must, name an envelope in order to save it", priority: "—", kelleyPriority: "High", designReview: "Pass", status: "done", where: "EnvelopeBuilderModal, EnvelopeBuilder", notes: "" },
  { id: 2, theme: "Envelope Builder", subTheme: "", description: "Users can select the color for the outer portion of their envelope via hex code", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "EnvelopeBuilderModal, EnvelopeBuilder", notes: "" },
  { id: 3, theme: "Envelope Builder", subTheme: "", description: "Users can select their envelope liner color via hex code", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "EnvelopeBuilderModal, EnvelopeBuilder", notes: "" },
  { id: 4, theme: "Envelope Builder", subTheme: "", description: "Users can select what color the copy on their envelope will be, via hex code", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "EnvelopeBuilder (Recipient Name Color SwatchRow)", notes: "" },
  { id: 5, theme: "Envelope Builder", subTheme: "", description: "Users can choose \"Single Swoop\" for the front design of their envelope + select the color of the swoop via hex code", priority: "—", kelleyPriority: "High", designReview: "Pass", status: "done", where: "EnvelopeBuilder (Single Swoop radio + Swoop Color SwatchRow)", notes: "There's good usage of all of these designs" },
  { id: 6, theme: "Envelope Builder", subTheme: "", description: "Users can choose \"Double Swoop\" for the front design of their envelope + select the colors for the swoops via hex code", priority: "—", kelleyPriority: "High", designReview: "Pass", status: "done", where: "EnvelopeBuilder (Double Swoop radio + 2 SwatchRow hex inputs)", notes: "" },
  { id: 7, theme: "Envelope Builder", subTheme: "", description: "Users can choose \"Single Stripe\" for the front design of their envelope + select the color of the stripe via hex code", priority: "—", kelleyPriority: "High", designReview: "Pass", status: "done", where: "EnvelopeBuilder (Single Stripe radio + Stripe Color SwatchRow)", notes: "" },
  { id: 8, theme: "Envelope Builder", subTheme: "", description: "Users can choose \"Double Stripe\" for the front design of their envelope + select the colors for the stripes via hex code", priority: "—", kelleyPriority: "High", designReview: "Pass", status: "done", where: "EnvelopeBuilder (Double Stripes radio + 2 SwatchRow hex inputs)", notes: "" },
  { id: 9, theme: "Envelope Builder", subTheme: "", description: "Users can choose \"Triple Stripe\" for the front design of their envelope + select the colors for the stripes via hex code", priority: "—", kelleyPriority: "High", designReview: "Pass", status: "done", where: "EnvelopeBuilder (Triple Stripes radio + 2 SwatchRow hex inputs)", notes: "" },
  { id: 10, theme: "Envelope Builder", subTheme: "", description: "Users can choose \"Air Mail Stripe\" for the front design of their envelope + select the colors for the stripes via hex code", priority: "—", kelleyPriority: "High", designReview: "Pass", status: "done", where: "EnvelopeBuilder (Air Mail Stripe radio + 2 SwatchRow hex inputs)", notes: "" },
  { id: 11, theme: "Envelope Builder", subTheme: "", description: "Users can choose to add a logo to the top left of the front of their envelope", priority: "—", kelleyPriority: "High", designReview: "Pass", status: "done", where: "EnvelopeBuilder (Logos tab → Front Left Logo: upload, drag & drop, recently used, presets)", notes: "93% of envelopes created in the last two years have had a front logo" },
  { id: 12, theme: "Envelope Builder", subTheme: "", description: "Users can choose to add a logo to the outer back flap of their envelope", priority: "—", kelleyPriority: "High", designReview: "Pass", status: "done", where: "EnvelopeBuilder (Logos tab → Back Flap Logo: upload, drag & drop, recently used, presets)", notes: "44% of envelopes created in the last two years have had a back logo" },
  { id: 13, theme: "Envelope Builder", subTheme: "", description: "Users can choose to have a black, white, or no postmark", priority: "—", kelleyPriority: "High", designReview: "Pass", status: "done", where: "EnvelopeBuilder (Marks tab → No postmark / Black Postmark / White Postmark radios)", notes: "There's good usage of all of these options" },
  { id: 14, theme: "Envelope Builder", subTheme: "", description: "Users can choose to add up to 40 characters of text in their postmark", priority: "—", kelleyPriority: "High", designReview: "Pass", status: "done", where: "EnvelopeBuilder (Marks tab → postmark text input, 40-char limit with counter)", notes: "About 25% of envelopes made in the last year have postmark copy" },
  { id: 15, theme: "Envelope Builder", subTheme: "", description: "Users can choose to add an image to the stamp on their envelope", priority: "—", kelleyPriority: "High", designReview: "Pass", status: "done", where: "EnvelopeBuilder (Marks tab → stamp image upload, drag & drop, style picker)", notes: "69% of envelopes created over the last two years have had an image in the stamp" },
  { id: 16, theme: "Landing Page Builder", subTheme: "", description: "Users can, and must, name a landing page in order to save it", priority: "—", kelleyPriority: "High", designReview: "Fail", status: "partial", where: "", notes: "" },
  { id: 17, theme: "Landing Page Builder", subTheme: "", description: "Users can update the color of the header on their landing page via hex code", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "LandingPageBuilder (ColorField hex input + native color picker for Navigation Bar Color)", notes: "65% of active, non-deleted landing pages have a color set for the header" },
  { id: 18, theme: "Landing Page Builder", subTheme: "", description: "Users can add a logo to their landing page", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "LandingPageBuilder (Organization Logo: upload, preset icons, file input)", notes: "82% of active, non-deleted landing pages have a logo" },
  { id: 19, theme: "Landing Page Builder", subTheme: "", description: "Users can add a background image to their landing page", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "LandingPageBuilder (Your Background section: image upload, presets grid, solid colors, gradient toggle)", notes: "16% of active, non-deleted landing pages have a background image" },
  { id: 20, theme: "Landing Page Builder", subTheme: "", description: "Any image imported as a landing page background must be named and will automatically be saved so it can be used for future landing page creation as well.", priority: "MUST HAVE", kelleyPriority: "Med", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
  { id: 21, theme: "Landing Page Builder", subTheme: "", description: "Users can delete and/or rename previously imported landing page background images from the landing page builder area.", priority: "—", kelleyPriority: "Low", designReview: "N/A to Design", status: "n/a", where: "", notes: "There needs to be some area to remove / edit these. It seems like the assets / templates page would be better" },
  { id: 22, theme: "Landing Page Builder", subTheme: "", description: "Users can choose to remove the fade to white gradient that applies to the bottom of landing page images.", priority: "SHOULD HAVE, COULD HAVE", kelleyPriority: "Med", designReview: "N/A to Design", status: "n/a", where: "", notes: "About 6% of landing pages have the gradient turned off." },
  { id: 23, theme: "Content Creation", subTheme: "", description: "The rich text editor allows for everything the Signal RTE supports. Including but not necessarily limited to: - bold, italics, underline, adding links, adjusting text alignment, bullets, indentation, inputting rich text email templates, inputting signature templates, inputting impages", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "RichTextEditor (toolbar: B/I/U/Strikethrough, Link, Image, Align L/C/R/J, UL/OL, Indent/Outdent, Templates, Signatures)", notes: "" },
  { id: 24, theme: "Content Creation", subTheme: "", description: "The rich text editor allows for users to insert a merge field. Fields supported include all TV contact fields + the campaign notes field + any custom field.", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "RichTextEditor → MergeFieldPicker (100+ fields across 10 categories, searchable, favorites, contact/campaign/custom fields)", notes: "" },
  { id: 25, theme: "Content Creation", subTheme: "", description: "The rich text editor supports emojis", priority: "COULD HAVE", kelleyPriority: "High", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
  { id: 26, theme: "Content Creation", subTheme: "", description: "If merge field is inserted into the message or landing page copy somewhere, and a given contact in the campaign does not have a value in that field, the user will get a warning. The user can choose to: 1. Remove impacted contact(s) from the campaign 2. Adjust their message to not include the offe...", priority: "—", kelleyPriority: "High", designReview: "Pass", status: "done", where: "MergeFieldValidation (warning banner with per-field resolution: remove field, skip contacts, or set fallback text)", notes: "Note: The current TV process results in the whole campaign not being able to be sent until a value is added in the relevant field for the relevant contact. This doesn't work well considering that s..." },
  { id: 27, theme: "Content Creation", subTheme: "", description: "In the main content of the email/sms/landing page, a user will be able to write an AI prompt in order to have an AI write the content in this area for them. The UX will include: - A way to \"stop\" the AI's writing progress - A way to have the AI \"try again\" with the same prompt - An error stat...", priority: "SHOULD HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "AIWritingPopover (prompt input, streaming with stop, try again, error state, insert/discard)", notes: "" },
  { id: 28, theme: "Content Creation", subTheme: "", description: "Users can define the Sender Name", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "MultiStepBuilder (Sender Name input with char count + merge field insertion)", notes: "" },
  { id: 29, theme: "Content Creation", subTheme: "", description: "Users can define the Sender Email Address", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "MultiStepBuilder (Sender Email input field)", notes: "" },
  { id: 30, theme: "Content Creation", subTheme: "", description: "Users can define the \"reply to\" Email Address", priority: "—", kelleyPriority: "High", designReview: "Pass", status: "done", where: "MultiStepBuilder (Reply-To input with email validation, pill chips, multiple allowed)", notes: "" },
  { id: 31, theme: "Content Creation", subTheme: "", description: "Users can add multiple email addresses in the \"reply to\" area", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "MultiStepBuilder (Reply-To field supports multiple emails via pill chips, Enter/comma to add)", notes: "12% of campaigns saved since the start of 2024 have had more than one reply to email address" },
  { id: 32, theme: "Content Creation", subTheme: "", description: "Email subject Lines can include emjois (not available for SMS)", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "MultiStepBuilder (EmojiDropdown in subject line toolbar)", notes: "" },
  { id: 33, theme: "Content Creation", subTheme: "", description: "Email subject Lines can include merge fields", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "MultiStepBuilder (MergeFieldDropdown in subject line toolbar)", notes: "" },
  { id: 34, theme: "Content Creation", subTheme: "", description: "Users can select the font they want used for their campaign", priority: "SHOULD HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "MultiStepBuilder (font select dropdown + bodyFontFamily picker)", notes: "" },
  { id: 35, theme: "Content Creation", subTheme: "", description: "For content, users can choose to include a static thumbnail", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "", notes: "28% of non-video request campaigns that have been saved since the start of 2024 have used a static thumbnail" },
  { id: 36, theme: "Content Creation", subTheme: "", description: "For content, users can choose to include an Envelope", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Fail", status: "partial", where: "", notes: "63% of non-video request campaigns that have been saved since the start of 2024 have used an Envelope instead of thumbnail" },
  { id: 37, theme: "Content Creation", subTheme: "", description: "For content, users can choose to include an animated thumbnail", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "MultiStepBuilder + DesignStepPanel (Animated Thumbnail option with GIF autoplay)", notes: "9% of non-video request campaigns that have been saved since the start of 2024 have used an animated thumbnail" },
  { id: 38, theme: "Content Creation", subTheme: "", description: "Users can specify the button text & background colors (via hexcodes) for buttons on emails & landing pages", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "LandingPageBuilder (ColorField hex inputs for CTA/secondary/reply/save/share buttons) + PersonalizedRecorder", notes: "" },
  { id: 39, theme: "Content Creation", subTheme: "", description: "Users will be able to select the language they want their email unsubscribe verbage to be in, and we will translate the unsubscribe messaging into this language.", priority: "COULD HAVE", kelleyPriority: "Low", designReview: "N/A to Design", status: "n/a", where: "", notes: "99.8% of campagins saved since the start of 2024 have used English for their unsubscribe language." },
  { id: 40, theme: "Content Creation", subTheme: "", description: "Users should have the option to add a Tracking Pixel to their landing page", priority: "COULD HAVE", kelleyPriority: "Low", designReview: "N/A to Design", status: "n/a", where: "", notes: "Only 0.06% of projects saved in the last two years have had a tracking pixel" },
  { id: 41, theme: "Content Creation Envelopes", subTheme: "", description: "If a user chooses to use an envelope for their campaign, they should be able to use an envelope that was custom created for their organization (e.g. \"Branded\" category envelope)", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "", notes: "About 97% of campaigns that have used an envelope since the start of 2024 have used a \"branded\" envelope." },
  { id: 42, theme: "Content Creation Envelopes", subTheme: "", description: "If a user chooses to use an envelope for their campaign, they should be able to use one of ThankView's pre-designed legacy or holiday envelopes", priority: "SHOULD HAVE", kelleyPriority: "Low", designReview: "N/A to Design", status: "n/a", where: "", notes: "Only about 3% of enveloped campaigns since 2024 have used one of these. If we do use these, I suggest we only rebuilt the most commonly used ones seen here. All non-recreated envelopes would \"read..." },
  { id: 43, theme: "Content Creation Envelopes", subTheme: "", description: "When looking for an envelope, users should be able to use a search input to search through all the envelope options", priority: "MUST HAVE", kelleyPriority: "Med", designReview: "N/A to Design", status: "n/a", where: "", notes: "This will be true if we continue to offer the legacy and holiday envelopes. Portals only have about 3.4 branded envelopes on average though." },
  { id: 44, theme: "Content Creation Envelopes", subTheme: "", description: "Any previously created envelopes that were sent out with campaigns will continue to work. This means if a recipient opens an old TV email or views an old TV landing page for a campaign that used an envelope, they should still see the envelope as it was before.", priority: "MUST HAVE", kelleyPriority: "High", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
  { id: 45, theme: "Content Creation Envelopes", subTheme: "", description: "In the new app, users will see all of their previously created \"branded\" envelopes, and they will be able to edit and/or use those previously created envelopes for future campaigns", priority: "—", kelleyPriority: "High", designReview: "N/A to Design", status: "n/a", where: "", notes: "80% of branded envelopes that have been used in the last 2 years have been used more than once. It's very likely that if an envelope has been used in the last two years, a customer will want to use..." },
  { id: 46, theme: "Content Creation Envelopes", subTheme: "", description: "User can add text BEFORE the name area on an envelope & choose for that text to show on the same line as the name, or a line above it - This text supports merge fields & emoji", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Fail", status: "missing", where: "", notes: "About 28% of campaigns with envelopes since 2024 have used this feature." },
  { id: 47, theme: "Content Creation Envelopes", subTheme: "", description: "User can add text AFTER the name area on an envelope & choose for that text to show on the same line as the name, or a line above it - This text supports merge fields & emoji", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Fail", status: "missing", where: "", notes: "About 21% of campaigns with envelopes since 2024 have used this feature." },
  { id: 48, theme: "Content Creation Landing Pages", subTheme: "", description: "Users can select which landing page they'd like to use for a given campaign.", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "missing", where: "", notes: "On average, each portal has about 4.7 landing pages to choose from." },
  { id: 49, theme: "Content Creation Landing Pages", subTheme: "", description: "When looking for a landing page, users should be able to use a search input to search through all the landing page options", priority: "SHOULD HAVE", kelleyPriority: "Low", designReview: "Pass", status: "n/a", where: "", notes: "On average, each portal has about 4.7 landing pages to choose from." },
  { id: 50, theme: "Content Creation Landing Pages", subTheme: "", description: "Users will be able to choose not to add any \"attachment\" (cta button, pdf, form, or thanksgiving campaign to their landing page)", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "missing", where: "", notes: "On average, 22% of non-video request campaigns created since 2024 had \"none\" selected for their landing_page_moduel" },
  { id: 51, theme: "Content Creation Landing Pages", subTheme: "", description: "Users will be able to choose a CTA button for their landing page module, and they'll be able to select the text & URL for the button", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "missing", where: "", notes: "On average, 72% of non-video request campaigns created since 2024 had \"CTA\" selected for their landing_page_moduel" },
  { id: 52, theme: "Content Creation Landing Pages", subTheme: "", description: "Users will be able to choose a PDF embed for their landing page module, and they'll be able to upload a PDF & choose if it can be shared from the landing page or not. Recipients will be able to view, or download the PDF (and share it if the sender allows)", priority: "SHOULD HAVE", kelleyPriority: "Med", designReview: "Needs Work", status: "n/a", where: "", notes: "On average, 5% of non-video request campaigns created since 2024 had \"PDF\" selected for their landing_page_moduel" },
  { id: 53, theme: "Content Creation Landing Pages", subTheme: "", description: "Users will be able to choose a form embed for their landing page module, and they'll be able to paste in a link to their form (Givebutter, BoostMySchool, and Typeform all supported)", priority: "COULD HAVE", kelleyPriority: "Low", designReview: "Needs Work", status: "n/a", where: "", notes: "On average, 1% of non-video request campaigns created since 2024 had \"Embed Form\" selected for their landing_page_moduel" },
  { id: 54, theme: "Content Creation Landing Pages", subTheme: "", description: "Users will be able to choose \"Link to Thankgiving Campaign\" for their landing page module, and they'll be able to select which Givebutter campagin to tie the landing page to", priority: "COULD HAVE", kelleyPriority: "Low", designReview: "N/A to Design", status: "n/a", where: "", notes: "On average, 0.02% of non-video request campaigns created since 2024 had \"Link to Thankgiving Campaign\" selected for their landing_page_moduel" },
  { id: 55, theme: "Content Creation Landing Pages", subTheme: "", description: "Users should be able to turn off the ability for recipients to respond to their campaign via email", priority: "MUST HAVE", kelleyPriority: "Med", designReview: "Pass", status: "n/a", where: "", notes: "About 6% of campaigns created in the last 2 years have had email replies disabled" },
  { id: 56, theme: "Content Creation Landing Pages", subTheme: "", description: "Users should be able to turn off the ability for recipients to respond to their campaign via video", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "missing", where: "", notes: "About 28% of campaigns created in the last 2 years have had video replies disabled" },
  { id: 57, theme: "Content Creation Landing Pages", subTheme: "", description: "Users should be able to turn off the ability for recipients to download their ThankView video", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "missing", where: "", notes: "About 22% of campaigns created in the last 2 years have had video downloads disabled" },
  { id: 58, theme: "Content Creation Landing Pages", subTheme: "", description: "Users should be able to turn off the ability for recipients to share their ThankView", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "missing", where: "", notes: "About 26% of campaigns saved since 2024 have had share enabled." },
  { id: 59, theme: "Content Creation Landing Pages", subTheme: "", description: "If a video shown on a landing page includes closed captions, there will be an area on the landing page where recipients can download these captions (this is not something ThankView users can disable)", priority: "MUST HAVE", kelleyPriority: "High", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
  { id: 60, theme: "Content Creation Landing Pages", subTheme: "", description: "If a video shown on a landing page includes closed captions, the video player on the landing page will include a tool that allows watchers to turn the closed captions on or off (this is not something ThankView users can disable)", priority: "—", kelleyPriority: "High", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
  { id: 61, theme: "Content Creation Landing Pages", subTheme: "", description: "Any previously created landing pages that were sent out with campaigns will continue to work. This means if a recipient clicks on a link for an old ThankView landing page, they should still be taken to that landing page and see the content as it was before.", priority: "MUST HAVE", kelleyPriority: "High", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
  { id: 62, theme: "Content Creation Landing Pages", subTheme: "", description: "In the new app, users will see all of their previously created landing pages, and they will be able to edit and/or use those previously created landing pages for future campaigns", priority: "—", kelleyPriority: "High", designReview: "N/A to Design", status: "n/a", where: "", notes: "68% of landing pages that have been used in the last 2 years have been used more than once. It's very likely that if a landing page has been used in the last two years, a customer will want to use ..." },
  { id: 63, theme: "Email / SMS / Landing Page Previews", subTheme: "", description: "Previews of email, sms, and landing pages update in real-time as users make edits / adjustments", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Needs Work", status: "missing", where: "", notes: "" },
  { id: 64, theme: "Email / SMS / Landing Page Previews", subTheme: "", description: "For email campaigns, users can preview what an email and landing page will look like on desktop, tablet, or mobile device", priority: "MUST HAVE", kelleyPriority: "Med", designReview: "Needs Work", status: "n/a", where: "", notes: "" },
  { id: 65, theme: "Email / SMS / Landing Page Previews", subTheme: "", description: "For SMS campaigns, users can preview what an SMS and landing page will look like on a tablet or mobile device", priority: "MUST HAVE", kelleyPriority: "Med", designReview: "Needs Work", status: "n/a", where: "", notes: "" },
  { id: 66, theme: "Email / SMS / Landing Page Previews", subTheme: "", description: "Users can preview email, sms, and/or landing pages as a specific campaign recipient (relevant merge fields filled in, in previews in as applicable)", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Fail", status: "missing", where: "", notes: "" },
  { id: 67, theme: "Campaign Channel", subTheme: "", description: "Email via Postmark", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 68, theme: "Campaign Channel", subTheme: "", description: "SMS via Twilio", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 69, theme: "Campaign Channel", subTheme: "", description: "Share - Facebook", priority: "COULD HAVE", kelleyPriority: "High", designReview: "Fail", status: "partial", where: "", notes: "Is this referring to the \"sharable link\" option for video request campaigns?" },
  { id: 70, theme: "Standard Campaign Types", subTheme: "", description: "Standard Campaigns - Thank you", priority: "MUST HAVE", kelleyPriority: "Low", designReview: "Pass", status: "done", where: "", notes: "Note for all \"standard Campaign Types\" rows: Moving forward, we will no longer have different \"campaign types\" in ThankView. However, there will be essentially campagin configurations as follow..." },
  { id: 71, theme: "Standard Campaign Types", subTheme: "", description: "Standard Campaigns - Appeals", priority: "MUST HAVE", kelleyPriority: "Low", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 72, theme: "Standard Campaign Types", subTheme: "", description: "Standard Campaigns - Events", priority: "MUST HAVE", kelleyPriority: "Low", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 73, theme: "Standard Campaign Types", subTheme: "", description: "Standard Campaigns - Updates", priority: "MUST HAVE", kelleyPriority: "Low", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 74, theme: "Standard Campaign Types", subTheme: "", description: "Standard Campaigns - Other", priority: "MUST HAVE", kelleyPriority: "Low", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 75, theme: "Standard Campaign Types", subTheme: "", description: "Endowment Campaigns (ODDER)", priority: "—", kelleyPriority: "High", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 76, theme: "Standard Campaign Types", subTheme: "", description: "Student Engagement", priority: "WON'T HAVE (for this release), COULD HAVE", kelleyPriority: "—", designReview: "—", status: "n/a", where: "", notes: "What is this?" },
  { id: 77, theme: "Standard Campaign Types", subTheme: "", description: "RNL Engage", priority: "WON'T HAVE (for this release), COULD HAVE", kelleyPriority: "—", designReview: "—", status: "n/a", where: "", notes: "What is this?" },
  { id: 78, theme: "Birthday / Anniversary Type", subTheme: "", description: "Automated scheduled sends based on birthdate date in future", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Fail", status: "partial", where: "", notes: "8% of customers have sent at least one birthday or anniversary campaign in the last 2 years In order to continue supporting the previous Birthday & Anniversary campaign flow, users will be able to ..." },
  { id: 79, theme: "Birthday / Anniversary Type", subTheme: "", description: "Automated scheduled sends based on anniversary date in future", priority: "SHOULD HAVE", kelleyPriority: "High", designReview: "Fail", status: "partial", where: "", notes: "" },
  { id: 80, theme: "Birthday / Anniversary Type", subTheme: "", description: "Error handling if missing dates or in wrong format or past", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Fail", status: "partial", where: "", notes: "" },
  { id: 81, theme: "Career Moves Type", subTheme: "", description: "Career Move Specific Default Text", priority: "COULD HAVE", kelleyPriority: "Low", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
  { id: 82, theme: "Career Moves Type", subTheme: "", description: "MISSING: Tie in with Career Moves files in Signal", priority: "WON'T HAVE (for this release), COULD HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "", notes: "We'll support this not via a specific campaign \"type\" but through the fact that users will be able to tie the campaign audience to a saved search of \"Got new job withing the last X days\"" },
  { id: 83, theme: "Video Request Campaigns", subTheme: "", description: "New Delivery Type Option: Shareable Link -- Link for landing page is shown in the campaigns creation flow so that user can copy it and share where they like", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Fail", status: "partial", where: "", notes: "While only 6% of non-deleted, saved video request campaigns used the \"share link\" method\" in the last 2 years... it does appear that this usage is spread out across 16% of portals. As such, I'd ..." },
  { id: 84, theme: "Video Request Campaigns", subTheme: "", description: "Add Recorders (same functionality as recipients but these will record)", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Fail", status: "partial", where: "", notes: "" },
  { id: 85, theme: "Video Request Campaigns", subTheme: "", description: "Send automated reminders with DUE DATE x/days before due date (Can send multiple)", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Fail", status: "partial", where: "", notes: "Roughly 18% of video request campaigns have at least one follow-up email, and 43% of portals have sent out a video request campaign." },
  { id: 86, theme: "Video Request Campaigns", subTheme: "", description: "Branded Landing page selection (Does not include builder access)", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Fail", status: "partial", where: "", notes: "" },
  { id: 87, theme: "Video Request Campaigns", subTheme: "", description: "Text editor includes default instructions on how to record and recording tips", priority: "COULD HAVE", kelleyPriority: "Med", designReview: "N/A to Design", status: "done", where: "", notes: "" },
  { id: 88, theme: "Video Request Campaigns", subTheme: "", description: "Users can include a video from their video library as part of the \"instructions\" in their video request campaign.", priority: "COULD HAVE", kelleyPriority: "Low", designReview: "N/A to Design", status: "done", where: "", notes: "Only 0.8% of video request campaigns saved since the start of 2024 have included video instructions in them." },
  { id: 89, theme: "Video Request Campaigns", subTheme: "", description: "Enable | Disable Submissions Link", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Fail", status: "partial", where: "", notes: "" },
  { id: 90, theme: "Video Request Campaigns", subTheme: "", description: "When a person submits a video to a video request campaign, these are shown on the campaign \"replies\" page", priority: "MUST HAVE", kelleyPriority: "Med", designReview: "N/A to Design", status: "done", where: "", notes: "There could be a better UX / UI answer to this. If we run out of time though, we can just recreate this flow" },
  { id: 91, theme: "Video Request Campaigns", subTheme: "", description: "All videos that are submitted as a result of video request campaigns, show in the \"replies\" folder in the video library", priority: "MUST HAVE", kelleyPriority: "Med", designReview: "N/A to Design", status: "done", where: "", notes: "There could be a better UX / UI answer to this. If we run out of time though, we can just recreate this flow" },
  { id: 92, theme: "Adding Videos to Campaigns Video Intros", subTheme: "", description: "Users should be able to add an intro that will be applied to all the videos sent out in the given campaign", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Fail", status: "missing", where: "", notes: "33.6% of videos sent in the last 2 years have had an intro" },
  { id: 93, theme: "Adding Videos to Campaigns Video Intros", subTheme: "", description: "For the initial launch, ThankView users will be able to select from at least one of the top nine most used intro themes (Highlighted here in green) to use as an intro for their ThankView campaigns For these intro themes... we will not recreate every intro or intro template that a user has ever ma...", priority: "—", kelleyPriority: "High", designReview: "Fail", status: "missing", where: "", notes: "Of all the campaigns that have used intros in the last two years, about 95% of them used one of these nine intros" },
  { id: 94, theme: "Adding Videos to Campaigns Video Intros", subTheme: "", description: "Any past intros or intro templates made with an old intro theme (whether it relied on one of the old intro themes we're recreating or not) will continue to be visible when a recipient watches an old video and also visible in the campaign builder.... but the intro will be READ ONLY. This means tha...", priority: "—", kelleyPriority: "High", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
  { id: 95, theme: "Adding Videos to Campaigns Video Intros", subTheme: "", description: "Once users customize an intro theme for their campaign, they can choose to save that customization as a \"template\" in their portal so it can quickly be re-used in future campaigns", priority: "SHOULD HAVE", kelleyPriority: "Med", designReview: "—", status: "n/a", where: "", notes: "- About 5.6% of intros created are saved as templates - In the last two years, about 25% of the campaigns that have gone out with intros tied to them have used an intro that is a template.... but t..." },
  { id: 96, theme: "Adding Videos to Campaigns Video Intros", subTheme: "", description: "Users can select music from our music library to their intro if desired", priority: "SHOULD HAVE", kelleyPriority: "Med", designReview: "—", status: "n/a", where: "", notes: "About 5% of non-video request campaigns sent in the last two years included music" },
  { id: 97, theme: "Adding Videos to Campaigns Video Intros", subTheme: "", description: "Users can import custom music that can be added to intros in their specific portal", priority: "COULD HAVE", kelleyPriority: "Low", designReview: "N/A to Design", status: "n/a", where: "", notes: "Only 0.6% of non-video request campaigns sent in the last two years included custom music" },
  { id: 98, theme: "Adding Videos to Campaigns Video Outros", subTheme: "", description: "Users should be able to add an outro that will be applied to all the videos sent out in the given campaign", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Fail", status: "partial", where: "", notes: "About 99% of non-video request campaigns sent in the last two years included an outro. (see data here)" },
  { id: 99, theme: "Adding Videos to Campaigns Video Outros", subTheme: "", description: "Any past outros or outro templates made within the legacy TV app will continue to be visible when a recipient watches an old video and also visible in the campaign builder.... but the outro will be READ ONLY. This means that a user will not be able to change the image, colors, text, font, music, ...", priority: "—", kelleyPriority: "Med", designReview: "N/A to Design", status: "n/a", where: "", notes: "I'm assuming that it would be ALOT of work for us to reacreate the tens of thousands of existing outros in a way in which they would still be editable. If this is not the case, and this would be a ..." },
  { id: 100, theme: "Adding Videos to Campaigns Video Outros", subTheme: "", description: "Users can choose to save a customized outro as a \"template\" in their portal so it can quickly be re-used in future campaigns", priority: "SHOULD HAVE", kelleyPriority: "High", designReview: "Fail", status: "partial", where: "", notes: "About 29% of outros created are saved as templates, and about 61% of all campaigns that went out in the last two years used an outro that was saved as a template." },
  { id: 101, theme: "Adding Videos to Campaigns Video Overlays", subTheme: "", description: "Users should be able to add an overlay to the video clips that will be shown in their campagin", priority: "SHOULD HAVE", kelleyPriority: "Low", designReview: "N/A to Design", status: "n/a", where: "", notes: "Only 0.23% all non-video request campaigns that have been saved since the start of 2024 have used a video overlay" },
  { id: 102, theme: "Adding Videos to Campaigns Video Overlays", subTheme: "", description: "Any overlays used in past campaigns will continue to be visible when a recipient watches an old video.", priority: "—", kelleyPriority: "High", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
  { id: 103, theme: "Adding Videos to Campaigns Video Clips", subTheme: "", description: "There will be a quick way for users to send the same \"final video\" to all recipients in the campaign", priority: "—", kelleyPriority: "High", designReview: "Pass", status: "missing", where: "", notes: "About 75% of non-video request campaigns sent in the last two years sent the same video to all recipients" },
  { id: 104, theme: "Adding Videos to Campaigns Video Clips", subTheme: "", description: "There will be a way for users to include a personalized video clip in the \"final video\" and easily tie this video to one or multiple campaign recipient(s)", priority: "SHOULD HAVE", kelleyPriority: "High", designReview: "Needs Work", status: "missing", where: "", notes: "About 25% of non-video request campaigns sent in the last two years had variation in the final videos sent out to recipients" },
  { id: 105, theme: "Adding Videos to Campaigns Video Clips", subTheme: "", description: "There will be an easy way for users to be able to search and filter through campaign recipients when determining which recipients will be tied to given \"personalized video clips\".", priority: "SHOULD HAVE", kelleyPriority: "High", designReview: "Fail", status: "missing", where: "", notes: "" },
  { id: 106, theme: "Adding Videos to Campaigns Video Clips", subTheme: "", description: "If a personalized video clip has been tied to a recipient, users should have a way to edit / swap it out with a different personalized video clip if they want to.", priority: "SHOULD HAVE", kelleyPriority: "High", designReview: "Pass", status: "missing", where: "", notes: "" },
  { id: 107, theme: "Adding Videos to Campaigns Video Clips", subTheme: "", description: "Users will be able to add an additional video clip into the campaign that will be a part of every campaign recipients \"final video\"", priority: "SHOULD HAVE", kelleyPriority: "High", designReview: "Pass", status: "missing", where: "", notes: "About 3% of non-video request campaigns sent in the last two years included an add-on video... BUT plenty of customers are sending the same video to everyone in a campaign, they just have to do it ..." },
  { id: 108, theme: "Add Recipients to Campaigns", subTheme: "", description: "Users can Edit contacts while in the campaign flow", priority: "—", kelleyPriority: "Low", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
  { id: 109, theme: "Add Recipients to Campaigns", subTheme: "", description: "Users can remove contacts from a campaign after they've been added", priority: "—", kelleyPriority: "High", designReview: "Needs Work", status: "partial", where: "", notes: "" },
  { id: 110, theme: "Add Recipients to Campaigns", subTheme: "", description: "Upload CSV (error handling and notifications)", priority: "—", kelleyPriority: "High", designReview: "Needs Work", status: "partial", where: "", notes: "" },
  { id: 111, theme: "Add Recipients to Campaigns", subTheme: "", description: "Add Manually (via in app form)", priority: "—", kelleyPriority: "High", designReview: "Needs Work", status: "partial", where: "", notes: "" },
  { id: 112, theme: "Add Recipients to Campaigns", subTheme: "", description: "Add from Contacts", priority: "—", kelleyPriority: "High", designReview: "Needs Work", status: "partial", where: "", notes: "" },
  { id: 113, theme: "Add Recipients to Campaigns", subTheme: "", description: "Add From Lists", priority: "—", kelleyPriority: "High", designReview: "Needs Work", status: "partial", where: "", notes: "" },
  { id: 114, theme: "Add Recipients to Campaigns", subTheme: "", description: "Import from BB RE NXT (w/ Field Mapping) (requires integration enabled)", priority: "—", kelleyPriority: "Med", designReview: "Come back to review this Kelley!", status: "n/a", where: "", notes: "Depends on how many of our customers are using this" },
  { id: 115, theme: "Add Recipients to Campaigns", subTheme: "", description: "Import from Salesforce (w/ Field mapping) (required integration enabled)", priority: "—", kelleyPriority: "Med", designReview: "—", status: "n/a", where: "", notes: "Depends on how many of our customers are using this" },
  { id: 116, theme: "Add Recipients to Campaigns", subTheme: "", description: "Import from Bloomerang (w/field mapping) (requires integration enabled)", priority: "—", kelleyPriority: "Low", designReview: "—", status: "n/a", where: "", notes: "Depends on how many of our customers are using this" },
  { id: 117, theme: "Add Recipients to Campaigns", subTheme: "", description: "When a user adds a list of recipients to the campaign, at some point they'll be able to see a table of those recipients in the campaign experience", priority: "—", kelleyPriority: "High", designReview: "Needs Work", status: "partial", where: "", notes: "" },
  { id: 118, theme: "Add Recipients to Campaigns", subTheme: "", description: "When a user adds a list of recipients to the campaign, at some point they'll be able to see a table of those recipients in the campaign experience AND they'll be able to adjust which columns are shown in the table", priority: "—", kelleyPriority: "Med", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
  { id: 119, theme: "Campaign Data", subTheme: "", description: "Users will be able to see the following data for each campaign: - # of personalized videos added - # of messages sent - open rate - # of replies recieved - spam report rate - bounce rate", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Needs Work", status: "partial", where: "", notes: "" },
  { id: 120, theme: "Searching / Filtering through Campaigns", subTheme: "", description: "Users will be able to search through their campaigns by name", priority: "—", kelleyPriority: "High", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 121, theme: "Searching / Filtering through Campaigns", subTheme: "", description: "Users willl be able to filter their campaigns by status (status options TBD)", priority: "—", kelleyPriority: "High", designReview: "Fail", status: "partial", where: "", notes: "" },
  { id: 122, theme: "Searching / Filtering through Campaigns", subTheme: "", description: "Users willl be able to filter their campaigns by type", priority: "—", kelleyPriority: "High", designReview: "Fail", status: "partial", where: "", notes: "" },
  { id: 123, theme: "Searching / Filtering through Campaigns", subTheme: "", description: "Users willl be able to filter their campaigns by delivery method", priority: "—", kelleyPriority: "High", designReview: "Needs Work", status: "partial", where: "", notes: "" },
  { id: 124, theme: "Searching / Filtering through Campaigns", subTheme: "", description: "Users willl be able to filter campaigns based on who created the campaign", priority: "—", kelleyPriority: "High", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 125, theme: "Take Actions on Campaigns", subTheme: "", description: "Users will be able to change the status of a single campaign", priority: "—", kelleyPriority: "High", designReview: "Needs Work", status: "partial", where: "", notes: "" },
  { id: 126, theme: "Take Actions on Campaigns", subTheme: "", description: "Users will be able to change the status of campaigns in bulk", priority: "—", kelleyPriority: "Low", designReview: "N/A to Design", status: "done", where: "", notes: "" },
  { id: 127, theme: "Take Actions on Campaigns", subTheme: "", description: "Users will be able to delete a single campaign", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 128, theme: "Take Actions on Campaigns", subTheme: "", description: "Users will be able to delete campaigns in bulk", priority: "—", kelleyPriority: "Low", designReview: "N/A to Design", status: "done", where: "", notes: "" },
  { id: 129, theme: "Take Actions on Campaigns", subTheme: "", description: "Users will be able to rename a given campaign", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 130, theme: "Take Actions on Campaigns", subTheme: "", description: "Users will be able to duplicate a given campaign", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 131, theme: "Take Actions on Campaigns", subTheme: "", description: "If a user duplicates a single step campaign, their duplication will always \"copy\" all of the following from the original campaign: --- Message type copy (may have to convert from email body to SMS or vice versa --- Landing page settings & copy --- Video content ------- *If recipient selection i...", priority: "—", kelleyPriority: "High", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 132, theme: "Take Actions on Campaigns", subTheme: "", description: "If a user duplicates a multi-step campaign, their duplication will always \"copy\" all of the following from the original campaign: --- Step setup ------- Including each step (plus templates & automation settings in the steps), wait times, and conditions", priority: "—", kelleyPriority: "High", designReview: "Fail", status: "partial", where: "", notes: "" },
  { id: 133, theme: "Take Actions on Campaigns", subTheme: "", description: "If a user attempts to duplicate a single step campaign, they will have the option to decide if the new campaign will be sent via email or SMS", priority: "SHOULD HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 134, theme: "Take Actions on Campaigns", subTheme: "", description: "If a user attempts to duplicate a campaign, they will have the option to include the recipient selection in their duplication", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 135, theme: "Take Actions on Campaigns", subTheme: "", description: "If a user attempts to duplicate a campaign, they will have the option to include the success metric in their duplication", priority: "—", kelleyPriority: "Low", designReview: "Needs Work", status: "partial", where: "", notes: "" },
  { id: 136, theme: "Take Actions on Campaigns", subTheme: "", description: "If a user attempts to duplicate a campaign, they will have the option to include the same share settings in their duplication", priority: "—", kelleyPriority: "Low", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 137, theme: "Take Actions on Campaigns", subTheme: "", description: "If a user attempts to duplicate a campaign, they will have the option to include the same tags in their duplication", priority: "—", kelleyPriority: "High", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 138, theme: "Take Actions on Campaigns", subTheme: "", description: "If a user attempts to duplicate a campaign, they will have the option to include the same failure event in their duplication", priority: "—", kelleyPriority: "Low", designReview: "Pass", status: "done", where: "", notes: "" },
  { id: 139, theme: "Sending Campaigns", subTheme: "", description: "Users should be able to send themselves (or others) a test version of their campaign. When they send this test, they should be able to select which recipient will be used when sending the test (e.g. which recipient will be used for the variables and/or personalized video when sending the test)", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Needs Work", status: "missing", where: "", notes: "" },
  { id: 140, theme: "Sending Campaigns", subTheme: "", description: "Users should be able to get a link to a landing page for the campaign, so that they can experience what the landing page will be like for recipients", priority: "COULD HAVE", kelleyPriority: "High", designReview: "Pass", status: "missing", where: "", notes: "" },
  { id: 141, theme: "Sending Campaigns", subTheme: "", description: "Users should be able to get a link to a specific recipient's landing page / video for the campaign, so that they can experience what the landing page & video will be like for that specific recipient. Note: User should be made aware that viewing this landing page and/or video will impact their dat...", priority: "SHOULD HAVE", kelleyPriority: "Med", designReview: "Needs Work", status: "n/a", where: "", notes: "" },
  { id: 142, theme: "Sending Campaigns", subTheme: "", description: "When users have filled out all required info for the campaign, they should be able to either \"Send now\" or \"schedule send\" for a date / time in the future.", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Needs Work", status: "missing", where: "", notes: "" },
  { id: 143, theme: "Sending Campaigns", subTheme: "", description: "Users should be able to see the \"status\" of the campaign for each recipient tied to a campaign. Status options include: 1. N/A (e.g. the recipient is added to the campaign, but no action has been taken for them 2. Video Added (e.g. the recipient has a video tied to them in this campaign that wi...", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Needs Work", status: "missing", where: "", notes: "" },
  { id: 144, theme: "Resending Campaigns", subTheme: "", description: "Users should be able to resend the same message, landing page, and video to a recipient / list of recipients from the campaign as long as the given recipient meets ALL of the following: 1. Hasn't already clicked the CTA in the message 2. Hasn't gotten 3 or more messages from this campaign already...", priority: "SHOULD HAVE", kelleyPriority: "Low", designReview: "Fail", status: "n/a", where: "", notes: "Only 2.9% of projects with an email sent since 2024 have had one or more \"resends\"" },
  { id: 145, theme: "Resending Campaigns", subTheme: "", description: "When users resend an email from the campaign, they should have the option to update the subject line.", priority: "SHOULD HAVE", kelleyPriority: "Low", designReview: "N/A to Design", status: "n/a", where: "", notes: "Only 2.9% of projects with an email sent since 2024 have had one or more \"resends\"" },
  { id: 146, theme: "Resending Campaigns", subTheme: "", description: "When users resend an SMS from the campaign, they should have the option to update the SMS copy.", priority: "SHOULD HAVE", kelleyPriority: "Low", designReview: "N/A to Design", status: "n/a", where: "", notes: "Only 2.9% of projects with an email sent since 2024 have had one or more \"resends\"" },
  { id: 147, theme: "Resending Campaigns", subTheme: "", description: "Data for a given campaign needs to be clearly broken out between the initial message sent to a recipient, the first re-send, and the final resend.", priority: "SHOULD HAVE", kelleyPriority: "Low", designReview: "N/A to Design", status: "n/a", where: "", notes: "Only 2.9% of projects with an email sent since 2024 have had one or more \"resends\"" },
  { id: 148, theme: "Assign Tasks", subTheme: "", description: "A user can select one or more recipients from the campaign, and select a portal user who will be assigned the task of tying a personalized video clip to the selected recipient(s)", priority: "SHOULD HAVE", kelleyPriority: "High", designReview: "Fail", status: "missing", where: "", notes: "1% of portals have created one or more tasks in the last two years. Of the 58 portals that used this feature in the last two years, they created about 92 tasks each on average over that two year pe..." },
  { id: 149, theme: "Assign Tasks", subTheme: "", description: "A user can select one or more recipients from the campaign and UNassign people from adding personalized video clips for them", priority: "SHOULD HAVE", kelleyPriority: "High", designReview: "Fail", status: "missing", where: "", notes: "If we build this feature set, this should be included." },
  { id: 150, theme: "Assign Tasks", subTheme: "", description: "When users assigns a personalized video task to another user, they can include instructions telling them what / how to do it.", priority: "SHOULD HAVE", kelleyPriority: "Low", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
  { id: 151, theme: "Assign Tasks", subTheme: "", description: "When a user is assigned or unassigned a personalized video task, it will send them an email, notifying them of the task the've been assigned.", priority: "SHOULD HAVE", kelleyPriority: "High", designReview: "N/A to Design", status: "n/a", where: "", notes: "If we build this feature set, this should be included." },
  { id: 152, theme: "Assign Tasks", subTheme: "", description: "When a user is assigned or unassigned a personalized video task, they will get an in app notification, notifying them of the task the've been assigned.", priority: "SHOULD HAVE", kelleyPriority: "Low", designReview: "N/A to Design", status: "n/a", where: "", notes: "" },
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
  { id: 1, theme: "Contacts Table & Display", subTheme: "Table", description: "Sortable contact table with click-to-sort column headers (asc/desc/none tri-state)", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "Contacts.tsx (SortableHeader, handleSort)", notes: "SortableHeader component with ArrowUp/ArrowDown/ArrowUpDown icons. Tri-state sort on each column key." },
  { id: 2, theme: "Contacts Table & Display", subTheme: "Columns", description: "Column customization modal — add, remove, and drag-reorder columns grouped by category", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "Contacts.tsx (EditColumnsModal)", notes: "Two-panel modal: Available (grouped by Summary/Profile/Engagement/etc.) and Active with GripVertical reorder and moveUp/moveDown." },
  { id: 3, theme: "Contacts Table & Display", subTheme: "Columns", description: "28 available columns across 6 groups (Summary, Profile, Engagement, Contact Info, Address, Custom Fields)", priority: "MUST HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Contacts.tsx (ALL_COLUMNS)", notes: "28 ColumnDef entries including cf_preferred_name, cf_spouse_name, cf_graduation_year, cf_degree, cf_interest_area, cf_board_term, cf_committee, cf_department." },
  { id: 4, theme: "Contacts Table & Display", subTheme: "Pagination", description: "Pagination with configurable rows-per-page (10/25/50/100)", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "Contacts.tsx (Pagination component)", notes: "Page navigation with rows-per-page select, 'Showing X–Y of Z' display, and ChevronLeft/ChevronRight page buttons." },
  { id: 5, theme: "Contacts Table & Display", subTheme: "Layout", description: "Total constituent count shown in header (542,578)", priority: "MUST HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Contacts.tsx (TOTAL_COUNT + header subtitle)", notes: "TOTAL_COUNT = 542578 displayed formatted as '542,578 Constituents' under the page title." },
  { id: 6, theme: "Contacts Table & Display", subTheme: "Layout", description: "Responsive mobile card layout for contacts (hidden on desktop, visible on mobile)", priority: "SHOULD HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Contacts.tsx (Box hiddenFrom='md' / visibleFrom='md')", notes: "Desktop gets full Table; mobile gets stacked cards with avatar, name, affiliation, email." },
  { id: 7, theme: "Contacts Table & Display", subTheme: "Navigation", description: "Click any contact row to navigate to their profile page", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "Contacts.tsx (Table.Tr onClick → navigate('/contacts/${c.id}'))", notes: "Both desktop rows and mobile cards navigate to /contacts/:id on click." },
  { id: 8, theme: "Contacts Table & Display", subTheme: "Empty State", description: "Empty state with illustration when no contacts match search/filter", priority: "SHOULD HAVE", kelleyPriority: "Low", designReview: "Pass", status: "done", where: "Contacts.tsx (filtered.length === 0 block)", notes: "Purple circle icon, 'No contacts found' heading, suggestion text, and 'Add Contact' button." },
  { id: 9, theme: "Search & Filtering", subTheme: "Search", description: "Global text search across name, email, remote ID, and company", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "Contacts.tsx (search state + filtered useMemo)", notes: "TextInput with Search icon. Filters across first last email remoteId company concatenation." },
  { id: 10, theme: "Search & Filtering", subTheme: "FilterBar", description: "Reusable FilterBar component with configurable filter pills and add-filter dropdown", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "Contacts.tsx (FilterBar component), components/FilterBar.tsx", notes: "FilterBar accepts FilterDef[] and renders active filter pills with popover dropdowns. Supports add/remove filters." },
  { id: 11, theme: "Search & Filtering", subTheme: "Filters", description: "Filter contacts by star rating", priority: "SHOULD HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Contacts.tsx (filterValues.starRating case)", notes: "Multi-select star rating filter (1–5 stars)." },
  { id: 12, theme: "Search & Filtering", subTheme: "Filters", description: "Filter contacts by email status (valid, bounced, unsubscribed, spam)", priority: "SHOULD HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Contacts.tsx (hasValidEmail, hasBouncedEmail, hasSpamEmail, hasUnsubscribedEmail)", notes: "Four separate boolean filters for each email status." },
  { id: 13, theme: "Search & Filtering", subTheme: "Filters", description: "Filter contacts by phone status (valid, bounced, unsubscribed)", priority: "SHOULD HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Contacts.tsx (hasValidPhone, hasBouncedPhone, hasUnsubscribedPhone)", notes: "Three phone-status boolean filters." },
  { id: 14, theme: "Search & Filtering", subTheme: "Filters", description: "Filter contacts by custom field existence (e.g. 'has Graduation Year')", priority: "COULD HAVE", kelleyPriority: "Low", designReview: "Pass", status: "done", where: "Contacts.tsx (customField filter case)", notes: "Checks that all selected custom fields exist in c.customFields." },
  { id: 15, theme: "Adding Contacts – CSV Import", subTheme: "Upload", description: "CSV file upload with drag-and-drop zone", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "AddContacts.tsx (CsvFlow → upload step)", notes: "Full drag-and-drop zone with dashed border, file icon, size/row display. Also supports click-to-browse." },
  { id: 16, theme: "Adding Contacts – CSV Import", subTheme: "Import Mode", description: "Three import modes: Add New, Update Existing, and Full Replace", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "AddContacts.tsx (IMPORT_MODES → mode step)", notes: "Radio card selection: Add (Plus icon), Update (RefreshCw), Replace (Replace icon, danger styled). Each has description text." },
  { id: 17, theme: "Adding Contacts – CSV Import", subTheme: "Mapping", description: "Auto-mapping CSV columns to ThankView fields with manual override via Select dropdown", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "AddContacts.tsx (mapping step → Select with TV_FIELDS_GROUPED)", notes: "Table showing CSV header, sample values, and grouped Select dropdown for TV field mapping. 'Skip this column' option available." },
  { id: 18, theme: "Adding Contacts – CSV Import", subTheme: "Validation", description: "Validation step with animated progress bar and error/warning display", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "AddContacts.tsx (validating + review steps)", notes: "Animated progress bar (0→100%). Errors table shows row, column, value, error message. Severity badges: red error, yellow warning." },
  { id: 19, theme: "Adding Contacts – CSV Import", subTheme: "Validation", description: "Error rows individually dismissable; 'Skip errored rows' toggle", priority: "SHOULD HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "AddContacts.tsx (skipErrors Switch)", notes: "Switch toggle 'Skip errored rows and import valid ones only'. Show/hide all errors." },
  { id: 20, theme: "Adding Contacts – CSV Import", subTheme: "Replace Mode", description: "Full Replace confirmation requires typing 'DELETE {count}' before proceeding", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "AddContacts.tsx (confirmText match)", notes: "Danger zone with red styling. Exact text match required. Button disabled until confirmed." },
  { id: 21, theme: "Adding Contacts – CSV Import", subTheme: "Review", description: "Review summary card showing valid, flagged, matched, new, and deleted counts", priority: "MUST HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "AddContacts.tsx (review step stats display)", notes: "Stats grid with icons: valid (green), flagged (red), matched (blue), new rows (purple), deleted (red, replace only)." },
  { id: 22, theme: "Adding Contacts – Manual & Integrations", subTheme: "Method Picker", description: "Method picker page with cards for CSV, Manual, RE NXT, Salesforce, Bloomerang", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "AddContacts.tsx (MethodCard components)", notes: "Five MethodCard buttons with icon, title, description, arrow. Salesforce and Bloomerang show 'Coming Soon' badge and are disabled." },
  { id: 23, theme: "Adding Contacts – Manual & Integrations", subTheme: "Manual Entry", description: "Manual single-contact form with configurable field picker (enable/disable fields)", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "AddContacts.tsx (ManualFlow → MANUAL_FIELDS, enabledFields)", notes: "Two-panel layout: field picker left (checkboxes by group), form right. 16 available fields across Core/Profile/Address/Other. Donor ID required by default." },
  { id: 24, theme: "Adding Contacts – Manual & Integrations", subTheme: "Manual Entry", description: "Multi-contact staging queue — add contacts to a queue before bulk saving", priority: "MUST HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "AddContacts.tsx (StagedContact[], staged state)", notes: "Queue list with avatar, name, email badge. Remove individual contacts. 'Save All' button to commit." },
  { id: 25, theme: "Adding Contacts – Manual & Integrations", subTheme: "Manual Entry", description: "Tag selection on manual form with preset tags (TagSelect component)", priority: "SHOULD HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "AddContacts.tsx (ManualFlow → TagSelect)", notes: "TagSelect component with CONTACT_PRESET_TAGS. Searchable, multi-select, create custom tags." },
  { id: 26, theme: "Adding Contacts – Manual & Integrations", subTheme: "RE NXT", description: "RE NXT integration flow: OAuth connect → query builder → field mapping → preview → import", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "AddContacts.tsx (RenxtFlow, RENXT_FIELDS, DEFAULT_RENXT_MAPPING)", notes: "5-step wizard: connect (simulated OAuth), query builder with criteria, field mapping table, preview with mock results, animated import progress." },
  { id: 27, theme: "Adding Contacts – Manual & Integrations", subTheme: "Integrations", description: "Salesforce and Bloomerang placeholders shown as 'Coming Soon' disabled cards", priority: "COULD HAVE", kelleyPriority: "Low", designReview: "Pass", status: "done", where: "AddContacts.tsx (MethodCard disabled + 'Coming Soon' badge)", notes: "Salesforce and Bloomerang cards grayed out, cursor: not-allowed, cyan 'Coming Soon' badge." },
  { id: 28, theme: "Adding Contacts – Manual & Integrations", subTheme: "Navigation", description: "Add Contacts menu dropdown from Contacts page header (single, CSV, RE NXT, Salesforce, Bloomerang)", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "Contacts.tsx (Menu.Dropdown with navigate('/contacts/add?method=...'))", notes: "ActionIcon UserPlus with Tooltip opens Menu: Add Single Contact, then Bulk Import section with CSV, RE NXT, Salesforce, Bloomerang." },
  { id: 29, theme: "Contact Profile", subTheme: "Hero Card", description: "Contact detail page with hero card: avatar, name, tags, affiliation, quick stats", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "ContactProfile.tsx (DashCard hero section + SimpleGrid stats)", notes: "84px avatar with initials/color. Tags as Mantine Badges. Quick stats: Campaigns Received, Avg. Engagement, Total Giving, Giving Level." },
  { id: 30, theme: "Contact Profile", subTheme: "Edit Mode", description: "Inline edit mode for all contact fields (name, email, phone, company, title, remote ID, affiliation, assignee)", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "ContactProfile.tsx (editing state, TextInput/Select fields)", notes: "Edit button toggles editing. All fields become editable. Cancel resets via resetEditFields(). Save shows toast." },
  { id: 31, theme: "Contact Profile", subTheme: "Edit Mode", description: "Address editing: line 1, line 2, city, state, zip in a grid layout", priority: "MUST HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "ContactProfile.tsx (editAddr1/editAddr2/editCity/editState/editZip)", notes: "Divider-separated Address section. Line 1 full-width, Line 2 full-width, City/State/Zip in 3-col grid." },
  { id: 32, theme: "Contact Profile", subTheme: "Edit Mode", description: "Custom fields editing — add, edit, and remove key-value pairs", priority: "MUST HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "ContactProfile.tsx (editCustomFields, newCfKey/newCfValue)", notes: "Existing fields: read-only key, editable value, red delete button. New field: key/value inputs + green add button." },
  { id: 33, theme: "Contact Profile", subTheme: "Edit Mode", description: "Tags editing with TagSelect and preset tag options", priority: "SHOULD HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "ContactProfile.tsx (TagSelect with CONTACT_PRESET_TAGS)", notes: "Divider-labeled Tags section with full TagSelect component in edit mode." },
  { id: 34, theme: "Contact Profile", subTheme: "Tabs", description: "Four profile tabs: Overview, Activity Timeline, Campaign History, Engagement", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "ContactProfile.tsx (Tabs with 4 panels)", notes: "Mantine Tabs with tvPurple color and xl radius. Each tab has an icon: User, Clock, Send, BarChart3." },
  { id: 35, theme: "Contact Profile", subTheme: "Overview", description: "Delivery status cards showing email and phone status with color-coded badges", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "ContactProfile.tsx (Delivery Status section)", notes: "Email/Phone status cards with contextual styling: green/red/orange/gray. Icons: CircleCheckBig, AlertTriangle, ShieldAlert, Ban." },
  { id: 36, theme: "Contact Profile", subTheme: "Overview", description: "Star rating, CT Score, and Video Score displays with visual indicators", priority: "SHOULD HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "ContactProfile.tsx (Star rating + CT/Video score progress bars)", notes: "5-star visual display. CT/Video Scores as horizontal progress bars with color bands (green ≥70, yellow ≥40, red <40)." },
  { id: 37, theme: "Contact Profile", subTheme: "Activity", description: "Activity timeline with vertical connector line and event icons (sent, opened, played, CTA, shared, downloaded, replied)", priority: "MUST HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "ContactProfile.tsx (activity tab → event timeline)", notes: "Vertical line with 7 event types, each with colored circle icon. Shows time and campaign name per event." },
  { id: 38, theme: "Contact Profile", subTheme: "Campaigns", description: "Campaign history table: Campaign, Sender, Channel, Status, View %, Watch %, Score, Sent date", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "ContactProfile.tsx (campaigns tab → desktop table + mobile cards)", notes: "8-column grid on desktop. Mobile card view with key metrics. Status badges with color coding." },
  { id: 39, theme: "Contact Profile", subTheme: "Actions", description: "Delete contact with confirmation modal", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "ContactProfile.tsx (DeleteModal, showDelete)", notes: "Trash2 ActionIcon triggers DeleteModal. Confirms with 'Delete' and shows toast on confirm." },
  { id: 40, theme: "Contact Profile", subTheme: "Navigation", description: "Contextual back navigation (from analytics, from campaign, default to contacts list)", priority: "SHOULD HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "ContactProfile.tsx (handleBack, searchParams 'from')", notes: "Back checks searchParams: 'analytics' → /analytics?tab=sends, campaign prefix → navigate(-1), default → /contacts." },
  { id: 41, theme: "Contact Profile", subTheme: "Overview", description: "CC and BCC addresses displayed on contact profile", priority: "COULD HAVE", kelleyPriority: "Low", designReview: "Pass", status: "done", where: "ContactProfile.tsx (CC Addresses + BCC Addresses rows)", notes: "Listed in Contact Information section. Shows comma-joined addresses or '—' if empty." },
  { id: 42, theme: "Bulk Actions & Export", subTheme: "Selection", description: "Checkbox selection per row with 'select all on page' toggle", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "Contacts.tsx (Checkbox per row + toggleAll)", notes: "Individual Checkbox per row. Header toggles all on page. Indeterminate state when partial." },
  { id: 43, theme: "Bulk Actions & Export", subTheme: "Action Bar", description: "Bulk action bar appears when contacts selected — shows count, actions, and dismiss", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "Contacts.tsx (selected.length > 0 block)", notes: "Purple tint bar with '{N} selected' count. Action buttons: Add to…, Export, Delete. X to deselect all." },
  { id: 44, theme: "Bulk Actions & Export", subTheme: "Actions", description: "Add selected contacts to campaign or list via dropdown menu", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "Contacts.tsx (Menu: Campaign + List options)", notes: "'Add to…' dropdown: Campaign (Send icon, toast), List (Users icon, opens AddToListModal)." },
  { id: 45, theme: "Bulk Actions & Export", subTheme: "Actions", description: "Add to List modal with existing list selection or create new list", priority: "MUST HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Contacts.tsx (AddToListModal)", notes: "Modal with list search, radio select, or 'Create new list' option. Confirms with toast." },
  { id: 46, theme: "Bulk Actions & Export", subTheme: "Actions", description: "Bulk delete selected contacts", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "Contacts.tsx (Delete button in bulk bar)", notes: "Red outline button with Trash2 icon. Deletes all selected, shows toast, clears selection." },
  { id: 47, theme: "Bulk Actions & Export", subTheme: "Export", description: "Export modal with scope selection (selected, filtered, all) and field picker by category", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "Contacts.tsx (ExportModal, EXPORT_CATEGORIES)", notes: "3 scope radio options. Category sidebar with all/none toggles. Field checkboxes. Footer shows counts." },
  { id: 48, theme: "Bulk Actions & Export", subTheme: "Export", description: "Export categories: Biographical, Contact Info, Address, Engagement, Custom Fields with nested field groups", priority: "MUST HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Contacts.tsx (EXPORT_CATEGORIES array)", notes: "5 export categories each with color and fieldGroups. Total ~45 exportable fields." },
  { id: 49, theme: "Lists Management", subTheme: "Table", description: "Lists table with sortable columns, search, and column customization", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "Lists.tsx (Table + SortableHeader + EditColumnsModal)", notes: "8 columns: List, Contacts, Creator, Last Updated, Created, Shared, Folder, Tags." },
  { id: 50, theme: "Lists Management", subTheme: "Folders", description: "Folder organization for lists with colored folder icons", priority: "SHOULD HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Lists.tsx (ListFolder[], folderId)", notes: "3 folders: Spring Campaigns, Cultivation, Phonathon with distinct colors." },
  { id: 51, theme: "Lists Management", subTheme: "CRUD", description: "Create, edit, and delete lists with modals", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "Lists.tsx (Create/Edit/Delete modals)", notes: "Create: name + description + folder. Edit: same. Delete: DeleteModal confirmation." },
  { id: 52, theme: "Lists Management", subTheme: "Archive", description: "Archive and unarchive lists with status filter", priority: "SHOULD HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Lists.tsx (archived flag, Archive/ArchiveRestore)", notes: "Archive action in row menu. Filter by Active/Archived. ArchiveRestore to unarchive." },
  { id: 53, theme: "Lists Management", subTheme: "Sharing", description: "Share lists with team members and filter by shared status", priority: "SHOULD HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Lists.tsx (sharedWith[], Share2 icon, shared filter)", notes: "Share action. Filter: Shared with me, Not shared, Shared by me." },
  { id: 54, theme: "Lists Management", subTheme: "Filters", description: "List-specific filters: creator, folder, tags, date, contact count, shared, status", priority: "MUST HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "Lists.tsx (LIST_FILTERS + FilterBar)", notes: "7 filter definitions using same FilterBar component as Contacts." },
  { id: 55, theme: "Saved Searches", subTheme: "Table", description: "Saved searches table with criteria preview, match count, and status", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "SavedSearches.tsx (Table + columns)", notes: "8 columns: Search, Criteria, Matches, Creator, Last Refreshed, Created, Status, Auto-Refresh." },
  { id: 56, theme: "Saved Searches", subTheme: "CRUD", description: "Create saved search with multi-criteria builder (field + operator + value)", priority: "MUST HAVE", kelleyPriority: "High", designReview: "Pass", status: "done", where: "SavedSearches.tsx (CriterionDef, criteria builder)", notes: "Each criterion has field, operator, value, category. Add/remove criteria. Preview match count." },
  { id: 57, theme: "Saved Searches", subTheme: "Status", description: "Active/Paused toggle for saved searches with Zap icon status indicator", priority: "SHOULD HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "SavedSearches.tsx (active flag, Play/Pause icons)", notes: "Toggle between active (green) and paused (gray). Status column in table." },
  { id: 58, theme: "Saved Searches", subTheme: "Settings", description: "Auto-refresh toggle per saved search", priority: "COULD HAVE", kelleyPriority: "Low", designReview: "Pass", status: "done", where: "SavedSearches.tsx (autoRefresh flag, RefreshCw icon)", notes: "Boolean toggle. Column shows active/off state." },
  { id: 59, theme: "Saved Searches", subTheme: "Actions", description: "Duplicate, edit, and delete saved search actions", priority: "MUST HAVE", kelleyPriority: "Med", designReview: "Pass", status: "done", where: "SavedSearches.tsx (MoreHorizontal menu → Copy, Edit2, Trash2)", notes: "Row action menu with duplicate, edit modal, and delete confirmation." },
];

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */
export function RequirementsAudit() {
  const [expandedThemes, setExpandedThemes] = useState<Set<string>>(new Set([...THEME_ORDER, ...SETTINGS_THEME_ORDER, ...CONTACTS_THEME_ORDER]));
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [search, setSearch] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  /* ── Imported CSVs ── */
  const [importedCsvs, setImportedCsvs] = useState<ImportedCsv[]>([]);
  const [expandedImports, setExpandedImports] = useState<Set<string>>(new Set());
  const [expandedImportRows, setExpandedImportRows] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Active tab ── */
  type Tab = "base" | "settings" | "contacts" | string; // "base", "settings", "contacts", or csv id
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
    let items: Requirement[] = REQUIREMENTS;
    if (statusFilter !== "all") items = items.filter(r => r.status === statusFilter);
    const q = search.toLowerCase().trim();
    if (q) items = items.filter(r =>
      r.description.toLowerCase().includes(q) ||
      r.notes.toLowerCase().includes(q) ||
      r.where.toLowerCase().includes(q)
    );
    return items;
  }, [statusFilter, search]);

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
    const total = REQUIREMENTS.length;
    const done = REQUIREMENTS.filter(r => r.status === "done").length;
    const partial = REQUIREMENTS.filter(r => r.status === "partial").length;
    const missing = REQUIREMENTS.filter(r => r.status === "missing").length;
    const na = REQUIREMENTS.filter(r => r.status === "n/a").length;
    return { total, done, partial, missing, na };
  }, []);

  /* ── Settings requirements filtering ── */
  const settingsFiltered = useMemo(() => {
    let items: Requirement[] = SETTINGS_REQUIREMENTS;
    if (statusFilter !== "all") items = items.filter(r => r.status === statusFilter);
    const q = search.toLowerCase().trim();
    if (q) items = items.filter(r =>
      r.description.toLowerCase().includes(q) ||
      r.notes.toLowerCase().includes(q) ||
      r.where.toLowerCase().includes(q)
    );
    return items;
  }, [statusFilter, search]);

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
    const total = SETTINGS_REQUIREMENTS.length;
    const done = SETTINGS_REQUIREMENTS.filter(r => r.status === "done").length;
    const partial = SETTINGS_REQUIREMENTS.filter(r => r.status === "partial").length;
    const missing = SETTINGS_REQUIREMENTS.filter(r => r.status === "missing").length;
    const na = SETTINGS_REQUIREMENTS.filter(r => r.status === "n/a").length;
    return { total, done, partial, missing, na };
  }, []);

  /* ── Contacts requirements filtering ── */
  const contactsFiltered = useMemo(() => {
    let items: Requirement[] = CONTACTS_REQUIREMENTS;
    if (statusFilter !== "all") items = items.filter(r => r.status === statusFilter);
    const q = search.toLowerCase().trim();
    if (q) items = items.filter(r =>
      r.description.toLowerCase().includes(q) ||
      r.notes.toLowerCase().includes(q) ||
      r.where.toLowerCase().includes(q)
    );
    return items;
  }, [statusFilter, search]);

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
    const total = CONTACTS_REQUIREMENTS.length;
    const done = CONTACTS_REQUIREMENTS.filter(r => r.status === "done").length;
    const partial = CONTACTS_REQUIREMENTS.filter(r => r.status === "partial").length;
    const missing = CONTACTS_REQUIREMENTS.filter(r => r.status === "missing").length;
    const na = CONTACTS_REQUIREMENTS.filter(r => r.status === "n/a").length;
    return { total, done, partial, missing, na };
  }, []);

  /* ── Campaigns requirements filtering ── */
  const campaignsFiltered = useMemo(() => {
    let items: Requirement[] = CAMPAIGNS_REQUIREMENTS;
    if (statusFilter !== "all") items = items.filter(r => r.status === statusFilter);
    const q = search.toLowerCase().trim();
    if (q) items = items.filter(r =>
      r.description.toLowerCase().includes(q) ||
      r.notes.toLowerCase().includes(q) ||
      r.where.toLowerCase().includes(q)
    );
    return items;
  }, [statusFilter, search]);

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
    const total = CAMPAIGNS_REQUIREMENTS.length;
    const done = CAMPAIGNS_REQUIREMENTS.filter(r => r.status === "done").length;
    const partial = CAMPAIGNS_REQUIREMENTS.filter(r => r.status === "partial").length;
    const missing = CAMPAIGNS_REQUIREMENTS.filter(r => r.status === "missing").length;
    const na = CAMPAIGNS_REQUIREMENTS.filter(r => r.status === "n/a").length;
    return { total, done, partial, missing, na };
  }, []);

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
                {stats.total} video creation + {settingsStats.total} settings + {contactsStats.total} contacts requirements{importedCsvs.length > 0 ? ` + ${importedCsvs.reduce((s, c) => s + c.rows.length, 0)} imported` : ""} checked against the current prototype
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
          {(activeTab === "base" || activeTab === "settings" || activeTab === "contacts" || activeTab === "campaigns") ? (() => {
            const s_ = activeTab === "base" ? stats : activeTab === "settings" ? settingsStats : activeTab === "campaigns" ? campaignsStats : contactsStats;
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
              const themeTotal = REQUIREMENTS.filter(r => r.theme === theme).length;
              const themeDone = REQUIREMENTS.filter(r => r.theme === theme && r.status === "done").length;
              const themePartial = REQUIREMENTS.filter(r => r.theme === theme && r.status === "partial").length;
              const themeNA = REQUIREMENTS.filter(r => r.theme === theme && r.status === "n/a").length;
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
                        <span className="text-[9px] w-[72px] text-center font-bold" style={{ color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Kelley</span>
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
                            <button
                              onClick={() => toggleRow(rowKey)}
                              className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-black/[0.01]"
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
                              <span className="w-[72px] text-center text-[10px] shrink-0" style={{
                                fontWeight: 600,
                                color: r.kelleyPriority === "High" ? "#7c45b0" : r.kelleyPriority === "Med" ? TV.warning : TV.textSecondary,
                              }}>
                                {r.kelleyPriority}
                              </span>
                              <span className="w-[80px] text-center text-[10px] shrink-0" style={{
                                fontWeight: 500,
                                color: r.designReview === "Pass" ? TV.success : r.designReview.includes("Fail") ? TV.danger : r.designReview === "Needs Work" ? TV.warning : TV.textSecondary,
                              }}>
                                {r.designReview.length > 14 ? r.designReview.slice(0, 14) + "…" : r.designReview}
                              </span>
                              <div className="w-[80px] flex justify-center shrink-0">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px]" style={{ fontWeight: 600, backgroundColor: cfg.bg, color: cfg.color }}>
                                  <Icon size={11} />{cfg.label}
                                </span>
                              </div>
                            </button>
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
                    {REQUIREMENTS.filter(r => r.status === "partial").map(r => (
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
                    {REQUIREMENTS.filter(r => r.status === "n/a").map(r => (
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
              const themeTotal = SETTINGS_REQUIREMENTS.filter(r => r.theme === theme).length;
              const themeDone = SETTINGS_REQUIREMENTS.filter(r => r.theme === theme && r.status === "done").length;
              const themePartial = SETTINGS_REQUIREMENTS.filter(r => r.theme === theme && r.status === "partial").length;
              const themeNA = SETTINGS_REQUIREMENTS.filter(r => r.theme === theme && r.status === "n/a").length;
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
                        <span className="text-[9px] w-[72px] text-center font-bold" style={{ color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Kelley</span>
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
                            <button
                              onClick={() => toggleRow(rowKey)}
                              className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-black/[0.01]"
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
                              <span className="w-[72px] text-center text-[10px] shrink-0" style={{
                                fontWeight: 600,
                                color: r.kelleyPriority === "High" ? "#7c45b0" : r.kelleyPriority === "Med" ? TV.warning : TV.textSecondary,
                              }}>
                                {r.kelleyPriority}
                              </span>
                              <span className="w-[80px] text-center text-[10px] shrink-0" style={{
                                fontWeight: 500,
                                color: r.designReview === "Pass" ? TV.success : r.designReview.includes("Fail") ? TV.danger : r.designReview === "Needs Work" ? TV.warning : TV.textSecondary,
                              }}>
                                {r.designReview.length > 14 ? r.designReview.slice(0, 14) + "…" : r.designReview}
                              </span>
                              <div className="w-[80px] flex justify-center shrink-0">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px]" style={{ fontWeight: 600, backgroundColor: cfg.bg, color: cfg.color }}>
                                  <Icon size={11} />{cfg.label}
                                </span>
                              </div>
                            </button>
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
                    {SETTINGS_REQUIREMENTS.filter(r => r.status === "partial").map(r => (
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
                    {SETTINGS_REQUIREMENTS.filter(r => r.status === "n/a").map(r => (
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
              const themeTotal = CAMPAIGNS_REQUIREMENTS.filter(r => r.theme === theme).length;
              const themeDone = CAMPAIGNS_REQUIREMENTS.filter(r => r.theme === theme && r.status === "done").length;
              const themePartial = CAMPAIGNS_REQUIREMENTS.filter(r => r.theme === theme && r.status === "partial").length;
              const themeNA = CAMPAIGNS_REQUIREMENTS.filter(r => r.theme === theme && r.status === "n/a").length;
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
                        <span className="text-[9px] w-[72px] text-center font-bold" style={{ color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Kelley</span>
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
                            <button
                              onClick={() => toggleRow(rowKey)}
                              className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-black/[0.01]"
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
                              <span className="w-[72px] text-center text-[10px] shrink-0" style={{
                                fontWeight: 600,
                                color: r.kelleyPriority === "High" ? "#7c45b0" : r.kelleyPriority === "Med" ? TV.warning : TV.textSecondary,
                              }}>
                                {r.kelleyPriority}
                              </span>
                              <span className="w-[80px] text-center text-[10px] shrink-0" style={{
                                fontWeight: 500,
                                color: r.designReview === "Pass" ? TV.success : r.designReview.includes("Fail") ? TV.danger : r.designReview === "Needs Work" ? TV.warning : TV.textSecondary,
                              }}>
                                {r.designReview.length > 14 ? r.designReview.slice(0, 14) + "\u2026" : r.designReview}
                              </span>
                              <div className="w-[80px] flex justify-center shrink-0">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px]" style={{ fontWeight: 600, backgroundColor: cfg.bg, color: cfg.color }}>
                                  <Icon size={11} />{cfg.label}
                                </span>
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
                    {CAMPAIGNS_REQUIREMENTS.filter(r => r.status === "partial").map(r => (
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
                    {CAMPAIGNS_REQUIREMENTS.filter(r => r.status === "missing").map(r => (
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

        {/* ── CONTACTS TAB ── */}
        {activeTab === "contacts" && (
          <>
            {CONTACTS_THEME_ORDER.map(theme => {
              const items = contactsGrouped.get(theme) ?? [];
              if (items.length === 0 && statusFilter !== "all") return null;
              const isExpanded = expandedThemes.has(theme);
              const themeTotal = CONTACTS_REQUIREMENTS.filter(r => r.theme === theme).length;
              const themeDone = CONTACTS_REQUIREMENTS.filter(r => r.theme === theme && r.status === "done").length;
              const themePartial = CONTACTS_REQUIREMENTS.filter(r => r.theme === theme && r.status === "partial").length;
              const themeNA = CONTACTS_REQUIREMENTS.filter(r => r.theme === theme && r.status === "n/a").length;
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
                        <span className="text-[9px] w-[72px] text-center font-bold" style={{ color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Kelley</span>
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
                            <button
                              onClick={() => toggleRow(rowKey)}
                              className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-black/[0.01]"
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
                              <span className="w-[72px] text-center text-[10px] shrink-0" style={{
                                fontWeight: 600,
                                color: r.kelleyPriority === "High" ? "#7c45b0" : r.kelleyPriority === "Med" ? TV.warning : TV.textSecondary,
                              }}>
                                {r.kelleyPriority}
                              </span>
                              <span className="w-[80px] text-center text-[10px] shrink-0" style={{
                                fontWeight: 500,
                                color: r.designReview === "Pass" ? TV.success : r.designReview.includes("Fail") ? TV.danger : r.designReview === "Needs Work" ? TV.warning : TV.textSecondary,
                              }}>
                                {r.designReview.length > 14 ? r.designReview.slice(0, 14) + "…" : r.designReview}
                              </span>
                              <div className="w-[80px] flex justify-center shrink-0">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px]" style={{ fontWeight: 600, backgroundColor: cfg.bg, color: cfg.color }}>
                                  <Icon size={11} />{cfg.label}
                                </span>
                              </div>
                            </button>
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
                    {CONTACTS_REQUIREMENTS.filter(r => r.status === "partial").map(r => (
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
                    {CONTACTS_REQUIREMENTS.filter(r => r.status === "n/a").map(r => (
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
        {activeTab !== "base" && activeTab !== "settings" && activeTab !== "contacts" && !activeCsv && (
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
                  <span className="text-[9px] w-[72px] text-center font-bold" style={{ color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Kelley</span>
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
                        <span className="w-[72px] text-center text-[10px] shrink-0" style={{
                          fontWeight: 600,
                          color: r.kelleyPriority.toLowerCase().includes("high") ? "#7c45b0" : r.kelleyPriority.toLowerCase().includes("med") ? TV.warning : TV.textSecondary,
                        }}>
                          {r.kelleyPriority || "—"}
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
