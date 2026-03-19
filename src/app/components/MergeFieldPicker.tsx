/**
 * MergeFieldPicker — A searchable, categorised merge-field picker panel.
 *
 * Supports 100+ fields across 10 categories with:
 *  - Instant fuzzy search across labels, tokens, and examples
 *  - Collapsible category accordion with field counts
 *  - Recently-used section (persisted in localStorage)
 *  - Favorite / pinned fields (persisted in localStorage)
 *  - Click-to-insert with visual confirmation toast
 *  - Example preview for each field
 *  - Compact mode for drawer / toolbar popover use
 */
import { useState, useMemo, useCallback, useEffect, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import {
  Search, Star, Clock, ChevronDown, X, Copy, Check,
  User, MapPin, DollarSign, GraduationCap, Briefcase, Users,
  Calendar, Send, Settings, Puzzle, ChevronRight,
} from "lucide-react";
import { PillSearchInput } from "./PillSearchInput";
import { MERGE_FIELD_CATEGORIES, type MergeFieldDef, type MergeFieldCategory } from "../pages/campaign/types";

// ── Icon map ────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, any> = {
  User, MapPin, DollarSign, GraduationCap, Briefcase, Users,
  Calendar, Send, Settings, Puzzle,
};

function CategoryIcon({ name, size = 13 }: { name: string; size?: number }) {
  const Icon = ICON_MAP[name] || Settings;
  return <Icon size={size} />;
}

// ── localStorage helpers ────────────────────────────────────────────────────
const LS_RECENT = "tv-merge-recent";
const LS_FAVS   = "tv-merge-favs";
const MAX_RECENT = 8;

function loadList(key: string): string[] {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); }
  catch { return []; }
}
function saveList(key: string, list: string[]) {
  try { localStorage.setItem(key, JSON.stringify(list)); } catch {/* */}
}

// ── Component ───────────────────────────────────────────────────────────────
export interface MergeFieldPickerProps {
  onInsert: (token: string) => void;
  onClose: () => void;
  compact?: boolean;
  extraFields?: MergeFieldDef[];
  inline?: boolean;
}

