/**
 * TagPicker — pill-based tag selector with an "Add Tags" modal.
 *
 * Layout:
 *   - Preset tags rendered as toggleable pills inline
 *   - A distinctly-colored "+ Add Tags" pill opens a full management modal
 *   - Modal has search, sections (Presets -> Recently Used -> All), and custom tag creation
 *   - Non-preset selected tags also appear as removable pills below presets
 *   - Inline toast feedback confirms every add/remove/create action
 */
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Search, X, Plus, Tag, Clock, Bookmark, Check, CheckCircle2, Minus } from "lucide-react";
import { TV } from "../../theme";

/* ── Preset tags (built-in categories) ─────────────────────────────────────── */
const PRESET_TAGS = [
  "Thank You",
  "Appeals / Solicitation",
  "Video Request",
  "Events",
  "Updates",
  "Birthdays",
  "Anniversaries",
  "Endowment Reports",
  "Career Moves",
  "Student Engagement",
  "Other",
];

/* ── Mock "recently used" tags (simulated org history) ─────────────────────── */
const RECENTLY_USED_TAGS = [
  "Spring Appeal 2026",
  "Giving Day",
  "Year-End Campaign",
  "Welcome Series",
  "Reunion 2026",
  "Scholarship Impact",
  "Board Update",
];

/* ── Mock "all org tags" — full library that search draws from ──────────── */
const ALL_ORG_TAGS = [
  ...PRESET_TAGS,
  ...RECENTLY_USED_TAGS,
  "Alumni Newsletter",
  "Athletic Giving",
  "Campus Tour",
  "Capital Campaign",
  "Class Gift",
  "Community Engagement",
  "Corporate Matching",
  "Dean's Circle",
  "Donor Recognition",
  "Emergency Fund",
  "Faculty Spotlight",
  "First-Gen Support",
  "Graduate Programs",
  "Greek Life",
  "Honors Program",
  "Internship Fund",
  "Leadership Annual",
  "Legacy Society",
  "Library Fund",
  "Major Gifts",
  "Mentorship",
  "Parent Giving",
  "Phonathon",
  "Planned Giving",
  "Research Fund",
  "Scholarship Fund",
  "Senior Class Gift",
  "Staff Appreciation",
  "Student Emergency",
  "Study Abroad",
  "Sustainability",
  "Volunteer Appreciation",
];
const UNIQUE_ALL_TAGS = [...new Set(ALL_ORG_TAGS)];

/* ── Props ─────────────────────────────────────────────────────────────────── */
interface TagPickerProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  markDirty?: () => void;
}

