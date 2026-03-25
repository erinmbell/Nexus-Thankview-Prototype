/**
 * RecipientSourcePicker — right-hand panel of the AddRecipientsPanel.
 *
 * Three tabs:
 *   1. Lists        — import all contacts from a saved list
 *   2. Saved Search — import all contacts matching a saved search
 *   3. Browse       — individual constituent picker with search & filters
 *
 * Consumed exclusively by AddRecipientsPanel.
 */
import { useState, useMemo, useCallback } from "react";
import {
  Search, X, Check, Filter,
  Users, ChevronRight, ListFilter, Tag, Landmark,
  Plus,
} from "lucide-react";
import { INIT_CONTACTS, buildMergeFields } from "../app/data/contacts";

// ── Exported types ──────────────────────────────────────────────────────────
export type MergeFields = Record<string, string>;

export interface PickableContact {
  id: number;
  name: string;
  email: string;
  group: string;
  tags: string[];
  givingLevel: string;
  mergeFields: MergeFields;
}

// ── Convert shared contacts → PickableContact ───────────────────────────────
const ALL_PICKABLE: PickableContact[] = INIT_CONTACTS
  .filter(c => c.emailStatus === "valid")
  .map(c => ({
    id: c.id,
    name: `${c.first} ${c.last}`,
    email: c.email,
    group: c.affiliation || "Unaffiliated",
    tags: c.tags,
    givingLevel: c.givingLevel,
    mergeFields: buildMergeFields(c),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

// ── Saved lists & searches (demo data) ──────────────────────────────────────
const SAVED_LISTS = [
  { id: 1, name: "Spring Gala Invitees", count: 10, contactIds: [1, 5, 8, 11, 13, 17, 19, 23, 28, 32] },
  { id: 2, name: "Major Donors - Q1 Outreach", count: 10, contactIds: [1, 5, 8, 11, 13, 19, 23, 28, 32, 37] },
  { id: 3, name: "Alumni Phonathon 2025", count: 12, contactIds: [2, 9, 12, 14, 15, 20, 22, 25, 27, 29, 31, 33] },
  { id: 4, name: "Board Members", count: 5, contactIds: [4, 13, 17, 30, 34] },
  { id: 5, name: "New Donor Welcome", count: 5, contactIds: [3, 9, 15, 25, 35] },
  { id: 6, name: "Scholarship Recipients", count: 6, contactIds: [6, 10, 18, 24, 36, 38] },
  { id: 7, name: "Faculty & Staff Appreciation", count: 4, contactIds: [7, 16, 21, 26] },
];

const SAVED_SEARCHES = [
  { id: 1, name: "Boston-Area Major Donors", description: "Donors in MA with $10k+ total giving", contactIds: [1, 5, 11, 39] },
  { id: 2, name: "Lapsed Donors > 2 Years", description: "No gift in 24+ months", contactIds: [14, 22, 27, 33, 36] },
  { id: 3, name: "High Video Engagement", description: "Video score above 70", contactIds: [1, 4, 5, 11, 13, 17, 39] },
  { id: 4, name: "Recent First-Time Donors", description: "First gift in last 90 days", contactIds: [9, 15, 25, 35] },
  { id: 5, name: "Leadership Circle Members", description: "Giving level: Leadership Circle", contactIds: [1, 4, 11, 13, 39] },
];

const ALL_TAGS = Array.from(new Set(ALL_PICKABLE.flatMap(c => c.tags))).sort();
const ALL_GIVING_LEVELS = Array.from(new Set(ALL_PICKABLE.map(c => c.givingLevel))).sort();

// ── Tab type ────────────────────────────────────────────────────────────────
type Tab = "lists" | "searches" | "browse";

// ═════════════════════════════════════════════════════════════════════════════
//  Props
// ═════════════════════════════════════════════════════════════════════════════
export interface RecipientPickerInlineProps {
  /** IDs already in the recipient list (to grey-out / label "Added"). */
  existingIds: Set<number>;
  /** Called when the user selects contacts to add. */
  onAdd: (picked: PickableContact[]) => void;
}

// ═════════════════════════════════════════════════════════════════════════════
//  Component
// ═════════════════════════════════════════════════════════════════════════════
export function RecipientPickerInline({ existingIds, onAdd }: RecipientPickerInlineProps) {
  const [tab, setTab] = useState<Tab>("lists");
  const [search, setSearch] = useState("");
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterGiving, setFilterGiving] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [browseSelected, setBrowseSelected] = useState<Set<number>>(new Set());

  // ── Browse: filtered contacts ──────────────────────────────────────────
  const browseContacts = useMemo(() => {
    let result = ALL_PICKABLE;
    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.tags.some(t => t.toLowerCase().includes(q)),
      );
    }
    if (filterTags.length > 0) {
      result = result.filter(c => filterTags.some(t => c.tags.includes(t)));
    }
    if (filterGiving.length > 0) {
      result = result.filter(c => filterGiving.includes(c.givingLevel));
    }
    return result;
  }, [search, filterTags, filterGiving]);

  // ── List helpers ───────────────────────────────────────────────────────
  const addFromList = useCallback(
    (contactIds: number[]) => {
      const picked = ALL_PICKABLE.filter(
        c => contactIds.includes(c.id) && !existingIds.has(c.id),
      );
      if (picked.length > 0) onAdd(picked);
    },
    [existingIds, onAdd],
  );

  const addSingle = useCallback(
    (c: PickableContact) => {
      if (!existingIds.has(c.id)) onAdd([c]);
    },
    [existingIds, onAdd],
  );

  const addAll = useCallback(() => {
    const picked = browseContacts.filter(c => !existingIds.has(c.id));
    if (picked.length > 0) onAdd(picked);
    setBrowseSelected(new Set());
  }, [browseContacts, existingIds, onAdd]);

  const addSelected = useCallback(() => {
    const picked = ALL_PICKABLE.filter(c => browseSelected.has(c.id) && !existingIds.has(c.id));
    if (picked.length > 0) onAdd(picked);
    setBrowseSelected(new Set());
  }, [browseSelected, existingIds, onAdd]);

  const toggleBrowseSelect = useCallback((id: number) => {
    setBrowseSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const addableInBrowse = useMemo(
    () => browseContacts.filter(c => !existingIds.has(c.id)),
    [browseContacts, existingIds],
  );

  const toggleBrowseSelectAll = useCallback(() => {
    const addableIds = addableInBrowse.map(c => c.id);
    const allSelected = addableIds.length > 0 && addableIds.every(id => browseSelected.has(id));
    if (allSelected) {
      setBrowseSelected(prev => {
        const next = new Set(prev);
        addableIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setBrowseSelected(prev => {
        const next = new Set(prev);
        addableIds.forEach(id => next.add(id));
        return next;
      });
    }
  }, [addableInBrowse, browseSelected]);

  const browseAllSelected = addableInBrowse.length > 0 && addableInBrowse.every(c => browseSelected.has(c.id));
  const browseSomeSelected = addableInBrowse.some(c => browseSelected.has(c.id));
  const browseSelectedCount = [...browseSelected].filter(id => !existingIds.has(id)).length;

  // ── How many new from a list? ──────────────────────────────────────────
  const newCount = (ids: number[]) =>
    ids.filter(id => !existingIds.has(id) && ALL_PICKABLE.some(c => c.id === id)).length;

  // ── Tab button ─────────────────────────────────────────────────────────
  const TabBtn = ({
    t,
    icon,
    label,
  }: {
    t: Tab;
    icon: React.ReactNode;
    label: string;
  }) => (
    <button
      onClick={() => setTab(t)}
      className={`flex items-center gap-1.5 px-3 py-2 text-[11px] transition-colors rounded-sm ${
        tab === t
          ? "bg-tv-brand-tint text-tv-brand font-semibold"
          : "text-tv-text-secondary hover:bg-tv-surface font-medium"
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Tab bar ── */}
      <div className="flex items-center gap-1 px-4 pt-4 pb-3 border-b border-tv-border-divider shrink-0">
        <TabBtn t="lists" icon={<Users size={13} />} label="Lists" />
        <TabBtn t="searches" icon={<Filter size={13} />} label="Saved Searches" />
        <TabBtn t="browse" icon={<Users size={13} />} label="Browse" />
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* ════════════════════════ Lists ════════════════════════ */}
        {tab === "lists" && (
          <div className="p-4 space-y-2">
            <p className="text-[10px] font-semibold text-tv-text-secondary uppercase tracking-wider mb-3">
              Import from Saved List
            </p>
            {SAVED_LISTS.map(l => {
              const addable = newCount(l.contactIds);
              return (
                <button
                  key={l.id}
                  onClick={() => addFromList(l.contactIds)}
                  disabled={addable === 0}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-md border border-tv-border-light bg-white text-left transition-all hover:shadow-sm hover:border-tv-border-strong disabled:opacity-40 disabled:cursor-not-allowed group"
                >
                  <div className="w-8 h-8 rounded-sm bg-tv-brand-tint flex items-center justify-center shrink-0">
                    <Users size={14} className="text-tv-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-tv-text-primary truncate">
                      {l.name}
                    </p>
                    <p className="text-[10px] text-tv-text-secondary">
                      {l.count} constituents{" "}
                      {addable > 0 && addable < l.count && (
                        <span className="text-tv-brand font-medium">
                          ({addable} new)
                        </span>
                      )}
                      {addable === 0 && (
                        <span className="text-tv-text-decorative">
                          (all already added)
                        </span>
                      )}
                    </p>
                  </div>
                  {addable > 0 && (
                    <div className="w-6 h-6 rounded-full bg-tv-brand-tint flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity shrink-0">
                      <Plus size={12} className="text-tv-brand" />
                    </div>
                  )}
                  <ChevronRight
                    size={12}
                    className="text-tv-text-decorative shrink-0"
                  />
                </button>
              );
            })}
          </div>
        )}

        {/* ════════════════════════ Saved Searches ════════════════════════ */}
        {tab === "searches" && (
          <div className="p-4 space-y-2">
            <p className="text-[10px] font-semibold text-tv-text-secondary uppercase tracking-wider mb-3">
              Import from Saved Search
            </p>
            {SAVED_SEARCHES.map(s => {
              const addable = newCount(s.contactIds);
              return (
                <button
                  key={s.id}
                  onClick={() => addFromList(s.contactIds)}
                  disabled={addable === 0}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-md border border-tv-border-light bg-white text-left transition-all hover:shadow-sm hover:border-tv-border-strong disabled:opacity-40 disabled:cursor-not-allowed group"
                >
                  <div className="w-8 h-8 rounded-sm bg-amber-50 flex items-center justify-center shrink-0">
                    <Filter size={14} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-tv-text-primary truncate">
                      {s.name}
                    </p>
                    <p className="text-[10px] text-tv-text-secondary truncate">
                      {s.description}
                      {addable > 0 && (
                        <span className="text-tv-brand font-medium ml-1">
                          ({addable} new)
                        </span>
                      )}
                      {addable === 0 && (
                        <span className="text-tv-text-decorative ml-1">
                          (all added)
                        </span>
                      )}
                    </p>
                  </div>
                  {addable > 0 && (
                    <div className="w-6 h-6 rounded-full bg-amber-50 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity shrink-0">
                      <Plus size={12} className="text-amber-600" />
                    </div>
                  )}
                  <ChevronRight
                    size={12}
                    className="text-tv-text-decorative shrink-0"
                  />
                </button>
              );
            })}
          </div>
        )}

        {/* ════════════════════════ Browse ════════════════════════ */}
        {tab === "browse" && (
          <div className="flex flex-col h-full min-h-0">
            {/* Search + filter bar */}
            <div className="px-4 pt-3 pb-2 space-y-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search
                    size={12}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tv-text-decorative"
                  />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name, email, or tag..."
                    className="w-full pl-7 pr-7 py-2 border border-tv-border-light rounded-sm text-[11px] outline-none focus:ring-2 focus:ring-tv-brand-bg/30 bg-white"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5"
                    >
                      <X size={10} className="text-tv-text-secondary" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`w-8 h-8 rounded-sm flex items-center justify-center transition-colors shrink-0 border ${
                    filterTags.length > 0 || filterGiving.length > 0
                      ? "bg-tv-brand-tint border-tv-brand text-tv-brand"
                      : "border-tv-border-light text-tv-text-secondary hover:bg-tv-surface"
                  }`}
                >
                  <ListFilter size={13} />
                </button>
              </div>

              {/* Filter chips */}
              {showFilters && (
                <div className="space-y-2 p-2.5 rounded-md bg-white border border-tv-border-light">
                  <div>
                    <p className="text-[9px] font-bold text-tv-text-secondary uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Tag size={9} />
                      Tags
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {ALL_TAGS.map(t => (
                        <button
                          key={t}
                          onClick={() =>
                            setFilterTags(prev =>
                              prev.includes(t)
                                ? prev.filter(x => x !== t)
                                : [...prev, t],
                            )
                          }
                          className={`px-2 py-0.5 rounded-full text-[10px] transition-all border ${
                            filterTags.includes(t)
                              ? "bg-tv-brand-tint border-tv-brand text-tv-brand font-semibold"
                              : "bg-white border-tv-border-light text-tv-text-secondary"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-tv-text-secondary uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Landmark size={9} />
                      Giving Level
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {ALL_GIVING_LEVELS.map(g => (
                        <button
                          key={g}
                          onClick={() =>
                            setFilterGiving(prev =>
                              prev.includes(g)
                                ? prev.filter(x => x !== g)
                                : [...prev, g],
                            )
                          }
                          className={`px-2 py-0.5 rounded-full text-[10px] transition-all border ${
                            filterGiving.includes(g)
                              ? "bg-emerald-50 border-emerald-400 text-emerald-700 font-semibold"
                              : "bg-white border-tv-border-light text-tv-text-secondary"
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  {(filterTags.length > 0 || filterGiving.length > 0) && (
                    <button
                      onClick={() => {
                        setFilterTags([]);
                        setFilterGiving([]);
                      }}
                      className="text-[10px] font-medium text-tv-brand hover:underline"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              )}

              {/* Active filter chips (collapsed) */}
              {(filterTags.length > 0 || filterGiving.length > 0) &&
                !showFilters && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {filterTags.map(t => (
                      <span
                        key={t}
                        className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-tv-brand-tint text-tv-brand"
                      >
                        {t}
                        <button
                          onClick={() =>
                            setFilterTags(prev =>
                              prev.filter(x => x !== t),
                            )
                          }
                        >
                          <X size={7} />
                        </button>
                      </span>
                    ))}
                    {filterGiving.map(g => (
                      <span
                        key={g}
                        className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-emerald-50 text-emerald-700"
                      >
                        {g}
                        <button
                          onClick={() =>
                            setFilterGiving(prev =>
                              prev.filter(x => x !== g),
                            )
                          }
                        >
                          <X size={7} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

              {/* Add all bar */}
              {addableInBrowse.length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleBrowseSelectAll}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        browseAllSelected
                          ? "bg-tv-brand-bg border-tv-brand-bg"
                          : browseSomeSelected
                            ? "bg-tv-brand-bg/50 border-tv-brand-bg"
                            : "border-tv-border-light hover:border-tv-border-strong"
                      }`}
                      aria-label={browseAllSelected ? "Deselect all" : "Select all"}
                    >
                      {browseAllSelected ? (
                        <Check size={9} className="text-white" />
                      ) : browseSomeSelected ? (
                        <span className="block w-1.5 h-0.5 bg-white rounded-full" />
                      ) : null}
                    </button>
                    <span className="text-[10px] text-tv-text-secondary">
                      {browseContacts.length} result
                      {browseContacts.length !== 1 ? "s" : ""}
                      {addableInBrowse.length < browseContacts.length && (
                        <span className="text-tv-text-decorative">
                          {" "}({addableInBrowse.length} addable)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {browseSelectedCount > 0 && (
                      <button
                        onClick={addSelected}
                        className="text-[10px] font-semibold text-white bg-tv-brand-bg hover:bg-tv-brand-bg/90 px-2.5 py-1 rounded-[6px] flex items-center gap-1 transition-colors"
                      >
                        <Plus size={9} />
                        Add {browseSelectedCount} Selected
                      </button>
                    )}
                    <button
                      onClick={addAll}
                      className="text-[10px] font-semibold text-tv-brand hover:underline flex items-center gap-1"
                    >
                      <Plus size={10} />
                      Add All
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Contact rows */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {browseContacts.map(c => {
                const isAdded = existingIds.has(c.id);
                const isChecked = browseSelected.has(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => isAdded ? undefined : toggleBrowseSelect(c.id)}
                    disabled={isAdded}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors border-b border-tv-border-divider group ${
                      isAdded
                        ? "opacity-40 cursor-not-allowed bg-tv-surface/50"
                        : isChecked
                          ? "bg-tv-brand-tint/40"
                          : "hover:bg-white cursor-pointer"
                    }`}
                  >
                    {/* Checkbox */}
                    {!isAdded && (
                      <span
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isChecked
                            ? "bg-tv-brand-bg border-tv-brand-bg"
                            : "border-tv-border-light group-hover:border-tv-border-strong"
                        }`}
                      >
                        {isChecked && <Check size={9} className="text-white" />}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] font-medium truncate ${isChecked ? "text-tv-brand" : "text-tv-text-primary"}`}>
                        {c.name}
                      </p>
                      <p className="text-[10px] text-tv-text-secondary truncate">
                        {c.email}
                      </p>
                    </div>
                    {c.tags.length > 0 && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-tv-surface text-tv-text-secondary shrink-0">
                        {c.tags[0]}
                      </span>
                    )}
                    {isAdded ? (
                      <span className="text-[9px] font-semibold text-tv-text-decorative shrink-0 flex items-center gap-0.5">
                        <Check size={9} />
                        Added
                      </span>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-tv-brand-tint flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity shrink-0">
                        <Plus size={12} className="text-tv-brand" />
                      </div>
                    )}
                  </button>
                );
              })}
              {browseContacts.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-[11px] text-tv-text-secondary">
                    {search
                      ? `No constituents match "${search}"`
                      : "No constituents match the current filters."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}