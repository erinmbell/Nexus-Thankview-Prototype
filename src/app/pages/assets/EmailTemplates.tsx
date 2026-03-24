import { useState } from "react";
import {
  Search, Plus, Mail, MessageSquare, Star, MoreHorizontal,
  Eye, Edit2, Copy, Trash2, Send, X, Tag, ArrowUpDown,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useToast } from "../../contexts/ToastContext";
import { DeleteModal } from "../../components/ui/DeleteModal";
import { AssetActionMenu } from "../../components/ui/AssetActionMenu";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { FilterBar } from "../../components/FilterBar";
import type { FilterDef, FilterValues } from "../../components/FilterBar";
import { DATE_CREATED_FILTER, CREATED_BY_FILTER } from "../../components/filterDefs";
import { Menu, ActionIcon, Tooltip, Text, FocusTrap } from "@mantine/core";
import { TV } from "../../theme";

// ── Filter definitions for this page ──────────────────────────────────────────
const TEMPLATE_FILTERS: FilterDef[] = [
  {
    key: "type", label: "Type", icon: Mail, group: "Type",
    type: "select", essential: true,
    options: [
      { value: "email", label: "Email" },
      { value: "sms", label: "SMS" },
    ],
  },
  {
    key: "tag", label: "Tag", icon: Tag, group: "Tag",
    type: "multi-select", essential: true,
    options: [
      { value: "Thank You", label: "Thank You" },
      { value: "Solicitation", label: "Solicitation" },
      { value: "Welcome", label: "Welcome" },
      { value: "Event", label: "Event" },
      { value: "Update", label: "Update" },
      { value: "Birthday", label: "Birthday" },
      { value: "Anniversary", label: "Anniversary" },
    ],
  },
  DATE_CREATED_FILTER,
  CREATED_BY_FILTER,
];

const TEMPLATES = [
  { id: 1, name: "Spring Appeal — Thank You",     channel: "email" as const, category: "Thank You",     updated: "Feb 20, 2026", used: 12, subject: "A personal thank you, {{first_name}}",                   starred: true  },
  { id: 2, name: "Year-End Giving Reminder",       channel: "email" as const, category: "Solicitation",  updated: "Feb 18, 2026", used: 8,  subject: "Your year-end gift makes an impact",                     starred: false },
  { id: 3, name: "New Student Welcome SMS",         channel: "sms"   as const, category: "Welcome",       updated: "Feb 14, 2026", used: 5,  subject: "Welcome to Hartwell, {{first_name}}! 🎓",               starred: false },
  { id: 4, name: "Event Invitation — Gala 2026",   channel: "email" as const, category: "Event",         updated: "Feb 10, 2026", used: 3,  subject: "You're invited to the Hartwell Gala",                   starred: true  },
  { id: 5, name: "Scholarship Impact Update",       channel: "email" as const, category: "Update",        updated: "Feb 6, 2026",  used: 7,  subject: "See the impact of your scholarship gift",               starred: false },
  { id: 6, name: "Birthday Greeting SMS",           channel: "sms"   as const, category: "Birthday",      updated: "Jan 28, 2026", used: 22, subject: "Happy birthday, {{first_name}}! 🎂",                    starred: false },
  { id: 7, name: "Donor Anniversary",               channel: "email" as const, category: "Anniversary",   updated: "Jan 20, 2026", used: 4,  subject: "Thank you for {{gift_years}} years of giving",          starred: false },
  { id: 8, name: "Matching Gift Challenge",          channel: "email" as const, category: "Solicitation",  updated: "Jan 15, 2026", used: 6,  subject: "Double your impact today, {{first_name}}",              starred: true  },
];

