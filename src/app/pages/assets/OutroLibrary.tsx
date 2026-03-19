import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Plus, Search, Copy, Trash2, MoreHorizontal,
  Eye, Star, Send, Pencil, X, Play, MonitorPlay, Image as ImageIcon,
  Type, Clock, BookmarkPlus, ArrowUpDown, MousePointerClick,
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import { DeleteModal } from "../../components/ui/DeleteModal";
import { AssetActionMenu } from "../../components/ui/AssetActionMenu";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { FilterBar } from "../../components/FilterBar";
import type { FilterDef, FilterValues } from "../../components/FilterBar";
import { DATE_CREATED_FILTER, CREATED_BY_FILTER } from "../../components/filterDefs";
import { Menu, ActionIcon, Tooltip, Text } from "@mantine/core";
import { TV } from "../../theme";

// ── Data ────────────────────────────────────────────────────────────────────
interface Outro {
  id: number;
  name: string;
  outroTitle: string;
  attachedImage: string;
  gradient: string;
  duration: string;
  isTemplate: boolean;
  ctaEnabled: boolean;
  ctaLabel: string;
  updated: string;
  used: number;
  starred: boolean;
}

const OUTROS: Outro[] = [
  { id: 1, name: "Thank You — Purple CTA",         outroTitle: "Thank You for Watching",     attachedImage: "https://images.unsplash.com/photo-1553397279-5b10b6c39f1c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aGFuayUyMHlvdSUyMGhhbmR3cml0dGVuJTIwbm90ZSUyMGNhcmR8ZW58MXx8fHwxNzcyMDY3NjI0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", gradient: "from-[#7c45b0] to-[#995cd3]",   duration: "0:12", isTemplate: false, ctaEnabled: true,  ctaLabel: "Give Now",             updated: "Feb 22, 2026", used: 42, starred: true },
  { id: 2, name: "Hartwell Shield — Branded",       outroTitle: "Hartwell University",        attachedImage: "https://images.unsplash.com/photo-1607369542452-78f59815692d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwYWVyaWFsJTIwc3ByaW5nfGVufDF8fHx8MTc3MjA2NzYyMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",            gradient: "from-[#1B3461] to-[#2a5298]",   duration: "0:10", isTemplate: false, ctaEnabled: true,  ctaLabel: "Visit Our Website",    updated: "Feb 18, 2026", used: 28, starred: true },
  { id: 3, name: "Scholarship Impact End",          outroTitle: "Your Gift Changes Lives",    attachedImage: "https://images.unsplash.com/photo-1655720359248-eeace8c709c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb25hdGlvbiUyMGNoYXJpdHklMjBnaXZpbmclMjBoYW5kc3xlbnwxfHx8fDE3NzE5ODM4MDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",     gradient: "from-[#0090bb] to-[#00C0F5]",   duration: "0:15", isTemplate: false, ctaEnabled: true,  ctaLabel: "Support Scholarships", updated: "Feb 14, 2026", used: 9,  starred: false },
  { id: 4, name: "Give Now — Green CTA",            outroTitle: "Make a Difference Today",    attachedImage: "",                                                                                                                                                                                                                                                                                                                     gradient: "from-[#0e8a45] to-[#16b364]",   duration: "0:10", isTemplate: false, ctaEnabled: true,  ctaLabel: "Give Now",             updated: "Feb 10, 2026", used: 15, starred: false },
  { id: 5, name: "General Thank You — Minimal",     outroTitle: "Thank You",                  attachedImage: "",                                                                                                                                                                                                                                                                                                                     gradient: "from-[#374151] to-[#6b7280]",   duration: "0:08", isTemplate: false, ctaEnabled: false, ctaLabel: "",                     updated: "Jan 28, 2026", used: 35, starred: true },
  { id: 6, name: "Holiday Outro — Festive",         outroTitle: "Happy Holidays from Hartwell", attachedImage: "https://images.unsplash.com/photo-1766820875917-3a8a9d6a5905?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob2xpZGF5JTIwd2ludGVyJTIwbGlnaHRzJTIwZmVzdGl2ZXxlbnwxfHx8fDE3NzIwNjc2MjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", gradient: "from-[#c41e3a] to-[#e84c5d]",   duration: "0:08", isTemplate: false, ctaEnabled: false, ctaLabel: "",                     updated: "Dec 10, 2025", used: 22, starred: false },
  { id: 7, name: "Blank Outro Template",            outroTitle: "[Your Title]",               attachedImage: "",                                                                                                                                                                                                                                                                                                                     gradient: "from-[#7c45b0] to-[#a78bfa]",   duration: "0:10", isTemplate: true,  ctaEnabled: true,  ctaLabel: "[CTA Label]",          updated: "Jan 1, 2026",  used: 0,  starred: false },
  { id: 8, name: "CTA-Free Template",               outroTitle: "[Your Title]",               attachedImage: "",                                                                                                                                                                                                                                                                                                                     gradient: "from-[#374151] to-[#9ca3af]",   duration: "0:08", isTemplate: true,  ctaEnabled: false, ctaLabel: "",                     updated: "Jan 1, 2026",  used: 0,  starred: false },
];

