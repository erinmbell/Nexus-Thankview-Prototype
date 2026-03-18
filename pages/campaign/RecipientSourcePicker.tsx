/**
 * ConstituentSourcePicker — reusable modal that lets users add constituents from:
 *   1. Lists (static curated lists)
 *   2. Saved Searches (dynamic queries)
 *   3. Browse Individuals (search the full constituent database)
 *   4. CSV Upload (import constituents from a CSV file)
 *
 * Returns an array of PickableConstituent-compatible objects via onAdd callback.
 */
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  Search, X, Check, ChevronRight, Minus,
  Users, List, Bookmark, Hash, Filter,
  Plus, ArrowLeft, Upload,
} from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { CSVImportWizard } from "../../components/CSVImportWizard";
import { PillSearchInput } from "../../components/PillSearchInput";

// ── Constituent types ───────────────────────────────────────────────────────
export interface MergeFields {
  preferredName: string;
  salutation: string;
  classYear: string;
  lastGiftAmount: string;
  lastGiftDate: string;
  lifetimeGiving: string;
  fund: string;
  designation?: string;
}

export interface PickableConstituent {
  id: number;
  name: string;
  email: string;
  group: string;
  mergeFields: MergeFields;
}

// ── Deterministic random ────────────────────────────────────────────────────
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── Mock constituent database ───────────────────────────────────────────────
const FIRST_NAMES = [
  "Alex","Amara","Anika","Anna","Ben","Blake","Brian","Carmen","Chloe","Clara",
  "Daniel","David","Diana","Elena","Emily","Ethan","Fiona","Gabriel","Grace","Hannah",
  "Isaac","James","Jason","Jennifer","Jessica","Jordan","Julia","Karen","Kevin","Kyle",
  "Laura","Leo","Liam","Lisa","Lucia","Marcus","Maria","Mark","Maya","Megan",
  "Michael","Morgan","Naomi","Nathan","Nina","Noah","Olivia","Omar","Patricia","Paul",
  "Quinn","Rachel","Rebecca","Robert","Rosa","Ryan","Samantha","Sarah","Sofia","Sonia",
  "Tariq","Thomas","Tyler","Uma","Vanessa","Victor","Wendy","Xavier","Yara","Zachary",
];
const LAST_NAMES = [
  "Adams","Baker","Campbell","Chen","Cho","Cruz","Davis","Diaz","Edwards","Fischer",
  "Garcia","Gonzalez","Green","Gupta","Hall","Harris","Hernandez","Hoffman","Huang","Jackson",
  "Johnson","Jones","Kim","King","Kumar","Lee","Lewis","Lopez","Martin","Miller",
  "Mitchell","Moore","Morales","Morgan","Nakamura","Nguyen","O'Brien","Ortiz","Osborne","Park",
  "Patel","Perez","Phillips","Quinn","Ramirez","Reed","Rivera","Robinson","Rodriguez","Ross",
  "Santos","Schmidt","Singh","Smith","Sullivan","Taylor","Thomas","Thompson","Torres","Turner",
  "Vargas","Walker","Wang","White","Williams","Wilson","Wright","Yamamoto","Young","Zhang",
];
const DOMAINS = ["alumni.edu","corp.com","email.com","foundation.org","org.edu","university.edu"];
const GROUPS = ["Donors","Alumni","Prospects","Board Members","Faculty","Parents"];
const SALUTATIONS = ["Mr.","Ms.","Mrs.","Dr.","Prof."];
const FUNDS = ["Annual Fund","Capital Campaign","Endowment","Planned Giving","Scholarships","Athletics","Research"];
const DESIGNATIONS = ["Scholarships","Athletics","Library","Research","Music Dept","New Building","General","Student Life","STEM"];
const YEARS = ["2008","2010","2012","2014","2015","2016","2017","2018","2019","2020","2021","2022"];