export function TagPicker({ selectedTags, onTagsChange, markDirty }: TagPickerProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const toggleTag = useCallback(
    (tag: string) => {
      const next = selectedTags.includes(tag)
        ? selectedTags.filter((t) => t !== tag)
        : [...selectedTags, tag];
      onTagsChange(next);
      markDirty?.();
    },
    [selectedTags, onTagsChange, markDirty]
  );

  const removeTag = useCallback(
    (tag: string) => {
      onTagsChange(selectedTags.filter((t) => t !== tag));
      markDirty?.();
    },
    [selectedTags, onTagsChange, markDirty]
  );

  // Non-preset selected tags (custom / from library)
  const extraTags = selectedTags.filter((t) => !PRESET_TAGS.includes(t));

  return (
    <>
      {/* ── Preset pill row ─────────────────────────────────────────────── */}
      <div className="mb-3">
        <p className="text-[11px] text-tv-text-secondary mb-2" style={{ fontWeight: 500 }}>
          Presets
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESET_TAGS.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-[12px] border transition-all ${
                  active
                    ? "bg-tv-brand-bg text-white border-tv-brand-bg"
                    : "bg-white text-tv-text-primary border-tv-border-light hover:border-tv-border-strong"
                }`}
              >
                {tag}
              </button>
            );
          })}

          {/* ── Add Tags pill ──────────────────────────────────────── */}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] border border-dashed border-tv-brand/40 bg-tv-brand-tint text-tv-brand hover:bg-tv-brand-bg hover:text-white hover:border-tv-brand-bg transition-all"
            style={{ fontWeight: 500 }}
          >
            <Plus size={12} />
            Add Tags
          </button>
        </div>
      </div>

      {/* ── Extra (non-preset) selected tags ────────────────────────────── */}
      {extraTags.length > 0 && (
        <div className="mb-3">
          <p className="text-[11px] text-tv-text-secondary mb-2" style={{ fontWeight: 500 }}>
            Additional Tags
          </p>
          <div className="flex flex-wrap gap-2">
            {extraTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 pl-3 pr-1 py-1 rounded-full text-[12px] border bg-tv-surface text-tv-text-primary border-tv-border-light"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="w-4 h-4 rounded-full flex items-center justify-center text-tv-text-decorative hover:text-tv-danger hover:bg-tv-danger/10 transition-colors"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Selected count summary ──────────────────────────────────────── */}
      {selectedTags.length > 0 && (
        <p className="text-[11px] text-tv-text-decorative">
          {selectedTags.length} tag{selectedTags.length !== 1 ? "s" : ""} selected
          {extraTags.length > 0 && <> &middot; {extraTags.length} custom</>}
        </p>
      )}

      {/* ── Add Tags Modal ──────────────────────────────────────────── */}
      {modalOpen && (
        <TagManagerModal
          selectedTags={selectedTags}
          onToggle={toggleTag}
          onAdd={(tag) => {
            if (!selectedTags.includes(tag)) {
              onTagsChange([...selectedTags, tag]);
              markDirty?.();
            }
          }}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   Tag Manager Modal
   ══════════════════════════════════════════════════════════════════════════════ */

interface TagManagerModalProps {
  selectedTags: string[];
  onToggle: (tag: string) => void;
  onAdd: (tag: string) => void;
  onClose: () => void;
}

function TagManagerModal({ selectedTags, onToggle, onAdd, onClose }: TagManagerModalProps) {
  const [query, setQuery] = useState("");
  const [newTagInput, setNewTagInput] = useState("");
  const [toasts, setToasts] = useState<{ id: number; text: string; type: "added" | "removed" | "created" }[]>([]);
  const toastIdRef = useRef(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((text: string, type: "added" | "removed" | "created") => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev.slice(-2), { id, text, type }]); // keep max 3
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2200);
  }, []);

  const handleToggle = useCallback(
    (tag: string) => {
      const wasSelected = selectedTags.includes(tag);
      onToggle(tag);
      showToast(tag, wasSelected ? "removed" : "added");
    },
    [selectedTags, onToggle, showToast]
  );

  // Focus search on open
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const q = query.trim().toLowerCase();

  // Build sections
  const sections = useMemo(() => {
    const result: { key: string; label: string; icon: typeof Tag; tags: string[] }[] = [];

    if (!q) {
      result.push({ key: "presets", label: "Presets", icon: Bookmark, tags: PRESET_TAGS });
      const recentOnly = RECENTLY_USED_TAGS.filter((t) => !PRESET_TAGS.includes(t));
      if (recentOnly.length > 0) {
        result.push({ key: "recent", label: "Recently Used", icon: Clock, tags: recentOnly });
      }
      const remaining = UNIQUE_ALL_TAGS.filter(
        (t) => !PRESET_TAGS.includes(t) && !RECENTLY_USED_TAGS.includes(t)
      );
      if (remaining.length > 0) {
        result.push({ key: "all", label: "All Tags", icon: Tag, tags: remaining });
      }
    } else {
      const matched = UNIQUE_ALL_TAGS.filter((t) => t.toLowerCase().includes(q));
      const presetMatches = matched.filter((t) => PRESET_TAGS.includes(t));
      const recentMatches = matched.filter(
        (t) => !PRESET_TAGS.includes(t) && RECENTLY_USED_TAGS.includes(t)
      );
      const otherMatches = matched.filter(
        (t) => !PRESET_TAGS.includes(t) && !RECENTLY_USED_TAGS.includes(t)
      );

      if (presetMatches.length > 0)
        result.push({ key: "presets", label: "Presets", icon: Bookmark, tags: presetMatches });
      if (recentMatches.length > 0)
        result.push({ key: "recent", label: "Recently Used", icon: Clock, tags: recentMatches });
      if (otherMatches.length > 0)
        result.push({ key: "all", label: "All Tags", icon: Tag, tags: otherMatches });
    }
    return result;
  }, [q]);

  const totalResults = sections.reduce((n, s) => n + s.tags.length, 0);

  const canCreateNew =
    q.length > 0 &&
    !UNIQUE_ALL_TAGS.some((t) => t.toLowerCase() === q) &&
    !selectedTags.some((t) => t.toLowerCase() === q);

  const handleCreateTag = () => {
    const tag = newTagInput.trim();
    if (!tag) return;
    if (selectedTags.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
    if (UNIQUE_ALL_TAGS.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
    onAdd(tag);
    setNewTagInput("");
    showToast(tag, "created");
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[999] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
      role="dialog" aria-modal="true" aria-label="Manage tags"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div
        className="bg-white rounded-xl border border-tv-border-light shadow-2xl w-full max-w-[520px] mx-4 flex flex-col relative"
        style={{ maxHeight: "min(640px, 85vh)" }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-sm flex items-center justify-center"
              style={{ backgroundColor: TV.brandTint }}
            >
              <Tag size={15} style={{ color: TV.brand }} />
            </div>
            <div>
              <h3 className="text-[15px] text-tv-text-primary" style={{ fontWeight: 600 }}>
                Add Tags
              </h3>
              <p className="text-[11px] text-tv-text-secondary">
                Search, browse, or create new tags
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-tv-text-decorative hover:bg-tv-surface hover:text-tv-text-primary transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Search ─────────────────────────────────────────────────────── */}
        <div className="px-5 pb-3">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-tv-text-decorative"
            />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search from all tags\u2026"
              className="w-full pl-9 pr-3 py-2.5 text-[13px] border border-tv-border-light rounded-full outline-none focus:ring-2 focus:ring-tv-brand/30 focus:border-tv-brand bg-white placeholder:text-tv-text-decorative text-tv-text-primary transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-tv-text-decorative hover:text-tv-text-primary transition-colors"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* ── Selected pills bar ─────────────────────────────────────────── */}
        {selectedTags.length > 0 && (
          <div className="px-5 pb-3 flex items-start gap-2">
            <span
              className="text-[10px] text-tv-text-label uppercase tracking-wider shrink-0 pt-1"
              style={{ fontWeight: 600 }}
            >
              Selected
            </span>
            <div className="flex flex-wrap gap-1.5">
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-[11px] bg-tv-brand-tint text-tv-brand border border-tv-brand/20"
                  style={{ fontWeight: 500 }}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleToggle(tag)}
                    className="w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-tv-brand/15 transition-colors"
                    aria-label={`Remove ${tag}`}
                  >
                    <X size={8} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Divider ────────────────────────────────────────────────────── */}
        <div className="border-t border-tv-border-divider" />

        {/* ── Scrollable tag list ────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto px-1 py-1" style={{ minHeight: 0 }}>
          {sections.map((section) => (
            <div key={section.key} className="mb-1">
              {/* Section heading */}
              <div className="flex items-center gap-1.5 px-4 pt-3 pb-1.5 sticky top-0 bg-white z-10">
                <section.icon size={11} className="text-tv-text-decorative" />
                <span
                  className="text-[10px] text-tv-text-label uppercase tracking-wider"
                  style={{ fontWeight: 600 }}
                >
                  {section.label}
                </span>
                <span className="text-[10px] text-tv-text-decorative">
                  {section.tags.length}
                </span>
              </div>
              {/* Tag rows */}
              {section.tags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggle(tag)}
                    className={`w-full flex items-center gap-2.5 px-4 py-2 text-left rounded-sm mx-0 transition-colors ${
                      isSelected ? "bg-tv-brand-tint/50" : "hover:bg-tv-surface"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? "bg-tv-brand-bg border-tv-brand-bg"
                          : "border-tv-border-light"
                      }`}
                    >
                      {isSelected && <Check size={10} className="text-white" />}
                    </span>
                    <span
                      className={`flex-1 text-[13px] ${
                        isSelected ? "text-tv-text-primary" : "text-tv-text-secondary"
                      }`}
                      style={{ fontWeight: isSelected ? 500 : 400 }}
                    >
                      {q ? highlightMatch(tag, q) : tag}
                    </span>
                    {PRESET_TAGS.includes(tag) && (
                      <span className="text-[9px] text-tv-text-decorative bg-tv-surface rounded-full px-2 py-0.5">
                        preset
                      </span>
                    )}
                    {!PRESET_TAGS.includes(tag) && RECENTLY_USED_TAGS.includes(tag) && (
                      <span className="text-[9px] text-tv-text-decorative bg-tv-surface rounded-full px-2 py-0.5">
                        recent
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* ── Create from search ────────────────────────────────────────── */}
          {canCreateNew && (
            <div className="px-4 py-2">
              <button
                type="button"
                onClick={() => {
                  const tag = query.trim();
                  onAdd(tag);
                  setQuery("");
                  showToast(tag, "created");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-sm bg-tv-brand-tint/60 hover:bg-tv-brand-tint transition-colors"
              >
                <span className="w-4 h-4 rounded-[4px] bg-tv-brand-bg flex items-center justify-center shrink-0">
                  <Plus size={10} className="text-white" />
                </span>
                <span className="text-[13px] text-tv-brand" style={{ fontWeight: 500 }}>
                  Create &ldquo;{query.trim()}&rdquo;
                </span>
              </button>
            </div>
          )}

          {/* ── Empty search state ────────────────────────────────────────── */}
          {totalResults === 0 && !canCreateNew && q && (
            <div className="px-4 py-8 text-center">
              <Search size={20} className="text-tv-text-decorative mx-auto mb-2 opacity-40" />
              <p className="text-[12px] text-tv-text-secondary">
                No tags match &ldquo;{query}&rdquo;
              </p>
              <p className="text-[10px] text-tv-text-decorative mt-1">
                Try a different search or create a custom tag below.
              </p>
            </div>
          )}
        </div>

        {/* ── Inline toast notifications ───────────────────────────────── */}
        {toasts.length > 0 && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-[88px] z-50 flex flex-col gap-1.5 items-center pointer-events-none">
            {toasts.map((t) => (
              <div
                key={t.id}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] shadow-lg animate-[fadeInUp_0.2s_ease-out] ${
                  t.type === "removed"
                    ? "bg-tv-text-primary text-white"
                    : "bg-tv-brand-bg text-white"
                }`}
                style={{ fontWeight: 500 }}
              >
                {t.type === "removed" ? (
                  <Minus size={11} />
                ) : (
                  <CheckCircle2 size={11} />
                )}
                {t.type === "added" && <>Added &ldquo;{t.text}&rdquo;</>}
                {t.type === "removed" && <>Removed &ldquo;{t.text}&rdquo;</>}
                {t.type === "created" && <>Created &amp; added &ldquo;{t.text}&rdquo;</>}
              </div>
            ))}
          </div>
        )}

        {/* ── Footer: create custom tag ─────────────────────────────────── */}
        <div className="border-t border-tv-border-divider px-5 py-4">
          <p className="text-[10px] text-tv-text-label uppercase tracking-wider mb-2" style={{ fontWeight: 600 }}>
            Create Custom Tag
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateTag();
                  }
                }}
                placeholder="Type a new tag name\u2026"
                className="w-full px-3 py-2 text-[13px] border border-tv-border-light rounded-sm outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand"
              />
            </div>
            <button
              type="button"
              onClick={handleCreateTag}
              disabled={!newTagInput.trim()}
              className={`px-4 py-2 rounded-sm text-[12px] flex items-center gap-1.5 transition-colors ${
                newTagInput.trim()
                  ? "bg-tv-brand-bg text-white hover:bg-tv-brand-hover"
                  : "bg-tv-surface text-tv-text-decorative cursor-not-allowed"
              }`}
              style={{ fontWeight: 500 }}
            >
              <Plus size={12} />
              Add Tag
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Helper: highlight matching substring ──────────────────────────────────── */
function highlightMatch(text: string, query: string) {
  const idx = text.toLowerCase().indexOf(query);
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-tv-brand" style={{ fontWeight: 600 }}>
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  );
}

/* ── Re-export PRESET_TAGS for backward compat ─────────────────────────────── */
export { PRESET_TAGS as CAMPAIGN_TAGS };