const OUTRO_FILTERS: FilterDef[] = [
  {
    key: "status", label: "Status", icon: BookmarkPlus, group: "Status",
    type: "select", essential: true,
    options: [
      { value: "template", label: "Templates" },
      { value: "custom", label: "Custom" },
    ],
  },
  {
    key: "cta", label: "CTA", icon: MousePointerClick, group: "CTA",
    type: "select", essential: true,
    options: [
      { value: "enabled", label: "CTA Enabled" },
      { value: "disabled", label: "No CTA" },
    ],
  },
  DATE_CREATED_FILTER,
  CREATED_BY_FILTER,
];

// ═════════════════════════════════════════════════════════════════════════════
export function OutroLibrary() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [activeFilterKeys, setActiveFilterKeys] = useState<string[]>(
    OUTRO_FILTERS.filter(f => f.essential).map(f => f.key)
  );
  const [sortBy, setSortBy] = useState<"recent" | "name" | "used">("recent");
  const [outros, setOutros] = useState(OUTROS);
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [modalMenuOpen, setModalMenuOpen] = useState(false);

  const filtered = outros.filter(o => {
    if (search && !o.name.toLowerCase().includes(search.toLowerCase()) && !o.outroTitle.toLowerCase().includes(search.toLowerCase())) return false;
    const statusVals = filterValues.status ?? [];
    if (statusVals.length > 0) {
      if (statusVals.includes("template") && !o.isTemplate) return false;
      if (statusVals.includes("custom") && o.isTemplate) return false;
    }
    const ctaVals = filterValues.cta ?? [];
    if (ctaVals.length > 0) {
      if (ctaVals.includes("enabled") && !o.ctaEnabled) return false;
      if (ctaVals.includes("disabled") && o.ctaEnabled) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "used") return b.used - a.used;
    return 0;
  });

  const handleDuplicate = (id: number) => {
    const outro = outros.find(o => o.id === id);
    if (!outro) return;
    const copy = { ...outro, id: Date.now(), name: `${outro.name} (Duplicate)`, used: 0, starred: false, isTemplate: false };
    setOutros(prev => [copy, ...prev]);
    show(`"${outro.name}" duplicated`, "success");
    setMenuOpen(null);
  };

  const handleDelete = (id: number) => {
    const outro = outros.find(o => o.id === id);
    setOutros(prev => prev.filter(o => o.id !== id));
    show(`"${outro?.name}" deleted`, "success");
    setDeleteConfirm(null);
  };

  const toggleStar = (id: number) => {
    setOutros(prev => prev.map(o => o.id === id ? { ...o, starred: !o.starred } : o));
  };

  const toggleTemplate = (id: number) => {
    const outro = outros.find(o => o.id === id);
    if (!outro) return;
    setOutros(prev => prev.map(o => o.id === id ? { ...o, isTemplate: !o.isTemplate } : o));
    show(outro.isTemplate ? `"${outro.name}" removed from templates` : `"${outro.name}" promoted to template`, "success");
    setMenuOpen(null);
  };

  const preview = previewId ? outros.find(o => o.id === previewId) : null;

  return (
    <div className="p-4 md:p-8 pt-0 min-h-full">
      {/* Breadcrumb */}
      <div className="sticky top-0 z-10 bg-tv-surface-muted pt-4 md:pt-6 pb-3 -mx-4 md:-mx-8 px-4 md:px-8 mb-2">
        <Breadcrumbs items={[
          { label: "Home", href: "/" },
          { label: "Assets", href: "/assets" },
          { label: "Outros & Outro Templates" },
        ]} />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[22px] sm:text-[24px] font-black text-tv-text-primary">Outros & Outro Templates</h1>
          <p className="text-[13px] text-tv-text-secondary mt-1">Manage static outro screens with background colors, CTA buttons, music, and optional logos for your campaign videos.</p>
        </div>
        <button
          onClick={() => navigate("/outro/create")}
          className="flex items-center gap-2 bg-tv-brand-bg text-white px-5 py-2.5 rounded-full text-[13px] font-semibold hover:bg-tv-brand transition-colors shrink-0"
        >
          <Plus size={15} />New Outro
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6">
        <FilterBar
          filters={OUTRO_FILTERS}
          activeFilterKeys={activeFilterKeys}
          filterValues={filterValues}
          onFilterValuesChange={setFilterValues}
          onActiveFilterKeysChange={setActiveFilterKeys}
          sortButton={
            <Menu position="bottom-end">
              <Menu.Target>
                <Tooltip label="Sort" withArrow position="bottom" openDelay={300}>
                  <ActionIcon variant="subtle" size="lg" radius="xl" aria-label="Sort outros" style={{ color: TV.brand }}>
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search outros..." aria-label="Search outros" className="bg-transparent text-[13px] text-tv-text-primary outline-none w-full placeholder:text-tv-text-secondary focus-visible:outline-none" />
          {search && (
            <button onClick={() => setSearch("")} aria-label="Clear search" className="text-tv-text-secondary hover:text-tv-text-label"><X size={12} /></button>
          )}
        </div>
      </div>

      <p role="status" aria-live="polite" className="text-[12px] text-tv-text-secondary mb-4">{filtered.length} outro{filtered.length !== 1 ? "s" : ""}</p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 bg-tv-brand-tint rounded-full flex items-center justify-center mb-3">
            <MonitorPlay size={22} className="text-tv-text-decorative" />
          </div>
          <p className="text-[14px] font-semibold text-tv-text-primary mb-1">No outros found</p>
          <p className="text-[12px] text-tv-text-secondary">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(outro => (
            <div key={outro.id} role="button" tabIndex={0} onClick={() => setPreviewId(outro.id)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setPreviewId(outro.id); }}} aria-label={`Preview: ${outro.name}`} className="bg-white rounded-xl border border-tv-border-light overflow-hidden hover:shadow-md hover:border-tv-border-strong transition-all group cursor-pointer">
              {/* Thumbnail */}
              <div className={`h-32 bg-gradient-to-br ${outro.gradient} relative overflow-hidden`}>
                {outro.attachedImage ? (
                  <ImageWithFallback src={outro.attachedImage} alt={outro.name} className="w-full h-full object-cover opacity-50" />
                ) : null}
                {/* Outro title overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                  <p className="text-[14px] font-black text-white drop-shadow-lg leading-tight mb-2">{outro.outroTitle}</p>
                  {outro.ctaEnabled && outro.ctaLabel && (
                    <span className="inline-block bg-white/90 text-[10px] font-bold px-3 py-1 rounded-full text-tv-text-primary">
                      {outro.ctaLabel}
                    </span>
                  )}
                </div>
                {/* Play hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center">
                    <Play size={14} className="text-white ml-0.5" fill="white" />
                  </div>
                </div>
                {/* Duration */}
                <span className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">{outro.duration}</span>
                {/* Template badge */}
                {outro.isTemplate && (
                  <span className="absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-tv-brand-tint text-tv-text-brand">
                    Template
                  </span>
                )}
                {/* Star */}
                <button onClick={(e) => { e.stopPropagation(); toggleStar(outro.id); }} aria-label={outro.starred ? "Unstar" : "Star"} className="absolute top-2 right-2 z-10 p-1 bg-black/30 rounded-full hover:bg-black/50 transition-colors">
                  <Star size={13} className={outro.starred ? "text-tv-star fill-tv-star" : "text-white/70"} />
                </button>
              </div>

              <div className="p-3.5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-tv-text-primary truncate">{outro.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="inline-flex items-center gap-1 whitespace-nowrap text-[10px] text-tv-text-secondary">
                        <ImageIcon size={9} />{outro.attachedImage ? "Custom image" : "No image"}
                      </span>
                      {outro.ctaEnabled && (
                        <span className="inline-flex items-center gap-1 whitespace-nowrap text-[10px] text-tv-text-brand">
                          CTA
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setMenuOpen(menuOpen === outro.id ? null : outro.id)} aria-label="More actions" className="p-1 rounded hover:bg-tv-surface transition-colors">
                      <MoreHorizontal size={13} className="text-tv-text-secondary" />
                    </button>
                    {menuOpen === outro.id && (
                        <AssetActionMenu
                          onClose={() => setMenuOpen(null)}
                          actions={[
                            { icon: <Eye size={12} />, label: "Preview", onClick: () => { setPreviewId(outro.id); setMenuOpen(null); } },
                            { icon: <Pencil size={12} />, label: "Edit", onClick: () => { navigate(`/outro/create?edit=${outro.id}`); setMenuOpen(null); } },
                            { icon: <Copy size={12} />, label: "Duplicate", onClick: () => handleDuplicate(outro.id) },
                            { icon: <BookmarkPlus size={12} />, label: outro.isTemplate ? "Remove Template Status" : "Promote to Template", onClick: () => toggleTemplate(outro.id) },
                            { icon: <Trash2 size={12} />, label: "Delete", onClick: () => { setDeleteConfirm(outro.id); setMenuOpen(null); }, danger: true },
                          ]}
                        />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-tv-text-secondary">
                  <span>{outro.updated}</span>
                  <span>Used {outro.used}x</span>
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
          <div className="fixed inset-0 flex items-center justify-center z-[61] pointer-events-none p-4">
            <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl pointer-events-auto overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-tv-border-divider">
                <div>
                  <p className="text-[14px] font-semibold text-tv-text-primary">{preview.name}</p>
                  <p className="text-[11px] text-tv-text-secondary">Outro &middot; {preview.duration}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => toggleStar(preview.id)} aria-label={preview.starred ? "Unstar" : "Star"} className="w-7 h-7 rounded-full bg-tv-surface flex items-center justify-center hover:bg-tv-surface-hover transition-colors">
                    <Star size={13} className={preview.starred ? "text-tv-star fill-tv-star" : "text-tv-text-secondary"} />
                  </button>
                  <div className="relative">
                    <button onClick={() => setModalMenuOpen(!modalMenuOpen)} aria-label="More actions" className="w-7 h-7 rounded-full bg-tv-surface flex items-center justify-center text-tv-text-secondary hover:bg-tv-surface-hover transition-colors">
                      <MoreHorizontal size={13} />
                    </button>
                    {modalMenuOpen && (
                      <AssetActionMenu
                        width={200}
                        zIndex={70}
                        onClose={() => setModalMenuOpen(false)}
                        actions={[
                          { icon: <Pencil size={12} />, label: "Edit", onClick: () => { navigate(`/outro/create?edit=${preview.id}`); setModalMenuOpen(false); } },
                          { icon: <Copy size={12} />, label: "Duplicate", onClick: () => { handleDuplicate(preview.id); setModalMenuOpen(false); } },
                          { icon: <BookmarkPlus size={12} />, label: preview.isTemplate ? "Remove Template Status" : "Promote to Template", onClick: () => { toggleTemplate(preview.id); setModalMenuOpen(false); } },
                          { icon: <Trash2 size={12} />, label: "Delete", onClick: () => { setDeleteConfirm(preview.id); setPreviewId(null); setModalMenuOpen(false); }, danger: true },
                        ]}
                      />
                    )}
                  </div>
                  <button onClick={() => { setPreviewId(null); setModalMenuOpen(false); }} aria-label="Close preview" className="w-7 h-7 rounded-full bg-tv-surface flex items-center justify-center text-tv-text-secondary hover:bg-tv-surface-hover"><X size={13} /></button>
                </div>
              </div>
              {/* Video preview */}
              <div className={`aspect-video bg-gradient-to-br ${preview.gradient} relative overflow-hidden`}>
                {preview.attachedImage ? (
                  <ImageWithFallback src={preview.attachedImage} alt={preview.name} className="w-full h-full object-cover opacity-50" />
                ) : null}
                <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                  <p className="text-[22px] font-black text-white drop-shadow-lg mb-3">{preview.outroTitle}</p>
                  {preview.ctaEnabled && preview.ctaLabel && (
                    <span className="inline-block bg-white/90 text-[12px] font-bold px-5 py-2 rounded-full text-tv-text-primary shadow-md">
                      {preview.ctaLabel}
                    </span>
                  )}
                  <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/60 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors mt-4">
                    <Play size={24} className="text-white ml-1" fill="white" />
                  </div>
                </div>
                <span className="absolute bottom-3 right-3 bg-black/50 text-white text-[11px] px-2 py-0.5 rounded font-mono">{preview.duration}</span>
              </div>
              {/* Details */}
              <div className="px-5 py-4 space-y-2 border-b border-tv-border-divider">
                <div className="flex items-center gap-4 text-[12px]">
                  <span className="flex items-center gap-1.5 text-tv-text-secondary"><Type size={11} />Title:</span>
                  <span className="font-medium text-tv-text-primary">{preview.outroTitle}</span>
                </div>
                <div className="flex items-center gap-4 text-[12px]">
                  <span className="flex items-center gap-1.5 text-tv-text-secondary"><ImageIcon size={11} />Image:</span>
                  <span className="font-medium text-tv-text-primary">{preview.attachedImage ? "Attached" : "None"}</span>
                </div>
                <div className="flex items-center gap-4 text-[12px]">
                  <span className="flex items-center gap-1.5 text-tv-text-secondary"><Clock size={11} />Duration:</span>
                  <span className="font-medium text-tv-text-primary">{preview.duration}</span>
                </div>
                <div className="flex items-center gap-4 text-[12px]">
                  <span className="flex items-center gap-1.5 text-tv-text-secondary">CTA:</span>
                  <span className="font-medium text-tv-text-primary">{preview.ctaEnabled ? preview.ctaLabel : "Disabled"}</span>
                </div>
                {preview.isTemplate && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-tv-brand-tint text-tv-text-brand">Template</span>
                )}
              </div>
              <div className="px-5 py-4">
                <button onClick={() => { setPreviewId(null); navigate("/campaigns/create"); }} className="w-full py-2.5 bg-tv-brand-bg text-white rounded-full text-[13px] font-semibold hover:bg-tv-brand transition-colors flex items-center justify-center gap-2"><Send size={12} />Use in Campaign</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete confirmation */}
      {deleteConfirm !== null && (
        <DeleteModal
          title="Delete this outro?"
          description="This action cannot be undone. Campaigns already using this outro will not be affected."
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}