function generateConstituents(count: number): PickableConstituent[] {
  const rand = seededRandom(42);
  const out: PickableConstituent[] = [];
  const used = new Set<string>();

  for (let i = 0; i < count; i++) {
    let name: string;
    do {
      const f = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
      const l = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
      name = `${f} ${l}`;
    } while (used.has(name));
    used.add(name);

    const [first, last] = name.split(" ");
    const domain = DOMAINS[Math.floor(rand() * DOMAINS.length)];
    const email = `${first.toLowerCase().charAt(0)}.${last.toLowerCase()}@${domain}`;
    const group = GROUPS[Math.floor(rand() * GROUPS.length)];
    const giftAmt = [100,250,500,750,1000,1500,2500,5000,10000][Math.floor(rand() * 9)];
    const lifetimeAmt = giftAmt * (2 + Math.floor(rand() * 15));
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    out.push({
      id: i + 1,
      name,
      email,
      group,
      mergeFields: {
        preferredName: first,
        salutation: SALUTATIONS[Math.floor(rand() * SALUTATIONS.length)],
        classYear: YEARS[Math.floor(rand() * YEARS.length)],
        lastGiftAmount: `$${giftAmt.toLocaleString()}`,
        lastGiftDate: `${months[Math.floor(rand() * 12)]} 2025`,
        lifetimeGiving: `$${lifetimeAmt.toLocaleString()}`,
        fund: FUNDS[Math.floor(rand() * FUNDS.length)],
        designation: rand() > 0.3 ? DESIGNATIONS[Math.floor(rand() * DESIGNATIONS.length)] : undefined,
      },
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

const ALL_CONSTITUENTS = generateConstituents(500);

// ── Lists & Saved Searches ──────────────────────────────────────────────────
interface SourceEntry {
  id: string;
  name: string;
  type: "list" | "saved-search";
  description: string;
  constituentIds: number[];
  updatedAt: string;
}

function pickIds(count: number, offset: number): number[] {
  const ids: number[] = [];
  for (let i = 0; i < count; i++) ids.push(((offset + i * 7) % 500) + 1);
  return [...new Set(ids)];
}

const SOURCES: SourceEntry[] = [
  { id: "l1", name: "Major Donors 2025",          type: "list",         description: "All donors with gifts over $5,000 this fiscal year",           constituentIds: pickIds(87, 0),    updatedAt: "2 days ago" },
  { id: "l2", name: "Spring Appeal Constituents",  type: "list",         description: "Curated list for the Spring 2026 giving campaign",             constituentIds: pickIds(142, 50),  updatedAt: "1 week ago" },
  { id: "l3", name: "Board Members",               type: "list",         description: "Current university board of trustees",                         constituentIds: pickIds(24, 200),  updatedAt: "3 weeks ago" },
  { id: "l4", name: "Alumni Class of 2020",        type: "list",         description: "All graduates from the class of 2020",                         constituentIds: pickIds(185, 100), updatedAt: "1 month ago" },
  { id: "l5", name: "Faculty & Staff",             type: "list",         description: "All current faculty and staff members",                        constituentIds: pickIds(56, 300),  updatedAt: "2 weeks ago" },
  { id: "s1", name: "Donors > $1,000 (Last 12mo)", type: "saved-search", description: "Dynamic: donors who gave over $1,000 in the past 12 months",  constituentIds: pickIds(98, 10),   updatedAt: "Live" },
  { id: "s2", name: "Lapsed Donors (2+ years)",    type: "saved-search", description: "Dynamic: donors with no gift in 2+ years",                    constituentIds: pickIds(112, 250), updatedAt: "Live" },
  { id: "s3", name: "First-Time Donors",           type: "saved-search", description: "Dynamic: constituents whose first gift was in the current FY", constituentIds: pickIds(39, 400),  updatedAt: "Live" },
  { id: "s4", name: "Parents of Current Students", type: "saved-search", description: "Dynamic: parents with currently enrolled students",            constituentIds: pickIds(73, 150),  updatedAt: "Live" },
  { id: "s5", name: "Scholarship Constituents",    type: "saved-search", description: "Dynamic: current scholarship holders",                        constituentIds: pickIds(65, 350),  updatedAt: "Live" },
];

const LISTS = SOURCES.filter(s => s.type === "list");
const SAVED_SEARCHES = SOURCES.filter(s => s.type === "saved-search");

// ── Row height for virtual list ─────────────────────────────────────────────
const ROW_HEIGHT = 44;

// ═════════════════════════════════════════════════════════════════════════════
//  ConstituentPickerInline — same picker content, no modal wrapper
// ═════════════════════════════════════════════════════════════════════════════
export interface ConstituentPickerInlineProps {
  /** IDs already added so they appear greyed / checked */
  existingIds?: Set<number>;
  onAdd: (constituents: PickableConstituent[]) => void;
}

export function ConstituentPickerInline({
  existingIds = new Set(),
  onAdd,
}: ConstituentPickerInlineProps) {
  const [tab, setTab] = useState<Tab>("lists");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [expandedSource, setExpandedSource] = useState<SourceEntry | null>(null);
  const [browseSearch, setBrowseSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [sourceSearch, setSourceSearch] = useState("");

  const browseFiltered = useMemo(() => {
    let list = ALL_CONSTITUENTS;
    if (browseSearch.trim()) {
      const q = browseSearch.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
    }
    if (groupFilter !== "All") {
      list = list.filter(c => c.group === groupFilter);
    }
    return list;
  }, [browseSearch, groupFilter]);

  const expandedContacts = useMemo(() => {
    if (!expandedSource) return [];
    return expandedSource.constituentIds
      .map(id => ALL_CONSTITUENTS.find(c => c.id === id))
      .filter(Boolean) as PickableConstituent[];
  }, [expandedSource]);

  const filteredLists = useMemo(() => {
    if (!sourceSearch.trim()) return LISTS;
    const q = sourceSearch.toLowerCase();
    return LISTS.filter(l => l.name.toLowerCase().includes(q) || l.description.toLowerCase().includes(q));
  }, [sourceSearch]);

  const filteredSearches = useMemo(() => {
    if (!sourceSearch.trim()) return SAVED_SEARCHES;
    const q = sourceSearch.toLowerCase();
    return SAVED_SEARCHES.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
  }, [sourceSearch]);

  const totalNewSelected = useMemo(() => {
    let count = 0;
    selectedIds.forEach(id => {
      if (!existingIds.has(id)) count++;
    });
    return count;
  }, [selectedIds, existingIds]);

  const toggleId = useCallback((id: number) => {
    if (existingIds.has(id)) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, [existingIds]);

  const toggleAll = useCallback((ids: number[]) => {
    const newIds = ids.filter(id => !existingIds.has(id));
    const allChecked = newIds.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allChecked) {
        newIds.forEach(id => next.delete(id));
      } else {
        newIds.forEach(id => next.add(id));
      }
      return next;
    });
  }, [existingIds, selectedIds]);

  const selectSourceAll = useCallback((source: SourceEntry) => {
    const newIds = source.constituentIds.filter(id =>
      !existingIds.has(id) && ALL_CONSTITUENTS.some(c => c.id === id)
    );
    setSelectedIds(prev => {
      const next = new Set(prev);
      newIds.forEach(id => next.add(id));
      return next;
    });
  }, [existingIds]);

  const handleAdd = useCallback(() => {
    const selected = ALL_CONSTITUENTS.filter(c => selectedIds.has(c.id) && !existingIds.has(c.id));
    if (selected.length > 0) {
      onAdd(selected);
      setSelectedIds(new Set());
    }
  }, [selectedIds, existingIds, onAdd]);

  const browseParentRef = useRef<HTMLDivElement>(null);
  const browseVirtualizer = useVirtualizer({
    count: browseFiltered.length,
    getScrollElement: () => browseParentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 15,
  });

  const TABS: { id: Tab; label: string; icon: typeof List }[] = [
    { id: "lists", label: "Lists", icon: List },
    { id: "saved-searches", label: "Saved Searches", icon: Bookmark },
    { id: "browse", label: "Browse", icon: Users },
    { id: "csv", label: "CSV Upload", icon: Upload },
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ══ Header with tabs ══ */}
      <div className="px-5 pt-5 pb-3 shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-[10px] bg-tv-brand-tint flex items-center justify-center">
            <Users size={16} className="text-tv-brand" />
          </div>
          <div>
            <h3 className="text-[15px] text-tv-text-primary" style={{ fontWeight: 900 }}>
              Choose Constituents
            </h3>
            <p className="text-[11px] text-tv-text-secondary mt-0.5">
              Add from a list, saved search, or browse individuals.
            </p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-tv-surface rounded-[10px] p-1">
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setExpandedSource(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-[8px] text-[12px] transition-all ${
                  active
                    ? "bg-white text-tv-brand shadow-sm"
                    : "text-tv-text-secondary hover:text-tv-text-primary"
                }`} style={{ fontWeight: 500 }}
              >
                <t.icon size={13} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══ Body ══ */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">

        {/* ── Lists tab ── */}
        {tab === "lists" && !expandedSource && (
          <div className="flex-1 overflow-y-auto">
            <div className="px-5 pt-4 pb-2">
              <PillSearchInput value={sourceSearch} onChange={setSourceSearch} placeholder="Search lists…" size="sm" />
            </div>
            <div className="px-5 pb-4 space-y-2">
              {filteredLists.map(entry => (
                <SourceCard
                  key={entry.id}
                  entry={entry}
                  onExpand={() => setExpandedSource(entry)}
                  onAddAll={() => selectSourceAll(entry)}
                  existingCount={entry.constituentIds.filter(id => existingIds.has(id)).length}
                  selectedCount={entry.constituentIds.filter(id => selectedIds.has(id)).length}
                />
              ))}
              {filteredLists.length === 0 && (
                <EmptyState text="No lists match your search." />
              )}
            </div>
          </div>
        )}

        {/* ── Saved Searches tab ── */}
        {tab === "saved-searches" && !expandedSource && (
          <div className="flex-1 overflow-y-auto">
            <div className="px-5 pt-4 pb-2">
              <PillSearchInput value={sourceSearch} onChange={setSourceSearch} placeholder="Search saved searches…" size="sm" />
            </div>
            <div className="px-5 pb-4 space-y-2">
              {filteredSearches.map(entry => (
                <SourceCard
                  key={entry.id}
                  entry={entry}
                  onExpand={() => setExpandedSource(entry)}
                  onAddAll={() => selectSourceAll(entry)}
                  existingCount={entry.constituentIds.filter(id => existingIds.has(id)).length}
                  selectedCount={entry.constituentIds.filter(id => selectedIds.has(id)).length}
                />
              ))}
              {filteredSearches.length === 0 && (
                <EmptyState text="No saved searches match your search." />
              )}
            </div>
          </div>
        )}

        {/* ── Expanded source detail (both tabs) ── */}
        {expandedSource && (tab === "lists" || tab === "saved-searches") && (
          <SourceDetail
            source={expandedSource}
            constituents={expandedContacts}
            existingIds={existingIds}
            selectedIds={selectedIds}
            onToggle={toggleId}
            onToggleAll={() => toggleAll(expandedContacts.map(c => c.id))}
            onBack={() => setExpandedSource(null)}
            onAddAll={() => selectSourceAll(expandedSource)}
          />
        )}

        {/* ── Browse tab ── */}
        {tab === "browse" && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-5 pt-4 pb-2 shrink-0 space-y-2">
              <div className="flex items-center gap-2">
                <PillSearchInput value={browseSearch} onChange={setBrowseSearch} placeholder="Search by name or email…" size="sm" className="flex-1" />
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`h-[34px] px-3 rounded-full border text-[11px] flex items-center gap-1.5 transition-colors ${
                    showFilters || groupFilter !== "All"
                      ? "border-tv-brand bg-tv-brand-tint text-tv-brand"
                      : "border-tv-border-light text-tv-text-secondary hover:border-tv-border-strong"
                  }`} style={{ fontWeight: 500 }}
                >
                  <Filter size={11} />Filter
                </button>
              </div>

              {showFilters && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-tv-text-secondary">Group:</span>
                  {["All", ...GROUPS].map(g => (
                    <button
                      key={g}
                      onClick={() => setGroupFilter(g)}
                      className={`px-2 py-0.5 text-[10px] rounded-full border transition-colors ${
                        groupFilter === g
                          ? "bg-tv-brand-bg text-white border-tv-brand-bg"
                          : "border-tv-border-light text-tv-text-primary hover:bg-tv-surface"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => toggleAll(browseFiltered.map(c => c.id))}
                  className="flex items-center gap-2 text-[11px] text-tv-text-primary hover:text-tv-brand transition-colors" style={{ fontWeight: 500 }}
                >
                  <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                    browseFiltered.length > 0 && browseFiltered.every(c => selectedIds.has(c.id) || existingIds.has(c.id))
                      ? "bg-tv-brand-bg border-tv-brand-bg"
                      : browseFiltered.some(c => selectedIds.has(c.id))
                      ? "bg-tv-brand-bg/50 border-tv-brand-bg"
                      : "border-tv-border-light"
                  }`}>
                    {browseFiltered.length > 0 && browseFiltered.every(c => selectedIds.has(c.id) || existingIds.has(c.id)) ? (
                      <Check size={8} className="text-white" />
                    ) : browseFiltered.some(c => selectedIds.has(c.id)) ? (
                      <Minus size={8} className="text-white" />
                    ) : null}
                  </span>
                  Select All
                </button>
                <span className="text-[10px] text-tv-text-secondary">
                  {browseFiltered.length} constituents
                </span>
              </div>
            </div>

            <div ref={browseParentRef} className="max-h-[352px] overflow-y-auto px-5 pb-3">
              <div style={{ height: `${browseVirtualizer.getTotalSize()}px`, width: "100%", position: "relative" }}>
                {browseVirtualizer.getVirtualItems().map(virtualRow => {
                  const c = browseFiltered[virtualRow.index];
                  const isExisting = existingIds.has(c.id);
                  const isChecked = selectedIds.has(c.id);

                  return (
                    <div
                      key={c.id}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <button
                        onClick={() => toggleId(c.id)}
                        disabled={isExisting}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-[8px] text-left transition-colors ${
                          isExisting
                            ? "opacity-50 cursor-default"
                            : isChecked
                            ? "bg-tv-brand-tint/40"
                            : "hover:bg-tv-surface"
                        }`}
                      >
                        <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          isExisting
                            ? "bg-tv-surface border-tv-border-light"
                            : isChecked
                            ? "bg-tv-brand-bg border-tv-brand-bg"
                            : "border-tv-border-light"
                        }`}>
                          {(isExisting || isChecked) && <Check size={9} className="text-white" />}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="text-[12px] text-tv-text-primary truncate block" style={{ fontWeight: 500 }}>{c.name}</span>
                          <span className="text-[10px] text-tv-text-secondary truncate block">{c.email}</span>
                        </div>
                        <span className="text-[9px] text-tv-text-decorative shrink-0">{c.group}</span>
                        {isExisting && (
                          <span className="text-[8px] text-tv-text-decorative bg-tv-surface px-1.5 py-0.5 rounded-full shrink-0">Already added</span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
              {browseFiltered.length === 0 && (
                <EmptyState text="No constituents match your search." />
              )}
            </div>
          </div>
        )}

        {/* ── CSV Upload tab ── */}
        {tab === "csv" && (
          <CSVImportWizard
            onImport={imported => {
              onAdd(imported);
              setSelectedIds(new Set());
            }}
          />
        )}
      </div>

      {/* ══ Footer ══ */}
      <div className="px-5 py-3 border-t border-tv-border-divider shrink-0 flex items-center justify-between">
        <span className="text-[11px] text-tv-text-secondary">
          {existingIds.size > 0 && <>{existingIds.size} already added</>}
        </span>
        <div className="flex items-center gap-3">
          {totalNewSelected > 0 && (
            <span className="text-[11px] text-tv-brand" style={{ fontWeight: 500 }}>
              {totalNewSelected} new constituent{totalNewSelected !== 1 ? "s" : ""} selected
            </span>
          )}
          <button
            onClick={handleAdd}
            disabled={totalNewSelected === 0}
            className="flex items-center gap-1.5 px-5 py-2.5 text-[13px] text-white bg-tv-brand-bg rounded-full hover:bg-tv-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed" style={{ fontWeight: 600 }}
          >
            <Plus size={12} />
            Add {totalNewSelected > 0 ? totalNewSelected : ""} Constituent{totalNewSelected !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  ConstituentSourcePicker (modal)
// ═════════════════════════════════════════════════════════════════════════════
type Tab = "lists" | "saved-searches" | "browse" | "csv";

export interface ConstituentSourcePickerProps {
  /** IDs already added so they appear greyed / checked */
  existingIds?: Set<number>;
  onAdd: (constituents: PickableConstituent[]) => void;
  onClose: () => void;
}

export function ConstituentSourcePicker({
  existingIds = new Set(),
  onAdd,
  onClose,
}: ConstituentSourcePickerProps) {
  const [tab, setTab] = useState<Tab>("lists");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // List / saved-search detail view
  const [expandedSource, setExpandedSource] = useState<SourceEntry | null>(null);

  // Browse search & filter
  const [browseSearch, setBrowseSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  // Source search
  const [sourceSearch, setSourceSearch] = useState("");

  // ── Derived ──
  const browseFiltered = useMemo(() => {
    let list = ALL_CONSTITUENTS;
    if (browseSearch.trim()) {
      const q = browseSearch.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
    }
    if (groupFilter !== "All") {
      list = list.filter(c => c.group === groupFilter);
    }
    return list;
  }, [browseSearch, groupFilter]);

  const expandedContacts = useMemo(() => {
    if (!expandedSource) return [];
    return expandedSource.constituentIds
      .map(id => ALL_CONSTITUENTS.find(c => c.id === id))
      .filter(Boolean) as PickableConstituent[];
  }, [expandedSource]);

  const filteredLists = useMemo(() => {
    if (!sourceSearch.trim()) return LISTS;
    const q = sourceSearch.toLowerCase();
    return LISTS.filter(l => l.name.toLowerCase().includes(q) || l.description.toLowerCase().includes(q));
  }, [sourceSearch]);

  const filteredSearches = useMemo(() => {
    if (!sourceSearch.trim()) return SAVED_SEARCHES;
    const q = sourceSearch.toLowerCase();
    return SAVED_SEARCHES.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
  }, [sourceSearch]);

  const totalNewSelected = useMemo(() => {
    let count = 0;
    selectedIds.forEach(id => {
      if (!existingIds.has(id)) count++;
    });
    return count;
  }, [selectedIds, existingIds]);

  // ── Toggle helpers ──
  const toggleId = useCallback((id: number) => {
    if (existingIds.has(id)) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, [existingIds]);

  const toggleAll = useCallback((ids: number[]) => {
    const newIds = ids.filter(id => !existingIds.has(id));
    const allChecked = newIds.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allChecked) {
        newIds.forEach(id => next.delete(id));
      } else {
        newIds.forEach(id => next.add(id));
      }
      return next;
    });
  }, [existingIds, selectedIds]);

  const selectSourceAll = useCallback((source: SourceEntry) => {
    const newIds = source.constituentIds.filter(id =>
      !existingIds.has(id) && ALL_CONSTITUENTS.some(c => c.id === id)
    );
    setSelectedIds(prev => {
      const next = new Set(prev);
      newIds.forEach(id => next.add(id));
      return next;
    });
  }, [existingIds]);

  // ── Submit ──
  const handleAdd = useCallback(() => {
    const selected = ALL_CONSTITUENTS.filter(c => selectedIds.has(c.id) && !existingIds.has(c.id));
    if (selected.length > 0) onAdd(selected);
  }, [selectedIds, existingIds, onAdd]);

  // Close on Escape key (WCAG 2.1.1)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // ── Virtual list for browse ──
  const browseParentRef = useRef<HTMLDivElement>(null);
  const browseVirtualizer = useVirtualizer({
    count: browseFiltered.length,
    getScrollElement: () => browseParentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 15,
  });

  // ── Tab definitions ──
  const TABS: { id: Tab; label: string; icon: typeof List }[] = [
    { id: "lists", label: "Lists", icon: List },
    { id: "saved-searches", label: "Saved Searches", icon: Bookmark },
    { id: "browse", label: "Browse", icon: Users },
    { id: "csv", label: "CSV Upload", icon: Upload },
  ];

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-6" role="dialog" aria-modal="true" aria-label="Select recipient source">
      <div className="bg-white rounded-[20px] border border-tv-border-light shadow-2xl flex flex-col w-full max-w-[720px] max-h-[85vh] overflow-hidden">

        {/* ══ Header ══ */}
        <div className="px-6 py-4 border-b border-tv-border-divider shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-tv-brand-tint flex items-center justify-center">
                <Users size={16} className="text-tv-brand" />
              </div>
              <div>
                <h2 className="text-[16px] text-tv-text-primary" style={{ fontWeight: 900 }}>
                  Choose Constituents
                </h2>
                <p className="text-[11px] text-tv-text-secondary mt-0.5">
                  Add constituents from a list, saved search, or browse individuals.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full border border-tv-border-light flex items-center justify-center hover:bg-tv-surface transition-colors"
            >
              <X size={12} className="text-tv-text-secondary" />
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 bg-tv-surface rounded-[10px] p-1">
            {TABS.map(t => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); setExpandedSource(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-[8px] text-[12px] transition-all ${
                    active
                      ? "bg-white text-tv-brand shadow-sm"
                      : "text-tv-text-secondary hover:text-tv-text-primary"
                  }`} style={{ fontWeight: 500 }}
                >
                  <t.icon size={13} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ══ Body ══ */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">

          {/* ── Lists tab ── */}
          {tab === "lists" && !expandedSource && (
            <div className="flex-1 overflow-y-auto">
              <div className="px-5 pt-4 pb-2">
                <PillSearchInput value={sourceSearch} onChange={setSourceSearch} placeholder="Search lists…" size="sm" />
              </div>
              <div className="px-5 pb-4 space-y-2">
                {filteredLists.map(entry => (
                  <SourceCard
                    key={entry.id}
                    entry={entry}
                    onExpand={() => setExpandedSource(entry)}
                    onAddAll={() => selectSourceAll(entry)}
                    existingCount={entry.constituentIds.filter(id => existingIds.has(id)).length}
                    selectedCount={entry.constituentIds.filter(id => selectedIds.has(id)).length}
                  />
                ))}
                {filteredLists.length === 0 && (
                  <EmptyState text="No lists match your search." />
                )}
              </div>
            </div>
          )}

          {/* ── Saved Searches tab ── */}
          {tab === "saved-searches" && !expandedSource && (
            <div className="flex-1 overflow-y-auto">
              <div className="px-5 pt-4 pb-2">
                <PillSearchInput value={sourceSearch} onChange={setSourceSearch} placeholder="Search saved searches…" size="sm" />
              </div>
              <div className="px-5 pb-4 space-y-2">
                {filteredSearches.map(entry => (
                  <SourceCard
                    key={entry.id}
                    entry={entry}
                    onExpand={() => setExpandedSource(entry)}
                    onAddAll={() => selectSourceAll(entry)}
                    existingCount={entry.constituentIds.filter(id => existingIds.has(id)).length}
                    selectedCount={entry.constituentIds.filter(id => selectedIds.has(id)).length}
                  />
                ))}
                {filteredSearches.length === 0 && (
                  <EmptyState text="No saved searches match your search." />
                )}
              </div>
            </div>
          )}

          {/* ── Expanded source detail (both tabs) ── */}
          {expandedSource && (tab === "lists" || tab === "saved-searches") && (
            <SourceDetail
              source={expandedSource}
              constituents={expandedContacts}
              existingIds={existingIds}
              selectedIds={selectedIds}
              onToggle={toggleId}
              onToggleAll={() => toggleAll(expandedContacts.map(c => c.id))}
              onBack={() => setExpandedSource(null)}
              onAddAll={() => selectSourceAll(expandedSource)}
            />
          )}

          {/* ── Browse tab ── */}
          {tab === "browse" && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Search + filters */}
              <div className="px-5 pt-4 pb-2 shrink-0 space-y-2">
                <div className="flex items-center gap-2">
                  <PillSearchInput value={browseSearch} onChange={setBrowseSearch} placeholder="Search by name or email…" size="sm" className="flex-1" />
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`h-[34px] px-3 rounded-full border text-[11px] flex items-center gap-1.5 transition-colors ${
                      showFilters || groupFilter !== "All"
                        ? "border-tv-brand bg-tv-brand-tint text-tv-brand"
                        : "border-tv-border-light text-tv-text-secondary hover:border-tv-border-strong"
                    }`} style={{ fontWeight: 500 }}
                  >
                    <Filter size={11} />Filter
                  </button>
                </div>

                {showFilters && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-tv-text-secondary">Group:</span>
                    {["All", ...GROUPS].map(g => (
                      <button
                        key={g}
                        onClick={() => setGroupFilter(g)}
                        className={`px-2 py-0.5 text-[10px] rounded-full border transition-colors ${
                          groupFilter === g
                            ? "bg-tv-brand-bg text-white border-tv-brand-bg"
                            : "border-tv-border-light text-tv-text-primary hover:bg-tv-surface"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                )}

                {/* Select all / count header */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => toggleAll(browseFiltered.map(c => c.id))}
                    className="flex items-center gap-2 text-[11px] text-tv-text-primary hover:text-tv-brand transition-colors" style={{ fontWeight: 500 }}
                  >
                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                      browseFiltered.length > 0 && browseFiltered.every(c => selectedIds.has(c.id) || existingIds.has(c.id))
                        ? "bg-tv-brand-bg border-tv-brand-bg"
                        : browseFiltered.some(c => selectedIds.has(c.id))
                        ? "bg-tv-brand-bg/50 border-tv-brand-bg"
                        : "border-tv-border-light"
                    }`}>
                      {browseFiltered.length > 0 && browseFiltered.every(c => selectedIds.has(c.id) || existingIds.has(c.id)) ? (
                        <Check size={8} className="text-white" />
                      ) : browseFiltered.some(c => selectedIds.has(c.id)) ? (
                        <Minus size={8} className="text-white" />
                      ) : null}
                    </span>
                    Select All
                  </button>
                  <span className="text-[10px] text-tv-text-secondary">
                    {browseFiltered.length} constituents
                  </span>
                </div>
              </div>

              {/* Virtualized list */}
              <div ref={browseParentRef} className="max-h-[352px] overflow-y-auto px-5 pb-3">
                <div style={{ height: `${browseVirtualizer.getTotalSize()}px`, width: "100%", position: "relative" }}>
                  {browseVirtualizer.getVirtualItems().map(virtualRow => {
                    const c = browseFiltered[virtualRow.index];
                    const isExisting = existingIds.has(c.id);
                    const isChecked = selectedIds.has(c.id);

                    return (
                      <div
                        key={c.id}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <button
                          onClick={() => toggleId(c.id)}
                          disabled={isExisting}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-[8px] text-left transition-colors ${
                            isExisting
                              ? "opacity-50 cursor-default"
                              : isChecked
                              ? "bg-tv-brand-tint/40"
                              : "hover:bg-tv-surface"
                          }`}
                        >
                          <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            isExisting
                              ? "bg-tv-surface border-tv-border-light"
                              : isChecked
                              ? "bg-tv-brand-bg border-tv-brand-bg"
                              : "border-tv-border-light"
                          }`}>
                            {(isExisting || isChecked) && <Check size={9} className="text-white" />}
                          </span>
                          <div className="flex-1 min-w-0">
                            <span className="text-[12px] text-tv-text-primary truncate block" style={{ fontWeight: 500 }}>{c.name}</span>
                            <span className="text-[10px] text-tv-text-secondary truncate block">{c.email}</span>
                          </div>
                          <span className="text-[9px] text-tv-text-decorative shrink-0">{c.group}</span>
                          {isExisting && (
                            <span className="text-[8px] text-tv-text-decorative bg-tv-surface px-1.5 py-0.5 rounded-full shrink-0">Added</span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
                {browseFiltered.length === 0 && (
                  <EmptyState text="No constituents match your search." />
                )}
              </div>
            </div>
          )}

          {/* ── CSV Upload tab ── */}
          {tab === "csv" && (
            <CSVImportWizard
              onImport={imported => {
                onAdd(imported);
                setSelectedIds(new Set());
              }}
            />
          )}
        </div>

        {/* ══ Footer ══ */}
        <div className="px-6 py-3 border-t border-tv-border-divider shrink-0 flex items-center justify-between bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[13px] text-tv-text-secondary border border-tv-border-light rounded-full hover:border-tv-border-strong transition-colors" style={{ fontWeight: 500 }}
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {totalNewSelected > 0 && (
              <span className="text-[11px] text-tv-brand" style={{ fontWeight: 500 }}>
                {totalNewSelected} new constituent{totalNewSelected !== 1 ? "s" : ""} selected
              </span>
            )}
            <button
              onClick={handleAdd}
              disabled={totalNewSelected === 0}
              className="flex items-center gap-1.5 px-5 py-2.5 text-[13px] text-white bg-tv-brand-bg rounded-full hover:bg-tv-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed" style={{ fontWeight: 600 }}
            >
              <Plus size={12} />
              Add {totalNewSelected > 0 ? totalNewSelected : ""} Constituent{totalNewSelected !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  SourceCard
// ═════════════════════════════════════════════════════════════════════════════
function SourceCard({
  entry,
  onExpand,
  onAddAll,
  existingCount,
  selectedCount,
}: {
  entry: SourceEntry;
  onExpand: () => void;
  onAddAll: () => void;
  existingCount: number;
  selectedCount: number;
}) {
  const total = entry.constituentIds.length;
  const isSavedSearch = entry.type === "saved-search";

  return (
    <div className="border border-tv-border-light rounded-[12px] p-3.5 hover:border-tv-border-strong transition-colors">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 ${
          isSavedSearch ? "bg-tv-warning-bg" : "bg-tv-brand-tint"
        }`}>
          {isSavedSearch ? <Bookmark size={14} className="text-tv-warning" /> : <List size={14} className="text-tv-brand" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[13px] text-tv-text-primary truncate" style={{ fontWeight: 600 }}>{entry.name}</p>
            {isSavedSearch && (
              <span className="text-[8px] text-tv-warning bg-tv-warning-bg px-1.5 py-0.5 rounded-full shrink-0" style={{ fontWeight: 600 }}>DYNAMIC</span>
            )}
          </div>
          <p className="text-[10px] text-tv-text-secondary mt-0.5 line-clamp-1">{entry.description}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] text-tv-text-decorative flex items-center gap-1">
              <Hash size={9} />{total} constituents
            </span>
            <span className="text-[10px] text-tv-text-decorative">Updated {entry.updatedAt}</span>
            {existingCount > 0 && (
              <span className="text-[9px] text-tv-text-decorative">{existingCount} already added</span>
            )}
            {selectedCount > 0 && (
              <span className="text-[9px] text-tv-brand" style={{ fontWeight: 500 }}>{selectedCount} selected</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onAddAll}
            className="px-2.5 py-1.5 text-[10px] text-tv-brand border border-tv-brand-bg/30 rounded-full hover:bg-tv-brand-tint transition-colors" style={{ fontWeight: 600 }}
          >
            Add All
          </button>
          <button
            onClick={onExpand}
            className="w-7 h-7 rounded-full border border-tv-border-light flex items-center justify-center hover:bg-tv-surface transition-colors"
          >
            <ChevronRight size={12} className="text-tv-text-secondary" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  SourceDetail — expanded view showing all members of a list/search
// ═══════════════════════════════════════════════════════════════════════════════
function SourceDetail({
  source,
  constituents,
  existingIds,
  selectedIds,
  onToggle,
  onToggleAll,
  onBack,
  onAddAll,
}: {
  source: SourceEntry;
  constituents: PickableConstituent[];
  existingIds: Set<number>;
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
  onToggleAll: () => void;
  onBack: () => void;
  onAddAll: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    if (!search.trim()) return constituents;
    const q = search.toLowerCase();
    return constituents.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }, [constituents, search]);

  const newOnly = filtered.filter(c => !existingIds.has(c.id));
  const allChecked = newOnly.length > 0 && newOnly.every(c => selectedIds.has(c.id));
  const someChecked = newOnly.some(c => selectedIds.has(c.id)) && !allChecked;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 shrink-0 border-b border-tv-border-divider">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={onBack} className="flex items-center gap-1 text-[11px] text-tv-brand hover:underline" style={{ fontWeight: 500 }}>
            <ArrowLeft size={11} />Back
          </button>
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] text-tv-text-primary truncate" style={{ fontWeight: 900 }}>{source.name}</h3>
            <p className="text-[10px] text-tv-text-secondary">{constituents.length} constituents</p>
          </div>
          <button
            onClick={onAddAll}
            className="px-3 py-1.5 text-[11px] text-white bg-tv-brand-bg rounded-full hover:bg-tv-brand-hover transition-colors" style={{ fontWeight: 600 }}
          >
            Add All
          </button>
        </div>

        <div className="flex items-center gap-2">
          <PillSearchInput value={search} onChange={setSearch} placeholder="Search within this list…" size="xs" className="flex-1" />

          <button
            onClick={onToggleAll}
            className="flex items-center gap-1.5 text-[10px] text-tv-text-primary hover:text-tv-brand transition-colors" style={{ fontWeight: 500 }}
          >
            <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
              allChecked ? "bg-tv-brand-bg border-tv-brand-bg" : someChecked ? "bg-tv-brand-bg/50 border-tv-brand-bg" : "border-tv-border-light"
            }`}>
              {allChecked ? <Check size={8} className="text-white" /> : someChecked ? <Minus size={8} className="text-white" /> : null}
            </span>
            Select All
          </button>
        </div>
      </div>

      {/* Members list */}
      <div className="flex-1 overflow-y-auto px-5 py-2">
        {filtered.map(c => {
          const isExisting = existingIds.has(c.id);
          const isChecked = selectedIds.has(c.id);

          return (
            <button
              key={c.id}
              onClick={() => onToggle(c.id)}
              disabled={isExisting}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-[8px] text-left transition-colors ${
                isExisting
                  ? "opacity-50 cursor-default"
                  : isChecked
                  ? "bg-tv-brand-tint/40"
                  : "hover:bg-tv-surface"
              }`}
            >
              <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                isExisting
                  ? "bg-tv-surface border-tv-border-light"
                  : isChecked
                  ? "bg-tv-brand-bg border-tv-brand-bg"
                  : "border-tv-border-light"
              }`}>
                {(isExisting || isChecked) && <Check size={9} className="text-white" />}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-[12px] text-tv-text-primary truncate block" style={{ fontWeight: 500 }}>{c.name}</span>
                <span className="text-[10px] text-tv-text-secondary truncate block">{c.email}</span>
              </div>
              <span className="text-[9px] text-tv-text-decorative shrink-0">{c.group}</span>
              {isExisting && (
                <span className="text-[8px] text-tv-text-decorative bg-tv-surface px-1.5 py-0.5 rounded-full shrink-0">Added</span>
              )}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <EmptyState text="No matches in this list." />
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  EmptyState
// ═════════════════════════════════════════════════════════════════════════════
function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <div className="w-10 h-10 rounded-full bg-tv-surface flex items-center justify-center">
        <Search size={16} className="text-tv-text-decorative" />
      </div>
      <p className="text-[12px] text-tv-text-secondary">{text}</p>
    </div>
  );
}

// ── Aliases for PersonalizedRecorder compatibility ────────────────────────────
export type PickableContact = PickableConstituent;
export type RecipientPickerInlineProps = ConstituentPickerInlineProps;
export const RecipientPickerInline = ConstituentPickerInline;