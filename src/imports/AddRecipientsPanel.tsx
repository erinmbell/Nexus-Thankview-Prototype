/**
 * AddRecipientsPanel — self-contained, container-responsive component that
 * packages the full "choose recipients" workflow:
 *
 *   ┌─────────────────────┬─────────────────────────┐
 *   │  Added Recipients   │   RecipientPickerInline  │
 *   │  (list + search     │   (Lists / Saved Search  │
 *   │   + select/remove)  │    / Browse + filters)   │
 *   └─────────────────────┴─────────────────────────┘
 *
 * Usage:
 *   <AddRecipientsPanel
 *     onRecipientsChange={setRecipients}      // called whenever the list changes
 *     onDone={handleDone}                     // "Done" button callback (optional)
 *     initialContacts={[]}                    // seed with existing contacts (optional)
 *     doneLabel="Continue"                    // customise the Done button label
 *     showDone                                // show the Done footer button
 *     className="h-[600px]"                   // size it via the container
 *   />
 *
 * All sizing is relative — the component fills its parent and uses flex-based
 * proportions so it works inside modals, drawers, full-page layouts, etc.
 */
import { useState, useCallback, useMemo } from "react";
import {
  Search, X, Check, Trash2, Users, Minus, User,
} from "lucide-react";
import {
  RecipientPickerInline,
  type PickableContact,
  type MergeFields,
} from "./RecipientSourcePicker";

// ── Re-export for convenience ────────────────────────────────────────────────
export type { PickableContact, MergeFields };

// ── Recipient shape used by the parent ──────────────────────────────────────
export interface RecipientEntry {
  id: number;
  name: string;
  email: string;
  group: string;
  tags: string[];
  givingLevel: string;
  mergeFields: MergeFields;
}