export function EmailTemplates() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [activeFilterKeys, setActiveFilterKeys] = useState<string[]>(
    TEMPLATE_FILTERS.filter(f => f.essential).map(f => f.key)
  );
  const [templates, setTemplates] = useState(TEMPLATES);
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [modalMenuOpen, setModalMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "name" | "used">("recent");

  const filtered = templates.filter(t => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    const typeVals = filterValues.type ?? [];
    if (typeVals.length > 0 && !typeVals.includes(t.channel)) return false;
    const tagVals = filterValues.tag ?? [];
    if (tagVals.length > 0 && !tagVals.includes(t.category)) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "used") return b.used - a.used;
    return 0; // "recent" keeps original order (already sorted by date)
  });

  const handleDuplicate = (id: number) => {
    const tpl = templates.find(t => t.id === id);
    if (!tpl) return;
    const copy = { ...tpl, id: Date.now(), name: `${tpl.name} (Duplicate)`, used: 0, starred: false };
    setTemplates(prev => [copy, ...prev]);
    show(`"${tpl.name}" duplicated`, "success");
    setMenuOpen(null);
  };

  const handleDelete = (id: number) => {
    const tpl = templates.find(t => t.id === id);
    setTemplates(prev => prev.filter(t => t.id !== id));
    show(`"${tpl?.name}" deleted`, "success");
    setDeleteConfirm(null);
    setMenuOpen(null);
  };

  const toggleStar = (id: number) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, starred: !t.starred } : t));
  };

  const preview = previewId ? templates.find(t => t.id === previewId) : null;

  return (
    <div className="p-4 md:p-8 pt-0 min-h-full">
      {/* Breadcrumb */}
      <div className="sticky top-0 z-10 bg-tv-surface-muted pt-4 md:pt-6 pb-3 -mx-4 md:-mx-8 px-4 md:px-8 mb-2">
        <Breadcrumbs items={[
          { label: "Home", href: "/" },
          { label: "Assets", href: "/assets" },
          { label: "Email & SMS Templates" },
        ]} />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[22px] sm:text-[24px] font-black text-tv-text-primary">Email & SMS Templates</h1>
          <p className="text-[13px] text-tv-text-secondary mt-1">Create and manage reusable message templates for your campaigns.</p>
        </div>
        <button
          onClick={() => navigate("/template/create")}
          className="flex items-center gap-2 bg-tv-brand-bg text-white px-5 py-2.5 rounded-full text-[13px] font-semibold hover:bg-tv-brand transition-colors shrink-0"
        >
          <Plus size={15} />New Template
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6">
        <FilterBar
          filters={TEMPLATE_FILTERS}
          activeFilterKeys={activeFilterKeys}
          filterValues={filterValues}
          onFilterValuesChange={setFilterValues}
          onActiveFilterKeysChange={setActiveFilterKeys}
          sortButton={
            <Menu position="bottom-end">
              <Menu.Target>
                <Tooltip label="Sort" withArrow position="bottom" openDelay={300}>
                  <ActionIcon variant="subtle" size="lg" radius="xl" aria-label="Sort templates" style={{ color: TV.brand }}>
                    <ArrowUpDown size={14} />
                  </ActionIcon>
                </Tooltip>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Sort by</Menu.Label>
                {([
                  { key: "recent" as const, label: "Most Recent" },
                  { key: "name" as const, label: "Name A–Z" },
                  { key: "used" as const, label: "Most Used" },
                ]).map(s => (
                  <Menu.Item key={s.key} onClick={() => setSortBy(s.key)}
                    rightSection={sortBy === s.key ? <Text size="xs" c="dimmed">✓</Text> : undefined}
                    style={sortBy === s.key ? { backgroundColor: TV.surface, color: TV.textBrand, fontWeight: 600 } : undefined}>
                    {s.label}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
          }
        />
        <div className="flex items-center gap-2 bg-white rounded-full px-4 py-1.5 border border-tv-border-light min-w-[200px] w-[255px] shrink-0">
          <Search size={13} className="text-tv-text-secondary shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search templates…"
            aria-label="Search templates"
            className="bg-transparent text-[13px] text-tv-text-primary outline-none w-full placeholder:text-tv-text-decorative focus-visible:outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} aria-label="Clear search" className="text-tv-text-secondary hover:text-tv-text-label"><X size={12} /></button>
          )}
        </div>
      </div>

      {/* Results count */}
      <p role="status" aria-live="polite" className="text-[12px] text-tv-text-secondary mb-4">{filtered.length} template{filtered.length !== 1 ? "s" : ""}</p>

      {/* Template cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 bg-tv-brand-tint rounded-full flex items-center justify-center mb-3">
            <Mail size={22} className="text-tv-text-decorative" />
          </div>
          <p className="text-[14px] font-semibold text-tv-text-primary mb-1">No templates found</p>
          <p className="text-[12px] text-tv-text-secondary">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(tpl => (
            <div
              role="button"
              tabIndex={0}
              key={tpl.id}
              onClick={() => setPreviewId(tpl.id)}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setPreviewId(tpl.id); }}}
              aria-label={`Preview: ${tpl.name}`}
              className="bg-white rounded-xl border border-tv-border-light overflow-hidden hover:shadow-md hover:border-tv-border-strong transition-all group cursor-pointer text-left"
            >
              {/* Color bar */}
              <div className={`h-1.5 w-full ${tpl.channel === "sms" ? "bg-tv-record-bg" : "bg-tv-brand-bg"}`} />

              <div className="p-4">
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 ${tpl.channel === "sms" ? "bg-tv-info-bg" : "bg-tv-brand-tint"}`}>
                      {tpl.channel === "sms" ? <MessageSquare size={14} className="text-tv-info" /> : <Mail size={14} className="text-tv-brand" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-tv-text-primary truncate">{tpl.name}</p>
                      <p className="text-[10px] text-tv-text-secondary">{tpl.channel.toUpperCase()} · {tpl.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); toggleStar(tpl.id); }} aria-label={tpl.starred ? "Unstar" : "Star"} className="p-1 bg-tv-surface rounded-full hover:bg-tv-surface-hover transition-colors">
                      <Star size={13} className={tpl.starred ? "text-tv-star fill-tv-star" : "text-tv-text-decorative"} />
                    </button>
                    <div className="relative" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setMenuOpen(menuOpen === tpl.id ? null : tpl.id)} aria-label="More actions" aria-haspopup="menu" aria-expanded={menuOpen === tpl.id} className="p-1 rounded hover:bg-tv-surface transition-colors">
                        <MoreHorizontal size={14} className="text-tv-text-secondary" />
                      </button>
                      {menuOpen === tpl.id && (
                        <AssetActionMenu
                          width={180}
                          onClose={() => setMenuOpen(null)}
                          actions={[
                            { icon: <Eye size={12} />, label: "Preview", onClick: () => setPreviewId(tpl.id) },
                            { icon: <Edit2 size={12} />, label: "Edit Template", onClick: () => { navigate(`/template/create?channel=${tpl.channel}&edit=${tpl.id}`); setMenuOpen(null); } },
                            { icon: <Copy size={12} />, label: "Duplicate", onClick: () => handleDuplicate(tpl.id) },
                            { icon: <Trash2 size={12} />, label: "Delete", onClick: () => { setDeleteConfirm(tpl.id); setMenuOpen(null); }, danger: true },
                          ]}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Subject preview */}
                <div className="bg-tv-surface rounded-md px-3 py-2.5 mb-3">
                  <p className="text-[10px] text-tv-text-secondary uppercase tracking-wider mb-1">Subject</p>
                  <p className="text-[12px] text-tv-text-primary truncate">{tpl.subject}</p>
                </div>

                {/* Meta */}
                <div className="flex items-center justify-between text-[11px] text-tv-text-secondary">
                  <span>Updated {tpl.updated}</span>
                  <span>Used in {tpl.used} campaign{tpl.used !== 1 ? "s" : ""}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setPreviewId(null)} />
          <div className="fixed inset-0 flex items-center justify-center z-[61] pointer-events-none p-4" role="dialog" aria-modal="true" aria-label={`Preview: ${preview.name}`} onKeyDown={(e) => { if (e.key === "Escape") setPreviewId(null); }}>
            <FocusTrap active>
            <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl pointer-events-auto overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-tv-border-divider">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${preview.channel === "sms" ? "bg-tv-info-bg" : "bg-tv-brand-tint"}`}>
                    {preview.channel === "sms" ? <MessageSquare size={14} className="text-tv-info" /> : <Mail size={14} className="text-tv-brand" />}
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-tv-text-primary">{preview.name}</p>
                    <p className="text-[11px] text-tv-text-secondary">{preview.channel.toUpperCase()} Template · {preview.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => toggleStar(preview.id)} aria-label={preview.starred ? "Unstar" : "Star"} className="w-7 h-7 rounded-full bg-tv-surface flex items-center justify-center hover:bg-tv-surface-hover transition-colors">
                    <Star size={13} className={preview.starred ? "text-tv-star fill-tv-star" : "text-tv-text-secondary"} />
                  </button>
                  <div className="relative">
                    <button onClick={() => setModalMenuOpen(!modalMenuOpen)} aria-label="More actions" aria-haspopup="menu" aria-expanded={modalMenuOpen} className="w-7 h-7 rounded-full bg-tv-surface flex items-center justify-center text-tv-text-secondary hover:bg-tv-surface-hover transition-colors">
                      <MoreHorizontal size={13} />
                    </button>
                    {modalMenuOpen && (
                      <AssetActionMenu
                        width={180}
                        zIndex={70}
                        onClose={() => setModalMenuOpen(false)}
                        actions={[
                          { icon: <Edit2 size={12} />, label: "Edit Template", onClick: () => { navigate(`/template/create?channel=${preview.channel}&edit=${preview.id}`); setModalMenuOpen(false); setPreviewId(null); } },
                          { icon: <Copy size={12} />, label: "Duplicate", onClick: () => { handleDuplicate(preview.id); setModalMenuOpen(false); } },
                          { icon: <Trash2 size={12} />, label: "Delete", onClick: () => { setDeleteConfirm(preview.id); setPreviewId(null); setModalMenuOpen(false); }, danger: true },
                        ]}
                      />
                    )}
                  </div>
                  <button onClick={() => { setPreviewId(null); setModalMenuOpen(false); }} aria-label="Close preview" className="w-7 h-7 rounded-full bg-tv-surface flex items-center justify-center text-tv-text-secondary hover:bg-tv-surface-hover"><X size={13} /></button>
                </div>
              </div>
              <div className="p-5">
                <div className="bg-tv-surface-muted rounded-lg border border-tv-border-light p-4 mb-4">
                  <p className="text-[10px] text-tv-text-secondary uppercase tracking-wider mb-1">Subject Line</p>
                  <p className="text-[14px] font-semibold text-tv-text-primary">{preview.subject}</p>
                </div>
                <div className="bg-tv-surface-muted rounded-lg border border-tv-border-light p-4 mb-4">
                  <p className="text-[10px] text-tv-text-secondary uppercase tracking-wider mb-2">Body Preview</p>
                  <div className="space-y-2">
                    <p className="text-[13px] text-tv-text-label">{`Dear {{first_name}},`}</p>
                    <p className="text-[13px] text-tv-text-label">I wanted to personally reach out and share a message that I recorded just for you. Your support means the world to our community at Hartwell University…</p>
                    <div className="h-24 bg-[#1a1a2e] rounded-md flex items-center justify-center mt-3">
                      <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center">
                        <div className="w-0 h-0 ml-0.5 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-white" />
                      </div>
                    </div>
                    <p className="text-[13px] text-tv-text-label mt-2">With gratitude,<br />Kelley Molt</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setPreviewId(null); navigate(`/template/create?channel=${preview.channel}&edit=${preview.id}`); }} className="flex-1 py-2.5 border border-tv-brand-bg text-tv-brand rounded-full text-[13px] font-semibold hover:bg-tv-brand-tint transition-colors flex items-center justify-center gap-2"><Eye size={12} />Edit Template</button>
                  <button onClick={() => { setPreviewId(null); show("Template saved — opening campaign builder…", "success"); setTimeout(() => navigate("/campaigns/create"), 1200); }} className="flex-1 py-2.5 bg-tv-brand-bg text-white rounded-full text-[13px] font-semibold hover:bg-tv-brand transition-colors flex items-center justify-center gap-2"><Send size={12} />Use in Campaign</button>
                </div>
              </div>
            </div>
            </FocusTrap>
          </div>
        </>
      )}

      {/* Delete confirmation */}
      {deleteConfirm !== null && (
        <DeleteModal
          title="Delete this template?"
          description="This action cannot be undone. Any campaigns using this template will not be affected."
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}