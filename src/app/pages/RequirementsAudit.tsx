import { useState, useMemo, useRef, useCallback } from "react";
import {
  CheckCircle2, XCircle, AlertTriangle, MinusCircle, ChevronDown, ChevronRight,
  Search, X, Upload, FileSpreadsheet, Trash2, Plus, Eye, EyeOff,
} from "lucide-react";
import { TV } from "../theme";

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
              className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-[12px] transition-all shrink-0 font-bold"
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
              className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-[12px] transition-all shrink-0 font-bold"
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
              className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-[12px] transition-all shrink-0 font-bold"
              style={{
                backgroundColor: activeTab === "contacts" ? TV.brandBg : "transparent",
                color: activeTab === "contacts" ? "white" : TV.textSecondary,
              }}
            >
              <FileSpreadsheet size={13} />
              Contacts ({contactsStats.total})
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
              className="flex items-center gap-1 px-3 py-2 rounded-[8px] text-[11px] transition-colors hover:bg-black/5 shrink-0"
              style={{ color: TV.textSecondary }}
            >
              <Plus size={12} />
              Add CSV
            </button>
          </div>

          {/* Stats bar — context-sensitive */}
          {(activeTab === "base" || activeTab === "settings" || activeTab === "contacts") ? (() => {
            const s_ = activeTab === "base" ? stats : activeTab === "settings" ? settingsStats : contactsStats;
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
                  <div className="h-full" style={{ width: `${(s_.partial / actionable) * 100}%`, backgroundColor: "#f59e0b" }} />
                  <div className="h-full" style={{ width: `${(s_.missing / actionable) * 100}%`, backgroundColor: "#ef4444" }} />
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
              className="w-full border border-tv-border-light bg-white rounded-full pl-9 pr-8 py-2 text-[13px] text-tv-text-primary outline-none transition-colors placeholder:text-tv-text-secondary focus:border-tv-border-strong focus:ring-1 focus:ring-tv-border-strong/30"
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
                          <div className="h-full" style={{ width: `${(themePartial / themeActionable) * 100}%`, backgroundColor: "#f59e0b" }} />
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
                                <div className="rounded-[10px] p-4" style={{ backgroundColor: "white", border: `1px solid ${TV.borderLight}` }}>
                                  <p className="text-[12px] mb-3" style={{ color: TV.textPrimary, lineHeight: "1.6" }}>{r.description}</p>
                                  <div className="flex items-start gap-2 mb-2">
                                    <span className="text-[9px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: TV.surfaceMuted, color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Where</span>
                                    <span className="text-[11px] font-mono" style={{ color: TV.textBrand, lineHeight: "1.5" }}>{r.where}</span>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <span className="text-[9px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: TV.surfaceMuted, color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Notes</span>
                                    <span className="text-[11px]" style={{ color: TV.textSecondary, lineHeight: "1.6" }}>{r.notes}</span>
                                  </div>
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
            <div className="mt-8 rounded-[16px] p-6" style={{ backgroundColor: "white", border: `1px solid ${TV.borderLight}` }}>
              <h3 className="text-[16px] mb-4" style={{ fontWeight: 800, color: TV.textPrimary }}>Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-[12px] p-4" style={{ backgroundColor: TV.warningBg, border: `1px solid ${TV.warningBorder}` }}>
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
                <div className="rounded-[12px] p-4" style={{ backgroundColor: "#f5f5f5", border: "1px solid #e5e5e5" }}>
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
                          <div className="h-full" style={{ width: `${(themePartial / themeActionable) * 100}%`, backgroundColor: "#f59e0b" }} />
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
                                <div className="rounded-[10px] p-4" style={{ backgroundColor: "white", border: `1px solid ${TV.borderLight}` }}>
                                  <p className="text-[12px] mb-3" style={{ color: TV.textPrimary, lineHeight: "1.6" }}>{r.description}</p>
                                  <div className="flex items-start gap-2 mb-2">
                                    <span className="text-[9px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: TV.surfaceMuted, color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Where</span>
                                    <span className="text-[11px] font-mono" style={{ color: TV.textBrand, lineHeight: "1.5" }}>{r.where}</span>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <span className="text-[9px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: TV.surfaceMuted, color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Notes</span>
                                    <span className="text-[11px]" style={{ color: TV.textSecondary, lineHeight: "1.6" }}>{r.notes}</span>
                                  </div>
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
            <div className="mt-8 rounded-[16px] p-6" style={{ backgroundColor: "white", border: `1px solid ${TV.borderLight}` }}>
              <h3 className="text-[16px] mb-4" style={{ fontWeight: 800, color: TV.textPrimary }}>Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-[12px] p-4" style={{ backgroundColor: TV.warningBg, border: `1px solid ${TV.warningBorder}` }}>
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
                <div className="rounded-[12px] p-4" style={{ backgroundColor: "#f5f5f5", border: "1px solid #e5e5e5" }}>
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
                          <div className="h-full" style={{ width: `${(themePartial / themeActionable) * 100}%`, backgroundColor: "#f59e0b" }} />
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
                                <div className="rounded-[10px] p-4" style={{ backgroundColor: "white", border: `1px solid ${TV.borderLight}` }}>
                                  <p className="text-[12px] mb-3" style={{ color: TV.textPrimary, lineHeight: "1.6" }}>{r.description}</p>
                                  <div className="flex items-start gap-2 mb-2">
                                    <span className="text-[9px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: TV.surfaceMuted, color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Where</span>
                                    <span className="text-[11px] font-mono" style={{ color: TV.textBrand, lineHeight: "1.5" }}>{r.where}</span>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <span className="text-[9px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: TV.surfaceMuted, color: TV.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Notes</span>
                                    <span className="text-[11px]" style={{ color: TV.textSecondary, lineHeight: "1.6" }}>{r.notes}</span>
                                  </div>
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
            <div className="mt-8 rounded-[16px] p-6" style={{ backgroundColor: "white", border: `1px solid ${TV.borderLight}` }}>
              <h3 className="text-[16px] mb-4" style={{ fontWeight: 800, color: TV.textPrimary }}>Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-[12px] p-4" style={{ backgroundColor: TV.warningBg, border: `1px solid ${TV.warningBorder}` }}>
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
                <div className="rounded-[12px] p-4" style={{ backgroundColor: "#f5f5f5", border: "1px solid #e5e5e5" }}>
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
              className="mt-3 px-4 py-2 rounded-[8px] text-[12px]"
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
            <div className="h-full" style={{ width: `${(iStats.partial / actionable) * 100}%`, backgroundColor: "#f59e0b" }} />
            <div className="h-full" style={{ width: `${(iStats.missing / actionable) * 100}%`, backgroundColor: "#ef4444" }} />
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
                    <div className="h-full" style={{ width: `${(tPartial / tActionable) * 100}%`, backgroundColor: "#f59e0b" }} />
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
                          <div className="rounded-[10px] p-4" style={{ backgroundColor: "white", border: `1px solid ${TV.borderLight}` }}>
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
      <div className="mt-8 rounded-[16px] p-6" style={{ backgroundColor: "white", border: `1px solid ${TV.borderLight}` }}>
        <h3 className="text-[16px] mb-4" style={{ fontWeight: 800, color: TV.textPrimary }}>Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-[12px] p-4" style={{ backgroundColor: TV.warningBg, border: `1px solid ${TV.warningBorder}` }}>
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
          <div className="rounded-[12px] p-4" style={{ backgroundColor: TV.dangerBg, border: "1px solid #fecaca" }}>
            <div className="flex items-center gap-2 mb-3">
              <XCircle size={16} style={{ color: TV.danger }} />
              <span className="text-[13px] font-bold" style={{ color: "#991b1b" }}>Missing — Not Yet Built ({iStats.missing})</span>
            </div>
            <ul className="space-y-2">
              {allRows.filter(r => r.status === "missing").map(r => (
                <li key={r.uid} className="flex items-start gap-2">
                  <span className="text-[10px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded-full" style={{ fontWeight: 600, backgroundColor: TV.dangerBg, color: "#991b1b" }}>#{allRows.indexOf(r) + 1}</span>
                  <span className="text-[11px]" style={{ color: "#991b1b", lineHeight: "1.5" }}>
                    <span style={{ fontWeight: 600 }}>{r.description.slice(0, 80)}{r.description.length > 80 ? "…" : ""}</span>
                    {r.notes ? ` — ${r.notes}` : ""}
                  </span>
                </li>
              ))}
              {iStats.missing === 0 && (
                <li className="text-[12px]" style={{ color: "#991b1b" }}>None — all requirements have been addressed!</li>
              )}
            </ul>
          </div>
        </div>
        {iStats.na > 0 && (
          <div className="rounded-[12px] p-4 mt-4" style={{ backgroundColor: "#f5f5f5", border: "1px solid #e5e5e5" }}>
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