export function MergeFieldPicker({
  onInsert,
  onClose,
  compact = false,
  extraFields,
  inline = false,
}: MergeFieldPickerProps) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [recent, setRecent] = useState<string[]>(() => loadList(LS_RECENT));
  const [favs, setFavs] = useState<Set<string>>(() => new Set(loadList(LS_FAVS)));
  const [justInserted, setJustInserted] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => { searchRef.current?.focus(); }, []);

  useLayoutEffect(() => {
    if (inline) return;
    const anchor = anchorRef.current;
    if (!anchor) return;
    const triggerEl = anchor.parentElement;
    if (!triggerEl) return;
    const rect = triggerEl.getBoundingClientRect();
    const panelW = compact ? 320 : 380;
    let top = rect.bottom + 6;
    let left = rect.left;
    if (left + panelW > window.innerWidth - 8) left = window.innerWidth - panelW - 8;
    const panelMaxH = compact ? 400 : 520;
    const headerFooterH = 140;
    const estimatedH = Math.min(panelMaxH + headerFooterH, 560);
    if (top + estimatedH > window.innerHeight - 8) top = Math.max(8, rect.top - estimatedH - 6);
    setPos({ top, left });
  }, [inline, compact]);

  useEffect(() => {
    if (inline) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, inline]);

  const categories = useMemo<MergeFieldCategory[]>(() => {
    if (!extraFields || extraFields.length === 0) return MERGE_FIELD_CATEGORIES;
    return [
      { id: "extra", label: "Special Fields", icon: "Star", fields: extraFields },
      ...MERGE_FIELD_CATEGORIES,
    ];
  }, [extraFields]);

  const allFields = useMemo(
    () => categories.flatMap(c => c.fields.map(f => ({ ...f, categoryId: c.id, categoryLabel: c.label }))),
    [categories]
  );

  const totalFields = allFields.length;

  const q = search.toLowerCase().trim();
  const filteredFields = useMemo(() => {
    if (!q) return null;
    return allFields.filter(
      f =>
        f.label.toLowerCase().includes(q) ||
        f.token.toLowerCase().includes(q) ||
        f.example.toLowerCase().includes(q)
    );
  }, [q, allFields]);

  const favFields = useMemo(
    () => allFields.filter(f => favs.has(f.token)),
    [allFields, favs]
  );

  const recentFields = useMemo(
    () => recent.map(token => allFields.find(f => f.token === token)).filter(Boolean) as typeof allFields,
    [recent, allFields]
  );

  const handleInsert = useCallback(
    (token: string) => {
      onInsert(token);
      setRecent(prev => {
        const next = [token, ...prev.filter(t => t !== token)].slice(0, MAX_RECENT);
        saveList(LS_RECENT, next);
        return next;
      });
      onClose();
    },
    [onInsert, onClose]
  );

  const toggleFav = useCallback((token: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavs(prev => {
      const next = new Set(prev);
      if (next.has(token)) next.delete(token);
      else next.add(token);
      saveList(LS_FAVS, [...next]);
      return next;
    });
  }, []);

  const toggleCategory = useCallback((id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isSearching = filteredFields !== null;

  const FieldRow = ({ field, showCategory }: { field: typeof allFields[number]; showCategory?: boolean }) => {
    const isInserted = justInserted === field.token;
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => handleInsert(field.token)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleInsert(field.token); } }}
        className={`w-full text-left group/row flex items-center gap-2 px-3 ${compact ? "py-1.5" : "py-2"} rounded-sm transition-all cursor-pointer ${
          isInserted ? "bg-tv-success-bg" : "hover:bg-tv-brand-tint"
        }`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`${compact ? "text-[11px]" : "text-[12px]"} text-tv-text-primary truncate`} style={{ fontWeight: 600 }}>
              {field.label}
            </span>
            {isInserted && <Check size={11} className="text-tv-success shrink-0" />}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <code className={`${compact ? "text-[9px]" : "text-[10px]"} text-tv-brand font-mono bg-tv-brand-tint px-1 py-0 rounded`}>
              {field.token}
            </code>
            <span className={`${compact ? "text-[9px]" : "text-[10px]"} text-tv-text-decorative truncate`}>
              {field.example}
            </span>
          </div>
          {showCategory && "categoryLabel" in field && (
            <span className="text-[9px] text-tv-text-decorative mt-0.5 block">
              {(field as any).categoryLabel}
            </span>
          )}
        </div>
        <button
          onClick={(e) => toggleFav(field.token, e)}
          className={`shrink-0 p-0.5 rounded transition-all ${
            favs.has(field.token)
              ? "text-tv-star"
              : "text-tv-text-decorative opacity-0 group-hover/row:opacity-100"
          }`}
          aria-label={favs.has(field.token) ? "Remove from favorites" : "Add to favorites"}
        >
          <Star size={11} fill={favs.has(field.token) ? "currentColor" : "none"} />
        </button>
      </div>
    );
  };

  const panelW = compact ? "w-[320px]" : "w-[380px]";
  const panelH = compact ? "max-h-[400px]" : "max-h-[520px]";

  const panelContent = (
    <div
      ref={panelRef}
      className={`${panelW} bg-white rounded-md border border-tv-border-light shadow-xl flex flex-col overflow-hidden ${inline ? "" : "fixed z-[9999]"}`}
      style={inline ? {} : (pos ? { top: pos.top, left: pos.left } : { visibility: "hidden" as const })}
    >
      <div className={`${compact ? "px-3 py-2.5" : "px-4 py-3"} border-b border-tv-border-divider bg-tv-surface-muted`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className={`${compact ? "text-[12px]" : "text-[13px]"} text-tv-text-primary`} style={{ fontWeight: 700 }}>
              Merge Fields
            </span>
            <span className="text-[10px] text-tv-text-decorative bg-tv-surface border border-tv-border-divider rounded-full px-1.5 py-0">
              {totalFields}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-tv-text-secondary hover:text-tv-text-primary hover:bg-tv-surface transition-colors"
            aria-label="Close merge field picker"
          >
            <X size={14} />
          </button>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tv-text-decorative pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search fields by name, token, or example..."
            className={`w-full pl-8 pr-8 ${compact ? "py-1.5 text-[11px]" : "py-2 text-[12px]"} border border-tv-border-light rounded-full bg-white outline-none focus:ring-2 focus:ring-tv-brand/30 focus:border-tv-brand transition-all placeholder:text-tv-text-decorative`}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-tv-text-decorative hover:text-tv-text-primary"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      <div className={`${panelH} overflow-y-auto ${compact ? "px-1.5 py-1.5" : "px-2 py-2"}`}>
        {isSearching ? (
          filteredFields.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2">
              <Search size={20} className="text-tv-text-decorative" />
              <p className="text-[12px] text-tv-text-secondary" style={{ fontWeight: 600 }}>No fields match "{search}"</p>
              <p className="text-[10px] text-tv-text-decorative text-center">Try searching by label, token name, or example value.</p>
            </div>
          ) : (
            <div>
              <p className={`${compact ? "text-[9px]" : "text-[10px]"} text-tv-text-decorative px-3 py-1`}>
                {filteredFields.length} result{filteredFields.length !== 1 ? "s" : ""}
              </p>
              {filteredFields.map(f => (
                <FieldRow key={f.token} field={f} showCategory />
              ))}
            </div>
          )
        ) : (
          <>
            {favFields.length > 0 && (
              <div className="mb-1">
                <div className={`flex items-center gap-1.5 px-3 ${compact ? "py-1" : "py-1.5"}`}>
                  <Star size={11} className="text-tv-star" fill="currentColor" />
                  <span className={`${compact ? "text-[10px]" : "text-[11px]"} text-tv-text-label`} style={{ fontWeight: 600 }}>
                    Favorites
                  </span>
                  <span className="text-[9px] text-tv-text-decorative">({favFields.length})</span>
                </div>
                {favFields.map(f => (
                  <FieldRow key={`fav-${f.token}`} field={f} />
                ))}
                <div className="mx-3 my-1 border-b border-tv-border-divider" />
              </div>
            )}

            {recentFields.length > 0 && (
              <div className="mb-1">
                <div className={`flex items-center gap-1.5 px-3 ${compact ? "py-1" : "py-1.5"}`}>
                  <Clock size={11} className="text-tv-text-decorative" />
                  <span className={`${compact ? "text-[10px]" : "text-[11px]"} text-tv-text-label`} style={{ fontWeight: 600 }}>
                    Recently Used
                  </span>
                </div>
                {recentFields.map(f => (
                  <FieldRow key={`recent-${f.token}`} field={f} />
                ))}
                <div className="mx-3 my-1 border-b border-tv-border-divider" />
              </div>
            )}

            {categories.map(cat => {
              const isOpen = expanded.has(cat.id);
              return (
                <div key={cat.id} className="mb-0.5">
                  <button
                    onClick={() => toggleCategory(cat.id)}
                    className={`w-full flex items-center gap-2 px-3 ${compact ? "py-1.5" : "py-2"} rounded-sm hover:bg-tv-surface transition-colors text-left`}
                  >
                    <div className={`w-5 h-5 rounded-[5px] flex items-center justify-center shrink-0 ${
                      isOpen ? "bg-tv-brand-tint text-tv-brand" : "bg-tv-surface text-tv-text-decorative"
                    }`}>
                      <CategoryIcon name={cat.icon} size={11} />
                    </div>
                    <span className={`${compact ? "text-[11px]" : "text-[12px]"} text-tv-text-primary flex-1`} style={{ fontWeight: 600 }}>
                      {cat.label}
                    </span>
                    <span className="text-[9px] text-tv-text-decorative mr-1">{cat.fields.length}</span>
                    {isOpen
                      ? <ChevronDown size={12} className="text-tv-text-decorative shrink-0" />
                      : <ChevronRight size={12} className="text-tv-text-decorative shrink-0" />
                    }
                  </button>
                  {isOpen && (
                    <div className="ml-2 border-l-2 border-tv-border-divider pl-1 mb-1">
                      {cat.fields.map(f => (
                        <FieldRow key={f.token} field={{ ...f, categoryId: cat.id, categoryLabel: cat.label }} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      <div className={`${compact ? "px-3 py-1.5" : "px-4 py-2"} border-t border-tv-border-divider bg-tv-surface-muted`}>
        <p className="text-[9px] text-tv-text-decorative text-center">
          Click a field to insert at cursor position
        </p>
      </div>
    </div>
  );

  if (inline) return panelContent;

  return (
    <>
      <span ref={anchorRef} className="absolute w-0 h-0 pointer-events-none" aria-hidden />
      {createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={onClose} />
          {panelContent}
        </>,
        document.body,
      )}
    </>
  );
}

export default MergeFieldPicker;