function toEntry(c: PickableContact): RecipientEntry {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    group: c.group,
    tags: c.tags,
    givingLevel: c.givingLevel,
    mergeFields: c.mergeFields,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
//  Props
// ═════════════════════════════════════════════════════════════════════════════
export interface AddRecipientsPanelProps {
  /** Called whenever the recipient list changes (add / remove). */
  onRecipientsChange?: (recipients: RecipientEntry[]) => void;
  /** Optional "Done" callback — if provided the footer Done button appears. */
  onDone?: (recipients: RecipientEntry[]) => void;
  /** Label for the Done button. Defaults to "Done". */
  doneLabel?: string;
  /** Show the Done footer bar. Defaults to `true` when `onDone` is provided. */
  showDone?: boolean;
  /** Seed contacts so the panel opens pre-populated. */
  initialContacts?: RecipientEntry[];
  /** Extra classes on the outermost wrapper (use to set height/width). */
  className?: string;
}

// ═════════════════════════════════════════════════════════════════════════════
//  Component
// ═════════════════════════════════════════════════════════════════════════════
export function AddRecipientsPanel({
  onRecipientsChange,
  onDone,
  doneLabel = "Done",
  showDone,
  initialContacts = [],
  className = "",
}: AddRecipientsPanelProps) {
  const [contacts, setContacts] = useState<RecipientEntry[]>(initialContacts);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [visibleCount, setVisibleCount] = useState(50);

  const shouldShowDone = showDone ?? !!onDone;

  // ── Helpers to keep parent in sync ────────────────────────────────────────
  const updateContacts = useCallback(
    (next: RecipientEntry[]) => {
      setContacts(next);
      onRecipientsChange?.(next);
    },
    [onRecipientsChange],
  );

  // ── Existing IDs for the picker ───────────────────────────────────────────
  const existingIds = useMemo(() => new Set(contacts.map(c => c.id)), [contacts]);

  // ── Add from picker ───────────────────────────────────────────────────────
  const handleAdd = useCallback(
    (picked: PickableContact[]) => {
      const newEntries = picked.map(toEntry);
      setContacts(prev => {
        const existing = new Set(prev.map(c => c.id));
        const deduped = newEntries.filter(c => !existing.has(c.id));
        const merged = [...prev, ...deduped].sort((a, b) =>
          a.name.localeCompare(b.name),
        );
        onRecipientsChange?.(merged);
        return merged;
      });
    },
    [onRecipientsChange],
  );

  // ── Remove helpers ────────────────────────────────────────────────────────
  const removeContact = useCallback(
    (id: number) => {
      setContacts(prev => {
        const next = prev.filter(c => c.id !== id);
        onRecipientsChange?.(next);
        return next;
      });
      setSelectedIds(prev => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    },
    [onRecipientsChange],
  );

  const removeSelected = useCallback(() => {
    setContacts(prev => {
      const next = prev.filter(c => !selectedIds.has(c.id));
      onRecipientsChange?.(next);
      return next;
    });
    setSelectedIds(new Set());
  }, [selectedIds, onRecipientsChange]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const total = contacts.length;

  const filtered = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.toLowerCase();
    return contacts.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q),
    );
  }, [contacts, search]);

  // ── Selection ─────────────────────────────────────────────────────────────
  const toggleSelect = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === total) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contacts.map(c => c.id)));
    }
  }, [selectedIds, contacts, total]);

  const isAllSelected = selectedIds.size === total && total > 0;

  return (
    <div className={`flex flex-col min-h-0 ${className}`}>
      {/* ══ Two-panel body ══ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Left: Added Recipients ── */}
        <div className="w-2/5 min-w-[220px] max-w-[360px] shrink-0 border-r border-tv-border-divider flex flex-col bg-white">
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-tv-border-divider shrink-0 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {total > 0 && (
                  <button
                    onClick={toggleSelectAll}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isAllSelected
                        ? "bg-tv-brand-bg border-tv-brand-bg"
                        : selectedIds.size > 0
                          ? "bg-tv-brand-bg/50 border-tv-brand-bg"
                          : "border-tv-border-light hover:border-tv-border-strong"
                    }`}
                    aria-label={isAllSelected ? "Deselect all" : "Select all"}
                  >
                    {isAllSelected ? (
                      <Check size={9} className="text-white" />
                    ) : selectedIds.size > 0 ? (
                      <Minus size={9} className="text-white" />
                    ) : null}
                  </button>
                )}
                <span className="text-[12px] font-semibold text-tv-text-primary">
                  Recipients ({total})
                </span>
              </div>
              {selectedIds.size > 0 && (
                <span className="text-[10px] text-tv-text-decorative">
                  {selectedIds.size} selected
                </span>
              )}
            </div>

            {total > 0 && (
              <div className="relative">
                <Search
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tv-text-decorative"
                />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name or email…"
                  className="w-full pl-7 pr-3 py-2 border border-tv-border-light rounded-sm text-[11px] outline-none focus:ring-2 focus:ring-tv-brand-bg/30"
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
            )}
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {total === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-tv-surface flex items-center justify-center mb-3">
                  <Users size={20} className="text-tv-text-decorative" />
                </div>
                <p className="text-[12px] font-semibold text-tv-text-primary mb-1">
                  No recipients yet
                </p>
                <p className="text-[10px] text-tv-text-secondary">
                  Use the picker on the right to add recipients from lists,
                  saved searches, or browse individually.
                </p>
              </div>
            ) : (<>
              {/* Count summary */}
              {filtered.length > 50 && (
                <div className="px-4 py-2 bg-tv-surface/50 border-b border-tv-border-divider">
                  <p className="text-[10px] text-tv-text-secondary">
                    Showing <span className="font-semibold text-tv-text-primary">{Math.min(visibleCount, filtered.length)}</span> of {filtered.length} recipients
                  </p>
                </div>
              )}
              {filtered.slice(0, visibleCount).map(c => {
                const isSelected = selectedIds.has(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => toggleSelect(c.id)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 border-b border-tv-border-divider cursor-pointer transition-colors group ${
                      isSelected ? "bg-tv-brand-tint/40" : "hover:bg-tv-surface"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? "bg-tv-brand-bg border-tv-brand-bg"
                          : "border-tv-border-light group-hover:border-tv-border-strong"
                      }`}
                    >
                      {isSelected && (
                        <Check size={9} className="text-white" />
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-[11px] font-medium truncate ${
                          isSelected
                            ? "text-tv-brand"
                            : "text-tv-text-primary"
                        }`}
                      >
                        {c.name}
                      </p>
                      <p className="text-[10px] text-tv-text-secondary truncate">
                        {c.email}
                      </p>
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        removeContact(c.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity p-0.5 shrink-0"
                      title="Remove recipient"
                      aria-label={`Remove ${c.name}`}
                    >
                      <X
                        size={10}
                        className="text-tv-text-decorative hover:text-tv-danger"
                      />
                    </button>
                  </div>
                );
              })}
              {visibleCount < filtered.length && (
                <button onClick={() => setVisibleCount(v => v + 50)}
                  className="w-full py-2.5 text-[11px] text-tv-brand hover:bg-tv-brand-tint/30 transition-colors" style={{ fontWeight: 600 }}>
                  Load more ({filtered.length - visibleCount} remaining)
                </button>
              )}
            </>)}
          </div>

          {/* Bottom actions */}
          {selectedIds.size > 0 && (
            <div className="px-4 py-3 border-t border-tv-border-divider shrink-0 bg-white">
              <button
                onClick={removeSelected}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-semibold text-tv-danger border border-tv-danger-border hover:bg-tv-danger-bg transition-colors"
                aria-label={`Remove ${selectedIds.size} selected recipients`}
              >
                <Trash2 size={11} />
                Remove Selected ({selectedIds.size})
              </button>
            </div>
          )}
        </div>

        {/* ── Right: Recipient Picker ── */}
        <div className="flex-1 min-w-0 overflow-hidden bg-tv-surface-muted flex flex-col">
          <RecipientPickerInline
            existingIds={existingIds}
            onAdd={handleAdd}
          />
        </div>
      </div>

      {/* ══ Footer (optional) ══ */}
      {shouldShowDone && (
        null
      )}
    </div>
  );
}
